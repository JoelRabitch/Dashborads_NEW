# Relatório das correções v2

Branch `agente/novas-viz`. O estado anterior às correções está na tag `antes-da-limpeza`.

**Situação final**
- `npm test`: 765 de 765 testes passando. Antes das correções eram 1.286, mas incluíam os 32 gráficos arquivados.
- `npm run seguranca`: nenhuma violação.
- Dois builds seguidos não alteram nenhum arquivo.

**URLs para o campo Main** (em `dist/URLS.md` e `dist/URLS.csv`):
- fixadas no commit `313b2db8ef69a1688e9b9826350383396b23c300`;
- os 22 caminhos foram conferidos com `git ls-tree`/`git cat-file` nesse commit.

> **Como ler este relatório.** "Verificado em teste automatizado" quer dizer que um teste no jsdom (o simulador) reproduziu o defeito, falhou com o código antigo e passa agora. Nada aqui foi visto funcionando no Looker real: tudo o que depende do Looker está em "conferir no Looker real" e no checklist [`TESTE_NO_LOOKER.md`](TESTE_NO_LOOKER.md). Em nenhum lugar deste relatório "corrigido" significa "confirmado no Looker".

## 1. Arquivamento

- 32 gráficos foram para `_arquivados/`. Ficam fora do build, dos testes e da checagem de segurança.
- A tag `antes-da-limpeza` foi enviada ao GitHub. As URLs antigas continuam funcionando, porque apontam para commits que continuam existindo.
- Defeito achado: o bundle da `arvores_multiplas` registrava **duas** visualizações, porque importava código da `arvore_radial`. A função compartilhada foi para a base `_arvore`.
- Bases compartilhadas que ficaram sem uso, mantidas de propósito: `_dispersao`, `_distribuicao`, `_funil`, `_medidor`, `_polar`.

## 2. Causas raiz encontradas (o que valia para quase todos)

1. **Opções declaradas e nunca lidas.** Uma varredura de cada id declarado contra o código mostrou o seguinte:
   - **rótulos:** "Negrito", "Rotação", "Posição", "O que mostrar", "Formato" e "Esconder sobrepostos" não eram lidos em nenhum dos 21 gráficos; "Mostrar rótulos" era ignorado em 15;
   - **contorno:** não era lido em 19 de 19;
   - **eixos:** parte das opções não era lida.

   O painel oferecia a opção, o Looker gravava o valor, e nada mudava. Esta é a causa principal de "as configurações de rótulo não têm efeito".
2. **`registerOptions` em toda atualização.** A assinatura das opções ficava na "ponte", que é recriada a cada `updateAsync`. Por isso o painel era re-registrado o tempo todo.
3. **Um tooltip novo a cada desenho.** Cada desenho pendurava mais um tooltip no `<body>`, sem remover os anteriores. Isso foi reproduzido: 5 tooltips no DOM no barras_ranking_denso.
4. **`0` e `false` tratados como ausentes.** Padrões como `|| 18` e `|| 1` faziam "Truncar 0" virar 18 e "0 casas" virar 1.
5. **Cores só no tema personalizado.** As cores de grade, borda e texto só valiam com o tema "personalizado".
6. **Cor de item com default preenchido.** O Looker grava esse default no config, e a paleta e o "Inverter" deixavam de ter efeito.
7. **Formato "Compacto" errado.** Usava algarismos significativos: 1,5 mi com 1 casa saía "2M".
8. **Tabela sem CSS.** O CSS era injetado e logo apagado. Isso explica a rolagem sumida e a animação morta.

## 3. Módulos compartilhados

| Módulo | O que mudou | Verificado em teste | Conferir no Looker real |
|---|---|---|---|
| 2.1 Rótulos | Novo `core/rotulos.js`, a função única de rótulos. O config é normalizado: chave ausente recebe o default, número e boolean em texto são convertidos, `false`/`0`/`''` são preservados. O config é relido a cada atualização. O modo debug lista as chaves registradas contra as recebidas. Os eixos ganharam formato, casas e rotação do Y. | Sim, por gráfico | Visual dos rótulos; se o `config` real traz as chaves (use o modo debug) |
| 2.2 Cores | Novo `core/cores.js`: paleta com inverter, cor por item, opacidade e contorno. Grade, borda e texto valem em qualquer tema. | Sim | Contorno no tema escuro |
| 2.3 Tooltip | Um tooltip por gráfico, que some ao sair, ao rolar, ao redesenhar e no destroy. Valores formatados pelo Looker. "Ação do clique": drill (padrão) / fixar / nenhuma. Shift+clique fixa; Esc ou clique fora solta. Modelo HTML seguro (b/i/br/span) com `{{categoria}}`, `{{valor}}`, `{{serie}}`, `{{percentual}}` e `{{campo}}`. "Permitir HTML do Looker". Estilo configurável. | Sim (50 hovers → 1 tooltip) | Drill real; tooltip fixo no iframe |
| 2.4 Marcadores | `criarMarcadorSvg`, a função única, com 7 formas (círculo, quadrado, triângulo, losango, cruz, estrela, wye), também em canvas. | Sim | Forma na matriz_2x2 |
| 2.5 Aviso | Componente único no fluxo (topo, rodapé ou oculto), com ×. Os avisos sempre vão também para o console. | Sim | Não cobre o botão do bar_race |
| 2.6 Hover | Helper único: o item sob o mouse acende e os demais apagam. | Sim (10 gráficos) | Fluidez do destaque |
| 2.7 Animação | Entrada e atualização com duração, atraso, cascata e curva. Respeita "só na primeira carga" e `prefers-reduced-motion`. Interruptor por gráfico (`animacaoAtiva`) e global (`ANIMACOES_HABILITADAS`). | Sim | Aparência |
| 2.8 Painel | 5 abas iguais em todos os gráficos (Dados · Visual · Texto · Interação · Avançado), com rótulos prefixados. Nenhum id, tipo ou default mudou (`test/opcoes.test.mjs`). | Sim | Se as abas cabem e se a ordem respeita `order` |
| 2.9 Build/URLs | Build determinístico; `URLS.md`/`URLS.csv` com hash; MANIFEST sem `COMMIT`. | Sim (dois builds, status limpo) | Cadastro com as URLs novas |

### Decisões e exceções a registrar

- **Eixos e Texto foram juntadas numa aba só.** O PROMPT permite isso "se ainda não couber". Para ter 6 abas de novo, basta trocar `JUNTAR_EIXOS_E_TEXTO`.
- **Exceções de default do PROMPT não foram necessárias.** "Aplicar JSON por cima" e "Modo debug" **já eram desligados** por padrão, então as duas exceções não foram usadas. O "Aplicar JSON" não sobrescrevia as cores sem querer.
- **Modelo de tooltip:** vale sempre que estiver preenchido. O interruptor antigo "Usar tooltip personalizado" continua no painel, mas não é mais necessário.
- **Branco do contorno:** `#FFFFFF` (o default) em "Cor do contorno" é tratado como "automática". Para um contorno branco de propósito, use `#FEFEFE`.
- **Cor própria por item igual à cor padrão da paleta naquela posição:** é tratada como "não escolhida".
- **Animação em SVG:** anima só a opacidade, para não deslocar marcadores.

## 4. Por gráfico

Legenda: **T** = verificado em teste automatizado (o defeito foi reproduzido antes); **L** = conferir no Looker real.

- **tabela_completa**
  - T:
    - **rolagem:** o CSS era apagado logo depois de injetado; além disso, foi acrescentado `min-height:0`;
    - **foco:** o filtro não perde mais o foco nem o cursor, porque o input não é mais recriado e há debounce de 200 ms;
    - **CSV:** a exportação abre um painel com "Copiar";
    - **formulário:** ids únicos, `name` e `label for`;
    - **aviso** com ×;
    - "Ativar animações" vale.
  - L: se o download de CSV acontece no iframe com sandbox (o painel funciona em qualquer caso).
- **diagrama_venn**
  - T:
    - hover por região (inclusive interseções) com destaque e tooltip;
    - clique por drill ou fixar;
    - rótulos, os 4 modos de cor e contorno;
    - animação.
  - L: precisão do alvo do mouse no navegador real; visual do destaque.
- **matriz_2x2, quadrant_scatter, matriz_bcg, risco_retorno**
  - T:
    - pontos em SVG com forma trocável;
    - rótulos completos;
    - inverter, opacidade e contorno;
    - nomes e cores dos quadrantes;
    - tooltip sem número cru (antes saía "-6.18841");
    - BCG com razão "1.03×".
  - L:
    - forma dos pontos;
    - "aba de quadrantes", provavelmente causada pela colisão de `order` entre seções e resolvida pelo 2.8;
    - mais de 2.000 pontos em canvas.
- **grafico_controle**
  - T: a linha lia uma cor inexistente e agora usa a paleta; rótulos e LSC/LC/LIC; aviso removível ou reposicionável.
- **upset_plot, treemap_carteira, marimekko**
  - T: rótulos, aba Cores (inverter, opacidade, contorno), tooltip formatado e clique.
  - Mudança no padrão: os percentuais do marimekko saem com 1 casa.
- **heatmap_denso**
  - T: os valores passam a ser escritos nas células, em SVG e em canvas, com a função de rótulos.
  - L: grade grande em canvas.
- **dumbbell, dot_plot_denso**
  - T:
    - pontos em SVG com forma (antes eram `div` redondos);
    - cores e contorno;
    - guias na cor da grade;
    - rótulos.
- **drawdown, bump_chart, slope_chart**
  - T:
    - bump: lia `cor_<série>` sem sanitizar, por isso nenhuma cor funcionava;
    - paleta com inverter e cor por série;
    - rótulos de valor;
    - clique (antes não havia no bump e no slope).
- **bar_race**
  - T:
    - rank 1, 2, 3… configurável;
    - rótulos;
    - linhas de grade na cor escolhida;
    - aviso no fluxo, sem cobrir o botão.
- **barras_ranking_denso**
  - T: rótulos, grade, cor de borda e contorno; tooltip único (o caso relatado).
- **org_chart**
  - T: textos do cartão com o bloco de rótulos; contorno e cores; animação de entrada; recolher sem drill.
- **pareto**
  - T: rótulo em cada barra; paleta (antes ignorada); tooltip persistente pelo clique (fixar, Shift, Esc).
- **arvores_multiplas**
  - T:
    - rótulos, cores por nível, contorno e animação;
    - expandir/colapsar com +/−, botões "Expandir tudo"/"Colapsar tudo" e nível inicial;
    - o estado sobrevive ao redesenho;
    - drill nas folhas.
  - Ficou de fora: drill pelo rótulo de nó com filhos.
- **kpi_vivo**
  - T:
    - **cartão:** layouts grande, compacto e horizontal; título e subtítulo no cartão (antes o título saía duas vezes);
    - **número:** formato (moeda, %, compacto) e animação de contagem;
    - **gráficos:** minigráfico em linha, área ou barras; meta com barra de progresso;
    - **cores:** cores de positivo e negativo; limites verde/amarelo/vermelho;
    - **ícone:** 9 ícones SVG;
    - **grade:** vários KPIs em grade, com linhas e colunas;
    - **clique:** abre o drill.
  - L: tiles pequenos.

## 5. Ids de opção novos

**Nenhum id antigo foi removido nem mudou de tipo ou default.** A lista completa por gráfico está em `docs/opcoes/<id>.depois.json` e em [`opcoes/ABAS.md`](opcoes/ABAS.md), onde os ids novos aparecem com ★.

- **Em todos os gráficos:** `mostrarAvisos`, `posicaoDosAvisos`, `destacarAoPassarMouse`, mais as opções de animação onde não existiam: `animacaoAtiva`, `duracaoDaAnimacao`, `atrasoDaAnimacao`, `cascataDaAnimacao`, `suavizacaoDaAnimacao`, `quandoAnimar`.
- **Nos gráficos com tooltip:** `acaoDoClique`, `permitirHtmlDoLooker`, `corDeFundoDoTooltip`, `corDaBordaDoTooltip`, `corDoTextoDoTooltip`, `tamanhoDoTooltip`.
- **Por gráfico:**
  - `mostrarGrade` (barras_ranking_denso, bar_race);
  - `formaDoPonto` (dot_plot_denso, dumbbell);
  - `mostrarRank`, `tamanhoDoRank` (bar_race);
  - `nivelInicialExpandido`, `mostrarBotoesDeExpandir` (arvores_multiplas);
  - no kpi_vivo: `layoutDoCartao`, `tipoDeSparkline`, `formatoDoNumero`, `casasDoNumero`, `simboloDaMoeda`, `corPositiva`, `corNegativa`, `mostrarProgressoDaMeta`, `usarLimites`, `limiteVerde`, `limiteAmarelo`, `iconeDoKpi`, `corDoIcone`, `kpisEmGrade`, `colunasDoKpi`, `linhasDoKpi`, `contadorAnimado`;
  - dinâmicas `cor_<série>` com default vazio (bump_chart, slope_chart, drawdown com 2 ou mais séries).
- **Valores novos em selects existentes** (o id não mudou):
  - forma "wye";
  - `conteudoDoRotulo` com `valorY`/`valorX`/`valoresXY` na família de quadrantes.

## 6. Ficou de fora ou pendente

- Na arvores_multiplas, o drill pelo clique no rótulo de um nó com filhos (o drill fica nas folhas).
- O bar_race continua sem tooltip, porque não declara o bloco de tooltip.
- O hover do heatmap em canvas (grade grande) e o da lista de regiões pequenas do Venn.
- A ordem real das abas e se 5 abas cabem na barra do editor: depende do Looker.
- Download de CSV no sandbox: não há como detectar o bloqueio. Por isso o painel de cópia abre sempre.

## 7. Próximo passo para o usuário

1. Cadastre ou troque as URLs no Admin do Looker usando `dist/URLS.md`.
2. Percorra [`TESTE_NO_LOOKER.md`](TESTE_NO_LOOKER.md), com o modo debug ligado quando alguma opção parecer sem efeito.
3. Para um conserto pontual depois disso, siga o fluxo de manutenção do `README.md` da biblioteca: build, testes, commit, `git log -1 --format=%H -- biblioteca/dist/<id>.js` e troca de só uma URL.
