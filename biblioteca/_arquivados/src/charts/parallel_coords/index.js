/**
 * parallel_coords — "Coordenadas Paralelas".
 *
 * Um eixo vertical por medida, uma LINHA QUEBRADA por registro cruzando
 * todos eles. É o gráfico para achar padrão em dados de muitas dimensões:
 * registros parecidos desenham linhas parecidas, e um grupo coerente
 * aparece como um feixe.
 *
 * Três coisas que parecem defeito e não são — mas precisam ser ditas:
 *
 * 1. **Cada eixo tem a própria escala.** As medidas têm unidades
 *    diferentes; o que se lê é o PADRÃO das linhas, não a altura absoluta.
 *    Comparar a altura num eixo com a altura em outro não significa nada,
 *    e isso vai escrito na tela.
 * 2. **A ordem dos eixos muda o que se enxerga.** Só se vê relação entre
 *    eixos ADJACENTES: dois eixos nas pontas podem ser fortemente
 *    correlacionados sem que nada apareça. Por isso existe a ordenação
 *    automática, que põe lado a lado os pares mais correlacionados — e a
 *    ordem usada é declarada.
 * 3. **Linhas sobrepostas viram mancha.** Opacidade baixa por padrão, e a
 *    contagem do que está desenhado sempre na tela.
 *
 * A interação que faz o gráfico valer é a ESCOVAÇÃO: arrastar num eixo
 * seleciona uma faixa e apaga quem não passa por ela. Sem isso, com
 * milhares de linhas, o gráfico é só textura.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { comOpacidade, coresDaPaleta, interpoladorContinuo, opcoesDeEscalaContinua } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { habilitarBrush } from '../../core/interaction.js';
import { correlacaoDePearson, limparEOrdenar, quantil } from '../../core/estatistica.js';
import { lerLinhasCompletas, MINIMO_PARA_INFERENCIA } from '../_dispersao/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.pc-area{position:relative;width:100%;height:100%;overflow:hidden;touch-action:none;}
.pc-canvas{position:absolute;left:0;top:0;}
.pc-svg{position:absolute;left:0;top:0;}
.pc-eixo{pointer-events:none;}
.pc-nome{pointer-events:none;font-weight:600;}
.pc-marca{pointer-events:none;}
.pc-selecao{pointer-events:none;}
.pc-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso o SVG não aguenta uma linha por registro. */
const LIMITE_PARA_CANVAS = 400;

/** Acima disso nem o canvas desenha em tempo razoável a cada escovação. */
const MAXIMO_DE_REGISTROS = 50000;

/** Mais eixos que isso e não sobra largura entre eles para ver o padrão. */
const MAXIMO_DE_EIXOS = 12;

export default defineViz({
  id: 'parallel_coords',
  label: 'Coordenadas Paralelas',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        ordemDosEixos: {
          type: 'string',
          label: 'Ordem dos eixos',
          section: 'Eixos',
          display: 'select',
          default: 'correlacao',
          values: listaDeValores([
            { rotulo: 'Automática: pares correlacionados lado a lado', valor: 'correlacao' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
          ]),
        },
        escalaDoEixo: {
          type: 'string',
          label: 'Escala de cada eixo',
          section: 'Eixos',
          display: 'select',
          default: 'linear',
          values: listaDeValores([
            { rotulo: 'Linear (do mínimo ao máximo da medida)', valor: 'linear' },
            { rotulo: 'Por quantil (espalha, mas distorce distâncias)', valor: 'quantil' },
          ]),
        },
        inverterEixos: {
          type: 'boolean',
          label: 'Maior valor embaixo',
          section: 'Eixos',
          default: false,
        },
        opacidadeDaLinha: {
          type: 'number',
          label: 'Opacidade das linhas',
          section: 'Formato',
          display: 'range',
          min: 0.02,
          max: 1,
          step: 0.02,
          default: 0.18,
        },
        espessuraDaLinha: {
          type: 'number',
          label: 'Espessura das linhas',
          section: 'Formato',
          display: 'range',
          min: 0.5,
          max: 4,
          step: 0.5,
          default: 1,
        },
        colorirPor: {
          type: 'string',
          label: 'Colorir as linhas por',
          section: 'Cor',
          display: 'select',
          default: 'primeiro',
          values: listaDeValores([
            { rotulo: 'Valor no primeiro eixo', valor: 'primeiro' },
            { rotulo: 'Valor no último eixo', valor: 'ultimo' },
            { rotulo: 'Cor única', valor: 'unica' },
          ]),
        },
        escalaDeCor: {
          type: 'string',
          label: 'Paleta contínua',
          section: 'Cor',
          display: 'select',
          default: 'viridis',
          values: opcoesDeEscalaContinua(),
        },
        corUnica: {
          type: 'string',
          label: 'Cor única',
          section: 'Cor',
          display: 'color',
          default: '',
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    for (const medida of modelo.medidas) {
      saida[`usar_${medida.nome}`] = {
        type: 'boolean',
        label: `Incluir "${medida.rotuloCurto}"`,
        section: 'Medidas',
        default: true,
      };
    }
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    if (dimensoes.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoRotulo', 'Dimensão que identifica a linha', dimensoes, {
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

    let medidas = modelo.medidas.filter((m) => config[`usar_${m.nome}`] !== false);
    if (medidas.length < 2) medidas = modelo.medidas.slice();

    if (medidas.length < 2) {
      ctx.mostrarVazio(
        'Coordenadas paralelas precisam de pelo menos DUAS medidas — uma por eixo. ' +
          'Traga mais medidas no Explore.'
      );
      return;
    }
    if (medidas.length > MAXIMO_DE_EIXOS) {
      ctx.avisar(
        `A consulta tem ${medidas.length} medidas. Mostrando as ${MAXIMO_DE_EIXOS} primeiras: ` +
          'acima disso não sobra largura entre os eixos para o padrão aparecer.'
      );
      medidas = medidas.slice(0, MAXIMO_DE_EIXOS);
    }
    if (modelo.linhas.length > MAXIMO_DE_REGISTROS) {
      ctx.mostrarVazio(
        `A consulta tem ${modelo.linhas.length.toLocaleString('pt-BR')} linhas, acima do limite de ` +
          `${MAXIMO_DE_REGISTROS.toLocaleString('pt-BR')}. Cada escovação redesenha tudo, e aí nem ` +
          'o canvas dá conta. Filtre ou agrupe no Explore.'
      );
      return;
    }

    const campoDoRotulo =
      config.campoDoRotulo === ''
        ? null
        : modelo.dimensoes.find((d) => d.nome === config.campoDoRotulo) || modelo.dimensoes[0] || null;

    const { linhas, descartadas } = lerLinhasCompletas({ modelo, medidas, campoDoRotulo });
    if (linhas.length < 2) {
      ctx.mostrarVazio(
        'Nenhuma (ou quase nenhuma) linha tem valor em TODAS as medidas escolhidas. ' +
          'Uma linha quebrada precisa de um ponto em cada eixo — reduza as medidas ou ' +
          'verifique os nulos no Explore.'
      );
      return;
    }
    if (descartadas > 0) {
      ctx.avisar(
        `${descartadas} linha(s) sem valor em alguma das medidas ficaram de fora: uma linha ` +
          'quebrada precisa de um ponto em cada eixo.'
      );
    }

    // ---------- Ordem dos eixos ----------
    const ordem = ordenarEixos({ medidas, linhas, modo: config.ordemDosEixos });
    const eixos = ordem.map((indice) => ({
      indice,
      medida: medidas[indice],
      valores: linhas.map((l) => l.valores[indice]),
    }));

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'pc');
    const area = criarEl('div', { classe: 'pc-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatadores = eixos.map((e) =>
      formatadorDeValueFormat(e.medida.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 })
    );

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const margemDeCima = fonte + 18;
    const margemDeBaixo = 26;
    const margemLateral = Math.min(90, Math.max(40, largura / (eixos.length * 2)));

    const alturaUtil = Math.max(40, altura - margemDeCima - margemDeBaixo);
    const passo = eixos.length > 1 ? (largura - margemLateral * 2) / (eixos.length - 1) : 0;
    const xDoEixo = (i) => margemLateral + i * passo;

    const inverter = config.inverterEixos === true;
    for (const eixo of eixos) {
      eixo.escala = montarEscalaDeEixo({
        valores: eixo.valores,
        modo: config.escalaDoEixo || 'linear',
      });
      eixo.y = (valor) => {
        const p = eixo.escala.posicao(valor);
        if (p === null) return null;
        return inverter ? margemDeCima + p * alturaUtil : margemDeCima + (1 - p) * alturaUtil;
      };
    }

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'pc-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Cor ----------
    const modoDaCor = config.colorirPor || 'primeiro';
    const interpolador = interpoladorContinuo(config.escalaDeCor);
    const corUnica = config.corUnica || coresDaPaleta(config.paleta)[0];
    const eixoDaCor = modoDaCor === 'ultimo' ? eixos[eixos.length - 1] : eixos[0];
    const corDaLinha = (registro) => {
      if (modoDaCor === 'unica') return corUnica;
      const p = eixoDaCor.escala.posicao(registro.valores[eixoDaCor.indice]);
      return p === null ? corUnica : interpolador(p);
    };

    // ---------- Escovação ----------
    // `estado.filtros[i] = [p0, p1]` em posição NORMALIZADA (0 a 1), não em
    // pixels: assim o filtro sobrevive a redimensionamento e a troca de
    // escala, que é o que o usuário espera de uma seleção.
    if (!ctx.estado.filtros) ctx.estado.filtros = {};
    const filtros = ctx.estado.filtros;

    const passaNosFiltros = (registro) =>
      eixos.every((eixo, i) => {
        const faixa = filtros[i];
        if (!faixa) return true;
        const p = eixo.escala.posicao(registro.valores[eixo.indice]);
        return p !== null && p >= faixa[0] - 1e-9 && p <= faixa[1] + 1e-9;
      });

    let selecionadas = linhas.filter(passaNosFiltros);

    // ---------- Desenho das linhas ----------
    const opacidade = Number(config.opacidadeDaLinha) || 0.18;
    const espessura = Number(config.espessuraDaLinha) || 1;
    const usarCanvas = linhas.length > LIMITE_PARA_CANVAS;

    let pincel = null;
    let grupoDeLinhas = null;

    if (usarCanvas) {
      const canvas = criarEl('canvas', { classe: 'pc-canvas' });
      area.insertBefore(canvas, svg);
      const preparado = prepararCanvas(canvas, largura, altura);
      pincel = preparado.ctx;
      if (!pincel) ctx.avisar('O navegador não forneceu contexto 2D; as linhas não foram desenhadas.');
    } else {
      grupoDeLinhas = criarSvgEl('g', { pai: svg, classe: 'pc-linhas' });
    }

    const desenharLinhas = () => {
      const apagadas = linhas.filter((l) => !selecionadas.includes(l));

      if (pincel) {
        pincel.clearRect(0, 0, largura, altura);
        // As apagadas vão primeiro e bem fracas: elas dão o contexto do
        // todo contra o qual a seleção é lida.
        if (apagadas.length && apagadas.length !== linhas.length) {
          pincel.globalAlpha = Math.min(0.08, opacidade * 0.4);
          pincel.strokeStyle = tema.textoSuave;
          pincel.lineWidth = espessura;
          for (const registro of apagadas) tracarNoCanvas(pincel, registro, eixos, xDoEixo);
        }
        pincel.globalAlpha = opacidade;
        pincel.lineWidth = espessura;
        for (const registro of selecionadas) {
          pincel.strokeStyle = corDaLinha(registro);
          tracarNoCanvas(pincel, registro, eixos, xDoEixo);
        }
        pincel.globalAlpha = 1;
        return;
      }

      if (!grupoDeLinhas) return;
      while (grupoDeLinhas.firstChild) grupoDeLinhas.removeChild(grupoDeLinhas.firstChild);
      for (const registro of linhas) {
        const ativa = selecionadas.includes(registro);
        criarSvgEl('path', {
          pai: grupoDeLinhas,
          classe: ativa ? 'pc-linha' : 'pc-linha-apagada',
          atributos: {
            d: caminhoDoRegistro(registro, eixos, xDoEixo),
            fill: 'none',
            stroke: ativa ? corDaLinha(registro) : tema.textoSuave,
            'stroke-width': espessura,
            opacity: ativa ? opacidade : Math.min(0.08, opacidade * 0.4),
          },
        });
      }
    };

    // ---------- Eixos ----------
    const camadaDeSelecao = criarSvgEl('g', { pai: svg, classe: 'pc-selecoes' });

    eixos.forEach((eixo, i) => {
      const x = xDoEixo(i);
      criarSvgEl('line', {
        pai: svg,
        classe: 'pc-eixo',
        atributos: {
          x1: x, x2: x, y1: margemDeCima, y2: margemDeCima + alturaUtil,
          stroke: tema.bordaForte, 'stroke-width': 1,
        },
      });

      for (const marca of eixo.escala.marcas) {
        const y = inverter
          ? margemDeCima + marca.p * alturaUtil
          : margemDeCima + (1 - marca.p) * alturaUtil;
        criarSvgEl('line', {
          pai: svg,
          classe: 'pc-eixo',
          atributos: { x1: x - 3, x2: x + 3, y1: y, y2: y, stroke: tema.borda, 'stroke-width': 1 },
        });
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'pc-eixo',
          atributos: {
            x: x + 6,
            y,
            'dominant-baseline': 'central',
            'font-size': fonte - 2,
            fill: tema.textoSuave,
          },
        });
        definirTexto(texto, formatadores[i](marca.valor));
      }

      const nome = criarSvgEl('text', {
        pai: svg,
        classe: 'pc-nome',
        atributos: {
          x,
          y: fonte + 2,
          'text-anchor': i === 0 ? 'start' : i === eixos.length - 1 ? 'end' : 'middle',
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      definirTexto(nome, truncar(eixo.medida.rotuloCurto, 18));
    });

    const desenharSelecoes = () => {
      while (camadaDeSelecao.firstChild) camadaDeSelecao.removeChild(camadaDeSelecao.firstChild);
      eixos.forEach((_, i) => {
        const faixa = filtros[i];
        if (!faixa) return;
        const x = xDoEixo(i);
        const yA = inverter
          ? margemDeCima + faixa[0] * alturaUtil
          : margemDeCima + (1 - faixa[0]) * alturaUtil;
        const yB = inverter
          ? margemDeCima + faixa[1] * alturaUtil
          : margemDeCima + (1 - faixa[1]) * alturaUtil;
        criarSvgEl('rect', {
          pai: camadaDeSelecao,
          classe: 'pc-selecao',
          atributos: {
            x: x - 8,
            y: Math.min(yA, yB),
            width: 16,
            height: Math.abs(yB - yA),
            fill: comOpacidade(tema.destaque, 0.25),
            stroke: tema.destaque,
            'stroke-width': 1,
          },
        });
      });
    };

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'pc-nota', pai: area });
    nota.style.color = tema.textoSuave;

    const atualizarNota = () => {
      const comFiltro = Object.keys(filtros).length > 0;
      definirTexto(
        nota,
        [
          comFiltro
            ? `${selecionadas.length.toLocaleString('pt-BR')} de ${linhas.length.toLocaleString('pt-BR')} registros selecionados`
            : `${linhas.length.toLocaleString('pt-BR')} registros`,
          `${eixos.length} eixos · ordem ${nomeDaOrdem(config.ordemDosEixos)}`,
          'cada eixo tem a PRÓPRIA escala: alturas em eixos diferentes não são comparáveis',
          'só se vê relação entre eixos VIZINHOS',
          (config.escalaDoEixo || 'linear') === 'quantil'
            ? 'eixos por quantil: espalham os pontos e distorcem as distâncias'
            : null,
          'arraste sobre um eixo para filtrar; clique para limpar',
        ]
          .filter(Boolean)
          .join(' · ')
      );
    };

    const repintar = () => {
      selecionadas = linhas.filter(passaNosFiltros);
      desenharLinhas();
      desenharSelecoes();
      atualizarNota();
    };

    // ---------- Interação ----------
    habilitarBrush({
      alvo: area,
      eventos: ctx.eventos,
      direcao: 'y',
      aoSelecionar: (retangulo) => {
        const centro = (retangulo.x0 + retangulo.x1) / 2;
        const i = eixoMaisProximo(centro, eixos.length, xDoEixo);
        if (i === null) return;

        const p0 = posicaoNormalizada(retangulo.y0, margemDeCima, alturaUtil, inverter);
        const p1 = posicaoNormalizada(retangulo.y1, margemDeCima, alturaUtil, inverter);
        filtros[i] = [Math.min(p0, p1), Math.max(p0, p1)];
        repintar();
      },
      aoLimpar: () => {
        for (const chave of Object.keys(filtros)) delete filtros[chave];
        repintar();
      },
    });

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixa = area.getBoundingClientRect();
      const x = ev.clientX - caixa.left;
      const i = eixoMaisProximo(x, eixos.length, xDoEixo, passo / 2);
      if (i === null) {
        tooltip.esconder();
        return;
      }
      const eixo = eixos[i];
      const resumo = resumoDoEixo(eixo, selecionadas);
      tooltip.mostrar(
        {
          titulo: eixo.medida.rotuloCurto,
          linhas: [
            { rotulo: 'Mínimo – Máximo', valor: `${formatadores[i](eixo.escala.minimo)} – ${formatadores[i](eixo.escala.maximo)}` },
            { rotulo: 'Na seleção', valor: resumo ? `${formatadores[i](resumo.minimo)} – ${formatadores[i](resumo.maximo)}` : '—' },
            { rotulo: 'Registros', valor: `${selecionadas.length} de ${linhas.length}` },
            ...(filtros[i] ? [{ rotulo: 'Filtro neste eixo', valor: 'ativo (clique para limpar)' }] : []),
            ...(i < eixos.length - 1 && linhas.length >= MINIMO_PARA_INFERENCIA
              ? [
                  {
                    rotulo: `r com ${truncar(eixos[i + 1].medida.rotuloCurto, 14)}`,
                    valor: formatarR(correlacaoEntre(eixo, eixos[i + 1], linhas)),
                  },
                ]
              : []),
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    repintar();
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function nomeDaOrdem(modo) {
  if (modo === 'consulta') return 'da consulta';
  if (modo === 'alfabetica') return 'alfabética';
  return 'automática (pares correlacionados vizinhos)';
}

function formatarR(r) {
  return r === null || !Number.isFinite(r) ? '—' : r.toFixed(3).replace('.', ',');
}

function correlacaoEntre(a, b, linhas) {
  return correlacaoDePearson(
    linhas.map((l) => ({ x: l.valores[a.indice], y: l.valores[b.indice] }))
  );
}

/** Índice do eixo mais próximo de uma posição x (ou null, com tolerância). */
export function eixoMaisProximo(x, quantidade, xDoEixo, tolerancia = Infinity) {
  let melhor = null;
  let menor = Infinity;
  for (let i = 0; i < quantidade; i++) {
    const d = Math.abs(xDoEixo(i) - x);
    if (d < menor) {
      menor = d;
      melhor = i;
    }
  }
  return menor <= tolerancia ? melhor : null;
}

/** Converte uma coordenada y de pixel na posição 0–1 do eixo. */
export function posicaoNormalizada(y, margemDeCima, alturaUtil, inverter) {
  const bruta = (y - margemDeCima) / (alturaUtil || 1);
  const presa = Math.max(0, Math.min(1, bruta));
  return inverter ? presa : 1 - presa;
}

function resumoDoEixo(eixo, selecionadas) {
  const valores = selecionadas
    .map((l) => l.valores[eixo.indice])
    .filter((v) => v !== null && Number.isFinite(v));
  if (!valores.length) return null;
  return { minimo: Math.min(...valores), maximo: Math.max(...valores) };
}

function caminhoDoRegistro(registro, eixos, xDoEixo) {
  const partes = [];
  eixos.forEach((eixo, i) => {
    const y = eixo.y(registro.valores[eixo.indice]);
    if (y === null) return;
    partes.push(`${partes.length ? 'L' : 'M'}${xDoEixo(i).toFixed(2)},${y.toFixed(2)}`);
  });
  return partes.join('');
}

function tracarNoCanvas(pincel, registro, eixos, xDoEixo) {
  pincel.beginPath();
  let primeiro = true;
  eixos.forEach((eixo, i) => {
    const y = eixo.y(registro.valores[eixo.indice]);
    if (y === null) return;
    if (primeiro) {
      pincel.moveTo(xDoEixo(i), y);
      primeiro = false;
    } else {
      pincel.lineTo(xDoEixo(i), y);
    }
  });
  pincel.stroke();
}

/**
 * Escala de UM eixo.
 *
 * Linear vai do mínimo ao máximo DA MEDIDA — é o que faz as alturas serem
 * incomparáveis entre eixos, e é também o que permite ver o padrão quando
 * as unidades são diferentes.
 *
 * Por quantil, a posição é o posto: espalha os pontos quando a
 * distribuição é muito concentrada, ao custo de distorcer as distâncias.
 * A ressalva fica na nota do gráfico.
 */
export function montarEscalaDeEixo({ valores, modo = 'linear' }) {
  const limpos = valores.filter((v) => v !== null && Number.isFinite(v));
  if (!limpos.length) {
    return { minimo: 0, maximo: 1, modo, posicao: () => null, marcas: [] };
  }

  let minimo = Math.min(...limpos);
  let maximo = Math.max(...limpos);
  if (minimo === maximo) {
    const passo = Math.abs(minimo) || 1;
    minimo -= passo / 2;
    maximo += passo / 2;
  }
  const extensao = maximo - minimo;

  if (modo === 'quantil') {
    const ordenados = limparEOrdenar(limpos);
    const posicao = (v) => {
      if (v === null || !Number.isFinite(v)) return null;
      let baixo = 0;
      let alto = ordenados.length;
      while (baixo < alto) {
        const meio = (baixo + alto) >> 1;
        if (ordenados[meio] <= v) baixo = meio + 1;
        else alto = meio;
      }
      return ordenados.length > 1 ? (baixo - 1) / (ordenados.length - 1) : 0.5;
    };
    return {
      minimo,
      maximo,
      modo,
      posicao,
      // As marcas são os quantis: é o que torna a distorção visível em vez
      // de escondida.
      marcas: [0, 0.25, 0.5, 0.75, 1].map((p) => ({ p, valor: quantil(ordenados, p) })),
    };
  }

  return {
    minimo,
    maximo,
    modo,
    posicao: (v) => (v === null || !Number.isFinite(v) ? null : (v - minimo) / extensao),
    marcas: [0, 0.25, 0.5, 0.75, 1].map((p) => ({ p, valor: minimo + extensao * p })),
  };
}

/**
 * Ordem dos eixos.
 *
 * Num gráfico de coordenadas paralelas só se enxerga relação entre eixos
 * ADJACENTES: dois eixos nas pontas podem ter r = 0,95 sem que nada
 * apareça. A ordenação automática resolve isso com uma heurística gulosa —
 * começa pelo par mais correlacionado e vai encadeando o eixo ainda não
 * usado que mais se correlaciona com a ponta atual.
 *
 * É gulosa, não ótima (o problema é o caminho hamiltoniano de peso
 * máximo), mas com até 12 eixos a diferença é irrelevante e o custo é
 * O(k²) em vez de fatorial.
 *
 * @returns {number[]} índices das medidas na ordem de exibição
 */
export function ordenarEixos({ medidas, linhas, modo = 'correlacao' }) {
  const k = medidas.length;
  const indices = Array.from({ length: k }, (_, i) => i);

  if (modo === 'consulta') return indices;
  if (modo === 'alfabetica') {
    return indices.sort((a, b) =>
      medidas[a].rotuloCurto.localeCompare(medidas[b].rotuloCurto, 'pt-BR')
    );
  }

  const forca = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const r = correlacaoDePearson(linhas.map((l) => ({ x: l.valores[i], y: l.valores[j] })));
      // Valor absoluto: uma relação fortemente NEGATIVA é tão visível (e
      // tão informativa) quanto uma positiva quando os eixos são vizinhos.
      const valor = r === null ? 0 : Math.abs(r);
      forca[i][j] = valor;
      forca[j][i] = valor;
    }
  }

  let melhorA = 0;
  let melhorB = 1;
  let maior = -1;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      if (forca[i][j] > maior) {
        maior = forca[i][j];
        melhorA = i;
        melhorB = j;
      }
    }
  }

  const ordem = [melhorA, melhorB];
  const usados = new Set(ordem);
  while (ordem.length < k) {
    const ponta = ordem[ordem.length - 1];
    let proximo = -1;
    let melhor = -1;
    for (let i = 0; i < k; i++) {
      if (usados.has(i)) continue;
      if (forca[ponta][i] > melhor) {
        melhor = forca[ponta][i];
        proximo = i;
      }
    }
    if (proximo < 0) break;
    ordem.push(proximo);
    usados.add(proximo);
  }
  for (let i = 0; i < k; i++) if (!usados.has(i)) ordem.push(i);

  return ordem;
}
