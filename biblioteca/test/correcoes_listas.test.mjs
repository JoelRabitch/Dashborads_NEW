/**
 * correcoes_listas.test.mjs — reprodução e verificação das correções v2
 * (módulos 6.1 a 6.4 + seção 7) nos gráficos de lista virtualizada
 * (barras_ranking_denso, dot_plot_denso, dumbbell), no heatmap_denso e no
 * bar_race.
 *
 * Cada teste foi escrito ANTES da correção e falhava no código antigo: as
 * opções de rótulo, contorno, grade e "Inverter ordem das cores" eram
 * declaradas no painel e nunca lidas; o tooltip mostrava números
 * reformatados pelo próprio gráfico em vez do texto do Looker; o clique só
 * fazia drill (sem link, nada acontecia); a forma do ponto não existia.
 *
 * O config imita o do Looker: `configPadrao(definicao)` (todas as chaves
 * registradas com o default) + o que o usuário mudou, inclusive `false`,
 * `0` e texto vazio.
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

/** Carrega o bundle, desenha a fixture com os ajustes do usuário. */
function desenhar(id, nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  assert.ok(definicao, `${id} não se registrou`);
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const fixture = FIXTURES[nomeDaFixture]();
  inst.create(palco, configPadrao(definicao));
  let ok = false;
  inst.updateAsync(
    fixture.data,
    palco,
    Object.assign(configPadrao(definicao), ajustes),
    fixture.queryResponse,
    {},
    () => { ok = true; }
  );
  assert.ok(ok, 'done() precisa ser chamado');
  const doc = amb.window.document;
  return {
    amb,
    doc,
    palco,
    inst,
    dados: fixture.data,
    rotulos: () => Array.from(palco.querySelectorAll('[data-rotulo]')),
    tooltip: () => doc.querySelector('.bl-tooltip'),
    mover(alvo, x = 20, y = 20) {
      alvo.dispatchEvent(new amb.window.MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
    },
    clicar(alvo, x = 20, y = 20) {
      alvo.dispatchEvent(new amb.window.MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
    },
    fim: () => amb.restaurar(),
  };
}

const rgb = (hex) => {
  const h = hex.replace('#', '');
  return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`;
};

/** Mesma cor? (aceita #hex e rgb(), que é como o jsdom devolve o style.) */
function mesmaCor(valor, hex) {
  const v = String(valor || '').toLowerCase().replace(/\s+/g, '');
  return v === hex.toLowerCase() || v === rgb(hex).replace(/\s+/g, '');
}

/** font-size de um rótulo (SVG por atributo, HTML por style). */
function tamanhoDe(el) {
  return el.namespaceURI === 'http://www.w3.org/2000/svg'
    ? String(el.getAttribute('font-size'))
    : String(el.style.fontSize).replace('px', '');
}

const LISTAS = [
  { id: 'barras_ranking_denso', fixture: 'semPivo', linha: '.br-linha', extra: {} },
  { id: 'dot_plot_denso', fixture: 'semPivo', linha: '.dp-linha', extra: { escreverValores: 'primeira' } },
  { id: 'dumbbell', fixture: 'semPivo', linha: '.db-linha', extra: {} },
];

/* ============================ 6.1 rótulos ============================ */

for (const { id, fixture, extra } of LISTAS) {
  test(`${id} — tamanho, cor, negrito e rotação do rótulo têm efeito`, () => {
    const r = desenhar(id, fixture, {
      ...extra,
      tamanhoDoRotulo: 20,
      corDoRotulo: '#ff0000',
      negritoNoRotulo: true,
      rotacaoDoRotulo: -30,
    });
    try {
      const rot = r.rotulos();
      assert.ok(rot.length > 0, 'nenhum [data-rotulo] desenhado');
      for (const el of rot) {
        assert.equal(tamanhoDe(el), '20', 'tamanhoDoRotulo: 20 → 20px');
        assert.ok(mesmaCor(el.style.color, '#ff0000'), `cor ${el.style.color}`);
        assert.equal(el.style.fontWeight, '700');
        assert.match(el.style.transform, /rotate\(-30deg\)/);
      }
    } finally {
      r.fim();
    }
  });

  test(`${id} — mostrarRotulos: false esconde todos os rótulos de dado`, () => {
    const r = desenhar(id, fixture, { ...extra, mostrarRotulos: false });
    try {
      assert.ok(r.palco.querySelectorAll(LISTAS.find((l) => l.id === id).linha).length > 0, 'nenhuma linha');
      assert.equal(r.rotulos().length, 0);
      const classe = { barras_ranking_denso: '.br-valor', dot_plot_denso: '.dp-valor', dumbbell: '.db-valor' }[id];
      assert.equal(r.palco.querySelectorAll(classe).length, 0, 'o valor continuou escrito');
    } finally {
      r.fim();
    }
  });

  test(`${id} — conteúdo, formato, casas e truncar do rótulo`, () => {
    const nome = desenhar(id, fixture, { ...extra, conteudoDoRotulo: 'nomeValor' });
    try {
      const primeira = nome.palco.querySelector(LISTAS.find((l) => l.id === id).linha);
      const nomeDoItem = primeira.querySelector('[class$="-nome"]').title;
      const rot = primeira.querySelector('[data-rotulo]');
      assert.ok(rot, 'sem rótulo na primeira linha');
      assert.ok(rot.textContent.startsWith(`${nomeDoItem}: `), `"${rot.textContent}" não começa pelo nome`);
    } finally {
      nome.fim();
    }
    const compacto = desenhar(id, fixture, { ...extra, formatoDoRotulo: 'compacto', casasDecimaisDoRotulo: 0 });
    try {
      const textos = compacto.rotulos().map((e) => e.textContent);
      assert.ok(textos.length > 0);
      assert.ok(textos.some((t) => /\dK/.test(t)), `formato compacto sem K: ${textos.slice(0, 3)}`);
      assert.ok(textos.every((t) => !/\d[.,]\dK/.test(t)), '0 casas decimais não pode ter decimal');
    } finally {
      compacto.fim();
    }
    const curto = desenhar(id, fixture, { ...extra, conteudoDoRotulo: 'nome', truncarRotulo: 4 });
    try {
      const textos = curto.rotulos().map((e) => e.textContent);
      assert.ok(textos.length > 0);
      for (const t of textos) assert.ok(t.length <= 4, `"${t}" não foi truncado`);
    } finally {
      curto.fim();
    }
  });
}

test('barras_ranking_denso — posição do rótulo: fora e centro', () => {
  const fora = desenhar('barras_ranking_denso', 'semPivo', { posicaoDoRotulo: 'fora' });
  const centro = desenhar('barras_ranking_denso', 'semPivo', { posicaoDoRotulo: 'centro' });
  try {
    const f = fora.palco.querySelector('[data-rotulo]');
    const c = centro.palco.querySelector('[data-rotulo]');
    assert.equal(f.dataset.posicao, 'fora');
    assert.equal(c.dataset.posicao, 'centro');
    assert.notEqual(f.style.left, c.style.left, 'a posição escolhida precisa mudar o lugar do rótulo');
  } finally {
    fora.fim();
    centro.fim();
  }
});

/* ============================== 6.2 cores ============================= */

/** Cor de preenchimento da primeira marca de cada gráfico. */
function corDaPrimeiraMarca(r, id) {
  if (id === 'barras_ranking_denso') return r.palco.querySelector('.br-barra').style.background;
  if (id === 'bar_race') return r.palco.querySelector('.bc-retangulo').style.background;
  const sel = id === 'dot_plot_denso' ? '.dp-ponto' : '.db-ponto';
  const ponto = r.palco.querySelector(sel);
  const marcador = ponto.querySelector('.bl-marcador');
  return marcador ? marcador.getAttribute('fill') : ponto.style.background;
}

for (const [id, fixture, ajuste] of [
  ['barras_ranking_denso', 'semPivo', { destacarTop: 0 }],
  ['dot_plot_denso', 'semPivo', {}],
  ['dumbbell', 'semPivo', {}],
  ['bar_race', 'comPivo', { comecarTocando: false }],
]) {
  test(`${id} — "Inverter ordem das cores" muda a cor`, () => {
    const normal = desenhar(id, fixture, { ...ajuste, inverterPaleta: false });
    const invertida = desenhar(id, fixture, { ...ajuste, inverterPaleta: true });
    try {
      const a = corDaPrimeiraMarca(normal, id);
      const b = corDaPrimeiraMarca(invertida, id);
      assert.ok(a && b, 'sem cor para comparar');
      assert.notEqual(a, b, 'inverter a paleta não mudou a cor');
    } finally {
      normal.fim();
      invertida.fim();
    }
  });

  test(`${id} — contorno: mostrar, cor e desligar`, () => {
    const com = desenhar(id, fixture, { ...ajuste, mostrarContorno: true, corDoContorno: '#00ff00', espessuraDoContorno: 2 });
    const sem = desenhar(id, fixture, { ...ajuste, mostrarContorno: false, corDoContorno: '#00ff00' });
    const marca = (r) => {
      if (id === 'barras_ranking_denso') return r.palco.querySelector('.br-barra');
      if (id === 'bar_race') return r.palco.querySelector('.bc-retangulo');
      return r.palco.querySelector('.dp-ponto .bl-marcador, .db-ponto .bl-marcador');
    };
    try {
      const a = marca(com);
      const b = marca(sem);
      assert.ok(a && b, 'marca não encontrada');
      if (a.namespaceURI === 'http://www.w3.org/2000/svg') {
        assert.equal(a.getAttribute('stroke'), '#00ff00');
        assert.equal(a.getAttribute('stroke-width'), '2');
        assert.equal(b.getAttribute('stroke'), 'none');
      } else {
        assert.match(a.style.border, /2px solid/);
        assert.ok(/rgb\(0, 255, 0\)|#00ff00/i.test(a.style.border), `borda ${a.style.border}`);
        // O jsdom normaliza `border: none` para "medium"; o que importa é
        // não haver traço nem a cor escolhida.
        assert.ok(['none', ''].includes(b.style.borderStyle), `sem contorno: ${b.style.border}`);
        assert.ok(!/rgb\(0, 255, 0\)|#00ff00/i.test(b.style.border), `sem contorno: ${b.style.border}`);
      }
    } finally {
      com.fim();
      sem.fim();
    }
  });

  test(`${id} — cor das linhas de grade (tema) aparece nas guias`, () => {
    const r = desenhar(id, fixture, { ...ajuste, corDaGrade: '#ff0000' });
    try {
      const guias = Array.from(r.palco.querySelectorAll('[data-grade]'));
      assert.ok(guias.length > 0, 'nenhuma linha de grade');
      for (const g of guias) assert.ok(mesmaCor(g.style.background, '#ff0000'), `grade ${g.style.background}`);
    } finally {
      r.fim();
    }
  });
}

test('dot_plot_denso — opacidade do preenchimento chega ao ponto', () => {
  const r = desenhar('dot_plot_denso', 'semPivo', { opacidade: 0.5 });
  try {
    const m = r.palco.querySelector('.dp-ponto .bl-marcador');
    assert.ok(m, 'ponto sem marcador SVG');
    assert.equal(m.getAttribute('fill-opacity'), '0.5');
  } finally {
    r.fim();
  }
});

test('listas — cor das bordas (tema) aparece no contorno da barra de topo', () => {
  for (const { id, fixture } of LISTAS) {
    const r = desenhar(id, fixture, { corDaBorda: '#ff0000' });
    try {
      const topo = r.palco.querySelector('.lv-topo');
      assert.ok(/rgb\(255, 0, 0\)|#ff0000/i.test(topo.style.borderBottom), `${id}: ${topo.style.borderBottom}`);
    } finally {
      r.fim();
    }
  }
});

/* ============================== 6.4 formas ============================ */

for (const id of ['dot_plot_denso', 'dumbbell']) {
  test(`${id} — forma do ponto muda o desenho`, () => {
    const r = desenhar(id, 'semPivo', { formaDoPonto: 'losango' });
    const c = desenhar(id, 'semPivo', {});
    try {
      const losangos = r.palco.querySelectorAll('.bl-marcador[data-forma="losango"]');
      assert.ok(losangos.length > 0, 'formaDoPonto: losango não desenhou losango');
      assert.equal(r.palco.querySelectorAll('.bl-marcador:not([data-forma="losango"])').length, 0);
      assert.ok(c.palco.querySelectorAll('.bl-marcador[data-forma="circulo"]').length > 0, 'padrão = círculo');
      const opcao = c.amb.registro[id].options.formaDoPonto;
      assert.ok(opcao && opcao.default === 'circulo', 'opção formaDoPonto registrada com padrão círculo');
    } finally {
      r.fim();
      c.fim();
    }
  });
}

/* ============================= 6.3 tooltip ============================ */

for (const { id, fixture, linha } of LISTAS) {
  test(`${id} — tooltip usa o texto do Looker (rendered), não o número reformatado`, () => {
    const r = desenhar(id, fixture, {});
    try {
      const linhas = Array.from(r.palco.querySelectorAll(linha));
      assert.ok(linhas.length > 1, 'poucas linhas');
      // Todas as linhas: a diferença de formato só aparece acima de 1.000.
      for (const el of linhas) {
        r.mover(el.querySelector('[class$="-nome"]'));
        const tip = r.tooltip();
        assert.ok(tip && tip.classList.contains('bl-visivel'), 'tooltip não apareceu');
        const nome = el.querySelector('[class$="-nome"]').title;
        const dado = r.dados.find((d) => d.loja.value === nome);
        assert.ok(dado, `linha "${nome}" não achada na fixture`);
        assert.ok(
          tip.textContent.includes(dado.vendas.rendered),
          `tooltip "${tip.textContent}" sem o rendered "${dado.vendas.rendered}"`
        );
      }
      assert.equal(r.doc.querySelectorAll('.bl-tooltip').length, 1);
    } finally {
      r.fim();
    }
  });

  test(`${id} — clique: drill com links; sem links não fixa no modo drill e fixa no modo "fixar" (v3, 5.1)`, () => {
    const comLinks = desenhar(id, fixture, {});
    try {
      comLinks.clicar(comLinks.palco.querySelector(`${linha} [class$="-nome"]`));
      assert.equal(comLinks.amb.chamadasDeApi.drills, 1, 'célula com links precisa abrir o drill');
    } finally {
      comLinks.fim();
    }
    // duasDimensoes não tem links.
    const semLinks = desenhar(id, 'duasDimensoes', {});
    try {
      const alvo = semLinks.palco.querySelector(`${linha} [class$="-nome"]`);
      assert.ok(alvo, 'nenhuma linha na fixture sem links');
      semLinks.clicar(alvo);
      assert.equal(semLinks.amb.chamadasDeApi.drills, 0);
      assert.equal(semLinks.doc.querySelector('.bl-tooltip.bl-fixo'), null, 'sem links, no modo drill (padrão), o clique NÃO fixa (v3, 5.1)');
    } finally {
      semLinks.fim();
    }
    const fixar = desenhar(id, 'duasDimensoes', { acaoDoClique: 'fixar' });
    try {
      fixar.clicar(fixar.palco.querySelector(`${linha} [class$="-nome"]`));
      assert.ok(fixar.doc.querySelector('.bl-tooltip.bl-fixo'), 'modo "fixar": o clique fixa o tooltip');
    } finally {
      fixar.fim();
    }
  });
}

/* ============================== heatmap =============================== */

test('heatmap_denso — rótulos nas células obedecem às opções', () => {
  const padrao = desenhar('heatmap_denso', 'duasDimensoes', {});
  const estilo = desenhar('heatmap_denso', 'duasDimensoes', {
    tamanhoDoRotulo: 20,
    corDoRotulo: '#ff0000',
    negritoNoRotulo: true,
    evitarColisaoDeRotulos: false,
  });
  const sem = desenhar('heatmap_denso', 'duasDimensoes', { mostrarRotulos: false });
  try {
    assert.ok(padrao.rotulos().length > 0, 'nenhum valor escrito nas células');
    const rot = estilo.rotulos();
    assert.ok(rot.length > 0);
    for (const el of rot) {
      assert.equal(el.getAttribute('font-size'), '20');
      assert.equal(el.getAttribute('fill'), '#ff0000');
      assert.equal(el.getAttribute('font-weight'), '700');
    }
    assert.equal(sem.rotulos().length, 0);
  } finally {
    padrao.fim();
    estilo.fim();
    sem.fim();
  }
});

test('heatmap_denso — formato e casas no rótulo; o padrão usa o texto do Looker', () => {
  const r = desenhar('heatmap_denso', 'duasDimensoes', { evitarColisaoDeRotulos: false });
  const c = desenhar('heatmap_denso', 'duasDimensoes', {
    evitarColisaoDeRotulos: false, formatoDoRotulo: 'compacto', casasDecimaisDoRotulo: 0,
  });
  try {
    const renderizados = new Set(r.dados.map((d) => String(d.receita.rendered)));
    const textos = r.rotulos().map((e) => e.textContent);
    assert.ok(textos.length > 0);
    assert.ok(textos.every((t) => renderizados.has(t)), `rótulo fora do texto do Looker: ${textos[0]}`);
    const compactos = c.rotulos().map((e) => e.textContent);
    assert.ok(compactos.every((t) => /^\$?-?\d+[KM]?$/.test(t)), `compacto sem casas: ${compactos.slice(0, 3)}`);
  } finally {
    r.fim();
    c.fim();
  }
});

test('heatmap_denso — no canvas, o rótulo usa tamanho, cor, negrito e o texto pedido', async () => {
  const mod = await import('../src/charts/heatmap_denso/index.js');
  assert.equal(typeof mod.desenharRotulosNoCanvas, 'function', 'função de rótulos no canvas não existe');
  const chamadas = [];
  const pincel = {
    font: '', fillStyle: '', textAlign: '', textBaseline: '',
    save() {}, restore() {}, translate() {}, rotate() {},
    fillText(t, x, y) { chamadas.push({ t, x, y, font: this.font, cor: this.fillStyle }); },
  };
  const rot = {
    mostrar: true, tamanho: 20, cor: '#ff0000', negrito: true, rotacao: 0, evitarColisao: true,
    truncar: 0, posicao: 'auto', conteudo: 'valor', formato: 'numero', casas: 0, fonte: 'Arial', corDoTema: '#000',
  };
  const n = mod.desenharRotulosNoCanvas(pincel, rot, [
    { x: 10, y: 10, largura: 120, altura: 40, valor: 1234.5, nome: 'a', corDeFundo: '#000000' },
    { x: 10, y: 60, largura: 6, altura: 6, valor: 99, nome: 'b', corDeFundo: '#000000' },
  ]);
  assert.equal(n, 1, 'a célula pequena demais é pulada quando "evitar colisão" está ligado');
  assert.equal(chamadas.length, 1);
  assert.match(chamadas[0].font, /700 20px/);
  assert.equal(chamadas[0].cor, '#ff0000');
  assert.equal(chamadas[0].t, '1,235');
});

test('heatmap_denso — tooltip com texto do Looker; sem links o clique não fixa (v3, 5.1)', () => {
  const r = desenhar('heatmap_denso', 'duasDimensoes', {});
  try {
    const cel = r.palco.querySelector('rect.hd-celula');
    const x = Number(cel.getAttribute('x')) + 2;
    const y = Number(cel.getAttribute('y')) + 2;
    const area = r.palco.querySelector('.hd-area');
    r.mover(area, x, y);
    const tip = r.tooltip();
    assert.ok(tip && tip.classList.contains('bl-visivel'), 'tooltip não apareceu');
    const renderizados = r.dados.map((d) => String(d.receita.rendered));
    assert.ok(renderizados.some((t) => tip.textContent.includes(t)), `tooltip sem rendered: ${tip.textContent}`);
    r.clicar(area, x, y);
    assert.equal(r.doc.querySelector('.bl-tooltip.bl-fixo'), null, 'sem links, no modo drill (padrão), o clique NÃO fixa (v3, 5.1)');
  } finally {
    r.fim();
  }
});

/* ============================== bar_race ============================== */

test('bar_race — número do rank em cada barra, configurável', () => {
  const r = desenhar('bar_race', 'comPivo', { comecarTocando: false });
  const t = desenhar('bar_race', 'comPivo', { comecarTocando: false, tamanhoDoRank: 18 });
  const s = desenhar('bar_race', 'comPivo', { comecarTocando: false, mostrarRank: false });
  try {
    const ranks = Array.from(r.palco.querySelectorAll('.bc-barra')).map((b) => ({
      topo: Number(String(b.style.top).replace('px', '')),
      rank: b.querySelector('.bc-rank')?.textContent,
    }));
    assert.ok(ranks.length > 2, 'poucas barras');
    ranks.sort((a, b) => a.topo - b.topo);
    assert.deepEqual(ranks.map((x) => x.rank), ranks.map((_, i) => String(i + 1)), 'rank 1, 2, 3… de cima para baixo');
    for (const el of t.palco.querySelectorAll('.bc-rank')) assert.equal(el.style.fontSize, '18px');
    assert.equal(s.palco.querySelectorAll('.bc-rank').length, 0);
    assert.equal(r.amb.registro.bar_race.options.mostrarRank.default, true);
  } finally {
    r.fim();
    t.fim();
    s.fim();
  }
});

test('bar_race — rótulos do valor obedecem às opções', () => {
  const r = desenhar('bar_race', 'comPivo', {
    comecarTocando: false, tamanhoDoRotulo: 20, corDoRotulo: '#ff0000', negritoNoRotulo: true,
  });
  const s = desenhar('bar_race', 'comPivo', { comecarTocando: false, mostrarRotulos: false });
  const c = desenhar('bar_race', 'comPivo', { comecarTocando: false, conteudoDoRotulo: 'nomeValor' });
  try {
    const rot = r.rotulos();
    assert.ok(rot.length > 0, 'nenhum rótulo de valor');
    for (const el of rot) {
      assert.equal(el.style.fontSize, '20px');
      assert.ok(mesmaCor(el.style.color, '#ff0000'));
      assert.equal(el.style.fontWeight, '700');
    }
    assert.equal(s.rotulos().length, 0);
    assert.ok(
      Array.from(s.palco.querySelectorAll('.bc-valor')).every((v) => v.textContent === '' || v.style.display === 'none'),
      'mostrarRotulos: false ainda escreveu o valor'
    );
    const barra = c.palco.querySelector('.bc-barra');
    const nome = barra.querySelector('.bc-nome').title;
    assert.ok(barra.querySelector('[data-rotulo]').textContent.startsWith(`${nome}: `));
  } finally {
    r.fim();
    s.fim();
    c.fim();
  }
});
