# MANIFEST — visualizações da biblioteca

Gerado automaticamente pelo build em 2026-10-27 14:13:45 (HEAD `be26847`; bundles fixados em `be26847edb17327000c61c87ba9b7d536d0e3d24`).

## Como cadastrar no Looker

Admin > Visualizations > Add Visualization:

- **ID**: o da tabela abaixo
- **Label**: o da tabela abaixo
- **Main**: a URL do arquivo (modelo na última coluna)
- **Dependencies**: **VAZIO** — todos os arquivos são autocontidos

As URLs da última coluna já vêm fixadas no commit `be26847edb17327000c61c87ba9b7d536d0e3d24` — o último que alterou algum bundle. Copie e cole como estão: não troque o hash por branch, `@main` ou `@latest`, senão a visualização muda sozinha depois de testada.

ATENÇÃO: 22 bundle(s) mudaram e ainda não foram commitados, então as URLs acima servem a versão ANTERIOR deles. Faça commit e rode o build de novo antes de cadastrar no Looker: `biblioteca/dist/arvores_multiplas.js`, `biblioteca/dist/bar_race.js`, `biblioteca/dist/barras_ranking_denso.js`, `biblioteca/dist/bump_chart.js`, `biblioteca/dist/diagrama_venn.js`, `biblioteca/dist/dot_plot_denso.js`, `biblioteca/dist/drawdown.js`, `biblioteca/dist/dumbbell.js`, `biblioteca/dist/grafico_controle.js`, `biblioteca/dist/heatmap_denso.js`, `biblioteca/dist/kpi_vivo.js`, `biblioteca/dist/marimekko.js`, `biblioteca/dist/matriz_2x2.js`, `biblioteca/dist/matriz_bcg.js`, `biblioteca/dist/org_chart.js`, `biblioteca/dist/pareto.js`, `biblioteca/dist/quadrant_scatter.js`, `biblioteca/dist/risco_retorno.js`, `biblioteca/dist/slope_chart.js`, `biblioteca/dist/tabela_completa.js`, `biblioteca/dist/treemap_carteira.js`, `biblioteca/dist/upset_plot.js`

| ID | Label | Arquivo | Dependencies | Como montar o Explore | URL para o campo Main |
|---|---|---|---|---|---|
| `tabela_completa` | Tabela Completa | _(ainda não construído)_ | (vazio) | 1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/tabela_completa.js` |
| `diagrama_venn` | Diagrama de Venn | _(ainda não construído)_ | (vazio) | Uma dimensão com os conjuntos ("A", "A,B"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/diagrama_venn.js` |
| `quadrant_scatter` | Dispersão com Quadrantes | _(ainda não construído)_ | (vazio) | 1 dimensão (o nome de cada ponto) e pelo menos 2 medidas (eixos X e Y). Opcionalmente mais medidas para tamanho e cor. Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/quadrant_scatter.js` |
| `matriz_2x2` | Matriz 2x2 | _(ainda não construído)_ | (vazio) | 1 dimensão (o nome do item) e 2 medidas (os dois eixos). Opcionalmente uma terceira para o tamanho. Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/matriz_2x2.js` |
| `matriz_bcg` | Matriz BCG | _(ainda não construído)_ | (vazio) | 1 dimensão (o produto ou unidade), 1 medida de participação (eixo X), 1 de crescimento (eixo Y) e opcionalmente 1 de receita (tamanho). Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/matriz_bcg.js` |
| `arvores_multiplas` | Múltiplas Árvores | _(ainda não construído)_ | (vazio) | Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/arvores_multiplas.js` |
| `org_chart` | Organograma | _(ainda não construído)_ | (vazio) | Um par de campos id/superior (ou varias dimensoes, uma por nivel), mais uma medida opcional para o cartao. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/org_chart.js` |
| `upset_plot` | UpSet Plot | _(ainda não construído)_ | (vazio) | Uma dimensao com os conjuntos, ou duas dimensoes (item e conjunto), ou varias colunas sim/nao. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/upset_plot.js` |
| `drawdown` | Drawdown | _(ainda não construído)_ | (vazio) | 1 dimensao temporal ORDENADA e 1 medida. Aceita pivo (uma curva de drawdown por serie). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/drawdown.js` |
| `pareto` | Pareto | _(ainda não construído)_ | (vazio) | 1 dimensao (as categorias) e 1 medida. Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/pareto.js` |
| `treemap_carteira` | Treemap de Carteira | _(ainda não construído)_ | (vazio) | 1 ou mais dimensoes (uma por nivel), 1 medida de tamanho e opcionalmente uma segunda medida para a cor. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/treemap_carteira.js` |
| `risco_retorno` | Risco x Retorno | _(ainda não construído)_ | (vazio) | 1 dimensao (o ativo) e 2 medidas (risco e retorno). Opcionalmente uma terceira para o tamanho. Nao aceita pivo. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/risco_retorno.js` |
| `grafico_controle` | Grafico de Controle | _(ainda não construído)_ | (vazio) | 1 dimensao temporal (os periodos, em ordem) e 1 medida. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/grafico_controle.js` |
| `heatmap_denso` | Heatmap Denso | _(ainda não construído)_ | (vazio) | 2 dimensoes (linhas e colunas) e 1 medida; ou 1 dimensao, 1 pivo e 1 medida. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/heatmap_denso.js` |
| `barras_ranking_denso` | Barras de Ranking Denso | `dist/barras_ranking_denso.js` | (vazio) | 1 dimensao (o nome) e 1 medida (a barra). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/barras_ranking_denso.js` |
| `dot_plot_denso` | Dot Plot Denso | _(ainda não construído)_ | (vazio) | 1 dimensao (o nome) e 1 ou mais medidas. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/dot_plot_denso.js` |
| `bump_chart` | Bump Chart | _(ainda não construído)_ | (vazio) | 1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/bump_chart.js` |
| `slope_chart` | Slope Chart | _(ainda não construído)_ | (vazio) | 1 dimensao no eixo (usa o primeiro e o ultimo periodo) e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/slope_chart.js` |
| `bar_race` | Bar Chart Race | _(ainda não construído)_ | (vazio) | 1 dimensao no eixo (os periodos) e varias series (pivo, 2a dimensao ou varias medidas). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/bar_race.js` |
| `kpi_vivo` | KPI Vivo | _(ainda não construído)_ | (vazio) | 1 medida. Opcionalmente 1 dimensao de tempo para a comparacao e a sparkline. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/kpi_vivo.js` |
| `dumbbell` | Halteres | _(ainda não construído)_ | (vazio) | 1 dimensao (o nome) e 2 medidas (o antes e o depois). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/dumbbell.js` |
| `marimekko` | Marimekko | _(ainda não construído)_ | (vazio) | 2 dimensoes (as colunas e o empilhamento) e 1 medida. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@be26847edb17327000c61c87ba9b7d536d0e3d24/biblioteca/dist/marimekko.js` |

## Detalhes por visualização

### Tabela Completa (`tabela_completa`)

Tabela com pivôs agrupados, agrupamento de linhas, formatação condicional, tipos de célula (barras, sparklines, badges) e campos animados.

- **Tier**: 1
- **Explore**: 1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis).
- **Aceita pivô**: sim

### Diagrama de Venn (`diagrama_venn`)

Diagrama de Venn de 2 a 5 conjuntos, lendo três formatos de dados (uma linha por região, uma linha por item e conjunto, ou colunas sim/não).

- **Tier**: 1
- **Explore**: Uma dimensão com os conjuntos ("A", "A,B"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô.
- **Aceita pivô**: não

### Dispersão com Quadrantes (`quadrant_scatter`)

Dispersão de duas medidas com linhas divisórias (média, mediana, zero ou valor fixo) partindo o plano em quatro quadrantes nomeáveis. Pontos em canvas, eixos e rótulos em SVG.

- **Tier**: 1
- **Explore**: 1 dimensão (o nome de cada ponto) e pelo menos 2 medidas (eixos X e Y). Opcionalmente mais medidas para tamanho e cor. Não aceita pivô.
- **Aceita pivô**: não

### Matriz 2x2 (`matriz_2x2`)

Matriz de decisão 2x2: duas medidas nos eixos, corte no ponto médio, quadrantes nomeáveis e todos os itens rotulados.

- **Tier**: 1
- **Explore**: 1 dimensão (o nome do item) e 2 medidas (os dois eixos). Opcionalmente uma terceira para o tamanho. Não aceita pivô.
- **Aceita pivô**: não

### Matriz BCG (`matriz_bcg`)

Matriz crescimento x participação do BCG: eixo X em log e invertido (participação alta à esquerda), corte em 1, bolhas por receita e os quatro nomes clássicos.

- **Tier**: 1
- **Explore**: 1 dimensão (o produto ou unidade), 1 medida de participação (eixo X), 1 de crescimento (eixo Y) e opcionalmente 1 de receita (tamanho). Não aceita pivô.
- **Aceita pivô**: não

### Múltiplas Árvores (`arvores_multiplas`)

Uma arvore pequena por ramo de primeiro nivel, lado a lado, para comparar a forma de cada ramo.

- **Tier**: 1
- **Explore**: Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho.
- **Aceita pivô**: não

### Organograma (`org_chart`)

Organograma em cartoes, de cima para baixo ou da esquerda para a direita, com ligacoes em cotovelo e areas que podem ser recolhidas.

- **Tier**: 1
- **Explore**: Um par de campos id/superior (ou varias dimensoes, uma por nivel), mais uma medida opcional para o cartao.
- **Aceita pivô**: não

### UpSet Plot (`upset_plot`)

Alternativa ao Venn quando ha mais de 5 conjuntos: uma barra por intersecao, ordenada por tamanho, e uma matriz de pontos dizendo quais conjuntos formam cada uma.

- **Tier**: 1
- **Explore**: Uma dimensao com os conjuntos, ou duas dimensoes (item e conjunto), ou varias colunas sim/nao.
- **Aceita pivô**: não

### Drawdown (`drawdown`)

Quanto a serie esta abaixo do proprio maximo historico, periodo a periodo, com a pior queda destacada e a duracao da recuperacao.

- **Tier**: 2
- **Explore**: 1 dimensao temporal ORDENADA e 1 medida. Aceita pivo (uma curva de drawdown por serie).
- **Aceita pivô**: sim

### Pareto (`pareto`)

Barras ordenadas da maior para a menor com a linha de percentual acumulado no eixo da direita e a marca dos 80 por cento.

- **Tier**: 2
- **Explore**: 1 dimensao (as categorias) e 1 medida. Nao aceita pivo.
- **Aceita pivô**: não

### Treemap de Carteira (`treemap_carteira`)

Retangulos proporcionais ao tamanho e coloridos por uma segunda medida numa escala divergente centrada em zero: o tamanho diz quanto pesa, a cor diz como foi.

- **Tier**: 2
- **Explore**: 1 ou mais dimensoes (uma por nivel), 1 medida de tamanho e opcionalmente uma segunda medida para a cor.
- **Aceita pivô**: não

### Risco x Retorno (`risco_retorno`)

Dispersao com risco no eixo X e retorno no Y, bolha pela exposicao, e a reta de Sharpe a partir da taxa livre de risco.

- **Tier**: 2
- **Explore**: 1 dimensao (o ativo) e 2 medidas (risco e retorno). Opcionalmente uma terceira para o tamanho. Nao aceita pivo.
- **Aceita pivô**: não

### Grafico de Controle (`grafico_controle`)

Linha central e limites de controle (Shewhart) com as regras de Nelson: separa variacao comum de variacao especial.

- **Tier**: 3
- **Explore**: 1 dimensao temporal (os periodos, em ordem) e 1 medida.
- **Aceita pivô**: sim

### Heatmap Denso (`heatmap_denso`)

Mapa de calor de duas dimensoes cruzadas, em canvas, com escala linear, divergente centrada em zero ou por quantil, e ausencia distinta de zero.

- **Tier**: 4
- **Explore**: 2 dimensoes (linhas e colunas) e 1 medida; ou 1 dimensao, 1 pivo e 1 medida.
- **Aceita pivô**: sim

### Barras de Ranking Denso (`barras_ranking_denso`)

Milhares de barras ordenadas com rolagem virtualizada, barra sempre a partir do zero e posicao no ranking preservada na busca.

- **Tier**: 4
- **Explore**: 1 dimensao (o nome) e 1 medida (a barra).
- **Aceita pivô**: não
- **Tamanho do bundle**: 173.1 KB

### Dot Plot Denso (`dot_plot_denso`)

Pontos de Cleveland para muitas categorias e varias medidas por linha, com rolagem virtualizada e aviso quando o eixo esta cortado.

- **Tier**: 4
- **Explore**: 1 dimensao (o nome) e 1 ou mais medidas.
- **Aceita pivô**: não

### Bump Chart (`bump_chart`)

Evolucao do ranking ao longo do tempo: o eixo Y e a posicao, nao o valor — e o grafico declara que isso apaga a magnitude.

- **Tier**: 4
- **Explore**: 1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim

### Slope Chart (`slope_chart`)

Dois periodos ligados por uma linha por item: o eixo e o VALOR, entao a inclinacao e a variacao real. Rotulos com anti-colisao que preserva a ordem.

- **Tier**: 4
- **Explore**: 1 dimensao no eixo (usa o primeiro e o ultimo periodo) e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim

### Bar Chart Race (`bar_race`)

Barras que se reordenam ao longo do tempo, com barra de tempo tao proeminente quanto o play e respeito a preferencia de menos movimento.

- **Tier**: 5
- **Explore**: 1 dimensao no eixo (os periodos) e varias series (pivo, 2a dimensao ou varias medidas).
- **Aceita pivô**: sim

### KPI Vivo (`kpi_vivo`)

O numero grande com a BASE da comparacao sempre declarada, opcao de menor-e-melhor, sparkline de contexto e deteccao de periodo incompleto.

- **Tier**: 5
- **Explore**: 1 medida. Opcionalmente 1 dimensao de tempo para a comparacao e a sparkline.
- **Aceita pivô**: não

### Halteres (`dumbbell`)

Duas medidas por categoria ligadas por uma barra, com rolagem virtualizada; o eixo pode ser cortado porque a barra representa a DIFERENCA.

- **Tier**: 5
- **Explore**: 1 dimensao (o nome) e 2 medidas (o antes e o depois).
- **Aceita pivô**: não

### Marimekko (`marimekko`)

Barras empilhadas com a LARGURA da coluna tambem proporcional: duas dimensoes em area, com as duas conservacoes (larguras 100%, alturas 100% por coluna).

- **Tier**: 5
- **Explore**: 2 dimensoes (as colunas e o empilhamento) e 1 medida.
- **Aceita pivô**: não
