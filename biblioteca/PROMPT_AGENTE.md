# PROMPT_AGENTE: Biblioteca de visualizações customizadas para o Looker

Você vai criar uma BIBLIOTECA de visualizações customizadas para o Looker (API de Custom Visualizations, `looker.plugins.visualizations.add`) e subir o código para o Git. Você trabalha sozinho, sem supervisão, até a lista acabar ou a sessão ser interrompida.

## 0. PRIMEIRA AÇÃO

1. Se `/biblioteca/PROMPT_AGENTE.md` NÃO existir, salve este texto inteiro nesse caminho (você vai precisar reler as regras em sessões futuras, porque não lembra das anteriores).
2. Rode `git status` e `git log -5`, liste o conteúdo atual do repositório no `/biblioteca/LOG.md` e confira se o branch `agente/novas-viz` e a pasta `/biblioteca` já existem. Se existirem, siga a seção 11 (RETOMADA) em vez de recomeçar.

## 1. ESCOPO

SUA TAREFA É SOMENTE: escrever o código e subir para o Git. Não publique em bucket, não cadastre nada no Looker, não acesse o Looker nem outros serviços. Amanhã eu cadastro e testo por conta própria.

- Cadastro (feito por mim): Admin > Visualizations > Add Visualization (ID, Label, Main = URL do .js, Dependencies). Cada visualização final deve ser UM `.js` autocontido, com o campo Dependencies VAZIO.
- NÃO FAÇA GRÁFICOS DE MAPA nem geográficos. Mapa e globo já estão resolvidos por mim.
- JÁ TENHO, NÃO RECRIAR: todo o repositório looker-open-source/custom_visualizations_v2 e, instaladas no Looker: Report Table, Sankey, Force-Directed, Calendar Chart, Bar Gauge, Multiple Gauge Charts, Aster Plot, Image Carousel, Collapsible Tree, Histogram, Liquid Fill Gauge, Multiple Value2, Packed Bubble, Radial Gauge, Sunburst, além dos gráficos nativos do Looker.
- Várias visualizações de terceiros falharam na versão atual do Looker (um Venn de terceiros abriu o painel de opções mas ficou em branco). NÃO copie código de terceiros e não presuma que um método da API do Looker existe: confirme antes de usar e, se não tiver certeza, diga e use uma alternativa.
- Eu gosto muito de customizar. Em TODOS os gráficos quero o máximo de opções possível: cores, rotação, barras, pontos, pivôs, eixos, rótulos, animação (veja o kit de opções, seção 6).
- A versão do Looker pode mudar no futuro e eu preciso conseguir atualizar o código com facilidade (seção 5).

## 2. REPOSITÓRIO E GIT (regras rígidas)

Repositório de destino (já existe e tem conteúdo): https://github.com/JoelRabitch/Dashborads_NEW (público, branch principal: `main`). Use a cópia local, se já existir, ou clone.

CONTEÚDO EXISTENTE (NÃO ALTERAR, NÃO MOVER, NÃO RENOMEAR, NÃO APAGAR): tudo o que já está em `/src`, `/test`, `/tools`, `/npm-package` e o `README.md`. Leia só o que for necessário para entender as convenções (ex.: `/src/tabela_pivot_avancada.js`). A única alteração permitida em arquivo existente é ACRESCENTAR, no fim do `README.md` da raiz, uma seção curta "Biblioteca modular (/biblioteca)" apontando para `/biblioteca/README.md`.

TUDO O QUE VOCÊ CRIAR vai numa pasta NOVA na raiz: `/biblioteca`. Todos os caminhos deste prompt são relativos a `/biblioteca`, salvo quando indicado. O harness novo fica em `/biblioteca/test/harness.html` (não use nem altere o `/test/harness.html` existente).

BRANCH E COMMITS
- Trabalhe SOMENTE no branch `agente/novas-viz` (crie a partir da `main` atualizada se não existir). NUNCA faça push na `main`, nunca use `--force`, nunca reescreva histórico, nunca apague branches.
- Outras pessoas ou processos podem commitar na `main`. Antes de começar e a cada retomada, faça `fetch` e, se a `main` tiver avançado, faça merge da `main` no seu branch (nunca rebase de commits já enviados). Se houver conflito em arquivos fora de `/biblioteca`, pare e registre no LOG.
- Um commit por etapa, com mensagem em português (ex.: `viz: diagrama_venn – opções, render e testes`). Faça push do branch após cada commit; se falhar, tente de novo uma vez, registre no LOG e siga localmente.
- COMMITE a pasta `dist/` (preciso dos arquivos no Git para apontar o Main do Looker).
- O repositório é PÚBLICO: não commite credenciais, tokens, URLs internas da empresa, nomes de clientes nem dados reais de negócio. Dados de exemplo devem ser sintéticos. Não commite `node_modules` (use `.gitignore`).
- Não use tokens nem senhas: use apenas o acesso Git já configurado na máquina. Se não houver permissão de push, registre no LOG e deixe os commits locais.

## 3. LISTA DE VISUALIZAÇÕES (faça na ordem; termine cada uma por completo antes da próxima)

ID em snake_case, Label como aparece para o usuário.

### TIER 0: infraestrutura (antes de qualquer gráfico)
Estrutura da seção 5, kit de opções comum, adapter do Looker, build, testes de fumaça e harness. Se `node`/`npm` não estiverem disponíveis ou o `npm install` falhar (sem rede), registre no LOG e implemente do zero, em `src/core`, as funções necessárias (escalas, formas, hierarquia, contornos) em vez de usar módulos d3.

### TIER 1: pedidos diretos
1. `tabela_completa`: "Tabela Completa" (requisitos na seção 8).
2. `diagrama_venn`: "Diagrama de Venn". Escrito do ZERO, sem venn.js nem outra biblioteca, sem dependências externas.
   - Conjuntos: de 2 a 5. Para 2 e 3, círculos com ÁREA PROPORCIONAL ao tamanho (calcule a distância entre centros pela área de interseção; para 3, ajuste numericamente para aproximar as interseções e mostre o erro, ou desligue o modo proporcional). Para 4 e 5, layout fixo com elipses (não proporcional), com aviso na legenda. Opção "Proporcional" liga e desliga.
   - Formatos de dados aceitos (opção para escolher, com detecção automática): (a) UMA LINHA POR REGIÃO: uma dimensão com o nome da região (ex.: "A", "B", "A,B", separador configurável) e uma medida com o tamanho; (b) UMA LINHA POR ITEM E CONJUNTO: duas dimensões (item e conjunto), a viz calcula as interseções contando itens distintos, com opção de somar uma medida; (c) UMA LINHA POR ITEM com colunas booleanas ou 0/1, uma por conjunto. Se houver pivô, cada valor do pivô vira um conjunto no formato (c). Documente os três formatos no cabeçalho, no MANIFEST e na mensagem de erro, em português.
   - Opções: cor por conjunto (dinâmica), opacidade, modo de mistura nas interseções (multiplicar, normal, tela), borda (cor, espessura, tracejado), rótulos de conjunto (posição, tamanho, negrito, rotação), valores nas regiões (contagem, % do total, % do conjunto, ambos), formato numérico, rótulos externos com linhas-guia quando a região for pequena, anti-colisão, rotação do diagrama em graus, espelhar, espaçamento entre conjuntos, ordem dos conjuntos, destaque por hover (região, conjunto), seleção de região com drill do Looker, tooltip com template `{{campo}}` e lista dos primeiros N itens da região (quando houver coluna de item), mostrar ou ocultar interseções vazias, legenda interativa (clicar liga e desliga o conjunto), animação de entrada (crescer a partir do centro, em cascata), contador animado nos valores, tema claro e escuro.
   - Testes: fixtures próprias (2, 3, 4 e 5 conjuntos; conjunto vazio; interseção maior que o conjunto, que deve gerar aviso; nomes longos; nulos; formato por item com 50.000 linhas).
3. `quadrant_scatter`: "Dispersão com Quadrantes". Linhas de corte por média, mediana, valor fixo ou percentil (X e Y independentes), rótulo e cor de fundo por quadrante, tamanho por medida, cor por categoria ou valor, rótulos dos pontos com anti-colisão, destaque e busca de pontos, linhas de referência, regressão opcional, escala log, zoom e brush.
4. `matriz_2x2`: "Matriz 2x2". Quadrantes como cartões listando os itens (ex.: impacto x esforço), classificação por regra, limite de itens por quadrante com "+N".
5. `matriz_bcg`: "Matriz BCG". Crescimento x participação com bolhas, quadrantes nomeados e editáveis.
6. `theme_river`: "ThemeRiver". Áreas fluidas empilhadas no tempo, com offsets (silhouette, wiggle, expand, zero), curvas (basis, monotone, linear, step), ordem das camadas (inside-out, por total, por pico, original), rótulos nas camadas, destaque por hover, brush de período, linha vertical de leitura.
7. `funil_variacoes`: "Funis (Estilos)". Uma viz com seletor de estilo: trapézio clássico, pirâmide, barras centralizadas, barras alinhadas à esquerda, curvo/suave (bezier), em degraus, anel concêntrico (radial), pseudo-3D, espelhado. Controles: orientação (vertical/horizontal), inverter (ponta para cima/baixo), rotação em graus, espaçamento, proporção topo/base, rótulos (dentro/fora/linhas-guia), % da etapa anterior e do total, perda entre etapas, cor por etapa, gradiente ou por valor, borda, cantos, altura mínima.
8. `funil_comparativo`: "Funil Comparativo". Dois períodos ou segmentos lado a lado (espelhado ou sobreposto), com diferença percentual por etapa. Aceita pivô como segundo funil.
9. `gauge_variacoes`: "Medidores (Estilos)". Estilos: semicírculo, 3/4, círculo completo com ângulos inicial e final livres, velocímetro com ponteiro, anel, anéis concêntricos (várias medidas), segmentado em blocos, linear horizontal/vertical, termômetro, bateria, bullet. Controles: zonas coloridas por faixa, meta e marcadores, min e max (fixos ou de campos), valor central formatável, ticks, espessura, cantos arredondados, animação do ponteiro e do contador.
10. `gauge_grid`: "Medidores em Grade". Muitos medidores (um por valor de uma dimensão ou por medida), mesma escala ou individual, ordenação, colunas automáticas ou fixas, paginação, busca.
11. `arvore_radial`: "Árvore Radial".
12. `arvores_multiplas`: "Múltiplas Árvores".
13. `org_chart`: "Organograma".
    REQUISITOS DAS TRÊS ÁRVORES: orientação escolhida em opção (radial, cima para baixo, baixo para cima, esquerda para direita, direita para esquerda); rotação livre em graus (slider) e, na radial, arrastar para girar; layout tree ou cluster; links curvo, reto, cotovelo ou radial; formas dos nós, tamanho por medida, cor por nível, categoria ou valor; rótulos (posição, rotação automática na radial, truncar, tamanho); expandir e recolher, profundidade inicial, expandir tudo e recolher tudo; busca com destaque do caminho; zoom e pan; hierarquia a partir de dimensões (cada dimensão = um nível) OU de campos pai/filho (opção). Múltiplas Árvores: uma árvore por valor de uma dimensão ou pivô, em grade, com mesma escala opcional, expansão sincronizada opcional, ordenação e paginação.
14. `upset_plot`: "UpSet Plot" (opcional; se o tempo acabar, pode ficar pendente). Alternativa ao Venn para 5 ou mais conjuntos: barras de interseção, matriz de pontos, barras de tamanho por conjunto, ordenação (tamanho, grau, conjunto), filtro por grau e tamanho mínimo, Top N, cores e rotação. Mesmos formatos de dados do Venn.

### TIER 2: financeiros
15. `candlestick_ohlc`: "Candlestick / OHLC" (velas e barras, volume embaixo, médias móveis, cores de alta e baixa, zoom e brush).
16. `linha_bandas`: "Linha com Bandas" (Bollinger, média móvel, envelope por percentil, intervalo de confiança).
17. `drawdown`: "Drawdown" (área submersa, máximo drawdown marcado, tempo de recuperação).
18. `retorno_acumulado`: "Retorno Acumulado (Base 100)" (várias séries normalizadas, com destaque).
19. `fluxo_caixa`: "Fluxo de Caixa" (entradas e saídas, saldo acumulado, projeção tracejada).
20. `pareto`: "Pareto" (barras decrescentes, linha de acumulado, corte 80/20, grupo "Outros").
21. `lorenz_gini`: "Curva de Lorenz / Gini" (concentração, Gini calculado).
22. `treemap_carteira`: "Treemap de Carteira" (retângulos por tamanho, cor por variação % com escala divergente, agrupado por setor).
23. `ponte_variacao`: "Ponte de Variação" (bridge com subtotais, positivos e negativos, rótulos, conectores).
24. `risco_retorno`: "Risco x Retorno" (dispersão com fronteira, linha de referência e quadrantes).

### TIER 3: estatística
25. `violin`: "Violino". 26. `ridgeline`: "Ridgeline". 27. `beeswarm`: "Beeswarm". 28. `grafico_controle`: "Carta de Controle (SPC)" (limites UCL e LCL, regras de alerta). 29. `dispersao_regressao`: "Dispersão com Regressão" (linear, polinomial, LOESS simples, banda de confiança, R²). 30. `qq_plot`: "Gráfico Q-Q". 31. `densidade_ecdf`: "Densidade e ECDF". 32. `intervalo_confianca`: "Intervalos de Confiança" (barras de erro e forest plot). 33. `matriz_dispersao`: "Matriz de Dispersão (SPLOM)". 34. `correlacao_matriz`: "Matriz de Correlação". 35. `boxplot_avancado`: "Boxplot Avançado" (notched, pontos com jitter, múltiplos grupos, outliers configuráveis).

### TIER 4: muitas informações (muitos produtos, muitas lojas)
Tudo em CANVAS ou virtualizado, funcionando bem com 5.000 a 50.000 itens, com busca, destaque, zoom, brush e Top N.
36. `heatmap_denso`: "Mapa de Calor Denso" (matriz grande, zoom e pan, ordenação por linha e coluna, agrupamento hierárquico opcional, rótulos adaptativos, escala de cor configurável).
37. `small_multiples`: "Mini-gráficos em Grade" (um mini-gráfico por loja ou produto: linha, área, barras, colunas; eixos compartilhados ou não; ordenação; paginação; destaque do pior e do melhor).
38. `barras_ranking_denso`: "Ranking Denso" (barras horizontais com rolagem virtualizada, busca, Top N + "Outros", marcação de meta).
39. `dot_plot_denso`: "Dot Plot Denso" (Cleveland, com muitas categorias, rolagem).
40. `parallel_coords`: "Coordenadas Paralelas" (brushing nos eixos, reordenar eixos, cor por categoria).
41. `bump_chart`: "Ranking ao Longo do Tempo".
42. `slope_chart`: "Gráfico de Inclinação".
43. `horizon_chart`: "Horizon Chart".

### TIER 5: demais
44. `bar_race`: "Corrida de Barras" (play e pausa, velocidade, scrubber de tempo, Top N). 45. `motion_bubbles`: "Bolhas em Movimento" (x, y, tamanho e cor por período, com rastro). 46. `kpi_vivo`: "Cartões de KPI Animados" (contador, variação, sparkline que se desenha, muitos cartões em grade). 47. `parallel_sets`: "Conjuntos Paralelos (Alluvial)". 48. `arc_diagram`: "Diagrama de Arcos". 49. `nightingale`: "Rosa de Nightingale". 50. `radial_bar`: "Barras Circulares". 51. `lollipop`: "Lollipop". 52. `waffle`: "Waffle / Pictograma". 53. `dumbbell`: "Halteres (Antes e Depois)". 54. `marimekko`: "Marimekko".

## 4. DADOS

- Dimensões, medidas, table calculations, pivôs, `totals_data`. Respeitar `hidden_fields`, nulos e `value_format` do Looker.
- Cada gráfico documenta no cabeçalho e no MANIFEST quantas dimensões e medidas espera. Se o formato não servir, mostre uma mensagem clara em português (pelo adapter), explicando como montar o Explore.
- Tipos a tratar: datas (ordenação temporal correta), números, texto, listas separadas por vírgula (para mini-gráficos).
- Hierarquias: a partir de dimensões (cada uma é um nível) ou de campos pai/filho nos gráficos de árvore.

## 5. ARQUITETURA (fácil de atualizar quando o Looker mudar)

```
/biblioteca/
  src/core/
    looker-adapter.js   ÚNICO arquivo que toca em looker.* e LookerCharts.*
    define-viz.js       fábrica: defineViz({ id, label, options, render }) liga a viz ao adapter
    data-model.js       converte queryResponse + data para um modelo interno estável
    options-kit.js      blocos de opções reutilizáveis (seção 6) e registro dinâmico
    theme.js            tokens de tema (cores, fontes, espaçamentos, paletas)
    scales.js, shapes.js, format.js, animate.js, tooltip.js, legend.js, interaction.js
    dom.js              helpers seguros (textContent, criação de SVG e canvas)
    errors.js           mensagens de erro e aviso em português
  src/charts/<id>/index.js    um gráfico por pasta: opções + render(model, config, ctx)
  src/charts/_template/       modelo para criar um gráfico novo
  config/charts.json          registro: id, label, tier, pasta (usado pelo build e pelos docs)
  build/build.mjs             gera dist/<id>.js e dist/MANIFEST.md
  dist/<id>.js                arquivo final autocontido (COMMITADO)
  test/harness.html           simulador do Looker com seletor de gráfico e dados de exemplo
  test/fixtures/              com e sem pivô, nulos, vazio, 5.000 e 50.000 linhas
  test/smoke.test.mjs         carrega cada dist/*.js (jsdom) e renderiza com as fixtures
  docs/ARQUITETURA.md, COMPAT.md, COMO_ADICIONAR_GRAFICO.md, CHANGELOG.md
  README.md, LOG.md, TAREFAS.md, PROMPT_AGENTE.md, package.json, .gitignore
```

Regras de arquitetura:
1. **Isolamento da API do Looker.** Nenhum arquivo fora de `looker-adapter.js` usa `looker.*` ou `LookerCharts.*`. O adapter expõe uma interface própria e estável: `registrarVisualizacao`, `limparErros`, `mostrarErro`, `registrarOpcoes`, `atualizarConfig`, `textoDaCelula`, `htmlDaCelula`, `abrirDrill`, `abrirUrl`, `crossfilter`. Cada função faz DETECÇÃO DE RECURSO (`typeof ...`) e tem fallback com aviso no console. Os gráficos nunca chamam a API do Looker diretamente.
2. **Modelo de dados interno estável.** `data-model.js` é o único lugar que lê `queryResponse.fields`, pivôs, `totals_data` e células. Os gráficos recebem algo como `{ dims, measures, pivots, rows, totals, fieldsByName }`. Se o formato do Looker mudar, só esse arquivo e o adapter mudam.
3. **Compatibilidade documentada.** `docs/COMPAT.md` lista cada método da API do Looker usado, em qual função do adapter, como confirmar que existe, o que acontece sem ele e COMO ADAPTAR se mudar. Inclua o bloco "Se a versão do Looker mudar: checklist": (1) ligue o modo debug; (2) veja o console; (3) edite só o adapter ou o data-model; (4) `npm run build`; (5) `npm test`.
4. **Opções declarativas.** Cada gráfico declara as opções como dados (kit da seção 6), sem lógica espalhada. O registro dinâmico (uma opção por campo ou por série) fica em `options-kit.js`.
5. **Tokens de tema centralizados** em `theme.js`: trocar um valor muda todos os gráficos.
6. **Build:** esbuild com versão fixa em `devDependencies` (confirme com `npm view esbuild versions` que a versão existe e foi publicada há mais de 14 dias). Cada `dist/<id>.js` é um bundle IIFE único, NÃO minificado por padrão (para eu poder auditar). Cabeçalho gerado no topo de cada arquivo: id, label, versão, data do build, hash do commit.
7. **Módulos d3 só como devDependencies, EMBUTIDOS no bundle** (d3-hierarchy, d3-shape, d3-scale, d3-array, d3-interpolate, d3-delaunay, d3-contour, d3-force, d3-sankey, se necessário), com versões exatas conferidas com `npm view`, publicadas há mais de 14 dias e com licença compatível (ISC ou BSD). Em tempo de execução NÃO pode haver dependência externa nem CDN.
8. **MANIFEST:** `dist/MANIFEST.md` gerado pelo build, com tabela: ID, Label, arquivo, Dependencies (vazio), como montar o Explore (dimensões e medidas, se aceita pivô) e URL de exemplo para o campo Main neste formato (deixe COMMIT como placeholder para eu preencher): `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/ARQUIVO.js`
9. `docs/COMO_ADICIONAR_GRAFICO.md`: passo a passo curto para criar uma nova viz a partir do `_template`.

## 6. KIT DE OPÇÕES COMUM (todo gráfico usa o que fizer sentido)

Registrado em `options-kit.js` e organizado em seções do painel Edit. Cada gráfico acrescenta as suas opções específicas.
- **Cores:** paleta (várias prontas, inclusive daltonismo-seguras e divergentes), cor por série ou categoria (uma opção por item, dinâmica), gradientes, escala por valor (2 ou 3 cores; mínimo, ponto médio e máximo automáticos ou fixos), opacidade, inverter, cor de fundo, cor de contorno.
- **Rotação e orientação:** ângulo em graus, orientação (vertical, horizontal, invertida), girar rótulos, espelhar.
- **Barras e áreas:** largura, espaçamento, raio dos cantos, borda, empilhado, agrupado, normalizado (100%), ordem, padrões de preenchimento.
- **Pontos e linhas:** forma (círculo, quadrado, triângulo, losango, cruz, estrela), tamanho fixo ou por medida, borda, opacidade, espessura da linha, tracejado, suavização, preencher abaixo.
- **Pivô:** valores do pivô como séries, opção de transpor (pivô nas linhas), ordenação e limite.
- **Dados:** ordenação (por valor, rótulo, original; crescente e decrescente), Top N com grupo "Outros", agrupar categorias pequenas, filtro por mínimo, tratamento de nulos (omitir, zero, interpolar).
- **Eixos:** mínimo e máximo, escala linear, log ou raiz, formato dos números (K/M/B, moeda, percentual, casas decimais), gridlines, inverter, títulos, rotação dos rótulos, eixo secundário quando fizer sentido.
- **Rótulos:** mostrar ou não, posição, formato, tamanho, cor, rotação, anti-colisão, truncar.
- **Legenda:** posição, ordem, interativa (clicar liga e desliga séries), mostrar valores.
- **Linhas de referência e anotações:** meta, média, mediana, percentil ou valor fixo, com rótulo e cor.
- **Tooltip:** padrão ou template com `{{nome_do_campo}}`, mostrar nome completo do campo, valores brutos.
- **Animação:** interruptor global, duração, atraso, easing, cascata (stagger), "só na primeira carga" ou "a cada atualização". Sempre respeitar `prefers-reduced-motion`.
- **Interação:** zoom, pan, brush, busca e destaque, seleção, drill do Looker (`openDrillMenu` com `cell.links`) e cross-filter SOMENTE se confirmar que a API existe.
- **Tema:** claro, escuro, personalizado, fontes do sistema, tamanhos, espaçamentos, bordas, sombras.
- **Avançado:** modo debug (escreve no console a estrutura de campos, pivôs e a primeira linha), restaurar padrão, exportar e importar a configuração como JSON (copiar e colar).
- Cuidado com o `registerOptions`: o Looker só mostra o valor escolhido de um select se o `config` já o tiver antes de o `registerOptions` disparar; registre só quando a lista de campos mudar, para evitar loop infinito.

## 7. REGRAS TÉCNICAS E DE SEGURANÇA (obrigatórias)

- Cada viz tem `options`, `create` e `updateAsync(data, element, config, queryResponse, details, done)` (isso fica dentro do `define-viz` e do adapter). Sempre chamar `done()`, inclusive em erro.
- **Sem dependências externas em tempo de execução.** O campo Dependencies fica vazio.
- **Proibido** em `src/` e `dist/`: `fetch`, `XMLHttpRequest`, `sendBeacon`, `eval`, `new Function`, `document.cookie`, `localStorage`, `sessionStorage`, `window.open`, `@import`, `document.write`, `importScripts`, `WebSocket` e qualquer URL http(s) externa. ÚNICA exceção: os namespaces `http://www.w3.org/2000/svg` e `xlink` para criar SVG. `navigator.clipboard` e `Blob` com URL local são permitidos.
- Texto vindo de dados (nomes de campos, valores, templates de tooltip, rótulos) entra SEMPRE por `textContent` ou atributos validados, nunca por `innerHTML` sem escapar. HTML do Looker (`htmlForCell`) só quando o usuário ligar uma opção explícita. Imagens: apenas http(s) e data:, com opção de desligar imagens externas. Fontes do sistema.
- **Desempenho:** Canvas ou virtualização para volumes grandes; redimensionar com o contêiner (`ResizeObserver`, se existir); sem vazamento de listeners nem timers entre atualizações; limpar animações pendentes.
- **Acessibilidade básica:** contraste adequado, animações desligáveis, teclado onde fizer sentido.
- Código comentado em português. Cada gráfico com cabeçalho explicando o que faz, campos esperados e opções.

## 8. TABELA COMPLETA (requisitos)

Substitui as tabelas que tenho hoje, que acho muito limitadas. Já existe `/src/tabela_pivot_avancada.js`: leia (só leitura), aproveite ideias e nomes de opções, e anote no LOG o que a nova faz a mais. A nova é independente e fica em `/biblioteca`. Tudo configurável no painel Edit, por coluna quando fizer sentido:
- **Estrutura:** pivôs como colunas agrupadas (cabeçalho em dois níveis) e opção de transpor; agrupamento de linhas por uma ou mais dimensões com expandir e recolher, subtotais e total geral; linhas de detalhe expansíveis; colunas calculadas na viz (soma, diferença, razão, variação %).
- **Colunas:** fixas à esquerda e à direita, cabeçalho fixo, redimensionar e reordenar arrastando, mostrar e ocultar por menu, largura automática, fixa ou em %, quebra de texto ou truncar com tooltip, alinhamento, fonte, cor de texto e fundo por coluna, renomear, prefixo e sufixo, formato numérico próprio.
- **Tipos de célula (por coluna):** texto, número, link e drill, imagem, ícone, badge colorido, avatar com iniciais, data, booleano, barra de progresso, barra de dados (positiva e negativa), gauge pequeno, anel de progresso, estrelas, semáforo, seta de variação, sparkline, mini barras, mini área, mini pizza.
- **Formatação condicional (motor de regras):** várias regras por coluna avaliadas em ordem (maior que, menor que, igual, diferente, entre, contém, começa com, é nulo, top N, bottom N, acima e abaixo da média, percentil), com ações de cor de fundo, cor do texto, negrito, ícone, badge, borda, animação, e formatar a célula ou a linha inteira. Escalas de cor de 2 e 3 cores, paletas prontas e comparação com outra coluna (realizado contra meta).
- **CAMPOS ANIMADOS (prioridade):** contador que sobe ou desce até o valor, barras e anéis que crescem, sparklines que se desenham, destaque quando o valor MUDA entre atualizações (flash verde ao subir e vermelho ao descer, com valores anteriores guardados por linha e coluna), efeito flip de dígitos, pulso e piscar para células em alerta (com limite de repetições), ícones com movimento, entrada das linhas (fade, slide, cascata), shimmer, typewriter e marquee para textos longos. Interruptor global, duração, atraso e easing. Animar só as linhas visíveis, sem travar com 1.000 células animadas, e respeitar `prefers-reduced-motion`.
- **Interação:** ordenação por clique e por várias colunas (shift), busca global com destaque, filtros por coluna (texto, faixa numérica, lista, datas), paginação OU rolagem com virtualização (20.000 linhas), seleção de linhas com soma automática, destaque de linha e coluna, tooltips por coluna com template, drill, copiar célula, linha ou seleção, exportar CSV (Blob e URL local), menu de contexto (copiar, ocultar coluna, fixar coluna, ordenar).
- **Totais e rodapé:** `totals_data` do Looker e totais calculados na viz (soma, média, mínimo, máximo, contagem, contagem distinta, mediana) por coluna, fixos no rodapé, também para seleção e página.
- **Aparência:** temas (Claro, Escuro, Cinza, Minimal, Cartão, Zebra, Compacto, Planilha), customização total de cores, bordas, raios, densidade, tamanhos, altura de linha e cabeçalho, sombra, hover, cor de seleção, título e subtítulo, mensagem de "sem dados" personalizada, cabeçalho vertical opcional.
- **Configuração:** presets em JSON (exportar, importar, restaurar padrão). Persistir ordem e largura de colunas via `atualizarConfig` SOMENTE se confirmar que existe; senão mantenha em memória e avise.
- **Técnica:** não recriar o DOM inteiro a cada atualização; preserve rolagem, ordenação, filtros, seleção e página; virtualização; acessibilidade básica (roles, foco por teclado, setas entre células).

## 9. DEFINIÇÃO DE "PRONTA"

Uma visualização só é pronta quando:
1. Carrega e renderiza no harness e no teste de fumaça com todas as fixtures (com e sem pivô, nulos, vazio e volume grande).
2. Passa na checagem de segurança por grep em `src/` e `dist/` (a lista proibida da seção 7), com o resultado mostrado no LOG.
3. Tem cabeçalho comentado e linha no MANIFEST (campos esperados e como montar o Explore).
4. Está commitada e enviada.

Se não conseguir corrigir um problema em 3 tentativas, marque `[!]` com o motivo no LOG e siga para a próxima.

## 10. COMO TRABALHAR (modo autônomo)

- Não vou poder responder perguntas até amanhã. Se algo estiver ambíguo, assuma o mais simples e registre a decisão no LOG.
- Faça o TIER 0 primeiro. Depois, uma visualização por vez, na ordem da lista. Em `TAREFAS.md` use: `[ ]` pendente, `[~]` em andamento, `[x]` pronta, `[!]` bloqueada.
- Não invente métodos da API do Looker. Se não tiver certeza, use uma alternativa e anote em `docs/COMPAT.md`.
- Não instale nada globalmente, não acesse a internet além do necessário (`npm install` e `npm view` para conferir versões), não mexa fora da pasta do repositório.
- No LOG, liste o que o harness NÃO cobre e que preciso conferir no Looker real, e os 5 pontos que mais merecem minha revisão.
- Pare quando a lista acabar ou a sessão encerrar. Ao final, escreva no LOG um resumo: prontas, bloqueadas e pendentes.

## 11. RETOMADA E INTERRUPÇÃO

- A sessão pode ser cortada a qualquer momento por limite de uso ou de créditos, sem aviso. Por isso: (1) faça commit e push após CADA etapa pequena, nunca acumule trabalho sem commitar; (2) atualize o `LOG.md` ANTES de começar cada etapa (o que vai fazer agora) e DEPOIS de terminá-la, com a "próxima ação exata"; (3) deixe o branch sempre em estado que carrega e não quebra o build; (4) se um arquivo ficar pela metade, marque `[~]` em `TAREFAS.md` e descreva o que falta.
- AO RETOMAR (nova sessão após interrupção, reset de limite ou no dia seguinte): reler este arquivo, rodar `git status` e `git log -5`, ler `TAREFAS.md` e `LOG.md`, confirmar que está no branch `agente/novas-viz`, conferir arquivos sem commit da sessão anterior (se completos, teste e commite; se pela metade, termine ou descarte conforme o LOG) e continuar da primeira tarefa `[~]` ou `[ ]`. Não refaça o que está `[x]`. Registre no LOG "sessão retomada em <data>" e o ponto de partida.
- Decisões importantes vão para o LOG, não só o andamento: você não lembra das sessões anteriores.
