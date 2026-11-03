/**
 * ajuste.js — "Quando não couber" (v3.3): a árvore se ajusta ao limite da
 * célula e só rola em último caso.
 *
 * Motor GENÉRICO: não sabe desenhar nada. Quem desenha (arvores_multiplas,
 * org_chart) passa uma função `medir({tamanho, limite, quebrar, escala})`
 * (`escala` = a escala em teste no passo d) que devolve a largura que o
 * desenho COMPLETO (todos os nós, abertos ou não) ocuparia com aquela fonte
 * e aquele limite por rótulo. Como a conta usa o
 * ramo completo, abrir ou fechar um nó não muda o ajuste (layout estável
 * da v3.2).
 *
 * Passos, nesta ordem fixa, parando no primeiro que resolver (cada um com
 * liga/desliga; todos ligados por padrão, menos a rolagem):
 *   (a) fonte   — reduz a fonte, de 0,5 em 0,5 px, até a "Fonte mínima";
 *   (b) linhas  — quebra o rótulo em até "Máximo de linhas" (do Texto
 *                 longo), sem cortar nada;
 *   (c) colunas — menos colunas na grade (é quem desenha a grade que faz:
 *                 repete (a) e (b) com a célula mais larga);
 *   (d) escala  — reduz o desenho (ícones, nós, distâncias) até
 *                 `ESCALA_MINIMA`; a fonte NA TELA nunca fica abaixo da
 *                 mínima (a fonte no desenho sobe na mesma proporção);
 *   (e) rolagem — desenho em tamanho final com rolagem, sem cortar texto.
 * Com a rolagem desligada e nada resolvido, o último recurso é quebrar e
 * cortar com reticências (texto completo no tooltip); se nem assim couber,
 * o que sobra rola.
 *
 * Determinístico: sem aleatoriedade nem medida do DOM (só `medir`), com
 * número de iterações limitado — mesma entrada, mesmo resultado.
 */

import { listaDeValores } from '../../core/options-kit.js';

/** Menor escala do desenho considerada legível (ícones, nós, linhas). */
export const ESCALA_MINIMA = 0.6;
/** Largura usada quando o contêiner ainda não tem tamanho (aba oculta). */
export const LARGURA_PADRAO = 600;
/** Altura usada quando o contêiner ainda não tem tamanho. */
export const ALTURA_PADRAO = 400;
/** Reserva da barra de rolagem vertical quando não dá para medir (px). */
export const RESERVA_DA_BARRA = 18;
/** Menor largura por rótulo no corte final (px). */
const LIMITE_MINIMO = 40;
/** Teto de iterações dos laços (proteção). */
const ITERACOES = 24;

/** Opções do ajuste (v3.3). Ids com "layout" para cair na aba Estilo. */
export function opcoesDeAjuste({ secao = 'Árvore', comColunas = false } = {}) {
  const b = (label, def) => ({ type: 'boolean', label, section: secao, default: def });
  const saida = {
    layoutQuandoNaoCouber: {
      type: 'string',
      label: 'Quando não couber',
      section: secao,
      display: 'select',
      default: 'ajustar',
      values: listaDeValores([
        { rotulo: 'Ajustar automaticamente', valor: 'ajustar' },
        { rotulo: 'Rolar em tamanho real', valor: 'rolar' },
      ]),
    },
    layoutAjusteFonte: b('Ajuste: fonte', true),
    layoutAjusteLinhas: b('Ajuste: linhas', true),
  };
  if (comColunas) saida.layoutAjusteColunas = b('Ajuste: colunas', true);
  Object.assign(saida, {
    layoutAjusteEscala: b('Ajuste: escala', true),
    layoutAjusteRolagem: b('Ajuste: rolagem', false),
    layoutFonteMinima: { type: 'number', label: 'Ajuste: fonte mínima (px)', section: secao, default: 9 },
    layoutFolgaDoTexto: { type: 'number', label: 'Folga do texto (%)', section: secao, default: 10 },
    layoutAjusteNaNota: b('Ajuste na nota', true),
    layoutDiagnostico: b('Diagnóstico do layout', false),
  });
  return saida;
}

/** A página está sendo impressa (PDF, entrega agendada)? */
export function emImpressao() {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !!window.matchMedia('print').matches;
  } catch (_) {
    return false;
  }
}

/**
 * Configuração resolvida do ajuste. Na impressão vale SEMPRE o ajuste
 * automático, sem rolagem (papel não rola).
 */
export function lerAjuste(config = {}, { impressao = false } = {}) {
  const n = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : d);
  return {
    automatico: impressao || config.layoutQuandoNaoCouber !== 'rolar',
    impressao,
    fonte: config.layoutAjusteFonte !== false,
    linhas: config.layoutAjusteLinhas !== false,
    colunas: config.layoutAjusteColunas !== false,
    escala: config.layoutAjusteEscala !== false,
    rolagem: !impressao && config.layoutAjusteRolagem === true,
    fonteMinima: Math.max(5, n(config.layoutFonteMinima, 9)),
    folga: Math.max(0, Math.min(100, n(config.layoutFolgaDoTexto, 10))),
    naNota: config.layoutAjusteNaNota !== false,
    diagnostico: config.layoutDiagnostico === true,
  };
}

/** Número finito e positivo, ou o padrão (contêiner com 0, NaN, indefinido). */
export function tamanhoSeguro(v, padrao) {
  const x = Number(v);
  return Number.isFinite(x) && x > 1 ? x : padrao;
}

/**
 * Passos (a) e (b). `medir` devolve {largura, fixo, colunas, cortado}:
 * a largura total, a parte que não é texto e quantas colunas de rótulo há.
 * @returns {{cabe:boolean, passo:string|null, tamanho:number, limite:number, quebrar:boolean, largura:number}}
 */
export function ajustarPorTexto({ disponivel, fonte, aj, linhas = 2, medir }) {
  const d = tamanhoSeguro(disponivel, LARGURA_PADRAO);
  const pronto = (passo, tamanho, m, limite = Infinity, quebrar = false) => ({ cabe: true, passo, tamanho, limite, quebrar, largura: m.largura });
  let tam = fonte;
  let m = medir({ tamanho: tam, limite: Infinity, quebrar: false });
  if (m.largura <= d) return pronto('nenhum', tam, m);
  // (a) fonte
  if (aj.fonte && fonte > aj.fonteMinima) {
    for (let i = 1; i <= ITERACOES * 4; i++) {
      tam = Math.max(aj.fonteMinima, fonte - 0.5 * i);
      m = medir({ tamanho: tam, limite: Infinity, quebrar: false });
      if (m.largura <= d) return pronto('fonte', tam, m);
      if (tam <= aj.fonteMinima) break;
    }
  }
  // (b) linhas: um limite por rótulo que faz a soma caber; só resolve se
  // nenhum rótulo precisar de corte.
  if (aj.linhas && linhas > 1 && m.colunas > 0) {
    const limite = Math.floor((d - m.fixo) / m.colunas);
    if (limite >= LIMITE_MINIMO) {
      const q = medir({ tamanho: tam, limite, quebrar: true });
      if (q.largura <= d + 0.01 && !q.cortado) return pronto('linhas', tam, q, limite, true);
    }
  }
  return { cabe: false, passo: null, tamanho: tam, limite: Infinity, quebrar: false, largura: m.largura };
}

/**
 * Passos (d) e (e), e o corte final. Recebe o resultado de
 * `ajustarPorTexto` (depois da grade, se houver).
 * @returns {{cabe:boolean, passo:string, tamanho:number, limite:number, quebrar:boolean, largura:number, escala:number}}
 */
export function ajustarPorEscala({ disponivel, texto, aj, linhas = 2, medir }) {
  const d = tamanhoSeguro(disponivel, LARGURA_PADRAO);
  if (texto.cabe) return { ...texto, escala: 1 };
  let escala = 1;
  let tam = texto.tamanho;
  if (aj.escala) {
    // Fonte no desenho = mínima ÷ escala (na tela, nunca abaixo da mínima),
    // arredondada a 0,25 px para o cache aproveitar.
    const fonteEm = (s) => Math.max(tam, Math.ceil((aj.fonteMinima / s) * 4) / 4);
    // Em cada escala: cabe sem quebrar? Senão (com "linhas" ligado), cabe
    // quebrando em até "Máximo de linhas" sem cortar nada?
    const tentar = (s) => {
      const t = fonteEm(s);
      const m = medir({ tamanho: t, limite: Infinity, quebrar: false, escala: s });
      if (s * m.largura <= d) return { cabe: true, tamanho: t, limite: Infinity, quebrar: false, largura: s * m.largura };
      if (aj.linhas && linhas > 1 && m.colunas > 0) {
        const limite = Math.floor((d / s - m.fixo) / m.colunas);
        if (limite >= LIMITE_MINIMO) {
          const q = medir({ tamanho: t, limite, quebrar: true, escala: s });
          if (s * q.largura <= d + 0.01 && !q.cortado) return { cabe: true, tamanho: t, limite, quebrar: true, largura: s * q.largura };
        }
      }
      return { cabe: false };
    };
    if (tentar(ESCALA_MINIMA).cabe) {
      // Busca binária da MAIOR escala que cabe (a largura cresce com a escala).
      let lo = ESCALA_MINIMA;
      let hi = 1;
      for (let i = 0; i < ITERACOES; i++) {
        const meio = (lo + hi) / 2;
        if (tentar(meio).cabe) lo = meio;
        else hi = meio;
      }
      escala = Math.floor(lo * 1000) / 1000;
      let r = tentar(escala);
      if (!r.cabe) {
        escala = ESCALA_MINIMA;
        r = tentar(escala);
      }
      return { ...r, cabe: true, passo: 'escala', escala };
    }
    escala = ESCALA_MINIMA;
    tam = fonteEm(escala);
  }
  const m = medir({ tamanho: tam, limite: Infinity, quebrar: false, escala });
  if (aj.rolagem) return { cabe: false, passo: 'rolagem', escala, tamanho: tam, limite: Infinity, quebrar: false, largura: m.largura * escala };
  // Último recurso: quebra e corta com reticências (tooltip com o texto todo).
  const limite = Math.max(LIMITE_MINIMO, Math.floor((d / escala - m.fixo) / Math.max(1, m.colunas)));
  const q = medir({ tamanho: tam, limite, quebrar: true, escala });
  // Se nem cortando couber (mínimo de 40 px por rótulo), o corte ainda é o
  // desenho mais perto de caber: o resto rola.
  return { cabe: q.largura * escala <= d + 0.01, passo: 'corte', escala, tamanho: tam, limite, quebrar: true, largura: q.largura * escala };
}

/**
 * Largura da barra de rolagem vertical: medida no navegador (div de prova
 * com overflow:scroll) ou `RESERVA_DA_BARRA` quando a medida não faz
 * sentido (jsdom). Reservar sempre essa largura (com
 * `scrollbar-gutter: stable` na célula) impede a oscilação "a barra
 * aparece, a largura útil muda, o layout muda, a barra some".
 */
export function larguraDaBarraDeRolagem(pai) {
  try {
    const prova = document.createElement('div');
    prova.style.cssText = 'position:absolute;visibility:hidden;width:100px;height:100px;overflow:scroll;top:-200px;';
    pai.appendChild(prova);
    const w = prova.offsetWidth - prova.clientWidth;
    pai.removeChild(prova);
    return Number.isFinite(w) && w >= 0 && w <= 40 && prova.offsetWidth === 100 ? w : RESERVA_DA_BARRA;
  } catch (_) {
    return RESERVA_DA_BARRA;
  }
}

/**
 * Texto do ajuste para a nota ("fonte reduzida para 9 px · 2 linhas por
 * rótulo"). `planos` = resultados por árvore; `colunas` = {de, para}.
 */
export function textoDoAjuste(planos, { linhas = 2, colunas = null } = {}) {
  const partes = [];
  const usados = planos.filter(Boolean);
  const fontes = usados.filter((p) => p.passo !== 'nenhum').map((p) => p.tamanho);
  if (usados.some((p) => p.passo !== 'nenhum' && p.passo !== null) && fontes.length) {
    const menor = Math.min(...usados.map((p) => p.tamanhoNaTela || p.tamanho));
    const original = Math.max(...usados.map((p) => p.fonteOriginal || 0));
    if (menor < original - 0.01) partes.push(`fonte reduzida para ${arredondar(menor)} px`);
  }
  if (usados.some((p) => p.quebrar)) partes.push(`${linhas} linhas por rótulo`);
  if (colunas && colunas.para < colunas.de) partes.push(`${colunas.para} ${colunas.para === 1 ? 'coluna' : 'colunas'}`);
  const escalas = usados.filter((p) => p.escala < 1).map((p) => p.escala);
  if (escalas.length) partes.push(`escala ${Math.round(Math.min(...escalas) * 100)}%`);
  if (usados.some((p) => p.passo === 'rolagem')) partes.push('com rolagem');
  if (usados.some((p) => p.passo === 'corte')) partes.push('rótulos cortados (texto completo no tooltip)');
  return partes.length ? `Ajuste: ${partes.join(' · ')}` : '';
}

/** Linha do diagnóstico (S1). */
export function textoDoDiagnostico({ larguraDaCelula, planos, colunas }) {
  const usados = planos.filter(Boolean);
  const necessaria = Math.max(0, ...usados.map((p) => p.larguraOriginal || 0));
  const passos = [...new Set(usados.map((p) => p.passo || 'nenhum'))].join('+');
  const fonte = usados.length ? Math.min(...usados.map((p) => p.tamanhoNaTela || p.tamanho)) : 0;
  const escala = usados.length ? Math.min(...usados.map((p) => p.escala || 1)) : 1;
  return `célula ${Math.round(larguraDaCelula)} px · necessária ${Math.round(necessaria)} px · passo ${passos} · fonte ${arredondar(fonte)} px · colunas ${colunas} · escala ${escala.toFixed(2)}`;
}

function arredondar(v) {
  return String(Math.round(v * 100) / 100).replace('.', ',');
}
