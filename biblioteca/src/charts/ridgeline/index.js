/**
 * ridgeline — "Ridgeline".
 *
 * Uma curva de densidade por categoria, empilhadas verticalmente com
 * sobreposição parcial e compartilhando o MESMO eixo X. É o gráfico para
 * comparar a forma de muitas distribuições de uma vez — onde um painel de
 * histogramas gastaria dez vezes mais espaço.
 *
 * O que faz um ridgeline funcionar é a sobreposição: as curvas se
 * encavalam o bastante para caberem, mas não tanto que a de baixo suma.
 * Por isso a altura de cada faixa e a sobreposição são separadas — e a
 * ordem de desenho é de baixo para cima, para a curva da frente cobrir a
 * de trás, e não o contrário.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos, larguraAproximada } from '../../core/eixos.js';
import { geradorDeArea, geradorDeLinha } from '../../core/shapes.js';
import { coresDaPaleta, comOpacidade, interpoladorContinuo } from '../../core/theme.js';
import { formatadorDeValueFormat } from '../../core/format.js';
import { densidadePorKernel } from '../../core/estatistica.js';
import {
  opcoesDeDistribuicao,
  opcoesDinamicasDeDistribuicao,
  prepararDistribuicoes,
  rotuloDaCategoria,
  linhasDeResumo,
  MINIMO_CONFIAVEL,
} from '../_distribuicao/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.rl-area{position:relative;width:100%;height:100%;overflow:hidden;}
.rl-faixa{cursor:pointer;}
.rl-contorno{fill:none;pointer-events:none;}
.rl-apagada{opacity:.25;}
.rl-rotulo{pointer-events:none;}
.rl-marca{pointer-events:none;}
.rl-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

export default defineViz({
  id: 'ridgeline',
  label: 'Ridgeline',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeDistribuicao({ maximoPadrao: 20 }),
      {
        sobreposicao: {
          type: 'number',
          label: 'Sobreposição entre as faixas (%)',
          section: 'Ridgeline',
          display: 'range',
          min: 0,
          max: 90,
          step: 5,
          default: 55,
        },
        alturaDaFaixa: {
          type: 'number',
          label: 'Altura de cada faixa (px, 0 = dividir o espaço)',
          section: 'Ridgeline',
          display: 'range',
          min: 0,
          max: 160,
          step: 5,
          default: 0,
        },
        suavizacao: {
          type: 'number',
          label: 'Suavização (0 = automática por Silverman)',
          section: 'Ridgeline',
          display: 'range',
          min: 0,
          max: 5,
          step: 0.1,
          default: 0,
        },
        pontosDaCurva: {
          type: 'number',
          label: 'Resolução da curva',
          section: 'Ridgeline',
          display: 'range',
          min: 24,
          max: 256,
          step: 8,
          default: 96,
        },
        alturaComparavel: {
          type: 'boolean',
          label: 'Alturas comparáveis entre categorias',
          section: 'Ridgeline',
          default: true,
        },
        colorirPor: {
          type: 'string',
          label: 'Cor das faixas',
          section: 'Cores',
          display: 'select',
          default: 'gradiente',
          values: listaDeValores([
            { rotulo: 'Gradiente pela posição', valor: 'gradiente' },
            { rotulo: 'Uma cor por categoria (paleta)', valor: 'paleta' },
            { rotulo: 'Cor única', valor: 'unica' },
          ]),
        },
        mostrarMediana: {
          type: 'boolean',
          label: 'Marcar a mediana de cada faixa',
          section: 'Ridgeline',
          default: true,
        },
        mostrarContorno: {
          type: 'boolean',
          label: 'Contorno nas curvas',
          section: 'Ridgeline',
          default: true,
        },
      }
    ),
    { mostrarEixoY: false, gradeEixoY: false, gradeEixoX: true }
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeDistribuicao(modelo);
  },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const preparo = prepararDistribuicoes(ctx);
    if (preparo.erro) {
      ctx.mostrarVazio(preparo.erro);
      return;
    }

    const { grupos, medida } = preparo;

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'rl');
    const area = criarEl('div', { classe: 'rl-area', pai: raiz });

    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 1,
    });

    // ---------- Geometria ----------
    // Os nomes ficam à esquerda, fora da área das curvas.
    const fonte = Math.max(9, tema.tamanhoBase - 1);
    const larguraDosNomes = Math.min(
      220,
      Math.max(60, ...grupos.map((g) => larguraAproximada(rotuloDaCategoria(g, config), fonte) + 12))
    );

    const margens = calcularMargens({
      rotulosY: [],
      rotulosX: grupos.flatMap((g) => [formatar(g.resumo.minimo), formatar(g.resumo.maximo)]),
      config,
      tema,
    });
    margens.esquerda = larguraDosNomes;
    margens.cima = 14;
    const retangulo = areaDeDesenho(largura, altura, margens);

    // Todas as curvas compartilham o eixo X — é isso que torna a
    // comparação possível.
    const escalaX = escalaNumerica({
      valores: grupos.flatMap((g) => [g.resumo.minimo, g.resumo.maximo]),
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config,
      eixo: 'X',
    });

    // A sobreposição NÃO mexe no espaçamento das linhas de base: ela
    // aumenta a ALTURA das curvas, que é o que faz uma invadir a faixa de
    // cima.
    //
    // Por isso a conta reserva a folga que a primeira curva precisa acima
    // da própria linha de base. Sem essa reserva, com 90% de sobreposição
    // a curva do topo sobe dez vezes o espaçamento e sai da área — some da
    // tela sem erro nenhum. A altura total ocupada é
    // `espacamento × (n + fator − 1)`, e é dela que o espaçamento sai.
    const sobreposicao = Math.max(0, Math.min(0.9, (Number(config.sobreposicao) || 0) / 100));
    const fator = 1 / (1 - sobreposicao);
    const alturaManual = Number(config.alturaDaFaixa) > 0 ? Number(config.alturaDaFaixa) : 0;

    const espacamento = alturaManual
      ? retangulo.altura / Math.max(1, grupos.length)
      : retangulo.altura / (grupos.length + fator - 1);
    const alturaDaFaixa = alturaManual || espacamento * fator;
    const folgaDoTopo = Math.max(0, alturaDaFaixa - espacamento);

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Densidades ----------
    const curvas = grupos.map((grupo) => {
      const { curva, maximo } = densidadePorKernel({
        valores: grupo.valores,
        largura: Number(config.suavizacao) > 0 ? Number(config.suavizacao) : undefined,
        pontos: Number(config.pontosDaCurva) || 96,
        intervalo: [grupo.resumo.minimo, grupo.resumo.maximo],
      });
      return { grupo, curva, maximo };
    });

    const picoDeReferencia = config.alturaComparavel !== false
      ? Math.max(...curvas.map((c) => c.maximo))
      : null;

    // ---------- Cores ----------
    const paleta = coresDaPaleta(config.paleta);
    const interpolar = interpoladorContinuo(config.escalaDeCor);
    const corDe = (indice) => {
      if (config.colorirPor === 'unica') return config.corUnica || paleta[0];
      if (config.colorirPor === 'paleta') return paleta[indice % paleta.length];
      return interpolar(grupos.length > 1 ? indice / (grupos.length - 1) : 0.5);
    };

    // ---------- Faixas ----------
    // De baixo para cima: a curva da frente precisa cobrir a de trás.
    const faixas = [];
    for (let i = grupos.length - 1; i >= 0; i--) {
      const { grupo, curva, maximo } = curvas[i];
      const linhaDeBase = retangulo.cima + folgaDoTopo + espacamento * (i + 1);
      const pico = picoDeReferencia || maximo;
      const altura = (densidade) => (pico > 0 ? (densidade / pico) * alturaDaFaixa : 0);
      const cor = corDe(i);

      const desenharArea = geradorDeArea({
        x: (p) => escalaX(p.x),
        y0: () => linhaDeBase,
        y1: (p) => linhaDeBase - altura(p.densidade),
        curva: 'monotone',
      });

      const faixa = criarSvgEl('path', {
        pai: svg,
        classe: 'rl-faixa',
        atributos: {
          d: desenharArea(curva) || '',
          fill: comOpacidade(cor, 0.75),
        },
      });
      faixas[i] = faixa;

      if (config.mostrarContorno !== false) {
        const desenharLinha = geradorDeLinha({
          x: (p) => escalaX(p.x),
          y: (p) => linhaDeBase - altura(p.densidade),
          curva: 'monotone',
        });
        criarSvgEl('path', {
          pai: svg,
          classe: 'rl-contorno',
          atributos: { d: desenharLinha(curva) || '', stroke: cor, 'stroke-width': 1.2 },
        });
      }

      if (config.mostrarMediana !== false) {
        const x = escalaX(grupo.resumo.mediana);
        criarSvgEl('line', {
          pai: svg,
          classe: 'rl-marca',
          atributos: {
            x1: x, x2: x,
            y1: linhaDeBase,
            y2: linhaDeBase - altura(densidadeEm(curva, grupo.resumo.mediana)),
            stroke: tema.fundo, 'stroke-width': 1.5, opacity: 0.8,
          },
        });
      }

      // Nome da categoria, à esquerda, na linha de base.
      const rotulo = criarSvgEl('text', {
        pai: svg,
        classe: 'rl-rotulo',
        atributos: {
          x: retangulo.esquerda - 8,
          y: linhaDeBase - 2,
          'text-anchor': 'end',
          'font-size': fonte,
          fill: grupo.resumo.n < MINIMO_CONFIAVEL ? tema.atencao : tema.texto,
        },
      });
      definirTexto(
        rotulo,
        rotuloDaCategoria(grupo, config) + (grupo.resumo.n < MINIMO_CONFIAVEL ? ' *' : '')
      );
    }

    // ---------- Eixo X ----------
    // Desenhado por último para ficar por cima das faixas.
    desenharEixos({
      svg,
      escalaX,
      escalaY: escalaNumerica({
        valores: [0, 1],
        intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
        config: {},
        eixo: 'Y',
      }),
      area: retangulo,
      config,
      tema,
      formatarX: formatar,
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'rl-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      `Densidade por kernel gaussiano${
        config.alturaComparavel !== false ? ', alturas comparáveis entre categorias' : ', cada curva na própria altura'
      }.` + (preparo.pequenos.length ? ` * = menos de ${MINIMO_CONFIAVEL} observações.` : '')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    grupos.forEach((grupo, indice) => {
      const faixa = faixas[indice];
      if (!faixa || !tooltip) return;

      ctx.eventos.on(faixa, 'pointerenter', (ev) => {
        faixas.forEach((outra, i) => outra && outra.classList.toggle('rl-apagada', i !== indice));
        tooltip.mostrar(
          { titulo: grupo.rotulo, linhas: linhasDeResumo(grupo, formatar, corDe(indice)) },
          ev.clientX,
          ev.clientY
        );
      });
      ctx.eventos.on(faixa, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
      ctx.eventos.on(faixa, 'pointerleave', () => {
        faixas.forEach((outra) => outra && outra.classList.remove('rl-apagada'));
        tooltip.esconder();
      });
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/** Densidade estimada no ponto mais próximo de x na curva. */
function densidadeEm(curva, x) {
  let melhor = 0;
  let menor = Infinity;
  for (const ponto of curva) {
    const d = Math.abs(ponto.x - x);
    if (d < menor) {
      menor = d;
      melhor = ponto.densidade;
    }
  }
  return melhor;
}
