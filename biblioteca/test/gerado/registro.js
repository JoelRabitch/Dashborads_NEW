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
  }
];
