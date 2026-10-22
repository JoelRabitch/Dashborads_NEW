/**
 * bump_chart — "Bump Chart".
 *
 * A evolução do RANKING ao longo do tempo: uma linha por item, mas o eixo
 * Y é a POSIÇÃO, não o valor. É o gráfico de "quem subiu e quem caiu".
 *
 * **E ele tem uma armadilha própria, estrutural:** a distância entre o 1º
 * e o 2º lugar é desenhada igual à distância entre o 9º e o 10º — não
 * importa se o líder abriu dez vezes de vantagem e os outros estão
 * empatados na terceira casa decimal. O ranking APAGA a magnitude, e uma
 * troca de posições pode ser um terremoto ou um empate técnico sem que o
 * desenho mude.
 *
 * Por isso duas coisas não são opcionais aqui: a ressalva fica escrita na
 * tela, e o tooltip mostra sempre o VALOR ao lado da posição — é a única
 * forma de o leitor distinguir os dois casos.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaDePonto } from '../../core/scales.js';
import { geradorDeLinha } from '../../core/shapes.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { larguraAproximada } from '../../core/eixos.js';
import {
  opcoesDeTracado,
  lerSerieTemporal,
  destruirSerieTemporal,
} from '../_serie_temporal/index.js';
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
.bp-area{position:relative;width:100%;height:100%;overflow:hidden;}
.bp-svg{position:absolute;left:0;top:0;}
.bp-linha{fill:none;pointer-events:none;}
.bp-ponto{pointer-events:none;}
.bp-rotulo{pointer-events:none;}
.bp-periodo{pointer-events:none;}
.bp-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso as posições ficam a menos de 10 px e nada é seguível. */
const MAXIMO_DE_SERIES = 30;

export default defineViz({
  id: 'bump_chart',
  label: 'Bump Chart',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      opcoesDeTracado({ espessuraPadrao: 2.5 }),
      {
        melhorPosicao: {
          type: 'string',
          label: 'A 1ª posição é',
          section: 'Ranking',
          display: 'select',
          default: 'maior',
          values: listaDeValores([
            { rotulo: 'O maior valor', valor: 'maior' },
            { rotulo: 'O menor valor', valor: 'menor' },
          ]),
        },
        mostrarPosicao: {
          type: 'boolean',
          label: 'Número da posição dentro do ponto',
          section: 'Ranking',
          default: true,
        },
        rotulosNasPontas: {
          type: 'string',
          label: 'Nomes nas pontas',
          section: 'Rótulos',
          display: 'select',
          default: 'ambas',
          values: listaDeValores([
            { rotulo: 'Nos dois lados', valor: 'ambas' },
            { rotulo: 'Só à esquerda', valor: 'esquerda' },
            { rotulo: 'Só à direita', valor: 'direita' },
            { rotulo: 'Nenhum', valor: 'nenhum' },
          ]),
        },
        destacarNoHover: {
          type: 'boolean',
          label: 'Destacar uma série ao passar o mouse',
          section: 'Ranking',
          default: true,
        },
        tamanhoDoPonto: {
          type: 'number',
          label: 'Tamanho do ponto',
          section: 'Formato',
          display: 'range',
          min: 4,
          max: 24,
          step: 1,
          default: 12,
        },
      }
    ),
    { limiteDeSeries: MAXIMO_DE_SERIES, curvaDaLinha: 'monotone', mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio(
        'Um bump chart precisa de pelo menos dois períodos e de várias séries ' +
          '(de um pivô, de uma segunda dimensão ou de várias medidas).'
      );
      return;
    }

    // `manter` de propósito: um período sem valor NÃO pode virar uma
    // posição interpolada — a linha corta, e a lacuna é a informação.
    let series = tratarNulos(serie.matriz.series, 'manter');

    if (series.length < 2) {
      ctx.mostrarVazio(
        'Um ranking precisa de pelo menos DUAS séries para comparar. ' +
          'Traga um pivô, uma segunda dimensão ou mais medidas no Explore.'
      );
      return;
    }
    if (series.length > MAXIMO_DE_SERIES) {
      ctx.avisar(
        `A consulta tem ${series.length} séries. Mostrando as ${MAXIMO_DE_SERIES} primeiras: ` +
          'acima disso as posições ficam a menos de 10 px e nenhuma linha é seguível.'
      );
      series = series.slice(0, MAXIMO_DE_SERIES);
    }

    const { posicoes, maiorPosicao } = calcularPosicoes({
      series,
      quantidadeDePeriodos: serie.categorias.length,
      maiorEhMelhor: (config.melhorPosicao || 'maior') === 'maior',
    });

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'bp');
    const area = criarEl('div', { classe: 'bp-area', pai: raiz });

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const modoDosRotulos = config.rotulosNasPontas || 'ambas';
    const maiorNome = series.reduce(
      (a, s) => Math.max(a, larguraAproximada(truncar(s.rotulo, 20), fonte)),
      0
    );
    const margemEsquerda =
      modoDosRotulos === 'ambas' || modoDosRotulos === 'esquerda' ? maiorNome + 14 : 18;
    const margemDireita =
      modoDosRotulos === 'ambas' || modoDosRotulos === 'direita' ? maiorNome + 14 : 18;
    const margemDeCima = fonte + 14;
    const margemDeBaixo = fonte + 14;

    const escalaX = escalaDePonto({
      dominio: serie.categorias.map((c) => c.chave),
      intervalo: [margemEsquerda, Math.max(margemEsquerda + 20, largura - margemDireita)],
      preenchimento: 0,
    });
    const alturaUtil = Math.max(20, altura - margemDeCima - margemDeBaixo);
    const passoY = maiorPosicao > 1 ? alturaUtil / (maiorPosicao - 1) : 0;
    const y = (posicao) => margemDeCima + (posicao - 1) * passoY;

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'bp-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Eixo de períodos ----------
    const saltoDePeriodo = saltoDosPeriodos(serie, escalaX, fonte);
    serie.categorias.forEach((categoria, i) => {
      if (i % saltoDePeriodo !== 0 && i !== serie.categorias.length - 1) return;
      const x = escalaX(categoria.chave);
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'bp-periodo',
        atributos: {
          x,
          y: fonte + 2,
          'text-anchor': i === 0 ? 'start' : i === serie.categorias.length - 1 ? 'end' : 'middle',
          'font-size': fonte,
          fill: tema.textoSuave,
        },
      });
      definirTexto(texto, serie.rotuloDaCategoria(categoria));
    });

    // ---------- Linhas ----------
    const paleta = coresDaPaleta(config.paleta);
    const curva = config.curvaDaLinha || 'monotone';
    const espessura = Number(config.espessuraDaLinha) || 2.5;
    const raioDoPonto = (Number(config.tamanhoDoPonto) || 12) / 2;

    const grupoDasLinhas = criarSvgEl('g', { pai: svg, classe: 'bp-linhas' });

    series.forEach((s, indice) => {
      s.cor = config[`cor_${s.chave}`] || paleta[indice % paleta.length];
      s.posicoes = posicoes[indice];

      const gerador = geradorDeLinha({
        x: (_, i) => escalaX(serie.categorias[i].chave),
        y: (_, i) => y(s.posicoes[i]),
        curva,
        definido: (_, i) => s.posicoes[i] !== null,
      });

      s.caminho = criarSvgEl('path', {
        pai: grupoDasLinhas,
        classe: 'bp-linha',
        atributos: {
          d: gerador(serie.categorias) || '',
          stroke: s.cor,
          'stroke-width': espessura,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
      });

      s.marcas = [];
      serie.categorias.forEach((_, i) => {
        if (s.posicoes[i] === null) return;
        const circulo = criarSvgEl('circle', {
          pai: grupoDasLinhas,
          classe: 'bp-ponto',
          atributos: {
            cx: escalaX(serie.categorias[i].chave),
            cy: y(s.posicoes[i]),
            r: raioDoPonto,
            fill: s.cor,
            stroke: tema.fundo,
            'stroke-width': 1.5,
          },
        });
        s.marcas.push(circulo);

        if (config.mostrarPosicao !== false && raioDoPonto >= 7) {
          const numero = criarSvgEl('text', {
            pai: grupoDasLinhas,
            classe: 'bp-ponto',
            atributos: {
              x: escalaX(serie.categorias[i].chave),
              y: y(s.posicoes[i]),
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'font-size': Math.max(7, raioDoPonto),
              'font-weight': '600',
              fill: tema.fundo,
            },
          });
          definirTexto(numero, String(s.posicoes[i]));
          s.marcas.push(numero);
        }
      });

      // --- Nomes nas pontas ---
      const primeira = s.posicoes.findIndex((p) => p !== null);
      const ultima = s.posicoes.length - 1 - [...s.posicoes].reverse().findIndex((p) => p !== null);

      if ((modoDosRotulos === 'ambas' || modoDosRotulos === 'esquerda') && primeira >= 0) {
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'bp-rotulo',
          atributos: {
            x: escalaX(serie.categorias[primeira].chave) - raioDoPonto - 5,
            y: y(s.posicoes[primeira]),
            'text-anchor': 'end',
            'dominant-baseline': 'central',
            'font-size': fonte,
            fill: tema.texto,
          },
        });
        definirTexto(texto, truncar(s.rotulo, 20));
        s.marcas.push(texto);
      }
      if ((modoDosRotulos === 'ambas' || modoDosRotulos === 'direita') && primeira >= 0) {
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'bp-rotulo',
          atributos: {
            x: escalaX(serie.categorias[ultima].chave) + raioDoPonto + 5,
            y: y(s.posicoes[ultima]),
            'dominant-baseline': 'central',
            'font-size': fonte,
            fill: tema.texto,
          },
        });
        definirTexto(texto, truncar(s.rotulo, 20));
        s.marcas.push(texto);
      }
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'bp-nota', pai: area });
    nota.style.color = tema.textoSuave;
    const comLacunas = series.some((s) => s.posicoes.some((p) => p === null));
    definirTexto(
      nota,
      [
        `${series.length} séries · ${serie.categorias.length} períodos`,
        'o eixo é a POSIÇÃO, não o valor: a distância do 1º ao 2º é desenhada igual à do 9º ao 10º',
        'o ranking apaga a magnitude — veja o valor no tooltip antes de concluir',
        comLacunas ? 'linhas cortadas marcam períodos sem dado (não há posição inventada)' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const destacar = (alvo) => {
      if (config.destacarNoHover === false) return;
      for (const s of series) {
        const ativo = !alvo || s === alvo;
        s.caminho.setAttribute('opacity', ativo ? 1 : 0.12);
        for (const marca of s.marcas) marca.setAttribute('opacity', ativo ? 1 : 0.12);
      }
    };

    ctx.eventos.on(area, 'pointermove', (ev) => {
      const caixa = area.getBoundingClientRect();
      const px = ev.clientX - caixa.left;
      const py = ev.clientY - caixa.top;

      const i = indiceDoPeriodo(px, serie, escalaX);
      const alvo = serieMaisProxima({ series, indice: i, py, y, tolerancia: Math.max(12, passoY / 2) });

      destacar(alvo);

      if (!tooltip) return;
      if (!alvo || i < 0) {
        tooltip.esconder();
        return;
      }
      const valor = alvo.valores[i];
      tooltip.mostrar(
        {
          titulo: alvo.rotulo,
          linhas: [
            { rotulo: 'Período', valor: serie.rotuloDaCategoria(serie.categorias[i]), cor: alvo.cor },
            {
              rotulo: 'Posição',
              valor: alvo.posicoes[i] === null ? 'sem dado neste período' : `${alvo.posicoes[i]}º de ${maiorPosicao}`,
            },
            // O valor vem SEMPRE: é ele que diz se a troca de posição foi
            // um terremoto ou um empate técnico.
            {
              rotulo: serie.matriz.medida ? serie.matriz.medida.rotuloCurto : 'Valor',
              valor: valor === null || !Number.isFinite(valor) ? '—' : serie.formatarValor(valor),
            },
            ...linhasDeVariacao(alvo, i, maiorPosicao),
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      destacar(null);
      if (tooltip) tooltip.esconder();
    });
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

function linhasDeVariacao(serie, indice, maiorPosicao) {
  const atual = serie.posicoes[indice];
  if (atual === null) return [];

  const primeira = serie.posicoes.find((p) => p !== null);
  const saida = [];

  for (let i = indice - 1; i >= 0; i--) {
    if (serie.posicoes[i] === null) continue;
    const diferenca = serie.posicoes[i] - atual;
    saida.push({
      rotulo: 'Desde o período anterior',
      valor: diferenca === 0 ? 'manteve' : diferenca > 0 ? `subiu ${diferenca}` : `caiu ${-diferenca}`,
    });
    break;
  }

  if (primeira !== undefined && primeira !== atual) {
    const diferenca = primeira - atual;
    saida.push({
      rotulo: 'Desde o início',
      valor: `${diferenca > 0 ? 'subiu' : 'caiu'} ${Math.abs(diferenca)} (de ${primeira}º para ${atual}º de ${maiorPosicao})`,
    });
  }
  return saida;
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

function serieMaisProxima({ series, indice, py, y, tolerancia }) {
  if (indice < 0) return null;
  let melhor = null;
  let menor = Infinity;
  for (const s of series) {
    const posicao = s.posicoes[indice];
    if (posicao === null) continue;
    const d = Math.abs(y(posicao) - py);
    if (d < menor) {
      menor = d;
      melhor = s;
    }
  }
  return menor <= tolerancia ? melhor : null;
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

/**
 * Posição de cada série em cada período.
 *
 * Duas decisões com consequência:
 *
 * - **Empates desempatam pelo NOME, não pela ordem da consulta.** Duas
 *   séries com o mesmo valor precisam de uma ordem definida; usar a ordem
 *   em que o Looker devolveu faria o ranking TREMER entre renderizações da
 *   mesma consulta, e um bump chart que se mexe sozinho é pior que
 *   nenhum.
 * - **Período sem valor não recebe posição.** A linha corta ali. Ranquear
 *   um valor que não existe (como zero, ou como "último") inventaria uma
 *   queda que não aconteceu.
 *
 * @returns {{posicoes: Array<Array<number|null>>, maiorPosicao: number}}
 */
export function calcularPosicoes({ series, quantidadeDePeriodos, maiorEhMelhor = true }) {
  const posicoes = series.map(() => new Array(quantidadeDePeriodos).fill(null));
  let maiorPosicao = 1;

  for (let periodo = 0; periodo < quantidadeDePeriodos; periodo++) {
    const participantes = [];
    series.forEach((s, indice) => {
      const valor = s.valores[periodo];
      if (valor === null || !Number.isFinite(valor)) return;
      participantes.push({ indice, valor, rotulo: s.rotulo || String(indice) });
    });

    participantes.sort((a, b) => {
      if (a.valor !== b.valor) return maiorEhMelhor ? b.valor - a.valor : a.valor - b.valor;
      return a.rotulo.localeCompare(b.rotulo, 'pt-BR');
    });

    participantes.forEach((p, i) => {
      posicoes[p.indice][periodo] = i + 1;
    });
    maiorPosicao = Math.max(maiorPosicao, participantes.length);
  }

  return { posicoes, maiorPosicao };
}
