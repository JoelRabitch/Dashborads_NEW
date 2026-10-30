/**
 * _quadrantes — base compartilhada dos gráficos que partem o plano em quatro.
 *
 * `quadrant_scatter`, `matriz_2x2`, `matriz_bcg` e `risco_retorno` são o
 * mesmo desenho com convenções diferentes: duas medidas nos eixos, duas
 * divisórias, quatro quadrantes nomeados. Em vez de cópias quase iguais
 * (que iriam divergindo a cada correção), o desenho mora aqui e cada
 * gráfico entrega só o seu PERFIL: nomes padrão dos quadrantes, cortes
 * padrão e o que é obrigatório na consulta.
 *
 * A pasta começa com `_` pela mesma convenção de `_template`: não é um
 * gráfico registrado, é código compartilhado.
 *
 * Correções v2 (módulos 2.1–2.4), todas relidas do config a cada desenho:
 *   - Rótulos dos pontos passam pela função única (`core/rotulos.js`):
 *     mostrar, tamanho, cor, negrito, rotação, posição, conteúdo, formato,
 *     casas, truncar ("0 = não truncar" agora é zero mesmo) e "esconder
 *     rótulos que se sobrepõem". `quantosRotulosDePonto` continua valendo.
 *     Antes, negrito/rotação/posição/conteúdo/formato/colisão eram
 *     declarados no painel e nunca lidos.
 *   - Cores pela leitura única (`core/cores.js`): paleta com "Inverter
 *     ordem", opacidade do painel (× opacidade do ponto), contorno
 *     (mostrar/cor/espessura/estilo) e "Como colorir" da aba Cores. A cor
 *     do quadrante vale no fundo, no nome e nos pontos, em qualquer formato
 *     de cor CSS (o fundo usa `fill-opacity`, não conversão para rgba).
 *   - Tooltip único do gráfico (`ctx.tooltip()`), com os valores como o
 *     Looker mostra (`modelo.texto` = textForCell/rendered) — antes o
 *     tamanho e a cor saíam crus ("-6.18841"). Clique pela "Ação do
 *     clique" (`ctx.cliqueNoItem`).
 *   - Pontos desenhados com a função única de marcadores
 *     (`criarMarcadorSvg`), então a "Forma" muda o desenho. Acima de
 *     LIMITE_DE_PONTOS_EM_SVG pontos o desenho cai para canvas (mesma
 *     forma, via `desenharSimboloNoCanvas`), por desempenho.
 */

import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { escalaNumerica, escalaDeCores, estatisticas } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos, formatadorDoEixo } from '../../core/eixos.js';
import { textoLegivelSobre } from '../../core/theme.js';
import { formatadorDeValueFormat, criarFormatadorNumerico, truncar } from '../../core/format.js';
import { criarMarcadorSvg, desenharSimboloNoCanvas, formaDoMarcador, tracejadoPorEstilo } from '../../core/shapes.js';
import { acharMaisProximo } from '../../core/interaction.js';
import { listaDeValores, opcaoDeEscolhaDeCampo } from '../../core/options-kit.js';
import {
  lerRotulos,
  textoDoRotulo,
  estilizarRotulo,
  esconderColisoes,
  larguraDoTexto,
  lerTexto,
  lerNumero,
  lerBooleano,
} from '../../core/rotulos.js';
import { paletaDoConfig, opacidadeDoConfig, lerContorno, aplicarContorno } from '../../core/cores.js';

export const CSS_QUADRANTES = `
.qd-area{position:relative;width:100%;height:100%;}
.qd-canvas{position:absolute;left:0;top:0;}
.qd-svg{position:absolute;left:0;top:0;pointer-events:none;}
.qd-rotulo-quadrante{font-weight:600;opacity:.8;}
.qd-rotulo-ponto{pointer-events:none;}
`;

/**
 * Até quantos pontos o desenho é em SVG (um `<path>` por ponto, com a
 * forma escolhida). Acima disso vai para canvas: 5.000 elementos SVG
 * engasgam o navegador num dashboard.
 */
export const LIMITE_DE_PONTOS_EM_SVG = 2000;

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
      // Estrela e wye entraram nas correções v2 (a função única de
      // marcadores desenha as sete formas); os valores antigos continuam.
      values: listaDeValores([
        { rotulo: 'Círculo', valor: 'circulo' },
        { rotulo: 'Quadrado', valor: 'quadrado' },
        { rotulo: 'Losango', valor: 'losango' },
        { rotulo: 'Triângulo', valor: 'triangulo' },
        { rotulo: 'Cruz', valor: 'cruz' },
        { rotulo: 'Estrela', valor: 'estrela' },
        { rotulo: 'Y (wye)', valor: 'wye' },
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

/**
 * Valores de "O que mostrar no rótulo" para esta família.
 *
 * Num gráfico de dispersão o rótulo identifica o PONTO, e o padrão do
 * bloco de rótulos ("valor") sempre mostrou o nome do item — dashboards
 * salvos dependem disso, e o default não pode mudar. Então aqui "valor"
 * continua sendo o nome (e o texto da opção diz isso), e entram valores
 * novos para quem quer número: eixo Y, eixo X ou os dois. Os ids e o
 * default da opção não mudam; só os textos e a lista de valores.
 */
const CONTEUDOS_DO_ROTULO_DE_PONTO = [
  { rotulo: 'Automático (nome do ponto)', valor: 'valor' },
  { rotulo: 'Nome do ponto', valor: 'nome' },
  { rotulo: 'Nome e valor do eixo Y', valor: 'nomeValor' },
  { rotulo: 'Valor do eixo Y', valor: 'valorY' },
  { rotulo: 'Valor do eixo X', valor: 'valorX' },
  { rotulo: 'Valores X e Y', valor: 'valoresXY' },
  { rotulo: 'Percentual do total do eixo Y', valor: 'percentual' },
  { rotulo: 'Valor do eixo Y e percentual', valor: 'valorPercentual' },
];

/**
 * Ajusta o bloco de rótulos já montado para a semântica de pontos
 * (lista de conteúdos acima e posição descrita em relação ao ponto).
 * Não mexe em id, type nem default.
 */
export function comRotulosDePonto(opcoes) {
  const saida = Object.assign({}, opcoes);
  if (saida.conteudoDoRotulo) {
    saida.conteudoDoRotulo = Object.assign({}, saida.conteudoDoRotulo, {
      values: listaDeValores(CONTEUDOS_DO_ROTULO_DE_PONTO),
    });
  }
  if (saida.posicaoDoRotulo) {
    saida.posicaoDoRotulo = Object.assign({}, saida.posicaoDoRotulo, {
      values: listaDeValores([
        { rotulo: 'Automática (à direita do ponto)', valor: 'auto' },
        { rotulo: 'Sobre o ponto', valor: 'dentro' },
        { rotulo: 'À direita do ponto', valor: 'fora' },
        { rotulo: 'Centrado no ponto', valor: 'centro' },
        { rotulo: 'Afastado, com linha-guia', valor: 'foraComLinha' },
      ]),
    });
  }
  return saida;
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
  // `lerTexto`: só espaços conta como vazio (volta ao nome padrão).
  return lerTexto(config[`rotulo_${chave}`], '') || nomesPadrao[chave] || '';
}

/**
 * Como colorir os pontos. "Cor dos pontos" (opção própria) manda; se ela
 * está no padrão ("pelo quadrante"), vale o "Como colorir" da aba Cores —
 * antes essa opção da aba Cores era declarada e ignorada.
 * @returns {'quadrante'|'unica'|'medida'}
 */
export function modoDeColorir(config) {
  const proprio = lerTexto(config.colorirPor, 'quadrante');
  if (proprio === 'unica' || proprio === 'medida') return proprio;
  const daAba = lerTexto(config.modoDeCor, 'categoria');
  if (daAba === 'unica') return 'unica';
  if (daAba === 'valor') return 'medida';
  return 'quadrante';
}

/**
 * Cor de cada quadrante: a escolhida no painel (qualquer cor CSS) ou a
 * paleta na posição do quadrante — já respeitando "Inverter ordem das
 * cores".
 */
export function coresDosQuadrantes(config) {
  const paleta = paletaDoConfig(config);
  return new Map(
    QUADRANTES.map((q, i) => [q.chave, lerTexto(config[`cor_${q.chave}`], '') || paleta[i % paleta.length]])
  );
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
 * @param {Function} [perfil.ajustarPontos] gancho para transformar os
 *        valores antes de escalar (a BCG usa para participação relativa).
 *        Quem muda `ponto.x`/`ponto.y` deve apagar `ponto.textoX`/`textoY`
 *        (o texto do Looker deixa de valer para o valor transformado).
 * @param {Function} [perfil.ajustarConfig] gancho para mexer na config
 *        depois de conhecer os pontos e antes das escalas
 * @param {Function} [perfil.formatadorX] `(config, campoX) => fn|null`:
 *        formatador do eixo X quando o valor não é o do campo (BCG)
 * @param {Function} [perfil.linhasDoTooltip] `(ponto) => [{rotulo, valor}]`
 *        linhas extras do tooltip (o risco_retorno põe o Sharpe)
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
      // Textos como o Looker mostra (textForCell/rendered): tooltip e
      // rótulo em formato "automático" usam estes, nunca o número cru.
      textoX: modelo.texto(linha, campoX.nome, undefined, ''),
      textoY: modelo.texto(linha, campoY.nome, undefined, ''),
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

  // Formatadores. Eixo: "Casas decimais nos eixos" (antes usava as casas
  // do RÓTULO); "Formato dos números nos eixos" é aplicado por
  // `formatadorDoEixo`/`desenharEixos`. Tooltip: o value_format do campo.
  const casasDoEixo = Math.max(0, Math.min(6, Math.round(lerNumero(config.casasDecimaisDoEixo, 1))));
  const formatoProprioX = typeof perfil.formatadorX === 'function' ? perfil.formatadorX(config, campoX) : null;
  const formatarX = formatoProprioX || formatadorDeValueFormat(campoX.valueFormat, { casas: casasDoEixo });
  const formatarY = formatadorDeValueFormat(campoY.valueFormat, { casas: casasDoEixo });
  const formatarXNoTooltip = formatoProprioX || formatadorDeValueFormat(campoX.valueFormat);
  const formatarYNoTooltip = formatadorDeValueFormat(campoY.valueFormat);

  const valoresX = pontos.map((p) => p.x);
  const valoresY = pontos.map((p) => p.y);

  // As margens medem os textos que o eixo VAI mostrar (com o formato do
  // painel), senão um formato mais largo seria cortado.
  const formatoDoEixoX = formatadorDoEixo(config, formatarX);
  const formatoDoEixoY = formatadorDoEixo(config, formatarY);
  const margens = calcularMargens({
    rotulosY: valoresY.map(formatoDoEixoY),
    rotulosX: valoresX.map(formatoDoEixoX),
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

  const paleta = paletaDoConfig(config);
  const corDoQuadrante = coresDosQuadrantes(config);

  // Camadas: SVG do fundo (quadrantes + pontos), canvas dos pontos só
  // quando são muitos, e SVG de cima (eixos, divisórias, textos).
  const usarSvg = pontos.length <= LIMITE_DE_PONTOS_EM_SVG;
  const svgFundo = criarSvgEl('svg', {
    pai: area,
    classe: 'qd-svg',
    atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
  });
  const canvas = usarSvg ? null : criarEl('canvas', { classe: 'qd-canvas', pai: area });
  const svg = criarSvgEl('svg', {
    pai: area,
    classe: 'qd-svg',
    atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
  });

  if (lerBooleano(config.pintarQuadrantes, true) && xDoCorte !== null && yDoCorte !== null) {
    desenharFundoDosQuadrantes({ svg: svgFundo, retangulo, xDoCorte, yDoCorte, corDoQuadrante });
  }

  desenharEixos({ svg, escalaX, escalaY, area: retangulo, config, tema, formatarX, formatarY });

  const corDasDivisorias = lerTexto(config.corDasDivisorias, '') || tema.bordaForte;
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

  // ---------- Cor e tamanho de cada ponto ----------
  const modo = modoDeColorir(config);
  const escalaDeTamanho = montarEscalaDeTamanho(pontos, config);
  const escalaDeCor = modo === 'medida' ? montarEscalaDeCor(pontos, config, tema, !!campoCor) : null;
  const corFixa = lerTexto(config.corUnica, '') || paleta[0];

  for (const ponto of pontos) {
    // `diametro`: o tamanho VISUAL do marcador. (`raio` fica como apelido
    // por compatibilidade: sempre guardou o diâmetro, apesar do nome.)
    ponto.diametro = escalaDeTamanho(ponto.tamanho);
    ponto.raio = ponto.diametro;
    ponto.cor =
      modo === 'medida' && escalaDeCor
        ? escalaDeCor(campoCor ? ponto.valorDaCor : ponto.y)
        : modo === 'unica'
          ? corFixa
          : corDoQuadrante.get(ponto.quadrante) || corFixa;
  }

  const estiloDosPontos = lerEstiloDosPontos(config, tema);
  if (usarSvg) {
    desenharPontosSvg(svgFundo, pontos, estiloDosPontos);
  } else {
    const { ctx: pincel } = prepararCanvas(canvas, largura, altura);
    if (pincel) desenharPontosNoCanvas(pincel, pontos, estiloDosPontos);
    else ctx.avisar('O navegador não forneceu contexto 2D; os pontos não foram desenhados.');
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

  desenharRotulosDosPontos({
    svg,
    pontos,
    config,
    tema,
    corteX,
    corteY,
    temRotulo: !!campoRotulo,
    campoX,
    campoY,
    formatoProprioX,
  });

  // ---------- Interação ----------
  // Tooltip ÚNICO do gráfico (null se desligado); não é destruído por
  // desenho — o define-viz esconde no redesenho e remove no destroy.
  const tooltip = ctx.tooltip();
  ctx.estado.tooltip = tooltip;

  const conteudoDoPonto = (alvo) => {
    const linha = modelo.linhas[alvo.indice];
    const textoX = alvo.textoX || formatarXNoTooltip(alvo.x);
    const textoY = alvo.textoY || formatarYNoTooltip(alvo.y);
    const linhas = [
      { rotulo: campoX.rotuloCurto, valor: textoX },
      { rotulo: campoY.rotuloCurto, valor: textoY },
    ];
    if (campoTamanho && alvo.tamanho !== null) {
      linhas.push({ rotulo: campoTamanho.rotuloCurto, valor: modelo.texto(linha, campoTamanho.nome, undefined, '') });
    }
    if (campoCor && alvo.valorDaCor !== null) {
      linhas.push({ rotulo: campoCor.rotuloCurto, valor: modelo.texto(linha, campoCor.nome, undefined, '') });
    }
    if (typeof perfil.linhasDoTooltip === 'function') {
      for (const extra of perfil.linhasDoTooltip(alvo) || []) if (extra) linhas.push(extra);
    }
    const nome = nomeDoQuadrante(alvo.quadrante, config, nomesPadrao);
    if (nome) linhas.push({ rotulo: 'Quadrante', valor: nome, cor: alvo.cor });
    return {
      titulo: alvo.rotulo,
      linhas,
      variaveis: { categoria: alvo.rotulo, valor: textoY, serie: nome },
    };
  };

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
    if (tooltip) tooltip.mostrar(conteudoDoPonto(alvo), ev.clientX, ev.clientY);
  });

  ctx.eventos.on(area, 'pointerleave', () => {
    if (tooltip) tooltip.esconder();
  });

  // "Ação do clique": drill do Looker se a célula tem links; senão fixa o
  // tooltip (ou o que o usuário escolheu no painel).
  ctx.eventos.on(area, 'click', (ev) => {
    const alvo = acharPonto(ev);
    if (!alvo) return;
    const celula = campoRotulo ? modelo.celula(modelo.linhas[alvo.indice], campoRotulo.nome) : null;
    ctx.cliqueNoItem(ev, celula, conteudoDoPonto(alvo));
  });

  // `svg` e `area` saem daqui para quem quiser desenhar POR CIMA dos
  // pontos — uma reta de referência, uma fronteira, uma anotação.
  return { pontos, corteX, corteY, escalaX, escalaY, retangulo, svg, area, tooltip, estiloDosPontos };
}

/**
 * Compatibilidade: antes destruía o tooltip criado por desenho. Agora o
 * tooltip é único por gráfico e o define-viz o remove no destroy; aqui só
 * soltamos a referência.
 */
export function destruirQuadrantes({ estado } = {}) {
  if (estado) estado.tooltip = null;
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
    classe: 'qd-divisoria',
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
    // `fill` + `fill-opacity` em vez de converter para rgba(): funciona com
    // qualquer cor CSS que o seletor do Looker devolver (antes, um formato
    // que `comOpacidade` não entendia pintava o quadrante OPACO).
    criarSvgEl('rect', {
      pai: svg,
      classe: 'qd-fundo',
      atributos: {
        x,
        y,
        width: w,
        height: h,
        fill: corDoQuadrante.get(chave),
        'fill-opacity': 0.1,
        'data-quadrante': chave,
      },
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

  const pintar = lerBooleano(config.pintarQuadrantes, true);
  const comContagem = lerBooleano(config.mostrarContagemPorQuadrante, true);

  for (const q of QUADRANTES) {
    // Quadrante sem espaço na tela: o nome ficaria por cima do eixo.
    if (q.x === 1 && direita - xDoCorte < 44) continue;
    if (q.x === 0 && xDoCorte - esquerda < 44) continue;
    if (q.y === 1 && yDoCorte - cima < 18) continue;
    if (q.y === 0 && baixo - yDoCorte < 18) continue;

    const nome = nomeDoQuadrante(q.chave, config, nomesPadrao);
    if (!nome) continue;
    const quantos = contagem.get(q.chave) || 0;
    const texto = comContagem ? `${nome} (${quantos})` : nome;
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
        'font-family': tema.fonte,
        fill: pintar ? corDoQuadrante.get(q.chave) : tema.textoSuave,
        'data-quadrante': q.chave,
      },
    });
    definirTexto(el, texto);
  }
}

/**
 * Texto do rótulo de um ponto conforme "O que mostrar no rótulo" (ver
 * CONTEUDOS_DO_ROTULO_DE_PONTO). Formato "automático" = texto do Looker.
 */
export function textoDoRotuloDoPonto(rot, ponto, { campoX, campoY, totalY, formatoProprioX }) {
  const dadoY = {
    valor: ponto.y,
    nome: ponto.rotulo,
    total: totalY,
    valueFormat: campoY && campoY.valueFormat,
    textoDoValor: ponto.textoY,
  };
  const dadoX = {
    valor: ponto.x,
    nome: ponto.rotulo,
    valueFormat: campoX && campoX.valueFormat,
    // Valor transformado pelo perfil (BCG): usa o formatador do perfil.
    textoDoValor: ponto.textoX || (formatoProprioX ? formatoProprioX(ponto.x) : undefined),
  };
  const so = (conteudo, extra = {}) => Object.assign({}, rot, { conteudo }, extra);
  switch (rot.conteudo) {
    case 'valorY':
      return textoDoRotulo(so('valor'), dadoY);
    case 'valorX':
      return textoDoRotulo(so('valor'), dadoX);
    case 'valoresXY': {
      const t = `${textoDoRotulo(so('valor', { truncar: 0 }), dadoX)}; ${textoDoRotulo(so('valor', { truncar: 0 }), dadoY)}`;
      return rot.truncar > 0 ? truncar(t, rot.truncar) : t;
    }
    case 'nomeValor':
    case 'percentual':
    case 'valorPercentual':
      return textoDoRotulo(rot, dadoY);
    case 'nome':
    case 'valor':
    default:
      // "valor" (o padrão do bloco) é o nome do ponto nesta família.
      return textoDoRotulo(so('nome'), dadoY);
  }
}

function desenharRotulosDosPontos({ svg, pontos, config, tema, corteX, corteY, temRotulo, campoX, campoY, formatoProprioX }) {
  const rot = lerRotulos(config, tema, { tamanhoPadrao: Math.max(8, (tema.tamanhoBase || 12) - 2) });
  const quantos = Math.max(0, Math.round(lerNumero(config.quantosRotulosDePonto, 12)));
  if (!rot.mostrar || quantos <= 0 || !temRotulo) return [];

  // Rotula os mais distantes do cruzamento: são os que contam a história.
  const distancia = (p) =>
    corteX === null || corteY === null ? Math.hypot(p.x, p.y) : Math.hypot(p.x - corteX, p.y - corteY);
  const destaque = pontos.slice().sort((a, b) => distancia(b) - distancia(a)).slice(0, quantos);
  const totalY = pontos.reduce((s, p) => s + (Number.isFinite(p.y) ? p.y : 0), 0);

  const caixas = [];
  for (const ponto of destaque) {
    const texto = textoDoRotuloDoPonto(rot, ponto, { campoX, campoY, totalY, formatoProprioX });
    if (texto === '' || texto === null || texto === undefined) continue;

    const meio = ponto.diametro / 2;
    let x = ponto.px + meio + 3;
    let y = ponto.py;
    let ancora = 'start';
    let corAutomatica = tema.texto;
    let guia = null;

    switch (rot.posicao) {
      case 'dentro':
      case 'centro':
        x = ponto.px;
        ancora = 'middle';
        // Sobre o ponto: cor legível em cima da cor dele.
        corAutomatica = textoLegivelSobre(ponto.cor, tema);
        break;
      case 'foraComLinha':
        x = ponto.px + meio + 16;
        y = ponto.py - 12;
        guia = criarSvgEl('line', {
          pai: svg,
          classe: 'qd-linha-guia',
          atributos: {
            x1: ponto.px + meio * 0.7,
            y1: ponto.py - meio * 0.7,
            x2: x - 2,
            y2: y,
            stroke: tema.textoSuave,
            'stroke-width': 1,
          },
        });
        break;
      default:
        break; // auto / fora: à direita do ponto
    }

    const el = criarSvgEl('text', {
      pai: svg,
      classe: 'qd-rotulo-ponto',
      atributos: { x, y, 'text-anchor': ancora, 'dominant-baseline': 'central' },
    });
    definirTexto(el, texto);
    estilizarRotulo(el, rot, { corAutomatica, x, y });

    const largura = larguraDoTexto(texto, rot.tamanho);
    caixas.push({
      el,
      guia,
      x: ancora === 'middle' ? x : x + largura / 2,
      y,
      largura,
      altura: rot.tamanho * 1.2,
    });
  }

  // A ordem é a prioridade: os mais distantes do cruzamento ficam.
  esconderColisoes(caixas, rot);
  for (const c of caixas) {
    if (c.guia && c.el.getAttribute('display') === 'none') c.guia.setAttribute('display', 'none');
  }
  return caixas.map((c) => c.el);
}

function montarEscalaDeTamanho(pontos, config) {
  const padrao = Math.max(1, lerNumero(config.tamanhoDoPonto, 7));
  const comTamanho = pontos.filter((p) => p.tamanho !== null && Number.isFinite(p.tamanho));
  if (!comTamanho.length) return () => padrao;

  const valores = comTamanho.map((p) => p.tamanho);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const maior = Math.max(padrao, lerNumero(config.tamanhoMaximoDoPonto, 30));
  if (maximo === minimo) return () => padrao;

  // Interpolamos a ÁREA, não o diâmetro: dobrar o diâmetro quadruplica a
  // mancha e faria o leitor superestimar a diferença.
  return (valor) => {
    if (valor === null || !Number.isFinite(valor)) return padrao;
    const t = (valor - minimo) / (maximo - minimo);
    return Math.sqrt(padrao * padrao + t * (maior * maior - padrao * padrao));
  };
}

/**
 * Escala contínua da cor por medida. Usa `escalaDeCores` do núcleo, que
 * já lê escala escolhida, cores próprias (mín/meio/máx), limites manuais e
 * "Inverter ordem das cores".
 */
function montarEscalaDeCor(pontos, config, tema, temCampoDeCor) {
  const valores = pontos
    .map((p) => (temCampoDeCor ? p.valorDaCor : p.y))
    .filter((v) => v !== null && Number.isFinite(v));
  if (!valores.length) return null;
  const escala = escalaDeCores({ valores, config: Object.assign({}, config, { modoDeCor: 'valor' }), tema });
  return (valor) => escala.cor(valor);
}

/** Forma, opacidade e contorno dos pontos, lidos do config deste desenho. */
export function lerEstiloDosPontos(config, tema) {
  // O padrão do bloco de cores é contorno branco; no tema escuro isso é um
  // anel claro em volta de cada ponto. Branco "de fábrica" vira a cor do
  // fundo (que é o que o gráfico fazia antes); outra cor escolhida vale.
  const corEscolhida = lerTexto(config.corDoContorno, '');
  const corPadrao = !corEscolhida || /^#fff(fff)?$/i.test(corEscolhida) ? tema.fundo : corEscolhida;
  const contorno = lerContorno(Object.assign({}, config, { corDoContorno: corPadrao }), tema);
  if (!lerBooleano(config.contornoDoPonto, true)) contorno.mostrar = false;
  return {
    forma: formaDoMarcador(config.formaDoPonto),
    opacidade: Math.max(0, Math.min(1, lerNumero(config.opacidadeDoPonto, 0.8))) * opacidadeDoConfig(config, 1),
    contorno,
  };
}

function desenharPontosSvg(svg, pontos, estilo) {
  const grupo = criarSvgEl('g', { pai: svg, classe: 'qd-pontos' });
  // Maiores primeiro: assim os pequenos não ficam escondidos atrás.
  const ordenados = pontos.slice().sort((a, b) => b.diametro - a.diametro);
  for (const ponto of ordenados) {
    const el = criarMarcadorSvg(grupo, estilo.forma, ponto.px, ponto.py, ponto.diametro, {
      classe: 'qd-ponto',
      fill: ponto.cor,
      'fill-opacity': estilo.opacidade,
      'data-indice': ponto.indice,
      'data-quadrante': ponto.quadrante || undefined,
    });
    aplicarContorno(el, estilo.contorno);
  }
}

function desenharPontosNoCanvas(pincel, pontos, estilo) {
  const { forma, opacidade, contorno } = estilo;
  const ordenados = pontos.slice().sort((a, b) => b.diametro - a.diametro);
  const traco = contorno.mostrar ? tracejadoPorEstilo(contorno.estilo, contorno.espessura) : null;

  for (const ponto of ordenados) {
    pincel.globalAlpha = opacidade;
    pincel.fillStyle = ponto.cor;
    desenharSimboloNoCanvas(pincel, forma, ponto.px, ponto.py, ponto.diametro);
    pincel.fill();
    if (contorno.mostrar) {
      pincel.globalAlpha = 1;
      pincel.strokeStyle = contorno.cor;
      pincel.lineWidth = contorno.espessura;
      if (typeof pincel.setLineDash === 'function') pincel.setLineDash(traco ? traco.split(',').map(Number) : []);
      pincel.stroke();
    }
  }
  pincel.globalAlpha = 1;
  if (typeof pincel.setLineDash === 'function') pincel.setLineDash([]);
}

/** Formatador de razão (BCG: participação relativa, ex.: "1.25×"). */
export function formatadorDeRazao(casas = 2) {
  const f = criarFormatadorNumerico({ estilo: 'numero', casas });
  return (v) => {
    const t = f(v);
    return t === '' ? '' : `${t}×`;
  };
}
