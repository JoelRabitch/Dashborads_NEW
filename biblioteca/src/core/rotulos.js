/**
 * rotulos.js — a função ÚNICA de rótulos de dados da biblioteca.
 *
 * Por que existe (módulo 2.1 das correções): o bloco "Rótulos" do
 * options-kit era declarado em 21 gráficos, mas cada gráfico lia (ou não
 * lia) as opções do seu jeito — `negritoNoRotulo`, `rotacaoDoRotulo`,
 * `posicaoDoRotulo`, `conteudoDoRotulo` e `formatoDoRotulo` não eram lidos
 * em NENHUM gráfico, e `mostrarRotulos` era ignorado em 15. O painel
 * oferecia a opção, o Looker gravava o valor e nada mudava.
 *
 * Regras que esta função garante para todos:
 *   - o config é relido a cada desenho (o gráfico chama `lerRotulos` dentro
 *     do `render`, nunca guarda o resultado entre atualizações);
 *   - `false`, `0` e texto vazio são valores de verdade, não "ausência":
 *     `mostrarRotulos: false` esconde, `rotacaoDoRotulo: 0` é zero graus,
 *     `casasDecimaisDoRotulo: 0` é zero casa;
 *   - número que chega como texto ("14") é convertido.
 *
 * Uso típico num gráfico SVG:
 *   const rot = lerRotulos(config, tema);
 *   if (rot.mostrar) {
 *     const t = criarSvgEl('text', { pai, atributos: { x, y } });
 *     definirTexto(t, textoDoRotulo(rot, { valor, nome, total, valueFormat }));
 *     estilizarRotulo(t, rot, { corAutomatica: textoLegivelSobre(corDaBarra, tema) });
 *   }
 */

import { formatadorDeValueFormat, criarFormatadorNumerico, truncar, numeroOuNulo } from './format.js';

/** Converte boolean vindo do Looker (pode chegar como texto). */
export function lerBooleano(valor, padrao) {
  if (valor === undefined || valor === null || valor === '') return padrao;
  if (valor === true || valor === false) return valor;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  return !!valor;
}

/** Converte número vindo do Looker (pode chegar como texto); vazio = padrão. */
export function lerNumero(valor, padrao) {
  const n = numeroOuNulo(valor);
  return n === null ? padrao : n;
}

/** Texto não vazio, ou o padrão. */
export function lerTexto(valor, padrao = '') {
  if (valor === undefined || valor === null) return padrao;
  const t = String(valor).trim();
  return t === '' ? padrao : t;
}

/**
 * Lê TODAS as opções de rótulo de dados do config.
 *
 * @param {object} config config da atualização atual
 * @param {object} tema tema resolvido
 * @param {{padraoVisivel?:boolean, tamanhoPadrao?:number, casasPadrao?:number}} [padroes]
 */
export function lerRotulos(config = {}, tema = {}, padroes = {}) {
  const { padraoVisivel = true, tamanhoPadrao = 11, casasPadrao = 1 } = padroes;
  return {
    mostrar: lerBooleano(config.mostrarRotulos, padraoVisivel),
    tamanho: Math.max(6, Math.min(48, lerNumero(config.tamanhoDoRotulo, tamanhoPadrao))),
    cor: lerTexto(config.corDoRotulo, ''), // vazio = automática
    negrito: lerBooleano(config.negritoNoRotulo, false),
    rotacao: lerNumero(config.rotacaoDoRotulo, 0),
    evitarColisao: lerBooleano(config.evitarColisaoDeRotulos, true),
    truncar: Math.max(0, lerNumero(config.truncarRotulo, 0)),
    posicao: lerTexto(config.posicaoDoRotulo, 'auto'),
    conteudo: lerTexto(config.conteudoDoRotulo, 'valor'),
    formato: lerTexto(config.formatoDoRotulo, 'auto'),
    casas: Math.max(0, Math.min(6, Math.round(lerNumero(config.casasDecimaisDoRotulo, casasPadrao)))),
    fonte: tema.fonte,
    corDoTema: tema.texto,
  };
}

/**
 * Formatador numérico dos rótulos: respeita `formatoDoRotulo` e
 * `casasDecimaisDoRotulo`. Em "auto", usa o value_format do campo (o que o
 * Looker mostraria) — e, se o campo não tiver, as casas escolhidas.
 */
export function formatadorDoRotulo(rot, valueFormat) {
  if (!rot || rot.formato === 'auto') {
    return formatadorDeValueFormat(valueFormat, { casas: rot ? rot.casas : 1 });
  }
  return criarFormatadorNumerico({ estilo: rot.formato, casas: rot.casas });
}

/**
 * Monta o texto do rótulo conforme "O que mostrar no rótulo".
 *
 * @param {object} rot resultado de lerRotulos
 * @param {{valor?:number, nome?:string, total?:number, percentual?:number,
 *          valueFormat?:string, textoDoValor?:string}} dado
 *   `textoDoValor` (opcional) é o texto já formatado pelo Looker; é usado
 *   quando o formato é "auto", para o rótulo bater com o resto do Looker.
 */
export function textoDoRotulo(rot, dado = {}) {
  const { valor, nome = '', total, valueFormat, textoDoValor } = dado;
  const formatar = formatadorDoRotulo(rot, valueFormat);
  const n = numeroOuNulo(valor);
  const textoValor =
    rot.formato === 'auto' && textoDoValor !== undefined && textoDoValor !== null && textoDoValor !== ''
      ? String(textoDoValor)
      : n === null
        ? ''
        : formatar(n);

  let fracao = numeroOuNulo(dado.percentual);
  if (fracao === null && n !== null && numeroOuNulo(total)) fracao = n / Number(total);
  const textoPct = fracao === null ? '' : `${(fracao * 100).toFixed(rot.casas)}%`;

  let texto;
  switch (rot.conteudo) {
    case 'nome':
      texto = String(nome);
      break;
    case 'nomeValor':
      texto = nome !== '' && textoValor !== '' ? `${nome}: ${textoValor}` : String(nome || textoValor);
      break;
    case 'percentual':
      texto = textoPct || textoValor;
      break;
    case 'valorPercentual':
      texto = textoPct ? `${textoValor} (${textoPct})` : textoValor;
      break;
    case 'valor':
    default:
      texto = textoValor;
      break;
  }
  return rot.truncar > 0 ? truncar(texto, rot.truncar) : texto;
}

/**
 * Aplica tamanho, cor, negrito, fonte e rotação a um rótulo já criado.
 * Funciona com `<text>` de SVG e com elementos HTML.
 *
 * @param {Element} el
 * @param {object} rot resultado de lerRotulos
 * @param {{corAutomatica?:string, x?:number, y?:number}} [extra]
 *   `corAutomatica`: a cor que o gráfico usaria (ex.: legível sobre a barra);
 *   só vale quando o usuário deixou "Cor do rótulo" vazia.
 *   `x`/`y`: centro da rotação no SVG (padrão: atributos x/y do texto).
 */
export function estilizarRotulo(el, rot, extra = {}) {
  if (!el || !rot) return el;
  const cor = rot.cor || extra.corAutomatica || rot.corDoTema;
  const ehSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
  if (ehSvg) {
    el.setAttribute('font-size', String(rot.tamanho));
    if (cor) el.setAttribute('fill', cor);
    el.setAttribute('font-weight', rot.negrito ? '700' : '400');
    if (rot.fonte) el.setAttribute('font-family', rot.fonte);
    if (rot.rotacao) {
      const x = extra.x !== undefined ? extra.x : Number(el.getAttribute('x')) || 0;
      const y = extra.y !== undefined ? extra.y : Number(el.getAttribute('y')) || 0;
      const anterior = el.getAttribute('transform');
      const giro = `rotate(${rot.rotacao},${x},${y})`;
      el.setAttribute('transform', anterior ? `${anterior} ${giro}` : giro);
    }
  } else {
    el.style.fontSize = `${rot.tamanho}px`;
    if (cor) el.style.color = cor;
    el.style.fontWeight = rot.negrito ? '700' : '400';
    if (rot.rotacao) {
      const anterior = el.style.transform || '';
      el.style.transform = `${anterior} rotate(${rot.rotacao}deg)`.trim();
    }
  }
  el.setAttribute('data-rotulo', '1');
  return el;
}

/**
 * Atalho: cria o texto SVG do rótulo já estilizado (ou nada, se o usuário
 * desligou os rótulos). Devolve o elemento ou null.
 */
export function criarRotuloSvg(pai, rot, { x, y, texto, ancora = 'middle', base = 'central', corAutomatica } = {}) {
  if (!rot || !rot.mostrar || texto === '' || texto === null || texto === undefined) return null;
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('text-anchor', ancora);
  el.setAttribute('dominant-baseline', base);
  el.setAttribute('class', 'bl-rotulo');
  el.textContent = String(texto);
  estilizarRotulo(el, rot, { corAutomatica, x, y });
  pai.appendChild(el);
  return el;
}

/** Largura aproximada de um texto (o jsdom e o canvas fora da tela não medem). */
export function larguraDoTexto(texto, tamanho) {
  return String(texto || '').length * tamanho * 0.58;
}

/**
 * "Esconder rótulos que se sobrepõem": recebe caixas {el, x, y, largura,
 * altura} (x/y = centro) e esconde as que colidem com uma já mantida. A
 * ordem da lista é a prioridade (os primeiros ficam).
 * @returns {number} quantos foram escondidos
 */
export function esconderColisoes(caixas, rot) {
  if (!rot || !rot.evitarColisao) return 0;
  const mantidas = [];
  let escondidos = 0;
  for (const c of caixas) {
    if (!c || !c.el) continue;
    const colide = mantidas.some(
      (m) => Math.abs(m.x - c.x) * 2 < m.largura + c.largura && Math.abs(m.y - c.y) * 2 < m.altura + c.altura
    );
    if (colide) {
      c.el.setAttribute('display', 'none');
      if (c.el.style) c.el.style.display = 'none';
      escondidos += 1;
    } else {
      mantidas.push(c);
    }
  }
  return escondidos;
}

/**
 * Âncora e deslocamento conforme a "Posição do rótulo" para uma marca
 * retangular (barra). `dentro` = rótulo dentro da barra, perto da ponta;
 * `fora` = depois da ponta; `centro` = no meio. `auto` = dentro se couber.
 * @returns {'dentro'|'fora'|'centro'}
 */
export function posicaoEfetiva(rot, { cabeDentro = true } = {}) {
  const p = rot ? rot.posicao : 'auto';
  if (p === 'dentro' || p === 'centro') return p;
  if (p === 'fora' || p === 'foraComLinha') return 'fora';
  return cabeDentro ? 'dentro' : 'fora';
}
