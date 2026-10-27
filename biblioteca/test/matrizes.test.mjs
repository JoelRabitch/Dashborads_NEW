/**
 * matrizes.test.mjs — testes de `matriz_2x2` e `matriz_bcg`.
 *
 * Os dois compartilham o desenho com `quadrant_scatter` (em
 * `src/charts/_quadrantes/`), então o que importa testar aqui é o que cada
 * um faz de DIFERENTE: os nomes dos quadrantes, os cortes padrão e, no caso
 * da BCG, o eixo X invertido — que é onde um erro de sinal colocaria
 * "Estrela" no lugar de "Abacaxi" sem ninguém perceber.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// BL_DIST permite rodar contra outro diretório de bundles (reprodução).
const DIR_DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

function renderizar(id, nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIR_DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  assert.ok(definicao, `${id} não se registrou`);

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

  const textosDeQuadrante = Array.from(palco.querySelectorAll('.qd-rotulo-quadrante')).map((t) => t.textContent);
  const textosDeEixo = Array.from(palco.querySelectorAll('.bl-eixos text')).map((t) => t.textContent);

  return {
    amb,
    palco,
    textosDeQuadrante,
    textosDeEixo,
    rotulosDePonto: Array.from(palco.querySelectorAll('.qd-rotulo-ponto')).map((t) => t.textContent),
    fim: () => amb.restaurar(),
  };
}

test('matriz_2x2 — nomes de decisão nos quatro quadrantes', (t) => {
  const r = renderizar('matriz_2x2', 'semPivo');
  try {
    for (const nome of ['Prioridade', 'Rever', 'Descartar', 'Oportunidade']) {
      assert.ok(
        r.textosDeQuadrante.some((texto) => texto.includes(nome)),
        `faltou o quadrante "${nome}"; veio: ${r.textosDeQuadrante.join(' | ')}`
      );
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`quadrantes: ${r.textosDeQuadrante.join(' | ')}`);
});

test('matriz_2x2 — rotula todos os itens, não só alguns', (t) => {
  const r = renderizar('matriz_2x2', 'semPivo');
  try {
    const { data } = FIXTURES.semPivo();
    assert.equal(
      r.rotulosDePonto.length,
      data.length,
      `uma matriz de decisão precisa nomear todos os ${data.length} itens`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.rotulosDePonto.length} itens rotulados`);
});

test('matriz_bcg — os quatro nomes clássicos aparecem', (t) => {
  const r = renderizar('matriz_bcg', 'semPivo');
  try {
    for (const nome of ['Estrela', 'Ponto de interrogação', 'Vaca leiteira', 'Abacaxi']) {
      assert.ok(
        r.textosDeQuadrante.some((texto) => texto.includes(nome)),
        `faltou o quadrante "${nome}"; veio: ${r.textosDeQuadrante.join(' | ')}`
      );
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`quadrantes: ${r.textosDeQuadrante.join(' | ')}`);
});

test('matriz_bcg — eixo X invertido põe participação alta à ESQUERDA', (t) => {
  const r = renderizar('matriz_bcg', 'semPivo');
  try {
    const svg = r.palco.querySelector('.qd-svg');
    const porNome = new Map();
    for (const el of r.palco.querySelectorAll('.qd-rotulo-quadrante')) {
      porNome.set(el.textContent.trim(), Number(el.getAttribute('x')));
    }
    const estrela = porNome.get('Estrela');
    const interrogacao = porNome.get('Ponto de interrogação');
    assert.ok(Number.isFinite(estrela) && Number.isFinite(interrogacao), 'faltaram os dois quadrantes de cima');
    assert.ok(
      estrela < interrogacao,
      `"Estrela" (participação alta) tem que ficar à esquerda de "Ponto de interrogação"; x=${estrela} vs ${interrogacao}`
    );
    assert.ok(svg, 'o SVG do gráfico precisa existir');
  } finally {
    r.fim();
  }
  t.diagnostic('orientação do eixo invertido conferida');
});

test('matriz_bcg — títulos dos eixos saem com as convenções da matriz', (t) => {
  const r = renderizar('matriz_bcg', 'semPivo');
  try {
    assert.ok(
      r.textosDeEixo.includes('Participação relativa de mercado'),
      `faltou o título do eixo X; veio: ${r.textosDeEixo.slice(-4).join(', ')}`
    );
    assert.ok(r.textosDeEixo.includes('Crescimento'), 'faltou o título do eixo Y');
  } finally {
    r.fim();
  }
  t.diagnostic('títulos dos eixos conferidos');
});

test('matriz_bcg — participação relativa divide pelo maior CONCORRENTE', (t) => {
  // Com a divisória em 1, o líder (e só ele) fica do lado da participação
  // alta. Se a normalização dividisse pelo próprio maior valor, o líder
  // sairia exatamente em 1,0 e NENHUM item ficaria desse lado.
  const r = renderizar('matriz_bcg', 'semPivo', { mostrarContagemPorQuadrante: true });
  try {
    const ladoAlto = r.textosDeQuadrante
      .filter((texto) => texto.startsWith('Estrela') || texto.startsWith('Vaca leiteira'))
      .map((texto) => Number(/\((\d+)\)/.exec(texto)?.[1] ?? 0));
    assert.ok(
      ladoAlto.reduce((a, b) => a + b, 0) >= 1,
      `o líder precisa cair do lado "participação alta"; veio: ${r.textosDeQuadrante.join(' | ')}`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`quadrantes: ${r.textosDeQuadrante.join(' | ')}`);
});

test('matriz_bcg — sem dois valores positivos em X, avisa em vez de inventar', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(join(DIR_DIST, 'matriz_bcg.js'), 'utf8'));
    const definicao = amb.registro.matriz_bcg;
    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const palco = amb.window.document.getElementById('palco');

    const celula = (v) => ({ value: v, rendered: String(v) });
    const data = [
      { produto: celula('A'), share: celula(0), crescimento: celula(5) },
      { produto: celula('B'), share: celula(0), crescimento: celula(8) },
    ];
    const queryResponse = {
      fields: {
        dimension_like: [{ name: 'produto', label: 'Produto', label_short: 'Produto', type: 'string' }],
        measure_like: [
          { name: 'share', label: 'Participação', label_short: 'Participação', type: 'sum', is_numeric: true },
          { name: 'crescimento', label: 'Crescimento', label_short: 'Crescimento', type: 'sum', is_numeric: true },
        ],
        pivots: [],
      },
      pivots: [],
    };

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    assert.match(
      palco.querySelector('.bl-aviso')?.textContent || '',
      /participação relativa/i,
      'o usuário precisa ser avisado de que a normalização não foi possível'
    );
  } finally {
    amb.restaurar();
  }
  t.diagnostic('aviso de normalização impossível conferido');
});
