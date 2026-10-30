/**
 * retorno_acumulado — "Retorno Acumulado (Base 100)".
 *
 * Cada série é reescalada para começar no mesmo ponto (100, por padrão).
 * A partir daí o gráfico deixa de comparar VALORES e passa a comparar
 * CRESCIMENTO: uma loja que fatura 5 mil e uma que fatura 5 milhões ficam
 * lado a lado, e o que se lê é quem cresceu mais.
 *
 * É justamente por reescalar que este gráfico precisa de cuidado. Três
 * armadilhas, todas tratadas aqui:
 *
 *   1. a base é o primeiro valor NÃO NULO de cada série — usar o primeiro
 *      período cru faria a série inteira virar nula quando ele falta;
 *   2. base zero ou negativa impede a normalização: dividir por ela dá um
 *      número sem significado, então a série é deixada de fora COM aviso;
 *   3. séries que começam em períodos diferentes não são comparáveis sem
 *      ressalva — o gráfico diz quando isso acontece.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto } from '../../core/dom.js';
import { geradorDeLinha } from '../../core/shapes.js';
import { tratarNulos, opcaoDeOrigemDasSeries } from '../../core/series.js';
import { coresDaPaleta } from '../../core/theme.js';
import { formatarPercentual, truncar, criarFormatadorNumerico } from '../../core/format.js';
import { desenharLegenda } from '../../core/legend.js';
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
  blocoDeTema,
  blocoAvancado,
  opcoesDeCorPorItem,
  sanitizarChave,
} from '../../core/options-kit.js';
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
  id: 'retorno_acumulado',
  label: 'Retorno Acumulado (Base 100)',
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
      opcoesDeTracado({ espessuraPadrao: 2 }),
      {
        unidadeDoRetorno: {
          type: 'string',
          label: 'Mostrar como',
          section: 'Retorno',
          display: 'select',
          default: 'base',
          values: listaDeValores([
            { rotulo: 'Índice com base 100', valor: 'base' },
            { rotulo: 'Variação percentual acumulada', valor: 'percentual' },
          ]),
        },
        valorDaBase: {
          type: 'number',
          label: 'Valor da base',
          section: 'Retorno',
          display: 'range',
          min: 1,
          max: 1000,
          step: 1,
          default: 100,
        },
        periodoDaBase: {
          type: 'string',
          label: 'A base é',
          section: 'Retorno',
          display: 'select',
          default: 'primeiro',
          values: listaDeValores([
            { rotulo: 'O primeiro período de cada série', valor: 'primeiro' },
            { rotulo: 'O primeiro período em que TODAS têm valor', valor: 'comum' },
          ]),
        },
        mostrarLinhaDaBase: {
          type: 'boolean',
          label: 'Linha horizontal na base',
          section: 'Retorno',
          default: true,
        },
        rotularFimDaLinha: {
          type: 'boolean',
          label: 'Escrever o resultado no fim de cada linha',
          section: 'Rótulos',
          default: true,
        },
      }
    ),
    { gradeEixoY: true, posicaoDaLegenda: 'abaixo' }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  opcoesDinamicas({ modelo, config }) {
    const serie = lerSerieTemporal({ modelo, config, avisar: () => {} });
    if (!serie || !serie.matriz.series.length) return {};
    return opcoesDeCorPorItem(
      serie.matriz.series.map((s) => ({ chave: s.chave, rotulo: s.rotulo })),
      { secao: 'Cores', cores: coresDaPaleta(config.paleta) }
    );
  },

  render(ctx) {
    const { config, tema } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio('São necessários pelo menos dois períodos para acumular um retorno.');
      return;
    }

    const desligadas = criarControleDeSeriesDesligadas(ctx.estado);
    const visiveis = serie.matriz.series.filter((s) => !desligadas.estaDesligada(s.chave));
    if (!visiveis.length) {
      ctx.mostrarVazio('Todas as séries foram desligadas na legenda.');
      return;
    }

    const series = tratarNulos(visiveis, config.tratamentoDeNulos || 'interpolar');
    const emPercentual = (config.unidadeDoRetorno || 'base') === 'percentual';
    const base = emPercentual ? 0 : Number(config.valorDaBase) || 100;

    const resultado = reescalar(series, {
      base,
      emPercentual,
      periodoDaBase: config.periodoDaBase || 'primeiro',
    });

    for (const aviso of resultado.avisos) ctx.avisar(aviso);

    if (!resultado.series.length) {
      ctx.mostrarVazio(
        'Nenhuma série pôde ser reescalada: a base de todas é zero, negativa ou inexistente.'
      );
      return;
    }

    const paleta = coresDaPaleta(config.paleta);
    resultado.series.forEach((s, i) => {
      s.cor = config[`cor_${sanitizarChave(s.chave)}`] || paleta[i % paleta.length];
    });

    const todosOsValores = resultado.series.flatMap((s) => s.valores).filter((v) => v !== null);
    const formatarY = emPercentual
      ? (v) => formatarPercentual(v, 0)
      : criarFormatadorNumerico({ estilo: 'numero', casas: 0 });

    const plano = montarPlano({
      ctx,
      serie,
      // A base entra no domínio para a linha de referência nunca sair da área.
      valores: [...todosOsValores, base],
      formatarY,
      comLegenda: config.mostrarLegenda !== false && serie.matriz.series.length > 1,
    });

    // ---------- Linha da base ----------
    if (config.mostrarLinhaDaBase !== false) {
      desenharReferencia({
        svg: plano.svg,
        retangulo: plano.retangulo,
        y: plano.escalaY(base),
        cor: tema.bordaForte,
      });
    }

    // ---------- Linhas ----------
    const curva = config.curvaDaLinha || 'monotone';
    const espessura = Number(config.espessuraDaLinha) || 2;

    for (const s of resultado.series) {
      const desenhar = geradorDeLinha({
        x: (_, i) => plano.x(i),
        y: (_, i) => plano.escalaY(s.valores[i]),
        curva,
        definido: (_, i) => s.valores[i] !== null,
      });
      criarSvgEl('path', {
        pai: plano.svg,
        classe: 'st-linha',
        atributos: {
          d: desenhar(serie.categorias) || '',
          stroke: s.cor,
          'stroke-width': espessura,
          'stroke-linejoin': 'round',
          'stroke-linecap': 'round',
        },
      });

      if (config.mostrarPontos) {
        serie.categorias.forEach((_, i) => {
          if (s.valores[i] === null) return;
          criarSvgEl('circle', {
            pai: plano.svg,
            classe: 'st-ponto',
            atributos: { cx: plano.x(i), cy: plano.escalaY(s.valores[i]), r: espessura * 1.2, fill: s.cor },
          });
        });
      }
    }

    // ---------- Rótulo no fim de cada linha ----------
    if (config.rotularFimDaLinha !== false) {
      const usados = [];
      for (const s of resultado.series) {
        const ultimo = ultimoIndiceComValor(s.valores);
        if (ultimo < 0) continue;

        let y = plano.escalaY(s.valores[ultimo]);
        // Empurra o rótulo quando ele colidiria com outro já posicionado:
        // com várias séries terminando perto, os textos se sobrepõem.
        const alturaDoTexto = Math.max(9, tema.tamanhoBase) + 2;
        while (usados.some((outro) => Math.abs(outro - y) < alturaDoTexto)) y += alturaDoTexto;
        usados.push(y);

        const texto = criarSvgEl('text', {
          pai: plano.svg,
          classe: 'st-marca',
          atributos: {
            x: plano.x(ultimo) + 5,
            y,
            'dominant-baseline': 'central',
            'font-size': Math.max(9, tema.tamanhoBase - 1),
            'font-weight': '600',
            fill: s.cor,
          },
        });
        definirTexto(texto, `${truncar(s.rotulo, 14)} ${formatarY(s.valores[ultimo])}`);
      }
    }

    // ---------- Nota sobre bases diferentes ----------
    if (resultado.nota) {
      const nota = criarEl('div', { classe: 'st-nota', pai: plano.area });
      nota.style.color = tema.textoSuave;
      definirTexto(nota, resultado.nota);
    }

    // ---------- Interação ----------
    ligarGuiaEHover({
      ctx,
      plano,
      serie,
      montarLinhasDoTooltip(indice) {
        return resultado.series
          .filter((s) => s.valores[indice] !== null)
          .sort((a, b) => b.valores[indice] - a.valores[indice])
          .map((s) => ({
            rotulo: s.rotulo,
            valor: `${formatarY(s.valores[indice])}${
              emPercentual ? '' : `  (${formatarPercentual(s.valores[indice] / base - 1, 1)})`
            }`,
            cor: s.cor,
          }));
      },
      aoClicar: (indice, ev) => drillDoPeriodo(ctx, serie, indice, ev),
    });

    // ---------- Legenda ----------
    if (config.mostrarLegenda !== false && plano.areaLegenda) {
      desenharLegenda({
        hospedeiro: plano.areaLegenda,
        tema,
        config,
        itens: serie.matriz.series.map((s, i) => ({
          chave: s.chave,
          rotulo: s.rotulo,
          cor: config[`cor_${sanitizarChave(s.chave)}`] || paleta[i % paleta.length],
        })),
        desligados: desligadas.conjunto,
        aoAlternar: (_, novoConjunto) => {
          desligadas.definir(novoConjunto);
          ctx.redesenhar();
        },
        eventos: ctx.eventos,
      });
    }
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

/** Último índice em que a série tem valor. */
export function ultimoIndiceComValor(valores) {
  for (let i = valores.length - 1; i >= 0; i--) {
    if (valores[i] !== null && Number.isFinite(valores[i])) return i;
  }
  return -1;
}

/** Primeiro índice em que a série tem valor. */
export function primeiroIndiceComValor(valores) {
  for (let i = 0; i < valores.length; i++) {
    if (valores[i] !== null && Number.isFinite(valores[i])) return i;
  }
  return -1;
}

/**
 * Reescala as séries para a base comum.
 *
 * @returns {{series:Array, avisos:string[], nota:string}}
 */
export function reescalar(series, { base = 100, emPercentual = false, periodoDaBase = 'primeiro' } = {}) {
  const avisos = [];
  const saida = [];

  // No modo "comum", a base de todas é o primeiro período em que TODAS têm
  // valor — é o único jeito de as curvas realmente saírem do mesmo ponto.
  let indiceComum = -1;
  if (periodoDaBase === 'comum' && series.length) {
    const quantidade = series[0].valores.length;
    for (let i = 0; i < quantidade; i++) {
      if (series.every((s) => s.valores[i] !== null && Number.isFinite(s.valores[i]) && s.valores[i] > 0)) {
        indiceComum = i;
        break;
      }
    }
    if (indiceComum === -1) {
      avisos.push(
        'Não há nenhum período em que todas as séries tenham valor positivo; ' +
          'cada série foi reescalada pelo próprio primeiro valor.'
      );
    }
  }

  const inicios = new Set();
  const semBase = [];

  for (const serie of series) {
    const indiceDaBase = indiceComum >= 0 ? indiceComum : primeiroIndiceComValor(serie.valores);
    const valorDaBase = indiceDaBase >= 0 ? serie.valores[indiceDaBase] : null;

    // Dividir por zero ou por negativo produz um índice sem significado:
    // a série sai de fora, com aviso, em vez de aparecer com valor falso.
    if (valorDaBase === null || !(valorDaBase > 0)) {
      semBase.push(serie.rotulo);
      continue;
    }

    inicios.add(indiceDaBase);
    const valores = serie.valores.map((v) => {
      if (v === null || !Number.isFinite(v)) return null;
      const razao = v / valorDaBase;
      return emPercentual ? razao - 1 : razao * base;
    });

    saida.push({ ...serie, valores, indiceDaBase, valorDaBase });
  }

  if (semBase.length) {
    avisos.push(
      `${semBase.length} série(s) ficaram de fora porque o valor da base é zero, negativo ou inexistente: ` +
        `${semBase.slice(0, 3).join(', ')}${semBase.length > 3 ? '…' : ''}.`
    );
  }

  // Séries que começam em períodos diferentes não partem do mesmo ponto no
  // tempo, ainda que partam do mesmo valor. Dizer isso é o que separa a
  // comparação honesta da enganosa.
  let nota = '';
  if (indiceComum === -1 && inicios.size > 1) {
    nota =
      'Atenção: as séries começam em períodos diferentes, então cada uma tem a própria base. ' +
      'Para partirem do mesmo período, use "A base é: o primeiro período em que TODAS têm valor".';
  }

  return { series: saida, avisos, nota };
}
