# URLs para o campo Main do Looker

Gerado por `build/urls.mjs`. Todas fixadas no commit `059d787afb27710e9132abf8e6500d289c9fcc2c` — o último que alterou `biblioteca/dist/*.js`.
Conferido com `git ls-tree`: os 22 arquivos existem nesse commit.

**Admin > Visualizations > Add Visualization**: ID e Label da tabela, Main = a URL, **Dependencies VAZIO**.
Copie a URL como está: não troque o hash por branch, `@main` ou `@latest` (a visualização mudaria sozinha depois de testada).

| ID | Label | Main | Como montar o Explore |
|---|---|---|---|
| `tabela_completa` | Tabela Completa | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/tabela_completa.js` | 1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis). |
| `diagrama_venn` | Diagrama de Venn | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/diagrama_venn.js` | Uma dimensão com os conjuntos ("A", "A,B"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô. |
| `quadrant_scatter` | Dispersão com Quadrantes | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/quadrant_scatter.js` | 1 dimensão (o nome de cada ponto) e pelo menos 2 medidas (eixos X e Y). Opcionalmente mais medidas para tamanho e cor. Não aceita pivô. |
| `matriz_2x2` | Matriz 2x2 | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/matriz_2x2.js` | 1 dimensão (o nome do item) e 2 medidas (os dois eixos). Opcionalmente uma terceira para o tamanho. Não aceita pivô. |
| `matriz_bcg` | Matriz BCG | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/matriz_bcg.js` | 1 dimensão (o produto ou unidade), 1 medida de participação (eixo X), 1 de crescimento (eixo Y) e opcionalmente 1 de receita (tamanho). Não aceita pivô. |
| `arvores_multiplas` | Múltiplas Árvores | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/arvores_multiplas.js` | Varias dimensoes (uma por nivel) ou um par de campos id/superior, mais uma medida para o tamanho. |
| `org_chart` | Organograma | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/org_chart.js` | Um par de campos id/superior (ou varias dimensoes, uma por nivel), mais uma medida opcional para o cartao. |
| `upset_plot` | UpSet Plot | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/upset_plot.js` | Uma dimensao com os conjuntos, ou duas dimensoes (item e conjunto), ou varias colunas sim/nao. |
| `drawdown` | Drawdown | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/drawdown.js` | 1 dimensao temporal ORDENADA e 1 medida. Aceita pivo (uma curva de drawdown por serie). |
| `pareto` | Pareto | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/pareto.js` | 1 dimensao (as categorias) e 1 medida. Nao aceita pivo. |
| `treemap_carteira` | Treemap de Carteira | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/treemap_carteira.js` | 1 ou mais dimensoes (uma por nivel), 1 medida de tamanho e opcionalmente uma segunda medida para a cor. |
| `risco_retorno` | Risco x Retorno | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/risco_retorno.js` | 1 dimensao (o ativo) e 2 medidas (risco e retorno). Opcionalmente uma terceira para o tamanho. Nao aceita pivo. |
| `grafico_controle` | Grafico de Controle | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/grafico_controle.js` | 1 dimensao temporal (os periodos, em ordem) e 1 medida. |
| `heatmap_denso` | Heatmap Denso | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/heatmap_denso.js` | 2 dimensoes (linhas e colunas) e 1 medida; ou 1 dimensao, 1 pivo e 1 medida. |
| `barras_ranking_denso` | Barras de Ranking Denso | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/barras_ranking_denso.js` | 1 dimensao (o nome) e 1 medida (a barra). |
| `dot_plot_denso` | Dot Plot Denso | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/dot_plot_denso.js` | 1 dimensao (o nome) e 1 ou mais medidas. |
| `bump_chart` | Bump Chart | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/bump_chart.js` | 1 dimensao no eixo (de preferencia temporal) e varias series (pivo, 2a dimensao ou varias medidas). |
| `slope_chart` | Slope Chart | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/slope_chart.js` | 1 dimensao no eixo (usa o primeiro e o ultimo periodo) e varias series (pivo, 2a dimensao ou varias medidas). |
| `bar_race` | Bar Chart Race | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/bar_race.js` | 1 dimensao no eixo (os periodos) e varias series (pivo, 2a dimensao ou varias medidas). |
| `kpi_vivo` | KPI Vivo | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/kpi_vivo.js` | 1 medida. Opcionalmente 1 dimensao de tempo para a comparacao e a sparkline. |
| `dumbbell` | Halteres | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/dumbbell.js` | 1 dimensao (o nome) e 2 medidas (o antes e o depois). |
| `marimekko` | Marimekko | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@059d787afb27710e9132abf8e6500d289c9fcc2c/biblioteca/dist/marimekko.js` | 2 dimensoes (as colunas e o empilhamento) e 1 medida. |

## Para trocar uma visualização depois de um conserto

1. Altere o código, rode `npm run build` e `npm test`, e commite o `dist/<id>.js`.
2. Pegue o hash: `git log -1 --format=%H -- biblioteca/dist/<id>.js`.
3. No Admin do Looker, troque SÓ a URL daquela visualização, com o hash novo.
