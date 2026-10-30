# ARQUITETURA

## Objetivo

Criar muitas visualizações para o Looker sem repetir código e, principalmente,
**sem espalhar a API do Looker pelo projeto** — para que uma mudança de versão
do Looker seja corrigida em dois arquivos, não em cinquenta.

## Mapa das pastas

```
biblioteca/
  src/core/            o núcleo compartilhado (nenhum gráfico reimplementa isto)
  src/charts/<id>/     um gráfico por pasta (só opções + render)
  src/charts/_template/ modelo para criar um gráfico novo
  config/charts.json   registro: id, label, tier, pasta, fixtures
  build/build.mjs      gera dist/<id>.js e dist/MANIFEST.md
  build/checagem-seguranca.mjs  varre src/ e dist/ pela lista proibida
  dist/<id>.js         arquivo final autocontido (COMMITADO, é o que vai no Looker)
  test/harness.html    simulador do Looker para olhar com os próprios olhos
  test/fixtures/       dados de exemplo no formato do Looker
  test/smoke.test.mjs  teste automatizado de todos os gráficos
  docs/                este documento, COMPAT, COMO_ADICIONAR_GRAFICO, CHANGELOG
```

## As camadas

```
         ┌─────────────────────────────────────────────┐
         │             LOOKER (muda com o tempo)        │
         └───────────────────────┬─────────────────────┘
                                 │  looker.* / LookerCharts.*
         ┌───────────────────────▼─────────────────────┐
         │  looker-adapter.js  +  data-model.js        │  ← só estes dois
         │  (detecção de recurso + modelo estável)     │     conhecem o Looker
         └───────────────────────┬─────────────────────┘
                                 │  interface nossa, estável
         ┌───────────────────────▼─────────────────────┐
         │  define-viz.js  (ciclo de vida, validação,  │
         │  tema, erros, limpeza, resize)              │
         └───────────────────────┬─────────────────────┘
                                 │  ctx
         ┌───────────────────────▼─────────────────────┐
         │  src/charts/<id>/index.js                   │
         │  só declara opções e desenha                │
         └─────────────────────────────────────────────┘
```

### 1. `looker-adapter.js` — a fronteira

Único arquivo que toca `looker.*` e `LookerCharts.*`. Expõe uma interface
nossa: `registrarVisualizacao`, `limparErros`, `mostrarErro`,
`registrarOpcoes`, `atualizarConfig`, `textoDaCelula`, `htmlDaCelula`,
`abrirDrill`, `abrirUrl`, `crossfilter`.

**Toda** função faz detecção de recurso (`typeof ...`) antes de usar e tem um
plano B com aviso no console (uma vez só, para não poluir). Ver `COMPAT.md`.

### 2. `data-model.js` — o modelo estável

Converte `data` + `queryResponse` num modelo que os gráficos entendem:

```js
{
  dimensoes, medidas, camposDePivo, porNome, campo(nome),
  pivots, pivotsDeDados, temPivo, pivoDeTotal,
  linhas, quantidadeDeLinhas,
  celula(linha, campo, chavePivo?), valorNumerico(...), valorBruto(...),
  valorData(...), texto(...), totalDaLinha(linha, campo),
  extrairSerie({dimensao, medida, ...}), valoresDistintos(campo),
  totais, avisos
}
```

Se o formato do Looker mudar, muda só aqui.

### 3. `define-viz.js` — o ciclo de vida

Faz tudo que seria repetido em cada gráfico:

- chama `done()` **sempre**, inclusive quando dá erro;
- monta o modelo e **valida o formato** (`exigencia`) antes de desenhar;
- resolve o tema e aplica o JSON de configuração do bloco "Avançado";
- cria a estrutura DOM (área do gráfico, faixa de avisos, título/subtítulo);
- **limpa listeners, timers e quadros** entre atualizações (sem vazamento);
- redesenha quando o tile muda de tamanho (`ResizeObserver`);
- modo debug.

O gráfico recebe um `ctx` e só precisa implementar `render(ctx)`.

### 4. `src/charts/<id>/index.js` — o gráfico

Declara as opções (compondo blocos do `options-kit`) e desenha. Nada mais.

## O núcleo, módulo a módulo

| Módulo | Para quê |
|---|---|
| `dom.js` | Criar/limpar DOM e SVG **com segurança** (nunca `innerHTML`), canvas com alta densidade, `ResizeObserver` com fallback, gerenciador de listeners |
| `errors.js` | Mensagens de erro/aviso em português, explicando como montar o Explore |
| `theme.js` | Tokens de tema (claro/escuro/personalizado), paletas (várias daltonismo-seguras), escalas contínuas, utilitários de cor |
| `format.js` | Converte `value_format` do Looker (estilo Excel) para formatação real; datas em pt-BR com fuso correto; template `{{campo}}` |
| `options-kit.js` | 14 blocos de opções reutilizáveis + opções dinâmicas por campo/série + ordenação automática das seções |
| `scales.js` | Escalas numéricas/banda/ponto/temporal a partir das opções, escala de cores (categoria, valor, única), linhas de referência |
| `shapes.js` | Curvas, símbolos de ponto, retângulo com cantos, arcos, empilhamento, envoltória convexa |
| `animate.js` | Motor de animação em `requestAnimationFrame`, easings, contador animado, traçado de linha — **sempre respeitando `prefers-reduced-motion`** |
| `tooltip.js` | Tooltip **único por gráfico** (2.3), fixar/soltar, ação do clique, modelo do usuário seguro (b/i/br/span), HTML do Looker filtrado |
| `legend.js` | Legenda categórica e contínua, interativa, com layout que reserva o espaço |
| `interaction.js` | Arraste com **pointer capture**, zoom por roda, inércia, brush, busca, hit-testing; `ligarDestaqueAoPassar` (hover único, 2.6) |
| `rotulos.js` | **Função única de rótulos** (2.1): `lerRotulos`, `textoDoRotulo`, `estilizarRotulo`, `criarRotuloSvg`, `esconderColisoes` |
| `cores.js` | **Leitura única da aba de cores** (2.2): paleta com inverter, cor por item, opacidade, contorno |

### O que o define-viz faz por TODOS os gráficos (correções v2)

1. **Config normalizado** (`normalizarConfig`): defaults nas chaves ausentes, tipos corrigidos; relido a cada `updateAsync`.
- **Título, subtítulo e nota (v3, 5.1c)**: `src/core/cabecalho.js` (faixas `.bl-cabecalho`/`.bl-rodape` no fluxo, plano com `medida-texto.js`); cada gráfico escreve o texto automático da nota em `ctx.nota`.
2. **Abas padronizadas** (`organizarAbas`, lista única `ABAS` em `options-kit.js`): Dados · Estilo · Texto · Mais (v3, 5.1b; o Looker mostra em ordem alfabética: Dados · Estilo · Mais · Texto). Rótulos no limite de 30/40 caracteres por `src/core/rotulos-do-painel.js`; só `section`/`order`/`label` mudam, nunca id/tipo/default. Relatório (com o rótulo completo de cada opção) em `docs/opcoes/ABAS.md`.
3. **Tooltip único** por gráfico (`ctx.tooltip()`), escondido em todo redesenho e removido no destroy; `ctx.cliqueNoItem(ev, celula, conteudo)` aplica a "Ação do clique".
4. **Aviso** no fluxo (topo/rodapé/oculto), com ×, sempre também no console.
5. **Hover** (`data-item` ou `.bl-marcador`) depois de todo desenho.
6. **Animação genérica** de entrada/atualização depois do render (exceto gráficos com `animacaoPropria: true`).
7. Opções que todo gráfico ganha: avisos, animação e "Destacar ao passar o mouse" (as já declaradas mantêm os próprios defaults).

Flags novas do `defineViz`: `animacaoPropria` (tabela, bar_race) e `cabecalhoProprio` (kpi_vivo desenha título/subtítulo no cartão).

Testes que garantem os contratos: `test/opcoes.test.mjs` (ids/tipos/defaults antigos x `docs/opcoes/*.antes.json` e abas padronizadas), `test/nucleo_correcoes.test.mjs`, `test/avisos.test.mjs`, `test/animacao.test.mjs`, `test/hover.test.mjs`.

## Decisões que valem explicar

**Por que não usar o d3 inteiro?** Só importamos os módulos necessários
(`d3-scale`, `d3-shape`, `d3-array`, `d3-hierarchy`, ...), como
`devDependencies`, e o esbuild **embute** no bundle só o que é usado. Em
tempo de execução não há nenhuma dependência externa — por isso o campo
**Dependencies do Looker fica vazio**.

**Por que bundle não-minificado?** Para o arquivo poder ser auditado. O
`npm run build -- --minificar` existe se um dia o tamanho incomodar.

**Por que SVG em alguns gráficos e canvas em outros?** SVG é mais simples e
acessível, e serve bem até alguns milhares de elementos. Acima disso (Tier 4),
canvas ou virtualização são obrigatórios para o arraste continuar suave.

**Por que o estado fica em `ctx.estado`?** Porque `updateAsync` roda várias
vezes na mesma instância. Rolagem, ordenação, filtros, seleção e página
precisam sobreviver entre atualizações — e o `define-viz` preserva esse
objeto, limpando só o que é descartável (listeners, timers, quadros).

## Melhorias v3 — módulos novos

| Módulo | Para quê |
|---|---|
| `src/core/cabecalho.js` + `medida-texto.js` | Título, subtítulo e nota em faixas próprias; largura estimada de texto (função única, usada também pelos testes de geometria) |
| `src/core/rotulos-do-painel.js` | Rótulos curtos do painel (30/40 caracteres); 4 abas em `ABAS` (`options-kit.js`) |
| `src/core/formulas.js` | Interpretador próprio de fórmulas (sem eval) — tabela e cartão |
| `src/core/texto-longo.js` | "Texto longo" (7 modos) — árvores, organograma, dot plot |
| `src/core/rotulo-na-borda.js` | Margem/inversão do rótulo do valor extremo |
| `src/core/icones.js`, `icone-por-valor.js` | Registro único de ícones; ícone por valor |
| `src/core/pacotes.js` + `src/packs/<nome>/` | Pacotes temáticos (registram ícones, formas, paletas, progressos com prefixo); o build descobre as pastas; `BL_SEM_PACOTES=1` |
| `src/charts/_arvore/comum.js` | Botões, abrir/fechar animado, centralizar — árvores e organograma |
| `src/charts/tabela_completa/{busca,calculadas,layouts}.js` | Busca "contém", colunas calculadas, 9 layouts |
| `src/charts/diagrama_venn/moderno.js` | Layout Moderno do Venn |
| `config/repo.json` | Único lugar com dono/repositório/hospedagem (URLs) |

O `define-viz` passou a: injetar as opções do cabeçalho/nota, "Pacote
temático" e "Estilo do ícone" quando cabem; esconder o tooltip antes de
qualquer drill; registrar o painel de novo só quando o pacote temático muda.
