/**
 * regras.js — motor de formatação condicional da Tabela Completa.
 *
 * Cada coluna tem até 3 regras. Uma regra é
 * `{condicao, valor, valor2, acao, cor, icone, linhaInteira, colunaComparada}`.
 *
 * Algumas condições (Top N, percentil, média) precisam olhar a coluna
 * inteira, não só a célula. Por isso o motor é montado em duas fases:
 * `prepararRegras()` calcula uma vez por renderização as estatísticas de que
 * as regras precisam, e `avaliarRegras()` decide célula a célula.
 */

const ICONES = {
  subiu: '▲',
  desceu: '▼',
  bolinha: '●',
  estrela: '★',
  atencao: '⚠',
  ok: '✓',
  erro: '✗',
};

function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Condições que exigem conhecer a distribuição da coluna. */
const PRECISA_DE_ESTATISTICA = new Set([
  'topN',
  'bottomN',
  'acimaDaMedia',
  'abaixoDaMedia',
  'acimaDoPercentil',
]);

/**
 * Pré-calcula o que as regras precisam saber sobre a coluna inteira.
 *
 * @param {Array} colunas todas as colunas (para achar a coluna comparada)
 * @param {Array<number>} indices índices das linhas que estão em jogo
 * @param {object} modelo
 * @returns {Map<string, object>} contexto por id de coluna
 */
export function prepararRegras(colunas, indices, modelo, tiposQuePrecisamDaColuna = new Set()) {
  const contextos = new Map();

  for (const coluna of colunas) {
    const tipoPrecisa = tiposQuePrecisamDaColuna.has(coluna.tipoDeCelula);
    if (!coluna.regras.length && !coluna.escalaDeCor && !tipoPrecisa) continue;

    const precisaDeValores =
      coluna.escalaDeCor || tipoPrecisa || coluna.regras.some((r) => PRECISA_DE_ESTATISTICA.has(r.condicao));

    const ctx = { minimo: null, maximo: null, media: null, corteTopN: new Map(), percentis: new Map() };

    if (precisaDeValores) {
      const valores = [];
      for (const i of indices) {
        const v = coluna.valorNumerico(modelo.linhas[i]);
        if (v !== null && Number.isFinite(v)) valores.push(v);
      }
      if (valores.length) {
        const ordenados = valores.slice().sort((a, b) => a - b);
        ctx.minimo = ordenados[0];
        ctx.maximo = ordenados[ordenados.length - 1];
        ctx.media = valores.reduce((a, b) => a + b, 0) / valores.length;
        ctx.ordenados = ordenados;
      }
    }

    // Corte do Top N / Bottom N / percentil, um por regra que pedir.
    for (const regra of coluna.regras) {
      if (!ctx.ordenados) break;
      const n = numeroOuNulo(regra.valor);
      if (n === null || n <= 0) continue;
      const ord = ctx.ordenados;
      if (regra.condicao === 'topN') {
        ctx.corteTopN.set(regra, ord[Math.max(0, ord.length - Math.min(n, ord.length))]);
      } else if (regra.condicao === 'bottomN') {
        ctx.corteTopN.set(regra, ord[Math.min(ord.length, n) - 1]);
      } else if (regra.condicao === 'acimaDoPercentil') {
        const p = Math.min(100, Math.max(0, n)) / 100;
        ctx.percentis.set(regra, ord[Math.min(ord.length - 1, Math.floor(p * (ord.length - 1)))]);
      }
    }

    contextos.set(coluna.id, ctx);
  }

  return contextos;
}

/** Diz se uma regra bate numa linha. */
function regraBate(regra, { valorNumerico, texto, coluna, linha, porId, ctx }) {
  const alvo = numeroOuNulo(regra.valor);
  const alvo2 = numeroOuNulo(regra.valor2);

  switch (regra.condicao) {
    case 'nulo':
      return valorNumerico === null && !texto;
    case 'contem':
      return !!regra.valor && texto.toLowerCase().includes(String(regra.valor).toLowerCase());
    case 'comecaCom':
      return !!regra.valor && texto.toLowerCase().startsWith(String(regra.valor).toLowerCase());
    case 'igual':
      return alvo !== null ? valorNumerico === alvo : texto === String(regra.valor);
    case 'diferente':
      return alvo !== null ? valorNumerico !== alvo : texto !== String(regra.valor);
    default:
      break;
  }

  // Daqui para baixo tudo é numérico.
  if (valorNumerico === null) return false;

  switch (regra.condicao) {
    case 'maior':
      return alvo !== null && valorNumerico > alvo;
    case 'maiorIgual':
      return alvo !== null && valorNumerico >= alvo;
    case 'menor':
      return alvo !== null && valorNumerico < alvo;
    case 'menorIgual':
      return alvo !== null && valorNumerico <= alvo;
    case 'entre':
      return alvo !== null && alvo2 !== null && valorNumerico >= Math.min(alvo, alvo2) && valorNumerico <= Math.max(alvo, alvo2);
    case 'fora':
      return alvo !== null && alvo2 !== null && (valorNumerico < Math.min(alvo, alvo2) || valorNumerico > Math.max(alvo, alvo2));
    case 'acimaDaMedia':
      return ctx.media !== null && valorNumerico > ctx.media;
    case 'abaixoDaMedia':
      return ctx.media !== null && valorNumerico < ctx.media;
    case 'topN': {
      const corte = ctx.corteTopN.get(regra);
      return corte !== undefined && valorNumerico >= corte;
    }
    case 'bottomN': {
      const corte = ctx.corteTopN.get(regra);
      return corte !== undefined && valorNumerico <= corte;
    }
    case 'acimaDoPercentil': {
      const corte = ctx.percentis.get(regra);
      return corte !== undefined && valorNumerico > corte;
    }
    case 'maiorQueColuna':
    case 'menorQueColuna': {
      const outra = porId.get(regra.colunaComparada);
      if (!outra || outra.id === coluna.id) return false;
      const v = outra.valorNumerico(linha);
      if (v === null) return false;
      return regra.condicao === 'maiorQueColuna' ? valorNumerico > v : valorNumerico < v;
    }
    default:
      return false;
  }
}

/**
 * Avalia as regras de uma coluna numa linha.
 *
 * @returns {{fundo?:string, cor?:string, negrito?:boolean, icone?:string,
 *            badge?:string, bordaEsquerda?:string, piscar?:boolean,
 *            linhaInteira?:{fundo?:string, cor?:string}}|null}
 */
export function avaliarRegras({ coluna, linha, contextos, porId, textoDaCelula }) {
  if (!coluna.regras.length) return null;
  const ctx = contextos.get(coluna.id);
  if (!ctx) return null;

  const valorNumerico = coluna.valorNumerico(linha);
  const texto = textoDaCelula === undefined ? coluna.texto(linha, '') : textoDaCelula;

  let efeito = null;
  for (const regra of coluna.regras) {
    if (!regraBate(regra, { valorNumerico, texto, coluna, linha, porId, ctx })) continue;
    if (!efeito) efeito = {};

    switch (regra.acao) {
      case 'texto':
        efeito.cor = regra.cor;
        break;
      case 'negrito':
        efeito.negrito = true;
        break;
      case 'fundoETexto':
        efeito.fundo = regra.cor;
        efeito.cor = '#FFFFFF';
        break;
      case 'icone':
        efeito.icone = ICONES[regra.icone] || ICONES.bolinha;
        efeito.corDoIcone = regra.cor;
        break;
      case 'badge':
        efeito.badge = regra.cor;
        break;
      case 'borda':
        efeito.bordaEsquerda = regra.cor;
        break;
      case 'piscar':
        efeito.piscar = true;
        efeito.cor = regra.cor;
        break;
      case 'fundo':
      default:
        efeito.fundo = regra.cor;
        break;
    }

    if (regra.linhaInteira) {
      efeito.linhaInteira = {
        fundo: regra.acao === 'texto' ? undefined : regra.cor,
        cor: regra.acao === 'texto' || regra.acao === 'fundoETexto' ? regra.cor : undefined,
      };
    }
  }

  return efeito;
}

/** Posição de um valor entre o mínimo e o máximo da coluna (0 a 1). */
export function posicaoNaColuna(valor, ctx) {
  if (valor === null || !ctx || ctx.minimo === null) return null;
  if (ctx.maximo === ctx.minimo) return 1;
  return (valor - ctx.minimo) / (ctx.maximo - ctx.minimo);
}
