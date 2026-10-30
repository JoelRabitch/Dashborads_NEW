/**
 * correcoes_conjuntos.test.mjs — reproduções dos defeitos vistos no Looker
 * real em diagrama_venn, upset_plot, treemap_carteira e marimekko
 * (correções v2, módulos 6.1 rótulos, 6.2 cores, 6.3 tooltip e 6.6 mouse).
 *
 * Cada teste foi escrito ANTES da correção e falhava no código antigo: as
 * opções de rótulo e de contorno eram declaradas no painel e nunca lidas,
 * "Inverter ordem das cores"/"Opacidade" não tinham efeito, o clique sem
 * link não fazia nada e o Venn não respondia ao mouse fora do número.
 *
 * O config imita o do Looker: `configPadrao(definicao)` (as chaves
 * registradas com os defaults) + o que o usuário mudou — inclusive `false`,
 * `0` e texto vazio.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { layoutDeConjuntos, mascaraDoPonto, posicoesDasRegioes } from '../src/charts/diagrama_venn/geometria.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

/** Carrega o bundle e devolve uma instância pronta para atualizar. */
function carregar(id) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  assert.ok(definicao, `${id} não se registrou`);
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  inst.create(palco, configPadrao(definicao));
  const doc = amb.window.document;
  const r = {
    amb,
    doc,
    definicao,
    inst,
    palco,
    /** `dados` = nome da fixture ou {data, queryResponse}. */
    atualizar(dados, ajustes = {}) {
      const { data, queryResponse } = typeof dados === 'string' ? FIXTURES[dados]() : dados;
      // Primeiro desenho registra as opções dinâmicas; o config do usuário
      // é montado com os defaults do painel inteiro, como o Looker faz.
      const config = Object.assign(configPadrao(definicao), ajustes);
      let ok = false;
      inst.updateAsync(data, palco, config, queryResponse, {}, () => { ok = true; });
      assert.ok(ok, 'done() precisa ser chamado');
      assert.equal(amb.chamadasDeApi.erros.length, 0, JSON.stringify(amb.chamadasDeApi.erros));
      return r;
    },
    tooltip: () => doc.querySelector('.bl-tooltip'),
    tooltipVisivel: () => doc.querySelector('.bl-tooltip.bl-visivel'),
    fim: () => amb.restaurar(),
  };
  return r;
}

function evento(r, tipo, el, x = 10, y = 10, extra = {}) {
  const Ctor = /^pointer/.test(tipo) && r.amb.window.PointerEvent ? r.amb.window.PointerEvent : r.amb.window.MouseEvent;
  el.dispatchEvent(new Ctor(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, ...extra }));
}

function passarMouse(r, el, x, y) {
  evento(r, 'pointerover', el, x, y);
  evento(r, 'pointerenter', el, x, y);
  evento(r, 'pointermove', el, x, y);
  evento(r, 'mousemove', el, x, y);
}

const tamanhos = (els) => els.map((e) => Number(e.getAttribute('font-size')));
const temNumeroCru = (texto) => /\d\.\d{4,}/.test(texto);

/** Fixture de regiões com `rendered` diferente do valor e (opcional) links. */
function conjuntosComRendered({ links = false } = {}) {
  const f = FIXTURES.conjuntos3();
  for (const linha of f.data) {
    const v = linha.itens.value;
    linha.itens.rendered = `${v} clientes`;
    if (links) linha.itens.links = [{ label: 'Ver', url: '/explore/x', type: 'drill' }];
  }
  return f;
}

/* ================================================================== */
/* diagrama_venn                                                       */
/* ================================================================== */

/** Um ponto DENTRO da região, longe do número (o alvo antigo tinha r=11). */
function pontoNaRegiao(mascaraAlvo, quantidade = 3) {
  // O jsdom mede tudo como 900×560 (ver ambiente.mjs): é a área do Venn.
  const largura = 900;
  const altura = 560;
  const elipses = layoutDeConjuntos(quantidade, { largura, altura, margem: 26 });
  const rotulo = posicoesDasRegioes(elipses, { largura, altura, passos: 150 }).get(mascaraAlvo);
  for (let y = 0; y < altura; y += 3) {
    for (let x = 0; x < largura; x += 3) {
      if (mascaraDoPonto(x, y, elipses) !== mascaraAlvo) continue;
      if (Math.hypot(x - rotulo.x, y - rotulo.y) > 20) return { x, y };
    }
  }
  throw new Error('região sem ponto');
}

test('venn — tamanho, cor, negrito e rotação do rótulo chegam aos números das regiões', () => {
  const r = carregar('diagrama_venn');
  try {
    r.atualizar('conjuntos3', {
      tamanhoDoRotulo: 20,
      evitarColisaoDeRotulos: false,
      corDoRotulo: '#FF0000',
      negritoNoRotulo: true,
      rotacaoDoRotulo: 30,
    });
    const valores = Array.from(r.palco.querySelectorAll('.venn-valor'));
    assert.equal(valores.length, 7, 'com "esconder sobrepostos" desligado, as 7 regiões têm número');
    assert.deepEqual([...new Set(tamanhos(valores))], [20], 'tamanhoDoRotulo: 20 → font-size 20');
    for (const v of valores) {
      assert.equal(v.getAttribute('fill'), '#FF0000');
      assert.equal(v.getAttribute('font-weight'), '700');
      assert.match(v.getAttribute('transform') || '', /rotate\(30/);
      assert.equal(v.getAttribute('data-rotulo'), '1');
    }
  } finally {
    r.fim();
  }
});

test('venn — mostrarRotulos: false esconde números e nomes; conteúdo/formato/truncar valem', () => {
  const r = carregar('diagrama_venn');
  try {
    r.atualizar('conjuntos3', { mostrarRotulos: false });
    assert.equal(r.palco.querySelectorAll('[data-rotulo], .venn-valor').length, 0);
    assert.equal(r.palco.querySelectorAll('.venn-forma').length, 3, 'as formas continuam');

    r.atualizar('conjuntos3', { conteudoDoRotulo: 'percentual', casasDecimaisDoRotulo: 0, evitarColisaoDeRotulos: false });
    const pcts = Array.from(r.palco.querySelectorAll('.venn-valor')).map((t) => t.textContent);
    assert.ok(pcts.length && pcts.every((t) => /^\d+%$/.test(t)), `percentual sem casas: ${pcts}`);

    r.atualizar('conjuntos3', { formatoDoRotulo: 'moeda', casasDecimaisDoRotulo: 2, evitarColisaoDeRotulos: false });
    const moedas = Array.from(r.palco.querySelectorAll('.venn-valor')).map((t) => t.textContent);
    assert.ok(moedas.includes('R$ 35.00'), `formato moeda com 2 casas: ${moedas}`);

    r.atualizar('conjuntos3', { conteudoDoRotulo: 'nome', truncarRotulo: 3, evitarColisaoDeRotulos: false });
    const nomes = Array.from(r.palco.querySelectorAll('.venn-valor')).map((t) => t.textContent);
    assert.ok(nomes.every((t) => t.length <= 3), `truncar em 3: ${nomes}`);

    r.atualizar('conjuntos3', { posicaoDoRotulo: 'fora' });
    assert.equal(r.palco.querySelectorAll('.venn-valor').length, 0, '"fora" leva os números para a lista');
    assert.equal(r.palco.querySelectorAll('.venn-lista div').length, 7);
  } finally {
    r.fim();
  }
});

test('venn — contorno: mostrar, cor e estilo são lidos', () => {
  const r = carregar('diagrama_venn');
  try {
    r.atualizar('conjuntos3', { mostrarContorno: false });
    for (const f of r.palco.querySelectorAll('.venn-forma')) assert.equal(f.getAttribute('stroke'), 'none');
    r.atualizar('conjuntos3', { corDoContorno: '#123456', tracejadoDoContorno: 'tracejado' });
    for (const f of r.palco.querySelectorAll('.venn-forma')) {
      assert.equal(f.getAttribute('stroke'), '#123456');
      assert.ok(f.getAttribute('stroke-dasharray'), 'estilo tracejado');
    }
  } finally {
    r.fim();
  }
});

test('venn — paleta: inverter, cor única e cor por valor mudam as formas', () => {
  const r = carregar('diagrama_venn');
  try {
    const cores = () => Array.from(r.palco.querySelectorAll('.venn-forma')).map((f) => f.getAttribute('fill'));
    r.atualizar('conjuntos3');
    const normal = cores();
    r.atualizar('conjuntos3', { inverterPaleta: true });
    assert.notDeepEqual(cores(), normal, 'inverterPaleta: true muda as cores');
    r.atualizar('conjuntos3', { modoDeCor: 'unica', corUnica: '#ABCDEF' });
    assert.deepEqual(cores(), ['#ABCDEF', '#ABCDEF', '#ABCDEF']);
    r.atualizar('conjuntos3', { modoDeCor: 'valor' });
    assert.equal(new Set(cores()).size, 3, 'por valor: totais diferentes, cores diferentes');
    r.atualizar('conjuntos3', { opacidadeDoPreenchimento: 0.8 });
    assert.equal(r.palco.querySelector('.venn-forma').getAttribute('fill-opacity'), '0.8');
  } finally {
    r.fim();
  }
});

test('venn — hover numa INTERSEÇÃO (fora do número) mostra tooltip formatado e destaca a região', () => {
  const r = carregar('diagrama_venn');
  try {
    r.atualizar(conjuntosComRendered());
    const svg = r.palco.querySelector('svg.venn-svg');
    const { x, y } = pontoNaRegiao(0b011); // A ∩ B (sem C)
    passarMouse(r, svg, x, y);
    const tip = r.tooltipVisivel();
    assert.ok(tip, 'o tooltip precisa aparecer em qualquer ponto da região');
    assert.match(tip.textContent, /A ∩ B/);
    assert.match(tip.textContent, /35 clientes/, 'o valor vem formatado pelo Looker (rendered)');
    assert.match(tip.textContent, /%/, 'percentual do total');
    assert.ok(!temNumeroCru(tip.textContent), tip.textContent);

    const destaque = r.palco.querySelector('.venn-destaque');
    assert.ok(destaque, 'a região sob o mouse ganha um destaque');
    assert.equal(destaque.getAttribute('data-mascara'), '3');
    const formas = Array.from(r.palco.querySelectorAll('.venn-forma'));
    assert.ok(formas[2].classList.contains('venn-atenuado'), 'o conjunto C (fora da região) é atenuado');

    // Outra região: o destaque acompanha.
    const c = pontoNaRegiao(0b100);
    passarMouse(r, svg, c.x, c.y);
    assert.equal(r.palco.querySelector('.venn-destaque').getAttribute('data-mascara'), '4');
    assert.match(r.tooltipVisivel().textContent, /só C/);

    // Saindo do gráfico, tudo volta.
    evento(r, 'pointerleave', svg, 0, 0);
    assert.equal(r.palco.querySelector('.venn-destaque'), null);
    assert.equal(r.palco.querySelectorAll('.venn-atenuado').length, 0);

    // "Destacar ao passar o mouse" desligado: tooltip sim, destaque não.
    r.atualizar(conjuntosComRendered(), { destacarAoPassarMouse: false });
    const svg3 = r.palco.querySelector('svg.venn-svg');
    const p3 = pontoNaRegiao(0b011);
    passarMouse(r, svg3, p3.x, p3.y);
    assert.match(r.tooltipVisivel().textContent, /A ∩ B/);
    assert.equal(r.palco.querySelector('.venn-destaque'), null);
  } finally {
    r.fim();
  }
});

test('venn — clique: drill quando a região tem links; fixa o tooltip quando não tem', () => {
  const r = carregar('diagrama_venn');
  try {
    r.atualizar(conjuntosComRendered({ links: true }));
    const svg = r.palco.querySelector('svg.venn-svg');
    const p = pontoNaRegiao(0b011);
    passarMouse(r, svg, p.x, p.y);
    evento(r, 'click', svg, p.x, p.y);
    assert.equal(r.amb.chamadasDeApi.drills, 1, 'célula com links abre o drill do Looker');

    r.atualizar(conjuntosComRendered());
    const svg2 = r.palco.querySelector('svg.venn-svg');
    passarMouse(r, svg2, p.x, p.y);
    evento(r, 'click', svg2, p.x, p.y);
    assert.ok(r.doc.querySelector('.bl-tooltip.bl-fixo'), 'sem links, o clique fixa o tooltip');
    assert.equal(r.doc.querySelectorAll('.bl-tooltip').length, 1, 'um único tooltip');
  } finally {
    r.fim();
  }
});

/* ================================================================== */
/* upset_plot                                                          */
/* ================================================================== */

test('upset — rótulos das barras usam a função única (tamanho, ocultar, conteúdo)', () => {
  const r = carregar('upset_plot');
  try {
    r.atualizar('conjuntos3', { tamanhoDoRotulo: 20, corDoRotulo: '#FF0000' });
    const rotulos = Array.from(r.palco.querySelectorAll('[data-rotulo]'));
    assert.equal(rotulos.length, 7, 'um rótulo por barra');
    assert.deepEqual([...new Set(tamanhos(rotulos))], [20]);
    assert.equal(rotulos[0].getAttribute('fill'), '#FF0000');

    r.atualizar('conjuntos3', { mostrarRotulos: false });
    assert.equal(r.palco.querySelectorAll('[data-rotulo]').length, 0);
    assert.equal(r.palco.querySelectorAll('svg text').length, 3, 'só os nomes dos conjuntos');

    r.atualizar('conjuntos3', { conteudoDoRotulo: 'percentual', casasDecimaisDoRotulo: 0 });
    const textos = Array.from(r.palco.querySelectorAll('[data-rotulo]')).map((t) => t.textContent);
    assert.ok(textos.every((t) => /^\d+%$/.test(t)), `percentual: ${textos}`);
  } finally {
    r.fim();
  }
});

test('upset — aba Cores: inverter paleta, opacidade e contorno chegam às barras', () => {
  const r = carregar('upset_plot');
  try {
    r.atualizar('conjuntos3');
    const corNormal = r.palco.querySelector('.up-barra').getAttribute('fill');
    r.atualizar('conjuntos3', { inverterPaleta: true });
    assert.notEqual(r.palco.querySelector('.up-barra').getAttribute('fill'), corNormal);
    r.atualizar('conjuntos3', { opacidade: 0.5, corDoContorno: '#123456' });
    const barra = r.palco.querySelector('.up-barra');
    assert.equal(barra.getAttribute('fill-opacity'), '0.5');
    assert.equal(barra.getAttribute('stroke'), '#123456');
    r.atualizar('conjuntos3', { mostrarContorno: false });
    assert.equal(r.palco.querySelector('.up-barra').getAttribute('stroke'), 'none');
  } finally {
    r.fim();
  }
});

test('upset — tooltip com o formato do campo e clique drill/fixar', () => {
  const r = carregar('upset_plot');
  try {
    r.atualizar('conjuntosPorItem', { medirPor: 'medida' });
    const barra = r.palco.querySelector('.up-barra');
    passarMouse(r, barra, 50, 50);
    const tip = r.tooltipVisivel();
    assert.ok(tip, 'tooltip visível');
    assert.match(tip.textContent, /\$\d/, `soma da receita no formato do campo ($#,##0): ${tip.textContent}`);
    assert.ok(!temNumeroCru(tip.textContent));

    r.atualizar(conjuntosComRendered({ links: true }));
    const b1 = r.palco.querySelector('.up-barra');
    passarMouse(r, b1, 50, 50);
    assert.match(r.tooltipVisivel().textContent, /120 clientes/, 'região de uma linha usa o texto do Looker');
    evento(r, 'click', b1, 50, 50);
    assert.equal(r.amb.chamadasDeApi.drills, 1);

    r.atualizar(conjuntosComRendered());
    const b2 = r.palco.querySelector('.up-barra');
    passarMouse(r, b2, 50, 50);
    evento(r, 'click', b2, 50, 50);
    assert.ok(r.doc.querySelector('.bl-tooltip.bl-fixo'), 'sem links, fixa');
  } finally {
    r.fim();
  }
});

/* ================================================================== */
/* treemap_carteira                                                    */
/* ================================================================== */

test('treemap — rótulos: tamanho, negrito, cor, conteúdo e ocultar', () => {
  const r = carregar('treemap_carteira');
  try {
    r.atualizar('duasDimensoes', { tamanhoDoRotulo: 20, evitarColisaoDeRotulos: false, corDoRotulo: '#FF0000', negritoNoRotulo: true });
    const rotulos = Array.from(r.palco.querySelectorAll('.tm-valor[data-rotulo]'));
    assert.ok(rotulos.length > 0, 'há rótulos de valor');
    assert.deepEqual([...new Set(tamanhos(rotulos))], [20]);
    assert.ok(rotulos.every((t) => t.getAttribute('fill') === '#FF0000' && t.getAttribute('font-weight') === '700'));

    r.atualizar('duasDimensoes', { conteudoDoRotulo: 'percentual', casasDecimaisDoRotulo: 0 });
    const pcts = Array.from(r.palco.querySelectorAll('.tm-valor')).map((t) => t.textContent);
    assert.ok(pcts.length && pcts.every((t) => /^\d+%/.test(t)), `percentual: ${pcts}`);

    r.atualizar('duasDimensoes', { mostrarRotulos: false });
    assert.equal(r.palco.querySelectorAll('[data-rotulo], .tm-texto').length, 0);
  } finally {
    r.fim();
  }
});

test('treemap — aba Cores: contorno, opacidade e inverter paleta (cor por grupo)', () => {
  const r = carregar('treemap_carteira');
  try {
    r.atualizar('duasDimensoes', { mostrarContorno: false });
    assert.ok(Array.from(r.palco.querySelectorAll('.tm-bloco')).every((b) => b.getAttribute('stroke') === 'none'));
    r.atualizar('duasDimensoes', { corDoContorno: '#123456', opacidade: 0.5 });
    const b = r.palco.querySelector('.tm-bloco');
    assert.equal(b.getAttribute('stroke'), '#123456');
    assert.equal(b.getAttribute('fill-opacity'), '0.5');

    const cores = () => Array.from(r.palco.querySelectorAll('.tm-bloco')).map((x) => x.getAttribute('fill')).join();
    r.atualizar('duasDimensoes', { colorirPor: 'grupo' });
    const normal = cores();
    r.atualizar('duasDimensoes', { colorirPor: 'grupo', inverterPaleta: true });
    assert.notEqual(cores(), normal, 'inverterPaleta muda as cores por grupo');
  } finally {
    r.fim();
  }
});

test('treemap — tooltip usa o texto do Looker e o clique sem link fixa', () => {
  const r = carregar('treemap_carteira');
  try {
    const f = FIXTURES.duasDimensoes();
    for (const linha of f.data) linha.margem.rendered = `MG ${linha.margem.rendered}`;
    r.atualizar(f);
    const bloco = r.palco.querySelector('.tm-bloco');
    passarMouse(r, bloco, 40, 40);
    const tip = r.tooltipVisivel();
    assert.ok(tip);
    assert.match(tip.textContent, /MG /, 'a medida de cor vem do rendered do Looker');
    assert.ok(!temNumeroCru(tip.textContent));
    evento(r, 'click', bloco, 40, 40);
    assert.ok(r.doc.querySelector('.bl-tooltip.bl-fixo'), 'sem links, fixa');

    const g = FIXTURES.duasDimensoes();
    for (const linha of g.data) linha.receita.links = [{ label: 'x', url: '/x', type: 'drill' }];
    r.atualizar(g);
    evento(r, 'click', r.palco.querySelector('.tm-bloco'), 40, 40);
    assert.equal(r.amb.chamadasDeApi.drills, 1);
  } finally {
    r.fim();
  }
});

/* ================================================================== */
/* marimekko                                                           */
/* ================================================================== */

test('marimekko — rótulos: tamanho, ocultar e conteúdo', () => {
  const r = carregar('marimekko');
  try {
    r.atualizar('duasDimensoes', { tamanhoDoRotulo: 20, evitarColisaoDeRotulos: false, negritoNoRotulo: true });
    const dentro = Array.from(r.palco.querySelectorAll('.mk-rotulo-bloco'));
    assert.ok(dentro.length > 0);
    assert.deepEqual([...new Set(tamanhos(dentro))], [20]);
    assert.ok(dentro.every((t) => t.getAttribute('font-weight') === '700'));

    r.atualizar('duasDimensoes', { mostrarRotulos: false });
    assert.equal(r.palco.querySelectorAll('.mk-rotulo, [data-rotulo]').length, 0);

    r.atualizar('duasDimensoes', { conteudoDoRotulo: 'nome', evitarColisaoDeRotulos: false });
    const nomes = Array.from(r.palco.querySelectorAll('.mk-rotulo-bloco')).map((t) => t.textContent);
    assert.ok(nomes.length && nomes.every((t) => !/%/.test(t)), `nome da série: ${nomes}`);
  } finally {
    r.fim();
  }
});

test('marimekko — aba Cores: inverter paleta, opacidade e contorno', () => {
  const r = carregar('marimekko');
  try {
    const cores = () => Array.from(r.palco.querySelectorAll('.mk-bloco')).map((x) => x.getAttribute('fill')).join();
    r.atualizar('duasDimensoes');
    const normal = cores();
    r.atualizar('duasDimensoes', { inverterPaleta: true });
    assert.notEqual(cores(), normal);
    r.atualizar('duasDimensoes', { opacidade: 0.5, corDoContorno: '#123456' });
    const b = r.palco.querySelector('.mk-bloco');
    assert.equal(b.getAttribute('fill-opacity'), '0.5');
    assert.equal(b.getAttribute('stroke'), '#123456');
    r.atualizar('duasDimensoes', { mostrarContorno: false });
    assert.equal(r.palco.querySelector('.mk-bloco').getAttribute('stroke'), 'none');
  } finally {
    r.fim();
  }
});

test('marimekko — clique: drill com links, fixa sem links; tooltip formatado', () => {
  const r = carregar('marimekko');
  try {
    r.atualizar('duasDimensoes');
    const bloco = r.palco.querySelector('.mk-bloco');
    passarMouse(r, bloco, 40, 40);
    const tip = r.tooltipVisivel();
    assert.ok(tip);
    assert.match(tip.textContent, /\$\d/, 'receita no formato do campo');
    assert.ok(!temNumeroCru(tip.textContent));
    evento(r, 'click', bloco, 40, 40);
    assert.ok(r.doc.querySelector('.bl-tooltip.bl-fixo'), 'sem links, fixa');

    const g = FIXTURES.duasDimensoes();
    // O Looker manda links também nas dimensões; bloco de várias linhas usa a da coluna.
    for (const linha of g.data) {
      linha.receita.links = [{ label: 'x', url: '/x', type: 'drill' }];
      linha.regiao.links = [{ label: 'x', url: '/x', type: 'drill' }];
    }
    r.atualizar(g);
    evento(r, 'click', r.palco.querySelector('.mk-bloco'), 40, 40);
    assert.equal(r.amb.chamadasDeApi.drills, 1);
  } finally {
    r.fim();
  }
});

test('conjuntos — 4 gráficos: redesenhos e hovers deixam 1 tooltip; destroy remove', () => {
  for (const [id, fixture] of [
    ['diagrama_venn', 'conjuntos3'],
    ['upset_plot', 'conjuntos3'],
    ['treemap_carteira', 'duasDimensoes'],
    ['marimekko', 'duasDimensoes'],
  ]) {
    const r = carregar(id);
    try {
      for (let i = 0; i < 4; i++) r.atualizar(fixture);
      const alvos = Array.from(r.palco.querySelectorAll('svg, svg rect, svg path')).slice(0, 30);
      for (let i = 0; i < 50; i++) passarMouse(r, alvos[i % alvos.length], 100 + i, 100 + i);
      assert.ok(r.doc.querySelectorAll('.bl-tooltip').length <= 1, `${id}: mais de um tooltip`);
      r.inst.destroy();
      assert.equal(r.doc.querySelectorAll('.bl-tooltip').length, 0, `${id}: destroy remove o tooltip`);
    } finally {
      r.fim();
    }
  }
});
