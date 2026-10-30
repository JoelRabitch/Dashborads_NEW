/**
 * hover.test.mjs — destaque ao passar o mouse (correções v2, 2.6): o item
 * sob o mouse acende, os demais atenuam; a opção desliga.
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

const CASOS = [
  ['arvores_multiplas', 'hierarquia'],
  ['matriz_2x2', 'semPivo'],
  ['org_chart', 'paiFilho'],
  ['heatmap_denso', 'duasDimensoes'],
  ['barras_ranking_denso', 'semPivo'],
  ['pareto', 'semPivo'],
  ['treemap_carteira', 'hierarquia'],
  ['dumbbell', 'ohlc'],
  ['marimekko', 'duasDimensoes'],
  ['upset_plot', 'conjuntos3'],
];

for (const [id, fixture] of CASOS) {
  test(`${id} — passar o mouse destaca o item e atenua os outros; a opção desliga`, () => {
    const amb = montarAmbiente();
    try {
      amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
      const definicao = amb.registro[id];
      const inst = criarInstancia(definicao, amb.chamadasDeApi);
      const palco = amb.window.document.getElementById('palco');
      const { data, queryResponse } = FIXTURES[fixture]();
      const atualizar = (aj) =>
        inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), aj), queryResponse, {}, () => {});
      inst.create(palco, configPadrao(definicao));
      atualizar({});
      const area = palco.querySelector('.bl-area');
      const item = palco.querySelector('[data-item], .bl-marcador');
      assert.ok(item, `${id}: nenhum item marcado para o destaque`);
      item.dispatchEvent(new amb.window.MouseEvent('pointerover', { bubbles: true }));
      assert.ok(area.classList.contains('bl-hover-ativo'), `${id}: hover não ativou o destaque`);
      assert.ok(item.classList.contains('bl-sob-mouse'));
      area.dispatchEvent(new amb.window.MouseEvent('pointerleave', { bubbles: false }));
      assert.ok(!area.classList.contains('bl-hover-ativo'), 'sair do gráfico precisa apagar o destaque');
      atualizar({ destacarAoPassarMouse: false });
      const item2 = palco.querySelector('[data-item], .bl-marcador');
      item2.dispatchEvent(new amb.window.MouseEvent('pointerover', { bubbles: true }));
      assert.ok(!palco.querySelector('.bl-area').classList.contains('bl-hover-ativo'), 'a opção desligada ainda destaca');
    } finally {
      amb.restaurar();
    }
  });
}
