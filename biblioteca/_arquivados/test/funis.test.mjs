/**
 * funis.test.mjs — testes de `funil_variacoes` e `funil_comparativo`.
 *
 * O defeito mais perigoso aqui é silencioso: se o funil comparativo ignorar
 * a chave do pivô, todos os segmentos saem com os MESMOS valores e o
 * gráfico fica bonito e errado. Esse é o primeiro teste.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import { lerEtapas, calcularConversoes } from '../src/charts/_funil/index.js';

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
    etapas: Array.from(palco.querySelectorAll('.fn-etapa')),
    titulos: Array.from(palco.querySelectorAll('.fn-titulo-funil')).map((t) => t.textContent),
    conversoes: Array.from(palco.querySelectorAll('.fn-conversao')).map((t) => t.textContent.trim()),
    fim: () => amb.restaurar(),
  };
}

test('_funil — conversões são calculadas contra a etapa certa', (t) => {
  const etapas = calcularConversoes([
    { chave: 'a', rotulo: 'A', valor: 1000 },
    { chave: 'b', rotulo: 'B', valor: 400 },
    { chave: 'c', rotulo: 'C', valor: 100 },
  ]);

  assert.equal(etapas[0].conversaoDaAnterior, null, 'a primeira etapa não tem anterior');
  assert.equal(etapas[1].conversaoDaAnterior, 0.4);
  assert.equal(etapas[2].conversaoDaAnterior, 0.25, 'C vem de B, não da primeira');
  assert.equal(etapas[2].conversaoDaPrimeira, 0.1, 'C sobre A');
  assert.equal(etapas[1].perdaDaAnterior, 600);
  t.diagnostic('conversões e perdas conferidas');
});

test('_funil — funil que sobe no meio gera aviso', (t) => {
  const { data, queryResponse } = FIXTURES.semPivo();
  const modelo = construirModelo(data, queryResponse, {});
  const { avisos } = lerEtapas(modelo, { ordenarEtapas: 'consulta' });
  assert.ok(
    avisos.some((a) => /maior que a anterior/i.test(a)),
    'etapas fora de ordem precisam avisar o usuário'
  );

  const ordenado = lerEtapas(modelo, { ordenarEtapas: 'decrescente' });
  assert.equal(ordenado.avisos.length, 0, 'ordenando, o aviso não faz sentido');
  t.diagnostic('aviso de ordem conferido');
});

test('funil_variacoes — os cinco estilos desenham todas as etapas', (t) => {
  for (const estilo of ['classico', 'piramide', 'barrasCentradas', 'barras', 'area']) {
    const r = renderizar('funil_variacoes', 'semPivo', {
      estiloDoFunil: estilo,
      ordenarEtapas: 'decrescente',
    });
    try {
      const { data } = FIXTURES.semPivo();
      assert.equal(r.etapas.length, data.length, `estilo ${estilo}: faltaram etapas`);
      for (const etapa of r.etapas) {
        const d = etapa.getAttribute('d');
        if (d) assert.ok(!/NaN/.test(d), `estilo ${estilo}: caminho com NaN`);
      }
      assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    } finally {
      r.fim();
    }
  }
  t.diagnostic('clássico, pirâmide, barras centradas, barras e área conferidos');
});

test('funil_variacoes — a largura das etapas acompanha os valores', (t) => {
  const r = renderizar('funil_variacoes', 'semPivo', {
    estiloDoFunil: 'barras',
    ordenarEtapas: 'decrescente',
    mostrarNomeDaEtapa: false,
  });
  try {
    const larguras = r.etapas.map((e) => Number(e.getAttribute('width')));
    for (let i = 1; i < larguras.length; i++) {
      assert.ok(
        larguras[i] <= larguras[i - 1] + 0.5,
        `ordenado do maior para o menor, a etapa ${i} não pode ser mais larga que a anterior`
      );
    }
    assert.ok(larguras[0] > larguras[larguras.length - 1], 'o funil precisa afunilar');
  } finally {
    r.fim();
  }
  t.diagnostic('larguras monotônicas conferidas');
});

test('funil_comparativo — cada segmento do pivô tem valores PRÓPRIOS', (t) => {
  // Se a chave do pivô for ignorada, todos os funis saem idênticos — é um
  // erro que não aparece na tela, só nos números.
  const r = renderizar('funil_comparativo', 'comPivo', { ordenarEtapas: 'decrescente' });
  try {
    assert.ok(r.titulos.length >= 2, 'deveria haver um título por segmento');

    const larguras = r.etapas.map((e) => Number(e.getAttribute('width') || 0));
    const porFunil = larguras.length / r.titulos.length;
    const primeiraDeCadaFunil = r.titulos.map((_, i) => larguras[Math.round(i * porFunil)]);
    const distintas = new Set(primeiraDeCadaFunil.map((v) => v.toFixed(1)));

    assert.ok(
      distintas.size > 1,
      `os segmentos do pivô saíram todos iguais (${primeiraDeCadaFunil.join(', ')}) — a chave do pivô está sendo ignorada`
    );
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`segmentos: ${r.titulos.join(', ')}`);
});

test('funil_comparativo — escala comum x escala por funil', (t) => {
  const comum = renderizar('funil_comparativo', 'comPivo', { ordenarEtapas: 'decrescente' });
  const propria = renderizar('funil_comparativo', 'comPivo', {
    ordenarEtapas: 'decrescente',
    escalaPorFunil: true,
  });
  try {
    // Contar etapas "cheias" não depende de os funis terem o mesmo número
    // de etapas, que é o que estraga qualquer conta por índice aqui.
    const quantasCheias = (r) => {
      const larguras = r.etapas.map((e) => Number(e.getAttribute('width') || 0));
      const maior = Math.max(...larguras);
      return larguras.filter((l) => l >= maior * 0.95).length;
    };

    // Com escala própria, CADA funil enche a própria caixa: há uma etapa
    // cheia por segmento. Com escala comum, só o maior segmento enche.
    const cheiasProprias = quantasCheias(propria);
    const cheiasComuns = quantasCheias(comum);

    assert.ok(
      cheiasProprias >= propria.titulos.length,
      `com escala própria cada um dos ${propria.titulos.length} funis deveria encher a caixa; só ${cheiasProprias} encheram`
    );
    assert.ok(
      cheiasComuns < cheiasProprias,
      `com escala comum só o maior segmento deveria encher (comuns=${cheiasComuns}, próprias=${cheiasProprias})`
    );
  } finally {
    comum.fim();
    propria.fim();
  }
  t.diagnostic('as duas escalas se comportam de forma diferente, como esperado');
});

test('funil_comparativo — segmentos vindos da 2ª dimensão', (t) => {
  const r = renderizar('funil_comparativo', 'duasDimensoes', { ordenarEtapas: 'decrescente' });
  try {
    assert.ok(r.titulos.length >= 2, `esperado mais de um segmento; veio ${r.titulos.join(', ')}`);
    assert.ok(r.etapas.length >= r.titulos.length * 2, 'cada segmento precisa de pelo menos duas etapas');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`segmentos: ${r.titulos.join(', ')}`);
});
