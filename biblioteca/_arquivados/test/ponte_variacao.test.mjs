/**
 * ponte_variacao.test.mjs — testes da Ponte de Variação (waterfall).
 *
 * O erro clássico do waterfall é tratar total e contribuição igual: o
 * gráfico continua bonito e a leitura inverte. O outro é não conferir se a
 * ponte FECHA — uma ponte que não fecha está escondendo alguma etapa.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import { montarPonte } from '../src/charts/ponte_variacao/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'ponte_variacao.js');

const cel = (v) => ({ value: v, rendered: v === null ? null : String(v) });

function ponteDe(pares, config = {}) {
  const data = pares.map(([nome, valor]) => ({ c: cel(nome), v: cel(valor) }));
  const queryResponse = {
    fields: {
      dimension_like: [{ name: 'c', label: 'Etapa', label_short: 'Etapa', type: 'string' }],
      measure_like: [{ name: 'v', label: 'Valor', label_short: 'Valor', type: 'sum', is_numeric: true }],
      pivots: [],
    },
    pivots: [],
  };
  const modelo = construirModelo(data, queryResponse, {});
  return montarPonte({
    modelo,
    campoDaCategoria: modelo.dimensoes[0],
    medida: modelo.medidas[0],
    config,
  });
}

test('ponte — contribuições flutuam e totais ancoram no zero', (t) => {
  const { barras } = ponteDe([
    ['Inicial', 100],
    ['Vendas', 50],
    ['Custos', -30],
    ['Final', 120],
  ]);

  assert.equal(barras[0].ehTotal, true, 'a primeira é total');
  assert.equal(barras[0].base, 0, 'total ancora no zero');
  assert.equal(barras[0].topo, 100);

  assert.equal(barras[1].ehTotal, false);
  assert.equal(barras[1].base, 100, 'a contribuição parte de onde o total terminou');
  assert.equal(barras[1].topo, 150);

  assert.equal(barras[2].base, 150, 'e a seguinte parte de onde a anterior terminou');
  assert.equal(barras[2].topo, 120, 'uma queda desce');

  assert.equal(barras[3].ehTotal, true, 'a última é total');
  assert.equal(barras[3].base, 0, 'e volta a ancorar no zero');
  t.diagnostic(barras.map((b) => `${b.rotulo}:${b.base}→${b.topo}`).join(' | '));
});

test('ponte — uma ponte que fecha não gera aviso', (t) => {
  const { avisos, residuo, variacaoTotal } = ponteDe([
    ['Inicial', 100],
    ['Vendas', 50],
    ['Custos', -30],
    ['Impostos', -20],
    ['Final', 100],
  ]);
  assert.equal(residuo, 0, 'as contribuições explicam a variação inteira');
  assert.equal(variacaoTotal, 0, 'saiu de 100 e voltou a 100');
  assert.equal(avisos.length, 0);
  t.diagnostic('fechamento conferido');
});

test('ponte — quando não fecha, o resíduo é anunciado', (t) => {
  // Uma ponte que não fecha está escondendo alguma etapa. Desenhar sem
  // dizer nada seria o pior dos mundos.
  const { avisos, residuo } = ponteDe([
    ['Inicial', 100],
    ['Vendas', 50],
    ['Final', 200],
  ]);
  assert.equal(residuo, 50, 'faltam 50 para explicar a diferença');
  assert.ok(
    avisos.some((a) => /não fecha/i.test(a)),
    `o usuário precisa saber; avisos: ${avisos.join(' | ')}`
  );
  t.diagnostic(`resíduo ${residuo}`);
});

test('ponte — centavos não acusam falso desencontro', (t) => {
  // Comparar floats com zero exato acusaria erro em qualquer consulta com
  // centavos, e o usuário aprenderia a ignorar o aviso.
  const { avisos, residuo } = ponteDe([
    ['Inicial', 100.01],
    ['A', 0.02],
    ['Final', 100.03],
  ]);
  assert.equal(residuo, 0, 'a tolerância precisa absorver o erro de ponto flutuante');
  assert.equal(avisos.length, 0, 'um aviso aqui treinaria o usuário a ignorar todos');
  t.diagnostic('tolerância conferida');
});

test('ponte — modo "nenhuma": todas as barras flutuam', (t) => {
  const { barras } = ponteDe(
    [
      ['A', 10],
      ['B', -3],
      ['C', 5],
    ],
    { comoIdentificarTotais: 'nenhuma' }
  );
  assert.ok(barras.every((b) => !b.ehTotal), 'nenhuma barra deveria ser total');
  assert.deepEqual(barras.map((b) => b.base), [0, 10, 7], 'cada uma parte do acumulado anterior');
  assert.deepEqual(barras.map((b) => b.topo), [10, 7, 12]);
  t.diagnostic('modo sem totais conferido');
});

test('ponte — modo "porTexto" acha os totais pelo rótulo', (t) => {
  const { barras } = ponteDe(
    [
      ['Saldo inicial', 100],
      ['Vendas', 50],
      ['Saldo final', 150],
    ],
    { comoIdentificarTotais: 'porTexto', textoQueMarcaTotal: 'saldo' }
  );
  assert.deepEqual(
    barras.filter((b) => b.ehTotal).map((b) => b.rotulo),
    ['Saldo inicial', 'Saldo final']
  );
  assert.equal(barras[1].ehTotal, false, 'Vendas não contém o texto e é contribuição');
  t.diagnostic('detecção por texto conferida');
});

test('ponte — um total no meio redefine o acumulado', (t) => {
  // É o que permite montar pontes com subtotais no caminho.
  const { barras } = ponteDe(
    [
      ['A', 10],
      ['Subtotal', 500],
      ['B', 20],
    ],
    { comoIdentificarTotais: 'porTexto', textoQueMarcaTotal: 'subtotal' }
  );
  assert.equal(barras[1].base, 0, 'o subtotal ancora no zero');
  assert.equal(barras[2].base, 500, 'e a contribuição seguinte parte dele, não do acumulado antigo');
  t.diagnostic('subtotal no meio conferido');
});

test('ponte — desenha barras, conectores e nota de fechamento', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(BUNDLE, 'utf8'));
    const definicao = amb.registro.ponte_variacao;
    assert.ok(definicao, 'ponte_variacao não se registrou');

    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const { data, queryResponse } = FIXTURES.semPivo();
    const palco = amb.window.document.getElementById('palco');

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    const barras = Array.from(palco.querySelectorAll('.pv-barra'));
    assert.equal(barras.length, data.length, 'esperada uma barra por etapa');
    for (const barra of barras) {
      assert.ok(Number(barra.getAttribute('height')) >= 1, 'barra sem altura visível');
      assert.ok(Number.isFinite(Number(barra.getAttribute('y'))), 'coordenada inválida');
    }
    assert.ok(palco.querySelectorAll('.pv-conector').length > 0, 'faltaram os conectores');
    assert.match(
      palco.querySelector('.pv-nota')?.textContent || '',
      /Variação total/,
      'faltou a nota de fechamento'
    );
  } finally {
    amb.restaurar();
  }
  t.diagnostic('desenho conferido');
});
