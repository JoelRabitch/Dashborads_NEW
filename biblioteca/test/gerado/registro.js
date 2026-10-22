/* Gerado por build.mjs — não edite à mão. */
window.REGISTRO_BL = [
  {
    "id": "tabela_completa",
    "label": "Tabela Completa",
    "tier": 1,
    "arquivo": "../dist/tabela_completa.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "duasDimensoes",
      "comPivo",
      "temporal",
      "vazio",
      "somenteNulos",
      "rotulosLongos",
      "grande5k"
    ],
    "explore": "1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis)."
  },
  {
    "id": "diagrama_venn",
    "label": "Diagrama de Venn",
    "tier": 1,
    "arquivo": "../dist/diagrama_venn.js",
    "existe": true,
    "fixtures": [
      "conjuntos2",
      "conjuntos3",
      "conjuntos4",
      "conjuntos5",
      "conjuntosPorItem",
      "conjuntosBooleanos"
    ],
    "explore": "Uma dimensão com os conjuntos (\"A\", \"A,B\"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô."
  },
  {
    "id": "quadrant_scatter",
    "label": "Dispersão com Quadrantes",
    "tier": 1,
    "arquivo": "../dist/quadrant_scatter.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "grande5k",
      "ohlc",
      "somenteNulos",
      "vazio"
    ],
    "explore": "1 dimensão (o nome de cada ponto) e pelo menos 2 medidas (eixos X e Y). Opcionalmente mais medidas para tamanho e cor. Não aceita pivô."
  },
  {
    "id": "matriz_2x2",
    "label": "Matriz 2x2",
    "tier": 1,
    "arquivo": "../dist/matriz_2x2.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "ohlc",
      "somenteNulos",
      "vazio"
    ],
    "explore": "1 dimensão (o nome do item) e 2 medidas (os dois eixos). Opcionalmente uma terceira para o tamanho. Não aceita pivô."
  },
  {
    "id": "matriz_bcg",
    "label": "Matriz BCG",
    "tier": 1,
    "arquivo": "../dist/matriz_bcg.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "ohlc",
      "somenteNulos",
      "vazio"
    ],
    "explore": "1 dimensão (o produto ou unidade), 1 medida de participação (eixo X), 1 de crescimento (eixo Y) e opcionalmente 1 de receita (tamanho). Não aceita pivô."
  },
  {
    "id": "theme_river",
    "label": "ThemeRiver",
    "tier": 1,
    "arquivo": "../dist/theme_river.js",
    "existe": true,
    "fixtures": [
      "comPivo",
      "duasDimensoes",
      "temporal",
      "semPivo",
      "vazio",
      "somenteNulos"
    ],
    "explore": "1 dimensao no eixo (de preferencia temporal) e 1 medida. As series vem do pivo, de uma 2a dimensao ou de varias medidas."
  },
  {
    "id": "funil_variacoes",
    "label": "Funis (Estilos)",
    "tier": 1,
    "arquivo": "../dist/funil_variacoes.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "rotulosLongos",
      "somenteNulos",
      "vazio"
    ],
    "explore": "1 dimensao com as etapas e 1 medida, ou varias medidas (uma por etapa). Nao aceita pivo."
  },
  {
    "id": "funil_comparativo",
    "label": "Funil Comparativo",
    "tier": 1,
    "arquivo": "../dist/funil_comparativo.js",
    "existe": true,
    "fixtures": [
      "comPivo",
      "duasDimensoes",
      "vazio"
    ],
    "explore": "1 dimensao com as etapas, 1 medida e um pivo (ou uma 2a dimensao) com os segmentos."
  },
  {
    "id": "gauge_variacoes",
    "label": "Medidores (Estilos)",
    "tier": 1,
    "arquivo": "../dist/gauge_variacoes.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "somenteNulos",
      "vazio"
    ],
    "explore": "1 medida (o valor). Opcionalmente uma segunda medida para o alvo. Nao aceita pivo."
  },
  {
    "id": "gauge_grid",
    "label": "Medidores em Grade",
    "tier": 1,
    "arquivo": "../dist/gauge_grid.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "rotulosLongos",
      "somenteNulos",
      "vazio"
    ],
    "explore": "1 dimensao (um medidor por valor) e 1 medida. Opcionalmente uma segunda medida para o alvo."
  },
  {
    "id": "arvore_radial",
    "label": "Árvore Radial",
    "tier": 1,
    "arquivo": "../dist/arvore_radial.js",
    "existe": true,
    "fixtures": [
      "hierarquia",
      "paiFilho",
      "duasDimensoes",
      "semPivo",
      "vazio"
    ],
    "explore": "Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho."
  },
  {
    "id": "arvores_multiplas",
    "label": "Múltiplas Árvores",
    "tier": 1,
    "arquivo": "../dist/arvores_multiplas.js",
    "existe": true,
    "fixtures": [
      "hierarquia",
      "paiFilho",
      "duasDimensoes",
      "vazio"
    ],
    "explore": "Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho."
  },
  {
    "id": "org_chart",
    "label": "Organograma",
    "tier": 1,
    "arquivo": "../dist/org_chart.js",
    "existe": true,
    "fixtures": [
      "paiFilho",
      "hierarquia",
      "duasDimensoes",
      "vazio"
    ],
    "explore": "Um par de campos id/superior (ou varias dimensoes, uma por nivel), mais uma medida opcional para o cartao."
  },
  {
    "id": "upset_plot",
    "label": "UpSet Plot",
    "tier": 1,
    "arquivo": "../dist/upset_plot.js",
    "existe": true,
    "fixtures": [
      "conjuntos3",
      "conjuntos4",
      "conjuntos5",
      "conjuntosPorItem",
      "conjuntosBooleanos",
      "vazio"
    ],
    "explore": "Uma dimensao com os conjuntos, ou duas dimensoes (item e conjunto), ou varias colunas sim/nao."
  },
  {
    "id": "candlestick_ohlc",
    "label": "Candlestick / OHLC",
    "tier": 2,
    "arquivo": "../dist/candlestick_ohlc.js",
    "existe": true,
    "fixtures": [
      "ohlc",
      "vazio"
    ],
    "explore": "1 dimensao temporal e 4 medidas (abertura, maxima, minima, fechamento). Uma 5a medida opcional vira o volume."
  },
  {
    "id": "linha_bandas",
    "label": "Linha com Bandas",
    "tier": 2,
    "arquivo": "../dist/linha_bandas.js",
    "existe": true,
    "fixtures": [
      "ohlc",
      "temporal",
      "comPivo",
      "semPivo",
      "vazio"
    ],
    "explore": "1 dimensao no eixo e 1 ou mais medidas. Com tres medidas a banda e um dado de verdade; nos outros modos ela e calculada e o grafico diz isso na tela."
  },
  {
    "id": "drawdown",
    "label": "Drawdown",
    "tier": 2,
    "arquivo": "../dist/drawdown.js",
    "existe": true,
    "fixtures": [
      "ohlc",
      "temporal",
      "comPivo",
      "vazio"
    ],
    "explore": "1 dimensao temporal ORDENADA e 1 medida. Aceita pivo (uma curva de drawdown por serie)."
  },
  {
    "id": "retorno_acumulado",
    "label": "Retorno Acumulado (Base 100)",
    "tier": 2,
    "arquivo": "../dist/retorno_acumulado.js",
    "existe": true,
    "fixtures": [
      "temporal",
      "comPivo",
      "ohlc",
      "vazio"
    ],
    "explore": "1 dimensao temporal ordenada e 1 ou mais medidas. Aceita pivo (uma curva por serie)."
  },
  {
    "id": "fluxo_caixa",
    "label": "Fluxo de Caixa",
    "tier": 2,
    "arquivo": "../dist/fluxo_caixa.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "temporal",
      "ohlc",
      "vazio"
    ],
    "explore": "1 dimensao temporal ordenada e 1 ou 2 medidas (entradas e saidas, ou uma medida com sinal). Nao aceita pivo."
  },
  {
    "id": "pareto",
    "label": "Pareto",
    "tier": 2,
    "arquivo": "../dist/pareto.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "rotulosLongos",
      "grande5k",
      "vazio"
    ],
    "explore": "1 dimensao (as categorias) e 1 medida. Nao aceita pivo."
  },
  {
    "id": "lorenz_gini",
    "label": "Curva de Lorenz / Gini",
    "tier": 2,
    "arquivo": "../dist/lorenz_gini.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "grande5k",
      "rotulosLongos",
      "vazio"
    ],
    "explore": "1 dimensao (as categorias) e 1 medida nao negativa. Nao aceita pivo."
  },
  {
    "id": "treemap_carteira",
    "label": "Treemap de Carteira",
    "tier": 2,
    "arquivo": "../dist/treemap_carteira.js",
    "existe": true,
    "fixtures": [
      "hierarquia",
      "duasDimensoes",
      "semPivo",
      "grande5k",
      "vazio"
    ],
    "explore": "1 ou mais dimensoes (uma por nivel), 1 medida de tamanho e opcionalmente uma segunda medida para a cor."
  },
  {
    "id": "ponte_variacao",
    "label": "Ponte de Variação",
    "tier": 2,
    "arquivo": "../dist/ponte_variacao.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "rotulosLongos",
      "vazio"
    ],
    "explore": "1 dimensao com as etapas (na ordem) e 1 medida com a contribuicao de cada uma. Nao aceita pivo."
  },
  {
    "id": "risco_retorno",
    "label": "Risco x Retorno",
    "tier": 2,
    "arquivo": "../dist/risco_retorno.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "ohlc",
      "grande5k",
      "vazio"
    ],
    "explore": "1 dimensao (o ativo) e 2 medidas (risco e retorno). Opcionalmente uma terceira para o tamanho. Nao aceita pivo."
  },
  {
    "id": "violin",
    "label": "Violin Plot",
    "tier": 3,
    "arquivo": "../dist/violin.js",
    "existe": true,
    "fixtures": [
      "grande5k",
      "conjuntosPorItem",
      "vazio"
    ],
    "explore": "1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria — a consulta nao pode vir agregada a um valor por grupo."
  }
];
