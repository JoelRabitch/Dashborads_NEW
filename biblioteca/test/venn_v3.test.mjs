/**
 * venn_v3.test.mjs — layout "Moderno" do diagrama_venn (melhorias v3, 5.7).
 *
 * Geometria sobre os números do desenho (jsdom não faz layout); larguras
 * pela função única `medida-texto.js`. Fixtures sintéticas de 2 a 5
 * conjuntos e uma com nomes longos terminando em "(Yes / No)".
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES, celula, campoDimensao, campoMedida, montarQueryResponse } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { larguraDoTexto } from '../src/core/medida-texto.js';
import { mascaraDoPonto } from '../src/charts/diagrama_venn/geometria.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

function nomesLongos() {
  const n = ['Comprou café especial (Yes / No)', 'Assinante do clube (Yes / No)', 'Usou cupom no mês (Yes / No)'];
  const linhas = [
    [n[0], 120], [n[1], 80], [n[2], 60],
    [`${n[0]}|${n[1]}`, 35], [`${n[0]}|${n[2]}`, 25], [`${n[1]}|${n[2]}`, 18], [`${n[0]}|${n[1]}|${n[2]}`, 10],
  ];
  return {
    data: linhas.map(([r, v]) => ({ regiao_venn: celula(r), itens: celula(v) })),
    queryResponse: montarQueryResponse({ dimensoes: [campoDimensao('regiao_venn', 'Conjuntos')], medidas: [campoMedida('itens', 'Itens')] }),
  };
}

function desenhar(fixture, ajustes = {}, { largura = 900, altura = 560 } = {}) {
  const amb = montarAmbiente();
  Object.defineProperty(amb.window.Element.prototype, 'clientWidth', { get: () => largura, configurable: true });
  Object.defineProperty(amb.window.Element.prototype, 'clientHeight', { get: () => altura, configurable: true });
  amb.window.eval(readFileSync(join(DIST, 'diagrama_venn.js'), 'utf8'));
  const definicao = amb.registro.diagrama_venn;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = typeof fixture === 'string' ? FIXTURES[fixture]() : fixture;
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  const svg = palco.querySelector('svg.vm-svg');
  return { amb, palco, svg, doc: amb.window.document, fim: () => amb.restaurar() };
}

const num = (el, a) => Number(el.getAttribute(a));

/** Caixa estimada de um bloco <text> com <tspan> (linhas centradas). */
function caixa(text) {
  const ancora = text.getAttribute('text-anchor') || 'middle';
  const x = num(text, 'x');
  const spans = Array.from(text.querySelectorAll('tspan'));
  const w = Math.max(...spans.map((s) => larguraDoTexto(s.textContent, num(s, 'font-size'), { negrito: s.getAttribute('font-weight') === '700' })));
  const y0 = Math.min(...spans.map((s) => num(s, 'y') - num(s, 'font-size') / 2));
  const y1 = Math.max(...spans.map((s) => num(s, 'y') + num(s, 'font-size') / 2));
  const x0 = ancora === 'middle' ? x - w / 2 : ancora === 'end' ? x - w : x;
  return { x0, x1: x0 + w, y0, y1, texto: text.textContent };
}

/** Elipses a partir dos <path> (M cx-rx,cy a rx,ry ...; rotate(θ cx cy)). */
function elipses(svg) {
  return Array.from(svg.querySelectorAll('.vm-forma')).map((p) => {
    const d = p.getAttribute('d');
    const [, x, cy, rx, ry] = /M ([-\d.]+),([-\d.]+) a ([-\d.]+),([-\d.]+)/.exec(d).map(Number);
    const rot = /rotate\(([-\d.]+)/.exec(p.getAttribute('transform') || '');
    return { cx: x + rx, cy, rx, ry, rotacao: rot ? Number(rot[1]) : 0 };
  });
}

function conferirTextos(r, rotulo) {
  const W = num(r.svg, 'width');
  const H = num(r.svg, 'height');
  const caixas = Array.from(r.svg.querySelectorAll('text.vm-texto')).map(caixa);
  assert.ok(caixas.length > 0, `${rotulo}: nenhum texto`);
  for (const c of caixas) {
    assert.ok(c.x0 >= -0.5 && c.x1 <= W + 0.5 && c.y0 >= -0.5 && c.y1 <= H + 0.5, `${rotulo}: "${c.texto}" fora da área`);
  }
  for (let i = 0; i < caixas.length; i++) {
    for (let j = i + 1; j < caixas.length; j++) {
      const a = caixas[i];
      const b = caixas[j];
      const cruza = a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
      assert.ok(!cruza, `${rotulo}: "${a.texto}" sobre "${b.texto}"`);
    }
  }
  return caixas;
}

for (const n of [2, 3, 4, 5]) {
  test(`5.7 — ${n} conjuntos: preenche a área e nenhum texto se sobrepõe nem sai`, () => {
    for (const tamanho of [{ largura: 900, altura: 560 }, { largura: 320, altura: 240 }]) {
      const r = desenhar(`conjuntos${n}`, {}, tamanho);
      try {
        conferirTextos(r, `${n} conjuntos ${tamanho.largura}×${tamanho.altura}`);
        // Ocupa a área: a caixa das formas toma quase todo o lado limitante.
        const W = num(r.svg, 'width');
        const H = num(r.svg, 'height');
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const e of elipses(r.svg)) {
          const t = (e.rotacao * Math.PI) / 180;
          const hx = Math.sqrt((e.rx * Math.cos(t)) ** 2 + (e.ry * Math.sin(t)) ** 2);
          const hy = Math.sqrt((e.rx * Math.sin(t)) ** 2 + (e.ry * Math.cos(t)) ** 2);
          minX = Math.min(minX, e.cx - hx);
          maxX = Math.max(maxX, e.cx + hx);
          minY = Math.min(minY, e.cy - hy);
          maxY = Math.max(maxY, e.cy + hy);
        }
        const ocupa = Math.max((maxX - minX) / W, (maxY - minY) / H);
        // 4 e 5 conjuntos têm regiões finas cujos números vão para fora (com
        // linha-guia), o que pede margem lateral: o mínimo é menor.
        const minimo = n <= 3 ? 0.8 : tamanho.largura < 500 ? 0.55 : 0.6;
        assert.ok(ocupa >= minimo, `${n}: o diagrama ocupa só ${(ocupa * 100).toFixed(0)}% do lado limitante`);
        assert.ok(minX >= -0.5 && maxX <= W + 0.5 && minY >= -0.5 && maxY <= H + 0.5, `${n}: forma fora da área`);
      } finally {
        r.fim();
      }
    }
  });
}

test('5.7 — nomes longos: sem o sufixo "(Yes / No)", dentro do diagrama, sem legenda repetida', () => {
  const r = desenhar(nomesLongos(), { separadorDeConjuntos: '|' });
  try {
    const textos = conferirTextos(r, 'nomes longos').map((c) => c.texto).join(' ');
    assert.doesNotMatch(textos, /Yes \/ No/, 'o sufixo deveria ter sido removido');
    assert.match(textos, /Comprou café/);
    const legenda = r.palco.querySelector('.bl-legenda, [class*="legenda"]');
    const visivel = legenda && legenda.closest('div[style*="display: none"]') === null && legenda.textContent.includes('Comprou');
    assert.ok(!visivel, 'os nomes não podem aparecer duas vezes (diagrama e legenda)');
  } finally {
    r.fim();
  }
  const ap = desenhar(nomesLongos(), { separadorDeConjuntos: '|', apelidosDosConjuntos: 'Comprou café especial (Yes / No)=Café', mostrarTotalDoConjunto: false });
  try {
    assert.ok(Array.from(ap.svg.querySelectorAll('tspan')).some((t) => t.textContent === 'Café'), 'apelido não aplicado');
  } finally {
    ap.fim();
  }
});

test('5.7 — números com halo, valor e percentual em linhas separadas', () => {
  const r = desenhar('conjuntos3', { mostrarPercentual: true });
  try {
    const t = r.svg.querySelector('text.vm-texto[data-mascara="3"]') || r.svg.querySelector('text.vm-texto');
    assert.ok(t.getAttribute('stroke'), 'sem halo');
    const spans = Array.from(t.querySelectorAll('tspan')).map((s) => s.textContent);
    assert.ok(spans.some((s) => /%$/.test(s)), `percentual sem linha própria: ${spans}`);
    assert.ok(spans.length >= 2);
  } finally {
    r.fim();
  }
});

test('5.7 — nomes fora com linha-guia e só na legenda', () => {
  const fora = desenhar('conjuntos3', { nomesDosConjuntos: 'fora' });
  const leg = desenhar('conjuntos3', { nomesDosConjuntos: 'legenda' });
  try {
    conferirTextos(fora, 'nomes fora');
    assert.ok(fora.svg.querySelectorAll('line.vm-guia').length >= 3, 'faltam linhas-guia');
    assert.ok(!Array.from(leg.svg.querySelectorAll('tspan')).some((s) => /^A\b/.test(s.textContent)), 'com "Só na legenda" o nome não vai no diagrama');
  } finally {
    fora.fim();
    leg.fim();
  }
});

test('5.7 — hover destaca e cresce a região; clique fixa; Esc solta', () => {
  const r = desenhar('conjuntos3');
  try {
    const es = elipses(r.svg);
    let ponto = null;
    for (let y = 0; y < 560 && !ponto; y += 4) {
      for (let x = 0; x < 900 && !ponto; x += 4) if (mascaraDoPonto(x, y, es) === 3) ponto = { x, y };
    }
    assert.ok(ponto, 'não achou a interseção A∩B');
    const ev = (tipo) => new r.amb.window.MouseEvent(tipo, { bubbles: true, clientX: ponto.x, clientY: ponto.y });
    r.svg.dispatchEvent(ev('pointermove'));
    const destaque = r.svg.querySelector('.vm-destaque g[data-mascara="3"]');
    assert.ok(destaque, 'a região sob o mouse não ganhou destaque');
    assert.match(destaque.getAttribute('transform'), /scale\(1\.04\)/, 'a região deveria crescer um pouco');
    assert.ok(r.svg.querySelector('.vm-forma.vm-claro'), 'as outras regiões deveriam clarear');
    const tip = r.doc.querySelector('.bl-tooltip.bl-visivel');
    assert.ok(tip && /A ∩ B|A e B|A,B|A · B|A\s*∩\s*B/.test(tip.textContent) && /%/.test(tip.textContent), `tooltip: ${tip && tip.textContent}`);
    r.svg.dispatchEvent(ev('click'));
    r.svg.dispatchEvent(new r.amb.window.MouseEvent('pointerleave', { bubbles: true }));
    assert.ok(r.svg.querySelector('.vm-destaque g[data-mascara="3"]'), 'o clique deveria fixar a seleção');
    r.doc.dispatchEvent(new r.amb.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(r.svg.querySelector('.vm-destaque g'), null, 'Esc deveria soltar');
  } finally {
    r.fim();
  }
});

test('5.7 — "Clássico" continua disponível; tamanho fixo usa o tamanho salvo', () => {
  const c = desenhar('conjuntos3', { layoutDoVenn: 'classico' });
  const f = desenhar('conjuntos3', { tamanhoDoTextoDoVenn: 'fixo', tamanhoDoRotulo: 13 });
  try {
    assert.equal(c.svg, null);
    assert.ok(c.palco.querySelector('svg.venn-svg .venn-rotulo-conjunto'));
    const tamanhos = Array.from(f.svg.querySelectorAll('tspan[font-weight="700"]')).map((s) => num(s, 'font-size'));
    assert.ok(tamanhos.includes(13), `tamanho fixo não aplicado: ${tamanhos}`);
  } finally {
    c.fim();
    f.fim();
  }
});
