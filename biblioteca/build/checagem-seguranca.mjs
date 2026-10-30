/**
 * checagem-seguranca.mjs — varre `src/` e `dist/` procurando o que a seção 7
 * do PROMPT_AGENTE.md proíbe.
 *
 * Proibido: fetch, XMLHttpRequest, sendBeacon, eval, new Function,
 * document.cookie, localStorage, sessionStorage, window.open, @import,
 * document.write, importScripts, WebSocket e qualquer URL http(s) externa.
 *
 * Exceções permitidas (e por quê):
 *  - `http://www.w3.org/2000/svg` e `.../xlink`: são NAMESPACES XML exigidos
 *    por `createElementNS`. Não são endereços que o navegador busca.
 *  - Menções dentro de COMENTÁRIOS (ex.: esta própria lista, ou uma nota
 *    explicando que não usamos `window.open`): não são código executável.
 *    O script distingue comentário de código.
 *
 * Uso: `npm run seguranca` (sai com código 1 se achar violação real).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');

const PADROES = [
  { nome: 'fetch(', regex: /\bfetch\s*\(/ },
  { nome: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
  { nome: 'sendBeacon', regex: /\bsendBeacon\b/ },
  { nome: 'eval(', regex: /\beval\s*\(/ },
  { nome: 'new Function', regex: /\bnew\s+Function\b/ },
  { nome: 'document.cookie', regex: /\bdocument\s*\.\s*cookie\b/ },
  { nome: 'localStorage', regex: /\blocalStorage\b/ },
  { nome: 'sessionStorage', regex: /\bsessionStorage\b/ },
  { nome: 'window.open', regex: /\bwindow\s*\.\s*open\s*\(/ },
  { nome: '@import', regex: /@import\b/ },
  { nome: 'document.write', regex: /\bdocument\s*\.\s*write\b/ },
  { nome: 'importScripts', regex: /\bimportScripts\b/ },
  { nome: 'WebSocket', regex: /\bWebSocket\b/ },
  { nome: 'innerHTML', regex: /\.innerHTML\s*=/ },
  { nome: 'URL externa http(s)', regex: /https?:\/\/(?!www\.w3\.org\/)/ },
];

const PASTAS = ['src', 'dist'];
const EXTENSOES = new Set(['.js', '.mjs', '.css', '.html']);

function listarArquivos(dir) {
  if (!existsSync(dir)) return [];
  const saida = [];
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome.startsWith('.')) continue;
    const caminho = join(dir, nome);
    const st = statSync(caminho);
    if (st.isDirectory()) saida.push(...listarArquivos(caminho));
    else {
      const ponto = nome.lastIndexOf('.');
      if (ponto >= 0 && EXTENSOES.has(nome.slice(ponto))) saida.push(caminho);
    }
  }
  return saida;
}

/**
 * Marca quais posições do texto estão dentro de comentário (// ou /* *\/)
 * ou de string literal de uma linha de comentário de bloco JSDoc.
 * Simplificado, mas suficiente: só precisamos saber se a OCORRÊNCIA está
 * em comentário.
 */
function mapaDeComentarios(texto) {
  const dentro = new Uint8Array(texto.length);
  let i = 0;
  let estado = 'codigo'; // 'codigo' | 'linha' | 'bloco' | 'aspas' | 'aspas2' | 'template'
  while (i < texto.length) {
    const c = texto[i];
    const prox = texto[i + 1];
    if (estado === 'codigo') {
      if (c === '/' && prox === '/') {
        estado = 'linha';
        dentro[i] = 1;
        i += 1;
      } else if (c === '/' && prox === '*') {
        estado = 'bloco';
        dentro[i] = 1;
        i += 1;
      } else if (c === "'") estado = 'aspas';
      else if (c === '"') estado = 'aspas2';
      else if (c === '`') estado = 'template';
    } else if (estado === 'linha') {
      if (c === '\n') estado = 'codigo';
      else dentro[i] = 1;
    } else if (estado === 'bloco') {
      dentro[i] = 1;
      if (c === '*' && prox === '/') {
        dentro[i + 1] = 1;
        estado = 'codigo';
        i += 1;
      }
    } else if (estado === 'aspas') {
      if (c === '\\') i += 1;
      else if (c === "'") estado = 'codigo';
    } else if (estado === 'aspas2') {
      if (c === '\\') i += 1;
      else if (c === '"') estado = 'codigo';
    } else if (estado === 'template') {
      if (c === '\\') i += 1;
      else if (c === '`') estado = 'codigo';
    }
    i += 1;
  }
  return dentro;
}

function verificarArquivo(caminho) {
  const texto = readFileSync(caminho, 'utf8');
  const comentario = mapaDeComentarios(texto);
  const achados = [];

  for (const padrao of PADROES) {
    const re = new RegExp(padrao.regex.source, 'g');
    let m;
    while ((m = re.exec(texto)) !== null) {
      const pos = m.index;
      if (comentario[pos]) continue; // menção em comentário: não é código
      const linha = texto.slice(0, pos).split('\n').length;
      const trecho = texto.split('\n')[linha - 1].trim().slice(0, 120);
      achados.push({ padrao: padrao.nome, linha, trecho });
    }
  }
  return achados;
}

function principal() {
  let total = 0;
  const problemas = [];

  for (const pasta of PASTAS) {
    const arquivos = listarArquivos(join(RAIZ, pasta));
    for (const arquivo of arquivos) {
      total += 1;
      const achados = verificarArquivo(arquivo);
      for (const a of achados) {
        problemas.push({ arquivo: relative(RAIZ, arquivo), ...a });
      }
    }
  }

  console.log(`Checagem de segurança: ${total} arquivo(s) em src/ e dist/.`);
  if (!problemas.length) {
    console.log('RESULTADO: nenhuma violação encontrada.');
    console.log('(Menções em comentários são ignoradas de propósito; os');
    console.log(' namespaces http://www.w3.org/... do SVG são permitidos.)');
    return;
  }

  console.log(`RESULTADO: ${problemas.length} possível(is) violação(ões):`);
  for (const p of problemas) {
    console.log(`  ${p.arquivo}:${p.linha}  [${p.padrao}]  ${p.trecho}`);
  }
  process.exit(1);
}

principal();
