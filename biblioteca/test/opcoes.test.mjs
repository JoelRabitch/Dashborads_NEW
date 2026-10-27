/**
 * opcoes.test.mjs — garantias do painel de opções (correções v2, 2.8).
 *
 * 1. Nenhum id de opção que existia antes das correções sumiu, mudou de
 *    tipo ou de default (dashboards salvos dependem disso). Exceções
 *    pedidas explicitamente no PROMPT ficam listadas em EXCECOES.
 * 2. Todas as opções estão numa das abas padronizadas, na mesma ordem em
 *    todos os gráficos.
 *
 * A lista "antes" está em docs/opcoes/<id>.antes.json (gerada por
 * build/listar-opcoes.mjs --antes antes de qualquer mudança).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { opcoesDoGrafico, lerRegistro } from '../build/listar-opcoes.mjs';
import { ABAS } from '../src/core/options-kit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');

/** Mudanças de default autorizadas pelo PROMPT (6.2 e 6.8). */
const EXCECOES = {
  // 6.2: "Aplicar JSON acima por cima das opções" passa a ser DESLIGADO.
  aplicarConfiguracaoJson: { default: false },
  // 6.8: debug desligado por padrão.
  modoDebug: { default: false },
};

for (const grafico of lerRegistro()) {
  const caminho = join(RAIZ, 'docs', 'opcoes', `${grafico.id}.antes.json`);

  test(`${grafico.id} — ids antigos continuam com o mesmo tipo e default`, () => {
    assert.ok(existsSync(caminho), `falta ${caminho}`);
    const antes = JSON.parse(readFileSync(caminho, 'utf8'));
    const agora = new Map(opcoesDoGrafico(grafico).map((o) => [o.id, o]));
    assert.ok(antes.length > 0);
    for (const o of antes) {
      const atual = agora.get(o.id);
      assert.ok(atual, `${grafico.id}: a opção "${o.id}" sumiu`);
      assert.equal(atual.type, o.type, `${grafico.id}: "${o.id}" mudou de tipo`);
      const esperado = EXCECOES[o.id] ? EXCECOES[o.id].default : o.default;
      assert.deepEqual(atual.default, esperado, `${grafico.id}: "${o.id}" mudou de default`);
    }
  });

  test(`${grafico.id} — opções só nas abas padronizadas`, () => {
    const secoes = new Set(opcoesDoGrafico(grafico).map((o) => o.section));
    for (const s of secoes) assert.ok(ABAS.includes(s), `${grafico.id}: aba fora do padrão: "${s}"`);
    assert.ok(secoes.size <= ABAS.length);
  });
}
