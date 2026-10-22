/**
 * quadrant_scatter — "Dispersão com Quadrantes".
 *
 * Duas medidas nos eixos, uma dimensão identificando cada ponto, e duas
 * linhas divisórias (média, mediana, percentil ou valor fixo) que partem o
 * plano em quatro quadrantes nomeáveis.
 *
 * Os PONTOS vão para um `<canvas>` e todo o resto (eixos, divisórias,
 * rótulos dos quadrantes, rótulos dos pontos) para um `<svg>` por cima.
 * Com 5.000 pontos o canvas desenha numa passada só, enquanto 5.000
 * elementos SVG deixariam o tile travado — e o texto continua sendo texto
 * de verdade, nítido e selecionável.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { escalaNumerica, estatisticas } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade, interpoladorContinuo } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { desenharSimboloNoCanvas } from '../../core/shapes.js';
import { acharMaisProximo } from '../../core/interaction.js';
import {
  montarOpcoes,
  listaDeValores,
  blocoDeCores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';

const CSS = `
.qs-area{position:relative;width:100%;height:100%;}
.qs-canvas{position:absolute;left:0;top:0;}
.qs-svg{position:absolute;left:0;top:0;pointer-events:none;}
.qs-rotulo-quadrante{font-weight:600;opacity:.75;}
.qs-rotulo-ponto{pointer-events:none;}
`;

const MODOS_DE_DIVISORIA = [
  { rotulo: 'Média', valor: 'media' },
  { rotulo: 'Mediana', valor: 'mediana' },
  { rotulo: 'Ponto médio entre mínimo e máximo', valor: 'meio' },
  { rotulo: 'Zero', valor: 'zero' },
  { rotulo: 'Valor fixo', valor: 'fixo' },
  { rotulo: 'Não mostrar', valor: 'nenhum' },
];

/** Onde fica cada quadrante, no sentido horário a partir do topo direito. */
const QUADRANTES = [
  { chave: 'superiorDireito', rotuloPadrao: 'Alto / Alto', x: 1, y: 1 },
  { chave: 'inferiorDireito', rotuloPadrao: 'Alto / Baixo', x: 1, y: 0 },
  { chave: 'inferiorEsquerdo', rotuloPadrao: 'Baixo / Baixo', x: 0, y: 0 },
  { chave: 'superiorEsquerdo', rotuloPadrao: 'Baixo / Alto', x: 0, y: 1 },
];

function opcoes() {
  const porQuadrante = {};
  for (const q of QUADRANTES) {
    porQuadrante[`rotulo_${q.chave}`] = {
      type: 'string',
      label: `Nome do quadrante ${q.rotuloPadrao}`,
      section: 'Quadrantes',
      default: '',
      placeholder: q.rotuloPadrao,
    };
    porQuadrante[`cor_${q.chave}`] = {
      type: 'string',
      label: `Fundo do quadrante ${q.rotuloPadrao}`,
      section: 'Quadrantes',
      display: 'color',
      default: '',
      display_size: 'half',
    };
  }

  return montarOpcoes(
    blocoDeCores(),
    blocoDeEixos(),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeTema(),
    blocoAvancado(),
    {
      divisoriaX: {
        type: 'string',
        label: 'Linha divisória vertical (eixo X)',
        section: 'Quadrantes',
        display: 'select',
        default: 'media',
        values: listaDeValores(MODOS_DE_DIVISORIA),
      },
      valorDaDivisoriaX: {
        type: 'string',
        label: 'Valor fixo da divisória X',
        section: 'Quadrantes',
        default: '',
        display_size: 'half',
      },
      divisoriaY: {
        type: 'string',
        label: 'Linha divisória horizontal (eixo Y)',
        section: 'Quadrantes',
        display: 'select',
        default: 'media',
        values: listaDeValores(MODOS_DE_DIVISORIA),
      },
      valorDaDivisoriaY: {
        type: 'string',
        label: 'Valor fixo da divisória Y',
        section: 'Quadrantes',
        default: '',
        display_size: 'half',
      },
      corDasDivisorias: {
        type: 'string',
        label: 'Cor das divisórias',
        section: 'Quadrantes',
        display: 'color',
        default: '',
      },
      pintarQuadrantes: {
        type: 'boolean',
        label: 'Pintar o fundo dos quadrantes',
        section: 'Quadrantes',
        default: true,
      },
      mostrarContagemPorQuadrante: {
        type: 'boolean',
        label: 'Mostrar quantos pontos há em cada quadrante',
        section: 'Quadrantes',
        default: true,
      },
      ...porQuadrante,

      tamanhoDoPonto: {
        type: 'number',
        label: 'Tamanho do ponto',
        section: 'Pontos',
        display: 'range',
        min: 1,
        max: 30,
        step: 1,
        default: 7,
      },
      tamanhoMaximoDoPonto: {
        type: 'number',
        label: 'Tamanho máximo (quando o tamanho vem de uma medida)',
        section: 'Pontos',
        display: 'range',
        min: 4,
        max: 60,
        step: 1,
        default: 26,
      },
      formaDoPonto: {
        type: 'string',
        label: 'Forma',
        section: 'Pontos',
        display: 'select',
        default: 'circulo',
        values: listaDeValores([
          { rotulo: 'Círculo', valor: 'circulo' },
          { rotulo: 'Quadrado', valor: 'quadrado' },
          { rotulo: 'Losango', valor: 'losango' },
          { rotulo: 'Triângulo', valor: 'triangulo' },
          { rotulo: 'Cruz', valor: 'cruz' },
        ]),
      },
      opacidadeDoPonto: {
        type: 'number',
        label: 'Opacidade',
        section: 'Pontos',
        display: 'range',
        min: 0.05,
        max: 1,
        step: 0.05,
        default: 0.8,
      },
      contornoDoPonto: {
        type: 'boolean',
        label: 'Contorno branco no ponto',
        section: 'Pontos',
        default: true,
      },
      colorirPor: {
        type: 'string',
        label: 'Cor dos pontos',
        section: 'Pontos',
        display: 'select',
        default: 'quadrante',
        values: listaDeValores([
          { rotulo: 'Pelo quadrante', valor: 'quadrante' },
          { rotulo: 'Cor única', valor: 'unica' },
          { rotulo: 'Por uma medida (escala contínua)', valor: 'medida' },
        ]),
      },
      quantosRotulosDePonto: {
        type: 'number',
        label: 'Quantos pontos recebem rótulo (os maiores primeiro)',
        section: 'Rótulos',
        display: 'range',
        min: 0,
        max: 60,
        step: 1,
        default: 12,
      },
    }
  );
}

export default defineViz({
  id: 'quadrant_scatter',
  label: 'Dispersão com Quadrantes',
  opcoes: opcoes(),
  exigencia: { dimensoesMin: 1, medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    if (!medidas.length) return {};
    return {
      ...opcaoDeEscolhaDeCampo('campoDoX', 'Medida do eixo X', medidas, {
        secao: 'Dados',
        padrao: medidas[0].nome,
      }),
      ...opcaoDeEscolhaDeCampo('campoDoY', 'Medida do eixo Y', medidas, {
        secao: 'Dados',
        padrao: (medidas[1] || medidas[0]).nome,
      }),
      ...opcaoDeEscolhaDeCampo('campoDoTamanho', 'Medida do tamanho do ponto', medidas, {
        secao: 'Dados',
        incluirNenhum: true,
        padrao: '',
      }),
      ...opcaoDeEscolhaDeCampo('campoDaCor', 'Medida da cor do ponto', medidas, {
        secao: 'Dados',
        incluirNenhum: true,
        padrao: '',
      }),
    };
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const campoX = escolherMedida(modelo, config.campoDoX, 0);
    const campoY = escolherMedida(modelo, config.campoDoY, 1);
    const campoTamanho = config.campoDoTamanho ? escolherMedida(modelo, config.campoDoTamanho, -1) : null;
    const campoCor = config.campoDaCor ? escolherMedida(modelo, config.campoDaCor, -1) : null;
    const campoRotulo = modelo.dimensoes[0];

    if (!campoX || !campoY || campoX.nome === campoY.nome) {
      ctx.mostrarVazio('Escolha duas medidas diferentes para os eixos X e Y na seção Dados.');
      return;
    }

    const pontos = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      const x = modelo.valorNumerico(linha, campoX.nome);
      const y = modelo.valorNumerico(linha, campoY.nome);
      if (x === null || y === null) continue;
      pontos.push({
        indice: i,
        x,
        y,
        tamanho: campoTamanho ? modelo.valorNumerico(linha, campoTamanho.nome) : null,
        valorDaCor: campoCor ? modelo.valorNumerico(linha, campoCor.nome) : null,
        rotulo: campoRotulo ? modelo.texto(linha, campoRotulo.nome, undefined, '') : `#${i + 1}`,
      });
    }

    if (!pontos.length) {
      ctx.mostrarVazio('Nenhuma linha tem valor nas duas medidas escolhidas.');
      return;
    }
    const descartadas = modelo.linhas.length - pontos.length;
    if (descartadas > 0) {
      ctx.avisar(`${descartadas} linha(s) sem valor em X ou Y ficaram de fora.`);
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'qs');
    const area = criarEl('div', { classe: 'qs-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatarX = formatadorDeValueFormat(campoX.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 });
    const formatarY = formatadorDeValueFormat(campoY.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 });

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

    const corteX = calcularCorte(config.divisoriaX, config.valorDaDivisoriaX, valoresX);
    const corteY = calcularCorte(config.divisoriaY, config.valorDaDivisoriaY, valoresY);

    for (const ponto of pontos) {
      ponto.px = escalaX(ponto.x);
      ponto.py = escalaY(ponto.y);
      ponto.quadrante = quadranteDoPonto(ponto, corteX, corteY);
    }

    const paleta = coresDaPaleta(config.paleta);
    const corDoQuadrante = new Map(QUADRANTES.map((q, i) => [q.chave, config[`cor_${q.chave}`] || paleta[i % paleta.length]]));

    // ---------- SVG (fundo dos quadrantes, eixos, divisórias) ----------
    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'qs-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });
    // O canvas fica ENTRE o fundo dos quadrantes e os rótulos, então
    // desenhamos o fundo num SVG separado, atrás de tudo.
    const svgFundo = criarSvgEl('svg', {
      pai: area,
      classe: 'qs-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });
    area.insertBefore(svgFundo, area.firstChild);

    if (config.pintarQuadrantes !== false && corteX !== null && corteY !== null) {
      desenharFundoDosQuadrantes({
        svg: svgFundo,
        retangulo,
        xDoCorte: escalaX(corteX),
        yDoCorte: escalaY(corteY),
        corDoQuadrante,
      });
    }

    desenharEixos({
      svg,
      escalaX,
      escalaY,
      area: retangulo,
      config,
      tema,
      formatarX,
      formatarY,
    });

    const corDasDivisorias = config.corDasDivisorias || tema.bordaForte;
    if (corteX !== null) {
      desenharDivisoria(svg, escalaX(corteX), retangulo.cima, escalaX(corteX), retangulo.cima + retangulo.altura, corDasDivisorias);
    }
    if (corteY !== null) {
      desenharDivisoria(svg, retangulo.esquerda, escalaY(corteY), retangulo.esquerda + retangulo.largura, escalaY(corteY), corDasDivisorias);
    }

    // ---------- Canvas (pontos) ----------
    const canvas = criarEl('canvas', { classe: 'qs-canvas' });
    area.insertBefore(canvas, svg);
    const { ctx: pincel } = prepararCanvas(canvas, largura, altura);

    const escalaDeTamanho = montarEscalaDeTamanho(pontos, config);
    const escalaDeCor = montarEscalaDeCor(pontos, config, campoCor);
    const corFixa = config.corUnica || paleta[0];

    for (const ponto of pontos) {
      ponto.raio = escalaDeTamanho(ponto.tamanho);
      ponto.cor =
        config.colorirPor === 'medida' && escalaDeCor
          ? escalaDeCor(ponto.valorDaCor)
          : config.colorirPor === 'unica'
          ? corFixa
          : corDoQuadrante.get(ponto.quadrante) || corFixa;
    }

    if (pincel) {
      desenharPontos(pincel, pontos, config, tema);
    } else {
      // Sem contexto 2D (ambiente de teste): o gráfico não pode sumir.
      ctx.avisar('O navegador não forneceu contexto 2D; os pontos não foram desenhados.');
    }

    // ---------- Rótulos dos quadrantes ----------
    if (corteX !== null && corteY !== null) {
      desenharRotulosDosQuadrantes({
        svg,
        retangulo,
        xDoCorte: escalaX(corteX),
        yDoCorte: escalaY(corteY),
        pontos,
        config,
        tema,
      });
    }

    // ---------- Rótulos dos pontos ----------
    const quantos = Number(config.quantosRotulosDePonto) || 0;
    if (quantos > 0 && campoRotulo) {
      const destaque = pontos
        .slice()
        .sort((a, b) => distanciaDoCorte(b, corteX, corteY) - distanciaDoCorte(a, corteX, corteY))
        .slice(0, quantos);
      for (const ponto of destaque) {
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'qs-rotulo-ponto',
          atributos: {
            x: ponto.px + ponto.raio / 2 + 3,
            y: ponto.py,
            'dominant-baseline': 'central',
            'font-size': Number(config.tamanhoDoRotulo) || Math.max(8, tema.tamanhoBase - 2),
            fill: config.corDoRotulo || tema.texto,
          },
        });
        definirTexto(texto, truncar(ponto.rotulo, Number(config.truncarRotulo) || 18));
      }
    }

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      const caixa = area.getBoundingClientRect();
      const alvo = acharMaisProximo({
        itens: pontos,
        x: ev.clientX - caixa.left,
        y: ev.clientY - caixa.top,
        raio: 14,
        obterX: (p) => p.px,
        obterY: (p) => p.py,
      });
      if (!alvo) {
        if (tooltip) tooltip.esconder();
        area.style.cursor = 'default';
        return;
      }
      area.style.cursor = 'pointer';
      if (!tooltip) return;
      const linhas = [
        { rotulo: campoX.rotuloCurto, valor: formatarX(alvo.x) },
        { rotulo: campoY.rotuloCurto, valor: formatarY(alvo.y) },
      ];
      if (campoTamanho && alvo.tamanho !== null) {
        linhas.push({ rotulo: campoTamanho.rotuloCurto, valor: String(alvo.tamanho) });
      }
      if (campoCor && alvo.valorDaCor !== null) {
        linhas.push({ rotulo: campoCor.rotuloCurto, valor: String(alvo.valorDaCor) });
      }
      linhas.push({ rotulo: 'Quadrante', valor: nomeDoQuadrante(alvo.quadrante, config) });
      tooltip.mostrar({ titulo: alvo.rotulo, linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(area, 'click', (ev) => {
      const caixa = area.getBoundingClientRect();
      const alvo = acharMaisProximo({
        itens: pontos,
        x: ev.clientX - caixa.left,
        y: ev.clientY - caixa.top,
        raio: 14,
        obterX: (p) => p.px,
        obterY: (p) => p.py,
      });
      if (!alvo || !campoRotulo) return;
      const celula = modelo.celula(modelo.linhas[alvo.indice], campoRotulo.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function escolherMedida(modelo, nomeEscolhido, posicaoPadrao) {
  if (nomeEscolhido) {
    const achado = modelo.medidas.find((m) => m.nome === nomeEscolhido);
    if (achado) return achado;
  }
  return posicaoPadrao >= 0 ? modelo.medidas[posicaoPadrao] || null : null;
}

/** Onde cortar o plano, conforme o modo escolhido. */
function calcularCorte(modo, valorFixo, valores) {
  switch (modo) {
    case 'nenhum':
      return null;
    case 'zero':
      return 0;
    case 'fixo': {
      const n = Number(String(valorFixo).replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    }
    case 'mediana':
      return estatisticas.mediana(valores);
    case 'meio': {
      const minimo = Math.min(...valores);
      const maximo = Math.max(...valores);
      return (minimo + maximo) / 2;
    }
    case 'media':
    default:
      return estatisticas.media(valores);
  }
}

function quadranteDoPonto(ponto, corteX, corteY) {
  if (corteX === null || corteY === null) return 'superiorDireito';
  const direita = ponto.x >= corteX;
  const cima = ponto.y >= corteY;
  if (direita && cima) return 'superiorDireito';
  if (direita && !cima) return 'inferiorDireito';
  if (!direita && !cima) return 'inferiorEsquerdo';
  return 'superiorEsquerdo';
}

/** Quanto o ponto está longe do cruzamento das divisórias (em unidades). */
function distanciaDoCorte(ponto, corteX, corteY) {
  if (corteX === null || corteY === null) return Math.hypot(ponto.x, ponto.y);
  return Math.hypot(ponto.x - corteX, ponto.y - corteY);
}

function nomeDoQuadrante(chave, config) {
  const q = QUADRANTES.find((item) => item.chave === chave);
  if (!q) return '';
  return config[`rotulo_${chave}`] || q.rotuloPadrao;
}

function desenharDivisoria(svg, x1, y1, x2, y2, cor) {
  criarSvgEl('line', {
    pai: svg,
    atributos: { x1, y1, x2, y2, stroke: cor, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' },
  });
}

function desenharFundoDosQuadrantes({ svg, retangulo, xDoCorte, yDoCorte, corDoQuadrante }) {
  const esquerda = retangulo.esquerda;
  const direita = retangulo.esquerda + retangulo.largura;
  const cima = retangulo.cima;
  const baixo = retangulo.cima + retangulo.altura;

  const caixas = {
    superiorDireito: [xDoCorte, cima, direita - xDoCorte, yDoCorte - cima],
    inferiorDireito: [xDoCorte, yDoCorte, direita - xDoCorte, baixo - yDoCorte],
    inferiorEsquerdo: [esquerda, yDoCorte, xDoCorte - esquerda, baixo - yDoCorte],
    superiorEsquerdo: [esquerda, cima, xDoCorte - esquerda, yDoCorte - cima],
  };

  for (const [chave, [x, y, w, h]] of Object.entries(caixas)) {
    if (!(w > 0) || !(h > 0)) continue;
    criarSvgEl('rect', {
      pai: svg,
      atributos: { x, y, width: w, height: h, fill: comOpacidade(corDoQuadrante.get(chave), 0.08) },
    });
  }
}

function desenharRotulosDosQuadrantes({ svg, retangulo, xDoCorte, yDoCorte, pontos, config, tema }) {
  const contagem = new Map();
  for (const p of pontos) contagem.set(p.quadrante, (contagem.get(p.quadrante) || 0) + 1);

  const esquerda = retangulo.esquerda;
  const direita = retangulo.esquerda + retangulo.largura;
  const cima = retangulo.cima;
  const baixo = retangulo.cima + retangulo.altura;
  const margem = 8;

  const posicoes = {
    superiorDireito: { x: direita - margem, y: cima + margem, ancora: 'end', base: 'hanging' },
    inferiorDireito: { x: direita - margem, y: baixo - margem, ancora: 'end', base: 'auto' },
    inferiorEsquerdo: { x: esquerda + margem, y: baixo - margem, ancora: 'start', base: 'auto' },
    superiorEsquerdo: { x: esquerda + margem, y: cima + margem, ancora: 'start', base: 'hanging' },
  };

  for (const q of QUADRANTES) {
    const posicao = posicoes[q.chave];
    // Quadrante sem espaço na tela (divisória encostada na borda).
    if (q.x === 1 && direita - xDoCorte < 40) continue;
    if (q.x === 0 && xDoCorte - esquerda < 40) continue;
    if (q.y === 1 && yDoCorte - cima < 20) continue;
    if (q.y === 0 && baixo - yDoCorte < 20) continue;

    const nome = config[`rotulo_${q.chave}`] || q.rotuloPadrao;
    const quantos = contagem.get(q.chave) || 0;
    const texto =
      config.mostrarContagemPorQuadrante !== false ? `${nome} (${quantos})` : nome;

    const el = criarSvgEl('text', {
      pai: svg,
      classe: 'qs-rotulo-quadrante',
      atributos: {
        x: posicao.x,
        y: posicao.y,
        'text-anchor': posicao.ancora,
        'dominant-baseline': posicao.base,
        'font-size': Math.max(9, tema.tamanhoBase - 1),
        fill: tema.textoSuave,
      },
    });
    definirTexto(el, texto);
  }
}

function montarEscalaDeTamanho(pontos, config) {
  const padrao = Number(config.tamanhoDoPonto) || 7;
  const comTamanho = pontos.filter((p) => p.tamanho !== null && Number.isFinite(p.tamanho));
  if (!comTamanho.length) return () => padrao;

  const valores = comTamanho.map((p) => p.tamanho);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const maior = Number(config.tamanhoMaximoDoPonto) || 26;
  if (maximo === minimo) return () => padrao;

  // Área proporcional ao valor (e não o raio), senão a diferença engana.
  return (valor) => {
    if (valor === null || !Number.isFinite(valor)) return padrao;
    const t = (valor - minimo) / (maximo - minimo);
    return Math.sqrt(padrao * padrao + t * (maior * maior - padrao * padrao));
  };
}

function montarEscalaDeCor(pontos, config, campoCor) {
  if (config.colorirPor !== 'medida' || !campoCor) return null;
  const valores = pontos.map((p) => p.valorDaCor).filter((v) => v !== null && Number.isFinite(v));
  if (!valores.length) return null;
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const interpolar = interpoladorContinuo(config.escalaDeCor);
  return (valor) => {
    if (valor === null || !Number.isFinite(valor)) return '#9CA3AF';
    const t = maximo === minimo ? 0.5 : (valor - minimo) / (maximo - minimo);
    return interpolar(t);
  };
}

function desenharPontos(pincel, pontos, config, tema) {
  const opacidade = Number(config.opacidadeDoPonto);
  pincel.globalAlpha = Number.isFinite(opacidade) ? opacidade : 0.8;
  const forma = config.formaDoPonto || 'circulo';
  const contorno = config.contornoDoPonto !== false;

  for (const ponto of pontos) {
    pincel.fillStyle = ponto.cor;
    desenharSimboloNoCanvas(pincel, forma, ponto.px, ponto.py, ponto.raio);
    pincel.fill();
    if (contorno && ponto.raio >= 6) {
      pincel.globalAlpha = 1;
      pincel.strokeStyle = tema.fundo;
      pincel.lineWidth = 1;
      pincel.stroke();
      pincel.globalAlpha = Number.isFinite(opacidade) ? opacidade : 0.8;
    }
  }
  pincel.globalAlpha = 1;
}
