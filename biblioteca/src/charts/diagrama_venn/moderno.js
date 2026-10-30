/**
 * moderno.js — layout "Moderno" do Diagrama de Venn (melhorias v3, 5.7).
 *
 * O layout anterior continua como "Clássico" (`layoutDoVenn: classico`).
 * Aqui só muda a ESTÉTICA e o hover; os dados (`dados.js`) e as formas
 * (`geometria.js`) são os mesmos. Código próprio (nada copiado).
 *
 *   - O diagrama PREENCHE a área: a escala sai da caixa real das formas
 *     (e não de um quadrado de ±1 em que elas ocupam só o meio), com
 *     margem configurável, e acompanha o tamanho do tile.
 *   - Nomes dos conjuntos: dentro da região exclusiva do conjunto (em
 *     cima do número), fora com linha-guia, ou só na legenda. Opção para
 *     remover um sufixo (ex.: "(Yes / No)") e para apelidos; quebra em até
 *     duas linhas. A legenda fica oculta quando os nomes já estão no
 *     diagrama (opção "Legenda do Venn").
 *   - Números: halo na cor do fundo, valor e percentual em LINHAS
 *     separadas, tamanho automático pelo espaço da região (mínimo e máximo)
 *     ou fixo (usa `tamanhoDoRotulo`, salvo nos tiles). Região pequena
 *     demais: rótulo fora, com linha-guia. Nenhum texto se sobrepõe a outro
 *     nem sai da área (testes de geometria em test/venn_v3.test.mjs).
 *   - Hover e seleção: a região sob o mouse cresce um pouco e ganha
 *     contorno forte, as outras clareiam; tooltip com nome, valor e
 *     percentual. Clique FIXA a seleção (e segue a "Ação do clique": drill
 *     quando houver link). Esc ou clique fora solta. Transições com a
 *     duração e a curva das opções de animação; "Ativar animações"
 *     desligado (ou prefers-reduced-motion) = sem transição.
 *
 * Larguras de texto: função única `medida-texto.js`.
 */

import { criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { formatadorDeValueFormat, formatarPercentual } from '../../core/format.js';
import { lerRotulos, textoDoRotulo } from '../../core/rotulos.js';
import { aplicarContorno } from '../../core/cores.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import { larguraDoTexto } from '../../core/medida-texto.js';
import { layoutDeConjuntos, posicoesDasRegioes, caminhoDaElipse, mascaraDoPonto } from './geometria.js';
import { rotuloDaRegiao } from './dados.js';

export const TAMANHO_MINIMO = 9;
export const TAMANHO_MAXIMO = 28;
const ALTURA_DA_LINHA = 1.18;

const CSS = `
.vm-area{position:relative;width:100%;height:100%;}
.vm-svg{cursor:pointer;display:block;}
.vm-forma{pointer-events:none;}
.vm-claro{opacity:.35;}
.vm-texto{pointer-events:none;paint-order:stroke;stroke-linejoin:round;}
.vm-guia{pointer-events:none;}
.vm-destaque{pointer-events:none;}
`;

const CURVAS_CSS = {
  linear: 'linear',
  saida: 'cubic-bezier(.2,.7,.3,1)',
  entrada: 'cubic-bezier(.6,0,.9,.4)',
  ambos: 'ease-in-out',
  elastica: 'cubic-bezier(.5,1.6,.4,.8)',
  quique: 'cubic-bezier(.3,1.4,.5,1)',
};

/** Caixa (meia-largura/meia-altura) de uma elipse girada. */
function meiaCaixa(e) {
  const t = (e.rotacao * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return { hx: Math.sqrt(e.rx * e.rx * c * c + e.ry * e.ry * s * s), hy: Math.sqrt(e.rx * e.rx * s * s + e.ry * e.ry * c * c) };
}

/**
 * Formas escaladas para PREENCHER o retângulo (x0..x1, y0..y1).
 * @returns {Array} elipses no espaço do SVG
 */
export function layoutQuePreenche(quantidade, { x0, y0, x1, y1 }) {
  const base = layoutDeConjuntos(quantidade, { largura: 2, altura: 2, margem: 0 }).map((e) => ({ ...e, cx: e.cx - 1, cy: e.cy - 1 }));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const e of base) {
    const { hx, hy } = meiaCaixa(e);
    minX = Math.min(minX, e.cx - hx);
    maxX = Math.max(maxX, e.cx + hx);
    minY = Math.min(minY, e.cy - hy);
    maxY = Math.max(maxY, e.cy + hy);
  }
  const escala = Math.max(1, Math.min((x1 - x0) / (maxX - minX), (y1 - y0) / (maxY - minY)));
  const cx = (x0 + x1) / 2 - ((minX + maxX) / 2) * escala;
  const cy = (y0 + y1) / 2 - ((minY + maxY) / 2) * escala;
  return base.map((e) => ({ cx: cx + e.cx * escala, cy: cy + e.cy * escala, rx: e.rx * escala, ry: e.ry * escala, rotacao: e.rotacao }));
}

/** Nome exibido: apelido, ou o nome sem o sufixo configurado. */
export function nomeExibido(nome, config) {
  const apelidos = new Map(
    String(config.apelidosDosConjuntos || '')
      .split(';')
      .map((p) => p.split('='))
      .filter((p) => p.length === 2 && p[0].trim())
      .map(([a, b]) => [a.trim().toLowerCase(), b.trim()])
  );
  const apelido = apelidos.get(String(nome).trim().toLowerCase());
  if (apelido) return apelido;
  const sufixo = String(config.removerDoNome ?? '').trim();
  let t = String(nome);
  if (sufixo && t.toLowerCase().endsWith(sufixo.toLowerCase())) t = t.slice(0, t.length - sufixo.length).trim();
  return t || String(nome);
}

/** Quebra um texto em até `max` linhas que caibam em `largura`. */
function quebrar(texto, largura, tamanho, max = 2, negrito = false) {
  const palavras = String(texto).split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraDoTexto(tentativa, tamanho, { negrito }) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  if (linhas.length <= max) return linhas;
  const cortadas = linhas.slice(0, max);
  cortadas[max - 1] = `${cortadas[max - 1]}…`;
  return cortadas;
}

/** Caixa de um bloco de linhas centrado em (x, y). */
function caixaDoBloco(x, y, linhas, tamanho, ancora = 'middle') {
  const w = Math.max(0, ...linhas.map((l) => larguraDoTexto(l.texto, l.tamanho || tamanho, { negrito: !!l.negrito })));
  const h = linhas.reduce((a, l) => a + (l.tamanho || tamanho) * ALTURA_DA_LINHA, 0);
  const x0 = ancora === 'middle' ? x - w / 2 : ancora === 'end' ? x - w : x;
  return { x0, x1: x0 + w, y0: y - h / 2, y1: y + h / 2 };
}
const cruzam = (a, b, folga = 1) => a.x0 < b.x1 + folga && a.x1 + folga > b.x0 && a.y0 < b.y1 + folga && a.y1 + folga > b.y0;

/**
 * Desenha o layout moderno.
 * @param {object} ctx contexto do define-viz
 * @param {object} d dados e auxiliares já resolvidos pelo index.js
 */
export function desenharModerno(ctx, d) {
  const { modelo, config, tema, raiz, largura, altura } = ctx;
  const { conjuntos, regioes, totalPorConjunto, unidade, medida, linhasPorRegiao, aux } = d;

  ctx.limparRaiz();
  injetarEstilo(raiz, CSS, 'vm');

  const ondeFicamOsNomes = ['dentro', 'fora', 'legenda'].includes(config.nomesDosConjuntos) ? config.nomesDosConjuntos : 'dentro';
  const legenda = config.legendaDoVenn === 'mostrar' || (config.legendaDoVenn !== 'ocultar' && ondeFicamOsNomes === 'legenda');
  const { areaGrafico, areaLegenda } = criarLayoutComLegenda(raiz, { ...config, mostrarLegenda: legenda });
  const W = Math.max(80, areaGrafico.clientWidth || largura);
  const H = Math.max(80, areaGrafico.clientHeight || altura);

  const totais = conjuntos.map((_, i) => totalPorConjunto.get(i) || 0);
  const cores = aux.resolverCores(conjuntos, totais, config, tema);
  const opacidade = aux.opacidadeDoVenn(config);
  const totalGeral = Array.from(regioes.values()).reduce((a, b) => a + b, 0);
  const formatarValor = formatadorDeValueFormat(medida ? medida.valueFormat : undefined, { casas: medida ? 2 : 0 });
  const rot = lerRotulos(config, tema);
  const tamanhoFixo = config.tamanhoDoTextoDoVenn === 'fixo';
  const comPercentual = config.mostrarPercentual === true || /percentual/i.test(rot.conteudo);
  const margem = Math.max(0, Number.isFinite(Number(config.margemDoVenn)) ? Number(config.margemDoVenn) : 12);
  // "Mostrar o total de cada conjunto no nome" (valor salvo) continua valendo.
  const nomeDe = (i) =>
    config.mostrarTotalDoConjunto !== false
      ? `${nomeExibido(conjuntos[i].nome, config)} (${formatarValor(totalPorConjunto.get(i) || 0)})`
      : nomeExibido(conjuntos[i].nome, config);

  function textoDoLooker(mascara) {
    const linhas = linhasPorRegiao.get(mascara);
    if (medida && linhas && linhas.length === 1) {
      const t = modelo.texto(linhas[0], medida.nome, undefined, '');
      if (t !== '') return t;
    }
    return null;
  }
  const textoDoValor = (mascara) => {
    const l = textoDoLooker(mascara);
    return l !== null ? l : formatarValor(regioes.get(mascara) || 0);
  };
  const textoDoNumero = (mascara) =>
    textoDoRotulo({ ...rot, conteudo: rot.conteudo === 'nome' ? 'valor' : rot.conteudo.replace(/Percentual$/, '') || 'valor' }, {
      valor: regioes.get(mascara) || 0,
      nome: rotuloDaRegiao(mascara, conjuntos),
      total: totalGeral,
      valueFormat: medida ? medida.valueFormat : undefined,
      textoDoValor: textoDoLooker(mascara) ?? undefined,
    }) || textoDoValor(mascara);
  const textoDoPct = (mascara) => (totalGeral ? formatarPercentual((regioes.get(mascara) || 0) / totalGeral, rot.casas) : '');

  /**
   * Plano de textos para um conjunto de formas: tenta colocar cada região
   * dentro; o que não couber vai para fora (com linha-guia). Devolve os
   * blocos e quanto espaço lateral os de fora pediram.
   */
  function planejar(elipses) {
    const posicoes = posicoesDasRegioes(elipses, { largura: W, altura: H, passos: 140 });
    const blocos = [];
    const fora = [];
    const ordem = Array.from(regioes.keys()).sort((a, b) => (regioes.get(b) || 0) - (regioes.get(a) || 0));
    for (const mascara of ordem) {
      const p = posicoes.get(mascara);
      const unico = conjuntos.findIndex((_, i) => mascara === 1 << i);
      const linhasBase = [];
      if (rot.mostrar) {
        linhasBase.push({ texto: textoDoNumero(mascara), negrito: true });
        if (comPercentual) linhasBase.push({ texto: textoDoPct(mascara), fator: 0.72 });
      }
      const comNome = rot.mostrar && ondeFicamOsNomes === 'dentro' && unico >= 0;
      if (!linhasBase.length && !comNome) continue;
      const espaco = p ? { w: p.folgaX * 2 * 0.92, h: p.folgaY * 2 * 0.92 } : { w: 0, h: 0 };
      let colocado = null;
      const maximo = tamanhoFixo ? rot.tamanho : TAMANHO_MAXIMO;
      const minimo = tamanhoFixo ? rot.tamanho : TAMANHO_MINIMO;
      for (let t = maximo; t >= minimo && p; t -= 1) {
        const linhas = [];
        if (comNome) {
          for (const l of quebrar(nomeDe(unico), espaco.w, Math.max(minimo, t * 0.62), 2, true)) {
            linhas.push({ texto: l, tamanho: Math.max(minimo, Math.round(t * 0.62)), negrito: true, nome: true, cor: cores[unico] });
          }
        }
        for (const l of linhasBase) linhas.push({ ...l, tamanho: Math.max(minimo, Math.round(t * (l.fator || 1))) });
        const caixa = caixaDoBloco(p.x, p.y, linhas, t);
        if (caixa.x1 - caixa.x0 <= espaco.w && caixa.y1 - caixa.y0 <= espaco.h) {
          colocado = { mascara, x: p.x, y: p.y, linhas, caixa, tamanho: t };
          break;
        }
      }
      if (colocado) blocos.push(colocado);
      else if (p) fora.push({ mascara, p, linhasBase, unico, comNome });
    }
    return { blocos, fora, posicoes };
  }

  // 1ª passada: sem reserva lateral. 2ª: reserva espaço para o que ficou fora.
  const tamanhoDeFora = Math.max(TAMANHO_MINIMO, tamanhoFixo ? rot.tamanho : 11);
  const nomesFora = rot.mostrar && ondeFicamOsNomes === 'fora' ? conjuntos.map((_, i) => nomeDe(i)) : [];
  let elipses = layoutQuePreenche(conjuntos.length, { x0: margem, y0: margem, x1: W - margem, y1: H - margem });
  let plano = planejar(elipses);
  if (plano.fora.length || nomesFora.length) {
    // Reserva SÓ o lado que precisa, só o necessário (no máximo 24% cada).
    const meio = elipses.reduce((a, e) => a + e.cx, 0) / elipses.length;
    const ladoDe = (x) => (x < meio ? 'esq' : 'dir');
    const pedido = { esq: 0, dir: 0 };
    const larguraDoItem = (f) =>
      Math.max(...[...f.linhasBase, ...(f.comNome ? [{ texto: nomeDe(f.unico) }] : [])].map((l) => larguraDoTexto(l.texto, tamanhoDeFora, { negrito: true })));
    for (const f of plano.fora) pedido[ladoDe(f.p.x)] = Math.max(pedido[ladoDe(f.p.x)], larguraDoItem(f));
    if (nomesFora.length) {
      elipses.forEach((e, i) => {
        pedido[ladoDe(e.cx)] = Math.max(pedido[ladoDe(e.cx)], Math.min(larguraDoTexto(nomesFora[i], tamanhoDeFora, { negrito: true }), W * 0.22));
      });
    }
    const reservaEsq = pedido.esq ? Math.min(W * 0.24, pedido.esq + 20) : 0;
    const reservaDir = pedido.dir ? Math.min(W * 0.24, pedido.dir + 20) : 0;
    elipses = layoutQuePreenche(conjuntos.length, { x0: margem + reservaEsq, y0: margem + 8, x1: W - margem - reservaDir, y1: H - margem - 8 });
    plano = planejar(elipses);
  }

  const svg = criarSvgEl('svg', {
    pai: areaGrafico,
    classe: 'vm-svg venn-svg',
    atributos: { width: W, height: H, viewBox: `0 0 ${W} ${H}` },
  });
  criarSvgEl('rect', { pai: svg, atributos: { x: 0, y: 0, width: W, height: H, fill: 'transparent' } });

  // Transições (opções de animação existentes).
  const reduzir = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animar = config.animacaoAtiva !== false && !reduzir;
  const duracao = Math.max(0, Math.min(1500, Number(config.duracaoDaTransicaoDoVenn) || 180));
  const curva = CURVAS_CSS[config.suavizacaoDaAnimacao] || CURVAS_CSS.saida;
  const transicao = animar ? `opacity ${duracao}ms ${curva}, transform ${duracao}ms ${curva}, stroke-width ${duracao}ms ${curva}` : 'none';

  const formas = elipses.map((e, i) => {
    const f = criarSvgEl('path', {
      pai: svg,
      classe: 'vm-forma venn-forma',
      atributos: { d: caminhoDaElipse(e), transform: aux.transformacao(e), fill: cores[i], 'fill-opacity': opacidade, 'data-conjunto': i },
    });
    aplicarContorno(f, aux.contornoDoConjunto(config, tema, cores[i]));
    f.style.transition = transicao;
    return f;
  });

  const uid = `vm${Math.random().toString(36).slice(2, 8)}`;
  const defs = criarSvgEl('defs', { pai: svg });
  elipses.forEach((e, i) => {
    const c = criarSvgEl('clipPath', { pai: defs, atributos: { id: `${uid}-c${i}` } });
    criarSvgEl('path', { pai: c, atributos: { d: caminhoDaElipse(e), transform: aux.transformacao(e) } });
  });
  const camadaDoDestaque = criarSvgEl('g', { pai: svg, classe: 'vm-destaque' });
  const camadaDosTextos = criarSvgEl('g', { pai: svg });

  const halo = tema.fundo || '#FFFFFF';
  const textosPorRegiao = new Map();
  const ocupadas = [];

  function desenharBloco(b, ancora = 'middle') {
    const g = criarSvgEl('g', { pai: camadaDosTextos, atributos: { 'data-mascara': b.mascara } });
    const el = criarSvgEl('text', {
      pai: g,
      classe: 'vm-texto venn-valor bl-rotulo',
      atributos: {
        x: b.x,
        y: b.y,
        'text-anchor': ancora,
        'font-family': tema.fonte,
        stroke: halo,
        'stroke-width': 3,
        'data-mascara': b.mascara,
      },
    });
    const total = b.linhas.reduce((a, l) => a + (l.tamanho || b.tamanho) * ALTURA_DA_LINHA, 0);
    let yAtual = b.y - total / 2;
    for (const l of b.linhas) {
      const t = l.tamanho || b.tamanho;
      const span = criarSvgEl('tspan', {
        pai: el,
        atributos: {
          x: b.x,
          y: yAtual + (t * ALTURA_DA_LINHA) / 2,
          'dominant-baseline': 'central',
          'font-size': t,
          'font-weight': l.negrito ? 700 : 400,
          fill: l.cor || rot.cor || aux.corDoTextoDaRegiao(b.mascara, cores, opacidade, tema),
        },
      });
      definirTexto(span, l.texto);
      yAtual += t * ALTURA_DA_LINHA;
    }
    el.style.transition = transicao;
    textosPorRegiao.set(b.mascara, g);
    ocupadas.push(b.caixa);
    return g;
  }

  // Anti-colisão entre vizinhos (dentro): a maior região fica; a outra encolhe ou sai.
  const dentro = [];
  for (const b of plano.blocos) {
    if (dentro.some((o) => cruzam(o.caixa, b.caixa, 2))) plano.fora.push({ mascara: b.mascara, p: { x: b.x, y: b.y }, linhasBase: b.linhas.filter((l) => !l.nome), unico: conjuntos.findIndex((_, i) => b.mascara === 1 << i), comNome: b.linhas.some((l) => l.nome) });
    else dentro.push(b);
  }
  for (const b of dentro) desenharBloco(b);

  // Fora, com linha-guia: à esquerda ou à direita do diagrama, empilhados.
  const centroX = (elipses.reduce((a, e) => a + e.cx, 0) / elipses.length) || W / 2;
  const limiteEsq = Math.min(...elipses.map((e) => e.cx - meiaCaixa(e).hx));
  const limiteDir = Math.max(...elipses.map((e) => e.cx + meiaCaixa(e).hx));
  const pilhas = { esquerda: [], direita: [] };
  const colocarFora = (mascara, ponto, linhas, cor) => {
    const lado = ponto.x < centroX ? 'esquerda' : 'direita';
    const x = lado === 'esquerda' ? Math.max(4, limiteEsq - 10) : Math.min(W - 4, limiteDir + 10);
    const ancora = lado === 'esquerda' ? 'end' : 'start';
    let y = Math.max(8, Math.min(H - 8, ponto.y));
    let caixa = caixaDoBloco(x, y, linhas, tamanhoDeFora, ancora);
    // desce até não cruzar ninguém; se sair por baixo, tenta subindo
    let tentativas = 0;
    while ((ocupadas.some((o) => cruzam(o, caixa, 2)) || caixa.y1 > H) && tentativas < 200) {
      y += caixa.y1 > H ? -(H) : 4;
      if (y > H) y = 8;
      caixa = caixaDoBloco(x, y, linhas, tamanhoDeFora, ancora);
      tentativas += 1;
    }
    if (tentativas >= 200 || caixa.x0 < 0 || caixa.x1 > W || caixa.y0 < 0 || caixa.y1 > H) return null;
    const g = desenharBloco({ mascara, x, y, linhas: linhas.map((l) => ({ ...l, tamanho: tamanhoDeFora, cor: cor || l.cor })), caixa, tamanho: tamanhoDeFora }, ancora);
    criarSvgEl('line', {
      pai: g,
      classe: 'vm-guia',
      atributos: { x1: ponto.x, y1: ponto.y, x2: lado === 'esquerda' ? caixa.x1 + 2 : caixa.x0 - 2, y2: y, stroke: tema.textoSuave || '#94A3B8', 'stroke-width': 1 },
    });
    pilhas[lado].push(g);
    return g;
  };
  for (const f of plano.fora) {
    const linhas = [];
    if (f.comNome) linhas.push({ texto: nomeDe(f.unico), negrito: true, cor: cores[f.unico], nome: true });
    for (const l of f.linhasBase) linhas.push({ texto: l.texto, negrito: !!l.negrito });
    if (linhas.length) colocarFora(f.mascara, f.p, linhas);
  }
  if (rot.mostrar && ondeFicamOsNomes === 'fora') {
    conjuntos.forEach((_, i) => {
      const e = elipses[i];
      const dx = e.cx - centroX;
      const ponto = { x: e.cx + Math.sign(dx || (i % 2 ? 1 : -1)) * meiaCaixa(e).hx * 0.7, y: e.cy - meiaCaixa(e).hy * 0.6 };
      colocarFora(1 << (i + 8), ponto, [{ texto: nomeDe(i), negrito: true, cor: cores[i] }], cores[i]);
    });
  }

  // Legenda (só quando pedida).
  if (legenda) {
    desenharLegenda({
      hospedeiro: areaLegenda,
      tema,
      config,
      itens: conjuntos.map((c, i) => ({ chave: c.nome, rotulo: nomeDe(i), cor: cores[i] })),
      eventos: ctx.eventos,
    });
  }

  // --- Hover e seleção ---
  const tooltip = ctx.tooltip();
  const mascaras = new Map();
  let ativa = 0;
  const estado = ctx.estado;
  if (estado.regiaoFixaDoVenn && !regioes.has(estado.regiaoFixaDoVenn)) estado.regiaoFixaDoVenn = 0;

  function mascaraDeExclusao(mascara) {
    const fora = elipses.map((_, i) => i).filter((i) => !(mascara & (1 << i)));
    if (!fora.length) return null;
    if (!mascaras.has(mascara)) {
      const id = `${uid}-m${mascara}`;
      const m = criarSvgEl('mask', { pai: defs, atributos: { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H } });
      criarSvgEl('rect', { pai: m, atributos: { x: 0, y: 0, width: W, height: H, fill: '#FFFFFF' } });
      for (const i of fora) criarSvgEl('path', { pai: m, atributos: { d: caminhoDaElipse(elipses[i]), transform: aux.transformacao(elipses[i]), fill: '#000000' } });
      mascaras.set(mascara, id);
    }
    return mascaras.get(mascara);
  }

  function destacar(mascara) {
    if (config.destacarAoPassarMouse === false && !estado.regiaoFixaDoVenn) mascara = 0;
    if (mascara === ativa) return;
    ativa = mascara;
    while (camadaDoDestaque.firstChild) camadaDoDestaque.removeChild(camadaDoDestaque.firstChild);
    formas.forEach((f, i) => f.classList.toggle('vm-claro', mascara !== 0 && !(mascara & (1 << i))));
    for (const [m, g] of textosPorRegiao) g.classList.toggle('vm-claro', mascara !== 0 && m !== mascara && m < 256);
    if (!mascara) return;
    const p = plano.posicoes.get(mascara) || { x: W / 2, y: H / 2 };
    // A região cresce 4% em torno do seu ponto central e ganha contorno forte.
    const grupo = criarSvgEl('g', {
      pai: camadaDoDestaque,
      atributos: { 'data-mascara': mascara, transform: `translate(${p.x} ${p.y}) scale(1.04) translate(${-p.x} ${-p.y})` },
    });
    let pai = grupo;
    elipses.forEach((_, i) => {
      if (mascara & (1 << i)) pai = criarSvgEl('g', { pai, atributos: { 'clip-path': `url(#${uid}-c${i})` } });
    });
    const exclusao = mascaraDeExclusao(mascara);
    criarSvgEl('rect', {
      pai,
      atributos: {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: aux.corDaRegiao(mascara, cores),
        'fill-opacity': Math.min(1, opacidade + 0.4),
        stroke: tema.texto,
        'stroke-width': 2.5,
        mask: exclusao ? `url(#${exclusao})` : null,
      },
    });
    grupo.style.transition = transicao;
  }

  function conteudo(mascara) {
    const rotulo = rotuloDaRegiao(mascara, conjuntos.map((c) => ({ ...c, nome: nomeExibido(c.nome, config) })));
    const texto = textoDoValor(mascara);
    const pct = textoDoPct(mascara);
    const linhas = [{ rotulo: unidade || 'Valor', valor: texto, cor: aux.corDaRegiao(mascara, cores) }];
    if (pct) linhas.push({ rotulo: 'Do total', valor: pct });
    return { titulo: rotulo, linhas, variaveis: { categoria: rotulo, valor: texto, serie: rotulo, percentual: pct } };
  }

  function celula(mascara) {
    const linhas = linhasPorRegiao.get(mascara);
    if (!linhas || linhas.length !== 1) return null;
    const candidatas = [];
    if (medida) candidatas.push(modelo.celula(linhas[0], medida.nome));
    if (modelo.dimensoes[0]) candidatas.push(modelo.celula(linhas[0], modelo.dimensoes[0].nome));
    return candidatas.find((c) => c && Array.isArray(c.links) && c.links.length) || candidatas[0] || null;
  }

  function regiaoNoPonto(ev) {
    const caixa = typeof svg.getBoundingClientRect === 'function' ? svg.getBoundingClientRect() : null;
    const ex = caixa && caixa.width ? W / caixa.width : 1;
    const ey = caixa && caixa.height ? H / caixa.height : 1;
    return mascaraDoPonto((ev.clientX - (caixa ? caixa.left : 0)) * ex, (ev.clientY - (caixa ? caixa.top : 0)) * ey, elipses);
  }

  const soltar = () => {
    estado.regiaoFixaDoVenn = 0;
    destacar(0);
  };
  ctx.eventos.on(svg, 'pointermove', (ev) => {
    const m = regiaoNoPonto(ev);
    if (!estado.regiaoFixaDoVenn) destacar(m);
    if (!tooltip) return;
    if (!m) tooltip.esconder();
    else tooltip.mostrar(conteudo(m), ev.clientX, ev.clientY);
  });
  ctx.eventos.on(svg, 'pointerleave', () => {
    if (!estado.regiaoFixaDoVenn) destacar(0);
    if (tooltip) tooltip.esconder();
  });
  ctx.eventos.on(svg, 'click', (ev) => {
    const m = regiaoNoPonto(ev);
    if (!m) {
      soltar(); // clique fora das formas solta a seleção
      return;
    }
    // Clique fixa a seleção; "Ação do clique" decide o drill/tooltip.
    estado.regiaoFixaDoVenn = m;
    ativa = -1;
    destacar(m);
    ctx.cliqueNoItem(ev, celula(m), conteudo(m));
  });
  ctx.eventos.on(document, 'keydown', (ev) => {
    if (ev.key === 'Escape') soltar();
  });
  ctx.eventos.on(document, 'pointerdown', (ev) => {
    if (estado.regiaoFixaDoVenn && ev.target && !svg.contains(ev.target)) soltar();
  });
  if (estado.regiaoFixaDoVenn) destacar(estado.regiaoFixaDoVenn);

  return { svg, elipses, W, H };
}

