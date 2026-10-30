/**
 * auditoria_borda_v3.test.mjs — "o rótulo do valor extremo cabe dentro da
 * área" (melhorias v3, 5.13b, auditoria da família do dot_plot_denso).
 *
 * SVG (pareto, drawdown, heatmap_denso): todo <text> visível tem a caixa
 * estimada (âncora + largura de `medida-texto.js`) dentro do <svg>.
 * HTML (barras_ranking_denso, dumbbell, bar_race): o rótulo posicionado à
 * DIREITA de um ponto/barra em `left: p%` precisa de (1 − p) × L ≥ largura
 * do texto + afastamento, com L = 900 px (a MAIOR largura possível do
 * trilho no tile de teste). Se nem assim couber, o texto é cortado.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES, celula, campoDimensao, campoMedida, montarQueryResponse, criarRng } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { larguraDoTexto } from '../src/core/medida-texto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

function milhoes({ medidas = 1 } = {}) {
  const rng = criarRng(91);
  const ms = Array.from({ length: medidas }, (_, i) => campoMedida(`m${i}`, `Medida ${i + 1}`));
  const data = [];
  for (let i = 0; i < 30; i++) {
    const linha = { pais: celula(`País Sintético ${i}`) };
    ms.forEach((m, k) => {
      const v = i === 0 && k === medidas - 1 ? 74050000 : Math.round((1000000 + rng() * 60000000) / 1000) * 1000;
      linha[m.name] = celula(v, `${(v / 1e6).toFixed(2)}M`);
    });
    data.push(linha);
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes: [campoDimensao('pais', 'País')], medidas: ms }) };
}

function desenhar(id, fixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = typeof fixture === 'string' ? FIXTURES[fixture]() : fixture;
  const cfg = () => Object.assign(configPadrao(definicao), { mostrarRotulos: true }, ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  return { amb, palco, fim: () => amb.restaurar() };
}

function conferirSvg(r, id) {
  const svgs = Array.from(r.palco.querySelectorAll('.bl-area svg')).filter((s) => Number(s.getAttribute('width')) > 100);
  assert.ok(svgs.length, `${id}: sem svg`);
  let conferidos = 0;
  for (const svg of svgs) {
    const W = Number(svg.getAttribute('width'));
    for (const el of svg.querySelectorAll('text')) {
      if (el.getAttribute('display') === 'none' || el.closest('[display="none"]') || !el.textContent.trim()) continue;
      if (el.getAttribute('transform') || (el.parentNode && el.parentNode.getAttribute && /rotate/.test(el.parentNode.getAttribute('transform') || ''))) continue;
      let dx = 0;
      for (let g = el.parentNode; g && g !== svg; g = g.parentNode) {
        const m = /translate\(([-\d.]+)/.exec((g.getAttribute && g.getAttribute('transform')) || '');
        if (m) dx += Number(m[1]);
      }
      const tamanho = Number(el.getAttribute('font-size')) || parseFloat(el.style.fontSize) || 11;
      const w = larguraDoTexto(el.textContent, tamanho);
      const x = Number(el.getAttribute('x')) + dx;
      if (!Number.isFinite(x)) continue;
      const ancora = el.getAttribute('text-anchor') || 'start';
      const x0 = ancora === 'middle' ? x - w / 2 : ancora === 'end' ? x - w : x;
      assert.ok(x0 >= -1 && x0 + w <= W + 1, `${id}: "${el.textContent}" sai da área (${x0.toFixed(1)}–${(x0 + w).toFixed(1)} de ${W})`);
      conferidos += 1;
    }
  }
  return conferidos;
}

function conferirHtml(r, id, seletor) {
  const rotulos = Array.from(r.palco.querySelectorAll(seletor));
  assert.ok(rotulos.length, `${id}: sem rótulos ${seletor} — ${(r.palco.querySelector(".bl-vazio") || r.palco).textContent.slice(0, 200)}`);
  for (const el of rotulos) {
    const p = parseFloat(el.style.left) / 100;
    const t = el.style.transform || '';
    if (!Number.isFinite(p) || /calc\(-100%/.test(t) || /translate\(-50%/.test(t)) continue; // à esquerda ou centrado
    const afast = Number((/translate\((\d+(?:\.\d+)?)px/.exec(t) || [0, 0])[1]);
    const w = larguraDoTexto(el.textContent, parseFloat(el.style.fontSize) || 11);
    assert.ok((1 - p) * 900 >= w + afast - 0.5, `${id}: "${el.textContent}" à direita em ${(p * 100).toFixed(1)}% é cortado`);
  }
  return rotulos.length;
}

const CASOS = [
  ['pareto', () => milhoes(), {}, 'svg'],
  ['drawdown', 'temporal', {}, 'svg'],
  ['heatmap_denso', 'duasDimensoes', { mostrarValoresNasCelulas: true }, 'svg'],
  ['barras_ranking_denso', () => milhoes(), {}, '.br-valor'],
  ['barras_ranking_denso', () => milhoes(), { posicaoDoRotulo: 'fora' }, '.br-valor'],
  ['dumbbell', () => milhoes({ medidas: 2 }), { escreverValores: 'segunda' }, '.db-valor'],
  ['bar_race', 'temporal', {}, '.bc-valor'],
];

for (const [id, fixture, ajustes, modo] of CASOS) {
  test(`5.13b auditoria — ${id} ${JSON.stringify(ajustes)}: o rótulo do valor extremo cabe na área`, (t) => {
    const r = desenhar(id, typeof fixture === 'function' ? fixture() : fixture, ajustes);
    try {
      const n = modo === 'svg' ? conferirSvg(r, id) : conferirHtml(r, id, modo);
      t.diagnostic(`${n} rótulo(s) conferido(s)`);
    } finally {
      r.fim();
    }
  });
}
