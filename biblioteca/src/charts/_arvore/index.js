/**
 * _arvore — base compartilhada dos gráficos de árvore.
 *
 * `arvore_radial`, `arvores_multiplas` e `org_chart` desenham a mesma
 * coisa com arranjos diferentes: nós ligados por linhas, posicionados por
 * um layout do `d3-hierarchy`. Aqui ficam os layouts, o desenho dos nós e
 * das ligações, e as opções comuns.
 *
 * Sobre os dois layouts do d3: `tree` põe cada nó o mais perto possível do
 * pai e deixa as folhas em profundidades diferentes; `cluster` alinha
 * TODAS as folhas na borda. Para organograma o primeiro é melhor; para
 * árvore radial com rótulos na borda, o segundo.
 *
 * v3.2: no layout HORIZONTAL o d3 só dá a ordem e a posição vertical; a
 * posição de cada nível é calculada aqui (`layoutHorizontalEstavel`), pela
 * largura dos rótulos e do ícone. O radial não mudou.
 */

import { criarSvgEl, definirTexto } from '../../core/dom.js';
import { truncar } from '../../core/format.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo, esconderColisoes, larguraDoTexto } from '../../core/rotulos.js';
import { paletaDoConfig, corDoItem, lerContorno, aplicarContorno, aplicarPreenchimento } from '../../core/cores.js';
import { criarMarcadorSvg, formaDoMarcador } from '../../core/shapes.js';
import { listaDeValores } from '../../core/options-kit.js';
import { tree as d3Tree, cluster as d3Cluster } from 'd3-hierarchy';
import { lerTextoLongo, ajustarRotulo } from '../../core/texto-longo.js';
import { criarIconePorValor, desenharIconePorValor } from '../../core/icone-por-valor.js';

export const CSS_ARVORE = `
.av-area{position:relative;width:100%;height:100%;overflow:hidden;}
.av-ligacao{fill:none;}
.av-no{cursor:pointer;}
.av-rotulo{pointer-events:none;}
.av-apagado{opacity:.2;}
.av-titulo-arvore{font-weight:600;}
.av-no,.av-ligacao{transition:opacity .15s ease;}
@media (prefers-reduced-motion: reduce){.av-no,.av-ligacao{transition:none;}}
`;

export const FORMAS_DE_LIGACAO = [
  { rotulo: 'Curva', valor: 'curva' },
  { rotulo: 'Cotovelo (ângulo reto)', valor: 'cotovelo' },
  { rotulo: 'Reta', valor: 'reta' },
];

/* ------------------------------------------------------------------ */
/* Opções                                                              */
/* ------------------------------------------------------------------ */

export function opcoesDeArvore({ secao = 'Árvore', layoutPadrao = 'cluster' } = {}) {
  return {
    layoutDaArvore: {
      type: 'string',
      label: 'Distribuição dos nós',
      section: secao,
      display: 'select',
      default: layoutPadrao,
      values: listaDeValores([
        { rotulo: 'Folhas alinhadas na borda (cluster)', valor: 'cluster' },
        { rotulo: 'Nós perto do pai (tree)', valor: 'tree' },
      ]),
    },
    formaDaLigacao: {
      type: 'string',
      label: 'Forma das ligações',
      section: secao,
      display: 'select',
      default: 'curva',
      values: listaDeValores(FORMAS_DE_LIGACAO),
    },
    espessuraDaLigacao: {
      type: 'number',
      label: 'Espessura das ligações',
      section: secao,
      display: 'range',
      min: 0.5,
      max: 6,
      step: 0.5,
      default: 1,
    },
    espessuraPorValor: {
      type: 'boolean',
      label: 'Ligação mais grossa para ramos maiores',
      section: secao,
      default: false,
    },
    tamanhoDoNo: {
      type: 'number',
      label: 'Tamanho do nó',
      section: secao,
      display: 'range',
      min: 0,
      max: 20,
      step: 1,
      default: 4,
    },
    tamanhoPorValor: {
      type: 'boolean',
      label: 'Nó maior para valores maiores',
      section: secao,
      default: true,
    },
    colorirPor: {
      type: 'string',
      label: 'Cor dos nós',
      section: 'Cores',
      display: 'select',
      default: 'ramo',
      values: listaDeValores([
        { rotulo: 'Pelo ramo (filhos da raiz)', valor: 'ramo' },
        { rotulo: 'Pelo nível', valor: 'nivel' },
        { rotulo: 'Cor única', valor: 'unica' },
      ]),
    },
    mostrarRotulosDeFolha: {
      type: 'boolean',
      label: 'Escrever o nome das folhas',
      section: 'Rótulos',
      default: true,
    },
    mostrarRotulosInternos: {
      type: 'boolean',
      label: 'Escrever o nome dos nós internos',
      section: 'Rótulos',
      default: false,
    },
    mostrarValorNoRotulo: {
      type: 'boolean',
      label: 'Incluir o valor no rótulo',
      section: 'Rótulos',
      default: false,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/**
 * Posiciona os nós em coordenadas RADIAIS.
 * Depois do layout, `no.x` é o ângulo em radianos e `no.y` é o raio.
 */
export function layoutRadial(raiz, { raioMaximo, config }) {
  const fabrica = (config.layoutDaArvore === 'tree' ? d3Tree : d3Cluster)();
  fabrica.size([2 * Math.PI, raioMaximo]);
  // Separação maior entre ramos diferentes: sem isso os rótulos das folhas
  // de ramos vizinhos se encostam no meio do círculo.
  fabrica.separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(1, a.depth));
  return fabrica(raiz);
}

/* ---------- Layout horizontal ESTÁVEL (v3.2) ---------- */

/** Folga entre rótulo, ícone e o nível seguinte (px). */
export const FOLGA_DA_ARVORE = 8;
/** Menor lado legível do ícone por valor (px). */
export const LADO_MINIMO_DO_ICONE = 10;
/** Largura reservada para o "+"/"−" à esquerda de um nó com filhos. */
const LARGURA_DO_INDICADOR = 12;
/** Teto do espaço extra distribuído entre níveis quando a árvore cabe. */
const EXTRA_MAXIMO_POR_NIVEL = 80;

/** Raio do marcador de um nó (mesma regra de sempre). */
export function raioDoNoDaArvore(valor, config, maiorValor) {
  const base = Number(config.tamanhoDoNo);
  const b = Number.isFinite(base) ? base : 4;
  return config.tamanhoPorValor ? Math.max(1.5, b * Math.sqrt((valor || 0) / (maiorValor || 1)) * 2.2) : b;
}

/**
 * Lado do ícone por valor: "Tamanho do ícone" (px) ou, em Automático (0),
 * o tamanho de antes (marcador + 6, no mínimo 12). Nunca maior que o espaço
 * vertical entre irmãos menos a folga, e nunca menor que o mínimo legível.
 */
export function ladoDoIconeDaArvore(config, raio, espacoVertical = Infinity) {
  const pedido = Number(config.tamanhoDoIcone) > 0 ? Number(config.tamanhoDoIcone) : Math.max(12, raio * 2 + 6);
  return Math.max(LADO_MINIMO_DO_ICONE, Math.min(pedido, espacoVertical - FOLGA_DA_ARVORE / 2));
}

/** Opções novas da v3.2 (comuns às duas árvores). */
export function opcoesDeEspacamento({ secao = 'Árvore' } = {}) {
  return {
    tamanhoDoIcone: { type: 'number', label: 'Tamanho do ícone (0 = auto)', section: secao, default: 0 },
    ajusteDeEscala: {
      type: 'string',
      label: 'Ajuste de escala',
      section: secao,
      display: 'select',
      default: 'real',
      values: listaDeValores([
        { rotulo: 'Tamanho real com rolagem', valor: 'real' },
        { rotulo: 'Ajustar à área', valor: 'ajustar' },
      ]),
    },
  };
}

/**
 * Escala do modo "Ajustar à área": reduz o desenho para caber, mas a fonte
 * na tela nunca fica abaixo de "Fonte mínima" (o resto rola).
 * @returns {number} fator ≤ 1 (1 = tamanho real)
 */
export function escalaDeAjuste(config, { area, desenho, fonte }) {
  if (config.ajusteDeEscala !== 'ajustar') return 1;
  const tl = lerTextoLongo(config);
  const minima = Math.min(1, tl.fonteMinima / Math.max(1, fonte));
  const s = Math.min(1, area.largura / Math.max(1, desenho.largura), area.altura / Math.max(1, desenho.altura));
  return Math.max(minima, s);
}

/**
 * Posiciona a árvore horizontal (v3.2). Substitui o antigo
 * `cluster/tree.size([altura, largura])`, que dividia uma largura FIXA pelo
 * número de níveis visíveis: ao abrir um nível novo, todos se aproximavam e
 * os ícones dos filhos caíam no texto do pai.
 *
 * Eixo dos níveis (x na tela, `no.y`): X do nível k = soma, para j < k, de
 * (maior rótulo à direita do nível j + ícone + folga + maior rótulo à
 * esquerda do nível j+1 + "+/−"). As larguras saem da árvore COMPLETA
 * (todos os nós do nível, abertos ou não, com o rótulo que teriam): abrir
 * ou fechar um nó NUNCA move um nível já visível.
 *
 * Eixo vertical (`no.x`): o d3 só dá a ORDEM e a separação entre irmãos
 * (`nodeSize`); o espaço por linha é max(ícone, texto) + folga. Se sobrar
 * altura, as linhas se espalham (como antes); se faltar, a altura cresce.
 *
 * "Texto longo" (5.11): se a largura necessária passar da disponível, os
 * modos que não são "Mostrar inteiro" recebem um limite por rótulo,
 * calculado a partir da largura disponível; "Mostrar inteiro" cresce.
 *
 * @param {object} p
 * @param {object} p.visivel   hierarquia do d3 VISÍVEL (é a que é posicionada)
 * @param {object} p.completa  nó da árvore completa equivalente à raiz visível
 * @param {(no:object)=>boolean} p.temFilhos  o nó tem filhos nos DADOS
 * @param {(no:object)=>boolean} p.temIcone   o nó terá ícone por valor
 * @returns {{largura:number, larguraVisivel:number, altura:number,
 *   limiteDoRotulo:number, ladoDoIcone:(raio:number)=>number}}
 */
export function layoutHorizontalEstavel({
  visivel,
  completa,
  config,
  tema,
  valueFormat,
  total,
  maiorValor,
  larguraUtil,
  alturaUtil,
  temFilhos,
  temIcone = () => false,
}) {
  const rot = lerRotulos(config, tema);
  const tl = lerTextoLongo(config);
  const folga = FOLGA_DA_ARVORE;
  const posicao = rot.posicao;
  const centro = posicao === 'centro';
  const mostrarFolha = config.mostrarRotulosDeFolha !== false;
  const mostrarInterno = config.mostrarRotulosInternos === true;
  const comValor = config.mostrarValorNoRotulo === true;
  const nos = completa.descendants();
  const base = completa.depth;
  const profundidade = Math.max(0, ...nos.map((n) => n.depth - base));
  const raioMax = Math.max(0, ...nos.map((n) => raioDoNoDaArvore(n.value, config, maiorValor)));
  const algumIcone = nos.some(temIcone);
  // Lado do ícone pedido (sem o teto vertical, que ainda não se conhece).
  const ladoPedido = (raio) => (algumIcone ? ladoDoIconeDaArvore(config, raio) : 0);
  const larguraDoNo = Math.max(raioMax * 2, ladoPedido(raioMax));

  // Lados em que cada nó PODE ter rótulo (aberto ou fechado).
  const lados = (n) => {
    if (!rot.mostrar || !n.data.rotulo) return [];
    const comFilhos = temFilhos(n);
    // Fechado, um nó com filhos é folha; aberto, é nó interno.
    const comoFolha = mostrarFolha;
    const comoInterno = comFilhos && mostrarInterno;
    if (!comoFolha && !comoInterno) return [];
    if (centro) return ['centro'];
    if (posicao === 'fora' || posicao === 'foraComLinha') return ['dir'];
    if (posicao === 'dentro') return ['esq'];
    const s = [];
    if (comoFolha) s.push('dir');
    if (comoInterno) s.push('esq');
    return s;
  };

  const medir = (limite) => {
    const dir = new Array(profundidade + 1).fill(0);
    const esq = new Array(profundidade + 1).fill(0);
    const linhas = new Array(profundidade + 1).fill(0);
    const comIndicador = new Array(profundidade + 1).fill(false);
    let tamanho = rot.tamanho;
    for (const n of nos) {
      const k = n.depth - base;
      if (temFilhos(n)) comIndicador[k] = true;
      const ls = lados(n);
      if (!ls.length) continue;
      const pt = partesDoRotuloDoNo(rot, n, { valueFormat, total, mostrarValor: comValor, tl });
      const aj = ajustarRotulo({ ...pt, tamanho: rot.tamanho, largura: limite, tl, estilo: { negrito: rot.negrito } });
      linhas[k] = Math.max(linhas[k], aj.linhas.length * aj.tamanho * 1.15);
      tamanho = Math.max(tamanho, aj.tamanho);
      for (const l of ls) {
        if (l === 'dir') dir[k] = Math.max(dir[k], aj.largura);
        else if (l === 'esq') esq[k] = Math.max(esq[k], aj.largura);
        else {
          dir[k] = Math.max(dir[k], aj.largura / 2);
          esq[k] = Math.max(esq[k], aj.largura / 2);
        }
      }
    }
    const meia = larguraDoNo / 2;
    // Reserva à esquerda e à direita do CENTRO do nó, por nível.
    const reservaEsq = esq.map((e, k) => meia + (comIndicador[k] ? LARGURA_DO_INDICADOR : 0) + (e ? (centro ? e - meia : e + 4) : 0));
    const reservaDir = dir.map((d) => meia + (d ? (centro ? d - meia : d + 4) : 0));
    const passos = [];
    for (let k = 0; k < profundidade; k++) passos.push(Math.max(0, reservaDir[k]) + folga + Math.max(0, reservaEsq[k + 1]));
    const largura = folga + Math.max(0, reservaEsq[0]) + passos.reduce((a, b) => a + b, 0) + Math.max(0, reservaDir[profundidade]) + folga;
    const colunas = dir.filter(Boolean).length + esq.filter(Boolean).length;
    return { reservaEsq, reservaDir, passos, largura, linhas, colunas, rotulos: dir.concat(esq).reduce((a, b) => a + b, 0) };
  };

  let limite = Infinity;
  let m = medir(limite);
  if (tl.modo !== 'inteiro' && m.largura > larguraUtil && m.colunas) {
    // Não cabe: limite por rótulo a partir da largura disponível.
    const fixo = m.largura - m.rotulos;
    limite = Math.max(40, (larguraUtil - fixo) / m.colunas);
    m = medir(limite);
  }

  // Sobra largura: espalha os níveis (como antes, com teto), de forma
  // estável (a conta usa a árvore completa).
  const extra = m.largura < larguraUtil && profundidade > 0 ? Math.min(EXTRA_MAXIMO_POR_NIVEL, (larguraUtil - m.largura) / profundidade) : 0;
  const xDoNivel = [folga + Math.max(0, m.reservaEsq[0])];
  for (let k = 0; k < profundidade; k++) xDoNivel.push(xDoNivel[k] + m.passos[k] + extra);
  const largura = m.largura + extra * profundidade;

  // ---------- Vertical ----------
  const alturaDoTexto = Math.max(0, ...m.linhas);
  const alturaDoNo = Math.max(raioMax * 2, ladoPedido(raioMax));
  const minimo = (centro ? alturaDoNo + alturaDoTexto + 4 : Math.max(alturaDoNo, alturaDoTexto)) + folga;
  const fabrica = (config.layoutDaArvore === 'tree' ? d3Tree : d3Cluster)().nodeSize([1, 1]);
  fabrica(visivel);
  const visiveis = visivel.descendants();
  const minU = Math.min(...visiveis.map((n) => n.x));
  const maxU = Math.max(...visiveis.map((n) => n.x));
  const unidades = maxU - minU + 1;
  const espaco = Math.max(minimo, alturaUtil > 0 ? alturaUtil / unidades : 0);
  const topo = centro ? alturaDoTexto + 4 : 0;
  let maisFundo = 0;
  for (const n of visiveis) {
    n.x = topo + (n.x - minU + 0.5) * espaco;
    n.y = xDoNivel[n.depth];
    maisFundo = Math.max(maisFundo, n.depth);
  }
  const larguraVisivel = xDoNivel[maisFundo] + Math.max(0, m.reservaDir[maisFundo]) + folga;
  return {
    largura,
    larguraVisivel,
    altura: topo + unidades * espaco,
    limiteDoRotulo: limite,
    ladoDoIcone: (raio) => ladoDoIconeDaArvore(config, raio, espaco),
  };
}

/** Converte (ângulo, raio) para (x, y) com o zero apontando para cima. */
export function paraCartesiano(angulo, raio) {
  return [raio * Math.cos(angulo - Math.PI / 2), raio * Math.sin(angulo - Math.PI / 2)];
}

/* ------------------------------------------------------------------ */
/* Desenho                                                             */
/* ------------------------------------------------------------------ */

/** Caminho de uma ligação radial. */
function caminhoRadial(origem, destino, forma) {
  const [x1, y1] = paraCartesiano(origem.x, origem.y);
  const [x2, y2] = paraCartesiano(destino.x, destino.y);

  if (forma === 'reta') return `M${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}`;

  if (forma === 'cotovelo') {
    // Vai pelo arco no raio do pai e depois sai reto para fora: é o
    // desenho que deixa claro "quem desce de quem".
    const [xm, ym] = paraCartesiano(destino.x, origem.y);
    const sentido = destino.x > origem.x ? 1 : 0;
    const arcoGrande = Math.abs(destino.x - origem.x) > Math.PI ? 1 : 0;
    return [
      `M${x1.toFixed(2)},${y1.toFixed(2)}`,
      `A${origem.y.toFixed(2)},${origem.y.toFixed(2)} 0 ${arcoGrande} ${sentido} ${xm.toFixed(2)},${ym.toFixed(2)}`,
      `L${x2.toFixed(2)},${y2.toFixed(2)}`,
    ].join(' ');
  }

  // Curva: Bézier com os controles no meio do raio.
  const raioMedio = (origem.y + destino.y) / 2;
  const [cx1, cy1] = paraCartesiano(origem.x, raioMedio);
  const [cx2, cy2] = paraCartesiano(destino.x, raioMedio);
  return `M${x1.toFixed(2)},${y1.toFixed(2)}C${cx1.toFixed(2)},${cy1.toFixed(2)} ${cx2.toFixed(2)},${cy2.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

/** Caminho de uma ligação horizontal (x = profundidade, y = posição). */
function caminhoHorizontal(origem, destino, forma) {
  const x1 = origem.y;
  const y1 = origem.x;
  const x2 = destino.y;
  const y2 = destino.x;

  if (forma === 'reta') return `M${x1},${y1}L${x2},${y2}`;
  if (forma === 'cotovelo') {
    const meio = (x1 + x2) / 2;
    return `M${x1},${y1}H${meio.toFixed(2)}V${y2}H${x2}`;
  }
  const meio = (x1 + x2) / 2;
  return `M${x1},${y1}C${meio.toFixed(2)},${y1} ${meio.toFixed(2)},${y2} ${x2},${y2}`;
}

/**
 * Texto do rótulo de um nó conforme "O que mostrar no rótulo".
 *
 * Numa árvore o rótulo é, antes de tudo, o NOME do nó — e o default do
 * painel ("valor") não pode trocar o nome por um número em dashboards
 * salvos. Por isso o mapeamento aqui é:
 *   - "valor" (padrão): o nome, e "nome (valor)" se "Incluir o valor no
 *     rótulo" estiver ligado (comportamento de antes);
 *   - "nome": só o nome;
 *   - "nomeValor": "nome: valor";
 *   - "percentual": "nome (x% do total)";
 *   - "valorPercentual": "nome (valor · x%)".
 * O valor sai de `textoDoRotulo` (formato e casas do painel). Só o NOME é
 * truncado — truncar o número esconderia justamente o dado.
 */
export function textoDoRotuloDoNo(rot, no, { valueFormat, total, mostrarValor = false, limite = 24 } = {}) {
  const nome = truncar(String(no.data.rotulo || ''), limite);
  const semCorte = Object.assign({}, rot, { truncar: 0 });
  const valor = no.value || 0;
  const textoValor = () => textoDoRotulo(Object.assign({}, semCorte, { conteudo: 'valor' }), { valor, valueFormat });
  const textoPct = () =>
    textoDoRotulo(Object.assign({}, semCorte, { conteudo: 'percentual' }), { valor, total, valueFormat });
  switch (rot.conteudo) {
    case 'nome':
      return nome;
    case 'nomeValor':
      return `${nome}: ${textoValor()}`;
    case 'percentual':
      return `${nome} (${textoPct()})`;
    case 'valorPercentual':
      return `${nome} (${textoValor()} · ${textoPct()})`;
    case 'valor':
    default:
      return mostrarValor ? `${nome} (${textoValor()})` : nome;
  }
}

/**
 * Partes do rótulo de um nó para o "Texto longo" (5.11, v3): o NOME e as
 * partes extras (valor, percentual), mais o formato de junção. Com
 * "O que aparece no rótulo" = Automático, o formato é o de antes
 * (`textoDoRotuloDoNo`): "nome (valor)", "nome: valor"...
 */
export function partesDoRotuloDoNo(rot, no, { valueFormat, total, mostrarValor = false, tl } = {}) {
  const nome = String(no.data.rotulo || '');
  const semCorte = Object.assign({}, rot, { truncar: 0 });
  const valor = no.value || 0;
  const v = () => textoDoRotulo(Object.assign({}, semCorte, { conteudo: 'valor' }), { valor, valueFormat });
  const p = () => textoDoRotulo(Object.assign({}, semCorte, { conteudo: 'percentual' }), { valor, total, valueFormat });
  const partes = tl && tl.partes !== 'auto' ? tl.partes : null;
  if (partes) {
    const extras = partes === 'nomeValor' ? [v()] : partes === 'nomeValorPct' ? [v(), p()] : partes === 'nomePct' ? [p()] : [];
    return { nome, extras, formatar: null };
  }
  switch (rot.conteudo) {
    case 'nome':
      return { nome, extras: [], formatar: null };
    case 'nomeValor':
      return { nome, extras: [v()], formatar: (n, e) => (e.length ? `${n}: ${e[0]}` : n) };
    case 'percentual':
      return { nome, extras: [p()], formatar: (n, e) => (e.length ? `${n} (${e[0]})` : n) };
    case 'valorPercentual':
      return { nome, extras: [v(), p()], formatar: (n, e) => (e.length ? `${n} (${e.join(' · ')})` : n) };
    case 'valor':
    default:
      return mostrarValor
        ? { nome, extras: [v()], formatar: (n, e) => (e.length ? `${n} (${e[0]})` : n) }
        : { nome, extras: [], formatar: null };
  }
}

/**
 * Maior largura de rótulo (folhas e nós internos), ANTES do layout: é o
 * que as árvores reservam no modo "Mostrar inteiro" (5.11).
 */
export function medirRotulosDaArvore(raiz, { config, tema, valueFormat, total, limite = Infinity }) {
  const rot = lerRotulos(config, tema);
  const tl = lerTextoLongo(config);
  const saida = { folhas: 0, internos: 0 };
  if (!rot.mostrar) return saida;
  for (const no of raiz.descendants()) {
    const ehFolha = !no.children || !no.children.length;
    const quer = ehFolha ? config.mostrarRotulosDeFolha !== false : config.mostrarRotulosInternos === true;
    if (!quer || !no.data.rotulo) continue;
    const pt = partesDoRotuloDoNo(rot, no, { valueFormat, total, mostrarValor: config.mostrarValorNoRotulo === true, tl });
    const aj = ajustarRotulo({ ...pt, tamanho: rot.tamanho, largura: limite, tl, estilo: { negrito: rot.negrito } });
    const k = ehFolha ? 'folhas' : 'internos';
    saida[k] = Math.max(saida[k], aj.largura);
  }
  return saida;
}

/**
 * Desenha uma árvore já posicionada.
 *
 * Opções do painel lidas AQUI, a cada desenho (correções v2):
 *   - rótulos (6.1): todo o bloco "Rótulos" via `lerRotulos`/`estilizarRotulo`
 *     — mostrar, tamanho, cor, negrito, rotação, truncar, posição,
 *     conteúdo, formato, casas e "esconder sobrepostos";
 *   - cores (6.2): preenchimento + opacidade (`aplicarPreenchimento`) e
 *     contorno (`lerContorno`/`aplicarContorno`); ligações na cor de borda
 *     do tema;
 *   - marcadores (6.4): nós pela função única `criarMarcadorSvg`
 *     (círculo, ou `config.formaDoPonto` se o gráfico tiver essa opção).
 *
 * @param {object} params
 * @param {'radial'|'horizontal'} params.modo
 * @param {string} [params.valueFormat] value_format do campo do valor
 * @param {number} [params.totalGeral] base do "percentual do total"
 * @returns {{nos:Array<{no:object, elemento:Element}>, grupo:Element}}
 */
export function desenharArvore({
  svg,
  raiz,
  modo,
  deslocamento = { x: 0, y: 0 },
  config,
  tema,
  valueFormat,
  totalGeral = null,
  cores,
  aoInteragir,
  compacto = false,
  valorDeReferencia = null,
  chaveDe = null,
  limiteDoRotulo = Infinity,
  geometria = null,
}) {
  const grupo = criarSvgEl('g', { pai: svg });
  if (deslocamento.x || deslocamento.y) {
    grupo.setAttribute('transform', `translate(${deslocamento.x},${deslocamento.y})`);
  }

  const forma = config.formaDaLigacao || 'curva';
  const espessuraBase = Number(config.espessuraDaLigacao) || 1;
  // `valorDeReferencia` é o que permite várias árvores compartilharem a
  // escala de tamanho dos nós: sem ele, a maior folha de cada ramo sai do
  // mesmo tamanho e a comparação entre ramos desaparece.
  const maiorValor = valorDeReferencia || raiz.value || 1;

  // --- Ligações (antes dos nós, para ficarem por baixo) ---
  // Na cor de borda do tema: a cor do ramo já está nos nós, e a "Cor das
  // bordas" do tema personalizado passa a valer também aqui.
  const grupoDeLigacoes = criarSvgEl('g', { pai: grupo, classe: 'av-ligacoes' });
  for (const no of raiz.descendants()) {
    if (!no.parent) continue;
    const espessura = config.espessuraPorValor
      ? Math.max(0.4, espessuraBase * Math.sqrt((no.value || 0) / maiorValor) * 3)
      : espessuraBase;
    criarSvgEl('path', {
      pai: grupoDeLigacoes,
      classe: 'av-ligacao',
      atributos: {
        d: modo === 'radial' ? caminhoRadial(no.parent, no, forma) : caminhoHorizontal(no.parent, no, forma),
        stroke: tema.bordaForte || tema.borda,
        'stroke-width': espessura,
      },
    });
  }

  // --- Nós ---
  const grupoDeNos = criarSvgEl('g', { pai: grupo, classe: 'av-nos' });
  const formaDoNo = formaDoMarcador(config.formaDoPonto);
  const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });
  const rot = lerRotulos(config, tema);
  // Radial (árvore arquivada) mantém o corte antigo por caracteres; o
  // horizontal usa o "Texto longo" (5.11).
  const limiteDoNome = rot.truncar > 0 ? rot.truncar : compacto ? 14 : 24;
  const tl = lerTextoLongo(config);
  const iconePorValor = criarIconePorValor(config);
  const total = totalGeral || raiz.value || 0;
  const saida = [];
  const caixasDeRotulo = [];
  let maiorRotulo = 0;

  for (const no of raiz.descendants()) {
    const [x, y] = modo === 'radial' ? paraCartesiano(no.x, no.y) : [no.y, no.x];
    const raioDoNo = raioDoNoDaArvore(no.value, config, maiorValor);
    // Meia largura ocupada pelo nó (marcador ou ícone): o rótulo começa
    // depois dela (v3.2) — antes começava depois do marcador e o ícone,
    // maior, ficava por baixo do texto.
    let meiaLargura = Math.max(0, raioDoNo);

    // Um <g> por nó (marcador + rótulo + indicador): é ele que anima ao
    // abrir/fechar (5.9) — o marcador tem o próprio transform de posição.
    const grupoDoNo = criarSvgEl('g', { pai: grupoDeNos, classe: 'av-no-grupo' });
    if (chaveDe) grupoDoNo.setAttribute('data-chave', chaveDe(no));
    no.__grupo = grupoDoNo;
    no.__xy = { x: x + deslocamento.x, y: y + deslocamento.y };
    if (raioDoNo > 0) {
      const diametro = raioDoNo * 2;
      const elemento = criarMarcadorSvg(grupoDoNo, formaDoNo, x, y, diametro, {
        classe: 'av-no',
        'data-diametro': diametro.toFixed(2),
      });
      elemento.setAttribute('data-meia', meiaLargura.toFixed(2));
      aplicarPreenchimento(elemento, cores(no), config);
      aplicarContorno(elemento, contorno);
      // Ícone por valor (5.14f): ícone do nome do nó, sobre o marcador.
      if (iconePorValor && modo !== 'radial') {
        const lado = geometria ? geometria.ladoDoIcone(raioDoNo) : ladoDoIconeDaArvore(config, raioDoNo);
        const ic = desenharIconePorValor(iconePorValor, { pai: grupoDoNo, valor: no.data.rotulo, lado, corPadrao: cores(no), estilo: config.estiloDoIcone });
        if (ic) {
          ic.setAttribute('x', String(x - lado / 2));
          ic.setAttribute('y', String(y - lado / 2));
          ic.style.pointerEvents = 'none';
          meiaLargura = Math.max(meiaLargura, lado / 2);
          elemento.setAttribute('data-meia', meiaLargura.toFixed(2));
        }
      }
      saida.push({ no, elemento });
      if (typeof aoInteragir === 'function') aoInteragir(elemento, no);
    }

    // --- Rótulo ---
    if (!rot.mostrar) continue;
    const ehFolha = !no.children || !no.children.length;
    const querRotulo = ehFolha
      ? config.mostrarRotulosDeFolha !== false
      : config.mostrarRotulosInternos === true;
    if (!querRotulo || !no.data.rotulo) continue;

    const afastamento = meiaLargura + 4;
    if (modo === 'radial') {
      const texto = textoDoRotuloDoNo(rot, no, {
        valueFormat,
        total,
        mostrarValor: config.mostrarValorNoRotulo === true,
        limite: limiteDoNome,
      });
      const el = criarSvgEl('text', { pai: grupoDoNo, classe: 'av-rotulo', atributos: { 'dominant-baseline': 'central' } });
      definirTexto(el, texto);
      // No círculo, o texto acompanha o raio e vira de cabeça para baixo na
      // metade esquerda, senão fica ilegível.
      const viradoParaEsquerda = no.x >= Math.PI;
      const anguloEmGraus = (no.x * 180) / Math.PI - 90;
      el.setAttribute(
        'transform',
        `rotate(${anguloEmGraus}) translate(${no.y + (viradoParaEsquerda ? -afastamento : afastamento)},0)${
          viradoParaEsquerda ? ' rotate(180)' : ''
        }`
      );
      el.setAttribute('text-anchor', viradoParaEsquerda ? 'end' : 'start');
      estilizarRotulo(el, rot, { x: 0, y: 0 });
      continue;
    }

    // "Posição do rótulo" no layout horizontal:
    //   auto  = folha à direita do nó, nó interno à esquerda (como antes);
    //   fora / foraComLinha = sempre à direita; dentro = sempre à esquerda;
    //   centro = centralizado acima do nó.
    let ancora;
    let tx;
    let ty = y;
    if (rot.posicao === 'centro') {
      ancora = 'middle';
      tx = x;
      ty = y - afastamento - rot.tamanho / 2;
    } else {
      const aDireita =
        rot.posicao === 'fora' || rot.posicao === 'foraComLinha' ? true : rot.posicao === 'dentro' ? false : ehFolha;
      ancora = aDireita ? 'start' : 'end';
      // À esquerda de um nó com filhos fica o "+"/"−": o rótulo vai além dele.
      const recuo = !aDireita && geometria && geometria.comIndicador && geometria.comIndicador(no) ? LARGURA_DO_INDICADOR : 0;
      tx = aDireita ? x + afastamento : x - afastamento - recuo;
    }
    // Texto longo (5.11): inteiro / quebrar / reduzir / cortar / abreviar / só o nome.
    const pt = partesDoRotuloDoNo(rot, no, { valueFormat, total, mostrarValor: config.mostrarValorNoRotulo === true, tl });
    const aj = ajustarRotulo({ ...pt, tamanho: rot.tamanho, largura: limiteDoRotulo, tl, estilo: { negrito: rot.negrito } });
    const el = criarSvgEl('text', { pai: grupoDoNo, classe: 'av-rotulo', atributos: { 'dominant-baseline': 'central' } });
    el.setAttribute('x', tx);
    el.setAttribute('y', ty);
    el.setAttribute('text-anchor', ancora);
    estilizarRotulo(el, { ...rot, tamanho: aj.tamanho }, { x: tx, y: ty });
    const alturaDaLinha = aj.tamanho * 1.15;
    if (aj.linhas.length === 1) definirTexto(el, aj.linhas[0]);
    else {
      aj.linhas.forEach((linha, i) => {
        const span = criarSvgEl('tspan', {
          pai: el,
          atributos: { x: tx, y: ty + (i - (aj.linhas.length - 1) / 2) * alturaDaLinha, 'dominant-baseline': 'central' },
        });
        definirTexto(span, linha);
      });
    }
    if (aj.cortado) {
      el.setAttribute('data-completo', aj.completo);
      // Texto completo como dica nativa do nó (fora do <text>, para não
      // somar ao conteúdo do rótulo).
      if (tl.tooltipCompleto) {
        const titulo = criarSvgEl('title', { pai: grupoDoNo });
        definirTexto(titulo, aj.completo);
      }
    }
    maiorRotulo = Math.max(maiorRotulo, aj.largura);

    const largura = aj.largura;
    caixasDeRotulo.push({
      el,
      peso: no.value || 0,
      x: ancora === 'start' ? tx + largura / 2 : ancora === 'end' ? tx - largura / 2 : tx,
      y: ty,
      largura,
      altura: alturaDaLinha * aj.linhas.length,
    });
  }

  // "Esconder rótulos que se sobrepõem": os nós de maior valor ficam.
  caixasDeRotulo.sort((a, b) => b.peso - a.peso);
  esconderColisoes(caixasDeRotulo, rot);

  return { nos: saida, grupo, maiorRotulo };
}

/**
 * Função de cor conforme a opção escolhida. A paleta vem de
 * `paletaDoConfig` — que respeita "Inverter ordem das cores" (antes era
 * ignorado: lia-se `coresDaPaleta(config.paleta)` direto).
 */
export function criarCoresDaArvore(raiz, config, tema) {
  const paleta = paletaDoConfig(config);
  const corUnica = config.corUnica || paleta[0] || tema.destaque;

  if (config.colorirPor === 'unica') return () => corUnica;

  if (config.colorirPor === 'nivel') {
    return (no) => paleta[no.depth % paleta.length];
  }

  // Por ramo: todo descendente herda a cor do filho-da-raiz de que desce.
  const corPorRamo = new Map();
  (raiz.children || []).forEach((filho, i) => {
    corPorRamo.set(filho, corDoItem(config, i));
  });

  return (no) => {
    if (!no.parent) return tema.textoSuave;
    let atual = no;
    while (atual.parent && atual.parent.parent) atual = atual.parent;
    return corPorRamo.get(atual) || corUnica;
  };
}

/**
 * Linhas do tooltip de um nó. Mora na base (e não num gráfico) porque
 * importar de um gráfico registrado embute o `defineViz` dele no bundle.
 */
export function montarLinhas(no, campoDoValor, formatar) {
  const linhas = [];
  if (campoDoValor) linhas.push({ rotulo: campoDoValor.rotuloCurto, valor: formatar(no.value || 0) });
  linhas.push({ rotulo: 'Nível', valor: String(no.depth) });
  if (no.children && no.children.length) {
    linhas.push({ rotulo: 'Filhos diretos', valor: String(no.children.length) });
    linhas.push({ rotulo: 'Descendentes', valor: String(no.descendants().length - 1) });
  }
  if (no.parent && no.parent.value) {
    linhas.push({
      rotulo: `Dentro de ${no.parent.data.rotulo}`,
      valor: `${((100 * (no.value || 0)) / no.parent.value).toFixed(1)}%`,
    });
  }
  return linhas;
}
