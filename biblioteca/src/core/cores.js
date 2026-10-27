/**
 * cores.js — leitura ÚNICA da aba de cores (módulo 2.2 das correções).
 *
 * Por que existe: o bloco de cores do options-kit (paleta, inverter,
 * opacidade, contorno) era declarado em 19 gráficos, mas muitos liam só
 * `coresDaPaleta(config.paleta)[0]` — "Inverter ordem das cores" e
 * "Opacidade" não tinham efeito, e `mostrarContorno`, `corDoContorno` e
 * `tracejadoDoContorno` não eram lidos por NENHUM gráfico. As funções daqui
 * são o caminho único: o gráfico pede a cor/o contorno e aplica.
 *
 * Fundo, texto, bordas e grade do tema vêm de `resolverTema` (theme.js),
 * que já lê corDeFundo/corDoTexto/corDaBorda/corDaGrade.
 */

import { coresDaPaleta } from './theme.js';
import { tracejadoPorEstilo } from './shapes.js';
import { lerBooleano, lerNumero, lerTexto } from './rotulos.js';
import { sanitizarChave } from './options-kit.js';

/** A paleta escolhida, já invertida se o usuário pediu. */
export function paletaDoConfig(config = {}) {
  const cores = coresDaPaleta(config.paleta).slice();
  if (lerBooleano(config.inverterPaleta, false)) cores.reverse();
  return cores;
}

/**
 * Cor de um item (série/categoria): a cor própria escolhida no painel
 * (opção dinâmica `<prefixo><chave>`, ex.: `cor_Norte`) se existir; senão
 * a cor da paleta pela posição.
 */
export function corDoItem(config = {}, indice = 0, chave, { prefixo = 'cor_' } = {}) {
  if (chave !== undefined && chave !== null) {
    const propria = lerTexto(config[`${prefixo}${sanitizarChave(chave)}`], '');
    if (propria) return propria;
  }
  const paleta = paletaDoConfig(config);
  return paleta[((indice % paleta.length) + paleta.length) % paleta.length];
}

/** Opacidade do preenchimento (opção "Opacidade do preenchimento"). */
export function opacidadeDoConfig(config = {}, padrao = 1) {
  return Math.max(0, Math.min(1, lerNumero(config.opacidade, padrao)));
}

/**
 * Contorno das marcas (barras, blocos, pontos): mostrar, cor, espessura e
 * estilo. `corPadrao` é a cor que o gráfico usaria sem o usuário escolher.
 */
export function lerContorno(config = {}, tema = {}, { corPadrao } = {}) {
  const espessura = Math.max(0, lerNumero(config.espessuraDoContorno, 1));
  return {
    mostrar: lerBooleano(config.mostrarContorno, true) && espessura > 0,
    cor: lerTexto(config.corDoContorno, '') || corPadrao || tema.fundo || '#FFFFFF',
    espessura,
    estilo: lerTexto(config.tracejadoDoContorno, 'solido'),
  };
}

/** Aplica o contorno num elemento SVG ou HTML. */
export function aplicarContorno(el, contorno) {
  if (!el || !contorno) return el;
  const ehSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
  if (ehSvg) {
    if (!contorno.mostrar) {
      el.setAttribute('stroke', 'none');
      el.removeAttribute('stroke-dasharray');
      return el;
    }
    el.setAttribute('stroke', contorno.cor);
    el.setAttribute('stroke-width', String(contorno.espessura));
    const traco = tracejadoPorEstilo(contorno.estilo, contorno.espessura);
    if (traco) el.setAttribute('stroke-dasharray', traco);
    else el.removeAttribute('stroke-dasharray');
  } else {
    el.style.border = contorno.mostrar
      ? `${contorno.espessura}px ${contorno.estilo === 'tracejado' ? 'dashed' : contorno.estilo === 'pontilhado' ? 'dotted' : 'solid'} ${contorno.cor}`
      : 'none';
  }
  return el;
}

/** Aplica cor de preenchimento + opacidade do painel (SVG ou HTML). */
export function aplicarPreenchimento(el, cor, config = {}, padraoOpacidade = 1) {
  if (!el) return el;
  const opacidade = opacidadeDoConfig(config, padraoOpacidade);
  if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
    el.setAttribute('fill', cor);
    el.setAttribute('fill-opacity', String(opacidade));
  } else {
    el.style.background = cor;
    el.style.opacity = String(opacidade);
  }
  return el;
}
