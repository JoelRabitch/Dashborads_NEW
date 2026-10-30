/**
 * quadrant_scatter.test.mjs — testes específicos da Dispersão com Quadrantes.
 *
 * O risco aqui é a classificação dos pontos: se o corte estiver errado, o
 * desenho continua bonito e as contagens ficam mentirosas. Então os testes
 * conferem os NÚMEROS por quadrante, não só a presença dos elementos.
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
const BUNDLE = join(process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist'), 'quadrant_scatter.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.quadrant_scatter;
  assert.ok(definicao, 'quadrant_scatter não se registrou');

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

  const rotulos = Array.from(palco.querySelectorAll('.qd-rotulo-quadrante')).map((t) => t.textContent);
  const contagens = rotulos
    .map((t) => /\((\d+)\)\s*$/.exec(t))
    .filter(Boolean)
    .map((m) => Number(m[1]));

  return {
    amb,
    palco,
    rotulos,
    contagens,
    totalClassificado: contagens.reduce((a, b) => a + b, 0),
    linhasDeDados: data.length,
    fim: () => amb.restaurar(),
  };
}

test('quadrant_scatter — todo ponto cai em exatamente um quadrante', (t) => {
  for (const fixture of ['semPivo', 'grande5k', 'ohlc']) {
    const r = renderizar(fixture);
    try {
      assert.equal(
        r.totalClassificado,
        r.linhasDeDados,
        `${fixture}: ${r.totalClassificado} pontos classificados para ${r.linhasDeDados} linhas`
      );
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
      t.diagnostic(`${fixture}: ${r.rotulos.join(' | ')}`);
    } finally {
      r.fim();
    }
  }
});

test('quadrant_scatter — a divisória pela média parte os pontos de verdade', (t) => {
  const r = renderizar('grande5k', { divisoriaX: 'media', divisoriaY: 'media' });
  try {
    assert.equal(r.contagens.length, 4, 'com os dois cortes no meio dos dados há 4 quadrantes');
    assert.ok(
      r.contagens.every((n) => n > 0),
      `nenhum quadrante deveria ficar vazio nesta fixture; veio ${r.contagens.join(', ')}`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`contagens: ${r.contagens.join(', ')}`);
});

test('quadrant_scatter — divisória fora do intervalo deixa só os quadrantes que existem', (t) => {
  // Receita e quantidade são sempre positivas: cortar em zero joga tudo
  // para o lado de cima, e só dois quadrantes podem existir.
  const r = renderizar('grande5k', { divisoriaY: 'zero' });
  try {
    assert.ok(r.contagens.length <= 2, `esperado no máximo 2 quadrantes, veio ${r.contagens.length}`);
    assert.equal(r.totalClassificado, r.linhasDeDados, 'nenhum ponto pode sumir');
  } finally {
    r.fim();
  }
  t.diagnostic(`quadrantes: ${r.rotulos.join(' | ')}`);
});

test('quadrant_scatter — sem divisórias não há quadrante nem fundo pintado', (t) => {
  const r = renderizar('semPivo', { divisoriaX: 'nenhum', divisoriaY: 'nenhum' });
  try {
    assert.equal(r.rotulos.length, 0, 'sem divisórias não deveria rotular quadrante');
    assert.equal(r.palco.querySelectorAll('rect').length, 0, 'sem divisórias não deveria pintar fundo');
    assert.ok(r.palco.querySelector('.qd-ponto.bl-marcador'), 'os pontos continuam sendo desenhados');
  } finally {
    r.fim();
  }
  t.diagnostic('modo sem quadrantes conferido');
});

test('quadrant_scatter — nome do quadrante é respeitado', (t) => {
  const r = renderizar('semPivo', {
    rotulo_superiorDireito: 'Estrelas',
    mostrarContagemPorQuadrante: false,
  });
  try {
    assert.ok(
      r.rotulos.includes('Estrelas'),
      `o nome escolhido deveria aparecer; veio: ${r.rotulos.join(' | ')}`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`rótulos: ${r.rotulos.join(' | ')}`);
});

test('quadrant_scatter — eixos e pontos chegam ao DOM', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.palco.querySelectorAll('.bl-eixos text').length >= 4, 'faltaram rótulos nos eixos');
    // Até LIMITE_DE_PONTOS_EM_SVG os pontos são marcadores SVG (a forma
    // escolhida muda o desenho); canvas só para volume grande.
    assert.ok(r.palco.querySelector('.qd-ponto.bl-marcador'), 'os pontos precisam de marcadores');
    assert.equal(r.palco.querySelector('canvas'), null, 'com poucos pontos não há canvas');
    assert.ok(
      r.palco.querySelectorAll('.qd-rotulo-ponto').length > 0,
      'os pontos mais distantes do cruzamento precisam vir rotulados'
    );
  } finally {
    r.fim();
  }
  t.diagnostic('eixos, marcadores e rótulos de ponto conferidos');
});

test('quadrant_scatter — volume grande cai para canvas', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.palco.querySelector('canvas'), 'com 5.000 pontos o desenho vai para canvas');
    assert.equal(r.palco.querySelectorAll('.qd-ponto').length, 0, 'sem 5.000 elementos SVG');
  } finally {
    r.fim();
  }
  t.diagnostic('canvas no volume grande conferido');
});
