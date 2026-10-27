/**
 * theme_river.test.mjs — testes do ThemeRiver e do extrator de séries.
 *
 * Dois riscos aqui. O primeiro é o `core/series.js`: se ele alinhar errado
 * as séries às categorias, o rio continua bonito e os valores ficam
 * trocados. O segundo é a legenda interativa, que redesenha o gráfico — um
 * caminho fácil de vazar listeners ou de simplesmente não funcionar.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import { extrairMatriz, totaisPorCategoria, tratarNulos } from '../src/core/series.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'theme_river.js');

function modeloDaFixture(nome) {
  const { data, queryResponse } = FIXTURES[nome]();
  return { modelo: construirModelo(data, queryResponse, {}), data, queryResponse };
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.theme_river;
  assert.ok(definicao, 'theme_river não se registrou');

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
    faixas: Array.from(palco.querySelectorAll('.tr-faixa')),
    legenda: Array.from(palco.querySelectorAll('.bl-legenda-item')),
    fim: () => amb.restaurar(),
  };
}

test('series — o pivô vira uma série por valor, alinhada às categorias', (t) => {
  const { modelo } = modeloDaFixture('comPivo');
  const matriz = extrairMatriz(modelo, {});

  assert.equal(matriz.origem, 'pivo', 'com pivô a origem detectada tem que ser o pivô');
  assert.equal(matriz.series.length, modelo.pivotsDeDados.length, 'uma série por valor do pivô');
  for (const serie of matriz.series) {
    assert.equal(
      serie.valores.length,
      matriz.categorias.length,
      `a série "${serie.rotulo}" não ficou alinhada ao eixo`
    );
  }

  // Confere um valor contra o modelo, para pegar troca de linha/coluna.
  const primeiraCategoria = matriz.categorias[0];
  const primeiraSerie = matriz.series[0];
  const esperado = modelo.valorNumerico(
    modelo.linhas[primeiraCategoria.indiceDaPrimeiraLinha],
    matriz.medida.nome,
    primeiraSerie.chave
  );
  assert.equal(primeiraSerie.valores[0], esperado, 'o valor alinhado não bate com o do modelo');

  t.diagnostic(`${matriz.series.length} séries × ${matriz.categorias.length} categorias`);
});

test('series — a 2ª dimensão também vira série, e os totais batem', (t) => {
  const { modelo } = modeloDaFixture('duasDimensoes');
  const matriz = extrairMatriz(modelo, {});

  assert.equal(matriz.origem, 'dimensao');
  assert.ok(matriz.series.length >= 2, 'deveria haver mais de uma série');

  // A soma de tudo na matriz tem que ser a soma da medida no modelo.
  const somaDaMatriz = totaisPorCategoria(matriz.series, matriz.categorias.length).reduce((a, b) => a + b, 0);
  let somaDoModelo = 0;
  for (const linha of modelo.linhas) {
    const v = modelo.valorNumerico(linha, matriz.medida.nome);
    if (v !== null) somaDoModelo += v;
  }
  assert.ok(
    Math.abs(somaDaMatriz - somaDoModelo) < 0.001,
    `a matriz soma ${somaDaMatriz} e o modelo soma ${somaDoModelo}`
  );

  t.diagnostic(`${matriz.series.length} séries, soma ${Math.round(somaDaMatriz)}`);
});

test('series — o limite agrupa o excedente em "Outros" sem perder valor', (t) => {
  const { modelo } = modeloDaFixture('duasDimensoes');
  const semLimite = extrairMatriz(modelo, {});
  const comLimite = extrairMatriz(modelo, { limiteDeSeries: 2, agruparRestoEmOutros: true });

  assert.ok(comLimite.series.length <= 3, 'com limite 2 sobram as 2 maiores mais "Outros"');
  assert.ok(
    comLimite.series.some((s) => s.chave === '__outros__'),
    'faltou a série "Outros"'
  );

  const somaA = totaisPorCategoria(semLimite.series, semLimite.categorias.length).reduce((a, b) => a + b, 0);
  const somaB = totaisPorCategoria(comLimite.series, comLimite.categorias.length).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(somaA - somaB) < 0.001, `agrupar em "Outros" mudou o total: ${somaA} vs ${somaB}`);

  t.diagnostic(`de ${semLimite.series.length} para ${comLimite.series.length} séries, total preservado`);
});

test('series — interpolar preenche os buracos sem inventar nas pontas', (t) => {
  const series = [{ chave: 'a', rotulo: 'A', valores: [null, 10, null, 30, null] }];
  const zerado = tratarNulos(series, 'zero');
  const interpolado = tratarNulos(series, 'interpolar');

  assert.deepEqual(zerado[0].valores, [0, 10, 0, 30, 0]);
  assert.deepEqual(
    interpolado[0].valores,
    [10, 10, 20, 30, 30],
    'nas pontas repete o vizinho; no meio, a média'
  );
  t.diagnostic('tratamento de nulos conferido');
});

test('theme_river — desenha uma faixa por série, sem caminho quebrado', (t) => {
  for (const fixture of ['comPivo', 'duasDimensoes', 'temporal']) {
    const r = renderizar(fixture);
    try {
      assert.ok(r.faixas.length >= 2, `${fixture}: esperado mais de uma faixa`);
      for (const faixa of r.faixas) {
        const d = faixa.getAttribute('d') || '';
        assert.ok(d.length > 20, `${fixture}: faixa com caminho vazio`);
        assert.ok(!/NaN|Infinity/.test(d), `${fixture}: caminho com NaN/Infinity`);
      }
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
      t.diagnostic(`${fixture}: ${r.faixas.length} faixas`);
    } finally {
      r.fim();
    }
  }
});

test('theme_river — os quatro modos de empilhamento desenham', (t) => {
  for (const modo of ['wiggle', 'silhouette', 'zero', 'expand']) {
    const r = renderizar('comPivo', { deslocamentoDaPilha: modo });
    try {
      assert.ok(r.faixas.length >= 2, `modo ${modo}: faltaram faixas`);
      for (const faixa of r.faixas) {
        assert.ok(!/NaN/.test(faixa.getAttribute('d') || ''), `modo ${modo}: caminho com NaN`);
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic('wiggle, silhouette, zero e expand conferidos');
});

test('theme_river — clicar na legenda esconde a série e redesenha', (t) => {
  const r = renderizar('comPivo');
  try {
    const antes = r.faixas.length;
    assert.ok(r.legenda.length === antes, 'a legenda deveria ter um item por faixa');

    r.legenda[0].dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    const depois = r.palco.querySelectorAll('.tr-faixa').length;
    assert.equal(depois, antes - 1, `esperado ${antes - 1} faixas depois de desligar uma, veio ${depois}`);

    // Religar tem que trazer a faixa de volta.
    r.palco.querySelectorAll('.bl-legenda-item')[0]
      .dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(r.palco.querySelectorAll('.tr-faixa').length, antes, 'religar não trouxe a faixa de volta');
  } finally {
    r.fim();
  }
  t.diagnostic('legenda interativa conferida');
});

test('theme_river — desligar tudo mostra mensagem em vez de tela vazia', (t) => {
  const r = renderizar('comPivo');
  try {
    // Clica em todos os itens da legenda, sempre relendo o DOM porque o
    // gráfico é redesenhado a cada clique.
    for (let i = 0; i < 20; i++) {
      const itens = r.palco.querySelectorAll('.bl-legenda-item');
      const ligado = Array.from(itens).find((el) => !el.classList.contains('bl-desligado'));
      if (!ligado) break;
      ligado.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    }
    assert.match(
      r.palco.querySelector('.bl-vazio')?.textContent || '',
      /desligadas/i,
      'com tudo desligado o usuário precisa entender por que a tela está vazia'
    );
  } finally {
    r.fim();
  }
  t.diagnostic('estado "tudo desligado" conferido');
});
