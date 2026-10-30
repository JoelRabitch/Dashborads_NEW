# TAREFA: ícones e mapas de calor no mapa customizável (src/mapa_customizavel.js)

Repositório: https://github.com/JoelRabitch/Dashborads_NEW (público, branch principal `main`). Você trabalha sozinho, sem supervisão, até terminar ou a sessão ser interrompida.

## 0. REGRAS (valem para tudo)

- Crie o branch `mapa-icones-calor` a partir da `main` atualizada (`git fetch`, `git checkout main`, `git pull`, `git checkout -b mapa-icones-calor`). Trabalhe só nele. NUNCA faça push na `main`, nunca use `--force`, nunca apague branches nem tags.
- Altere SOMENTE: `src/mapa_customizavel.js`, a seção do mapa no `README.md` da raiz e os arquivos de teste do mapa em `/test` (se não houver harness do mapa, crie um mínimo em `test/mapa_icones_calor.html`). NÃO mexa em `/biblioteca`, nem nos outros arquivos de `/src`, nem em `/tools` e `/npm-package`.
- Mantenha o formato atual: um único arquivo, com d3, d3-geo-projection, topojson-client e o `world_topology` em Dependencies. Não adicione dependências novas (o `d3` global já traz `d3.scaleLinear`, `d3.interpolate*` e `d3.contourDensity`, se você quiser usá-los).
- Proibido: `fetch`, `XMLHttpRequest`, `sendBeacon`, `eval`, `new Function`, `document.cookie`, `localStorage`, `window.open`, imagens ou recursos de outros domínios, `<img>` com URL e `innerHTML` sem escapar. Rode um grep por esses termos no arquivo no fim e mostre o resultado.
- **IDs das opções:** NUNCA remova, renomeie nem mude o id, o tipo ou o valor padrão de uma opção existente (`pointColor`, `pointRadius`, o seletor "Plot Mode" etc.). Só opções NOVAS, ou valores novos no seletor de Plot Mode (o padrão continua "Points"). O comportamento padrão tem que ser idêntico ao de hoje, para os mapas já salvos não mudarem.
- Não invente métodos da API do Looker nem do d3. Se tiver dúvida, diga e use uma alternativa.
- Antes de começar, leia o arquivo inteiro e escreva em `MAPA_LOG.md` (raiz do branch) como os pontos são desenhados hoje: onde o canvas desenha (`arc` nas linhas ~998 e ~1072), o destaque de hover (~1030), `pontoSobMouse` (~869), o clique de drill (~599), o seletor "Plot Mode" (~352) e como os campos do Explore são escolhidos em opções (latitude e longitude). Esses números podem ter mudado: confirme.
- Commit e push do branch a cada etapa pequena, mensagem em português. Atualize o `MAPA_LOG.md` ANTES e DEPOIS de cada etapa, com a "próxima ação exata", para a retomada funcionar se a sessão for cortada. Não pare para enviar resumos: responda só no fim.
- Leia as opções a cada `updateAsync` (config relido a cada atualização).

## 1. FASE 1: ÍCONES NOS PONTOS

Na seção "Points", novas opções:
1. **Tipo do ponto:** Círculo (padrão, igual hoje) | Ícone | Emoji/texto.
2. **Ícone:** lista com os ids e rótulos em português: cafe (Café), loja (Loja), restaurante, bar, mercado (carrinho), sacola, casa, predio, hospital, escola, banco, hotel, carro, caminhao, aviao, bicicleta, arvore, estrela, coracao, bandeira, pin, alvo, usuario, raio. Além desses (pacote "Geral"), um segundo conjunto genérico de café (pacote "Café"), desenhado do zero e sem nenhuma marca, nome ou logotipo: xicara, copo_viagem, grao, prensa_francesa, moedor, maquina_espresso, croissant, bolo, quiosque, cupom, estrela_fidelidade, coroa. Nova opção "Pacote de ícones" (Geral | Café | Todos; padrão Todos) que controla só o que aparece na lista do item 2: um valor salvo de um pacote desligado continua sendo desenhado. A estrutura do mapa não depende do pacote café: os ícones ficam num objeto separado dentro do arquivo, e o mapa funciona normalmente se esse objeto for removido.
3. **Emoji/texto:** campo de texto com 1 a 2 caracteres (ex.: ☕ 🏪), desenhado com `fillText` e fonte do sistema.
4. **Tamanho do ícone** em px (em branco = usar o tamanho automático que o raio automático já calcula).
5. **Cor do ícone:** reaproveite a opção atual "Point Color" (não crie outra).
6. **Fundo do ícone:** Nenhum | Círculo | Quadrado arredondado | Pin (gota), com cor de fundo, cor e largura da borda. Com fundo, o ícone é desenhado em contraste (branco ou escuro, automático).
7. **Âncora:** Centro | Base (a ponta do pin fica sobre a coordenada).
8. **Ícone por categoria (opcional):** um campo de categoria escolhido num select dos campos do Explore (reaproveite o mecanismo que já existe para escolher latitude e longitude) e um texto de mapeamento `valor=icone; valor=icone` (ex.: `Café=cafe; Loja=loja`). Valores sem mapeamento usam o ícone do item 2. O destino também pode ser um emoji (`Café=☕`).

Implementação:
- Desenhe os ícones no canvas com `Path2D` a partir de caminhos SVG numa grade 24x24, embutidos no arquivo num objeto `ICONES`. Sem imagens nem arquivos externos. Desenhe os caminhos você mesmo, simples e legíveis; se usar caminhos de alguma biblioteca, só com licença permissiva (MIT, ISC ou Apache-2.0) e registre fonte e licença no `MAPA_LOG.md`.
- Desempenho: com milhares de pontos, `Path2D` por ponto fica lento. Pré-renderize cada combinação (ícone, cor, tamanho, fundo, `devicePixelRatio`) num canvas fora da tela (sprite) e use `drawImage` por ponto, com cache que se invalida quando a config muda. Teste com 20.000 pontos.
- Funciona nos DOIS modos (plano e globo). No globo, o ícone não aparece no lado oculto: mantenha a regra atual. Arraste, inércia, zoom e pan não podem ficar mais lentos.
- Atualize `pontoSobMouse` e o destaque de hover para usar a área do ícone e o deslocamento da âncora. Tooltip, "Display Coordinates" e drill ao clicar continuam como hoje.

Ao fim da Fase 1: build de sintaxe (`node --check`), testes de lógica, commit, push e atualização do `MAPA_LOG.md`.

## 2. FASE 2: MAPAS DE CALOR

O seletor "Plot Mode" hoje só tem "Points". Acrescente estes valores (o padrão continua "Points"):

- **Automagic Heatmap:** agrupa os pontos em células hexagonais (ou quadradas) e colore cada célula pela contagem ou pela soma de uma medida. Diferente do mapa nativo do Looker, aqui NÃO se altera a consulta: o agrupamento é feito no navegador.
- **Density Heatmap:** mapa de densidade suave (manchas contínuas).
- **3D Heatmap:** células extrudadas, com altura proporcional ao valor.

Opções novas (seção nova "Calor", ou dentro de "Points" se couber; não crie abas demais, o painel do Looker corta as abas da direita):
- **Peso:** campo de medida escolhido num select dos campos do Explore (mesmo mecanismo dos campos de latitude e longitude). Em branco = cada ponto vale 1 (contagem).
- **Agregação nas células:** soma | contagem | média | máximo.
- **Tamanho da célula** em px e **formato** (hexágono | quadrado), para Automagic e 3D.
- **Raio e suavização** em px, para Density.
- **Intensidade/opacidade** e **desfoque**.
- **Paleta:** pelo menos azul para vermelho, branco para azul, branco para vermelho, verde para vermelho, viridis simplificada, e "personalizada" com 2 ou 3 cores escolhidas pelo usuário. Inverter.
- **Mínimo e máximo da escala:** automático ou fixos.
- **Altura máxima** em px e **escala da altura** (linear | raiz), para o 3D.
- **Borda das células** (cor e largura) e **mostrar pontos por cima** (liga/desliga).
- **Legenda:** barra de cores com mínimo e máximo, com opção de posição e de ocultar.
- **Tooltip das células:** contagem, soma (ou a agregação escolhida) e a quantidade de pontos. Células agregadas não têm drill (não há um link único): documente isso.

Implementação (você pode escolher outra abordagem se tiver motivo, e deve registrar a decisão no LOG):
- **Automagic:** agrupe em espaço de tela (pixels projetados), com hexágonos feitos à mão (não há d3-hexbin nas Dependencies). Recalcule ao mudar zoom, pan ou rotação. O custo é O(n) por quadro.
- **Density:** técnica de "splat": desenhe um gradiente radial com alfa para cada ponto (ponderado pelo peso) num canvas fora da tela, acumule o alfa e depois colorize por uma tabela de cores (LUT) derivada da paleta. Evita o custo de recalcular contornos a cada quadro.
- **3D:** células extrudadas como prismas. No mapa plano, projeção oblíqua (a altura desloca o topo para cima na tela), desenhadas de trás para frente. No globo, a altura é um deslocamento na direção que se afasta do centro do globo na tela, escondida no lado oculto.
- **Globo:** só os pontos do hemisfério visível entram no cálculo e no desenho. Opcional: esmaecer perto do horizonte.
- **Desempenho:** 20.000 pontos com arraste do globo fluido. Durante a interação (arrastar, zoom), use qualidade reduzida (menos resolução ou células maiores) e renderize em qualidade total quando parar.
- Escalas de cor com `d3.scaleLinear` e `d3.interpolate*` (já disponíveis); trate valores nulos, negativos (paleta divergente se o usuário escolher) e mínimo igual ao máximo sem erro.
- No modo calor, o drill e o tooltip de ponto individual só valem quando "mostrar pontos por cima" estiver ligado.

Ao fim da Fase 2: `node --check`, testes de lógica (agrupamento, agregação, peso, escala de cores, mínimo igual ao máximo, valores nulos), commit, push e `MAPA_LOG.md`.

## 3. TESTES E DOCUMENTAÇÃO

- Valide com o que o ambiente permitir: `node --check` e testes de lógica pura (mapeamento categoria para ícone, âncora, tamanho automático, hit test, agrupamento e agregação das células, escala de cores). Se não houver como rodar o canvas, diga e marque o item como "conferir no Looker real". Não escreva "funciona" para algo que só foi verificado em lógica pura.
- Atualize o comentário do cabeçalho do arquivo (ícones e calor deixam de estar em "AINDA NÃO IMPLEMENTADO"), documente todas as opções novas e acrescente ao README o passo de atualização da URL.
- No `MAPA_LOG.md`, inclua um checklist curto para eu validar no Looker real: trocar o tipo para Ícone, escolher Café, mudar tamanho e cor, fundo Pin, ícone por categoria, girar o globo e clicar num ponto; trocar o Plot Mode para Automagic, Density e 3D, mudar a paleta e o tamanho da célula, e testar no globo com 20.000 pontos.

## 4. AO TERMINAR

Responda com: o hash do último commit que alterou `src/mapa_customizavel.js` (`git log -1 --format=%H -- src/mapa_customizavel.js`), o caminho do `MAPA_LOG.md` e a URL do campo Main no formato `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@<HASH>/src/mapa_customizavel.js`. Não use branch, `@main` nem `raw.githubusercontent.com` na URL.

## 5. RETOMADA

Se a sessão for interrompida: ao retomar, rode `git status` e `git log -5`, leia `MAPA_LOG.md`, confirme que está no branch `mapa-icones-calor` e continue da "próxima ação exata". Arquivos completos sem commit: teste e commite. Pela metade: termine ou descarte conforme o LOG. Não refaça o que já está commitado e testado.
