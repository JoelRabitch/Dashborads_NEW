/**
 * calculadas.js — colunas calculadas por fórmula (melhorias v3, 5.4).
 *
 * Oito ESPAÇOS FIXOS ("Fórmula 1" a "Fórmula 8"), cada um com opções
 * estáticas — nada de opções dinâmicas por coluna calculada (ver a regra do
 * registerOptions). Cada espaço tem um "Uso":
 *   - Coluna (padrão): uma coluna nova com o resultado;
 *   - Colorir a linha: sem coluna; a linha ganha a cor quando a fórmula for
 *     verdadeira (formatação condicional por fórmula);
 *   - Colorir células: idem, só nas células da coluna indicada em
 *     "Aplicar na coluna".
 *
 * Pivô ("Modo do pivô"):
 *   - Uma vez por valor do pivô: a fórmula roda em cada valor do pivô, e os
 *     campos de medida são lidos NA MESMA coluna do pivô; as dimensões, na
 *     linha. A coluna entra no grupo de cada valor do pivô.
 *   - Só nas colunas sem pivô: uma coluna só, ao lado das dimensões; as
 *     medidas são lidas do total da linha (quando o Looker manda), senão
 *     ficam nulas.
 *
 * Totais ("Linha de totais"): "Recalcular" aplica a fórmula sobre os totais
 * dos campos usados (do Looker; se o Looker não mandou, o mesmo total que a
 * tabela calcula); se algum campo usado não tem total (dimensão), fica
 * vazio. "Vazio" deixa sempre em branco.
 *
 * Erro na fórmula: a célula mostra "#ERRO: <motivo>" e a tabela segue; um
 * aviso amarelo diz qual espaço está com erro. (O painel do Looker não tem
 * como mostrar mensagem de validação por opção sem re-registrar o painel a
 * cada tecla, o que a regra do registerOptions proíbe.)
 */

import { compilarFormula, avaliarArvore, criarResolvedor, ErroDeFormula } from '../../core/formulas.js';
import { criarFormatadorNumerico } from '../../core/format.js';
import { listaDeValores } from '../../core/options-kit.js';
import { normalizarTexto } from '../../core/interaction.js';
import { tiposDeCelula } from './opcoes.js';

export const ESPACOS_DE_FORMULA = 8;

/** Opções estáticas dos 8 espaços (seção "Fórmula N" → aba Dados). */
export function opcoesDasCalculadas() {
  const saida = {};
  for (let n = 1; n <= ESPACOS_DE_FORMULA; n++) {
    const s = `Fórmula ${n}`;
    const p = `calc${n}`;
    Object.assign(saida, {
      [`${p}Nome`]: { type: 'string', label: 'Nome da coluna', section: s, default: '' },
      [`${p}Formula`]: {
        type: 'string',
        label: 'Fórmula',
        section: s,
        placeholder: 'IF(${campo} > 10, "Alto", "Baixo")',
        default: '',
      },
      [`${p}Uso`]: {
        type: 'string',
        label: 'Uso',
        section: s,
        display: 'select',
        values: listaDeValores([
          { rotulo: 'Coluna com o resultado', valor: 'coluna' },
          { rotulo: 'Colorir a linha se verdadeira', valor: 'linha' },
          { rotulo: 'Colorir células se verdadeira', valor: 'celula' },
        ]),
        default: 'coluna',
      },
      [`${p}Formato`]: {
        type: 'string',
        label: 'Formato',
        section: s,
        display: 'select',
        values: listaDeValores([
          { rotulo: 'Número', valor: 'numero' },
          { rotulo: 'Moeda', valor: 'moeda' },
          { rotulo: 'Percentual', valor: 'percentual' },
          { rotulo: 'Texto', valor: 'texto' },
        ]),
        default: 'numero',
      },
      [`${p}Casas`]: { type: 'number', label: 'Casas decimais', section: s, default: 2 },
      [`${p}TipoDeCelula`]: {
        type: 'string',
        label: 'Tipo de célula',
        section: s,
        display: 'select',
        values: listaDeValores(tiposDeCelula()),
        default: 'auto',
      },
      [`${p}Posicao`]: {
        type: 'string',
        label: 'Posição',
        section: s,
        display: 'select',
        values: listaDeValores([
          { rotulo: 'Depois das medidas', valor: 'fim' },
          { rotulo: 'Antes das medidas', valor: 'inicio' },
        ]),
        default: 'fim',
      },
      [`${p}Pivo`]: {
        type: 'string',
        label: 'Modo do pivô',
        section: s,
        display: 'select',
        values: listaDeValores([
          { rotulo: 'Uma vez por valor do pivô', valor: 'porPivo' },
          { rotulo: 'Só nas colunas sem pivô', valor: 'semPivo' },
        ]),
        default: 'porPivo',
      },
      [`${p}Total`]: {
        type: 'string',
        label: 'Linha de totais',
        section: s,
        display: 'select',
        values: listaDeValores([
          { rotulo: 'Recalcular sobre os totais', valor: 'recalcular' },
          { rotulo: 'Vazio', valor: 'vazio' },
        ]),
        default: 'recalcular',
      },
      [`${p}Cor`]: { type: 'string', label: 'Cor (uso colorir)', section: s, display: 'color', default: '#FEF3C7' },
      [`${p}Alvo`]: { type: 'string', label: 'Aplicar na coluna', section: s, placeholder: 'nome da coluna', default: '' },
    });
  }
  return saida;
}

/** Lê os espaços preenchidos. */
export function lerEspacos(config) {
  const espacos = [];
  for (let n = 1; n <= ESPACOS_DE_FORMULA; n++) {
    const p = `calc${n}`;
    const formula = String(config[`${p}Formula`] || '').trim();
    if (!formula) continue;
    espacos.push({
      n,
      nome: String(config[`${p}Nome`] || '').trim() || `Fórmula ${n}`,
      formula,
      compilada: compilarFormula(formula),
      uso: ['linha', 'celula'].includes(config[`${p}Uso`]) ? config[`${p}Uso`] : 'coluna',
      formato: config[`${p}Formato`] || 'numero',
      casas: Number.isFinite(Number(config[`${p}Casas`])) ? Number(config[`${p}Casas`]) : 2,
      tipoDeCelula: config[`${p}TipoDeCelula`] || 'auto',
      posicao: config[`${p}Posicao`] === 'inicio' ? 'inicio' : 'fim',
      modoPivo: config[`${p}Pivo`] === 'semPivo' ? 'semPivo' : 'porPivo',
      total: config[`${p}Total`] === 'vazio' ? 'vazio' : 'recalcular',
      cor: config[`${p}Cor`] || '#FEF3C7',
      alvo: String(config[`${p}Alvo`] || '').trim(),
    });
  }
  return espacos;
}

const semView = (nome) => String(nome).split('.').pop();

/**
 * Resolvedor de campos de UMA linha. `chave` = chave do pivô (ou null);
 * `semPivo` = medidas lidas do total da linha.
 */
function resolvedorDaLinha(modelo, linha, { chave = null, semPivo = false } = {}) {
  const campos = [];
  for (const c of modelo.dimensoes) {
    campos.push({
      nomes: [c.nome, semView(c.nome), c.rotuloCurto, c.rotulo],
      valor: () => {
        const cel = modelo.celula(linha, c.nome);
        return cel ? cel.value : null;
      },
    });
  }
  for (const c of modelo.medidas) {
    campos.push({
      nomes: [c.nome, semView(c.nome), c.rotuloCurto, c.rotulo],
      valor: () => {
        if (modelo.temPivo && semPivo) {
          return typeof modelo.totalDaLinha === 'function' ? modelo.totalDaLinha(linha, c.nome) : null;
        }
        return modelo.valorNumerico(linha, c.nome, chave || undefined);
      },
    });
  }
  return criarResolvedor(campos);
}

/** Avalia com cache por linha; devolve {valor} ou {erro}. */
function avaliadorComCache(espaco, modelo, opcoes) {
  const cache = new WeakMap();
  return (linha) => {
    if (!espaco.compilada.ok) return { erro: espaco.compilada.erro };
    if (cache.has(linha)) return cache.get(linha);
    let r;
    try {
      r = { valor: avaliarArvore(espaco.compilada.arvore, resolvedorDaLinha(modelo, linha, opcoes)) };
    } catch (e) {
      r = { erro: e instanceof ErroDeFormula ? e.message : 'erro ao calcular' };
    }
    cache.set(linha, r);
    return r;
  };
}

/** Total de um campo (do Looker, senão agregado nas linhas visíveis). */
function totalDoCampo(modelo, nome, chave, indicesVisiveis, agregar, tipoDeAgregacao) {
  const ehMedida = modelo.medidas.some((m) => m.nome === nome);
  if (!ehMedida) return { tem: false };
  const t = modelo.totais && modelo.totais.encontrados ? modelo.totais.porCampo[nome] : null;
  if (t) {
    const cel = chave ? t[chave] : t;
    const v = cel && cel.value !== undefined ? Number(cel.value) : NaN;
    if (Number.isFinite(v)) return { tem: true, valor: v };
  }
  const valores = indicesVisiveis.map((i) => modelo.valorNumerico(modelo.linhas[i], nome, chave || undefined));
  return { tem: true, valor: agregar(valores, tipoDeAgregacao) };
}

/**
 * Monta as colunas calculadas.
 * @returns {{soltas:{inicio:object[], fim:object[]}, porPivo:Map<string,{inicio:object[], fim:object[]}>, erros:string[]}}
 */
export function colunasCalculadas(modelo, config, { larguraPadrao = 130 } = {}) {
  const espacos = lerEspacos(config).filter((e) => e.uso === 'coluna');
  const soltas = { inicio: [], fim: [] };
  const porPivo = new Map();
  const erros = [];
  for (const e of espacos) {
    if (!e.compilada.ok) erros.push(`Fórmula ${e.n} ("${e.nome}"): ${e.compilada.erro}`);
    if (modelo.temPivo && e.modoPivo === 'porPivo') {
      for (const pivo of modelo.pivotsDeDados) {
        const col = montarColunaCalculada(e, modelo, { pivo, larguraPadrao });
        if (!porPivo.has(pivo.chave)) porPivo.set(pivo.chave, { inicio: [], fim: [] });
        porPivo.get(pivo.chave)[e.posicao].push(col);
      }
    } else {
      const col = montarColunaCalculada(e, modelo, { pivo: null, semPivo: modelo.temPivo, larguraPadrao });
      col.soltaNoCabecalho = modelo.temPivo; // com pivô, ocupa os dois níveis do cabeçalho
      soltas[e.posicao].push(col);
    }
  }
  return { soltas, porPivo, erros };
}

function montarColunaCalculada(e, modelo, { pivo, semPivo = false, larguraPadrao }) {
  const chave = pivo ? pivo.chave : null;
  const avaliar = avaliadorComCache(e, modelo, { chave, semPivo });
  const ehTexto = e.formato === 'texto';
  const formatar = ehTexto ? null : criarFormatadorNumerico({ estilo: e.formato, casas: e.casas, simboloDaMoeda: '$' });
  const textoDoValor = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number' && formatar && Number.isFinite(v)) return formatar(v);
    if (typeof v === 'boolean') return v ? 'Verdadeiro' : 'Falso';
    return String(v);
  };
  const id = `calc${e.n}${chave ? `__${chave}` : ''}`;
  return {
    id,
    tipo: 'calculada',
    ehMedida: !ehTexto,
    campo: { nome: id, rotulo: e.nome, rotuloCurto: e.nome },
    pivo,
    chaveDoPivo: chave || undefined,
    rotulo: e.nome,
    rotuloOriginal: e.nome,
    largura: larguraPadrao,
    alinhamento: ehTexto ? 'left' : 'right',
    visivel: true,
    tipoDeCelula: e.tipoDeCelula,
    corDoTexto: '',
    corDeFundo: '',
    prefixo: '',
    sufixo: '',
    corDaBarra: '#4276BE',
    escalaDeCor: false,
    escalaCorMin: '#FFFFFF',
    escalaCorMax: '#60A5FA',
    regras: [],
    formatar: formatar || ((v) => String(v)),
    formatoProprio: true,
    espacoDeFormula: e,
    resultado: avaliar,
    valorNumerico(linha) {
      const r = avaliar(linha);
      return r.erro || typeof r.valor !== 'number' || !Number.isFinite(r.valor) ? null : r.valor;
    },
    texto(linha, textoNulo) {
      const r = avaliar(linha);
      if (r.erro) return `#ERRO: ${r.erro}`;
      const t = textoDoValor(r.valor);
      return t === null ? textoNulo : t;
    },
    celula() {
      return undefined;
    },
    /** Total da coluna (rodapé): fórmula sobre os totais, ou vazio. */
    totalCalculado(indicesVisiveis, agregar, tipoDeAgregacao) {
      if (e.total === 'vazio' || !e.compilada.ok) return '';
      const campos = [];
      for (const nome of e.compilada.campos) {
        const alvo = [...modelo.dimensoes, ...modelo.medidas].find((c) =>
          [c.nome, semView(c.nome), c.rotuloCurto, c.rotulo].some((n) => n && n.toLowerCase() === nome.toLowerCase())
        );
        if (!alvo) return '';
        const t = totalDoCampo(modelo, alvo.nome, chave, indicesVisiveis, agregar, tipoDeAgregacao);
        if (!t.tem) return '';
        campos.push({ nomes: [nome], valor: () => t.valor });
      }
      try {
        const v = avaliarArvore(e.compilada.arvore, criarResolvedor(campos));
        return textoDoValor(v) ?? '';
      } catch (err) {
        return err instanceof ErroDeFormula ? `#ERRO: ${err.message}` : '';
      }
    },
  };
}

/**
 * Regras de formatação por fórmula (uso "Colorir a linha"/"Colorir
 * células"). Devolve uma função (td, coluna, linha) → aplica a cor.
 */
export function regrasDeFormula(modelo, config) {
  const regras = lerEspacos(config)
    .filter((e) => e.uso !== 'coluna' && e.compilada.ok)
    .map((e) => ({
      e,
      alvo: normalizarTexto(e.alvo),
      porChave: new Map(),
    }));
  if (!regras.length) return null;
  return function aplicar(td, coluna, linha) {
    for (const r of regras) {
      if (r.e.uso === 'celula') {
        const nomes = [coluna.rotulo, coluna.rotuloOriginal, coluna.campo && coluna.campo.nome]
          .filter(Boolean)
          .map(normalizarTexto);
        if (!r.alvo || !nomes.includes(r.alvo)) continue;
      }
      const chave = coluna.chaveDoPivo || '';
      if (!r.porChave.has(chave)) {
        r.porChave.set(chave, avaliadorComCache(r.e, modelo, { chave: chave || null, semPivo: !chave && modelo.temPivo }));
      }
      const res = r.porChave.get(chave)(linha);
      const v = res.valor;
      if (!res.erro && v !== null && v !== undefined && v !== false && v !== 0 && v !== '') {
        td.style.background = r.e.cor;
      }
    }
  };
}
