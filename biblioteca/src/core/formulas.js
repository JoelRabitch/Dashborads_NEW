/**
 * formulas.js — interpretador PRÓPRIO de fórmulas (melhorias v3, 5.4).
 *
 * Sem `eval` e sem `new Function`: tokenizador → analisador (descida
 * recursiva com precedência) → árvore → avaliador que percorre a árvore.
 * A fórmula só enxerga os campos que o chamador entrega (`resolver`); não
 * há acesso a variáveis globais, objetos, propriedades nem funções além da
 * lista abaixo.
 *
 * Sintaxe (funções em inglês, sem diferenciar maiúsculas):
 *   ${campo}                 valor do campo na linha (nome do Looker ou
 *                            rótulo curto, quando não houver ambiguidade)
 *   12  3.5  "texto"         número e texto (aspas duplas; "" escapa aspas)
 *   TRUE  FALSE  NULL
 *   + - * / %                aritmética (% é o resto da divisão)
 *   = <> < <= > >=           comparação (texto com texto, número com número)
 *   AND  OR  NOT             lógicos
 *   IF(cond, sim, não)       IFS(c1, v1, c2, v2, ..., padrão)
 *   CASE(valor, caso1, res1, caso2, res2, ..., padrão)
 *   COALESCE(a, b, ...)      ISBLANK(x)
 *   ROUND(x, casas)  ABS(x)  MIN(...)  MAX(...)  SUM(...)  AVG(...)
 *   CONTAINS(texto, trecho)  LEFT(t, n)  RIGHT(t, n)  MID(t, início, n)
 *   UPPER(t)  LOWER(t)  LEN(t)  CONCAT(...)  TEXT(x, casas)
 *
 * Nulos: aritmética com nulo dá nulo; comparação com nulo é falsa (use
 * ISBLANK); SUM/AVG/MIN/MAX ignoram nulos. Divisão por zero é ERRO.
 * Precedência (da mais fraca à mais forte): OR, AND, NOT, comparação,
 * + -, * / %, sinal (-x), chamada/valor.
 * Limites: 2000 caracteres, profundidade 40, 500 nós.
 */

export const LIMITES = { tamanho: 2000, profundidade: 40, nos: 500 };

/** Erro de fórmula, com mensagem em português para a célula/painel. */
export class ErroDeFormula extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroDeFormula';
  }
}

const err = (m) => {
  throw new ErroDeFormula(m);
};

/* ------------------------------ tokens ------------------------------ */

function tokenizar(texto) {
  const tokens = [];
  let i = 0;
  const n = texto.length;
  while (i < n) {
    const c = texto[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (c === '$' && texto[i + 1] === '{') {
      const fim = texto.indexOf('}', i + 2);
      if (fim < 0) err('campo sem "}" de fechamento');
      const nome = texto.slice(i + 2, fim).trim();
      if (!nome) err('campo vazio: ${}');
      tokens.push({ t: 'campo', v: nome, pos: i });
      i = fim + 1;
      continue;
    }
    if (c === '"') {
      let s = '';
      let j = i + 1;
      for (;;) {
        if (j >= n) err('texto sem aspas de fechamento');
        if (texto[j] === '"') {
          if (texto[j + 1] === '"') {
            s += '"';
            j += 2;
            continue;
          }
          break;
        }
        s += texto[j];
        j += 1;
      }
      tokens.push({ t: 'texto', v: s, pos: i });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(texto[i + 1] || ''))) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(texto.slice(i));
      tokens.push({ t: 'num', v: Number(m[0]), pos: i });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(texto.slice(i));
      tokens.push({ t: 'nome', v: m[0].toUpperCase(), pos: i });
      i += m[0].length;
      continue;
    }
    const dois = texto.slice(i, i + 2);
    if (dois === '<=' || dois === '>=' || dois === '<>' || dois === '!=') {
      tokens.push({ t: 'op', v: dois === '!=' ? '<>' : dois, pos: i });
      i += 2;
      continue;
    }
    if ('+-*/%=<>(),'.includes(c)) {
      tokens.push({ t: c === '(' || c === ')' || c === ',' ? c : 'op', v: c, pos: i });
      i += 1;
      continue;
    }
    err(`caractere inesperado "${c}"`);
  }
  tokens.push({ t: 'fim', pos: n });
  return tokens;
}

/* ----------------------------- análise ------------------------------ */

const FUNCOES = new Set([
  'IF', 'IFS', 'CASE', 'COALESCE', 'ISBLANK', 'ROUND', 'ABS', 'MIN', 'MAX', 'SUM', 'AVG',
  'CONTAINS', 'LEFT', 'RIGHT', 'MID', 'UPPER', 'LOWER', 'LEN', 'CONCAT', 'TEXT',
]);

function analisar(tokens) {
  let p = 0;
  let nos = 0;
  const olhar = () => tokens[p];
  const pegar = () => tokens[p++];
  const no = (obj, prof) => {
    nos += 1;
    if (nos > LIMITES.nos) err('fórmula grande demais');
    if (prof > LIMITES.profundidade) err('fórmula aninhada demais');
    return obj;
  };
  const esperar = (t, msg) => {
    if (olhar().t !== t) err(msg);
    return pegar();
  };
  const ehNome = (v) => olhar().t === 'nome' && olhar().v === v;

  function ou(d) {
    let e = e_(d + 1);
    while (ehNome('OR')) {
      pegar();
      e = no({ k: 'ou', a: e, b: e_(d + 1) }, d);
    }
    return e;
  }
  function e_(d) {
    let e = nao(d + 1);
    while (ehNome('AND')) {
      pegar();
      e = no({ k: 'e', a: e, b: nao(d + 1) }, d);
    }
    return e;
  }
  function nao(d) {
    if (ehNome('NOT')) {
      pegar();
      return no({ k: 'nao', a: nao(d + 1) }, d);
    }
    return comparacao(d + 1);
  }
  function comparacao(d) {
    let e = soma(d + 1);
    while (olhar().t === 'op' && ['=', '<>', '<', '<=', '>', '>='].includes(olhar().v)) {
      const op = pegar().v;
      e = no({ k: 'cmp', op, a: e, b: soma(d + 1) }, d);
    }
    return e;
  }
  function soma(d) {
    let e = produto(d + 1);
    while (olhar().t === 'op' && (olhar().v === '+' || olhar().v === '-')) {
      const op = pegar().v;
      e = no({ k: 'arit', op, a: e, b: produto(d + 1) }, d);
    }
    return e;
  }
  function produto(d) {
    let e = unario(d + 1);
    while (olhar().t === 'op' && ['*', '/', '%'].includes(olhar().v)) {
      const op = pegar().v;
      e = no({ k: 'arit', op, a: e, b: unario(d + 1) }, d);
    }
    return e;
  }
  function unario(d) {
    if (olhar().t === 'op' && (olhar().v === '-' || olhar().v === '+')) {
      const op = pegar().v;
      const a = unario(d + 1);
      return op === '-' ? no({ k: 'neg', a }, d) : a;
    }
    return primario(d + 1);
  }
  function primario(d) {
    const tk = pegar();
    if (tk.t === 'num') return no({ k: 'val', v: tk.v }, d);
    if (tk.t === 'texto') return no({ k: 'val', v: tk.v }, d);
    if (tk.t === 'campo') return no({ k: 'campo', nome: tk.v }, d);
    if (tk.t === '(') {
      const e = ou(d + 1);
      esperar(')', 'falta ")"');
      return e;
    }
    if (tk.t === 'nome') {
      if (tk.v === 'TRUE') return no({ k: 'val', v: true }, d);
      if (tk.v === 'FALSE') return no({ k: 'val', v: false }, d);
      if (tk.v === 'NULL') return no({ k: 'val', v: null }, d);
      if (olhar().t !== '(') err(`nome desconhecido "${tk.v}" (campos vão entre \${...})`);
      if (!FUNCOES.has(tk.v)) err(`função desconhecida "${tk.v}"`);
      pegar();
      const args = [];
      if (olhar().t !== ')') {
        for (;;) {
          args.push(ou(d + 1));
          if (olhar().t === ',') {
            pegar();
            continue;
          }
          break;
        }
      }
      esperar(')', `falta ")" em ${tk.v}`);
      return no({ k: 'fn', nome: tk.v, args }, d);
    }
    if (tk.t === 'fim') err('fórmula incompleta');
    err(`"${tk.v}" fora do lugar`);
    return null;
  }

  const arvore = ou(0);
  if (olhar().t !== 'fim') err(`"${olhar().v}" sobrando no fim`);
  return arvore;
}

const ARIDADE = {
  IF: [2, 3], IFS: [2, Infinity], CASE: [3, Infinity], COALESCE: [1, Infinity], ISBLANK: [1, 1],
  ROUND: [1, 2], ABS: [1, 1], MIN: [1, Infinity], MAX: [1, Infinity], SUM: [1, Infinity], AVG: [1, Infinity],
  CONTAINS: [2, 2], LEFT: [2, 2], RIGHT: [2, 2], MID: [3, 3], UPPER: [1, 1], LOWER: [1, 1], LEN: [1, 1],
  CONCAT: [1, Infinity], TEXT: [1, 2],
};

function conferirAridade(no) {
  if (!no || typeof no !== 'object') return;
  if (no.k === 'fn') {
    const [min, max] = ARIDADE[no.nome];
    if (no.args.length < min || no.args.length > max) {
      err(`${no.nome} espera ${min === max ? min : max === Infinity ? `${min} ou mais` : `${min} a ${max}`} argumento(s)`);
    }
    no.args.forEach(conferirAridade);
  }
  for (const k of ['a', 'b']) if (no[k]) conferirAridade(no[k]);
}

function camposDe(no, saida = new Set()) {
  if (!no) return saida;
  if (no.k === 'campo') saida.add(no.nome);
  if (no.args) no.args.forEach((a) => camposDe(a, saida));
  if (no.a) camposDe(no.a, saida);
  if (no.b) camposDe(no.b, saida);
  return saida;
}

/**
 * Compila uma fórmula (sem avaliar).
 * @returns {{ok:true, arvore:object, campos:string[]} | {ok:false, erro:string}}
 */
export function compilarFormula(texto) {
  try {
    const fonte = String(texto ?? '');
    if (!fonte.trim()) return { ok: false, erro: 'fórmula vazia' };
    if (fonte.length > LIMITES.tamanho) err(`fórmula com mais de ${LIMITES.tamanho} caracteres`);
    const arvore = analisar(tokenizar(fonte));
    conferirAridade(arvore);
    return { ok: true, arvore, campos: Array.from(camposDe(arvore)) };
  } catch (e) {
    if (e instanceof ErroDeFormula) return { ok: false, erro: e.message };
    return { ok: false, erro: 'fórmula inválida' };
  }
}

/* ---------------------------- avaliação ----------------------------- */

const ehNulo = (v) => v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v));
const verdadeiro = (v) => (ehNulo(v) ? false : typeof v === 'string' ? v.length > 0 : !!v);

function comoNumero(v, onde) {
  if (ehNulo(v)) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const s = String(v).trim();
  if (s !== '' && Number.isFinite(Number(s))) return Number(s);
  err(`${onde}: "${v}" não é número`);
  return null;
}
const comoTexto = (v) => (ehNulo(v) ? '' : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v));

function comparar(op, a, b) {
  if (ehNulo(a) || ehNulo(b)) return false;
  let x = a;
  let y = b;
  if (typeof a === 'number' || typeof b === 'number') {
    const nx = typeof a === 'number' ? a : Number(a);
    const ny = typeof b === 'number' ? b : Number(b);
    if (Number.isFinite(nx) && Number.isFinite(ny) && String(a).trim() !== '' && String(b).trim() !== '') {
      x = nx;
      y = ny;
    } else {
      x = comoTexto(a);
      y = comoTexto(b);
    }
  } else if (typeof a === 'boolean' || typeof b === 'boolean') {
    x = verdadeiro(a);
    y = verdadeiro(b);
  } else {
    x = String(a);
    y = String(b);
  }
  switch (op) {
    case '=':
      return x === y;
    case '<>':
      return x !== y;
    case '<':
      return x < y;
    case '<=':
      return x <= y;
    case '>':
      return x > y;
    default:
      return x >= y;
  }
}

function numeros(args, onde) {
  return args.map((v) => comoNumero(v, onde)).filter((v) => v !== null);
}

/**
 * Avalia uma árvore já compilada.
 * @param {object} arvore
 * @param {(nome:string)=>any} resolver devolve o valor do campo; lança
 *   ErroDeFormula('campo não encontrado: ...') se não existir
 */
export function avaliarArvore(arvore, resolver) {
  const ev = (no) => {
    switch (no.k) {
      case 'val':
        return no.v;
      case 'campo':
        return resolver(no.nome);
      case 'neg': {
        const v = comoNumero(ev(no.a), 'sinal');
        return v === null ? null : -v;
      }
      case 'nao':
        return !verdadeiro(ev(no.a));
      case 'e':
        return verdadeiro(ev(no.a)) && verdadeiro(ev(no.b));
      case 'ou':
        return verdadeiro(ev(no.a)) || verdadeiro(ev(no.b));
      case 'cmp':
        return comparar(no.op, ev(no.a), ev(no.b));
      case 'arit': {
        const a = comoNumero(ev(no.a), no.op);
        const b = comoNumero(ev(no.b), no.op);
        if (a === null || b === null) return null;
        if (no.op === '+') return a + b;
        if (no.op === '-') return a - b;
        if (no.op === '*') return a * b;
        if (b === 0) err('divisão por zero');
        return no.op === '/' ? a / b : a % b;
      }
      case 'fn':
        return chamar(no.nome, no.args, ev);
      default:
        err('nó desconhecido');
        return null;
    }
  };
  return ev(arvore);
}

function chamar(nome, args, ev) {
  const todos = () => args.map(ev);
  switch (nome) {
    case 'IF':
      return verdadeiro(ev(args[0])) ? ev(args[1]) : args.length > 2 ? ev(args[2]) : null;
    case 'IFS': {
      let i = 0;
      for (; i + 1 < args.length; i += 2) if (verdadeiro(ev(args[i]))) return ev(args[i + 1]);
      return i < args.length ? ev(args[i]) : null;
    }
    case 'CASE': {
      const alvo = ev(args[0]);
      let i = 1;
      for (; i + 1 < args.length; i += 2) if (comparar('=', alvo, ev(args[i]))) return ev(args[i + 1]);
      return i < args.length ? ev(args[i]) : null;
    }
    case 'COALESCE':
      for (const a of args) {
        const v = ev(a);
        if (!ehNulo(v) && v !== '') return v;
      }
      return null;
    case 'ISBLANK': {
      const v = ev(args[0]);
      return ehNulo(v) || v === '';
    }
    case 'ROUND': {
      const x = comoNumero(ev(args[0]), 'ROUND');
      const casas = args[1] ? comoNumero(ev(args[1]), 'ROUND') || 0 : 0;
      if (x === null) return null;
      const f = 10 ** Math.max(-10, Math.min(10, Math.trunc(casas)));
      return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
    }
    case 'ABS': {
      const x = comoNumero(ev(args[0]), 'ABS');
      return x === null ? null : Math.abs(x);
    }
    case 'MIN':
    case 'MAX': {
      const v = numeros(todos(), nome);
      if (!v.length) return null;
      return nome === 'MIN' ? Math.min(...v) : Math.max(...v);
    }
    case 'SUM': {
      const v = numeros(todos(), 'SUM');
      return v.length ? v.reduce((s, x) => s + x, 0) : null;
    }
    case 'AVG': {
      const v = numeros(todos(), 'AVG');
      return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
    }
    case 'CONTAINS': {
      const t = ev(args[0]);
      if (ehNulo(t)) return false;
      return comoTexto(t).includes(comoTexto(ev(args[1])));
    }
    case 'LEFT':
    case 'RIGHT': {
      const t = ev(args[0]);
      if (ehNulo(t)) return null;
      const s = comoTexto(t);
      const k = Math.max(0, Math.trunc(comoNumero(ev(args[1]), nome) || 0));
      return nome === 'LEFT' ? s.slice(0, k) : k === 0 ? '' : s.slice(-k);
    }
    case 'MID': {
      const t = ev(args[0]);
      if (ehNulo(t)) return null;
      const ini = Math.max(1, Math.trunc(comoNumero(ev(args[1]), 'MID') || 1));
      const k = Math.max(0, Math.trunc(comoNumero(ev(args[2]), 'MID') || 0));
      return comoTexto(t).slice(ini - 1, ini - 1 + k);
    }
    case 'UPPER':
    case 'LOWER': {
      const t = ev(args[0]);
      if (ehNulo(t)) return null;
      return nome === 'UPPER' ? comoTexto(t).toUpperCase() : comoTexto(t).toLowerCase();
    }
    case 'LEN': {
      const t = ev(args[0]);
      return ehNulo(t) ? 0 : comoTexto(t).length;
    }
    case 'CONCAT':
      return todos().map(comoTexto).join('');
    case 'TEXT': {
      const v = ev(args[0]);
      if (ehNulo(v)) return '';
      if (args.length < 2 || typeof v !== 'number') return comoTexto(v);
      const fmt = ev(args[1]);
      let casas = typeof fmt === 'number' ? fmt : String(fmt).includes('.') ? String(fmt).split('.')[1].length : 0;
      casas = Math.max(0, Math.min(10, Math.trunc(casas)));
      return v.toFixed(casas);
    }
    default:
      err(`função desconhecida "${nome}"`);
      return null;
  }
}

/**
 * Atalho: compila e avalia. Devolve {valor} ou {erro}.
 * @param {string} texto
 * @param {(nome:string)=>any} resolver
 */
export function avaliarFormula(texto, resolver) {
  const c = typeof texto === 'object' && texto && texto.ok !== undefined ? texto : compilarFormula(texto);
  if (!c.ok) return { erro: c.erro };
  try {
    return { valor: avaliarArvore(c.arvore, resolver) };
  } catch (e) {
    if (e instanceof ErroDeFormula) return { erro: e.message };
    return { erro: 'erro ao calcular' };
  }
}

/**
 * Resolvedor de campos a partir de uma lista de candidatos.
 * Aceita o nome do Looker ("view.campo"), o nome sem a view, e o rótulo
 * curto/rótulo quando não houver ambiguidade (ignora maiúsculas).
 * @param {Array<{nomes:string[], valor:()=>any}>} campos
 */
export function criarResolvedor(campos) {
  const mapa = new Map();
  const ambiguos = new Set();
  const por = (chave, item) => {
    const k = String(chave || '').trim().toLowerCase();
    if (!k) return;
    if (mapa.has(k) && mapa.get(k) !== item) ambiguos.add(k);
    else mapa.set(k, item);
  };
  campos.forEach((c) => c.nomes.forEach((n) => por(n, c)));
  return (nome) => {
    const k = String(nome).trim().toLowerCase();
    if (ambiguos.has(k)) err(`campo ambíguo: ${nome} (use o nome completo)`);
    const item = mapa.get(k);
    if (!item) err(`campo não encontrado: ${nome}`);
    return item.valor();
  };
}
