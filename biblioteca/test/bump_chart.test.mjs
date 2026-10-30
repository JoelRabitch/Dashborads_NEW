/**
 * bump_chart.test.mjs — testes do Bump Chart.
 *
 * O ranking é uma estrutura com regras duras: em cada período as posições
 * precisam ser uma PERMUTAÇÃO de 1..n — sem buraco, sem repetição e sem
 * número maior que o total. Qualquer violação produz um desenho ainda
 * bonito e um ranking falso.
 *
 * E duas decisões próprias deste gráfico, as duas testadas:
 * empate desempata pelo NOME (senão o ranking treme entre renderizações
 * da mesma consulta), e período sem valor não recebe posição (a linha
 * corta em vez de inventar uma queda).
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
import { calcularPosicoes } from '../src/charts/bump_chart/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'bump_chart.js');

const serie = (rotulo, valores) => ({ rotulo, chave: rotulo, valores });

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.bump_chart;
  assert.ok(definicao, 'bump_chart não se registrou');

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
    linhas: Array.from(palco.querySelectorAll('path.bp-linha')),
    pontos: Array.from(palco.querySelectorAll('.bl-marcador.bp-ponto')),
    rotulos: Array.from(palco.querySelectorAll('.bp-rotulo')).map((t) => t.textContent),
    periodos: Array.from(palco.querySelectorAll('.bp-periodo')).map((t) => t.textContent),
    nota: palco.querySelector('.bl-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ---------------------------- posições --------------------------- */

test('calcularPosicoes — cada período é uma permutação de 1..n', (t) => {
  // A regra estrutural do ranking. Uma repetição ou um buraco produz um
  // desenho plausível e um ranking falso.
  const series = [
    serie('a', [10, 5, 30]),
    serie('b', [20, 25, 10]),
    serie('c', [30, 15, 20]),
  ];
  const { posicoes, maiorPosicao } = calcularPosicoes({
    series,
    quantidadeDePeriodos: 3,
    maiorEhMelhor: true,
  });

  assert.equal(maiorPosicao, 3);
  for (let periodo = 0; periodo < 3; periodo++) {
    const doPeriodo = posicoes.map((p) => p[periodo]).sort((x, y) => x - y);
    assert.deepEqual(doPeriodo, [1, 2, 3], `período ${periodo} não é uma permutação`);
  }

  // E as posições são as certas: no período 0, c(30) > b(20) > a(10).
  assert.equal(posicoes[2][0], 1, 'c tem o maior valor no período 0');
  assert.equal(posicoes[1][0], 2);
  assert.equal(posicoes[0][0], 3);
  t.diagnostic(`posições por série: ${posicoes.map((p) => p.join('-')).join(' | ')}`);
});

test('calcularPosicoes — "menor é melhor" inverte o ranking inteiro', (t) => {
  const series = [serie('a', [10]), serie('b', [20]), serie('c', [30])];
  const maior = calcularPosicoes({ series, quantidadeDePeriodos: 1, maiorEhMelhor: true });
  const menor = calcularPosicoes({ series, quantidadeDePeriodos: 1, maiorEhMelhor: false });

  assert.deepEqual(maior.posicoes.map((p) => p[0]), [3, 2, 1]);
  assert.deepEqual(menor.posicoes.map((p) => p[0]), [1, 2, 3]);
  t.diagnostic('os dois sentidos conferidos');
});

test('calcularPosicoes — empate desempata pelo NOME, de forma estável', (t) => {
  // Se o desempate dependesse da ordem da consulta, o ranking trocaria de
  // posições entre renderizações da MESMA consulta — um bump chart que se
  // mexe sozinho é pior que nenhum.
  const naOrdemA = [serie('zebra', [100]), serie('abelha', [100]), serie('macaco', [100])];
  const naOrdemB = [serie('macaco', [100]), serie('zebra', [100]), serie('abelha', [100])];

  const a = calcularPosicoes({ series: naOrdemA, quantidadeDePeriodos: 1 });
  const b = calcularPosicoes({ series: naOrdemB, quantidadeDePeriodos: 1 });

  const porNome = (series, resultado) =>
    Object.fromEntries(series.map((s, i) => [s.rotulo, resultado.posicoes[i][0]]));

  assert.deepEqual(porNome(naOrdemA, a), { abelha: 1, macaco: 2, zebra: 3 });
  assert.deepEqual(
    porNome(naOrdemB, b),
    porNome(naOrdemA, a),
    'a mesma consulta em outra ordem precisa dar o MESMO ranking'
  );
  t.diagnostic('desempate estável conferido');
});

test('calcularPosicoes — período sem valor não recebe posição', (t) => {
  // Ranquear o que não existe (como zero, ou como "último") inventaria uma
  // queda que não aconteceu.
  const series = [
    serie('a', [10, null, 30]),
    serie('b', [20, 25, 10]),
    serie('c', [30, 15, null]),
  ];
  const { posicoes, maiorPosicao } = calcularPosicoes({ series, quantidadeDePeriodos: 3 });

  assert.equal(posicoes[0][1], null, 'a série sem valor fica sem posição');
  assert.equal(posicoes[2][2], null);
  assert.equal(maiorPosicao, 3, 'o maior ranking continua sendo o do período cheio');

  // No período 1 só duas séries participam: as posições são 1 e 2.
  const doPeriodo1 = posicoes.map((p) => p[1]).filter((p) => p !== null).sort();
  assert.deepEqual(doPeriodo1, [1, 2], 'com uma série fora, o ranking é de 1 a 2');
  t.diagnostic('lacunas preservadas');
});

test('calcularPosicoes — NaN e infinito contam como sem valor', (t) => {
  const series = [serie('a', [NaN]), serie('b', [Infinity]), serie('c', [5])];
  const { posicoes } = calcularPosicoes({ series, quantidadeDePeriodos: 1 });
  assert.equal(posicoes[0][0], null);
  assert.equal(posicoes[1][0], null);
  assert.equal(posicoes[2][0], 1, 'a única série válida é a primeira colocada');
  t.diagnostic('valores inválidos tratados');
});

test('calcularPosicoes — período inteiro sem dado não quebra', (t) => {
  const series = [serie('a', [null, 10]), serie('b', [null, 20])];
  const { posicoes, maiorPosicao } = calcularPosicoes({ series, quantidadeDePeriodos: 2 });
  assert.deepEqual(posicoes.map((p) => p[0]), [null, null]);
  assert.equal(maiorPosicao, 2);
  t.diagnostic('período vazio tratado');
});

/* ---------------------------- desenho ---------------------------- */

test('bump_chart — uma linha por série e um ponto por posição válida', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.linhas.length > 1, 'faltaram linhas');
    assert.ok(r.pontos.length > 0, 'faltaram pontos');

    // Em cada período, duas séries NÃO podem ocupar a mesma posição: no
    // desenho, isso é dois pontos no mesmo (x, y). É a propriedade de
    // permutação conferida no DOM, e não dá para exigir "mesma quantidade
    // de pontos por série" porque lacunas são legítimas.
    const porPeriodo = new Map();
    for (const ponto of r.pontos) {
      const x = Number(ponto.getAttribute('data-x')).toFixed(2);
      if (!porPeriodo.has(x)) porPeriodo.set(x, []);
      porPeriodo.get(x).push(Number(ponto.getAttribute('data-y')).toFixed(2));
    }
    assert.ok(porPeriodo.size > 1, 'os pontos deveriam se distribuir por vários períodos');
    for (const [x, alturas] of porPeriodo) {
      assert.equal(
        new Set(alturas).size,
        alturas.length,
        `no período em x=${x}, duas séries ocuparam a mesma posição`
      );
      assert.ok(
        alturas.length <= r.linhas.length,
        `no período em x=${x} há mais pontos (${alturas.length}) que séries (${r.linhas.length})`
      );
    }

    for (const caminho of r.linhas) {
      const d = caminho.getAttribute('d') || '';
      assert.ok(d.length > 5 && !/NaN|Infinity/.test(d), 'caminho inválido');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} séries, ${r.pontos.length} pontos, sem posição repetida`);
});

test('bump_chart — os pontos ocupam alturas discretas, uma por posição', (t) => {
  // O eixo é o ranking: com n séries existem exatamente n alturas
  // possíveis. Qualquer altura intermediária indica posição fracionária,
  // que não existe num ranking.
  const r = renderizar('comPivo');
  try {
    assert.ok(r.pontos.length > 0, 'nenhum ponto');
    const alturas = new Set(r.pontos.map((c) => Number(c.getAttribute('data-y')).toFixed(2)));
    assert.equal(
      alturas.size,
      r.linhas.length,
      `com ${r.linhas.length} séries deveriam existir ${r.linhas.length} alturas; vieram ${alturas.size}`
    );

    // E elas são igualmente espaçadas.
    const ordenadas = [...alturas].map(Number).sort((a, b) => a - b);
    const passos = [];
    for (let i = 1; i < ordenadas.length; i++) passos.push(ordenadas[i] - ordenadas[i - 1]);
    assert.ok(passos.length > 0);
    for (const passo of passos) {
      assert.ok(Math.abs(passo - passos[0]) < 0.5, 'as posições precisam ser igualmente espaçadas');
    }
    t.diagnostic(`${alturas.size} alturas, passo ${passos[0].toFixed(1)}px`);
  } finally {
    r.fim();
  }
});

test('bump_chart — nada sai da área do gráfico', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.pontos.length > 0, 'nenhum ponto');
    for (const ponto of r.pontos) {
      const cx = Number(ponto.getAttribute('data-x'));
      const cy = Number(ponto.getAttribute('data-y'));
      assert.ok(cx >= -1 && cx <= 901, `ponto fora (x=${cx})`);
      assert.ok(cy >= -1 && cy <= 561, `ponto fora (y=${cy})`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic('pontos contidos');
});

test('bump_chart — a nota declara que o ranking apaga a magnitude', (t) => {
  // É a armadilha estrutural: a distância do 1º ao 2º é desenhada igual à
  // do 9º ao 10º, seja a vantagem de 10x ou de 0,1%.
  const r = renderizar('comPivo');
  try {
    assert.match(r.nota, /POSIÇÃO, não o valor/i, 'faltou dizer o que o eixo é');
    assert.match(r.nota, /igual à do 9º ao 10º/i, 'faltou a consequência concreta');
    assert.match(r.nota, /apaga a magnitude/i);
    assert.match(r.nota, /valor no tooltip/i, 'e o caminho para a informação que falta');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 120));
});

test('bump_chart — os nomes aparecem nas pontas e somem quando desligados', (t) => {
  const comNomes = renderizar('comPivo', { rotulosNasPontas: 'ambas' });
  try {
    assert.ok(comNomes.rotulos.length > 0, 'faltaram nomes nas pontas');
    assert.equal(
      comNomes.rotulos.length,
      comNomes.linhas.length * 2,
      'com "nos dois lados" são dois nomes por série'
    );
    for (const nome of comNomes.rotulos) assert.ok(nome.length > 0, 'nome vazio');
  } finally {
    comNomes.fim();
  }

  const semNomes = renderizar('comPivo', { rotulosNasPontas: 'nenhum' });
  try {
    assert.equal(semNomes.rotulos.length, 0, '"nenhum" não pode desenhar nome');
    assert.ok(semNomes.linhas.length > 0, 'mas as linhas continuam');
  } finally {
    semNomes.fim();
  }

  const soEsquerda = renderizar('comPivo', { rotulosNasPontas: 'esquerda' });
  try {
    assert.equal(soEsquerda.rotulos.length, soEsquerda.linhas.length, 'um nome por série');
  } finally {
    soEsquerda.fim();
  }
  t.diagnostic('três modos de rótulo conferidos');
});

test('bump_chart — inverter o critério inverte o desenho', (t) => {
  // Mesmo dado, pergunta oposta: a série que estava em cima vai para baixo.
  const alturaDaPrimeiraLinha = (r) => {
    const d = r.linhas[0].getAttribute('d') || '';
    const numeros = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    const ys = numeros.filter((_, i) => i % 2 === 1);
    return ys.reduce((a, b) => a + b, 0) / ys.length;
  };

  const maior = renderizar('comPivo', { melhorPosicao: 'maior' });
  const menor = renderizar('comPivo', { melhorPosicao: 'menor' });
  try {
    assert.ok(maior.linhas.length > 0 && menor.linhas.length > 0);
    const a = alturaDaPrimeiraLinha(maior);
    const b = alturaDaPrimeiraLinha(menor);
    assert.notEqual(a.toFixed(1), b.toFixed(1), 'inverter o critério precisa mudar o desenho');
    t.diagnostic(`altura média da 1ª série: ${a.toFixed(1)} → ${b.toFixed(1)}`);
  } finally {
    maior.fim();
    menor.fim();
  }
});

test('bump_chart — uma série só é recusada com explicação', (t) => {
  const r = renderizar('temporal');
  try {
    if (r.vazio) {
      assert.match(r.vazio, /DUAS séries|ranking/i, 'a recusa precisa dizer o que falta');
      assert.equal(r.linhas.length, 0);
      t.diagnostic('recusa explicada');
    } else {
      assert.ok(r.linhas.length > 1, 'ou recusa, ou desenha pelo menos duas séries');
      t.diagnostic(`a fixture trouxe ${r.linhas.length} séries`);
    }
  } finally {
    r.fim();
  }
});

test('bump_chart — consulta vazia explica em vez de quebrar', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.linhas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
