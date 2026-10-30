/**
 * relatorio-abas.mjs — gera `docs/opcoes/ABAS.md`: as abas que cada
 * gráfico tinha ANTES das correções (de `docs/opcoes/<id>.antes.json`) e o
 * destino de cada opção no painel novo (lido do bundle atual).
 *
 * Uso: node build/relatorio-abas.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { opcoesDoGrafico, lerRegistro } from './listar-opcoes.mjs';
import { ABAS, JUNTAR_EIXOS_E_TEXTO } from '../src/core/options-kit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');

const linhas = [];
linhas.push('# Abas do painel e rótulos — antes e depois (2.8 e melhorias v3, 5.1b)');
linhas.push('');
linhas.push(`Gerado por \`build/relatorio-abas.mjs\`. Abas novas, nesta ordem: **${ABAS.join(' · ')}**.`);
linhas.push('');
linhas.push('O editor do Looker costuma mostrar as abas em ordem ALFABÉTICA (Dados · Estilo · Mais · Texto). As opções de eixo ficam na aba **Texto**; interação, tooltip, animação e avançado ficam em **Mais**.');
linhas.push('');
linhas.push('Os rótulos do painel têm no máximo 30 caracteres (liga/desliga) ou 40 (demais). A coluna "explicação" traz o rótulo original completo — é a ajuda de cada opção, já que a API de opções do Looker não tem campo de texto de ajuda.');
if (JUNTAR_EIXOS_E_TEXTO) {
  /* mantido por compatibilidade */
}
linhas.push('');
linhas.push('Nenhuma opção foi removida nem teve id, tipo ou default alterado (conferido por `test/opcoes.test.mjs`).');
linhas.push('Ids marcados com ★ são novos (não existiam antes).');
linhas.push('');

for (const g of lerRegistro()) {
  const antes = JSON.parse(readFileSync(join(RAIZ, 'docs', 'opcoes', `${g.id}.antes.json`), 'utf8'));
  const agora = opcoesDoGrafico(g);
  const antesPorId = new Map(antes.map((o) => [o.id, o]));
  const abasAntes = Array.from(new Set(antes.map((o) => o.section)));
  const abasAgora = ABAS.filter((a) => agora.some((o) => o.section === a));
  linhas.push(`## ${g.label} (\`${g.id}\`)`);
  linhas.push('');
  linhas.push(`- Antes (${abasAntes.length} abas): ${abasAntes.join(' · ')}`);
  linhas.push(`- Depois (${abasAgora.length} abas): ${abasAgora.join(' · ')}`);
  linhas.push('');
  linhas.push('<details><summary>Destino de cada opção</summary>');
  linhas.push('');
  linhas.push('| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |');
  linhas.push('|---|---|---|---|---|');
  for (const o of agora) {
    const a = antesPorId.get(o.id);
    const marca = a ? '' : ' ★';
    const rotulo = String(o.label || '').replace(/\|/g, '\\|');
    const completo = String(o.rotuloCompleto || o.label || '').replace(/\|/g, '\\|');
    linhas.push(`| \`${o.id}\`${marca} | ${a ? a.section : '—'} | ${o.section} | ${rotulo} | ${completo === rotulo ? '' : completo} |`);
  }
  linhas.push('');
  linhas.push('</details>');
  linhas.push('');
}

writeFileSync(join(RAIZ, 'docs', 'opcoes', 'ABAS.md'), linhas.join('\n'), 'utf8');
console.log('  [ok] docs/opcoes/ABAS.md');
