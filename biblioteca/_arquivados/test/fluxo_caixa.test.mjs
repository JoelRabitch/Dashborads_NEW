/**
 * fluxo_caixa.test.mjs — testes do Fluxo de Caixa.
 *
 * O risco está no SINAL e no acúmulo: uma saída somada como entrada
 * inverte a conclusão do gráfico sem deixar rastro visual. Os testes
 * conferem o saldo período a período contra números feitos à mão.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import { lerSerieTemporal } from '../src/charts/_serie_temporal/index.js';
import { montarFluxo } from '../src/charts/fluxo_caixa/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'fluxo_caixa.js');

const cel = (v) => ({ value: v, rendered: v === null ? null : String(v) });

/** Consulta sintética com entradas e saídas por mês. */
function consulta(linhas, { duasMedidas = true } = {}) {
  const medidas = duasMedidas
    ? [
        { name: 'entradas', label: 'Entradas', label_short: 'Entradas', type: 'sum', is_numeric: true },
        { name: 'saidas', label: 'Saídas', label_short: 'Saídas', type: 'sum', is_numeric: true },
      ]
    : [{ name: 'entradas', label: 'Movimento', label_short: 'Movimento', type: 'sum', is_numeric: true }];

  return {
    data: linhas.map(([mes, entrada, saida]) => {
      const registro = { mes: cel(mes), entradas: cel(entrada) };
      if (duasMedidas) registro.saidas = cel(saida);
      return registro;
    }),
    queryResponse: {
      fields: {
        dimension_like: [{ name: 'mes', label: 'Mês', label_short: 'Mês', type: 'date_month' }],
        measure_like: medidas,
        pivots: [],
      },
      pivots: [],
    },
  };
}

function fluxoDe(linhas, config = {}, opcoes = {}) {
  const { data, queryResponse } = consulta(linhas, opcoes);
  const modelo = construirModelo(data, queryResponse, {});
  const serie = lerSerieTemporal({ modelo, config, avisar: () => {} });
  const campos = {
    entradas: modelo.medidas[0],
    saidas: opcoes.duasMedidas === false ? null : modelo.medidas[1],
    modo: opcoes.duasMedidas === false ? 'comSinal' : 'duasMedidas',
  };
  return montarFluxo({ modelo, serie, campos, config });
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.fluxo_caixa;
  assert.ok(definicao, 'fluxo_caixa não se registrou');

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
    rects: Array.from(palco.querySelectorAll('rect')),
    linhas: Array.from(palco.querySelectorAll('.st-linha')),
    nota: palco.querySelector('.st-nota')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

test('fluxo_caixa — saídas viram negativas e o saldo acumula', (t) => {
  const fluxo = fluxoDe([
    ['2026-01', 1000, 400],
    ['2026-02', 800, 1200],
    ['2026-03', 500, 300],
  ]);

  assert.deepEqual(
    fluxo.periodos.map((p) => p.entrada),
    [1000, 800, 500]
  );
  assert.deepEqual(
    fluxo.periodos.map((p) => p.saida),
    [-400, -1200, -300],
    'saídas que chegam positivas precisam ser desenhadas para baixo'
  );
  assert.deepEqual(
    fluxo.periodos.map((p) => p.saldo),
    [600, 200, 400],
    'o saldo é cumulativo: 600, depois 600-400=200, depois 200+200=400'
  );
  assert.equal(fluxo.saldoFinal, 400);
  t.diagnostic(`saldos: ${fluxo.periodos.map((p) => p.saldo).join(', ')}`);
});

test('fluxo_caixa — saída que já vem negativa não é invertida duas vezes', (t) => {
  // Inverter o que já é negativo criaria uma entrada fantasma e o saldo
  // subiria quando deveria cair.
  const fluxo = fluxoDe([
    ['2026-01', 1000, -400],
    ['2026-02', 0, -600],
  ]);
  assert.deepEqual(fluxo.periodos.map((p) => p.saida), [-400, -600]);
  assert.deepEqual(fluxo.periodos.map((p) => p.saldo), [600, 0]);
  t.diagnostic('sinal preservado');
});

test('fluxo_caixa — uma medida com sinal separa entradas de saídas', (t) => {
  const fluxo = fluxoDe(
    [
      ['2026-01', 500],
      ['2026-02', -800],
      ['2026-03', 200],
    ],
    {},
    { duasMedidas: false }
  );

  assert.deepEqual(fluxo.periodos.map((p) => p.entrada), [500, 0, 200]);
  assert.deepEqual(fluxo.periodos.map((p) => p.saida), [0, -800, 0]);
  assert.deepEqual(fluxo.periodos.map((p) => p.saldo), [500, -300, -100]);
  assert.equal(fluxo.periodosNegativos, 2, 'dois períodos fecham no vermelho');
  t.diagnostic('modo de medida única conferido');
});

test('fluxo_caixa — saldo inicial desloca toda a curva', (t) => {
  const linhas = [
    ['2026-01', 100, 0],
    ['2026-02', 100, 0],
  ];
  const semSaldo = fluxoDe(linhas);
  const comSaldo = fluxoDe(linhas, { saldoInicial: '1000' });

  assert.deepEqual(semSaldo.periodos.map((p) => p.saldo), [100, 200]);
  assert.deepEqual(comSaldo.periodos.map((p) => p.saldo), [1100, 1200]);

  const negativo = fluxoDe(linhas, { saldoInicial: '-150' });
  assert.deepEqual(negativo.periodos.map((p) => p.saldo), [-50, 50]);
  assert.equal(negativo.periodosNegativos, 1, 'o primeiro período fica no vermelho');
  t.diagnostic('saldo inicial conferido');
});

test('fluxo_caixa — saldo inicial inválido não contamina a conta', (t) => {
  const fluxo = fluxoDe(
    [
      ['2026-01', 100, 0],
      ['2026-02', 50, 0],
    ],
    { saldoInicial: 'abc' }
  );
  assert.deepEqual(
    fluxo.periodos.map((p) => p.saldo),
    [100, 150],
    'texto inválido precisa virar zero, não NaN'
  );
  assert.ok(Number.isFinite(fluxo.saldoFinal), 'o saldo final não pode ser NaN');
  t.diagnostic('entrada inválida tratada');
});

test('fluxo_caixa — desenha barras, linha de saldo e resumo', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.rects.length > 0, 'faltaram as barras');
    assert.equal(r.linhas.length, 1, 'esperada uma linha de saldo');
    assert.ok(!/NaN/.test(r.linhas[0].getAttribute('d') || ''), 'linha de saldo com NaN');
    assert.match(r.nota, /Saldo final/, 'o resumo precisa trazer o saldo final');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`nota: ${r.nota.slice(0, 80)}`);
});

test('fluxo_caixa — saldo negativo é destacado e anunciado', (t) => {
  const normal = renderizar('semPivo');
  const negativo = renderizar('semPivo', { saldoInicial: '-50000' });
  try {
    assert.ok(
      negativo.rects.length > normal.rects.length,
      'os períodos no vermelho precisam ganhar um destaque de fundo'
    );
    assert.match(
      negativo.nota,
      /saldo negativo/i,
      'o resumo precisa dizer que houve período no vermelho'
    );
    assert.ok(!/saldo negativo/i.test(normal.nota), 'sem vermelho, não há o que anunciar');
  } finally {
    normal.fim();
    negativo.fim();
  }
  t.diagnostic(`nota: ${negativo.nota.slice(-70)}`);
});

test('fluxo_caixa — períodos fora de ordem geram aviso', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(BUNDLE, 'utf8'));
    const definicao = amb.registro.fluxo_caixa;
    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const palco = amb.window.document.getElementById('palco');

    const { data, queryResponse } = consulta([
      ['2026-03', 100, 0],
      ['2026-01', 100, 0],
      ['2026-02', 100, 0],
    ]);

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    assert.match(
      palco.querySelector('.bl-aviso')?.textContent || '',
      /ordem crescente de data/i,
      'o saldo acumulado é cumulativo: fora de ordem o resultado não significa nada'
    );
  } finally {
    amb.restaurar();
  }
  t.diagnostic('aviso de ordem conferido');
});
