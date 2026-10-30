/**
 * cartao_multivalor.test.mjs — Cartão Multi-Valores (melhorias v3, 5.14).
 * Fixtures sintéticas `cartaoUnico` e `cartaoGrade`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { lerFaixas, faixaDoValor } from '../src/charts/cartao_multivalor/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

function abrir(fixture = 'cartaoUnico', ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, 'cartao_multivalor.js'), 'utf8'));
  const definicao = amb.registro.cartao_multivalor;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES[fixture]();
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  const item = (campo) => palco.querySelector(`.mv-item[data-campo="${campo}"]`);
  return { amb, palco, definicao, inst, item, doc: amb.window.document, fim: () => amb.restaurar() };
}

test('5.14 — topo calculado "6 + 3 + 1" = 10, itens centralizados com rótulo em cima', () => {
  const r = abrir('cartaoUnico', { camposDoCabecalho: 'Visitas, Compras, Trocas' });
  try {
    assert.equal(r.palco.querySelector('.mv-grande').textContent, '10');
    assert.equal(r.palco.querySelector('.mv-sub').textContent, '6 + 3 + 1');
    const it = r.item('visitas');
    assert.equal(it.querySelector('.mv-rotulo').textContent, 'Visitas');
    assert.equal(it.querySelector('.mv-valor').textContent, '6');
    assert.equal(it.style.textAlign, 'center');
  } finally {
    r.fim();
  }
});

test('5.14 — zero e nulo configuráveis (antes aparecia "0.0")', () => {
  const r = abrir('cartaoUnico', { mv_estornos_zero: 'nenhum', mv_pendentes_nulo: 'sem dado' });
  try {
    assert.equal(r.item('estornos').querySelector('.mv-valor').textContent, 'nenhum');
    assert.equal(r.item('pendentes').querySelector('.mv-valor').textContent, 'sem dado');
  } finally {
    r.fim();
  }
});

test('5.14 — formatos, prefixo/sufixo, ordem, rótulo e visibilidade por campo', () => {
  const r = abrir('cartaoUnico', {
    mv_visitas_formato: 'moeda',
    mv_visitas_casas: 2,
    mv_compras_sufixo: ' un.',
    mv_trocas_visivel: false,
    mv_nota_rotulo: 'Avaliação',
    mv_nota_ordem: -1,
  });
  try {
    assert.equal(r.item('visitas').querySelector('.mv-valor').textContent, '$6.00');
    assert.equal(r.item('compras').querySelector('.mv-valor').textContent, '3 un.');
    assert.equal(r.item('trocas'), null);
    const primeiro = r.palco.querySelector('.mv-item');
    assert.equal(primeiro.querySelector('.mv-rotulo').textContent, 'Avaliação');
  } finally {
    r.fim();
  }
});

test('5.14 — os 12 tipos de exibição desenham algo próprio', () => {
  const casos = {
    selo: (it) => it.querySelector('.mv-selo'),
    barra: (it) => it.querySelector('.mv-barra'),
    anel: (it) => it.querySelector('.mv-anel'),
    mini: (it) => it.querySelector('.mv-mini'),
    seta: (it) => /▲|▼|■/.test(it.textContent),
    estrelas: (it) => /★/.test(it.textContent),
    semaforo: (it) => it.querySelector('.mv-quadrado'),
    icone: (it) => it.querySelector('svg[data-icone]'),
    link: (it) => it.querySelector('.mv-link'),
    texto: (it) => it.querySelector('.mv-valor').textContent === '8.7',
    numero: (it) => it.querySelector('.mv-valor').textContent === '8.7',
  };
  for (const [tipo, conferir] of Object.entries(casos)) {
    const r = abrir('cartaoUnico', { mv_nota_tipo: tipo, mv_nota_meta: 10, mv_nota_icone: 'estrela' });
    try {
      assert.ok(conferir(r.item('nota')), `tipo "${tipo}" não desenhou`);
    } finally {
      r.fim();
    }
  }
});

test('5.14 — faixas por regra: selo, ícone e legenda (nomes genéricos)', () => {
  const faixas = 'Ouro|8.4||#B8860B|estrela; Prata|7|8.4|#9CA3AF|; Bronze|5.5|7|#B45309|; Sem nível||5.5|#94A3B8|';
  const f = lerFaixas(faixas);
  assert.equal(faixaDoValor(f, 8.4).nome, 'Ouro');
  assert.equal(faixaDoValor(f, 7).nome, 'Prata');
  assert.equal(faixaDoValor(f, 6.9).nome, 'Bronze');
  assert.equal(faixaDoValor(f, 5.4).nome, 'Sem nível');
  const r = abrir('cartaoUnico', { faixasMV: faixas, campoDasFaixas: 'Nota' });
  try {
    const selo = r.palco.querySelector('.mv-selo[data-faixa]');
    assert.equal(selo.getAttribute('data-faixa'), 'Ouro');
    assert.ok(selo.querySelector('svg[data-icone="estrela"]'));
    assert.equal(r.palco.querySelectorAll('.mv-legenda > span').length, 4);
  } finally {
    r.fim();
  }
});

test('5.14 — topo por fórmula (interpretador da 5.4) e erro visível', () => {
  const r = abrir('cartaoUnico', { valorDoCabecalho: 'formula', formulaDoCabecalho: '${visitas} * 2 + ${compras}' });
  const e = abrir('cartaoUnico', { valorDoCabecalho: 'formula', formulaDoCabecalho: '${naoExiste} + 1' });
  try {
    assert.equal(r.palco.querySelector('.mv-grande').textContent, '15');
    assert.match(e.palco.querySelector('.mv-grande').textContent, /#ERRO: campo não encontrado/);
  } finally {
    r.fim();
    e.fim();
  }
});

test('5.14 — um cartão por linha (grade) e layouts dos itens', () => {
  const g = abrir('cartaoGrade', { modoDoCartao: 'grade', colunasDaGradeMV: 4 });
  try {
    assert.equal(g.palco.querySelectorAll('.mv-cartao').length, 8);
    assert.match(g.palco.querySelector('.mv-grade').style.gridTemplateColumns, /repeat\(4/);
  } finally {
    g.fim();
  }
  for (const layout of ['pilha', 'grade', 'linha', 'rotuloValor', 'destaque']) {
    const r = abrir('cartaoUnico', { layoutDosItens: layout });
    try {
      assert.ok(r.palco.querySelectorAll('.mv-item').length >= 6, layout);
      if (layout === 'rotuloValor') assert.ok(r.palco.querySelector('.mv-item.mv-rotulo-valor'));
    } finally {
      r.fim();
    }
  }
});

test('5.14 — interação: link sublinhado abre o drill; tooltip; clique sem link não fixa (5.1)', () => {
  const r = abrir('cartaoUnico');
  try {
    const nivel = r.item('nivel');
    assert.ok(nivel.querySelector('.mv-link'), 'campo com link deveria vir sublinhado');
    nivel.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(r.amb.chamadasDeApi.drills, 1);
    const visitas = r.item('visitas');
    visitas.dispatchEvent(new r.amb.window.MouseEvent('pointerenter', { bubbles: true, clientX: 5, clientY: 5 }));
    assert.ok(r.doc.querySelector('.bl-tooltip.bl-visivel'));
    visitas.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(r.doc.querySelector('.bl-tooltip.bl-fixo'), null);
    visitas.dispatchEvent(new r.amb.window.MouseEvent('dblclick', { bubbles: true })); // copiar não quebra
  } finally {
    r.fim();
  }
});

test('5.14 — animações: entrada em cascata e barras crescendo; interruptor global desliga', () => {
  const r = abrir('cartaoUnico', { mv_nota_tipo: 'barra', mv_nota_meta: 10 });
  const sem = abrir('cartaoUnico', { animacaoAtiva: false, mv_nota_tipo: 'barra', mv_nota_meta: 10 });
  try {
    const itens = Array.from(r.palco.querySelectorAll('.mv-item'));
    assert.match(itens[1].style.animation, /mv-entrar/);
    assert.notEqual(itens[0].style.animationDelay, itens[2].style.animationDelay, 'cascata');
    assert.match(r.palco.querySelector('.mv-barra > div').style.transition, /width/);
    assert.equal(sem.palco.querySelector('.mv-item').style.animation, '');
    assert.equal(parseFloat(sem.palco.querySelector('.mv-barra > div').style.width), 87);
  } finally {
    r.fim();
    sem.fim();
  }
});

test('5.14 — destaque quando o valor muda entre atualizações', () => {
  const r = abrir('cartaoUnico');
  try {
    const { data, queryResponse } = FIXTURES.cartaoUnico();
    data[0].visitas.value = 9;
    data[0].visitas.rendered = '9';
    const cfg = configPadrao(r.definicao);
    r.inst.updateAsync(data, r.palco, cfg, queryResponse, {}, () => {});
    assert.ok(r.item('visitas').querySelector('.mv-valor.mv-mudou'), 'o valor que mudou deveria piscar');
    assert.equal(r.item('compras').querySelector('.mv-valor.mv-mudou'), null);
  } finally {
    r.fim();
  }
});
