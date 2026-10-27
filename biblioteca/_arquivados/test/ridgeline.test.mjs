/**
 * ridgeline.test.mjs — testes do Ridgeline e da base de distribuição.
 *
 * O que sustenta um ridgeline é o EIXO X COMPARTILHADO: se cada curva
 * tivesse a própria escala horizontal, empilhá-las não compararia nada —
 * e o gráfico continuaria bonito.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import {
  prepararDistribuicoes,
  rotuloDaCategoria,
  linhasDeResumo,
} from '../src/charts/_distribuicao/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'ridgeline.js');

const cel = (v) => ({ value: v, rendered: v === null ? null : String(v) });

/** Contexto mínimo para exercitar a base sem passar pelo defineViz. */
function contextoDe(linhas, config = {}) {
  const data = linhas.map(([categoria, valor]) => ({ c: cel(categoria), v: cel(valor) }));
  const queryResponse = {
    fields: {
      dimension_like: [{ name: 'c', label: 'Categoria', label_short: 'Categoria', type: 'string' }],
      measure_like: [{ name: 'v', label: 'Valor', label_short: 'Valor', type: 'sum', is_numeric: true }],
      pivots: [],
    },
    pivots: [],
  };
  const avisos = [];
  return {
    modelo: construirModelo(data, queryResponse, {}),
    config,
    avisar: (m) => avisos.push(m),
    avisos,
  };
}


/**
 * Coordenadas Y de um caminho SVG.
 *
 * Um regex de ",numero" não serve: o d3 emite curvas como
 * `C x1,y1,x2,y2,x,y`, com vírgula entre TODOS os seis números, então
 * metade do que vem depois de vírgula é X. Como os números alternam X e Y
 * do começo ao fim, basta pegar os de índice ímpar.
 */
function coordenadasY(caminho) {
  const numeros = (caminho.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  return numeros.filter((_, i) => i % 2 === 1);
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.ridgeline;
  assert.ok(definicao, 'ridgeline não se registrou');

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
    faixas: Array.from(palco.querySelectorAll('.rl-faixa')),
    rotulos: Array.from(palco.querySelectorAll('.rl-rotulo')).map((t) => t.textContent),
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

test('_distribuicao — consulta agregada recebe explicação, não "sem dados"', (t) => {
  const ctx = contextoDe([
    ['A', 10],
    ['B', 20],
  ]);
  const resultado = prepararDistribuicoes(ctx);
  assert.ok(resultado.erro, 'um valor por categoria não é distribuição');
  assert.match(resultado.erro, /sem agregar/i, 'a mensagem precisa dizer o que fazer no Explore');
  t.diagnostic(resultado.erro.slice(0, 60));
});

test('_distribuicao — agrupa, resume e calcula limites de uma vez', (t) => {
  const ctx = contextoDe([
    ['A', 1], ['A', 2], ['A', 3], ['A', 100],
    ['B', 10], ['B', 11], ['B', 12],
  ]);
  const { grupos } = prepararDistribuicoes(ctx);

  assert.equal(grupos.length, 2);
  const a = grupos.find((g) => g.rotulo === 'A');
  assert.equal(a.resumo.n, 4);
  assert.equal(a.resumo.mediana, 2.5);
  assert.ok(a.limites.outliers.includes(100), 'o outlier precisa ser identificado aqui');
  t.diagnostic(`A: n=${a.resumo.n}, mediana=${a.resumo.mediana}`);
});

test('_distribuicao — ordenação por mediana funciona nos dois sentidos', (t) => {
  const linhas = [
    ['baixo', 1], ['baixo', 2], ['baixo', 3],
    ['alto', 100], ['alto', 101], ['alto', 102],
    ['meio', 50], ['meio', 51], ['meio', 52],
  ];

  const desc = prepararDistribuicoes(contextoDe(linhas, { ordemDasCategorias: 'medianaDesc' }));
  assert.deepEqual(desc.grupos.map((g) => g.rotulo), ['alto', 'meio', 'baixo']);

  const asc = prepararDistribuicoes(contextoDe(linhas, { ordemDasCategorias: 'medianaAsc' }));
  assert.deepEqual(asc.grupos.map((g) => g.rotulo), ['baixo', 'meio', 'alto']);

  const alfa = prepararDistribuicoes(contextoDe(linhas, { ordemDasCategorias: 'alfabetica' }));
  assert.deepEqual(alfa.grupos.map((g) => g.rotulo), ['alto', 'baixo', 'meio']);
  t.diagnostic('três ordenações conferidas');
});

test('_distribuicao — categorias demais são cortadas pelas de maior n', (t) => {
  // Cortar pelas primeiras da consulta descartaria justamente as que têm
  // distribuição para mostrar.
  const linhas = [];
  for (let i = 0; i < 10; i++) linhas.push([`pequena${i}`, i], [`pequena${i}`, i + 1]);
  for (let i = 0; i < 20; i++) linhas.push(['GRANDE', i]);

  const ctx = contextoDe(linhas, { maximoDeCategorias: 3 });
  const { grupos } = prepararDistribuicoes(ctx);

  assert.equal(grupos.length, 3);
  assert.ok(
    grupos.some((g) => g.rotulo === 'GRANDE'),
    'a categoria com mais observações não pode ser cortada'
  );
  assert.ok(ctx.avisos.some((a) => /categorias/.test(a)), 'o corte precisa ser anunciado');
  t.diagnostic(`mantidas: ${grupos.map((g) => g.rotulo).join(', ')}`);
});

test('_distribuicao — rótulo e tooltip trazem o n', (t) => {
  const ctx = contextoDe([['A', 1], ['A', 2], ['A', 3]]);
  const { grupos } = prepararDistribuicoes(ctx);

  assert.match(rotuloDaCategoria(grupos[0], {}), /n=3/, 'o n precisa aparecer no rótulo');
  assert.equal(rotuloDaCategoria(grupos[0], { mostrarContagem: false }), 'A');

  const linhas = linhasDeResumo(grupos[0], (v) => String(v));
  assert.equal(linhas[0].rotulo, 'Observações');
  assert.equal(linhas[0].valor, '3');
  assert.ok(
    linhas.some((l) => /poucas observações/i.test(l.valor)),
    'com n pequeno, a ressalva precisa estar no tooltip'
  );
  t.diagnostic('rótulo e tooltip conferidos');
});

test('ridgeline — todas as curvas compartilham o mesmo eixo X', (t) => {
  // É a propriedade que torna a comparação possível. Se cada curva tivesse
  // a própria escala, o empilhamento não compararia nada.
  const r = renderizar('grande5k');
  try {
    assert.ok(r.faixas.length >= 5, 'faltaram faixas');

    const extremos = r.faixas.map((faixa) => {
      const d = faixa.getAttribute('d') || '';
      const xs = [...d.matchAll(/[ML](-?[\d.]+),/g)].map((m) => Number(m[1]));
      return { minimo: Math.min(...xs), maximo: Math.max(...xs) };
    });

    const inicios = new Set(extremos.map((e) => Math.round(e.minimo / 10)));
    assert.ok(
      inicios.size <= r.faixas.length,
      'as curvas precisam viver na mesma escala horizontal'
    );
    // Nenhuma pode sair da área do gráfico.
    for (const e of extremos) {
      assert.ok(e.minimo >= 0 && e.maximo <= 900, 'curva fora da área do gráfico');
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.faixas.length} faixas no mesmo eixo`);
});

test('ridgeline — uma faixa, um contorno e um rótulo por categoria', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.equal(r.palco.querySelectorAll('.rl-contorno').length, r.faixas.length);
    assert.equal(r.rotulos.length, r.faixas.length);
    for (const rotulo of r.rotulos) {
      assert.match(rotulo, /n=\d+/, `o rótulo "${rotulo}" deveria trazer o n`);
    }
    for (const faixa of r.faixas) {
      const d = faixa.getAttribute('d') || '';
      assert.ok(d.length > 10 && !/NaN|Infinity/.test(d), 'faixa com caminho inválido');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.faixas.length} faixas completas`);
});

test('ridgeline — a sobreposição aumenta a ALTURA das curvas, não o espaçamento', (t) => {
  // As linhas de base são sempre igualmente espaçadas e preenchem a área.
  // O que a sobreposição faz é deixar a curva mais alta, invadindo a faixa
  // de cima. Medir espaçamento aqui testaria a coisa errada.
  const alturaDe = (r) =>
    r.faixas.map((faixa) => {
      const ys = coordenadasY(faixa.getAttribute('d') || '');
      return Math.max(...ys) - Math.min(...ys);
    });

  const junto = renderizar('grande5k', { sobreposicao: 80 });
  const separado = renderizar('grande5k', { sobreposicao: 0 });
  try {
    const somaJunto = alturaDe(junto).reduce((a, b) => a + b, 0);
    const somaSeparado = alturaDe(separado).reduce((a, b) => a + b, 0);
    assert.ok(
      somaJunto > somaSeparado * 1.5,
      `com 80% de sobreposição as curvas deveriam ser bem mais altas: ${somaJunto.toFixed(0)} vs ${somaSeparado.toFixed(0)}`
    );
  } finally {
    junto.fim();
    separado.fim();
  }
  t.diagnostic('efeito da sobreposição conferido');
});

test('ridgeline — nenhuma faixa escapa da área do gráfico', (t) => {
  // Com sobreposição alta, a conta antiga empurrava a última faixa para
  // fora da área — e ela sumia sem erro nenhum.
  for (const sobreposicao of [0, 55, 90]) {
    const r = renderizar('grande5k', { sobreposicao });
    try {
      for (const faixa of r.faixas) {
        const ys = coordenadasY(faixa.getAttribute('d') || '');
        assert.ok(
          Math.max(...ys) <= 560 + 1,
          `sobreposição ${sobreposicao}: faixa passou do rodapé (y=${Math.max(...ys).toFixed(0)})`
        );
        assert.ok(Math.min(...ys) >= -1, `sobreposição ${sobreposicao}: faixa passou do topo`);
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic('faixas contidas na área em três níveis de sobreposição');
});

test('ridgeline — consulta agregada mostra a explicação', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.equal(r.faixas.length, 0);
    assert.match(r.vazio, /um único valor/i);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
