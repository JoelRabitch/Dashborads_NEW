/**
 * opcoes.js — opções do painel Edit da Tabela Completa.
 *
 * Separado do `index.js` porque é bastante coisa: a seção 8 do
 * PROMPT_AGENTE.md pede "tudo configurável, por coluna quando fizer
 * sentido". Aqui ficam as opções ESTÁTICAS; as opções POR COLUNA são
 * geradas dinamicamente em `opcoesPorColuna()` depois que sabemos quais
 * colunas a consulta trouxe.
 */

import {
  montarOpcoes,
  listaDeValores,
  sanitizarChave,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';
import { opcoesDasCalculadas } from './calculadas.js';
import { LAYOUTS } from './layouts.js';

/** Quantas regras de formatação condicional cada coluna oferece. */
export const REGRAS_POR_COLUNA = 3;

/**
 * Limite de colunas que ganham opções próprias no painel.
 * Sem limite, uma consulta com 60 colunas geraria mais de mil opções e o
 * painel Edit viraria um monstro. Decisão registrada no LOG.
 */
export const MAXIMO_DE_COLUNAS_CONFIGURAVEIS = 20;

export const TIPOS_DE_CELULA = [
  { rotulo: 'Automático (texto ou número)', valor: 'auto' },
  { rotulo: 'Texto', valor: 'texto' },
  { rotulo: 'Número', valor: 'numero' },
  { rotulo: 'Barra de dados', valor: 'barraDeDados' },
  { rotulo: 'Barra de progresso (%)', valor: 'progresso' },
  { rotulo: 'Anel de progresso (%)', valor: 'anel' },
  { rotulo: 'Medidor pequeno', valor: 'medidor' },
  { rotulo: 'Sparkline (lista de valores)', valor: 'sparkline' },
  { rotulo: 'Mini barras (lista de valores)', valor: 'miniBarras' },
  { rotulo: 'Mini área (lista de valores)', valor: 'miniArea' },
  { rotulo: 'Badge colorido', valor: 'badge' },
  { rotulo: 'Semáforo', valor: 'semaforo' },
  { rotulo: 'Seta de variação (▲▼)', valor: 'seta' },
  { rotulo: 'Estrelas', valor: 'estrelas' },
  { rotulo: 'Booleano (✓/✗)', valor: 'booleano' },
  { rotulo: 'Avatar com iniciais', valor: 'avatar' },
  { rotulo: 'Imagem (URL)', valor: 'imagem' },
  { rotulo: 'Link', valor: 'link' },
  { rotulo: 'Data', valor: 'data' },
];

export const CONDICOES = [
  { rotulo: '— sem regra —', valor: 'nenhuma' },
  { rotulo: 'Maior que', valor: 'maior' },
  { rotulo: 'Maior ou igual a', valor: 'maiorIgual' },
  { rotulo: 'Menor que', valor: 'menor' },
  { rotulo: 'Menor ou igual a', valor: 'menorIgual' },
  { rotulo: 'Igual a', valor: 'igual' },
  { rotulo: 'Diferente de', valor: 'diferente' },
  { rotulo: 'Entre (valor e valor 2)', valor: 'entre' },
  { rotulo: 'Fora do intervalo', valor: 'fora' },
  { rotulo: 'Contém o texto', valor: 'contem' },
  { rotulo: 'Começa com', valor: 'comecaCom' },
  { rotulo: 'É nulo/vazio', valor: 'nulo' },
  { rotulo: 'Está no Top N', valor: 'topN' },
  { rotulo: 'Está no Bottom N', valor: 'bottomN' },
  { rotulo: 'Acima da média', valor: 'acimaDaMedia' },
  { rotulo: 'Abaixo da média', valor: 'abaixoDaMedia' },
  { rotulo: 'Acima do percentil N', valor: 'acimaDoPercentil' },
  { rotulo: 'Maior que outra coluna', valor: 'maiorQueColuna' },
  { rotulo: 'Menor que outra coluna', valor: 'menorQueColuna' },
];

export const ACOES_DE_REGRA = [
  { rotulo: 'Cor de fundo', valor: 'fundo' },
  { rotulo: 'Cor do texto', valor: 'texto' },
  { rotulo: 'Negrito', valor: 'negrito' },
  { rotulo: 'Fundo + texto branco', valor: 'fundoETexto' },
  { rotulo: 'Ícone antes do valor', valor: 'icone' },
  { rotulo: 'Badge', valor: 'badge' },
  { rotulo: 'Borda à esquerda', valor: 'borda' },
  { rotulo: 'Piscar (alerta)', valor: 'piscar' },
];

export const ICONES_DE_REGRA = [
  { rotulo: '▲ subiu', valor: 'subiu' },
  { rotulo: '▼ desceu', valor: 'desceu' },
  { rotulo: '● bolinha', valor: 'bolinha' },
  { rotulo: '★ estrela', valor: 'estrela' },
  { rotulo: '⚠ atenção', valor: 'atencao' },
  { rotulo: '✓ ok', valor: 'ok' },
  { rotulo: '✗ erro', valor: 'erro' },
];

/** Opções estáticas (valem para a tabela inteira). */
export function opcoesEstaticas() {
  return montarOpcoes(
    blocoDeTema(),
    blocoAvancado(),
    // Colunas calculadas por fórmula (5.4, v3): 8 espaços fixos.
    opcoesDasCalculadas(),
    {
      // ---------- Estrutura ----------
      agruparPor: {
        type: 'string',
        label: 'Agrupar linhas por',
        section: 'Dados',
        display: 'select',
        default: 'nenhum',
        values: listaDeValores([
          { rotulo: 'Não agrupar', valor: 'nenhum' },
          { rotulo: '1ª dimensão', valor: '1' },
          { rotulo: '1ª e 2ª dimensões', valor: '2' },
          { rotulo: '1ª, 2ª e 3ª dimensões', valor: '3' },
        ]),
      },
      gruposComecamAbertos: {
        type: 'boolean',
        label: 'Grupos começam abertos',
        section: 'Dados',
        default: true,
      },
      mostrarSubtotais: {
        type: 'boolean',
        label: 'Mostrar subtotal por grupo',
        section: 'Dados',
        default: true,
      },
      transporPivo: {
        type: 'boolean',
        label: 'Transpor (valores do pivô viram linhas)',
        section: 'Dados',
        default: false,
      },
      mostrarTotalDeLinha: {
        type: 'boolean',
        label: 'Mostrar coluna de total por linha (quando pivotado)',
        section: 'Dados',
        default: true,
      },
      ordenacaoInicial: {
        type: 'string',
        label: 'Ordenação inicial',
        section: 'Dados',
        display: 'select',
        default: 'original',
        values: listaDeValores([
          { rotulo: 'Como veio da consulta', valor: 'original' },
          { rotulo: '1ª medida (maior primeiro)', valor: 'medidaDesc' },
          { rotulo: '1ª medida (menor primeiro)', valor: 'medidaAsc' },
          { rotulo: '1ª dimensão (A→Z)', valor: 'dimensaoAsc' },
          { rotulo: '1ª dimensão (Z→A)', valor: 'dimensaoDesc' },
        ]),
      },
      tratamentoDeNulos: {
        type: 'string',
        label: 'Valores nulos',
        section: 'Dados',
        display: 'select',
        default: 'manter',
        values: listaDeValores([
          { rotulo: 'Mostrar o texto de nulo', valor: 'manter' },
          { rotulo: 'Mostrar como vazio', valor: 'vazio' },
          { rotulo: 'Mostrar como zero', valor: 'zero' },
        ]),
      },
      textoParaNulo: { type: 'string', label: 'Texto para valor nulo', section: 'Dados', default: '∅' },
      estiloDeData: {
        type: 'string',
        label: 'Formato das colunas com tipo de célula "Data"',
        section: 'Dados',
        display: 'select',
        default: 'auto',
        values: listaDeValores([
          { rotulo: 'Dia/mês/ano', valor: 'auto' },
          { rotulo: 'Dia/mês', valor: 'diaMes' },
          { rotulo: 'Mês/ano', valor: 'mesAno' },
          { rotulo: 'Ano', valor: 'ano' },
          { rotulo: 'Data e hora', valor: 'completo' },
        ]),
      },

      // ---------- Formato / layout ----------
      // Layout (5.5, v3): estrutura, separada das cores/tema.
      layoutDaTabela: {
        type: 'string',
        label: 'Layout',
        section: 'Formato',
        display: 'select',
        values: listaDeValores(LAYOUTS),
        default: 'tabela',
      },
      camposDoCartao: {
        type: 'string',
        label: 'Campos do cartão/lista (vazio = todos)',
        section: 'Formato',
        placeholder: 'Código, Descrição, Valor',
        default: '',
      },
      colunasDosCartoes: { type: 'number', label: 'Cartões por linha (0 = auto)', section: 'Formato', default: 0 },
      colunasDeCamposDoCartao: { type: 'number', label: 'Colunas de campos no cartão', section: 'Formato', default: 2 },
      secoesDoLayout: {
        type: 'string',
        label: 'Seções (Título: col1, col2; …)',
        section: 'Formato',
        placeholder: 'Produto: Código, Descrição; Valores: Qtd, Preço',
        default: '',
      },
      densidade: {
        type: 'string',
        label: 'Densidade',
        section: 'Formato',
        display: 'select',
        default: 'normal',
        values: listaDeValores([
          { rotulo: 'Compacta', valor: 'compacta' },
          { rotulo: 'Normal', valor: 'normal' },
          { rotulo: 'Confortável', valor: 'confortavel' },
        ]),
      },
      alturaDaLinha: {
        type: 'number',
        label: 'Altura da linha (px) — 0 usa a densidade',
        section: 'Formato',
        display: 'range',
        min: 0,
        max: 80,
        step: 1,
        default: 0,
      },
      alturaDoCabecalho: {
        type: 'number',
        label: 'Altura do cabeçalho (px) — 0 usa a densidade',
        section: 'Formato',
        display: 'range',
        min: 0,
        max: 90,
        step: 1,
        default: 0,
      },
      larguraPadraoDaColuna: {
        type: 'number',
        label: 'Largura padrão das colunas (px)',
        section: 'Formato',
        display: 'range',
        min: 60,
        max: 400,
        step: 10,
        default: 130,
      },
      larguraDasDimensoes: {
        type: 'number',
        label: 'Largura das colunas de dimensão (px)',
        section: 'Formato',
        display: 'range',
        min: 80,
        max: 500,
        step: 10,
        default: 180,
      },
      colunasFixasAEsquerda: {
        type: 'number',
        label: 'Quantas colunas ficam fixas à esquerda',
        section: 'Formato',
        display: 'range',
        min: 0,
        max: 5,
        step: 1,
        default: 1,
      },
      cabecalhoFixo: { type: 'boolean', label: 'Cabeçalho fixo ao rolar', section: 'Formato', default: true },
      rodapeFixo: { type: 'boolean', label: 'Totais fixos no rodapé', section: 'Formato', default: true },
      quebrarTexto: {
        type: 'string',
        label: 'Texto que não cabe',
        section: 'Formato',
        display: 'select',
        default: 'truncar',
        values: listaDeValores([
          { rotulo: 'Truncar com reticências', valor: 'truncar' },
          { rotulo: 'Quebrar linha', valor: 'quebrar' },
        ]),
      },
      cabecalhoVertical: {
        type: 'boolean',
        label: 'Cabeçalho com texto na vertical',
        section: 'Formato',
        default: false,
      },
      mostrarNumeroDaLinha: {
        type: 'boolean',
        label: 'Mostrar número da linha',
        section: 'Formato',
        default: false,
      },

      // ---------- Totais ----------
      mostrarTotais: { type: 'boolean', label: 'Mostrar linha de totais', section: 'Dados', default: true },
      agregacaoDoTotal: {
        type: 'string',
        label: 'Como calcular os totais (quando o Looker não envia)',
        section: 'Dados',
        display: 'select',
        default: 'soma',
        values: listaDeValores([
          { rotulo: 'Soma', valor: 'soma' },
          { rotulo: 'Média', valor: 'media' },
          { rotulo: 'Mínimo', valor: 'minimo' },
          { rotulo: 'Máximo', valor: 'maximo' },
          { rotulo: 'Contagem', valor: 'contagem' },
          { rotulo: 'Contagem distinta', valor: 'contagemDistinta' },
          { rotulo: 'Mediana', valor: 'mediana' },
        ]),
      },
      rotuloDoTotal: { type: 'string', label: 'Rótulo da linha de totais', section: 'Dados', default: 'Total' },

      // ---------- Aparência ----------
      estiloDaTabela: {
        type: 'string',
        label: 'Estilo',
        section: 'Tema',
        display: 'select',
        default: 'claro',
        values: listaDeValores([
          { rotulo: 'Claro', valor: 'claro' },
          { rotulo: 'Escuro', valor: 'escuro' },
          { rotulo: 'Cinza', valor: 'cinza' },
          { rotulo: 'Minimal (sem bordas)', valor: 'minimal' },
          { rotulo: 'Cartão', valor: 'cartao' },
          { rotulo: 'Zebra', valor: 'zebra' },
          { rotulo: 'Compacto', valor: 'compacto' },
          { rotulo: 'Planilha', valor: 'planilha' },
        ]),
      },
      corDoCabecalho: { type: 'string', label: 'Fundo do cabeçalho', section: 'Tema', display: 'color', default: '' },
      corDoTextoDoCabecalho: { type: 'string', label: 'Texto do cabeçalho', section: 'Tema', display: 'color', default: '' },
      corDaZebra: { type: 'string', label: 'Cor das linhas alternadas', section: 'Tema', display: 'color', default: '' },
      corDoHover: { type: 'string', label: 'Cor ao passar o mouse', section: 'Tema', display: 'color', default: '' },
      corDaSelecao: { type: 'string', label: 'Cor da linha selecionada', section: 'Tema', display: 'color', default: '' },
      mostrarBordasVerticais: { type: 'boolean', label: 'Bordas verticais', section: 'Tema', default: true },
      mostrarBordasHorizontais: { type: 'boolean', label: 'Bordas horizontais', section: 'Tema', default: true },
      raioDaBorda: {
        type: 'number',
        label: 'Arredondamento (px)',
        section: 'Tema',
        display: 'range',
        min: 0,
        max: 16,
        step: 1,
        default: 0,
      },

      // ---------- Interação ----------
      permitirOrdenar: { type: 'boolean', label: 'Ordenar clicando no cabeçalho', section: 'Interação', default: true },
      mostrarBusca: { type: 'boolean', label: 'Mostrar caixa de busca', section: 'Interação', default: true },
      // Busca "contém" (5.3, v3). Opções novas, padrão novo.
      modoDaBusca: {
        type: 'string',
        label: 'Várias palavras',
        section: 'Busca',
        display: 'select',
        values: [{ 'Todas precisam aparecer': 'todas' }, { 'Qualquer uma basta': 'qualquer' }],
        default: 'todas',
      },
      colunasDaBusca: {
        type: 'string',
        label: 'Colunas (vazio = visíveis)',
        section: 'Busca',
        placeholder: 'Código, Descrição',
        default: '',
      },
      buscarEm: {
        type: 'string',
        label: 'Procurar no',
        section: 'Busca',
        display: 'select',
        values: [{ 'Texto formatado': 'formatado' }, { 'Valor bruto': 'bruto' }],
        default: 'formatado',
      },
      realcarBusca: { type: 'boolean', label: 'Realçar o trecho', section: 'Busca', default: true },
      mostrarFiltrosPorColuna: {
        type: 'boolean',
        label: 'Mostrar filtro em cada coluna',
        section: 'Interação',
        default: false,
      },
      permitirSelecionarLinhas: {
        type: 'boolean',
        label: 'Selecionar linhas (clique) e somar',
        section: 'Interação',
        default: true,
      },
      destacarLinhaEColuna: {
        type: 'boolean',
        label: 'Destacar linha e coluna sob o mouse',
        section: 'Interação',
        default: true,
      },
      permitirRedimensionarColunas: {
        type: 'boolean',
        label: 'Redimensionar colunas arrastando',
        section: 'Interação',
        default: true,
      },
      permitirDrill: { type: 'boolean', label: 'Drill ao clicar na célula', section: 'Interação', default: true },
      permitirExportarCsv: { type: 'boolean', label: 'Botão de exportar CSV', section: 'Interação', default: true },
      permitirCopiar: { type: 'boolean', label: 'Permitir copiar (Ctrl+C / menu)', section: 'Interação', default: true },
      linhasPorPagina: {
        type: 'number',
        label: 'Linhas por página (0 = rolagem contínua)',
        section: 'Interação',
        display: 'range',
        min: 0,
        max: 500,
        step: 10,
        default: 0,
      },

      // ---------- Animação específica da tabela ----------
      animarEntradaDasLinhas: {
        type: 'boolean',
        label: 'Animar entrada das linhas',
        section: 'Animação',
        default: true,
      },
      animarMudancaDeValor: {
        type: 'boolean',
        label: 'Piscar quando o valor mudar entre atualizações',
        section: 'Animação',
        default: true,
      },
      corDeSubida: { type: 'string', label: 'Cor quando o valor sobe', section: 'Animação', display: 'color', default: '#16A34A' },
      corDeDescida: { type: 'string', label: 'Cor quando o valor desce', section: 'Animação', display: 'color', default: '#DC2626' },
    }
  );
}

/**
 * Gera as opções POR COLUNA (rótulo, largura, alinhamento, tipo de célula,
 * cores, prefixo/sufixo, formato e regras de formatação condicional).
 *
 * @param {Array<{id:string, rotulo:string, ehMedida:boolean}>} colunas
 * @param {Array<{nome:string, rotulo:string}>} colunasNumericas para comparar coluna com coluna
 */
export function opcoesPorColuna(colunas, colunasNumericas = []) {
  const saida = {};
  const limite = Math.min(colunas.length, MAXIMO_DE_COLUNAS_CONFIGURAVEIS);

  for (let i = 0; i < limite; i++) {
    const coluna = colunas[i];
    const chave = sanitizarChave(coluna.id);
    const secao = `Coluna: ${coluna.rotulo}`.slice(0, 48);

    saida[`col_${chave}_visivel`] = {
      type: 'boolean',
      label: 'Mostrar esta coluna',
      section: secao,
      default: true,
    };
    saida[`col_${chave}_rotulo`] = {
      type: 'string',
      label: 'Renomear para',
      section: secao,
      default: '',
      placeholder: coluna.rotulo,
    };
    saida[`col_${chave}_largura`] = {
      type: 'number',
      label: 'Largura (px, 0 = padrão)',
      section: secao,
      display: 'range',
      min: 0,
      max: 500,
      step: 10,
      default: 0,
    };
    saida[`col_${chave}_alinhamento`] = {
      type: 'string',
      label: 'Alinhamento',
      section: secao,
      display: 'select',
      default: 'auto',
      values: listaDeValores([
        { rotulo: 'Automático', valor: 'auto' },
        { rotulo: 'Esquerda', valor: 'left' },
        { rotulo: 'Centro', valor: 'center' },
        { rotulo: 'Direita', valor: 'right' },
      ]),
    };
    saida[`col_${chave}_tipoDeCelula`] = {
      type: 'string',
      label: 'Tipo de célula',
      section: secao,
      display: 'select',
      default: 'auto',
      values: listaDeValores(TIPOS_DE_CELULA),
    };
    saida[`col_${chave}_corDoTexto`] = {
      type: 'string',
      label: 'Cor do texto',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    };
    saida[`col_${chave}_corDeFundo`] = {
      type: 'string',
      label: 'Cor de fundo',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    };
    saida[`col_${chave}_prefixo`] = {
      type: 'string',
      label: 'Prefixo',
      section: secao,
      default: '',
      display_size: 'half',
    };
    saida[`col_${chave}_sufixo`] = {
      type: 'string',
      label: 'Sufixo',
      section: secao,
      default: '',
      display_size: 'half',
    };

    if (coluna.ehMedida) {
      saida[`col_${chave}_formato`] = {
        type: 'string',
        label: 'Formato do número',
        section: secao,
        display: 'select',
        default: 'auto',
        values: listaDeValores([
          { rotulo: 'Automático (usa o do campo)', valor: 'auto' },
          { rotulo: 'Número', valor: 'numero' },
          { rotulo: 'Compacto (K, M, B)', valor: 'compacto' },
          { rotulo: 'Moeda', valor: 'moeda' },
          { rotulo: 'Percentual', valor: 'percentual' },
          { rotulo: 'Científico', valor: 'cientifico' },
        ]),
      };
      saida[`col_${chave}_casasDecimais`] = {
        type: 'number',
        label: 'Casas decimais',
        section: secao,
        display: 'range',
        min: 0,
        max: 6,
        step: 1,
        default: 2,
      };
      saida[`col_${chave}_corDaBarra`] = {
        type: 'string',
        label: 'Cor da barra/sparkline',
        section: secao,
        display: 'color',
        default: '#4276BE',
      };
    }

    // Regras de formatação condicional
    for (let r = 1; r <= REGRAS_POR_COLUNA; r++) {
      saida[`col_${chave}_regra${r}`] = {
        type: 'string',
        label: `Regra ${r}: condição`,
        section: secao,
        display: 'select',
        default: 'nenhuma',
        values: listaDeValores(CONDICOES),
      };
      saida[`col_${chave}_regra${r}Valor`] = {
        type: 'string',
        label: `Regra ${r}: valor`,
        section: secao,
        default: '',
        display_size: 'half',
      };
      saida[`col_${chave}_regra${r}Valor2`] = {
        type: 'string',
        label: `Regra ${r}: valor 2 (para "entre")`,
        section: secao,
        default: '',
        display_size: 'half',
      };
      saida[`col_${chave}_regra${r}Acao`] = {
        type: 'string',
        label: `Regra ${r}: o que fazer`,
        section: secao,
        display: 'select',
        default: 'fundo',
        values: listaDeValores(ACOES_DE_REGRA),
      };
      saida[`col_${chave}_regra${r}Cor`] = {
        type: 'string',
        label: `Regra ${r}: cor`,
        section: secao,
        display: 'color',
        default: '#FEE2E2',
        display_size: 'half',
      };
      saida[`col_${chave}_regra${r}Icone`] = {
        type: 'string',
        label: `Regra ${r}: ícone`,
        section: secao,
        display: 'select',
        default: 'bolinha',
        values: listaDeValores(ICONES_DE_REGRA),
        display_size: 'half',
      };
      saida[`col_${chave}_regra${r}LinhaInteira`] = {
        type: 'boolean',
        label: `Regra ${r}: aplicar na linha inteira`,
        section: secao,
        default: false,
      };
      if (colunasNumericas.length > 1) {
        saida[`col_${chave}_regra${r}Coluna`] = {
          type: 'string',
          label: `Regra ${r}: comparar com a coluna`,
          section: secao,
          display: 'select',
          default: '',
          values: [{ '(nenhuma)': '' }].concat(colunasNumericas.map((c) => ({ [c.rotulo]: c.id }))),
        };
      }
    }

    // Escala de cor (heat) por coluna — só faz sentido em medida
    if (coluna.ehMedida) {
      saida[`col_${chave}_escalaDeCor`] = {
        type: 'boolean',
        label: 'Escala de cor (mapa de calor) nesta coluna',
        section: secao,
        default: false,
      };
      saida[`col_${chave}_escalaCorMin`] = {
        type: 'string',
        label: 'Escala: cor do menor valor',
        section: secao,
        display: 'color',
        default: '#FFFFFF',
        display_size: 'half',
      };
      saida[`col_${chave}_escalaCorMax`] = {
        type: 'string',
        label: 'Escala: cor do maior valor',
        section: secao,
        display: 'color',
        default: '#60A5FA',
        display_size: 'half',
      };
    }
  }

  return saida;
}
