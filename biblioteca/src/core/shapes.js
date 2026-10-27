/**
 * shapes.js — geradores de caminho (path) e formas.
 *
 * Centraliza: curvas de linha/área, símbolos de ponto, retângulos com
 * cantos arredondados, arcos (medidores, pizza, rosca) e utilitários de
 * geometria usados por vários gráficos.
 */

import { line as d3Line, area as d3Area, arc as d3Arc, stack as d3Stack, stackOffsetNone, stackOffsetExpand, stackOffsetSilhouette, stackOffsetWiggle, stackOrderNone, stackOrderAscending, stackOrderDescending, stackOrderInsideOut, curveLinear, curveMonotoneX, curveMonotoneY, curveBasis, curveCatmullRom, curveStep, curveStepAfter, curveNatural, curveCardinal } from 'd3-shape';

/** Mapa de nomes de curva (opção do painel) para geradores do d3-shape. */
export const CURVAS = {
  linear: curveLinear,
  monotone: curveMonotoneX,
  monotoneY: curveMonotoneY,
  basis: curveBasis,
  catmull: curveCatmullRom.alpha(0.5),
  cardinal: curveCardinal,
  natural: curveNatural,
  step: curveStep,
  stepAfter: curveStepAfter,
};

export function curvaPorNome(nome) {
  return CURVAS[nome] || curveMonotoneX;
}

/** Gerador de linha pronto. */
export function geradorDeLinha({ x, y, curva = 'monotone', definido = null }) {
  const g = d3Line().x(x).y(y).curve(curvaPorNome(curva));
  if (definido) g.defined(definido);
  return g;
}

/** Gerador de área pronto. */
export function geradorDeArea({ x, y0, y1, curva = 'monotone', definido = null }) {
  const g = d3Area().x(x).y0(y0).y1(y1).curve(curvaPorNome(curva));
  if (definido) g.defined(definido);
  return g;
}

/** Gerador de arco (pizza, rosca, medidor). */
export function geradorDeArco({ raioInterno = 0, raioExterno = 100, raioDoCanto = 0, espacoEntreFatias = 0 }) {
  return d3Arc()
    .innerRadius(raioInterno)
    .outerRadius(raioExterno)
    .cornerRadius(raioDoCanto)
    .padAngle(espacoEntreFatias);
}

/** Offsets de empilhamento (ThemeRiver, áreas empilhadas). */
export const DESLOCAMENTOS_DE_PILHA = {
  zero: stackOffsetNone,
  expand: stackOffsetExpand,
  silhouette: stackOffsetSilhouette,
  wiggle: stackOffsetWiggle,
};

/** Ordens de empilhamento. */
export const ORDENS_DE_PILHA = {
  original: stackOrderNone,
  crescente: stackOrderAscending,
  decrescente: stackOrderDescending,
  insideOut: stackOrderInsideOut,
};

/** Cria um empilhador configurado. */
export function criarEmpilhador({ chaves, valor, deslocamento = 'zero', ordem = 'original' }) {
  const s = d3Stack()
    .keys(chaves)
    .offset(DESLOCAMENTOS_DE_PILHA[deslocamento] || stackOffsetNone)
    .order(ORDENS_DE_PILHA[ordem] || stackOrderNone);
  if (valor) s.value(valor);
  return s;
}

/**
 * Caminho de um símbolo (ponto), centrado em (0,0) e com "tamanho" sendo o
 * diâmetro aproximado em px. Devolve string de path SVG — também serve para
 * `Path2D` no canvas.
 */
export function caminhoDoSimbolo(forma, tamanho) {
  const r = Math.max(0.5, tamanho / 2);
  switch (forma) {
    case 'quadrado':
      return `M${-r},${-r}h${r * 2}v${r * 2}h${-r * 2}Z`;
    case 'triangulo': {
      const h = r * 1.6;
      return `M0,${-h}L${r * 1.4},${h * 0.7}L${-r * 1.4},${h * 0.7}Z`;
    }
    case 'losango':
      return `M0,${-r * 1.3}L${r * 1.0},0L0,${r * 1.3}L${-r * 1.0},0Z`;
    case 'cruz': {
      const b = r * 0.42;
      return (
        `M${-b},${-r}h${b * 2}v${r - b}h${r - b}v${b * 2}h${-(r - b)}v${r - b}` +
        `h${-b * 2}v${-(r - b)}h${-(r - b)}v${-b * 2}h${r - b}Z`
      );
    }
    case 'estrela': {
      const pontas = 5;
      const rExterno = r * 1.25;
      const rInterno = r * 0.5;
      let d = '';
      for (let i = 0; i < pontas * 2; i++) {
        const raio = i % 2 === 0 ? rExterno : rInterno;
        const ang = (Math.PI / pontas) * i - Math.PI / 2;
        const x = Math.cos(ang) * raio;
        const y = Math.sin(ang) * raio;
        d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      }
      return `${d}Z`;
    }
    case 'wye':
      return pontosDoWye(r).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('') + 'Z';
    case 'circulo':
    default:
      return `M${-r},0a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
  }
}

/** Contorno do "wye" (Y de três braços), centrado na origem, raio ~r. */
function pontosDoWye(r) {
  const b = r * 0.38; // meia largura do braço
  const pontos = [];
  for (let k = 0; k < 3; k++) {
    const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 3;
    const cx = Math.cos(ang);
    const cy = Math.sin(ang);
    const px = -cy;
    const py = cx;
    const centro = b / Math.sqrt(3);
    // lado "anterior" e "posterior" da ponta do braço, depois o canto
    // interno até o próximo braço (no bissetor, a 2b/√3 do centro)
    pontos.push([cx * r * 1.15 - px * b, cy * r * 1.15 - py * b]);
    pontos.push([cx * r * 1.15 + px * b, cy * r * 1.15 + py * b]);
    const prox = ang + Math.PI / 3;
    pontos.push([Math.cos(prox) * centro * 2, Math.sin(prox) * centro * 2]);
  }
  return pontos;
}

/** Formas aceitas pela opção "Forma do ponto". */
export const FORMAS_DE_MARCADOR = ['circulo', 'quadrado', 'triangulo', 'losango', 'cruz', 'estrela', 'wye'];

/**
 * Normaliza o nome da forma vindo do config (aceita também os nomes do
 * d3-symbol em inglês). Desconhecido = círculo.
 */
export function formaDoMarcador(nome) {
  const mapa = { circle: 'circulo', square: 'quadrado', triangle: 'triangulo', diamond: 'losango', cross: 'cruz', star: 'estrela', y: 'wye' };
  const n = String(nome || '').trim().toLowerCase();
  if (FORMAS_DE_MARCADOR.includes(n)) return n;
  return mapa[n] || 'circulo';
}

/**
 * A função ÚNICA de marcadores (módulo 2.4 das correções). Todo ponto e
 * bolha desenha com ela em vez de `<circle>`: assim a opção "Forma do
 * ponto" muda o desenho em todos os gráficos, na legenda e no tooltip.
 *
 * Sobre tamanho: `diametro` é o tamanho VISUAL (o mesmo número que o
 * gráfico usaria como 2×raio do círculo). Formas pontudas (triângulo,
 * estrela) ocupam menos área com o mesmo diâmetro; não compensamos por
 * área para a forma não mudar de tamanho aparente ao trocar a opção.
 *
 * @returns {SVGPathElement} um <path class="bl-marcador"> com data-forma
 */
export function criarMarcadorSvg(pai, forma, x, y, diametro, atributos = {}) {
  const f = formaDoMarcador(forma);
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', caminhoDoSimbolo(f, Math.max(1, Number(diametro) || 1)));
  el.setAttribute('transform', `translate(${Number(x) || 0},${Number(y) || 0})`);
  el.setAttribute('class', 'bl-marcador');
  el.setAttribute('data-forma', f);
  for (const [k, v] of Object.entries(atributos)) {
    if (v === undefined || v === null) continue;
    if (k === 'classe') el.setAttribute('class', `bl-marcador ${v}`);
    else el.setAttribute(k, String(v));
  }
  if (pai) pai.appendChild(el);
  return el;
}

/** Move um marcador já criado (para animações e arrastes). */
export function moverMarcador(el, x, y) {
  el.setAttribute('transform', `translate(${Number(x) || 0},${Number(y) || 0})`);
}

/** Troca o tamanho de um marcador já criado (animação de entrada). */
export function redimensionarMarcador(el, diametro) {
  el.setAttribute('d', caminhoDoSimbolo(el.getAttribute('data-forma') || 'circulo', Math.max(0.5, diametro)));
}

/** Desenha um símbolo direto num contexto de canvas. */
export function desenharSimboloNoCanvas(ctx, forma, x, y, tamanho) {
  forma = formaDoMarcador(forma);
  const r = Math.max(0.5, tamanho / 2);
  ctx.beginPath();
  switch (forma) {
    case 'quadrado':
      ctx.rect(x - r, y - r, r * 2, r * 2);
      break;
    case 'triangulo':
      ctx.moveTo(x, y - r * 1.6);
      ctx.lineTo(x + r * 1.4, y + r * 1.12);
      ctx.lineTo(x - r * 1.4, y + r * 1.12);
      ctx.closePath();
      break;
    case 'losango':
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * 1.3);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      break;
    case 'cruz': {
      const b = r * 0.42;
      ctx.rect(x - b, y - r, b * 2, r * 2);
      ctx.rect(x - r, y - b, r * 2, b * 2);
      break;
    }
    case 'estrela': {
      const pontas = 5;
      for (let i = 0; i < pontas * 2; i++) {
        const raio = i % 2 === 0 ? r * 1.25 : r * 0.5;
        const ang = (Math.PI / pontas) * i - Math.PI / 2;
        const px = x + Math.cos(ang) * raio;
        const py = y + Math.sin(ang) * raio;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'wye': {
      pontosDoWye(r).forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py)));
      ctx.closePath();
      break;
    }
    case 'circulo':
    default:
      ctx.arc(x, y, r, 0, Math.PI * 2);
      break;
  }
}

/**
 * Caminho de retângulo com cantos arredondados, podendo arredondar só
 * alguns cantos (útil em barras empilhadas).
 */
export function caminhoDeRetangulo(x, y, largura, altura, raio, cantos = {}) {
  const w = Math.max(0, largura);
  const h = Math.max(0, altura);
  const rMax = Math.min(w, h) / 2;
  const r = Math.max(0, Math.min(raio || 0, rMax));
  const { superiorEsquerdo = true, superiorDireito = true, inferiorDireito = true, inferiorEsquerdo = true } = cantos;
  const rSE = superiorEsquerdo ? r : 0;
  const rSD = superiorDireito ? r : 0;
  const rID = inferiorDireito ? r : 0;
  const rIE = inferiorEsquerdo ? r : 0;
  return (
    `M${x + rSE},${y}` +
    `H${x + w - rSD}` +
    (rSD ? `A${rSD},${rSD} 0 0 1 ${x + w},${y + rSD}` : '') +
    `V${y + h - rID}` +
    (rID ? `A${rID},${rID} 0 0 1 ${x + w - rID},${y + h}` : '') +
    `H${x + rIE}` +
    (rIE ? `A${rIE},${rIE} 0 0 1 ${x},${y + h - rIE}` : '') +
    `V${y + rSE}` +
    (rSE ? `A${rSE},${rSE} 0 0 1 ${x + rSE},${y}` : '') +
    'Z'
  );
}

/** Traço tracejado conforme a opção de estilo de linha. */
export function tracejadoPorEstilo(estilo, espessura = 1) {
  if (estilo === 'tracejado') return `${espessura * 4},${espessura * 3}`;
  if (estilo === 'pontilhado') return `${espessura},${espessura * 2}`;
  return null;
}

/** Converte graus para radianos. */
export function grausParaRadianos(graus) {
  return (graus * Math.PI) / 180;
}

/** Ponto na circunferência (útil em medidores e gráficos radiais). */
export function pontoNoCirculo(cx, cy, raio, anguloEmGraus) {
  const a = grausParaRadianos(anguloEmGraus - 90);
  return { x: cx + raio * Math.cos(a), y: cy + raio * Math.sin(a) };
}

/**
 * Caminho de arco simples (sem d3), para medidores: do ângulo A ao B em
 * graus, no sentido horário, com raio fixo.
 */
export function caminhoDeArcoSimples(cx, cy, raio, anguloInicial, anguloFinal) {
  const inicio = pontoNoCirculo(cx, cy, raio, anguloFinal);
  const fim = pontoNoCirculo(cx, cy, raio, anguloInicial);
  const grande = Math.abs(anguloFinal - anguloInicial) <= 180 ? 0 : 1;
  return `M${inicio.x.toFixed(2)},${inicio.y.toFixed(2)} A${raio},${raio} 0 ${grande} 0 ${fim.x.toFixed(2)},${fim.y.toFixed(2)}`;
}

/** Envoltória convexa (para áreas do Venn/agrupamentos). */
export function envoltoriaConvexa(pontos) {
  const pts = pontos
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .slice()
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;

  const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const inferior = [];
  for (const p of pts) {
    while (inferior.length >= 2 && cruz(inferior[inferior.length - 2], inferior[inferior.length - 1], p) <= 0) {
      inferior.pop();
    }
    inferior.push(p);
  }
  const superior = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (superior.length >= 2 && cruz(superior[superior.length - 2], superior[superior.length - 1], p) <= 0) {
      superior.pop();
    }
    superior.push(p);
  }
  inferior.pop();
  superior.pop();
  return inferior.concat(superior);
}

/** Caminho SVG a partir de uma lista de pontos [[x,y], ...]. */
export function caminhoDePontos(pontos, fechar = true) {
  if (!pontos || !pontos.length) return '';
  const d = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');
  return fechar ? `${d}Z` : d;
}
