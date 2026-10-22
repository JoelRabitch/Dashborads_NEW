/**
 * slope_chart — "Slope Chart".
 *
 * Dois períodos (ou dois cenários), uma linha por item ligando os dois. É
 * o gráfico de Tufte para "o que mudou entre A e B".
 *
 * **A diferença para o `bump_chart` é o ponto de existir dos dois:** lá o
 * eixo é a POSIÇÃO e o gráfico responde "quem passou quem"; aqui o eixo é
 * o VALOR, a inclinação da linha É a variação, e a pergunta respondida é
 * "quanto mudou". Um item pode subir muito e não mudar de posição; outro
 * pode trocar de lugar por uma diferença mínima. Os dois gráficos contam
 * metades diferentes da mesma história, e cada um aponta o outro na nota.
 *
 * O problema prático é o rótulo: com 30 itens, os nomes nas pontas se
 * empilham. A solução aqui empurra os rótulos verticalmente **preservando
 * a ordem** — trocar dois nomes de lugar para caber seria pior do que
 * deixá-los sobrepostos, porque o leitor liga o nome à linha errada sem
 * ter como perceber.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica } from '../../core/scales.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { larguraAproximada } from '../../core/eixos.js';
import { lerSerieTemporal, destruirSerieTemporal } from '../_serie_temporal/index.js';
import { tratarNulos, opcaoDeOrigemDasSeries } from '../../core/series.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.sl-area{position:relative;width:100%;height:100%;overflow:hidden;}
.sl-svg{position:absolute;left:0;top:0;}
.sl-linha{pointer-events:none;}
.sl-ponto{pointer-events:none;}
.sl-rotulo{pointer-events:none;}
.sl-cabecalho{pointer-events:none;font-weight:600;}
.sl-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso nem a anti-colisão salva: os nomes ficam menores que a fonte. */
const MAXIMO_DE_ITENS = 60;

export default defineViz({
  id: 'slope_chart',
  label: 'Slope Chart',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      {
        corPorDirecao: {
          type: 'boolean',
          label: 'Colorir por direção (sobe, desce, mantém)',
          section: 'Slope',
          default: true,
        },
        corDeAlta: {
          type: 'string',
          label: 'Cor de quem subiu',
          section: 'Slope',
          display: 'color',
          default: '',
        },
        corDeBaixa: {
          type: 'string',
          label: 'Cor de quem caiu',
          section: 'Slope',
          display: 'color',
          default: '',
        },
        criterioDaVariacao: {
          type: 'string',
          label: 'Medir a variação em',
          section: 'Slope',
          display: 'select',
          default: 'absoluta',
          values: listaDeValores([
            { rotulo: 'Valor absoluto', valor: 'absoluta' },
            { rotulo: 'Percentual', valor: 'percentual' },
          ]),
        },
        destacarMaiores: {
          type: 'number',
          label: 'Destacar as N maiores variações (0 = nenhuma)',
          section: 'Slope',
          display: 'number',
          default: 0,
        },
        comecarEmZero: {
          type: 'boolean',
          label: 'Começar o eixo em zero',
          section: 'Slope',
          default: false,
        },
        escreverValores: {
          type: 'boolean',
          label: 'Escrever o valor junto do nome',
          section: 'Rótulos',
          default: true,
        },
        espessuraDaLinha: {
          type: 'number',
          label: 'Espessura das linhas',
          section: 'Formato',
          display: 'range',
          min: 0.5,
          max: 6,
          step: 0.5,
          default: 2,
        },
      }
    ),
    { limiteDeSeries: MAXIMO_DE_ITENS, mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio(
        'Um slope chart compara DOIS pontos no tempo. Traga ao menos dois períodos ' +
          'e várias séries (de um pivô, de uma segunda dimensão ou de várias medidas).'
      );
      return;
    }

    let series = tratarNulos(serie.matriz.series, 'manter');
    if (!series.length) {
      ctx.mostrarVazio('Nenhuma série com valores para comparar.');
      return;
    }
    if (series.length > MAXIMO_DE_ITENS) {
      ctx.avisar(
        `A consulta tem ${series.length} séries. Mostrando as ${MAXIMO_DE_ITENS} primeiras: ` +
          'acima disso nem a anti-colisão dos nomes dá conta.'
      );
      series = series.slice(0, MAXIMO_DE_ITENS);
    }

    // Só dois pontos entram. Com mais períodos, usamos o PRIMEIRO e o
    // ÚLTIMO — e dizemos que foi isso que se fez, porque o gráfico some
    // com tudo que está no meio.
    const indiceDeA = 0;
    const indiceDeB = serie.categorias.length - 1;
    const periodosIgnorados = Math.max(0, serie.categorias.length - 2);

    const itens = [];
    for (const s of series) {
      const a = s.valores[indiceDeA];
      const b = s.valores[indiceDeB];
      if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b)) continue;
      itens.push({
        chave: s.chave,
        rotulo: s.rotulo,
        a,
        b,
        variacao: b - a,
        variacaoRelativa: a === 0 ? null : (b - a) / Math.abs(a),
      });
    }

    if (itens.length < 1) {
      ctx.mostrarVazio(
        'Nenhuma série tem valor nos DOIS períodos comparados. ' +
          'Uma linha de slope precisa das duas pontas — verifique os nulos no Explore.'
      );
      return;
    }
    const incompletas = series.length - itens.length;
    if (incompletas > 0) {
      ctx.avisar(
        `${incompletas} série(s) não têm valor nos dois períodos e ficaram de fora: ` +
          'uma linha de slope precisa das duas pontas.'
      );
    }

    const semBase = itens.filter((i) => i.variacaoRelativa === null);
    if ((config.criterioDaVariacao || 'absoluta') === 'percentual' && semBase.length) {
      ctx.avisar(
        `${semBase.length} série(s) começam em zero: variação percentual sobre zero não existe. ` +
          'Elas aparecem, mas sem percentual.'
      );
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'sl');
    const area = criarEl('div', { classe: 'sl-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(serie.matriz.medida && serie.matriz.medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const escreverValores = config.escreverValores !== false;
    const textoDoRotulo = (item, valor) =>
      escreverValores ? `${truncar(item.rotulo, 18)} ${formatar(valor)}` : truncar(item.rotulo, 18);

    const maiorRotulo = itens.reduce(
      (a, item) =>
        Math.max(
          a,
          larguraAproximada(textoDoRotulo(item, item.a), fonte),
          larguraAproximada(textoDoRotulo(item, item.b), fonte)
        ),
      0
    );
    const margemLateral = Math.min(largura * 0.34, maiorRotulo + 16);
    const margemDeCima = fonte + 16;
    const margemDeBaixo = 18;

    const xA = margemLateral;
    const xB = Math.max(xA + 30, largura - margemLateral);
    const cima = margemDeCima;
    const alturaUtil = Math.max(30, altura - margemDeCima - margemDeBaixo);

    const valores = itens.flatMap((i) => [i.a, i.b]);
    if (config.comecarEmZero === true) valores.push(0);
    const escalaY = escalaNumerica({
      valores,
      intervalo: [cima + alturaUtil, cima],
      config: {},
      eixo: 'Y',
    });
    const incluiZero = Math.min(...valores) <= 0 && Math.max(...valores) >= 0;

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'sl-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Cabeçalhos dos dois períodos ----------
    for (const lado of [
      { x: xA, texto: serie.rotuloDaCategoria(serie.categorias[indiceDeA]), ancora: 'end' },
      { x: xB, texto: serie.rotuloDaCategoria(serie.categorias[indiceDeB]), ancora: 'start' },
    ]) {
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'sl-cabecalho',
        atributos: {
          x: lado.x + (lado.ancora === 'end' ? -6 : 6),
          y: fonte + 2,
          'text-anchor': lado.ancora,
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      definirTexto(texto, lado.texto);
    }

    for (const x of [xA, xB]) {
      criarSvgEl('line', {
        pai: svg,
        classe: 'sl-linha',
        atributos: {
          x1: x, x2: x, y1: cima, y2: cima + alturaUtil,
          stroke: tema.borda, 'stroke-width': 1,
        },
      });
    }

    // ---------- Cores e destaque ----------
    const paleta = coresDaPaleta(config.paleta);
    const corDeAlta = config.corDeAlta || tema.positivo;
    const corDeBaixa = config.corDeBaixa || tema.negativo;
    const porDirecao = config.corPorDirecao !== false;

    const topN = Math.max(0, Number(config.destacarMaiores) || 0);
    const criterio = config.criterioDaVariacao || 'absoluta';
    const forca = (item) =>
      criterio === 'percentual'
        ? item.variacaoRelativa === null
          ? -Infinity
          : Math.abs(item.variacaoRelativa)
        : Math.abs(item.variacao);

    const destacados = new Set(
      topN > 0
        ? itens
            .slice()
            .sort((x, y) => forca(y) - forca(x))
            .slice(0, topN)
            .map((i) => i.chave)
        : []
    );

    itens.forEach((item, indice) => {
      item.cor = porDirecao
        ? item.variacao > 0
          ? corDeAlta
          : item.variacao < 0
            ? corDeBaixa
            : tema.neutro
        : paleta[indice % paleta.length];
      item.apagado = topN > 0 && !destacados.has(item.chave);
    });

    // ---------- Linhas ----------
    const espessura = Number(config.espessuraDaLinha) || 2;
    for (const item of itens) {
      item.yA = escalaY(item.a);
      item.yB = escalaY(item.b);

      criarSvgEl('line', {
        pai: svg,
        classe: 'sl-linha',
        atributos: {
          x1: xA, y1: item.yA, x2: xB, y2: item.yB,
          stroke: item.cor,
          'stroke-width': item.apagado ? Math.max(0.5, espessura * 0.5) : espessura,
          opacity: item.apagado ? 0.2 : 0.9,
        },
      });

      for (const ponta of [{ x: xA, y: item.yA }, { x: xB, y: item.yB }]) {
        criarSvgEl('circle', {
          pai: svg,
          classe: 'sl-ponto',
          atributos: {
            cx: ponta.x, cy: ponta.y, r: item.apagado ? 2 : 3.5,
            fill: item.cor, opacity: item.apagado ? 0.3 : 1,
          },
        });
      }
    }

    // ---------- Rótulos, com anti-colisão ----------
    const alturaDoRotulo = fonte + 2;
    const limites = { cima, baixo: cima + alturaUtil };

    for (const lado of ['a', 'b']) {
      const ordenados = itens
        .map((item, indice) => ({ item, indice, y: lado === 'a' ? item.yA : item.yB }))
        .sort((x, y) => x.y - y.y);

      const ajustados = resolverColisoes(
        ordenados.map((o) => o.y),
        alturaDoRotulo,
        limites
      );

      ordenados.forEach((o, i) => {
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'sl-rotulo',
          atributos: {
            x: lado === 'a' ? xA - 8 : xB + 8,
            y: ajustados[i],
            'text-anchor': lado === 'a' ? 'end' : 'start',
            'dominant-baseline': 'central',
            'font-size': fonte,
            fill: o.item.apagado ? tema.textoSuave : tema.texto,
            opacity: o.item.apagado ? 0.5 : 1,
          },
        });
        definirTexto(texto, textoDoRotulo(o.item, lado === 'a' ? o.item.a : o.item.b));
      });
    }

    // ---------- Nota ----------
    const subiram = itens.filter((i) => i.variacao > 0).length;
    const cairam = itens.filter((i) => i.variacao < 0).length;

    const nota = criarEl('div', { classe: 'sl-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${itens.length} itens · ${subiram} subiram, ${cairam} caíram, ${itens.length - subiram - cairam} mantiveram`,
        periodosIgnorados > 0
          ? `comparando o PRIMEIRO e o ÚLTIMO período: os ${periodosIgnorados} do meio não aparecem`
          : null,
        incluiZero ? 'o eixo inclui o zero' : 'ATENÇÃO: o eixo NÃO inclui o zero — a inclinação mostra a variação, não a proporção',
        `variação medida em ${criterio === 'percentual' ? 'percentual' : 'valor absoluto'}`,
        'para quem passou quem (e não quanto mudou), veja o Bump Chart',
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixa = area.getBoundingClientRect();
      const px = ev.clientX - caixa.left;
      const py = ev.clientY - caixa.top;

      const alvo = linhaMaisProxima({ itens, px, py, xA, xB });
      if (!alvo) {
        tooltip.esconder();
        return;
      }
      tooltip.mostrar(
        {
          titulo: alvo.rotulo,
          linhas: [
            { rotulo: serie.rotuloDaCategoria(serie.categorias[indiceDeA]), valor: formatar(alvo.a), cor: alvo.cor },
            { rotulo: serie.rotuloDaCategoria(serie.categorias[indiceDeB]), valor: formatar(alvo.b) },
            { rotulo: 'Variação', valor: `${alvo.variacao >= 0 ? '+' : ''}${formatar(alvo.variacao)}` },
            {
              rotulo: 'Variação %',
              valor:
                alvo.variacaoRelativa === null
                  ? 'não existe (começou em zero)'
                  : `${alvo.variacaoRelativa >= 0 ? '+' : ''}${formatarPercentual(alvo.variacaoRelativa, 1)}`,
            },
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

function linhaMaisProxima({ itens, px, py, xA, xB }) {
  if (px < xA - 10 || px > xB + 10) return null;
  const t = (px - xA) / Math.max(1, xB - xA);
  let melhor = null;
  let menor = Infinity;
  for (const item of itens) {
    const y = item.yA + (item.yB - item.yA) * Math.max(0, Math.min(1, t));
    const d = Math.abs(y - py);
    if (d < menor) {
      menor = d;
      melhor = item;
    }
  }
  return menor <= 14 ? melhor : null;
}

/**
 * Espalha rótulos que se sobrepõem, **preservando a ordem**.
 *
 * Recebe as posições JÁ ORDENADAS de cima para baixo e devolve posições
 * ajustadas com pelo menos `alturaMinima` entre vizinhos, dentro dos
 * limites.
 *
 * Preservar a ordem é a parte que importa. Um algoritmo que simplesmente
 * procura o espaço livre mais próximo pode trocar dois rótulos de lugar —
 * e aí o leitor liga o nome à linha errada sem ter como perceber. É um
 * erro pior do que a sobreposição que se queria resolver.
 *
 * São três passadas: empurra para baixo acumulando a sobreposição, puxa de
 * volta quem estourou o limite inferior, e no fim prende no limite
 * superior. Quando não há espaço para todos (mais rótulos que pixels), o
 * resultado fica comprimido e sobreposto — mas NA ORDEM.
 */
export function resolverColisoes(posicoes, alturaMinima, limites) {
  const n = posicoes.length;
  if (!n) return [];

  const saida = posicoes.slice();

  // 1) De cima para baixo: ninguém pode estar a menos de `alturaMinima`
  //    do anterior.
  saida[0] = Math.max(saida[0], limites.cima);
  for (let i = 1; i < n; i++) {
    saida[i] = Math.max(saida[i], saida[i - 1] + alturaMinima);
  }

  // 2) Se o último estourou o rodapé, puxa de baixo para cima.
  if (saida[n - 1] > limites.baixo) {
    saida[n - 1] = limites.baixo;
    for (let i = n - 2; i >= 0; i--) {
      saida[i] = Math.min(saida[i], saida[i + 1] - alturaMinima);
    }
  }

  // 3) E se a puxada estourou o topo, prende ali e desce de novo — sem
  //    nunca trocar a ordem.
  if (saida[0] < limites.cima) {
    saida[0] = limites.cima;
    for (let i = 1; i < n; i++) {
      saida[i] = Math.max(saida[i], saida[i - 1] + alturaMinima);
    }
  }

  return saida;
}
