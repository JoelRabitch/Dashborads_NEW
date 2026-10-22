/**
 * build.mjs — gera `dist/<id>.js` (um arquivo autocontido por gráfico) e
 * `dist/MANIFEST.md`.
 *
 * Decisões (seção 5, regra 6 do PROMPT_AGENTE.md):
 *  - Formato IIFE: o Looker carrega o arquivo como script comum.
 *  - NÃO minificado por padrão: o arquivo precisa poder ser auditado.
 *    (`npm run build -- --minificar` gera minificado, se um dia quiser.)
 *  - Tudo embutido (`bundle: true`): em tempo de execução não há nenhuma
 *    dependência externa, então o campo Dependencies do Looker fica VAZIO.
 *  - Cabeçalho com id, label, versão, data do build e hash do commit.
 */

import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const DIR_DIST = join(RAIZ, 'dist');
const DIR_CHARTS = join(RAIZ, 'src', 'charts');

const minificar = process.argv.includes('--minificar');
const somente = obterArgumento('--somente'); // build de um gráfico só

function obterArgumento(nome) {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

function hashDoCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (_) {
    return 'sem-commit';
  }
}

function lerRegistro() {
  const caminho = join(RAIZ, 'config', 'charts.json');
  const json = JSON.parse(readFileSync(caminho, 'utf8'));
  return json.graficos || [];
}

function versaoDoPacote() {
  try {
    return JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).version || '0.0.0';
  } catch (_) {
    return '0.0.0';
  }
}

function cabecalho({ id, label, versao, commit, data }) {
  return `/*!
 * ${label} — visualização customizada para o Looker
 * id: ${id}
 * versão: ${versao} | build: ${data} | commit: ${commit}
 *
 * Arquivo AUTOCONTIDO: no Looker, o campo "Dependencies" deve ficar VAZIO.
 * Gerado por biblioteca/build/build.mjs — não edite este arquivo à mão;
 * edite src/charts/${id}/index.js e rode \`npm run build\`.
 */`;
}

async function construirGrafico(grafico, meta) {
  const entrada = join(DIR_CHARTS, grafico.pasta, 'index.js');
  if (!existsSync(entrada)) {
    console.log(`  [pulado] ${grafico.id}: ${entrada} não existe ainda`);
    return { id: grafico.id, construido: false };
  }
  const saida = join(DIR_DIST, `${grafico.id}.js`);

  await build({
    entryPoints: [entrada],
    outfile: saida,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2018'],
    minify: minificar,
    legalComments: 'inline',
    banner: { js: cabecalho({ id: grafico.id, label: grafico.label, ...meta }) },
    logLevel: 'warning',
  });

  const tamanho = statSync(saida).size;
  console.log(`  [ok] ${grafico.id}.js — ${(tamanho / 1024).toFixed(1)} KB`);
  return { id: grafico.id, construido: true, tamanho };
}

function gerarManifest(graficos, resultados, meta) {
  const linhas = [];
  linhas.push('# MANIFEST — visualizações da biblioteca');
  linhas.push('');
  linhas.push(`Gerado automaticamente pelo build em ${meta.data} (commit \`${meta.commit}\`).`);
  linhas.push('');
  linhas.push('## Como cadastrar no Looker');
  linhas.push('');
  linhas.push('Admin > Visualizations > Add Visualization:');
  linhas.push('');
  linhas.push('- **ID**: o da tabela abaixo');
  linhas.push('- **Label**: o da tabela abaixo');
  linhas.push('- **Main**: a URL do arquivo (modelo na última coluna)');
  linhas.push('- **Dependencies**: **VAZIO** — todos os arquivos são autocontidos');
  linhas.push('');
  linhas.push(
    'Troque `COMMIT` pelo hash do commit que você quer fixar (nunca use `@main`: ' +
      'assim a visualização não muda sozinha depois de testada).'
  );
  linhas.push('');
  linhas.push('| ID | Label | Arquivo | Dependencies | Como montar o Explore | URL para o campo Main |');
  linhas.push('|---|---|---|---|---|---|');

  for (const g of graficos) {
    const r = resultados.find((x) => x.id === g.id);
    const arquivo = r && r.construido ? `\`dist/${g.id}.js\`` : '_(ainda não construído)_';
    const url = `\`https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/${g.id}.js\``;
    linhas.push(
      `| \`${g.id}\` | ${g.label} | ${arquivo} | (vazio) | ${g.explore || '—'} | ${url} |`
    );
  }

  linhas.push('');
  linhas.push('## Detalhes por visualização');
  linhas.push('');
  for (const g of graficos) {
    const r = resultados.find((x) => x.id === g.id);
    linhas.push(`### ${g.label} (\`${g.id}\`)`);
    linhas.push('');
    if (g.resumo) linhas.push(`${g.resumo}`);
    linhas.push('');
    linhas.push(`- **Tier**: ${g.tier}`);
    linhas.push(`- **Explore**: ${g.explore || '—'}`);
    linhas.push(`- **Aceita pivô**: ${g.aceitaPivo ? 'sim' : 'não'}`);
    if (r && r.construido) linhas.push(`- **Tamanho do bundle**: ${(r.tamanho / 1024).toFixed(1)} KB`);
    linhas.push('');
  }

  writeFileSync(join(DIR_DIST, 'MANIFEST.md'), linhas.join('\n'), 'utf8');
  console.log('  [ok] MANIFEST.md');
}

async function principal() {
  if (!existsSync(DIR_DIST)) mkdirSync(DIR_DIST, { recursive: true });

  const meta = {
    versao: versaoDoPacote(),
    commit: hashDoCommit(),
    data: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  let graficos = lerRegistro();
  if (somente) graficos = graficos.filter((g) => g.id === somente);

  if (!graficos.length) {
    console.log('Nenhum gráfico no registro (config/charts.json).');
    return;
  }

  console.log(`Build de ${graficos.length} gráfico(s) — versão ${meta.versao}, commit ${meta.commit}`);
  const resultados = [];
  for (const g of graficos) {
    resultados.push(await construirGrafico(g, meta));
  }

  gerarManifest(lerRegistro(), resultados, meta);

  const construidos = resultados.filter((r) => r.construido).length;
  console.log(`Pronto: ${construidos}/${graficos.length} construído(s).`);
}

principal().catch((e) => {
  console.error('Falha no build:', e);
  process.exit(1);
});
