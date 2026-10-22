/*!
 * Organograma — visualização customizada para o Looker
 * id: org_chart
 * versão: 0.1.0 | build: 2026-10-22 12:58:09 | commit: 794dafb
 *
 * Arquivo AUTOCONTIDO: no Looker, o campo "Dependencies" deve ficar VAZIO.
 * Gerado por biblioteca/build/build.mjs — não edite este arquivo à mão;
 * edite src/charts/org_chart/index.js e rode `npm run build`.
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
    let assinaturaDasOpcoes = null;
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
        if (assinatura === assinaturaDasOpcoes) return false;
        assinaturaDasOpcoes = assinatura;
        const completas = Object.assign({}, opcoesEstaticas || {}, dinamicas);
        instancia.trigger("registerOptions", completas);
        return true;
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
      var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
      if (type === "n") comma = true, type = "g";
      else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
      if (zero || fill === "0" && align === "=") zero = true, fill = "0", align = "=";
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
        if (comma && !zero) value = group(value, Infinity);
        var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
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
        base = (n) => trocarSufixosSI(format(`${sep}.${Math.max(1, casasSeguras)}s`)(n));
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
  function trocarSufixosSI(texto) {
    return texto.replace(/G$/, "B").replace(/k$/, "K").replace(/µ/, "u");
  }
  var formatarCurto = criarFormatadorNumerico({ estilo: "compacto", casas: 1 });
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
    var r = o.r / 255, g = o.g / 255, b = o.b / 255, min = Math.min(r, g, b), max = Math.max(r, g, b), h = NaN, s = max - min, l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
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
    if (config.tema === "personalizado") {
      if (config.corDeFundo) tema.fundo = config.corDeFundo;
      if (config.corDoTexto) tema.texto = config.corDoTexto;
      if (config.corDaBorda) tema.borda = config.corDaBorda;
      if (config.corDaGrade) tema.grade = config.corDaGrade;
      if (config.corDeDestaque) tema.destaque = config.corDeDestaque;
    } else {
      if (config.corDeFundo) tema.fundo = config.corDeFundo;
    }
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
  function comOpacidade(cor, opacidade) {
    const rgb2 = corParaRgb(cor);
    if (!rgb2) return cor;
    const a = Math.max(0, Math.min(1, Number(opacidade)));
    return `rgba(${rgb2[0]},${rgb2[1]},${rgb2[2]},${a})`;
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
      comOpacidade: comOpacidade2 = true,
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
    if (comOpacidade2) {
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
        label: "Modelo do tooltip (use {{nome_do_campo}})",
        section: secao,
        default: "",
        placeholder: "{{loja}}: {{vendas}}"
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
  function opcaoDeEscolhaDeCampo(chave, rotulo, campos, opcoes = {}) {
    const { secao = "Dados", incluirNenhum = false, padrao = null } = opcoes;
    const valores = [];
    if (incluirNenhum) valores.push({ "(nenhum)": "" });
    for (const campo of campos) valores.push({ [campo.rotulo]: campo.nome });
    return {
      [chave]: {
        type: "string",
        label: rotulo,
        section: secao,
        display: "select",
        default: padrao !== null ? padrao : campos[0] && campos[0].nome || "",
        values: valores
      }
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
  function cancelarQuadro(id) {
    if (id === null || id === void 0) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
    else clearTimeout(id);
  }

  // src/core/define-viz.js
  var CSS_BASE = `
.bl-raiz{position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;}
.bl-raiz *{box-sizing:border-box;}
.bl-cabecalho{padding:6px 10px 0;}
.bl-titulo{font-weight:600;line-height:1.2;}
.bl-subtitulo{opacity:.7;line-height:1.2;}
.bl-area{position:relative;width:100%;height:100%;}
.bl-aviso{position:absolute;left:8px;right:8px;top:6px;z-index:5;padding:4px 8px;border-radius:4px;
  font-size:11px;line-height:1.35;pointer-events:none;}
.bl-vazio{display:flex;align-items:center;justify-content:center;width:100%;height:100%;
  text-align:center;padding:16px;opacity:.75;font-size:13px;}
`;
  function defineViz(declaracao) {
    const {
      id,
      label,
      opcoes = {},
      exigencia = {},
      opcoesDinamicas = null,
      render,
      aoDestruir = null
    } = declaracao;
    if (typeof render !== "function") {
      throw new Error(`defineViz(${id}): a fun\xE7\xE3o render \xE9 obrigat\xF3ria.`);
    }
    const definicao = {
      id,
      label,
      options: opcoes,
      create(element, _config) {
        limpar(element);
        injetarEstilo(element, CSS_BASE, "bl-base");
        const raiz = criarEl("div", { classe: "bl-raiz", pai: element });
        const cabecalho = criarEl("div", { classe: "bl-cabecalho", pai: raiz });
        const tituloEl = criarEl("div", { classe: "bl-titulo", pai: cabecalho });
        const subtituloEl = criarEl("div", { classe: "bl-subtitulo", pai: cabecalho });
        const area = criarEl("div", { classe: "bl-area", pai: raiz });
        const avisoEl = criarEl("div", { classe: "bl-aviso", pai: raiz });
        avisoEl.style.display = "none";
        this._bl = {
          element,
          raiz,
          cabecalho,
          tituloEl,
          subtituloEl,
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
            declaracao: { id, label, opcoes, exigencia, opcoesDinamicas, render, aoDestruir },
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
    const { id, opcoes, exigencia, opcoesDinamicas, render } = declaracao;
    const ponte = criarPonte(this, opcoes);
    ponte.limparErros();
    if (!this._bl) {
      definicaoCreateManual.call(this, element);
    }
    const bl = this._bl;
    limparPendencias(bl);
    bl.avisoEl.style.display = "none";
    definirTexto(bl.avisoEl, "");
    const configFinal = aplicarConfiguracaoJson(Object.assign({}, config || {}));
    const tema = resolverTema(configFinal);
    const modelo = construirModelo(data, queryResponse, configFinal, ponte);
    if (configFinal.modoDebug) {
      escreverDebug(id, { modelo, configFinal, queryResponse, data });
    }
    if (typeof opcoesDinamicas === "function") {
      try {
        const dinamicas = opcoesDinamicas({ modelo, config: configFinal, tema });
        if (dinamicas && Object.keys(dinamicas).length) ponte.registrarOpcoes(dinamicas);
      } catch (e) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(`[${id}] falha ao montar op\xE7\xF5es din\xE2micas:`, e && e.message);
        }
      }
    }
    aplicarCabecalho(bl, configFinal, tema);
    const problema = validarModelo(modelo, exigencia);
    if (problema) {
      mostrarEstadoVazio(bl, tema, problema.mensagem);
      ponte.mostrarErro(problema.titulo, problema.mensagem);
      return;
    }
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
      limparRaiz() {
        limpar(bl.area);
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
        bl.avisoEl.style.display = "none";
        definirTexto(bl.avisoEl, "");
        try {
          render(ctx);
        } catch (e) {
          if (typeof console !== "undefined" && console.error) console.error(`[${id}]`, e);
        }
      }
    };
    bl.raiz.style.background = tema.fundo;
    bl.raiz.style.color = tema.texto;
    bl.raiz.style.fontFamily = tema.fonte;
    bl.raiz.style.fontSize = `${tema.tamanhoBase}px`;
    bl.ultimoDesenho = () => {
      if (!this._bl) return;
      const tamanho = medir(bl.area);
      if (tamanho.largura === ctx.largura && tamanho.altura === ctx.altura) return;
      ctx.largura = tamanho.largura;
      ctx.altura = tamanho.altura;
      bl.eventos.limpar();
      try {
        render(ctx);
      } catch (e) {
        if (typeof console !== "undefined" && console.error) console.error(`[${id}]`, e);
      }
    };
    render(ctx);
    bl.primeiraRenderizacao = false;
  }
  function definicaoCreateManual(element) {
    limpar(element);
    injetarEstilo(element, CSS_BASE, "bl-base");
    const raiz = criarEl("div", { classe: "bl-raiz", pai: element });
    const cabecalho = criarEl("div", { classe: "bl-cabecalho", pai: raiz });
    const tituloEl = criarEl("div", { classe: "bl-titulo", pai: cabecalho });
    const subtituloEl = criarEl("div", { classe: "bl-subtitulo", pai: cabecalho });
    const area = criarEl("div", { classe: "bl-area", pai: raiz });
    const avisoEl = criarEl("div", { classe: "bl-aviso", pai: raiz });
    avisoEl.style.display = "none";
    this._bl = {
      element,
      raiz,
      cabecalho,
      tituloEl,
      subtituloEl,
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
  function aplicarCabecalho(bl, config, tema) {
    const titulo = (config.titulo || "").trim();
    const subtitulo = (config.subtitulo || "").trim();
    definirTexto(bl.tituloEl, titulo);
    definirTexto(bl.subtituloEl, subtitulo);
    bl.tituloEl.style.display = titulo ? "block" : "none";
    bl.subtituloEl.style.display = subtitulo ? "block" : "none";
    bl.tituloEl.style.fontSize = `${Math.round(tema.tamanhoBase * 1.25)}px`;
    bl.subtituloEl.style.fontSize = `${Math.round(tema.tamanhoBase * 0.95)}px`;
    bl.cabecalho.style.display = titulo || subtitulo ? "block" : "none";
  }
  function mostrarAviso(bl, tema, mensagem) {
    if (!mensagem) return;
    const atual = bl.avisoEl.textContent;
    definirTexto(bl.avisoEl, atual ? `${atual} \xB7 ${mensagem}` : mensagem);
    bl.avisoEl.style.display = "block";
    bl.avisoEl.style.background = tema.nome === "escuro" ? "rgba(251,191,36,.18)" : "rgba(253,230,138,.85)";
    bl.avisoEl.style.color = tema.nome === "escuro" ? "#FDE68A" : "#92400E";
  }
  function mostrarEstadoVazio(bl, tema, mensagem) {
    limpar(bl.area);
    const caixa = criarEl("div", { classe: "bl-vazio", pai: bl.area, texto: mensagem });
    caixa.style.color = tema.textoSuave;
  }
  function escreverDebug(id, { modelo, configFinal, queryResponse, data }) {
    if (typeof console === "undefined" || !console.log) return;
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

  // src/core/tooltip.js
  var CSS_TOOLTIP = `
.bl-tooltip{position:fixed;z-index:2147483000;pointer-events:none;max-width:320px;
  padding:6px 9px;border-radius:6px;font-size:11px;line-height:1.5;
  box-shadow:0 6px 18px rgba(15,23,42,.25);opacity:0;transition:opacity .12s ease;}
.bl-tooltip.bl-visivel{opacity:1;}
.bl-tooltip-linha{display:flex;gap:8px;justify-content:space-between;white-space:nowrap;}
.bl-tooltip-rotulo{opacity:.75;}
.bl-tooltip-valor{font-weight:600;}
.bl-tooltip-titulo{font-weight:700;margin-bottom:3px;}
.bl-tooltip-chip{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle;}
`;
  function criarTooltip(hospedeiro, tema) {
    if (!hospedeiro.querySelector('style[data-estilo="bl-tooltip"]')) {
      const style = document.createElement("style");
      style.setAttribute("data-estilo", "bl-tooltip");
      style.textContent = CSS_TOOLTIP;
      hospedeiro.appendChild(style);
    }
    const el = criarEl("div", { classe: "bl-tooltip" });
    el.style.background = tema.tooltipFundo;
    el.style.color = tema.tooltipTexto;
    el.style.fontFamily = tema.fonte;
    (document.body || hospedeiro).appendChild(el);
    let visivel = false;
    function posicionar(clientX, clientY) {
      const margem = 14;
      const larguraJanela = typeof window !== "undefined" && window.innerWidth || 1024;
      const alturaJanela = typeof window !== "undefined" && window.innerHeight || 768;
      const largura = el.offsetWidth || 200;
      const altura = el.offsetHeight || 60;
      let x = clientX + margem;
      let y = clientY + margem;
      if (x + largura > larguraJanela - 8) x = clientX - largura - margem;
      if (y + altura > alturaJanela - 8) y = clientY - altura - margem;
      el.style.left = `${Math.max(4, x)}px`;
      el.style.top = `${Math.max(4, y)}px`;
    }
    return {
      elemento: el,
      /**
       * Mostra o tooltip.
       * @param {{titulo?:string, linhas?:Array<{rotulo:string,valor:string,cor?:string}>,
       *          texto?:string}} conteudo
       */
      mostrar(conteudo, clientX, clientY) {
        var _a, _b;
        limpar(el);
        if (conteudo.titulo) {
          criarEl("div", { classe: "bl-tooltip-titulo", texto: conteudo.titulo, pai: el });
        }
        if (conteudo.texto) {
          for (const parte of String(conteudo.texto).split("\n")) {
            criarEl("div", { texto: parte, pai: el });
          }
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
        posicionar(clientX, clientY);
        if (!visivel) {
          el.classList.add("bl-visivel");
          visivel = true;
        }
      },
      mover(clientX, clientY) {
        if (visivel) posicionar(clientX, clientY);
      },
      esconder() {
        if (!visivel) return;
        el.classList.remove("bl-visivel");
        visivel = false;
      },
      destruir() {
        try {
          if (el.parentNode) el.parentNode.removeChild(el);
        } catch (_) {
        }
      }
    };
  }

  // node_modules/d3-hierarchy/src/hierarchy/count.js
  function count(node) {
    var sum = 0, children = node.children, i = children && children.length;
    if (!i) sum = 1;
    else while (--i >= 0) sum += children[i].value;
    node.value = sum;
  }
  function count_default() {
    return this.eachAfter(count);
  }

  // node_modules/d3-hierarchy/src/hierarchy/each.js
  function each_default(callback, that) {
    let index = -1;
    for (const node of this) {
      callback.call(that, node, ++index, this);
    }
    return this;
  }

  // node_modules/d3-hierarchy/src/hierarchy/eachBefore.js
  function eachBefore_default(callback, that) {
    var node = this, nodes = [node], children, i, index = -1;
    while (node = nodes.pop()) {
      callback.call(that, node, ++index, this);
      if (children = node.children) {
        for (i = children.length - 1; i >= 0; --i) {
          nodes.push(children[i]);
        }
      }
    }
    return this;
  }

  // node_modules/d3-hierarchy/src/hierarchy/eachAfter.js
  function eachAfter_default(callback, that) {
    var node = this, nodes = [node], next = [], children, i, n, index = -1;
    while (node = nodes.pop()) {
      next.push(node);
      if (children = node.children) {
        for (i = 0, n = children.length; i < n; ++i) {
          nodes.push(children[i]);
        }
      }
    }
    while (node = next.pop()) {
      callback.call(that, node, ++index, this);
    }
    return this;
  }

  // node_modules/d3-hierarchy/src/hierarchy/find.js
  function find_default(callback, that) {
    let index = -1;
    for (const node of this) {
      if (callback.call(that, node, ++index, this)) {
        return node;
      }
    }
  }

  // node_modules/d3-hierarchy/src/hierarchy/sum.js
  function sum_default(value) {
    return this.eachAfter(function(node) {
      var sum = +value(node.data) || 0, children = node.children, i = children && children.length;
      while (--i >= 0) sum += children[i].value;
      node.value = sum;
    });
  }

  // node_modules/d3-hierarchy/src/hierarchy/sort.js
  function sort_default(compare) {
    return this.eachBefore(function(node) {
      if (node.children) {
        node.children.sort(compare);
      }
    });
  }

  // node_modules/d3-hierarchy/src/hierarchy/path.js
  function path_default(end) {
    var start = this, ancestor = leastCommonAncestor(start, end), nodes = [start];
    while (start !== ancestor) {
      start = start.parent;
      nodes.push(start);
    }
    var k = nodes.length;
    while (end !== ancestor) {
      nodes.splice(k, 0, end);
      end = end.parent;
    }
    return nodes;
  }
  function leastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = a.ancestors(), bNodes = b.ancestors(), c = null;
    a = aNodes.pop();
    b = bNodes.pop();
    while (a === b) {
      c = a;
      a = aNodes.pop();
      b = bNodes.pop();
    }
    return c;
  }

  // node_modules/d3-hierarchy/src/hierarchy/ancestors.js
  function ancestors_default() {
    var node = this, nodes = [node];
    while (node = node.parent) {
      nodes.push(node);
    }
    return nodes;
  }

  // node_modules/d3-hierarchy/src/hierarchy/descendants.js
  function descendants_default() {
    return Array.from(this);
  }

  // node_modules/d3-hierarchy/src/hierarchy/leaves.js
  function leaves_default() {
    var leaves = [];
    this.eachBefore(function(node) {
      if (!node.children) {
        leaves.push(node);
      }
    });
    return leaves;
  }

  // node_modules/d3-hierarchy/src/hierarchy/links.js
  function links_default() {
    var root = this, links = [];
    root.each(function(node) {
      if (node !== root) {
        links.push({ source: node.parent, target: node });
      }
    });
    return links;
  }

  // node_modules/d3-hierarchy/src/hierarchy/iterator.js
  function* iterator_default() {
    var node = this, current, next = [node], children, i, n;
    do {
      current = next.reverse(), next = [];
      while (node = current.pop()) {
        yield node;
        if (children = node.children) {
          for (i = 0, n = children.length; i < n; ++i) {
            next.push(children[i]);
          }
        }
      }
    } while (next.length);
  }

  // node_modules/d3-hierarchy/src/hierarchy/index.js
  function hierarchy(data, children) {
    if (data instanceof Map) {
      data = [void 0, data];
      if (children === void 0) children = mapChildren;
    } else if (children === void 0) {
      children = objectChildren;
    }
    var root = new Node(data), node, nodes = [root], child, childs, i, n;
    while (node = nodes.pop()) {
      if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
        node.children = childs;
        for (i = n - 1; i >= 0; --i) {
          nodes.push(child = childs[i] = new Node(childs[i]));
          child.parent = node;
          child.depth = node.depth + 1;
        }
      }
    }
    return root.eachBefore(computeHeight);
  }
  function node_copy() {
    return hierarchy(this).eachBefore(copyData);
  }
  function objectChildren(d) {
    return d.children;
  }
  function mapChildren(d) {
    return Array.isArray(d) ? d[1] : null;
  }
  function copyData(node) {
    if (node.data.value !== void 0) node.value = node.data.value;
    node.data = node.data.data;
  }
  function computeHeight(node) {
    var height = 0;
    do
      node.height = height;
    while ((node = node.parent) && node.height < ++height);
  }
  function Node(data) {
    this.data = data;
    this.depth = this.height = 0;
    this.parent = null;
  }
  Node.prototype = hierarchy.prototype = {
    constructor: Node,
    count: count_default,
    each: each_default,
    eachAfter: eachAfter_default,
    eachBefore: eachBefore_default,
    find: find_default,
    sum: sum_default,
    sort: sort_default,
    path: path_default,
    ancestors: ancestors_default,
    descendants: descendants_default,
    leaves: leaves_default,
    links: links_default,
    copy: node_copy,
    [Symbol.iterator]: iterator_default
  };

  // node_modules/d3-hierarchy/src/tree.js
  function defaultSeparation(a, b) {
    return a.parent === b.parent ? 1 : 2;
  }
  function nextLeft(v) {
    var children = v.children;
    return children ? children[0] : v.t;
  }
  function nextRight(v) {
    var children = v.children;
    return children ? children[children.length - 1] : v.t;
  }
  function moveSubtree(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }
  function executeShifts(v) {
    var shift = 0, change = 0, children = v.children, i = children.length, w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }
  function nextAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }
  function TreeNode(node, i) {
    this._ = node;
    this.parent = null;
    this.children = null;
    this.A = null;
    this.a = this;
    this.z = 0;
    this.m = 0;
    this.c = 0;
    this.s = 0;
    this.t = null;
    this.i = i;
  }
  TreeNode.prototype = Object.create(Node.prototype);
  function treeRoot(root) {
    var tree = new TreeNode(root, 0), node, nodes = [tree], child, children, i, n;
    while (node = nodes.pop()) {
      if (children = node._.children) {
        node.children = new Array(n = children.length);
        for (i = n - 1; i >= 0; --i) {
          nodes.push(child = node.children[i] = new TreeNode(children[i], i));
          child.parent = node;
        }
      }
    }
    (tree.parent = new TreeNode(null, 0)).children = [tree];
    return tree;
  }
  function tree_default() {
    var separation = defaultSeparation, dx = 1, dy = 1, nodeSize = null;
    function tree(root) {
      var t = treeRoot(root);
      t.eachAfter(firstWalk), t.parent.m = -t.z;
      t.eachBefore(secondWalk);
      if (nodeSize) root.eachBefore(sizeNode);
      else {
        var left = root, right = root, bottom = root;
        root.eachBefore(function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var s = left === right ? 1 : separation(left, right) / 2, tx = s - left.x, kx = dx / (right.x + s + tx), ky = dy / (bottom.depth || 1);
        root.eachBefore(function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }
      return root;
    }
    function firstWalk(v) {
      var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
      if (children) {
        executeShifts(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
        while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
          vom = nextLeft(vom);
          vop = nextRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !nextRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !nextLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
    function sizeNode(node) {
      node.x *= dx;
      node.y = node.depth * dy;
    }
    tree.separation = function(x) {
      return arguments.length ? (separation = x, tree) : separation;
    };
    tree.size = function(x) {
      return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : nodeSize ? null : [dx, dy];
    };
    tree.nodeSize = function(x) {
      return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : nodeSize ? [dx, dy] : null;
    };
    return tree;
  }

  // src/core/hierarquia.js
  function opcoesDeHierarquia(secao = "Dados") {
    return {
      formatoDaHierarquia: {
        type: "string",
        label: "Como a hierarquia est\xE1 montada",
        section: secao,
        display: "select",
        default: "auto",
        values: listaDeValores([
          { rotulo: "Detectar sozinho", valor: "auto" },
          { rotulo: "Uma dimens\xE3o por n\xEDvel", valor: "niveis" },
          { rotulo: "Pares id / superior", valor: "paiFilho" }
        ])
      },
      rotuloDaRaiz: {
        type: "string",
        label: "Nome do n\xF3 raiz (quando h\xE1 v\xE1rias ra\xEDzes)",
        section: secao,
        default: "Total"
      },
      profundidadeMaxima: {
        type: "number",
        label: "Profundidade m\xE1xima (0 = toda a \xE1rvore)",
        section: secao,
        display: "range",
        min: 0,
        max: 12,
        step: 1,
        default: 0
      }
    };
  }
  function opcoesDinamicasDeHierarquia(modelo) {
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    if (dimensoes.length < 2) return {};
    return {
      ...opcaoDeEscolhaDeCampo("campoDoId", "Campo do ID (formato id/superior)", dimensoes, {
        secao: "Dados",
        incluirNenhum: true,
        padrao: ""
      }),
      ...opcaoDeEscolhaDeCampo("campoDoPai", "Campo do superior (formato id/superior)", dimensoes, {
        secao: "Dados",
        incluirNenhum: true,
        padrao: ""
      }),
      ...opcaoDeEscolhaDeCampo("campoDoNome", "Campo do nome a exibir", dimensoes, {
        secao: "Dados",
        incluirNenhum: true,
        padrao: ""
      }),
      ...medidas.length ? opcaoDeEscolhaDeCampo("campoDoValor", "Medida do tamanho", medidas, {
        secao: "Dados",
        padrao: medidas[0].nome
      }) : {}
    };
  }
  function detectarFormato(modelo) {
    if (modelo.dimensoes.length < 2) return "niveis";
    for (const candidatoDeId of modelo.dimensoes) {
      const ids = /* @__PURE__ */ new Set();
      for (const linha of modelo.linhas) {
        const v = modelo.valorBruto(linha, candidatoDeId.nome);
        if (v !== null && v !== void 0) ids.add(String(v));
      }
      if (ids.size !== modelo.linhas.length) continue;
      for (const candidatoDePai of modelo.dimensoes) {
        if (candidatoDePai.nome === candidatoDeId.nome) continue;
        let apontam = 0;
        let preenchidos = 0;
        for (const linha of modelo.linhas) {
          const v = modelo.valorBruto(linha, candidatoDePai.nome);
          if (v === null || v === void 0 || v === "") continue;
          preenchidos += 1;
          if (ids.has(String(v))) apontam += 1;
        }
        if (preenchidos > 0 && apontam === preenchidos) {
          return "paiFilho";
        }
      }
    }
    return "niveis";
  }
  function construirHierarquia(modelo, config = {}) {
    const formato = config.formatoDaHierarquia && config.formatoDaHierarquia !== "auto" ? config.formatoDaHierarquia : detectarFormato(modelo);
    const campoDoValor = modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    const resultado = formato === "paiFilho" ? deParesIdPai(modelo, config, campoDoValor) : deNiveis(modelo, config, campoDoValor);
    if (!resultado.raiz) {
      return { ...resultado, formato, campoDoValor, quantidadeDeNos: 0 };
    }
    const profundidade = Number(config.profundidadeMaxima) || 0;
    if (profundidade > 0) podar(resultado.raiz, profundidade);
    const raiz = hierarchy(resultado.raiz, (no) => no.filhos).sum((no) => no.filhos && no.filhos.length ? 0 : no.valor || 0).sort((a, b) => (b.value || 0) - (a.value || 0));
    return {
      raiz,
      avisos: resultado.avisos,
      formato,
      campoDoValor,
      quantidadeDeNos: raiz.descendants().length
    };
  }
  function novoNo(chave, rotulo, indiceDaLinha = -1) {
    return { chave, rotulo, valor: 0, filhos: [], indiceDaLinha };
  }
  function deNiveis(modelo, config, campoDoValor) {
    const avisos = [];
    const niveis = modelo.dimensoes;
    if (!niveis.length) return { raiz: null, avisos: ["A hierarquia precisa de pelo menos uma dimens\xE3o."] };
    const raiz = novoNo("__raiz__", config.rotuloDaRaiz || "Total");
    const porCaminho = /* @__PURE__ */ new Map([["", raiz]]);
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      let caminho = "";
      let pai = raiz;
      for (const nivel of niveis) {
        const texto = modelo.texto(linha, nivel.nome, void 0, "");
        if (!texto) break;
        caminho += `\0${texto}`;
        let no = porCaminho.get(caminho);
        if (!no) {
          no = novoNo(caminho, texto, i);
          no.campo = nivel;
          porCaminho.set(caminho, no);
          pai.filhos.push(no);
        }
        pai = no;
      }
      if (campoDoValor && pai !== raiz) {
        const v = modelo.valorNumerico(linha, campoDoValor.nome);
        if (v !== null) pai.valor += v;
      }
    }
    if (!raiz.filhos.length) avisos.push("Nenhuma linha preencheu os n\xEDveis da hierarquia.");
    return { raiz, avisos };
  }
  function deParesIdPai(modelo, config, campoDoValor) {
    const avisos = [];
    const { campoDoId, campoDoPai, campoDoNome } = escolherCampos(modelo, config);
    if (!campoDoId || !campoDoPai) {
      return {
        raiz: null,
        avisos: ["N\xE3o encontrei os campos de ID e de superior. Escolha-os na se\xE7\xE3o Dados."]
      };
    }
    const porId = /* @__PURE__ */ new Map();
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      const id = modelo.valorBruto(linha, campoDoId.nome);
      if (id === null || id === void 0 || id === "") continue;
      const chave = String(id);
      const rotulo = campoDoNome ? modelo.texto(linha, campoDoNome.nome, void 0, chave) : modelo.texto(linha, campoDoId.nome, void 0, chave);
      const no = novoNo(chave, rotulo, i);
      no.campo = campoDoNome || campoDoId;
      if (campoDoValor) {
        const v = modelo.valorNumerico(linha, campoDoValor.nome);
        if (v !== null) no.valor = v;
      }
      const pai = modelo.valorBruto(linha, campoDoPai.nome);
      no.chaveDoPai = pai === null || pai === void 0 || pai === "" ? null : String(pai);
      porId.set(chave, no);
    }
    if (!porId.size) return { raiz: null, avisos: ["Nenhuma linha tem ID preenchido."] };
    const semPai = [];
    const paisInexistentes = /* @__PURE__ */ new Set();
    for (const no of porId.values()) {
      if (no.chaveDoPai === null) {
        semPai.push(no);
        continue;
      }
      const pai = porId.get(no.chaveDoPai);
      if (!pai) {
        paisInexistentes.add(no.chaveDoPai);
        semPai.push(no);
        continue;
      }
      pai.filhos.push(no);
    }
    if (paisInexistentes.size) {
      avisos.push(
        `${paisInexistentes.size} n\xF3(s) apontam para um superior que n\xE3o est\xE1 na consulta; eles foram pendurados na raiz para n\xE3o sumirem do gr\xE1fico.`
      );
    }
    const cortados = cortarCiclos(porId, semPai);
    if (cortados.length) {
      avisos.push(
        `${cortados.length} liga\xE7\xE3o(\xF5es) formavam um ciclo (um n\xF3 era superior de si mesmo) e foram desfeitas.`
      );
    }
    if (!semPai.length) {
      return { raiz: null, avisos: avisos.concat(["Todos os n\xF3s t\xEAm superior: a hierarquia n\xE3o tem raiz."]) };
    }
    if (semPai.length === 1) return { raiz: semPai[0], avisos };
    const raiz = novoNo("__raiz__", config.rotuloDaRaiz || "Total");
    raiz.filhos = semPai;
    return { raiz, avisos };
  }
  function escolherCampos(modelo, config) {
    const achar = (nome) => modelo.dimensoes.find((d) => d.nome === nome) || null;
    let campoDoId = achar(config.campoDoId);
    let campoDoPai = achar(config.campoDoPai);
    const campoDoNome = achar(config.campoDoNome);
    if (campoDoId && campoDoPai) return { campoDoId, campoDoPai, campoDoNome };
    for (const candidatoDeId of modelo.dimensoes) {
      const ids = new Set(
        modelo.linhas.map((l) => {
          const v = modelo.valorBruto(l, candidatoDeId.nome);
          return v === null || v === void 0 ? null : String(v);
        })
      );
      if (ids.size !== modelo.linhas.length) continue;
      for (const candidatoDePai of modelo.dimensoes) {
        if (candidatoDePai.nome === candidatoDeId.nome) continue;
        let apontam = 0;
        let preenchidos = 0;
        for (const linha of modelo.linhas) {
          const v = modelo.valorBruto(linha, candidatoDePai.nome);
          if (v === null || v === void 0 || v === "") continue;
          preenchidos += 1;
          if (ids.has(String(v))) apontam += 1;
        }
        if (preenchidos > 0 && apontam === preenchidos) {
          campoDoId = campoDoId || candidatoDeId;
          campoDoPai = campoDoPai || candidatoDePai;
          const nome = campoDoNome || modelo.dimensoes.find((d) => d.nome !== campoDoId.nome && d.nome !== campoDoPai.nome) || null;
          return { campoDoId, campoDoPai, campoDoNome: nome };
        }
      }
    }
    return { campoDoId, campoDoPai, campoDoNome };
  }
  function cortarCiclos(porId, raizes) {
    const cortados = [];
    const visitados = /* @__PURE__ */ new Set();
    const percorrer = (no, caminho) => {
      if (caminho.has(no.chave)) {
        cortados.push(no.chave);
        return false;
      }
      caminho.add(no.chave);
      visitados.add(no.chave);
      no.filhos = no.filhos.filter((filho) => percorrer(filho, caminho));
      caminho.delete(no.chave);
      return true;
    };
    for (const raiz of raizes) percorrer(raiz, /* @__PURE__ */ new Set());
    for (const no of porId.values()) {
      if (visitados.has(no.chave)) continue;
      cortados.push(no.chave);
      no.filhos = [];
      no.chaveDoPai = null;
      raizes.push(no);
      visitados.add(no.chave);
    }
    return cortados;
  }
  function podar(no, profundidadeMaxima, nivel = 0) {
    if (nivel >= profundidadeMaxima) {
      no.valor = somarSubarvore(no);
      no.filhos = [];
      return;
    }
    for (const filho of no.filhos) podar(filho, profundidadeMaxima, nivel + 1);
  }
  function somarSubarvore(no) {
    let soma = no.valor || 0;
    for (const filho of no.filhos) soma += somarSubarvore(filho);
    return soma;
  }

  // src/charts/org_chart/index.js
  var CSS = `
.oc-area{position:relative;width:100%;height:100%;overflow:auto;}
.oc-cartao{cursor:pointer;}
.oc-ligacao{fill:none;}
.oc-texto{pointer-events:none;}
.oc-botao{cursor:pointer;}
.oc-dica{position:absolute;left:8px;bottom:6px;font-size:10px;opacity:.65;pointer-events:none;}
`;
  var index_default = defineViz({
    id: "org_chart",
    label: "Organograma",
    opcoes: montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeHierarquia(),
      {
        orientacao: {
          type: "string",
          label: "Dire\xE7\xE3o",
          section: "Organograma",
          display: "select",
          default: "cima",
          values: listaDeValores([
            { rotulo: "De cima para baixo", valor: "cima" },
            { rotulo: "Da esquerda para a direita", valor: "esquerda" }
          ])
        },
        larguraDoCartao: {
          type: "number",
          label: "Largura do cart\xE3o (px)",
          section: "Organograma",
          display: "range",
          min: 70,
          max: 320,
          step: 10,
          default: 150
        },
        alturaDoCartao: {
          type: "number",
          label: "Altura do cart\xE3o (px)",
          section: "Organograma",
          display: "range",
          min: 30,
          max: 160,
          step: 5,
          default: 56
        },
        espacoEntreNiveis: {
          type: "number",
          label: "Espa\xE7o entre n\xEDveis (px)",
          section: "Organograma",
          display: "range",
          min: 20,
          max: 200,
          step: 10,
          default: 60
        },
        espacoEntreIrmaos: {
          type: "number",
          label: "Espa\xE7o entre cart\xF5es vizinhos (px)",
          section: "Organograma",
          display: "range",
          min: 4,
          max: 80,
          step: 2,
          default: 16
        },
        raioDoCartao: {
          type: "number",
          label: "Arredondamento do cart\xE3o (px)",
          section: "Organograma",
          display: "range",
          min: 0,
          max: 20,
          step: 1,
          default: 6
        },
        permitirRecolher: {
          type: "boolean",
          label: "Recolher uma \xE1rea clicando no cart\xE3o",
          section: "Organograma",
          default: true
        },
        comecarRecolhidoAPartirDe: {
          type: "number",
          label: "Come\xE7ar recolhido a partir do n\xEDvel (0 = tudo aberto)",
          section: "Organograma",
          display: "range",
          min: 0,
          max: 8,
          step: 1,
          default: 0
        },
        mostrarValorNoCartao: {
          type: "boolean",
          label: "Mostrar o valor dentro do cart\xE3o",
          section: "R\xF3tulos",
          default: true
        },
        mostrarContagemDeEquipe: {
          type: "boolean",
          label: "Mostrar quantos descendentes cada cart\xE3o tem",
          section: "R\xF3tulos",
          default: true
        },
        preencherCartao: {
          type: "boolean",
          label: "Cart\xE3o preenchido com a cor do ramo",
          section: "Cores",
          default: false
        }
      }
    ),
    exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },
    opcoesDinamicas({ modelo }) {
      const saida = opcoesDinamicasDeHierarquia(modelo);
      const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
      if (dimensoes.length > 1) {
        Object.assign(
          saida,
          opcaoDeEscolhaDeCampo("campoDoCargo", "Campo da segunda linha do cart\xE3o", dimensoes, {
            secao: "R\xF3tulos",
            incluirNenhum: true,
            padrao: ""
          })
        );
      }
      return saida;
    },
    render(ctx) {
      const { modelo, config, tema, raiz: elementoRaiz, largura, altura } = ctx;
      const { raiz, avisos, campoDoValor, quantidadeDeNos } = construirHierarquia(modelo, config);
      for (const aviso of avisos) ctx.avisar(aviso);
      if (!raiz || quantidadeDeNos < 2) {
        ctx.mostrarVazio(
          "N\xE3o consegui montar o organograma. Use um par de campos id/superior (ou v\xE1rias dimens\xF5es, uma por n\xEDvel) e confira a se\xE7\xE3o Dados."
        );
        return;
      }
      if (!ctx.estado.recolhidos) ctx.estado.recolhidos = /* @__PURE__ */ new Set();
      const recolhidos = ctx.estado.recolhidos;
      const nivelInicial = Number(config.comecarRecolhidoAPartirDe) || 0;
      if (nivelInicial > 0 && !ctx.estado.recolhimentoInicialAplicado) {
        for (const no of raiz.descendants()) {
          if (no.depth >= nivelInicial && no.children && no.children.length) {
            recolhidos.add(caminhoDoNo(no));
          }
        }
        ctx.estado.recolhimentoInicialAplicado = true;
      }
      const caminhoPorDados = /* @__PURE__ */ new Map();
      const completosPorCaminho = /* @__PURE__ */ new Map();
      for (const no of raiz.descendants()) {
        const caminho = caminhoDoNo(no);
        caminhoPorDados.set(no.data, caminho);
        completosPorCaminho.set(caminho, {
          valor: no.value || 0,
          descendentes: no.descendants().length - 1,
          filhos: no.children ? no.children.length : 0
        });
      }
      const visivel = hierarchy(raiz.data, (dados) => {
        const caminho = caminhoPorDados.get(dados);
        return caminho && recolhidos.has(caminho) ? null : dados.filhos;
      }).sum((no) => no.filhos && no.filhos.length ? 0 : no.valor || 0).sort((a, b) => (b.value || 0) - (a.value || 0));
      ctx.limparRaiz();
      injetarEstilo(elementoRaiz, CSS, "oc");
      const area = criarEl("div", { classe: "oc-area", pai: elementoRaiz });
      const larguraDoCartao = Number(config.larguraDoCartao) || 150;
      const alturaDoCartao = Number(config.alturaDoCartao) || 56;
      const entreNiveis = Number(config.espacoEntreNiveis) || 60;
      const entreIrmaos = Number(config.espacoEntreIrmaos) || 16;
      const deCimaParaBaixo = (config.orientacao || "cima") === "cima";
      const layout = tree_default().nodeSize(
        deCimaParaBaixo ? [larguraDoCartao + entreIrmaos, alturaDoCartao + entreNiveis] : [alturaDoCartao + entreIrmaos, larguraDoCartao + entreNiveis]
      );
      layout(visivel);
      const nos = visivel.descendants();
      const xs = nos.map((n) => deCimaParaBaixo ? n.x : n.y);
      const ys = nos.map((n) => deCimaParaBaixo ? n.y : n.x);
      const margem = 24;
      const minX = Math.min(...xs) - larguraDoCartao / 2 - margem;
      const maxX = Math.max(...xs) + larguraDoCartao / 2 + margem;
      const minY = Math.min(...ys) - alturaDoCartao / 2 - margem;
      const maxY = Math.max(...ys) + alturaDoCartao / 2 + margem;
      const larguraDoDesenho = Math.max(largura, maxX - minX);
      const alturaDoDesenho = Math.max(altura, maxY - minY);
      const svg = criarSvgEl("svg", {
        pai: area,
        atributos: {
          width: larguraDoDesenho,
          height: alturaDoDesenho,
          viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
        }
      });
      const paleta = coresDaPaleta(config.paleta);
      const corPorRamo = /* @__PURE__ */ new Map();
      (visivel.children || []).forEach((filho, i) => corPorRamo.set(filho, paleta[i % paleta.length]));
      const corDo = (no) => {
        if (!no.parent) return config.corUnica || tema.textoSuave;
        let atual = no;
        while (atual.parent && atual.parent.parent) atual = atual.parent;
        return corPorRamo.get(atual) || paleta[0] || tema.destaque;
      };
      const formatar = formatadorDeValueFormat(campoDoValor && campoDoValor.valueFormat, {
        casas: Number(config.casasDecimaisDoRotulo) || 0
      });
      const posicaoDe = (no) => deCimaParaBaixo ? { x: no.x, y: no.y } : { x: no.y, y: no.x };
      const grupoDeLigacoes = criarSvgEl("g", { pai: svg });
      for (const no of nos) {
        if (!no.parent) continue;
        const pai = posicaoDe(no.parent);
        const filho = posicaoDe(no);
        criarSvgEl("path", {
          pai: grupoDeLigacoes,
          classe: "oc-ligacao",
          atributos: {
            d: cotovelo(pai, filho, deCimaParaBaixo, alturaDoCartao, larguraDoCartao),
            stroke: comOpacidade(corDo(no), 0.55),
            "stroke-width": 1.5
          }
        });
      }
      const tooltip = config.mostrarTooltip === false ? null : criarTooltip(elementoRaiz, tema);
      ctx.estado.tooltip = tooltip;
      const campoDoCargo = modelo.dimensoes.find((d) => d.nome === config.campoDoCargo) || null;
      for (const no of nos) {
        const { x, y } = posicaoDe(no);
        const cor = corDo(no);
        const caminho = caminhoPorDados.get(no.data) || caminhoDoNo(no);
        const completo = completosPorCaminho.get(caminho) || {
          valor: no.value || 0,
          descendentes: 0,
          filhos: 0
        };
        const estaRecolhido = recolhidos.has(caminho);
        const grupo = criarSvgEl("g", { pai: svg, classe: "oc-cartao" });
        const preenchido = config.preencherCartao === true;
        criarSvgEl("rect", {
          pai: grupo,
          atributos: {
            x: x - larguraDoCartao / 2,
            y: y - alturaDoCartao / 2,
            width: larguraDoCartao,
            height: alturaDoCartao,
            rx: Number(config.raioDoCartao) || 0,
            fill: preenchido ? cor : tema.fundoElevado,
            stroke: cor,
            "stroke-width": 1.5
          }
        });
        const corDoTexto = preenchido ? textoLegivelSobre(cor, tema) : tema.texto;
        const linhasDeTexto = [];
        linhasDeTexto.push({ texto: no.data.rotulo, peso: "600", tamanho: Math.max(9, tema.tamanhoBase) });
        if (campoDoCargo && no.data.indiceDaLinha >= 0) {
          const cargo = modelo.texto(modelo.linhas[no.data.indiceDaLinha], campoDoCargo.nome, void 0, "");
          if (cargo) linhasDeTexto.push({ texto: cargo, peso: "400", tamanho: Math.max(8, tema.tamanhoBase - 2) });
        }
        const extras = [];
        if (config.mostrarValorNoCartao !== false && campoDoValor) extras.push(formatar(completo.valor));
        if (config.mostrarContagemDeEquipe !== false && completo.descendentes > 0) {
          extras.push(`${completo.descendentes} abaixo`);
        }
        if (extras.length) {
          linhasDeTexto.push({ texto: extras.join(" \xB7 "), peso: "400", tamanho: Math.max(8, tema.tamanhoBase - 2), suave: true });
        }
        const alturaDaLinha = alturaDoCartao / (linhasDeTexto.length + 0.6);
        linhasDeTexto.forEach((linha, i) => {
          const el = criarSvgEl("text", {
            pai: grupo,
            classe: "oc-texto",
            atributos: {
              x,
              y: y - alturaDoCartao / 2 + alturaDaLinha * (i + 0.9),
              "text-anchor": "middle",
              "dominant-baseline": "central",
              "font-size": linha.tamanho,
              "font-weight": linha.peso,
              fill: linha.suave && !preenchido ? tema.textoSuave : corDoTexto
            }
          });
          definirTexto(el, truncar(linha.texto, Math.floor(larguraDoCartao / (linha.tamanho * 0.56))));
        });
        if (config.permitirRecolher !== false && completo.filhos > 0) {
          const bx = deCimaParaBaixo ? x : x + larguraDoCartao / 2;
          const by = deCimaParaBaixo ? y + alturaDoCartao / 2 : y;
          const botao = criarSvgEl("g", { pai: grupo, classe: "oc-botao" });
          criarSvgEl("circle", {
            pai: botao,
            atributos: { cx: bx, cy: by, r: 8, fill: tema.fundoElevado, stroke: cor, "stroke-width": 1.5 }
          });
          const sinal = criarSvgEl("text", {
            pai: botao,
            classe: "oc-texto",
            atributos: {
              x: bx,
              y: by,
              "text-anchor": "middle",
              "dominant-baseline": "central",
              "font-size": 11,
              "font-weight": "700",
              fill: cor
            }
          });
          definirTexto(sinal, estaRecolhido ? `+${completo.filhos}` : "\u2212");
          if (estaRecolhido) sinal.setAttribute("font-size", 8);
          ctx.eventos.on(botao, "click", (ev) => {
            ev.stopPropagation();
            if (recolhidos.has(caminho)) recolhidos.delete(caminho);
            else recolhidos.add(caminho);
            ctx.redesenhar();
          });
        }
        if (tooltip) {
          ctx.eventos.on(grupo, "pointerenter", (ev) => {
            const linhas = [];
            if (campoDoValor) linhas.push({ rotulo: campoDoValor.rotuloCurto, valor: formatar(completo.valor), cor });
            linhas.push({ rotulo: "N\xEDvel", valor: String(no.depth) });
            if (completo.filhos) linhas.push({ rotulo: "Subordinados diretos", valor: String(completo.filhos) });
            if (completo.descendentes) linhas.push({ rotulo: "Total abaixo", valor: String(completo.descendentes) });
            tooltip.mostrar({ titulo: no.data.rotulo, linhas }, ev.clientX, ev.clientY);
          });
          ctx.eventos.on(grupo, "pointermove", (ev) => tooltip.mover(ev.clientX, ev.clientY));
          ctx.eventos.on(grupo, "pointerleave", () => tooltip.esconder());
        }
        ctx.eventos.on(grupo, "click", (ev) => {
          if (no.data.indiceDaLinha < 0 || !no.data.campo) return;
          const celula = modelo.celula(modelo.linhas[no.data.indiceDaLinha], no.data.campo.nome);
          if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
        });
      }
      if (recolhidos.size) {
        const dica = criarEl("div", { classe: "oc-dica", pai: elementoRaiz });
        dica.style.color = tema.textoSuave;
        definirTexto(dica, `${recolhidos.size} \xE1rea(s) recolhida(s) \u2014 clique no + para abrir`);
      }
    },
    aoDestruir({ estado }) {
      if (estado && estado.tooltip) estado.tooltip.destruir();
    }
  });
  function caminhoDoNo(no) {
    return no.ancestors().reverse().map((n) => n.data.chave).join("\0");
  }
  function cotovelo(pai, filho, deCimaParaBaixo, alturaDoCartao, larguraDoCartao) {
    if (deCimaParaBaixo) {
      const y1 = pai.y + alturaDoCartao / 2;
      const y2 = filho.y - alturaDoCartao / 2;
      const meio2 = (y1 + y2) / 2;
      return `M${pai.x},${y1}V${meio2.toFixed(2)}H${filho.x}V${y2}`;
    }
    const x1 = pai.x + larguraDoCartao / 2;
    const x2 = filho.x - larguraDoCartao / 2;
    const meio = (x1 + x2) / 2;
    return `M${x1},${pai.y}H${meio.toFixed(2)}V${filho.y}H${x2}`;
  }
})();
