/**
 * estatistica.js — as contas que o TIER 3 inteiro compartilha.
 *
 * Quartis, densidade por kernel, limites de outlier e regressão linear
 * aparecem em `violin`, `ridgeline`, `beeswarm`, `boxplot_avancado`,
 * `densidade_ecdf`, `dispersao_regressao` e `qq_plot`. Deixar cada gráfico
 * com a própria versão é o caminho mais curto para dois gráficos do mesmo
 * dado mostrarem medianas diferentes.
 *
 * Sobre quartis: NÃO existe uma definição única. R tem nove métodos, Excel
 * tem dois, e eles discordam em amostras pequenas. Usamos o tipo 7 (o
 * padrão do R e do d3), e o método fica anotado no código e no tooltip —
 * um quartil sem método declarado é um número sem procedência.
 */

/** Ordena uma cópia e descarta o que não é número. */
export function limparEOrdenar(valores) {
  return valores.filter((v) => v !== null && v !== undefined && Number.isFinite(v)).sort((a, b) => a - b);
}

/**
 * Quantil pelo método tipo 7 (padrão do R e do d3).
 *
 * @param {number[]} ordenados valores JÁ ordenados
 * @param {number} p de 0 a 1
 */
export function quantil(ordenados, p) {
  if (!ordenados.length) return null;
  if (ordenados.length === 1) return ordenados[0];
  const posicao = (ordenados.length - 1) * Math.max(0, Math.min(1, p));
  const base = Math.floor(posicao);
  const resto = posicao - base;
  if (base + 1 >= ordenados.length) return ordenados[ordenados.length - 1];
  return ordenados[base] + (ordenados[base + 1] - ordenados[base]) * resto;
}

/**
 * Resumo de cinco números + média e desvio.
 *
 * @returns {{n, minimo, q1, mediana, q3, maximo, media, desvio, iqr}|null}
 */
export function resumoDeDistribuicao(valores) {
  const ordenados = limparEOrdenar(valores);
  if (!ordenados.length) return null;

  const n = ordenados.length;
  const media = ordenados.reduce((a, b) => a + b, 0) / n;
  // Desvio AMOSTRAL (divide por n−1): é o que se quer ao descrever uma
  // amostra, que é sempre o caso de uma consulta do Looker.
  const variancia = n > 1 ? ordenados.reduce((a, v) => a + (v - media) ** 2, 0) / (n - 1) : 0;

  const q1 = quantil(ordenados, 0.25);
  const q3 = quantil(ordenados, 0.75);

  return {
    n,
    ordenados,
    minimo: ordenados[0],
    maximo: ordenados[n - 1],
    q1,
    mediana: quantil(ordenados, 0.5),
    q3,
    iqr: q3 - q1,
    media,
    desvio: Math.sqrt(variancia),
  };
}

/**
 * Limites de outlier pela regra de 1,5 × IQR (Tukey).
 *
 * Os "bigodes" NÃO vão até o limite calculado: vão até o último valor real
 * que ainda cabe dentro dele. Desenhar o limite seco sugeriria um dado que
 * não existe.
 */
export function limitesDeOutlier(resumo, fator = 1.5) {
  if (!resumo) return null;
  const inferior = resumo.q1 - fator * resumo.iqr;
  const superior = resumo.q3 + fator * resumo.iqr;

  let bigodeInferior = resumo.maximo;
  let bigodeSuperior = resumo.minimo;
  const outliers = [];

  for (const v of resumo.ordenados) {
    if (v < inferior || v > superior) {
      outliers.push(v);
      continue;
    }
    if (v < bigodeInferior) bigodeInferior = v;
    if (v > bigodeSuperior) bigodeSuperior = v;
  }

  if (bigodeInferior > bigodeSuperior) {
    // Tudo virou outlier (acontece com distribuições muito estranhas).
    bigodeInferior = resumo.minimo;
    bigodeSuperior = resumo.maximo;
  }

  return { inferior, superior, bigodeInferior, bigodeSuperior, outliers };
}

/* ------------------------------------------------------------------ */
/* Densidade                                                           */
/* ------------------------------------------------------------------ */

/** Kernel gaussiano normalizado. */
function kernelGaussiano(u) {
  return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

/**
 * Largura de banda pela regra de Silverman.
 *
 * Usa o MENOR entre o desvio padrão e o IQR/1,349 — a versão robusta.
 * Com desvio puro, um único outlier alarga a banda e achata a distribuição
 * inteira, escondendo exatamente o que o gráfico deveria mostrar.
 */
export function larguraDeBandaSilverman(resumo) {
  if (!resumo || resumo.n < 2) return 1;
  const escalaRobusta = resumo.iqr > 0 ? resumo.iqr / 1.349 : resumo.desvio;
  const escala = Math.min(resumo.desvio || escalaRobusta, escalaRobusta || resumo.desvio);
  const largura = 0.9 * (escala || 1) * resumo.n ** (-1 / 5);
  return largura > 0 ? largura : 1;
}

/**
 * Estimativa de densidade por kernel.
 *
 * @param {object} params
 * @param {number[]} params.valores
 * @param {number} [params.largura] largura de banda; sem ela, Silverman
 * @param {number} [params.pontos] quantos pontos na curva
 * @param {[number, number]} [params.intervalo] onde avaliar
 * @returns {{curva:Array<{x:number, densidade:number}>, largura:number, maximo:number}}
 */
export function densidadePorKernel({ valores, largura, pontos = 64, intervalo }) {
  const resumo = resumoDeDistribuicao(valores);
  if (!resumo) return { curva: [], largura: 1, maximo: 0 };

  const banda = largura && largura > 0 ? largura : larguraDeBandaSilverman(resumo);

  // O intervalo passa um pouco dos extremos: a cauda da gaussiana precisa
  // de espaço para descer até zero, senão a curva sai cortada na vertical.
  const folga = banda * 3;
  const de = intervalo ? intervalo[0] : resumo.minimo - folga;
  const ate = intervalo ? intervalo[1] : resumo.maximo + folga;
  const passo = pontos > 1 ? (ate - de) / (pontos - 1) : 0;

  const curva = [];
  let maximo = 0;

  for (let i = 0; i < pontos; i++) {
    const x = de + passo * i;
    let soma = 0;
    for (const v of resumo.ordenados) soma += kernelGaussiano((x - v) / banda);
    const densidade = soma / (resumo.n * banda);
    if (densidade > maximo) maximo = densidade;
    curva.push({ x, densidade });
  }

  return { curva, largura: banda, maximo };
}

/**
 * Função de distribuição acumulada empírica.
 *
 * @returns {Array<{x:number, p:number}>}
 */
export function acumuladaEmpirica(valores) {
  const ordenados = limparEOrdenar(valores);
  return ordenados.map((x, i) => ({ x, p: (i + 1) / ordenados.length }));
}

/* ------------------------------------------------------------------ */
/* Regressão e correlação                                              */
/* ------------------------------------------------------------------ */

/**
 * Regressão linear simples por mínimos quadrados.
 *
 * @param {Array<{x:number, y:number}>} pontos
 * @returns {{inclinacao, intercepto, r2, n, previsto:Function}|null}
 */
export function regressaoLinear(pontos) {
  const limpos = pontos.filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
  );
  const n = limpos.length;
  if (n < 2) return null;

  let somaX = 0;
  let somaY = 0;
  for (const p of limpos) {
    somaX += p.x;
    somaY += p.y;
  }
  const mediaX = somaX / n;
  const mediaY = somaY / n;

  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of limpos) {
    const dx = p.x - mediaX;
    const dy = p.y - mediaY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }

  // Todos os X iguais: não existe reta de regressão, e inventar uma
  // vertical seria pior do que admitir que não dá.
  if (sxx === 0) return null;

  const inclinacao = sxy / sxx;
  const intercepto = mediaY - inclinacao * mediaX;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);

  // Soma dos quadrados dos resíduos, pela identidade SQE = Syy − b·Sxy.
  // O `max(0)` existe só por causa de erro de ponto flutuante quando o
  // ajuste é perfeito: a conta pode dar −1e−12 e a raiz viraria NaN.
  const sqe = Math.max(0, syy - inclinacao * sxy);
  // Com n = 2 a reta passa exatamente pelos dois pontos e não sobra grau
  // de liberdade para estimar o erro. Dizer isso é melhor que devolver 0,
  // que seria lido como "ajuste perfeito e preciso".
  const erroResidual = n > 2 ? Math.sqrt(sqe / (n - 2)) : null;

  return {
    n,
    inclinacao,
    intercepto,
    r2: Math.max(0, Math.min(1, r2)),
    mediaX,
    mediaY,
    sxx,
    syy,
    sxy,
    sqe,
    erroResidual,
    grausDeLiberdade: n - 2,
    previsto: (x) => intercepto + inclinacao * x,
  };
}

/**
 * Quantil da distribuição t de Student, pela expansão de Cornish-Fisher
 * sobre o quantil normal.
 *
 * A precisão é excelente de ν ≈ 5 para cima (erro < 0,1%) e se degrada nos
 * graus de liberdade muito baixos: em ν = 2 o erro é de ~0,8%. Como
 * qualquer gráfico que use isto já precisa avisar que n pequeno não
 * sustenta inferência, a aproximação não é o elo fraco da corrente.
 *
 * @param {number} p de 0 a 1
 * @param {number} gl graus de liberdade (> 0)
 */
export function quantilT(p, gl) {
  if (!(p > 0 && p < 1) || !(gl > 0)) return null;
  const z = quantilNormalPadrao(p);
  if (z === null) return null;
  if (gl > 1000) return z;

  const z2 = z * z;
  const z3 = z2 * z;
  const z5 = z3 * z2;
  const z7 = z5 * z2;
  const z9 = z7 * z2;
  const v = gl;

  return (
    z +
    (z3 + z) / (4 * v) +
    (5 * z5 + 16 * z3 + 3 * z) / (96 * v * v) +
    (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * v * v * v) +
    (79 * z9 + 776 * z7 + 1482 * z5 - 1920 * z3 - 945 * z) / (92160 * v * v * v * v)
  );
}

/** Correlação de Pearson, de −1 a 1. */
export function correlacaoDePearson(pontos) {
  const regressao = regressaoLinear(pontos);
  if (!regressao) return null;
  const sinal = regressao.inclinacao >= 0 ? 1 : -1;
  return sinal * Math.sqrt(regressao.r2);
}

/* ------------------------------------------------------------------ */
/* Distribuição normal                                                 */
/* ------------------------------------------------------------------ */

/**
 * Quantil da normal padrão (inversa da acumulada).
 *
 * Aproximação de Acklam: erro abaixo de 1,15e−9 em toda a faixa útil. É o
 * suficiente para posicionar pontos num Q-Q plot, e evita trazer uma
 * dependência só para isso.
 */
export function quantilNormalPadrao(p) {
  if (!(p > 0 && p < 1)) return null;

  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687,
    138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866,
    66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996,
    3.754408661907416];

  const baixo = 0.02425;
  const alto = 1 - baixo;

  if (p < baixo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > alto) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Densidade da normal com média e desvio dados. */
export function densidadeNormal(x, media, desvio) {
  if (!(desvio > 0)) return 0;
  const u = (x - media) / desvio;
  return kernelGaussiano(u) / desvio;
}

/* ------------------------------------------------------------------ */
/* Agrupamento                                                         */
/* ------------------------------------------------------------------ */

/**
 * Agrupa os valores de uma medida por categoria.
 *
 * É o primeiro passo de todo gráfico de distribuição por grupo, e não há
 * razão para cada um reescrevê-lo.
 *
 * @returns {Array<{chave, rotulo, valores:number[], indiceDaLinha:number}>}
 */
export function agruparValores({ modelo, campoDaCategoria, medida }) {
  const porChave = new Map();

  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const chave = campoDaCategoria
      ? String(modelo.valorBruto(linha, campoDaCategoria.nome))
      : '__todos__';

    if (!porChave.has(chave)) {
      porChave.set(chave, {
        chave,
        rotulo: campoDaCategoria
          ? modelo.texto(linha, campoDaCategoria.nome, undefined, '∅')
          : medida.rotuloCurto,
        valores: [],
        indiceDaLinha: i,
      });
    }

    const v = modelo.valorNumerico(linha, medida.nome);
    if (v !== null) porChave.get(chave).valores.push(v);
  }

  return Array.from(porChave.values()).filter((g) => g.valores.length > 0);
}
