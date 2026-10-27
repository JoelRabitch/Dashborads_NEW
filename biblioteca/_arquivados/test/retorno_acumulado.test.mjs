/**
 * retorno_acumulado.test.mjs — testes do Retorno Acumulado (Base 100).
 *
 * Reescalar é fácil de fazer errado de um jeito que continua bonito: uma
 * série dividida por uma base ruim sai com números plausíveis e sem
 * sentido. Os testes olham a conta e os casos-limite da base.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import {
  reescalar,
  primeiroIndiceComValor,
  ultimoIndiceComValor,
} from '../src/charts/retorno_acumulado/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'retorno_acumulado.js');

const serieDe = (chave, valores) => ({ chave, rotulo: chave.toUpperCase(), valores });

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.retorno_acumulado;
  assert.ok(definicao, 'retorno_acumulado não se registrou');

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
    linhas: Array.from(palco.querySelectorAll('.st-linha')),
    legenda: Array.from(palco.querySelectorAll('.bl-legenda-item')),
    nota: palco.querySelector('.st-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

test('retorno_acumulado — primeiro e último índice com valor', (t) => {
  assert.equal(primeiroIndiceComValor([null, null, 5, 7]), 2);
  assert.equal(ultimoIndiceComValor([1, 2, null]), 1);
  assert.equal(primeiroIndiceComValor([null, null]), -1, 'série vazia não tem início');
  assert.equal(ultimoIndiceComValor([]), -1);
  t.diagnostic('busca de extremos conferida');
});

test('retorno_acumulado — séries de magnitudes diferentes viram comparáveis', (t) => {
  const { series } = reescalar([serieDe('a', [10, 12, 15]), serieDe('b', [1000, 900, 1100])], {
    base: 100,
  });

  // Comparação com tolerância: 1100/1000*100 dá 110.00000000000001 em
  // ponto flutuante, e um `deepEqual` reprovaria a conta certa.
  const perto = (valores, esperados, mensagem) => {
    assert.equal(valores.length, esperados.length, mensagem);
    valores.forEach((v, i) => {
      assert.ok(Math.abs(v - esperados[i]) < 1e-9, `${mensagem} (posição ${i}: ${v} ≠ ${esperados[i]})`);
    });
  };

  perto(series[0].valores, [100, 120, 150], 'de 10 para 15 é +50%');
  perto(series[1].valores, [100, 90, 110], 'de 1000 para 1100 é +10%');
  for (const s of series) {
    assert.equal(s.valores[0], 100, 'toda série começa exatamente na base');
  }
  t.diagnostic('reescalonamento conferido');
});

test('retorno_acumulado — a base é o primeiro valor NÃO NULO', (t) => {
  // Usar o primeiro período cru faria a série inteira virar nula.
  const { series } = reescalar([serieDe('c', [null, 50, 60])], { base: 100 });
  assert.equal(series.length, 1, 'a série não pode ser descartada por começar vazia');
  assert.equal(series[0].indiceDaBase, 1);
  assert.deepEqual(series[0].valores, [null, 100, 120]);
  t.diagnostic('base em primeiro valor existente');
});

test('retorno_acumulado — base zero ou negativa deixa a série de fora, com aviso', (t) => {
  // Dividir por zero ou negativo dá um índice sem significado. Melhor não
  // mostrar do que mostrar algo plausível e falso.
  const { series, avisos } = reescalar(
    [serieDe('ok', [10, 20]), serieDe('zero', [0, 5]), serieDe('neg', [-4, -2])],
    { base: 100 }
  );

  assert.equal(series.length, 1, 'só a série com base positiva deveria sobrar');
  assert.equal(series[0].chave, 'ok');
  assert.ok(
    avisos.some((a) => /zero, negativo ou inexistente/i.test(a)),
    `o usuário precisa saber o que sumiu; avisos: ${avisos.join(' | ')}`
  );
  t.diagnostic(`avisos: ${avisos.join(' | ')}`);
});

test('retorno_acumulado — séries que começam em períodos diferentes recebem ressalva', (t) => {
  const diferentes = reescalar([serieDe('a', [10, 12, 15]), serieDe('c', [null, 50, 60])], { base: 100 });
  assert.match(
    diferentes.nota,
    /períodos diferentes/i,
    'partir do mesmo VALOR em períodos diferentes não é comparação honesta sem ressalva'
  );

  const iguais = reescalar([serieDe('a', [10, 12]), serieDe('b', [20, 30])], { base: 100 });
  assert.equal(iguais.nota, '', 'começando juntas, não há o que ressalvar');
  t.diagnostic('ressalva de bases diferentes conferida');
});

test('retorno_acumulado — modo "período comum" alinha todas no mesmo ponto', (t) => {
  const { series, nota } = reescalar(
    [serieDe('a', [10, 12, 15]), serieDe('c', [null, 50, 60]), serieDe('d', [0, 5, 8])],
    { base: 100, periodoDaBase: 'comum' }
  );

  assert.equal(series.length, 3, 'no período comum até a série que começa em zero entra');
  for (const s of series) {
    assert.equal(s.indiceDaBase, 1, 'todas precisam usar o mesmo período como base');
    assert.equal(s.valores[1], 100, 'e valer exatamente a base ali');
  }
  assert.equal(nota, '', 'alinhadas no mesmo período, não há ressalva');
  t.diagnostic('modo período comum conferido');
});

test('retorno_acumulado — modo percentual mostra variação, não índice', (t) => {
  const { series } = reescalar([serieDe('a', [10, 12, 15])], { emPercentual: true, base: 0 });
  assert.equal(series[0].valores[0], 0, 'no início a variação acumulada é zero');
  assert.ok(Math.abs(series[0].valores[1] - 0.2) < 1e-9, '12 sobre 10 é +20%');
  assert.ok(Math.abs(series[0].valores[2] - 0.5) < 1e-9, '15 sobre 10 é +50%');
  t.diagnostic('modo percentual conferido');
});

test('retorno_acumulado — desenha uma linha por série, sem caminho quebrado', (t) => {
  for (const fixture of ['comPivo', 'temporal']) {
    const r = renderizar(fixture);
    try {
      assert.ok(r.linhas.length >= 2, `${fixture}: esperado mais de uma linha`);
      for (const linha of r.linhas) {
        const d = linha.getAttribute('d') || '';
        assert.ok(d.length > 0, `${fixture}: caminho vazio`);
        assert.ok(!/NaN|Infinity/.test(d), `${fixture}: caminho com NaN/Infinity`);
      }
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    } finally {
      r.fim();
    }
  }
  t.diagnostic('desenho conferido');
});

test('retorno_acumulado — legenda desliga e religa a série', (t) => {
  const r = renderizar('comPivo');
  try {
    const antes = r.linhas.length;
    assert.ok(r.legenda.length >= 2, 'faltou a legenda');

    r.legenda[0].dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(
      r.palco.querySelectorAll('.st-linha').length,
      antes - 1,
      'desligar uma série deveria remover a linha dela'
    );

    r.palco.querySelectorAll('.bl-legenda-item')[0]
      .dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(r.palco.querySelectorAll('.st-linha').length, antes, 'religar traz a linha de volta');
  } finally {
    r.fim();
  }
  t.diagnostic('legenda interativa conferida');
});
