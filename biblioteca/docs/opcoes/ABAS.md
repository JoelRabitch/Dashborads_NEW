# Abas do painel — antes e depois (módulo 2.8)

Gerado por `build/relatorio-abas.mjs`. Abas novas, nesta ordem: **Dados · Visual · Texto · Interação · Avançado**.

As opções de eixo ficam na aba **Texto** (Eixos e Texto juntas para caber na barra do editor).

Nenhuma opção foi removida nem teve id, tipo ou default alterado (conferido por `test/opcoes.test.mjs`).
Ids marcados com ★ são novos (não existiam antes).

## Tabela Completa (`tabela_completa`)

- Antes (9 abas): Tema · Avançado · Dados · Formato · Interação · Animação · Coluna: Loja · Coluna: Vendas · Coluna: Pedidos
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `agruparPor` | Dados | Dados | Agrupar linhas por |
| `gruposComecamAbertos` | Dados | Dados | Grupos começam abertos |
| `mostrarSubtotais` | Dados | Dados | Mostrar subtotal por grupo |
| `transporPivo` | Dados | Dados | Transpor (valores do pivô viram linhas) |
| `mostrarTotalDeLinha` | Dados | Dados | Mostrar coluna de total por linha (quando pivotado) |
| `ordenacaoInicial` | Dados | Dados | Ordenação inicial |
| `tratamentoDeNulos` | Dados | Dados | Valores nulos |
| `textoParaNulo` | Dados | Dados | Texto para valor nulo |
| `estiloDeData` | Dados | Dados | Formato das colunas com tipo de célula "Data" |
| `mostrarTotais` | Dados | Dados | Mostrar linha de totais |
| `agregacaoDoTotal` | Dados | Dados | Como calcular os totais (quando o Looker não envia) |
| `rotuloDoTotal` | Dados | Dados | Rótulo da linha de totais |
| `densidade` | Formato | Visual | Densidade |
| `alturaDaLinha` | Formato | Visual | Altura da linha (px) — 0 usa a densidade |
| `alturaDoCabecalho` | Formato | Visual | Altura do cabeçalho (px) — 0 usa a densidade |
| `larguraPadraoDaColuna` | Formato | Visual | Largura padrão das colunas (px) |
| `larguraDasDimensoes` | Formato | Visual | Largura das colunas de dimensão (px) |
| `colunasFixasAEsquerda` | Formato | Visual | Quantas colunas ficam fixas à esquerda |
| `cabecalhoFixo` | Formato | Visual | Cabeçalho fixo ao rolar |
| `rodapeFixo` | Formato | Visual | Totais fixos no rodapé |
| `quebrarTexto` | Formato | Visual | Texto que não cabe |
| `cabecalhoVertical` | Formato | Visual | Cabeçalho com texto na vertical |
| `mostrarNumeroDaLinha` | Formato | Visual | Mostrar número da linha |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `estiloDaTabela` | Tema | Visual | Tema · Estilo |
| `corDoCabecalho` | Tema | Visual | Tema · Fundo do cabeçalho |
| `corDoTextoDoCabecalho` | Tema | Visual | Tema · Texto do cabeçalho |
| `corDaZebra` | Tema | Visual | Tema · Cor das linhas alternadas |
| `corDoHover` | Tema | Visual | Tema · Cor ao passar o mouse |
| `corDaSelecao` | Tema | Visual | Tema · Cor da linha selecionada |
| `mostrarBordasVerticais` | Tema | Visual | Tema · Bordas verticais |
| `mostrarBordasHorizontais` | Tema | Visual | Tema · Bordas horizontais |
| `raioDaBorda` | Tema | Visual | Tema · Arredondamento (px) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `permitirOrdenar` | Interação | Interação | Clique · Ordenar clicando no cabeçalho |
| `mostrarBusca` | Interação | Interação | Clique · Mostrar caixa de busca |
| `mostrarFiltrosPorColuna` | Interação | Interação | Clique · Mostrar filtro em cada coluna |
| `permitirSelecionarLinhas` | Interação | Interação | Clique · Selecionar linhas (clique) e somar |
| `destacarLinhaEColuna` | Interação | Interação | Clique · Destacar linha e coluna sob o mouse |
| `permitirRedimensionarColunas` | Interação | Interação | Clique · Redimensionar colunas arrastando |
| `permitirDrill` | Interação | Interação | Clique · Drill ao clicar na célula |
| `permitirExportarCsv` | Interação | Interação | Clique · Botão de exportar CSV |
| `permitirCopiar` | Interação | Interação | Clique · Permitir copiar (Ctrl+C / menu) |
| `linhasPorPagina` | Interação | Interação | Clique · Linhas por página (0 = rolagem contínua) |
| `animarEntradaDasLinhas` | Animação | Interação | Animação · Animar entrada das linhas |
| `animarMudancaDeValor` | Animação | Interação | Animação · Piscar quando o valor mudar entre atualizações |
| `corDeSubida` | Animação | Interação | Animação · Cor quando o valor sobe |
| `corDeDescida` | Animação | Interação | Animação · Cor quando o valor desce |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `col_dim_loja_visivel` | Coluna: Loja | Visual | Coluna Loja · Mostrar esta coluna |
| `col_dim_loja_rotulo` | Coluna: Loja | Visual | Coluna Loja · Renomear para |
| `col_dim_loja_largura` | Coluna: Loja | Visual | Coluna Loja · Largura (px, 0 = padrão) |
| `col_dim_loja_alinhamento` | Coluna: Loja | Visual | Coluna Loja · Alinhamento |
| `col_dim_loja_tipoDeCelula` | Coluna: Loja | Visual | Coluna Loja · Tipo de célula |
| `col_dim_loja_corDoTexto` | Coluna: Loja | Visual | Coluna Loja · Cor do texto |
| `col_dim_loja_corDeFundo` | Coluna: Loja | Visual | Coluna Loja · Cor de fundo |
| `col_dim_loja_prefixo` | Coluna: Loja | Visual | Coluna Loja · Prefixo |
| `col_dim_loja_sufixo` | Coluna: Loja | Visual | Coluna Loja · Sufixo |
| `col_dim_loja_regra1` | Coluna: Loja | Visual | Coluna Loja · Regra 1: condição |
| `col_dim_loja_regra1Valor` | Coluna: Loja | Visual | Coluna Loja · Regra 1: valor |
| `col_dim_loja_regra1Valor2` | Coluna: Loja | Visual | Coluna Loja · Regra 1: valor 2 (para "entre") |
| `col_dim_loja_regra1Acao` | Coluna: Loja | Visual | Coluna Loja · Regra 1: o que fazer |
| `col_dim_loja_regra1Cor` | Coluna: Loja | Visual | Coluna Loja · Regra 1: cor |
| `col_dim_loja_regra1Icone` | Coluna: Loja | Visual | Coluna Loja · Regra 1: ícone |
| `col_dim_loja_regra1LinhaInteira` | Coluna: Loja | Visual | Coluna Loja · Regra 1: aplicar na linha inteira |
| `col_dim_loja_regra1Coluna` | Coluna: Loja | Visual | Coluna Loja · Regra 1: comparar com a coluna |
| `col_dim_loja_regra2` | Coluna: Loja | Visual | Coluna Loja · Regra 2: condição |
| `col_dim_loja_regra2Valor` | Coluna: Loja | Visual | Coluna Loja · Regra 2: valor |
| `col_dim_loja_regra2Valor2` | Coluna: Loja | Visual | Coluna Loja · Regra 2: valor 2 (para "entre") |
| `col_dim_loja_regra2Acao` | Coluna: Loja | Visual | Coluna Loja · Regra 2: o que fazer |
| `col_dim_loja_regra2Cor` | Coluna: Loja | Visual | Coluna Loja · Regra 2: cor |
| `col_dim_loja_regra2Icone` | Coluna: Loja | Visual | Coluna Loja · Regra 2: ícone |
| `col_dim_loja_regra2LinhaInteira` | Coluna: Loja | Visual | Coluna Loja · Regra 2: aplicar na linha inteira |
| `col_dim_loja_regra2Coluna` | Coluna: Loja | Visual | Coluna Loja · Regra 2: comparar com a coluna |
| `col_dim_loja_regra3` | Coluna: Loja | Visual | Coluna Loja · Regra 3: condição |
| `col_dim_loja_regra3Valor` | Coluna: Loja | Visual | Coluna Loja · Regra 3: valor |
| `col_dim_loja_regra3Valor2` | Coluna: Loja | Visual | Coluna Loja · Regra 3: valor 2 (para "entre") |
| `col_dim_loja_regra3Acao` | Coluna: Loja | Visual | Coluna Loja · Regra 3: o que fazer |
| `col_dim_loja_regra3Cor` | Coluna: Loja | Visual | Coluna Loja · Regra 3: cor |
| `col_dim_loja_regra3Icone` | Coluna: Loja | Visual | Coluna Loja · Regra 3: ícone |
| `col_dim_loja_regra3LinhaInteira` | Coluna: Loja | Visual | Coluna Loja · Regra 3: aplicar na linha inteira |
| `col_dim_loja_regra3Coluna` | Coluna: Loja | Visual | Coluna Loja · Regra 3: comparar com a coluna |
| `col_med_vendas_visivel` | Coluna: Vendas | Visual | Coluna Vendas · Mostrar esta coluna |
| `col_med_vendas_rotulo` | Coluna: Vendas | Visual | Coluna Vendas · Renomear para |
| `col_med_vendas_largura` | Coluna: Vendas | Visual | Coluna Vendas · Largura (px, 0 = padrão) |
| `col_med_vendas_alinhamento` | Coluna: Vendas | Visual | Coluna Vendas · Alinhamento |
| `col_med_vendas_tipoDeCelula` | Coluna: Vendas | Visual | Coluna Vendas · Tipo de célula |
| `col_med_vendas_corDoTexto` | Coluna: Vendas | Visual | Coluna Vendas · Cor do texto |
| `col_med_vendas_corDeFundo` | Coluna: Vendas | Visual | Coluna Vendas · Cor de fundo |
| `col_med_vendas_prefixo` | Coluna: Vendas | Visual | Coluna Vendas · Prefixo |
| `col_med_vendas_sufixo` | Coluna: Vendas | Visual | Coluna Vendas · Sufixo |
| `col_med_vendas_formato` | Coluna: Vendas | Visual | Coluna Vendas · Formato do número |
| `col_med_vendas_casasDecimais` | Coluna: Vendas | Visual | Coluna Vendas · Casas decimais |
| `col_med_vendas_corDaBarra` | Coluna: Vendas | Visual | Coluna Vendas · Cor da barra/sparkline |
| `col_med_vendas_regra1` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: condição |
| `col_med_vendas_regra1Valor` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: valor |
| `col_med_vendas_regra1Valor2` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: valor 2 (para "entre") |
| `col_med_vendas_regra1Acao` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: o que fazer |
| `col_med_vendas_regra1Cor` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: cor |
| `col_med_vendas_regra1Icone` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: ícone |
| `col_med_vendas_regra1LinhaInteira` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: aplicar na linha inteira |
| `col_med_vendas_regra1Coluna` | Coluna: Vendas | Visual | Coluna Vendas · Regra 1: comparar com a coluna |
| `col_med_vendas_regra2` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: condição |
| `col_med_vendas_regra2Valor` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: valor |
| `col_med_vendas_regra2Valor2` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: valor 2 (para "entre") |
| `col_med_vendas_regra2Acao` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: o que fazer |
| `col_med_vendas_regra2Cor` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: cor |
| `col_med_vendas_regra2Icone` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: ícone |
| `col_med_vendas_regra2LinhaInteira` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: aplicar na linha inteira |
| `col_med_vendas_regra2Coluna` | Coluna: Vendas | Visual | Coluna Vendas · Regra 2: comparar com a coluna |
| `col_med_vendas_regra3` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: condição |
| `col_med_vendas_regra3Valor` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: valor |
| `col_med_vendas_regra3Valor2` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: valor 2 (para "entre") |
| `col_med_vendas_regra3Acao` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: o que fazer |
| `col_med_vendas_regra3Cor` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: cor |
| `col_med_vendas_regra3Icone` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: ícone |
| `col_med_vendas_regra3LinhaInteira` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: aplicar na linha inteira |
| `col_med_vendas_regra3Coluna` | Coluna: Vendas | Visual | Coluna Vendas · Regra 3: comparar com a coluna |
| `col_med_vendas_escalaDeCor` | Coluna: Vendas | Visual | Coluna Vendas · Escala de cor (mapa de calor) nesta coluna |
| `col_med_vendas_escalaCorMin` | Coluna: Vendas | Visual | Coluna Vendas · Escala: cor do menor valor |
| `col_med_vendas_escalaCorMax` | Coluna: Vendas | Visual | Coluna Vendas · Escala: cor do maior valor |
| `col_med_pedidos_visivel` | Coluna: Pedidos | Visual | Coluna Pedidos · Mostrar esta coluna |
| `col_med_pedidos_rotulo` | Coluna: Pedidos | Visual | Coluna Pedidos · Renomear para |
| `col_med_pedidos_largura` | Coluna: Pedidos | Visual | Coluna Pedidos · Largura (px, 0 = padrão) |
| `col_med_pedidos_alinhamento` | Coluna: Pedidos | Visual | Coluna Pedidos · Alinhamento |
| `col_med_pedidos_tipoDeCelula` | Coluna: Pedidos | Visual | Coluna Pedidos · Tipo de célula |
| `col_med_pedidos_corDoTexto` | Coluna: Pedidos | Visual | Coluna Pedidos · Cor do texto |
| `col_med_pedidos_corDeFundo` | Coluna: Pedidos | Visual | Coluna Pedidos · Cor de fundo |
| `col_med_pedidos_prefixo` | Coluna: Pedidos | Visual | Coluna Pedidos · Prefixo |
| `col_med_pedidos_sufixo` | Coluna: Pedidos | Visual | Coluna Pedidos · Sufixo |
| `col_med_pedidos_formato` | Coluna: Pedidos | Visual | Coluna Pedidos · Formato do número |
| `col_med_pedidos_casasDecimais` | Coluna: Pedidos | Visual | Coluna Pedidos · Casas decimais |
| `col_med_pedidos_corDaBarra` | Coluna: Pedidos | Visual | Coluna Pedidos · Cor da barra/sparkline |
| `col_med_pedidos_regra1` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: condição |
| `col_med_pedidos_regra1Valor` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: valor |
| `col_med_pedidos_regra1Valor2` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: valor 2 (para "entre") |
| `col_med_pedidos_regra1Acao` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: o que fazer |
| `col_med_pedidos_regra1Cor` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: cor |
| `col_med_pedidos_regra1Icone` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: ícone |
| `col_med_pedidos_regra1LinhaInteira` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: aplicar na linha inteira |
| `col_med_pedidos_regra1Coluna` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 1: comparar com a coluna |
| `col_med_pedidos_regra2` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: condição |
| `col_med_pedidos_regra2Valor` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: valor |
| `col_med_pedidos_regra2Valor2` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: valor 2 (para "entre") |
| `col_med_pedidos_regra2Acao` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: o que fazer |
| `col_med_pedidos_regra2Cor` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: cor |
| `col_med_pedidos_regra2Icone` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: ícone |
| `col_med_pedidos_regra2LinhaInteira` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: aplicar na linha inteira |
| `col_med_pedidos_regra2Coluna` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 2: comparar com a coluna |
| `col_med_pedidos_regra3` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: condição |
| `col_med_pedidos_regra3Valor` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: valor |
| `col_med_pedidos_regra3Valor2` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: valor 2 (para "entre") |
| `col_med_pedidos_regra3Acao` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: o que fazer |
| `col_med_pedidos_regra3Cor` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: cor |
| `col_med_pedidos_regra3Icone` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: ícone |
| `col_med_pedidos_regra3LinhaInteira` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: aplicar na linha inteira |
| `col_med_pedidos_regra3Coluna` | Coluna: Pedidos | Visual | Coluna Pedidos · Regra 3: comparar com a coluna |
| `col_med_pedidos_escalaDeCor` | Coluna: Pedidos | Visual | Coluna Pedidos · Escala de cor (mapa de calor) nesta coluna |
| `col_med_pedidos_escalaCorMin` | Coluna: Pedidos | Visual | Coluna Pedidos · Escala: cor do menor valor |
| `col_med_pedidos_escalaCorMax` | Coluna: Pedidos | Visual | Coluna Pedidos · Escala: cor do maior valor |

</details>

## Diagrama de Venn (`diagrama_venn`)

- Antes (8 abas): Cores · Rótulos · Legenda · Interação · Animação · Tema · Avançado · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `formatoDosDados` | Dados | Dados | Como os dados estão organizados |
| `separadorDeConjuntos` | Dados | Dados | Separador dos conjuntos na dimensão |
| `medirPor` | Dados | Dados | O número mostrado é |
| `maximoDeConjuntos` | Dados | Dados | Máximo de conjuntos (2 a 5) |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `modoDeCor` | Cores | Visual | Cor · Como colorir |
| `corUnica` | Cores | Visual | Cor · Cor única |
| `escalaDeCor` | Cores | Visual | Cor · Escala contínua (cor por valor) |
| `escalaDeCorPersonalizada` | Cores | Visual | Cor · Usar cores próprias na escala |
| `corMinima` | Cores | Visual | Cor · Cor do mínimo |
| `corMedia` | Cores | Visual | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Cores | Visual | Cor · Cor do máximo |
| `limiteDeCorAutomatico` | Cores | Visual | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Cores | Visual | Cor · Mínimo da escala (manual) |
| `limiteDeCorMaximo` | Cores | Visual | Cor · Máximo da escala (manual) |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `opacidadeDoPreenchimento` | Cores | Visual | Cor · Opacidade do preenchimento |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `mostrarPercentual` | Rótulos | Texto | Rótulo · Mostrar o percentual junto do número |
| `mostrarTotalDoConjunto` | Rótulos | Texto | Rótulo · Mostrar o total de cada conjunto no nome |
| `listarRegioesPequenas` | Rótulos | Texto | Rótulo · Listar num canto as regiões pequenas demais para o número caber |
| `mostrarLegenda` | Legenda | Texto | Legenda · Mostrar legenda |
| `posicaoDaLegenda` | Legenda | Texto | Legenda · Posição da legenda |
| `legendaInterativa` | Legenda | Texto | Legenda · Clicar na legenda liga/desliga a série |
| `mostrarValoresNaLegenda` | Legenda | Texto | Legenda · Mostrar valores na legenda |
| `tamanhoDaLegenda` | Legenda | Texto | Legenda · Tamanho do texto da legenda (px) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` | Animação | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` | Animação | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` | Animação | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` | Animação | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` | Animação | Interação | Animação · Curva da animação |
| `quandoAnimar` | Animação | Interação | Animação · Quando animar |
| `contadorAnimado` | Animação | Interação | Animação · Números sobem/descem até o valor (contador) |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `cor_A` | Cores | Visual | Cor · Cor — A |
| `cor_B` | Cores | Visual | Cor · Cor — B |

</details>

## Dispersão com Quadrantes (`quadrant_scatter`)

- Antes (9 abas): Cores · Eixos · Rótulos · Interação · Tema · Avançado · Quadrantes · Pontos · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `divisoriaX` | Quadrantes | Dados | Quadrantes · Linha divisória vertical (eixo X) |
| `valorDaDivisoriaX` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória X |
| `divisoriaY` | Quadrantes | Dados | Quadrantes · Linha divisória horizontal (eixo Y) |
| `valorDaDivisoriaY` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória Y |
| `colorirPor` | Pontos | Dados | Pontos · Cor dos pontos |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `modoDeCor` | Cores | Visual | Cor · Como colorir |
| `corUnica` | Cores | Visual | Cor · Cor única |
| `escalaDeCor` | Cores | Visual | Cor · Escala contínua (cor por valor) |
| `escalaDeCorPersonalizada` | Cores | Visual | Cor · Usar cores próprias na escala |
| `corMinima` | Cores | Visual | Cor · Cor do mínimo |
| `corMedia` | Cores | Visual | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Cores | Visual | Cor · Cor do máximo |
| `limiteDeCorAutomatico` | Cores | Visual | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Cores | Visual | Cor · Mínimo da escala (manual) |
| `limiteDeCorMaximo` | Cores | Visual | Cor · Máximo da escala (manual) |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `tamanhoDoPonto` | Pontos | Visual | Pontos · Tamanho do ponto |
| `tamanhoMaximoDoPonto` | Pontos | Visual | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Pontos | Visual | Pontos · Forma |
| `opacidadeDoPonto` | Pontos | Visual | Pontos · Opacidade |
| `corDasDivisorias` | Quadrantes | Visual | Quadrantes · Cor das divisórias |
| `contornoDoPonto` | Pontos | Visual | Pontos · Contorno no ponto |
| `pintarQuadrantes` | Quadrantes | Visual | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Alto / Alto" |
| `cor_inferiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Alto / Baixo" |
| `cor_inferiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Baixo / Baixo" |
| `cor_superiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Baixo / Alto" |
| `mostrarEixoX` | Eixos | Texto | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Eixos | Texto | Eixo X · Título do eixo X |
| `escalaEixoX` | Eixos | Texto | Eixo X · Escala do eixo X |
| `minimoEixoX` | Eixos | Texto | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Eixos | Texto | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Eixos | Texto | Eixo X · Inverter eixo X |
| `gradeEixoX` | Eixos | Texto | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Eixos | Texto | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Eixos | Texto | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Eixos | Texto | Eixo Y · Título do eixo Y |
| `escalaEixoY` | Eixos | Texto | Eixo Y · Escala do eixo Y |
| `minimoEixoY` | Eixos | Texto | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Eixos | Texto | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Eixos | Texto | Eixo Y · Inverter eixo Y |
| `gradeEixoY` | Eixos | Texto | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Eixos | Texto | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Eixos | Texto | Eixo · Formato dos números nos eixos |
| `casasDecimaisDoEixo` | Eixos | Texto | Eixo · Casas decimais nos eixos |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `quantosRotulosDePonto` | Rótulos | Texto | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarContagemPorQuadrante` | Quadrantes | Texto | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Alto / Alto" |
| `rotulo_inferiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Alto / Baixo" |
| `rotulo_inferiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Baixo / Baixo" |
| `rotulo_superiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Baixo / Alto" |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoX` | Dados | Dados | Medida do eixo X |
| `campoDoY` | Dados | Dados | Medida do eixo Y |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |

</details>

## Matriz 2x2 (`matriz_2x2`)

- Antes (9 abas): Cores · Eixos · Rótulos · Interação · Tema · Avançado · Quadrantes · Pontos · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `divisoriaX` | Quadrantes | Dados | Quadrantes · Linha divisória vertical (eixo X) |
| `valorDaDivisoriaX` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória X |
| `divisoriaY` | Quadrantes | Dados | Quadrantes · Linha divisória horizontal (eixo Y) |
| `valorDaDivisoriaY` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória Y |
| `colorirPor` | Pontos | Dados | Pontos · Cor dos pontos |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `modoDeCor` | Cores | Visual | Cor · Como colorir |
| `corUnica` | Cores | Visual | Cor · Cor única |
| `escalaDeCor` | Cores | Visual | Cor · Escala contínua (cor por valor) |
| `escalaDeCorPersonalizada` | Cores | Visual | Cor · Usar cores próprias na escala |
| `corMinima` | Cores | Visual | Cor · Cor do mínimo |
| `corMedia` | Cores | Visual | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Cores | Visual | Cor · Cor do máximo |
| `limiteDeCorAutomatico` | Cores | Visual | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Cores | Visual | Cor · Mínimo da escala (manual) |
| `limiteDeCorMaximo` | Cores | Visual | Cor · Máximo da escala (manual) |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `tamanhoDoPonto` | Pontos | Visual | Pontos · Tamanho do ponto |
| `tamanhoMaximoDoPonto` | Pontos | Visual | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Pontos | Visual | Pontos · Forma |
| `opacidadeDoPonto` | Pontos | Visual | Pontos · Opacidade |
| `corDasDivisorias` | Quadrantes | Visual | Quadrantes · Cor das divisórias |
| `contornoDoPonto` | Pontos | Visual | Pontos · Contorno no ponto |
| `pintarQuadrantes` | Quadrantes | Visual | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Prioridade" |
| `cor_inferiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Rever" |
| `cor_inferiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Descartar" |
| `cor_superiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Oportunidade" |
| `mostrarEixoX` | Eixos | Texto | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Eixos | Texto | Eixo X · Título do eixo X |
| `escalaEixoX` | Eixos | Texto | Eixo X · Escala do eixo X |
| `minimoEixoX` | Eixos | Texto | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Eixos | Texto | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Eixos | Texto | Eixo X · Inverter eixo X |
| `gradeEixoX` | Eixos | Texto | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Eixos | Texto | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Eixos | Texto | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Eixos | Texto | Eixo Y · Título do eixo Y |
| `escalaEixoY` | Eixos | Texto | Eixo Y · Escala do eixo Y |
| `minimoEixoY` | Eixos | Texto | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Eixos | Texto | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Eixos | Texto | Eixo Y · Inverter eixo Y |
| `gradeEixoY` | Eixos | Texto | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Eixos | Texto | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Eixos | Texto | Eixo · Formato dos números nos eixos |
| `casasDecimaisDoEixo` | Eixos | Texto | Eixo · Casas decimais nos eixos |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `quantosRotulosDePonto` | Rótulos | Texto | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarContagemPorQuadrante` | Quadrantes | Texto | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Prioridade" |
| `rotulo_inferiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Rever" |
| `rotulo_inferiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Descartar" |
| `rotulo_superiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Oportunidade" |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoX` | Dados | Dados | Medida do eixo X |
| `campoDoY` | Dados | Dados | Medida do eixo Y |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |

</details>

## Matriz BCG (`matriz_bcg`)

- Antes (9 abas): Cores · Eixos · Rótulos · Interação · Tema · Avançado · Quadrantes · Pontos · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `normalizarParticipacao` | Dados | Dados | Converter a medida X em participação relativa (valor ÷ maior concorrente) |
| `divisoriaX` | Quadrantes | Dados | Quadrantes · Linha divisória vertical (eixo X) |
| `valorDaDivisoriaX` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória X |
| `divisoriaY` | Quadrantes | Dados | Quadrantes · Linha divisória horizontal (eixo Y) |
| `valorDaDivisoriaY` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória Y |
| `colorirPor` | Pontos | Dados | Pontos · Cor dos pontos |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `modoDeCor` | Cores | Visual | Cor · Como colorir |
| `corUnica` | Cores | Visual | Cor · Cor única |
| `escalaDeCor` | Cores | Visual | Cor · Escala contínua (cor por valor) |
| `escalaDeCorPersonalizada` | Cores | Visual | Cor · Usar cores próprias na escala |
| `corMinima` | Cores | Visual | Cor · Cor do mínimo |
| `corMedia` | Cores | Visual | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Cores | Visual | Cor · Cor do máximo |
| `limiteDeCorAutomatico` | Cores | Visual | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Cores | Visual | Cor · Mínimo da escala (manual) |
| `limiteDeCorMaximo` | Cores | Visual | Cor · Máximo da escala (manual) |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `tamanhoDoPonto` | Pontos | Visual | Pontos · Tamanho do ponto |
| `tamanhoMaximoDoPonto` | Pontos | Visual | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Pontos | Visual | Pontos · Forma |
| `opacidadeDoPonto` | Pontos | Visual | Pontos · Opacidade |
| `corDasDivisorias` | Quadrantes | Visual | Quadrantes · Cor das divisórias |
| `contornoDoPonto` | Pontos | Visual | Pontos · Contorno no ponto |
| `pintarQuadrantes` | Quadrantes | Visual | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Ponto de interrogação" |
| `cor_inferiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Abacaxi" |
| `cor_inferiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Vaca leiteira" |
| `cor_superiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Estrela" |
| `mostrarEixoX` | Eixos | Texto | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Eixos | Texto | Eixo X · Título do eixo X |
| `escalaEixoX` | Eixos | Texto | Eixo X · Escala do eixo X |
| `minimoEixoX` | Eixos | Texto | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Eixos | Texto | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Eixos | Texto | Eixo X · Inverter eixo X |
| `gradeEixoX` | Eixos | Texto | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Eixos | Texto | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Eixos | Texto | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Eixos | Texto | Eixo Y · Título do eixo Y |
| `escalaEixoY` | Eixos | Texto | Eixo Y · Escala do eixo Y |
| `minimoEixoY` | Eixos | Texto | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Eixos | Texto | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Eixos | Texto | Eixo Y · Inverter eixo Y |
| `gradeEixoY` | Eixos | Texto | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Eixos | Texto | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Eixos | Texto | Eixo · Formato dos números nos eixos |
| `casasDecimaisDoEixo` | Eixos | Texto | Eixo · Casas decimais nos eixos |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `quantosRotulosDePonto` | Rótulos | Texto | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarContagemPorQuadrante` | Quadrantes | Texto | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Ponto de interrogação" |
| `rotulo_inferiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Abacaxi" |
| `rotulo_inferiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Vaca leiteira" |
| `rotulo_superiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Estrela" |
| `eixoXSimetricoEmTorno1` | Quadrantes | Texto | Quadrantes · Centrar o eixo X em 1 (deixa a divisória no meio, como na matriz original) |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoX` | Dados | Dados | Medida do eixo X |
| `campoDoY` | Dados | Dados | Medida do eixo Y |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |

</details>

## Múltiplas Árvores (`arvores_multiplas`)

- Antes (9 abas): Cores · Rótulos · Interação · Animação · Tema · Avançado · Dados · Árvore · Grade
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `formatoDaHierarquia` | Dados | Dados | Como a hierarquia está montada |
| `rotuloDaRaiz` | Dados | Dados | Nome do nó raiz (quando há várias raízes) |
| `profundidadeMaxima` | Dados | Dados | Profundidade máxima (0 = toda a árvore) |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `colorirPor` | Cores | Visual | Cor · Cor dos nós |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `layoutDaArvore` | Árvore | Visual | Árvore · Distribuição dos nós |
| `colunasDaGrade` | Grade | Visual | Grade · Colunas (0 = ajustar ao tamanho) |
| `formaDaLigacao` | Árvore | Visual | Árvore · Forma das ligações |
| `larguraMinimaDaArvore` | Grade | Visual | Grade · Largura mínima de cada árvore (px) |
| `espessuraDaLigacao` | Árvore | Visual | Árvore · Espessura das ligações |
| `alturaDaArvore` | Grade | Visual | Grade · Altura de cada árvore (px) |
| `espessuraPorValor` | Árvore | Visual | Árvore · Ligação mais grossa para ramos maiores |
| `escalaPorArvore` | Grade | Visual | Grade · Cada árvore com o próprio tamanho de nó (deixa de ser comparável) |
| `tamanhoDoNo` | Árvore | Visual | Árvore · Tamanho do nó |
| `tamanhoPorValor` | Árvore | Visual | Árvore · Nó maior para valores maiores |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `mostrarRotulosDeFolha` | Rótulos | Texto | Rótulo · Escrever o nome das folhas |
| `mostrarRotulosInternos` | Rótulos | Texto | Rótulo · Escrever o nome dos nós internos |
| `mostrarValorNoRotulo` | Rótulos | Texto | Rótulo · Incluir o valor no rótulo |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `mostrarBotoesDeExpandir` ★ | — | Interação | Clique · Mostrar botões "Expandir tudo" e "Colapsar tudo" |
| `animacaoAtiva` | Animação | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` | Animação | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` | Animação | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` | Animação | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` | Animação | Interação | Animação · Curva da animação |
| `quandoAnimar` | Animação | Interação | Animação · Quando animar |
| `contadorAnimado` | Animação | Interação | Animação · Números sobem/descem até o valor (contador) |
| `nivelInicialExpandido` ★ | — | Interação | Árvore · Níveis abertos no início (0 = tudo aberto) |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoId` | Dados | Dados | Campo do ID (formato id/superior) |
| `campoDoPai` | Dados | Dados | Campo do superior (formato id/superior) |
| `campoDoNome` | Dados | Dados | Campo do nome a exibir |
| `campoDoValor` | Dados | Dados | Medida do tamanho |

</details>

## Organograma (`org_chart`)

- Antes (8 abas): Cores · Rótulos · Interação · Animação · Tema · Avançado · Dados · Organograma
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `formatoDaHierarquia` | Dados | Dados | Como a hierarquia está montada |
| `rotuloDaRaiz` | Dados | Dados | Nome do nó raiz (quando há várias raízes) |
| `profundidadeMaxima` | Dados | Dados | Profundidade máxima (0 = toda a árvore) |
| `comecarRecolhidoAPartirDe` | Organograma | Dados | Organograma · Começar recolhido a partir do nível (0 = tudo aberto) |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `preencherCartao` | Cores | Visual | Cor · Cartão preenchido com a cor do ramo |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `orientacao` | Organograma | Visual | Organograma · Direção |
| `larguraDoCartao` | Organograma | Visual | Organograma · Largura do cartão (px) |
| `alturaDoCartao` | Organograma | Visual | Organograma · Altura do cartão (px) |
| `espacoEntreNiveis` | Organograma | Visual | Organograma · Espaço entre níveis (px) |
| `espacoEntreIrmaos` | Organograma | Visual | Organograma · Espaço entre cartões vizinhos (px) |
| `raioDoCartao` | Organograma | Visual | Organograma · Arredondamento do cartão (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `mostrarValorNoCartao` | Rótulos | Texto | Rótulo · Mostrar o valor dentro do cartão |
| `mostrarContagemDeEquipe` | Rótulos | Texto | Rótulo · Mostrar quantos descendentes cada cartão tem |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` | Animação | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` | Animação | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` | Animação | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` | Animação | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` | Animação | Interação | Animação · Curva da animação |
| `quandoAnimar` | Animação | Interação | Animação · Quando animar |
| `contadorAnimado` | Animação | Interação | Animação · Números sobem/descem até o valor (contador) |
| `permitirRecolher` | Organograma | Interação | Organograma · Recolher uma área clicando no cartão |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoId` | Dados | Dados | Campo do ID (formato id/superior) |
| `campoDoPai` | Dados | Dados | Campo do superior (formato id/superior) |
| `campoDoNome` | Dados | Dados | Campo do nome a exibir |
| `campoDoValor` | Dados | Dados | Medida do tamanho |
| `campoDoCargo` | Rótulos | Texto | Rótulo · Campo da segunda linha do cartão |

</details>

## UpSet Plot (`upset_plot`)

- Antes (8 abas): Cores · Rótulos · Interação · Animação · Tema · Avançado · Dados · Formato
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `formatoDosDados` | Dados | Dados | Como os dados estão organizados |
| `separadorDeConjuntos` | Dados | Dados | Separador dos conjuntos na dimensão |
| `medirPor` | Dados | Dados | O número mostrado é |
| `maximoDeConjuntos` | Dados | Dados | Máximo de conjuntos |
| `maximoDeIntersecoes` | Dados | Dados | Quantas interseções mostrar (as maiores) |
| `ordenarIntersecoes` | Dados | Dados | Ordem das barras |
| `esconderIntersecoesVazias` | Dados | Dados | Esconder interseções sem nenhum item |
| `alturaDaMatriz` | Formato | Visual | Altura da matriz de pontos (% do gráfico) |
| `mostrarTotaisDosConjuntos` | Formato | Visual | Mostrar o total de cada conjunto à esquerda |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `mostrarValorNaBarra` | Rótulos | Texto | Rótulo · Escrever o valor acima da barra |
| `mostrarPercentual` | Rótulos | Texto | Rótulo · Mostrar o percentual do total |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` | Animação | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` | Animação | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` | Animação | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` | Animação | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` | Animação | Interação | Animação · Curva da animação |
| `quandoAnimar` | Animação | Interação | Animação · Quando animar |
| `contadorAnimado` | Animação | Interação | Animação · Números sobem/descem até o valor (contador) |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |

</details>

## Drawdown (`drawdown`)

- Antes (10 abas): Cores · Eixos · Legenda · Rótulos · Interação · Tema · Avançado · Dados · Formato · Drawdown
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |
| `limiteDeSeries` | Dados | Dados | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Somar as séries que passaram do limite em "Outros" |
| `tratamentoDeNulos` | Dados | Dados | Valores faltando |
| `unidadeDoDrawdown` | Drawdown | Dados | Drawdown · Medir a queda em |
| `destacarPiorQueda` | Drawdown | Dados | Drawdown · Destacar a pior queda |
| `mostrarRecuperacao` | Drawdown | Dados | Drawdown · Mostrar quanto durou a pior queda |
| `curvaDaLinha` | Formato | Visual | Suavização da linha |
| `espessuraDaLinha` | Formato | Visual | Espessura da linha |
| `mostrarPontos` | Formato | Visual | Marcar cada período com um ponto |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `corDaQueda` | Drawdown | Visual | Drawdown · Cor da área de queda |
| `opacidadeDaArea` | Drawdown | Visual | Drawdown · Opacidade da área |
| `mostrarEixoX` | Eixos | Texto | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Eixos | Texto | Eixo X · Título do eixo X |
| `escalaEixoX` | Eixos | Texto | Eixo X · Escala do eixo X |
| `minimoEixoX` | Eixos | Texto | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Eixos | Texto | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Eixos | Texto | Eixo X · Inverter eixo X |
| `gradeEixoX` | Eixos | Texto | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Eixos | Texto | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Eixos | Texto | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Eixos | Texto | Eixo Y · Título do eixo Y |
| `escalaEixoY` | Eixos | Texto | Eixo Y · Escala do eixo Y |
| `minimoEixoY` | Eixos | Texto | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Eixos | Texto | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Eixos | Texto | Eixo Y · Inverter eixo Y |
| `gradeEixoY` | Eixos | Texto | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Eixos | Texto | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Eixos | Texto | Eixo · Formato dos números nos eixos |
| `casasDecimaisDoEixo` | Eixos | Texto | Eixo · Casas decimais nos eixos |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `mostrarLegenda` | Legenda | Texto | Legenda · Mostrar legenda |
| `posicaoDaLegenda` | Legenda | Texto | Legenda · Posição da legenda |
| `legendaInterativa` | Legenda | Texto | Legenda · Clicar na legenda liga/desliga a série |
| `mostrarValoresNaLegenda` | Legenda | Texto | Legenda · Mostrar valores na legenda |
| `tamanhoDaLegenda` | Legenda | Texto | Legenda · Tamanho do texto da legenda (px) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `cor_abertura` ★ | — | Visual | Cor · Cor — Abertura (vazio = da paleta) |
| `cor_maxima` ★ | — | Visual | Cor · Cor — Máxima (vazio = da paleta) |
| `cor_minima` ★ | — | Visual | Cor · Cor — Mínima (vazio = da paleta) |
| `cor_fechamento` ★ | — | Visual | Cor · Cor — Fechamento (vazio = da paleta) |
| `cor_volume` ★ | — | Visual | Cor · Cor — Volume (vazio = da paleta) |

</details>

## Pareto (`pareto`)

- Antes (9 abas): Cores · Eixos · Rótulos · Interação · Tema · Avançado · Pareto · Dados · Formato
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `maximoDeCategorias` | Dados | Dados | Máximo de barras (o resto vira "Outros") |
| `nivelDeCorte` | Pareto | Dados | Pareto · Nível de corte (%) |
| `mostrarCorte` | Pareto | Dados | Pareto · Marcar onde o acumulado cruza o corte |
| `destacarAteOCorte` | Pareto | Dados | Pareto · Destacar as barras que estão antes do corte |
| `larguraDaBarra` | Formato | Visual | Largura da barra (% do espaço) |
| `mostrarPontosDoAcumulado` | Formato | Visual | Marcar cada ponto da linha acumulada |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `corDaBarra` | Cores | Visual | Cor · Cor das barras |
| `corDoAcumulado` | Cores | Visual | Cor · Cor da linha acumulada |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `mostrarEixoX` | Eixos | Texto | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Eixos | Texto | Eixo X · Título do eixo X |
| `escalaEixoX` | Eixos | Texto | Eixo X · Escala do eixo X |
| `minimoEixoX` | Eixos | Texto | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Eixos | Texto | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Eixos | Texto | Eixo X · Inverter eixo X |
| `gradeEixoX` | Eixos | Texto | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Eixos | Texto | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Eixos | Texto | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Eixos | Texto | Eixo Y · Título do eixo Y |
| `escalaEixoY` | Eixos | Texto | Eixo Y · Escala do eixo Y |
| `minimoEixoY` | Eixos | Texto | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Eixos | Texto | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Eixos | Texto | Eixo Y · Inverter eixo Y |
| `gradeEixoY` | Eixos | Texto | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Eixos | Texto | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Eixos | Texto | Eixo · Formato dos números nos eixos |
| `casasDecimaisDoEixo` | Eixos | Texto | Eixo · Casas decimais nos eixos |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |

</details>

## Treemap de Carteira (`treemap_carteira`)

- Antes (7 abas): Cores · Rótulos · Interação · Tema · Avançado · Dados · Treemap
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `formatoDaHierarquia` | Dados | Dados | Como a hierarquia está montada |
| `rotuloDaRaiz` | Dados | Dados | Nome do nó raiz (quando há várias raízes) |
| `profundidadeMaxima` | Dados | Dados | Profundidade máxima (0 = toda a árvore) |
| `maximoDeBlocos` | Treemap | Dados | Treemap · Máximo de retângulos (o resto vira "Outros") |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `colorirPor` | Cores | Visual | Cor · Cor dos retângulos |
| `escalaDivergente` | Cores | Visual | Cor · Escala da cor |
| `limiteDaCor` | Cores | Visual | Cor · Limite da escala (vazio = o maior desvio dos dados) |
| `inverterEscala` | Cores | Visual | Cor · Inverter a escala (quando valor alto é ruim) |
| `mostrarLegendaDeCor` | Cores | Visual | Cor · Mostrar a régua de cores |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `arranjo` | Treemap | Visual | Treemap · Como arrumar os retângulos |
| `espacoEntreBlocos` | Treemap | Visual | Treemap · Espaço entre retângulos (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `mostrarValorNoBloco` | Rótulos | Texto | Rótulo · Escrever o valor dentro do retângulo |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarTitulosDeGrupo` | Treemap | Texto | Treemap · Faixa com o nome de cada grupo |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoId` | Dados | Dados | Campo do ID (formato id/superior) |
| `campoDoPai` | Dados | Dados | Campo do superior (formato id/superior) |
| `campoDoNome` | Dados | Dados | Campo do nome a exibir |
| `campoDoValor` | Dados | Dados | Medida do tamanho |
| `campoDaCor` | Cores | Visual | Cor · Medida da cor |

</details>

## Risco x Retorno (`risco_retorno`)

- Antes (10 abas): Cores · Eixos · Rótulos · Interação · Tema · Avançado · Quadrantes · Pontos · Sharpe · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `divisoriaX` | Quadrantes | Dados | Quadrantes · Linha divisória vertical (eixo X) |
| `taxaLivreDeRisco` | Sharpe | Dados | Sharpe · Taxa livre de risco (no mesmo formato do eixo Y) |
| `valorDaDivisoriaX` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória X |
| `mostrarRetaDeSharpe` | Sharpe | Dados | Sharpe · Reta até o melhor índice de Sharpe |
| `divisoriaY` | Quadrantes | Dados | Quadrantes · Linha divisória horizontal (eixo Y) |
| `destacarMelhorSharpe` | Sharpe | Dados | Sharpe · Destacar o ativo de melhor Sharpe |
| `valorDaDivisoriaY` | Quadrantes | Dados | Quadrantes · Valor fixo da divisória Y |
| `colorirPor` | Pontos | Dados | Pontos · Cor dos pontos |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `modoDeCor` | Cores | Visual | Cor · Como colorir |
| `corUnica` | Cores | Visual | Cor · Cor única |
| `escalaDeCor` | Cores | Visual | Cor · Escala contínua (cor por valor) |
| `escalaDeCorPersonalizada` | Cores | Visual | Cor · Usar cores próprias na escala |
| `corMinima` | Cores | Visual | Cor · Cor do mínimo |
| `corMedia` | Cores | Visual | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Cores | Visual | Cor · Cor do máximo |
| `limiteDeCorAutomatico` | Cores | Visual | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Cores | Visual | Cor · Mínimo da escala (manual) |
| `limiteDeCorMaximo` | Cores | Visual | Cor · Máximo da escala (manual) |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `tamanhoDoPonto` | Pontos | Visual | Pontos · Tamanho do ponto |
| `tamanhoMaximoDoPonto` | Pontos | Visual | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Pontos | Visual | Pontos · Forma |
| `opacidadeDoPonto` | Pontos | Visual | Pontos · Opacidade |
| `corDaRetaDeSharpe` | Sharpe | Visual | Sharpe · Cor da reta |
| `corDasDivisorias` | Quadrantes | Visual | Quadrantes · Cor das divisórias |
| `contornoDoPonto` | Pontos | Visual | Pontos · Contorno no ponto |
| `pintarQuadrantes` | Quadrantes | Visual | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Retorno alto, risco alto" |
| `cor_inferiorDireito` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Retorno baixo, risco alto" |
| `cor_inferiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Retorno baixo, risco baixo" |
| `cor_superiorEsquerdo` | Quadrantes | Visual | Quadrantes · Cor do quadrante "Retorno alto, risco baixo" |
| `mostrarEixoX` | Eixos | Texto | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Eixos | Texto | Eixo X · Título do eixo X |
| `escalaEixoX` | Eixos | Texto | Eixo X · Escala do eixo X |
| `minimoEixoX` | Eixos | Texto | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Eixos | Texto | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Eixos | Texto | Eixo X · Inverter eixo X |
| `gradeEixoX` | Eixos | Texto | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Eixos | Texto | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Eixos | Texto | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Eixos | Texto | Eixo Y · Título do eixo Y |
| `escalaEixoY` | Eixos | Texto | Eixo Y · Escala do eixo Y |
| `minimoEixoY` | Eixos | Texto | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Eixos | Texto | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Eixos | Texto | Eixo Y · Inverter eixo Y |
| `gradeEixoY` | Eixos | Texto | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Eixos | Texto | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Eixos | Texto | Eixo · Formato dos números nos eixos |
| `casasDecimaisDoEixo` | Eixos | Texto | Eixo · Casas decimais nos eixos |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `quantosRotulosDePonto` | Rótulos | Texto | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarContagemPorQuadrante` | Quadrantes | Texto | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Retorno alto, risco alto" |
| `rotulo_inferiorDireito` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Retorno baixo, risco alto" |
| `rotulo_inferiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Retorno baixo, risco baixo" |
| `rotulo_superiorEsquerdo` | Quadrantes | Texto | Quadrantes · Nome do quadrante "Retorno alto, risco baixo" |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoX` | Dados | Dados | Medida do eixo X |
| `campoDoY` | Dados | Dados | Medida do eixo Y |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |

</details>

## Grafico de Controle (`grafico_controle`)

- Antes (9 abas): Cores · Eixos · Rótulos · Interação · Tema · Avançado · Dados · Formato · Controle
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |
| `limiteDeSeries` | Dados | Dados | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Somar as séries que passaram do limite em "Outros" |
| `tratamentoDeNulos` | Dados | Dados | Valores faltando |
| `metodoDoSigma` | Controle | Dados | Controle · Como estimar o σ |
| `linhaCentral` | Controle | Dados | Controle · Linha central |
| `periodoBase` | Controle | Dados | Controle · Calcular os limites só com os N primeiros períodos (0 = todos) |
| `regrasAtivas` | Controle | Dados | Controle · Regras de Nelson |
| `curvaDaLinha` | Formato | Visual | Suavização da linha |
| `espessuraDaLinha` | Formato | Visual | Espessura da linha |
| `mostrarPontos` | Formato | Visual | Marcar cada período com um ponto |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `larguraDosLimites` | Controle | Visual | Controle · Limites em quantos σ |
| `mostrarZonas` | Controle | Visual | Controle · Sombrear as zonas de 1σ e 2σ |
| `corDoSinal` | Controle | Visual | Controle · Cor dos pontos fora de controle |
| `mostrarEixoX` | Eixos | Texto | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Eixos | Texto | Eixo X · Título do eixo X |
| `escalaEixoX` | Eixos | Texto | Eixo X · Escala do eixo X |
| `minimoEixoX` | Eixos | Texto | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Eixos | Texto | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Eixos | Texto | Eixo X · Inverter eixo X |
| `gradeEixoX` | Eixos | Texto | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Eixos | Texto | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Eixos | Texto | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Eixos | Texto | Eixo Y · Título do eixo Y |
| `escalaEixoY` | Eixos | Texto | Eixo Y · Escala do eixo Y |
| `minimoEixoY` | Eixos | Texto | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Eixos | Texto | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Eixos | Texto | Eixo Y · Inverter eixo Y |
| `gradeEixoY` | Eixos | Texto | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Eixos | Texto | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Eixos | Texto | Eixo · Formato dos números nos eixos |
| `casasDecimaisDoEixo` | Eixos | Texto | Eixo · Casas decimais nos eixos |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `escreverLimites` | Rótulos | Texto | Rótulo · Escrever os valores de LSC, LC e LIC |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |

</details>

## Heatmap Denso (`heatmap_denso`)

- Antes (7 abas): Rótulos · Interação · Tema · Avançado · Cor · Formato · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `mostrarGrade` | Formato | Visual | Separar as células com linha (some quando não cabe) |
| `maximoDeLinhas` | Formato | Visual | Máximo de linhas |
| `maximoDeColunas` | Formato | Visual | Máximo de colunas |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `escalaDeCor` | Cor | Visual | Cor · Paleta contínua |
| `modoDaEscala` | Cor | Visual | Cor · Como a cor mapeia o valor |
| `inverterCor` | Cor | Visual | Cor · Inverter a paleta |
| `corDaAusencia` | Cor | Visual | Cor · Cor das células sem dado |
| `mostrarLegendaDeCor` | Cor | Visual | Cor · Mostrar a régua de cor |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDaLinha` | Dados | Dados | Dimensão das linhas |
| `campoDaColuna` | Dados | Dados | Dimensão das colunas |
| `campoDoValor` | Dados | Dados | Medida da cor |

</details>

## Barras de Ranking Denso (`barras_ranking_denso`)

- Antes (8 abas): Cores · Rótulos · Interação · Tema · Avançado · Ranking · Formato · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `ordem` | Ranking | Dados | Ranking · Ordem |
| `destacarTop` | Ranking | Dados | Ranking · Destacar as N primeiras (0 = nenhuma) |
| `referencia` | Ranking | Dados | Ranking · Linha de referência |
| `valorDaReferencia` | Ranking | Dados | Ranking · Valor fixo da referência |
| `larguraDoNome` | Formato | Visual | Largura da coluna de nomes (px) |
| `mostrarPosicao` | Formato | Visual | Mostrar a posição no ranking |
| `mostrarGrade` ★ | — | Visual | Linhas de grade verticais |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `alturaDaLinha` | Ranking | Visual | Ranking · Altura de cada barra (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `mostrarBusca` | Ranking | Interação | Ranking · Campo de busca por nome |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoValor` | Dados | Dados | Medida da barra |

</details>

## Dot Plot Denso (`dot_plot_denso`)

- Antes (8 abas): Cores · Rótulos · Interação · Tema · Avançado · Dot plot · Formato · Medidas
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `comecarEmZero` | Dot plot | Dados | Dot plot · Começar o eixo em zero (desligue para ver diferenças pequenas) |
| `ordem` | Dot plot | Dados | Dot plot · Ordenar por |
| `larguraDoNome` | Formato | Visual | Largura da coluna de nomes (px) |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `alturaDaLinha` | Dot plot | Visual | Dot plot · Altura de cada linha (px) |
| `tamanhoDoPonto` | Dot plot | Visual | Dot plot · Tamanho do ponto (px) |
| `formaDoPonto` ★ | — | Visual | Dot plot · Forma do ponto |
| `ligarPontos` | Dot plot | Visual | Dot plot · Ligar os pontos da mesma linha |
| `mostrarGuias` | Dot plot | Visual | Dot plot · Linhas de guia verticais |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `escreverValores` | Rótulos | Texto | Rótulo · Escrever os valores |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `mostrarBusca` | Dot plot | Interação | Dot plot · Campo de busca por nome |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `usar_vendas` | Medidas | Dados | Incluir "Vendas" |
| `usar_pedidos` | Medidas | Dados | Incluir "Pedidos" |

</details>

## Bump Chart (`bump_chart`)

- Antes (8 abas): Cores · Rótulos · Interação · Tema · Avançado · Dados · Formato · Ranking
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |
| `limiteDeSeries` | Dados | Dados | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Somar as séries que passaram do limite em "Outros" |
| `tratamentoDeNulos` | Dados | Dados | Valores faltando |
| `melhorPosicao` | Ranking | Dados | Ranking · A 1ª posição é |
| `curvaDaLinha` | Formato | Visual | Suavização da linha |
| `espessuraDaLinha` | Formato | Visual | Espessura da linha |
| `mostrarPontos` | Formato | Visual | Marcar cada período com um ponto |
| `tamanhoDoPonto` | Formato | Visual | Tamanho do ponto |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `rotulosNasPontas` | Rótulos | Texto | Rótulo · Nomes nas pontas |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarPosicao` | Ranking | Texto | Ranking · Número da posição dentro do ponto |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `destacarNoHover` | Ranking | Interação | Ranking · Destacar uma série ao passar o mouse |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `cor_Sudeste` ★ | — | Visual | Cor · Cor — Sudeste (vazio = da paleta) |
| `cor_Sul` ★ | — | Visual | Cor · Cor — Sul (vazio = da paleta) |
| `cor_Nordeste` ★ | — | Visual | Cor · Cor — Nordeste (vazio = da paleta) |
| `cor_Norte` ★ | — | Visual | Cor · Cor — Norte (vazio = da paleta) |
| `cor_Centro_Oeste` ★ | — | Visual | Cor · Cor — Centro-Oeste (vazio = da paleta) |

</details>

## Slope Chart (`slope_chart`)

- Antes (8 abas): Cores · Rótulos · Interação · Tema · Avançado · Dados · Slope · Formato
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |
| `limiteDeSeries` | Dados | Dados | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Somar as séries que passaram do limite em "Outros" |
| `criterioDaVariacao` | Slope | Dados | Slope · Medir a variação em |
| `destacarMaiores` | Slope | Dados | Slope · Destacar as N maiores variações (0 = nenhuma) |
| `comecarEmZero` | Slope | Dados | Slope · Começar o eixo em zero |
| `espessuraDaLinha` | Formato | Visual | Espessura das linhas |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `corPorDirecao` | Slope | Visual | Slope · Colorir por direção (sobe, desce, mantém) |
| `corDeAlta` | Slope | Visual | Slope · Cor de quem subiu |
| `corDeBaixa` | Slope | Visual | Slope · Cor de quem caiu |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `escreverValores` | Rótulos | Texto | Rótulo · Escrever o valor junto do nome |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `cor_Sudeste` ★ | — | Visual | Cor · Cor — Sudeste (vazio = da paleta) |
| `cor_Sul` ★ | — | Visual | Cor · Cor — Sul (vazio = da paleta) |
| `cor_Nordeste` ★ | — | Visual | Cor · Cor — Nordeste (vazio = da paleta) |
| `cor_Norte` ★ | — | Visual | Cor · Cor — Norte (vazio = da paleta) |
| `cor_Centro_Oeste` ★ | — | Visual | Cor · Cor — Centro-Oeste (vazio = da paleta) |

</details>

## Bar Chart Race (`bar_race`)

- Antes (7 abas): Cores · Rótulos · Tema · Avançado · Dados · Corrida · Formato
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |
| `limiteDeSeries` | Dados | Dados | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Somar as séries que passaram do limite em "Outros" |
| `barrasVisiveis` | Corrida | Dados | Corrida · Quantas barras mostrar |
| `alturaDaBarra` | Formato | Visual | Altura de cada barra (px, 0 = divide o espaço) |
| `larguraDoNome` | Formato | Visual | Largura da coluna de nomes (px) |
| `mostrarGrade` ★ | — | Visual | Linhas de grade verticais |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `escalaFixa` | Corrida | Visual | Corrida · Escala fixa (o maior valor de TODOS os períodos) |
| `tamanhoDoRank` ★ | — | Visual | Corrida · Tamanho do número do rank (px, 0 = acompanha a barra) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarRank` ★ | — | Texto | Corrida · Mostrar o número do rank (1, 2, 3…) |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `duracaoPorPeriodo` | Corrida | Interação | Corrida · Duração de cada período (ms) |
| `comecarTocando` | Corrida | Interação | Corrida · Começar tocando |
| `repetir` | Corrida | Interação | Corrida · Repetir do início ao terminar |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |

</details>

## KPI Vivo (`kpi_vivo`)

- Antes (5 abas): Rótulos · Tema · Avançado · KPI · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `formatoDoNumero` ★ | — | Dados | Formato do número (Automático = o do rótulo / do campo) |
| `casasDoNumero` ★ | — | Dados | Casas decimais do número |
| `simboloDaMoeda` ★ | — | Dados | Símbolo da moeda |
| `baseDaComparacao` | KPI | Dados | KPI · Comparar com |
| `periodosAtras` | KPI | Dados | KPI · Quantos períodos atrás |
| `meta` | KPI | Dados | KPI · Valor da meta |
| `menorEhMelhor` | KPI | Dados | KPI · Menor é melhor (custo, churn, tempo de resposta…) |
| `colorirVariacao` | KPI | Dados | KPI · Colorir a variação por direção |
| `mostrarVariacaoAbsoluta` | KPI | Dados | KPI · Mostrar também a diferença absoluta |
| `mostrarProgressoDaMeta` ★ | — | Dados | KPI · Barra de progresso até a meta (usa "Valor da meta") |
| `usarLimites` ★ | — | Dados | KPI · Colorir o número por limites (verde / amarelo / vermelho) |
| `limiteVerde` ★ | — | Dados | KPI · Limite do verde (a partir de; com "menor é melhor": até) |
| `limiteAmarelo` ★ | — | Dados | KPI · Limite do amarelo (a partir de; com "menor é melhor": até) |
| `colunasDoKpi` ★ | — | Dados | KPI · Colunas da grade (0 = automático) |
| `linhasDoKpi` ★ | — | Dados | KPI · Linhas da grade (0 = automático) |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `mostrarSparkline` | KPI | Visual | KPI · Sparkline de contexto |
| `layoutDoCartao` ★ | — | Visual | KPI · Layout do cartão |
| `tipoDeSparkline` ★ | — | Visual | KPI · Minigráfico |
| `corPositiva` ★ | — | Visual | KPI · Cor do positivo (vazio = do tema) |
| `corNegativa` ★ | — | Visual | KPI · Cor do negativo (vazio = do tema) |
| `iconeDoKpi` ★ | — | Visual | KPI · Ícone |
| `corDoIcone` ★ | — | Visual | KPI · Cor do ícone (vazio = destaque do tema) |
| `kpisEmGrade` ★ | — | Visual | KPI · Vários KPIs em grade (um cartão por medida) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `titulo` | Rótulos | Texto | Título · Título (vazio = nome da medida) |
| `subtitulo` | Tema | Texto | Título · Subtítulo do cartão |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `contadorAnimado` ★ | — | Interação | Animação · Animação de contagem do número |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoPeriodo` | Dados | Dados | Dimensão do tempo |

</details>

## Halteres (`dumbbell`)

- Antes (8 abas): Cores · Rótulos · Interação · Tema · Avançado · Halteres · Formato · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `comecarEmZero` | Halteres | Dados | Halteres · Começar o eixo em zero |
| `ordem` | Halteres | Dados | Halteres · Ordenar por |
| `menorEhMelhor` | Halteres | Dados | Halteres · Menor é melhor (custo, churn, tempo de resposta…) |
| `larguraDoNome` | Formato | Visual | Largura da coluna de nomes (px) |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `corPorDirecao` | Halteres | Visual | Halteres · Colorir a barra por direção (subiu, desceu) |
| `alturaDaLinha` | Halteres | Visual | Halteres · Altura de cada linha (px) |
| `tamanhoDoPonto` | Halteres | Visual | Halteres · Tamanho dos pontos (px) |
| `formaDoPonto` ★ | — | Visual | Halteres · Forma do ponto |
| `espessuraDaBarra` | Halteres | Visual | Halteres · Espessura da barra (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `escreverValores` | Rótulos | Texto | Rótulo · Escrever |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `mostrarBusca` | Halteres | Interação | Halteres · Campo de busca por nome |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDoAntes` | Dados | Dados | Primeira medida (o "antes") |
| `campoDoDepois` | Dados | Dados | Segunda medida (o "depois") |

</details>

## Marimekko (`marimekko`)

- Antes (8 abas): Cores · Legenda · Rótulos · Interação · Tema · Avançado · Marimekko · Dados
- Depois (5 abas): Dados · Visual · Texto · Interação · Avançado

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel |
|---|---|---|---|
| `maximoDeColunas` | Marimekko | Dados | Marimekko · Máximo de colunas (o resto vira "Outros") |
| `maximoDeSeries` | Marimekko | Dados | Marimekko · Máximo de séries empilhadas (o resto vira "Outros") |
| `ordemDasColunas` | Marimekko | Dados | Marimekko · Ordem das colunas |
| `paleta` | Cores | Visual | Cor · Paleta de cores |
| `inverterPaleta` | Cores | Visual | Cor · Inverter ordem das cores |
| `opacidade` | Cores | Visual | Cor · Opacidade do preenchimento |
| `mostrarContorno` | Cores | Visual | Cor · Mostrar contorno |
| `corDoContorno` | Cores | Visual | Cor · Cor do contorno |
| `espessuraDoContorno` | Cores | Visual | Cor · Espessura do contorno (px) |
| `tracejadoDoContorno` | Cores | Visual | Cor · Estilo do contorno |
| `tema` | Tema | Visual | Tema · Tema |
| `corDeFundo` | Tema | Visual | Cor · Cor de fundo (vazio = do tema) |
| `corDoTexto` | Tema | Visual | Cor · Cor do texto (tema personalizado) |
| `corDaBorda` | Tema | Visual | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Tema | Visual | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Tema | Visual | Tema · Fonte |
| `tamanhoDaFonte` | Tema | Visual | Tema · Tamanho base da fonte (px) |
| `espacoEntreColunas` | Marimekko | Visual | Marimekko · Espaço entre colunas (px) |
| `mostrarRotulos` | Rótulos | Texto | Rótulo · Mostrar rótulos |
| `tamanhoDoRotulo` | Rótulos | Texto | Rótulo · Tamanho do rótulo (px) |
| `corDoRotulo` | Rótulos | Texto | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Rótulos | Texto | Rótulo · Rótulo em negrito |
| `rotacaoDoRotulo` | Rótulos | Texto | Rótulo · Rotação do rótulo (graus) |
| `evitarColisaoDeRotulos` | Rótulos | Texto | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Rótulos | Texto | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Rótulos | Texto | Rótulo · Posição do rótulo |
| `conteudoDoRotulo` | Rótulos | Texto | Rótulo · O que mostrar no rótulo |
| `formatoDoRotulo` | Rótulos | Texto | Rótulo · Formato do número no rótulo |
| `casasDecimaisDoRotulo` | Rótulos | Texto | Rótulo · Casas decimais no rótulo |
| `escreverPercentuais` | Rótulos | Texto | Rótulo · Escrever o percentual dentro do bloco |
| `escreverLarguras` | Rótulos | Texto | Rótulo · Escrever o peso de cada coluna no topo |
| `mostrarLegenda` | Legenda | Texto | Legenda · Mostrar legenda |
| `posicaoDaLegenda` | Legenda | Texto | Legenda · Posição da legenda |
| `legendaInterativa` | Legenda | Texto | Legenda · Clicar na legenda liga/desliga a série |
| `mostrarValoresNaLegenda` | Legenda | Texto | Legenda · Mostrar valores na legenda |
| `tamanhoDaLegenda` | Legenda | Texto | Legenda · Tamanho do texto da legenda (px) |
| `titulo` | Tema | Texto | Título · Título |
| `subtitulo` | Tema | Texto | Título · Subtítulo |
| `textoSemDados` | Tema | Texto | Aviso · Mensagem quando não há dados |
| `mostrarAvisos` ★ | — | Texto | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` ★ | — | Texto | Aviso · Posição dos avisos |
| `mostrarTooltip` | Interação | Interação | Tooltip · Mostrar tooltip |
| `tooltipPersonalizado` | Interação | Interação | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Interação | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Interação | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Interação | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` ★ | — | Interação | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` ★ | — | Interação | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` ★ | — | Interação | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` ★ | — | Interação | Tooltip · Cor da borda do tooltip |
| `corDoTextoDoTooltip` ★ | — | Interação | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` ★ | — | Interação | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` ★ | — | Interação | Animação · Ativar animações |
| `duracaoDaAnimacao` ★ | — | Interação | Animação · Duração (ms) |
| `atrasoDaAnimacao` ★ | — | Interação | Animação · Atraso inicial (ms) |
| `cascataDaAnimacao` ★ | — | Interação | Animação · Cascata entre itens (ms) |
| `suavizacaoDaAnimacao` ★ | — | Interação | Animação · Curva da animação |
| `quandoAnimar` ★ | — | Interação | Animação · Quando animar |
| `destacarAoPassarMouse` ★ | — | Interação | Clique · Destacar ao passar o mouse |
| `modoDebug` | Avançado | Avançado | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Avançado | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Avançado | Aplicar o JSON acima por cima das opções |
| `campoDaColuna` | Dados | Dados | Dimensão das colunas (a largura) |
| `campoDaSerie` | Dados | Dados | Dimensão empilhada (a altura) |
| `campoDoValor` | Dados | Dados | Medida |

</details>
