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
 *
 * Campos: 1 dimensão de período (+ pivô, 2ª dimensão ou várias medidas
 * para várias séries) e 1 medida.
 *
 * Opções (correções v2):
 *   - Rótulos: o valor da queda nos pontos (todos, se couberem; senão o
 *     último de cada série) e o rótulo "Pior: …" seguem o bloco Rótulos
 *     (mostrar, tamanho, cor, negrito, rotação, posição — automática =
 *     abaixo da linha —, conteúdo, formato, casas, truncar, colisão).
 *   - Cores: com várias séries, paleta + "Inverter ordem das cores" + cor
 *     própria por série (opção dinâmica "Cor — <série>"); com uma série,
 *     "Cor da área de queda". "Opacidade do preenchimento" multiplica a
 *     "Opacidade da área" e vale nos pontos; o contorno vale nos pontos.
 *   - Tooltip único do gráfico, com o valor no texto do Looker; o clique
 *     segue a "Ação do clique" (drill, fixar ou nada).
 *   - Eixos: escala/mínimo/máximo/inverter do Y e "Inverter eixo X".
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto } from '../../core/dom.js';
import { geradorDeLinha, geradorDeArea, criarMarcadorSvg } from '../../core/shapes.js';
import { tratarNulos } from '../../core/series.js';
import { formatarPercentual } from '../../core/format.js';
import { desenharLegenda } from '../../core/legend.js';
import { corDoItem, opacidadeDoConfig, lerContorno, aplicarContorno } from '../../core/cores.js';
import { lerRotulos, textoDoRotulo, criarRotuloSvg } from '../../core/rotulos.js';
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
  opcoesDinamicasDeSerie,
  lerSerieTemporal,
  montarPlano,
  desenharReferencia,
  desenharRotulosDosPontos,
  ligarGuiaEHover,
  celulaDoPonto,
  celulaDoPeriodo,
  textoDoPonto,
  formatadorDaSerie,
  valueFormatDaSerie,
  destruirSerieTemporal,
  avisarSeForaDeOrdem,
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

  // Cor própria por série só faz sentido com mais de uma (com uma, vale
  // "Cor da área de queda").
  opcoesDinamicas: opcoesDinamicasDeSerie({ minimoDeSeries: 2 }),

  render(ctx) {
    const { config, tema } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio('São necessários pelo menos dois períodos para calcular o drawdown.');
      return;
    }

    avisarSeForaDeOrdem(ctx, serie, 'O drawdown é cumulativo');

    const emPercentual = (config.unidadeDoDrawdown || 'percentual') === 'percentual';
    const series = tratarNulos(serie.matriz.series, config.tratamentoDeNulos || 'interpolar');
    const variasSeries = series.length > 1;

    const calculadas = series.map((s, indice) => ({
      chave: s.chave,
      rotulo: s.rotulo,
      original: s,
      // Paleta (com "Inverter ordem das cores") e cor própria por série.
      // Com uma série só, a cor é a "Cor da área de queda".
      cor: variasSeries ? corDoItem(config, indice, s.chave) : config.corDaQueda || tema.negativo,
      formatar: formatadorDaSerie(serie, s, config),
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
      comLegenda: variasSeries,
    });

    const curva = config.curvaDaLinha || 'monotone';
    const opacidadeDaArea = Number(config.opacidadeDaArea);
    const opacidade = opacidadeDoConfig(config);
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });
    const yDoZero = plano.escalaY(0);
    const rot = lerRotulos(config, tema);

    desenharReferencia({
      svg: plano.svg,
      retangulo: plano.retangulo,
      y: yDoZero,
      cor: tema.bordaForte,
      tracejada: false,
    });

    const gruposDeRotulos = [];

    for (const calculada of calculadas) {
      const cor = calculada.cor;

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
          fill: cor,
          'fill-opacity': (Number.isFinite(opacidadeDaArea) ? opacidadeDaArea : 0.25) * opacidade,
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
          const x = plano.x(i);
          const y = plano.escalaY(calculada.drawdown[i]);
          const ponto = criarMarcadorSvg(plano.svg, 'circulo', x, y, 5, {
            classe: 'st-ponto',
            fill: cor,
            'fill-opacity': opacidade,
            'data-x': x,
            'data-y': y,
          });
          aplicarContorno(ponto, contorno);
        });
      }

      // Rótulos de dado: o valor da queda em cada ponto.
      gruposDeRotulos.push({
        cor: variasSeries ? cor : undefined,
        pontos: serie.categorias.map((_, i) => {
          const v = calculada.drawdown[i];
          if (v === null) return null;
          return {
            indice: i,
            x: plano.x(i),
            y: plano.escalaY(v),
            texto: textoDoRotulo(rot, {
              valor: v,
              nome: calculada.rotulo,
              valueFormat: emPercentual ? undefined : valueFormatDaSerie(serie, calculada.original),
              textoDoValor: emPercentual ? formatarY(v) : calculada.formatar(v),
            }),
          };
        }),
      });
    }

    desenharRotulosDosPontos({
      plano,
      rot,
      grupos: gruposDeRotulos,
      quantidadeDePeriodos: serie.categorias.length,
      // A área fica ENTRE o zero e a linha (acima dela): abaixo da linha o
      // texto não briga com o preenchimento.
      posicaoAuto: 'abaixo',
      raio: config.mostrarPontos ? 2.5 : 1,
    });

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
      criarMarcadorSvg(plano.svg, 'circulo', xPior, yPior, 8, { classe: 'st-destaque', fill: tema.texto });

      // O texto "Pior: …" é rótulo de dado: segue o bloco Rótulos (e some
      // com "Mostrar rótulos" desligado; a marca continua).
      const textoDoPior = textoDoRotulo(
        { ...rot, conteudo: 'valor' },
        {
          valor: pior.pior.valor,
          valueFormat: emPercentual ? undefined : valueFormatDaSerie(serie, pior.original),
          textoDoValor: formatarY(pior.pior.valor),
        }
      );
      const direita = Math.max(plano.retangulo.esquerda, plano.retangulo.esquerda + plano.retangulo.largura);
      const rotulo = criarRotuloSvg(plano.svg, rot, {
        x: xPior,
        y: yPior + rot.tamanho / 2 + 10,
        texto: `Pior: ${textoDoPior}`,
        ancora: xPior > direita - plano.retangulo.largura * 0.2 ? 'end' : 'middle',
        corAutomatica: tema.texto,
      });
      if (rotulo) rotulo.setAttribute('class', 'bl-rotulo st-destaque');
    }

    // ---------- Nota de recuperação ----------
    if (config.mostrarRecuperacao !== false && pior && pior.pior.indice >= 0) {
      const nota = ctx.nota; // 5.1c: texto automático da nota
      nota.style.color = tema.textoSuave;
      definirTexto(nota, textoDaRecuperacao(pior, serie, variasSeries));
    }

    // ---------- Interação ----------
    ligarGuiaEHover({
      ctx,
      plano,
      serie,
      montarLinhasDoTooltip(indice) {
        const linhas = [];
        let variaveis = null;
        for (const calculada of calculadas) {
          if (calculada.drawdown[indice] === null) continue;
          // Valor da célula: o texto do Looker. Queda e topo são números
          // derivados: formatados pelo value_format do campo.
          const textoDoValor = textoDoPonto(
            ctx, serie.matriz, indice, calculada.original, calculada.valores[indice], calculada.formatar
          );
          linhas.push({
            rotulo: variasSeries ? calculada.rotulo : 'Queda do topo',
            valor: formatarY(calculada.drawdown[indice]),
            cor: calculada.cor,
          });
          linhas.push({ rotulo: '   valor', valor: textoDoValor });
          linhas.push({ rotulo: '   topo até aqui', valor: calculada.formatar(calculada.topo[indice]) });
          if (!variaveis) {
            variaveis = {
              valor: textoDoValor,
              serie: calculada.rotulo,
              queda: formatarY(calculada.drawdown[indice]),
              percentual: emPercentual ? formatarY(calculada.drawdown[indice]) : '',
            };
          }
        }
        return { linhas, variaveis: variaveis || {} };
      },
      // Uma série: o clique usa a célula do ponto (onde o Looker põe o
      // drill da medida); várias: a do período.
      celulaDoClique: (indice) =>
        variasSeries
          ? celulaDoPeriodo(ctx, serie, indice)
          : celulaDoPonto(ctx, serie.matriz, indice, calculadas[0].original),
    });

    // ---------- Legenda ----------
    if (variasSeries && config.mostrarLegenda !== false && plano.areaLegenda) {
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
