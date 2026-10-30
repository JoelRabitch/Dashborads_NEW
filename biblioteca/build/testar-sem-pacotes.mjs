/**
 * testar-sem-pacotes.mjs — prova que a biblioteca não depende de nenhum
 * pacote temático (melhorias v3, 5.14b): gera TODOS os bundles sem pacotes
 * (BL_SEM_PACOTES=1) numa pasta temporária (BL_SAIDA, fora de dist/) e roda
 * a suíte inteira contra eles (BL_DIST). O dist/ commitado não é tocado.
 *
 * Uso: npm run testar-sem-pacotes
 */

import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, mkdirSync } from 'node:fs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, 'tmp', 'sem-pacotes');
mkdirSync(SAIDA, { recursive: true });
const env = { ...process.env, BL_SEM_PACOTES: '1', BL_SAIDA: SAIDA, BL_DIST: SAIDA };

const rodar = (args) => {
  const r = spawnSync(process.execPath, args, { cwd: RAIZ, env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
};
rodar([join('build', 'build.mjs')]);
const testes = readdirSync(join(RAIZ, 'test')).filter((n) => n.endsWith('.test.mjs')).map((n) => join('test', n));
rodar(['--test', ...testes]);
