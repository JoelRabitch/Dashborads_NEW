/**
 * _quadrantes — base compartilhada dos gráficos que partem o plano em quatro.
 *
 * `quadrant_scatter`, `matriz_2x2` e `matriz_bcg` são o mesmo desenho com
 * convenções diferentes: duas medidas nos eixos, duas divisórias, quatro
 * quadrantes nomeados. Em vez de três cópias quase iguais (que iriam
 * divergindo a cada correção), o desenho mora aqui e cada gráfico entrega
 * só o seu PERFIL: nomes padrão dos quadrantes, cortes padrão e o que é
 * obrigatório na consulta.
 *
 * A pasta começa com `_` pela mesma convenção de `_template`: não é um
 * gráfico registrado, é código compartilhado.
 */

import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { escalaNumerica, estatisticas } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade, interpoladorContinuo } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { desenharSimboloNoCanvas } from '../../core/shapes.js';
import { acharMaisProximo } from '../../core/interaction.js';
import { listaDeValores, opcaoDeEscolhaDeCampo } from '../../core/options-kit.js';

export const CSS_QUADRANTES = `
.qd-area{position:relative;width:100%;height:100%;}
.qd-canvas{position:absolute;left:0;top:0;}
.qd-svg{position:absolute;left:0;top:0;pointer-events:none;}
.qd-rotulo-quadrante{font-weight:600;opacity:.8;}
.qd-rotulo-ponto{pointer-events:none;}
`;

export const MODOS_DE_DIVISORIA = [
  { rotulo: 'Média', valor: 'media' },
  { rotulo: 'Mediana', valor: 'mediana' },
  { rotulo: 'Ponto médio entre mínimo e máximo', valor: 'meio' },
  { rotulo: 'Zero', valor: 'zero' },
  { rotulo: 'Um (para participação relativa)', valor: 'um' },
  { rotulo: 'Valor fixo', valor: 'fixo' },
  { rotulo: 'Não mostrar', valor: 'nenhum' },
];

/**
 * Os quatro quadrantes, identificados pela posição na tela.
 * `x: 1` é a metade da direita; `y: 1` é a metade de cima.
 */
export const QUADRANTES = [
  { chave: 'superiorDireito', x: 1, y: 1 },
  { chave: 'inferiorDireito', x: 1, y: 0 },
  { chave: 'inferiorEsquerdo', x: 0, y: 0 },
  { chave: 'superiorEsquerdo', x: 0, y: 1 },
];

/* ------------------------------------------------------------------ */
/* Opções                                                              */
/* ------------------------------------------------------------------ */

/** Opções de nome e cor de cada quadrante, com os nomes do perfil. */
export function opcoesDeQuadrantes(nomesPadrao, secao = 'Quadrantes') {
  const saida = {};
  for (const q of QUADRANTES) {
    const padrao = nomesPadrao[q.chave] || '';
    saida[`rotulo_${q.chave}`] = {
      type: 'string',
      label: `Nome do quadrante "${padrao}"`,
      section: secao,
      default: '',
      placeholder: padrao,
    };
    saida[`cor_${q.chave}`] = {
      type: 'string',
      label: `Cor do quadrante "${padrao}"`,
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    };
  }
  return saida;
}

/** Opções das divisórias, já com os padrões do perfil. */
export function opcoesDeDivisorias({ cortePadraoX = 'media', cortePadraoY = 'media', secao = 'Quadrantes' } = {}) {
  return {
    divisoriaX: {
      type: 'string',
      label: 'Linha divisória vertical (eixo X)',
      section: secao,
      display: 'select',
      default: cortePadraoX,
      values: listaDeValores(MODOS_DE_DIVISORIA),
    },
    valorDaDivisoriaX: {
      type: 'string',
      label: 'Valor fixo da divisória X',
      section: secao,
      default: '',
      display_size: 'half',
    },
    divisoriaY: {
      type: 'string',
      label: 'Linha divisória horizontal (eixo Y)',
      section: secao,
      display: 'select',
      default: cortePadraoY,
      values: listaDeValores(MODOS_DE_DIVISORIA),
    },
    valorDaDivisoriaY: {
      type: 'string',
      label: 'Valor fixo da divisória Y',
      section: secao,
      default: '',
      display_size: 'half',
    },
    corDasDivisorias: {
      type: 'string',
      label: 'Cor das divisórias',
      section: secao,
      display: 'color',
      default: '',
    },
    pintarQuadrantes: {
      type: 'boolean',
      label: 'Pintar o fundo dos quadrantes',
      section: secao,
      default: true,
    },
    mostrarContagemPorQuadrante: {
      type: 'boolean',
      label: 'Mostrar quantos pontos há em cada quadrante',
      section: secao,
      default: true,
    },
  };
}

/** Opções dos pontos (forma, tamanho, opacidade, como colorir). */
export function opcoesDePontos({ tamanhoPadrao = 7, secao = 'Pontos' } = {}) {
  return {
    tamanhoDoPonto: {
      type: 'number',
      label: 'Tamanho do ponto',
      section: secao,
      display: 'range',
      min: 1,
      max: 40,
      step: 1,
      default: tamanhoPadrao,
    },
    tamanhoMaximoDoPonto: {
      type: 'number',
      label: 'Tamanho máximo (quando o tamanho vem de uma medida)',
      section: secao,
      display: 'range',
      min: 4,
      max: 90,
      step: 1,
      default: 30,
    },
    formaDoPonto: {
      type: 'string',
      label: 'Forma',
      section: secao,
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
      section: secao,
      display: 'range',
      min: 0.05,
      max: 1,
      step: 0.05,
      default: 0.8,
    },
    contornoDoPonto: { type: 'boolean', label: 'Contorno no ponto', section: secao, default: true },
    colorirPor: {
      type: 'string',
      label: 'Cor dos pontos',
      section: secao,
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
      label: 'Quantos pontos recebem rótulo (0 = nenhum, 999 = todos)',
      section: 'Rótulos',
      display: 'range',
      min: 0,
      max: 200,
      step: 1,
      default: 12,
    },
  };
}

/** Selects de "qual medida vai em cada papel", montados com os campos reais. */
export function opcoesDinamicasDeCampos(modelo, { comTamanho = true, comCor = true, tamanhoObrigatorio = false } = {}) {
  const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
  if (!medidas.length) return {};

  const saida = {
    ...opcaoDeEscolhaDeCampo('campoDoX', 'Medida do eixo X', medidas, {
      secao: 'Dados',
      padrao: medidas[0].nome,
    }),
    ...opcaoDeEscolhaDeCampo('campoDoY', 'Medida do eixo Y', medidas, {
      secao: 'Dados',
      padrao: (medidas[1] || medidas[0]).nome,
    }),
  };

  if (comTamanho) {
    Object.assign(
      saida,
      opcaoDeEscolhaDeCampo('campoDoTamanho', 'Medida do tamanho do ponto', medidas, {
        secao: 'Dados',
        incluirNenhum: !tamanhoObrigatorio,
        padrao: tamanhoObrigatorio ? (medidas[2] || medidas[medidas.length - 1]).nome : '',
      })
    );
  }
  if (comCor) {
    Object.assign(
      saida,
      opcaoDeEscolhaDeCampo('campoDaCor', 'Medida da cor do ponto', medidas, {
        secao: 'Dados',
        incluirNenhum: true,
        padrao: '',
      })
    );
  }
  return saida;
}

/* ------------------------------------------------------------------ */
/* Cálculo                                                             */
/* ------------------------------------------------------------------ */

/** Onde cortar o plano, conforme o modo escolhido. */
export function calcularCorte(modo, valorFixo, valores) {
  switch (modo) {
    case 'nenhum':
      return null;
    case 'zero':
      return 0;
    case 'um':
      return 1;
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

/**
 * Em que quadrante o ponto cai.
 *
 * Atenção ao eixo X invertido (a BCG usa): quem decide é a POSIÇÃO NA TELA,
 * não o valor. Por isso comparamos coordenadas de pixel, e não os dados.
 */
export function quadranteDaPosicao(px, py, xDoCorte, yDoCorte) {
  if (xDoCorte === null || yDoCorte === null) return null;
  const direita = px >= xDoCorte;
  const cima = py <= yDoCorte; // em pixel, menor Y é mais alto
  if (direita && cima) return 'superiorDireito';
  if (direita && !cima) return 'inferiorDireito';
  if (!direita && !cima) return 'inferiorEsquerdo';
  return 'superiorEsquerdo';
}

export function nomeDoQuadrante(chave, config, nomesPadrao) {
  if (!chave) return '';
  return config[`rotulo_${chave}`] || nomesPadrao[chave] || '';
}

/* ------------------------------------------------------------------ */
/* Desenho                                                             */
/* ------------------------------------------------------------------ */

/**
 * Desenha o gráfico inteiro.
 *
 * @param {object} ctx contexto do defineViz
 * @param {object} perfil
 * @param {object} perfil.nomesPadrao nomes dos quatro quadrantes
 * @param {boolean} [perfil.tamanhoObrigatorio] exige medida de tamanho
 * @param {Function} [perfil.ajustarPontos] gancho para transformar os
 *        valores antes de escalar (a BCG usa para participação relativa)
 * @param {string} [perfil.prefixoCss] prefixo das classes (para os testes)
 */
export function renderizarQuadrantes(ctx, perfil) {
  const { modelo, config, tema, raiz, largura, altura } = ctx;
  const nomesPadrao = perfil.nomesPadrao;

  const campoX = escolherMedida(modelo, config.campoDoX, 0);
  const campoY = escolherMedida(modelo, config.campoDoY, 1);
  const campoTamanho = config.campoDoTamanho ? escolherMedida(modelo, config.campoDoTamanho, -1) : null;
  const campoCor = config.campoDaCor ? escolherMedida(modelo, config.campoDaCor, -1) : null;
  const campoRotulo = modelo.dimensoes[0];

  if (!campoX || !campoY || campoX.nome === campoY.nome) {
    ctx.mostrarVazio('Escolha duas medidas diferentes para os eixos X e Y na seção Dados.');
    return null;
  }

  let pontos = [];
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

  if (typeof perfil.ajustarPontos === 'function') {
    pontos = perfil.ajustarPontos(pontos, { config, modelo, ctx }) || pontos;
  }
  // Gancho para o perfil mexer na config DEPOIS de conhecer os valores —
  // a BCG usa para montar um domínio simétrico em torno de 1. Roda antes
  // das escalas serem criadas, que é o único momento em que adianta.
  if (typeof perfil.ajustarConfig === 'function') {
    perfil.ajustarConfig(config, pontos, ctx);
  }

  if (!pontos.length) {
    ctx.mostrarVazio('Nenhuma linha tem valor nas duas medidas escolhidas.');
    return null;
  }
  const descartadas = modelo.linhas.length - pontos.length;
  if (descartadas > 0) ctx.avisar(`${descartadas} linha(s) sem valor em X ou Y ficaram de fora.`);

  ctx.limparRaiz();
  injetarEstilo(raiz, CSS_QUADRANTES, 'qd');
  const area = criarEl('div', { classe: 'qd-area', pai: raiz });

  const casas = Number(config.casasDecimaisDoRotulo);
  const casasSeguras = Number.isFinite(casas) ? casas : 1;
  const formatarX = perfil.formatarX || formatadorDeValueFormat(campoX.valueFormat, { casas: casasSeguras });
  const formatarY = perfil.formatarY || formatadorDeValueFormat(campoY.valueFormat, { casas: casasSeguras });

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
  const xDoCorte = corteX === null ? null : escalaX(corteX);
  const yDoCorte = corteY === null ? null : escalaY(corteY);

  for (const ponto of pontos) {
    ponto.px = escalaX(ponto.x);
    ponto.py = escalaY(ponto.y);
    ponto.quadrante = quadranteDaPosicao(ponto.px, ponto.py, xDoCorte, yDoCorte);
  }

  const paleta = coresDaPaleta(config.paleta);
  const corDoQuadrante = new Map(
    QUADRANTES.map((q, i) => [q.chave, config[`cor_${q.chave}`] || paleta[i % paleta.length]])
  );

  // Três camadas: fundo dos quadrantes, canvas dos pontos, SVG do texto.
  const svgFundo = criarSvgEl('svg', {
    pai: area,
    classe: 'qd-svg',
    atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
  });
  const canvas = criarEl('canvas', { classe: 'qd-canvas', pai: area });
  const svg = criarSvgEl('svg', {
    pai: area,
    classe: 'qd-svg',
    atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
  });

  if (config.pintarQuadrantes !== false && xDoCorte !== null && yDoCorte !== null) {
    desenharFundoDosQuadrantes({ svg: svgFundo, retangulo, xDoCorte, yDoCorte, corDoQuadrante });
  }

  desenharEixos({ svg, escalaX, escalaY, area: retangulo, config, tema, formatarX, formatarY });

  const corDasDivisorias = config.corDasDivisorias || tema.bordaForte;
  if (xDoCorte !== null) {
    desenharDivisoria(svg, xDoCorte, retangulo.cima, xDoCorte, retangulo.cima + retangulo.altura, corDasDivisorias);
  }
  if (yDoCorte !== null) {
    desenharDivisoria(
      svg,
      retangulo.esquerda,
      yDoCorte,
      retangulo.esquerda + retangulo.largura,
      yDoCorte,
      corDasDivisorias
    );
  }

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
    ctx.avisar('O navegador não forneceu contexto 2D; os pontos não foram desenhados.');
  }

  if (xDoCorte !== null && yDoCorte !== null) {
    desenharRotulosDosQuadrantes({
      svg,
      retangulo,
      xDoCorte,
      yDoCorte,
      pontos,
      config,
      tema,
      nomesPadrao,
      corDoQuadrante,
    });
  }

  desenharRotulosDosPontos({ svg, pontos, config, tema, corteX, corteY, temRotulo: !!campoRotulo });

  // ---------- Interação ----------
  const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
  ctx.estado.tooltip = tooltip;

  const acharPonto = (ev) => {
    const caixa = area.getBoundingClientRect();
    return acharMaisProximo({
      itens: pontos,
      x: ev.clientX - caixa.left,
      y: ev.clientY - caixa.top,
      raio: 16,
      obterX: (p) => p.px,
      obterY: (p) => p.py,
    });
  };

  ctx.eventos.on(area, 'pointermove', (ev) => {
    const alvo = acharPonto(ev);
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
    const nome = nomeDoQuadrante(alvo.quadrante, config, nomesPadrao);
    if (nome) linhas.push({ rotulo: 'Quadrante', valor: nome, cor: alvo.cor });
    tooltip.mostrar({ titulo: alvo.rotulo, linhas }, ev.clientX, ev.clientY);
  });

  ctx.eventos.on(area, 'pointerleave', () => {
    if (tooltip) tooltip.esconder();
  });

  ctx.eventos.on(area, 'click', (ev) => {
    const alvo = acharPonto(ev);
    if (!alvo || !campoRotulo) return;
    const celula = modelo.celula(modelo.linhas[alvo.indice], campoRotulo.nome);
    if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
  });

  return { pontos, corteX, corteY, escalaX, escalaY, retangulo };
}

/** Limpa o tooltip criado por `renderizarQuadrantes`. */
export function destruirQuadrantes({ estado }) {
  if (estado && estado.tooltip) estado.tooltip.destruir();
}

/* ------------------------------------------------------------------ */

function escolherMedida(modelo, nomeEscolhido, posicaoPadrao) {
  if (nomeEscolhido) {
    const achado = modelo.medidas.find((m) => m.nome === nomeEscolhido);
    if (achado) return achado;
  }
  return posicaoPadrao >= 0 ? modelo.medidas[posicaoPadrao] || null : null;
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

  // Os cortes podem cair fora da área (divisória fixa fora do intervalo):
  // prendemos nas bordas para não pintar por cima dos eixos.
  const xc = Math.max(esquerda, Math.min(direita, xDoCorte));
  const yc = Math.max(cima, Math.min(baixo, yDoCorte));

  const caixas = {
    superiorDireito: [xc, cima, direita - xc, yc - cima],
    inferiorDireito: [xc, yc, direita - xc, baixo - yc],
    inferiorEsquerdo: [esquerda, yc, xc - esquerda, baixo - yc],
    superiorEsquerdo: [esquerda, cima, xc - esquerda, yc - cima],
  };

  for (const [chave, [x, y, w, h]] of Object.entries(caixas)) {
    if (!(w > 0) || !(h > 0)) continue;
    criarSvgEl('rect', {
      pai: svg,
      atributos: { x, y, width: w, height: h, fill: comOpacidade(corDoQuadrante.get(chave), 0.1) },
    });
  }
}

function desenharRotulosDosQuadrantes({
  svg,
  retangulo,
  xDoCorte,
  yDoCorte,
  pontos,
  config,
  tema,
  nomesPadrao,
  corDoQuadrante,
}) {
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
    // Quadrante sem espaço na tela: o nome ficaria por cima do eixo.
    if (q.x === 1 && direita - xDoCorte < 44) continue;
    if (q.x === 0 && xDoCorte - esquerda < 44) continue;
    if (q.y === 1 && yDoCorte - cima < 18) continue;
    if (q.y === 0 && baixo - yDoCorte < 18) continue;

    const nome = nomeDoQuadrante(q.chave, config, nomesPadrao);
    if (!nome) continue;
    const quantos = contagem.get(q.chave) || 0;
    const texto = config.mostrarContagemPorQuadrante !== false ? `${nome} (${quantos})` : nome;
    const posicao = posicoes[q.chave];

    const el = criarSvgEl('text', {
      pai: svg,
      classe: 'qd-rotulo-quadrante',
      atributos: {
        x: posicao.x,
        y: posicao.y,
        'text-anchor': posicao.ancora,
        'dominant-baseline': posicao.base,
        'font-size': Math.max(9, tema.tamanhoBase),
        fill: config.pintarQuadrantes !== false ? corDoQuadrante.get(q.chave) : tema.textoSuave,
      },
    });
    definirTexto(el, texto);
  }
}

function desenharRotulosDosPontos({ svg, pontos, config, tema, corteX, corteY, temRotulo }) {
  const quantos = Number(config.quantosRotulosDePonto) || 0;
  if (quantos <= 0 || !temRotulo || config.mostrarRotulos === false) return;

  const distancia = (p) =>
    corteX === null || corteY === null
      ? Math.hypot(p.x, p.y)
      : Math.hypot(p.x - corteX, p.y - corteY);

  const destaque = pontos.slice().sort((a, b) => distancia(b) - distancia(a)).slice(0, quantos);
  const limite = Number(config.truncarRotulo) || 18;

  for (const ponto of destaque) {
    const texto = criarSvgEl('text', {
      pai: svg,
      classe: 'qd-rotulo-ponto',
      atributos: {
        x: ponto.px + ponto.raio / 2 + 3,
        y: ponto.py,
        'dominant-baseline': 'central',
        'font-size': Number(config.tamanhoDoRotulo) || Math.max(8, tema.tamanhoBase - 2),
        fill: config.corDoRotulo || tema.texto,
      },
    });
    definirTexto(texto, truncar(ponto.rotulo, limite));
  }
}

function montarEscalaDeTamanho(pontos, config) {
  const padrao = Number(config.tamanhoDoPonto) || 7;
  const comTamanho = pontos.filter((p) => p.tamanho !== null && Number.isFinite(p.tamanho));
  if (!comTamanho.length) return () => padrao;

  const valores = comTamanho.map((p) => p.tamanho);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const maior = Number(config.tamanhoMaximoDoPonto) || 30;
  if (maximo === minimo) return () => padrao;

  // Interpolamos a ÁREA, não o raio: dobrar o raio quadruplica a mancha e
  // faria o leitor superestimar a diferença.
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
  const opacidade = Number.isFinite(Number(config.opacidadeDoPonto)) ? Number(config.opacidadeDoPonto) : 0.8;
  const forma = config.formaDoPonto || 'circulo';
  const contorno = config.contornoDoPonto !== false;

  // Maiores primeiro: assim os pequenos não ficam escondidos atrás.
  const ordenados = pontos.slice().sort((a, b) => b.raio - a.raio);

  for (const ponto of ordenados) {
    pincel.globalAlpha = opacidade;
    pincel.fillStyle = ponto.cor;
    desenharSimboloNoCanvas(pincel, forma, ponto.px, ponto.py, ponto.raio);
    pincel.fill();
    if (contorno && ponto.raio >= 6) {
      pincel.globalAlpha = 1;
      pincel.strokeStyle = tema.fundo;
      pincel.lineWidth = 1;
      pincel.stroke();
    }
  }
  pincel.globalAlpha = 1;
}
