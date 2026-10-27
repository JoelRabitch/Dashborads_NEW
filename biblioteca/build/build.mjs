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
 *  - Cabeçalho com id, label e versão — SEM data e SEM hash de commit.
 *
 * Build DETERMINÍSTICO (módulo 2.9 das correções v2): o mesmo código gera
 * o mesmo arquivo, byte a byte, e um arquivo só é regravado quando o
 * conteúdo muda. Antes o cabeçalho levava a data do build e o hash do
 * HEAD: todo build mudava os 22 bundles, o que mudava o hash do último
 * commit de `dist/` e invalidava as URLs do campo Main sem nada ter
 * mudado de verdade. Rodar o build duas vezes seguidas não altera nada
 * (`git status` limpo).
 *
 * As URLs com hash ficam em `dist/URLS.md`/`URLS.csv`, geradas por
 * `build/urls.mjs` DEPOIS do commit dos bundles (um arquivo não pode
 * conter o hash do próprio commit).
 */

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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

/**
 * Grava só se o conteúdo mudou (comparando sem diferença de fim de linha:
 * com `core.autocrlf` o arquivo no disco pode estar em CRLF).
 * @returns {boolean} se gravou
 */
function gravarSeMudou(caminho, conteudo) {
  const normalizar = (t) => t.replace(/\r\n/g, '\n');
  if (existsSync(caminho) && normalizar(readFileSync(caminho, 'utf8')) === normalizar(conteudo)) return false;
  writeFileSync(caminho, conteudo, 'utf8');
  return true;
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

function cabecalho({ id, label, versao }) {
  return `/*!
 * ${label} — visualização customizada para o Looker
 * id: ${id}
 * versão: ${versao}
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

  const resultado = await build({
    entryPoints: [entrada],
    outfile: saida,
    write: false,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2018'],
    minify: minificar,
    legalComments: 'inline',
    banner: { js: cabecalho({ id: grafico.id, label: grafico.label, ...meta }) },
    logLevel: 'warning',
  });

  const conteudo = resultado.outputFiles[0].text;
  const gravou = gravarSeMudou(saida, conteudo);
  const tamanho = Buffer.byteLength(conteudo, 'utf8');
  console.log(`  [${gravou ? 'ok' : 'igual'}] ${grafico.id}.js — ${(tamanho / 1024).toFixed(1)} KB`);
  return { id: grafico.id, construido: true, tamanho, gravou };
}

function gerarManifest(graficos, resultados) {
  const linhas = [];
  linhas.push('# MANIFEST — visualizações da biblioteca');
  linhas.push('');
  linhas.push('Gerado automaticamente pelo build (sem data nem hash: o build é determinístico).');
  linhas.push('');
  linhas.push('## Como cadastrar no Looker');
  linhas.push('');
  linhas.push('Admin > Visualizations > Add Visualization:');
  linhas.push('');
  linhas.push('- **ID** e **Label**: os da tabela abaixo');
  linhas.push('- **Main**: a URL fixada num commit, que está em [`URLS.md`](URLS.md) (ou `URLS.csv`)');
  linhas.push('- **Dependencies**: **VAZIO** — todos os arquivos são autocontidos');
  linhas.push('');
  linhas.push('| ID | Label | Arquivo | Dependencies | Como montar o Explore |');
  linhas.push('|---|---|---|---|---|');
  for (const g of graficos) {
    const r = resultados.find((x) => x.id === g.id);
    const arquivo = r && r.construido ? `\`dist/${g.id}.js\`` : '_(não construído)_';
    linhas.push(`| \`${g.id}\` | ${g.label} | ${arquivo} | (vazio) | ${g.explore || '—'} |`);
  }
  linhas.push('');
  linhas.push('## Detalhes por visualização');
  linhas.push('');
  for (const g of graficos) {
    linhas.push(`### ${g.label} (\`${g.id}\`)`);
    linhas.push('');
    if (g.resumo) linhas.push(`${g.resumo}`);
    linhas.push('');
    linhas.push(`- **Explore**: ${g.explore || '—'}`);
    linhas.push(`- **Aceita pivô**: ${g.aceitaPivo ? 'sim' : 'não'}`);
    linhas.push('');
  }
  const gravou = gravarSeMudou(join(DIR_DIST, 'MANIFEST.md'), linhas.join('\n'));
  console.log(`  [${gravou ? 'ok' : 'igual'}] MANIFEST.md`);
}

/**
 * Gera os arquivos auxiliares que o harness precisa.
 *
 * Por que isto existe: o harness roda por `file://`, e aí o navegador
 * bloqueia tanto `fetch` quanto `import` de módulos ES. Então as fixtures e
 * o registro de gráficos viram scripts clássicos com variável global, que
 * o harness carrega com `<script src>`.
 */
async function gerarApoioDoHarness(graficos) {
  const dirGerado = join(RAIZ, 'test', 'gerado');
  if (!existsSync(dirGerado)) mkdirSync(dirGerado, { recursive: true });

  // Fixtures como script clássico (window.FIXTURES_BL).
  const fixtures = await build({
    entryPoints: [join(RAIZ, 'test', 'fixtures', 'index.mjs')],
    outfile: join(dirGerado, 'fixtures.js'),
    write: false,
    bundle: true,
    format: 'iife',
    globalName: 'FIXTURES_BL',
    platform: 'browser',
    target: ['es2018'],
    minify: false,
    logLevel: 'warning',
  });
  gravarSeMudou(join(dirGerado, 'fixtures.js'), fixtures.outputFiles[0].text);

  // Registro de gráficos como script clássico (window.REGISTRO_BL).
  const registro = graficos.map((g) => ({
    id: g.id,
    label: g.label,
    tier: g.tier,
    arquivo: `../dist/${g.id}.js`,
    existe: existsSync(join(DIR_DIST, `${g.id}.js`)),
    fixtures: g.fixtures || [],
    explore: g.explore || '',
  }));
  gravarSeMudou(
    join(dirGerado, 'registro.js'),
    `/* Gerado por build.mjs — não edite à mão. */\nwindow.REGISTRO_BL = ${JSON.stringify(registro, null, 2)};\n`
  );
  console.log('  [ok] test/gerado/fixtures.js e registro.js');
}

async function principal() {
  if (!existsSync(DIR_DIST)) mkdirSync(DIR_DIST, { recursive: true });

  const meta = { versao: versaoDoPacote() };

  let graficos = lerRegistro();
  if (somente) graficos = graficos.filter((g) => g.id === somente);

  if (!graficos.length) {
    console.log('Nenhum gráfico no registro (config/charts.json).');
    return;
  }

  console.log(`Build de ${graficos.length} gráfico(s) — versão ${meta.versao}`);
  const resultados = [];
  for (const g of graficos) {
    resultados.push(await construirGrafico(g, meta));
  }

  gerarManifest(lerRegistro(), resultados);
  await gerarApoioDoHarness(lerRegistro());

  const construidos = resultados.filter((r) => r.construido).length;
  console.log(`Pronto: ${construidos}/${graficos.length} construído(s).`);
}

principal().catch((e) => {
  console.error('Falha no build:', e);
  process.exit(1);
});
