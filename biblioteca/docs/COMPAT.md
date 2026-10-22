# COMPAT — o que esta biblioteca usa da API do Looker

Este documento existe para um único objetivo: **quando a versão do Looker
mudar, você saber exatamente o que conferir e onde mexer.**

Regra de ouro da arquitetura: **nenhum gráfico chama a API do Looker.**
Só dois arquivos conhecem o Looker:

| Arquivo | Responsabilidade |
|---|---|
| `src/core/looker-adapter.js` | Chama `looker.*` e `LookerCharts.*` |
| `src/core/data-model.js` | Lê o formato de `data` e `queryResponse` |

Se o Looker mudar, a correção é nesses dois arquivos — os 50+ gráficos
continuam iguais.

---

## 1. Se a versão do Looker mudar: checklist

1. **Ligue o modo debug** na visualização (painel Edit → seção "Avançado" →
   "Modo debug").
2. **Abra o console do navegador** (F12 → aba Console). O modo debug imprime:
   - o relatório de detecção de recursos (`recursosDoLooker`), dizendo quais
     métodos da API existem nesta versão;
   - a lista de dimensões/medidas com tipo e `value_format`;
   - os pivôs detectados;
   - a **primeira linha crua** recebida;
   - o `queryResponse` inteiro.
3. **Compare com a tabela da seção 2** abaixo. O que estiver `false` no
   relatório e era `true` antes é o que quebrou.
4. **Edite só** `looker-adapter.js` (se o problema for um método da API) ou
   `data-model.js` (se o problema for o formato dos dados).
5. Rode `npm run build`.
6. Rode `npm test`.
7. Rode `npm run seguranca`.
8. Suba o `dist/` novo e aponte o campo **Main** do Looker para o novo commit.

> Dica: o adapter **nunca quebra** quando um método some. Ele detecta,
> escreve um aviso no console (uma vez só) e segue com um plano B. Então o
> sintoma típico de incompatibilidade é "um recurso parou de funcionar",
> não "a visualização sumiu".

---

## 2. Métodos da API do Looker usados

Legenda da coluna **Confiança**:
- ✅ **Confirmado** — usado e visto funcionando no Looker real.
- 📄 **Documentado** — está na documentação pública da API v2, mas não foi
  confirmado nesta instalação.
- ⚠️ **Incerto** — não há como detectar se funciona; tratamos como "melhor
  esforço".

| Método da API | Onde usamos | Confiança | Como confirmar | Sem ele, o que acontece |
|---|---|---|---|---|
| `looker.plugins.visualizations.add(def)` | `registrarVisualizacao()` | ✅ | O gráfico aparece na lista de tipos do Explore | Nada é registrado; o console avisa (esperado fora do Looker) |
| `this.addError({title, message})` | `ponte.mostrarErro()` | ✅ | Force um Explore sem os campos certos e veja a mensagem | O erro vai só para o console |
| `this.clearErrors()` | `ponte.limparErros()` | ✅ | Corrija o Explore e veja o erro sumir | Erros antigos podem ficar na tela |
| `this.trigger('registerOptions', opcoes)` | `ponte.registrarOpcoes()` | ✅ | Opções por campo aparecem no painel Edit | Só as opções estáticas aparecem |
| `this.trigger('updateConfig', [cfg])` | `ponte.atualizarConfig()` | ⚠️ | Mexa na largura de uma coluna, recarregue e veja se persistiu | O estado fica só em memória (perde ao recarregar) |
| `LookerCharts.Utils.textForCell(cell)` | `ponte.textoDaCelula()` | ✅ | Valores aparecem formatados igual à tabela nativa | Usamos `cell.rendered`, senão `cell.value` |
| `LookerCharts.Utils.htmlForCell(cell)` | `ponte.htmlDaCelula()` | 📄 | Ligue a opção de usar HTML do Looker numa coluna | Cai para texto puro |
| `LookerCharts.Utils.openDrillMenu({links, event})` | `ponte.abrirDrill()` | ✅ | Clique num ponto/célula com drill configurado | Clique não faz nada; aviso no console |
| `LookerCharts.Utils.filterableValueForCell(cell)` | `ponte.valorFiltravel()` | 📄 | Usado só por cross-filter manual | Usamos `String(cell.value)` |
| `LookerCharts.Utils.toggleCrossfilter({row, pivot, event})` | `ponte.crossfilter.alternar()` | ⚠️ | Ligue "usar cross-filter" e clique num item | Recurso desligado, com aviso |
| `LookerCharts.Utils.getCrossfilterSelection(row, pivot)` | `ponte.crossfilter.selecao()` | ⚠️ | Idem | Devolve 0 (nada selecionado) |

### Por que `abrirUrl` não usa `window.open`

A seção 7 do `PROMPT_AGENTE.md` proíbe `window.open`. Então `ponte.abrirUrl()`
cria um `<a target="_blank" rel="noopener noreferrer">` temporário, valida que
a URL é `http(s)` e dispara o clique. Mesmo efeito, sem a função proibida.

---

## 3. Formato dos dados (`data` + `queryResponse`)

Tudo isto é lido **só** em `data-model.js`.

### 3.1 Campos

```js
queryResponse.fields = {
  dimensions: [...], measures: [...], table_calculations: [...],
  dimension_like: [...],   // dimensões + table calcs que agem como dimensão
  measure_like: [...],     // medidas + table calcs que agem como medida
  pivots: [...]            // os campos usados como pivô
}
```

Cada campo: `{ name, label, label_short, value_format, is_numeric, type }`.

**Usamos `dimension_like`/`measure_like`** (e não `dimensions`/`measures`),
porque são eles que já incluem as table calculations no grupo certo.

### 3.2 Células

| Situação | Como ler |
|---|---|
| Campo normal | `row[nomeDoCampo]` → `{ value, rendered, html?, links? }` |
| Campo pivotado | `row[nomeDoCampo][chaveDoPivo]` → `{ value, rendered, ... }` |
| Vários pivôs | A chave é a junção dos valores por `\|FIELD\|` |
| Total de linha | `row[nomeDoCampo]['$$$_row_total_$$$']` |

`queryResponse.pivots` = `[{ key, is_total, data, metadata }]`. O pivô com
`is_total: true` é a coluna "Total" (só existe se "Totais de linha" estiver
ligado no Explore).

### 3.3 Pontos INCERTOS do formato (e o que fazemos)

| Assunto | Situação | Nosso plano B |
|---|---|---|
| **Totais gerais** (`totals_data`) | Não confirmado na API clássica. Procuramos em `queryResponse.totals_data`, `queryResponse.totals` e `data.totals_data`. | Se não achar, o gráfico calcula por conta própria (**soma simples**) e marca como cálculo nosso. ⚠️ Para medidas que não são soma (média, contagem distinta, mediana), esse total pode divergir do que o Looker mostraria — a API não expõe o tipo de agregação. |
| **`hidden_fields`** ("Hide from Visualization") | Não documentado de forma estável. Procuramos em `config.hidden_fields`, `queryResponse.hidden_fields` e `queryResponse.fields.hidden_fields`. | Se nada existir, assumimos que o Looker já removeu os campos ocultos das listas. **Confira no Looker real**: se um campo oculto aparecer no gráfico, me avise o caminho exato que ele usa. |
| **Formato de campo `location`** | O valor mais comum é a string `"lat,lon"`. | Não é usado por nenhum gráfico desta biblioteca (sem mapas, por decisão do escopo). |

---

## 4. Comportamentos do Looker que já nos morderam

Estes são aprendizados de **teste real**, não suposição. Estão codificados no
adapter para não se repetirem.

### 4.1 `registerOptions` SUBSTITUI o painel inteiro

Mandar só as opções dinâmicas **apaga** as seções estáticas do painel Edit.

```js
// ERRADO — as seções Cores, Eixos, etc. somem do painel
this.trigger('registerOptions', { campoDeCor: {...} });

// CERTO — é o que o adapter faz
this.trigger('registerOptions', Object.assign({}, opcoesEstaticas, opcoesDinamicas));
```

O adapter também só dispara quando a **assinatura** das opções muda, para não
entrar em laço infinito de registro.

### 4.2 Arraste trava dentro do iframe

A visualização roda num `<iframe>` *sandboxed* pequeno. Arraste feito com
`mousemove`/`mouseup` soltos **para de receber eventos** assim que o cursor
sai da área do iframe — e o gesto trava no meio.

Solução (em `src/core/interaction.js`): **Pointer Events + `setPointerCapture`**,
que garantem a entrega dos eventos até soltar o ponteiro. Como bônus, o mesmo
código atende mouse e toque.

### 4.3 Content Security Policy / Trusted Types

Instalações mais novas do Looker rodam com Trusted Types em modo
*report-only*. Isso gera avisos no console do tipo
`This document requires 'TrustedScriptURL' assignment` — **são avisos, não
bloqueios**. Mas, se um dia virar enforcement, qualquer `innerHTML` com string
crua quebraria. Esta biblioteca **não usa `innerHTML`** em lugar nenhum
(`npm run seguranca` garante isso), então já está preparada.

### 4.4 Bloqueio de CDN pela rede da empresa (ERR_BLOCKED_BY_ORB)

Em teste real, o Chrome bloqueou arquivos servidos por
`cdn.jsdelivr.net/gh/...` (proxy do GitHub), enquanto os de
`cdn.jsdelivr.net/npm/...` carregaram normalmente.

Como **esta biblioteca gera arquivos autocontidos** (campo Dependencies
vazio), o risco é menor: é um arquivo só. Se o `dist/<id>.js` for bloqueado
pelo caminho `/gh/`, as saídas são:
1. publicar os arquivos num pacote npm e usar `cdn.jsdelivr.net/npm/...`; ou
2. hospedar no bucket interno da empresa.

---

## 5. Onde mexer, por sintoma

| Sintoma | Arquivo | O que olhar |
|---|---|---|
| Valores aparecem sem formatação | `looker-adapter.js` | `textoDaCelula` → `textForCell` existe? |
| Números calculados por nós saem errados | `format.js` | Conversão de `value_format` estilo Excel |
| Pivô não aparece / vira coluna vazia | `data-model.js` | `queryResponse.pivots` e `row[campo][chave]` |
| Total de linha errado | `data-model.js` | `CHAVE_TOTAL_DE_LINHA` |
| Painel Edit perdeu seções | `looker-adapter.js` | `registrarOpcoes` (ver 4.1) |
| Drill não abre | `looker-adapter.js` | `abrirDrill` → `openDrillMenu` existe? |
| Arraste/zoom travando | `interaction.js` | Pointer capture (ver 4.2) |
| Campo oculto aparecendo | `data-model.js` | `descobrirCamposOcultos` |
