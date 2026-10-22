/**
 * estatistica.test.mjs — testes do núcleo estatístico.
 *
 * Estas contas alimentam seis gráficos do TIER 3. Um erro aqui aparece em
 * todos eles ao mesmo tempo, sempre com um número plausível. Por isso os
 * testes conferem contra valores CALCULADOS À MÃO ou contra propriedades
 * matemáticas que têm que valer sempre.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  limparEOrdenar,
  quantil,
  resumoDeDistribuicao,
  limitesDeOutlier,
  densidadePorKernel,
  larguraDeBandaSilverman,
  acumuladaEmpirica,
  regressaoLinear,
  correlacaoDePearson,
  quantilNormalPadrao,
  densidadeNormal,
} from '../src/core/estatistica.js';

const perto = (a, b, tolerancia = 1e-9) => Math.abs(a - b) < tolerancia;

test('estatistica — limparEOrdenar descarta o que não é número', (t) => {
  assert.deepEqual(limparEOrdenar([3, null, 1, undefined, NaN, 2, Infinity]), [1, 2, 3]);
  assert.deepEqual(limparEOrdenar([]), []);
  // Não pode alterar o array original.
  const original = [3, 1, 2];
  limparEOrdenar(original);
  assert.deepEqual(original, [3, 1, 2], 'a entrada precisa ficar intacta');
  t.diagnostic('limpeza conferida');
});

test('estatistica — quantil tipo 7 bate com o R', (t) => {
  // quantile(c(1,2,3,4), c(0,0.25,0.5,0.75,1)) no R dá 1, 1.75, 2.5, 3.25, 4.
  const v = [1, 2, 3, 4];
  assert.ok(perto(quantil(v, 0), 1));
  assert.ok(perto(quantil(v, 0.25), 1.75), `q1 deveria ser 1,75, veio ${quantil(v, 0.25)}`);
  assert.ok(perto(quantil(v, 0.5), 2.5));
  assert.ok(perto(quantil(v, 0.75), 3.25));
  assert.ok(perto(quantil(v, 1), 4));

  assert.equal(quantil([], 0.5), null, 'sem valores não há quantil');
  assert.equal(quantil([7], 0.25), 7, 'um valor só é todos os quantis');
  t.diagnostic('quantis conferidos contra o R');
});

test('estatistica — resumo traz os cinco números e o desvio amostral', (t) => {
  const resumo = resumoDeDistribuicao([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(resumo.n, 8);
  assert.equal(resumo.minimo, 2);
  assert.equal(resumo.maximo, 9);
  assert.ok(perto(resumo.media, 5));
  assert.ok(perto(resumo.mediana, 4.5));

  // Desvio AMOSTRAL (n−1): a população daria 2, a amostra dá ~2,138.
  assert.ok(
    perto(resumo.desvio, Math.sqrt(32 / 7), 1e-9),
    `desvio amostral errado: ${resumo.desvio}`
  );
  assert.ok(perto(resumo.iqr, resumo.q3 - resumo.q1));
  assert.equal(resumoDeDistribuicao([]), null);
  t.diagnostic(`média ${resumo.media}, desvio ${resumo.desvio.toFixed(4)}`);
});

test('estatistica — bigodes param no último valor REAL dentro do limite', (t) => {
  // Desenhar o limite calculado sugeriria um dado que não existe.
  const resumo = resumoDeDistribuicao([1, 2, 3, 4, 5, 100]);
  const limites = limitesDeOutlier(resumo);

  assert.ok(limites.outliers.includes(100), '100 é claramente um outlier aqui');
  assert.equal(limites.bigodeSuperior, 5, 'o bigode para no 5, não no limite calculado');
  assert.equal(limites.bigodeInferior, 1);
  assert.ok(limites.superior > 5, 'o limite em si fica acima do bigode');
  t.diagnostic(`bigodes ${limites.bigodeInferior}–${limites.bigodeSuperior}, ${limites.outliers.length} outlier(s)`);
});

test('estatistica — sem outliers, os bigodes são o mínimo e o máximo', (t) => {
  const limites = limitesDeOutlier(resumoDeDistribuicao([10, 11, 12, 13, 14]));
  assert.equal(limites.outliers.length, 0);
  assert.equal(limites.bigodeInferior, 10);
  assert.equal(limites.bigodeSuperior, 14);
  t.diagnostic('caso sem outliers conferido');
});

test('estatistica — a densidade integra aproximadamente 1', (t) => {
  // É a propriedade que define uma densidade. Se não vale, a curva está
  // normalizada errado e todos os violinos saem com altura mentirosa.
  const valores = Array.from({ length: 200 }, (_, i) => Math.sin(i) * 10 + i * 0.1);
  const { curva } = densidadePorKernel({ valores, pontos: 400 });

  let area = 0;
  for (let i = 1; i < curva.length; i++) {
    const base = curva[i].x - curva[i - 1].x;
    area += ((curva[i].densidade + curva[i - 1].densidade) / 2) * base;
  }
  assert.ok(Math.abs(area - 1) < 0.02, `a área sob a densidade deveria ser ~1, veio ${area.toFixed(4)}`);
  t.diagnostic(`área = ${area.toFixed(4)}`);
});

test('estatistica — a densidade é sempre não negativa e cai nas caudas', (t) => {
  const { curva, maximo } = densidadePorKernel({ valores: [5, 5, 5, 6, 7], pontos: 50 });
  assert.ok(curva.every((p) => p.densidade >= 0), 'densidade negativa não existe');
  assert.ok(maximo > 0, 'a curva precisa ter um pico');
  assert.ok(
    curva[0].densidade < maximo / 2 && curva[curva.length - 1].densidade < maximo / 2,
    'as pontas precisam estar bem abaixo do pico'
  );
  t.diagnostic(`${curva.length} pontos, pico ${maximo.toFixed(4)}`);
});

test('estatistica — a banda de Silverman resiste a um outlier', (t) => {
  // Com desvio puro, um único valor distante alarga a banda e achata a
  // distribuição inteira — escondendo o que o gráfico deveria mostrar.
  const base = [10, 11, 12, 11, 10, 12, 11];
  const comOutlier = [...base, 1000];

  const bandaBase = larguraDeBandaSilverman(resumoDeDistribuicao(base));
  const bandaComOutlier = larguraDeBandaSilverman(resumoDeDistribuicao(comOutlier));

  assert.ok(bandaBase > 0 && bandaComOutlier > 0, 'a banda precisa ser positiva');
  assert.ok(
    bandaComOutlier < bandaBase * 5,
    `um outlier não pode multiplicar a banda: ${bandaBase.toFixed(3)} → ${bandaComOutlier.toFixed(3)}`
  );
  t.diagnostic(`banda ${bandaBase.toFixed(3)} → ${bandaComOutlier.toFixed(3)}`);
});

test('estatistica — a acumulada empírica vai de 1/n até 1', (t) => {
  const pontos = acumuladaEmpirica([3, 1, 2, 5, 4]);
  assert.equal(pontos.length, 5);
  assert.ok(perto(pontos[0].p, 0.2), 'o primeiro ponto é 1/n');
  assert.ok(perto(pontos[4].p, 1), 'o último é exatamente 1');
  assert.deepEqual(pontos.map((p) => p.x), [1, 2, 3, 4, 5], 'os valores saem ordenados');
  for (let i = 1; i < pontos.length; i++) {
    assert.ok(pontos[i].p > pontos[i - 1].p, 'a acumulada só cresce');
  }
  t.diagnostic('ECDF conferida');
});

test('estatistica — regressão acha a reta exata quando os pontos são colineares', (t) => {
  // y = 3x + 2, sem ruído: tem que sair exato e com R² igual a 1.
  const pontos = [0, 1, 2, 3, 4].map((x) => ({ x, y: 3 * x + 2 }));
  const r = regressaoLinear(pontos);

  assert.ok(perto(r.inclinacao, 3), `inclinação errada: ${r.inclinacao}`);
  assert.ok(perto(r.intercepto, 2), `intercepto errado: ${r.intercepto}`);
  assert.ok(perto(r.r2, 1), `R² deveria ser 1, veio ${r.r2}`);
  assert.ok(perto(r.previsto(10), 32), 'a previsão precisa seguir a reta');
  t.diagnostic(`y = ${r.inclinacao}x + ${r.intercepto}`);
});

test('estatistica — regressão sem variação em X devolve null', (t) => {
  // Uma reta vertical não é função de x. Inventar uma seria pior.
  assert.equal(regressaoLinear([{ x: 5, y: 1 }, { x: 5, y: 9 }]), null);
  assert.equal(regressaoLinear([{ x: 1, y: 1 }]), null, 'um ponto não define reta');
  assert.equal(regressaoLinear([]), null);
  t.diagnostic('casos degenerados conferidos');
});

test('estatistica — correlação de Pearson tem sinal e limites certos', (t) => {
  const crescente = [0, 1, 2, 3].map((x) => ({ x, y: 2 * x }));
  const decrescente = [0, 1, 2, 3].map((x) => ({ x, y: -2 * x }));

  assert.ok(perto(correlacaoDePearson(crescente), 1), 'relação crescente perfeita dá +1');
  assert.ok(perto(correlacaoDePearson(decrescente), -1), 'decrescente perfeita dá −1');

  const comRuido = [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 3, y: 4 },
    { x: 4, y: 3 },
  ];
  const r = correlacaoDePearson(comRuido);
  assert.ok(r > -1 && r < 1, 'com ruído a correlação fica estritamente entre −1 e 1');
  t.diagnostic(`correlação com ruído: ${r.toFixed(4)}`);
});

test('estatistica — quantil da normal bate com os valores de tabela', (t) => {
  assert.ok(perto(quantilNormalPadrao(0.5), 0, 1e-9), 'a mediana da normal é zero');
  assert.ok(Math.abs(quantilNormalPadrao(0.975) - 1.959964) < 1e-5, 'o 97,5% é 1,95996');
  assert.ok(Math.abs(quantilNormalPadrao(0.025) + 1.959964) < 1e-5, 'e é simétrico');
  assert.ok(Math.abs(quantilNormalPadrao(0.95) - 1.644854) < 1e-5, 'o 95% é 1,64485');
  assert.equal(quantilNormalPadrao(0), null, 'as pontas não têm quantil finito');
  assert.equal(quantilNormalPadrao(1), null);
  t.diagnostic('quantis normais conferidos contra tabela');
});

test('estatistica — densidade normal tem o pico no lugar certo', (t) => {
  // No pico, a densidade vale 1/(σ√(2π)).
  const esperado = 1 / (2 * Math.sqrt(2 * Math.PI));
  assert.ok(perto(densidadeNormal(10, 10, 2), esperado, 1e-12));
  assert.ok(densidadeNormal(14, 10, 2) < densidadeNormal(11, 10, 2), 'cai ao se afastar da média');
  assert.equal(densidadeNormal(1, 0, 0), 0, 'desvio zero não tem densidade');
  t.diagnostic('densidade normal conferida');
});
