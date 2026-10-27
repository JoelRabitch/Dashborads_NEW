/**
 * densidade_ecdf — "Densidade e ECDF".
 *
 * Duas vistas da MESMA distribuição, no mesmo eixo X, uma embaixo da
 * outra. O par é o ponto do gráfico:
 *
 * - A **ECDF** é a verdade sem escolha de método. Um degrau por
 *   observação, nenhum parâmetro, nada a ajustar. Lê-se direto: "40% dos
 *   pedidos ficaram abaixo de R$ 200".
 * - A **densidade** é uma interpretação. Depende de uma largura de banda
 *   que o usuário escolheu (ou que escolhemos por ele), e é ela que decide
 *   se a distribuição tem um pico ou três.
 *
 * Mostrar as duas juntas deixa visível o que a suavização está escondendo.
 * Por isso o padrão é "as duas", e a largura de banda usada aparece
 * escrita na tela — ela é a hipótese, não um detalhe de renderização.
 *
 * A ECDF é desenhada como ESCADA, sempre. Suavizá-la para ficar bonita
 * seria mentir sobre o que ela é: entre duas observações consecutivas não
 * há informação nenhuma, e a reta horizontal diz exatamente isso.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import { densidadePorKernel, larguraDeBandaSilverman } from '../../core/estatistica.js';
import {
  opcoesDeDistribuicao,
  opcoesDinamicasDeDistribuicao,
  prepararDistribuicoes,
  linhasDeResumo,
} from '../_distribuicao/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeEixos,
  blocoDeLegenda,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.de-area{position:relative;width:100%;height:100%;}
.de-svg{position:absolute;left:0;top:0;}
.de-marca{pointer-events:none;}
.de-curva{fill:none;pointer-events:none;}
.de-escada{fill:none;pointer-events:none;}
.de-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
.de-titulo-painel{pointer-events:none;font-weight:600;opacity:.65;}
`;

/**
 * Acima disso a ECDF vira um degrau por pixel e não há o que ver: os
 * passos são subamostrados. Como a ECDF é monótona, pegar de k em k
 * preserva a forma (e os extremos vão à força).
 */
const MAXIMO_DE_DEGRAUS = 1200;

export default defineViz({
  id: 'densidade_ecdf',
  label: 'Densidade e ECDF',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeLegenda(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeDistribuicao({ maximoPadrao: 8 }),
      {
        painel: {
          type: 'string',
          label: 'O que mostrar',
          section: 'Distribuição',
          display: 'select',
          default: 'ambas',
          values: listaDeValores([
            { rotulo: 'As duas (densidade em cima, ECDF embaixo)', valor: 'ambas' },
            { rotulo: 'Só a densidade', valor: 'densidade' },
            { rotulo: 'Só a ECDF', valor: 'ecdf' },
          ]),
        },
        larguraDeBanda: {
          type: 'number',
          label: 'Largura de banda (0 = automática, por Silverman)',
          section: 'Densidade',
          display: 'number',
          default: 0,
        },
        fatorDeBanda: {
          type: 'number',
          label: 'Multiplicador da banda automática',
          section: 'Densidade',
          display: 'range',
          min: 0.2,
          max: 3,
          step: 0.1,
          default: 1,
        },
        preencherDensidade: {
          type: 'boolean',
          label: 'Preencher a área sob a densidade',
          section: 'Densidade',
          default: true,
        },
        mostrarTapete: {
          type: 'boolean',
          label: 'Tapete de observações sob a densidade',
          section: 'Densidade',
          default: true,
        },
        marcarQuantis: {
          type: 'boolean',
          label: 'Marcar mediana e quartis na ECDF',
          section: 'ECDF',
          default: true,
        },
        espessuraDaLinha: {
          type: 'number',
          label: 'Espessura das linhas',
          section: 'Formato',
          display: 'range',
          min: 0.5,
          max: 5,
          step: 0.5,
          default: 1.8,
        },
      }
    ),
    { gradeEixoY: true }
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeDistribuicao(modelo);
  },

  render(ctx) {
    const { config, tema, raiz } = ctx;

    const preparo = prepararDistribuicoes(ctx);
    if (preparo.erro) {
      ctx.mostrarVazio(preparo.erro);
      return;
    }
    const { grupos, medida } = preparo;

    const modo = config.painel || 'ambas';
    const comDensidade = modo !== 'ecdf';
    const comEcdf = modo !== 'densidade';
    const comLegenda = grupos.length > 1 && config.mostrarLegenda !== false;

    // ---------- Cena ----------
    let hospedeiro = raiz;
    let areaLegenda = null;
    if (comLegenda) {
      const layout = criarLayoutComLegenda(raiz, config);
      hospedeiro = layout.areaGrafico;
      areaLegenda = layout.areaLegenda;
    } else {
      ctx.limparRaiz();
    }
    injetarEstilo(raiz, CSS, 'de');

    const largura = Math.max(120, hospedeiro.clientWidth || ctx.largura);
    const altura = Math.max(120, hospedeiro.clientHeight || ctx.altura);
    const area = criarEl('div', { classe: 'de-area', pai: hospedeiro });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatarValor = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    // ---------- Curvas ----------
    const paleta = coresDaPaleta(config.paleta);
    grupos.forEach((grupo, i) => {
      grupo.cor = paleta[i % paleta.length];
    });

    // O eixo X é COMPARTILHADO — entre os grupos e entre os dois painéis.
    // Sem isso, nem as curvas se comparam entre si nem a ECDF se lê contra
    // a densidade que está logo acima dela.
    const minimo = Math.min(...grupos.map((g) => g.resumo.minimo));
    const maximo = Math.max(...grupos.map((g) => g.resumo.maximo));

    const bandas = [];
    if (comDensidade) {
      const fator = Number(config.fatorDeBanda) || 1;
      const informada = Number(config.larguraDeBanda);
      for (const grupo of grupos) {
        const automatica = larguraDeBandaSilverman(grupo.resumo);
        const banda = informada > 0 ? informada : automatica * fator;
        const resultado = densidadePorKernel({
          valores: grupo.valores,
          largura: banda,
          pontos: 160,
          intervalo: [minimo, maximo],
        });
        grupo.densidade = resultado.curva;
        grupo.picoDaDensidade = resultado.maximo;
        grupo.banda = resultado.largura;
        bandas.push(resultado.largura);
      }
    }

    if (comEcdf) {
      for (const grupo of grupos) {
        grupo.ecdf = montarEcdf(grupo.valores);
      }
    }

    // ---------- Geometria ----------
    const picoGeral = comDensidade ? Math.max(...grupos.map((g) => g.picoDaDensidade || 0), 1e-12) : 1;

    const margens = calcularMargens({
      rotulosY: ['100%', formatarDensidade(picoGeral)],
      rotulosX: [minimo, maximo].map(formatarValor),
      config,
      tema,
    });
    const total = areaDeDesenho(largura, altura, margens);

    const espacoEntrePaineis = 26;
    const paineis = [];
    if (comDensidade && comEcdf) {
      const alturaDensidade = Math.max(40, (total.altura - espacoEntrePaineis) * 0.58);
      const alturaEcdf = Math.max(40, total.altura - espacoEntrePaineis - alturaDensidade);
      paineis.push({ tipo: 'densidade', cima: total.cima, altura: alturaDensidade, comEixoX: false });
      paineis.push({
        tipo: 'ecdf',
        cima: total.cima + alturaDensidade + espacoEntrePaineis,
        altura: alturaEcdf,
        comEixoX: true,
      });
    } else {
      paineis.push({
        tipo: comDensidade ? 'densidade' : 'ecdf',
        cima: total.cima,
        altura: total.altura,
        comEixoX: true,
      });
    }

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'de-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const escalaX = escalaNumerica({
      valores: [minimo, maximo],
      intervalo: [total.esquerda, total.esquerda + total.largura],
      config,
      eixo: 'X',
    });

    for (const painel of paineis) {
      const retangulo = {
        esquerda: total.esquerda,
        largura: total.largura,
        cima: painel.cima,
        altura: painel.altura,
        margemDeBaixo: total.margemDeBaixo,
      };

      const escalaY =
        painel.tipo === 'densidade'
          ? escalaNumerica({
              valores: [0, picoGeral],
              intervalo: [painel.cima + painel.altura, painel.cima],
              config: {},
              eixo: 'Y',
            })
          : escalaNumerica({
              valores: [0, 1],
              intervalo: [painel.cima + painel.altura, painel.cima],
              config: {},
              eixo: 'Y',
            });

      desenharEixos({
        svg,
        escalaX,
        escalaY,
        area: retangulo,
        config: { ...config, mostrarEixoX: painel.comEixoX && config.mostrarEixoX !== false },
        tema,
        formatarX: formatarValor,
        formatarY: painel.tipo === 'densidade' ? formatarDensidade : (p) => formatarPercentual(p, 0),
      });

      const titulo = criarSvgEl('text', {
        pai: svg,
        classe: 'de-titulo-painel',
        atributos: {
          x: total.esquerda + 4,
          y: painel.cima + 11,
          'font-size': Math.max(9, tema.tamanhoBase - 1),
          fill: tema.textoSuave,
        },
      });
      definirTexto(
        titulo,
        painel.tipo === 'densidade' ? 'Densidade (estimada)' : 'Acumulada empírica (exata)'
      );

      painel.escalaY = escalaY;
      painel.retangulo = retangulo;

      if (painel.tipo === 'densidade') {
        desenharDensidades({ svg, grupos, escalaX, escalaY, painel, config, tema });
      } else {
        desenharEcdfs({ svg, grupos, escalaX, escalaY, painel, config, tema, formatarValor });
      }
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'de-nota', pai: area });
    nota.style.color = tema.textoSuave;
    const partes = [];
    if (comDensidade) {
      const menor = Math.min(...bandas);
      const maior = Math.max(...bandas);
      partes.push(
        `densidade por kernel gaussiano, banda ${
          Math.abs(maior - menor) < 1e-9
            ? formatarValor(menor)
            : `${formatarValor(menor)} a ${formatarValor(maior)}`
        }${Number(config.larguraDeBanda) > 0 ? ' (informada)' : ' (Silverman)'} — é ela que decide se há um pico ou três`
      );
    }
    if (comEcdf) partes.push('ECDF exata, um degrau por observação, sem parâmetro');
    definirTexto(nota, partes.join(' · '));

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const guia = criarSvgEl('line', {
      pai: svg,
      classe: 'de-marca',
      atributos: {
        y1: total.cima,
        y2: total.cima + total.altura,
        stroke: tema.bordaForte,
        'stroke-width': 1,
        opacity: 0,
      },
    });

    ctx.eventos.on(area, 'pointermove', (ev) => {
      const caixa = area.getBoundingClientRect();
      const px = ev.clientX - caixa.left;
      if (px < total.esquerda || px > total.esquerda + total.largura) {
        guia.setAttribute('opacity', 0);
        if (tooltip) tooltip.esconder();
        return;
      }
      guia.setAttribute('x1', px);
      guia.setAttribute('x2', px);
      guia.setAttribute('opacity', 0.6);

      if (!tooltip) return;
      const valor = escalaX.invert(px);
      const linhas = [{ rotulo: medida.rotuloCurto, valor: formatarValor(valor) }];
      for (const grupo of grupos) {
        const fracao = fracaoAbaixoDe(grupo.resumo.ordenados, valor);
        linhas.push({
          rotulo: grupo.rotulo,
          valor: `${formatarPercentual(fracao, 1)} abaixo`,
          cor: grupo.cor,
        });
      }
      if (grupos.length === 1) linhas.push(...linhasDeResumo(grupos[0], formatarValor));
      tooltip.mostrar({ titulo: 'Acumulada', linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      guia.setAttribute('opacity', 0);
      if (tooltip) tooltip.esconder();
    });

    // ---------- Legenda ----------
    if (comLegenda && areaLegenda) {
      desenharLegenda({
        hospedeiro: areaLegenda,
        tema,
        config,
        itens: grupos.map((g) => ({ chave: g.chave, rotulo: `${g.rotulo} (n=${g.resumo.n})`, cor: g.cor })),
        eventos: ctx.eventos,
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function formatarDensidade(valor) {
  if (!Number.isFinite(valor)) return '';
  if (valor === 0) return '0';
  const absoluto = Math.abs(valor);
  if (absoluto >= 0.01) return valor.toFixed(3);
  return valor.toExponential(1);
}

function desenharDensidades({ svg, grupos, escalaX, escalaY, painel, config, tema }) {
  const espessura = Number(config.espessuraDaLinha) || 1.8;
  const base = painel.cima + painel.altura;

  for (const grupo of grupos) {
    if (!grupo.densidade || !grupo.densidade.length) continue;
    const pontos = grupo.densidade.map((p) => `${escalaX(p.x)},${escalaY(p.densidade)}`);

    if (config.preencherDensidade !== false) {
      criarSvgEl('path', {
        pai: svg,
        classe: 'de-marca',
        atributos: {
          d: `M${escalaX(grupo.densidade[0].x)},${base}L${pontos.join('L')}L${escalaX(
            grupo.densidade[grupo.densidade.length - 1].x
          )},${base}Z`,
          fill: comOpacidade(grupo.cor, grupos.length > 1 ? 0.18 : 0.28),
        },
      });
    }

    criarSvgEl('path', {
      pai: svg,
      classe: 'de-curva',
      atributos: {
        d: `M${pontos.join('L')}`,
        stroke: grupo.cor,
        'stroke-width': espessura,
        'stroke-linejoin': 'round',
      },
    });
  }

  // Tapete: cada observação é um risquinho na base. É o que impede a
  // densidade de parecer suave onde ela só tem dois pontos sustentando.
  if (config.mostrarTapete !== false) {
    const alturaDoRisco = Math.min(8, painel.altura * 0.06);
    for (const grupo of grupos) {
      const passo = Math.max(1, Math.ceil(grupo.valores.length / 600));
      for (let i = 0; i < grupo.valores.length; i += passo) {
        const x = escalaX(grupo.valores[i]);
        criarSvgEl('line', {
          pai: svg,
          classe: 'de-marca',
          atributos: {
            x1: x, x2: x, y1: base, y2: base - alturaDoRisco,
            stroke: comOpacidade(grupo.cor, 0.5),
            'stroke-width': 1,
          },
        });
      }
    }
  }
}

function desenharEcdfs({ svg, grupos, escalaX, escalaY, painel, config, tema, formatarValor }) {
  const espessura = Number(config.espessuraDaLinha) || 1.8;

  for (const grupo of grupos) {
    if (!grupo.ecdf || !grupo.ecdf.length) continue;

    // Escada de verdade: horizontal até o próximo valor, depois vertical.
    // Interpolar entre dois degraus desenharia informação que não existe.
    const partes = [`M${escalaX(grupo.ecdf[0].x)},${escalaY(0)}`];
    let anterior = 0;
    for (const passo of grupo.ecdf) {
      partes.push(`L${escalaX(passo.x)},${escalaY(anterior)}`);
      partes.push(`L${escalaX(passo.x)},${escalaY(passo.p)}`);
      anterior = passo.p;
    }
    partes.push(`L${escalaX(grupo.ecdf[grupo.ecdf.length - 1].x)},${escalaY(1)}`);

    criarSvgEl('path', {
      pai: svg,
      classe: 'de-escada',
      atributos: {
        d: partes.join(''),
        stroke: grupo.cor,
        'stroke-width': espessura,
      },
    });
  }

  if (config.marcarQuantis !== false) {
    for (const grupo of grupos) {
      for (const marca of [
        { p: 0.25, valor: grupo.resumo.q1 },
        { p: 0.5, valor: grupo.resumo.mediana },
        { p: 0.75, valor: grupo.resumo.q3 },
      ]) {
        const x = escalaX(marca.valor);
        const y = escalaY(marca.p);
        criarSvgEl('line', {
          pai: svg,
          classe: 'de-marca',
          atributos: {
            x1: painel.retangulo.esquerda, x2: x, y1: y, y2: y,
            stroke: comOpacidade(tema.texto, 0.25),
            'stroke-width': 1,
            'stroke-dasharray': '3 3',
          },
        });
        criarSvgEl('circle', {
          pai: svg,
          classe: 'de-marca',
          atributos: { cx: x, cy: y, r: marca.p === 0.5 ? 3.5 : 2.5, fill: grupo.cor },
        });
      }
    }
  }
}

/**
 * ECDF, subamostrada quando há degraus demais para caber em pixels.
 *
 * Como a acumulada é monótona, pegar de k em k preserva a forma; o
 * primeiro e o último entram à força para a curva começar e terminar onde
 * deve. O `p` continua sendo o verdadeiro (ordem/n), não um recontado.
 *
 * @returns {Array<{x:number, p:number}>}
 */
export function montarEcdf(valores) {
  const ordenados = valores
    .filter((v) => v !== null && Number.isFinite(v))
    .slice()
    .sort((a, b) => a - b);

  const n = ordenados.length;
  if (!n) return [];

  const passo = Math.max(1, Math.ceil(n / MAXIMO_DE_DEGRAUS));
  const saida = [];
  for (let i = 0; i < n; i += passo) {
    saida.push({ x: ordenados[i], p: (i + 1) / n });
  }
  const ultimo = { x: ordenados[n - 1], p: 1 };
  if (saida[saida.length - 1].x !== ultimo.x || saida[saida.length - 1].p !== 1) {
    saida.push(ultimo);
  }
  return saida;
}

/**
 * Fração das observações abaixo (ou iguais a) um valor.
 *
 * Recebe o array JÁ ORDENADO (o `resumo.ordenados` de cada grupo) e faz
 * busca binária: isto roda a cada movimento do mouse, e reordenar 5.000
 * valores por evento travaria o gráfico sem nenhum erro aparecer.
 */
export function fracaoAbaixoDe(ordenados, limite) {
  if (!ordenados || !ordenados.length) return 0;

  let baixo = 0;
  let alto = ordenados.length;
  while (baixo < alto) {
    const meio = (baixo + alto) >> 1;
    if (ordenados[meio] <= limite) baixo = meio + 1;
    else alto = meio;
  }
  return baixo / ordenados.length;
}
