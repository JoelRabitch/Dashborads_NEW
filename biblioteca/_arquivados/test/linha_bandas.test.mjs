/**
 * linha_bandas.test.mjs — testes da Linha com Bandas.
 *
 * O risco deste gráfico é de HONESTIDADE, não de desenho: uma banda de
 * percentual fixo parece um intervalo de confiança medido, e uma banda
 * invertida mostra incerteza onde não há. Os testes cobrem os dois.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { desvioPadraoDe } from '../src/charts/linha_bandas/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'linha_bandas.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.linha_bandas;
  assert.ok(definicao, 'linha_bandas não se registrou');

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
    bandas: Array.from(palco.querySelectorAll('.lb-banda')),
    linhas: Array.from(palco.querySelectorAll('.lb-linha')),
    nota: palco.querySelector('.lb-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

test('linha_bandas — desvio padrão calculado sobre a população', (t) => {
  // [2,4,4,4,5,5,7,9] tem média 5 e desvio populacional 2.
  const valores = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(desvioPadraoDe(valores, 5), 2);
  assert.equal(desvioPadraoDe([], null), 0, 'sem valores não há desvio');
  assert.equal(desvioPadraoDe([7], 7), 0, 'um valor só não tem dispersão');
  t.diagnostic('desvio padrão conferido');
});

test('linha_bandas — banda calculada se identifica na tela', (t) => {
  // Uma banda de ±10% NÃO é uma medição. Se o gráfico não disser isso,
  // ela passa por intervalo de confiança.
  const percentual = renderizar('ohlc', { modoDaBanda: 'percentual' });
  try {
    assert.match(percentual.nota, /ilustrativa/i, 'a banda de percentual precisa se declarar ilustrativa');
    assert.match(percentual.nota, /10%/, 'a nota precisa dizer qual percentual foi usado');
  } finally {
    percentual.fim();
  }

  const desvio = renderizar('ohlc', { modoDaBanda: 'desvio' });
  try {
    assert.match(desvio.nota, /desvio\(s\) padrão/i, 'a banda de desvio precisa dizer que é calculada');
  } finally {
    desvio.fim();
  }

  // Com três medidas de verdade, a banda é um dado: nada a declarar.
  const medidas = renderizar('ohlc', {
    modoDaBanda: 'medidas',
    campoInferior: 'minima',
    campoCentral: 'fechamento',
    campoSuperior: 'maxima',
  });
  try {
    assert.equal(medidas.nota, '', 'banda vinda da consulta não precisa de ressalva');
  } finally {
    medidas.fim();
  }

  t.diagnostic('as três origens de banda se declaram corretamente');
});

test('linha_bandas — limites trocados são corrigidos com aviso', (t) => {
  const r = renderizar('ohlc', {
    modoDaBanda: 'medidas',
    campoInferior: 'maxima',
    campoCentral: 'fechamento',
    campoSuperior: 'minima',
  });
  try {
    assert.match(
      r.aviso,
      /limite inferior acima do superior/i,
      'trocar os campos precisa gerar aviso, não uma banda invertida em silêncio'
    );
    assert.equal(r.bandas.length, 1, 'a banda continua sendo desenhada');
    assert.ok(!/NaN/.test(r.bandas[0].getAttribute('d') || ''), 'banda com NaN');
  } finally {
    r.fim();
  }
  t.diagnostic('limites invertidos tratados');
});

test('linha_bandas — o padrão automático não inverte a banda', (t) => {
  // Pegar as três primeiras medidas POR POSIÇÃO daria uma banda invertida
  // na fixture ohlc (abertura, máxima, mínima). O padrão ordena pela média.
  const r = renderizar('ohlc');
  try {
    assert.ok(
      !/limite inferior acima do superior/i.test(r.aviso),
      `o padrão automático não deveria produzir banda invertida; aviso: ${r.aviso}`
    );
    assert.equal(r.bandas.length, 1, 'com três medidas, a banda sai desenhada');
  } finally {
    r.fim();
  }
  t.diagnostic('padrão automático conferido');
});

test('linha_bandas — modo sem banda desenha só a linha', (t) => {
  const r = renderizar('temporal', { modoDaBanda: 'nenhuma' });
  try {
    assert.equal(r.bandas.length, 0, 'não deveria haver banda');
    assert.ok(r.linhas.length > 0, 'a linha central continua');
    for (const linha of r.linhas) {
      assert.ok(!/NaN/.test(linha.getAttribute('d') || ''), 'linha com NaN');
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} linhas, nenhuma banda`);
});

test('linha_bandas — mín/máx do pivô envolve a média das séries', (t) => {
  const r = renderizar('comPivo', { modoDaBanda: 'minimoMaximo' });
  try {
    assert.equal(r.bandas.length, 1, 'esperado uma banda só, a do intervalo entre séries');
    assert.ok(r.linhas.length >= 1, 'faltou a linha da média');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    assert.ok(!/NaN/.test(r.bandas[0].getAttribute('d') || ''), 'banda com NaN');
  } finally {
    r.fim();
  }
  t.diagnostic('banda de mínimo/máximo conferida');
});

test('linha_bandas — nenhum caminho sai vazio ou com NaN', (t) => {
  for (const modo of ['percentual', 'desvio', 'minimoMaximo', 'nenhuma']) {
    for (const fixture of ['ohlc', 'comPivo', 'temporal']) {
      const r = renderizar(fixture, { modoDaBanda: modo });
      try {
        for (const el of [...r.bandas, ...r.linhas]) {
          const d = el.getAttribute('d') || '';
          assert.ok(d.length > 0, `${modo}/${fixture}: caminho vazio`);
          assert.ok(!/NaN|Infinity/.test(d), `${modo}/${fixture}: caminho com NaN/Infinity`);
        }
      } finally {
        r.fim();
      }
    }
  }
  t.diagnostic('4 modos × 3 fixtures sem caminho quebrado');
});
