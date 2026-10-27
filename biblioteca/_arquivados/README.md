# _arquivados

Os 32 gráficos retirados da biblioteca pelo PROMPT_AGENTE v2 (seção 5).
O estado completo antes da limpeza está na tag Git `antes-da-limpeza`.

Esta pasta NÃO entra no build (`build/build.mjs` só lê `config/charts.json`),
nos testes (`npm test` só roda `test/*.test.mjs`) nem na checagem de
segurança (`build/checagem-seguranca.mjs` só varre `src/` e `dist/`).
Os testes daqui importam caminhos antigos (`../src/charts/<id>`) e não
rodam como estão: são registro histórico, não código vivo.

- `src/charts/<id>/` — código-fonte
- `dist/<id>.js` — último bundle publicado (as URLs antigas do jsDelivr
  continuam valendo, porque apontam para commits antigos)
- `test/` — testes específicos
- `config/charts.arquivados.json` — as entradas retiradas do registro
