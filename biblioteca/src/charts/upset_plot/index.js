/**
 * upset_plot — "UpSet Plot".
 *
 * A alternativa ao diagrama de Venn quando há mais de 5 conjuntos (onde o
 * Venn deixa de existir) ou quando as interseções pequenas importam: uma
 * barra por interseção, ordenada por tamanho, e embaixo uma matriz de
 * pontos dizendo QUAIS conjuntos formam cada uma.
 *
 * Reaproveita o leitor de conjuntos do `diagrama_venn`, que já entende os
 * três formatos de entrada (uma linha por região, item × conjunto, ou
 * colunas sim/não).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { criarFormatadorNumerico, formatarPercentual, truncar } from '../../core/format.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import {
  montarOpcoes,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';
import { lerConjuntos, rotuloDaRegiao } from '../diagrama_venn/dados.js';

const CSS = `
.up-area{position:relative;width:100%;height:100%;overflow:hidden;}
.up-barra{cursor:pointer;transition:opacity .15s ease;}
.up-apagada{opacity:.25;}
.up-texto{pointer-events:none;}
.up-ponto{pointer-events:none;}
.up-faixa{pointer-events:none;}
@media (prefers-reduced-motion: reduce){.up-barra{transition:none;}}
`;

export default defineViz({
  id: 'upset_plot',
  label: 'UpSet Plot',
  opcoes: montarOpcoes(
    blocoDeCores({ comEscalaPorValor: false }),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado(),
    {
      formatoDosDados: {
        type: 'string',
        label: 'Como os dados estão organizados',
        section: 'Dados',
        display: 'select',
        default: 'auto',
        values: listaDeValores([
          { rotulo: 'Detectar sozinho', valor: 'auto' },
          { rotulo: 'Uma linha por região ("A", "A,B")', valor: 'regioes' },
          { rotulo: 'Uma linha por item e conjunto', valor: 'itemConjunto' },
          { rotulo: 'Colunas sim/não (uma por conjunto)', valor: 'booleanas' },
        ]),
      },
      separadorDeConjuntos: {
        type: 'string',
        label: 'Separador dos conjuntos na dimensão',
        section: 'Dados',
        default: ',',
      },
      medirPor: {
        type: 'string',
        label: 'O número mostrado é',
        section: 'Dados',
        display: 'select',
        default: 'itens',
        values: listaDeValores([
          { rotulo: 'Contagem de itens', valor: 'itens' },
          { rotulo: 'Soma da medida', valor: 'medida' },
        ]),
      },
      maximoDeConjuntos: {
        type: 'number',
        label: 'Máximo de conjuntos',
        section: 'Dados',
        display: 'range',
        min: 2,
        max: 20,
        step: 1,
        default: 12,
      },
      maximoDeIntersecoes: {
        type: 'number',
        label: 'Quantas interseções mostrar (as maiores)',
        section: 'Dados',
        display: 'range',
        min: 3,
        max: 60,
        step: 1,
        default: 20,
      },
      ordenarIntersecoes: {
        type: 'string',
        label: 'Ordem das barras',
        section: 'Dados',
        display: 'select',
        default: 'tamanho',
        values: listaDeValores([
          { rotulo: 'Por tamanho (maior primeiro)', valor: 'tamanho' },
          { rotulo: 'Por quantidade de conjuntos', valor: 'grau' },
        ]),
      },
      esconderIntersecoesVazias: {
        type: 'boolean',
        label: 'Esconder interseções sem nenhum item',
        section: 'Dados',
        default: true,
      },
      alturaDaMatriz: {
        type: 'number',
        label: 'Altura da matriz de pontos (% do gráfico)',
        section: 'Formato',
        display: 'range',
        min: 15,
        max: 70,
        step: 5,
        default: 40,
      },
      mostrarTotaisDosConjuntos: {
        type: 'boolean',
        label: 'Mostrar o total de cada conjunto à esquerda',
        section: 'Formato',
        default: true,
      },
      mostrarValorNaBarra: {
        type: 'boolean',
        label: 'Escrever o valor acima da barra',
        section: 'Rótulos',
        default: true,
      },
      mostrarPercentual: {
        type: 'boolean',
        label: 'Mostrar o percentual do total',
        section: 'Rótulos',
        default: false,
      },
    }
  ),
  exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const { conjuntos, regioes, totalPorConjunto, avisos, unidade } = lerConjuntos(modelo, config, { maximoAbsoluto: 20 });
    for (const aviso of avisos) ctx.avisar(aviso);

    if (conjuntos.length < 2) {
      ctx.mostrarVazio(
        'O UpSet precisa de pelo menos 2 conjuntos. ' +
          'Confira a opção "Como os dados estão organizados" na seção Dados.'
      );
      return;
    }

    // ---------- Interseções ----------
    let intersecoes = Array.from(regioes.entries()).map(([mascara, valor]) => ({
      mascara,
      valor,
      grau: contarBits(mascara),
      rotulo: rotuloDaRegiao(mascara, conjuntos),
    }));

    if (config.esconderIntersecoesVazias !== false) {
      intersecoes = intersecoes.filter((i) => i.valor > 0);
    }

    if (!intersecoes.length) {
      ctx.mostrarVazio('Nenhuma interseção tem valor.');
      return;
    }

    intersecoes.sort(
      config.ordenarIntersecoes === 'grau'
        ? (a, b) => a.grau - b.grau || b.valor - a.valor
        : (a, b) => b.valor - a.valor
    );

    const limite = Number(config.maximoDeIntersecoes) || 20;
    if (intersecoes.length > limite) {
      ctx.avisar(
        `A consulta tem ${intersecoes.length} interseções; mostrando as ${limite} maiores.`
      );
      intersecoes = intersecoes.slice(0, limite);
    }

    // Os conjuntos aparecem na matriz ordenados pelo próprio total: assim
    // as linhas de cima são as que mais importam.
    const ordemDosConjuntos = conjuntos
      .map((conjunto, i) => ({ conjunto, indice: i, total: totalPorConjunto.get(i) || 0 }))
      .sort((a, b) => b.total - a.total);

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'up');
    const area = criarEl('div', { classe: 'up-area', pai: raiz });
    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const formatar = criarFormatadorNumerico({ estilo: 'auto', casas: 0 });
    const paleta = coresDaPaleta(config.paleta);
    const corDaBarra = config.corUnica || paleta[0] || tema.destaque;

    // ---------- Geometria ----------
    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const larguraDosNomes = config.mostrarTotaisDosConjuntos === false
      ? Math.min(140, largura * 0.2)
      : Math.min(220, largura * 0.3);
    const fracaoDaMatriz = Math.max(0.15, Math.min(0.7, (Number(config.alturaDaMatriz) || 40) / 100));

    const margemDoTopo = config.mostrarValorNaBarra === false ? 10 : fonte + 12;
    const alturaDaMatriz = (altura - margemDoTopo - 10) * fracaoDaMatriz;
    const alturaDasBarras = altura - margemDoTopo - alturaDaMatriz - 10;

    const xDasBarras = larguraDosNomes + 8;
    const larguraUtil = Math.max(20, largura - xDasBarras - 10);
    const passo = larguraUtil / intersecoes.length;
    const larguraDaBarra = Math.max(2, passo * 0.72);

    const alturaDaLinha = alturaDaMatriz / Math.max(1, ordemDosConjuntos.length);
    const maior = Math.max(...intersecoes.map((i) => i.valor));
    const totalGeral = intersecoes.reduce((a, i) => a + i.valor, 0);

    // ---------- Faixas da matriz (ajudam o olho a seguir a linha) ----------
    ordemDosConjuntos.forEach((item, linha) => {
      if (linha % 2) return;
      criarSvgEl('rect', {
        pai: svg,
        classe: 'up-faixa',
        atributos: {
          x: 0,
          y: margemDoTopo + alturaDasBarras + linha * alturaDaLinha,
          width: largura,
          height: alturaDaLinha,
          fill: comOpacidade(tema.textoSuave, 0.07),
        },
      });
    });

    // ---------- Nomes e totais dos conjuntos ----------
    ordemDosConjuntos.forEach((item, linha) => {
      const y = margemDoTopo + alturaDasBarras + linha * alturaDaLinha + alturaDaLinha / 2;
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'up-texto',
        atributos: {
          x: larguraDosNomes,
          y,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      const nome = truncar(item.conjunto.nome, Math.floor(larguraDosNomes / (fonte * 0.6)));
      definirTexto(
        texto,
        config.mostrarTotaisDosConjuntos === false ? nome : `${nome}  ${formatar(item.total)}`
      );
    });

    // ---------- Barras e matriz ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;
    const barras = [];

    intersecoes.forEach((intersecao, coluna) => {
      const cx = xDasBarras + coluna * passo + passo / 2;
      const alturaDaBarra = maior > 0 ? (intersecao.valor / maior) * alturaDasBarras : 0;
      const y = margemDoTopo + alturaDasBarras - alturaDaBarra;

      const barra = criarSvgEl('rect', {
        pai: svg,
        classe: 'up-barra',
        atributos: {
          x: cx - larguraDaBarra / 2,
          y,
          width: larguraDaBarra,
          height: Math.max(0, alturaDaBarra),
          fill: corDaBarra,
          rx: 1,
        },
      });
      barras.push(barra);

      if (config.mostrarValorNaBarra !== false && passo > fonte * 1.6) {
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'up-texto',
          atributos: {
            x: cx,
            y: y - 3,
            'text-anchor': 'middle',
            'font-size': Math.min(fonte, passo * 0.5),
            fill: tema.textoSuave,
          },
        });
        definirTexto(
          texto,
          config.mostrarPercentual && totalGeral
            ? `${formatar(intersecao.valor)} · ${formatarPercentual(intersecao.valor / totalGeral, 0)}`
            : formatar(intersecao.valor)
        );
      }

      // --- Pontos da matriz ---
      const linhasAtivas = [];
      ordemDosConjuntos.forEach((item, linha) => {
        const participa = (intersecao.mascara & (1 << item.indice)) !== 0;
        const cy = margemDoTopo + alturaDasBarras + linha * alturaDaLinha + alturaDaLinha / 2;
        if (participa) linhasAtivas.push(cy);
        criarSvgEl('circle', {
          pai: svg,
          classe: 'up-ponto',
          atributos: {
            cx,
            cy,
            r: Math.max(2, Math.min(passo * 0.22, alturaDaLinha * 0.3)),
            fill: participa ? corDaBarra : comOpacidade(tema.textoSuave, 0.22),
          },
        });
      });

      // A linha que liga os pontos é o que deixa a interseção legível de
      // relance: sem ela o olho precisa conferir ponto a ponto.
      if (linhasAtivas.length > 1) {
        criarSvgEl('line', {
          pai: svg,
          classe: 'up-ponto',
          atributos: {
            x1: cx,
            x2: cx,
            y1: Math.min(...linhasAtivas),
            y2: Math.max(...linhasAtivas),
            stroke: corDaBarra,
            'stroke-width': Math.max(1.5, passo * 0.1),
          },
        });
      }

      if (tooltip) {
        ctx.eventos.on(barra, 'pointerenter', (ev) => {
          barras.forEach((outra, i) => outra.classList.toggle('up-apagada', i !== coluna));
          const linhas = [
            { rotulo: unidade || 'Valor', valor: formatar(intersecao.valor), cor: corDaBarra },
            { rotulo: 'Conjuntos', valor: String(intersecao.grau) },
          ];
          if (totalGeral) {
            linhas.push({ rotulo: 'Do total', valor: formatarPercentual(intersecao.valor / totalGeral, 1) });
          }
          tooltip.mostrar({ titulo: intersecao.rotulo, linhas }, ev.clientX, ev.clientY);
        });
        ctx.eventos.on(barra, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(barra, 'pointerleave', () => {
          barras.forEach((outra) => outra.classList.remove('up-apagada'));
          tooltip.esconder();
        });
      }
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/** Quantos conjuntos participam de uma máscara. */
function contarBits(mascara) {
  let n = 0;
  let m = mascara;
  while (m) {
    n += m & 1;
    m >>= 1;
  }
  return n;
}
