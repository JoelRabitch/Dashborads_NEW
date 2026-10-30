/**
 * dispersao_regressao — "Dispersão com Regressão".
 *
 * Nuvem de pontos com reta ajustada, R², equação e banda de incerteza.
 *
 * É o gráfico que mais facilmente diz coisas que não são verdade, e por
 * três caminhos diferentes:
 *
 * 1. **Uma reta sobre uma relação curva.** O desenho fica plausível, o R²
 *    pode até ser alto, e a reta está errada em toda a faixa. Aqui os
 *    resíduos passam por um teste de corridas (Wald-Wolfowitz): se os
 *    sinais se agrupam em vez de alternarem ao acaso, a curvatura é
 *    denunciada em voz alta.
 * 2. **Confundir a banda da RETA com a banda de PREDIÇÃO.** A primeira diz
 *    onde a média está; a segunda, onde o próximo ponto cairia — e é muito
 *    mais larga. São lidas como a mesma coisa o tempo todo, então aqui a
 *    banda desenhada é sempre nomeada.
 * 3. **R² alto com poucos pontos.** Com n = 4, R² = 0,9 é rotina em dados
 *    sem relação nenhuma. O gráfico avisa.
 *
 * E a de sempre: correlação não é causalidade. Está escrito na nota.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, criarFormatadorNumerico, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { acharMaisProximo } from '../../core/interaction.js';
import {
  CSS_DISPERSAO,
  LIMITE_PARA_CANVAS,
  MINIMO_PARA_INFERENCIA,
  opcoesDePontos,
  lerPontos,
  desenharNuvem,
  ajustar,
  calcularBanda,
  testeDeCorridas,
  regressaoPelaOrigem,
} from '../_dispersao/index.js';

// A família inteira mora em `_dispersao/`. O gráfico continua expondo
// estes nomes porque eles são a superfície pública testada — mudar de
// lugar não é mudar de contrato.
export {
  MINIMO_PARA_INFERENCIA,
  regressaoPelaOrigem,
  calcularBanda,
  testeDeCorridas,
} from '../_dispersao/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeCores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

export default defineViz({
  id: 'dispersao_regressao',
  label: 'Dispersão com Regressão',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDePontos(),
      {
        tipoDeAjuste: {
          type: 'string',
          label: 'Ajuste',
          section: 'Regressão',
          display: 'select',
          default: 'minimosQuadrados',
          values: listaDeValores([
            { rotulo: 'Reta por mínimos quadrados', valor: 'minimosQuadrados' },
            { rotulo: 'Nenhum (só a nuvem)', valor: 'nenhum' },
          ]),
        },
        tipoDeBanda: {
          type: 'string',
          label: 'Banda de incerteza',
          section: 'Regressão',
          display: 'select',
          default: 'confianca',
          values: listaDeValores([
            { rotulo: 'Da reta (onde a média está)', valor: 'confianca' },
            { rotulo: 'De predição (onde o próximo ponto cairia)', valor: 'predicao' },
            { rotulo: 'Nenhuma', valor: 'nenhuma' },
          ]),
        },
        nivelDeConfianca: {
          type: 'number',
          label: 'Nível de confiança (%)',
          section: 'Regressão',
          display: 'range',
          min: 80,
          max: 99,
          step: 1,
          default: 95,
        },
        mostrarEquacao: {
          type: 'boolean',
          label: 'Mostrar equação, R² e n',
          section: 'Regressão',
          default: true,
        },
        avisarCurvatura: {
          type: 'boolean',
          label: 'Denunciar quando a relação não parece ser uma reta',
          section: 'Regressão',
          default: true,
        },
        forcarPelaOrigem: {
          type: 'boolean',
          label: 'Forçar a reta a passar pela origem',
          section: 'Regressão',
          default: false,
        },
        corDaReta: {
          type: 'string',
          label: 'Cor da reta',
          section: 'Formato',
          display: 'color',
          default: '#DC2626',
        },
      }
    ),
    { gradeEixoY: true, gradeEixoX: true }
  ),
  exigencia: { medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const saida = {};

    if (medidas.length >= 2) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoX', 'Medida do eixo X', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        }),
        opcaoDeEscolhaDeCampo('campoY', 'Medida do eixo Y', medidas, {
          secao: 'Dados',
          padrao: medidas[1].nome,
        })
      );
    }
    if (dimensoes.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoRotulo', 'Dimensão que identifica o ponto', dimensoes, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: dimensoes[0].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const campoX = modelo.medidas.find((m) => m.nome === config.campoX) || modelo.medidas[0];
    const campoY =
      modelo.medidas.find((m) => m.nome === config.campoY) ||
      modelo.medidas.find((m) => m !== campoX) ||
      modelo.medidas[1];

    if (!campoX || !campoY || campoX === campoY) {
      ctx.mostrarVazio(
        'São necessárias DUAS medidas diferentes: uma para o eixo X e outra para o eixo Y. ' +
          'Com a mesma medida nos dois eixos, a reta é sempre y = x e não há nada a descobrir.'
      );
      return;
    }

    const campoDoRotulo =
      config.campoDoRotulo === ''
        ? null
        : modelo.dimensoes.find((d) => d.nome === config.campoDoRotulo) || modelo.dimensoes[0] || null;

    // ---------- Pontos ----------
    const { pontos, descartadas } = lerPontos({ modelo, campoX, campoY, campoDoRotulo });

    if (pontos.length < 2) {
      ctx.mostrarVazio('São necessárias pelo menos duas linhas com valor nas duas medidas.');
      return;
    }
    if (descartadas > 0) {
      ctx.avisar(`${descartadas} linha(s) sem valor em X ou Y ficaram de fora do ajuste.`);
    }

    // ---------- Ajuste ----------
    const semAjuste = (config.tipoDeAjuste || 'minimosQuadrados') === 'nenhum';
    const pelaOrigem = !!config.forcarPelaOrigem;
    const ajuste = semAjuste ? null : ajustar(pontos, { pelaOrigem });

    if (!semAjuste && !ajuste) {
      ctx.avisar(
        'Todos os pontos têm o mesmo valor em X: não existe reta de regressão. ' +
          'A nuvem foi desenhada sem ajuste.'
      );
    }

    if (ajuste && ajuste.n < MINIMO_PARA_INFERENCIA) {
      ctx.avisar(
        `A reta foi ajustada com ${ajuste.n} ponto(s). Abaixo de ${MINIMO_PARA_INFERENCIA}, ` +
          'um R² alto aparece com frequência em dados sem relação nenhuma — o número não sustenta conclusão.'
      );
    }

    const curvatura = ajuste && config.avisarCurvatura !== false ? testeDeCorridas(pontos, ajuste) : null;
    if (curvatura && curvatura.suspeito) {
      ctx.avisar(
        'Os resíduos não se alternam ao acaso: eles ficam do mesmo lado da reta em trechos inteiros ' +
          `(${curvatura.corridas} corridas, ${curvatura.esperadas.toFixed(1)} esperadas). ` +
          'A relação provavelmente não é uma reta, e a reta desenhada está errada em toda a faixa.'
      );
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_DISPERSAO, 'dr');
    const area = criarEl('div', { classe: 'dr-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const casasSeguras = Number.isFinite(casas) ? casas : 1;
    const formatarX = formatadorDeValueFormat(campoX.valueFormat, { casas: casasSeguras });
    const formatarY = formatadorDeValueFormat(campoY.valueFormat, { casas: casasSeguras });

    const valoresX = pontos.map((p) => p.x);
    const valoresY = pontos.map((p) => p.y);

    const margens = calcularMargens({
      rotulosY: valoresY.map(formatarY),
      rotulosX: valoresX.map(formatarX),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaX = escalaNumerica({
      valores: valoresX,
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config,
      eixo: 'X',
    });
    const escalaY = escalaNumerica({
      valores: valoresY,
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config,
      eixo: 'Y',
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'dr-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    desenharEixos({
      svg, escalaX, escalaY, area: retangulo, config, tema, formatarX, formatarY,
    });

    // ---------- Banda ----------
    const tipoDeBanda = config.tipoDeBanda || 'confianca';
    let banda = null;
    if (ajuste && tipoDeBanda !== 'nenhuma' && ajuste.erroResidual !== null) {
      banda = calcularBanda({
        ajuste,
        de: Math.min(...valoresX),
        ate: Math.max(...valoresX),
        nivel: (Number(config.nivelDeConfianca) || 95) / 100,
        predicao: tipoDeBanda === 'predicao',
      });
    }

    const corDaReta = config.corDaReta || tema.negativo;

    if (banda) {
      const cima = banda.map((p) => `${escalaX(p.x)},${escalaY(p.superior)}`);
      const baixo = banda
        .slice()
        .reverse()
        .map((p) => `${escalaX(p.x)},${escalaY(p.inferior)}`);
      criarSvgEl('path', {
        pai: svg,
        classe: 'dr-marca',
        atributos: {
          d: `M${cima.join('L')}L${baixo.join('L')}Z`,
          fill: comOpacidade(corDaReta, 0.12),
        },
      });
    }

    // ---------- Pontos ----------
    const raioDoPonto = (Number(config.tamanhoDoPonto) || 5) / 2;
    const opacidade = Number(config.opacidadeDoPonto) || 0.7;
    const forma = config.formaDoPonto || 'circulo';
    const corDoPonto = coresDaPaleta(config.paleta)[0];

    for (const ponto of pontos) {
      ponto.px = escalaX(ponto.x);
      ponto.py = escalaY(ponto.y);
    }

    const { usouCanvas: usarCanvas, contexto } = desenharNuvem({
      area,
      svg,
      pontos,
      largura,
      altura,
      raio: raioDoPonto,
      forma,
      opacidade,
      cor: corDoPonto,
      limite: LIMITE_PARA_CANVAS,
    });
    if (usarCanvas && !contexto) {
      ctx.avisar('O navegador não forneceu contexto 2D; os pontos não foram desenhados.');
    }

    // ---------- Reta ----------
    if (ajuste) {
      const x0 = Math.min(...valoresX);
      const x1 = Math.max(...valoresX);
      criarSvgEl('line', {
        pai: svg,
        classe: 'dr-reta',
        atributos: {
          x1: escalaX(x0), y1: escalaY(ajuste.previsto(x0)),
          x2: escalaX(x1), y2: escalaY(ajuste.previsto(x1)),
          stroke: corDaReta,
          'stroke-width': 2,
        },
      });
    }

    // ---------- Caixa com a equação ----------
    if (ajuste && config.mostrarEquacao !== false) {
      const caixa = criarEl('div', { classe: 'dr-caixa', pai: area });
      caixa.style.background = comOpacidade(tema.fundo, 0.88);
      caixa.style.color = tema.texto;
      caixa.style.border = `1px solid ${tema.borda}`;

      const compacto = criarFormatadorNumerico({ casas: 4 });
      for (const texto of [
        `y = ${compacto(ajuste.intercepto)} ${ajuste.inclinacao < 0 ? '−' : '+'} ${compacto(Math.abs(ajuste.inclinacao))} · x`,
        `R² = ${ajuste.r2.toFixed(4)}   r = ${(Math.sign(ajuste.inclinacao) * Math.sqrt(ajuste.r2)).toFixed(4)}`,
        `n = ${ajuste.n}`,
      ]) {
        const linha = criarEl('div', { pai: caixa });
        definirTexto(linha, texto);
      }
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'dr-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(nota, textoDaNota({ ajuste, banda, tipoDeBanda, config, pelaOrigem, usarCanvas }));

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const localizar = (ev) => {
      const caixa = area.getBoundingClientRect();
      return acharMaisProximo({
        itens: pontos,
        x: ev.clientX - caixa.left,
        y: ev.clientY - caixa.top,
        raio: Math.max(8, raioDoPonto + 5),
        obterX: (p) => p.px,
        obterY: (p) => p.py,
      });
    };

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const alvo = localizar(ev);
      if (!alvo) {
        tooltip.esconder();
        return;
      }
      const linhas = [
        { rotulo: campoX.rotuloCurto, valor: formatarX(alvo.x), cor: corDoPonto },
        { rotulo: campoY.rotuloCurto, valor: formatarY(alvo.y) },
      ];
      if (ajuste) {
        const previsto = ajuste.previsto(alvo.x);
        linhas.push({ rotulo: 'Previsto pela reta', valor: formatarY(previsto) });
        linhas.push({ rotulo: 'Resíduo', valor: formatarY(alvo.y - previsto), cor: corDaReta });
      }
      tooltip.mostrar({ titulo: truncar(alvo.rotulo, 40), linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(area, 'click', (ev) => {
      const alvo = localizar(ev);
      if (!alvo || !campoDoRotulo) return;
      const celula = ctx.modelo.celula(modelo.linhas[alvo.indice], campoDoRotulo.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function textoDaNota({ ajuste, banda, tipoDeBanda, config, pelaOrigem, usarCanvas }) {
  const partes = [];
  if (ajuste) {
    partes.push(pelaOrigem ? 'reta forçada pela origem' : 'mínimos quadrados');
    if (banda) {
      const nivel = Number(config.nivelDeConfianca) || 95;
      partes.push(
        tipoDeBanda === 'predicao'
          ? `banda de PREDIÇÃO de ${nivel}% (onde o próximo ponto cairia)`
          : `banda de confiança de ${nivel}% da RETA (onde a média está, não onde o próximo ponto cai)`
      );
    }
  } else {
    partes.push('sem ajuste: só a nuvem');
  }
  if (usarCanvas) partes.push('pontos em canvas');
  partes.push('correlação não é causalidade');
  return partes.join(' · ');
}
