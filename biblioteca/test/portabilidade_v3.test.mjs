/**
 * portabilidade_v3.test.mjs — o repositório se move para outra conta só
 * trocando `config/repo.json` (melhorias v3, 5.15b).
 *
 * Varre TODOS os arquivos versionados de biblioteca/ e falha se encontrar
 * o dono ou o nome do repositório (lidos do próprio config/repo.json),
 * caminhos locais do computador ou o nome do usuário.
 * Exceções: config/repo.json, os gerados dist/URLS.md e dist/URLS.csv, e
 * PROMPT_AGENTE.md (cópia literal das instruções do usuário).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXCECOES = new Set(['config/repo.json', 'dist/URLS.md', 'dist/URLS.csv', 'PROMPT_AGENTE.md']);

test('5.15b — nenhum arquivo versionado cita a conta, o repositório, caminhos locais ou o nome do usuário', () => {
  const repo = JSON.parse(readFileSync(join(RAIZ, 'config', 'repo.json'), 'utf8'));
  const proibidos = [
    repo.dono,
    repo.repositorio,
    String(repo.dono).replace(/([a-z])([A-Z])/g, '$1 $2'), // "Nome Sobrenome"
    // Caminhos locais, montados por partes (senão este arquivo se acusaria).
    ['C:', 'Users', ''].join('\\'),
    ['C:', 'Users', ''].join('/'),
    ['', 'c', 'Users', ''].join('/'),
    ['', 'home', ''].join('/'),
    ['', 'Users', ''].join('/'),
  ].filter(Boolean);
  const arquivos = execFileSync('git', ['ls-files'], { cwd: RAIZ }).toString().split(/\r?\n/).filter(Boolean);
  const achados = [];
  for (const arquivo of arquivos) {
    if (EXCECOES.has(arquivo) || /\.(png|jpg|ico|woff2?)$/i.test(arquivo)) continue;
    let texto;
    try {
      texto = readFileSync(join(RAIZ, arquivo), 'utf8');
    } catch (_) {
      continue;
    }
    for (const p of proibidos) if (texto.includes(p)) achados.push(`${arquivo}: "${p}"`);
  }
  assert.deepEqual(achados, []);
});
