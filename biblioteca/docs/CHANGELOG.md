# CHANGELOG

Formato: mais recente primeiro. Datas em AAAA-MM-DD.

## [1.0.0] — 2026-10-24

Biblioteca completa: **54 visualizações**, 1.286 testes, checagem de
segurança limpa em 145 arquivos.

### Adicionado

- **TIER 1 — fundamentais (14):** `tabela_completa`, `diagrama_venn`,
  `quadrant_scatter`, `matriz_2x2`, `matriz_bcg`, `theme_river`,
  `funil_variacoes`, `funil_comparativo`, `gauge_variacoes`, `gauge_grid`,
  `arvore_radial`, `arvores_multiplas`, `org_chart`, `upset_plot`.
- **TIER 2 — financeiras (10):** `candlestick_ohlc`, `linha_bandas`,
  `drawdown`, `retorno_acumulado`, `fluxo_caixa`, `pareto`, `lorenz_gini`,
  `treemap_carteira`, `ponte_variacao`, `risco_retorno`.
- **TIER 3 — estatísticas (11):** `violin`, `ridgeline`, `beeswarm`,
  `grafico_controle`, `dispersao_regressao`, `qq_plot`, `densidade_ecdf`,
  `intervalo_confianca`, `matriz_dispersao`, `correlacao_matriz`,
  `boxplot_avancado`.
- **TIER 4 — volume (8):** `heatmap_denso`, `small_multiples`,
  `barras_ranking_denso`, `dot_plot_denso`, `parallel_coords`,
  `bump_chart`, `slope_chart`, `horizon_chart`.
- **TIER 5 — demais (11):** `bar_race`, `motion_bubbles`, `kpi_vivo`,
  `parallel_sets`, `arc_diagram`, `nightingale`, `radial_bar`, `lollipop`,
  `waffle`, `dumbbell`, `marimekko`.

- **Bases compartilhadas** (`src/charts/_*`), extraídas sempre ao nascer o
  SEGUNDO gráfico de cada família: `_quadrantes`, `_funil`, `_medidor`,
  `_arvore`, `_serie_temporal`, `_distribuicao`, `_dispersao`,
  `_lista_virtual`, `_animacao`, `_polar`.
- **`src/core/estatistica.js`**: quantil tipo 7, densidade por kernel,
  Silverman robusto, regressão linear completa (com `sxx`, `sqe`,
  `erroResidual`, graus de liberdade), `quantilT` por Cornish-Fisher,
  `quantilNormalPadrao` (Acklam), `postos` e `correlacaoDeSpearman`.
- **`src/core/eixos.js`**: margens, área de desenho, eixos com desbaste de
  rótulos por largura, eixo secundário.
- **`src/core/series.js`**: `extrairMatriz` (pivô, 2ª dimensão ou várias
  medidas), tratamento de nulos, corte em "Outros" preservando o total.

### Corrigido

- `core/estatistica.js` — `correlacaoDePearson` devolvia **1** quando uma
  das variáveis era constante (`r² = 1` por `Syy = 0`). Numa matriz de
  correlação, uma medida zerada pelo filtro apareceria como correlação
  perfeita com todas as outras. Agora devolve `null`.
- `core/interaction.js` — `habilitarBrush` decidia "foi clique" com
  `largura < 3 && altura < 3`, mas com `direcao: 'y'` a largura é sempre a
  do alvo inteiro: o caminho de LIMPAR a seleção estava morto nas duas
  direções, e um clique virava seleção de altura zero sem desfazer.
- `core/eixos.js` — lia nomes de opção que o `options-kit` não cria
  (`tituloDoEixoX`, `mostrarGradeHorizontal`, `rotacaoDosRotulosX`): títulos
  de eixo e grades eram ignorados em silêncio em todos os cartesianos.
- `core/eixos.js` — eixo de banda desenhava um rótulo por categoria (120
  datas sobrepostas); agora desbasta pela largura necessária.
- Vários gráficos: ver `LOG.md`, que registra cada defeito encontrado, a
  causa e por que ele não aparecia no desenho.

### Notas de compatibilidade

- Nenhum gráfico importa de outro gráfico: código compartilhado mora numa
  base `_`. Importar de um gráfico registrado embutiria o `defineViz` dele
  no bundle e registraria duas visualizações num arquivo só.
- `prefers-reduced-motion` desliga a animação em `bar_race` e
  `motion_bubbles` (abrem parados no último período, com explicação).

## [0.1.0] — 2026-10-21

Primeira versão: infraestrutura (Tier 0).

### Adicionado

- **Núcleo** (`src/core/`):
  - `looker-adapter.js` — isolamento total da API do Looker, com detecção de
    recurso e plano B em cada método.
  - `data-model.js` — modelo de dados estável (pivôs, total de linha,
    campos ocultos, totais).
  - `define-viz.js` — ciclo de vida: `done()` sempre, validação, tema,
    limpeza entre atualizações, redesenho no resize, modo debug.
  - `options-kit.js` — 14 blocos de opções reutilizáveis + opções dinâmicas.
  - `theme.js` — temas claro/escuro/personalizado, 11 paletas categóricas
    (4 daltonismo-seguras) e 10 escalas contínuas.
  - `format.js` — conversão do `value_format` do Looker, datas pt-BR,
    template `{{campo}}`.
  - `dom.js`, `errors.js`, `scales.js`, `shapes.js`, `animate.js`,
    `tooltip.js`, `legend.js`, `interaction.js`.
- **Build** (`build/build.mjs`): esbuild → `dist/<id>.js` autocontido em
  IIFE não-minificado, com cabeçalho (id, label, versão, data, commit), mais
  `dist/MANIFEST.md`.
- **Checagem de segurança** (`build/checagem-seguranca.mjs`): varre `src/` e
  `dist/` pela lista proibida, distinguindo código de comentário.
- **Testes**: `test/harness.html` (simulador do Looker) e
  `test/smoke.test.mjs` (jsdom, todas as fixtures, volume grande,
  atualizações repetidas).
- **Fixtures** (`test/fixtures/`): 21 conjuntos sintéticos — sem pivô, com
  pivô (com e sem total de linha), temporal, hierarquia, pai/filho,
  conjuntos em 3 formatos, OHLC, vazio, só nulos, rótulos longos, 5.000 e
  50.000 linhas.
- **Documentação**: `ARQUITETURA.md`, `COMPAT.md`,
  `COMO_ADICIONAR_GRAFICO.md`, este changelog.

### Corrigido (durante o desenvolvimento)

- `format.js`: datas sem fuso explícito voltavam um dia em fusos negativos
  (`new Date('2026-03-05')` é meia-noite UTC). Agora são montadas componente
  a componente, em hora local.
- `_template`: declarava aceitar pivô mas não lia dados pivotados, caindo no
  estado vazio em silêncio. Agora declara `aceitaPivo: false` e documenta o
  padrão correto.

### Notas de compatibilidade

- `registerOptions` **substitui** o painel de opções inteiro — o adapter
  sempre manda estáticas + dinâmicas juntas (ver `COMPAT.md`, seção 4.1).
- Arraste usa Pointer Events + `setPointerCapture` para não travar dentro do
  iframe do Looker (ver `COMPAT.md`, seção 4.2).
