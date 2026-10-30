/**
 * icone-por-valor.js — "Ícone por valor" (melhorias v3, 5.14f). Genérico:
 * não é só de café. Mesma sintaxe do mapa: `valor=ícone; valor=ícone`.
 * Ex.: `TipoA=cafe_loja; TipoB=cafe_quiosque; Outro=casa`.
 * Cor por valor: `TipoA=#6F4E37; TipoB=#2F5D57`. Valor sem mapeamento usa
 * o ícone padrão (ou nenhum).
 *
 * Usado no cartao_multivalor, na tabela, nas árvores e no organograma.
 */

import { listaDeValores } from './options-kit.js';
import { listarIcones, desenharIcone, existeIcone } from './icones.js';

/** Opções (mesmos ids em todos os gráficos que usam). */
export function opcoesDeIconePorValor({ secao = 'Ícone por valor', comCampo = true } = {}) {
  const o = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
  const saida = {
    mapaDeIconesPorValor: o('string', 'Mapa (valor=ícone; …)', '', { placeholder: 'TipoA=cafe_loja; TipoB=casa' }),
    iconePadraoPorValor: o('string', 'Ícone padrão', 'nenhum', {
      display: 'select',
      values: listaDeValores([{ rotulo: 'Nenhum', valor: 'nenhum' }].concat(listarIcones().map((i) => ({ rotulo: i.rotulo, valor: i.id })))),
    }),
    coresPorValor: o('string', 'Cores (valor=#cor; …)', '', { placeholder: 'TipoA=#6F4E37' }),
  };
  if (comCampo) saida.campoDoIconePorValor = o('string', 'Campo (nome ou rótulo)', '');
  return saida;
}

function lerMapa(texto) {
  const mapa = new Map();
  for (const parte of String(texto || '').split(';')) {
    const i = parte.indexOf('=');
    if (i <= 0) continue;
    mapa.set(parte.slice(0, i).trim().toLowerCase(), parte.slice(i + 1).trim());
  }
  return mapa;
}

/**
 * @returns {(valor:any)=>{id:string, cor:string}|null}
 */
export function criarIconePorValor(config = {}) {
  const icones = lerMapa(config.mapaDeIconesPorValor);
  const cores = lerMapa(config.coresPorValor);
  const padrao = config.iconePadraoPorValor && config.iconePadraoPorValor !== 'nenhum' ? config.iconePadraoPorValor : '';
  if (!icones.size && !padrao) return null;
  return (valor) => {
    const k = String(valor ?? '').trim().toLowerCase();
    const id = icones.get(k) || padrao;
    if (!id || !existeIcone(id)) return null;
    return { id, cor: cores.get(k) || '' };
  };
}

/** Desenha o ícone do valor (ou nada). */
export function desenharIconePorValor(resolver, { pai, valor, lado = 16, corPadrao = 'currentColor', estilo = 'contorno' }) {
  if (!resolver) return null;
  const r = resolver(valor);
  if (!r) return null;
  return desenharIcone({ pai, id: r.id, lado, cor: r.cor || corPadrao, estilo, classe: 'bl-icone bl-icone-por-valor' });
}
