/**
 * animate.js — motor de animação simples baseado em requestAnimationFrame.
 *
 * Por que não usar transições de CSS: precisamos animar valores (contadores,
 * ângulos, caminhos) e não só propriedades de estilo, e precisamos conseguir
 * CANCELAR tudo quando a visualização atualiza (senão sobram timers rodando).
 *
 * Respeita SEMPRE `prefers-reduced-motion` (acessibilidade, seção 7): quando
 * o usuário pede menos movimento, as animações vão direto ao estado final.
 */

import { preferindoMenosMovimento, proximoQuadro, cancelarQuadro } from './dom.js';

/** Funções de suavização (easing). t vai de 0 a 1. */
export const SUAVIZACOES = {
  linear: (t) => t,
  entrada: (t) => t * t * t,
  saida: (t) => 1 - Math.pow(1 - t, 3),
  ambos: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  elastica: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },
  quique: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

export function suavizacaoPorNome(nome) {
  return SUAVIZACOES[nome] || SUAVIZACOES.saida;
}

/**
 * Lê as opções de animação do painel e devolve um objeto normalizado.
 * `forcarDesligado` serve para a primeira carga vs. atualizações.
 */
export function opcoesDeAnimacao(config = {}, { primeiraRenderizacao = true } = {}) {
  const menosMovimento = preferindoMenosMovimento();
  const ligada =
    config.animacaoAtiva !== false &&
    !menosMovimento &&
    (config.quandoAnimar !== 'primeira' || primeiraRenderizacao);

  return {
    ligada,
    menosMovimento,
    duracao: ligada ? Math.max(0, Number(config.duracaoDaAnimacao ?? 600)) : 0,
    atraso: ligada ? Math.max(0, Number(config.atrasoDaAnimacao ?? 0)) : 0,
    cascata: ligada ? Math.max(0, Number(config.cascataDaAnimacao ?? 20)) : 0,
    suavizacao: suavizacaoPorNome(config.suavizacaoDaAnimacao),
    contador: ligada && config.contadorAnimado !== false,
  };
}

/**
 * Cria um controlador de animações que sabe cancelar tudo de uma vez.
 * O `define-viz` já cancela quadros agendados entre atualizações; este
 * controlador existe para os gráficos que animam várias coisas juntas.
 */
export function criarControladorDeAnimacao() {
  const ativos = new Set();
  let destruido = false;

  function animar({ de = 0, para = 1, duracao = 600, atraso = 0, suavizacao = SUAVIZACOES.saida, aoAtualizar, aoTerminar }) {
    if (destruido) return () => {};
    if (duracao <= 0) {
      if (aoAtualizar) aoAtualizar(para, 1);
      if (aoTerminar) aoTerminar();
      return () => {};
    }

    let quadro = null;
    let inicio = null;
    let cancelado = false;

    const passo = (agora) => {
      if (cancelado || destruido) return;
      if (inicio === null) inicio = agora;
      const decorrido = agora - inicio - atraso;
      if (decorrido < 0) {
        quadro = proximoQuadro(passo);
        ativos.add(quadro);
        return;
      }
      const t = Math.min(1, decorrido / duracao);
      const valor = de + (para - de) * suavizacao(t);
      if (aoAtualizar) aoAtualizar(valor, t);
      if (t < 1) {
        quadro = proximoQuadro(passo);
        ativos.add(quadro);
      } else {
        if (aoTerminar) aoTerminar();
      }
    };

    quadro = proximoQuadro(passo);
    ativos.add(quadro);

    return () => {
      cancelado = true;
      if (quadro !== null) {
        cancelarQuadro(quadro);
        ativos.delete(quadro);
      }
    };
  }

  function cancelarTudo() {
    for (const q of ativos) cancelarQuadro(q);
    ativos.clear();
  }

  function destruir() {
    destruido = true;
    cancelarTudo();
  }

  return { animar, cancelarTudo, destruir };
}

/**
 * Anima um contador numérico escrevendo o texto formatado num elemento.
 * Se a animação estiver desligada, escreve o valor final na hora.
 */
export function animarContador({
  elemento,
  de = 0,
  para,
  formatar = (v) => String(Math.round(v)),
  animacao,
  controlador,
  atrasoExtra = 0,
}) {
  if (!elemento) return () => {};
  const escrever = (v) => {
    elemento.textContent = formatar(v);
  };
  if (!animacao || !animacao.ligada || !animacao.contador || animacao.duracao <= 0) {
    escrever(para);
    return () => {};
  }
  const ctrl = controlador || criarControladorDeAnimacao();
  return ctrl.animar({
    de,
    para,
    duracao: animacao.duracao,
    atraso: animacao.atraso + atrasoExtra,
    suavizacao: animacao.suavizacao,
    aoAtualizar: escrever,
  });
}

/**
 * Interpola números dentro de um objeto (útil para animar geometria).
 * Ex.: `interpolarObjeto({x:0,y:0}, {x:10,y:5})(0.5)` → `{x:5,y:2.5}`
 */
export function interpolarObjeto(de, para) {
  const chaves = Object.keys(para);
  return (t) => {
    const saida = {};
    for (const k of chaves) {
      const a = Number(de[k]);
      const b = Number(para[k]);
      saida[k] = Number.isFinite(a) && Number.isFinite(b) ? a + (b - a) * t : para[k];
    }
    return saida;
  };
}

/**
 * Comprimento aproximado de um path SVG, para animar "desenhar linha".
 * Usa `getTotalLength` quando existe (não existe em jsdom).
 */
export function comprimentoDoCaminho(elementoPath) {
  try {
    if (elementoPath && typeof elementoPath.getTotalLength === 'function') {
      return elementoPath.getTotalLength();
    }
  } catch (_) {
    /* ambiente sem layout SVG */
  }
  return 0;
}

/** Anima o traçado de um path (efeito "linha sendo desenhada"). */
export function animarTracado({ elementoPath, animacao, controlador, atrasoExtra = 0 }) {
  const comprimento = comprimentoDoCaminho(elementoPath);
  if (!elementoPath || !comprimento || !animacao || !animacao.ligada) return () => {};
  elementoPath.style.strokeDasharray = `${comprimento} ${comprimento}`;
  elementoPath.style.strokeDashoffset = String(comprimento);
  const ctrl = controlador || criarControladorDeAnimacao();
  return ctrl.animar({
    de: comprimento,
    para: 0,
    duracao: animacao.duracao,
    atraso: animacao.atraso + atrasoExtra,
    suavizacao: animacao.suavizacao,
    aoAtualizar: (v) => {
      elementoPath.style.strokeDashoffset = String(v);
    },
    aoTerminar: () => {
      elementoPath.style.strokeDasharray = '';
      elementoPath.style.strokeDashoffset = '';
    },
  });
}

/* ------------------------------------------------------------------ */
/* Animação genérica de entrada e atualização (módulo 2.7)              */
/* ------------------------------------------------------------------ */

/**
 * Interruptor GLOBAL da biblioteca: false desliga toda animação de todos
 * os gráficos no próximo build, sem mexer em painel nenhum. A opção
 * "Ativar animações" (`animacaoAtiva`) é o interruptor de cada gráfico.
 */
export const ANIMACOES_HABILITADAS = true;

/** Curvas do painel em CSS (a animação genérica usa CSS, não rAF). */
const CURVAS_CSS = {
  linear: 'linear',
  saida: 'cubic-bezier(.33,1,.68,1)',
  entrada: 'cubic-bezier(.32,0,.67,0)',
  ambos: 'cubic-bezier(.65,0,.35,1)',
  elastica: 'cubic-bezier(.34,1.56,.64,1)',
  quique: 'cubic-bezier(.34,1.8,.64,1)',
};

const CSS_ANIMACAO_GENERICA = `
@keyframes bl-surgir{from{opacity:0}to{opacity:1}}
@keyframes bl-surgir-html{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
`;

/** O que conta como "marca" para animar. */
const SELETOR_DE_MARCAS =
  'svg rect, svg path, svg circle, svg ellipse, svg polygon, svg polyline, svg line, svg text, svg image, .bl-anima';

/** Acima disso, anima o SVG inteiro de uma vez (cascata custaria caro). */
const MAXIMO_DE_MARCAS = 600;

/**
 * Por que é genérica: antes só o bar_race animava; os gráficos com a aba
 * Animação (venn, upset, árvores, organograma) declaravam as opções e não
 * animavam nada. Esta função roda DEPOIS de cada render, em todos os
 * gráficos (define-viz), e faz as marcas surgirem com a duração, o atraso,
 * a cascata e a curva escolhidos.
 *
 * Só OPACIDADE nos elementos SVG: `transform` em CSS substituiria o
 * atributo `transform` dos marcadores e rótulos (eles pulariam para a
 * origem durante a animação). Em HTML (`.bl-anima`) há também um leve
 * deslocamento.
 *
 * @returns {number} quantos elementos receberam animação
 */
export function animarEntradaGenerica(area, config = {}, { primeiraRenderizacao = true } = {}) {
  if (!area || !ANIMACOES_HABILITADAS) return 0;
  const op = opcoesDeAnimacao(config, { primeiraRenderizacao });
  if (!op.ligada || op.duracao <= 0) return 0;

  const raiz = (area.closest && area.closest('.bl-raiz')) || area;
  if (!raiz.querySelector('style[data-estilo="bl-animacao"]')) {
    const style = document.createElement('style');
    style.setAttribute('data-estilo', 'bl-animacao');
    style.textContent = CSS_ANIMACAO_GENERICA;
    raiz.appendChild(style);
  }

  const curva = CURVAS_CSS[config.suavizacaoDaAnimacao] || CURVAS_CSS.saida;
  let marcas = Array.from(area.querySelectorAll(SELETOR_DE_MARCAS));
  if (marcas.length > MAXIMO_DE_MARCAS) marcas = Array.from(area.querySelectorAll('svg, .bl-anima'));
  // A cascata não pode alongar a entrada além de ~1,5x a duração.
  const passo = marcas.length > 1 ? Math.min(op.cascata, (op.duracao * 1.5) / marcas.length) : 0;
  marcas.forEach((el, i) => {
    const nome = el.namespaceURI === 'http://www.w3.org/2000/svg' ? 'bl-surgir' : 'bl-surgir-html';
    el.style.animation = `${nome} ${op.duracao}ms ${curva} ${Math.round(op.atraso + i * passo)}ms both`;
  });
  return marcas.length;
}
