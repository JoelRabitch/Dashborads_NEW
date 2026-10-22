/**
 * interaction.js — interações: arrastar, zoom, brush, busca e seleção.
 *
 * LIÇÃO IMPORTANTE JÁ APRENDIDA NA PRÁTICA (está aqui para nunca mais
 * repetir o erro): a visualização do Looker roda dentro de um <iframe>
 * pequeno e "sandboxed". Se o arraste for feito com `mousemove`/`mouseup`
 * soltos, basta o cursor sair da área do iframe para os eventos pararem de
 * chegar — e o arraste TRAVA no meio. A solução é usar Pointer Events com
 * `setPointerCapture`, que garante a entrega dos eventos até soltar o
 * ponteiro. Isso também unifica mouse e toque num código só.
 */

/**
 * Habilita arrastar num elemento, com captura de ponteiro.
 *
 * @param {object} params
 * @param {Element} params.alvo elemento que recebe o gesto
 * @param {object} params.eventos gerenciador de eventos (dom.js) para limpeza
 * @param {Function} params.aoComecar ({x,y,evento}) => void
 * @param {Function} params.aoMover ({dx,dy,x,y,evento}) => void
 * @param {Function} params.aoSoltar ({x,y,velocidadeX,velocidadeY,evento}) => void
 * @param {Function} [params.permitir] (evento) => boolean
 */
export function habilitarArraste({ alvo, eventos, aoComecar, aoMover, aoSoltar, permitir }) {
  let arrastando = false;
  let ultima = { x: 0, y: 0 };
  let historico = [];

  const comecar = (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    if (typeof permitir === 'function' && !permitir(ev)) return;
    arrastando = true;
    ultima = { x: ev.clientX, y: ev.clientY };
    historico = [{ x: ev.clientX, y: ev.clientY, t: Date.now() }];
    if (typeof alvo.setPointerCapture === 'function' && ev.pointerId !== undefined) {
      try {
        alvo.setPointerCapture(ev.pointerId);
      } catch (_) {
        /* alguns navegadores recusam; segue sem captura */
      }
    }
    if (aoComecar) aoComecar({ x: ev.clientX, y: ev.clientY, evento: ev });
    ev.preventDefault();
  };

  const mover = (ev) => {
    if (!arrastando) return;
    const dx = ev.clientX - ultima.x;
    const dy = ev.clientY - ultima.y;
    ultima = { x: ev.clientX, y: ev.clientY };
    historico.push({ x: ev.clientX, y: ev.clientY, t: Date.now() });
    if (historico.length > 5) historico.shift();
    if (aoMover) aoMover({ dx, dy, x: ev.clientX, y: ev.clientY, evento: ev });
    ev.preventDefault();
  };

  const soltar = (ev) => {
    if (!arrastando) return;
    arrastando = false;
    if (ev && typeof alvo.releasePointerCapture === 'function' && ev.pointerId !== undefined) {
      try {
        alvo.releasePointerCapture(ev.pointerId);
      } catch (_) {
        /* ignora */
      }
    }
    let velocidadeX = 0;
    let velocidadeY = 0;
    if (historico.length >= 2) {
      const a = historico[0];
      const b = historico[historico.length - 1];
      const dt = b.t - a.t;
      if (dt > 0 && dt < 300) {
        velocidadeX = (b.x - a.x) / dt;
        velocidadeY = (b.y - a.y) / dt;
      }
    }
    historico = [];
    if (aoSoltar) {
      aoSoltar({ x: ev ? ev.clientX : 0, y: ev ? ev.clientY : 0, velocidadeX, velocidadeY, evento: ev });
    }
  };

  eventos.on(alvo, 'pointerdown', comecar);
  eventos.on(alvo, 'pointermove', mover);
  eventos.on(alvo, 'pointerup', soltar);
  eventos.on(alvo, 'pointercancel', soltar);

  // `touch-action: none` é necessário para o navegador não "roubar" o gesto
  // para rolagem antes de entregar os pointer events.
  try {
    alvo.style.touchAction = 'none';
  } catch (_) {
    /* ignora */
  }

  return {
    estaArrastando: () => arrastando,
    cancelar: () => {
      arrastando = false;
      historico = [];
    },
  };
}

/**
 * Zoom por roda do mouse, com limites. Devolve o fator acumulado.
 * Não usa d3-zoom de propósito: assim o pan fica com `habilitarArraste`
 * (com captura de ponteiro) e a roda fica aqui, sem conflito.
 */
export function habilitarZoomPorRoda({ alvo, eventos, minimo = 0.5, maximo = 40, aoMudar, permitir }) {
  let fator = 1;
  const aoRodar = (ev) => {
    if (typeof permitir === 'function' && !permitir(ev)) return;
    ev.preventDefault();
    const delta = -ev.deltaY;
    const passo = Math.exp(delta * 0.0015);
    const novo = Math.max(minimo, Math.min(maximo, fator * passo));
    if (novo === fator) return;
    const anterior = fator;
    fator = novo;
    if (aoMudar) {
      const retangulo = alvo.getBoundingClientRect ? alvo.getBoundingClientRect() : { left: 0, top: 0 };
      aoMudar({
        fator,
        fatorAnterior: anterior,
        x: ev.clientX - retangulo.left,
        y: ev.clientY - retangulo.top,
        evento: ev,
      });
    }
  };
  eventos.on(alvo, 'wheel', aoRodar, { passive: false });
  return {
    obterFator: () => fator,
    definirFator: (v) => {
      fator = Math.max(minimo, Math.min(maximo, Number(v) || 1));
      return fator;
    },
  };
}

/**
 * Inércia genérica: continua aplicando um delta que decai até parar.
 * Usado por globos, panorâmicas e carrosséis.
 */
export function aplicarInercia({ velocidadeX, velocidadeY, aoMover, atrito = 0.92, limite = 0.002, controlador }) {
  let vx = velocidadeX;
  let vy = velocidadeY;
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) return () => {};
  if (Math.abs(vx) < limite && Math.abs(vy) < limite) return () => {};

  let parado = false;
  let ultimoTs = null;

  const passo = (ts) => {
    if (parado) return;
    const dt = ultimoTs ? ts - ultimoTs : 16;
    ultimoTs = ts;
    aoMover(vx * dt, vy * dt);
    vx *= atrito;
    vy *= atrito;
    if (Math.abs(vx) < limite && Math.abs(vy) < limite) return;
    agendar(passo);
  };

  function agendar(fn) {
    if (controlador && typeof controlador.agendarQuadro === 'function') controlador.agendarQuadro(fn);
    else if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn);
    else setTimeout(() => fn(Date.now()), 16);
  }

  agendar(passo);
  return () => {
    parado = true;
  };
}

/**
 * Seleção por área (brush) em um eixo ou nos dois.
 * Devolve o retângulo selecionado em coordenadas do elemento.
 */
export function habilitarBrush({ alvo, eventos, direcao = 'x', aoSelecionar, aoLimpar, desenharRetangulo }) {
  let inicio = null;

  const posicaoLocal = (ev) => {
    const r = alvo.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  habilitarArraste({
    alvo,
    eventos,
    aoComecar: ({ evento }) => {
      inicio = posicaoLocal(evento);
    },
    aoMover: ({ evento }) => {
      if (!inicio) return;
      const atual = posicaoLocal(evento);
      const retangulo = normalizarRetangulo(inicio, atual, direcao, alvo);
      if (desenharRetangulo) desenharRetangulo(retangulo);
    },
    aoSoltar: ({ evento }) => {
      if (!inicio) return;
      const atual = evento ? posicaoLocal(evento) : inicio;
      const retangulo = normalizarRetangulo(inicio, atual, direcao, alvo);
      inicio = null;

      // Só a dimensão ESCOVADA conta para decidir se foi um clique.
      // Com `direcao: 'y'`, a largura é sempre a do alvo inteiro (e
      // vice-versa), então exigir que AS DUAS fossem pequenas tornava o
      // caminho de limpar inalcançável — um clique virava uma seleção de
      // altura zero, que filtra tudo e não dá para desfazer.
      const minimoUtil = 3;
      const arrastoUtil =
        direcao === 'x'
          ? retangulo.largura
          : direcao === 'y'
            ? retangulo.altura
            : Math.max(retangulo.largura, retangulo.altura);

      if (arrastoUtil < minimoUtil) {
        if (aoLimpar) aoLimpar();
        if (desenharRetangulo) desenharRetangulo(null);
        return;
      }
      if (aoSelecionar) aoSelecionar(retangulo);
    },
  });
}

function normalizarRetangulo(a, b, direcao, alvo) {
  const altura = alvo.clientHeight || 0;
  const largura = alvo.clientWidth || 0;
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = direcao === 'x' ? 0 : Math.min(a.y, b.y);
  const y1 = direcao === 'x' ? altura : Math.max(a.y, b.y);
  const xx0 = direcao === 'y' ? 0 : x0;
  const xx1 = direcao === 'y' ? largura : x1;
  return { x0: xx0, x1: xx1, y0, y1, largura: xx1 - xx0, altura: y1 - y0 };
}

/**
 * Busca simples com destaque: devolve uma função que diz se um texto casa
 * com o termo (sem acento, sem diferenciar maiúsculas).
 */
export function criarFiltroDeBusca(termo) {
  const t = normalizarTexto(termo);
  if (!t) return () => true;
  return (texto) => normalizarTexto(texto).includes(t);
}

export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Hit-testing por proximidade: acha o item mais próximo de (x,y) dentro de
 * um raio. Usado nos gráficos em canvas, que não têm elementos no DOM.
 */
export function acharMaisProximo({ itens, x, y, raio = 12, obterX, obterY }) {
  let melhor = null;
  let melhorDistancia = raio * raio;
  for (const item of itens) {
    const ix = obterX(item);
    const iy = obterY(item);
    if (!Number.isFinite(ix) || !Number.isFinite(iy)) continue;
    const dx = ix - x;
    const dy = iy - y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= melhorDistancia) {
      melhorDistancia = d2;
      melhor = item;
    }
  }
  return melhor;
}

/**
 * Gerencia o conjunto de séries desligadas pela legenda, guardando no
 * `estado` persistente do gráfico.
 */
export function criarControleDeSeriesDesligadas(estado, chaveDoEstado = 'seriesDesligadas') {
  if (!estado[chaveDoEstado]) estado[chaveDoEstado] = new Set();
  return {
    conjunto: estado[chaveDoEstado],
    estaDesligada: (chave) => estado[chaveDoEstado].has(chave),
    definir(novoConjunto) {
      estado[chaveDoEstado] = new Set(novoConjunto);
      return estado[chaveDoEstado];
    },
    alternar(chave) {
      const conjunto = estado[chaveDoEstado];
      if (conjunto.has(chave)) conjunto.delete(chave);
      else conjunto.add(chave);
      return conjunto;
    },
  };
}
