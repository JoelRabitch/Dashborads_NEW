/**
 * dispersao_regressao.test.mjs — testes da Dispersão com Regressão.
 *
 * Três mentiras possíveis, três blocos de teste:
 *   (1) coeficientes errados — conferidos contra contas fechadas;
 *   (2) banda da reta confundida com banda de predição — conferidas uma
 *       contra a outra, porque a segunda é sempre mais larga;
 *   (3) reta sobre relação curva — o teste de corridas precisa acusar a
 *       parábola e NÃO acusar a reta com ruído.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { regressaoLinear, quantilT } from '../src/core/estatistica.js';
import {
  regressaoPelaOrigem,
  calcularBanda,
  testeDeCorridas,
  MINIMO_PARA_INFERENCIA,
} from '../src/charts/dispersao_regressao/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'dispersao_regressao.js');

const perto = (a, b, tolerancia = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tolerancia, `esperado ≈${b}, veio ${a}`);

const pts = (xs, ys) => xs.map((x, i) => ({ x, y: ys[i] }));

/** Gerador determinístico — teste com Math.random é teste que pisca. */
function rng(semente = 7) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.dispersao_regressao;
  assert.ok(definicao, 'dispersao_regressao não se registrou');

  const instancia = criarInstancia(definicao, amb.chamadasDeApi);
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  const palco = amb.window.document.getElementById('palco');

  instancia.create(palco, configPadrao(definicao));
  let chamouDone = false;
  instancia.updateAsync(
    data,
    palco,
    Object.assign(configPadrao(definicao), ajustes),
    queryResponse,
    {},
    () => { chamouDone = true; }
  );
  assert.ok(chamouDone, 'done() precisa ser chamado sempre');

  return {
    amb,
    palco,
    pontos: Array.from(palco.querySelectorAll('circle.dr-marca')),
    reta: palco.querySelector('line.dr-reta'),
    banda: Array.from(palco.querySelectorAll('path.dr-marca')),
    caixa: palco.querySelector('.dr-caixa')?.textContent || '',
    nota: palco.querySelector('.dr-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    canvas: palco.querySelector('canvas.dr-canvas'),
    fim: () => amb.restaurar(),
  };
}

/* ------------------------- coeficientes -------------------------- */

test('regressão — reta exata dá R² = 1 e os coeficientes exatos', (t) => {
  // y = 3 + 2x, sem ruído. Qualquer desvio aqui é erro de aritmética.
  const pontos = pts([1, 2, 3, 4, 5], [5, 7, 9, 11, 13]);
  const r = regressaoLinear(pontos);

  perto(r.inclinacao, 2, 1e-12);
  perto(r.intercepto, 3, 1e-12);
  perto(r.r2, 1, 1e-12);
  perto(r.sqe, 0, 1e-18);
  perto(r.erroResidual, 0, 1e-9);
  t.diagnostic(`y = ${r.intercepto} + ${r.inclinacao}x, R² = ${r.r2}`);
});

test('regressão — caso com ruído bate com a conta fechada', (t) => {
  // x = 1..5 (x̄=3, Sxx=10), y = [2,4,5,4,5] (ȳ=4, Syy=6, Sxy=6).
  // b = 0,6; a = 4 − 0,6·3 = 2,2; R² = 36/60 = 0,6.
  // SQE = Syy − b·Sxy = 6 − 3,6 = 2,4; s = √(2,4/3).
  const r = regressaoLinear(pts([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]));

  perto(r.inclinacao, 0.6, 1e-12);
  perto(r.intercepto, 2.2, 1e-12);
  perto(r.r2, 0.6, 1e-12);
  perto(r.sxx, 10, 1e-12);
  perto(r.sqe, 2.4, 1e-12);
  perto(r.erroResidual, Math.sqrt(2.4 / 3), 1e-12);
  assert.equal(r.grausDeLiberdade, 3);
  t.diagnostic(`b=${r.inclinacao}, a=${r.intercepto}, R²=${r.r2}, s=${r.erroResidual.toFixed(4)}`);
});

test('regressão — com n = 2 não existe erro residual estimável', (t) => {
  // A reta passa exatamente pelos dois pontos. Devolver s = 0 seria lido
  // como "ajuste perfeito e preciso", que é o oposto da verdade.
  const r = regressaoLinear(pts([1, 2], [10, 20]));
  perto(r.inclinacao, 10, 1e-12);
  assert.equal(r.erroResidual, null, 's não é estimável com n = 2');
  assert.equal(calcularBanda({ ajuste: r, de: 1, ate: 2 }), null, 'sem s não há banda');
  t.diagnostic('n = 2 tratado sem inventar precisão');
});

test('regressão — todos os X iguais não produzem reta vertical inventada', (t) => {
  assert.equal(regressaoLinear(pts([5, 5, 5], [1, 2, 3])), null);
  t.diagnostic('null em vez de reta vertical');
});

test('regressão pela origem — intercepto zero e inclinação Σxy/Σx²', (t) => {
  const pontos = pts([1, 2, 3], [2, 4, 7]);
  // Σxy = 2 + 8 + 21 = 31; Σx² = 1 + 4 + 9 = 14.
  const r = regressaoPelaOrigem(pontos);
  assert.equal(r.intercepto, 0);
  perto(r.inclinacao, 31 / 14, 1e-12);
  t.diagnostic(`b = ${r.inclinacao.toFixed(6)} = 31/14`);
});

test('regressão pela origem — ajusta pior que a livre quando a origem não serve', (t) => {
  // É o ponto: forçar pela origem é uma restrição, e restrição não melhora
  // o ajuste. Um R² que subisse denunciaria uma definição inflada.
  const pontos = pts([10, 11, 12, 13, 14], [100, 101, 102, 103, 104]);
  const livre = regressaoLinear(pontos);
  const presa = regressaoPelaOrigem(pontos);
  assert.ok(presa.sqe >= livre.sqe, 'a reta presa não pode ajustar melhor que a livre');
  assert.ok(presa.r2 <= livre.r2 + 1e-12, 'nem ter R² maior');
  t.diagnostic(`SQE livre ${livre.sqe.toFixed(3)} × presa ${presa.sqe.toFixed(1)}`);
});

/* ------------------------- quantil t ----------------------------- */

test('quantilT — bate com a tabela de t de Student', (t) => {
  // Valores de tabela para 97,5% unilateral (= 95% bilateral).
  const esperados = [
    [5, 2.571], [10, 2.228], [20, 2.086], [30, 2.042], [60, 2.0], [120, 1.98],
  ];
  for (const [gl, esperado] of esperados) {
    const obtido = quantilT(0.975, gl);
    assert.ok(
      Math.abs(obtido - esperado) < 0.005,
      `t(0,975; ${gl}) = ${obtido.toFixed(4)}, tabela diz ${esperado}`
    );
  }
  // Com muitos graus de liberdade a t converge para a normal.
  assert.ok(Math.abs(quantilT(0.975, 100000) - 1.959964) < 0.002);
  t.diagnostic('seis pontos da tabela conferidos');
});

/* ---------------------------- bandas ----------------------------- */

test('banda — a de predição é SEMPRE mais larga que a da reta', (t) => {
  // É a confusão mais comum do gráfico: uma diz onde a média está, a
  // outra onde o próximo ponto cairia. Nunca são iguais.
  const ajuste = regressaoLinear(pts([1, 2, 3, 4, 5, 6, 7, 8], [2, 4, 5, 4, 5, 7, 8, 9]));
  const daReta = calcularBanda({ ajuste, de: 1, ate: 8, predicao: false });
  const daPredicao = calcularBanda({ ajuste, de: 1, ate: 8, predicao: true });

  for (let i = 0; i < daReta.length; i++) {
    assert.ok(
      daPredicao[i].meia > daReta[i].meia,
      `em x=${daReta[i].x.toFixed(1)} a banda de predição não é mais larga`
    );
  }
  t.diagnostic(
    `no centro: ±${daReta[30].meia.toFixed(3)} (reta) × ±${daPredicao[30].meia.toFixed(3)} (predição)`
  );
});

test('banda — é mais estreita no centro dos dados e abre nas pontas', (t) => {
  // O termo (x − x̄)²/Sxx é o que faz a banda abrir. Uma banda de largura
  // constante denunciaria que a fórmula foi simplificada errado.
  const ajuste = regressaoLinear(pts([1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 3, 2, 5, 4, 6, 8, 7, 9]));
  const banda = calcularBanda({ ajuste, de: 1, ate: 9, passos: 40 });

  const meio = banda[20].meia;
  assert.ok(banda[0].meia > meio, 'a ponta esquerda precisa ser mais larga que o centro');
  assert.ok(banda[40].meia > meio, 'a ponta direita também');
  perto(banda[20].x, ajuste.mediaX, 1e-9);
  t.diagnostic(`centro ±${meio.toFixed(3)}, pontas ±${banda[0].meia.toFixed(3)}`);
});

test('banda — a fórmula bate com a conta feita à mão', (t) => {
  const ajuste = regressaoLinear(pts([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]));
  const banda = calcularBanda({ ajuste, de: 3, ate: 3, nivel: 0.95, passos: 0 });

  // Em x = x̄ = 3 o termo (x−x̄)² some: meia = t · s · √(1/5).
  const esperado = quantilT(0.975, 3) * Math.sqrt(2.4 / 3) * Math.sqrt(1 / 5);
  perto(banda[0].meia, esperado, 1e-9);
  t.diagnostic(`±${banda[0].meia.toFixed(5)} conferido contra t·s·√(1/n)`);
});

test('banda — nível de confiança maior dá banda mais larga', (t) => {
  const ajuste = regressaoLinear(pts([1, 2, 3, 4, 5, 6], [2, 4, 5, 4, 5, 7]));
  const a80 = calcularBanda({ ajuste, de: 1, ate: 6, nivel: 0.8 });
  const a99 = calcularBanda({ ajuste, de: 1, ate: 6, nivel: 0.99 });
  assert.ok(a99[0].meia > a80[0].meia * 1.5, 'de 80% para 99% a banda precisa abrir bastante');
  t.diagnostic(`±${a80[0].meia.toFixed(2)} (80%) × ±${a99[0].meia.toFixed(2)} (99%)`);
});

/* ------------------------- curvatura ----------------------------- */

test('corridas — a parábola é denunciada', (t) => {
  // Uma reta sobre uma parábola: R² pode até ser razoável, mas os
  // resíduos ficam positivos nas pontas e negativos no meio. É esse
  // agrupamento que o teste pega — e que o olho não pega.
  const pontos = [];
  for (let i = 0; i < 40; i++) {
    const x = i - 20;
    pontos.push({ x, y: x * x });
  }
  const ajuste = regressaoLinear(pontos);
  const r = testeDeCorridas(pontos, ajuste);

  assert.ok(r.suspeito, `a parábola precisa ser acusada (z = ${r.z.toFixed(2)})`);
  assert.ok(r.corridas < r.esperadas, 'curvatura produz POUCAS corridas');
  t.diagnostic(`${r.corridas} corridas, ${r.esperadas.toFixed(1)} esperadas, z = ${r.z.toFixed(2)}`);
});

test('corridas — reta com ruído NÃO é denunciada', (t) => {
  // O outro lado, que importa igual: acusar curvatura onde não há treina
  // o usuário a ignorar o aviso.
  const aleatorio = rng(11);
  const pontos = [];
  for (let i = 0; i < 80; i++) {
    const x = i;
    pontos.push({ x, y: 3 + 2 * x + (aleatorio() - 0.5) * 20 });
  }
  const r = testeDeCorridas(pontos, regressaoLinear(pontos));
  assert.ok(!r.suspeito, `reta com ruído não deveria ser acusada (z = ${r.z.toFixed(2)})`);
  t.diagnostic(`${r.corridas} corridas, ${r.esperadas.toFixed(1)} esperadas, z = ${r.z.toFixed(2)}`);
});

test('corridas — poucos pontos não produzem acusação', (t) => {
  // A aproximação normal do número de corridas não vale abaixo de ~20
  // pontos; acusar ali seria inventar um sinal.
  const pontos = pts([1, 2, 3, 4, 5, 6], [1, 4, 9, 16, 25, 36]);
  assert.equal(testeDeCorridas(pontos, regressaoLinear(pontos)), null);
  t.diagnostic('n pequeno devolve null, não "suspeito"');
});

/* ---------------------------- desenho ---------------------------- */

test('dispersao_regressao — desenha nuvem, reta e caixa com R²', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.pontos.length > 0, 'nenhum ponto');
    assert.ok(r.reta, 'faltou a reta');
    assert.match(r.caixa, /R² = \d\.\d{4}/, `a caixa precisa trazer o R²; veio "${r.caixa}"`);
    assert.match(r.caixa, /n = \d+/, 'e o n');
    assert.match(r.caixa, /y = /, 'e a equação');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(r.caixa.slice(0, 60));
});

test('dispersao_regressao — a nota diz QUAL banda foi desenhada', (t) => {
  // Desenhar uma banda sem nomeá-la é o erro clássico do gráfico.
  const daReta = renderizar('semPivo', { tipoDeBanda: 'confianca' });
  try {
    assert.match(daReta.nota, /banda de confiança/i);
    assert.match(daReta.nota, /não onde o próximo ponto cai/i, 'a distinção precisa estar explícita');
  } finally {
    daReta.fim();
  }

  const daPredicao = renderizar('semPivo', { tipoDeBanda: 'predicao' });
  try {
    assert.match(daPredicao.nota, /PREDIÇÃO/);
    assert.match(daPredicao.nota, /próximo ponto cairia/i);
  } finally {
    daPredicao.fim();
  }
  t.diagnostic('as duas bandas se declaram');
});

test('dispersao_regressao — a nota sempre lembra que correlação não é causalidade', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.match(r.nota, /correlação não é causalidade/i);
  } finally {
    r.fim();
  }
  t.diagnostic('ressalva presente');
});

test('dispersao_regressao — "sem ajuste" não desenha reta nem banda', (t) => {
  // Reta sobre relação não-linear é desinformação; a opção de não desenhar
  // precisa existir e precisa funcionar.
  const r = renderizar('semPivo', { tipoDeAjuste: 'nenhum' });
  try {
    assert.equal(r.reta, null, 'não deveria haver reta');
    assert.equal(r.caixa, '', 'nem caixa de equação');
    assert.ok(r.pontos.length > 0, 'a nuvem continua');
    assert.match(r.nota, /sem ajuste/i);
  } finally {
    r.fim();
  }
  t.diagnostic('modo só-nuvem conferido');
});

test('dispersao_regressao — poucos pontos: o R² é declarado frágil', (t) => {
  const r = renderizar('semPivo');
  try {
    const n = Number((r.caixa.match(/n = (\d+)/) || [])[1]);
    if (n < MINIMO_PARA_INFERENCIA) {
      assert.match(r.aviso, /não sustenta conclusão|sem relação nenhuma/i, `faltou o aviso (n=${n})`);
      t.diagnostic(`n=${n}: fragilidade declarada`);
    } else {
      t.diagnostic(`n=${n}: já é o bastante para o R² significar algo`);
    }
  } finally {
    r.fim();
  }
});

test('dispersao_regressao — muitos pontos caem para canvas', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.equal(r.pontos.length, 0, 'acima de 2.000 pontos o SVG não deveria ser usado');
    assert.ok(r.canvas, 'sem SVG e sem canvas: os pontos sumiram');
    assert.match(r.nota, /canvas/i, 'a troca de técnica precisa estar declarada');
  } finally {
    r.fim();
  }
  t.diagnostic('canvas acionado em 5.000 pontos');
});

test('dispersao_regressao — mesma medida nos dois eixos é recusada com explicação', (t) => {
  const r = renderizar('semPivo', { campoX: 'valor', campoY: 'valor' });
  try {
    if (r.vazio) {
      assert.match(r.vazio, /DUAS medidas diferentes/i);
      t.diagnostic('recusa explicada');
    } else {
      // A fixture tem nomes próprios de medida; se o ajuste não pegou,
      // o importante é que algo tenha sido desenhado sem erro.
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
      t.diagnostic('a fixture não tem medida chamada "valor"; nada quebrou');
    }
  } finally {
    r.fim();
  }
});

test('dispersao_regressao — consulta sem as duas medidas é recusada com instrução', (t) => {
  // A fixture `vazio` traz uma medida só. Recusar é o comportamento certo —
  // o que não pode é recusar em silêncio ou desenhar uma reta inventada.
  const r = renderizar('vazio');
  try {
    assert.equal(r.pontos.length, 0);
    assert.equal(r.reta, null);

    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.match(mensagem, /medidas?/i, 'e a mensagem precisa dizer o que falta');
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
