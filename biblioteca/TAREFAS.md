# TAREFAS

Legenda: `[ ]` pendente · `[~]` em andamento · `[x]` pronta · `[!]` bloqueada

Uma visualização só vira `[x]` quando cumpre a seção 9 do `PROMPT_AGENTE.md`
(renderiza no harness e no smoke test com todas as fixtures, passa no grep de
segurança, tem cabeçalho + linha no MANIFEST, e está commitada e enviada).

## TIER 0 — infraestrutura

- [~] T0.1 Esqueleto de `/biblioteca` + branch `agente/novas-viz`
- [ ] T0.2 Conferir node/npm e versões (esbuild, módulos d3) + `package.json`
- [ ] T0.3 `src/core/dom.js`, `errors.js`, `theme.js`, `format.js`
- [ ] T0.4 `src/core/looker-adapter.js` (único arquivo que toca a API do Looker)
- [ ] T0.5 `src/core/data-model.js` (modelo interno estável)
- [ ] T0.6 `src/core/options-kit.js` (kit de opções da seção 6)
- [ ] T0.7 `src/core/define-viz.js` (fábrica que liga viz ao adapter)
- [ ] T0.8 `src/core/scales.js`, `shapes.js`, `animate.js`, `tooltip.js`, `legend.js`, `interaction.js`
- [ ] T0.9 `src/charts/_template/` (modelo de gráfico novo)
- [ ] T0.10 `config/charts.json` + `build/build.mjs` (gera `dist/<id>.js` e `dist/MANIFEST.md`)
- [ ] T0.11 `test/fixtures/` (com/sem pivô, nulos, vazio, 5.000 e 50.000 linhas)
- [ ] T0.12 `test/smoke.test.mjs` + `test/harness.html`
- [ ] T0.13 `docs/ARQUITETURA.md`, `COMPAT.md`, `COMO_ADICIONAR_GRAFICO.md`, `CHANGELOG.md`
- [ ] T0.14 `README.md` da biblioteca + aviso no `README.md` da raiz

## TIER 1 — pedidos diretos

- [ ] 1. `tabela_completa` — "Tabela Completa" (seção 8 do prompt)
- [ ] 2. `diagrama_venn` — "Diagrama de Venn"
- [ ] 3. `quadrant_scatter` — "Dispersão com Quadrantes"
- [ ] 4. `matriz_2x2` — "Matriz 2x2"
- [ ] 5. `matriz_bcg` — "Matriz BCG"
- [ ] 6. `theme_river` — "ThemeRiver"
- [ ] 7. `funil_variacoes` — "Funis (Estilos)"
- [ ] 8. `funil_comparativo` — "Funil Comparativo"
- [ ] 9. `gauge_variacoes` — "Medidores (Estilos)"
- [ ] 10. `gauge_grid` — "Medidores em Grade"
- [ ] 11. `arvore_radial` — "Árvore Radial"
- [ ] 12. `arvores_multiplas` — "Múltiplas Árvores"
- [ ] 13. `org_chart` — "Organograma"
- [ ] 14. `upset_plot` — "UpSet Plot" (opcional)

## TIER 2 — financeiros

- [ ] 15. `candlestick_ohlc` — "Candlestick / OHLC"
- [ ] 16. `linha_bandas` — "Linha com Bandas"
- [ ] 17. `drawdown` — "Drawdown"
- [ ] 18. `retorno_acumulado` — "Retorno Acumulado (Base 100)"
- [ ] 19. `fluxo_caixa` — "Fluxo de Caixa"
- [ ] 20. `pareto` — "Pareto"
- [ ] 21. `lorenz_gini` — "Curva de Lorenz / Gini"
- [ ] 22. `treemap_carteira` — "Treemap de Carteira"
- [ ] 23. `ponte_variacao` — "Ponte de Variação"
- [ ] 24. `risco_retorno` — "Risco x Retorno"

## TIER 3 — estatística

- [ ] 25. `violin` · [ ] 26. `ridgeline` · [ ] 27. `beeswarm`
- [ ] 28. `grafico_controle` · [ ] 29. `dispersao_regressao` · [ ] 30. `qq_plot`
- [ ] 31. `densidade_ecdf` · [ ] 32. `intervalo_confianca` · [ ] 33. `matriz_dispersao`
- [ ] 34. `correlacao_matriz` · [ ] 35. `boxplot_avancado`

## TIER 4 — muitas informações (canvas/virtualizado)

- [ ] 36. `heatmap_denso` · [ ] 37. `small_multiples` · [ ] 38. `barras_ranking_denso`
- [ ] 39. `dot_plot_denso` · [ ] 40. `parallel_coords` · [ ] 41. `bump_chart`
- [ ] 42. `slope_chart` · [ ] 43. `horizon_chart`

## TIER 5 — demais

- [ ] 44. `bar_race` · [ ] 45. `motion_bubbles` · [ ] 46. `kpi_vivo`
- [ ] 47. `parallel_sets` · [ ] 48. `arc_diagram` · [ ] 49. `nightingale`
- [ ] 50. `radial_bar` · [ ] 51. `lollipop` · [ ] 52. `waffle`
- [ ] 53. `dumbbell` · [ ] 54. `marimekko`
