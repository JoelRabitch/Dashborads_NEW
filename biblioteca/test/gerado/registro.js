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
  }
];
