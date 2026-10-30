/**
 * busca.js — busca "contém" da tabela (melhorias v3, 5.3).
 *
 * Regras:
 *   - o termo é procurado em QUALQUER posição do texto ("BLACK" acha
 *     "ABCBLACKXX"), sem diferenciar maiúsculas nem acentos;
 *   - várias palavras: TODAS precisam aparecer na linha (em qualquer coluna
 *     buscada); com "Busca · Modo" = "Qualquer palavra", basta uma;
 *   - "frase entre aspas" é procurada inteira, na ordem;
 *   - -palavra exclui a linha que a contiver.
 * O texto de cada coluna é testado separado (uma frase não "atravessa" de
 * uma coluna para a outra).
 */

import { normalizarTexto } from '../../core/interaction.js';

/**
 * Separa o termo em partes.
 * @returns {{incluir:string[], excluir:string[]}} já normalizados
 */
export function analisarBusca(termo) {
  const incluir = [];
  const excluir = [];
  const re = /(-?)"([^"]*)"?|(\S+)/g;
  let m;
  const texto = String(termo ?? '');
  while ((m = re.exec(texto)) !== null) {
    if (m[2] !== undefined) {
      const frase = normalizarTexto(m[2]);
      if (frase) (m[1] ? excluir : incluir).push(frase);
      continue;
    }
    const palavra = m[3];
    if (palavra.length > 1 && palavra.startsWith('-')) {
      const t = normalizarTexto(palavra.slice(1));
      if (t) excluir.push(t);
    } else {
      const t = normalizarTexto(palavra);
      if (t) incluir.push(t);
    }
  }
  return { incluir, excluir };
}

/**
 * @param {string} termo
 * @param {{modo?:'todas'|'qualquer'}} [opcoes]
 * @returns {{vazia:boolean, partes:object, casa:(textos:string[])=>boolean, trechos:string[]}}
 *   `casa` recebe os textos das colunas buscadas de UMA linha;
 *   `trechos` são os termos a realçar.
 */
export function criarBusca(termo, { modo = 'todas' } = {}) {
  const partes = analisarBusca(termo);
  const vazia = !partes.incluir.length && !partes.excluir.length;
  const casa = (textos) => {
    if (vazia) return true;
    const normalizados = textos.map((t) => normalizarTexto(t));
    const tem = (p) => normalizados.some((t) => t.includes(p));
    if (partes.excluir.some(tem)) return false;
    if (!partes.incluir.length) return true;
    return modo === 'qualquer' ? partes.incluir.some(tem) : partes.incluir.every(tem);
  };
  return { vazia, partes, casa, trechos: partes.incluir };
}

/**
 * Realça os trechos encontrados dentro de `el` (só nos nós de texto, com
 * <mark>; nada de innerHTML). Ignora maiúsculas e acentos como a busca.
 */
export function realcarTrechos(el, trechos) {
  if (!el || !trechos || !trechos.length) return 0;
  const doc = el.ownerDocument;
  const nos = [];
  const caminhar = (no) => {
    for (const filho of Array.from(no.childNodes)) {
      if (filho.nodeType === 3) nos.push(filho);
      else if (filho.nodeType === 1 && filho.tagName !== 'MARK' && filho.tagName !== 'svg') caminhar(filho);
    }
  };
  caminhar(el);
  let total = 0;
  for (const no of nos) {
    const original = no.nodeValue;
    // Normaliza caractere a caractere para manter as posições do original.
    const mapa = [];
    let normal = '';
    for (let i = 0; i < original.length; i++) {
      const n = normalizarTexto(original[i]) || (original[i] === ' ' ? ' ' : '');
      for (const c of n) {
        normal += c;
        mapa.push(i);
      }
    }
    const faixas = [];
    for (const t of trechos) {
      let de = normal.indexOf(t);
      while (de >= 0 && t) {
        const ini = mapa[de];
        const fim = mapa[de + t.length - 1] + 1;
        faixas.push([ini, fim]);
        de = normal.indexOf(t, de + t.length);
      }
    }
    if (!faixas.length) continue;
    faixas.sort((a, b) => a[0] - b[0]);
    const juntas = [];
    for (const f of faixas) {
      const u = juntas[juntas.length - 1];
      if (u && f[0] <= u[1]) u[1] = Math.max(u[1], f[1]);
      else juntas.push(f.slice());
    }
    const frag = doc.createDocumentFragment();
    let pos = 0;
    for (const [ini, fim] of juntas) {
      if (ini > pos) frag.appendChild(doc.createTextNode(original.slice(pos, ini)));
      const mark = doc.createElement('mark');
      mark.className = 'tc-realce';
      mark.textContent = original.slice(ini, fim);
      frag.appendChild(mark);
      total += 1;
      pos = fim;
    }
    if (pos < original.length) frag.appendChild(doc.createTextNode(original.slice(pos)));
    no.parentNode.replaceChild(frag, no);
  }
  return total;
}

/**
 * Colunas que a busca olha: as visíveis, ou só as listadas em "Busca ·
 * Colunas" (rótulos ou nomes de campo, separados por vírgula).
 */
export function colunasDaBusca(colunasVisiveis, lista) {
  const nomes = String(lista || '')
    .split(',')
    .map((n) => normalizarTexto(n))
    .filter(Boolean);
  if (!nomes.length) return colunasVisiveis;
  const escolhidas = colunasVisiveis.filter((c) =>
    [c.rotulo, c.id, c.campo && c.campo.nome, c.campo && c.campo.rotuloCurto]
      .filter(Boolean)
      .some((n) => nomes.includes(normalizarTexto(n)))
  );
  return escolhidas.length ? escolhidas : colunasVisiveis;
}
