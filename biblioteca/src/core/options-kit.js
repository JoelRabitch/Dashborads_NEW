/**
 * options-kit.js — blocos de opções reutilizáveis para o painel Edit.
 *
 * Cada gráfico declara as opções como DADOS (regra 4 da seção 5), compondo
 * blocos daqui + as opções específicas dele. Assim:
 *   - o usuário vê nomes e seções consistentes em toda a biblioteca;
 *   - mudar um rótulo ou um padrão muda em todos os gráficos de uma vez.
 *
 * Formato de cada opção (API do Looker):
 *   { type: 'string'|'number'|'boolean'|'array', label, default, section,
 *     order, display: 'select'|'radio'|'color'|'colors'|'range'|'text',
 *     values: [{Rótulo: 'valor'}], min, max, step, placeholder, display_size }
 */

import { opcoesDePaleta, opcoesDeEscalaContinua } from './theme.js';

/**
 * Ordem das seções no painel. O Looker ordena pelo campo `order`, então
 * damos uma faixa de números por seção para que elas apareçam agrupadas e
 * na sequência que faz sentido de ler.
 */
export const SECOES = {
  Dados: 100,
  Formato: 200,
  Cores: 300,
  Eixos: 400,
  Rótulos: 500,
  Legenda: 600,
  Referências: 700,
  Interação: 800,
  Animação: 900,
  Tema: 1000,
  Avançado: 1100,
};

/** Converte lista de {valor, rotulo} para o formato de `values` do Looker. */
export function listaDeValores(pares) {
  return pares.map(({ rotulo, valor }) => ({ [rotulo]: valor }));
}

/**
 * Junta blocos de opções num objeto só, atribuindo `order` automaticamente
 * conforme a seção e a posição dentro do bloco.
 * @param {...object} blocos
 */
export function montarOpcoes(...blocos) {
  const saida = {};
  const contadorPorSecao = {};
  for (const bloco of blocos) {
    if (!bloco) continue;
    for (const chave of Object.keys(bloco)) {
      const opcao = { ...bloco[chave] };
      const secao = opcao.section || 'Avançado';
      const base = SECOES[secao] !== undefined ? SECOES[secao] : 1200;
      contadorPorSecao[secao] = (contadorPorSecao[secao] || 0) + 1;
      if (opcao.order === undefined) opcao.order = base + contadorPorSecao[secao];
      saida[chave] = opcao;
    }
  }
  return saida;
}

/* ------------------------------------------------------------------ */
/* Blocos                                                              */
/* ------------------------------------------------------------------ */

/** Cores: paleta categórica, cor por valor, opacidade, fundo e contorno. */
export function blocoDeCores(opcoes = {}) {
  const {
    comPaleta = true,
    comEscalaPorValor = true,
    comOpacidade = true,
    comContorno = true,
    opacidadePadrao = 1,
    secao = 'Cores',
  } = opcoes;

  const bloco = {};

  if (comPaleta) {
    bloco.paleta = {
      type: 'string',
      label: 'Paleta de cores',
      section: secao,
      display: 'select',
      default: 'looker',
      values: opcoesDePaleta(),
    };
    bloco.inverterPaleta = {
      type: 'boolean',
      label: 'Inverter ordem das cores',
      section: secao,
      default: false,
    };
  }

  if (comEscalaPorValor) {
    bloco.modoDeCor = {
      type: 'string',
      label: 'Como colorir',
      section: secao,
      display: 'select',
      default: 'categoria',
      values: listaDeValores([
        { rotulo: 'Por categoria (paleta)', valor: 'categoria' },
        { rotulo: 'Por valor (escala contínua)', valor: 'valor' },
        { rotulo: 'Cor única', valor: 'unica' },
      ]),
    };
    bloco.corUnica = {
      type: 'string',
      label: 'Cor única',
      section: secao,
      display: 'color',
      default: '#4276BE',
    };
    bloco.escalaDeCor = {
      type: 'string',
      label: 'Escala contínua (cor por valor)',
      section: secao,
      display: 'select',
      default: 'azul',
      values: opcoesDeEscalaContinua(),
    };
    bloco.escalaDeCorPersonalizada = {
      type: 'boolean',
      label: 'Usar cores próprias na escala',
      section: secao,
      default: false,
    };
    bloco.corMinima = {
      type: 'string',
      label: 'Cor do mínimo',
      section: secao,
      display: 'color',
      default: '#F1F5F9',
      display_size: 'third',
    };
    bloco.corMedia = {
      type: 'string',
      label: 'Cor do meio (deixe igual ao mínimo para escala de 2 cores)',
      section: secao,
      display: 'color',
      default: '#93C5FD',
      display_size: 'third',
    };
    bloco.corMaxima = {
      type: 'string',
      label: 'Cor do máximo',
      section: secao,
      display: 'color',
      default: '#1D4ED8',
      display_size: 'third',
    };
    bloco.limiteDeCorAutomatico = {
      type: 'boolean',
      label: 'Mínimo e máximo automáticos',
      section: secao,
      default: true,
    };
    bloco.limiteDeCorMinimo = {
      type: 'number',
      label: 'Mínimo da escala (manual)',
      section: secao,
      display_size: 'half',
    };
    bloco.limiteDeCorMaximo = {
      type: 'number',
      label: 'Máximo da escala (manual)',
      section: secao,
      display_size: 'half',
    };
  }

  if (comOpacidade) {
    bloco.opacidade = {
      type: 'number',
      label: 'Opacidade do preenchimento',
      section: secao,
      display: 'range',
      min: 0.05,
      max: 1,
      step: 0.05,
      default: opacidadePadrao,
    };
  }

  if (comContorno) {
    bloco.mostrarContorno = {
      type: 'boolean',
      label: 'Mostrar contorno',
      section: secao,
      default: true,
    };
    bloco.corDoContorno = {
      type: 'string',
      label: 'Cor do contorno',
      section: secao,
      display: 'color',
      default: '#FFFFFF',
      display_size: 'half',
    };
    bloco.espessuraDoContorno = {
      type: 'number',
      label: 'Espessura do contorno (px)',
      section: secao,
      display: 'range',
      min: 0,
      max: 8,
      step: 0.5,
      default: 1,
      display_size: 'half',
    };
    bloco.tracejadoDoContorno = {
      type: 'string',
      label: 'Estilo do contorno',
      section: secao,
      display: 'select',
      default: 'solido',
      values: listaDeValores([
        { rotulo: 'Sólido', valor: 'solido' },
        { rotulo: 'Tracejado', valor: 'tracejado' },
        { rotulo: 'Pontilhado', valor: 'pontilhado' },
      ]),
    };
  }

  return bloco;
}

/** Rotação e orientação. */
export function blocoDeRotacao(opcoes = {}) {
  const { secao = 'Formato', comOrientacao = true, comEspelhar = true, rotacaoPadrao = 0 } = opcoes;
  const bloco = {
    rotacao: {
      type: 'number',
      label: 'Rotação (graus)',
      section: secao,
      display: 'range',
      min: -180,
      max: 180,
      step: 1,
      default: rotacaoPadrao,
    },
  };
  if (comOrientacao) {
    bloco.orientacao = {
      type: 'string',
      label: 'Orientação',
      section: secao,
      display: 'select',
      default: 'vertical',
      values: listaDeValores([
        { rotulo: 'Vertical', valor: 'vertical' },
        { rotulo: 'Horizontal', valor: 'horizontal' },
      ]),
    };
    bloco.inverterOrientacao = {
      type: 'boolean',
      label: 'Inverter sentido',
      section: secao,
      default: false,
    };
  }
  if (comEspelhar) {
    bloco.espelhar = { type: 'boolean', label: 'Espelhar', section: secao, default: false };
  }
  return bloco;
}

/** Barras e áreas. */
export function blocoDeBarras(opcoes = {}) {
  const { secao = 'Formato', comEmpilhamento = true } = opcoes;
  const bloco = {
    larguraDaBarra: {
      type: 'number',
      label: 'Largura da barra (% do espaço)',
      section: secao,
      display: 'range',
      min: 10,
      max: 100,
      step: 5,
      default: 80,
    },
    espacamentoEntreGrupos: {
      type: 'number',
      label: 'Espaço entre grupos (%)',
      section: secao,
      display: 'range',
      min: 0,
      max: 60,
      step: 5,
      default: 20,
    },
    raioDosCantos: {
      type: 'number',
      label: 'Arredondamento dos cantos (px)',
      section: secao,
      display: 'range',
      min: 0,
      max: 24,
      step: 1,
      default: 2,
    },
  };
  if (comEmpilhamento) {
    bloco.empilhamento = {
      type: 'string',
      label: 'Empilhamento',
      section: secao,
      display: 'select',
      default: 'agrupado',
      values: listaDeValores([
        { rotulo: 'Agrupado (lado a lado)', valor: 'agrupado' },
        { rotulo: 'Empilhado', valor: 'empilhado' },
        { rotulo: 'Empilhado 100%', valor: 'normalizado' },
      ]),
    };
  }
  return bloco;
}

/** Pontos e linhas. */
export function blocoDePontosELinhas(opcoes = {}) {
  const { secao = 'Formato', comForma = true, comLinha = true, tamanhoPadrao = 6 } = opcoes;
  const bloco = {};
  if (comForma) {
    bloco.formaDoPonto = {
      type: 'string',
      label: 'Forma do ponto',
      section: secao,
      display: 'select',
      default: 'circulo',
      values: listaDeValores([
        { rotulo: 'Círculo', valor: 'circulo' },
        { rotulo: 'Quadrado', valor: 'quadrado' },
        { rotulo: 'Triângulo', valor: 'triangulo' },
        { rotulo: 'Losango', valor: 'losango' },
        { rotulo: 'Cruz', valor: 'cruz' },
        { rotulo: 'Estrela', valor: 'estrela' },
        { rotulo: 'Wye (Y)', valor: 'wye' },
      ]),
    };
    bloco.tamanhoDoPonto = {
      type: 'number',
      label: 'Tamanho do ponto (px)',
      section: secao,
      display: 'range',
      min: 1,
      max: 40,
      step: 1,
      default: tamanhoPadrao,
    };
    bloco.tamanhoPorMedida = {
      type: 'boolean',
      label: 'Tamanho proporcional a uma medida',
      section: secao,
      default: false,
    };
    bloco.tamanhoMinimo = {
      type: 'number',
      label: 'Tamanho mínimo (px)',
      section: secao,
      display: 'range',
      min: 1,
      max: 40,
      step: 1,
      default: 3,
      display_size: 'half',
    };
    bloco.tamanhoMaximo = {
      type: 'number',
      label: 'Tamanho máximo (px)',
      section: secao,
      display: 'range',
      min: 2,
      max: 80,
      step: 1,
      default: 28,
      display_size: 'half',
    };
  }
  if (comLinha) {
    bloco.espessuraDaLinha = {
      type: 'number',
      label: 'Espessura da linha (px)',
      section: secao,
      display: 'range',
      min: 0.5,
      max: 10,
      step: 0.5,
      default: 2,
    };
    bloco.estiloDaLinha = {
      type: 'string',
      label: 'Estilo da linha',
      section: secao,
      display: 'select',
      default: 'solido',
      values: listaDeValores([
        { rotulo: 'Sólida', valor: 'solido' },
        { rotulo: 'Tracejada', valor: 'tracejado' },
        { rotulo: 'Pontilhada', valor: 'pontilhado' },
      ]),
    };
    bloco.suavizacao = {
      type: 'string',
      label: 'Suavização da curva',
      section: secao,
      display: 'select',
      default: 'monotone',
      values: listaDeValores([
        { rotulo: 'Reta (linear)', valor: 'linear' },
        { rotulo: 'Suave (monotone)', valor: 'monotone' },
        { rotulo: 'Muito suave (basis)', valor: 'basis' },
        { rotulo: 'Catmull-Rom', valor: 'catmull' },
        { rotulo: 'Degraus', valor: 'step' },
      ]),
    };
    bloco.preencherAbaixo = {
      type: 'boolean',
      label: 'Preencher abaixo da linha',
      section: secao,
      default: false,
    };
  }
  return bloco;
}

/** Pivô: séries a partir do pivô, transpor, ordenar e limitar. */
export function blocoDePivo(opcoes = {}) {
  const { secao = 'Dados' } = opcoes;
  return {
    pivoComoSeries: {
      type: 'boolean',
      label: 'Usar valores do pivô como séries',
      section: secao,
      default: true,
    },
    transporPivo: {
      type: 'boolean',
      label: 'Transpor (pivô nas linhas)',
      section: secao,
      default: false,
    },
    ordemDoPivo: {
      type: 'string',
      label: 'Ordem dos valores do pivô',
      section: secao,
      display: 'select',
      default: 'original',
      values: listaDeValores([
        { rotulo: 'Como veio da consulta', valor: 'original' },
        { rotulo: 'Alfabética', valor: 'alfabetica' },
        { rotulo: 'Por total (maior primeiro)', valor: 'totalDesc' },
        { rotulo: 'Por total (menor primeiro)', valor: 'totalAsc' },
      ]),
    },
    limiteDoPivo: {
      type: 'number',
      label: 'Máximo de valores do pivô (0 = todos)',
      section: secao,
      display: 'range',
      min: 0,
      max: 50,
      step: 1,
      default: 0,
    },
    separadorDeRotuloDePivo: {
      type: 'string',
      label: 'Separador quando há vários pivôs',
      section: secao,
      default: ' / ',
      placeholder: ' / ',
    },
  };
}

/** Dados: ordenação, Top N, agrupar pequenos, nulos. */
export function blocoDeDados(opcoes = {}) {
  const { secao = 'Dados', comTopN = true, comOrdenacao = true, comNulos = true } = opcoes;
  const bloco = {};
  if (comOrdenacao) {
    bloco.ordenacao = {
      type: 'string',
      label: 'Ordenar por',
      section: secao,
      display: 'select',
      default: 'valorDesc',
      values: listaDeValores([
        { rotulo: 'Valor (maior primeiro)', valor: 'valorDesc' },
        { rotulo: 'Valor (menor primeiro)', valor: 'valorAsc' },
        { rotulo: 'Rótulo (A→Z)', valor: 'rotuloAsc' },
        { rotulo: 'Rótulo (Z→A)', valor: 'rotuloDesc' },
        { rotulo: 'Como veio da consulta', valor: 'original' },
      ]),
    };
  }
  if (comTopN) {
    bloco.topN = {
      type: 'number',
      label: 'Mostrar só os N primeiros (0 = todos)',
      section: secao,
      display: 'range',
      min: 0,
      max: 100,
      step: 1,
      default: 0,
    };
    bloco.agruparRestoComoOutros = {
      type: 'boolean',
      label: 'Agrupar o restante como "Outros"',
      section: secao,
      default: true,
    };
    bloco.rotuloDeOutros = {
      type: 'string',
      label: 'Nome do grupo "Outros"',
      section: secao,
      default: 'Outros',
    };
    bloco.valorMinimo = {
      type: 'number',
      label: 'Ignorar valores abaixo de (vazio = sem filtro)',
      section: secao,
    };
  }
  if (comNulos) {
    bloco.tratamentoDeNulos = {
      type: 'string',
      label: 'Valores nulos',
      section: secao,
      display: 'select',
      default: 'omitir',
      values: listaDeValores([
        { rotulo: 'Omitir a linha', valor: 'omitir' },
        { rotulo: 'Tratar como zero', valor: 'zero' },
        { rotulo: 'Manter como vazio', valor: 'manter' },
        { rotulo: 'Interpolar (séries temporais)', valor: 'interpolar' },
      ]),
    };
    bloco.textoParaNulo = {
      type: 'string',
      label: 'Texto para valor nulo',
      section: secao,
      default: '∅',
      placeholder: '∅',
    };
  }
  return bloco;
}

/** Eixos (gera um conjunto por eixo pedido: 'x' e/ou 'y'). */
export function blocoDeEixos(opcoes = {}) {
  const { secao = 'Eixos', eixos = ['x', 'y'], comEixoSecundario = false } = opcoes;
  const bloco = {};
  const nomes = { x: 'X (horizontal)', y: 'Y (vertical)' };

  for (const eixo of eixos) {
    const P = eixo.toUpperCase();
    bloco[`mostrarEixo${P}`] = {
      type: 'boolean',
      label: `Mostrar eixo ${nomes[eixo] || P}`,
      section: secao,
      default: true,
    };
    bloco[`tituloEixo${P}`] = {
      type: 'string',
      label: `Título do eixo ${P}`,
      section: secao,
      default: '',
      placeholder: 'em branco = nome do campo',
    };
    bloco[`escalaEixo${P}`] = {
      type: 'string',
      label: `Escala do eixo ${P}`,
      section: secao,
      display: 'select',
      default: 'linear',
      values: listaDeValores([
        { rotulo: 'Linear', valor: 'linear' },
        { rotulo: 'Logarítmica', valor: 'log' },
        { rotulo: 'Raiz quadrada', valor: 'raiz' },
      ]),
    };
    bloco[`minimoEixo${P}`] = {
      type: 'number',
      label: `Mínimo do eixo ${P} (vazio = automático)`,
      section: secao,
      display_size: 'half',
    };
    bloco[`maximoEixo${P}`] = {
      type: 'number',
      label: `Máximo do eixo ${P} (vazio = automático)`,
      section: secao,
      display_size: 'half',
    };
    bloco[`inverterEixo${P}`] = {
      type: 'boolean',
      label: `Inverter eixo ${P}`,
      section: secao,
      default: false,
    };
    bloco[`gradeEixo${P}`] = {
      type: 'boolean',
      label: `Linhas de grade no eixo ${P}`,
      section: secao,
      default: eixo === 'y',
    };
    bloco[`rotacaoRotuloEixo${P}`] = {
      type: 'number',
      label: `Rotação dos rótulos do eixo ${P} (graus)`,
      section: secao,
      display: 'range',
      min: -90,
      max: 90,
      step: 15,
      default: eixo === 'x' ? 0 : 0,
    };
  }

  if (comEixoSecundario) {
    bloco.usarEixoSecundario = {
      type: 'boolean',
      label: 'Usar eixo Y secundário para a última série',
      section: secao,
      default: false,
    };
  }

  // Formato numérico dos eixos (vale para os dois).
  bloco.formatoDoEixo = {
    type: 'string',
    label: 'Formato dos números nos eixos',
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
  bloco.casasDecimaisDoEixo = {
    type: 'number',
    label: 'Casas decimais nos eixos',
    section: secao,
    display: 'range',
    min: 0,
    max: 6,
    step: 1,
    default: 1,
  };

  return bloco;
}

/** Rótulos de dados. */
export function blocoDeRotulos(opcoes = {}) {
  const { secao = 'Rótulos', padraoVisivel = true, comPosicao = true, comValor = true } = opcoes;
  const bloco = {
    mostrarRotulos: {
      type: 'boolean',
      label: 'Mostrar rótulos',
      section: secao,
      default: padraoVisivel,
    },
    tamanhoDoRotulo: {
      type: 'number',
      label: 'Tamanho do rótulo (px)',
      section: secao,
      display: 'range',
      min: 7,
      max: 28,
      step: 1,
      default: 11,
    },
    corDoRotulo: {
      type: 'string',
      label: 'Cor do rótulo (vazio = automática)',
      section: secao,
      display: 'color',
      default: '',
    },
    negritoNoRotulo: { type: 'boolean', label: 'Rótulo em negrito', section: secao, default: false },
    rotacaoDoRotulo: {
      type: 'number',
      label: 'Rotação do rótulo (graus)',
      section: secao,
      display: 'range',
      min: -90,
      max: 90,
      step: 15,
      default: 0,
    },
    evitarColisaoDeRotulos: {
      type: 'boolean',
      label: 'Esconder rótulos que se sobrepõem',
      section: secao,
      default: true,
    },
    truncarRotulo: {
      type: 'number',
      label: 'Truncar rótulo com mais de N caracteres (0 = não truncar)',
      section: secao,
      display: 'range',
      min: 0,
      max: 60,
      step: 1,
      default: 0,
    },
  };
  if (comPosicao) {
    bloco.posicaoDoRotulo = {
      type: 'string',
      label: 'Posição do rótulo',
      section: secao,
      display: 'select',
      default: 'auto',
      values: listaDeValores([
        { rotulo: 'Automática', valor: 'auto' },
        { rotulo: 'Dentro', valor: 'dentro' },
        { rotulo: 'Fora', valor: 'fora' },
        { rotulo: 'Centro', valor: 'centro' },
        { rotulo: 'Fora com linha-guia', valor: 'foraComLinha' },
      ]),
    };
  }
  if (comValor) {
    bloco.conteudoDoRotulo = {
      type: 'string',
      label: 'O que mostrar no rótulo',
      section: secao,
      display: 'select',
      default: 'valor',
      values: listaDeValores([
        { rotulo: 'Valor', valor: 'valor' },
        { rotulo: 'Nome', valor: 'nome' },
        { rotulo: 'Nome e valor', valor: 'nomeValor' },
        { rotulo: 'Percentual do total', valor: 'percentual' },
        { rotulo: 'Valor e percentual', valor: 'valorPercentual' },
      ]),
    };
    bloco.formatoDoRotulo = {
      type: 'string',
      label: 'Formato do número no rótulo',
      section: secao,
      display: 'select',
      default: 'auto',
      values: listaDeValores([
        { rotulo: 'Automático (usa o do campo)', valor: 'auto' },
        { rotulo: 'Número', valor: 'numero' },
        { rotulo: 'Compacto (K, M, B)', valor: 'compacto' },
        { rotulo: 'Moeda', valor: 'moeda' },
        { rotulo: 'Percentual', valor: 'percentual' },
      ]),
    };
    bloco.casasDecimaisDoRotulo = {
      type: 'number',
      label: 'Casas decimais no rótulo',
      section: secao,
      display: 'range',
      min: 0,
      max: 6,
      step: 1,
      default: 1,
    };
  }
  return bloco;
}

/** Legenda. */
export function blocoDeLegenda(opcoes = {}) {
  const { secao = 'Legenda', padraoVisivel = true } = opcoes;
  return {
    mostrarLegenda: {
      type: 'boolean',
      label: 'Mostrar legenda',
      section: secao,
      default: padraoVisivel,
    },
    posicaoDaLegenda: {
      type: 'string',
      label: 'Posição da legenda',
      section: secao,
      display: 'select',
      default: 'direita',
      values: listaDeValores([
        { rotulo: 'Direita', valor: 'direita' },
        { rotulo: 'Esquerda', valor: 'esquerda' },
        { rotulo: 'Acima', valor: 'acima' },
        { rotulo: 'Abaixo', valor: 'abaixo' },
      ]),
    },
    legendaInterativa: {
      type: 'boolean',
      label: 'Clicar na legenda liga/desliga a série',
      section: secao,
      default: true,
    },
    mostrarValoresNaLegenda: {
      type: 'boolean',
      label: 'Mostrar valores na legenda',
      section: secao,
      default: false,
    },
    tamanhoDaLegenda: {
      type: 'number',
      label: 'Tamanho do texto da legenda (px)',
      section: secao,
      display: 'range',
      min: 8,
      max: 20,
      step: 1,
      default: 11,
    },
  };
}

/** Linhas de referência e anotações. */
export function blocoDeReferencias(opcoes = {}) {
  const { secao = 'Referências', quantidade = 2 } = opcoes;
  const bloco = {};
  for (let i = 1; i <= quantidade; i++) {
    bloco[`referencia${i}Ativa`] = {
      type: 'boolean',
      label: `Linha de referência ${i}`,
      section: secao,
      default: false,
    };
    bloco[`referencia${i}Tipo`] = {
      type: 'string',
      label: `Referência ${i}: base`,
      section: secao,
      display: 'select',
      default: 'media',
      values: listaDeValores([
        { rotulo: 'Média', valor: 'media' },
        { rotulo: 'Mediana', valor: 'mediana' },
        { rotulo: 'Percentil', valor: 'percentil' },
        { rotulo: 'Valor fixo', valor: 'fixo' },
      ]),
    };
    bloco[`referencia${i}Valor`] = {
      type: 'number',
      label: `Referência ${i}: valor (fixo) ou percentil (0-100)`,
      section: secao,
      display_size: 'half',
    };
    bloco[`referencia${i}Cor`] = {
      type: 'string',
      label: `Referência ${i}: cor`,
      section: secao,
      display: 'color',
      default: '#DC2626',
      display_size: 'half',
    };
    bloco[`referencia${i}Rotulo`] = {
      type: 'string',
      label: `Referência ${i}: rótulo`,
      section: secao,
      default: '',
    };
  }
  return bloco;
}

/** Tooltip. */
export function blocoDeTooltip(opcoes = {}) {
  const { secao = 'Interação' } = opcoes;
  return {
    mostrarTooltip: { type: 'boolean', label: 'Mostrar tooltip', section: secao, default: true },
    tooltipPersonalizado: {
      type: 'boolean',
      label: 'Usar tooltip personalizado',
      section: secao,
      default: false,
    },
    modeloDeTooltip: {
      type: 'string',
      label: 'Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão',
      section: secao,
      default: '',
      placeholder: '<b>{{categoria}}</b><br>{{valor}}',
    },
    tooltipComNomeCompleto: {
      type: 'boolean',
      label: 'Mostrar nome completo do campo no tooltip',
      section: secao,
      default: false,
    },
    tooltipComValorBruto: {
      type: 'boolean',
      label: 'Mostrar também o valor sem formatação',
      section: secao,
      default: false,
    },
    // Novas nas correções v2 (módulo 2.3).
    acaoDoClique: {
      type: 'string',
      label: 'Ação do clique (Shift+clique sempre fixa; Esc solta)',
      section: secao,
      display: 'select',
      default: 'drill',
      values: listaDeValores([
        { rotulo: 'Drill do Looker', valor: 'drill' },
        { rotulo: 'Fixar tooltip', valor: 'fixar' },
        { rotulo: 'Nenhuma', valor: 'nenhuma' },
      ]),
    },
    permitirHtmlDoLooker: {
      type: 'boolean',
      label: 'Permitir HTML do Looker nas variáveis do tooltip',
      section: secao,
      default: false,
    },
    corDeFundoDoTooltip: {
      type: 'string',
      label: 'Cor de fundo do tooltip (vazio = do tema)',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    },
    corDaBordaDoTooltip: {
      type: 'string',
      label: 'Cor da borda do tooltip',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    },
    corDoTextoDoTooltip: {
      type: 'string',
      label: 'Cor do texto do tooltip (vazio = do tema)',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    },
    tamanhoDoTooltip: {
      type: 'number',
      label: 'Tamanho da fonte do tooltip (px)',
      section: secao,
      display: 'range',
      min: 9,
      max: 20,
      step: 1,
      default: 11,
      display_size: 'half',
    },
  };
}

/** Animação. */
export function blocoDeAnimacao(opcoes = {}) {
  const { secao = 'Animação', padraoAtiva = true, duracaoPadrao = 600 } = opcoes;
  return {
    animacaoAtiva: {
      type: 'boolean',
      label: 'Ativar animações',
      section: secao,
      default: padraoAtiva,
    },
    duracaoDaAnimacao: {
      type: 'number',
      label: 'Duração (ms)',
      section: secao,
      display: 'range',
      min: 0,
      max: 3000,
      step: 50,
      default: duracaoPadrao,
    },
    atrasoDaAnimacao: {
      type: 'number',
      label: 'Atraso inicial (ms)',
      section: secao,
      display: 'range',
      min: 0,
      max: 2000,
      step: 50,
      default: 0,
    },
    cascataDaAnimacao: {
      type: 'number',
      label: 'Cascata entre itens (ms)',
      section: secao,
      display: 'range',
      min: 0,
      max: 200,
      step: 5,
      default: 20,
    },
    suavizacaoDaAnimacao: {
      type: 'string',
      label: 'Curva da animação',
      section: secao,
      display: 'select',
      default: 'saida',
      values: listaDeValores([
        { rotulo: 'Linear', valor: 'linear' },
        { rotulo: 'Suave na saída', valor: 'saida' },
        { rotulo: 'Suave na entrada', valor: 'entrada' },
        { rotulo: 'Suave nos dois lados', valor: 'ambos' },
        { rotulo: 'Elástica', valor: 'elastica' },
        { rotulo: 'Com quique', valor: 'quique' },
      ]),
    },
    quandoAnimar: {
      type: 'string',
      label: 'Quando animar',
      section: secao,
      display: 'select',
      default: 'sempre',
      values: listaDeValores([
        { rotulo: 'A cada atualização', valor: 'sempre' },
        { rotulo: 'Só na primeira carga', valor: 'primeira' },
      ]),
    },
    contadorAnimado: {
      type: 'boolean',
      label: 'Números sobem/descem até o valor (contador)',
      section: secao,
      default: true,
    },
  };
}

/** Interação: zoom, pan, brush, busca, seleção, drill. */
export function blocoDeInteracao(opcoes = {}) {
  const {
    secao = 'Interação',
    comZoom = true,
    comBrush = false,
    comBusca = false,
    comSelecao = true,
  } = opcoes;
  const bloco = {
    permitirDrill: {
      type: 'boolean',
      label: 'Clique abre o drill do Looker',
      section: secao,
      default: true,
    },
    destacarAoPassarMouse: {
      type: 'boolean',
      label: 'Destacar ao passar o mouse',
      section: secao,
      default: true,
    },
  };
  if (comZoom) {
    bloco.permitirZoom = { type: 'boolean', label: 'Permitir zoom', section: secao, default: false };
    bloco.permitirArrastar = {
      type: 'boolean',
      label: 'Permitir arrastar (pan)',
      section: secao,
      default: false,
    };
  }
  if (comBrush) {
    bloco.permitirBrush = {
      type: 'boolean',
      label: 'Permitir seleção por área (brush)',
      section: secao,
      default: false,
    };
  }
  if (comBusca) {
    bloco.mostrarBusca = {
      type: 'boolean',
      label: 'Mostrar caixa de busca',
      section: secao,
      default: false,
    };
  }
  if (comSelecao) {
    bloco.permitirSelecao = {
      type: 'boolean',
      label: 'Permitir selecionar itens (clique)',
      section: secao,
      default: true,
    };
    bloco.usarCrossfilter = {
      type: 'boolean',
      label: 'Usar cross-filter do Looker quando disponível',
      section: secao,
      default: false,
    };
  }
  return bloco;
}

/** Tema e tipografia. */
export function blocoDeTema(opcoes = {}) {
  const { secao = 'Tema' } = opcoes;
  return {
    tema: {
      type: 'string',
      label: 'Tema',
      section: secao,
      display: 'select',
      default: 'claro',
      values: listaDeValores([
        { rotulo: 'Claro', valor: 'claro' },
        { rotulo: 'Escuro', valor: 'escuro' },
        { rotulo: 'Personalizado', valor: 'personalizado' },
      ]),
    },
    corDeFundo: {
      type: 'string',
      label: 'Cor de fundo (vazio = do tema)',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    },
    corDoTexto: {
      type: 'string',
      label: 'Cor do texto (tema personalizado)',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    },
    corDaBorda: {
      type: 'string',
      label: 'Cor das bordas (tema personalizado)',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    },
    corDaGrade: {
      type: 'string',
      label: 'Cor das linhas de grade (tema personalizado)',
      section: secao,
      display: 'color',
      default: '',
      display_size: 'half',
    },
    familiaDaFonte: {
      type: 'string',
      label: 'Fonte',
      section: secao,
      display: 'select',
      default: 'sistema',
      values: listaDeValores([
        { rotulo: 'Do sistema', valor: 'sistema' },
        { rotulo: 'Monoespaçada', valor: 'monoespacada' },
        { rotulo: 'Serifada', valor: 'serifada' },
      ]),
    },
    tamanhoDaFonte: {
      type: 'number',
      label: 'Tamanho base da fonte (px)',
      section: secao,
      display: 'range',
      min: 8,
      max: 24,
      step: 1,
      default: 12,
    },
    titulo: { type: 'string', label: 'Título', section: secao, default: '' },
    subtitulo: { type: 'string', label: 'Subtítulo', section: secao, default: '' },
    textoSemDados: {
      type: 'string',
      label: 'Mensagem quando não há dados',
      section: secao,
      default: 'Sem dados para exibir',
    },
  };
}

/** Avançado: debug e import/export de configuração. */
export function blocoAvancado(opcoes = {}) {
  const { secao = 'Avançado' } = opcoes;
  return {
    modoDebug: {
      type: 'boolean',
      label: 'Modo debug (escreve no console a estrutura dos dados)',
      section: secao,
      default: false,
    },
    configuracaoJson: {
      type: 'string',
      label: 'Configuração em JSON (cole aqui para importar)',
      section: secao,
      default: '',
      placeholder: '{"paleta":"okabeIto","tema":"escuro"}',
    },
    aplicarConfiguracaoJson: {
      type: 'boolean',
      label: 'Aplicar o JSON acima por cima das opções',
      section: secao,
      default: false,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Opções dinâmicas (uma por campo / por série)                        */
/* ------------------------------------------------------------------ */

/**
 * Gera uma opção de COR por item (série, categoria, conjunto...).
 * @param {Array<{chave:string, rotulo:string}>} itens
 * @param {{prefixo?:string, secao?:string, cores?:string[]}} opcoes
 */
export function opcoesDeCorPorItem(itens, opcoes = {}) {
  const { prefixo = 'cor_', secao = 'Cores', cores = [] } = opcoes;
  const saida = {};
  itens.forEach((item, i) => {
    saida[`${prefixo}${sanitizarChave(item.chave)}`] = {
      type: 'string',
      label: `Cor — ${item.rotulo}`,
      section: secao,
      display: 'color',
      default: cores[i % Math.max(1, cores.length)] || '#4276BE',
    };
  });
  return saida;
}

/**
 * Gera um SELECT para escolher um campo da consulta.
 * @param {Array<{nome:string, rotulo:string}>} campos
 */
export function opcaoDeEscolhaDeCampo(chave, rotulo, campos, opcoes = {}) {
  const { secao = 'Dados', incluirNenhum = false, padrao = null } = opcoes;
  const valores = [];
  if (incluirNenhum) valores.push({ '(nenhum)': '' });
  for (const campo of campos) valores.push({ [campo.rotulo]: campo.nome });
  return {
    [chave]: {
      type: 'string',
      label: rotulo,
      section: secao,
      display: 'select',
      default: padrao !== null ? padrao : (campos[0] && campos[0].nome) || '',
      values: valores,
    },
  };
}

/**
 * Troca o `default` de opções já montadas.
 *
 * Serve para um gráfico reaproveitar um bloco do kit mudando só o valor
 * inicial — uma matriz 2x2 quer o corte no ponto médio, a BCG quer o eixo X
 * em log e invertido. Mexer no bloco original quebraria os outros gráficos.
 * Avisa no console se a chave não existe, que é sempre erro de digitação.
 */
export function comDefaults(opcoes, novosPadroes) {
  const saida = Object.assign({}, opcoes);
  for (const [chave, valor] of Object.entries(novosPadroes)) {
    if (!saida[chave]) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`comDefaults: a opção "${chave}" não existe neste gráfico.`);
      }
      continue;
    }
    saida[chave] = Object.assign({}, saida[chave], { default: valor });
  }
  return saida;
}

/** Normaliza uma chave para usar em nome de opção (sem espaço/acento). */
export function sanitizarChave(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/**
 * Normaliza o `config` que o Looker entrega (módulo 2.1 das correções).
 *
 * O Looker real NÃO garante que todas as chaves registradas venham no
 * config: num dashboard salvo antes de uma opção existir, ou quando o
 * usuário nunca mexeu nela, a chave pode faltar. E valores podem chegar
 * como texto ("14", "true"). Aqui:
 *   - chave ausente (undefined) recebe o `default` declarado;
 *   - `type: 'number'` em texto vira número (texto vazio vira null);
 *   - `type: 'boolean'` em texto ("true"/"false") vira boolean;
 *   - `false`, `0` e '' que o usuário escolheu são PRESERVADOS.
 * Chaves que não são opções registradas passam intactas.
 */
export function normalizarConfig(config, opcoes) {
  const saida = Object.assign({}, config || {});
  for (const [chave, opcao] of Object.entries(opcoes || {})) {
    if (!opcao || typeof opcao !== 'object') continue;
    let v = saida[chave];
    if (v === undefined) {
      if (opcao.default !== undefined) saida[chave] = opcao.default;
      continue;
    }
    if (opcao.type === 'number' && typeof v === 'string') {
      const t = v.trim();
      const n = Number(t);
      saida[chave] = t === '' ? null : Number.isFinite(n) ? n : opcao.default !== undefined ? opcao.default : null;
    } else if (opcao.type === 'boolean' && typeof v === 'string') {
      v = v.trim().toLowerCase();
      if (v === 'true') saida[chave] = true;
      else if (v === 'false' || v === '') saida[chave] = false;
    }
  }
  return saida;
}

/**
 * Relatório do modo debug: chaves registradas no painel x chaves que
 * chegaram no config. É o que permite ver, no Looker real, se uma opção
 * "não tem efeito" porque o valor nem chega.
 */
export function compararChaves(config, opcoes) {
  const registradas = Object.keys(opcoes || {});
  const recebidas = Object.keys(config || {});
  const setRecebidas = new Set(recebidas);
  const setRegistradas = new Set(registradas);
  return {
    registradas: registradas.length,
    recebidas: recebidas.length,
    faltandoNoConfig: registradas.filter((k) => !setRecebidas.has(k)),
    foraDoPainel: recebidas.filter((k) => !setRegistradas.has(k)),
  };
}

/**
 * Aplica o JSON de configuração colado pelo usuário (bloco Avançado) por
 * cima da config atual. Nunca usa eval: só `JSON.parse`.
 */
export function aplicarConfiguracaoJson(config) {
  if (!config || !config.aplicarConfiguracaoJson || !config.configuracaoJson) return config;
  try {
    const extra = JSON.parse(config.configuracaoJson);
    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
      return Object.assign({}, config, extra);
    }
  } catch (e) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[biblioteca-looker] JSON de configuração inválido; ignorado.', e && e.message);
    }
  }
  return config;
}
