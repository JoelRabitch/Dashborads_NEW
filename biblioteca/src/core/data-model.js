/**
 * data-model.js — converte `data` + `queryResponse` do Looker num modelo
 * interno ESTÁVEL. É o único arquivo (junto com o adapter) que conhece o
 * formato de dados do Looker.
 *
 * Fatos do formato do Looker usados aqui (confirmados em uso real e na
 * documentação pública da API v2 — ver docs/COMPAT.md):
 *  - `queryResponse.fields` tem `dimensions`, `measures`, `table_calculations`,
 *    `dimension_like`, `measure_like` e `pivots`.
 *  - Campo: `{ name, label, label_short, value_format, is_numeric, type }`.
 *  - Célula não pivotada: `row[nomeDoCampo] = { value, rendered, html, links }`.
 *  - Célula pivotada: `row[nomeDoCampo][chaveDoPivo] = { ...célula }`.
 *  - Com vários pivôs, a chave é a junção dos valores por `|FIELD|`.
 *  - `queryResponse.pivots` = `[{ key, is_total, data, metadata }]`.
 *  - A chave `$$$_row_total_$$$` é o total de linha calculado pelo Looker
 *    (só existe quando "Totais de linha" está ligado no Explore).
 *
 * O que é INCERTO (tratado com detecção e fallback, nunca com suposição):
 *  - Totais gerais (`totals_data`): procuramos em vários lugares e, se não
 *    acharmos, o gráfico calcula por conta própria e AVISA que é cálculo
 *    nosso (soma simples), porque a API não expõe o tipo de agregação.
 *  - `hidden_fields`: procuramos nas fontes plausíveis; se não houver,
 *    assumimos que o Looker já removeu os campos ocultos das listas.
 */

import { numeroOuNulo, paraData } from './format.js';

/** Chave especial do Looker para o total de linha num campo pivotado. */
export const CHAVE_TOTAL_DE_LINHA = '$$$_row_total_$$$';

/** Separador que o Looker usa para juntar valores de vários pivôs. */
export const SEPARADOR_DE_PIVO = '|FIELD|';

/** Normaliza um campo do Looker para o nosso formato. */
function normalizarCampo(campo, origem) {
  const tipo = campo.type || '';
  const nome = campo.name;
  return {
    nome,
    rotulo: campo.label || nome,
    rotuloCurto: campo.label_short || campo.label || nome,
    tipo,
    origem, // 'dimensao' | 'medida'
    ehNumerico: campo.is_numeric === true,
    ehTableCalc: origem === 'table_calculation' || /table_calculation/i.test(tipo),
    valueFormat: campo.value_format || null,
    // Heurística de data: o Looker usa tipos como 'date_date', 'date_month'…
    ehData: /date|time|yesno/.test(tipo) ? /date|time/.test(tipo) : false,
    bruto: campo,
  };
}

/**
 * Descobre a lista de campos escondidos pelo usuário ("Hide from
 * Visualization"). A API clássica não documenta isso de forma estável, então
 * procuramos nas fontes plausíveis e seguimos sem erro se não achar.
 */
function descobrirCamposOcultos(queryResponse, config) {
  const nomes = new Set();
  const candidatos = [
    config && config.hidden_fields,
    queryResponse && queryResponse.hidden_fields,
    queryResponse && queryResponse.fields && queryResponse.fields.hidden_fields,
    config && config.query_fields_hidden,
  ];
  for (const lista of candidatos) {
    if (Array.isArray(lista)) {
      for (const n of lista) if (typeof n === 'string') nomes.add(n);
    }
  }
  return nomes;
}

/** Rótulo legível de um valor de pivô (prefere o texto já renderizado). */
function rotuloDoPivo(pivo, camposDePivo, separador) {
  if (pivo.is_total) return 'Total';
  const partes = [];
  for (const campo of camposDePivo) {
    const meta = pivo.metadata && pivo.metadata[campo.nome];
    if (meta && meta.rendered !== undefined && meta.rendered !== null) {
      partes.push(String(meta.rendered));
      continue;
    }
    const bruto = pivo.data && pivo.data[campo.nome];
    if (bruto !== undefined && bruto !== null) partes.push(String(bruto));
  }
  if (partes.length) return partes.join(separador);
  // Último recurso: a própria chave, trocando o separador interno do Looker.
  return String(pivo.key).split(SEPARADOR_DE_PIVO).join(separador);
}

/**
 * Procura os totais gerais da consulta. Tenta as formas conhecidas e
 * devolve `{ encontrados: boolean, porCampo: {nome: celula} }`.
 */
function descobrirTotais(data, queryResponse) {
  const porCampo = {};
  let encontrados = false;

  const fontes = [
    queryResponse && queryResponse.totals_data,
    queryResponse && queryResponse.totals,
    data && data.totals_data,
  ];
  for (const fonte of fontes) {
    if (fonte && typeof fonte === 'object' && !Array.isArray(fonte)) {
      for (const nome of Object.keys(fonte)) {
        porCampo[nome] = fonte[nome];
        encontrados = true;
      }
      if (encontrados) break;
    }
  }
  return { encontrados, porCampo };
}

/**
 * Monta o modelo interno.
 *
 * @param {Array<object>} data linhas cruas do Looker
 * @param {object} queryResponse resposta crua do Looker
 * @param {object} config config da visualização (para hidden_fields etc.)
 * @param {{textoDaCelula?:Function}} ponte adapter (para texto de célula)
 */
export function construirModelo(data, queryResponse, config = {}, ponte = null) {
  const avisos = [];
  const campos = (queryResponse && queryResponse.fields) || {};
  const ocultos = descobrirCamposOcultos(queryResponse, config);

  const visivel = (campo) => !ocultos.has(campo.name);

  const dimensoesBrutas = (campos.dimension_like || campos.dimensions || []).filter(visivel);
  const medidasBrutas = (campos.measure_like || campos.measures || []).filter(visivel);
  const pivotsBrutos = campos.pivots || [];

  const dimensoes = dimensoesBrutas.map((c) => normalizarCampo(c, 'dimensao'));
  const medidas = medidasBrutas.map((c) => normalizarCampo(c, 'medida'));
  const camposDePivo = pivotsBrutos.map((c) => normalizarCampo(c, 'dimensao'));

  if (ocultos.size) {
    avisos.push(`${ocultos.size} campo(s) ocultos na visualização foram ignorados.`);
  }

  const porNome = new Map();
  for (const c of dimensoes) porNome.set(c.nome, c);
  for (const c of medidas) porNome.set(c.nome, c);
  for (const c of camposDePivo) porNome.set(c.nome, c);

  const separadorDePivo = config.separadorDeRotuloDePivo || ' / ';
  const pivotsCrus = (queryResponse && queryResponse.pivots) || [];
  const pivots = pivotsCrus.map((p) => ({
    chave: p.key,
    ehTotal: !!p.is_total,
    rotulo: rotuloDoPivo(p, camposDePivo, separadorDePivo),
    valores: p.data || {},
    bruto: p,
  }));
  const pivotsDeDados = pivots.filter((p) => !p.ehTotal);
  const temPivo = pivotsDeDados.length > 0;

  const linhas = Array.isArray(data) ? data : [];
  const totais = descobrirTotais(data, queryResponse);

  /** Devolve a célula crua de um campo numa linha (com ou sem pivô). */
  function celula(linha, nomeDoCampo, chaveDoPivo) {
    if (!linha) return undefined;
    const valorDoCampo = linha[nomeDoCampo];
    if (valorDoCampo === undefined || valorDoCampo === null) return undefined;
    if (chaveDoPivo === undefined || chaveDoPivo === null) {
      // Campo não pivotado: a própria célula.
      // (Se o campo FOR pivotado e ninguém passou chave, não há valor único.)
      return valorDoCampo.value !== undefined || valorDoCampo.rendered !== undefined
        ? valorDoCampo
        : undefined;
    }
    return valorDoCampo[chaveDoPivo];
  }

  /** Valor numérico de uma célula (null quando não é número). */
  function valorNumerico(linha, nomeDoCampo, chaveDoPivo) {
    const c = celula(linha, nomeDoCampo, chaveDoPivo);
    if (!c) return null;
    return numeroOuNulo(c.value);
  }

  /** Valor bruto (sem conversão). */
  function valorBruto(linha, nomeDoCampo, chaveDoPivo) {
    const c = celula(linha, nomeDoCampo, chaveDoPivo);
    return c ? c.value : null;
  }

  /** Texto de exibição (usa o adapter, que prefere o `rendered` do Looker). */
  function texto(linha, nomeDoCampo, chaveDoPivo, textoQuandoNulo = '∅') {
    const c = celula(linha, nomeDoCampo, chaveDoPivo);
    if (ponte && typeof ponte.textoDaCelula === 'function') {
      return ponte.textoDaCelula(c, textoQuandoNulo);
    }
    if (!c || c.value === null || c.value === undefined) return textoQuandoNulo;
    return c.rendered !== undefined && c.rendered !== null ? String(c.rendered) : String(c.value);
  }

  /** Data de uma célula (null quando não dá para interpretar). */
  function valorData(linha, nomeDoCampo, chaveDoPivo) {
    const c = celula(linha, nomeDoCampo, chaveDoPivo);
    return c ? paraData(c.value) : null;
  }

  /** Total de linha calculado pelo Looker para um campo pivotado. */
  function totalDaLinha(linha, nomeDoCampo) {
    const valorDoCampo = linha && linha[nomeDoCampo];
    if (!valorDoCampo) return null;
    const c = valorDoCampo[CHAVE_TOTAL_DE_LINHA];
    return c ? numeroOuNulo(c.value) : null;
  }

  /**
   * Extrai séries prontas para o gráfico.
   * @param {{dimensao?:string, medida?:string, medidas?:string[], limite?:number,
   *          tratamentoDeNulos?:'omitir'|'zero'|'manter'}} opcoes
   */
  function extrairSerie(opcoes = {}) {
    const {
      dimensao = dimensoes[0] && dimensoes[0].nome,
      medida = medidas[0] && medidas[0].nome,
      limite = Infinity,
      tratamentoDeNulos = 'omitir',
    } = opcoes;

    const itens = [];
    let nulosIgnorados = 0;
    for (let i = 0; i < linhas.length && itens.length < limite; i++) {
      const linha = linhas[i];
      const v = medida ? valorNumerico(linha, medida) : null;
      if (v === null) {
        if (tratamentoDeNulos === 'omitir') {
          nulosIgnorados++;
          continue;
        }
      }
      itens.push({
        rotulo: dimensao ? texto(linha, dimensao, undefined, '') : '',
        valorBruto: dimensao ? valorBruto(linha, dimensao) : null,
        valor: v === null ? (tratamentoDeNulos === 'zero' ? 0 : null) : v,
        linha,
        indice: i,
      });
    }
    return { itens, nulosIgnorados };
  }

  /** Lista de valores distintos de uma dimensão, na ordem em que aparecem. */
  function valoresDistintos(nomeDoCampo, limite = 5000) {
    const vistos = new Set();
    const saida = [];
    for (const linha of linhas) {
      const v = valorBruto(linha, nomeDoCampo);
      const chave = v === null || v === undefined ? '∅' : String(v);
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      saida.push({ chave, valor: v, texto: texto(linha, nomeDoCampo, undefined, '∅') });
      if (saida.length >= limite) break;
    }
    return saida;
  }

  return {
    // Campos
    dimensoes,
    medidas,
    camposDePivo,
    porNome,
    campo: (nome) => porNome.get(nome) || null,

    // Pivô
    pivots,
    pivotsDeDados,
    temPivo,
    pivoDeTotal: pivots.find((p) => p.ehTotal) || null,

    // Linhas
    linhas,
    quantidadeDeLinhas: linhas.length,

    // Acesso a valores
    celula,
    valorNumerico,
    valorBruto,
    valorData,
    texto,
    totalDaLinha,
    extrairSerie,
    valoresDistintos,

    // Totais gerais
    totais,

    // Diagnóstico
    avisos,
    queryResponseBruto: queryResponse,
  };
}

/**
 * Validação declarativa do formato esperado por um gráfico.
 * Devolve `null` quando está tudo certo, ou `{ titulo, mensagem }`.
 */
export function validarModelo(modelo, exigencia = {}) {
  const {
    dimensoesMin = 0,
    dimensoesMax = Infinity,
    medidasMin = 0,
    medidasMax = Infinity,
    aceitaPivo = true,
    exigePivo = false,
    exigeLinhas = true,
  } = exigencia;

  if (exigePivo && !modelo.temPivo) {
    return {
      titulo: 'Pivô obrigatório',
      mensagem:
        'Esta visualização precisa de uma dimensão pivotada. Clique no ícone de ' +
        'pivô ao lado de uma dimensão no Explore.',
    };
  }
  if (!aceitaPivo && modelo.temPivo) {
    return {
      titulo: 'Pivô não suportado',
      mensagem:
        'Esta visualização não aceita consultas com pivô. Remova o pivô no ' +
        'Explore e rode de novo.',
    };
  }
  if (modelo.dimensoes.length < dimensoesMin || modelo.dimensoes.length > dimensoesMax) {
    return {
      titulo: 'Faltam campos',
      mensagem:
        `Esta visualização espera de ${dimensoesMin} a ${
          dimensoesMax === Infinity ? 'várias' : dimensoesMax
        } dimensões e recebeu ${modelo.dimensoes.length}. Ajuste os campos no Explore.`,
    };
  }
  if (modelo.medidas.length < medidasMin || modelo.medidas.length > medidasMax) {
    return {
      titulo: 'Faltam campos',
      mensagem:
        `Esta visualização espera de ${medidasMin} a ${
          medidasMax === Infinity ? 'várias' : medidasMax
        } medidas e recebeu ${modelo.medidas.length}. Ajuste os campos no Explore.`,
    };
  }
  if (exigeLinhas && modelo.quantidadeDeLinhas === 0) {
    return {
      titulo: 'Sem dados',
      mensagem: 'A consulta não retornou nenhuma linha. Revise os filtros do Explore.',
    };
  }
  return null;
}
