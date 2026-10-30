/**
 * cabecalho.js — título, subtítulo e nota explicativa de TODOS os gráficos
 * (melhorias v3, 5.1c).
 *
 * Antes: o título e o subtítulo ficavam fixos no canto superior esquerdo e
 * cada gráfico escrevia a sua nota (pequena, cinza) por conta própria,
 * quase sempre com `position:absolute` no rodapé da área — por cima do
 * desenho (no bump_chart encostava na última linha) e sem nenhum ajuste.
 * A opção `mostrarAvisos` não escondia a nota porque ela é outro elemento.
 *
 * Agora:
 *   - Os três textos ficam em FAIXAS PRÓPRIAS, acima (`.bl-cabecalho`) ou
 *     abaixo (`.bl-rodape`) da área do gráfico, no fluxo do flex. A área
 *     encolhe o que for preciso; nada fica por cima do desenho nem do botão
 *     de avançar do bar_race. A altura de cada faixa é a do PLANO
 *     (`planejarCabecalho`), calculado com a largura estimada dos textos
 *     (`medida-texto.js`) — é esse plano que os testes de geometria
 *     conferem.
 *   - Tile pequeno: se a área do gráfico ficar abaixo do mínimo, some
 *     primeiro a nota, depois o subtítulo, depois o título (nunca sobrepõe).
 *   - Nota no modo "só no ícone ⓘ": um ícone no canto direito da faixa de
 *     cima; o texto aparece num balão ao passar o mouse (ou foco).
 *   - Cada gráfico informa o texto AUTOMÁTICO da nota num único lugar:
 *     escreve em `ctx.nota` (um elemento fora do documento). O núcleo lê o
 *     texto depois do render e decide o que mostrar conforme "Nota · Texto"
 *     (Automático | Automático + meu texto | Só meu texto | Nenhum).
 *
 * Os padrões reproduzem o visual anterior: título e subtítulo à esquerda no
 * topo, nota pequena e cinza no rodapé, tudo visível.
 */

import { criarEl, definirTexto, limpar } from './dom.js';
import { larguraDoTexto, linhasDoTexto } from './medida-texto.js';

const valores = (pares) => pares.map(([rotulo, valor]) => ({ [rotulo]: valor }));
const ALINHAMENTOS = valores([['Esquerda', 'esquerda'], ['Centro', 'centro'], ['Direita', 'direita']]);
const FONTES = valores([['Do tema', 'tema'], ['Sistema', 'sistema'], ['Monoespaçada', 'mono'], ['Serifada', 'serifada']]);
const PESOS = valores([['Negrito', 'negrito'], ['Normal', 'normal']]);

function blocoDeTexto(sufixo, secao, { peso, tamanho }) {
  const o = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
  return {
    [`mostrar${sufixo}`]: o('boolean', 'Mostrar', true),
    [`posicaoDo${sufixo}`]: o('string', 'Posição', 'acima', {
      display: 'select',
      values: valores([['Acima do gráfico', 'acima'], ['Abaixo do gráfico', 'abaixo']]),
    }),
    [`alinhamentoDo${sufixo}`]: o('string', 'Alinhamento', 'esquerda', { display: 'select', values: ALINHAMENTOS }),
    [`deslocamentoXDo${sufixo}`]: o('number', 'Deslocamento X (px)', 0),
    [`deslocamentoYDo${sufixo}`]: o('number', 'Deslocamento Y (px)', 0),
    [`tamanhoDo${sufixo}`]: o('number', 'Tamanho (px, 0 = auto)', tamanho),
    [`fonteDo${sufixo}`]: o('string', 'Fonte', 'tema', { display: 'select', values: FONTES }),
    [`pesoDo${sufixo}`]: o('string', 'Peso', peso, { display: 'select', values: PESOS }),
    [`corDo${sufixo}`]: o('string', 'Cor (vazio = tema)', '', { display: 'color' }),
    [`margemDo${sufixo}`]: o('number', 'Margem (px)', 0),
    [`quebrar${sufixo}`]: o('boolean', 'Quebrar linha', true),
    [`linhasDo${sufixo}`]: o('number', 'Máximo de linhas (0 = sem)', 0),
  };
}

/** Opções novas (aba Texto). Os textos continuam em `titulo` e `subtitulo`. */
export function opcoesDoCabecalho() {
  const n = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: 'Nota', default: def, ...extra });
  return {
    ...blocoDeTexto('Titulo', 'Título', { peso: 'negrito', tamanho: 0 }),
    ...blocoDeTexto('Subtitulo', 'Subtítulo', { peso: 'normal', tamanho: 0 }),
    mostrarNota: n('boolean', 'Mostrar', true),
    posicaoDaNota: n('string', 'Posição', 'abaixo', {
      display: 'select',
      values: valores([
        ['Abaixo do gráfico', 'abaixo'],
        ['Acima do gráfico', 'acima'],
        ['Só no ícone ⓘ', 'icone'],
      ]),
    }),
    alinhamentoDaNota: n('string', 'Alinhamento', 'esquerda', { display: 'select', values: ALINHAMENTOS }),
    tamanhoDaNota: n('number', 'Tamanho (px)', 10),
    fonteDaNota: n('string', 'Fonte', 'tema', { display: 'select', values: FONTES }),
    corDaNota: n('string', 'Cor (vazio = tema)', '', { display: 'color' }),
    quebrarNota: n('boolean', 'Quebrar linha', true),
    linhasDaNota: n('number', 'Máximo de linhas (0 = sem)', 0),
    textoDaNota: n('string', 'Texto', 'auto', {
      display: 'select',
      values: valores([
        ['Automático', 'auto'],
        ['Automático + meu texto', 'auto_mais'],
        ['Só meu texto', 'meu'],
        ['Nenhum', 'nenhum'],
      ]),
    }),
    meuTextoDaNota: n('string', 'Meu texto', ''),
  };
}

/** Texto final da nota conforme "Nota · Texto". */
export function textoFinalDaNota(config = {}, automatico = '') {
  const auto = String(automatico || '').trim();
  const meu = String(config.meuTextoDaNota || '').trim();
  switch (config.textoDaNota) {
    case 'nenhum':
      return '';
    case 'meu':
      return meu;
    case 'auto_mais':
      return [auto, meu].filter(Boolean).join(' · ');
    default:
      return auto;
  }
}

const num = (v, padrao) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : padrao);

function familia(fonte, tema) {
  if (fonte === 'sistema') return 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  if (fonte === 'mono') return 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  if (fonte === 'serifada') return 'Georgia, "Times New Roman", serif';
  return (tema && tema.fonte) || '';
}

/** Estilo resolvido de um dos textos (também usado por gráficos de cabeçalho próprio, como o kpi_vivo). */
export function estiloDoTexto(tipo, config = {}, tema = {}) {
  const base = num(tema.tamanhoBase, 12);
  if (tipo === 'nota') {
    return {
      mostrar: config.mostrarNota !== false,
      posicao: ['acima', 'icone'].includes(config.posicaoDaNota) ? config.posicaoDaNota : 'abaixo',
      alinhamento: config.alinhamentoDaNota || 'esquerda',
      dx: 0,
      dy: 0,
      tamanho: Math.max(6, num(config.tamanhoDaNota, 10) || 10),
      fonte: familia(config.fonteDaNota, tema),
      mono: config.fonteDaNota === 'mono',
      negrito: false,
      cor: (config.corDaNota || '').trim() || tema.textoSuave || '',
      opacidade: (config.corDaNota || '').trim() ? 1 : 0.75,
      margem: 0,
      quebrar: config.quebrarNota !== false,
      linhas: Math.max(0, Math.floor(num(config.linhasDaNota, 0))),
      alturaDaLinha: 1.35,
    };
  }
  const S = tipo === 'titulo' ? 'Titulo' : 'Subtitulo';
  const automatico = tipo === 'titulo' ? Math.round(base * 1.25) : Math.round(base * 0.95);
  const tamanho = num(config[`tamanhoDo${S}`], 0);
  const peso = config[`pesoDo${S}`] || (tipo === 'titulo' ? 'negrito' : 'normal');
  const cor = (config[`corDo${S}`] || '').trim();
  return {
    mostrar: config[`mostrar${S}`] !== false,
    posicao: config[`posicaoDo${S}`] === 'abaixo' ? 'abaixo' : 'acima',
    alinhamento: config[`alinhamentoDo${S}`] || 'esquerda',
    dx: num(config[`deslocamentoXDo${S}`], 0),
    dy: num(config[`deslocamentoYDo${S}`], 0),
    tamanho: tamanho > 0 ? tamanho : automatico,
    fonte: familia(config[`fonteDo${S}`], tema),
    mono: config[`fonteDo${S}`] === 'mono',
    negrito: peso === 'negrito',
    cor: cor || '',
    opacidade: tipo === 'subtitulo' && !cor ? 0.7 : 1,
    margem: Math.max(0, num(config[`margemDo${S}`], 0)),
    quebrar: config[`quebrar${S}`] !== false,
    linhas: Math.max(0, Math.floor(num(config[`linhasDo${S}`], 0))),
    alturaDaLinha: 1.2,
  };
}

/** Espaçamentos das faixas (iguais ao visual anterior). */
export const FOLGA = { lateral: 10, topo: 6, base: 4, entreItens: 2, icone: 18 };

/**
 * Plano das faixas de cima e de baixo e da área do gráfico.
 *
 * @param {{largura:number, altura:number, config:object, tema:object,
 *          textos:{titulo?:string, subtitulo?:string, nota?:string},
 *          areaMinima?:number}} p
 * @returns {{topo:object[], base:object[], icone:string, alturaTopo:number,
 *            alturaBase:number, area:{y:number, altura:number}, ocultos:string[]}}
 *   Cada item: {tipo, texto, x, y, largura, altura, linhas, estilo}, em
 *   coordenadas do tile (0,0 = canto superior esquerdo).
 */
export function planejarCabecalho({ largura, altura, config = {}, tema = {}, textos = {}, areaMinima }) {
  const minimo = areaMinima ?? Math.max(40, Math.round(altura * 0.25));
  const ocultos = [];
  const pedidos = [];
  for (const tipo of ['titulo', 'subtitulo', 'nota']) {
    const texto = String(textos[tipo] || '').trim();
    const estilo = estiloDoTexto(tipo, config, tema);
    if (!texto || !estilo.mostrar) continue;
    pedidos.push({ tipo, texto, estilo });
  }

  const calcular = (itens) => {
    const icone = itens.find((i) => i.tipo === 'nota' && i.estilo.posicao === 'icone');
    const noFluxo = itens.filter((i) => i !== icone);
    const larguraUtil = Math.max(20, largura - 2 * FOLGA.lateral);
    const medir = (i) => {
      const reservaDoIcone = icone && i.estilo.posicao === 'acima' ? FOLGA.icone + 4 : 0;
      const larguraDoItem = Math.max(20, larguraUtil - Math.abs(i.estilo.dx) - reservaDoIcone);
      const opts = { negrito: i.estilo.negrito, mono: i.estilo.mono };
      let linhas = i.estilo.quebrar ? linhasDoTexto(i.texto, larguraDoItem, i.estilo.tamanho, opts) : 1;
      if (i.estilo.linhas > 0) linhas = Math.min(linhas, i.estilo.linhas);
      const alturaDoTexto = Math.ceil(linhas * i.estilo.tamanho * i.estilo.alturaDaLinha);
      return { ...i, linhas, largura: larguraDoItem, alturaDoTexto, altura: alturaDoTexto + 2 * i.estilo.margem };
    };
    const topo = noFluxo.filter((i) => i.estilo.posicao === 'acima').map(medir);
    const base = noFluxo.filter((i) => i.estilo.posicao === 'abaixo').map(medir);
    const somar = (lista) => lista.reduce((s, i) => s + i.altura, 0) + Math.max(0, lista.length - 1) * FOLGA.entreItens;
    let alturaTopo = topo.length ? FOLGA.topo + somar(topo) : 0;
    if (icone) alturaTopo = Math.max(alturaTopo, FOLGA.topo + FOLGA.icone);
    const alturaBase = base.length ? somar(base) + FOLGA.base : 0;
    // Posições (y) dentro do tile.
    let y = FOLGA.topo;
    for (const i of topo) {
      i.x = FOLGA.lateral + i.estilo.dx;
      i.y = y + i.estilo.margem + i.estilo.dy;
      y += i.altura + FOLGA.entreItens;
    }
    y = altura - alturaBase;
    for (const i of base) {
      i.x = FOLGA.lateral + i.estilo.dx;
      i.y = y + i.estilo.margem + i.estilo.dy;
      y += i.altura + FOLGA.entreItens;
    }
    return {
      topo,
      base,
      icone: icone ? icone.texto : '',
      estiloDoIcone: icone ? icone.estilo : null,
      alturaTopo,
      alturaBase,
      area: { y: alturaTopo, altura: altura - alturaTopo - alturaBase },
    };
  };

  let plano = calcular(pedidos);
  // Tile pequeno: some a nota, depois o subtítulo, depois o título.
  for (const tipo of ['nota', 'subtitulo', 'titulo']) {
    if (plano.area.altura >= minimo) break;
    const idx = pedidos.findIndex((p) => p.tipo === tipo);
    if (idx < 0) continue;
    pedidos.splice(idx, 1);
    ocultos.push(tipo);
    plano = calcular(pedidos);
  }
  return { ...plano, ocultos };
}

const CSS = `
.bl-cabecalho,.bl-rodape{position:relative;flex:0 0 auto;overflow:hidden;padding:0 ${FOLGA.lateral}px;}
.bl-cabecalho{padding-top:${FOLGA.topo}px;}
.bl-rodape{padding-bottom:${FOLGA.base}px;}
.bl-cabecalho>.bl-texto+.bl-texto,.bl-rodape>.bl-texto+.bl-texto{margin-top:${FOLGA.entreItens}px;}
.bl-texto{position:relative;overflow:hidden;}
.bl-texto.bl-sem-quebra{white-space:nowrap;text-overflow:ellipsis;}
.bl-texto.bl-limitado{display:-webkit-box;-webkit-box-orient:vertical;}
.bl-nota-icone{position:absolute;top:${FOLGA.topo - 2}px;right:${FOLGA.lateral - 4}px;width:${FOLGA.icone}px;height:${FOLGA.icone}px;
  border:0;padding:0;background:transparent;color:inherit;font:inherit;font-size:14px;line-height:${FOLGA.icone}px;cursor:help;opacity:.7;}
.bl-nota-icone:hover,.bl-nota-icone:focus{opacity:1;}
.bl-nota-balao{position:absolute;z-index:5;right:${FOLGA.lateral}px;top:${FOLGA.topo + FOLGA.icone + 2}px;max-width:calc(100% - ${2 * FOLGA.lateral}px);
  padding:6px 8px;border-radius:6px;box-shadow:0 4px 14px rgba(15,23,42,.22);display:none;line-height:1.35;}
.bl-nota-balao.bl-visivel{display:block;}
`;

export function cssDoCabecalho() {
  return CSS;
}

function aplicarEstilo(el, item, tema) {
  const e = item.estilo;
  el.className = `bl-texto bl-${item.tipo}`;
  el.style.fontSize = `${e.tamanho}px`;
  el.style.lineHeight = String(e.alturaDaLinha);
  el.style.fontWeight = e.negrito ? '600' : '400';
  el.style.fontFamily = e.fonte || '';
  el.style.color = e.cor || '';
  el.style.opacity = String(e.opacidade);
  el.style.textAlign = e.alinhamento === 'centro' ? 'center' : e.alinhamento === 'direita' ? 'right' : 'left';
  el.style.left = `${e.dx}px`;
  el.style.top = `${e.dy}px`;
  el.style.margin = `${e.margem}px 0`;
  el.style.height = `${item.alturaDoTexto}px`;
  if (!e.quebrar) el.classList.add('bl-sem-quebra');
  if (e.linhas > 0 && e.quebrar) {
    el.classList.add('bl-limitado');
    el.style.webkitLineClamp = String(e.linhas);
  }
  definirTexto(el, item.texto);
  if (item.tipo === 'nota' && !e.cor) el.style.color = tema.textoSuave || '';
}

/**
 * Desenha as faixas conforme o plano. `bl` precisa de `cabecalho` (faixa
 * de cima) e `rodape` (faixa de baixo).
 */
export function desenharCabecalho(bl, plano, tema = {}) {
  for (const [faixa, itens, altura] of [
    [bl.cabecalho, plano.topo, plano.alturaTopo],
    [bl.rodape, plano.base, plano.alturaBase],
  ]) {
    if (!faixa) continue;
    limpar(faixa);
    faixa.style.display = altura > 0 ? 'block' : 'none';
    faixa.style.height = `${altura}px`;
    for (const item of itens) aplicarEstilo(criarEl('div', { pai: faixa }), item, tema);
  }
  if (plano.icone && bl.cabecalho) {
    const botao = criarEl('button', { classe: 'bl-nota-icone', texto: 'ⓘ', pai: bl.cabecalho });
    botao.type = 'button';
    botao.setAttribute('aria-label', 'Nota explicativa');
    const balao = criarEl('div', { classe: 'bl-nota-balao bl-texto bl-nota', pai: bl.raiz });
    definirTexto(balao, plano.icone);
    const e = plano.estiloDoIcone || {};
    balao.style.fontSize = `${e.tamanho || 10}px`;
    balao.style.fontFamily = e.fonte || '';
    balao.style.background = tema.tooltipFundo || 'rgba(15,23,42,.94)';
    balao.style.color = tema.tooltipTexto || '#F8FAFC';
    balao.style.textAlign = e.alinhamento === 'centro' ? 'center' : e.alinhamento === 'direita' ? 'right' : 'left';
    const mostrar = () => balao.classList.add('bl-visivel');
    const esconder = () => balao.classList.remove('bl-visivel');
    botao.addEventListener('pointerenter', mostrar);
    botao.addEventListener('focus', mostrar);
    botao.addEventListener('pointerleave', esconder);
    botao.addEventListener('blur', esconder);
    bl.balaoDaNota = balao;
  }
}

/** Remove o balão da nota (ele mora na raiz, fora das faixas). */
export function limparBalaoDaNota(bl) {
  if (bl.balaoDaNota && bl.balaoDaNota.parentNode) bl.balaoDaNota.parentNode.removeChild(bl.balaoDaNota);
  bl.balaoDaNota = null;
}

export { larguraDoTexto };
