/**
 * matriz_dispersao.test.mjs — testes da Matriz de Dispersão (SPLOM).
 *
 * O erro característico de um SPLOM é invisível: trocar os eixos de um
 * painel. A nuvem continua lá, bonita, e passa a descrever o par errado.
 * Então o teste central aqui não é "desenhou", é **o painel (i, j) usa
 * mesmo a medida j no X e a medida i no Y** — conferido comparando as
 * posições dos pontos com as do painel transposto, que tem de ser o
 * espelho exato em torno da diagonal.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { celulaEm } from '../src/charts/matriz_dispersao/index.js';
import { correlacaoDePearson } from '../src/core/estatistica.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'matriz_dispersao.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.matriz_dispersao;
  assert.ok(definicao, 'matriz_dispersao não se registrou');

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

  const paineis = Array.from(palco.querySelectorAll('rect.md-grade'));
  return {
    amb,
    palco,
    paineis,
    pontos: Array.from(palco.querySelectorAll('circle.dr-marca')).map((c) => ({
      x: Number(c.getAttribute('cx')),
      y: Number(c.getAttribute('cy')),
    })),
    nomes: Array.from(palco.querySelectorAll('.md-nome')).map((t) => t.textContent),
    correlacoes: Array.from(palco.querySelectorAll('text.md-r')).map((t) => t.textContent),
    densidades: Array.from(palco.querySelectorAll('.md-densidade')),
    nota: palco.querySelector('.dr-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    canvas: palco.querySelector('canvas.dr-canvas'),
    fim: () => amb.restaurar(),
  };
}

/** Caixas dos painéis, em ordem de leitura (linha por linha). */
function caixas(r) {
  return r.paineis.map((p) => ({
    x: Number(p.getAttribute('x')),
    y: Number(p.getAttribute('y')),
    largura: Number(p.getAttribute('width')),
    altura: Number(p.getAttribute('height')),
  }));
}

const dentro = (ponto, caixa) =>
  ponto.x >= caixa.x - 1 &&
  ponto.x <= caixa.x + caixa.largura + 1 &&
  ponto.y >= caixa.y - 1 &&
  ponto.y <= caixa.y + caixa.altura + 1;

/* ---------------------------- geometria -------------------------- */

test('celulaEm — localiza o painel e devolve null fora da grade', (t) => {
  const grade = { k: 3, margemEsquerda: 50, margemDeCima: 10, ladoX: 100, ladoY: 80, espaco: 4 };

  assert.deepEqual(celulaEm({ x: 60, y: 20, ...grade }), { i: 0, j: 0 });
  assert.deepEqual(celulaEm({ x: 60 + 104, y: 20 + 84, ...grade }), { i: 1, j: 1 });
  assert.deepEqual(celulaEm({ x: 60 + 208, y: 20, ...grade }), { i: 0, j: 2 });
  assert.equal(celulaEm({ x: 10, y: 20, ...grade }), null, 'à esquerda da grade');
  assert.equal(celulaEm({ x: 60, y: 5, ...grade }), null, 'acima da grade');
  assert.equal(celulaEm({ x: 60 + 400, y: 20, ...grade }), null, 'à direita da grade');
  t.diagnostic('seis posições conferidas');
});

/* ------------------------- estrutura ----------------------------- */

test('matriz_dispersao — k medidas produzem k² painéis', (t) => {
  const r = renderizar('ohlc');
  try {
    const total = r.paineis.length;
    const k = Math.round(Math.sqrt(total));
    assert.equal(k * k, total, `${total} painéis não formam uma matriz quadrada`);
    assert.ok(k >= 2, 'faltaram medidas na matriz');
    assert.equal(r.nomes.length, k, 'a diagonal precisa de um nome por medida');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    t.diagnostic(`${k} medidas, ${total} painéis`);
  } finally {
    r.fim();
  }
});

test('matriz_dispersao — os painéis formam uma grade alinhada', (t) => {
  const r = renderizar('ohlc');
  try {
    const lista = caixas(r);
    const k = Math.round(Math.sqrt(lista.length));

    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const caixa = lista[i * k + j];
        // Mesma linha ⇒ mesmo y; mesma coluna ⇒ mesmo x.
        assert.ok(Math.abs(caixa.y - lista[i * k].y) < 0.5, `painel (${i},${j}) fora da linha`);
        assert.ok(Math.abs(caixa.x - lista[j].x) < 0.5, `painel (${i},${j}) fora da coluna`);
      }
    }
    t.diagnostic(`grade ${k}×${k} alinhada`);
  } finally {
    r.fim();
  }
});

test('matriz_dispersao — o painel (i,j) é o espelho exato do painel (j,i)', (t) => {
  // ESTE é o teste que pega eixos trocados. Com os dois triângulos
  // desenhados, o painel transposto tem de ser o mesmo conjunto de pontos
  // com x e y trocados — relativamente à própria caixa. Se algum painel
  // usasse a medida errada em um dos eixos, o espelho quebraria e nada na
  // tela denunciaria isso.
  // Três medidas de propósito: com cinco, os 2.400 pontos cairiam no
  // canvas e o teste passaria sem conferir nada (foi o que aconteceu na
  // primeira versão — 0 pares conferidos, tudo verde).
  const r = renderizar('ohlc', {
    trianguloSuperior: 'dispersao',
    tamanhoDoPonto: 3,
    maximoDeMedidas: 3,
  });
  try {
    const lista = caixas(r);
    const k = Math.round(Math.sqrt(lista.length));
    assert.equal(k, 3);
    assert.ok(r.pontos.length > 0, 'sem pontos em SVG não há o que conferir');

    const doPainel = (caixa) =>
      r.pontos
        .filter((p) => dentro(p, caixa))
        .map((p) => ({
          u: (p.x - caixa.x) / caixa.largura,
          v: (p.y - caixa.y) / caixa.altura,
        }));

    let conferidos = 0;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const baixo = doPainel(lista[j * k + i]); // (j, i) — triângulo inferior
        const cima = doPainel(lista[i * k + j]); // (i, j) — espelho

        assert.equal(baixo.length, cima.length, `(${i},${j}): contagens diferentes`);
        if (!baixo.length) continue;

        // Espelhar: em (i,j) o eixo X é a medida j e o Y é a medida i;
        // em (j,i) é o contrário. Como o Y da tela cresce para baixo, o v
        // de um é o complemento do u do outro.
        const chave = (p) => `${p.u.toFixed(3)}|${p.v.toFixed(3)}`;
        const esperado = new Set(cima.map((p) => chave({ u: 1 - p.v, v: 1 - p.u })));
        const faltando = baixo.filter((p) => !esperado.has(chave(p)));

        assert.ok(
          faltando.length <= baixo.length * 0.02,
          `(${i},${j}): ${faltando.length} de ${baixo.length} pontos não batem com o espelho`
        );
        conferidos += 1;
      }
    }
    assert.equal(conferidos, 3, 'com 3 medidas são 3 pares a conferir');
    t.diagnostic(`${conferidos} pares conferidos contra o espelho`);
  } finally {
    r.fim();
  }
});

test('matriz_dispersao — nenhum ponto cai fora do próprio painel', (t) => {
  // Um ponto desenhado na célula vizinha é lido como dado do outro par.
  const r = renderizar('ohlc', { trianguloSuperior: 'dispersao', maximoDeMedidas: 3 });
  try {
    const lista = caixas(r);
    assert.ok(r.pontos.length > 0, 'sem pontos em SVG o teste não confere nada');
    for (const ponto of r.pontos) {
      assert.ok(
        lista.some((caixa) => dentro(ponto, caixa)),
        `ponto em (${ponto.x.toFixed(1)}, ${ponto.y.toFixed(1)}) não está em painel nenhum`
      );
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.pontos.length} pontos, todos dentro do próprio painel`);
});

test('matriz_dispersao — a diagonal não recebe nuvem', (t) => {
  // A dispersão de uma medida contra ela mesma é a reta y = x: ocupa o
  // painel e não informa nada.
  const r = renderizar('ohlc', { trianguloSuperior: 'dispersao', maximoDeMedidas: 3 });
  try {
    const lista = caixas(r);
    const k = Math.round(Math.sqrt(lista.length));
    assert.ok(r.pontos.length > 0, 'sem pontos em SVG o teste não confere nada');
    for (let i = 0; i < k; i++) {
      const diagonal = lista[i * k + i];
      const dentroDela = r.pontos.filter((p) => dentro(p, diagonal));
      assert.equal(dentroDela.length, 0, `o painel diagonal ${i} recebeu ${dentroDela.length} pontos`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic('diagonal limpa');
});

/* ------------------------- correlações --------------------------- */

test('matriz_dispersao — o triângulo superior traz um r por par', (t) => {
  const r = renderizar('ohlc', { trianguloSuperior: 'correlacao' });
  try {
    const k = Math.round(Math.sqrt(r.paineis.length));
    assert.equal(
      r.correlacoes.length,
      (k * (k - 1)) / 2,
      `esperados ${(k * (k - 1)) / 2} valores de r, vieram ${r.correlacoes.length}`
    );
    for (const texto of r.correlacoes) {
      assert.match(texto, /^-?[01],\d+$|^—$/, `r mal formatado: "${texto}"`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.correlacoes.length} correlações`);
});

test('matriz_dispersao — os r mostrados batem com o cálculo direto', (t) => {
  // Conferência de ponta a ponta: o número da tela contra o r calculado
  // sobre os mesmos dados da fixture.
  const { data, queryResponse } = FIXTURES.ohlc();
  const nomesDeMedida = queryResponse.fields.measure_like.map((m) => m.name);

  const r = renderizar('ohlc', { trianguloSuperior: 'correlacao' });
  try {
    const k = Math.round(Math.sqrt(r.paineis.length));
    const medidas = nomesDeMedida.slice(0, k);

    // Mesma regra do gráfico: só linhas completas em TODAS as medidas.
    const linhas = data
      .map((linha) => medidas.map((nome) => {
        const celula = linha[nome];
        const valor = celula && celula.value;
        return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
      }))
      .filter((valores) => valores.every((v) => v !== null));

    const esperados = [];
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const rr = correlacaoDePearson(linhas.map((v) => ({ x: v[j], y: v[i] })));
        esperados.push(rr === null ? '—' : formatarR(rr));
      }
    }
    assert.deepEqual(r.correlacoes, esperados);
    t.diagnostic(`${esperados.length} correlações conferidas: ${esperados.join(' ')}`);
  } finally {
    r.fim();
  }
});

function formatarR(r) {
  const texto = Math.abs(r) >= 0.995 ? r.toFixed(1) : r.toFixed(2);
  return texto.replace('.', ',');
}

test('matriz_dispersao — a nota avisa que r não descreve a forma', (t) => {
  // Quarteto de Anscombe: quatro nuvens completamente diferentes, mesmo
  // r = 0,816. Mostrar o número sem a ressalva induz à conclusão errada.
  const r = renderizar('ohlc');
  try {
    assert.match(r.nota, /Anscombe/i, 'faltou a ressalva do quarteto');
    assert.match(r.nota, /RETAS/i, 'e a lembrança de que o r é sobre retas');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 100));
});

/* ---------------------------- limites ---------------------------- */

test('matriz_dispersao — medidas demais são cortadas com aviso', (t) => {
  const r = renderizar('ohlc', { maximoDeMedidas: 2 });
  try {
    assert.equal(r.paineis.length, 4, 'com o teto em 2, a matriz é 2×2');
    assert.match(r.aviso, /painéis|poucos pixels/i, 'o corte precisa ser anunciado');
  } finally {
    r.fim();
  }
  t.diagnostic(r.aviso.slice(0, 80));
});

test('matriz_dispersao — muitos pontos vão para UM canvas só', (t) => {
  // k² painéis × n linhas estoura o SVG rapidamente. Um canvas por painel
  // seria k² contextos para a mesma conta.
  const r = renderizar('grande5k', { trianguloSuperior: 'dispersao' });
  try {
    assert.equal(r.pontos.length, 0, 'com esse volume o SVG não deveria ser usado');
    assert.ok(r.canvas, 'faltou o canvas');
    assert.equal(
      r.palco.querySelectorAll('canvas.dr-canvas').length,
      1,
      'precisa ser UM canvas para a matriz inteira'
    );
    assert.match(r.nota, /canvas/i, 'a troca de técnica precisa estar declarada');
  } finally {
    r.fim();
  }
  t.diagnostic('canvas único conferido');
});

test('matriz_dispersao — a diagonal mostra a distribuição de cada variável', (t) => {
  const comDensidade = renderizar('ohlc', { diagonal: 'densidade' });
  try {
    const k = Math.round(Math.sqrt(comDensidade.paineis.length));
    assert.equal(comDensidade.densidades.length, k, 'uma densidade por medida');
    for (const caminho of comDensidade.densidades) {
      const d = caminho.getAttribute('d') || '';
      assert.ok(d.endsWith('Z'), 'a densidade da diagonal precisa fechar');
      assert.ok(!/NaN|Infinity/.test(d), 'densidade com NaN/Infinity');
    }
  } finally {
    comDensidade.fim();
  }

  const soNome = renderizar('ohlc', { diagonal: 'nome' });
  try {
    assert.equal(soNome.densidades.length, 0, 'o modo "só o nome" não desenha densidade');
    assert.ok(soNome.nomes.length > 0, 'mas os nomes continuam');
  } finally {
    soNome.fim();
  }
  t.diagnostic('dois modos de diagonal conferidos');
});

test('matriz_dispersao — uma medida só é recusada com explicação', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.match(mensagem, /medidas?/i, 'e dizer o que falta');
    assert.equal(r.pontos.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
