/**
 * lorenz_gini — "Curva de Lorenz / Gini".
 *
 * Mede CONCENTRAÇÃO. No eixo X, o percentual acumulado de categorias
 * (ordenadas da menor para a maior); no Y, o percentual acumulado do
 * valor. A diagonal é a igualdade perfeita: quanto mais a curva se afasta
 * dela, mais concentrado está o total em poucas categorias.
 *
 * O coeficiente de Gini é o dobro da área entre a diagonal e a curva —
 * 0 é igualdade total, 1 é concentração total.
 *
 * Duas diferenças em relação ao Pareto, que usa os mesmos dados:
 *   - aqui a ordenação é CRESCENTE (o Pareto é decrescente);
 *   - aqui interessa a forma da curva inteira, não as primeiras barras.
 *
 * O Gini é calculado por TRAPÉZIOS sobre a curva, em O(n). A fórmula de
 * pares (soma de |xi − xj|) dá o mesmo número mas é O(n²) e travaria com
 * 5.000 categorias.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { geradorDeLinha, geradorDeArea } from '../../core/shapes.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual } from '../../core/format.js';
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

const CSS = `
.lg-area{position:relative;width:100%;height:100%;}
.lg-curva{fill:none;pointer-events:none;}
.lg-preenchimento{pointer-events:none;}
.lg-marca{pointer-events:none;}
.lg-texto{pointer-events:none;}
.lg-gini{position:absolute;right:12px;top:10px;text-align:right;pointer-events:none;}
.lg-gini-valor{font-weight:700;line-height:1;}
.lg-gini-rotulo{font-size:10px;opacity:.75;}
.lg-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

export default defineViz({
  id: 'lorenz_gini',
  label: 'Curva de Lorenz / Gini',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        corDaCurva: {
          type: 'string',
          label: 'Cor da curva',
          section: 'Cores',
          display: 'color',
          default: '#4276BE',
        },
        corDaIgualdade: {
          type: 'string',
          label: 'Cor da linha de igualdade',
          section: 'Cores',
          display: 'color',
          default: '',
        },
        preencherAreaDoGini: {
          type: 'boolean',
          label: 'Pintar a área entre a curva e a igualdade',
          section: 'Formato',
          default: true,
        },
        mostrarGini: {
          type: 'boolean',
          label: 'Mostrar o coeficiente de Gini em destaque',
          section: 'Formato',
          default: true,
        },
        mostrarMarcos: {
          type: 'boolean',
          label: 'Escrever quanto os 10% e os 20% maiores concentram',
          section: 'Rótulos',
          default: true,
        },
        espessuraDaCurva: {
          type: 'number',
          label: 'Espessura da curva',
          section: 'Formato',
          display: 'range',
          min: 1,
          max: 6,
          step: 0.5,
          default: 2,
        },
      }
    ),
    { gradeEixoY: true, gradeEixoX: true, tituloEixoX: '% das categorias', tituloEixoY: '% do total' }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const campoDaCategoria = modelo.dimensoes[0];
    const medida = modelo.medidas[0];
    if (!campoDaCategoria || !medida) {
      ctx.mostrarVazio('A curva de Lorenz precisa de uma dimensão e uma medida.');
      return;
    }

    const leitura = montarLorenz({ modelo, campoDaCategoria, medida });
    for (const aviso of leitura.avisos) ctx.avisar(aviso);

    if (leitura.pontos.length < 3) {
      ctx.mostrarVazio('São necessárias pelo menos duas categorias com valor positivo.');
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'lg');
    const area = criarEl('div', { classe: 'lg-area', pai: raiz });

    const formatarEixo = (v) => `${Math.round(v * 100)}%`;
    const formatarValor = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 0,
    });

    const margens = calcularMargens({
      rotulosY: ['100%'],
      rotulosX: ['100%'],
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    // Os dois eixos vão de 0 a 1: a curva de Lorenz vive num quadrado
    // unitário, e qualquer outro domínio distorce a leitura da diagonal.
    const escalaX = escalaNumerica({
      valores: [0, 1],
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config: { minimoEixoX: 0, maximoEixoX: 1 },
      eixo: 'X',
    });
    const escalaY = escalaNumerica({
      valores: [0, 1],
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config: { minimoEixoY: 0, maximoEixoY: 1 },
      eixo: 'Y',
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    desenharEixos({
      svg,
      escalaX,
      escalaY,
      area: retangulo,
      config,
      tema,
      formatarX: formatarEixo,
      formatarY: formatarEixo,
    });

    const corDaCurva = config.corDaCurva || coresDaPaleta(config.paleta)[0];
    const corDaIgualdade = config.corDaIgualdade || tema.textoSuave;

    // ---------- Área do Gini ----------
    if (config.preencherAreaDoGini !== false) {
      const preenchimento = geradorDeArea({
        x: (p) => escalaX(p.populacao),
        y0: (p) => escalaY(p.populacao),
        y1: (p) => escalaY(p.valor),
        curva: 'linear',
      });
      criarSvgEl('path', {
        pai: svg,
        classe: 'lg-preenchimento',
        atributos: {
          d: preenchimento(leitura.pontos) || '',
          fill: comOpacidade(corDaCurva, 0.18),
        },
      });
    }

    // ---------- Linha de igualdade ----------
    criarSvgEl('line', {
      pai: svg,
      classe: 'lg-marca',
      atributos: {
        x1: escalaX(0), y1: escalaY(0),
        x2: escalaX(1), y2: escalaY(1),
        stroke: corDaIgualdade, 'stroke-width': 1, 'stroke-dasharray': '5 4',
      },
    });

    // ---------- Curva de Lorenz ----------
    const curva = geradorDeLinha({
      x: (p) => escalaX(p.populacao),
      y: (p) => escalaY(p.valor),
      curva: 'linear',
    });
    criarSvgEl('path', {
      pai: svg,
      classe: 'lg-curva',
      atributos: {
        d: curva(leitura.pontos) || '',
        stroke: corDaCurva,
        'stroke-width': Number(config.espessuraDaCurva) || 2,
        'stroke-linejoin': 'round',
      },
    });

    // ---------- Gini em destaque ----------
    if (config.mostrarGini !== false) {
      const caixa = criarEl('div', { classe: 'lg-gini', pai: area });
      const valor = criarEl('div', { classe: 'lg-gini-valor', pai: caixa });
      valor.style.color = corDaCurva;
      valor.style.fontSize = `${Math.round(tema.tamanhoBase * 2.2)}px`;
      definirTexto(valor, leitura.gini.toFixed(3));

      const rotulo = criarEl('div', { classe: 'lg-gini-rotulo', pai: caixa });
      rotulo.style.color = tema.textoSuave;
      definirTexto(rotulo, `Gini — ${descreverGini(leitura.gini)}`);
    }

    // ---------- Marcos de concentração ----------
    if (config.mostrarMarcos !== false) {
      const nota = criarEl('div', { classe: 'lg-nota', pai: area });
      nota.style.color = tema.textoSuave;
      definirTexto(
        nota,
        `Os 10% maiores concentram ${formatarPercentual(leitura.top10, 1)} do total; ` +
          `os 20% maiores, ${formatarPercentual(leitura.top20, 1)}. ` +
          `Total ${formatarValor(leitura.total)} em ${leitura.quantidade} categorias.`
      );
    }

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const alvo = criarSvgEl('rect', {
      pai: svg,
      atributos: {
        x: retangulo.esquerda, y: retangulo.cima,
        width: retangulo.largura, height: retangulo.altura,
        fill: 'transparent',
      },
    });
    const guia = criarSvgEl('line', {
      pai: svg,
      classe: 'lg-marca',
      atributos: {
        y1: retangulo.cima, y2: retangulo.cima + retangulo.altura,
        stroke: tema.bordaForte, 'stroke-width': 1, opacity: 0,
      },
    });

    ctx.eventos.on(alvo, 'pointermove', (ev) => {
      const caixa = area.getBoundingClientRect();
      const px = ev.clientX - caixa.left;
      let melhor = leitura.pontos[0];
      let menor = Infinity;
      for (const ponto of leitura.pontos) {
        const d = Math.abs(escalaX(ponto.populacao) - px);
        if (d < menor) {
          menor = d;
          melhor = ponto;
        }
      }

      guia.setAttribute('x1', escalaX(melhor.populacao));
      guia.setAttribute('x2', escalaX(melhor.populacao));
      guia.setAttribute('opacity', 0.6);

      if (!tooltip) return;
      tooltip.mostrar(
        {
          titulo: `${formatarPercentual(melhor.populacao, 1)} das categorias`,
          linhas: [
            { rotulo: 'Concentram', valor: formatarPercentual(melhor.valor, 1), cor: corDaCurva },
            {
              rotulo: 'Na igualdade seria',
              valor: formatarPercentual(melhor.populacao, 1),
              cor: corDaIgualdade,
            },
            { rotulo: 'Diferença', valor: formatarPercentual(melhor.populacao - melhor.valor, 1) },
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(alvo, 'pointerleave', () => {
      guia.setAttribute('opacity', 0);
      if (tooltip) tooltip.esconder();
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

/**
 * Monta a curva e calcula o Gini.
 *
 * @returns {{pontos:Array<{populacao,valor}>, gini:number, total:number,
 *            quantidade:number, top10:number, top20:number, avisos:string[]}}
 */
export function montarLorenz({ modelo, campoDaCategoria, medida }) {
  const avisos = [];
  const porChave = new Map();

  for (const linha of modelo.linhas) {
    const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
    const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
    if (!porChave.has(chave)) porChave.set(chave, 0);
    const v = modelo.valorNumerico(linha, medida.nome);
    if (v !== null) porChave.set(chave, porChave.get(chave) + v);
  }

  let valores = Array.from(porChave.values());

  // Negativos invalidam o índice: a curva deixa de ser monótona e a área
  // entre ela e a diagonal perde o significado.
  const negativos = valores.filter((v) => v < 0);
  if (negativos.length) {
    avisos.push(
      `${negativos.length} categoria(s) têm valor negativo e ficaram de fora. ` +
        'O índice de Gini pressupõe valores não negativos.'
    );
    valores = valores.filter((v) => v >= 0);
  }

  valores.sort((a, b) => a - b);

  const quantidade = valores.length;
  const total = valores.reduce((a, b) => a + b, 0);

  if (!quantidade || total <= 0) {
    return { pontos: [], gini: 0, total, quantidade, top10: 0, top20: 0, avisos };
  }

  // A curva começa na origem: 0% das categorias concentram 0% do valor.
  const pontos = [{ populacao: 0, valor: 0 }];
  let acumulado = 0;
  for (let i = 0; i < quantidade; i++) {
    acumulado += valores[i];
    pontos.push({ populacao: (i + 1) / quantidade, valor: acumulado / total });
  }

  // Área sob a curva por trapézios. O Gini é 1 - 2 × essa área, porque a
  // área sob a diagonal é exatamente 0,5.
  let areaSobACurva = 0;
  for (let i = 1; i < pontos.length; i++) {
    const base = pontos[i].populacao - pontos[i - 1].populacao;
    areaSobACurva += ((pontos[i].valor + pontos[i - 1].valor) / 2) * base;
  }
  const gini = Math.max(0, Math.min(1, 1 - 2 * areaSobACurva));

  return {
    pontos,
    gini,
    total,
    quantidade,
    top10: concentracaoDosMaiores(pontos, 0.1),
    top20: concentracaoDosMaiores(pontos, 0.2),
    avisos,
  };
}

/** Quanto do total está nos N% MAIORES (a cauda direita da curva). */
export function concentracaoDosMaiores(pontos, fracao) {
  if (pontos.length < 2) return 0;
  const corte = 1 - fracao;
  // Interpola entre os dois pontos que cercam o corte.
  for (let i = 1; i < pontos.length; i++) {
    if (pontos[i].populacao >= corte) {
      const anterior = pontos[i - 1];
      const atual = pontos[i];
      const intervalo = atual.populacao - anterior.populacao;
      const peso = intervalo === 0 ? 0 : (corte - anterior.populacao) / intervalo;
      const valorNoCorte = anterior.valor + (atual.valor - anterior.valor) * peso;
      return 1 - valorNoCorte;
    }
  }
  return 0;
}

/** Leitura em palavras do coeficiente, para quem não convive com ele. */
export function descreverGini(gini) {
  if (gini < 0.2) return 'distribuição bastante uniforme';
  if (gini < 0.35) return 'concentração baixa';
  if (gini < 0.5) return 'concentração moderada';
  if (gini < 0.7) return 'concentração alta';
  return 'concentração muito alta';
}
