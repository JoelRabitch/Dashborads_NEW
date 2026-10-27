/**
 * correcoes_tabela.test.mjs — defeitos da tabela_completa relatados no
 * Looker real (seção 7 das correções v2). Cada teste reproduz um defeito.
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

function preparar(ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.tabela_completa;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const { data, queryResponse } = FIXTURES.semPivo();
  const palco = amb.window.document.getElementById('palco');
  inst.create(palco, configPadrao(definicao));
  inst.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), ajustes), queryResponse, {}, () => {});
  return { amb, palco, doc: amb.window.document, fim: () => amb.restaurar() };
}

test('tabela — digitar no filtro NÃO tira o foco do campo (nem recria o input)', async () => {
  const r = preparar({ mostrarFiltrosPorColuna: true });
  try {
    const campo = r.palco.querySelector('.tc-filtro');
    campo.focus();
    campo.value = 'Ce';
    campo.setSelectionRange(2, 2);
    campo.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));
    await esperar(400);
    assert.ok(campo.isConnected, 'o input foi recriado: o usuário perde o que digita');
    assert.equal(r.doc.activeElement, campo, 'o foco saiu do campo depois de uma tecla');
    assert.equal(campo.selectionStart, 2, 'o cursor mudou de lugar');
    const linhas = r.palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)').length;
    assert.ok(linhas > 0, 'o filtro precisa continuar filtrando');
  } finally {
    r.fim();
  }
});

test('tabela — a busca geral também preserva o foco', async () => {
  const r = preparar();
  try {
    const campo = r.palco.querySelector('input[type=search]');
    campo.focus();
    campo.value = 'a';
    campo.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));
    await esperar(400);
    assert.ok(campo.isConnected && r.doc.activeElement === campo, 'a busca perdeu o foco');
  } finally {
    r.fim();
  }
});

test('tabela — área de rolagem pode encolher (rolagem vertical e horizontal)', () => {
  // Defeito: .tc-rolagem é filho flex sem min-height:0 — cresce até o
  // tamanho do conteúdo e o overflow:hidden do pai corta, sem barra.
  const r = preparar();
  try {
    const css = Array.from(r.palco.querySelectorAll('style')).map((s) => s.textContent).join('\n');
    const regra = /\.tc-rolagem\{([^}]*)\}/.exec(css);
    assert.ok(regra, 'regra .tc-rolagem não encontrada');
    assert.match(regra[1], /min-height:0/, 'falta min-height:0 na área de rolagem');
    assert.match(regra[1], /overflow:auto/, 'a área precisa rolar nos dois sentidos');
  } finally {
    r.fim();
  }
});

test('tabela — Exportar CSV oferece o texto para copiar (o iframe pode bloquear download)', () => {
  const r = preparar();
  try {
    const botao = Array.from(r.palco.querySelectorAll('button')).find((b) => /Exportar CSV/.test(b.textContent));
    assert.ok(botao, 'botão Exportar CSV ausente');
    botao.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    const painel = r.doc.querySelector('.tc-csv');
    assert.ok(painel, 'nenhuma alternativa ao download apareceu');
    const area = painel.querySelector('textarea');
    assert.ok(area && area.value.split('\n').length > 2, 'o CSV não está no painel');
    assert.ok(Array.from(painel.querySelectorAll('button')).some((b) => /Copiar/.test(b.textContent)), 'falta o botão Copiar');
  } finally {
    r.fim();
  }
});

test('tabela — todo campo de formulário tem id único e name; todo label aponta para um id', () => {
  const r = preparar({ mostrarFiltrosPorColuna: true });
  try {
    const botao = Array.from(r.palco.querySelectorAll('button')).find((b) => /Exportar CSV/.test(b.textContent));
    botao.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    const campos = Array.from(r.doc.querySelectorAll('input, select, textarea'));
    assert.ok(campos.length >= 3);
    const ids = campos.map((c) => c.id);
    assert.ok(ids.every((id) => id && /^tabela_completa-/.test(id)), `campo sem id com prefixo: ${JSON.stringify(ids)}`);
    assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
    assert.ok(campos.every((c) => c.name), 'campo sem name');
    for (const label of r.doc.querySelectorAll('label[for]')) {
      assert.ok(r.doc.getElementById(label.htmlFor), `label for="${label.htmlFor}" aponta para nada`);
    }
  } finally {
    r.fim();
  }
});
