/*
 * Tabela Avançada com Pivôs — looker.plugins.visualizations.add
 * =============================================================
 * O QUE FAZ
 *   Tabela HTML para o Looker com:
 *     - Cabeçalhos agrupados quando a consulta tem pivô (1 linha de grupo do
 *       pivô + 1 linha com o nome de cada medida dentro do grupo).
 *     - Total geral no rodapé (soma das colunas numéricas visíveis).
 *     - Total por linha, por medida, quando a consulta é pivotada (usa o
 *       total de linha calculado pelo próprio Looker quando disponível —
 *       ver nota sobre "$$$_row_total_$$$" abaixo — e cai para uma soma
 *       própria quando o Looker não fornece esse total).
 *     - Colunas de dimensão fixas (sticky) à esquerda e cabeçalho/rodapé
 *       fixos no topo/base, com rolagem vertical e horizontal.
 *     - Virtualização de linhas (renderiza só as linhas visíveis + uma
 *       margem) para aguentar milhares de linhas sem travar o navegador.
 *
 * CAMPOS ESPERADOS
 *   - Qualquer número de dimensões (ou "dimension_like", incluindo table
 *     calculations que se comportam como dimensão).
 *   - Qualquer número de medidas ("measure_like", incluindo table
 *     calculations que se comportam como medida).
 *   - Pivô opcional (0 ou mais campos de pivô).
 *
 * OPÇÕES (painel Edit no Looker)
 *   Seção "Totais":  showColumnTotals, showRowTotals, totalsLabel
 *   Seção "Colunas": freezeFirstColumn, firstColumnWidth, columnWidth
 *   Seção "Estilo":  rowHeight, fontSize, stripeRows, headerBgColor,
 *                    totalBgColor, numberAlign
 *
 * LIMITAÇÕES CONHECIDAS (ver README.md)
 *   - O total geral (rodapé) e o total por linha de contingência (quando o
 *     Looker não informa o total de linha pronto) são SEMPRE uma SOMA dos
 *     valores numéricos visíveis. Isso é correto para medidas do tipo soma/
 *     contagem, mas pode não bater com o que o Looker mostraria para
 *     medidas do tipo média, mediana, contagem distinta etc., porque a API
 *     de visualização não informa o tipo de agregação de cada medida nem
 *     recalcula totais para esses casos. Confira no Looker real se os
 *     totais calculados aqui fazem sentido para as medidas usadas.
 *   - Assumimos que campos marcados como "Hide from Visualization" no
 *     Explore já não aparecem em queryResponse.fields.dimension_like /
 *     measure_like. Não encontramos documentação confiável de uma lista
 *     separada "hidden_fields" para esta API clássica — confirme no Looker
 *     real e avise se algum campo oculto aparecer na tabela.
 *   - Larguras de coluna são fixas (configuráveis), não há ajuste
 *     automático por conteúdo.
 */

(function () {
  'use strict';

  // Chave especial que o Looker usa como chave de pivô para o total de
  // linha, quando a opção "Totais de linha" está habilitada no Explore.
  var ROW_TOTAL_KEY = '$$$_row_total_$$$';

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

  function textoDaCelula(cell) {
    if (cell === undefined || cell === null) return '';
    try {
      if (window.LookerCharts && LookerCharts.Utils && typeof LookerCharts.Utils.textForCell === 'function') {
        return LookerCharts.Utils.textForCell(cell);
      }
    } catch (e) { /* ignora e cai no fallback abaixo */ }
    if (typeof cell === 'object' && 'value' in cell) {
      return cell.value === null || cell.value === undefined ? '' : String(cell.value);
    }
    return String(cell);
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
  function rotuloDoPivo(pivot, pivotFields) {
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
    return partes.length ? partes.join(' / ') : pivot.key;
  }

  function aplicarDrill(cell, evento) {
    if (!cell || !cell.links || !cell.links.length) return;
    try {
      if (window.LookerCharts && LookerCharts.Utils && typeof LookerCharts.Utils.openDrillMenu === 'function') {
        LookerCharts.Utils.openDrillMenu({ links: cell.links, event: evento });
      }
    } catch (e) { /* drill indisponível nesta versão; ignora silenciosamente */ }
  }

  var CSS_TEXTO = [
    '.lv-wrapper{position:relative;width:100%;height:100%;overflow:auto;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;',
    'box-sizing:border-box;background:#fff;color:#1f2937;}',
    '.lv-wrapper *{box-sizing:border-box;}',
    '.lv-table{border-collapse:separate;border-spacing:0;table-layout:fixed;}',
    '.lv-table th,.lv-table td{border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;',
    'padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.lv-table thead th{position:sticky;top:0;background:#f3f4f6;font-weight:600;text-align:left;',
    'z-index:2;border-bottom:2px solid #d1d5db;}',
    '.lv-table thead tr.lv-head-group th{z-index:3;}',
    '.lv-th-dim{z-index:4 !important;}',
    '.lv-td-dim{position:sticky;background:#fff;z-index:1;font-weight:500;}',
    '.lv-row-zebra .lv-td-dim{background:#fafafa;}',
    '.lv-row-zebra td{background:#fafafa;}',
    '.lv-table tfoot td{position:sticky;bottom:0;font-weight:700;z-index:2;',
    'border-top:2px solid #d1d5db;}',
    '.lv-table tfoot td.lv-td-dim{z-index:3;}',
    '.lv-num{text-align:right;font-variant-numeric:tabular-nums;}',
    '.lv-drill{cursor:pointer;text-decoration:underline dotted;}',
    '.lv-spacer td{border:none;padding:0;}',
    '.lv-empty{padding:16px;color:#6b7280;}'
  ].join('');

  var definicaoVisualizacao = {
    id: 'tabela_pivot_avancada',
    label: 'Tabela Avançada (Pivô, Totais e Colunas Fixas)',

    options: {
      showColumnTotals: {
        type: 'boolean', label: 'Mostrar total geral (rodapé)',
        section: 'Totais', order: 1, default: true
      },
      showRowTotals: {
        type: 'boolean', label: 'Mostrar total por linha (quando pivotado)',
        section: 'Totais', order: 2, default: true
      },
      totalsLabel: {
        type: 'string', label: 'Rótulo do total',
        section: 'Totais', order: 3, default: 'Total', placeholder: 'Total'
      },
      freezeFirstColumn: {
        type: 'boolean', label: 'Fixar colunas de dimensão (sticky)',
        section: 'Colunas', order: 1, default: true
      },
      firstColumnWidth: {
        type: 'number', label: 'Largura das colunas de dimensão (px)',
        section: 'Colunas', order: 2, default: 200, display: 'range', min: 100, max: 480, step: 10
      },
      columnWidth: {
        type: 'number', label: 'Largura das colunas de medida/pivô (px)',
        section: 'Colunas', order: 3, default: 130, display: 'range', min: 60, max: 360, step: 10
      },
      rowHeight: {
        type: 'number', label: 'Altura da linha (px)',
        section: 'Estilo', order: 1, default: 32, display: 'range', min: 22, max: 56, step: 2
      },
      fontSize: {
        type: 'number', label: 'Tamanho da fonte (px)',
        section: 'Estilo', order: 2, default: 13, display: 'range', min: 10, max: 18, step: 1
      },
      stripeRows: {
        type: 'boolean', label: 'Listrar linhas (zebra)',
        section: 'Estilo', order: 3, default: true
      },
      headerBgColor: {
        type: 'string', label: 'Cor de fundo do cabeçalho',
        section: 'Estilo', order: 4, display: 'color', default: '#f3f4f6'
      },
      totalBgColor: {
        type: 'string', label: 'Cor de fundo dos totais',
        section: 'Estilo', order: 5, display: 'color', default: '#eef2ff'
      },
      numberAlign: {
        type: 'string', label: 'Alinhamento de números',
        section: 'Estilo', order: 6, display: 'select', default: 'right',
        values: [{ 'Direita': 'right' }, { 'Centro': 'center' }, { 'Esquerda': 'left' }]
      }
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
  // Construção da tabela (chamada a cada updateAsync)
  // ---------------------------------------------------------------------
  function montarTabela(viz, data, config, queryResponse) {
    var wrapper = viz._wrapper;
    limparNo(wrapper);

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
    var rotuloTotal = (config.totalsLabel || 'Total');

    var fixarPrimeiraColuna = config.freezeFirstColumn !== false;
    var largDim = Number(config.firstColumnWidth) || 200;
    var largMedida = Number(config.columnWidth) || 130;
    var alturaLinha = Number(config.rowHeight) || 32;
    var fonte = Number(config.fontSize) || 13;
    var zebra = config.stripeRows !== false;
    var corCabecalho = config.headerBgColor || '#f3f4f6';
    var corTotal = config.totalBgColor || '#eef2ff';
    var alinhNumero = config.numberAlign || 'right';

    wrapper.style.fontSize = fonte + 'px';

    // ---- Monta o modelo de colunas ----
    // colunas de dimensão
    var colunas = dims.map(function (f) {
      return { tipo: 'dim', field: f, largura: largDim };
    });

    // colunas de medida (com ou sem pivô) + coluna de total de linha
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
    if (pivotsDeDados) {
      var trGrupo = criarEl('tr', 'lv-head-group');
      var thCantoVazio = criarEl('th', dims.length ? 'lv-th-dim' : '');
      thCantoVazio.rowSpan = 2;
      thCantoVazio.colSpan = Math.max(dims.length, 1);
      thCantoVazio.style.background = corCabecalho;
      if (dims.length === 0) thCantoVazio.style.visibility = 'hidden';
      trGrupo.appendChild(thCantoVazio);

      pivotsDeDados.forEach(function (pivot) {
        var th = criarEl('th');
        th.colSpan = medidas.length;
        th.style.background = corCabecalho;
        th.style.textAlign = 'center';
        th.textContent = rotuloDoPivo(pivot, pivotFields);
        trGrupo.appendChild(th);
      });

      if (mostrarTotalLinha) {
        var thTotal = criarEl('th');
        thTotal.colSpan = medidas.length;
        thTotal.style.background = corTotal;
        thTotal.style.textAlign = 'center';
        thTotal.textContent = rotuloTotal;
        trGrupo.appendChild(thTotal);
      }
      thead.appendChild(trGrupo);

      var trMedidas = criarEl('tr');
      colunas.forEach(function (c) {
        if (c.tipo !== 'medida') return;
        var th = criarEl('th', 'lv-num');
        th.style.background = c.ehTotalLinha ? corTotal : corCabecalho;
        th.style.width = c.largura + 'px';
        th.textContent = rotuloDoCampo(c.field);
        trMedidas.appendChild(th);
      });
      thead.appendChild(trMedidas);
    } else {
      var trUnica = criarEl('tr');
      colunas.forEach(function (c) {
        var th = criarEl('th', c.tipo === 'dim' ? 'lv-th-dim' : 'lv-num');
        th.style.width = c.largura + 'px';
        th.style.background = corCabecalho;
        if (c.tipo === 'dim' && fixarPrimeiraColuna) {
          th.style.left = c._left + 'px';
        }
        th.textContent = rotuloDoCampo(c.field);
        trUnica.appendChild(th);
      });
      thead.appendChild(trUnica);
    }

    // aplica sticky-left nas colunas de dimensão da 2ª linha de cabeçalho (modo pivô)
    if (pivotsDeDados && fixarPrimeiraColuna) {
      // a th de canto (rowSpan 2) já cobre a coluna de dimensão; nada extra a fazer aqui
      // além de garantir a posição fixa do próprio canto:
      thCantoVazio.classList.add('lv-th-dim');
      thCantoVazio.style.left = '0px';
    }

    tabela.appendChild(thead);

    // ---- Corpo (virtualizado) ----
    var tbody = criarEl('tbody');
    tabela.appendChild(tbody);

    // ---- Rodapé (total geral) ----
    var tfoot = null;
    if (mostrarTotalGeral) {
      tfoot = criarEl('tfoot');
      var trFoot = criarEl('tr');
      colunas.forEach(function (c, idx) {
        var td = criarEl('td');
        td.style.width = c.largura + 'px';
        td.style.background = corTotal;
        if (c.tipo === 'dim') {
          td.className = 'lv-td-dim';
          if (fixarPrimeiraColuna) td.style.left = c._left + 'px';
          td.textContent = idx === 0 ? rotuloTotal : '';
        } else {
          td.className = 'lv-num';
          td.style.textAlign = alinhNumero;
          if (c.field.is_numeric) {
            var soma = somaColuna(data, c);
            td.textContent = formatNumero(soma);
          } else {
            td.textContent = '';
          }
        }
        trFoot.appendChild(td);
      });
      tfoot.appendChild(trFoot);
      tabela.appendChild(tfoot);
    }

    wrapper.appendChild(tabela);

    // guarda o estado para a renderização virtualizada das linhas
    viz._estado = {
      data: data,
      colunas: colunas,
      tbody: tbody,
      alturaLinha: alturaLinha,
      zebra: zebra,
      alinhNumero: alinhNumero,
      fixarPrimeiraColuna: fixarPrimeiraColuna,
      larguraTotalTabela: larguraTotalTabela,
      numColunas: colunas.length
    };

    renderizarLinhasVisiveis(viz);
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

    var theadEl = tbody.parentElement.querySelector('thead');
    var alturaCabecalho = theadEl ? theadEl.getBoundingClientRect().height : 0;

    var margem = 8;
    var scrollRelativo = Math.max(0, wrapper.scrollTop - alturaCabecalho);
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
        td.className = 'lv-num';
        td.style.textAlign = estado.alinhNumero;
        if (coluna.ehTotalLinha) td.style.fontWeight = '600';
      }

      td.textContent = textoDaCelula(cell);

      if (cell && cell.links && cell.links.length) {
        td.classList.add('lv-drill');
        td.addEventListener('click', function (ev) { aplicarDrill(cell, ev); });
      }

      tr.appendChild(td);
    });

    return tr;
  }

  looker.plugins.visualizations.add(definicaoVisualizacao);
})();
