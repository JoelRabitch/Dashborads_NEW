/**
 * drawdown — "Drawdown".
 *
 * Quanto a série está abaixo do seu próprio máximo histórico, período a
 * período. O valor é sempre ≤ 0: no topo o drawdown é zero, e qualquer
 * queda abre uma área para baixo até a série recuperar o nível anterior.
 *
 * É o gráfico que responde "qual foi o pior tombo e quanto tempo levou
 * para voltar" — duas perguntas que uma linha de valor absoluto esconde.
 *
 * O cálculo é cumulativo e depende da ORDEM das linhas. Se a consulta não
 * vier ordenada pelo tempo, o resultado é ficção — por isso o gráfico
 * confere e avisa quando a dimensão é temporal e está fora de ordem.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto } from '../../core/dom.js';
import { geradorDeLinha, geradorDeArea } from '../../core/shapes.js';
import { tratarNulos } from '../../core/series.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatarPercentual } from '../../core/format.js';
import { desenharLegenda } from '../../core/legend.js';
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
} from '../../core/options-kit.js';
import { opcaoDeOrigemDasSeries } from '../../core/series.js';
import {
  opcoesDeTracado,
  lerSerieTemporal,
  montarPlano,
  desenharReferencia,
  ligarGuiaEHover,
  drillDoPeriodo,
  destruirSerieTemporal,
} from '../_serie_temporal/index.js';

export default defineViz({
  id: 'drawdown',
  label: 'Drawdown',
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
      opcoesDeTracado({ espessuraPadrao: 1.5 }),
      {
        unidadeDoDrawdown: {
          type: 'string',
          label: 'Medir a queda em',
          section: 'Drawdown',
          display: 'select',
          default: 'percentual',
          values: listaDeValores([
            { rotulo: 'Percentual do topo', valor: 'percentual' },
            { rotulo: 'Valor absoluto', valor: 'absoluto' },
          ]),
        },
        corDaQueda: {
          type: 'string',
          label: 'Cor da área de queda',
          section: 'Drawdown',
          display: 'color',
          default: '#DC2626',
        },
        opacidadeDaArea: {
          type: 'number',
          label: 'Opacidade da área',
          section: 'Drawdown',
          display: 'range',
          min: 0.05,
          max: 1,
          step: 0.05,
          default: 0.25,
        },
        destacarPiorQueda: {
          type: 'boolean',
          label: 'Destacar a pior queda',
          section: 'Drawdown',
          default: true,
        },
        mostrarRecuperacao: {
          type: 'boolean',
          label: 'Mostrar quanto durou a pior queda',
          section: 'Drawdown',
          default: true,
        },
      }
    ),
    { gradeEixoY: true, tituloEixoY: '' }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  render(ctx) {
    const { config, tema } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio('São necessários pelo menos dois períodos para calcular o drawdown.');
      return;
    }

    avisarSeForaDeOrdem(ctx, serie);

    const emPercentual = (config.unidadeDoDrawdown || 'percentual') === 'percentual';
    const series = tratarNulos(serie.matriz.series, config.tratamentoDeNulos || 'interpolar');
    const paleta = coresDaPaleta(config.paleta);

    const calculadas = series.map((s, indice) => ({
      chave: s.chave,
      rotulo: s.rotulo,
      cor: config[`cor_${s.chave}`] || paleta[indice % paleta.length],
      valores: s.valores,
      ...calcularDrawdown(s.valores, emPercentual),
    }));

    const todosOsDrawdowns = calculadas.flatMap((s) => s.drawdown).filter((v) => v !== null);
    if (!todosOsDrawdowns.length) {
      ctx.mostrarVazio('Nenhuma série tem valores suficientes para calcular o drawdown.');
      return;
    }

    const formatarY = emPercentual ? (v) => formatarPercentual(v, 1) : serie.formatarValor;

    // O zero PRECISA estar no domínio: é a linha do topo histórico, a
    // referência contra a qual todo o resto é lido.
    const plano = montarPlano({
      ctx,
      serie,
      valores: [...todosOsDrawdowns, 0],
      formatarY,
      comLegenda: calculadas.length > 1,
    });

    const curva = config.curvaDaLinha || 'monotone';
    const opacidade = Number(config.opacidadeDaArea);
    const yDoZero = plano.escalaY(0);

    desenharReferencia({
      svg: plano.svg,
      retangulo: plano.retangulo,
      y: yDoZero,
      cor: tema.bordaForte,
      tracejada: false,
    });

    for (const calculada of calculadas) {
      const cor = calculadas.length > 1 ? calculada.cor : config.corDaQueda || tema.negativo;

      const area = geradorDeArea({
        x: (_, i) => plano.x(i),
        y0: () => yDoZero,
        y1: (_, i) => plano.escalaY(calculada.drawdown[i]),
        curva,
        definido: (_, i) => calculada.drawdown[i] !== null,
      });
      criarSvgEl('path', {
        pai: plano.svg,
        classe: 'st-area-preenchida',
        atributos: {
          d: area(serie.categorias) || '',
          fill: comOpacidade(cor, Number.isFinite(opacidade) ? opacidade : 0.25),
        },
      });

      const linha = geradorDeLinha({
        x: (_, i) => plano.x(i),
        y: (_, i) => plano.escalaY(calculada.drawdown[i]),
        curva,
        definido: (_, i) => calculada.drawdown[i] !== null,
      });
      criarSvgEl('path', {
        pai: plano.svg,
        classe: 'st-linha',
        atributos: {
          d: linha(serie.categorias) || '',
          stroke: cor,
          'stroke-width': Number(config.espessuraDaLinha) || 1.5,
          'stroke-linejoin': 'round',
        },
      });

      if (config.mostrarPontos) {
        serie.categorias.forEach((_, i) => {
          if (calculada.drawdown[i] === null) return;
          criarSvgEl('circle', {
            pai: plano.svg,
            classe: 'st-ponto',
            atributos: {
              cx: plano.x(i),
              cy: plano.escalaY(calculada.drawdown[i]),
              r: 2.5,
              fill: cor,
            },
          });
        });
      }
    }

    // ---------- Pior queda ----------
    const pior = calculadas.reduce(
      (melhor, c) => (!melhor || c.pior.valor < melhor.pior.valor ? c : melhor),
      null
    );

    if (config.destacarPiorQueda !== false && pior && pior.pior.indice >= 0) {
      const xPior = plano.x(pior.pior.indice);
      const yPior = plano.escalaY(pior.pior.valor);

      criarSvgEl('line', {
        pai: plano.svg,
        classe: 'st-destaque',
        atributos: {
          x1: xPior, x2: xPior, y1: yDoZero, y2: yPior,
          stroke: tema.texto, 'stroke-width': 1, 'stroke-dasharray': '3 3',
        },
      });
      criarSvgEl('circle', {
        pai: plano.svg,
        classe: 'st-destaque',
        atributos: { cx: xPior, cy: yPior, r: 4, fill: tema.texto },
      });

      const rotulo = criarSvgEl('text', {
        pai: plano.svg,
        classe: 'st-destaque',
        atributos: {
          x: xPior,
          y: yPior + 16,
          'text-anchor': xPior > plano.retangulo.esquerda + plano.retangulo.largura * 0.8 ? 'end' : 'middle',
          'font-size': Math.max(9, tema.tamanhoBase),
          'font-weight': '600',
          fill: tema.texto,
        },
      });
      definirTexto(rotulo, `Pior: ${formatarY(pior.pior.valor)}`);
    }

    // ---------- Nota de recuperação ----------
    if (config.mostrarRecuperacao !== false && pior && pior.pior.indice >= 0) {
      const nota = criarEl('div', { classe: 'st-nota', pai: plano.area });
      nota.style.color = tema.textoSuave;
      definirTexto(nota, textoDaRecuperacao(pior, serie, calculadas.length > 1));
    }

    // ---------- Interação ----------
    ligarGuiaEHover({
      ctx,
      plano,
      serie,
      montarLinhasDoTooltip(indice) {
        const linhas = [];
        for (const calculada of calculadas) {
          if (calculada.drawdown[indice] === null) continue;
          linhas.push({
            rotulo: calculadas.length > 1 ? calculada.rotulo : 'Queda do topo',
            valor: formatarY(calculada.drawdown[indice]),
            cor: calculadas.length > 1 ? calculada.cor : config.corDaQueda,
          });
          linhas.push({ rotulo: '   valor', valor: serie.formatarValor(calculada.valores[indice]) });
          linhas.push({ rotulo: '   topo até aqui', valor: serie.formatarValor(calculada.topo[indice]) });
        }
        return linhas;
      },
      aoClicar: (indice, ev) => drillDoPeriodo(ctx, serie, indice, ev),
    });

    // ---------- Legenda ----------
    if (calculadas.length > 1 && config.mostrarLegenda !== false && plano.areaLegenda) {
      desenharLegenda({
        hospedeiro: plano.areaLegenda,
        tema,
        config,
        itens: calculadas.map((c) => ({ chave: c.chave, rotulo: c.rotulo, cor: c.cor })),
        eventos: ctx.eventos,
      });
    }
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

/**
 * Drawdown período a período.
 *
 * Em percentual, a conta é `valor / topo - 1`. Isso exige topo positivo:
 * com topo zero ou negativo a divisão não quer dizer nada, e o período sai
 * nulo em vez de virar um número inventado.
 *
 * @returns {{drawdown:Array<number|null>, topo:Array<number|null>,
 *            pior:{valor:number, indice:number, inicio:number, fim:number}}}
 */
export function calcularDrawdown(valores, emPercentual) {
  const drawdown = new Array(valores.length).fill(null);
  const topo = new Array(valores.length).fill(null);

  let maximo = null;
  let indiceDoTopo = -1;
  let pior = { valor: 0, indice: -1, inicio: -1, fim: -1 };
  let inicioDaQuedaAtual = -1;

  for (let i = 0; i < valores.length; i++) {
    const valor = valores[i];
    if (valor === null || !Number.isFinite(valor)) continue;

    if (maximo === null || valor >= maximo) {
      maximo = valor;
      indiceDoTopo = i;
      inicioDaQuedaAtual = -1;
    } else if (inicioDaQuedaAtual === -1) {
      inicioDaQuedaAtual = indiceDoTopo;
    }

    topo[i] = maximo;

    let queda;
    if (emPercentual) {
      queda = maximo > 0 ? valor / maximo - 1 : null;
    } else {
      queda = valor - maximo;
    }
    drawdown[i] = queda;

    if (queda !== null && queda < pior.valor) {
      pior = { valor: queda, indice: i, inicio: inicioDaQuedaAtual, fim: -1 };
    }
  }

  // Quando (e se) a série voltou ao nível do topo que originou a pior queda.
  if (pior.indice >= 0) {
    const nivelAlvo = topo[pior.indice];
    for (let i = pior.indice + 1; i < valores.length; i++) {
      if (valores[i] !== null && nivelAlvo !== null && valores[i] >= nivelAlvo) {
        pior.fim = i;
        break;
      }
    }
  }

  return { drawdown, topo, pior };
}

/**
 * Frase sobre a duração da pior queda.
 *
 * Com várias séries a frase PRECISA dizer de qual delas fala: a pior queda
 * é a pior entre todas, e sem o nome o leitor atribui à série errada.
 */
function textoDaRecuperacao(calculada, serie, nomearSerie) {
  const { pior } = calculada;
  const nome = (i) => (i >= 0 && serie.categorias[i] ? serie.rotuloDaCategoria(serie.categorias[i]) : '?');
  const deQuem = nomearSerie ? ` (${calculada.rotulo})` : '';

  if (pior.fim >= 0) {
    const periodos = pior.fim - (pior.inicio >= 0 ? pior.inicio : pior.indice);
    return `Pior queda${deQuem}: de ${nome(pior.inicio)} até o fundo em ${nome(
      pior.indice
    )}, recuperada em ${nome(pior.fim)} (${periodos} período(s)).`;
  }
  return `Pior queda${deQuem}: fundo em ${nome(pior.indice)} — ainda não voltou ao topo anterior.`;
}

/**
 * O drawdown é cumulativo: fora de ordem, o número é ficção.
 *
 * Só dá para checar quando a dimensão é de data — com categorias de texto
 * não existe "ordem certa" para comparar.
 */
function avisarSeForaDeOrdem(ctx, serie) {
  const campo = serie.matriz.campoDaCategoria;
  if (!campo || !campo.ehData) return;

  const datas = serie.categorias.map((c) => (c.data ? c.data.getTime() : null));
  for (let i = 1; i < datas.length; i++) {
    if (datas[i] === null || datas[i - 1] === null) continue;
    if (datas[i] < datas[i - 1]) {
      ctx.avisar(
        'Os períodos não estão em ordem crescente de data. O drawdown é cumulativo, ' +
          'então ordene a consulta pela data no Explore — caso contrário o resultado não significa nada.'
      );
      return;
    }
  }
}
