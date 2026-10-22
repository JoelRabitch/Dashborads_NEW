/**
 * lollipop.test.mjs — testes do Gráfico de Pirulito.
 *
 * Uma regra pequena e muito ignorada: **a haste parte do zero.** Muita
 * implementação por aí começa a haste no mínimo dos dados porque fica mais
 * bonito — e aí o pirulito vira um dot plot com um rabo decorativo, com a
 * proporção distorcida como numa barra truncada. O teste central mede
 * exatamente isso no SVG.
 *
 * A segunda regra: o círculo tem tamanho FIXO. Dimensionar o círculo pelo
 * valor codificaria o mesmo dado duas vezes (posição e área) e o leitor
 * somaria as duas.
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
import { ordenarItens, calcularReferencia } from '../src/charts/lollipop/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'lollipop.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.lollipop;
  assert.ok(definicao, 'lollipop não se registrou');

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
    hastes: Array.from(palco.querySelectorAll('line.lp-haste')).map((l) => ({
      x1: Number(l.getAttribute('x1')),
      y1: Number(l.getAttribute('y1')),
      x2: Number(l.getAttribute('x2')),
      y2: Number(l.getAttribute('y2')),
    })),
    doces: Array.from(palco.querySelectorAll('circle.lp-doce')).map((c) => ({
      chave: c.getAttribute('data-chave'),
      cx: Number(c.getAttribute('cx')),
      cy: Number(c.getAttribute('cy')),
      raio: Number(c.getAttribute('r')),
    })),
    zeros: Array.from(palco.querySelectorAll('line.lp-zero')),
    valores: Array.from(palco.querySelectorAll('.lp-valor')).map((t) => t.textContent),
    nota: palco.querySelector('.lp-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* --------------------------- ordenação --------------------------- */

test('ordenarItens — as quatro ordens fazem o que prometem', (t) => {
  const base = () => [
    { rotulo: 'zebra', valor: 5 },
    { rotulo: 'abelha', valor: 100 },
    { rotulo: 'macaco', valor: 50 },
  ];
  assert.deepEqual(ordenarItens(base(), 'valorDesc').map((i) => i.rotulo), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarItens(base(), 'valorAsc').map((i) => i.rotulo), ['zebra', 'macaco', 'abelha']);
  assert.deepEqual(ordenarItens(base(), 'alfabetica').map((i) => i.rotulo), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarItens(base(), 'consulta').map((i) => i.rotulo), ['zebra', 'abelha', 'macaco']);
  t.diagnostic('quatro ordens conferidas');
});

test('calcularReferencia — média, mediana e fixo', (t) => {
  const valores = [10, 20, 30, 40];
  perto(calcularReferencia(valores, { referencia: 'media' }), 25, 1e-12);
  perto(calcularReferencia(valores, { referencia: 'mediana' }), 25, 1e-12);
  perto(calcularReferencia([1, 2, 3], { referencia: 'mediana' }), 2, 1e-12);
  perto(calcularReferencia(valores, { referencia: 'fixo', valorDaReferencia: 7 }), 7, 1e-12);
  assert.equal(calcularReferencia(valores, { referencia: 'nenhuma' }), null);
  assert.equal(calcularReferencia([], { referencia: 'media' }), null);
  t.diagnostic('cinco casos conferidos');
});

/* ------------------------- a regra do zero ----------------------- */

test('lollipop — TODA haste começa na linha do zero', (t) => {
  // A regra que o gráfico existe para respeitar. Começar no mínimo dos
  // dados deixaria o desenho mais bonito e a proporção errada.
  const r = renderizar('semPivo');
  try {
    assert.ok(r.hastes.length > 0, 'nenhuma haste');
    const inicios = new Set(r.hastes.map((h) => h.x1.toFixed(2)));
    assert.equal(
      inicios.size,
      1,
      `as hastes deveriam partir todas do mesmo x; partiram de ${[...inicios].join(', ')}`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.hastes.length} hastes com a mesma origem`);
});

test('lollipop — o comprimento da haste é proporcional ao valor', (t) => {
  // Com a base no zero, a razão de comprimentos É a razão de valores.
  // Numa haste truncada, não seria — e nada na tela denunciaria.
  const r = renderizar('semPivo', { escreverValores: true });
  try {
    assert.ok(r.hastes.length > 1, 'poucas hastes');
    assert.equal(r.doces.length, r.hastes.length, 'um círculo por haste');

    const numero = (texto) => Number(String(texto).replace(/[^\d.-]/g, ''));
    const valores = r.valores.map(numero).filter(Number.isFinite);
    assert.ok(valores.length === r.hastes.length, 'não consegui ler todos os valores');

    const comprimentos = r.hastes.map((h) => Math.abs(h.x2 - h.x1));
    const maiorValor = Math.max(...valores);
    const maiorComprimento = Math.max(...comprimentos);
    assert.ok(maiorComprimento > 0, 'hastes de comprimento zero');

    for (let i = 0; i < valores.length; i++) {
      perto(comprimentos[i] / maiorComprimento, valores[i] / maiorValor, 0.02);
    }
    t.diagnostic(`${valores.length} hastes proporcionais ao valor`);
  } finally {
    r.fim();
  }
});

test('lollipop — o círculo fica exatamente na ponta da haste', (t) => {
  // Um círculo deslocado da ponta marcaria um valor diferente do que a
  // haste mede.
  const r = renderizar('semPivo');
  try {
    assert.ok(r.doces.length > 0, 'nenhum círculo');
    assert.equal(r.doces.length, r.hastes.length);

    const porPonta = r.hastes.map((h) => ({ x: h.x2, y: h.y2 }));
    for (const doce of r.doces) {
      const achou = porPonta.some(
        (p) => Math.abs(p.x - doce.cx) < 0.01 && Math.abs(p.y - doce.cy) < 0.01
      );
      assert.ok(achou, `círculo em (${doce.cx}, ${doce.cy}) não está na ponta de nenhuma haste`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.doces.length} círculos na ponta`);
});

test('lollipop — todos os círculos têm o MESMO tamanho', (t) => {
  // Dimensionar o círculo pelo valor codificaria o mesmo dado duas vezes
  // (posição e área) e o leitor somaria as duas.
  const r = renderizar('semPivo');
  try {
    assert.ok(r.doces.length > 1, 'poucos círculos');
    const raios = new Set(r.doces.map((d) => d.raio.toFixed(3)));
    assert.equal(raios.size, 1, `os círculos deveriam ter um raio só; vieram ${[...raios].join(', ')}`);
  } finally {
    r.fim();
  }
  t.diagnostic(`raio único de ${r.doces[0].raio}px`);
});

/* ---------------------------- desenho ---------------------------- */

test('lollipop — uma haste e um círculo por categoria', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.hastes.length > 0, 'nenhuma haste');
    assert.equal(r.doces.length, r.hastes.length);
    assert.ok(r.zeros.length >= 1, 'faltou a linha do zero');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.hastes.length} pirulitos`);
});

test('lollipop — nada sai da área nas duas orientações', (t) => {
  for (const orientacao of ['horizontal', 'vertical']) {
    const r = renderizar('semPivo', { orientacao });
    try {
      assert.ok(r.doces.length > 0, `${orientacao}: nenhum círculo`);
      for (const doce of r.doces) {
        assert.ok(doce.cx >= -1 && doce.cx <= 901, `${orientacao}: círculo fora (x=${doce.cx})`);
        assert.ok(doce.cy >= -1 && doce.cy <= 561, `${orientacao}: círculo fora (y=${doce.cy})`);
      }
      for (const haste of r.hastes) {
        assert.ok(Number.isFinite(haste.x1) && Number.isFinite(haste.y2), `${orientacao}: haste inválida`);
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic('as duas orientações conferidas');
});

test('lollipop — a orientação vertical põe as hastes na vertical', (t) => {
  const r = renderizar('semPivo', { orientacao: 'vertical' });
  try {
    assert.ok(r.hastes.length > 0, 'nenhuma haste');
    for (const haste of r.hastes) {
      assert.equal(haste.x1, haste.x2, 'na vertical, a haste não pode andar em x');
    }
    const inicios = new Set(r.hastes.map((h) => h.y1.toFixed(2)));
    assert.equal(inicios.size, 1, 'todas as hastes verticais saem do mesmo y (o zero)');
  } finally {
    r.fim();
  }
  t.diagnostic('orientação vertical conferida');
});

test('lollipop — a nota declara a regra da haste e aponta o dot plot', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.match(r.nota, /haste sai do ZERO/i, 'a regra precisa estar escrita');
    assert.match(r.nota, /comprimento truncado distorce/i, 'e o motivo também');
    assert.match(r.nota, /tamanho fixo/i, 'a decisão do círculo precisa estar dita');
    assert.match(r.nota, /Dot Plot Denso/i, 'e a alternativa legítima para eixo cortado');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 120));
});

test('lollipop — a referência aparece e se declara', (t) => {
  const sem = renderizar('semPivo', { referencia: 'nenhuma' });
  const com = renderizar('semPivo', { referencia: 'media' });
  try {
    assert.ok(com.zeros.length > sem.zeros.length, 'a referência precisa desenhar uma linha a mais');
    assert.match(com.nota, /referência em/i);
    assert.ok(!/referência em/i.test(sem.nota), 'sem referência, nada a declarar');
  } finally {
    sem.fim();
    com.fim();
  }
  t.diagnostic('referência conferida nos dois modos');
});

test('lollipop — a ordem padrão é decrescente e muda conforme pedido', (t) => {
  const desc = renderizar('semPivo', { ordem: 'valorDesc', orientacao: 'horizontal' });
  const asc = renderizar('semPivo', { ordem: 'valorAsc', orientacao: 'horizontal' });
  try {
    assert.ok(desc.doces.length > 1 && asc.doces.length > 1);
    // Na horizontal, a primeira linha (menor y) é a primeira da ordem.
    const primeiro = (r) => r.doces.reduce((a, b) => (b.cy < a.cy ? b : a));
    assert.notEqual(
      primeiro(desc).chave,
      primeiro(asc).chave,
      'inverter a ordem precisa trocar quem fica no topo'
    );
  } finally {
    desc.fim();
    asc.fim();
  }
  t.diagnostic('ordens conferidas no desenho');
});

test('lollipop — consulta vazia explica em vez de desenhar', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.doces.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
