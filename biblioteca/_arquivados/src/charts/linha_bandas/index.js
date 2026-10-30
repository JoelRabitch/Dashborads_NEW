/**
 * linha_bandas — "Linha com Bandas".
 *
 * Uma linha central com uma faixa em volta: intervalo de confiança,
 * mínimo/máximo, projeção otimista/pessimista. O ponto do gráfico é mostrar
 * a INCERTEZA junto com o valor, então a banda nunca é enfeite.
 *
 * A banda pode vir de quatro lugares, e a diferença entre eles muda o que o
 * gráfico afirma:
 *
 *   - **três medidas** — inferior, central e superior vêm da consulta. É o
 *     único modo em que a banda é um dado de verdade;
 *   - **percentual fixo** — ±X% em volta da linha. É uma ilustração, não
 *     uma medição, e o gráfico diz isso na legenda;
 *   - **desvio padrão** — ±N desvios calculados sobre a própria série;
 *   - **mín/máx do pivô** — com pivô, a banda vai do menor ao maior valor
 *     entre as séries, e a linha é a média delas.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica, escalaDePonto, estatisticas } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { geradorDeLinha, geradorDeArea } from '../../core/shapes.js';
import { extrairMatriz, opcaoDeOrigemDasSeries, tratarNulos } from '../../core/series.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarData } from '../../core/format.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeEixos,
  blocoDeLegenda,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';

const CSS = `
.lb-area{position:relative;width:100%;height:100%;}
.lb-banda{pointer-events:none;}
.lb-linha{fill:none;pointer-events:none;}
.lb-ponto{pointer-events:none;}
.lb-guia{pointer-events:none;}
.lb-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.7;pointer-events:none;}
`;

const MODOS_DE_BANDA = [
  { rotulo: 'Três medidas (inferior, central, superior)', valor: 'medidas' },
  { rotulo: 'Percentual fixo em volta da linha', valor: 'percentual' },
  { rotulo: 'Desvio padrão da própria série', valor: 'desvio' },
  { rotulo: 'Mínimo e máximo entre as séries do pivô', valor: 'minimoMaximo' },
  { rotulo: 'Sem banda (só a linha)', valor: 'nenhuma' },
];

export default defineViz({
  id: 'linha_bandas',
  label: 'Linha com Bandas',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeLegenda(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      {
        modoDaBanda: {
          type: 'string',
          label: 'De onde vem a banda',
          section: 'Banda',
          display: 'select',
          default: 'auto',
          values: listaDeValores([{ rotulo: 'Detectar sozinho', valor: 'auto' }, ...MODOS_DE_BANDA]),
        },
        percentualDaBanda: {
          type: 'number',
          label: 'Percentual da banda (modo percentual)',
          section: 'Banda',
          display: 'range',
          min: 1,
          max: 100,
          step: 1,
          default: 10,
        },
        desviosDaBanda: {
          type: 'number',
          label: 'Quantos desvios padrão (modo desvio)',
          section: 'Banda',
          display: 'range',
          min: 0.5,
          max: 4,
          step: 0.5,
          default: 1,
        },
        opacidadeDaBanda: {
          type: 'number',
          label: 'Opacidade da banda',
          section: 'Banda',
          display: 'range',
          min: 0.05,
          max: 0.8,
          step: 0.05,
          default: 0.2,
        },
        contornoDaBanda: {
          type: 'boolean',
          label: 'Linhas pontilhadas nos limites da banda',
          section: 'Banda',
          default: true,
        },
        curvaDaLinha: {
          type: 'string',
          label: 'Suavização da linha',
          section: 'Formato',
          display: 'select',
          default: 'monotone',
          values: listaDeValores([
            { rotulo: 'Suave sem ultrapassar (monotone)', valor: 'monotone' },
            { rotulo: 'Reta', valor: 'linear' },
            { rotulo: 'Degraus', valor: 'degrau' },
            { rotulo: 'Catmull-Rom', valor: 'catmull' },
          ]),
        },
        espessuraDaLinha: {
          type: 'number',
          label: 'Espessura da linha',
          section: 'Formato',
          display: 'range',
          min: 0.5,
          max: 6,
          step: 0.5,
          default: 2,
        },
        mostrarPontos: {
          type: 'boolean',
          label: 'Marcar cada período com um ponto',
          section: 'Formato',
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
      }
    ),
    { gradeEixoY: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  opcoesDinamicas({ modelo, config }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    if (medidas.length < 2 || (config.modoDaBanda && config.modoDaBanda !== 'medidas' && config.modoDaBanda !== 'auto')) {
      return {};
    }
    return {
      ...opcaoDeEscolhaDeCampo('campoInferior', 'Medida do limite inferior', medidas, {
        secao: 'Banda',
        incluirNenhum: true,
        padrao: medidas[0].nome,
      }),
      ...opcaoDeEscolhaDeCampo('campoCentral', 'Medida da linha central', medidas, {
        secao: 'Banda',
        padrao: (medidas[1] || medidas[0]).nome,
      }),
      ...opcaoDeEscolhaDeCampo('campoSuperior', 'Medida do limite superior', medidas, {
        secao: 'Banda',
        incluirNenhum: true,
        padrao: (medidas[2] || medidas[medidas.length - 1]).nome,
      }),
    };
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const matriz = extrairMatriz(modelo, config);
    for (const aviso of matriz.avisos) ctx.avisar(aviso);

    if (matriz.categorias.length < 2) {
      ctx.mostrarVazio('São necessários pelo menos dois pontos no eixo para desenhar uma linha.');
      return;
    }

    const modo = decidirModo(modelo, config, matriz);
    const faixas = montarFaixas({ modelo, config, matriz, modo, ctx });

    if (!faixas.length) {
      ctx.mostrarVazio('Não encontrei uma medida para a linha central. Confira a seção Banda.');
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'lb');
    const { areaGrafico, areaLegenda } = criarLayoutComLegenda(raiz, config);
    const area = criarEl('div', { classe: 'lb-area', pai: areaGrafico });

    const larguraUtil = Math.max(80, areaGrafico.clientWidth || largura);
    const alturaUtil = Math.max(80, areaGrafico.clientHeight || altura);

    const campoDeFormato = matriz.medida || modelo.medidas[0];
    const formatarValor = formatadorDeValueFormat(campoDeFormato && campoDeFormato.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 1,
    });
    const ehData = matriz.campoDaCategoria && matriz.campoDaCategoria.ehData;
    const rotuloDaCategoria = (c) => (ehData ? formatarData(c.valorBruto, config.formatoDeData || 'auto') : c.rotulo);

    // ---------- Escalas ----------
    const todosOsValores = [];
    for (const faixa of faixas) {
      for (let i = 0; i < matriz.categorias.length; i++) {
        if (faixa.central[i] !== null) todosOsValores.push(faixa.central[i]);
        if (faixa.inferior && faixa.inferior[i] !== null) todosOsValores.push(faixa.inferior[i]);
        if (faixa.superior && faixa.superior[i] !== null) todosOsValores.push(faixa.superior[i]);
      }
    }

    const margens = calcularMargens({
      rotulosY: todosOsValores.map(formatarValor),
      rotulosX: matriz.categorias.map(rotuloDaCategoria),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(larguraUtil, alturaUtil, margens);

    const escalaX = escalaDePonto({
      dominio: matriz.categorias.map((c) => c.chave),
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      preenchimento: 0.04,
    });
    const escalaY = escalaNumerica({
      valores: todosOsValores,
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
      rotulosDeBanda: matriz.categorias.map((c) => c.chave),
      formatarX: (chave) => {
        const c = matriz.categorias.find((item) => item.chave === chave);
        return c ? rotuloDaCategoria(c) : String(chave);
      },
      formatarY: formatarValor,
    });

    // ---------- Bandas e linhas ----------
    const x = (i) => escalaX(matriz.categorias[i].chave);
    const curva = config.curvaDaLinha === 'degrau' ? 'stepAfter' : config.curvaDaLinha || 'monotone';
    const opacidade = Number(config.opacidadeDaBanda);

    // As bandas vêm ANTES das linhas para não cobrirem o que importa.
    for (const faixa of faixas) {
      if (!faixa.inferior || !faixa.superior) continue;
      const desenharBanda = geradorDeArea({
        x: (_, i) => x(i),
        y0: (_, i) => escalaY(faixa.inferior[i]),
        y1: (_, i) => escalaY(faixa.superior[i]),
        curva,
        definido: (_, i) => faixa.inferior[i] !== null && faixa.superior[i] !== null,
      });
      criarSvgEl('path', {
        pai: svg,
        classe: 'lb-banda',
        atributos: {
          d: desenharBanda(matriz.categorias) || '',
          fill: comOpacidade(faixa.cor, Number.isFinite(opacidade) ? opacidade : 0.2),
        },
      });

      if (config.contornoDaBanda !== false) {
        for (const limite of [faixa.inferior, faixa.superior]) {
          const linhaDoLimite = geradorDeLinha({
            x: (_, i) => x(i),
            y: (_, i) => escalaY(limite[i]),
            curva,
            definido: (_, i) => limite[i] !== null,
          });
          criarSvgEl('path', {
            pai: svg,
            classe: 'lb-linha',
            atributos: {
              d: linhaDoLimite(matriz.categorias) || '',
              stroke: comOpacidade(faixa.cor, 0.6),
              'stroke-width': 1,
              'stroke-dasharray': '4 3',
            },
          });
        }
      }
    }

    const espessura = Number(config.espessuraDaLinha) || 2;
    for (const faixa of faixas) {
      const desenharLinhaCentral = geradorDeLinha({
        x: (_, i) => x(i),
        y: (_, i) => escalaY(faixa.central[i]),
        curva,
        definido: (_, i) => faixa.central[i] !== null,
      });
      criarSvgEl('path', {
        pai: svg,
        classe: 'lb-linha',
        atributos: {
          d: desenharLinhaCentral(matriz.categorias) || '',
          stroke: faixa.cor,
          'stroke-width': espessura,
          'stroke-linejoin': 'round',
          'stroke-linecap': 'round',
        },
      });

      if (config.mostrarPontos) {
        matriz.categorias.forEach((_, i) => {
          if (faixa.central[i] === null) return;
          criarSvgEl('circle', {
            pai: svg,
            classe: 'lb-ponto',
            atributos: {
              cx: x(i),
              cy: escalaY(faixa.central[i]),
              r: Math.max(2, espessura * 1.2),
              fill: faixa.cor,
              stroke: tema.fundo,
              'stroke-width': 1,
            },
          });
        });
      }
    }

    // ---------- Nota sobre a origem da banda ----------
    // Uma banda de percentual fixo NÃO é uma medição. Dizer isso na tela é
    // a diferença entre ilustrar e enganar.
    const nota = notaDoModo(modo, config);
    if (nota) {
      const el = criarEl('div', { classe: 'lb-nota', pai: area });
      el.style.color = tema.textoSuave;
      definirTexto(el, nota);
    }

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const guia = criarSvgEl('line', {
      pai: svg,
      classe: 'lb-guia',
      atributos: {
        y1: retangulo.cima,
        y2: retangulo.cima + retangulo.altura,
        stroke: tema.bordaForte,
        'stroke-width': 1,
        opacity: 0,
      },
    });

    ctx.eventos.on(area, 'pointermove', (ev) => {
      const caixa = area.getBoundingClientRect();
      const px = ev.clientX - caixa.left;
      let indice = 0;
      let menor = Infinity;
      matriz.categorias.forEach((c, i) => {
        const d = Math.abs(escalaX(c.chave) - px);
        if (d < menor) {
          menor = d;
          indice = i;
        }
      });

      guia.setAttribute('x1', x(indice));
      guia.setAttribute('x2', x(indice));
      guia.setAttribute('opacity', 0.6);

      if (!tooltip) return;
      const linhas = [];
      for (const faixa of faixas) {
        if (faixa.central[indice] === null) continue;
        linhas.push({ rotulo: faixa.rotulo, valor: formatarValor(faixa.central[indice]), cor: faixa.cor });
        if (faixa.inferior && faixa.superior && faixa.inferior[indice] !== null) {
          linhas.push({
            rotulo: '   faixa',
            valor: `${formatarValor(faixa.inferior[indice])} a ${formatarValor(faixa.superior[indice])}`,
          });
        }
      }
      if (!linhas.length) return;
      tooltip.mostrar({ titulo: rotuloDaCategoria(matriz.categorias[indice]), linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      guia.setAttribute('opacity', 0);
      if (tooltip) tooltip.esconder();
    });

    // ---------- Legenda ----------
    if (config.mostrarLegenda !== false && faixas.length > 1) {
      desenharLegenda({
        hospedeiro: areaLegenda,
        tema,
        config,
        itens: faixas.map((f) => ({ chave: f.chave, rotulo: f.rotulo, cor: f.cor })),
        eventos: ctx.eventos,
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

/** Decide de onde vem a banda quando o usuário deixou em "auto". */
export function decidirModo(modelo, config, matriz) {
  if (config.modoDaBanda && config.modoDaBanda !== 'auto') return config.modoDaBanda;
  if (matriz.origem === 'pivo' && matriz.series.length > 1) return 'minimoMaximo';
  if (modelo.medidas.length >= 3) return 'medidas';
  return 'desvio';
}

/** Texto que explica de onde a banda saiu, quando ela não é um dado. */
function notaDoModo(modo, config) {
  if (modo === 'percentual') {
    return `Banda ilustrativa: ±${Number(config.percentualDaBanda) || 10}% em volta da linha (não é um dado da consulta).`;
  }
  if (modo === 'desvio') {
    return `Banda calculada: ±${Number(config.desviosDaBanda) || 1} desvio(s) padrão da própria série.`;
  }
  return '';
}

/**
 * Monta as faixas a desenhar.
 *
 * @returns {Array<{chave,rotulo,cor,central:number[],inferior:number[]|null,superior:number[]|null}>}
 */
export function montarFaixas({ modelo, config, matriz, modo, ctx }) {
  const paleta = coresDaPaleta(config.paleta);
  const quantidade = matriz.categorias.length;
  const nulos = config.tratamentoDeNulos || 'interpolar';

  // --- Três medidas: a banda é um dado de verdade ---
  if (modo === 'medidas') {
    const achar = (nome, posicao) =>
      modelo.medidas.find((m) => m.nome === nome) || modelo.medidas[posicao] || null;

    let inferior;
    let central;
    let superior;

    const serieDe = (campo) => (campo ? valoresPorCategoria(modelo, matriz, campo) : null);

    if (config.campoCentral === undefined && modelo.medidas.length >= 3) {
      // Ainda não houve escolha no painel. Pegar as três primeiras medidas
      // POR POSIÇÃO daria uma banda invertida em quase toda consulta (numa
      // de OHLC, por exemplo, a ordem é abertura/máxima/mínima). Ordenar
      // pela média acerta sozinho e não atropela escolha nenhuma.
      const candidatas = modelo.medidas.slice(0, 3).map((campo) => {
        const valores = serieDe(campo).filter((v) => v !== null && Number.isFinite(v));
        return { campo, media: estatisticas.media(valores) ?? 0 };
      });
      candidatas.sort((a, b) => a.media - b.media);
      inferior = candidatas[0].campo;
      central = candidatas[1].campo;
      superior = candidatas[2].campo;
    } else {
      central = achar(config.campoCentral, 1) || modelo.medidas[0];
      inferior = config.campoInferior === '' ? null : achar(config.campoInferior, 0);
      superior = config.campoSuperior === '' ? null : achar(config.campoSuperior, 2);
    }

    if (!central) return [];
    let vetorInferior = serieDe(inferior);
    let vetorSuperior = serieDe(superior);
    const vetorCentral = serieDe(central);

    // Limites trocados são erro de escolha de campo, não de desenho.
    if (vetorInferior && vetorSuperior) {
      let trocados = 0;
      for (let i = 0; i < quantidade; i++) {
        if (vetorInferior[i] === null || vetorSuperior[i] === null) continue;
        if (vetorInferior[i] > vetorSuperior[i]) {
          const troca = vetorInferior[i];
          vetorInferior[i] = vetorSuperior[i];
          vetorSuperior[i] = troca;
          trocados += 1;
        }
      }
      if (trocados && ctx) {
        ctx.avisar(
          `${trocados} período(s) tinham o limite inferior acima do superior; os dois foram trocados. ` +
            'Confira quais medidas estão na seção Banda.'
        );
      }
    }
    if (inferior && superior && inferior.nome === superior.nome && ctx) {
      ctx.avisar('Os limites inferior e superior são a mesma medida: a banda ficou sem espessura.');
    }

    return [
      {
        chave: central.nome,
        rotulo: central.rotuloCurto,
        cor: config.corUnica || paleta[0],
        central: vetorCentral,
        inferior: vetorInferior,
        superior: vetorSuperior,
      },
    ];
  }

  // --- Mín/máx entre as séries do pivô ---
  if (modo === 'minimoMaximo') {
    const series = tratarNulos(matriz.series, nulos === 'manter' ? 'manter' : nulos);
    if (series.length < 2) {
      if (ctx) ctx.avisar('Este modo precisa de pelo menos duas séries; a banda não foi desenhada.');
    }
    const central = new Array(quantidade).fill(null);
    const inferior = new Array(quantidade).fill(null);
    const superior = new Array(quantidade).fill(null);

    for (let i = 0; i < quantidade; i++) {
      const valores = series.map((s) => s.valores[i]).filter((v) => v !== null && Number.isFinite(v));
      if (!valores.length) continue;
      central[i] = valores.reduce((a, b) => a + b, 0) / valores.length;
      inferior[i] = Math.min(...valores);
      superior[i] = Math.max(...valores);
    }

    return [
      {
        chave: '__media__',
        rotulo: 'Média das séries',
        cor: config.corUnica || paleta[0],
        central,
        inferior: series.length >= 2 ? inferior : null,
        superior: series.length >= 2 ? superior : null,
      },
    ];
  }

  // --- Percentual fixo ou desvio padrão: uma faixa por série ---
  const series = tratarNulos(matriz.series, nulos === 'manter' ? 'manter' : nulos);
  const percentual = (Number(config.percentualDaBanda) || 10) / 100;
  const desvios = Number(config.desviosDaBanda) || 1;

  return series.map((serie, indice) => {
    const central = serie.valores;
    let inferior = null;
    let superior = null;

    if (modo === 'percentual') {
      inferior = central.map((v) => (v === null ? null : v * (1 - percentual)));
      superior = central.map((v) => (v === null ? null : v * (1 + percentual)));
    } else if (modo === 'desvio') {
      const limpos = central.filter((v) => v !== null && Number.isFinite(v));
      const media = estatisticas.media(limpos);
      const desvioPadrao = desvioPadraoDe(limpos, media);
      const margem = desvioPadrao * desvios;
      inferior = central.map((v) => (v === null ? null : v - margem));
      superior = central.map((v) => (v === null ? null : v + margem));
    }

    return {
      chave: serie.chave,
      rotulo: serie.rotulo,
      cor: config[`cor_${serie.chave}`] || paleta[indice % paleta.length],
      central,
      inferior,
      superior,
    };
  });
}

/** Valores de uma medida alinhados às categorias do eixo. */
function valoresPorCategoria(modelo, matriz, campo) {
  const saida = new Array(matriz.categorias.length).fill(null);
  const posicaoPorChave = new Map(matriz.categorias.map((c, i) => [c.chave, i]));

  for (const linha of modelo.linhas) {
    const bruto = modelo.valorBruto(linha, matriz.campoDaCategoria.nome);
    const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
    const posicao = posicaoPorChave.get(chave);
    if (posicao === undefined) continue;
    const v = modelo.valorNumerico(linha, campo.nome);
    if (v === null) continue;
    saida[posicao] = (saida[posicao] === null ? 0 : saida[posicao]) + v;
  }
  return saida;
}

export function desvioPadraoDe(valores, media) {
  if (!valores.length || media === null) return 0;
  const soma = valores.reduce((a, v) => a + (v - media) ** 2, 0);
  return Math.sqrt(soma / valores.length);
}
