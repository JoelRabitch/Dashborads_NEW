/**
 * correcoes_arvores_expandir.test.mjs — expandir/colapsar da
 * arvores_multiplas (Fase C das correções v2).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

function preparar(ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, 'arvores_multiplas.js'), 'utf8'));
  const definicao = amb.registro.arvores_multiplas;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES.hierarquia();
  inst.create(palco, configPadrao(definicao));
  const atualizar = (aj = ajustes) =>
    inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), aj), queryResponse, {}, () => {});
  atualizar();
  const clicar = (el, extra = {}) => el.dispatchEvent(new amb.window.MouseEvent('click', { bubbles: true, ...extra }));
  return {
    amb, palco, atualizar, clicar,
    nos: () => Array.from(palco.querySelectorAll('.av-no')),
    internos: () => Array.from(palco.querySelectorAll('.av-no[data-recolhido]')),
    botao: (txt) => Array.from(palco.querySelectorAll('button')).find((b) => b.textContent === txt),
    fim: () => amb.restaurar(),
  };
}

test('árvores — clique num nó com filhos colapsa e expande (com + / −) e o estado sobrevive à atualização', () => {
  const r = preparar();
  try {
    const total = r.nos().length;
    const alvo = r.internos().find((n) => n.getAttribute('data-recolhido') === '0');
    assert.ok(alvo, 'nenhum nó com filhos marcado');
    const chave = alvo.getAttribute('data-item');
    r.clicar(alvo);
    assert.ok(r.nos().length < total, 'colapsar não escondeu os filhos');
    const recolhido = r.palco.querySelector(`.av-no[data-item="${chave}"]`);
    assert.equal(recolhido.getAttribute('data-recolhido'), '1');
    assert.ok(Array.from(r.palco.querySelectorAll('.am-indicador')).some((t) => t.textContent === '+'), 'falta o indicador +');
    r.atualizar();
    assert.ok(r.nos().length < total, 'o estado se perdeu na atualização');
    r.clicar(r.palco.querySelector(`.av-no[data-item="${chave}"]`));
    assert.equal(r.nos().length, total, 'expandir não trouxe os filhos de volta');
  } finally {
    r.fim();
  }
});

test('árvores — Expandir tudo / Colapsar tudo e nível inicial', () => {
  const r = preparar();
  try {
    const total = r.nos().length;
    r.clicar(r.botao('Colapsar tudo'));
    const colapsado = r.nos().length;
    assert.ok(colapsado < total, 'Colapsar tudo não colapsou');
    r.clicar(r.botao('Expandir tudo'));
    assert.equal(r.nos().length, total);
    r.atualizar({ nivelInicialExpandido: 1 });
    assert.ok(r.nos().length < total, 'nível inicial 1 deveria abrir só o primeiro nível de cada ramo');
  } finally {
    r.fim();
  }
});

test('árvores — nó sem filhos segue a ação do clique (drill)', () => {
  const r = preparar();
  try {
    const folha = r.nos().find((n) => !n.hasAttribute('data-recolhido'));
    assert.ok(folha);
    const antes = r.nos().length;
    r.clicar(folha);
    assert.equal(r.nos().length, antes, 'folha não pode colapsar nada');
  } finally {
    r.fim();
  }
});
