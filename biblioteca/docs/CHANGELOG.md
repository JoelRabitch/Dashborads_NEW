# CHANGELOG

Formato: mais recente primeiro. Datas em AAAA-MM-DD.

## [0.1.0] — 2026-10-21

Primeira versão: infraestrutura (Tier 0).

### Adicionado

- **Núcleo** (`src/core/`):
  - `looker-adapter.js` — isolamento total da API do Looker, com detecção de
    recurso e plano B em cada método.
  - `data-model.js` — modelo de dados estável (pivôs, total de linha,
    campos ocultos, totais).
  - `define-viz.js` — ciclo de vida: `done()` sempre, validação, tema,
    limpeza entre atualizações, redesenho no resize, modo debug.
  - `options-kit.js` — 14 blocos de opções reutilizáveis + opções dinâmicas.
  - `theme.js` — temas claro/escuro/personalizado, 11 paletas categóricas
    (4 daltonismo-seguras) e 10 escalas contínuas.
  - `format.js` — conversão do `value_format` do Looker, datas pt-BR,
    template `{{campo}}`.
  - `dom.js`, `errors.js`, `scales.js`, `shapes.js`, `animate.js`,
    `tooltip.js`, `legend.js`, `interaction.js`.
- **Build** (`build/build.mjs`): esbuild → `dist/<id>.js` autocontido em
  IIFE não-minificado, com cabeçalho (id, label, versão, data, commit), mais
  `dist/MANIFEST.md`.
- **Checagem de segurança** (`build/checagem-seguranca.mjs`): varre `src/` e
  `dist/` pela lista proibida, distinguindo código de comentário.
- **Testes**: `test/harness.html` (simulador do Looker) e
  `test/smoke.test.mjs` (jsdom, todas as fixtures, volume grande,
  atualizações repetidas).
- **Fixtures** (`test/fixtures/`): 21 conjuntos sintéticos — sem pivô, com
  pivô (com e sem total de linha), temporal, hierarquia, pai/filho,
  conjuntos em 3 formatos, OHLC, vazio, só nulos, rótulos longos, 5.000 e
  50.000 linhas.
- **Documentação**: `ARQUITETURA.md`, `COMPAT.md`,
  `COMO_ADICIONAR_GRAFICO.md`, este changelog.

### Corrigido (durante o desenvolvimento)

- `format.js`: datas sem fuso explícito voltavam um dia em fusos negativos
  (`new Date('2026-03-05')` é meia-noite UTC). Agora são montadas componente
  a componente, em hora local.
- `_template`: declarava aceitar pivô mas não lia dados pivotados, caindo no
  estado vazio em silêncio. Agora declara `aceitaPivo: false` e documenta o
  padrão correto.

### Notas de compatibilidade

- `registerOptions` **substitui** o painel de opções inteiro — o adapter
  sempre manda estáticas + dinâmicas juntas (ver `COMPAT.md`, seção 4.1).
- Arraste usa Pointer Events + `setPointerCapture` para não travar dentro do
  iframe do Looker (ver `COMPAT.md`, seção 4.2).
