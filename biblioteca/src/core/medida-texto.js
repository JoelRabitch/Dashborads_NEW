/**
 * medida-texto.js — largura ESTIMADA de um texto, sem medir no DOM
 * (melhorias v3).
 *
 * Por que estimar: no iframe do Looker medir texto exige layout (lento e
 * dependente da fonte carregada), e nos testes (jsdom) não há layout
 * nenhum. Todos os cálculos de geometria da biblioteca que dependem do
 * tamanho de um texto (margens, quebra de linha, anti-colisão) usam ESTA
 * função, e os testes de geometria usam a mesma — então teste e desenho
 * concordam. A estimativa é propositalmente um pouco GENEROSA (larga),
 * para errar do lado de sobrar espaço, não de cortar.
 *
 * Fator médio por caractere, em "em" (fração do tamanho da fonte), medido
 * em fontes sem serifa comuns (Arial/Helvetica/Roboto/Open Sans):
 *   - texto normal ≈ 0,56 em;  negrito ≈ 0,61 em;  monoespaçada = 0,62 em;
 *   - dígitos, espaço e pontuação estreita contam menos; maiúsculas e
 *     letras largas (m, w) contam mais.
 */

const ESTREITOS = new Set([...'iljtf.,:;|!\'"()[]{} ']);
const LARGOS = new Set([...'mwMWQGOD@%']);

/**
 * @param {string} texto
 * @param {number} tamanho tamanho da fonte em px
 * @param {{negrito?:boolean, mono?:boolean}} [opcoes]
 * @returns {number} largura estimada em px
 */
export function larguraDoTexto(texto, tamanho = 12, { negrito = false, mono = false } = {}) {
  const s = String(texto ?? '');
  if (!s) return 0;
  if (mono) return s.length * 0.62 * tamanho;
  let em = 0;
  for (const ch of s) {
    if (ESTREITOS.has(ch)) em += 0.32;
    else if (LARGOS.has(ch)) em += 0.86;
    else if (ch >= 'A' && ch <= 'Z') em += 0.68;
    else if (ch >= '0' && ch <= '9') em += 0.56;
    else em += 0.53;
  }
  return em * tamanho * (negrito ? 1.09 : 1);
}

/**
 * Quantas linhas um texto ocupa numa largura, quebrando por palavras.
 * @returns {number} ≥ 1 (0 para texto vazio)
 */
export function linhasDoTexto(texto, larguraDisponivel, tamanho = 12, opcoes = {}) {
  const s = String(texto ?? '').trim();
  if (!s) return 0;
  if (!(larguraDisponivel > 0)) return 1;
  const espaco = larguraDoTexto(' ', tamanho, opcoes);
  let linhas = 1;
  let atual = 0;
  for (const palavra of s.split(/\s+/)) {
    const w = larguraDoTexto(palavra, tamanho, opcoes);
    if (atual === 0) {
      atual = w;
      // Palavra maior que a linha: ocupa várias.
      if (w > larguraDisponivel) {
        linhas += Math.ceil(w / larguraDisponivel) - 1;
        atual = w % larguraDisponivel;
      }
    } else if (atual + espaco + w <= larguraDisponivel) {
      atual += espaco + w;
    } else {
      linhas += 1;
      atual = Math.min(w, larguraDisponivel);
      if (w > larguraDisponivel) linhas += Math.ceil(w / larguraDisponivel) - 1;
    }
  }
  return linhas;
}
