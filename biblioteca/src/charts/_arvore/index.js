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
  const tamanhoBase = Number(config.tamanhoDoNo);
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
    const raioDoNo = config.tamanhoPorValor
      ? Math.max(1.5, (Number.isFinite(tamanhoBase) ? tamanhoBase : 4) * Math.sqrt((no.value || 0) / maiorValor) * 2.2)
      : Number.isFinite(tamanhoBase)
      ? tamanhoBase
      : 4;

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
      aplicarPreenchimento(elemento, cores(no), config);
      aplicarContorno(elemento, contorno);
      // Ícone por valor (5.14f): ícone do nome do nó, sobre o marcador.
      if (iconePorValor && modo !== 'radial') {
        const ic = desenharIconePorValor(iconePorValor, { pai: grupoDoNo, valor: no.data.rotulo, lado: Math.max(12, raioDoNo * 2 + 6), corPadrao: cores(no), estilo: config.estiloDoIcone });
        if (ic) {
          const lado = Number(ic.getAttribute('width'));
          ic.setAttribute('x', String(x - lado / 2));
          ic.setAttribute('y', String(y - lado / 2));
          ic.style.pointerEvents = 'none';
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

    const afastamento = Math.max(0, raioDoNo) + 4;
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
      tx = aDireita ? x + afastamento : x - afastamento;
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
