/**
 * texto-longo.js — "Texto longo": o que fazer com um rótulo que não cabe
 * (melhorias v3, 5.11 e 5.13b).
 *
 * Módulo GENÉRICO (sem nada de árvore): usado pelas duas árvores, pelo
 * organograma e pela coluna de nomes do dot_plot_denso. Mesmos ids e
 * rótulos de opção em todos (`opcoesDeTextoLongo`).
 *
 * Modos (`modoDoTextoLongo`, padrão "inteiro"):
 *   inteiro      mostra o texto todo; quem desenha reserva a largura do
 *                maior texto (e ganha rolagem, se precisar)
 *   quebrar      quebra em linhas (até "Máximo de linhas")
 *   reduzir      reduz a fonte até "Fonte mínima"; se ainda não couber, corta
 *   reticencias  corta com "…" (aqui vale a opção antiga `truncarRotulo`,
 *                em caracteres, além da largura)
 *   cortar       corta sem reticências
 *   abreviar     números grandes viram K, M, B (o nome fica inteiro)
 *   soNome       só o nome; valor e percentual vão para o tooltip
 *
 * Regra de precedência (4.1): a opção antiga `truncarRotulo` (salva como 60
 * nos tiles) só vale no modo "Cortar com reticências".
 *
 * Larguras: função única `medida-texto.js`.
 */

import { larguraDoTexto } from './medida-texto.js';
import { listaDeValores } from './options-kit.js';

export const MODOS_DO_TEXTO_LONGO = [
  { rotulo: 'Mostrar inteiro', valor: 'inteiro' },
  { rotulo: 'Quebrar em linhas', valor: 'quebrar' },
  { rotulo: 'Reduzir a fonte', valor: 'reduzir' },
  { rotulo: 'Cortar com reticências', valor: 'reticencias' },
  { rotulo: 'Cortar sem reticências', valor: 'cortar' },
  { rotulo: 'Abreviar números (K, M, B)', valor: 'abreviar' },
  { rotulo: 'Só o nome (resto no tooltip)', valor: 'soNome' },
];

/**
 * Opções (mesmos ids e rótulos em todos os gráficos que usam).
 * @param {{secao?:string, comPartes?:boolean, comMoeda?:boolean}} [o]
 */
export function opcoesDeTextoLongo({ secao = 'Texto longo', comPartes = true, comMoeda = true } = {}) {
  const o = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
  const saida = {
    modoDoTextoLongo: o('string', 'Modo', 'inteiro', { display: 'select', values: listaDeValores(MODOS_DO_TEXTO_LONGO) }),
    larguraMaximaDoRotulo: o('number', 'Largura máxima (px, 0 = auto)', 0),
    linhasMaximasDoRotulo: o('number', 'Máximo de linhas', 2),
    fonteMinimaDoRotulo: o('number', 'Fonte mínima (px)', 8),
    tooltipComTextoCompleto: o('boolean', 'Texto completo no tooltip', true),
    margemExtraDoRotulo: o('number', 'Margem extra à direita (px)', 0),
    permitirSelecionarTexto: o('boolean', 'Permitir selecionar texto', false),
  };
  if (comPartes) {
    Object.assign(saida, {
      partesDoRotulo: o('string', 'O que aparece no rótulo', 'auto', {
        display: 'select',
        values: listaDeValores([
          { rotulo: 'Automático (como antes)', valor: 'auto' },
          { rotulo: 'Nome', valor: 'nome' },
          { rotulo: 'Nome e valor', valor: 'nomeValor' },
          { rotulo: 'Nome, valor e percentual', valor: 'nomeValorPct' },
          { rotulo: 'Nome e percentual', valor: 'nomePct' },
        ]),
      }),
      separadorDoRotulo: o('string', 'Separador', ' · '),
    });
  }
  if (comMoeda) {
    Object.assign(saida, {
      simboloDaMoedaDoRotulo: o('string', 'Símbolo da moeda', 'auto', {
        display: 'select',
        values: listaDeValores([
          { rotulo: 'Automático (como antes)', valor: 'auto' },
          { rotulo: 'R$', valor: 'R$' },
          { rotulo: '$', valor: '$' },
          { rotulo: '€', valor: '€' },
          { rotulo: 'Nenhum', valor: 'nenhum' },
          { rotulo: 'Personalizado', valor: 'personalizado' },
        ]),
      }),
      moedaPersonalizadaDoRotulo: o('string', 'Moeda personalizada', ''),
    });
  }
  return saida;
}

/** Configuração resolvida do texto longo. */
export function lerTextoLongo(config = {}) {
  const n = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : d);
  const modo = MODOS_DO_TEXTO_LONGO.some((m) => m.valor === config.modoDoTextoLongo) ? config.modoDoTextoLongo : 'inteiro';
  return {
    modo,
    larguraMaxima: Math.max(0, n(config.larguraMaximaDoRotulo, 0)),
    linhas: Math.max(1, Math.floor(n(config.linhasMaximasDoRotulo, 2))),
    fonteMinima: Math.max(5, n(config.fonteMinimaDoRotulo, 8)),
    tooltipCompleto: config.tooltipComTextoCompleto !== false,
    margemExtra: Math.max(0, n(config.margemExtraDoRotulo, 0)),
    selecionavel: config.permitirSelecionarTexto === true,
    // `truncarRotulo` (opção antiga) só no modo reticências.
    truncarEmCaracteres: modo === 'reticencias' ? Math.max(0, n(config.truncarRotulo, 0)) : 0,
    partes: config.partesDoRotulo || 'auto',
    separador: typeof config.separadorDoRotulo === 'string' ? config.separadorDoRotulo : ' · ',
    moeda: config.simboloDaMoedaDoRotulo || 'auto',
    moedaPersonalizada: String(config.moedaPersonalizadaDoRotulo || ''),
  };
}

/** Troca o símbolo de moeda de um texto já formatado (R$, $, €). */
export function trocarMoeda(texto, tl) {
  if (!tl || tl.moeda === 'auto') return texto;
  const novo = tl.moeda === 'nenhum' ? '' : tl.moeda === 'personalizado' ? tl.moedaPersonalizada : tl.moeda;
  const s = String(texto);
  const re = /(R\$|US\$|\$|€|£)\s?/;
  if (!re.test(s)) return s;
  return s.replace(re, novo ? `${novo}${tl.moeda === 'R$' || novo.length > 1 ? ' ' : ''}` : '').trim();
}

/** "1.234.567" / "1,234,567.89" → "1.2M" (mantém prefixo/sufixo do texto). */
export function abreviarNumeros(texto) {
  return String(texto).replace(/(-?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|-?\d{4,}(?:[.,]\d+)?)/g, (m) => {
    // Descobre o separador decimal: o último separador com 1–2 dígitos depois.
    const limpo = /[.,]\d{1,2}$/.test(m) ? m.replace(/[.,](\d{1,2})$/, 'D$1').replace(/[.,]/g, '').replace('D', '.') : m.replace(/[.,]/g, '');
    const v = Number(limpo);
    if (!Number.isFinite(v)) return m;
    const a = Math.abs(v);
    const [d, suf] = a >= 1e9 ? [1e9, 'B'] : a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'K'] : [1, ''];
    if (!suf) return m;
    const x = v / d;
    return `${Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1).replace(/\.0$/, '')}${suf}`;
  });
}

function cortarNaLargura(texto, largura, tamanho, opcoes, comReticencias) {
  if (larguraDoTexto(texto, tamanho, opcoes) <= largura) return texto;
  const sufixo = comReticencias ? '…' : '';
  let ini = 0;
  let fim = texto.length;
  while (ini < fim) {
    const meio = Math.ceil((ini + fim) / 2);
    if (larguraDoTexto(texto.slice(0, meio).trimEnd() + sufixo, tamanho, opcoes) <= largura) ini = meio;
    else fim = meio - 1;
  }
  return texto.slice(0, Math.max(1, ini)).trimEnd() + sufixo;
}

function quebrarEmLinhas(texto, largura, tamanho, opcoes, maximo) {
  const palavras = String(texto).split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const t = atual ? `${atual} ${p}` : p;
    if (!atual || larguraDoTexto(t, tamanho, opcoes) <= largura) atual = t;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  const saida = linhas.map((l) => cortarNaLargura(l, largura, tamanho, opcoes, true));
  if (saida.length > maximo) {
    const resto = saida.slice(maximo - 1).join(' ');
    saida.length = maximo - 1;
    saida.push(cortarNaLargura(resto, largura, tamanho, opcoes, true));
  }
  return saida;
}

/**
 * Ajusta UM rótulo.
 * @param {object} p
 * @param {string} p.nome      a parte "nome" (nunca abreviada)
 * @param {string[]} [p.extras] partes extras já formatadas (valor, percentual)
 * @param {number} p.tamanho   fonte preferida (px)
 * @param {number} [p.largura] largura disponível (px); 0/Infinity = sem limite
 * @param {object} p.tl        `lerTextoLongo(config)`
 * @param {{negrito?:boolean}} [p.estilo]
 * @param {(nome:string, extras:string[])=>string} [p.formatar]
 * @returns {{linhas:string[], tamanho:number, largura:number, completo:string, cortado:boolean}}
 */
export function ajustarRotulo({ nome, extras = [], tamanho, largura = 0, tl, estilo = {}, formatar = null }) {
  const sep = tl.separador;
  // `formatar(nome, extras)` permite manter um formato antigo ("nome (valor)").
  const juntar = formatar || ((n, e) => [n, ...e].join(sep));
  const limpos = extras.filter(Boolean).map((e) => trocarMoeda(e, tl));
  const completo = juntar(String(nome), limpos);
  let texto = tl.modo === 'soNome' ? String(nome) : completo;
  if (tl.modo === 'abreviar') texto = juntar(String(nome), limpos.map(abreviarNumeros));
  const limite = tl.larguraMaxima > 0 ? Math.min(tl.larguraMaxima, largura > 0 ? largura : Infinity) : largura > 0 ? largura : Infinity;
  const mede = (t, tam) => larguraDoTexto(t, tam, estilo);
  let linhas = [texto];
  let tam = tamanho;

  switch (tl.modo) {
    case 'quebrar':
      if (Number.isFinite(limite)) linhas = quebrarEmLinhas(texto, limite, tam, estilo, tl.linhas);
      break;
    case 'reduzir':
      while (Number.isFinite(limite) && mede(texto, tam) > limite && tam > tl.fonteMinima) tam -= 0.5;
      if (Number.isFinite(limite) && mede(texto, tam) > limite) linhas = [cortarNaLargura(texto, limite, tam, estilo, true)];
      break;
    case 'reticencias': {
      let t = texto;
      // Mesmo corte de antes (`truncar`: N caracteres contando o "…").
      if (tl.truncarEmCaracteres > 0 && t.length > tl.truncarEmCaracteres) {
        t = `${t.slice(0, Math.max(1, tl.truncarEmCaracteres - 1)).trimEnd()}…`;
      }
      linhas = [Number.isFinite(limite) ? cortarNaLargura(t, limite, tam, estilo, true) : t];
      break;
    }
    case 'cortar':
      linhas = [Number.isFinite(limite) ? cortarNaLargura(texto, limite, tam, estilo, false) : texto];
      break;
    case 'abreviar':
    case 'soNome':
    case 'inteiro':
    default:
      // "inteiro": NUNCA corta — quem desenha reserva a largura. Só a
      // largura máxima explícita (se o usuário pôs) quebra a linha.
      if (tl.larguraMaxima > 0 && mede(texto, tam) > tl.larguraMaxima) {
        linhas = quebrarEmLinhas(texto, tl.larguraMaxima, tam, estilo, 99);
      }
      break;
  }
  const larguraFinal = Math.max(0, ...linhas.map((l) => mede(l, tam)));
  return { linhas, tamanho: tam, largura: larguraFinal, completo, cortado: linhas.join(' ') !== completo };
}

/** CSS de "Permitir selecionar texto" desligado (padrão). */
export function cssDeSelecao(seletor, tl) {
  return tl.selecionavel ? '' : `${seletor},${seletor} *{-webkit-user-select:none;user-select:none;}`;
}
