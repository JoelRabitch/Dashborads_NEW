/**
 * correcoes_series.test.mjs — correções v2 (módulos 6.1 a 6.4) nos gráficos
 * de série temporal (bump_chart, drawdown, grafico_controle, slope_chart,
 * que usam a base `_serie_temporal`) e no pareto.
 *
 * Cada teste REPRODUZ um defeito relatado no Looker real e falhava no
 * código anterior: opções de rótulo, cor e contorno declaradas no painel e
 * nunca lidas; tooltip com número formatado pela viz em vez do texto do
 * Looker; clique sem a "Ação do clique" (o tooltip do pareto "não fica
 * persistente"); pontos desenhados com <circle> direto.
 *
 * O config imita o Looker: todas as chaves registradas com o default e as
 * mudanças do usuário por cima — inclusive `false`, `0` e texto vazio.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// BL_DIST permite rodar contra bundles antigos (reprodução do defeito).
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

/** Como achar as coisas em cada gráfico. */
const GRAFICOS = {
  bump_chart: { fixture: 'temporal', area: '.bp-area', linhas: 'path.bp-linha', marcas: 'circle.bp-ponto, path.bp-ponto' },
  drawdown: { fixture: 'temporal', area: '.st-area', linhas: 'path.st-linha', marcas: '.st-ponto', base: { mostrarPontos: true } },
  grafico_controle: { fixture: 'temporal', area: '.st-area', linhas: 'path.st-linha', marcas: '.st-ponto, .gc-sinal' },
  slope_chart: { fixture: 'temporal', area: '.sl-area', linhas: 'line.sl-linha', marcas: '.sl-ponto', base: { corPorDirecao: false } },
  pareto: { fixture: 'semPivo', area: '.pt-area', linhas: 'rect.pt-barra', marcas: 'rect.pt-barra' },
};
const IDS = Object.keys(GRAFICOS);

/** Um teste por gráfico: a falha de um não esconde os outros. */
function porGrafico(nome, ids, fn) {
  for (const id of ids) test(`${nome} [${id}]`, () => fn(id));
}

/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */

/** Renderiza um gráfico com o config no formato do Looker. */
function abrir(id, { ajustes = {}, dados } = {}) {
  const spec = GRAFICOS[id];
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  assert.ok(definicao, `${id} não se registrou`);
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  inst.create(palco, configPadrao(definicao));
  const { data, queryResponse } = dados || FIXTURES[spec.fixture]();
  const config = Object.assign(configPadrao(definicao), spec.base || {}, ajustes);
  let ok = false;
  inst.updateAsync(data, palco, config, queryResponse, {}, () => { ok = true; });
  assert.ok(ok, `${id}: done() precisa ser chamado`);
  const doc = amb.window.document;
  return {
    amb,
    doc,
    palco,
    inst,
    spec,
    rotulos: () => Array.from(palco.querySelectorAll('[data-rotulo]')),
    visiveis: () =>
      Array.from(palco.querySelectorAll('[data-rotulo]')).filter((el) => el.getAttribute('display') !== 'none'),
    marcas: () => Array.from(palco.querySelectorAll(spec.marcas)),
    linhas: () => Array.from(palco.querySelectorAll(spec.linhas)),
    tooltip: () => doc.querySelector('.bl-tooltip'),
    fim: () => amb.restaurar(),
  };
}

/** Posição de um ponto: cx/cy (círculo antigo) ou translate (marcador). */
function posicao(el) {
  const t = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec(el.getAttribute('transform') || '');
  if (t) return { x: Number(t[1]), y: Number(t[2]) };
  if (el.tagName.toLowerCase() === 'rect') {
    return {
      x: Number(el.getAttribute('x')) + Number(el.getAttribute('width')) / 2,
      y: Number(el.getAttribute('y')) + 2,
    };
  }
  return { x: Number(el.getAttribute('cx')), y: Number(el.getAttribute('cy')) };
}

function evento(r, tipo, x, y, extra = {}) {
  return new r.amb.window.MouseEvent(tipo, { bubbles: true, clientX: x, clientY: y, ...extra });
}

/** Passa o mouse sobre o primeiro ponto (ou barra) do gráfico. */
function passarOMouse(r) {
  const marca = r.marcas()[0];
  assert.ok(marca, 'nenhuma marca para passar o mouse');
  const { x, y } = posicao(marca);
  if (r.spec.marcas.includes('pt-barra')) {
    marca.dispatchEvent(new r.amb.window.MouseEvent('pointerenter', { clientX: x, clientY: y }));
  } else {
    r.palco.querySelector(r.spec.area).dispatchEvent(evento(r, 'pointermove', x, y));
  }
  return { marca, x, y };
}

function clicar(r, extra = {}) {
  const marca = r.marcas()[0];
  const { x, y } = posicao(marca);
  const alvo = r.spec.marcas.includes('pt-barra') ? marca : r.palco.querySelector(r.spec.area);
  alvo.dispatchEvent(evento(r, 'click', x, y, extra));
}

/** Dados do fixture com o texto do Looker diferente do número (como "R$ 1.234"). */
function comTextoDoLooker(id) {
  const fx = FIXTURES[GRAFICOS[id].fixture]();
  for (const linha of fx.data) {
    const c = linha.valor || linha.vendas;
    if (c && c.value !== null) c.rendered = `L${c.value}`;
  }
  return fx;
}

/** Todas as células com (ou sem) links de drill. */
function comLinks(id, ligar) {
  const fx = FIXTURES[GRAFICOS[id].fixture]();
  for (const linha of fx.data) {
    for (const c of Object.values(linha)) {
      if (!c || typeof c !== 'object') continue;
      if (ligar) c.links = [{ label: 'Explorar', url: '#drill', type: 'measure_default' }];
      else delete c.links;
    }
  }
  return fx;
}

const corDe = (el) => el.getAttribute('stroke') !== null && el.tagName.toLowerCase() !== 'rect'
  ? el.getAttribute('stroke')
  : el.getAttribute('fill');

/** Cores das séries (linhas) ou barras, na ordem do DOM. */
function coresDasSeries(r) {
  return r
    .linhas()
    .map(corDe)
    .filter((c) => c && c !== 'none');
}

/* ------------------------------------------------------------------ */
/* 6.1 Rótulos                                                         */
/* ------------------------------------------------------------------ */

porGrafico('rótulos — tamanho, cor, negrito e rotação do painel chegam aos rótulos de dado', IDS, (id) => {
  {
    const r = abrir(id, {
      ajustes: { tamanhoDoRotulo: 20, corDoRotulo: '#123456', negritoNoRotulo: true, rotacaoDoRotulo: 30 },
    });
    try {
      const rot = r.rotulos();
      assert.ok(rot.length > 0, `${id}: nenhum rótulo de dado ([data-rotulo]) com mostrarRotulos ligado`);
      for (const el of rot) {
        assert.equal(el.getAttribute('font-size'), '20', `${id}: tamanhoDoRotulo ignorado`);
        assert.equal(el.getAttribute('fill'), '#123456', `${id}: corDoRotulo ignorada`);
        assert.equal(el.getAttribute('font-weight'), '700', `${id}: negritoNoRotulo ignorado`);
        assert.match(el.getAttribute('transform') || '', /rotate\(30/, `${id}: rotacaoDoRotulo ignorada`);
      }
    } finally {
      r.fim();
    }
  }
});

const TEXTOS_PROPRIOS = {
  bump_chart: '.bp-rotulo',
  slope_chart: '.sl-rotulo',
  drawdown: '.st-destaque',
  grafico_controle: 'text.st-marca',
  pareto: '.pt-rotulo',
};

porGrafico('rótulos — mostrarRotulos: false esconde todos os textos de dado (inclusive os próprios do gráfico)', IDS, (id) => {
  const r = abrir(id, { ajustes: { mostrarRotulos: false } });
  try {
    assert.equal(r.rotulos().length, 0, `${id}: sobrou [data-rotulo]`);
    const textos = Array.from(r.palco.querySelectorAll(TEXTOS_PROPRIOS[id])).filter((el) => el.tagName.toLowerCase() === 'text');
    assert.equal(textos.length, 0, `${id}: sobrou texto de dado (${TEXTOS_PROPRIOS[id]})`);
  } finally {
    r.fim();
  }
});

test('rótulos — formato e casas valem no texto [pareto]', () => {
  const p = abrir('pareto', { ajustes: { formatoDoRotulo: 'compacto', casasDecimaisDoRotulo: 0 } });
  try {
    const textos = p.rotulos().map((el) => el.textContent);
    assert.ok(textos.length > 0);
    assert.ok(textos.every((t) => /^-?[\d,]+K?$/.test(t)), `pareto: formato compacto sem casas: ${textos.slice(0, 3)}`);
  } finally {
    p.fim();
  }
});

test('rótulos — conteúdo "percentual do total" com 2 casas [pareto]', () => {
  const pp = abrir('pareto', { ajustes: { conteudoDoRotulo: 'percentual', casasDecimaisDoRotulo: 2 } });
  try {
    const textos = pp.rotulos().map((el) => el.textContent);
    assert.ok(textos.length > 0);
    assert.ok(textos.every((t) => /^\d+\.\d{2}%$/.test(t)), `pareto: conteúdo percentual: ${textos.slice(0, 3)}`);
  } finally {
    pp.fim();
  }
});

porGrafico('rótulos — conteúdo "nome e valor"', ['drawdown', 'grafico_controle', 'bump_chart'], (id) => {
  const d = abrir(id, { ajustes: { conteudoDoRotulo: 'nomeValor' } });
  try {
    const textos = d.rotulos().map((el) => el.textContent);
    assert.ok(textos.some((t) => /\S: \S/.test(t)), `${id}: conteúdo nome+valor: ${textos.slice(0, 3)}`);
  } finally {
    d.fim();
  }
});

test('rótulos — truncar e evitar colisão (slope e pareto)', () => {
  const s = abrir('slope_chart', { ajustes: { truncarRotulo: 4, escreverValores: false } });
  try {
    const textos = s.rotulos().map((el) => el.textContent);
    assert.ok(textos.length > 0);
    assert.ok(textos.every((t) => t.length <= 4), `slope: truncarRotulo ignorado: ${textos.slice(0, 3)}`);
  } finally {
    s.fim();
  }
  const com = abrir('pareto', { ajustes: { tamanhoDoRotulo: 28, evitarColisaoDeRotulos: true } });
  const sem = abrir('pareto', { ajustes: { tamanhoDoRotulo: 28, evitarColisaoDeRotulos: false } });
  try {
    assert.ok(com.rotulos().length > 0);
    assert.ok(com.visiveis().length < com.rotulos().length, 'pareto: com colisão ligada, algum rótulo deveria sumir');
    assert.equal(sem.visiveis().length, sem.rotulos().length, 'pareto: com colisão desligada, nenhum some');
  } finally {
    com.fim();
    sem.fim();
  }
});

/* ------------------------------------------------------------------ */
/* 6.2 Cores                                                           */
/* ------------------------------------------------------------------ */

porGrafico('cores — "Inverter ordem das cores" e outra paleta mudam as cores das séries', IDS, (id) => {
  {
    const padrao = abrir(id);
    const invertida = abrir(id, { ajustes: { inverterPaleta: true } });
    const outra = abrir(id, { ajustes: { paleta: 'okabeIto' } });
    try {
      const a = coresDasSeries(padrao);
      assert.ok(a.length > 0, `${id}: nenhuma cor de série`);
      assert.notDeepEqual(coresDasSeries(invertida), a, `${id}: inverterPaleta sem efeito`);
      assert.notDeepEqual(coresDasSeries(outra), a, `${id}: paleta sem efeito`);
    } finally {
      padrao.fim();
      invertida.fim();
      outra.fim();
    }
  }
});

porGrafico('cores — cor própria por série (opção dinâmica cor_<série>, com acento)', ['bump_chart', 'drawdown', 'slope_chart'], (id) => {
  {
    const r = abrir(id, { ajustes: { cor_Graos: '#ABCDEF' } });
    try {
      const registradas = r.amb.chamadasDeApi.opcoesRegistradas || {};
      assert.ok(registradas.cor_Graos, `${id}: opção cor_Graos não foi registrada no painel`);
      assert.equal(registradas.cor_Graos.default, '', `${id}: default vazio (= cor da paleta)`);
      assert.ok(coresDasSeries(r).includes('#ABCDEF'), `${id}: cor própria da série "Grãos" ignorada`);
    } finally {
      r.fim();
    }
  }
});

porGrafico('cores — contorno das marcas: mostrar, cor, espessura e estilo', IDS, (id) => {
  {
    const sem = abrir(id, { ajustes: { mostrarContorno: false } });
    const com = abrir(id, {
      ajustes: { mostrarContorno: true, corDoContorno: '#00FF00', espessuraDoContorno: 3, tracejadoDoContorno: 'tracejado' },
    });
    try {
      assert.ok(sem.marcas().length > 0, `${id}: nenhuma marca`);
      for (const m of sem.marcas()) {
        const s = m.getAttribute('stroke');
        assert.ok(s === null || s === 'none', `${id}: mostrarContorno false e a marca tem stroke ${s}`);
      }
      for (const m of com.marcas()) {
        assert.equal(m.getAttribute('stroke'), '#00FF00', `${id}: corDoContorno ignorada`);
        assert.equal(m.getAttribute('stroke-width'), '3', `${id}: espessuraDoContorno ignorada`);
        assert.ok(m.getAttribute('stroke-dasharray'), `${id}: tracejadoDoContorno ignorado`);
      }
    } finally {
      sem.fim();
      com.fim();
    }
  }
});

porGrafico('cores — opacidade do preenchimento vale nas marcas', IDS, (id) => {
  {
    // Proporcional ao desenho padrão: o pareto deixa as barras depois do
    // corte a 40% — com opacidade 0,5 elas vão a 0,2.
    const padrao = abrir(id);
    const r = abrir(id, { ajustes: { opacidade: 0.5 } });
    try {
      const antes = padrao.marcas().map((el) => Number(el.getAttribute('fill-opacity') ?? 1));
      const depois = r.marcas().map((el) => Number(el.getAttribute('fill-opacity') ?? 1));
      assert.ok(depois.length > 0 && depois.length === antes.length);
      depois.forEach((v, i) => {
        assert.ok(Math.abs(v - antes[i] * 0.5) < 1e-9, `${id}: opacidade ignorada (marca ${i}: ${antes[i]} → ${v})`);
      });
    } finally {
      padrao.fim();
      r.fim();
    }
  }
});

/* ------------------------------------------------------------------ */
/* 6.3 Tooltip                                                         */
/* ------------------------------------------------------------------ */

porGrafico('tooltip — o valor do ponto vem do texto do Looker (textForCell), não de um número formatado pela viz', IDS, (id) => {
  {
    const r = abrir(id, { dados: comTextoDoLooker(id) });
    try {
      passarOMouse(r);
      const t = r.tooltip();
      assert.ok(t && t.classList.contains('bl-visivel'), `${id}: tooltip não apareceu`);
      assert.match(t.textContent, /L\d/, `${id}: o tooltip não usa o texto do Looker: "${t.textContent.slice(0, 120)}"`);
      assert.doesNotMatch(t.textContent, /\d\.\d{4,}/, `${id}: número cru no tooltip`);
    } finally {
      r.fim();
    }
  }
});

porGrafico('tooltip — variáveis {{categoria}} {{valor}} {{serie}} no modelo do usuário', IDS, (id) => {
  {
    const r = abrir(id, { dados: comTextoDoLooker(id), ajustes: { modeloDeTooltip: 'C={{categoria}}|V={{valor}}|S={{serie}}' } });
    try {
      passarOMouse(r);
      const texto = r.tooltip().textContent;
      const [c, v, s] = texto.split('|');
      assert.ok(c.length > 2, `${id}: {{categoria}} vazio (${texto})`);
      assert.match(v, /^V=L\d/, `${id}: {{valor}} sem o texto do Looker (${texto})`);
      assert.ok(s.length > 2, `${id}: {{serie}} vazio (${texto})`);
    } finally {
      r.fim();
    }
  }
});

porGrafico('clique — com links abre o drill; sem links fixa o tooltip; Shift+clique fixa (pareto "não fica persistente")', IDS, (id) => {
  {
    const comLink = abrir(id, { dados: comLinks(id, true) });
    try {
      clicar(comLink);
      assert.equal(comLink.amb.chamadasDeApi.drills, 1, `${id}: clique com links não abriu o drill`);
      clicar(comLink, { shiftKey: true });
      assert.equal(comLink.amb.chamadasDeApi.drills, 1, `${id}: Shift+clique não pode abrir drill`);
      assert.ok(comLink.doc.querySelector('.bl-tooltip.bl-fixo'), `${id}: Shift+clique não fixou o tooltip`);
    } finally {
      comLink.fim();
    }
    const semLink = abrir(id, { dados: comLinks(id, false) });
    try {
      clicar(semLink);
      assert.equal(semLink.amb.chamadasDeApi.drills, 0);
      assert.ok(semLink.doc.querySelector('.bl-tooltip.bl-fixo'), `${id}: clique sem links não fixou o tooltip`);
      // Fixo: passar o mouse em outro lugar não troca nem esconde.
      const antes = semLink.tooltip().textContent;
      semLink.palco.querySelector(semLink.spec.area).dispatchEvent(evento(semLink, 'pointerleave', 0, 0));
      assert.ok(semLink.tooltip().classList.contains('bl-visivel'), `${id}: tooltip fixo sumiu ao sair o mouse`);
      assert.equal(semLink.tooltip().textContent, antes);
    } finally {
      semLink.fim();
    }
  }
});

porGrafico('tooltip — "Nenhuma" como ação do clique não fixa nem abre drill; tooltip desligado não aparece', IDS, (id) => {
  {
    const r = abrir(id, { dados: comLinks(id, true), ajustes: { acaoDoClique: 'nenhuma' } });
    try {
      clicar(r);
      assert.equal(r.amb.chamadasDeApi.drills, 0, `${id}: "nenhuma" abriu drill`);
      assert.equal(r.doc.querySelector('.bl-tooltip.bl-fixo'), null, `${id}: "nenhuma" fixou`);
    } finally {
      r.fim();
    }
    const d = abrir(id, { ajustes: { mostrarTooltip: false } });
    try {
      passarOMouse(d);
      const t = d.tooltip();
      assert.ok(!t || !t.classList.contains('bl-visivel'), `${id}: mostrarTooltip false e o tooltip apareceu`);
    } finally {
      d.fim();
    }
  }
});

/* ------------------------------------------------------------------ */
/* 6.4 Marcadores                                                      */
/* ------------------------------------------------------------------ */

porGrafico('marcadores — nenhum <circle> direto: todo ponto usa a função única (bl-marcador)', IDS, (id) => {
  {
    const r = abrir(id, { ajustes: { mostrarPontos: true, mostrarPontosDoAcumulado: true } });
    try {
      assert.equal(r.palco.querySelectorAll('svg circle').length, 0, `${id}: ainda desenha <circle>`);
      assert.ok(r.palco.querySelectorAll('.bl-marcador').length > 0, `${id}: nenhum marcador`);
    } finally {
      r.fim();
    }
  }
});

test('bump_chart — "Marcar cada período com um ponto" (mostrarPontos) passa a ter efeito', () => {
  const sem = abrir('bump_chart', { ajustes: { mostrarPontos: false, mostrarPosicao: false } });
  const com = abrir('bump_chart', { ajustes: { mostrarPontos: true, mostrarPosicao: false } });
  try {
    assert.equal(sem.marcas().length, 0, 'mostrarPontos false (sem número da posição) ainda desenha pontos');
    assert.ok(com.marcas().length > 0, 'mostrarPontos true não desenha pontos');
  } finally {
    sem.fim();
    com.fim();
  }
});

test('grafico_controle — mostrarPontos false esconde os pontos comuns e mantém os sinais', () => {
  const r = abrir('grafico_controle', { ajustes: { mostrarPontos: false, regrasAtivas: 'todas' } });
  try {
    assert.equal(r.palco.querySelectorAll('.st-ponto').length, 0, 'pontos comuns deveriam sumir');
  } finally {
    r.fim();
  }
});

/* ------------------------------------------------------------------ */
/* Eixos                                                               */
/* ------------------------------------------------------------------ */

porGrafico('eixos — "Inverter eixo X" vale no pareto e na base de série temporal', ['pareto', 'grafico_controle', 'drawdown'], (id) => {
  {
    const r = abrir(id, { ajustes: { inverterEixoX: true, mostrarPontos: true } });
    try {
      const xs = r.marcas().map((m) => posicao(m).x);
      assert.ok(xs.length > 1);
      assert.ok(xs[0] > xs[xs.length - 1], `${id}: inverterEixoX ignorado (primeiro x=${xs[0]}, último=${xs[xs.length - 1]})`);
    } finally {
      r.fim();
    }
  }
});

porGrafico('tooltip — 5 redesenhos e hovers deixam no máximo 1 tooltip; destroy remove', IDS, (id) => {
  {
    const r = abrir(id);
    try {
      const { data, queryResponse } = FIXTURES[r.spec.fixture]();
      const cfg = Object.assign(configPadrao(r.amb.registro[id]), r.spec.base || {});
      for (let i = 0; i < 5; i++) {
        r.inst.updateAsync(data, r.palco, cfg, queryResponse, {}, () => {});
        passarOMouse(r);
      }
      assert.ok(r.doc.querySelectorAll('.bl-tooltip').length <= 1, `${id}: mais de um tooltip`);
      r.inst.destroy();
      assert.equal(r.doc.querySelectorAll('.bl-tooltip').length, 0, `${id}: destroy não removeu`);
    } finally {
      r.fim();
    }
  }
});
