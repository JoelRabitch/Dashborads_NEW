/**
 * painel_v3.test.mjs — painel de opções com 4 abas curtas e rótulos que
 * não terminam em reticências (melhorias v3, 5.1b).
 *
 * Percorre TODAS as opções de TODOS os gráficos (estáticas + dinâmicas,
 * lidas do bundle como o Looker lê) e falha se houver:
 *   - mais de 4 abas, ou aba fora da lista única `ABAS`;
 *   - nome de aba com mais de 7 caracteres;
 *   - rótulo acima de 30 caracteres (liga/desliga) ou 40 (demais).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { opcoesDoGrafico, lerRegistro } from '../build/listar-opcoes.mjs';
import { ABAS, LIMITE_DO_ROTULO } from '../src/core/options-kit.js';

test('5.1b — a lista única de abas tem 4 nomes de até 7 caracteres', () => {
  assert.deepEqual(ABAS, ['Dados', 'Estilo', 'Texto', 'Mais']);
  for (const a of ABAS) assert.ok(a.length <= 7, a);
});

for (const grafico of lerRegistro()) {
  test(`5.1b — ${grafico.id}: no máximo 4 abas curtas e rótulos dentro do limite`, () => {
    const opcoes = opcoesDoGrafico(grafico);
    const secoes = new Set(opcoes.map((o) => o.section));
    assert.ok(secoes.size <= 4, `${grafico.id}: ${secoes.size} abas (${[...secoes].join(', ')})`);
    for (const s of secoes) {
      assert.ok(ABAS.includes(s), `${grafico.id}: aba fora da lista: "${s}"`);
      assert.ok(String(s).length <= 7, `${grafico.id}: aba com nome longo: "${s}"`);
    }
    const longos = opcoes.filter((o) => String(o.label || '').length > LIMITE_DO_ROTULO(o));
    assert.deepEqual(
      longos.map((o) => `${o.id} (${o.label.length}): ${o.label}`),
      [],
      `${grafico.id}: rótulos acima do limite`
    );
  });
}
