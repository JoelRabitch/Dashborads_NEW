/**
 * listar-opcoes.mjs — lista as opções de cada gráfico (id, label, section,
 * tipo, default), lendo o BUNDLE de `dist/` num DOM simulado.
 *
 * Por que do bundle e não do código-fonte: é o bundle que o Looker carrega,
 * então é ele que define o que o usuário vê no painel. As opções dinâmicas
 * (uma por campo) também entram: o gráfico é renderizado com a primeira
 * fixture declarada e o que ele registrar via `registerOptions` é somado.
 *
 * Uso:
 *   node build/listar-opcoes.mjs --antes   grava docs/opcoes/<id>.antes.json
 *   node build/listar-opcoes.mjs           grava docs/opcoes/<id>.depois.json
 *
 * A comparação entre os dois arquivos é feita por `test/opcoes.test.mjs`.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from '../test/fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from '../test/ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');

/** Lê as opções (estáticas + dinâmicas) de um gráfico já construído. */
export function opcoesDoGrafico(grafico) {
  const amb = montarAmbiente();
  const silencio = console.warn;
  console.warn = () => {};
  try {
    amb.window.eval(readFileSync(join(RAIZ, 'dist', `${grafico.id}.js`), 'utf8'));
    const definicao = amb.registro[grafico.id];
    const estaticas = Object.assign({}, definicao.options);
    const nomeFixture = (grafico.fixtures || []).find((f) => FIXTURES[f]) || 'semPivo';
    const { data, queryResponse } = FIXTURES[nomeFixture]();
    const palco = amb.window.document.getElementById('palco');
    const inst = criarInstancia(definicao, amb.chamadasDeApi);
    const cfg = configPadrao(definicao);
    inst.create(palco, cfg);
    inst.updateAsync(data, palco, cfg, queryResponse, {}, () => {});
    const todas = Object.assign({}, estaticas, amb.chamadasDeApi.opcoesRegistradas || {});
    return Object.entries(todas).map(([id, o]) => ({
      id,
      label: o.label,
      // Rótulo original completo (5.1b): o painel mostra a versão curta.
      rotuloCompleto: o._rotuloCompleto || o.label,
      section: o.section,
      type: o.type,
      default: o.default === undefined ? null : o.default,
      dinamica: !(id in estaticas),
    }));
  } finally {
    console.warn = silencio;
    amb.restaurar();
  }
}

export function lerRegistro() {
  return JSON.parse(readFileSync(join(RAIZ, 'config', 'charts.json'), 'utf8')).graficos;
}

const ehPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const sufixo = process.argv.includes('--antes') ? 'antes' : 'depois';
  const dir = join(RAIZ, 'docs', 'opcoes');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  for (const g of lerRegistro()) {
    const caminho = join(dir, `${g.id}.${sufixo}.json`);
    if (sufixo === 'antes' && existsSync(caminho)) {
      console.log(`  [mantido] ${g.id}.antes.json já existe (nunca é sobrescrito)`);
      continue;
    }
    const lista = opcoesDoGrafico(g);
    writeFileSync(caminho, JSON.stringify(lista, null, 2) + '\n', 'utf8');
    const abas = Array.from(new Set(lista.map((o) => o.section)));
    console.log(`  [ok] ${g.id}: ${lista.length} opções em ${abas.length} abas (${abas.join(', ')})`);
  }
}
