# Como adicionar um gráfico novo

Passo a passo curto. Deve levar poucos minutos para um gráfico simples.

## 1. Copie o modelo

```bash
cd biblioteca
cp -r src/charts/_template src/charts/meu_grafico
```

## 2. Edite `src/charts/meu_grafico/index.js`

Troque, no mínimo:

```js
defineViz({
  id: 'meu_grafico',            // snake_case, igual ao nome da pasta
  label: 'Meu Gráfico',         // como aparece para o usuário no Looker

  opcoes: montarOpcoes(
    { /* suas opções específicas */ },
    blocoDeDados(), blocoDeCores(), blocoDeRotulos(),
    blocoDeLegenda(), blocoDeTooltip(), blocoDeInteracao(),
    blocoDeAnimacao(), blocoDeTema(), blocoAvancado()
  ),

  exigencia: {                  // validado ANTES do render
    dimensoesMin: 1,
    medidasMin: 1,
    aceitaPivo: false,          // true só se você LER os pivôs de verdade
  },

  render(ctx) { /* desenhe */ },
});
```

E atualize o cabeçalho do arquivo (o que faz, campos esperados, opções).

## 3. Registre em `config/charts.json`

```json
{
  "id": "meu_grafico",
  "label": "Meu Gráfico",
  "tier": 1,
  "pasta": "meu_grafico",
  "resumo": "Uma frase do que ele faz.",
  "explore": "1 dimensão + 1 medida. Não aceita pivô.",
  "aceitaPivo": false,
  "fixtures": ["semPivo", "duasDimensoes", "rotulosLongos"]
}
```

As `fixtures` são as que o smoke test vai usar além das básicas. Use os
nomes de `test/fixtures/index.mjs`.

## 4. Construa, teste e confira a segurança

```bash
npm run build        # gera dist/meu_grafico.js e atualiza o MANIFEST
npm test             # smoke test com as fixtures
npm run seguranca    # varre src/ e dist/ pela lista proibida
```

## 5. Olhe com os próprios olhos

Abra `test/harness.html` no navegador (duplo clique), escolha o gráfico e a
fixture. Teste pelo menos:

- com e sem pivô (se aceitar pivô);
- dados vazios e só com nulos;
- rótulos muito longos;
- volume grande (`grande5k`);
- tema claro e escuro (botão "Alternar tema").

## 6. Commite

```bash
git add biblioteca/
git commit -m "viz: meu_grafico – opções, render e testes"
git push origin agente/novas-viz
```

---

## O que você ganha de graça (não reimplemente)

| Já vem pronto | De onde |
|---|---|
| `done()` sempre chamado, inclusive em erro | `define-viz` |
| Validação do formato + mensagem em português | `define-viz` + `errors.js` |
| Tema claro/escuro/personalizado | `theme.js` |
| Título, subtítulo, faixa de avisos, estado vazio | `define-viz` |
| Limpeza de listeners/timers entre atualizações | `define-viz` |
| Redesenho quando o tile muda de tamanho | `define-viz` |
| Modo debug no console | `define-viz` |
| Paletas, escalas de cor, cor por valor | `theme.js` + `scales.js` |
| Tooltip (padrão e com template `{{campo}}`) | `tooltip.js` |
| Legenda interativa com layout | `legend.js` |
| Arraste que não trava no iframe, zoom, brush, busca | `interaction.js` |
| Animações respeitando `prefers-reduced-motion` | `animate.js` |

## O `ctx` que o `render` recebe

| Campo | O que é |
|---|---|
| `modelo` | Dados já normalizados (ver `ARQUITETURA.md`) |
| `config` | Config do painel Edit (já com o JSON do bloco Avançado aplicado) |
| `tema` | Tokens resolvidos: `fundo`, `texto`, `borda`, `grade`, `destaque`... |
| `raiz` | O `<div>` onde desenhar |
| `largura`, `altura` | Tamanho útil em px |
| `ponte` | Adapter: `textoDaCelula`, `abrirDrill`, `temDrill`, `crossfilter`... |
| `eventos` | Gerenciador de listeners (limpo automaticamente) |
| `estado` | Objeto que **sobrevive** entre atualizações (rolagem, ordenação...) |
| `primeiraRenderizacao` | `true` só na primeira vez |
| `avisar(msg)` | Mostra uma faixa de aviso discreta |
| `mostrarVazio(msg)` | Mostra o estado "sem dados" |
| `limparRaiz()` | Esvazia a área de desenho |
| `agendarQuadro(fn)` / `agendarTimer(fn, ms)` | Agendamentos que são cancelados sozinhos |

## Regras que o revisor (e o teste) vão cobrar

1. **Nunca** `innerHTML` com dado — use `textContent` (`dom.js` já ajuda).
2. **Nunca** `fetch`, `eval`, `localStorage`, `window.open` etc. (ver seção 7
   do `PROMPT_AGENTE.md`). O `npm run seguranca` reprova.
3. **Nunca** chame `looker.*` ou `LookerCharts.*` direto — use `ctx.ponte`.
4. Toda mensagem de erro precisa dizer **como arrumar o Explore**.
5. Volume grande precisa de canvas ou virtualização.
6. Animação precisa poder ser desligada e respeitar `prefers-reduced-motion`
   (use `opcoesDeAnimacao()` de `animate.js`).
