/**
 * candlestick.test.mjs — testes do Candlestick / OHLC.
 *
 * O risco aqui é geométrico: um pavio cortado ou um corpo invertido passa
 * despercebido numa olhada e falseia a leitura do preço. Os testes conferem
 * as coordenadas, não só a presença dos elementos.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { mediaMovel } from '../src/charts/candlestick_ohlc/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'candlestick_ohlc.js');

function renderizar(ajustes = {}, fixture = 'ohlc') {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.candlestick_ohlc;
  assert.ok(definicao, 'candlestick_ohlc não se registrou');

  const instancia = criarInstancia(definicao, amb.chamadasDeApi);
  const { data, queryResponse } = FIXTURES[fixture]();
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
    data,
    rects: Array.from(palco.querySelectorAll('rect')),
    lines: Array.from(palco.querySelectorAll('line')),
    paths: Array.from(palco.querySelectorAll('path')),
    fim: () => amb.restaurar(),
  };
}

test('candlestick — média móvel só começa quando a janela enche', (t) => {
  const medias = mediaMovel([10, 20, 30, 40, 50], 3);
  assert.deepEqual(medias.slice(0, 2), [null, null], 'os dois primeiros não têm janela completa');
  assert.equal(medias[2], 20, 'media de 10, 20 e 30');
  assert.equal(medias[3], 30);
  assert.equal(medias[4], 40);
  assert.deepEqual(mediaMovel([1, 2, 3], 1), [null, null, null], 'janela 1 não é média móvel');
  t.diagnostic('média móvel conferida');
});

test('candlestick — uma vela por período, com corpo e pavio', (t) => {
  const r = renderizar({ mostrarVolume: false });
  try {
    const corpos = r.rects.filter((el) => Number(el.getAttribute('width')) > 0);
    assert.equal(corpos.length, r.data.length, 'esperado um corpo por período');

    const pavios = r.lines.filter(
      (el) => el.getAttribute('x1') === el.getAttribute('x2') && el.getAttribute('stroke-width') === '1'
    );
    assert.ok(pavios.length >= r.data.length, 'faltaram pavios');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.data.length} velas`);
});

test('candlestick — o pavio vai da máxima para a mínima, nunca invertido', (t) => {
  // Se o domínio do eixo saísse só dos fechamentos, as máximas e mínimas
  // ficariam fora da área e os pavios sairiam cortados.
  const r = renderizar({ mostrarVolume: false });
  try {
    const corpos = r.rects.filter((el) => Number(el.getAttribute('width')) > 0);
    for (const corpo of corpos) {
      const y = Number(corpo.getAttribute('y'));
      const h = Number(corpo.getAttribute('height'));
      assert.ok(Number.isFinite(y) && Number.isFinite(h), 'corpo com coordenada inválida');
      assert.ok(h >= 1, 'o corpo precisa de altura mínima visível');
    }

    const pavios = r.lines.filter(
      (el) => el.getAttribute('x1') === el.getAttribute('x2') && el.getAttribute('stroke-width') === '1'
    );
    for (const pavio of pavios) {
      const y1 = Number(pavio.getAttribute('y1'));
      const y2 = Number(pavio.getAttribute('y2'));
      assert.ok(y1 <= y2, 'o topo do pavio (máxima) tem que ficar acima da base (mínima)');
    }
  } finally {
    r.fim();
  }
  t.diagnostic('geometria das velas conferida');
});

test('candlestick — cada estilo desenha o que lhe é próprio', (t) => {
  // Contar "formas no total" não serve aqui: o estilo linha desenha UM
  // caminho e mais nada, e um limite genérico reprovaria o comportamento
  // certo. Cada estilo tem uma expectativa própria.
  const corpos = (r) => r.rects.filter((el) => Number(el.getAttribute('width')) > 0).length;

  const vela = renderizar({ estiloDaVela: 'vela', mostrarVolume: false });
  try {
    assert.equal(corpos(vela), vela.data.length, 'o candlestick tem um corpo retangular por período');
    assert.equal(vela.paths.length, 0, 'sem média móvel, o candlestick não desenha caminho');
  } finally {
    vela.fim();
  }

  const ohlc = renderizar({ estiloDaVela: 'ohlc', mostrarVolume: false });
  try {
    assert.equal(corpos(ohlc), 0, 'o estilo OHLC usa traços, não retângulos');
    assert.ok(
      ohlc.lines.length >= ohlc.data.length * 3,
      'cada período OHLC precisa de pavio, traço de abertura e traço de fechamento'
    );
  } finally {
    ohlc.fim();
  }

  const linha = renderizar({ estiloDaVela: 'linha', mostrarVolume: false });
  try {
    assert.equal(corpos(linha), 0, 'o estilo linha não desenha velas');
    assert.equal(linha.paths.length, 1, 'o estilo linha desenha um caminho só');
    const d = linha.paths[0].getAttribute('d') || '';
    assert.ok(!/NaN/.test(d), 'caminho com NaN');
    assert.equal(
      (d.match(/L/g) || []).length,
      linha.data.length - 1,
      'a linha precisa passar por todos os períodos'
    );
  } finally {
    linha.fim();
  }

  t.diagnostic('vela, ohlc e linha conferidos pelo que cada um produz');
});

test('candlestick — volume entra numa faixa própria, embaixo do preço', (t) => {
  const com = renderizar({ mostrarVolume: true });
  const sem = renderizar({ mostrarVolume: false });
  try {
    assert.ok(
      com.rects.length > sem.rects.length,
      'com volume deveria haver mais retângulos do que sem'
    );
    const maiorYdasVelas = Math.max(...sem.rects.map((el) => Number(el.getAttribute('y')) || 0));
    const maiorYcomVolume = Math.max(...com.rects.map((el) => Number(el.getAttribute('y')) || 0));
    assert.ok(
      maiorYcomVolume > maiorYdasVelas,
      'a faixa de volume precisa ficar embaixo da área de preço'
    );
  } finally {
    com.fim();
    sem.fim();
  }
  t.diagnostic('faixa de volume conferida');
});

test('candlestick — média móvel acrescenta uma linha ao desenho', (t) => {
  const sem = renderizar({ mostrarMediaMovel: 0, mostrarVolume: false });
  const com = renderizar({ mostrarMediaMovel: 7, mostrarVolume: false });
  try {
    assert.equal(sem.paths.length, 0, 'sem média móvel não há caminho');
    assert.equal(com.paths.length, 1, 'com média móvel há exatamente um caminho');
    assert.ok(!/NaN/.test(com.paths[0].getAttribute('d') || ''), 'média móvel com NaN');
  } finally {
    sem.fim();
    com.fim();
  }
  t.diagnostic('média móvel desenhada');
});

test('candlestick — máxima menor que mínima vira aviso, não desenho quebrado', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(BUNDLE, 'utf8'));
    const definicao = amb.registro.candlestick_ohlc;
    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const palco = amb.window.document.getElementById('palco');

    const cel = (v) => ({ value: v, rendered: String(v) });
    const data = [
      { dia: cel('2026-01-01'), a: cel(10), b: cel(12), c: cel(9), d: cel(11) },
      // Máxima (8) abaixo da mínima (14): inconsistente de propósito.
      { dia: cel('2026-01-02'), a: cel(11), b: cel(8), c: cel(14), d: cel(12) },
    ];
    const queryResponse = {
      fields: {
        dimension_like: [{ name: 'dia', label: 'Dia', label_short: 'Dia', type: 'date_date' }],
        measure_like: ['a', 'b', 'c', 'd'].map((n) => ({
          name: n,
          label: n,
          label_short: n,
          type: 'sum',
          is_numeric: true,
        })),
        pivots: [],
      },
      pivots: [],
    };

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    assert.match(
      palco.querySelector('.bl-aviso')?.textContent || '',
      /máxima menor que a mínima/i,
      'o usuário precisa saber que o dado está inconsistente'
    );
    for (const linha of palco.querySelectorAll('line')) {
      const y1 = Number(linha.getAttribute('y1'));
      const y2 = Number(linha.getAttribute('y2'));
      assert.ok(Number.isFinite(y1) && Number.isFinite(y2), 'o desenho não pode quebrar por causa disso');
    }
  } finally {
    amb.restaurar();
  }
  t.diagnostic('dado inconsistente tratado');
});
