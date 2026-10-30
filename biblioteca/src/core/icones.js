/**
 * icones.js — registro ÚNICO de ícones em SVG (melhorias v3, 5.14/5.14b).
 *
 * Ícones são desenhados numa grade 24×24, em traço (variante "contorno")
 * e, opcionalmente, com uma variante "preenchida". Os módulos que mostram
 * ícones (cartao_multivalor, tabela, árvores, organograma, kpi_vivo) pedem
 * o ícone AQUI, pelo id — nunca importam um pacote temático diretamente.
 * Pacotes (`src/packs/<nome>/`) registram os seus ícones com prefixo
 * (`cafe_...`) via `core/pacotes.js`.
 *
 * O conjunto base é genérico e desenhado à mão para esta biblioteca.
 */

import { criarSvgEl } from './dom.js';

const registro = new Map();

/**
 * Registra (ou substitui) um ícone.
 * @param {string} id
 * @param {{contorno:string, preenchido?:string, rotulo?:string, pacote?:string|null}} def
 *   `contorno` e `preenchido` são o atributo `d` de um <path> (24×24).
 */
export function registrarIcone(id, def) {
  registro.set(id, { rotulo: def.rotulo || id, pacote: def.pacote || null, contorno: def.contorno, preenchido: def.preenchido || null });
}

/** Ícones disponíveis (para listas do painel). `pacotes` = pacotes ligados. */
export function listarIcones({ pacotes = null } = {}) {
  const saida = [];
  for (const [id, def] of registro) {
    if (def.pacote && pacotes && !pacotes.includes(def.pacote)) continue;
    saida.push({ id, rotulo: def.rotulo, pacote: def.pacote });
  }
  return saida;
}

export function existeIcone(id) {
  return registro.has(id);
}

/**
 * Desenha um ícone. Um valor salvo de um pacote DESLIGADO continua sendo
 * desenhado (o valor salvo vence): o registro guarda todos os ícones; o
 * pacote só controla o que aparece nas listas do painel.
 * @returns {SVGElement|null}
 */
export function desenharIcone({ pai, id, lado = 18, cor = 'currentColor', estilo = 'contorno', classe = 'bl-icone' }) {
  const def = registro.get(id);
  if (!def) return null;
  const svg = criarSvgEl('svg', {
    pai,
    classe,
    atributos: { width: lado, height: lado, viewBox: '0 0 24 24', 'aria-hidden': 'true', 'data-icone': id },
  });
  const cheio = estilo === 'preenchido' && def.preenchido;
  criarSvgEl('path', {
    pai: svg,
    atributos: cheio
      ? { d: def.preenchido, fill: cor, stroke: 'none' }
      : { d: def.contorno, fill: 'none', stroke: cor, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
  });
  return svg;
}

// ---------------- Conjunto base (genérico) ----------------
const BASE = {
  seta: ['Seta', 'M5 12h14M13 6l6 6-6 6'],
  estrela: ['Estrela', 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z', 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z'],
  carrinho: ['Carrinho', 'M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01'],
  pessoa: ['Pessoa', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7'],
  moeda: ['Moeda', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11'],
  grafico: ['Gráfico', 'M4 20V10M10 20V4M16 20v-7M22 20H2'],
  relogio: ['Relógio', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'],
  alerta: ['Alerta', 'M12 3l10 18H2zM12 10v5M12 18v.01', 'M12 2.5L22.5 21h-21zM11 10h2v5h-2zM11 17h2v2h-2z'],
  alvo: ['Alvo', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'],
  check: ['Confirmado', 'M4 12l5 5L20 6'],
  xis: ['Recusado', 'M6 6l12 12M18 6L6 18'],
  coracao: ['Coração', 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  casa: ['Casa', 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6'],
  sobe: ['Sobe', 'M12 19V5M6 11l6-6 6 6'],
  desce: ['Desce', 'M12 5v14M6 13l6 6 6-6'],
};
for (const [id, [rotulo, contorno, preenchido]] of Object.entries(BASE)) registrarIcone(id, { rotulo, contorno, preenchido });
