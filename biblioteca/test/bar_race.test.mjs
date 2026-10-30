/**
 * bar_race.test.mjs — testes do Bar Chart Race.
 *
 * O que carrega este gráfico é a INTERPOLAÇÃO. Interpolar só o valor e
 * reordenar a cada quadro faz as barras se teletransportarem no exato
 * momento em que duas se cruzam — que é justamente o movimento que o
 * gráfico existe para mostrar. Então o teste central é: **a posição
 * também é interpolada, e duas barras que trocam de lugar passam uma pela
 * outra continuamente.**
 *
 * E a acessibilidade é testada como funcionalidade: com
 * `prefers-reduced-motion`, nada começa a se mexer sozinho.
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
import { quadroDoPeriodo, interpolarQuadro } from '../src/charts/bar_race/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'bar_race.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

const serie = (rotulo, valores) => ({ chave: rotulo, rotulo, valores });

function renderizar(nomeDaFixture, ajustes = {}, { menosMovimento = false } = {}) {
  const amb = montarAmbiente();
  if (menosMovimento) {
    amb.window.matchMedia = (consulta) => ({
      matches: /prefers-reduced-motion/.test(consulta),
      media: consulta,
      addEventListener() {},
      removeEventListener() {},
    });
  }
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.bar_race;
  assert.ok(definicao, 'bar_race não se registrou');

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

  const ler = () => ({
    barras: Array.from(palco.querySelectorAll('.bc-barra')).map((el) => ({
      topo: Number(String(el.style.top).replace('px', '')),
      nome: el.querySelector('.bc-nome')?.textContent || '',
      largura: Number(String(el.querySelector('.bc-retangulo')?.style.width || '0').replace('px', '')),
      valor: el.querySelector('.bc-valor')?.textContent || '',
    })),
    periodo: palco.querySelector('.bc-periodo')?.textContent || '',
    botao: palco.querySelector('.bc-botao'),
    tempo: palco.querySelector('.bc-tempo'),
    nota: palco.querySelector('.bl-nota')?.textContent || '',
  });

  return {
    amb,
    palco,
    instancia,
    ler,
    ...ler(),
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* -------------------------- interpolação ------------------------- */

test('quadroDoPeriodo — ordena por valor e numera a partir de zero', (t) => {
  const series = [serie('a', [10]), serie('b', [30]), serie('c', [20])];
  const quadro = quadroDoPeriodo({ series, periodo: 0 });

  assert.equal(quadro.length, 3);
  assert.deepEqual(quadro.map((i) => i.rotulo), ['b', 'c', 'a']);
  assert.deepEqual(quadro.map((i) => i.posicao), [0, 1, 2]);
  t.diagnostic('ordenação e posições conferidas');
});

test('quadroDoPeriodo — série sem valor fica de fora, não vira zero', (t) => {
  // Tratá-la como zero a colocaria no fim do ranking, afirmando que o
  // valor é zero quando o que se sabe é que não se sabe.
  const series = [serie('a', [10]), serie('b', [null]), serie('c', [20])];
  const quadro = quadroDoPeriodo({ series, periodo: 0 });

  assert.equal(quadro.length, 2);
  assert.ok(!quadro.some((i) => i.rotulo === 'b'), 'a série sem valor não pode aparecer');
  t.diagnostic('ausência tratada como ausência');
});

test('quadroDoPeriodo — empate desempata pelo nome, de forma estável', (t) => {
  const naOrdemA = [serie('zebra', [100]), serie('abelha', [100])];
  const naOrdemB = [serie('abelha', [100]), serie('zebra', [100])];

  const a = quadroDoPeriodo({ series: naOrdemA, periodo: 0 }).map((i) => i.rotulo);
  const b = quadroDoPeriodo({ series: naOrdemB, periodo: 0 }).map((i) => i.rotulo);
  assert.deepEqual(a, ['abelha', 'zebra']);
  assert.deepEqual(a, b, 'a mesma consulta em outra ordem precisa dar o mesmo quadro');
  t.diagnostic('desempate estável');
});

test('interpolarQuadro — nos tempos inteiros reproduz o quadro exato', (t) => {
  const series = [serie('a', [10, 50]), serie('b', [30, 20])];
  const quadros = [0, 1].map((p) => quadroDoPeriodo({ series, periodo: p }));

  const inicio = interpolarQuadro({ quadros, tempo: 0 });
  const fim = interpolarQuadro({ quadros, tempo: 1 });

  assert.deepEqual(inicio.map((i) => i.rotulo), ['b', 'a']);
  assert.deepEqual(fim.map((i) => i.rotulo), ['a', 'b']);
  perto(inicio.find((i) => i.rotulo === 'a').valor, 10, 1e-12);
  perto(fim.find((i) => i.rotulo === 'a').valor, 50, 1e-12);
  t.diagnostic('as pontas batem com os quadros reais');
});

test('interpolarQuadro — o valor no meio é a média dos dois períodos', (t) => {
  const series = [serie('a', [10, 50]), serie('b', [30, 20])];
  const quadros = [0, 1].map((p) => quadroDoPeriodo({ series, periodo: p }));
  const meio = interpolarQuadro({ quadros, tempo: 0.5 });

  perto(meio.find((i) => i.rotulo === 'a').valor, 30, 1e-12);
  perto(meio.find((i) => i.rotulo === 'b').valor, 25, 1e-12);
  t.diagnostic('valores interpolados');
});

test('interpolarQuadro — duas barras que se cruzam passam uma pela outra', (t) => {
  // ESTE é o teste do gráfico. Com a posição interpolada, no meio do
  // caminho as duas barras estão à mesma altura; sem isso, elas trocam de
  // lugar num salto e o cruzamento — a única coisa que a animação tinha
  // para mostrar — desaparece.
  const series = [serie('a', [10, 50]), serie('b', [30, 20])];
  const quadros = [0, 1].map((p) => quadroDoPeriodo({ series, periodo: p }));

  const posicoes = [];
  for (let t2 = 0; t2 <= 1.0001; t2 += 0.1) {
    const quadro = interpolarQuadro({ quadros, tempo: t2 });
    posicoes.push({
      t: t2,
      a: quadro.find((i) => i.rotulo === 'a').posicao,
      b: quadro.find((i) => i.rotulo === 'b').posicao,
    });
  }
  assert.ok(posicoes.length > 5, 'poucos quadros para conferir a continuidade');

  // Continuidade: nenhum salto maior que o passo esperado.
  for (let i = 1; i < posicoes.length; i++) {
    const saltoA = Math.abs(posicoes[i].a - posicoes[i - 1].a);
    assert.ok(saltoA < 0.2, `a barra "a" saltou ${saltoA.toFixed(3)} entre dois quadros`);
  }

  // E elas se encontram no meio.
  const meio = posicoes.find((p) => Math.abs(p.t - 0.5) < 1e-6);
  perto(meio.a, meio.b, 1e-9, 'no meio do cruzamento as duas estão à mesma altura');
  t.diagnostic(`a: ${posicoes[0].a} → ${posicoes[posicoes.length - 1].a}, cruzando em ${meio.a}`);
});

test('interpolarQuadro — quem entra desliza pela borda, não aparece no meio', (t) => {
  // Uma série que só existe no segundo período precisa vir de FORA da
  // pista; surgir do nada no meio do ranking seria um movimento que não
  // corresponde a dado nenhum.
  const series = [serie('a', [10, 10]), serie('b', [20, 20]), serie('nova', [null, 30])];
  const quadros = [0, 1].map((p) => quadroDoPeriodo({ series, periodo: p }));

  const comeco = interpolarQuadro({ quadros, tempo: 0 }).find((i) => i.rotulo === 'nova');
  const fim = interpolarQuadro({ quadros, tempo: 1 }).find((i) => i.rotulo === 'nova');

  assert.ok(comeco, 'a série nova precisa existir no quadro interpolado');
  assert.ok(
    comeco.posicao >= quadros[0].length,
    `a nova deveria começar fora da pista (${comeco.posicao})`
  );
  assert.equal(fim.posicao, 0, 'e terminar em primeiro, que é onde ela está no período 1');
  t.diagnostic(`"nova": posição ${comeco.posicao} → ${fim.posicao}`);
});

test('interpolarQuadro — tempo fora do intervalo é preso nas pontas', (t) => {
  const series = [serie('a', [10, 50])];
  const quadros = [0, 1].map((p) => quadroDoPeriodo({ series, periodo: p }));

  perto(interpolarQuadro({ quadros, tempo: -5 })[0].valor, 10, 1e-12);
  perto(interpolarQuadro({ quadros, tempo: 99 })[0].valor, 50, 1e-12);
  t.diagnostic('extrapolação impedida');
});

/* ---------------------------- desenho ---------------------------- */

test('bar_race — desenha barras ordenadas e os controles', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.barras.length > 0, 'nenhuma barra desenhada');
    assert.ok(r.botao, 'faltou o botão de tocar');
    assert.ok(r.tempo, 'faltou a barra de tempo');
    assert.equal(r.tempo.type, 'range', 'a barra de tempo precisa ser arrastável');
    assert.ok(r.periodo.length > 0, 'o período corrente precisa estar escrito');

    const topos = r.barras.map((b) => b.topo);
    for (let i = 1; i < topos.length; i++) {
      assert.ok(topos[i] > topos[i - 1], 'as barras precisam estar empilhadas sem repetir altura');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.barras.length} barras no período "${r.periodo}"`);
});

test('bar_race — a maior barra é a mais larga e está no topo', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.barras.length > 1, 'poucas barras');
    const porTopo = r.barras.slice().sort((a, b) => a.topo - b.topo);
    for (let i = 1; i < porTopo.length; i++) {
      assert.ok(
        porTopo[i].largura <= porTopo[i - 1].largura + 0.01,
        `a barra ${i} é mais larga que a de cima (${porTopo[i].largura} > ${porTopo[i - 1].largura})`
      );
    }
  } finally {
    r.fim();
  }
  t.diagnostic('ordem de largura conferida');
});

test('bar_race — arrastar a barra de tempo muda o quadro e pausa', (t) => {
  const r = renderizar('comPivo', { comecarTocando: false });
  try {
    assert.ok(r.barras.length > 0);
    const antes = r.ler();

    r.tempo.value = r.tempo.max;
    r.tempo.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));

    const depois = r.ler();
    assert.notEqual(depois.periodo, antes.periodo, 'o período mostrado precisa mudar');
    assert.match(depois.botao.textContent, /tocar/, 'arrastar precisa pausar a animação');
    assert.ok(depois.barras.length > 0, 'o novo quadro precisa ter barras');
    t.diagnostic(`"${antes.periodo}" → "${depois.periodo}"`);
  } finally {
    r.fim();
  }
});

test('bar_race — o botão alterna entre tocar e pausar', (t) => {
  const r = renderizar('comPivo', { comecarTocando: false });
  try {
    assert.match(r.ler().botao.textContent, /tocar/);
    r.botao.dispatchEvent(new r.amb.window.Event('click', { bubbles: true }));
    assert.match(r.ler().botao.textContent, /pausar/);
    r.botao.dispatchEvent(new r.amb.window.Event('click', { bubbles: true }));
    assert.match(r.ler().botao.textContent, /tocar/);
  } finally {
    r.fim();
  }
  t.diagnostic('alternância conferida');
});

test('bar_race — com preferência de menos movimento, nada começa sozinho', (t) => {
  // Acessibilidade testada como funcionalidade: animação involuntária é um
  // gatilho real para parte dos usuários.
  const r = renderizar('comPivo', { comecarTocando: true }, { menosMovimento: true });
  try {
    assert.match(r.ler().botao.textContent, /tocar/, 'o gráfico precisa abrir PARADO');
    assert.match(r.nota, /menos movimento/i, 'e dizer por quê');
    assert.ok(r.barras.length > 0, 'parado, mas desenhado');

    // E parado no último período, que é o quadro com mais informação.
    assert.equal(Number(r.tempo.value), Number(r.tempo.max));
  } finally {
    r.fim();
  }
  t.diagnostic('preferência respeitada');
});

test('bar_race — a nota avisa sobre a escala e sobre comparar parado', (t) => {
  const movel = renderizar('comPivo', { escalaFixa: false });
  try {
    assert.match(movel.nota, /PARADO/, 'a ressalva principal precisa estar lá');
    assert.match(movel.nota, /NÃO são comparáveis entre períodos/i, 'e a da escala móvel também');
  } finally {
    movel.fim();
  }

  const fixa = renderizar('comPivo', { escalaFixa: true });
  try {
    assert.match(fixa.nota, /escala fixa/i);
    assert.match(fixa.nota, /são comparáveis entre períodos/i);
  } finally {
    fixa.fim();
  }
  t.diagnostic('as duas escalas se declaram');
});

test('bar_race — destruir para o relógio', (t) => {
  // Um passo em voo redesenhando sobre DOM morto é o jeito clássico de um
  // gráfico animado derrubar o dashboard inteiro.
  const r = renderizar('comPivo', { comecarTocando: true });
  try {
    const instancia = r.instancia;
    assert.ok(typeof instancia.destroy === 'function', 'a viz precisa expor destroy()');
    instancia.destroy();
    // Depois de destruída, uma segunda chamada não pode explodir.
    instancia.destroy();
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('destruição limpa');
});

test('bar_race — consulta sem períodos suficientes explica', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.barras.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
