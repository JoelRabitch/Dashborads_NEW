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
 *
 * Campos: uma dimensão por nível (ou um par id/superior) e, opcional, uma
 * medida para o tamanho dos nós (seção Dados).
 *
 * Opções (correções v2): o bloco "Rótulos" inteiro vale para os nomes dos
 * nós (ver `textoDoRotuloDoNo` em _arvore); a aba Cores vale para os nós
 * (paleta com "Inverter ordem", "Cor dos nós" por ramo/nível/única,
 * opacidade e contorno); as ligações usam a cor de borda do tema. O
 * tooltip é o único do gráfico (`ctx.tooltip()`), com o valor no formato
 * do campo; o clique segue a "Ação do clique" (drill / fixar / nenhuma).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
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
  montarLinhas,
} from '../_arvore/index.js';

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
    // Valor derivado (soma do ramo): formato do campo no Looker, nunca o
    // número cru — e independente das opções de RÓTULO (que valem só para
    // o texto desenhado).
    const valueFormat = campoDoValor ? campoDoValor.valueFormat : undefined;
    const formatar = formatadorDeValueFormat(valueFormat);

    // Tooltip ÚNICO do gráfico (o núcleo cria uma vez e esconde a cada redesenho).
    const tooltip = ctx.tooltip();

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

      // Cor de cada nó vem do nó equivalente na árvore INTEIRA: assim "Cor
      // dos nós" por nível funciona (antes toda a mini-árvore recebia a cor
      // do ramo, e "por nível" não mudava nada).
      const globalPorDados = new Map(ramo.descendants().map((n) => [n.data, n]));
      const corDoNo = (no) => cores(globalPorDados.get(no.data) || ramo);

      const reservaDaDireita = config.mostrarRotulosDeFolha === false || config.mostrarRotulos === false ? 12 : larguraDaCelula * 0.38;
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
        valueFormat,
        totalGeral: maiorGlobal,
        cores: corDoNo,
        compacto: true,
        aoInteragir(elemento, no) {
          const conteudo = () => ({
            titulo: `${ramo.data.rotulo} › ${no.data.rotulo}`,
            linhas: montarLinhas(no, campoDoValor, formatar),
          });
          if (tooltip) {
            ctx.eventos.on(elemento, 'pointerenter', (ev) => tooltip.mostrar(conteudo(), ev.clientX, ev.clientY));
            ctx.eventos.on(elemento, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
            ctx.eventos.on(elemento, 'pointerleave', () => tooltip.esconder());
          }
          // "Ação do clique": drill se a célula tem links, senão fixa o
          // tooltip (ou nada, conforme o painel). Expandir/colapsar fica
          // para a Fase C.
          ctx.eventos.on(elemento, 'click', (ev) => {
            const celulaDoLooker =
              no.data.indiceDaLinha >= 0 && no.data.campo
                ? modelo.celula(modelo.linhas[no.data.indiceDaLinha], no.data.campo.nome)
                : null;
            ctx.cliqueNoItem(ev, celulaDoLooker, conteudo());
          });
        },
      });
    }
  },
});
