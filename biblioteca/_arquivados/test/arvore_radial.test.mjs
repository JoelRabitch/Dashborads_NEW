// Testes do arvore_radial retirados de test/arvores.test.mjs no arquivamento (v2).
/**
 * arvores.test.mjs — testes do módulo de hierarquia e das duas árvores.
 *
 * A maior parte do risco está em `core/hierarquia.js`, não no desenho: um
 * ciclo trava o layout do d3 sem mensagem nenhuma, e um nó cujo superior
 * não existe some da tela sem avisar. Os dois casos são testados de frente.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import { construirHierarquia, detectarFormato } from '../src/core/hierarquia.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_DIST = join(resolve(__dirname, '..'), 'dist');

const celula = (v) => ({ value: v, rendered: v === null ? null : String(v) });

function consultaIdPai(linhas) {
  return {
    data: linhas.map(([id, pai, nome, n]) => ({
      id: celula(id),
      pai: celula(pai),
      nome: celula(nome),
      n: celula(n),
    })),
    queryResponse: {
      fields: {
        dimension_like: [
          { name: 'id', label: 'ID', label_short: 'ID', type: 'string' },
          { name: 'pai', label: 'Superior', label_short: 'Superior', type: 'string' },
          { name: 'nome', label: 'Nome', label_short: 'Nome', type: 'string' },
        ],
        measure_like: [{ name: 'n', label: 'N', label_short: 'N', type: 'sum', is_numeric: true }],
        pivots: [],
      },
      pivots: [],
    },
  };
}

function modeloDe(nomeDaFixture) {
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  return construirModelo(data, queryResponse, {});
}

function renderizar(id, nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIR_DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  assert.ok(definicao, `${id} não se registrou`);

  const instancia = criarInstancia(definicao, amb.chamadasDeApi);
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  const palco = amb.window.document.getElementById('palco');

  instancia.create(palco, configPadrao(definicao));
  let chamouDone = false;
  instancia.updateAsync(
    data,
    palco,
    Object.assign(configPadrao(definicao), ajustes),
    queryResponse,
    {},
    () => { chamouDone = true; }
  );
  assert.ok(chamouDone, 'done() precisa ser chamado sempre');

  return {
    amb,
    palco,
    nos: Array.from(palco.querySelectorAll('.av-no')),
    ligacoes: Array.from(palco.querySelectorAll('.av-ligacao')),
    rotulos: Array.from(palco.querySelectorAll('.av-rotulo')).map((t) => t.textContent),
    titulos: Array.from(palco.querySelectorAll('.av-titulo-arvore')).map((t) => t.textContent),
    fim: () => amb.restaurar(),
  };
}

test('arvore_radial — desenha um nó por item e uma ligação a menos', (t) => {
  for (const fixture of ['hierarquia', 'paiFilho']) {
    const r = renderizar('arvore_radial', fixture);
    try {
      assert.ok(r.nos.length > 2, `${fixture}: faltaram nós`);
      assert.equal(
        r.ligacoes.length,
        r.nos.length - 1,
        `${fixture}: numa árvore há sempre um nó a mais do que ligações`
      );
      for (const ligacao of r.ligacoes) {
        assert.ok(!/NaN/.test(ligacao.getAttribute('d') || ''), `${fixture}: ligação com NaN`);
      }
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
      t.diagnostic(`${fixture}: ${r.nos.length} nós`);
    } finally {
      r.fim();
    }
  }
});

test('arvore_radial — as três formas de ligação desenham', (t) => {
  for (const forma of ['curva', 'cotovelo', 'reta']) {
    const r = renderizar('arvore_radial', 'hierarquia', { formaDaLigacao: forma });
    try {
      assert.ok(r.ligacoes.length > 0, `forma ${forma}: nenhuma ligação`);
      for (const ligacao of r.ligacoes) {
        const d = ligacao.getAttribute('d') || '';
        assert.ok(d.length > 8 && !/NaN/.test(d), `forma ${forma}: caminho inválido`);
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic('curva, cotovelo e reta conferidas');
});

test('arvore_radial — tamanho por valor produz nós de raios diferentes', (t) => {
  const r = renderizar('arvore_radial', 'hierarquia', { tamanhoPorValor: true });
  try {
    const raios = new Set(r.nos.map((n) => Number(n.getAttribute('r')).toFixed(2)));
    assert.ok(raios.size > 3, `esperado vários raios distintos, veio ${raios.size}`);
  } finally {
    r.fim();
  }
  t.diagnostic('nós dimensionados pelo valor');
});

