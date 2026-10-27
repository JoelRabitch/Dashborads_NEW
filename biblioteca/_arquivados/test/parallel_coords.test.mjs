/**
 * parallel_coords.test.mjs — testes das Coordenadas Paralelas.
 *
 * Aqui o que se testa é a correspondência entre dado e geometria. Uma
 * linha quebrada desenhada com a escala do eixo errado continua um
 * emaranhado plausível, e um feixe inventado é indistinguível de um feixe
 * real. Então: cada eixo usa a PRÓPRIA escala, o mínimo de cada medida cai
 * na base do seu eixo, e a escovação reduz a contagem declarada.
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
import {
  montarEscalaDeEixo,
  ordenarEixos,
  eixoMaisProximo,
  posicaoNormalizada,
} from '../src/charts/parallel_coords/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'parallel_coords.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.parallel_coords;
  assert.ok(definicao, 'parallel_coords não se registrou');

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
    nomes: Array.from(palco.querySelectorAll('.pc-nome')).map((t) => t.textContent),
    eixos: Array.from(palco.querySelectorAll('line.pc-eixo')).filter(
      (l) => l.getAttribute('x1') === l.getAttribute('x2') &&
        Math.abs(Number(l.getAttribute('y2')) - Number(l.getAttribute('y1'))) > 20
    ),
    linhas: Array.from(palco.querySelectorAll('path.pc-linha')),
    apagadas: Array.from(palco.querySelectorAll('path.pc-linha-apagada')),
    nota: palco.querySelector('.pc-nota')?.textContent || '',
    area: palco.querySelector('.pc-area'),
    canvas: palco.querySelector('canvas.pc-canvas'),
    lerNota: () => palco.querySelector('.pc-nota')?.textContent || '',
    lerLinhas: () => Array.from(palco.querySelectorAll('path.pc-linha')),
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/** Pares (x, y) de um caminho de linha quebrada. */
function coordenadas(caminho) {
  const numeros = (caminho.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const pares = [];
  for (let i = 0; i + 1 < numeros.length; i += 2) pares.push({ x: numeros[i], y: numeros[i + 1] });
  return pares;
}

/* ---------------------------- escalas ---------------------------- */

test('montarEscalaDeEixo — linear põe mínimo em 0 e máximo em 1', (t) => {
  const escala = montarEscalaDeEixo({ valores: [10, 20, 50], modo: 'linear' });
  perto(escala.posicao(10), 0, 1e-12);
  perto(escala.posicao(50), 1, 1e-12);
  perto(escala.posicao(30), 0.5, 1e-12);
  assert.equal(escala.minimo, 10);
  assert.equal(escala.maximo, 50);
  t.diagnostic('escala linear conferida');
});

test('montarEscalaDeEixo — cada eixo é independente, e é isso que se quer', (t) => {
  // Dois eixos com unidades muito diferentes: os dois usam todo o trilho.
  // É o que permite ver o PADRÃO — e o que torna as alturas incomparáveis
  // entre eixos, ressalva que o gráfico carrega na nota.
  const pequeno = montarEscalaDeEixo({ valores: [1, 2, 3] });
  const grande = montarEscalaDeEixo({ valores: [1000, 2000, 3000] });

  perto(pequeno.posicao(2), grande.posicao(2000), 1e-12);
  perto(pequeno.posicao(1), 0, 1e-12);
  perto(grande.posicao(1000), 0, 1e-12);
  t.diagnostic('2 e 2.000 caem na mesma altura: escalas independentes');
});

test('montarEscalaDeEixo — valores iguais não produzem NaN', (t) => {
  const escala = montarEscalaDeEixo({ valores: [7, 7, 7] });
  assert.ok(Number.isFinite(escala.posicao(7)), 'um intervalo degenerado dividiria por zero');
  perto(escala.posicao(7), 0.5, 1e-9);
  t.diagnostic('valor único cai no meio do eixo');
});

test('montarEscalaDeEixo — por quantil, a ordem é preservada e as marcas são quantis', (t) => {
  const valores = [1, 2, 3, 4, 1000];
  const escala = montarEscalaDeEixo({ valores, modo: 'quantil' });

  const posicoes = valores.map((v) => escala.posicao(v));
  assert.ok(posicoes.length > 0);
  for (let i = 1; i < posicoes.length; i++) {
    assert.ok(posicoes[i] > posicoes[i - 1], `a ordem quebrou entre ${valores[i - 1]} e ${valores[i]}`);
  }
  // A distorção: 1 → 2 anda tanto quanto 4 → 1.000.
  perto(posicoes[1] - posicoes[0], posicoes[4] - posicoes[3], 1e-12);
  assert.equal(escala.marcas.length, 5);
  perto(escala.marcas[2].valor, 3, 1e-12, 'a marca do meio é a mediana');
  t.diagnostic(`posições: ${posicoes.map((p) => p.toFixed(2)).join(' ')}`);
});

test('montarEscalaDeEixo — valor nulo não vira posição', (t) => {
  const escala = montarEscalaDeEixo({ valores: [1, 2, 3] });
  assert.equal(escala.posicao(null), null);
  assert.equal(escala.posicao(NaN), null);
  t.diagnostic('null em vez de NaN');
});

/* -------------------------- ordem dos eixos ---------------------- */

test('ordenarEixos — põe lado a lado os pares correlacionados', (t) => {
  // Num gráfico de coordenadas paralelas só se vê relação entre eixos
  // VIZINHOS. Aqui a e b andam juntos, c e d também, e as duas famílias
  // não se falam: a ordem automática precisa manter cada par junto.
  const linhas = [];
  for (let i = 0; i < 40; i++) {
    const a = i;
    const c = (i * 7919) % 40; // independente de `a`
    linhas.push({ valores: [a, a * 2 + 1, c, c * 3 - 2] });
  }
  const medidas = ['a', 'aGemeo', 'c', 'cGemeo'].map((rotuloCurto) => ({ rotuloCurto }));

  const ordem = ordenarEixos({ medidas, linhas, modo: 'correlacao' });
  assert.equal(ordem.length, 4, 'a ordem precisa conter todos os eixos');
  assert.deepEqual([...ordem].sort(), [0, 1, 2, 3], 'nenhum eixo pode sumir nem repetir');

  const posicao = (i) => ordem.indexOf(i);
  assert.equal(Math.abs(posicao(0) - posicao(1)), 1, 'a e aGemeo precisam ficar vizinhos');
  assert.equal(Math.abs(posicao(2) - posicao(3)), 1, 'c e cGemeo precisam ficar vizinhos');
  t.diagnostic(`ordem: ${ordem.map((i) => medidas[i].rotuloCurto).join(' ')}`);
});

test('ordenarEixos — correlação NEGATIVA forte também aproxima', (t) => {
  // Uma relação inversa é tão visível (e tão informativa) quanto uma
  // direta quando os eixos são vizinhos: usar r e não |r| separaria os
  // pares mais interessantes.
  const linhas = [];
  for (let i = 0; i < 40; i++) {
    linhas.push({ valores: [i, -i * 3, (i * 7919) % 40] });
  }
  const medidas = ['sobe', 'desce', 'solto'].map((rotuloCurto) => ({ rotuloCurto }));
  const ordem = ordenarEixos({ medidas, linhas, modo: 'correlacao' });

  assert.equal(Math.abs(ordem.indexOf(0) - ordem.indexOf(1)), 1, 'sobe e desce são opostos: vizinhos');
  t.diagnostic(`ordem: ${ordem.map((i) => medidas[i].rotuloCurto).join(' ')}`);
});

test('ordenarEixos — os outros modos devolvem o que prometem', (t) => {
  const medidas = ['zebra', 'abelha', 'macaco'].map((rotuloCurto) => ({ rotuloCurto }));
  const linhas = [{ valores: [1, 2, 3] }, { valores: [2, 3, 4] }];
  assert.deepEqual(ordenarEixos({ medidas, linhas, modo: 'consulta' }), [0, 1, 2]);
  assert.deepEqual(
    ordenarEixos({ medidas, linhas, modo: 'alfabetica' }).map((i) => medidas[i].rotuloCurto),
    ['abelha', 'macaco', 'zebra']
  );
  t.diagnostic('modos de ordem conferidos');
});

/* --------------------------- geometria --------------------------- */

test('eixoMaisProximo — acha o eixo e respeita a tolerância', (t) => {
  const xDoEixo = (i) => 50 + i * 100;
  assert.equal(eixoMaisProximo(52, 4, xDoEixo), 0);
  assert.equal(eixoMaisProximo(149, 4, xDoEixo), 1);
  assert.equal(eixoMaisProximo(350, 4, xDoEixo), 3);
  assert.equal(eixoMaisProximo(100, 4, xDoEixo, 10), null, 'fora da tolerância devolve null');
  t.diagnostic('quatro posições conferidas');
});

test('posicaoNormalizada — o topo é 1 e a base é 0 (e invertido ao contrário)', (t) => {
  perto(posicaoNormalizada(20, 20, 200, false), 1, 1e-12);
  perto(posicaoNormalizada(220, 20, 200, false), 0, 1e-12);
  perto(posicaoNormalizada(120, 20, 200, false), 0.5, 1e-12);

  perto(posicaoNormalizada(20, 20, 200, true), 0, 1e-12);
  perto(posicaoNormalizada(220, 20, 200, true), 1, 1e-12);

  // Fora da área, preso nas pontas em vez de extrapolar.
  perto(posicaoNormalizada(-500, 20, 200, false), 1, 1e-12);
  perto(posicaoNormalizada(900, 20, 200, false), 0, 1e-12);
  t.diagnostic('normalização conferida nos dois sentidos');
});

/* ---------------------------- desenho ---------------------------- */

test('parallel_coords — um eixo por medida, com nome', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.nomes.length > 1, 'faltaram nomes de eixo');
    assert.ok(r.eixos.length >= r.nomes.length, 'faltaram linhas de eixo');
    for (const nome of r.nomes) assert.ok(nome.length > 0, 'nome de eixo vazio');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.nomes.length} eixos: ${r.nomes.join(', ')}`);
});

test('parallel_coords — os eixos ficam igualmente espaçados', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.eixos.length > 2, 'poucos eixos para conferir o espaçamento');
    const xs = r.eixos.map((l) => Number(l.getAttribute('x1'))).sort((a, b) => a - b);
    const passos = [];
    for (let i = 1; i < xs.length; i++) passos.push(xs[i] - xs[i - 1]);
    assert.ok(passos.length > 0);
    const primeiro = passos[0];
    for (const passo of passos) {
      perto(passo, primeiro, 0.5);
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.eixos.length} eixos igualmente espaçados`);
});

test('parallel_coords — cada linha toca TODOS os eixos, em ordem', (t) => {
  // Uma linha que pula um eixo descreve um registro que não existe.
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha desenhada');
    const xsDosEixos = r.eixos
      .map((l) => Number(l.getAttribute('x1')))
      .sort((a, b) => a - b);

    for (const caminho of r.linhas) {
      const pontos = coordenadas(caminho.getAttribute('d') || '');
      assert.equal(
        pontos.length,
        xsDosEixos.length,
        `a linha tocou ${pontos.length} eixos de ${xsDosEixos.length}`
      );
      pontos.forEach((ponto, i) => {
        perto(ponto.x, xsDosEixos[i], 0.6);
      });
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} linhas tocando todos os eixos`);
});

test('parallel_coords — o mínimo de cada medida cai na base do SEU eixo', (t) => {
  // Este é o teste que pega escala trocada entre eixos: o desenho continua
  // um emaranhado plausível e descreve outros dados.
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    const porEixo = [];
    for (const caminho of r.linhas) {
      coordenadas(caminho.getAttribute('d') || '').forEach((ponto, i) => {
        if (!porEixo[i]) porEixo[i] = [];
        porEixo[i].push(ponto.y);
      });
    }
    assert.ok(porEixo.length > 1, 'o teste não coletou pontos de eixos suficientes');

    // Cada eixo usa o trilho inteiro: o menor y de um eixo é praticamente
    // o mesmo dos outros, e o maior também. Se um eixo estivesse usando a
    // escala de outro, ele ocuparia só um pedaço.
    const topos = porEixo.map((ys) => Math.min(...ys));
    const bases = porEixo.map((ys) => Math.max(...ys));
    const variacaoDoTopo = Math.max(...topos) - Math.min(...topos);
    const variacaoDaBase = Math.max(...bases) - Math.min(...bases);

    assert.ok(variacaoDoTopo < 2, `os topos dos eixos deveriam coincidir (variaram ${variacaoDoTopo.toFixed(1)}px)`);
    assert.ok(variacaoDaBase < 2, `as bases dos eixos deveriam coincidir (variaram ${variacaoDaBase.toFixed(1)}px)`);
    t.diagnostic(`${porEixo.length} eixos, todos usando o trilho inteiro`);
  } finally {
    r.fim();
  }
});

test('parallel_coords — a escovação filtra e a contagem declara quantos sobraram', (t) => {
  // A interação que faz o gráfico valer. Sem ela, com milhares de linhas,
  // o desenho é só textura — e um filtro que não reduzisse a contagem
  // declarada seria pior: diria que selecionou sem ter selecionado.
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha para escovar');
    const antes = r.linhas.length;
    assert.match(r.nota, /\d+ registros/);

    // Arrasta um trecho curto no eixo do meio: a faixa pega uma parte das
    // linhas, não todas nem nenhuma.
    const xs = r.eixos.map((l) => Number(l.getAttribute('x1'))).sort((a, b) => a - b);
    assert.ok(xs.length > 2, 'poucos eixos para escovar');
    const x = xs[Math.floor(xs.length / 2)];

    const evento = (tipo, clientX, clientY) =>
      new r.amb.window.PointerEvent(tipo, {
        bubbles: true, cancelable: true, clientX, clientY, button: 0, pointerId: 1,
      });

    r.area.dispatchEvent(evento('pointerdown', x, 150));
    r.area.dispatchEvent(evento('pointermove', x, 260));
    r.area.dispatchEvent(evento('pointerup', x, 260));

    const depois = r.lerLinhas().length;
    const nota = r.lerNota();

    assert.ok(depois < antes, `a escovação deveria reduzir as linhas ativas: ${depois} de ${antes}`);
    assert.ok(depois > 0, 'a faixa escolhida não deveria esvaziar a seleção inteira');
    assert.match(nota, /\d+ de \d+ registros selecionados/, `a contagem não declarou a seleção: "${nota}"`);

    const declarado = Number((nota.match(/^(\d+) de/) || [])[1]);
    assert.equal(declarado, depois, 'a contagem declarada precisa bater com as linhas desenhadas');
    t.diagnostic(`escovação: ${antes} → ${depois} linhas; nota diz "${nota.slice(0, 40)}"`);
  } finally {
    r.fim();
  }
});

test('parallel_coords — clicar sem arrastar limpa a seleção', (t) => {
  const r = renderizar('ohlc');
  try {
    const antes = r.linhas.length;
    const xs = r.eixos.map((l) => Number(l.getAttribute('x1'))).sort((a, b) => a - b);
    const x = xs[Math.floor(xs.length / 2)];
    const evento = (tipo, clientX, clientY) =>
      new r.amb.window.PointerEvent(tipo, {
        bubbles: true, cancelable: true, clientX, clientY, button: 0, pointerId: 1,
      });

    r.area.dispatchEvent(evento('pointerdown', x, 150));
    r.area.dispatchEvent(evento('pointermove', x, 260));
    r.area.dispatchEvent(evento('pointerup', x, 260));
    assert.ok(r.lerLinhas().length < antes, 'o filtro não foi aplicado');

    // Um clique sem arrasto (abaixo do mínimo útil) limpa tudo.
    r.area.dispatchEvent(evento('pointerdown', x, 200));
    r.area.dispatchEvent(evento('pointerup', x, 201));

    assert.equal(r.lerLinhas().length, antes, 'o clique deveria ter devolvido todas as linhas');
    assert.match(r.lerNota(), /\d+ registros/, 'sem filtro, a nota volta à contagem simples');
  } finally {
    r.fim();
  }
  t.diagnostic('filtro aplicado e limpo');
});

test('parallel_coords — a nota carrega as duas ressalvas estruturais', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.match(r.nota, /PRÓPRIA escala/i, 'faltou dizer que as alturas não são comparáveis');
    assert.match(r.nota, /não são comparáveis/i);
    assert.match(r.nota, /eixos VIZINHOS/i, 'faltou dizer que só se vê relação entre vizinhos');
    assert.match(r.nota, /arraste sobre um eixo/i, 'a interação precisa estar explicada');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 120));
});

test('parallel_coords — o modo quantil declara a distorção', (t) => {
  const r = renderizar('ohlc', { escalaDoEixo: 'quantil' });
  try {
    assert.match(r.nota, /quantil/i);
    assert.match(r.nota, /distorcem as distâncias/i);
  } finally {
    r.fim();
  }
  t.diagnostic('ressalva do quantil conferida');
});

test('parallel_coords — muitos registros caem para canvas', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.equal(r.linhas.length, 0, 'com 5.000 registros o SVG não deveria ser usado');
    assert.ok(r.canvas, 'faltou o canvas');
    assert.equal(
      r.palco.querySelectorAll('canvas.pc-canvas').length,
      1,
      'precisa ser UM canvas para o gráfico inteiro'
    );
    assert.match(r.nota, /registros/);
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('canvas único conferido');
});

test('parallel_coords — a contagem de registros é declarada', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.match(r.nota, /\d+ registros/, `nota sem contagem: "${r.nota}"`);
    assert.match(r.nota, /\d+ eixos/);
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 60));
});

test('parallel_coords — uma medida só é recusada com explicação', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.match(mensagem, /medidas?/i);
    assert.equal(r.linhas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
