/*
 * Mapa Customizável — looker.plugins.visualizations.add
 * ========================================================================
 * Uma visualização só com DOIS MODOS alternáveis por opção ("Map Mode"):
 *   - Mapa Plano: mapa-múndi vetorial com as 16 projeções pedidas, pan e
 *     zoom independentes, "Fit to Data" ou posição manual.
 *   - Globo: a mesma base de dados e estilo, mas em projeção ortográfica
 *     que gira ao arrastar (com inércia suave), zoom pela roda do mouse,
 *     botão "Resetar", rotação automática opcional, grade de coordenadas,
 *     brilho de atmosfera na borda e "iniciar centralizado nos dados". O
 *     recorte do lado oculto do globo (continentes e fronteiras) usa o
 *     clipAngle(90) nativo do d3.geoPath — por isso não tem o problema de
 *     "lacunas" que uma implementação manual de recorte teria.
 *
 * Em ambos os modos: pontos (cor e raio, fixos ou automáticos), tooltip
 * padrão e customizado, "Display Coordinates", drill ao clicar no ponto, e
 * detecção de latitude/longitude em dois formatos.
 *
 * AINDA NÃO IMPLEMENTADO (ver README.md para o roteiro completo):
 *   - Heatmaps (densidade/automagic/3D), ícones, cor por valor/categoria +
 *     legenda, linhas, áreas, seção "Layers" (liga/desliga/ordem).
 *   O seletor "Plot Mode" já existe mas só tem a opção "Points" por ora.
 *
 * O QUE FAZ
 *   Desenha um mapa-múndi vetorial — plano ou como globo — sem tiles de
 *   servidor nenhum (os contornos dos países vêm de um arquivo de dados
 *   embutido, carregado via Dependencies) e plota um ponto por linha de
 *   dado, usando latitude e longitude. Renderiza em <canvas> (não SVG) com
 *   d3.geoPath, para aguentar muitos pontos com arraste suave.
 *
 * DEPENDÊNCIAS (cadastrar em Admin > Visualizations > Dependencies, NESTA
 * ORDEM EXATA — cada uma depende da anterior já estar carregada):
 *   1) https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js
 *   2) https://cdn.jsdelivr.net/npm/d3-geo-projection@4.0.0/dist/d3-geo-projection.min.js
 *      (estende o d3 global com a projeção Kavrayskiy7, que não vem no
 *      pacote principal do d3)
 *   3) https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js
 *   4) URL do seu world_topology_110m.js (ou world_topology_50m.js — ver
 *      a opção "Resolução do mapa" nas opções "Map")
 *   5) URL deste arquivo (mapa_customizavel.js)
 * Nenhuma dessas faz chamada de rede em tempo de execução além do
 * carregamento inicial do próprio script (é assim que "Dependencies"
 * funciona no Looker); o mapa em si (TopoJSON) já vem embutido no arquivo
 * world_topology_*.js, sem fetch.
 *
 * CAMPOS ESPERADOS
 *   Latitude/longitude, de uma das duas formas (escolha em "Modo de
 *   coordenadas", opções detectam automaticamente quando possível):
 *     1) Duas dimensões numéricas (latitude e longitude).
 *     2) Um campo do tipo "location" do LookML — o valor mais comum é uma
 *        string "lat,lon", mas esta visualização também tenta reconhecer
 *        um array [lat, lon] ou um objeto {latitude, longitude} / {lat,
 *        lng} / {lat, lon}, já que a API de visualização não documenta
 *        isso com certeza. Ligue "Modo debug" nas opções e abra o console
 *        do navegador para ver exatamente o que o Looker está mandando no
 *        seu ambiente, e me avise se o formato real for diferente do que
 *        tratamos aqui.
 *   NÃO aceita pivô — se a consulta tiver pivô, mostramos um erro claro
 *   pedindo para removê-lo.
 *   Campos opcionais: uma dimensão de rótulo (tooltip); medida para
 *   tamanho do ponto e campo de cor entram na Etapa 3.
 *
 * OPÇÕES (painel Edit) — seções "Plot", "Map", "Points", "Style", "Globo"
 * (a seção "Layers" ainda não existe):
 *   Plot: Plot Mode (só "Points" por enquanto), Custom Tooltip, template
 *     do tooltip customizado.
 *   Map: Map Mode (Mapa Plano/Globo), Map Style (Custom/Light/Dark/
 *     Satellite-like — paleta, sem tiles de verdade), Resolução do mapa
 *     (110m/50m), Projection (as 16 da especificação — só usada no modo
 *     Mapa Plano), Map Position (Fit to Data/Custom) + centro/zoom
 *     customizados, Allow Panning, Allow Zooming, Display Coordinates,
 *     Modo debug.
 *   Points: Point Color, Point Radius (em branco = automático).
 *   Style: Background/Ocean Color, Map Color, Outer/Inner Border Color,
 *     Outer/Inner Border Width, Show Full Field Name in Tooltips (usadas
 *     nos dois modos — no Globo, "Background/Ocean Color" vira a cor da
 *     esfera e "Map Color" a cor da terra).
 *   Globo (só tem efeito com Map Mode = "Globo"): mostrar grade de
 *     coordenadas + sua cor, brilho na borda (atmosfera), iniciar
 *     centralizado nos dados, rotação inicial (longitude/latitude, usada
 *     quando NÃO centraliza nos dados), sensibilidade do arraste, inércia
 *     suave ao soltar, rotação automática + velocidade, esconder pontos do
 *     lado oculto do globo.
 *   Dados (seção nossa, não existia nos dois mapas originais): Modo de
 *     coordenadas, Campo de localização, Campo de latitude, Campo de
 *     longitude — aparecem via registerOptions depois da 1ª consulta.
 *
 * REGRAS DE SEGURANÇA SEGUIDAS
 *   Sem fetch/XHR/sendBeacon/eval/new Function/cookies/localStorage/
 *   window.open; nenhum recurso de outro domínio além das Dependencies
 *   fixadas acima; todo texto (incluindo o template de tooltip
 *   customizado) entra via textContent/createTextNode, nunca innerHTML.
 *
 * LIMITAÇÕES CONHECIDAS DESTA ETAPA (ver README.md para a lista completa)
 *   - Zoom/pan volta ao padrão sempre que os dados ou qualquer opção
 *     mudam (não preserva a posição manual entre atualizações ainda).
 *   - "Albers Usa" ignora centro customizado (é uma projeção composta de
 *     EUA+Alasca+Havaí com posições fixas — comportamento documentado do
 *     próprio D3, não uma limitação nossa).
 *   - "Auto" (na lista de projeções) não é uma heurística inteligente —
 *     usamos Equirectangular. O D3 não tem um "detector automático de
 *     melhor projeção"; "Auto" nas ferramentas originais provavelmente
 *     significa algo parecido ou é calculado de outra forma que não
 *     temos como confirmar sem acesso a elas.
 *   - Sem tiles, então sem nomes de rua/cidade de fundo nem zoom a nível
 *     de rua — só os contornos de países do dataset embutido.
 *   - "Iniciar centralizado nos dados" (Globo) calcula uma média aritmética
 *     simples de latitude/longitude, não uma média circular — para pontos
 *     espalhados perto da linha de virada da data (±180°) o centro
 *     calculado pode sair errado (ex.: pontos em +179° e -179° dariam uma
 *     média perto de 0°, não perto de 180°). Para a maioria dos casos
 *     (dados concentrados numa região) funciona bem.
 *   - A inércia do Globo usa um modelo simples de atrito fixo (não é uma
 *     física "realista"), e a rotação automática pausa durante o arraste e
 *     a inércia, retomando depois.
 */

(function () {
  'use strict';

  // ----------------------------------------------------------------------
  // Verificação de dependências (Dependencies do Admin) — se algo não
  // carregou (ou carregou fora de ordem), avisamos com clareza em vez de
  // quebrar silenciosamente.
  // ----------------------------------------------------------------------
  function dependenciasFaltando() {
    var faltando = [];
    if (typeof window.d3 === 'undefined') {
      faltando.push('d3 (https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js)');
    } else {
      if (typeof window.d3.geoKavrayskiy7 !== 'function') {
        faltando.push('d3-geo-projection (precisa vir DEPOIS do d3 nas Dependencies)');
      }
      if (typeof window.d3.zoom !== 'function' || typeof window.d3.geoPath !== 'function') {
        faltando.push('d3 parece incompleto (zoom/geoPath ausentes) — confira a URL do d3');
      }
    }
    if (typeof window.topojson === 'undefined' || typeof window.topojson.mesh !== 'function') {
      faltando.push('topojson-client (https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js)');
    }
    if (!window.WORLD_TOPOLOGY_110M && !window.WORLD_TOPOLOGY_50M) {
      faltando.push('world_topology_110m.js (ou world_topology_50m.js) — define window.WORLD_TOPOLOGY_110M/_50M');
    }
    return faltando;
  }

  // ----------------------------------------------------------------------
  // Utilitários de célula/texto
  // ----------------------------------------------------------------------
  function limparNo(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function textoCelula(cell, placeholder) {
    if (cell === undefined || cell === null) return placeholder;
    if (cell.value === undefined || cell.value === null) return placeholder;
    try {
      if (window.LookerCharts && LookerCharts.Utils && typeof LookerCharts.Utils.textForCell === 'function') {
        return LookerCharts.Utils.textForCell(cell);
      }
    } catch (e) { /* cai no fallback abaixo */ }
    return cell.rendered !== undefined && cell.rendered !== null ? String(cell.rendered) : String(cell.value);
  }

  function rotuloDoCampo(field, usarNomeCompleto) {
    if (usarNomeCompleto) return field.label || field.name;
    return field.label_short || field.label || field.name;
  }

  function nomeParece(field, termos) {
    var alvo = ((field.label || '') + ' ' + field.name).toLowerCase();
    return termos.some(function (t) { return alvo.indexOf(t) !== -1; });
  }

  function escolherPorNomeOuConfig(valorConfig, candidatos, termos) {
    if (valorConfig) {
      var achado = candidatos.filter(function (c) { return c.name === valorConfig; });
      if (achado.length) return achado[0];
    }
    var porNome = candidatos.filter(function (c) { return nomeParece(c, termos); });
    if (porNome.length) return porNome[0];
    return candidatos.length ? candidatos[0] : null;
  }

  // ----------------------------------------------------------------------
  // Extração de latitude/longitude. Formatos tratados (ver nota no
  // cabeçalho sobre incerteza de array/objeto):
  //   - string "lat,lon" (formato confirmado em uso por campos location)
  //   - array [lat, lon]        (suposição — confirme com Modo debug)
  //   - objeto {latitude, longitude} / {lat, lng} / {lat, lon} (suposição)
  // ----------------------------------------------------------------------
  var REGEX_LOCATION = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

  function extrairLatLonDeValor(valor) {
    if (valor === null || valor === undefined) return null;
    if (typeof valor === 'string') {
      var m = REGEX_LOCATION.exec(valor);
      if (!m) return null;
      return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
    }
    if (Array.isArray(valor) && valor.length >= 2) {
      var lat = Number(valor[0]), lon = Number(valor[1]);
      if (!isNaN(lat) && !isNaN(lon)) return { lat: lat, lon: lon };
      return null;
    }
    if (typeof valor === 'object') {
      var la = valor.latitude !== undefined ? valor.latitude : valor.lat;
      var lo = valor.longitude !== undefined ? valor.longitude : (valor.lng !== undefined ? valor.lng : valor.lon);
      if (la !== undefined && lo !== undefined) {
        la = Number(la); lo = Number(lo);
        if (!isNaN(la) && !isNaN(lo)) return { lat: la, lon: lo };
      }
    }
    return null;
  }

  function pareceCampoLocation(field, amostraLinhas) {
    for (var i = 0; i < amostraLinhas.length; i++) {
      var cell = amostraLinhas[i][field.name];
      if (!cell || cell.value === null || cell.value === undefined) continue;
      if (extrairLatLonDeValor(cell.value) !== null) return true;
    }
    return false;
  }

  function obterLatLon(row, mapaCampos, debug) {
    if (mapaCampos.modo === 'location') {
      var cell = row[mapaCampos.location.name];
      if (debug) {
        console.log('[mapa_customizavel] Modo debug — célula do campo de localização "' + mapaCampos.location.name + '":', cell);
      }
      if (!cell || cell.value === null || cell.value === undefined) return null;
      var ll = extrairLatLonDeValor(cell.value);
      if (!ll) return null;
      return { lat: ll.lat, lon: ll.lon, linksCell: cell };
    }
    var cLat = row[mapaCampos.lat.name];
    var cLon = row[mapaCampos.lon.name];
    if (debug) {
      console.log('[mapa_customizavel] Modo debug — células de latitude/longitude:', { lat: cLat, lon: cLon });
    }
    if (!cLat || !cLon || cLat.value === null || cLon.value === null || cLat.value === undefined || cLon.value === undefined) return null;
    var lat = Number(cLat.value), lon = Number(cLon.value);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat: lat, lon: lon, linksCell: cLat };
  }

  // ----------------------------------------------------------------------
  // Tooltip (HTML simples, só texto — nunca innerHTML com dado do usuário)
  // ----------------------------------------------------------------------
  function renderizarTooltipPadrao(container, row, campos, usarNomeCompleto, mostrarCoords, lat, lon) {
    limparNo(container);
    campos.forEach(function (f) {
      var cell = row[f.name];
      if (cell === undefined) return;
      var linha = document.createElement('div');
      var forte = document.createElement('strong');
      forte.textContent = rotuloDoCampo(f, usarNomeCompleto) + ': ';
      linha.appendChild(forte);
      linha.appendChild(document.createTextNode(textoCelula(cell, '∅')));
      container.appendChild(linha);
    });
    if (mostrarCoords && lat !== undefined && lon !== undefined) {
      var linhaCoord = document.createElement('div');
      linhaCoord.textContent = 'Lat/Lon: ' + lat.toFixed(4) + ', ' + lon.toFixed(4);
      container.appendChild(linhaCoord);
    }
  }

  var REGEX_TEMPLATE = /\{\{\s*([a-zA-Z0-9_.:]+)\s*\}\}/g;

  function renderizarTooltipPersonalizado(container, template, row) {
    limparNo(container);
    REGEX_TEMPLATE.lastIndex = 0;
    var ultimo = 0, m;
    while ((m = REGEX_TEMPLATE.exec(template))) {
      if (m.index > ultimo) container.appendChild(document.createTextNode(template.slice(ultimo, m.index)));
      var cell = row[m[1]];
      container.appendChild(document.createTextNode(cell ? textoCelula(cell, '') : ('{{' + m[1] + '}}')));
      ultimo = REGEX_TEMPLATE.lastIndex;
    }
    if (ultimo < template.length) container.appendChild(document.createTextNode(template.slice(ultimo)));
  }

  // ----------------------------------------------------------------------
  // Projeções D3 (todas conferidas antes de usar — ver cabeçalho)
  // ----------------------------------------------------------------------
  function construirProjecao(nome) {
    var d3g = window.d3;
    switch (nome) {
      case 'albers': return d3g.geoAlbers();
      case 'albersUsa': return d3g.geoAlbersUsa();
      case 'azimuthalEqualArea': return d3g.geoAzimuthalEqualArea();
      case 'azimuthalEquidistant': return d3g.geoAzimuthalEquidistant();
      case 'conicConformal': return d3g.geoConicConformal();
      case 'conicEqualArea': return d3g.geoConicEqualArea();
      case 'conicEquidistant': return d3g.geoConicEquidistant();
      case 'gnomonic': return d3g.geoGnomonic();
      case 'kavrayskiy7': return d3g.geoKavrayskiy7();
      case 'mercator': return d3g.geoMercator();
      case 'orthographic': return d3g.geoOrthographic();
      case 'stereographic': return d3g.geoStereographic();
      case 'transverseMercator': return d3g.geoTransverseMercator();
      case 'identity': return d3g.geoIdentity().reflectY(true);
      case 'equirectangular': return d3g.geoEquirectangular();
      case 'auto': default: return d3g.geoEquirectangular();
    }
  }

  var TEMAS_MAPA = {
    light: { ocean: '#eaf4ff', map: '#f3f4f6', outer: '#6b7280', inner: '#d1d5db' },
    dark: { ocean: '#0f172a', map: '#1e293b', outer: '#64748b', inner: '#334155' },
    satellite: { ocean: '#0b3d2e', map: '#3a5a40', outer: '#162a16', inner: '#4f6b4a' }
  };

  // ----------------------------------------------------------------------
  // Raio automático do ponto (heurística própria, não é API de ninguém):
  // menos pontos => círculos maiores; muitos pontos => menores.
  // ----------------------------------------------------------------------
  function raioAutomatico(n) {
    var r = 420 / Math.sqrt(n + 4);
    return Math.max(1.5, Math.min(9, r));
  }

  var CSS_TEXTO = [
    '.mc-wrapper{position:relative;width:100%;height:100%;overflow:hidden;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;',
    'font-size:12px;color:#1f2937;box-sizing:border-box;}',
    '.mc-wrapper *{box-sizing:border-box;}',
    '.mc-canvas{display:block;width:100%;height:100%;cursor:grab;touch-action:none;}',
    '.mc-canvas.mc-arrastando{cursor:grabbing;}',
    '.mc-tooltip{position:fixed;display:none;max-width:260px;background:rgba(17,24,39,0.95);',
    'color:#fff;padding:6px 8px;border-radius:6px;font-size:11px;line-height:1.5;',
    'pointer-events:none;z-index:1000;white-space:normal;}',
    '.mc-aviso{position:absolute;right:8px;top:6px;font-size:11px;color:#92400e;',
    'background:rgba(255,251,235,0.9);padding:2px 6px;border-radius:4px;pointer-events:none;}',
    '.mc-dica{position:absolute;left:8px;bottom:6px;font-size:11px;color:#6b7280;',
    'background:rgba(255,255,255,0.75);padding:2px 6px;border-radius:4px;pointer-events:none;display:none;}',
    '.mc-wrapper.mc-modo-globo .mc-dica{display:block;}',
    '.mc-resetar{position:absolute;right:8px;bottom:6px;font-size:11px;padding:4px 10px;',
    'border-radius:4px;border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;display:none;}',
    '.mc-resetar:hover{background:#f3f4f6;}',
    '.mc-wrapper.mc-modo-globo .mc-resetar{display:block;}',
    '.mc-empty{padding:16px;color:#6b7280;}'
  ].join('');

  var definicaoVisualizacao = {
    id: 'mapa_customizavel',
    label: 'Mapa Customizável',

    options: {
      // ---- Plot ----
      plotMode: {
        type: 'string', label: 'Plot Mode', section: 'Plot', order: 1, display: 'select', default: 'points',
        values: [{ 'Points': 'points' }]
      },
      customTooltip: { type: 'boolean', label: 'Custom Tooltip', section: 'Plot', order: 2, default: false },
      customTooltipTemplate: {
        type: 'string', label: 'Custom Tooltip Template (use {{nome_do_campo}}; só usado se "Custom Tooltip" estiver ligado)',
        section: 'Plot', order: 3, default: '', placeholder: '{{cidade}}: {{vendas}}'
      },

      // ---- Map ----
      mapMode: {
        type: 'string', label: 'Map Mode', section: 'Map', order: 0, display: 'select', default: 'flat',
        values: [{ 'Mapa Plano': 'flat' }, { 'Globo (arrastar para girar)': 'globe' }]
      },
      mapStyle: {
        type: 'string', label: 'Map Style', section: 'Map', order: 1, display: 'select', default: 'custom',
        values: [{ 'Custom (usa as cores da seção Style)': 'custom' }, { 'Light': 'light' }, { 'Dark': 'dark' }, { 'Satellite-like (só paleta, sem imagem real)': 'satellite' }]
      },
      mapResolution: {
        type: 'string', label: 'Resolução do mapa', section: 'Map', order: 2, display: 'select', default: '110m',
        values: [{ '110m (mais leve)': '110m' }, { '50m (mais detalhado, requer Dependency extra)': '50m' }]
      },
      projection: {
        type: 'string', label: 'Projection', section: 'Map', order: 3, display: 'select', default: 'mercator',
        values: [
          { 'Auto': 'auto' }, { 'Albers': 'albers' }, { 'Albers Usa': 'albersUsa' },
          { 'Azimuthal Equal Area': 'azimuthalEqualArea' }, { 'Azimuthal Equidistant': 'azimuthalEquidistant' },
          { 'Conic Conformal': 'conicConformal' }, { 'Conic Equal Area': 'conicEqualArea' },
          { 'Conic Equidistant': 'conicEquidistant' }, { 'Equirectangular': 'equirectangular' },
          { 'Gnomonic': 'gnomonic' }, { 'Kavrayskiy7': 'kavrayskiy7' }, { 'Mercator': 'mercator' },
          { 'Orthographic': 'orthographic' }, { 'Stereographic': 'stereographic' },
          { 'Transverse Mercator': 'transverseMercator' }, { 'No Projection (Cartesian)': 'identity' }
        ]
      },
      mapPosition: {
        type: 'string', label: 'Map Position', section: 'Map', order: 4, display: 'select', default: 'fit_data',
        values: [{ 'Fit to Data': 'fit_data' }, { 'Custom': 'custom' }]
      },
      customCenterLon: { type: 'number', label: 'Custom: longitude do centro', section: 'Map', order: 5, display: 'range', min: -180, max: 180, step: 1, default: 0 },
      customCenterLat: { type: 'number', label: 'Custom: latitude do centro', section: 'Map', order: 6, display: 'range', min: -90, max: 90, step: 1, default: 0 },
      customZoom: { type: 'number', label: 'Custom: zoom (multiplicador)', section: 'Map', order: 7, display: 'range', min: 0.1, max: 20, step: 0.1, default: 1 },
      allowPanning: { type: 'boolean', label: 'Allow Panning', section: 'Map', order: 8, default: true },
      allowZooming: { type: 'boolean', label: 'Allow Zooming', section: 'Map', order: 9, default: true },
      displayCoordinates: { type: 'boolean', label: 'Display Coordinates', section: 'Map', order: 10, default: false },
      debugMode: { type: 'boolean', label: 'Modo debug (mostra dados brutos no console)', section: 'Map', order: 11, default: false },

      // ---- Points ----
      pointColor: { type: 'string', label: 'Point Color', section: 'Points', order: 1, display: 'color', default: '#dc2626' },
      pointRadius: { type: 'number', label: 'Point Radius em px (deixe em branco para automático)', section: 'Points', order: 2 },

      // ---- Style ----
      oceanColor: { type: 'string', label: 'Background/Ocean Color', section: 'Style', order: 1, display: 'color', default: '#eaf4ff' },
      mapColor: { type: 'string', label: 'Map Color', section: 'Style', order: 2, display: 'color', default: '#d7f0df' },
      outerBorderColor: { type: 'string', label: 'Outer Border Color', section: 'Style', order: 3, display: 'color', default: '#3f6b4f' },
      innerBorderColor: { type: 'string', label: 'Inner Border Color', section: 'Style', order: 4, display: 'color', default: '#9ca3af' },
      outerBorderWidth: { type: 'number', label: 'Outer Border Width (px, >0)', section: 'Style', order: 5, display: 'range', min: 0.5, max: 6, step: 0.5, default: 1.5 },
      innerBorderWidth: { type: 'number', label: 'Inner Border Width (px, >0)', section: 'Style', order: 6, display: 'range', min: 0.25, max: 6, step: 0.25, default: 0.5 },
      showFullFieldNameTooltips: { type: 'boolean', label: 'Show Full Field Name in Tooltips', section: 'Style', order: 7, default: false },

      // ---- Globo (só tem efeito quando Map Mode = "Globo") ----
      showGraticule: { type: 'boolean', label: 'Mostrar grade de latitude/longitude', section: 'Globo', order: 1, default: true },
      graticuleColor: { type: 'string', label: 'Cor da grade de coordenadas', section: 'Globo', order: 2, display: 'color', default: '#b9d3e6' },
      atmosphereGlow: { type: 'boolean', label: 'Brilho na borda (atmosfera)', section: 'Globo', order: 3, default: true },
      startCenteredOnData: { type: 'boolean', label: 'Iniciar centralizado nos dados', section: 'Globo', order: 4, default: true },
      initialRotationLon: { type: 'number', label: 'Rotação inicial: longitude (graus, se não centralizar nos dados)', section: 'Globo', order: 5, display: 'range', min: -180, max: 180, step: 1, default: -50 },
      initialRotationLat: { type: 'number', label: 'Rotação inicial: latitude (graus, se não centralizar nos dados)', section: 'Globo', order: 6, display: 'range', min: -90, max: 90, step: 1, default: -20 },
      dragSensitivityGlobe: { type: 'number', label: 'Sensibilidade do arraste', section: 'Globo', order: 7, display: 'range', min: 0.1, max: 2, step: 0.1, default: 0.5 },
      inertia: { type: 'boolean', label: 'Inércia suave ao soltar o arraste', section: 'Globo', order: 8, default: true },
      autoRotate: { type: 'boolean', label: 'Rotação automática', section: 'Globo', order: 9, default: false },
      autoRotateSpeed: { type: 'number', label: 'Velocidade da rotação automática (graus/s)', section: 'Globo', order: 10, display: 'range', min: 1, max: 60, step: 1, default: 6 },
      hideBackPoints: { type: 'boolean', label: 'Esconder pontos do lado oculto do globo', section: 'Globo', order: 11, default: true }
    },

    create: function (element, config) {
      limparNo(element);
      var style = document.createElement('style');
      style.textContent = CSS_TEXTO;
      element.appendChild(style);

      var wrapper = document.createElement('div');
      wrapper.className = 'mc-wrapper';
      element.appendChild(wrapper);

      var canvas = document.createElement('canvas');
      canvas.className = 'mc-canvas';
      wrapper.appendChild(canvas);

      var tooltip = document.createElement('div');
      tooltip.className = 'mc-tooltip';
      wrapper.appendChild(tooltip);

      var dica = document.createElement('div');
      dica.className = 'mc-dica';
      dica.textContent = 'Arraste para girar o globo';
      wrapper.appendChild(dica);

      var botaoResetar = document.createElement('button');
      botaoResetar.type = 'button';
      botaoResetar.className = 'mc-resetar';
      botaoResetar.textContent = 'Resetar';
      wrapper.appendChild(botaoResetar);

      this._wrapper = wrapper;
      this._canvas = canvas;
      this._tooltipEl = tooltip;
      this._ctx = (typeof canvas.getContext === 'function') ? canvas.getContext('2d') : null;
      this._estado = null;
      this._ultimaAssinaturaCampos = null;
      this._rotacaoGlobo = null;
      this._zoomGlobo = 1;
      this._configInicialGlobo = null;
      this._inerciaRaf = null;

      var viz = this;
      var d3g = window.d3;

      botaoResetar.addEventListener('click', function () {
        if (viz._inerciaRaf) { cancelAnimationFrame(viz._inerciaRaf); viz._inerciaRaf = null; }
        if (viz._estado && viz._estado.rotacaoInicialGlobo) {
          viz._rotacaoGlobo = { lon: viz._estado.rotacaoInicialGlobo.lon, lat: viz._estado.rotacaoInicialGlobo.lat };
        }
        viz._zoomGlobo = 1;
        if (viz._zoomBehavior && d3g) {
          try { d3g.select(canvas).call(viz._zoomBehavior.transform, d3g.zoomIdentity); } catch (e) { /* ignora */ }
        }
        desenharMapa(viz);
      });

      // O zoom por roda do mouse fica a cargo do d3.zoom() (não tem o
      // problema abaixo, porque o evento "wheel" dispara direto no elemento
      // sob o cursor, sem precisar rastrear um arraste). O PAN (arrastar
      // para mover o mapa) é feito à mão com Pointer Events +
      // setPointerCapture: a visualização roda dentro de um <iframe>
      // "sandboxed" pequeno no Looker, e sem captura de ponteiro, se o
      // cursor sair da área do iframe durante um arraste (fácil de
      // acontecer), os eventos de "mouse se movendo" simplesmente param de
      // chegar e o pan trava no meio — foi exatamente isso que aconteceu
      // com o Globo antes dessa correção. this.filter(...) abaixo faz o
      // d3.zoom() ignorar completamente gestos de arraste/toque e reagir
      // só à roda do mouse.
      if (d3g && typeof d3g.zoom === 'function') {
        this._zoomTransform = d3g.zoomIdentity;
        var zoomBehavior = d3g.zoom()
          .scaleExtent([0.5, 40])
          .filter(function (ev) { return ev.type === 'wheel'; })
          .on('zoom', function (ev) {
            var t = ev.transform;
            var estado = viz._estado;
            if (estado && estado.mapMode === 'globe') {
              // no globo, a roda do mouse controla só o zoom (raio da
              // esfera); a posição (x,y) do transform do d3 é ignorada
              if (!(estado.allowZooming === false)) viz._zoomGlobo = t.k;
              desenharMapa(viz);
              return;
            }
            var prev = viz._zoomTransform || d3g.zoomIdentity;
            if (estado && estado.allowZooming === false) {
              t = new d3g.ZoomTransform(prev.k, t.x, t.y);
            }
            viz._zoomTransform = t;
            desenharMapa(viz);
          });
        this._zoomBehavior = zoomBehavior;
        d3g.select(canvas).call(zoomBehavior);
      }

      // Histórico curto de posições do arraste, usado só para calcular a
      // velocidade no momento de soltar (inércia do globo).
      var historicoArraste = [];

      function pararInercia() {
        if (viz._inerciaRaf) { cancelAnimationFrame(viz._inerciaRaf); viz._inerciaRaf = null; }
      }

      function iniciarPan(ev) {
        if (ev.button !== undefined && ev.button !== 0) return;
        var estado = viz._estado;
        var modoGlobo = estado && estado.mapMode === 'globe';
        if (!modoGlobo && estado && estado.allowPanning === false) return;
        pararInercia();
        viz._arrastando = true;
        viz._ultimaPosPan = { x: ev.clientX, y: ev.clientY };
        historicoArraste = [{ x: ev.clientX, y: ev.clientY, t: Date.now() }];
        canvas.classList.add('mc-arrastando');
        if (typeof canvas.setPointerCapture === 'function' && ev.pointerId !== undefined) {
          try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
        }
      }
      function moverPan(ev) {
        if (!viz._arrastando) return;
        var dx = ev.clientX - viz._ultimaPosPan.x, dy = ev.clientY - viz._ultimaPosPan.y;
        viz._ultimaPosPan = { x: ev.clientX, y: ev.clientY };
        historicoArraste.push({ x: ev.clientX, y: ev.clientY, t: Date.now() });
        if (historicoArraste.length > 5) historicoArraste.shift();

        var estado = viz._estado;
        if (estado && estado.mapMode === 'globe') {
          girarGlobo(viz, dx, dy);
          return;
        }

        var atual = viz._zoomTransform || (d3g && d3g.zoomIdentity) || { k: 1, x: 0, y: 0 };
        var novo = d3g ? new d3g.ZoomTransform(atual.k, atual.x + dx, atual.y + dy) : { k: atual.k, x: atual.x + dx, y: atual.y + dy };
        viz._zoomTransform = novo;
        // mantém o d3.zoom() sincronizado, senão o próximo zoom por roda do
        // mouse "pularia" de volta para a posição de antes do pan
        if (viz._zoomBehavior && d3g) {
          try { d3g.select(canvas).call(viz._zoomBehavior.transform, novo); } catch (e) { /* ignora */ }
        }
        desenharMapa(viz);
      }
      function pararPan(ev) {
        var estava = viz._arrastando;
        viz._arrastando = false;
        canvas.classList.remove('mc-arrastando');
        if (ev && typeof canvas.releasePointerCapture === 'function' && ev.pointerId !== undefined) {
          try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
        }
        var estado = viz._estado;
        if (estava && estado && estado.mapMode === 'globe' && estado.inertia !== false && historicoArraste.length >= 2) {
          iniciarInerciaGlobo(viz, historicoArraste);
        }
        historicoArraste = [];
      }
      canvas.addEventListener('pointerdown', iniciarPan);
      canvas.addEventListener('pointermove', moverPan);
      canvas.addEventListener('pointerup', pararPan);
      canvas.addEventListener('pointercancel', pararPan);

      canvas.addEventListener('mousemove', function (ev) {
        if (viz._arrastando) { esconderTooltip(viz); return; }
        var rect = canvas.getBoundingClientRect();
        var p = pontoSobMouse(viz, ev.clientX - rect.left, ev.clientY - rect.top);
        if (p) {
          mostrarTooltip(viz, p, ev.clientX, ev.clientY);
          canvas.style.cursor = 'pointer';
        } else {
          esconderTooltip(viz);
          canvas.style.cursor = 'grab';
        }
      });
      canvas.addEventListener('mouseleave', function () { esconderTooltip(viz); });
      canvas.addEventListener('click', function (ev) {
        var rect = canvas.getBoundingClientRect();
        var p = pontoSobMouse(viz, ev.clientX - rect.left, ev.clientY - rect.top);
        if (p && p.linksCell && p.linksCell.links && p.linksCell.links.length) {
          try {
            if (window.LookerCharts && LookerCharts.Utils && typeof LookerCharts.Utils.openDrillMenu === 'function') {
              LookerCharts.Utils.openDrillMenu({ links: p.linksCell.links, event: ev });
            }
          } catch (e) { /* drill indisponível; ignora */ }
        }
      });

      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(function () { desenharMapa(viz); });
        this._resizeObserver.observe(wrapper);
      }

      // Rotação automática do globo (só roda quando mapMode='globe',
      // autoRotate ligado, e não há arraste/inércia ativos no momento).
      var ultimoTsAuto = null;
      function loopAutoRotate(ts) {
        if (!document.body.contains(wrapper)) return; // visualização removida; para o loop
        var estado = viz._estado;
        if (estado && estado.mapMode === 'globe' && estado.autoRotate && !viz._arrastando && !viz._inerciaRaf) {
          var dt = ultimoTsAuto ? (ts - ultimoTsAuto) / 1000 : 0;
          if (viz._rotacaoGlobo) viz._rotacaoGlobo.lon += estado.autoRotateSpeed * dt;
          desenharMapa(viz);
        }
        ultimoTsAuto = ts;
        requestAnimationFrame(loopAutoRotate);
      }
      requestAnimationFrame(loopAutoRotate);
    },

    updateAsync: function (data, element, config, queryResponse, details, done) {
      try {
        if (typeof this.clearErrors === 'function') this.clearErrors();
        prepararEstado(this, data, config, queryResponse);
      } catch (erro) {
        if (typeof this.addError === 'function') {
          this.addError({ title: 'Erro no Mapa Customizável', message: String((erro && erro.message) || erro) });
        }
      }
      done();
    }
  };

  // ------------------------------------------------------------------
  // Monta o estado de renderização a partir da consulta do Looker
  // ------------------------------------------------------------------
  function prepararEstado(viz, data, config, queryResponse) {
    var wrapper = viz._wrapper;
    var vazio = wrapper.querySelector('.mc-empty');
    if (vazio) vazio.remove();

    var faltando = dependenciasFaltando();
    if (faltando.length) {
      if (typeof viz.addError === 'function') {
        viz.addError({ title: 'Dependências ausentes', message: 'Confira Admin > Visualizations > Dependencies: ' + faltando.join('; ') });
      }
      viz._estado = null;
      return;
    }

    if (!queryResponse || !queryResponse.fields) {
      if (typeof viz.addError === 'function') viz.addError({ title: 'Dados insuficientes', message: 'queryResponse.fields não está disponível.' });
      viz._estado = null;
      return;
    }

    if (queryResponse.pivots && queryResponse.pivots.length) {
      if (typeof viz.addError === 'function') {
        viz.addError({ title: 'Pivô não suportado', message: 'Esta visualização não aceita consultas com pivô. Remova o pivô do Explore e tente novamente.' });
      }
      viz._estado = null;
      return;
    }

    var dims = queryResponse.fields.dimension_like || [];
    var medidas = queryResponse.fields.measure_like || [];

    if (dims.length === 0) {
      if (typeof viz.addError === 'function') {
        viz.addError({
          title: 'Faltam campos de localização',
          message: 'Adicione ao Explore duas dimensões numéricas de latitude/longitude, ou um campo do tipo location, para montar o mapa.'
        });
      }
      viz._estado = null;
      return;
    }

    var amostra = data.slice(0, 25);
    var candidatosLocation = dims.filter(function (f) { return pareceCampoLocation(f, amostra); });

    // ---- opções dinâmicas por campo (registerOptions), só quando a lista
    // de campos realmente mudou — evita loop de registro ----
    var assinatura = dims.map(function (f) { return f.name; }).join('|') + '::' + medidas.map(function (f) { return f.name; }).join('|');
    if (assinatura !== viz._ultimaAssinaturaCampos) {
      viz._ultimaAssinaturaCampos = assinatura;
      var opcoesCampo = function (lista) { return lista.map(function (f) { var o = {}; o[(f.label || f.name)] = f.name; return o; }); };
      var opcoesDinamicas = {
        modoCoordenadas: {
          type: 'string', label: 'Modo de coordenadas', section: 'Dados', order: 1, display: 'select', default: 'auto',
          values: [{ 'Automático': 'auto' }, { 'Campo de localização': 'location' }, { 'Dois campos (latitude e longitude)': 'manual' }]
        },
        campoLocalizacao: {
          type: 'string', label: 'Campo de localização', section: 'Dados', order: 2, display: 'select',
          values: opcoesCampo(candidatosLocation.length ? candidatosLocation : dims),
          default: (candidatosLocation[0] || dims[0]).name
        },
        campoLatitude: {
          type: 'string', label: 'Campo de latitude (modo manual)', section: 'Dados', order: 3, display: 'select',
          values: opcoesCampo(dims), default: escolherPorNomeOuConfig(null, dims, ['lat']).name
        },
        campoLongitude: {
          type: 'string', label: 'Campo de longitude (modo manual)', section: 'Dados', order: 4, display: 'select',
          values: opcoesCampo(dims), default: escolherPorNomeOuConfig(null, dims, ['lon', 'lng']).name
        }
      };
      // Importante: this.trigger('registerOptions', ...) SUBSTITUI o painel
      // de opções inteiro pelo que for passado aqui (confirmado testando no
      // Looker real — as seções estáticas "Plot"/"Map"/"Points"/"Style"
      // sumiam do painel Edit quando mandávamos só as opções dinâmicas).
      // Por isso sempre mandamos as opções estáticas JUNTO com as novas.
      if (typeof viz.trigger === 'function') {
        viz.trigger('registerOptions', Object.assign({}, definicaoVisualizacao.options, opcoesDinamicas));
      }
    }

    // ---- decide o modo de coordenadas efetivo ----
    var modo = config.modoCoordenadas || 'auto';
    var mapaCampos;
    if (modo === 'location' || (modo === 'auto' && candidatosLocation.length)) {
      var campoLoc = escolherPorNomeOuConfig(config.campoLocalizacao, candidatosLocation.length ? candidatosLocation : dims, ['local', 'location', 'coordenad']);
      mapaCampos = { modo: 'location', location: campoLoc };
    } else {
      var campoLat = escolherPorNomeOuConfig(config.campoLatitude, dims, ['lat']);
      var campoLon = escolherPorNomeOuConfig(config.campoLongitude, dims, ['lon', 'lng']);
      if (!campoLat || !campoLon || campoLat.name === campoLon.name) {
        if (typeof viz.addError === 'function') {
          viz.addError({
            title: 'Não consegui identificar latitude/longitude',
            message: 'Escolha manualmente os campos de latitude e longitude (ou um campo de localização) nas opções da visualização, seção "Dados".'
          });
        }
        viz._estado = null;
        return;
      }
      mapaCampos = { modo: 'manual', lat: campoLat, lon: campoLon };
    }

    var debug = !!config.debugMode;
    if (debug) console.log('[mapa_customizavel] Modo de coordenadas efetivo:', mapaCampos);

    // ---- monta a lista de pontos válidos ----
    var pontosValidos = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var ll = obterLatLon(row, mapaCampos, debug && i === 0);
      if (!ll) continue;
      pontosValidos.push({ lat: ll.lat, lon: ll.lon, row: row, linksCell: ll.linksCell });
    }

    if (pontosValidos.length === 0) {
      if (typeof viz.addError === 'function') {
        viz.addError({
          title: 'Nenhum ponto válido',
          message: 'Nenhuma linha teve latitude/longitude reconhecíveis. Ligue "Modo debug" nas opções e veja o console do navegador para checar o formato dos dados.'
        });
      }
      viz._estado = null;
      return;
    }

    // ---- geometria do mapa-base (TopoJSON -> GeoJSON) ----
    var topologia = (config.mapResolution === '50m' && window.WORLD_TOPOLOGY_50M) ? window.WORLD_TOPOLOGY_50M : (window.WORLD_TOPOLOGY_110M || window.WORLD_TOPOLOGY_50M);
    var countriesFeature = window.topojson.feature(topologia, topologia.objects.countries);
    var landMesh = window.topojson.mesh(topologia, topologia.objects.land);
    var innerMesh = window.topojson.mesh(topologia, topologia.objects.countries, function (a, b) { return a !== b; });

    // ---- cores efetivas (tema pronto ou "Custom" com as cores da seção Style) ----
    var tema = TEMAS_MAPA[config.mapStyle];
    var cores = tema
      ? { ocean: tema.ocean, map: tema.map, outer: tema.outer, inner: tema.inner }
      : {
        ocean: config.oceanColor || '#eaf4ff', map: config.mapColor || '#d7f0df',
        outer: config.outerBorderColor || '#3f6b4f', inner: config.innerBorderColor || '#9ca3af'
      };

    var cssW = wrapper.clientWidth || 300, cssH = wrapper.clientHeight || 300;
    var mapMode = config.mapMode === 'globe' ? 'globe' : 'flat';

    // ---- projeção (só usada no modo Mapa Plano — no Globo a projeção é
    // montada a cada frame dentro de desenharGlobo, a partir da rotação e
    // zoom atuais) ----
    var projecao = null;
    if (mapMode !== 'globe') {
      projecao = construirProjecao(config.projection || 'mercator');
      if ((config.mapPosition || 'fit_data') === 'custom') {
        var featureMundo = { type: 'Sphere' };
        try { projecao.fitSize([cssW, cssH], featureMundo); } catch (e) { /* algumas projeções (ex. identity) lidam com Sphere de forma diferente */ }
        var escalaBase = projecao.scale();
        if (typeof projecao.center === 'function') {
          projecao.center([Number(config.customCenterLon) || 0, Number(config.customCenterLat) || 0]);
        }
        projecao.scale(escalaBase * (Number(config.customZoom) || 1)).translate([cssW / 2, cssH / 2]);
      } else {
        var colecaoPontos = { type: 'FeatureCollection', features: pontosValidos.map(function (p) { return { type: 'Feature', geometry: { type: 'Point', coordinates: [p.lon, p.lat] }, properties: {} }; }) };
        try { projecao.fitSize([cssW, cssH], colecaoPontos); }
        catch (e) { projecao.fitSize([cssW, cssH], { type: 'Sphere' }); }
      }
    }

    // ---- rotação inicial do Globo: centralizada na média dos pontos, ou
    // nos campos "Rotação inicial" — preserva a rotação atual (resultado de
    // arrastar) entre atualizações, só reinicia se a config inicial mudou ----
    var rotacaoInicialGlobo;
    if (config.startCenteredOnData !== false && pontosValidos.length) {
      var somaLon = 0, somaLat = 0;
      pontosValidos.forEach(function (p) { somaLon += p.lon; somaLat += p.lat; });
      rotacaoInicialGlobo = { lon: somaLon / pontosValidos.length, lat: -(somaLat / pontosValidos.length) };
    } else {
      rotacaoInicialGlobo = { lon: Number(config.initialRotationLon) || 0, lat: Number(config.initialRotationLat) || 0 };
    }
    var assinaturaGlobo = JSON.stringify(rotacaoInicialGlobo);
    if (!viz._rotacaoGlobo || viz._configInicialGlobo !== assinaturaGlobo) {
      viz._rotacaoGlobo = { lon: rotacaoInicialGlobo.lon, lat: rotacaoInicialGlobo.lat };
      viz._configInicialGlobo = assinaturaGlobo;
    }

    if (mapMode !== 'globe') {
      viz._zoomTransform = (window.d3 && window.d3.zoomIdentity) || null;
    }

    viz._estado = {
      mapMode: mapMode,
      pontosValidos: pontosValidos,
      projecao: projecao,
      countriesFeature: countriesFeature,
      landMesh: landMesh,
      innerMesh: innerMesh,
      cores: cores,
      outerBorderWidth: Number(config.outerBorderWidth) > 0 ? Number(config.outerBorderWidth) : 1.5,
      innerBorderWidth: Number(config.innerBorderWidth) > 0 ? Number(config.innerBorderWidth) : 0.5,
      pointColor: config.pointColor || '#dc2626',
      pointRadiusEfetivo: (Number(config.pointRadius) > 0) ? Number(config.pointRadius) : raioAutomatico(pontosValidos.length),
      allowPanning: config.allowPanning !== false,
      allowZooming: config.allowZooming !== false,
      displayCoordinates: !!config.displayCoordinates,
      customTooltip: !!config.customTooltip,
      customTooltipTemplate: config.customTooltipTemplate || '',
      showFullFieldName: !!config.showFullFieldNameTooltips,
      camposTooltip: dims.concat(medidas),
      // ---- específico do Globo ----
      rotacaoInicialGlobo: rotacaoInicialGlobo,
      showGraticule: config.showGraticule !== false,
      graticuleColor: config.graticuleColor || '#b9d3e6',
      atmosphereGlow: config.atmosphereGlow !== false,
      dragSensitivityGlobe: Number(config.dragSensitivityGlobe) || 0.5,
      inertia: config.inertia !== false,
      autoRotate: !!config.autoRotate,
      autoRotateSpeed: Number(config.autoRotateSpeed) || 6,
      hideBackPoints: config.hideBackPoints !== false
    };

    wrapper.classList.toggle('mc-modo-globo', mapMode === 'globe');

    desenharMapa(viz);
  }

  // ------------------------------------------------------------------
  // Hit-testing (converte a posição do mouse para o espaço de projeção,
  // desfazendo o zoom/pan atual, e procura o ponto mais próximo).
  // ------------------------------------------------------------------
  function pontoSobMouse(viz, mx, my) {
    var estado = viz._estado;
    if (!estado || !window.d3) return null;
    var px, py;
    if (estado.mapMode === 'globe') {
      // no globo os pontos já são projetados direto em coordenadas de
      // tela (sem transform de canvas), então compara sem desfazer nada
      px = mx; py = my;
    } else {
      var t = viz._zoomTransform || window.d3.zoomIdentity;
      var inv = t.invert([mx, my]);
      px = inv[0]; py = inv[1];
    }
    var raio = estado.pointRadiusEfetivo + 2;
    var melhor = null, melhorDist = Infinity;
    for (var i = 0; i < estado.pontosValidos.length; i++) {
      var p = estado.pontosValidos[i];
      if (p._sx === undefined) continue;
      var dx = p._sx - px, dy = p._sy - py;
      var d2 = dx * dx + dy * dy;
      if (d2 <= raio * raio && d2 < melhorDist) { melhor = p; melhorDist = d2; }
    }
    return melhor;
  }

  function mostrarTooltip(viz, p, clientX, clientY) {
    var estado = viz._estado;
    var el = viz._tooltipEl;
    if (estado.customTooltip && estado.customTooltipTemplate) {
      renderizarTooltipPersonalizado(el, estado.customTooltipTemplate, p.row);
    } else {
      renderizarTooltipPadrao(el, p.row, estado.camposTooltip, estado.showFullFieldName, estado.displayCoordinates, p.lat, p.lon);
    }
    el.style.display = 'block';
    el.style.left = (clientX + 14) + 'px';
    el.style.top = (clientY + 14) + 'px';
  }

  function esconderTooltip(viz) { viz._tooltipEl.style.display = 'none'; }

  // ------------------------------------------------------------------
  // Gira o globo a partir de um delta de arraste em pixels, respeitando a
  // sensibilidade configurada e travando a latitude em [-90,90] (senão o
  // globo "passaria" pelo polo de cabeça para baixo).
  // ------------------------------------------------------------------
  function girarGlobo(viz, dx, dy) {
    var estado = viz._estado;
    if (!estado || !viz._rotacaoGlobo) return;
    var sens = estado.dragSensitivityGlobe || 0.5;
    viz._rotacaoGlobo.lon += dx * sens;
    viz._rotacaoGlobo.lat -= dy * sens;
    if (viz._rotacaoGlobo.lat > 90) viz._rotacaoGlobo.lat = 90;
    if (viz._rotacaoGlobo.lat < -90) viz._rotacaoGlobo.lat = -90;
    desenharMapa(viz);
  }

  // Inércia: continua girando por mais alguns frames com velocidade
  // decrescente, calculada a partir dos últimos pontos do arraste.
  function iniciarInerciaGlobo(viz, historico) {
    var ultimo = historico[historico.length - 1];
    var anterior = historico[0];
    var dt = ultimo.t - anterior.t;
    if (dt <= 0 || dt > 300) return; // arraste muito lento/parado: sem inércia
    var vx = (ultimo.x - anterior.x) / dt; // px por ms
    var vy = (ultimo.y - anterior.y) / dt;
    var ultimoTs = null;

    function passo(ts) {
      if (!viz._estado || viz._arrastando) { viz._inerciaRaf = null; return; }
      var dtFrame = ultimoTs ? (ts - ultimoTs) : 16;
      ultimoTs = ts;
      girarGlobo(viz, vx * dtFrame, vy * dtFrame);
      vx *= 0.92; vy *= 0.92; // atrito
      if (Math.abs(vx) < 0.002 && Math.abs(vy) < 0.002) { viz._inerciaRaf = null; return; }
      viz._inerciaRaf = requestAnimationFrame(passo);
    }
    viz._inerciaRaf = requestAnimationFrame(passo);
  }

  // ------------------------------------------------------------------
  // Desenho no canvas — ramifica entre mapa plano (com pan/zoom em 2D) e
  // globo (projeção orthographic do D3, que já recorta corretamente tudo
  // que estiver no lado oculto via clipAngle(90) — sem precisar de nenhuma
  // lógica manual de recorte no horizonte).
  // ------------------------------------------------------------------
  function desenharMapa(viz) {
    var estado = viz._estado;
    if (!estado) return;
    var wrapper = viz._wrapper, canvas = viz._canvas, ctx = viz._ctx;
    var cssW = wrapper.clientWidth || 300, cssH = wrapper.clientHeight || 300;
    var dpr = window.devicePixelRatio || 1;
    var pxW = Math.max(1, Math.round(cssW * dpr)), pxH = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW; canvas.height = pxH;
    }
    if (!ctx) return; // ambiente de teste sem canvas 2D real (ex.: jsdom sem o pacote "canvas")

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    if (estado.mapMode === 'globe') {
      desenharGlobo(viz, ctx, cssW, cssH);
    } else {
      desenharMapaPlano(viz, ctx, cssW, cssH);
    }
  }

  function desenharMapaPlano(viz, ctx, cssW, cssH) {
    var estado = viz._estado;
    ctx.fillStyle = estado.cores.ocean;
    ctx.fillRect(0, 0, cssW, cssH);

    var t = viz._zoomTransform || (window.d3 && window.d3.zoomIdentity) || { k: 1, x: 0, y: 0 };
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    var path = window.d3.geoPath(estado.projecao, ctx);

    ctx.beginPath(); path(estado.countriesFeature); ctx.fillStyle = estado.cores.map; ctx.fill();
    ctx.beginPath(); path(estado.landMesh); ctx.lineWidth = estado.outerBorderWidth / t.k; ctx.strokeStyle = estado.cores.outer; ctx.stroke();
    ctx.beginPath(); path(estado.innerMesh); ctx.lineWidth = estado.innerBorderWidth / t.k; ctx.strokeStyle = estado.cores.inner; ctx.stroke();

    ctx.beginPath();
    for (var i = 0; i < estado.pontosValidos.length; i++) {
      var p = estado.pontosValidos[i];
      var xy = estado.projecao([p.lon, p.lat]);
      if (!xy) { p._sx = undefined; p._sy = undefined; continue; }
      p._sx = xy[0]; p._sy = xy[1];
      ctx.moveTo(xy[0] + estado.pointRadiusEfetivo, xy[1]);
      ctx.arc(xy[0], xy[1], estado.pointRadiusEfetivo, 0, 2 * Math.PI);
    }
    ctx.fillStyle = estado.pointColor;
    ctx.fill();

    ctx.restore();
  }

  function desenharGlobo(viz, ctx, cssW, cssH) {
    var estado = viz._estado;
    var d3g = window.d3;
    var cx = cssW / 2, cy = cssH / 2;
    var raioBase = Math.max(10, Math.min(cssW, cssH) / 2 - 10);
    var raio = raioBase * (viz._zoomGlobo || 1);
    var rot = viz._rotacaoGlobo || estado.rotacaoInicialGlobo || { lon: 0, lat: 0 };

    var projecao = d3g.geoOrthographic().clipAngle(90).translate([cx, cy]).scale(raio).rotate([-rot.lon, -rot.lat]);
    var path = d3g.geoPath(projecao, ctx);
    viz._projecaoGlobo = projecao;

    // fundo (fora da esfera) — fixo em branco; reaproveita as cores de
    // Style só para o que fica dentro do globo (oceano/terra/contornos)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssW, cssH);

    // brilho na borda (atmosfera) — degradê radial logo atrás da esfera
    if (estado.atmosphereGlow) {
      var grad = ctx.createRadialGradient(cx, cy, raio * 0.86, cx, cy, raio * 1.2);
      grad.addColorStop(0, 'rgba(147,197,253,0.35)');
      grad.addColorStop(1, 'rgba(147,197,253,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, raio * 1.2, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // esfera (oceano) + contorno externo
    ctx.beginPath();
    ctx.arc(cx, cy, raio, 0, 2 * Math.PI);
    ctx.fillStyle = estado.cores.ocean;
    ctx.fill();
    ctx.lineWidth = estado.outerBorderWidth;
    ctx.strokeStyle = estado.cores.outer;
    ctx.stroke();

    // grade de coordenadas
    if (estado.showGraticule && typeof d3g.geoGraticule === 'function') {
      var graticula = d3g.geoGraticule();
      ctx.beginPath(); path(graticula()); ctx.lineWidth = 0.5; ctx.strokeStyle = estado.graticuleColor; ctx.stroke();
    }

    // terra + fronteiras internas — o clipAngle(90) da projeção já recorta
    // tudo isso corretamente no horizonte, sem lógica extra nossa
    ctx.beginPath(); path(estado.countriesFeature); ctx.fillStyle = estado.cores.map; ctx.fill();
    ctx.beginPath(); path(estado.innerMesh); ctx.lineWidth = estado.innerBorderWidth; ctx.strokeStyle = estado.cores.inner; ctx.stroke();

    // pontos — para estes, checamos a visibilidade manualmente (distância
    // angular ao centro da vista), já que desenhamos os círculos direto
    // com ctx.arc (raio variável), não via path() do d3
    var rotLonRad = rot.lon * Math.PI / 180, rotLatRad = rot.lat * Math.PI / 180;
    var sinRot = Math.sin(rotLatRad), cosRot = Math.cos(rotLatRad);
    ctx.beginPath();
    for (var i = 0; i < estado.pontosValidos.length; i++) {
      var p = estado.pontosValidos[i];
      if (estado.hideBackPoints) {
        var lonRel = (p.lon * Math.PI / 180) - rotLonRad;
        var latRad = p.lat * Math.PI / 180;
        var cosc = sinRot * Math.sin(latRad) + cosRot * Math.cos(latRad) * Math.cos(lonRel);
        if (cosc < 0) { p._sx = undefined; p._sy = undefined; continue; }
      }
      var xy = projecao([p.lon, p.lat]);
      if (!xy) { p._sx = undefined; p._sy = undefined; continue; }
      p._sx = xy[0]; p._sy = xy[1];
      ctx.moveTo(xy[0] + estado.pointRadiusEfetivo, xy[1]);
      ctx.arc(xy[0], xy[1], estado.pointRadiusEfetivo, 0, 2 * Math.PI);
    }
    ctx.fillStyle = estado.pointColor;
    ctx.fill();
  }

  looker.plugins.visualizations.add(definicaoVisualizacao);
})();
