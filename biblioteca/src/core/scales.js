/**
 * scales.js — escalas e eixos.
 *
 * Embrulha o `d3-scale` para que os gráficos recebam escalas já
 * configuradas a partir das opções do painel (mínimo/máximo, log/raiz,
 * inverter, etc.), sem repetir a mesma lógica em cada gráfico.
 */

import {
  scaleLinear,
  scaleLog,
  scalePow,
  scaleBand,
  scalePoint,
  scaleTime,
  scaleOrdinal,
  scaleSequential,
  scaleDiverging,
} from 'd3-scale';
import { extent, max, min, quantile as d3Quantile, mean as d3Mean, median as d3Median } from 'd3-array';
import { interpolateRgb, interpolateRgbBasis } from 'd3-interpolate';
import { coresDaPaleta, interpoladorContinuo } from './theme.js';

/** Cria a escala numérica de um eixo conforme as opções do painel. */
export function escalaNumerica({ valores, intervalo, config = {}, eixo = 'Y' }) {
  const prefixo = eixo.toUpperCase();
  const tipo = config[`escalaEixo${prefixo}`] || 'linear';
  const minManual = numeroOuIndefinido(config[`minimoEixo${prefixo}`]);
  const maxManual = numeroOuIndefinido(config[`maximoEixo${prefixo}`]);
  const inverter = !!config[`inverterEixo${prefixo}`];

  let [d0, d1] = extent(valores.filter((v) => Number.isFinite(v)));
  if (d0 === undefined) {
    d0 = 0;
    d1 = 1;
  }
  if (d0 === d1) {
    const delta = Math.abs(d0) * 0.1 || 1;
    d0 -= delta;
    d1 += delta;
  }
  if (minManual !== undefined) d0 = minManual;
  if (maxManual !== undefined) d1 = maxManual;

  let escala;
  if (tipo === 'log') {
    // Log não aceita 0 nem negativo: usa o menor positivo como piso.
    const positivos = valores.filter((v) => Number.isFinite(v) && v > 0);
    const piso = positivos.length ? min(positivos) : 1;
    escala = scaleLog().domain([minManual !== undefined ? Math.max(minManual, piso) : piso, Math.max(d1, piso * 10)]);
  } else if (tipo === 'raiz') {
    escala = scalePow().exponent(0.5).domain([d0, d1]);
  } else {
    escala = scaleLinear().domain([d0, d1]);
  }

  escala.range(inverter ? [intervalo[1], intervalo[0]] : intervalo);
  if (tipo !== 'log' && minManual === undefined && maxManual === undefined) escala.nice();
  return escala;
}

/** Escala de banda (barras) com espaçamento vindo das opções. */
export function escalaDeBanda({ dominio, intervalo, config = {} }) {
  const larguraPct = Number(config.larguraDaBarra);
  const espacoPct = Number(config.espacamentoEntreGrupos);
  const preenchimentoInterno = Number.isFinite(larguraPct) ? 1 - larguraPct / 100 : 0.2;
  const preenchimentoExterno = Number.isFinite(espacoPct) ? espacoPct / 100 : 0.2;
  return scaleBand()
    .domain(dominio)
    .range(intervalo)
    .paddingInner(Math.max(0, Math.min(0.95, preenchimentoInterno)))
    .paddingOuter(Math.max(0, Math.min(0.95, preenchimentoExterno)));
}

/** Escala de ponto (linhas/categorias sem largura). */
export function escalaDePonto({ dominio, intervalo, preenchimento = 0.5 }) {
  return scalePoint().domain(dominio).range(intervalo).padding(preenchimento);
}

/** Escala temporal. */
export function escalaTemporal({ datas, intervalo, inverter = false }) {
  const validas = datas.filter((d) => d instanceof Date && !Number.isNaN(d.getTime()));
  const [d0, d1] = extent(validas);
  const dominio = d0 ? [d0, d1 && d1 > d0 ? d1 : new Date(d0.getTime() + 86400000)] : [new Date(), new Date()];
  return scaleTime()
    .domain(dominio)
    .range(inverter ? [intervalo[1], intervalo[0]] : intervalo)
    .nice();
}

/**
 * Escala de cores a partir das opções do painel.
 * Devolve `{ tipo, cor(valorOuChave), dominio, legenda }`.
 */
export function escalaDeCores({ chaves = [], valores = [], config = {}, tema }) {
  const modo = config.modoDeCor || 'categoria';

  if (modo === 'unica') {
    const cor = config.corUnica || (tema && tema.destaque) || '#4276BE';
    return {
      tipo: 'unica',
      cor: () => cor,
      dominio: [],
      legenda: [],
    };
  }

  if (modo === 'valor') {
    const numeros = valores.filter((v) => Number.isFinite(v));
    let d0 = config.limiteDeCorAutomatico === false ? numeroOuIndefinido(config.limiteDeCorMinimo) : undefined;
    let d1 = config.limiteDeCorAutomatico === false ? numeroOuIndefinido(config.limiteDeCorMaximo) : undefined;
    if (d0 === undefined) d0 = numeros.length ? min(numeros) : 0;
    if (d1 === undefined) d1 = numeros.length ? max(numeros) : 1;
    if (d0 === d1) d1 = d0 + 1;

    let interpolador;
    if (config.escalaDeCorPersonalizada) {
      const cores = [config.corMinima || '#F1F5F9', config.corMedia || '#93C5FD', config.corMaxima || '#1D4ED8'];
      const unicas = cores[0] === cores[1] ? [cores[0], cores[2]] : cores;
      interpolador = interpolateRgbBasis(unicas);
    } else {
      interpolador = interpoladorContinuo(config.escalaDeCor);
    }

    const meio = (d0 + d1) / 2;
    const escala = config.escalaDeCorPersonalizada
      ? scaleDiverging(interpolador).domain([d0, meio, d1])
      : scaleSequential(interpolador).domain(config.inverterPaleta ? [d1, d0] : [d0, d1]);

    return {
      tipo: 'valor',
      cor: (valor) => (Number.isFinite(valor) ? escala(valor) : tema ? tema.neutro : '#94A3B8'),
      dominio: [d0, d1],
      legenda: [
        { valor: d0, cor: escala(d0) },
        { valor: meio, cor: escala(meio) },
        { valor: d1, cor: escala(d1) },
      ],
    };
  }

  // Categórico (padrão)
  let cores = coresDaPaleta(config.paleta).slice();
  if (config.inverterPaleta) cores.reverse();
  const escala = scaleOrdinal().domain(chaves).range(cores);
  return {
    tipo: 'categoria',
    cor: (chave) => escala(chave),
    dominio: chaves,
    legenda: chaves.map((c) => ({ chave: c, cor: escala(c) })),
  };
}

/** Mistura duas cores (0 = a, 1 = b). */
export function misturarCores(a, b, t) {
  return interpolateRgb(a, b)(Math.max(0, Math.min(1, t)));
}

/** Calcula ticks "redondos" para um eixo numérico. */
export function ticksDoEixo(escala, quantidadeAlvo = 5) {
  if (typeof escala.ticks === 'function') return escala.ticks(quantidadeAlvo);
  if (typeof escala.domain === 'function') return escala.domain();
  return [];
}

/** Estatísticas usadas por linhas de referência. */
export const estatisticas = {
  media: (valores) => d3Mean(valores.filter(Number.isFinite)) ?? null,
  mediana: (valores) => d3Median(valores.filter(Number.isFinite)) ?? null,
  percentil: (valores, p) => {
    const limpos = valores.filter(Number.isFinite).sort((a, b) => a - b);
    if (!limpos.length) return null;
    return d3Quantile(limpos, Math.max(0, Math.min(1, p / 100)));
  },
  minimo: (valores) => min(valores.filter(Number.isFinite)) ?? null,
  maximo: (valores) => max(valores.filter(Number.isFinite)) ?? null,
  soma: (valores) => valores.filter(Number.isFinite).reduce((a, b) => a + b, 0),
};

/** Resolve o valor de uma linha de referência configurada no painel. */
export function valorDaReferencia(config, indice, valores) {
  const ativa = config[`referencia${indice}Ativa`];
  if (!ativa) return null;
  const tipo = config[`referencia${indice}Tipo`] || 'media';
  const entrada = numeroOuIndefinido(config[`referencia${indice}Valor`]);
  let valor = null;
  if (tipo === 'media') valor = estatisticas.media(valores);
  else if (tipo === 'mediana') valor = estatisticas.mediana(valores);
  else if (tipo === 'percentil') valor = estatisticas.percentil(valores, entrada === undefined ? 50 : entrada);
  else if (tipo === 'fixo') valor = entrada === undefined ? null : entrada;
  if (valor === null || !Number.isFinite(valor)) return null;
  return {
    valor,
    cor: config[`referencia${indice}Cor`] || '#DC2626',
    rotulo: config[`referencia${indice}Rotulo`] || '',
    tipo,
  };
}

/** Todas as referências ativas, já resolvidas. */
export function referenciasAtivas(config, valores, quantidade = 2) {
  const saida = [];
  for (let i = 1; i <= quantidade; i++) {
    const r = valorDaReferencia(config, i, valores);
    if (r) saida.push(r);
  }
  return saida;
}

function numeroOuIndefinido(v) {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
