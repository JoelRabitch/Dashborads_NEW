# Biblioteca de visualizações customizadas para o Looker

Visualizações para o Looker (API `looker.plugins.visualizations.add`), onde
cada gráfico vira **um arquivo `.js` autocontido** — no cadastro do Looker, o
campo **Dependencies fica VAZIO**.

Esta pasta é independente do resto do repositório: nada fora de `/biblioteca`
é alterado (exceto um aviso no fim do `README.md` da raiz apontando para cá).

## Como cadastrar no Looker

**Admin > Visualizations > Add Visualization**

| Campo | O que preencher |
|---|---|
| **ID** | o ID do gráfico (ver `dist/MANIFEST.md`) |
| **Label** | o nome que aparece no Explore |
| **Main** | a URL do `dist/<id>.js` |
| **Dependencies** | **vazio** |

As URLs prontas para o campo Main (fixadas no hash do commit) estão em
[`dist/URLS.md`](dist/URLS.md) e [`dist/URLS.csv`](dist/URLS.csv); como
montar o Explore de cada gráfico, em [`dist/MANIFEST.md`](dist/MANIFEST.md).

> Use a URL com o **hash de 40 caracteres**, nunca branch, `@main`,
> `@latest`, `raw.githubusercontent.com` ou `github.com/blob` (o Looker
> bloqueia essas respostas com `ERR_BLOCKED_BY_ORB`).

## Fluxo de manutenção (consertar um gráfico)

1. Altere o código em `src/charts/<id>/` (ou no núcleo, `src/core/`).
2. `npm run build` e `npm test` (e `npm run seguranca`). O build é
   determinístico: só regrava os bundles que mudaram de verdade.
3. Commite os `dist/<id>.js` alterados.
4. Pegue o hash: `git log -1 --format=%H -- biblioteca/dist/<id>.js`.
5. No Admin do Looker, troque **só a URL daquela visualização**, com o hash novo.
6. (Opcional) `npm run urls` regenera `dist/URLS.md`/`URLS.csv` com o hash
   novo para todos; commite num commit seguinte.

Depois de mudar opções, `npm run opcoes` regera `docs/opcoes/*.depois.json`
e `docs/opcoes/ABAS.md`; `test/opcoes.test.mjs` garante que nenhum id
antigo sumiu nem mudou de tipo ou default.

Para conferir no Looker real o que o teste automático não alcança, use o
checklist [`docs/TESTE_NO_LOOKER.md`](docs/TESTE_NO_LOOKER.md).

## Gráficos mantidos (22)

`tabela_completa`, `diagrama_venn`, `upset_plot`, `treemap_carteira`,
`kpi_vivo`, `heatmap_denso`, `dumbbell`, `drawdown`, `dot_plot_denso`,
`bump_chart`, `slope_chart`, `bar_race`, `barras_ranking_denso`,
`arvores_multiplas`, `org_chart`, `pareto`, `marimekko`,
`quadrant_scatter`, `matriz_2x2`, `matriz_bcg`, `risco_retorno`,
`grafico_controle`.

Outros 32 gráficos da primeira versão foram arquivados em
[`_arquivados/`](_arquivados/) (fora do build e dos testes). O estado antes
da limpeza está na tag Git `antes-da-limpeza`.

## Como trabalhar aqui

```bash
cd biblioteca
npm install          # só na primeira vez (dependências de build/teste)

npm run build        # gera dist/<id>.js, dist/MANIFEST.md e test/gerado/
npm test             # smoke test de todos os gráficos (jsdom + fixtures)
npm run seguranca    # varre src/ e dist/ pela lista proibida
```

Para ver com os próprios olhos: abra `test/harness.html` no navegador
(duplo clique — não precisa de servidor nem de internet).

## Documentação

| Documento | Para quê |
|---|---|
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | Como o projeto é organizado e por quê |
| [`docs/COMPAT.md`](docs/COMPAT.md) | **O que fazer quando a versão do Looker mudar** |
| [`docs/COMO_ADICIONAR_GRAFICO.md`](docs/COMO_ADICIONAR_GRAFICO.md) | Passo a passo para criar um gráfico novo |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | O que mudou em cada versão |
| [`docs/RELATORIO_CORRECOES.md`](docs/RELATORIO_CORRECOES.md) | Correções v2: o que foi corrigido, testado e o que conferir no Looker |
| [`docs/TESTE_NO_LOOKER.md`](docs/TESTE_NO_LOOKER.md) | Checklist manual para o Looker real |
| [`docs/opcoes/ABAS.md`](docs/opcoes/ABAS.md) | Abas do painel antes/depois e destino de cada opção |
| [`TAREFAS.md`](TAREFAS.md) | Lista de gráficos: pendente / em andamento / pronto |
| [`LOG.md`](LOG.md) | Decisões tomadas e o que ainda precisa de conferência |

## Princípios

1. **A API do Looker fica isolada** em dois arquivos (`looker-adapter.js` e
   `data-model.js`). Mudança de versão se corrige ali, não nos gráficos.
2. **Nada de dependência em tempo de execução.** O d3 entra só como
   ferramenta de build e é embutido no arquivo final.
3. **Segurança por padrão**: sem `fetch`, `eval`, `localStorage`,
   `window.open`, `innerHTML` com dado, nem URL externa. Conferido por
   script (`npm run seguranca`).
4. **Muita opção de customização** — cores, rotação, eixos, rótulos,
   legenda, animação, tema — porque é isso que se espera na prática.
5. **Mensagem de erro é instrução**: quando o formato dos dados não serve, a
   visualização explica em português como montar o Explore.
6. **Acessibilidade mínima**: contraste razoável, animação desligável e
   respeito a `prefers-reduced-motion`.
