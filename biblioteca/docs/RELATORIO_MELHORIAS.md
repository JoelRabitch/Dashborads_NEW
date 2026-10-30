# Relatório — Melhorias v3

Branch `agente/novas-viz`, versão **v3.1** (URLs em `dist/URLS.md`).
"Testado" aqui quer dizer testado em simulação (jsdom, sem layout real);
tudo que depende de layout, fonte, CDN ou do editor do Looker está em
`docs/TESTE_NO_LOOKER.md`, seção "Melhorias v3", para conferir no Looker
real. Nada aqui foi conferido no Looker.

Estado final: `npm test` **927 ok** (1 pulado: o teste "sem pacotes", que
só roda no modo sem pacotes); `npm run testar-sem-pacotes` **921 ok** (6
pulados: os do pacote Café); `npm run seguranca` sem violação; build
determinístico (dois builds seguidos, `git status` limpo).

## 1. O que foi feito, por item

| Item | Feito | Testes automáticos | Conferir no Looker real |
|---|---|---|---|
| 5.1 Tooltip preso | Drill sem link não fixa mais (só "Fixar tooltip" ou Shift); tooltip some antes do drill, no blur/focus da janela, ao sair do documento; botão "×"; Esc e clique fora | `tooltip_v3` (7 de 8 falhavam antes) + famílias | Menu de drill por cima, clique fora do iframe |
| 5.2 Tabela: rolagem | Mede antes de redesenhar; troca as linhas de uma vez; só redesenha se a janela mudou; sem animação/destaque na rolagem; posição preservada | `tabela_rolagem_v3` (5 de 6 falhavam antes) | 500×50 com roda e barra |
| 5.1b Painel | 4 abas (Dados, Estilo, Texto, Mais) num ponto único; 352 rótulos encurtados (30/40) | `painel_v3` | Abas inteiras e ordem alfabética; nenhum "…" |
| 5.1c Título/subtítulo/nota | Componente único com faixas próprias, 35 opções novas; nota nunca cobre o gráfico; tile pequeno esconde a nota | `cabecalho_v3` (geometria em 4 tamanhos) | Visual padrão igual ao anterior |
| 5.3 Busca "contém" | Várias palavras, aspas, -exclusão, colunas, valor bruto, realce, contador | `tabela_busca_v3` | O defeito relatado NÃO se reproduz em simulação (ver §5) |
| 5.4 Fórmulas | Interpretador próprio; 8 espaços fixos; pivô (as duas formas); totais; regra de cor; erro na célula | `formulas_v3` (9), `tabela_formulas_v3` (6) | Fórmulas com os nomes reais dos campos |
| 5.5 Layouts | 9 layouts, todos com busca/ordem/filtro/seleção/virtualização | `tabela_layouts_v3` (500×50) | Visual de cada layout |
| 5.6 bump_chart | Valor ao lado do círculo, margens pelos textos, camadas, halo; catmull sem ondas; curva "bump"; "Posição do valor" | `bump_v3` ((a),(b),(d) falhavam antes) | Tile do print relatado |
| 5.7 diagrama_venn | Layout "Moderno" (padrão) + "Clássico"; preenche a área; nomes dentro/fora/legenda; números com halo; hover/seleção novos | `venn_v3` (2–5 conjuntos, 2 tamanhos) | Estética e hover |
| 5.8–5.12 Árvores | Base comum; abrir/fechar animado (FLIP); centralizar; Texto longo; grade (espaços, tamanho por árvore, linhas-guia) | `arvores_v3` | Animação, centralização, rolagem |
| 5.13 org_chart | Botões (defeito: a opção nunca existia aqui); estética; contador contido; rolagem só quando precisa | `arvores_v3` | Balões, contador, barras de rolagem |
| 5.13b dot_plot_denso + família | Rótulo extremo inteiro ("Rótulo na borda"), nomes por Texto longo, eixo sem negativo artificial, régua separada; auditoria de 6 gráficos | `dot_plot_v3` (3 falhavam antes), `auditoria_borda_v3` | Rótulo do maior valor |
| 5.14 cartao_multivalor | Gráfico novo (ver README da biblioteca: como montar o Explore) | `cartao_multivalor` (10) | Cadastro e visual |
| 5.14b–h Pacotes / Café | Registro de pacotes; Café com 15 ícones, 3 formas, 5 paletas, 2 escalas, xícara; ícone por valor; "Estilo do ícone"; ícones no kpi_vivo | `pacotes_v3`, `testar-sem-pacotes` | Listas com "Nenhum"; xícara |
| 5.14i (opcional) | **Não feito** (Cardápio, Comanda, vapor) | — | — |
| 5.15 / 5.15b | Tag v3.1, URLs por tag e por hash; `config/repo.json`; varredura; `docs/MIGRACAO.md` | `portabilidade_v3` | URLs da tag no CDN |

## 2. Mudanças de comportamento a saber

- **Clique sem link no modo "Drill" não fixa mais o tooltip** (5.1). Antes
  fixava — e era assim que ele ficava preso. Para fixar: "Ação do clique" =
  Fixar tooltip, ou Shift+clique. Vale para qualquer valor salvo.
- O tooltip some antes de abrir o menu de drill e quando a janela perde ou
  recupera o foco.
- Abas do painel: Dados, Estilo, Texto, Mais (as opções mudaram de aba e
  de rótulo; ids, tipos e padrões iguais).
- A nota de cada gráfico saiu de cima da área e foi para uma faixa própria.
- Venn: o layout padrão passa a ser o Moderno (o anterior continua como
  "Clássico").
- Árvores, organograma e dot plot: "Texto longo" = Mostrar inteiro por
  padrão — os nomes não são mais cortados (a coluna/célula/cartão cresce).
- dot_plot_denso/dumbbell: o eixo não começa mais em negativo só por causa
  da folga visual quando todos os valores são positivos.
- Curva "catmull" (todos os gráficos de série): não ultrapassa mais a faixa
  entre os pontos.

## 3. Opções salvas que você talvez queira trocar nos tiles

| Gráfico | Opção (id) | Valor salvo | Sugestão | Por quê |
|---|---|---|---|---|
| bump_chart | `curvaDaLinha` | `catmull` | `bump` | O catmull foi corrigido (sem ondas), mas "bump" sai e chega na horizontal no centro dos círculos — é o visual clássico de bump chart |
| todos | `acaoDoClique` | `drill` | manter, ou `fixar` | Com `drill`, clique sem link não fixa mais; se quiser fixar sempre, use `fixar` |
| tabela_completa | `animarEntradaDasLinhas`, `quandoAnimar` | `true`, `sempre` | manter | A rolagem não anima mais; só carregar/ordenar/buscar animam |
| árvores | `truncarRotulo` | `60` | manter | Só vale no modo "Cortar com reticências"; no padrão novo nada é cortado |
| dot_plot_denso | `larguraDoNome` | `80` | manter | Só vale nos modos de corte; no padrão a coluna segue o maior nome |
| org_chart | `posicaoDoRotulo` | (se `fora`) | "Alinhamento do texto" = Centro | O texto à direita vinha de "posição = fora"; agora há alinhamento próprio |
| diagrama_venn | `mostrarLegenda` | `true` | manter | No Moderno vale "Legenda do Venn" (padrão: oculta quando os nomes estão no diagrama) |
| diagrama_venn | `mostrarTotalDoConjunto` | `true` | `false`, se os nomes ficarem longos | O total entra no nome do conjunto |

## 4. Ids novos

Nenhum id antigo sumiu nem mudou de tipo ou padrão (`test/opcoes.test.mjs`
sobre `docs/opcoes/<id>.antes.json`, gerados no início da v3). Ids novos,
por gráfico (estáticos + dinâmicos), com o rótulo e a aba de cada um em
`docs/opcoes/ABAS.md` (marcados com ★) e em `docs/opcoes/<id>.depois.json`:

- Todos os 22 gráficos antigos: os 35 do componente de título/subtítulo/nota
  (`mostrarTitulo` … `meuTextoDaNota`); "Pacote temático" (`pacoteTematico`)
  nos que têm listas com itens de pacote; "Estilo do ícone" (`estiloDoIcone`)
  nos que têm lista de ícones.
- tabela_completa (136): busca (`modoDaBusca`, `colunasDaBusca`, `buscarEm`,
  `realcarBusca`), 8 × 11 de fórmulas (`calc1Nome` … `calc8Alvo`), layouts
  (`layoutDaTabela`, `camposDoCartao`, `colunasDosCartoes`,
  `colunasDeCamposDoCartao`, `secoesDoLayout`), ícone por valor.
- bump_chart: `posicaoDoValor`. diagrama_venn: `layoutDoVenn`,
  `margemDoVenn`, `tamanhoDoTextoDoVenn`, `nomesDosConjuntos`,
  `removerDoNome`, `apelidosDosConjuntos`, `legendaDoVenn`,
  `duracaoDaTransicaoDoVenn`.
- arvores_multiplas (66 + dinâmicos `largura_<árvore>`/`altura_<árvore>`) e
  org_chart (75): opções comuns (animação de abrir/fechar, centralizar,
  Texto longo, ícone por valor) e as próprias (ver LOG, 5.8–5.13).
- dot_plot_denso: `rotuloNaBorda`, Texto longo, `larguraMaximaDosNomes`.
- kpi_vivo: `progressoEmXicara`, `estiloDoIcone` (+ novos valores em `iconeDoKpi`).
- cartao_multivalor: gráfico novo (todas as opções são novas).

## 5. O que não foi possível ou ficou diferente do pedido

- **5.3**: o sintoma relatado ("BLACK" não acha `MTCBLACKBR`) não se
  reproduz em simulação — a busca antiga já procurava em qualquer posição.
  Hipóteses: campo com `html:` no LookML ou tile com URL antiga. O passo
  manual pede o código exato se continuar.
- **5.4**: validar a fórmula "no painel" não é possível sem registrar o
  painel a cada tecla (proibido); o erro aparece na célula e no aviso.
- **5.7**: áreas proporcionais aos valores não foram implementadas (com 4–5
  conjuntos não há solução exata; o layout fixo garante todas as regiões).
- **5.12**: arrastar a borda da célula não foi feito — `updateConfig` não é
  confirmado na API; entregues os campos numéricos.
- **5.14i** (opcional): não feito.
- O kpi_vivo mantém o título dentro do cartão (cabeçalho próprio): as opções
  de posição acima/abaixo do componente não se aplicam a ele.

## 6. Gráficos que mudaram (hash novo no `URLS.md`)

Os **23** — os 22 antigos (o núcleo mudou: tooltip, painel, cabeçalho,
pacotes) e o novo `cartao_multivalor`. Nenhum ficou igual. As URLs antigas
(v2) continuam funcionando, fixadas no hash antigo; para receber as
melhorias, troque o Main de cada visualização pela URL principal da v3.1.
