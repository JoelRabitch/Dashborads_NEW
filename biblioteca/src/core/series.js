/**
 * series.js — transforma o modelo numa matriz "categorias × séries".
 *
 * Quase todo gráfico de linha, área, barra empilhada, fluxo ou ranking
 * precisa da mesma coisa: um eixo de categorias (geralmente tempo) e várias
 * séries alinhadas a ele. O que muda é de ONDE as séries vêm, e o Looker
 * permite três caminhos bem diferentes:
 *
 *   1. **pivô** — cada valor do pivô é uma série (o jeito mais comum);
 *   2. **segunda dimensão** — a 1ª dimensão é o eixo, a 2ª é a série;
 *   3. **várias medidas** — cada medida é uma série.
 *
 * Detectamos sozinho e deixamos trocar à mão. A saída é sempre a mesma, com
 * os valores JÁ ALINHADOS: `series[i].valores[j]` é o valor da série `i` na
 * categoria `j`, ou `null` quando não existe. Isso é o que permite empilhar
 * e interpolar sem cada gráfico reinventar o alinhamento.
 */

import { listaDeValores } from './options-kit.js';
import { paraData } from './format.js';

/** Opções de "de onde vêm as séries", para o painel. */
export function opcaoDeOrigemDasSeries(secao = 'Dados') {
  return {
    origemDasSeries: {
      type: 'string',
      label: 'De onde vêm as séries',
      section: secao,
      display: 'select',
      default: 'auto',
      values: listaDeValores([
        { rotulo: 'Detectar sozinho', valor: 'auto' },
        { rotulo: 'Do pivô', valor: 'pivo' },
        { rotulo: 'Da 2ª dimensão', valor: 'dimensao' },
        { rotulo: 'Uma série por medida', valor: 'medidas' },
      ]),
    },
    limiteDeSeries: {
      type: 'number',
      label: 'Máximo de séries (as demais viram "Outros")',
      section: secao,
      display: 'range',
      min: 2,
      max: 40,
      step: 1,
      default: 12,
    },
    agruparRestoEmOutros: {
      type: 'boolean',
      label: 'Somar as séries que passaram do limite em "Outros"',
      section: secao,
      default: true,
    },
  };
}

/** Decide a origem das séries quando o usuário deixou em "auto". */
export function detectarOrigem(modelo) {
  if (modelo.temPivo) return 'pivo';
  if (modelo.dimensoes.length >= 2) return 'dimensao';
  if (modelo.medidas.length >= 2) return 'medidas';
  return 'medidas';
}

/**
 * Monta a matriz.
 *
 * @param {object} modelo
 * @param {object} config
 * @param {{campoDaCategoria?:string, campoDaSerie?:string, medida?:string}} [escolhas]
 * @returns {{categorias:Array, series:Array, origem:string, avisos:string[],
 *            campoDaCategoria:object|null, medida:object|null}}
 */
export function extrairMatriz(modelo, config = {}, escolhas = {}) {
  const avisos = [];
  const origem =
    config.origemDasSeries && config.origemDasSeries !== 'auto'
      ? config.origemDasSeries
      : detectarOrigem(modelo);

  const campoDaCategoria =
    acharCampo(modelo.dimensoes, escolhas.campoDaCategoria) || modelo.dimensoes[0] || null;

  if (!campoDaCategoria) {
    return {
      categorias: [],
      series: [],
      origem,
      avisos: ['A consulta precisa de pelo menos uma dimensão para servir de eixo.'],
      campoDaCategoria: null,
      medida: null,
    };
  }

  // --- Eixo de categorias, na ordem em que o Looker mandou ---
  const categorias = [];
  const indicePorChave = new Map();
  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
    const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
    if (indicePorChave.has(chave)) continue;
    indicePorChave.set(chave, categorias.length);
    categorias.push({
      chave,
      rotulo: modelo.texto(linha, campoDaCategoria.nome, undefined, '∅'),
      valorBruto: bruto,
      data: campoDaCategoria.ehData ? paraData(bruto) : null,
      indiceDaPrimeiraLinha: i,
    });
  }

  const construtor = { pivo: deSeriesDoPivo, dimensao: deSeriesDaDimensao, medidas: deSeriesDasMedidas }[origem];
  const resultado = (construtor || deSeriesDasMedidas)(modelo, config, escolhas, {
    categorias,
    indicePorChave,
    campoDaCategoria,
    avisos,
  });

  const limitado = aplicarLimite(resultado.series, config, avisos, categorias.length);

  return {
    categorias,
    series: limitado,
    origem,
    avisos,
    campoDaCategoria,
    medida: resultado.medida || null,
  };
}

/* ------------------------------------------------------------------ */

function acharCampo(campos, nome) {
  if (!nome) return null;
  return campos.find((c) => c.nome === nome) || null;
}

function serieVazia(quantidade) {
  return new Array(quantidade).fill(null);
}

/** Soma um valor numa posição, tratando o null como "ainda não existe". */
function acumular(valores, posicao, valor) {
  if (valor === null) return;
  valores[posicao] = (valores[posicao] === null ? 0 : valores[posicao]) + valor;
}

/** (1) Cada valor do pivô é uma série. */
function deSeriesDoPivo(modelo, config, escolhas, { categorias, indicePorChave, campoDaCategoria }) {
  const medida = acharCampo(modelo.medidas, escolhas.medida) || modelo.medidas[0] || null;
  if (!medida) return { series: [], medida: null };

  const series = modelo.pivotsDeDados.map((pivo) => ({
    chave: pivo.chave,
    rotulo: pivo.rotulo,
    valores: serieVazia(categorias.length),
  }));

  for (const linha of modelo.linhas) {
    const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
    const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
    const coluna = indicePorChave.get(chave);
    if (coluna === undefined) continue;
    modelo.pivotsDeDados.forEach((pivo, i) => {
      acumular(series[i].valores, coluna, modelo.valorNumerico(linha, medida.nome, pivo.chave));
    });
  }

  return { series, medida };
}

/** (2) A 2ª dimensão vira a série. */
function deSeriesDaDimensao(modelo, config, escolhas, { categorias, indicePorChave, campoDaCategoria, avisos }) {
  const medida = acharCampo(modelo.medidas, escolhas.medida) || modelo.medidas[0] || null;
  const campoDaSerie =
    acharCampo(modelo.dimensoes, escolhas.campoDaSerie) ||
    modelo.dimensoes.find((d) => d.nome !== campoDaCategoria.nome) ||
    null;

  if (!campoDaSerie) {
    avisos.push('Não há uma segunda dimensão para formar as séries.');
    return { series: [], medida };
  }
  if (!medida) return { series: [], medida: null };

  const porChave = new Map();
  for (const linha of modelo.linhas) {
    const brutoCategoria = modelo.valorBruto(linha, campoDaCategoria.nome);
    const chaveCategoria = brutoCategoria === null || brutoCategoria === undefined ? '∅' : String(brutoCategoria);
    const coluna = indicePorChave.get(chaveCategoria);
    if (coluna === undefined) continue;

    const brutoSerie = modelo.valorBruto(linha, campoDaSerie.nome);
    const chaveSerie = brutoSerie === null || brutoSerie === undefined ? '∅' : String(brutoSerie);
    if (!porChave.has(chaveSerie)) {
      porChave.set(chaveSerie, {
        chave: chaveSerie,
        rotulo: modelo.texto(linha, campoDaSerie.nome, undefined, '∅'),
        valores: serieVazia(categorias.length),
      });
    }
    acumular(porChave.get(chaveSerie).valores, coluna, modelo.valorNumerico(linha, medida.nome));
  }

  return { series: Array.from(porChave.values()), medida };
}

/** (3) Cada medida é uma série. */
function deSeriesDasMedidas(modelo, config, escolhas, { categorias, indicePorChave, campoDaCategoria }) {
  const escolhidas = Array.isArray(escolhas.medidas) && escolhas.medidas.length
    ? modelo.medidas.filter((m) => escolhas.medidas.includes(m.nome))
    : modelo.medidas;

  const series = escolhidas.map((m) => ({
    chave: m.nome,
    rotulo: m.rotuloCurto,
    campo: m,
    valores: serieVazia(categorias.length),
  }));

  for (const linha of modelo.linhas) {
    const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
    const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
    const coluna = indicePorChave.get(chave);
    if (coluna === undefined) continue;
    escolhidas.forEach((m, i) => {
      acumular(series[i].valores, coluna, modelo.valorNumerico(linha, m.nome));
    });
  }

  return { series, medida: escolhidas[0] || null };
}

/**
 * Corta as séries que passaram do limite.
 *
 * Mantemos as MAIORES (por soma) e somamos o resto em "Outros" — jogar fora
 * mudaria os totais e o leitor não teria como saber.
 */
function aplicarLimite(series, config, avisos, quantidadeDeCategorias) {
  const limite = Number(config.limiteDeSeries);
  if (!Number.isFinite(limite) || limite <= 0 || series.length <= limite) return series;

  const comSoma = series.map((s) => ({
    serie: s,
    soma: s.valores.reduce((a, v) => a + (v === null ? 0 : Math.abs(v)), 0),
  }));
  comSoma.sort((a, b) => b.soma - a.soma);

  const mantidas = comSoma.slice(0, limite).map((x) => x.serie);
  const resto = comSoma.slice(limite).map((x) => x.serie);

  if (config.agruparRestoEmOutros === false) {
    avisos.push(`${resto.length} série(s) além do limite de ${limite} foram escondidas.`);
    return mantidas;
  }

  const outros = {
    chave: '__outros__',
    rotulo: 'Outros',
    ehOutros: true,
    valores: serieVazia(quantidadeDeCategorias),
  };
  for (const serie of resto) {
    serie.valores.forEach((v, i) => acumular(outros.valores, i, v));
  }

  avisos.push(`${resto.length} série(s) além do limite de ${limite} foram somadas em "Outros".`);
  return mantidas.concat([outros]);
}

/** Soma de cada categoria somando todas as séries (para percentuais). */
export function totaisPorCategoria(series, quantidadeDeCategorias) {
  const totais = new Array(quantidadeDeCategorias).fill(0);
  for (const serie of series) {
    serie.valores.forEach((v, i) => {
      if (v !== null) totais[i] += v;
    });
  }
  return totais;
}

/** Troca os nulos conforme a opção escolhida, devolvendo novas séries. */
export function tratarNulos(series, modo = 'zero') {
  if (modo === 'manter') return series;
  return series.map((serie) => ({
    ...serie,
    valores: serie.valores.map((v, i) => {
      if (v !== null) return v;
      if (modo === 'zero') return 0;
      if (modo === 'interpolar') return interpolar(serie.valores, i);
      return null;
    }),
  }));
}

/** Média entre o vizinho anterior e o próximo que tenham valor. */
function interpolar(valores, i) {
  let antes = null;
  let depois = null;
  for (let j = i - 1; j >= 0; j--) {
    if (valores[j] !== null) {
      antes = valores[j];
      break;
    }
  }
  for (let j = i + 1; j < valores.length; j++) {
    if (valores[j] !== null) {
      depois = valores[j];
      break;
    }
  }
  if (antes === null && depois === null) return null;
  if (antes === null) return depois;
  if (depois === null) return antes;
  return (antes + depois) / 2;
}
