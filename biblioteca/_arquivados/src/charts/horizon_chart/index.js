/**
 * horizon_chart — "Horizon Chart".
 *
 * A resposta de Heer, Kong e Agrawala para "como caber trinta séries
 * temporais numa tela só": em vez de encolher a área até virar um fio, ela
 * é **dobrada** em faixas de mesma altura, e cada dobra ganha uma cor mais
 * forte. Uma série que precisaria de 200 px cabe em 25 px mantendo a
 * leitura de pico e de vale.
 *
 * Três coisas precisam ser ditas, porque o gráfico é pouco conhecido e a
 * leitura ingênua erra:
 *
 * 1. **Cor escura = valor alto.** Sem a legenda com os intervalos, a cor
 *    não tem significado declarado e o gráfico vira textura bonita.
 * 2. **Valores negativos são espelhados para cima, com outra cor.** É a
 *    convenção, e é exatamente onde quem não conhece o gráfico se engana:
 *    o que parece um pico pode ser um vale profundo.
 * 3. **Todas as faixas compartilham a escala.** Senão as alturas não se
 *    comparam entre séries — e comparar séries é a única razão de
 *    empilhá-las.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaDePonto } from '../../core/scales.js';
import { geradorDeArea } from '../../core/shapes.js';
import { interpoladorContinuo, opcoesDeEscalaContinua, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { larguraAproximada } from '../../core/eixos.js';
import { lerSerieTemporal, destruirSerieTemporal } from '../_serie_temporal/index.js';
import { tratarNulos, opcaoDeOrigemDasSeries } from '../../core/series.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.hz-area{position:relative;width:100%;height:100%;overflow:hidden;}
.hz-svg{position:absolute;left:0;top:0;}
.hz-dobra{pointer-events:none;}
.hz-nome{pointer-events:none;}
.hz-base{pointer-events:none;}
.hz-guia{pointer-events:none;}
.hz-legenda{pointer-events:none;}
.hz-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso a faixa fica com menos de 8 px e nem a cor se distingue. */
const MAXIMO_DE_SERIES = 40;

/**
 * Acima de 4 dobras a leitura piora: o olho deixa de contar as camadas e
 * passa a ver só "escuro". A pesquisa original recomenda 2 ou 3.
 */
const MAXIMO_DE_DOBRAS = 6;

export default defineViz({
  id: 'horizon_chart',
  label: 'Horizon Chart',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      {
        dobras: {
          type: 'number',
          label: 'Número de dobras (2 ou 3 são o recomendado)',
          section: 'Horizon',
          display: 'range',
          min: 1,
          max: MAXIMO_DE_DOBRAS,
          step: 1,
          default: 3,
        },
        alturaDaFaixa: {
          type: 'number',
          label: 'Altura de cada faixa (0 = divide o espaço)',
          section: 'Horizon',
          display: 'number',
          default: 0,
        },
        escalaDeCor: {
          type: 'string',
          label: 'Paleta dos valores positivos',
          section: 'Cor',
          display: 'select',
          default: 'azul',
          values: opcoesDeEscalaContinua(),
        },
        corNegativa: {
          type: 'string',
          label: 'Cor dos valores negativos',
          section: 'Cor',
          display: 'color',
          default: '#DC2626',
        },
        ordemDasFaixas: {
          type: 'string',
          label: 'Ordem das faixas',
          section: 'Horizon',
          display: 'select',
          default: 'total',
          values: listaDeValores([
            { rotulo: 'Pelo total (maior primeiro)', valor: 'total' },
            { rotulo: 'Pelo pico (maior primeiro)', valor: 'pico' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
          ]),
        },
        mostrarLegendaDeDobras: {
          type: 'boolean',
          label: 'Legenda com o intervalo de cada dobra',
          section: 'Horizon',
          default: true,
        },
        curvaDaLinha: {
          type: 'string',
          label: 'Suavização',
          section: 'Formato',
          display: 'select',
          default: 'linear',
          values: listaDeValores([
            { rotulo: 'Reta', valor: 'linear' },
            { rotulo: 'Suave sem ultrapassar (monotone)', valor: 'monotone' },
            { rotulo: 'Degraus', valor: 'stepAfter' },
          ]),
        },
      }
    ),
    { limiteDeSeries: MAXIMO_DE_SERIES, mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio(
        'Um horizon chart precisa de uma dimensão no eixo (de preferência temporal) ' +
          'com pelo menos dois períodos.'
      );
      return;
    }

    let series = tratarNulos(serie.matriz.series, 'manter');
    if (!series.length) {
      ctx.mostrarVazio('Nenhuma série com valores para desenhar.');
      return;
    }
    if (series.length > MAXIMO_DE_SERIES) {
      ctx.avisar(
        `A consulta tem ${series.length} séries. Mostrando as ${MAXIMO_DE_SERIES} primeiras: ` +
          'acima disso a faixa fica com menos de 8 px e nem a cor se distingue.'
      );
      series = series.slice(0, MAXIMO_DE_SERIES);
    }
    series = ordenarFaixas(series, config.ordemDasFaixas);

    const dobras = Math.max(1, Math.min(MAXIMO_DE_DOBRAS, Number(config.dobras) || 3));
    if (dobras > 4) {
      ctx.avisar(
        `Com ${dobras} dobras o olho deixa de contar as camadas e passa a ver só "escuro". ` +
          'A recomendação da pesquisa que criou o gráfico é 2 ou 3.'
      );
    }

    // A escala é COMPARTILHADA: a banda sai do maior |valor| de TODAS as
    // séries. Uma banda por série faria cada faixa usar toda a altura e as
    // alturas deixariam de ser comparáveis — que é a única razão de
    // empilhá-las.
    const todos = series.flatMap((s) => s.valores).filter((v) => v !== null && Number.isFinite(v));
    if (!todos.length) {
      ctx.mostrarVazio('Nenhuma série tem valores numéricos para desenhar.');
      return;
    }
    const extremo = Math.max(...todos.map((v) => Math.abs(v)));
    const banda = extremo / dobras || 1;
    const temNegativos = todos.some((v) => v < 0);

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'hz');
    const area = criarEl('div', { classe: 'hz-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(serie.matriz.medida && serie.matriz.medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const fonte = Math.max(8, tema.tamanhoBase - 2);
    const maiorNome = series.reduce(
      (a, s) => Math.max(a, larguraAproximada(truncar(s.rotulo, 18), fonte)),
      0
    );
    const margemEsquerda = Math.min(largura * 0.3, maiorNome + 12);
    const comLegenda = config.mostrarLegendaDeDobras !== false;
    const margemDireita = comLegenda ? 110 : 10;
    const margemDeCima = 6;
    const margemDeBaixo = fonte + 14;

    const alturaDisponivel = Math.max(20, altura - margemDeCima - margemDeBaixo);
    const alturaPedida = Number(config.alturaDaFaixa) || 0;
    const espacoEntreFaixas = 1;
    const alturaDaFaixa =
      alturaPedida > 0
        ? alturaPedida
        : Math.max(6, alturaDisponivel / series.length - espacoEntreFaixas);

    const escalaX = escalaDePonto({
      dominio: serie.categorias.map((c) => c.chave),
      intervalo: [margemEsquerda, Math.max(margemEsquerda + 20, largura - margemDireita)],
      preenchimento: 0,
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'hz-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const interpolador = interpoladorContinuo(config.escalaDeCor);
    const corNegativa = config.corNegativa || tema.negativo;
    // As dobras ficam na metade mais forte da paleta: a parte clara some
    // sobre o fundo branco e a primeira dobra não apareceria.
    const corDaDobra = (k) => interpolador(0.35 + (0.65 * (k + 1)) / dobras);
    const corDaDobraNegativa = (k) => comOpacidade(corNegativa, 0.35 + (0.65 * (k + 1)) / dobras);

    const curva = config.curvaDaLinha || 'linear';

    // ---------- Faixas ----------
    series.forEach((s, indice) => {
      const topo = margemDeCima + indice * (alturaDaFaixa + espacoEntreFaixas);
      const base = topo + alturaDaFaixa;
      s.topo = topo;
      s.base = base;

      criarSvgEl('rect', {
        pai: svg,
        classe: 'hz-base',
        atributos: {
          x: margemEsquerda,
          y: topo,
          width: Math.max(1, largura - margemEsquerda - margemDireita),
          height: alturaDaFaixa,
          fill: comOpacidade(tema.borda, 0.25),
        },
      });

      // Uma camada por dobra e por sinal. As dobras mais altas são
      // desenhadas por cima, e só existem onde o valor chega nelas.
      for (const sinal of temNegativos ? [1, -1] : [1]) {
        for (let k = 0; k < dobras; k++) {
          const gerador = geradorDeArea({
            x: (_, i) => escalaX(serie.categorias[i].chave),
            y0: () => base,
            y1: (_, i) =>
              base - fracaoDaDobra(s.valores[i], banda, k, sinal) * alturaDaFaixa,
            curva,
            definido: (_, i) => s.valores[i] !== null && Number.isFinite(s.valores[i]),
          });
          const d = gerador(serie.categorias) || '';
          if (!d) continue;

          criarSvgEl('path', {
            pai: svg,
            classe: 'hz-dobra',
            atributos: {
              d,
              fill: sinal > 0 ? corDaDobra(k) : corDaDobraNegativa(k),
              'data-dobra': String(k + 1),
              'data-sinal': sinal > 0 ? 'positivo' : 'negativo',
            },
          });
        }
      }

      const nome = criarSvgEl('text', {
        pai: svg,
        classe: 'hz-nome',
        atributos: {
          x: margemEsquerda - 6,
          y: topo + alturaDaFaixa / 2,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          'font-size': Math.min(fonte, Math.max(7, alturaDaFaixa - 2)),
          fill: tema.texto,
        },
      });
      definirTexto(nome, truncar(s.rotulo, 18));
    });

    // ---------- Eixo de períodos ----------
    const alturaTotalDasFaixas = series.length * (alturaDaFaixa + espacoEntreFaixas);
    const yDosRotulos = margemDeCima + alturaTotalDasFaixas + fonte + 2;
    const salto = saltoDosPeriodos(serie, escalaX, fonte);
    serie.categorias.forEach((categoria, i) => {
      if (i % salto !== 0 && i !== serie.categorias.length - 1) return;
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'hz-nome',
        atributos: {
          x: escalaX(categoria.chave),
          y: Math.min(yDosRotulos, altura - 3),
          'text-anchor': i === 0 ? 'start' : i === serie.categorias.length - 1 ? 'end' : 'middle',
          'font-size': fonte,
          fill: tema.textoSuave,
        },
      });
      definirTexto(texto, serie.rotuloDaCategoria(categoria));
    });

    // ---------- Legenda das dobras ----------
    if (comLegenda) {
      const x = largura - margemDireita + 10;
      let y = margemDeCima + 4;
      for (let k = dobras - 1; k >= 0; k--) {
        criarSvgEl('rect', {
          pai: svg,
          classe: 'hz-legenda',
          atributos: { x, y, width: 12, height: 10, fill: corDaDobra(k) },
        });
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'hz-legenda',
          atributos: {
            x: x + 15,
            y: y + 5,
            'dominant-baseline': 'central',
            'font-size': Math.max(8, fonte - 1),
            fill: tema.textoSuave,
          },
        });
        definirTexto(texto, `${formatar(k * banda)}–${formatar((k + 1) * banda)}`);
        y += 14;
      }
      if (temNegativos) {
        y += 4;
        criarSvgEl('rect', {
          pai: svg,
          classe: 'hz-legenda',
          atributos: { x, y, width: 12, height: 10, fill: corDaDobraNegativa(dobras - 1) },
        });
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'hz-legenda',
          atributos: {
            x: x + 15,
            y: y + 5,
            'dominant-baseline': 'central',
            'font-size': Math.max(8, fonte - 1),
            fill: tema.textoSuave,
          },
        });
        definirTexto(texto, 'negativo');
      }
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'hz-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${series.length} séries em ${dobras} dobras de ${formatar(banda)}`,
        'quanto mais escuro, maior — a área é DOBRADA, não cortada',
        'escala compartilhada: as alturas são comparáveis entre faixas',
        temNegativos
          ? 'ATENÇÃO: valores negativos sobem com cor própria — o que parece pico pode ser vale'
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const guia = criarSvgEl('line', {
      pai: svg,
      classe: 'hz-guia',
      atributos: {
        y1: margemDeCima,
        y2: margemDeCima + alturaTotalDasFaixas,
        stroke: tema.bordaForte,
        'stroke-width': 1,
        opacity: 0,
      },
    });

    ctx.eventos.on(area, 'pointermove', (ev) => {
      const caixa = area.getBoundingClientRect();
      const px = ev.clientX - caixa.left;
      const py = ev.clientY - caixa.top;

      const i = indiceDoPeriodo(px, serie, escalaX);
      const faixa = series.find((s) => py >= s.topo && py <= s.base);

      if (i < 0 || !faixa) {
        guia.setAttribute('opacity', 0);
        if (tooltip) tooltip.esconder();
        return;
      }

      const x = escalaX(serie.categorias[i].chave);
      guia.setAttribute('x1', x);
      guia.setAttribute('x2', x);
      guia.setAttribute('opacity', 0.6);

      if (!tooltip) return;
      const valor = faixa.valores[i];
      const dobra = valor === null || !Number.isFinite(valor) ? null : dobraDoValor(valor, banda, dobras);
      tooltip.mostrar(
        {
          titulo: faixa.rotulo,
          linhas: [
            { rotulo: 'Período', valor: serie.rotuloDaCategoria(serie.categorias[i]) },
            {
              rotulo: serie.matriz.medida ? serie.matriz.medida.rotuloCurto : 'Valor',
              valor: valor === null || !Number.isFinite(valor) ? 'sem dado' : formatar(valor),
            },
            // A dobra vai no tooltip porque é a chave de leitura do
            // gráfico: sem ela, a cor é só uma cor.
            ...(dobra === null
              ? []
              : [
                  { rotulo: 'Dobra', valor: `${dobra} de ${dobras}` },
                  ...(valor < 0
                    ? [{ rotulo: 'Sinal', valor: 'NEGATIVO (espelhado para cima)', cor: corNegativa }]
                    : []),
                ]),
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      guia.setAttribute('opacity', 0);
      if (tooltip) tooltip.esconder();
    });
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

export function ordenarFaixas(series, modo = 'total') {
  const copia = series.slice();
  const soma = (s) => s.valores.reduce((a, v) => a + (Number.isFinite(v) ? Math.abs(v) : 0), 0);
  const pico = (s) => s.valores.reduce((a, v) => (Number.isFinite(v) ? Math.max(a, Math.abs(v)) : a), 0);

  if (modo === 'pico') copia.sort((a, b) => pico(b) - pico(a));
  else if (modo === 'alfabetica') copia.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  else if (modo !== 'consulta') copia.sort((a, b) => soma(b) - soma(a));
  return copia;
}

/**
 * Quanto da dobra `k` o valor preenche, de 0 a 1.
 *
 * É a conta que define o gráfico. Com banda = 100 e 3 dobras, o valor 250
 * preenche a dobra 0 inteira (1), a dobra 1 inteira (1) e metade da dobra
 * 2 (0,5) — e é empilhando essas três camadas, cada uma mais escura, que
 * 250 cabe na altura de 100.
 *
 * O `sinal` separa positivos de negativos: cada um desenha só a sua
 * metade, com cor própria. Um valor negativo NÃO contribui para as
 * camadas positivas, senão o espelhamento viraria soma.
 */
export function fracaoDaDobra(valor, banda, k, sinal = 1) {
  if (valor === null || !Number.isFinite(valor) || !(banda > 0)) return 0;
  if (sinal > 0 ? valor <= 0 : valor >= 0) return 0;
  const magnitude = Math.abs(valor);
  return Math.max(0, Math.min(1, (magnitude - k * banda) / banda));
}

/** Em qual dobra (1..dobras) o valor cai — a chave de leitura da cor. */
export function dobraDoValor(valor, banda, dobras) {
  if (valor === null || !Number.isFinite(valor) || !(banda > 0)) return null;
  const magnitude = Math.abs(valor);
  if (magnitude === 0) return 1;
  return Math.max(1, Math.min(dobras, Math.ceil(magnitude / banda)));
}

function indiceDoPeriodo(px, serie, escalaX) {
  let melhor = -1;
  let menor = Infinity;
  serie.categorias.forEach((categoria, i) => {
    const d = Math.abs(escalaX(categoria.chave) - px);
    if (d < menor) {
      menor = d;
      melhor = i;
    }
  });
  return melhor;
}

function saltoDosPeriodos(serie, escalaX, fonte) {
  if (serie.categorias.length < 2) return 1;
  const maiorRotulo = serie.categorias.reduce(
    (a, c) => Math.max(a, larguraAproximada(serie.rotuloDaCategoria(c), fonte)),
    0
  );
  const disponivel = Math.abs(
    escalaX(serie.categorias[1].chave) - escalaX(serie.categorias[0].chave)
  );
  return Math.max(1, Math.ceil((maiorRotulo + 10) / Math.max(1, disponivel)));
}
