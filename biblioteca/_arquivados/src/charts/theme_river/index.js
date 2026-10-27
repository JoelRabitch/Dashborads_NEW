/**
 * theme_river — "ThemeRiver" (streamgraph).
 *
 * Áreas empilhadas com a base deslocada (`wiggle` ou `silhouette`) em vez
 * de apoiada no zero: o resultado é um "rio" em que a espessura de cada
 * faixa é o valor da série e o conjunto ondula em torno de um eixo
 * central. Serve para ver COMPOSIÇÃO ao longo do tempo, não valores
 * absolutos — por isso o eixo Y vem desligado por padrão: num streamgraph
 * ele não significa nada.
 *
 * As séries vêm do pivô, de uma segunda dimensão ou de várias medidas —
 * `core/series.js` resolve os três casos.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { extrairMatriz, opcaoDeOrigemDasSeries, tratarNulos, totaisPorCategoria } from '../../core/series.js';
import { escalaNumerica, escalaDePonto } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { criarEmpilhador, geradorDeArea } from '../../core/shapes.js';
import { coresDaPaleta } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarData, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import { criarControleDeSeriesDesligadas } from '../../core/interaction.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeEixos,
  blocoDeLegenda,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  opcoesDeCorPorItem,
  sanitizarChave,
} from '../../core/options-kit.js';

const CSS = `
.tr-area{position:relative;width:100%;height:100%;}
.tr-faixa{transition:opacity .15s ease;cursor:pointer;}
.tr-apagada{opacity:.18;}
.tr-rotulo{pointer-events:none;font-weight:600;}
.tr-guia{pointer-events:none;}
@media (prefers-reduced-motion: reduce){.tr-faixa{transition:none;}}
`;

/** Altura mínima da faixa (px) para caber o nome da série dentro. */
const ALTURA_MINIMA_PARA_ROTULO = 14;

export default defineViz({
  id: 'theme_river',
  label: 'ThemeRiver',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores(),
      blocoDeEixos(),
      blocoDeLegenda(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      {
        deslocamentoDaPilha: {
          type: 'string',
          label: 'Como apoiar o empilhamento',
          section: 'Dados',
          display: 'select',
          default: 'wiggle',
          values: listaDeValores([
            { rotulo: 'Ondulado (wiggle) — o rio clássico', valor: 'wiggle' },
            { rotulo: 'Centrado (silhouette)', valor: 'silhouette' },
            { rotulo: 'Apoiado no zero (área empilhada)', valor: 'zero' },
            { rotulo: 'Percentual (100%)', valor: 'expand' },
          ]),
        },
        ordemDaPilha: {
          type: 'string',
          label: 'Ordem das faixas',
          section: 'Dados',
          display: 'select',
          default: 'insideOut',
          values: listaDeValores([
            { rotulo: 'De dentro para fora (insideOut)', valor: 'insideOut' },
            { rotulo: 'Como veio da consulta', valor: 'original' },
            { rotulo: 'Menores por dentro', valor: 'crescente' },
            { rotulo: 'Maiores por dentro', valor: 'decrescente' },
          ]),
        },
        curvaDaFaixa: {
          type: 'string',
          label: 'Suavização',
          section: 'Formato',
          display: 'select',
          default: 'basis',
          values: listaDeValores([
            { rotulo: 'Bem suave (basis)', valor: 'basis' },
            { rotulo: 'Suave sem ultrapassar (monotone)', valor: 'monotone' },
            { rotulo: 'Catmull-Rom', valor: 'catmull' },
            { rotulo: 'Reta', valor: 'linear' },
          ]),
        },
        tratamentoDeNulos: {
          type: 'string',
          label: 'Valores faltando',
          section: 'Dados',
          display: 'select',
          default: 'zero',
          values: listaDeValores([
            { rotulo: 'Tratar como zero', valor: 'zero' },
            { rotulo: 'Interpolar entre os vizinhos', valor: 'interpolar' },
          ]),
        },
        rotularFaixas: {
          type: 'boolean',
          label: 'Escrever o nome da série dentro da faixa',
          section: 'Rótulos',
          default: true,
        },
        contornoDaFaixa: {
          type: 'boolean',
          label: 'Contorno nas faixas',
          section: 'Formato',
          default: false,
        },
      }
    ),
    {
      // Num streamgraph o eixo Y não tem significado: a base flutua.
      mostrarEixoY: false,
      gradeEixoY: false,
      gradeEixoX: true,
      posicaoDaLegenda: 'abaixo',
    }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  opcoesDinamicas({ modelo, config }) {
    const { series } = extrairMatriz(modelo, config);
    if (!series.length) return {};
    return opcoesDeCorPorItem(
      series.map((s) => ({ chave: s.chave, rotulo: s.rotulo })),
      { secao: 'Cores', cores: coresDaPaleta(config.paleta) }
    );
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const matriz = extrairMatriz(modelo, config);
    for (const aviso of matriz.avisos) ctx.avisar(aviso);

    if (matriz.categorias.length < 2 || !matriz.series.length) {
      ctx.mostrarVazio(
        'O ThemeRiver precisa de pelo menos dois pontos no eixo e uma série. ' +
          'Confira a opção "De onde vêm as séries" na seção Dados.'
      );
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'tr');
    const { areaGrafico, areaLegenda } = criarLayoutComLegenda(raiz, config);

    const larguraUtil = Math.max(80, areaGrafico.clientWidth || largura);
    const alturaUtil = Math.max(80, areaGrafico.clientHeight || altura);

    const desligadas = criarControleDeSeriesDesligadas(ctx.estado);
    const visiveis = matriz.series.filter((s) => !desligadas.estaDesligada(s.chave));

    if (!visiveis.length) {
      ctx.mostrarVazio('Todas as séries foram desligadas na legenda.');
      return;
    }

    const series = tratarNulos(visiveis, config.tratamentoDeNulos || 'zero');
    const cores = resolverCores(matriz.series, config, tema);

    // ---------- Empilhamento ----------
    // O d3-stack trabalha com uma linha por categoria, então viramos a
    // matriz: cada item é { __i: índice, <chave da série>: valor }.
    const linhasParaPilha = matriz.categorias.map((_, i) => {
      const registro = { __i: i };
      for (const serie of series) registro[serie.chave] = serie.valores[i] === null ? 0 : serie.valores[i];
      return registro;
    });

    const empilhar = criarEmpilhador({
      chaves: series.map((s) => s.chave),
      deslocamento: config.deslocamentoDaPilha || 'wiggle',
      ordem: config.ordemDaPilha || 'insideOut',
    });
    const camadas = empilhar(linhasParaPilha);

    // ---------- Escalas ----------
    const formatarCategoria = (categoria) =>
      categoria.data ? formatarData(categoria.valorBruto, config.formatoDeData || 'auto') : categoria.rotulo;

    const rotulosX = matriz.categorias.map(formatarCategoria);
    const margens = calcularMargens({ rotulosX, rotulosY: [], config, tema });
    const retangulo = areaDeDesenho(larguraUtil, alturaUtil, margens);

    const escalaX = escalaDePonto({
      dominio: matriz.categorias.map((c) => c.chave),
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      preenchimento: 0,
    });

    const extremos = [];
    for (const camada of camadas) {
      for (const ponto of camada) {
        extremos.push(ponto[0], ponto[1]);
      }
    }
    const escalaY = escalaNumerica({
      valores: extremos,
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config: {},
      eixo: 'Y',
    });

    // ---------- Desenho ----------
    const svg = criarSvgEl('svg', {
      pai: areaGrafico,
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
        const categoria = matriz.categorias.find((c) => c.chave === chave);
        return categoria ? formatarCategoria(categoria) : String(chave);
      },
    });

    const desenharArea = geradorDeArea({
      x: (ponto) => escalaX(matriz.categorias[ponto.data.__i].chave),
      y0: (ponto) => escalaY(ponto[0]),
      y1: (ponto) => escalaY(ponto[1]),
      curva: config.curvaDaFaixa || 'basis',
    });

    const grupoDeFaixas = criarSvgEl('g', { pai: svg });
    const faixasPorChave = new Map();

    camadas.forEach((camada) => {
      const chave = camada.key;
      const caminho = criarSvgEl('path', {
        pai: grupoDeFaixas,
        classe: 'tr-faixa',
        atributos: {
          d: desenharArea(camada),
          fill: cores.get(chave),
          stroke: config.contornoDaFaixa ? tema.fundo : 'none',
          'stroke-width': config.contornoDaFaixa ? 1 : 0,
        },
      });
      faixasPorChave.set(chave, caminho);
    });

    // ---------- Rótulos dentro das faixas ----------
    if (config.rotularFaixas !== false && config.mostrarRotulos !== false) {
      for (const camada of camadas) {
        const melhor = pontoMaisGrosso(camada, escalaY);
        if (!melhor || melhor.espessura < ALTURA_MINIMA_PARA_ROTULO) continue;
        const serie = matriz.series.find((s) => s.chave === camada.key);
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'tr-rotulo',
          atributos: {
            x: escalaX(matriz.categorias[melhor.indice].chave),
            y: melhor.meio,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'font-size': Math.min(
              Number(config.tamanhoDoRotulo) || tema.tamanhoBase,
              Math.max(8, melhor.espessura - 3)
            ),
            fill: config.corDoRotulo || tema.textoInvertido,
          },
        });
        definirTexto(texto, truncar(serie ? serie.rotulo : camada.key, Number(config.truncarRotulo) || 20));
      }
    }

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const formatarValor = formatadorDeValueFormat(matriz.medida && matriz.medida.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 0,
    });
    const totais = totaisPorCategoria(series, matriz.categorias.length);

    const guia = criarSvgEl('line', {
      pai: svg,
      classe: 'tr-guia',
      atributos: {
        y1: retangulo.cima,
        y2: retangulo.cima + retangulo.altura,
        stroke: tema.bordaForte,
        'stroke-width': 1,
        opacity: 0,
      },
    });

    for (const [chave, caminho] of faixasPorChave) {
      const serie = series.find((s) => s.chave === chave);

      ctx.eventos.on(caminho, 'pointermove', (ev) => {
        const caixa = areaGrafico.getBoundingClientRect();
        const indice = categoriaMaisProxima(ev.clientX - caixa.left, matriz.categorias, escalaX);

        for (const [outra, outroCaminho] of faixasPorChave) {
          outroCaminho.classList.toggle('tr-apagada', outra !== chave);
        }
        if (indice !== null) {
          const x = escalaX(matriz.categorias[indice].chave);
          guia.setAttribute('x1', x);
          guia.setAttribute('x2', x);
          guia.setAttribute('opacity', 0.6);
        }

        if (!tooltip || indice === null) return;
        const valor = serie.valores[indice];
        const total = totais[indice];
        const linhas = [
          { rotulo: matriz.medida ? matriz.medida.rotuloCurto : 'Valor', valor: formatarValor(valor || 0), cor: cores.get(chave) },
        ];
        if (total) {
          linhas.push({ rotulo: 'Participação', valor: `${((100 * (valor || 0)) / total).toFixed(1)}%` });
          linhas.push({ rotulo: 'Total no período', valor: formatarValor(total) });
        }
        tooltip.mostrar(
          { titulo: `${serie.rotulo} — ${formatarCategoria(matriz.categorias[indice])}`, linhas },
          ev.clientX,
          ev.clientY
        );
      });

      ctx.eventos.on(caminho, 'pointerleave', () => {
        for (const outroCaminho of faixasPorChave.values()) outroCaminho.classList.remove('tr-apagada');
        guia.setAttribute('opacity', 0);
        if (tooltip) tooltip.esconder();
      });

      ctx.eventos.on(caminho, 'click', (ev) => {
        const caixa = areaGrafico.getBoundingClientRect();
        const indice = categoriaMaisProxima(ev.clientX - caixa.left, matriz.categorias, escalaX);
        if (indice === null || !matriz.campoDaCategoria) return;
        const linha = modelo.linhas[matriz.categorias[indice].indiceDaPrimeiraLinha];
        const celula = modelo.celula(linha, matriz.campoDaCategoria.nome);
        if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
      });
    }

    // ---------- Legenda ----------
    if (config.mostrarLegenda !== false) {
      desenharLegenda({
        hospedeiro: areaLegenda,
        tema,
        config,
        itens: matriz.series.map((s) => ({ chave: s.chave, rotulo: s.rotulo, cor: cores.get(s.chave) })),
        desligados: desligadas.conjunto,
        aoAlternar: (chave, novoConjunto) => {
          desligadas.definir(novoConjunto);
          ctx.redesenhar();
        },
        eventos: ctx.eventos,
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function resolverCores(series, config, tema) {
  const paleta = coresDaPaleta(config.paleta);
  const saida = new Map();
  series.forEach((serie, i) => {
    const escolhida = config[`cor_${sanitizarChave(serie.chave)}`];
    saida.set(serie.chave, escolhida || paleta[i % paleta.length] || tema.texto);
  });
  return saida;
}

/** Onde a faixa é mais grossa — o único lugar em que o nome cabe. */
function pontoMaisGrosso(camada, escalaY) {
  let melhor = null;
  camada.forEach((ponto, indice) => {
    const topo = escalaY(ponto[1]);
    const base = escalaY(ponto[0]);
    const espessura = Math.abs(base - topo);
    if (!melhor || espessura > melhor.espessura) {
      melhor = { indice, espessura, meio: (topo + base) / 2 };
    }
  });
  return melhor;
}

/** Índice da categoria mais próxima de uma posição horizontal. */
function categoriaMaisProxima(x, categorias, escalaX) {
  let melhor = null;
  let menorDistancia = Infinity;
  categorias.forEach((categoria, i) => {
    const distancia = Math.abs(escalaX(categoria.chave) - x);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = i;
    }
  });
  return melhor;
}
