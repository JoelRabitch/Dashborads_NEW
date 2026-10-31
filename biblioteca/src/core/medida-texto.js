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

/* ------------------------------------------------------------------ */
/* Medidor com cache e folga (v3.3)                                     */
/* ------------------------------------------------------------------ */

/** Acima disso o cache é esvaziado (protege a memória com dados enormes). */
const LIMITE_DO_CACHE = 50000;

/**
 * Medidor de texto com cache por (texto, fonte, negrito) e folga em %.
 *
 * Usado pelo ajuste automático das árvores (v3.3): o mesmo rótulo é medido
 * em vários tamanhos de fonte e várias vezes por passo; com o cache, cada
 * combinação é medida UMA vez. `real` é uma medição do navegador
 * (`medicaoDoNavegador`); sem ela (ou se falhar), vale a estimativa
 * `larguraDoTexto` — a mesma dos testes. A folga cobre a diferença entre a
 * fonte real e a estimada.
 *
 * @param {{folga?:number, real?:((texto:string, tamanho:number, o:object)=>number)|null}} [o]
 * @returns {((texto:string, tamanho?:number, opcoes?:object)=>number) & {estatisticas:{medicoes:number, consultas:number}}}
 */
export function criarMedidor({ folga = 0, real = null } = {}) {
  const cache = new Map();
  const fator = 1 + Math.max(0, Number(folga) || 0) / 100;
  const estatisticas = { medicoes: 0, consultas: 0 };
  const medir = (texto, tamanho = 12, opcoes = {}) => {
    const s = String(texto ?? '');
    const negrito = !!(opcoes && opcoes.negrito);
    const mono = !!(opcoes && opcoes.mono);
    const chave = `${tamanho}|${negrito ? 1 : 0}${mono ? 1 : 0}|${s}`;
    estatisticas.consultas += 1;
    let w = cache.get(chave);
    if (w === undefined) {
      estatisticas.medicoes += 1;
      let base = null;
      if (real && s) {
        try {
          base = real(s, tamanho, { negrito, mono });
        } catch (_) {
          base = null;
        }
      }
      if (!(Number.isFinite(base) && base >= 0)) base = larguraDoTexto(s, tamanho, { negrito, mono });
      w = base * fator;
      if (cache.size >= LIMITE_DO_CACHE) cache.clear();
      cache.set(chave, w);
    }
    return w;
  };
  medir.estatisticas = estatisticas;
  return medir;
}

/**
 * Medição real do navegador (`canvas.measureText`), ou null quando não há
 * (jsdom dos testes, canvas indisponível). Os testes continuam na estimativa.
 * @param {string} [familia] família da fonte (a do tema)
 */
export function medicaoDoNavegador(familia) {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return null;
  if (/jsdom/i.test(navigator.userAgent || '')) return null;
  let c2d = null;
  try {
    const canvas = document.createElement('canvas');
    c2d = canvas.getContext ? canvas.getContext('2d') : null;
  } catch (_) {
    c2d = null;
  }
  if (!c2d || typeof c2d.measureText !== 'function') return null;
  const fam = familia || 'sans-serif';
  return (texto, tamanho, { negrito = false, mono = false } = {}) => {
    c2d.font = `${negrito ? '700 ' : ''}${tamanho}px ${mono ? 'monospace' : fam}`;
    return c2d.measureText(texto).width;
  };
}
