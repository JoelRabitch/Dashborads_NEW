/**
 * tabela_busca_v3.test.mjs — busca "contém" da tabela (melhorias v3, 5.3).
 * Códigos sintéticos (fixture `codigosSinteticos`).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { criarBusca } from '../src/charts/tabela_completa/busca.js';

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
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES.codigosSinteticos();
  inst.create(palco, configPadrao(definicao));
  inst.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), ajustes), queryResponse, {}, () => {});
  const buscar = async (termo) => {
    const campo = palco.querySelector('input[type=search]');
    campo.focus();
    campo.value = termo;
    campo.setSelectionRange(termo.length, termo.length);
    campo.dispatchEvent(new amb.window.Event('input', { bubbles: true }));
    await esperar(350);
    return campo;
  };
  const codigos = () =>
    Array.from(palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)'))
      .map((tr) => (tr.querySelector('td') ? tr.querySelector('td').textContent : ''))
      .filter((t) => /^[A-Z0-9]{10}$/.test(t));
  return { amb, palco, buscar, codigos, fim: () => amb.restaurar() };
}

test('5.3 — "contém": o termo acha em qualquer posição (começo, meio, fim)', async () => {
  const r = preparar();
  try {
    await r.buscar('BLACK');
    assert.deepEqual(r.codigos().sort(), ['ABCBLACKXX', 'BLACKQRS01', 'XYZBLACKBR']);
    await r.buscar('br');
    assert.deepEqual(r.codigos().sort(), ['ABCWHITEBR', 'MNOGREENBR', 'XYZBLACKBR']);
  } finally {
    r.fim();
  }
});

test('5.3 — ignora maiúsculas e acentos', async () => {
  const r = preparar();
  try {
    await r.buscar('ACUCAR');
    assert.deepEqual(r.codigos(), ['MNOGREENBR']);
    await r.buscar('termico');
    assert.deepEqual(r.codigos(), ['XYZBLACKBR']);
  } finally {
    r.fim();
  }
});

test('5.3 — várias palavras: todas precisam estar (padrão); "qualquer uma" opcional', async () => {
  const r = preparar();
  try {
    await r.buscar('black br');
    assert.deepEqual(r.codigos(), ['XYZBLACKBR']);
  } finally {
    r.fim();
  }
  const q = preparar({ modoDaBusca: 'qualquer' });
  try {
    await q.buscar('kraft green');
    assert.deepEqual(q.codigos().sort(), ['MNOGREENBR', 'QRSKRAFTXX']);
  } finally {
    q.fim();
  }
});

test('5.3 — frase entre aspas é exata; -palavra exclui', async () => {
  const r = preparar();
  try {
    await r.buscar('"caneca preta"');
    assert.deepEqual(r.codigos(), ['ABCBLACKXX']);
    await r.buscar('black -br');
    assert.deepEqual(r.codigos().sort(), ['ABCBLACKXX', 'BLACKQRS01']);
  } finally {
    r.fim();
  }
});

test('5.3 — escolher colunas e buscar no valor bruto', async () => {
  const soCodigo = preparar({ colunasDaBusca: 'Código' });
  try {
    await soCodigo.buscar('caneca');
    assert.deepEqual(soCodigo.codigos(), [], 'a busca olhou a coluna Descrição, que ficou de fora');
  } finally {
    soCodigo.fim();
  }
  const bruto = preparar({ buscarEm: 'bruto' });
  try {
    await bruto.buscar('$25');
    assert.deepEqual(bruto.codigos(), [], 'no valor bruto o "$" do formato não existe');
    await bruto.buscar('3.2');
    assert.deepEqual(bruto.codigos(), ['QRSKRAFTXX']);
  } finally {
    bruto.fim();
  }
});

test('5.3 — realce do trecho, contador de resultados e foco mantido', async () => {
  const r = preparar();
  try {
    const campo = await r.buscar('black');
    const marcas = Array.from(r.palco.querySelectorAll('.tc-tabela tbody mark.tc-realce'));
    assert.ok(marcas.length >= 3, 'trecho encontrado não foi realçado');
    assert.ok(marcas.every((m) => m.textContent.toLowerCase() === 'black'));
    assert.match(r.palco.querySelector('.tc-resumo').textContent, /3 resultado/);
    assert.equal(r.amb.window.document.activeElement, campo, 'o campo perdeu o foco');
    assert.equal(campo.selectionStart, 5, 'o cursor mudou de lugar');
  } finally {
    r.fim();
  }
});

test('5.3 — o analisador da busca (unidade)', () => {
  const casa = (termo, texto, modo) => criarBusca(termo, { modo }).casa([texto]);
  assert.ok(casa('BLACK', 'ABCBLACKXX'));
  assert.ok(casa('çã', 'AÇÃO'));
  assert.ok(!casa('"preta caneca"', 'Caneca preta'));
  assert.ok(casa('a -b', 'xa'));
  assert.ok(!casa('a -b', 'ab'));
  assert.ok(casa('x y', 'x', 'qualquer'));
  assert.ok(!casa('x y', 'x'));
  assert.ok(casa('', 'qualquer coisa'));
  assert.ok(casa('-', '-'), 'hífen sozinho é texto');
});
