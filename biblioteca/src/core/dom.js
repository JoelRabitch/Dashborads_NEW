/**
 * dom.js — helpers seguros de DOM, SVG e Canvas.
 *
 * REGRA DE SEGURANÇA (seção 7 do PROMPT_AGENTE.md): texto vindo de dados
 * NUNCA entra por `innerHTML`. Este módulo só expõe caminhos seguros
 * (`textContent`, `createElement`, `setAttribute` com validação). Nenhuma
 * função aqui faz rede, usa `eval`, cookies ou armazenamento.
 *
 * Os únicos URLs permitidos no código são os namespaces XML do SVG, que são
 * identificadores, não endereços que o navegador busca.
 */

export const NS_SVG = 'http://www.w3.org/2000/svg';
export const NS_XLINK = 'http://www.w3.org/1999/xlink';

/** Remove todos os filhos de um nó (sem usar innerHTML). */
export function limpar(no) {
  if (!no) return no;
  while (no.firstChild) no.removeChild(no.firstChild);
  return no;
}

/** Define texto com segurança. Aceita qualquer valor; nulos viram ''. */
export function definirTexto(no, valor) {
  if (!no) return no;
  no.textContent = valor === null || valor === undefined ? '' : String(valor);
  return no;
}

/** Aplica um objeto de estilos inline no elemento. */
export function aplicarEstilos(el, estilos) {
  if (!el || !estilos) return el;
  for (const chave of Object.keys(estilos)) {
    const valor = estilos[chave];
    if (valor === null || valor === undefined) continue;
    if (chave.startsWith('--')) el.style.setProperty(chave, String(valor));
    else el.style[chave] = String(valor);
  }
  return el;
}

/** Aplica atributos (ignora nulos). Usa setAttribute, nunca innerHTML. */
export function aplicarAtributos(el, atributos) {
  if (!el || !atributos) return el;
  for (const chave of Object.keys(atributos)) {
    const valor = atributos[chave];
    if (valor === null || valor === undefined || valor === false) continue;
    el.setAttribute(chave, String(valor));
  }
  return el;
}

/**
 * Cria um elemento HTML.
 * @param {string} tag
 * @param {{classe?:string, texto?:any, estilos?:object, atributos?:object, pai?:Element}} [opcoes]
 */
export function criarEl(tag, opcoes = {}) {
  const el = document.createElement(tag);
  if (opcoes.classe) el.className = opcoes.classe;
  if (opcoes.texto !== undefined) definirTexto(el, opcoes.texto);
  if (opcoes.estilos) aplicarEstilos(el, opcoes.estilos);
  if (opcoes.atributos) aplicarAtributos(el, opcoes.atributos);
  if (opcoes.pai) opcoes.pai.appendChild(el);
  return el;
}

/** Cria um elemento SVG no namespace correto. Mesmas opções de criarEl. */
export function criarSvgEl(tag, opcoes = {}) {
  const el = document.createElementNS(NS_SVG, tag);
  if (opcoes.classe) el.setAttribute('class', opcoes.classe);
  if (opcoes.texto !== undefined) definirTexto(el, opcoes.texto);
  if (opcoes.estilos) aplicarEstilos(el, opcoes.estilos);
  if (opcoes.atributos) aplicarAtributos(el, opcoes.atributos);
  if (opcoes.pai) opcoes.pai.appendChild(el);
  return el;
}

/**
 * Cria um <svg> raiz já dimensionado e com viewBox.
 */
export function criarSvgRaiz(pai, largura, altura, opcoes = {}) {
  const svg = criarSvgEl('svg', {
    pai,
    atributos: {
      width: '100%',
      height: '100%',
      viewBox: `0 0 ${Math.max(1, largura)} ${Math.max(1, altura)}`,
      preserveAspectRatio: opcoes.preserveAspectRatio || 'xMidYMid meet',
      role: 'img',
      'aria-label': opcoes.rotuloAcessivel || 'Visualização',
    },
    estilos: { display: 'block', width: '100%', height: '100%', overflow: 'visible' },
  });
  return svg;
}

/**
 * Cria (ou reaproveita) um <canvas> com suporte a telas de alta densidade.
 * Devolve `{ canvas, ctx, largura, altura, dpr }`. `ctx` pode ser null em
 * ambientes de teste sem canvas 2D real — quem chama deve tolerar isso.
 */
export function prepararCanvas(canvas, largura, altura) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const px = Math.max(1, Math.round(largura * dpr));
  const py = Math.max(1, Math.round(altura * dpr));
  if (canvas.width !== px) canvas.width = px;
  if (canvas.height !== py) canvas.height = py;
  canvas.style.width = `${largura}px`;
  canvas.style.height = `${altura}px`;
  let ctx = null;
  try {
    ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  } catch (_) {
    ctx = null;
  }
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largura, altura);
  }
  return { canvas, ctx, largura, altura, dpr };
}

/** Mede o tamanho útil de um elemento, com piso para evitar 0x0. */
export function medir(el, minimo = { largura: 160, altura: 120 }) {
  const largura = (el && el.clientWidth) || minimo.largura;
  const altura = (el && el.clientHeight) || minimo.altura;
  return { largura: Math.max(1, largura), altura: Math.max(1, altura) };
}

/**
 * Observa redimensionamento do contêiner. Usa ResizeObserver quando existe;
 * senão cai para o evento `resize` da janela. Devolve uma função que
 * cancela a observação (importante para não vazar listeners entre updates).
 */
export function observarRedimensionamento(el, callback) {
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => callback());
    ro.observe(el);
    return () => ro.disconnect();
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    const aoRedimensionar = () => callback();
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }
  return () => {};
}

/**
 * Agendador de redesenho por redimensionamento (v3.3, opcional por gráfico
 * via `redimensionamento` no defineViz):
 *   - debounce (`atraso`, ~100 ms): uma rajada de eventos vira um desenho;
 *   - mudanças menores que `minimoPx` (2 px) são ignoradas;
 *   - no máximo `maximoPorSegundo` desenhos por segundo (protege do laço
 *     resize → layout → resize); o excedente é adiado, nunca perdido.
 * `medir()` dá o tamanho atual e `referencia()` o do último desenho.
 */
export function criarAgendadorDeRedimensionamento(executar, {
  atraso = 100,
  minimoPx = 2,
  maximoPorSegundo = 4,
  medir,
  referencia = () => null,
  agora = () => Date.now(),
  timer = (fn, ms) => setTimeout(fn, ms),
  cancelarTimer = (t) => clearTimeout(t),
} = {}) {
  let pendente = null;
  const feitos = [];
  const rodar = () => {
    pendente = null;
    const t = medir();
    const r = referencia();
    if (r && Math.abs(t.largura - r.largura) < minimoPx && Math.abs(t.altura - r.altura) < minimoPx) return;
    const instante = agora();
    while (feitos.length && instante - feitos[0] >= 1000) feitos.shift();
    if (feitos.length >= maximoPorSegundo) {
      pendente = timer(rodar, Math.max(1, 1000 - (instante - feitos[0])));
      return;
    }
    feitos.push(instante);
    executar();
  };
  return {
    pedir() {
      if (pendente !== null) cancelarTimer(pendente);
      pendente = timer(rodar, atraso);
    },
    cancelar() {
      if (pendente !== null) cancelarTimer(pendente);
      pendente = null;
    },
  };
}

/**
 * Injeta um bloco <style> com escopo por classe-raiz. O CSS é sempre
 * literal do nosso código (nunca vem de dados), então é seguro.
 */
export function injetarEstilo(hospedeiro, css, id) {
  const existente = id && hospedeiro.querySelector(`style[data-estilo="${id}"]`);
  if (existente) {
    existente.textContent = css;
    return existente;
  }
  const style = document.createElement('style');
  if (id) style.setAttribute('data-estilo', id);
  style.textContent = css;
  hospedeiro.appendChild(style);
  return style;
}

/**
 * Valida uma URL de imagem. Só aceita http(s) e data:, nunca javascript:.
 * Devolve a URL se for segura, ou null.
 */
export function urlDeImagemSegura(valor, { permitirExternas = true } = {}) {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  if (/^data:image\//i.test(limpo)) return limpo;
  if (/^https?:\/\//i.test(limpo)) return permitirExternas ? limpo : null;
  return null;
}

/**
 * Gerenciador de listeners: registra e remove tudo de uma vez. Evita
 * vazamento entre atualizações (regra de desempenho da seção 7).
 */
export function criarGerenciadorDeEventos() {
  const registros = [];
  return {
    on(alvo, tipo, handler, opcoes) {
      if (!alvo || !alvo.addEventListener) return;
      alvo.addEventListener(tipo, handler, opcoes);
      registros.push({ alvo, tipo, handler, opcoes });
    },
    limpar() {
      for (const r of registros) {
        try {
          r.alvo.removeEventListener(r.tipo, r.handler, r.opcoes);
        } catch (_) {
          /* ignora */
        }
      }
      registros.length = 0;
    },
  };
}

/** Verifica se o usuário pediu menos animação no sistema operacional. */
export function preferindoMenosMovimento() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch (_) {
    return false;
  }
}

/** requestAnimationFrame com fallback para setTimeout. */
export function proximoQuadro(callback) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16);
}

/** Cancela o que `proximoQuadro` agendou. */
export function cancelarQuadro(id) {
  if (id === null || id === undefined) return;
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
  else clearTimeout(id);
}
