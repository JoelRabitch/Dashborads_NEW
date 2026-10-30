/**
 * violin.test.mjs — testes do Violin Plot.
 *
 * Um violino erra de dois jeitos que o olho não pega: normalizando cada
 * curva pelo próprio pico (fazendo um grupo de 3 observações parecer tão
 * robusto quanto um de 3.000) e deixando a cauda do kernel correr além dos
 * dados (desenhando densidade onde não há observação).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { montarViolinos } from '../src/charts/violin/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'violin.js');

const grupo = (chave, valores) => ({ chave, rotulo: chave, valores, indiceDaLinha: 0 });

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.violin;
  assert.ok(definicao, 'violin não se registrou');

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

  const corpos = Array.from(palco.querySelectorAll('.vl-corpo'));
  const larguraDe = (corpo) => {
    const d = corpo.getAttribute('d') || '';
    const xs = [...d.matchAll(/[ML](-?[\d.]+),/g)].map((m) => Number(m[1])).filter(Number.isFinite);
    return xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  };

  return {
    amb,
    palco,
    corpos,
    larguras: corpos.map(larguraDe),
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

test('violin — a curva não passa do mínimo nem do máximo reais', (t) => {
  // O kernel gaussiano tem cauda infinita. Deixá-la livre desenharia
  // densidade em valores que nunca foram observados.
  const [violino] = montarViolinos([grupo('a', [10, 12, 14, 16, 18])]);

  const xs = violino.curva.map((p) => p.x);
  assert.ok(Math.min(...xs) >= violino.resumo.minimo - 1e-9, 'a curva começou antes do mínimo real');
  assert.ok(Math.max(...xs) <= violino.resumo.maximo + 1e-9, 'a curva passou do máximo real');
  assert.equal(Math.min(...xs), 10);
  assert.equal(Math.max(...xs), 18);
  t.diagnostic(`curva de ${Math.min(...xs)} a ${Math.max(...xs)}`);
});

test('violin — o resumo e os limites vêm junto de cada violino', (t) => {
  const [violino] = montarViolinos([grupo('a', [1, 2, 3, 4, 5, 100])]);
  assert.equal(violino.resumo.n, 6);
  assert.equal(violino.resumo.mediana, 3.5);
  assert.ok(violino.limites.outliers.includes(100), 'o outlier precisa ser identificado');
  assert.equal(violino.limites.bigodeSuperior, 5, 'o bigode para no último valor real');
  assert.ok(violino.maximo > 0, 'faltou o pico da densidade');
  t.diagnostic(`n=${violino.resumo.n}, mediana=${violino.resumo.mediana}`);
});

test('violin — larguras comparáveis refletem o tamanho do grupo', (t) => {
  // Este é o ponto: com larguras comparáveis, um grupo pequeno PARECE
  // pequeno. Normalizando cada um pelo próprio pico, todos ficam iguais.
  const r = renderizar('grande5k');
  try {
    const distintas = new Set(r.larguras.map((l) => l.toFixed(0)));
    assert.ok(
      distintas.size > 2,
      `com larguras comparáveis os violinos deveriam diferir; vieram ${distintas.size} larguras`
    );
  } finally {
    r.fim();
  }

  const proprio = renderizar('grande5k', { larguraComparavel: false });
  try {
    const distintas = new Set(proprio.larguras.map((l) => l.toFixed(0)));
    assert.equal(
      distintas.size,
      1,
      `normalizando cada um pelo próprio pico, todos ficam na largura máxima; vieram ${distintas.size}`
    );
  } finally {
    proprio.fim();
  }
  t.diagnostic('os dois modos de largura se comportam como esperado');
});

test('violin — consulta já agregada explica por que não dá para desenhar', (t) => {
  // Um valor por categoria não é distribuição. Sem explicação, o usuário
  // conclui que o gráfico está quebrado.
  const r = renderizar('semPivo');
  try {
    assert.match(r.vazio, /um único valor/i, `faltou a explicação; veio: "${r.vazio}"`);
    assert.match(r.vazio, /sem agregar/i, 'a mensagem precisa dizer o que fazer no Explore');
    assert.equal(r.corpos.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio explicativo conferido');
});

test('violin — categorias demais são cortadas com aviso', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.corpos.length <= 30, `esperado no máximo 30 violinos, vieram ${r.corpos.length}`);
    assert.match(r.aviso, /categorias/, 'o corte precisa ser anunciado');
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.corpos.length} violinos`);
});

test('violin — grupos pequenos são marcados e explicados', (t) => {
  const r = renderizar('conjuntosPorItem');
  try {
    assert.match(
      r.aviso,
      /menos de \d+ observações/i,
      'uma densidade de poucos pontos precisa vir com ressalva'
    );
    const asteriscos = Array.from(r.palco.querySelectorAll('.vl-texto')).filter(
      (el) => el.textContent === '*'
    );
    assert.ok(asteriscos.length > 0, 'faltou a marca nos violinos pequenos');
  } finally {
    r.fim();
  }
  t.diagnostic('marcação de grupos pequenos conferida');
});

test('violin — nenhum contorno sai quebrado', (t) => {
  for (const fixture of ['grande5k', 'conjuntosPorItem']) {
    const r = renderizar(fixture);
    try {
      assert.ok(r.corpos.length > 0, `${fixture}: nenhum violino`);
      for (const corpo of r.corpos) {
        const d = corpo.getAttribute('d') || '';
        assert.ok(d.length > 10, `${fixture}: contorno vazio`);
        assert.ok(!/NaN|Infinity/.test(d), `${fixture}: contorno com NaN/Infinity`);
        assert.ok(d.endsWith('Z'), `${fixture}: o contorno precisa fechar`);
      }
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    } finally {
      r.fim();
    }
  }
  t.diagnostic('contornos conferidos');
});

test('violin — a nota declara o método usado', (t) => {
  // Quartis e densidade têm vários métodos que discordam entre si. Sem
  // declarar qual, o número fica sem procedência.
  const r = renderizar('grande5k');
  try {
    const nota = r.palco.querySelector('.vl-nota')?.textContent || '';
    assert.match(nota, /kernel/i, 'o método de densidade precisa estar declarado');
    assert.match(nota, /tipo 7/i, 'o método de quartil também');
  } finally {
    r.fim();
  }
  t.diagnostic('declaração de método conferida');
});
