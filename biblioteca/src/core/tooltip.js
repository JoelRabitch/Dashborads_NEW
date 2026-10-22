/**
 * tooltip.js — tooltip flutuante, sempre com texto puro.
 *
 * SEGURANÇA: todo conteúdo entra por `textContent`/`createTextNode`. O
 * template `{{campo}}` é resolvido como texto e nunca interpretado como
 * HTML. HTML do Looker (`htmlForCell`) só aparece se o gráfico pedir
 * explicitamente e o usuário tiver ligado a opção correspondente.
 */

import { criarEl, limpar, definirTexto } from './dom.js';
import { preencherTemplate } from './format.js';

const CSS_TOOLTIP = `
.bl-tooltip{position:fixed;z-index:2147483000;pointer-events:none;max-width:320px;
  padding:6px 9px;border-radius:6px;font-size:11px;line-height:1.5;
  box-shadow:0 6px 18px rgba(15,23,42,.25);opacity:0;transition:opacity .12s ease;}
.bl-tooltip.bl-visivel{opacity:1;}
.bl-tooltip-linha{display:flex;gap:8px;justify-content:space-between;white-space:nowrap;}
.bl-tooltip-rotulo{opacity:.75;}
.bl-tooltip-valor{font-weight:600;}
.bl-tooltip-titulo{font-weight:700;margin-bottom:3px;}
.bl-tooltip-chip{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle;}
`;

/**
 * Cria um tooltip ligado a um contêiner.
 * @param {Element} hospedeiro elemento onde o <style> é injetado
 * @param {object} tema tema resolvido
 */
export function criarTooltip(hospedeiro, tema) {
  // O <style> fica no hospedeiro; o elemento em si vai no body para não ser
  // cortado por `overflow:hidden` do tile.
  if (!hospedeiro.querySelector('style[data-estilo="bl-tooltip"]')) {
    const style = document.createElement('style');
    style.setAttribute('data-estilo', 'bl-tooltip');
    style.textContent = CSS_TOOLTIP;
    hospedeiro.appendChild(style);
  }

  const el = criarEl('div', { classe: 'bl-tooltip' });
  el.style.background = tema.tooltipFundo;
  el.style.color = tema.tooltipTexto;
  el.style.fontFamily = tema.fonte;
  (document.body || hospedeiro).appendChild(el);

  let visivel = false;

  function posicionar(clientX, clientY) {
    const margem = 14;
    const larguraJanela = (typeof window !== 'undefined' && window.innerWidth) || 1024;
    const alturaJanela = (typeof window !== 'undefined' && window.innerHeight) || 768;
    const largura = el.offsetWidth || 200;
    const altura = el.offsetHeight || 60;
    let x = clientX + margem;
    let y = clientY + margem;
    if (x + largura > larguraJanela - 8) x = clientX - largura - margem;
    if (y + altura > alturaJanela - 8) y = clientY - altura - margem;
    el.style.left = `${Math.max(4, x)}px`;
    el.style.top = `${Math.max(4, y)}px`;
  }

  return {
    elemento: el,

    /**
     * Mostra o tooltip.
     * @param {{titulo?:string, linhas?:Array<{rotulo:string,valor:string,cor?:string}>,
     *          texto?:string}} conteudo
     */
    mostrar(conteudo, clientX, clientY) {
      limpar(el);
      if (conteudo.titulo) {
        criarEl('div', { classe: 'bl-tooltip-titulo', texto: conteudo.titulo, pai: el });
      }
      if (conteudo.texto) {
        // Texto livre (template do usuário): quebras de linha viram <div>s,
        // mas cada pedaço entra como texto puro.
        for (const parte of String(conteudo.texto).split('\n')) {
          criarEl('div', { texto: parte, pai: el });
        }
      }
      for (const linha of conteudo.linhas || []) {
        const l = criarEl('div', { classe: 'bl-tooltip-linha', pai: el });
        const esquerda = criarEl('span', { classe: 'bl-tooltip-rotulo', pai: l });
        if (linha.cor) {
          const chip = criarEl('span', { classe: 'bl-tooltip-chip', pai: esquerda });
          chip.style.background = linha.cor;
        }
        esquerda.appendChild(document.createTextNode(String(linha.rotulo ?? '')));
        criarEl('span', { classe: 'bl-tooltip-valor', texto: linha.valor ?? '', pai: l });
      }
      posicionar(clientX, clientY);
      if (!visivel) {
        el.classList.add('bl-visivel');
        visivel = true;
      }
    },

    mover(clientX, clientY) {
      if (visivel) posicionar(clientX, clientY);
    },

    esconder() {
      if (!visivel) return;
      el.classList.remove('bl-visivel');
      visivel = false;
    },

    destruir() {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch (_) {
        /* ignora */
      }
    },
  };
}

/**
 * Monta o conteúdo do tooltip de uma linha de dados, respeitando as opções
 * (tooltip personalizado com template, nome completo do campo, valor bruto).
 *
 * @param {object} params
 * @param {object} params.modelo modelo de dados
 * @param {object} params.linha linha crua do Looker
 * @param {object} params.config config da visualização
 * @param {string} [params.titulo] título opcional
 * @param {Array<{rotulo:string,valor:string,cor?:string}>} [params.linhasExtras]
 */
export function montarConteudoDeTooltip({ modelo, linha, config = {}, titulo, linhasExtras = [], chaveDoPivo }) {
  if (config.tooltipPersonalizado && config.modeloDeTooltip) {
    const valores = {};
    for (const campo of modelo.dimensoes.concat(modelo.medidas)) {
      valores[campo.nome] = modelo.texto(linha, campo.nome, chaveDoPivo, '');
      valores[campo.rotulo] = valores[campo.nome];
    }
    return { titulo, texto: preencherTemplate(config.modeloDeTooltip, valores), linhas: linhasExtras };
  }

  const linhas = [];
  const usarNomeCompleto = !!config.tooltipComNomeCompleto;
  for (const campo of modelo.dimensoes.concat(modelo.medidas)) {
    const texto = modelo.texto(linha, campo.nome, chaveDoPivo, '');
    if (texto === '') continue;
    const item = {
      rotulo: usarNomeCompleto ? campo.rotulo : campo.rotuloCurto,
      valor: texto,
    };
    if (config.tooltipComValorBruto) {
      const bruto = modelo.valorBruto(linha, campo.nome, chaveDoPivo);
      if (bruto !== null && bruto !== undefined && String(bruto) !== texto) {
        item.valor = `${texto} (${bruto})`;
      }
    }
    linhas.push(item);
  }
  return { titulo, linhas: linhasExtras.concat(linhas) };
}

/** Injeta o CSS do tooltip (usado quando o gráfico cria o tooltip sozinho). */
export function cssDoTooltip() {
  return CSS_TOOLTIP;
}
