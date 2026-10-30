# Teste no Looker real — checklist das correções v2

Tudo abaixo passou em teste automatizado (jsdom), mas o simulador não é o
Looker. Este checklist é para conferir no Looker de verdade, depois de
cadastrar as URLs novas de `dist/URLS.md`. Marque o que funcionou e anote o
que não funcionou (gráfico + opção + o que aconteceu).

Dica: ligue **Avançado · Modo debug** e abra o console do navegador (F12).
A visualização escreve "chaves do config": as opções registradas no painel
contra as que chegaram no config. Se uma opção "não tem efeito" e aparece
em `faltandoNoConfig`, o Looker não está mandando o valor.

## Em todos os gráficos (vale para os 22)

- [ ] **Abas:** o painel mostra no máximo 5 abas, nesta ordem: Dados · Visual · Texto · Interação · Avançado. Nenhuma fica cortada à direita.
- [ ] **Rótulos:** na aba Texto, mude "Rótulo · Tamanho do rótulo" para 20 e veja mudar; desligue "Rótulo · Mostrar rótulos" e veja sumir; troque "Casas decimais" para 0.
- [ ] **Tooltip único:** passe o mouse rápido por vários itens: só um tooltip na tela, que some ao sair do gráfico e ao rolar.
- [ ] **Valores formatados:** o tooltip mostra os números como o Looker (R$, %, separador), nunca "−6.18841".
- [ ] **Clique:** em item com drill, abre o menu do Looker; em item sem drill, o tooltip fica fixo (Esc ou clique fora solta). Shift+clique sempre fixa. Teste "Interação · Ação do clique = Nenhuma".
- [ ] **Hover:** o item sob o mouse fica destacado e os outros apagados; desligue "Destacar ao passar o mouse".
- [ ] **Aviso amarelo:** quando aparecer, tem um × que fecha; "Texto · Posição dos avisos" = Rodapé move para baixo; = Oculto esconde (e o aviso continua no console).
- [ ] **Animação:** ao carregar, os elementos surgem; mude a duração para 2000 e veja ficar lento; desligue "Ativar animações".
- [ ] **Cores do tema:** em Visual, preencha "Cor das linhas de grade" e "Cor das bordas" SEM trocar o tema: devem mudar.
- [ ] **Dashboards antigos:** um dashboard salvo antes das correções abre sem erro e com as mesmas escolhas.

## Por gráfico

- **tabela_completa**
  - [ ] Há rolagem vertical e horizontal com muitas linhas/colunas.
  - [ ] Ligue "Filtros por coluna", digite "abc" seguido: o cursor não sai do campo.
  - [ ] "Exportar CSV": o arquivo baixa OU abre o painel com o CSV e "Copiar" (anote qual dos dois aconteceu).
  - [ ] O aviso de totais tem ×.
- **diagrama_venn**
  - [ ] Passe o mouse em cada região, inclusive nas interseções: a região acende, as outras apagam, o tooltip mostra a região certa.
  - [ ] Clique numa região: fixa o tooltip (ou abre o drill).
- **matriz_2x2**
  - [ ] Visual · "Forma do ponto" = Quadrado: os pontos viram quadrados. Teste também Triângulo e Wye.
  - [ ] Texto · "Quadrantes · Nome do quadrante" e Visual · "Quadrantes · Cor do quadrante" mudam o desenho.
- **matriz_bcg / quadrant_scatter / risco_retorno**
  - [ ] Rótulos dos pontos mudam com tamanho, negrito, rotação e "O que mostrar".
  - [ ] Visual · "Cor · Inverter ordem das cores" e "Cor · Mostrar contorno" têm efeito.
- **grafico_controle**
  - [ ] Visual · "Cor · Paleta de cores" muda a linha.
  - [ ] O aviso amarelo fecha e vai para o rodapé.
- **upset_plot / treemap_carteira / marimekko**
  - [ ] Paleta, inverter, opacidade e contorno mudam o desenho.
  - [ ] Rótulos mudam com tamanho e "O que mostrar".
- **heatmap_denso**
  - [ ] As células escrevem o valor; tamanho e cor do rótulo funcionam (inclusive em grade grande, que é desenhada em canvas).
- **dumbbell / dot_plot_denso**
  - [ ] "Forma do ponto" muda as pontas; cores e contorno funcionam; guias na cor da grade.
- **drawdown / bump_chart / slope_chart**
  - [ ] Trocar a paleta muda as séries; a opção "Cor — <série>" aparece vazia e, preenchida, vence a paleta.
  - [ ] Rótulos de valor aparecem e somem com "Mostrar rótulos".
- **bar_race**
  - [ ] O aviso amarelo não cobre o botão de avançar.
  - [ ] Cada barra mostra o rank (1, 2, 3…); "Mostrar rank" desliga.
  - [ ] As linhas de grade usam a "Cor das linhas de grade".
- **barras_ranking_denso**
  - [ ] Linhas de grade com a cor escolhida; contorno das barras com a "Cor do contorno".
  - [ ] Passe o mouse rápido por 50 barras: um tooltip só.
- **org_chart**
  - [ ] Textos do cartão seguem tamanho/cor/negrito; os cartões surgem animados.
  - [ ] O botão +/− de recolher continua funcionando e não abre drill.
- **pareto**
  - [ ] Clique numa barra sem drill: o tooltip fica fixo (antes sumia).
  - [ ] Cada barra tem rótulo de valor.
- **arvores_multiplas**
  - [ ] Clique num nó com filhos: colapsa ("+") e expande ("−"), com animação.
  - [ ] Botões "Expandir tudo" e "Colapsar tudo"; "Níveis abertos no início" = 1.
  - [ ] Clique numa folha com drill abre o menu do Looker.
- **kpi_vivo**
  - [ ] "Minigráfico" = Barras / Linha / Área.
  - [ ] "Vários KPIs em grade" com 2+ medidas, e linhas/colunas.
  - [ ] "Barra de progresso até a meta" com um valor de meta.
  - [ ] "Formato do número" = Compacto (1,5M) e Moeda (símbolo escolhido).
  - [ ] Ícone, limites verde/amarelo/vermelho, layouts Compacto e Horizontal, subtítulo.
  - [ ] O título aparece UMA vez só.
  - [ ] Clique no cartão abre o drill.

## Melhorias v3

Cada item abaixo foi testado só em simulação (jsdom). Confira no Looker
real antes de considerar resolvido.

- **5.1 Tooltip preso (todos os gráficos com tooltip)**
  - [ ] Com "Ação do clique" = Drill (o valor salvo nos tiles), clique num ponto SEM link: o tooltip NÃO fica fixo (antes ficava).
  - [ ] Clique num ponto COM link: o tooltip some antes de o menu de drill aparecer; feche o menu (Esc ou clique fora): nada fica na tela.
  - [ ] Com o menu de drill aberto, leve o mouse para fora do gráfico: nenhum tooltip sobra.
  - [ ] Shift+clique (ou "Ação do clique" = Fixar tooltip): o tooltip fixa e mostra um "×"; o "×", Esc e clique fora soltam.
  - [ ] Clique em outra parte do dashboard (fora do iframe): o tooltip fixo some.
