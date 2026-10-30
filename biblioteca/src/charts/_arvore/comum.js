/**
 * comum.js — o que `arvores_multiplas` e `org_chart` compartilham
 * (melhorias v3, 5.8 a 5.11). As opções têm os MESMOS ids e rótulos nos
 * dois gráficos.
 *
 *   - Botões "Expandir tudo", "Colapsar tudo" e "Centralizar" (barra única).
 *   - Animação de abrir/fechar (5.9): os filhos SAEM do pai ao abrir e
 *     VOLTAM para ele ao fechar (deslizando e esmaecendo); irmãos e níveis
 *     abaixo deslizam da posição antiga para a nova (técnica "FLIP": guarda
 *     onde cada nó estava, desenha no lugar novo, aplica o deslocamento
 *     inverso e solta com transição). Só anima depois de abrir/fechar — nada
 *     anima por rolagem, movimento do mouse ou atualização de dados.
 *     Respeita "Ativar animações" e prefers-reduced-motion.
 *   - Centralizar (5.10): alinhamento horizontal/vertical, deslocamento
 *     fino, o que centralizar (desenho, raiz ou nó selecionado) e quando
 *     (ao carregar, a cada abrir/fechar, ou só pelo botão). Desenho maior
 *     que a área: rola nas duas direções, sem cortar o lado esquerdo.
 *   - Texto longo (5.11): `core/texto-longo.js`.
 *   - "Permitir selecionar texto" (padrão desligado): user-select none.
 */

import { criarEl } from '../../core/dom.js';
import { listaDeValores } from '../../core/options-kit.js';
import { opcoesDeTextoLongo } from '../../core/texto-longo.js';

export const CURVAS_CSS = {
  linear: 'linear',
  saida: 'cubic-bezier(.2,.7,.3,1)',
  entrada: 'cubic-bezier(.6,0,.9,.4)',
  ambos: 'ease-in-out',
};

/** Opções comuns (5.8–5.11). */
export function opcoesComunsDasArvores({ comCadaArvore = false } = {}) {
  const anim = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: 'Animação', default: def, ...extra });
  const cen = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: 'Centralizar', default: def, ...extra });
  const saida = {
    // 5.9 — abrir e fechar
    animarExpandir: anim('boolean', 'Animar abrir/fechar', true),
    duracaoDeExpandir: anim('number', 'Duração abrir/fechar (ms)', 350),
    movimentoDeExpandir: anim('string', 'Movimento abrir/fechar', 'saida', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Suave na saída', valor: 'saida' },
        { rotulo: 'Suave nos dois lados', valor: 'ambos' },
        { rotulo: 'Suave na entrada', valor: 'entrada' },
        { rotulo: 'Linear', valor: 'linear' },
      ]),
    }),
    cascataDeExpandir: anim('number', 'Atraso entre filhos (ms)', 0),
    respeitarMenosMovimento: anim('boolean', 'Respeitar "menos movimento"', true),
    // 5.10 — centralizar
    alinhamentoHorizontalDaArvore: cen('string', 'Horizontal', 'centro', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Esquerda', valor: 'esquerda' },
        { rotulo: 'Centro', valor: 'centro' },
        { rotulo: 'Direita', valor: 'direita' },
      ]),
    }),
    alinhamentoVerticalDaArvore: cen('string', 'Vertical', 'meio', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Topo', valor: 'topo' },
        { rotulo: 'Meio', valor: 'meio' },
        { rotulo: 'Base', valor: 'base' },
      ]),
    }),
    deslocamentoXDaArvore: cen('number', 'Deslocamento X (px)', 0),
    deslocamentoYDaArvore: cen('number', 'Deslocamento Y (px)', 0),
    oQueCentralizar: cen('string', 'O que centralizar', 'desenho', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'O desenho inteiro', valor: 'desenho' },
        { rotulo: 'A raiz', valor: 'raiz' },
        { rotulo: 'O nó selecionado', valor: 'selecionado' },
      ]),
    }),
    quandoCentralizar: cen('string', 'Quando', 'carregar', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Ao carregar (e no botão)', valor: 'carregar' },
        { rotulo: 'A cada abrir/fechar', valor: 'sempre' },
        { rotulo: 'Só no botão "Centralizar"', valor: 'botao' },
      ]),
    }),
    mostrarBotaoCentralizar: cen('boolean', 'Botão "Centralizar"', true),
    // Botões de expandir (mesmo id e rótulo da v2 no arvores_multiplas).
    mostrarBotoesDeExpandir: {
      type: 'boolean',
      label: 'Mostrar botões "Expandir tudo" e "Colapsar tudo"',
      section: 'Interação',
      default: true,
    },
    // 5.11 — texto longo
    ...opcoesDeTextoLongo({ secao: 'Texto longo' }),
  };
  if (comCadaArvore) saida.centralizarCadaArvore = cen('boolean', 'Cada árvore na célula', true);
  return saida;
}

/** Barra de botões (Expandir tudo / Colapsar tudo / Centralizar). */
export function criarBarraDaArvore({ ctx, pai, config, tema, aoExpandir, aoColapsar, aoCentralizar }) {
  const comExpandir = config.mostrarBotoesDeExpandir !== false && aoExpandir;
  const comCentro = config.mostrarBotaoCentralizar !== false && aoCentralizar;
  if (!comExpandir && !comCentro) return null;
  const barra = criarEl('div', { classe: 'am-barra', pai });
  const botao = (texto, acao, classe) => {
    const b = criarEl('button', { pai: barra, texto, classe });
    b.type = 'button';
    b.style.color = tema.texto;
    b.style.borderColor = tema.borda;
    ctx.eventos.on(b, 'click', (ev) => {
      ev.stopPropagation();
      acao();
    });
    return b;
  };
  if (comExpandir) {
    botao('Expandir tudo', aoExpandir, 'am-expandir');
    botao('Colapsar tudo', aoColapsar, 'am-colapsar');
  }
  if (comCentro) botao('Centralizar', aoCentralizar, 'am-centralizar');
  return barra;
}

export const CSS_BARRA = `
.am-barra{display:flex;gap:6px;padding:4px 8px 0;flex:0 0 auto;}
.am-barra button{padding:2px 8px;border-radius:4px;border:1px solid;background:transparent;cursor:pointer;
  font:inherit;font-size:11px;}
`;

/** A animação de abrir/fechar está ligada? */
export function animacaoDeExpandir(config) {
  const reduzir =
    config.respeitarMenosMovimento !== false &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ligada = config.animacaoAtiva !== false && config.animarExpandir !== false && !reduzir;
  const duracao = Math.max(0, Math.min(3000, Number.isFinite(Number(config.duracaoDeExpandir)) ? Number(config.duracaoDeExpandir) : 350));
  return {
    ligada: ligada && duracao > 0,
    duracao,
    curva: CURVAS_CSS[config.movimentoDeExpandir] || CURVAS_CSS.saida,
    cascata: Math.max(0, Number(config.cascataDeExpandir) || 0),
  };
}

/**
 * Animação FLIP de abrir/fechar.
 *
 * @param {object} p
 * @param {object} p.ctx
 * @param {Map} p.anteriores chave → {x, y, el, pai} do desenho ANTERIOR
 * @param {Array<{chave:string, el:Element, x:number, y:number, pai:string|null}>} p.atuais
 * @param {Element} p.camadaDosFantasmas onde pôr os nós que estão saindo
 * @param {object} p.anim `animacaoDeExpandir(config)`
 * @param {string|null} p.alternado chave do nó aberto/fechado (só anima então)
 * @returns {Map} as posições atuais (para o próximo desenho)
 */
export function animarAbrirFechar({ ctx, anteriores, atuais, camadaDosFantasmas, anim, alternado }) {
  const posicoes = new Map(atuais.map((a) => [a.chave, a]));
  if (!anim.ligada || !alternado || !anteriores || !anteriores.size) return posicoes;
  const transicao = `transform ${anim.duracao}ms ${anim.curva}, opacity ${anim.duracao}ms ${anim.curva}`;
  const soltar = (el, atraso) => {
    ctx.agendarQuadro(() => {
      el.style.transition = transicao;
      if (atraso) el.style.transitionDelay = `${atraso}ms`;
      el.style.transform = '';
      el.style.opacity = '';
    });
    ctx.agendarTimer(() => {
      el.style.transition = '';
      el.style.transitionDelay = '';
      el.classList.remove('bl-entrando', 'bl-movendo');
    }, anim.duracao + 40);
  };
  // Quem continua: desliza da posição antiga. Quem entra: sai do pai.
  let ordem = 0;
  for (const a of atuais) {
    const antes = anteriores.get(a.chave);
    if (antes) {
      const dx = antes.x - a.x;
      const dy = antes.y - a.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      a.el.classList.add('bl-movendo');
      a.el.style.transition = 'none';
      a.el.style.transform = `translate(${dx}px, ${dy}px)`;
      soltar(a.el, 0);
    } else {
      // Nasce no lugar ANTIGO do pai (ou no atual, se o pai também é novo).
      let origem = null;
      for (let p = a.pai; p && !origem; p = (posicoes.get(p) || {}).pai) origem = anteriores.get(p) || null;
      const o = origem || posicoes.get(a.pai) || a;
      a.el.classList.add('bl-entrando');
      a.el.style.transition = 'none';
      a.el.style.transform = `translate(${o.x - a.x}px, ${o.y - a.y}px)`;
      a.el.style.opacity = '0';
      soltar(a.el, anim.cascata * ordem);
      ordem += 1;
    }
  }
  // Quem sai: o elemento antigo volta para o pai (posição nova) e some.
  for (const [chave, antes] of anteriores) {
    if (posicoes.has(chave) || !antes.el || !camadaDosFantasmas) continue;
    let destino = null;
    for (let p = antes.pai; p && !destino; p = (anteriores.get(p) || {}).pai) destino = posicoes.get(p) || null;
    if (!destino) continue;
    const el = antes.el;
    // O fantasma não é mais um nó: sem classe de nó nem marca de item
    // (hover, testes e cliques não o enxergam).
    for (const n of [el, ...el.querySelectorAll('*')]) {
      n.removeAttribute('data-item');
      if (n.classList) n.classList.remove('av-no', 'av-no-grupo', 'oc-cartao', 'oc-caixa', 'oc-nome', 'av-rotulo');
    }
    el.classList.add('bl-saindo');
    el.style.pointerEvents = 'none';
    el.style.transition = 'none';
    el.style.transform = '';
    el.style.opacity = '1';
    camadaDosFantasmas.appendChild(el);
    ctx.agendarQuadro(() => {
      el.style.transition = transicao;
      el.style.transform = `translate(${destino.x - antes.x}px, ${destino.y - antes.y}px)`;
      el.style.opacity = '0';
    });
    ctx.agendarTimer(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, anim.duracao + 40);
  }
  return posicoes;
}

/**
 * Centraliza o desenho dentro de uma área rolável.
 *
 * @param {object} p
 * @param {{largura:number, altura:number}} p.area  tamanho visível
 * @param {{largura:number, altura:number}} p.desenho tamanho do conteúdo
 * @param {{x:number, y:number}|null} p.alvo ponto a centralizar (coord. do desenho); null = o desenho
 * @param {object} p.config
 * @returns {{offsetX:number, offsetY:number, scrollLeft:number, scrollTop:number,
 *            largura:number, altura:number}} deslocamento do conteúdo (quando
 *   cabe) e rolagem (quando não cabe); largura/altura do elemento rolável.
 */
export function planoDeCentralizacao({ area, desenho, alvo = null, config = {} }) {
  const h = config.alinhamentoHorizontalDaArvore || 'centro';
  const v = config.alinhamentoVerticalDaArvore || 'meio';
  const dx = Number(config.deslocamentoXDaArvore) || 0;
  const dy = Number(config.deslocamentoYDaArvore) || 0;
  const eixo = (visivel, total, pos, alinh, fino, ponto) => {
    const fator = alinh === 'esquerda' || alinh === 'topo' ? 0 : alinh === 'direita' || alinh === 'base' ? 1 : 0.5;
    if (total <= visivel) {
      // Cabe: desloca o conteúdo (sem rolagem), nunca para fora da área.
      let offset = (visivel - total) * fator + fino;
      if (ponto !== null && fator === 0.5) offset = visivel / 2 - ponto + fino;
      offset = Math.max(0, Math.min(visivel - total, offset));
      return { offset, scroll: 0, tamanho: visivel };
    }
    // Não cabe: o conteúdo começa em 0 (nada cortado à esquerda) e a
    // rolagem leva o alvo para a posição pedida.
    const referencia = ponto !== null ? ponto : total * fator;
    const scroll = Math.max(0, Math.min(total - visivel, referencia - visivel * fator - fino));
    return { offset: 0, scroll, tamanho: total };
  };
  const ex = eixo(area.largura, desenho.largura, 0, h, dx, alvo ? alvo.x : null);
  const ey = eixo(area.altura, desenho.altura, 0, v, dy, alvo ? alvo.y : null);
  return {
    offsetX: ex.offset,
    offsetY: ey.offset,
    scrollLeft: ex.scroll,
    scrollTop: ey.scroll,
    largura: ex.tamanho,
    altura: ey.tamanho,
  };
}

/** Deve centralizar neste desenho? */
export function deveCentralizar(config, { primeiro, alternou, botao }) {
  if (botao) return true;
  const quando = config.quandoCentralizar || 'carregar';
  if (quando === 'botao') return false;
  if (quando === 'sempre') return primeiro || alternou;
  return primeiro;
}

export const CSS_ANIMACAO_ARVORE = `
.bl-entrando,.bl-movendo,.bl-saindo{will-change:transform,opacity;}
.am-celula{box-sizing:border-box;overflow:auto;}
.am-sem-selecao,.am-sem-selecao *{-webkit-user-select:none;user-select:none;}
`;
