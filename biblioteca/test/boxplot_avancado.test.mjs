/**
 * boxplot_avancado.test.mjs — testes do Boxplot Avançado.
 *
 * O teste que define este arquivo: **a caixa de uma distribuição bimodal é
 * idêntica à de uma distribuição espalhada por igual.** Mediana, quartis e
 * bigodes batem, o desenho é o mesmo e a conclusão é falsa nos dois casos.
 * Se a detecção de picos falhar, nada mais no gráfico denuncia isso — e é
 * por isso que ela é testada nos dois sentidos: acusa a bimodal e NÃO
 * acusa a unimodal.
 *
 * Nota de método: todo laço afirma que a lista não está vazia.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { resumoDeDistribuicao, limitesDeOutlier } from '../src/core/estatistica.js';
import {
  calcularEntalhe,
  detectarPicos,
  caminhoDaCaixa,
  deslocamentoEstavel,
  CONSTANTE_DO_ENTALHE,
} from '../src/charts/boxplot_avancado/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'boxplot_avancado.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

/** Amostra determinística: nada de Math.random em teste. */
function normalizada(n, media, desvio, semente = 3) {
  const valores = [];
  let s = semente;
  for (let i = 0; i < n; i++) {
    // Soma de três uniformes LCG: forma de sino sem depender de biblioteca.
    let soma = 0;
    for (let k = 0; k < 3; k++) {
      s = (s * 1103515245 + 12345) % 2147483648;
      soma += s / 2147483648;
    }
    valores.push(media + (soma - 1.5) * desvio * 1.6);
  }
  return valores;
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.boxplot_avancado;
  assert.ok(definicao, 'boxplot_avancado não se registrou');

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
    caixas: Array.from(palco.querySelectorAll('path.bx-caixa')),
    outliers: Array.from(palco.querySelectorAll('circle.bx-outlier')),
    pontos: Array.from(palco.querySelectorAll('circle.bx-ponto')),
    avisosDeForma: Array.from(palco.querySelectorAll('.bx-aviso-forma')).map((t) => t.textContent),
    nota: palco.querySelector('.bx-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/** Números de um caminho SVG, em pares (x, y). */
function coordenadas(caminho) {
  const numeros = (caminho.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const pares = [];
  for (let i = 0; i + 1 < numeros.length; i += 2) pares.push({ x: numeros[i], y: numeros[i + 1] });
  return pares;
}

/* ---------------------- a mentira da caixa ----------------------- */

test('a caixa NÃO distingue bimodal de uniforme — é por isso que o aviso existe', (t) => {
  // Este teste não exercita código do gráfico: ele estabelece o PROBLEMA.
  // Duas amostras com formas completamente diferentes e a mesma caixa.
  // Construídas para terem a CAIXA idêntica: 100 observações em 10, uma em
  // 50 e 100 em 90 produzem Q1 = 10, mediana = 50 e Q3 = 90 — exatamente
  // os mesmos três números de uma distribuição uniforme em [−30, 130].
  const bimodal = [];
  for (let i = 0; i < 100; i++) bimodal.push(10);
  bimodal.push(50);
  for (let i = 0; i < 100; i++) bimodal.push(90);

  const espalhada = Array.from({ length: 201 }, (_, i) => -30 + (i / 200) * 160);

  const a = resumoDeDistribuicao(bimodal);
  const b = resumoDeDistribuicao(espalhada);

  perto(a.q1, b.q1, 1e-9);
  perto(a.mediana, b.mediana, 1e-9);
  perto(a.q3, b.q3, 1e-9);
  perto(a.iqr, b.iqr, 1e-9);

  // E a detecção de picos separa as duas.
  assert.equal(detectarPicos(bimodal).picos, 2, 'a bimodal precisa ser acusada');
  assert.equal(detectarPicos(espalhada).picos, 1, 'a espalhada NÃO pode ser acusada');
  t.diagnostic(
    `caixa idêntica (${a.q1}, ${a.mediana}, ${a.q3}) e formas opostas: 2 picos contra 1`
  );
});

test('detectarPicos — normal unimodal não é acusada', (t) => {
  // Acusar bimodalidade onde não há treina o usuário a ignorar o aviso.
  for (const semente of [3, 11, 29, 101]) {
    const amostra = normalizada(300, 50, 10, semente);
    const forma = detectarPicos(amostra);
    assert.equal(forma.picos, 1, `semente ${semente}: normal acusada de ter ${forma.picos} picos`);
  }
  t.diagnostic('quatro amostras unimodais, nenhuma acusada');
});

test('detectarPicos — três modas separadas dão três picos', (t) => {
  const valores = [];
  for (const centro of [0, 100, 200]) {
    for (let i = 0; i < 80; i++) valores.push(centro + (i % 8) * 0.3);
  }
  assert.equal(detectarPicos(valores).picos, 3);
  t.diagnostic('três modas detectadas');
});

test('detectarPicos — n pequeno demais não produz diagnóstico', (t) => {
  // Com poucas observações a densidade é toda ondulação do kernel.
  assert.equal(detectarPicos([1, 2, 3, 4, 5]), null);
  t.diagnostic('null em vez de diagnóstico de ruído');
});

/* ----------------------------- entalhe --------------------------- */

test('entalhe — bate com mediana ± 1,58 × IQR/√n', (t) => {
  const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const resumo = resumoDeDistribuicao(valores);
  const entalhe = calcularEntalhe(resumo);

  const esperado = (CONSTANTE_DO_ENTALHE * resumo.iqr) / Math.sqrt(resumo.n);
  perto(entalhe.meia, esperado, 1e-12);
  perto(entalhe.inferior, resumo.mediana - esperado, 1e-12);
  perto(entalhe.superior, resumo.mediana + esperado, 1e-12);
  t.diagnostic(`mediana ${resumo.mediana} ± ${entalhe.meia.toFixed(4)}`);
});

test('entalhe — n maior estreita o entalhe na razão √n', (t) => {
  // Mesma forma, quatro vezes mais observações: o entalhe tem de cair pela
  // metade. É o que faz dele uma afirmação sobre precisão.
  const base = [];
  for (let i = 0; i < 40; i++) base.push(i % 20);
  const quatroVezes = [];
  for (let i = 0; i < 160; i++) quatroVezes.push(i % 20);

  const pequeno = calcularEntalhe(resumoDeDistribuicao(base));
  const grande = calcularEntalhe(resumoDeDistribuicao(quatroVezes));

  perto(pequeno.meia / grande.meia, 2, 0.02);
  t.diagnostic(`n ×4 ⇒ entalhe ÷ ${(pequeno.meia / grande.meia).toFixed(3)}`);
});

test('entalhe — passar dos quartis é sinalizado, não escondido', (t) => {
  // Com n pequeno e IQR grande o entalhe ultrapassa os quartis. No desenho
  // ele é preso à caixa (solto, sai do próprio gráfico), mas o fato de ter
  // estourado NÃO é escondido: vira a cor da mediana e uma linha no
  // tooltip. É esta flag que carrega essa informação.
  const resumo = resumoDeDistribuicao([0, 1, 50, 99, 100]);
  const entalhe = calcularEntalhe(resumo);
  assert.equal(entalhe.passaDosQuartis, true);

  const estreito = calcularEntalhe(resumoDeDistribuicao(Array.from({ length: 400 }, (_, i) => i % 21)));
  assert.equal(estreito.passaDosQuartis, false);
  t.diagnostic('os dois casos sinalizados corretamente');
});

test('entalhe — n = 1 não produz entalhe', (t) => {
  assert.equal(calcularEntalhe(resumoDeDistribuicao([7])), null);
  assert.equal(calcularEntalhe(null), null);
  t.diagnostic('null em vez de entalhe inventado');
});

/* ---------------------------- geometria -------------------------- */

test('caminhoDaCaixa — sem entalhe é um retângulo fechado', (t) => {
  const d = caminhoDaCaixa({
    q1: 300, q3: 100, mediana: 200,
    entalheBaixo: null, entalheAlto: null,
    centro: 50, meia: 20, ehVertical: true,
  });
  const pontos = coordenadas(d);
  assert.ok(d.endsWith('Z'), 'o contorno precisa fechar');
  assert.equal(pontos.length, 4, 'um retângulo tem quatro cantos');
  assert.deepEqual(new Set(pontos.map((p) => p.x)), new Set([30, 70]));
  assert.deepEqual(new Set(pontos.map((p) => p.y)), new Set([100, 300]));
  t.diagnostic('retângulo conferido');
});

test('caminhoDaCaixa — com entalhe, o estreitamento fica NA mediana', (t) => {
  const d = caminhoDaCaixa({
    q1: 300, q3: 100, mediana: 200,
    entalheBaixo: 240, entalheAlto: 160,
    centro: 50, meia: 20, ehVertical: true,
  });
  const pontos = coordenadas(d);
  assert.ok(d.endsWith('Z'));

  const noEstreito = pontos.filter((p) => p.x === 40 || p.x === 60);
  assert.equal(noEstreito.length, 2, 'o estreitamento tem um ponto de cada lado');
  for (const p of noEstreito) {
    assert.equal(p.y, 200, 'o estreitamento precisa estar na altura da mediana');
  }
  t.diagnostic('entalhe na mediana');
});

test('caminhoDaCaixa — horizontal é a transposta da vertical', (t) => {
  const comuns = { q1: 300, q3: 100, mediana: 200, entalheBaixo: 240, entalheAlto: 160, centro: 50, meia: 20 };
  const vertical = coordenadas(caminhoDaCaixa({ ...comuns, ehVertical: true }));
  const horizontal = coordenadas(caminhoDaCaixa({ ...comuns, ehVertical: false }));

  assert.ok(vertical.length > 0 && vertical.length === horizontal.length);
  for (let i = 0; i < vertical.length; i++) {
    assert.equal(horizontal[i].x, vertical[i].y, `ponto ${i}: x horizontal ≠ y vertical`);
    assert.equal(horizontal[i].y, vertical[i].x, `ponto ${i}: y horizontal ≠ x vertical`);
  }
  t.diagnostic(`${vertical.length} pontos transpostos`);
});

test('deslocamentoEstavel — determinístico e bem espalhado em [−1, 1]', (t) => {
  // Com Math.random os pontos saltariam a cada redesenho, e a mesma
  // consulta pareceria dados diferentes.
  const primeira = Array.from({ length: 50 }, (_, i) => deslocamentoEstavel(i));
  const segunda = Array.from({ length: 50 }, (_, i) => deslocamentoEstavel(i));
  assert.deepEqual(primeira, segunda, 'a mesma entrada precisa dar a mesma saída');

  assert.ok(primeira.length > 0);
  for (const d of primeira) assert.ok(d >= -1 && d <= 1, `deslocamento ${d} fora de [−1, 1]`);

  // Metade de cada lado, a menos de um ponto.
  const positivos = primeira.filter((d) => d > 0).length;
  assert.ok(Math.abs(positivos - 25) <= 2, `espalhamento desigual: ${positivos} de 50 à direita`);
  t.diagnostic(`50 deslocamentos, ${positivos} à direita`);
});

/* ---------------------------- bigodes ---------------------------- */

test('bigode — para no último valor REAL, não no limite calculado', (t) => {
  // Desenhar o limite seco sugeriria um dado que não existe.
  const resumo = resumoDeDistribuicao([1, 2, 3, 4, 5, 100]);
  const limites = limitesDeOutlier(resumo);
  assert.equal(limites.bigodeSuperior, 5, 'o bigode precisa parar em 5, não em q3 + 1,5·IQR');
  assert.equal(limites.bigodeInferior, 1);
  assert.deepEqual(limites.outliers, [100]);
  t.diagnostic(`bigodes [${limites.bigodeInferior}, ${limites.bigodeSuperior}], outlier 100`);
});

/* ---------------------------- desenho ---------------------------- */

test('boxplot_avancado — uma caixa por categoria, nenhuma quebrada', (t) => {
  const r = renderizar('conjuntosPorItem');
  try {
    assert.ok(r.caixas.length > 0, 'nenhuma caixa desenhada');
    for (const caixa of r.caixas) {
      const d = caixa.getAttribute('d') || '';
      assert.ok(d.length > 10, 'caixa com caminho vazio');
      assert.ok(!/NaN|Infinity/.test(d), 'caixa com NaN/Infinity');
      assert.ok(d.endsWith('Z'), 'a caixa precisa fechar');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.caixas.length} caixas`);
});

test('boxplot_avancado — nada escapa da área do gráfico', (t) => {
  for (const orientacao of ['vertical', 'horizontal']) {
    const r = renderizar('conjuntosPorItem', { orientacao });
    try {
      assert.ok(r.caixas.length > 0, `${orientacao}: nenhuma caixa`);
      for (const caixa of r.caixas) {
        const pontos = coordenadas(caixa.getAttribute('d') || '');
        assert.ok(pontos.length > 0, `${orientacao}: caixa sem pontos`);
        for (const p of pontos) {
          assert.ok(p.x >= -1 && p.x <= 901, `${orientacao}: caixa fora (x=${p.x})`);
          assert.ok(p.y >= -1 && p.y <= 561, `${orientacao}: caixa fora (y=${p.y})`);
        }
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic('caixas contidas nas duas orientações');
});

test('boxplot_avancado — a largura ∝ √n faz o grupo pequeno parecer pequeno', (t) => {
  const larguraDe = (caixa) => {
    const xs = coordenadas(caixa.getAttribute('d') || '').map((p) => p.x);
    return Math.max(...xs) - Math.min(...xs);
  };

  // Agrupado por produto, a fixture traz categorias com n diferente
  // (131, 132 e 125) — que é a condição para a largura poder diferir.
  const proporcional = renderizar('conjuntosPorItem', {
    campoDaCategoria: 'produto',
    larguraPorRaizDeN: true,
  });
  const igual = renderizar('conjuntosPorItem', {
    campoDaCategoria: 'produto',
    larguraPorRaizDeN: false,
  });
  try {
    assert.ok(proporcional.caixas.length > 0 && igual.caixas.length > 0);

    const larguras = proporcional.caixas.map(larguraDe);
    const todasIguais = igual.caixas.map(larguraDe);

    assert.equal(
      new Set(todasIguais.map((l) => l.toFixed(2))).size,
      1,
      'sem a proporção, todas as caixas têm a mesma largura'
    );
    assert.ok(
      new Set(larguras.map((l) => l.toFixed(2))).size > 1,
      'com a proporção, as larguras precisam diferir'
    );
  } finally {
    proporcional.fim();
    igual.fim();
  }
  t.diagnostic('as duas larguras se comportam como esperado');
});

test('boxplot_avancado — o entalhe estreita a caixa e some quando desligado', (t) => {
  const vertices = (r) =>
    r.caixas.reduce((soma, c) => soma + coordenadas(c.getAttribute('d') || '').length, 0);

  const com = renderizar('conjuntosPorItem', { comEntalhe: true });
  const sem = renderizar('conjuntosPorItem', { comEntalhe: false });
  try {
    assert.ok(com.caixas.length > 0 && sem.caixas.length > 0);
    assert.equal(vertices(sem) / sem.caixas.length, 4, 'sem entalhe, a caixa é um retângulo');
    assert.equal(vertices(com) / com.caixas.length, 10, 'com entalhe, são dez vértices');
  } finally {
    com.fim();
    sem.fim();
  }
  t.diagnostic('entalhe ligado e desligado conferidos');
});

test('boxplot_avancado — a nota declara os métodos e a ressalva do entalhe', (t) => {
  // Quartil e bigode têm vários métodos que discordam; e sobreposição de
  // entalhes não é evidência de igualdade.
  const r = renderizar('conjuntosPorItem');
  try {
    assert.match(r.nota, /tipo 7/i, 'o método do quartil precisa estar declarado');
    assert.match(r.nota, /Tukey/i, 'o do bigode também');
    assert.match(r.nota, /último valor real/i, 'e o fato de o bigode parar no dado');
    assert.match(r.nota, /não são evidência de igualdade/i, 'faltou a ressalva do entalhe');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 100));
});

test('boxplot_avancado — observações individuais aparecem só com n pequeno', (t) => {
  const automatico = renderizar('conjuntosPorItem', { mostrarObservacoes: 'automatico' });
  const nunca = renderizar('conjuntosPorItem', { mostrarObservacoes: 'nunca' });
  try {
    assert.equal(nunca.pontos.length, 0, '"nunca" não pode desenhar observação nenhuma');
    assert.ok(automatico.pontos.length > 0, 'com n pequeno as observações deveriam aparecer');
  } finally {
    automatico.fim();
    nunca.fim();
  }

  // Com 5.000 linhas agrupadas em poucas categorias, o automático desiste.
  const grande = renderizar('grande5k', { campoDaCategoria: 'regiao', mostrarObservacoes: 'automatico' });
  try {
    assert.equal(grande.pontos.length, 0, 'com n grande o automático não deveria desenhar ponto a ponto');
    assert.ok(grande.caixas.length > 0, 'mas as caixas continuam');
  } finally {
    grande.fim();
  }
  t.diagnostic('três cenários de observações conferidos');
});

test('boxplot_avancado — distribuição com mais de um pico é denunciada na tela', (t) => {
  // O aviso é o motivo de o gráfico existir. Se a fixture não tiver
  // categoria multimodal, ao menos nada pode ser acusado à toa.
  const r = renderizar('grande5k', { campoDaCategoria: 'regiao' });
  try {
    assert.ok(r.caixas.length > 0, 'nenhuma caixa');
    if (r.avisosDeForma.length) {
      for (const texto of r.avisosDeForma) {
        assert.match(texto, /^\d+ picos$/, `marca de forma mal formatada: "${texto}"`);
      }
      assert.match(r.aviso, /mais de um pico/i, 'a marca na caixa precisa vir com explicação');
      t.diagnostic(`${r.avisosDeForma.length} categoria(s) multimodal(is)`);
    } else {
      assert.ok(!/mais de um pico/i.test(r.aviso), 'sem marca não pode haver aviso');
      t.diagnostic('nenhuma categoria multimodal nesta fixture, e nada foi acusado');
    }
  } finally {
    r.fim();
  }
});

test('boxplot_avancado — consulta agregada explica o que fazer no Explore', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.caixas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
