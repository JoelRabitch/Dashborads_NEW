/*!
 * Diagrama de Venn — visualização customizada para o Looker
 * id: diagrama_venn
 * versão: 0.1.0
 *
 * Arquivo AUTOCONTIDO: no Looker, o campo "Dependencies" deve ficar VAZIO.
 * Gerado por biblioteca/build/build.mjs — não edite este arquivo à mão;
 * edite src/charts/diagrama_venn/index.js e rode `npm run build`.
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
      var fill = specifier.fill, align = specifier.align, sign2 = specifier.sign, symbol = specifier.symbol, zero2 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
      if (type === "n") comma = true, type = "g";
      else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
      if (zero2 || fill === "0" && align === "=") zero2 = true, fill = "0", align = "=";
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
          if (valueNegative && +value === 0 && sign2 !== "+") valueNegative = false;
          valuePrefix = (valueNegative ? sign2 === "(" ? sign2 : minus : sign2 === "-" || sign2 === "(" ? "" : sign2) + valuePrefix;
          valueSuffix = (type === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign2 === "(" ? ")" : "");
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
        if (comma && !zero2) value = group(value, Infinity);
        var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
        if (comma && zero2) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
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
  function criarFormatadorNumerico(opcoes2 = {}) {
    const {
      estilo = "auto",
      casas = 2,
      prefixo = "",
      sufixo = "",
      separadorDeMilhar = true,
      simboloDaMoeda = "R$ "
    } = opcoes2;
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
    function extrairSerie(opcoes2 = {}) {
      const {
        dimensao = dimensoes[0] && dimensoes[0].nome,
        medida = medidas[0] && medidas[0].nome,
        limite = Infinity,
        tratamentoDeNulos = "omitir"
      } = opcoes2;
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

  // node_modules/d3-interpolate/src/piecewise.js
  function piecewise(interpolate, values) {
    if (values === void 0) values = interpolate, interpolate = value_default;
    var i = 0, n = values.length - 1, v = values[0], I = new Array(n < 0 ? 0 : n);
    while (i < n) I[i] = interpolate(v, v = values[++i]);
    return function(t) {
      var i2 = Math.max(0, Math.min(n - 1, Math.floor(t *= n)));
      return I[i2](t - i2);
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
  function interpoladorContinuo(nome) {
    const e = ESCALAS_CONTINUAS[nome] || ESCALAS_CONTINUAS.azul;
    return e.interpolador;
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
  function textoLegivelSobre(corDeFundo, tema) {
    const rgb2 = corParaRgb(corDeFundo);
    if (!rgb2) return tema ? tema.texto : "#1F2937";
    const lum = (0.2126 * rgb2[0] + 0.7152 * rgb2[1] + 0.0722 * rgb2[2]) / 255;
    return lum > 0.58 ? "#111827" : "#FFFFFF";
  }
  function corParaRgb(cor) {
    if (typeof cor !== "string") return null;
    const t = cor.trim();
    let m = /^#([0-9a-f]{3})$/i.exec(t);
    if (m) {
      const h = m[1];
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    }
    m = /^#([0-9a-f]{6})$/i.exec(t);
    if (m) {
      const h = m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(t);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    return null;
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
  function blocoDeCores(opcoes2 = {}) {
    const {
      comPaleta = true,
      comEscalaPorValor = true,
      comOpacidade = true,
      comContorno = true,
      opacidadePadrao = 1,
      secao = "Cores"
    } = opcoes2;
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
  function blocoDeRotulos(opcoes2 = {}) {
    const { secao = "R\xF3tulos", padraoVisivel = true, comPosicao = true, comValor = true } = opcoes2;
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
  function blocoDeLegenda(opcoes2 = {}) {
    const { secao = "Legenda", padraoVisivel = true } = opcoes2;
    return {
      mostrarLegenda: {
        type: "boolean",
        label: "Mostrar legenda",
        section: secao,
        default: padraoVisivel
      },
      posicaoDaLegenda: {
        type: "string",
        label: "Posi\xE7\xE3o da legenda",
        section: secao,
        display: "select",
        default: "direita",
        values: listaDeValores([
          { rotulo: "Direita", valor: "direita" },
          { rotulo: "Esquerda", valor: "esquerda" },
          { rotulo: "Acima", valor: "acima" },
          { rotulo: "Abaixo", valor: "abaixo" }
        ])
      },
      legendaInterativa: {
        type: "boolean",
        label: "Clicar na legenda liga/desliga a s\xE9rie",
        section: secao,
        default: true
      },
      mostrarValoresNaLegenda: {
        type: "boolean",
        label: "Mostrar valores na legenda",
        section: secao,
        default: false
      },
      tamanhoDaLegenda: {
        type: "number",
        label: "Tamanho do texto da legenda (px)",
        section: secao,
        display: "range",
        min: 8,
        max: 20,
        step: 1,
        default: 11
      }
    };
  }
  function blocoDeTooltip(opcoes2 = {}) {
    const { secao = "Intera\xE7\xE3o" } = opcoes2;
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
  function blocoDeAnimacao(opcoes2 = {}) {
    const { secao = "Anima\xE7\xE3o", padraoAtiva = true, duracaoPadrao = 600 } = opcoes2;
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
  function blocoDeInteracao(opcoes2 = {}) {
    const {
      secao = "Intera\xE7\xE3o",
      comZoom = true,
      comBrush = false,
      comBusca = false,
      comSelecao = true
    } = opcoes2;
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
  function blocoDeTema(opcoes2 = {}) {
    const { secao = "Tema" } = opcoes2;
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
  function blocoAvancado(opcoes2 = {}) {
    const { secao = "Avan\xE7ado" } = opcoes2;
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
  function organizarAbas(opcoes2) {
    const itens = [];
    let i = 0;
    for (const [id, original] of Object.entries(opcoes2 || {})) {
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
  function opcoesDeCorPorItem(itens, opcoes2 = {}) {
    const { prefixo = "cor_", secao = "Cores", cores = [] } = opcoes2;
    const saida = {};
    itens.forEach((item, i) => {
      saida[`${prefixo}${sanitizarChave(item.chave)}`] = {
        type: "string",
        label: `Cor \u2014 ${item.rotulo}`,
        section: secao,
        display: "color",
        default: cores[i % Math.max(1, cores.length)] || "#4276BE"
      };
    });
    return saida;
  }
  function sanitizarChave(texto) {
    return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  }
  function normalizarConfig(config, opcoes2) {
    const saida = Object.assign({}, config || {});
    for (const [chave, opcao] of Object.entries(opcoes2 || {})) {
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
  function compararChaves(config, opcoes2) {
    const registradas = Object.keys(opcoes2 || {});
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
  function criarEl(tag, opcoes2 = {}) {
    const el = document.createElement(tag);
    if (opcoes2.classe) el.className = opcoes2.classe;
    if (opcoes2.texto !== void 0) definirTexto(el, opcoes2.texto);
    if (opcoes2.estilos) aplicarEstilos(el, opcoes2.estilos);
    if (opcoes2.atributos) aplicarAtributos(el, opcoes2.atributos);
    if (opcoes2.pai) opcoes2.pai.appendChild(el);
    return el;
  }
  function criarSvgEl(tag, opcoes2 = {}) {
    const el = document.createElementNS(NS_SVG, tag);
    if (opcoes2.classe) el.setAttribute("class", opcoes2.classe);
    if (opcoes2.texto !== void 0) definirTexto(el, opcoes2.texto);
    if (opcoes2.estilos) aplicarEstilos(el, opcoes2.estilos);
    if (opcoes2.atributos) aplicarAtributos(el, opcoes2.atributos);
    if (opcoes2.pai) opcoes2.pai.appendChild(el);
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
      on(alvo, tipo, handler, opcoes2) {
        if (!alvo || !alvo.addEventListener) return;
        alvo.addEventListener(tipo, handler, opcoes2);
        registros.push({ alvo, tipo, handler, opcoes: opcoes2 });
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
  function linhasDoTexto(texto, larguraDisponivel, tamanho = 12, opcoes2 = {}) {
    const s = String(texto != null ? texto : "").trim();
    if (!s) return 0;
    if (!(larguraDisponivel > 0)) return 1;
    const espaco = larguraDoTexto(" ", tamanho, opcoes2);
    let linhas = 1;
    let atual = 0;
    for (const palavra of s.split(/\s+/)) {
      const w = larguraDoTexto(palavra, tamanho, opcoes2);
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
    function ouvir(alvo, evento, fn, opcoes2) {
      if (!alvo || typeof alvo.addEventListener !== "function") return;
      alvo.addEventListener(evento, fn, opcoes2);
      removedores.push(() => alvo.removeEventListener(evento, fn, opcoes2));
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
    const opcoes2 = organizarAbas(
      Object.assign({}, opcoesDeAnimacaoPadrao(), opcoesDeclaradas, OPCOES_DE_AVISO, opcoesDoCabecalho())
    );
    const definicao = {
      id,
      label,
      options: opcoes2,
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
            declaracao: { id, label, opcoes: opcoes2, exigencia, opcoesDinamicas, render, aoDestruir, animacaoPropria, cabecalhoProprio },
            data,
            element,
            config,
            queryResponse,
            details
          });
        } catch (erro) {
          try {
            const ponte = criarPonte(this, opcoes2);
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
    const { id, opcoes: opcoes2, exigencia, opcoesDinamicas, render, animacaoPropria, cabecalhoProprio } = declaracao;
    const ponte = criarPonte(this, opcoes2);
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
  function larguraDoTexto2(texto, tamanho) {
    return String(texto || "").length * tamanho * 0.58;
  }
  function esconderColisoes(caixas, rot) {
    if (!rot || !rot.evitarColisao) return 0;
    const mantidas = [];
    let escondidos = 0;
    for (const c of caixas) {
      if (!c || !c.el) continue;
      const colide = mantidas.some(
        (m) => Math.abs(m.x - c.x) * 2 < m.largura + c.largura && Math.abs(m.y - c.y) * 2 < m.altura + c.altura
      );
      if (colide) {
        c.el.setAttribute("display", "none");
        if (c.el.style) c.el.style.display = "none";
        escondidos += 1;
      } else {
        mantidas.push(c);
      }
    }
    return escondidos;
  }

  // node_modules/d3-shape/src/math.js
  var epsilon = 1e-12;
  var pi = Math.PI;
  var halfPi = pi / 2;
  var tau = 2 * pi;

  // node_modules/d3-shape/src/curve/linear.js
  function Linear(context) {
    this._context = context;
  }
  Linear.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
        // falls through
        default:
          this._context.lineTo(x, y);
          break;
      }
    }
  };
  function linear_default(context) {
    return new Linear(context);
  }

  // node_modules/d3-shape/src/curve/basis.js
  function point(that, x, y) {
    that._context.bezierCurveTo(
      (2 * that._x0 + that._x1) / 3,
      (2 * that._y0 + that._y1) / 3,
      (that._x0 + 2 * that._x1) / 3,
      (that._y0 + 2 * that._y1) / 3,
      (that._x0 + 4 * that._x1 + x) / 6,
      (that._y0 + 4 * that._y1 + y) / 6
    );
  }
  function Basis(context) {
    this._context = context;
  }
  Basis.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._y0 = this._y1 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 3:
          point(this, this._x1, this._y1);
        // falls through
        case 2:
          this._context.lineTo(this._x1, this._y1);
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
          this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
        // falls through
        default:
          point(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
    }
  };
  function basis_default2(context) {
    return new Basis(context);
  }

  // node_modules/d3-shape/src/curve/cardinal.js
  function point2(that, x, y) {
    that._context.bezierCurveTo(
      that._x1 + that._k * (that._x2 - that._x0),
      that._y1 + that._k * (that._y2 - that._y0),
      that._x2 + that._k * (that._x1 - x),
      that._y2 + that._k * (that._y1 - y),
      that._x2,
      that._y2
    );
  }
  function Cardinal(context, tension) {
    this._context = context;
    this._k = (1 - tension) / 6;
  }
  Cardinal.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 2:
          this._context.lineTo(this._x2, this._y2);
          break;
        case 3:
          point2(this, this._x1, this._y1);
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          this._x1 = x, this._y1 = y;
          break;
        case 2:
          this._point = 3;
        // falls through
        default:
          point2(this, x, y);
          break;
      }
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var cardinal_default = (function custom(tension) {
    function cardinal(context) {
      return new Cardinal(context, tension);
    }
    cardinal.tension = function(tension2) {
      return custom(+tension2);
    };
    return cardinal;
  })(0);

  // node_modules/d3-shape/src/curve/catmullRom.js
  function point3(that, x, y) {
    var x1 = that._x1, y1 = that._y1, x2 = that._x2, y2 = that._y2;
    if (that._l01_a > epsilon) {
      var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a, n = 3 * that._l01_a * (that._l01_a + that._l12_a);
      x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
      y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
    }
    if (that._l23_a > epsilon) {
      var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a, m = 3 * that._l23_a * (that._l23_a + that._l12_a);
      x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
      y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
    }
    that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
  }
  function CatmullRom(context, alpha) {
    this._context = context;
    this._alpha = alpha;
  }
  CatmullRom.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
      this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 2:
          this._context.lineTo(this._x2, this._y2);
          break;
        case 3:
          this.point(this._x2, this._y2);
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      if (this._point) {
        var x23 = this._x2 - x, y23 = this._y2 - y;
        this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
      }
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
        // falls through
        default:
          point3(this, x, y);
          break;
      }
      this._l01_a = this._l12_a, this._l12_a = this._l23_a;
      this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };
  var catmullRom_default = (function custom2(alpha) {
    function catmullRom(context) {
      return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
    }
    catmullRom.alpha = function(alpha2) {
      return custom2(+alpha2);
    };
    return catmullRom;
  })(0.5);

  // node_modules/d3-shape/src/curve/monotone.js
  function sign(x) {
    return x < 0 ? -1 : 1;
  }
  function slope3(that, x2, y2) {
    var h0 = that._x1 - that._x0, h1 = x2 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0), p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }
  function slope2(that, t) {
    var h = that._x1 - that._x0;
    return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
  }
  function point4(that, t0, t1) {
    var x0 = that._x0, y0 = that._y0, x1 = that._x1, y1 = that._y1, dx = (x1 - x0) / 3;
    that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
  }
  function MonotoneX(context) {
    this._context = context;
  }
  MonotoneX.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 2:
          this._context.lineTo(this._x1, this._y1);
          break;
        case 3:
          point4(this, this._t0, slope2(this, this._t0));
          break;
      }
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      var t1 = NaN;
      x = +x, y = +y;
      if (x === this._x1 && y === this._y1) return;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
          break;
        case 2:
          this._point = 3;
          point4(this, slope2(this, t1 = slope3(this, x, y)), t1);
          break;
        default:
          point4(this, this._t0, t1 = slope3(this, x, y));
          break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
      this._t0 = t1;
    }
  };
  function MonotoneY(context) {
    this._context = new ReflectContext(context);
  }
  (MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
    MonotoneX.prototype.point.call(this, y, x);
  };
  function ReflectContext(context) {
    this._context = context;
  }
  ReflectContext.prototype = {
    moveTo: function(x, y) {
      this._context.moveTo(y, x);
    },
    closePath: function() {
      this._context.closePath();
    },
    lineTo: function(x, y) {
      this._context.lineTo(y, x);
    },
    bezierCurveTo: function(x1, y1, x2, y2, x, y) {
      this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
    }
  };
  function monotoneX(context) {
    return new MonotoneX(context);
  }
  function monotoneY(context) {
    return new MonotoneY(context);
  }

  // node_modules/d3-shape/src/curve/natural.js
  function Natural(context) {
    this._context = context;
  }
  Natural.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x = [];
      this._y = [];
    },
    lineEnd: function() {
      var x = this._x, y = this._y, n = x.length;
      if (n) {
        this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
        if (n === 2) {
          this._context.lineTo(x[1], y[1]);
        } else {
          var px = controlPoints(x), py = controlPoints(y);
          for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
            this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
          }
        }
      }
      if (this._line || this._line !== 0 && n === 1) this._context.closePath();
      this._line = 1 - this._line;
      this._x = this._y = null;
    },
    point: function(x, y) {
      this._x.push(+x);
      this._y.push(+y);
    }
  };
  function controlPoints(x) {
    var i, n = x.length - 1, m, a = new Array(n), b = new Array(n), r = new Array(n);
    a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
    for (i = 1; i < n - 1; ++i) a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
    a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
    for (i = 1; i < n; ++i) m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
    a[n - 1] = r[n - 1] / b[n - 1];
    for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
    b[n - 1] = (x[n] + a[n - 1]) / 2;
    for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
    return [a, b];
  }
  function natural_default(context) {
    return new Natural(context);
  }

  // node_modules/d3-shape/src/curve/step.js
  function Step(context, t) {
    this._context = context;
    this._t = t;
  }
  Step.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x = this._y = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
      if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
      if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2;
        // falls through
        default: {
          if (this._t <= 0) {
            this._context.lineTo(this._x, y);
            this._context.lineTo(x, y);
          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;
            this._context.lineTo(x1, this._y);
            this._context.lineTo(x1, y);
          }
          break;
        }
      }
      this._x = x, this._y = y;
    }
  };
  function step_default(context) {
    return new Step(context, 0.5);
  }
  function stepAfter(context) {
    return new Step(context, 1);
  }

  // src/core/shapes.js
  var CURVAS = {
    linear: linear_default,
    monotone: monotoneX,
    monotoneY,
    basis: basis_default2,
    catmull: catmullRom_default.alpha(0.5),
    cardinal: cardinal_default,
    natural: natural_default,
    step: step_default,
    stepAfter
  };
  function tracejadoPorEstilo(estilo, espessura = 1) {
    if (estilo === "tracejado") return `${espessura * 4},${espessura * 3}`;
    if (estilo === "pontilhado") return `${espessura},${espessura * 2}`;
    return null;
  }

  // src/core/cores.js
  function paletaDoConfig(config = {}) {
    const cores = coresDaPaleta(config.paleta).slice();
    if (lerBooleano(config.inverterPaleta, false)) cores.reverse();
    return cores;
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

  // node_modules/internmap/src/index.js
  var InternMap = class extends Map {
    constructor(entries, key = keyof) {
      super();
      Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key } });
      if (entries != null) for (const [key2, value] of entries) this.set(key2, value);
    }
    get(key) {
      return super.get(intern_get(this, key));
    }
    has(key) {
      return super.has(intern_get(this, key));
    }
    set(key, value) {
      return super.set(intern_set(this, key), value);
    }
    delete(key) {
      return super.delete(intern_delete(this, key));
    }
  };
  function intern_get({ _intern, _key }, value) {
    const key = _key(value);
    return _intern.has(key) ? _intern.get(key) : value;
  }
  function intern_set({ _intern, _key }, value) {
    const key = _key(value);
    if (_intern.has(key)) return _intern.get(key);
    _intern.set(key, value);
    return value;
  }
  function intern_delete({ _intern, _key }, value) {
    const key = _key(value);
    if (_intern.has(key)) {
      value = _intern.get(key);
      _intern.delete(key);
    }
    return value;
  }
  function keyof(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
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

  // node_modules/d3-array/src/max.js
  function max(values, valueof) {
    let max2;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null && (max2 < value || max2 === void 0 && value >= value)) {
          max2 = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (max2 < value || max2 === void 0 && value >= value)) {
          max2 = value;
        }
      }
    }
    return max2;
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
  function initInterpolator(domain, interpolator) {
    switch (arguments.length) {
      case 0:
        break;
      case 1: {
        if (typeof domain === "function") this.interpolator(domain);
        else this.range(domain);
        break;
      }
      default: {
        this.domain(domain);
        if (typeof interpolator === "function") this.interpolator(interpolator);
        else this.range(interpolator);
        break;
      }
    }
    return this;
  }

  // node_modules/d3-scale/src/ordinal.js
  var implicit = /* @__PURE__ */ Symbol("implicit");
  function ordinal() {
    var index = new InternMap(), domain = [], range = [], unknown = implicit;
    function scale(d) {
      let i = index.get(d);
      if (i === void 0) {
        if (unknown !== implicit) return unknown;
        index.set(d, i = domain.push(d) - 1);
      }
      return range[i % range.length];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [], index = new InternMap();
      for (const value of _) {
        if (index.has(value)) continue;
        index.set(value, domain.push(value) - 1);
      }
      return scale;
    };
    scale.range = function(_) {
      return arguments.length ? (range = Array.from(_), scale) : range.slice();
    };
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    scale.copy = function() {
      return ordinal(domain, range).unknown(unknown);
    };
    initRange.apply(scale, arguments);
    return scale;
  }

  // node_modules/d3-scale/src/continuous.js
  function identity(x) {
    return x;
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

  // node_modules/d3-scale/src/sequential.js
  function transformer() {
    var x0 = 0, x1 = 1, t0, t1, k10, transform, interpolator = identity, clamp = false, unknown;
    function scale(x) {
      return x == null || isNaN(x = +x) ? unknown : interpolator(k10 === 0 ? 0.5 : (x = (transform(x) - t0) * k10, clamp ? Math.max(0, Math.min(1, x)) : x));
    }
    scale.domain = function(_) {
      return arguments.length ? ([x0, x1] = _, t0 = transform(x0 = +x0), t1 = transform(x1 = +x1), k10 = t0 === t1 ? 0 : 1 / (t1 - t0), scale) : [x0, x1];
    };
    scale.clamp = function(_) {
      return arguments.length ? (clamp = !!_, scale) : clamp;
    };
    scale.interpolator = function(_) {
      return arguments.length ? (interpolator = _, scale) : interpolator;
    };
    function range(interpolate) {
      return function(_) {
        var r0, r1;
        return arguments.length ? ([r0, r1] = _, interpolator = interpolate(r0, r1), scale) : [interpolator(0), interpolator(1)];
      };
    }
    scale.range = range(value_default);
    scale.rangeRound = range(round_default);
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    return function(t) {
      transform = t, t0 = t(x0), t1 = t(x1), k10 = t0 === t1 ? 0 : 1 / (t1 - t0);
      return scale;
    };
  }
  function copy(source, target) {
    return target.domain(source.domain()).interpolator(source.interpolator()).clamp(source.clamp()).unknown(source.unknown());
  }
  function sequential() {
    var scale = linearish(transformer()(identity));
    scale.copy = function() {
      return copy(scale, sequential());
    };
    return initInterpolator.apply(scale, arguments);
  }

  // node_modules/d3-scale/src/diverging.js
  function transformer2() {
    var x0 = 0, x1 = 0.5, x2 = 1, s = 1, t0, t1, t2, k10, k21, interpolator = identity, transform, clamp = false, unknown;
    function scale(x) {
      return isNaN(x = +x) ? unknown : (x = 0.5 + ((x = +transform(x)) - t1) * (s * x < s * t1 ? k10 : k21), interpolator(clamp ? Math.max(0, Math.min(1, x)) : x));
    }
    scale.domain = function(_) {
      return arguments.length ? ([x0, x1, x2] = _, t0 = transform(x0 = +x0), t1 = transform(x1 = +x1), t2 = transform(x2 = +x2), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1), s = t1 < t0 ? -1 : 1, scale) : [x0, x1, x2];
    };
    scale.clamp = function(_) {
      return arguments.length ? (clamp = !!_, scale) : clamp;
    };
    scale.interpolator = function(_) {
      return arguments.length ? (interpolator = _, scale) : interpolator;
    };
    function range(interpolate) {
      return function(_) {
        var r0, r1, r2;
        return arguments.length ? ([r0, r1, r2] = _, interpolator = piecewise(interpolate, [r0, r1, r2]), scale) : [interpolator(0), interpolator(0.5), interpolator(1)];
      };
    }
    scale.range = range(value_default);
    scale.rangeRound = range(round_default);
    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };
    return function(t) {
      transform = t, t0 = t(x0), t1 = t(x1), t2 = t(x2), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1), s = t1 < t0 ? -1 : 1;
      return scale;
    };
  }
  function diverging() {
    var scale = linearish(transformer2()(identity));
    scale.copy = function() {
      return copy(scale, diverging());
    };
    return initInterpolator.apply(scale, arguments);
  }

  // src/core/scales.js
  function escalaDeCores({ chaves = [], valores: valores2 = [], config = {}, tema }) {
    const modo = config.modoDeCor || "categoria";
    if (modo === "unica") {
      const cor = config.corUnica || tema && tema.destaque || "#4276BE";
      return {
        tipo: "unica",
        cor: () => cor,
        dominio: [],
        legenda: []
      };
    }
    if (modo === "valor") {
      const numeros = valores2.filter((v) => Number.isFinite(v));
      let d0 = config.limiteDeCorAutomatico === false ? numeroOuIndefinido(config.limiteDeCorMinimo) : void 0;
      let d1 = config.limiteDeCorAutomatico === false ? numeroOuIndefinido(config.limiteDeCorMaximo) : void 0;
      if (d0 === void 0) d0 = numeros.length ? min(numeros) : 0;
      if (d1 === void 0) d1 = numeros.length ? max(numeros) : 1;
      if (d0 === d1) d1 = d0 + 1;
      let interpolador;
      if (config.escalaDeCorPersonalizada) {
        const cores2 = [config.corMinima || "#F1F5F9", config.corMedia || "#93C5FD", config.corMaxima || "#1D4ED8"];
        const unicas = cores2[0] === cores2[1] ? [cores2[0], cores2[2]] : cores2;
        interpolador = rgbBasis(unicas);
      } else {
        interpolador = interpoladorContinuo(config.escalaDeCor);
      }
      const meio = (d0 + d1) / 2;
      const escala2 = config.escalaDeCorPersonalizada ? diverging(interpolador).domain([d0, meio, d1]) : sequential(interpolador).domain(config.inverterPaleta ? [d1, d0] : [d0, d1]);
      return {
        tipo: "valor",
        cor: (valor) => Number.isFinite(valor) ? escala2(valor) : tema ? tema.neutro : "#94A3B8",
        dominio: [d0, d1],
        legenda: [
          { valor: d0, cor: escala2(d0) },
          { valor: meio, cor: escala2(meio) },
          { valor: d1, cor: escala2(d1) }
        ]
      };
    }
    let cores = coresDaPaleta(config.paleta).slice();
    if (config.inverterPaleta) cores.reverse();
    const escala = ordinal().domain(chaves).range(cores);
    return {
      tipo: "categoria",
      cor: (chave) => escala(chave),
      dominio: chaves,
      legenda: chaves.map((c) => ({ chave: c, cor: escala(c) }))
    };
  }
  function numeroOuIndefinido(v) {
    if (v === null || v === void 0 || v === "") return void 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : void 0;
  }

  // src/core/legend.js
  var CSS_LEGENDA = `
.bl-legenda{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;font-size:11px;
  padding:4px 8px;user-select:none;}
.bl-legenda.bl-vertical{flex-direction:column;align-items:flex-start;flex-wrap:nowrap;overflow:auto;}
.bl-legenda-item{display:flex;align-items:center;gap:5px;cursor:default;line-height:1.4;}
.bl-legenda-item.bl-clicavel{cursor:pointer;}
.bl-legenda-item.bl-desligado{opacity:.35;text-decoration:line-through;}
.bl-legenda-chip{width:10px;height:10px;border-radius:2px;flex:0 0 auto;}
.bl-legenda-valor{opacity:.7;margin-left:3px;}
.bl-legenda-gradiente{height:10px;border-radius:3px;flex:1 1 120px;min-width:100px;}
.bl-legenda-escala{display:flex;align-items:center;gap:8px;width:100%;}
`;
  function desenharLegenda({
    hospedeiro,
    itens = [],
    config = {},
    tema,
    desligados = /* @__PURE__ */ new Set(),
    aoAlternar = null,
    escalaContinua = null,
    eventos = null
  }) {
    if (config.mostrarLegenda === false) return { largura: 0, altura: 0, elemento: null };
    if (!hospedeiro.querySelector('style[data-estilo="bl-legenda"]')) {
      const style = document.createElement("style");
      style.setAttribute("data-estilo", "bl-legenda");
      style.textContent = CSS_LEGENDA;
      hospedeiro.appendChild(style);
    }
    const posicao = config.posicaoDaLegenda || "direita";
    const vertical = posicao === "direita" || posicao === "esquerda";
    const el = criarEl("div", { classe: `bl-legenda${vertical ? " bl-vertical" : ""}`, pai: hospedeiro });
    el.style.color = tema.texto;
    el.style.fontSize = `${Number(config.tamanhoDaLegenda) || 11}px`;
    el.style.fontFamily = tema.fonte;
    if (escalaContinua && escalaContinua.tipo === "valor" && escalaContinua.legenda) {
      const caixa = criarEl("div", { classe: "bl-legenda-escala", pai: el });
      const paradas = escalaContinua.legenda;
      const formatar = escalaContinua.formatar || ((v) => String(Math.round(v)));
      criarEl("span", { texto: formatar(paradas[0].valor), pai: caixa });
      const barra = criarEl("div", { classe: "bl-legenda-gradiente", pai: caixa });
      const cores = paradas.map((p) => p.cor).join(", ");
      barra.style.background = `linear-gradient(to right, ${cores})`;
      criarEl("span", { texto: formatar(paradas[paradas.length - 1].valor), pai: caixa });
      return medirLegenda(el, vertical);
    }
    const interativa = config.legendaInterativa !== false && typeof aoAlternar === "function";
    const mostrarValores = !!config.mostrarValoresNaLegenda;
    for (const item of itens) {
      const desligado = desligados.has(item.chave);
      const linha = criarEl("div", {
        classe: `bl-legenda-item${interativa ? " bl-clicavel" : ""}${desligado ? " bl-desligado" : ""}`,
        pai: el
      });
      const chip = criarEl("span", { classe: "bl-legenda-chip", pai: linha });
      chip.style.background = item.cor;
      criarEl("span", { texto: item.rotulo, pai: linha });
      if (mostrarValores && item.valor !== void 0) {
        criarEl("span", { classe: "bl-legenda-valor", texto: item.valor, pai: linha });
      }
      if (interativa) {
        linha.setAttribute("role", "button");
        linha.setAttribute("tabindex", "0");
        const alternar = () => {
          const novo = new Set(desligados);
          if (novo.has(item.chave)) novo.delete(item.chave);
          else novo.add(item.chave);
          aoAlternar(item.chave, novo);
        };
        if (eventos) {
          eventos.on(linha, "click", alternar);
          eventos.on(linha, "keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              alternar();
            }
          });
        } else {
          linha.addEventListener("click", alternar);
        }
      }
    }
    return medirLegenda(el, vertical);
  }
  function medirLegenda(el, vertical) {
    const largura = vertical ? el.offsetWidth || 120 : 0;
    const altura = vertical ? 0 : el.offsetHeight || 24;
    return { largura, altura, elemento: el };
  }
  function criarLayoutComLegenda(raiz, config = {}) {
    limpar(raiz);
    const posicao = config.posicaoDaLegenda || "direita";
    const mostrar = config.mostrarLegenda !== false;
    const wrapper = criarEl("div", { pai: raiz });
    wrapper.style.display = "flex";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";
    let direcao = "row";
    if (posicao === "acima") direcao = "column-reverse";
    else if (posicao === "abaixo") direcao = "column";
    else if (posicao === "esquerda") direcao = "row-reverse";
    wrapper.style.flexDirection = direcao;
    const areaGrafico = criarEl("div", { pai: wrapper });
    areaGrafico.style.flex = "1 1 auto";
    areaGrafico.style.position = "relative";
    areaGrafico.style.minWidth = "0";
    areaGrafico.style.minHeight = "0";
    const areaLegenda = criarEl("div", { pai: wrapper });
    areaLegenda.style.flex = "0 0 auto";
    areaLegenda.style.display = mostrar ? "block" : "none";
    if (posicao === "direita" || posicao === "esquerda") {
      areaLegenda.style.maxWidth = "38%";
      areaLegenda.style.maxHeight = "100%";
      areaLegenda.style.overflow = "auto";
    } else {
      areaLegenda.style.maxHeight = "35%";
      areaLegenda.style.overflow = "auto";
    }
    return { areaGrafico, areaLegenda };
  }

  // src/charts/diagrama_venn/geometria.js
  var LAYOUTS = {
    1: [{ cx: 0, cy: 0, rx: 0.62, ry: 0.62, rotacao: 0 }],
    2: [
      { cx: -0.26, cy: 0, rx: 0.52, ry: 0.52, rotacao: 0 },
      { cx: 0.26, cy: 0, rx: 0.52, ry: 0.52, rotacao: 0 }
    ],
    3: [
      { cx: 0, cy: -0.28, rx: 0.5, ry: 0.5, rotacao: 0 },
      { cx: -0.26, cy: 0.17, rx: 0.5, ry: 0.5, rotacao: 0 },
      { cx: 0.26, cy: 0.17, rx: 0.5, ry: 0.5, rotacao: 0 }
    ],
    // Venn de 4 elipses congruentes. Estes números saíram de uma busca que
    // maximizou a MENOR região (conferida por amostragem): com 4 elipses
    // sempre sobram duas regiões muito finas, e o objetivo foi deixá-las o
    // menos minúsculas possível.
    4: [
      { cx: -0.18, cy: -0.06, rx: 0.74, ry: 0.46, rotacao: -40 },
      { cx: -0.075, cy: -0.156, rx: 0.74, ry: 0.46, rotacao: -40 },
      { cx: 0.075, cy: -0.156, rx: 0.74, ry: 0.46, rotacao: 40 },
      { cx: 0.18, cy: -0.06, rx: 0.74, ry: 0.46, rotacao: 40 }
    ],
    // Venn de 5 elipses congruentes (construção clássica de Grünbaum).
    // Os números vêm da caixa unitária tradicional e foram conferidos por
    // amostragem: este layout produz TODAS as 31 regiões. Mexer neles sem
    // repetir a conferência faz regiões sumirem silenciosamente.
    5: montarVenn5()
  };
  function montarVenn5() {
    const cru = [
      [0.428, 0.449, 155],
      [0.469, 0.543, 82],
      [0.558, 0.523, 10],
      [0.578, 0.432, 118],
      [0.489, 0.383, 46]
    ];
    const encolhe = 0.92;
    return cru.map(([x, y, angulo]) => ({
      cx: (x - 0.5) * 2 * encolhe,
      cy: -(y - 0.5) * 2 * encolhe,
      rx: 0.87 * encolhe,
      ry: 0.5 * encolhe,
      rotacao: -angulo
    }));
  }
  function layoutDeConjuntos(quantidade, { largura, altura, margem = 10 }) {
    const base = LAYOUTS[Math.min(5, Math.max(1, quantidade))] || LAYOUTS[3];
    const escala = Math.min(largura - margem * 2, altura - margem * 2) / 2;
    const cx = largura / 2;
    const cy = altura / 2;
    return base.map((e) => ({
      cx: cx + e.cx * escala,
      cy: cy + e.cy * escala,
      rx: e.rx * escala,
      ry: e.ry * escala,
      rotacao: e.rotacao
    }));
  }
  function dentroDaElipse(x, y, elipse) {
    const rad = -elipse.rotacao * Math.PI / 180;
    const dx = x - elipse.cx;
    const dy = y - elipse.cy;
    const px = dx * Math.cos(rad) - dy * Math.sin(rad);
    const py = dx * Math.sin(rad) + dy * Math.cos(rad);
    return px * px / (elipse.rx * elipse.rx) + py * py / (elipse.ry * elipse.ry) <= 1;
  }
  function mascaraDoPonto(x, y, elipses) {
    let mascara = 0;
    for (let i = 0; i < elipses.length; i++) {
      if (dentroDaElipse(x, y, elipses[i])) mascara |= 1 << i;
    }
    return mascara;
  }
  function posicoesDasRegioes(elipses, { largura, altura, passos = 160 }) {
    const passoX = largura / passos;
    const passoY = altura / passos;
    const grade = new Int32Array(passos * passos);
    const acumulado = /* @__PURE__ */ new Map();
    for (let j = 0; j < passos; j++) {
      const y = (j + 0.5) * passoY;
      for (let i = 0; i < passos; i++) {
        const x = (i + 0.5) * passoX;
        const mascara = mascaraDoPonto(x, y, elipses);
        grade[j * passos + i] = mascara;
        if (!mascara) continue;
        let acc = acumulado.get(mascara);
        if (!acc) {
          acc = { somaX: 0, somaY: 0, quantidade: 0 };
          acumulado.set(mascara, acc);
        }
        acc.somaX += x;
        acc.somaY += y;
        acc.quantidade += 1;
      }
    }
    const saida = /* @__PURE__ */ new Map();
    const areaDaCelula = passoX * passoY;
    for (const [mascara, acc] of acumulado) {
      const centroX = acc.somaX / acc.quantidade;
      const centroY = acc.somaY / acc.quantidade;
      const area = acc.quantidade * areaDaCelula;
      const ponto = pontoMaisInterno(grade, mascara, passos);
      if (!ponto) {
        saida.set(mascara, { x: centroX, y: centroY, area, folgaX: 0, folgaY: 0 });
        continue;
      }
      const raio = raioLivre(grade, mascara, passos, ponto.i, ponto.j);
      saida.set(mascara, {
        x: (ponto.i + 0.5) * passoX,
        y: (ponto.j + 0.5) * passoY,
        area,
        // Quanto dá para andar em cada direção sem sair da região: é isso que
        // decide se o número cabe aqui dentro.
        folgaX: raio * passoX,
        folgaY: raio * passoY
      });
    }
    return saida;
  }
  function raioLivre(grade, mascara, passos, i, j, limite = 40) {
    let raio = 0;
    while (raio < limite) {
      const proximo = raio + 1;
      if (i - proximo < 0 || i + proximo >= passos || j - proximo < 0 || j + proximo >= passos) break;
      let encostou = false;
      for (let k = -proximo; k <= proximo && !encostou; k++) {
        if (grade[(j - proximo) * passos + (i + k)] !== mascara || grade[(j + proximo) * passos + (i + k)] !== mascara || grade[(j + k) * passos + (i - proximo)] !== mascara || grade[(j + k) * passos + (i + proximo)] !== mascara) {
          encostou = true;
        }
      }
      if (encostou) break;
      raio = proximo;
    }
    return raio;
  }
  function pontoMaisInterno(grade, mascara, passos) {
    let melhorRaio = -1;
    let melhor = null;
    for (let j = 0; j < passos; j++) {
      for (let i = 0; i < passos; i++) {
        if (grade[j * passos + i] !== mascara) continue;
        const raio = raioLivre(grade, mascara, passos, i, j, melhorRaio + 2);
        if (raio > melhorRaio) {
          melhorRaio = raio;
          melhor = { i, j };
        }
      }
    }
    return melhor;
  }
  function caminhoDaElipse(e) {
    return `M ${e.cx - e.rx},${e.cy} a ${e.rx},${e.ry} 0 1,0 ${e.rx * 2},0 a ${e.rx},${e.ry} 0 1,0 ${-e.rx * 2},0`;
  }
  function posicaoDoRotuloDoConjunto(elipse, centro, afastamento = 14) {
    const dx = elipse.cx - centro.x;
    const dy = elipse.cy - centro.y;
    const distancia = Math.hypot(dx, dy) || 1;
    const raioNaDirecao = Math.max(elipse.rx, elipse.ry);
    return {
      x: elipse.cx + dx / distancia * (raioNaDirecao + afastamento),
      y: elipse.cy + dy / distancia * (raioNaDirecao + afastamento)
    };
  }

  // src/charts/diagrama_venn/dados.js
  var VALORES_VERDADEIROS = /* @__PURE__ */ new Set(["sim", "yes", "true", "1", "verdadeiro", "y", "s", "t"]);
  function ehVerdadeiro(texto) {
    return VALORES_VERDADEIROS.has(String(texto).trim().toLowerCase());
  }
  function detectarFormato(modelo) {
    const booleanas = modelo.dimensoes.filter((d) => /yesno|boolean/i.test(d.tipo));
    if (booleanas.length >= 2) return "booleanas";
    if (modelo.dimensoes.length >= 2) return "itemConjunto";
    return "regioes";
  }
  function lerConjuntos(modelo, config, { maximoAbsoluto = 5 } = {}) {
    const formato = config.formatoDosDados && config.formatoDosDados !== "auto" ? config.formatoDosDados : detectarFormato(modelo);
    const leitor = { regioes: lerRegioes, itemConjunto: lerItemConjunto, booleanas: lerBooleanas }[formato];
    const resultado = (leitor || lerRegioes)(modelo, config, maximoAbsoluto);
    resultado.formato = formato;
    if (resultado.medida === void 0) resultado.medida = null;
    if (!resultado.linhasPorRegiao) resultado.linhasPorRegiao = /* @__PURE__ */ new Map();
    const totalPorConjunto = /* @__PURE__ */ new Map();
    for (let i = 0; i < resultado.conjuntos.length; i++) {
      let soma = 0;
      for (const [mascara, valor] of resultado.regioes) {
        if (mascara & 1 << i) soma += valor;
      }
      totalPorConjunto.set(i, soma);
    }
    resultado.totalPorConjunto = totalPorConjunto;
    return resultado;
  }
  function lerRegioes(modelo, config, maximoAbsoluto) {
    const avisos = [];
    const dimensao = modelo.dimensoes[0];
    const medida = escolherMedida(modelo, config);
    if (!dimensao) {
      return { conjuntos: [], regioes: /* @__PURE__ */ new Map(), avisos: ["Nenhuma dimens\xE3o na consulta."], unidade: "" };
    }
    const separador = config.separadorDeConjuntos || ",";
    const indicePorNome = /* @__PURE__ */ new Map();
    const nomes = [];
    const bruto = [];
    for (const linha of modelo.linhas) {
      const texto = modelo.texto(linha, dimensao.nome, void 0, "");
      if (!texto) continue;
      const partes = texto.split(separador).map((p) => p.trim()).filter(Boolean);
      if (!partes.length) continue;
      for (const nome of partes) {
        if (!indicePorNome.has(nome)) {
          indicePorNome.set(nome, nomes.length);
          nomes.push(nome);
        }
      }
      const valor = medida ? modelo.valorNumerico(linha, medida.nome) : 1;
      bruto.push({ partes, valor: valor === null ? 0 : valor, linha });
    }
    const { conjuntos, mantidos, aviso } = limitarConjuntos(nomes, indicePorNome, config, maximoAbsoluto);
    if (aviso) avisos.push(aviso);
    const regioes = /* @__PURE__ */ new Map();
    const linhasPorRegiao = /* @__PURE__ */ new Map();
    for (const { partes, valor, linha } of bruto) {
      let mascara = 0;
      for (const nome of partes) {
        const indice = mantidos.get(nome);
        if (indice !== void 0) mascara |= 1 << indice;
      }
      if (!mascara) continue;
      regioes.set(mascara, (regioes.get(mascara) || 0) + valor);
      if (!linhasPorRegiao.has(mascara)) linhasPorRegiao.set(mascara, []);
      linhasPorRegiao.get(mascara).push(linha);
    }
    return {
      conjuntos,
      regioes,
      avisos,
      unidade: medida ? medida.rotuloCurto : "linhas",
      medida: medida || null,
      linhasPorRegiao
    };
  }
  function lerItemConjunto(modelo, config, maximoAbsoluto) {
    const avisos = [];
    const campoDoItem = escolherDimensao(modelo, config.campoDoItem, 0);
    const campoDoConjunto = escolherDimensao(modelo, config.campoDoConjunto, 1);
    const medida = escolherMedida(modelo, config);
    if (!campoDoItem || !campoDoConjunto || campoDoItem.nome === campoDoConjunto.nome) {
      return {
        conjuntos: [],
        regioes: /* @__PURE__ */ new Map(),
        avisos: ["Este formato precisa de duas dimens\xF5es diferentes: o item e o conjunto."],
        unidade: ""
      };
    }
    const indicePorNome = /* @__PURE__ */ new Map();
    const nomes = [];
    const porItem = /* @__PURE__ */ new Map();
    for (const linha of modelo.linhas) {
      const item = modelo.texto(linha, campoDoItem.nome, void 0, "");
      const conjunto = modelo.texto(linha, campoDoConjunto.nome, void 0, "");
      if (!item || !conjunto) continue;
      if (!indicePorNome.has(conjunto)) {
        indicePorNome.set(conjunto, nomes.length);
        nomes.push(conjunto);
      }
      if (!porItem.has(item)) porItem.set(item, { mascaraPorNome: /* @__PURE__ */ new Set(), valor: 0 });
      const registro2 = porItem.get(item);
      registro2.mascaraPorNome.add(conjunto);
      if (medida) {
        const v = modelo.valorNumerico(linha, medida.nome);
        if (v !== null) registro2.valor += v;
      }
    }
    const { conjuntos, mantidos, aviso } = limitarConjuntos(nomes, indicePorNome, config, maximoAbsoluto);
    if (aviso) avisos.push(aviso);
    const contarItens = !medida || config.medirPor === "itens";
    const regioes = /* @__PURE__ */ new Map();
    for (const registro2 of porItem.values()) {
      let mascara = 0;
      for (const nome of registro2.mascaraPorNome) {
        const indice = mantidos.get(nome);
        if (indice !== void 0) mascara |= 1 << indice;
      }
      if (!mascara) continue;
      const valor = contarItens ? 1 : registro2.valor;
      regioes.set(mascara, (regioes.get(mascara) || 0) + valor);
    }
    return {
      conjuntos,
      regioes,
      avisos,
      unidade: contarItens ? campoDoItem.rotuloCurto : medida.rotuloCurto,
      medida: contarItens ? null : medida
    };
  }
  function lerBooleanas(modelo, config, maximoAbsoluto) {
    const avisos = [];
    const medida = escolherMedida(modelo, config);
    const candidatas = modelo.dimensoes.filter((d) => /yesno|boolean/i.test(d.tipo));
    const colunas = candidatas.length >= 2 ? candidatas : modelo.dimensoes.slice(1);
    if (colunas.length < 2) {
      return {
        conjuntos: [],
        regioes: /* @__PURE__ */ new Map(),
        avisos: ["Este formato precisa de pelo menos duas colunas sim/n\xE3o."],
        unidade: ""
      };
    }
    const nomes = colunas.map((c) => c.rotuloCurto);
    const indicePorNome = new Map(nomes.map((n, i) => [n, i]));
    const { conjuntos, mantidos, aviso } = limitarConjuntos(nomes, indicePorNome, config, maximoAbsoluto);
    if (aviso) avisos.push(aviso);
    const contarItens = !medida || config.medirPor === "itens";
    const regioes = /* @__PURE__ */ new Map();
    for (const linha of modelo.linhas) {
      let mascara = 0;
      colunas.forEach((coluna, i) => {
        const indice = mantidos.get(nomes[i]);
        if (indice === void 0) return;
        if (ehVerdadeiro(modelo.texto(linha, coluna.nome, void 0, ""))) mascara |= 1 << indice;
      });
      if (!mascara) continue;
      const valor = contarItens ? 1 : modelo.valorNumerico(linha, medida.nome) || 0;
      regioes.set(mascara, (regioes.get(mascara) || 0) + valor);
    }
    return {
      conjuntos,
      regioes,
      avisos,
      unidade: contarItens ? "itens" : medida.rotuloCurto,
      medida: contarItens ? null : medida
    };
  }
  function limitarConjuntos(nomes, indicePorNome, config, maximoAbsoluto = 5) {
    const maximo = Math.min(maximoAbsoluto, Math.max(2, Number(config.maximoDeConjuntos) || maximoAbsoluto));
    if (nomes.length <= maximo) {
      return {
        conjuntos: nomes.map((nome) => ({ nome })),
        mantidos: new Map(nomes.map((n, i) => [n, i])),
        aviso: null
      };
    }
    const escolhidos = nomes.slice(0, maximo);
    return {
      conjuntos: escolhidos.map((nome) => ({ nome })),
      mantidos: new Map(escolhidos.map((n, i) => [n, i])),
      aviso: `A consulta tem ${nomes.length} conjuntos e o limite aqui \xE9 ${maximo}. Os ${nomes.length - maximo} \xFAltimos foram ignorados.`
    };
  }
  function escolherMedida(modelo, config) {
    if (config.campoDaMedida) {
      const achado = modelo.medidas.find((m) => m.nome === config.campoDaMedida);
      if (achado) return achado;
    }
    return modelo.medidas[0] || null;
  }
  function escolherDimensao(modelo, nomeEscolhido, posicaoPadrao) {
    if (nomeEscolhido) {
      const achado = modelo.dimensoes.find((d) => d.nome === nomeEscolhido);
      if (achado) return achado;
    }
    return modelo.dimensoes[posicaoPadrao] || null;
  }
  function rotuloDaRegiao(mascara, conjuntos) {
    const nomes = [];
    for (let i = 0; i < conjuntos.length; i++) {
      if (mascara & 1 << i) nomes.push(conjuntos[i].nome);
    }
    if (nomes.length === 1) return `s\xF3 ${nomes[0]}`;
    return nomes.join(" \u2229 ");
  }

  // src/charts/diagrama_venn/index.js
  var CSS2 = `
.venn-area{position:relative;width:100%;height:100%;}
.venn-svg{cursor:pointer;}
.venn-forma{transition:opacity .15s ease, stroke-width .15s ease;pointer-events:none;}
.venn-forma.venn-atenuado{opacity:.3;}
.venn-forma.venn-ativa{stroke-width:3px;}
.venn-destaque{pointer-events:none;}
.venn-rotulo-conjunto{font-weight:600;pointer-events:none;}
.venn-valor{pointer-events:none;transition:opacity .15s ease;}
.venn-valor.venn-atenuado{opacity:.35;}
.venn-lista{position:absolute;right:6px;bottom:4px;font-size:10px;line-height:1.4;opacity:.8;
  max-width:46%;text-align:right;}
@media (prefers-reduced-motion: reduce){.venn-forma,.venn-valor{transition:none;}}
`;
  var contadorDeDesenhos = 0;
  function tamanhoQueCabe(posicao, texto, tamanhoPreferido) {
    if (!posicao) return 0;
    for (let tamanho = tamanhoPreferido; tamanho >= 7; tamanho -= 1) {
      const larguraDoTexto3 = texto.length * tamanho * 0.58;
      if (posicao.folgaX * 2 >= larguraDoTexto3 && posicao.folgaY * 2 >= tamanho) return tamanho;
    }
    return 0;
  }
  function opcoes() {
    return montarOpcoes(
      blocoDeCores({ secaoDeCores: "Cores" }),
      blocoDeRotulos(),
      blocoDeLegenda(),
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      {
        formatoDosDados: {
          type: "string",
          label: "Como os dados est\xE3o organizados",
          section: "Dados",
          display: "select",
          default: "auto",
          values: listaDeValores([
            { rotulo: "Detectar sozinho", valor: "auto" },
            { rotulo: 'Uma linha por regi\xE3o ("A", "A,B")', valor: "regioes" },
            { rotulo: "Uma linha por item e conjunto", valor: "itemConjunto" },
            { rotulo: "Colunas sim/n\xE3o (uma por conjunto)", valor: "booleanas" }
          ])
        },
        separadorDeConjuntos: {
          type: "string",
          label: "Separador dos conjuntos na dimens\xE3o",
          section: "Dados",
          default: ",",
          placeholder: ","
        },
        medirPor: {
          type: "string",
          label: "O n\xFAmero mostrado \xE9",
          section: "Dados",
          display: "select",
          default: "itens",
          values: listaDeValores([
            { rotulo: "Contagem de itens", valor: "itens" },
            { rotulo: "Soma da medida", valor: "medida" }
          ])
        },
        maximoDeConjuntos: {
          type: "number",
          label: "M\xE1ximo de conjuntos (2 a 5)",
          section: "Dados",
          display: "range",
          min: 2,
          max: 5,
          step: 1,
          default: 5
        },
        mostrarPercentual: {
          type: "boolean",
          label: "Mostrar o percentual junto do n\xFAmero",
          section: "R\xF3tulos",
          default: false
        },
        mostrarTotalDoConjunto: {
          type: "boolean",
          label: "Mostrar o total de cada conjunto no nome",
          section: "R\xF3tulos",
          default: true
        },
        listarRegioesPequenas: {
          type: "boolean",
          label: "Listar num canto as regi\xF5es pequenas demais para o n\xFAmero caber",
          section: "R\xF3tulos",
          default: true
        },
        opacidadeDoPreenchimento: {
          type: "number",
          label: "Opacidade do preenchimento",
          section: "Cores",
          display: "range",
          min: 0,
          max: 1,
          step: 0.05,
          default: 0.4
        },
        espessuraDoContorno: {
          type: "number",
          label: "Espessura do contorno",
          section: "Cores",
          display: "range",
          min: 0,
          max: 6,
          step: 0.5,
          default: 1.5
        }
      }
    );
  }
  var index_default = defineViz({
    id: "diagrama_venn",
    label: "Diagrama de Venn",
    opcoes: opcoes(),
    exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },
    opcoesDinamicas({ modelo, config }) {
      const { conjuntos } = lerConjuntos(modelo, config);
      if (!conjuntos.length) return {};
      return opcoesDeCorPorItem(
        conjuntos.map((c) => ({ chave: c.nome, rotulo: c.nome })),
        { secao: "Cores", cores: coresDaPaleta(config.paleta) }
      );
    },
    render(ctx) {
      const { modelo, config, tema, raiz, largura, altura } = ctx;
      const { conjuntos, regioes, totalPorConjunto, avisos, unidade, formato, medida, linhasPorRegiao } = lerConjuntos(modelo, config);
      for (const aviso of avisos) ctx.avisar(aviso);
      if (conjuntos.length < 2) {
        ctx.mostrarVazio(
          'O diagrama de Venn precisa de pelo menos 2 conjuntos. Confira a op\xE7\xE3o "Como os dados est\xE3o organizados" na se\xE7\xE3o Dados.'
        );
        return;
      }
      ctx.limparRaiz();
      injetarEstilo(raiz, CSS2, "venn");
      const { areaGrafico, areaLegenda } = criarLayoutComLegenda(raiz, config);
      const larguraUtil = Math.max(80, areaGrafico.clientWidth || largura);
      const alturaUtil = Math.max(80, areaGrafico.clientHeight || altura);
      const totais = conjuntos.map((_, i) => totalPorConjunto.get(i) || 0);
      const cores = resolverCores(conjuntos, totais, config, tema);
      const elipses = layoutDeConjuntos(conjuntos.length, {
        largura: larguraUtil,
        altura: alturaUtil,
        margem: 26
      });
      const posicoes = posicoesDasRegioes(elipses, { largura: larguraUtil, altura: alturaUtil, passos: 150 });
      const svg = criarSvgEl("svg", {
        pai: areaGrafico,
        classe: "venn-svg",
        atributos: { width: larguraUtil, height: alturaUtil, viewBox: `0 0 ${larguraUtil} ${alturaUtil}` }
      });
      criarSvgEl("rect", {
        pai: svg,
        atributos: { x: 0, y: 0, width: larguraUtil, height: alturaUtil, fill: "transparent" }
      });
      const formatarValor = formatadorDeValueFormat(medida ? medida.valueFormat : void 0, {
        casas: medida ? 2 : 0
      });
      const totalGeral = Array.from(regioes.values()).reduce((a, b) => a + b, 0);
      function textoDoLooker(mascara) {
        const linhas = linhasPorRegiao.get(mascara);
        if (medida && linhas && linhas.length === 1) {
          const t = modelo.texto(linhas[0], medida.nome, void 0, "");
          if (t !== "") return t;
        }
        return null;
      }
      function textoDoValor(mascara) {
        const doLooker = textoDoLooker(mascara);
        return doLooker !== null ? doLooker : formatarValor(regioes.get(mascara) || 0);
      }
      const opacidade = opacidadeDoVenn(config);
      const formas = elipses.map((elipse, i) => {
        const forma = criarSvgEl("path", {
          pai: svg,
          classe: "venn-forma",
          atributos: {
            d: caminhoDaElipse(elipse),
            transform: transformacao(elipse),
            fill: cores[i],
            "fill-opacity": opacidade
          }
        });
        aplicarContorno(forma, contornoDoConjunto(config, tema, cores[i]));
        return forma;
      });
      const uid = `venn${contadorDeDesenhos += 1}`;
      const defs = criarSvgEl("defs", { pai: svg });
      elipses.forEach((elipse, i) => {
        const recorte = criarSvgEl("clipPath", { pai: defs, atributos: { id: `${uid}-c${i}` } });
        criarSvgEl("path", { pai: recorte, atributos: { d: caminhoDaElipse(elipse), transform: transformacao(elipse) } });
      });
      const camadaDoDestaque = criarSvgEl("g", { pai: svg });
      const rot = lerRotulos(config, tema);
      const rotDoValor = { ...rot };
      if (config.mostrarPercentual && rot.conteudo === "valor") rotDoValor.conteudo = "valorPercentual";
      const listarFora = rot.posicao === "fora" || rot.posicao === "foraComLinha";
      const pequenas = [];
      const numeros = /* @__PURE__ */ new Map();
      const caixas = [];
      if (rot.mostrar) {
        for (const [mascara, valor] of ordenarRegioes(regioes)) {
          const posicao = posicoes.get(mascara);
          const rotulo = rotuloDaRegiao(mascara, conjuntos);
          const textoLooker = textoDoLooker(mascara);
          const texto = textoDoRotulo(rotDoValor, {
            valor,
            nome: rotulo,
            total: totalGeral,
            valueFormat: medida ? medida.valueFormat : void 0,
            textoDoValor: textoLooker === null ? void 0 : textoLooker
          });
          if (texto === "") continue;
          const tamanho = listarFora || !posicao ? 0 : rot.evitarColisao ? tamanhoQueCabe(posicao, texto, rot.tamanho) : rot.tamanho;
          if (!tamanho) {
            pequenas.push({ rotulo, texto });
            continue;
          }
          const numero = criarSvgEl("text", {
            pai: svg,
            classe: "venn-valor bl-rotulo",
            atributos: {
              x: posicao.x,
              y: posicao.y,
              "text-anchor": "middle",
              "dominant-baseline": "central",
              "data-mascara": mascara
            }
          });
          definirTexto(numero, texto);
          estilizarRotulo(numero, { ...rot, tamanho }, { corAutomatica: corDoTextoDaRegiao(mascara, cores, opacidade, tema) });
          numeros.set(mascara, numero);
          caixas.push({ el: numero, x: posicao.x, y: posicao.y, largura: larguraDoTexto2(texto, tamanho), altura: tamanho });
        }
        esconderColisoes(caixas, rot);
      }
      const centro = { x: larguraUtil / 2, y: alturaUtil / 2 };
      if (rot.mostrar) {
        conjuntos.forEach((conjunto, i) => {
          const posicao = posicaoDoRotuloDoConjunto(elipses[i], centro, 6);
          const texto = config.mostrarTotalDoConjunto !== false ? `${conjunto.nome} (${formatarValor(totais[i])})` : conjunto.nome;
          const el = criarSvgEl("text", {
            pai: svg,
            classe: "venn-rotulo-conjunto",
            atributos: {
              x: Math.max(4, Math.min(larguraUtil - 4, posicao.x)),
              y: Math.max(10, Math.min(alturaUtil - 4, posicao.y)),
              "text-anchor": posicao.x < centro.x ? "start" : "end",
              "dominant-baseline": "central",
              "font-size": Math.max(10, tema.tamanhoBase),
              "font-family": tema.fonte,
              fill: cores[i]
            }
          });
          definirTexto(el, texto);
        });
      }
      if (pequenas.length && (config.listarRegioesPequenas !== false || listarFora)) {
        const lista = criarEl("div", { classe: "venn-lista", pai: areaGrafico });
        lista.style.color = rot.cor || tema.textoSuave;
        lista.style.fontWeight = rot.negrito ? "700" : "";
        for (const { rotulo, texto } of pequenas) {
          criarEl("div", { pai: lista, texto: `${rotulo}: ${texto}` });
        }
      }
      if (config.mostrarLegenda !== false) {
        desenharLegenda({
          hospedeiro: areaLegenda,
          tema,
          config,
          itens: conjuntos.map((c, i) => ({
            chave: c.nome,
            rotulo: config.mostrarTotalDoConjunto !== false ? `${c.nome} (${formatarValor(totais[i])})` : c.nome,
            cor: cores[i]
          })),
          eventos: ctx.eventos
        });
      }
      const tooltip = ctx.tooltip();
      const mascaras = /* @__PURE__ */ new Map();
      let regiaoAtual = 0;
      let regiaoDoTooltip = 0;
      function conteudoDaRegiao(mascara) {
        const rotulo = rotuloDaRegiao(mascara, conjuntos);
        const valor = regioes.get(mascara) || 0;
        const texto = textoDoValor(mascara);
        const percentual = totalGeral ? formatarPercentual(valor / totalGeral, 1) : "";
        const linhas = [{ rotulo: unidade || "Valor", valor: texto, cor: corDaRegiao(mascara, cores) }];
        if (percentual) linhas.push({ rotulo: "Do total", valor: percentual });
        return { titulo: rotulo, linhas, variaveis: { categoria: rotulo, valor: texto, serie: rotulo, percentual } };
      }
      function celulaDaRegiao(mascara) {
        const linhas = linhasPorRegiao.get(mascara);
        if (!linhas || linhas.length !== 1) return null;
        const candidatas = [];
        if (medida) candidatas.push(modelo.celula(linhas[0], medida.nome));
        if (modelo.dimensoes[0]) candidatas.push(modelo.celula(linhas[0], modelo.dimensoes[0].nome));
        return candidatas.find((c) => c && Array.isArray(c.links) && c.links.length) || candidatas[0] || null;
      }
      function mascaraDeExclusao(mascara) {
        const fora = elipses.map((_, i) => i).filter((i) => !(mascara & 1 << i));
        if (!fora.length) return null;
        if (!mascaras.has(mascara)) {
          const id = `${uid}-m${mascara}`;
          const m = criarSvgEl("mask", {
            pai: defs,
            atributos: { id, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: larguraUtil, height: alturaUtil }
          });
          criarSvgEl("rect", { pai: m, atributos: { x: 0, y: 0, width: larguraUtil, height: alturaUtil, fill: "#FFFFFF" } });
          for (const i of fora) {
            criarSvgEl("path", {
              pai: m,
              atributos: { d: caminhoDaElipse(elipses[i]), transform: transformacao(elipses[i]), fill: "#000000" }
            });
          }
          mascaras.set(mascara, id);
        }
        return mascaras.get(mascara);
      }
      const comDestaque = config.destacarAoPassarMouse !== false;
      function destacar(pedida) {
        const mascara = comDestaque ? pedida : 0;
        if (mascara === regiaoAtual) return;
        regiaoAtual = mascara;
        while (camadaDoDestaque.firstChild) camadaDoDestaque.removeChild(camadaDoDestaque.firstChild);
        formas.forEach((forma, i) => {
          const pertence = mascara !== 0 && (mascara & 1 << i) !== 0;
          forma.classList.toggle("venn-atenuado", mascara !== 0 && !pertence);
          forma.classList.toggle("venn-ativa", pertence);
        });
        for (const [m, numero] of numeros) numero.classList.toggle("venn-atenuado", mascara !== 0 && m !== mascara);
        if (!mascara) return;
        const grupo = criarSvgEl("g", {
          pai: camadaDoDestaque,
          classe: "venn-destaque",
          atributos: { "data-mascara": mascara }
        });
        let pai = grupo;
        elipses.forEach((_, i) => {
          if (!(mascara & 1 << i)) return;
          pai = criarSvgEl("g", { pai, atributos: { "clip-path": `url(#${uid}-c${i})` } });
        });
        const exclusao = mascaraDeExclusao(mascara);
        criarSvgEl("rect", {
          pai,
          atributos: {
            x: 0,
            y: 0,
            width: larguraUtil,
            height: alturaUtil,
            fill: corDaRegiao(mascara, cores),
            "fill-opacity": Math.min(1, opacidade + 0.35),
            mask: exclusao ? `url(#${exclusao})` : null
          }
        });
      }
      function regiaoNoPonto(ev) {
        const caixa = typeof svg.getBoundingClientRect === "function" ? svg.getBoundingClientRect() : null;
        const escalaX = caixa && caixa.width ? larguraUtil / caixa.width : 1;
        const escalaY = caixa && caixa.height ? alturaUtil / caixa.height : 1;
        const x = (ev.clientX - (caixa ? caixa.left : 0)) * escalaX;
        const y = (ev.clientY - (caixa ? caixa.top : 0)) * escalaY;
        return mascaraDoPonto(x, y, elipses);
      }
      function aoMover(ev) {
        const mascara = regiaoNoPonto(ev);
        const mudou = mascara !== regiaoDoTooltip;
        regiaoDoTooltip = mascara;
        destacar(mascara);
        if (!tooltip) return;
        if (!mascara) {
          tooltip.esconder();
        } else if (mudou || !tooltip.visivel) {
          tooltip.mostrar(conteudoDaRegiao(mascara), ev.clientX, ev.clientY);
        } else {
          tooltip.mover(ev.clientX, ev.clientY);
        }
      }
      ctx.eventos.on(svg, "pointermove", aoMover);
      ctx.eventos.on(svg, "pointerenter", aoMover);
      ctx.eventos.on(svg, "pointerleave", () => {
        regiaoDoTooltip = 0;
        destacar(0);
        if (tooltip) tooltip.esconder();
      });
      ctx.eventos.on(svg, "click", (ev) => {
        const mascara = regiaoNoPonto(ev);
        if (!mascara) return;
        destacar(mascara);
        ctx.cliqueNoItem(ev, celulaDaRegiao(mascara), conteudoDaRegiao(mascara));
      });
      if (config.modoDebug) {
        ctx.avisar(`formato detectado: ${formato}; ${regioes.size} regi\xE3o(\xF5es).`);
      }
    }
  });
  function transformacao(elipse) {
    return elipse.rotacao ? `rotate(${elipse.rotacao} ${elipse.cx} ${elipse.cy})` : null;
  }
  function opacidadeDoVenn(config) {
    const limitar = (v) => Math.max(0, Math.min(1, v));
    const geral = Number(config.opacidade);
    if (Number.isFinite(geral) && geral !== 1) return limitar(geral);
    const propria = Number(config.opacidadeDoPreenchimento);
    return Number.isFinite(propria) ? limitar(propria) : 0.4;
  }
  function contornoDoConjunto(config, tema, corDoConjunto) {
    const escolhida = String(config.corDoContorno || "").trim();
    const automatica = !escolhida || escolhida.toUpperCase() === "#FFFFFF";
    return lerContorno({ ...config, corDoContorno: automatica ? "" : escolhida }, tema, { corPadrao: corDoConjunto });
  }
  function corDaRegiao(mascara, cores) {
    const rgbs = [];
    cores.forEach((cor, i) => {
      if (mascara & 1 << i) {
        const rgb2 = corParaRgb(cor);
        if (rgb2) rgbs.push(rgb2);
      }
    });
    if (!rgbs.length) return cores[0] || "#94A3B8";
    const media = [0, 1, 2].map((k) => Math.round(rgbs.reduce((a, c) => a + c[k], 0) / rgbs.length));
    return `rgb(${media[0]},${media[1]},${media[2]})`;
  }
  function corDoTextoDaRegiao(mascara, cores, opacidade, tema) {
    const indices = [];
    for (let i = 0; i < cores.length; i++) if (mascara & 1 << i) indices.push(i);
    if (indices.length !== 1) return tema.texto;
    if (!Number.isFinite(opacidade) || opacidade < 0.55) return tema.texto;
    return textoLegivelSobre(cores[indices[0]], tema);
  }
  function ordenarRegioes(regioes) {
    return Array.from(regioes.entries()).sort((a, b) => b[1] - a[1]);
  }
  function resolverCores(conjuntos, totais, config, tema) {
    const modo = config.modoDeCor || "categoria";
    if (modo === "unica" || modo === "valor") {
      const escala = escalaDeCores({ chaves: conjuntos.map((c) => c.nome), valores: totais, config, tema });
      return conjuntos.map((_, i) => escala.cor(totais[i]));
    }
    const paleta = paletaDoConfig(config);
    return conjuntos.map((conjunto, i) => corPropria(config, i, conjunto.nome) || paleta[i % paleta.length] || tema.texto);
  }
  function corPropria(config, indice, nome) {
    const valor = String(config[`cor_${sanitizarChave(nome)}`] || "").trim();
    if (!valor) return "";
    for (const item of opcoesDePaleta()) {
      const cores = coresDaPaleta(Object.values(item)[0]);
      if (cores.length && String(cores[indice % cores.length]).toUpperCase() === valor.toUpperCase()) return "";
    }
    return valor;
  }
})();
