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

### Opções (painel Edit) — quase tudo é configurável

| Seção | Opções |
|-------|--------|
| **Cores** | cor do texto, fundo/texto do cabeçalho, fundo/texto dos totais, cor da zebra, cor do hover, cor da borda, cor das células com drill |
| **Tipografia** | família da fonte (sistema/monoespaçada/serifada), tamanho, cabeçalho em negrito, cabeçalho em maiúsculas |
| **Bordas e Espaçamento** | mostrar bordas verticais/horizontais, espessura da borda, espaçamento horizontal da célula, altura da linha, altura da linha do cabeçalho, altura da linha de total |
| **Colunas** | fixar colunas de dimensão, fixar cabeçalho, fixar total no rodapé, largura das colunas de dimensão/medida, texto que não cabe (truncar ou quebrar linha), alinhamento das colunas de dimensão, alinhamento das colunas numéricas, separador entre valores de pivô no cabeçalho |
| **Totais** | mostrar total geral, mostrar total por linha, posição do total geral (rodapé ou topo, fixo abaixo do cabeçalho), rótulo do total, total em negrito, texto para valor nulo/ausente |
| **Comportamento** | destacar linha ao passar o mouse, listrar linhas (zebra), linhas extras renderizadas fora da tela (buffer da virtualização), permitir clique para drill |

Cada liga/desliga de "fixar" (cabeçalho, rodapé, colunas de dimensão) é
independente — dá para, por exemplo, fixar só as colunas de dimensão e
deixar cabeçalho e rodapé rolarem com o conteúdo.

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

---

## 2. Globo Terrestre Rotacionável (Pontos)

Arquivo: [`src/globo_terra_pontos.js`](src/globo_terra_pontos.js)

- **ID sugerido**: `globo_terra_pontos`
- **Label sugerido**: `Globo Terrestre Rotacionável (Pontos)`

Desenha a Terra em projeção ortográfica (como se vista do espaço), com os
continentes e um ponto por linha de dado (tamanho proporcional a uma
medida). Arraste com o mouse/toque para girar; dá para ligar rotação
automática nas opções.

### Como montar o Explore

A localização pode vir de **duas formas** (a visualização tenta detectar
sozinha qual delas se aplica; dá pra forçar manualmente na opção "Modo de
coordenadas", seção "Dados"):

1. **Um campo de localização do LookML** (`dimension` com `type: location`)
   — o valor chega como texto `"lat,lon"`. É o jeito mais simples: adicione
   só esse campo ao Explore.
2. **Duas dimensões numéricas separadas** de latitude e longitude (ex.:
   `users.latitude` e `users.longitude`). A visualização tenta achar
   automaticamente pelo nome do campo (contém "lat" / "lon" / "lng"); se
   não achar ou achar errado, escolha manualmente nas opções "Campo de
   latitude" / "Campo de longitude" (aparecem depois da 1ª consulta).

Opcional:
- Uma **medida** controla o tamanho do ponto (a primeira medida da
  consulta é usada por padrão; dá pra trocar na opção "Medida usada no
  tamanho do ponto").
- Uma **dimensão de rótulo** aparece no tooltip ao passar o mouse (padrão:
  a primeira dimensão).

Não aceita pivô (não faz sentido para este tipo de gráfico).

### Opções (painel Edit)

| Seção | Opções |
|-------|--------|
| **Dados** (dinâmica, só aparece depois da 1ª consulta) | modo de coordenadas, campo de localização, campo de latitude, campo de longitude, medida do tamanho do ponto, campo de rótulo |
| **Rotação** | longitude/latitude iniciais, rotação automática, velocidade da rotação automática, sensibilidade do arraste |
| **Estilo do Globo** | cor do oceano, cor da terra, cor/espessura do contorno da terra, mostrar grade de coordenadas e sua cor, cor do contorno externo do globo, cor de fundo |
| **Pontos** | cor, opacidade, raio mínimo/máximo, cor/espessura do contorno do ponto, esconder pontos do lado oculto do globo, máximo de pontos desenhados (desempenho) |
| **Comportamento** | mostrar dica "arraste para girar", mostrar tooltip, permitir clique para drill |

A grade de coordenadas e o contorno externo do globo agora também têm
espessura configurável (além da cor), e a grade pode ficar tracejada.

### De onde vêm os continentes (e por que não há chamada de rede)

O contorno dos continentes é uma cópia **estática**, já dentro do arquivo
`.js`, do dataset público **Natural Earth 110m Land** (domínio público,
sem necessidade de atribuição). As coordenadas foram arredondadas para 2
casas decimais (~1 km) só para reduzir o tamanho do arquivo (ficou com
~105 KB, incluindo o mapa). **Não há nenhum `fetch`/XHR em tempo de
execução** — os dados do mapa já vêm embutidos.

### Limitações conhecidas

- Só contornos de **continentes** (coastline), **sem fronteiras de
  países** — escolha deliberada para manter o arquivo menor e o recorte do
  horizonte mais simples. Se quiser fronteiras de países depois, dá para
  trocar o dataset embutido (fica bem mais pesado).
- O recorte dos continentes na linha do horizonte (lado oculto do globo)
  acha o ponto de cruzamento por interpolação linear e fecha o contorno
  recortado com um **arco** pela borda do globo (pelo caminho mais curto),
  não mais com uma linha reta — isso corrigiu a "mordida reta" que
  aparecia antes ao girar. Ainda não é um recorte esférico completo como o
  da biblioteca D3: em casos raros perto dos polos (ex.: bordas da
  Antártida), o "caminho mais curto" pela borda pode não ser o lado
  geometricamente correto. Se notar um continente grudando no lugar
  errado ao girar bem devagar perto dos polos, me avise.
- Com datasets muito grandes de pontos, o arraste pode ficar menos fluido
  — existe a opção "Máximo de pontos desenhados" (padrão 2.000) para
  limitar isso; o harness testa até 2.500 pontos sem erro, mas a fluidez
  real do arraste só dá para confirmar num navegador de verdade (o teste
  automatizado aqui só confirma ausência de erros, não fluidez visual).

### O que conferir no Looker real (o harness não cobre)

- **Fluidez do arraste** com o volume de dados real do seu caso de uso —
  o harness/teste automatizado não mede taxa de quadros.
- Se o seu campo de localização do LookML realmente entrega o valor como
  texto `"lat,lon"` nesta versão do Looker — isso é o comportamento padrão
  documentado para `type: location`, mas vale conferir no seu ambiente.
- Drill real ao clicar num ponto (no harness só mostra um alerta).
- Comportamento em touch (tablet) para girar o globo.
