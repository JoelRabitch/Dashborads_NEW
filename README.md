# Custom Visualizations — Looker

Visualizações customizadas para o Looker, feitas com a API clássica
`looker.plugins.visualizations.add`. Cada visualização é **um único arquivo
`.js`**, sem build, sem TypeScript, sem dependências externas.

## Estrutura

```
/src    um arquivo .js por visualização (nome em snake_case = sugestão de ID)
/test   harness.html — simula o ambiente do Looker para testar localmente
```

## Como testar localmente (antes de subir ao Looker)

1. Abra `test/harness.html` diretamente no navegador (duplo clique, ou
   `file://.../test/harness.html`). Não precisa de servidor nem de internet.
2. Escolha a visualização no primeiro combo e o conjunto de dados de
   exemplo no segundo (sem pivô, com pivô, com nulos, 20 ou 5.000 linhas,
   ou um conjunto vazio para testar a mensagem de erro).
3. Ajuste o JSON de configuração (equivale às opções do painel "Edit" do
   Looker) e clique em "Renderizar".
4. O harness mostra o tempo que `updateAsync` levou, e quaisquer erros
   chamados via `this.addError(...)` aparecem embaixo do painel.

**Importante:** o harness é uma simulação. Ele reproduz o formato de dados
e os utilitários (`LookerCharts.Utils.textForCell`, `openDrillMenu`, etc.)
com base na documentação e no código-fonte público de exemplos oficiais do
Looker, mas não é o Looker de verdade. Sempre valide no Looker real antes
de confiar 100% no resultado — ver a seção "O que conferir no Looker real"
de cada visualização abaixo.

## Como cadastrar no Looker (Admin > Visualizations)

Para cada visualização:

1. Suba o arquivo `.js` para um local acessível publicamente por HTTPS:
   um repositório no GitHub servido via jsDelivr
   (`https://cdn.jsdelivr.net/gh/USUARIO/REPO@COMMIT/src/arquivo.js` —
   **sempre fixando no hash do commit, nunca `@latest` nem branch**, para
   a visualização não mudar sozinha depois de testada) ou o bucket interno
   da empresa.
2. No Looker: **Admin > Visualizations > Add Visualization**.
3. Preencha:
   - **ID**: o sugerido em cada seção abaixo (tem que ser único na conta).
   - **Label**: o sugerido em cada seção abaixo (nome que aparece no
     seletor de tipo de gráfico do Explore).
   - **Main**: a URL HTTPS do `.js`.
   - **Dependencies**: deixe em branco (nenhuma destas visualizações usa
     bibliotecas externas).
4. Salve e teste em um Explore real antes de usar em dashboards.

---

## 1. Tabela Avançada (Pivô, Totais e Colunas Fixas)

Arquivo: [`src/tabela_pivot_avancada.js`](src/tabela_pivot_avancada.js)

- **ID sugerido**: `tabela_pivot_avancada`
- **Label sugerido**: `Tabela Avançada (Pivô, Totais e Colunas Fixas)`

### Como montar o Explore

- Funciona com **qualquer número de dimensões** (viram as colunas fixas à
  esquerda) e **qualquer número de medidas**.
- **Aceita pivô** (0 ou mais campos de pivô). Com pivô, o cabeçalho ganha
  uma linha extra agrupando as medidas por valor do pivô.
- Table calculations funcionam normalmente, desde que apareçam como
  "dimension-like" ou "measure-like" na consulta (é automático, não exige
  nada especial ao criar a table calc).
- Para o **total por linha** (coluna "Total" à direita, no modo pivotado)
  usar o total calculado pelo próprio Looker, habilite **"Totais de
  linha"** nas opções do pivô do Explore. Sem isso, a visualização calcula
  o total por linha somando os valores visíveis (ver limitação abaixo).

### Opções (painel Edit)

| Seção     | Opção | O que faz |
|-----------|-------|-----------|
| Totais    | Mostrar total geral (rodapé) | Liga/desliga a linha de total no rodapé |
| Totais    | Mostrar total por linha      | Liga/desliga a coluna de total (só aparece com pivô) |
| Totais    | Rótulo do total              | Texto usado no rodapé e no cabeçalho do total |
| Colunas   | Fixar colunas de dimensão    | Sticky horizontal nas colunas de dimensão |
| Colunas   | Largura das colunas de dimensão / de medida | Em pixels |
| Estilo    | Altura da linha, tamanho da fonte, zebra, cor do cabeçalho, cor dos totais, alinhamento numérico | Visual |

O cabeçalho sempre fica fixo (sticky) no topo da rolagem, independente das
opções — não há opção separada para isso porque não faz sentido desligar.

### Limitações conhecidas (leia antes de usar com medidas de média/mediana/contagem distinta)

- O **total geral** (rodapé) e o **total por linha quando o Looker não
  fornece um pronto** são sempre uma **soma** dos valores numéricos
  visíveis. Isso é correto para medidas de soma/contagem, mas pode não
  bater com o valor real para médias, medianas, contagens distintas etc.,
  porque a API de visualização não informa o tipo de agregação de cada
  medida. **Confira no Looker real** se os totais fazem sentido para as
  medidas que você está usando; se não fizerem, desligue "Mostrar total
  geral" para essas tabelas.
- Os números dos totais calculados por nós usam formatação `pt-BR` simples
  (separador de milhar/decimal), **não** o `value_format` exato do campo
  no Looker — porque não reimplementamos o parser de `value_format`. Os
  valores das células normais (não-total) usam o texto já formatado pelo
  próprio Looker (`rendered`), então esses estão corretos.
- Larguras de coluna são fixas/configuráveis, sem ajuste automático por
  conteúdo.
- Assumimos que campos marcados como "Hide from Visualization" no Explore
  já não aparecem em `queryResponse.fields.dimension_like` /
  `measure_like` — não achamos documentação confiável de uma lista
  separada `hidden_fields` para esta API clássica de visualização.
  **Confira no Looker real**; se um campo oculto aparecer na tabela, me
  avise o comportamento exato para eu ajustar.

### O que conferir no Looker real (o harness não cobre)

- Tamanho real do tile em um dashboard (o harness usa uma altura fixa de
  teste).
- Drill de verdade ao clicar em uma célula com link (no harness isso só
  mostra um alerta).
- Fonte/tema da conta Looker (o harness usa a fonte padrão do sistema, que
  é a mesma que o arquivo usa de propósito — mas vale conferir visualmente).
- Comportamento com "Totais de linha" e "Totais de coluna" habilitados de
  formas diferentes no Explore (testamos a combinação mais comum).
- Volume real de dados do seu caso de uso acima de 5.000 linhas, se for o
  caso — testamos até 5.000 no harness e no teste automatizado local.
