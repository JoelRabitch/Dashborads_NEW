/**
 * arvore_radial — "Árvore Radial".
 *
 * A hierarquia inteira num círculo: a raiz no centro, cada nível num anel
 * mais externo e as folhas na borda, com os nomes acompanhando o raio.
 *
 * A hierarquia vem de `core/hierarquia.js`, que aceita tanto várias
 * dimensões aninhadas quanto pares id/superior. O desenho vem de
 * `../_arvore/`.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { formatadorDeValueFormat } from '../../core/format.js';
import {
  construirHierarquia,
  opcoesDeHierarquia,
  opcoesDinamicasDeHierarquia,
} from '../../core/hierarquia.js';
import {
  montarOpcoes,
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
  layoutRadial,
  desenharArvore,
  criarCoresDaArvore,
} from '../_arvore/index.js';

export default defineViz({
  id: 'arvore_radial',
  label: 'Árvore Radial',
  opcoes: montarOpcoes(
    blocoDeCores({ comEscalaPorValor: false }),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado(),
    opcoesDeHierarquia(),
    opcoesDeArvore({ layoutPadrao: 'cluster' }),
    {
      margemParaRotulos: {
        type: 'number',
        label: 'Espaço reservado para os nomes das folhas (px)',
        section: 'Árvore',
        display: 'range',
        min: 0,
        max: 260,
        step: 10,
        default: 110,
      },
    }
  ),
  exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeHierarquia(modelo);
  },

  render(ctx) {
    const { modelo, config, tema, raiz: elementoRaiz, largura, altura } = ctx;

    const { raiz, avisos, campoDoValor, quantidadeDeNos } = construirHierarquia(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (!raiz || quantidadeDeNos < 2) {
      ctx.mostrarVazio(
        'Não consegui montar uma hierarquia. Use várias dimensões (uma por nível) ' +
          'ou um par de campos id/superior, e confira a seção Dados.'
      );
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(elementoRaiz, CSS_ARVORE, 'av');
    const area = criarEl('div', { classe: 'av-area', pai: elementoRaiz });

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const margem = Number(config.margemParaRotulos);
    const reservado = Number.isFinite(margem) ? margem : 110;
    const raioMaximo = Math.max(10, Math.min(largura, altura) / 2 - reservado);

    layoutRadial(raiz, { raioMaximo, config });

    const cores = criarCoresDaArvore(raiz, config, tema);
    const formatar = formatadorDeValueFormat(campoDoValor && campoDoValor.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 0,
    });

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(elementoRaiz, tema);
    ctx.estado.tooltip = tooltip;

    const { nos } = desenharArvore({
      svg,
      raiz,
      modo: 'radial',
      deslocamento: { x: largura / 2, y: altura / 2 },
      config,
      tema,
      formatar,
      cores,
      aoInteragir(elemento, no) {
        if (tooltip) {
          ctx.eventos.on(elemento, 'pointerenter', (ev) => {
            tooltip.mostrar(
              { titulo: no.data.rotulo, linhas: montarLinhas(no, campoDoValor, formatar) },
              ev.clientX,
              ev.clientY
            );
          });
          ctx.eventos.on(elemento, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
          ctx.eventos.on(elemento, 'pointerleave', () => tooltip.esconder());
        }

        ctx.eventos.on(elemento, 'click', (ev) => {
          if (no.data.indiceDaLinha < 0 || !no.data.campo) return;
          const celula = modelo.celula(modelo.linhas[no.data.indiceDaLinha], no.data.campo.nome);
          if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
        });
      },
    });

    if (!nos.length) ctx.avisar('Nenhum nó foi desenhado: confira o tamanho do nó na seção Árvore.');
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/** Linhas do tooltip de um nó. */
export function montarLinhas(no, campoDoValor, formatar) {
  const linhas = [];
  if (campoDoValor) linhas.push({ rotulo: campoDoValor.rotuloCurto, valor: formatar(no.value || 0) });
  linhas.push({ rotulo: 'Nível', valor: String(no.depth) });
  if (no.children && no.children.length) {
    linhas.push({ rotulo: 'Filhos diretos', valor: String(no.children.length) });
    linhas.push({ rotulo: 'Descendentes', valor: String(no.descendants().length - 1) });
  }
  if (no.parent && no.parent.value) {
    linhas.push({
      rotulo: `Dentro de ${no.parent.data.rotulo}`,
      valor: `${((100 * (no.value || 0)) / no.parent.value).toFixed(1)}%`,
    });
  }
  return linhas;
}
