/**
 * treemap_carteira.test.mjs — testes do Treemap de Carteira.
 *
 * Dois riscos. O primeiro é a ESCALA DE COR: centrada na média em vez de
 * em zero, uma carteira inteira no vermelho aparece metade verde. O
 * segundo é o VOLUME: com milhares de posições o treemap deixa de ser um
 * gráfico, e o corte precisa preservar o total.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { construirModelo } from '../src/core/data-model.js';
import { construirHierarquia } from '../src/core/hierarquia.js';
import { podarCarteira, criarEscalaDivergente } from '../src/charts/treemap_carteira/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'treemap_carteira.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.treemap_carteira;
  assert.ok(definicao, 'treemap_carteira não se registrou');

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

  const blocos = Array.from(palco.querySelectorAll('.tm-bloco'));
  return {
    amb,
    palco,
    blocos,
    cores: new Set(blocos.map((b) => b.getAttribute('fill'))),
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/**
 * Escala divergente montada a partir de uma lista de valores.
 *
 * `criarEscalaDivergente` lê os valores pelo índice da linha que originou
 * cada folha, então o modelo falso só precisa devolver o valor daquele
 * índice — nada mais da API de modelo entra em jogo aqui.
 */
function escalaPara(valores, config) {
  const folhas = valores.map((_, i) => ({ data: { indiceDaLinha: i } }));
  const modelo = {
    linhas: valores.map((_, i) => ({ i })),
    valorNumerico: (linha) => valores[linha.i],
  };
  return criarEscalaDivergente({
    hierarquia: { leaves: () => folhas },
    modelo,
    campoDaCor: { nome: 'c' },
    config,
  });
}

function hierarquiaDaFixture(nome) {
  const { data, queryResponse } = FIXTURES[nome]();
  const modelo = construirModelo(data, queryResponse, {});
  return { modelo, ...construirHierarquia(modelo, {}) };
}

test('treemap — a escala de cor é centrada em zero e simétrica', (t) => {
  // Com valores de -1 a +9, centrar no INTERVALO faria o zero cair a 10%
  // da escala e quase tudo apareceria "positivo". O limite tem que ser o
  // maior desvio absoluto, aplicado para os dois lados.
  const escala = escalaPara([-1, 0, 9], {});

  assert.equal(escala.limite, 9, 'o limite é o maior desvio absoluto, não o intervalo');
  assert.equal(
    escala.cor(-9),
    escala.cor(-9),
    'a função precisa ser determinística'
  );
  // Simetria: o zero fica exatamente no meio da escala.
  assert.notEqual(escala.cor(-9), escala.cor(9), 'os extremos têm cores opostas');
  assert.equal(escala.cor(null), '#9CA3AF', 'sem valor, cinza neutro');
  t.diagnostic(`limite = ${escala.limite}`);
});

test('treemap — limite manual da cor é respeitado', (t) => {
  const escala = escalaPara([], { limiteDaCor: '0,05' });
  assert.ok(Math.abs(escala.limite - 0.05) < 1e-9, 'a vírgula decimal precisa ser aceita');
  // Valores além do limite grudam no extremo, em vez de estourar a escala.
  assert.equal(escala.cor(10), escala.cor(0.05), 'acima do limite, satura');
  assert.equal(escala.cor(-10), escala.cor(-0.05), 'abaixo do limite, satura');
  t.diagnostic('limite manual conferido');
});

test('treemap — inverter a escala troca os extremos', (t) => {
  const normal = escalaPara([], { limiteDaCor: '1' });
  const invertida = escalaPara([], { limiteDaCor: '1', inverterEscala: true });

  assert.equal(normal.cor(1), invertida.cor(-1), 'inverter troca os dois lados');
  assert.equal(normal.cor(-1), invertida.cor(1));
  t.diagnostic('inversão conferida');
});

test('treemap — a poda preserva o total da carteira', (t) => {
  const { raiz } = hierarquiaDaFixture('grande5k');
  const totalAntes = raiz.value;

  const { raiz: podada, aviso } = podarCarteira(raiz, 50);
  assert.ok(aviso, 'cortar precisa ser anunciado');
  assert.ok(
    Math.abs(podada.value - totalAntes) < 0.01,
    `o total mudou ao podar: ${podada.value} vs ${totalAntes}`
  );
  assert.ok(podada.leaves().length <= 50, `esperado no máximo 50 folhas, veio ${podada.leaves().length}`);
  assert.ok(
    podada.leaves().some((no) => no.data.chave === '__outros__'),
    'faltou o bloco "Outros"'
  );
  t.diagnostic(`${raiz.leaves().length} → ${podada.leaves().length} folhas, total preservado`);
});

test('treemap — carteira pequena não é podada', (t) => {
  const { raiz } = hierarquiaDaFixture('hierarquia');
  const { raiz: podada, aviso } = podarCarteira(raiz, 150);
  assert.equal(aviso, null, 'sem excesso, não há o que anunciar');
  assert.equal(podada, raiz, 'a árvore precisa passar intacta');
  t.diagnostic('poda não aplicada, como esperado');
});

test('treemap — os retângulos não se sobrepõem nem saem da área', (t) => {
  const r = renderizar('hierarquia');
  try {
    assert.ok(r.blocos.length > 5, 'faltaram retângulos');
    for (const bloco of r.blocos) {
      const x = Number(bloco.getAttribute('x'));
      const y = Number(bloco.getAttribute('y'));
      const w = Number(bloco.getAttribute('width'));
      const h = Number(bloco.getAttribute('height'));
      assert.ok(Number.isFinite(x) && Number.isFinite(y), 'coordenada inválida');
      assert.ok(w > 0 && h > 0, 'retângulo sem área');
      assert.ok(x >= -0.5 && y >= -0.5, 'retângulo fora da área pela esquerda/topo');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.blocos.length} retângulos`);
});

test('treemap — colorir por grupo usa uma cor por ramo', (t) => {
  const porGrupo = renderizar('hierarquia', { colorirPor: 'grupo' });
  const porMedida = renderizar('hierarquia', { colorirPor: 'segundaMedida' });
  try {
    assert.ok(
      porGrupo.cores.size <= 4,
      `por grupo esperava poucas cores (uma por ramo), veio ${porGrupo.cores.size}`
    );
    assert.ok(
      porMedida.cores.size > porGrupo.cores.size,
      'a escala contínua precisa produzir mais cores do que a por grupo'
    );
    assert.equal(
      porGrupo.palco.querySelectorAll('.tm-legenda').length,
      0,
      'colorindo por grupo não existe régua de valores'
    );
  } finally {
    porGrupo.fim();
    porMedida.fim();
  }
  t.diagnostic(`grupo: ${porGrupo.cores.size} cores · medida: ${porMedida.cores.size} cores`);
});

test('treemap — carteira grande é cortada com aviso e continua legível', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.blocos.length <= 150, `esperado no máximo 150 blocos, veio ${r.blocos.length}`);
    assert.match(r.aviso, /posições/, 'o corte precisa ser anunciado');

    // As faixas de título somem quando há grupos demais: em quantidade,
    // elas sozinhas consumiriam a área inteira.
    const areaTotal = r.blocos.reduce(
      (a, b) => a + Number(b.getAttribute('width')) * Number(b.getAttribute('height')),
      0
    );
    assert.ok(areaTotal > 900 * 560 * 0.8, `os retângulos deveriam ocupar a área; ocuparam ${areaTotal}`);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.blocos.length} blocos`);
});

test('treemap — tamanho negativo gera aviso', (t) => {
  const amb = montarAmbiente();
  try {
    amb.window.eval(readFileSync(BUNDLE, 'utf8'));
    const definicao = amb.registro.treemap_carteira;
    const instancia = criarInstancia(definicao, amb.chamadasDeApi);
    const palco = amb.window.document.getElementById('palco');

    const cel = (v) => ({ value: v, rendered: String(v) });
    const data = [
      { c: cel('A'), v: cel(100) },
      { c: cel('B'), v: cel(-40) },
      { c: cel('C'), v: cel(60) },
    ];
    const queryResponse = {
      fields: {
        dimension_like: [{ name: 'c', label: 'Ativo', label_short: 'Ativo', type: 'string' }],
        measure_like: [{ name: 'v', label: 'Posição', label_short: 'Posição', type: 'sum', is_numeric: true }],
        pivots: [],
      },
      pivots: [],
    };

    instancia.create(palco, configPadrao(definicao));
    instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

    assert.match(
      palco.querySelector('.bl-aviso')?.textContent || '',
      /tamanho negativo/i,
      'a área de um retângulo não pode ser negativa, e o usuário precisa saber'
    );
  } finally {
    amb.restaurar();
  }
  t.diagnostic('aviso de negativos conferido');
});
