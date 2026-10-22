# MANIFEST — visualizações da biblioteca

Gerado automaticamente pelo build em 2026-10-22 01:56:22 (commit `9e50e5f`).

## Como cadastrar no Looker

Admin > Visualizations > Add Visualization:

- **ID**: o da tabela abaixo
- **Label**: o da tabela abaixo
- **Main**: a URL do arquivo (modelo na última coluna)
- **Dependencies**: **VAZIO** — todos os arquivos são autocontidos

Troque `COMMIT` pelo hash do commit que você quer fixar (nunca use `@main`: assim a visualização não muda sozinha depois de testada).

| ID | Label | Arquivo | Dependencies | Como montar o Explore | URL para o campo Main |
|---|---|---|---|---|---|
| `tabela_completa` | Tabela Completa | `dist/tabela_completa.js` | (vazio) | 1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis). | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/tabela_completa.js` |
| `diagrama_venn` | Diagrama de Venn | `dist/diagrama_venn.js` | (vazio) | Uma dimensão com os conjuntos ("A", "A,B"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô. | `https://cdn.jsdelivr.net/gh/JoelRabitch/Dashborads_NEW@COMMIT/biblioteca/dist/diagrama_venn.js` |

## Detalhes por visualização

### Tabela Completa (`tabela_completa`)

Tabela com pivôs agrupados, agrupamento de linhas, formatação condicional, tipos de célula (barras, sparklines, badges) e campos animados.

- **Tier**: 1
- **Explore**: 1 ou mais dimensões e 1 ou mais medidas. Aceita pivô (vira cabeçalho de dois níveis).
- **Aceita pivô**: sim
- **Tamanho do bundle**: 169.7 KB

### Diagrama de Venn (`diagrama_venn`)

Diagrama de Venn de 2 a 5 conjuntos, lendo três formatos de dados (uma linha por região, uma linha por item e conjunto, ou colunas sim/não).

- **Tier**: 1
- **Explore**: Uma dimensão com os conjuntos ("A", "A,B"), ou duas dimensões (item e conjunto), ou várias colunas sim/não. Não aceita pivô.
- **Aceita pivô**: não
- **Tamanho do bundle**: 131.2 KB
