/**
 * animacao.test.mjs — animação de entrada/atualização (correções v2, 2.7).
 *
 * Defeito reproduzido: gráficos com a aba Animação (venn, upset, árvores,
 * organograma) declaravam as opções e não animavam nada.
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

function preparar(id, fixture, { menosMovimento = false } = {}) {
  const amb = montarAmbiente();
  amb.window.matchMedia = (q) => ({ matches: menosMovimento && /reduce/.test(q), addListener() {}, removeListener() {} });
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES[fixture]();
  inst.create(palco, configPadrao(definicao));
  return {
    palco,
    atualizar(aj = {}) {
      inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), aj), queryResponse, {}, () => {});
    },
    animados: () => Array.from(palco.querySelectorAll('.bl-area *')).filter((e) => /bl-surgir/.test(e.style.animation || '')),
    fim: () => amb.restaurar(),
  };
}

const CASOS = [
  ['diagrama_venn', 'conjuntos3'],
  ['org_chart', 'paiFilho'],
  ['arvores_multiplas', 'hierarquia'],
  ['upset_plot', 'conjuntos4'],
  ['pareto', 'semPivo'],
];

for (const [id, fixture] of CASOS) {
  test(`${id} — anima na entrada com a duração e a curva do painel; desligar desliga`, () => {
    const r = preparar(id, fixture);
    try {
      r.atualizar({ animacaoAtiva: true, duracaoDaAnimacao: 900, suavizacaoDaAnimacao: 'linear' });
      const animados = r.animados();
      assert.ok(animados.length > 0, `${id}: nada animou`);
      assert.match(animados[0].style.animation, /900ms linear/);
      r.atualizar({ animacaoAtiva: false });
      assert.equal(r.animados().length, 0, `${id}: "Ativar animações" desligado ainda anima`);
      r.atualizar({ animacaoAtiva: true, quandoAnimar: 'primeira' });
      assert.equal(r.animados().length, 0, `${id}: "só na primeira carga" animou na atualização`);
    } finally {
      r.fim();
    }
  });
}

test('animação — respeita prefers-reduced-motion', () => {
  const r = preparar('diagrama_venn', 'conjuntos3', { menosMovimento: true });
  try {
    r.atualizar({ animacaoAtiva: true });
    assert.equal(r.animados().length, 0);
  } finally {
    r.fim();
  }
});
