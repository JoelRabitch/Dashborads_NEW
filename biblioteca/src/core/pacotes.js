/**
 * pacotes.js — registro de PACOTES TEMÁTICOS (melhorias v3, 5.14b).
 *
 * A biblioteca é neutra. Um pacote (`src/packs/<nome>/index.js`) só
 * REGISTRA coisas nos registros que já são centrais:
 *   - ícones          → core/icones.js        (grade 24×24, contorno e preenchido)
 *   - formas          → core/shapes.js        (marcadores dos gráficos de pontos)
 *   - paletas         → core/theme.js         (categóricas e escalas contínuas)
 *   - progressos      → aqui                  (ex.: xícara que enche)
 *   - presets         → aqui                  (conjuntos de opções; livres)
 * Todo id leva o prefixo do pacote (`cafe_...`). Nenhum gráfico importa um
 * pacote: eles pedem ao registro. O build descobre as pastas em
 * `src/packs/` sozinho (adicionar um pacote = adicionar uma pasta) e
 * `BL_SEM_PACOTES=1` gera tudo sem nenhum pacote.
 *
 * Opção "Pacote temático" (`pacoteTematico`, aba Estilo, só nos gráficos
 * com listas de ícones, formas ou paletas): "Nenhum" | um pacote. Padrão:
 * `PACOTE_PADRAO` (se registrado). O pacote só controla o que aparece nas
 * LISTAS do painel; um valor salvo de um pacote desligado continua sendo
 * desenhado (o valor salvo vence, 4.1).
 */

import { registrarIcone } from './icones.js';
import { registrarForma } from './shapes.js';
import { registrarPaletaCategorica, registrarEscalaContinua } from './theme.js';

/** Pacote ligado por padrão (constante ÚNICA). */
export const PACOTE_PADRAO = 'cafe';

const pacotes = new Map();
const progressos = new Map();
const presets = new Map();

/**
 * @param {object} p
 * @param {string} p.id   prefixo dos ids (ex.: 'cafe')
 * @param {string} p.nome nome no painel
 */
export function registrarPacote({ id, nome, icones = {}, formas = {}, paletas = {}, escalas = {}, progressos: prog = {}, presets: pre = {} }) {
  const prefixo = `${id}_`;
  const conferir = (chave) => {
    if (!chave.startsWith(prefixo)) throw new Error(`pacote ${id}: o id "${chave}" precisa começar com "${prefixo}"`);
  };
  pacotes.set(id, { id, nome });
  for (const [k, def] of Object.entries(icones)) {
    conferir(k);
    registrarIcone(k, { ...def, pacote: id });
  }
  for (const [k, def] of Object.entries(formas)) {
    conferir(k);
    registrarForma(k, { ...def, pacote: id });
  }
  for (const [k, def] of Object.entries(paletas)) {
    conferir(k);
    registrarPaletaCategorica(k, { ...def, pacote: id });
  }
  for (const [k, def] of Object.entries(escalas)) {
    conferir(k);
    registrarEscalaContinua(k, { ...def, pacote: id });
  }
  for (const [k, def] of Object.entries(prog)) {
    conferir(k);
    progressos.set(k, { ...def, pacote: id });
  }
  for (const [k, def] of Object.entries(pre)) {
    conferir(k);
    presets.set(k, { ...def, pacote: id });
  }
}

export function listarPacotes() {
  return Array.from(pacotes.values());
}

/** Pacotes ligados para um config ("Nenhum" desliga todos). */
export function pacotesLigados(config = {}) {
  const escolhido = config.pacoteTematico;
  if (escolhido === 'nenhum') return [];
  if (escolhido && pacotes.has(escolhido)) return [escolhido];
  return pacotes.has(PACOTE_PADRAO) ? [PACOTE_PADRAO] : [];
}

/** Prefixos dos pacotes registrados e DESLIGADOS. */
export function prefixosDesligados(config = {}) {
  const ligados = pacotesLigados(config);
  return listarPacotes()
    .map((p) => p.id)
    .filter((id) => !ligados.includes(id))
    .map((id) => `${id}_`);
}

/** Algum `values` das opções contém item de pacote? (decide se a opção de pacote aparece) */
export function usaItensDePacote(opcoes) {
  const prefixos = listarPacotes().map((p) => `${p.id}_`);
  if (!prefixos.length) return false;
  return Object.values(opcoes || {}).some(
    (o) => o && Array.isArray(o.values) && o.values.some((v) => prefixos.some((p) => String(Object.values(v)[0]).startsWith(p)))
  );
}

/**
 * Cópia das opções sem os itens de pacotes desligados nas listas
 * (`values`). Ids, tipos e defaults não mudam.
 */
export function filtrarOpcoesPorPacote(opcoes, config) {
  const prefixos = prefixosDesligados(config);
  if (!prefixos.length) return opcoes;
  const saida = {};
  for (const [id, o] of Object.entries(opcoes || {})) {
    if (o && Array.isArray(o.values)) {
      const copia = { ...o, values: o.values.filter((v) => !prefixos.some((p) => String(Object.values(v)[0]).startsWith(p))) };
      if (o._organizada) Object.defineProperty(copia, '_organizada', { value: true, enumerable: false });
      saida[id] = copia;
    } else saida[id] = o;
  }
  return saida;
}

/** Opção "Pacote temático". */
export function opcaoDePacoteTematico() {
  const lista = [{ 'Nenhum': 'nenhum' }].concat(listarPacotes().map((p) => ({ [p.nome]: p.id })));
  return {
    pacoteTematico: {
      type: 'string',
      label: 'Pacote temático',
      section: 'Tema',
      display: 'select',
      default: pacotes.has(PACOTE_PADRAO) ? PACOTE_PADRAO : 'nenhum',
      values: lista,
    },
  };
}

/** Exibições de progresso registradas (ex.: 'cafe_xicara'). */
export function listarProgressos(config) {
  const ligados = config ? pacotesLigados(config) : null;
  return Array.from(progressos.entries())
    .filter(([, d]) => !ligados || ligados.includes(d.pacote))
    .map(([id, d]) => ({ id, rotulo: d.rotulo }));
}
export function existeProgresso(id) {
  return progressos.has(id);
}
/**
 * Desenha um progresso registrado. O valor salvo vence: desenha mesmo com o
 * pacote desligado.
 * @returns {Element|null}
 */
export function desenharProgresso(id, pai, fracao, opcoes = {}) {
  const p = progressos.get(id);
  return p ? p.desenhar(pai, Math.max(0, Math.min(1, Number(fracao) || 0)), opcoes) : null;
}

export function listarPresets() {
  return Array.from(presets.entries()).map(([id, d]) => ({ id, ...d }));
}
