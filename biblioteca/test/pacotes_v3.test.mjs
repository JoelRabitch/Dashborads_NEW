/**
 * pacotes_v3.test.mjs — pacotes temáticos e pacote Café (melhorias v3,
 * 5.14b a 5.14h).
 *
 * Com BL_SEM_PACOTES=1 (build sem pacotes, `npm run testar-sem-pacotes`)
 * os testes que dependem do Café viram um teste do contrário: nada de
 * `cafe_` nos bundles e as listas sem itens de pacote.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');
const SEM_PACOTES = process.env.BL_SEM_PACOTES === '1';
const comPacote = { skip: SEM_PACOTES ? 'build sem pacotes' : false };

function abrir(id, fixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES[fixture]();
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  return { amb, palco, definicao, fim: () => amb.restaurar() };
}

const valoresDe = (opcao) => (opcao && opcao.values ? opcao.values.map((v) => Object.values(v)[0]) : []);

test('5.14b — sem pacotes: o código do Café não entra em nenhum bundle', { skip: !SEM_PACOTES }, () => {
  for (const id of ['bump_chart', 'kpi_vivo', 'cartao_multivalor', 'tabela_completa', 'org_chart']) {
    const codigo = readFileSync(join(DIST, `${id}.js`), 'utf8');
    assert.doesNotMatch(codigo, /src\/packs\/cafe|desenharXicara|cafe_espresso|#3B2416/, id);
  }
});

test('5.14c/d/e/h — registro do Café: 15 ícones (contorno e preenchido), 3 formas, 5 paletas ≥ 8 cores distintas, 2 escalas', comPacote, async () => {
  const amb = montarAmbiente();
  try {
    await import('../src/packs/cafe/index.js');
    const { listarIcones } = await import('../src/core/icones.js');
    const { listarPacotes } = await import('../src/core/pacotes.js');
    const { PALETAS_CATEGORICAS, ESCALAS_CONTINUAS } = await import('../src/core/theme.js');
    const { FORMAS_DE_MARCADOR, caminhoDoSimbolo } = await import('../src/core/shapes.js');
    assert.ok(listarPacotes().some((p) => p.id === 'cafe'));
    const icones = listarIcones().filter((i) => i.pacote === 'cafe');
    const esperados = ['xicara', 'copo', 'grao', 'prensa', 'moedor', 'espresso', 'croissant', 'bolo', 'loja', 'quiosque', 'caminhao', 'cupom', 'fidelidade', 'coroa', 'cartao'];
    assert.deepEqual(icones.map((i) => i.id).sort(), esperados.map((e) => `cafe_${e}`).sort());
    for (const f of ['cafe_xicara', 'cafe_grao', 'cafe_copo']) {
      assert.ok(FORMAS_DE_MARCADOR.includes(f), f);
      assert.ok(caminhoDoSimbolo(f, 12).length > 10 && !/NaN/.test(caminhoDoSimbolo(f, 12)), f);
    }
    for (const id of ['cafe_espresso', 'cafe_latte', 'cafe_caramelo', 'cafe_crema', 'cafe_mocha']) {
      const cores = PALETAS_CATEGORICAS[id].cores.map((c) => c.toUpperCase());
      assert.ok(cores.length >= 8, `${id}: menos de 8 cores`);
      assert.equal(new Set(cores).size, cores.length, `${id}: cores repetidas`);
    }
    for (const id of ['cafe_torra', 'cafe_torra_divergente']) {
      const f = ESCALAS_CONTINUAS[id].interpolador;
      assert.match(f(0), /^rgb/);
      assert.notEqual(f(0), f(1));
    }
  } finally {
    amb.restaurar();
  }
});

test('5.14b/e — "Pacote temático": listas com o pacote ligado; sem os itens com "Nenhum"', comPacote, () => {
  const ligado = abrir('bump_chart', 'temporal');
  const nenhum = abrir('bump_chart', 'temporal', { pacoteTematico: 'nenhum' });
  try {
    assert.equal(ligado.definicao.options.pacoteTematico.default, 'cafe');
    assert.ok(valoresDe(ligado.definicao.options.paleta).includes('cafe_espresso'), 'paleta do Café ausente com o pacote ligado');
    const registradas = nenhum.amb.chamadasDeApi.opcoesRegistradas;
    assert.ok(registradas, 'trocar o pacote deveria registrar o painel de novo');
    assert.ok(!valoresDe(registradas.paleta).some((v) => String(v).startsWith('cafe_')), 'com "Nenhum" a lista ainda mostra o Café');
    assert.ok(valoresDe(registradas.paleta).includes('looker'), 'as paletas base continuam');
  } finally {
    ligado.fim();
    nenhum.fim();
  }
});

test('5.14b — valor salvo de pacote desligado continua sendo desenhado', comPacote, () => {
  const r = abrir('bump_chart', 'temporal', { pacoteTematico: 'nenhum', paleta: 'cafe_espresso' });
  try {
    const cor = r.palco.querySelector('.bp-linha').getAttribute('stroke').toUpperCase();
    assert.equal(cor, '#3B2416', 'a paleta salva do pacote não foi usada');
  } finally {
    r.fim();
  }
});

test('5.14d — ícones do Café no kpi_vivo (contorno e preenchido) e "Estilo do ícone"', comPacote, () => {
  const c = abrir('kpi_vivo', 'temporal', { iconeDoKpi: 'cafe_xicara' });
  const p = abrir('kpi_vivo', 'temporal', { iconeDoKpi: 'cafe_grao', estiloDoIcone: 'preenchido' });
  try {
    assert.ok(valoresDe(c.definicao.options.iconeDoKpi).includes('seta'), 'os 9 ícones antigos permanecem');
    assert.ok(valoresDe(c.definicao.options.iconeDoKpi).includes('cafe_coroa'));
    assert.ok(c.definicao.options.estiloDoIcone, 'falta "Estilo do ícone"');
    assert.equal(c.palco.querySelector('svg[data-icone="cafe_xicara"] path').getAttribute('fill'), 'none');
    assert.notEqual(p.palco.querySelector('svg[data-icone="cafe_grao"] path').getAttribute('fill'), 'none');
  } finally {
    c.fim();
    p.fim();
  }
});

test('5.14g — progresso em xícara: kpi (meta), cartão e tabela; animação desligável', comPacote, () => {
  const k = abrir('kpi_vivo', 'temporal', { mostrarProgressoDaMeta: true, meta: 1000, progressoEmXicara: true });
  const c = abrir('cartaoUnico' in FIXTURES ? 'cartao_multivalor' : 'cartao_multivalor', 'cartaoUnico', { mv_nota_tipo: 'cafe_xicara', mv_nota_meta: 10 });
  const t = abrir('tabela_completa', 'semPivo', { col_med_vendas_tipoDeCelula: 'cafe_xicara', animacaoAtiva: false });
  try {
    assert.ok(k.palco.querySelector('svg.cafe-xicara'), 'kpi sem a xícara');
    const x = c.palco.querySelector('.mv-item[data-campo="nota"] svg.cafe-xicara');
    assert.ok(x, 'cartão sem a xícara');
    assert.equal(x.getAttribute('data-fracao'), '0.870');
    const tx = t.palco.querySelector('svg.cafe-xicara');
    assert.ok(tx, 'tabela sem a xícara');
    assert.equal(tx.querySelector('.cafe-liquido').style.transition, '', 'na tabela a xícara não anima');
  } finally {
    k.fim();
    c.fim();
    t.fim();
  }
});

test('5.14f/h — ícone por valor (organograma, tabela) e forma de marcador do pacote', comPacote, () => {
  const o = abrir('org_chart', 'paiFilho', { mapaDeIconesPorValor: 'Operações=cafe_loja; Comercial=cafe_quiosque', coresPorValor: 'Operações=#2F5D57' });
  const t = abrir('tabela_completa', 'semPivo', { col_dim_loja_tipoDeCelula: 'icone', iconePadraoPorValor: 'cafe_cartao' });
  const d = abrir('dumbbell', 'ohlc', { formaDoPonto: 'cafe_grao' });
  try {
    const loja = o.palco.querySelector('svg[data-icone="cafe_loja"]');
    assert.ok(loja, 'organograma sem o ícone por valor');
    assert.equal(loja.querySelector('path').getAttribute('stroke'), '#2F5D57');
    assert.ok(o.palco.querySelector('svg[data-icone="cafe_quiosque"]'));
    assert.ok(t.palco.querySelector('td svg[data-icone="cafe_cartao"]'), 'tabela: ícone padrão para valor sem mapeamento');
    assert.ok(d.palco.querySelector('[data-forma="cafe_grao"]'), 'forma do pacote nos pontos');
  } finally {
    o.fim();
    t.fim();
    d.fim();
  }
});
