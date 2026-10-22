/**
 * _serie_temporal — base compartilhada dos gráficos de série ao longo do tempo.
 *
 * `linha_bandas`, `drawdown`, `retorno_acumulado` e `fluxo_caixa` montam a
 * mesma cena: um eixo de categorias (quase sempre datas), uma escala
 * numérica no Y, uma guia vertical que acompanha o mouse e um tooltip que
 * fala do PERÍODO inteiro, não de uma marca solta.
 *
 * O que fica aqui é essa cena. O que cada gráfico desenha dentro dela é
 * problema dele.
 */

import { criarEl, criarSvgEl, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica, escalaDePonto } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { formatadorDeValueFormat, formatarData } from '../../core/format.js';
import { extrairMatriz } from '../../core/series.js';
import { criarLayoutComLegenda } from '../../core/legend.js';
import { listaDeValores } from '../../core/options-kit.js';

export const CSS_SERIE_TEMPORAL = `
.st-area{position:relative;width:100%;height:100%;}
.st-linha{fill:none;pointer-events:none;}
.st-area-preenchida{pointer-events:none;}
.st-ponto{pointer-events:none;}
.st-guia{pointer-events:none;}
.st-marca{pointer-events:none;}
.st-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.7;pointer-events:none;}
.st-destaque{pointer-events:none;}
`;

/** Opções de traçado que todos os gráficos da família oferecem. */
export function opcoesDeTracado({ secao = 'Formato', espessuraPadrao = 2 } = {}) {
  return {
    curvaDaLinha: {
      type: 'string',
      label: 'Suavização da linha',
      section: secao,
      display: 'select',
      default: 'monotone',
      values: listaDeValores([
        { rotulo: 'Suave sem ultrapassar (monotone)', valor: 'monotone' },
        { rotulo: 'Reta', valor: 'linear' },
        { rotulo: 'Degraus', valor: 'stepAfter' },
        { rotulo: 'Catmull-Rom', valor: 'catmull' },
      ]),
    },
    espessuraDaLinha: {
      type: 'number',
      label: 'Espessura da linha',
      section: secao,
      display: 'range',
      min: 0.5,
      max: 6,
      step: 0.5,
      default: espessuraPadrao,
    },
    mostrarPontos: {
      type: 'boolean',
      label: 'Marcar cada período com um ponto',
      section: secao,
      default: false,
    },
    tratamentoDeNulos: {
      type: 'string',
      label: 'Valores faltando',
      section: 'Dados',
      display: 'select',
      default: 'interpolar',
      values: listaDeValores([
        { rotulo: 'Interpolar entre os vizinhos', valor: 'interpolar' },
        { rotulo: 'Cortar a linha', valor: 'manter' },
        { rotulo: 'Tratar como zero', valor: 'zero' },
      ]),
    },
  };
}

/**
 * Lê a matriz e devolve o que a família precisa para desenhar.
 *
 * @returns {{matriz, categorias, rotuloDaCategoria, formatarValor}|null}
 */
export function lerSerieTemporal(ctx, { minimoDeCategorias = 2 } = {}) {
  const { modelo, config } = ctx;
  const matriz = extrairMatriz(modelo, config);
  for (const aviso of matriz.avisos) ctx.avisar(aviso);

  if (matriz.categorias.length < minimoDeCategorias) {
    return null;
  }

  const campoDeFormato = matriz.medida || modelo.medidas[0] || null;
  const formatarValor = formatadorDeValueFormat(campoDeFormato && campoDeFormato.valueFormat, {
    casas: Number(config.casasDecimaisDoRotulo) || 1,
  });

  const ehData = !!(matriz.campoDaCategoria && matriz.campoDaCategoria.ehData);
  const rotuloDaCategoria = (categoria) =>
    ehData ? formatarData(categoria.valorBruto, config.formatoDeData || 'auto') : categoria.rotulo;

  return { matriz, categorias: matriz.categorias, rotuloDaCategoria, formatarValor, campoDeFormato };
}

/**
 * Monta o SVG, as escalas e os eixos.
 *
 * @param {object} params
 * @param {number[]} params.valores todos os valores que precisam caber no Y
 * @returns {{area, svg, retangulo, escalaX, escalaY, x, larguraUtil, alturaUtil}}
 */
export function montarPlano({ ctx, serie, valores, formatarY, comLegenda = false }) {
  const { config, tema, raiz, largura, altura } = ctx;

  // A limpeza vem antes do estilo: `limpar` levaria junto o <style> que
  // `injetarEstilo` acabou de pôr. Com legenda, quem limpa é o layout.
  let hospedeiro = raiz;
  let areaLegenda = null;
  if (comLegenda) {
    const layout = criarLayoutComLegenda(raiz, config);
    hospedeiro = layout.areaGrafico;
    areaLegenda = layout.areaLegenda;
  } else {
    ctx.limparRaiz();
  }
  injetarEstilo(raiz, CSS_SERIE_TEMPORAL, 'st');

  const larguraUtil = Math.max(80, hospedeiro.clientWidth || largura);
  const alturaUtil = Math.max(80, hospedeiro.clientHeight || altura);
  const area = criarEl('div', { classe: 'st-area', pai: hospedeiro });

  const formatar = formatarY || serie.formatarValor;
  const margens = calcularMargens({
    rotulosY: valores.map(formatar),
    rotulosX: serie.categorias.map(serie.rotuloDaCategoria),
    config,
    tema,
  });
  const retangulo = areaDeDesenho(larguraUtil, alturaUtil, margens);

  const escalaX = escalaDePonto({
    dominio: serie.categorias.map((c) => c.chave),
    intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
    preenchimento: 0.04,
  });
  const escalaY = escalaNumerica({
    valores,
    intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
    config,
    eixo: 'Y',
  });

  const svg = criarSvgEl('svg', {
    pai: area,
    atributos: { width: larguraUtil, height: alturaUtil, viewBox: `0 0 ${larguraUtil} ${alturaUtil}` },
  });

  desenharEixos({
    svg,
    escalaX,
    escalaY,
    area: retangulo,
    config,
    tema,
    rotulosDeBanda: serie.categorias.map((c) => c.chave),
    formatarX: (chave) => {
      const categoria = serie.categorias.find((item) => item.chave === chave);
      return categoria ? serie.rotuloDaCategoria(categoria) : String(chave);
    },
    formatarY: formatar,
  });

  return {
    area,
    areaLegenda,
    svg,
    retangulo,
    escalaX,
    escalaY,
    larguraUtil,
    alturaUtil,
    x: (i) => escalaX(serie.categorias[i].chave),
  };
}

/** Linha horizontal de referência (zero, meta, média). */
export function desenharReferencia({ svg, retangulo, y, cor, tracejada = true, espessura = 1 }) {
  return criarSvgEl('line', {
    pai: svg,
    classe: 'st-marca',
    atributos: {
      x1: retangulo.esquerda,
      x2: retangulo.esquerda + retangulo.largura,
      y1: y,
      y2: y,
      stroke: cor,
      'stroke-width': espessura,
      'stroke-dasharray': tracejada ? '4 3' : null,
    },
  });
}

/**
 * Guia vertical + tooltip por período.
 *
 * `montarLinhasDoTooltip(indice)` devolve as linhas do tooltip daquele
 * período, ou `null` para não mostrar nada ali.
 */
export function ligarGuiaEHover({ ctx, plano, serie, montarLinhasDoTooltip, aoClicar }) {
  const { config, tema } = ctx;

  const tooltip = config.mostrarTooltip === false ? null : criarTooltip(ctx.raiz, tema);
  ctx.estado.tooltip = tooltip;

  const guia = criarSvgEl('line', {
    pai: plano.svg,
    classe: 'st-guia',
    atributos: {
      y1: plano.retangulo.cima,
      y2: plano.retangulo.cima + plano.retangulo.altura,
      stroke: tema.bordaForte,
      'stroke-width': 1,
      opacity: 0,
    },
  });

  const indiceMaisProximo = (clientX) => {
    const caixa = plano.area.getBoundingClientRect();
    const px = clientX - caixa.left;
    let melhor = 0;
    let menor = Infinity;
    serie.categorias.forEach((categoria, i) => {
      const d = Math.abs(plano.escalaX(categoria.chave) - px);
      if (d < menor) {
        menor = d;
        melhor = i;
      }
    });
    return melhor;
  };

  ctx.eventos.on(plano.area, 'pointermove', (ev) => {
    const indice = indiceMaisProximo(ev.clientX);
    guia.setAttribute('x1', plano.x(indice));
    guia.setAttribute('x2', plano.x(indice));
    guia.setAttribute('opacity', 0.6);

    if (!tooltip) return;
    const linhas = montarLinhasDoTooltip(indice);
    if (!linhas || !linhas.length) {
      tooltip.esconder();
      return;
    }
    tooltip.mostrar(
      { titulo: serie.rotuloDaCategoria(serie.categorias[indice]), linhas },
      ev.clientX,
      ev.clientY
    );
  });

  ctx.eventos.on(plano.area, 'pointerleave', () => {
    guia.setAttribute('opacity', 0);
    if (tooltip) tooltip.esconder();
  });

  if (typeof aoClicar === 'function') {
    ctx.eventos.on(plano.area, 'click', (ev) => aoClicar(indiceMaisProximo(ev.clientX), ev));
  }

  return { tooltip, guia };
}

/** Abre o drill da categoria de um período, quando houver. */
export function drillDoPeriodo(ctx, serie, indice, evento) {
  const categoria = serie.categorias[indice];
  if (!categoria || !serie.matriz.campoDaCategoria) return;
  const linha = ctx.modelo.linhas[categoria.indiceDaPrimeiraLinha];
  const celula = ctx.modelo.celula(linha, serie.matriz.campoDaCategoria.nome);
  if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, evento);
}

/** Limpeza padrão da família. */
export function destruirSerieTemporal({ estado }) {
  if (estado && estado.tooltip) estado.tooltip.destruir();
}
