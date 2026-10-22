/**
 * smoke.test.mjs — teste de fumaça de TODOS os gráficos construídos.
 *
 * Para cada `dist/<id>.js`:
 *   1. carrega o bundle num DOM simulado (jsdom), como o Looker faria;
 *   2. confere que ele se registrou via `looker.plugins.visualizations.add`;
 *   3. renderiza com cada fixture declarada em `config/charts.json`
 *      (mais as básicas: sem pivô, com pivô, vazio, só nulos, rótulos longos);
 *   4. exige que `done()` tenha sido chamado SEMPRE (inclusive em erro);
 *   5. exige que nenhuma exceção tenha escapado;
 *   6. confere que o DOM recebeu conteúdo (ou uma mensagem de erro/vazio).
 *
 * Rode com: `npm test`
 *
 * Sobre canvas: o pacote nativo `canvas` é OPCIONAL. Sem ele, o jsdom
 * devolve `null` em `getContext('2d')` — os gráficos precisam tolerar isso
 * sem quebrar, e o teste verifica justamente isso.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES, FIXTURES_BASICAS } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao, temCanvasNativo } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const DIR_DIST = join(RAIZ, 'dist');

function lerRegistro() {
  const caminho = join(RAIZ, 'config', 'charts.json');
  if (!existsSync(caminho)) return [];
  return JSON.parse(readFileSync(caminho, 'utf8')).graficos || [];
}

const graficos = lerRegistro().filter((g) => existsSync(join(DIR_DIST, `${g.id}.js`)));
const CANVAS_NATIVO = temCanvasNativo();

test('ambiente de teste', () => {
  console.log(`    canvas nativo disponível: ${CANVAS_NATIVO ? 'sim' : 'não (gráficos em canvas rodam sem contexto 2D)'}`);
  console.log(`    gráficos construídos em dist/: ${graficos.length}`);
  if (!graficos.length) {
    console.log('    (rode `npm run build` antes de `npm test` para gerar os bundles)');
  }
});

for (const grafico of graficos) {
  const nomesDeFixture = Array.from(new Set([...(grafico.fixtures || []), ...FIXTURES_BASICAS]));

  test(`${grafico.id} — registra e renderiza`, async (t) => {
    const codigo = readFileSync(join(DIR_DIST, `${grafico.id}.js`), 'utf8');

    for (const nomeFixture of nomesDeFixture) {
      const gerar = FIXTURES[nomeFixture];
      if (!gerar) continue;

      await t.test(`fixture ${nomeFixture}`, () => {
        const amb = montarAmbiente();
        try {
          // 1) Carrega o bundle como o Looker faria.
          amb.window.eval(codigo);
          const definicao = amb.registro[grafico.id];
          assert.ok(definicao, `${grafico.id} não se registrou em looker.plugins.visualizations.add`);
          assert.equal(typeof definicao.create, 'function', 'create deve existir');
          assert.equal(typeof definicao.updateAsync, 'function', 'updateAsync deve existir');
          assert.ok(definicao.options && typeof definicao.options === 'object', 'options deve existir');

          // 2) Renderiza.
          const { data, queryResponse } = gerar();
          const palco = amb.window.document.getElementById('palco');
          const inst = criarInstancia(definicao, amb.chamadasDeApi);
          const cfg = configPadrao(definicao);

          let chamouDone = false;
          inst.create(palco, cfg);
          inst.updateAsync(data, palco, cfg, queryResponse, {}, () => { chamouDone = true; });

          // 3) Regras da seção 9 do prompt.
          assert.ok(chamouDone, 'done() precisa ser chamado sempre');
          assert.ok(palco.childNodes.length > 0, 'a visualização precisa colocar algo no DOM');

          // Fixtures com dados válidos não podem gerar erro; as inválidas
          // (vazio / só nulos) PODEM, desde que com mensagem clara.
          const fixturesQuePodemErrar = ['vazio', 'semCampos', 'somenteNulos'];
          if (!fixturesQuePodemErrar.includes(nomeFixture)) {
            assert.equal(
              amb.chamadasDeApi.erros.length,
              0,
              `erro inesperado: ${JSON.stringify(amb.chamadasDeApi.erros)}`
            );
          }
          for (const erro of amb.chamadasDeApi.erros) {
            assert.ok(erro.title && erro.message, 'todo erro precisa de título e mensagem');
            assert.ok(erro.message.length > 20, 'a mensagem de erro precisa explicar o que fazer');
          }
        } finally {
          amb.restaurar();
        }
      });
    }
  });

  test(`${grafico.id} — aguenta atualização repetida sem vazar`, () => {
    const codigo = readFileSync(join(DIR_DIST, `${grafico.id}.js`), 'utf8');
    const amb = montarAmbiente();
    try {
      amb.window.eval(codigo);
      const definicao = amb.registro[grafico.id];
      const palco = amb.window.document.getElementById('palco');
      const inst = criarInstancia(definicao, amb.chamadasDeApi);
      const cfg = configPadrao(definicao);

      inst.create(palco, cfg);
      // Três atualizações seguidas com conjuntos diferentes: simula o que o
      // Looker faz quando o usuário mexe nos filtros.
      for (const nome of ['semPivo', 'duasDimensoes', 'semPivo']) {
        const { data, queryResponse } = FIXTURES[nome]();
        let ok = false;
        inst.updateAsync(data, palco, cfg, queryResponse, {}, () => { ok = true; });
        assert.ok(ok, `done() não foi chamado na atualização com ${nome}`);
      }
      assert.ok(palco.childNodes.length > 0, 'DOM ficou vazio depois das atualizações');
    } finally {
      amb.restaurar();
    }
  });

  test(`${grafico.id} — volume grande (5.000 linhas) em tempo aceitável`, () => {
    const codigo = readFileSync(join(DIR_DIST, `${grafico.id}.js`), 'utf8');
    const amb = montarAmbiente();
    try {
      amb.window.eval(codigo);
      const definicao = amb.registro[grafico.id];
      const palco = amb.window.document.getElementById('palco');
      const inst = criarInstancia(definicao, amb.chamadasDeApi);
      const cfg = configPadrao(definicao);
      const { data, queryResponse } = FIXTURES.grande5k();

      inst.create(palco, cfg);
      const t0 = Date.now();
      let ok = false;
      inst.updateAsync(data, palco, cfg, queryResponse, {}, () => { ok = true; });
      const ms = Date.now() - t0;

      assert.ok(ok, 'done() precisa ser chamado com volume grande');
      console.log(`    ${grafico.id}: 5.000 linhas renderizadas em ${ms} ms`);
      // Limite generoso: o jsdom é bem mais lento que um navegador real.
      assert.ok(ms < 15000, `demorou demais (${ms} ms) com 5.000 linhas`);
    } finally {
      amb.restaurar();
    }
  });
}
