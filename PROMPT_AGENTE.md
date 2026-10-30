# PROMPT_AGENTE (v3): Melhorias e novas funções na biblioteca de visualizações do Looker

Este arquivo SUBSTITUI a versão anterior do PROMPT_AGENTE.md (a v2, que já está concluída) e é autocontido: tudo o que você precisa saber está aqui. Você trabalha sozinho, sem supervisão, até terminar ou a sessão ser interrompida.

## 0. PRIMEIRA AÇÃO

1. Sobrescreva `/biblioteca/PROMPT_AGENTE.md` com o texto deste arquivo (você não lembra de sessões anteriores e vai precisar reler estas regras). Não altere a cópia da raiz do repositório: ela é do usuário.
2. Rode `git fetch`, `git status` e `git log -5`. Confirme que está no branch `agente/novas-viz`. Se a `main` tiver avançado, faça merge da `main` no branch (nunca rebase de commits já enviados). Se houver conflito em arquivos fora de `/biblioteca`, pare e registre no LOG.
3. Leia `/biblioteca/LOG.md` e `/biblioteca/TAREFAS.md`. Se já houver uma seção "Melhorias v3" em andamento, siga a seção 7 (RETOMADA) em vez de recomeçar.

## 1. ESCOPO E LIMITES

- Sua tarefa é SOMENTE escrever e corrigir código e subir para o Git. Não acesse o Looker, não publique em lugar nenhum, não use LookML e não cadastre nada. O usuário cadastra depois, no painel Admin do Looker, usando URLs do jsDelivr com hash de commit.
- Repositório: https://github.com/JoelRabitch/Dashborads_NEW (PÚBLICO, branch principal `main`). Tudo o que você cria e altera fica em `/biblioteca`. NÃO altere, mova, renomeie nem apague nada fora de `/biblioteca` (`/src`, `/test`, `/tools`, `/npm-package` e o `README.md` da raiz são do usuário; em `/src` está o mapa, que não faz parte desta tarefa).
- Gráficos de mapa e geográficos estão fora de escopo.
- Não copie código de terceiros. Não invente métodos da API do Looker: se não tiver certeza de que um método existe, diga e use uma alternativa.
- Dados de teste (fixtures) são SEMPRE sintéticos. Não use nomes de pessoas, franquias, lojas, clientes nem códigos reais, mesmo que o usuário os mencione nos exemplos.

## 2. GIT (regras rígidas)

- Trabalhe SOMENTE no branch `agente/novas-viz`. NUNCA faça push na `main`, nunca use `--force`, nunca reescreva histórico, nunca apague branches nem tags, e nunca mova, recrie ou force o push de uma tag que já exista. Criar tags NOVAS de versão é permitido (ver 5.15). As URLs que o usuário já cadastrou apontam para commits antigos pelo hash.
- Um commit por etapa pequena, mensagem em português (ex.: `fix(tooltip): solta o tooltip ao sair do gráfico e antes do drill`), e push após cada commit. Se o push falhar, tente de novo uma vez, registre no LOG e siga localmente.
- COMMITE `/biblioteca/dist`. Não commite credenciais, tokens, URLs internas nem dados reais. Não commite `node_modules`. Use apenas o acesso Git já configurado.

## 3. REGRAS TÉCNICAS E DE SEGURANÇA (obrigatórias)

- **Proibido** em `src/` e `dist/`: `fetch`, `XMLHttpRequest`, `sendBeacon`, `eval`, `new Function`, `document.cookie`, `localStorage`, `sessionStorage`, `window.open`, `@import`, `document.write`, `importScripts`, `WebSocket`, recursos de outros domínios e `innerHTML` sem escapar. Exceção: os namespaces SVG (`http://www.w3.org/2000/svg`, `xlink`). `navigator.clipboard` e `Blob` com URL local são permitidos. Rode `npm run seguranca` em cada gráfico alterado e registre o resultado no LOG.
- **Fórmulas e templates sem `eval`.** O interpretador de fórmulas (item 5.4) é um analisador próprio (tokenizador + avaliador de árvore), sem `eval` nem `new Function`.
- Texto vindo de dados entra SEMPRE por `textContent` ou atributos validados. HTML do Looker só com a opção explícita já existente.
- **Dependências:** cada `dist/<id>.js` é autocontido, e o campo Dependencies do Looker fica VAZIO. Módulos d3 só como devDependencies embutidas no bundle (versão exata, publicada há mais de 14 dias, licença ISC ou BSD). Nada é carregado de fora em tempo de execução.
- **Arquitetura existente (respeite):** só `src/core/looker-adapter.js` toca em `looker.*` e `LookerCharts.*`; só `src/core/data-model.js` lê `queryResponse`; opções declarativas em `options-kit.js`; um gráfico por pasta em `src/charts/<id>/`; bases compartilhadas em pastas que começam com `_`; `config/charts.json` é o registro; `build/build.mjs` gera `dist/<id>.js` (IIFE único, NÃO minificado, build determinístico: não escreve data nem hash e só regrava o que mudou); `npm run urls` gera `dist/URLS.md` e `URLS.csv`. Se mudar algo na arquitetura, atualize `docs/ARQUITETURA.md` e `docs/COMPAT.md`.
- `registerOptions`: o Looker só mostra o valor escolhido de um select se o `config` já o tiver antes de o `registerOptions` disparar; registre só quando a lista de campos mudar.
- Hoje o painel de opções tem 5 abas (Dados, Visual, Texto, Interação, Avançado), mas a última fica cortada na barra do editor do Looker. O item 5.1b reduz para 4 abas curtas (Dados, Estilo, Texto, Mais). Coloque cada opção nova numa dessas 4 abas (ou, antes de o item 5.1b ser concluído, nas atuais), com rótulo prefixado (ex.: "Árvore · Centralizar") e curto (ver limites do item 5.1b). Não crie abas novas.
- A viz roda num iframe com sandbox. Tooltips e painéis ficam dentro da área do gráfico. Código comentado em português, e cada gráfico com o cabeçalho atualizado (campos esperados e opções).

## 4. REGRAS DESTA TAREFA

### 4.1 IDs de opções e valores já salvos (decisão do usuário: "o valor salvo vence")
- **Ids existentes:** NUNCA remova, renomeie nem mude o id, o tipo ou o valor padrão de uma opção existente. O dashboard de teste do usuário guarda, por tile, o valor de cada opção usada (por exemplo `curvaDaLinha: catmull` no bump_chart, `truncarRotulo: 60` nas duas árvores, `animarEntradaDasLinhas: true` e `quandoAnimar: sempre` na tabela, `acaoDoClique: drill` em todos). Esses valores salvos continuam valendo. Os tipos de visualização (`type:` dos tiles) também não mudam de id.
- **Opções NOVAS** nascem com o padrão novo, em todos os tiles ao mesmo tempo, porque ainda não há valor salvo.
- **Defeitos de código** (item 5.1, rolagem, curvas em onda, texto cortado etc.) são corrigidos para QUALQUER valor salvo, e não só para o padrão. A correção não pode depender de o usuário trocar uma opção.
- Quando uma opção existente e uma opção nova se sobrepuserem (ex.: `truncarRotulo` e a nova "Texto longo"), a nova tem precedência: a antiga só vale quando o usuário escolher o modo correspondente (ex.: "Cortar com reticências"). Documente a regra no cabeçalho do gráfico.
- Antes de alterar cada gráfico, gere `docs/opcoes/<id>.antes.json` (id, label, section, tipo, default). Ao final, todos os ids antigos existem com o mesmo tipo e default; só mudam section, order e label. Ids novos são permitidos e devem ser listados no relatório.
- No relatório final, inclua a tabela "Opções salvas que você talvez queira trocar nos tiles" (ex.: `curvaDaLinha` do bump_chart para "bump", se o defeito não for resolvido só por código).

### 4.2 Método
- **Reproduzir antes de corrigir:** para cada defeito, escreva primeiro um teste que o reproduza (e falhe), depois corrija e veja passar. Os testes usam um `config` no formato que o Looker entrega (todas as chaves registradas, valores padrão quando o usuário não mexeu, valores salvos como os citados acima, incluindo `false`, `0` e texto vazio).
- jsdom não faz layout nem mede texto. Para problemas de posição e de texto cortado, escreva testes de GEOMETRIA sobre os números do layout (larguras estimadas de texto com uma função única e documentada), e registre como "conferir no Looker real" no `docs/TESTE_NO_LOOKER.md` (acrescente uma seção "Melhorias v3" com um passo manual por item). Nunca escreva "corrigido" para algo que só foi testado em simulação.
- Se mexer em módulo compartilhado, rode os testes de TODOS os gráficos.
- Se algo estiver ambíguo, assuma o mais simples e registre no LOG. Não pare para enviar resumos. Relatório final em `/biblioteca/docs/RELATORIO_MELHORIAS.md`: o que foi feito, o que foi testado (automatizado), o que fica para conferir no Looker real e o que não foi possível.
- Em `TAREFAS.md`, crie a seção "Melhorias v3" com uma caixa por item da seção 5.

## 5. TAREFAS (nesta ordem; cada fase termina com build, testes, segurança, commit e push)

### FASE 1: defeitos nos módulos compartilhados

**5.1 Tooltip que fica preso na tela (drill).** Em alguns gráficos o tooltip fica persistente depois do clique e não sai. Causa não confirmada (hipóteses: clique em ponto sem link que fixa o tooltip; Esc e clique-fora não chegam ao código dentro do iframe; o menu de drill do Looker aparece por cima, o mouse sai do gráfico e o evento de saída não dispara). Requisitos:
- O tooltip é solto automaticamente: ao o mouse sair do gráfico, ao a janela perder o foco, ANTES de abrir o menu de drill e quando o menu fecha.
- O tooltip fixo tem botão "×" visível. Esc e clique fora funcionam dentro do iframe; trate também o clique fora dele quando o navegador permitir (`blur` da janela).
- No modo `acaoDoClique: drill` (valor salvo hoje em todos os tiles), clicar num ponto SEM link NÃO fixa mais o tooltip. Só fixa no modo "Fixar tooltip" ou com Shift+clique. Isso é correção de defeito (vale para qualquer valor salvo) e muda o comportamento que o PROMPT anterior definiu: documente no relatório.
- Testes que reproduzam cada hipótese (clique com e sem link, saída do mouse com o menu aberto, blur, Esc) e rodem em todos os gráficos que usam o módulo de tooltip, inclusive o `cartao_multivalor` quando existir.

**5.2 Tabela: rolagem que buga e animação ao rolar.** Sintomas: no Explore e no dashboard, com roda do mouse e com a barra, até 500 linhas e 50 colunas, a tabela ao rolar fica em branco e volta à posição inicial, e há animação enquanto rola. Não aparece erro no console. Hipótese a verificar: a virtualização cria as linhas que entram na tela e cada uma dispara a animação de entrada, ou a rolagem dispara um redesenho completo e perde `scrollTop` e `scrollLeft`. Leia o código antes de concluir. Requisitos:
- Animações de entrada das linhas rodam SÓ ao carregar, ordenar, filtrar, buscar e trocar de página. Linhas que entram na tela por causa da rolagem são desenhadas na hora, sem animação, mesmo com `animarEntradaDasLinhas: true` e `quandoAnimar: sempre` salvos.
- A rolagem não redesenha a tabela inteira e preserva `scrollTop` e `scrollLeft` (inclusive em atualizações de dados).
- O destaque de valor que muda (verde ou vermelho) só ocorre em atualizações de dados, não na rolagem.
- Teste que reproduza o defeito antes (simular rolagem e verificar posição, linhas presentes e ausência de classes de animação) e passo manual no `TESTE_NO_LOOKER.md`.

**5.1b Painel de opções: 4 abas e rótulos curtos (defeito).** Num print do editor do Looker, as abas aparecem em ordem alfabética (Avançado, Dados, Interação, Texto...) e a última (Visual) fica cortada, fora da barra. Além disso, rótulos longos terminam em reticências (por exemplo "Modo debug (escreve no console a estrutura..." e "Aplicar o JSON acima por cima das opções"). Hipóteses (confirme no código e no print): o Looker ordena as abas pelo NOME da seção e não pelo atributo `order`, e a barra não quebra linha e comporta cerca de 4 abas curtas. Requisitos:
- Reduza a 4 abas com nomes de no máximo 7 caracteres: "Dados" (campos, ordenação, limites, formato de números), "Estilo" (cores, formas, bordas, tema, layout, escalas, linhas de grade), "Texto" (rótulos, eixos, legenda, título, subtítulo, nota, avisos) e "Mais" (interação, tooltip, animação, avançado, debug, JSON). Se a hipótese da ordem alfabética se confirmar, a ordem na barra será Dados, Estilo, Mais, Texto: registre isso e não dependa de `order` para ordenar abas. Aparece só a aba que tiver opção naquele gráfico. Os nomes das seções mudam; os ids das opções NÃO mudam.
- As mesmas 4 abas e os mesmos nomes em todos os gráficos (os 22 e o novo), definidos num único ponto de configuração.
- Rótulos curtos: no máximo 30 caracteres nas opções liga/desliga e 40 nas demais. Mova explicações longas para o texto de ajuda do painel SOMENTE se a API de opções do Looker aceitar (confirme; não invente); senão, para o README.
- Teste automático que percorre todas as opções de todos os gráficos e falha se houver mais de 4 seções, seção com nome acima de 7 caracteres ou rótulo acima do limite. Passo manual no `TESTE_NO_LOOKER.md`: abrir o editor e conferir que as 4 abas aparecem inteiras e nenhum rótulo é cortado.

**5.1c Título, subtítulo e nota explicativa (todos os gráficos).** Hoje o título e o subtítulo ficam só no canto superior esquerdo, e cada gráfico escreve no rodapé uma nota explicativa pequena e cinza que o usuário não consegue ajustar. Exemplos reais: "30 séries · 53 períodos · 20 barras por vez · a comparação só vale com o gráfico PARADO: o caminho entre dois períodos passa rápido demais para ser retido · escala fixa: as larguras são comparáveis entre períodos"; "30 itens · barras a partir do ZERO (sempre) · referência em $5,276,443.54 · a posição no ranking não muda com a busca"; "30 itens · 1 medida(s) por linha · o eixo inclui o zero · ordem pela 1ª medida (maior primeiro) · a posição na lista não muda com a busca". Observação: a opção salva `mostrarAvisos: false` NÃO esconde essa nota, então ela é outro elemento (confirme no código). Crie um componente compartilhado de cabeçalho e rodapé, usado por todos os gráficos (inclusive os que desenham o cabeçalho por conta própria, como o `kpi_vivo`, e o `cartao_multivalor`), com opções novas na aba Texto:
- **Título e Subtítulo, cada um independente:** mostrar/ocultar; posição (acima ou abaixo do gráfico); alinhamento (esquerda, centro, direita); deslocamento fino em px (X e Y); tamanho; fonte (sistema, monoespaçada, serifada); peso (normal ou negrito); cor; margem; quebra de linha e número máximo de linhas. Os campos de texto `titulo` e `subtitulo` existentes continuam sendo o texto.
- **Nota explicativa:** mostrar/ocultar; posição (abaixo do gráfico, que é o padrão atual; acima; ou "só ao passar o mouse sobre um ícone ⓘ"); alinhamento; tamanho; fonte; cor; quebra de linha e número máximo de linhas; **texto:** "Automático" (o atual) | "Automático + meu texto" | "Só meu texto" | "Nenhum", com um campo de texto livre.
- A nota nunca cobre o gráfico nem o botão de avançar no tempo (`bar_race`). O gráfico recalcula o espaço disponível conforme título, subtítulo e nota estiverem visíveis e onde estiverem.
- Os padrões novos reproduzem o visual de hoje (título e subtítulo à esquerda no topo, nota pequena e cinza no rodapé, tudo visível), para nada mudar até o usuário mexer.
- Cada gráfico informa ao componente o texto automático da nota, num único lugar por gráfico.
- Testes de geometria: título, subtítulo e nota em todas as posições possíveis, sem sobrepor o gráfico nem sair da área, inclusive em tile pequeno. Passo manual no `TESTE_NO_LOOKER.md`.

### FASE 2: tabela_completa (busca, layouts, fórmulas)

**5.3 Busca "contém".** Hoje "MTC" acha `MTCBLACKBR` mas "BLACK" ou "BR" não. Novo comportamento (opções novas, padrão novo):
- Contém o texto em qualquer posição, ignorando maiúsculas e acentos.
- Várias palavras: todas precisam estar presentes (opção "qualquer uma"). Frase entre aspas é exata e `-palavra` exclui.
- Escolher quais colunas a busca olha (padrão: todas as visíveis) e se busca no texto formatado ou no valor bruto.
- Realce do trecho encontrado, contador de resultados e debounce curto. O campo mantém o foco e o cursor enquanto digita.
- Testes com códigos sintéticos (ex.: `ABCBLACKXX`).

**5.4 Colunas calculadas com fórmulas (funções em inglês).**
- Oito espaços fixos de coluna calculada, cada um com: nome, fórmula, formato (número, moeda, %, texto), tipo de célula e posição. Não registre opções dinâmicas por coluna calculada; use espaços fixos.
- Campos como `${campo}` (nome do campo do Looker, e também o rótulo curto quando não houver ambiguidade). Separador de argumentos: vírgula. Nomes de função sem diferenciar maiúsculas de minúsculas.
- Operadores: `+ - * / %`, `= <> < <= > >=`, `AND`, `OR`, `NOT`. Texto entre aspas duplas.
- Funções: `IF`, `IFS` (pares condição e valor, com valor padrão final), `CASE`, `COALESCE`, `ISBLANK`, `ROUND`, `ABS`, `MIN`, `MAX`, `SUM`, `AVG` (sobre vários campos da MESMA linha), `CONTAINS`, `LEFT`, `RIGHT`, `MID`, `UPPER`, `LOWER`, `LEN`, `CONCAT`, `TEXT`.
- Exemplo que deve funcionar (comissão escalonada): `IFS(${qty}<=10, 1*${qty}, ${qty}<=30, 2*${qty}, ${qty}<=50, 3*${qty}, ${qty}<=70, 4*${qty}, 5*${qty})`. Outro: `IF(CONTAINS(${code}, "BLACK"), "Black", "Other")`.
- A fórmula também pode ser usada como regra de formatação condicional (colorir célula ou linha quando for verdadeira).
- **Pivô:** opção por coluna, "Modo do pivô": "Uma vez por valor do pivô" (a fórmula é avaliada para cada valor do pivô, usando os campos da mesma coluna do pivô) | "Só nas colunas sem pivô". Se uma das duas não puder ser feita de forma confiável, entregue só a outra e diga claramente no relatório.
- **Linha de totais:** por coluna, "recalcular a fórmula sobre os totais" (quando todos os campos usados tiverem total) ou "vazio". Padrão: recalcular quando todos os campos tiverem total, senão vazio.
- Erro de fórmula aparece na própria célula (ex.: `#ERRO: campo não encontrado`), sem derrubar a tabela. Valide a fórmula ao digitar e mostre a mensagem de erro no painel quando possível.
- Segurança: analisador próprio, limite de tamanho da fórmula e de profundidade, sem acesso a nada fora dos campos da linha. Testes de unidade extensos (precedência, texto, nulos, divisão por zero, funções, erros).
- Verifique se a tabela lê as chaves nativas de formatação condicional do Looker (`conditional_formatting`, `series_cell_visualizations` etc.) e registre no relatório o que lê e o que não lê (não implemente isso agora).

**5.5 Layouts da tabela (estrutura, separada das cores).** Nova opção "Layout" (padrão: "Tabela", igual ao atual) e use a opção `densidade` que já existe. Os temas de cores continuam independentes. Layouts:
1. Tabela (atual)
2. Cartões: cada linha vira um cartão com os campos em grade, com escolha de quais campos mostrar e de quantas colunas
3. Lista de app: título e subtítulo à esquerda, valores à direita
4. Transposta: campos nas linhas, registros em colunas
5. Planilha: grade completa com números de linha e letras de coluna
6. Relatório financeiro: grupos em faixas, subtotais em destaque, recuo por nível, linhas de total mais grossas
7. Ranking: barras embutidas ao fundo das células
8. Mestre e detalhe: lista à esquerda e painel com todos os campos da linha selecionada à direita
9. Seções: colunas agrupadas em blocos separados, com título

Todos respeitam busca, ordenação, filtros, seleção, rolagem sem animação (5.2) e virtualização com 500 linhas por 50 colunas. Fixtures sintéticas.

### FASE 3: bump_chart e diagrama_venn

**5.6 bump_chart: alinhamento.** Sintomas num print do Looker real (11 séries e 7 categorias de eixo; só 5 séries com dado nos dois últimos; rótulos de valor ligados, alguns com percentual):
1. Os rótulos de valor não ficam junto do círculo a que pertencem: aparecem soltos, em outra altura, e as linhas passam por cima do texto.
2. A última coluna fica colada na borda direita: círculos encostados e rótulos como "397.51 (73.39%)" sobrepostos aos círculos.
3. A linha de baixo (rank 11) encosta na nota de rodapé.
4. As curvas fazem ondas entre colunas em vez de sair e chegar na horizontal no centro dos círculos. O tile salva `curvaDaLinha: catmull`.
Cortes de linha em períodos sem dado são comportamento previsto: mantenha.
- Reproduza primeiro com testes de geometria sobre uma fixture sintética (11 séries x 7 categorias, 5 séries só nos dois últimos, valores grandes, rótulos com percentual): (a) o centro de cada rótulo fica na altura do centro do círculo, com deslocamento horizontal fixo; (b) tudo fica dentro da área do SVG, inclusive a última coluna; (c) a linha de rank mais baixo e a nota não se sobrepõem; (d) nenhuma curva sai da faixa vertical entre os dois círculos que liga.
- Margens calculadas pela largura estimada do maior rótulo (direita) e do maior nome de série (esquerda). Se não couber, reduzir a fonte até um mínimo e depois abreviar (K, M), com o valor completo no tooltip.
- Rótulos de valor: opção nova "Posição do valor" (Ao lado do círculo | Acima | Abaixo | Só no tooltip | Automática), padrão Automática, com anti-colisão por coluna, halo na cor de fundo e desenhados acima das linhas.
- Curvas: o defeito vale para o `catmull` salvo. Corrija o `catmull` para não ultrapassar a faixa vertical entre os dois círculos (limitar os pontos de controle, mantendo o nome do valor) e acrescente o valor novo "bump" (tangente horizontal nas duas pontas, sem overshoot; `d3.curveBumpX` se existir no d3-shape embutido, senão implemente). Linhas abaixo dos círculos e entrando no centro deles.
- Rodapé: faixa própria para a nota, e a altura considera o rank mais baixo. Se ficar baixo demais, esconder a nota em vez de sobrepor.
- Opcional, só se couber sem risco: "Nomes também à direita" (padrão desligado).

**5.7 diagrama_venn: layout e hover (só estética; sem erros).** O usuário detestou o layout e o comportamento do hover. Referência: o Venn nativo do Looker (círculos com área proporcional, cores semitransparentes, rótulos legíveis, destaque ao passar o mouse). NÃO copie código de terceiros: reproduza o visual com código próprio. Problemas vistos num print (3 conjuntos, nomes longos terminando em "(Yes / No)"):
- O diagrama ocupa pouco espaço e fica pequeno no meio, com muita área vazia.
- Os nomes ficam do lado de fora e se sobrepõem (o de um conjunto cai sobre o círculo de outro).
- Os números das regiões são pequenos, em negrito preto e apertados no centro (duas regiões vizinhas quase se tocam).
- Os nomes aparecem duas vezes (rótulos externos e legenda), e são longos.
Requisitos (opções novas, padrão novo):
- **Layout** (novo): "Moderno" (padrão) | "Clássico" (o atual).
- O diagrama preenche a área disponível, com margem configurável, e escala junto com o contêiner (inclusive em tiles pequenos).
- Texto automático: tamanho dos rótulos e números calculado pelo espaço de cada região, com mínimo e máximo; opção de tamanho fixo (as opções `tamanhoDoRotulo` e `tamanhoDaFonte` salvas continuam valendo quando o usuário escolher "fixo").
- Nomes dos conjuntos: dentro do círculo, fora com linha-guia, ou só na legenda, com anti-colisão. Opção para **abreviar o nome** (remover sufixo configurável, como "(Yes / No)", ou usar um apelido por conjunto) e quebra de linha.
- Números das regiões: com halo (contorno na cor de fundo), tamanho maior, em linhas separadas (valor e percentual), anti-colisão entre regiões vizinhas e rótulo externo com linha-guia para regiões pequenas.
- Legenda opcional (padrão: oculta quando os nomes já estão no diagrama).
- **Hover e seleção:** a região sob o mouse cresce um pouco e ganha contorno mais forte; as outras regiões ficam mais claras; tooltip com nome da região, valor e percentual; o clique fixa a seleção (e o drill do Looker abre quando houver link, seguindo a `acaoDoClique`); Esc ou clique fora solta (ver 5.1). Transições suaves com duração e easing configuráveis e interruptor para desligar (reaproveite as opções de animação existentes e acrescente só o que faltar).
- Testes de geometria (nenhum rótulo sobreposto nem fora da área; o diagrama ocupa pelo menos X% da área) com fixtures de 2, 3, 4 e 5 conjuntos.

### FASE 4: árvores e organograma

**5.8 Base compartilhada das árvores.** Crie (ou reaproveite) uma base `_arvore` com o que `arvores_multiplas` e `org_chart` compartilham: expandir e recolher com animação, centralização, texto longo, botões e seleção sem texto. As opções novas existem nos dois gráficos com os mesmos ids e rótulos.

**5.9 Animação ao abrir e fechar.** Os filhos saem do pai e voltam para ele ao fechar (deslizamento com esmaecimento); os irmãos e os níveis abaixo se reposicionam suavemente, sem pulo. Opções: ligar/desligar animação de expandir e recolher, duração em ms (padrão 350), tipo de movimento, atraso entre filhos (cascata), respeito a `prefers-reduced-motion`. Reaproveite as opções de animação já existentes (`animacaoAtiva`, `duracaoDaAnimacao`, `atrasoDaAnimacao`, `cascataDaAnimacao`, `suavizacaoDaAnimacao`) quando fizer sentido e acrescente apenas as novas. Nada anima por causa de rolagem ou de movimento.

**5.10 Centralizar.** Opções: alinhamento horizontal (esquerda, centro, direita), alinhamento vertical (topo, meio, base), deslocamento fino em px para cada direção, o que centralizar (o desenho inteiro, a raiz ou o nó selecionado) e quando (ao carregar, a cada abrir ou fechar com animação, ou só ao clicar no botão "Centralizar", que fica ao lado de "Expandir tudo" e "Colapsar tudo"). Padrão: horizontal e vertical, ao carregar e ao clicar no botão. Quando a árvore for maior que a área, centralize o conteúdo e deixe a rolagem nas duas direções, sem cortar o lado esquerdo. No `arvores_multiplas`, centralizar o conjunto e também cada árvore dentro da sua célula (opção).

**5.11 Texto longo (não cortar; o usuário controla o comportamento).** Sintoma: os rótulos mais longos passam do espaço da árvore e são cortados na borda (ex.: nome do lugar mais valor e percentual juntos). No `org_chart`, os balões terminam em reticências. Nova opção "Texto longo" (padrão: "Mostrar inteiro"), nas DUAS árvores e no organograma:
- Modos: Mostrar inteiro (a árvore reserva a largura do maior texto e ganha rolagem horizontal) | Quebrar em linhas | Reduzir a fonte (até um mínimo) | Cortar com reticências | Cortar sem reticências | Abreviar números (K, M, B) | Só o nome (valor e percentual no tooltip).
- Controles: largura máxima do rótulo em px ("automática" por padrão), número máximo de linhas, tamanho mínimo da fonte, o que aparece no rótulo (nome, valor, percentual) e o separador, tooltip com o texto completo sempre que houver corte (liga e desliga) e margem extra à direita.
- A opção antiga `truncarRotulo` (salva como 60 nos tiles) só vale no modo "Cortar com reticências" (ver 4.1).
- Teste de geometria com textos longos sintéticos: nenhum rótulo fora da área da árvore nem do gráfico no modo "Mostrar inteiro".
- Opção "Permitir selecionar texto" (padrão desligada): com `user-select: none`, um clique ou duplo clique no gráfico não deixa o título ou os rótulos selecionados em azul.
- Opção "Símbolo da moeda" (Automático = comportamento atual | R$ | $ | € | nenhum | personalizado), porque o rótulo mostra R$ enquanto o subtítulo do tile diz USD.

**5.12 arvores_multiplas: grade.** Reaproveite as opções existentes (`colunasDaGrade`, `larguraMinimaDaArvore`, `alturaDaArvore`, `layoutDaArvore`, `nivelInicialExpandido`, `mostrarBotoesDeExpandir`). Acrescente: largura e altura por árvore (opções dinâmicas por nome da árvore, como já é feito com `cor_<série>`), espaçamento horizontal e vertical entre as células, alinhamento dentro da célula e linhas-guia da grade (opção, padrão desligada). Arrastar a borda da célula para redimensionar só se `atualizarConfig` (ou equivalente) for confirmado na API; se não for, entregue só os campos numéricos e diga isso no relatório. Se o `cluster` for usado, mantenha como está.

**5.13 org_chart.**
- Botões "Expandir tudo" e "Colapsar tudo" iguais aos do `arvores_multiplas` (e "Centralizar"). Hoje o tile salva `mostrarBotoesDeExpandir: true` e eles não aparecem: descubra o motivo e corrija (defeito).
- Estética dos balões (reaproveite `larguraDoCartao`, `alturaDoCartao`, `raioDoCartao`, `espacoEntreNiveis`, `espacoEntreIrmaos`, `preencherCartao`, `mostrarContorno`, `corDoContorno`, `espessuraDoContorno`): acrescentar cor por nível, por nó ou por valor; borda (cor, espessura); sombra; tamanho do balão que se ajusta ao conteúdo; fonte, tamanho e alinhamento do texto (esquerda, centro, direita; hoje está à direita); contraste automático do texto (claro ou escuro conforme o fundo); quais campos aparecem no balão (nome, valor, percentual, contagem); estilo do contador (círculo, pílula ou oculto); linhas de ligação (cor, espessura, formato reto, cotovelo ou curvo). O contador ("+20") deve ficar contido no seu círculo.
- Barras de rolagem só quando forem necessárias.
- Animação ao abrir e fechar (5.9), centralização (5.10) e Texto longo (5.11).

**5.13b dot_plot_denso: rótulos cortados nas margens (e auditoria da mesma família).** Sintomas num print do Looker real (lista de 30 itens com valores em milhões e valores no formato "23.51M (14.85%)"):
1. O rótulo do item de MAIOR valor, que fica na borda direita da escala, aparece cortado: sai só "74.0" em vez do texto completo no mesmo formato dos demais. Informação some.
2. Os nomes da coluna da esquerda são truncados ("South Ko…"). O tile salva `larguraDoNome: 80`.
3. A última linha visível ("Puerto R…") fica por baixo do eixo de valores: confirme se é só a rolagem normal ou se há sobreposição entre a lista e o eixo, e corrija a sobreposição.
4. Observação (registre a causa no relatório; só altere se não for por design): o eixo começa em um valor negativo (cerca de -3 milhões) embora todos os valores sejam positivos; a nota do gráfico diz que "o eixo inclui o zero".
Requisitos:
- Reproduza primeiro com testes de geometria sobre uma fixture sintética (30 itens, valores em milhões, um deles no valor máximo da escala, um nome longo): nenhum rótulo de valor, nome ou marca do eixo pode ficar fora da área do SVG.
- A margem direita é calculada pela largura estimada do maior rótulo de valor que é desenhado ao lado do ponto. Nova opção "Rótulo na borda" (Inverter para a esquerda do ponto | Reservar folga na escala | Reduzir a fonte), padrão "Inverter para a esquerda do ponto" quando o rótulo não couber à direita. Vale para qualquer valor salvo (é defeito).
- Nomes: aplique a opção "Texto longo" do item 5.11 à coluna de nomes (mesmos ids, rótulos e modos). Se a lógica de Texto longo ainda estiver dentro da base das árvores, extraia-a para um módulo genérico (por exemplo `src/core/texto-longo.js`) e use-o nas árvores, no organograma e aqui. No modo "Mostrar inteiro", a largura da coluna de nomes sai do maior nome, limitada a uma porcentagem da largura do gráfico (configurável). O valor salvo `larguraDoNome: 80` só vale nos modos de corte (ver 4.1).
- Separe visualmente a lista rolável do eixo: nenhuma linha pode ficar sob as marcas do eixo.
- **Auditoria da mesma família:** escreva o mesmo teste de geometria ("o rótulo do valor extremo cabe dentro da área") para `barras_ranking_denso`, `dumbbell`, `bar_race`, `pareto`, `drawdown` e `heatmap_denso`. Corrija SOMENTE os que reproduzirem o defeito, reaproveitando o mesmo cálculo de margem (extraia para um módulo compartilhado). Liste no relatório quais foram verificados e o resultado de cada um.
- Passo manual no `TESTE_NO_LOOKER.md`: abrir o dot_plot_denso com o maior valor no fim da escala e conferir que o rótulo aparece inteiro.

### FASE 5: nova visualização `cartao_multivalor`

**5.14 Cartão Multi-Valores.** ID `cartao_multivalor`, Label "Cartão Multi-Valores". Visualização nova e independente do `kpi_vivo` (não mexa nele). Um cartão que reúne vários valores, como o "Multiple Value" nativo do Looker, mas extremamente customizável. Estilo padrão parecido com o que o usuário usa hoje: título, valor grande no topo com subtítulo pequeno que mostra de onde vem ("6 + 3 + 1"), pilha de itens com rótulo pequeno em cima e valor embaixo, centralizados; um selo colorido (botão) para uma categoria; uma legenda de faixas com um quadradinho de cor por faixa; separadores entre blocos. Sem dependências e com opções por campo registradas dinamicamente (como já existe em outros gráficos).
- **Modo:** "Um cartão (primeira linha)" | "Um cartão por linha (grade)", com colunas e espaçamento configuráveis.
- **Campos:** dimensões (texto) e medidas (número) no mesmo cartão. Por campo: visível ou não, ordem, rótulo, formato (casas decimais, K/M/B, moeda, %, prefixo e sufixo), o que mostrar para zero e para nulo (hoje aparece "0.0"), alinhamento, tamanho e cor do rótulo e do valor, e tipo de exibição: número, texto, selo colorido, link, barra de progresso, anel, mini gráfico, seta de variação, estrelas, semáforo, ícone (conjunto embutido de ícones em SVG).
- **Valor de cabeçalho calculado:** soma, média, mínimo, máximo ou fórmula (reaproveite o interpretador do item 5.4) sobre campos escolhidos, com o subtítulo gerado ("6 + 3 + 1") ou texto livre.
- **Faixas e selos por regra:** limites que definem texto, cor e ícone (ex.: Black acima de 8,4; Kraft de 7 a 8,4; White de 5,5 a 6,9; Não membro abaixo de 5,5), com opção de mostrar a legenda e de aplicar a um campo escolhido.
- **Layouts:** pilha vertical, grade em várias colunas, linha horizontal, rótulo à esquerda e valor à direita, destaque grande com lista abaixo; divisórias; seções que expandem e recolhem.
- **Aparência:** cor, borda, sombra e arredondamento do cartão; fonte; o conteúdo se ajusta ao tamanho do tile (sem ficar pequeno).
- **Interação:** drill do Looker no valor (campos com link aparecem sublinhados), tooltip, destaque ao passar o mouse, copiar o valor, `acaoDoClique`.
- **Animações:** contador que sobe, entrada dos itens em cascata, barras e anéis que crescem, destaque quando o valor muda, pulso em alerta, efeito de dígitos rolando. Duração, atraso e easing configuráveis; interruptor global; respeito a `prefers-reduced-motion`; nada anima por causa de rolagem.
- Registre em `config/charts.json`, no MANIFEST e no `URLS.md`. Fixtures sintéticas (um cartão e uma grade). Documente como montar o Explore.

### FASE 5b: pacotes temáticos (infraestrutura) e pacote Café (opcional, ligável e desligável)

Princípio: a biblioteca continua neutra. O tema café é UM pacote entre outros possíveis, pode ser desligado, e nenhum gráfico, módulo ou opção existente depende dele.

**5.14b Infraestrutura de pacotes.** `src/core/pacotes.js` (registro) e `src/packs/<nome>/` (um por pacote). Um pacote registra ícones (SVG numa grade 24x24, com variante de contorno e variante preenchida), formas de marcador, paletas (categóricas, sequenciais e divergentes) e presets de layout, tudo com id único e prefixo do pacote (`cafe_...`). Os módulos compartilhados (formas do item 2.4, ícones, paletas, tabela, cartões, árvores) consultam o registro e não importam o pacote diretamente.
- Opção nova "Pacote temático" (aba Estilo, só nos gráficos que usam ícones, formas ou paletas): "Nenhum" | "Café". Padrão "Café", definido numa constante única `PACOTE_PADRAO`. Quando "Nenhum", as listas de ícones, formas e paletas não mostram os itens do pacote.
- Se um valor salvo pertence a um pacote desligado, ele continua sendo desenhado normalmente (o valor salvo vence, ver 4.1). O pacote só controla o que aparece nas listas.
- Adicionar um pacote novo é adicionar uma pasta e registrá-la, sem editar gráficos.
- Teste: o build e TODOS os testes passam com `src/packs/cafe` removido ou desativado (variável de ambiente) e também com ele ligado.

**5.14c Pacote Café: regras de conteúdo.** Tudo genérico. Nenhum nome, logotipo, cor de marca, slogan ou nome de nível de franquia da empresa do usuário, nem de outras marcas. Desenhe todos os ícones do zero, sem copiar conjuntos de terceiros. Nomes de níveis genéricos (Nível 1, 2 e 3; Bronze, Prata e Ouro). Dados de teste sintéticos.

**5.14d Ícones do pacote Café:** xícara, copo de viagem, grão, prensa francesa, moedor, máquina de espresso, croissant, bolo, loja, quiosque, caminhão de entrega, cupom, estrela de fidelidade, coroa e cartão. Opção "Estilo do ícone" (Contorno | Preenchido; padrão Contorno), valendo para todos os ícones. Disponíveis onde há ícone: `kpi_vivo` (novos valores em `iconeDoKpi`; os 9 atuais e o valor salvo permanecem), `cartao_multivalor`, células de tabela do tipo ícone, selos e nós das árvores e do organograma.

**5.14e Paletas:** Espresso, Latte, Caramelo, Crema e Mocha (categóricas, com pelo menos 8 cores distinguíveis cada) e as escalas contínuas "Torra" (clara para escura) e "Torra divergente". A "paleta da marca" é a paleta personalizada que já existe (o usuário digita as cores): não coloque cor de marca no código. Teste simples de que as cores de cada categórica são distintas entre si e de que as paletas só aparecem nos seletores com o pacote ligado.

**5.14f Ícone por valor (genérico, não só de café):** opção "Ícone por valor" (um campo mais um texto `valor=icone; valor=icone`, na mesma sintaxe do mapa), reutilizável em `cartao_multivalor`, tabela, árvores e organograma, com ícone padrão para valores sem mapeamento e cor por valor. Os exemplos usam valores genéricos (`TipoA=cafe_loja`).

**5.14g Progresso em xícara:** exibição em que a xícara enche conforme o percentual (0 a 100%), como opção no `kpi_vivo` (ao lado da barra de meta), no `cartao_multivalor` e como tipo de célula da tabela. Animação do enchimento com duração e easing configuráveis, interruptor, respeito a `prefers-reduced-motion`, e sem animar por causa de rolagem.

**5.14h Formas de marcador do pacote:** xícara, grão e copo, registradas na função única de formas (item 2.4), nos gráficos de pontos.

**5.14i (opcional; só se sobrar tempo, e deixe `[ ]` se não fizer):** layout de tabela "Cardápio" (nome ......... valor, com pontilhado até o valor), layout de cartão "Comanda" (estilo recibo, fonte monoespaçada, separadores tracejados) e vapor animado sobre a xícara (desligado por padrão). Todos aparecem somente com o pacote ligado.

### FASE 6: fechamento

**5.15** Build determinístico (rode duas vezes e confirme que o `git status` fica limpo), `npm test` e `npm run seguranca` completos, tag de versão e URLs curtas: crie a tag `v3.N` no último commit que alterou `biblioteca/dist` (N é o próximo número livre; confira com `git tag -l 'v3.*'`; o nome não pode ter barra) e ENVIE a tag (`git push origin v3.N`) ANTES de gerar as URLs; depois rode `npm run urls` num commit separado, para que `URLS.md` e `URLS.csv` tragam duas URLs por gráfico: a PRINCIPAL, curta, com a tag (`https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@v3.N/biblioteca/dist/<id>.js`), e a ALTERNATIVA com o hash de 40 caracteres do mesmo commit, para o caso de a tag falhar; confirme com `git ls-remote --tags origin` e `git ls-tree v3.N` que a tag existe e contém os arquivos; NUNCA mova, recrie nem apague uma tag que já exista (um novo lançamento usa uma tag nova, `v3.N+1`); o script `npm run urls` deve aceitar a tag como parâmetro e nunca usar branch, `@main` nem `@latest`, atualização do `README.md` da biblioteca e do `docs/TESTE_NO_LOOKER.md` (seção "Melhorias v3", com um passo manual por item acima), e o `docs/RELATORIO_MELHORIAS.md` com a tabela de opções salvas citada em 4.1. No relatório, liste quais gráficos mudaram (e portanto têm hash novo no `URLS.md`) e quais não mudaram.

**5.15b Portabilidade do repositório (migração futura para uma conta interna da empresa).** O usuário pretende mover este repositório para uma conta interna. Faça da migração uma troca de configuração:
- `config/repo.json` (dono, nome do repositório e modo de hospedagem) é o ÚNICO lugar com o dono e o nome do repositório. O `npm run urls` lê esse arquivo (ou o `git remote origin`). Nada mais no código, nos testes nem nos cabeçalhos dos bundles cita o dono ou o nome do repositório.
- Modo de hospedagem configurável nesse arquivo: `jsdelivr` (padrão; URLs `https://cdn.jsdelivr.net/gh/<dono>/<repo>@<tag>/biblioteca/dist/<id>.js`) ou `base-url` (um prefixo qualquer, por exemplo o de um servidor ou bucket interno: `<prefixo>/<tag>/<id>.js`). Nos dois modos o `URLS.md` e o `URLS.csv` saem prontos para colar. Registre no README que, pelo que se sabe, o jsDelivr só serve repositórios PÚBLICOS do GitHub: se o repositório novo for privado ou estiver num servidor interno, é preciso usar o modo `base-url` e hospedar os `dist/*.js` num endereço que o navegador dos usuários alcance.
- Nenhum arquivo versionado pode conter caminhos locais do computador, nome de usuário, nome de pessoa ou de conta (exceto `config/repo.json` e os arquivos gerados `dist/URLS.*`). Teste automático que faz a varredura e falha se encontrar.
- `docs/MIGRACAO.md`: passo a passo para mover o repositório preservando branches, tags e histórico (clonar como espelho e enviar branches e tags ao novo destino), o que atualizar (`config/repo.json`, `package.json`, README, o `PROMPT_AGENTE.md` da raiz), como regenerar o `URLS.md`, e o aviso de que as URLs antigas deixam de funcionar se o repositório antigo for apagado ou ficar privado, e que então cada visualização cadastrada no Looker precisa receber a URL nova.
- O pacote Café e qualquer outro pacote não podem conter nada específico da conta nem da empresa (ver 5.14c).

## 6. FORA DE ESCOPO (não faça)

O mapa (`/src/mapa_customizavel.js`), qualquer arquivo fora de `/biblioteca`, publicação ou cadastro no Looker, LookML, e os gráficos arquivados em `/biblioteca/_arquivados`.

## 7. RETOMADA E INTERRUPÇÃO

A sessão pode ser cortada a qualquer momento por limite de uso, sem aviso. Por isso: (1) commit e push após CADA etapa pequena; (2) atualize o `LOG.md` ANTES de começar cada etapa (o que vai fazer) e DEPOIS de terminá-la, com a "próxima ação exata"; (3) deixe o branch sempre em estado que carrega e não quebra o build; (4) se um arquivo ficar pela metade, marque `[~]` em `TAREFAS.md` e descreva o que falta. AO RETOMAR: releia este arquivo, rode `git status` e `git log -5`, leia `TAREFAS.md` e `LOG.md`, confirme o branch, confira arquivos sem commit da sessão anterior (se completos, teste e commite; se pela metade, termine ou descarte conforme o LOG) e continue da primeira tarefa `[~]` ou `[ ]`. Não refaça o que está `[x]`. Registre no LOG "sessão retomada em <data>". Decisões importantes vão para o LOG, não só o andamento: você não lembra das sessões anteriores. Se um item travar em 3 tentativas, marque `[!]` com o motivo e siga para o próximo.
