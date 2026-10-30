/**
 * Pacote "Café" (melhorias v3, 5.14c–5.14h) — OPCIONAL.
 *
 * Tudo genérico: nenhum nome, logotipo, cor de marca, slogan ou nome de
 * nível de franquia de qualquer empresa. Ícones desenhados do zero para
 * esta biblioteca (grade 24×24; variante contorno e preenchida), formas de
 * marcador, paletas e a exibição "Progresso em xícara". Todos os ids
 * começam com `cafe_`. A "paleta da marca" é a paleta PERSONALIZADA que o
 * usuário digita (não há cor de marca aqui).
 *
 * Desligar: "Pacote temático" = Nenhum (as listas do painel deixam de
 * mostrar estes itens; um valor já salvo continua sendo desenhado), ou
 * build com BL_SEM_PACOTES=1, ou apagar esta pasta.
 */

import { registrarPacote } from '../../core/pacotes.js';
import { criarSvgEl } from '../../core/dom.js';

/* ---------------- Ícones (contorno, preenchido) ---------------- */
const ICONES = {
  cafe_xicara: ['Xícara', 'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M7 3.5v3M10 3.5v3M13 3.5v3M3 21h15', 'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h1.5a3 3 0 0 1 0 6H16v-1.5h1.5a1.5 1.5 0 0 0 0-3H16zM3 20h15v1.5H3z'],
  cafe_copo: ['Copo de viagem', 'M7 6h10l-1.3 14.5H8.3zM6 6h12M8.5 2.5h7L16 6H8zM7.6 11h8.8', 'M6 5.2h12V7H6zM8.4 2.2h7.2L16.4 5H7.6zM7.1 7.6h9.8l-1.2 13H8.3z'],
  cafe_grao: ['Grão', 'M12 3c4.4 0 7 4 7 9s-2.6 9-7 9-7-4-7-9 2.6-9 7-9zM12.5 3.2c-2.2 3-2.2 6 0 8.8s2.2 5.8 0 8.8', 'M12 3c4.4 0 7 4 7 9s-2.6 9-7 9-7-4-7-9 2.6-9 7-9z'],
  cafe_prensa: ['Prensa francesa', 'M7 7h9v13H7zM5.5 20.5h12M11.5 2.5v9M9 2.5h5M7 11.5h9M16 9.5h2.5v8H16', 'M7 7h9v13H7zM5.5 19.8h12v1.5h-12zM10.8 2h1.4v5h-1.4zM16 9h3v9h-3v-1.5h1.5v-6H16z'],
  cafe_moedor: ['Moedor', 'M6 10h12l-1.2 11H7.2zM8 10V7h8v3M12 7V4.5M12 4.5h4.5M10 15h4', 'M6 10h12l-1.2 11H7.2zM8 6.5h8V10H8zM11.3 4h1.4v2.5h-1.4zM11.3 3.8h5.4v1.4h-5.4z'],
  cafe_espresso: ['Máquina de espresso', 'M5 3h14v6H5zM7 9v4h10V9M9.5 13v2M14.5 13v2M8.5 17h7v4h-7zM4 21h16M8 6h3', 'M5 3h14v6H5zM7 9h10v4H7zM8.5 16.5h7V21h-7zM4 20.2h16v1.5H4z'],
  cafe_croissant: ['Croissant', 'M3 14c2-5.5 6.5-8.5 9-8.5s7 3 9 8.5c-1.8 1.8-3.8 2-5.6 1L12 11l-3.4 4c-1.8 1-3.8.8-5.6-1zM12 5.5V11M7.5 8l1.5 5M16.5 8L15 13', 'M3 14c2-5.5 6.5-8.5 9-8.5s7 3 9 8.5c-1.8 1.8-3.8 2-5.6 1L12 11l-3.4 4c-1.8 1-3.8.8-5.6-1z'],
  cafe_bolo: ['Bolo', 'M4 12h16v8H4zM4 15c2 1.2 4-1 6 0s4 1.2 6 0 3-1 4 0M12 4.5v4M10.5 6.5h3M8 12V9.5h8V12', 'M4 12h16v8H4zM8 9h8v3H8zM11.3 4h1.4v5h-1.4z'],
  cafe_loja: ['Loja', 'M3.5 9L5.5 4h13l2 5M3.5 9h17M5 9v11h14V9M10 20v-5.5h4V20M3.5 9a2.1 2.1 0 0 0 4.2 0 2.1 2.1 0 0 0 4.3 0 2.1 2.1 0 0 0 4.2 0 2.1 2.1 0 0 0 4.3 0', 'M5.5 4h13l2 5h-17zM5 10.5h14V20h-5v-5.5h-4V20H5z'],
  cafe_quiosque: ['Quiosque', 'M4 10h16M6 10v10M18 10v10M4 20h16M4 10l2-6h12l2 6M9 14h6v6H9z', 'M6 4h12l2 6H4zM6 11h12v9H6z'],
  cafe_caminhao: ['Caminhão de entrega', 'M2.5 6h11v10h-11zM13.5 9h4l3 3v4h-7M6 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M2.5 6h11v10h-11zM13.5 9h4l3 3v4h-7zM6 20a2.3 2.3 0 1 0 0-4.6A2.3 2.3 0 0 0 6 20zM17 20a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z'],
  cafe_cupom: ['Cupom', 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM9 7v10M13 10.5h.01M17 13.5h.01M17.5 10l-5 4', 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z'],
  cafe_fidelidade: ['Estrela de fidelidade', 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM12 6.5l1.7 3.5 3.8.6-2.7 2.6.6 3.8L12 15.2 8.6 17l.6-3.8-2.7-2.6 3.8-.6z', 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19z'],
  cafe_coroa: ['Coroa', 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 21h14', 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 20.2h14v1.5H5z'],
  cafe_cartao: ['Cartão', 'M3 6h18v12H3zM3 10h18M6 14.5h4', 'M3 6h18v3.2H3zM3 10.8h18V18H3z'],
};

/* ---------------- Formas de marcador (centradas em 0,0) ---------------- */
const FORMAS = {
  cafe_xicara: {
    rotulo: 'Xícara',
    caminho: (t) => {
      const r = Math.max(0.5, t / 2);
      const f = (v) => (v * r).toFixed(2);
      return `M${f(-0.85)},${f(-0.55)}h${f(1.35)}v${f(0.6)}a${f(0.675)},${f(0.6)} 0 0 1 ${f(-1.35)},0z` +
        `M${f(0.5)},${f(-0.4)}h${f(0.25)}a${f(0.3)},${f(0.3)} 0 0 1 0,${f(0.6)}h${f(-0.25)}z`;
    },
  },
  cafe_grao: {
    rotulo: 'Grão',
    caminho: (t) => {
      const r = Math.max(0.5, t / 2);
      return `M${(-0.72 * r).toFixed(2)},0a${(0.72 * r).toFixed(2)},${r.toFixed(2)} 0 1,0 ${(1.44 * r).toFixed(2)},0a${(0.72 * r).toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-1.44 * r).toFixed(2)},0z`;
    },
  },
  cafe_copo: {
    rotulo: 'Copo',
    caminho: (t) => {
      const r = Math.max(0.5, t / 2);
      const f = (v) => (v * r).toFixed(2);
      return `M${f(-0.65)},${f(-1)}h${f(1.3)}l${f(-0.22)},${f(2)}h${f(-0.86)}z`;
    },
  },
};

/* ---------------- Paletas ---------------- */
const PALETAS = {
  cafe_espresso: { rotulo: 'Café · Espresso', cores: ['#3B2416', '#6F4E37', '#A0522D', '#C8A27A', '#E6CCB2', '#7F5539', '#B08968', '#DDB892', '#4A3728'] },
  cafe_latte: { rotulo: 'Café · Latte', cores: ['#C8A27A', '#E3C9A8', '#8B5E3C', '#F2E6D8', '#A47551', '#D6B48C', '#6B4F3A', '#BFA58A'] },
  cafe_caramelo: { rotulo: 'Café · Caramelo', cores: ['#AF6E4D', '#D4A373', '#E9C46A', '#F4A261', '#8D5524', '#C68B59', '#FFD8A9', '#7B3F00'] },
  cafe_crema: { rotulo: 'Café · Crema', cores: ['#FFF1D6', '#F3D9B1', '#E8C39E', '#D9A86C', '#C08552', '#A0673D', '#7A4E2D', '#5C3A21'] },
  cafe_mocha: { rotulo: 'Café · Mocha', cores: ['#4B3832', '#854442', '#BE9B7B', '#FFF4E6', '#3C2F2F', '#A47148', '#D4A574', '#6E4C3A'] },
};
const ESCALAS = {
  cafe_torra: { rotulo: 'Café · Torra (clara → escura)', cores: ['#F5E6D3', '#D9B48F', '#A9744F', '#6F4E37', '#3B2416'], tipo: 'sequencial' },
  cafe_torra_divergente: { rotulo: 'Café · Torra divergente', cores: ['#3B2416', '#A9744F', '#F5F0E8', '#7FA7A0', '#2F5D57'], tipo: 'divergente' },
};

/* ---------------- Progresso em xícara (5.14g) ---------------- */
let contador = 0;
/**
 * Xícara que enche conforme a fração (0 a 1). O líquido cresce de baixo
 * para cima (transform scaleY), com transição quando `animar`.
 */
function desenharXicara(pai, fracao, { lado = 40, cor = '#6F4E37', contornoCor = 'currentColor', animar = false, duracao = 600, curva = 'ease-out', agendarQuadro = null } = {}) {
  const id = `cafe-xic-${(contador += 1)}`;
  const svg = criarSvgEl('svg', {
    pai,
    classe: 'cafe-xicara',
    atributos: { width: lado, height: lado, viewBox: '0 0 24 24', 'data-fracao': fracao.toFixed(3), role: 'img', 'aria-label': `${Math.round(fracao * 100)}%` },
  });
  const defs = criarSvgEl('defs', { pai: svg });
  const clip = criarSvgEl('clipPath', { pai: defs, atributos: { id } });
  criarSvgEl('path', { pai: clip, atributos: { d: 'M4.6 9.6h10.8v4.4a4.4 4.4 0 0 1-4.4 4.4H9a4.4 4.4 0 0 1-4.4-4.4z' } });
  const g = criarSvgEl('g', { pai: svg, atributos: { 'clip-path': `url(#${id})` } });
  const liquido = criarSvgEl('rect', { pai: g, classe: 'cafe-liquido', atributos: { x: 4, y: 9.6, width: 12, height: 8.8, fill: cor } });
  liquido.style.transformBox = 'fill-box';
  liquido.style.transformOrigin = '50% 100%';
  const final = `scaleY(${fracao})`;
  if (animar && agendarQuadro) {
    liquido.style.transform = 'scaleY(0)';
    liquido.style.transition = `transform ${duracao}ms ${curva}`;
    agendarQuadro(() => {
      liquido.style.transform = final;
    });
  } else liquido.style.transform = final;
  criarSvgEl('path', {
    pai: svg,
    atributos: { d: ICONES.cafe_xicara[1], fill: 'none', stroke: contornoCor, 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
  });
  return svg;
}

registrarPacote({
  id: 'cafe',
  nome: 'Café',
  icones: Object.fromEntries(Object.entries(ICONES).map(([k, [rotulo, contorno, preenchido]]) => [k, { rotulo: `Café · ${rotulo}`, contorno, preenchido }])),
  formas: FORMAS,
  paletas: PALETAS,
  escalas: ESCALAS,
  progressos: { cafe_xicara: { rotulo: 'Progresso em xícara', desenhar: desenharXicara } },
});
