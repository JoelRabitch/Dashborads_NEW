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

A tabela completa, com a URL pronta de cada gráfico e como montar o Explore,
está em [`dist/MANIFEST.md`](dist/MANIFEST.md) — gerada automaticamente pelo
build.

> Fixe a URL num **commit específico** (nunca em `@main`), para a
> visualização não mudar sozinha depois de testada.

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
