/**
 * correcoes_kpi_recursos.test.mjs — recursos novos do kpi_vivo (Fase C das
 * correções v2): minigráfico, cores de positivo/negativo, meta com barra,
 * grade de KPIs, formato do número, ícone, limites, layouts, título e
 * subtítulo no cartão, clique abre drill.
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

function KV(ajustes = {}, fixture = 'temporal', comLinks = false) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, 'kpi_vivo.js'), 'utf8'));
  const definicao = amb.registro.kpi_vivo;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES[fixture]();
  if (comLinks) for (const linha of data) for (const c of Object.values(linha)) if (c && typeof c === 'object' && 'value' in c) c.links = [{ url: '/explore' }];
  inst.create(palco, configPadrao(definicao));
  inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), { animacaoAtiva: false }, ajustes), queryResponse, {}, () => {});
  return { amb, palco, q: (s) => palco.querySelector(s), qa: (s) => Array.from(palco.querySelectorAll(s)), fim: () => amb.restaurar() };
}

test('kpi — minigráfico em linha, área e barras', () => {
  const barras = KV({ tipoDeSparkline: 'barras' });
  const linha = KV({ tipoDeSparkline: 'linha' });
  const area = KV({ tipoDeSparkline: 'area' });
  try {
    assert.ok(barras.qa('.kv-barra').length > 2, 'barras: nenhuma barra');
    assert.equal(linha.qa('.kv-area').length, 0, 'linha: não pode ter área');
    assert.ok(linha.q('.kv-linha'));
    assert.ok(area.q('.kv-area') && area.q('.kv-linha'));
  } finally {
    [barras, linha, area].forEach((r) => r.fim());
  }
});

test('kpi — cores de positivo/negativo, limites e formato do número', () => {
  const pos = KV({ corPositiva: '#00AA00', corNegativa: '#AA0000' });
  const verde = KV({ usarLimites: true, limiteVerde: -1e12, limiteAmarelo: -1e13 });
  const vermelho = KV({ usarLimites: true, limiteVerde: 1e15, limiteAmarelo: 1e14 });
  const compacto = KV({ formatoDoNumero: 'compacto', casasDoNumero: 1 });
  const moeda = KV({ formatoDoNumero: 'moeda', simboloDaMoeda: 'US$ ' });
  try {
    const cor = pos.q('.kv-percentual').style.color.replace(/\s/g, '');
    assert.ok(['rgb(0,170,0)', 'rgb(170,0,0)'].includes(cor), `variação sem a cor escolhida: ${cor}`);
    assert.notEqual(verde.q('.kv-numero').style.color, vermelho.q('.kv-numero').style.color, 'limites não mudam a cor');
    assert.match(compacto.q('.kv-numero').textContent, /[KMBT]$/);
    assert.match(moeda.q('.kv-numero').textContent, /^US\$ /);
  } finally {
    [pos, verde, vermelho, compacto, moeda].forEach((r) => r.fim());
  }
});

test('kpi — meta com barra de progresso, ícone, layouts, título e subtítulo no cartão', () => {
  const meta = KV({ mostrarProgressoDaMeta: true, meta: 1 });
  const icone = KV({ iconeDoKpi: 'estrela' });
  const horizontal = KV({ layoutDoCartao: 'horizontal' });
  const compacto = KV({ layoutDoCartao: 'compacto' });
  const titulos = KV({ titulo: 'Receita', subtitulo: 'acumulado do mês' });
  try {
    assert.ok(meta.q('.kv-progresso-barra'), 'sem barra de progresso');
    assert.match(meta.q('.kv-progresso-texto').textContent, /da meta/);
    assert.ok(icone.q('svg[data-icone="estrela"] path'), 'sem ícone');
    assert.ok(horizontal.q('.kv-cartao.kv-horizontal'));
    assert.ok(compacto.q('.kv-cartao.kv-compacto'));
    assert.equal(titulos.q('.kv-titulo').textContent, 'Receita');
    assert.equal(titulos.q('.kv-subtitulo').textContent, 'acumulado do mês');
    // v3 (5.1c): com cabeçalho próprio o componente único não desenha o título.
    assert.equal(titulos.q('.bl-cabecalho .bl-titulo'), null, 'o título não pode sair duas vezes (cabeçalho + cartão)');
  } finally {
    [meta, icone, horizontal, compacto, titulos].forEach((r) => r.fim());
  }
});

test('kpi — vários KPIs em grade, com linhas e colunas', () => {
  const grade = KV({ kpisEmGrade: true }, 'semPivo');
  const umSo = KV({ kpisEmGrade: true, colunasDoKpi: 1, linhasDoKpi: 1 }, 'semPivo');
  try {
    assert.ok(grade.qa('.kv-cartao').length >= 2, 'a grade precisa de um cartão por medida');
    assert.equal(umSo.qa('.kv-cartao').length, 1, '1×1 mostra um cartão');
    assert.match(umSo.q('.bl-aviso').textContent, /grade 1×1/);
  } finally {
    [grade, umSo].forEach((r) => r.fim());
  }
});

test('kpi — clique no cartão abre o drill', () => {
  const r = KV({}, 'temporal', true);
  try {
    r.q('.kv-cartao').dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.equal(r.amb.chamadasDeApi.drills, 1);
  } finally {
    r.fim();
  }
});
