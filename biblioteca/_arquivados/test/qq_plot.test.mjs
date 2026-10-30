/**
 * qq_plot.test.mjs — testes do Q-Q Plot.
 *
 * O Q-Q plot é um instrumento de medida: se os quantis teóricos estiverem
 * errados, ele desenha uma nuvem torta sobre dados perfeitamente normais —
 * ou uma nuvem reta sobre dados que não são. Por isso os testes partem de
 * amostras cuja distribuição NÓS escolhemos, e exigem o diagnóstico certo
 * em cada uma.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { quantilNormalPadrao } from '../src/core/estatistica.js';
import {
  montarQQ,
  calcularRetaDeReferencia,
  envelopePontual,
  diagnosticarForma,
  POSICOES,
  MINIMO_PARA_FORMA,
} from '../src/charts/qq_plot/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'qq_plot.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

const obs = (valores) => valores.map((valor, i) => ({ valor, indice: i, rotulo: '' }));

/**
 * Amostra normal DETERMINÍSTICA: em vez de sortear, tomamos os quantis
 * exatos da normal nas posições de Blom. É a amostra mais normal que
 * existe para um dado n — se o gráfico acusar anormalidade aqui, o
 * problema é dele.
 */
function amostraNormalExata(n, media = 0, desvio = 1) {
  const valores = [];
  for (let i = 1; i <= n; i++) {
    const p = (i - 3 / 8) / (n + 1 / 4);
    valores.push(media + desvio * quantilNormalPadrao(p));
  }
  return valores;
}

/** Exponencial exata pelos mesmos pontos: assimetria forte à direita. */
function amostraExponencialExata(n, taxa = 1) {
  const valores = [];
  for (let i = 1; i <= n; i++) {
    const p = (i - 0.5) / n;
    valores.push(-Math.log(1 - p) / taxa);
  }
  return valores;
}

/** Uniforme exata: caudas leves (nada de extremo acontece). */
function amostraUniformeExata(n) {
  const valores = [];
  for (let i = 1; i <= n; i++) valores.push((i - 0.5) / n);
  return valores;
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.qq_plot;
  assert.ok(definicao, 'qq_plot não se registrou');

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
    pontos: Array.from(palco.querySelectorAll('circle.qq-marca')),
    reta: palco.querySelector('line.qq-reta'),
    envelope: palco.querySelector('path.qq-envelope'),
    caixa: palco.querySelector('.qq-caixa')?.textContent || '',
    nota: palco.querySelector('.qq-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    canvas: palco.querySelector('canvas.qq-canvas'),
    fim: () => amb.restaurar(),
  };
}

/* ---------------------- posições de plotagem --------------------- */

test('montarQQ — nenhuma posição de plotagem chega a p = 0 ou p = 1', (t) => {
  // É a razão de as fórmulas existirem: com i/n o maior valor teria
  // quantil normal infinito e o ponto sumiria do gráfico.
  for (const nome of Object.keys(POSICOES)) {
    const pontos = montarQQ(obs([1, 2, 3, 4, 5]), nome);
    for (const p of pontos) {
      assert.ok(p.p > 0 && p.p < 1, `${nome}: p = ${p.p} fora de (0,1)`);
      assert.ok(Number.isFinite(p.z), `${nome}: quantil teórico não finito`);
    }
  }
  t.diagnostic('três fórmulas, nenhuma com p degenerado');
});

test('montarQQ — Blom e Hazen batem com a fórmula, na mão', (t) => {
  const blom = montarQQ(obs([10, 20, 30, 40]), 'blom');
  // (1 − 3/8) / (4 + 1/4) = 0,625 / 4,25
  perto(blom[0].p, 0.625 / 4.25, 1e-12);
  perto(blom[0].z, quantilNormalPadrao(0.625 / 4.25), 1e-12);

  const hazen = montarQQ(obs([10, 20, 30, 40]), 'hazen');
  perto(hazen[0].p, 0.5 / 4, 1e-12);
  perto(hazen[3].p, 3.5 / 4, 1e-12);
  t.diagnostic('posições conferidas contra a fórmula');
});

test('montarQQ — ordena os valores e é simétrica em torno do meio', (t) => {
  const pontos = montarQQ(obs([50, 10, 30, 20, 40]), 'blom');
  assert.deepEqual(pontos.map((p) => p.valor), [10, 20, 30, 40, 50]);
  assert.deepEqual(pontos.map((p) => p.ordem), [1, 2, 3, 4, 5]);
  perto(pontos[2].z, 0, 1e-12, 'o valor do meio é o quantil 50%');
  perto(pontos[0].z, -pontos[4].z, 1e-12);
  t.diagnostic('ordem e simetria conferidas');
});

/* -------------------- reta e amostra normal ---------------------- */

test('reta — numa normal exata, os pontos ficam EM CIMA da reta', (t) => {
  // O teste central: se os quantis teóricos estiverem certos, a amostra
  // construída a partir deles tem de cair exatamente na reta.
  const pontos = montarQQ(obs(amostraNormalExata(60, 100, 15)), 'blom');
  const reta = calcularRetaDeReferencia(pontos, 'momentos');

  let maiorDesvio = 0;
  for (const p of pontos) {
    maiorDesvio = Math.max(maiorDesvio, Math.abs(p.valor - reta.previsto(p.z)));
  }
  assert.ok(maiorDesvio < 0.6, `desvio máximo de ${maiorDesvio.toFixed(3)} em σ = 15`);
  perto(reta.inclinacao, 15, 0.6);
  perto(reta.intercepto, 100, 0.3);
  t.diagnostic(`desvio máximo ${maiorDesvio.toFixed(4)} (σ = 15)`);
});

test('reta — a robusta ignora o outlier que a dos momentos engole', (t) => {
  // Com um outlier gigante, a reta por média/desvio gira e a nuvem inteira
  // parece torta. É o motivo de a robusta ser o padrão.
  const valores = amostraNormalExata(40, 100, 10);
  valores.push(100000);
  const pontos = montarQQ(obs(valores), 'blom');

  const porMomentos = calcularRetaDeReferencia(pontos, 'momentos');
  const porQuartis = calcularRetaDeReferencia(pontos, 'quartis');

  assert.ok(
    porMomentos.inclinacao > porQuartis.inclinacao * 10,
    `a reta por momentos deveria estar muito mais inclinada: ${porMomentos.inclinacao.toFixed(0)} vs ${porQuartis.inclinacao.toFixed(1)}`
  );
  perto(porQuartis.inclinacao, 10, 1.5);
  t.diagnostic(
    `inclinação: momentos ${porMomentos.inclinacao.toFixed(0)} × quartis ${porQuartis.inclinacao.toFixed(2)}`
  );
});

test('reta — quartis idênticos caem para os momentos em vez de ficar horizontal', (t) => {
  // Mais da metade dos valores repetidos: a reta robusta seria horizontal
  // e não serviria de referência nenhuma.
  const valores = [1, 2, 3, 3, 3, 3, 3, 3, 3, 4, 5];
  const pontos = montarQQ(obs(valores), 'blom');
  const reta = calcularRetaDeReferencia(pontos, 'quartis');
  assert.equal(reta.modo, 'momentos', 'deveria ter caído para os momentos');
  assert.ok(reta.inclinacao > 0, 'e a reta não pode ser horizontal');
  t.diagnostic('degeneração tratada');
});

/* --------------------------- envelope ---------------------------- */

test('envelope — é uma ampulheta: estreito no meio, largo nas pontas', (t) => {
  // O erro-padrão do i-ésimo valor ordenado divide pela densidade normal,
  // que é pequena nas caudas. Um envelope de largura constante denunciaria
  // que a fórmula foi simplificada errado.
  const pontos = montarQQ(obs(amostraNormalExata(101, 0, 1)), 'blom');
  const reta = calcularRetaDeReferencia(pontos, 'momentos');
  const envelope = envelopePontual(pontos, reta);

  const meio = envelope[50].erro;
  assert.ok(envelope[0].erro > meio * 2, 'a ponta esquerda precisa ser bem mais larga');
  assert.ok(envelope[100].erro > meio * 2, 'a direita também');
  t.diagnostic(`erro: meio ${meio.toFixed(4)}, pontas ${envelope[0].erro.toFixed(4)}`);
});

test('envelope — numa normal exata quase nada fica de fora', (t) => {
  const pontos = montarQQ(obs(amostraNormalExata(100, 0, 1)), 'blom');
  const reta = calcularRetaDeReferencia(pontos, 'momentos');
  const envelope = envelopePontual(pontos, reta);

  const fora = pontos.filter((p, i) => p.valor > envelope[i].superior || p.valor < envelope[i].inferior);
  assert.equal(fora.length, 0, `${fora.length} pontos fora do envelope numa amostra normal exata`);
  t.diagnostic('nenhum ponto fora, como esperado');
});

test('envelope — acompanha a escala dos dados', (t) => {
  // Multiplicar tudo por 1000 tem de multiplicar o envelope por 1000. Se
  // não acompanhasse, a largura seria lida como "desvio enorme".
  const pequeno = montarQQ(obs(amostraNormalExata(50, 0, 1)), 'blom');
  const grande = montarQQ(obs(amostraNormalExata(50, 0, 1000)), 'blom');

  const e1 = envelopePontual(pequeno, calcularRetaDeReferencia(pequeno, 'momentos'));
  const e2 = envelopePontual(grande, calcularRetaDeReferencia(grande, 'momentos'));

  perto(e2[10].erro / e1[10].erro, 1000, 1);
  t.diagnostic('envelope proporcional à escala');
});

/* -------------------------- diagnóstico -------------------------- */

test('diagnóstico — normal exata é declarada compatível', (t) => {
  const pontos = montarQQ(obs(amostraNormalExata(100, 50, 8)), 'blom');
  const d = diagnosticarForma(pontos, calcularRetaDeReferencia(pontos, 'quartis'));
  assert.equal(d.forma, 'normal', `diagnosticou "${d.titulo}" numa normal exata`);
  t.diagnostic(`${d.titulo} (alta ${d.alta.toFixed(2)}σ, baixa ${d.baixa.toFixed(2)}σ)`);
});

test('diagnóstico — exponencial é assimetria à direita', (t) => {
  const pontos = montarQQ(obs(amostraExponencialExata(200)), 'blom');
  const d = diagnosticarForma(pontos, calcularRetaDeReferencia(pontos, 'quartis'));
  assert.equal(d.forma, 'assimetriaDireita', `diagnosticou "${d.titulo}"`);
  assert.match(d.explicacao, /log/i, 'a explicação precisa apontar o que fazer');
  t.diagnostic(`${d.titulo} (alta ${d.alta.toFixed(2)}σ, baixa ${d.baixa.toFixed(2)}σ)`);
});

test('diagnóstico — uniforme é caudas leves', (t) => {
  // Numa uniforme nada extremo acontece: as pontas ficam mais contidas do
  // que a normal prevê, e a curva fica em S invertido.
  const pontos = montarQQ(obs(amostraUniformeExata(200)), 'blom');
  const d = diagnosticarForma(pontos, calcularRetaDeReferencia(pontos, 'quartis'));
  assert.equal(d.forma, 'caudasLeves', `diagnosticou "${d.titulo}"`);
  t.diagnostic(`${d.titulo} (alta ${d.alta.toFixed(2)}σ, baixa ${d.baixa.toFixed(2)}σ)`);
});

test('diagnóstico — mistura com extremos é caudas pesadas', (t) => {
  // Normal no miolo, com alguns valores muito afastados dos DOIS lados.
  const valores = amostraNormalExata(120, 0, 1);
  for (const extremo of [-9, -8, -7.5, 7.5, 8, 9]) valores.push(extremo);
  const pontos = montarQQ(obs(valores), 'blom');
  const d = diagnosticarForma(pontos, calcularRetaDeReferencia(pontos, 'quartis'));

  assert.equal(d.forma, 'caudasPesadas', `diagnosticou "${d.titulo}"`);
  t.diagnostic(`${d.titulo} (alta ${d.alta.toFixed(2)}σ, baixa ${d.baixa.toFixed(2)}σ)`);
});

test('diagnóstico — poucos pontos não produzem diagnóstico', (t) => {
  // Com n pequeno a nuvem fica torta por acaso mesmo em dados normais.
  const pontos = montarQQ(obs(amostraNormalExata(MINIMO_PARA_FORMA - 1)), 'blom');
  assert.equal(diagnosticarForma(pontos, calcularRetaDeReferencia(pontos, 'quartis')), null);
  t.diagnostic('null em vez de diagnóstico de ruído');
});

/* ---------------------------- desenho ---------------------------- */

test('qq_plot — desenha nuvem, reta, envelope e a caixa com o n', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.pontos.length > 0, 'nenhum ponto');
    assert.ok(r.reta, 'faltou a reta de referência');
    assert.ok(r.envelope, 'faltou o envelope');
    assert.match(r.caixa, /n = \d+/, `a caixa precisa trazer o n; veio "${r.caixa}"`);
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(r.caixa.slice(0, 70));
});

test('qq_plot — a nota declara a posição de plotagem e o tipo de reta', (t) => {
  // Métodos diferentes movem as caudas, que é onde o gráfico é lido.
  const r = renderizar('grande5k');
  try {
    assert.match(r.nota, /Blom/i, 'a posição de plotagem precisa estar declarada');
    assert.match(r.nota, /quartis|média/i, 'o tipo de reta também');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 80));
});

test('qq_plot — o envelope se declara PONTUAL', (t) => {
  // Lê-lo como banda simultânea é o erro clássico: alguns pontos fora são
  // esperados, e sem o aviso cada um deles vira "anormalidade".
  const r = renderizar('grande5k');
  try {
    assert.match(r.nota, /PONTUAL/);
    assert.match(r.nota, /não simultâneo/i);
    assert.match(r.caixa, /esperados por acaso/i, 'a caixa precisa dar o número esperado');
  } finally {
    r.fim();
  }
  t.diagnostic('ressalva do envelope conferida');
});

test('qq_plot — muitos pontos caem para canvas', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.equal(r.pontos.length, 0, 'acima de 2.000 pontos o SVG não deveria ser usado');
    assert.ok(r.canvas, 'sem SVG e sem canvas: os pontos sumiram');
    assert.match(r.nota, /canvas/i);
  } finally {
    r.fim();
  }
  t.diagnostic('canvas acionado');
});

test('qq_plot — eixo em desvios-padrão não muda a nuvem, só a escala', (t) => {
  // Padronizar o Y é mudança de unidade. Se a NUVEM mudasse de forma, a
  // conversão estaria errada em algum lugar.
  //
  // Comparar os pixels crus não serve: trocar "1.250.000" por "2,1 σ" nos
  // rótulos muda a margem esquerda e portanto a largura da área. O que tem
  // de ser idêntico é a posição RELATIVA dentro da área.
  const relativo = (pontos, atributo) => {
    const valores = pontos.map((c) => Number(c.getAttribute(atributo)));
    const minimo = Math.min(...valores);
    const extensao = Math.max(...valores) - minimo || 1;
    return valores.map((v) => ((v - minimo) / extensao).toFixed(4));
  };

  const normal = renderizar('semPivo');
  const padronizado = renderizar('semPivo', { padronizarEixoY: true });
  try {
    assert.equal(padronizado.pontos.length, normal.pontos.length);
    assert.deepEqual(
      relativo(padronizado.pontos, 'cx'),
      relativo(normal.pontos, 'cx'),
      'os quantis teóricos não dependem da unidade do Y'
    );
    assert.deepEqual(
      relativo(padronizado.pontos, 'cy'),
      relativo(normal.pontos, 'cy'),
      'padronizar é transformação afim: a forma da nuvem não pode mudar'
    );
  } finally {
    normal.fim();
    padronizado.fim();
  }
  t.diagnostic('padronização conferida');
});

test('qq_plot — consulta agregada demais explica o que fazer no Explore', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.pontos.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
