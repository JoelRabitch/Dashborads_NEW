/**
 * lorenz_gini.test.mjs — testes da Curva de Lorenz / Gini.
 *
 * O coeficiente de Gini tem valores teóricos conhecidos para distribuições
 * simples. São eles que os testes usam: é a única forma de saber que a
 * conta está certa, já que um Gini errado produz um número plausível.
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
  montarLorenz,
  concentracaoDosMaiores,
  descreverGini,
} from '../src/charts/lorenz_gini/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'lorenz_gini.js');

const cel = (v) => ({ value: v, rendered: v === null ? null : String(v) });

function lorenzDe(valores) {
  const data = valores.map((v, i) => ({ c: cel(`c${i}`), v: cel(v) }));
  const queryResponse = {
    fields: {
      dimension_like: [{ name: 'c', label: 'Categoria', label_short: 'Categoria', type: 'string' }],
      measure_like: [{ name: 'v', label: 'Valor', label_short: 'Valor', type: 'sum', is_numeric: true }],
      pivots: [],
    },
    pivots: [],
  };
  const modelo = construirModelo(data, queryResponse, {});
  return montarLorenz({
    modelo,
    campoDaCategoria: modelo.dimensoes[0],
    medida: modelo.medidas[0],
  });
}

const perto = (a, b, tolerancia = 1e-9) => Math.abs(a - b) < tolerancia;

test('lorenz_gini — igualdade perfeita dá Gini zero', (t) => {
  const { gini, pontos } = lorenzDe([10, 10, 10, 10]);
  assert.ok(perto(gini, 0), `esperado 0, veio ${gini}`);
  // Com igualdade, a curva É a diagonal.
  for (const ponto of pontos) {
    assert.ok(perto(ponto.valor, ponto.populacao), 'a curva deveria coincidir com a diagonal');
  }
  t.diagnostic(`gini = ${gini}`);
});

test('lorenz_gini — concentração total dá o máximo teórico 1 − 1/n', (t) => {
  // Com n categorias discretas, o Gini não chega a 1: o teto é 1 − 1/n.
  for (const n of [4, 10, 50]) {
    const valores = new Array(n).fill(0);
    valores[n - 1] = 100;
    const { gini } = lorenzDe(valores);
    assert.ok(
      perto(gini, 1 - 1 / n, 1e-9),
      `com n=${n} o máximo é ${1 - 1 / n}, veio ${gini}`
    );
  }
  t.diagnostic('máximo teórico conferido para n = 4, 10 e 50');
});

test('lorenz_gini — valores conhecidos batem com a teoria', (t) => {
  // [1,3]: média 2, Gini = 0,25.
  assert.ok(perto(lorenzDe([1, 3]).gini, 0.25, 1e-9), 'par [1,3] deveria dar 0,25');

  // Sequência 1..n tem Gini exatamente (n−1)/(3n).
  for (const n of [10, 20, 100]) {
    const valores = Array.from({ length: n }, (_, i) => i + 1);
    const esperado = (n - 1) / (3 * n);
    const { gini } = lorenzDe(valores);
    assert.ok(perto(gini, esperado, 1e-9), `1..${n} deveria dar ${esperado}, veio ${gini}`);
  }
  t.diagnostic('fórmulas fechadas conferidas');
});

test('lorenz_gini — a curva é monótona e vai de (0,0) a (1,1)', (t) => {
  const { pontos } = lorenzDe([5, 1, 90, 3, 1]);
  assert.ok(perto(pontos[0].populacao, 0) && perto(pontos[0].valor, 0), 'a curva começa na origem');
  const ultimo = pontos[pontos.length - 1];
  assert.ok(perto(ultimo.populacao, 1) && perto(ultimo.valor, 1), 'e termina em (100%, 100%)');

  for (let i = 1; i < pontos.length; i++) {
    assert.ok(pontos[i].populacao > pontos[i - 1].populacao, 'a população sempre avança');
    assert.ok(pontos[i].valor >= pontos[i - 1].valor, 'o valor acumulado nunca desce');
    assert.ok(
      pontos[i].valor <= pontos[i].populacao + 1e-9,
      'ordenando do menor para o maior, a curva fica SOB a diagonal'
    );
  }
  t.diagnostic(`${pontos.length} pontos, curva monótona`);
});

test('lorenz_gini — valores negativos ficam de fora, com aviso', (t) => {
  const { avisos, quantidade } = lorenzDe([-5, 10, 20]);
  assert.equal(quantidade, 2, 'a categoria negativa não entra na conta');
  assert.ok(
    avisos.some((a) => /negativo/i.test(a)),
    `o usuário precisa saber o que saiu; avisos: ${avisos.join(' | ')}`
  );
  t.diagnostic(`avisos: ${avisos.join(' | ')}`);
});

test('lorenz_gini — concentração dos maiores confere com a conta direta', (t) => {
  // Dez categorias iguais: os 10% maiores concentram exatamente 10%.
  const iguais = lorenzDe(new Array(10).fill(7));
  assert.ok(perto(iguais.top10, 0.1, 1e-9), `esperado 10%, veio ${iguais.top10}`);
  assert.ok(perto(iguais.top20, 0.2, 1e-9));

  // Uma categoria com tudo: os 10% maiores concentram 100%.
  const concentrado = lorenzDe([0, 0, 0, 0, 0, 0, 0, 0, 0, 100]);
  assert.ok(perto(concentrado.top10, 1, 1e-9), `esperado 100%, veio ${concentrado.top10}`);

  assert.equal(concentracaoDosMaiores([], 0.1), 0, 'sem pontos não há concentração');
  t.diagnostic('marcos de concentração conferidos');
});

test('lorenz_gini — a descrição em palavras acompanha o número', (t) => {
  assert.match(descreverGini(0.05), /uniforme/i);
  assert.match(descreverGini(0.3), /baixa/i);
  assert.match(descreverGini(0.45), /moderada/i);
  assert.match(descreverGini(0.6), /alta/i);
  assert.match(descreverGini(0.85), /muito alta/i);
  t.diagnostic('faixas de leitura conferidas');
});

test('lorenz_gini — desenha curva, diagonal e Gini em destaque', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(BUNDLE, 'utf8'));
    const definicao = amb.registro.lorenz_gini;
    assert.ok(definicao, 'lorenz_gini não se registrou');

    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const { data, queryResponse } = FIXTURES.semPivo();
    const palco = amb.window.document.getElementById('palco');

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    const curva = palco.querySelector('.lg-curva');
    assert.ok(curva, 'faltou a curva');
    assert.ok(!/NaN/.test(curva.getAttribute('d') || ''), 'curva com NaN');
    assert.ok(palco.querySelector('.lg-preenchimento'), 'faltou a área do Gini');

    const gini = palco.querySelector('.lg-gini-valor')?.textContent || '';
    assert.match(gini, /^0\.\d{3}$/, `o Gini deveria aparecer com três casas; veio "${gini}"`);
    assert.match(
      palco.querySelector('.lg-nota')?.textContent || '',
      /10% maiores concentram/,
      'faltou a leitura prática da concentração'
    );
    assert.equal(amb.chamadasDeApi.erros.length, 0);
  } finally {
    amb.restaurar();
  }
  t.diagnostic('desenho conferido');
});
