/**
 * diagrama_venn.test.mjs — testes específicos do Diagrama de Venn.
 *
 * O que mais pode dar errado aqui é silencioso: uma região do desenho que
 * não existe (e o valor somem sem aviso), ou a leitura errada de um dos três
 * formatos de dados. Então testamos as duas coisas de frente.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { layoutDeConjuntos, posicoesDasRegioes } from '../src/charts/diagrama_venn/geometria.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'diagrama_venn.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.diagrama_venn;
  assert.ok(definicao, 'diagrama_venn não se registrou');

  const instancia = criarInstancia(definicao, amb.chamadasDeApi);
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  const palco = amb.window.document.getElementById('palco');

  instancia.create(palco, configPadrao(definicao));
  const config = Object.assign(configPadrao(definicao), ajustes);
  let chamouDone = false;
  instancia.updateAsync(data, palco, config, queryResponse, {}, () => { chamouDone = true; });
  assert.ok(chamouDone, 'done() precisa ser chamado sempre');

  const valoresDesenhados = Array.from(palco.querySelectorAll('.venn-valor')).map((t) => t.textContent);
  const naLista = Array.from(palco.querySelectorAll('.venn-lista div')).map((d) => d.textContent);

  return {
    amb,
    palco,
    formas: palco.querySelectorAll('.venn-forma').length,
    nomes: Array.from(palco.querySelectorAll('.venn-rotulo-conjunto')).map((t) => t.textContent),
    valoresDesenhados,
    naLista,
    /** Toda região aparece: ou com o número dentro, ou na lista do canto. */
    totalDeRegioes: valoresDesenhados.length + naLista.length,
    fim: () => amb.restaurar(),
  };
}

test('diagrama_venn — a geometria produz TODAS as regiões de 2 a 5 conjuntos', (t) => {
  for (const quantidade of [2, 3, 4, 5]) {
    const elipses = layoutDeConjuntos(quantidade, { largura: 600, altura: 600 });
    const regioes = posicoesDasRegioes(elipses, { largura: 600, altura: 600, passos: 220 });
    const esperado = 2 ** quantidade - 1;

    const faltando = [];
    for (let mascara = 1; mascara <= esperado; mascara++) {
      if (!regioes.has(mascara)) faltando.push(mascara.toString(2).padStart(quantidade, '0'));
    }
    assert.deepEqual(
      faltando,
      [],
      `com ${quantidade} conjuntos faltaram regiões no layout: ${faltando.join(', ')}`
    );
    t.diagnostic(`${quantidade} conjuntos: ${regioes.size}/${esperado} regiões`);
  }
});

test('diagrama_venn — formato (a): uma linha por região', (t) => {
  const r = renderizar('conjuntos3');
  try {
    assert.equal(r.formas, 3, 'deveria desenhar 3 formas');
    assert.equal(r.totalDeRegioes, 7, 'as 7 regiões de 3 conjuntos precisam aparecer');

    // A fixture tem A=120, A∩B=35, A∩C=25, A∩B∩C=10 → total de A = 190.
    assert.ok(
      r.nomes.some((n) => n.includes('A') && n.includes('190')),
      `o total do conjunto A deveria ser 190; veio: ${r.nomes.join(' | ')}`
    );
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`regiões: ${r.valoresDesenhados.join(', ')}`);
});

test('diagrama_venn — formato (b): uma linha por item e conjunto', (t) => {
  const r = renderizar('conjuntosPorItem');
  try {
    assert.equal(r.formas, 3, 'os 3 produtos deveriam virar 3 conjuntos');
    assert.equal(r.totalDeRegioes, 7, 'faltou alguma das 7 regiões');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`conjuntos: ${r.nomes.join(' | ')}`);
});

test('diagrama_venn — formato (c): colunas sim/não', (t) => {
  const r = renderizar('conjuntosBooleanos');
  try {
    assert.equal(r.formas, 3, 'as 3 colunas sim/não deveriam virar 3 conjuntos');
    assert.ok(
      r.nomes.some((n) => n.includes('Café')),
      `o nome do conjunto deveria vir do rótulo da coluna; veio: ${r.nomes.join(' | ')}`
    );
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`conjuntos: ${r.nomes.join(' | ')}`);
});

test('diagrama_venn — nenhum valor some com 4 e 5 conjuntos', (t) => {
  for (const [fixture, regioesComDados] of [['conjuntos4', 15], ['conjuntos5', 13]]) {
    const r = renderizar(fixture);
    try {
      assert.equal(
        r.totalDeRegioes,
        regioesComDados,
        `${fixture}: ${r.totalDeRegioes} regiões mostradas, esperado ${regioesComDados}`
      );
      t.diagnostic(`${fixture}: ${r.valoresDesenhados.length} no desenho, ${r.naLista.length} na lista do canto`);
    } finally {
      r.fim();
    }
  }
});

test('diagrama_venn — mais de 5 conjuntos avisa em vez de desenhar errado', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(BUNDLE, 'utf8'));
    const definicao = amb.registro.diagrama_venn;
    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const palco = amb.window.document.getElementById('palco');

    // Sete conjuntos numa dimensão só.
    const celula = (v) => ({ value: v, rendered: String(v) });
    const data = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A,B'].map((r) => ({
      regiao: celula(r),
      itens: celula(10),
    }));
    const queryResponse = {
      fields: {
        dimension_like: [{ name: 'regiao', label: 'Conjuntos', label_short: 'Conjuntos', type: 'string' }],
        measure_like: [{ name: 'itens', label: 'Itens', label_short: 'Itens', type: 'count', is_numeric: true }],
        pivots: [],
      },
      pivots: [],
    };

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    assert.equal(palco.querySelectorAll('.venn-forma').length, 5, 'deveria desenhar no máximo 5 formas');
    assert.match(
      palco.querySelector('.bl-aviso')?.textContent || '',
      /7 conjuntos/,
      'o usuário precisa ser avisado de que conjuntos foram deixados de fora'
    );
  } finally {
    amb.restaurar();
  }
  t.diagnostic('limite de 5 conjuntos conferido');
});
