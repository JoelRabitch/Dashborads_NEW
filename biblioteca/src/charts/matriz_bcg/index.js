/**
 * matriz_bcg — "Matriz BCG" (crescimento × participação).
 *
 * A matriz clássica do Boston Consulting Group: participação relativa de
 * mercado no eixo X (em escala log e INVERTIDA, com participação alta à
 * esquerda, como na matriz original), crescimento no eixo Y, e o tamanho da
 * bolha proporcional à receita.
 *
 * Como o eixo X é invertido, o quadrante de cada item é decidido pela
 * POSIÇÃO NA TELA e não pelo valor — isso já é responsabilidade da base em
 * `../_quadrantes/`, e é o que faz os nomes abaixo caírem nos lugares
 * certos:
 *
 *      participação alta          participação baixa
 *   ┌───────────────────────┬───────────────────────┐
 *   │       Estrela         │  Ponto de interrogação│  crescimento alto
 *   ├───────────────────────┼───────────────────────┤
 *   │    Vaca leiteira      │       Abacaxi         │  crescimento baixo
 *   └───────────────────────┴───────────────────────┘
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
} from '../_quadrantes/index.js';

const NOMES_PADRAO = {
  superiorEsquerdo: 'Estrela',
  superiorDireito: 'Ponto de interrogação',
  inferiorEsquerdo: 'Vaca leiteira',
  inferiorDireito: 'Abacaxi',
};

export default defineViz({
  id: 'matriz_bcg',
  label: 'Matriz BCG',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores(),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      // X corta em 1 (participação relativa igual à do líder) e Y na média
      // de crescimento do portfólio, que são as convenções da matriz.
      opcoesDeDivisorias({ cortePadraoX: 'um', cortePadraoY: 'media' }),
      opcoesDeQuadrantes(NOMES_PADRAO),
      opcoesDePontos({ tamanhoPadrao: 12 }),
      {
        normalizarParticipacao: {
          type: 'boolean',
          label: 'Converter a medida X em participação relativa (valor ÷ maior concorrente)',
          section: 'Dados',
          default: true,
        },
        eixoXSimetricoEmTorno1: {
          type: 'boolean',
          label: 'Centrar o eixo X em 1 (deixa a divisória no meio, como na matriz original)',
          section: 'Quadrantes',
          default: true,
        },
      }
    ),
    {
      // A matriz original põe participação ALTA à esquerda, em escala log.
      inverterEixoX: true,
      escalaEixoX: 'log',
      tituloEixoX: 'Participação relativa de mercado',
      tituloEixoY: 'Crescimento',
      quantosRotulosDePonto: 40,
      truncarRotulo: 22,
      mostrarContagemPorQuadrante: false,
    }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeCampos(modelo, {
      comTamanho: true,
      comCor: true,
      tamanhoObrigatorio: modelo.medidas.length >= 3,
    });
  },

  render(ctx) {
    renderizarQuadrantes(ctx, {
      nomesPadrao: NOMES_PADRAO,
      ajustarPontos(pontos, { config, ctx: contexto }) {
        if (!config.normalizarParticipacao) return pontos;

        // Participação relativa, na definição do BCG, é "minha fatia ÷ fatia
        // do MAIOR CONCORRENTE". Dividir pelo maior valor da consulta seria
        // errado: o líder sairia com 1,0 exato, encostado na divisória, e
        // nenhum item ficaria do lado "participação alta".
        const ordenados = pontos.map((p) => p.x).sort((a, b) => b - a);
        const maior = ordenados[0];
        const segundo = ordenados[1];

        if (!(maior > 0) || !(segundo > 0)) {
          contexto.avisar(
            'Não dá para calcular participação relativa: são necessários pelo menos dois valores positivos no eixo X.'
          );
          return pontos;
        }

        for (const ponto of pontos) {
          const maiorConcorrente = ponto.x === maior ? segundo : maior;
          ponto.x = ponto.x / maiorConcorrente;
        }
        return pontos;
      },

      ajustarConfig(config, pontos) {
        if (!config.eixoXSimetricoEmTorno1) return;
        if (config.minimoEixoX || config.maximoEixoX) return; // o usuário mandou

        // Numa escala log, 1 só cai no meio se o domínio for [1/k, k].
        // Sem isso a divisória encosta na borda e a matriz fica ilegível,
        // porque quase sempre há um único líder com participação > 1.
        const positivos = pontos.map((p) => p.x).filter((v) => v > 0);
        if (positivos.length < 2) return;

        const maior = Math.max(...positivos);
        const menor = Math.min(...positivos);
        const k = Math.max(maior, 1 / menor) * 1.15;
        config.minimoEixoX = 1 / k;
        config.maximoEixoX = k;
      },
    });
  },

  aoDestruir: destruirQuadrantes,
});
