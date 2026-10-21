# looker-viz-mapa-customizavel (pacote npm só para distribuição via CDN)

Isso **não é uma biblioteca** para `require`/`import` em código Node. É só um
jeito de colocar `mapa_customizavel.js` e os arquivos de dados do mapa-múndi
no caminho `cdn.jsdelivr.net/npm/...` do jsDelivr — que se mostrou estável —
em vez de `cdn.jsdelivr.net/gh/...` (proxy direto do GitHub), que em alguns
ambientes corporativos é bloqueado pelo navegador com `ERR_BLOCKED_BY_ORB`
(a suspeita é que ferramentas de segurança de rede tratam um link de
repositório GitHub desconhecido com mais desconfiança do que um pacote npm
popular/já conhecido).

## Como publicar (ou atualizar) uma nova versão

1. **Copie a versão mais recente** dos arquivos de `/src` para cá:
   ```
   cp ../src/mapa_customizavel.js .
   cp ../src/world_topology_110m.js .
   cp ../src/world_topology_50m.js .
   ```
2. **Suba o número de versão** em `package.json` (ex.: `1.0.0` → `1.0.1`) —
   o npm não deixa publicar duas vezes a mesma versão, e o jsDelivr
   recomenda fixar uma versão específica (nunca `@latest`), então cada
   atualização precisa de uma versão nova.
3. Rode (precisa de uma conta grátis em https://www.npmjs.com/signup, se
   ainda não tiver):
   ```
   npm login
   npm publish
   ```
4. As novas URLs ficam:
   ```
   https://cdn.jsdelivr.net/npm/looker-viz-mapa-customizavel@<VERSÃO>/mapa_customizavel.js
   https://cdn.jsdelivr.net/npm/looker-viz-mapa-customizavel@<VERSÃO>/world_topology_110m.js
   ```
5. Atualize o campo **Main** (e a Dependency do `world_topology_110m.js`) no
   Admin > Visualizations do Looker com as novas URLs.

`npm publish --dry-run` mostra o conteúdo do pacote sem publicar de
verdade, útil para conferir antes.
