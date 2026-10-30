/**
 * legend.js — legenda reutilizável.
 *
 * Suporta:
 *  - legenda categórica (quadradinho + rótulo, opcionalmente com valor);
 *  - legenda contínua (barra de gradiente com mínimo/meio/máximo);
 *  - clique para ligar/desligar séries (quando `interativa`);
 *  - posição acima, abaixo, à esquerda ou à direita.
 *
 * A legenda devolve o espaço que ocupou, para o gráfico descontar da área
 * de desenho.
 */

import { criarEl, limpar, definirTexto } from './dom.js';

const CSS_LEGENDA = `
.bl-legenda{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;font-size:11px;
  padding:4px 8px;user-select:none;}
.bl-legenda.bl-vertical{flex-direction:column;align-items:flex-start;flex-wrap:nowrap;overflow:auto;}
.bl-legenda-item{display:flex;align-items:center;gap:5px;cursor:default;line-height:1.4;}
.bl-legenda-item.bl-clicavel{cursor:pointer;}
.bl-legenda-item.bl-desligado{opacity:.35;text-decoration:line-through;}
.bl-legenda-chip{width:10px;height:10px;border-radius:2px;flex:0 0 auto;}
.bl-legenda-valor{opacity:.7;margin-left:3px;}
.bl-legenda-gradiente{height:10px;border-radius:3px;flex:1 1 120px;min-width:100px;}
.bl-legenda-escala{display:flex;align-items:center;gap:8px;width:100%;}
`;

/**
 * Desenha a legenda dentro de um contêiner próprio.
 *
 * @param {object} params
 * @param {Element} params.hospedeiro contêiner onde a legenda é criada
 * @param {Array<{chave:string, rotulo:string, cor:string, valor?:string}>} params.itens
 * @param {object} params.config config da visualização
 * @param {object} params.tema tema resolvido
 * @param {Set<string>} [params.desligados] chaves desligadas (estado do gráfico)
 * @param {Function} [params.aoAlternar] callback(chave, desligadosAtualizado)
 * @param {{tipo:'valor', legenda:Array<{valor:number,cor:string}>, formatar:Function}} [params.escalaContinua]
 */
export function desenharLegenda({
  hospedeiro,
  itens = [],
  config = {},
  tema,
  desligados = new Set(),
  aoAlternar = null,
  escalaContinua = null,
  eventos = null,
}) {
  if (config.mostrarLegenda === false) return { largura: 0, altura: 0, elemento: null };

  if (!hospedeiro.querySelector('style[data-estilo="bl-legenda"]')) {
    const style = document.createElement('style');
    style.setAttribute('data-estilo', 'bl-legenda');
    style.textContent = CSS_LEGENDA;
    hospedeiro.appendChild(style);
  }

  const posicao = config.posicaoDaLegenda || 'direita';
  const vertical = posicao === 'direita' || posicao === 'esquerda';

  const el = criarEl('div', { classe: `bl-legenda${vertical ? ' bl-vertical' : ''}`, pai: hospedeiro });
  el.style.color = tema.texto;
  el.style.fontSize = `${Number(config.tamanhoDaLegenda) || 11}px`;
  el.style.fontFamily = tema.fonte;

  // Legenda contínua (cor por valor)
  if (escalaContinua && escalaContinua.tipo === 'valor' && escalaContinua.legenda) {
    const caixa = criarEl('div', { classe: 'bl-legenda-escala', pai: el });
    const paradas = escalaContinua.legenda;
    const formatar = escalaContinua.formatar || ((v) => String(Math.round(v)));
    criarEl('span', { texto: formatar(paradas[0].valor), pai: caixa });
    const barra = criarEl('div', { classe: 'bl-legenda-gradiente', pai: caixa });
    const cores = paradas.map((p) => p.cor).join(', ');
    barra.style.background = `linear-gradient(to right, ${cores})`;
    criarEl('span', { texto: formatar(paradas[paradas.length - 1].valor), pai: caixa });
    return medirLegenda(el, vertical);
  }

  // Legenda categórica
  const interativa = config.legendaInterativa !== false && typeof aoAlternar === 'function';
  const mostrarValores = !!config.mostrarValoresNaLegenda;

  for (const item of itens) {
    const desligado = desligados.has(item.chave);
    const linha = criarEl('div', {
      classe: `bl-legenda-item${interativa ? ' bl-clicavel' : ''}${desligado ? ' bl-desligado' : ''}`,
      pai: el,
    });
    const chip = criarEl('span', { classe: 'bl-legenda-chip', pai: linha });
    chip.style.background = item.cor;
    criarEl('span', { texto: item.rotulo, pai: linha });
    if (mostrarValores && item.valor !== undefined) {
      criarEl('span', { classe: 'bl-legenda-valor', texto: item.valor, pai: linha });
    }

    if (interativa) {
      linha.setAttribute('role', 'button');
      linha.setAttribute('tabindex', '0');
      const alternar = () => {
        const novo = new Set(desligados);
        if (novo.has(item.chave)) novo.delete(item.chave);
        else novo.add(item.chave);
        aoAlternar(item.chave, novo);
      };
      if (eventos) {
        eventos.on(linha, 'click', alternar);
        eventos.on(linha, 'keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            alternar();
          }
        });
      } else {
        linha.addEventListener('click', alternar);
      }
    }
  }

  return medirLegenda(el, vertical);
}

function medirLegenda(el, vertical) {
  const largura = vertical ? el.offsetWidth || 120 : 0;
  const altura = vertical ? 0 : el.offsetHeight || 24;
  return { largura, altura, elemento: el };
}

/**
 * Calcula as margens que a legenda consome na área do gráfico, conforme a
 * posição escolhida. Devolve `{topo, direita, baixo, esquerda}`.
 */
export function margensDaLegenda(config = {}, tamanho = { largura: 0, altura: 0 }) {
  if (config.mostrarLegenda === false) return { topo: 0, direita: 0, baixo: 0, esquerda: 0 };
  const posicao = config.posicaoDaLegenda || 'direita';
  switch (posicao) {
    case 'esquerda':
      return { topo: 0, direita: 0, baixo: 0, esquerda: tamanho.largura };
    case 'acima':
      return { topo: tamanho.altura, direita: 0, baixo: 0, esquerda: 0 };
    case 'abaixo':
      return { topo: 0, direita: 0, baixo: tamanho.altura, esquerda: 0 };
    case 'direita':
    default:
      return { topo: 0, direita: tamanho.largura, baixo: 0, esquerda: 0 };
  }
}

/** CSS da legenda, para gráficos que montam a própria estrutura. */
export function cssDaLegenda() {
  return CSS_LEGENDA;
}

/**
 * Monta um layout com área de gráfico + legenda posicionada, devolvendo os
 * dois contêineres já dimensionados por flexbox.
 */
export function criarLayoutComLegenda(raiz, config = {}) {
  limpar(raiz);
  const posicao = config.posicaoDaLegenda || 'direita';
  const mostrar = config.mostrarLegenda !== false;

  const wrapper = criarEl('div', { pai: raiz });
  wrapper.style.display = 'flex';
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.style.overflow = 'hidden';

  let direcao = 'row';
  if (posicao === 'acima') direcao = 'column-reverse';
  else if (posicao === 'abaixo') direcao = 'column';
  else if (posicao === 'esquerda') direcao = 'row-reverse';
  wrapper.style.flexDirection = direcao;

  const areaGrafico = criarEl('div', { pai: wrapper });
  areaGrafico.style.flex = '1 1 auto';
  areaGrafico.style.position = 'relative';
  areaGrafico.style.minWidth = '0';
  areaGrafico.style.minHeight = '0';

  const areaLegenda = criarEl('div', { pai: wrapper });
  areaLegenda.style.flex = '0 0 auto';
  areaLegenda.style.display = mostrar ? 'block' : 'none';
  if (posicao === 'direita' || posicao === 'esquerda') {
    areaLegenda.style.maxWidth = '38%';
    areaLegenda.style.maxHeight = '100%';
    areaLegenda.style.overflow = 'auto';
  } else {
    areaLegenda.style.maxHeight = '35%';
    areaLegenda.style.overflow = 'auto';
  }

  return { areaGrafico, areaLegenda };
}
