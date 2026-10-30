/**
 * _serie_temporal — base compartilhada dos gráficos de série ao longo do tempo.
 *
 * `drawdown`, `grafico_controle`, `bump_chart` e `slope_chart` montam a
 * mesma cena: um eixo de categorias (quase sempre datas), uma escala
 * numérica no Y, uma guia vertical que acompanha o mouse e um tooltip que
 * fala do PERÍODO inteiro, não de uma marca solta.
 *
 * O que fica aqui é essa cena — e, desde as correções v2, o que a família
 * inteira precisa para respeitar o painel:
 *   - `opcoesDeCorPorSerie`: a opção dinâmica "Cor — <série>" (vazio = da
 *     paleta), que antes era LIDA (`config.cor_<chave>`) mas nunca
 *     registrada no painel — e com a chave sem sanitizar;
 *   - `celulaDoPonto` / `textoDoPonto`: a célula do Looker por trás de um
 *     ponto, para o clique (drill) e para o tooltip mostrar o texto do
 *     Looker (textForCell) em vez de um número formatado pela viz;
 *   - `desenharRotulosDosPontos`: os rótulos de dado (módulo 6.1) com a
 *     função única de rótulos do núcleo;
 *   - `ligarGuiaEHover`: usa o tooltip ÚNICO do gráfico (`ctx.tooltip()`)
 *     e a "Ação do clique" (`ctx.cliqueNoItem`).
 *
 * O que cada gráfico desenha dentro da cena é problema dele.
 */

import { criarEl, criarSvgEl, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica, escalaDePonto } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { formatadorDeValueFormat, formatarData } from '../../core/format.js';
import { extrairMatriz } from '../../core/series.js';
import { criarLayoutComLegenda } from '../../core/legend.js';
import { listaDeValores, sanitizarChave } from '../../core/options-kit.js';
import { criarRotuloSvg, esconderColisoes, larguraDoTexto } from '../../core/rotulos.js';

export const CSS_SERIE_TEMPORAL = `
.st-area{position:relative;width:100%;height:100%;}
.st-linha{fill:none;pointer-events:none;}
.st-area-preenchida{pointer-events:none;}
.st-ponto{pointer-events:none;}
.st-guia{pointer-events:none;}
.st-marca{pointer-events:none;}
.st-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.7;pointer-events:none;}
.st-destaque{pointer-events:none;}
.st-area .bl-rotulo,.st-area .bl-marcador{pointer-events:none;}
`;

/** Acima disso o painel ficaria com uma lista de cores impraticável. */
const MAXIMO_DE_CORES_POR_SERIE = 30;

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
        { rotulo: 'Bump (horizontal nas pontas)', valor: 'bump' },
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
 * Opções dinâmicas "Cor — <série>", uma por série.
 *
 * O default é VAZIO de propósito: vazio = "a cor da paleta". Se o default
 * fosse a cor da paleta (como em `opcoesDeCorPorItem`), o config passaria a
 * trazer essa cor fixa e trocar a paleta ou ligar "Inverter ordem das
 * cores" deixaria de ter efeito — que é exatamente o defeito relatado.
 * A chave passa por `sanitizarChave`, igual a `corDoItem` (cores.js) lê.
 */
export function opcoesDeCorPorSerie(series, { secao = 'Cores' } = {}) {
  const saida = {};
  for (const s of series.slice(0, MAXIMO_DE_CORES_POR_SERIE)) {
    const chave = sanitizarChave(s.chave);
    if (!chave) continue;
    saida[`cor_${chave}`] = {
      type: 'string',
      label: `Cor — ${s.rotulo} (vazio = da paleta)`,
      section: secao,
      display: 'color',
      default: '',
    };
  }
  return saida;
}

/** `opcoesDinamicas` pronto para a família: cores por série, se houver séries. */
export function opcoesDinamicasDeSerie({ minimoDeSeries = 1 } = {}) {
  return ({ modelo, config }) => {
    if (!modelo || !modelo.dimensoes || !modelo.dimensoes.length) return {};
    const matriz = extrairMatriz(modelo, config);
    if (matriz.series.length < minimoDeSeries) return {};
    return opcoesDeCorPorSerie(matriz.series);
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
  // `0` casa decimal é escolha do usuário, não ausência (antes `|| 1`
  // transformava 0 em 1).
  const casas = Number(config.casasDecimaisDoRotulo);
  const formatarValor = formatadorDeValueFormat(campoDeFormato && campoDeFormato.valueFormat, {
    casas: Number.isFinite(casas) ? casas : 1,
  });

  const ehData = !!(matriz.campoDaCategoria && matriz.campoDaCategoria.ehData);
  const rotuloDaCategoria = (categoria) =>
    ehData ? formatarData(categoria.valorBruto, config.formatoDeData || 'auto') : categoria.rotulo;

  return { matriz, categorias: matriz.categorias, rotuloDaCategoria, formatarValor, campoDeFormato };
}

/**
 * Formatador do valor de UMA série. Quando cada série é uma medida, cada
 * uma tem o seu value_format (R$ numa, % na outra).
 */
export function formatadorDaSerie(serie, s, config = {}) {
  if (s && s.campo && s.campo.valueFormat) {
    const casas = Number(config.casasDecimaisDoRotulo);
    return formatadorDeValueFormat(s.campo.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 });
  }
  return serie.formatarValor;
}

/** value_format do campo por trás de uma série. */
export function valueFormatDaSerie(serie, s) {
  if (s && s.campo && s.campo.valueFormat) return s.campo.valueFormat;
  return serie.campoDeFormato ? serie.campoDeFormato.valueFormat : undefined;
}

/* ------------------------------------------------------------------ */
/* Célula do Looker por trás de um ponto                               */
/* ------------------------------------------------------------------ */

function chaveDe(modelo, linha, nome) {
  const bruto = modelo.valorBruto(linha, nome);
  return bruto === null || bruto === undefined ? '∅' : String(bruto);
}

/**
 * Linhas da consulta que formam o ponto (período `indice` da série `s`) e
 * o campo/pivô da medida. Sem `s` (ou "Outros"), só o período.
 */
export function localizarPonto(ctx, matriz, indice, s) {
  const { modelo } = ctx;
  const categoria = matriz.categorias[indice];
  const campoDaCategoria = matriz.campoDaCategoria;
  if (!categoria || !campoDaCategoria) return null;

  let campo = null;
  let pivo;
  let filtro = () => true;
  if (s && !s.ehOutros) {
    if (matriz.origem === 'pivo') {
      campo = matriz.medida ? matriz.medida.nome : null;
      pivo = s.chave;
    } else if (matriz.origem === 'dimensao') {
      campo = matriz.medida ? matriz.medida.nome : null;
      const campoDaSerie = modelo.dimensoes.find((d) => d.nome !== campoDaCategoria.nome);
      if (campoDaSerie) filtro = (linha) => chaveDe(modelo, linha, campoDaSerie.nome) === s.chave;
    } else {
      campo = s.chave;
    }
  }

  const linhas = modelo.linhas.filter(
    (linha) => chaveDe(modelo, linha, campoDaCategoria.nome) === categoria.chave && filtro(linha)
  );
  return { linhas, campo, pivo, categoria };
}

/**
 * Célula para o clique: a da MEDIDA do ponto (é onde o Looker pendura os
 * links de drill); sem ela, a da dimensão do período.
 */
export function celulaDoPonto(ctx, matriz, indice, s) {
  const { modelo } = ctx;
  const local = localizarPonto(ctx, matriz, indice, s);
  if (!local) return null;
  if (local.campo && local.linhas.length) {
    const c = modelo.celula(local.linhas[0], local.campo, local.pivo);
    if (c) return c;
  }
  const linha = modelo.linhas[local.categoria.indiceDaPrimeiraLinha];
  return linha ? modelo.celula(linha, matriz.campoDaCategoria.nome) : null;
}

/**
 * Texto do valor de um ponto para o tooltip e o rótulo.
 *
 * Quando o ponto é UMA célula da consulta, o texto é o do Looker
 * (textForCell — o mesmo que a tabela mostraria). Quando é soma de várias
 * linhas, ou valor interpolado, é um número derivado: formata pelo
 * value_format do campo (`formatar`). Nunca o número cru.
 */
export function textoDoPonto(ctx, matriz, indice, s, valor, formatar) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
  const local = localizarPonto(ctx, matriz, indice, s);
  if (local && local.campo && local.linhas.length === 1) {
    const linha = local.linhas[0];
    const bruto = ctx.modelo.valorNumerico(linha, local.campo, local.pivo);
    // Só usa o texto do Looker se ele descreve ESTE número (não um nulo
    // que a viz interpolou).
    if (bruto !== null && Math.abs(bruto - valor) < 1e-9 * Math.max(1, Math.abs(valor))) {
      const t = ctx.modelo.texto(linha, local.campo, local.pivo, '');
      if (t !== '') return t;
    }
  }
  return formatar(valor);
}

/** Célula da dimensão do período (drill do período inteiro). */
export function celulaDoPeriodo(ctx, serie, indice) {
  const categoria = serie.categorias[indice];
  if (!categoria || !serie.matriz.campoDaCategoria) return null;
  const linha = ctx.modelo.linhas[categoria.indiceDaPrimeiraLinha];
  return linha ? ctx.modelo.celula(linha, serie.matriz.campoDaCategoria.nome) : null;
}

/* ------------------------------------------------------------------ */
/* Cena                                                                */
/* ------------------------------------------------------------------ */

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

  // "Inverter eixo X" (bloco de eixos): o tempo corre da direita para a
  // esquerda. Antes a opção era declarada e ignorada nesta família.
  const intervaloX = [retangulo.esquerda, retangulo.esquerda + retangulo.largura];
  if (config.inverterEixoX === true) intervaloX.reverse();
  const escalaX = escalaDePonto({
    dominio: serie.categorias.map((c) => c.chave),
    intervalo: intervaloX,
    preenchimento: 0.04,
  });
  // Escala, mínimo, máximo e inverter do eixo Y vêm de `escalaNumerica`.
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
 * Rótulos de dado nos pontos (módulo 6.1), com a função única do núcleo.
 *
 * Regra de "quais pontos": se o texto mais largo cabe no espaço entre dois
 * períodos, rotula todos; senão, só o ÚLTIMO ponto de cada série (o valor
 * atual, que é o que se lê primeiro). Em ambos os casos, "Esconder rótulos
 * que se sobrepõem" vale — e o último ponto tem prioridade.
 *
 * Posição ("Posição do rótulo"): centro = sobre o ponto; dentro = abaixo;
 * fora / fora com linha-guia = acima; automática = `posicaoAuto`.
 *
 * @param {object} p
 * @param {Array<{cor?:string, pontos:Array<{indice:number, x:number, y:number, texto:string}>}>} p.grupos
 * @param {'auto'|'ultimo'} [p.quais] `ultimo` = só o último ponto de cada grupo
 * @returns {Element[]} os rótulos criados
 */
export function desenharRotulosDosPontos({ plano, rot, grupos, quantidadeDePeriodos, posicaoAuto = 'acima', raio = 3, pai, quais = 'auto', classe }) {
  if (!rot || !rot.mostrar) return [];
  const destino = pai || plano.svg;
  const validos = grupos.map((g) => ({ ...g, pontos: g.pontos.filter((p) => p && p.texto !== '' && Number.isFinite(p.y)) }));

  const maior = validos.reduce(
    (a, g) => g.pontos.reduce((b, p) => Math.max(b, larguraDoTexto(p.texto, rot.tamanho)), a),
    0
  );
  const passo = plano.retangulo.largura / Math.max(1, (quantidadeDePeriodos || 2) - 1);
  const todos = quais !== 'ultimo' && passo >= maior + 4;

  const lado =
    rot.posicao === 'centro' ? 'centro'
      : rot.posicao === 'dentro' ? 'abaixo'
        : rot.posicao === 'fora' || rot.posicao === 'foraComLinha' ? 'acima'
          : posicaoAuto;
  const deslocamento = lado === 'centro' ? 0 : raio + rot.tamanho / 2 + 3;
  const dy = lado === 'abaixo' ? deslocamento : -deslocamento;

  const esquerda = Math.min(plano.retangulo.esquerda, plano.retangulo.esquerda + plano.retangulo.largura);
  const direita = esquerda + plano.retangulo.largura;

  const prioritarios = [];
  const demais = [];
  for (const g of validos) {
    if (!g.pontos.length) continue;
    const ultimo = g.pontos.reduce((a, p) => (p.indice > a.indice ? p : a), g.pontos[0]);
    for (const p of todos ? g.pontos : [ultimo]) {
      const largura = larguraDoTexto(p.texto, rot.tamanho);
      let ancora = 'middle';
      let cx = p.x;
      if (p.x + largura / 2 > direita + 4) {
        ancora = 'end';
        cx = p.x - largura / 2;
      } else if (p.x - largura / 2 < esquerda - 4) {
        ancora = 'start';
        cx = p.x + largura / 2;
      }
      const el = criarRotuloSvg(destino, rot, {
        x: p.x,
        y: p.y + dy,
        texto: p.texto,
        ancora,
        corAutomatica: p.cor || g.cor,
      });
      if (!el) continue;
      if (classe) el.setAttribute('class', `bl-rotulo ${classe}`);
      if (g.aoCriar) g.aoCriar(el);
      const caixa = { el, x: cx, y: p.y + dy, largura, altura: rot.tamanho };
      (p === ultimo ? prioritarios : demais).push(caixa);
    }
  }
  const caixas = prioritarios.concat(demais);
  esconderColisoes(caixas, rot);
  return caixas.map((c) => c.el);
}

/* ------------------------------------------------------------------ */
/* Interação                                                           */
/* ------------------------------------------------------------------ */

/**
 * Guia vertical + tooltip por período + "Ação do clique".
 *
 * `montarLinhasDoTooltip(indice)` devolve as linhas do tooltip daquele
 * período — ou `{linhas, variaveis, titulo}` — ou `null` para não mostrar
 * nada ali. `celulaDoClique(indice)` (opcional) diz qual célula do Looker
 * o clique usa; o padrão é a dimensão do período.
 *
 * O tooltip é o ÚNICO do gráfico (`ctx.tooltip()`): não é criado nem
 * destruído aqui, o núcleo esconde no redesenho e remove no destroy.
 */
export function ligarGuiaEHover({ ctx, plano, serie, montarLinhasDoTooltip, aoClicar, celulaDoClique }) {
  const { tema } = ctx;

  const tooltip = ctx.tooltip();

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

  const conteudoDoPeriodo = (indice) => {
    const r = montarLinhasDoTooltip(indice);
    if (!r) return null;
    const linhas = Array.isArray(r) ? r : r.linhas;
    if (!linhas || !linhas.length) return null;
    const titulo = (!Array.isArray(r) && r.titulo) || serie.rotuloDaCategoria(serie.categorias[indice]);
    const variaveis = Object.assign(
      { categoria: serie.rotuloDaCategoria(serie.categorias[indice]) },
      Array.isArray(r) ? {} : r.variaveis || {}
    );
    return { titulo, linhas, variaveis };
  };

  ctx.eventos.on(plano.area, 'pointermove', (ev) => {
    const indice = indiceMaisProximo(ev.clientX);
    guia.setAttribute('x1', plano.x(indice));
    guia.setAttribute('x2', plano.x(indice));
    guia.setAttribute('opacity', 0.6);

    if (!tooltip) return;
    const conteudo = conteudoDoPeriodo(indice);
    if (!conteudo) {
      tooltip.esconder();
      return;
    }
    tooltip.mostrar(conteudo, ev.clientX, ev.clientY);
  });

  ctx.eventos.on(plano.area, 'pointerleave', () => {
    guia.setAttribute('opacity', 0);
    if (tooltip) tooltip.esconder();
  });

  ctx.eventos.on(plano.area, 'click', (ev) => {
    const indice = indiceMaisProximo(ev.clientX);
    if (typeof aoClicar === 'function') {
      aoClicar(indice, ev);
      return;
    }
    const celula = typeof celulaDoClique === 'function' ? celulaDoClique(indice) : celulaDoPeriodo(ctx, serie, indice);
    ctx.cliqueNoItem(ev, celula, conteudoDoPeriodo(indice));
  });

  return { tooltip, guia };
}

/**
 * Clique num período com a "Ação do clique" do painel (drill, fixar ou
 * nada). Mantida por compatibilidade: antes abria o drill direto.
 */
export function drillDoPeriodo(ctx, serie, indice, evento, conteudo) {
  return ctx.cliqueNoItem(evento, celulaDoPeriodo(ctx, serie, indice), conteudo);
}

/**
 * Avisa quando os períodos não estão em ordem crescente de data.
 *
 * Vale para todo cálculo CUMULATIVO (drawdown, saldo acumulado, retorno):
 * fora de ordem o número é ficção, e o desenho continua plausível — ou
 * seja, o erro não aparece sozinho.
 *
 * Só dá para checar quando a dimensão é de data: com categorias de texto
 * não existe "ordem certa" para comparar.
 */
export function avisarSeForaDeOrdem(ctx, serie, oQueEhCumulativo = 'O cálculo é cumulativo') {
  const campo = serie.matriz.campoDaCategoria;
  if (!campo || !campo.ehData) return false;

  const datas = serie.categorias.map((c) => (c.data ? c.data.getTime() : null));
  for (let i = 1; i < datas.length; i++) {
    if (datas[i] === null || datas[i - 1] === null) continue;
    if (datas[i] < datas[i - 1]) {
      ctx.avisar(
        `Os períodos não estão em ordem crescente de data. ${oQueEhCumulativo}, ` +
          'então ordene a consulta pela data no Explore — caso contrário o resultado não significa nada.'
      );
      return true;
    }
  }
  return false;
}

/**
 * Limpeza da família. O tooltip agora é o único do gráfico e quem o
 * remove é o núcleo (define-viz, no destroy); nada a fazer aqui. Mantida
 * para não quebrar quem ainda a passa como `aoDestruir`.
 */
export function destruirSerieTemporal() {}
