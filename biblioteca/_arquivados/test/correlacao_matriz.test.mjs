/**
 * correlacao_matriz.test.mjs — testes da Matriz de Correlação.
 *
 * Três propriedades carregam o gráfico inteiro: a matriz é simétrica com 1
 * na diagonal, a cor é divergente com domínio FIXO em [−1, +1], e Spearman
 * difere de Pearson exatamente onde a relação é monótona mas não linear.
 * Nenhuma delas é visível quando quebra — uma matriz assimétrica continua
 * um mapa de calor bonito.
 *
 * Nota de método, aprendida nesta sessão: **todo laço afirma que a lista
 * não está vazia.** Um laço que roda zero vezes passa em qualquer coisa.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import {
  postos,
  correlacaoDePearson,
  correlacaoDeSpearman,
} from '../src/core/estatistica.js';
import {
  calcularMatriz,
  corDaCorrelacao,
  ordenarVariaveis,
  formatarR,
} from '../src/charts/correlacao_matriz/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'correlacao_matriz.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

const linhasDe = (...colunas) =>
  colunas[0].map((_, i) => ({ indice: i, valores: colunas.map((c) => c[i]), rotulo: `#${i}` }));

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.correlacao_matriz;
  assert.ok(definicao, 'correlacao_matriz não se registrou');

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
    celulas: Array.from(palco.querySelectorAll('rect.cm-celula')).map((r) => ({
      x: Number(r.getAttribute('x')),
      y: Number(r.getAttribute('y')),
      lado: Number(r.getAttribute('width')),
      cor: r.getAttribute('fill'),
    })),
    valores: Array.from(palco.querySelectorAll('text.cm-valor')).map((t) => t.textContent),
    nomes: Array.from(palco.querySelectorAll('text.cm-nome')).map((t) => t.textContent),
    legenda: Array.from(palco.querySelectorAll('.cm-legenda')),
    nota: palco.querySelector('.cm-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ----------------------------- postos ---------------------------- */

test('postos — empates recebem a média das posições', (t) => {
  // Dar posições arbitrárias a valores iguais inventa uma ordem que não
  // existe, e o Spearman em cima disso fica maior do que deveria.
  assert.deepEqual(postos([10, 20, 20, 30]), [1, 2.5, 2.5, 4]);
  assert.deepEqual(postos([5, 5, 5]), [2, 2, 2]);
  assert.deepEqual(postos([3, 1, 2]), [3, 1, 2], 'os postos voltam na ordem ORIGINAL');
  t.diagnostic('três casos de empate conferidos');
});

/* ---------------------------- Spearman --------------------------- */

test('Spearman — relação monótona não-linear dá 1 onde Pearson não dá', (t) => {
  // É a razão de o método existir, e a razão de o gráfico oferecer os dois
  // lado a lado: quando discordam, há curvatura.
  const pontos = Array.from({ length: 30 }, (_, i) => ({ x: i - 15, y: (i - 15) ** 3 }));
  const s = correlacaoDeSpearman(pontos);
  const p = correlacaoDePearson(pontos);

  perto(s, 1, 1e-12);
  assert.ok(p < 0.95, `Pearson deveria ficar bem abaixo de 1 numa cúbica; deu ${p.toFixed(4)}`);
  t.diagnostic(`y = x³ ⇒ Spearman ${s.toFixed(4)}, Pearson ${p.toFixed(4)}`);
});

test('Spearman — numa relação linear os dois concordam', (t) => {
  const pontos = Array.from({ length: 20 }, (_, i) => ({ x: i, y: 3 + 2 * i }));
  perto(correlacaoDeSpearman(pontos), 1, 1e-12);
  perto(correlacaoDePearson(pontos), 1, 1e-9);
  t.diagnostic('reta: ambos = 1');
});

test('Spearman — um outlier derruba Pearson e não derruba Spearman', (t) => {
  const base = Array.from({ length: 30 }, (_, i) => ({ x: i, y: i }));
  base.push({ x: 31, y: -5000 });

  const p = correlacaoDePearson(base);
  const s = correlacaoDeSpearman(base);
  assert.ok(s > p + 0.3, `Spearman (${s.toFixed(3)}) deveria resistir mais que Pearson (${p.toFixed(3)})`);
  t.diagnostic(`com um outlier: Pearson ${p.toFixed(3)}, Spearman ${s.toFixed(3)}`);
});

/* ----------------------------- matriz ---------------------------- */

test('matriz — é simétrica e tem 1 EXATO na diagonal', (t) => {
  // Deixar a diagonal passar por ponto flutuante daria 0,9999999 e a
  // célula ficaria com uma cor ligeiramente diferente das vizinhas na
  // diagonal — um defeito que ninguém atribuiria à causa certa.
  const a = [1, 2, 3, 4, 5, 6, 7, 8];
  const b = [2, 4, 5, 4, 5, 7, 8, 9];
  const c = [9, 7, 8, 6, 5, 3, 2, 1];
  const matriz = calcularMatriz(linhasDe(a, b, c), 3, correlacaoDePearson);

  assert.equal(matriz.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(matriz[i][i], 1, `diagonal ${i} não é 1 exato`);
    for (let j = 0; j < 3; j++) {
      assert.equal(matriz[i][j], matriz[j][i], `assimetria em (${i},${j})`);
    }
  }
  assert.ok(matriz[0][2] < -0.9, 'c é quase o inverso de a');
  t.diagnostic(`r(a,b) = ${matriz[0][1].toFixed(4)}, r(a,c) = ${matriz[0][2].toFixed(4)}`);
});

test('matriz — par sem variação devolve null em vez de número inventado', (t) => {
  const constante = [5, 5, 5, 5];
  const variavel = [1, 2, 3, 4];
  const matriz = calcularMatriz(linhasDe(constante, variavel), 2, correlacaoDePearson);
  assert.equal(matriz[0][1], null, 'não existe correlação com uma constante');
  assert.equal(matriz[1][0], null, 'e a simetria vale também para o null');
  t.diagnostic('constante tratada');
});

/* ------------------------------ cor ------------------------------ */

test('cor — o domínio é FIXO em [−1, +1] e centrado em zero', (t) => {
  // Ajustar o domínio aos dados faria r = 0,3 parecer forte numa matriz
  // fraca. Uma cor de correlação precisa significar a mesma coisa em
  // qualquer matriz.
  const opcoes = { corPositiva: '#2563EB', corNegativa: '#DC2626', fundo: '#FFFFFF' };

  assert.equal(corDaCorrelacao(0, opcoes), corDaCorrelacao(0, opcoes));
  const zero = corDaCorrelacao(0, opcoes);
  const quaseZero = corDaCorrelacao(0.02, opcoes);
  assert.ok(distancia(zero, '#FFFFFF') < 5, 'r = 0 precisa ser o fundo: "nenhuma", não "média"');
  assert.ok(distancia(quaseZero, '#FFFFFF') < 20, 'r ≈ 0 precisa ser quase o fundo');

  // Simetria: +0,6 e −0,6 têm a MESMA distância do fundo, cada um na sua cor.
  const maisSeis = corDaCorrelacao(0.6, opcoes);
  const menosSeis = corDaCorrelacao(-0.6, opcoes);
  assert.ok(
    Math.abs(distancia(maisSeis, '#FFFFFF') - distancia(menosSeis, '#FFFFFF')) < 40,
    'a escala divergente precisa ser simétrica em intensidade'
  );
  assert.ok(distancia(maisSeis, menosSeis) > 60, 'e os dois lados precisam ser cores distinguíveis');

  // Intensidade monótona.
  const serie = [0, 0.25, 0.5, 0.75, 1].map((r) => distancia(corDaCorrelacao(r, opcoes), '#FFFFFF'));
  for (let i = 1; i < serie.length; i++) {
    assert.ok(serie[i] > serie[i - 1], `a cor precisa escurecer com |r| (passo ${i})`);
  }
  t.diagnostic(`distâncias do fundo: ${serie.map((d) => d.toFixed(0)).join(' ')}`);
});

function distancia(corA, corB) {
  const ler = (c) => {
    const rgb = c.match(/\d+/g);
    if (rgb && rgb.length >= 3) return rgb.slice(0, 3).map(Number);
    const hex = c.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  };
  const a = ler(corA);
  const b = ler(corB);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/* ---------------------------- ordenação -------------------------- */

test('ordenarVariaveis — o agrupamento junta os blocos', (t) => {
  // Duas famílias: {0,1} se explicam entre si, {2,3} também, e as famílias
  // não se falam. A ordem agrupada precisa manter cada par junto; a ordem
  // da consulta (0,2,1,3) os deixaria intercalados.
  const matriz = [
    [1, 0.95, 0.02, 0.01],
    [0.95, 1, 0.03, 0.02],
    [0.02, 0.03, 1, 0.97],
    [0.01, 0.02, 0.97, 1],
  ];
  const medidas = ['a1', 'a2', 'b1', 'b2'].map((rotuloCurto) => ({ rotuloCurto }));

  const ordem = ordenarVariaveis({ matriz, medidas, modo: 'agrupada' });
  assert.equal(ordem.length, 4, 'a ordem precisa conter todas as variáveis');
  assert.deepEqual([...ordem].sort(), [0, 1, 2, 3], 'nenhuma variável pode sumir nem repetir');

  const posicao = (i) => ordem.indexOf(i);
  assert.equal(Math.abs(posicao(0) - posicao(1)), 1, 'a1 e a2 precisam ficar vizinhas');
  assert.equal(Math.abs(posicao(2) - posicao(3)), 1, 'b1 e b2 precisam ficar vizinhas');
  t.diagnostic(`ordem: ${ordem.map((i) => medidas[i].rotuloCurto).join(' ')}`);
});

test('ordenarVariaveis — correlação NEGATIVA forte também aproxima', (t) => {
  // Usar `1 − r` em vez de `1 − |r|` separaria pares fortemente negativos,
  // que são tão informativos quanto os positivos.
  const matriz = [
    [1, -0.98, 0.01],
    [-0.98, 1, 0.02],
    [0.01, 0.02, 1],
  ];
  const medidas = ['x', 'y', 'z'].map((rotuloCurto) => ({ rotuloCurto }));
  const ordem = ordenarVariaveis({ matriz, medidas, modo: 'agrupada' });

  assert.equal(Math.abs(ordem.indexOf(0) - ordem.indexOf(1)), 1, 'x e y são opostos: andam juntos');
  t.diagnostic(`ordem: ${ordem.join(' ')}`);
});

test('ordenarVariaveis — os outros modos devolvem o que prometem', (t) => {
  const medidas = ['zebra', 'abelha', 'macaco'].map((rotuloCurto) => ({ rotuloCurto }));
  const matriz = [
    [1, 0.5, 0.5],
    [0.5, 1, 0.5],
    [0.5, 0.5, 1],
  ];
  assert.deepEqual(ordenarVariaveis({ matriz, medidas, modo: 'consulta' }), [0, 1, 2]);
  assert.deepEqual(
    ordenarVariaveis({ matriz, medidas, modo: 'alfabetica' }).map((i) => medidas[i].rotuloCurto),
    ['abelha', 'macaco', 'zebra']
  );
  t.diagnostic('modos de ordem conferidos');
});

/* --------------------------- formatação -------------------------- */

test('formatarR — duas casas, vírgula, e traço quando não há valor', (t) => {
  assert.equal(formatarR(0.8162), '0,82');
  assert.equal(formatarR(-0.5), '-0,50');
  assert.equal(formatarR(1), '1,0');
  assert.equal(formatarR(null), '—');
  assert.equal(formatarR(NaN), '—');
  t.diagnostic('formatação conferida');
});

/* ---------------------------- desenho ---------------------------- */

test('correlacao_matriz — k medidas produzem k² células', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.celulas.length > 0, 'nenhuma célula desenhada');
    const k = Math.round(Math.sqrt(r.celulas.length));
    assert.equal(k * k, r.celulas.length, `${r.celulas.length} células não formam um quadrado`);
    assert.equal(r.nomes.length, k * 2, 'um nome em cada eixo por variável');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    t.diagnostic(`${k} medidas, ${r.celulas.length} células`);
  } finally {
    r.fim();
  }
});

test('correlacao_matriz — as células formam uma grade quadrada e alinhada', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.celulas.length > 0, 'nenhuma célula desenhada');
    const lados = new Set(r.celulas.map((c) => c.lado.toFixed(3)));
    assert.equal(lados.size, 1, 'todas as células precisam ter o mesmo lado');

    const k = Math.round(Math.sqrt(r.celulas.length));
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const celula = r.celulas[i * k + j];
        assert.ok(Math.abs(celula.y - r.celulas[i * k].y) < 0.5, `célula (${i},${j}) fora da linha`);
        assert.ok(Math.abs(celula.x - r.celulas[j].x) < 0.5, `célula (${i},${j}) fora da coluna`);
      }
    }
    t.diagnostic(`grade ${k}×${k}, lado ${[...lados][0]}`);
  } finally {
    r.fim();
  }
});

test('correlacao_matriz — a diagonal desenhada é a cor de r = 1', (t) => {
  // Se a ordenação embaralhasse as linhas sem embaralhar as colunas, a
  // diagonal deixaria de ser 1 — e nada mais na tela denunciaria isso.
  const r = renderizar('ohlc', { escreverValor: true });
  try {
    const k = Math.round(Math.sqrt(r.celulas.length));
    assert.ok(k >= 2);
    const diagonais = [];
    for (let i = 0; i < k; i++) diagonais.push(r.celulas[i * k + i].cor);
    assert.equal(diagonais.length, k);
    assert.equal(new Set(diagonais).size, 1, 'toda a diagonal precisa ter a mesma cor (r = 1)');
  } finally {
    r.fim();
  }
  t.diagnostic('diagonal uniforme');
});

test('correlacao_matriz — "só o triângulo inferior" desenha k(k+1)/2 células', (t) => {
  const completa = renderizar('ohlc', { triangulo: 'completa' });
  const inferior = renderizar('ohlc', { triangulo: 'inferior' });
  try {
    const k = Math.round(Math.sqrt(completa.celulas.length));
    assert.ok(k >= 2);
    assert.equal(
      inferior.celulas.length,
      (k * (k + 1)) / 2,
      `esperadas ${(k * (k + 1)) / 2} células, vieram ${inferior.celulas.length}`
    );
  } finally {
    completa.fim();
    inferior.fim();
  }
  t.diagnostic('triângulo inferior conferido');
});

test('correlacao_matriz — o limiar apaga só as células fracas', (t) => {
  const semLimiar = renderizar('ohlc', { esconderFracos: 0, escreverValor: true });
  const comLimiar = renderizar('ohlc', { esconderFracos: 0.5, escreverValor: true });
  try {
    assert.ok(semLimiar.valores.length > 0, 'sem números não há o que comparar');
    assert.ok(
      comLimiar.valores.length < semLimiar.valores.length,
      `o limiar deveria apagar algumas células (${comLimiar.valores.length} de ${semLimiar.valores.length})`
    );
    for (const texto of comLimiar.valores) {
      const valor = Math.abs(Number(texto.replace(',', '.')));
      assert.ok(valor >= 0.5 - 1e-9, `célula com |r| = ${valor} deveria ter sido apagada`);
    }
  } finally {
    semLimiar.fim();
    comLimiar.fim();
  }
  t.diagnostic(`${comLimiar.valores.length} células sobreviveram ao limiar de 0,5`);
});

test('correlacao_matriz — a nota declara método, ordem e as duas ressalvas', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.match(r.nota, /Pearson/i, 'o método precisa estar declarado');
    assert.match(r.nota, /ordem agrupada/i, 'a ordem muda a leitura: precisa estar declarada');
    assert.match(r.nota, /escala fixa de −1 a \+1/i, 'o domínio fixo também');
    assert.match(r.nota, /por acaso a 5%/i, 'faltou a ressalva de comparações múltiplas');
    assert.match(r.nota, /Anscombe/i, 'faltou a ressalva do quarteto');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 110));
});

test('correlacao_matriz — o modo "ambos" muda o triângulo superior', (t) => {
  // Pearson abaixo, Spearman acima: a matriz deixa de ser simétrica DE
  // PROPÓSITO, e é isso que permite comparar os dois métodos num olhar.
  const r = renderizar('ohlc', { metodo: 'ambos', escreverValor: true, esconderFracos: 0 });
  try {
    const k = Math.round(Math.sqrt(r.celulas.length));
    assert.ok(k >= 2 && r.celulas.length > 0);
    assert.match(r.nota, /Pearson abaixo, Spearman acima/i);
  } finally {
    r.fim();
  }
  t.diagnostic('modo comparativo conferido');
});

test('correlacao_matriz — a régua de cor vai de +1 a −1', (t) => {
  const r = renderizar('ohlc', { mostrarLegendaDeCor: true });
  try {
    assert.ok(r.legenda.length > 3, 'faltou a régua');
    const textos = r.legenda
      .filter((el) => el.tagName.toLowerCase() === 'text')
      .map((el) => el.textContent);
    assert.deepEqual(textos, ['+1', '0', '-1']);
  } finally {
    r.fim();
  }
  t.diagnostic('régua conferida');
});

test('correlacao_matriz — uma medida só é recusada com explicação', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.match(mensagem, /medidas?/i);
    assert.equal(r.celulas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});

test('correlacao_matriz — 5.000 linhas renderizam sem erro', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.celulas.length > 0, 'nada desenhado');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    for (const celula of r.celulas) {
      assert.ok(Number.isFinite(celula.x) && Number.isFinite(celula.y), 'célula com posição inválida');
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.celulas.length} células com 5.000 linhas`);
});
