/**
 * fluxo_caixa — "Fluxo de Caixa".
 *
 * Barras de entradas (para cima) e saídas (para baixo) período a período,
 * com a linha do SALDO ACUMULADO por cima. As duas informações juntas
 * respondem perguntas diferentes: a barra diz como foi o mês, a linha diz
 * se o caixa aguenta.
 *
 * Os períodos em que o saldo acumulado fica negativo são destacados — é o
 * que o leitor realmente procura num gráfico destes.
 *
 * Entradas e saídas podem vir de dois jeitos:
 *   - **duas medidas** (entradas e saídas separadas);
 *   - **uma medida com sinal**, em que valores negativos já são saídas.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto } from '../../core/dom.js';
import { geradorDeLinha } from '../../core/shapes.js';
import { comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat } from '../../core/format.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';
import {
  lerSerieTemporal,
  montarPlano,
  desenharReferencia,
  ligarGuiaEHover,
  drillDoPeriodo,
  destruirSerieTemporal,
  avisarSeForaDeOrdem,
} from '../_serie_temporal/index.js';

export default defineViz({
  id: 'fluxo_caixa',
  label: 'Fluxo de Caixa',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        origemDoFluxo: {
          type: 'string',
          label: 'Entradas e saídas vêm de',
          section: 'Dados',
          display: 'select',
          default: 'auto',
          values: listaDeValores([
            { rotulo: 'Detectar sozinho', valor: 'auto' },
            { rotulo: 'Duas medidas (entradas e saídas)', valor: 'duasMedidas' },
            { rotulo: 'Uma medida com sinal (negativo = saída)', valor: 'comSinal' },
          ]),
        },
        saidasSaoPositivas: {
          type: 'boolean',
          label: 'A medida de saídas vem positiva (inverter o sinal)',
          section: 'Dados',
          default: true,
        },
        saldoInicial: {
          type: 'string',
          label: 'Saldo inicial (antes do primeiro período)',
          section: 'Saldo',
          default: '0',
        },
        mostrarSaldo: {
          type: 'boolean',
          label: 'Mostrar a linha do saldo acumulado',
          section: 'Saldo',
          default: true,
        },
        corDoSaldo: {
          type: 'string',
          label: 'Cor da linha de saldo',
          section: 'Saldo',
          display: 'color',
          default: '#1D4ED8',
        },
        espessuraDoSaldo: {
          type: 'number',
          label: 'Espessura da linha de saldo',
          section: 'Saldo',
          display: 'range',
          min: 0.5,
          max: 6,
          step: 0.5,
          default: 2,
        },
        destacarSaldoNegativo: {
          type: 'boolean',
          label: 'Destacar os períodos com saldo negativo',
          section: 'Saldo',
          default: true,
        },
        corDeEntrada: {
          type: 'string',
          label: 'Cor das entradas',
          section: 'Cores',
          display: 'color',
          default: '#16A34A',
        },
        corDeSaida: {
          type: 'string',
          label: 'Cor das saídas',
          section: 'Cores',
          display: 'color',
          default: '#DC2626',
        },
        larguraDaBarra: {
          type: 'number',
          label: 'Largura da barra (% do espaço)',
          section: 'Formato',
          display: 'range',
          min: 10,
          max: 100,
          step: 5,
          default: 65,
        },
        mostrarValorNaBarra: {
          type: 'boolean',
          label: 'Escrever o resultado líquido acima da barra',
          section: 'Rótulos',
          default: false,
        },
      }
    ),
    { gradeEixoY: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    if (medidas.length < 2) return {};
    const adivinhar = (padrao, posicao) =>
      (medidas.find((m) => padrao.test(m.rotulo) || padrao.test(m.nome)) || medidas[posicao] || medidas[0]).nome;
    return {
      ...opcaoDeEscolhaDeCampo('campoDeEntradas', 'Medida das entradas', medidas, {
        secao: 'Dados',
        padrao: adivinhar(/entrada|receita|credit|in\b/i, 0),
      }),
      ...opcaoDeEscolhaDeCampo('campoDeSaidas', 'Medida das saídas', medidas, {
        secao: 'Dados',
        incluirNenhum: true,
        padrao: adivinhar(/sa[íi]da|despesa|custo|debit|out\b/i, 1),
      }),
    };
  },

  render(ctx) {
    const { modelo, config, tema } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio('São necessários pelo menos dois períodos para desenhar um fluxo de caixa.');
      return;
    }

    avisarSeForaDeOrdem(ctx, serie, 'O saldo acumulado é cumulativo');

    const campos = escolherCampos(modelo, config);
    const fluxo = montarFluxo({ modelo, serie, campos, config });

    if (!fluxo.periodos.some((p) => p.entrada !== 0 || p.saida !== 0)) {
      ctx.mostrarVazio('Nenhum período tem entrada ou saída.');
      return;
    }

    const formatarValor = formatadorDeValueFormat(
      (campos.entradas || modelo.medidas[0]).valueFormat,
      { casas: Number(config.casasDecimaisDoRotulo) || 0 }
    );

    const mostrarSaldo = config.mostrarSaldo !== false;
    const valores = [
      0,
      ...fluxo.periodos.map((p) => p.entrada),
      ...fluxo.periodos.map((p) => p.saida),
      ...(mostrarSaldo ? fluxo.periodos.map((p) => p.saldo) : []),
    ];

    const plano = montarPlano({ ctx, serie, valores, formatarY: formatarValor });

    const yDoZero = plano.escalaY(0);
    desenharReferencia({
      svg: plano.svg,
      retangulo: plano.retangulo,
      y: yDoZero,
      cor: tema.bordaForte,
      tracejada: false,
    });

    // ---------- Faixas de saldo negativo ----------
    // O destaque vem ANTES das barras para ficar por baixo delas.
    if (config.destacarSaldoNegativo !== false && mostrarSaldo) {
      const passo = plano.retangulo.largura / fluxo.periodos.length;
      for (const periodo of fluxo.periodos) {
        if (periodo.saldo >= 0) continue;
        criarSvgEl('rect', {
          pai: plano.svg,
          classe: 'st-marca',
          atributos: {
            x: plano.x(periodo.indice) - passo / 2,
            y: plano.retangulo.cima,
            width: passo,
            height: plano.retangulo.altura,
            fill: comOpacidade(config.corDeSaida || tema.negativo, 0.1),
          },
        });
      }
    }

    // ---------- Barras ----------
    const passo = plano.retangulo.largura / fluxo.periodos.length;
    const largura = Math.max(1, passo * ((Number(config.larguraDaBarra) || 65) / 100));
    const corDeEntrada = config.corDeEntrada || tema.positivo;
    const corDeSaida = config.corDeSaida || tema.negativo;

    for (const periodo of fluxo.periodos) {
      const x = plano.x(periodo.indice) - largura / 2;

      if (periodo.entrada > 0) {
        const y = plano.escalaY(periodo.entrada);
        criarSvgEl('rect', {
          pai: plano.svg,
          atributos: {
            x, y, width: largura, height: Math.max(0.5, yDoZero - y),
            fill: corDeEntrada, rx: 1,
          },
        });
      }
      if (periodo.saida < 0) {
        const y = plano.escalaY(periodo.saida);
        criarSvgEl('rect', {
          pai: plano.svg,
          atributos: {
            x, y: yDoZero, width: largura, height: Math.max(0.5, y - yDoZero),
            fill: corDeSaida, rx: 1,
          },
        });
      }

      if (config.mostrarValorNaBarra && passo > 26) {
        const liquido = periodo.entrada + periodo.saida;
        const texto = criarSvgEl('text', {
          pai: plano.svg,
          classe: 'st-marca',
          atributos: {
            x: plano.x(periodo.indice),
            y: (liquido >= 0 ? plano.escalaY(periodo.entrada) : plano.escalaY(periodo.saida)) +
              (liquido >= 0 ? -4 : 11),
            'text-anchor': 'middle',
            'font-size': Math.max(8, tema.tamanhoBase - 3),
            fill: liquido >= 0 ? corDeEntrada : corDeSaida,
          },
        });
        definirTexto(texto, formatarValor(liquido));
      }
    }

    // ---------- Linha de saldo ----------
    if (mostrarSaldo) {
      const desenhar = geradorDeLinha({
        x: (_, i) => plano.x(i),
        y: (_, i) => plano.escalaY(fluxo.periodos[i].saldo),
        curva: 'linear',
      });
      criarSvgEl('path', {
        pai: plano.svg,
        classe: 'st-linha',
        atributos: {
          d: desenhar(serie.categorias) || '',
          stroke: config.corDoSaldo || tema.destaque,
          'stroke-width': Number(config.espessuraDoSaldo) || 2,
          'stroke-linejoin': 'round',
        },
      });

      for (const periodo of fluxo.periodos) {
        criarSvgEl('circle', {
          pai: plano.svg,
          classe: 'st-ponto',
          atributos: {
            cx: plano.x(periodo.indice),
            cy: plano.escalaY(periodo.saldo),
            r: periodo.saldo < 0 ? 3.5 : 2.5,
            fill: periodo.saldo < 0 ? corDeSaida : config.corDoSaldo || tema.destaque,
          },
        });
      }
    }

    // ---------- Resumo ----------
    const nota = criarEl('div', { classe: 'st-nota', pai: plano.area });
    nota.style.color = tema.textoSuave;
    definirTexto(nota, resumo(fluxo, formatarValor, serie));

    // ---------- Interação ----------
    ligarGuiaEHover({
      ctx,
      plano,
      serie,
      montarLinhasDoTooltip(indice) {
        const periodo = fluxo.periodos[indice];
        if (!periodo) return null;
        const linhas = [
          { rotulo: 'Entradas', valor: formatarValor(periodo.entrada), cor: corDeEntrada },
          { rotulo: 'Saídas', valor: formatarValor(periodo.saida), cor: corDeSaida },
          { rotulo: 'Líquido do período', valor: formatarValor(periodo.entrada + periodo.saida) },
        ];
        if (mostrarSaldo) {
          linhas.push({
            rotulo: 'Saldo acumulado',
            valor: formatarValor(periodo.saldo),
            cor: periodo.saldo < 0 ? corDeSaida : config.corDoSaldo,
          });
        }
        return linhas;
      },
      aoClicar: (indice, ev) => drillDoPeriodo(ctx, serie, indice, ev),
    });
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

function escolherCampos(modelo, config) {
  const achar = (nome, posicao) =>
    modelo.medidas.find((m) => m.nome === nome) || modelo.medidas[posicao] || null;

  const entradas = achar(config.campoDeEntradas, 0);
  const saidas = config.campoDeSaidas === '' ? null : achar(config.campoDeSaidas, 1);

  const modo =
    config.origemDoFluxo && config.origemDoFluxo !== 'auto'
      ? config.origemDoFluxo
      : saidas && saidas.nome !== (entradas && entradas.nome)
      ? 'duasMedidas'
      : 'comSinal';

  return { entradas, saidas, modo };
}

/**
 * Entradas, saídas e saldo acumulado por período.
 *
 * @returns {{periodos:Array<{indice,entrada,saida,saldo}>, totalEntradas,
 *            totalSaidas, saldoFinal, periodosNegativos:number}}
 */
export function montarFluxo({ modelo, serie, campos, config }) {
  const quantidade = serie.categorias.length;
  const posicaoPorChave = new Map(serie.categorias.map((c, i) => [c.chave, i]));
  const entradas = new Array(quantidade).fill(0);
  const saidas = new Array(quantidade).fill(0);

  const inverterSaidas = config.saidasSaoPositivas !== false;

  for (const linha of modelo.linhas) {
    const bruto = modelo.valorBruto(linha, serie.matriz.campoDaCategoria.nome);
    const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
    const posicao = posicaoPorChave.get(chave);
    if (posicao === undefined) continue;

    if (campos.modo === 'duasMedidas' && campos.saidas) {
      const entrada = campos.entradas ? modelo.valorNumerico(linha, campos.entradas.nome) : null;
      const saida = modelo.valorNumerico(linha, campos.saidas.nome);
      if (entrada !== null) entradas[posicao] += entrada;
      if (saida !== null) {
        // Saídas costumam vir positivas no modelo ("Despesas: 1.200").
        // Desenhar para baixo exige sinal negativo, e inverter o que já
        // vem negativo criaria uma entrada fantasma.
        const valor = inverterSaidas ? -Math.abs(saida) : Math.min(0, saida);
        saidas[posicao] += valor;
      }
      continue;
    }

    // Uma medida só, com sinal: positivo entra, negativo sai.
    const valor = campos.entradas ? modelo.valorNumerico(linha, campos.entradas.nome) : null;
    if (valor === null) continue;
    if (valor >= 0) entradas[posicao] += valor;
    else saidas[posicao] += valor;
  }

  const inicial = Number(String(config.saldoInicial ?? '0').replace(',', '.'));
  let acumulado = Number.isFinite(inicial) ? inicial : 0;

  const periodos = [];
  let totalEntradas = 0;
  let totalSaidas = 0;
  let periodosNegativos = 0;

  for (let i = 0; i < quantidade; i++) {
    acumulado += entradas[i] + saidas[i];
    if (acumulado < 0) periodosNegativos += 1;
    totalEntradas += entradas[i];
    totalSaidas += saidas[i];
    periodos.push({ indice: i, entrada: entradas[i], saida: saidas[i], saldo: acumulado });
  }

  return { periodos, totalEntradas, totalSaidas, saldoFinal: acumulado, periodosNegativos };
}

function resumo(fluxo, formatar, serie) {
  const partes = [
    `Entradas ${formatar(fluxo.totalEntradas)}`,
    `Saídas ${formatar(fluxo.totalSaidas)}`,
    `Saldo final ${formatar(fluxo.saldoFinal)}`,
  ];
  if (fluxo.periodosNegativos > 0) {
    const primeiro = fluxo.periodos.find((p) => p.saldo < 0);
    partes.push(
      `${fluxo.periodosNegativos} período(s) com saldo negativo, a partir de ${serie.rotuloDaCategoria(
        serie.categorias[primeiro.indice]
      )}`
    );
  }
  return partes.join(' · ');
}
