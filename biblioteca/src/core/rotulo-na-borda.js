/**
 * rotulo-na-borda.js — o rótulo do valor EXTREMO tem de caber
 * (melhorias v3, 5.13b). Cálculo de margem compartilhado pelos gráficos
 * que escrevem o valor ao lado do ponto/barra (dot_plot_denso e os da
 * auditoria que reproduziram o defeito).
 *
 * Antes, o rótulo do maior valor ficava à direita do ponto encostado na
 * borda da escala e o contêiner cortava o excesso (sobrava "74.0" de
 * "74.05M (21.3%)"). A largura do texto é ESTIMADA pela função única
 * `medida-texto.js` (a mesma dos testes de geometria).
 *
 * "Rótulo na borda" (`rotuloNaBorda`):
 *   inverter (padrão) — o rótulo que não cabe à direita vai para a
 *                       esquerda do ponto;
 *   folga             — a escala reserva à direita a largura do maior
 *                       rótulo (todos ficam à direita);
 *   reduzir           — a fonte diminui até 7 px; se ainda não couber,
 *                       inverte.
 * Vale para qualquer valor salvo (é defeito, 4.1).
 */

import { larguraDoTexto } from './medida-texto.js';
import { listaDeValores } from './options-kit.js';

export const MODOS_DA_BORDA = [
  { rotulo: 'Inverter para a esquerda do ponto', valor: 'inverter' },
  { rotulo: 'Reservar folga na escala', valor: 'folga' },
  { rotulo: 'Reduzir a fonte', valor: 'reduzir' },
];

export function opcaoDeRotuloNaBorda(secao = 'Rótulos') {
  return {
    rotuloNaBorda: {
      type: 'string',
      label: 'Rótulo na borda',
      section: secao,
      display: 'select',
      default: 'inverter',
      values: listaDeValores(MODOS_DA_BORDA),
    },
  };
}

/** Folga à direita que o modo "folga" reserva (px). */
export function folgaParaRotulos(textos, tamanho, { afastamento = 8, negrito = false } = {}) {
  return Math.max(0, ...textos.map((t) => larguraDoTexto(t, tamanho, { negrito }))) + afastamento + 2;
}

/**
 * Decide onde o rótulo de um ponto fica.
 * @param {object} p
 * @param {number} p.x posição do ponto (px, dentro da área)
 * @param {number} p.limite largura da área (px)
 * @param {string} p.texto
 * @param {number} p.tamanho fonte (px)
 * @param {number} p.afastamento distância entre ponto e texto (px)
 * @param {string} [p.modo] inverter | folga | reduzir
 * @returns {{lado:'direita'|'esquerda', tamanho:number, x0:number, x1:number}}
 */
export function posicaoDoRotuloNaBorda({ x, limite, texto, tamanho, afastamento = 6, modo = 'inverter', negrito = false }) {
  let t = tamanho;
  const largura = (tam) => larguraDoTexto(texto, tam, { negrito });
  const cabeDireita = (tam) => x + afastamento + largura(tam) <= limite;
  if (!cabeDireita(t) && modo === 'reduzir') {
    while (!cabeDireita(t) && t > 7) t -= 0.5;
  }
  if (cabeDireita(t) || modo === 'folga') {
    return { lado: 'direita', tamanho: t, x0: x + afastamento, x1: x + afastamento + largura(t) };
  }
  return { lado: 'esquerda', tamanho: t, x0: x - afastamento - largura(t), x1: x - afastamento };
}
