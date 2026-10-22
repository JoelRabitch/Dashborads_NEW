/**
 * pareto.test.mjs — testes do Pareto.
 *
 * A validade de um Pareto depende de duas coisas: as barras em ordem
 * decrescente e a linha acumulada sempre crescente. Quebrada qualquer uma,
 * a leitura dos 80% deixa de valer — e o gráfico continua parecendo certo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import { montarPareto } from '../src/charts/pareto/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'pareto.js');

const cel = (v) => ({ value: v, rendered: v === null ? null : String(v) });

function paretoDe(pares, config = {}) {
  const data = pares.map(([nome, valor]) => ({ cat: cel(nome), v: cel(valor) }));
  const queryResponse = {
    fields: {
      dimension_like: [{ name: 'cat', label: 'Categoria', label_short: 'Categoria', type: 'string' }],
      measure_like: [{ name: 'v', label: 'Valor', label_short: 'Valor', type: 'sum', is_numeric: true }],
      pivots: [],
    },
    pivots: [],
  };
  const modelo = construirModelo(data, queryResponse, {});
  return montarPareto({
    modelo,
    campoDaCategoria: modelo.dimensoes[0],
    medida: modelo.medidas[0],
    config,
  });
}

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.pareto;
  assert.ok(definicao, 'pareto não se registrou');

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
    barras: Array.from(palco.querySelectorAll('.pt-barra')),
    nota: palco.querySelector('.pt-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    eixoSecundario: Array.from(palco.querySelectorAll('.bl-eixo-secundario text')).map((t) => t.textContent),
    fim: () => amb.restaurar(),
  };
}

test('pareto — ordena decrescente e acumula até 100%', (t) => {
  const { itens, total } = paretoDe([
    ['c', 10],
    ['a', 50],
    ['b', 40],
  ]);

  assert.deepEqual(itens.map((i) => i.rotulo), ['a', 'b', 'c'], 'as barras saem da maior para a menor');
  assert.equal(total, 100);
  assert.ok(Math.abs(itens[0].acumulado - 0.5) < 1e-9);
  assert.ok(Math.abs(itens[1].acumulado - 0.9) < 1e-9);
  assert.ok(Math.abs(itens[2].acumulado - 1) < 1e-9, 'o acumulado termina exatamente em 100%');
  t.diagnostic(`acumulado: ${itens.map((i) => (i.acumulado * 100).toFixed(0) + '%').join(', ')}`);
});

test('pareto — a linha acumulada nunca desce', (t) => {
  const { itens } = paretoDe([
    ['a', 5],
    ['b', 90],
    ['c', 3],
    ['d', 2],
  ]);
  for (let i = 1; i < itens.length; i++) {
    assert.ok(
      itens[i].acumulado >= itens[i - 1].acumulado,
      'o acumulado precisa ser monótono: é ele que sustenta a leitura dos 80%'
    );
  }
  t.diagnostic('monotonicidade conferida');
});

test('pareto — o corte é a primeira categoria que atinge o nível', (t) => {
  const pares = [
    ['a', 50],
    ['b', 30],
    ['c', 15],
    ['d', 5],
  ];

  const oitenta = paretoDe(pares, { nivelDeCorte: 80 });
  assert.equal(oitenta.indiceDoCorte, 1, '50% + 30% = 80% já no segundo item');

  const cinquenta = paretoDe(pares, { nivelDeCorte: 50 });
  assert.equal(cinquenta.indiceDoCorte, 0, 'o primeiro item sozinho já faz 50%');

  const noventaECinco = paretoDe(pares, { nivelDeCorte: 95 });
  assert.equal(noventaECinco.indiceDoCorte, 2, '50+30+15 = 95%');
  t.diagnostic('corte conferido em três níveis');
});

test('pareto — "Outros" entra na ordenação, não fica fixo no fim', (t) => {
  // Um balde grande jogado no fim quebraria a ordem decrescente e, com
  // ela, a monotonicidade do acumulado.
  const pares = [
    ['grande', 100],
    ['m1', 30],
    ['m2', 29],
    ['m3', 28],
    ['m4', 27],
    ['m5', 26],
  ];
  const { itens, avisos } = paretoDe(pares, { maximoDeCategorias: 3 });

  const valores = itens.map((i) => i.valor);
  for (let i = 1; i < valores.length; i++) {
    assert.ok(valores[i] <= valores[i - 1], 'as barras precisam continuar decrescentes com "Outros"');
  }
  assert.ok(itens.some((i) => i.ehOutros), 'faltou o grupo "Outros"');
  assert.ok(
    avisos.some((a) => /Outros/.test(a)),
    'agrupar precisa ser anunciado'
  );

  // Agrupar não pode mudar o total.
  const semLimite = paretoDe(pares);
  assert.equal(
    itens.reduce((a, i) => a + i.valor, 0),
    semLimite.total,
    'o total tem que sobreviver ao agrupamento'
  );
  t.diagnostic(`valores: ${valores.join(', ')}`);
});

test('pareto — "Outros" entre os maiores vira aviso de limite baixo', (t) => {
  const pares = Array.from({ length: 40 }, (_, i) => [`c${i}`, 100 - i]);
  const { avisos } = paretoDe(pares, { maximoDeCategorias: 5 });
  assert.ok(
    avisos.some((a) => /escondendo a estrutura/i.test(a)),
    `o usuário precisa saber que o limite distorce a leitura; avisos: ${avisos.join(' | ')}`
  );
  t.diagnostic('aviso de limite baixo conferido');
});

test('pareto — valores negativos geram aviso', (t) => {
  // Com negativos o acumulado deixa de subir e "80% do total" não vale.
  const { avisos } = paretoDe([
    ['a', 100],
    ['b', -40],
    ['c', 20],
  ]);
  assert.ok(
    avisos.some((a) => /negativo/i.test(a)),
    `o Pareto pressupõe valores positivos; avisos: ${avisos.join(' | ')}`
  );
  t.diagnostic('aviso de negativos conferido');
});

test('pareto — desenha barras decrescentes e eixo de 0 a 100%', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.barras.length > 2, 'faltaram barras');
    const alturas = r.barras.map((b) => Number(b.getAttribute('height')));
    for (let i = 1; i < alturas.length; i++) {
      assert.ok(alturas[i] <= alturas[i - 1] + 0.01, `a barra ${i} está maior que a anterior`);
    }
    assert.ok(r.eixoSecundario.includes('100%'), 'o eixo do acumulado precisa chegar a 100%');
    assert.ok(r.eixoSecundario.includes('0%'), 'e começar em 0%');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`eixo secundário: ${r.eixoSecundario.join(', ')}`);
});

test('pareto — a nota traduz o gráfico numa frase', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.match(
      r.nota,
      /\d+ de \d+ categorias .* respondem por/,
      `a conclusão prática precisa estar escrita; veio: "${r.nota}"`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`nota: ${r.nota}`);
});
