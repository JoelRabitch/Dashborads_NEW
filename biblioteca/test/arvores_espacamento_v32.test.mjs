/**
 * arvores_espacamento_v32.test.mjs — espaçamento dos níveis e tamanho do
 * ícone nas árvores (v3.2).
 *
 * Defeito (visto no Looker, árvore horizontal com "Ícone por valor"):
 * expandir UMA linha fazia os ícones dos filhos caírem em cima do texto do
 * pai, e todos os níveis se aproximavam. Causa: o layout dividia uma
 * largura FIXA pelo número de níveis visíveis.
 *
 * jsdom não faz layout: os testes são de GEOMETRIA, sobre os números do
 * desenho, com a função única de largura de texto (`medida-texto.js`).
 * Conferir no Looker real: docs/TESTE_NO_LOOKER.md (v3.2).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { celula, campoDimensao, campoMedida, montarQueryResponse } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { larguraDoTexto } from '../src/core/medida-texto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

/** Folga mínima exigida entre o fim de um rótulo e o ícone seguinte (px). */
const FOLGA = 4;

/**
 * Hierarquia SINTÉTICA de 4 níveis com nomes e valores longos. No
 * arvores_multiplas cada ramo do 1º nível vira uma árvore própria, então a
 * mini-árvore tem 4 níveis: ramo, n2, n3, n4.
 */
function hierarquia4() {
  const dimensoes = ['n1', 'n2', 'n3', 'n4'].map((n, i) => campoDimensao(n, `Nível ${i + 1}`));
  const medidas = [campoMedida('valor', 'Valor', { valueFormat: '$#,##0.00' })];
  const data = [];
  for (const r of ['Ramo Alfa', 'Ramo Beta']) {
    for (let a = 1; a <= 2; a++) {
      for (let b = 1; b <= 2; b++) {
        for (let c = 1; c <= 2; c++) {
          data.push({
            n1: celula(r),
            n2: celula(`${r} · Grupo sintético ${a} de nome comprido`),
            n3: celula(`Subgrupo ${a}.${b} com descrição bem longa`),
            n4: celula(`Item ${a}.${b}.${c} de teste com nome extenso`),
            valor: celula(98765432.1 * (a + b + c)),
          });
        }
      }
    }
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

function abrir(id, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = hierarquia4();
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  const clicar = (el) => el.dispatchEvent(new amb.window.MouseEvent('click', { bubbles: true }));
  return { amb, palco, definicao, clicar, todos: (s) => Array.from(palco.querySelectorAll(s)), fim: () => amb.restaurar() };
}

const num = (el, a) => Number(el.getAttribute(a));
const translate = (el) => {
  const m = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec((el && el.getAttribute('transform')) || '');
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
};

/** Geometria de UMA mini-árvore (célula) do arvores_multiplas. */
function geometria(celulaEl) {
  const grupo = celulaEl.querySelector('svg > g');
  const d = translate(grupo);
  const nos = [];
  for (const g of celulaEl.querySelectorAll('.av-no-grupo')) {
    const marcador = g.querySelector('.av-no');
    if (!marcador) continue;
    const p = translate(marcador);
    const chave = marcador.getAttribute('data-item');
    const icone = g.querySelector('.bl-icone-por-valor');
    const rotulo = g.querySelector('.av-rotulo');
    const no = {
      chave,
      pai: chave.includes('›') ? chave.slice(0, chave.lastIndexOf('›')) : null,
      nivel: chave.split('›').length - 1,
      x: p.x + d.x,
      y: p.y + d.y,
      diametro: num(marcador, 'data-diametro'),
      icone: icone ? { x0: num(icone, 'x') + d.x, y0: num(icone, 'y') + d.y, x1: num(icone, 'x') + d.x + num(icone, 'width'), y1: num(icone, 'y') + d.y + num(icone, 'height') } : null,
      rotulo: null,
    };
    if (rotulo && rotulo.getAttribute('display') !== 'none') {
      const tam = Number(rotulo.getAttribute('font-size')) || 11;
      const negrito = rotulo.getAttribute('font-weight') === '700';
      const spans = Array.from(rotulo.querySelectorAll('tspan'));
      const linhas = spans.length ? spans.map((s) => s.textContent) : [rotulo.textContent];
      const w = Math.max(...linhas.map((l) => larguraDoTexto(l, tam, { negrito })));
      const x = num(rotulo, 'x') + d.x;
      const y = num(rotulo, 'y') + d.y;
      const ancora = rotulo.getAttribute('text-anchor');
      const x0 = ancora === 'end' ? x - w : ancora === 'middle' ? x - w / 2 : x;
      const h = tam * 1.15 * linhas.length;
      no.rotulo = { texto: linhas.join(' '), x0, x1: x0 + w, y0: y - h / 2, y1: y + h / 2, largura: w, lado: ancora === 'end' ? 'esq' : ancora === 'middle' ? 'centro' : 'dir' };
    }
    nos.push(no);
  }
  return nos;
}

/** Caixa ocupada pelo nó (ícone ou marcador, o que for maior). */
function caixaDoNo(n) {
  const r = n.diametro / 2;
  const c = { x0: n.x - r, x1: n.x + r, y0: n.y - r, y1: n.y + r };
  if (!n.icone) return c;
  return { x0: Math.min(c.x0, n.icone.x0), x1: Math.max(c.x1, n.icone.x1), y0: Math.min(c.y0, n.icone.y0), y1: Math.max(c.y1, n.icone.y1) };
}
const cruza = (a, b) => a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5;

const xPorNivel = (nos) => {
  const m = new Map();
  for (const n of nos) {
    if (!m.has(n.nivel)) m.set(n.nivel, new Set());
    m.get(n.nivel).add(Math.round(n.x * 10) / 10);
  }
  return m;
};

/** (c) e (d): nenhum rótulo cobre ícone/círculo; ícones de irmãos não se sobrepõem. */
function conferirSobreposicoes(nos, contexto) {
  for (const a of nos) {
    if (a.rotulo) {
      for (const b of nos) {
        assert.ok(!cruza(a.rotulo, caixaDoNo(b)), `${contexto}: o rótulo "${a.rotulo.texto.slice(0, 40)}" cobre o ícone/círculo de "${b.chave}"`);
      }
    }
    for (const b of nos) {
      if (a === b || a.pai !== b.pai || !a.icone || !b.icone) continue;
      assert.ok(!cruza(a.icone, b.icone), `${contexto}: ícones dos irmãos "${a.chave}" e "${b.chave}" se sobrepõem`);
    }
  }
}

/** (b): distância entre níveis ≥ maior rótulo à direita do anterior + ícone + folga. */
function conferirDistancias(nos, contexto) {
  const niveis = [...new Set(nos.map((n) => n.nivel))].sort((a, b) => a - b);
  for (let i = 0; i + 1 < niveis.length; i++) {
    const daqui = nos.filter((n) => n.nivel === niveis[i]);
    const prox = nos.filter((n) => n.nivel === niveis[i + 1]);
    const maiorRotulo = Math.max(0, ...daqui.filter((n) => n.rotulo && n.rotulo.lado === 'dir').map((n) => n.rotulo.largura));
    const ladoDoIcone = Math.max(...prox.concat(daqui).map((n) => (n.icone ? n.icone.x1 - n.icone.x0 : n.diametro)));
    const dist = Math.min(...prox.map((n) => n.x)) - Math.max(...daqui.map((n) => n.x));
    assert.ok(
      dist >= maiorRotulo + ladoDoIcone + FOLGA - 0.5,
      `${contexto}: níveis ${niveis[i]}→${niveis[i + 1]} a ${dist.toFixed(1)} px; precisa de ${(maiorRotulo + ladoDoIcone + FOLGA).toFixed(1)} (rótulo ${maiorRotulo.toFixed(1)} + ícone ${ladoDoIcone} + folga)`
    );
  }
}

const COM_ICONE = { iconePadraoPorValor: 'estrela', mostrarValorNoRotulo: true, nivelInicialExpandido: 1 };

for (const [nome, extra] of [
  ['padrão', {}],
  ['nomes internos ligados', { mostrarRotulosInternos: true }],
]) {
  test(`v3.2 (a,b,c,d) — arvores_multiplas, ${nome}: expandir UMA linha não mexe nos níveis já visíveis`, () => {
    const r = abrir('arvores_multiplas', { ...COM_ICONE, ...extra });
    try {
      const cel = () => r.palco.querySelector('.am-celula[data-arvore="Ramo Alfa"]');
      const antes = geometria(cel());
      assert.ok(antes.some((n) => n.icone), 'o ícone por valor deveria estar desenhado');
      assert.deepEqual([...new Set(antes.map((n) => n.nivel))].sort(), [0, 1], 'deveria começar com 2 níveis visíveis');
      conferirSobreposicoes(antes, 'com 2 níveis');
      conferirDistancias(antes, 'com 2 níveis');

      r.clicar(cel().querySelector('.av-no[data-recolhido="1"]'));
      const depois = geometria(cel());
      assert.deepEqual([...new Set(depois.map((n) => n.nivel))].sort(), [0, 1, 2], 'deveria ter 3 níveis após expandir um nó');
      conferirSobreposicoes(depois, 'com 3 níveis');
      conferirDistancias(depois, 'com 3 níveis');
      const xa = xPorNivel(antes);
      const xd = xPorNivel(depois);
      for (const [nivel, xs] of xa) {
        assert.deepEqual([...xd.get(nivel)], [...xs], `o nível ${nivel} mudou de posição X ao expandir (${[...xs]} → ${[...xd.get(nivel)]})`);
      }

      // Expande mais um nível (4 visíveis) e confere de novo.
      r.clicar(cel().querySelector('.av-no[data-recolhido="1"]'));
      const quatro = geometria(cel());
      for (const [nivel, xs] of xd) assert.deepEqual([...xPorNivel(quatro).get(nivel)], [...xs], `nível ${nivel} mudou ao abrir o 4º`);
      conferirSobreposicoes(quatro, 'com 4 níveis');
      conferirDistancias(quatro, 'com 4 níveis');
    } finally {
      r.fim();
    }
  });
}

test('v3.2 (c) — tudo aberto: nenhuma sobreposição em nenhum modo de "Texto longo"', () => {
  // v3.3: também no ajuste automático (que pode cortar como último recurso).
  for (const [modo, quando] of ['inteiro', 'quebrar', 'reduzir', 'reticencias', 'cortar', 'abreviar', 'soNome'].flatMap((m) => [[m, 'rolar'], [m, 'ajustar']])) {
    const r = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', mostrarValorNoRotulo: true, mostrarRotulosInternos: true, modoDoTextoLongo: modo, layoutQuandoNaoCouber: quando });
    try {
      for (const cel of r.todos('.am-celula')) {
        const nos = geometria(cel);
        conferirSobreposicoes(nos, `modo ${modo}`);
        if (quando === 'rolar' && (modo === 'inteiro' || modo === 'abreviar' || modo === 'soNome')) {
          for (const n of nos) if (n.rotulo) assert.doesNotMatch(n.rotulo.texto, /…/, `modo ${modo} não pode cortar`);
        }
      }
    } finally {
      r.fim();
    }
  }
});

test('v3.2 — limites: modos de corte cabem na célula; "Mostrar inteiro" cresce com rolagem', () => {
  // v3.3: comportamento da v3.2 = "Rolar em tamanho real".
  const inteiro = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', mostrarValorNoRotulo: true, larguraMinimaDaArvore: 300, layoutQuandoNaoCouber: 'rolar' });
  const reduzir = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', mostrarValorNoRotulo: true, larguraMinimaDaArvore: 300, modoDoTextoLongo: 'reticencias', layoutQuandoNaoCouber: 'rolar' });
  try {
    const ci = inteiro.palco.querySelector('.am-celula');
    assert.ok(num(ci.querySelector('svg'), 'width') > parseFloat(ci.style.width), '"Mostrar inteiro": a árvore deveria ficar mais larga que a célula (rolagem)');
    for (const cel of reduzir.todos('.am-celula')) {
      const svg = cel.querySelector('svg');
      assert.ok(num(svg, 'width') <= parseFloat(cel.style.width) + 0.5, 'modo de corte: a árvore deveria caber na largura da célula');
    }
  } finally {
    inteiro.fim();
    reduzir.fim();
  }
});

test('v3.2 — altura cresce com rolagem (sem espremer as linhas); "Ajustar à área" reduz com fonte mínima', () => {
  const real = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', alturaDaArvore: 100, layoutQuandoNaoCouber: 'rolar' });
  const ajustar = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', alturaDaArvore: 100, ajusteDeEscala: 'ajustar', layoutQuandoNaoCouber: 'rolar' });
  try {
    const cel = real.palco.querySelector('.am-celula');
    const svg = cel.querySelector('svg');
    assert.ok(num(svg, 'height') > 100, 'tamanho real: a altura deveria crescer (rolagem vertical)');
    const nos = geometria(cel);
    for (const a of nos) for (const b of nos) if (a !== b && a.nivel === b.nivel) assert.ok(Math.abs(a.y - b.y) >= 12, 'linhas espremidas');
    const sa = ajustar.palco.querySelector('.am-celula svg');
    const vb = sa.getAttribute('viewBox').split(/\s+/).map(Number);
    assert.ok(num(sa, 'height') < vb[3], '"Ajustar à área" deveria reduzir o desenho');
    const fonteMinima = 8;
    const escala = num(sa, 'height') / vb[3];
    const fonte = Number(sa.querySelector('.av-rotulo').getAttribute('font-size'));
    assert.ok(fonte * escala >= fonteMinima - 0.05, `fonte na tela ${(fonte * escala).toFixed(2)} abaixo da mínima`);
  } finally {
    real.fim();
    ajustar.fim();
  }
});

test('v3.2 — opções novas: "Tamanho do ícone" e "Ajuste de escala" nas duas árvores', () => {
  for (const id of ['arvores_multiplas', 'org_chart']) {
    const r = abrir(id);
    try {
      const o = r.definicao.options;
      assert.equal(o.tamanhoDoIcone && o.tamanhoDoIcone.default, 0, `${id}: tamanhoDoIcone (0 = automático)`);
      assert.equal(o.ajusteDeEscala && o.ajusteDeEscala.default, 'real', `${id}: ajusteDeEscala padrão "real"`);
    } finally {
      r.fim();
    }
  }
  const fixo = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', tamanhoDoIcone: 20 });
  try {
    const ic = fixo.palco.querySelector('.bl-icone-por-valor');
    assert.equal(num(ic, 'width'), 20, 'tamanho do ícone em px');
    // O rótulo começa depois do ícone.
    const nos = geometria(fixo.palco.querySelector('.am-celula'));
    for (const n of nos) {
      if (n.rotulo && n.rotulo.lado === 'dir') assert.ok(n.rotulo.x0 >= n.x + 10 + 2 - 0.5, 'o rótulo deveria começar depois do ícone');
    }
  } finally {
    fixo.fim();
  }
});

/* ------------------------------------------------------------------ */
/* org_chart                                                            */
/* ------------------------------------------------------------------ */

function cartoes(r) {
  return r.todos('.oc-cartao').map((g) => {
    const caixa = g.querySelector('.oc-caixa');
    const icone = g.querySelector('.bl-icone-por-valor');
    const nome = g.querySelector('.oc-nome');
    return {
      chave: g.getAttribute('data-chave'),
      x: num(caixa, 'x') + num(caixa, 'width') / 2,
      y: num(caixa, 'y') + num(caixa, 'height') / 2,
      nivel: g.getAttribute('data-chave').split(' ').length - 1,
      icone: icone ? { x0: num(icone, 'x'), y0: num(icone, 'y'), x1: num(icone, 'x') + num(icone, 'width'), y1: num(icone, 'y') + num(icone, 'height') } : null,
      textos: Array.from(g.querySelectorAll('.oc-texto:not(.oc-botao *)')).filter((t) => !t.closest('.oc-botao')).map((t) => {
        const tam = Number(t.getAttribute('font-size'));
        const w = larguraDoTexto(t.textContent, tam, { negrito: t === nome });
        const x = num(t, 'x');
        const a = t.getAttribute('text-anchor');
        const x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x;
        return { texto: t.textContent, x0, x1: x0 + w, y0: num(t, 'y') - tam * 0.6, y1: num(t, 'y') + tam * 0.6 };
      }),
    };
  });
}

test('v3.2 — org_chart: o texto do cartão não cobre o ícone', () => {
  for (const alinh of ['auto', 'esquerda', 'centro']) {
    const r = abrir('org_chart', { iconePadraoPorValor: 'estrela', alinhamentoDoTextoDoCartao: alinh });
    try {
      const cs = cartoes(r);
      assert.ok(cs.some((c) => c.icone), 'o ícone deveria estar desenhado');
      for (const c of cs) for (const t of c.textos) assert.ok(!c.icone || !cruza(t, c.icone), `alinhamento ${alinh}: "${t.texto.slice(0, 30)}" cobre o ícone`);
    } finally {
      r.fim();
    }
  }
});

test('v3.2 — org_chart (esquerda→direita): expandir um nó não mexe nos níveis já visíveis', () => {
  for (const orientacao of ['esquerda', 'cima']) {
    const r = abrir('org_chart', { iconePadraoPorValor: 'estrela', orientacao, comecarRecolhidoAPartirDe: 2 });
    try {
      const eixo = (c) => (orientacao === 'esquerda' ? c.x : c.y);
      const svgG = () => translate(r.palco.querySelector('.oc-area svg > g'));
      const porNivel = () => {
        const d = svgG();
        const m = new Map();
        for (const c of cartoes(r)) {
          const v = Math.round((eixo(c) + (orientacao === 'esquerda' ? d.x : d.y)) * 10) / 10;
          if (!m.has(c.nivel)) m.set(c.nivel, new Set());
          m.get(c.nivel).add(v);
        }
        return m;
      };
      const antes = porNivel();
      const botao = r.todos('.oc-botao').find((b) => /^\+/.test(b.textContent));
      assert.ok(botao, 'deveria haver um nó recolhido');
      r.clicar(botao);
      const depois = porNivel();
      assert.ok(depois.size > antes.size, 'deveria abrir um nível');
      for (const [nivel, vs] of antes) assert.deepEqual([...depois.get(nivel)], [...vs], `${orientacao}: o nível ${nivel} mudou de posição ao expandir`);
    } finally {
      r.fim();
    }
  }
});
