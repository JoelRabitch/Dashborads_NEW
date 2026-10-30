/**
 * urls.mjs — gera `dist/URLS.md` e `dist/URLS.csv`: uma entrada por
 * gráfico mantido, com a URL do campo Main fixada no hash COMPLETO (40
 * caracteres) do último commit que alterou `biblioteca/dist`.
 *
 * Reaproveita a lógica da antiga "Etapa 55" (que ficava no build): o hash
 * vem de `git log -1 --format=%H -- dist/*.js` — só bundles, para que
 * commitar o próprio URLS.md/MANIFEST.md não mude o hash publicado.
 *
 * Por que um script separado, rodado DEPOIS do commit: um arquivo não pode
 * conter o hash do commit em que ele mesmo entra. Fluxo:
 *   1. npm run build  → commit dos dist/*.js
 *   2. npm run urls   → commit do URLS.md/URLS.csv
 *
 * Confere com `git ls-tree` que cada caminho existe nesse hash e recusa
 * gerar se houver bundle alterado e não commitado (a URL serviria a
 * versão anterior).
 *
 * Formato aceito pelo Looker (testado na Etapa 55):
 *   https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@<HASH>/biblioteca/dist/<id>.js
 * Nunca branch, @main, @latest, raw.githubusercontent.com nem github.com/blob
 * (o Looker bloqueia essas respostas com ERR_BLOCKED_BY_ORB).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const REPOSITORIO = 'JoelRabitch/Dashborads_NEW';

const git = (...args) =>
  execFileSync('git', args, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

function principal() {
  const graficos = JSON.parse(readFileSync(join(RAIZ, 'config', 'charts.json'), 'utf8')).graficos;

  const pendentes = git('status', '--porcelain', '--', 'dist')
    .split(/\r?\n/)
    .map((l) => l.slice(3).trim())
    .filter((c) => c.endsWith('.js'));
  if (pendentes.length) {
    console.error(`Há bundle(s) alterado(s) sem commit: ${pendentes.join(', ')}. Commite antes de gerar as URLs.`);
    process.exit(1);
  }

  const hash = git('log', '-1', '--format=%H', '--', 'dist/*.js');
  if (!/^[0-9a-f]{40}$/.test(hash)) {
    console.error('Não consegui descobrir o hash do último commit de dist/*.js.');
    process.exit(1);
  }

  const arvore = new Set(git('ls-tree', '--name-only', hash, 'dist/').split(/\r?\n/).map((c) => c.replace(/^.*\//, '')));
  const faltando = graficos.filter((g) => !arvore.has(`${g.id}.js`));
  if (faltando.length) {
    console.error(`No commit ${hash} não existem: ${faltando.map((g) => g.id).join(', ')}.`);
    process.exit(1);
  }

  const url = (id) => `https://cdn.jsdelivr.net/gh/${REPOSITORIO}@${hash}/biblioteca/dist/${id}.js`;

  const md = [];
  md.push('# URLs para o campo Main do Looker');
  md.push('');
  md.push(`Gerado por \`build/urls.mjs\`. Todas fixadas no commit \`${hash}\` — o último que alterou \`biblioteca/dist/*.js\`.`);
  md.push(`Conferido com \`git ls-tree\`: os ${graficos.length} arquivos existem nesse commit.`);
  md.push('');
  md.push('**Admin > Visualizations > Add Visualization**: ID e Label da tabela, Main = a URL, **Dependencies VAZIO**.');
  md.push('Copie a URL como está: não troque o hash por branch, `@main` ou `@latest` (a visualização mudaria sozinha depois de testada).');
  md.push('');
  md.push('| ID | Label | Main | Como montar o Explore |');
  md.push('|---|---|---|---|');
  const csv = ['id,label,main,explore'];
  const aspas = (t) => `"${String(t || '').replace(/"/g, '""')}"`;
  for (const g of graficos) {
    md.push(`| \`${g.id}\` | ${g.label} | \`${url(g.id)}\` | ${g.explore || '—'} |`);
    csv.push([g.id, aspas(g.label), url(g.id), aspas(g.explore)].join(','));
  }
  md.push('');
  md.push('## Para trocar uma visualização depois de um conserto');
  md.push('');
  md.push('1. Altere o código, rode `npm run build` e `npm test`, e commite o `dist/<id>.js`.');
  md.push('2. Pegue o hash: `git log -1 --format=%H -- biblioteca/dist/<id>.js`.');
  md.push('3. No Admin do Looker, troque SÓ a URL daquela visualização, com o hash novo.');
  md.push('');

  writeFileSync(join(RAIZ, 'dist', 'URLS.md'), md.join('\n'), 'utf8');
  writeFileSync(join(RAIZ, 'dist', 'URLS.csv'), csv.join('\n') + '\n', 'utf8');
  console.log(`  [ok] dist/URLS.md e URLS.csv — ${graficos.length} gráficos @ ${hash}`);
}

principal();
