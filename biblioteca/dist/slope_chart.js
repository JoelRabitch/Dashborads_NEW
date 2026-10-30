/*!
 * Slope Chart — visualização customizada para o Looker
 * id: slope_chart
 * versão: 0.1.0
 *
 * Arquivo AUTOCONTIDO: no Looker, o campo "Dependencies" deve ficar VAZIO.
 * Gerado por biblioteca/build/build.mjs — não edite este arquivo à mão;
 * edite src/charts/slope_chart/index.js e rode `npm run build`.
 */
(() => {
  // src/core/looker-adapter.js
  var PREFIXO_LOG = "[biblioteca-looker]";
  var avisosJaDados = /* @__PURE__ */ new Set();
  function avisarUmaVez(chave, mensagem) {
    if (avisosJaDados.has(chave)) return;
    avisosJaDados.add(chave);
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`${PREFIXO_LOG} ${mensagem}`);
    }
  }
  function global_() {
    if (typeof globalThis !== "undefined") return globalThis;
    if (typeof window !== "undefined") return window;
    return {};
  }
  function utilsDoLooker() {
    const g = global_();
    const lc = g.LookerCharts;
    return lc && lc.Utils ? lc.Utils : null;
  }
  function recursosDoLooker() {
    const g = global_();
    const utils = utilsDoLooker();
    const temPluginAPI = !!(g.looker && g.looker.plugins && g.looker.plugins.visualizations && typeof g.looker.plugins.visualizations.add === "function");
    return {
      pluginAPI: temPluginAPI,
      textForCell: !!(utils && typeof utils.textForCell === "function"),
      htmlForCell: !!(utils && typeof utils.htmlForCell === "function"),
      openDrillMenu: !!(utils && typeof utils.openDrillMenu === "function"),
      filterableValueForCell: !!(utils && typeof utils.filterableValueForCell === "function"),
      toggleCrossfilter: !!(utils && typeof utils.toggleCrossfilter === "function"),
      getCrossfilterSelection: !!(utils && typeof utils.getCrossfilterSelection === "function")
    };
  }
  function registrarVisualizacao(definicaoCrua) {
    const g = global_();
    if (g.looker && g.looker.plugins && g.looker.plugins.visualizations && typeof g.looker.plugins.visualizations.add === "function") {
      g.looker.plugins.visualizations.add(definicaoCrua);
      return true;
    }
    avisarUmaVez(
      "sem-plugin-api",
      "looker.plugins.visualizations.add n\xE3o existe neste ambiente. A visualiza\xE7\xE3o n\xE3o foi registrada (isso \xE9 esperado fora do Looker)."
    );
    return false;
  }
  function criarPonte(instancia, opcoesEstaticas) {
    const ponte = {
      /** Limpa erros exibidos pelo Looker (se o método existir). */
      limparErros() {
        if (instancia && typeof instancia.clearErrors === "function") {
          instancia.clearErrors();
          return true;
        }
        avisarUmaVez("sem-clearErrors", "this.clearErrors() n\xE3o existe; erros antigos podem ficar na tela.");
        return false;
      },
      /** Mostra um erro na área da visualização. */
      mostrarErro(titulo, mensagem) {
        if (instancia && typeof instancia.addError === "function") {
          instancia.addError({ title: String(titulo), message: String(mensagem) });
          return true;
        }
        avisarUmaVez(
          "sem-addError",
          "this.addError() n\xE3o existe; mostrando o erro s\xF3 no console."
        );
        if (typeof console !== "undefined" && console.error) {
          console.error(`${PREFIXO_LOG} ${titulo}: ${mensagem}`);
        }
        return false;
      },
      /**
       * Registra opções dinâmicas (uma por campo, por série, etc.).
       *
       * CUIDADO IMPORTANTE (confirmado testando no Looker real): o evento
       * `registerOptions` SUBSTITUI o painel de opções inteiro pelo objeto
       * enviado — ele NÃO mescla com as `options` estáticas declaradas no
       * `looker.plugins.visualizations.add`. Se mandarmos só as dinâmicas, as
       * seções estáticas somem do painel Edit. Por isso esta função sempre
       * manda ESTÁTICAS + DINÂMICAS juntas.
       *
       * Também só dispara quando a assinatura muda, para não entrar em loop.
       *
       * @param {object} opcoesDinamicas opções novas (serão mescladas às estáticas)
       * @returns {boolean} true se chegou a registrar agora
       */
      registrarOpcoes(opcoesDinamicas) {
        if (!instancia || typeof instancia.trigger !== "function") {
          avisarUmaVez(
            "sem-trigger",
            "this.trigger() n\xE3o existe; op\xE7\xF5es din\xE2micas por campo n\xE3o aparecer\xE3o no painel Edit."
          );
          return false;
        }
        const dinamicas = opcoesDinamicas || {};
        const assinatura = JSON.stringify(Object.keys(dinamicas).sort()) + "|" + JSON.stringify(dinamicas);
        if (assinatura === instancia._blAssinaturaDasOpcoes) return false;
        instancia._blAssinaturaDasOpcoes = assinatura;
        const juntas = Object.assign({}, opcoesEstaticas || {}, dinamicas);
        const completas = {};
        Object.keys(juntas).sort((a, b) => (Number(juntas[a].order) || 0) - (Number(juntas[b].order) || 0)).forEach((k) => {
          completas[k] = juntas[k];
        });
        instancia._blOpcoesRegistradas = completas;
        instancia.trigger("registerOptions", completas);
        return true;
      },
      /** Opções que o painel tem agora (estáticas + dinâmicas registradas). */
      opcoesAtuais() {
        return instancia && instancia._blOpcoesRegistradas || opcoesEstaticas || {};
      },
      /**
       * Tenta PERSISTIR mudanças de configuração feitas pela própria viz
       * (ex.: largura/ordem de colunas que o usuário arrastou).
       *
       * ATENÇÃO: não há como DETECTAR se o Looker trata o evento
       * `updateConfig`. O `trigger` existe, mas se o evento não for suportado
       * nada acontece — e nós não temos retorno. Por isso:
       *   - a viz NUNCA deve depender disto para funcionar;
       *   - o estado real fica em memória na viz;
       *   - isto é "melhor esforço" para persistir entre sessões.
       * Ver docs/COMPAT.md.
       *
       * @returns {boolean} true se o evento chegou a ser disparado
       */
      atualizarConfig(configParcial) {
        if (!instancia || typeof instancia.trigger !== "function") {
          avisarUmaVez("sem-trigger-config", "this.trigger() n\xE3o existe; config n\xE3o ser\xE1 persistida.");
          return false;
        }
        if (!configParcial || typeof configParcial !== "object") return false;
        try {
          instancia.trigger("updateConfig", [configParcial]);
          return true;
        } catch (e) {
          avisarUmaVez("falha-updateConfig", `N\xE3o consegui persistir a config: ${e && e.message}`);
          return false;
        }
      },
      /**
       * Texto de exibição de uma célula. Prefere SEMPRE o que o Looker já
       * renderizou (respeita `value_format` e a localidade da conta).
       */
      textoDaCelula(celula, textoQuandoNulo = "\u2205") {
        if (celula === null || celula === void 0) return textoQuandoNulo;
        if (celula.value === null || celula.value === void 0) return textoQuandoNulo;
        const utils = utilsDoLooker();
        if (utils && typeof utils.textForCell === "function") {
          try {
            return utils.textForCell(celula);
          } catch (e) {
            avisarUmaVez("falha-textForCell", `textForCell falhou (${e && e.message}); usando rendered/value.`);
          }
        } else {
          avisarUmaVez(
            "sem-textForCell",
            "LookerCharts.Utils.textForCell n\xE3o existe; usando cell.rendered ou cell.value."
          );
        }
        if (celula.rendered !== void 0 && celula.rendered !== null) return String(celula.rendered);
        return String(celula.value);
      },
      /**
       * HTML de uma célula (links, data actions, formatação em HTML do LookML).
       * SÓ deve ser usado quando o usuário ligar a opção explícita de "usar
       * HTML do Looker" — por isso o gráfico precisa passar `permitido: true`.
       */
      htmlDaCelula(celula, { permitido = false } = {}) {
        if (!permitido) return null;
        const utils = utilsDoLooker();
        if (utils && typeof utils.htmlForCell === "function") {
          try {
            return utils.htmlForCell(celula);
          } catch (e) {
            avisarUmaVez("falha-htmlForCell", `htmlForCell falhou (${e && e.message}).`);
            return null;
          }
        }
        avisarUmaVez("sem-htmlForCell", "LookerCharts.Utils.htmlForCell n\xE3o existe; usando texto puro.");
        return null;
      },
      /** Verdadeiro se a célula tem links de drill utilizáveis. */
      temDrill(celula) {
        return !!(celula && Array.isArray(celula.links) && celula.links.length > 0);
      },
      /** Abre o menu de drill do Looker para a célula clicada. */
      abrirDrill(celula, evento) {
        if (!ponte.temDrill(celula)) return false;
        const utils = utilsDoLooker();
        if (utils && typeof utils.openDrillMenu === "function") {
          try {
            utils.openDrillMenu({ links: celula.links, event: evento });
            return true;
          } catch (e) {
            avisarUmaVez("falha-openDrillMenu", `openDrillMenu falhou (${e && e.message}).`);
            return false;
          }
        }
        avisarUmaVez("sem-openDrillMenu", "LookerCharts.Utils.openDrillMenu n\xE3o existe; drill desativado.");
        return false;
      },
      /** Valor em sintaxe de filtro do Looker (usado por cross-filter manual). */
      valorFiltravel(celula) {
        const utils = utilsDoLooker();
        if (utils && typeof utils.filterableValueForCell === "function") {
          try {
            return utils.filterableValueForCell(celula);
          } catch (_) {
          }
        }
        return celula && celula.value !== void 0 && celula.value !== null ? String(celula.value) : "";
      },
      /**
       * Abre uma URL. NÃO usa `window.open` (proibido pela seção 7 do
       * PROMPT_AGENTE.md): cria um link temporário com `rel="noopener"` e
       * dispara o clique. Só aceita http(s).
       */
      abrirUrl(url) {
        if (typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) {
          avisarUmaVez("url-invalida", "abrirUrl recebeu uma URL que n\xE3o \xE9 http(s); ignorada.");
          return false;
        }
        if (typeof document === "undefined") return false;
        const a = document.createElement("a");
        a.href = url.trim();
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
      },
      /** Cross-filter: só funciona se a API existir nesta versão do Looker. */
      crossfilter: {
        disponivel() {
          const utils = utilsDoLooker();
          return !!(utils && typeof utils.toggleCrossfilter === "function");
        },
        alternar(linha, pivo, evento) {
          const utils = utilsDoLooker();
          if (!(utils && typeof utils.toggleCrossfilter === "function")) {
            avisarUmaVez(
              "sem-crossfilter",
              "LookerCharts.Utils.toggleCrossfilter n\xE3o existe nesta vers\xE3o; cross-filter desativado."
            );
            return false;
          }
          try {
            utils.toggleCrossfilter({ row: linha, pivot: pivo, event: evento });
            return true;
          } catch (e) {
            avisarUmaVez("falha-crossfilter", `toggleCrossfilter falhou (${e && e.message}).`);
            return false;
          }
        },
        /** 0 = nenhuma seleção, 1 = selecionado, 2 = não selecionado. */
        selecao(linha, pivo) {
          const utils = utilsDoLooker();
          if (!(utils && typeof utils.getCrossfilterSelection === "function")) return 0;
          try {
            return utils.getCrossfilterSelection(linha, pivo) || 0;
          } catch (_) {
            return 0;
          }
        }
      },
      /** Relatório de detecção, para o modo debug dos gráficos. */
      recursos: recursosDoLooker
    };
    return ponte;
  }

  // node_modules/d3-format/src/formatDecimal.js
  function formatDecimal_default(x) {
    return Math.abs(x = Math.round(x)) >= 1e21 ? x.toLocaleString("en").replace(/,/g, "") : x.toString(10);
  }
  function formatDecimalParts(x, p) {
    if (!isFinite(x) || x === 0) return null;
    var i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e"), coefficient = x.slice(0, i);
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  }

  // node_modules/d3-format/src/exponent.js
  function exponent_default(x) {
    return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
  }

  // node_modules/d3-format/src/formatGroup.js
  function formatGroup_default(grouping, thousands) {
    return function(value, width) {
      var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }
      return t.reverse().join(thousands);
    };
  }

  // node_modules/d3-format/src/formatNumerals.js
  function formatNumerals_default(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // node_modules/d3-format/src/formatSpecifier.js
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }
  formatSpecifier.prototype = FormatSpecifier.prototype;
  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
    this.align = specifier.align === void 0 ? ">" : specifier.align + "";
    this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === void 0 ? void 0 : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === void 0 ? "" : specifier.type + "";
  }
  FormatSpecifier.prototype.toString = function() {
    return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
  };

  // node_modules/d3-format/src/formatTrim.js
  function formatTrim_default(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".":
          i0 = i1 = i;
          break;
        case "0":
          if (i0 === 0) i0 = i;
          i1 = i;
          break;
        default:
          if (!+s[i]) break out;
          if (i0 > 0) i0 = 0;
          break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  // node_modules/d3-format/src/formatPrefixAuto.js
  var prefixExponent;
  function formatPrefixAuto_default(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return prefixExponent = void 0, x.toPrecision(p);
    var coefficient = d[0], exponent = d[1], i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n = coefficient.length;
    return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0];
  }

  // node_modules/d3-format/src/formatRounded.js
  function formatRounded_default(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return x + "";
    var coefficient = d[0], exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  // node_modules/d3-format/src/formatTypes.js
  var formatTypes_default = {
    "%": (x, p) => (x * 100).toFixed(p),
    "b": (x) => Math.round(x).toString(2),
    "c": (x) => x + "",
    "d": formatDecimal_default,
    "e": (x, p) => x.toExponential(p),
    "f": (x, p) => x.toFixed(p),
    "g": (x, p) => x.toPrecision(p),
    "o": (x) => Math.round(x).toString(8),
    "p": (x, p) => formatRounded_default(x * 100, p),
    "r": formatRounded_default,
    "s": formatPrefixAuto_default,
    "X": (x) => Math.round(x).toString(16).toUpperCase(),
    "x": (x) => Math.round(x).toString(16)
  };

  // node_modules/d3-format/src/identity.js
  function identity_default(x) {
    return x;
  }

  // node_modules/d3-format/src/locale.js
  var map = Array.prototype.map;
  var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  function locale_default(locale2) {
    var group = locale2.grouping === void 0 || locale2.thousands === void 0 ? identity_default : formatGroup_default(map.call(locale2.grouping, Number), locale2.thousands + ""), currencyPrefix = locale2.currency === void 0 ? "" : locale2.currency[0] + "", currencySuffix = locale2.currency === void 0 ? "" : locale2.currency[1] + "", decimal = locale2.decimal === void 0 ? "." : locale2.decimal + "", numerals = locale2.numerals === void 0 ? identity_default : formatNumerals_default(map.call(locale2.numerals, String)), percent = locale2.percent === void 0 ? "%" : locale2.percent + "", minus = locale2.minus === void 0 ? "\u2212" : locale2.minus + "", nan = locale2.nan === void 0 ? "NaN" : locale2.nan + "";
    function newFormat(specifier, options) {
      specifier = formatSpecifier(specifier);
      var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
      if (type === "n") comma = true, type = "g";
      else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
      if (zero3 || fill === "0" && align === "=") zero3 = true, fill = "0", align = "=";
      var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : ""), suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
      var formatType = formatTypes_default[type], maybeSuffix = /[defgprs%]/.test(type);
      precision = precision === void 0 ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
      function format2(value) {
        var valuePrefix = prefix, valueSuffix = suffix, i, n, c;
        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;
          var valueNegative = value < 0 || 1 / value < 0;
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
          if (trim) value = formatTrim_default(value);
          if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;
          valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }
        if (comma && !zero3) value = group(value, Infinity);
        var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
        if (comma && zero3) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
        switch (align) {
          case "<":
            value = valuePrefix + value + valueSuffix + padding;
            break;
          case "=":
            value = valuePrefix + padding + value + valueSuffix;
            break;
          case "^":
            value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
            break;
          default:
            value = padding + valuePrefix + value + valueSuffix;
            break;
        }
        return numerals(value);
      }
      format2.toString = function() {
        return specifier + "";
      };
      return format2;
    }
    function formatPrefix2(specifier, value) {
      var e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
      return function(value2) {
        return f(k * value2);
      };
    }
    return {
      format: newFormat,
      formatPrefix: formatPrefix2
    };
  }

  // node_modules/d3-format/src/defaultLocale.js
  var locale;
  var format;
  var formatPrefix;
  defaultLocale({
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });
  function defaultLocale(definition) {
    locale = locale_default(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  // node_modules/d3-format/src/precisionFixed.js
  function precisionFixed_default(step) {
    return Math.max(0, -exponent_default(Math.abs(step)));
  }

  // node_modules/d3-format/src/precisionPrefix.js
  function precisionPrefix_default(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
  }

  // node_modules/d3-format/src/precisionRound.js
  function precisionRound_default(step, max2) {
    step = Math.abs(step), max2 = Math.abs(max2) - step;
    return Math.max(0, exponent_default(max2) - exponent_default(step)) + 1;
  }

  // src/core/format.js
  var cacheDeFormatadores = /* @__PURE__ */ new Map();
  function numeroOuNulo(valor) {
    if (valor === null || valor === void 0 || valor === "") return null;
    const n = typeof valor === "number" ? valor : Number(valor);
    return Number.isFinite(n) ? n : null;
  }
  function converterValueFormat(valueFormat) {
    if (typeof valueFormat !== "string" || !valueFormat.trim()) return null;
    let fmt = valueFormat.split(";")[0].trim();
    if (!fmt) return null;
    let prefixo = "";
    let sufixo = "";
    fmt = fmt.replace(/^"([^"]*)"/, (_, t) => {
      prefixo += t;
      return "";
    });
    fmt = fmt.replace(/"([^"]*)"\s*$/, (_, t) => {
      sufixo = t + sufixo;
      return "";
    });
    const moeda = /^(\\?R\$|\\?US\$|\\?\$|€|£|¥)\s*/.exec(fmt);
    if (moeda) {
      prefixo += moeda[1].replace(/\\/g, "") + (moeda[0].endsWith(" ") ? " " : "");
      fmt = fmt.slice(moeda[0].length);
    }
    const ehPercentual = /%/.test(fmt);
    if (ehPercentual) fmt = fmt.replace(/%/g, "");
    let divisor = 1;
    const escala = /([#0])(,+)\s*$/.exec(fmt);
    if (escala) {
      divisor = Math.pow(1e3, escala[2].length);
      fmt = fmt.replace(/,+\s*$/, "");
    }
    const usaSeparadorDeMilhar = /#,##|0,0/.test(fmt);
    let casas = 0;
    const parteDecimal = /\.([0#]+)/.exec(fmt);
    if (parteDecimal) casas = parteDecimal[1].length;
    if (!/[#0]/.test(fmt)) return null;
    const spec = (usaSeparadorDeMilhar ? "," : "") + "." + casas + (ehPercentual ? "%" : "f");
    return { spec, prefixo, sufixo, divisor, ehPercentual };
  }
  function formatadorDeValueFormat(valueFormat, opcoesPadrao = {}) {
    const chave = `vf:${valueFormat}|${JSON.stringify(opcoesPadrao)}`;
    if (cacheDeFormatadores.has(chave)) return cacheDeFormatadores.get(chave);
    const convertido = converterValueFormat(valueFormat);
    let fn;
    if (convertido) {
      const base = format(convertido.spec);
      fn = (valor) => {
        const n = numeroOuNulo(valor);
        if (n === null) return "";
        return convertido.prefixo + base(n / convertido.divisor) + convertido.sufixo;
      };
    } else {
      fn = criarFormatadorNumerico(opcoesPadrao);
    }
    cacheDeFormatadores.set(chave, fn);
    return fn;
  }
  function criarFormatadorNumerico(opcoes = {}) {
    const {
      estilo = "auto",
      casas = 2,
      prefixo = "",
      sufixo = "",
      separadorDeMilhar = true,
      simboloDaMoeda = "R$ "
    } = opcoes;
    const sep = separadorDeMilhar ? "," : "";
    const casasSeguras = Math.max(0, Math.min(10, Number(casas) || 0));
    let base;
    switch (estilo) {
      case "compacto":
        base = (n) => formatarCompacto(n, casasSeguras, sep);
        break;
      case "moeda":
        base = (n) => simboloDaMoeda + format(`${sep}.${casasSeguras}f`)(n);
        break;
      case "percentual":
        base = format(`${sep}.${casasSeguras}%`);
        break;
      case "cientifico":
        base = format(`.${casasSeguras}e`);
        break;
      case "numero":
        base = format(`${sep}.${casasSeguras}f`);
        break;
      case "auto":
      default:
        base = (n) => Number.isInteger(n) ? format(`${sep}d`)(n) : format(`${sep}.${casasSeguras}f`)(n);
        break;
    }
    return (valor) => {
      const n = numeroOuNulo(valor);
      if (n === null) return "";
      return prefixo + base(n) + sufixo;
    };
  }
  function formatarCompacto(n, casas, sep) {
    const abs = Math.abs(n);
    const sufixos = [
      [1e12, "T"],
      [1e9, "B"],
      [1e6, "M"],
      [1e3, "K"]
    ];
    for (const [limite, sufixo] of sufixos) {
      if (abs >= limite) return format(`${sep}.${casas}f`)(n / limite) + sufixo;
    }
    return Number.isInteger(n) ? format(`${sep}d`)(n) : format(`${sep}.${casas}f`)(n);
  }
  var formatarCurto = criarFormatadorNumerico({ estilo: "compacto", casas: 1 });
  function formatarPercentual(fracao, casas = 1) {
    const n = numeroOuNulo(fracao);
    if (n === null) return "";
    return format(`.${casas}%`)(n);
  }
  function paraData(valor) {
    if (valor === null || valor === void 0 || valor === "") return null;
    if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
    if (typeof valor === "number") {
      const d2 = new Date(valor);
      return Number.isNaN(d2.getTime()) ? null : d2;
    }
    const texto = String(valor).trim();
    if (/^\d{4}$/.test(texto)) return new Date(Number(texto), 0, 1);
    const mes = /^(\d{4})-(\d{1,2})$/.exec(texto);
    if (mes) return new Date(Number(mes[1]), Number(mes[2]) - 1, 1);
    const dataSimples = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(texto);
    if (dataSimples) {
      return new Date(Number(dataSimples[1]), Number(dataSimples[2]) - 1, Number(dataSimples[3]));
    }
    const comHora = /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(texto);
    if (comHora) {
      return new Date(
        Number(comHora[1]),
        Number(comHora[2]) - 1,
        Number(comHora[3]),
        Number(comHora[4]),
        Number(comHora[5]),
        Number(comHora[6] || 0)
      );
    }
    const d = new Date(texto);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  var MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function formatarData(valor, estilo = "auto") {
    const d = paraData(valor);
    if (!d) return valor === null || valor === void 0 ? "" : String(valor);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    switch (estilo) {
      case "ano":
        return String(ano);
      case "mesAno":
        return `${MESES_CURTOS[d.getMonth()]}/${String(ano).slice(2)}`;
      case "diaMes":
        return `${dia}/${mes}`;
      case "completo":
        return `${dia}/${mes}/${ano} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      case "auto":
      default:
        return `${dia}/${mes}/${ano}`;
    }
  }
  function truncar(texto, limite = 24) {
    const t = texto === null || texto === void 0 ? "" : String(texto);
    if (t.length <= limite) return t;
    return t.slice(0, Math.max(1, limite - 1)).trimEnd() + "\u2026";
  }

  // src/core/data-model.js
  var CHAVE_TOTAL_DE_LINHA = "$$$_row_total_$$$";
  var SEPARADOR_DE_PIVO = "|FIELD|";
  function normalizarCampo(campo, origem) {
    const tipo = campo.type || "";
    const nome = campo.name;
    return {
      nome,
      rotulo: campo.label || nome,
      rotuloCurto: campo.label_short || campo.label || nome,
      tipo,
      origem,
      // 'dimensao' | 'medida'
      ehNumerico: campo.is_numeric === true,
      ehTableCalc: origem === "table_calculation" || /table_calculation/i.test(tipo),
      valueFormat: campo.value_format || null,
      // Heurística de data: o Looker usa tipos como 'date_date', 'date_month'…
      ehData: /date|time|yesno/.test(tipo) ? /date|time/.test(tipo) : false,
      bruto: campo
    };
  }
  function descobrirCamposOcultos(queryResponse, config) {
    const nomes = /* @__PURE__ */ new Set();
    const candidatos = [
      config && config.hidden_fields,
      queryResponse && queryResponse.hidden_fields,
      queryResponse && queryResponse.fields && queryResponse.fields.hidden_fields,
      config && config.query_fields_hidden
    ];
    for (const lista of candidatos) {
      if (Array.isArray(lista)) {
        for (const n of lista) if (typeof n === "string") nomes.add(n);
      }
    }
    return nomes;
  }
  function rotuloDoPivo(pivo, camposDePivo, separador) {
    if (pivo.is_total) return "Total";
    const partes = [];
    for (const campo of camposDePivo) {
      const meta = pivo.metadata && pivo.metadata[campo.nome];
      if (meta && meta.rendered !== void 0 && meta.rendered !== null) {
        partes.push(String(meta.rendered));
        continue;
      }
      const bruto = pivo.data && pivo.data[campo.nome];
      if (bruto !== void 0 && bruto !== null) partes.push(String(bruto));
    }
    if (partes.length) return partes.join(separador);
    return String(pivo.key).split(SEPARADOR_DE_PIVO).join(separador);
  }
  function descobrirTotais(data, queryResponse) {
    const porCampo = {};
    let encontrados = false;
    const fontes = [
      queryResponse && queryResponse.totals_data,
      queryResponse && queryResponse.totals,
      data && data.totals_data
    ];
    for (const fonte of fontes) {
      if (fonte && typeof fonte === "object" && !Array.isArray(fonte)) {
        for (const nome of Object.keys(fonte)) {
          porCampo[nome] = fonte[nome];
          encontrados = true;
        }
        if (encontrados) break;
      }
    }
    return { encontrados, porCampo };
  }
  function construirModelo(data, queryResponse, config = {}, ponte = null) {
    const avisos = [];
    const campos = queryResponse && queryResponse.fields || {};
    const ocultos = descobrirCamposOcultos(queryResponse, config);
    const visivel = (campo) => !ocultos.has(campo.name);
    const dimensoesBrutas = (campos.dimension_like || campos.dimensions || []).filter(visivel);
    const medidasBrutas = (campos.measure_like || campos.measures || []).filter(visivel);
    const pivotsBrutos = campos.pivots || [];
    const dimensoes = dimensoesBrutas.map((c) => normalizarCampo(c, "dimensao"));
    const medidas = medidasBrutas.map((c) => normalizarCampo(c, "medida"));
    const camposDePivo = pivotsBrutos.map((c) => normalizarCampo(c, "dimensao"));
    if (ocultos.size) {
      avisos.push(`${ocultos.size} campo(s) ocultos na visualiza\xE7\xE3o foram ignorados.`);
    }
    const porNome = /* @__PURE__ */ new Map();
    for (const c of dimensoes) porNome.set(c.nome, c);
    for (const c of medidas) porNome.set(c.nome, c);
    for (const c of camposDePivo) porNome.set(c.nome, c);
    const separadorDePivo = config.separadorDeRotuloDePivo || " / ";
    const pivotsCrus = queryResponse && queryResponse.pivots || [];
    const pivots = pivotsCrus.map((p) => ({
      chave: p.key,
      ehTotal: !!p.is_total,
      rotulo: rotuloDoPivo(p, camposDePivo, separadorDePivo),
      valores: p.data || {},
      bruto: p
    }));
    const pivotsDeDados = pivots.filter((p) => !p.ehTotal);
    const temPivo = pivotsDeDados.length > 0;
    const linhas = Array.isArray(data) ? data : [];
    const totais = descobrirTotais(data, queryResponse);
    function celula(linha, nomeDoCampo, chaveDoPivo) {
      if (!linha) return void 0;
      const valorDoCampo = linha[nomeDoCampo];
      if (valorDoCampo === void 0 || valorDoCampo === null) return void 0;
      if (chaveDoPivo === void 0 || chaveDoPivo === null) {
        return valorDoCampo.value !== void 0 || valorDoCampo.rendered !== void 0 ? valorDoCampo : void 0;
      }
      return valorDoCampo[chaveDoPivo];
    }
    function valorNumerico(linha, nomeDoCampo, chaveDoPivo) {
      const c = celula(linha, nomeDoCampo, chaveDoPivo);
      if (!c) return null;
      return numeroOuNulo(c.value);
    }
    function valorBruto(linha, nomeDoCampo, chaveDoPivo) {
      const c = celula(linha, nomeDoCampo, chaveDoPivo);
      return c ? c.value : null;
    }
    function texto(linha, nomeDoCampo, chaveDoPivo, textoQuandoNulo = "\u2205") {
      const c = celula(linha, nomeDoCampo, chaveDoPivo);
      if (ponte && typeof ponte.textoDaCelula === "function") {
        return ponte.textoDaCelula(c, textoQuandoNulo);
      }
      if (!c || c.value === null || c.value === void 0) return textoQuandoNulo;
      return c.rendered !== void 0 && c.rendered !== null ? String(c.rendered) : String(c.value);
    }
    function valorData(linha, nomeDoCampo, chaveDoPivo) {
      const c = celula(linha, nomeDoCampo, chaveDoPivo);
      return c ? paraData(c.value) : null;
    }
    function totalDaLinha(linha, nomeDoCampo) {
      const valorDoCampo = linha && linha[nomeDoCampo];
      if (!valorDoCampo) return null;
      const c = valorDoCampo[CHAVE_TOTAL_DE_LINHA];
      return c ? numeroOuNulo(c.value) : null;
    }
    function extrairSerie(opcoes = {}) {
      const {
        dimensao = dimensoes[0] && dimensoes[0].nome,
        medida = medidas[0] && medidas[0].nome,
        limite = Infinity,
        tratamentoDeNulos = "omitir"
      } = opcoes;
      const itens = [];
      let nulosIgnorados = 0;
      for (let i = 0; i < linhas.length && itens.length < limite; i++) {
        const linha = linhas[i];
        const v = medida ? valorNumerico(linha, medida) : null;
        if (v === null) {
          if (tratamentoDeNulos === "omitir") {
            nulosIgnorados++;
            continue;
          }
        }
        itens.push({
          rotulo: dimensao ? texto(linha, dimensao, void 0, "") : "",
          valorBruto: dimensao ? valorBruto(linha, dimensao) : null,
          valor: v === null ? tratamentoDeNulos === "zero" ? 0 : null : v,
          linha,
          indice: i
        });
      }
      return { itens, nulosIgnorados };
    }
    function valoresDistintos(nomeDoCampo, limite = 5e3) {
      const vistos = /* @__PURE__ */ new Set();
      const saida = [];
      for (const linha of linhas) {
        const v = valorBruto(linha, nomeDoCampo);
        const chave = v === null || v === void 0 ? "\u2205" : String(v);
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        saida.push({ chave, valor: v, texto: texto(linha, nomeDoCampo, void 0, "\u2205") });
        if (saida.length >= limite) break;
      }
      return saida;
    }
    return {
      // Campos
      dimensoes,
      medidas,
      camposDePivo,
      porNome,
      campo: (nome) => porNome.get(nome) || null,
      // Pivô
      pivots,
      pivotsDeDados,
      temPivo,
      pivoDeTotal: pivots.find((p) => p.ehTotal) || null,
      // Linhas
      linhas,
      quantidadeDeLinhas: linhas.length,
      // Acesso a valores
      celula,
      valorNumerico,
      valorBruto,
      valorData,
      texto,
      totalDaLinha,
      extrairSerie,
      valoresDistintos,
      // Totais gerais
      totais,
      // Diagnóstico
      avisos,
      queryResponseBruto: queryResponse
    };
  }
  function validarModelo(modelo, exigencia = {}) {
    const {
      dimensoesMin = 0,
      dimensoesMax = Infinity,
      medidasMin = 0,
      medidasMax = Infinity,
      aceitaPivo = true,
      exigePivo = false,
      exigeLinhas = true
    } = exigencia;
    if (exigePivo && !modelo.temPivo) {
      return {
        titulo: "Piv\xF4 obrigat\xF3rio",
        mensagem: "Esta visualiza\xE7\xE3o precisa de uma dimens\xE3o pivotada. Clique no \xEDcone de piv\xF4 ao lado de uma dimens\xE3o no Explore."
      };
    }
    if (!aceitaPivo && modelo.temPivo) {
      return {
        titulo: "Piv\xF4 n\xE3o suportado",
        mensagem: "Esta visualiza\xE7\xE3o n\xE3o aceita consultas com piv\xF4. Remova o piv\xF4 no Explore e rode de novo."
      };
    }
    if (modelo.dimensoes.length < dimensoesMin || modelo.dimensoes.length > dimensoesMax) {
      return {
        titulo: "Faltam campos",
        mensagem: `Esta visualiza\xE7\xE3o espera de ${dimensoesMin} a ${dimensoesMax === Infinity ? "v\xE1rias" : dimensoesMax} dimens\xF5es e recebeu ${modelo.dimensoes.length}. Ajuste os campos no Explore.`
      };
    }
    if (modelo.medidas.length < medidasMin || modelo.medidas.length > medidasMax) {
      return {
        titulo: "Faltam campos",
        mensagem: `Esta visualiza\xE7\xE3o espera de ${medidasMin} a ${medidasMax === Infinity ? "v\xE1rias" : medidasMax} medidas e recebeu ${modelo.medidas.length}. Ajuste os campos no Explore.`
      };
    }
    if (exigeLinhas && modelo.quantidadeDeLinhas === 0) {
      return {
        titulo: "Sem dados",
        mensagem: "A consulta n\xE3o retornou nenhuma linha. Revise os filtros do Explore."
      };
    }
    return null;
  }

  // node_modules/d3-scale-chromatic/src/colors.js
  function colors_default(specifier) {
    var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
    while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
    return colors;
  }

  // node_modules/d3-scale-chromatic/src/categorical/category10.js
  var category10_default = colors_default("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

  // node_modules/d3-scale-chromatic/src/categorical/Dark2.js
  var Dark2_default = colors_default("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

  // node_modules/d3-scale-chromatic/src/categorical/observable10.js
  var observable10_default = colors_default("4269d0efb118ff725c6cc5b03ca951ff8ab7a463f297bbf59c6b4e9498a0");

  // node_modules/d3-scale-chromatic/src/categorical/Paired.js
  var Paired_default = colors_default("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

  // node_modules/d3-scale-chromatic/src/categorical/Set2.js
  var Set2_default = colors_default("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

  // node_modules/d3-scale-chromatic/src/categorical/Tableau10.js
  var Tableau10_default = colors_default("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");

  // node_modules/d3-color/src/define.js
  function define_default(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }
  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  // node_modules/d3-color/src/color.js
  function Color() {
  }
  var darker = 0.7;
  var brighter = 1 / darker;
  var reI = "\\s*([+-]?\\d+)\\s*";
  var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
  var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
  var reHex = /^#([0-9a-f]{3,8})$/;
  var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
  var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
  var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
  var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
  var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
  var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
  var named = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  };
  define_default(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor(), this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });
  function color_formatHex() {
    return this.rgb().formatHex();
  }
  function color_formatHex8() {
    return this.rgb().formatHex8();
  }
  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }
  function color_formatRgb() {
    return this.rgb().formatRgb();
  }
  function color(format2) {
    var m, l;
    format2 = (format2 + "").trim().toLowerCase();
    return (m = reHex.exec(format2)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format2)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format2)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format2)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format2)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
  }
  function rgbn(n) {
    return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
  }
  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }
  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb();
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }
  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }
  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }
  define_default(Rgb, rgb, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));
  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }
  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }
  function rgb_formatRgb() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
  }
  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }
  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }
  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }
  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }
  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl();
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255, g = o.g / 255, b = o.b / 255, min2 = Math.min(r, g, b), max2 = Math.max(r, g, b), h = NaN, s = max2 - min2, l = (max2 + min2) / 2;
    if (s) {
      if (r === max2) h = (g - b) / s + (g < b) * 6;
      else if (g === max2) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max2 + min2 : 2 - max2 - min2;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }
  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }
  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }
  define_default(Hsl, hsl, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
    }
  }));
  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }
  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
  }

  // node_modules/d3-interpolate/src/basis.js
  function basis(t1, v0, v1, v2, v3) {
    var t2 = t1 * t1, t3 = t2 * t1;
    return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
  }
  function basis_default(values) {
    var n = values.length - 1;
    return function(t) {
      var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  // node_modules/d3-interpolate/src/basisClosed.js
  function basisClosed_default(values) {
    var n = values.length;
    return function(t) {
      var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  // node_modules/d3-interpolate/src/constant.js
  var constant_default = (x) => () => x;

  // node_modules/d3-interpolate/src/color.js
  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }
  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }
  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant_default(isNaN(a) ? b : a);
    };
  }
  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant_default(isNaN(a) ? b : a);
  }

  // node_modules/d3-interpolate/src/rgb.js
  var rgb_default = (function rgbGamma(y) {
    var color2 = gamma(y);
    function rgb2(start, end) {
      var r = color2((start = rgb(start)).r, (end = rgb(end)).r), g = color2(start.g, end.g), b = color2(start.b, end.b), opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
    rgb2.gamma = rgbGamma;
    return rgb2;
  })(1);
  function rgbSpline(spline) {
    return function(colors) {
      var n = colors.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color2;
      for (i = 0; i < n; ++i) {
        color2 = rgb(colors[i]);
        r[i] = color2.r || 0;
        g[i] = color2.g || 0;
        b[i] = color2.b || 0;
      }
      r = spline(r);
      g = spline(g);
      b = spline(b);
      color2.opacity = 1;
      return function(t) {
        color2.r = r(t);
        color2.g = g(t);
        color2.b = b(t);
        return color2 + "";
      };
    };
  }
  var rgbBasis = rgbSpline(basis_default);
  var rgbBasisClosed = rgbSpline(basisClosed_default);

  // node_modules/d3-interpolate/src/numberArray.js
  function numberArray_default(a, b) {
    if (!b) b = [];
    var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
    return function(t) {
      for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
      return c;
    };
  }
  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  // node_modules/d3-interpolate/src/array.js
  function genericArray(a, b) {
    var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x = new Array(na), c = new Array(nb), i;
    for (i = 0; i < na; ++i) x[i] = value_default(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  // node_modules/d3-interpolate/src/date.js
  function date_default(a, b) {
    var d = /* @__PURE__ */ new Date();
    return a = +a, b = +b, function(t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  // node_modules/d3-interpolate/src/number.js
  function number_default(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  // node_modules/d3-interpolate/src/object.js
  function object_default(a, b) {
    var i = {}, c = {}, k;
    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};
    for (k in b) {
      if (k in a) {
        i[k] = value_default(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  // node_modules/d3-interpolate/src/string.js
  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  var reB = new RegExp(reA.source, "g");
  function zero(b) {
    return function() {
      return b;
    };
  }
  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }
  function string_default(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs;
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm;
        else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({ i, x: number_default(am, bm) });
      }
      bi = reB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function(t) {
      for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
      return s.join("");
    });
  }

  // node_modules/d3-interpolate/src/value.js
  function value_default(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant_default(b) : (t === "number" ? number_default : t === "string" ? (c = color(b)) ? (b = c, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a, b);
  }

  // node_modules/d3-interpolate/src/round.js
  function round_default(a, b) {
    return a = +a, b = +b, function(t) {
      return Math.round(a * (1 - t) + b * t);
    };
  }

  // node_modules/d3-scale-chromatic/src/ramp.js
  var ramp_default = (scheme8) => rgbBasis(scheme8[scheme8.length - 1]);

  // node_modules/d3-scale-chromatic/src/diverging/BrBG.js
  var scheme = new Array(3).concat(
    "d8b365f5f5f55ab4ac",
    "a6611adfc27d80cdc1018571",
    "a6611adfc27df5f5f580cdc1018571",
    "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
    "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
    "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
    "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
    "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
    "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
  ).map(colors_default);
  var BrBG_default = ramp_default(scheme);

  // node_modules/d3-scale-chromatic/src/diverging/PuOr.js
  var scheme2 = new Array(3).concat(
    "998ec3f7f7f7f1a340",
    "5e3c99b2abd2fdb863e66101",
    "5e3c99b2abd2f7f7f7fdb863e66101",
    "542788998ec3d8daebfee0b6f1a340b35806",
    "542788998ec3d8daebf7f7f7fee0b6f1a340b35806",
    "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806",
    "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806",
    "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08",
    "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08"
  ).map(colors_default);
  var PuOr_default = ramp_default(scheme2);

  // node_modules/d3-scale-chromatic/src/diverging/RdBu.js
  var scheme3 = new Array(3).concat(
    "ef8a62f7f7f767a9cf",
    "ca0020f4a58292c5de0571b0",
    "ca0020f4a582f7f7f792c5de0571b0",
    "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
    "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
    "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
    "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
    "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
    "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
  ).map(colors_default);
  var RdBu_default = ramp_default(scheme3);

  // node_modules/d3-scale-chromatic/src/diverging/RdYlGn.js
  var scheme4 = new Array(3).concat(
    "fc8d59ffffbf91cf60",
    "d7191cfdae61a6d96a1a9641",
    "d7191cfdae61ffffbfa6d96a1a9641",
    "d73027fc8d59fee08bd9ef8b91cf601a9850",
    "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850",
    "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850",
    "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850",
    "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837",
    "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837"
  ).map(colors_default);
  var RdYlGn_default = ramp_default(scheme4);

  // node_modules/d3-scale-chromatic/src/sequential-single/Blues.js
  var scheme5 = new Array(3).concat(
    "deebf79ecae13182bd",
    "eff3ffbdd7e76baed62171b5",
    "eff3ffbdd7e76baed63182bd08519c",
    "eff3ffc6dbef9ecae16baed63182bd08519c",
    "eff3ffc6dbef9ecae16baed64292c62171b5084594",
    "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
    "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
  ).map(colors_default);
  var Blues_default = ramp_default(scheme5);

  // node_modules/d3-scale-chromatic/src/sequential-single/Greens.js
  var scheme6 = new Array(3).concat(
    "e5f5e0a1d99b31a354",
    "edf8e9bae4b374c476238b45",
    "edf8e9bae4b374c47631a354006d2c",
    "edf8e9c7e9c0a1d99b74c47631a354006d2c",
    "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
    "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
    "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
  ).map(colors_default);
  var Greens_default = ramp_default(scheme6);

  // node_modules/d3-scale-chromatic/src/sequential-single/Oranges.js
  var scheme7 = new Array(3).concat(
    "fee6cefdae6be6550d",
    "feeddefdbe85fd8d3cd94701",
    "feeddefdbe85fd8d3ce6550da63603",
    "feeddefdd0a2fdae6bfd8d3ce6550da63603",
    "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
    "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
    "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704"
  ).map(colors_default);
  var Oranges_default = ramp_default(scheme7);

  // node_modules/d3-scale-chromatic/src/sequential-multi/cividis.js
  function cividis_default(t) {
    t = Math.max(0, Math.min(1, t));
    return "rgb(" + Math.max(0, Math.min(255, Math.round(-4.54 - t * (35.34 - t * (2381.73 - t * (6402.7 - t * (7024.72 - t * 2710.57))))))) + ", " + Math.max(0, Math.min(255, Math.round(32.49 + t * (170.73 + t * (52.82 - t * (131.46 - t * (176.58 - t * 67.37))))))) + ", " + Math.max(0, Math.min(255, Math.round(81.24 + t * (442.36 - t * (2482.43 - t * (6167.24 - t * (6614.94 - t * 2475.67))))))) + ")";
  }

  // node_modules/d3-scale-chromatic/src/sequential-multi/turbo.js
  function turbo_default(t) {
    t = Math.max(0, Math.min(1, t));
    return "rgb(" + Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))))) + ", " + Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))))) + ", " + Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66))))))) + ")";
  }

  // node_modules/d3-scale-chromatic/src/sequential-multi/viridis.js
  function ramp(range) {
    var n = range.length;
    return function(t) {
      return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
  }
  var viridis_default = ramp(colors_default("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
  var magma = ramp(colors_default("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));
  var inferno = ramp(colors_default("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));
  var plasma = ramp(colors_default("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

  // src/core/theme.js
  var FAMILIAS_DE_FONTE = {
    sistema: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    monoespacada: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    serifada: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
  };
  var PALETAS_CATEGORICAS = {
    looker: {
      rotulo: "Looker (padr\xE3o)",
      cores: ["#4276BE", "#6FD09A", "#EB7B5C", "#9174CB", "#F4C95D", "#5CB6D9", "#D96C8E", "#8DBE66"]
    },
    tableau10: { rotulo: "Tableau 10", cores: [...Tableau10_default] },
    observable10: { rotulo: "Observable 10", cores: [...observable10_default] },
    categoria10: { rotulo: "Categoria 10", cores: [...category10_default] },
    set2: { rotulo: "Suave (Set2)", cores: [...Set2_default], daltonismoSeguro: true },
    dark2: { rotulo: "Escura (Dark2)", cores: [...Dark2_default], daltonismoSeguro: true },
    paired: { rotulo: "Pares (Paired)", cores: [...Paired_default] },
    okabeIto: {
      rotulo: "Okabe-Ito (daltonismo-seguro)",
      cores: ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00", "#F0E442", "#000000"],
      daltonismoSeguro: true
    },
    ibm: {
      rotulo: "IBM (daltonismo-seguro)",
      cores: ["#648FFF", "#785EF0", "#DC267F", "#FE6100", "#FFB000"],
      daltonismoSeguro: true
    },
    corporativa: {
      rotulo: "Corporativa s\xF3bria",
      cores: ["#1F3A5F", "#3C6E9A", "#6FA3C7", "#A8C8DE", "#C9A227", "#8A6D3B", "#5B5F63", "#9AA5AB"]
    },
    vibrante: {
      rotulo: "Vibrante",
      cores: ["#FF4365", "#00D9C0", "#FFD23F", "#7B2CBF", "#3A86FF", "#FB5607", "#06D6A0", "#EF476F"]
    },
    pastel: {
      rotulo: "Pastel",
      cores: ["#A7C7E7", "#FFD8BE", "#B5EAD7", "#FFDAC1", "#C7CEEA", "#E2F0CB", "#FFB7B2", "#D4A5A5"]
    },
    monocromatica: {
      rotulo: "Monocrom\xE1tica (azul)",
      cores: ["#0B2E4F", "#15476F", "#1F5F8F", "#3C7FAF", "#639FC8", "#8FBEDC", "#BCD9EC", "#E1EFF8"]
    }
  };
  var ESCALAS_CONTINUAS = {
    azul: { rotulo: "Azul (sequencial)", interpolador: Blues_default, tipo: "sequencial" },
    viridis: {
      rotulo: "Viridis (sequencial, daltonismo-seguro)",
      interpolador: viridis_default,
      tipo: "sequencial",
      daltonismoSeguro: true
    },
    cividis: {
      rotulo: "Cividis (sequencial, daltonismo-seguro)",
      interpolador: cividis_default,
      tipo: "sequencial",
      daltonismoSeguro: true
    },
    turbo: { rotulo: "Turbo (sequencial, alto contraste)", interpolador: turbo_default, tipo: "sequencial" },
    laranja: { rotulo: "Laranja (sequencial)", interpolador: Oranges_default, tipo: "sequencial" },
    verde: { rotulo: "Verde (sequencial)", interpolador: Greens_default, tipo: "sequencial" },
    vermelhoVerde: {
      rotulo: "Vermelho \u2192 Verde (divergente)",
      interpolador: RdYlGn_default,
      tipo: "divergente"
    },
    vermelhoAzul: {
      rotulo: "Vermelho \u2192 Azul (divergente, daltonismo-seguro)",
      interpolador: RdBu_default,
      tipo: "divergente",
      daltonismoSeguro: true
    },
    marromVerde: { rotulo: "Marrom \u2192 Verde (divergente)", interpolador: BrBG_default, tipo: "divergente" },
    roxoLaranja: { rotulo: "Roxo \u2192 Laranja (divergente)", interpolador: PuOr_default, tipo: "divergente" }
  };
  var TEMA_CLARO = {
    nome: "claro",
    fundo: "#FFFFFF",
    fundoAlternado: "#F8FAFC",
    fundoElevado: "#FFFFFF",
    texto: "#1F2937",
    textoSuave: "#6B7280",
    textoInvertido: "#FFFFFF",
    borda: "#E5E7EB",
    bordaForte: "#CBD5E1",
    grade: "#EEF2F6",
    eixo: "#94A3B8",
    destaque: "#2563EB",
    destaqueSuave: "#DBEAFE",
    positivo: "#16A34A",
    negativo: "#DC2626",
    atencao: "#D97706",
    neutro: "#64748B",
    sombra: "0 1px 3px rgba(15,23,42,0.12)",
    sombraForte: "0 6px 18px rgba(15,23,42,0.18)",
    tooltipFundo: "rgba(17,24,39,0.96)",
    tooltipTexto: "#FFFFFF"
  };
  var TEMA_ESCURO = {
    nome: "escuro",
    fundo: "#0F172A",
    fundoAlternado: "#152133",
    fundoElevado: "#1E293B",
    texto: "#E2E8F0",
    textoSuave: "#94A3B8",
    textoInvertido: "#0F172A",
    borda: "#334155",
    bordaForte: "#475569",
    grade: "#1E293B",
    eixo: "#64748B",
    destaque: "#60A5FA",
    destaqueSuave: "#1E3A5F",
    positivo: "#4ADE80",
    negativo: "#F87171",
    atencao: "#FBBF24",
    neutro: "#94A3B8",
    sombra: "0 1px 3px rgba(0,0,0,0.5)",
    sombraForte: "0 6px 18px rgba(0,0,0,0.6)",
    tooltipFundo: "rgba(241,245,249,0.96)",
    tooltipTexto: "#0F172A"
  };
  var METRICAS = {
    espaco: { xs: 2, sm: 4, md: 8, lg: 16, xl: 24 },
    raio: { nenhum: 0, sm: 2, md: 4, lg: 8, pilula: 999 },
    fonte: { xs: 10, sm: 11, md: 12, lg: 14, xl: 18, xxl: 24 },
    margem: { topo: 16, direita: 16, baixo: 32, esquerda: 48 }
  };
  function resolverTema(config = {}) {
    const base = config.tema === "escuro" ? TEMA_ESCURO : TEMA_CLARO;
    const tema = { ...base };
    const preenchida = (v) => typeof v === "string" && v.trim() !== "";
    if (preenchida(config.corDeFundo)) tema.fundo = config.corDeFundo;
    if (preenchida(config.corDoTexto)) {
      tema.texto = config.corDoTexto;
      tema.textoSuave = config.corDoTexto;
    }
    if (preenchida(config.corDaBorda)) tema.borda = config.corDaBorda;
    if (preenchida(config.corDaGrade)) tema.grade = config.corDaGrade;
    if (preenchida(config.corDeDestaque)) tema.destaque = config.corDeDestaque;
    tema.fonte = FAMILIAS_DE_FONTE[config.familiaDaFonte] || FAMILIAS_DE_FONTE.sistema;
    tema.tamanhoBase = Number(config.tamanhoDaFonte) || METRICAS.fonte.md;
    tema.metricas = METRICAS;
    return tema;
  }
  function coresDaPaleta(nomeDaPaleta) {
    const p = PALETAS_CATEGORICAS[nomeDaPaleta] || PALETAS_CATEGORICAS.looker;
    return p.cores;
  }
  function opcoesDePaleta() {
    return Object.keys(PALETAS_CATEGORICAS).map((chave) => ({
      [PALETAS_CATEGORICAS[chave].rotulo]: chave
    }));
  }
  function opcoesDeEscalaContinua() {
    return Object.keys(ESCALAS_CONTINUAS).map((chave) => ({
      [ESCALAS_CONTINUAS[chave].rotulo]: chave
    }));
  }

  // src/core/rotulos-do-painel.js
  function limiteDoRotulo(opcao) {
    return opcao && opcao.type === "boolean" ? 30 : 40;
  }
  var CORPO_CURTO = {
    // Árvores e organograma
    espessuraPorValor: "Liga\xE7\xE3o proporcional",
    escalaPorArvore: "Escala por \xE1rvore",
    tamanhoPorValor: "N\xF3 pelo valor",
    comecarRecolhidoAPartirDe: "Recolher a partir do n\xEDvel",
    preencherCartao: "Cart\xE3o na cor do ramo",
    espacoEntreIrmaos: "Espa\xE7o entre vizinhos",
    mostrarValorNoCartao: "Valor no cart\xE3o",
    mostrarContagemDeEquipe: "Total de descendentes",
    permitirRecolher: "Recolher ao clicar",
    campoDoCargo: "Campo da 2\xAA linha",
    mostrarBotoesDeExpandir: "Bot\xF5es de expandir",
    // Rótulos
    evitarColisaoDeRotulos: "Ocultar sobrepostos",
    truncarRotulo: "Cortar ap\xF3s N caracteres",
    mostrarRotulosDeFolha: "Nome das folhas",
    mostrarRotulosInternos: "Nome dos n\xF3s internos",
    mostrarValorNoRotulo: "Incluir o valor",
    mostrarPercentual: "Mostrar percentual",
    mostrarTotalDoConjunto: "Total do conjunto",
    listarRegioesPequenas: "Listar as pequenas",
    escreverLimites: "Valores dos limites",
    escreverPercentuais: "Percentual no bloco",
    escreverLarguras: "Peso de cada coluna",
    escreverValores: "Valor junto do nome",
    mostrarValorNoBloco: "Valor no ret\xE2ngulo",
    mostrarValorNaBarra: "Valor acima da barra",
    // Tooltip e clique
    tooltipPersonalizado: "Personalizado",
    modeloDeTooltip: "Modelo",
    tooltipComNomeCompleto: "Nome completo",
    tooltipComValorBruto: "Valor sem formato",
    permitirHtmlDoLooker: "HTML do Looker",
    destacarAoPassarMouse: "Destacar sob o mouse",
    destacarNoHover: "Destacar sob o mouse",
    permitirOrdenar: "Ordenar no cabe\xE7alho",
    mostrarFiltrosPorColuna: "Filtro por coluna",
    permitirSelecionarLinhas: "Selecionar e somar",
    destacarLinhaEColuna: "Real\xE7ar linha/coluna",
    permitirRedimensionarColunas: "Redimensionar colunas",
    permitirDrill: "Drill na c\xE9lula",
    mostrarBusca: "Campo de busca",
    // Animação
    contadorAnimado: "N\xFAmeros contando",
    animarEntradaDasLinhas: "Entrada das linhas",
    animarMudancaDeValor: "Piscar ao mudar",
    repetir: "Repetir ao terminar",
    // Avançado
    aplicarConfiguracaoJson: "Aplicar o JSON acima",
    // Dados e séries
    agruparRestoEmOutros: "Agrupar o resto em Outros",
    mostrarRank: "N\xFAmero do rank",
    mostrarPontos: "Ponto em cada per\xEDodo",
    mostrarPosicao: "Posi\xE7\xE3o no ponto",
    normalizarParticipacao: "X como participa\xE7\xE3o",
    mostrarTotalDeLinha: "Coluna de total por linha",
    estiloDeData: "Formato das c\xE9lulas de data",
    cabecalhoVertical: "Cabe\xE7alho na vertical",
    esconderIntersecoesVazias: "Ocultar interse\xE7\xF5es vazias",
    mostrarTotaisDosConjuntos: "Totais dos conjuntos",
    // Cores e escalas
    escalaDeCorPersonalizada: "Escala pr\xF3pria",
    limiteDeCorAutomatico: "Limites autom\xE1ticos",
    corPorDirecao: "Cor por dire\xE7\xE3o",
    corDoSinal: "Cor fora de controle",
    // Legenda e eixos
    legendaInterativa: "Clique liga/desliga",
    mostrarValoresNaLegenda: "Mostrar valores",
    comecarEmZero: "Eixo come\xE7a em zero",
    gradeEixoX: "Linhas de grade",
    gradeEixoY: "Linhas de grade",
    eixoXSimetricoEmTorno1: "Eixo X centrado em 1",
    // Gráficos específicos
    ligarPontos: "Ligar os pontos",
    mostrarGuias: "Guias verticais",
    destacarPiorQueda: "Destacar pior queda",
    mostrarRecuperacao: "Dura\xE7\xE3o da queda",
    periodoBase: "Base: N primeiros per\xEDodos",
    mostrarZonas: "Zonas de 1\u03C3 e 2\u03C3",
    colorirVariacao: "Cor pela dire\xE7\xE3o",
    mostrarVariacaoAbsoluta: "Diferen\xE7a absoluta",
    mostrarProgressoDaMeta: "Progresso at\xE9 a meta",
    usarLimites: "Cor por limites",
    pintarQuadrantes: "Pintar o fundo",
    mostrarContagemPorQuadrante: "Pontos por quadrante",
    mostrarCorte: "Marcar o corte",
    destacarAteOCorte: "Destacar at\xE9 o corte",
    mostrarPontosDoAcumulado: "Pontos no acumulado",
    mostrarRetaDeSharpe: "Reta do melhor Sharpe",
    destacarMelhorSharpe: "Destacar o melhor",
    mostrarTitulosDeGrupo: "Nome de cada grupo"
  };
  var CORPO_POR_SUFIXO_DE_COLUNA = [
    [/^visivel$/, () => "Mostrar"],
    [/^rotulo$/, () => "Renomear"],
    [/^largura$/, () => "Largura (px)"],
    [/^alinhamento$/, () => "Alinhamento"],
    [/^tipoDeCelula$/, () => "Tipo de c\xE9lula"],
    [/^corDoTexto$/, () => "Cor do texto"],
    [/^corDeFundo$/, () => "Cor de fundo"],
    [/^prefixo$/, () => "Prefixo"],
    [/^sufixo$/, () => "Sufixo"],
    [/^formato$/, () => "Formato"],
    [/^casasDecimais$/, () => "Casas decimais"],
    [/^corDaBarra$/, () => "Cor da barra"],
    [/^escalaDeCor$/, () => "Escala de cor"],
    [/^escalaCorMin$/, () => "Cor do menor"],
    [/^escalaCorMax$/, () => "Cor do maior"],
    [/^regra(\d+)$/, (n) => `R${n}: condi\xE7\xE3o`],
    [/^regra(\d+)Valor$/, (n) => `R${n}: valor`],
    [/^regra(\d+)Valor2$/, (n) => `R${n}: valor 2`],
    [/^regra(\d+)Acao$/, (n) => `R${n}: a\xE7\xE3o`],
    [/^regra(\d+)Cor$/, (n) => `R${n}: cor`],
    [/^regra(\d+)Icone$/, (n) => `R${n}: \xEDcone`],
    [/^regra(\d+)LinhaInteira$/, (n) => `R${n}: linha toda`],
    [/^regra(\d+)Coluna$/, (n) => `R${n}: comparar com`]
  ];
  function corpoDinamico(id) {
    const m = /^col_(?:dim|med|tab|calc)_.+?_([a-zA-Z0-9]+)$/.exec(id);
    if (!m) return null;
    for (const [re2, fn] of CORPO_POR_SUFIXO_DE_COLUNA) {
      const r = re2.exec(m[1]);
      if (r) return fn(r[1]);
    }
    return null;
  }
  function semExplicacao(texto) {
    return String(texto).replace(/\s*\([^)]*\)/g, "").replace(/\s+[—–]\s+.*$/, "").replace(/\s+-\s+.*$/, "").replace(/\s+/g, " ").trim();
  }
  function cortar(texto, limite) {
    return texto.length <= limite ? texto : `${texto.slice(0, Math.max(1, limite - 1)).trimEnd()}\u2026`;
  }
  function montarRotulo({ id, prefixo, rotulo, opcao }) {
    const limite = limiteDoRotulo(opcao);
    const sep = " \xB7 ";
    let corpo = String(rotulo != null ? rotulo : "");
    if (prefixo && corpo.startsWith(`${prefixo}${sep}`)) corpo = corpo.slice(prefixo.length + sep.length);
    const junto = (p, c) => p ? `${p}${sep}${c}` : c;
    const daColuna = corpoDinamico(id);
    if (daColuna) corpo = daColuna;
    if (junto(prefixo, corpo).length <= limite) return junto(prefixo, corpo);
    const curto = CORPO_CURTO[id];
    if (curto) corpo = curto;
    else if (corpo.length > limite || junto(prefixo, corpo).length > limite) corpo = semExplicacao(corpo) || corpo;
    if (junto(prefixo, corpo).length <= limite) return junto(prefixo, corpo);
    corpo = corpo.replace(/^Cor do quadrante /, "Cor: ").replace(/^Nome do quadrante /, "Nome: ");
    if (junto(prefixo, corpo).length <= limite) return junto(prefixo, corpo);
    if (prefixo && /^Coluna /.test(prefixo)) {
      const sobra = limite - corpo.length - sep.length;
      const curtoPrefixo = prefixo.replace(/^Coluna /, "Col. ");
      if (sobra >= 6) return junto(cortar(curtoPrefixo, sobra), corpo);
    }
    return cortar(corpo, limite);
  }

  // src/core/options-kit.js
  var SECOES = {
    Dados: 100,
    Formato: 200,
    Cores: 300,
    Eixos: 400,
    R\u00F3tulos: 500,
    Legenda: 600,
    Refer\u00EAncias: 700,
    Intera\u00E7\u00E3o: 800,
    Anima\u00E7\u00E3o: 900,
    Tema: 1e3,
    Avan\u00E7ado: 1100
  };
  function listaDeValores(pares) {
    return pares.map(({ rotulo, valor }) => ({ [rotulo]: valor }));
  }
  function montarOpcoes(...blocos) {
    const saida = {};
    const contadorPorSecao = {};
    for (const bloco of blocos) {
      if (!bloco) continue;
      for (const chave of Object.keys(bloco)) {
        const opcao = { ...bloco[chave] };
        const secao = opcao.section || "Avan\xE7ado";
        const base = SECOES[secao] !== void 0 ? SECOES[secao] : 1200;
        contadorPorSecao[secao] = (contadorPorSecao[secao] || 0) + 1;
        if (opcao.order === void 0) opcao.order = base + contadorPorSecao[secao];
        saida[chave] = opcao;
      }
    }
    return saida;
  }
  function blocoDeCores(opcoes = {}) {
    const {
      comPaleta = true,
      comEscalaPorValor = true,
      comOpacidade = true,
      comContorno = true,
      opacidadePadrao = 1,
      secao = "Cores"
    } = opcoes;
    const bloco = {};
    if (comPaleta) {
      bloco.paleta = {
        type: "string",
        label: "Paleta de cores",
        section: secao,
        display: "select",
        default: "looker",
        values: opcoesDePaleta()
      };
      bloco.inverterPaleta = {
        type: "boolean",
        label: "Inverter ordem das cores",
        section: secao,
        default: false
      };
    }
    if (comEscalaPorValor) {
      bloco.modoDeCor = {
        type: "string",
        label: "Como colorir",
        section: secao,
        display: "select",
        default: "categoria",
        values: listaDeValores([
          { rotulo: "Por categoria (paleta)", valor: "categoria" },
          { rotulo: "Por valor (escala cont\xEDnua)", valor: "valor" },
          { rotulo: "Cor \xFAnica", valor: "unica" }
        ])
      };
      bloco.corUnica = {
        type: "string",
        label: "Cor \xFAnica",
        section: secao,
        display: "color",
        default: "#4276BE"
      };
      bloco.escalaDeCor = {
        type: "string",
        label: "Escala cont\xEDnua (cor por valor)",
        section: secao,
        display: "select",
        default: "azul",
        values: opcoesDeEscalaContinua()
      };
      bloco.escalaDeCorPersonalizada = {
        type: "boolean",
        label: "Usar cores pr\xF3prias na escala",
        section: secao,
        default: false
      };
      bloco.corMinima = {
        type: "string",
        label: "Cor do m\xEDnimo",
        section: secao,
        display: "color",
        default: "#F1F5F9",
        display_size: "third"
      };
      bloco.corMedia = {
        type: "string",
        label: "Cor do meio (deixe igual ao m\xEDnimo para escala de 2 cores)",
        section: secao,
        display: "color",
        default: "#93C5FD",
        display_size: "third"
      };
      bloco.corMaxima = {
        type: "string",
        label: "Cor do m\xE1ximo",
        section: secao,
        display: "color",
        default: "#1D4ED8",
        display_size: "third"
      };
      bloco.limiteDeCorAutomatico = {
        type: "boolean",
        label: "M\xEDnimo e m\xE1ximo autom\xE1ticos",
        section: secao,
        default: true
      };
      bloco.limiteDeCorMinimo = {
        type: "number",
        label: "M\xEDnimo da escala (manual)",
        section: secao,
        display_size: "half"
      };
      bloco.limiteDeCorMaximo = {
        type: "number",
        label: "M\xE1ximo da escala (manual)",
        section: secao,
        display_size: "half"
      };
    }
    if (comOpacidade) {
      bloco.opacidade = {
        type: "number",
        label: "Opacidade do preenchimento",
        section: secao,
        display: "range",
        min: 0.05,
        max: 1,
        step: 0.05,
        default: opacidadePadrao
      };
    }
    if (comContorno) {
      bloco.mostrarContorno = {
        type: "boolean",
        label: "Mostrar contorno",
        section: secao,
        default: true
      };
      bloco.corDoContorno = {
        type: "string",
        label: "Cor do contorno",
        section: secao,
        display: "color",
        default: "#FFFFFF",
        display_size: "half"
      };
      bloco.espessuraDoContorno = {
        type: "number",
        label: "Espessura do contorno (px)",
        section: secao,
        display: "range",
        min: 0,
        max: 8,
        step: 0.5,
        default: 1,
        display_size: "half"
      };
      bloco.tracejadoDoContorno = {
        type: "string",
        label: "Estilo do contorno",
        section: secao,
        display: "select",
        default: "solido",
        values: listaDeValores([
          { rotulo: "S\xF3lido", valor: "solido" },
          { rotulo: "Tracejado", valor: "tracejado" },
          { rotulo: "Pontilhado", valor: "pontilhado" }
        ])
      };
    }
    return bloco;
  }
  function blocoDeRotulos(opcoes = {}) {
    const { secao = "R\xF3tulos", padraoVisivel = true, comPosicao = true, comValor = true } = opcoes;
    const bloco = {
      mostrarRotulos: {
        type: "boolean",
        label: "Mostrar r\xF3tulos",
        section: secao,
        default: padraoVisivel
      },
      tamanhoDoRotulo: {
        type: "number",
        label: "Tamanho do r\xF3tulo (px)",
        section: secao,
        display: "range",
        min: 7,
        max: 28,
        step: 1,
        default: 11
      },
      corDoRotulo: {
        type: "string",
        label: "Cor do r\xF3tulo (vazio = autom\xE1tica)",
        section: secao,
        display: "color",
        default: ""
      },
      negritoNoRotulo: { type: "boolean", label: "R\xF3tulo em negrito", section: secao, default: false },
      rotacaoDoRotulo: {
        type: "number",
        label: "Rota\xE7\xE3o do r\xF3tulo (graus)",
        section: secao,
        display: "range",
        min: -90,
        max: 90,
        step: 15,
        default: 0
      },
      evitarColisaoDeRotulos: {
        type: "boolean",
        label: "Esconder r\xF3tulos que se sobrep\xF5em",
        section: secao,
        default: true
      },
      truncarRotulo: {
        type: "number",
        label: "Truncar r\xF3tulo com mais de N caracteres (0 = n\xE3o truncar)",
        section: secao,
        display: "range",
        min: 0,
        max: 60,
        step: 1,
        default: 0
      }
    };
    if (comPosicao) {
      bloco.posicaoDoRotulo = {
        type: "string",
        label: "Posi\xE7\xE3o do r\xF3tulo",
        section: secao,
        display: "select",
        default: "auto",
        values: listaDeValores([
          { rotulo: "Autom\xE1tica", valor: "auto" },
          { rotulo: "Dentro", valor: "dentro" },
          { rotulo: "Fora", valor: "fora" },
          { rotulo: "Centro", valor: "centro" },
          { rotulo: "Fora com linha-guia", valor: "foraComLinha" }
        ])
      };
    }
    if (comValor) {
      bloco.conteudoDoRotulo = {
        type: "string",
        label: "O que mostrar no r\xF3tulo",
        section: secao,
        display: "select",
        default: "valor",
        values: listaDeValores([
          { rotulo: "Valor", valor: "valor" },
          { rotulo: "Nome", valor: "nome" },
          { rotulo: "Nome e valor", valor: "nomeValor" },
          { rotulo: "Percentual do total", valor: "percentual" },
          { rotulo: "Valor e percentual", valor: "valorPercentual" }
        ])
      };
      bloco.formatoDoRotulo = {
        type: "string",
        label: "Formato do n\xFAmero no r\xF3tulo",
        section: secao,
        display: "select",
        default: "auto",
        values: listaDeValores([
          { rotulo: "Autom\xE1tico (usa o do campo)", valor: "auto" },
          { rotulo: "N\xFAmero", valor: "numero" },
          { rotulo: "Compacto (K, M, B)", valor: "compacto" },
          { rotulo: "Moeda", valor: "moeda" },
          { rotulo: "Percentual", valor: "percentual" }
        ])
      };
      bloco.casasDecimaisDoRotulo = {
        type: "number",
        label: "Casas decimais no r\xF3tulo",
        section: secao,
        display: "range",
        min: 0,
        max: 6,
        step: 1,
        default: 1
      };
    }
    return bloco;
  }
  function blocoDeTooltip(opcoes = {}) {
    const { secao = "Intera\xE7\xE3o" } = opcoes;
    return {
      mostrarTooltip: { type: "boolean", label: "Mostrar tooltip", section: secao, default: true },
      tooltipPersonalizado: {
        type: "boolean",
        label: "Usar tooltip personalizado",
        section: secao,
        default: false
      },
      modeloDeTooltip: {
        type: "string",
        label: "Tooltip (HTML): {{categoria}} {{valor}} {{serie}} {{percentual}} ou {{campo}}; tags b, i, br, span; vazio = padr\xE3o",
        section: secao,
        default: "",
        placeholder: "<b>{{categoria}}</b><br>{{valor}}"
      },
      tooltipComNomeCompleto: {
        type: "boolean",
        label: "Mostrar nome completo do campo no tooltip",
        section: secao,
        default: false
      },
      tooltipComValorBruto: {
        type: "boolean",
        label: "Mostrar tamb\xE9m o valor sem formata\xE7\xE3o",
        section: secao,
        default: false
      },
      // Novas nas correções v2 (módulo 2.3).
      acaoDoClique: {
        type: "string",
        label: "A\xE7\xE3o do clique (Shift+clique sempre fixa; Esc solta)",
        section: secao,
        display: "select",
        default: "drill",
        values: listaDeValores([
          { rotulo: "Drill do Looker", valor: "drill" },
          { rotulo: "Fixar tooltip", valor: "fixar" },
          { rotulo: "Nenhuma", valor: "nenhuma" }
        ])
      },
      permitirHtmlDoLooker: {
        type: "boolean",
        label: "Permitir HTML do Looker nas vari\xE1veis do tooltip",
        section: secao,
        default: false
      },
      corDeFundoDoTooltip: {
        type: "string",
        label: "Cor de fundo do tooltip (vazio = do tema)",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      },
      corDaBordaDoTooltip: {
        type: "string",
        label: "Cor da borda do tooltip",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      },
      corDoTextoDoTooltip: {
        type: "string",
        label: "Cor do texto do tooltip (vazio = do tema)",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      },
      tamanhoDoTooltip: {
        type: "number",
        label: "Tamanho da fonte do tooltip (px)",
        section: secao,
        display: "range",
        min: 9,
        max: 20,
        step: 1,
        default: 11,
        display_size: "half"
      }
    };
  }
  function blocoDeAnimacao(opcoes = {}) {
    const { secao = "Anima\xE7\xE3o", padraoAtiva = true, duracaoPadrao = 600 } = opcoes;
    return {
      animacaoAtiva: {
        type: "boolean",
        label: "Ativar anima\xE7\xF5es",
        section: secao,
        default: padraoAtiva
      },
      duracaoDaAnimacao: {
        type: "number",
        label: "Dura\xE7\xE3o (ms)",
        section: secao,
        display: "range",
        min: 0,
        max: 3e3,
        step: 50,
        default: duracaoPadrao
      },
      atrasoDaAnimacao: {
        type: "number",
        label: "Atraso inicial (ms)",
        section: secao,
        display: "range",
        min: 0,
        max: 2e3,
        step: 50,
        default: 0
      },
      cascataDaAnimacao: {
        type: "number",
        label: "Cascata entre itens (ms)",
        section: secao,
        display: "range",
        min: 0,
        max: 200,
        step: 5,
        default: 20
      },
      suavizacaoDaAnimacao: {
        type: "string",
        label: "Curva da anima\xE7\xE3o",
        section: secao,
        display: "select",
        default: "saida",
        values: listaDeValores([
          { rotulo: "Linear", valor: "linear" },
          { rotulo: "Suave na sa\xEDda", valor: "saida" },
          { rotulo: "Suave na entrada", valor: "entrada" },
          { rotulo: "Suave nos dois lados", valor: "ambos" },
          { rotulo: "El\xE1stica", valor: "elastica" },
          { rotulo: "Com quique", valor: "quique" }
        ])
      },
      quandoAnimar: {
        type: "string",
        label: "Quando animar",
        section: secao,
        display: "select",
        default: "sempre",
        values: listaDeValores([
          { rotulo: "A cada atualiza\xE7\xE3o", valor: "sempre" },
          { rotulo: "S\xF3 na primeira carga", valor: "primeira" }
        ])
      },
      contadorAnimado: {
        type: "boolean",
        label: "N\xFAmeros sobem/descem at\xE9 o valor (contador)",
        section: secao,
        default: true
      }
    };
  }
  function blocoDeInteracao(opcoes = {}) {
    const {
      secao = "Intera\xE7\xE3o",
      comZoom = true,
      comBrush = false,
      comBusca = false,
      comSelecao = true
    } = opcoes;
    const bloco = {
      permitirDrill: {
        type: "boolean",
        label: "Clique abre o drill do Looker",
        section: secao,
        default: true
      },
      destacarAoPassarMouse: {
        type: "boolean",
        label: "Destacar ao passar o mouse",
        section: secao,
        default: true
      }
    };
    if (comZoom) {
      bloco.permitirZoom = { type: "boolean", label: "Permitir zoom", section: secao, default: false };
      bloco.permitirArrastar = {
        type: "boolean",
        label: "Permitir arrastar (pan)",
        section: secao,
        default: false
      };
    }
    if (comBrush) {
      bloco.permitirBrush = {
        type: "boolean",
        label: "Permitir sele\xE7\xE3o por \xE1rea (brush)",
        section: secao,
        default: false
      };
    }
    if (comBusca) {
      bloco.mostrarBusca = {
        type: "boolean",
        label: "Mostrar caixa de busca",
        section: secao,
        default: false
      };
    }
    if (comSelecao) {
      bloco.permitirSelecao = {
        type: "boolean",
        label: "Permitir selecionar itens (clique)",
        section: secao,
        default: true
      };
      bloco.usarCrossfilter = {
        type: "boolean",
        label: "Usar cross-filter do Looker quando dispon\xEDvel",
        section: secao,
        default: false
      };
    }
    return bloco;
  }
  function blocoDeTema(opcoes = {}) {
    const { secao = "Tema" } = opcoes;
    return {
      tema: {
        type: "string",
        label: "Tema",
        section: secao,
        display: "select",
        default: "claro",
        values: listaDeValores([
          { rotulo: "Claro", valor: "claro" },
          { rotulo: "Escuro", valor: "escuro" },
          { rotulo: "Personalizado", valor: "personalizado" }
        ])
      },
      corDeFundo: {
        type: "string",
        label: "Cor de fundo (vazio = do tema)",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      },
      corDoTexto: {
        type: "string",
        label: "Cor do texto (tema personalizado)",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      },
      corDaBorda: {
        type: "string",
        label: "Cor das bordas (tema personalizado)",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      },
      corDaGrade: {
        type: "string",
        label: "Cor das linhas de grade (tema personalizado)",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      },
      familiaDaFonte: {
        type: "string",
        label: "Fonte",
        section: secao,
        display: "select",
        default: "sistema",
        values: listaDeValores([
          { rotulo: "Do sistema", valor: "sistema" },
          { rotulo: "Monoespa\xE7ada", valor: "monoespacada" },
          { rotulo: "Serifada", valor: "serifada" }
        ])
      },
      tamanhoDaFonte: {
        type: "number",
        label: "Tamanho base da fonte (px)",
        section: secao,
        display: "range",
        min: 8,
        max: 24,
        step: 1,
        default: 12
      },
      titulo: { type: "string", label: "T\xEDtulo", section: secao, default: "" },
      subtitulo: { type: "string", label: "Subt\xEDtulo", section: secao, default: "" },
      textoSemDados: {
        type: "string",
        label: "Mensagem quando n\xE3o h\xE1 dados",
        section: secao,
        default: "Sem dados para exibir"
      }
    };
  }
  function blocoAvancado(opcoes = {}) {
    const { secao = "Avan\xE7ado" } = opcoes;
    return {
      modoDebug: {
        type: "boolean",
        label: "Modo debug (escreve no console a estrutura dos dados)",
        section: secao,
        default: false
      },
      configuracaoJson: {
        type: "string",
        label: "Configura\xE7\xE3o em JSON (cole aqui para importar)",
        section: secao,
        default: "",
        placeholder: '{"paleta":"okabeIto","tema":"escuro"}'
      },
      aplicarConfiguracaoJson: {
        type: "boolean",
        label: "Aplicar o JSON acima por cima das op\xE7\xF5es",
        section: secao,
        default: false
      }
    };
  }
  var ABAS = ["Dados", "Estilo", "Texto", "Mais"];
  var ABA_FINAL = {
    Dados: "Dados",
    Visual: "Estilo",
    Eixos: "Texto",
    Texto: "Texto",
    Intera\u00E7\u00E3o: "Mais",
    Avan\u00E7ado: "Mais"
  };
  var ABA_POR_SECAO = {
    Busca: "Intera\xE7\xE3o",
    T\u00EDtulo: "Texto",
    Subt\u00EDtulo: "Texto",
    Nota: "Texto",
    Dados: "Dados",
    Medidas: "Dados",
    Formato: "Visual",
    Cores: "Visual",
    Cor: "Visual",
    Tema: "Visual",
    Refer\u00EAncias: "Visual",
    Eixos: "Eixos",
    R\u00F3tulos: "Texto",
    Legenda: "Texto",
    Intera\u00E7\u00E3o: "Intera\xE7\xE3o",
    Anima\u00E7\u00E3o: "Intera\xE7\xE3o",
    Avan\u00E7ado: "Avan\xE7ado"
  };
  var PREFIXO_POR_SECAO = {
    Busca: "Busca",
    T\u00EDtulo: "T\xEDtulo",
    Subt\u00EDtulo: "Subt\xEDtulo",
    Nota: "Nota",
    Cores: "Cor",
    Cor: "Cor",
    R\u00F3tulos: "R\xF3tulo",
    Legenda: "Legenda",
    Anima\u00E7\u00E3o: "Anima\xE7\xE3o",
    Refer\u00EAncias: "Refer\xEAncia"
  };
  var DESTINO_POR_ID = {
    titulo: ["Texto", "T\xEDtulo"],
    subtitulo: ["Texto", "T\xEDtulo"],
    textoSemDados: ["Texto", "Aviso"],
    mostrarAvisos: ["Texto", "Aviso"],
    posicaoDosAvisos: ["Texto", "Aviso"],
    tema: ["Visual", "Tema"],
    corDeFundo: ["Visual", "Cor"],
    corDoTexto: ["Visual", "Cor"],
    corDaBorda: ["Visual", "Cor"],
    corDaGrade: ["Visual", "Cor"],
    familiaDaFonte: ["Visual", "Tema"],
    tamanhoDaFonte: ["Visual", "Tema"],
    formatoDoEixo: ["Eixos", "Eixo"],
    casasDecimaisDoEixo: ["Eixos", "Eixo"],
    usarEixoSecundario: ["Eixos", "Eixo"],
    tratamentoDeNulos: ["Dados", ""],
    textoParaNulo: ["Dados", ""]
  };
  function abaPeloId(id, opcao) {
    const t = id.toLowerCase();
    if (/debug|json/.test(t)) return "Avan\xE7ado";
    if (/tooltip|drill|clique|hover|destacar(no|ao)|anima|duracao|atraso|cascata|tocando|repetir|busca|recolher|expandi|interativ|crossfilter|selec|zoom|arrastar|copiar|exportar|redimensionar|ordenar$|permitir/.test(t)) {
      return "Intera\xE7\xE3o";
    }
    if (/eixo/.test(t)) return "Eixos";
    if (/rotulo|escrever|mostrarvalor|mostrarpercentual|mostrarposicao|mostrarrank|titulo|legenda|aviso|texto|mostrartotais|mostrarcontagem|nome$/.test(t)) {
      return "Texto";
    }
    if (opcao && opcao.display === "color") return "Visual";
    if (/^cor|cor$|cores|paleta|opacidade|forma|tamanho|espessura|raio|altura|largura|espaco|contorno|borda|grade|zebra|fundo|estilo|densidade|layout|orientacao|curva|ligacao|preencher|pintar|zona|guias|ponto|sparkline|icone|cartao|arranjo|colunasdagrade|escala/.test(t)) {
      return "Visual";
    }
    return "Dados";
  }
  function organizarAbas(opcoes) {
    const itens = [];
    let i = 0;
    for (const [id, original] of Object.entries(opcoes || {})) {
      if (!original || typeof original !== "object") continue;
      if (original._organizada) {
        itens.push([id, original]);
        continue;
      }
      const opcao = { ...original };
      const secaoAntiga = opcao.section || "Avan\xE7ado";
      let aba;
      let prefixo;
      if (DESTINO_POR_ID[id]) {
        [aba, prefixo] = DESTINO_POR_ID[id];
      } else if (/^Fórmula \d+$/.test(secaoAntiga)) {
        aba = "Dados";
        prefixo = secaoAntiga;
      } else if (/^Coluna: /.test(secaoAntiga)) {
        aba = "Visual";
        prefixo = secaoAntiga.replace(/^Coluna: /, "Coluna ");
      } else if (ABA_POR_SECAO[secaoAntiga]) {
        aba = ABA_POR_SECAO[secaoAntiga];
        prefixo = PREFIXO_POR_SECAO[secaoAntiga];
        if (aba === "Eixos") prefixo = /X$|X[A-Z]/.test(id) ? "Eixo X" : /Y$|Y[A-Z]/.test(id) ? "Eixo Y" : "Eixo";
        if (secaoAntiga === "Intera\xE7\xE3o") prefixo = /tooltip|Tooltip|HtmlDoLooker/.test(id) ? "Tooltip" : "Clique";
        if (secaoAntiga === "Tema") prefixo = "Tema";
      } else {
        aba = abaPeloId(id, opcao);
        prefixo = secaoAntiga;
      }
      aba = ABA_FINAL[aba] || "Mais";
      if (typeof opcao.label === "string") {
        const completo = prefixo && !opcao.label.startsWith(`${prefixo} \xB7 `) ? `${prefixo} \xB7 ${opcao.label}` : opcao.label;
        Object.defineProperty(opcao, "_rotuloCompleto", { value: completo, enumerable: false });
        opcao.label = montarRotulo({ id, prefixo, rotulo: opcao.label, opcao });
      }
      opcao.section = aba;
      const ordemAntiga = Number.isFinite(opcao.order) ? opcao.order : 5e3 + i;
      opcao.order = (ABAS.indexOf(aba) + 1) * 1e4 + ordemAntiga;
      Object.defineProperty(opcao, "_organizada", { value: true, enumerable: false });
      itens.push([id, opcao]);
      i += 1;
    }
    itens.sort((a, b) => a[1].order - b[1].order);
    const saida = {};
    for (const [id, opcao] of itens) saida[id] = opcao;
    return saida;
  }
  function comDefaults(opcoes, novosPadroes) {
    const saida = Object.assign({}, opcoes);
    for (const [chave, valor] of Object.entries(novosPadroes)) {
      if (!saida[chave]) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(`comDefaults: a op\xE7\xE3o "${chave}" n\xE3o existe neste gr\xE1fico.`);
        }
        continue;
      }
      saida[chave] = Object.assign({}, saida[chave], { default: valor });
    }
    return saida;
  }
  function sanitizarChave(texto) {
    return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  }
  function normalizarConfig(config, opcoes) {
    const saida = Object.assign({}, config || {});
    for (const [chave, opcao] of Object.entries(opcoes || {})) {
      if (!opcao || typeof opcao !== "object") continue;
      let v = saida[chave];
      if (v === void 0) {
        if (opcao.default !== void 0) saida[chave] = opcao.default;
        continue;
      }
      if (opcao.type === "number" && typeof v === "string") {
        const t = v.trim();
        const n = Number(t);
        saida[chave] = t === "" ? null : Number.isFinite(n) ? n : opcao.default !== void 0 ? opcao.default : null;
      } else if (opcao.type === "boolean" && typeof v === "string") {
        v = v.trim().toLowerCase();
        if (v === "true") saida[chave] = true;
        else if (v === "false" || v === "") saida[chave] = false;
      }
    }
    return saida;
  }
  function compararChaves(config, opcoes) {
    const registradas = Object.keys(opcoes || {});
    const recebidas = Object.keys(config || {});
    const setRecebidas = new Set(recebidas);
    const setRegistradas = new Set(registradas);
    return {
      registradas: registradas.length,
      recebidas: recebidas.length,
      faltandoNoConfig: registradas.filter((k) => !setRecebidas.has(k)),
      foraDoPainel: recebidas.filter((k) => !setRegistradas.has(k))
    };
  }
  function aplicarConfiguracaoJson(config) {
    if (!config || !config.aplicarConfiguracaoJson || !config.configuracaoJson) return config;
    try {
      const extra = JSON.parse(config.configuracaoJson);
      if (extra && typeof extra === "object" && !Array.isArray(extra)) {
        return Object.assign({}, config, extra);
      }
    } catch (e) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[biblioteca-looker] JSON de configura\xE7\xE3o inv\xE1lido; ignorado.", e && e.message);
      }
    }
    return config;
  }

  // src/core/dom.js
  var NS_SVG = "http://www.w3.org/2000/svg";
  function limpar(no) {
    if (!no) return no;
    while (no.firstChild) no.removeChild(no.firstChild);
    return no;
  }
  function definirTexto(no, valor) {
    if (!no) return no;
    no.textContent = valor === null || valor === void 0 ? "" : String(valor);
    return no;
  }
  function aplicarEstilos(el, estilos) {
    if (!el || !estilos) return el;
    for (const chave of Object.keys(estilos)) {
      const valor = estilos[chave];
      if (valor === null || valor === void 0) continue;
      if (chave.startsWith("--")) el.style.setProperty(chave, String(valor));
      else el.style[chave] = String(valor);
    }
    return el;
  }
  function aplicarAtributos(el, atributos) {
    if (!el || !atributos) return el;
    for (const chave of Object.keys(atributos)) {
      const valor = atributos[chave];
      if (valor === null || valor === void 0 || valor === false) continue;
      el.setAttribute(chave, String(valor));
    }
    return el;
  }
  function criarEl(tag, opcoes = {}) {
    const el = document.createElement(tag);
    if (opcoes.classe) el.className = opcoes.classe;
    if (opcoes.texto !== void 0) definirTexto(el, opcoes.texto);
    if (opcoes.estilos) aplicarEstilos(el, opcoes.estilos);
    if (opcoes.atributos) aplicarAtributos(el, opcoes.atributos);
    if (opcoes.pai) opcoes.pai.appendChild(el);
    return el;
  }
  function criarSvgEl(tag, opcoes = {}) {
    const el = document.createElementNS(NS_SVG, tag);
    if (opcoes.classe) el.setAttribute("class", opcoes.classe);
    if (opcoes.texto !== void 0) definirTexto(el, opcoes.texto);
    if (opcoes.estilos) aplicarEstilos(el, opcoes.estilos);
    if (opcoes.atributos) aplicarAtributos(el, opcoes.atributos);
    if (opcoes.pai) opcoes.pai.appendChild(el);
    return el;
  }
  function medir(el, minimo = { largura: 160, altura: 120 }) {
    const largura = el && el.clientWidth || minimo.largura;
    const altura = el && el.clientHeight || minimo.altura;
    return { largura: Math.max(1, largura), altura: Math.max(1, altura) };
  }
  function observarRedimensionamento(el, callback) {
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => callback());
      ro.observe(el);
      return () => ro.disconnect();
    }
    if (typeof window !== "undefined" && window.addEventListener) {
      const aoRedimensionar = () => callback();
      window.addEventListener("resize", aoRedimensionar);
      return () => window.removeEventListener("resize", aoRedimensionar);
    }
    return () => {
    };
  }
  function injetarEstilo(hospedeiro, css, id) {
    const existente = id && hospedeiro.querySelector(`style[data-estilo="${id}"]`);
    if (existente) {
      existente.textContent = css;
      return existente;
    }
    const style = document.createElement("style");
    if (id) style.setAttribute("data-estilo", id);
    style.textContent = css;
    hospedeiro.appendChild(style);
    return style;
  }
  function criarGerenciadorDeEventos() {
    const registros = [];
    return {
      on(alvo, tipo, handler, opcoes) {
        if (!alvo || !alvo.addEventListener) return;
        alvo.addEventListener(tipo, handler, opcoes);
        registros.push({ alvo, tipo, handler, opcoes });
      },
      limpar() {
        for (const r of registros) {
          try {
            r.alvo.removeEventListener(r.tipo, r.handler, r.opcoes);
          } catch (_) {
          }
        }
        registros.length = 0;
      }
    };
  }
  function preferindoMenosMovimento() {
    try {
      return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  }
  function cancelarQuadro(id) {
    if (id === null || id === void 0) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
    else clearTimeout(id);
  }

  // src/core/animate.js
  var SUAVIZACOES = {
    linear: (t) => t,
    entrada: (t) => t * t * t,
    saida: (t) => 1 - Math.pow(1 - t, 3),
    ambos: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    elastica: (t) => {
      if (t === 0 || t === 1) return t;
      const p = 0.3;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    quique: (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  };
  function suavizacaoPorNome(nome) {
    return SUAVIZACOES[nome] || SUAVIZACOES.saida;
  }
  function opcoesDeAnimacao(config = {}, { primeiraRenderizacao = true } = {}) {
    var _a, _b, _c;
    const menosMovimento = preferindoMenosMovimento();
    const ligada = config.animacaoAtiva !== false && !menosMovimento && (config.quandoAnimar !== "primeira" || primeiraRenderizacao);
    return {
      ligada,
      menosMovimento,
      duracao: ligada ? Math.max(0, Number((_a = config.duracaoDaAnimacao) != null ? _a : 600)) : 0,
      atraso: ligada ? Math.max(0, Number((_b = config.atrasoDaAnimacao) != null ? _b : 0)) : 0,
      cascata: ligada ? Math.max(0, Number((_c = config.cascataDaAnimacao) != null ? _c : 20)) : 0,
      suavizacao: suavizacaoPorNome(config.suavizacaoDaAnimacao),
      contador: ligada && config.contadorAnimado !== false
    };
  }
  var ANIMACOES_HABILITADAS = true;
  var CURVAS_CSS = {
    linear: "linear",
    saida: "cubic-bezier(.33,1,.68,1)",
    entrada: "cubic-bezier(.32,0,.67,0)",
    ambos: "cubic-bezier(.65,0,.35,1)",
    elastica: "cubic-bezier(.34,1.56,.64,1)",
    quique: "cubic-bezier(.34,1.8,.64,1)"
  };
  var CSS_ANIMACAO_GENERICA = `
@keyframes bl-surgir{from{opacity:0}to{opacity:1}}
@keyframes bl-surgir-html{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
`;
  var SELETOR_DE_MARCAS = "svg rect, svg path, svg circle, svg ellipse, svg polygon, svg polyline, svg line, svg text, svg image, .bl-anima";
  var MAXIMO_DE_MARCAS = 600;
  function animarEntradaGenerica(area, config = {}, { primeiraRenderizacao = true } = {}) {
    if (!area || !ANIMACOES_HABILITADAS) return 0;
    const op = opcoesDeAnimacao(config, { primeiraRenderizacao });
    if (!op.ligada || op.duracao <= 0) return 0;
    const raiz = area.closest && area.closest(".bl-raiz") || area;
    if (!raiz.querySelector('style[data-estilo="bl-animacao"]')) {
      const style = document.createElement("style");
      style.setAttribute("data-estilo", "bl-animacao");
      style.textContent = CSS_ANIMACAO_GENERICA;
      raiz.appendChild(style);
    }
    const curva = CURVAS_CSS[config.suavizacaoDaAnimacao] || CURVAS_CSS.saida;
    let marcas = Array.from(area.querySelectorAll(SELETOR_DE_MARCAS));
    if (marcas.length > MAXIMO_DE_MARCAS) marcas = Array.from(area.querySelectorAll("svg, .bl-anima"));
    const passo = marcas.length > 1 ? Math.min(op.cascata, op.duracao * 1.5 / marcas.length) : 0;
    marcas.forEach((el, i) => {
      const nome = el.namespaceURI === "http://www.w3.org/2000/svg" ? "bl-surgir" : "bl-surgir-html";
      el.style.animation = `${nome} ${op.duracao}ms ${curva} ${Math.round(op.atraso + i * passo)}ms backwards`;
    });
    return marcas.length;
  }

  // src/core/medida-texto.js
  var ESTREITOS = /* @__PURE__ */ new Set([...`iljtf.,:;|!'"()[]{} `]);
  var LARGOS = /* @__PURE__ */ new Set([..."mwMWQGOD@%"]);
  function larguraDoTexto(texto, tamanho = 12, { negrito = false, mono = false } = {}) {
    const s = String(texto != null ? texto : "");
    if (!s) return 0;
    if (mono) return s.length * 0.62 * tamanho;
    let em = 0;
    for (const ch of s) {
      if (ESTREITOS.has(ch)) em += 0.32;
      else if (LARGOS.has(ch)) em += 0.86;
      else if (ch >= "A" && ch <= "Z") em += 0.68;
      else if (ch >= "0" && ch <= "9") em += 0.56;
      else em += 0.53;
    }
    return em * tamanho * (negrito ? 1.09 : 1);
  }
  function linhasDoTexto(texto, larguraDisponivel, tamanho = 12, opcoes = {}) {
    const s = String(texto != null ? texto : "").trim();
    if (!s) return 0;
    if (!(larguraDisponivel > 0)) return 1;
    const espaco = larguraDoTexto(" ", tamanho, opcoes);
    let linhas = 1;
    let atual = 0;
    for (const palavra of s.split(/\s+/)) {
      const w = larguraDoTexto(palavra, tamanho, opcoes);
      if (atual === 0) {
        atual = w;
        if (w > larguraDisponivel) {
          linhas += Math.ceil(w / larguraDisponivel) - 1;
          atual = w % larguraDisponivel;
        }
      } else if (atual + espaco + w <= larguraDisponivel) {
        atual += espaco + w;
      } else {
        linhas += 1;
        atual = Math.min(w, larguraDisponivel);
        if (w > larguraDisponivel) linhas += Math.ceil(w / larguraDisponivel) - 1;
      }
    }
    return linhas;
  }

  // src/core/cabecalho.js
  var valores = (pares) => pares.map(([rotulo, valor]) => ({ [rotulo]: valor }));
  var ALINHAMENTOS = valores([["Esquerda", "esquerda"], ["Centro", "centro"], ["Direita", "direita"]]);
  var FONTES = valores([["Do tema", "tema"], ["Sistema", "sistema"], ["Monoespa\xE7ada", "mono"], ["Serifada", "serifada"]]);
  var PESOS = valores([["Negrito", "negrito"], ["Normal", "normal"]]);
  function blocoDeTexto(sufixo, secao, { peso, tamanho }) {
    const o = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
    return {
      [`mostrar${sufixo}`]: o("boolean", "Mostrar", true),
      [`posicaoDo${sufixo}`]: o("string", "Posi\xE7\xE3o", "acima", {
        display: "select",
        values: valores([["Acima do gr\xE1fico", "acima"], ["Abaixo do gr\xE1fico", "abaixo"]])
      }),
      [`alinhamentoDo${sufixo}`]: o("string", "Alinhamento", "esquerda", { display: "select", values: ALINHAMENTOS }),
      [`deslocamentoXDo${sufixo}`]: o("number", "Deslocamento X (px)", 0),
      [`deslocamentoYDo${sufixo}`]: o("number", "Deslocamento Y (px)", 0),
      [`tamanhoDo${sufixo}`]: o("number", "Tamanho (px, 0 = auto)", tamanho),
      [`fonteDo${sufixo}`]: o("string", "Fonte", "tema", { display: "select", values: FONTES }),
      [`pesoDo${sufixo}`]: o("string", "Peso", peso, { display: "select", values: PESOS }),
      [`corDo${sufixo}`]: o("string", "Cor (vazio = tema)", "", { display: "color" }),
      [`margemDo${sufixo}`]: o("number", "Margem (px)", 0),
      [`quebrar${sufixo}`]: o("boolean", "Quebrar linha", true),
      [`linhasDo${sufixo}`]: o("number", "M\xE1ximo de linhas (0 = sem)", 0)
    };
  }
  function opcoesDoCabecalho() {
    const n = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: "Nota", default: def, ...extra });
    return {
      ...blocoDeTexto("Titulo", "T\xEDtulo", { peso: "negrito", tamanho: 0 }),
      ...blocoDeTexto("Subtitulo", "Subt\xEDtulo", { peso: "normal", tamanho: 0 }),
      mostrarNota: n("boolean", "Mostrar", true),
      posicaoDaNota: n("string", "Posi\xE7\xE3o", "abaixo", {
        display: "select",
        values: valores([
          ["Abaixo do gr\xE1fico", "abaixo"],
          ["Acima do gr\xE1fico", "acima"],
          ["S\xF3 no \xEDcone \u24D8", "icone"]
        ])
      }),
      alinhamentoDaNota: n("string", "Alinhamento", "esquerda", { display: "select", values: ALINHAMENTOS }),
      tamanhoDaNota: n("number", "Tamanho (px)", 10),
      fonteDaNota: n("string", "Fonte", "tema", { display: "select", values: FONTES }),
      corDaNota: n("string", "Cor (vazio = tema)", "", { display: "color" }),
      quebrarNota: n("boolean", "Quebrar linha", true),
      linhasDaNota: n("number", "M\xE1ximo de linhas (0 = sem)", 0),
      textoDaNota: n("string", "Texto", "auto", {
        display: "select",
        values: valores([
          ["Autom\xE1tico", "auto"],
          ["Autom\xE1tico + meu texto", "auto_mais"],
          ["S\xF3 meu texto", "meu"],
          ["Nenhum", "nenhum"]
        ])
      }),
      meuTextoDaNota: n("string", "Meu texto", "")
    };
  }
  function textoFinalDaNota(config = {}, automatico = "") {
    const auto = String(automatico || "").trim();
    const meu = String(config.meuTextoDaNota || "").trim();
    switch (config.textoDaNota) {
      case "nenhum":
        return "";
      case "meu":
        return meu;
      case "auto_mais":
        return [auto, meu].filter(Boolean).join(" \xB7 ");
      default:
        return auto;
    }
  }
  var num = (v, padrao) => Number.isFinite(Number(v)) && v !== "" && v !== null ? Number(v) : padrao;
  function familia(fonte, tema) {
    if (fonte === "sistema") return 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    if (fonte === "mono") return 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
    if (fonte === "serifada") return 'Georgia, "Times New Roman", serif';
    return tema && tema.fonte || "";
  }
  function estiloDoTexto(tipo, config = {}, tema = {}) {
    const base = num(tema.tamanhoBase, 12);
    if (tipo === "nota") {
      return {
        mostrar: config.mostrarNota !== false,
        posicao: ["acima", "icone"].includes(config.posicaoDaNota) ? config.posicaoDaNota : "abaixo",
        alinhamento: config.alinhamentoDaNota || "esquerda",
        dx: 0,
        dy: 0,
        tamanho: Math.max(6, num(config.tamanhoDaNota, 10) || 10),
        fonte: familia(config.fonteDaNota, tema),
        mono: config.fonteDaNota === "mono",
        negrito: false,
        cor: (config.corDaNota || "").trim() || tema.textoSuave || "",
        opacidade: (config.corDaNota || "").trim() ? 1 : 0.75,
        margem: 0,
        quebrar: config.quebrarNota !== false,
        linhas: Math.max(0, Math.floor(num(config.linhasDaNota, 0))),
        alturaDaLinha: 1.35
      };
    }
    const S = tipo === "titulo" ? "Titulo" : "Subtitulo";
    const automatico = tipo === "titulo" ? Math.round(base * 1.25) : Math.round(base * 0.95);
    const tamanho = num(config[`tamanhoDo${S}`], 0);
    const peso = config[`pesoDo${S}`] || (tipo === "titulo" ? "negrito" : "normal");
    const cor = (config[`corDo${S}`] || "").trim();
    return {
      mostrar: config[`mostrar${S}`] !== false,
      posicao: config[`posicaoDo${S}`] === "abaixo" ? "abaixo" : "acima",
      alinhamento: config[`alinhamentoDo${S}`] || "esquerda",
      dx: num(config[`deslocamentoXDo${S}`], 0),
      dy: num(config[`deslocamentoYDo${S}`], 0),
      tamanho: tamanho > 0 ? tamanho : automatico,
      fonte: familia(config[`fonteDo${S}`], tema),
      mono: config[`fonteDo${S}`] === "mono",
      negrito: peso === "negrito",
      cor: cor || "",
      opacidade: tipo === "subtitulo" && !cor ? 0.7 : 1,
      margem: Math.max(0, num(config[`margemDo${S}`], 0)),
      quebrar: config[`quebrar${S}`] !== false,
      linhas: Math.max(0, Math.floor(num(config[`linhasDo${S}`], 0))),
      alturaDaLinha: 1.2
    };
  }
  var FOLGA = { lateral: 10, topo: 6, base: 4, entreItens: 2, icone: 18 };
  function planejarCabecalho({ largura, altura, config = {}, tema = {}, textos = {}, areaMinima }) {
    const minimo = areaMinima != null ? areaMinima : Math.max(40, Math.round(altura * 0.25));
    const ocultos = [];
    const pedidos = [];
    for (const tipo of ["titulo", "subtitulo", "nota"]) {
      const texto = String(textos[tipo] || "").trim();
      const estilo = estiloDoTexto(tipo, config, tema);
      if (!texto || !estilo.mostrar) continue;
      pedidos.push({ tipo, texto, estilo });
    }
    const calcular = (itens) => {
      const icone = itens.find((i) => i.tipo === "nota" && i.estilo.posicao === "icone");
      const noFluxo = itens.filter((i) => i !== icone);
      const larguraUtil = Math.max(20, largura - 2 * FOLGA.lateral);
      const medir2 = (i) => {
        const reservaDoIcone = icone && i.estilo.posicao === "acima" ? FOLGA.icone + 4 : 0;
        const larguraDoItem = Math.max(20, larguraUtil - Math.abs(i.estilo.dx) - reservaDoIcone);
        const opts = { negrito: i.estilo.negrito, mono: i.estilo.mono };
        let linhas = i.estilo.quebrar ? linhasDoTexto(i.texto, larguraDoItem, i.estilo.tamanho, opts) : 1;
        if (i.estilo.linhas > 0) linhas = Math.min(linhas, i.estilo.linhas);
        const alturaDoTexto = Math.ceil(linhas * i.estilo.tamanho * i.estilo.alturaDaLinha);
        return { ...i, linhas, largura: larguraDoItem, alturaDoTexto, altura: alturaDoTexto + 2 * i.estilo.margem };
      };
      const topo = noFluxo.filter((i) => i.estilo.posicao === "acima").map(medir2);
      const base = noFluxo.filter((i) => i.estilo.posicao === "abaixo").map(medir2);
      const somar = (lista) => lista.reduce((s, i) => s + i.altura, 0) + Math.max(0, lista.length - 1) * FOLGA.entreItens;
      let alturaTopo = topo.length ? FOLGA.topo + somar(topo) : 0;
      if (icone) alturaTopo = Math.max(alturaTopo, FOLGA.topo + FOLGA.icone);
      const alturaBase = base.length ? somar(base) + FOLGA.base : 0;
      let y = FOLGA.topo;
      for (const i of topo) {
        i.x = FOLGA.lateral + i.estilo.dx;
        i.y = y + i.estilo.margem + i.estilo.dy;
        y += i.altura + FOLGA.entreItens;
      }
      y = altura - alturaBase;
      for (const i of base) {
        i.x = FOLGA.lateral + i.estilo.dx;
        i.y = y + i.estilo.margem + i.estilo.dy;
        y += i.altura + FOLGA.entreItens;
      }
      return {
        topo,
        base,
        icone: icone ? icone.texto : "",
        estiloDoIcone: icone ? icone.estilo : null,
        alturaTopo,
        alturaBase,
        area: { y: alturaTopo, altura: altura - alturaTopo - alturaBase }
      };
    };
    let plano = calcular(pedidos);
    for (const tipo of ["nota", "subtitulo", "titulo"]) {
      if (plano.area.altura >= minimo) break;
      const idx = pedidos.findIndex((p) => p.tipo === tipo);
      if (idx < 0) continue;
      pedidos.splice(idx, 1);
      ocultos.push(tipo);
      plano = calcular(pedidos);
    }
    return { ...plano, ocultos };
  }
  var CSS = `
.bl-cabecalho,.bl-rodape{position:relative;flex:0 0 auto;overflow:hidden;padding:0 ${FOLGA.lateral}px;}
.bl-cabecalho{padding-top:${FOLGA.topo}px;}
.bl-rodape{padding-bottom:${FOLGA.base}px;}
.bl-cabecalho>.bl-texto+.bl-texto,.bl-rodape>.bl-texto+.bl-texto{margin-top:${FOLGA.entreItens}px;}
.bl-texto{position:relative;overflow:hidden;}
.bl-texto.bl-sem-quebra{white-space:nowrap;text-overflow:ellipsis;}
.bl-texto.bl-limitado{display:-webkit-box;-webkit-box-orient:vertical;}
.bl-nota-icone{position:absolute;top:${FOLGA.topo - 2}px;right:${FOLGA.lateral - 4}px;width:${FOLGA.icone}px;height:${FOLGA.icone}px;
  border:0;padding:0;background:transparent;color:inherit;font:inherit;font-size:14px;line-height:${FOLGA.icone}px;cursor:help;opacity:.7;}
.bl-nota-icone:hover,.bl-nota-icone:focus{opacity:1;}
.bl-nota-balao{position:absolute;z-index:5;right:${FOLGA.lateral}px;top:${FOLGA.topo + FOLGA.icone + 2}px;max-width:calc(100% - ${2 * FOLGA.lateral}px);
  padding:6px 8px;border-radius:6px;box-shadow:0 4px 14px rgba(15,23,42,.22);display:none;line-height:1.35;}
.bl-nota-balao.bl-visivel{display:block;}
`;
  function cssDoCabecalho() {
    return CSS;
  }
  function aplicarEstilo(el, item, tema) {
    const e = item.estilo;
    el.className = `bl-texto bl-${item.tipo}`;
    el.style.fontSize = `${e.tamanho}px`;
    el.style.lineHeight = String(e.alturaDaLinha);
    el.style.fontWeight = e.negrito ? "600" : "400";
    el.style.fontFamily = e.fonte || "";
    el.style.color = e.cor || "";
    el.style.opacity = String(e.opacidade);
    el.style.textAlign = e.alinhamento === "centro" ? "center" : e.alinhamento === "direita" ? "right" : "left";
    el.style.left = `${e.dx}px`;
    el.style.top = `${e.dy}px`;
    el.style.margin = `${e.margem}px 0`;
    el.style.height = `${item.alturaDoTexto}px`;
    if (!e.quebrar) el.classList.add("bl-sem-quebra");
    if (e.linhas > 0 && e.quebrar) {
      el.classList.add("bl-limitado");
      el.style.webkitLineClamp = String(e.linhas);
    }
    definirTexto(el, item.texto);
    if (item.tipo === "nota" && !e.cor) el.style.color = tema.textoSuave || "";
  }
  function desenharCabecalho(bl, plano, tema = {}) {
    for (const [faixa, itens, altura] of [
      [bl.cabecalho, plano.topo, plano.alturaTopo],
      [bl.rodape, plano.base, plano.alturaBase]
    ]) {
      if (!faixa) continue;
      limpar(faixa);
      faixa.style.display = altura > 0 ? "block" : "none";
      faixa.style.height = `${altura}px`;
      for (const item of itens) aplicarEstilo(criarEl("div", { pai: faixa }), item, tema);
    }
    if (plano.icone && bl.cabecalho) {
      const botao = criarEl("button", { classe: "bl-nota-icone", texto: "\u24D8", pai: bl.cabecalho });
      botao.type = "button";
      botao.setAttribute("aria-label", "Nota explicativa");
      const balao = criarEl("div", { classe: "bl-nota-balao bl-texto bl-nota", pai: bl.raiz });
      definirTexto(balao, plano.icone);
      const e = plano.estiloDoIcone || {};
      balao.style.fontSize = `${e.tamanho || 10}px`;
      balao.style.fontFamily = e.fonte || "";
      balao.style.background = tema.tooltipFundo || "rgba(15,23,42,.94)";
      balao.style.color = tema.tooltipTexto || "#F8FAFC";
      balao.style.textAlign = e.alinhamento === "centro" ? "center" : e.alinhamento === "direita" ? "right" : "left";
      const mostrar = () => balao.classList.add("bl-visivel");
      const esconder = () => balao.classList.remove("bl-visivel");
      botao.addEventListener("pointerenter", mostrar);
      botao.addEventListener("focus", mostrar);
      botao.addEventListener("pointerleave", esconder);
      botao.addEventListener("blur", esconder);
      bl.balaoDaNota = balao;
    }
  }
  function limparBalaoDaNota(bl) {
    if (bl.balaoDaNota && bl.balaoDaNota.parentNode) bl.balaoDaNota.parentNode.removeChild(bl.balaoDaNota);
    bl.balaoDaNota = null;
  }

  // src/core/interaction.js
  var SELETOR_DE_ITENS = "[data-item], .bl-marcador";
  var CSS_DESTAQUE = `
.bl-hover-ativo [data-item], .bl-hover-ativo .bl-marcador{transition:opacity .15s ease;}
.bl-hover-ativo [data-item]:not(.bl-sob-mouse), .bl-hover-ativo .bl-marcador:not(.bl-sob-mouse){opacity:.3;}
@media (prefers-reduced-motion: reduce){.bl-hover-ativo [data-item], .bl-hover-ativo .bl-marcador{transition:none;}}
`;
  function ligarDestaqueAoPassar({ area, eventos, config = {} }) {
    if (!area || config.destacarAoPassarMouse === false) return false;
    const raiz = area.closest && area.closest(".bl-raiz") || area;
    if (!raiz.querySelector('style[data-estilo="bl-destaque"]')) {
      const style = document.createElement("style");
      style.setAttribute("data-estilo", "bl-destaque");
      style.textContent = CSS_DESTAQUE;
      raiz.appendChild(style);
    }
    let acesos = [];
    const apagar = () => {
      for (const el of acesos) el.classList.remove("bl-sob-mouse");
      acesos = [];
      area.classList.remove("bl-hover-ativo");
    };
    eventos.on(area, "pointerover", (ev) => {
      const alvo = ev.target && ev.target.closest ? ev.target.closest(SELETOR_DE_ITENS) : null;
      if (!alvo || !area.contains(alvo)) {
        apagar();
        return;
      }
      apagar();
      const chave = alvo.getAttribute("data-item");
      acesos = chave ? Array.from(area.querySelectorAll("[data-item]")).filter((e) => e.getAttribute("data-item") === chave) : [alvo];
      for (const el of acesos) el.classList.add("bl-sob-mouse");
      area.classList.add("bl-hover-ativo");
    });
    eventos.on(area, "pointerleave", apagar);
    return true;
  }

  // src/core/tooltip.js
  var CSS_TOOLTIP = `
.bl-tooltip{position:fixed;z-index:2147483000;pointer-events:none;max-width:320px;
  padding:6px 9px;border-radius:6px;font-size:11px;line-height:1.5;border:1px solid transparent;
  box-shadow:0 6px 18px rgba(15,23,42,.25);opacity:0;transition:opacity .12s ease;}
.bl-tooltip.bl-visivel{opacity:1;}
.bl-tooltip.bl-fixo{pointer-events:auto;padding-right:24px;box-shadow:0 0 0 2px rgba(66,118,190,.55),0 6px 18px rgba(15,23,42,.25);}
.bl-tooltip-fechar{position:absolute;top:2px;right:3px;width:18px;height:18px;padding:0;border:0;border-radius:4px;
  background:transparent;color:inherit;font:inherit;font-size:14px;line-height:18px;cursor:pointer;opacity:.8;}
.bl-tooltip-fechar:hover{opacity:1;background:rgba(127,127,127,.25);}
.bl-tooltip-linha{display:flex;gap:8px;justify-content:space-between;white-space:nowrap;}
.bl-tooltip-rotulo{opacity:.75;}
.bl-tooltip-valor{font-weight:600;}
.bl-tooltip-titulo{font-weight:700;margin-bottom:3px;}
.bl-tooltip-chip{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle;}
.bl-tooltip-dica{opacity:.6;font-size:.9em;margin-top:3px;}
`;
  var registro = /* @__PURE__ */ new WeakMap();
  var contextos = /* @__PURE__ */ new WeakMap();
  var TAGS_DO_MODELO = /* @__PURE__ */ new Set(["b", "i", "br", "span"]);
  var TAGS_DO_HTML_DO_LOOKER = /* @__PURE__ */ new Set(["b", "i", "br", "span", "strong", "em", "p", "div", "u", "small"]);
  function raizDe(el) {
    if (!el) return null;
    if (el.classList && el.classList.contains("bl-raiz")) return el;
    return el.closest && el.closest(".bl-raiz") || el;
  }
  function configurarTooltipsDe(raiz, { config, ponte } = {}) {
    const r = raizDe(raiz);
    if (!r) return;
    contextos.set(r, { config: config || {}, ponte: ponte || null });
    const t = registro.get(r);
    if (t) t.aplicarEstilo();
  }
  function esconderTooltipsDe(raiz) {
    const t = registro.get(raizDe(raiz));
    if (t) t.soltarEEsconder();
  }
  function destruirTooltipsDe(raiz) {
    const r = raizDe(raiz);
    const t = registro.get(r);
    if (t) t.destruir();
    contextos.delete(r);
  }
  function criarTooltip(hospedeiro, tema) {
    const raiz = raizDe(hospedeiro);
    const existente = registro.get(raiz);
    if (existente && existente.elemento.isConnected) {
      existente.definirTema(tema);
      return existente;
    }
    const t = construirTooltip(raiz, tema);
    registro.set(raiz, t);
    return t;
  }
  function construirTooltip(raiz, temaInicial) {
    if (!raiz.querySelector('style[data-estilo="bl-tooltip"]')) {
      const style = document.createElement("style");
      style.setAttribute("data-estilo", "bl-tooltip");
      style.textContent = CSS_TOOLTIP;
      raiz.appendChild(style);
    }
    const el = criarEl("div", { classe: "bl-tooltip" });
    el.setAttribute("role", "tooltip");
    (document.body || raiz).appendChild(el);
    let tema = temaInicial || {};
    let visivel = false;
    let fixo = false;
    let fixadoEm = 0;
    let ultimaPosicao = { x: 0, y: 0 };
    const removedores = [];
    function ouvir(alvo, evento, fn, opcoes) {
      if (!alvo || typeof alvo.addEventListener !== "function") return;
      alvo.addEventListener(evento, fn, opcoes);
      removedores.push(() => alvo.removeEventListener(evento, fn, opcoes));
    }
    function config() {
      const c = contextos.get(raiz);
      return c && c.config || {};
    }
    function aplicarEstilo2() {
      const c = config();
      const cor = (v) => typeof v === "string" && v.trim() ? v.trim() : "";
      el.style.background = cor(c.corDeFundoDoTooltip) || tema.tooltipFundo || "rgba(15,23,42,.94)";
      el.style.color = cor(c.corDoTextoDoTooltip) || tema.tooltipTexto || "#F8FAFC";
      el.style.borderColor = cor(c.corDaBordaDoTooltip) || "transparent";
      el.style.fontFamily = tema.fonte || "";
      const tamanho = Number(c.tamanhoDoTooltip);
      el.style.fontSize = Number.isFinite(tamanho) && tamanho > 0 ? `${tamanho}px` : "";
    }
    function posicionar(clientX, clientY) {
      ultimaPosicao = { x: clientX, y: clientY };
      const margem = 12;
      const larguraJanela = typeof window !== "undefined" && window.innerWidth || 1024;
      const alturaJanela = typeof window !== "undefined" && window.innerHeight || 768;
      const largura = el.offsetWidth || 200;
      const altura = el.offsetHeight || 60;
      let x = clientX + margem;
      let y = clientY + margem;
      if (x + largura > larguraJanela - 4) x = clientX - largura - margem;
      if (y + altura > alturaJanela - 4) y = clientY - altura - margem;
      el.style.left = `${Math.max(4, Math.min(x, larguraJanela - largura - 4))}px`;
      el.style.top = `${Math.max(4, Math.min(y, alturaJanela - altura - 4))}px`;
    }
    function preencher(conteudo) {
      var _a, _b;
      limpar(el);
      const c = config();
      const modelo = typeof c.modeloDeTooltip === "string" ? c.modeloDeTooltip.trim() : "";
      if (modelo) {
        montarModelo(el, modelo, variaveisDoConteudo(conteudo), c, contextos.get(raiz));
        return;
      }
      if (conteudo.titulo) criarEl("div", { classe: "bl-tooltip-titulo", texto: conteudo.titulo, pai: el });
      if (conteudo.texto) {
        for (const parte of String(conteudo.texto).split("\n")) criarEl("div", { texto: parte, pai: el });
      }
      for (const linha of conteudo.linhas || []) {
        const l = criarEl("div", { classe: "bl-tooltip-linha", pai: el });
        const esquerda = criarEl("span", { classe: "bl-tooltip-rotulo", pai: l });
        if (linha.cor) {
          const chip = criarEl("span", { classe: "bl-tooltip-chip", pai: esquerda });
          chip.style.background = linha.cor;
        }
        esquerda.appendChild(document.createTextNode(String((_a = linha.rotulo) != null ? _a : "")));
        criarEl("span", { classe: "bl-tooltip-valor", texto: (_b = linha.valor) != null ? _b : "", pai: l });
      }
    }
    function colocarBotaoFechar() {
      removerBotaoFechar();
      const botao = criarEl("button", { classe: "bl-tooltip-fechar", texto: "\xD7", pai: el });
      botao.setAttribute("type", "button");
      botao.setAttribute("aria-label", "Fechar");
      botao.addEventListener("click", (ev) => {
        ev.stopPropagation();
        api.soltar();
      });
    }
    function removerBotaoFechar() {
      const b = el.querySelector(".bl-tooltip-fechar");
      if (b && b.parentNode) b.parentNode.removeChild(b);
    }
    const api = {
      elemento: el,
      get visivel() {
        return visivel;
      },
      get fixo() {
        return fixo;
      },
      ultimoConteudo: null,
      definirTema(novo) {
        tema = novo || tema;
        aplicarEstilo2();
      },
      aplicarEstilo: aplicarEstilo2,
      /**
       * Mostra o tooltip.
       * @param {{titulo?:string, linhas?:Array<{rotulo:string,valor:string,cor?:string}>,
       *          texto?:string, variaveis?:object}} conteudo
       *   `variaveis` (opcional) alimenta o modelo do usuário: categoria,
       *   valor, serie, percentual e quaisquer outras.
       */
      mostrar(conteudo, clientX, clientY) {
        if (fixo) return;
        if (config().mostrarTooltip === false) return;
        api.ultimoConteudo = conteudo || {};
        preencher(api.ultimoConteudo);
        posicionar(clientX, clientY);
        if (!visivel) {
          el.classList.add("bl-visivel");
          visivel = true;
        }
      },
      mover(clientX, clientY) {
        if (visivel && !fixo) posicionar(clientX, clientY);
      },
      esconder() {
        if (fixo || !visivel) return;
        el.classList.remove("bl-visivel");
        visivel = false;
      },
      /** Fixa o tooltip onde está (ou com o conteúdo dado). */
      fixar(conteudo, clientX, clientY) {
        if (conteudo) {
          fixo = false;
          api.mostrar(conteudo, clientX != null ? clientX : ultimaPosicao.x, clientY != null ? clientY : ultimaPosicao.y);
        }
        if (!visivel) return false;
        fixo = true;
        fixadoEm = Date.now();
        el.classList.add("bl-fixo");
        colocarBotaoFechar();
        return true;
      },
      soltar() {
        if (!fixo) return;
        fixo = false;
        el.classList.remove("bl-fixo");
        removerBotaoFechar();
        el.classList.remove("bl-visivel");
        visivel = false;
      },
      /** Solta (se fixo) e esconde (se visível): nada fica na tela. */
      soltarEEsconder() {
        api.soltar();
        api.esconder();
      },
      destruir() {
        for (const r of removedores.splice(0)) r();
        try {
          if (el.parentNode) el.parentNode.removeChild(el);
        } catch (_) {
        }
        if (registro.get(raiz) === api) registro.delete(raiz);
        visivel = false;
        fixo = false;
      }
    };
    ouvir(raiz, "pointerleave", () => api.esconder());
    ouvir(raiz, "mouseleave", () => api.esconder());
    if (typeof window !== "undefined") {
      ouvir(window, "scroll", () => {
        api.soltar();
        api.esconder();
      }, true);
    }
    ouvir(document, "keydown", (ev) => {
      if (ev && ev.key === "Escape") api.soltarEEsconder();
    });
    ouvir(document, "pointerdown", (ev) => {
      if (ev && ev.target && el.contains(ev.target)) return;
      if (fixo && Date.now() - fixadoEm > 50) api.soltar();
    }, true);
    if (typeof window !== "undefined") {
      ouvir(window, "blur", () => api.soltarEEsconder());
      ouvir(window, "focus", () => api.soltarEEsconder());
    }
    if (document.documentElement) {
      ouvir(document.documentElement, "mouseleave", () => api.soltarEEsconder());
    }
    ouvir(document, "mouseout", (ev) => {
      if (ev && !ev.relatedTarget && (!ev.target || !el.contains(ev.target))) api.esconder();
    });
    ouvir(document, "visibilitychange", () => {
      if (document.hidden) api.soltarEEsconder();
    });
    aplicarEstilo2();
    return api;
  }
  function variaveisDoConteudo(conteudo = {}) {
    const v = {};
    const linhas = conteudo.linhas || [];
    for (const l of linhas) {
      if (!l || l.rotulo === void 0) continue;
      const rotulo = String(l.rotulo);
      v[rotulo] = l.valor;
      v[rotulo.toLowerCase()] = l.valor;
      v[normalizarNome(rotulo)] = l.valor;
    }
    if (conteudo.titulo !== void 0) v.categoria = conteudo.titulo;
    const primeira = linhas.find((l) => l && l.valor !== void 0 && l.valor !== "");
    if (primeira) v.valor = primeira.valor;
    const comCor = linhas.find((l) => l && l.cor);
    if (comCor) v.serie = comCor.rotulo;
    const comPct = linhas.find((l) => l && /%\s*$/.test(String(l.valor || "")));
    if (comPct) v.percentual = comPct.valor;
    return Object.assign(v, conteudo.variaveis || {});
  }
  function normalizarNome(texto) {
    return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }
  function montarModelo(alvo, modelo, variaveis, config = {}, contexto = null) {
    const pilha = [alvo];
    const atual = () => pilha[pilha.length - 1];
    const reTag = /<\s*(\/?)\s*([a-zA-Z]+)\s*(\/?)\s*>/g;
    let fim = 0;
    let m;
    const textos = (trecho) => {
      if (!trecho) return;
      const partes = trecho.split("\n");
      partes.forEach((p, i) => {
        if (i > 0) atual().appendChild(document.createElement("br"));
        inserirComVariaveis(atual(), p, variaveis, config, contexto);
      });
    };
    while ((m = reTag.exec(modelo)) !== null) {
      textos(modelo.slice(fim, m.index));
      fim = reTag.lastIndex;
      const nome = m[2].toLowerCase();
      if (!TAGS_DO_MODELO.has(nome)) {
        textos(m[0]);
        continue;
      }
      if (nome === "br") {
        atual().appendChild(document.createElement("br"));
      } else if (m[1] === "/") {
        if (pilha.length > 1 && atual().tagName.toLowerCase() === nome) pilha.pop();
      } else {
        const novo = document.createElement(nome);
        atual().appendChild(novo);
        if (m[3] !== "/") pilha.push(novo);
      }
    }
    textos(modelo.slice(fim));
  }
  function inserirComVariaveis(pai, texto, variaveis, config, contexto) {
    var _a, _b;
    const re2 = /\{\{\s*([^}]+?)\s*\}\}/g;
    let fim = 0;
    let m;
    while ((m = re2.exec(texto)) !== null) {
      if (m.index > fim) pai.appendChild(document.createTextNode(texto.slice(fim, m.index)));
      fim = re2.lastIndex;
      const chave = m[1].trim();
      const valor = (_b = (_a = variaveis[chave]) != null ? _a : variaveis[chave.toLowerCase()]) != null ? _b : variaveis[normalizarNome(chave)];
      const celula = variaveis.__celulas && variaveis.__celulas[chave];
      if (celula && config.permitirHtmlDoLooker && contexto && contexto.ponte) {
        const html = contexto.ponte.htmlDaCelula(celula, { permitido: true });
        if (html) {
          inserirHtmlFiltrado(pai, html);
          continue;
        }
      }
      pai.appendChild(document.createTextNode(valor === null || valor === void 0 ? "" : String(valor)));
    }
    if (fim < texto.length) pai.appendChild(document.createTextNode(texto.slice(fim)));
  }
  function inserirHtmlFiltrado(pai, html) {
    if (typeof DOMParser === "undefined") {
      pai.appendChild(document.createTextNode(String(html)));
      return;
    }
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    const copiar = (origem, destino) => {
      for (const no of Array.from(origem.childNodes)) {
        if (no.nodeType === 3) destino.appendChild(document.createTextNode(no.nodeValue));
        else if (no.nodeType === 1) {
          const nome = no.tagName.toLowerCase();
          if (TAGS_DO_HTML_DO_LOOKER.has(nome)) {
            const novo = document.createElement(nome);
            destino.appendChild(novo);
            copiar(no, novo);
          } else {
            copiar(no, destino);
          }
        }
      }
    };
    copiar(doc.body, pai);
  }
  function executarAcaoDoClique({ evento, celula, tooltip, ponte, config = {}, conteudo }) {
    const acao = config.acaoDoClique || "drill";
    const x = evento && evento.clientX;
    const y = evento && evento.clientY;
    if (evento && evento.shiftKey) {
      return tooltip && tooltip.fixar(conteudo, x, y) ? "fixou" : "nada";
    }
    if (acao === "nenhuma") return "nada";
    if (acao === "fixar") return tooltip && tooltip.fixar(conteudo, x, y) ? "fixou" : "nada";
    if (config.permitirDrill !== false && ponte && ponte.temDrill(celula)) {
      if (tooltip) tooltip.soltarEEsconder();
      return ponte.abrirDrill(celula, evento) ? "drill" : "nada";
    }
    return "nada";
  }

  // src/core/define-viz.js
  var CSS_BASE = `
.bl-raiz{position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;
  display:flex;flex-direction:column;}
.bl-raiz *{box-sizing:border-box;}
.bl-area{position:relative;width:100%;flex:1 1 auto;min-height:0;}
.bl-aviso{flex:0 0 auto;display:flex;gap:6px;align-items:flex-start;margin:4px 8px;padding:4px 6px 4px 8px;
  border-radius:4px;font-size:11px;line-height:1.35;}
.bl-aviso-texto{flex:1 1 auto;}
.bl-aviso-fechar{flex:0 0 auto;border:none;background:transparent;color:inherit;cursor:pointer;
  font:inherit;font-size:13px;line-height:1;padding:0 2px;opacity:.75;}
.bl-aviso-fechar:hover{opacity:1;}
.bl-vazio{display:flex;align-items:center;justify-content:center;width:100%;height:100%;
  text-align:center;padding:16px;opacity:.75;font-size:13px;}
`;
  function defineViz(declaracao) {
    const {
      id,
      label,
      opcoes: opcoesDeclaradas = {},
      exigencia = {},
      opcoesDinamicas = null,
      render,
      aoDestruir = null,
      // true = o gráfico anima sozinho (bar_race, tabela); a animação
      // genérica de entrada (módulo 2.7) não roda por cima.
      animacaoPropria = false,
      // true = o gráfico desenha título/subtítulo dentro do próprio desenho
      // (kpi_vivo): o cabeçalho padrão não repete o título.
      cabecalhoProprio = false
    } = declaracao;
    if (typeof render !== "function") {
      throw new Error(`defineViz(${id}): a fun\xE7\xE3o render \xE9 obrigat\xF3ria.`);
    }
    const opcoes = organizarAbas(
      Object.assign({}, opcoesDeAnimacaoPadrao(), opcoesDeclaradas, OPCOES_DE_AVISO, opcoesDoCabecalho())
    );
    const definicao = {
      id,
      label,
      options: opcoes,
      create(element, _config) {
        limpar(element);
        injetarEstilo(element, CSS_BASE + cssDoCabecalho(), "bl-base");
        const raiz = criarEl("div", { classe: "bl-raiz", pai: element });
        const cabecalho = criarEl("div", { classe: "bl-cabecalho", pai: raiz });
        const avisoEl = criarAviso(raiz);
        const area = criarEl("div", { classe: "bl-area", pai: raiz });
        const rodape = criarEl("div", { classe: "bl-rodape", pai: raiz });
        this._bl = {
          element,
          raiz,
          cabecalho,
          rodape,
          area,
          avisoEl,
          eventos: criarGerenciadorDeEventos(),
          estado: {},
          // persiste entre atualizações (rolagem, ordenação, etc.)
          quadrosAgendados: /* @__PURE__ */ new Set(),
          timersAgendados: /* @__PURE__ */ new Set(),
          primeiraRenderizacao: true,
          ultimoDesenho: null,
          cancelarObservador: null
        };
        this._bl.cancelarObservador = observarRedimensionamento(element, () => {
          if (this._bl && typeof this._bl.ultimoDesenho === "function") {
            this._bl.ultimoDesenho();
          }
        });
      },
      updateAsync(data, element, config, queryResponse, details, done) {
        const concluir = typeof done === "function" ? done : () => {
        };
        try {
          executarAtualizacao.call(this, {
            declaracao: { id, label, opcoes, exigencia, opcoesDinamicas, render, aoDestruir, animacaoPropria, cabecalhoProprio },
            data,
            element,
            config,
            queryResponse,
            details
          });
        } catch (erro) {
          try {
            const ponte = criarPonte(this, opcoes);
            const titulo = erro && erro.titulo || "Erro na visualiza\xE7\xE3o";
            const mensagem = erro && (erro.mensagem || erro.message) || String(erro);
            ponte.mostrarErro(titulo, mensagem);
            if (typeof console !== "undefined" && console.error) {
              console.error(`[${id}]`, erro);
            }
          } catch (_) {
          }
        } finally {
          concluir();
        }
      },
      destroy() {
        if (!this._bl) return;
        try {
          if (typeof aoDestruir === "function") aoDestruir({ estado: this._bl.estado });
        } catch (_) {
        }
        limparPendencias(this._bl);
        destruirTooltipsDe(this._bl.raiz);
        if (this._bl.cancelarObservador) this._bl.cancelarObservador();
        this._bl = null;
      }
    };
    registrarVisualizacao(definicao);
    return definicao;
  }
  function limparPendencias(bl) {
    bl.eventos.limpar();
    for (const q of bl.quadrosAgendados) cancelarQuadro(q);
    bl.quadrosAgendados.clear();
    for (const t of bl.timersAgendados) clearTimeout(t);
    bl.timersAgendados.clear();
  }
  function executarAtualizacao({ declaracao, data, element, config, queryResponse, details }) {
    const { id, opcoes, exigencia, opcoesDinamicas, render, animacaoPropria, cabecalhoProprio } = declaracao;
    const ponte = criarPonte(this, opcoes);
    ponte.limparErros();
    if (!this._bl) {
      definicaoCreateManual.call(this, element);
    }
    const bl = this._bl;
    const abrirDrillDoLooker = ponte.abrirDrill;
    ponte.abrirDrill = (celula, evento) => {
      esconderTooltipsDe(bl.raiz);
      return abrirDrillDoLooker(celula, evento);
    };
    limparPendencias(bl);
    esconderTooltipsDe(bl.raiz);
    limparAviso(bl);
    let configFinal = aplicarConfiguracaoJson(normalizarConfig(config, ponte.opcoesAtuais()));
    const tema = resolverTema(configFinal);
    const modelo = construirModelo(data, queryResponse, configFinal, ponte);
    if (typeof opcoesDinamicas === "function") {
      try {
        const dinamicas = opcoesDinamicas({ modelo, config: configFinal, tema });
        if (dinamicas && Object.keys(dinamicas).length && ponte.registrarOpcoes(organizarAbas(dinamicas))) {
          configFinal = aplicarConfiguracaoJson(normalizarConfig(config, ponte.opcoesAtuais()));
        }
      } catch (e) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(`[${id}] falha ao montar op\xE7\xF5es din\xE2micas:`, e && e.message);
        }
      }
    }
    if (configFinal.modoDebug) {
      escreverDebug(id, {
        modelo,
        configFinal,
        queryResponse,
        data,
        chaves: compararChaves(config, ponte.opcoesAtuais())
      });
    }
    configurarTooltipsDe(bl.raiz, { config: configFinal, ponte });
    const textosDoCabecalho = () => ({
      titulo: cabecalhoProprio ? "" : configFinal.titulo,
      subtitulo: cabecalhoProprio ? "" : configFinal.subtitulo,
      nota: textoFinalDaNota(configFinal, bl.notaAutomatica || "")
    });
    const aplicarCabecalhoV3 = () => aplicarCabecalho(bl, configFinal, tema, textosDoCabecalho());
    aplicarCabecalhoV3();
    const problema = validarModelo(modelo, exigencia);
    if (problema) {
      mostrarEstadoVazio(bl, tema, problema.mensagem);
      ponte.mostrarErro(problema.titulo, problema.mensagem);
      return;
    }
    posicionarAviso(bl, configFinal, id);
    for (const aviso of modelo.avisos) mostrarAviso(bl, tema, aviso);
    const { largura, altura } = medir(bl.area);
    const ctx = {
      id,
      modelo,
      config: configFinal,
      tema,
      raiz: bl.area,
      largura,
      altura,
      ponte,
      eventos: bl.eventos,
      estado: bl.estado,
      detalhes: details,
      primeiraRenderizacao: bl.primeiraRenderizacao,
      recursosDoLooker: recursosDoLooker(),
      /**
       * Texto AUTOMÁTICO da nota (5.1c): o gráfico escreve aqui (é um
       * elemento fora do documento); o núcleo decide onde e se mostra.
       */
      nota: null,
      limparRaiz() {
        limpar(bl.area);
      },
      /** O tooltip ÚNICO deste gráfico (null se o usuário desligou). */
      tooltip() {
        return configFinal.mostrarTooltip === false ? null : criarTooltip(bl.raiz, tema);
      },
      /**
       * Clique num item: aplica a "Ação do clique" (drill do Looker, fixar o
       * tooltip ou nada). `conteudo` é o do tooltip, para fixar mesmo
       * quando o tooltip ainda não estava aberto.
       */
      cliqueNoItem(evento, celula, conteudo) {
        return executarAcaoDoClique({
          evento,
          celula,
          tooltip: configFinal.mostrarTooltip === false ? null : criarTooltip(bl.raiz, tema),
          ponte,
          config: configFinal,
          conteudo
        });
      },
      avisar(mensagem) {
        mostrarAviso(bl, tema, mensagem);
      },
      mostrarVazio(mensagem) {
        mostrarEstadoVazio(bl, tema, mensagem || configFinal.textoSemDados || "Sem dados para exibir");
      },
      agendarQuadro(fn) {
        const idQuadro = (typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => setTimeout(() => cb(Date.now()), 16))(fn);
        bl.quadrosAgendados.add(idQuadro);
        return idQuadro;
      },
      agendarTimer(fn, ms) {
        const t = setTimeout(fn, ms);
        bl.timersAgendados.add(t);
        return t;
      },
      /**
       * Redesenha com os MESMOS dados, só com o estado atualizado — é o que
       * a legenda interativa precisa ao ligar/desligar uma série. Limpa os
       * listeners antes, senão cada clique empilharia mais um conjunto.
       */
      redesenhar() {
        limparPendencias(bl);
        esconderTooltipsDe(bl.raiz);
        limparAviso(bl);
        try {
          renderizar();
          ligarDestaqueAoPassar({ area: bl.area, eventos: bl.eventos, config: configFinal });
        } catch (e) {
          if (typeof console !== "undefined" && console.error) console.error(`[${id}]`, e);
        }
      }
    };
    function renderizar({ repetir = true } = {}) {
      ctx.nota = criarEl("div");
      render(ctx);
      const nova = (ctx.nota.textContent || "").trim();
      if (nova !== (bl.notaAutomatica || "")) {
        bl.notaAutomatica = nova;
        aplicarCabecalhoV3();
        const tamanho = medir(bl.area);
        if (repetir && (tamanho.largura !== ctx.largura || tamanho.altura !== ctx.altura)) {
          ctx.largura = tamanho.largura;
          ctx.altura = tamanho.altura;
          bl.eventos.limpar();
          limparPendencias(bl);
          esconderTooltipsDe(bl.raiz);
          renderizar({ repetir: false });
        }
      }
    }
    bl.raiz.style.background = tema.fundo;
    bl.raiz.style.color = tema.texto;
    bl.raiz.style.fontFamily = tema.fonte;
    bl.raiz.style.fontSize = `${tema.tamanhoBase}px`;
    bl.ultimoDesenho = () => {
      if (!this._bl) return;
      aplicarCabecalhoV3();
      const tamanho = medir(bl.area);
      if (tamanho.largura === ctx.largura && tamanho.altura === ctx.altura) return;
      ctx.largura = tamanho.largura;
      ctx.altura = tamanho.altura;
      bl.eventos.limpar();
      esconderTooltipsDe(bl.raiz);
      limparAviso(bl);
      try {
        renderizar();
        ligarDestaqueAoPassar({ area: bl.area, eventos: bl.eventos, config: configFinal });
      } catch (e) {
        if (typeof console !== "undefined" && console.error) console.error(`[${id}]`, e);
      }
    };
    renderizar();
    ligarDestaqueAoPassar({ area: bl.area, eventos: bl.eventos, config: configFinal });
    if (!animacaoPropria) {
      animarEntradaGenerica(bl.area, configFinal, { primeiraRenderizacao: bl.primeiraRenderizacao });
    }
    bl.primeiraRenderizacao = false;
  }
  function opcoesDeAnimacaoPadrao() {
    const bloco = blocoDeAnimacao({ secao: "Anima\xE7\xE3o" });
    delete bloco.contadorAnimado;
    bloco.destacarAoPassarMouse = blocoDeInteracao({ comZoom: false, comSelecao: false }).destacarAoPassarMouse;
    return bloco;
  }
  function definicaoCreateManual(element) {
    limpar(element);
    injetarEstilo(element, CSS_BASE + cssDoCabecalho(), "bl-base");
    const raiz = criarEl("div", { classe: "bl-raiz", pai: element });
    const cabecalho = criarEl("div", { classe: "bl-cabecalho", pai: raiz });
    const avisoEl = criarAviso(raiz);
    const area = criarEl("div", { classe: "bl-area", pai: raiz });
    const rodape = criarEl("div", { classe: "bl-rodape", pai: raiz });
    this._bl = {
      element,
      raiz,
      cabecalho,
      rodape,
      area,
      avisoEl,
      eventos: criarGerenciadorDeEventos(),
      estado: {},
      quadrosAgendados: /* @__PURE__ */ new Set(),
      timersAgendados: /* @__PURE__ */ new Set(),
      primeiraRenderizacao: true,
      ultimoDesenho: null,
      cancelarObservador: null
    };
  }
  function aplicarCabecalho(bl, config, tema, textos) {
    const { largura, altura } = medir(bl.raiz);
    limparBalaoDaNota(bl);
    const plano = planejarCabecalho({ largura, altura, config, tema, textos });
    desenharCabecalho(bl, plano, tema);
    bl.planoDoCabecalho = plano;
    return plano;
  }
  function criarAviso(raiz) {
    const avisoEl = criarEl("div", { classe: "bl-aviso", pai: raiz });
    avisoEl.setAttribute("role", "status");
    criarEl("span", { classe: "bl-aviso-texto", pai: avisoEl });
    const fechar = criarEl("button", { classe: "bl-aviso-fechar", pai: avisoEl, texto: "\xD7" });
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar aviso");
    fechar.title = "Fechar aviso";
    fechar.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const bl = avisoEl._bl;
      if (bl) bl.estado.avisoFechado = textoDoAviso(bl);
      avisoEl.style.display = "none";
    });
    avisoEl.style.display = "none";
    return avisoEl;
  }
  function textoDoAviso(bl) {
    const t = bl.avisoEl.querySelector(".bl-aviso-texto");
    return t ? t.textContent : "";
  }
  function limparAviso(bl) {
    bl.avisoEl._bl = bl;
    bl.avisoEl.style.display = "none";
    const t = bl.avisoEl.querySelector(".bl-aviso-texto");
    if (t) definirTexto(t, "");
  }
  function posicionarAviso(bl, config, id) {
    bl.idDoGrafico = id;
    const ligado = config.mostrarAvisos !== false;
    bl.posicaoDoAviso = ligado ? config.posicaoDosAvisos || "topo" : "oculto";
    if (bl.posicaoDoAviso === "rodape") {
      if (bl.area.nextSibling !== bl.avisoEl) bl.raiz.insertBefore(bl.avisoEl, bl.area.nextSibling);
    } else if (bl.avisoEl.nextSibling !== bl.area) {
      bl.raiz.insertBefore(bl.avisoEl, bl.area);
    }
  }
  function mostrarAviso(bl, tema, mensagem) {
    if (!mensagem) return;
    bl.avisosNoConsole = bl.avisosNoConsole || /* @__PURE__ */ new Set();
    if (!bl.avisosNoConsole.has(mensagem) && typeof console !== "undefined" && console.warn) {
      bl.avisosNoConsole.add(mensagem);
      console.warn(`[${bl.idDoGrafico || "biblioteca-looker"}] aviso: ${mensagem}`);
    }
    const textoEl = bl.avisoEl.querySelector(".bl-aviso-texto");
    const atual = textoEl.textContent;
    definirTexto(textoEl, atual ? `${atual} \xB7 ${mensagem}` : mensagem);
    const fechadoPeloUsuario = !!bl.estado.avisoFechado && bl.estado.avisoFechado === textoEl.textContent;
    bl.avisoEl.style.display = bl.posicaoDoAviso === "oculto" || fechadoPeloUsuario ? "none" : "flex";
    bl.avisoEl.style.background = tema.nome === "escuro" ? "rgba(251,191,36,.18)" : "rgba(253,230,138,.85)";
    bl.avisoEl.style.color = tema.nome === "escuro" ? "#FDE68A" : "#92400E";
  }
  var OPCOES_DE_AVISO = {
    mostrarAvisos: {
      type: "boolean",
      label: "Mostrar avisos (eles sempre v\xE3o tamb\xE9m para o console)",
      section: "Texto",
      default: true
    },
    posicaoDosAvisos: {
      type: "string",
      label: "Posi\xE7\xE3o dos avisos",
      section: "Texto",
      display: "select",
      default: "topo",
      values: [{ Topo: "topo" }, { Rodap\u00E9: "rodape" }, { Oculto: "oculto" }]
    }
  };
  function mostrarEstadoVazio(bl, tema, mensagem) {
    limpar(bl.area);
    const caixa = criarEl("div", { classe: "bl-vazio", pai: bl.area, texto: mensagem });
    caixa.style.color = tema.textoSuave;
  }
  function escreverDebug(id, { modelo, configFinal, queryResponse, data, chaves }) {
    if (typeof console === "undefined" || !console.log) return;
    console.log(`[${id}] debug \u2014 chaves do config`, chaves);
    const primeiraLinha = data && data.length ? data[0] : null;
    console.log(`[${id}] modo debug`, {
      recursosDoLooker: recursosDoLooker(),
      dimensoes: modelo.dimensoes.map((d) => ({ nome: d.nome, tipo: d.tipo, valueFormat: d.valueFormat })),
      medidas: modelo.medidas.map((m) => ({ nome: m.nome, tipo: m.tipo, valueFormat: m.valueFormat })),
      temPivo: modelo.temPivo,
      pivots: modelo.pivots.map((p) => ({ chave: p.chave, rotulo: p.rotulo, ehTotal: p.ehTotal })),
      quantidadeDeLinhas: modelo.quantidadeDeLinhas,
      totaisEncontrados: modelo.totais.encontrados,
      primeiraLinha,
      queryResponseBruto: queryResponse,
      config: configFinal
    });
  }

  // node_modules/d3-array/src/ascending.js
  function ascending(a, b) {
    return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  // node_modules/d3-array/src/descending.js
  function descending(a, b) {
    return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  // node_modules/d3-array/src/bisector.js
  function bisector(f) {
    let compare1, compare2, delta;
    if (f.length !== 2) {
      compare1 = ascending;
      compare2 = (d, x) => ascending(f(d), x);
      delta = (d, x) => f(d) - x;
    } else {
      compare1 = f === ascending || f === descending ? f : zero2;
      compare2 = f;
      delta = f;
    }
    function left(a, x, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0) return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function right(a, x, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0) return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a[mid], x) <= 0) lo = mid + 1;
          else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function center(a, x, lo = 0, hi = a.length) {
      const i = left(a, x, lo, hi - 1);
      return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
    }
    return { left, center, right };
  }
  function zero2() {
    return 0;
  }

  // node_modules/d3-array/src/number.js
  function number(x) {
    return x === null ? NaN : +x;
  }

  // node_modules/d3-array/src/bisect.js
  var ascendingBisect = bisector(ascending);
  var bisectRight = ascendingBisect.right;
  var bisectLeft = ascendingBisect.left;
  var bisectCenter = bisector(number).center;
  var bisect_default = bisectRight;

  // node_modules/d3-array/src/extent.js
  function extent(values, valueof) {
    let min2;
    let max2;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null) {
          if (min2 === void 0) {
            if (value >= value) min2 = max2 = value;
          } else {
            if (min2 > value) min2 = value;
            if (max2 < value) max2 = value;
          }
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null) {
          if (min2 === void 0) {
            if (value >= value) min2 = max2 = value;
          } else {
            if (min2 > value) min2 = value;
            if (max2 < value) max2 = value;
          }
        }
      }
    }
    return [min2, max2];
  }

  // node_modules/d3-array/src/ticks.js
  var e10 = Math.sqrt(50);
  var e5 = Math.sqrt(10);
  var e2 = Math.sqrt(2);
  function tickSpec(start, stop, count) {
    const step = (stop - start) / Math.max(0, count), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
    let i1, i2, inc;
    if (power < 0) {
      inc = Math.pow(10, -power) / factor;
      i1 = Math.round(start * inc);
      i2 = Math.round(stop * inc);
      if (i1 / inc < start) ++i1;
      if (i2 / inc > stop) --i2;
      inc = -inc;
    } else {
      inc = Math.pow(10, power) * factor;
      i1 = Math.round(start / inc);
      i2 = Math.round(stop / inc);
      if (i1 * inc < start) ++i1;
      if (i2 * inc > stop) --i2;
    }
    if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
    return [i1, i2, inc];
  }
  function ticks(start, stop, count) {
    stop = +stop, start = +start, count = +count;
    if (!(count > 0)) return [];
    if (start === stop) return [start];
    const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
    if (!(i2 >= i1)) return [];
    const n = i2 - i1 + 1, ticks2 = new Array(n);
    if (reverse) {
      if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) / -inc;
      else for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) * inc;
    } else {
      if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) / -inc;
      else for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) * inc;
    }
    return ticks2;
  }
  function tickIncrement(start, stop, count) {
    stop = +stop, start = +start, count = +count;
    return tickSpec(start, stop, count)[2];
  }
  function tickStep(start, stop, count) {
    stop = +stop, start = +start, count = +count;
    const reverse = stop < start, inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
    return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
  }

  // node_modules/d3-array/src/min.js
  function min(values, valueof) {
    let min2;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null && (min2 > value || min2 === void 0 && value >= value)) {
          min2 = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (min2 > value || min2 === void 0 && value >= value)) {
          min2 = value;
        }
      }
    }
    return min2;
  }

  // node_modules/d3-scale/src/init.js
  function initRange(domain, range) {
    switch (arguments.length) {
      case 0:
        break;
      case 1:
        this.range(domain);
        break;
      default:
        this.range(range).domain(domain);
        break;
    }
    return this;
  }

  // node_modules/d3-scale/src/constant.js
  function constants(x) {
    return function() {
      return x;
    };
  }

  // node_modules/d3-scale/src/number.js
  function number2(x) {
    return +x;
  }

  // node_modules/d3-scale/src/continuous.js
  var unit = [0, 1];
  function identity(x) {
    return x;
  }
  function normalize(a, b) {
    return (b -= a = +a) ? function(x) {
      return (x - a) / b;
    } : constants(isNaN(b) ? NaN : 0.5);
  }
  function clamper(a, b) {
    var t;
    if (a > b) t = a, a = b, b = t;
    return function(x) {
      return Math.max(a, Math.min(b, x));
    };
  }
  function bimap(domain, range, interpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
    else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
    return function(x) {
      return r0(d0(x));
    };
  }
  function polymap(domain, range, interpolate) {
    var j = Math.min(domain.length, range.length) - 1, d = new Array(j), r = new Array(j), i = -1;
    if (domain[j] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++i < j) {
      d[i] = normalize(domain[i], domain[i + 1]);
      r[i] = interpolate(range[i], range[i + 1]);
    }
    return function(x) {
      var i2 = bisect_default(domain, x, 1, j) - 1;
      return r[i2](d[i2](x));
    };
  }
  function copy(source, target) {
    return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
  }
  function transformer() {
    var domain = unit, range = unit, interpolate = value_default, transform, untransform, unknown, clamp = identity, piecewise, output, input;
    function rescale() {
      var n = Math.min(domain.length, range.length);
      if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
      piecewise = n > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }
    function scale(x) {
      return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
    }
    scale.invert = function(y) {
      return clamp(untransform((input || (input = piecewise(range, domain.map(transform), number_default)))(y)));
    };
    scale.domain = function(_) {
      return arguments.length ? (domain = Array.from(_, number2), rescale()) : domain.slice();
    };
    scale.range = function(_) {
      return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
    };
    scale.rangeRound = function(_) {
      return range = Array.from(_), interpolate = round_default, rescale();
    };
    scale.clamp = function(_) {
      return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
    };
    scale.interpolate = function(_) {
      return arguments.length ? (interpolate = _, rescale()) : interpolate;
    };
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    return function(t, u) {
      transform = t, untransform = u;
      return rescale();
    };
  }
  function continuous() {
    return transformer()(identity, identity);
  }

  // node_modules/d3-scale/src/tickFormat.js
  function tickFormat(start, stop, count, specifier) {
    var step = tickStep(start, stop, count), precision;
    specifier = formatSpecifier(specifier == null ? ",f" : specifier);
    switch (specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value))) specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
    }
    return format(specifier);
  }

  // node_modules/d3-scale/src/linear.js
  function linearish(scale) {
    var domain = scale.domain;
    scale.ticks = function(count) {
      var d = domain();
      return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
    };
    scale.tickFormat = function(count, specifier) {
      var d = domain();
      return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
    };
    scale.nice = function(count) {
      if (count == null) count = 10;
      var d = domain();
      var i0 = 0;
      var i1 = d.length - 1;
      var start = d[i0];
      var stop = d[i1];
      var prestep;
      var step;
      var maxIter = 10;
      if (stop < start) {
        step = start, start = stop, stop = step;
        step = i0, i0 = i1, i1 = step;
      }
      while (maxIter-- > 0) {
        step = tickIncrement(start, stop, count);
        if (step === prestep) {
          d[i0] = start;
          d[i1] = stop;
          return domain(d);
        } else if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
        } else {
          break;
        }
        prestep = step;
      }
      return scale;
    };
    return scale;
  }
  function linear2() {
    var scale = continuous();
    scale.copy = function() {
      return copy(scale, linear2());
    };
    initRange.apply(scale, arguments);
    return linearish(scale);
  }

  // node_modules/d3-scale/src/nice.js
  function nice(domain, interval) {
    domain = domain.slice();
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], t;
    if (x1 < x0) {
      t = i0, i0 = i1, i1 = t;
      t = x0, x0 = x1, x1 = t;
    }
    domain[i0] = interval.floor(x0);
    domain[i1] = interval.ceil(x1);
    return domain;
  }

  // node_modules/d3-scale/src/log.js
  function transformLog(x) {
    return Math.log(x);
  }
  function transformExp(x) {
    return Math.exp(x);
  }
  function transformLogn(x) {
    return -Math.log(-x);
  }
  function transformExpn(x) {
    return -Math.exp(-x);
  }
  function pow10(x) {
    return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
  }
  function powp(base) {
    return base === 10 ? pow10 : base === Math.E ? Math.exp : (x) => Math.pow(base, x);
  }
  function logp(base) {
    return base === Math.E ? Math.log : base === 10 && Math.log10 || base === 2 && Math.log2 || (base = Math.log(base), (x) => Math.log(x) / base);
  }
  function reflect(f) {
    return (x, k) => -f(-x, k);
  }
  function loggish(transform) {
    const scale = transform(transformLog, transformExp);
    const domain = scale.domain;
    let base = 10;
    let logs;
    let pows;
    function rescale() {
      logs = logp(base), pows = powp(base);
      if (domain()[0] < 0) {
        logs = reflect(logs), pows = reflect(pows);
        transform(transformLogn, transformExpn);
      } else {
        transform(transformLog, transformExp);
      }
      return scale;
    }
    scale.base = function(_) {
      return arguments.length ? (base = +_, rescale()) : base;
    };
    scale.domain = function(_) {
      return arguments.length ? (domain(_), rescale()) : domain();
    };
    scale.ticks = (count) => {
      const d = domain();
      let u = d[0];
      let v = d[d.length - 1];
      const r = v < u;
      if (r) [u, v] = [v, u];
      let i = logs(u);
      let j = logs(v);
      let k;
      let t;
      const n = count == null ? 10 : +count;
      let z = [];
      if (!(base % 1) && j - i < n) {
        i = Math.floor(i), j = Math.ceil(j);
        if (u > 0) for (; i <= j; ++i) {
          for (k = 1; k < base; ++k) {
            t = i < 0 ? k / pows(-i) : k * pows(i);
            if (t < u) continue;
            if (t > v) break;
            z.push(t);
          }
        }
        else for (; i <= j; ++i) {
          for (k = base - 1; k >= 1; --k) {
            t = i > 0 ? k / pows(-i) : k * pows(i);
            if (t < u) continue;
            if (t > v) break;
            z.push(t);
          }
        }
        if (z.length * 2 < n) z = ticks(u, v, n);
      } else {
        z = ticks(i, j, Math.min(j - i, n)).map(pows);
      }
      return r ? z.reverse() : z;
    };
    scale.tickFormat = (count, specifier) => {
      if (count == null) count = 10;
      if (specifier == null) specifier = base === 10 ? "s" : ",";
      if (typeof specifier !== "function") {
        if (!(base % 1) && (specifier = formatSpecifier(specifier)).precision == null) specifier.trim = true;
        specifier = format(specifier);
      }
      if (count === Infinity) return specifier;
      const k = Math.max(1, base * count / scale.ticks().length);
      return (d) => {
        let i = d / pows(Math.round(logs(d)));
        if (i * base < base - 0.5) i *= base;
        return i <= k ? specifier(d) : "";
      };
    };
    scale.nice = () => {
      return domain(nice(domain(), {
        floor: (x) => pows(Math.floor(logs(x))),
        ceil: (x) => pows(Math.ceil(logs(x)))
      }));
    };
    return scale;
  }
  function log() {
    const scale = loggish(transformer()).domain([1, 10]);
    scale.copy = () => copy(scale, log()).base(scale.base());
    initRange.apply(scale, arguments);
    return scale;
  }

  // node_modules/d3-scale/src/pow.js
  function transformPow(exponent) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
    };
  }
  function transformSqrt(x) {
    return x < 0 ? -Math.sqrt(-x) : Math.sqrt(x);
  }
  function transformSquare(x) {
    return x < 0 ? -x * x : x * x;
  }
  function powish(transform) {
    var scale = transform(identity, identity), exponent = 1;
    function rescale() {
      return exponent === 1 ? transform(identity, identity) : exponent === 0.5 ? transform(transformSqrt, transformSquare) : transform(transformPow(exponent), transformPow(1 / exponent));
    }
    scale.exponent = function(_) {
      return arguments.length ? (exponent = +_, rescale()) : exponent;
    };
    return linearish(scale);
  }
  function pow() {
    var scale = powish(transformer());
    scale.copy = function() {
      return copy(scale, pow()).exponent(scale.exponent());
    };
    initRange.apply(scale, arguments);
    return scale;
  }

  // src/core/scales.js
  function escalaNumerica({ valores: valores2, intervalo, config = {}, eixo = "Y" }) {
    const prefixo = eixo.toUpperCase();
    const tipo = config[`escalaEixo${prefixo}`] || "linear";
    const minManual = numeroOuIndefinido(config[`minimoEixo${prefixo}`]);
    const maxManual = numeroOuIndefinido(config[`maximoEixo${prefixo}`]);
    const inverter = !!config[`inverterEixo${prefixo}`];
    let [d0, d1] = extent(valores2.filter((v) => Number.isFinite(v)));
    if (d0 === void 0) {
      d0 = 0;
      d1 = 1;
    }
    if (d0 === d1) {
      const delta = Math.abs(d0) * 0.1 || 1;
      d0 -= delta;
      d1 += delta;
    }
    if (minManual !== void 0) d0 = minManual;
    if (maxManual !== void 0) d1 = maxManual;
    let escala;
    if (tipo === "log") {
      const positivos = valores2.filter((v) => Number.isFinite(v) && v > 0);
      const piso = positivos.length ? min(positivos) : 1;
      escala = log().domain([minManual !== void 0 ? Math.max(minManual, piso) : piso, Math.max(d1, piso * 10)]);
    } else if (tipo === "raiz") {
      escala = pow().exponent(0.5).domain([d0, d1]);
    } else {
      escala = linear2().domain([d0, d1]);
    }
    escala.range(inverter ? [intervalo[1], intervalo[0]] : intervalo);
    if (tipo !== "log" && minManual === void 0 && maxManual === void 0) escala.nice();
    return escala;
  }
  function numeroOuIndefinido(v) {
    if (v === null || v === void 0 || v === "") return void 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : void 0;
  }

  // src/core/shapes.js
  function CatmullLimitada(contexto) {
    this._context = contexto;
  }
  CatmullLimitada.prototype = {
    areaStart() {
      this._line = 0;
    },
    areaEnd() {
      this._line = NaN;
    },
    lineStart() {
      this._pontos = [];
    },
    point(x, y) {
      this._pontos.push([+x, +y]);
    },
    lineEnd() {
      const p = this._pontos;
      const n = p.length;
      const c = this._context;
      if (n) {
        if (this._line) c.lineTo(p[0][0], p[0][1]);
        else c.moveTo(p[0][0], p[0][1]);
        const limitar = (v, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), v));
        for (let i = 0; i < n - 1; i++) {
          const p0 = p[i - 1] || p[i];
          const p1 = p[i];
          const p2 = p[i + 1];
          const p3 = p[i + 2] || p2;
          const c1x = limitar(p1[0] + (p2[0] - p0[0]) / 6, p1[0], p2[0]);
          const c1y = limitar(p1[1] + (p2[1] - p0[1]) / 6, p1[1], p2[1]);
          const c2x = limitar(p2[0] - (p3[0] - p1[0]) / 6, p1[0], p2[0]);
          const c2y = limitar(p2[1] - (p3[1] - p1[1]) / 6, p1[1], p2[1]);
          c.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
        }
      }
      if (this._line || this._line !== 0 && n === 1) c.closePath();
      this._line = 1 - this._line;
    }
  };
  function caminhoDoSimbolo(forma, tamanho) {
    const r = Math.max(0.5, tamanho / 2);
    switch (forma) {
      case "quadrado":
        return `M${-r},${-r}h${r * 2}v${r * 2}h${-r * 2}Z`;
      case "triangulo": {
        const h = r * 1.6;
        return `M0,${-h}L${r * 1.4},${h * 0.7}L${-r * 1.4},${h * 0.7}Z`;
      }
      case "losango":
        return `M0,${-r * 1.3}L${r * 1},0L0,${r * 1.3}L${-r * 1},0Z`;
      case "cruz": {
        const b = r * 0.42;
        return `M${-b},${-r}h${b * 2}v${r - b}h${r - b}v${b * 2}h${-(r - b)}v${r - b}h${-b * 2}v${-(r - b)}h${-(r - b)}v${-b * 2}h${r - b}Z`;
      }
      case "estrela": {
        const pontas = 5;
        const rExterno = r * 1.25;
        const rInterno = r * 0.5;
        let d = "";
        for (let i = 0; i < pontas * 2; i++) {
          const raio = i % 2 === 0 ? rExterno : rInterno;
          const ang = Math.PI / pontas * i - Math.PI / 2;
          const x = Math.cos(ang) * raio;
          const y = Math.sin(ang) * raio;
          d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        }
        return `${d}Z`;
      }
      case "wye":
        return pontosDoWye(r).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("") + "Z";
      case "circulo":
      default:
        return `M${-r},0a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
    }
  }
  function pontosDoWye(r) {
    const b = r * 0.38;
    const pontos = [];
    for (let k = 0; k < 3; k++) {
      const ang = -Math.PI / 2 + k * 2 * Math.PI / 3;
      const cx = Math.cos(ang);
      const cy = Math.sin(ang);
      const px = -cy;
      const py = cx;
      const centro = b / Math.sqrt(3);
      pontos.push([cx * r * 1.15 - px * b, cy * r * 1.15 - py * b]);
      pontos.push([cx * r * 1.15 + px * b, cy * r * 1.15 + py * b]);
      const prox = ang + Math.PI / 3;
      pontos.push([Math.cos(prox) * centro * 2, Math.sin(prox) * centro * 2]);
    }
    return pontos;
  }
  var FORMAS_DE_MARCADOR = ["circulo", "quadrado", "triangulo", "losango", "cruz", "estrela", "wye"];
  function formaDoMarcador(nome) {
    const mapa = { circle: "circulo", square: "quadrado", triangle: "triangulo", diamond: "losango", cross: "cruz", star: "estrela", y: "wye" };
    const n = String(nome || "").trim().toLowerCase();
    if (FORMAS_DE_MARCADOR.includes(n)) return n;
    return mapa[n] || "circulo";
  }
  function criarMarcadorSvg(pai, forma, x, y, diametro, atributos = {}) {
    const f = formaDoMarcador(forma);
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", caminhoDoSimbolo(f, Math.max(1, Number(diametro) || 1)));
    el.setAttribute("transform", `translate(${Number(x) || 0},${Number(y) || 0})`);
    el.setAttribute("class", "bl-marcador");
    el.setAttribute("data-forma", f);
    for (const [k, v] of Object.entries(atributos)) {
      if (v === void 0 || v === null) continue;
      if (k === "classe") el.setAttribute("class", `bl-marcador ${v}`);
      else el.setAttribute(k, String(v));
    }
    if (pai) pai.appendChild(el);
    return el;
  }
  function tracejadoPorEstilo(estilo, espessura = 1) {
    if (estilo === "tracejado") return `${espessura * 4},${espessura * 3}`;
    if (estilo === "pontilhado") return `${espessura},${espessura * 2}`;
    return null;
  }

  // src/core/eixos.js
  function larguraAproximada(texto, tamanhoDaFonte) {
    return String(texto).length * tamanhoDaFonte * 0.58;
  }

  // src/core/rotulos.js
  function lerBooleano(valor, padrao) {
    if (valor === void 0 || valor === null || valor === "") return padrao;
    if (valor === true || valor === false) return valor;
    if (valor === "true") return true;
    if (valor === "false") return false;
    return !!valor;
  }
  function lerNumero(valor, padrao) {
    const n = numeroOuNulo(valor);
    return n === null ? padrao : n;
  }
  function lerTexto(valor, padrao = "") {
    if (valor === void 0 || valor === null) return padrao;
    const t = String(valor).trim();
    return t === "" ? padrao : t;
  }
  function lerRotulos(config = {}, tema = {}, padroes = {}) {
    const { padraoVisivel = true, tamanhoPadrao = 11, casasPadrao = 1 } = padroes;
    return {
      mostrar: lerBooleano(config.mostrarRotulos, padraoVisivel),
      tamanho: Math.max(6, Math.min(48, lerNumero(config.tamanhoDoRotulo, tamanhoPadrao))),
      cor: lerTexto(config.corDoRotulo, ""),
      // vazio = automática
      negrito: lerBooleano(config.negritoNoRotulo, false),
      rotacao: lerNumero(config.rotacaoDoRotulo, 0),
      evitarColisao: lerBooleano(config.evitarColisaoDeRotulos, true),
      truncar: Math.max(0, lerNumero(config.truncarRotulo, 0)),
      posicao: lerTexto(config.posicaoDoRotulo, "auto"),
      conteudo: lerTexto(config.conteudoDoRotulo, "valor"),
      formato: lerTexto(config.formatoDoRotulo, "auto"),
      casas: Math.max(0, Math.min(6, Math.round(lerNumero(config.casasDecimaisDoRotulo, casasPadrao)))),
      fonte: tema.fonte,
      corDoTema: tema.texto
    };
  }
  function formatadorDoRotulo(rot, valueFormat) {
    if (!rot || rot.formato === "auto") {
      return formatadorDeValueFormat(valueFormat, { casas: rot ? rot.casas : 1 });
    }
    return criarFormatadorNumerico({ estilo: rot.formato, casas: rot.casas });
  }
  function textoDoRotulo(rot, dado = {}) {
    const { valor, nome = "", total, valueFormat, textoDoValor } = dado;
    const formatar = formatadorDoRotulo(rot, valueFormat);
    const n = numeroOuNulo(valor);
    const textoValor = rot.formato === "auto" && textoDoValor !== void 0 && textoDoValor !== null && textoDoValor !== "" ? String(textoDoValor) : n === null ? "" : formatar(n);
    let fracao = numeroOuNulo(dado.percentual);
    if (fracao === null && n !== null && numeroOuNulo(total)) fracao = n / Number(total);
    const textoPct = fracao === null ? "" : `${(fracao * 100).toFixed(rot.casas)}%`;
    let texto;
    switch (rot.conteudo) {
      case "nome":
        texto = String(nome);
        break;
      case "nomeValor":
        texto = nome !== "" && textoValor !== "" ? `${nome}: ${textoValor}` : String(nome || textoValor);
        break;
      case "percentual":
        texto = textoPct || textoValor;
        break;
      case "valorPercentual":
        texto = textoPct ? `${textoValor} (${textoPct})` : textoValor;
        break;
      case "valor":
      default:
        texto = textoValor;
        break;
    }
    return rot.truncar > 0 ? truncar(texto, rot.truncar) : texto;
  }
  function estilizarRotulo(el, rot, extra = {}) {
    if (!el || !rot) return el;
    const cor = rot.cor || extra.corAutomatica || rot.corDoTema;
    const ehSvg = el.namespaceURI === "http://www.w3.org/2000/svg";
    if (ehSvg) {
      el.setAttribute("font-size", String(rot.tamanho));
      if (cor) el.setAttribute("fill", cor);
      el.setAttribute("font-weight", rot.negrito ? "700" : "400");
      if (rot.fonte) el.setAttribute("font-family", rot.fonte);
      if (rot.rotacao) {
        const x = extra.x !== void 0 ? extra.x : Number(el.getAttribute("x")) || 0;
        const y = extra.y !== void 0 ? extra.y : Number(el.getAttribute("y")) || 0;
        const anterior = el.getAttribute("transform");
        const giro = `rotate(${rot.rotacao},${x},${y})`;
        el.setAttribute("transform", anterior ? `${anterior} ${giro}` : giro);
      }
    } else {
      el.style.fontSize = `${rot.tamanho}px`;
      if (cor) el.style.color = cor;
      el.style.fontWeight = rot.negrito ? "700" : "400";
      if (rot.rotacao) {
        const anterior = el.style.transform || "";
        el.style.transform = `${anterior} rotate(${rot.rotacao}deg)`.trim();
      }
    }
    el.setAttribute("data-rotulo", "1");
    return el;
  }
  function criarRotuloSvg(pai, rot, { x, y, texto, ancora = "middle", base = "central", corAutomatica } = {}) {
    if (!rot || !rot.mostrar || texto === "" || texto === null || texto === void 0) return null;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", String(x));
    el.setAttribute("y", String(y));
    el.setAttribute("text-anchor", ancora);
    el.setAttribute("dominant-baseline", base);
    el.setAttribute("class", "bl-rotulo");
    el.textContent = String(texto);
    estilizarRotulo(el, rot, { corAutomatica, x, y });
    pai.appendChild(el);
    return el;
  }

  // src/core/cores.js
  function paletaDoConfig(config = {}) {
    const cores = coresDaPaleta(config.paleta).slice();
    if (lerBooleano(config.inverterPaleta, false)) cores.reverse();
    return cores;
  }
  function corDoItem(config = {}, indice = 0, chave, { prefixo = "cor_" } = {}) {
    if (chave !== void 0 && chave !== null) {
      const propria = lerTexto(config[`${prefixo}${sanitizarChave(chave)}`], "");
      const padraoDaPosicao = coresDaPaleta("looker")[indice % coresDaPaleta("looker").length];
      if (propria && propria.toLowerCase() !== String(padraoDaPosicao).toLowerCase()) return propria;
    }
    const paleta = paletaDoConfig(config);
    return paleta[(indice % paleta.length + paleta.length) % paleta.length];
  }
  function opacidadeDoConfig(config = {}, padrao = 1) {
    return Math.max(0, Math.min(1, lerNumero(config.opacidade, padrao)));
  }
  function lerContorno(config = {}, tema = {}, { corPadrao } = {}) {
    const espessura = Math.max(0, lerNumero(config.espessuraDoContorno, 1));
    return {
      mostrar: lerBooleano(config.mostrarContorno, true) && espessura > 0,
      // '#FFFFFF' é o DEFAULT declarado (não pode mudar): quando o gráfico
      // informa uma cor padrão, o branco default vale como 'automática'.
      cor: ((c) => c && !(corPadrao && c.toUpperCase() === "#FFFFFF") ? c : corPadrao || tema.fundo || "#FFFFFF")(
        lerTexto(config.corDoContorno, "")
      ),
      espessura,
      estilo: lerTexto(config.tracejadoDoContorno, "solido")
    };
  }
  function aplicarContorno(el, contorno) {
    if (!el || !contorno) return el;
    const ehSvg = el.namespaceURI === "http://www.w3.org/2000/svg";
    if (ehSvg) {
      if (!contorno.mostrar) {
        el.setAttribute("stroke", "none");
        el.removeAttribute("stroke-dasharray");
        return el;
      }
      el.setAttribute("stroke", contorno.cor);
      el.setAttribute("stroke-width", String(contorno.espessura));
      const traco = tracejadoPorEstilo(contorno.estilo, contorno.espessura);
      if (traco) el.setAttribute("stroke-dasharray", traco);
      else el.removeAttribute("stroke-dasharray");
    } else {
      el.style.border = contorno.mostrar ? `${contorno.espessura}px ${contorno.estilo === "tracejado" ? "dashed" : contorno.estilo === "pontilhado" ? "dotted" : "solid"} ${contorno.cor}` : "none";
    }
    return el;
  }

  // src/core/series.js
  function opcaoDeOrigemDasSeries(secao = "Dados") {
    return {
      origemDasSeries: {
        type: "string",
        label: "De onde v\xEAm as s\xE9ries",
        section: secao,
        display: "select",
        default: "auto",
        values: listaDeValores([
          { rotulo: "Detectar sozinho", valor: "auto" },
          { rotulo: "Do piv\xF4", valor: "pivo" },
          { rotulo: "Da 2\xAA dimens\xE3o", valor: "dimensao" },
          { rotulo: "Uma s\xE9rie por medida", valor: "medidas" }
        ])
      },
      limiteDeSeries: {
        type: "number",
        label: 'M\xE1ximo de s\xE9ries (as demais viram "Outros")',
        section: secao,
        display: "range",
        min: 2,
        max: 40,
        step: 1,
        default: 12
      },
      agruparRestoEmOutros: {
        type: "boolean",
        label: 'Somar as s\xE9ries que passaram do limite em "Outros"',
        section: secao,
        default: true
      }
    };
  }
  function detectarOrigem(modelo) {
    if (modelo.temPivo) return "pivo";
    if (modelo.dimensoes.length >= 2) return "dimensao";
    if (modelo.medidas.length >= 2) return "medidas";
    return "medidas";
  }
  function extrairMatriz(modelo, config = {}, escolhas = {}) {
    const avisos = [];
    const origem = config.origemDasSeries && config.origemDasSeries !== "auto" ? config.origemDasSeries : detectarOrigem(modelo);
    const campoDaCategoria = acharCampo(modelo.dimensoes, escolhas.campoDaCategoria) || modelo.dimensoes[0] || null;
    if (!campoDaCategoria) {
      return {
        categorias: [],
        series: [],
        origem,
        avisos: ["A consulta precisa de pelo menos uma dimens\xE3o para servir de eixo."],
        campoDaCategoria: null,
        medida: null
      };
    }
    const categorias = [];
    const indicePorChave = /* @__PURE__ */ new Map();
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
      const chave = bruto === null || bruto === void 0 ? "\u2205" : String(bruto);
      if (indicePorChave.has(chave)) continue;
      indicePorChave.set(chave, categorias.length);
      categorias.push({
        chave,
        rotulo: modelo.texto(linha, campoDaCategoria.nome, void 0, "\u2205"),
        valorBruto: bruto,
        data: campoDaCategoria.ehData ? paraData(bruto) : null,
        indiceDaPrimeiraLinha: i
      });
    }
    const construtor = { pivo: deSeriesDoPivo, dimensao: deSeriesDaDimensao, medidas: deSeriesDasMedidas }[origem];
    const resultado = (construtor || deSeriesDasMedidas)(modelo, config, escolhas, {
      categorias,
      indicePorChave,
      campoDaCategoria,
      avisos
    });
    const limitado = aplicarLimite(resultado.series, config, avisos, categorias.length);
    return {
      categorias,
      series: limitado,
      origem,
      avisos,
      campoDaCategoria,
      medida: resultado.medida || null
    };
  }
  function acharCampo(campos, nome) {
    if (!nome) return null;
    return campos.find((c) => c.nome === nome) || null;
  }
  function serieVazia(quantidade) {
    return new Array(quantidade).fill(null);
  }
  function acumular(valores2, posicao, valor) {
    if (valor === null) return;
    valores2[posicao] = (valores2[posicao] === null ? 0 : valores2[posicao]) + valor;
  }
  function deSeriesDoPivo(modelo, config, escolhas, { categorias, indicePorChave, campoDaCategoria }) {
    const medida = acharCampo(modelo.medidas, escolhas.medida) || modelo.medidas[0] || null;
    if (!medida) return { series: [], medida: null };
    const series = modelo.pivotsDeDados.map((pivo) => ({
      chave: pivo.chave,
      rotulo: pivo.rotulo,
      valores: serieVazia(categorias.length)
    }));
    for (const linha of modelo.linhas) {
      const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
      const chave = bruto === null || bruto === void 0 ? "\u2205" : String(bruto);
      const coluna = indicePorChave.get(chave);
      if (coluna === void 0) continue;
      modelo.pivotsDeDados.forEach((pivo, i) => {
        acumular(series[i].valores, coluna, modelo.valorNumerico(linha, medida.nome, pivo.chave));
      });
    }
    return { series, medida };
  }
  function deSeriesDaDimensao(modelo, config, escolhas, { categorias, indicePorChave, campoDaCategoria, avisos }) {
    const medida = acharCampo(modelo.medidas, escolhas.medida) || modelo.medidas[0] || null;
    const campoDaSerie = acharCampo(modelo.dimensoes, escolhas.campoDaSerie) || modelo.dimensoes.find((d) => d.nome !== campoDaCategoria.nome) || null;
    if (!campoDaSerie) {
      avisos.push("N\xE3o h\xE1 uma segunda dimens\xE3o para formar as s\xE9ries.");
      return { series: [], medida };
    }
    if (!medida) return { series: [], medida: null };
    const porChave = /* @__PURE__ */ new Map();
    for (const linha of modelo.linhas) {
      const brutoCategoria = modelo.valorBruto(linha, campoDaCategoria.nome);
      const chaveCategoria = brutoCategoria === null || brutoCategoria === void 0 ? "\u2205" : String(brutoCategoria);
      const coluna = indicePorChave.get(chaveCategoria);
      if (coluna === void 0) continue;
      const brutoSerie = modelo.valorBruto(linha, campoDaSerie.nome);
      const chaveSerie = brutoSerie === null || brutoSerie === void 0 ? "\u2205" : String(brutoSerie);
      if (!porChave.has(chaveSerie)) {
        porChave.set(chaveSerie, {
          chave: chaveSerie,
          rotulo: modelo.texto(linha, campoDaSerie.nome, void 0, "\u2205"),
          valores: serieVazia(categorias.length)
        });
      }
      acumular(porChave.get(chaveSerie).valores, coluna, modelo.valorNumerico(linha, medida.nome));
    }
    return { series: Array.from(porChave.values()), medida };
  }
  function deSeriesDasMedidas(modelo, config, escolhas, { categorias, indicePorChave, campoDaCategoria }) {
    const escolhidas = Array.isArray(escolhas.medidas) && escolhas.medidas.length ? modelo.medidas.filter((m) => escolhas.medidas.includes(m.nome)) : modelo.medidas;
    const series = escolhidas.map((m) => ({
      chave: m.nome,
      rotulo: m.rotuloCurto,
      campo: m,
      valores: serieVazia(categorias.length)
    }));
    for (const linha of modelo.linhas) {
      const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
      const chave = bruto === null || bruto === void 0 ? "\u2205" : String(bruto);
      const coluna = indicePorChave.get(chave);
      if (coluna === void 0) continue;
      escolhidas.forEach((m, i) => {
        acumular(series[i].valores, coluna, modelo.valorNumerico(linha, m.nome));
      });
    }
    return { series, medida: escolhidas[0] || null };
  }
  function aplicarLimite(series, config, avisos, quantidadeDeCategorias) {
    const limite = Number(config.limiteDeSeries);
    if (!Number.isFinite(limite) || limite <= 0 || series.length <= limite) return series;
    const comSoma = series.map((s) => ({
      serie: s,
      soma: s.valores.reduce((a, v) => a + (v === null ? 0 : Math.abs(v)), 0)
    }));
    comSoma.sort((a, b) => b.soma - a.soma);
    const mantidas = comSoma.slice(0, limite).map((x) => x.serie);
    const resto = comSoma.slice(limite).map((x) => x.serie);
    if (config.agruparRestoEmOutros === false) {
      avisos.push(`${resto.length} s\xE9rie(s) al\xE9m do limite de ${limite} foram escondidas.`);
      return mantidas;
    }
    const outros = {
      chave: "__outros__",
      rotulo: "Outros",
      ehOutros: true,
      valores: serieVazia(quantidadeDeCategorias)
    };
    for (const serie of resto) {
      serie.valores.forEach((v, i) => acumular(outros.valores, i, v));
    }
    avisos.push(`${resto.length} s\xE9rie(s) al\xE9m do limite de ${limite} foram somadas em "Outros".`);
    return mantidas.concat([outros]);
  }
  function tratarNulos(series, modo = "zero") {
    if (modo === "manter") return series;
    return series.map((serie) => ({
      ...serie,
      valores: serie.valores.map((v, i) => {
        if (v !== null) return v;
        if (modo === "zero") return 0;
        if (modo === "interpolar") return interpolar(serie.valores, i);
        return null;
      })
    }));
  }
  function interpolar(valores2, i) {
    let antes = null;
    let depois = null;
    for (let j = i - 1; j >= 0; j--) {
      if (valores2[j] !== null) {
        antes = valores2[j];
        break;
      }
    }
    for (let j = i + 1; j < valores2.length; j++) {
      if (valores2[j] !== null) {
        depois = valores2[j];
        break;
      }
    }
    if (antes === null && depois === null) return null;
    if (antes === null) return depois;
    if (depois === null) return antes;
    return (antes + depois) / 2;
  }

  // src/charts/_serie_temporal/index.js
  var MAXIMO_DE_CORES_POR_SERIE = 30;
  function opcoesDeCorPorSerie(series, { secao = "Cores" } = {}) {
    const saida = {};
    for (const s of series.slice(0, MAXIMO_DE_CORES_POR_SERIE)) {
      const chave = sanitizarChave(s.chave);
      if (!chave) continue;
      saida[`cor_${chave}`] = {
        type: "string",
        label: `Cor \u2014 ${s.rotulo} (vazio = da paleta)`,
        section: secao,
        display: "color",
        default: ""
      };
    }
    return saida;
  }
  function opcoesDinamicasDeSerie({ minimoDeSeries = 1 } = {}) {
    return ({ modelo, config }) => {
      if (!modelo || !modelo.dimensoes || !modelo.dimensoes.length) return {};
      const matriz = extrairMatriz(modelo, config);
      if (matriz.series.length < minimoDeSeries) return {};
      return opcoesDeCorPorSerie(matriz.series);
    };
  }
  function lerSerieTemporal(ctx, { minimoDeCategorias = 2 } = {}) {
    const { modelo, config } = ctx;
    const matriz = extrairMatriz(modelo, config);
    for (const aviso of matriz.avisos) ctx.avisar(aviso);
    if (matriz.categorias.length < minimoDeCategorias) {
      return null;
    }
    const campoDeFormato = matriz.medida || modelo.medidas[0] || null;
    const casas = Number(config.casasDecimaisDoRotulo);
    const formatarValor = formatadorDeValueFormat(campoDeFormato && campoDeFormato.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1
    });
    const ehData = !!(matriz.campoDaCategoria && matriz.campoDaCategoria.ehData);
    const rotuloDaCategoria = (categoria) => ehData ? formatarData(categoria.valorBruto, config.formatoDeData || "auto") : categoria.rotulo;
    return { matriz, categorias: matriz.categorias, rotuloDaCategoria, formatarValor, campoDeFormato };
  }
  function chaveDe(modelo, linha, nome) {
    const bruto = modelo.valorBruto(linha, nome);
    return bruto === null || bruto === void 0 ? "\u2205" : String(bruto);
  }
  function localizarPonto(ctx, matriz, indice, s) {
    const { modelo } = ctx;
    const categoria = matriz.categorias[indice];
    const campoDaCategoria = matriz.campoDaCategoria;
    if (!categoria || !campoDaCategoria) return null;
    let campo = null;
    let pivo;
    let filtro = () => true;
    if (s && !s.ehOutros) {
      if (matriz.origem === "pivo") {
        campo = matriz.medida ? matriz.medida.nome : null;
        pivo = s.chave;
      } else if (matriz.origem === "dimensao") {
        campo = matriz.medida ? matriz.medida.nome : null;
        const campoDaSerie = modelo.dimensoes.find((d) => d.nome !== campoDaCategoria.nome);
        if (campoDaSerie) filtro = (linha) => chaveDe(modelo, linha, campoDaSerie.nome) === s.chave;
      } else {
        campo = s.chave;
      }
    }
    const linhas = modelo.linhas.filter(
      (linha) => chaveDe(modelo, linha, campoDaCategoria.nome) === categoria.chave && filtro(linha)
    );
    return { linhas, campo, pivo, categoria };
  }
  function celulaDoPonto(ctx, matriz, indice, s) {
    const { modelo } = ctx;
    const local = localizarPonto(ctx, matriz, indice, s);
    if (!local) return null;
    if (local.campo && local.linhas.length) {
      const c = modelo.celula(local.linhas[0], local.campo, local.pivo);
      if (c) return c;
    }
    const linha = modelo.linhas[local.categoria.indiceDaPrimeiraLinha];
    return linha ? modelo.celula(linha, matriz.campoDaCategoria.nome) : null;
  }
  function textoDoPonto(ctx, matriz, indice, s, valor, formatar) {
    if (valor === null || valor === void 0 || !Number.isFinite(valor)) return "\u2014";
    const local = localizarPonto(ctx, matriz, indice, s);
    if (local && local.campo && local.linhas.length === 1) {
      const linha = local.linhas[0];
      const bruto = ctx.modelo.valorNumerico(linha, local.campo, local.pivo);
      if (bruto !== null && Math.abs(bruto - valor) < 1e-9 * Math.max(1, Math.abs(valor))) {
        const t = ctx.modelo.texto(linha, local.campo, local.pivo, "");
        if (t !== "") return t;
      }
    }
    return formatar(valor);
  }
  function destruirSerieTemporal() {
  }

  // src/charts/slope_chart/index.js
  var CSS2 = `
.sl-area{position:relative;width:100%;height:100%;overflow:hidden;}
.sl-svg{position:absolute;left:0;top:0;}
.sl-linha{pointer-events:none;}
.sl-ponto{pointer-events:none;}
.sl-rotulo{pointer-events:none;}
.sl-cabecalho{pointer-events:none;font-weight:600;}
.sl-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;
  var MAXIMO_DE_ITENS = 60;
  var index_default = defineViz({
    id: "slope_chart",
    label: "Slope Chart",
    opcoes: comDefaults(
      montarOpcoes(
        blocoDeCores({ comEscalaPorValor: false }),
        blocoDeRotulos(),
        blocoDeTooltip(),
        blocoDeTema(),
        blocoAvancado(),
        opcaoDeOrigemDasSeries(),
        {
          corPorDirecao: {
            type: "boolean",
            label: "Colorir por dire\xE7\xE3o (sobe, desce, mant\xE9m)",
            section: "Slope",
            default: true
          },
          corDeAlta: {
            type: "string",
            label: "Cor de quem subiu",
            section: "Slope",
            display: "color",
            default: ""
          },
          corDeBaixa: {
            type: "string",
            label: "Cor de quem caiu",
            section: "Slope",
            display: "color",
            default: ""
          },
          criterioDaVariacao: {
            type: "string",
            label: "Medir a varia\xE7\xE3o em",
            section: "Slope",
            display: "select",
            default: "absoluta",
            values: listaDeValores([
              { rotulo: "Valor absoluto", valor: "absoluta" },
              { rotulo: "Percentual", valor: "percentual" }
            ])
          },
          destacarMaiores: {
            type: "number",
            label: "Destacar as N maiores varia\xE7\xF5es (0 = nenhuma)",
            section: "Slope",
            display: "number",
            default: 0
          },
          comecarEmZero: {
            type: "boolean",
            label: "Come\xE7ar o eixo em zero",
            section: "Slope",
            default: false
          },
          escreverValores: {
            type: "boolean",
            label: "Escrever o valor junto do nome",
            section: "R\xF3tulos",
            default: true
          },
          espessuraDaLinha: {
            type: "number",
            label: "Espessura das linhas",
            section: "Formato",
            display: "range",
            min: 0.5,
            max: 6,
            step: 0.5,
            default: 2
          }
        }
      ),
      { limiteDeSeries: MAXIMO_DE_ITENS, mostrarTooltip: true }
    ),
    exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },
    // "Cor — <série>" (vazio = da paleta); vale com "Colorir por direção"
    // desligado.
    opcoesDinamicas: opcoesDinamicasDeSerie({ minimoDeSeries: 1 }),
    render(ctx) {
      const { config, tema, raiz, largura, altura } = ctx;
      const serie = lerSerieTemporal(ctx);
      if (!serie) {
        ctx.mostrarVazio(
          "Um slope chart compara DOIS pontos no tempo. Traga ao menos dois per\xEDodos e v\xE1rias s\xE9ries (de um piv\xF4, de uma segunda dimens\xE3o ou de v\xE1rias medidas)."
        );
        return;
      }
      let series = tratarNulos(serie.matriz.series, "manter");
      if (!series.length) {
        ctx.mostrarVazio("Nenhuma s\xE9rie com valores para comparar.");
        return;
      }
      if (series.length > MAXIMO_DE_ITENS) {
        ctx.avisar(
          `A consulta tem ${series.length} s\xE9ries. Mostrando as ${MAXIMO_DE_ITENS} primeiras: acima disso nem a anti-colis\xE3o dos nomes d\xE1 conta.`
        );
        series = series.slice(0, MAXIMO_DE_ITENS);
      }
      const indiceDeA = 0;
      const indiceDeB = serie.categorias.length - 1;
      const periodosIgnorados = Math.max(0, serie.categorias.length - 2);
      const itens = [];
      for (const s of series) {
        const a = s.valores[indiceDeA];
        const b = s.valores[indiceDeB];
        if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b)) continue;
        itens.push({
          chave: s.chave,
          rotulo: s.rotulo,
          original: s,
          a,
          b,
          variacao: b - a,
          variacaoRelativa: a === 0 ? null : (b - a) / Math.abs(a)
        });
      }
      if (itens.length < 1) {
        ctx.mostrarVazio(
          "Nenhuma s\xE9rie tem valor nos DOIS per\xEDodos comparados. Uma linha de slope precisa das duas pontas \u2014 verifique os nulos no Explore."
        );
        return;
      }
      const incompletas = series.length - itens.length;
      if (incompletas > 0) {
        ctx.avisar(
          `${incompletas} s\xE9rie(s) n\xE3o t\xEAm valor nos dois per\xEDodos e ficaram de fora: uma linha de slope precisa das duas pontas.`
        );
      }
      const semBase = itens.filter((i) => i.variacaoRelativa === null);
      if ((config.criterioDaVariacao || "absoluta") === "percentual" && semBase.length) {
        ctx.avisar(
          `${semBase.length} s\xE9rie(s) come\xE7am em zero: varia\xE7\xE3o percentual sobre zero n\xE3o existe. Elas aparecem, mas sem percentual.`
        );
      }
      ctx.limparRaiz();
      injetarEstilo(raiz, CSS2, "sl");
      const area = criarEl("div", { classe: "sl-area", pai: raiz });
      const rot = lerRotulos(config, tema);
      const opacidade = opacidadeDoConfig(config);
      const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });
      const casas = Number(config.casasDecimaisDoRotulo);
      const valueFormat = serie.matriz.medida && serie.matriz.medida.valueFormat;
      const formatar = formatadorDeValueFormat(valueFormat, {
        casas: Number.isFinite(casas) ? casas : 1
      });
      for (const item of itens) {
        item.textoA = textoDoPonto(ctx, serie.matriz, indiceDeA, item.original, item.a, formatar);
        item.textoB = textoDoPonto(ctx, serie.matriz, indiceDeB, item.original, item.b, formatar);
      }
      const totalDeA = itens.reduce((s, i) => s + i.a, 0);
      const totalDeB = itens.reduce((s, i) => s + i.b, 0);
      const fonte = Math.max(8, tema.tamanhoBase - 1);
      const escreverValores = config.escreverValores !== false && rot.conteudo !== "nome";
      const conteudoDoValor = rot.conteudo === "nome" || rot.conteudo === "nomeValor" ? "valor" : rot.conteudo;
      const limiteDoNome = rot.truncar > 0 ? rot.truncar : 18;
      const textoDoRotuloDaPonta = (item, lado) => {
        const nome = truncar(item.rotulo, limiteDoNome);
        if (!escreverValores) return nome;
        const valor = textoDoRotulo(
          { ...rot, conteudo: conteudoDoValor, truncar: 0 },
          {
            valor: lado === "a" ? item.a : item.b,
            total: lado === "a" ? totalDeA : totalDeB,
            valueFormat,
            textoDoValor: lado === "a" ? item.textoA : item.textoB
          }
        );
        const texto = `${nome}${rot.conteudo === "nomeValor" ? ": " : " "}${valor}`;
        return rot.truncar > 0 ? truncar(texto, rot.truncar) : texto;
      };
      const maiorRotulo = rot.mostrar ? itens.reduce(
        (a, item) => Math.max(
          a,
          larguraAproximada(textoDoRotuloDaPonta(item, "a"), rot.tamanho),
          larguraAproximada(textoDoRotuloDaPonta(item, "b"), rot.tamanho)
        ),
        0
      ) : 0;
      const margemLateral = Math.min(largura * 0.34, maiorRotulo + 16);
      const margemDeCima = fonte + 16;
      const margemDeBaixo = 18;
      const xA = margemLateral;
      const xB = Math.max(xA + 30, largura - margemLateral);
      const cima = margemDeCima;
      const alturaUtil = Math.max(30, altura - margemDeCima - margemDeBaixo);
      const valores2 = itens.flatMap((i) => [i.a, i.b]);
      if (config.comecarEmZero === true) valores2.push(0);
      const escalaY = escalaNumerica({
        valores: valores2,
        intervalo: [cima + alturaUtil, cima],
        config: {},
        eixo: "Y"
      });
      const incluiZero = Math.min(...valores2) <= 0 && Math.max(...valores2) >= 0;
      const svg = criarSvgEl("svg", {
        pai: area,
        classe: "sl-svg",
        atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }
      });
      for (const lado of [
        { x: xA, texto: serie.rotuloDaCategoria(serie.categorias[indiceDeA]), ancora: "end" },
        { x: xB, texto: serie.rotuloDaCategoria(serie.categorias[indiceDeB]), ancora: "start" }
      ]) {
        const texto = criarSvgEl("text", {
          pai: svg,
          classe: "sl-cabecalho",
          atributos: {
            x: lado.x + (lado.ancora === "end" ? -6 : 6),
            y: fonte + 2,
            "text-anchor": lado.ancora,
            "font-size": fonte,
            fill: tema.texto
          }
        });
        definirTexto(texto, lado.texto);
      }
      for (const x of [xA, xB]) {
        criarSvgEl("line", {
          pai: svg,
          classe: "sl-linha",
          atributos: {
            x1: x,
            x2: x,
            y1: cima,
            y2: cima + alturaUtil,
            stroke: tema.borda,
            "stroke-width": 1
          }
        });
      }
      const corDeAlta = config.corDeAlta || tema.positivo;
      const corDeBaixa = config.corDeBaixa || tema.negativo;
      const porDirecao = config.corPorDirecao !== false;
      const topN = Math.max(0, Number(config.destacarMaiores) || 0);
      const criterio = config.criterioDaVariacao || "absoluta";
      const forca = (item) => criterio === "percentual" ? item.variacaoRelativa === null ? -Infinity : Math.abs(item.variacaoRelativa) : Math.abs(item.variacao);
      const destacados = new Set(
        topN > 0 ? itens.slice().sort((x, y) => forca(y) - forca(x)).slice(0, topN).map((i) => i.chave) : []
      );
      itens.forEach((item, indice) => {
        item.cor = porDirecao ? item.variacao > 0 ? corDeAlta : item.variacao < 0 ? corDeBaixa : tema.neutro : corDoItem(config, indice, item.chave);
        item.apagado = topN > 0 && !destacados.has(item.chave);
      });
      const espessura = Number(config.espessuraDaLinha) || 2;
      for (const item of itens) {
        item.yA = escalaY(item.a);
        item.yB = escalaY(item.b);
        criarSvgEl("line", {
          pai: svg,
          classe: "sl-linha",
          atributos: {
            x1: xA,
            y1: item.yA,
            x2: xB,
            y2: item.yB,
            stroke: item.cor,
            "stroke-width": item.apagado ? Math.max(0.5, espessura * 0.5) : espessura,
            opacity: item.apagado ? 0.2 : 0.9
          }
        });
        for (const ponta of [{ x: xA, y: item.yA }, { x: xB, y: item.yB }]) {
          const ponto = criarMarcadorSvg(svg, "circulo", ponta.x, ponta.y, item.apagado ? 4 : 7, {
            classe: "sl-ponto",
            fill: item.cor,
            "fill-opacity": opacidade,
            opacity: item.apagado ? 0.3 : 1,
            "data-x": ponta.x,
            "data-y": ponta.y
          });
          aplicarContorno(ponto, contorno);
        }
      }
      if (rot.mostrar) {
        const alturaDoRotulo = rot.tamanho + 2;
        const limites = { cima, baixo: cima + alturaUtil };
        for (const lado of ["a", "b"]) {
          const ordenados = itens.map((item, indice) => ({ item, indice, y: lado === "a" ? item.yA : item.yB })).sort((x, y) => x.y - y.y);
          const ajustados = rot.evitarColisao ? resolverColisoes(ordenados.map((o) => o.y), alturaDoRotulo, limites) : ordenados.map((o) => o.y);
          ordenados.forEach((o, i) => {
            const texto = criarRotuloSvg(svg, rot, {
              x: lado === "a" ? xA - 8 : xB + 8,
              y: ajustados[i],
              texto: textoDoRotuloDaPonta(o.item, lado),
              ancora: lado === "a" ? "end" : "start",
              corAutomatica: o.item.apagado ? tema.textoSuave : tema.texto
            });
            if (!texto) return;
            texto.setAttribute("class", "bl-rotulo sl-rotulo");
            if (o.item.apagado) texto.setAttribute("opacity", 0.5);
          });
        }
      }
      const subiram = itens.filter((i) => i.variacao > 0).length;
      const cairam = itens.filter((i) => i.variacao < 0).length;
      const nota = ctx.nota;
      nota.style.color = tema.textoSuave;
      definirTexto(
        nota,
        [
          `${itens.length} itens \xB7 ${subiram} subiram, ${cairam} ca\xEDram, ${itens.length - subiram - cairam} mantiveram`,
          periodosIgnorados > 0 ? `comparando o PRIMEIRO e o \xDALTIMO per\xEDodo: os ${periodosIgnorados} do meio n\xE3o aparecem` : null,
          incluiZero ? "o eixo inclui o zero" : "ATEN\xC7\xC3O: o eixo N\xC3O inclui o zero \u2014 a inclina\xE7\xE3o mostra a varia\xE7\xE3o, n\xE3o a propor\xE7\xE3o",
          `varia\xE7\xE3o medida em ${criterio === "percentual" ? "percentual" : "valor absoluto"}`,
          "para quem passou quem (e n\xE3o quanto mudou), veja o Bump Chart"
        ].filter(Boolean).join(" \xB7 ")
      );
      const tooltip = ctx.tooltip();
      const rotuloDeA = serie.rotuloDaCategoria(serie.categorias[indiceDeA]);
      const rotuloDeB = serie.rotuloDaCategoria(serie.categorias[indiceDeB]);
      const alvoDoEvento = (ev) => {
        const caixa = area.getBoundingClientRect();
        const px = ev.clientX - caixa.left;
        const py = ev.clientY - caixa.top;
        return { px, alvo: linhaMaisProxima({ itens, px, py, xA, xB }) };
      };
      const conteudoDe = (alvo) => {
        const pct = alvo.variacaoRelativa === null ? "n\xE3o existe (come\xE7ou em zero)" : `${alvo.variacaoRelativa >= 0 ? "+" : ""}${formatarPercentual(alvo.variacaoRelativa, 1)}`;
        return {
          titulo: alvo.rotulo,
          linhas: [
            { rotulo: rotuloDeA, valor: alvo.textoA, cor: alvo.cor },
            { rotulo: rotuloDeB, valor: alvo.textoB },
            { rotulo: "Varia\xE7\xE3o", valor: `${alvo.variacao >= 0 ? "+" : ""}${formatar(alvo.variacao)}` },
            { rotulo: "Varia\xE7\xE3o %", valor: pct }
          ],
          variaveis: {
            categoria: alvo.rotulo,
            serie: alvo.rotulo,
            valor: alvo.textoB,
            inicio: alvo.textoA,
            variacao: `${alvo.variacao >= 0 ? "+" : ""}${formatar(alvo.variacao)}`,
            percentual: alvo.variacaoRelativa === null ? "" : pct
          }
        };
      };
      ctx.eventos.on(area, "pointermove", (ev) => {
        if (!tooltip) return;
        const { alvo } = alvoDoEvento(ev);
        if (!alvo) {
          tooltip.esconder();
          return;
        }
        tooltip.mostrar(conteudoDe(alvo), ev.clientX, ev.clientY);
      });
      ctx.eventos.on(area, "pointerleave", () => {
        if (tooltip) tooltip.esconder();
      });
      ctx.eventos.on(area, "click", (ev) => {
        const { px, alvo } = alvoDoEvento(ev);
        if (!alvo) return;
        const indice = px - xA <= xB - px ? indiceDeA : indiceDeB;
        ctx.cliqueNoItem(ev, celulaDoPonto(ctx, serie.matriz, indice, alvo.original), conteudoDe(alvo));
      });
    },
    aoDestruir: destruirSerieTemporal
  });
  function linhaMaisProxima({ itens, px, py, xA, xB }) {
    if (px < xA - 10 || px > xB + 10) return null;
    const t = (px - xA) / Math.max(1, xB - xA);
    let melhor = null;
    let menor = Infinity;
    for (const item of itens) {
      const y = item.yA + (item.yB - item.yA) * Math.max(0, Math.min(1, t));
      const d = Math.abs(y - py);
      if (d < menor) {
        menor = d;
        melhor = item;
      }
    }
    return menor <= 14 ? melhor : null;
  }
  function resolverColisoes(posicoes, alturaMinima, limites) {
    const n = posicoes.length;
    if (!n) return [];
    const saida = posicoes.slice();
    saida[0] = Math.max(saida[0], limites.cima);
    for (let i = 1; i < n; i++) {
      saida[i] = Math.max(saida[i], saida[i - 1] + alturaMinima);
    }
    if (saida[n - 1] > limites.baixo) {
      saida[n - 1] = limites.baixo;
      for (let i = n - 2; i >= 0; i--) {
        saida[i] = Math.min(saida[i], saida[i + 1] - alturaMinima);
      }
    }
    if (saida[0] < limites.cima) {
      saida[0] = limites.cima;
      for (let i = 1; i < n; i++) {
        saida[i] = Math.max(saida[i], saida[i - 1] + alturaMinima);
      }
    }
    return saida;
  }
})();
