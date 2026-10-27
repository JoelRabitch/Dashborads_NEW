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
 */

import { criarSvgEl, definirTexto } from '../../core/dom.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { truncar } from '../../core/format.js';
import { listaDeValores } from '../../core/options-kit.js';
import { tree as d3Tree, cluster as d3Cluster } from 'd3-hierarchy';

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

/** Posiciona os nós da esquerda para a direita. */
export function layoutHorizontal(raiz, { largura, altura, config }) {
  const fabrica = (config.layoutDaArvore === 'tree' ? d3Tree : d3Cluster)();
  fabrica.size([altura, largura]);
  return fabrica(raiz);
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
 * Desenha uma árvore já posicionada.
 *
 * @param {object} params
 * @param {'radial'|'horizontal'} params.modo
 * @returns {{nos:Array<{no:object, elemento:Element}>}}
 */
export function desenharArvore({
  svg,
  raiz,
  modo,
  deslocamento = { x: 0, y: 0 },
  config,
  tema,
  formatar,
  cores,
  aoInteragir,
  compacto = false,
  valorDeReferencia = null,
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
        stroke: comOpacidade(cores(no), 0.45),
        'stroke-width': espessura,
      },
    });
  }

  // --- Nós ---
  const grupoDeNos = criarSvgEl('g', { pai: grupo, classe: 'av-nos' });
  const tamanhoBase = Number(config.tamanhoDoNo);
  const saida = [];

  for (const no of raiz.descendants()) {
    const [x, y] = modo === 'radial' ? paraCartesiano(no.x, no.y) : [no.y, no.x];
    const raioDoNo = config.tamanhoPorValor
      ? Math.max(1.5, (Number.isFinite(tamanhoBase) ? tamanhoBase : 4) * Math.sqrt((no.value || 0) / maiorValor) * 2.2)
      : Number.isFinite(tamanhoBase)
      ? tamanhoBase
      : 4;

    if (raioDoNo > 0) {
      const elemento = criarSvgEl('circle', {
        pai: grupoDeNos,
        classe: 'av-no',
        atributos: { cx: x, cy: y, r: raioDoNo, fill: cores(no), stroke: tema.fundo, 'stroke-width': 1 },
      });
      saida.push({ no, elemento });
      if (typeof aoInteragir === 'function') aoInteragir(elemento, no);
    }

    // --- Rótulo ---
    const ehFolha = !no.children || !no.children.length;
    const querRotulo = ehFolha
      ? config.mostrarRotulosDeFolha !== false
      : config.mostrarRotulosInternos === true;
    if (!querRotulo || !no.data.rotulo) continue;

    const texto = config.mostrarValorNoRotulo && formatar
      ? `${no.data.rotulo} (${formatar(no.value || 0)})`
      : no.data.rotulo;

    const el = criarSvgEl('text', {
      pai: grupo,
      classe: 'av-rotulo',
      atributos: {
        'font-size': Number(config.tamanhoDoRotulo) || Math.max(8, tema.tamanhoBase - (compacto ? 3 : 1)),
        fill: config.corDoRotulo || tema.texto,
        'dominant-baseline': 'central',
      },
    });

    if (modo === 'radial') {
      // No círculo, o texto acompanha o raio e vira de cabeça para baixo na
      // metade esquerda, senão fica ilegível.
      const viradoParaEsquerda = no.x >= Math.PI;
      const anguloEmGraus = (no.x * 180) / Math.PI - 90;
      const afastamento = raioDoNo + 4;
      el.setAttribute(
        'transform',
        `rotate(${anguloEmGraus}) translate(${no.y + (viradoParaEsquerda ? -afastamento : afastamento)},0)${
          viradoParaEsquerda ? ' rotate(180)' : ''
        }`
      );
      el.setAttribute('text-anchor', viradoParaEsquerda ? 'end' : 'start');
    } else {
      el.setAttribute('x', x + (ehFolha ? raioDoNo + 4 : -(raioDoNo + 4)));
      el.setAttribute('y', y);
      el.setAttribute('text-anchor', ehFolha ? 'start' : 'end');
    }

    definirTexto(el, truncar(texto, Number(config.truncarRotulo) || (compacto ? 14 : 24)));
  }

  return { nos: saida, grupo };
}

/** Função de cor conforme a opção escolhida. */
export function criarCoresDaArvore(raiz, config, tema) {
  const paleta = coresDaPaleta(config.paleta);
  const corUnica = config.corUnica || paleta[0] || tema.destaque;

  if (config.colorirPor === 'unica') return () => corUnica;

  if (config.colorirPor === 'nivel') {
    return (no) => paleta[no.depth % paleta.length];
  }

  // Por ramo: todo descendente herda a cor do filho-da-raiz de que desce.
  const corPorRamo = new Map();
  (raiz.children || []).forEach((filho, i) => {
    corPorRamo.set(filho, paleta[i % paleta.length]);
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
