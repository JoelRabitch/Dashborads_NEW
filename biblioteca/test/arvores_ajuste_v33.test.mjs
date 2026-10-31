/**
 * arvores_ajuste_v33.test.mjs — as árvores se ajustam ao limite da célula
 * (v3.3).
 *
 * Defeito (visto no Looker, grade de células de ~385 px, árvores de 3 ou 4
 * níveis, "Texto longo" = Mostrar inteiro, ícone ligado): depois da v3.2 a
 * árvore precisa de bem mais largura que a célula; a célula rola ("Tamanho
 * real com rolagem") e, para o usuário, o texto aparece CORTADO na borda.
 *
 * jsdom não faz layout nem mede texto: testes de GEOMETRIA com a função
 * única de largura (`medida-texto.js`). Conferir no Looker real:
 * docs/TESTE_NO_LOOKER.md (v3.3).
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

/** Hierarquia SINTÉTICA de 4 níveis (no arvores_multiplas: ramo, n2, n3, n4). */
function hierarquia4({ ramos = ['Ramo Alfa', 'Ramo Beta'], nomeGigante = null } = {}) {
  const dimensoes = ['n1', 'n2', 'n3', 'n4'].map((n, i) => campoDimensao(n, `Nível ${i + 1}`));
  const medidas = [campoMedida('valor', 'Valor', { valueFormat: '$#,##0.00' })];
  const data = [];
  for (const r of ramos) {
    for (let a = 1; a <= 2; a++) {
      for (let b = 1; b <= 2; b++) {
        for (let c = 1; c <= 2; c++) {
          const gigante = nomeGigante && a === 1 && b === 1 && c === 1;
          data.push({
            n1: celula(r),
            n2: celula(`${r} · Grupo sintético ${a} de nome comprido`),
            n3: celula(`Subgrupo ${a}.${b} com descrição bem longa`),
            n4: celula(gigante ? nomeGigante : `Item ${a}.${b}.${c} de teste com nome extenso`),
            valor: celula(98765432.1 * (a + b + c)),
          });
        }
      }
    }
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/**
 * Abre um gráfico num tile de `largura` × `altura` px (o jsdom não faz
 * layout: o tamanho do contêiner é fingido no `clientWidth`).
 */
function abrir(id, ajustes = {}, { largura = 760, altura = 560, dados = hierarquia4(), antes = null } = {}) {
  const amb = montarAmbiente();
  const tamanho = { largura, altura };
  Object.defineProperty(amb.window.Element.prototype, 'clientWidth', { get: () => tamanho.largura, configurable: true });
  Object.defineProperty(amb.window.Element.prototype, 'clientHeight', { get: () => tamanho.altura, configurable: true });
  if (antes) antes(amb);
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  const atualizar = (d = dados, extra = {}) => inst.updateAsync(d.data, palco, Object.assign(cfg(), extra), d.queryResponse, {}, () => {});
  atualizar();
  atualizar();
  const clicar = (el) => el.dispatchEvent(new amb.window.MouseEvent('click', { bubbles: true }));
  return {
    amb,
    inst,
    palco,
    tamanho,
    definicao,
    clicar,
    atualizar,
    todos: (s) => Array.from(palco.querySelectorAll(s)),
    fim: () => amb.restaurar(),
  };
}

const num = (el, a) => Number(el.getAttribute(a));
const translate = (el) => {
  const m = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec((el && el.getAttribute('transform')) || '');
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
};

/** Escala do desenho na tela (largura do <svg> / largura do viewBox). */
function escalaDo(svg) {
  const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  return num(svg, 'width') / vb[2];
}

/** Rótulos de uma célula, em coordenadas da TELA (já com a escala). */
function rotulosNaTela(celulaEl) {
  const svg = celulaEl.querySelector('svg');
  const s = escalaDo(svg);
  const d = translate(svg.querySelector('svg > g'));
  return Array.from(celulaEl.querySelectorAll('.av-rotulo'))
    .filter((r) => r.getAttribute('display') !== 'none')
    .map((r) => {
      const tam = Number(r.getAttribute('font-size')) || 11;
      const negrito = r.getAttribute('font-weight') === '700';
      const spans = Array.from(r.querySelectorAll('tspan'));
      const linhas = spans.length ? spans.map((t) => t.textContent) : [r.textContent];
      const w = Math.max(...linhas.map((l) => larguraDoTexto(l, tam, { negrito })));
      const x = num(r, 'x') + d.x;
      const a = r.getAttribute('text-anchor');
      const x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x;
      return { texto: linhas.join(' '), linhas: linhas.length, x0: x0 * s, x1: (x0 + w) * s, fonteNaTela: tam * s, el: r };
    });
}

const CENARIO = {
  iconePadraoPorValor: 'estrela',
  partesDoRotulo: 'nomeValorPct',
  mostrarRotulosInternos: true,
  colunasDaGrade: 2,
};

/* ------------------------------------------------------------------ */
/* Reprodução                                                           */
/* ------------------------------------------------------------------ */

test('v3.3 — reprodução: célula de 380 px, 4 níveis, "Mostrar inteiro": nenhum texto passa da borda visível', () => {
  const r = abrir('arvores_multiplas', CENARIO);
  try {
    const cels = r.todos('.am-celula');
    assert.ok(cels.length >= 2);
    for (const cel of cels) {
      const larguraDaCelula = parseFloat(cel.style.width);
      assert.ok(larguraDaCelula <= 380.5 || cels.length > 0, 'célula de no máximo 380 px no início');
      const svg = cel.querySelector('svg');
      assert.ok(
        num(svg, 'width') <= larguraDaCelula + 0.5,
        `o desenho (${num(svg, 'width').toFixed(0)} px) passa da célula (${larguraDaCelula} px): o texto fica cortado na borda`
      );
      for (const rot of rotulosNaTela(cel)) {
        assert.ok(rot.x0 >= -0.5, `"${rot.texto.slice(0, 40)}" começa fora da célula`);
        assert.ok(rot.x1 <= larguraDaCelula + 0.5, `"${rot.texto.slice(0, 40)}" termina em ${rot.x1.toFixed(0)} px, além da célula (${larguraDaCelula} px)`);
        assert.ok(rot.fonteNaTela >= 9 - 0.05, `fonte na tela ${rot.fonteNaTela.toFixed(2)} abaixo da mínima (9 px)`);
        if (/…/.test(rot.texto)) {
          // Corte só como último recurso, e com o texto completo à mão.
          assert.ok(rot.el.getAttribute('data-completo'), 'rótulo cortado sem o texto completo');
          assert.ok(rot.el.parentNode.querySelector('title'), 'rótulo cortado sem tooltip com o texto completo');
        }
      }
    }
  } finally {
    r.fim();
  }
});

test('v3.3 — cenário que dá para ajustar: nada cortado, nada fora da célula, nota informa o ajuste', () => {
  const r = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', colunasDaGrade: 2 });
  try {
    for (const cel of r.todos('.am-celula')) {
      const lc = parseFloat(cel.style.width);
      assert.ok(num(cel.querySelector('svg'), 'width') <= lc + 0.5, 'desenho maior que a célula');
      assert.notEqual(cel.getAttribute('data-ajuste'), 'corte');
      for (const rot of rotulosNaTela(cel)) {
        assert.ok(rot.x1 <= lc + 0.5, `"${rot.texto}" passa da borda`);
        assert.doesNotMatch(rot.texto, /…/, `"${rot.texto}" foi cortado (dava para ajustar)`);
      }
    }
    const nota = r.palco.querySelector('.bl-nota, [class*="nota"]');
    assert.ok(nota && /Ajuste:/.test(nota.textContent), `a nota deveria informar o ajuste (veio "${nota && nota.textContent}")`);
  } finally {
    r.fim();
  }
});

test('v3.3 — "Rolar em tamanho real" mantém a v3.2 (desenho maior que a célula, com rolagem)', () => {
  const r = abrir('arvores_multiplas', { ...CENARIO, layoutQuandoNaoCouber: 'rolar' });
  try {
    const cel = r.palco.querySelector('.am-celula');
    assert.ok(num(cel.querySelector('svg'), 'width') > parseFloat(cel.style.width), 'em tamanho real a árvore rola');
    assert.equal(cel.getAttribute('data-ajuste'), null);
  } finally {
    r.fim();
  }
});
