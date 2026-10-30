/**
 * colunas.js — monta o modelo de colunas da Tabela Completa.
 *
 * Cuida de:
 *  - uma coluna por dimensão;
 *  - com pivô: uma coluna por (valor do pivô × medida), com cabeçalho em
 *    dois níveis, e opcionalmente a coluna de total por linha;
 *  - sem pivô: uma coluna por medida;
 *  - aplicar as opções por coluna (renomear, largura, alinhamento, tipo de
 *    célula, cores, prefixo/sufixo, formato, regras).
 */

import { sanitizarChave } from '../../core/options-kit.js';
import { formatadorDeValueFormat, criarFormatadorNumerico } from '../../core/format.js';
import { REGRAS_POR_COLUNA } from './opcoes.js';
import { colunasCalculadas } from './calculadas.js';

/** Lê uma opção por coluna, já com o prefixo certo. */
function opcaoDaColuna(config, idColuna, sufixo) {
  return config[`col_${sanitizarChave(idColuna)}_${sufixo}`];
}

/** Monta o formatador de uma coluna de medida. */
function criarFormatador(campo, config, idColuna) {
  const formato = opcaoDaColuna(config, idColuna, 'formato') || 'auto';
  const casas = Number(opcaoDaColuna(config, idColuna, 'casasDecimais'));
  const casasSeguras = Number.isFinite(casas) ? casas : 2;

  if (formato === 'auto') {
    // Sem escolha explícita, respeitamos o value_format do campo.
    return formatadorDeValueFormat(campo && campo.valueFormat, { casas: casasSeguras });
  }
  return criarFormatadorNumerico({ estilo: formato, casas: casasSeguras });
}

/** Lê as regras de formatação condicional configuradas para a coluna. */
function lerRegras(config, idColuna) {
  const regras = [];
  for (let r = 1; r <= REGRAS_POR_COLUNA; r++) {
    const condicao = opcaoDaColuna(config, idColuna, `regra${r}`);
    if (!condicao || condicao === 'nenhuma') continue;
    regras.push({
      condicao,
      valor: opcaoDaColuna(config, idColuna, `regra${r}Valor`),
      valor2: opcaoDaColuna(config, idColuna, `regra${r}Valor2`),
      acao: opcaoDaColuna(config, idColuna, `regra${r}Acao`) || 'fundo',
      cor: opcaoDaColuna(config, idColuna, `regra${r}Cor`) || '#FEE2E2',
      icone: opcaoDaColuna(config, idColuna, `regra${r}Icone`) || 'bolinha',
      linhaInteira: !!opcaoDaColuna(config, idColuna, `regra${r}LinhaInteira`),
      colunaComparada: opcaoDaColuna(config, idColuna, `regra${r}Coluna`) || '',
    });
  }
  return regras;
}

/**
 * Constrói a lista de colunas.
 *
 * @param {object} modelo modelo de dados
 * @param {object} config config da visualização
 * @returns {{colunas:Array, colunasVisiveis:Array, temPivo:boolean, gruposDePivo:Array}}
 */
export function construirColunas(modelo, config) {
  const colunas = [];
  const larguraPadrao = Number(config.larguraPadraoDaColuna) || 130;
  const larguraDimensao = Number(config.larguraDasDimensoes) || 180;

  // ---- Colunas de dimensão ----
  for (const campo of modelo.dimensoes) {
    const id = `dim__${campo.nome}`;
    colunas.push(montarColuna({
      id,
      tipo: 'dimensao',
      campo,
      pivo: null,
      rotuloPadrao: campo.rotuloCurto,
      larguraPadrao: larguraDimensao,
      alinhamentoPadrao: 'left',
      config,
      modelo,
    }));
  }

  // ---- Colunas de medida ----
  // Colunas calculadas por fórmula (5.4, v3).
  const calculadas = colunasCalculadas(modelo, config, { larguraPadrao });

  // Sem pivô (ou "só nas colunas sem pivô"): "antes das medidas" entra logo
  // depois das dimensões.
  colunas.push(...calculadas.soltas.inicio);
  if (modelo.temPivo) colunas.push(...calculadas.soltas.fim);

  const gruposDePivo = [];
  if (modelo.temPivo) {
    for (const pivo of modelo.pivotsDeDados) {
      const colunasDoGrupo = [];
      const doPivo = calculadas.porPivo.get(pivo.chave) || { inicio: [], fim: [] };
      colunas.push(...doPivo.inicio);
      colunasDoGrupo.push(...doPivo.inicio);
      for (const campo of modelo.medidas) {
        const id = `med__${campo.nome}__${pivo.chave}`;
        const coluna = montarColuna({
          id,
          tipo: 'medida',
          campo,
          pivo,
          rotuloPadrao: campo.rotuloCurto,
          larguraPadrao,
          alinhamentoPadrao: 'right',
          config,
          modelo,
        });
        colunas.push(coluna);
        colunasDoGrupo.push(coluna);
      }
      colunas.push(...doPivo.fim);
      colunasDoGrupo.push(...doPivo.fim);
      gruposDePivo.push({ rotulo: pivo.rotulo, chave: pivo.chave, colunas: colunasDoGrupo, ehTotal: false });
    }

    // Coluna(s) de total por linha
    if (config.mostrarTotalDeLinha !== false) {
      const colunasDoGrupo = [];
      for (const campo of modelo.medidas) {
        const id = `tot__${campo.nome}`;
        const coluna = montarColuna({
          id,
          tipo: 'totalDeLinha',
          campo,
          pivo: modelo.pivoDeTotal,
          rotuloPadrao: campo.rotuloCurto,
          larguraPadrao,
          alinhamentoPadrao: 'right',
          config,
          modelo,
        });
        colunas.push(coluna);
        colunasDoGrupo.push(coluna);
      }
      gruposDePivo.push({
        rotulo: config.rotuloDoTotal || 'Total',
        chave: '__total__',
        colunas: colunasDoGrupo,
        ehTotal: true,
      });
    }
  } else {
    for (const campo of modelo.medidas) {
      const id = `med__${campo.nome}`;
      colunas.push(montarColuna({
        id,
        tipo: 'medida',
        campo,
        pivo: null,
        rotuloPadrao: campo.rotuloCurto,
        larguraPadrao,
        alinhamentoPadrao: 'right',
        config,
        modelo,
      }));
    }
  }

  if (!modelo.temPivo) colunas.push(...calculadas.soltas.fim);

  const colunasVisiveis = colunas.filter((c) => c.visivel);

  return { colunas, colunasVisiveis, temPivo: modelo.temPivo, gruposDePivo, errosDeFormula: calculadas.erros };
}

function montarColuna({ id, tipo, campo, pivo, rotuloPadrao, larguraPadrao, alinhamentoPadrao, config, modelo }) {
  const ehMedida = tipo !== 'dimensao';
  const rotuloCustomizado = (opcaoDaColuna(config, id, 'rotulo') || '').trim();
  const larguraCustomizada = Number(opcaoDaColuna(config, id, 'largura'));
  const alinhamento = opcaoDaColuna(config, id, 'alinhamento') || 'auto';
  const visivelOpcao = opcaoDaColuna(config, id, 'visivel');

  return {
    id,
    tipo,
    ehMedida,
    campo,
    pivo,
    chaveDoPivo: pivo ? pivo.chave : undefined,
    rotulo: rotuloCustomizado || rotuloPadrao,
    rotuloOriginal: rotuloPadrao,
    largura: Number.isFinite(larguraCustomizada) && larguraCustomizada > 0 ? larguraCustomizada : larguraPadrao,
    alinhamento: alinhamento === 'auto' ? alinhamentoPadrao : alinhamento,
    visivel: visivelOpcao === undefined ? true : !!visivelOpcao,
    tipoDeCelula: opcaoDaColuna(config, id, 'tipoDeCelula') || 'auto',
    corDoTexto: opcaoDaColuna(config, id, 'corDoTexto') || '',
    corDeFundo: opcaoDaColuna(config, id, 'corDeFundo') || '',
    prefixo: opcaoDaColuna(config, id, 'prefixo') || '',
    sufixo: opcaoDaColuna(config, id, 'sufixo') || '',
    corDaBarra: opcaoDaColuna(config, id, 'corDaBarra') || '#4276BE',
    escalaDeCor: !!opcaoDaColuna(config, id, 'escalaDeCor'),
    escalaCorMin: opcaoDaColuna(config, id, 'escalaCorMin') || '#FFFFFF',
    escalaCorMax: opcaoDaColuna(config, id, 'escalaCorMax') || '#60A5FA',
    regras: lerRegras(config, id),
    formatar: ehMedida ? criarFormatador(campo, config, id) : null,

    /** Lê o valor numérico desta coluna numa linha. */
    valorNumerico(linha) {
      if (tipo === 'totalDeLinha') {
        const doLooker = modelo.totalDaLinha(linha, campo.nome);
        if (doLooker !== null) return doLooker;
        // Looker não mandou: soma os pivôs visíveis (e marcamos como nosso).
        let soma = null;
        for (const p of modelo.pivotsDeDados) {
          const v = modelo.valorNumerico(linha, campo.nome, p.chave);
          if (v !== null) soma = (soma === null ? 0 : soma) + v;
        }
        return soma;
      }
      return modelo.valorNumerico(linha, campo.nome, pivo ? pivo.chave : undefined);
    },

    // Com formato "auto" preferimos o texto já renderizado pelo Looker (que
    // respeita o value_format do campo). Com formato explícito, o usuário
    // mandou: usamos o nosso formatador.
    formatoProprio: ehMedida && (opcaoDaColuna(config, id, 'formato') || 'auto') !== 'auto',

    /** Texto de exibição desta coluna numa linha. */
    texto(linha, textoNulo) {
      if (tipo === 'totalDeLinha' || this.formatoProprio) {
        const v = this.valorNumerico(linha);
        return v === null ? textoNulo : this.formatar(v);
      }
      return modelo.texto(linha, campo.nome, pivo ? pivo.chave : undefined, textoNulo);
    },

    /** Célula crua (para drill e links). */
    celula(linha) {
      if (tipo === 'totalDeLinha') return undefined;
      return modelo.celula(linha, campo.nome, pivo ? pivo.chave : undefined);
    },
  };
}

/** Colunas numéricas, para o select "comparar com a coluna". */
export function colunasNumericasParaOpcoes(colunas) {
  return colunas.filter((c) => c.ehMedida).map((c) => ({ id: c.id, rotulo: c.rotulo }));
}

/** Resumo leve das colunas, usado para gerar as opções dinâmicas. */
export function resumoDeColunas(colunas) {
  return colunas.map((c) => ({ id: c.id, rotulo: c.rotuloOriginal, ehMedida: c.ehMedida }));
}
