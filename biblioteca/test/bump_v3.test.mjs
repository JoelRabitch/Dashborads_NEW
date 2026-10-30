/**
 * bump_v3.test.mjs — alinhamento do bump_chart (melhorias v3, 5.6).
 *
 * Testes de GEOMETRIA sobre os números do desenho (o jsdom não faz
 * layout): larguras de texto pela função única `medida-texto.js`.
 * Fixture sintética `bumpLongo`: 11 séries × 7 períodos, só 5 séries nos
 * dois últimos, valores grandes, rótulos com percentual. O tile salva
 * `curvaDaLinha: catmull` (4.1). Conferir no Looker real: TESTE_NO_LOOKER.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { larguraDoTexto } from '../src/core/medida-texto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

const SALVO = { curvaDaLinha: 'catmull', mostrarRotulos: true, conteudoDoRotulo: 'valorPercentual' };

function desenhar(ajustes = {}, { largura = 900, altura = 560 } = {}) {
  const amb = montarAmbiente();
  // Tamanho do tile (o ambiente finge 900×560 em todo elemento).
  Object.defineProperty(amb.window.Element.prototype, 'clientWidth', { get: () => largura, configurable: true });
  Object.defineProperty(amb.window.Element.prototype, 'clientHeight', { get: () => altura, configurable: true });
  amb.window.eval(readFileSync(join(DIST, 'bump_chart.js'), 'utf8'));
  const definicao = amb.registro.bump_chart;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES.bumpLongo();
  const cfg = () => Object.assign(configPadrao(definicao), SALVO, ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  const svg = palco.querySelector('svg.bp-svg');
  return { amb, palco, svg, fim: () => amb.restaurar() };
}

const num = (el, a) => Number(el.getAttribute(a));

/** Caixa estimada de um <text> (x/y no centro vertical: dominant-baseline central). */
function caixa(el) {
  const tamanho = Number(el.getAttribute('font-size')) || 11;
  const w = larguraDoTexto(el.textContent, tamanho, { negrito: el.getAttribute('font-weight') === '700' });
  const x = num(el, 'x');
  const ancora = el.getAttribute('text-anchor') || 'start';
  const x0 = ancora === 'middle' ? x - w / 2 : ancora === 'end' ? x - w : x;
  const y = num(el, 'y');
  const base = el.getAttribute('dominant-baseline');
  const y0 = base === 'central' ? y - tamanho / 2 : y - tamanho * 0.8;
  return { x0, x1: x0 + w, y0, y1: y0 + tamanho };
}

test('5.6 (a) — o rótulo de valor fica na altura do centro do círculo, a uma distância horizontal fixa', () => {
  const r = desenhar();
  try {
    const rotulos = Array.from(r.svg.querySelectorAll('.bp-valor')).filter((e) => e.getAttribute('display') !== 'none');
    assert.ok(rotulos.length >= 5, `poucos rótulos de valor: ${rotulos.length}`);
    const deslocamentos = new Set();
    for (const el of rotulos) {
      const cx = Number(el.getAttribute('data-cx'));
      const cy = Number(el.getAttribute('data-cy'));
      assert.ok(Number.isFinite(cx) && Number.isFinite(cy), 'rótulo sem o ponto de origem');
      assert.ok(Math.abs(num(el, 'y') - cy) < 0.5, `rótulo "${el.textContent}" fora da altura do círculo (${num(el, 'y')} × ${cy})`);
      deslocamentos.add(Math.round((num(el, 'x') - cx) * 10) / 10);
    }
    assert.equal(deslocamentos.size, 1, `deslocamento horizontal variável: ${[...deslocamentos].join(', ')}`);
    // Desenhados ACIMA das linhas (depois delas no SVG).
    const ultimaLinha = Array.from(r.svg.querySelectorAll('.bp-linha')).pop();
    assert.ok(ultimaLinha.compareDocumentPosition(rotulos[0]) & 4, 'rótulo desenhado antes (por baixo) das linhas');
    assert.ok(rotulos[0].getAttribute('stroke'), 'rótulo sem halo');
  } finally {
    r.fim();
  }
});

test('5.6 (b) — tudo dentro do SVG, inclusive a última coluna (círculos e rótulos)', () => {
  const casos = [];
  for (const tamanho of [{ largura: 900, altura: 560 }, { largura: 560, altura: 380 }]) {
    for (const ajustes of [{}, { rotulosNasPontas: 'direita' }, { posicaoDoValor: 'acima' }, { posicaoDoValor: 'abaixo' }]) {
      casos.push([ajustes, tamanho]);
    }
  }
  for (const [ajustes, tamanho] of casos) {
    const r = desenhar(ajustes, tamanho);
    try {
      const W = num(r.svg, 'width');
      const H = num(r.svg, 'height');
      for (const el of r.svg.querySelectorAll('text')) {
        if (el.getAttribute('display') === 'none') continue;
        const c = caixa(el);
        assert.ok(c.x0 >= -0.5 && c.x1 <= W + 0.5, `${JSON.stringify(ajustes)}: "${el.textContent}" sai pela lateral (${c.x0.toFixed(1)}–${c.x1.toFixed(1)} de ${W})`);
        assert.ok(c.y0 >= -0.5 && c.y1 <= H + 0.5, `${JSON.stringify(ajustes)}: "${el.textContent}" sai por cima/baixo`);
      }
      const raio = 6;
      const circulos = Array.from(r.svg.querySelectorAll('.bp-ponto[data-x]')).map((p) => ({ x: num(p, 'data-x'), y: num(p, 'data-y') }));
      for (const p of circulos) {
        assert.ok(p.x + raio <= W && p.x - raio >= 0, 'círculo encostado/fora na lateral');
      }
      // Nenhum rótulo (valor ou nome) por cima de um círculo, nem um sobre o outro.
      const textos = Array.from(r.svg.querySelectorAll('.bp-valor, .bp-rotulo')).filter((e) => e.getAttribute('display') !== 'none');
      const caixas = textos.map((el) => ({ el, ...caixa(el) }));
      for (const c of caixas) {
        for (const p of circulos) {
          const cruza = c.x0 < p.x + raio - 0.5 && c.x1 > p.x - raio + 0.5 && c.y0 < p.y + raio - 0.5 && c.y1 > p.y - raio + 0.5;
          assert.ok(!cruza, `${JSON.stringify(ajustes)}: "${c.el.textContent}" por cima do círculo em (${p.x}, ${p.y})`);
        }
      }
      for (let i = 0; i < caixas.length; i++) {
        for (let j = i + 1; j < caixas.length; j++) {
          const a = caixas[i];
          const b = caixas[j];
          const cruza = a.x0 < b.x1 - 0.5 && a.x1 > b.x0 + 0.5 && a.y0 < b.y1 - 0.5 && a.y1 > b.y0 + 0.5;
          assert.ok(!cruza, `${JSON.stringify(ajustes)}: "${a.el.textContent}" sobre "${b.el.textContent}"`);
        }
      }
    } finally {
      r.fim();
    }
  }
});

test('5.6 (c) — o rank mais baixo não encosta na nota (nota em faixa própria)', () => {
  const r = desenhar();
  try {
    const H = num(r.svg, 'height');
    const maiorY = Math.max(...Array.from(r.svg.querySelectorAll('.bp-ponto[data-y]')).map((p) => num(p, 'data-y')));
    assert.ok(maiorY + 6 + 2 <= H, `o rank mais baixo encosta na borda de baixo (${maiorY} de ${H})`);
    const nota = r.palco.querySelector('.bl-nota');
    assert.ok(nota && nota.closest('.bl-rodape'), 'a nota precisa ficar no rodapé, fora da área do gráfico');
    assert.equal(r.palco.querySelector('.bl-area .bl-nota'), null);
  } finally {
    r.fim();
  }
});

/** Trechos cúbicos de um "d": [[x0,y0, c1x,c1y, c2x,c2y, x1,y1], ...]. */
function trechos(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const saida = [];
  let i = 0;
  let atual = null;
  let cmd = null;
  while (i < tokens.length) {
    if (/[MLCZ]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    if (cmd === 'M' || cmd === 'L') {
      atual = [Number(tokens[i]), Number(tokens[i + 1])];
      i += 2;
    } else if (cmd === 'C') {
      const v = tokens.slice(i, i + 6).map(Number);
      saida.push([...atual, ...v]);
      atual = [v[4], v[5]];
      i += 6;
    } else i += 1;
  }
  return saida;
}

test('5.6 (d) — nenhuma curva sai da faixa vertical entre os dois círculos (catmull salvo e o novo bump)', () => {
  for (const curva of ['catmull', 'bump', 'monotone']) {
    const r = desenhar({ curvaDaLinha: curva });
    try {
      let conferidos = 0;
      for (const path of r.svg.querySelectorAll('.bp-linha')) {
        for (const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] of trechos(path.getAttribute('d'))) {
          const lo = Math.min(y0, y1) - 1e-6;
          const hi = Math.max(y0, y1) + 1e-6;
          assert.ok(c1y >= lo && c1y <= hi && c2y >= lo && c2y <= hi, `${curva}: onda entre (${x0},${y0}) e (${x1},${y1})`);
          conferidos += 1;
        }
      }
      if (curva !== 'monotone') assert.ok(conferidos > 10, `${curva}: nenhum trecho curvo conferido`);
    } finally {
      r.fim();
    }
  }
});

test('5.6 — bump: tangente horizontal nas pontas; "Só no tooltip" não desenha valores', () => {
  const r = desenhar({ curvaDaLinha: 'bump' });
  const t = desenhar({ posicaoDoValor: 'tooltip' });
  try {
    const path = r.svg.querySelector('.bp-linha');
    for (const [, y0, , c1y, , c2y, , y1] of trechos(path.getAttribute('d'))) {
      assert.equal(c1y, y0);
      assert.equal(c2y, y1);
    }
    assert.equal(t.svg.querySelectorAll('.bp-valor').length, 0);
  } finally {
    r.fim();
    t.fim();
  }
});
