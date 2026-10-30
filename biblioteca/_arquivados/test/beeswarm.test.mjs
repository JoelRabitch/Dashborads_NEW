/**
 * beeswarm.test.mjs — testes do Beeswarm.
 *
 * O beeswarm tem uma promessa só: TODO ponto está desenhado e NENHUM cobre
 * o outro. Um empacotamento errado continua bonito — os pontos simplesmente
 * se encavalam, e o olho lê como "menos observações do que existem".
 * Então é isso que medimos: contagem e distância mínima entre pares.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { empacotar } from '../src/charts/beeswarm/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'beeswarm.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.beeswarm;
  assert.ok(definicao, 'beeswarm não se registrou');

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

  const circulos = Array.from(palco.querySelectorAll('circle.bs-marca')).map((c) => ({
    x: Number(c.getAttribute('cx')),
    y: Number(c.getAttribute('cy')),
    r: Number(c.getAttribute('r')),
  }));

  return {
    amb,
    palco,
    circulos,
    nota: palco.querySelector('.bs-nota')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    canvas: palco.querySelector('canvas.bs-canvas'),
    fim: () => amb.restaurar(),
  };
}

/** Menor distância entre dois pontos quaisquer (O(n log n) por varredura). */
function menorDistancia(pontos) {
  const ordenados = pontos.slice().sort((a, b) => a.x - b.x);
  let menor = Infinity;
  for (let i = 0; i < ordenados.length; i++) {
    for (let j = i + 1; j < ordenados.length; j++) {
      const dx = ordenados[j].x - ordenados[i].x;
      if (dx >= menor) break; // ordenado por x: ninguém à frente chega mais perto
      const dy = ordenados[j].y - ordenados[i].y;
      menor = Math.min(menor, Math.hypot(dx, dy));
    }
  }
  return menor;
}

test('empacotar — nenhum ponto cobre o outro', (t) => {
  // Valores propositalmente repetidos: é o caso em que o empacotamento
  // precisa trabalhar, porque todos querem a mesma posição no eixo.
  const valores = [];
  for (let i = 0; i < 300; i++) valores.push(10 + (i % 5));

  const raio = 4;
  const colocados = empacotar({ valores, posicaoDoValor: (v) => v * 20, raio });

  assert.equal(colocados.length, 300, 'nenhuma observação pode sumir');

  const pontos = colocados.map((p) => ({ x: p.eixo, y: p.deslocamento }));
  const menor = menorDistancia(pontos);
  assert.ok(
    menor >= raio * 2 - 1e-6,
    `dois pontos ficaram a ${menor.toFixed(3)}px, menos que o diâmetro ${raio * 2}`
  );
  t.diagnostic(`300 pontos, menor distância ${menor.toFixed(2)}px (diâmetro ${raio * 2})`);
});

test('empacotar — o enxame fica centrado, não empurrado para um lado', (t) => {
  // Escolher sempre o primeiro deslocamento livre (só para a direita)
  // produziria uma escada, não um enxame. O teste é a simetria.
  const valores = Array.from({ length: 200 }, () => 50);
  const colocados = empacotar({ valores, posicaoDoValor: () => 100, raio: 3 });

  const deslocamentos = colocados.map((p) => p.deslocamento);
  const media = deslocamentos.reduce((a, b) => a + b, 0) / deslocamentos.length;
  const extensao = Math.max(...deslocamentos) - Math.min(...deslocamentos);

  assert.ok(Math.abs(media) < extensao * 0.1, `o enxame pendeu para um lado (média ${media.toFixed(1)})`);
  assert.ok(Math.min(...deslocamentos) < 0, 'faltaram pontos à esquerda');
  assert.ok(Math.max(...deslocamentos) > 0, 'faltaram pontos à direita');
  t.diagnostic(`extensão ${extensao.toFixed(0)}px, centro em ${media.toFixed(2)}`);
});

test('empacotar — valor isolado fica exatamente no centro', (t) => {
  const colocados = empacotar({ valores: [1, 100], posicaoDoValor: (v) => v * 10, raio: 2 });
  assert.equal(colocados[0].deslocamento, 0);
  assert.equal(colocados[1].deslocamento, 0);
  t.diagnostic('pontos sem vizinho não são deslocados');
});

test('empacotar — aguenta 5.000 pontos sem explodir em tempo', (t) => {
  // O algoritmo ingênuo (comparar com todos) é O(n²): aqui seriam 12,5
  // milhões de comparações. A janela deslizante mantém isso local.
  const valores = Array.from({ length: 5000 }, (_, i) => Math.sin(i) * 50 + 50);
  const inicio = Date.now();
  const colocados = empacotar({ valores, posicaoDoValor: (v) => v * 6, raio: 3 });
  const ms = Date.now() - inicio;

  assert.equal(colocados.length, 5000);
  assert.ok(ms < 3000, `empacotar 5.000 pontos levou ${ms}ms`);
  t.diagnostic(`5.000 pontos em ${ms}ms`);
});

test('empacotar — ignora nulos e não-finitos em vez de desenhar NaN', (t) => {
  const colocados = empacotar({
    valores: [1, null, 2, NaN, 3, Infinity],
    posicaoDoValor: (v) => v * 50,
    raio: 2,
  });
  assert.equal(colocados.length, 3);
  assert.ok(colocados.every((p) => Number.isFinite(p.deslocamento)));
  t.diagnostic('3 pontos válidos de 6 entradas');
});

test('beeswarm — desenha uma marca por observação', (t) => {
  const r = renderizar('conjuntosPorItem');
  try {
    assert.ok(r.circulos.length > 0, 'nenhum ponto desenhado');
    assert.match(r.nota, /observações/, 'a nota precisa declarar quantas observações existem');

    const declarado = Number((r.nota.match(/^([\d.]+)/) || [])[1].replace(/\./g, ''));
    assert.equal(
      r.circulos.length,
      declarado,
      `a nota fala em ${declarado} observações mas há ${r.circulos.length} pontos`
    );
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.circulos.length} pontos desenhados`);
});

test('beeswarm — os pontos desenhados também não se cobrem', (t) => {
  const r = renderizar('conjuntosPorItem', { tamanhoDoPonto: 4, espacoEntrePontos: 0 });
  try {
    const menor = menorDistancia(r.circulos);
    const raio = r.circulos[0].r;
    assert.ok(
      menor >= raio * 2 - 0.5,
      `dois pontos a ${menor.toFixed(2)}px com raio ${raio} — estão se cobrindo`
    );
  } finally {
    r.fim();
  }
  t.diagnostic('sem sobreposição no desenho final');
});

test('beeswarm — nenhum ponto escapa da área do gráfico', (t) => {
  for (const orientacao of ['vertical', 'horizontal']) {
    const r = renderizar('conjuntosPorItem', { orientacao });
    try {
      for (const p of r.circulos) {
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${orientacao}: ponto com NaN`);
        assert.ok(p.x >= -1 && p.x <= 901, `${orientacao}: ponto fora à direita/esquerda (x=${p.x})`);
        assert.ok(p.y >= -1 && p.y <= 561, `${orientacao}: ponto fora em cima/baixo (y=${p.y})`);
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic('pontos contidos nas duas orientações');
});

test('beeswarm — acima do limite cai para canvas em vez de travar', (t) => {
  // 5.000 círculos em SVG é o caminho para o navegador engasgar. O canvas
  // desenha tudo numa passada; a nota avisa que foi o que aconteceu.
  // Agrupando por região (poucas categorias) as 5.000 linhas viram 5.000
  // observações de verdade, que é o caso que força a troca.
  const r = renderizar('grande5k', { campoDaCategoria: 'regiao' });
  try {
    assert.equal(r.circulos.length, 0, 'acima de 2.000 pontos o SVG não deveria ser usado');
    assert.ok(r.canvas, 'sem SVG e sem canvas: os pontos sumiram');
    assert.match(r.nota, /canvas/i, 'a troca de técnica precisa estar declarada');
    assert.match(r.nota, /5\.000 observações/, 'a contagem real precisa continuar declarada');
  } finally {
    r.fim();
  }
  t.diagnostic(`caiu para canvas: ${r.nota.slice(0, 60)}`);
});

test('beeswarm — enxame maior que a faixa é denunciado, não disfarçado', (t) => {
  // Quando os pontos não cabem, eles se encavalam na borda. O desenho
  // continua plausível e passa a mostrar menos observações do que existem,
  // então a sobreposição precisa ser dita em voz alta.
  const r = renderizar('grande5k', { campoDaCategoria: 'regiao', tamanhoDoPonto: 16 });
  try {
    assert.match(
      r.aviso,
      /sobrepostos/i,
      `faltou o aviso de sobreposição; veio: "${r.aviso}"`
    );
  } finally {
    r.fim();
  }
  t.diagnostic('estouro de faixa declarado');
});

test('beeswarm — consulta agregada explica em vez de mostrar "sem dados"', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.equal(r.circulos.length, 0);
    assert.match(r.vazio, /um único valor/i);
    assert.match(r.vazio, /sem agregar/i);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio explicativo conferido');
});

test('beeswarm — a mediana é traçada onde a mediana está', (t) => {
  const r = renderizar('conjuntosPorItem', { mostrarMediana: true, orientacao: 'vertical' });
  try {
    const tracos = Array.from(r.palco.querySelectorAll('line.bs-marca'));
    assert.ok(tracos.length > 0, 'nenhum traço de mediana');

    // Cada traço horizontal deve cortar a nuvem da própria categoria: existe
    // ponto acima e abaixo dele dentro da faixa horizontal do traço.
    for (const traco of tracos) {
      const y = Number(traco.getAttribute('y1'));
      const x1 = Number(traco.getAttribute('x1'));
      const x2 = Number(traco.getAttribute('x2'));
      const daFaixa = r.circulos.filter((p) => p.x >= x1 - 2 && p.x <= x2 + 2);
      if (daFaixa.length < 3) continue;
      assert.ok(
        daFaixa.some((p) => p.y < y) && daFaixa.some((p) => p.y > y),
        'a mediana precisa cortar a nuvem, não ficar fora dela'
      );
    }
  } finally {
    r.fim();
  }
  t.diagnostic('medianas cortando os enxames');
});
