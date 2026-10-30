/**
 * matriz_2x2 — "Matriz 2x2".
 *
 * Mesma mecânica da dispersão com quadrantes, mas com as convenções de uma
 * matriz de decisão: poucos itens, TODOS nomeados, bolhas maiores e corte
 * no ponto médio (e não na média), que é como se lê uma matriz de esforço
 * × impacto ou urgência × importância.
 *
 * O desenho mora em `../_quadrantes/`, inclusive as correções v2:
 * a "Forma" muda o desenho dos pontos (marcadores SVG), nome e cor de cada
 * quadrante valem no fundo, no nome e nos pontos, e os rótulos seguem todas
 * as opções da seção Rótulos.
 */

import { defineViz } from '../../core/define-viz.js';
import {
  montarOpcoes,
  comDefaults,
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

const NOMES_PADRAO = {
  superiorDireito: 'Prioridade',
  inferiorDireito: 'Rever',
  inferiorEsquerdo: 'Descartar',
  superiorEsquerdo: 'Oportunidade',
};

export default defineViz({
  id: 'matriz_2x2',
  label: 'Matriz 2x2',
  opcoes: comRotulosDePonto(comDefaults(
    montarOpcoes(
      blocoDeCores(),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      // Ponto médio, e não média: numa matriz de decisão o leitor espera
      // "metade da escala", não "acima da média do grupo".
      opcoesDeDivisorias({ cortePadraoX: 'meio', cortePadraoY: 'meio' }),
      opcoesDeQuadrantes(NOMES_PADRAO),
      opcoesDePontos({ tamanhoPadrao: 14 })
    ),
    {
      // Uma matriz 2x2 tem poucos itens e todos precisam de nome.
      quantosRotulosDePonto: 60,
      truncarRotulo: 24,
      gradeEixoY: false,
      mostrarContagemPorQuadrante: false,
    }
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
