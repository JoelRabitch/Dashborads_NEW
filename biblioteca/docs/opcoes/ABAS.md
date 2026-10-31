# Abas do painel e rótulos — antes e depois (2.8 e melhorias v3, 5.1b)

Gerado por `build/relatorio-abas.mjs`. Abas novas, nesta ordem: **Dados · Estilo · Texto · Mais**.

O editor do Looker costuma mostrar as abas em ordem ALFABÉTICA (Dados · Estilo · Mais · Texto). As opções de eixo ficam na aba **Texto**; interação, tooltip, animação e avançado ficam em **Mais**.

Os rótulos do painel têm no máximo 30 caracteres (liga/desliga) ou 40 (demais). A coluna "explicação" traz o rótulo original completo — é a ajuda de cada opção, já que a API de opções do Looker não tem campo de texto de ajuda.

Nenhuma opção foi removida nem teve id, tipo ou default alterado (conferido por `test/opcoes.test.mjs`).
Ids marcados com ★ são novos (não existiam antes).

## Tabela Completa (`tabela_completa`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `agruparPor` | Dados | Dados | Agrupar linhas por |  |
| `gruposComecamAbertos` | Dados | Dados | Grupos começam abertos |  |
| `mostrarSubtotais` | Dados | Dados | Mostrar subtotal por grupo |  |
| `transporPivo` | Dados | Dados | Transpor | Transpor (valores do pivô viram linhas) |
| `mostrarTotalDeLinha` | Dados | Dados | Coluna de total por linha | Mostrar coluna de total por linha (quando pivotado) |
| `ordenacaoInicial` | Dados | Dados | Ordenação inicial |  |
| `tratamentoDeNulos` | Dados | Dados | Valores nulos |  |
| `textoParaNulo` | Dados | Dados | Texto para valor nulo |  |
| `estiloDeData` | Dados | Dados | Formato das células de data | Formato das colunas com tipo de célula "Data" |
| `mostrarTotais` | Dados | Dados | Mostrar linha de totais |  |
| `agregacaoDoTotal` | Dados | Dados | Como calcular os totais | Como calcular os totais (quando o Looker não envia) |
| `rotuloDoTotal` | Dados | Dados | Rótulo da linha de totais |  |
| `calc1Nome` ★ | — | Dados | Fórmula 1 · Nome da coluna |  |
| `calc2Nome` ★ | — | Dados | Fórmula 2 · Nome da coluna |  |
| `calc3Nome` ★ | — | Dados | Fórmula 3 · Nome da coluna |  |
| `calc4Nome` ★ | — | Dados | Fórmula 4 · Nome da coluna |  |
| `calc5Nome` ★ | — | Dados | Fórmula 5 · Nome da coluna |  |
| `calc6Nome` ★ | — | Dados | Fórmula 6 · Nome da coluna |  |
| `calc7Nome` ★ | — | Dados | Fórmula 7 · Nome da coluna |  |
| `calc8Nome` ★ | — | Dados | Fórmula 8 · Nome da coluna |  |
| `calc1Formula` ★ | — | Dados | Fórmula 1 · Fórmula |  |
| `calc2Formula` ★ | — | Dados | Fórmula 2 · Fórmula |  |
| `calc3Formula` ★ | — | Dados | Fórmula 3 · Fórmula |  |
| `calc4Formula` ★ | — | Dados | Fórmula 4 · Fórmula |  |
| `calc5Formula` ★ | — | Dados | Fórmula 5 · Fórmula |  |
| `calc6Formula` ★ | — | Dados | Fórmula 6 · Fórmula |  |
| `calc7Formula` ★ | — | Dados | Fórmula 7 · Fórmula |  |
| `calc8Formula` ★ | — | Dados | Fórmula 8 · Fórmula |  |
| `calc1Uso` ★ | — | Dados | Fórmula 1 · Uso |  |
| `calc2Uso` ★ | — | Dados | Fórmula 2 · Uso |  |
| `calc3Uso` ★ | — | Dados | Fórmula 3 · Uso |  |
| `calc4Uso` ★ | — | Dados | Fórmula 4 · Uso |  |
| `calc5Uso` ★ | — | Dados | Fórmula 5 · Uso |  |
| `calc6Uso` ★ | — | Dados | Fórmula 6 · Uso |  |
| `calc7Uso` ★ | — | Dados | Fórmula 7 · Uso |  |
| `calc8Uso` ★ | — | Dados | Fórmula 8 · Uso |  |
| `calc1Formato` ★ | — | Dados | Fórmula 1 · Formato |  |
| `calc2Formato` ★ | — | Dados | Fórmula 2 · Formato |  |
| `calc3Formato` ★ | — | Dados | Fórmula 3 · Formato |  |
| `calc4Formato` ★ | — | Dados | Fórmula 4 · Formato |  |
| `calc5Formato` ★ | — | Dados | Fórmula 5 · Formato |  |
| `calc6Formato` ★ | — | Dados | Fórmula 6 · Formato |  |
| `calc7Formato` ★ | — | Dados | Fórmula 7 · Formato |  |
| `calc8Formato` ★ | — | Dados | Fórmula 8 · Formato |  |
| `calc1Casas` ★ | — | Dados | Fórmula 1 · Casas decimais |  |
| `calc2Casas` ★ | — | Dados | Fórmula 2 · Casas decimais |  |
| `calc3Casas` ★ | — | Dados | Fórmula 3 · Casas decimais |  |
| `calc4Casas` ★ | — | Dados | Fórmula 4 · Casas decimais |  |
| `calc5Casas` ★ | — | Dados | Fórmula 5 · Casas decimais |  |
| `calc6Casas` ★ | — | Dados | Fórmula 6 · Casas decimais |  |
| `calc7Casas` ★ | — | Dados | Fórmula 7 · Casas decimais |  |
| `calc8Casas` ★ | — | Dados | Fórmula 8 · Casas decimais |  |
| `calc1TipoDeCelula` ★ | — | Dados | Fórmula 1 · Tipo de célula |  |
| `calc2TipoDeCelula` ★ | — | Dados | Fórmula 2 · Tipo de célula |  |
| `calc3TipoDeCelula` ★ | — | Dados | Fórmula 3 · Tipo de célula |  |
| `calc4TipoDeCelula` ★ | — | Dados | Fórmula 4 · Tipo de célula |  |
| `calc5TipoDeCelula` ★ | — | Dados | Fórmula 5 · Tipo de célula |  |
| `calc6TipoDeCelula` ★ | — | Dados | Fórmula 6 · Tipo de célula |  |
| `calc7TipoDeCelula` ★ | — | Dados | Fórmula 7 · Tipo de célula |  |
| `calc8TipoDeCelula` ★ | — | Dados | Fórmula 8 · Tipo de célula |  |
| `calc1Posicao` ★ | — | Dados | Fórmula 1 · Posição |  |
| `calc2Posicao` ★ | — | Dados | Fórmula 2 · Posição |  |
| `calc3Posicao` ★ | — | Dados | Fórmula 3 · Posição |  |
| `calc4Posicao` ★ | — | Dados | Fórmula 4 · Posição |  |
| `calc5Posicao` ★ | — | Dados | Fórmula 5 · Posição |  |
| `calc6Posicao` ★ | — | Dados | Fórmula 6 · Posição |  |
| `calc7Posicao` ★ | — | Dados | Fórmula 7 · Posição |  |
| `calc8Posicao` ★ | — | Dados | Fórmula 8 · Posição |  |
| `calc1Pivo` ★ | — | Dados | Fórmula 1 · Modo do pivô |  |
| `calc2Pivo` ★ | — | Dados | Fórmula 2 · Modo do pivô |  |
| `calc3Pivo` ★ | — | Dados | Fórmula 3 · Modo do pivô |  |
| `calc4Pivo` ★ | — | Dados | Fórmula 4 · Modo do pivô |  |
| `calc5Pivo` ★ | — | Dados | Fórmula 5 · Modo do pivô |  |
| `calc6Pivo` ★ | — | Dados | Fórmula 6 · Modo do pivô |  |
| `calc7Pivo` ★ | — | Dados | Fórmula 7 · Modo do pivô |  |
| `calc8Pivo` ★ | — | Dados | Fórmula 8 · Modo do pivô |  |
| `calc1Total` ★ | — | Dados | Fórmula 1 · Linha de totais |  |
| `calc2Total` ★ | — | Dados | Fórmula 2 · Linha de totais |  |
| `calc3Total` ★ | — | Dados | Fórmula 3 · Linha de totais |  |
| `calc4Total` ★ | — | Dados | Fórmula 4 · Linha de totais |  |
| `calc5Total` ★ | — | Dados | Fórmula 5 · Linha de totais |  |
| `calc6Total` ★ | — | Dados | Fórmula 6 · Linha de totais |  |
| `calc7Total` ★ | — | Dados | Fórmula 7 · Linha de totais |  |
| `calc8Total` ★ | — | Dados | Fórmula 8 · Linha de totais |  |
| `calc1Cor` ★ | — | Dados | Fórmula 1 · Cor (uso colorir) |  |
| `calc2Cor` ★ | — | Dados | Fórmula 2 · Cor (uso colorir) |  |
| `calc3Cor` ★ | — | Dados | Fórmula 3 · Cor (uso colorir) |  |
| `calc4Cor` ★ | — | Dados | Fórmula 4 · Cor (uso colorir) |  |
| `calc5Cor` ★ | — | Dados | Fórmula 5 · Cor (uso colorir) |  |
| `calc6Cor` ★ | — | Dados | Fórmula 6 · Cor (uso colorir) |  |
| `calc7Cor` ★ | — | Dados | Fórmula 7 · Cor (uso colorir) |  |
| `calc8Cor` ★ | — | Dados | Fórmula 8 · Cor (uso colorir) |  |
| `calc1Alvo` ★ | — | Dados | Fórmula 1 · Aplicar na coluna |  |
| `calc2Alvo` ★ | — | Dados | Fórmula 2 · Aplicar na coluna |  |
| `calc3Alvo` ★ | — | Dados | Fórmula 3 · Aplicar na coluna |  |
| `calc4Alvo` ★ | — | Dados | Fórmula 4 · Aplicar na coluna |  |
| `calc5Alvo` ★ | — | Dados | Fórmula 5 · Aplicar na coluna |  |
| `calc6Alvo` ★ | — | Dados | Fórmula 6 · Aplicar na coluna |  |
| `calc7Alvo` ★ | — | Dados | Fórmula 7 · Aplicar na coluna |  |
| `calc8Alvo` ★ | — | Dados | Fórmula 8 · Aplicar na coluna |  |
| `mapaDeIconesPorValor` ★ | — | Estilo | Mapa (valor=ícone; …) |  |
| `iconePadraoPorValor` ★ | — | Estilo | Ícone padrão |  |
| `coresPorValor` ★ | — | Estilo | Cores (valor=#cor; …) |  |
| `layoutDaTabela` ★ | — | Estilo | Layout |  |
| `camposDoCartao` ★ | — | Estilo | Campos do cartão/lista (vazio = todos) |  |
| `colunasDosCartoes` ★ | — | Estilo | Cartões por linha (0 = auto) |  |
| `colunasDeCamposDoCartao` ★ | — | Estilo | Colunas de campos no cartão |  |
| `secoesDoLayout` ★ | — | Estilo | Seções (Título: col1, col2; …) |  |
| `densidade` | Visual | Estilo | Densidade |  |
| `alturaDaLinha` | Visual | Estilo | Altura da linha (px) — 0 usa a densidade |  |
| `alturaDoCabecalho` | Visual | Estilo | Altura do cabeçalho | Altura do cabeçalho (px) — 0 usa a densidade |
| `larguraPadraoDaColuna` | Visual | Estilo | Largura padrão das colunas (px) |  |
| `larguraDasDimensoes` | Visual | Estilo | Largura das colunas de dimensão (px) |  |
| `colunasFixasAEsquerda` | Visual | Estilo | Quantas colunas ficam fixas à esquerda |  |
| `cabecalhoFixo` | Visual | Estilo | Cabeçalho fixo ao rolar |  |
| `rodapeFixo` | Visual | Estilo | Totais fixos no rodapé |  |
| `quebrarTexto` | Visual | Estilo | Texto que não cabe |  |
| `cabecalhoVertical` | Visual | Estilo | Cabeçalho na vertical | Cabeçalho com texto na vertical |
| `mostrarNumeroDaLinha` | Visual | Estilo | Mostrar número da linha |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `estiloDaTabela` | Visual | Estilo | Tema · Estilo |  |
| `corDoCabecalho` | Visual | Estilo | Tema · Fundo do cabeçalho |  |
| `corDoTextoDoCabecalho` | Visual | Estilo | Tema · Texto do cabeçalho |  |
| `corDaZebra` | Visual | Estilo | Tema · Cor das linhas alternadas |  |
| `corDoHover` | Visual | Estilo | Tema · Cor ao passar o mouse |  |
| `corDaSelecao` | Visual | Estilo | Tema · Cor da linha selecionada |  |
| `mostrarBordasVerticais` | Visual | Estilo | Tema · Bordas verticais |  |
| `mostrarBordasHorizontais` | Visual | Estilo | Tema · Bordas horizontais |  |
| `raioDaBorda` | Visual | Estilo | Tema · Arredondamento (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `estiloDoIcone` ★ | — | Estilo | Tema · Estilo do ícone |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `permitirOrdenar` | Interação | Mais | Clique · Ordenar no cabeçalho | Clique · Ordenar clicando no cabeçalho |
| `mostrarBusca` | Interação | Mais | Clique · Campo de busca | Clique · Mostrar caixa de busca |
| `mostrarFiltrosPorColuna` | Interação | Mais | Clique · Filtro por coluna | Clique · Mostrar filtro em cada coluna |
| `permitirSelecionarLinhas` | Interação | Mais | Clique · Selecionar e somar | Clique · Selecionar linhas (clique) e somar |
| `destacarLinhaEColuna` | Interação | Mais | Clique · Realçar linha/coluna | Clique · Destacar linha e coluna sob o mouse |
| `permitirRedimensionarColunas` | Interação | Mais | Clique · Redimensionar colunas | Clique · Redimensionar colunas arrastando |
| `permitirDrill` | Interação | Mais | Clique · Drill na célula | Clique · Drill ao clicar na célula |
| `permitirExportarCsv` | Interação | Mais | Clique · Botão de exportar CSV |  |
| `permitirCopiar` | Interação | Mais | Clique · Permitir copiar | Clique · Permitir copiar (Ctrl+C / menu) |
| `linhasPorPagina` | Interação | Mais | Clique · Linhas por página | Clique · Linhas por página (0 = rolagem contínua) |
| `animarEntradaDasLinhas` | Interação | Mais | Animação · Entrada das linhas | Animação · Animar entrada das linhas |
| `animarMudancaDeValor` | Interação | Mais | Animação · Piscar ao mudar | Animação · Piscar quando o valor mudar entre atualizações |
| `corDeSubida` | Interação | Mais | Animação · Cor quando o valor sobe |  |
| `corDeDescida` | Interação | Mais | Animação · Cor quando o valor desce |  |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `modoDaBusca` ★ | — | Mais | Busca · Várias palavras |  |
| `colunasDaBusca` ★ | — | Mais | Busca · Colunas (vazio = visíveis) |  |
| `buscarEm` ★ | — | Mais | Busca · Procurar no |  |
| `realcarBusca` ★ | — | Mais | Busca · Realçar o trecho |  |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `col_dim_loja_visivel` | Visual | Estilo | Coluna Loja · Mostrar | Coluna Loja · Mostrar esta coluna |
| `col_dim_loja_rotulo` | Visual | Estilo | Coluna Loja · Renomear | Coluna Loja · Renomear para |
| `col_dim_loja_largura` | Visual | Estilo | Coluna Loja · Largura (px) | Coluna Loja · Largura (px, 0 = padrão) |
| `col_dim_loja_alinhamento` | Visual | Estilo | Coluna Loja · Alinhamento |  |
| `col_dim_loja_tipoDeCelula` | Visual | Estilo | Coluna Loja · Tipo de célula |  |
| `col_dim_loja_corDoTexto` | Visual | Estilo | Coluna Loja · Cor do texto |  |
| `col_dim_loja_corDeFundo` | Visual | Estilo | Coluna Loja · Cor de fundo |  |
| `col_dim_loja_prefixo` | Visual | Estilo | Coluna Loja · Prefixo |  |
| `col_dim_loja_sufixo` | Visual | Estilo | Coluna Loja · Sufixo |  |
| `col_dim_loja_regra1` | Visual | Estilo | Coluna Loja · R1: condição | Coluna Loja · Regra 1: condição |
| `col_dim_loja_regra1Valor` | Visual | Estilo | Coluna Loja · R1: valor | Coluna Loja · Regra 1: valor |
| `col_dim_loja_regra1Valor2` | Visual | Estilo | Coluna Loja · R1: valor 2 | Coluna Loja · Regra 1: valor 2 (para "entre") |
| `col_dim_loja_regra1Acao` | Visual | Estilo | Coluna Loja · R1: ação | Coluna Loja · Regra 1: o que fazer |
| `col_dim_loja_regra1Cor` | Visual | Estilo | Coluna Loja · R1: cor | Coluna Loja · Regra 1: cor |
| `col_dim_loja_regra1Icone` | Visual | Estilo | Coluna Loja · R1: ícone | Coluna Loja · Regra 1: ícone |
| `col_dim_loja_regra1LinhaInteira` | Visual | Estilo | Coluna Loja · R1: linha toda | Coluna Loja · Regra 1: aplicar na linha inteira |
| `col_dim_loja_regra1Coluna` | Visual | Estilo | Coluna Loja · R1: comparar com | Coluna Loja · Regra 1: comparar com a coluna |
| `col_dim_loja_regra2` | Visual | Estilo | Coluna Loja · R2: condição | Coluna Loja · Regra 2: condição |
| `col_dim_loja_regra2Valor` | Visual | Estilo | Coluna Loja · R2: valor | Coluna Loja · Regra 2: valor |
| `col_dim_loja_regra2Valor2` | Visual | Estilo | Coluna Loja · R2: valor 2 | Coluna Loja · Regra 2: valor 2 (para "entre") |
| `col_dim_loja_regra2Acao` | Visual | Estilo | Coluna Loja · R2: ação | Coluna Loja · Regra 2: o que fazer |
| `col_dim_loja_regra2Cor` | Visual | Estilo | Coluna Loja · R2: cor | Coluna Loja · Regra 2: cor |
| `col_dim_loja_regra2Icone` | Visual | Estilo | Coluna Loja · R2: ícone | Coluna Loja · Regra 2: ícone |
| `col_dim_loja_regra2LinhaInteira` | Visual | Estilo | Coluna Loja · R2: linha toda | Coluna Loja · Regra 2: aplicar na linha inteira |
| `col_dim_loja_regra2Coluna` | Visual | Estilo | Coluna Loja · R2: comparar com | Coluna Loja · Regra 2: comparar com a coluna |
| `col_dim_loja_regra3` | Visual | Estilo | Coluna Loja · R3: condição | Coluna Loja · Regra 3: condição |
| `col_dim_loja_regra3Valor` | Visual | Estilo | Coluna Loja · R3: valor | Coluna Loja · Regra 3: valor |
| `col_dim_loja_regra3Valor2` | Visual | Estilo | Coluna Loja · R3: valor 2 | Coluna Loja · Regra 3: valor 2 (para "entre") |
| `col_dim_loja_regra3Acao` | Visual | Estilo | Coluna Loja · R3: ação | Coluna Loja · Regra 3: o que fazer |
| `col_dim_loja_regra3Cor` | Visual | Estilo | Coluna Loja · R3: cor | Coluna Loja · Regra 3: cor |
| `col_dim_loja_regra3Icone` | Visual | Estilo | Coluna Loja · R3: ícone | Coluna Loja · Regra 3: ícone |
| `col_dim_loja_regra3LinhaInteira` | Visual | Estilo | Coluna Loja · R3: linha toda | Coluna Loja · Regra 3: aplicar na linha inteira |
| `col_dim_loja_regra3Coluna` | Visual | Estilo | Coluna Loja · R3: comparar com | Coluna Loja · Regra 3: comparar com a coluna |
| `col_med_vendas_visivel` | Visual | Estilo | Coluna Vendas · Mostrar | Coluna Vendas · Mostrar esta coluna |
| `col_med_vendas_rotulo` | Visual | Estilo | Coluna Vendas · Renomear | Coluna Vendas · Renomear para |
| `col_med_vendas_largura` | Visual | Estilo | Coluna Vendas · Largura (px) | Coluna Vendas · Largura (px, 0 = padrão) |
| `col_med_vendas_alinhamento` | Visual | Estilo | Coluna Vendas · Alinhamento |  |
| `col_med_vendas_tipoDeCelula` | Visual | Estilo | Coluna Vendas · Tipo de célula |  |
| `col_med_vendas_corDoTexto` | Visual | Estilo | Coluna Vendas · Cor do texto |  |
| `col_med_vendas_corDeFundo` | Visual | Estilo | Coluna Vendas · Cor de fundo |  |
| `col_med_vendas_prefixo` | Visual | Estilo | Coluna Vendas · Prefixo |  |
| `col_med_vendas_sufixo` | Visual | Estilo | Coluna Vendas · Sufixo |  |
| `col_med_vendas_formato` | Visual | Estilo | Coluna Vendas · Formato | Coluna Vendas · Formato do número |
| `col_med_vendas_casasDecimais` | Visual | Estilo | Coluna Vendas · Casas decimais |  |
| `col_med_vendas_corDaBarra` | Visual | Estilo | Coluna Vendas · Cor da barra | Coluna Vendas · Cor da barra/sparkline |
| `col_med_vendas_regra1` | Visual | Estilo | Coluna Vendas · R1: condição | Coluna Vendas · Regra 1: condição |
| `col_med_vendas_regra1Valor` | Visual | Estilo | Coluna Vendas · R1: valor | Coluna Vendas · Regra 1: valor |
| `col_med_vendas_regra1Valor2` | Visual | Estilo | Coluna Vendas · R1: valor 2 | Coluna Vendas · Regra 1: valor 2 (para "entre") |
| `col_med_vendas_regra1Acao` | Visual | Estilo | Coluna Vendas · R1: ação | Coluna Vendas · Regra 1: o que fazer |
| `col_med_vendas_regra1Cor` | Visual | Estilo | Coluna Vendas · R1: cor | Coluna Vendas · Regra 1: cor |
| `col_med_vendas_regra1Icone` | Visual | Estilo | Coluna Vendas · R1: ícone | Coluna Vendas · Regra 1: ícone |
| `col_med_vendas_regra1LinhaInteira` | Visual | Estilo | Coluna Vendas · R1: linha toda | Coluna Vendas · Regra 1: aplicar na linha inteira |
| `col_med_vendas_regra1Coluna` | Visual | Estilo | Coluna Vendas · R1: comparar com | Coluna Vendas · Regra 1: comparar com a coluna |
| `col_med_vendas_regra2` | Visual | Estilo | Coluna Vendas · R2: condição | Coluna Vendas · Regra 2: condição |
| `col_med_vendas_regra2Valor` | Visual | Estilo | Coluna Vendas · R2: valor | Coluna Vendas · Regra 2: valor |
| `col_med_vendas_regra2Valor2` | Visual | Estilo | Coluna Vendas · R2: valor 2 | Coluna Vendas · Regra 2: valor 2 (para "entre") |
| `col_med_vendas_regra2Acao` | Visual | Estilo | Coluna Vendas · R2: ação | Coluna Vendas · Regra 2: o que fazer |
| `col_med_vendas_regra2Cor` | Visual | Estilo | Coluna Vendas · R2: cor | Coluna Vendas · Regra 2: cor |
| `col_med_vendas_regra2Icone` | Visual | Estilo | Coluna Vendas · R2: ícone | Coluna Vendas · Regra 2: ícone |
| `col_med_vendas_regra2LinhaInteira` | Visual | Estilo | Coluna Vendas · R2: linha toda | Coluna Vendas · Regra 2: aplicar na linha inteira |
| `col_med_vendas_regra2Coluna` | Visual | Estilo | Coluna Vendas · R2: comparar com | Coluna Vendas · Regra 2: comparar com a coluna |
| `col_med_vendas_regra3` | Visual | Estilo | Coluna Vendas · R3: condição | Coluna Vendas · Regra 3: condição |
| `col_med_vendas_regra3Valor` | Visual | Estilo | Coluna Vendas · R3: valor | Coluna Vendas · Regra 3: valor |
| `col_med_vendas_regra3Valor2` | Visual | Estilo | Coluna Vendas · R3: valor 2 | Coluna Vendas · Regra 3: valor 2 (para "entre") |
| `col_med_vendas_regra3Acao` | Visual | Estilo | Coluna Vendas · R3: ação | Coluna Vendas · Regra 3: o que fazer |
| `col_med_vendas_regra3Cor` | Visual | Estilo | Coluna Vendas · R3: cor | Coluna Vendas · Regra 3: cor |
| `col_med_vendas_regra3Icone` | Visual | Estilo | Coluna Vendas · R3: ícone | Coluna Vendas · Regra 3: ícone |
| `col_med_vendas_regra3LinhaInteira` | Visual | Estilo | Coluna Vendas · R3: linha toda | Coluna Vendas · Regra 3: aplicar na linha inteira |
| `col_med_vendas_regra3Coluna` | Visual | Estilo | Coluna Vendas · R3: comparar com | Coluna Vendas · Regra 3: comparar com a coluna |
| `col_med_vendas_escalaDeCor` | Visual | Estilo | Coluna Vendas · Escala de cor | Coluna Vendas · Escala de cor (mapa de calor) nesta coluna |
| `col_med_vendas_escalaCorMin` | Visual | Estilo | Coluna Vendas · Cor do menor | Coluna Vendas · Escala: cor do menor valor |
| `col_med_vendas_escalaCorMax` | Visual | Estilo | Coluna Vendas · Cor do maior | Coluna Vendas · Escala: cor do maior valor |
| `col_med_pedidos_visivel` | Visual | Estilo | Coluna Pedidos · Mostrar | Coluna Pedidos · Mostrar esta coluna |
| `col_med_pedidos_rotulo` | Visual | Estilo | Coluna Pedidos · Renomear | Coluna Pedidos · Renomear para |
| `col_med_pedidos_largura` | Visual | Estilo | Coluna Pedidos · Largura (px) | Coluna Pedidos · Largura (px, 0 = padrão) |
| `col_med_pedidos_alinhamento` | Visual | Estilo | Coluna Pedidos · Alinhamento |  |
| `col_med_pedidos_tipoDeCelula` | Visual | Estilo | Coluna Pedidos · Tipo de célula |  |
| `col_med_pedidos_corDoTexto` | Visual | Estilo | Coluna Pedidos · Cor do texto |  |
| `col_med_pedidos_corDeFundo` | Visual | Estilo | Coluna Pedidos · Cor de fundo |  |
| `col_med_pedidos_prefixo` | Visual | Estilo | Coluna Pedidos · Prefixo |  |
| `col_med_pedidos_sufixo` | Visual | Estilo | Coluna Pedidos · Sufixo |  |
| `col_med_pedidos_formato` | Visual | Estilo | Coluna Pedidos · Formato | Coluna Pedidos · Formato do número |
| `col_med_pedidos_casasDecimais` | Visual | Estilo | Coluna Pedidos · Casas decimais |  |
| `col_med_pedidos_corDaBarra` | Visual | Estilo | Coluna Pedidos · Cor da barra | Coluna Pedidos · Cor da barra/sparkline |
| `col_med_pedidos_regra1` | Visual | Estilo | Coluna Pedidos · R1: condição | Coluna Pedidos · Regra 1: condição |
| `col_med_pedidos_regra1Valor` | Visual | Estilo | Coluna Pedidos · R1: valor | Coluna Pedidos · Regra 1: valor |
| `col_med_pedidos_regra1Valor2` | Visual | Estilo | Coluna Pedidos · R1: valor 2 | Coluna Pedidos · Regra 1: valor 2 (para "entre") |
| `col_med_pedidos_regra1Acao` | Visual | Estilo | Coluna Pedidos · R1: ação | Coluna Pedidos · Regra 1: o que fazer |
| `col_med_pedidos_regra1Cor` | Visual | Estilo | Coluna Pedidos · R1: cor | Coluna Pedidos · Regra 1: cor |
| `col_med_pedidos_regra1Icone` | Visual | Estilo | Coluna Pedidos · R1: ícone | Coluna Pedidos · Regra 1: ícone |
| `col_med_pedidos_regra1LinhaInteira` | Visual | Estilo | Col. Pedidos · R1: linha toda | Coluna Pedidos · Regra 1: aplicar na linha inteira |
| `col_med_pedidos_regra1Coluna` | Visual | Estilo | Coluna Pedidos · R1: comparar com | Coluna Pedidos · Regra 1: comparar com a coluna |
| `col_med_pedidos_regra2` | Visual | Estilo | Coluna Pedidos · R2: condição | Coluna Pedidos · Regra 2: condição |
| `col_med_pedidos_regra2Valor` | Visual | Estilo | Coluna Pedidos · R2: valor | Coluna Pedidos · Regra 2: valor |
| `col_med_pedidos_regra2Valor2` | Visual | Estilo | Coluna Pedidos · R2: valor 2 | Coluna Pedidos · Regra 2: valor 2 (para "entre") |
| `col_med_pedidos_regra2Acao` | Visual | Estilo | Coluna Pedidos · R2: ação | Coluna Pedidos · Regra 2: o que fazer |
| `col_med_pedidos_regra2Cor` | Visual | Estilo | Coluna Pedidos · R2: cor | Coluna Pedidos · Regra 2: cor |
| `col_med_pedidos_regra2Icone` | Visual | Estilo | Coluna Pedidos · R2: ícone | Coluna Pedidos · Regra 2: ícone |
| `col_med_pedidos_regra2LinhaInteira` | Visual | Estilo | Col. Pedidos · R2: linha toda | Coluna Pedidos · Regra 2: aplicar na linha inteira |
| `col_med_pedidos_regra2Coluna` | Visual | Estilo | Coluna Pedidos · R2: comparar com | Coluna Pedidos · Regra 2: comparar com a coluna |
| `col_med_pedidos_regra3` | Visual | Estilo | Coluna Pedidos · R3: condição | Coluna Pedidos · Regra 3: condição |
| `col_med_pedidos_regra3Valor` | Visual | Estilo | Coluna Pedidos · R3: valor | Coluna Pedidos · Regra 3: valor |
| `col_med_pedidos_regra3Valor2` | Visual | Estilo | Coluna Pedidos · R3: valor 2 | Coluna Pedidos · Regra 3: valor 2 (para "entre") |
| `col_med_pedidos_regra3Acao` | Visual | Estilo | Coluna Pedidos · R3: ação | Coluna Pedidos · Regra 3: o que fazer |
| `col_med_pedidos_regra3Cor` | Visual | Estilo | Coluna Pedidos · R3: cor | Coluna Pedidos · Regra 3: cor |
| `col_med_pedidos_regra3Icone` | Visual | Estilo | Coluna Pedidos · R3: ícone | Coluna Pedidos · Regra 3: ícone |
| `col_med_pedidos_regra3LinhaInteira` | Visual | Estilo | Col. Pedidos · R3: linha toda | Coluna Pedidos · Regra 3: aplicar na linha inteira |
| `col_med_pedidos_regra3Coluna` | Visual | Estilo | Coluna Pedidos · R3: comparar com | Coluna Pedidos · Regra 3: comparar com a coluna |
| `col_med_pedidos_escalaDeCor` | Visual | Estilo | Coluna Pedidos · Escala de cor | Coluna Pedidos · Escala de cor (mapa de calor) nesta coluna |
| `col_med_pedidos_escalaCorMin` | Visual | Estilo | Coluna Pedidos · Cor do menor | Coluna Pedidos · Escala: cor do menor valor |
| `col_med_pedidos_escalaCorMax` | Visual | Estilo | Coluna Pedidos · Cor do maior | Coluna Pedidos · Escala: cor do maior valor |

</details>

## Diagrama de Venn (`diagrama_venn`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `formatoDosDados` | Dados | Dados | Como os dados estão organizados |  |
| `separadorDeConjuntos` | Dados | Dados | Separador dos conjuntos na dimensão |  |
| `medirPor` | Dados | Dados | O número mostrado é |  |
| `maximoDeConjuntos` | Dados | Dados | Máximo de conjuntos (2 a 5) |  |
| `layoutDoVenn` ★ | — | Estilo | Layout |  |
| `margemDoVenn` ★ | — | Estilo | Margem (px) |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `modoDeCor` | Visual | Estilo | Cor · Como colorir |  |
| `corUnica` | Visual | Estilo | Cor · Cor única |  |
| `escalaDeCor` | Visual | Estilo | Cor · Escala contínua (cor por valor) |  |
| `escalaDeCorPersonalizada` | Visual | Estilo | Cor · Escala própria | Cor · Usar cores próprias na escala |
| `corMinima` | Visual | Estilo | Cor · Cor do mínimo |  |
| `corMedia` | Visual | Estilo | Cor · Cor do meio | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Visual | Estilo | Cor · Cor do máximo |  |
| `limiteDeCorAutomatico` | Visual | Estilo | Cor · Limites automáticos | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Visual | Estilo | Cor · Mínimo da escala (manual) |  |
| `limiteDeCorMaximo` | Visual | Estilo | Cor · Máximo da escala (manual) |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `opacidadeDoPreenchimento` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `mostrarPercentual` | Texto | Texto | Rótulo · Mostrar percentual | Rótulo · Mostrar o percentual junto do número |
| `mostrarTotalDoConjunto` | Texto | Texto | Rótulo · Total do conjunto | Rótulo · Mostrar o total de cada conjunto no nome |
| `listarRegioesPequenas` | Texto | Texto | Rótulo · Listar as pequenas | Rótulo · Listar num canto as regiões pequenas demais para o número caber |
| `tamanhoDoTextoDoVenn` ★ | — | Texto | Rótulo · Tamanho dos textos |  |
| `nomesDosConjuntos` ★ | — | Texto | Rótulo · Nomes dos conjuntos |  |
| `removerDoNome` ★ | — | Texto | Rótulo · Remover do fim do nome |  |
| `apelidosDosConjuntos` ★ | — | Texto | Rótulo · Apelidos (Nome=Apelido; …) |  |
| `mostrarLegenda` | Texto | Texto | Legenda · Mostrar legenda |  |
| `posicaoDaLegenda` | Texto | Texto | Legenda · Posição da legenda |  |
| `legendaInterativa` | Texto | Texto | Legenda · Clique liga/desliga | Legenda · Clicar na legenda liga/desliga a série |
| `mostrarValoresNaLegenda` | Texto | Texto | Legenda · Mostrar valores | Legenda · Mostrar valores na legenda |
| `tamanhoDaLegenda` | Texto | Texto | Legenda · Tamanho do texto da legenda | Legenda · Tamanho do texto da legenda (px) |
| `legendaDoVenn` ★ | — | Texto | Legenda · Legenda do Venn |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `contadorAnimado` | Interação | Mais | Animação · Números contando | Animação · Números sobem/descem até o valor (contador) |
| `duracaoDaTransicaoDoVenn` ★ | — | Mais | Animação · Duração do destaque (ms) |  |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `cor_A` | Visual | Estilo | Cor · Cor — A |  |
| `cor_B` | Visual | Estilo | Cor · Cor — B |  |

</details>

## Dispersão com Quadrantes (`quadrant_scatter`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `divisoriaX` | Dados | Dados | Quadrantes · Linha divisória vertical | Quadrantes · Linha divisória vertical (eixo X) |
| `valorDaDivisoriaX` | Dados | Dados | Quadrantes · Valor fixo da divisória X |  |
| `divisoriaY` | Dados | Dados | Quadrantes · Linha divisória horizontal | Quadrantes · Linha divisória horizontal (eixo Y) |
| `valorDaDivisoriaY` | Dados | Dados | Quadrantes · Valor fixo da divisória Y |  |
| `colorirPor` | Dados | Dados | Pontos · Cor dos pontos |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `modoDeCor` | Visual | Estilo | Cor · Como colorir |  |
| `corUnica` | Visual | Estilo | Cor · Cor única |  |
| `escalaDeCor` | Visual | Estilo | Cor · Escala contínua (cor por valor) |  |
| `escalaDeCorPersonalizada` | Visual | Estilo | Cor · Escala própria | Cor · Usar cores próprias na escala |
| `corMinima` | Visual | Estilo | Cor · Cor do mínimo |  |
| `corMedia` | Visual | Estilo | Cor · Cor do meio | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Visual | Estilo | Cor · Cor do máximo |  |
| `limiteDeCorAutomatico` | Visual | Estilo | Cor · Limites automáticos | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Visual | Estilo | Cor · Mínimo da escala (manual) |  |
| `limiteDeCorMaximo` | Visual | Estilo | Cor · Máximo da escala (manual) |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `tamanhoDoPonto` | Visual | Estilo | Pontos · Tamanho do ponto |  |
| `tamanhoMaximoDoPonto` | Visual | Estilo | Pontos · Tamanho máximo | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Visual | Estilo | Pontos · Forma |  |
| `opacidadeDoPonto` | Visual | Estilo | Pontos · Opacidade |  |
| `corDasDivisorias` | Visual | Estilo | Quadrantes · Cor das divisórias |  |
| `contornoDoPonto` | Visual | Estilo | Pontos · Contorno no ponto |  |
| `pintarQuadrantes` | Visual | Estilo | Quadrantes · Pintar o fundo | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Visual | Estilo | Quadrantes · Cor: "Alto / Alto" | Quadrantes · Cor do quadrante "Alto / Alto" |
| `cor_inferiorDireito` | Visual | Estilo | Quadrantes · Cor: "Alto / Baixo" | Quadrantes · Cor do quadrante "Alto / Baixo" |
| `cor_inferiorEsquerdo` | Visual | Estilo | Quadrantes · Cor: "Baixo / Baixo" | Quadrantes · Cor do quadrante "Baixo / Baixo" |
| `cor_superiorEsquerdo` | Visual | Estilo | Quadrantes · Cor: "Baixo / Alto" | Quadrantes · Cor do quadrante "Baixo / Alto" |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarEixoX` | Texto | Texto | Eixo X · Mostrar eixo X | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Texto | Texto | Eixo X · Título do eixo X |  |
| `escalaEixoX` | Texto | Texto | Eixo X · Escala do eixo X |  |
| `minimoEixoX` | Texto | Texto | Eixo X · Mínimo do eixo X | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Texto | Texto | Eixo X · Máximo do eixo X | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Texto | Texto | Eixo X · Inverter eixo X |  |
| `gradeEixoX` | Texto | Texto | Eixo X · Linhas de grade | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Texto | Texto | Eixo X · Rotação dos rótulos do eixo X | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Texto | Texto | Eixo Y · Mostrar eixo Y | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Texto | Texto | Eixo Y · Título do eixo Y |  |
| `escalaEixoY` | Texto | Texto | Eixo Y · Escala do eixo Y |  |
| `minimoEixoY` | Texto | Texto | Eixo Y · Mínimo do eixo Y | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Texto | Texto | Eixo Y · Máximo do eixo Y | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Texto | Texto | Eixo Y · Inverter eixo Y |  |
| `gradeEixoY` | Texto | Texto | Eixo Y · Linhas de grade | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Texto | Texto | Eixo Y · Rotação dos rótulos do eixo Y | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Texto | Texto | Eixo · Formato dos números nos eixos |  |
| `casasDecimaisDoEixo` | Texto | Texto | Eixo · Casas decimais nos eixos |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `quantosRotulosDePonto` | Texto | Texto | Rótulo · Quantos pontos recebem rótulo | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarContagemPorQuadrante` | Texto | Texto | Pontos por quadrante | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Texto | Texto | Quadrantes · Nome: "Alto / Alto" | Quadrantes · Nome do quadrante "Alto / Alto" |
| `rotulo_inferiorDireito` | Texto | Texto | Quadrantes · Nome: "Alto / Baixo" | Quadrantes · Nome do quadrante "Alto / Baixo" |
| `rotulo_inferiorEsquerdo` | Texto | Texto | Quadrantes · Nome: "Baixo / Baixo" | Quadrantes · Nome do quadrante "Baixo / Baixo" |
| `rotulo_superiorEsquerdo` | Texto | Texto | Quadrantes · Nome: "Baixo / Alto" | Quadrantes · Nome do quadrante "Baixo / Alto" |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoX` | Dados | Dados | Medida do eixo X |  |
| `campoDoY` | Dados | Dados | Medida do eixo Y |  |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |  |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |  |

</details>

## Matriz 2x2 (`matriz_2x2`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `divisoriaX` | Dados | Dados | Quadrantes · Linha divisória vertical | Quadrantes · Linha divisória vertical (eixo X) |
| `valorDaDivisoriaX` | Dados | Dados | Quadrantes · Valor fixo da divisória X |  |
| `divisoriaY` | Dados | Dados | Quadrantes · Linha divisória horizontal | Quadrantes · Linha divisória horizontal (eixo Y) |
| `valorDaDivisoriaY` | Dados | Dados | Quadrantes · Valor fixo da divisória Y |  |
| `colorirPor` | Dados | Dados | Pontos · Cor dos pontos |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `modoDeCor` | Visual | Estilo | Cor · Como colorir |  |
| `corUnica` | Visual | Estilo | Cor · Cor única |  |
| `escalaDeCor` | Visual | Estilo | Cor · Escala contínua (cor por valor) |  |
| `escalaDeCorPersonalizada` | Visual | Estilo | Cor · Escala própria | Cor · Usar cores próprias na escala |
| `corMinima` | Visual | Estilo | Cor · Cor do mínimo |  |
| `corMedia` | Visual | Estilo | Cor · Cor do meio | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Visual | Estilo | Cor · Cor do máximo |  |
| `limiteDeCorAutomatico` | Visual | Estilo | Cor · Limites automáticos | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Visual | Estilo | Cor · Mínimo da escala (manual) |  |
| `limiteDeCorMaximo` | Visual | Estilo | Cor · Máximo da escala (manual) |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `tamanhoDoPonto` | Visual | Estilo | Pontos · Tamanho do ponto |  |
| `tamanhoMaximoDoPonto` | Visual | Estilo | Pontos · Tamanho máximo | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Visual | Estilo | Pontos · Forma |  |
| `opacidadeDoPonto` | Visual | Estilo | Pontos · Opacidade |  |
| `corDasDivisorias` | Visual | Estilo | Quadrantes · Cor das divisórias |  |
| `contornoDoPonto` | Visual | Estilo | Pontos · Contorno no ponto |  |
| `pintarQuadrantes` | Visual | Estilo | Quadrantes · Pintar o fundo | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Visual | Estilo | Quadrantes · Cor: "Prioridade" | Quadrantes · Cor do quadrante "Prioridade" |
| `cor_inferiorDireito` | Visual | Estilo | Quadrantes · Cor do quadrante "Rever" |  |
| `cor_inferiorEsquerdo` | Visual | Estilo | Quadrantes · Cor: "Descartar" | Quadrantes · Cor do quadrante "Descartar" |
| `cor_superiorEsquerdo` | Visual | Estilo | Quadrantes · Cor: "Oportunidade" | Quadrantes · Cor do quadrante "Oportunidade" |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarEixoX` | Texto | Texto | Eixo X · Mostrar eixo X | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Texto | Texto | Eixo X · Título do eixo X |  |
| `escalaEixoX` | Texto | Texto | Eixo X · Escala do eixo X |  |
| `minimoEixoX` | Texto | Texto | Eixo X · Mínimo do eixo X | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Texto | Texto | Eixo X · Máximo do eixo X | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Texto | Texto | Eixo X · Inverter eixo X |  |
| `gradeEixoX` | Texto | Texto | Eixo X · Linhas de grade | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Texto | Texto | Eixo X · Rotação dos rótulos do eixo X | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Texto | Texto | Eixo Y · Mostrar eixo Y | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Texto | Texto | Eixo Y · Título do eixo Y |  |
| `escalaEixoY` | Texto | Texto | Eixo Y · Escala do eixo Y |  |
| `minimoEixoY` | Texto | Texto | Eixo Y · Mínimo do eixo Y | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Texto | Texto | Eixo Y · Máximo do eixo Y | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Texto | Texto | Eixo Y · Inverter eixo Y |  |
| `gradeEixoY` | Texto | Texto | Eixo Y · Linhas de grade | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Texto | Texto | Eixo Y · Rotação dos rótulos do eixo Y | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Texto | Texto | Eixo · Formato dos números nos eixos |  |
| `casasDecimaisDoEixo` | Texto | Texto | Eixo · Casas decimais nos eixos |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `quantosRotulosDePonto` | Texto | Texto | Rótulo · Quantos pontos recebem rótulo | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarContagemPorQuadrante` | Texto | Texto | Pontos por quadrante | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Texto | Texto | Quadrantes · Nome: "Prioridade" | Quadrantes · Nome do quadrante "Prioridade" |
| `rotulo_inferiorDireito` | Texto | Texto | Quadrantes · Nome do quadrante "Rever" |  |
| `rotulo_inferiorEsquerdo` | Texto | Texto | Quadrantes · Nome: "Descartar" | Quadrantes · Nome do quadrante "Descartar" |
| `rotulo_superiorEsquerdo` | Texto | Texto | Quadrantes · Nome: "Oportunidade" | Quadrantes · Nome do quadrante "Oportunidade" |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoX` | Dados | Dados | Medida do eixo X |  |
| `campoDoY` | Dados | Dados | Medida do eixo Y |  |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |  |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |  |

</details>

## Matriz BCG (`matriz_bcg`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `normalizarParticipacao` | Dados | Dados | X como participação | Converter a medida X em participação relativa (valor ÷ maior concorrente) |
| `divisoriaX` | Dados | Dados | Quadrantes · Linha divisória vertical | Quadrantes · Linha divisória vertical (eixo X) |
| `valorDaDivisoriaX` | Dados | Dados | Quadrantes · Valor fixo da divisória X |  |
| `divisoriaY` | Dados | Dados | Quadrantes · Linha divisória horizontal | Quadrantes · Linha divisória horizontal (eixo Y) |
| `valorDaDivisoriaY` | Dados | Dados | Quadrantes · Valor fixo da divisória Y |  |
| `colorirPor` | Dados | Dados | Pontos · Cor dos pontos |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `modoDeCor` | Visual | Estilo | Cor · Como colorir |  |
| `corUnica` | Visual | Estilo | Cor · Cor única |  |
| `escalaDeCor` | Visual | Estilo | Cor · Escala contínua (cor por valor) |  |
| `escalaDeCorPersonalizada` | Visual | Estilo | Cor · Escala própria | Cor · Usar cores próprias na escala |
| `corMinima` | Visual | Estilo | Cor · Cor do mínimo |  |
| `corMedia` | Visual | Estilo | Cor · Cor do meio | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Visual | Estilo | Cor · Cor do máximo |  |
| `limiteDeCorAutomatico` | Visual | Estilo | Cor · Limites automáticos | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Visual | Estilo | Cor · Mínimo da escala (manual) |  |
| `limiteDeCorMaximo` | Visual | Estilo | Cor · Máximo da escala (manual) |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `tamanhoDoPonto` | Visual | Estilo | Pontos · Tamanho do ponto |  |
| `tamanhoMaximoDoPonto` | Visual | Estilo | Pontos · Tamanho máximo | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Visual | Estilo | Pontos · Forma |  |
| `opacidadeDoPonto` | Visual | Estilo | Pontos · Opacidade |  |
| `corDasDivisorias` | Visual | Estilo | Quadrantes · Cor das divisórias |  |
| `contornoDoPonto` | Visual | Estilo | Pontos · Contorno no ponto |  |
| `pintarQuadrantes` | Visual | Estilo | Quadrantes · Pintar o fundo | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Visual | Estilo | Cor: "Ponto de interrogação" | Quadrantes · Cor do quadrante "Ponto de interrogação" |
| `cor_inferiorDireito` | Visual | Estilo | Quadrantes · Cor do quadrante "Abacaxi" |  |
| `cor_inferiorEsquerdo` | Visual | Estilo | Quadrantes · Cor: "Vaca leiteira" | Quadrantes · Cor do quadrante "Vaca leiteira" |
| `cor_superiorEsquerdo` | Visual | Estilo | Quadrantes · Cor do quadrante "Estrela" |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarEixoX` | Texto | Texto | Eixo X · Mostrar eixo X | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Texto | Texto | Eixo X · Título do eixo X |  |
| `escalaEixoX` | Texto | Texto | Eixo X · Escala do eixo X |  |
| `minimoEixoX` | Texto | Texto | Eixo X · Mínimo do eixo X | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Texto | Texto | Eixo X · Máximo do eixo X | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Texto | Texto | Eixo X · Inverter eixo X |  |
| `gradeEixoX` | Texto | Texto | Eixo X · Linhas de grade | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Texto | Texto | Eixo X · Rotação dos rótulos do eixo X | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Texto | Texto | Eixo Y · Mostrar eixo Y | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Texto | Texto | Eixo Y · Título do eixo Y |  |
| `escalaEixoY` | Texto | Texto | Eixo Y · Escala do eixo Y |  |
| `minimoEixoY` | Texto | Texto | Eixo Y · Mínimo do eixo Y | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Texto | Texto | Eixo Y · Máximo do eixo Y | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Texto | Texto | Eixo Y · Inverter eixo Y |  |
| `gradeEixoY` | Texto | Texto | Eixo Y · Linhas de grade | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Texto | Texto | Eixo Y · Rotação dos rótulos do eixo Y | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Texto | Texto | Eixo · Formato dos números nos eixos |  |
| `casasDecimaisDoEixo` | Texto | Texto | Eixo · Casas decimais nos eixos |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `quantosRotulosDePonto` | Texto | Texto | Rótulo · Quantos pontos recebem rótulo | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarContagemPorQuadrante` | Texto | Texto | Pontos por quadrante | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Texto | Texto | Nome: "Ponto de interrogação" | Quadrantes · Nome do quadrante "Ponto de interrogação" |
| `rotulo_inferiorDireito` | Texto | Texto | Quadrantes · Nome do quadrante "Abacaxi" |  |
| `rotulo_inferiorEsquerdo` | Texto | Texto | Quadrantes · Nome: "Vaca leiteira" | Quadrantes · Nome do quadrante "Vaca leiteira" |
| `rotulo_superiorEsquerdo` | Texto | Texto | Quadrantes · Nome do quadrante "Estrela" |  |
| `eixoXSimetricoEmTorno1` | Texto | Texto | Eixo X centrado em 1 | Quadrantes · Centrar o eixo X em 1 (deixa a divisória no meio, como na matriz original) |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoX` | Dados | Dados | Medida do eixo X |  |
| `campoDoY` | Dados | Dados | Medida do eixo Y |  |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |  |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |  |

</details>

## Múltiplas Árvores (`arvores_multiplas`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `formatoDaHierarquia` | Dados | Dados | Como a hierarquia está montada |  |
| `rotuloDaRaiz` | Dados | Dados | Nome do nó raiz | Nome do nó raiz (quando há várias raízes) |
| `profundidadeMaxima` | Dados | Dados | Profundidade máxima (0 = toda a árvore) |  |
| `alinhamentoHorizontalDaArvore` ★ | — | Dados | Centralizar · Horizontal |  |
| `alinhamentoVerticalDaArvore` ★ | — | Dados | Centralizar · Vertical |  |
| `deslocamentoXDaArvore` ★ | — | Dados | Centralizar · Deslocamento X (px) |  |
| `deslocamentoYDaArvore` ★ | — | Dados | Centralizar · Deslocamento Y (px) |  |
| `oQueCentralizar` ★ | — | Dados | Centralizar · O que centralizar |  |
| `quandoCentralizar` ★ | — | Dados | Centralizar · Quando |  |
| `mostrarBotaoCentralizar` ★ | — | Dados | Botão "Centralizar" | Centralizar · Botão "Centralizar" |
| `centralizarCadaArvore` ★ | — | Dados | Cada árvore na célula | Centralizar · Cada árvore na célula |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `colorirPor` | Visual | Estilo | Cor · Cor dos nós |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `layoutDaArvore` | Visual | Estilo | Árvore · Distribuição dos nós |  |
| `colunasDaGrade` | Visual | Estilo | Grade · Colunas (0 = ajustar ao tamanho) |  |
| `mapaDeIconesPorValor` ★ | — | Estilo | Ícone por valor · Mapa (valor=ícone; …) |  |
| `formaDaLigacao` | Visual | Estilo | Árvore · Forma das ligações |  |
| `larguraMinimaDaArvore` | Visual | Estilo | Grade · Largura mínima de cada árvore | Grade · Largura mínima de cada árvore (px) |
| `iconePadraoPorValor` ★ | — | Estilo | Ícone por valor · Ícone padrão |  |
| `espessuraDaLigacao` | Visual | Estilo | Árvore · Espessura das ligações |  |
| `alturaDaArvore` | Visual | Estilo | Grade · Altura de cada árvore (px) |  |
| `coresPorValor` ★ | — | Estilo | Ícone por valor · Cores (valor=#cor; …) |  |
| `espessuraPorValor` | Visual | Estilo | Árvore · Ligação proporcional | Árvore · Ligação mais grossa para ramos maiores |
| `escalaPorArvore` | Visual | Estilo | Grade · Escala por árvore | Grade · Cada árvore com o próprio tamanho de nó (deixa de ser comparável) |
| `tamanhoDoNo` | Visual | Estilo | Árvore · Tamanho do nó |  |
| `espacoHorizontalDaGrade` ★ | — | Estilo | Grade · Espaço entre colunas (px) |  |
| `tamanhoPorValor` | Visual | Estilo | Árvore · Nó pelo valor | Árvore · Nó maior para valores maiores |
| `espacoVerticalDaGrade` ★ | — | Estilo | Grade · Espaço entre linhas (px) |  |
| `linhasGuiaDaGrade` ★ | — | Estilo | Grade · Linhas-guia da grade |  |
| `tamanhoDoIcone` ★ | — | Estilo | Árvore · Tamanho do ícone (0 = auto) |  |
| `ajusteDeEscala` ★ | — | Estilo | Árvore · Ajuste de escala |  |
| `layoutQuandoNaoCouber` ★ | — | Estilo | Árvore · Quando não couber |  |
| `layoutAjusteFonte` ★ | — | Estilo | Árvore · Ajuste: fonte |  |
| `layoutAjusteLinhas` ★ | — | Estilo | Árvore · Ajuste: linhas |  |
| `layoutAjusteColunas` ★ | — | Estilo | Árvore · Ajuste: colunas |  |
| `layoutAjusteEscala` ★ | — | Estilo | Árvore · Ajuste: escala |  |
| `layoutAjusteRolagem` ★ | — | Estilo | Árvore · Ajuste: rolagem |  |
| `layoutFonteMinima` ★ | — | Estilo | Árvore · Ajuste: fonte mínima (px) |  |
| `layoutAjusteNaNota` ★ | — | Estilo | Árvore · Ajuste na nota |  |
| `layoutDiagnostico` ★ | — | Estilo | Árvore · Diagnóstico do layout |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `estiloDoIcone` ★ | — | Estilo | Tema · Estilo do ícone |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `mostrarRotulosDeFolha` | Texto | Texto | Rótulo · Nome das folhas | Rótulo · Escrever o nome das folhas |
| `mostrarRotulosInternos` | Texto | Texto | Rótulo · Nome dos nós internos | Rótulo · Escrever o nome dos nós internos |
| `mostrarValorNoRotulo` | Texto | Texto | Rótulo · Incluir o valor | Rótulo · Incluir o valor no rótulo |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `modoDoTextoLongo` ★ | — | Texto | Texto longo · Modo |  |
| `larguraMaximaDoRotulo` ★ | — | Texto | Texto longo · Largura máxima | Texto longo · Largura máxima (px, 0 = auto) |
| `linhasMaximasDoRotulo` ★ | — | Texto | Texto longo · Máximo de linhas |  |
| `fonteMinimaDoRotulo` ★ | — | Texto | Texto longo · Fonte mínima (px) |  |
| `margemExtraDoRotulo` ★ | — | Texto | Texto longo · Margem extra à direita | Texto longo · Margem extra à direita (px) |
| `partesDoRotulo` ★ | — | Texto | Texto longo · O que aparece no rótulo |  |
| `separadorDoRotulo` ★ | — | Texto | Texto longo · Separador |  |
| `simboloDaMoedaDoRotulo` ★ | — | Texto | Texto longo · Símbolo da moeda |  |
| `moedaPersonalizadaDoRotulo` ★ | — | Texto | Texto longo · Moeda personalizada |  |
| `layoutFolgaDoTexto` ★ | — | Texto | Árvore · Folga do texto (%) |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `mostrarBotoesDeExpandir` | Interação | Mais | Clique · Botões de expandir | Clique · Mostrar botões "Expandir tudo" e "Colapsar tudo" |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `contadorAnimado` | Interação | Mais | Animação · Números contando | Animação · Números sobem/descem até o valor (contador) |
| `animarExpandir` ★ | — | Mais | Animação · Animar abrir/fechar |  |
| `duracaoDeExpandir` ★ | — | Mais | Animação · Duração abrir/fechar (ms) |  |
| `movimentoDeExpandir` ★ | — | Mais | Animação · Movimento abrir/fechar |  |
| `cascataDeExpandir` ★ | — | Mais | Animação · Atraso entre filhos (ms) |  |
| `respeitarMenosMovimento` ★ | — | Mais | Respeitar "menos movimento" | Animação · Respeitar "menos movimento" |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `tooltipComTextoCompleto` ★ | — | Mais | Texto completo no tooltip | Texto longo · Texto completo no tooltip |
| `nivelInicialExpandido` | Interação | Mais | Árvore · Níveis abertos no início | Árvore · Níveis abertos no início (0 = tudo aberto) |
| `permitirSelecionarTexto` ★ | — | Mais | Permitir selecionar texto | Texto longo · Permitir selecionar texto |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoId` | Dados | Dados | Campo do ID (formato id/superior) |  |
| `campoDoPai` | Dados | Dados | Campo do superior (formato id/superior) |  |
| `campoDoNome` | Dados | Dados | Campo do nome a exibir |  |
| `campoDoValor` | Dados | Dados | Medida do tamanho |  |
| `largura_Tecnologia` ★ | — | Estilo | Grade · Largura — Tecnologia |  |
| `altura_Tecnologia` ★ | — | Estilo | Grade · Altura — Tecnologia |  |
| `largura_Comercial` ★ | — | Estilo | Grade · Largura — Comercial |  |
| `altura_Comercial` ★ | — | Estilo | Grade · Altura — Comercial |  |
| `largura_Operacoes` ★ | — | Estilo | Grade · Largura — Operações |  |
| `altura_Operacoes` ★ | — | Estilo | Grade · Altura — Operações |  |

</details>

## Organograma (`org_chart`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `formatoDaHierarquia` | Dados | Dados | Como a hierarquia está montada |  |
| `rotuloDaRaiz` | Dados | Dados | Nome do nó raiz | Nome do nó raiz (quando há várias raízes) |
| `profundidadeMaxima` | Dados | Dados | Profundidade máxima (0 = toda a árvore) |  |
| `alinhamentoHorizontalDaArvore` ★ | — | Dados | Centralizar · Horizontal |  |
| `alinhamentoVerticalDaArvore` ★ | — | Dados | Centralizar · Vertical |  |
| `deslocamentoXDaArvore` ★ | — | Dados | Centralizar · Deslocamento X (px) |  |
| `deslocamentoYDaArvore` ★ | — | Dados | Centralizar · Deslocamento Y (px) |  |
| `oQueCentralizar` ★ | — | Dados | Centralizar · O que centralizar |  |
| `quandoCentralizar` ★ | — | Dados | Centralizar · Quando |  |
| `mostrarBotaoCentralizar` ★ | — | Dados | Botão "Centralizar" | Centralizar · Botão "Centralizar" |
| `comecarRecolhidoAPartirDe` | Dados | Dados | Organograma · Recolher a partir do nível | Organograma · Começar recolhido a partir do nível (0 = tudo aberto) |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `preencherCartao` | Visual | Estilo | Cor · Cartão na cor do ramo | Cor · Cartão preenchido com a cor do ramo |
| `corDoCartaoPor` ★ | — | Estilo | Cor · Cor do cartão por |  |
| `contrasteAutomatico` ★ | — | Estilo | Contraste automático do texto | Cor · Contraste automático do texto |
| `corDaLigacaoDoOrg` ★ | — | Estilo | Cor · Cor das ligações |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `orientacao` | Visual | Estilo | Organograma · Direção |  |
| `mapaDeIconesPorValor` ★ | — | Estilo | Ícone por valor · Mapa (valor=ícone; …) |  |
| `tamanhoDoIcone` ★ | — | Estilo | Árvore · Tamanho do ícone (0 = auto) |  |
| `larguraDoCartao` | Visual | Estilo | Organograma · Largura do cartão (px) |  |
| `iconePadraoPorValor` ★ | — | Estilo | Ícone por valor · Ícone padrão |  |
| `ajusteDeEscala` ★ | — | Estilo | Árvore · Ajuste de escala |  |
| `alturaDoCartao` | Visual | Estilo | Organograma · Altura do cartão (px) |  |
| `coresPorValor` ★ | — | Estilo | Ícone por valor · Cores (valor=#cor; …) |  |
| `layoutQuandoNaoCouber` ★ | — | Estilo | Árvore · Quando não couber |  |
| `espacoEntreNiveis` | Visual | Estilo | Organograma · Espaço entre níveis (px) |  |
| `layoutAjusteFonte` ★ | — | Estilo | Árvore · Ajuste: fonte |  |
| `espacoEntreIrmaos` | Visual | Estilo | Organograma · Espaço entre vizinhos | Organograma · Espaço entre cartões vizinhos (px) |
| `layoutAjusteLinhas` ★ | — | Estilo | Árvore · Ajuste: linhas |  |
| `raioDoCartao` | Visual | Estilo | Organograma · Arredondamento do cartão | Organograma · Arredondamento do cartão (px) |
| `layoutAjusteEscala` ★ | — | Estilo | Árvore · Ajuste: escala |  |
| `layoutAjusteRolagem` ★ | — | Estilo | Árvore · Ajuste: rolagem |  |
| `layoutFonteMinima` ★ | — | Estilo | Árvore · Ajuste: fonte mínima (px) |  |
| `sombraDoCartao` ★ | — | Estilo | Organograma · Sombra do cartão |  |
| `cartaoAjustavel` ★ | — | Estilo | Cartão cresce com o texto | Organograma · Cartão cresce com o texto |
| `layoutAjusteNaNota` ★ | — | Estilo | Árvore · Ajuste na nota |  |
| `fonteDoCartao` ★ | — | Estilo | Organograma · Fonte do cartão |  |
| `layoutDiagnostico` ★ | — | Estilo | Árvore · Diagnóstico do layout |  |
| `estiloDoContador` ★ | — | Estilo | Organograma · Estilo do contador |  |
| `espessuraDaLigacaoDoOrg` ★ | — | Estilo | Organograma · Espessura das ligações |  |
| `formaDaLigacaoDoOrg` ★ | — | Estilo | Organograma · Forma das ligações |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `estiloDoIcone` ★ | — | Estilo | Tema · Estilo do ícone |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `mostrarValorNoCartao` | Texto | Texto | Rótulo · Valor no cartão | Rótulo · Mostrar o valor dentro do cartão |
| `mostrarContagemDeEquipe` | Texto | Texto | Rótulo · Total de descendentes | Rótulo · Mostrar quantos descendentes cada cartão tem |
| `mostrarNomeNoCartao` ★ | — | Texto | Rótulo · Nome no cartão |  |
| `mostrarPercentualNoCartao` ★ | — | Texto | Rótulo · Percentual no cartão |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `modoDoTextoLongo` ★ | — | Texto | Texto longo · Modo |  |
| `larguraMaximaDoRotulo` ★ | — | Texto | Texto longo · Largura máxima | Texto longo · Largura máxima (px, 0 = auto) |
| `linhasMaximasDoRotulo` ★ | — | Texto | Texto longo · Máximo de linhas |  |
| `fonteMinimaDoRotulo` ★ | — | Texto | Texto longo · Fonte mínima (px) |  |
| `margemExtraDoRotulo` ★ | — | Texto | Texto longo · Margem extra à direita | Texto longo · Margem extra à direita (px) |
| `partesDoRotulo` ★ | — | Texto | Texto longo · O que aparece no rótulo |  |
| `separadorDoRotulo` ★ | — | Texto | Texto longo · Separador |  |
| `layoutFolgaDoTexto` ★ | — | Texto | Árvore · Folga do texto (%) |  |
| `simboloDaMoedaDoRotulo` ★ | — | Texto | Texto longo · Símbolo da moeda |  |
| `moedaPersonalizadaDoRotulo` ★ | — | Texto | Texto longo · Moeda personalizada |  |
| `alinhamentoDoTextoDoCartao` ★ | — | Texto | Organograma · Alinhamento do texto |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `mostrarBotoesDeExpandir` ★ | — | Mais | Clique · Botões de expandir | Clique · Mostrar botões "Expandir tudo" e "Colapsar tudo" |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `contadorAnimado` | Interação | Mais | Animação · Números contando | Animação · Números sobem/descem até o valor (contador) |
| `animarExpandir` ★ | — | Mais | Animação · Animar abrir/fechar |  |
| `duracaoDeExpandir` ★ | — | Mais | Animação · Duração abrir/fechar (ms) |  |
| `movimentoDeExpandir` ★ | — | Mais | Animação · Movimento abrir/fechar |  |
| `cascataDeExpandir` ★ | — | Mais | Animação · Atraso entre filhos (ms) |  |
| `respeitarMenosMovimento` ★ | — | Mais | Respeitar "menos movimento" | Animação · Respeitar "menos movimento" |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `tooltipComTextoCompleto` ★ | — | Mais | Texto completo no tooltip | Texto longo · Texto completo no tooltip |
| `permitirRecolher` | Interação | Mais | Recolher ao clicar | Organograma · Recolher uma área clicando no cartão |
| `permitirSelecionarTexto` ★ | — | Mais | Permitir selecionar texto | Texto longo · Permitir selecionar texto |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoId` | Dados | Dados | Campo do ID (formato id/superior) |  |
| `campoDoPai` | Dados | Dados | Campo do superior (formato id/superior) |  |
| `campoDoNome` | Dados | Dados | Campo do nome a exibir |  |
| `campoDoValor` | Dados | Dados | Medida do tamanho |  |
| `campoDoCargo` | Texto | Texto | Rótulo · Campo da 2ª linha | Rótulo · Campo da segunda linha do cartão |

</details>

## UpSet Plot (`upset_plot`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `formatoDosDados` | Dados | Dados | Como os dados estão organizados |  |
| `separadorDeConjuntos` | Dados | Dados | Separador dos conjuntos na dimensão |  |
| `medirPor` | Dados | Dados | O número mostrado é |  |
| `maximoDeConjuntos` | Dados | Dados | Máximo de conjuntos |  |
| `maximoDeIntersecoes` | Dados | Dados | Quantas interseções mostrar (as maiores) |  |
| `ordenarIntersecoes` | Dados | Dados | Ordem das barras |  |
| `esconderIntersecoesVazias` | Dados | Dados | Ocultar interseções vazias | Esconder interseções sem nenhum item |
| `alturaDaMatriz` | Visual | Estilo | Altura da matriz de pontos | Altura da matriz de pontos (% do gráfico) |
| `mostrarTotaisDosConjuntos` | Visual | Estilo | Totais dos conjuntos | Mostrar o total de cada conjunto à esquerda |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `mostrarValorNaBarra` | Texto | Texto | Rótulo · Valor acima da barra | Rótulo · Escrever o valor acima da barra |
| `mostrarPercentual` | Texto | Texto | Rótulo · Mostrar percentual | Rótulo · Mostrar o percentual do total |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `contadorAnimado` | Interação | Mais | Animação · Números contando | Animação · Números sobem/descem até o valor (contador) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |

</details>

## Drawdown (`drawdown`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |  |
| `limiteDeSeries` | Dados | Dados | Máximo de séries | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Agrupar o resto em Outros | Somar as séries que passaram do limite em "Outros" |
| `tratamentoDeNulos` | Dados | Dados | Valores faltando |  |
| `unidadeDoDrawdown` | Dados | Dados | Drawdown · Medir a queda em |  |
| `destacarPiorQueda` | Dados | Dados | Drawdown · Destacar pior queda | Drawdown · Destacar a pior queda |
| `mostrarRecuperacao` | Dados | Dados | Drawdown · Duração da queda | Drawdown · Mostrar quanto durou a pior queda |
| `curvaDaLinha` | Visual | Estilo | Suavização da linha |  |
| `espessuraDaLinha` | Visual | Estilo | Espessura da linha |  |
| `mostrarPontos` | Visual | Estilo | Ponto em cada período | Marcar cada período com um ponto |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `corDaQueda` | Visual | Estilo | Drawdown · Cor da área de queda |  |
| `opacidadeDaArea` | Visual | Estilo | Drawdown · Opacidade da área |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarEixoX` | Texto | Texto | Eixo X · Mostrar eixo X | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Texto | Texto | Eixo X · Título do eixo X |  |
| `escalaEixoX` | Texto | Texto | Eixo X · Escala do eixo X |  |
| `minimoEixoX` | Texto | Texto | Eixo X · Mínimo do eixo X | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Texto | Texto | Eixo X · Máximo do eixo X | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Texto | Texto | Eixo X · Inverter eixo X |  |
| `gradeEixoX` | Texto | Texto | Eixo X · Linhas de grade | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Texto | Texto | Eixo X · Rotação dos rótulos do eixo X | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Texto | Texto | Eixo Y · Mostrar eixo Y | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Texto | Texto | Eixo Y · Título do eixo Y |  |
| `escalaEixoY` | Texto | Texto | Eixo Y · Escala do eixo Y |  |
| `minimoEixoY` | Texto | Texto | Eixo Y · Mínimo do eixo Y | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Texto | Texto | Eixo Y · Máximo do eixo Y | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Texto | Texto | Eixo Y · Inverter eixo Y |  |
| `gradeEixoY` | Texto | Texto | Eixo Y · Linhas de grade | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Texto | Texto | Eixo Y · Rotação dos rótulos do eixo Y | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Texto | Texto | Eixo · Formato dos números nos eixos |  |
| `casasDecimaisDoEixo` | Texto | Texto | Eixo · Casas decimais nos eixos |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `mostrarLegenda` | Texto | Texto | Legenda · Mostrar legenda |  |
| `posicaoDaLegenda` | Texto | Texto | Legenda · Posição da legenda |  |
| `legendaInterativa` | Texto | Texto | Legenda · Clique liga/desliga | Legenda · Clicar na legenda liga/desliga a série |
| `mostrarValoresNaLegenda` | Texto | Texto | Legenda · Mostrar valores | Legenda · Mostrar valores na legenda |
| `tamanhoDaLegenda` | Texto | Texto | Legenda · Tamanho do texto da legenda | Legenda · Tamanho do texto da legenda (px) |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `cor_abertura` | Visual | Estilo | Cor · Cor — Abertura (vazio = da paleta) |  |
| `cor_maxima` | Visual | Estilo | Cor · Cor — Máxima (vazio = da paleta) |  |
| `cor_minima` | Visual | Estilo | Cor · Cor — Mínima (vazio = da paleta) |  |
| `cor_fechamento` | Visual | Estilo | Cor · Cor | Cor · Cor — Fechamento (vazio = da paleta) |
| `cor_volume` | Visual | Estilo | Cor · Cor — Volume (vazio = da paleta) |  |

</details>

## Pareto (`pareto`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `maximoDeCategorias` | Dados | Dados | Máximo de barras (o resto vira "Outros") |  |
| `nivelDeCorte` | Dados | Dados | Pareto · Nível de corte (%) |  |
| `mostrarCorte` | Dados | Dados | Pareto · Marcar o corte | Pareto · Marcar onde o acumulado cruza o corte |
| `destacarAteOCorte` | Dados | Dados | Pareto · Destacar até o corte | Pareto · Destacar as barras que estão antes do corte |
| `larguraDaBarra` | Visual | Estilo | Largura da barra (% do espaço) |  |
| `mostrarPontosDoAcumulado` | Visual | Estilo | Pontos no acumulado | Marcar cada ponto da linha acumulada |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `corDaBarra` | Visual | Estilo | Cor · Cor das barras |  |
| `corDoAcumulado` | Visual | Estilo | Cor · Cor da linha acumulada |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarEixoX` | Texto | Texto | Eixo X · Mostrar eixo X | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Texto | Texto | Eixo X · Título do eixo X |  |
| `escalaEixoX` | Texto | Texto | Eixo X · Escala do eixo X |  |
| `minimoEixoX` | Texto | Texto | Eixo X · Mínimo do eixo X | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Texto | Texto | Eixo X · Máximo do eixo X | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Texto | Texto | Eixo X · Inverter eixo X |  |
| `gradeEixoX` | Texto | Texto | Eixo X · Linhas de grade | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Texto | Texto | Eixo X · Rotação dos rótulos do eixo X | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Texto | Texto | Eixo Y · Mostrar eixo Y | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Texto | Texto | Eixo Y · Título do eixo Y |  |
| `escalaEixoY` | Texto | Texto | Eixo Y · Escala do eixo Y |  |
| `minimoEixoY` | Texto | Texto | Eixo Y · Mínimo do eixo Y | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Texto | Texto | Eixo Y · Máximo do eixo Y | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Texto | Texto | Eixo Y · Inverter eixo Y |  |
| `gradeEixoY` | Texto | Texto | Eixo Y · Linhas de grade | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Texto | Texto | Eixo Y · Rotação dos rótulos do eixo Y | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Texto | Texto | Eixo · Formato dos números nos eixos |  |
| `casasDecimaisDoEixo` | Texto | Texto | Eixo · Casas decimais nos eixos |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |

</details>

## Treemap de Carteira (`treemap_carteira`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `formatoDaHierarquia` | Dados | Dados | Como a hierarquia está montada |  |
| `rotuloDaRaiz` | Dados | Dados | Nome do nó raiz | Nome do nó raiz (quando há várias raízes) |
| `profundidadeMaxima` | Dados | Dados | Profundidade máxima (0 = toda a árvore) |  |
| `maximoDeBlocos` | Dados | Dados | Treemap · Máximo de retângulos | Treemap · Máximo de retângulos (o resto vira "Outros") |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `colorirPor` | Visual | Estilo | Cor · Cor dos retângulos |  |
| `escalaDivergente` | Visual | Estilo | Cor · Escala da cor |  |
| `limiteDaCor` | Visual | Estilo | Cor · Limite da escala | Cor · Limite da escala (vazio = o maior desvio dos dados) |
| `inverterEscala` | Visual | Estilo | Cor · Inverter a escala | Cor · Inverter a escala (quando valor alto é ruim) |
| `mostrarLegendaDeCor` | Visual | Estilo | Cor · Mostrar a régua de cores |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `arranjo` | Visual | Estilo | Treemap · Como arrumar os retângulos |  |
| `espacoEntreBlocos` | Visual | Estilo | Treemap · Espaço entre retângulos (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `mostrarValorNoBloco` | Texto | Texto | Rótulo · Valor no retângulo | Rótulo · Escrever o valor dentro do retângulo |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarTitulosDeGrupo` | Texto | Texto | Treemap · Nome de cada grupo | Treemap · Faixa com o nome de cada grupo |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoId` | Dados | Dados | Campo do ID (formato id/superior) |  |
| `campoDoPai` | Dados | Dados | Campo do superior (formato id/superior) |  |
| `campoDoNome` | Dados | Dados | Campo do nome a exibir |  |
| `campoDoValor` | Dados | Dados | Medida do tamanho |  |
| `campoDaCor` | Visual | Estilo | Cor · Medida da cor |  |

</details>

## Risco x Retorno (`risco_retorno`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `divisoriaX` | Dados | Dados | Quadrantes · Linha divisória vertical | Quadrantes · Linha divisória vertical (eixo X) |
| `taxaLivreDeRisco` | Dados | Dados | Sharpe · Taxa livre de risco | Sharpe · Taxa livre de risco (no mesmo formato do eixo Y) |
| `valorDaDivisoriaX` | Dados | Dados | Quadrantes · Valor fixo da divisória X |  |
| `mostrarRetaDeSharpe` | Dados | Dados | Sharpe · Reta do melhor Sharpe | Sharpe · Reta até o melhor índice de Sharpe |
| `divisoriaY` | Dados | Dados | Quadrantes · Linha divisória horizontal | Quadrantes · Linha divisória horizontal (eixo Y) |
| `destacarMelhorSharpe` | Dados | Dados | Sharpe · Destacar o melhor | Sharpe · Destacar o ativo de melhor Sharpe |
| `valorDaDivisoriaY` | Dados | Dados | Quadrantes · Valor fixo da divisória Y |  |
| `colorirPor` | Dados | Dados | Pontos · Cor dos pontos |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `modoDeCor` | Visual | Estilo | Cor · Como colorir |  |
| `corUnica` | Visual | Estilo | Cor · Cor única |  |
| `escalaDeCor` | Visual | Estilo | Cor · Escala contínua (cor por valor) |  |
| `escalaDeCorPersonalizada` | Visual | Estilo | Cor · Escala própria | Cor · Usar cores próprias na escala |
| `corMinima` | Visual | Estilo | Cor · Cor do mínimo |  |
| `corMedia` | Visual | Estilo | Cor · Cor do meio | Cor · Cor do meio (deixe igual ao mínimo para escala de 2 cores) |
| `corMaxima` | Visual | Estilo | Cor · Cor do máximo |  |
| `limiteDeCorAutomatico` | Visual | Estilo | Cor · Limites automáticos | Cor · Mínimo e máximo automáticos |
| `limiteDeCorMinimo` | Visual | Estilo | Cor · Mínimo da escala (manual) |  |
| `limiteDeCorMaximo` | Visual | Estilo | Cor · Máximo da escala (manual) |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `tamanhoDoPonto` | Visual | Estilo | Pontos · Tamanho do ponto |  |
| `tamanhoMaximoDoPonto` | Visual | Estilo | Pontos · Tamanho máximo | Pontos · Tamanho máximo (quando o tamanho vem de uma medida) |
| `formaDoPonto` | Visual | Estilo | Pontos · Forma |  |
| `opacidadeDoPonto` | Visual | Estilo | Pontos · Opacidade |  |
| `corDaRetaDeSharpe` | Visual | Estilo | Sharpe · Cor da reta |  |
| `corDasDivisorias` | Visual | Estilo | Quadrantes · Cor das divisórias |  |
| `contornoDoPonto` | Visual | Estilo | Pontos · Contorno no ponto |  |
| `pintarQuadrantes` | Visual | Estilo | Quadrantes · Pintar o fundo | Quadrantes · Pintar o fundo dos quadrantes |
| `cor_superiorDireito` | Visual | Estilo | Cor: "Retorno alto, risco alto" | Quadrantes · Cor do quadrante "Retorno alto, risco alto" |
| `cor_inferiorDireito` | Visual | Estilo | Cor: "Retorno baixo, risco alto" | Quadrantes · Cor do quadrante "Retorno baixo, risco alto" |
| `cor_inferiorEsquerdo` | Visual | Estilo | Cor: "Retorno baixo, risco baixo" | Quadrantes · Cor do quadrante "Retorno baixo, risco baixo" |
| `cor_superiorEsquerdo` | Visual | Estilo | Cor: "Retorno alto, risco baixo" | Quadrantes · Cor do quadrante "Retorno alto, risco baixo" |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarEixoX` | Texto | Texto | Eixo X · Mostrar eixo X | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Texto | Texto | Eixo X · Título do eixo X |  |
| `escalaEixoX` | Texto | Texto | Eixo X · Escala do eixo X |  |
| `minimoEixoX` | Texto | Texto | Eixo X · Mínimo do eixo X | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Texto | Texto | Eixo X · Máximo do eixo X | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Texto | Texto | Eixo X · Inverter eixo X |  |
| `gradeEixoX` | Texto | Texto | Eixo X · Linhas de grade | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Texto | Texto | Eixo X · Rotação dos rótulos do eixo X | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Texto | Texto | Eixo Y · Mostrar eixo Y | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Texto | Texto | Eixo Y · Título do eixo Y |  |
| `escalaEixoY` | Texto | Texto | Eixo Y · Escala do eixo Y |  |
| `minimoEixoY` | Texto | Texto | Eixo Y · Mínimo do eixo Y | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Texto | Texto | Eixo Y · Máximo do eixo Y | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Texto | Texto | Eixo Y · Inverter eixo Y |  |
| `gradeEixoY` | Texto | Texto | Eixo Y · Linhas de grade | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Texto | Texto | Eixo Y · Rotação dos rótulos do eixo Y | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Texto | Texto | Eixo · Formato dos números nos eixos |  |
| `casasDecimaisDoEixo` | Texto | Texto | Eixo · Casas decimais nos eixos |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `quantosRotulosDePonto` | Texto | Texto | Rótulo · Quantos pontos recebem rótulo | Rótulo · Quantos pontos recebem rótulo (0 = nenhum, 999 = todos) |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarContagemPorQuadrante` | Texto | Texto | Pontos por quadrante | Quadrantes · Mostrar quantos pontos há em cada quadrante |
| `rotulo_superiorDireito` | Texto | Texto | Nome: "Retorno alto, risco alto" | Quadrantes · Nome do quadrante "Retorno alto, risco alto" |
| `rotulo_inferiorDireito` | Texto | Texto | Nome: "Retorno baixo, risco alto" | Quadrantes · Nome do quadrante "Retorno baixo, risco alto" |
| `rotulo_inferiorEsquerdo` | Texto | Texto | Nome: "Retorno baixo, risco baixo" | Quadrantes · Nome do quadrante "Retorno baixo, risco baixo" |
| `rotulo_superiorEsquerdo` | Texto | Texto | Nome: "Retorno alto, risco baixo" | Quadrantes · Nome do quadrante "Retorno alto, risco baixo" |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoX` | Dados | Dados | Medida do eixo X |  |
| `campoDoY` | Dados | Dados | Medida do eixo Y |  |
| `campoDoTamanho` | Dados | Dados | Medida do tamanho do ponto |  |
| `campoDaCor` | Dados | Dados | Medida da cor do ponto |  |

</details>

## Grafico de Controle (`grafico_controle`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |  |
| `limiteDeSeries` | Dados | Dados | Máximo de séries | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Agrupar o resto em Outros | Somar as séries que passaram do limite em "Outros" |
| `tratamentoDeNulos` | Dados | Dados | Valores faltando |  |
| `metodoDoSigma` | Dados | Dados | Controle · Como estimar o σ |  |
| `linhaCentral` | Dados | Dados | Controle · Linha central |  |
| `periodoBase` | Dados | Dados | Controle · Base: N primeiros períodos | Controle · Calcular os limites só com os N primeiros períodos (0 = todos) |
| `regrasAtivas` | Dados | Dados | Controle · Regras de Nelson |  |
| `curvaDaLinha` | Visual | Estilo | Suavização da linha |  |
| `espessuraDaLinha` | Visual | Estilo | Espessura da linha |  |
| `mostrarPontos` | Visual | Estilo | Ponto em cada período | Marcar cada período com um ponto |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `larguraDosLimites` | Visual | Estilo | Controle · Limites em quantos σ |  |
| `mostrarZonas` | Visual | Estilo | Controle · Zonas de 1σ e 2σ | Controle · Sombrear as zonas de 1σ e 2σ |
| `corDoSinal` | Visual | Estilo | Controle · Cor fora de controle | Controle · Cor dos pontos fora de controle |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarEixoX` | Texto | Texto | Eixo X · Mostrar eixo X | Eixo X · Mostrar eixo X (horizontal) |
| `tituloEixoX` | Texto | Texto | Eixo X · Título do eixo X |  |
| `escalaEixoX` | Texto | Texto | Eixo X · Escala do eixo X |  |
| `minimoEixoX` | Texto | Texto | Eixo X · Mínimo do eixo X | Eixo X · Mínimo do eixo X (vazio = automático) |
| `maximoEixoX` | Texto | Texto | Eixo X · Máximo do eixo X | Eixo X · Máximo do eixo X (vazio = automático) |
| `inverterEixoX` | Texto | Texto | Eixo X · Inverter eixo X |  |
| `gradeEixoX` | Texto | Texto | Eixo X · Linhas de grade | Eixo X · Linhas de grade no eixo X |
| `rotacaoRotuloEixoX` | Texto | Texto | Eixo X · Rotação dos rótulos do eixo X | Eixo X · Rotação dos rótulos do eixo X (graus) |
| `mostrarEixoY` | Texto | Texto | Eixo Y · Mostrar eixo Y | Eixo Y · Mostrar eixo Y (vertical) |
| `tituloEixoY` | Texto | Texto | Eixo Y · Título do eixo Y |  |
| `escalaEixoY` | Texto | Texto | Eixo Y · Escala do eixo Y |  |
| `minimoEixoY` | Texto | Texto | Eixo Y · Mínimo do eixo Y | Eixo Y · Mínimo do eixo Y (vazio = automático) |
| `maximoEixoY` | Texto | Texto | Eixo Y · Máximo do eixo Y | Eixo Y · Máximo do eixo Y (vazio = automático) |
| `inverterEixoY` | Texto | Texto | Eixo Y · Inverter eixo Y |  |
| `gradeEixoY` | Texto | Texto | Eixo Y · Linhas de grade | Eixo Y · Linhas de grade no eixo Y |
| `rotacaoRotuloEixoY` | Texto | Texto | Eixo Y · Rotação dos rótulos do eixo Y | Eixo Y · Rotação dos rótulos do eixo Y (graus) |
| `formatoDoEixo` | Texto | Texto | Eixo · Formato dos números nos eixos |  |
| `casasDecimaisDoEixo` | Texto | Texto | Eixo · Casas decimais nos eixos |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `escreverLimites` | Texto | Texto | Rótulo · Valores dos limites | Rótulo · Escrever os valores de LSC, LC e LIC |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |

</details>

## Heatmap Denso (`heatmap_denso`)

- Antes (5 abas): Visual · Texto · Interação · Avançado · Dados
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `mostrarGrade` | Visual | Estilo | Separar as células com linha | Separar as células com linha (some quando não cabe) |
| `maximoDeLinhas` | Visual | Estilo | Máximo de linhas |  |
| `maximoDeColunas` | Visual | Estilo | Máximo de colunas |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `escalaDeCor` | Visual | Estilo | Cor · Paleta contínua |  |
| `modoDaEscala` | Visual | Estilo | Cor · Como a cor mapeia o valor |  |
| `inverterCor` | Visual | Estilo | Cor · Inverter a paleta |  |
| `corDaAusencia` | Visual | Estilo | Cor · Cor das células sem dado |  |
| `mostrarLegendaDeCor` | Visual | Estilo | Cor · Mostrar a régua de cor |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDaLinha` | Dados | Dados | Dimensão das linhas |  |
| `campoDaColuna` | Dados | Dados | Dimensão das colunas |  |
| `campoDoValor` | Dados | Dados | Medida da cor |  |

</details>

## Barras de Ranking Denso (`barras_ranking_denso`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `ordem` | Dados | Dados | Ranking · Ordem |  |
| `destacarTop` | Dados | Dados | Ranking · Destacar as N primeiras | Ranking · Destacar as N primeiras (0 = nenhuma) |
| `referencia` | Dados | Dados | Ranking · Linha de referência |  |
| `valorDaReferencia` | Dados | Dados | Ranking · Valor fixo da referência |  |
| `larguraDoNome` | Visual | Estilo | Largura da coluna de nomes (px) |  |
| `mostrarPosicao` | Visual | Estilo | Mostrar a posição no ranking |  |
| `mostrarGrade` | Visual | Estilo | Linhas de grade verticais |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `alturaDaLinha` | Visual | Estilo | Ranking · Altura de cada barra (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `mostrarBusca` | Interação | Mais | Ranking · Campo de busca | Ranking · Campo de busca por nome |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoValor` | Dados | Dados | Medida da barra |  |

</details>

## Dot Plot Denso (`dot_plot_denso`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `comecarEmZero` | Dados | Dados | Dot plot · Eixo começa em zero | Dot plot · Começar o eixo em zero (desligue para ver diferenças pequenas) |
| `ordem` | Dados | Dados | Dot plot · Ordenar por |  |
| `larguraDoNome` | Visual | Estilo | Largura da coluna de nomes (px) |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `larguraMaximaDosNomes` ★ | — | Estilo | Dot plot · Nomes: largura máxima | Dot plot · Nomes: largura máxima (% do gráfico) |
| `alturaDaLinha` | Visual | Estilo | Dot plot · Altura de cada linha (px) |  |
| `tamanhoDoPonto` | Visual | Estilo | Dot plot · Tamanho do ponto (px) |  |
| `formaDoPonto` | Visual | Estilo | Dot plot · Forma do ponto |  |
| `ligarPontos` | Visual | Estilo | Dot plot · Ligar os pontos | Dot plot · Ligar os pontos da mesma linha |
| `mostrarGuias` | Visual | Estilo | Dot plot · Guias verticais | Dot plot · Linhas de guia verticais |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `rotuloNaBorda` ★ | — | Texto | Rótulo · Rótulo na borda |  |
| `escreverValores` | Texto | Texto | Rótulo · Escrever os valores |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `modoDoTextoLongo` ★ | — | Texto | Texto longo · Modo |  |
| `larguraMaximaDoRotulo` ★ | — | Texto | Texto longo · Largura máxima | Texto longo · Largura máxima (px, 0 = auto) |
| `linhasMaximasDoRotulo` ★ | — | Texto | Texto longo · Máximo de linhas |  |
| `fonteMinimaDoRotulo` ★ | — | Texto | Texto longo · Fonte mínima (px) |  |
| `margemExtraDoRotulo` ★ | — | Texto | Texto longo · Margem extra à direita | Texto longo · Margem extra à direita (px) |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `tooltipComTextoCompleto` ★ | — | Mais | Texto completo no tooltip | Texto longo · Texto completo no tooltip |
| `permitirSelecionarTexto` ★ | — | Mais | Permitir selecionar texto | Texto longo · Permitir selecionar texto |
| `mostrarBusca` | Interação | Mais | Dot plot · Campo de busca | Dot plot · Campo de busca por nome |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `usar_vendas` | Dados | Dados | Incluir "Vendas" |  |
| `usar_pedidos` | Dados | Dados | Incluir "Pedidos" |  |

</details>

## Bump Chart (`bump_chart`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |  |
| `limiteDeSeries` | Dados | Dados | Máximo de séries | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Agrupar o resto em Outros | Somar as séries que passaram do limite em "Outros" |
| `tratamentoDeNulos` | Dados | Dados | Valores faltando |  |
| `melhorPosicao` | Dados | Dados | Ranking · A 1ª posição é |  |
| `curvaDaLinha` | Visual | Estilo | Suavização da linha |  |
| `espessuraDaLinha` | Visual | Estilo | Espessura da linha |  |
| `mostrarPontos` | Visual | Estilo | Ponto em cada período | Marcar cada período com um ponto |
| `tamanhoDoPonto` | Visual | Estilo | Tamanho do ponto |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `posicaoDoValor` ★ | — | Texto | Rótulo · Posição do valor |  |
| `rotulosNasPontas` | Texto | Texto | Rótulo · Nomes nas pontas |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarPosicao` | Texto | Texto | Ranking · Posição no ponto | Ranking · Número da posição dentro do ponto |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `destacarNoHover` | Interação | Mais | Ranking · Destacar sob o mouse | Ranking · Destacar uma série ao passar o mouse |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `cor_Sudeste` | Visual | Estilo | Cor · Cor — Sudeste (vazio = da paleta) |  |
| `cor_Sul` | Visual | Estilo | Cor · Cor — Sul (vazio = da paleta) |  |
| `cor_Nordeste` | Visual | Estilo | Cor · Cor — Nordeste (vazio = da paleta) |  |
| `cor_Norte` | Visual | Estilo | Cor · Cor — Norte (vazio = da paleta) |  |
| `cor_Centro_Oeste` | Visual | Estilo | Cor · Cor | Cor · Cor — Centro-Oeste (vazio = da paleta) |

</details>

## Slope Chart (`slope_chart`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |  |
| `limiteDeSeries` | Dados | Dados | Máximo de séries | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Agrupar o resto em Outros | Somar as séries que passaram do limite em "Outros" |
| `criterioDaVariacao` | Dados | Dados | Slope · Medir a variação em |  |
| `destacarMaiores` | Dados | Dados | Slope · Destacar as N maiores variações | Slope · Destacar as N maiores variações (0 = nenhuma) |
| `comecarEmZero` | Dados | Dados | Slope · Começar o eixo em zero |  |
| `espessuraDaLinha` | Visual | Estilo | Espessura das linhas |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `corPorDirecao` | Visual | Estilo | Slope · Cor por direção | Slope · Colorir por direção (sobe, desce, mantém) |
| `corDeAlta` | Visual | Estilo | Slope · Cor de quem subiu |  |
| `corDeBaixa` | Visual | Estilo | Slope · Cor de quem caiu |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `escreverValores` | Texto | Texto | Rótulo · Valor junto do nome | Rótulo · Escrever o valor junto do nome |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `cor_Sudeste` | Visual | Estilo | Cor · Cor — Sudeste (vazio = da paleta) |  |
| `cor_Sul` | Visual | Estilo | Cor · Cor — Sul (vazio = da paleta) |  |
| `cor_Nordeste` | Visual | Estilo | Cor · Cor — Nordeste (vazio = da paleta) |  |
| `cor_Norte` | Visual | Estilo | Cor · Cor — Norte (vazio = da paleta) |  |
| `cor_Centro_Oeste` | Visual | Estilo | Cor · Cor | Cor · Cor — Centro-Oeste (vazio = da paleta) |

</details>

## Bar Chart Race (`bar_race`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `origemDasSeries` | Dados | Dados | De onde vêm as séries |  |
| `limiteDeSeries` | Dados | Dados | Máximo de séries | Máximo de séries (as demais viram "Outros") |
| `agruparRestoEmOutros` | Dados | Dados | Agrupar o resto em Outros | Somar as séries que passaram do limite em "Outros" |
| `barrasVisiveis` | Dados | Dados | Corrida · Quantas barras mostrar |  |
| `alturaDaBarra` | Visual | Estilo | Altura de cada barra | Altura de cada barra (px, 0 = divide o espaço) |
| `larguraDoNome` | Visual | Estilo | Largura da coluna de nomes (px) |  |
| `mostrarGrade` | Visual | Estilo | Linhas de grade verticais |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `escalaFixa` | Visual | Estilo | Corrida · Escala fixa | Corrida · Escala fixa (o maior valor de TODOS os períodos) |
| `tamanhoDoRank` | Visual | Estilo | Corrida · Tamanho do número do rank | Corrida · Tamanho do número do rank (px, 0 = acompanha a barra) |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarRank` | Texto | Texto | Corrida · Número do rank | Corrida · Mostrar o número do rank (1, 2, 3…) |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `duracaoPorPeriodo` | Interação | Mais | Corrida · Duração de cada período (ms) |  |
| `comecarTocando` | Interação | Mais | Corrida · Começar tocando |  |
| `repetir` | Interação | Mais | Corrida · Repetir ao terminar | Corrida · Repetir do início ao terminar |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |

</details>

## KPI Vivo (`kpi_vivo`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `formatoDoNumero` | Dados | Dados | Formato do número | Formato do número (Automático = o do rótulo / do campo) |
| `casasDoNumero` | Dados | Dados | Casas decimais do número |  |
| `simboloDaMoeda` | Dados | Dados | Símbolo da moeda |  |
| `baseDaComparacao` | Dados | Dados | KPI · Comparar com |  |
| `periodosAtras` | Dados | Dados | KPI · Quantos períodos atrás |  |
| `meta` | Dados | Dados | KPI · Valor da meta |  |
| `menorEhMelhor` | Dados | Dados | KPI · Menor é melhor | KPI · Menor é melhor (custo, churn, tempo de resposta…) |
| `colorirVariacao` | Dados | Dados | KPI · Cor pela direção | KPI · Colorir a variação por direção |
| `mostrarVariacaoAbsoluta` | Dados | Dados | KPI · Diferença absoluta | KPI · Mostrar também a diferença absoluta |
| `mostrarProgressoDaMeta` | Dados | Dados | KPI · Progresso até a meta | KPI · Barra de progresso até a meta (usa "Valor da meta") |
| `usarLimites` | Dados | Dados | KPI · Cor por limites | KPI · Colorir o número por limites (verde / amarelo / vermelho) |
| `limiteVerde` | Dados | Dados | KPI · Limite do verde | KPI · Limite do verde (a partir de; com "menor é melhor": até) |
| `limiteAmarelo` | Dados | Dados | KPI · Limite do amarelo | KPI · Limite do amarelo (a partir de; com "menor é melhor": até) |
| `progressoEmXicara` ★ | — | Dados | KPI · Meta em xícara | KPI · Meta em xícara (pacote Café) |
| `colunasDoKpi` | Dados | Dados | KPI · Colunas da grade (0 = automático) |  |
| `linhasDoKpi` | Dados | Dados | KPI · Linhas da grade (0 = automático) |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `mostrarSparkline` | Visual | Estilo | KPI · Sparkline de contexto |  |
| `layoutDoCartao` | Visual | Estilo | KPI · Layout do cartão |  |
| `tipoDeSparkline` | Visual | Estilo | KPI · Minigráfico |  |
| `corPositiva` | Visual | Estilo | KPI · Cor do positivo (vazio = do tema) |  |
| `corNegativa` | Visual | Estilo | KPI · Cor do negativo (vazio = do tema) |  |
| `iconeDoKpi` | Visual | Estilo | KPI · Ícone |  |
| `corDoIcone` | Visual | Estilo | KPI · Cor do ícone | KPI · Cor do ícone (vazio = destaque do tema) |
| `kpisEmGrade` | Visual | Estilo | KPI · Vários KPIs em grade | KPI · Vários KPIs em grade (um cartão por medida) |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `estiloDoIcone` ★ | — | Estilo | Tema · Estilo do ícone |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `titulo` | Texto | Texto | Título · Título (vazio = nome da medida) |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo do cartão |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `contadorAnimado` | Interação | Mais | Animação · Números contando | Animação · Animação de contagem do número |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoPeriodo` | Dados | Dados | Dimensão do tempo |  |

</details>

## Halteres (`dumbbell`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `comecarEmZero` | Dados | Dados | Halteres · Eixo começa em zero | Halteres · Começar o eixo em zero |
| `ordem` | Dados | Dados | Halteres · Ordenar por |  |
| `menorEhMelhor` | Dados | Dados | Halteres · Menor é melhor | Halteres · Menor é melhor (custo, churn, tempo de resposta…) |
| `larguraDoNome` | Visual | Estilo | Largura da coluna de nomes (px) |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `corPorDirecao` | Visual | Estilo | Halteres · Cor por direção | Halteres · Colorir a barra por direção (subiu, desceu) |
| `alturaDaLinha` | Visual | Estilo | Halteres · Altura de cada linha (px) |  |
| `tamanhoDoPonto` | Visual | Estilo | Halteres · Tamanho dos pontos (px) |  |
| `formaDoPonto` | Visual | Estilo | Halteres · Forma do ponto |  |
| `espessuraDaBarra` | Visual | Estilo | Halteres · Espessura da barra (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `escreverValores` | Texto | Texto | Rótulo · Escrever |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `mostrarBusca` | Interação | Mais | Halteres · Campo de busca | Halteres · Campo de busca por nome |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDoAntes` | Dados | Dados | Primeira medida (o "antes") |  |
| `campoDoDepois` | Dados | Dados | Segunda medida (o "depois") |  |

</details>

## Marimekko (`marimekko`)

- Antes (5 abas): Dados · Visual · Texto · Interação · Avançado
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `maximoDeColunas` | Dados | Dados | Marimekko · Máximo de colunas | Marimekko · Máximo de colunas (o resto vira "Outros") |
| `maximoDeSeries` | Dados | Dados | Marimekko · Máximo de séries empilhadas | Marimekko · Máximo de séries empilhadas (o resto vira "Outros") |
| `ordemDasColunas` | Dados | Dados | Marimekko · Ordem das colunas |  |
| `paleta` | Visual | Estilo | Cor · Paleta de cores |  |
| `inverterPaleta` | Visual | Estilo | Cor · Inverter ordem das cores |  |
| `opacidade` | Visual | Estilo | Cor · Opacidade do preenchimento |  |
| `mostrarContorno` | Visual | Estilo | Cor · Mostrar contorno |  |
| `corDoContorno` | Visual | Estilo | Cor · Cor do contorno |  |
| `espessuraDoContorno` | Visual | Estilo | Cor · Espessura do contorno (px) |  |
| `tracejadoDoContorno` | Visual | Estilo | Cor · Estilo do contorno |  |
| `tema` | Visual | Estilo | Tema · Tema |  |
| `corDeFundo` | Visual | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Visual | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Visual | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Visual | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Visual | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Visual | Estilo | Tema · Tamanho base da fonte (px) |  |
| `espacoEntreColunas` | Visual | Estilo | Marimekko · Espaço entre colunas (px) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `mostrarRotulos` | Texto | Texto | Rótulo · Mostrar rótulos |  |
| `tamanhoDoRotulo` | Texto | Texto | Rótulo · Tamanho do rótulo (px) |  |
| `corDoRotulo` | Texto | Texto | Rótulo · Cor do rótulo | Rótulo · Cor do rótulo (vazio = automática) |
| `negritoNoRotulo` | Texto | Texto | Rótulo · Rótulo em negrito |  |
| `rotacaoDoRotulo` | Texto | Texto | Rótulo · Rotação do rótulo (graus) |  |
| `evitarColisaoDeRotulos` | Texto | Texto | Rótulo · Ocultar sobrepostos | Rótulo · Esconder rótulos que se sobrepõem |
| `truncarRotulo` | Texto | Texto | Rótulo · Cortar após N caracteres | Rótulo · Truncar rótulo com mais de N caracteres (0 = não truncar) |
| `posicaoDoRotulo` | Texto | Texto | Rótulo · Posição do rótulo |  |
| `conteudoDoRotulo` | Texto | Texto | Rótulo · O que mostrar no rótulo |  |
| `formatoDoRotulo` | Texto | Texto | Rótulo · Formato do número no rótulo |  |
| `casasDecimaisDoRotulo` | Texto | Texto | Rótulo · Casas decimais no rótulo |  |
| `escreverPercentuais` | Texto | Texto | Rótulo · Percentual no bloco | Rótulo · Escrever o percentual dentro do bloco |
| `escreverLarguras` | Texto | Texto | Rótulo · Peso de cada coluna | Rótulo · Escrever o peso de cada coluna no topo |
| `mostrarLegenda` | Texto | Texto | Legenda · Mostrar legenda |  |
| `posicaoDaLegenda` | Texto | Texto | Legenda · Posição da legenda |  |
| `legendaInterativa` | Texto | Texto | Legenda · Clique liga/desliga | Legenda · Clicar na legenda liga/desliga a série |
| `mostrarValoresNaLegenda` | Texto | Texto | Legenda · Mostrar valores | Legenda · Mostrar valores na legenda |
| `tamanhoDaLegenda` | Texto | Texto | Legenda · Tamanho do texto da legenda | Legenda · Tamanho do texto da legenda (px) |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` ★ | — | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` ★ | — | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` ★ | — | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` ★ | — | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` ★ | — | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` ★ | — | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` ★ | — | Texto | Título · Fonte |  |
| `pesoDoTitulo` ★ | — | Texto | Título · Peso |  |
| `corDoTitulo` ★ | — | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` ★ | — | Texto | Título · Margem (px) |  |
| `quebrarTitulo` ★ | — | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` ★ | — | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` ★ | — | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` ★ | — | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` ★ | — | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` ★ | — | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` ★ | — | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` ★ | — | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` ★ | — | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` ★ | — | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` ★ | — | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` ★ | — | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` ★ | — | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` ★ | — | Texto | Nota · Mostrar |  |
| `posicaoDaNota` ★ | — | Texto | Nota · Posição |  |
| `alinhamentoDaNota` ★ | — | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` ★ | — | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` ★ | — | Texto | Nota · Fonte |  |
| `corDaNota` ★ | — | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` ★ | — | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` ★ | — | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` ★ | — | Texto | Nota · Texto |  |
| `meuTextoDaNota` ★ | — | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Interação | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Interação | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Interação | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Interação | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Interação | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Interação | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Interação | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Interação | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Interação | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Interação | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Interação | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `modoDebug` | Avançado | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Avançado | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Avançado | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `animacaoAtiva` | Interação | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Interação | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Interação | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Interação | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Interação | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Interação | Mais | Animação · Quando animar |  |
| `destacarAoPassarMouse` | Interação | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `campoDaColuna` | Dados | Dados | Dimensão das colunas (a largura) |  |
| `campoDaSerie` | Dados | Dados | Dimensão empilhada (a altura) |  |
| `campoDoValor` | Dados | Dados | Medida |  |

</details>

## Cartão Multi-Valores (`cartao_multivalor`)

- Antes (4 abas): Dados · Estilo · Texto · Mais
- Depois (4 abas): Dados · Estilo · Texto · Mais

<details><summary>Destino de cada opção</summary>

| id | aba antes | aba depois | rótulo no painel | explicação (rótulo completo) |
|---|---|---|---|---|
| `valorDoCabecalho` | Dados | Dados | Topo · Valor do topo |  |
| `camposDoCabecalho` | Dados | Dados | Topo · Campos (vazio = medidas) |  |
| `formulaDoCabecalho` | Dados | Dados | Topo · Fórmula |  |
| `formatoDoCabecalho` | Dados | Dados | Topo · Formato |  |
| `casasDoCabecalho` | Dados | Dados | Topo · Casas decimais |  |
| `subtituloDoCabecalho` | Dados | Dados | Topo · Subtítulo |  |
| `textoDoSubtituloMV` | Dados | Dados | Topo · Texto do subtítulo |  |
| `tamanhoDoValorGrande` | Dados | Dados | Topo · Tamanho do valor (px, 0=auto) |  |
| `tema` | Estilo | Estilo | Tema · Tema |  |
| `corDeFundo` | Estilo | Estilo | Cor · Cor de fundo (vazio = do tema) |  |
| `corDoTexto` | Estilo | Estilo | Cor · Cor do texto (tema personalizado) |  |
| `corDaBorda` | Estilo | Estilo | Cor · Cor das bordas | Cor · Cor das bordas (tema personalizado) |
| `corDaGrade` | Estilo | Estilo | Cor · Cor das linhas de grade | Cor · Cor das linhas de grade (tema personalizado) |
| `familiaDaFonte` | Estilo | Estilo | Tema · Fonte |  |
| `tamanhoDaFonte` | Estilo | Estilo | Tema · Tamanho base da fonte (px) |  |
| `estiloDoIcone` ★ | — | Estilo | Tema · Estilo do ícone |  |
| `modoDoCartao` | Estilo | Estilo | Cartão · Modo |  |
| `faixasMV` | Estilo | Estilo | Faixas · Faixas | Faixas · Faixas (Nome\|mín\|máx\|cor\|ícone; …) |
| `corDeFundoMV` | Estilo | Estilo | Cartão · Fundo do cartão (vazio = tema) |  |
| `colunasDaGradeMV` | Estilo | Estilo | Cartão · Colunas da grade (0 = auto) |  |
| `campoDasFaixas` | Estilo | Estilo | Faixas · Campo das faixas (vazio = topo) |  |
| `bordaMV` | Estilo | Estilo | Cartão · Borda do cartão |  |
| `espacoDaGradeMV` | Estilo | Estilo | Cartão · Espaço entre cartões (px) |  |
| `mostrarSeloDaFaixa` | Estilo | Estilo | Faixas · Selo da faixa |  |
| `corDaBordaMV` | Estilo | Estilo | Cartão · Cor da borda (vazio = tema) |  |
| `layoutDosItens` | Estilo | Estilo | Cartão · Layout dos itens |  |
| `mostrarLegendaDasFaixas` | Estilo | Estilo | Faixas · Legenda das faixas |  |
| `sombraMV` | Estilo | Estilo | Cartão · Sombra do cartão |  |
| `colunasDosItens` | Estilo | Estilo | Cartão · Colunas dos itens (grade) |  |
| `raioMV` | Estilo | Estilo | Cartão · Arredondamento (px) |  |
| `divisoriasMV` | Estilo | Estilo | Divisórias entre blocos | Cartão · Divisórias entre blocos |
| `fonteMV` | Estilo | Estilo | Cartão · Fonte |  |
| `secoesRecolhiveisMV` | Estilo | Estilo | Cartão · Seções recolhíveis |  |
| `ajustarAoTileMV` | Estilo | Estilo | Ajustar ao tamanho do tile | Cartão · Ajustar ao tamanho do tile |
| `mapaDeIconesPorValor` ★ | — | Estilo | Cartão · Mapa (valor=ícone; …) |  |
| `iconePadraoPorValor` ★ | — | Estilo | Cartão · Ícone padrão |  |
| `coresPorValor` ★ | — | Estilo | Cartão · Cores (valor=#cor; …) |  |
| `campoDoIconePorValor` ★ | — | Estilo | Cartão · Campo (nome ou rótulo) |  |
| `pacoteTematico` ★ | — | Estilo | Tema · Pacote temático |  |
| `titulo` | Texto | Texto | Título · Título |  |
| `subtitulo` | Texto | Texto | Título · Subtítulo |  |
| `textoSemDados` | Texto | Texto | Aviso · Mensagem quando não há dados |  |
| `mostrarAvisos` | Texto | Texto | Aviso · Mostrar avisos | Aviso · Mostrar avisos (eles sempre vão também para o console) |
| `posicaoDosAvisos` | Texto | Texto | Aviso · Posição dos avisos |  |
| `mostrarTitulo` | Texto | Texto | Título · Mostrar |  |
| `posicaoDoTitulo` | Texto | Texto | Título · Posição |  |
| `alinhamentoDoTitulo` | Texto | Texto | Título · Alinhamento |  |
| `deslocamentoXDoTitulo` | Texto | Texto | Título · Deslocamento X (px) |  |
| `deslocamentoYDoTitulo` | Texto | Texto | Título · Deslocamento Y (px) |  |
| `tamanhoDoTitulo` | Texto | Texto | Título · Tamanho (px, 0 = auto) |  |
| `fonteDoTitulo` | Texto | Texto | Título · Fonte |  |
| `pesoDoTitulo` | Texto | Texto | Título · Peso |  |
| `corDoTitulo` | Texto | Texto | Título · Cor (vazio = tema) |  |
| `margemDoTitulo` | Texto | Texto | Título · Margem (px) |  |
| `quebrarTitulo` | Texto | Texto | Título · Quebrar linha |  |
| `linhasDoTitulo` | Texto | Texto | Título · Máximo de linhas (0 = sem) |  |
| `mostrarSubtitulo` | Texto | Texto | Subtítulo · Mostrar |  |
| `posicaoDoSubtitulo` | Texto | Texto | Subtítulo · Posição |  |
| `alinhamentoDoSubtitulo` | Texto | Texto | Subtítulo · Alinhamento |  |
| `deslocamentoXDoSubtitulo` | Texto | Texto | Subtítulo · Deslocamento X (px) |  |
| `deslocamentoYDoSubtitulo` | Texto | Texto | Subtítulo · Deslocamento Y (px) |  |
| `tamanhoDoSubtitulo` | Texto | Texto | Subtítulo · Tamanho (px, 0 = auto) |  |
| `fonteDoSubtitulo` | Texto | Texto | Subtítulo · Fonte |  |
| `pesoDoSubtitulo` | Texto | Texto | Subtítulo · Peso |  |
| `corDoSubtitulo` | Texto | Texto | Subtítulo · Cor (vazio = tema) |  |
| `margemDoSubtitulo` | Texto | Texto | Subtítulo · Margem (px) |  |
| `quebrarSubtitulo` | Texto | Texto | Subtítulo · Quebrar linha |  |
| `linhasDoSubtitulo` | Texto | Texto | Subtítulo · Máximo de linhas (0 = sem) |  |
| `mostrarNota` | Texto | Texto | Nota · Mostrar |  |
| `posicaoDaNota` | Texto | Texto | Nota · Posição |  |
| `alinhamentoDaNota` | Texto | Texto | Nota · Alinhamento |  |
| `tamanhoDaNota` | Texto | Texto | Nota · Tamanho (px) |  |
| `fonteDaNota` | Texto | Texto | Nota · Fonte |  |
| `corDaNota` | Texto | Texto | Nota · Cor (vazio = tema) |  |
| `quebrarNota` | Texto | Texto | Nota · Quebrar linha |  |
| `linhasDaNota` | Texto | Texto | Nota · Máximo de linhas (0 = sem) |  |
| `textoDaNota` | Texto | Texto | Nota · Texto |  |
| `meuTextoDaNota` | Texto | Texto | Nota · Meu texto |  |
| `mostrarTooltip` | Mais | Mais | Tooltip · Mostrar tooltip |  |
| `tooltipPersonalizado` | Mais | Mais | Tooltip · Personalizado | Tooltip · Usar tooltip personalizado |
| `modeloDeTooltip` | Mais | Mais | Tooltip · Modelo | Tooltip · Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padrão |
| `tooltipComNomeCompleto` | Mais | Mais | Tooltip · Nome completo | Tooltip · Mostrar nome completo do campo no tooltip |
| `tooltipComValorBruto` | Mais | Mais | Tooltip · Valor sem formato | Tooltip · Mostrar também o valor sem formatação |
| `acaoDoClique` | Mais | Mais | Clique · Ação do clique | Clique · Ação do clique (Shift+clique sempre fixa; Esc solta) |
| `permitirHtmlDoLooker` | Mais | Mais | Tooltip · HTML do Looker | Tooltip · Permitir HTML do Looker nas variáveis do tooltip |
| `corDeFundoDoTooltip` | Mais | Mais | Tooltip · Cor de fundo do tooltip | Tooltip · Cor de fundo do tooltip (vazio = do tema) |
| `corDaBordaDoTooltip` | Mais | Mais | Tooltip · Cor da borda do tooltip |  |
| `corDoTextoDoTooltip` | Mais | Mais | Tooltip · Cor do texto do tooltip | Tooltip · Cor do texto do tooltip (vazio = do tema) |
| `tamanhoDoTooltip` | Mais | Mais | Tooltip · Tamanho da fonte do tooltip | Tooltip · Tamanho da fonte do tooltip (px) |
| `copiarValorMV` | Mais | Mais | Duplo clique copia o valor | Clique · Duplo clique copia o valor |
| `destacarItemMV` | Mais | Mais | Destacar item sob o mouse | Clique · Destacar item sob o mouse |
| `animacaoAtiva` | Mais | Mais | Animação · Ativar animações |  |
| `duracaoDaAnimacao` | Mais | Mais | Animação · Duração (ms) |  |
| `atrasoDaAnimacao` | Mais | Mais | Animação · Atraso inicial (ms) |  |
| `cascataDaAnimacao` | Mais | Mais | Animação · Cascata entre itens (ms) |  |
| `suavizacaoDaAnimacao` | Mais | Mais | Animação · Curva da animação |  |
| `quandoAnimar` | Mais | Mais | Animação · Quando animar |  |
| `contadorAnimado` | Mais | Mais | Animação · Números contando | Animação · Números sobem/descem até o valor (contador) |
| `animarBarrasMV` | Mais | Mais | Barras e anéis crescem | Animação · Barras e anéis crescem |
| `destacarMudancaMV` | Mais | Mais | Destacar valor que mudou | Animação · Destacar valor que mudou |
| `pulsoEmAlertaMV` | Mais | Mais | Animação · Pulso em alerta |  |
| `digitosRolandoMV` | Mais | Mais | Animação · Dígitos rolando |  |
| `modoDebug` | Mais | Mais | Modo debug | Modo debug (escreve no console a estrutura dos dados) |
| `configuracaoJson` | Mais | Mais | Configuração em JSON | Configuração em JSON (cole aqui para importar) |
| `aplicarConfiguracaoJson` | Mais | Mais | Aplicar o JSON acima | Aplicar o JSON acima por cima das opções |
| `destacarAoPassarMouse` | Mais | Mais | Clique · Destacar sob o mouse | Clique · Destacar ao passar o mouse |
| `mv_cliente_visivel` | Estilo | Estilo | Campo Cliente · Mostrar |  |
| `mv_cliente_ordem` | Estilo | Estilo | Campo Cliente · Ordem |  |
| `mv_cliente_rotulo` | Estilo | Estilo | Campo Cliente · Rótulo |  |
| `mv_cliente_tipo` | Estilo | Estilo | Campo Cliente · Tipo |  |
| `mv_cliente_formato` | Estilo | Estilo | Campo Cliente · Formato |  |
| `mv_cliente_casas` | Estilo | Estilo | Campo Cliente · Casas decimais |  |
| `mv_cliente_prefixo` | Estilo | Estilo | Campo Cliente · Prefixo |  |
| `mv_cliente_sufixo` | Estilo | Estilo | Campo Cliente · Sufixo |  |
| `mv_cliente_zero` | Estilo | Estilo | Campo Cliente · Texto para zero | Campo Cliente · Texto para zero (vazio = 0) |
| `mv_cliente_nulo` | Estilo | Estilo | Campo Cliente · Texto para nulo |  |
| `mv_cliente_alinhamento` | Estilo | Estilo | Campo Cliente · Alinhamento |  |
| `mv_cliente_tamanhoRotulo` | Estilo | Estilo | Campo Cliente · Tamanho do rótulo | Campo Cliente · Tamanho do rótulo (0 = auto) |
| `mv_cliente_tamanhoValor` | Estilo | Estilo | Campo Cliente · Tamanho do valor | Campo Cliente · Tamanho do valor (0 = auto) |
| `mv_cliente_corRotulo` | Estilo | Estilo | Campo Cliente · Cor do rótulo |  |
| `mv_cliente_corValor` | Estilo | Estilo | Campo Cliente · Cor do valor |  |
| `mv_cliente_icone` | Estilo | Estilo | Campo Cliente · Ícone |  |
| `mv_cliente_meta` | Estilo | Estilo | Campo Cliente · Meta | Campo Cliente · Meta (barra/anel; 0 = 100%) |
| `mv_nivel_visivel` | Estilo | Estilo | Campo Nível · Mostrar |  |
| `mv_nivel_ordem` | Estilo | Estilo | Campo Nível · Ordem |  |
| `mv_nivel_rotulo` | Estilo | Estilo | Campo Nível · Rótulo |  |
| `mv_nivel_tipo` | Estilo | Estilo | Campo Nível · Tipo |  |
| `mv_nivel_formato` | Estilo | Estilo | Campo Nível · Formato |  |
| `mv_nivel_casas` | Estilo | Estilo | Campo Nível · Casas decimais |  |
| `mv_nivel_prefixo` | Estilo | Estilo | Campo Nível · Prefixo |  |
| `mv_nivel_sufixo` | Estilo | Estilo | Campo Nível · Sufixo |  |
| `mv_nivel_zero` | Estilo | Estilo | Campo Nível · Texto para zero | Campo Nível · Texto para zero (vazio = 0) |
| `mv_nivel_nulo` | Estilo | Estilo | Campo Nível · Texto para nulo |  |
| `mv_nivel_alinhamento` | Estilo | Estilo | Campo Nível · Alinhamento |  |
| `mv_nivel_tamanhoRotulo` | Estilo | Estilo | Campo Nível · Tamanho do rótulo | Campo Nível · Tamanho do rótulo (0 = auto) |
| `mv_nivel_tamanhoValor` | Estilo | Estilo | Campo Nível · Tamanho do valor | Campo Nível · Tamanho do valor (0 = auto) |
| `mv_nivel_corRotulo` | Estilo | Estilo | Campo Nível · Cor do rótulo |  |
| `mv_nivel_corValor` | Estilo | Estilo | Campo Nível · Cor do valor |  |
| `mv_nivel_icone` | Estilo | Estilo | Campo Nível · Ícone |  |
| `mv_nivel_meta` | Estilo | Estilo | Campo Nível · Meta | Campo Nível · Meta (barra/anel; 0 = 100%) |
| `mv_visitas_visivel` | Estilo | Estilo | Campo Visitas · Mostrar |  |
| `mv_visitas_ordem` | Estilo | Estilo | Campo Visitas · Ordem |  |
| `mv_visitas_rotulo` | Estilo | Estilo | Campo Visitas · Rótulo |  |
| `mv_visitas_tipo` | Estilo | Estilo | Campo Visitas · Tipo |  |
| `mv_visitas_formato` | Estilo | Estilo | Campo Visitas · Formato |  |
| `mv_visitas_casas` | Estilo | Estilo | Campo Visitas · Casas decimais |  |
| `mv_visitas_prefixo` | Estilo | Estilo | Campo Visitas · Prefixo |  |
| `mv_visitas_sufixo` | Estilo | Estilo | Campo Visitas · Sufixo |  |
| `mv_visitas_zero` | Estilo | Estilo | Campo Visitas · Texto para zero | Campo Visitas · Texto para zero (vazio = 0) |
| `mv_visitas_nulo` | Estilo | Estilo | Campo Visitas · Texto para nulo |  |
| `mv_visitas_alinhamento` | Estilo | Estilo | Campo Visitas · Alinhamento |  |
| `mv_visitas_tamanhoRotulo` | Estilo | Estilo | Campo Visitas · Tamanho do rótulo | Campo Visitas · Tamanho do rótulo (0 = auto) |
| `mv_visitas_tamanhoValor` | Estilo | Estilo | Campo Visitas · Tamanho do valor | Campo Visitas · Tamanho do valor (0 = auto) |
| `mv_visitas_corRotulo` | Estilo | Estilo | Campo Visitas · Cor do rótulo |  |
| `mv_visitas_corValor` | Estilo | Estilo | Campo Visitas · Cor do valor |  |
| `mv_visitas_icone` | Estilo | Estilo | Campo Visitas · Ícone |  |
| `mv_visitas_meta` | Estilo | Estilo | Campo Visitas · Meta | Campo Visitas · Meta (barra/anel; 0 = 100%) |
| `mv_compras_visivel` | Estilo | Estilo | Campo Compras · Mostrar |  |
| `mv_compras_ordem` | Estilo | Estilo | Campo Compras · Ordem |  |
| `mv_compras_rotulo` | Estilo | Estilo | Campo Compras · Rótulo |  |
| `mv_compras_tipo` | Estilo | Estilo | Campo Compras · Tipo |  |
| `mv_compras_formato` | Estilo | Estilo | Campo Compras · Formato |  |
| `mv_compras_casas` | Estilo | Estilo | Campo Compras · Casas decimais |  |
| `mv_compras_prefixo` | Estilo | Estilo | Campo Compras · Prefixo |  |
| `mv_compras_sufixo` | Estilo | Estilo | Campo Compras · Sufixo |  |
| `mv_compras_zero` | Estilo | Estilo | Campo Compras · Texto para zero | Campo Compras · Texto para zero (vazio = 0) |
| `mv_compras_nulo` | Estilo | Estilo | Campo Compras · Texto para nulo |  |
| `mv_compras_alinhamento` | Estilo | Estilo | Campo Compras · Alinhamento |  |
| `mv_compras_tamanhoRotulo` | Estilo | Estilo | Campo Compras · Tamanho do rótulo | Campo Compras · Tamanho do rótulo (0 = auto) |
| `mv_compras_tamanhoValor` | Estilo | Estilo | Campo Compras · Tamanho do valor | Campo Compras · Tamanho do valor (0 = auto) |
| `mv_compras_corRotulo` | Estilo | Estilo | Campo Compras · Cor do rótulo |  |
| `mv_compras_corValor` | Estilo | Estilo | Campo Compras · Cor do valor |  |
| `mv_compras_icone` | Estilo | Estilo | Campo Compras · Ícone |  |
| `mv_compras_meta` | Estilo | Estilo | Campo Compras · Meta | Campo Compras · Meta (barra/anel; 0 = 100%) |
| `mv_trocas_visivel` | Estilo | Estilo | Campo Trocas · Mostrar |  |
| `mv_trocas_ordem` | Estilo | Estilo | Campo Trocas · Ordem |  |
| `mv_trocas_rotulo` | Estilo | Estilo | Campo Trocas · Rótulo |  |
| `mv_trocas_tipo` | Estilo | Estilo | Campo Trocas · Tipo |  |
| `mv_trocas_formato` | Estilo | Estilo | Campo Trocas · Formato |  |
| `mv_trocas_casas` | Estilo | Estilo | Campo Trocas · Casas decimais |  |
| `mv_trocas_prefixo` | Estilo | Estilo | Campo Trocas · Prefixo |  |
| `mv_trocas_sufixo` | Estilo | Estilo | Campo Trocas · Sufixo |  |
| `mv_trocas_zero` | Estilo | Estilo | Campo Trocas · Texto para zero | Campo Trocas · Texto para zero (vazio = 0) |
| `mv_trocas_nulo` | Estilo | Estilo | Campo Trocas · Texto para nulo |  |
| `mv_trocas_alinhamento` | Estilo | Estilo | Campo Trocas · Alinhamento |  |
| `mv_trocas_tamanhoRotulo` | Estilo | Estilo | Campo Trocas · Tamanho do rótulo | Campo Trocas · Tamanho do rótulo (0 = auto) |
| `mv_trocas_tamanhoValor` | Estilo | Estilo | Campo Trocas · Tamanho do valor | Campo Trocas · Tamanho do valor (0 = auto) |
| `mv_trocas_corRotulo` | Estilo | Estilo | Campo Trocas · Cor do rótulo |  |
| `mv_trocas_corValor` | Estilo | Estilo | Campo Trocas · Cor do valor |  |
| `mv_trocas_icone` | Estilo | Estilo | Campo Trocas · Ícone |  |
| `mv_trocas_meta` | Estilo | Estilo | Campo Trocas · Meta | Campo Trocas · Meta (barra/anel; 0 = 100%) |
| `mv_nota_visivel` | Estilo | Estilo | Campo Nota · Mostrar |  |
| `mv_nota_ordem` | Estilo | Estilo | Campo Nota · Ordem |  |
| `mv_nota_rotulo` | Estilo | Estilo | Campo Nota · Rótulo |  |
| `mv_nota_tipo` | Estilo | Estilo | Campo Nota · Tipo |  |
| `mv_nota_formato` | Estilo | Estilo | Campo Nota · Formato |  |
| `mv_nota_casas` | Estilo | Estilo | Campo Nota · Casas decimais |  |
| `mv_nota_prefixo` | Estilo | Estilo | Campo Nota · Prefixo |  |
| `mv_nota_sufixo` | Estilo | Estilo | Campo Nota · Sufixo |  |
| `mv_nota_zero` | Estilo | Estilo | Campo Nota · Texto para zero (vazio = 0) |  |
| `mv_nota_nulo` | Estilo | Estilo | Campo Nota · Texto para nulo |  |
| `mv_nota_alinhamento` | Estilo | Estilo | Campo Nota · Alinhamento |  |
| `mv_nota_tamanhoRotulo` | Estilo | Estilo | Campo Nota · Tamanho do rótulo | Campo Nota · Tamanho do rótulo (0 = auto) |
| `mv_nota_tamanhoValor` | Estilo | Estilo | Campo Nota · Tamanho do valor (0 = auto) |  |
| `mv_nota_corRotulo` | Estilo | Estilo | Campo Nota · Cor do rótulo |  |
| `mv_nota_corValor` | Estilo | Estilo | Campo Nota · Cor do valor |  |
| `mv_nota_icone` | Estilo | Estilo | Campo Nota · Ícone |  |
| `mv_nota_meta` | Estilo | Estilo | Campo Nota · Meta (barra/anel; 0 = 100%) |  |
| `mv_estornos_visivel` | Estilo | Estilo | Campo Estornos · Mostrar |  |
| `mv_estornos_ordem` | Estilo | Estilo | Campo Estornos · Ordem |  |
| `mv_estornos_rotulo` | Estilo | Estilo | Campo Estornos · Rótulo |  |
| `mv_estornos_tipo` | Estilo | Estilo | Campo Estornos · Tipo |  |
| `mv_estornos_formato` | Estilo | Estilo | Campo Estornos · Formato |  |
| `mv_estornos_casas` | Estilo | Estilo | Campo Estornos · Casas decimais |  |
| `mv_estornos_prefixo` | Estilo | Estilo | Campo Estornos · Prefixo |  |
| `mv_estornos_sufixo` | Estilo | Estilo | Campo Estornos · Sufixo |  |
| `mv_estornos_zero` | Estilo | Estilo | Campo Estornos · Texto para zero | Campo Estornos · Texto para zero (vazio = 0) |
| `mv_estornos_nulo` | Estilo | Estilo | Campo Estornos · Texto para nulo |  |
| `mv_estornos_alinhamento` | Estilo | Estilo | Campo Estornos · Alinhamento |  |
| `mv_estornos_tamanhoRotulo` | Estilo | Estilo | Campo Estornos · Tamanho do rótulo | Campo Estornos · Tamanho do rótulo (0 = auto) |
| `mv_estornos_tamanhoValor` | Estilo | Estilo | Campo Estornos · Tamanho do valor | Campo Estornos · Tamanho do valor (0 = auto) |
| `mv_estornos_corRotulo` | Estilo | Estilo | Campo Estornos · Cor do rótulo |  |
| `mv_estornos_corValor` | Estilo | Estilo | Campo Estornos · Cor do valor |  |
| `mv_estornos_icone` | Estilo | Estilo | Campo Estornos · Ícone |  |
| `mv_estornos_meta` | Estilo | Estilo | Campo Estornos · Meta | Campo Estornos · Meta (barra/anel; 0 = 100%) |
| `mv_pendentes_visivel` | Estilo | Estilo | Campo Pendentes · Mostrar |  |
| `mv_pendentes_ordem` | Estilo | Estilo | Campo Pendentes · Ordem |  |
| `mv_pendentes_rotulo` | Estilo | Estilo | Campo Pendentes · Rótulo |  |
| `mv_pendentes_tipo` | Estilo | Estilo | Campo Pendentes · Tipo |  |
| `mv_pendentes_formato` | Estilo | Estilo | Campo Pendentes · Formato |  |
| `mv_pendentes_casas` | Estilo | Estilo | Campo Pendentes · Casas decimais |  |
| `mv_pendentes_prefixo` | Estilo | Estilo | Campo Pendentes · Prefixo |  |
| `mv_pendentes_sufixo` | Estilo | Estilo | Campo Pendentes · Sufixo |  |
| `mv_pendentes_zero` | Estilo | Estilo | Campo Pendentes · Texto para zero | Campo Pendentes · Texto para zero (vazio = 0) |
| `mv_pendentes_nulo` | Estilo | Estilo | Campo Pendentes · Texto para nulo |  |
| `mv_pendentes_alinhamento` | Estilo | Estilo | Campo Pendentes · Alinhamento |  |
| `mv_pendentes_tamanhoRotulo` | Estilo | Estilo | Campo Pendentes · Tamanho do rótulo | Campo Pendentes · Tamanho do rótulo (0 = auto) |
| `mv_pendentes_tamanhoValor` | Estilo | Estilo | Campo Pendentes · Tamanho do valor | Campo Pendentes · Tamanho do valor (0 = auto) |
| `mv_pendentes_corRotulo` | Estilo | Estilo | Campo Pendentes · Cor do rótulo |  |
| `mv_pendentes_corValor` | Estilo | Estilo | Campo Pendentes · Cor do valor |  |
| `mv_pendentes_icone` | Estilo | Estilo | Campo Pendentes · Ícone |  |
| `mv_pendentes_meta` | Estilo | Estilo | Campo Pendentes · Meta | Campo Pendentes · Meta (barra/anel; 0 = 100%) |

</details>
