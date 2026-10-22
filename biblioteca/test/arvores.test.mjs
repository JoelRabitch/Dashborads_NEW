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

test('hierarquia — detecta os dois formatos sem confiar no nome das colunas', (t) => {
  assert.equal(detectarFormato(modeloDe('hierarquia')), 'niveis');
  assert.equal(detectarFormato(modeloDe('paiFilho')), 'paiFilho');
  assert.equal(detectarFormato(modeloDe('duasDimensoes')), 'niveis', 'duas dimensões comuns não são id/pai');
  t.diagnostic('detecção conferida nos três casos');
});

test('hierarquia — níveis aninhados viram a árvore certa', (t) => {
  const modelo = modeloDe('hierarquia');
  const { raiz, quantidadeDeNos } = construirHierarquia(modelo, {});

  assert.ok(raiz, 'a árvore precisa existir');
  assert.equal(raiz.height, 3, 'três dimensões viram três níveis abaixo da raiz');
  assert.equal(raiz.children.length, 3, 'três diretorias');

  // A raiz tem que somar exatamente a medida inteira.
  let somaDoModelo = 0;
  for (const linha of modelo.linhas) {
    const v = modelo.valorNumerico(linha, modelo.medidas[0].nome);
    if (v !== null) somaDoModelo += v;
  }
  assert.equal(raiz.value, somaDoModelo, 'a raiz precisa somar toda a medida');
  t.diagnostic(`${quantidadeDeNos} nós, raiz = ${raiz.value}`);
});

test('hierarquia — pares id/superior montam a árvore e somam de baixo para cima', (t) => {
  const modelo = modeloDe('paiFilho');
  const { raiz } = construirHierarquia(modelo, {});

  assert.ok(raiz, 'a árvore precisa existir');
  assert.equal(raiz.data.rotulo, 'Direção Geral', 'a raiz é o único nó sem superior');
  assert.equal(raiz.children.length, 3);

  // Operações tem Logística (25) e Qualidade (15) como filhas.
  const operacoes = raiz.children.find((c) => c.data.rotulo === 'Operações');
  assert.ok(operacoes, 'faltou o ramo Operações');
  assert.equal(operacoes.value, 40, 'um nó interno soma os filhos, não o próprio valor');
  t.diagnostic(`raiz = ${raiz.value}, Operações = ${operacoes.value}`);
});

test('hierarquia — ciclo é desfeito com aviso, não trava', (t) => {
  const { data, queryResponse } = consultaIdPai([
    ['a', 'b', 'A', 1],
    ['b', 'a', 'B', 2],
    ['c', null, 'C', 3],
  ]);
  const modelo = construirModelo(data, queryResponse, {});
  const { raiz, avisos } = construirHierarquia(modelo, {
    formatoDaHierarquia: 'paiFilho',
    campoDoId: 'id',
    campoDoPai: 'pai',
    campoDoNome: 'nome',
  });

  assert.ok(raiz, 'mesmo com ciclo a árvore precisa sair');
  assert.ok(
    avisos.some((a) => /ciclo/i.test(a)),
    `o ciclo precisa virar aviso; veio: ${avisos.join(' | ')}`
  );
  // Nenhum nó pode ter sumido.
  const rotulos = raiz.descendants().map((n) => n.data.rotulo);
  for (const esperado of ['A', 'B', 'C']) {
    assert.ok(rotulos.includes(esperado), `o nó ${esperado} sumiu da árvore`);
  }
  t.diagnostic(`avisos: ${avisos.join(' | ')}`);
});

test('hierarquia — superior inexistente não some da tela', (t) => {
  const { data, queryResponse } = consultaIdPai([
    ['1', null, 'Raiz', 10],
    ['2', '1', 'Filho', 5],
    ['3', 'fantasma', 'Órfão', 7],
  ]);
  const modelo = construirModelo(data, queryResponse, {});
  const { raiz, avisos } = construirHierarquia(modelo, {
    formatoDaHierarquia: 'paiFilho',
    campoDoId: 'id',
    campoDoPai: 'pai',
    campoDoNome: 'nome',
  });

  const rotulos = raiz.descendants().map((n) => n.data.rotulo);
  assert.ok(rotulos.includes('Órfão'), 'um nó com superior inexistente não pode sumir');
  assert.ok(
    avisos.some((a) => /superior que não está na consulta/i.test(a)),
    `o usuário precisa ser avisado; veio: ${avisos.join(' | ')}`
  );
  t.diagnostic(`nós: ${rotulos.join(', ')}`);
});

test('hierarquia — profundidade máxima poda sem perder valor', (t) => {
  const modelo = modeloDe('hierarquia');
  const inteira = construirHierarquia(modelo, {});
  const podada = construirHierarquia(modelo, { profundidadeMaxima: 1 });

  assert.ok(podada.quantidadeDeNos < inteira.quantidadeDeNos, 'podar precisa reduzir a árvore');
  assert.equal(podada.raiz.height, 1, 'com profundidade 1, sobra um nível');
  assert.equal(
    podada.raiz.value,
    inteira.raiz.value,
    'podar não pode mudar o total: o valor dos filhos sobe para o nó cortado'
  );
  t.diagnostic(`${inteira.quantidadeDeNos} → ${podada.quantidadeDeNos} nós, total preservado`);
});

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

test('arvores_multiplas — uma árvore por ramo, com título e valor', (t) => {
  const r = renderizar('arvores_multiplas', 'hierarquia');
  try {
    const modelo = modeloDe('hierarquia');
    const { raiz } = construirHierarquia(modelo, {});
    assert.equal(r.titulos.length, raiz.children.length, 'esperado um título por ramo');
    for (const titulo of r.titulos) {
      assert.match(titulo, /\(.+\)/, `o título "${titulo}" deveria trazer o valor do ramo`);
    }
    assert.ok(r.nos.length > r.titulos.length, 'cada árvore precisa de mais de um nó');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`árvores: ${r.titulos.join(' | ')}`);
});
