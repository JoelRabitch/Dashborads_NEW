# Migrar o repositório para outra conta (ou servidor interno)

A migração é uma troca de configuração: o dono e o nome do repositório
existem num lugar só, `biblioteca/config/repo.json` (um teste automático,
`test/portabilidade_v3.test.mjs`, falha se eles aparecerem em qualquer
outro arquivo versionado, além dos gerados `dist/URLS.md` e `dist/URLS.csv`
e da cópia das instruções `PROMPT_AGENTE.md`).

## 1. Copiar o repositório com todo o histórico, branches e tags

```bash
git clone --mirror <URL do repositório atual> repo-espelho.git
cd repo-espelho.git
git push --mirror <URL do repositório novo>
```

`--mirror` leva todas as branches, todas as tags (inclusive as `v3.N`) e
todo o histórico. Não use `--force` em um repositório novo que já tenha
conteúdo: crie-o vazio.

## 2. Atualizar a configuração

1. `biblioteca/config/repo.json`:
   - `dono` e `repositorio`: os do repositório novo;
   - `hospedagem`:
     - `"jsdelivr"` — só funciona se o repositório novo for **público no
       GitHub** (pelo que se sabe, o jsDelivr não serve repositórios
       privados nem outros servidores Git);
     - `"base-url"` — para repositório privado ou servidor interno. Preencha
       `prefixoBaseUrl` (ex.: `https://arquivos.exemplo.interno/looker-viz`)
       e publique os `biblioteca/dist/*.js` de cada versão em
       `<prefixoBaseUrl>/<tag>/<id>.js` e também em
       `<prefixoBaseUrl>/<hash do commit>/<id>.js` (a URL alternativa). O
       endereço precisa ser alcançável pelo navegador de quem abre o Looker.
2. `biblioteca/package.json`: o campo `name`/`description`, se quiser.
3. `README.md` da raiz e da biblioteca: links para o repositório novo, se
   houver.
4. O `PROMPT_AGENTE.md` da raiz (e a cópia em `biblioteca/`): a URL do
   repositório na seção 1 e a seção 5.15 (URLs).
5. No clone novo: `git remote set-url origin <URL do repositório novo>`.

## 3. Regenerar as URLs

```bash
cd biblioteca
npm install
npm run build && npm test
git tag v3.N+1            # tag NOVA no commit dos bundles (nunca mova uma tag existente)
git push origin v3.N+1
npm run urls -- v3.N+1    # gera dist/URLS.md e URLS.csv com o dono/repo/hospedagem novos
git add dist/URLS.md dist/URLS.csv && git commit -m "docs: URLs da versão v3.N+1"
```

## 4. Atualizar o Looker — atenção

As URLs antigas apontam para o repositório antigo. **Se o repositório
antigo for apagado ou ficar privado, todas as visualizações cadastradas
param de carregar.** Antes disso, em **Admin > Visualizations**, edite cada
visualização e troque o campo **Main** pela URL nova de `dist/URLS.md`
(o ID não muda, então os tiles e as opções salvas continuam valendo).
