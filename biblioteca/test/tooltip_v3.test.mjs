/**
 * tooltip_v3.test.mjs — tooltip que ficava preso na tela (melhorias v3, 5.1).
 *
 * Uma hipótese por teste, todas no módulo único de tooltip (que todos os
 * gráficos usam via `ctx.tooltip()` / `ctx.cliqueNoItem`):
 *   1. clique SEM link no modo "drill" fixava o tooltip;
 *   2. o drill abria com o tooltip ainda visível (não fixo) e ele ficava lá
 *      quando o mouse ia para o menu do Looker (fora do iframe);
 *   3. a janela perdia o foco (menu do Looker, outra aba) e nada soltava;
 *   4. o mouse saía do documento (iframe) sem passar pelo `pointerleave`
 *      da raiz;
 *   5. Esc e o botão "×" do tooltip fixo.
 * O comportamento por gráfico (drill com link, fixar no modo "Fixar
 * tooltip", Shift+clique) está nos testes de cada família
 * (correcoes_series, correcoes_listas, correcoes_conjuntos,
 * correcoes_quadrantes, correcoes_arvores_kpi).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { montarAmbiente } from './ambiente.mjs';

async function preparar() {
  const amb = montarAmbiente();
  const mod = await import(`../src/core/tooltip.js?v3=${Math.random()}`);
  const doc = amb.window.document;
  const raiz = doc.createElement('div');
  raiz.className = 'bl-raiz';
  doc.body.appendChild(raiz);
  const ponte = {
    temDrill: (c) => !!(c && c.links && c.links.length),
    abrirDrill: () => true,
  };
  mod.configurarTooltipsDe(raiz, { config: {}, ponte });
  const tooltip = mod.criarTooltip(raiz, {});
  const conteudo = { titulo: 'Item A', linhas: [{ rotulo: 'Valor', valor: '10' }] };
  const evento = (tipo, extra = {}) => new amb.window.MouseEvent(tipo, { bubbles: true, clientX: 10, clientY: 10, ...extra });
  return { amb, mod, doc, raiz, ponte, tooltip, conteudo, evento };
}

test('5.1 — modo "drill" (valor salvo): clique SEM link não fixa o tooltip', async () => {
  const r = await preparar();
  try {
    r.tooltip.mostrar(r.conteudo, 10, 10);
    const res = r.mod.executarAcaoDoClique({
      evento: r.evento('click'), celula: { value: 1 }, tooltip: r.tooltip, ponte: r.ponte,
      config: { acaoDoClique: 'drill' }, conteudo: r.conteudo,
    });
    assert.equal(res, 'nada');
    assert.equal(r.tooltip.fixo, false, 'clique sem link no modo drill fixou o tooltip');
  } finally {
    r.amb.restaurar();
  }
});

test('5.1 — "Fixar tooltip" e Shift+clique continuam fixando', async () => {
  const r = await preparar();
  try {
    const base = { celula: { value: 1 }, tooltip: r.tooltip, ponte: r.ponte, conteudo: r.conteudo };
    assert.equal(r.mod.executarAcaoDoClique({ ...base, evento: r.evento('click'), config: { acaoDoClique: 'fixar' } }), 'fixou');
    r.tooltip.soltar();
    assert.equal(r.mod.executarAcaoDoClique({ ...base, evento: r.evento('click', { shiftKey: true }), config: { acaoDoClique: 'drill' } }), 'fixou');
    assert.equal(r.tooltip.fixo, true);
  } finally {
    r.amb.restaurar();
  }
});

test('5.1 — antes de abrir o drill o tooltip some (mesmo NÃO fixo)', async () => {
  const r = await preparar();
  try {
    let visivelNoDrill = null;
    r.ponte.abrirDrill = () => {
      visivelNoDrill = r.tooltip.visivel;
      return true;
    };
    r.tooltip.mostrar(r.conteudo, 10, 10);
    assert.equal(r.tooltip.visivel, true);
    const res = r.mod.executarAcaoDoClique({
      evento: r.evento('click'), celula: { value: 1, links: [{ url: '/x' }] }, tooltip: r.tooltip,
      ponte: r.ponte, config: { acaoDoClique: 'drill' }, conteudo: r.conteudo,
    });
    assert.equal(res, 'drill');
    assert.equal(visivelNoDrill, false, 'o tooltip estava visível quando o menu de drill abriu');
    assert.equal(r.tooltip.visivel, false);
  } finally {
    r.amb.restaurar();
  }
});

test('5.1 — janela perde o foco (menu do Looker por cima): tooltip fixo ou não é solto', async () => {
  const r = await preparar();
  try {
    r.tooltip.fixar(r.conteudo, 10, 10);
    r.amb.window.dispatchEvent(new r.amb.window.Event('blur'));
    assert.equal(r.tooltip.fixo, false);
    assert.equal(r.tooltip.visivel, false);
    r.tooltip.mostrar(r.conteudo, 10, 10);
    r.amb.window.dispatchEvent(new r.amb.window.Event('blur'));
    assert.equal(r.tooltip.visivel, false);
  } finally {
    r.amb.restaurar();
  }
});

test('5.1 — menu de drill fecha (iframe recupera o foco): nada fica na tela', async () => {
  const r = await preparar();
  try {
    r.tooltip.mostrar(r.conteudo, 10, 10);
    r.amb.window.dispatchEvent(new r.amb.window.Event('focus'));
    assert.equal(r.tooltip.visivel, false);
  } finally {
    r.amb.restaurar();
  }
});

test('5.1 — mouse sai do documento sem passar pela raiz: o tooltip some', async () => {
  const r = await preparar();
  try {
    r.tooltip.mostrar(r.conteudo, 10, 10);
    // Saída do iframe: `mouseout` no documento com relatedTarget nulo.
    r.doc.documentElement.dispatchEvent(new r.amb.window.MouseEvent('mouseout', { bubbles: true, relatedTarget: null }));
    assert.equal(r.tooltip.visivel, false);
    r.tooltip.mostrar(r.conteudo, 10, 10);
    r.doc.documentElement.dispatchEvent(new r.amb.window.MouseEvent('mouseleave', { bubbles: false }));
    assert.equal(r.tooltip.visivel, false);
  } finally {
    r.amb.restaurar();
  }
});

test('5.1 — Esc solta; o tooltip fixo tem botão "×" visível que solta', async () => {
  const r = await preparar();
  try {
    r.tooltip.fixar(r.conteudo, 10, 10);
    const botao = r.tooltip.elemento.querySelector('.bl-tooltip-fechar');
    assert.ok(botao, 'tooltip fixo sem botão ×');
    assert.equal(botao.textContent, '×');
    r.doc.dispatchEvent(new r.amb.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(r.tooltip.fixo, false);
    assert.equal(r.tooltip.visivel, false);

    r.tooltip.fixar(r.conteudo, 10, 10);
    const botao2 = r.tooltip.elemento.querySelector('.bl-tooltip-fechar');
    botao2.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(r.tooltip.fixo, false);
    assert.equal(r.tooltip.visivel, false);
    // Solto, o botão não aparece no hover.
    r.tooltip.mostrar(r.conteudo, 10, 10);
    assert.equal(r.tooltip.elemento.querySelector('.bl-tooltip-fechar'), null);
  } finally {
    r.amb.restaurar();
  }
});

test('5.1 — clique fora solta o tooltip fixo', async () => {
  const r = await preparar();
  try {
    r.tooltip.fixar(r.conteudo, 10, 10);
    await new Promise((ok) => setTimeout(ok, 70));
    r.doc.body.dispatchEvent(new r.amb.window.MouseEvent('pointerdown', { bubbles: true }));
    assert.equal(r.tooltip.fixo, false);
  } finally {
    r.amb.restaurar();
  }
});
