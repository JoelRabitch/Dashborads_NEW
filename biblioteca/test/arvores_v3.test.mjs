/**
 * arvores_v3.test.mjs — árvores e organograma (melhorias v3, 5.8 a 5.13).
 *
 * jsdom não faz layout: posições e larguras de texto são conferidas nos
 * números do desenho, com a função única `medida-texto.js`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES, celula, campoDimensao, campoMedida, montarQueryResponse } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { larguraDoTexto } from '../src/core/medida-texto.js';
import { opcoesComunsDasArvores } from '../src/charts/_arvore/comum.js';
import { trocarMoeda, lerTextoLongo, abreviarNumeros } from '../src/core/texto-longo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Hierarquia sintética com nomes longos e valores grandes. */
function hierarquiaLonga() {
  const dimensoes = [campoDimensao('n1', 'Região'), campoDimensao('n2', 'Praça'), campoDimensao('n3', 'Ponto')];
  const medidas = [campoMedida('valor', 'Valor', { valueFormat: '$#,##0.00' })];
  const data = [];
  ['Região Norte', 'Região Sul'].forEach((r, i) => {
    for (let p = 1; p <= 2; p++) {
      for (let k = 1; k <= 3; k++) {
        data.push({
          n1: celula(r),
          n2: celula(`${r} — Praça ${p}`),
          n3: celula(`Ponto de venda sintético número ${i}${p}${k} com nome bem comprido para testar`),
          valor: celula(1234567.89 * (k + p + i)),
        });
      }
    }
  });
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

function abrir(id, fixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = typeof fixture === 'string' ? FIXTURES[fixture]() : fixture;
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  const clicar = (el) => el.dispatchEvent(new amb.window.MouseEvent('click', { bubbles: true }));
  return { amb, palco, definicao, clicar, todos: (s) => Array.from(palco.querySelectorAll(s)), fim: () => amb.restaurar() };
}

const num = (el, a) => Number(el.getAttribute(a));

test('5.8 — opções comuns com os MESMOS ids, tipos e rótulos nos dois gráficos', () => {
  const am = abrir('arvores_multiplas', 'hierarquia');
  const oc = abrir('org_chart', 'paiFilho');
  try {
    for (const id of Object.keys(opcoesComunsDasArvores())) {
      const a = am.definicao.options[id];
      const b = oc.definicao.options[id];
      assert.ok(a && b, `"${id}" falta em um dos gráficos`);
      assert.equal(a.type, b.type, id);
      assert.equal(a.label, b.label, `${id}: rótulos diferentes`);
      assert.deepEqual(a.default, b.default, id);
    }
  } finally {
    am.fim();
    oc.fim();
  }
});

test('5.9 — abrir/fechar: filhos saem do pai e voltam para ele; desligado não anima; rolagem não anima', async () => {
  const r = abrir('arvores_multiplas', 'hierarquia');
  try {
    const comFilhos = () => r.todos('.av-no[data-recolhido="0"]')[0];
    r.clicar(comFilhos()); // fecha
    const fantasmas = r.todos('.bl-saindo');
    assert.ok(fantasmas.length > 0, 'ao fechar, os filhos deveriam voltar para o pai (fantasmas)');
    await esperar(30);
    assert.match(fantasmas[0].style.transform, /translate\(/, 'o fantasma deveria ir em direção ao pai');
    r.clicar(r.todos('.av-no[data-recolhido="1"]')[0]); // abre
    const entrando = r.todos('.bl-entrando');
    assert.ok(entrando.length > 0, 'ao abrir, os filhos deveriam sair do pai');
    assert.equal(entrando[0].style.opacity, '0');
    assert.match(entrando[0].style.transform, /translate\(/);
    // Rolagem: nada anima.
    await esperar(500);
    const celula = r.palco.querySelector('.am-celula');
    celula.dispatchEvent(new r.amb.window.Event('scroll'));
    assert.equal(r.todos('.bl-entrando, .bl-movendo, .bl-saindo').length, 0, 'rolagem não pode animar');
  } finally {
    r.fim();
  }
  const sem = abrir('arvores_multiplas', 'hierarquia', { animarExpandir: false });
  try {
    sem.clicar(sem.todos('.av-no[data-recolhido="0"]')[0]);
    assert.equal(sem.todos('.bl-saindo, .bl-entrando, .bl-movendo').length, 0, 'desligado não anima');
  } finally {
    sem.fim();
  }
  const oc = abrir('org_chart', 'paiFilho');
  try {
    oc.clicar(oc.palco.querySelector('.oc-botao'));
    assert.ok(oc.todos('.bl-saindo').length > 0, 'organograma: fechar deveria animar a volta ao pai');
  } finally {
    oc.fim();
  }
});

test('5.10 — organograma: centraliza quando cabe, rola sem cortar quando não cabe; botão "Centralizar"', () => {
  const pequeno = abrir('org_chart', 'paiFilho', { larguraDoCartao: 70, espacoEntreIrmaos: 4, cartaoAjustavel: false });
  try {
    const svg = pequeno.palco.querySelector('.oc-area > svg');
    // v3.3: no ajuste automático a largura da barra de rolagem fica reservada (18 px no jsdom).
    const util = 900 - 18;
    assert.equal(num(svg, 'width'), util, 'cabe: o svg tem o tamanho da área (sem barra de rolagem)');
    const g = svg.querySelector('g');
    const tx = Number(/translate\(([-\d.]+)/.exec(g.getAttribute('transform'))[1]);
    const caixas = pequeno.todos('.oc-caixa').map((c) => num(c, 'x') + tx);
    const esq = Math.min(...caixas);
    const dir = Math.max(...pequeno.todos('.oc-caixa').map((c) => num(c, 'x') + num(c, 'width') + tx));
    assert.ok(Math.abs(esq - (util - dir)) < 30, `não centralizou (sobra ${esq.toFixed(0)} à esquerda e ${(util - dir).toFixed(0)} à direita)`);
    assert.ok(pequeno.palco.querySelector('.am-centralizar'), 'falta o botão Centralizar');
  } finally {
    pequeno.fim();
  }
  const grande = abrir('org_chart', 'paiFilho', { larguraDoCartao: 300, espacoEntreIrmaos: 80 });
  try {
    const area = grande.palco.querySelector('.oc-area');
    const svg = area.querySelector('svg');
    assert.ok(num(svg, 'width') > 900, 'não cabe: o svg é maior que a área (rola)');
    const g = svg.querySelector('g');
    const tx = Number(/translate\(([-\d.]+)/.exec(g.getAttribute('transform'))[1]);
    const esq = Math.min(...grande.todos('.oc-caixa').map((c) => num(c, 'x') + tx));
    assert.ok(esq >= 0, 'o lado esquerdo foi cortado');
  } finally {
    grande.fim();
  }
});

test('5.11 — Texto longo: "Mostrar inteiro" não corta nem sai da árvore; outros modos', () => {
  const inteiro = abrir('arvores_multiplas', hierarquiaLonga(), { mostrarValorNoRotulo: true });
  try {
    const rotulos = inteiro.todos('.av-rotulo').filter((e) => e.getAttribute('display') !== 'none');
    assert.ok(rotulos.length > 0);
    for (const el of rotulos) {
      assert.doesNotMatch(el.textContent, /…/, 'modo inteiro não pode cortar');
      const svg = el.closest('svg');
      const g = el.closest('g[transform]');
      const tx = g ? Number(/translate\(([-\d.]+)/.exec(g.getAttribute('transform'))[1]) : 0;
      const w = larguraDoTexto(el.textContent, Number(el.getAttribute('font-size')) || 11);
      const x = num(el, 'x') + tx;
      const x1 = el.getAttribute('text-anchor') === 'end' ? x : x + w;
      assert.ok(x1 <= num(svg, 'width') + 0.5, `"${el.textContent.slice(0, 30)}…" sai da árvore`);
    }
  } finally {
    inteiro.fim();
  }
  const ret = abrir('arvores_multiplas', hierarquiaLonga(), { modoDoTextoLongo: 'reticencias', truncarRotulo: 60 });
  const so = abrir('arvores_multiplas', hierarquiaLonga(), { modoDoTextoLongo: 'soNome', mostrarValorNoRotulo: true });
  const qb = abrir('arvores_multiplas', hierarquiaLonga(), { modoDoTextoLongo: 'quebrar', linhasMaximasDoRotulo: 2 });
  try {
    for (const el of ret.todos('.av-rotulo')) assert.ok(el.textContent.length <= 60, `truncarRotulo=60 no modo reticências: ${el.textContent.length}`);
    assert.ok(so.todos('.av-rotulo').every((e) => !/\$/.test(e.textContent)), '"Só o nome" não mostra o valor');
    assert.ok(qb.palco.querySelector('.av-rotulo tspan'), '"Quebrar em linhas" deveria gerar linhas');
  } finally {
    ret.fim();
    so.fim();
    qb.fim();
  }
});

test('5.11 — organograma: no modo inteiro o cartão cresce até o maior nome (sem "…")', () => {
  const r = abrir('org_chart', hierarquiaLonga());
  try {
    const largura = num(r.palco.querySelector('.oc-caixa'), 'width');
    for (const nome of r.todos('.oc-nome')) {
      assert.doesNotMatch(nome.textContent, /…/);
      assert.ok(larguraDoTexto(nome.textContent, Number(nome.getAttribute('font-size')), { negrito: true }) <= largura, 'nome maior que o cartão');
    }
  } finally {
    r.fim();
  }
});

test('5.11 — seleção de texto, moeda e abreviação', () => {
  const r = abrir('arvores_multiplas', 'hierarquia');
  const s = abrir('arvores_multiplas', 'hierarquia', { permitirSelecionarTexto: true });
  try {
    assert.ok(r.palco.querySelector('.am-sem-selecao'), 'padrão: texto não selecionável');
    assert.equal(s.palco.querySelector('.am-sem-selecao'), null);
  } finally {
    r.fim();
    s.fim();
  }
  const tl = (v) => lerTextoLongo({ simboloDaMoedaDoRotulo: v, moedaPersonalizadaDoRotulo: 'USD' });
  assert.equal(trocarMoeda('R$ 1.234', tl('$')), '$1.234');
  assert.equal(trocarMoeda('$1,234', tl('nenhum')), '1,234');
  assert.equal(trocarMoeda('$1,234', tl('personalizado')), 'USD 1,234');
  assert.equal(trocarMoeda('$1,234', tl('auto')), '$1,234');
  assert.equal(abreviarNumeros('$12,345,678.90'), '$12.3M');
});

test('5.12 — grade: espaços, largura/altura por árvore e linhas-guia', () => {
  const r = abrir('arvores_multiplas', 'hierarquia', { espacoHorizontalDaGrade: 12, espacoVerticalDaGrade: 8, linhasGuiaDaGrade: true });
  try {
    const grade = r.palco.querySelector('.md-grade');
    assert.equal(grade.style.columnGap, '12px');
    assert.equal(grade.style.rowGap, '8px');
    assert.ok(r.palco.querySelector('.am-celula').style.outline.includes('dashed'));
    const ids = Object.keys(r.definicao.options).filter((k) => /^largura_/.test(k));
    assert.ok(ids.length >= 3, 'faltam as opções de largura por árvore');
  } finally {
    r.fim();
  }
  const largura = abrir('arvores_multiplas', 'hierarquia', { largura_Comercial: 333 });
  try {
    const cel = largura.palco.querySelector('.am-celula[data-arvore="Comercial"]');
    assert.equal(cel.style.width, '333px');
  } finally {
    largura.fim();
  }
});

test('5.13 — organograma: botões Expandir/Colapsar (defeito), contador contido, estilos e ligações', () => {
  const r = abrir('org_chart', 'paiFilho', { mostrarBotoesDeExpandir: true });
  try {
    assert.ok(r.palco.querySelector('.am-expandir') && r.palco.querySelector('.am-colapsar'), 'botões não aparecem');
    const antes = r.todos('.oc-cartao').length;
    r.clicar(r.palco.querySelector('.am-colapsar'));
    assert.ok(r.todos('.oc-cartao').length < antes, 'Colapsar tudo não colapsou');
    // Contador "+N" contido no círculo.
    const botao = r.palco.querySelector('.oc-botao');
    const texto = botao.querySelector('text');
    const circ = botao.querySelector('circle');
    const w = larguraDoTexto(texto.textContent, num(texto, 'font-size'), { negrito: true });
    assert.ok(num(circ, 'r') * 2 >= w + 2, `"${texto.textContent}" não cabe no círculo`);
    r.clicar(r.palco.querySelector('.am-expandir'));
    assert.equal(r.todos('.oc-cartao').length, antes);
  } finally {
    r.fim();
  }
  const p = abrir('org_chart', 'paiFilho', { estiloDoContador: 'pilula', formaDaLigacaoDoOrg: 'curva', sombraDoCartao: true, corDoCartaoPor: 'nivel', alinhamentoDoTextoDoCartao: 'esquerda' });
  const o = abrir('org_chart', 'paiFilho', { estiloDoContador: 'oculto' });
  try {
    assert.ok(p.palco.querySelector('.oc-botao rect'), 'pílula');
    assert.match(p.palco.querySelector('.oc-ligacao').getAttribute('d'), /C/, 'ligação curva');
    assert.ok(p.palco.querySelector('.oc-caixa[filter]'), 'sombra');
    assert.equal(p.palco.querySelector('.oc-nome').getAttribute('text-anchor'), 'start');
    assert.equal(o.palco.querySelector('.oc-botao'), null, 'contador oculto');
  } finally {
    p.fim();
    o.fim();
  }
});
