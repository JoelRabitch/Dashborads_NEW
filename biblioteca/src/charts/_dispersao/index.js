/**
 * _dispersao — base compartilhada dos gráficos de nuvem de pontos.
 *
 * `dispersao_regressao` e `matriz_dispersao` resolvem os mesmos problemas
 * antes de desenhar: ler os pares (x, y) descartando o que não é número,
 * decidir entre SVG e canvas pelo volume, ajustar uma reta e — o mais
 * importante — descobrir quando essa reta está mentindo.
 *
 * O que fica aqui é isso. O arranjo da cena é de cada gráfico.
 *
 * (A pasta começa com `_`: não é um gráfico registrado, é código
 * compartilhado.)
 */

import { criarEl, prepararCanvas, criarSvgEl } from '../../core/dom.js';
import { desenharSimboloNoCanvas } from '../../core/shapes.js';
import { regressaoLinear, quantilT } from '../../core/estatistica.js';
import { listaDeValores } from '../../core/options-kit.js';

export const CSS_DISPERSAO = `
.dr-area{position:relative;width:100%;height:100%;}
.dr-canvas{position:absolute;left:0;top:0;}
.dr-svg{position:absolute;left:0;top:0;}
.dr-marca{pointer-events:none;}
.dr-reta{pointer-events:none;}
.dr-envelope{pointer-events:none;}
.dr-caixa{position:absolute;right:10px;top:8px;font-size:11px;line-height:1.5;
  padding:6px 8px;border-radius:4px;pointer-events:none;max-width:46%;}
.dr-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso, um elemento SVG por ponto trava o navegador. */
export const LIMITE_PARA_CANVAS = 2000;

/** Abaixo disso, R² e correlação dizem mais sobre o acaso que sobre o dado. */
export const MINIMO_PARA_INFERENCIA = 10;

/** Opções de aparência do ponto, comuns à família. */
export function opcoesDePontos({ secao = 'Formato', tamanhoPadrao = 5, opacidadePadrao = 0.7 } = {}) {
  return {
    tamanhoDoPonto: {
      type: 'number',
      label: 'Tamanho do ponto',
      section: secao,
      display: 'range',
      min: 1,
      max: 16,
      step: 0.5,
      default: tamanhoPadrao,
    },
    opacidadeDoPonto: {
      type: 'number',
      label: 'Opacidade do ponto',
      section: secao,
      display: 'range',
      min: 0.05,
      max: 1,
      step: 0.05,
      default: opacidadePadrao,
    },
    formaDoPonto: {
      type: 'string',
      label: 'Forma do ponto',
      section: secao,
      display: 'select',
      default: 'circulo',
      values: listaDeValores([
        { rotulo: 'Círculo', valor: 'circulo' },
        { rotulo: 'Quadrado', valor: 'quadrado' },
        { rotulo: 'Losango', valor: 'losango' },
        { rotulo: 'Cruz', valor: 'cruz' },
      ]),
    },
  };
}

/**
 * Lê os pares (x, y) do modelo.
 *
 * Linhas sem valor em QUALQUER dos dois eixos ficam de fora — e quem chama
 * recebe a contagem, porque descartar em silêncio muda o gráfico sem o
 * usuário saber.
 *
 * @returns {{pontos:Array, descartadas:number}}
 */
export function lerPontos({ modelo, campoX, campoY, campoDoRotulo = null }) {
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
      rotulo: campoDoRotulo ? modelo.texto(linha, campoDoRotulo.nome, undefined, '') : `#${i + 1}`,
    });
  }
  return { pontos, descartadas: modelo.linhas.length - pontos.length };
}

/**
 * Desenha a nuvem, escolhendo a técnica pelo volume.
 *
 * Cada ponto precisa já ter `px` e `py` (posição em pixels) e, se for o
 * caso, `cor`. Devolve se o canvas foi usado, porque isso é informação
 * para o usuário — a técnica muda o que ele pode esperar do gráfico.
 *
 * @returns {{usouCanvas:boolean, contexto:CanvasRenderingContext2D|null}}
 */
export function desenharNuvem({
  area,
  svg,
  pontos,
  largura,
  altura,
  raio,
  forma = 'circulo',
  opacidade = 0.7,
  cor,
  limite = LIMITE_PARA_CANVAS,
  classe = 'dr-marca',
}) {
  if (pontos.length <= limite) {
    for (const ponto of pontos) {
      criarSvgEl('circle', {
        pai: svg,
        classe,
        atributos: {
          cx: ponto.px,
          cy: ponto.py,
          r: raio,
          fill: ponto.cor || cor,
          opacity: opacidade,
        },
      });
    }
    return { usouCanvas: false, contexto: null };
  }

  const canvas = criarEl('canvas', { classe: 'dr-canvas' });
  area.insertBefore(canvas, svg);
  const { ctx: pincel } = prepararCanvas(canvas, largura, altura);
  if (!pincel) return { usouCanvas: true, contexto: null };

  pincel.globalAlpha = opacidade;
  let corAtual = null;
  for (const ponto of pontos) {
    const corDoPonto = ponto.cor || cor;
    if (corDoPonto !== corAtual) {
      pincel.fillStyle = corDoPonto;
      corAtual = corDoPonto;
    }
    desenharSimboloNoCanvas(pincel, forma, ponto.px, ponto.py, raio * 2);
    pincel.fill();
  }
  pincel.globalAlpha = 1;
  return { usouCanvas: true, contexto: pincel };
}

/**
 * Reta forçada pela origem: minimiza os resíduos com intercepto fixo em 0.
 *
 * É uma restrição forte e quase sempre errada — só faz sentido quando
 * "x = 0 ⇒ y = 0" é verdade por construção. Fica como opção, nunca padrão.
 * O R² aqui é o da definição `1 − SQE/Syy` em torno da média, para
 * continuar comparável com o do ajuste livre (a definição alternativa, em
 * torno de zero, infla o número e enganaria a comparação).
 */
export function regressaoPelaOrigem(pontos) {
  const limpos = pontos.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const n = limpos.length;
  if (n < 2) return null;

  let sxy = 0;
  let sxx = 0;
  let somaY = 0;
  for (const p of limpos) {
    sxy += p.x * p.y;
    sxx += p.x * p.x;
    somaY += p.y;
  }
  if (sxx === 0) return null;

  const inclinacao = sxy / sxx;
  const mediaY = somaY / n;
  let sqe = 0;
  let syy = 0;
  for (const p of limpos) {
    sqe += (p.y - inclinacao * p.x) ** 2;
    syy += (p.y - mediaY) ** 2;
  }

  return {
    n,
    inclinacao,
    intercepto: 0,
    r2: syy === 0 ? 1 : Math.max(0, Math.min(1, 1 - sqe / syy)),
    mediaX: limpos.reduce((a, p) => a + p.x, 0) / n,
    sxx,
    syy,
    sqe,
    erroResidual: n > 1 ? Math.sqrt(sqe / (n - 1)) : null,
    grausDeLiberdade: n - 1,
    pelaOrigem: true,
    previsto: (x) => inclinacao * x,
  };
}

/** Ajuste conforme a opção, com ou sem intercepto. */
export function ajustar(pontos, { pelaOrigem = false } = {}) {
  return pelaOrigem ? regressaoPelaOrigem(pontos) : regressaoLinear(pontos);
}

/**
 * Banda de incerteza em torno da reta.
 *
 * Confiança da RETA:  ŷ ± t·s·√(1/n + (x−x̄)²/Sxx)
 * Predição:           ŷ ± t·s·√(1 + 1/n + (x−x̄)²/Sxx)
 *
 * A diferença é aquele `1` — e ele muda tudo: a primeira banda encolhe
 * quando n cresce, a segunda não, porque a variação individual não some
 * por mais dados que se colete. Elas são lidas como a mesma coisa o tempo
 * todo, e é por isso que quem desenha precisa nomear qual está desenhando.
 */
export function calcularBanda({ ajuste, de, ate, nivel = 0.95, predicao = false, passos = 60 }) {
  if (!ajuste || ajuste.erroResidual === null || !(ajuste.sxx > 0)) return null;

  const t = quantilT(1 - (1 - nivel) / 2, ajuste.grausDeLiberdade);
  if (t === null) return null;

  // `passos` zero ou negativo faria `i/passos` virar NaN e a banda inteira
  // sumir sem erro. Um passo é o mínimo que produz coordenadas válidas.
  const divisoes = Math.max(1, passos);
  const pontos = [];
  for (let i = 0; i <= divisoes; i++) {
    const x = de + ((ate - de) * i) / divisoes;
    const dentro = 1 / ajuste.n + (x - ajuste.mediaX) ** 2 / ajuste.sxx;
    const meia = t * ajuste.erroResidual * Math.sqrt(predicao ? 1 + dentro : dentro);
    const previsto = ajuste.previsto(x);
    pontos.push({ x, previsto, superior: previsto + meia, inferior: previsto - meia, meia });
  }
  return pontos;
}

/**
 * Teste de corridas (Wald-Wolfowitz) sobre os sinais dos resíduos,
 * ordenados por x.
 *
 * Se a relação é mesmo uma reta, o resíduo de cada ponto é ruído e os
 * sinais alternam ao acaso. Se a relação é curva, os sinais se agrupam:
 * um trecho inteiro acima da reta, outro inteiro abaixo. Poucas corridas
 * demais é exatamente essa assinatura — e é uma coisa que o olho humano
 * não vê quando o R² está alto.
 *
 * @returns {{corridas, esperadas, z, suspeito, n}|null}
 */
export function testeDeCorridas(pontos, ajuste) {
  if (!ajuste) return null;

  const ordenados = pontos
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .slice()
    .sort((a, b) => a.x - b.x);

  const sinais = [];
  for (const p of ordenados) {
    const residuo = p.y - ajuste.previsto(p.x);
    if (residuo === 0) continue; // empate exato não conta para nenhum lado
    sinais.push(residuo > 0 ? 1 : -1);
  }

  const n = sinais.length;
  const positivos = sinais.filter((s) => s > 0).length;
  const negativos = n - positivos;
  // Com menos de 20 pontos a aproximação normal do número de corridas não
  // vale, e acusar curvatura aqui seria inventar um sinal.
  if (n < 20 || positivos === 0 || negativos === 0) return null;

  let corridas = 1;
  for (let i = 1; i < n; i++) {
    if (sinais[i] !== sinais[i - 1]) corridas += 1;
  }

  const esperadas = (2 * positivos * negativos) / n + 1;
  const variancia =
    (2 * positivos * negativos * (2 * positivos * negativos - n)) / (n * n * (n - 1));
  if (!(variancia > 0)) return null;

  const z = (corridas - esperadas) / Math.sqrt(variancia);
  // Só o lado de POUCAS corridas interessa: muitas corridas é
  // superalternância, que não é sinal de relação curva.
  return { corridas, esperadas, z, n, suspeito: z < -2 };
}

/**
 * Lê as linhas que têm valor em TODAS as medidas pedidas.
 *
 * O critério é deliberadamente duro. Se cada par usasse as linhas que
 * tivesse, os painéis de uma matriz descreveriam amostras diferentes — e
 * nada na tela diria isso: as nuvens continuariam bonitas e as
 * correlações, comparáveis entre si na aparência e incomparáveis de fato.
 *
 * @returns {{linhas:Array<{indice, valores:number[], rotulo:string}>, descartadas:number}}
 */
export function lerLinhasCompletas({ modelo, medidas, campoDoRotulo = null }) {
  const linhas = [];
  for (let i = 0; i < modelo.linhas.length; i++) {
    const valores = medidas.map((m) => modelo.valorNumerico(modelo.linhas[i], m.nome));
    if (valores.some((v) => v === null)) continue;
    linhas.push({
      indice: i,
      valores,
      rotulo: campoDoRotulo
        ? modelo.texto(modelo.linhas[i], campoDoRotulo.nome, undefined, '')
        : `#${i + 1}`,
    });
  }
  return { linhas, descartadas: modelo.linhas.length - linhas.length };
}
