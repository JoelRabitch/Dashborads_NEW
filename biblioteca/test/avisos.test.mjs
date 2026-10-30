/**
 * avisos.test.mjs — componente único de avisos (correções v2, módulo 2.5).
 *
 * Defeitos reproduzidos: o aviso amarelo era absoluto POR CIMA do gráfico
 * (cobria o botão de avançar do bar_race e a rolagem) e não tinha como
 * fechar nem reposicionar.
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

/** A tabela avisa "O Looker não enviou os totais" com a fixture semPivo. */
function renderizar(ajustes = {}) {
  const amb = montarAmbiente();
  const avisosNoConsole = [];
  const warnOriginal = console.warn;
  console.warn = (...a) => avisosNoConsole.push(a.join(' '));
  amb.window.eval(readFileSync(join(DIST, 'tabela_completa.js'), 'utf8'));
  const definicao = amb.registro.tabela_completa;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES.semPivo();
  const atualizar = (aj) =>
    inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), aj), queryResponse, {}, () => {});
  inst.create(palco, configPadrao(definicao));
  atualizar(ajustes);
  return {
    amb, palco, atualizar, avisosNoConsole,
    aviso: () => palco.querySelector('.bl-aviso'),
    fim() { console.warn = warnOriginal; amb.restaurar(); },
  };
}

test('aviso — aparece no fluxo (não por cima do gráfico) e tem botão de fechar', () => {
  const r = renderizar();
  try {
    const aviso = r.aviso();
    assert.ok(aviso && aviso.style.display !== 'none', 'o aviso de totais deveria aparecer');
    const css = Array.from(r.palco.querySelectorAll('style')).map((s) => s.textContent).join('\n');
    const regra = /\.bl-aviso\{([^}]*)\}/.exec(css);
    assert.ok(regra && !/position:absolute/.test(regra[1]), 'o aviso não pode ser absoluto por cima do gráfico');
    assert.equal(aviso.nextElementSibling, r.palco.querySelector('.bl-area'), 'topo = antes da área do gráfico');
    const fechar = aviso.querySelector('.bl-aviso-fechar');
    assert.ok(fechar, 'falta o botão de fechar');
    fechar.dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(aviso.style.display, 'none', 'fechar não escondeu');
    r.atualizar({});
    assert.equal(r.aviso().style.display, 'none', 'o mesmo aviso voltou depois de fechado');
  } finally {
    r.fim();
  }
});

test('aviso — posição rodapé, oculto e "Mostrar avisos" desligado; console sempre recebe', () => {
  const r = renderizar({ posicaoDosAvisos: 'rodape' });
  try {
    const area = r.palco.querySelector('.bl-area');
    assert.equal(area.nextElementSibling, r.aviso(), 'rodapé = depois da área');
    r.atualizar({ posicaoDosAvisos: 'oculto' });
    assert.equal(r.aviso().style.display, 'none');
    r.atualizar({ mostrarAvisos: false });
    assert.equal(r.aviso().style.display, 'none');
    assert.ok(r.avisosNoConsole.some((m) => /totais/.test(m)), 'o aviso precisa ir para o console mesmo oculto');
  } finally {
    r.fim();
  }
});
