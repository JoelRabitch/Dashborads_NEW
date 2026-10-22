/**
 * arvores_multiplas — "Múltiplas Árvores".
 *
 * Uma árvore pequena por ramo de primeiro nível, lado a lado numa grade.
 * Serve para comparar a FORMA de cada ramo — qual é mais profundo, qual
 * concentra o valor numa folha só — coisa que a árvore radial única não
 * mostra bem quando há muitos ramos.
 *
 * Cada mini-árvore usa o layout horizontal (da esquerda para a direita),
 * que aproveita melhor uma célula larga e baixa do que um círculo.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { hierarchy as d3Hierarchy } from 'd3-hierarchy';
import {
  construirHierarquia,
  opcoesDeHierarquia,
  opcoesDinamicasDeHierarquia,
} from '../../core/hierarquia.js';
import {
  montarOpcoes,
  comDefaults,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';
import {
  CSS_ARVORE,
  opcoesDeArvore,
  layoutHorizontal,
  desenharArvore,
  criarCoresDaArvore,
} from '../_arvore/index.js';
import { montarLinhas } from '../arvore_radial/index.js';

/** Acima disso cada árvore fica pequena demais para dizer alguma coisa. */
const MAXIMO_DE_ARVORES = 24;

export default defineViz({
  id: 'arvores_multiplas',
  label: 'Múltiplas Árvores',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeHierarquia(),
      opcoesDeArvore({ layoutPadrao: 'cluster' }),
      {
        colunasDaGrade: {
          type: 'number',
          label: 'Colunas (0 = ajustar ao tamanho)',
          section: 'Grade',
          display: 'range',
          min: 0,
          max: 8,
          step: 1,
          default: 0,
        },
        larguraMinimaDaArvore: {
          type: 'number',
          label: 'Largura mínima de cada árvore (px)',
          section: 'Grade',
          display: 'range',
          min: 120,
          max: 600,
          step: 20,
          default: 260,
        },
        alturaDaArvore: {
          type: 'number',
          label: 'Altura de cada árvore (px)',
          section: 'Grade',
          display: 'range',
          min: 80,
          max: 600,
          step: 20,
          default: 200,
        },
        escalaPorArvore: {
          type: 'boolean',
          label: 'Cada árvore com o próprio tamanho de nó (deixa de ser comparável)',
          section: 'Grade',
          default: false,
        },
      }
    ),
    {
      // Em árvore pequena só cabe o nome da folha.
      mostrarRotulosInternos: false,
      tamanhoDoNo: 3,
    }
  ),
  exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeHierarquia(modelo);
  },

  render(ctx) {
    const { modelo, config, tema, raiz: elementoRaiz, largura } = ctx;

    const { raiz, avisos, campoDoValor, quantidadeDeNos } = construirHierarquia(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (!raiz || quantidadeDeNos < 2) {
      ctx.mostrarVazio(
        'Não consegui montar uma hierarquia. Use várias dimensões (uma por nível) ' +
          'ou um par de campos id/superior, e confira a seção Dados.'
      );
      return;
    }

    let ramos = raiz.children || [];
    if (!ramos.length) {
      ctx.mostrarVazio('A hierarquia tem um nó só: não há ramos para comparar.');
      return;
    }

    if (ramos.length > MAXIMO_DE_ARVORES) {
      ctx.avisar(
        `A hierarquia tem ${ramos.length} ramos; mostrando os ${MAXIMO_DE_ARVORES} maiores para as árvores continuarem legíveis.`
      );
      ramos = ramos.slice(0, MAXIMO_DE_ARVORES);
    }

    ctx.limparRaiz();
    injetarEstilo(elementoRaiz, CSS_ARVORE, 'av');
    const grade = criarEl('div', { classe: 'md-grade', pai: elementoRaiz });
    grade.style.display = 'flex';
    grade.style.flexWrap = 'wrap';
    grade.style.alignContent = 'flex-start';
    grade.style.width = '100%';
    grade.style.height = '100%';
    grade.style.overflow = 'auto';

    const larguraMinima = Number(config.larguraMinimaDaArvore) || 260;
    const colunasPedidas = Number(config.colunasDaGrade) || 0;
    const colunas =
      colunasPedidas > 0
        ? colunasPedidas
        : Math.max(1, Math.min(ramos.length, Math.floor(largura / larguraMinima) || 1));
    const larguraDaCelula = Math.max(120, Math.floor(largura / colunas));
    const alturaDaCelula = Number(config.alturaDaArvore) || 200;

    // A cor sai da árvore INTEIRA, não de cada ramo: assim um ramo tem a
    // mesma cor aqui e na árvore radial do mesmo dado.
    const cores = criarCoresDaArvore(raiz, config, tema);
    const formatar = formatadorDeValueFormat(campoDoValor && campoDoValor.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 0,
    });

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(elementoRaiz, tema);
    ctx.estado.tooltip = tooltip;

    // Referência comum do tamanho dos nós: sem ela, a maior folha de cada
    // ramo fica do mesmo tamanho e a comparação entre ramos some.
    const maiorGlobal = raiz.value || 1;
    const espacoDoTitulo = 18;

    for (const ramo of ramos) {
      const celula = criarEl('div', { pai: grade });
      celula.style.width = `${larguraDaCelula}px`;
      celula.style.height = `${alturaDaCelula}px`;
      celula.style.boxSizing = 'border-box';

      const svg = criarSvgEl('svg', {
        pai: celula,
        atributos: {
          width: larguraDaCelula,
          height: alturaDaCelula,
          viewBox: `0 0 ${larguraDaCelula} ${alturaDaCelula}`,
        },
      });

      const titulo = criarSvgEl('text', {
        pai: svg,
        classe: 'av-titulo-arvore',
        atributos: {
          x: 8,
          y: 12,
          'font-size': Math.max(9, tema.tamanhoBase - 1),
          fill: cores(ramo),
        },
      });
      definirTexto(
        titulo,
        `${truncar(ramo.data.rotulo, 22)} (${formatar(ramo.value || 0)})`
      );

      // Cada ramo vira a raiz de uma árvore própria, senão o layout do d3
      // reserva espaço para os irmãos que não estão nesta célula.
      const subRaiz = d3Hierarchy(ramo.data, (no) => no.filhos)
        .sum((no) => (no.filhos && no.filhos.length ? 0 : no.valor || 0))
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      const reservaDaDireita = config.mostrarRotulosDeFolha === false ? 12 : larguraDaCelula * 0.38;
      layoutHorizontal(subRaiz, {
        largura: Math.max(20, larguraDaCelula - 24 - reservaDaDireita),
        altura: Math.max(20, alturaDaCelula - espacoDoTitulo - 12),
        config,
      });

      desenharArvore({
        svg,
        raiz: subRaiz,
        modo: 'horizontal',
        deslocamento: { x: 12, y: espacoDoTitulo },
        config,
        valorDeReferencia: config.escalaPorArvore ? null : maiorGlobal,
        tema,
        formatar,
        cores: () => cores(ramo),
        compacto: true,
        aoInteragir(elemento, no) {
          if (tooltip) {
            ctx.eventos.on(elemento, 'pointerenter', (ev) => {
              tooltip.mostrar(
                {
                  titulo: `${ramo.data.rotulo} › ${no.data.rotulo}`,
                  linhas: montarLinhas(no, campoDoValor, formatar),
                },
                ev.clientX,
                ev.clientY
              );
            });
            ctx.eventos.on(elemento, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
            ctx.eventos.on(elemento, 'pointerleave', () => tooltip.esconder());
          }
          ctx.eventos.on(elemento, 'click', (ev) => {
            if (no.data.indiceDaLinha < 0 || !no.data.campo) return;
            const celulaDoLooker = modelo.celula(modelo.linhas[no.data.indiceDaLinha], no.data.campo.nome);
            if (celulaDoLooker && ctx.ponte.temDrill(celulaDoLooker)) {
              ctx.ponte.abrirDrill(celulaDoLooker, ev);
            }
          });
        },
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});
