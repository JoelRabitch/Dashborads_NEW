/**
 * horizon_chart.test.mjs — testes do Horizon Chart.
 *
 * A conta que define o gráfico é a da DOBRA: com banda 100 e 3 dobras, o
 * valor 250 preenche a dobra 1 inteira, a dobra 2 inteira e metade da
 * dobra 3. Se essa conta estiver errada, o gráfico continua uma textura
 * agradável e descreve outros dados — e, como quase ninguém conhece a
 * construção, ninguém percebe.
 *
 * O segundo ponto é o sinal: negativos sobem com cor própria e NÃO podem
 * contribuir para as camadas positivas, senão o espelhamento vira soma.
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
  fracaoDaDobra,
  dobraDoValor,
  ordenarFaixas,
} from '../src/charts/horizon_chart/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'horizon_chart.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.horizon_chart;
  assert.ok(definicao, 'horizon_chart não se registrou');

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
    faixas: Array.from(palco.querySelectorAll('rect.hz-base')).map((r) => ({
      y: Number(r.getAttribute('y')),
      altura: Number(r.getAttribute('height')),
    })),
    dobras: Array.from(palco.querySelectorAll('path.hz-dobra')).map((p) => ({
      dobra: Number(p.getAttribute('data-dobra')),
      sinal: p.getAttribute('data-sinal'),
      cor: p.getAttribute('fill'),
      d: p.getAttribute('d') || '',
    })),
    nomes: Array.from(palco.querySelectorAll('.hz-nome')).map((t) => t.textContent),
    legenda: Array.from(palco.querySelectorAll('.hz-legenda')),
    nota: palco.querySelector('.hz-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/** Coordenadas Y de um caminho (os números de índice ímpar). */
function coordenadasY(caminho) {
  const numeros = (caminho.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  return numeros.filter((_, i) => i % 2 === 1);
}

/* ----------------------------- a conta --------------------------- */

test('fracaoDaDobra — 250 com banda 100 preenche 1, 1 e 0,5', (t) => {
  // O exemplo canônico: é empilhando essas três camadas, cada uma mais
  // escura, que 250 cabe na altura de 100.
  perto(fracaoDaDobra(250, 100, 0), 1, 1e-12);
  perto(fracaoDaDobra(250, 100, 1), 1, 1e-12);
  perto(fracaoDaDobra(250, 100, 2), 0.5, 1e-12);
  perto(fracaoDaDobra(250, 100, 3), 0, 1e-12, 'acima do valor, a dobra fica vazia');
  t.diagnostic('250 = 100 + 100 + 50');
});

test('fracaoDaDobra — um valor dentro da primeira banda só preenche a primeira', (t) => {
  perto(fracaoDaDobra(30, 100, 0), 0.3, 1e-12);
  perto(fracaoDaDobra(30, 100, 1), 0, 1e-12);
  perto(fracaoDaDobra(30, 100, 2), 0, 1e-12);
  t.diagnostic('30 de 100 preenche 30% da primeira dobra');
});

test('fracaoDaDobra — a soma das dobras reconstrói o valor', (t) => {
  // A propriedade que garante que nada se perde nem se duplica no
  // empilhamento.
  const banda = 40;
  for (const valor of [0, 7, 40, 41, 99, 120, 160]) {
    let soma = 0;
    for (let k = 0; k < 4; k++) soma += fracaoDaDobra(valor, banda, k) * banda;
    perto(soma, Math.min(valor, banda * 4), 1e-9);
  }
  t.diagnostic('sete valores reconstruídos a partir das dobras');
});

test('fracaoDaDobra — negativo não contribui para as camadas positivas', (t) => {
  // Se contribuísse, o espelhamento viraria soma e um vale apareceria
  // como pico somado ao positivo do período.
  perto(fracaoDaDobra(-250, 100, 0, 1), 0, 1e-12, 'camada positiva precisa ignorar o negativo');
  perto(fracaoDaDobra(-250, 100, 0, -1), 1, 1e-12, 'e a camada negativa precisa usá-lo');
  perto(fracaoDaDobra(250, 100, 0, -1), 0, 1e-12, 'e vice-versa');
  t.diagnostic('sinais separados');
});

test('fracaoDaDobra — valores inválidos e banda zero devolvem 0', (t) => {
  perto(fracaoDaDobra(null, 100, 0), 0, 1e-12);
  perto(fracaoDaDobra(NaN, 100, 0), 0, 1e-12);
  perto(fracaoDaDobra(50, 0, 0), 0, 1e-12, 'banda zero dividiria por zero');
  t.diagnostic('casos degenerados tratados');
});

test('dobraDoValor — diz em qual camada a cor foi parar', (t) => {
  assert.equal(dobraDoValor(30, 100, 3), 1);
  assert.equal(dobraDoValor(100, 100, 3), 1, 'exatamente no limite, ainda é a primeira');
  assert.equal(dobraDoValor(101, 100, 3), 2);
  assert.equal(dobraDoValor(250, 100, 3), 3);
  assert.equal(dobraDoValor(-250, 100, 3), 3, 'o sinal não muda a dobra, só a cor');
  assert.equal(dobraDoValor(99999, 100, 3), 3, 'nunca passa do número de dobras');
  assert.equal(dobraDoValor(0, 100, 3), 1);
  assert.equal(dobraDoValor(null, 100, 3), null);
  t.diagnostic('oito casos conferidos');
});

test('ordenarFaixas — cada ordem faz o que promete', (t) => {
  const series = [
    { rotulo: 'zebra', valores: [1, 1, 1] },
    { rotulo: 'abelha', valores: [10, 0, 0] },
    { rotulo: 'macaco', valores: [2, 2, 2] },
  ];
  assert.deepEqual(ordenarFaixas(series, 'total').map((s) => s.rotulo), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarFaixas(series, 'pico').map((s) => s.rotulo), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarFaixas(series, 'alfabetica').map((s) => s.rotulo), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarFaixas(series, 'consulta').map((s) => s.rotulo), ['zebra', 'abelha', 'macaco']);
  t.diagnostic('quatro ordens conferidas');
});

/* ---------------------------- desenho ---------------------------- */

test('horizon_chart — uma faixa por série e uma camada por dobra', (t) => {
  const r = renderizar('comPivo', { dobras: 3 });
  try {
    assert.ok(r.faixas.length > 1, 'faltaram faixas');
    assert.ok(r.dobras.length > 0, 'faltaram camadas');

    const positivas = r.dobras.filter((d) => d.sinal === 'positivo');
    assert.equal(
      positivas.length,
      r.faixas.length * 3,
      `esperadas ${r.faixas.length * 3} camadas positivas, vieram ${positivas.length}`
    );
    const numeros = new Set(positivas.map((d) => d.dobra));
    assert.deepEqual([...numeros].sort(), [1, 2, 3], 'as três dobras precisam existir');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.faixas.length} faixas × 3 dobras`);
});

test('horizon_chart — as faixas têm a mesma altura e não se sobrepõem', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.faixas.length > 1, 'poucas faixas');
    const alturas = new Set(r.faixas.map((f) => f.altura.toFixed(2)));
    assert.equal(alturas.size, 1, 'todas as faixas precisam ter a mesma altura');

    const ordenadas = r.faixas.slice().sort((a, b) => a.y - b.y);
    for (let i = 1; i < ordenadas.length; i++) {
      assert.ok(
        ordenadas[i].y >= ordenadas[i - 1].y + ordenadas[i - 1].altura - 0.01,
        `as faixas ${i - 1} e ${i} se sobrepõem`
      );
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.faixas.length} faixas de ${r.faixas[0].altura.toFixed(1)}px`);
});

test('horizon_chart — nenhuma camada sai da própria faixa', (t) => {
  // Uma camada que vazasse para a faixa de cima seria lida como dado da
  // outra série — e, empilhado, ninguém notaria.
  const r = renderizar('comPivo', { dobras: 3 });
  try {
    assert.ok(r.dobras.length > 0, 'nenhuma camada');
    const ordenadas = r.faixas.slice().sort((a, b) => a.y - b.y);
    const topo = ordenadas[0].y;
    const base = ordenadas[ordenadas.length - 1].y + ordenadas[ordenadas.length - 1].altura;

    let conferidas = 0;
    for (const camada of r.dobras) {
      const ys = coordenadasY(camada.d);
      if (!ys.length) continue;
      assert.ok(Math.min(...ys) >= topo - 0.5, `camada acima do topo (${Math.min(...ys).toFixed(1)})`);
      assert.ok(Math.max(...ys) <= base + 0.5, `camada abaixo da base (${Math.max(...ys).toFixed(1)})`);
      conferidas += 1;
    }
    assert.ok(conferidas > 0, 'nenhuma camada tinha coordenadas — o teste não conferiu nada');
    t.diagnostic(`${conferidas} camadas contidas`);
  } finally {
    r.fim();
  }
});

test('horizon_chart — a dobra mais alta é a cor mais forte', (t) => {
  // "Mais escuro = maior" é a chave de leitura inteira do gráfico. Se a
  // ordem das cores se invertesse, o gráfico continuaria bonito e diria o
  // contrário do que os dados dizem.
  const r = renderizar('comPivo', { dobras: 3, escalaDeCor: 'azul' });
  try {
    const porDobra = new Map();
    for (const camada of r.dobras) {
      if (camada.sinal !== 'positivo') continue;
      porDobra.set(camada.dobra, camada.cor);
    }
    assert.equal(porDobra.size, 3, 'as três dobras precisam ter cor');

    const luminancia = (cor) => {
      const rgb = (cor.match(/\d+/g) || []).slice(0, 3).map(Number);
      assert.equal(rgb.length, 3, `não consegui ler a cor "${cor}"`);
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const l1 = luminancia(porDobra.get(1));
    const l2 = luminancia(porDobra.get(2));
    const l3 = luminancia(porDobra.get(3));
    assert.ok(l1 > l2, `a dobra 1 deveria ser mais clara que a 2 (${l1.toFixed(0)} vs ${l2.toFixed(0)})`);
    assert.ok(l2 > l3, `a dobra 2 deveria ser mais clara que a 3 (${l2.toFixed(0)} vs ${l3.toFixed(0)})`);
    t.diagnostic(`luminâncias: ${l1.toFixed(0)} → ${l2.toFixed(0)} → ${l3.toFixed(0)}`);
  } finally {
    r.fim();
  }
});

test('horizon_chart — mudar o número de dobras muda as camadas', (t) => {
  const duas = renderizar('comPivo', { dobras: 2 });
  const quatro = renderizar('comPivo', { dobras: 4 });
  try {
    const positivas = (r) => r.dobras.filter((d) => d.sinal === 'positivo').length;
    assert.ok(positivas(duas) > 0 && positivas(quatro) > 0);
    assert.equal(positivas(quatro) / positivas(duas), 2, '4 dobras produzem o dobro das camadas de 2');
    assert.match(duas.nota, /2 dobras/);
    assert.match(quatro.nota, /4 dobras/);
  } finally {
    duas.fim();
    quatro.fim();
  }
  t.diagnostic('contagem de camadas acompanha as dobras');
});

test('horizon_chart — acima de 4 dobras o gráfico avisa', (t) => {
  // A recomendação da pesquisa é 2 ou 3; permitir mais sem avisar deixaria
  // o usuário degradar a leitura achando que está melhorando.
  const r = renderizar('comPivo', { dobras: 6 });
  try {
    assert.match(r.aviso, /2 ou 3/, 'faltou a recomendação');
    assert.match(r.aviso, /só "escuro"|escuro/i);
  } finally {
    r.fim();
  }
  t.diagnostic(r.aviso.slice(0, 80));
});

test('horizon_chart — a legenda dá significado à cor', (t) => {
  // Sem os intervalos, a cor é só uma cor.
  const comLegenda = renderizar('comPivo', { dobras: 3, mostrarLegendaDeDobras: true });
  try {
    assert.ok(comLegenda.legenda.length >= 6, 'faltaram entradas na legenda (retângulo + texto por dobra)');
    const textos = comLegenda.legenda
      .filter((el) => el.tagName.toLowerCase() === 'text')
      .map((el) => el.textContent);
    assert.ok(textos.length >= 3, 'cada dobra precisa de um intervalo escrito');
    for (const texto of textos) {
      assert.match(texto, /–|negativo/, `entrada de legenda sem intervalo: "${texto}"`);
    }
  } finally {
    comLegenda.fim();
  }

  const sem = renderizar('comPivo', { mostrarLegendaDeDobras: false });
  try {
    assert.equal(sem.legenda.length, 0, 'desligada, a legenda não pode aparecer');
  } finally {
    sem.fim();
  }
  t.diagnostic('legenda conferida nos dois modos');
});

test('horizon_chart — a nota explica a construção e a escala compartilhada', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.match(r.nota, /mais escuro, maior/i, 'a chave de leitura precisa estar escrita');
    assert.match(r.nota, /DOBRADA, não cortada/i, 'e a construção também');
    assert.match(r.nota, /escala compartilhada/i);
    assert.match(r.nota, /\d+ dobras de /);
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 110));
});

test('horizon_chart — consulta vazia explica em vez de quebrar', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.dobras.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
