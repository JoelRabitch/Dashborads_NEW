/**
 * correcoes_arvores_kpi.test.mjs — correções v2 (6.1 a 6.4) em
 * arvores_multiplas, org_chart e kpi_vivo.
 *
 * Cada teste reproduz um defeito visto no Looker real: a opção existe no
 * painel, o Looker grava o valor e o desenho não muda. Todos falhavam no
 * código anterior a estas correções (o bloco de rótulos e o de contorno
 * não eram lidos). O config imita o do Looker: `configPadrao(definicao)`
 * + o que o usuário mudou, inclusive `false`, `0` e texto vazio.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// BL_DIST permite rodar contra bundles antigos (reprodução).
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

/** Põe `links` (drill) em todas as células dos campos pedidos. */
function comLinks(dados, campos) {
  for (const linha of dados.data) {
    for (const c of campos) {
      if (linha[c]) linha[c].links = [{ label: 'Detalhar', url: '/explore/x', type: 'drill' }];
    }
  }
  return dados;
}

function renderizar(id, nomeDaFixture, ajustes = {}, { links = null } = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  assert.ok(definicao, `${id} não se registrou`);
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  inst.create(palco, configPadrao(definicao));
  const dados = FIXTURES[nomeDaFixture]();
  if (links) comLinks(dados, links);
  let ok = false;
  inst.updateAsync(dados.data, palco, Object.assign(configPadrao(definicao), ajustes), dados.queryResponse, {}, () => {
    ok = true;
  });
  assert.ok(ok, 'done() precisa ser chamado');
  const doc = amb.window.document;
  return {
    amb,
    palco,
    doc,
    todos: (sel) => Array.from(palco.querySelectorAll(sel)),
    rotulos: () => Array.from(palco.querySelectorAll('[data-rotulo]')),
    passar(el) {
      for (const tipo of ['pointerenter', 'mouseenter', 'pointermove']) {
        el.dispatchEvent(new amb.window.MouseEvent(tipo, { bubbles: tipo === 'pointermove', clientX: 50, clientY: 50 }));
      }
    },
    clicar(el) {
      el.dispatchEvent(new amb.window.MouseEvent('click', { bubbles: true, clientX: 50, clientY: 50 }));
    },
    textoDoTooltip: () => doc.querySelector('.bl-tooltip')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

const visiveis = (els) => els.filter((e) => e.getAttribute('display') !== 'none' && e.style.display !== 'none');

/* ================================================================== */
/* arvores_multiplas                                                   */
/* ================================================================== */

const AM = (ajustes, extra) => renderizar('arvores_multiplas', 'hierarquia', ajustes, extra);

test('arvores_multiplas — tamanho, cor, negrito e rotação do rótulo têm efeito', () => {
  const r = AM({ tamanhoDoRotulo: 20, corDoRotulo: '#FF0000', negritoNoRotulo: true, rotacaoDoRotulo: 30 });
  try {
    const rot = r.todos('.av-rotulo');
    assert.ok(rot.length > 0, 'precisa haver rótulos de folha');
    for (const el of rot) {
      assert.equal(el.getAttribute('font-size'), '20', 'tamanhoDoRotulo: 20');
      assert.equal(el.getAttribute('fill'), '#FF0000', 'corDoRotulo');
      assert.equal(el.getAttribute('font-weight'), '700', 'negritoNoRotulo');
      assert.match(el.getAttribute('transform') || '', /rotate\(30/, 'rotacaoDoRotulo');
      assert.equal(el.getAttribute('data-rotulo'), '1');
    }
  } finally {
    r.fim();
  }
});

test('arvores_multiplas — mostrarRotulos: false esconde todos os rótulos', () => {
  const r = AM({ mostrarRotulos: false, mostrarRotulosInternos: true });
  try {
    assert.equal(r.rotulos().length, 0, 'nenhum [data-rotulo]');
    assert.equal(r.todos('.av-rotulo').length, 0, 'nenhum .av-rotulo');
  } finally {
    r.fim();
  }
});

test('arvores_multiplas — conteúdo, formato e casas do rótulo', () => {
  const nv = AM({ conteudoDoRotulo: 'nomeValor', campoDoValor: 'custo', formatoDoRotulo: 'compacto', casasDecimaisDoRotulo: 1 });
  const pct = AM({ conteudoDoRotulo: 'percentual', casasDecimaisDoRotulo: 0 });
  try {
    const textos = nv.todos('.av-rotulo').map((e) => e.textContent);
    assert.ok(textos.length > 0);
    for (const t of textos) assert.match(t, /: .*\d(\.\d)?K/, `"nome: valor" compacto; veio "${t}"`);
    const p = pct.todos('.av-rotulo').map((e) => e.textContent);
    for (const t of p) assert.match(t, /\(\d+%\)/, `percentual com 0 casa; veio "${t}"`);
  } finally {
    nv.fim();
    pct.fim();
  }
});

test('arvores_multiplas — posição do rótulo muda a âncora', () => {
  const centro = AM({ posicaoDoRotulo: 'centro' });
  const auto = AM({});
  try {
    const a = centro.todos('.av-rotulo').map((e) => e.getAttribute('text-anchor'));
    assert.ok(a.length && a.every((x) => x === 'middle'), 'centro = âncora no meio');
    const b = auto.todos('.av-rotulo').map((e) => e.getAttribute('text-anchor'));
    assert.ok(b.length && b.every((x) => x === 'start'), 'auto = folha à direita (legado)');
  } finally {
    centro.fim();
    auto.fim();
  }
});

test('arvores_multiplas — "esconder rótulos que se sobrepõem" e truncar', () => {
  const comEvitar = AM({ tamanhoDoRotulo: 28, mostrarRotulosInternos: true, evitarColisaoDeRotulos: true });
  const semEvitar = AM({ tamanhoDoRotulo: 28, mostrarRotulosInternos: true, evitarColisaoDeRotulos: false });
  // v3 (5.11): truncarRotulo só vale no modo "Cortar com reticências".
  const trunc = AM({ truncarRotulo: 4, modoDoTextoLongo: 'reticencias' });
  try {
    const total = comEvitar.todos('.av-rotulo').length;
    assert.ok(visiveis(comEvitar.todos('.av-rotulo')).length < total, 'com a opção ligada, algum rótulo some');
    assert.equal(visiveis(semEvitar.todos('.av-rotulo')).length, semEvitar.todos('.av-rotulo').length);
    for (const t of trunc.todos('.av-rotulo').map((e) => e.textContent)) {
      assert.ok(t.length <= 4, `truncar em 4; veio "${t}"`);
    }
  } finally {
    comEvitar.fim();
    semEvitar.fim();
    trunc.fim();
  }
});

test('arvores_multiplas — contorno dos nós segue o painel', () => {
  const sem = AM({ mostrarContorno: false });
  const com = AM({ corDoContorno: '#123456', espessuraDoContorno: 3, tracejadoDoContorno: 'tracejado' });
  try {
    const a = sem.todos('.av-no');
    assert.ok(a.length > 0);
    for (const n of a) assert.equal(n.getAttribute('stroke'), 'none', 'mostrarContorno: false');
    for (const n of com.todos('.av-no')) {
      assert.equal(n.getAttribute('stroke'), '#123456');
      assert.equal(n.getAttribute('stroke-width'), '3');
      assert.ok(n.getAttribute('stroke-dasharray'), 'tracejado');
    }
  } finally {
    sem.fim();
    com.fim();
  }
});

test('arvores_multiplas — inverter paleta, cor por nível e opacidade mudam as cores', () => {
  const normal = AM({});
  const invertida = AM({ inverterPaleta: true });
  const nivel = AM({ colorirPor: 'nivel' });
  const opaca = AM({ opacidade: 0.4 });
  try {
    const cores = (r) => r.todos('.av-no').map((n) => n.getAttribute('fill')).join(',');
    assert.notEqual(cores(invertida), cores(normal), 'inverterPaleta: true precisa mudar as cores');
    // Por nível: dentro de UMA árvore, níveis diferentes têm cores diferentes.
    const primeiraArvore = nivel.palco.querySelector('svg');
    const fills = new Set(Array.from(primeiraArvore.querySelectorAll('.av-no')).map((n) => n.getAttribute('fill')));
    assert.ok(fills.size > 1, `colorirPor "nivel" precisa variar a cor dentro da árvore; veio ${[...fills]}`);
    for (const n of opaca.todos('.av-no')) assert.equal(n.getAttribute('fill-opacity'), '0.4');
  } finally {
    normal.fim();
    invertida.fim();
    nivel.fim();
    opaca.fim();
  }
});

test('arvores_multiplas — nós usam o marcador único, com tamanho por valor', () => {
  const r = AM({ tamanhoPorValor: true });
  try {
    const nos = r.todos('.av-no');
    assert.ok(nos.length > 0);
    for (const n of nos) assert.equal(n.getAttribute('data-forma'), 'circulo');
    const diametros = new Set(nos.map((n) => n.getAttribute('data-diametro')));
    assert.ok(diametros.size > 1, 'tamanho por valor precisa produzir tamanhos distintos');
  } finally {
    r.fim();
  }
});

test('arvores_multiplas — tooltip único, formatado pelo Looker e independente das opções de rótulo', () => {
  const a = AM({ casasDecimaisDoRotulo: 0 });
  const b = AM({ casasDecimaisDoRotulo: 4, formatoDoRotulo: 'percentual' });
  try {
    const nosA = a.todos('.av-no');
    for (const n of nosA) a.passar(n);
    assert.ok(a.doc.querySelectorAll('.bl-tooltip').length <= 1, 'no máximo 1 tooltip');
    a.passar(nosA[0]);
    b.passar(b.todos('.av-no')[0]);
    assert.ok(a.textoDoTooltip().length > 0, 'o tooltip precisa aparecer');
    assert.equal(a.textoDoTooltip(), b.textoDoTooltip(), 'opções de rótulo não podem mudar o tooltip');
  } finally {
    a.fim();
    b.fim();
  }
});

test('arvores_multiplas — clique segue a "Ação do clique"', () => {
  const drill = AM({}, { links: ['nivel1', 'nivel2', 'nivel3'] });
  const nada = AM({ acaoDoClique: 'nenhuma' }, { links: ['nivel1', 'nivel2', 'nivel3'] });
  try {
    drill.clicar(drill.todos('.av-no').at(-1));
    assert.equal(drill.amb.chamadasDeApi.drills, 1, 'célula com links abre o drill');
    nada.clicar(nada.todos('.av-no').at(-1));
    assert.equal(nada.amb.chamadasDeApi.drills, 0, '"Nenhuma" não abre drill');
  } finally {
    drill.fim();
    nada.fim();
  }
});

/* ================================================================== */
/* org_chart                                                           */
/* ================================================================== */

const OC = (ajustes, extra) => renderizar('org_chart', 'paiFilho', ajustes, extra);

test('org_chart — tamanho, cor, negrito e rotação dos textos do cartão', () => {
  const r = OC({ tamanhoDoRotulo: 20, corDoRotulo: '#FF0000', negritoNoRotulo: true, rotacaoDoRotulo: 15, alturaDoCartao: 120 });
  try {
    const nomes = r.todos('.oc-nome');
    assert.equal(nomes.length, 10, 'um nome por cartão');
    for (const el of nomes) {
      assert.equal(el.getAttribute('font-size'), '20');
      assert.equal(el.getAttribute('fill'), '#FF0000');
      assert.equal(el.getAttribute('font-weight'), '700');
      assert.match(el.getAttribute('transform') || '', /rotate\(15/);
    }
  } finally {
    r.fim();
  }
});

test('org_chart — mostrarRotulos: false tira os textos dos cartões (o botão continua)', () => {
  const r = OC({ mostrarRotulos: false });
  try {
    assert.equal(r.rotulos().length, 0, 'nenhum [data-rotulo]');
    assert.equal(r.todos('.oc-cartao > text').length, 0, 'nenhum texto no cartão');
    assert.ok(r.todos('.oc-botao').length > 0, 'recolher continua disponível');
  } finally {
    r.fim();
  }
});

test('org_chart — conteúdo, formato e posição do rótulo', () => {
  const nv = OC({ conteudoDoRotulo: 'nomeValor', formatoDoRotulo: 'moeda', casasDecimaisDoRotulo: 0 });
  const pct = OC({ conteudoDoRotulo: 'percentual', casasDecimaisDoRotulo: 0 });
  const esq = OC({ posicaoDoRotulo: 'dentro' });
  try {
    const nomes = nv.todos('.oc-nome').map((e) => e.textContent);
    assert.ok(nomes.some((t) => /: .*R\$|: .*\$/.test(t)), `"nome: valor" em moeda; veio ${nomes.join(' | ')}`);
    const textos = pct.todos('.oc-texto').map((e) => e.textContent).join(' | ');
    assert.match(textos, /\d+%/, `percentual do total; veio ${textos}`);
    for (const el of esq.todos('.oc-nome')) assert.equal(el.getAttribute('text-anchor'), 'start');
  } finally {
    nv.fim();
    pct.fim();
    esq.fim();
  }
});

test('org_chart — esconder sobrepostos e truncar', () => {
  const com = OC({ tamanhoDoRotulo: 28, evitarColisaoDeRotulos: true });
  const sem = OC({ tamanhoDoRotulo: 28, evitarColisaoDeRotulos: false });
  // v3 (5.11): truncarRotulo só vale no modo "Cortar com reticências".
  const trunc = OC({ truncarRotulo: 3, modoDoTextoLongo: 'reticencias' });
  try {
    const todosCom = com.rotulos();
    assert.ok(visiveis(todosCom).length < todosCom.length, 'com a opção, linhas que não cabem somem');
    assert.equal(visiveis(sem.rotulos()).length, sem.rotulos().length);
    for (const t of trunc.todos('.oc-nome').map((e) => e.textContent)) assert.ok(t.length <= 3, `veio "${t}"`);
  } finally {
    com.fim();
    sem.fim();
    trunc.fim();
  }
});

test('org_chart — contorno, inverter paleta e opacidade', () => {
  const sem = OC({ mostrarContorno: false });
  const cor = OC({ corDoContorno: '#123456', espessuraDoContorno: 3 });
  const normal = OC({});
  const inv = OC({ inverterPaleta: true });
  const opaca = OC({ opacidade: 0.5, preencherCartao: true });
  try {
    const caixas = sem.todos('.oc-caixa');
    assert.equal(caixas.length, 10);
    for (const c of caixas) assert.equal(c.getAttribute('stroke'), 'none');
    for (const c of cor.todos('.oc-caixa')) {
      assert.equal(c.getAttribute('stroke'), '#123456');
      assert.equal(c.getAttribute('stroke-width'), '3');
    }
    // Sem escolha do usuário (cor padrão do painel), o contorno é a cor do ramo — não some no fundo branco.
    const padrao = normal.todos('.oc-caixa').map((c) => (c.getAttribute('stroke') || '').toUpperCase());
    assert.ok(padrao.some((s) => s && s !== '#FFFFFF' && s !== 'NONE'), 'contorno padrão visível');
    const cores = (r) => r.todos('.oc-caixa').map((c) => c.getAttribute('stroke')).join(',');
    assert.notEqual(cores(inv), cores(normal), 'inverterPaleta muda as cores');
    for (const c of opaca.todos('.oc-caixa')) assert.equal(c.getAttribute('fill-opacity'), '0.5');
  } finally {
    [sem, cor, normal, inv, opaca].forEach((r) => r.fim());
  }
});

test('org_chart — clique: drill pela "Ação do clique" e o recolher continua funcionando', () => {
  const r = OC({}, { links: ['nome', 'id'] });
  const nada = OC({ acaoDoClique: 'nenhuma' }, { links: ['nome', 'id'] });
  try {
    const cartoes = r.todos('.oc-cartao');
    r.clicar(cartoes.at(-1));
    assert.equal(r.amb.chamadasDeApi.drills, 1, 'clique no cartão abre o drill');
    nada.clicar(nada.todos('.oc-cartao').at(-1));
    assert.equal(nada.amb.chamadasDeApi.drills, 0);
    const antes = r.todos('.oc-cartao').length;
    r.clicar(r.palco.querySelector('.oc-botao'));
    assert.ok(r.todos('.oc-cartao').length < antes, 'o botão recolhe');
    assert.equal(r.amb.chamadasDeApi.drills, 1, 'o botão de recolher não abre drill');
  } finally {
    r.fim();
    nada.fim();
  }
});

test('org_chart — tooltip único, valor formatado e independente das opções de rótulo', () => {
  const a = OC({ casasDecimaisDoRotulo: 0 });
  const b = OC({ casasDecimaisDoRotulo: 4, formatoDoRotulo: 'percentual' });
  try {
    for (const c of a.todos('.oc-cartao')) a.passar(c);
    assert.ok(a.doc.querySelectorAll('.bl-tooltip').length <= 1);
    a.passar(a.todos('.oc-cartao')[0]);
    b.passar(b.todos('.oc-cartao')[0]);
    assert.ok(a.textoDoTooltip().length > 0);
    assert.equal(a.textoDoTooltip(), b.textoDoTooltip());
  } finally {
    a.fim();
    b.fim();
  }
});

/* ================================================================== */
/* kpi_vivo                                                            */
/* ================================================================== */

const KV = (ajustes) => renderizar('kpi_vivo', 'temporal', ajustes);

test('kpi_vivo — tamanho, cor, negrito e rotação estilizam os rótulos secundários', () => {
  const r = KV({ tamanhoDoRotulo: 20, corDoRotulo: '#FF0000', negritoNoRotulo: true, rotacaoDoRotulo: 15 });
  try {
    const titulo = r.palco.querySelector('.kv-titulo');
    assert.equal(titulo.style.fontSize, '20px');
    assert.equal(titulo.style.fontWeight, '700');
    assert.match(titulo.style.transform, /rotate\(15deg\)/);
    assert.match(titulo.style.color, /rgb\(255, 0, 0\)|#FF0000/i);
    const base = r.palco.querySelector('.kv-base');
    assert.equal(base.style.fontSize, '20px');
  } finally {
    r.fim();
  }
});

test('kpi_vivo — mostrarRotulos: false deixa só o número', () => {
  const r = KV({ mostrarRotulos: false });
  try {
    assert.equal(r.rotulos().length, 0);
    assert.equal(r.palco.querySelector('.kv-titulo'), null);
    assert.equal(r.palco.querySelector('.kv-variacao'), null);
    assert.ok(r.palco.querySelector('.kv-numero').textContent.length > 0);
  } finally {
    r.fim();
  }
});

test('kpi_vivo — formato e casas do rótulo formatam o número principal', () => {
  const auto = KV({});
  const comp = KV({ formatoDoRotulo: 'compacto', casasDecimaisDoRotulo: 2 });
  const num0 = KV({ formatoDoRotulo: 'numero', casasDecimaisDoRotulo: 0 });
  const num3 = KV({ formatoDoRotulo: 'numero', casasDecimaisDoRotulo: 3 });
  try {
    const n = (r) => r.palco.querySelector('.kv-numero').textContent;
    assert.match(n(comp), /K$/, `compacto; veio ${n(comp)}`);
    assert.notEqual(n(num0), n(num3), 'casas decimais mudam o número');
    assert.notEqual(n(comp), n(auto));
  } finally {
    [auto, comp, num0, num3].forEach((r) => r.fim());
  }
});

test('kpi_vivo — conteúdo, posição, truncar e colisão', () => {
  const nv = KV({ conteudoDoRotulo: 'nomeValor', titulo: 'Receita' });
  const pct = KV({ conteudoDoRotulo: 'percentual' });
  const abaixo = KV({ posicaoDoRotulo: 'dentro' });
  const trunc = KV({ titulo: 'Receita líquida consolidada', truncarRotulo: 6 });
  const longo = 'Indicador '.repeat(40);
  const evita = KV({ titulo: longo, evitarColisaoDeRotulos: true });
  const naoEvita = KV({ titulo: longo, evitarColisaoDeRotulos: false });
  try {
    assert.match(nv.palco.querySelector('.kv-numero').textContent, /^Receita: /);
    assert.equal(nv.palco.querySelector('.kv-titulo'), null, 'o nome já está no número');
    assert.match(pct.palco.querySelector('.kv-numero').textContent, /%$/);
    const filhos = // (Fase C: os textos agora ficam dentro de .kv-texto no cartão.)
    Array.from(abaixo.palco.querySelector('.kv-texto').children).map((e) => e.className);
    assert.ok(filhos.indexOf('kv-titulo') > filhos.indexOf('kv-numero'), `"dentro" = título abaixo; ordem ${filhos}`);
    assert.ok(trunc.palco.querySelector('.kv-titulo').textContent.length <= 6);
    assert.ok(
      evita.palco.querySelector('.kv-titulo').textContent.length < naoEvita.palco.querySelector('.kv-titulo').textContent.length,
      'texto que não cabe na largura é encurtado quando a opção está ligada'
    );
  } finally {
    [nv, pct, abaixo, trunc, evita, naoEvita].forEach((r) => r.fim());
  }
});
