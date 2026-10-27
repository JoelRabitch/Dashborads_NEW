/**
 * medidores.test.mjs — testes de `gauge_variacoes` e `gauge_grid`.
 *
 * Um medidor é o gráfico mais fácil de usar para enganar: a mesma agulha
 * no mesmo lugar significa coisas diferentes conforme a escala. Por isso a
 * maior parte dos testes aqui é sobre a ESCALA, não sobre o desenho.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { lerFaixas, corDaFaixa, fracaoDoValor, limitesDoMedidor } from '../src/charts/_medidor/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_DIST = join(resolve(__dirname, '..'), 'dist');

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

  return {
    amb,
    palco,
    valores: Array.from(palco.querySelectorAll('.md-valor')).map((t) => t.textContent),
    rotulos: Array.from(palco.querySelectorAll('.md-rotulo')).map((t) => t.textContent),
    limites: Array.from(palco.querySelectorAll('.md-limite')).map((t) => t.textContent),
    celulas: palco.querySelectorAll('.md-celula').length,
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

test('_medidor — faixas são lidas em ordem e pintam a cor certa', (t) => {
  const faixas = lerFaixas({
    faixa1Ate: '80',
    faixa1Cor: '#AAA',
    faixa2Ate: '30',
    faixa2Cor: '#BBB',
    faixa3Ate: '',
    faixa3Cor: '#CCC',
  });

  assert.deepEqual(faixas.map((f) => f.ate), [30, 80], 'as faixas precisam sair ordenadas');
  assert.equal(corDaFaixa(10, faixas), '#BBB', '10 cai na primeira faixa');
  assert.equal(corDaFaixa(50, faixas), '#AAA', '50 cai na segunda');
  assert.equal(corDaFaixa(999, faixas), '#AAA', 'acima de tudo, fica na última');
  assert.equal(corDaFaixa(10, []), null, 'sem faixas, não há cor de faixa');
  t.diagnostic('leitura e aplicação das faixas conferidas');
});

test('_medidor — a fração fica presa entre 0 e 1', (t) => {
  assert.equal(fracaoDoValor(50, 0, 100), 0.5);
  assert.equal(fracaoDoValor(-10, 0, 100), 0, 'abaixo do mínimo gruda em 0');
  assert.equal(fracaoDoValor(200, 0, 100), 1, 'acima do máximo gruda em 1');
  assert.equal(fracaoDoValor(null, 0, 100), 0);
  assert.equal(fracaoDoValor(5, 10, 10), 0, 'escala degenerada não pode virar NaN');
  t.diagnostic('fração conferida nos extremos');
});

test('_medidor — limites fixos só valem se fizerem sentido', (t) => {
  assert.deepEqual(limitesDoMedidor([5], { origemDosLimites: 'fixo', minimoDoMedidor: '0', maximoDoMedidor: '10' }), {
    minimo: 0,
    maximo: 10,
  });
  // Máximo menor que o mínimo é erro de digitação: cai para os dados.
  const degenerado = limitesDoMedidor([5], {
    origemDosLimites: 'fixo',
    minimoDoMedidor: '10',
    maximoDoMedidor: '2',
  });
  assert.ok(degenerado.maximo > degenerado.minimo, 'nunca devolver uma escala invertida');
  t.diagnostic('limites fixos conferidos');
});

test('gauge_variacoes — os cinco estilos desenham sem caminho quebrado', (t) => {
  for (const estilo of ['arco', 'semicirculo', 'circulo', 'barra', 'bullet']) {
    const r = renderizar('gauge_variacoes', 'semPivo', { estiloDoMedidor: estilo });
    try {
      assert.ok(r.valores.length >= 1, `estilo ${estilo}: faltou o número`);
      for (const path of r.palco.querySelectorAll('path')) {
        assert.ok(!/NaN/.test(path.getAttribute('d') || ''), `estilo ${estilo}: caminho com NaN`);
      }
      const formas = r.palco.querySelectorAll('path, rect').length;
      assert.ok(formas >= 2, `estilo ${estilo}: esperado trilho + preenchimento`);
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    } finally {
      r.fim();
    }
  }
  t.diagnostic('arco, semicírculo, círculo, barra e bullet conferidos');
});

test('gauge_variacoes — sem escala definida, avisa em vez de fingir', (t) => {
  const r = renderizar('gauge_variacoes', 'semPivo');
  try {
    assert.match(
      r.aviso,
      /não tem escala definida/i,
      'um medidor sem máximo, alvo nem faixas precisa dizer isso ao usuário'
    );
  } finally {
    r.fim();
  }
  t.diagnostic('aviso de escala indefinida conferido');
});

test('gauge_variacoes — com alvo, a escala sai do alvo e o aviso some', (t) => {
  const r = renderizar('gauge_variacoes', 'semPivo', {
    alvoVindoDe: 'fixo',
    valorDoAlvo: '500000',
    agregacaoDoValor: 'soma',
  });
  try {
    assert.ok(!/não tem escala definida/i.test(r.aviso), 'com alvo, a escala está definida');
    // O máximo tem que acomodar o alvo com folga.
    const maiorTexto = r.limites[r.limites.length - 1] || '';
    const maior = Number(maiorTexto.replace(/[^\d.-]/g, ''));
    assert.ok(maior >= 500000, `o máximo (${maiorTexto}) precisa comportar o alvo de 500.000`);
    assert.ok(
      r.rotulos.some((texto) => /do alvo/.test(texto)),
      'faltou o percentual do alvo'
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`limites: ${r.limites.join(' .. ')}`);
});

test('gauge_variacoes — o alvo nunca usa a mesma medida do valor', (t) => {
  // Se usasse, daria sempre 100% — e o usuário acharia que bateu a meta.
  const r = renderizar('gauge_variacoes', 'semPivo', { alvoVindoDe: 'medida' });
  try {
    const percentual = r.rotulos.find((texto) => /do alvo/.test(texto));
    if (percentual) {
      assert.ok(!/^100% do alvo$/.test(percentual.trim()), `alvo igual ao valor: "${percentual}"`);
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`rótulos: ${r.rotulos.join(' | ')}`);
});

test('gauge_grid — um medidor por item, todos na mesma escala', (t) => {
  const r = renderizar('gauge_grid', 'semPivo');
  try {
    const { data } = FIXTURES.semPivo();
    assert.equal(r.celulas, data.length, 'esperado um medidor por item');
    assert.equal(r.valores.length, data.length, 'cada medidor precisa do seu número');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.celulas} medidores`);
});

test('gauge_grid — escala comum faz os preenchimentos diferirem', (t) => {
  const comum = renderizar('gauge_grid', 'semPivo', { estiloDoMedidor: 'barra' });
  const propria = renderizar('gauge_grid', 'semPivo', {
    estiloDoMedidor: 'barra',
    escalaPorMedidor: true,
  });
  try {
    // Na escala própria, todo medidor enche a própria barra: as larguras de
    // preenchimento ficam todas iguais. Na comum, variam com o valor.
    const preenchimentos = (r) =>
      Array.from(r.palco.querySelectorAll('rect'))
        .map((el) => Number(el.getAttribute('width') || 0))
        .filter((w) => w > 0);

    const distintasComuns = new Set(preenchimentos(comum).map((w) => w.toFixed(0))).size;
    const distintasProprias = new Set(preenchimentos(propria).map((w) => w.toFixed(0))).size;

    assert.ok(
      distintasComuns > distintasProprias,
      `a escala comum deveria produzir mais larguras distintas (comum=${distintasComuns}, própria=${distintasProprias})`
    );
  } finally {
    comum.fim();
    propria.fim();
  }
  t.diagnostic('as duas escalas se comportam de forma diferente, como esperado');
});
