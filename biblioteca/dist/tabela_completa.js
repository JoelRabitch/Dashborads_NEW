/*!
 * Tabela Completa — visualização customizada para o Looker
 * id: tabela_completa
 * versão: 0.1.0 | build: 2026-10-22 01:29:15 | commit: 5687ece
 *
 * Arquivo AUTOCONTIDO: no Looker, o campo "Dependencies" deve ficar VAZIO.
 * Gerado por biblioteca/build/build.mjs — não edite este arquivo à mão;
 * edite src/charts/tabela_completa/index.js e rode `npm run build`.
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
  function criarPonte(instancia, opcoesEstaticas2) {
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
        const completas = Object.assign({}, opcoesEstaticas2 || {}, dinamicas);
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
  function sanitizarChave(texto) {
    return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
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

  // src/charts/tabela_completa/opcoes.js
  var REGRAS_POR_COLUNA = 3;
  var MAXIMO_DE_COLUNAS_CONFIGURAVEIS = 20;
  var TIPOS_DE_CELULA = [
    { rotulo: "Autom\xE1tico (texto ou n\xFAmero)", valor: "auto" },
    { rotulo: "Texto", valor: "texto" },
    { rotulo: "N\xFAmero", valor: "numero" },
    { rotulo: "Barra de dados", valor: "barraDeDados" },
    { rotulo: "Barra de progresso (%)", valor: "progresso" },
    { rotulo: "Anel de progresso (%)", valor: "anel" },
    { rotulo: "Medidor pequeno", valor: "medidor" },
    { rotulo: "Sparkline (lista de valores)", valor: "sparkline" },
    { rotulo: "Mini barras (lista de valores)", valor: "miniBarras" },
    { rotulo: "Mini \xE1rea (lista de valores)", valor: "miniArea" },
    { rotulo: "Badge colorido", valor: "badge" },
    { rotulo: "Sem\xE1foro", valor: "semaforo" },
    { rotulo: "Seta de varia\xE7\xE3o (\u25B2\u25BC)", valor: "seta" },
    { rotulo: "Estrelas", valor: "estrelas" },
    { rotulo: "Booleano (\u2713/\u2717)", valor: "booleano" },
    { rotulo: "Avatar com iniciais", valor: "avatar" },
    { rotulo: "Imagem (URL)", valor: "imagem" },
    { rotulo: "Link", valor: "link" },
    { rotulo: "Data", valor: "data" }
  ];
  var CONDICOES = [
    { rotulo: "\u2014 sem regra \u2014", valor: "nenhuma" },
    { rotulo: "Maior que", valor: "maior" },
    { rotulo: "Maior ou igual a", valor: "maiorIgual" },
    { rotulo: "Menor que", valor: "menor" },
    { rotulo: "Menor ou igual a", valor: "menorIgual" },
    { rotulo: "Igual a", valor: "igual" },
    { rotulo: "Diferente de", valor: "diferente" },
    { rotulo: "Entre (valor e valor 2)", valor: "entre" },
    { rotulo: "Fora do intervalo", valor: "fora" },
    { rotulo: "Cont\xE9m o texto", valor: "contem" },
    { rotulo: "Come\xE7a com", valor: "comecaCom" },
    { rotulo: "\xC9 nulo/vazio", valor: "nulo" },
    { rotulo: "Est\xE1 no Top N", valor: "topN" },
    { rotulo: "Est\xE1 no Bottom N", valor: "bottomN" },
    { rotulo: "Acima da m\xE9dia", valor: "acimaDaMedia" },
    { rotulo: "Abaixo da m\xE9dia", valor: "abaixoDaMedia" },
    { rotulo: "Acima do percentil N", valor: "acimaDoPercentil" },
    { rotulo: "Maior que outra coluna", valor: "maiorQueColuna" },
    { rotulo: "Menor que outra coluna", valor: "menorQueColuna" }
  ];
  var ACOES_DE_REGRA = [
    { rotulo: "Cor de fundo", valor: "fundo" },
    { rotulo: "Cor do texto", valor: "texto" },
    { rotulo: "Negrito", valor: "negrito" },
    { rotulo: "Fundo + texto branco", valor: "fundoETexto" },
    { rotulo: "\xCDcone antes do valor", valor: "icone" },
    { rotulo: "Badge", valor: "badge" },
    { rotulo: "Borda \xE0 esquerda", valor: "borda" },
    { rotulo: "Piscar (alerta)", valor: "piscar" }
  ];
  var ICONES_DE_REGRA = [
    { rotulo: "\u25B2 subiu", valor: "subiu" },
    { rotulo: "\u25BC desceu", valor: "desceu" },
    { rotulo: "\u25CF bolinha", valor: "bolinha" },
    { rotulo: "\u2605 estrela", valor: "estrela" },
    { rotulo: "\u26A0 aten\xE7\xE3o", valor: "atencao" },
    { rotulo: "\u2713 ok", valor: "ok" },
    { rotulo: "\u2717 erro", valor: "erro" }
  ];
  function opcoesEstaticas() {
    return montarOpcoes(
      blocoDeTema(),
      blocoAvancado(),
      {
        // ---------- Estrutura ----------
        agruparPor: {
          type: "string",
          label: "Agrupar linhas por",
          section: "Dados",
          display: "select",
          default: "nenhum",
          values: listaDeValores([
            { rotulo: "N\xE3o agrupar", valor: "nenhum" },
            { rotulo: "1\xAA dimens\xE3o", valor: "1" },
            { rotulo: "1\xAA e 2\xAA dimens\xF5es", valor: "2" },
            { rotulo: "1\xAA, 2\xAA e 3\xAA dimens\xF5es", valor: "3" }
          ])
        },
        gruposComecamAbertos: {
          type: "boolean",
          label: "Grupos come\xE7am abertos",
          section: "Dados",
          default: true
        },
        mostrarSubtotais: {
          type: "boolean",
          label: "Mostrar subtotal por grupo",
          section: "Dados",
          default: true
        },
        transporPivo: {
          type: "boolean",
          label: "Transpor (valores do piv\xF4 viram linhas)",
          section: "Dados",
          default: false
        },
        mostrarTotalDeLinha: {
          type: "boolean",
          label: "Mostrar coluna de total por linha (quando pivotado)",
          section: "Dados",
          default: true
        },
        ordenacaoInicial: {
          type: "string",
          label: "Ordena\xE7\xE3o inicial",
          section: "Dados",
          display: "select",
          default: "original",
          values: listaDeValores([
            { rotulo: "Como veio da consulta", valor: "original" },
            { rotulo: "1\xAA medida (maior primeiro)", valor: "medidaDesc" },
            { rotulo: "1\xAA medida (menor primeiro)", valor: "medidaAsc" },
            { rotulo: "1\xAA dimens\xE3o (A\u2192Z)", valor: "dimensaoAsc" },
            { rotulo: "1\xAA dimens\xE3o (Z\u2192A)", valor: "dimensaoDesc" }
          ])
        },
        tratamentoDeNulos: {
          type: "string",
          label: "Valores nulos",
          section: "Dados",
          display: "select",
          default: "manter",
          values: listaDeValores([
            { rotulo: "Mostrar o texto de nulo", valor: "manter" },
            { rotulo: "Mostrar como vazio", valor: "vazio" },
            { rotulo: "Mostrar como zero", valor: "zero" }
          ])
        },
        textoParaNulo: { type: "string", label: "Texto para valor nulo", section: "Dados", default: "\u2205" },
        // ---------- Formato / layout ----------
        densidade: {
          type: "string",
          label: "Densidade",
          section: "Formato",
          display: "select",
          default: "normal",
          values: listaDeValores([
            { rotulo: "Compacta", valor: "compacta" },
            { rotulo: "Normal", valor: "normal" },
            { rotulo: "Confort\xE1vel", valor: "confortavel" }
          ])
        },
        alturaDaLinha: {
          type: "number",
          label: "Altura da linha (px) \u2014 0 usa a densidade",
          section: "Formato",
          display: "range",
          min: 0,
          max: 80,
          step: 1,
          default: 0
        },
        alturaDoCabecalho: {
          type: "number",
          label: "Altura do cabe\xE7alho (px) \u2014 0 usa a densidade",
          section: "Formato",
          display: "range",
          min: 0,
          max: 90,
          step: 1,
          default: 0
        },
        larguraPadraoDaColuna: {
          type: "number",
          label: "Largura padr\xE3o das colunas (px)",
          section: "Formato",
          display: "range",
          min: 60,
          max: 400,
          step: 10,
          default: 130
        },
        larguraDasDimensoes: {
          type: "number",
          label: "Largura das colunas de dimens\xE3o (px)",
          section: "Formato",
          display: "range",
          min: 80,
          max: 500,
          step: 10,
          default: 180
        },
        colunasFixasAEsquerda: {
          type: "number",
          label: "Quantas colunas ficam fixas \xE0 esquerda",
          section: "Formato",
          display: "range",
          min: 0,
          max: 5,
          step: 1,
          default: 1
        },
        cabecalhoFixo: { type: "boolean", label: "Cabe\xE7alho fixo ao rolar", section: "Formato", default: true },
        rodapeFixo: { type: "boolean", label: "Totais fixos no rodap\xE9", section: "Formato", default: true },
        quebrarTexto: {
          type: "string",
          label: "Texto que n\xE3o cabe",
          section: "Formato",
          display: "select",
          default: "truncar",
          values: listaDeValores([
            { rotulo: "Truncar com retic\xEAncias", valor: "truncar" },
            { rotulo: "Quebrar linha", valor: "quebrar" }
          ])
        },
        cabecalhoVertical: {
          type: "boolean",
          label: "Cabe\xE7alho com texto na vertical",
          section: "Formato",
          default: false
        },
        mostrarNumeroDaLinha: {
          type: "boolean",
          label: "Mostrar n\xFAmero da linha",
          section: "Formato",
          default: false
        },
        // ---------- Totais ----------
        mostrarTotais: { type: "boolean", label: "Mostrar linha de totais", section: "Dados", default: true },
        agregacaoDoTotal: {
          type: "string",
          label: "Como calcular os totais (quando o Looker n\xE3o envia)",
          section: "Dados",
          display: "select",
          default: "soma",
          values: listaDeValores([
            { rotulo: "Soma", valor: "soma" },
            { rotulo: "M\xE9dia", valor: "media" },
            { rotulo: "M\xEDnimo", valor: "minimo" },
            { rotulo: "M\xE1ximo", valor: "maximo" },
            { rotulo: "Contagem", valor: "contagem" },
            { rotulo: "Contagem distinta", valor: "contagemDistinta" },
            { rotulo: "Mediana", valor: "mediana" }
          ])
        },
        rotuloDoTotal: { type: "string", label: "R\xF3tulo da linha de totais", section: "Dados", default: "Total" },
        // ---------- Aparência ----------
        estiloDaTabela: {
          type: "string",
          label: "Estilo",
          section: "Tema",
          display: "select",
          default: "claro",
          values: listaDeValores([
            { rotulo: "Claro", valor: "claro" },
            { rotulo: "Escuro", valor: "escuro" },
            { rotulo: "Cinza", valor: "cinza" },
            { rotulo: "Minimal (sem bordas)", valor: "minimal" },
            { rotulo: "Cart\xE3o", valor: "cartao" },
            { rotulo: "Zebra", valor: "zebra" },
            { rotulo: "Compacto", valor: "compacto" },
            { rotulo: "Planilha", valor: "planilha" }
          ])
        },
        corDoCabecalho: { type: "string", label: "Fundo do cabe\xE7alho", section: "Tema", display: "color", default: "" },
        corDoTextoDoCabecalho: { type: "string", label: "Texto do cabe\xE7alho", section: "Tema", display: "color", default: "" },
        corDaZebra: { type: "string", label: "Cor das linhas alternadas", section: "Tema", display: "color", default: "" },
        corDoHover: { type: "string", label: "Cor ao passar o mouse", section: "Tema", display: "color", default: "" },
        corDaSelecao: { type: "string", label: "Cor da linha selecionada", section: "Tema", display: "color", default: "" },
        mostrarBordasVerticais: { type: "boolean", label: "Bordas verticais", section: "Tema", default: true },
        mostrarBordasHorizontais: { type: "boolean", label: "Bordas horizontais", section: "Tema", default: true },
        raioDaBorda: {
          type: "number",
          label: "Arredondamento (px)",
          section: "Tema",
          display: "range",
          min: 0,
          max: 16,
          step: 1,
          default: 0
        },
        // ---------- Interação ----------
        permitirOrdenar: { type: "boolean", label: "Ordenar clicando no cabe\xE7alho", section: "Intera\xE7\xE3o", default: true },
        mostrarBusca: { type: "boolean", label: "Mostrar caixa de busca", section: "Intera\xE7\xE3o", default: true },
        permitirSelecionarLinhas: {
          type: "boolean",
          label: "Selecionar linhas (clique) e somar",
          section: "Intera\xE7\xE3o",
          default: true
        },
        destacarLinhaEColuna: {
          type: "boolean",
          label: "Destacar linha e coluna sob o mouse",
          section: "Intera\xE7\xE3o",
          default: true
        },
        permitirRedimensionarColunas: {
          type: "boolean",
          label: "Redimensionar colunas arrastando",
          section: "Intera\xE7\xE3o",
          default: true
        },
        permitirDrill: { type: "boolean", label: "Drill ao clicar na c\xE9lula", section: "Intera\xE7\xE3o", default: true },
        permitirExportarCsv: { type: "boolean", label: "Bot\xE3o de exportar CSV", section: "Intera\xE7\xE3o", default: true },
        permitirCopiar: { type: "boolean", label: "Permitir copiar (Ctrl+C / menu)", section: "Intera\xE7\xE3o", default: true },
        linhasPorPagina: {
          type: "number",
          label: "Linhas por p\xE1gina (0 = rolagem cont\xEDnua)",
          section: "Intera\xE7\xE3o",
          display: "range",
          min: 0,
          max: 500,
          step: 10,
          default: 0
        },
        // ---------- Animação específica da tabela ----------
        animarEntradaDasLinhas: {
          type: "boolean",
          label: "Animar entrada das linhas",
          section: "Anima\xE7\xE3o",
          default: true
        },
        animarMudancaDeValor: {
          type: "boolean",
          label: "Piscar quando o valor mudar entre atualiza\xE7\xF5es",
          section: "Anima\xE7\xE3o",
          default: true
        },
        corDeSubida: { type: "string", label: "Cor quando o valor sobe", section: "Anima\xE7\xE3o", display: "color", default: "#16A34A" },
        corDeDescida: { type: "string", label: "Cor quando o valor desce", section: "Anima\xE7\xE3o", display: "color", default: "#DC2626" }
      }
    );
  }
  function opcoesPorColuna(colunas, colunasNumericas = []) {
    const saida = {};
    const limite = Math.min(colunas.length, MAXIMO_DE_COLUNAS_CONFIGURAVEIS);
    for (let i = 0; i < limite; i++) {
      const coluna = colunas[i];
      const chave = sanitizarChave(coluna.id);
      const secao = `Coluna: ${coluna.rotulo}`.slice(0, 48);
      saida[`col_${chave}_visivel`] = {
        type: "boolean",
        label: "Mostrar esta coluna",
        section: secao,
        default: true
      };
      saida[`col_${chave}_rotulo`] = {
        type: "string",
        label: "Renomear para",
        section: secao,
        default: "",
        placeholder: coluna.rotulo
      };
      saida[`col_${chave}_largura`] = {
        type: "number",
        label: "Largura (px, 0 = padr\xE3o)",
        section: secao,
        display: "range",
        min: 0,
        max: 500,
        step: 10,
        default: 0
      };
      saida[`col_${chave}_alinhamento`] = {
        type: "string",
        label: "Alinhamento",
        section: secao,
        display: "select",
        default: "auto",
        values: listaDeValores([
          { rotulo: "Autom\xE1tico", valor: "auto" },
          { rotulo: "Esquerda", valor: "left" },
          { rotulo: "Centro", valor: "center" },
          { rotulo: "Direita", valor: "right" }
        ])
      };
      saida[`col_${chave}_tipoDeCelula`] = {
        type: "string",
        label: "Tipo de c\xE9lula",
        section: secao,
        display: "select",
        default: "auto",
        values: listaDeValores(TIPOS_DE_CELULA)
      };
      saida[`col_${chave}_corDoTexto`] = {
        type: "string",
        label: "Cor do texto",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      };
      saida[`col_${chave}_corDeFundo`] = {
        type: "string",
        label: "Cor de fundo",
        section: secao,
        display: "color",
        default: "",
        display_size: "half"
      };
      saida[`col_${chave}_prefixo`] = {
        type: "string",
        label: "Prefixo",
        section: secao,
        default: "",
        display_size: "half"
      };
      saida[`col_${chave}_sufixo`] = {
        type: "string",
        label: "Sufixo",
        section: secao,
        default: "",
        display_size: "half"
      };
      if (coluna.ehMedida) {
        saida[`col_${chave}_formato`] = {
          type: "string",
          label: "Formato do n\xFAmero",
          section: secao,
          display: "select",
          default: "auto",
          values: listaDeValores([
            { rotulo: "Autom\xE1tico (usa o do campo)", valor: "auto" },
            { rotulo: "N\xFAmero", valor: "numero" },
            { rotulo: "Compacto (K, M, B)", valor: "compacto" },
            { rotulo: "Moeda", valor: "moeda" },
            { rotulo: "Percentual", valor: "percentual" },
            { rotulo: "Cient\xEDfico", valor: "cientifico" }
          ])
        };
        saida[`col_${chave}_casasDecimais`] = {
          type: "number",
          label: "Casas decimais",
          section: secao,
          display: "range",
          min: 0,
          max: 6,
          step: 1,
          default: 2
        };
        saida[`col_${chave}_corDaBarra`] = {
          type: "string",
          label: "Cor da barra/sparkline",
          section: secao,
          display: "color",
          default: "#4276BE"
        };
      }
      for (let r = 1; r <= REGRAS_POR_COLUNA; r++) {
        saida[`col_${chave}_regra${r}`] = {
          type: "string",
          label: `Regra ${r}: condi\xE7\xE3o`,
          section: secao,
          display: "select",
          default: "nenhuma",
          values: listaDeValores(CONDICOES)
        };
        saida[`col_${chave}_regra${r}Valor`] = {
          type: "string",
          label: `Regra ${r}: valor`,
          section: secao,
          default: "",
          display_size: "half"
        };
        saida[`col_${chave}_regra${r}Valor2`] = {
          type: "string",
          label: `Regra ${r}: valor 2 (para "entre")`,
          section: secao,
          default: "",
          display_size: "half"
        };
        saida[`col_${chave}_regra${r}Acao`] = {
          type: "string",
          label: `Regra ${r}: o que fazer`,
          section: secao,
          display: "select",
          default: "fundo",
          values: listaDeValores(ACOES_DE_REGRA)
        };
        saida[`col_${chave}_regra${r}Cor`] = {
          type: "string",
          label: `Regra ${r}: cor`,
          section: secao,
          display: "color",
          default: "#FEE2E2",
          display_size: "half"
        };
        saida[`col_${chave}_regra${r}Icone`] = {
          type: "string",
          label: `Regra ${r}: \xEDcone`,
          section: secao,
          display: "select",
          default: "bolinha",
          values: listaDeValores(ICONES_DE_REGRA),
          display_size: "half"
        };
        saida[`col_${chave}_regra${r}LinhaInteira`] = {
          type: "boolean",
          label: `Regra ${r}: aplicar na linha inteira`,
          section: secao,
          default: false
        };
        if (colunasNumericas.length > 1) {
          saida[`col_${chave}_regra${r}Coluna`] = {
            type: "string",
            label: `Regra ${r}: comparar com a coluna`,
            section: secao,
            display: "select",
            default: "",
            values: [{ "(nenhuma)": "" }].concat(colunasNumericas.map((c) => ({ [c.rotulo]: c.id })))
          };
        }
      }
      if (coluna.ehMedida) {
        saida[`col_${chave}_escalaDeCor`] = {
          type: "boolean",
          label: "Escala de cor (mapa de calor) nesta coluna",
          section: secao,
          default: false
        };
        saida[`col_${chave}_escalaCorMin`] = {
          type: "string",
          label: "Escala: cor do menor valor",
          section: secao,
          display: "color",
          default: "#FFFFFF",
          display_size: "half"
        };
        saida[`col_${chave}_escalaCorMax`] = {
          type: "string",
          label: "Escala: cor do maior valor",
          section: secao,
          display: "color",
          default: "#60A5FA",
          display_size: "half"
        };
      }
    }
    return saida;
  }

  // src/charts/tabela_completa/colunas.js
  function opcaoDaColuna(config, idColuna, sufixo) {
    return config[`col_${sanitizarChave(idColuna)}_${sufixo}`];
  }
  function criarFormatador(campo, config, idColuna) {
    const formato = opcaoDaColuna(config, idColuna, "formato") || "auto";
    const casas = Number(opcaoDaColuna(config, idColuna, "casasDecimais"));
    const casasSeguras = Number.isFinite(casas) ? casas : 2;
    if (formato === "auto") {
      return formatadorDeValueFormat(campo && campo.valueFormat, { casas: casasSeguras });
    }
    return criarFormatadorNumerico({ estilo: formato, casas: casasSeguras });
  }
  function lerRegras(config, idColuna) {
    const regras = [];
    for (let r = 1; r <= REGRAS_POR_COLUNA; r++) {
      const condicao = opcaoDaColuna(config, idColuna, `regra${r}`);
      if (!condicao || condicao === "nenhuma") continue;
      regras.push({
        condicao,
        valor: opcaoDaColuna(config, idColuna, `regra${r}Valor`),
        valor2: opcaoDaColuna(config, idColuna, `regra${r}Valor2`),
        acao: opcaoDaColuna(config, idColuna, `regra${r}Acao`) || "fundo",
        cor: opcaoDaColuna(config, idColuna, `regra${r}Cor`) || "#FEE2E2",
        icone: opcaoDaColuna(config, idColuna, `regra${r}Icone`) || "bolinha",
        linhaInteira: !!opcaoDaColuna(config, idColuna, `regra${r}LinhaInteira`),
        colunaComparada: opcaoDaColuna(config, idColuna, `regra${r}Coluna`) || ""
      });
    }
    return regras;
  }
  function construirColunas(modelo, config) {
    const colunas = [];
    const larguraPadrao = Number(config.larguraPadraoDaColuna) || 130;
    const larguraDimensao = Number(config.larguraDasDimensoes) || 180;
    for (const campo of modelo.dimensoes) {
      const id = `dim__${campo.nome}`;
      colunas.push(montarColuna({
        id,
        tipo: "dimensao",
        campo,
        pivo: null,
        rotuloPadrao: campo.rotuloCurto,
        larguraPadrao: larguraDimensao,
        alinhamentoPadrao: "left",
        config,
        modelo
      }));
    }
    const gruposDePivo = [];
    if (modelo.temPivo) {
      for (const pivo of modelo.pivotsDeDados) {
        const colunasDoGrupo = [];
        for (const campo of modelo.medidas) {
          const id = `med__${campo.nome}__${pivo.chave}`;
          const coluna = montarColuna({
            id,
            tipo: "medida",
            campo,
            pivo,
            rotuloPadrao: campo.rotuloCurto,
            larguraPadrao,
            alinhamentoPadrao: "right",
            config,
            modelo
          });
          colunas.push(coluna);
          colunasDoGrupo.push(coluna);
        }
        gruposDePivo.push({ rotulo: pivo.rotulo, chave: pivo.chave, colunas: colunasDoGrupo, ehTotal: false });
      }
      if (config.mostrarTotalDeLinha !== false) {
        const colunasDoGrupo = [];
        for (const campo of modelo.medidas) {
          const id = `tot__${campo.nome}`;
          const coluna = montarColuna({
            id,
            tipo: "totalDeLinha",
            campo,
            pivo: modelo.pivoDeTotal,
            rotuloPadrao: campo.rotuloCurto,
            larguraPadrao,
            alinhamentoPadrao: "right",
            config,
            modelo
          });
          colunas.push(coluna);
          colunasDoGrupo.push(coluna);
        }
        gruposDePivo.push({
          rotulo: config.rotuloDoTotal || "Total",
          chave: "__total__",
          colunas: colunasDoGrupo,
          ehTotal: true
        });
      }
    } else {
      for (const campo of modelo.medidas) {
        const id = `med__${campo.nome}`;
        colunas.push(montarColuna({
          id,
          tipo: "medida",
          campo,
          pivo: null,
          rotuloPadrao: campo.rotuloCurto,
          larguraPadrao,
          alinhamentoPadrao: "right",
          config,
          modelo
        }));
      }
    }
    const colunasVisiveis = colunas.filter((c) => c.visivel);
    return { colunas, colunasVisiveis, temPivo: modelo.temPivo, gruposDePivo };
  }
  function montarColuna({ id, tipo, campo, pivo, rotuloPadrao, larguraPadrao, alinhamentoPadrao, config, modelo }) {
    const ehMedida = tipo !== "dimensao";
    const rotuloCustomizado = (opcaoDaColuna(config, id, "rotulo") || "").trim();
    const larguraCustomizada = Number(opcaoDaColuna(config, id, "largura"));
    const alinhamento = opcaoDaColuna(config, id, "alinhamento") || "auto";
    const visivelOpcao = opcaoDaColuna(config, id, "visivel");
    return {
      id,
      tipo,
      ehMedida,
      campo,
      pivo,
      chaveDoPivo: pivo ? pivo.chave : void 0,
      rotulo: rotuloCustomizado || rotuloPadrao,
      rotuloOriginal: rotuloPadrao,
      largura: Number.isFinite(larguraCustomizada) && larguraCustomizada > 0 ? larguraCustomizada : larguraPadrao,
      alinhamento: alinhamento === "auto" ? alinhamentoPadrao : alinhamento,
      visivel: visivelOpcao === void 0 ? true : !!visivelOpcao,
      tipoDeCelula: opcaoDaColuna(config, id, "tipoDeCelula") || "auto",
      corDoTexto: opcaoDaColuna(config, id, "corDoTexto") || "",
      corDeFundo: opcaoDaColuna(config, id, "corDeFundo") || "",
      prefixo: opcaoDaColuna(config, id, "prefixo") || "",
      sufixo: opcaoDaColuna(config, id, "sufixo") || "",
      corDaBarra: opcaoDaColuna(config, id, "corDaBarra") || "#4276BE",
      escalaDeCor: !!opcaoDaColuna(config, id, "escalaDeCor"),
      escalaCorMin: opcaoDaColuna(config, id, "escalaCorMin") || "#FFFFFF",
      escalaCorMax: opcaoDaColuna(config, id, "escalaCorMax") || "#60A5FA",
      regras: lerRegras(config, id),
      formatar: ehMedida ? criarFormatador(campo, config, id) : null,
      /** Lê o valor numérico desta coluna numa linha. */
      valorNumerico(linha) {
        if (tipo === "totalDeLinha") {
          const doLooker = modelo.totalDaLinha(linha, campo.nome);
          if (doLooker !== null) return doLooker;
          let soma = null;
          for (const p of modelo.pivotsDeDados) {
            const v = modelo.valorNumerico(linha, campo.nome, p.chave);
            if (v !== null) soma = (soma === null ? 0 : soma) + v;
          }
          return soma;
        }
        return modelo.valorNumerico(linha, campo.nome, pivo ? pivo.chave : void 0);
      },
      // Com formato "auto" preferimos o texto já renderizado pelo Looker (que
      // respeita o value_format do campo). Com formato explícito, o usuário
      // mandou: usamos o nosso formatador.
      formatoProprio: ehMedida && (opcaoDaColuna(config, id, "formato") || "auto") !== "auto",
      /** Texto de exibição desta coluna numa linha. */
      texto(linha, textoNulo) {
        if (tipo === "totalDeLinha" || this.formatoProprio) {
          const v = this.valorNumerico(linha);
          return v === null ? textoNulo : this.formatar(v);
        }
        return modelo.texto(linha, campo.nome, pivo ? pivo.chave : void 0, textoNulo);
      },
      /** Célula crua (para drill e links). */
      celula(linha) {
        if (tipo === "totalDeLinha") return void 0;
        return modelo.celula(linha, campo.nome, pivo ? pivo.chave : void 0);
      }
    };
  }
  function colunasNumericasParaOpcoes(colunas) {
    return colunas.filter((c) => c.ehMedida).map((c) => ({ id: c.id, rotulo: c.rotulo }));
  }
  function resumoDeColunas(colunas) {
    return colunas.map((c) => ({ id: c.id, rotulo: c.rotuloOriginal, ehMedida: c.ehMedida }));
  }

  // src/core/interaction.js
  function criarFiltroDeBusca(termo) {
    const t = normalizarTexto(termo);
    if (!t) return () => true;
    return (texto) => normalizarTexto(texto).includes(t);
  }
  function normalizarTexto(texto) {
    return String(texto != null ? texto : "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  // src/charts/tabela_completa/render.js
  var CSS = `
.tc-raiz{display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;}
.tc-barra{display:flex;gap:8px;align-items:center;padding:4px 6px;flex:0 0 auto;flex-wrap:wrap;}
.tc-barra input[type=search]{flex:1 1 140px;min-width:100px;padding:3px 7px;border-radius:4px;border:1px solid;font:inherit;}
.tc-barra button{padding:3px 8px;border-radius:4px;border:1px solid;background:transparent;cursor:pointer;font:inherit;font-size:11px;}
.tc-barra .tc-resumo{font-size:11px;opacity:.75;margin-left:auto;}
.tc-rolagem{flex:1 1 auto;overflow:auto;position:relative;}
.tc-tabela{border-collapse:separate;border-spacing:0;table-layout:fixed;width:max-content;min-width:100%;}
.tc-tabela th,.tc-tabela td{padding:0 8px;overflow:hidden;text-align:left;vertical-align:middle;
  white-space:nowrap;text-overflow:ellipsis;}
.tc-quebrar th,.tc-quebrar td{white-space:normal;word-break:break-word;}
.tc-tabela thead th{position:sticky;z-index:3;font-weight:600;user-select:none;}
.tc-tabela thead th.tc-fixa{z-index:5;}
.tc-tabela td.tc-fixa{position:sticky;z-index:2;}
.tc-tabela tfoot td{position:sticky;bottom:0;z-index:3;font-weight:700;}
.tc-tabela tfoot td.tc-fixa{z-index:4;}
.tc-ordenavel{cursor:pointer;}
.tc-seta{font-size:9px;opacity:.85;margin-left:3px;}
.tc-espacador td{padding:0;border:none;}
.tc-num{text-align:right;font-variant-numeric:tabular-nums;}
.tc-centro{text-align:center;}
.tc-selecionavel{cursor:pointer;}
.tc-vazio{padding:20px;text-align:center;opacity:.7;}
.tc-alca{position:absolute;top:0;right:0;width:6px;height:100%;cursor:col-resize;user-select:none;}
.tc-th-conteudo{position:relative;display:block;overflow:hidden;text-overflow:ellipsis;}
.tc-vertical .tc-th-conteudo{writing-mode:vertical-rl;transform:rotate(180deg);text-align:left;}
.tc-numero-linha{opacity:.5;font-variant-numeric:tabular-nums;}
`;
  var DENSIDADES = {
    compacta: { linha: 24, cabecalho: 28, fonte: 11 },
    normal: { linha: 32, cabecalho: 36, fonte: 12 },
    confortavel: { linha: 42, cabecalho: 46, fonte: 13 }
  };
  var ESTILOS = {
    claro: {},
    escuro: { forcarTema: "escuro" },
    cinza: { cabecalho: "#E2E8F0", zebra: "#F8FAFC" },
    minimal: { semBordas: true, cabecalho: "transparent" },
    cartao: { cartao: true },
    zebra: { zebraSempre: true },
    compacto: { densidade: "compacta" },
    planilha: { grade: true, cabecalho: "#F1F5F9" }
  };
  function resolverVisual(config, tema) {
    const estilo = ESTILOS[config.estiloDaTabela] || {};
    const densidadeNome = estilo.densidade || config.densidade || "normal";
    const d = DENSIDADES[densidadeNome] || DENSIDADES.normal;
    const alturaLinha = Number(config.alturaDaLinha) > 0 ? Number(config.alturaDaLinha) : d.linha;
    const alturaCabecalho = Number(config.alturaDoCabecalho) > 0 ? Number(config.alturaDoCabecalho) : d.cabecalho;
    const escuro = estilo.forcarTema === "escuro" || tema.nome === "escuro";
    return {
      alturaLinha,
      alturaCabecalho,
      tamanhoFonte: d.fonte,
      fundo: tema.fundo,
      texto: tema.texto,
      borda: estilo.semBordas ? "transparent" : tema.borda,
      cabecalhoFundo: config.corDoCabecalho || estilo.cabecalho || (escuro ? "#1E293B" : "#F3F4F6"),
      cabecalhoTexto: config.corDoTextoDoCabecalho || tema.texto,
      zebra: config.corDaZebra || estilo.zebra || (escuro ? "#152133" : "#FAFAFA"),
      usarZebra: !!(estilo.zebraSempre || estilo.zebra || config.corDaZebra),
      hover: config.corDoHover || (escuro ? "#243245" : "#EFF6FF"),
      selecao: config.corDaSelecao || (escuro ? "#1E3A5F" : "#DBEAFE"),
      bordasVerticais: config.mostrarBordasVerticais !== false && !estilo.semBordas,
      bordasHorizontais: config.mostrarBordasHorizontais !== false && !estilo.semBordas,
      raio: Number(config.raioDaBorda) || 0,
      grade: !!estilo.grade,
      cartao: !!estilo.cartao,
      escuro
    };
  }
  function ordenarIndices(indices, colunas, ordenacao, modelo) {
    if (!ordenacao || !ordenacao.length) return indices;
    const porId = new Map(colunas.map((c) => [c.id, c]));
    const criterios = ordenacao.map((o) => ({ coluna: porId.get(o.colunaId), direcao: o.direcao })).filter((c) => c.coluna);
    if (!criterios.length) return indices;
    const copia = indices.slice();
    copia.sort((ia, ib) => {
      for (const { coluna, direcao } of criterios) {
        const linhaA = modelo.linhas[ia];
        const linhaB = modelo.linhas[ib];
        let r;
        if (coluna.ehMedida) {
          const a = coluna.valorNumerico(linhaA);
          const b = coluna.valorNumerico(linhaB);
          r = compararNumeros(a, b);
        } else {
          const a = coluna.texto(linhaA, "");
          const b = coluna.texto(linhaB, "");
          r = compararTextos(a, b);
        }
        if (r !== 0) return direcao === "desc" ? -r : r;
      }
      return 0;
    });
    return copia;
  }
  function compararNumeros(a, b) {
    const aNulo = a === null || a === void 0 || Number.isNaN(a);
    const bNulo = b === null || b === void 0 || Number.isNaN(b);
    if (aNulo && bNulo) return 0;
    if (aNulo) return 1;
    if (bNulo) return -1;
    return a - b;
  }
  function compararTextos(a, b) {
    return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
  }
  function filtrarIndices(indices, colunas, termo, modelo) {
    if (!termo || !termo.trim()) return indices;
    const casa = criarFiltroDeBusca(termo);
    return indices.filter((i) => {
      const linha = modelo.linhas[i];
      for (const coluna of colunas) {
        if (casa(coluna.texto(linha, ""))) return true;
      }
      return false;
    });
  }
  function agregar(valores, tipo) {
    const limpos = valores.filter((v) => v !== null && v !== void 0 && Number.isFinite(v));
    if (!limpos.length) return null;
    switch (tipo) {
      case "media":
        return limpos.reduce((a, b) => a + b, 0) / limpos.length;
      case "minimo":
        return Math.min(...limpos);
      case "maximo":
        return Math.max(...limpos);
      case "contagem":
        return limpos.length;
      case "contagemDistinta":
        return new Set(limpos).size;
      case "mediana": {
        const ord = limpos.slice().sort((a, b) => a - b);
        const meio = Math.floor(ord.length / 2);
        return ord.length % 2 ? ord[meio] : (ord[meio - 1] + ord[meio]) / 2;
      }
      case "soma":
      default:
        return limpos.reduce((a, b) => a + b, 0);
    }
  }
  function desenharTabela(params) {
    const {
      ctx,
      colunas,
      gruposDePivo,
      temPivo,
      visual,
      indicesVisiveis,
      estado,
      aoOrdenar,
      aoBuscar,
      aoSelecionarLinha,
      aoRedimensionar,
      aoExportar,
      pintarCelula
    } = params;
    const { modelo, config, tema, raiz } = ctx;
    injetarEstilo(raiz, CSS, "tc");
    limpar(raiz);
    const container = criarEl("div", { classe: "tc-raiz", pai: raiz });
    container.style.background = visual.fundo;
    container.style.color = visual.texto;
    container.style.fontSize = `${visual.tamanhoFonte}px`;
    if (visual.cartao) {
      container.style.boxShadow = tema.sombra;
      container.style.borderRadius = `${Math.max(4, visual.raio)}px`;
    }
    const mostrarBarra = config.mostrarBusca !== false || config.permitirExportarCsv !== false || config.permitirSelecionarLinhas !== false;
    let resumoEl = null;
    if (mostrarBarra) {
      const barra = criarEl("div", { classe: "tc-barra", pai: container });
      if (config.mostrarBusca !== false) {
        const busca = criarEl("input", { pai: barra });
        busca.type = "search";
        busca.placeholder = "Buscar em todas as colunas\u2026";
        busca.value = estado.busca || "";
        busca.style.borderColor = visual.borda;
        busca.style.background = visual.fundo;
        busca.style.color = visual.texto;
        ctx.eventos.on(busca, "input", (ev) => aoBuscar(ev.target.value));
      }
      if (config.permitirExportarCsv !== false) {
        const botao = criarEl("button", { pai: barra, texto: "Exportar CSV" });
        botao.style.borderColor = visual.borda;
        botao.style.color = visual.texto;
        ctx.eventos.on(botao, "click", () => aoExportar());
      }
      resumoEl = criarEl("div", { classe: "tc-resumo", pai: barra });
    }
    const rolagem = criarEl("div", { classe: "tc-rolagem", pai: container });
    const tabela = criarEl("table", {
      classe: `tc-tabela${config.quebrarTexto === "quebrar" ? " tc-quebrar" : ""}${config.cabecalhoVertical ? " tc-vertical" : ""}`,
      pai: rolagem
    });
    const colunasVisiveis = colunas.filter((c) => c.visivel);
    const fixas = Math.max(0, Math.min(Number(config.colunasFixasAEsquerda) || 0, colunasVisiveis.length));
    const deslocamentos = calcularDeslocamentos(colunasVisiveis, fixas, !!config.mostrarNumeroDaLinha);
    const colgroup = criarEl("colgroup", { pai: tabela });
    if (config.mostrarNumeroDaLinha) {
      const col = criarEl("col", { pai: colgroup });
      col.style.width = "46px";
    }
    for (const coluna of colunasVisiveis) {
      const col = criarEl("col", { pai: colgroup });
      const largura = estado.larguras[coluna.id] || coluna.largura;
      col.style.width = `${largura}px`;
    }
    const thead = criarEl("thead", { pai: tabela });
    construirCabecalho({
      thead,
      colunasVisiveis,
      gruposDePivo,
      temPivo,
      visual,
      config,
      estado,
      deslocamentos,
      fixas,
      ctx,
      aoOrdenar,
      aoRedimensionar
    });
    const tbody = criarEl("tbody", { pai: tabela });
    let tfoot = null;
    if (config.mostrarTotais !== false) {
      tfoot = criarEl("tfoot", { pai: tabela });
      construirRodape({ tfoot, colunasVisiveis, indicesVisiveis, visual, config, estado, deslocamentos, fixas, modelo });
    }
    const alturaCabecalhoTotal = (temPivo ? 2 : 1) * visual.alturaCabecalho;
    const estadoDeDesenho = {
      rolagem,
      tbody,
      colunasVisiveis,
      deslocamentos,
      fixas,
      alturaCabecalhoTotal
    };
    function desenharJanela() {
      desenharLinhasVisiveis({
        ctx,
        estadoDeDesenho,
        indicesVisiveis,
        visual,
        config,
        estado,
        modelo,
        aoSelecionarLinha,
        pintarCelula
      });
      if (resumoEl) atualizarResumo(resumoEl, indicesVisiveis, estado, colunasVisiveis, modelo, config);
    }
    ctx.eventos.on(rolagem, "scroll", () => {
      estado.rolagemTopo = rolagem.scrollTop;
      estado.rolagemEsquerda = rolagem.scrollLeft;
      desenharJanela();
    });
    desenharJanela();
    if (estado.rolagemTopo) rolagem.scrollTop = estado.rolagemTopo;
    if (estado.rolagemEsquerda) rolagem.scrollLeft = estado.rolagemEsquerda;
    return { rolagem, tabela, tbody, redesenharJanela: desenharJanela };
  }
  function calcularDeslocamentos(colunasVisiveis, fixas, temNumeroDeLinha) {
    const saida = /* @__PURE__ */ new Map();
    let acumulado = temNumeroDeLinha ? 46 : 0;
    for (let i = 0; i < colunasVisiveis.length; i++) {
      if (i < fixas) {
        saida.set(colunasVisiveis[i].id, acumulado);
        acumulado += colunasVisiveis[i].largura;
      }
    }
    saida.set("__numeroDeLinha__", 0);
    return saida;
  }
  function aplicarEstiloDeCabecalho(th, visual, config, topo) {
    th.style.background = visual.cabecalhoFundo;
    th.style.color = visual.cabecalhoTexto;
    th.style.height = `${visual.alturaCabecalho}px`;
    th.style.borderBottom = `2px solid ${visual.borda}`;
    if (visual.bordasVerticais) th.style.borderRight = `1px solid ${visual.borda}`;
    th.style.top = config.cabecalhoFixo === false ? "" : `${topo}px`;
    if (config.cabecalhoFixo === false) th.style.position = "static";
  }
  function construirCabecalho({
    thead,
    colunasVisiveis,
    gruposDePivo,
    temPivo,
    visual,
    config,
    estado,
    deslocamentos,
    fixas,
    ctx,
    aoOrdenar,
    aoRedimensionar
  }) {
    if (temPivo) {
      const trGrupo = criarEl("tr", { pai: thead });
      if (config.mostrarNumeroDaLinha) {
        const th = criarEl("th", { pai: trGrupo });
        th.rowSpan = 2;
        aplicarEstiloDeCabecalho(th, visual, config, 0);
      }
      colunasVisiveis.forEach((coluna, i) => {
        if (coluna.tipo !== "dimensao") return;
        const th = criarThDeColuna({ coluna, indice: i, topo: 0, visual, config, estado, deslocamentos, fixas, ctx, aoOrdenar, aoRedimensionar });
        th.rowSpan = 2;
        trGrupo.appendChild(th);
      });
      for (const grupo of gruposDePivo) {
        const visiveisDoGrupo = grupo.colunas.filter((c) => c.visivel);
        if (!visiveisDoGrupo.length) continue;
        const th = criarEl("th", { pai: trGrupo, classe: "tc-centro" });
        th.colSpan = visiveisDoGrupo.length;
        aplicarEstiloDeCabecalho(th, visual, config, 0);
        criarEl("span", { classe: "tc-th-conteudo", texto: grupo.rotulo, pai: th });
        th.title = grupo.rotulo;
      }
    }
    const tr = criarEl("tr", { pai: thead });
    const topo = temPivo ? visual.alturaCabecalho : 0;
    if (config.mostrarNumeroDaLinha && !temPivo) {
      const th = criarEl("th", { pai: tr, texto: "#" });
      aplicarEstiloDeCabecalho(th, visual, config, topo);
    }
    for (let i = 0; i < colunasVisiveis.length; i++) {
      const coluna = colunasVisiveis[i];
      if (temPivo && coluna.tipo === "dimensao") continue;
      tr.appendChild(
        criarThDeColuna({ coluna, indice: i, topo, visual, config, estado, deslocamentos, fixas, ctx, aoOrdenar, aoRedimensionar })
      );
    }
  }
  function criarThDeColuna({ coluna, indice, topo, visual, config, estado, deslocamentos, fixas, ctx, aoOrdenar, aoRedimensionar }) {
    const th = criarEl("th");
    aplicarEstiloDeCabecalho(th, visual, config, topo);
    th.style.textAlign = coluna.alinhamento;
    if (indice < fixas) {
      th.classList.add("tc-fixa");
      th.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
      th.style.position = "sticky";
    }
    const conteudo = criarEl("span", { classe: "tc-th-conteudo", pai: th });
    definirTexto(conteudo, coluna.rotulo);
    th.title = coluna.rotuloOriginal;
    const posicao = (estado.ordenacao || []).findIndex((o) => o.colunaId === coluna.id);
    if (posicao >= 0) {
      const o = estado.ordenacao[posicao];
      const seta = criarEl("span", { classe: "tc-seta", pai: conteudo });
      definirTexto(seta, `${o.direcao === "desc" ? "\u25BC" : "\u25B2"}${estado.ordenacao.length > 1 ? ` ${posicao + 1}` : ""}`);
    }
    if (config.permitirOrdenar !== false) {
      th.classList.add("tc-ordenavel");
      ctx.eventos.on(th, "click", (ev) => aoOrdenar(coluna.id, ev.shiftKey));
    }
    if (config.permitirRedimensionarColunas !== false) {
      const alca = criarEl("div", { classe: "tc-alca", pai: th });
      let larguraInicial = 0;
      let xInicial = 0;
      ctx.eventos.on(alca, "pointerdown", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        larguraInicial = estado.larguras[coluna.id] || coluna.largura;
        xInicial = ev.clientX;
        try {
          alca.setPointerCapture(ev.pointerId);
        } catch (_) {
        }
      });
      ctx.eventos.on(alca, "pointermove", (ev) => {
        if (!larguraInicial) return;
        aoRedimensionar(coluna.id, Math.max(50, larguraInicial + (ev.clientX - xInicial)));
      });
      ctx.eventos.on(alca, "pointerup", (ev) => {
        larguraInicial = 0;
        try {
          alca.releasePointerCapture(ev.pointerId);
        } catch (_) {
        }
      });
    }
    return th;
  }
  function construirRodape({ tfoot, colunasVisiveis, indicesVisiveis, visual, config, estado, deslocamentos, fixas, modelo }) {
    const tr = criarEl("tr", { pai: tfoot });
    const formatadorSimples = criarFormatadorNumerico({ estilo: "auto", casas: 2 });
    if (config.mostrarNumeroDaLinha) {
      const td = criarEl("td", { pai: tr });
      estiloDeRodape(td, visual, config);
    }
    let primeiraDimensao = true;
    for (let i = 0; i < colunasVisiveis.length; i++) {
      const coluna = colunasVisiveis[i];
      const td = criarEl("td", { pai: tr });
      estiloDeRodape(td, visual, config);
      td.style.textAlign = coluna.alinhamento;
      if (i < fixas) {
        td.classList.add("tc-fixa");
        td.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
        td.style.position = config.rodapeFixo === false ? "sticky" : "sticky";
      }
      if (coluna.ehMedida) {
        const doLooker = modelo.totais.encontrados ? modelo.totais.porCampo[coluna.campo.nome] : null;
        let valor = null;
        if (doLooker && !coluna.chaveDoPivo) {
          valor = doLooker.value !== void 0 ? Number(doLooker.value) : null;
        }
        if (valor === null || !Number.isFinite(valor)) {
          const valores = indicesVisiveis.map((idx) => coluna.valorNumerico(modelo.linhas[idx]));
          valor = agregar(valores, config.agregacaoDoTotal || "soma");
        }
        definirTexto(td, valor === null ? "" : coluna.formatar ? coluna.formatar(valor) : formatadorSimples(valor));
      } else if (primeiraDimensao) {
        definirTexto(td, config.rotuloDoTotal || "Total");
        primeiraDimensao = false;
      }
    }
  }
  function estiloDeRodape(td, visual, config) {
    td.style.background = visual.cabecalhoFundo;
    td.style.color = visual.cabecalhoTexto;
    td.style.height = `${visual.alturaLinha}px`;
    td.style.borderTop = `2px solid ${visual.borda}`;
    if (visual.bordasVerticais) td.style.borderRight = `1px solid ${visual.borda}`;
    if (config.rodapeFixo === false) td.style.position = "static";
  }
  function desenharLinhasVisiveis({
    ctx,
    estadoDeDesenho,
    indicesVisiveis,
    visual,
    config,
    estado,
    modelo,
    aoSelecionarLinha,
    pintarCelula
  }) {
    const { rolagem, tbody, colunasVisiveis, deslocamentos, fixas, alturaCabecalhoTotal } = estadoDeDesenho;
    const alturaLinha = visual.alturaLinha;
    const total = indicesVisiveis.length;
    limpar(tbody);
    if (!total) {
      const tr = criarEl("tr", { pai: tbody });
      const td = criarEl("td", { pai: tr, classe: "tc-vazio" });
      td.colSpan = colunasVisiveis.length + (config.mostrarNumeroDaLinha ? 1 : 0);
      definirTexto(td, estado.busca ? "Nenhuma linha encontrada para a busca." : config.textoSemDados || "Sem dados para exibir");
      return;
    }
    const margem = 10;
    const alturaUtil = rolagem.clientHeight || 400;
    const deslocamento = Math.max(0, (rolagem.scrollTop || 0) - alturaCabecalhoTotal);
    let inicio = Math.max(0, Math.floor(deslocamento / alturaLinha) - margem);
    let fim = Math.min(total, inicio + Math.ceil(alturaUtil / alturaLinha) + margem * 2);
    const porPagina = Number(config.linhasPorPagina) || 0;
    if (porPagina > 0) {
      const pagina = estado.pagina || 0;
      inicio = pagina * porPagina;
      fim = Math.min(total, inicio + porPagina);
    }
    if (inicio > 0) tbody.appendChild(linhaEspacadora(inicio * alturaLinha, colunasVisiveis.length + 1));
    for (let i = inicio; i < fim; i++) {
      const indiceDaLinha = indicesVisiveis[i];
      const linha = modelo.linhas[indiceDaLinha];
      const tr = criarEl("tr", { pai: tbody });
      tr.style.height = `${alturaLinha}px`;
      const selecionada = estado.selecionadas.has(indiceDaLinha);
      const zebrada = visual.usarZebra && i % 2 === 1;
      const fundoBase = selecionada ? visual.selecao : zebrada ? visual.zebra : "transparent";
      if (fundoBase !== "transparent") tr.style.background = fundoBase;
      if (config.permitirSelecionarLinhas !== false) {
        tr.classList.add("tc-selecionavel");
        ctx.eventos.on(tr, "click", (ev) => {
          aoSelecionarLinha(indiceDaLinha, ev.ctrlKey || ev.metaKey || ev.shiftKey);
        });
      }
      if (config.destacarLinhaEColuna !== false) {
        ctx.eventos.on(tr, "pointerenter", () => {
          tr.style.background = visual.hover;
        });
        ctx.eventos.on(tr, "pointerleave", () => {
          tr.style.background = fundoBase === "transparent" ? "" : fundoBase;
        });
      }
      if (config.mostrarNumeroDaLinha) {
        const td = criarEl("td", { pai: tr, classe: "tc-numero-linha" });
        estiloDeCelula(td, visual, config);
        definirTexto(td, String(i + 1));
      }
      for (let c = 0; c < colunasVisiveis.length; c++) {
        const coluna = colunasVisiveis[c];
        const td = criarEl("td", { pai: tr });
        estiloDeCelula(td, visual, config);
        td.style.textAlign = coluna.alinhamento;
        if (coluna.ehMedida) td.classList.add("tc-num");
        if (c < fixas) {
          td.classList.add("tc-fixa");
          td.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
          td.style.background = fundoBase === "transparent" ? visual.fundo : fundoBase;
        }
        pintarCelula({ td, coluna, linha, indiceDaLinha, visual, posicaoNaJanela: i });
      }
    }
    if (fim < total && porPagina <= 0) {
      tbody.appendChild(linhaEspacadora((total - fim) * alturaLinha, colunasVisiveis.length + 1));
    }
  }
  function linhaEspacadora(altura, colSpan) {
    const tr = document.createElement("tr");
    tr.className = "tc-espacador";
    tr.style.height = `${altura}px`;
    const td = document.createElement("td");
    td.colSpan = colSpan;
    tr.appendChild(td);
    return tr;
  }
  function estiloDeCelula(td, visual, config) {
    td.style.height = `${visual.alturaLinha}px`;
    if (visual.bordasHorizontais) td.style.borderBottom = `1px solid ${visual.borda}`;
    if (visual.bordasVerticais) td.style.borderRight = `1px solid ${visual.borda}`;
  }
  function atualizarResumo(resumoEl, indicesVisiveis, estado, colunasVisiveis, modelo, config) {
    const partes = [`${indicesVisiveis.length.toLocaleString("pt-BR")} linha(s)`];
    if (estado.selecionadas.size) {
      partes.push(`${estado.selecionadas.size} selecionada(s)`);
      const primeiraMedida = colunasVisiveis.find((c) => c.ehMedida);
      if (primeiraMedida) {
        const valores = Array.from(estado.selecionadas).map((i) => primeiraMedida.valorNumerico(modelo.linhas[i]));
        const soma = agregar(valores, "soma");
        if (soma !== null) {
          partes.push(`soma de ${primeiraMedida.rotulo}: ${primeiraMedida.formatar ? primeiraMedida.formatar(soma) : soma}`);
        }
      }
    }
    definirTexto(resumoEl, partes.join(" \xB7 "));
  }
  function montarCsv(colunasVisiveis, indicesVisiveis, modelo, textoNulo) {
    const escapar = (v) => {
      const t = v === null || v === void 0 ? "" : String(v);
      return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const linhas = [colunasVisiveis.map((c) => escapar(c.rotulo)).join(";")];
    for (const indice of indicesVisiveis) {
      const linha = modelo.linhas[indice];
      linhas.push(colunasVisiveis.map((c) => escapar(c.texto(linha, textoNulo))).join(";"));
    }
    return linhas.join("\n");
  }

  // src/charts/tabela_completa/index.js
  function ordenacaoInicial(config, colunas) {
    const escolha = config.ordenacaoInicial || "original";
    if (escolha === "original") return [];
    const primeiraMedida = colunas.find((c) => c.ehMedida);
    const primeiraDimensao = colunas.find((c) => !c.ehMedida);
    if (escolha === "medidaDesc" && primeiraMedida) return [{ colunaId: primeiraMedida.id, direcao: "desc" }];
    if (escolha === "medidaAsc" && primeiraMedida) return [{ colunaId: primeiraMedida.id, direcao: "asc" }];
    if (escolha === "dimensaoAsc" && primeiraDimensao) return [{ colunaId: primeiraDimensao.id, direcao: "asc" }];
    if (escolha === "dimensaoDesc" && primeiraDimensao) return [{ colunaId: primeiraDimensao.id, direcao: "desc" }];
    return [];
  }
  function prepararEstado(estado, config, colunas) {
    if (!estado.larguras) estado.larguras = {};
    if (!estado.selecionadas) estado.selecionadas = /* @__PURE__ */ new Set();
    if (estado.busca === void 0) estado.busca = "";
    if (estado.pagina === void 0) estado.pagina = 0;
    if (!estado.ordenacao || estado.assinaturaDaOrdenacao !== config.ordenacaoInicial) {
      estado.ordenacao = ordenacaoInicial(config, colunas);
      estado.assinaturaDaOrdenacao = config.ordenacaoInicial;
    }
    const ids = new Set(colunas.map((c) => c.id));
    estado.ordenacao = estado.ordenacao.filter((o) => ids.has(o.colunaId));
    return estado;
  }
  function textoParaNulo(config) {
    if (config.tratamentoDeNulos === "vazio") return "";
    if (config.tratamentoDeNulos === "zero") return "0";
    return config.textoParaNulo || "\u2205";
  }
  function criarPintorDeCelula(ctx, nulo) {
    const { config, ponte } = ctx;
    return function pintarCelula({ td, coluna, linha }) {
      if (coluna.corDoTexto) td.style.color = coluna.corDoTexto;
      if (coluna.corDeFundo) td.style.background = coluna.corDeFundo;
      const texto = coluna.texto(linha, nulo);
      const comAfixos = texto === "" ? "" : `${coluna.prefixo}${texto}${coluna.sufixo}`;
      definirTexto(td, comAfixos);
      td.title = comAfixos;
      if (config.permitirDrill === false) return;
      const celula = coluna.celula(linha);
      if (celula && ponte.temDrill(celula)) {
        td.style.cursor = "pointer";
        td.style.textDecoration = "underline dotted";
        ctx.eventos.on(td, "click", (ev) => {
          ev.stopPropagation();
          ponte.abrirDrill(celula, ev);
        });
      }
    };
  }
  function baixarCsv(conteudo, nomeDoArquivo) {
    if (typeof Blob !== "function" || typeof URL === "undefined" || !URL.createObjectURL) return;
    const blob = new Blob([`\uFEFF${conteudo}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const ancora = criarEl("a");
    ancora.href = url;
    ancora.download = nomeDoArquivo;
    ancora.style.display = "none";
    document.body.appendChild(ancora);
    ancora.click();
    document.body.removeChild(ancora);
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  var index_default = defineViz({
    id: "tabela_completa",
    label: "Tabela Completa",
    opcoes: opcoesEstaticas(),
    // A tabela aceita praticamente qualquer consulta: com ou sem pivô, só
    // dimensões, só medidas ou os dois.
    exigencia: { aceitaPivo: true, exigeLinhas: true },
    opcoesDinamicas({ modelo, config }) {
      const { colunas } = construirColunas(modelo, config);
      return opcoesPorColuna(resumoDeColunas(colunas), colunasNumericasParaOpcoes(colunas));
    },
    render(ctx) {
      const { modelo, config, tema, estado } = ctx;
      if (!modelo.quantidadeDeLinhas) {
        ctx.mostrarVazio();
        return;
      }
      const { colunas, colunasVisiveis, temPivo, gruposDePivo } = construirColunas(modelo, config);
      if (!colunasVisiveis.length) {
        ctx.mostrarVazio("Todas as colunas est\xE3o ocultas. Reative pelo menos uma no painel.");
        return;
      }
      if (colunas.length > MAXIMO_DE_COLUNAS_CONFIGURAVEIS) {
        ctx.avisar(
          `A tabela tem ${colunas.length} colunas; s\xF3 as ${MAXIMO_DE_COLUNAS_CONFIGURAVEIS} primeiras t\xEAm op\xE7\xF5es pr\xF3prias no painel.`
        );
      }
      if (config.mostrarTotais !== false && !modelo.totais.encontrados) {
        ctx.avisar("O Looker n\xE3o enviou os totais; a linha de totais \xE9 calculada pela visualiza\xE7\xE3o.");
      }
      prepararEstado(estado, config, colunas);
      const visual = resolverVisual(config, tema);
      const nulo = textoParaNulo(config);
      const pintarCelula = criarPintorDeCelula(ctx, nulo);
      function calcularIndices() {
        const todos = modelo.linhas.map((_, i) => i);
        const filtrados = filtrarIndices(todos, colunasVisiveis, estado.busca, modelo);
        return ordenarIndices(filtrados, colunas, estado.ordenacao, modelo);
      }
      let indicesVisiveis = calcularIndices();
      function redesenhar() {
        indicesVisiveis = calcularIndices();
        desenhar();
      }
      function desenhar() {
        ctx.eventos.limpar();
        desenharTabela({
          ctx,
          colunas,
          gruposDePivo,
          temPivo,
          visual,
          indicesVisiveis,
          estado,
          pintarCelula,
          aoOrdenar(colunaId, acumular) {
            const atual = estado.ordenacao.find((o) => o.colunaId === colunaId);
            if (!acumular) {
              const direcao = atual && atual.direcao === "asc" ? "desc" : "asc";
              estado.ordenacao = [{ colunaId, direcao }];
            } else if (atual) {
              if (atual.direcao === "asc") atual.direcao = "desc";
              else estado.ordenacao = estado.ordenacao.filter((o) => o.colunaId !== colunaId);
            } else {
              estado.ordenacao.push({ colunaId, direcao: "asc" });
            }
            estado.rolagemTopo = 0;
            redesenhar();
          },
          aoBuscar(termo) {
            estado.busca = termo;
            estado.pagina = 0;
            estado.rolagemTopo = 0;
            redesenhar();
          },
          aoSelecionarLinha(indice, acumular) {
            if (!acumular) {
              const soEssa = estado.selecionadas.size === 1 && estado.selecionadas.has(indice);
              estado.selecionadas.clear();
              if (!soEssa) estado.selecionadas.add(indice);
            } else if (estado.selecionadas.has(indice)) {
              estado.selecionadas.delete(indice);
            } else {
              estado.selecionadas.add(indice);
            }
            desenhar();
          },
          aoRedimensionar(colunaId, largura) {
            estado.larguras[colunaId] = largura;
            const coluna = colunas.find((c) => c.id === colunaId);
            if (coluna) coluna.largura = largura;
            desenhar();
          },
          aoExportar() {
            baixarCsv(montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo), "tabela_completa.csv");
          }
        });
      }
      desenhar();
    }
  });
})();
