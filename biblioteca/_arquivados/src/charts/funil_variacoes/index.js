/**
 * funil_variacoes — "Funis (Estilos)".
 *
 * Um funil só, em cinco estilos: clássico (trapézios), pirâmide, barras
 * centralizadas, barras à esquerda e área contínua. O desenho mora em
 * `../_funil/`, compartilhado com `funil_comparativo`.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { formatarPercentual } from '../../core/format.js';
import {
  montarOpcoes,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  opcoesDeCorPorItem,
} from '../../core/options-kit.js';
import { coresDaPaleta } from '../../core/theme.js';
import {
  CSS_FUNIL,
  opcoesDeFunil,
  lerEtapas,
  calcularConversoes,
  desenharFunil,
  resolverCoresDasEtapas,
  formatadorDoFunil,
} from '../_funil/index.js';

export default defineViz({
  id: 'funil_variacoes',
  label: 'Funis (Estilos)',
  opcoes: montarOpcoes(
    blocoDeCores(),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado(),
    opcoesDeFunil({ estiloPadrao: 'classico' })
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo, config }) {
    const { etapas } = lerEtapas(modelo, config);
    if (!etapas.length) return {};
    return opcoesDeCorPorItem(
      etapas.map((e) => ({ chave: e.chave, rotulo: e.rotulo })),
      { secao: 'Cores', cores: coresDaPaleta(config.paleta) }
    );
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const { etapas: brutas, medida, avisos } = lerEtapas(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (brutas.length < 2) {
      ctx.mostrarVazio(
        'O funil precisa de pelo menos duas etapas. Use uma dimensão com as etapas ' +
          'e uma medida, ou várias medidas (uma por etapa).'
      );
      return;
    }

    const etapas = calcularConversoes(brutas);

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_FUNIL, 'fn');
    const area = criarEl('div', { classe: 'fn-area', pai: raiz });

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const formatar = formatadorDoFunil(medida, config);
    const cores = resolverCoresDasEtapas(etapas, config, tema);

    // Sobra espaço à esquerda para o nome da etapa e à direita para a
    // conversão; ambos ficam FORA do funil de propósito.
    const margemEsquerda = config.mostrarNomeDaEtapa === false ? 12 : Math.min(160, largura * 0.22);
    const margemDireita = config.mostrarConversao === 'nenhuma' ? 12 : Math.min(120, largura * 0.18);

    const caixa = {
      x: margemEsquerda,
      y: 10,
      largura: Math.max(20, largura - margemEsquerda - margemDireita),
      altura: Math.max(20, altura - 20),
    };

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const desenhadas = desenharFunil({
      svg,
      caixa,
      etapas,
      cores,
      config,
      tema,
      formatar,
      aoInteragir(elemento, etapa, cor) {
        if (tooltip) {
          ctx.eventos.on(elemento, 'pointerenter', (ev) => {
            const linhas = [
              { rotulo: medida ? medida.rotuloCurto : 'Valor', valor: formatar(etapa.valor), cor },
            ];
            if (etapa.conversaoDaAnterior !== null) {
              linhas.push({ rotulo: 'Da etapa anterior', valor: formatarPercentual(etapa.conversaoDaAnterior, 1) });
            }
            if (etapa.conversaoDaPrimeira !== null) {
              linhas.push({ rotulo: 'Da primeira etapa', valor: formatarPercentual(etapa.conversaoDaPrimeira, 1) });
            }
            if (etapa.perdaDaAnterior !== null) {
              linhas.push({ rotulo: 'Perdido no caminho', valor: formatar(etapa.perdaDaAnterior) });
            }
            tooltip.mostrar({ titulo: etapa.rotulo, linhas }, ev.clientX, ev.clientY);
          });
          ctx.eventos.on(elemento, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
          ctx.eventos.on(elemento, 'pointerleave', () => tooltip.esconder());
        }

        if (etapa.indiceDaLinha >= 0 && etapa.campo) {
          ctx.eventos.on(elemento, 'click', (ev) => {
            const celula = modelo.celula(modelo.linhas[etapa.indiceDaLinha], etapa.campo.nome);
            if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
          });
        }
      },
    });

    if (!desenhadas.length) ctx.avisar('Nenhuma etapa pôde ser desenhada.');
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});
