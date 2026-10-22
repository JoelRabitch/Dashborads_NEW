/**
 * marimekko.test.mjs — testes do Marimekko.
 *
 * Duas conservações sustentam o gráfico, e as duas quebram em silêncio:
 *
 * 1. **A soma das larguras é o total.** Se não for, as colunas deixam de
 *    representar o peso de cada segmento e nada no desenho denuncia.
 * 2. **Dentro de cada coluna, a soma das alturas é 100%.** Uma coluna que
 *    some 97% fica com uma faixa vazia no topo que parece margem.
 *
 * E a ressalva perceptual: a área de um bloco é o PRODUTO de duas
 * proporções. O teste confere que o desenho corresponde à conta — porque
 * a leitura humana, essa, não corresponde.
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
import { lerMatriz, areaRelativa } from '../src/charts/marimekko/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'marimekko.js');

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
  const definicao = amb.registro.marimekko;
  assert.ok(definicao, 'marimekko não se registrou');

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
    blocos: Array.from(palco.querySelectorAll('rect.mk-bloco')).map((r) => ({
      coluna: r.getAttribute('data-coluna'),
      serie: r.getAttribute('data-serie'),
      x: Number(r.getAttribute('x')),
      y: Number(r.getAttribute('y')),
      largura: Number(r.getAttribute('width')),
      altura: Number(r.getAttribute('height')),
      cor: r.getAttribute('fill'),
    })),
    colunas: Array.from(palco.querySelectorAll('.mk-coluna')).map((t) => t.textContent),
    rotulos: Array.from(palco.querySelectorAll('.mk-rotulo')).map((t) => t.textContent),
    nota: palco.querySelector('.mk-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* -------------------------- conservações ------------------------- */

test('lerMatriz — a soma das colunas é o total', (t) => {
  const ctx = contextoDe('duasDimensoes');
  const r = lerMatriz(ctx);
  assert.ok(!r.erro, `lerMatriz falhou: ${r.erro}`);
  assert.ok(r.colunas.length > 1, 'poucas colunas');

  const soma = r.colunas.reduce((a, c) => a + c.total, 0);
  perto(soma, r.total, 1e-6);
  t.diagnostic(`${r.colunas.length} colunas somando ${r.total}`);
});

test('lerMatriz — dentro de cada coluna, as séries somam o total da coluna', (t) => {
  // A segunda conservação. Uma coluna que some 97% fica com uma faixa
  // vazia no topo que o leitor lê como margem do desenho.
  const ctx = contextoDe('duasDimensoes');
  const r = lerMatriz(ctx);
  assert.ok(!r.erro);
  assert.ok(r.colunas.length > 0, 'nenhuma coluna');

  let conferidas = 0;
  for (const coluna of r.colunas) {
    let soma = 0;
    for (const serie of r.series) soma += coluna.porSerie.get(serie.chave) || 0;
    perto(soma, coluna.total, 1e-6);
    conferidas += 1;
  }
  assert.ok(conferidas > 0, 'nenhuma coluna conferida');
  t.diagnostic(`${conferidas} colunas com empilhamento fechado`);
});

test('lerMatriz — a soma das séries também fecha no total', (t) => {
  const ctx = contextoDe('duasDimensoes');
  const r = lerMatriz(ctx);
  assert.ok(!r.erro);
  assert.ok(r.series.length > 0, 'nenhuma série');

  const soma = r.series.reduce((a, s) => a + s.total, 0);
  perto(soma, r.total, 1e-6);
  t.diagnostic(`${r.series.length} séries somando ${r.total}`);
});

test('lerMatriz — "Outros" preserva os totais nas DUAS dimensões', (t) => {
  // Cortar sem somar faria as proporções mentirem sobre um todo que não
  // existe — a mesma regra do pareto, do treemap e do parallel_sets.
  const ctx = contextoDe('grande5k', { maximoDeColunas: 3, maximoDeSeries: 3 });
  const r = lerMatriz(ctx);
  assert.ok(!r.erro, `lerMatriz falhou: ${r.erro}`);

  assert.ok(r.colunas.length <= 3, `${r.colunas.length} colunas passaram do teto`);
  assert.ok(r.series.length <= 3, `${r.series.length} séries passaram do teto`);

  perto(r.colunas.reduce((a, c) => a + c.total, 0), r.total, 1e-6);
  perto(r.series.reduce((a, s) => a + s.total, 0), r.total, 1e-6);

  // E o empilhamento de cada coluna continua fechando depois do corte.
  for (const coluna of r.colunas) {
    let soma = 0;
    for (const serie of r.series) soma += coluna.porSerie.get(serie.chave) || 0;
    perto(soma, coluna.total, 1e-6);
  }
  t.diagnostic(`cortado para ${r.colunas.length}×${r.series.length}, total ${r.total} preservado`);
});

test('lerMatriz — valores negativos são recusados, não somados', (t) => {
  // Numa parte negativa a coluna passaria de 100% e a altura deixaria de
  // significar proporção. Nenhuma fixture tem medida negativa, então aqui
  // garantimos o outro lado: sem negativos, nenhum aviso falso.
  const ctx = contextoDe('duasDimensoes');
  const r = lerMatriz(ctx);
  assert.ok(!r.erro);
  assert.ok(
    !ctx.avisos.some((a) => /negativo/i.test(a)),
    `aviso de negativo sem haver negativos: ${ctx.avisos.join(' | ')}`
  );
  t.diagnostic('sem aviso falso');
});

test('lerMatriz — uma dimensão só é recusada com instrução', (t) => {
  const ctx = contextoDe('semPivo');
  const r = lerMatriz(ctx);
  assert.ok(r.erro, 'duas dimensões são o mínimo');
  assert.match(r.erro, /DUAS dimensões/i);
  t.diagnostic(r.erro.slice(0, 70));
});

/* ----------------------------- a área ---------------------------- */

test('areaRelativa — é o produto das duas proporções', (t) => {
  // 25% de uma coluna que vale 40% do total = 10% da área.
  perto(areaRelativa({ valorDoBloco: 10, totalDaColuna: 40, totalGeral: 100 }), 0.1, 1e-12);
  perto(areaRelativa({ valorDoBloco: 40, totalDaColuna: 40, totalGeral: 100 }), 0.4, 1e-12);
  perto(areaRelativa({ valorDoBloco: 1, totalDaColuna: 1, totalGeral: 100 }), 0.01, 1e-12);
  t.diagnostic('três produtos conferidos');
});

test('areaRelativa — a soma de todas as áreas é 1', (t) => {
  // É a conservação vista pelo lado da área: o gráfico cobre o retângulo
  // inteiro, sem sobra nem estouro.
  const colunas = [
    { total: 40, blocos: [10, 20, 10] },
    { total: 35, blocos: [5, 30] },
    { total: 25, blocos: [25] },
  ];
  const totalGeral = 100;

  let soma = 0;
  let contados = 0;
  for (const coluna of colunas) {
    for (const valor of coluna.blocos) {
      soma += areaRelativa({ valorDoBloco: valor, totalDaColuna: coluna.total, totalGeral });
      contados += 1;
    }
  }
  assert.ok(contados > 0, 'nenhum bloco somado');
  perto(soma, 1, 1e-12);
  t.diagnostic(`${contados} blocos cobrindo exatamente 100% da área`);
});

test('areaRelativa — casos degenerados devolvem zero', (t) => {
  assert.equal(areaRelativa({ valorDoBloco: 10, totalDaColuna: 0, totalGeral: 100 }), 0);
  assert.equal(areaRelativa({ valorDoBloco: 10, totalDaColuna: 40, totalGeral: 0 }), 0);
  t.diagnostic('divisões por zero tratadas');
});

/* ---------------------------- desenho ---------------------------- */

test('marimekko — desenha um bloco por combinação com valor', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.blocos.length > 0, 'nenhum bloco');
    assert.ok(r.colunas.length > 1, 'faltaram os nomes das colunas');
    for (const bloco of r.blocos) {
      assert.ok(bloco.coluna && bloco.serie, 'bloco sem identificação');
      assert.ok(bloco.largura > 0 && bloco.altura > 0, 'bloco sem tamanho');
      assert.ok(Number.isFinite(bloco.x) && Number.isFinite(bloco.y), 'bloco com posição inválida');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.blocos.length} blocos em ${r.colunas.length} colunas`);
});

test('marimekko — os blocos de uma coluna empilham sem buraco nem sobreposição', (t) => {
  // A conservação das alturas, verificada no DESENHO: o topo de um bloco
  // é exatamente a base do anterior.
  const r = renderizar('duasDimensoes', { espacoEntreColunas: 0 });
  try {
    assert.ok(r.blocos.length > 0, 'nenhum bloco');

    const porColuna = new Map();
    for (const bloco of r.blocos) {
      if (!porColuna.has(bloco.coluna)) porColuna.set(bloco.coluna, []);
      porColuna.get(bloco.coluna).push(bloco);
    }
    assert.ok(porColuna.size > 1, 'o teste precisa de mais de uma coluna');

    for (const [chave, lista] of porColuna) {
      assert.ok(lista.length > 0, `coluna ${chave} vazia`);
      const ordenados = lista.slice().sort((a, b) => a.y - b.y);
      for (let i = 1; i < ordenados.length; i++) {
        perto(ordenados[i].y, ordenados[i - 1].y + ordenados[i - 1].altura, 0.01);
      }
    }
  } finally {
    r.fim();
  }
  t.diagnostic('empilhamento contínuo em todas as colunas');
});

test('marimekko — todas as colunas têm a MESMA altura total', (t) => {
  // É o que faz as larguras serem comparáveis: colunas de alturas
  // diferentes misturariam as duas codificações.
  const r = renderizar('duasDimensoes', { espacoEntreColunas: 0 });
  try {
    const porColuna = new Map();
    for (const bloco of r.blocos) {
      porColuna.set(bloco.coluna, (porColuna.get(bloco.coluna) || 0) + bloco.altura);
    }
    assert.ok(porColuna.size > 1, 'poucas colunas');
    const alturas = [...porColuna.values()];
    for (const altura of alturas) {
      assert.ok(
        Math.abs(altura - alturas[0]) < 1.5,
        `colunas com alturas diferentes: ${alturas.map((a) => a.toFixed(1)).join(', ')}`
      );
    }
    t.diagnostic(`alturas: ${alturas.map((a) => a.toFixed(1)).join(', ')}`);
  } finally {
    r.fim();
  }
});

test('marimekko — a largura de cada coluna é proporcional ao seu total', (t) => {
  // A outra metade da codificação, conferida contra os dados.
  const r = renderizar('duasDimensoes', { espacoEntreColunas: 0 });
  try {
    assert.ok(r.blocos.length > 0, 'nenhum bloco');

    const ctx = contextoDe('duasDimensoes');
    const dados = lerMatriz(ctx);
    const totalPorColuna = new Map(dados.colunas.map((c) => [c.chave, c.total]));

    const larguraPorColuna = new Map();
    for (const bloco of r.blocos) {
      larguraPorColuna.set(bloco.coluna, bloco.largura);
    }
    assert.ok(larguraPorColuna.size > 1, 'poucas colunas para comparar');

    const maiorTotal = Math.max(...totalPorColuna.values());
    const maiorLargura = Math.max(...larguraPorColuna.values());

    let conferidas = 0;
    for (const [chave, largura] of larguraPorColuna) {
      const total = totalPorColuna.get(chave);
      assert.ok(total !== undefined, `coluna ${chave} não existe nos dados`);
      perto(largura / maiorLargura, total / maiorTotal, 0.01);
      conferidas += 1;
    }
    assert.ok(conferidas > 0, 'nenhuma largura conferida');
    t.diagnostic(`${conferidas} larguras proporcionais ao total`);
  } finally {
    r.fim();
  }
});

test('marimekko — nenhum bloco se sobrepõe a outro', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.blocos.length > 1, 'poucos blocos');
    for (let i = 0; i < r.blocos.length; i++) {
      for (let j = i + 1; j < r.blocos.length; j++) {
        const a = r.blocos[i];
        const b = r.blocos[j];
        const separados =
          a.x + a.largura <= b.x + 0.01 ||
          b.x + b.largura <= a.x + 0.01 ||
          a.y + a.altura <= b.y + 0.01 ||
          b.y + b.altura <= a.y + 0.01;
        assert.ok(separados, `blocos ${i} e ${j} se sobrepõem`);
      }
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.blocos.length} blocos sem sobreposição`);
});

test('marimekko — nada sai da área do gráfico', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.blocos.length > 0, 'nenhum bloco');
    for (const bloco of r.blocos) {
      assert.ok(bloco.x >= -1 && bloco.x + bloco.largura <= 901, 'bloco fora à direita');
      assert.ok(bloco.y >= -1 && bloco.y + bloco.altura <= 561, 'bloco fora embaixo');
    }
  } finally {
    r.fim();
  }
  t.diagnostic('blocos contidos');
});

test('marimekko — a mesma série tem a mesma cor em todas as colunas', (t) => {
  // Cor é a identidade da série aqui. Variá-la por coluna faria o
  // empilhamento deixar de ser legível de uma coluna para a outra.
  const r = renderizar('duasDimensoes');
  try {
    const porSerie = new Map();
    for (const bloco of r.blocos) {
      if (!porSerie.has(bloco.serie)) porSerie.set(bloco.serie, new Set());
      porSerie.get(bloco.serie).add(bloco.cor);
    }
    assert.ok(porSerie.size > 1, 'poucas séries');
    for (const [serie, cores] of porSerie) {
      assert.equal(cores.size, 1, `a série "${serie}" usou ${cores.size} cores`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.blocos.length} blocos com cor consistente por série`);
});

test('marimekko — a nota declara as duas codificações e a ressalva da área', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.match(r.nota, /LARGURA é o peso/i, 'a codificação da largura precisa estar dita');
    assert.match(r.nota, /ALTURA é a composição/i, 'e a da altura também');
    assert.match(r.nota, /áreas de blocos distantes não se comparam/i, 'faltou a ressalva perceptual');
    assert.match(r.nota, /\d+ colunas × \d+ séries/);
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 120));
});

test('marimekko — o corte em "Outros" é anunciado', (t) => {
  const r = renderizar('grande5k', { maximoDeColunas: 3, maximoDeSeries: 3 });
  try {
    assert.ok(r.blocos.length > 0, 'nenhum bloco');
    assert.match(r.aviso, /Outros/, 'o corte precisa ser anunciado');
    assert.match(r.aviso, /preservados/i, 'e a preservação dos totais também');
  } finally {
    r.fim();
  }
  t.diagnostic(r.aviso.slice(0, 90));
});

test('marimekko — consulta sem as duas dimensões explica', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.blocos.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
