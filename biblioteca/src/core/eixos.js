/**
 * eixos.js — desenho de eixos cartesianos em SVG.
 *
 * Quase metade dos gráficos da biblioteca é cartesiana, então isto aqui é
 * infraestrutura: margens, ticks, grade, títulos dos eixos e rótulos
 * girados ficam num lugar só, com as mesmas opções do `blocoDeEixos` do
 * options-kit.
 *
 * A ordem de uso é sempre:
 *   1. `calcularMargens(...)` — precisa dos textos dos rótulos, não das
 *      escalas, justamente para quebrar o ovo-e-galinha;
 *   2. criar as escalas com o intervalo que sobrou;
 *   3. `desenharEixos(...)`.
 */

import { criarSvgEl, definirTexto } from './dom.js';
import { ticksDoEixo } from './scales.js';
import { criarFormatadorNumerico } from './format.js';

/**
 * Formatador dos números do eixo conforme "Formato dos números nos eixos"
 * e "Casas decimais nos eixos" (correções v2: as duas opções eram
 * declaradas e ignoradas). Em "auto" devolve `padrao` — o formato do campo
 * que o gráfico já calculou.
 */
export function formatadorDoEixo(config = {}, padrao) {
  const estilo = config.formatoDoEixo || 'auto';
  if (estilo === 'auto') return padrao;
  const casas = Number(config.casasDecimaisDoEixo);
  return criarFormatadorNumerico({ estilo, casas: Number.isFinite(casas) ? casas : 1 });
}

/** Largura aproximada de um texto, sem precisar medir no DOM. */
export function larguraAproximada(texto, tamanhoDaFonte) {
  return String(texto).length * tamanhoDaFonte * 0.58;
}

/**
 * Calcula as margens necessárias para os eixos caberem.
 *
 * @param {object} params
 * @param {string[]} params.rotulosY textos que vão aparecer no eixo Y
 * @param {string[]} params.rotulosX textos que vão aparecer no eixo X
 * @param {object} params.config
 * @param {object} params.tema
 */
export function calcularMargens({ rotulosY = [], rotulosX = [], config = {}, tema }) {
  const fonte = Math.max(8, (tema && tema.tamanhoBase) || 12) - 1;
  const mostrarY = config.mostrarEixoY !== false;
  const mostrarX = config.mostrarEixoX !== false;

  let esquerda = 8;
  if (mostrarY) {
    const maior = rotulosY.reduce((a, t) => Math.max(a, larguraAproximada(t, fonte)), 0);
    esquerda = Math.min(140, Math.max(28, maior + 14));
  }
  if (config.tituloEixoY) esquerda += fonte + 6;

  let baixo = 8;
  if (mostrarX) {
    const girar = Number(config.rotacaoRotuloEixoX) || 0;
    if (girar) {
      const maior = rotulosX.reduce((a, t) => Math.max(a, larguraAproximada(t, fonte)), 0);
      const radianos = (Math.abs(girar) * Math.PI) / 180;
      baixo = Math.min(120, Math.max(22, maior * Math.sin(radianos) + fonte + 8));
    } else {
      baixo = fonte + 16;
    }
  }
  if (config.tituloEixoX) baixo += fonte + 6;

  // À direita e em cima sobra espaço para o último rótulo não ser cortado.
  const direita = mostrarX ? Math.max(10, larguraAproximada(rotulosX[rotulosX.length - 1] || '', fonte) / 2) : 10;

  return { esquerda, direita: Math.min(60, direita), cima: 12, baixo, fonte };
}

/**
 * Desenha grade, linhas e rótulos dos dois eixos.
 *
 * @returns {{grupo:Element}}
 */
export function desenharEixos({ svg, escalaX, escalaY, area, config = {}, tema, formatarX, formatarY, rotulosDeBanda }) {
  const grupo = criarSvgEl('g', { pai: svg, classe: 'bl-eixos' });
  const fonte = Math.max(8, (tema && tema.tamanhoBase) || 12) - 1;
  const corDoTexto = tema.textoSuave;
  const corDaGrade = tema.grade;

  // Formato do painel vale para eixos NUMÉRICOS; eixo de banda (categorias)
  // e temporal mantêm o formatador que o gráfico passou.
  const ehNumerica = (e) => e && typeof e.ticks === 'function' && !(e.domain()[0] instanceof Date);
  if (!rotulosDeBanda && ehNumerica(escalaX)) formatarX = formatadorDoEixo(config, formatarX);
  if (ehNumerica(escalaY)) formatarY = formatadorDoEixo(config, formatarY);

  const ticksX = rotulosDeBanda || ticksDoEixo(escalaX, Number(config.ticksEixoX) || 6);
  const ticksY = ticksDoEixo(escalaY, Number(config.ticksEixoY) || 5);

  // --- Grade ---
  if (config.gradeEixoY !== false) {
    for (const t of ticksY) {
      const y = escalaY(t);
      if (!Number.isFinite(y)) continue;
      criarSvgEl('line', {
        pai: grupo,
        atributos: {
          x1: area.esquerda, x2: area.esquerda + area.largura, y1: y, y2: y,
          stroke: corDaGrade, 'stroke-width': 1,
        },
      });
    }
  }
  if (config.gradeEixoX) {
    for (const t of ticksX) {
      const x = posicaoNoEixo(escalaX, t, rotulosDeBanda);
      if (!Number.isFinite(x)) continue;
      criarSvgEl('line', {
        pai: grupo,
        atributos: {
          x1: x, x2: x, y1: area.cima, y2: area.cima + area.altura,
          stroke: corDaGrade, 'stroke-width': 1,
        },
      });
    }
  }

  // --- Eixo Y ---
  if (config.mostrarEixoY !== false) {
    criarSvgEl('line', {
      pai: grupo,
      atributos: {
        x1: area.esquerda, x2: area.esquerda, y1: area.cima, y2: area.cima + area.altura,
        stroke: tema.borda, 'stroke-width': 1,
      },
    });
    for (const t of ticksY) {
      const y = escalaY(t);
      if (!Number.isFinite(y)) continue;
      const girarY = Number(config.rotacaoRotuloEixoY) || 0;
      const texto = criarSvgEl('text', {
        pai: grupo,
        atributos: {
          x: area.esquerda - 6, y, 'text-anchor': 'end', 'dominant-baseline': 'central',
          'font-size': fonte, fill: corDoTexto,
          transform: girarY ? `rotate(${girarY} ${area.esquerda - 6} ${y})` : null,
        },
      });
      definirTexto(texto, formatarY ? formatarY(t) : String(t));
    }
  }

  // --- Eixo X ---
  if (config.mostrarEixoX !== false) {
    const yBase = area.cima + area.altura;
    criarSvgEl('line', {
      pai: grupo,
      atributos: {
        x1: area.esquerda, x2: area.esquerda + area.largura, y1: yBase, y2: yBase,
        stroke: tema.borda, 'stroke-width': 1,
      },
    });

    const girar = Number(config.rotacaoRotuloEixoX) || 0;

    // Com eixo de banda, `ticksX` tem UMA entrada por categoria: 120 datas
    // viram 120 rótulos sobrepostos e ilegíveis. Então pulamos de N em N,
    // calculando N pela largura que cada rótulo precisa. (Escala numérica
    // não passa por aqui: o d3 já devolve poucos ticks redondos.)
    let salto = 1;
    if (rotulosDeBanda && ticksX.length > 1) {
      const maiorRotulo = ticksX.reduce(
        (a, t) => Math.max(a, larguraAproximada(formatarX ? formatarX(t) : t, fonte)),
        0
      );
      const necessario = girar ? fonte * 1.4 : maiorRotulo + 8;
      const disponivel = area.largura / ticksX.length;
      salto = Math.max(1, Math.ceil(necessario / Math.max(1, disponivel)));
    }

    ticksX.forEach((t, indice) => {
      if (indice % salto !== 0) return;
      const x = posicaoNoEixo(escalaX, t, rotulosDeBanda);
      if (!Number.isFinite(x)) return;
      const texto = criarSvgEl('text', {
        pai: grupo,
        atributos: {
          x, y: yBase + (girar ? 8 : fonte + 2),
          'text-anchor': girar ? 'end' : 'middle',
          'font-size': fonte, fill: corDoTexto,
          transform: girar ? `rotate(${-Math.abs(girar)} ${x} ${yBase + 8})` : null,
        },
      });
      definirTexto(texto, formatarX ? formatarX(t) : String(t));
    });
  }

  // --- Títulos ---
  if (config.tituloEixoY) {
    const x = 10;
    const y = area.cima + area.altura / 2;
    const texto = criarSvgEl('text', {
      pai: grupo,
      atributos: {
        x, y, 'text-anchor': 'middle', 'font-size': fonte, fill: corDoTexto,
        transform: `rotate(-90 ${x} ${y})`,
      },
    });
    definirTexto(texto, config.tituloEixoY);
  }
  if (config.tituloEixoX) {
    const texto = criarSvgEl('text', {
      pai: grupo,
      atributos: {
        x: area.esquerda + area.largura / 2,
        y: area.cima + area.altura + area.margemDeBaixo - 2,
        'text-anchor': 'middle', 'font-size': fonte, fill: corDoTexto,
      },
    });
    definirTexto(texto, config.tituloEixoX);
  }

  return { grupo };
}

/**
 * Desenha um segundo eixo Y, à direita.
 *
 * Serve a gráficos que combinam duas unidades no mesmo plano — barras de
 * valor com linha de percentual acumulado, por exemplo. A margem da direita
 * precisa ter sido reservada antes: use `espacoParaEixoSecundario()` ao
 * montar as margens, senão o eixo sai por cima do desenho.
 */
export function desenharEixoSecundario({ svg, escala, area, tema, formatar, titulo, cor }) {
  const grupo = criarSvgEl('g', { pai: svg, classe: 'bl-eixo-secundario' });
  const fonte = Math.max(8, (tema && tema.tamanhoBase) || 12) - 1;
  const corDoTexto = cor || tema.textoSuave;
  const x = area.esquerda + area.largura;

  criarSvgEl('line', {
    pai: grupo,
    atributos: {
      x1: x, x2: x, y1: area.cima, y2: area.cima + area.altura,
      stroke: cor || tema.borda, 'stroke-width': 1,
    },
  });

  for (const t of ticksDoEixo(escala, 5)) {
    const y = escala(t);
    if (!Number.isFinite(y)) continue;
    const texto = criarSvgEl('text', {
      pai: grupo,
      atributos: {
        x: x + 6, y, 'text-anchor': 'start', 'dominant-baseline': 'central',
        'font-size': fonte, fill: corDoTexto,
      },
    });
    definirTexto(texto, formatar ? formatar(t) : String(t));
  }

  if (titulo) {
    const tx = x + fonte + 14;
    const ty = area.cima + area.altura / 2;
    const texto = criarSvgEl('text', {
      pai: grupo,
      atributos: {
        x: tx, y: ty, 'text-anchor': 'middle', 'font-size': fonte, fill: corDoTexto,
        transform: `rotate(90 ${tx} ${ty})`,
      },
    });
    definirTexto(texto, titulo);
  }

  return { grupo };
}

/** Quanto reservar à direita para um eixo secundário caber. */
export function espacoParaEixoSecundario(rotulos, tema, comTitulo = false) {
  const fonte = Math.max(8, (tema && tema.tamanhoBase) || 12) - 1;
  const maior = rotulos.reduce((a, t) => Math.max(a, larguraAproximada(t, fonte)), 0);
  return Math.min(120, Math.max(30, maior + 12)) + (comTitulo ? fonte + 8 : 0);
}

/** Escalas de banda precisam do deslocamento até o meio da faixa. */
function posicaoNoEixo(escala, valor, ehBanda) {
  const base = escala(valor);
  if (!ehBanda || typeof escala.bandwidth !== 'function') return base;
  return base + escala.bandwidth() / 2;
}

/**
 * Monta o retângulo de desenho a partir do tamanho e das margens.
 * Devolve também as margens, que os títulos dos eixos precisam.
 */
export function areaDeDesenho(largura, altura, margens) {
  return {
    esquerda: margens.esquerda,
    cima: margens.cima,
    largura: Math.max(10, largura - margens.esquerda - margens.direita),
    altura: Math.max(10, altura - margens.cima - margens.baixo),
    margemDeBaixo: margens.baixo,
  };
}
