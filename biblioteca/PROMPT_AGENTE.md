# PROMPT_AGENTE (v2): Corrigir e reorganizar a biblioteca de visualizações customizadas do Looker

Este arquivo SUBSTITUI a versão anterior do PROMPT_AGENTE.md e é autocontido: tudo o que você precisa saber está aqui. Você trabalha sozinho, sem supervisão, até terminar ou a sessão ser interrompida.

## 0. PRIMEIRA AÇÃO

1. Sobrescreva `/biblioteca/PROMPT_AGENTE.md` com o texto deste arquivo (você não lembra de sessões anteriores e vai precisar reler estas regras). Se a cópia da raiz do repositório for diferente deste texto, não altere a da raiz: ela é do usuário.
2. Rode `git fetch`, `git status` e `git log -5`. Confirme que está no branch `agente/novas-viz`. Se a `main` tiver avançado, faça merge da `main` no branch (nunca rebase de commits já enviados). Se houver conflito em arquivos fora de `/biblioteca`, pare e registre no LOG.
3. Leia `/biblioteca/LOG.md` e `/biblioteca/TAREFAS.md`. Se já houver uma seção "Correções" em andamento, siga a seção 8 (RETOMADA) em vez de recomeçar.

## 1. ESCOPO E LIMITES

- Sua tarefa é SOMENTE escrever e corrigir código e subir para o Git. Tudo fica no repositório. Não acesse o Looker, não publique em bucket, não use LookML (`manifest.lkml` está fora de escopo) e não cadastre nada em lugar nenhum. O usuário cadastra as visualizações depois, no painel Admin do Looker, usando URLs do jsDelivr com hash de commit.
- Repositório: https://github.com/JoelRabitch/Dashborads_NEW (PÚBLICO, branch principal `main`). Tudo o que você cria e altera fica em `/biblioteca`. NÃO altere, mova, renomeie nem apague nada fora de `/biblioteca` (`/src`, `/test`, `/tools`, `/npm-package` e o `README.md` da raiz são do usuário). Única exceção: manter, no fim do `README.md` da raiz, a seção curta "Biblioteca modular (/biblioteca)" apontando para `/biblioteca/README.md` (atualize-a se já existir).
- Gráficos de mapa e geográficos estão fora de escopo.
- Várias visualizações de terceiros falharam na versão atual do Looker. NÃO copie código de terceiros. Não invente métodos da API do Looker: se não tiver certeza de que um método existe, diga e use uma alternativa.

## 2. GIT (regras rígidas)

- Trabalhe SOMENTE no branch `agente/novas-viz`. NUNCA faça push na `main`, nunca use `--force`, nunca reescreva histórico, nunca apague branches nem tags. As URLs que o usuário já cadastrou no Looker apontam para commits antigos pelo hash e só funcionam enquanto esses commits existirem.
- Um commit por etapa pequena, mensagem em português (ex.: `fix: tooltip único e valores formatados (módulo 2.3)`), e push após cada commit. Se o push falhar, tente de novo uma vez, registre no LOG e siga localmente.
- COMMITE `/biblioteca/dist` (o usuário aponta o campo Main do Looker para esses arquivos).
- O repositório é público: não commite credenciais, tokens, URLs internas, nomes de clientes nem dados reais de negócio. Dados de exemplo são sintéticos. Não commite `node_modules`. Use apenas o acesso Git já configurado na máquina; se não houver permissão de push, registre no LOG e deixe os commits locais.

## 3. REGRAS TÉCNICAS E DE SEGURANÇA (obrigatórias)

- **Proibido** em `src/` e `dist/`: `fetch`, `XMLHttpRequest`, `sendBeacon`, `eval`, `new Function`, `document.cookie`, `localStorage`, `sessionStorage`, `window.open`, `@import`, `document.write`, `importScripts`, `WebSocket`, recursos de outros domínios e `innerHTML` sem escapar. Única exceção: os namespaces `http://www.w3.org/2000/svg` e `xlink` para criar SVG. `navigator.clipboard` e `Blob` com URL local são permitidos. Rode o grep de segurança (`npm run seguranca`) em cada gráfico alterado e mostre o resultado no LOG.
- Texto vindo de dados (nomes de campos, valores, templates) entra SEMPRE por `textContent` ou atributos validados. HTML do Looker (`htmlForCell`) só quando o usuário ligar uma opção explícita.
- **Dependências:** cada `dist/<id>.js` é autocontido e o campo Dependencies do Looker fica VAZIO. Módulos d3 só como devDependencies EMBUTIDAS no bundle, com versão exata (confira com `npm view` que existe e foi publicada há mais de 14 dias) e licença ISC ou BSD. Nada é carregado de fora em tempo de execução. Se um gráfico não usa d3, desenhe em SVG puro.
- **Arquitetura existente (respeite):** só `src/core/looker-adapter.js` toca em `looker.*` e `LookerCharts.*`; só `src/core/data-model.js` lê `queryResponse` e as células; opções declarativas em `options-kit.js`; temas em `theme.js`; um gráfico por pasta em `src/charts/<id>/`; `config/charts.json` é o registro; `build/build.mjs` gera `dist/<id>.js` (IIFE único, NÃO minificado) e `dist/MANIFEST.md`; testes em `test/` (harness e teste de fumaça); documentação em `docs/` (`COMPAT.md` lista cada método da API do Looker usado e como adaptar se mudar). Se mudar algo na arquitetura, atualize `docs/ARQUITETURA.md` e `docs/COMPAT.md`.
- `registerOptions`: o Looker só mostra o valor escolhido de um select se o `config` já o tiver antes de o `registerOptions` disparar; registre só quando a lista de campos mudar, para evitar loop infinito.
- Código comentado em português, cada gráfico com cabeçalho explicando o que faz, campos esperados e opções.

## 4. REGRAS DESTA TAREFA

- Esta tarefa SUBSTITUI a lista anterior de 54 visualizações. Os gráficos arquivados (seção 5) não devem mais ser construídos nem retomados. Se `TAREFAS.md` tiver itens pendentes `[ ]` ou `[~]` de gráficos arquivados ou de gráficos que nunca foram construídos, marque como `[-] arquivado`.
- Em `/biblioteca/TAREFAS.md`, crie a seção "Correções" com uma caixa por módulo (2.1 a 2.9) e por gráfico, para a retomada funcionar. Registre decisões e estado em `/biblioteca/LOG.md`.
- **IDs das opções:** NUNCA remova, renomeie nem mude o `id` de uma opção existente, nem o tipo ou o valor padrão dela (exceto os dois padrões pedidos explicitamente em 6.2 e 6.8). Só `section`, `order` e `label` podem mudar. Dashboards salvos precisam continuar funcionando. Se a causa de um defeito for nome divergente entre a opção registrada e a chave lida, corrija a LEITURA, não o id.
- Antes de alterar cada gráfico, gere a lista das opções atuais (id, label, section, tipo, default) em `/biblioteca/docs/opcoes/<id>.antes.json`. Ao final, todos os ids antigos devem continuar existindo com o mesmo tipo e default; só mudam section, order e label. Ids NOVOS são permitidos (liste-os à parte no relatório).
- **Reproduzir antes de corrigir.** Para cada defeito, escreva primeiro um teste que o reproduza (e falhe), depois corrija e confirme que passa. Os testes atuais passam (478 de 478), mas os defeitos aparecem no Looker real, então o simulador não reproduz o comportamento real do `config`. Por isso: (a) os testes usam um `config` no formato que o Looker entrega (objeto com as chaves das opções registradas, com valores padrão quando o usuário não mexeu e valores alterados quando mexeu, incluindo `false`, `0` e texto vazio); (b) o modo debug mostra no console as chaves registradas contra as chaves recebidas no `config`; (c) no relatório, separe "verificado em teste automatizado" de "precisa ser conferido no Looker real". Nunca escreva "corrigido" para algo que só foi testado em simulação.
- Para cada módulo, escreva um teste ou checklist e execute antes de dar como concluído.
- Se algo estiver ambíguo, assuma o mais simples e registre a decisão no LOG em vez de perguntar. No fim de cada etapa, liste o que ficou de fora e o que o usuário precisa conferir no Looker real.
- Não pare para enviar resumos entre etapas. O relatório final vai para `/biblioteca/docs/RELATORIO_CORRECOES.md`; você só responde na conversa quando terminar tudo ou travar de verdade (marque `[!]` com o motivo e siga para o próximo item).

## 5. ESCOPO DE GRÁFICOS

### MANTER (22)
tabela_completa, diagrama_venn, upset_plot, treemap_carteira, kpi_vivo, heatmap_denso, dumbbell, drawdown, dot_plot_denso, bump_chart, slope_chart, bar_race, barras_ranking_denso, arvores_multiplas, org_chart, pareto, marimekko, quadrant_scatter, matriz_2x2, matriz_bcg, risco_retorno, grafico_controle

### ARQUIVAR (32)
theme_river, funil_variacoes, funil_comparativo, gauge_variacoes, gauge_grid, arvore_radial, candlestick_ohlc, linha_bandas, retorno_acumulado, fluxo_caixa, lorenz_gini, ponte_variacao, violin, ridgeline, beeswarm, dispersao_regressao, qq_plot, densidade_ecdf, intervalo_confianca, matriz_dispersao, correlacao_matriz, boxplot_avancado, small_multiples, parallel_coords, horizon_chart, motion_bubbles, parallel_sets, arc_diagram, nightingale, radial_bar, lollipop, waffle

Trabalhe apenas nos gráficos de MANTER. Não toque nos arquivados.

### Procedimento de arquivamento
1. Crie a tag Git `antes-da-limpeza` no estado atual e ENVIE a tag ao GitHub (`git push origin antes-da-limpeza`).
2. Mova para `/biblioteca/_arquivados/` os arquivos dos 32 gráficos (`src/charts/<id>/`, `dist/<id>.js` e fixtures ou testes específicos de cada um), preservando a estrutura. Se algum nunca foi construído, registre no LOG como "nunca construído".
3. NÃO mova `src/core` nem as bases compartilhadas (pastas que começam com `_` em `src/charts`, como `_distribuicao` e `_serie_temporal`), mesmo que só gráficos arquivados as usem. Registre no LOG quais ficaram sem uso.
4. Remova os arquivados de `config/charts.json`, do MANIFEST, do `URLS.md` (se existir), do harness e de `test/gerado` (regenere o registro e as fixtures), e do teste de fumaça.
5. Exclua `_arquivados/` do build, dos testes, do grep de segurança e de qualquer varredura.
6. Atualize o `/biblioteca/README.md` para listar só os 22 gráficos mantidos.
7. Confirme que build, testes e checagem de segurança passam e que os 22 gráficos continuam carregando.

## 6. MÓDULOS COMPARTILHADOS

Corrija nos módulos compartilhados, uma vez só, e reaproveite em todos os gráficos. Não conserte gráfico por gráfico.

### 6.1 Rótulos
Em quase todos os gráficos, as configurações de rótulo não têm efeito. Investigue a causa raiz (opção não lida do config, nome divergente, valor lido só na criação e não no redesenho, `false` ou `0` tratado como ausente) e corrija em uma função única de rótulos. Devem funcionar: mostrar/ocultar, posição, tamanho, cor, rotação, formato numérico, casas decimais e rótulos dos eixos. O config é relido a cada `updateAsync`.

### 6.2 Aba Cores
Corrija a aplicação das cores em todos os gráficos: paleta, cor por série ou categoria, cor de fundo, cor das linhas de grade (tema personalizado) e cor de borda. Verifique se a opção "Aplicar JSON acima por cima das opções" está sobrescrevendo as cores sem querer. Se estiver, o padrão passa a ser DESLIGADO (primeira exceção à regra de defaults; registre no relatório).

### 6.3 Tooltip no padrão do Looker
Problema atual: o tooltip cria um elemento novo a cada hover e não remove o anterior, deixando vários na tela (confirmado em `barras_ranking_denso`). Requisitos:
- Um único elemento de tooltip por gráfico, criado uma vez. O hover só troca conteúdo e posição. `pointer-events: none`.
- Esconder em: mouseleave do gráfico, scroll, redesenho (`updateAsync`) e destruição do gráfico.
- Seguir o cursor com deslocamento pequeno e inverter de lado ao chegar na borda da área do gráfico (a viz roda num iframe e o tooltip não pode passar do limite dele).
- Valores formatados pelo Looker (`LookerCharts.Utils.textForCell(cell)` ou o campo `rendered`), nunca o número cru (hoje aparece "−6.18841").
- **Ação do clique** (opção nova): "Drill do Looker" (padrão), "Fixar tooltip" e "Nenhuma". No modo drill, o clique abre o menu (`LookerCharts.Utils.openDrillMenu`) quando a célula tem `links`, e fixa o tooltip quando não tem. Shift+clique sempre fixa. Clicar fora ou Esc solta o tooltip fixo. Isso resolve o "não fica persistente" do pareto.
- Opção "Tooltip (HTML)": REAPROVEITE a opção de template de tooltip que já existe (mesmo id). Variáveis padronizadas: `{{categoria}}`, `{{valor}}`, `{{serie}}`, `{{percentual}}`, mantendo também o formato antigo `{{nome_do_campo}}`. Campo vazio usa o tooltip padrão. Só as tags `b`, `i`, `br` e `span`; todo valor de variável entra escapado via `textContent`. HTML do Looker (`htmlForCell`) apenas se o usuário ligar a opção "Permitir HTML do Looker".
- Estilo configurável: fundo, borda, fonte, tamanho.
- Teste: simular mouse rápido sobre 50 elementos e confirmar no máximo 1 tooltip no DOM.

### 6.4 Marcadores (formas)
A opção de forma não altera o desenho (`matriz_2x2`, `dot_plot_denso` e outros com pontos). Crie uma função única (círculo, quadrado, triângulo, losango, cruz, estrela, wye). Todos os pontos e bolhas usam essa função em vez de `circle` direto. Leia a opção a cada redesenho. Trate o tamanho separadamente (`symbol` usa área, não raio). Reflita a forma na legenda e no tooltip. Teste: trocar a forma em cada gráfico aplicável e confirmar a mudança.

### 6.5 Aviso amarelo
O aviso amarelo na área superior não sai em vários gráficos. Crie um componente único de avisos com: opção "Mostrar avisos" (padrão LIGADO), opção de posição (topo, rodapé, oculto) e botão para fechar. Avisos que indicam dado ilustrativo ou incorreto continuam escritos no console mesmo quando ocultos. O aviso não pode cobrir o botão de avançar no tempo (`bar_race`) nem a área de rolagem.

### 6.6 Interação do mouse
Crie um helper único de hover e clique: destacar o elemento sob o mouse, atenuar os demais e disparar a ação de clique definida em 6.3. Aplique em todos os gráficos. O Diagrama de Venn hoje se comporta como imagem estática (o mouse passa e nada é destacado ou selecionado); ele é o caso crítico.

### 6.7 Animação
Corrija a animação (transições na entrada e na atualização), com duração e easing configuráveis, uma opção para desligá-la e um interruptor global. Respeite `prefers-reduced-motion`.

### 6.8 Painel de opções: consolidar abas sem perder opções
A barra de abas do editor nativo do Looker não quebra linha e corta as abas à direita, e o CSS dela não é controlável. Reduza a quantidade de abas movendo opções entre elas (sem remover nenhuma), com as mesmas abas na mesma ordem em todos os gráficos e nomes curtos:
- **Dados**: campos, ordenação, limite de categorias, formato de números, casas decimais
- **Visual**: cores, formas, bordas, contornos, linhas de grade, tema
- **Eixos**: eixos e rótulos dos eixos
- **Texto**: rótulos dos dados, legenda, título, avisos
- **Interação**: tooltip, animação, hover e clique
- **Avançado**: debug, JSON, aplicar JSON (sempre por último)

Prefixe os rótulos das opções (ex.: "Rótulo · Tamanho", "Cor · Fundo", "Eixo X · Casas decimais"). Aparece só a aba que tiver opção naquele gráfico. Se ainda não couber, junte Texto e Eixos. Debug e JSON ficam desligados por padrão e só na aba Avançado (segunda exceção à regra de defaults; registre no relatório). Antes de mover, liste as abas existentes hoje em cada gráfico (algumas ficam cortadas à direita) e dê um destino para cada opção. Não presuma como o Looker ordena as abas: use o atributo `order`, documente o que fez e marque como "conferir no Looker real".

### 6.9 Build determinístico e URLs (tudo no Git)
- O build não escreve data nem hash de commit no cabeçalho dos `dist/*.js` e só reescreve um arquivo quando o conteúdo mudar. Rode o build duas vezes seguidas e confirme com `git status` que a segunda não altera nenhum arquivo.
- Ao final, gere `/biblioteca/dist/URLS.md` (e `URLS.csv`) com uma entrada por gráfico mantido: ID, Label, Main e como montar o Explore. O Main é a URL do jsDelivr com o hash de 40 caracteres do último commit que alterou `biblioteca/dist`, no formato `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@<HASH>/biblioteca/dist/<id>.js`. Nunca use branch, `@main`, `@latest`, `raw.githubusercontent.com` nem `github.com/blob` (o Looker bloqueia essas respostas com `ERR_BLOCKED_BY_ORB`). Se já existir um script de URLs de uma tarefa anterior, reaproveite. Como um arquivo não pode conter o hash do próprio commit, commite os `dist` primeiro e o `URLS.md` num commit seguinte. Confirme com `git ls-tree` que cada caminho existe nesse hash. O `MANIFEST.md` também não pode mais conter o texto `COMMIT`: aponte para o `URLS.md`.
- Documente no `/biblioteca/README.md` o fluxo de manutenção: para consertar um gráfico, alterar o código, rodar build e testes, pegar o hash com `git log -1 --format=%H -- biblioteca/dist/<id>.js` e trocar só a URL daquela visualização no Admin do Looker.

## 7. CORREÇÕES ESPECÍFICAS POR GRÁFICO

Depois dos módulos, reteste cada gráfico contra os sintomas abaixo.

- **tabela_completa**: aviso amarelo; exportar CSV não funciona; animação; a rolagem sumiu (precisa de rolagem vertical e horizontal); nos filtros, o campo perde o foco a cada tecla digitada (não recriar o input no redesenho; usar debounce e preservar foco e cursor). Sobre o CSV: a viz roda num iframe com sandbox (o console mostra caminhos `/visualizations/sandbox/...`), que pode bloquear downloads e acesso à área de transferência. Investigue sem inventar. Se o download por Blob não for possível, ofereça um fallback: painel com o CSV em texto selecionável e botão "Copiar" (use a API de clipboard se existir; senão, selecione o texto), com mensagem clara. Registre no relatório o que foi possível. Corrija também os campos de formulário: todo `<input>`, `<select>` e `<textarea>` com `id` único (prefixo da viz e contador) e `name`, e todo `<label for>` apontando para um id existente.
- **diagrama_venn**: tooltip, rótulos, animação e interação do mouse (6.6): destacar regiões ao passar o mouse e selecionar ao clicar.
- **matriz_2x2**: aba de quadrantes bugada; forma dos pontos não muda; rótulos.
- **matriz_bcg**, **quadrant_scatter**: rótulos, aba Cores e tooltip.
- **risco_retorno**: rótulos.
- **grafico_controle**: aba Cores não funciona; aviso amarelo removível ou reposicionável; rótulos.
- **upset_plot**, **treemap_carteira**: aba Cores, tooltip, rótulos.
- **heatmap_denso**: rótulos.
- **dumbbell**: rótulos e cores.
- **drawdown**: rótulos e cores.
- **dot_plot_denso**: aba Cores, tooltip, rótulos.
- **bump_chart**: rótulos e aba Cores (nenhuma opção de cor funciona).
- **slope_chart**: aba Cores, tooltip, rótulos.
- **bar_race**: rótulos; aviso amarelo na mesma área do botão de avançar no tempo; cor das linhas de grade; adicionar um número indicando o rank de cada barra (1, 2, 3...), configurável.
- **barras_ranking_denso**: rótulos; cor das linhas de grade (tema personalizado); cor de borda.
- **org_chart**: rótulos e animação.
- **pareto**: rótulos; tooltip persistente (6.3).
- **marimekko**: rótulos, aba Cores, aviso amarelo.
- **arvores_multiplas**: rótulos, cores, animação, aviso amarelo. NOVO COMPORTAMENTO: ao clicar em um nó, expandir ou colapsar seus filhos (com animação). Adicionar botões "Expandir tudo" e "Colapsar tudo", opção de nível inicial expandido, indicador visual (+/−) nos nós com filhos, e manter o estado ao redesenhar. Como o clique também é usado para drill (6.3), o clique no nó com filhos expande ou colapsa, e o drill fica no clique em nó sem filhos ou no rótulo, se houver link.
- **kpi_vivo**: rótulos. Gráfico favorito: ampliar as possibilidades. Adicionar: minigráfico (sparkline) configurável (linha, área, barras); variação contra o período anterior (absoluta e %) com seta e cor de positivo e negativo; meta com barra de progresso; vários KPIs em grade (linhas e colunas configuráveis); formato do número (moeda, %, compacto K/M/B); ícone configurável a partir de um conjunto embutido de ícones em SVG (seta, estrela, carrinho, pessoa, moeda, gráfico, relógio, alerta, alvo); limites com cores (verde, amarelo, vermelho); layouts de cartão (compacto, grande, horizontal); título e subtítulo; clique abre drill; animação de contagem do número.

## 8. ORDEM DE EXECUÇÃO E RETOMADA

Cada fase termina com build, testes, checagem de segurança, commit e push.

- **Fase A:** arquivamento (seção 5) e módulos 6.1 a 6.4, aplicados nos 22 gráficos. Ao final, escreva `/biblioteca/docs/TESTE_NO_LOOKER.md`: um checklist manual curto por gráfico (ex.: "mude o tamanho do rótulo para 20 e veja mudar", "passe o mouse rápido e veja um único tooltip"), para o usuário validar no Looker real.
- **Fase B:** módulos 6.5 a 6.8.
- **Fase C:** correções específicas (seção 7), incluindo `arvores_multiplas` e `kpi_vivo`.
- **Fase D:** 6.9 (build determinístico e URLs) e o relatório por gráfico em `/biblioteca/docs/RELATORIO_CORRECOES.md`: o que foi corrigido, o que foi testado (automatizado) e o que ficou pendente de conferência no Looker real.

**RETOMADA E INTERRUPÇÃO:** a sessão pode ser cortada a qualquer momento por limite de uso, sem aviso. Por isso: (1) commit e push após CADA etapa pequena; (2) atualize o `LOG.md` ANTES de começar cada etapa (o que vai fazer) e DEPOIS de terminá-la, com a "próxima ação exata"; (3) deixe o branch sempre em estado que carrega e não quebra o build; (4) se um arquivo ficar pela metade, marque `[~]` em `TAREFAS.md` e descreva o que falta. AO RETOMAR (nova sessão após interrupção, reset de limite ou no dia seguinte): releia este arquivo, rode `git status` e `git log -5`, leia `TAREFAS.md` e `LOG.md`, confirme o branch, confira arquivos sem commit da sessão anterior (se completos, teste e commite; se pela metade, termine ou descarte conforme o LOG) e continue da primeira tarefa `[~]` ou `[ ]`. Não refaça o que está `[x]`. Registre no LOG "sessão retomada em <data>". Decisões importantes vão para o LOG, não só o andamento: você não lembra das sessões anteriores.
