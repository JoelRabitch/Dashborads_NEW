# LOG — Biblioteca de visualizações Looker

Registro cronológico de decisões, andamento e pendências. Lido em toda
retomada de sessão (ver seção 11 do `PROMPT_AGENTE.md`).

---

## Sessão 1 — 2026-10-21

### Diagnóstico inicial (seção 0 do prompt)

- `git status`: working tree limpo, estava em `main`, sincronizado com `origin/main`.
- `git log -5`:
  - `8e7db83` Add files via upload (traz o `PROMPT_AGENTE.md`)
  - `852ee81` Unifica Mapa Plano e Globo numa visualizacao so (Map Mode)
  - `6da455d` Corrige lacuna no globo perto dos polos
  - `f5f8b35` Corrige arraste travando dentro do iframe do Looker
  - `bdba549` Adiciona globo_terra_pontos.js ao pacote npm
- Conteúdo da raiz do repositório ANTES de começar (não alterar nada disto,
  exceto acrescentar uma seção no fim do `README.md`):
  - `PROMPT_AGENTE.md`
  - `README.md`
  - `npm-package/` (pacote npm usado para hospedar os .js no jsDelivr)
  - `src/` (`tabela_pivot_avancada.js`, `globo_terra_pontos.js`,
    `mapa_customizavel.js`, `world_topology_110m.js`, `world_topology_50m.js`)
  - `test/` (`harness.html` antigo — NÃO usar nem alterar)
  - `tools/` (`gerar_topologia_mundial.js`)
- Branch `agente/novas-viz`: **não existia** → criado a partir da `main` atualizada.
- Pasta `/biblioteca`: **não existia** → criada agora.
- **Conclusão: isto NÃO é retomada.** Começando do zero pela seção 0 + Tier 0.

### Decisões desta sessão

1. **Sem perguntas ao usuário** (ele avisou que não responde até amanhã).
   Toda ambiguidade é resolvida pelo caminho mais simples e registrada aqui.
2. `PROMPT_AGENTE.md` copiado para `/biblioteca/PROMPT_AGENTE.md` conforme a
   seção 0, item 1 (o da raiz fica intocado).
3. Estrutura de pastas criada exatamente como a seção 5 do prompt descreve.

### Etapas

- [x] **Etapa 1** — esqueleto de `/biblioteca` (LOG, TAREFAS, PROMPT, .gitignore)
      + branch `agente/novas-viz` criado.
- [x] **Etapa 2** — `package.json` com versões fixas conferidas e instaladas.
- [x] **Etapa 3** — núcleo base: `dom.js`, `errors.js`, `theme.js`, `format.js`.
- [x] **Etapa 4** — `looker-adapter.js` + `data-model.js` + `test/fixtures/`.
- [x] **Etapa 5** — resto do núcleo: `options-kit`, `define-viz`, `scales`,
      `shapes`, `animate`, `tooltip`, `legend`, `interaction`.
- [x] **Etapa 6** — `_template`, `config/charts.json`, `build/build.mjs` e
      `build/checagem-seguranca.mjs`.
- [x] **Etapa 7** — `test/harness.html` + `test/smoke.test.mjs` (+ geração de
      `test/gerado/fixtures.js` e `registro.js` pelo build).
- [x] **Etapa 8** — docs (`ARQUITETURA`, `COMPAT`, `COMO_ADICIONAR_GRAFICO`,
      `CHANGELOG`), `README.md` da biblioteca e aviso no `README.md` da raiz.
      **TIER 0 CONCLUÍDO.**

### Versões de build escolhidas (todas conferidas com `npm view`)

Regra: tem que existir e ter sido publicada há MAIS de 14 dias. Hoje é
2026-10-21, então o corte é 2026-10-07.

| Pacote | Versão | Publicada em | Licença |
|---|---|---|---|
| esbuild | 0.28.2 | 2026-08-08 | MIT |
| jsdom | 30.1.2 | 2026-10-04 | MIT |
| canvas (opcional) | 3.2.3 | 2026-03-31 | MIT |
| d3-array | 3.2.4 | 2023-05-30 | ISC |
| d3-color | 3.1.0 | 2022-03-28 | ISC |
| d3-format | 3.1.2 | 2026-01-14 | ISC |
| d3-hierarchy | 3.1.2 | 2022-04-02 | ISC |
| d3-interpolate | 3.0.1 | 2021-06-05 | ISC |
| d3-path | 3.1.0 | 2022-12-19 | ISC |
| d3-scale | 4.0.2 | 2021-09-24 | ISC |
| d3-scale-chromatic | 3.1.0 | 2024-03-12 | ISC |
| d3-shape | 3.2.0 | 2022-12-20 | ISC |

Decisões:
1. **`jsdom@30.1.3` foi REJEITADA** (publicada em 2026-10-15, só 6 dias atrás —
   viola a regra dos 14 dias). Fixada a `30.1.2`, de 2026-10-04.
2. **`canvas` ficou em `optionalDependencies`**, não em `devDependencies`: é um
   módulo nativo que pode falhar ao compilar em outra máquina. Assim o
   `npm install` não quebra por causa dele. O smoke test funciona com ou sem
   ele (sem o canvas, os gráficos em canvas são exercitados até o ponto em que
   o contexto 2D seria necessário, e o teste confirma que não há exceção).
3. Módulos d3 ficam só como **devDependencies** e são **embutidos** no bundle
   pelo esbuild — em tempo de execução não há nenhuma dependência externa.
4. Os d3 são todos **ISC** (compatível). esbuild/jsdom/canvas são **MIT**,
   também compatível, e são apenas ferramentas de build/teste — não entram no
   `dist/`.

### Notas da etapa 3

- `format.js` converte o `value_format` do Looker (sintaxe estilo Excel) para
  `d3-format`. Testado com `#,##0`, `#,##0.00`, `$#,##0.00`, `"R$"#,##0.00`,
  `0.0%`, `0%`, `#,##0,,"M"`, `#,##0.0,"K"`, `0.00`, vazio e lixo — todos
  caem num resultado sensato (o que não reconhece usa o padrão).
- **Bug encontrado e corrigido no próprio teste:** `new Date('2026-03-05')` é
  interpretado como meia-noite UTC e, num fuso negativo (Brasil, UTC-3),
  exibia 04/03. Agora datas sem fuso explícito são montadas componente a
  componente (hora local). Ordenação temporal conferida.
- Decisão: a exibição de célula prefere SEMPRE o texto já renderizado pelo
  Looker (`rendered`); nossa formatação só entra em números que a própria
  viz calcula (totais, médias, diferenças). Isso evita divergir da conta.

### Notas da etapa 4 (decisões importantes)

1. **`registerOptions` SUBSTITUI o painel inteiro de opções** — não mescla
   com as `options` estáticas. Isso foi confirmado testando no Looker real
   (as seções estáticas sumiam do painel Edit). O adapter agora SEMPRE
   manda estáticas + dinâmicas juntas, e só dispara quando a assinatura das
   opções muda (evita loop).
2. **`abrirUrl` não usa `window.open`** (proibido pela seção 7): cria um
   `<a rel="noopener noreferrer" target="_blank">` temporário, valida que a
   URL é http(s) e dispara o clique.
3. **`atualizarConfig` (evento `updateConfig`) é "melhor esforço"**: não há
   como DETECTAR se o Looker trata esse evento. A viz nunca pode depender
   dele — o estado real mora em memória na viz; a persistência é um bônus.
   Registrado também em `docs/COMPAT.md` (etapa futura).
4. **Cross-filter (`toggleCrossfilter`/`getCrossfilterSelection`)**: existe
   na documentação, mas NÃO confirmei que funciona nesta versão. O adapter
   detecta e, se não houver, desativa o recurso com aviso — nenhum gráfico
   depende dele.
5. **`hidden_fields`**: a API clássica não documenta de forma estável.
   Procuramos em `config.hidden_fields`, `queryResponse.hidden_fields` e
   `queryResponse.fields.hidden_fields`; se nada existir, assumimos que o
   Looker já tirou os campos ocultos das listas. Testado funcionando com
   `config.hidden_fields`.
6. **Totais gerais**: procuramos `queryResponse.totals_data`,
   `queryResponse.totals` e `data.totals_data`. Se não houver, o gráfico
   calcula por conta própria (soma simples) e AVISA que é cálculo nosso —
   a API não expõe o tipo de agregação da medida (média, distinct, etc.).

Desempenho conferido: modelo + extração de série com **50.000 linhas em
~50 ms**.

### Notas da etapa 5

- `options-kit.js` traz 14 blocos reutilizáveis (Cores, Formato/rotação,
  barras, pontos e linhas, Pivô, Dados, Eixos, Rótulos, Legenda,
  Referências, Tooltip, Animação, Interação, Tema, Avançado) + geradores de
  opção dinâmica por campo/série. `montarOpcoes()` numera automaticamente a
  `order` de cada opção por faixa de seção, para o painel Edit sair sempre
  na mesma ordem lógica em todos os gráficos.
- `define-viz.js` centraliza o que nenhum gráfico deve repetir: `done()`
  sempre (inclusive em erro), montagem do modelo, validação, tema, JSON de
  configuração, cabeçalho (título/subtítulo), faixa de avisos, estado vazio,
  limpeza de listeners/timers/quadros entre atualizações e redesenho no
  resize. O gráfico só implementa `render(ctx)`.
- `interaction.js` já nasce com a correção de arraste por Pointer Events +
  `setPointerCapture` (lição de um bug real: dentro do iframe do Looker, o
  arraste com `mousemove` solto trava quando o cursor sai da área).
- Núcleo inteiro confere no import: 14 módulos carregam limpos.

### Notas da etapa 6

- Build conferido com o `_template`: bundle IIFE de 136 KB, **sem `require`
  nem `import` externo**, com d3-scale e d3-scale-chromatic **embutidos**
  (confirmado procurando `function ordinal(` e o hex `4e79a7` da paleta
  Tableau no arquivo final). Ou seja: Dependencies do Looker fica VAZIO.
- `build/checagem-seguranca.mjs` distingue CÓDIGO de COMENTÁRIO (tem um
  mini-parser de strings/comentários). Assim o próprio arquivo que
  *documenta* a lista de proibições não se auto-acusa, e os namespaces
  `http://www.w3.org/...` do SVG são permitidos por serem identificadores
  XML, não endereços buscados na rede.
- Núcleo passou na checagem: 15 arquivos, 0 violações.

### Notas da etapa 7

- **Pipeline validado de ponta a ponta** com o `_template`: bundle gerado
  pelo esbuild, carregado no jsdom como o Looker carregaria, registrado via
  `looker.plugins.visualizations.add`, com **72 opções** compostas pelo kit,
  renderizando sem exceção em 6 fixtures e chamando `done()` em todas.
- O harness roda por `file://`, e aí o navegador bloqueia `fetch` e `import`
  de módulo ES. Por isso o build gera `test/gerado/fixtures.js` e
  `test/gerado/registro.js` como scripts clássicos com variável global.
- O harness e o smoke test simulam `registerOptions` **substituindo** o
  painel inteiro (igual ao Looker real), de propósito: assim um gráfico que
  esqueça de mandar as opções estáticas junto quebra AQUI, não em produção.
- O smoke test também simula `LookerCharts.Utils` **sem** `toggleCrossfilter`,
  para exercitar o caminho "recurso não existe" do adapter.
- `canvas` nativo está disponível nesta máquina, então gráficos em canvas são
  testados com contexto 2D real.
- Ajuste no `_template`: ele declarava `aceitaPivo: true` mas lia os dados com
  `extrairSerie()`, que não entende pivô — com dados pivotados caía no estado
  vazio silenciosamente. Passou a declarar `aceitaPivo: false` e ganhou um
  comentário mostrando como ler pivô de verdade (`modelo.pivotsDeDados` +
  `chaveDoPivo`), para não ensinar o padrão errado.

### Notas da etapa 8

- `docs/COMPAT.md` ficou sendo o documento mais importante da pasta: lista
  cada método da API do Looker usado, com **nível de confiança** (confirmado
  / documentado / incerto), como confirmar, o que acontece sem ele, e o
  checklist de 8 passos para quando a versão do Looker mudar. Inclui também
  os comportamentos reais que já causaram problema (registerOptions que
  substitui o painel, arraste travando no iframe, Trusted Types em
  report-only, bloqueio de CDN pela rede da empresa).
- A ÚNICA alteração fora de `/biblioteca` foi acrescentar 16 linhas no fim do
  `README.md` da raiz (permitido pela seção 2 do prompt). Conferido com
  `git diff --cached --stat`: `README.md | 16 ++++++`.

---

## TIER 1 — gráficos

### Etapa 9 — `tabela_completa` (em andamento)

Plano de ataque (a seção 8 do prompt é grande, então vai em partes, cada uma
com commit e push):
1. **Parte 1**: estrutura — colunas, cabeçalho fixo, virtualização de linhas,
   ordenação por clique (e múltipla com shift), temas, densidade, totais.
2. **Parte 2**: tipos de célula (barra de dados, sparkline, badge, semáforo,
   estrelas, progresso, seta de variação, mini-barras) + motor de regras de
   formatação condicional.
3. **Parte 3**: campos animados (contador, barras crescendo, flash ao mudar
   de valor, entrada das linhas) + interação (busca, filtros por coluna,
   seleção com soma, copiar, exportar CSV, menu de contexto) + agrupamento
   de linhas com expandir/recolher e subtotais.

#### Parte 1 — concluída

Arquivos: `opcoes.js` (opções estáticas + geração das opções por coluna),
`colunas.js` (modelo de colunas a partir do modelo de dados), `render.js`
(desenho, virtualização, cabeçalho, rodapé, CSV) e `index.js` (`defineViz`).

O que entrou: colunas por dimensão/medida, cabeçalho fixo em dois níveis
quando há pivô, coluna de total por linha, virtualização por janela com
linhas espaçadoras, ordenação por clique (asc → desc) e múltipla com shift,
busca global, seleção de linhas com soma, redimensionamento por arraste,
exportação CSV, 8 estilos de tabela, 3 densidades e linha de totais.

Decisões desta parte (todas pelo caminho mais simples):

- **Virtualização com `<table>` de verdade**, não `div`s: duas linhas
  espaçadoras seguram a altura total e só a janela visível vira DOM. Mantém
  `colgroup`/`thead`/`tfoot` alinhados sem recalcular largura na mão.
- **Limite de 20 colunas com opções próprias** (`MAXIMO_DE_COLUNAS_
  CONFIGURAVEIS`). Com 3 regras por coluna, 60 colunas gerariam mais de mil
  opções e o painel Edit ficaria inutilizável. As colunas além do limite
  ainda aparecem na tabela; só não têm ajuste individual. A viz avisa na
  faixa de aviso quando isso acontece.
- **Formato do número**: com `formato = auto` o texto vem do `rendered` do
  Looker (respeita o `value_format` do campo). Com formato explícito, o
  nosso formatador vence. Sem essa distinção a opção "Compacto (K, M, B)"
  não faria nada.
- **Totais**: usa `totals_data` quando o Looker envia; senão calcula (soma
  por padrão, configurável) e **avisa na tela** que o cálculo é da viz, para
  ninguém confundir com o total do Looker.
- **CSV sem rede**: `Blob` + `URL.createObjectURL` + `<a download>`, com BOM
  UTF-8 para o Excel abrir acentos. Nada de `window.open` nem servidor.
- **Estado preservado entre atualizações** em `ctx.estado`: rolagem,
  ordenação, busca, seleção e larguras. Ordenações apontando para colunas que
  sumiram da consulta são descartadas.
- **Nulos**: a opção `tratamentoDeNulos` decide entre texto configurável,
  vazio ou zero. Prefixo/sufixo não entram em célula vazia (senão sobraria
  um "R$ " solto).

Defeitos achados e corrigidos antes do commit (verificação manual no jsdom,
além do smoke test):

1. Com pivô, o cabeçalho das colunas de dimensão saía **em branco** — havia
   um `<th>` único vazio com `colSpan` cobrindo todas elas. Agora cada
   dimensão tem seu próprio `<th>` com `rowSpan=2`.
2. A opção "formato do número" por coluna era ignorada (ver decisão acima).
3. `test/smoke.test.mjs` quebrava no teardown ao tentar restaurar
   `globalThis.navigator`, que é somente-leitura no Node atual e que a gente
   nunca chega a sobrescrever. Removido da lista de globais salvos.

Conferido à mão no jsdom: ordenação asc → desc, ordenação por medida, busca
com resultado e sem resultado (estado vazio), seleção com soma no rodapé da
barra, cabeçalho de dois níveis com pivô, 34 linhas no DOM para uma fixture
de 5.000, totais por coluna de pivô e por total de linha.

Números: bundle 115,1 KB; 5.000 linhas renderizadas em ~120 ms; 12/12 testes
passando; checagem de segurança sem violação.

#### Parte 2 — concluída

Arquivos novos: `regras.js` (motor de formatação condicional) e `celulas.js`
(19 tipos de célula). `index.js` passou a compor os dois no `pintarCelula`.

Decisões desta parte:

- **Estatísticas da coluna calculadas uma vez por renderização**, não por
  célula. Top N, Bottom N, percentil, acima/abaixo da média, escala de cor,
  barra de dados, medidor, semáforo e estrelas precisam do mínimo/máximo/
  média da coluna inteira. Fazer isso por célula seria O(n²).
- **Sparkline, mini barras e mini área leem a série do PIVÔ**: os valores da
  mesma medida nas várias colunas do pivô daquela linha. Sem pivô não existe
  série nenhuma e a célula cai para o texto normal — é o comportamento mais
  honesto, porque a alternativa (inventar uma série) seria mentira.
- **Toda desistência de um desenhista escreve o texto puro** (`comoTexto()`).
  Sem isso a célula ficava em branco, que foi exatamente o defeito achado.
- **Cores dos avatares em hex**, não `hsl()`: os utilitários de cor do núcleo
  (`corParaRgb`, `comOpacidade`, `textoLegivelSobre`) só entendem hex e rgb,
  e com `hsl` o texto do avatar saía ilegível.
- **A ação "Badge" de uma regra transforma a célula em badge** mesmo quando a
  coluna é de texto comum. Antes ela só tinha efeito se o tipo da coluna já
  fosse badge, ou seja: não fazia nada.

Infraestrutura de teste: o "Looker de mentira" do jsdom saiu de dentro de
`smoke.test.mjs` para `test/ambiente.mjs`, e entrou
`test/tabela_completa.test.mjs` com testes dirigidos — os 19 tipos de célula,
as 18 condições, as 8 ações, ordenar/buscar/selecionar de verdade (eventos
despachados no DOM), virtualização e cabeçalho de dois níveis. `npm test`
agora roda `test/*.test.mjs`.

Defeitos achados e corrigidos antes do commit:

1. `medidor`, `booleano`, `imagem` e `estrelas` desenhavam **célula vazia**
   quando desistiam: devolviam o texto sem nunca escrevê-lo no `<td>`.
2. `barraDeDados`, `medidor`, `semáforo` e `estrelas` não recebiam as
   estatísticas da coluna (só colunas COM regra as ganhavam), então a barra
   saía sempre cheia, o medidor vazio e as estrelas zeradas.
3. O tipo "Data" estava na lista de opções mas não tinha desenhista: a
   coluna simplesmente ignorava a escolha.
4. A ação "Badge" das regras não fazia nada fora de colunas do tipo badge.

Números: bundle 155,6 KB; 18/18 testes passando; checagem de segurança sem
violação.

#### Parte 3 — concluída (gráfico 1 do TIER 1 fechado)

Arquivo novo: `grupos.js` (agrupamento, subtotais e filtros por coluna).

Decisões desta parte:

- **Lista plana de itens visuais**: em vez de desenhar "linhas de dados", a
  tabela desenha uma lista de itens que podem ser cabeçalho de grupo ou
  linha de dados. Como todos têm a mesma altura, a virtualização continua
  valendo sem nenhuma conta especial. Foi o que permitiu agrupar sem perder
  o desempenho com 5.000 linhas.
- **O subtotal fica na PRÓPRIA linha do grupo**, não numa linha extra: assim
  ele continua visível com o grupo fechado, que é quando ele mais importa.
- **Filtro por coluna aceita comparação numérica** (`>100`, `<=5`, `=3`) em
  colunas de medida, e "contém" em texto. É a sintaxe que o usuário de
  planilha já espera, e não exige mais nenhum controle na tela.
- **Copiar usa `<textarea>` + `document.execCommand('copy')`**, não
  `navigator.clipboard`: dentro do iframe do Looker a API moderna costuma
  ser bloqueada por permissão. O método antigo é o que de fato funciona lá.
- **Piscar ao mudar de valor só na primeira pintura depois de novos dados**:
  reordenar ou buscar não faz a tabela piscar, porque o valor não mudou. O
  mapa de valores anteriores é mesclado entre atualizações, já que a
  virtualização só pinta a janela visível.
- **O menu de contexto é removido no `aoDestruir`**, porque ele vive em
  `document.body` (fora da raiz da viz) e não sairia com a limpeza normal.

Testes acrescentados: agrupar + subtotal + recolher todos os grupos, filtros
por coluna (texto e numérico) e menu de contexto abrindo/fechando.

Um detalhe que custou duas tentativas de teste: **contar linhas no DOM não
prova nada quando há virtualização** — fechar um grupo não diminui o número
de linhas, só troca quais linhas entram na janela. O teste certo é fechar
TODOS os grupos e exigir que não sobre nenhuma linha de dados.

Números: bundle 169,7 KB; 21/21 testes passando; checagem de segurança sem
violação. `tabela_completa` marcada como `[x]` em TAREFAS.md.

### Etapa 10 — `diagrama_venn` (TIER 1, item 2) — concluída

Arquivos: `geometria.js` (formas e onde cabe cada rótulo), `dados.js` (os
três formatos de entrada) e `index.js` (desenho em SVG).

Decisões:

- **SVG, não canvas**: são no máximo 5 formas. SVG dá de graça o hover por
  região, texto nítido em qualquer zoom e nada de perda de qualidade.
- **Três formatos de entrada, detectados sozinho**: (a) uma linha por região
  com a dimensão listando os conjuntos ("A", "A,B"); (b) uma linha por item
  e conjunto (duas dimensões); (c) uma coluna sim/não por conjunto. O
  usuário raramente sabe qual é o "certo", então detectamos e deixamos
  trocar à mão numa opção.
- **Posição dos rótulos encontrada por amostragem**, não fixa por layout:
  varremos a área numa grade, montamos a máscara de conjuntos de cada
  célula e pegamos o ponto de maior folga até a borda. Funciona igual para
  círculos e elipses e sobrevive a qualquer ajuste de layout.
- **O número nunca é posicionado pelo centróide**: em regiões de lua
  crescente o centróide cai FORA da própria região. O ponto de maior folga
  é sempre válido e ainda é onde o texto tem mais chance de caber.
- **Nenhum valor some**: quando o número não cabe na região (inevitável em
  Venn de 4 e 5), ele vai para uma lista no canto com o nome da região.
  Antes de desistir, a fonte é reduzida até 7px.
- **Acima de 5 conjuntos a viz avisa** e desenha os 5 primeiros, em vez de
  desenhar algo errado ou não desenhar nada.

Os layouts de 4 e 5 elipses foram **conferidos numericamente**: o de 5 saiu
com 26 das 31 regiões na primeira tentativa (uma construção de 72° que eu
tinha montado na mão), e só fechou 31/31 com os parâmetros clássicos e o
sinal da rotação invertido. O de 4 passou por uma busca que maximizou a
MENOR região. Esse teste virou permanente em `test/diagrama_venn.test.mjs`,
porque é um erro que não aparece na tela: a região some e o valor some junto.

Correção no harness que vale para TODOS os gráficos: o jsdom não faz layout,
então todo elemento mede 0×0 e `medir()` caía no piso de 160×120. Em tile
desse tamanho nenhum rótulo cabe e as escalas degeneram — o teste deixava de
parecer com o Looker. `test/ambiente.mjs` agora finge um tile de 900×560.
Foi isso que revelou que o Venn só estava rotulando 1 ou 2 regiões.

Também ajustado: o teste de fumaça agora aceita que um gráfico com
`aceitaPivo: false` reporte erro na fixture `comPivo` — recusar o pivô com
mensagem clara é a resposta certa, não uma falha.

Números: bundle 131,6 KB; 43/43 testes passando; checagem de segurança sem
violação.

### Etapa 11 — `quadrant_scatter` (TIER 1, item 3) — concluída

Entrou junto um módulo de núcleo novo: **`src/core/eixos.js`**. Quase metade
dos gráficos que faltam é cartesiana, então margens, ticks, grade, títulos e
rótulos girados agora moram num lugar só, com as opções do `blocoDeEixos`.
A ordem de uso resolve o ovo-e-galinha de sempre: `calcularMargens()` recebe
os TEXTOS dos rótulos (não as escalas), depois as escalas usam o espaço que
sobrou, e só então `desenharEixos()`.

Decisões do gráfico:

- **Canvas para os pontos, SVG por cima para o resto.** Com 5.000 pontos o
  canvas desenha numa passada; 5.000 elementos SVG travariam o tile. Eixos,
  divisórias e rótulos continuam em SVG, então o texto segue nítido e
  selecionável. São três camadas empilhadas: SVG do fundo dos quadrantes,
  canvas dos pontos, SVG de tudo que é texto e linha.
- **Divisórias configuráveis** por média, mediana, ponto médio, zero ou
  valor fixo — e "não mostrar", que desliga os quadrantes sem desligar o
  gráfico.
- **Quadrante sem espaço na tela não recebe rótulo**: quando a divisória
  encosta na borda, o nome ficaria por cima do eixo.
- **Tamanho do ponto por ÁREA**, não por raio: dobrar o raio quadruplica a
  mancha e engana quem lê.
- **Rótulos nos pontos mais distantes do cruzamento**, que são os extremos
  — os que alguém de fato quer identificar.

Mudança no contrato do teste de fumaça (vale para todos os gráficos): antes
ele exigia zero erros em TODAS as fixtures básicas. Isso está errado — uma
dispersão não tem o que fazer com uma consulta de uma medida só, e recusar
com mensagem clara é a resposta certa. Agora a regra é: **nas fixtures que o
gráfico DECLARA em `config/charts.json` ele tem que desenhar sem erro**; nas
outras, pode recusar, desde que o erro tenha título e mensagem explicativa.

Números: bundle 172,6 KB; 61/61 testes passando; checagem de segurança sem
violação.

### Etapa 12 — `matriz_2x2` e `matriz_bcg` (TIER 1, itens 4 e 5) — concluídas

Antes de escrever os dois, o desenho do `quadrant_scatter` foi extraído para
**`src/charts/_quadrantes/`** (prefixo `_` pela mesma convenção de
`_template`: código compartilhado, não gráfico registrado). Os três gráficos
são o mesmo desenho com convenções diferentes, e três cópias quase iguais
iriam divergindo a cada correção. Depois do refactor, `quadrant_scatter`
caiu para ~65 linhas e os 61 testes continuaram passando sem nenhuma
alteração de comportamento.

Cada gráfico entrega só o seu PERFIL: nomes padrão dos quadrantes, cortes
padrão e ganchos opcionais (`ajustarPontos`, `ajustarConfig`).

- `matriz_2x2`: corte no PONTO MÉDIO (e não na média) — numa matriz de
  decisão o leitor espera "metade da escala", não "acima da média do
  grupo". Bolhas maiores e TODOS os itens nomeados.
- `matriz_bcg`: eixo X em log e invertido (participação alta à esquerda,
  como na matriz original), corte em 1, nomes clássicos.

Decisão importante da base: **o quadrante é decidido pela posição em PIXEL,
não pelo valor**. É isso que faz os nomes da BCG caírem nos lugares certos
mesmo com o eixo invertido — sem nenhum caso especial.

Três defeitos reais encontrados ao montar as matrizes:

1. **`src/core/eixos.js` lia nomes de opção que o options-kit não cria**
   (`tituloDoEixoX`, `mostrarGradeHorizontal`, `rotacaoDosRotulosX`). Ou
   seja: título dos eixos e grade do painel eram silenciosamente ignorados
   em qualquer gráfico cartesiano. Os nomes certos são `tituloEixoX`,
   `gradeEixoY`, `rotacaoRotuloEixoX`.
   Quem pegou isso foi o `comDefaults()` novo, que AVISA no console quando a
   opção não existe — valeu a pena ter escrito esse aviso.
2. **A participação relativa da BCG estava dividindo pelo maior valor**, o
   que põe o líder exatamente em 1,0 — colado na divisória — e deixa o lado
   "participação alta" VAZIO. A definição do BCG é "minha fatia ÷ fatia do
   MAIOR CONCORRENTE": o líder divide pelo segundo colocado e fica acima de
   1; todo o resto divide pelo líder e fica abaixo.
3. **Com escala log, 1 só cai no meio se o domínio for [1/k, k]**. Sem isso
   a divisória encostava na borda e dois dos quatro quadrantes nem eram
   rotulados (o rótulo é suprimido de propósito quando a faixa é estreita
   demais, para não escrever por cima do eixo). A BCG agora monta esse
   domínio simétrico sozinha, e o usuário pode desligar.

`comDefaults(opcoes, novosPadroes)` entrou no options-kit: deixa um gráfico
reaproveitar um bloco mudando só o valor inicial, sem mexer no bloco
original (o que quebraria os outros gráficos).

Números: 5 gráficos construídos; 90/90 testes passando; checagem de
segurança sem violação.

### Etapa 13 — `theme_river` (TIER 1, item 6) — concluída

Entrou junto outro módulo de núcleo: **`src/core/series.js`**, que transforma
o modelo numa matriz "categorias × séries". É a peça que faltava: o
`extrairSerie` do data-model é de série ÚNICA e cego a pivô (foi o que
derrubou o `_template` lá atrás), e praticamente todo gráfico de linha,
área, barra empilhada, ranking ou fluxo precisa de várias séries alinhadas.

O Looker entrega séries de três jeitos bem diferentes, e o módulo cobre os
três detectando sozinho: do **pivô**, da **2ª dimensão** ou **uma por
medida**. A saída é sempre `series[i].valores[j]` já alinhado à categoria
`j`, com `null` onde não há valor — é isso que permite empilhar e
interpolar sem cada gráfico reinventar o alinhamento.

Decisões:

- **Séries além do limite viram "Outros", somadas**, não descartadas. Jogar
  fora mudaria os totais sem o leitor ter como saber. Há teste garantindo
  que a soma não muda ao agrupar.
- **Interpolar não inventa nas pontas**: repete o vizinho existente em vez
  de extrapolar.
- No ThemeRiver, **o eixo Y vem desligado por padrão** — num streamgraph a
  base flutua e o Y não significa nada; mostrá-lo seria mentir.
- **O nome da série só é escrito onde a faixa é mais grossa**, e só se
  couber (mínimo de 14px). Senão fica a legenda.

Duas peças de infraestrutura que faltavam e entraram agora:

- `ctx.redesenhar()` no `define-viz`: redesenha com os MESMOS dados e o
  estado atualizado, limpando os listeners antes. É o que a legenda
  interativa precisa — sem isso, cada clique empilharia mais um conjunto de
  listeners.
- `alternar(chave)` no controle de séries desligadas do `interaction.js`.

Números: 6 gráficos construídos; 108/108 testes passando; checagem de
segurança sem violação.

### Etapa 14 — `funil_variacoes` e `funil_comparativo` (TIER 1, itens 7 e 8)

Como combinado, a base comum (`src/charts/_funil/`) saiu ANTES do segundo
gráfico, não depois: leitura das etapas, cálculo das conversões e desenho
de um funil dentro de um retângulo.

Decisões:

- **As etapas vêm de dois jeitos**: uma linha por etapa (dimensão + medida)
  ou uma medida por etapa (quando o Explore já traz "visitas, cadastros,
  compras" como colunas). Detectado sozinho, trocável à mão.
- **Funil que SOBE no meio gera aviso**, não erro: não é bug nosso nem dado
  inválido, mas quase sempre significa que a consulta não está na ordem
  certa — e o usuário tem a opção de ordenar.
- **Nome da etapa fica FORA do funil, à esquerda.** Dentro, ele brigaria
  com o valor justamente nas etapas mais estreitas, que são as de baixo.
- **No estilo "área" as etapas se encostam** (espaço forçado a zero e sem
  contorno), senão o afunilamento vira degrau.
- No comparativo, **todos os funis compartilham a mesma escala por padrão**.
  Normalizar cada um pelo próprio topo compara TAXAS, mas esconde que um
  segmento é dez vezes maior que o outro. As duas formas estão disponíveis;
  a honesta é o padrão.
- Acima de 8 segmentos o comparativo avisa e corta, em vez de desenhar
  dezenas de funis ilegíveis.

Dois defeitos meus, pegos antes do commit:

1. O comparativo chamava `lerEtapas` **sem a chave do pivô**, então todos os
   segmentos sairiam com valores IDÊNTICOS — bonito e errado, o pior tipo.
   Virou o primeiro teste do arquivo.
2. A "escala comum" estava implementada como um fator por etapa que o
   desenhista simplesmente ignorava. Trocado por um parâmetro explícito
   (`maximoDeReferencia`) no `desenharFunil`.

Também aprendi a não escrever teste que indexa elementos assumindo que
todos os funis têm o mesmo número de etapas — com dados reais não têm. O
teste da escala agora conta quantas etapas "enchem a caixa", o que não
depende disso.

Números: 8 gráficos construídos; 135/135 testes passando; checagem de
segurança sem violação.

### Etapa 15 — `gauge_variacoes` e `gauge_grid` (TIER 1, itens 9 e 10)

Base comum em `src/charts/_medidor/`: cinco estilos (arco de 270°,
semicírculo, círculo, barra linear e bullet), faixas coloridas, alvo e
agulha.

O assunto central deste par não é o desenho, é a **escala**. Um medidor é o
gráfico mais fácil de usar para enganar: a mesma agulha no mesmo lugar
significa coisas diferentes conforme o mínimo e o máximo. Tentei duas
abordagens antes de chegar na que ficou:

1. Escala dos valores POR LINHA. Com agregação por soma, o total passa de
   qualquer linha e o ponteiro fica sempre encostado no máximo.
2. Escala do próprio valor exibido. Aí o ponteiro marca sempre 100%.

Nenhuma das duas é honesta, porque com UM número não existe escala
derivável. A ordem que ficou vai atrás de uma referência que o usuário
realmente definiu: limites fixos → alvo (com 25% de folga) → maior faixa
configurada → e, se não houver nada disso, o gráfico **avisa na tela** que
não tem escala definida, em vez de fingir que tem.

Outras decisões:

- Com várias linhas, o medidor **diz na tela qual agregação usou**. Mostrar
  silenciosamente a primeira linha seria um jeito fácil de enganar.
- Na grade, **todos os medidores compartilham a mesma escala por padrão**.
  Cada um na própria escala faria todos parecerem iguais, o contrário do
  que se quer ao comparar.
- O semicírculo baixa o centro e aumenta o raio; senão metade da caixa
  ficaria vazia.

Mais um defeito corrigido: quando a medida do valor ainda não tinha sido
escolhida no painel (primeira renderização), o alvo "segunda medida" caía na
MESMA medida do valor — e o medidor mostrava sempre "100% do alvo". Agora a
comparação é com a medida já resolvida, não com a opção crua.

Números: 10 gráficos construídos; 164/164 testes passando; checagem de
segurança sem violação.

### Etapa 16 — `arvore_radial` e `arvores_multiplas` (TIER 1, itens 11 e 12)

Mais um módulo de núcleo: **`src/core/hierarquia.js`**, que monta uma árvore
a partir das duas formas que o Looker entrega — várias dimensões aninhadas
(uma coluna por nível, cada LINHA é um caminho da raiz à folha) ou pares
id/superior (uma linha por nó). Detecta sozinho e deixa trocar à mão.

A detecção **não confia no nome das colunas** (que muda de modelo para
modelo): procura um campo sem valores repetidos cujos valores sejam
apontados por outro campo. Isso é o que caracteriza um par id/pai.

O que esse módulo trata de propósito, em vez de ignorar:

- **Ciclos.** Um nó que é seu próprio ancestral trava o layout do d3 sem
  mensagem nenhuma. Cortamos a ligação, penduramos o nó na raiz e avisamos.
- **Superior inexistente.** O nó sumiria da tela em silêncio. Também vai
  para a raiz, com aviso.
- **Poda por profundidade.** O valor dos níveis cortados SOBE para o nó que
  ficou, então o total não muda — há teste garantindo isso.

Base de desenho em `src/charts/_arvore/`, com layout radial e horizontal,
três formas de ligação (curva, cotovelo, reta) e tamanho de nó por valor.

Um detalhe que custou uma rodada: o `d3.hierarchy` procura `children`, e os
nossos nós guardam os filhos em `filhos`. Sem passar o acessor, a árvore
inteira virava um nó só — e sem erro nenhum, o que é o pior jeito de
falhar. Hoje isso está comentado no código e coberto por teste.

Decisões dos dois gráficos:

- Na árvore radial, o texto das folhas acompanha o raio e **vira de cabeça
  para baixo na metade esquerda**, senão fica ilegível.
- Em `arvores_multiplas`, cada ramo vira a RAIZ de uma árvore própria. Usar
  o nó original faria o layout do d3 reservar espaço para os irmãos que não
  estão naquela célula.
- A cor de um ramo sai da árvore inteira, não da mini-árvore: assim o mesmo
  ramo tem a mesma cor nos dois gráficos.
- Tamanho dos nós com referência comum por padrão (mesmo argumento do funil
  comparativo e da grade de medidores).

Números: 12 gráficos construídos; 198/198 testes passando; checagem de
segurança sem violação.

### Etapa 17 — `org_chart` (TIER 1, item 13) — TIER 1 OBRIGATÓRIO COMPLETO

Reaproveita `core/hierarquia.js`, mas NÃO reaproveita `_arvore/`: um
organograma pede cartões retangulares, não círculos. O que importa ali é
texto (nome, cargo, tamanho da equipe), e texto precisa de uma caixa com
largura previsível — um círculo dimensionado por valor empurraria o nome
para fora e ainda faria o leitor comparar áreas, que não é a pergunta.

Decisões:

- **O layout roda sobre a árvore VISÍVEL**, depois de recolher, e não sobre
  a completa: senão ficaria um buraco no lugar dos nós escondidos.
- **Valores e contagens saem da árvore COMPLETA.** Um gestor recolhido
  continua mostrando quantas pessoas tem abaixo — se saísse da árvore
  visível, pareceria não ter ninguém. Tem teste para isso.
- **A identidade de um nó entre renderizações é o CAMINHO de chaves da raiz
  até ele**, não a referência do objeto: a árvore é remontada a cada
  desenho e as referências mudam. Esse mapa é montado numa passada só, para
  o acessor de filhos do d3 consultar em O(1) — procurar o caminho nó a nó
  deixaria o desenho quadrático.
- `nodeSize` em vez de `size`: o organograma cresce e a área rola, em vez
  de ser espremido para caber na tela.

Com isso o **TIER 1 obrigatório está fechado** (13 de 14; o item 14,
`upset_plot`, está marcado como opcional no próprio prompt).

Números: 13 gráficos construídos; 213/213 testes passando; checagem de
segurança sem violação.

#### Balanço do TIER 1

Cinco módulos de núcleo nasceram do trabalho e servem a tudo que vem pela
frente: `eixos.js`, `series.js`, `hierarquia.js`, mais `comDefaults()` e
`ctx.redesenhar()`. Quatro bases compartilhadas entre gráficos irmãos:
`_quadrantes`, `_funil`, `_medidor`, `_arvore`.

O padrão que mais rendeu: **extrair a base ANTES de escrever o segundo
gráfico da família**, não depois. Toda vez que fiz isso, o segundo gráfico
saiu em um terço do tempo e os defeitos apareceram uma vez só.

### Etapa 18 — `upset_plot` (TIER 1, item 14) — TIER 1 COMPLETO, 14/14

Reaproveita o `dados.js` do `diagrama_venn`, que já entendia os três
formatos de conjuntos. Uma barra por interseção, ordenada por tamanho, e
embaixo a matriz de pontos dizendo quais conjuntos formam cada uma.

A linha ligando os pontos de uma coluna não é enfeite: sem ela o olho
precisa conferir ponto a ponto qual conjunto participa.

Defeito encontrado ao ligar os dois: o limite de 5 conjuntos estava
**cravado dentro do leitor** (`Math.min(5, ...)`), quando na verdade é uma
restrição do VENN — acima de 5 conjuntos o diagrama de Venn deixa de
existir. O UpSet foi feito exatamente para esse caso, então herdar o limite
tirava dele o motivo de existir. O teto virou parâmetro de quem chama: o
Venn passa 5, o UpSet passa 20.

Vale registrar como o defeito apareceu: o teste "aguenta mais de 5
conjuntos" falhou mostrando 7 interseções onde deviam ser 10. Sem esse
teste, o gráfico entregaria silenciosamente um recorte dos dados.

Também acertei o padrão de `medirPor` para contagem de itens, igual ao
Venn — sem isso os dois gráficos mostrariam números diferentes para a mesma
consulta.

**TIER 1 COMPLETO: 14 de 14.**

Números: 14 gráficos construídos; 231/231 testes passando; checagem de
segurança sem violação.

---

## Sessão retomada em 2026-10-22

Ponto de partida conferido antes de mexer em qualquer coisa:
`git fetch` + `git status` + `git log -5`. Branch `agente/novas-viz`,
`origin/main` SEM commits novos além do que o branch já tem (conferido com
`git log origin/main ^HEAD`, que veio vazio) — então não houve merge a
fazer.

Havia trabalho não commitado da sessão anterior, e ele estava **completo**,
não pela metade: o `candlestick_ohlc` (gráfico, registro e bundle), o ajuste
em `core/eixos.js` e o arquivo de testes. O que faltava era um teste
falhando por asserção mal calibrada — descrito abaixo. Terminei em vez de
descartar.

### Etapa 19 — `candlestick_ohlc` (TIER 2, item 15)

Velas japonesas, barras OHLC ou só a linha de fechamento, com média móvel
opcional e faixa de volume.

Decisões:

- **O eixo Y não começa em zero, de propósito.** Num gráfico de preço o que
  importa é a variação; forçar o zero achataria todas as velas numa faixa
  fina. É a única família de gráficos da biblioteca em que isso vale.
- **O domínio do eixo sai de todas as MÁXIMAS e MÍNIMAS**, não dos
  fechamentos: senão os pavios saem cortados. Há teste para isso.
- **O volume vai numa faixa com escala PRÓPRIA.** Volume e preço no mesmo
  eixo não querem dizer nada.
- **Máxima menor que mínima é dado inconsistente, não erro de desenho**: os
  dois valores são trocados, o período continua aparecendo e o usuário é
  avisado uma vez só.
- Acima de 400 períodos as velas vão para canvas; abaixo disso, SVG.

Correção no núcleo que vale para TODOS os gráficos de banda
(`core/eixos.js`): com eixo de categorias, havia um rótulo por categoria —
120 dias viravam 120 datas sobrepostas e ilegíveis. Agora o eixo pula de N
em N, com N calculado pela largura que o maior rótulo precisa. Na fixture
`ohlc` saiu de 120 rótulos para 9.

O teste que ficou falhando da sessão anterior era meu, não do gráfico: ele
contava "formas no total > 10", e o estilo "linha" desenha UM caminho e mais
nada — ou seja, a asserção reprovava o comportamento certo. Reescrito com
uma expectativa por estilo (o candlestick tem um corpo por período, o OHLC
usa traços e não retângulos, a linha tem um caminho que passa por todos os
períodos). Fica a lição: **contagem genérica de elementos não é teste**,
porque não distingue "desenhou pouco" de "desenhou o que devia".

Números: 15 gráficos construídos; 249/249 testes passando; checagem de
segurança sem violação.

### Etapa 20 — `linha_bandas` (TIER 2, item 16)

Linha central com faixa de incerteza em volta. A banda vem de quatro
lugares, e a diferença entre eles muda o que o gráfico AFIRMA:

- **três medidas** da consulta — único modo em que a banda é um dado;
- **percentual fixo** (±X%) — ilustração, não medição;
- **desvio padrão** da própria série — cálculo nosso;
- **mín/máx entre as séries do pivô**, com a linha sendo a média delas.

Decisão que considero a mais importante deste gráfico: **quando a banda é
calculada e não medida, o gráfico diz isso na tela**, numa nota no canto.
Uma faixa de ±10% desenhada sem ressalva passa por intervalo de confiança —
e aí o gráfico está afirmando uma precisão que ninguém mediu. Tem teste
exigindo a nota nos modos "percentual" e "desvio", e exigindo a AUSÊNCIA
dela quando a banda vem de três medidas.

- **Limite inferior acima do superior**: os dois são trocados, a banda
  continua saindo e o usuário é avisado. Escolher os campos ao contrário é
  fácil; desenhar uma banda invertida em silêncio é que não pode.
- **O padrão automático ordena as três medidas pela MÉDIA**, em vez de
  pegá-las por posição. Por posição, a fixture `ohlc` (abertura, máxima,
  mínima) sairia com a banda invertida já na primeira renderização,
  recebendo o usuário com um aviso de erro que era nosso, não dele.

Defeito achado de raspão: `theme_river` oferecia a curva `catmullRom`, mas o
nome registrado em `core/shapes.js` é `catmull` — então a opção caía no
padrão silenciosamente e não fazia nada. Corrigido nos dois gráficos.

Números: 16 gráficos construídos; 267/267 testes passando; checagem de
segurança sem violação.

### Etapa 21 — `drawdown` + `_serie_temporal` (TIER 2, item 17)

Como combinado, a base saiu no SEGUNDO gráfico da família:
**`src/charts/_serie_temporal/`** reúne a cena que `linha_bandas`,
`drawdown`, `retorno_acumulado` e `fluxo_caixa` montam igual — eixo de
categorias com rótulo de data, escalas, guia vertical no hover e tooltip que
fala do PERÍODO inteiro, não de uma marca solta.

O drawdown mostra quanto a série está abaixo do próprio máximo histórico. É
o gráfico que responde "qual foi o pior tombo e quanto tempo levou para
voltar" — duas perguntas que uma linha de valor absoluto esconde.

Decisões:

- **Topo não positivo não vira percentual.** A conta `valor / topo - 1`
  exige topo positivo; com topo zero ou negativo o período sai NULO, em vez
  de produzir um número plausível e inventado. Em valor absoluto a conta
  continua valendo, e os dois casos têm teste.
- **O zero está sempre no domínio do eixo**: ele é a linha do topo
  histórico, a referência contra a qual todo o resto é lido.
- **Períodos fora de ordem geram aviso.** O drawdown é cumulativo: um erro
  de ordem contamina todos os períodos seguintes e o desenho continua
  plausível. Só dá para checar quando a dimensão é de data — com categorias
  de texto não existe "ordem certa".
- **Com várias séries, a nota da pior queda diz de QUAL série fala.** A pior
  queda é a pior entre todas, e costuma ser a de maior amplitude (volume,
  por exemplo), não a principal. Sem o nome, o leitor atribui à série
  errada — foi o que vi acontecer na fixture `ohlc`.
- Série que nunca recuperou não ganha data de recuperação inventada.

Defeito corrigido na base: sem legenda, ninguém limpava a raiz antes de
desenhar (com legenda, quem limpa é o `criarLayoutComLegenda`). A ordem
também importa — limpar DEPOIS de injetar o estilo levaria junto o `<style>`
recém-criado.

Dois erros meus nos testes, ambos pegos pela suíte: uma expectativa de
drawdown absoluto escrita errada (`2 - 0` no lugar de `0`, num período que
estabelece topo novo).

Números: 17 gráficos construídos; 287/287 testes passando; checagem de
segurança sem violação.

### Etapa 22 — `retorno_acumulado` (TIER 2, item 18)

Cada série é reescalada para começar no mesmo ponto (100, por padrão). A
partir daí o gráfico deixa de comparar VALORES e passa a comparar
CRESCIMENTO: uma loja que fatura 5 mil e outra que fatura 5 milhões ficam
lado a lado, e o que se lê é quem cresceu mais.

Reescalar é fácil de fazer errado de um jeito que continua bonito — a série
sai com números plausíveis e sem sentido. As três armadilhas, todas com
teste:

1. **A base é o primeiro valor NÃO NULO** de cada série. Usar o primeiro
   período cru faria a série inteira virar nula quando ele falta.
2. **Base zero ou negativa impede a normalização.** Dividir por ela produz
   um índice sem significado, então a série fica de fora COM aviso dizendo
   quais sumiram — em vez de aparecer com valor falso.
3. **Séries que começam em períodos diferentes não são comparáveis sem
   ressalva.** Partir do mesmo VALOR em momentos diferentes não é a mesma
   coisa que partir do mesmo ponto. O gráfico avisa quando isso acontece e
   oferece o modo "primeiro período em que TODAS têm valor", que alinha de
   verdade.

Detalhe de desenho: o rótulo no fim de cada linha empurra para baixo quando
colidiria com outro já posicionado. Com várias séries terminando perto, os
textos se sobrepõem e nenhum fica legível.

Erro meu no teste, pego pela suíte: comparei floats com `deepEqual`, e
`1100/1000*100` dá `110.00000000000001`. A asserção reprovava a conta certa.
Virou comparação com tolerância — vale para qualquer teste numérico daqui
para a frente.

Números: 18 gráficos construídos; 307/307 testes passando; checagem de
segurança sem violação.

### Etapa 23 — `fluxo_caixa` (TIER 2, item 19)

Barras de entradas (para cima) e saídas (para baixo) por período, com a
linha do saldo ACUMULADO por cima. As duas informações respondem perguntas
diferentes: a barra diz como foi o mês, a linha diz se o caixa aguenta. Os
períodos em que o saldo fica negativo ganham faixa de destaque e aparecem no
resumo do rodapé — é o que o leitor realmente procura aqui.

Antes de escrever o gráfico, `avisarSeForaDeOrdem` subiu do `drawdown` para
o `_serie_temporal/`, como estava previsto no LOG. O aviso vale para todo
cálculo cumulativo, e copiá-lo seria o começo da divergência entre os dois.

Decisões sobre SINAL, que é onde este gráfico erra feio e em silêncio:

- **Saídas costumam vir positivas no modelo** ("Despesas: 1.200"), e
  desenhar para baixo exige sinal negativo. Mas inverter o que JÁ vem
  negativo criaria uma entrada fantasma e o saldo subiria quando deveria
  cair. Por isso a opção "a medida de saídas vem positiva" usa
  `-Math.abs()` e o caminho contrário usa `Math.min(0, v)` — nunca uma
  inversão cega. Tem teste para os dois casos.
- **Modo de medida única com sinal**: positivo entra, negativo sai.
- **Saldo inicial inválido vira zero**, não NaN — um NaN contaminaria todos
  os períodos seguintes e a linha sumiria sem explicação.

Erro meu no teste: montei um caso com UM período só, e a base de série
temporal exige dois para montar um eixo. O teste quebrou com `null`, não o
gráfico — a produção checa antes. Corrigido no teste.

Números: 19 gráficos construídos; 326/326 testes passando; checagem de
segurança sem violação.

### Etapa 24 — `pareto` + eixo secundário no núcleo (TIER 2, item 20)

Barras ordenadas da maior para a menor com a linha de percentual acumulado
no eixo da direita e a marca dos 80%.

Entrou no `core/eixos.js` o suporte a **eixo secundário**
(`desenharEixoSecundario` + `espacoParaEixoSecundario`), que faltava e vai
servir a qualquer gráfico que combine duas unidades no mesmo plano.

Decisões:

- **O eixo do acumulado vai sempre de 0 a 100%**, nunca ao intervalo dos
  dados. É o que dá sentido à marca do corte e permite comparar dois
  Paretos lado a lado.
- **Valores negativos geram aviso.** O Pareto pressupõe valores positivos:
  com negativos o acumulado deixa de ser crescente e "80% do total" não
  quer dizer nada. O gráfico avisa em vez de desenhar algo plausível.
- **A nota do rodapé traduz o gráfico numa frase** ("10 de 20 categorias
  respondem por 83% do total"). É a conclusão que a pessoa vai repetir na
  reunião; deixá-la implícita no desenho é desperdiçar o gráfico.

Defeito achado na verificação: o balde **"Outros" ia fixo para o fim** e,
sendo grande, quebrava a ordem decrescente — e com ela a monotonicidade da
linha acumulada, que é justamente o que sustenta a leitura dos 80%. Na
fixture `grande5k` (2.001 categorias com limite de 20), "Outros" somava
1.981 categorias e virava a maior barra, jogada no fim.

A correção foi devolver "Outros" à ordenação. E, quando ele cai entre as
maiores barras, o gráfico avisa que o limite está escondendo a estrutura
dos dados — porque aí o problema não é a ordem, é o recorte.

Números: 20 gráficos construídos; 345/345 testes passando; checagem de
segurança sem violação.

### Etapa 25 — `lorenz_gini` (TIER 2, item 21)

Curva de Lorenz com a linha de igualdade e o coeficiente de Gini em
destaque. Usa os mesmos dados do Pareto com duas diferenças: a ordenação é
CRESCENTE (o Pareto é decrescente) e o que interessa é a forma da curva
inteira, não as primeiras barras.

Decisões:

- **Gini por TRAPÉZIOS sobre a curva, em O(n).** A fórmula de pares
  (`Σ|xi − xj|`) dá o mesmo número mas é O(n²) e travaria com 5.000
  categorias. Medido: 2.000 categorias em 20 ms.
- **Os dois eixos vão de 0 a 1**, sempre. A curva de Lorenz vive num
  quadrado unitário; qualquer outro domínio distorce a leitura da diagonal,
  que é a referência do gráfico.
- **Negativos ficam de fora, com aviso.** Com eles a curva deixa de ser
  monótona e a área entre curva e diagonal perde significado.
- **O número vem acompanhado de leitura em palavras** ("concentração
  moderada") e dos marcos práticos ("os 10% maiores concentram 22,8%").
  Gini é um índice que pouca gente converte em intuição sozinha.

Sobre os testes: um Gini errado produz um número plausível, então conferir
"desenhou alguma coisa" não serviria. Os testes usam os VALORES TEÓRICOS
conhecidos — igualdade perfeita dá 0; concentração total em n categorias dá
exatamente `1 − 1/n`; a sequência 1..n dá `(n−1)/(3n)`; o par [1,3] dá
0,25. Todos conferidos, inclusive o teto discreto para n = 4, 10 e 50.

Números: 21 gráficos construídos; 364/364 testes passando; checagem de
segurança sem violação.

### Etapa 26 — `treemap_carteira` (TIER 2, item 22)

Retângulos proporcionais ao TAMANHO e coloridos por uma SEGUNDA medida numa
escala divergente. É o mapa de calor de carteira: o tamanho diz quanto
pesa, a cor diz como foi.

Duas escolhas de cor que mudam a leitura:

- **Centrada em ZERO, não no intervalo dos dados.** Centrar na média faria
  uma carteira inteira no vermelho aparecer metade verde — o gráfico
  afirmaria o contrário do que os dados dizem.
- **Limite SIMÉTRICO** (o mesmo para os dois lados). Com limite
  assimétrico, +2% e −2% ganham intensidades diferentes e o olho compara
  errado. Valores além do limite saturam, em vez de estourar a escala.

Defeito encontrado na verificação, e bem feio: com a fixture `grande5k`
(2.000 posições) o treemap usava **4,2% da área**. A culpa não era dos
retângulos, era das FAIXAS DE TÍTULO: 2.000 grupos × 16px consumiam a tela
inteira antes de sobrar espaço para o conteúdo.

Duas correções:

1. **Poda por número de retângulos** (150 por padrão): as maiores posições
   aparecem e o resto vira um bloco "Outros" que preserva o total — há
   teste garantindo que o total não muda. Depois da poda: 98,6% da área
   ocupada.
2. **A faixa de título só é desenhada com até 40 grupos.** Acima disso ela
   deixa de informar e passa a ocupar.

Vale registrar que esse é o **terceiro gráfico a precisar do aviso de
valores negativos** (depois de `pareto` e `lorenz_gini`), cada um por um
motivo diferente: aqui a área de um retângulo não pode ser negativa. Como os
motivos e os textos divergem, mantive separados em vez de forçar um helper
comum — anotado caso um quarto caso apareça.

Erro meu nos testes: montei um modelo falso que mapeava valores por índice
de linha de um jeito desalinhado, e o teste reprovava a conta certa.
Trocado por um auxiliar pequeno e explícito.

Números: 22 gráficos construídos; 385/385 testes passando; checagem de
segurança sem violação.

### Etapa 27 — `ponte_variacao` (TIER 2, item 23)

Waterfall: barras flutuantes ligando um valor inicial a um final, com cada
contribuição no caminho.

O erro clássico do waterfall é tratar todas as barras igual. São dois tipos,
e confundi-los inverte a leitura sem estragar o desenho:

- **contribuições FLUTUAM** — começam onde a anterior terminou;
- **totais são ANCORADOS no zero** — representam um nível, não uma
  variação. Um total no meio redefine o acumulado, o que é o que permite
  montar pontes com subtotais.

A segunda decisão: **o gráfico confere se a ponte FECHA**. A soma das
contribuições tem que bater com a diferença entre o total inicial e o
final. Quando não bate, desenha assim mesmo — mas avisa e mostra o resíduo.
Uma ponte que não fecha está escondendo alguma etapa, e esconder a
inconsistência seria pior do que mostrá-la.

Detalhe que evita um aviso inútil: a conferência usa **tolerância
relativa**, não igualdade exata. Comparar floats com zero acusaria
desencontro em qualquer consulta com centavos, e o usuário aprenderia a
ignorar o aviso — que é como um aviso morre.

Números: 23 gráficos construídos; 403/403 testes passando; checagem de
segurança sem violação.

### Etapa 28 — `risco_retorno` (TIER 2, item 24) — TIER 2 COMPLETO

Dispersão com risco no X e retorno no Y, construída sobre
`src/charts/_quadrantes/` em vez de refazer: o que muda é a semântica dos
eixos e a reta de referência. A base passou a devolver também o `svg`, para
quem precisar desenhar POR CIMA dos pontos.

A decisão que define o gráfico: **a leitura certa é a INCLINAÇÃO, não a
altura**. Um ativo que rendeu mais porque arriscou muito mais parece melhor
num gráfico sem referência. Por isso a reta de Sharpe sai da taxa livre de
risco e atravessa o gráfico inteiro: tudo acima dela tem relação melhor,
tudo abaixo, pior.

- **Risco zero ou negativo fica sem Sharpe**, com aviso: a conta divide
  pelo risco, e inventar um número ali seria pior do que o ponto não ter
  índice. Esses pontos continuam no gráfico, mas não disputam o "melhor".
- **A taxa livre de risco não é detalhe de configuração**: tem teste
  mostrando a liderança TROCANDO de ativo quando ela passa de 0 para 10%.

Erro meu no teste, pego pela suíte: escrevi a asserção invertida (esperava
B onde a conta dá A). O comentário ao lado já dizia os números certos — a
asserção é que não os seguia. Reescrito para expressar justamente a troca
de liderança, que é o caso interessante.

**TIER 2 COMPLETO: 10 de 10 gráficos financeiros.**

Números: 24 gráficos construídos; 422/422 testes passando; checagem de
segurança sem violação.

#### Balanço do TIER 2

Além dos dez gráficos, o tier deixou no núcleo: `_serie_temporal/` (base
das séries), eixo secundário em `core/eixos.js`, o aviso de ordem para
cálculos cumulativos e o afinamento dos rótulos de eixo de banda — que
sozinho corrigiu um defeito presente em TODOS os gráficos de categoria.

O padrão que se repetiu em quase todos: **o gráfico precisa dizer o que não
dá para ver**. Banda calculada que se declara ilustrativa, ponte que avisa
quando não fecha, medidor que admite não ter escala, Pareto que denuncia o
próprio limite, drawdown que exige ordem. Em todos esses casos o desenho
continuaria plausível sem o aviso — e seria mentira.

## TIER 3 — estatística

### Etapa 29 — `core/estatistica.js` + `violin` (TIER 3, item 25)

O núcleo estatístico saiu ANTES do primeiro gráfico, porque seis do tier
vão usá-lo: quartis, densidade por kernel, limites de outlier, ECDF,
regressão linear, correlação e quantis da normal.

Decisões do núcleo:

- **Quartis pelo método tipo 7** (padrão do R e do d3), declarado no código
  E no rodapé do gráfico. Não existe definição única de quartil — o R tem
  nove métodos — e eles discordam em amostras pequenas. Um quartil sem
  método declarado é um número sem procedência.
- **Desvio AMOSTRAL** (divide por n−1): uma consulta do Looker é sempre uma
  amostra.
- **Banda de Silverman na versão ROBUSTA** (menor entre desvio e
  IQR/1,349). Com desvio puro, um único outlier alarga a banda e achata a
  distribuição inteira — escondendo justamente o que o gráfico mostraria.
- **Regressão sem variação em X devolve `null`**, em vez de inventar uma
  reta vertical.
- **Quantil da normal por aproximação de Acklam** (erro < 1,15e−9), para
  não trazer dependência só por causa do Q-Q plot.

Os testes do núcleo não conferem "se rodou": conferem contra **valores do
R** (quantis de 1,2,3,4 dão 1; 1,75; 2,5; 3,25; 4), contra **tabela**
(z de 97,5% = 1,95996) e contra **propriedades que têm que valer sempre**
(a densidade integra 1; a ECDF termina em 1; correlação perfeita dá ±1).

Sobre o violino:

- **Largura comparável entre categorias por padrão.** Normalizar cada um
  pelo próprio pico faz um grupo de 3 observações parecer tão robusto
  quanto um de 3.000. Tem teste exigindo larguras DIFERENTES no modo
  comparável e IGUAIS no modo próprio.
- **A curva é cortada no mínimo e no máximo reais.** O kernel tem cauda
  infinita; deixá-la livre desenha densidade onde não houve observação.
- **Grupos pequenos ganham asterisco e aviso.**
- **Consulta já agregada tem estado vazio EXPLICATIVO**: um valor por
  categoria não é distribuição, e sem a explicação o usuário conclui que o
  gráfico está quebrado. A mensagem diz o que mudar no Explore.

Defeito corrigido na verificação: com a fixture `grande5k` saíam **2.000
violinos**, todos com largura zero. Faltavam o limite de categorias (agora
30, pelas de maior n) e a escolha de qual dimensão agrupa.

Números: 25 gráficos construídos; 456/456 testes passando; checagem de
segurança sem violação.

### Etapa 30 — `ridgeline` + base `_distribuicao` (TIER 3, item 26)

A base saiu no segundo gráfico da família, como no TIER 1 e no TIER 2:
**`src/charts/_distribuicao/`** resolve o que `violin`, `ridgeline`,
`beeswarm` e `boxplot_avancado` fazem igual antes de desenhar — achar a
dimensão e a medida, agrupar, resumir, cortar o excesso de categorias e
explicar quando a consulta não tem distribuição nenhuma.

Decisão que vale para a família inteira: **"sem dados" num gráfico de
distribuição quase nunca significa consulta vazia — significa consulta
agregada demais**. Por isso o estado vazio diz o que mudar no Explore, em
vez de só constatar a ausência.

O corte de categorias fica com as de MAIOR n, não com as primeiras da
consulta: são elas que têm distribuição para mostrar.

Dois defeitos reais de layout, achados pelos testes:

1. **Com sobreposição > 0, a última faixa saía por baixo da área.** A conta
   antiga derivava o espaçamento de `n − sobreposição`, e a soma passava da
   altura disponível.
2. **Com 90% de sobreposição, a primeira curva saía pelo TOPO** — sumia da
   tela sem erro nenhum. A sobreposição multiplica a altura da curva por
   `1/(1−s)`, ou seja, dez vezes o espaçamento nesse caso.

A correção trata os dois: a sobreposição NÃO mexe no espaçamento das linhas
de base (ela aumenta a altura das curvas), e o espaçamento sai de
`altura ÷ (n + fator − 1)`, reservando a folga que a primeira curva precisa
acima da própria base. Com isso a área é preenchida exatamente, em qualquer
nível de sobreposição. Há teste conferindo 0%, 55% e 90%.

Erro meu nos testes, que custou duas rodadas: eu extraía as coordenadas Y
dos caminhos com um regex de `,numero`. O d3 emite curvas como
`C x1,y1,x2,y2,x,y`, com vírgula entre TODOS os seis números — metade do
que vem depois de vírgula é X. A medição acusava faixas fora da área que
estavam dentro, e escondia as que estavam de fato fora. Virou um auxiliar
`coordenadasY()` que pega os números de índice ímpar, com o motivo
comentado. **Vale para qualquer teste de caminho SVG daqui para a frente.**

Números: 26 gráficos construídos; 478/478 testes passando; checagem de
segurança sem violação.

### Etapa 31 — `beeswarm` (TIER 3, item 27)

O terceiro gráfico sobre `_distribuicao/`, e o primeiro que **não estima
nada**: um ponto por observação, deslocado perpendicularmente ao eixo só o
bastante para não cobrir o vizinho. Violino e ridgeline mostram a forma
estimada; o beeswarm mostra os pontos que existem.

O problema interessante é o empacotamento. O caminho ingênuo compara cada
ponto com todos os já colocados — O(n²), 12,5 milhões de comparações para
5.000 pontos. A observação que resolve: só os vizinhos a menos de um
DIÂMETRO no eixo podem colidir. Percorrendo em ordem de valor, uma janela
deslizante mantém esses vizinhos à mão; cada um proíbe um intervalo de
deslocamentos de meia largura `√(d² − dx²)` (Pitágoras), e escolhemos o
deslocamento válido mais perto de zero. Os candidatos ótimos são sempre as
BORDAS dos intervalos: se zero está livre é ele, senão a solução encosta em
algum vizinho. Resultado medido: 5.000 pontos em ~450 ms, e um teste
trava se passar de 3 s.

Acima de 2.000 pontos o desenho cai para canvas (mesmo motivo do
`quadrant_scatter`: 5.000 `<circle>` engasgam o navegador). Acima de 20.000
observações o gráfico se recusa e manda usar o Violin Plot — um beeswarm de
20 mil pontos é uma mancha, e fingir o contrário seria pior do que recusar.

**A mentira que este gráfico podia contar.** Quando o enxame fica mais
largo que a faixa da categoria, os pontos que não cabem são presos na
borda — e aí eles se cobrem. O desenho continua perfeitamente plausível e
passa a mostrar MENOS observações do que existem, que é exatamente o que um
beeswarm promete não fazer. Então `empacotar()` devolve quantos ficaram
presos e o gráfico avisa, sugerindo ponto menor, menos categorias ou o
violino. Mesma regra de sempre: o gráfico declara o que não dá para ver.

Decisão de layout: `desenharEixos` só sabe desenhar banda no eixo X. Em vez
de duplicar o desenho do eixo para a orientação horizontal, entrego uma
função de escala que se comporta como numérica (tem `ticks()` e devolve o
CENTRO da faixa). Três linhas, nenhum código repetido.

Os testes medem a promessa, não a aparência: contagem de pontos igual à
contagem declarada na nota, menor distância entre QUALQUER par ≥ diâmetro
(varredura ordenada, não O(n²) ingênuo), simetria do enxame em torno do
centro (escolher sempre o primeiro lugar livre produziria uma escada), e o
aviso de estouro aparecendo quando forçamos ponto de 16 px em 5.000
observações.

Números: 27 gráficos construídos; 502/502 testes passando; checagem de
segurança sem violação em 87 arquivos.

### Etapa 32 — `grafico_controle` (TIER 3, item 28)

O gráfico que responde "isso é sinal ou é ruído?". Linha central, limites a
±3σ e as oito regras de Nelson.

**A decisão que define o gráfico é como σ é estimado.** O desvio-padrão
amostral usa a variação TOTAL da série — inclusive as causas especiais que
estamos tentando detectar. Resultado: um processo fora de controle alarga
os próprios limites até caber dentro deles. O teste que escrevi mostra isso
com o caso clássico do degrau (15 pontos em 10, 15 pontos em 30): com
desvio amostral o LSC vai a ~50 e o gráfico declara "sob controle" um
processo que mudou de nível na metade; com amplitude móvel ÷ d₂ (d₂ =
1,128, que é 2/√π) o LSC fica em ~24 e o degrau inteiro aparece como sinal.
Por isso a amplitude móvel é o padrão, e o método usado vai escrito na nota.

**A segunda mentira possível, essa sem conserto:** se cada ponto da
consulta já é a média de n observações, os limites verdadeiros são σ/√n —
mais estreitos. A consulta não diz isso e não há como descobrir. Então o
gráfico declara a hipótese na nota em vez de fingir que sabe.

Decisões menores, cada uma com teste:
- **Nulos interrompem as sequências, não são pulados.** "Nove pontos
  seguidos" com um período faltando no meio não são nove pontos seguidos;
  pular o buraco inventaria sinal.
- **"2 de 3 além de 2σ" marca os 2, não os 3.** Pintar a janela inteira
  acusaria de sinal um ponto que está exatamente onde deveria estar.
- **Cada regra é NOMEADA no tooltip.** Um ponto vermelho sem nome só diz
  "algo está errado"; "6 pontos seguidos subindo" diz o que procurar.
- **Várias séries ⇒ aviso.** Um gráfico de controle descreve UM processo;
  limites de um processo não valem para outro. Os limites saem da primeira
  série e o gráfico avisa.
- **Menos de 20 pontos ⇒ aviso.** Os limites se mexem muito a cada período
  novo e "fora de controle" vira sorte (o número de Wheeler é 20–25).
- **σ = 0 ⇒ aviso.** Série constante colapsa os limites na linha central.

Dois erros meus nos testes, os dois de FIXTURE e não de código, os dois
instrutivos: (a) eu quis demonstrar o σ inflado com um outlier único em vez
de um degrau — com um só ponto fora, o desvio amostral ainda sinaliza, e a
demonstração não existe; o degrau é que é o caso; (b) minha série "processo
estável" tinha todos os pontos colados na média e alternando perfeitamente,
o que dispara as regras 7 e 4. Processo estável não é processo pequeno nem
processo regular — e esse teste (nenhum falso sinal em 20 pontos, com as
oito regras ligadas) é o mais importante do arquivo: um gráfico que acusa
sinal onde não há treina o usuário a ignorar o vermelho.

Números: 28 gráficos construídos; 537/537 testes passando; checagem de
segurança sem violação em 89 arquivos.

### Etapa 33 — `dispersao_regressao` (TIER 3, item 29)

Nuvem de pontos, reta por mínimos quadrados, R², equação e banda de
incerteza. É o gráfico da biblioteca com mais maneiras de mentir, e cada
uma ganhou tratamento próprio.

**1. Reta sobre relação curva.** O desenho fica plausível, o R² pode até
ser alto, e a reta está errada em toda a faixa. Os resíduos agora passam
por um teste de corridas (Wald-Wolfowitz): ordenados por x, os sinais dos
resíduos deveriam alternar ao acaso; numa relação curva eles se agrupam em
trechos inteiros acima e abaixo da reta. Poucas corridas demais (z < −2) é
exatamente essa assinatura — e é o tipo de coisa que o olho não pega
quando o R² está alto. Testes nos dois sentidos: a parábola é denunciada
(z ≈ −6), a reta com ruído não é. Abaixo de 20 pontos a aproximação normal
do número de corridas não vale e o teste devolve `null` em vez de inventar
sinal.

**2. Banda da RETA confundida com banda de PREDIÇÃO.** A diferença entre
`ŷ ± t·s·√(1/n + (x−x̄)²/Sxx)` e `ŷ ± t·s·√(1 + 1/n + …)` é aquele `1` — e
ele muda tudo: a primeira encolhe quando n cresce, a segunda não, porque a
variação individual não some por mais dados que se colete. São lidas como a
mesma coisa o tempo todo, então a banda desenhada é sempre nomeada na nota,
com a ressalva inteira ("onde a média está, não onde o próximo ponto cai").

**3. R² alto com poucos pontos.** Com n = 4, R² = 0,9 é rotina em dados sem
relação nenhuma. Abaixo de 10 pontos o gráfico avisa.

E a de sempre, escrita na nota em toda renderização: correlação não é
causalidade.

Acréscimos em `core/estatistica.js`, ambos com teste próprio:
- `regressaoLinear` passou a devolver `mediaX`, `sxx`, `syy`, `sxy`, `sqe`,
  `erroResidual` e `grausDeLiberdade` — tudo o que a banda precisa. Com
  n = 2 o `erroResidual` é `null`, não zero: a reta passa exatamente pelos
  dois pontos e não sobra grau de liberdade; devolver zero seria lido como
  "ajuste perfeito e preciso", que é o oposto da verdade. Sem ele, a banda
  simplesmente não é desenhada.
- `quantilT(p, gl)` pela expansão de Cornish-Fisher sobre o quantil normal.
  Conferido contra seis pontos da tabela de t (erro < 0,005 de ν = 5 a 120)
  e contra a convergência para 1,96 em ν grande.

Opção de reta forçada pela origem, nunca padrão, com R² definido em torno
da MÉDIA para continuar comparável com o do ajuste livre — a definição
alternativa (em torno de zero) infla o número e faria a reta presa parecer
melhor que a livre, o que é impossível. Há teste exigindo que a presa nunca
ajuste melhor.

Erro meu, pego pelo teste: `calcularBanda` com `passos: 0` fazia `i/passos`
virar NaN e a banda inteira sumia sem erro nenhum. Agora o número de
divisões tem piso 1.

Números: 29 gráficos construídos; 571/571 testes passando; checagem de
segurança sem violação em 91 arquivos.

### Etapa 34 — `qq_plot` (TIER 3, item 30)

Quantis observados contra quantis teóricos da normal. Responde "esses
dados são normais?" melhor que qualquer teste de hipótese, porque mostra
ONDE eles deixam de ser — e um p-valor não mostra.

Três decisões de método, todas escritas na tela:

**Posição de plotagem.** O i-ésimo de n valores ordenados não corresponde
ao quantil i/n — isso daria p = 1 para o maior valor, cujo quantil normal é
infinito, e o ponto sumiria. As fórmulas (Blom, Hazen, Weibull) são
variações de `(i − a)/(n + 1 − 2a)` e discordam justamente nas CAUDAS, que
é onde o gráfico é lido. Padrão: Blom, feita para a normal.

**Reta de referência robusta por padrão.** A reta por média e desvio é
puxada pelos outliers — exatamente os pontos cuja anormalidade queremos
ver — e faz a nuvem inteira parecer torta. A reta pelos quartis ignora as
pontas. O teste mostra o tamanho do estrago: uma amostra normal de σ = 10
com um único outlier de 100.000 dá inclinação 15.602 pela média e 9,94
pelos quartis. Quartis idênticos (metade dos valores repetidos) caem para
os momentos, porque uma reta horizontal não serve de referência.

**Envelope pontual de 95%.** O desvio que importa não é o visível, é o
grande demais para o acaso. O erro-padrão do i-ésimo valor ordenado é
`σ·√(p(1−p)/n) ÷ φ(z_p)` — ele divide pela densidade normal, que é pequena
nas caudas, e por isso o envelope é uma ampulheta (teste mede: erro 0,12 no
meio, 0,44 nas pontas). É PONTUAL, não simultâneo: com 100 pontos, ~5 fora
é o esperado. Isso está na nota E a caixa mostra "k fora (≈m esperados por
acaso)", porque ler envelope pontual como banda simultânea é o erro
clássico — cada ponto fora vira "anormalidade" e a conclusão é falsa.

**O que achei mais útil: o gráfico NOMEIA a forma.** "Os pontos estão
tortos" não é conclusão; "cauda direita pesada, tente log" é. Mede-se o
desvio médio dos 10% de cada ponta, em unidades de σ: sinais opostos
(alta +, baixa −) = caudas pesadas, curva em S; sinais opostos invertidos =
caudas leves; mesmo sinal nas duas pontas = assimetria, curva em C.

Os testes partem de amostras cuja distribuição eu escolhi, construídas a
partir dos próprios quantis teóricos (determinísticas, nada de
`Math.random`): normal exata ⇒ "compatível" e desvio máximo de 0,56 em
σ = 15; exponencial ⇒ "assimetria à direita"; uniforme ⇒ "caudas leves";
normal com extremos nos dois lados ⇒ "caudas pesadas". Se os quantis
teóricos estivessem errados, a normal exata não cairia na reta.

Erro meu no teste da padronização: comparei os pixels crus de `cx` entre
eixo em unidade original e eixo em σ. Trocar "1.250.000" por "2,1 σ" nos
rótulos muda a largura da margem esquerda e portanto a área de desenho —
os pixels mudam e está certo que mudem. O que tem de ser idêntico é a
posição RELATIVA dentro da área, que é o que o teste mede agora, em x e em
y (padronizar é transformação afim: a forma da nuvem não pode mudar).

Números: 30 gráficos construídos; 603/603 testes passando; checagem de
segurança sem violação em 93 arquivos.

### Etapa 35 — `densidade_ecdf` (TIER 3, item 31)

Duas vistas da MESMA distribuição, no mesmo eixo X, uma embaixo da outra.
O par é o gráfico:

- A **ECDF** é a verdade sem escolha de método: um degrau por observação,
  nenhum parâmetro, nada a ajustar. Lê-se direto ("40% dos pedidos ficaram
  abaixo de R$ 200").
- A **densidade** é uma interpretação, e depende de uma largura de banda.

O teste que mais me convenceu de que o par precisa existir: com duas modas
bem separadas, banda 2 mostra DOIS picos e banda 60 mostra UM — mesmos
dados, as duas imagens igualmente "corretas". Quem vê só a densidade não
tem como saber qual das duas está olhando. A ECDF logo abaixo mostra o
degrau no meio e resolve a dúvida. Por isso o padrão é "as duas", e a banda
usada vai escrita na nota, com a frase inteira: "é ela que decide se há um
pico ou três".

**A ECDF é desenhada como ESCADA, sempre.** Entre duas observações
consecutivas não existe informação; a reta horizontal diz exatamente isso,
e uma curva suave inventaria valores intermediários. Há teste que lê o
atributo `d` e falha se aparecer qualquer comando de curva (`C`, `Q`, `S`,
`T`, `A`) ou qualquer segmento diagonal — porque suavizar a ECDF é uma
"melhoria" que alguém sempre tenta fazer.

Subamostragem: 50.000 degraus não cabem em pixels, então a escada é
reduzida a ~1.200 passos. Como a acumulada é monótona, pegar de k em k
preserva a forma; o primeiro e o último entram à força. O `p` de cada
degrau mantido continua sendo o da amostra INTEIRA (ordem/n), não um
recontado sobre a amostra reduzida — o teste confere isso explicitamente,
porque recontar seria o erro natural e invisível.

Mudança na base `_distribuicao/`: a dimensão das categorias agora oferece
"(nenhuma)", que vale como resposta — uma distribuição única, de todas as
linhas juntas. Antes a opção só aparecia com 2+ dimensões e nunca permitia
"nenhuma", o que obrigava a agrupar mesmo quando o interesse era a amostra
inteira. Beneficia também o `boxplot_avancado` (item 35).

Detalhe de desempenho que teria passado: `fracaoAbaixoDe` rodava um
`sort()` a cada movimento do mouse. Com 5.000 valores e vários grupos, isso
travaria o gráfico sem erro nenhum aparecer. Agora recebe o
`resumo.ordenados` que já existe e faz busca binária — conferida contra a
contagem direta em sete limites, inclusive fora do intervalo.

Números: 31 gráficos construídos; 632/632 testes passando; checagem de
segurança sem violação em 95 arquivos.

### Etapa 36 — `intervalo_confianca` (TIER 3, item 32)

Estimativa por categoria com a barra de erro em volta: "essa diferença é
real ou cabe no erro?".

**A armadilha central, e ela é grande.** Intervalos de 95% que se TOCAM não
significam "diferença não significativa". O erro-padrão da diferença é
√(EP₁² + EP₂²), menor que a soma dos dois — dois intervalos de 95% podem se
sobrepor bastante e a diferença ainda ser significativa a 5%. Quem lê
sobreposição como "igual" erra para o lado conservador o tempo todo e
deixa de ver efeitos reais. A leitura errada é a natural, e a conta está
certa: é o tipo de erro que nenhum teste de código pega.

Daí o modo **intervalos de comparação (~83,4%)**: barras de 1,386 EP, que é
1,96/√2, construídas justamente para que a sobreposição corresponda ao
teste. O teste confere a propriedade numericamente — duas estimativas
separadas pelo limiar do teste (1,96·√2·EP) têm as barras se tocando
exatamente. E o gráfico declara em voz alta que elas NÃO são intervalos de
confiança da estimativa, porque trocar um pelo outro é trocar uma conclusão
por outra.

**Três caminhos para o n, todos declarados na tela**, porque não significam
a mesma coisa: (1) limites já calculados no LookML — o gráfico só desenha o
que recebeu e avisa que não pode recalculá-los em outro nível; (2) medidas
de n e desvio por categoria, com EP = s/√n; (3) a partir das linhas sem
agregar, reaproveitando `_distribuicao/` — o único caminho em que o n é o
número de observações de verdade. Quando nenhum está disponível, a mensagem
de saída ENSINA os outros dois em vez de dizer "não dá".

Usa `quantilT` com n−1 graus de liberdade, não 1,96 fixo: com n = 6 o
multiplicador certo é 2,571, e usar z estreitaria o intervalo em ~24%
exatamente na faixa de n em que a incerteza é maior. Teste confere o
multiplicador e também a lei do √n (quadruplicar o n reduz a largura pela
metade: medido 2,019).

Erro meu no teste, e instrutivo: comparei o comprimento em PIXELS das
barras de 95% com as de comparação, esperando que as segundas fossem
menores — e vieram maiores. Barras mais estreitas encolhem o domínio do
eixo, a escala dá zoom e tudo volta a parecer longo. **Pixels crus não são
comparáveis entre dois desenhos com domínios diferentes.** O que é
invariante de escala é a barra medida CONTRA a distância entre as
estimativas, que são os mesmos dados nos dois casos: 1,933 contra 0,892.
Vale para qualquer teste futuro que compare dois renders.

Números: 32 gráficos construídos; 662/662 testes passando; checagem de
segurança sem violação em 97 arquivos.

## Sessão retomada em 2026-10-23

Ponto de partida: branch `agente/novas-viz`, commit `038cb00`
(`intervalo_confianca`, TIER 3 item 32). `origin/main` sem novidades —
`git merge-base --is-ancestor origin/main HEAD` confirma que já está
incorporada, nenhum merge necessário.

Havia trabalho não commitado da sessão anterior, exatamente o que a
"PRÓXIMA AÇÃO EXATA" mandava começar: a extração de `_dispersao/`, parada
no meio (a base já criada, o `dispersao_regressao` já reapontado nos
imports e na leitura dos pontos, mas ainda com o bloco de desenho
duplicado). Como o LOG pedia essa extração, terminei em vez de descartar.

### Etapa 37 — base `_dispersao/` + `matriz_dispersao` (TIER 3, item 33)

**A extração primeiro.** Regra que já se pagou várias vezes nesta
biblioteca: a base sai quando nasce o SEGUNDO da família, não depois.
`src/charts/_dispersao/index.js` recebeu o que `dispersao_regressao` e
`matriz_dispersao` compartilham: CSS, limite de SVG×canvas, leitura dos
pares (x, y) com contagem das linhas descartadas, `desenharNuvem` (que
escolhe a técnica e devolve se usou canvas), `opcoesDePontos`, a regressão
pela origem, a banda de incerteza e o teste de corridas.

O `dispersao_regressao` passou a importar tudo isso e a **re-exportar** os
nomes que seus testes usam. A superfície pública do gráfico não mudou — e
o critério de que a extração deu certo foi exatamente esse: **os 22 testes
dele continuam passando sem uma linha alterada.** Se tivessem precisado
mudar, a extração teria mudado comportamento e estaria errada.

**O SPLOM.** Dispersão no triângulo inferior, densidade na diagonal, r de
Pearson no superior. Decisões:

- **Uma linha só entra se tiver valor em TODAS as medidas.** Um ponto que
  aparece em alguns painéis e some em outros faria as nuvens da mesma
  matriz descreverem amostras diferentes — e nada na tela diria isso. O
  descarte é contado e anunciado.
- **Um canvas só para a matriz inteira**, não um por painel: com 5 medidas
  e 5.000 linhas são 20 painéis e 100 mil pontos; 20 contextos 2D seriam
  20 cópias da mesma conta. Há teste exigindo exatamente um `<canvas>`.
- **Teto de medidas com aviso**: k medidas são k² painéis, e acima de ~6
  cada painel fica com ~100 px de lado.
- **A ressalva do quarteto de Anscombe na nota.** O r é um número sobre
  RETAS: quatro nuvens completamente diferentes dão r = 0,816. Por isso o
  número e a forma ficam na mesma tela, espelhados em torno da diagonal, e
  a nota manda olhar a dispersão antes de concluir.

**O erro que eu quase deixei passar, e é o mais instrutivo da sessão.** O
teste central do SPLOM é o do espelho: o painel (i, j) tem de ser o painel
(j, i) com x e y trocados — é o que pega eixos invertidos, que é o defeito
característico deste gráfico e é completamente invisível na tela. Ele
passou de primeira... conferindo ZERO pares. Com 5 medidas, os 2.400
pontos tinham ido para o canvas, e `querySelectorAll('circle')` devolvia
lista vazia: todos os laços rodavam zero vezes e os `assert` dentro deles
nunca executavam. Três testes estavam verdes sem testar nada.

A correção foi forçar 3 medidas (720 pontos, abaixo do limite do canvas) e
**afirmar a contagem**: `assert.ok(r.pontos.length > 0)` e
`assert.equal(conferidos, 3)`. **Lição para o resto da biblioteca: todo
teste que percorre uma lista precisa afirmar que a lista não está vazia.**
Um laço vazio é a forma mais silenciosa de teste falso-positivo que existe,
e ela aparece de graça sempre que o gráfico troca de técnica de desenho
conforme o volume — o que é o caso de cinco gráficos daqui.

Números: 33 gráficos construídos; 687/687 testes passando; checagem de
segurança sem violação em 100 arquivos.

### Etapa 38 — `correlacao_matriz` (TIER 3, item 34)

O mapa de calor de todas as medidas contra todas. É o primo do
`matriz_dispersao` sem as nuvens: cabe muito mais variável na tela (25 × 25
é legível; um SPLOM 25 × 25 não existe) e a pergunta é outra — não "como é
a relação deste par" e sim "que blocos de variáveis andam juntos".

**Escala divergente com domínio FIXO em [−1, +1].** Duas coisas erradas
seriam fáceis aqui: uma escala sequencial faria r = 0 parecer "médio" em
vez de "nenhum", e uma escala ajustada aos dados faria r = 0,3 parecer
forte numa matriz fraca e r = 0,8 parecer médio numa matriz forte. Uma cor
de correlação precisa significar a mesma coisa em qualquer matriz. O teste
confere que r = 0 é exatamente o fundo, que +0,6 e −0,6 ficam à mesma
distância do fundo em cores distinguíveis, e que a intensidade cresce
monotonicamente com |r|.

**Spearman ao lado de Pearson, e a discordância como informação.**
Acrescentei `postos()` e `correlacaoDeSpearman()` em `core/estatistica.js`.
Empates recebem a média das posições — dar posições arbitrárias a valores
iguais inventa uma ordem que não existe e infla o Spearman. O modo "Pearson
abaixo, Spearman acima" deixa a matriz assimétrica DE PROPÓSITO, e é isso
que permite ver os dois métodos num olhar. Quando discordam por mais de
0,15, o tooltip escreve a leitura: "relação monótona mas não linear
(curvatura ou outlier)". Testes: y = x³ dá Spearman 1,000 e Pearson 0,915;
uma reta com um outlier dá Pearson −0,315 e Spearman 0,813.

**Agrupamento por ligação média com distância `1 − |r|`.** O valor absoluto
é a decisão: usar `1 − r` separaria pares fortemente NEGATIVOS, que são tão
informativos quanto os positivos. Ligação média e não simples — ligação
simples ("o par mais próximo manda") produz cadeias longas e nenhum bloco
visível, que é exatamente o que o agrupamento deveria revelar. Como a
ordem muda completamente a leitura, ela vai declarada na nota.

**Bug real encontrado pelo teste, e dos bons:** `correlacaoDePearson`
devolvia **1** quando uma das variáveis era CONSTANTE. A causa é legítima
na origem — `regressaoLinear` define r² = 1 quando Syy = 0, e de fato uma
reta horizontal ajusta um Y constante perfeitamente — mas correlação com
uma constante não é 1 nem 0: o denominador de r é zero e o número não
existe. Numa matriz, uma medida constante (um flag, uma medida zerada pelo
filtro — coisa comuníssima no Looker) apareceria como correlação PERFEITA
com todas as outras. E "1,0" é exatamente o tipo de célula que ninguém
questiona, porque parece um resultado. Agora devolve `null` e a célula sai
apagada. Corrigido em `core/estatistica.js`, com o porquê comentado; as
77 asserções dos gráficos que dependem de correlação continuam passando.

Mais duas ressalvas permanentes na nota: o r é um número sobre RETAS
(quarteto de Anscombe), e com k medidas são k(k−1)/2 pares — a 5%, cerca
de 5% deles "dão significativo" por acaso (com 20 medidas, 190 pares e ~10
falsos positivos esperados).

Também movi `lerLinhasCompletas` para `_dispersao/`: `matriz_dispersao` e
`correlacao_matriz` precisam da mesma regra dura — uma linha só entra se
tiver valor em TODAS as medidas, senão cada par descreveria uma amostra
diferente sem nada na tela dizer isso.

Números: 34 gráficos construídos; 720/720 testes passando; checagem de
segurança sem violação em 102 arquivos.

### Etapa 39 — `boxplot_avancado` (TIER 3, item 35) — **TIER 3 COMPLETO**

O que torna este boxplot "avançado" não é enfeite: é mostrar o que o
boxplot comum esconde.

**1. A bimodalidade — a mentira clássica da caixa.** Escrevi um teste que
não exercita código nenhum do gráfico: ele estabelece o PROBLEMA. Cem
observações em 10, uma em 50 e cem em 90 produzem Q1 = 10, mediana = 50 e
Q3 = 90 — **exatamente os mesmos três números** de uma distribuição
uniforme em [−30, 130]. A caixa é idêntica, as formas são opostas, e a
conclusão ("o valor típico é 50") é falsa nos dois casos de um jeito
diferente: numa, 50 é o único valor que quase não ocorre; na outra, é tão
comum quanto qualquer outro. Daí `detectarPicos()`: conta picos na
densidade por kernel, com dois filtros para não disparar à toa — o pico
precisa ter ≥ 25% da altura do maior e o vale entre dois picos precisa
descer a ≤ 75% do menor deles. Testado nos dois sentidos (acusa a bimodal
e as três modas; não acusa quatro amostras unimodais com sementes
diferentes), porque um aviso que dispara à toa é pior que aviso nenhum.

**2. A largura ∝ √n.** Uma caixa de 5 observações desenhada do mesmo
tamanho de uma de 5.000 afirma uma solidez que não tem.

**3. O entalhe da mediana** (±1,58 × IQR/√n, de McGill, Tukey e Larsen),
com a mesma ressalva do `intervalo_confianca` escrita na nota: entalhes que
NÃO se sobrepõem são evidência de diferença; os que se sobrepõem não são
evidência de igualdade. Teste confere que quadruplicar o n divide o entalhe
por 2 — é o que faz dele uma afirmação sobre precisão.

**Decisão corrigida no meio do caminho.** Eu tinha escrito que o entalhe
ficaria SOLTO quando ultrapassasse os quartis, e que a "borboleta"
resultante seria o gráfico admitindo não saber onde a mediana está. Bonito
no comentário, errado na prática: o teste de contenção pegou uma caixa
saindo por cima da área do gráfico (y = −11,6). Com n pequeno o entalhe
estoura não só a caixa, estoura a tela. Agora ele é preso aos quartis no
desenho, e o fato de ter estourado não é escondido — vira a cor de atenção
na linha da mediana e uma linha no tooltip. O comentário do código e o do
teste foram corrigidos junto: **comentário que descreve a intenção antiga
é pior que comentário nenhum.**

Também nesta etapa, dois testes meus que mediam a coisa errada:
- o da bimodalidade comparava IQRs de duas amostras que, de fato, têm IQRs
  diferentes (80 contra 40). A demonstração só existe com amostras
  construídas para terem a caixa idêntica — e aí ela é exata, não
  aproximada;
- o da largura ∝ √n usava uma fixture cujas categorias têm todas o mesmo n,
  então as larguras eram iguais e o teste reprovava o comportamento certo.
  Agrupando por produto (n = 131, 132 e 125) a condição existe.

Métodos declarados na tela, como no `violin`: quartil tipo 7, bigode de
1,5 × IQR parando no último valor REAL (Tukey).

**TIER 3 fechado: 11 gráficos estatísticos (itens 25 a 35).**

Números: 35 gráficos construídos; 753/753 testes passando; checagem de
segurança sem violação em 104 arquivos.

## TIER 4 — muitas informações

A mudança de problema é nítida: até o TIER 3 a pergunta era "o que o
desenho esconde"; daqui em diante é **"isso cabe?"**. As respostas
continuam sendo decisões de honestidade, mas agora elas convivem com
canvas, índices e tetos.

### Etapa 40 — `heatmap_denso` (TIER 4, item 36)

Mapa de calor de duas dimensões cruzadas. 500 × 200 são 100 mil células:
em SVG, 100 mil elementos param o navegador; em canvas, 100 mil `fillRect`
e uma passada. Acima de 4.000 células vai para canvas — **um canvas só**,
com teste exigindo exatamente isso.

**A escala de cor é a decisão central**, e são três:
- *linear*: distância de cor = distância de valor. É a única em que
  comparar duas células pelo tom é legítimo.
- *divergente*: domínio **simétrico** em torno de zero. Com domínio
  assimétrico a cor do meio deixa de ser o zero e a virada de sinal
  aparece no lugar errado — é o erro mais comum do gênero, e o teste
  confere que `cor(0)` é exatamente a cor central. Também avisa quando a
  paleta escolhida não é divergente.
- *quantil*: a cor é a POSIÇÃO na distribuição. Revela estrutura que a
  linear esmaga e **distorce as distâncias** — no teste, 1 → 2 anda
  exatamente tanto quanto 5 → 1.000.000. A ressalva vai escrita na tela
  sempre que o modo está ligado, e a régua mostra os valores dos quantis
  em vez de uma escala regular, para a distorção ficar visível.

**Ausência não é zero.** A grade nasce `NaN` de propósito: zero é uma
afirmação sobre o dado, NaN é "não sei". A célula vazia tem cor própria,
entrada própria na régua e menção na nota. Pintá-la com a cor do mínimo
transformaria "não sei" em "quase nada".

**A grade some sozinha** abaixo de ~3 px por célula — a linha de separação
comeria a própria célula e o mapa escureceria por inteiro. A omissão é
declarada.

**Bug real encontrado pelo teste, e dos silenciosos:** a contagem de
células ausentes deu **−15**. Causa: eu contava uma "célula preenchida" a
cada linha da consulta gravada, não a cada célula distinta. E aí apareceu o
problema de verdade que estava escondido atrás disso: **quando duas linhas
da consulta caem na mesma célula, o mapa mostra só a última e o resto some
em silêncio** — acontece sempre que a combinação linha × coluna não é
única, o que é comuníssimo numa consulta não agrupada. Agora as colisões
são contadas e o gráfico avisa, mandando agrupar no Explore. Era um caso em
que metade dos dados desaparecia sem nada na tela mudar.

Detalhes de volume: busca O(1) no hover (a posição vira índice por divisão,
não por varredura — com 100 mil células, varrer a cada movimento travaria);
rótulos desbastados pelo mesmo princípio do eixo de banda; eixo de colunas
no TOPO, porque num heatmap a primeira linha é a mais olhada e rótulo
embaixo obriga a percorrer o mapa inteiro para identificá-la.

Números: 36 gráficos construídos; 785/785 testes passando; checagem de
segurança sem violação em 106 arquivos.

### Etapa 41 — `small_multiples` (TIER 4, item 37)

Uma grade de mini-gráficos, um por série, **todos na mesma escala**.

A escala compartilhada não é detalhe: é o gráfico inteiro. Com escalas
independentes, cada painel usa toda a altura disponível e todos ficam
igualmente dramáticos — a série que varia de 2 a 3 ganha a mesma amplitude
visual da que varia de 2 a 3.000. O olho compara FORMAS, e formas de
escalas diferentes não são comparáveis. Como permitir a comparação é a
única razão de existir de um small multiples, a escala livre existe como
opção mas é sempre DECLARADA ("ATENÇÃO: cada painel tem a própria escala —
as formas NÃO são comparáveis entre si").

O teste mede a propriedade em vez de confiar nela: a altura ocupada por
cada curva dentro do próprio painel. Com escala livre, a ocupação média
sobe (0,851 contra 0,730) **e a variação entre painéis desaparece** — e é
essa variação que carrega a informação "esta série é menor que aquela".
São as duas metades da mesma afirmação, e as duas são verificadas.

`montarGrade` escolhe o número de colunas testando todos e ficando com o
que deixa o painel mais próximo de um quadrado, com uma penalidade pelas
células vazias da última fileira. `ceil(sqrt(n))` sozinho ignora a
proporção da tela: numa visualização larga e baixa produz painéis altos e
magros com faixas vazias dos dois lados. O teste confere que 9 painéis
numa tela 1600×300 usam mais colunas do que numa tela 300×1600 — e que
nenhuma configuração deixa uma fileira inteira vazia.

**Erro meu no teste do limiar, e do tipo que ensina.** Escrevi que 60
painéis numa tela de 900×560 cruzariam o limiar de 56 px. Não cruzam: dão
90 px. O caso em que o problema acontece de verdade é o *tile* pequeno de
dashboard (400×200), onde os mesmos 60 painéis viram 36×33 px. Eu tinha
escolhido o cenário pela conveniência do teste, não pela realidade do uso —
e o teste reprovava o comportamento certo. Corrigido com o motivo
comentado, mais um teste do outro lado: com 5 painéis folgados, o aviso NÃO
pode aparecer, porque aviso que dispara à toa treina o usuário a ignorá-lo.

Decisão de escopo registrada: nenhuma fixture produz 60 séries, então o
aviso de painel pequeno não é exercitável pelo render. Em vez de inventar
uma fixture só para isso — o que esconderia que o teste de verdade é sobre
a geometria —, testei `montarGrade` diretamente e deixei o motivo escrito
no teste.

Números: 37 gráficos construídos; 811/811 testes passando; checagem de
segurança sem violação em 108 arquivos.

### Etapa 42 — `barras_ranking_denso` (TIER 4, item 38)

O "top N" quando o N é grande demais para caber: milhares de barras
ordenadas, com rolagem virtualizada — só as visíveis existem no DOM.
Medido: 5.000 itens, 44 linhas no DOM.

**Duas regras que não são opcionais, e as duas quebram em silêncio:**

1. **A barra começa em ZERO.** Com valores entre 900 e 1.000 e base
   truncada, 1.000 parece o dobro de 950 — e o desenho continua
   perfeitamente plausível. Não existe opção para isso. O teste mede:
   começando em zero, 950 ocupa 95% do trilho e 1.000 ocupa 100%, que é a
   diferença real. Quando há negativos, o zero vai para a posição
   proporcional e as barras crescem para os dois lados — sempre a partir
   dele.
2. **A posição no ranking sobrevive à busca.** Renumerar o resultado
   filtrado é o comportamento padrão da maioria das tabelas, e faz o 437º
   virar "o 1º". Quem busca "Produto X" quer saber exatamente que ele é o
   437º. A posição é atribuída depois de ordenar e nunca mais muda; o teste
   busca um nome e confere que as posições voltam 42, 2688 e 3333, não
   1, 2, 3.

Terceira promessa, essa técnica: a virtualização desenha pouco, mas a
**altura total reservada corresponde a TODOS os itens** — senão a barra de
rolagem mente sobre quanto falta e metade da lista fica inalcançável. O
teste confere `altura === total × alturaDaLinha` e que as linhas visíveis
estão em sequência, sem buracos e espaçadas pela própria altura.

Detalhes: rótulo dentro da barra quando cabe (com `textoLegivelSobre`, não
com a cor do tema, senão some sobre a barra escura) e fora quando não cabe;
busca sem resultado diz por quê em vez de ficar em branco; acima de 50 mil
itens o gráfico recusa, porque aí a ordenação sozinha já pesa.

Decisão registrada: **nenhuma fixture da biblioteca tem medida negativa.**
Em vez de deixar o teste de "zero no meio" passar vazio (foi o erro do
SPLOM nesta mesma sessão), o caso com negativos é testado na geometria
pura, onde é exato, e o teste de render passou a exigir o OUTRO lado: sem
negativos, nenhuma barra começa deslocada e o aviso de escala simétrica
NÃO pode aparecer. Vale como padrão para o resto do TIER 4 — quando a
fixture não alcança um caminho, testar a função pura e, no render, provar
que o caminho não foi tomado por engano.

Números: 38 gráficos construídos; 836/836 testes passando; checagem de
segurança sem violação em 110 arquivos.

### Etapa 43 — base `_lista_virtual/` + `dot_plot_denso` (TIER 4, item 39)

**A extração primeiro**, como manda a regra que já se pagou várias vezes:
`src/charts/_lista_virtual/index.js` ficou com o esqueleto que
`barras_ranking_denso` e `dot_plot_denso` compartilham — campo de busca,
contagem, área rolável com janela virtual, nota no rodapé, e
`itemDoEvento()` para achar o item sob o ponteiro em O(1) pelo `dataset`.

Duas propriedades viraram obrigação da base, documentadas nela:
- **a altura reservada conta TODOS os itens**, nunca os desenhados — senão
  a barra de rolagem mente sobre quanto falta;
- **a busca filtra e conta, mas não renumera** — a posição é do chamador.

Critério da extração, de novo: os 14 testes do `barras_ranking_denso`
passam **sem uma linha alterada**. Para isso o gráfico mantém os próprios
nomes de classe ao lado dos da base (`br-linha` junto de `lv-linha`) — o
que não é só cerimônia: dois gráficos virtualizados na mesma tela não
podem disputar as mesmas classes.

**O dot plot, e a regra invertida.** No `barras_ranking_denso` a barra tem
de começar em zero, sem opção, porque ela codifica COMPRIMENTO. Aqui o
ponto codifica POSIÇÃO — cortar o eixo é legítimo e, com valores de 900 a
1.000, é a única forma de ver qualquer diferença. Dois gráficos vizinhos
com regras opostas, e as duas corretas pelo mesmo motivo de fundo: o que a
marca codifica.

A contrapartida do corte é declará-lo, porque o leitor treinado em barras
lê distância da borda como proporção. O estado medido é `incluiZero` — não
"começa exatamente em zero": com valores negativos o eixo começa abaixo de
zero e continua honesto, e o aviso não deve disparar ali. A primeira versão
confundia as duas coisas numa expressão ilegível; agora é uma comparação só
e tem teste nos três casos.

Outra decisão com teste: ordenando pela DIFERENÇA entre a primeira e a
última medida, os itens que não têm a segunda medida vão para o FIM, não
para o meio. Tratar "sem diferença" como zero os colocaria entre os que
caíram e os que cresceram, como se a diferença fosse conhecida e nula.

**A regra do laço vazio se pagou na mesma sessão.** O teste "a posição do
ponto corresponde à ordem dos valores" falhou com a mensagem
*"nenhuma linha tinha mínima e máxima — o teste não conferiu nada"*: eu
tinha escrito `minimo`/`maximo` e os campos da fixture são
`minima`/`maxima`. Sem o `assert` de contagem, o teste teria passado verde
sem comparar nada — exatamente o erro do SPLOM duas etapas atrás, desta vez
pego na hora.

Números: 39 gráficos construídos; 868/868 testes passando; checagem de
segurança sem violação em 113 arquivos.

### PRÓXIMA AÇÃO EXATA

TIER 4, item 40: criar `src/charts/parallel_coords/` ("Coordenadas
Paralelas"): um eixo vertical por medida, uma LINHA quebrada por registro,
cruzando todos os eixos — o gráfico para achar padrões em dados de muitas
dimensões.

Pontos de atenção: (a) **cada eixo tem a própria escala**, e isso aqui é
correto, não um defeito: as medidas têm unidades diferentes e o que se lê é
o PADRÃO das linhas, não a altura absoluta; mas é preciso dizer na tela que
as alturas não são comparáveis entre eixos; (b) **a ordem dos eixos muda
tudo** — só se vê correlação entre eixos ADJACENTES, então oferecer
reordenar (e, melhor, uma ordenação automática que ponha juntos os pares
mais correlacionados, reaproveitando `correlacaoDePearson`); (c) canvas
obrigatório: 5.000 linhas × 6 eixos são 30 mil segmentos; (d) **escovação
(brushing)**: arrastar num eixo filtra as linhas, que é a interação que faz
o gráfico valer — `habilitarBrush` já existe em `core/interaction.js`;
(e) linhas sobrepostas viram mancha: opacidade baixa por padrão e, acima de
~2.000 registros, dizer quantos estão desenhados; (f) escala por quantil
como opção, com a mesma ressalva do `heatmap_denso`.

Depois: registrar em `config/charts.json`, `npm run build`, escrever
`test/parallel_coords.test.mjs` (cada eixo usa a própria escala e o valor
mínimo de cada medida cai na base do seu eixo; a escovação num eixo reduz
a contagem de linhas desenhadas e a contagem é declarada; reordenar os
eixos muda a ordem das coordenadas; **e todo laço afirma que a lista não é
vazia**), `npm test`, `npm run seguranca`, marcar em TAREFAS.md, commitar e
seguir para o item 41 (`bump_chart`).
