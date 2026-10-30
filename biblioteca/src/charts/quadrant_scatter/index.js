/**
 * quadrant_scatter — "Dispersão com Quadrantes".
 *
 * Duas medidas nos eixos, uma dimensão identificando cada ponto, e duas
 * divisórias (média, mediana, ponto médio, zero ou valor fixo) que partem o
 * plano em quatro quadrantes nomeáveis.
 *
 * O desenho em si mora em `../_quadrantes/`, compartilhado com `matriz_2x2`
 * e `matriz_bcg`. Aqui ficam só as convenções deste gráfico.
 *
 * Rótulos, cores, contorno, forma dos pontos, tooltip e clique seguem os
 * módulos únicos do núcleo (correções v2) — ver o cabeçalho da base.
 * Em "O que mostrar no rótulo", o padrão mostra o NOME do ponto; há
 * opções para mostrar o valor do eixo Y, do eixo X ou os dois.
 */

import { defineViz } from '../../core/define-viz.js';
import {
  montarOpcoes,
  blocoDeCores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';
import {
  opcoesDeQuadrantes,
  opcoesDeDivisorias,
  opcoesDePontos,
  opcoesDinamicasDeCampos,
  renderizarQuadrantes,
  destruirQuadrantes,
  comRotulosDePonto,
} from '../_quadrantes/index.js';

/** Nomes genéricos: aqui os eixos podem ser qualquer coisa. */
const NOMES_PADRAO = {
  superiorDireito: 'Alto / Alto',
  inferiorDireito: 'Alto / Baixo',
  inferiorEsquerdo: 'Baixo / Baixo',
  superiorEsquerdo: 'Baixo / Alto',
};

export default defineViz({
  id: 'quadrant_scatter',
  label: 'Dispersão com Quadrantes',
  opcoes: comRotulosDePonto(montarOpcoes(
    blocoDeCores(),
    blocoDeEixos(),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeTema(),
    blocoAvancado(),
    opcoesDeDivisorias({ cortePadraoX: 'media', cortePadraoY: 'media' }),
    opcoesDeQuadrantes(NOMES_PADRAO),
    opcoesDePontos({ tamanhoPadrao: 7 })
  )),
  exigencia: { dimensoesMin: 1, medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeCampos(modelo, { comTamanho: true, comCor: true });
  },

  render(ctx) {
    renderizarQuadrantes(ctx, { nomesPadrao: NOMES_PADRAO });
  },

  aoDestruir: destruirQuadrantes,
});
