# MANIFEST — visualizações da biblioteca

Gerado automaticamente pelo build em 2026-10-22 18:59:12 (commit `2193742`).

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
| `org_chart` | Organograma | `dist/org_chart.js` | (vazio) | Um par de campos id/superior (ou varias dimensoes, uma por nivel), mais uma medida opcional para o cartao. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/org_chart.js` |
| `upset_plot` | UpSet Plot | `dist/upset_plot.js` | (vazio) | Uma dimensao com os conjuntos, ou duas dimensoes (item e conjunto), ou varias colunas sim/nao. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/upset_plot.js` |
| `candlestick_ohlc` | Candlestick / OHLC | `dist/candlestick_ohlc.js` | (vazio) | 1 dimensao temporal e 4 medidas (abertura, maxima, minima, fechamento). Uma 5a medida opcional vira o volume. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/candlestick_ohlc.js` |
| `linha_bandas` | Linha com Bandas | `dist/linha_bandas.js` | (vazio) | 1 dimensao no eixo e 1 ou mais medidas. Com tres medidas a banda e um dado de verdade; nos outros modos ela e calculada e o grafico diz isso na tela. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/linha_bandas.js` |
| `drawdown` | Drawdown | `dist/drawdown.js` | (vazio) | 1 dimensao temporal ORDENADA e 1 medida. Aceita pivo (uma curva de drawdown por serie). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/drawdown.js` |
| `retorno_acumulado` | Retorno Acumulado (Base 100) | `dist/retorno_acumulado.js` | (vazio) | 1 dimensao temporal ordenada e 1 ou mais medidas. Aceita pivo (uma curva por serie). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/retorno_acumulado.js` |
| `fluxo_caixa` | Fluxo de Caixa | `dist/fluxo_caixa.js` | (vazio) | 1 dimensao temporal ordenada e 1 ou 2 medidas (entradas e saidas, ou uma medida com sinal). Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/fluxo_caixa.js` |
| `pareto` | Pareto | `dist/pareto.js` | (vazio) | 1 dimensao (as categorias) e 1 medida. Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/pareto.js` |
| `lorenz_gini` | Curva de Lorenz / Gini | `dist/lorenz_gini.js` | (vazio) | 1 dimensao (as categorias) e 1 medida nao negativa. Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/lorenz_gini.js` |
| `treemap_carteira` | Treemap de Carteira | `dist/treemap_carteira.js` | (vazio) | 1 ou mais dimensoes (uma por nivel), 1 medida de tamanho e opcionalmente uma segunda medida para a cor. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/treemap_carteira.js` |
| `ponte_variacao` | Ponte de Variação | `dist/ponte_variacao.js` | (vazio) | 1 dimensao com as etapas (na ordem) e 1 medida com a contribuicao de cada uma. Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/ponte_variacao.js` |
| `risco_retorno` | Risco x Retorno | `dist/risco_retorno.js` | (vazio) | 1 dimensao (o ativo) e 2 medidas (risco e retorno). Opcionalmente uma terceira para o tamanho. Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/risco_retorno.js` |
| `violin` | Violin Plot | `dist/violin.js` | (vazio) | 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria — a consulta nao pode vir agregada a um valor por grupo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/violin.js` |
| `ridgeline` | Ridgeline | `dist/ridgeline.js` | (vazio) | 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/ridgeline.js` |
| `beeswarm` | Beeswarm | `dist/beeswarm.js` | (vazio) | 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/beeswarm.js` |
| `grafico_controle` | Grafico de Controle | `dist/grafico_controle.js` | (vazio) | 1 dimensao temporal (os periodos, em ordem) e 1 medida. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/grafico_controle.js` |
| `dispersao_regressao` | Dispersao com Regressao | `dist/dispersao_regressao.js` | (vazio) | 2 medidas (X e Y) e, opcionalmente, 1 dimensao que identifica cada ponto. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/dispersao_regressao.js` |
| `qq_plot` | Q-Q Plot (Normalidade) | `dist/qq_plot.js` | (vazio) | 1 medida com VARIAS linhas (as observacoes). Opcionalmente 1 dimensao que identifica cada ponto. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/qq_plot.js` |
| `densidade_ecdf` | Densidade e ECDF | `dist/densidade_ecdf.js` | (vazio) | 1 medida com VARIAS linhas. Opcionalmente 1 dimensao para comparar distribuicoes. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/densidade_ecdf.js` |
| `intervalo_confianca` | Intervalo de Confianca | `dist/intervalo_confianca.js` | (vazio) | 1 dimensao e 1 medida. Opcionalmente medidas de limite inferior/superior, ou de n e desvio-padrao. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/intervalo_confianca.js` |
| `matriz_dispersao` | Matriz de Dispersao | `dist/matriz_dispersao.js` | (vazio) | 2 ou mais medidas. Opcionalmente 1 dimensao que identifica cada linha. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/matriz_dispersao.js` |
| `correlacao_matriz` | Matriz de Correlacao | `dist/correlacao_matriz.js` | (vazio) | 2 ou mais medidas com VARIAS linhas. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/correlacao_matriz.js` |
| `boxplot_avancado` | Boxplot Avancado | `dist/boxplot_avancado.js` | (vazio) | 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/boxplot_avancado.js` |
| `heatmap_denso` | Heatmap Denso | `dist/heatmap_denso.js` | (vazio) | 2 dimensoes (linhas e colunas) e 1 medida; ou 1 dimensao, 1 pivo e 1 medida. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/heatmap_denso.js` |
| `small_multiples` | Small Multiples | `dist/small_multiples.js` | (vazio) | 1 dimensao no eixo e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/small_multiples.js` |
| `barras_ranking_denso` | Barras de Ranking Denso | `dist/barras_ranking_denso.js` | (vazio) | 1 dimensao (o nome) e 1 medida (a barra). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/barras_ranking_denso.js` |
| `dot_plot_denso` | Dot Plot Denso | `dist/dot_plot_denso.js` | (vazio) | 1 dimensao (o nome) e 1 ou mais medidas. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/dot_plot_denso.js` |
| `parallel_coords` | Coordenadas Paralelas | `dist/parallel_coords.js` | (vazio) | 2 ou mais medidas. Opcionalmente 1 dimensao que identifica cada registro. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/parallel_coords.js` |
| `bump_chart` | Bump Chart | `dist/bump_chart.js` | (vazio) | 1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/bump_chart.js` |
| `slope_chart` | Slope Chart | `dist/slope_chart.js` | (vazio) | 1 dimensao no eixo (usa o primeiro e o ultimo periodo) e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/slope_chart.js` |
| `horizon_chart` | Horizon Chart | `dist/horizon_chart.js` | (vazio) | 1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/horizon_chart.js` |
| `bar_race` | Bar Chart Race | `dist/bar_race.js` | (vazio) | 1 dimensao no eixo (os periodos) e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/bar_race.js` |
| `motion_bubbles` | Bolhas em Movimento | `dist/motion_bubbles.js` | (vazio) | 2 dimensoes (o item e o tempo) e 2 ou mais medidas (X, Y e opcionalmente o tamanho). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/motion_bubbles.js` |
| `kpi_vivo` | KPI Vivo | `dist/kpi_vivo.js` | (vazio) | 1 medida. Opcionalmente 1 dimensao de tempo para a comparacao e a sparkline. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/kpi_vivo.js` |
| `parallel_sets` | Conjuntos Paralelos | `dist/parallel_sets.js` | (vazio) | 2 ou mais dimensoes. Opcionalmente 1 medida para a largura (o padrao e contagem de linhas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/parallel_sets.js` |
| `arc_diagram` | Diagrama de Arcos | `dist/arc_diagram.js` | (vazio) | 2 dimensoes (origem e destino). Opcionalmente 1 medida para o peso da ligacao. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/arc_diagram.js` |

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
- **Tamanho do bundle**: 132.0 KB

### Dispersão com Quadrantes (`quadrant_scatter`)

Dispersão de duas medidas com linhas divisórias (média, mediana, zero ou valor fixo) partindo o plano em quatro quadrantes nomeáveis. Pontos em canvas, eixos e rótulos em SVG.

- **Tier**: 1
- **Explore**: 1 dimensão (o nome de cada ponto) e pelo menos 2 medidas (eixos X e Y). Opcionalmente mais medidas para tamanho e cor. Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 174.4 KB

### Matriz 2x2 (`matriz_2x2`)

Matriz de decisão 2x2: duas medidas nos eixos, corte no ponto médio, quadrantes nomeáveis e todos os itens rotulados.

- **Tier**: 1
- **Explore**: 1 dimensão (o nome do item) e 2 medidas (os dois eixos). Opcionalmente uma terceira para o tamanho. Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 175.2 KB

### Matriz BCG (`matriz_bcg`)

Matriz crescimento x participação do BCG: eixo X em log e invertido (participação alta à esquerda), corte em 1, bolhas por receita e os quatro nomes clássicos.

- **Tier**: 1
- **Explore**: 1 dimensão (o produto ou unidade), 1 medida de participação (eixo X), 1 de crescimento (eixo Y) e opcionalmente 1 de receita (tamanho). Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 177.2 KB

### ThemeRiver (`theme_river`)

Streamgraph: areas empilhadas com base ondulada (wiggle/silhouette) mostrando composicao ao longo do tempo. Series vindas do pivo, da 2a dimensao ou de varias medidas.

- **Tier**: 1
- **Explore**: 1 dimensao no eixo (de preferencia temporal) e 1 medida. As series vem do pivo, de uma 2a dimensao ou de varias medidas.
- **Aceita pivô**: sim
- **Tamanho do bundle**: 196.7 KB

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

### Organograma (`org_chart`)

Organograma em cartoes, de cima para baixo ou da esquerda para a direita, com ligacoes em cotovelo e areas que podem ser recolhidas.

- **Tier**: 1
- **Explore**: Um par de campos id/superior (ou varias dimensoes, uma por nivel), mais uma medida opcional para o cartao.
- **Aceita pivô**: não
- **Tamanho do bundle**: 137.4 KB

### UpSet Plot (`upset_plot`)

Alternativa ao Venn quando ha mais de 5 conjuntos: uma barra por intersecao, ordenada por tamanho, e uma matriz de pontos dizendo quais conjuntos formam cada uma.

- **Tier**: 1
- **Explore**: Uma dimensao com os conjuntos, ou duas dimensoes (item e conjunto), ou varias colunas sim/nao.
- **Aceita pivô**: não
- **Tamanho do bundle**: 119.0 KB

### Candlestick / OHLC (`candlestick_ohlc`)

Velas japonesas ou barras OHLC por periodo, com cores de alta e baixa, media movel opcional e faixa de volume com escala propria.

- **Tier**: 2
- **Explore**: 1 dimensao temporal e 4 medidas (abertura, maxima, minima, fechamento). Uma 5a medida opcional vira o volume.
- **Aceita pivô**: não
- **Tamanho do bundle**: 139.0 KB

### Linha com Bandas (`linha_bandas`)

Linha central com faixa de incerteza em volta, vinda de tres medidas, de um percentual fixo, do desvio padrao da serie ou do minimo/maximo entre as series do pivo.

- **Tier**: 2
- **Explore**: 1 dimensao no eixo e 1 ou mais medidas. Com tres medidas a banda e um dado de verdade; nos outros modos ela e calculada e o grafico diz isso na tela.
- **Aceita pivô**: sim
- **Tamanho do bundle**: 200.2 KB

### Drawdown (`drawdown`)

Quanto a serie esta abaixo do proprio maximo historico, periodo a periodo, com a pior queda destacada e a duracao da recuperacao.

- **Tier**: 2
- **Explore**: 1 dimensao temporal ORDENADA e 1 medida. Aceita pivo (uma curva de drawdown por serie).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 193.5 KB

### Retorno Acumulado (Base 100) (`retorno_acumulado`)

Cada serie reescalada para comecar no mesmo ponto (100 por padrao), passando a comparar crescimento relativo em vez de valores absolutos.

- **Tier**: 2
- **Explore**: 1 dimensao temporal ordenada e 1 ou mais medidas. Aceita pivo (uma curva por serie).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 190.6 KB

### Fluxo de Caixa (`fluxo_caixa`)

Barras de entradas e saidas por periodo com a linha do saldo acumulado por cima e destaque para os periodos de saldo negativo.

- **Tier**: 2
- **Explore**: 1 dimensao temporal ordenada e 1 ou 2 medidas (entradas e saidas, ou uma medida com sinal). Nao aceita pivo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 167.8 KB

### Pareto (`pareto`)

Barras ordenadas da maior para a menor com a linha de percentual acumulado no eixo da direita e a marca dos 80 por cento.

- **Tier**: 2
- **Explore**: 1 dimensao (as categorias) e 1 medida. Nao aceita pivo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 171.9 KB

### Curva de Lorenz / Gini (`lorenz_gini`)

Curva de Lorenz com a linha de igualdade e o coeficiente de Gini em destaque, medindo o quanto o total esta concentrado em poucas categorias.

- **Tier**: 2
- **Explore**: 1 dimensao (as categorias) e 1 medida nao negativa. Nao aceita pivo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 165.7 KB

### Treemap de Carteira (`treemap_carteira`)

Retangulos proporcionais ao tamanho e coloridos por uma segunda medida numa escala divergente centrada em zero: o tamanho diz quanto pesa, a cor diz como foi.

- **Tier**: 2
- **Explore**: 1 ou mais dimensoes (uma por nivel), 1 medida de tamanho e opcionalmente uma segunda medida para a cor.
- **Aceita pivô**: não
- **Tamanho do bundle**: 139.5 KB

### Ponte de Variação (`ponte_variacao`)

Waterfall: barras flutuantes ligando um valor inicial a um final, com cada contribuicao no caminho e os totais ancorados no zero.

- **Tier**: 2
- **Explore**: 1 dimensao com as etapas (na ordem) e 1 medida com a contribuicao de cada uma. Nao aceita pivo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 131.9 KB

### Risco x Retorno (`risco_retorno`)

Dispersao com risco no eixo X e retorno no Y, bolha pela exposicao, e a reta de Sharpe a partir da taxa livre de risco.

- **Tier**: 2
- **Explore**: 1 dimensao (o ativo) e 2 medidas (risco e retorno). Opcionalmente uma terceira para o tamanho. Nao aceita pivo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 178.7 KB

### Violin Plot (`violin`)

Densidade da distribuicao espelhada nos dois lados de um eixo, uma por categoria, com mediana e intervalo interquartil dentro.

- **Tier**: 3
- **Explore**: 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria — a consulta nao pode vir agregada a um valor por grupo.
- **Aceita pivô**: não
- **Tamanho do bundle**: 168.6 KB

### Ridgeline (`ridgeline`)

Uma curva de densidade por categoria, empilhadas com sobreposicao parcial e compartilhando o mesmo eixo X.

- **Tier**: 3
- **Explore**: 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria.
- **Aceita pivô**: não
- **Tamanho do bundle**: 174.6 KB

### Beeswarm (`beeswarm`)

Um ponto por observacao, espalhado perpendicularmente ao eixo para nao se cobrirem: a distribuicao sem nada estimado.

- **Tier**: 3
- **Explore**: 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria.
- **Aceita pivô**: não
- **Tamanho do bundle**: 174.8 KB

### Grafico de Controle (`grafico_controle`)

Linha central e limites de controle (Shewhart) com as regras de Nelson: separa variacao comum de variacao especial.

- **Tier**: 3
- **Explore**: 1 dimensao temporal (os periodos, em ordem) e 1 medida.
- **Aceita pivô**: sim
- **Tamanho do bundle**: 191.5 KB

### Dispersao com Regressao (`dispersao_regressao`)

Nuvem de pontos com reta ajustada, R2, equacao e banda de incerteza nomeada (da reta ou de predicao).

- **Tier**: 3
- **Explore**: 2 medidas (X e Y) e, opcionalmente, 1 dimensao que identifica cada ponto.
- **Aceita pivô**: não
- **Tamanho do bundle**: 169.6 KB

### Q-Q Plot (Normalidade) (`qq_plot`)

Quantis observados contra quantis teoricos da normal, com reta robusta, envelope pontual de 95% e o nome da forma (caudas pesadas, assimetria).

- **Tier**: 3
- **Explore**: 1 medida com VARIAS linhas (as observacoes). Opcionalmente 1 dimensao que identifica cada ponto.
- **Aceita pivô**: não
- **Tamanho do bundle**: 168.5 KB

### Densidade e ECDF (`densidade_ecdf`)

Duas vistas da mesma distribuicao no mesmo eixo X: a densidade estimada (que depende da banda) e a acumulada empirica (exata, sem parametro).

- **Tier**: 3
- **Explore**: 1 medida com VARIAS linhas. Opcionalmente 1 dimensao para comparar distribuicoes.
- **Aceita pivô**: não
- **Tamanho do bundle**: 162.8 KB

### Intervalo de Confianca (`intervalo_confianca`)

Estimativa por categoria com barra de erro, por tres caminhos declarados, e o modo de COMPARACAO (~83,4%) em que a sobreposicao corresponde ao teste.

- **Tier**: 3
- **Explore**: 1 dimensao e 1 medida. Opcionalmente medidas de limite inferior/superior, ou de n e desvio-padrao.
- **Aceita pivô**: não
- **Tamanho do bundle**: 166.0 KB

### Matriz de Dispersao (`matriz_dispersao`)

SPLOM: dispersao no triangulo inferior, densidade na diagonal e o r de Pearson no superior, todos os pontos num canvas so.

- **Tier**: 3
- **Explore**: 2 ou mais medidas. Opcionalmente 1 dimensao que identifica cada linha.
- **Aceita pivô**: não
- **Tamanho do bundle**: 161.4 KB

### Matriz de Correlacao (`correlacao_matriz`)

Mapa de calor de todas as medidas contra todas, com escala divergente fixa em [-1,+1], Pearson e/ou Spearman e agrupamento por similaridade.

- **Tier**: 3
- **Explore**: 2 ou mais medidas com VARIAS linhas.
- **Aceita pivô**: não
- **Tamanho do bundle**: 114.1 KB

### Boxplot Avancado (`boxplot_avancado`)

Boxplot com entalhe de confianca da mediana, largura proporcional a raiz de n, observacoes individuais e denuncia de distribuicoes com mais de um pico.

- **Tier**: 3
- **Explore**: 1 dimensao (as categorias) e 1 medida com VARIAS linhas por categoria.
- **Aceita pivô**: não
- **Tamanho do bundle**: 164.3 KB

### Heatmap Denso (`heatmap_denso`)

Mapa de calor de duas dimensoes cruzadas, em canvas, com escala linear, divergente centrada em zero ou por quantil, e ausencia distinta de zero.

- **Tier**: 4
- **Explore**: 2 dimensoes (linhas e colunas) e 1 medida; ou 1 dimensao, 1 pivo e 1 medida.
- **Aceita pivô**: sim
- **Tamanho do bundle**: 121.2 KB

### Small Multiples (`small_multiples`)

Grade de mini-graficos, um por serie, todos na MESMA escala — o que torna as formas comparaveis. Escala livre existe como opcao e e declarada na tela.

- **Tier**: 4
- **Explore**: 1 dimensao no eixo e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 171.6 KB

### Barras de Ranking Denso (`barras_ranking_denso`)

Milhares de barras ordenadas com rolagem virtualizada, barra sempre a partir do zero e posicao no ranking preservada na busca.

- **Tier**: 4
- **Explore**: 1 dimensao (o nome) e 1 medida (a barra).
- **Aceita pivô**: não
- **Tamanho do bundle**: 118.8 KB

### Dot Plot Denso (`dot_plot_denso`)

Pontos de Cleveland para muitas categorias e varias medidas por linha, com rolagem virtualizada e aviso quando o eixo esta cortado.

- **Tier**: 4
- **Explore**: 1 dimensao (o nome) e 1 ou mais medidas.
- **Aceita pivô**: não
- **Tamanho do bundle**: 121.6 KB

### Coordenadas Paralelas (`parallel_coords`)

Um eixo por medida e uma linha quebrada por registro, em canvas, com escovacao por eixo e ordenacao automatica que poe pares correlacionados lado a lado.

- **Tier**: 4
- **Explore**: 2 ou mais medidas. Opcionalmente 1 dimensao que identifica cada registro.
- **Aceita pivô**: não
- **Tamanho do bundle**: 139.4 KB

### Bump Chart (`bump_chart`)

Evolucao do ranking ao longo do tempo: o eixo Y e a posicao, nao o valor — e o grafico declara que isso apaga a magnitude.

- **Tier**: 4
- **Explore**: 1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 151.7 KB

### Slope Chart (`slope_chart`)

Dois periodos ligados por uma linha por item: o eixo e o VALOR, entao a inclinacao e a variacao real. Rotulos com anti-colisao que preserva a ordem.

- **Tier**: 4
- **Explore**: 1 dimensao no eixo (usa o primeiro e o ultimo periodo) e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 145.3 KB

### Horizon Chart (`horizon_chart`)

Series temporais empilhadas com a area DOBRADA em faixas de mesma altura: cabe trinta series numa tela mantendo a leitura de pico e vale.

- **Tier**: 4
- **Explore**: 1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 150.4 KB

### Bar Chart Race (`bar_race`)

Barras que se reordenam ao longo do tempo, com barra de tempo tao proeminente quanto o play e respeito a preferencia de menos movimento.

- **Tier**: 5
- **Explore**: 1 dimensao no eixo (os periodos) e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 117.8 KB

### Bolhas em Movimento (`motion_bubbles`)

X, Y, tamanho e cor animados no tempo (Rosling), com a AREA proporcional ao valor, rastro opcional e escalas fixas entre periodos.

- **Tier**: 5
- **Explore**: 2 dimensoes (o item e o tempo) e 2 ou mais medidas (X, Y e opcionalmente o tamanho).
- **Aceita pivô**: não
- **Tamanho do bundle**: 155.9 KB

### KPI Vivo (`kpi_vivo`)

O numero grande com a BASE da comparacao sempre declarada, opcao de menor-e-melhor, sparkline de contexto e deteccao de periodo incompleto.

- **Tier**: 5
- **Explore**: 1 medida. Opcionalmente 1 dimensao de tempo para a comparacao e a sparkline.
- **Aceita pivô**: não
- **Tamanho do bundle**: 144.6 KB

### Conjuntos Paralelos (`parallel_sets`)

Fitas mostrando como a populacao se reparte entre categorias de varias dimensoes, com conservacao do total e ordenacao automatica que reduz cruzamentos.

- **Tier**: 5
- **Explore**: 2 ou mais dimensoes. Opcionalmente 1 medida para a largura (o padrao e contagem de linhas).
- **Aceita pivô**: não
- **Tamanho do bundle**: 117.6 KB

### Diagrama de Arcos (`arc_diagram`)

Nos numa linha e arcos ligando quem se relaciona, com ordenacao por vizinhanca que reduz cruzamentos e contagem publicada na nota.

- **Tier**: 5
- **Explore**: 2 dimensoes (origem e destino). Opcionalmente 1 medida para o peso da ligacao.
- **Aceita pivô**: não
- **Tamanho do bundle**: 117.0 KB
