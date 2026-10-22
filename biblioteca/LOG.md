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

### PRÓXIMA AÇÃO EXATA

Etapa 3 (Tier 0): escrever os primeiros arquivos do núcleo em
`src/core/`: `dom.js` (helpers seguros de DOM/SVG), `errors.js` (mensagens em
português), `theme.js` (tokens de tema e paletas) e `format.js` (formatação de
números/datas respeitando `value_format`).
