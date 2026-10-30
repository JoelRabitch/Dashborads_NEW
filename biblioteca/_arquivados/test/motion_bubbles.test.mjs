/**
 * motion_bubbles.test.mjs — testes das Bolhas em Movimento.
 *
 * O erro clássico do gênero é o raio proporcional ao valor: o olho lê
 * ÁREA, então isso faz uma diferença de 3× parecer 9×. O desenho continua
 * perfeitamente plausível — só exagera tudo. É o primeiro teste do
 * arquivo, e ele mede a relação exata (dobrar o valor multiplica o raio
 * por √2).
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
  raioPorArea,
  quantosNoPiso,
  interpolarBolhas,
  rastroDe,
  RAIO_MINIMO,
} from '../src/charts/motion_bubbles/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'motion_bubbles.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

const item = (rotulo, x, y, tamanho) => ({
  chave: rotulo,
  rotulo,
  indiceDaLinha: 0,
  x,
  y,
  tamanho: tamanho || x.map(() => 1),
});

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
  const definicao = amb.registro.motion_bubbles;
  assert.ok(definicao, 'motion_bubbles não se registrou');

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
    bolhas: Array.from(palco.querySelectorAll('circle.mb-bolha')).map((c) => ({
      item: c.getAttribute('data-item'),
      cx: Number(c.getAttribute('cx')),
      cy: Number(c.getAttribute('cy')),
      raio: Number(c.getAttribute('r')),
    })),
    rastros: Array.from(palco.querySelectorAll('path.mb-rastro')),
    pontosDeRastro: Array.from(palco.querySelectorAll('circle.mb-rastro-ponto')),
    relogio: palco.querySelector('.mb-relogio')?.textContent || '',
    periodo: palco.querySelector('.mb-periodo')?.textContent || '',
    botao: palco.querySelector('.mb-botao'),
    tempo: palco.querySelector('.mb-tempo'),
    nota: palco.querySelector('.mb-nota')?.textContent || '',
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

/* ------------------------- área da bolha ------------------------- */

test('raioPorArea — dobrar o valor multiplica o raio por √2, não por 2', (t) => {
  // O erro clássico. Com o raio proporcional ao valor, a mancha
  // quadruplicaria e uma diferença de 2× seria vista como 4×.
  const metade = raioPorArea(50, 100, 40);
  const inteiro = raioPorArea(100, 100, 40);

  perto(inteiro, 40, 1e-12, 'o maior valor usa o raio máximo');
  perto(inteiro / metade, Math.SQRT2, 1e-12);

  // E a consequência: a ÁREA é que dobra.
  const areaMetade = Math.PI * metade ** 2;
  const areaInteira = Math.PI * inteiro ** 2;
  perto(areaInteira / areaMetade, 2, 1e-9);
  t.diagnostic(`raios ${metade.toFixed(3)} → ${inteiro}, áreas na razão 2`);
});

test('raioPorArea — a razão das áreas é a razão dos valores, acima do piso', (t) => {
  const casos = [
    [10, 100],
    [25, 100],
    [999, 1000],
  ];
  assert.ok(casos.length > 0);
  for (const [valor, maior] of casos) {
    const raio = raioPorArea(valor, maior, 50);
    const raioDoMaior = raioPorArea(maior, maior, 50);
    perto((raio / raioDoMaior) ** 2, valor / maior, 1e-9);
  }
  t.diagnostic('três razões conferidas');
});

test('raioPorArea — o piso quebra a proporção, e isso é contado', (t) => {
  // A única exceção à regra da área, e ela é deliberada: um valor mil
  // vezes menor daria 1,5 px e sumiria. Entre desenhar maior do que é e
  // não desenhar, desenhamos — e contamos, para o gráfico poder avisar.
  const raio = raioPorArea(1, 1000, 50);
  assert.equal(raio, RAIO_MINIMO, 'o valor minúsculo cai no piso');
  assert.ok(
    (raio / 50) ** 2 > 1 / 1000,
    'no piso, a área fica MAIOR que a proporção — é a distorção que o aviso cobre'
  );

  assert.equal(quantosNoPiso([1, 500, 1000], 1000, 50), 1, 'só o minúsculo está no piso');
  assert.equal(quantosNoPiso([500, 1000], 1000, 50), 0, 'sem minúsculos, ninguém no piso');
  assert.equal(quantosNoPiso([1, 2, 3], 0, 50), 0, 'sem maior válido, não há o que contar');
  t.diagnostic(`piso em ${RAIO_MINIMO}px, contagem conferida`);
});

test('raioPorArea — valores ausentes ou zerados viram um ponto mínimo', (t) => {
  // Raio zero some do gráfico; o item existe e precisa aparecer.
  for (const valor of [null, NaN, 0, -5]) {
    const raio = raioPorArea(valor, 100, 40);
    assert.ok(raio >= 2, `valor ${valor} produziu raio ${raio}`);
    assert.ok(raio < 40, 'e não pode usar o raio máximo');
  }
  t.diagnostic('quatro casos degenerados tratados');
});

/* -------------------------- interpolação ------------------------- */

test('interpolarBolhas — nos inteiros devolve os valores reais', (t) => {
  const itens = [item('a', [10, 50], [1, 5]), item('b', [20, 20], [2, 2])];

  const inicio = interpolarBolhas({ itens, tempo: 0 });
  const fim = interpolarBolhas({ itens, tempo: 1 });
  assert.equal(inicio.length, 2);
  perto(inicio.find((b) => b.item.rotulo === 'a').x, 10, 1e-12);
  perto(fim.find((b) => b.item.rotulo === 'a').x, 50, 1e-12);
  perto(fim.find((b) => b.item.rotulo === 'a').y, 5, 1e-12);
  t.diagnostic('pontas conferidas');
});

test('interpolarBolhas — o meio é a média, em X, Y e tamanho', (t) => {
  const itens = [item('a', [10, 50], [1, 5], [100, 300])];
  const meio = interpolarBolhas({ itens, tempo: 0.5 })[0];
  perto(meio.x, 30, 1e-12);
  perto(meio.y, 3, 1e-12);
  perto(meio.tamanho, 200, 1e-12);
  t.diagnostic('as três variáveis interpoladas');
});

test('interpolarBolhas — bolha sem X ou Y nos dois lados fica de fora', (t) => {
  // Uma bolha parada numa posição antiga afirmaria um dado que não existe
  // naquele período.
  const itens = [item('presente', [10, 20], [1, 2]), item('ausente', [null, null], [null, null])];
  const quadro = interpolarBolhas({ itens, tempo: 0.5 });
  assert.equal(quadro.length, 1);
  assert.equal(quadro[0].item.rotulo, 'presente');
  t.diagnostic('ausência respeitada');
});

test('interpolarBolhas — com valor em só um dos lados, usa o que existe', (t) => {
  const itens = [item('entrando', [null, 30], [null, 7])];
  const comeco = interpolarBolhas({ itens, tempo: 0 })[0];
  const fim = interpolarBolhas({ itens, tempo: 1 })[0];
  perto(comeco.x, 30, 1e-12, 'sem o período anterior, fica onde vai estar');
  perto(fim.x, 30, 1e-12);
  t.diagnostic('entrada tratada sem NaN');
});

test('interpolarBolhas — tempo fora do intervalo é preso nas pontas', (t) => {
  const itens = [item('a', [10, 50], [1, 5])];
  perto(interpolarBolhas({ itens, tempo: -3 })[0].x, 10, 1e-12);
  perto(interpolarBolhas({ itens, tempo: 99 })[0].x, 50, 1e-12);
  t.diagnostic('extrapolação impedida');
});

/* ----------------------------- rastro ---------------------------- */

test('rastroDe — devolve o caminho do comprimento pedido', (t) => {
  const bolha = item('a', [1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);

  const curto = rastroDe({ item: bolha, tempo: 4, comprimento: 2 });
  assert.equal(curto.length, 3, 'tempo 4 com comprimento 2 cobre os períodos 2, 3 e 4');
  assert.deepEqual(curto.map((p) => p.x), [3, 4, 5]);

  const longo = rastroDe({ item: bolha, tempo: 4, comprimento: 20 });
  assert.equal(longo.length, 5, 'o rastro nunca passa do início da série');
  t.diagnostic(`comprimentos: ${curto.length} e ${longo.length}`);
});

test('rastroDe — períodos sem dado não entram no caminho', (t) => {
  // Ligar por cima de uma lacuna desenharia um trecho que não aconteceu.
  const bolha = item('a', [1, null, 3], [10, null, 30]);
  const caminho = rastroDe({ item: bolha, tempo: 2, comprimento: 5 });
  assert.equal(caminho.length, 2);
  assert.deepEqual(caminho.map((p) => p.x), [1, 3]);
  t.diagnostic('lacuna pulada');
});

test('rastroDe — comprimento zero não produz caminho desenhável', (t) => {
  const bolha = item('a', [1, 2, 3], [10, 20, 30]);
  assert.equal(rastroDe({ item: bolha, tempo: 2, comprimento: 0 }).length, 1);
  t.diagnostic('um ponto só não vira linha');
});

/* ---------------------------- desenho ---------------------------- */

test('motion_bubbles — desenha bolhas e os controles de tempo', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.bolhas.length > 0, 'nenhuma bolha desenhada');
    assert.ok(r.botao, 'faltou o botão de tocar');
    assert.ok(r.tempo, 'faltou a barra de tempo');
    assert.equal(r.tempo.type, 'range');
    for (const bolha of r.bolhas) {
      assert.ok(Number.isFinite(bolha.cx) && Number.isFinite(bolha.cy), 'bolha com posição inválida');
      assert.ok(bolha.raio > 0, 'bolha sem raio');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.bolhas.length} bolhas`);
});

test('motion_bubbles — nenhuma bolha sai do palco', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.ok(r.bolhas.length > 0, 'nenhuma bolha');
    for (const bolha of r.bolhas) {
      assert.ok(bolha.cx >= -1 && bolha.cx <= 901, `bolha fora (x=${bolha.cx})`);
      assert.ok(bolha.cy >= -1 && bolha.cy <= 561, `bolha fora (y=${bolha.cy})`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic('bolhas contidas');
});

test('motion_bubbles — arrastar o tempo move as bolhas e pausa', (t) => {
  const r = renderizar('duasDimensoes', { comecarTocando: false });
  try {
    const antes = r.ler();
    assert.ok(antes.bolhas.length > 0);

    r.tempo.value = r.tempo.max;
    r.tempo.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));

    const depois = r.ler();
    assert.ok(depois.bolhas.length > 0, 'o novo quadro precisa ter bolhas');
    assert.match(depois.botao.textContent, /tocar/, 'arrastar precisa pausar');

    const mudou = depois.bolhas.some((b, i) => {
      const par = antes.bolhas.find((a) => a.item === b.item);
      return par && (Math.abs(par.cx - b.cx) > 0.5 || Math.abs(par.cy - b.cy) > 0.5);
    });
    assert.ok(mudou, 'ao menos uma bolha deveria ter se movido entre os períodos');
    t.diagnostic(`período "${antes.periodo}" → "${depois.periodo}"`);
  } finally {
    r.fim();
  }
});

test('motion_bubbles — o rastro aparece só quando pedido', (t) => {
  const sem = renderizar('duasDimensoes', { comprimentoDoRastro: 0, comecarTocando: false });
  try {
    assert.equal(sem.rastros.length, 0, 'sem rastro pedido, nenhum caminho');
    assert.match(sem.nota, /sem rastro/i, 'e a nota precisa sugerir ligá-lo');
  } finally {
    sem.fim();
  }

  const com = renderizar('duasDimensoes', { comprimentoDoRastro: 3, comecarTocando: false });
  try {
    com.tempo.value = com.tempo.max;
    com.tempo.dispatchEvent(new com.amb.window.Event('input', { bubbles: true }));

    const depois = com.ler();
    assert.ok(depois.rastros.length > 0, 'com rastro pedido, os caminhos precisam existir');
    for (const caminho of depois.rastros) {
      const d = caminho.getAttribute('d') || '';
      assert.ok(d.length > 5 && !/NaN|Infinity/.test(d), 'rastro com caminho inválido');
    }
    assert.match(depois.nota, /rastro de 3/i);
  } finally {
    com.fim();
  }
  t.diagnostic('rastro conferido nos dois modos');
});

test('motion_bubbles — a nota declara a regra da área e as escalas fixas', (t) => {
  const r = renderizar('duasDimensoes');
  try {
    assert.match(r.nota, /escalas fixas/i, 'escala móvel faria tudo parecer parado');
    assert.match(r.nota, /PARADO/, 'a ressalva da animação precisa estar lá');
    if (/tamanho por/i.test(r.nota)) {
      assert.match(r.nota, /ÁREA é proporcional/i, 'a regra da área precisa estar declarada');
      assert.match(r.nota, /√2/);
    } else {
      assert.match(r.nota, /mesmo tamanho/i, 'sem medida de tamanho, o gráfico diz isso');
    }
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 110));
});

test('motion_bubbles — com menos movimento, nada começa sozinho', (t) => {
  const r = renderizar('duasDimensoes', { comecarTocando: true }, { menosMovimento: true });
  try {
    assert.match(r.ler().botao.textContent, /tocar/, 'o gráfico precisa abrir PARADO');
    assert.match(r.nota, /menos movimento/i);
    assert.ok(r.bolhas.length > 0, 'parado, mas desenhado');
    assert.equal(Number(r.tempo.value), Number(r.tempo.max));
  } finally {
    r.fim();
  }
  t.diagnostic('preferência respeitada');
});

test('motion_bubbles — destruir para o relógio', (t) => {
  const r = renderizar('duasDimensoes', { comecarTocando: true });
  try {
    r.instancia.destroy();
    r.instancia.destroy();
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('destruição limpa');
});

test('motion_bubbles — consulta sem as duas dimensões explica', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.bolhas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
