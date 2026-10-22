# TAREFAS

Legenda: `[ ]` pendente · `[~]` em andamento · `[x]` pronta · `[!]` bloqueada

Uma visualização só vira `[x]` quando cumpre a seção 9 do `PROMPT_AGENTE.md`
(renderiza no harness e no smoke test com todas as fixtures, passa no grep de
segurança, tem cabeçalho + linha no MANIFEST, e está commitada e enviada).

## TIER 0 — infraestrutura

- [x] T0.1 Esqueleto de `/biblioteca` + branch `agente/novas-viz`
- [x] T0.2 Conferir node/npm e versões (esbuild, módulos d3) + `package.json`
- [x] T0.3 `src/core/dom.js`, `errors.js`, `theme.js`, `format.js`
- [x] T0.4 `src/core/looker-adapter.js` (único arquivo que toca a API do Looker)
- [x] T0.5 `src/core/data-model.js` (modelo interno estável)
- [x] T0.6 `src/core/options-kit.js` (kit de opções da seção 6)
- [x] T0.7 `src/core/define-viz.js` (fábrica que liga viz ao adapter)
- [x] T0.8 `src/core/scales.js`, `shapes.js`, `animate.js`, `tooltip.js`, `legend.js`, `interaction.js`
- [x] T0.9 `src/charts/_template/` (modelo de gráfico novo)
- [x] T0.10 `config/charts.json` + `build/build.mjs` (gera `dist/<id>.js` e `dist/MANIFEST.md`)
- [x] T0.11 `test/fixtures/` (com/sem pivô, nulos, vazio, 5.000 e 50.000 linhas)
- [x] T0.12 `test/smoke.test.mjs` + `test/harness.html`
- [x] T0.13 `docs/ARQUITETURA.md`, `COMPAT.md`, `COMO_ADICIONAR_GRAFICO.md`, `CHANGELOG.md`
- [x] T0.14 `README.md` da biblioteca + aviso no `README.md` da raiz

## TIER 1 — pedidos diretos

- [x] 1. `tabela_completa` — "Tabela Completa" (seção 8 do prompt)
- [x] 2. `diagrama_venn` — "Diagrama de Venn"
- [x] 3. `quadrant_scatter` — "Dispersão com Quadrantes"
- [x] 4. `matriz_2x2` — "Matriz 2x2"
- [x] 5. `matriz_bcg` — "Matriz BCG"
- [x] 6. `theme_river` — "ThemeRiver"
- [x] 7. `funil_variacoes` — "Funis (Estilos)"
- [x] 8. `funil_comparativo` — "Funil Comparativo"
- [x] 9. `gauge_variacoes` — "Medidores (Estilos)"
- [x] 10. `gauge_grid` — "Medidores em Grade"
- [x] 11. `arvore_radial` — "Árvore Radial"
- [x] 12. `arvores_multiplas` — "Múltiplas Árvores"
- [x] 13. `org_chart` — "Organograma"
- [x] 14. `upset_plot` — "UpSet Plot" (opcional)

## TIER 2 — financeiros

- [x] 15. `candlestick_ohlc` — "Candlestick / OHLC"
- [x] 16. `linha_bandas` — "Linha com Bandas"
- [x] 17. `drawdown` — "Drawdown"
- [x] 18. `retorno_acumulado` — "Retorno Acumulado (Base 100)"
- [x] 19. `fluxo_caixa` — "Fluxo de Caixa"
- [x] 20. `pareto` — "Pareto"
- [x] 21. `lorenz_gini` — "Curva de Lorenz / Gini"
- [x] 22. `treemap_carteira` — "Treemap de Carteira"
- [x] 23. `ponte_variacao` — "Ponte de Variação"
- [x] 24. `risco_retorno` — "Risco x Retorno"

## TIER 3 — estatística

- [x] 25. `violin` · [x] 26. `ridgeline` · [x] 27. `beeswarm`
- [x] 28. `grafico_controle` · [x] 29. `dispersao_regressao` · [x] 30. `qq_plot`
- [x] 31. `densidade_ecdf` · [x] 32. `intervalo_confianca` · [x] 33. `matriz_dispersao`
- [x] 34. `correlacao_matriz` · [x] 35. `boxplot_avancado`

## TIER 4 — muitas informações (canvas/virtualizado)

- [x] 36. `heatmap_denso` · [x] 37. `small_multiples` · [x] 38. `barras_ranking_denso`
- [x] 39. `dot_plot_denso` · [x] 40. `parallel_coords` · [x] 41. `bump_chart`
- [x] 42. `slope_chart` · [x] 43. `horizon_chart`

## TIER 5 — demais

- [x] 44. `bar_race` · [x] 45. `motion_bubbles` · [x] 46. `kpi_vivo`
- [x] 47. `parallel_sets` · [x] 48. `arc_diagram` · [x] 49. `nightingale`
- [x] 50. `radial_bar` · [ ] 51. `lollipop` · [ ] 52. `waffle`
- [ ] 53. `dumbbell` · [ ] 54. `marimekko`
