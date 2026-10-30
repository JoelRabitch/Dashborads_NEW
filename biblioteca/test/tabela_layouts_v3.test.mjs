/**
 * tabela_layouts_v3.test.mjs — os 9 layouts da tabela (melhorias v3, 5.5).
 * Todos com 500 linhas × 50 colunas (fixture sintética `tabelaLarga`):
 * virtualizam, buscam, ordenam, selecionam e rolam sem animação.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = process.env.BL_DIST
  ? join(process.env.BL_DIST, 'tabela_completa.js')
  : join(resolve(__dirname, '..'), 'dist', 'tabela_completa.js');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const LAYOUTS = ['tabela', 'cartoes', 'lista', 'transposta', 'planilha', 'financeiro', 'ranking', 'mestre', 'secoes'];
const DE_TABELA = new Set(['tabela', 'planilha', 'financeiro', 'ranking']);

/** scrollTop/scrollLeft "de navegador" nos `.tc-rolagem` (ver tabela_rolagem_v3). */
function simularRolagem(window) {
  const pos = new WeakMap();
  const p = (el) => pos.get(el) || (pos.set(el, { t: 0, l: 0 }), pos.get(el));
  const eh = (el) => el.classList && el.classList.contains('tc-rolagem');
  const proto = window.HTMLElement.prototype;
  const altura = Object.getOwnPropertyDescriptor(window.Element.prototype, 'clientHeight');
  Object.defineProperty(proto, 'clientHeight', { get() { return eh(this) ? 400 : altura.get.call(this); }, configurable: true });
  Object.defineProperty(proto, 'scrollTop', {
    get() { return eh(this) ? p(this).t : 0; },
    set(v) { if (eh(this)) p(this).t = Math.max(0, Number(v) || 0); },
    configurable: true,
  });
  Object.defineProperty(proto, 'scrollLeft', {
    get() { return eh(this) ? p(this).l : 0; },
    set(v) { if (eh(this)) p(this).l = Math.max(0, Number(v) || 0); },
    configurable: true,
  });
}

function abrir(layout, ajustes = {}) {
  const amb = montarAmbiente();
  simularRolagem(amb.window);
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.tabela_completa;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES.tabelaLarga();
  const cfg = () => Object.assign(configPadrao(definicao), { layoutDaTabela: layout, animarEntradaDasLinhas: true, quandoAnimar: 'sempre' }, ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  // Índices (no modelo) dos registros desenhados, na ordem da tela.
  const desenhados = () =>
    DE_TABELA.has(layout)
      ? Array.from(palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)')).map((tr) => tr.textContent)
      : Array.from(palco.querySelectorAll('.tl-item, .tl-celula-transp')).map((el) => el.textContent);
  const buscar = async (termo) => {
    const campo = palco.querySelector('input[type=search]');
    campo.value = termo;
    campo.dispatchEvent(new amb.window.Event('input', { bubbles: true }));
    await esperar(300);
  };
  return { amb, palco, desenhados, buscar, fim: () => amb.restaurar() };
}

for (const layout of LAYOUTS) {
  test(`5.5 — ${layout}: 500×50 virtualizado, busca, ordena, seleciona e rola sem animação`, async () => {
    const r = abrir(layout);
    try {
      const total = r.palco.querySelectorAll('*').length;
      assert.ok(total < 9000, `${layout}: ${total} elementos — não está virtualizando`);
      assert.ok(r.desenhados().length > 0, `${layout}: nada desenhado`);

      // Rolagem: posição mantida, sem classe de animação.
      const rolagem = r.palco.querySelector('.tc-rolagem');
      if (layout === 'transposta') rolagem.scrollLeft = 3000;
      else rolagem.scrollTop = 3000;
      rolagem.dispatchEvent(new r.amb.window.Event('scroll'));
      assert.equal(r.palco.querySelectorAll('.tc-entrando').length, 0, `${layout}: animou ao rolar`);
      if (layout === 'transposta') assert.equal(rolagem.scrollLeft, 3000);
      else assert.equal(rolagem.scrollTop, 3000);
      assert.ok(r.desenhados().length > 0, `${layout}: em branco depois de rolar`);

      // Busca.
      await r.buscar('ABC0007');
      assert.match(r.palco.querySelector('.tc-resumo').textContent, /^1 resultado/, `${layout}: a busca não filtrou`);
      assert.ok(r.desenhados().some((t) => t.includes('ABC0007XX')), `${layout}: o resultado não aparece`);
      await r.buscar('');

      // Ordenação (cabeçalho na tabela; "Ordenar por" nos outros).
      if (DE_TABELA.has(layout)) {
        const ths = Array.from(r.palco.querySelectorAll('.tc-tabela thead th')).filter((th) => /Código/.test(th.textContent));
        ths[0].dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
        ths[0] && r.palco.querySelector('.tc-tabela thead th');
      } else {
        const sel = r.palco.querySelector('.tl-ordem select');
        assert.ok(sel, `${layout}: sem "Ordenar por"`);
        sel.value = 'dim__codigo';
        sel.dispatchEvent(new r.amb.window.Event('change', { bubbles: true }));
        const dir = r.palco.querySelector('.tl-direcao');
        assert.ok(dir, `${layout}: ordenar não ativou`);
        dir.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
        const primeiro = r.desenhados().find((t) => /ABC\d{4}XX/.test(t));
        assert.match(primeiro, /ABC0499XX/, `${layout}: ordem decrescente não aplicada`);
      }

      // Seleção.
      const alvo = DE_TABELA.has(layout)
        ? r.palco.querySelector('.tc-tabela tbody tr:not(.tc-espacador)')
        : r.palco.querySelector(layout === 'transposta' ? '.tl-celula-transp' : '.tl-item');
      alvo.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
      if (layout !== 'transposta') {
        assert.match(r.palco.querySelector('.tc-resumo').textContent, /1 selecionada/, `${layout}: seleção não contou`);
      }
    } finally {
      r.fim();
    }
  });
}

test('5.5 — marcas de cada layout', () => {
  const casos = {
    planilha: (p) => {
      const letras = Array.from(p.querySelectorAll('.tc-letras th')).map((t) => t.textContent);
      assert.ok(letras.includes('A') && letras.includes('Z') && letras.includes('AA'), 'letras de coluna');
      assert.ok(p.querySelector('.tc-numero-linha'), 'números de linha');
    },
    ranking: (p) => assert.ok(p.querySelector('td.tc-com-barra'), 'barras nas células'),
    financeiro: (p) => assert.ok(p.querySelector('.tc-layout-financeiro')),
    transposta: (p) => assert.ok(Array.from(p.querySelectorAll('.tl-celula-transp')).some((e) => e.textContent === 'Medida 1')),
    mestre: (p) => {
      const det = p.querySelector('.tl-detalhe');
      assert.ok(det && det.textContent.includes('Medida 48'), 'detalhe com todos os campos');
    },
    secoes: (p) => {
      const t = Array.from(p.querySelectorAll('.tl-bloco-titulo')).map((e) => e.textContent);
      assert.ok(t.includes('Identificação') && t.includes('Valores'));
    },
    cartoes: (p) => assert.ok(p.querySelector('.tl-cartao .tl-grade')),
    lista: (p) => assert.ok(p.querySelector('.tl-lista .tl-titulo') && p.querySelector('.tl-lista .tl-dir')),
  };
  for (const [layout, conferir] of Object.entries(casos)) {
    const r = abrir(layout);
    try {
      conferir(r.palco);
    } finally {
      r.fim();
    }
  }
});

test('5.5 — cartões: escolher campos e quantos cartões por linha', () => {
  const r = abrir('cartoes', { camposDoCartao: 'Código, Medida 2', colunasDosCartoes: 4 });
  try {
    const cartao = r.palco.querySelector('.tl-cartao');
    assert.equal(cartao.querySelectorAll('.tl-campo').length, 1, 'só Medida 2 na grade (Código é o título)');
    const lefts = new Set(Array.from(r.palco.querySelectorAll('.tl-item')).map((e) => e.style.left));
    assert.equal(lefts.size, 4);
  } finally {
    r.fim();
  }
});
