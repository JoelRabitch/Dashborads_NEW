/**
 * correcoes_quadrantes.test.mjs — correções v2 da família de quadrantes
 * (`quadrant_scatter`, `matriz_2x2`, `matriz_bcg`, `risco_retorno`, todos
 * desenhados por `src/charts/_quadrantes/`).
 *
 * Cada teste REPRODUZ um defeito relatado no Looker real e foi escrito
 * antes da correção (falhava no código antigo). O config imita o que o
 * Looker entrega: os defaults de todas as opções registradas
 * (`configPadrao`) + o que o usuário mudou — inclusive `false`, `0` e ''.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

const GRAFICOS = ['quadrant_scatter', 'matriz_2x2', 'matriz_bcg', 'risco_retorno'];

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

const LINK = [{ label: 'Explorar', url: '#drill', type: 'measure_default' }];

/**
 * 8 ativos com nomes LONGOS (para testar truncamento), valores com muitas
 * casas (para pegar número cru no tooltip) e `links` só nos pares.
 * `comLinks: false` tira os links de todos (clique sem drill).
 */
function dados({ comLinks = true, sobrepostos = false } = {}) {
  const linhas = [];
  for (let i = 0; i < 8; i++) {
    const risco = sobrepostos ? 0.1 : 0.05 + i * 0.031 + (i % 3) * 0.013;
    const retorno = sobrepostos ? 0.08 : 0.02 + ((i * 37) % 11) * 0.011;
    const exposicao = 100 + i * 250;
    const variacao = i === 3 ? -6.18841 : (i - 4) * 1.23456;
    const ativo = { value: `Ativo de investimento muito comprido ${i + 1}`, rendered: `Ativo de investimento muito comprido ${i + 1}` };
    if (comLinks && i % 2 === 0) ativo.links = LINK;
    linhas.push({
      ativo,
      risco: { value: risco, rendered: `${(risco * 100).toFixed(2)}%` },
      retorno: { value: retorno, rendered: `${(retorno * 100).toFixed(2)}%` },
      exposicao: { value: exposicao, rendered: `R$ ${exposicao}` },
      variacao: { value: variacao, rendered: `${variacao.toFixed(2)} pp` },
    });
  }
  const medida = (name, label, vf) => ({ name, label, label_short: label, type: 'number', is_numeric: true, value_format: vf });
  const dim = [{ name: 'ativo', label: 'Ativo', label_short: 'Ativo', type: 'string' }];
  const med = [
    medida('risco', 'Risco', '0.00%'),
    medida('retorno', 'Retorno', '0.00%'),
    medida('exposicao', 'Exposição', null),
    medida('variacao', 'Variação', null),
  ];
  return {
    data: linhas,
    queryResponse: {
      fields: { dimensions: dim, measures: med, table_calculations: [], dimension_like: dim, measure_like: med, pivots: [] },
      pivots: [],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */

function abrir(id, ajustes = {}, opcoesDosDados = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  assert.ok(definicao, `${id} não se registrou`);
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  inst.create(palco, configPadrao(definicao));
  const desenhar = (aj = ajustes, od = opcoesDosDados) => {
    const { data, queryResponse } = dados(od);
    let ok = false;
    inst.updateAsync(data, palco, Object.assign(configPadrao(definicao), aj), queryResponse, {}, () => { ok = true; });
    assert.ok(ok, 'done() precisa ser chamado');
  };
  desenhar();
  const doc = amb.window.document;
  return {
    amb,
    doc,
    inst,
    palco,
    desenhar,
    rotulosDePonto: () => Array.from(palco.querySelectorAll('.qd-rotulo-ponto[data-rotulo]')),
    marcadores: () => Array.from(palco.querySelectorAll('.qd-ponto')),
    tooltip: () => doc.querySelector('.bl-tooltip'),
    fim: () => amb.restaurar(),
  };
}

/** Passa o mouse pela área até achar um ponto (o jsdom não mede nada). */
function passarMouseAteAcharPonto(r) {
  const area = r.palco.querySelector('.qd-area');
  assert.ok(area, 'faltou a .qd-area');
  for (let y = 0; y < 560; y += 6) {
    for (let x = 0; x < 900; x += 6) {
      const ev = new r.amb.window.MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y });
      area.dispatchEvent(ev);
      const t = r.tooltip();
      if (t && t.classList.contains('bl-visivel')) return { x, y, area };
    }
  }
  return null;
}

function clicar(r, alvo) {
  const ev = new r.amb.window.MouseEvent('click', { bubbles: true, clientX: alvo.x, clientY: alvo.y });
  alvo.area.dispatchEvent(ev);
}

/** Acha um ponto pelo índice da linha e devolve a posição do marcador. */
function posicaoDoMarcador(r, indice) {
  const el = r.palco.querySelector(`.qd-ponto[data-indice="${indice}"]`);
  if (!el) return null;
  const m = /translate\(([-\d.e]+),([-\d.e]+)\)/.exec(el.getAttribute('transform') || '');
  return m ? { x: Number(m[1]), y: Number(m[2]), area: r.palco.querySelector('.qd-area') } : null;
}

/* ------------------------------------------------------------------ */
/* 6.1 Rótulos                                                         */
/* ------------------------------------------------------------------ */

test('rótulos — tamanho, negrito e rotação do painel chegam aos rótulos dos pontos', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, { tamanhoDoRotulo: 20, negritoNoRotulo: true, rotacaoDoRotulo: 45, evitarColisaoDeRotulos: false });
    try {
      const rotulos = r.rotulosDePonto();
      assert.ok(rotulos.length > 0, `${id}: nenhum rótulo de ponto passou pela função única (data-rotulo)`);
      for (const el of rotulos) {
        assert.equal(el.getAttribute('font-size'), '20', `${id}: tamanhoDoRotulo 20 ignorado`);
        assert.equal(el.getAttribute('font-weight'), '700', `${id}: negrito ignorado`);
        assert.match(el.getAttribute('transform') || '', /rotate\(45/, `${id}: rotação ignorada`);
      }
    } finally {
      r.fim();
    }
  }
});

test('rótulos — mostrarRotulos: false esconde todos; quantosRotulosDePonto continua valendo', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, { mostrarRotulos: false });
    try {
      assert.equal(r.palco.querySelectorAll('[data-rotulo]').length, 0, `${id}: rótulo apareceu com mostrarRotulos false`);
      r.desenhar({ quantosRotulosDePonto: 2, evitarColisaoDeRotulos: false });
      assert.equal(r.rotulosDePonto().length, 2, `${id}: quantosRotulosDePonto: 2`);
      r.desenhar({ quantosRotulosDePonto: 0 });
      assert.equal(r.rotulosDePonto().length, 0, `${id}: quantosRotulosDePonto: 0`);
    } finally {
      r.fim();
    }
  }
});

test('rótulos — truncarRotulo: 0 não trunca; cor, conteúdo, formato e casas valem', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, { truncarRotulo: 0, quantosRotulosDePonto: 999, evitarColisaoDeRotulos: false, corDoRotulo: '#AA0000' });
    try {
      const textos = r.rotulosDePonto().map((el) => el.textContent);
      assert.ok(textos.length === 8, `${id}: esperava 8 rótulos, veio ${textos.length}`);
      assert.ok(
        textos.every((t) => /^Ativo de investimento muito comprido \d$/.test(t)),
        `${id}: "0 = não truncar" foi tratado como ausente; veio ${textos[0]}`
      );
      assert.ok(r.rotulosDePonto().every((el) => el.getAttribute('fill') === '#AA0000'), `${id}: corDoRotulo ignorada`);

      r.desenhar({ truncarRotulo: 10, quantosRotulosDePonto: 999, evitarColisaoDeRotulos: false });
      assert.ok(r.rotulosDePonto().every((el) => el.textContent.length <= 10), `${id}: truncarRotulo 10 ignorado`);

      r.desenhar({ conteudoDoRotulo: 'nomeValor', truncarRotulo: 0, quantosRotulosDePonto: 999, evitarColisaoDeRotulos: false });
      const comValor = r.rotulosDePonto().map((el) => el.textContent);
      assert.ok(comValor.every((t) => /: .*%$/.test(t)), `${id}: conteúdo "Nome e valor" ignorado; veio ${comValor[0]}`);

      r.desenhar({ conteudoDoRotulo: 'valorY', truncarRotulo: 0, formatoDoRotulo: 'numero', casasDecimaisDoRotulo: 3, quantosRotulosDePonto: 999, evitarColisaoDeRotulos: false });
      const numeros = r.rotulosDePonto().map((el) => el.textContent);
      assert.ok(numeros.every((t) => /^-?\d+\.\d{3}$/.test(t)), `${id}: formato/casas do rótulo ignorados; veio ${numeros.join(', ')}`);
    } finally {
      r.fim();
    }
  }
});

test('rótulos — evitarColisaoDeRotulos esconde os sobrepostos; desligado mostra todos', () => {
  for (const id of ['quadrant_scatter', 'matriz_2x2']) {
    const r = abrir(id, { quantosRotulosDePonto: 999, evitarColisaoDeRotulos: true }, { sobrepostos: true });
    try {
      const escondidos = () => r.rotulosDePonto().filter((el) => el.getAttribute('display') === 'none').length;
      assert.ok(escondidos() >= 6, `${id}: 8 rótulos no mesmo lugar e só ${escondidos()} escondidos`);
      r.desenhar({ quantosRotulosDePonto: 999, evitarColisaoDeRotulos: false }, { sobrepostos: true });
      assert.equal(escondidos(), 0, `${id}: com a opção desligada nenhum rótulo some`);
    } finally {
      r.fim();
    }
  }
});

/* ------------------------------------------------------------------ */
/* 6.4 Marcadores                                                      */
/* ------------------------------------------------------------------ */

test('marcadores — formaDoPonto muda o desenho de todos os pontos (e é relida no redesenho)', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, { formaDoPonto: 'quadrado' });
    try {
      const qd = r.palco.querySelectorAll('.bl-marcador.qd-ponto[data-forma="quadrado"]').length;
      assert.equal(qd, 8, `${id}: esperava 8 marcadores quadrados, veio ${qd}`);
      r.desenhar({ formaDoPonto: 'triangulo' });
      assert.equal(r.palco.querySelectorAll('.qd-ponto[data-forma="triangulo"]').length, 8, `${id}: troca de forma não redesenhou`);
      assert.equal(r.palco.querySelectorAll('.qd-ponto[data-forma="quadrado"]').length, 0, `${id}: sobrou forma antiga`);
    } finally {
      r.fim();
    }
  }
});

/* ------------------------------------------------------------------ */
/* 6.2 Cores                                                           */
/* ------------------------------------------------------------------ */

test('cores — mostrarContorno false tira o contorno; cor e espessura do contorno valem', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, { mostrarContorno: false });
    try {
      assert.ok(r.marcadores().length > 0, `${id}: sem marcadores`);
      assert.ok(
        r.marcadores().every((el) => !el.getAttribute('stroke') || el.getAttribute('stroke') === 'none'),
        `${id}: mostrarContorno false ainda desenha contorno`
      );
      r.desenhar({ mostrarContorno: true, corDoContorno: '#FF0000', espessuraDoContorno: 3, tracejadoDoContorno: 'tracejado' });
      for (const el of r.marcadores()) {
        assert.equal(el.getAttribute('stroke'), '#FF0000', `${id}: corDoContorno ignorada`);
        assert.equal(el.getAttribute('stroke-width'), '3', `${id}: espessura ignorada`);
        assert.ok(el.getAttribute('stroke-dasharray'), `${id}: tracejado ignorado`);
      }
    } finally {
      r.fim();
    }
  }
});

test('cores — inverterPaleta muda as cores; opacidade do painel multiplica a do ponto', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, {});
    try {
      const cores = () => r.marcadores().map((el) => el.getAttribute('fill')).join(',');
      const antes = cores();
      r.desenhar({ inverterPaleta: true });
      assert.notEqual(cores(), antes, `${id}: inverterPaleta não mudou nenhuma cor`);
      r.desenhar({ opacidade: 0.5, opacidadeDoPonto: 0.8 });
      assert.ok(
        r.marcadores().every((el) => Math.abs(Number(el.getAttribute('fill-opacity')) - 0.4) < 1e-9),
        `${id}: opacidade 0.5 × 0.8 deveria dar 0.4`
      );
    } finally {
      r.fim();
    }
  }
});

test('cores — modoDeCor "unica" da aba Cores pinta todos com a cor única', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, { modoDeCor: 'unica', corUnica: '#00AA00' });
    try {
      assert.ok(r.marcadores().length > 0, `${id}: sem marcadores`);
      assert.ok(r.marcadores().every((el) => el.getAttribute('fill') === '#00AA00'), `${id}: modoDeCor "unica" ignorado`);
    } finally {
      r.fim();
    }
  }
});

test('quadrantes — nome e cor de cada quadrante aparecem no fundo, no nome e nos pontos', () => {
  for (const id of GRAFICOS) {
    const ajustes = {
      divisoriaX: 'mediana',
      divisoriaY: 'mediana',
      rotulo_superiorDireito: 'Q-SD',
      rotulo_inferiorEsquerdo: 'Q-IE',
      cor_superiorDireito: '#123456',
      cor_inferiorEsquerdo: 'rgb(200, 10, 10)',
      pintarQuadrantes: true,
      mostrarContagemPorQuadrante: false,
    };
    if (id === 'matriz_bcg') ajustes.normalizarParticipacao = false;
    const r = abrir(id, ajustes);
    try {
      const nomes = Array.from(r.palco.querySelectorAll('.qd-rotulo-quadrante')).map((el) => el.textContent);
      assert.ok(nomes.includes('Q-SD') && nomes.includes('Q-IE'), `${id}: nomes dos quadrantes; veio ${nomes.join(' | ')}`);
      const fundoSD = r.palco.querySelector('.qd-fundo[data-quadrante="superiorDireito"]');
      const fundoIE = r.palco.querySelector('.qd-fundo[data-quadrante="inferiorEsquerdo"]');
      assert.ok(fundoSD && fundoIE, `${id}: faltou o fundo dos quadrantes`);
      assert.equal(fundoSD.getAttribute('fill'), '#123456', `${id}: cor do quadrante no fundo`);
      assert.equal(fundoIE.getAttribute('fill'), 'rgb(200, 10, 10)', `${id}: cor em rgb() precisa funcionar`);
      assert.ok(Number(fundoSD.getAttribute('fill-opacity')) < 0.5, `${id}: fundo precisa ser translúcido`);
      const nomeSD = Array.from(r.palco.querySelectorAll('.qd-rotulo-quadrante')).find((el) => el.textContent === 'Q-SD');
      assert.equal(nomeSD.getAttribute('fill'), '#123456', `${id}: cor do nome do quadrante`);
      const pontosSD = r.palco.querySelectorAll('.qd-ponto[data-quadrante="superiorDireito"]');
      assert.ok(pontosSD.length > 0, `${id}: nenhum ponto no quadrante superior direito`);
      for (const p of pontosSD) assert.equal(p.getAttribute('fill'), '#123456', `${id}: cor do quadrante nos pontos`);
    } finally {
      r.fim();
    }
  }
});

/* ------------------------------------------------------------------ */
/* 6.3 Tooltip e clique                                                */
/* ------------------------------------------------------------------ */

test('tooltip — valores formatados pelo Looker, nunca número cru', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, { campoDoTamanho: 'variacao', campoDaCor: 'exposicao', colorirPor: 'medida' });
    try {
      // Varre a área inteira com o mouse (não depende de como o ponto é
      // desenhado) e junta tudo o que o tooltip mostrou.
      const vistos = new Set();
      const area = r.palco.querySelector('.qd-area');
      for (let y = 0; y < 560; y += 8) {
        for (let x = 0; x < 900; x += 8) {
          area.dispatchEvent(new r.amb.window.MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
          const t = r.tooltip();
          if (t && t.classList.contains('bl-visivel')) vistos.add(t.textContent);
        }
      }
      const textos = Array.from(vistos);
      assert.ok(textos.length >= 6, `${id}: o tooltip só apareceu para ${textos.length} pontos`);
      const tudo = textos.join(' # ');
      assert.doesNotMatch(tudo, /6\.18841|1\.23456|0\.0[0-9]{4,}/, `${id}: número cru no tooltip: ${tudo}`);
      assert.match(tudo, /-6\.19 pp/, `${id}: faltou o texto do Looker para a medida de tamanho`);
      assert.match(tudo, /R\$ \d+/, `${id}: faltou o texto do Looker para a medida de cor`);
      if (id !== 'matriz_bcg') assert.match(tudo, /\d+\.\d\d%/, `${id}: X/Y deveriam vir como o Looker mostra (rendered)`);
    } finally {
      r.fim();
    }
  }
});

test('tooltip — modelo do usuário recebe {{categoria}} e {{valor}}', () => {
  const r = abrir('quadrant_scatter', { modeloDeTooltip: '<b>{{categoria}}</b>|{{valor}}' });
  try {
    const pos = posicaoDoMarcador(r, 0);
    assert.ok(pos, 'marcador 0 não encontrado');
    pos.area.dispatchEvent(new r.amb.window.MouseEvent('pointermove', { bubbles: true, clientX: pos.x, clientY: pos.y }));
    assert.equal(r.tooltip().textContent, 'Ativo de investimento muito comprido 1|2.00%');
  } finally {
    r.fim();
  }
});

test('clique — com links abre o drill; sem links fixa o tooltip; um tooltip só', () => {
  for (const id of GRAFICOS) {
    const r = abrir(id, {});
    try {
      const comLink = posicaoDoMarcador(r, 0) || passarMouseAteAcharPonto(r);
      assert.ok(comLink, `${id}: não achou ponto`);
      const antes = r.amb.chamadasDeApi.drills;
      clicar(r, comLink);
      assert.equal(r.amb.chamadasDeApi.drills, antes + 1, `${id}: clique em célula com links não abriu o drill`);

      r.desenhar({}, { comLinks: false });
      const semLink = posicaoDoMarcador(r, 1) || passarMouseAteAcharPonto(r);
      clicar(r, semLink);
      assert.ok(r.doc.querySelector('.bl-tooltip.bl-fixo'), `${id}: sem links o clique deveria fixar o tooltip`);
      assert.equal(r.amb.chamadasDeApi.drills, antes + 1, `${id}: sem links não pode abrir drill`);

      r.desenhar({ acaoDoClique: 'nenhuma' });
      const outro = posicaoDoMarcador(r, 0) || passarMouseAteAcharPonto(r);
      clicar(r, outro);
      assert.equal(r.amb.chamadasDeApi.drills, antes + 1, `${id}: "nenhuma" não pode abrir drill`);

      for (let i = 0; i < 4; i++) r.desenhar({});
      assert.ok(r.doc.querySelectorAll('.bl-tooltip').length <= 1, `${id}: mais de um tooltip no DOM`);
      r.inst.destroy();
      assert.equal(r.doc.querySelectorAll('.bl-tooltip').length, 0, `${id}: destroy precisa remover o tooltip`);
    } finally {
      r.fim();
    }
  }
});

/* ------------------------------------------------------------------ */
/* Eixos                                                               */
/* ------------------------------------------------------------------ */

test('eixos — casas decimais e rotação do eixo Y valem', () => {
  for (const id of ['quadrant_scatter', 'matriz_2x2', 'risco_retorno']) {
    const r = abrir(id, { formatoDoEixo: 'numero', casasDecimaisDoEixo: 3, rotacaoRotuloEixoY: -45 });
    try {
      const textos = Array.from(r.palco.querySelectorAll('.bl-eixos text')).map((t) => t.textContent);
      assert.ok(textos.some((t) => /^\d+\.\d{3}$/.test(t)), `${id}: casasDecimaisDoEixo 3 ignorado; veio ${textos.join(', ')}`);
      assert.ok(
        Array.from(r.palco.querySelectorAll('.bl-eixos text')).some((t) => /rotate\(-45/.test(t.getAttribute('transform') || '')),
        `${id}: rotação do eixo Y ignorada`
      );
    } finally {
      r.fim();
    }
  }
});
