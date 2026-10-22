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
  }
];
