/*
 * Gera /src/world_topology_110m.js e /src/world_topology_50m.js a partir do
 * pacote npm "world-atlas" (versão 2.0.2, publicado em 2019 — dados de
 * fronteiras do Natural Earth já empacotados em TopoJSON pelo próprio D3).
 *
 * Isso é uma ferramenta de BUILD rodada localmente por quem mantém este
 * repositório (uso `node tools/gerar_topologia_mundial.js`), node puro,
 * fora do navegador — não é código da visualização. É por isso que ela
 * pode usar fetch aqui: nada disso roda dentro do Looker. O arquivo final
 * embutido (src/world_topology_*.js) não faz nenhuma chamada de rede.
 *
 * Como funciona:
 *   1) Baixa countries-110m.json e countries-50m.json do world-atlas@2.0.2
 *      via jsDelivr (URL com versão fixa).
 *   2) Verifica que o JSON é um Topology válido (objects.countries e
 *      objects.land presentes).
 *   3) Escreve cada um como `window.WORLD_TOPOLOGY_110M = {...};` /
 *      `window.WORLD_TOPOLOGY_50M = {...};` em /src.
 *
 * Reexecute este script se quiser atualizar os dados do mapa no futuro.
 */
const fs = require('fs');
const path = require('path');

const FONTES = [
  { resolucao: '110m', url: 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json', global: 'WORLD_TOPOLOGY_110M', destino: '../src/world_topology_110m.js' },
  { resolucao: '50m', url: 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json', global: 'WORLD_TOPOLOGY_50M', destino: '../src/world_topology_50m.js' }
];

async function gerar(fonte) {
  const resp = await fetch(fonte.url);
  if (!resp.ok) throw new Error('Falha ao baixar ' + fonte.url + ': HTTP ' + resp.status);
  const topologia = await resp.json();

  if (topologia.type !== 'Topology' || !topologia.objects || !topologia.objects.countries || !topologia.objects.land) {
    throw new Error('Formato inesperado em ' + fonte.url + ' — esperava um Topology com objects.countries e objects.land');
  }

  const cabecalho = [
    '/*',
    ' * Dados geográficos embutidos (' + fonte.resolucao + ') — gerado por tools/gerar_topologia_mundial.js',
    ' * a partir do pacote npm world-atlas@2.0.2 (dados do Natural Earth).',
    ' * NÃO é um recurso carregado em tempo de execução: este arquivo só',
    ' * define uma variável global (window.' + fonte.global + ') lida pelo',
    ' * mapa_customizavel.js. Sem fetch, sem chamada de rede.',
    ' *',
    ' * Formato: TopoJSON Topology com objects.countries (um Feature/',
    ' * Geometry por país, para preencher e para fronteiras internas) e',
    ' * objects.land (massa de terra unificada, para o contorno externo).',
    ' * Use topojson.feature()/topojson.mesh() (da dependência',
    ' * topojson-client) para converter em GeoJSON antes de desenhar.',
    ' */',
    ''
  ].join('\n');

  const corpo = 'window.' + fonte.global + ' = ' + JSON.stringify(topologia) + ';\n';
  const destinoAbs = path.join(__dirname, fonte.destino);
  fs.writeFileSync(destinoAbs, cabecalho + corpo);
  console.log('Gerado', destinoAbs, '—', (fs.statSync(destinoAbs).size / 1024).toFixed(1), 'KB');
}

(async () => {
  for (const fonte of FONTES) {
    await gerar(fonte);
  }
})().catch((e) => { console.error(e); process.exit(1); });
