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

### PRÓXIMA AÇÃO EXATA

TIER 1, itens 4 e 5: criar `src/charts/matriz_2x2/` e `src/charts/matriz_bcg/`.
Os dois são primos do `quadrant_scatter` (duas medidas, plano partido em
quatro), então a primeira coisa a fazer é extrair o que dá para reaproveitar
— cálculo do corte, classificação por quadrante e desenho do fundo/rótulos —
para um módulo compartilhado, em vez de copiar código. Depois registrar em
`config/charts.json`, buildar, rodar `npm test` e `npm run seguranca`,
marcar em TAREFAS.md e commitar.
