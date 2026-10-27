/**
 * candlestick_ohlc — "Candlestick / OHLC".
 *
 * Quatro medidas por período (abertura, máxima, mínima, fechamento) viram
 * uma vela: o corpo vai da abertura ao fechamento, o pavio da mínima à
 * máxima. Verde quando fechou acima da abertura, vermelho quando abaixo.
 *
 * Decisão que separa este gráfico dos demais: **o eixo Y não começa em
 * zero**, e isso é de propósito. Num gráfico de preço o que importa é a
 * variação, e forçar o zero achataria todas as velas numa faixa fina.
 *
 * O volume, quando existe, vai numa faixa embaixo com escala PRÓPRIA —
 * misturar volume e preço no mesmo eixo não quer dizer nada.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica, escalaDePonto } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { formatadorDeValueFormat, formatarData, criarFormatadorNumerico, formatarPercentual } from '../../core/format.js';
import { comOpacidade } from '../../core/theme.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';

const CSS = `
.ck-area{position:relative;width:100%;height:100%;}
.ck-canvas{position:absolute;left:0;top:0;}
.ck-svg{position:absolute;left:0;top:0;pointer-events:none;}
.ck-guia{pointer-events:none;}
`;

/** Acima disso o SVG fica lento; o canvas aguenta sem reclamar. */
const LIMITE_PARA_CANVAS = 400;

export default defineViz({
  id: 'candlestick_ohlc',
  label: 'Candlestick / OHLC',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        estiloDaVela: {
          type: 'string',
          label: 'Estilo',
          section: 'Velas',
          display: 'select',
          default: 'vela',
          values: listaDeValores([
            { rotulo: 'Candlestick (corpo preenchido)', valor: 'vela' },
            { rotulo: 'Barras OHLC (traços laterais)', valor: 'ohlc' },
            { rotulo: 'Só o fechamento (linha)', valor: 'linha' },
          ]),
        },
        corDeAlta: {
          type: 'string',
          label: 'Cor de alta (fechou acima da abertura)',
          section: 'Velas',
          display: 'color',
          default: '#16A34A',
        },
        corDeBaixa: {
          type: 'string',
          label: 'Cor de baixa',
          section: 'Velas',
          display: 'color',
          default: '#DC2626',
        },
        velaDeAltaVazada: {
          type: 'boolean',
          label: 'Vela de alta só com contorno (padrão japonês)',
          section: 'Velas',
          default: false,
        },
        larguraDaVela: {
          type: 'number',
          label: 'Largura da vela (% do espaço disponível)',
          section: 'Velas',
          display: 'range',
          min: 10,
          max: 100,
          step: 5,
          default: 70,
        },
        mostrarVolume: {
          type: 'boolean',
          label: 'Mostrar volume numa faixa embaixo',
          section: 'Volume',
          default: true,
        },
        alturaDoVolume: {
          type: 'number',
          label: 'Altura da faixa de volume (% do gráfico)',
          section: 'Volume',
          display: 'range',
          min: 10,
          max: 50,
          step: 5,
          default: 22,
        },
        mostrarMediaMovel: {
          type: 'number',
          label: 'Média móvel de N períodos (0 = não mostrar)',
          section: 'Velas',
          display: 'range',
          min: 0,
          max: 60,
          step: 1,
          default: 0,
        },
        corDaMediaMovel: {
          type: 'string',
          label: 'Cor da média móvel',
          section: 'Velas',
          display: 'color',
          default: '#2563EB',
        },
      }
    ),
    {
      // Num gráfico de preço, forçar o zero achata tudo numa faixa fina.
      gradeEixoY: true,
      tituloEixoY: '',
    }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 4, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    if (medidas.length < 4) return {};
    const adivinhar = (padrao, posicao) =>
      (medidas.find((m) => padrao.test(m.rotulo) || padrao.test(m.nome)) || medidas[posicao] || medidas[0]).nome;

    return {
      ...opcaoDeEscolhaDeCampo('campoDaAbertura', 'Abertura', medidas, {
        secao: 'Dados',
        padrao: adivinhar(/abert|open/i, 0),
      }),
      ...opcaoDeEscolhaDeCampo('campoDaMaxima', 'Máxima', medidas, {
        secao: 'Dados',
        padrao: adivinhar(/m[áa]x|high/i, 1),
      }),
      ...opcaoDeEscolhaDeCampo('campoDaMinima', 'Mínima', medidas, {
        secao: 'Dados',
        padrao: adivinhar(/m[íi]n|low/i, 2),
      }),
      ...opcaoDeEscolhaDeCampo('campoDoFechamento', 'Fechamento', medidas, {
        secao: 'Dados',
        padrao: adivinhar(/fech|close/i, 3),
      }),
      ...opcaoDeEscolhaDeCampo('campoDoVolume', 'Volume', medidas, {
        secao: 'Volume',
        incluirNenhum: true,
        padrao: adivinhar(/volume|qtd|quant/i, 4) || '',
      }),
    };
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const campos = escolherCampos(modelo, config);
    if (!campos) {
      ctx.mostrarVazio(
        'Este gráfico precisa de quatro medidas: abertura, máxima, mínima e fechamento. ' +
          'Escolha-as na seção Dados.'
      );
      return;
    }

    const campoDoPeriodo = modelo.dimensoes[0];
    const periodos = [];
    let foraDeOrdem = 0;

    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      const abertura = modelo.valorNumerico(linha, campos.abertura.nome);
      const maxima = modelo.valorNumerico(linha, campos.maxima.nome);
      const minima = modelo.valorNumerico(linha, campos.minima.nome);
      const fechamento = modelo.valorNumerico(linha, campos.fechamento.nome);
      if (abertura === null || maxima === null || minima === null || fechamento === null) continue;

      // Máxima abaixo da mínima é dado inconsistente, não erro de desenho:
      // contamos e avisamos uma vez só, sem jogar a linha fora.
      if (maxima < minima) foraDeOrdem += 1;

      periodos.push({
        indice: i,
        chave: String(modelo.valorBruto(linha, campoDoPeriodo.nome)),
        rotulo: modelo.texto(linha, campoDoPeriodo.nome, undefined, ''),
        bruto: modelo.valorBruto(linha, campoDoPeriodo.nome),
        abertura,
        maxima: Math.max(maxima, minima),
        minima: Math.min(maxima, minima),
        fechamento,
        volume: campos.volume ? modelo.valorNumerico(linha, campos.volume.nome) : null,
        subiu: fechamento >= abertura,
      });
    }

    if (periodos.length < 2) {
      ctx.mostrarVazio('São necessários pelo menos dois períodos com as quatro medidas preenchidas.');
      return;
    }
    if (foraDeOrdem) {
      ctx.avisar(`${foraDeOrdem} período(s) têm máxima menor que a mínima; os dois valores foram trocados.`);
    }
    const descartados = modelo.linhas.length - periodos.length;
    if (descartados > 0) ctx.avisar(`${descartados} período(s) sem as quatro medidas ficaram de fora.`);

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'ck');
    const area = criarEl('div', { classe: 'ck-area', pai: raiz });

    const formatarPreco = formatadorDeValueFormat(campos.fechamento.valueFormat, { casas: 2 });
    const formatarVolume = criarFormatadorNumerico({ estilo: 'compacto', casas: 1 });
    const ehData = campoDoPeriodo.ehData;
    const rotuloDoPeriodo = (p) => (ehData ? formatarData(p.bruto, config.formatoDeData || 'auto') : p.rotulo);

    // ---------- Geometria ----------
    const temVolume = config.mostrarVolume !== false && campos.volume;
    const fracaoDoVolume = temVolume ? Math.max(0.1, Math.min(0.5, (Number(config.alturaDoVolume) || 22) / 100)) : 0;

    const margens = calcularMargens({
      rotulosY: periodos.map((p) => formatarPreco(p.maxima)),
      rotulosX: periodos.map(rotuloDoPeriodo),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const alturaDoVolume = retangulo.altura * fracaoDoVolume;
    const espacoEntreFaixas = temVolume ? 8 : 0;
    const alturaDoPreco = retangulo.altura - alturaDoVolume - espacoEntreFaixas;

    const escalaX = escalaDePonto({
      dominio: periodos.map((p) => p.chave),
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      preenchimento: 0.5,
    });

    // O domínio sai de TODAS as máximas e mínimas, não só dos fechamentos:
    // senão os pavios saem cortados.
    const escalaY = escalaNumerica({
      valores: periodos.flatMap((p) => [p.minima, p.maxima]),
      intervalo: [retangulo.cima + alturaDoPreco, retangulo.cima],
      config,
      eixo: 'Y',
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'ck-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    desenharEixos({
      svg,
      escalaX,
      escalaY,
      area: { ...retangulo, altura: alturaDoPreco },
      config,
      tema,
      rotulosDeBanda: periodos.map((p) => p.chave),
      formatarX: (chave) => {
        const p = periodos.find((item) => item.chave === chave);
        return p ? rotuloDoPeriodo(p) : String(chave);
      },
      formatarY: formatarPreco,
    });

    // ---------- Velas ----------
    const passo = retangulo.largura / periodos.length;
    const larguraDaVela = Math.max(1, passo * ((Number(config.larguraDaVela) || 70) / 100));
    const corDeAlta = config.corDeAlta || tema.positivo;
    const corDeBaixa = config.corDeBaixa || tema.negativo;

    const usarCanvas = periodos.length > LIMITE_PARA_CANVAS;
    let pincel = null;
    if (usarCanvas) {
      const canvas = criarEl('canvas', { classe: 'ck-canvas' });
      area.insertBefore(canvas, svg);
      pincel = prepararCanvas(canvas, largura, altura).ctx;
      if (!pincel) ctx.avisar('O navegador não forneceu contexto 2D; as velas não foram desenhadas.');
    }

    for (const periodo of periodos) {
      const x = escalaX(periodo.chave);
      const cor = periodo.subiu ? corDeAlta : corDeBaixa;
      periodo.x = x;

      const yMax = escalaY(periodo.maxima);
      const yMin = escalaY(periodo.minima);
      const yAbertura = escalaY(periodo.abertura);
      const yFechamento = escalaY(periodo.fechamento);

      if (config.estiloDaVela === 'linha') continue;

      if (pincel) {
        desenharNoCanvas(pincel, { periodo, x, yMax, yMin, yAbertura, yFechamento, cor, larguraDaVela, config });
        continue;
      }

      if (config.estiloDaVela === 'ohlc') {
        criarSvgEl('line', {
          pai: svg,
          atributos: { x1: x, x2: x, y1: yMax, y2: yMin, stroke: cor, 'stroke-width': 1.5 },
        });
        criarSvgEl('line', {
          pai: svg,
          atributos: {
            x1: x - larguraDaVela / 2, x2: x, y1: yAbertura, y2: yAbertura,
            stroke: cor, 'stroke-width': 1.5,
          },
        });
        criarSvgEl('line', {
          pai: svg,
          atributos: {
            x1: x, x2: x + larguraDaVela / 2, y1: yFechamento, y2: yFechamento,
            stroke: cor, 'stroke-width': 1.5,
          },
        });
        continue;
      }

      // Candlestick: pavio + corpo.
      criarSvgEl('line', {
        pai: svg,
        atributos: { x1: x, x2: x, y1: yMax, y2: yMin, stroke: cor, 'stroke-width': 1 },
      });
      const topo = Math.min(yAbertura, yFechamento);
      const alturaDoCorpo = Math.max(1, Math.abs(yFechamento - yAbertura));
      const vazada = config.velaDeAltaVazada && periodo.subiu;
      criarSvgEl('rect', {
        pai: svg,
        atributos: {
          x: x - larguraDaVela / 2,
          y: topo,
          width: larguraDaVela,
          height: alturaDoCorpo,
          fill: vazada ? tema.fundo : cor,
          stroke: cor,
          'stroke-width': 1,
        },
      });
    }

    // ---------- Linha de fechamento / média móvel ----------
    if (config.estiloDaVela === 'linha') {
      desenharLinha(svg, periodos.map((p) => [escalaX(p.chave), escalaY(p.fechamento)]), tema.destaque, 1.5);
    }

    const janela = Number(config.mostrarMediaMovel) || 0;
    if (janela > 1) {
      const medias = mediaMovel(periodos.map((p) => p.fechamento), janela);
      const pontos = [];
      periodos.forEach((p, i) => {
        if (medias[i] !== null) pontos.push([escalaX(p.chave), escalaY(medias[i])]);
      });
      if (pontos.length > 1) {
        desenharLinha(svg, pontos, config.corDaMediaMovel || tema.destaque, 1.5);
      }
      periodos.forEach((p, i) => {
        p.mediaMovel = medias[i];
      });
    }

    // ---------- Volume ----------
    if (temVolume) {
      const yVolume = retangulo.cima + alturaDoPreco + espacoEntreFaixas;
      const volumes = periodos.map((p) => p.volume).filter((v) => v !== null);
      const maiorVolume = volumes.length ? Math.max(...volumes) : 0;

      if (maiorVolume > 0) {
        for (const periodo of periodos) {
          if (periodo.volume === null) continue;
          const h = (periodo.volume / maiorVolume) * alturaDoVolume;
          criarSvgEl('rect', {
            pai: svg,
            atributos: {
              x: periodo.x - larguraDaVela / 2,
              y: yVolume + alturaDoVolume - h,
              width: larguraDaVela,
              height: Math.max(0.5, h),
              fill: comOpacidade(periodo.subiu ? corDeAlta : corDeBaixa, 0.45),
            },
          });
        }
        const rotulo = criarSvgEl('text', {
          pai: svg,
          atributos: {
            x: retangulo.esquerda - 6,
            y: yVolume + 6,
            'text-anchor': 'end',
            'font-size': Math.max(8, tema.tamanhoBase - 2),
            fill: tema.textoSuave,
          },
        });
        definirTexto(rotulo, formatarVolume(maiorVolume));
      }
    }

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const guia = criarSvgEl('line', {
      pai: svg,
      classe: 'ck-guia',
      atributos: {
        y1: retangulo.cima,
        y2: retangulo.cima + retangulo.altura,
        stroke: tema.bordaForte,
        'stroke-width': 1,
        opacity: 0,
      },
    });

    ctx.eventos.on(area, 'pointermove', (ev) => {
      const caixa = area.getBoundingClientRect();
      const x = ev.clientX - caixa.left;
      let alvo = null;
      let menor = Infinity;
      for (const periodo of periodos) {
        const d = Math.abs(periodo.x - x);
        if (d < menor) {
          menor = d;
          alvo = periodo;
        }
      }
      if (!alvo || menor > passo * 2) {
        guia.setAttribute('opacity', 0);
        if (tooltip) tooltip.esconder();
        return;
      }
      guia.setAttribute('x1', alvo.x);
      guia.setAttribute('x2', alvo.x);
      guia.setAttribute('opacity', 0.6);

      if (!tooltip) return;
      const variacao = alvo.abertura ? (alvo.fechamento - alvo.abertura) / alvo.abertura : null;
      const linhas = [
        { rotulo: 'Abertura', valor: formatarPreco(alvo.abertura) },
        { rotulo: 'Máxima', valor: formatarPreco(alvo.maxima) },
        { rotulo: 'Mínima', valor: formatarPreco(alvo.minima) },
        {
          rotulo: 'Fechamento',
          valor: formatarPreco(alvo.fechamento),
          cor: alvo.subiu ? corDeAlta : corDeBaixa,
        },
      ];
      if (variacao !== null) {
        linhas.push({ rotulo: 'Variação', valor: formatarPercentual(variacao, 2) });
      }
      if (alvo.volume !== null) linhas.push({ rotulo: 'Volume', valor: formatarVolume(alvo.volume) });
      if (alvo.mediaMovel !== null && alvo.mediaMovel !== undefined) {
        linhas.push({ rotulo: `Média ${janela}`, valor: formatarPreco(alvo.mediaMovel) });
      }
      tooltip.mostrar({ titulo: rotuloDoPeriodo(alvo), linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      guia.setAttribute('opacity', 0);
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(area, 'click', (ev) => {
      const caixa = area.getBoundingClientRect();
      const x = ev.clientX - caixa.left;
      const alvo = periodos.reduce((melhor, p) =>
        !melhor || Math.abs(p.x - x) < Math.abs(melhor.x - x) ? p : melhor, null);
      if (!alvo) return;
      const celula = modelo.celula(modelo.linhas[alvo.indice], campoDoPeriodo.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function escolherCampos(modelo, config) {
  const achar = (nome, posicao) =>
    modelo.medidas.find((m) => m.nome === nome) || modelo.medidas[posicao] || null;

  const abertura = achar(config.campoDaAbertura, 0);
  const maxima = achar(config.campoDaMaxima, 1);
  const minima = achar(config.campoDaMinima, 2);
  const fechamento = achar(config.campoDoFechamento, 3);
  if (!abertura || !maxima || !minima || !fechamento) return null;

  const volume = config.campoDoVolume
    ? modelo.medidas.find((m) => m.nome === config.campoDoVolume) || null
    : modelo.medidas[4] || null;

  return { abertura, maxima, minima, fechamento, volume };
}

/** Média móvel simples; os primeiros N-1 períodos ficam nulos. */
export function mediaMovel(valores, janela) {
  const saida = new Array(valores.length).fill(null);
  if (janela < 2) return saida;
  let soma = 0;
  for (let i = 0; i < valores.length; i++) {
    soma += valores[i];
    if (i >= janela) soma -= valores[i - janela];
    if (i >= janela - 1) saida[i] = soma / janela;
  }
  return saida;
}

function desenharLinha(svg, pontos, cor, espessura) {
  if (pontos.length < 2) return;
  const d = pontos.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');
  criarSvgEl('path', {
    pai: svg,
    atributos: { d, fill: 'none', stroke: cor, 'stroke-width': espessura, 'stroke-linejoin': 'round' },
  });
}

function desenharNoCanvas(pincel, { periodo, x, yMax, yMin, yAbertura, yFechamento, cor, larguraDaVela, config }) {
  pincel.strokeStyle = cor;
  pincel.fillStyle = cor;
  pincel.lineWidth = 1;

  pincel.beginPath();
  pincel.moveTo(x, yMax);
  pincel.lineTo(x, yMin);
  pincel.stroke();

  if (config.estiloDaVela === 'ohlc') {
    pincel.beginPath();
    pincel.moveTo(x - larguraDaVela / 2, yAbertura);
    pincel.lineTo(x, yAbertura);
    pincel.moveTo(x, yFechamento);
    pincel.lineTo(x + larguraDaVela / 2, yFechamento);
    pincel.stroke();
    return;
  }

  const topo = Math.min(yAbertura, yFechamento);
  const alturaDoCorpo = Math.max(1, Math.abs(yFechamento - yAbertura));
  if (config.velaDeAltaVazada && periodo.subiu) {
    pincel.strokeRect(x - larguraDaVela / 2, topo, larguraDaVela, alturaDoCorpo);
  } else {
    pincel.fillRect(x - larguraDaVela / 2, topo, larguraDaVela, alturaDoCorpo);
  }
}
