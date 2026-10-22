# MANIFEST — visualizações da biblioteca

Gerado automaticamente pelo build em 2026-10-22 02:34:01 (commit `0c7528d`).

## Como cadastrar no Looker

Admin > Visualizations > Add Visualization:

- **ID**: o da tabela abaixo
- **Label**: o da tabela abaixo
- **Main**: a URL do arquivo (modelo na última coluna)
- **Dependencies**: **VAZIO** — todos os arquivos são autocontidos

Troque `COMMIT` pelo hash do commit que você quer fixar (nunca use `@main`: assim a visualização não muda sozinha depois de testada).

| ID | Label | Arquivo | Dependencies | Como montar o Explore | URL para o campo Main |
|---|---|---|---|---|---|
| `tabela_completa` | Tabela Completa | `dist/tabela_completa.js` | (vazio) | 1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/tabela_completa.js` |
| `diagrama_venn` | Diagrama de Venn | `dist/diagrama_venn.js` | (vazio) | Uma dimensão com os conjuntos ("A", "A,B"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/diagrama_venn.js` |
| `quadrant_scatter` | Dispersão com Quadrantes | `dist/quadrant_scatter.js` | (vazio) | 1 dimensão (o nome de cada ponto) e pelo menos 2 medidas (eixos X e Y). Opcionalmente mais medidas para tamanho e cor. Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/quadrant_scatter.js` |
| `matriz_2x2` | Matriz 2x2 | `dist/matriz_2x2.js` | (vazio) | 1 dimensão (o nome do item) e 2 medidas (os dois eixos). Opcionalmente uma terceira para o tamanho. Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/matriz_2x2.js` |
| `matriz_bcg` | Matriz BCG | `dist/matriz_bcg.js` | (vazio) | 1 dimensão (o produto ou unidade), 1 medida de participação (eixo X), 1 de crescimento (eixo Y) e opcionalmente 1 de receita (tamanho). Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/matriz_bcg.js` |
| `theme_river` | ThemeRiver | `dist/theme_river.js` | (vazio) | 1 dimensao no eixo (de preferencia temporal) e 1 medida. As series vem do pivo, de uma 2a dimensao ou de varias medidas. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/theme_river.js` |
| `funil_variacoes` | Funis (Estilos) | `dist/funil_variacoes.js` | (vazio) | 1 dimensao com as etapas e 1 medida, ou varias medidas (uma por etapa). Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/funil_variacoes.js` |
| `funil_comparativo` | Funil Comparativo | `dist/funil_comparativo.js` | (vazio) | 1 dimensao com as etapas, 1 medida e um pivo (ou uma 2a dimensao) com os segmentos. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/funil_comparativo.js` |
| `gauge_variacoes` | Medidores (Estilos) | `dist/gauge_variacoes.js` | (vazio) | 1 medida (o valor). Opcionalmente uma segunda medida para o alvo. Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/gauge_variacoes.js` |
| `gauge_grid` | Medidores em Grade | `dist/gauge_grid.js` | (vazio) | 1 dimensao (um medidor por valor) e 1 medida. Opcionalmente uma segunda medida para o alvo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/gauge_grid.js` |
| `arvore_radial` | Árvore Radial | `dist/arvore_radial.js` | (vazio) | Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/arvore_radial.js` |
| `arvores_multiplas` | Múltiplas Árvores | `dist/arvores_multiplas.js` | (vazio) | Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/arvores_multiplas.js` |

## Detalhes por visualização

### Tabela Completa (`tabela_completa`)

Tabela com pivôs agrupados, agrupamento de linhas, formatação condicional, tipos de célula (barras, sparklines, badges) e campos animados.

- **Tier**: 1
- **Explore**: 1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 170.3 KB

### Diagrama de Venn (`diagrama_venn`)

Diagrama de Venn de 2 a 5 conjuntos, lendo três formatos de dados (uma linha por região, uma linha por item e conjunto, ou colunas sim/não).

- **Tier**: 1
- **Explore**: Uma dimensão com os conjuntos ("A", "A,B"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 131.8 KB

### Dispersão com Quadrantes (`quadrant_scatter`)

Dispersão de duas medidas com linhas divisórias (média, mediana, zero ou valor fixo) partindo o plano em quatro quadrantes nomeáveis. Pontos em canvas, eixos e rótulos em SVG.

- **Tier**: 1
- **Explore**: 1 dimensão (o nome de cada ponto) e pelo menos 2 medidas (eixos X e Y). Opcionalmente mais medidas para tamanho e cor. Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 173.9 KB

### Matriz 2x2 (`matriz_2x2`)

Matriz de decisão 2x2: duas medidas nos eixos, corte no ponto médio, quadrantes nomeáveis e todos os itens rotulados.

- **Tier**: 1
- **Explore**: 1 dimensão (o nome do item) e 2 medidas (os dois eixos). Opcionalmente uma terceira para o tamanho. Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 174.7 KB

### Matriz BCG (`matriz_bcg`)

Matriz crescimento x participação do BCG: eixo X em log e invertido (participação alta à esquerda), corte em 1, bolhas por receita e os quatro nomes clássicos.

- **Tier**: 1
- **Explore**: 1 dimensão (o produto ou unidade), 1 medida de participação (eixo X), 1 de crescimento (eixo Y) e opcionalmente 1 de receita (tamanho). Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 176.7 KB

### ThemeRiver (`theme_river`)

Streamgraph: areas empilhadas com base ondulada (wiggle/silhouette) mostrando composicao ao longo do tempo. Series vindas do pivo, da 2a dimensao ou de varias medidas.

- **Tier**: 1
- **Explore**: 1 dimensao no eixo (de preferencia temporal) e 1 medida. As series vem do pivo, de uma 2a dimensao ou de varias medidas.
- **Aceita pivô**: sim
- **Tamanho do bundle**: 196.2 KB

### Funis (Estilos) (`funil_variacoes`)

Funil em cinco estilos (classico, piramide, barras centralizadas, barras a esquerda e area continua) com taxa de conversao entre etapas.

- **Tier**: 1
- **Explore**: 1 dimensao com as etapas e 1 medida, ou varias medidas (uma por etapa). Nao aceita pivo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 118.7 KB

### Funil Comparativo (`funil_comparativo`)

Varios funis lado a lado, um por segmento, compartilhando a mesma escala para a largura ser comparavel entre segmentos.

- **Tier**: 1
- **Explore**: 1 dimensao com as etapas, 1 medida e um pivo (ou uma 2a dimensao) com os segmentos.
- **Aceita pivô**: sim
- **Tamanho do bundle**: 130.7 KB

### Medidores (Estilos) (`gauge_variacoes`)

Um medidor em cinco estilos (arco de 270 graus, semicirculo, circulo completo, barra linear e bullet chart), com faixas coloridas, alvo e agulha.

- **Tier**: 1
- **Explore**: 1 medida (o valor). Opcionalmente uma segunda medida para o alvo. Nao aceita pivo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 124.3 KB

### Medidores em Grade (`gauge_grid`)

Um medidor pequeno por item de uma dimensao, numa grade responsiva, todos compartilhando a mesma escala para serem comparaveis.

- **Tier**: 1
- **Explore**: 1 dimensao (um medidor por valor) e 1 medida. Opcionalmente uma segunda medida para o alvo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 126.9 KB

### Árvore Radial (`arvore_radial`)

Hierarquia inteira num circulo: raiz no centro, um anel por nivel e as folhas na borda com os nomes acompanhando o raio.

- **Tier**: 1
- **Explore**: Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho.
- **Aceita pivô**: não
- **Tamanho do bundle**: 138.0 KB

### Múltiplas Árvores (`arvores_multiplas`)

Uma arvore pequena por ramo de primeiro nivel, lado a lado, para comparar a forma de cada ramo.

- **Tier**: 1
- **Explore**: Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho.
- **Aceita pivô**: não
- **Tamanho do bundle**: 145.5 KB
