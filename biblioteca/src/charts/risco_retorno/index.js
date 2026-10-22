/**
 * risco_retorno — "Risco x Retorno".
 *
 * Dispersão com o RISCO no eixo X e o RETORNO no Y, uma bolha por ativo
 * dimensionada pela exposição. A pergunta é "quem entrega mais retorno por
 * unidade de risco" — e a resposta visual é a INCLINAÇÃO da reta que liga
 * o ativo à taxa livre de risco, não a altura dele no gráfico.
 *
 * Por isso o gráfico desenha essa reta: sem ela, o olho compara altura
 * (retorno puro) e conclui errado sobre um ativo que rendeu mais só porque
 * arriscou muito mais.
 *
 * O desenho vem de `../_quadrantes/`, que já faz dispersão com eixos,
 * tamanho e cor por medida. O que muda aqui é a semântica e a reta de
 * Sharpe por cima.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarSvgEl, definirTexto } from '../../core/dom.js';
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

/** Nomes que fazem sentido quando os eixos são risco e retorno. */
const NOMES_PADRAO = {
  superiorEsquerdo: 'Retorno alto, risco baixo',
  superiorDireito: 'Retorno alto, risco alto',
  inferiorEsquerdo: 'Retorno baixo, risco baixo',
  inferiorDireito: 'Retorno baixo, risco alto',
};

export default defineViz({
  id: 'risco_retorno',
  label: 'Risco x Retorno',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores(),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeDivisorias({ cortePadraoX: 'media', cortePadraoY: 'media' }),
      opcoesDeQuadrantes(NOMES_PADRAO),
      opcoesDePontos({ tamanhoPadrao: 10 }),
      {
        taxaLivreDeRisco: {
          type: 'string',
          label: 'Taxa livre de risco (no mesmo formato do eixo Y)',
          section: 'Sharpe',
          default: '0',
          placeholder: 'ex.: 0.1 para 10%',
        },
        mostrarRetaDeSharpe: {
          type: 'boolean',
          label: 'Reta até o melhor índice de Sharpe',
          section: 'Sharpe',
          default: true,
        },
        destacarMelhorSharpe: {
          type: 'boolean',
          label: 'Destacar o ativo de melhor Sharpe',
          section: 'Sharpe',
          default: true,
        },
        corDaRetaDeSharpe: {
          type: 'string',
          label: 'Cor da reta',
          section: 'Sharpe',
          display: 'color',
          default: '#111827',
        },
      }
    ),
    {
      tituloEixoX: 'Risco',
      tituloEixoY: 'Retorno',
      quantosRotulosDePonto: 30,
      mostrarContagemPorQuadrante: false,
    }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeCampos(modelo, { comTamanho: true, comCor: true });
  },

  render(ctx) {
    const { config, tema } = ctx;

    const resultado = renderizarQuadrantes(ctx, { nomesPadrao: NOMES_PADRAO });
    if (!resultado) return;

    const { pontos, escalaX, escalaY, retangulo, svg } = resultado;
    const taxaLivre = numeroOuZero(config.taxaLivreDeRisco);

    const comSharpe = calcularSharpe(pontos, taxaLivre);
    if (!comSharpe.melhor) return;

    // ---------- Reta de Sharpe ----------
    // Sai da taxa livre de risco (risco zero) e passa pelo ativo de melhor
    // relação. Todo ativo ACIMA da reta tem Sharpe melhor; abaixo, pior.
    if (config.mostrarRetaDeSharpe !== false) {
      const x0 = escalaX(0);
      const y0 = escalaY(taxaLivre);
      const melhor = comSharpe.melhor;

      // Prolonga a reta até a borda direita, em vez de parar no ponto:
      // a comparação só funciona se a régua atravessar o gráfico.
      const direita = retangulo.esquerda + retangulo.largura;
      const inclinacao = (escalaY(melhor.y) - y0) / ((escalaX(melhor.x) - x0) || 1);
      const yNaBorda = y0 + inclinacao * (direita - x0);

      criarSvgEl('line', {
        pai: svg,
        classe: 'qd-rotulo-ponto',
        atributos: {
          x1: x0,
          y1: y0,
          x2: direita,
          y2: yNaBorda,
          stroke: config.corDaRetaDeSharpe || tema.texto,
          'stroke-width': 1.5,
          'stroke-dasharray': '6 3',
          opacity: 0.7,
        },
      });

      const rotulo = criarSvgEl('text', {
        pai: svg,
        classe: 'qd-rotulo-ponto',
        atributos: {
          x: direita - 4,
          y: Math.max(retangulo.cima + 10, Math.min(retangulo.cima + retangulo.altura - 4, yNaBorda - 5)),
          'text-anchor': 'end',
          'font-size': Math.max(9, tema.tamanhoBase - 1),
          fill: config.corDaRetaDeSharpe || tema.texto,
        },
      });
      definirTexto(rotulo, `Melhor Sharpe: ${comSharpe.melhor.sharpe.toFixed(2)}`);
    }

    // ---------- Destaque do melhor ----------
    if (config.destacarMelhorSharpe !== false) {
      const melhor = comSharpe.melhor;
      criarSvgEl('circle', {
        pai: svg,
        classe: 'qd-rotulo-ponto',
        atributos: {
          cx: escalaX(melhor.x),
          cy: escalaY(melhor.y),
          r: (melhor.raio || 6) / 2 + 5,
          fill: 'none',
          stroke: config.corDaRetaDeSharpe || tema.texto,
          'stroke-width': 2,
        },
      });
    }

    if (comSharpe.semSharpe > 0) {
      ctx.avisar(
        `${comSharpe.semSharpe} ativo(s) têm risco zero ou negativo e ficaram sem índice de Sharpe: ` +
          'a conta divide pelo risco.'
      );
    }
  },

  aoDestruir: destruirQuadrantes,
});

/* ------------------------------------------------------------------ */

function numeroOuZero(texto) {
  const n = Number(String(texto ?? '0').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Índice de Sharpe de cada ponto: (retorno − taxa livre) ÷ risco.
 *
 * Risco zero ou negativo não tem Sharpe — a conta divide por ele. Esses
 * pontos continuam no gráfico, mas sem índice e sem disputar o "melhor".
 *
 * @returns {{melhor:object|null, semSharpe:number}}
 */
export function calcularSharpe(pontos, taxaLivreDeRisco) {
  let melhor = null;
  let semSharpe = 0;

  for (const ponto of pontos) {
    if (!(ponto.x > 0)) {
      ponto.sharpe = null;
      semSharpe += 1;
      continue;
    }
    ponto.sharpe = (ponto.y - taxaLivreDeRisco) / ponto.x;
    if (!melhor || ponto.sharpe > melhor.sharpe) melhor = ponto;
  }

  return { melhor, semSharpe };
}
