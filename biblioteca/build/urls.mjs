/**
 * urls.mjs — gera `dist/URLS.md` e `dist/URLS.csv` (melhorias v3, 5.15 e
 * 5.15b): DUAS URLs por gráfico para o campo Main do Looker.
 *
 *   - PRINCIPAL, curta, fixada numa TAG de versão (ex.: v3.1);
 *   - ALTERNATIVA, fixada no hash de 40 caracteres do commit da tag (se a
 *     tag falhar no CDN).
 *
 * Uso: npm run urls -- v3.1   (a tag é obrigatória; nunca branch, @main
 * nem @latest — a visualização mudaria sozinha depois de testada).
 *
 * O dono e o nome do repositório vêm SÓ de `config/repo.json` (ou, se ele
 * faltar, do `git remote origin`). Modos de hospedagem (`hospedagem`):
 *   - "jsdelivr" (padrão): https://cdn.jsdelivr.net/gh/<dono>/<repo>@<ref>/biblioteca/dist/<id>.js
 *     (o jsDelivr só serve repositórios PÚBLICOS do GitHub);
 *   - "base-url": <prefixoBaseUrl>/<ref>/<id>.js (servidor ou bucket interno,
 *     onde alguém publica os dist/*.js de cada versão numa pasta <ref>).
 *
 * Conferências: a tag existe no remoto (`git ls-remote --tags origin`), e
 * cada `dist/<id>.js` existe na tag (`git ls-tree`). Recusa gerar se houver
 * bundle alterado e não commitado.
 *
 * Fluxo: build → commit dos bundles → tag nova (nunca mover uma existente)
 * → push da tag → `npm run urls -- <tag>` → commit do URLS.md/URLS.csv.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');

const git = (...args) =>
  execFileSync('git', args, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

/** Dono, repositório e hospedagem: config/repo.json (ou o remote origin). */
export function lerRepositorio() {
  const caminho = join(RAIZ, 'config', 'repo.json');
  if (existsSync(caminho)) {
    const c = JSON.parse(readFileSync(caminho, 'utf8'));
    return {
      dono: c.dono,
      repositorio: c.repositorio,
      hospedagem: c.hospedagem || 'jsdelivr',
      prefixoBaseUrl: String(c.prefixoBaseUrl || '').replace(/\/+$/, ''),
      pasta: c.pastaDosBundles || 'biblioteca/dist',
    };
  }
  const m = /[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/.exec(git('remote', 'get-url', 'origin'));
  if (!m) throw new Error('Sem config/repo.json e sem remote origin reconhecível.');
  return { dono: m[1], repositorio: m[2], hospedagem: 'jsdelivr', prefixoBaseUrl: '', pasta: 'biblioteca/dist' };
}

export function montarUrl(repo, ref, id) {
  if (repo.hospedagem === 'base-url') {
    if (!repo.prefixoBaseUrl) throw new Error('hospedagem "base-url" exige "prefixoBaseUrl" em config/repo.json');
    return `${repo.prefixoBaseUrl}/${ref}/${id}.js`;
  }
  return `https://cdn.jsdelivr.net/gh/${repo.dono}/${repo.repositorio}@${ref}/${repo.pasta}/${id}.js`;
}

function principal() {
  const tag = process.argv.slice(2).find((a) => !a.startsWith('-'));
  if (!tag || !/^v\d+\.\d+$/.test(tag)) {
    console.error('Informe a tag de versão: npm run urls -- v3.N (sem barra; nunca branch, main ou latest).');
    process.exit(1);
  }
  const repo = lerRepositorio();
  const graficos = JSON.parse(readFileSync(join(RAIZ, 'config', 'charts.json'), 'utf8')).graficos;

  const pendentes = git('status', '--porcelain', '--', 'dist')
    .split(/\r?\n/)
    .map((l) => l.slice(3).trim())
    .filter((c) => c.endsWith('.js'));
  if (pendentes.length) {
    console.error(`Há bundle(s) alterado(s) sem commit: ${pendentes.join(', ')}. Commite antes de gerar as URLs.`);
    process.exit(1);
  }

  // A tag precisa existir no REMOTO (é de lá que o CDN lê).
  const remotas = git('ls-remote', '--tags', 'origin');
  if (!remotas.split(/\r?\n/).some((l) => l.endsWith(`refs/tags/${tag}`))) {
    console.error(`A tag ${tag} não existe no remoto. Crie e envie: git tag ${tag} <commit> && git push origin ${tag}`);
    process.exit(1);
  }
  const hash = git('rev-list', '-n', '1', tag);
  if (!/^[0-9a-f]{40}$/.test(hash)) {
    console.error(`Não consegui o hash da tag ${tag}.`);
    process.exit(1);
  }
  const arvore = new Set(git('ls-tree', '--name-only', tag, 'dist/').split(/\r?\n/).map((c) => c.replace(/^.*\//, '')));
  const faltando = graficos.filter((g) => !arvore.has(`${g.id}.js`));
  if (faltando.length) {
    console.error(`Na tag ${tag} não existem: ${faltando.map((g) => g.id).join(', ')}.`);
    process.exit(1);
  }

  const md = [];
  md.push('# URLs para o campo Main do Looker');
  md.push('');
  md.push(`Gerado por \`build/urls.mjs\` para a versão **${tag}** (commit \`${hash}\`).`);
  md.push(`Conferido: a tag existe no remoto e os ${graficos.length} arquivos existem nela (\`git ls-tree\`).`);
  md.push('');
  md.push('**Admin > Visualizations > Add Visualization**: ID e Label da tabela, Main = a URL **principal**, **Dependencies VAZIO**.');
  md.push('Se a URL com a tag não carregar, use a **alternativa** (mesmo arquivo, fixado no hash do commit).');
  md.push('Copie como está: nunca troque por branch, `@main` ou `@latest`.');
  md.push('');
  md.push('| ID | Label | Main (principal, tag) | Alternativa (hash) | Como montar o Explore |');
  md.push('|---|---|---|---|---|');
  const csv = ['id,label,main,alternativa,explore'];
  const aspas = (t) => `"${String(t || '').replace(/"/g, '""')}"`;
  for (const g of graficos) {
    const principalUrl = montarUrl(repo, tag, g.id);
    const alternativa = montarUrl(repo, hash, g.id);
    md.push(`| \`${g.id}\` | ${g.label} | \`${principalUrl}\` | \`${alternativa}\` | ${g.explore || '—'} |`);
    csv.push([g.id, aspas(g.label), principalUrl, alternativa, aspas(g.explore)].join(','));
  }
  md.push('');
  md.push('## Nova versão depois de um conserto');
  md.push('');
  md.push('1. Altere o código, `npm run build`, `npm test`, `npm run seguranca`; commite os `dist/*.js`.');
  md.push('2. Crie uma tag NOVA no commit dos bundles (`git tag v3.N+1`) e envie (`git push origin v3.N+1`). Nunca mova nem recrie uma tag existente.');
  md.push('3. `npm run urls -- v3.N+1` e commite o URLS.md/URLS.csv.');
  md.push('4. No Admin do Looker, troque as URLs das visualizações que mudaram.');
  md.push('');

  writeFileSync(join(RAIZ, 'dist', 'URLS.md'), md.join('\n'), 'utf8');
  writeFileSync(join(RAIZ, 'dist', 'URLS.csv'), csv.join('\n') + '\n', 'utf8');
  console.log(`  [ok] dist/URLS.md e URLS.csv — ${graficos.length} gráficos @ ${tag} (${hash})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
