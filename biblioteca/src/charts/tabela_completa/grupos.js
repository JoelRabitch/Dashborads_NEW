/**
 * grupos.js — agrupamento de linhas, subtotais e filtros por coluna.
 *
 * A tabela desenha uma lista plana de "itens visuais" em vez de linhas de
 * dados. Um item é um cabeçalho de grupo, uma linha de dados ou um subtotal.
 * Como todos têm a mesma altura, a virtualização continua funcionando sem
 * nenhuma conta especial — foi por isso que a lista é plana.
 */

import { agregar } from './render.js';

/** Aplica os filtros por coluna; devolve os índices que sobraram. */
export function aplicarFiltrosDeColuna(indices, colunas, filtros, modelo) {
  const ativos = colunas
    .map((coluna) => ({ coluna, termo: (filtros[coluna.id] || '').trim() }))
    .filter((f) => f.termo);
  if (!ativos.length) return indices;

  const testes = ativos.map(({ coluna, termo }) => {
    // ">100", "<=5", "=3" em coluna numérica; senão, texto contido.
    const comparacao = /^(>=|<=|>|<|=)\s*(-?[\d.,]+)$/.exec(termo);
    if (comparacao && coluna.ehMedida) {
      const operador = comparacao[1];
      const alvo = Number(comparacao[2].replace(/\./g, '').replace(',', '.'));
      return (linha) => {
        const v = coluna.valorNumerico(linha);
        if (v === null || !Number.isFinite(alvo)) return false;
        if (operador === '>') return v > alvo;
        if (operador === '>=') return v >= alvo;
        if (operador === '<') return v < alvo;
        if (operador === '<=') return v <= alvo;
        return v === alvo;
      };
    }
    const alvo = termo.toLowerCase();
    return (linha) => coluna.texto(linha, '').toLowerCase().includes(alvo);
  });

  return indices.filter((i) => {
    const linha = modelo.linhas[i];
    return testes.every((teste) => teste(linha));
  });
}

/**
 * Monta a lista plana de itens visuais.
 *
 * @returns {Array<{tipo:'grupo'|'dado', ...}>}
 */
export function montarItens({ indices, colunas, config, modelo, estado }) {
  const quantosNiveis = Number(config.agruparPor);
  const dimensoes = colunas.filter((c) => c.tipo === 'dimensao' && c.visivel);
  const niveis = Number.isFinite(quantosNiveis) ? Math.min(quantosNiveis, dimensoes.length) : 0;

  if (niveis <= 0) return indices.map((indice) => ({ tipo: 'dado', indice }));

  const colunasDeGrupo = dimensoes.slice(0, niveis);
  const itens = [];

  // Agrupamento estável: a ordem dos grupos segue a ordem das linhas que
  // chegaram (já ordenadas), e não uma reordenação própria.
  construirNivel(indices, 0);

  function construirNivel(indicesDoNivel, nivel) {
    if (nivel >= colunasDeGrupo.length) {
      for (const indice of indicesDoNivel) itens.push({ tipo: 'dado', indice });
      return;
    }

    const coluna = colunasDeGrupo[nivel];
    const grupos = new Map();
    for (const indice of indicesDoNivel) {
      const chave = coluna.texto(modelo.linhas[indice], '(vazio)');
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(indice);
    }

    for (const [rotulo, indicesDoGrupo] of grupos) {
      const chave = `${nivel}:${rotulo}`;
      const aberto = estado.gruposFechados.has(chave) ? false : config.gruposComecamAbertos !== false;

      itens.push({
        tipo: 'grupo',
        chave,
        nivel,
        rotulo,
        quantidade: indicesDoGrupo.length,
        indices: indicesDoGrupo,
        aberto,
      });

      // O subtotal fica na PRÓPRIA linha do grupo, não numa linha extra:
      // assim ele continua visível quando o grupo está fechado, que é
      // justamente quando ele é mais útil.
      if (aberto) construirNivel(indicesDoGrupo, nivel + 1);
    }
  }

  return itens;
}

/** Valor do subtotal de uma coluna num grupo. */
export function subtotalDaColuna(coluna, indices, modelo, agregacao) {
  if (!coluna.ehMedida) return null;
  const valores = indices.map((i) => coluna.valorNumerico(modelo.linhas[i]));
  return agregar(valores, agregacao || 'soma');
}

/** Só os índices de dados (ignora cabeçalhos de grupo e subtotais). */
export function indicesDeDados(itens) {
  const saida = [];
  for (const item of itens) if (item.tipo === 'dado') saida.push(item.indice);
  return saida;
}
