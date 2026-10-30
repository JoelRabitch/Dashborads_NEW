/**
 * drawdown.test.mjs — testes do Drawdown e da base de série temporal.
 *
 * O drawdown é cumulativo: um erro de um período contamina todos os
 * seguintes, e o desenho continua plausível. Por isso a maior parte dos
 * testes é sobre o CÁLCULO, conferido contra números feitos à mão.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { calcularDrawdown } from '../src/charts/drawdown/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'drawdown.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.drawdown;
  assert.ok(definicao, 'drawdown não se registrou');

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
    areas: Array.from(palco.querySelectorAll('.st-area-preenchida')),
    linhas: Array.from(palco.querySelectorAll('.st-linha')),
    nota: palco.querySelector('.bl-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

test('drawdown — o topo é o máximo acumulado, nunca recua', (t) => {
  const valores = [100, 110, 90, 95, 120, 60, 130];
  const { topo } = calcularDrawdown(valores, true);
  assert.deepEqual(topo, [100, 110, 110, 110, 120, 120, 130]);
  for (let i = 1; i < topo.length; i++) {
    assert.ok(topo[i] >= topo[i - 1], 'o máximo histórico não pode diminuir');
  }
  t.diagnostic('topo acumulado conferido');
});

test('drawdown — percentual e absoluto batem com a conta à mão', (t) => {
  const valores = [100, 110, 90, 95, 120, 60, 130];

  const percentual = calcularDrawdown(valores, true);
  // 90 com topo 110 → 90/110 - 1 = -18,18%
  assert.ok(Math.abs(percentual.drawdown[2] + 0.1818) < 0.001, 'queda percentual errada');
  assert.equal(percentual.drawdown[0], 0, 'no primeiro período o topo é o próprio valor');
  assert.equal(percentual.drawdown[4], 0, 'novo topo zera o drawdown');
  assert.equal(percentual.drawdown[5], -0.5, '60 com topo 120 é exatamente -50%');

  const absoluto = calcularDrawdown(valores, false);
  assert.deepEqual(absoluto.drawdown, [0, 0, -20, -15, 0, -60, 0]);

  for (const v of percentual.drawdown) {
    assert.ok(v <= 0, 'drawdown nunca pode ser positivo');
  }
  t.diagnostic('percentual e absoluto conferidos');
});

test('drawdown — a pior queda sabe onde começou e onde foi recuperada', (t) => {
  const { pior } = calcularDrawdown([100, 110, 90, 95, 120, 60, 130], true);
  assert.equal(pior.valor, -0.5, 'a pior queda é a de -50%');
  assert.equal(pior.indice, 5, 'o fundo está no índice 5');
  assert.equal(pior.inicio, 4, 'a queda começou no topo do índice 4');
  assert.equal(pior.fim, 6, 'foi recuperada no índice 6, quando voltou acima de 120');
  t.diagnostic(`pior: ${JSON.stringify(pior)}`);
});

test('drawdown — série que nunca recupera não inventa data de recuperação', (t) => {
  const { pior } = calcularDrawdown([100, 50, 60, 70], true);
  assert.equal(pior.valor, -0.5);
  assert.equal(pior.fim, -1, 'sem recuperação, o fim fica indefinido');
  t.diagnostic('série sem recuperação conferida');
});

test('drawdown — topo não positivo não vira percentual inventado', (t) => {
  // Dividir por um topo zero ou negativo produz número sem sentido. O
  // período precisa sair nulo, não com um valor plausível.
  const { drawdown } = calcularDrawdown([-5, -10, -3], true);
  assert.deepEqual(drawdown, [null, null, null], 'com topo negativo o percentual não existe');

  // Em valor absoluto a conta continua valendo mesmo com negativos:
  // -5 é o topo, -10 fica 5 abaixo dele, e -3 estabelece um topo novo.
  const absoluto = calcularDrawdown([-5, -10, -3], false);
  assert.deepEqual(absoluto.drawdown, [0, -5, 0]);
  t.diagnostic('topo não positivo tratado');
});

test('drawdown — valores nulos não quebram a série acumulada', (t) => {
  const { drawdown, topo } = calcularDrawdown([100, null, 80, null, 120], true);
  assert.equal(drawdown[1], null, 'período sem valor fica sem drawdown');
  assert.equal(topo[2], 100, 'o topo atravessa o buraco');
  assert.ok(Math.abs(drawdown[2] + 0.2) < 0.0001, '80 com topo 100 é -20%');
  t.diagnostic('nulos atravessados corretamente');
});

test('drawdown — desenha área, linha e destaque sem caminho quebrado', (t) => {
  for (const fixture of ['ohlc', 'temporal', 'comPivo']) {
    const r = renderizar(fixture);
    try {
      assert.ok(r.areas.length > 0, `${fixture}: faltou a área de queda`);
      assert.ok(r.linhas.length > 0, `${fixture}: faltou a linha`);
      for (const el of [...r.areas, ...r.linhas]) {
        const d = el.getAttribute('d') || '';
        assert.ok(d.length > 0, `${fixture}: caminho vazio`);
        assert.ok(!/NaN|Infinity/.test(d), `${fixture}: caminho com NaN/Infinity`);
      }
      assert.ok(
        r.palco.querySelectorAll('.st-destaque').length > 0,
        `${fixture}: a pior queda precisa estar destacada`
      );
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    } finally {
      r.fim();
    }
  }
  t.diagnostic('desenho conferido em três fixtures');
});

test('drawdown — com várias séries, a nota diz de qual delas fala', (t) => {
  // "Pior queda: -62%" sem dizer de quem faz o leitor atribuir à série
  // errada, e a pior costuma ser a de maior amplitude, não a principal.
  const varias = renderizar('ohlc');
  try {
    assert.match(varias.nota, /Pior queda \(.+\)/, `faltou o nome da série na nota: "${varias.nota}"`);
  } finally {
    varias.fim();
  }
  t.diagnostic(`nota: ${varias.nota}`);
});

test('drawdown — períodos fora de ordem geram aviso', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(BUNDLE, 'utf8'));
    const definicao = amb.registro.drawdown;
    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const palco = amb.window.document.getElementById('palco');

    const cel = (v) => ({ value: v, rendered: String(v) });
    // Datas deliberadamente embaralhadas.
    const data = [
      { dia: cel('2026-03-01'), v: cel(100) },
      { dia: cel('2026-01-01'), v: cel(80) },
      { dia: cel('2026-02-01'), v: cel(120) },
    ];
    const queryResponse = {
      fields: {
        dimension_like: [{ name: 'dia', label: 'Dia', label_short: 'Dia', type: 'date_date' }],
        measure_like: [{ name: 'v', label: 'Valor', label_short: 'Valor', type: 'sum', is_numeric: true }],
        pivots: [],
      },
      pivots: [],
    };

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    assert.match(
      palco.querySelector('.bl-aviso')?.textContent || '',
      /ordem crescente de data/i,
      'o drawdown é cumulativo: fora de ordem o número é ficção e o usuário precisa saber'
    );
  } finally {
    amb.restaurar();
  }
  t.diagnostic('aviso de ordem conferido');
});
