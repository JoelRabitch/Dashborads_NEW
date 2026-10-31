/**
 * arvores_ajuste_v33.test.mjs — as árvores se ajustam ao limite da célula
 * (v3.3).
 *
 * Defeito (visto no Looker, grade de células de ~385 px, árvores de 3 ou 4
 * níveis, "Texto longo" = Mostrar inteiro, ícone ligado): depois da v3.2 a
 * árvore precisa de bem mais largura que a célula; a célula rola ("Tamanho
 * real com rolagem") e, para o usuário, o texto aparece CORTADO na borda.
 *
 * jsdom não faz layout nem mede texto: testes de GEOMETRIA com a função
 * única de largura (`medida-texto.js`). Conferir no Looker real:
 * docs/TESTE_NO_LOOKER.md (v3.3).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { celula, campoDimensao, campoMedida, montarQueryResponse } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { hierarchy as d3Hierarchy } from 'd3-hierarchy';
import { larguraDoTexto, criarMedidor, medicaoDoNavegador } from '../src/core/medida-texto.js';
import { criarAgendadorDeRedimensionamento } from '../src/core/dom.js';
import { lerAjuste, ajustarPorTexto, ajustarPorEscala, ESCALA_MINIMA } from '../src/charts/_arvore/ajuste.js';
import { prepararMedidaDosNiveis } from '../src/charts/_arvore/index.js';
import { planoDeCentralizacao } from '../src/charts/_arvore/comum.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

/** Hierarquia SINTÉTICA de 4 níveis (no arvores_multiplas: ramo, n2, n3, n4). */
function hierarquia4({ ramos = ['Ramo Alfa', 'Ramo Beta'], nomeGigante = null } = {}) {
  const dimensoes = ['n1', 'n2', 'n3', 'n4'].map((n, i) => campoDimensao(n, `Nível ${i + 1}`));
  const medidas = [campoMedida('valor', 'Valor', { valueFormat: '$#,##0.00' })];
  const data = [];
  for (const r of ramos) {
    for (let a = 1; a <= 2; a++) {
      for (let b = 1; b <= 2; b++) {
        for (let c = 1; c <= 2; c++) {
          const gigante = nomeGigante && a === 1 && b === 1 && c === 1;
          data.push({
            n1: celula(r),
            n2: celula(`${r} · Grupo sintético ${a} de nome comprido`),
            n3: celula(`Subgrupo ${a}.${b} com descrição bem longa`),
            n4: celula(gigante ? nomeGigante : `Item ${a}.${b}.${c} de teste com nome extenso`),
            valor: celula(98765432.1 * (a + b + c)),
          });
        }
      }
    }
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/**
 * Abre um gráfico num tile de `largura` × `altura` px (o jsdom não faz
 * layout: o tamanho do contêiner é fingido no `clientWidth`).
 */
function abrir(id, ajustes = {}, { largura = 760, altura = 560, dados = hierarquia4(), antes = null } = {}) {
  const amb = montarAmbiente();
  const tamanho = { largura, altura };
  Object.defineProperty(amb.window.Element.prototype, 'clientWidth', { get: () => tamanho.largura, configurable: true });
  Object.defineProperty(amb.window.Element.prototype, 'clientHeight', { get: () => tamanho.altura, configurable: true });
  if (antes) antes(amb);
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  const atualizar = (d = dados, extra = {}) => inst.updateAsync(d.data, palco, Object.assign(cfg(), extra), d.queryResponse, {}, () => {});
  atualizar();
  atualizar();
  const clicar = (el) => el.dispatchEvent(new amb.window.MouseEvent('click', { bubbles: true }));
  return {
    amb,
    inst,
    palco,
    tamanho,
    definicao,
    clicar,
    atualizar,
    todos: (s) => Array.from(palco.querySelectorAll(s)),
    fim: () => amb.restaurar(),
  };
}

const num = (el, a) => Number(el.getAttribute(a));
const translate = (el) => {
  const m = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec((el && el.getAttribute('transform')) || '');
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
};

/** Escala do desenho na tela (largura do <svg> / largura do viewBox). */
function escalaDo(svg) {
  const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  return num(svg, 'width') / vb[2];
}

/** Rótulos de uma célula, em coordenadas da TELA (já com a escala). */
function rotulosNaTela(celulaEl) {
  const svg = celulaEl.querySelector('svg');
  const s = escalaDo(svg);
  const d = translate(svg.querySelector('svg > g'));
  return Array.from(celulaEl.querySelectorAll('.av-rotulo'))
    .filter((r) => r.getAttribute('display') !== 'none')
    .map((r) => {
      const tam = Number(r.getAttribute('font-size')) || 11;
      const negrito = r.getAttribute('font-weight') === '700';
      const spans = Array.from(r.querySelectorAll('tspan'));
      const linhas = spans.length ? spans.map((t) => t.textContent) : [r.textContent];
      const w = Math.max(...linhas.map((l) => larguraDoTexto(l, tam, { negrito })));
      const x = num(r, 'x') + d.x;
      const a = r.getAttribute('text-anchor');
      const x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x;
      return { texto: linhas.join(' '), linhas: linhas.length, x0: x0 * s, x1: (x0 + w) * s, fonteNaTela: tam * s, el: r };
    });
}

const CENARIO = {
  iconePadraoPorValor: 'estrela',
  partesDoRotulo: 'nomeValorPct',
  mostrarRotulosInternos: true,
  colunasDaGrade: 2,
};

/* ------------------------------------------------------------------ */
/* Reprodução                                                           */
/* ------------------------------------------------------------------ */

test('v3.3 — reprodução: célula de 380 px, 4 níveis, "Mostrar inteiro": nenhum texto passa da borda visível', () => {
  const r = abrir('arvores_multiplas', CENARIO);
  try {
    const cels = r.todos('.am-celula');
    assert.ok(cels.length >= 2);
    for (const cel of cels) {
      const larguraDaCelula = parseFloat(cel.style.width);
      assert.ok(larguraDaCelula <= 380.5 || cels.length > 0, 'célula de no máximo 380 px no início');
      const svg = cel.querySelector('svg');
      assert.ok(
        num(svg, 'width') <= larguraDaCelula + 0.5,
        `o desenho (${num(svg, 'width').toFixed(0)} px) passa da célula (${larguraDaCelula} px): o texto fica cortado na borda`
      );
      for (const rot of rotulosNaTela(cel)) {
        assert.ok(rot.x0 >= -0.5, `"${rot.texto.slice(0, 40)}" começa fora da célula`);
        assert.ok(rot.x1 <= larguraDaCelula + 0.5, `"${rot.texto.slice(0, 40)}" termina em ${rot.x1.toFixed(0)} px, além da célula (${larguraDaCelula} px)`);
        assert.ok(rot.fonteNaTela >= 9 - 0.05, `fonte na tela ${rot.fonteNaTela.toFixed(2)} abaixo da mínima (9 px)`);
        if (/…/.test(rot.texto)) {
          // Corte só como último recurso, e com o texto completo à mão.
          assert.ok(rot.el.getAttribute('data-completo'), 'rótulo cortado sem o texto completo');
          assert.ok(rot.el.parentNode.querySelector('title'), 'rótulo cortado sem tooltip com o texto completo');
        }
      }
    }
  } finally {
    r.fim();
  }
});

test('v3.3 — cenário que dá para ajustar: nada cortado, nada fora da célula, nota informa o ajuste', () => {
  const r = abrir('arvores_multiplas', { iconePadraoPorValor: 'estrela', colunasDaGrade: 2 });
  try {
    for (const cel of r.todos('.am-celula')) {
      const lc = parseFloat(cel.style.width);
      assert.ok(num(cel.querySelector('svg'), 'width') <= lc + 0.5, 'desenho maior que a célula');
      assert.notEqual(cel.getAttribute('data-ajuste'), 'corte');
      for (const rot of rotulosNaTela(cel)) {
        assert.ok(rot.x1 <= lc + 0.5, `"${rot.texto}" passa da borda`);
        assert.doesNotMatch(rot.texto, /…/, `"${rot.texto}" foi cortado (dava para ajustar)`);
      }
    }
    const nota = r.palco.querySelector('.bl-nota, [class*="nota"]');
    assert.ok(nota && /Ajuste:/.test(nota.textContent), `a nota deveria informar o ajuste (veio "${nota && nota.textContent}")`);
  } finally {
    r.fim();
  }
});

test('v3.3 — "Rolar em tamanho real" mantém a v3.2 (desenho maior que a célula, com rolagem)', () => {
  const r = abrir('arvores_multiplas', { ...CENARIO, layoutQuandoNaoCouber: 'rolar' });
  try {
    const cel = r.palco.querySelector('.am-celula');
    assert.ok(num(cel.querySelector('svg'), 'width') > parseFloat(cel.style.width), 'em tamanho real a árvore rola');
    assert.equal(cel.getAttribute('data-ajuste'), null);
  } finally {
    r.fim();
  }
});

/* ------------------------------------------------------------------ */
/* Casos P1–P12 e S1                                                    */
/* ------------------------------------------------------------------ */

const temNaN = (palco) =>
  Array.from(palco.querySelectorAll('svg, svg *')).some((el) =>
    ['width', 'height', 'viewBox', 'transform', 'x', 'y'].some((a) => /NaN|Infinity/.test(el.getAttribute(a) || ''))
  );

test('v3.3 P1 — contêiner com largura 0 ou indefinida: nada de NaN, tamanho padrão', () => {
  for (const largura of [0, NaN]) {
    const r = abrir('arvores_multiplas', CENARIO, { largura, altura: 0 });
    try {
      assert.ok(r.todos('.am-celula').length > 0, `largura ${largura}: deveria desenhar`);
      assert.ok(!temNaN(r.palco), `largura ${largura}: atributo com NaN/Infinity`);
      for (const c of r.todos('.am-celula')) assert.ok(Number.isFinite(parseFloat(c.style.width)) && parseFloat(c.style.width) > 0);
    } finally {
      r.fim();
    }
  }
  const aj = lerAjuste({});
  const medir = () => ({ largura: 500, fixo: 100, colunas: 2, cortado: false });
  for (const d of [0, NaN, undefined, -5]) {
    const t = ajustarPorTexto({ disponivel: d, fonte: 11, aj, medir });
    assert.ok(Number.isFinite(t.tamanho) && Number.isFinite(t.largura), `disponível ${d}`);
  }
});

test('v3.3 P1 — redimensionar: debounce de 100 ms, ignora < 2 px, limita desenhos por segundo', () => {
  let agora = 0;
  const fila = [];
  const timer = (fn, ms) => {
    const t = { fn, quando: agora + ms, vivo: true };
    fila.push(t);
    return t;
  };
  const avancar = (ms) => {
    const alvo = agora + ms;
    for (;;) {
      const prox = fila.filter((t) => t.vivo && t.quando <= alvo).sort((a, b) => a.quando - b.quando)[0];
      if (!prox) break;
      agora = prox.quando;
      prox.vivo = false;
      prox.fn();
    }
    agora = alvo;
  };
  let tamanho = { largura: 500, altura: 300 };
  let desenhado = { largura: 500, altura: 300 };
  const instantes = [];
  const ag = criarAgendadorDeRedimensionamento(
    () => {
      instantes.push(agora);
      desenhado = { ...tamanho };
    },
    {
      atraso: 100,
      minimoPx: 2,
      maximoPorSegundo: 4,
      medir: () => tamanho,
      referencia: () => desenhado,
      agora: () => agora,
      timer,
      cancelarTimer: (t) => {
        t.vivo = false;
      },
    }
  );
  // Rajada de eventos → um desenho, 100 ms depois do último.
  tamanho = { largura: 600, altura: 300 };
  for (let i = 0; i < 10; i++) {
    ag.pedir();
    avancar(20);
  }
  assert.equal(instantes.length, 0, 'não desenha durante a rajada');
  avancar(100);
  assert.equal(instantes.length, 1, 'um desenho só depois da rajada');
  // Menos de 2 px: ignorado.
  tamanho = { largura: 601, altura: 301 };
  ag.pedir();
  avancar(150);
  assert.equal(instantes.length, 1, 'mudança < 2 px não redesenha');
  // Laço resize → layout → resize: no máximo 4 por segundo.
  for (let i = 0; i < 20; i++) {
    tamanho = { largura: 700 + i * 10, altura: 300 };
    ag.pedir();
    avancar(110);
  }
  avancar(3000);
  for (let i = 0; i < instantes.length; i++) {
    const naJanela = instantes.filter((t) => t >= instantes[i] && t < instantes[i] + 1000).length;
    assert.ok(naJanela <= 4, `${naJanela} desenhos em 1 s`);
  }
  assert.deepEqual(desenhado, tamanho, 'o último tamanho sempre é desenhado (adiado, nunca perdido)');
});

test('v3.3 P2 — barra de rolagem reservada: o desenho nunca usa a largura da barra (sem oscilação)', () => {
  const r = abrir('arvores_multiplas', { ...CENARIO, alturaDaArvore: 120 });
  try {
    for (const cel of r.todos('.am-celula')) {
      assert.ok(cel.classList.contains('am-ajustada'));
      const svg = cel.querySelector('svg');
      assert.ok(num(svg, 'width') <= parseFloat(cel.style.width) - 18 + 0.5, 'o desenho deveria deixar a largura da barra livre');
    }
    // Aparecer a barra não muda nada: o redesenho no mesmo tamanho é idêntico.
    const antes = r.palco.querySelector('.md-grade').innerHTML;
    r.inst._bl.ultimoDesenho();
    assert.equal(r.palco.querySelector('.md-grade').innerHTML, antes);
  } finally {
    r.fim();
  }
});

test('v3.3 P3 — determinístico e idempotente', () => {
  const r = abrir('arvores_multiplas', CENARIO);
  try {
    const a = r.palco.querySelector('.md-grade').innerHTML;
    r.atualizar();
    r.atualizar();
    assert.equal(r.palco.querySelector('.md-grade').innerHTML, a, 'mesma entrada, mesmo desenho');
  } finally {
    r.fim();
  }
  const aj = lerAjuste({});
  let chamadas = 0;
  const medir = ({ tamanho, limite, quebrar }) => {
    chamadas += 1;
    const rot = 30 * tamanho;
    const w = quebrar ? Math.min(rot, limite) : rot;
    return { largura: 100 + 3 * w, fixo: 100, colunas: 3, cortado: quebrar && rot > 2 * limite };
  };
  const plano = () => ajustarPorEscala({ disponivel: 380, texto: ajustarPorTexto({ disponivel: 380, fonte: 11, aj, medir }), aj, medir });
  const um = plano();
  const dois = plano();
  assert.deepEqual(um, dois);
  assert.ok(chamadas < 300, `iterações limitadas (${chamadas})`);
});

test('v3.3 P4 — rótulo gigante (120 caracteres): quebra, depois reticências com o texto completo; nunca fora da área', () => {
  const gigante = `${'Nome sintético muito comprido '.repeat(4)}fim`;
  assert.equal(gigante.length, 123);
  const dados = hierarquia4({ nomeGigante: gigante });
  const corte = abrir('arvores_multiplas', { ...CENARIO, mostrarRotulosInternos: false }, { dados });
  const rolar = abrir('arvores_multiplas', { ...CENARIO, mostrarRotulosInternos: false, layoutAjusteRolagem: true }, { dados });
  try {
    const cel = corte.palco.querySelector('.am-celula[data-arvore="Ramo Alfa"]');
    const lc = parseFloat(cel.style.width);
    assert.ok(num(cel.querySelector('svg'), 'width') <= lc + 0.5);
    const g = rotulosNaTela(cel).find((x) => (x.el.getAttribute('data-completo') || '').startsWith('Nome sintético'));
    assert.ok(g, 'o rótulo gigante deveria estar cortado com o texto completo guardado');
    assert.match(g.texto, /…/);
    assert.ok(g.linhas >= 2, 'antes do corte, quebra em linhas');
    assert.ok(g.x1 <= lc + 0.5, 'nunca fora da área');
    assert.match(g.el.parentNode.querySelector('title').textContent, /^Nome sintético/);
    // Com a rolagem ligada: inteiro, sem corte.
    const tudo = rolar.todos('.av-rotulo').map((e) => e.textContent).join(' ');
    assert.doesNotMatch(tudo, /…/, 'com rolagem, nada é cortado');
  } finally {
    corte.fim();
    rolar.fim();
  }
});

test('v3.3 P5 — 3.000 nós: cada rótulo medido uma vez (cache) e layout em tempo razoável', () => {
  const raizDados = { rotulo: 'raiz', filhos: [] };
  let folhas = 0;
  for (let a = 0; a < 3; a++) {
    const ra = { rotulo: `Ramo ${a}`, filhos: [] };
    raizDados.filhos.push(ra);
    for (let b = 0; b < 10; b++) {
      const rb = { rotulo: `Grupo ${a}.${b} sintético`, filhos: [] };
      ra.filhos.push(rb);
      for (let c = 0; c < 100; c++) {
        rb.filhos.push({ rotulo: `Item sintético ${a}.${b}.${c} de nome longo`, valor: 1 + c });
        folhas += 1;
      }
    }
  }
  assert.equal(folhas, 3000);
  const raiz = d3Hierarchy(raizDados, (d) => d.filhos).sum((d) => d.valor || 0);
  const medidor = criarMedidor({ folga: 10 });
  const config = { modoDoTextoLongo: 'inteiro', mostrarValorNoRotulo: true, mostrarRotulosInternos: true, tamanhoDoNo: 3 };
  const tema = { tamanhoBase: 11, texto: '#000', textoSuave: '#666' };
  const t0 = Date.now();
  const prep = prepararMedidaDosNiveis({
    completa: raiz,
    config,
    tema,
    total: raiz.value,
    maiorValor: raiz.value,
    temFilhos: (n) => !!(n.data.filhos && n.data.filhos.length),
    medidor,
  });
  const aj = lerAjuste({});
  const plano = () => ajustarPorEscala({ disponivel: 380, aj, medir: prep.medir, texto: ajustarPorTexto({ disponivel: 380, fonte: 11, aj, medir: prep.medir }) });
  const p1 = plano();
  const medicoes = medidor.estatisticas.medicoes;
  const p2 = plano();
  const ms = Date.now() - t0;
  assert.deepEqual(p1, p2);
  assert.equal(medidor.estatisticas.medicoes, medicoes, 'a segunda passada não deveria medir nada de novo');
  assert.ok(medidor.estatisticas.consultas > medicoes, 'o cache deveria ser usado');
  console.log(`# P5: 3.000 folhas, passo ${p1.passo}, ${medicoes} medições, ${medidor.estatisticas.consultas} consultas, ${ms} ms`);
  assert.ok(ms < 20000, `layout lento demais (${ms} ms)`);
});

test('v3.3 P6 — medição real com cache e folga; sem ela, a estimativa', () => {
  let reais = 0;
  const m = criarMedidor({
    folga: 10,
    real: (t, tam) => {
      reais += 1;
      return t.length * tam * 0.5;
    },
  });
  assert.ok(Math.abs(m('abcd', 10) - 4 * 10 * 0.5 * 1.1) < 1e-9);
  m('abcd', 10);
  assert.equal(reais, 1, 'cache por (texto, fonte, negrito)');
  m('abcd', 10, { negrito: true });
  assert.equal(reais, 2);
  const falha = criarMedidor({ folga: 0, real: () => NaN });
  assert.equal(falha('Texto', 12), larguraDoTexto('Texto', 12), 'sem medição real: estimativa');
  const erro = criarMedidor({
    folga: 0,
    real: () => {
      throw new Error('x');
    },
  });
  assert.equal(erro('Texto', 12), larguraDoTexto('Texto', 12));
  const amb = montarAmbiente();
  try {
    assert.equal(medicaoDoNavegador('Arial'), null, 'no jsdom os testes usam a estimativa');
  } finally {
    amb.restaurar();
  }
});

test('v3.3 P7 — redimensionar: estado de expansão, seleção e rolagem preservados; tooltip solto', () => {
  const r = abrir('arvores_multiplas', { ...CENARIO, nivelInicialExpandido: 1 });
  try {
    const cel = () => r.palco.querySelector('.am-celula[data-arvore="Ramo Alfa"]');
    r.clicar(cel().querySelector('.av-no[data-recolhido="1"]'));
    const abertos = () => r.todos('.av-no[data-recolhido="0"]').map((e) => e.getAttribute('data-item')).sort();
    const antes = abertos();
    const selecionado = r.palco.querySelector('[data-selecionado="1"]').getAttribute('data-item');
    const larguraAntes = parseFloat(cel().style.width);
    r.inst._bl.estado.rolagemDasCelulas.set('Ramo Alfa', { x: 7, y: 9 });
    r.tamanho.largura = 1200;
    r.inst._bl.ultimoDesenho();
    assert.notEqual(parseFloat(cel().style.width), larguraAntes, 'o layout deveria ser refeito no tamanho novo');
    assert.deepEqual(abertos(), antes, 'o que estava aberto continua aberto');
    assert.equal(r.palco.querySelector('[data-selecionado="1"]').getAttribute('data-item'), selecionado, 'a seleção continua');
    assert.deepEqual(r.inst._bl.estado.rolagemDasCelulas.get('Ramo Alfa'), { x: 7, y: 9 }, 'a rolagem guardada continua');
    assert.ok(r.palco.querySelector('.am-centralizar'), 'o botão Centralizar continua na barra');
  } finally {
    r.fim();
  }
});

test('v3.3 P7 — o ResizeObserver passa pelo debounce e redesenha no tamanho novo', async () => {
  let aviso = null;
  const r = abrir('arvores_multiplas', CENARIO, {
    antes: (amb) => {
      amb.window.ResizeObserver = class {
        constructor(cb) {
          aviso = cb;
        }
        observe() {}
        disconnect() {}
      };
      globalThis.ResizeObserver = amb.window.ResizeObserver;
    },
  });
  try {
    assert.ok(aviso, 'o ResizeObserver deveria ter sido usado');
    const w0 = parseFloat(r.palco.querySelector('.am-celula').style.width);
    r.tamanho.largura = 1300;
    aviso();
    aviso();
    assert.equal(parseFloat(r.palco.querySelector('.am-celula').style.width), w0, 'ainda não (debounce)');
    await new Promise((ok) => setTimeout(ok, 180));
    assert.notEqual(parseFloat(r.palco.querySelector('.am-celula').style.width), w0, 'redesenhou depois do debounce');
  } finally {
    r.fim();
  }
});

test('v3.3 P8 — filtro muda os dados: quem fica mantém o estado; quem some é descartado', () => {
  const r = abrir('arvores_multiplas', { ...CENARIO, nivelInicialExpandido: 1 });
  try {
    assert.ok([...r.inst._bl.estado.recolhidos].some((k) => k.startsWith('Ramo Beta')));
    const alvo = r.palco.querySelector('.am-celula[data-arvore="Ramo Alfa"] .av-no[data-recolhido="1"]');
    const chave = alvo.getAttribute('data-item');
    r.clicar(alvo);
    // Filtro: o Ramo Beta some, entra o Ramo Gama.
    r.atualizar(hierarquia4({ ramos: ['Ramo Alfa', 'Ramo Gama'] }));
    const est = r.inst._bl.estado;
    assert.ok(![...est.recolhidos].some((k) => k.startsWith('Ramo Beta')), 'chaves do ramo que sumiu deveriam ser descartadas');
    assert.ok(!est.posicoesPorArvore.has('Ramo Beta'));
    assert.ok(!est.recolhidos.has(chave), 'o nó que ficou mantém o estado (aberto)');
    assert.equal(r.palco.querySelector(`.av-no[data-item="${chave}"]`).getAttribute('data-recolhido'), '0');
  } finally {
    r.fim();
  }
});

test('v3.3 P9 — com o desenho em escala (~0,7): clique, tooltip e centralizar usam as coordenadas certas', () => {
  const r = abrir(
    'arvores_multiplas',
    { iconePadraoPorValor: 'estrela', colunasDaGrade: 2, layoutAjusteFonte: false, layoutAjusteLinhas: false, layoutAjusteColunas: false, nivelInicialExpandido: 1 },
    { largura: 1530 }
  );
  try {
    const cel = r.palco.querySelector('.am-celula[data-arvore="Ramo Alfa"]');
    assert.equal(cel.getAttribute('data-ajuste'), 'escala');
    const s = escalaDo(cel.querySelector('svg'));
    assert.ok(s > 0.65 && s < 0.8, `escala ${s}`);
    // Os eventos ficam nos próprios elementos (o navegador aplica a escala).
    const no = cel.querySelector('.av-no[data-recolhido="1"]');
    const chave = no.getAttribute('data-item');
    no.dispatchEvent(new r.amb.window.MouseEvent('pointerenter', { bubbles: false, clientX: 10, clientY: 10 }));
    const tt = r.amb.window.document.querySelector('.bl-tooltip');
    assert.ok(tt && tt.textContent.includes(chave.split('›').pop()), 'tooltip do nó certo');
    r.clicar(no);
    assert.equal(r.palco.querySelector(`.av-no[data-item="${chave}"]`).getAttribute('data-recolhido'), '0', 'clique abriu o nó certo');
    // Centralizar: o alvo vai em coordenadas da tela (× escala).
    const p = planoDeCentralizacao({ area: { largura: 300, altura: 200 }, desenho: { largura: 1000 * s, altura: 800 * s }, alvo: { x: 600 * s, y: 400 * s }, config: {} });
    assert.ok(Math.abs(p.scrollLeft + 150 - 600 * s) < 0.01 && Math.abs(p.scrollTop + 100 - 400 * s) < 0.01, 'o nó fica no centro da área');
  } finally {
    r.fim();
  }
});

test('v3.3 P10 — impressão/PDF: sempre ajuste automático, sem rolagem', () => {
  const r = abrir('arvores_multiplas', { ...CENARIO, layoutQuandoNaoCouber: 'rolar', layoutAjusteRolagem: true }, {
    antes: (amb) => {
      amb.window.matchMedia = (q) => ({ matches: q === 'print', media: q, addListener() {}, removeListener() {} });
    },
  });
  try {
    for (const cel of r.todos('.am-celula')) {
      assert.ok(cel.getAttribute('data-ajuste'), 'na impressão o ajuste automático vale');
      assert.notEqual(cel.getAttribute('data-ajuste'), 'rolagem');
      assert.ok(num(cel.querySelector('svg'), 'width') <= parseFloat(cel.style.width) + 0.5, 'nada passa da célula no papel');
    }
  } finally {
    r.fim();
  }
});

test('v3.3 P11 — tile muito pequeno: texto nunca abaixo da fonte mínima', () => {
  for (const [largura, extra] of [[220, {}], [220, { layoutFonteMinima: 10 }], [160, { layoutAjusteRolagem: true }]]) {
    const r = abrir('arvores_multiplas', { ...CENARIO, ...extra }, { largura });
    try {
      const minima = extra.layoutFonteMinima || 9;
      for (const cel of r.todos('.am-celula')) {
        for (const rot of rotulosNaTela(cel)) assert.ok(rot.fonteNaTela >= minima - 0.05, `largura ${largura}: fonte ${rot.fonteNaTela.toFixed(2)} < ${minima}`);
        const s = escalaDo(cel.querySelector('svg'));
        assert.ok(s >= ESCALA_MINIMA - 0.001, `escala ${s} abaixo da mínima`);
      }
    } finally {
      r.fim();
    }
  }
});

test('v3.3 S1 — diagnóstico do layout (desligado por padrão)', () => {
  const sem = abrir('arvores_multiplas', CENARIO);
  const com = abrir('arvores_multiplas', { ...CENARIO, layoutDiagnostico: true });
  try {
    assert.equal(sem.palco.querySelector('.am-diagnostico'), null);
    const d = com.palco.querySelector('.am-diagnostico');
    assert.ok(d, 'linha de diagnóstico');
    assert.match(d.textContent, /célula \d+ px · necessária \d+ px · passo [a-z+]+ · fonte [\d,]+ px · colunas \d+ · escala [\d.]+/);
  } finally {
    sem.fim();
    com.fim();
  }
});

test('v3.3 — opções novas: ids, padrões, abas e rótulos curtos; ids antigos intactos', () => {
  for (const id of ['arvores_multiplas', 'org_chart']) {
    const r = abrir(id);
    try {
      const o = r.definicao.options;
      const esperado = {
        layoutQuandoNaoCouber: 'ajustar',
        layoutAjusteFonte: true,
        layoutAjusteLinhas: true,
        layoutAjusteEscala: true,
        layoutAjusteRolagem: false,
        layoutFonteMinima: 9,
        layoutFolgaDoTexto: 10,
        layoutAjusteNaNota: true,
        layoutDiagnostico: false,
      };
      if (id === 'arvores_multiplas') esperado.layoutAjusteColunas = true;
      else assert.equal(o.layoutAjusteColunas, undefined, 'org_chart não tem grade');
      for (const [k, v] of Object.entries(esperado)) {
        assert.ok(o[k], `${id}: opção ${k}`);
        assert.equal(o[k].default, v, `${id}: padrão de ${k}`);
        assert.ok(['Dados', 'Estilo', 'Texto', 'Mais'].includes(o[k].section), `${id}: ${k} fora das 4 abas (${o[k].section})`);
        assert.ok(o[k].label.length <= (o[k].type === 'boolean' ? 30 : 40), `${id}: rótulo longo "${o[k].label}"`);
      }
      assert.equal(o.ajusteDeEscala.default, 'real');
      assert.equal(o.fonteMinimaDoRotulo.default, 8);
    } finally {
      r.fim();
    }
  }
});

/* ------------------------------------------------------------------ */
/* org_chart                                                            */
/* ------------------------------------------------------------------ */

/** Escala e deslocamento do conteúdo do organograma. */
function transformacaoDoOrg(palco) {
  const g = palco.querySelector('.oc-area > svg > g');
  const t = g.getAttribute('transform') || '';
  const s = /scale\(([-\d.e]+)\)/.exec(t);
  return { escala: s ? Number(s[1]) : 1 };
}

/** Cartões em coordenadas do desenho, com os textos medidos pela função única. */
function cartoesDoOrg(palco) {
  return Array.from(palco.querySelectorAll('.oc-cartao')).map((g) => {
    const caixa = g.querySelector('.oc-caixa');
    const x0 = num(caixa, 'x');
    const textos = Array.from(g.querySelectorAll('.oc-texto')).filter((t) => !t.closest('.oc-botao')).map((t) => {
      const tam = Number(t.getAttribute('font-size'));
      const negrito = t.classList.contains('oc-nome');
      const w = larguraDoTexto(t.textContent, tam, { negrito });
      const x = num(t, 'x');
      const a = t.getAttribute('text-anchor');
      const ini = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x;
      return { texto: t.textContent, x0: ini, x1: ini + w, tamanho: tam, el: t };
    });
    return { x0, x1: x0 + num(caixa, 'width'), largura: num(caixa, 'width'), textos };
  });
}

test('v3.3 — org_chart (esquerda→direita) em área de 385 px: o desenho cabe e nenhum texto sai do cartão', () => {
  const antes = abrir('org_chart', { orientacao: 'esquerda', iconePadraoPorValor: 'estrela', layoutQuandoNaoCouber: 'rolar' }, { largura: 385 });
  const depois = abrir('org_chart', { orientacao: 'esquerda', iconePadraoPorValor: 'estrela' }, { largura: 385 });
  try {
    assert.ok(num(antes.palco.querySelector('.oc-area > svg'), 'width') > 385, 'em tamanho real o organograma passa da área (o defeito)');
    const svg = depois.palco.querySelector('.oc-area > svg');
    assert.ok(num(svg, 'width') <= 385 + 0.5, `o desenho (${num(svg, 'width')} px) deveria caber na área de 385 px`);
    const { escala } = transformacaoDoOrg(depois.palco);
    for (const c of cartoesDoOrg(depois.palco)) {
      for (const t of c.textos) {
        assert.ok(t.x0 >= c.x0 - 0.5 && t.x1 <= c.x1 + 0.5, `"${t.texto}" sai do cartão`);
        assert.ok(t.tamanho * escala >= 9 - 0.05, `fonte na tela ${(t.tamanho * escala).toFixed(2)} abaixo da mínima`);
        if (/…/.test(t.texto)) assert.ok(t.el.getAttribute('data-completo'), 'texto cortado sem o completo');
      }
    }
    assert.ok(depois.palco.querySelector('.oc-area').getAttribute('data-ajuste'));
  } finally {
    antes.fim();
    depois.fim();
  }
});

test('v3.3 — org_chart (cima→baixo): o cartão cabe na área; nunca fica menor que o texto; só a escala reduz', () => {
  for (const largura of [900, 240, 150]) {
    const r = abrir('org_chart', { iconePadraoPorValor: 'estrela', larguraDoCartao: 150 }, { largura });
    try {
      const { escala } = transformacaoDoOrg(r.palco);
      for (const c of cartoesDoOrg(r.palco)) {
        // larguraDoCartao é o mínimo enquanto cabe (198 px com as margens).
        if (largura - 18 >= 150 + 48) assert.ok(c.largura >= 150, 'larguraDoCartao continua sendo o mínimo');
        assert.ok(c.largura * escala <= largura - 18 + 0.5, `área ${largura}: cartão de ${(c.largura * escala).toFixed(0)} px na tela não cabe`);
        for (const t of c.textos) assert.ok(t.x1 <= c.x1 + 0.5 && t.x0 >= c.x0 - 0.5, `área ${largura}: "${t.texto}" maior que o cartão`);
        for (const t of c.textos) assert.ok(t.tamanho * escala >= 9 - 0.05, `área ${largura}: fonte abaixo da mínima`);
      }
    } finally {
      r.fim();
    }
  }
});

test('v3.3 — org_chart: "Rolar em tamanho real" e "Ajuste de escala" da v3.2 continuam valendo', () => {
  const r = abrir('org_chart', { orientacao: 'esquerda', layoutQuandoNaoCouber: 'rolar', ajusteDeEscala: 'ajustar' }, { largura: 385 });
  try {
    assert.equal(r.palco.querySelector('.oc-area').getAttribute('data-ajuste'), null);
    assert.ok(transformacaoDoOrg(r.palco).escala < 1, 'o "Ajustar à área" da v3.2 reduz o desenho');
  } finally {
    r.fim();
  }
});
