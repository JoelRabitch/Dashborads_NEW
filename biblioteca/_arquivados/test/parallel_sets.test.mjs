/**
 * parallel_sets.test.mjs — testes dos Conjuntos Paralelos.
 *
 * A regra que carrega o gráfico é a CONSERVAÇÃO: a soma das fitas que
 * saem de uma categoria tem de ser o tamanho da categoria. Quando isso
 * quebra, algum caso sumiu ou foi contado duas vezes — e o desenho
 * continua bonito, porque fita nenhuma fica visivelmente sobrando.
 *
 * A segunda é o espaguete: a ordenação por baricentro existe para reduzir
 * cruzamentos, e o teste exige que ela reduza mesmo, contra a ordem por
 * tamanho.
 *
 * Nota de método: todo laço afirma que a lista não está vazia.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import {
  lerConjuntos,
  ordenarCategorias,
  contarCruzamentos,
  caminhoDaFita,
} from '../src/charts/parallel_sets/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'parallel_sets.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function contextoDe(nomeDaFixture, config = {}) {
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  const avisos = [];
  return {
    modelo: construirModelo(data, queryResponse, {}),
    config,
    avisar: (m) => avisos.push(m),
    avisos,
  };
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.parallel_sets;
  assert.ok(definicao, 'parallel_sets não se registrou');

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
    blocos: Array.from(palco.querySelectorAll('rect.ps-bloco')).map((r) => ({
      eixo: Number(r.getAttribute('data-eixo')),
      chave: r.getAttribute('data-chave'),
      x: Number(r.getAttribute('x')),
      y: Number(r.getAttribute('y')),
      altura: Number(r.getAttribute('height')),
    })),
    fitas: Array.from(palco.querySelectorAll('path.ps-fita')),
    titulos: Array.from(palco.querySelectorAll('.ps-titulo')).map((t) => t.textContent),
    rotulos: Array.from(palco.querySelectorAll('.ps-rotulo')).map((t) => t.textContent),
    nota: palco.querySelector('.ps-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* --------------------------- conservação ------------------------- */

test('lerConjuntos — as fitas que saem de uma categoria somam a categoria', (t) => {
  // A regra estrutural. Se quebrar, algum caso sumiu ou foi duplicado — e
  // o desenho não denuncia.
  const ctx = contextoDe('duasDimensoes');
  const r = lerConjuntos(ctx);
  assert.ok(!r.erro, `lerConjuntos falhou: ${r.erro}`);
  assert.ok(r.eixos.length >= 2, 'faltaram colunas');
  assert.ok(r.ligacoes.length >= 1, 'faltaram ligações');

  let conferidas = 0;
  for (let e = 0; e < r.ligacoes.length; e++) {
    const saindo = new Map();
    const chegando = new Map();
    for (const ligacao of r.ligacoes[e]) {
      saindo.set(ligacao.de, (saindo.get(ligacao.de) || 0) + ligacao.valor);
      chegando.set(ligacao.para, (chegando.get(ligacao.para) || 0) + ligacao.valor);
    }
    assert.ok(saindo.size > 0, `coluna ${e} sem fitas saindo`);

    for (const categoria of r.eixos[e].categorias) {
      perto(saindo.get(categoria.chave) || 0, categoria.valor, 1e-6);
      conferidas += 1;
    }
    for (const categoria of r.eixos[e + 1].categorias) {
      perto(chegando.get(categoria.chave) || 0, categoria.valor, 1e-6);
      conferidas += 1;
    }
  }
  assert.ok(conferidas > 0, 'nenhuma categoria conferida');
  t.diagnostic(`${conferidas} categorias com entrada e saída conservadas`);
});

test('lerConjuntos — cada coluna soma o MESMO total', (t) => {
  // Colunas com totais diferentes tornariam os blocos incomparáveis entre
  // si, que é justamente o que o gráfico promete comparar.
  const ctx = contextoDe('duasDimensoes');
  const r = lerConjuntos(ctx);
  assert.ok(!r.erro);
  assert.ok(r.eixos.length > 1);

  for (const eixo of r.eixos) {
    assert.ok(eixo.categorias.length > 0, 'coluna vazia');
    const soma = eixo.categorias.reduce((a, c) => a + c.valor, 0);
    perto(soma, r.total, 1e-6);
  }
  t.diagnostic(`${r.eixos.length} colunas somando ${r.total}`);
});

test('lerConjuntos — "Outros" preserva o total ao cortar categorias', (t) => {
  // Jogar fora o resto faria as proporções mentirem sobre um todo que não
  // existe — a mesma regra do pareto e do treemap.
  const ctx = contextoDe('grande5k', { maximoDeCategorias: 4 });
  const r = lerConjuntos(ctx);
  assert.ok(!r.erro, `lerConjuntos falhou: ${r.erro}`);

  let teveCorte = false;
  for (const eixo of r.eixos) {
    assert.ok(eixo.categorias.length <= 4, `${eixo.categorias.length} categorias passaram do teto`);
    const soma = eixo.categorias.reduce((a, c) => a + c.valor, 0);
    perto(soma, r.total, 1e-6);
    if (eixo.categorias.some((c) => c.ehOutros)) teveCorte = true;
  }
  if (teveCorte) {
    assert.ok(ctx.avisos.some((a) => /Outros/.test(a)), 'o corte precisa ser anunciado');
  }
  t.diagnostic(`total ${r.total} preservado em ${r.eixos.length} colunas`);
});

test('lerConjuntos — uma dimensão só é recusada com instrução', (t) => {
  const ctx = contextoDe('semPivo');
  const r = lerConjuntos(ctx);
  assert.ok(r.erro, 'duas colunas são o mínimo');
  assert.match(r.erro, /DUAS dimensões/i);
  t.diagnostic(r.erro.slice(0, 60));
});

/* --------------------------- ordenação --------------------------- */

/** Monta eixos e ligações à mão, para exercitar a ordenação isolada. */
function cenarioCruzado() {
  const eixos = [
    {
      categorias: [
        { chave: 'a1', rotulo: 'a1', valor: 10 },
        { chave: 'a2', rotulo: 'a2', valor: 10 },
        { chave: 'a3', rotulo: 'a3', valor: 10 },
      ],
    },
    {
      categorias: [
        { chave: 'b1', rotulo: 'b1', valor: 10 },
        { chave: 'b2', rotulo: 'b2', valor: 10 },
        { chave: 'b3', rotulo: 'b3', valor: 10 },
      ],
    },
  ];
  for (const eixo of eixos) {
    eixo.indicePorChave = new Map(eixo.categorias.map((c, i) => [c.chave, i]));
  }
  // Ligações invertidas de propósito: a1→b3, a2→b2, a3→b1.
  const ligacoes = [
    [
      { de: 'a1', para: 'b3', valor: 10 },
      { de: 'a2', para: 'b2', valor: 10 },
      { de: 'a3', para: 'b1', valor: 10 },
    ],
  ];
  return { eixos, ligacoes };
}

test('contarCruzamentos — conta os pares que de fato se cruzam', (t) => {
  const { eixos, ligacoes } = cenarioCruzado();
  // Com a ordem inicial (a1,a2,a3 contra b1,b2,b3), as três fitas se
  // cruzam duas a duas: três pares.
  assert.equal(contarCruzamentos(ligacoes[0], eixos[0], eixos[1]), 3);

  // Invertendo a segunda coluna, nenhuma se cruza.
  eixos[1].categorias.reverse();
  eixos[1].indicePorChave = new Map(eixos[1].categorias.map((c, i) => [c.chave, i]));
  assert.equal(contarCruzamentos(ligacoes[0], eixos[0], eixos[1]), 0);
  t.diagnostic('3 cruzamentos antes, 0 depois');
});

test('ordenarCategorias — o baricentro desfaz o espaguete', (t) => {
  // O teste da heurística: ela precisa reduzir cruzamentos de verdade, não
  // só existir.
  const { eixos, ligacoes } = cenarioCruzado();
  const antes = contarCruzamentos(ligacoes[0], eixos[0], eixos[1]);
  assert.ok(antes > 0, 'o cenário precisa começar cruzado');

  ordenarCategorias({ eixos, ligacoes, modo: 'baricentro' });
  const depois = contarCruzamentos(ligacoes[0], eixos[0], eixos[1]);

  assert.ok(depois < antes, `os cruzamentos deveriam diminuir: ${antes} → ${depois}`);
  assert.equal(depois, 0, 'neste cenário dá para zerar');
  t.diagnostic(`${antes} → ${depois} cruzamentos`);
});

test('ordenarCategorias — nenhuma categoria se perde nem se duplica', (t) => {
  for (const modo of ['baricentro', 'tamanho', 'alfabetica']) {
    const { eixos, ligacoes } = cenarioCruzado();
    ordenarCategorias({ eixos, ligacoes, modo });
    for (const eixo of eixos) {
      const chaves = eixo.categorias.map((c) => c.chave).sort();
      assert.equal(new Set(chaves).size, chaves.length, `${modo}: categoria duplicada`);
      assert.equal(chaves.length, 3, `${modo}: categoria perdida`);
      // O índice precisa acompanhar a nova ordem, senão as fitas saem dos
      // blocos errados.
      eixo.categorias.forEach((c, i) => {
        assert.equal(eixo.indicePorChave.get(c.chave), i, `${modo}: índice desatualizado`);
      });
    }
  }
  t.diagnostic('três modos conferidos');
});

test('ordenarCategorias — alfabética e tamanho fazem o que prometem', (t) => {
  const montar = () => {
    const eixos = [
      {
        categorias: [
          { chave: 'z', rotulo: 'zebra', valor: 5 },
          { chave: 'a', rotulo: 'abelha', valor: 50 },
          { chave: 'm', rotulo: 'macaco', valor: 20 },
        ],
      },
    ];
    eixos[0].indicePorChave = new Map(eixos[0].categorias.map((c, i) => [c.chave, i]));
    return { eixos, ligacoes: [] };
  };

  const porTamanho = montar();
  ordenarCategorias({ ...porTamanho, modo: 'tamanho' });
  assert.deepEqual(porTamanho.eixos[0].categorias.map((c) => c.chave), ['a', 'm', 'z']);

  const alfabetica = montar();
  ordenarCategorias({ ...alfabetica, modo: 'alfabetica' });
  assert.deepEqual(alfabetica.eixos[0].categorias.map((c) => c.rotulo), ['abelha', 'macaco', 'zebra']);
  t.diagnostic('dois modos simples conferidos');
});

/* --------------------------- geometria --------------------------- */

test('caminhoDaFita — fecha e cobre a espessura pedida', (t) => {
  const d = caminhoDaFita({ x1: 10, x2: 200, y1: 50, y2: 120, espessura: 30 });
  assert.ok(d.endsWith('Z'), 'a fita precisa fechar');
  assert.ok(!/NaN|Infinity/.test(d), 'fita com caminho inválido');

  const numeros = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const ys = numeros.filter((_, i) => i % 2 === 1);
  assert.ok(ys.length > 0);
  assert.equal(Math.min(...ys), 50, 'a borda de cima começa em y1');
  assert.equal(Math.max(...ys), 150, 'a de baixo termina em y2 + espessura');
  t.diagnostic('geometria da fita conferida');
});

test('caminhoDaFita — espessura zero ainda produz um traço visível', (t) => {
  const d = caminhoDaFita({ x1: 0, x2: 100, y1: 10, y2: 10, espessura: 0 });
  assert.ok(!/NaN/.test(d));
  assert.ok(d.length > 10, 'uma ligação de valor mínimo não pode sumir por completo');
  t.diagnostic('espessura mínima garantida');
});

/* ---------------------------- desenho ---------------------------- */

test('parallel_sets — desenha colunas, blocos e fitas', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.blocos.length > 0, 'nenhum bloco');
    assert.ok(r.fitas.length > 0, 'nenhuma fita');
    assert.ok(r.titulos.length >= 2, 'faltaram os títulos das colunas');
    for (const fita of r.fitas) {
      const d = fita.getAttribute('d') || '';
      assert.ok(d.endsWith('Z') && !/NaN|Infinity/.test(d), 'fita inválida');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.blocos.length} blocos e ${r.fitas.length} fitas`);
});

test('parallel_sets — os blocos de cada coluna empilham sem se sobrepor', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.blocos.length > 0);
    const porEixo = new Map();
    for (const bloco of r.blocos) {
      if (!porEixo.has(bloco.eixo)) porEixo.set(bloco.eixo, []);
      porEixo.get(bloco.eixo).push(bloco);
    }
    assert.ok(porEixo.size >= 2, 'o teste precisa de ao menos duas colunas');

    for (const [eixo, lista] of porEixo) {
      assert.ok(lista.length > 0, `coluna ${eixo} vazia`);
      const xs = new Set(lista.map((b) => b.x.toFixed(2)));
      assert.equal(xs.size, 1, `coluna ${eixo}: blocos em x diferentes`);

      const ordenados = lista.slice().sort((a, b) => a.y - b.y);
      for (let i = 1; i < ordenados.length; i++) {
        assert.ok(
          ordenados[i].y >= ordenados[i - 1].y + ordenados[i - 1].altura - 0.01,
          `coluna ${eixo}: blocos ${i - 1} e ${i} se sobrepõem`
        );
      }
    }
  } finally {
    r.fim();
  }
  t.diagnostic('empilhamento conferido');
});

test('parallel_sets — todas as colunas ocupam a mesma altura total', (t) => {
  // É o que torna os blocos comparáveis entre colunas.
  const r = renderizar('duasDimensoes', { espacoEntreBlocos: 0 });
  try {
    const porEixo = new Map();
    for (const bloco of r.blocos) {
      porEixo.set(bloco.eixo, (porEixo.get(bloco.eixo) || 0) + bloco.altura);
    }
    assert.ok(porEixo.size >= 2);
    const alturas = [...porEixo.values()];
    for (const altura of alturas) {
      assert.ok(Math.abs(altura - alturas[0]) < 1.5, `colunas com alturas diferentes: ${alturas}`);
    }
    t.diagnostic(`alturas: ${alturas.map((a) => a.toFixed(1)).join(', ')}`);
  } finally {
    r.fim();
  }
});

test('parallel_sets — a nota declara a ordem, o total e a ressalva dos vizinhos', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.match(r.nota, /\d+ colunas/);
    assert.match(r.nota, /ordem automática/i, 'a ordem precisa estar declarada');
    assert.match(r.nota, /cruzamento/i, 'a contagem de cruzamentos informa a qualidade do layout');
    assert.match(r.nota, /colunas VIZINHAS/i, 'faltou a ressalva estrutural');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 110));
});

test('parallel_sets — a ordenação automática não piora o desenho', (t) => {
  // Comparação direta entre os dois modos, pela métrica que a nota
  // publica.
  const cruzamentosDe = (r) => Number((r.nota.match(/(\d+) cruzamento/) || [])[1]);

  const automatica = renderizar('duasDimensoes', { ordemDasCategorias: 'baricentro' });
  const porTamanho = renderizar('duasDimensoes', { ordemDasCategorias: 'tamanho' });
  try {
    const a = cruzamentosDe(automatica);
    const b = cruzamentosDe(porTamanho);
    assert.ok(Number.isFinite(a) && Number.isFinite(b), 'a nota precisa publicar a métrica');
    assert.ok(a <= b, `a automática não pode cruzar mais que a por tamanho (${a} > ${b})`);
    t.diagnostic(`automática ${a} × por tamanho ${b}`);
  } finally {
    automatica.fim();
    porTamanho.fim();
  }
});

test('parallel_sets — consulta com uma dimensão só explica', (t) => {
  const r = renderizar('semPivo');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.fitas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
