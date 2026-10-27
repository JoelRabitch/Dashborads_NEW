/**
 * waffle.test.mjs — testes do Waffle.
 *
 * A regra estrutural é a CONSERVAÇÃO das células: a soma das partes tem de
 * fechar exatamente no número de células da grade. Arredondar cada
 * categoria por conta própria faz 100 virar 99 ou 101 — e a grade aparece
 * com um buraco, ou estoura, sem que nada explique.
 *
 * A segunda é a honestidade do arredondamento: quando uma categoria fica
 * longe do seu valor real, o gráfico precisa dizer.
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
import { repartirPorMaiorResto, posicaoDaCelula } from '../src/charts/waffle/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'waffle.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.waffle;
  assert.ok(definicao, 'waffle não se registrou');

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

  const celulas = Array.from(palco.querySelectorAll('.wf-celula')).map((el) => ({
    chave: el.getAttribute('data-chave'),
    x: Number(el.getAttribute('x') ?? el.getAttribute('cx')),
    y: Number(el.getAttribute('y') ?? el.getAttribute('cy')),
    tag: el.tagName.toLowerCase(),
    lado: Number(el.getAttribute('width') ?? el.getAttribute('r')),
  }));

  return {
    amb,
    palco,
    celulas,
    nota: palco.querySelector('.wf-nota')?.textContent || '',
    legenda: Array.from(palco.querySelectorAll('.bl-legenda-item, .bl-item-legenda')).map(
      (el) => el.textContent
    ),
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* --------------------------- conservação ------------------------- */

test('repartirPorMaiorResto — a soma fecha EXATAMENTE nas células', (t) => {
  // A regra estrutural. Arredondando cada um por conta própria, estes
  // casos dariam 99 ou 101 numa grade de 100.
  const casos = [
    [[1, 1, 1], 100],
    [[33.4, 33.3, 33.3], 100],
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 100],
    [[99, 1], 100],
    [[1], 49],
    [[5, 5, 5, 5, 5, 5, 5], 36],
  ];
  assert.ok(casos.length > 0);
  for (const [valores, celulas] of casos) {
    const { cotas } = repartirPorMaiorResto(valores, celulas);
    const soma = cotas.reduce((a, b) => a + b, 0);
    assert.equal(soma, celulas, `[${valores}] em ${celulas} células somou ${soma}`);
    for (const cota of cotas) {
      assert.ok(Number.isInteger(cota) && cota >= 0, `cota inválida: ${cota}`);
    }
  }
  t.diagnostic('seis repartições fechando exatamente');
});

test('repartirPorMaiorResto — as sobras vão para quem tem mais direito', (t) => {
  // Três partes iguais em 100 células: 33,33 cada. As duas primeiras
  // sobras precisam ir para as duas primeiras partes (empate desempatado
  // pela ordem, de forma estável).
  const { cotas, exatas } = repartirPorMaiorResto([1, 1, 1], 100);
  assert.deepEqual(cotas, [34, 33, 33]);
  for (const e of exatas) perto(e, 100 / 3, 1e-9);

  // Caso com restos diferentes: 0,6 ganha de 0,4.
  const r = repartirPorMaiorResto([26, 24, 50], 100);
  assert.deepEqual(r.cotas, [26, 24, 50]);

  const desigual = repartirPorMaiorResto([1, 1, 1, 1, 1, 1], 100);
  assert.equal(desigual.cotas.reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(desigual.cotas, [17, 17, 17, 17, 16, 16], 'as sobras vão para os primeiros restos');
  t.diagnostic(`[1,1,1] em 100 ⇒ ${cotas.join(', ')}`);
});

test('repartirPorMaiorResto — a cota exata fica disponível para o aviso', (t) => {
  // É o que permite ao gráfico dizer "o valor exato daria 37,6 células".
  const { cotas, exatas } = repartirPorMaiorResto([376, 624], 100);
  perto(exatas[0], 37.6, 1e-9);
  assert.equal(cotas[0], 38, 'o maior resto arredonda para cima aqui');
  t.diagnostic(`exata ${exatas[0]}, cota ${cotas[0]}`);
});

test('repartirPorMaiorResto — valores inválidos não quebram a conta', (t) => {
  const { cotas } = repartirPorMaiorResto([10, null, NaN, -5, 10], 20);
  assert.equal(cotas.reduce((a, b) => a + b, 0), 20);
  assert.equal(cotas[1], 0);
  assert.equal(cotas[3], 0, 'negativo não ocupa célula');

  const vazio = repartirPorMaiorResto([], 50);
  assert.deepEqual(vazio.cotas, []);

  const semCelulas = repartirPorMaiorResto([1, 2], 0);
  assert.deepEqual(semCelulas.cotas, [0, 0]);
  t.diagnostic('casos degenerados tratados');
});

/* ---------------------------- geometria -------------------------- */

test('posicaoDaCelula — por coluna, enche de baixo para cima', (t) => {
  // A leitura esperada de "proporção" é a do copo enchendo.
  const grade = { colunas: 10, linhas: 10, porColuna: true };
  assert.deepEqual(posicaoDaCelula({ indice: 0, ...grade }), { coluna: 0, linha: 9 });
  assert.deepEqual(posicaoDaCelula({ indice: 1, ...grade }), { coluna: 0, linha: 8 });
  assert.deepEqual(posicaoDaCelula({ indice: 9, ...grade }), { coluna: 0, linha: 0 });
  assert.deepEqual(posicaoDaCelula({ indice: 10, ...grade }), { coluna: 1, linha: 9 });
  t.diagnostic('quatro posições conferidas');
});

test('posicaoDaCelula — por linha, enche como texto', (t) => {
  const grade = { colunas: 10, linhas: 10, porColuna: false };
  assert.deepEqual(posicaoDaCelula({ indice: 0, ...grade }), { coluna: 0, linha: 0 });
  assert.deepEqual(posicaoDaCelula({ indice: 9, ...grade }), { coluna: 9, linha: 0 });
  assert.deepEqual(posicaoDaCelula({ indice: 10, ...grade }), { coluna: 0, linha: 1 });
  t.diagnostic('três posições conferidas');
});

test('posicaoDaCelula — nenhuma célula cai fora da grade', (t) => {
  for (const porColuna of [true, false]) {
    for (let i = 0; i < 100; i++) {
      const p = posicaoDaCelula({ indice: i, colunas: 10, linhas: 10, porColuna });
      assert.ok(p.coluna >= 0 && p.coluna < 10, `coluna ${p.coluna} fora`);
      assert.ok(p.linha >= 0 && p.linha < 10, `linha ${p.linha} fora`);
    }
  }
  t.diagnostic('200 posições dentro da grade');
});

/* ---------------------------- desenho ---------------------------- */

test('waffle — desenha exatamente colunas × linhas células', (t) => {
  const r = renderizar('semPivo', { colunas: 10, linhas: 10 });
  try {
    assert.equal(r.celulas.length, 100, 'a grade precisa estar cheia');
    for (const celula of r.celulas) {
      assert.ok(celula.chave, 'célula sem dono');
      assert.ok(Number.isFinite(celula.x) && Number.isFinite(celula.y), 'célula com posição inválida');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.celulas.length} células desenhadas`);
});

test('waffle — nenhuma célula se sobrepõe a outra', (t) => {
  const r = renderizar('semPivo', { colunas: 10, linhas: 10 });
  try {
    assert.ok(r.celulas.length > 0, 'nenhuma célula');
    const posicoes = new Set(r.celulas.map((c) => `${c.x.toFixed(2)}|${c.y.toFixed(2)}`));
    assert.equal(posicoes.size, r.celulas.length, 'duas células na mesma posição');
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.celulas.length} posições distintas`);
});

test('waffle — todas as células têm o mesmo tamanho', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.celulas.length > 0);
    const lados = new Set(r.celulas.map((c) => c.lado.toFixed(3)));
    assert.equal(lados.size, 1, `tamanhos diferentes: ${[...lados].join(', ')}`);
  } finally {
    r.fim();
  }
  t.diagnostic(`lado único de ${r.celulas[0].lado}px`);
});

test('waffle — a grade pedida é respeitada', (t) => {
  for (const [colunas, linhas] of [[5, 5], [20, 10], [8, 12]]) {
    const r = renderizar('semPivo', { colunas, linhas });
    try {
      assert.equal(
        r.celulas.length,
        colunas * linhas,
        `${colunas}×${linhas} deveria dar ${colunas * linhas} células`
      );
      const colunasDistintas = new Set(r.celulas.map((c) => c.x.toFixed(2)));
      const linhasDistintas = new Set(r.celulas.map((c) => c.y.toFixed(2)));
      assert.equal(colunasDistintas.size, colunas);
      assert.equal(linhasDistintas.size, linhas);
    } finally {
      r.fim();
    }
  }
  t.diagnostic('três grades conferidas');
});

test('waffle — as células de uma categoria são contíguas', (t) => {
  // Espalhar as células de uma categoria pela grade destruiria a
  // contagem, que é a única vantagem do waffle sobre a pizza.
  const r = renderizar('semPivo', { colunas: 10, linhas: 10, preenchimento: 'linhaDeCima' });
  try {
    assert.ok(r.celulas.length > 0, 'nenhuma célula');

    // Na ordem de leitura (linha, depois coluna), cada categoria tem de
    // aparecer num bloco só.
    const emOrdem = r.celulas
      .slice()
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((c) => c.chave);

    const vistas = new Set();
    let anterior = null;
    for (const chave of emOrdem) {
      if (chave === anterior) continue;
      assert.ok(!vistas.has(chave), `a categoria "${chave}" aparece em dois blocos`);
      vistas.add(chave);
      anterior = chave;
    }
    assert.ok(vistas.size > 1, 'o teste precisa de mais de uma categoria');
    t.diagnostic(`${vistas.size} categorias, cada uma num bloco`);
  } finally {
    r.fim();
  }
});

test('waffle — a nota declara quanto vale cada célula', (t) => {
  // É a informação que separa "contar células" de "contar unidades".
  const r = renderizar('semPivo');
  try {
    assert.match(r.nota, /cada célula vale/i, 'a unidade precisa estar escrita');
    assert.match(r.nota, /total/i);
    assert.match(r.nota, /maior resto/i, 'o método do arredondamento precisa estar declarado');
    assert.match(r.nota, /\d+ × \d+ = \d+ células/);
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 110));
});

test('waffle — célula pequena demais para contar é denunciada', (t) => {
  // O limite é sobre o TAMANHO, não sobre a quantidade: 50 × 50 numa tela
  // cheia dão ~9 px e se leem bem. Um teto de contagem seria arbitrário.
  const confortavel = renderizar('semPivo', { colunas: 10, linhas: 10 });
  try {
    assert.ok(confortavel.celulas[0].lado >= 4, 'esta grade deveria caber folgada');
    assert.ok(
      !/não dá para contá-las/i.test(confortavel.aviso),
      `aviso falso numa grade folgada: "${confortavel.aviso}"`
    );
  } finally {
    confortavel.fim();
  }

  const apertada = renderizar('semPivo', { colunas: 50, linhas: 50, espacoEntreCelulas: 8 });
  try {
    assert.ok(apertada.celulas.length > 0, 'a grade apertada ainda precisa ser desenhada');
    assert.ok(apertada.celulas[0].lado < 4, `o cenário precisa apertar de verdade (${apertada.celulas[0].lado}px)`);
    assert.match(apertada.aviso, /não dá para contá-las/i, 'faltou o aviso de célula minúscula');
  } finally {
    apertada.fim();
  }
  t.diagnostic('aviso de tamanho conferido nos dois sentidos');
});

test('waffle — o preenchimento por coluna começa embaixo', (t) => {
  const r = renderizar('semPivo', { colunas: 10, linhas: 10, preenchimento: 'colunaDeBaixo' });
  try {
    assert.ok(r.celulas.length > 0);
    const maiorY = Math.max(...r.celulas.map((c) => c.y));
    const naBase = r.celulas.filter((c) => Math.abs(c.y - maiorY) < 0.01);
    assert.equal(naBase.length, 10, 'a fileira de baixo precisa estar cheia');

    // E a primeira categoria (a maior) ocupa a base da primeira coluna.
    const menorX = Math.min(...r.celulas.map((c) => c.x));
    const cantoInferiorEsquerdo = r.celulas.find(
      (c) => Math.abs(c.x - menorX) < 0.01 && Math.abs(c.y - maiorY) < 0.01
    );
    assert.ok(cantoInferiorEsquerdo, 'faltou a célula do canto inferior esquerdo');
  } finally {
    r.fim();
  }
  t.diagnostic('preenchimento de baixo para cima conferido');
});

test('waffle — as três formas de célula desenham', (t) => {
  for (const forma of ['quadrado', 'arredondado', 'circulo']) {
    const r = renderizar('semPivo', { formaDaCelula: forma, colunas: 5, linhas: 5 });
    try {
      assert.equal(r.celulas.length, 25, `${forma}: grade incompleta`);
      const tags = new Set(r.celulas.map((c) => c.tag));
      assert.equal(tags.size, 1, `${forma}: formas misturadas`);
      assert.equal([...tags][0], forma === 'circulo' ? 'circle' : 'rect');
    } finally {
      r.fim();
    }
  }
  t.diagnostic('três formas conferidas');
});

test('waffle — consulta sem valores positivos explica', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.celulas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
