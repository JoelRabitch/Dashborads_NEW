/**
 * cabecalho_v3.test.mjs — título, subtítulo e nota (melhorias v3, 5.1c).
 *
 * jsdom não faz layout, então a geometria é conferida no PLANO que o
 * componente usa para dar altura às faixas (`planejarCabecalho`), com a
 * largura de texto estimada pela função única `medida-texto.js`.
 * Conferir no Looker real: docs/TESTE_NO_LOOKER.md, "Melhorias v3".
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { planejarCabecalho, textoFinalDaNota, opcoesDoCabecalho } from '../src/core/cabecalho.js';
import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { lerRegistro } from '../build/listar-opcoes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

const TEXTOS = {
  titulo: 'Receita por região e canal no trimestre',
  subtitulo: 'valores em milhares, sem impostos',
  nota: '30 séries · 53 períodos · 20 barras por vez · a comparação só vale com o gráfico PARADO: o caminho entre dois períodos passa rápido demais para ser retido · escala fixa: as larguras são comparáveis entre períodos',
};
const PADRAO = Object.fromEntries(Object.entries(opcoesDoCabecalho()).map(([k, o]) => [k, o.default]));
const TILES = [
  [900, 560],
  [420, 260],
  [240, 160],
  [160, 120],
];

function caixas(plano) {
  return plano.topo.concat(plano.base).map((i) => ({ tipo: i.tipo, y0: i.y - i.estilo.dy, y1: i.y - i.estilo.dy + i.alturaDoTexto }));
}

function conferir(plano, largura, altura, rotulo) {
  const area = { y0: plano.area.y, y1: plano.area.y + plano.area.altura };
  assert.ok(plano.area.altura > 0, `${rotulo}: área do gráfico sumiu`);
  assert.ok(area.y0 >= 0 && area.y1 <= altura + 1e-9, `${rotulo}: área fora do tile`);
  const cx = caixas(plano);
  for (const c of cx) {
    assert.ok(c.y0 >= 0 && c.y1 <= altura + 1e-9, `${rotulo}: ${c.tipo} sai do tile (${c.y0}–${c.y1} de ${altura})`);
    assert.ok(c.y1 <= area.y0 + 1e-9 || c.y0 >= area.y1 - 1e-9, `${rotulo}: ${c.tipo} sobrepõe o gráfico`);
  }
  for (let i = 0; i < cx.length; i++) {
    for (let j = i + 1; j < cx.length; j++) {
      const a = cx[i];
      const b = cx[j];
      assert.ok(a.y1 <= b.y0 + 1e-9 || b.y1 <= a.y0 + 1e-9, `${rotulo}: ${a.tipo} e ${b.tipo} se sobrepõem`);
    }
  }
  for (const i of plano.topo.concat(plano.base)) {
    assert.ok(i.x >= 0 && i.x + i.largura <= largura + 1e-9, `${rotulo}: ${i.tipo} sai pela lateral`);
  }
}

test('5.1c — padrão reproduz o visual anterior: título e subtítulo no topo, nota no rodapé', () => {
  const plano = planejarCabecalho({ largura: 900, altura: 560, config: PADRAO, tema: { tamanhoBase: 12 }, textos: TEXTOS });
  assert.deepEqual(plano.topo.map((i) => i.tipo), ['titulo', 'subtitulo']);
  assert.deepEqual(plano.base.map((i) => i.tipo), ['nota']);
  assert.equal(plano.topo[0].estilo.alinhamento, 'esquerda');
  assert.equal(plano.topo[0].estilo.tamanho, 15);
  assert.equal(plano.base[0].estilo.tamanho, 10);
  assert.deepEqual(plano.ocultos, []);
  conferir(plano, 900, 560, 'padrão');
});

test('5.1c — todas as posições, em tiles grandes e pequenos: nada sai do tile nem cobre o gráfico', () => {
  for (const [largura, altura] of TILES) {
    for (const pt of ['acima', 'abaixo']) {
      for (const ps of ['acima', 'abaixo']) {
        for (const pn of ['abaixo', 'acima', 'icone']) {
          for (const linhas of [0, 1]) {
            const config = {
              ...PADRAO,
              posicaoDoTitulo: pt,
              posicaoDoSubtitulo: ps,
              posicaoDaNota: pn,
              linhasDaNota: linhas,
              margemDoTitulo: 4,
            };
            const plano = planejarCabecalho({ largura, altura, config, tema: { tamanhoBase: 12 }, textos: TEXTOS });
            conferir(plano, largura, altura, `${largura}x${altura} t=${pt} s=${ps} n=${pn} l=${linhas}`);
            if (pn === 'icone' && !plano.ocultos.includes('nota')) assert.ok(plano.icone, 'modo ícone sem ícone');
          }
        }
      }
    }
  }
});

test('5.1c — tile pequeno esconde a nota antes de apertar o gráfico', () => {
  const plano = planejarCabecalho({ largura: 160, altura: 120, config: PADRAO, tema: { tamanhoBase: 12 }, textos: TEXTOS });
  assert.ok(plano.ocultos.includes('nota'), 'a nota longa deveria sumir num tile de 160×120');
  assert.ok(plano.area.altura >= 40);
});

test('5.1c — "Nota · Texto": automático, automático + meu, só meu, nenhum', () => {
  assert.equal(textoFinalDaNota({ textoDaNota: 'auto' }, 'A'), 'A');
  assert.equal(textoFinalDaNota({ textoDaNota: 'auto_mais', meuTextoDaNota: 'B' }, 'A'), 'A · B');
  assert.equal(textoFinalDaNota({ textoDaNota: 'meu', meuTextoDaNota: 'B' }, 'A'), 'B');
  assert.equal(textoFinalDaNota({ textoDaNota: 'nenhum', meuTextoDaNota: 'B' }, 'A'), '');
  assert.equal(textoFinalDaNota({}, 'A'), 'A');
});

function abrir(id, fixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES[fixture]();
  const cfg = Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg);
  inst.updateAsync(data, palco, cfg, queryResponse, {}, () => {});
  inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), ajustes), queryResponse, {}, () => {});
  return { amb, palco, fim: () => amb.restaurar() };
}

for (const g of lerRegistro()) {
  test(`5.1c — ${g.id}: título e nota ficam em faixas próprias, fora da área do gráfico`, () => {
    const fixture = g.fixtures.find((f) => FIXTURES[f]) || 'semPivo';
    const r = abrir(g.id, fixture, { titulo: 'Título de teste', subtitulo: 'Subtítulo de teste' });
    try {
      const area = r.palco.querySelector('.bl-area');
      assert.equal(area.querySelector('.bl-nota, .bl-titulo, .bl-subtitulo'), null, 'texto do cabeçalho dentro da área');
      const nota = r.palco.querySelector('.bl-nota');
      if (nota) assert.ok(nota.closest('.bl-rodape'), 'a nota deveria estar no rodapé (padrão)');
      if (g.id !== 'kpi_vivo') {
        assert.equal(r.palco.querySelector('.bl-cabecalho .bl-titulo').textContent, 'Título de teste');
      }
    } finally {
      r.fim();
    }
  });
}

test('5.1c — nota: ocultar, mover para cima, ícone ⓘ e "Só meu texto"', () => {
  const sem = abrir('bump_chart', 'temporal', { mostrarNota: false });
  const acima = abrir('bump_chart', 'temporal', { posicaoDaNota: 'acima' });
  const icone = abrir('bump_chart', 'temporal', { posicaoDaNota: 'icone' });
  const meu = abrir('bump_chart', 'temporal', { textoDaNota: 'meu', meuTextoDaNota: 'Fonte: sistema X' });
  try {
    assert.equal(sem.palco.querySelector('.bl-nota'), null);
    assert.ok(acima.palco.querySelector('.bl-cabecalho .bl-nota'));
    assert.ok(icone.palco.querySelector('.bl-cabecalho .bl-nota-icone'));
    assert.equal(icone.palco.querySelector('.bl-rodape .bl-nota'), null);
    assert.equal(meu.palco.querySelector('.bl-rodape .bl-nota').textContent, 'Fonte: sistema X');
  } finally {
    [sem, acima, icone, meu].forEach((r) => r.fim());
  }
});
