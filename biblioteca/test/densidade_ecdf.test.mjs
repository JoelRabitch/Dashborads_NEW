/**
 * densidade_ecdf.test.mjs — testes de Densidade e ECDF.
 *
 * A ECDF não tem parâmetro: ou ela está certa, ou está errada. Então ela é
 * testada contra a definição (monótona, k/n no k-ésimo valor, termina em
 * 1). A densidade tem um parâmetro, e o que se testa nela é justamente que
 * o parâmetro MUDA o resultado — e que o resultado continua sendo uma
 * densidade (integra 1).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { densidadePorKernel, resumoDeDistribuicao } from '../src/core/estatistica.js';
import { montarEcdf, fracaoAbaixoDe } from '../src/charts/densidade_ecdf/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'densidade_ecdf.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.densidade_ecdf;
  assert.ok(definicao, 'densidade_ecdf não se registrou');

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
    curvas: Array.from(palco.querySelectorAll('path.de-curva')),
    escadas: Array.from(palco.querySelectorAll('path.de-escada')),
    titulos: Array.from(palco.querySelectorAll('.de-titulo-painel')).map((t) => t.textContent),
    nota: palco.querySelector('.de-nota')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/** Coordenadas de um caminho SVG, como pares (x, y). */
function coordenadas(caminho) {
  const numeros = (caminho.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const pares = [];
  for (let i = 0; i + 1 < numeros.length; i += 2) pares.push({ x: numeros[i], y: numeros[i + 1] });
  return pares;
}

/* ----------------------------- ECDF ------------------------------ */

test('ECDF — o k-ésimo valor ordenado está exatamente em k/n', (t) => {
  // É a definição. Qualquer outra coisa é outro gráfico.
  const ecdf = montarEcdf([30, 10, 50, 20, 40]);
  assert.deepEqual(ecdf.map((p) => p.x), [10, 20, 30, 40, 50]);
  for (let i = 0; i < 5; i++) perto(ecdf[i].p, (i + 1) / 5, 1e-12);
  t.diagnostic('cinco degraus em 0,2 · 0,4 · 0,6 · 0,8 · 1,0');
});

test('ECDF — é monótona e termina em 1', (t) => {
  const valores = Array.from({ length: 500 }, (_, i) => Math.sin(i) * 100);
  const ecdf = montarEcdf(valores);

  for (let i = 1; i < ecdf.length; i++) {
    assert.ok(ecdf[i].x >= ecdf[i - 1].x, 'o eixo X precisa ser crescente');
    assert.ok(ecdf[i].p >= ecdf[i - 1].p, 'a acumulada não pode descer');
  }
  perto(ecdf[ecdf.length - 1].p, 1, 1e-12);
  assert.ok(ecdf[0].p > 0, 'o primeiro degrau já vale 1/n, não zero');
  t.diagnostic(`${ecdf.length} degraus, termina em ${ecdf[ecdf.length - 1].p}`);
});

test('ECDF — subamostragem mantém a forma, os extremos e o p verdadeiro', (t) => {
  // 50.000 degraus não cabem em pixels. O que não pode é a subamostragem
  // inventar um `p` recontado sobre a amostra reduzida.
  const valores = Array.from({ length: 50000 }, (_, i) => i);
  const ecdf = montarEcdf(valores);

  assert.ok(ecdf.length < 1300, `${ecdf.length} degraus — deveria ter subamostrado`);
  assert.equal(ecdf[0].x, 0, 'o menor valor precisa estar lá');
  assert.equal(ecdf[ecdf.length - 1].x, 49999, 'o maior também');
  perto(ecdf[ecdf.length - 1].p, 1, 1e-12);

  // O p de cada degrau mantido é o da amostra INTEIRA.
  const meio = ecdf[Math.floor(ecdf.length / 2)];
  perto(meio.p, (meio.x + 1) / 50000, 1e-12);
  t.diagnostic(`50.000 valores em ${ecdf.length} degraus, p preservado`);
});

test('ECDF — valores repetidos não quebram a monotonia', (t) => {
  const ecdf = montarEcdf([5, 5, 5, 5, 9]);
  assert.equal(ecdf.length, 5);
  perto(ecdf[3].p, 0.8, 1e-12);
  perto(ecdf[4].p, 1, 1e-12);
  t.diagnostic('empates tratados');
});

test('ECDF — nulos e não-finitos ficam de fora da contagem', (t) => {
  const ecdf = montarEcdf([1, null, 2, NaN, 3, Infinity]);
  assert.equal(ecdf.length, 3);
  perto(ecdf[0].p, 1 / 3, 1e-12);
  t.diagnostic('3 observações válidas de 6 entradas');
});

test('fracaoAbaixoDe — busca binária bate com a contagem direta', (t) => {
  const ordenados = Array.from({ length: 1000 }, (_, i) => i).sort((a, b) => a - b);
  for (const limite of [-5, 0, 1, 499.5, 500, 999, 1500]) {
    const direta = ordenados.filter((v) => v <= limite).length / ordenados.length;
    perto(fracaoAbaixoDe(ordenados, limite), direta, 1e-12);
  }
  t.diagnostic('sete limites conferidos contra a contagem direta');
});

/* --------------------------- densidade --------------------------- */

test('densidade — a curva integra ≈ 1', (t) => {
  // É o que faz dela uma densidade. Se não integrasse 1, a altura não teria
  // significado nenhum e comparar dois grupos seria comparar nada.
  const valores = Array.from({ length: 400 }, (_, i) => Math.cos(i * 1.7) * 30 + 100);
  const resumo = resumoDeDistribuicao(valores);
  const r = densidadePorKernel({ valores, pontos: 2000 });

  let integral = 0;
  for (let i = 1; i < r.curva.length; i++) {
    const largura = r.curva[i].x - r.curva[i - 1].x;
    integral += ((r.curva[i].densidade + r.curva[i - 1].densidade) / 2) * largura;
  }
  assert.ok(Math.abs(integral - 1) < 0.02, `a integral deu ${integral.toFixed(4)}`);
  assert.ok(r.largura > 0 && r.largura < resumo.desvio * 2, 'banda automática fora de escala');
  t.diagnostic(`integral = ${integral.toFixed(4)}, banda = ${r.largura.toFixed(3)}`);
});

test('densidade — a largura de banda é que decide quantos picos existem', (t) => {
  // O ponto do gráfico inteiro. Duas modas bem separadas: com banda
  // pequena aparecem as duas; com banda grande viram uma só — e as duas
  // imagens são igualmente "corretas".
  const valores = [];
  for (let i = 0; i < 200; i++) valores.push(10 + (i % 10) * 0.1);
  for (let i = 0; i < 200; i++) valores.push(90 + (i % 10) * 0.1);

  const contarPicos = (curva) => {
    let picos = 0;
    for (let i = 1; i < curva.length - 1; i++) {
      if (curva[i].densidade > curva[i - 1].densidade && curva[i].densidade >= curva[i + 1].densidade) {
        picos += 1;
      }
    }
    return picos;
  };

  const estreita = densidadePorKernel({ valores, largura: 2, pontos: 400 });
  const larga = densidadePorKernel({ valores, largura: 60, pontos: 400 });

  assert.equal(contarPicos(estreita.curva), 2, 'com banda estreita as duas modas precisam aparecer');
  assert.equal(contarPicos(larga.curva), 1, 'com banda larga elas viram uma só');
  t.diagnostic('2 picos com banda 2, 1 pico com banda 60 — mesmos dados');
});

/* ---------------------------- desenho ---------------------------- */

test('densidade_ecdf — o padrão mostra as DUAS vistas', (t) => {
  // É o motivo de o gráfico existir: a ECDF mostra o que a suavização
  // escondeu. Mostrar só a densidade por padrão perderia o ponto.
  const r = renderizar('conjuntosPorItem');
  try {
    assert.ok(r.curvas.length > 0, 'faltou a densidade');
    assert.ok(r.escadas.length > 0, 'faltou a ECDF');
    assert.equal(r.curvas.length, r.escadas.length, 'uma de cada por grupo');
    assert.ok(r.titulos.some((titulo) => /estimada/i.test(titulo)), 'a densidade precisa se declarar estimada');
    assert.ok(r.titulos.some((titulo) => /exata/i.test(titulo)), 'a ECDF precisa se declarar exata');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.curvas.length} densidades + ${r.escadas.length} ECDFs`);
});

test('densidade_ecdf — a ECDF é desenhada como ESCADA, nunca suavizada', (t) => {
  // Entre duas observações consecutivas não há informação. A reta
  // horizontal diz isso; uma curva suave inventaria valores intermediários.
  const r = renderizar('conjuntosPorItem');
  try {
    for (const escada of r.escadas) {
      const d = escada.getAttribute('d') || '';
      assert.ok(!/[CQSTA]/.test(d), `a ECDF usou comando de curva: ${d.slice(0, 60)}`);

      // Cada degrau é um par (horizontal, vertical): ou o x não muda, ou
      // o y não muda, de um ponto para o próximo.
      const pontos = coordenadas(d);
      let diagonais = 0;
      for (let i = 1; i < pontos.length; i++) {
        const mudouX = Math.abs(pontos[i].x - pontos[i - 1].x) > 0.01;
        const mudouY = Math.abs(pontos[i].y - pontos[i - 1].y) > 0.01;
        if (mudouX && mudouY) diagonais += 1;
      }
      assert.equal(diagonais, 0, `${diagonais} segmentos diagonais numa escada`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic('escadas sem diagonal e sem curva');
});

test('densidade_ecdf — a ECDF sobe de 0 a 1 dentro do painel', (t) => {
  const r = renderizar('conjuntosPorItem');
  try {
    for (const escada of r.escadas) {
      const pontos = coordenadas(escada.getAttribute('d') || '');
      const ys = pontos.map((p) => p.y);
      assert.ok(Math.min(...ys) >= -1, 'a ECDF passou do topo do painel');
      assert.ok(Math.max(...ys) <= 561, 'a ECDF passou do rodapé');
      // Em SVG o y cresce para baixo: o fim da escada tem de estar ACIMA
      // do começo, porque a acumulada sobe.
      assert.ok(ys[ys.length - 1] < ys[0], 'a acumulada precisa subir');
    }
  } finally {
    r.fim();
  }
  t.diagnostic('escadas contidas e crescentes');
});

test('densidade_ecdf — a banda usada aparece escrita na tela', (t) => {
  // Ela é a hipótese do gráfico, não um detalhe de renderização.
  const r = renderizar('conjuntosPorItem');
  try {
    assert.match(r.nota, /banda/i, 'faltou declarar a largura de banda');
    assert.match(r.nota, /Silverman/i, 'e de onde ela veio');
    assert.match(r.nota, /um pico ou três/i, 'e o que ela decide');
    assert.match(r.nota, /sem parâmetro/i, 'a ECDF precisa se declarar sem parâmetro');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 90));
});

test('densidade_ecdf — banda informada substitui a automática e se declara', (t) => {
  const r = renderizar('conjuntosPorItem', { larguraDeBanda: 12345 });
  try {
    assert.match(r.nota, /informada/i, 'a banda informada precisa ser declarada como tal');
    assert.ok(!/Silverman/i.test(r.nota), 'e não pode continuar dizendo Silverman');
  } finally {
    r.fim();
  }
  t.diagnostic('banda informada conferida');
});

test('densidade_ecdf — cada modo desenha só o que promete', (t) => {
  const so = (modo) => renderizar('conjuntosPorItem', { painel: modo });

  const densidade = so('densidade');
  try {
    assert.ok(densidade.curvas.length > 0);
    assert.equal(densidade.escadas.length, 0, 'o modo "só densidade" não pode desenhar ECDF');
  } finally {
    densidade.fim();
  }

  const ecdf = so('ecdf');
  try {
    assert.ok(ecdf.escadas.length > 0);
    assert.equal(ecdf.curvas.length, 0, 'o modo "só ECDF" não pode desenhar densidade');
    assert.ok(!/banda/i.test(ecdf.nota), 'sem densidade, não há banda a declarar');
  } finally {
    ecdf.fim();
  }
  t.diagnostic('três modos conferidos');
});

test('densidade_ecdf — todas as curvas compartilham o mesmo eixo X', (t) => {
  // Se cada grupo tivesse a própria escala, as curvas empilhadas não
  // comparariam nada — e continuariam bonitas.
  const r = renderizar('conjuntosPorItem');
  try {
    const extremos = r.curvas.map((curva) => {
      const xs = coordenadas(curva.getAttribute('d') || '').map((p) => p.x);
      return { minimo: Math.min(...xs), maximo: Math.max(...xs) };
    });
    const inicios = new Set(extremos.map((e) => e.minimo.toFixed(2)));
    const fins = new Set(extremos.map((e) => e.maximo.toFixed(2)));
    assert.equal(inicios.size, 1, 'as densidades precisam começar no mesmo x');
    assert.equal(fins.size, 1, 'e terminar no mesmo x');
  } finally {
    r.fim();
  }
  t.diagnostic('eixo X compartilhado');
});

test('densidade_ecdf — consulta agregada explica em vez de desenhar', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.curvas.length, 0);
    assert.equal(r.escadas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});

test('densidade_ecdf — 5.000 observações renderizam sem erro', (t) => {
  const r = renderizar('grande5k', { campoDaCategoria: '' });
  try {
    assert.ok(r.curvas.length > 0 || r.escadas.length > 0, 'nada foi desenhado');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    for (const caminho of [...r.curvas, ...r.escadas]) {
      const d = caminho.getAttribute('d') || '';
      assert.ok(!/NaN|Infinity/.test(d), 'caminho com NaN/Infinity');
    }
  } finally {
    r.fim();
  }
  t.diagnostic('amostra única de 5.000 observações conferida');
});
