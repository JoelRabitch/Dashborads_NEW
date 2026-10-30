/**
 * heatmap_denso.test.mjs — testes do Heatmap Denso.
 *
 * O defeito característico de um heatmap é a grade transposta: linhas e
 * colunas trocadas, ou um deslocamento de um índice. O mapa continua
 * bonito, colorido e completamente errado — e nada na tela denuncia. Então
 * o teste central é **a célula (i, j) contém o valor de (linha i,
 * coluna j)**, conferido contra os dados brutos da fixture.
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
  lerGrade,
  montarEscalaDeCor,
  posicaoNoOrdenado,
  saltoPorEspaco,
} from '../src/charts/heatmap_denso/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'heatmap_denso.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

/** Contexto mínimo para exercitar `lerGrade` sem passar pelo defineViz. */
function contextoDe(nomeDaFixture, config = {}) {
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  const avisos = [];
  return {
    modelo: construirModelo(data, queryResponse, {}),
    config,
    avisar: (m) => avisos.push(m),
    avisos,
    dadosBrutos: data,
  };
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.heatmap_denso;
  assert.ok(definicao, 'heatmap_denso não se registrou');

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
    celulas: Array.from(palco.querySelectorAll('rect.hd-celula')).map((r) => ({
      x: Number(r.getAttribute('x')),
      y: Number(r.getAttribute('y')),
      largura: Number(r.getAttribute('width')),
      altura: Number(r.getAttribute('height')),
      cor: r.getAttribute('fill'),
    })),
    rotulos: Array.from(palco.querySelectorAll('.hd-rotulo')).map((t) => t.textContent),
    legenda: Array.from(palco.querySelectorAll('.hd-legenda')),
    nota: palco.querySelector('.hd-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    canvas: palco.querySelector('canvas.hd-canvas'),
    fim: () => amb.restaurar(),
  };
}

/* ----------------------------- a grade --------------------------- */

test('lerGrade — a célula (i,j) traz o valor da linha i e da coluna j', (t) => {
  // O teste que pega grade transposta ou deslocada de um índice. Confere
  // CADA célula preenchida contra os dados brutos da fixture.
  const ctx = contextoDe('duasDimensoes');
  const grade = lerGrade(ctx);
  assert.ok(!grade.erro, `lerGrade falhou: ${grade.erro}`);
  assert.ok(grade.linhas.length > 0 && grade.colunas.length > 0);

  const campoDaLinha = grade.campoDaLinha.nome;
  const campoDaColuna = ctx.modelo.dimensoes.find((d) => d.nome !== campoDaLinha).nome;
  const medida = grade.medida.nome;

  // Mapa de referência montado direto dos dados brutos, por outro caminho.
  const esperado = new Map();
  for (const linha of ctx.dadosBrutos) {
    const chave = `${linha[campoDaLinha].value}|${linha[campoDaColuna].value}`;
    esperado.set(chave, linha[medida].value);
  }

  let conferidas = 0;
  for (let i = 0; i < grade.linhas.length; i++) {
    for (let j = 0; j < grade.colunas.length; j++) {
      const v = grade.valores[i * grade.colunas.length + j];
      const chave = `${grade.linhas[i].chave}|${grade.colunas[j].chave}`;
      const alvo = esperado.get(chave);

      if (Number.isNaN(v)) {
        assert.ok(
          alvo === undefined || alvo === null,
          `célula (${i},${j}) está vazia mas os dados têm ${alvo}`
        );
        continue;
      }
      perto(v, Number(alvo), 1e-9);
      conferidas += 1;
    }
  }
  assert.ok(conferidas > 0, 'nenhuma célula preenchida — o teste não conferiu nada');
  t.diagnostic(`${conferidas} células conferidas contra os dados brutos`);
});

test('lerGrade — ausência fica NaN, não zero', (t) => {
  // Zero é uma afirmação sobre o dado; NaN é "não sei". Trocar um pelo
  // outro faz o mapa inventar valores baixos onde não há informação.
  const ctx = contextoDe('duasDimensoes');
  const grade = lerGrade(ctx);
  assert.ok(!grade.erro);

  const total = grade.linhas.length * grade.colunas.length;
  let vazias = 0;
  for (let k = 0; k < total; k++) if (Number.isNaN(grade.valores[k])) vazias += 1;

  assert.equal(vazias, grade.ausentes, 'a contagem de ausentes precisa bater com os NaN');
  t.diagnostic(`${grade.ausentes} de ${total} células sem dado`);
});

test('lerGrade — o pivô vira as colunas', (t) => {
  const ctx = contextoDe('comPivo');
  const grade = lerGrade(ctx);
  assert.ok(!grade.erro, `lerGrade falhou: ${grade.erro}`);
  assert.ok(grade.colunas.length > 1, 'o pivô precisa produzir mais de uma coluna');
  assert.equal(grade.rotuloDaColuna, 'Pivô');
  assert.equal(
    grade.colunas.length,
    ctx.modelo.pivotsDeDados.length,
    'uma coluna por chave de pivô (sem o total de linha)'
  );
  t.diagnostic(`${grade.linhas.length} × ${grade.colunas.length} a partir do pivô`);
});

test('lerGrade — uma dimensão só e sem pivô é recusado com instrução', (t) => {
  const ctx = contextoDe('semPivo');
  const grade = lerGrade(ctx);
  assert.ok(grade.erro, 'um heatmap cruza duas dimensões');
  assert.match(grade.erro, /segunda dimensão|pivote/i, 'a mensagem precisa dizer o que fazer');
  t.diagnostic(grade.erro.slice(0, 70));
});

test('lerGrade — grade grande demais é recusada em vez de travar', (t) => {
  const ctx = contextoDe('grande5k', { maximoDeLinhas: 2000, maximoDeColunas: 2000 });
  const grade = lerGrade(ctx);
  if (grade.erro) {
    assert.match(grade.erro, /limite|células/i);
    t.diagnostic(grade.erro.slice(0, 80));
  } else {
    assert.ok(
      grade.linhas.length * grade.colunas.length <= 400000,
      'a grade passou do teto sem ser recusada'
    );
    t.diagnostic(`${grade.linhas.length} × ${grade.colunas.length} dentro do teto`);
  }
});

test('lerGrade — o teto de linhas e colunas é respeitado e anunciado', (t) => {
  const ctx = contextoDe('grande5k', { maximoDeLinhas: 10, maximoDeColunas: 4 });
  const grade = lerGrade(ctx);
  assert.ok(!grade.erro, `lerGrade falhou: ${grade.erro}`);
  assert.ok(grade.linhas.length <= 10, `${grade.linhas.length} linhas passaram do teto`);
  assert.ok(grade.colunas.length <= 4, `${grade.colunas.length} colunas passaram do teto`);
  assert.ok(ctx.avisos.length > 0, 'o corte precisa ser anunciado');
  t.diagnostic(ctx.avisos[0].slice(0, 70));
});

/* ---------------------------- a escala --------------------------- */

const gradeDe = (lista) => Float64Array.from(lista);

test('escala linear — mínimo e máximo nas pontas, meio no meio', (t) => {
  const escala = montarEscalaDeCor({
    valores: gradeDe([0, 50, 100]),
    config: { modoDaEscala: 'linear', escalaDeCor: 'viridis' },
  });
  assert.equal(escala.minimo, 0);
  assert.equal(escala.maximo, 100);
  assert.notEqual(escala.cor(0), escala.cor(100), 'as pontas precisam ser cores distintas');
  assert.match(escala.descricao, /distâncias de cor/i);
  t.diagnostic(escala.descricao.slice(0, 60));
});

test('escala divergente — o domínio é SIMÉTRICO em torno de zero', (t) => {
  // É o erro mais comum do gênero: com domínio assimétrico, a cor do meio
  // deixa de ser o zero e a virada de sinal aparece no lugar errado.
  const escala = montarEscalaDeCor({
    valores: gradeDe([-10, 0, 90]),
    config: { modoDaEscala: 'divergente', escalaDeCor: 'vermelhoAzul' },
  });
  assert.equal(escala.minimo, -90, 'o lado negativo precisa acompanhar o positivo');
  assert.equal(escala.maximo, 90);

  // Zero cai exatamente no centro da paleta.
  const centro = escala.cor(0);
  const meioDaPaleta = escala.cor((escala.minimo + escala.maximo) / 2);
  assert.equal(centro, meioDaPaleta, 'zero precisa ser a cor central');

  // Simetria: +x e −x ficam à mesma distância do centro.
  assert.notEqual(escala.cor(45), escala.cor(-45));
  t.diagnostic(`domínio [${escala.minimo}, ${escala.maximo}] com zero no centro`);
});

test('escala divergente — avisa quando a paleta escolhida não é divergente', (t) => {
  const escala = montarEscalaDeCor({
    valores: gradeDe([-5, 0, 5]),
    config: { modoDaEscala: 'divergente', escalaDeCor: 'viridis' },
  });
  assert.match(escala.descricao, /não é divergente/i, 'a incompatibilidade precisa ser dita');
  t.diagnostic(escala.descricao.slice(-50));
});

test('escala por quantil — preserva a ORDEM e declara a distorção', (t) => {
  // O ponto da escala por quantil: ela revela estrutura que a linear
  // esmaga, ao custo de distorcer as distâncias. O que não pode é inverter
  // a ordem — isso tornaria o mapa simplesmente falso.
  const valores = [1, 2, 3, 4, 5, 1000000];
  const escala = montarEscalaDeCor({
    valores: gradeDe(valores),
    config: { modoDaEscala: 'quantil', escalaDeCor: 'viridis' },
  });

  const posicoes = valores.map((v) => posicaoNoOrdenado([...valores].sort((a, b) => a - b), v));
  assert.ok(posicoes.length > 0);
  for (let i = 1; i < posicoes.length; i++) {
    assert.ok(posicoes[i] > posicoes[i - 1], `a ordem quebrou entre ${valores[i - 1]} e ${valores[i]}`);
  }

  // E a distorção existe mesmo: 1 → 2 anda tanto quanto 5 → 1.000.000.
  perto(posicoes[1] - posicoes[0], posicoes[5] - posicoes[4], 1e-12);

  assert.match(escala.descricao, /QUANTIL/);
  assert.match(escala.descricao, /ordens de grandeza/i, 'a distorção precisa estar declarada');
  t.diagnostic(`posições: ${posicoes.map((p) => p.toFixed(2)).join(' ')}`);
});

test('posicaoNoOrdenado — bate com a contagem direta', (t) => {
  const ordenados = [10, 20, 20, 30, 40];
  perto(posicaoNoOrdenado(ordenados, 5), -0.25, 1e-12);
  perto(posicaoNoOrdenado(ordenados, 10), 0, 1e-12);
  perto(posicaoNoOrdenado(ordenados, 20), 0.5, 1e-12);
  perto(posicaoNoOrdenado(ordenados, 40), 1, 1e-12);
  perto(posicaoNoOrdenado(ordenados, 99), 1, 1e-12);
  t.diagnostic('cinco posições conferidas');
});

test('saltoPorEspaco — pula o bastante para os rótulos caberem', (t) => {
  assert.equal(saltoPorEspaco(100, 20, 12), 1, 'cabendo, não pula nada');
  assert.equal(saltoPorEspaco(100, 2, 12), 6, '2px por célula e 12px por rótulo: de 6 em 6');
  assert.equal(saltoPorEspaco(100, 0, 12), 100, 'sem espaço nenhum, não desenha o meio');
  t.diagnostic('desbaste conferido');
});

/* ---------------------------- desenho ---------------------------- */

test('heatmap_denso — grade pequena desenha uma célula por combinação', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.celulas.length > 0, 'nenhuma célula desenhada');

    const ctx = contextoDe('duasDimensoes');
    const grade = lerGrade(ctx);
    assert.equal(
      r.celulas.length,
      grade.linhas.length * grade.colunas.length,
      'uma célula por combinação, inclusive as vazias'
    );
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    t.diagnostic(`${grade.linhas.length} × ${grade.colunas.length} células`);
  } finally {
    r.fim();
  }
});

test('heatmap_denso — as células formam uma grade alinhada e sem buracos', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.celulas.length > 0, 'nenhuma célula desenhada');

    const larguras = new Set(r.celulas.map((c) => c.largura.toFixed(3)));
    const alturas = new Set(r.celulas.map((c) => c.altura.toFixed(3)));
    assert.equal(larguras.size, 1, 'todas as células precisam ter a mesma largura');
    assert.equal(alturas.size, 1, 'e a mesma altura');

    const colunas = new Set(r.celulas.map((c) => c.x.toFixed(2)));
    const linhas = new Set(r.celulas.map((c) => c.y.toFixed(2)));
    assert.equal(
      r.celulas.length,
      colunas.size * linhas.size,
      'as posições precisam formar um produto cartesiano completo'
    );
    t.diagnostic(`${linhas.size} linhas × ${colunas.size} colunas alinhadas`);
  } finally {
    r.fim();
  }
});

test('heatmap_denso — células sem dado têm cor própria, distinta das com dado', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.celulas.length > 0);
    const ctx = contextoDe('duasDimensoes');
    const grade = lerGrade(ctx);

    if (grade.ausentes > 0) {
      // As células saem na mesma ordem da grade (linha por linha), então o
      // índice do retângulo é o índice do valor.
      const semDado = new Set();
      const comDado = new Set();
      for (let k = 0; k < grade.valores.length; k++) {
        (Number.isNaN(grade.valores[k]) ? semDado : comDado).add(r.celulas[k].cor);
      }
      assert.equal(semDado.size, 1, 'todas as células sem dado precisam ter a MESMA cor');
      const [corDaAusencia] = [...semDado];
      assert.ok(
        !comDado.has(corDaAusencia),
        'a cor da ausência não pode coincidir com a de nenhum valor real'
      );
      assert.match(r.nota, /sem dado/i, 'a ausência precisa estar declarada na nota');
      t.diagnostic(`${grade.ausentes} células sem dado, cor ${corDaAusencia}`);
    } else {
      assert.ok(!/sem dado/i.test(r.nota), 'sem ausências, não pode haver menção a elas');
      t.diagnostic('esta fixture não tem combinações faltando');
    }
  } finally {
    r.fim();
  }
});

test('heatmap_denso — a nota declara o tamanho da grade e o modo da escala', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.match(r.nota, /\d+ × \d+ = [\d.]+ células/, `nota sem o tamanho: "${r.nota}"`);
    assert.match(r.nota, /escala linear/i, 'o modo da escala precisa estar declarado');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 90));
});

test('heatmap_denso — o modo quantil declara a distorção na tela', (t) => {
  const r = renderizar('duasDimensoes', { modoDaEscala: 'quantil' });
  try {
    assert.match(r.nota, /QUANTIL/);
    assert.match(r.nota, /ordens de grandeza/i);
  } finally {
    r.fim();
  }
  t.diagnostic('ressalva do quantil conferida');
});

test('heatmap_denso — grade densa cai para canvas, num canvas só', (t) => {
  // 2.000 produtos × 5 regiões = 10.000 células, bem acima do limite de SVG.
  const r = renderizar('grande5k', { maximoDeLinhas: 2000, maximoDeColunas: 50 });
  try {
    assert.equal(r.celulas.length, 0, 'com essa densidade o SVG não deveria ser usado');
    assert.ok(r.canvas, 'faltou o canvas');
    assert.equal(
      r.palco.querySelectorAll('canvas.hd-canvas').length,
      1,
      'precisa ser UM canvas para o mapa inteiro'
    );
    assert.match(r.nota, /canvas/i, 'a troca de técnica precisa estar declarada');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('canvas único conferido');
});

test('heatmap_denso — a grade some quando a célula fica pequena demais', (t) => {
  // Desenhá-la comeria a própria célula e o mapa escureceria por inteiro.
  const r = renderizar('grande5k', { maximoDeLinhas: 400, maximoDeColunas: 400, mostrarGrade: true });
  try {
    assert.match(r.nota, /grade omitida/i, 'a omissão precisa ser declarada');
  } finally {
    r.fim();
  }
  t.diagnostic('omissão da grade declarada');
});

test('heatmap_denso — os rótulos são desbastados em vez de sobrepostos', (t) => {
  const r = renderizar('grande5k', { maximoDeLinhas: 300, maximoDeColunas: 30 });
  try {
    assert.ok(r.rotulos.length > 0, 'nenhum rótulo');
    assert.ok(
      r.rotulos.length < 330,
      `300 linhas + 30 colunas não cabem como ${r.rotulos.length} rótulos`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.rotulos.length} rótulos desenhados`);
});

test('heatmap_denso — consulta sem a segunda dimensão explica o que fazer', (t) => {
  const r = renderizar('semPivo');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.celulas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
