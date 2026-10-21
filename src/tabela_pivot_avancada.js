/*
 * Tabela Avançada com Pivôs — looker.plugins.visualizations.add
 * =============================================================
 * O QUE FAZ
 *   Tabela HTML para o Looker com:
 *     - Cabeçalhos agrupados quando a consulta tem pivô (1 linha de grupo do
 *       pivô + 1 linha com o nome de cada medida dentro do grupo).
 *     - Total geral (soma das colunas numéricas visíveis), no rodapé OU no
 *       topo (fixo logo abaixo do cabeçalho), à sua escolha.
 *     - Total por linha, por medida, quando a consulta é pivotada (usa o
 *       total de linha calculado pelo próprio Looker quando disponível —
 *       ver nota sobre "$$$_row_total_$$$" abaixo — e cai para uma soma
 *       própria quando o Looker não fornece esse total).
 *     - Cabeçalho, rodapé e colunas de dimensão fixos (sticky) de forma
 *       independente entre si (cada um com seu próprio liga/desliga).
 *     - Virtualização de linhas (renderiza só as linhas visíveis + uma
 *       margem configurável) para aguentar milhares de linhas sem travar.
 *     - Quase todo aspecto visual é configurável: cores, fonte, bordas,
 *       espaçamento, alinhamento, texto de valor nulo, etc. (ver lista de
 *       opções abaixo).
 *
 * CAMPOS ESPERADOS
 *   - Qualquer número de dimensões (ou "dimension_like", incluindo table
 *     calculations que se comportam como dimensão).
 *   - Qualquer número de medidas ("measure_like", incluindo table
 *     calculations que se comportam como medida).
 *   - Pivô opcional (0 ou mais campos de pivô).
 *
 * OPÇÕES (painel Edit no Looker) — todas agrupadas por seção:
 *   "Cores":            textColor, headerBgColor, headerTextColor,
 *                        totalBgColor, totalTextColor, zebraColor,
 *                        hoverColor, borderColor, linkColor
 *   "Tipografia":        fontFamily, fontSize, headerBold, headerUppercase
 *   "Bordas e Espaçamento": showVerticalBorders, showHorizontalBorders,
 *                        borderWidth, cellPaddingX, rowHeight,
 *                        headerRowHeight, footerRowHeight
 *   "Colunas":           freezeFirstColumn, freezeHeader, freezeFooter,
 *                        firstColumnWidth, columnWidth, textOverflow,
 *                        dimAlign, numberAlign, pivotLabelSeparator
 *   "Totais":            showColumnTotals, showRowTotals, totalsPosition,
 *                        totalsLabel, totalsBold, nullPlaceholder
 *   "Comportamento":     hoverHighlightRow, stripeRows, rowBufferSize,
 *                        enableDrill
 *
 * LIMITAÇÕES CONHECIDAS (ver README.md)
 *   - O total geral e o total por linha de contingência (quando o Looker
 *     não informa o total de linha pronto) são SEMPRE uma SOMA dos valores
 *     numéricos visíveis. Isso é correto para medidas do tipo soma/
 *     contagem, mas pode não bater com o que o Looker mostraria para
 *     medidas do tipo média, mediana, contagem distinta etc., porque a API
 *     de visualização não informa o tipo de agregação de cada medida nem
 *     recalcula totais para esses casos. Confira no Looker real se os
 *     totais calculados aqui fazem sentido para as medidas usadas.
 *   - Os números dos totais calculados por nós usam formatação pt-BR
 *     simples, não o value_format exato do campo (as células normais usam
 *     a formatação do próprio Looker e estão corretas).
 *   - Assumimos que campos marcados como "Hide from Visualization" no
 *     Explore já não aparecem em queryResponse.fields.dimension_like /
 *     measure_like. Não encontramos documentação confiável de uma lista
 *     separada "hidden_fields" para esta API clássica — confirme no Looker
 *     real e avise se algum campo oculto aparecer na tabela.
 *   - Larguras de coluna são fixas (configuráveis), não há ajuste
 *     automático por conteúdo, nem reordenar/redimensionar colunas
 *     arrastando com o mouse (isso fica para a tabela de busca/ordenação
 *     que vem mais adiante no roteiro).
 */

(function () {
  'use strict';

  // Chave especial que o Looker usa como chave de pivô para o total de
  // linha, quando a opção "Totais de linha" está habilitada no Explore.
  var ROW_TOTAL_KEY = '$$$_row_total_$$$';

  var FONT_STACKS = {
    system: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif',
    mono: 'ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace',
    serif: 'ui-serif,Georgia,"Times New Roman",serif'
  };

  var formatter = null;
  function formatNumero(n) {
    if (!formatter) {
      formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
    }
    return formatter.format(n);
  }

  function limparNo(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function criarEl(tag, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  // Texto de uma célula, respeitando nulos com um placeholder configurável.
  function textoDaCelula(cell, placeholderNulo) {
    if (cell === undefined || cell === null) return placeholderNulo;
    if (cell.value === undefined || cell.value === null) return placeholderNulo;
    try {
      if (window.LookerCharts && LookerCharts.Utils && typeof LookerCharts.Utils.textForCell === 'function') {
        return LookerCharts.Utils.textForCell(cell);
      }
    } catch (e) { /* ignora e cai no fallback abaixo */ }
    return cell.rendered !== undefined && cell.rendered !== null ? String(cell.rendered) : String(cell.value);
  }

  function valorNumericoDaCelula(cell) {
    if (!cell || cell.value === null || cell.value === undefined) return null;
    var n = Number(cell.value);
    return isNaN(n) ? null : n;
  }

  function rotuloDoCampo(field) {
    return field.label_short || field.label || field.name;
  }

  // Monta o rótulo de um grupo de pivô a partir dos campos de pivô da
  // consulta, usando o valor "rendered" quando disponível.
  function rotuloDoPivo(pivot, pivotFields, separador) {
    if (pivot.is_total) return null; // tratado separadamente (totalsLabel)
    var partes = [];
    for (var i = 0; i < pivotFields.length; i++) {
      var nomeCampo = pivotFields[i].name;
      var meta = pivot.metadata && pivot.metadata[nomeCampo];
      if (meta && meta.rendered) {
        partes.push(meta.rendered);
      } else if (pivot.data && pivot.data[nomeCampo] !== undefined && pivot.data[nomeCampo] !== null) {
        partes.push(String(pivot.data[nomeCampo]));
      }
    }
    return partes.length ? partes.join(separador) : pivot.key;
  }

  function aplicarDrill(cell, evento) {
    if (!cell || !cell.links || !cell.links.length) return;
    try {
      if (window.LookerCharts && LookerCharts.Utils && typeof LookerCharts.Utils.openDrillMenu === 'function') {
        LookerCharts.Utils.openDrillMenu({ links: cell.links, event: evento });
      }
    } catch (e) { /* drill indisponível nesta versão; ignora silenciosamente */ }
  }

  // Todas as cores/medidas visuais viram variáveis CSS (--lv-*), aplicadas
  // uma única vez no wrapper a cada updateAsync — assim as células, criadas
  // e recriadas centenas de vezes pela virtualização, não precisam setar
  // estilo individualmente para cada propriedade visual.
  var CSS_TEXTO = [
    '.lv-wrapper{position:relative;width:100%;height:100%;overflow:auto;',
    'font-family:var(--lv-font);box-sizing:border-box;background:#fff;color:var(--lv-text-color);}',
    '.lv-wrapper *{box-sizing:border-box;}',
    '.lv-table{border-collapse:separate;border-spacing:0;table-layout:fixed;}',
    '.lv-table th,.lv-table td{border-right:var(--lv-border-v) solid var(--lv-border-color);',
    'border-bottom:var(--lv-border-h) solid var(--lv-border-color);',
    'padding:0 var(--lv-pad-x);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.lv-wrap-text .lv-table th,.lv-wrap-text .lv-table td{white-space:normal;word-break:break-word;}',
    '.lv-table thead th{position:sticky;background:var(--lv-header-bg);color:var(--lv-header-text);',
    'text-align:left;z-index:2;border-bottom:2px solid var(--lv-border-color);}',
    '.lv-head-bold thead th{font-weight:700;}',
    '.lv-wrapper:not(.lv-head-bold) thead th{font-weight:500;}',
    '.lv-head-upper thead th{text-transform:uppercase;letter-spacing:.02em;}',
    '.lv-table thead tr.lv-head-group th{z-index:3;}',
    '.lv-th-dim{z-index:4 !important;text-align:var(--lv-dim-align);}',
    '.lv-td-dim{position:sticky;background:#fff;z-index:1;font-weight:500;text-align:var(--lv-dim-align);}',
    '.lv-row-zebra .lv-td-dim{background:var(--lv-zebra-color);}',
    '.lv-row-zebra td{background:var(--lv-zebra-color);}',
    '.lv-hover-row tbody tr:hover td,.lv-hover-row tbody tr:hover td.lv-td-dim{background:var(--lv-hover-color);}',
    '.lv-table tfoot td{position:sticky;bottom:0;z-index:2;border-top:2px solid var(--lv-border-color);}',
    '.lv-table tfoot td.lv-td-dim{z-index:3;}',
    '.lv-no-freeze-head thead th{position:static !important;}',
    '.lv-no-freeze-foot tfoot td{position:static !important;}',
    '.lv-total-row{background:var(--lv-total-bg);color:var(--lv-total-text);}',
    '.lv-total-row.lv-total-bold{font-weight:700;}',
    '.lv-num{text-align:var(--lv-num-align);font-variant-numeric:tabular-nums;}',
    '.lv-drill{cursor:pointer;text-decoration:underline dotted;color:var(--lv-link-color);}',
    '.lv-spacer td{border:none;padding:0;}',
    '.lv-empty{padding:16px;color:#6b7280;}'
  ].join('');

  var definicaoVisualizacao = {
    id: 'tabela_pivot_avancada',
    label: 'Tabela Avançada (Pivô, Totais e Colunas Fixas)',

    options: {
      // ---- Cores ----
      textColor: { type: 'string', label: 'Cor do texto', section: 'Cores', order: 1, display: 'color', default: '#1f2937' },
      headerBgColor: { type: 'string', label: 'Fundo do cabeçalho', section: 'Cores', order: 2, display: 'color', default: '#f3f4f6' },
      headerTextColor: { type: 'string', label: 'Texto do cabeçalho', section: 'Cores', order: 3, display: 'color', default: '#111827' },
      totalBgColor: { type: 'string', label: 'Fundo dos totais', section: 'Cores', order: 4, display: 'color', default: '#eef2ff' },
      totalTextColor: { type: 'string', label: 'Texto dos totais', section: 'Cores', order: 5, display: 'color', default: '#111827' },
      zebraColor: { type: 'string', label: 'Cor das linhas pares (zebra)', section: 'Cores', order: 6, display: 'color', default: '#fafafa' },
      hoverColor: { type: 'string', label: 'Cor ao passar o mouse na linha', section: 'Cores', order: 7, display: 'color', default: '#eef6ff' },
      borderColor: { type: 'string', label: 'Cor das bordas', section: 'Cores', order: 8, display: 'color', default: '#e5e7eb' },
      linkColor: { type: 'string', label: 'Cor das células com drill', section: 'Cores', order: 9, display: 'color', default: '#2563eb' },

      // ---- Tipografia ----
      fontFamily: {
        type: 'string', label: 'Família da fonte', section: 'Tipografia', order: 1, display: 'select', default: 'system',
        values: [{ 'Sistema (padrão)': 'system' }, { 'Monoespaçada': 'mono' }, { 'Serifada': 'serif' }]
      },
      fontSize: { type: 'number', label: 'Tamanho da fonte (px)', section: 'Tipografia', order: 2, display: 'range', min: 10, max: 20, step: 1, default: 13 },
      headerBold: { type: 'boolean', label: 'Cabeçalho em negrito', section: 'Tipografia', order: 3, default: true },
      headerUppercase: { type: 'boolean', label: 'Cabeçalho em maiúsculas', section: 'Tipografia', order: 4, default: false },

      // ---- Bordas e Espaçamento ----
      showVerticalBorders: { type: 'boolean', label: 'Mostrar bordas verticais', section: 'Bordas e Espaçamento', order: 1, default: true },
      showHorizontalBorders: { type: 'boolean', label: 'Mostrar bordas horizontais', section: 'Bordas e Espaçamento', order: 2, default: true },
      borderWidth: { type: 'number', label: 'Espessura da borda (px)', section: 'Bordas e Espaçamento', order: 3, display: 'range', min: 1, max: 4, step: 1, default: 1 },
      cellPaddingX: { type: 'number', label: 'Espaçamento horizontal da célula (px)', section: 'Bordas e Espaçamento', order: 4, display: 'range', min: 0, max: 24, step: 1, default: 8 },
      rowHeight: { type: 'number', label: 'Altura da linha (px)', section: 'Bordas e Espaçamento', order: 5, display: 'range', min: 22, max: 64, step: 2, default: 32 },
      headerRowHeight: { type: 'number', label: 'Altura de cada linha do cabeçalho (px)', section: 'Bordas e Espaçamento', order: 6, display: 'range', min: 22, max: 72, step: 2, default: 34 },
      footerRowHeight: { type: 'number', label: 'Altura da linha de total (px)', section: 'Bordas e Espaçamento', order: 7, display: 'range', min: 22, max: 72, step: 2, default: 34 },

      // ---- Colunas ----
      freezeFirstColumn: { type: 'boolean', label: 'Fixar colunas de dimensão (sticky)', section: 'Colunas', order: 1, default: true },
      freezeHeader: { type: 'boolean', label: 'Fixar cabeçalho', section: 'Colunas', order: 2, default: true },
      freezeFooter: { type: 'boolean', label: 'Fixar total no rodapé', section: 'Colunas', order: 3, default: true },
      firstColumnWidth: { type: 'number', label: 'Largura das colunas de dimensão (px)', section: 'Colunas', order: 4, display: 'range', min: 80, max: 480, step: 10, default: 200 },
      columnWidth: { type: 'number', label: 'Largura das colunas de medida/pivô (px)', section: 'Colunas', order: 5, display: 'range', min: 60, max: 360, step: 10, default: 130 },
      textOverflow: {
        type: 'string', label: 'Texto que não cabe na coluna', section: 'Colunas', order: 6, display: 'select', default: 'truncate',
        values: [{ 'Truncar com reticências': 'truncate' }, { 'Quebrar linha': 'wrap' }]
      },
      dimAlign: {
        type: 'string', label: 'Alinhamento das colunas de dimensão', section: 'Colunas', order: 7, display: 'select', default: 'left',
        values: [{ 'Esquerda': 'left' }, { 'Centro': 'center' }, { 'Direita': 'right' }]
      },
      numberAlign: {
        type: 'string', label: 'Alinhamento das colunas numéricas', section: 'Colunas', order: 8, display: 'select', default: 'right',
        values: [{ 'Direita': 'right' }, { 'Centro': 'center' }, { 'Esquerda': 'left' }]
      },
      pivotLabelSeparator: { type: 'string', label: 'Separador entre valores de pivô no cabeçalho', section: 'Colunas', order: 9, default: ' / ', placeholder: ' / ' },

      // ---- Totais ----
      showColumnTotals: { type: 'boolean', label: 'Mostrar total geral', section: 'Totais', order: 1, default: true },
      showRowTotals: { type: 'boolean', label: 'Mostrar total por linha (quando pivotado)', section: 'Totais', order: 2, default: true },
      totalsPosition: {
        type: 'string', label: 'Posição do total geral', section: 'Totais', order: 3, display: 'select', default: 'bottom',
        values: [{ 'Rodapé (embaixo)': 'bottom' }, { 'Topo (fixo abaixo do cabeçalho)': 'top' }]
      },
      totalsLabel: { type: 'string', label: 'Rótulo do total', section: 'Totais', order: 4, default: 'Total', placeholder: 'Total' },
      totalsBold: { type: 'boolean', label: 'Total em negrito', section: 'Totais', order: 5, default: true },
      nullPlaceholder: { type: 'string', label: 'Texto para valor nulo/ausente', section: 'Totais', order: 6, default: '∅', placeholder: '∅' },

      // ---- Comportamento ----
      hoverHighlightRow: { type: 'boolean', label: 'Destacar linha ao passar o mouse', section: 'Comportamento', order: 1, default: true },
      stripeRows: { type: 'boolean', label: 'Listrar linhas (zebra)', section: 'Comportamento', order: 2, default: true },
      rowBufferSize: { type: 'number', label: 'Linhas extras renderizadas fora da tela (buffer)', section: 'Comportamento', order: 3, display: 'range', min: 2, max: 40, step: 2, default: 8 },
      enableDrill: { type: 'boolean', label: 'Permitir clique para drill', section: 'Comportamento', order: 4, default: true }
    },

    create: function (element, config) {
      limparNo(element);

      var style = document.createElement('style');
      style.textContent = CSS_TEXTO;
      element.appendChild(style);

      var wrapper = criarEl('div', 'lv-wrapper');
      element.appendChild(wrapper);

      this._wrapper = wrapper;
      this._estado = null; // preenchido em updateAsync

      var self = this;
      this._onScroll = function () {
        if (self._tickScroll) return;
        self._tickScroll = true;
        requestAnimationFrame(function () {
          self._tickScroll = false;
          renderizarLinhasVisiveis(self);
        });
      };
      wrapper.addEventListener('scroll', this._onScroll, { passive: true });

      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(function () {
          renderizarLinhasVisiveis(self);
        });
        this._resizeObserver.observe(wrapper);
      }
    },

    updateAsync: function (data, element, config, queryResponse, details, done) {
      try {
        if (typeof this.clearErrors === 'function') this.clearErrors();
        montarTabela(this, data, config, queryResponse);
      } catch (erro) {
        if (typeof this.addError === 'function') {
          this.addError({
            title: 'Erro na Tabela Avançada (Pivô)',
            message: String((erro && erro.message) || erro)
          });
        }
      }
      done();
    }
  };

  // ---------------------------------------------------------------------
  // Aplica todas as opções visuais como variáveis/classes CSS no wrapper
  // ---------------------------------------------------------------------
  function aplicarEstiloWrapper(wrapper, config) {
    var vWidth = config.showVerticalBorders !== false ? (Number(config.borderWidth) || 1) : 0;
    var hWidth = config.showHorizontalBorders !== false ? (Number(config.borderWidth) || 1) : 0;

    var vars = {
      '--lv-font': FONT_STACKS[config.fontFamily] || FONT_STACKS.system,
      '--lv-text-color': config.textColor || '#1f2937',
      '--lv-header-bg': config.headerBgColor || '#f3f4f6',
      '--lv-header-text': config.headerTextColor || '#111827',
      '--lv-total-bg': config.totalBgColor || '#eef2ff',
      '--lv-total-text': config.totalTextColor || '#111827',
      '--lv-zebra-color': config.zebraColor || '#fafafa',
      '--lv-hover-color': config.hoverColor || '#eef6ff',
      '--lv-border-color': config.borderColor || '#e5e7eb',
      '--lv-link-color': config.linkColor || '#2563eb',
      '--lv-border-v': vWidth + 'px',
      '--lv-border-h': hWidth + 'px',
      '--lv-pad-x': (Number(config.cellPaddingX) >= 0 ? Number(config.cellPaddingX) : 8) + 'px',
      '--lv-dim-align': config.dimAlign || 'left',
      '--lv-num-align': config.numberAlign || 'right'
    };
    Object.keys(vars).forEach(function (k) { wrapper.style.setProperty(k, vars[k]); });

    wrapper.style.fontSize = (Number(config.fontSize) || 13) + 'px';

    var classes = {
      'lv-wrap-text': config.textOverflow === 'wrap',
      'lv-head-bold': config.headerBold !== false,
      'lv-head-upper': !!config.headerUppercase,
      'lv-hover-row': config.hoverHighlightRow !== false,
      'lv-no-freeze-head': config.freezeHeader === false,
      'lv-no-freeze-foot': config.freezeFooter === false
    };
    Object.keys(classes).forEach(function (c) {
      wrapper.classList.toggle(c, !!classes[c]);
    });
  }

  // ---------------------------------------------------------------------
  // Construção da tabela (chamada a cada updateAsync)
  // ---------------------------------------------------------------------
  function montarTabela(viz, data, config, queryResponse) {
    var wrapper = viz._wrapper;
    limparNo(wrapper);
    aplicarEstiloWrapper(wrapper, config);

    if (!queryResponse || !queryResponse.fields) {
      if (typeof viz.addError === 'function') {
        viz.addError({ title: 'Dados insuficientes', message: 'queryResponse.fields não está disponível.' });
      }
      return;
    }

    var dims = queryResponse.fields.dimension_like || [];
    var medidas = queryResponse.fields.measure_like || [];

    if (dims.length === 0 && medidas.length === 0) {
      var vazio = criarEl('div', 'lv-empty');
      vazio.textContent = 'Selecione ao menos uma dimensão ou uma medida para montar a tabela.';
      wrapper.appendChild(vazio);
      return;
    }

    var pivotFields = queryResponse.fields.pivots || [];
    var todosPivots = (queryResponse.pivots && queryResponse.pivots.length) ? queryResponse.pivots : null;
    var pivotTotalDoLooker = todosPivots ? filtrarPrimeiro(todosPivots, function (p) { return p.is_total; }) : null;
    var pivotsDeDados = todosPivots ? todosPivots.filter(function (p) { return !p.is_total; }) : null;

    var mostrarTotalLinha = !!config.showRowTotals && !!pivotsDeDados;
    var mostrarTotalGeral = config.showColumnTotals !== false;
    var totalNoTopo = config.totalsPosition === 'top';
    var rotuloTotal = (config.totalsLabel || 'Total');
    var placeholderNulo = (config.nullPlaceholder !== undefined && config.nullPlaceholder !== null) ? config.nullPlaceholder : '∅';
    var separadorPivo = config.pivotLabelSeparator || ' / ';
    var podeFazerDrill = config.enableDrill !== false;

    var fixarPrimeiraColuna = config.freezeFirstColumn !== false;
    var largDim = Number(config.firstColumnWidth) || 200;
    var largMedida = Number(config.columnWidth) || 130;
    var alturaLinha = Number(config.rowHeight) || 32;
    var alturaCabecalhoLinha = Number(config.headerRowHeight) || 34;
    var alturaRodape = Number(config.footerRowHeight) || 34;
    var zebra = config.stripeRows !== false;
    var negritoTotal = config.totalsBold !== false;

    // ---- Monta o modelo de colunas ----
    var colunas = dims.map(function (f) {
      return { tipo: 'dim', field: f, largura: largDim };
    });

    if (pivotsDeDados) {
      pivotsDeDados.forEach(function (pivot) {
        medidas.forEach(function (m) {
          colunas.push({ tipo: 'medida', field: m, pivot: pivot, largura: largMedida });
        });
      });
      if (mostrarTotalLinha) {
        medidas.forEach(function (m) {
          colunas.push({ tipo: 'medida', field: m, pivot: pivotTotalDoLooker, ehTotalLinha: true, largura: largMedida });
        });
      }
    } else {
      medidas.forEach(function (m) {
        colunas.push({ tipo: 'medida', field: m, pivot: null, largura: largMedida });
      });
    }

    // left acumulado para sticky das colunas de dimensão
    var leftAcumulado = 0;
    colunas.forEach(function (c) {
      if (c.tipo === 'dim') {
        c._left = leftAcumulado;
        leftAcumulado += c.largura;
      }
    });

    var larguraTotalTabela = colunas.reduce(function (s, c) { return s + c.largura; }, 0);

    var tabela = criarEl('table', 'lv-table');
    tabela.style.width = larguraTotalTabela + 'px';

    // ---- Cabeçalho ----
    var thead = criarEl('thead');
    var thCantoVazio = null;

    if (pivotsDeDados) {
      var trGrupo = criarEl('tr', 'lv-head-group');
      trGrupo.style.height = alturaCabecalhoLinha + 'px';
      thCantoVazio = criarEl('th', 'lv-th-dim');
      thCantoVazio.rowSpan = 2;
      thCantoVazio.colSpan = Math.max(dims.length, 1);
      if (dims.length === 0) thCantoVazio.style.visibility = 'hidden';
      trGrupo.appendChild(thCantoVazio);

      pivotsDeDados.forEach(function (pivot) {
        var th = criarEl('th');
        th.colSpan = medidas.length;
        th.style.textAlign = 'center';
        th.textContent = rotuloDoPivo(pivot, pivotFields, separadorPivo);
        trGrupo.appendChild(th);
      });

      if (mostrarTotalLinha) {
        var thTotal = criarEl('th', 'lv-total-row' + (negritoTotal ? ' lv-total-bold' : ''));
        thTotal.colSpan = medidas.length;
        thTotal.style.textAlign = 'center';
        thTotal.textContent = rotuloTotal;
        trGrupo.appendChild(thTotal);
      }
      thead.appendChild(trGrupo);

      var trMedidas = criarEl('tr');
      trMedidas.style.height = alturaCabecalhoLinha + 'px';
      colunas.forEach(function (c) {
        if (c.tipo !== 'medida') return;
        var th = criarEl('th', 'lv-num' + (c.ehTotalLinha ? ' lv-total-row' + (negritoTotal ? ' lv-total-bold' : '') : ''));
        th.style.width = c.largura + 'px';
        th.textContent = rotuloDoCampo(c.field);
        trMedidas.appendChild(th);
      });
      thead.appendChild(trMedidas);
    } else {
      var trUnica = criarEl('tr');
      trUnica.style.height = alturaCabecalhoLinha + 'px';
      colunas.forEach(function (c) {
        var th = criarEl('th', c.tipo === 'dim' ? 'lv-th-dim' : 'lv-num');
        th.style.width = c.largura + 'px';
        if (c.tipo === 'dim' && fixarPrimeiraColuna) {
          th.style.left = c._left + 'px';
        }
        th.textContent = rotuloDoCampo(c.field);
        trUnica.appendChild(th);
      });
      thead.appendChild(trUnica);
    }

    if (pivotsDeDados && fixarPrimeiraColuna && thCantoVazio) {
      thCantoVazio.style.left = '0px';
    }

    // ---- Total no topo (opcional): mais uma linha dentro do <thead> ----
    if (mostrarTotalGeral && totalNoTopo) {
      thead.appendChild(construirLinhaTotal(colunas, data, {
        rotuloTotal: rotuloTotal, fixarPrimeiraColuna: fixarPrimeiraColuna,
        alturaRodape: alturaRodape, negritoTotal: negritoTotal
      }));
    }

    tabela.appendChild(thead);

    // ---- Corpo (virtualizado) ----
    var tbody = criarEl('tbody');
    tabela.appendChild(tbody);

    // ---- Total no rodapé (opcional) ----
    var tfoot = null;
    if (mostrarTotalGeral && !totalNoTopo) {
      tfoot = criarEl('tfoot');
      tfoot.appendChild(construirLinhaTotal(colunas, data, {
        rotuloTotal: rotuloTotal, fixarPrimeiraColuna: fixarPrimeiraColuna,
        alturaRodape: alturaRodape, negritoTotal: negritoTotal
      }));
      tabela.appendChild(tfoot);
    }

    wrapper.appendChild(tabela);

    // offsets de "top" para o(s) cabeçalho(s) sticky (precisa do elemento já
    // estar no DOM para medir a altura real de cada linha)
    var alturaTotalCabecalho = aplicarOffsetsStickyTop(thead);

    // guarda o estado para a renderização virtualizada das linhas
    viz._estado = {
      data: data,
      colunas: colunas,
      tbody: tbody,
      alturaLinha: alturaLinha,
      alturaCabecalho: alturaTotalCabecalho,
      zebra: zebra,
      fixarPrimeiraColuna: fixarPrimeiraColuna,
      numColunas: colunas.length,
      placeholderNulo: placeholderNulo,
      podeFazerDrill: podeFazerDrill,
      bufferLinhas: Math.max(0, Number(config.rowBufferSize) || 8)
    };

    renderizarLinhasVisiveis(viz);
  }

  // Cria a linha de total (geral), reaproveitada tanto no <thead> (posição
  // "topo") quanto no <tfoot> (posição "rodapé" — padrão).
  function construirLinhaTotal(colunas, data, opts) {
    var tr = criarEl('tr', 'lv-total-row' + (opts.negritoTotal ? ' lv-total-bold' : ''));
    tr.style.height = opts.alturaRodape + 'px';
    colunas.forEach(function (c, idx) {
      var td = criarEl('td');
      td.style.width = c.largura + 'px';
      if (c.tipo === 'dim') {
        td.className = 'lv-td-dim lv-total-row' + (opts.negritoTotal ? ' lv-total-bold' : '');
        if (opts.fixarPrimeiraColuna) td.style.left = c._left + 'px';
        td.textContent = idx === 0 ? opts.rotuloTotal : '';
      } else {
        td.className = 'lv-num';
        if (c.field.is_numeric) {
          var soma = somaColuna(data, c);
          td.textContent = formatNumero(soma);
        } else {
          td.textContent = '';
        }
      }
      tr.appendChild(td);
    });
    return tr;
  }

  // Aplica "top" cumulativo em cada linha do <thead> (suporta 1, 2 ou 3
  // linhas de cabeçalho — com ou sem pivô, com ou sem total no topo) e
  // retorna a altura total do cabeçalho, usada depois na virtualização.
  function aplicarOffsetsStickyTop(thead) {
    var acumulado = 0;
    Array.prototype.forEach.call(thead.rows, function (tr) {
      Array.prototype.forEach.call(tr.cells, function (cell) {
        cell.style.top = acumulado + 'px';
      });
      acumulado += tr.getBoundingClientRect().height;
    });
    return acumulado;
  }

  function filtrarPrimeiro(arr, pred) {
    for (var i = 0; i < arr.length; i++) if (pred(arr[i])) return arr[i];
    return null;
  }

  function celulaDaColuna(row, coluna) {
    var porCampo = row[coluna.field.name];
    if (coluna.ehTotalLinha) {
      // usa o total de linha calculado pelo Looker, se existir; senão soma manualmente
      if (!porCampo) return undefined;
      if (coluna.pivot && porCampo[coluna.pivot.key] !== undefined) {
        return porCampo[coluna.pivot.key];
      }
      if (porCampo[ROW_TOTAL_KEY] !== undefined) {
        return porCampo[ROW_TOTAL_KEY];
      }
      return somaFallbackLinha(porCampo);
    }
    if (!coluna.pivot) return porCampo;
    if (!porCampo) return undefined;
    return porCampo[coluna.pivot.key];
  }

  function somaFallbackLinha(porCampoPivotado) {
    var soma = 0;
    var achouAlgum = false;
    for (var chave in porCampoPivotado) {
      if (!Object.prototype.hasOwnProperty.call(porCampoPivotado, chave)) continue;
      if (chave === ROW_TOTAL_KEY) continue;
      var n = valorNumericoDaCelula(porCampoPivotado[chave]);
      if (n !== null) { soma += n; achouAlgum = true; }
    }
    return achouAlgum ? { value: soma, rendered: formatNumero(soma) } : { value: null };
  }

  function somaColuna(data, coluna) {
    var soma = 0;
    for (var i = 0; i < data.length; i++) {
      var cell = celulaDaColuna(data[i], coluna);
      var n = valorNumericoDaCelula(cell);
      if (n !== null) soma += n;
    }
    return soma;
  }

  // ---------------------------------------------------------------------
  // Virtualização: renderiza só a janela de linhas visível no scroll
  // ---------------------------------------------------------------------
  function renderizarLinhasVisiveis(viz) {
    var estado = viz._estado;
    if (!estado) return;
    var wrapper = viz._wrapper;
    var tbody = estado.tbody;
    var data = estado.data;
    var total = data.length;
    var alturaLinha = estado.alturaLinha;

    var margem = estado.bufferLinhas;
    var scrollRelativo = Math.max(0, wrapper.scrollTop - estado.alturaCabecalho);
    var inicio = Math.max(0, Math.floor(scrollRelativo / alturaLinha) - margem);
    var qtdVisivel = Math.ceil(wrapper.clientHeight / alturaLinha) + margem * 2;
    var fim = Math.min(total, inicio + qtdVisivel);

    limparNo(tbody);

    if (inicio > 0) {
      tbody.appendChild(criarLinhaEspacadora(inicio * alturaLinha, estado.numColunas));
    }

    for (var i = inicio; i < fim; i++) {
      tbody.appendChild(criarLinhaDados(data[i], i, estado));
    }

    if (fim < total) {
      tbody.appendChild(criarLinhaEspacadora((total - fim) * alturaLinha, estado.numColunas));
    }
  }

  function criarLinhaEspacadora(altura, numColunas) {
    var tr = criarEl('tr', 'lv-spacer');
    tr.style.height = altura + 'px';
    var td = criarEl('td');
    td.colSpan = numColunas;
    tr.appendChild(td);
    return tr;
  }

  function criarLinhaDados(row, indice, estado) {
    var tr = criarEl('tr');
    tr.style.height = estado.alturaLinha + 'px';
    if (estado.zebra && indice % 2 === 1) tr.classList.add('lv-row-zebra');

    estado.colunas.forEach(function (coluna) {
      var cell = celulaDaColuna(row, coluna);
      var td = criarEl('td');
      td.style.width = coluna.largura + 'px';

      if (coluna.tipo === 'dim') {
        td.className = 'lv-td-dim';
        if (estado.fixarPrimeiraColuna) td.style.left = coluna._left + 'px';
      } else {
        td.className = 'lv-num' + (coluna.ehTotalLinha ? ' lv-total-row' : '');
      }

      td.textContent = textoDaCelula(cell, estado.placeholderNulo);

      if (estado.podeFazerDrill && cell && cell.links && cell.links.length) {
        td.classList.add('lv-drill');
        td.addEventListener('click', function (ev) { aplicarDrill(cell, ev); });
      }

      tr.appendChild(td);
    });

    return tr;
  }

  looker.plugins.visualizations.add(definicaoVisualizacao);
})();
