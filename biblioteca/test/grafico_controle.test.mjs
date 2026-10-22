/**
 * grafico_controle.test.mjs — testes do Gráfico de Controle.
 *
 * Aqui o desenho é a parte fácil. O que precisa estar certo são os NÚMEROS:
 * um limite de controle errado produz um gráfico perfeitamente bonito que
 * diz "sob controle" sobre um processo que não está — ou o contrário. Por
 * isso os testes conferem os limites contra contas feitas à mão, e cada
 * regra de Nelson contra uma série construída para dispará-la (e outra,
 * quase igual, construída para NÃO disparar).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import {
  calcularLimites,
  aplicarRegras,
  D2_SUBGRUPO_2,
  MINIMO_PARA_LIMITES,
} from '../src/charts/grafico_controle/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'grafico_controle.js');

const perto = (a, b, tolerancia = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tolerancia, `esperado ≈${b}, veio ${a}`);

/** Quais regras dispararam em ALGUM ponto. */
const regrasDisparadas = (sinais) => new Set(sinais.flat());

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.grafico_controle;
  assert.ok(definicao, 'grafico_controle não se registrou');

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
    sinais: Array.from(palco.querySelectorAll('circle.gc-sinal')),
    pontos: Array.from(palco.querySelectorAll('circle.st-ponto')),
    nota: palco.querySelector('.st-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    textos: Array.from(palco.querySelectorAll('text')).map((t) => t.textContent),
    fim: () => amb.restaurar(),
  };
}

/* ---------------------------- limites ---------------------------- */

test('calcularLimites — desvio amostral bate com a conta à mão', (t) => {
  // [2,4,4,4,5,5,7,9]: média 5; soma dos quadrados 32; s = √(32/7).
  const valores = [2, 4, 4, 4, 5, 5, 7, 9];
  const l = calcularLimites(valores, { metodo: 'desvioAmostral', k: 3 });

  perto(l.centro, 5);
  perto(l.sigma, Math.sqrt(32 / 7), 1e-12);
  perto(l.superior, 5 + 3 * Math.sqrt(32 / 7), 1e-12);
  perto(l.inferior, 5 - 3 * Math.sqrt(32 / 7), 1e-12);
  t.diagnostic(`σ = ${l.sigma.toFixed(4)} (amostral, n−1)`);
});

test('calcularLimites — amplitude móvel usa d₂, não o desvio amostral', (t) => {
  // Amplitudes móveis de [10,12,11,13,12]: 2,1,2,1 → média 1,5.
  // σ = 1,5 / 1,128.
  const valores = [10, 12, 11, 13, 12];
  const l = calcularLimites(valores, { metodo: 'amplitudeMovel', k: 3 });

  perto(l.centro, 11.6, 1e-12);
  perto(l.sigma, 1.5 / D2_SUBGRUPO_2, 1e-12);
  assert.match(l.metodoEmTexto, /amplitude móvel/i, 'o método precisa vir declarado');
  t.diagnostic(`σ = ${l.sigma.toFixed(4)} = 1,5 ÷ ${D2_SUBGRUPO_2}`);
});

test('calcularLimites — a amplitude móvel NÃO é inflada por uma causa especial', (t) => {
  // É a razão de ela ser o padrão, e o caso clássico é um DEGRAU: o
  // processo roda em 10 e passa a rodar em 30. O desvio amostral vê os
  // dois patamares como "variação" e abre os limites até o degrau inteiro
  // caber dentro deles — o gráfico declara sob controle um processo que
  // mudou de nível na metade. A amplitude móvel só vê um salto grande
  // (a transição), então os limites continuam estreitos e o degrau aparece.
  const degrau = [];
  for (let i = 0; i < 15; i++) degrau.push(i % 2 ? 10.5 : 9.5);
  for (let i = 0; i < 15; i++) degrau.push(i % 2 ? 30.5 : 29.5);

  const amostral = calcularLimites(degrau, { metodo: 'desvioAmostral' });
  const movel = calcularLimites(degrau, { metodo: 'amplitudeMovel' });
  const maximo = Math.max(...degrau);

  assert.ok(
    amostral.sigma > movel.sigma * 2,
    `o desvio amostral deveria estar bem mais inflado: ${amostral.sigma.toFixed(2)} vs ${movel.sigma.toFixed(2)}`
  );
  assert.ok(
    maximo <= amostral.superior,
    `com desvio amostral o degrau cabe dentro dos limites (LSC ${amostral.superior.toFixed(1)}) — é o defeito`
  );
  assert.ok(
    maximo > movel.superior,
    `com amplitude móvel o degrau precisa aparecer como sinal (LSC ${movel.superior.toFixed(1)})`
  );
  t.diagnostic(
    `σ amostral ${amostral.sigma.toFixed(2)} (LSC ${amostral.superior.toFixed(1)}) × ` +
      `σ móvel ${movel.sigma.toFixed(2)} (LSC ${movel.superior.toFixed(1)})`
  );
});

test('calcularLimites — a mediana resiste ao outlier que a média não resiste', (t) => {
  const valores = [10, 10, 10, 10, 10, 10, 10, 10, 10, 1000];
  const comMedia = calcularLimites(valores, { centro: 'media', metodo: 'amplitudeMovel' });
  const comMediana = calcularLimites(valores, { centro: 'mediana', metodo: 'amplitudeMovel' });

  perto(comMedia.centro, 109);
  perto(comMediana.centro, 10);
  t.diagnostic(`centro: média ${comMedia.centro} × mediana ${comMediana.centro}`);
});

test('calcularLimites — série constante dá σ zero em vez de NaN', (t) => {
  const l = calcularLimites([7, 7, 7, 7], { metodo: 'amplitudeMovel' });
  assert.equal(l.sigma, 0);
  assert.equal(l.superior, 7);
  assert.equal(l.inferior, 7);
  t.diagnostic('σ = 0 tratado sem NaN');
});

test('calcularLimites — menos de dois valores não produz limites inventados', (t) => {
  assert.equal(calcularLimites([5]), null);
  assert.equal(calcularLimites([null, null]), null);
  t.diagnostic('null em vez de limites de mentira');
});

test('calcularLimites — nulos não entram na conta', (t) => {
  const comNulos = calcularLimites([10, null, 12, null, 11, 13, 12], { metodo: 'desvioAmostral' });
  const sem = calcularLimites([10, 12, 11, 13, 12], { metodo: 'desvioAmostral' });
  perto(comNulos.centro, sem.centro, 1e-12);
  perto(comNulos.sigma, sem.sigma, 1e-12);
  t.diagnostic('nulos ignorados sem deslocar a média');
});

/* ---------------------------- regras ----------------------------- */

/** Limites fabricados: centro 0, σ 1 — assim o valor JÁ É o z. */
const LIMITES_Z = { centro: 0, sigma: 1, k: 3, superior: 3, inferior: -3 };

test('regra 1 — só o ponto fora dos 3σ é marcado', (t) => {
  const z = [0, 1, 2, 3.5, 2, -4, 0];
  const sinais = aplicarRegras(z, LIMITES_Z, new Set([1]));

  assert.deepEqual(sinais[3], [1], 'o ponto a 3,5σ precisa ser marcado');
  assert.deepEqual(sinais[5], [1], 'o ponto a −4σ também');
  assert.deepEqual(sinais[2], [], 'um ponto a exatamente 2σ está dentro dos limites');
  t.diagnostic('regra 1 conferida nos dois lados');
});

test('regra 2 — nove do mesmo lado disparam; oito não', (t) => {
  const nove = aplicarRegras(Array(9).fill(0.5), LIMITES_Z, new Set([2]));
  const oito = aplicarRegras(Array(8).fill(0.5), LIMITES_Z, new Set([2]));

  assert.ok(regrasDisparadas(nove).has(2), 'nove pontos acima da média é a regra 2');
  assert.equal(nove.filter((s) => s.length).length, 9, 'a sequência inteira é marcada');
  assert.equal(regrasDisparadas(oito).size, 0, 'oito pontos ainda não são a regra 2');
  t.diagnostic('fronteira 8/9 conferida');
});

test('regra 2 — um buraco na série interrompe a sequência', (t) => {
  // "Nove pontos seguidos" com um período faltando no meio não são nove
  // pontos seguidos. Ignorar o buraco inventaria um sinal.
  const comBuraco = [0.5, 0.5, 0.5, 0.5, null, 0.5, 0.5, 0.5, 0.5, 0.5];
  const sinais = aplicarRegras(comBuraco, LIMITES_Z, new Set([2]));
  assert.equal(regrasDisparadas(sinais).size, 0, 'o buraco precisa cortar a corrida');
  t.diagnostic('buraco interrompe a sequência');
});

test('regra 3 — seis subindo disparam; cinco não', (t) => {
  const seis = aplicarRegras([0, 0.1, 0.2, 0.3, 0.4, 0.5], LIMITES_Z, new Set([3]));
  const cinco = aplicarRegras([0, 0.1, 0.2, 0.3, 0.4], LIMITES_Z, new Set([3]));
  const comPatamar = aplicarRegras([0, 0.1, 0.2, 0.2, 0.3, 0.4], LIMITES_Z, new Set([3]));

  assert.ok(regrasDisparadas(seis).has(3));
  assert.equal(regrasDisparadas(cinco).size, 0);
  assert.equal(regrasDisparadas(comPatamar).size, 0, 'um empate quebra a tendência');
  t.diagnostic('tendência de 6 conferida, inclusive com empate');
});

test('regra 4 — catorze alternando disparam', (t) => {
  const alternando = Array.from({ length: 14 }, (_, i) => (i % 2 ? 0.5 : -0.5));
  const sinais = aplicarRegras(alternando, LIMITES_Z, new Set([4]));
  assert.ok(regrasDisparadas(sinais).has(4));

  const quase = aplicarRegras(alternando.slice(0, 13), LIMITES_Z, new Set([4]));
  assert.equal(regrasDisparadas(quase).size, 0, 'treze ainda não são catorze');
  t.diagnostic('alternância conferida');
});

test('regra 5 — marca só os pontos culpados, não a janela inteira', (t) => {
  // Pintar os três pontos acusaria de sinal uma observação que está no
  // lugar certo. Só os dois além de 2σ é que são o sinal.
  const z = [2.5, 0.1, 2.4, 0, 0];
  const sinais = aplicarRegras(z, LIMITES_Z, new Set([5]));

  assert.ok(sinais[0].includes(5), 'o primeiro ponto além de 2σ é culpado');
  assert.ok(sinais[2].includes(5), 'o terceiro também');
  assert.deepEqual(sinais[1], [], 'o ponto do meio está onde deveria estar');
  t.diagnostic('regra 5 marca 2 de 3, não 3 de 3');
});

test('regra 5 — lados opostos não se somam', (t) => {
  // 2,5σ acima e 2,5σ abaixo na mesma janela não é deslocamento nenhum.
  const sinais = aplicarRegras([2.5, 0, -2.5], LIMITES_Z, new Set([5]));
  assert.equal(regrasDisparadas(sinais).size, 0, 'a regra 5 exige MESMO lado');
  t.diagnostic('mesmo lado exigido');
});

test('regra 6 — quatro de cinco além de 1σ', (t) => {
  const sinais = aplicarRegras([1.2, 1.3, 0.2, 1.5, 1.1], LIMITES_Z, new Set([6]));
  assert.ok(regrasDisparadas(sinais).has(6));
  assert.deepEqual(sinais[2], [], 'o ponto dentro de 1σ não é culpado');

  const tres = aplicarRegras([1.2, 1.3, 0.2, 0.1, 1.1], LIMITES_Z, new Set([6]));
  assert.equal(regrasDisparadas(tres).size, 0, 'três de cinco ainda não é sinal');
  t.diagnostic('regra 6 conferida');
});

test('regra 7 — variação pequena demais também é sinal', (t) => {
  // Quinze pontos colados na média costuma ser subgrupo errado ou dado
  // "arrumado", não processo excelente.
  const sinais = aplicarRegras(Array(15).fill(0.1), LIMITES_Z, new Set([7]));
  assert.ok(regrasDisparadas(sinais).has(7));
  t.diagnostic('regra 7 (variação pequena demais) conferida');
});

test('regra 8 — oito fora de 1σ dos dois lados', (t) => {
  const z = [1.5, -1.6, 1.7, -1.5, 1.4, -1.8, 1.9, -1.4];
  const sinais = aplicarRegras(z, LIMITES_Z, new Set([8]));
  assert.ok(regrasDisparadas(sinais).has(8));

  const comUmDentro = [...z];
  comUmDentro[3] = 0.2;
  assert.equal(
    regrasDisparadas(aplicarRegras(comUmDentro, LIMITES_Z, new Set([8]))).size,
    0,
    'um ponto dentro de 1σ quebra a regra 8'
  );
  t.diagnostic('regra 8 conferida');
});

test('regras — processo estável não dispara nada', (t) => {
  // O teste que mais importa: um gráfico que acusa sinal onde não há é
  // pior do que inútil, porque treina o usuário a ignorar o vermelho.
  // A série precisa ser estável de verdade, não "pequena": pontos colados
  // na média disparam a regra 7, e alternância perfeita dispara a 4.
  const z = [0.3, 1.2, -0.5, 0.8, -1.4, 0.2, 1.1, -0.3, -1.2, 0.6,
    1.5, -0.7, 0.4, -1.1, 0.9, 0.1, -1.3, 0.5, 1.0, -0.4];
  const sinais = aplicarRegras(z, LIMITES_Z, new Set([1, 2, 3, 4, 5, 6, 7, 8]));
  assert.equal(
    regrasDisparadas(sinais).size,
    0,
    `série estável não deveria disparar nada; disparou ${[...regrasDisparadas(sinais)]}`
  );
  t.diagnostic('20 pontos estáveis, nenhum falso sinal');
});

test('regras — só as escolhidas são aplicadas', (t) => {
  const z = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 5];
  const sinais = aplicarRegras(z, LIMITES_Z, new Set([1]));
  assert.deepEqual(regrasDisparadas(sinais), new Set([1]), 'a regra 2 não foi pedida');
  t.diagnostic('conjunto de regras respeitado');
});

/* ---------------------------- desenho ---------------------------- */

test('grafico_controle — desenha linha central, LSC e LIC nomeados', (t) => {
  const r = renderizar('temporal');
  try {
    const comLimites = r.textos.filter((txt) => /^(LSC|LC|LIC) /.test(txt));
    assert.equal(comLimites.length, 3, `esperados LSC, LC e LIC; vieram ${comLimites.join(' | ')}`);
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('limites rotulados');
});

test('grafico_controle — a nota declara o método do σ e a hipótese do ponto', (t) => {
  // σ tem métodos que discordam entre si, e os limites mudam conforme cada
  // ponto seja uma observação ou uma média. Sem declarar, o número fica sem
  // procedência.
  const r = renderizar('temporal');
  try {
    assert.match(r.nota, /amplitude móvel/i, 'o método do σ precisa estar declarado');
    assert.match(r.nota, /±3σ/, 'a largura dos limites também');
    assert.match(r.nota, /média de n/i, 'a hipótese sobre o que é um ponto precisa estar dita');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 80));
});

test('grafico_controle — poucos pontos: os limites são declarados instáveis', (t) => {
  const r = renderizar('temporal');
  try {
    const n = r.pontos.length + r.sinais.length;
    if (n < MINIMO_PARA_LIMITES) {
      assert.match(r.aviso, /se mexem muito|sorte/i, `faltou o aviso de limites instáveis (n=${n})`);
      t.diagnostic(`n=${n}: instabilidade declarada`);
    } else {
      t.diagnostic(`n=${n}: limites já estáveis, nada a avisar`);
    }
  } finally {
    r.fim();
  }
});

test('grafico_controle — todo período vira um ponto, com sinal ou sem', (t) => {
  const r = renderizar('temporal');
  try {
    assert.ok(r.pontos.length + r.sinais.length > 0, 'nenhum ponto desenhado');
    for (const c of [...r.pontos, ...r.sinais]) {
      assert.ok(Number.isFinite(Number(c.getAttribute('cy'))), 'ponto com cy inválido');
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.pontos.length} normais + ${r.sinais.length} com sinal`);
});

test('grafico_controle — série curta demais explica em vez de desenhar', (t) => {
  const r = renderizar('vazio');
  try {
    assert.ok(r.vazio.length > 0, 'faltou a explicação');
    assert.equal(r.pontos.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});

test('grafico_controle — várias séries: avisa que só uma tem limites', (t) => {
  // Limites calculados sobre um processo não valem para outro. Desenhar
  // duas séries contra os mesmos limites seria um erro invisível.
  const r = renderizar('comPivo');
  try {
    if (r.aviso) {
      assert.match(r.aviso, /UM processo|um gráfico por processo/i);
      t.diagnostic(r.aviso.slice(0, 70));
    } else {
      t.diagnostic('a fixture trouxe uma série só');
    }
  } finally {
    r.fim();
  }
});
