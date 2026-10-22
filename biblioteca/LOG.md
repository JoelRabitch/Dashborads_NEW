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

### PRÓXIMA AÇÃO EXATA

TIER 2, item 20: criar `src/charts/pareto/` ("Pareto"): barras ordenadas da
maior para a menor com a linha de percentual ACUMULADO no eixo secundário,
e a marca dos 80% (configurável) mostrando quantas categorias respondem por
aquela fatia.

Cuidados conhecidos: o eixo secundário vai de 0 a 100% e precisa de rótulo
próprio (`core/eixos.js` hoje desenha um eixo Y só — avaliar se vale
acrescentar suporte a eixo secundário na base, já que `pareto` e
`fluxo_caixa` são os primeiros a pedir); e categorias com valor negativo
quebram a leitura de Pareto, então vale avisar. Depois registrar em
`config/charts.json`, buildar, rodar `npm test` e `npm run seguranca`,
marcar em TAREFAS.md e commitar.
