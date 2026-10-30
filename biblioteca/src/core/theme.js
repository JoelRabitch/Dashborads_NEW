/**
 * theme.js — tokens de tema e paletas, num lugar só.
 *
 * Trocar um valor aqui muda todos os gráficos da biblioteca (regra 5 da
 * seção 5 do PROMPT_AGENTE.md). Os gráficos nunca escrevem cor "na mão":
 * pedem um token ao tema resolvido.
 *
 * Fontes: sempre do sistema (nada de Google Fonts — regra da seção 7).
 */

import { interpolateRgb } from 'd3-interpolate';
import {
  schemeTableau10,
  schemeCategory10,
  schemeSet2,
  schemeDark2,
  schemePaired,
  schemeObservable10,
  interpolateBlues,
  interpolateViridis,
  interpolateCividis,
  interpolateTurbo,
  interpolateRdYlGn,
  interpolateRdBu,
  interpolateBrBG,
  interpolatePuOr,
  interpolateOranges,
  interpolateGreens,
} from 'd3-scale-chromatic';

export const FAMILIAS_DE_FONTE = {
  sistema:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  monoespacada:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  serifada: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
};

/**
 * Paletas categóricas. As marcadas com `daltonismoSeguro` foram escolhidas
 * por terem boa separação para as formas mais comuns de daltonismo.
 */
export const PALETAS_CATEGORICAS = {
  looker: {
    rotulo: 'Looker (padrão)',
    cores: ['#4276BE', '#6FD09A', '#EB7B5C', '#9174CB', '#F4C95D', '#5CB6D9', '#D96C8E', '#8DBE66'],
  },
  tableau10: { rotulo: 'Tableau 10', cores: [...schemeTableau10] },
  observable10: { rotulo: 'Observable 10', cores: [...schemeObservable10] },
  categoria10: { rotulo: 'Categoria 10', cores: [...schemeCategory10] },
  set2: { rotulo: 'Suave (Set2)', cores: [...schemeSet2], daltonismoSeguro: true },
  dark2: { rotulo: 'Escura (Dark2)', cores: [...schemeDark2], daltonismoSeguro: true },
  paired: { rotulo: 'Pares (Paired)', cores: [...schemePaired] },
  okabeIto: {
    rotulo: 'Okabe-Ito (daltonismo-seguro)',
    cores: ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442', '#000000'],
    daltonismoSeguro: true,
  },
  ibm: {
    rotulo: 'IBM (daltonismo-seguro)',
    cores: ['#648FFF', '#785EF0', '#DC267F', '#FE6100', '#FFB000'],
    daltonismoSeguro: true,
  },
  corporativa: {
    rotulo: 'Corporativa sóbria',
    cores: ['#1F3A5F', '#3C6E9A', '#6FA3C7', '#A8C8DE', '#C9A227', '#8A6D3B', '#5B5F63', '#9AA5AB'],
  },
  vibrante: {
    rotulo: 'Vibrante',
    cores: ['#FF4365', '#00D9C0', '#FFD23F', '#7B2CBF', '#3A86FF', '#FB5607', '#06D6A0', '#EF476F'],
  },
  pastel: {
    rotulo: 'Pastel',
    cores: ['#A7C7E7', '#FFD8BE', '#B5EAD7', '#FFDAC1', '#C7CEEA', '#E2F0CB', '#FFB7B2', '#D4A5A5'],
  },
  monocromatica: {
    rotulo: 'Monocromática (azul)',
    cores: ['#0B2E4F', '#15476F', '#1F5F8F', '#3C7FAF', '#639FC8', '#8FBEDC', '#BCD9EC', '#E1EFF8'],
  },
};

/** Escalas contínuas (sequenciais e divergentes) para "cor por valor". */
export const ESCALAS_CONTINUAS = {
  azul: { rotulo: 'Azul (sequencial)', interpolador: interpolateBlues, tipo: 'sequencial' },
  viridis: {
    rotulo: 'Viridis (sequencial, daltonismo-seguro)',
    interpolador: interpolateViridis,
    tipo: 'sequencial',
    daltonismoSeguro: true,
  },
  cividis: {
    rotulo: 'Cividis (sequencial, daltonismo-seguro)',
    interpolador: interpolateCividis,
    tipo: 'sequencial',
    daltonismoSeguro: true,
  },
  turbo: { rotulo: 'Turbo (sequencial, alto contraste)', interpolador: interpolateTurbo, tipo: 'sequencial' },
  laranja: { rotulo: 'Laranja (sequencial)', interpolador: interpolateOranges, tipo: 'sequencial' },
  verde: { rotulo: 'Verde (sequencial)', interpolador: interpolateGreens, tipo: 'sequencial' },
  vermelhoVerde: {
    rotulo: 'Vermelho → Verde (divergente)',
    interpolador: interpolateRdYlGn,
    tipo: 'divergente',
  },
  vermelhoAzul: {
    rotulo: 'Vermelho → Azul (divergente, daltonismo-seguro)',
    interpolador: interpolateRdBu,
    tipo: 'divergente',
    daltonismoSeguro: true,
  },
  marromVerde: { rotulo: 'Marrom → Verde (divergente)', interpolador: interpolateBrBG, tipo: 'divergente' },
  roxoLaranja: { rotulo: 'Roxo → Laranja (divergente)', interpolador: interpolatePuOr, tipo: 'divergente' },
};

/** Tokens do tema claro (base de tudo). */
const TEMA_CLARO = {
  nome: 'claro',
  fundo: '#FFFFFF',
  fundoAlternado: '#F8FAFC',
  fundoElevado: '#FFFFFF',
  texto: '#1F2937',
  textoSuave: '#6B7280',
  textoInvertido: '#FFFFFF',
  borda: '#E5E7EB',
  bordaForte: '#CBD5E1',
  grade: '#EEF2F6',
  eixo: '#94A3B8',
  destaque: '#2563EB',
  destaqueSuave: '#DBEAFE',
  positivo: '#16A34A',
  negativo: '#DC2626',
  atencao: '#D97706',
  neutro: '#64748B',
  sombra: '0 1px 3px rgba(15,23,42,0.12)',
  sombraForte: '0 6px 18px rgba(15,23,42,0.18)',
  tooltipFundo: 'rgba(17,24,39,0.96)',
  tooltipTexto: '#FFFFFF',
};

/** Tokens do tema escuro. */
const TEMA_ESCURO = {
  nome: 'escuro',
  fundo: '#0F172A',
  fundoAlternado: '#152133',
  fundoElevado: '#1E293B',
  texto: '#E2E8F0',
  textoSuave: '#94A3B8',
  textoInvertido: '#0F172A',
  borda: '#334155',
  bordaForte: '#475569',
  grade: '#1E293B',
  eixo: '#64748B',
  destaque: '#60A5FA',
  destaqueSuave: '#1E3A5F',
  positivo: '#4ADE80',
  negativo: '#F87171',
  atencao: '#FBBF24',
  neutro: '#94A3B8',
  sombra: '0 1px 3px rgba(0,0,0,0.5)',
  sombraForte: '0 6px 18px rgba(0,0,0,0.6)',
  tooltipFundo: 'rgba(241,245,249,0.96)',
  tooltipTexto: '#0F172A',
};

export const TEMAS = { claro: TEMA_CLARO, escuro: TEMA_ESCURO };

/** Espaçamentos, raios e tamanhos padrão (em px). */
export const METRICAS = {
  espaco: { xs: 2, sm: 4, md: 8, lg: 16, xl: 24 },
  raio: { nenhum: 0, sm: 2, md: 4, lg: 8, pilula: 999 },
  fonte: { xs: 10, sm: 11, md: 12, lg: 14, xl: 18, xxl: 24 },
  margem: { topo: 16, direita: 16, baixo: 32, esquerda: 48 },
};

/**
 * Resolve o tema final a partir da config do usuário.
 * `config.tema` pode ser 'claro' | 'escuro' | 'personalizado'.
 * No modo personalizado, as cores informadas sobrescrevem o tema claro.
 */
export function resolverTema(config = {}) {
  const base = config.tema === 'escuro' ? TEMA_ESCURO : TEMA_CLARO;
  const tema = { ...base };

  // Correções v2 (módulo 2.2): as cores próprias valem SEMPRE que estiverem
  // preenchidas, em qualquer tema. Antes só valiam com tema "personalizado",
  // e quem escolhia a cor da grade sem trocar o tema não via efeito nenhum.
  // Vazio continua significando "a do tema".
  const preenchida = (v) => typeof v === 'string' && v.trim() !== '';
  if (preenchida(config.corDeFundo)) tema.fundo = config.corDeFundo;
  if (preenchida(config.corDoTexto)) {
    tema.texto = config.corDoTexto;
    tema.textoSuave = config.corDoTexto;
  }
  if (preenchida(config.corDaBorda)) tema.borda = config.corDaBorda;
  if (preenchida(config.corDaGrade)) tema.grade = config.corDaGrade;
  if (preenchida(config.corDeDestaque)) tema.destaque = config.corDeDestaque;

  tema.fonte = FAMILIAS_DE_FONTE[config.familiaDaFonte] || FAMILIAS_DE_FONTE.sistema;
  tema.tamanhoBase = Number(config.tamanhoDaFonte) || METRICAS.fonte.md;
  tema.metricas = METRICAS;
  return tema;
}

/** Devolve o array de cores da paleta escolhida (com fallback seguro). */
/**
 * Registro de paletas de pacotes temáticos (5.14b, v3). O id leva o
 * prefixo do pacote; o valor salvo continua funcionando mesmo com o pacote
 * desligado (o pacote só filtra as listas do painel).
 */
export function registrarPaletaCategorica(id, { rotulo, cores, pacote = null }) {
  PALETAS_CATEGORICAS[id] = { rotulo, cores: cores.slice(), pacote };
}

/** Escala contínua de pacote, a partir de pontos de cor (interpolação suave). */
export function registrarEscalaContinua(id, { rotulo, cores, tipo = 'sequencial', pacote = null }) {
  const paradas = cores.slice();
  const interpolador = (t) => {
    const x = Math.max(0, Math.min(1, Number(t) || 0)) * (paradas.length - 1);
    const i = Math.min(paradas.length - 2, Math.floor(x));
    return interpolateRgb(paradas[i], paradas[i + 1])(x - i);
  };
  ESCALAS_CONTINUAS[id] = { rotulo, interpolador, tipo, pacote };
}

export function coresDaPaleta(nomeDaPaleta) {
  const p = PALETAS_CATEGORICAS[nomeDaPaleta] || PALETAS_CATEGORICAS.looker;
  return p.cores;
}

/** Devolve o interpolador contínuo escolhido (com fallback seguro). */
export function interpoladorContinuo(nome) {
  const e = ESCALAS_CONTINUAS[nome] || ESCALAS_CONTINUAS.azul;
  return e.interpolador;
}

/** Lista de opções {rotulo: valor} para alimentar selects do painel Edit. */
export function opcoesDePaleta() {
  return Object.keys(PALETAS_CATEGORICAS).map((chave) => ({
    [PALETAS_CATEGORICAS[chave].rotulo]: chave,
  }));
}

export function opcoesDeEscalaContinua() {
  return Object.keys(ESCALAS_CONTINUAS).map((chave) => ({
    [ESCALAS_CONTINUAS[chave].rotulo]: chave,
  }));
}

/**
 * Contraste simples (claro/escuro) para escolher a cor do texto por cima de
 * um fundo. Usa luminância relativa aproximada (suficiente para rótulos).
 */
export function textoLegivelSobre(corDeFundo, tema) {
  const rgb = corParaRgb(corDeFundo);
  if (!rgb) return tema ? tema.texto : '#1F2937';
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  return lum > 0.58 ? '#111827' : '#FFFFFF';
}

/** Converte '#rgb', '#rrggbb' ou 'rgb(...)' em [r,g,b]; null se não der. */
export function corParaRgb(cor) {
  if (typeof cor !== 'string') return null;
  const t = cor.trim();
  let m = /^#([0-9a-f]{3})$/i.exec(t);
  if (m) {
    const h = m[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  m = /^#([0-9a-f]{6})$/i.exec(t);
  if (m) {
    const h = m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(t);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

/** Aplica opacidade a uma cor hex/rgb, devolvendo rgba(). */
export function comOpacidade(cor, opacidade) {
  const rgb = corParaRgb(cor);
  if (!rgb) return cor;
  const a = Math.max(0, Math.min(1, Number(opacidade)));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

/** Clareia (t>0) ou escurece (t<0) uma cor. t entre -1 e 1. */
export function ajustarBrilho(cor, t) {
  const rgb = corParaRgb(cor);
  if (!rgb) return cor;
  const alvo = t >= 0 ? 255 : 0;
  const f = Math.abs(Math.max(-1, Math.min(1, t)));
  const novo = rgb.map((c) => Math.round(c + (alvo - c) * f));
  return `rgb(${novo[0]},${novo[1]},${novo[2]})`;
}
