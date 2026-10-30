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
    "id": "grafico_controle",
    "label": "Grafico de Controle",
    "tier": 3,
    "arquivo": "../dist/grafico_controle.js",
    "existe": true,
    "fixtures": [
      "temporal",
      "semPivo",
      "vazio"
    ],
    "explore": "1 dimensao temporal (os periodos, em ordem) e 1 medida."
  },
  {
    "id": "heatmap_denso",
    "label": "Heatmap Denso",
    "tier": 4,
    "arquivo": "../dist/heatmap_denso.js",
    "existe": true,
    "fixtures": [
      "duasDimensoes",
      "comPivo",
      "grande5k",
      "semPivo",
      "vazio"
    ],
    "explore": "2 dimensoes (linhas e colunas) e 1 medida; ou 1 dimensao, 1 pivo e 1 medida."
  },
  {
    "id": "barras_ranking_denso",
    "label": "Barras de Ranking Denso",
    "tier": 4,
    "arquivo": "../dist/barras_ranking_denso.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "grande5k",
      "rotulosLongos",
      "vazio"
    ],
    "explore": "1 dimensao (o nome) e 1 medida (a barra)."
  },
  {
    "id": "dot_plot_denso",
    "label": "Dot Plot Denso",
    "tier": 4,
    "arquivo": "../dist/dot_plot_denso.js",
    "existe": true,
    "fixtures": [
      "semPivo",
      "ohlc",
      "grande5k",
      "rotulosLongos",
      "vazio"
    ],
    "explore": "1 dimensao (o nome) e 1 ou mais medidas."
  },
  {
    "id": "bump_chart",
    "label": "Bump Chart",
    "tier": 4,
    "arquivo": "../dist/bump_chart.js",
    "existe": true,
    "fixtures": [
      "comPivo",
      "duasDimensoes",
      "temporal",
      "vazio"
    ],
    "explore": "1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas)."
  },
  {
    "id": "slope_chart",
    "label": "Slope Chart",
    "tier": 4,
    "arquivo": "../dist/slope_chart.js",
    "existe": true,
    "fixtures": [
      "comPivo",
      "duasDimensoes",
      "temporal",
      "vazio"
    ],
    "explore": "1 dimensao no eixo (usa o primeiro e o ultimo periodo) e varias series (pivo, 2a dimensao ou varias medidas)."
  },
  {
    "id": "bar_race",
    "label": "Bar Chart Race",
    "tier": 5,
    "arquivo": "../dist/bar_race.js",
    "existe": true,
    "fixtures": [
      "comPivo",
      "duasDimensoes",
      "temporal",
      "vazio"
    ],
    "explore": "1 dimensao no eixo (os periodos) e varias series (pivo, 2a dimensao ou varias medidas)."
  },
  {
    "id": "kpi_vivo",
    "label": "KPI Vivo",
    "tier": 5,
    "arquivo": "../dist/kpi_vivo.js",
    "existe": true,
    "fixtures": [
      "temporal",
      "semPivo",
      "grande5k",
      "vazio"
    ],
    "explore": "1 medida. Opcionalmente 1 dimensao de tempo para a comparacao e a sparkline."
  },
  {
    "id": "dumbbell",
    "label": "Halteres",
    "tier": 5,
    "arquivo": "../dist/dumbbell.js",
    "existe": true,
    "fixtures": [
      "ohlc",
      "semPivo",
      "grande5k",
      "vazio"
    ],
    "explore": "1 dimensao (o nome) e 2 medidas (o antes e o depois)."
  },
  {
    "id": "marimekko",
    "label": "Marimekko",
    "tier": 5,
    "arquivo": "../dist/marimekko.js",
    "existe": true,
    "fixtures": [
      "duasDimensoes",
      "hierarquia",
      "grande5k",
      "vazio"
    ],
    "explore": "2 dimensoes (as colunas e o empilhamento) e 1 medida."
  },
  {
    "id": "cartao_multivalor",
    "label": "Cartão Multi-Valores",
    "tier": 1,
    "arquivo": "../dist/cartao_multivalor.js",
    "existe": true,
    "fixtures": [
      "cartaoUnico",
      "cartaoGrade",
      "semPivo",
      "vazio"
    ],
    "explore": "1+ medidas e, se quiser, dimensões de texto. \"Um cartão\" usa a primeira linha (filtre para 1 linha); \"Um cartão por linha\" monta a grade (ex.: uma linha por cliente). Não aceita pivô."
  }
];
