/**
 * format.js — formatação de números, datas e textos.
 *
 * Ordem de preferência ao exibir um valor de célula (ver `data-model.js`):
 *   1. O texto que o PRÓPRIO Looker já renderizou (`rendered`), porque ele
 *      já respeita o `value_format` do campo e a localidade da conta.
 *   2. Se o gráfico calculou o número por conta própria (total, média,
 *      diferença...), aí sim formatamos aqui, tentando imitar o
 *      `value_format` do campo de origem.
 *
 * O `value_format` do Looker usa a sintaxe de formato do Excel
 * (`#,##0.00`, `$#,##0`, `0.0%`, `#,##0,,"M"` etc.). Convertemos um
 * subconjunto comum para `d3-format`. O que não for reconhecido cai num
 * formato padrão sensato — e isso fica registrado em docs/COMPAT.md.
 */

import { format as d3Format } from 'd3-format';

const cacheDeFormatadores = new Map();

/** Número seguro: devolve null se não for um número finito. */
export function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Converte um `value_format` estilo Excel para um especificador d3-format.
 * Devolve `{ spec, prefixo, sufixo, divisor }` ou null se não reconhecer.
 */
export function converterValueFormat(valueFormat) {
  if (typeof valueFormat !== 'string' || !valueFormat.trim()) return null;

  // Só interpretamos a parte dos positivos (antes do primeiro ';').
  let fmt = valueFormat.split(';')[0].trim();
  if (!fmt) return null;

  let prefixo = '';
  let sufixo = '';

  // Textos entre aspas viram prefixo/sufixo literais.
  fmt = fmt.replace(/^"([^"]*)"/, (_, t) => {
    prefixo += t;
    return '';
  });
  fmt = fmt.replace(/"([^"]*)"\s*$/, (_, t) => {
    sufixo = t + sufixo;
    return '';
  });

  // Símbolos de moeda comuns no início (inclusive com \ de escape do Excel).
  const moeda = /^(\\?R\$|\\?US\$|\\?\$|€|£|¥)\s*/.exec(fmt);
  if (moeda) {
    prefixo += moeda[1].replace(/\\/g, '') + (moeda[0].endsWith(' ') ? ' ' : '');
    fmt = fmt.slice(moeda[0].length);
  }

  // Percentual: no Excel o % multiplica por 100.
  const ehPercentual = /%/.test(fmt);
  if (ehPercentual) fmt = fmt.replace(/%/g, '');

  // Vírgulas no FIM do padrão numérico dividem por mil cada uma
  // (ex.: `#,##0,,` = milhões). Detectamos antes de limpar separadores.
  let divisor = 1;
  const escala = /([#0])(,+)\s*$/.exec(fmt);
  if (escala) {
    divisor = Math.pow(1000, escala[2].length);
    fmt = fmt.replace(/,+\s*$/, '');
  }

  const usaSeparadorDeMilhar = /#,##|0,0/.test(fmt);

  // Casas decimais = quantidade de 0/# depois do ponto.
  let casas = 0;
  const parteDecimal = /\.([0#]+)/.exec(fmt);
  if (parteDecimal) casas = parteDecimal[1].length;

  // Se não sobrou nenhum dígito marcador, não é um formato numérico.
  if (!/[#0]/.test(fmt)) return null;

  const spec =
    (usaSeparadorDeMilhar ? ',' : '') + '.' + casas + (ehPercentual ? '%' : 'f');

  return { spec, prefixo, sufixo, divisor, ehPercentual };
}

/**
 * Cria uma função de formatação a partir de um `value_format` do Looker.
 * Sempre devolve uma função (nunca null): se não reconhecer o formato, usa
 * um padrão com separador de milhar e até 2 casas.
 */
export function formatadorDeValueFormat(valueFormat, opcoesPadrao = {}) {
  const chave = `vf:${valueFormat}|${JSON.stringify(opcoesPadrao)}`;
  if (cacheDeFormatadores.has(chave)) return cacheDeFormatadores.get(chave);

  const convertido = converterValueFormat(valueFormat);
  let fn;

  if (convertido) {
    const base = d3Format(convertido.spec);
    fn = (valor) => {
      const n = numeroOuNulo(valor);
      if (n === null) return '';
      return convertido.prefixo + base(n / convertido.divisor) + convertido.sufixo;
    };
  } else {
    fn = criarFormatadorNumerico(opcoesPadrao);
  }

  cacheDeFormatadores.set(chave, fn);
  return fn;
}

/**
 * Formatador numérico a partir de opções do painel Edit (sem value_format).
 * @param {{estilo?:'auto'|'numero'|'compacto'|'moeda'|'percentual'|'cientifico',
 *          casas?:number, prefixo?:string, sufixo?:string,
 *          separadorDeMilhar?:boolean, simboloDaMoeda?:string}} opcoes
 */
export function criarFormatadorNumerico(opcoes = {}) {
  const {
    estilo = 'auto',
    casas = 2,
    prefixo = '',
    sufixo = '',
    separadorDeMilhar = true,
    simboloDaMoeda = 'R$ ',
  } = opcoes;

  const sep = separadorDeMilhar ? ',' : '';
  const casasSeguras = Math.max(0, Math.min(10, Number(casas) || 0));

  let base;
  switch (estilo) {
    case 'compacto':
      // `s` do d3 usa µ/k/M/G; trocamos para K/M/B/T, que é o que se espera
      // num painel de negócios em português.
      base = (n) => trocarSufixosSI(d3Format(`${sep}.${Math.max(1, casasSeguras)}s`)(n));
      break;
    case 'moeda':
      base = (n) => simboloDaMoeda + d3Format(`${sep}.${casasSeguras}f`)(n);
      break;
    case 'percentual':
      base = d3Format(`${sep}.${casasSeguras}%`);
      break;
    case 'cientifico':
      base = d3Format(`.${casasSeguras}e`);
      break;
    case 'numero':
      base = d3Format(`${sep}.${casasSeguras}f`);
      break;
    case 'auto':
    default:
      // Inteiros saem sem casas decimais; fracionários com as casas pedidas.
      base = (n) =>
        Number.isInteger(n)
          ? d3Format(`${sep}d`)(n)
          : d3Format(`${sep}.${casasSeguras}f`)(n);
      break;
  }

  return (valor) => {
    const n = numeroOuNulo(valor);
    if (n === null) return '';
    return prefixo + base(n) + sufixo;
  };
}

/** Troca os sufixos SI do d3 (k, M, G, T, µ) por K, M, B, T. */
function trocarSufixosSI(texto) {
  return texto
    .replace(/G$/, 'B')
    .replace(/k$/, 'K')
    .replace(/µ/, 'u');
}

/** Formata um número de forma curta para rótulos apertados (eixos). */
export const formatarCurto = criarFormatadorNumerico({ estilo: 'compacto', casas: 1 });

/** Formata percentual a partir de uma fração (0.1234 → "12,3%"). */
export function formatarPercentual(fracao, casas = 1) {
  const n = numeroOuNulo(fracao);
  if (n === null) return '';
  return d3Format(`.${casas}%`)(n);
}

/** Troca ponto por vírgula (pt-BR) quando o gráfico quiser localizar. */
export function paraPtBr(texto) {
  if (typeof texto !== 'string') return texto;
  // Troca separadores: 1,234.56 → 1.234,56
  return texto.replace(/[,.]/g, (c) => (c === ',' ? '.' : ','));
}

/**
 * Converte um valor de célula em Date quando possível.
 * O Looker manda datas como string ISO, 'YYYY-MM', 'YYYY' ou objeto Date.
 */
export function paraData(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'number') {
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const texto = String(valor).trim();

  // ATENÇÃO AO FUSO: `new Date('2026-03-05')` é interpretado pelo JS como
  // meia-noite em UTC, e num fuso negativo (ex.: Brasil, UTC-3) isso vira o
  // dia ANTERIOR na hora de exibir. Por isso, datas SEM hora são montadas
  // componente a componente, que o construtor trata como hora local.

  // 'YYYY' → 1º de janeiro
  if (/^\d{4}$/.test(texto)) return new Date(Number(texto), 0, 1);
  // 'YYYY-MM' → 1º do mês
  const mes = /^(\d{4})-(\d{1,2})$/.exec(texto);
  if (mes) return new Date(Number(mes[1]), Number(mes[2]) - 1, 1);
  // 'YYYY-MM-DD' puro (sem hora) → data local
  const dataSimples = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(texto);
  if (dataSimples) {
    return new Date(Number(dataSimples[1]), Number(dataSimples[2]) - 1, Number(dataSimples[3]));
  }
  // 'YYYY-MM-DD HH:MM[:SS]' (formato comum do Looker) → data local
  const comHora = /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(texto);
  if (comHora) {
    return new Date(
      Number(comHora[1]),
      Number(comHora[2]) - 1,
      Number(comHora[3]),
      Number(comHora[4]),
      Number(comHora[5]),
      Number(comHora[6] || 0)
    );
  }
  // Demais formatos (ISO com fuso explícito, textos de data) — parse nativo
  const d = new Date(texto);
  return Number.isNaN(d.getTime()) ? null : d;
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Formata data em pt-BR sem depender de Intl pesado nem de locale externa. */
export function formatarData(valor, estilo = 'auto') {
  const d = paraData(valor);
  if (!d) return valor === null || valor === undefined ? '' : String(valor);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  switch (estilo) {
    case 'ano':
      return String(ano);
    case 'mesAno':
      return `${MESES_CURTOS[d.getMonth()]}/${String(ano).slice(2)}`;
    case 'diaMes':
      return `${dia}/${mes}`;
    case 'completo':
      return `${dia}/${mes}/${ano} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    case 'auto':
    default:
      return `${dia}/${mes}/${ano}`;
  }
}

/** Trunca texto com reticências, preservando palavras quando dá. */
export function truncar(texto, limite = 24) {
  const t = texto === null || texto === undefined ? '' : String(texto);
  if (t.length <= limite) return t;
  return t.slice(0, Math.max(1, limite - 1)).trimEnd() + '…';
}

/**
 * Preenche um template `{{campo}}` com valores de um objeto.
 * SEMPRE devolve texto puro — quem exibe usa `textContent` (nunca innerHTML).
 */
export function preencherTemplate(template, valoresPorCampo) {
  if (typeof template !== 'string' || !template) return '';
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (todo, nome) => {
    const chave = String(nome).trim();
    const v = valoresPorCampo ? valoresPorCampo[chave] : undefined;
    if (v === null || v === undefined) return '';
    return String(v);
  });
}
