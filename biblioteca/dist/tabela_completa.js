/*!
 * Tabela Completa — visualização customizada para o Looker
 * id: tabela_completa
 * versão: 0.1.0
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
        const juntas = Object.assign({}, opcoesEstaticas2 || {}, dinamicas);
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
        return instancia && instancia._blOpcoesRegistradas || opcoesEstaticas2 || {};
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
  function urlDeImagemSegura(valor, { permitirExternas = true } = {}) {
    if (typeof valor !== "string") return null;
    const limpo = valor.trim();
    if (/^data:image\//i.test(limpo)) return limpo;
    if (/^https?:\/\//i.test(limpo)) return permitirExternas ? limpo : null;
    return null;
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
  function normalizarTexto(texto) {
    return String(texto != null ? texto : "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }
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
    const pilha2 = [alvo];
    const atual = () => pilha2[pilha2.length - 1];
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
        if (pilha2.length > 1 && atual().tagName.toLowerCase() === nome) pilha2.pop();
      } else {
        const novo = document.createElement(nome);
        atual().appendChild(novo);
        if (m[3] !== "/") pilha2.push(novo);
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
    const copiar2 = (origem, destino) => {
      for (const no of Array.from(origem.childNodes)) {
        if (no.nodeType === 3) destino.appendChild(document.createTextNode(no.nodeValue));
        else if (no.nodeType === 1) {
          const nome = no.tagName.toLowerCase();
          if (TAGS_DO_HTML_DO_LOOKER.has(nome)) {
            const novo = document.createElement(nome);
            destino.appendChild(novo);
            copiar2(no, novo);
          } else {
            copiar2(no, destino);
          }
        }
      }
    };
    copiar2(doc.body, pai);
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

  // src/core/scales.js
  function misturarCores(a, b, t) {
    return rgb_default(a, b)(Math.max(0, Math.min(1, t)));
  }

  // src/charts/tabela_completa/regras.js
  var ICONES = {
    subiu: "\u25B2",
    desceu: "\u25BC",
    bolinha: "\u25CF",
    estrela: "\u2605",
    atencao: "\u26A0",
    ok: "\u2713",
    erro: "\u2717"
  };
  function numeroOuNulo2(valor) {
    if (valor === null || valor === void 0 || valor === "") return null;
    const n = Number(String(valor).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  var PRECISA_DE_ESTATISTICA = /* @__PURE__ */ new Set([
    "topN",
    "bottomN",
    "acimaDaMedia",
    "abaixoDaMedia",
    "acimaDoPercentil"
  ]);
  function prepararRegras(colunas, indices, modelo, tiposQuePrecisamDaColuna = /* @__PURE__ */ new Set()) {
    const contextos2 = /* @__PURE__ */ new Map();
    for (const coluna of colunas) {
      const tipoPrecisa = tiposQuePrecisamDaColuna.has(coluna.tipoDeCelula);
      if (!coluna.regras.length && !coluna.escalaDeCor && !tipoPrecisa) continue;
      const precisaDeValores = coluna.escalaDeCor || tipoPrecisa || coluna.regras.some((r) => PRECISA_DE_ESTATISTICA.has(r.condicao));
      const ctx = { minimo: null, maximo: null, media: null, corteTopN: /* @__PURE__ */ new Map(), percentis: /* @__PURE__ */ new Map() };
      if (precisaDeValores) {
        const valores2 = [];
        for (const i of indices) {
          const v = coluna.valorNumerico(modelo.linhas[i]);
          if (v !== null && Number.isFinite(v)) valores2.push(v);
        }
        if (valores2.length) {
          const ordenados = valores2.slice().sort((a, b) => a - b);
          ctx.minimo = ordenados[0];
          ctx.maximo = ordenados[ordenados.length - 1];
          ctx.media = valores2.reduce((a, b) => a + b, 0) / valores2.length;
          ctx.ordenados = ordenados;
        }
      }
      for (const regra of coluna.regras) {
        if (!ctx.ordenados) break;
        const n = numeroOuNulo2(regra.valor);
        if (n === null || n <= 0) continue;
        const ord = ctx.ordenados;
        if (regra.condicao === "topN") {
          ctx.corteTopN.set(regra, ord[Math.max(0, ord.length - Math.min(n, ord.length))]);
        } else if (regra.condicao === "bottomN") {
          ctx.corteTopN.set(regra, ord[Math.min(ord.length, n) - 1]);
        } else if (regra.condicao === "acimaDoPercentil") {
          const p = Math.min(100, Math.max(0, n)) / 100;
          ctx.percentis.set(regra, ord[Math.min(ord.length - 1, Math.floor(p * (ord.length - 1)))]);
        }
      }
      contextos2.set(coluna.id, ctx);
    }
    return contextos2;
  }
  function regraBate(regra, { valorNumerico, texto, coluna, linha, porId, ctx }) {
    const alvo = numeroOuNulo2(regra.valor);
    const alvo2 = numeroOuNulo2(regra.valor2);
    switch (regra.condicao) {
      case "nulo":
        return valorNumerico === null && !texto;
      case "contem":
        return !!regra.valor && texto.toLowerCase().includes(String(regra.valor).toLowerCase());
      case "comecaCom":
        return !!regra.valor && texto.toLowerCase().startsWith(String(regra.valor).toLowerCase());
      case "igual":
        return alvo !== null ? valorNumerico === alvo : texto === String(regra.valor);
      case "diferente":
        return alvo !== null ? valorNumerico !== alvo : texto !== String(regra.valor);
      default:
        break;
    }
    if (valorNumerico === null) return false;
    switch (regra.condicao) {
      case "maior":
        return alvo !== null && valorNumerico > alvo;
      case "maiorIgual":
        return alvo !== null && valorNumerico >= alvo;
      case "menor":
        return alvo !== null && valorNumerico < alvo;
      case "menorIgual":
        return alvo !== null && valorNumerico <= alvo;
      case "entre":
        return alvo !== null && alvo2 !== null && valorNumerico >= Math.min(alvo, alvo2) && valorNumerico <= Math.max(alvo, alvo2);
      case "fora":
        return alvo !== null && alvo2 !== null && (valorNumerico < Math.min(alvo, alvo2) || valorNumerico > Math.max(alvo, alvo2));
      case "acimaDaMedia":
        return ctx.media !== null && valorNumerico > ctx.media;
      case "abaixoDaMedia":
        return ctx.media !== null && valorNumerico < ctx.media;
      case "topN": {
        const corte = ctx.corteTopN.get(regra);
        return corte !== void 0 && valorNumerico >= corte;
      }
      case "bottomN": {
        const corte = ctx.corteTopN.get(regra);
        return corte !== void 0 && valorNumerico <= corte;
      }
      case "acimaDoPercentil": {
        const corte = ctx.percentis.get(regra);
        return corte !== void 0 && valorNumerico > corte;
      }
      case "maiorQueColuna":
      case "menorQueColuna": {
        const outra = porId.get(regra.colunaComparada);
        if (!outra || outra.id === coluna.id) return false;
        const v = outra.valorNumerico(linha);
        if (v === null) return false;
        return regra.condicao === "maiorQueColuna" ? valorNumerico > v : valorNumerico < v;
      }
      default:
        return false;
    }
  }
  function avaliarRegras({ coluna, linha, contextos: contextos2, porId, textoDaCelula }) {
    if (!coluna.regras.length) return null;
    const ctx = contextos2.get(coluna.id);
    if (!ctx) return null;
    const valorNumerico = coluna.valorNumerico(linha);
    const texto = textoDaCelula === void 0 ? coluna.texto(linha, "") : textoDaCelula;
    let efeito = null;
    for (const regra of coluna.regras) {
      if (!regraBate(regra, { valorNumerico, texto, coluna, linha, porId, ctx })) continue;
      if (!efeito) efeito = {};
      switch (regra.acao) {
        case "texto":
          efeito.cor = regra.cor;
          break;
        case "negrito":
          efeito.negrito = true;
          break;
        case "fundoETexto":
          efeito.fundo = regra.cor;
          efeito.cor = "#FFFFFF";
          break;
        case "icone":
          efeito.icone = ICONES[regra.icone] || ICONES.bolinha;
          efeito.corDoIcone = regra.cor;
          break;
        case "badge":
          efeito.badge = regra.cor;
          break;
        case "borda":
          efeito.bordaEsquerda = regra.cor;
          break;
        case "piscar":
          efeito.piscar = true;
          efeito.cor = regra.cor;
          break;
        case "fundo":
        default:
          efeito.fundo = regra.cor;
          break;
      }
      if (regra.linhaInteira) {
        efeito.linhaInteira = {
          fundo: regra.acao === "texto" ? void 0 : regra.cor,
          cor: regra.acao === "texto" || regra.acao === "fundoETexto" ? regra.cor : void 0
        };
      }
    }
    return efeito;
  }
  function posicaoNaColuna(valor, ctx) {
    if (valor === null || !ctx || ctx.minimo === null) return null;
    if (ctx.maximo === ctx.minimo) return 1;
    return (valor - ctx.minimo) / (ctx.maximo - ctx.minimo);
  }

  // src/charts/tabela_completa/celulas.js
  var CSS2 = `
.tc-barra-fundo{position:relative;display:block;width:100%;height:60%;border-radius:3px;overflow:hidden;}
.tc-barra-valor{position:absolute;top:0;bottom:0;border-radius:3px;}
.tc-barra-texto{position:relative;padding:0 4px;font-variant-numeric:tabular-nums;}
.tc-pilha{display:flex;align-items:center;gap:6px;height:100%;}
.tc-badge{display:inline-block;padding:1px 7px;border-radius:999px;font-size:.85em;font-weight:600;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;}
.tc-semaforo{display:inline-block;width:10px;height:10px;border-radius:50%;flex:0 0 auto;}
.tc-avatar{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
  border-radius:50%;font-size:10px;font-weight:700;flex:0 0 auto;}
.tc-img{height:80%;max-width:100%;object-fit:contain;display:block;}
.tc-link{text-decoration:underline;cursor:pointer;}
.tc-icone{flex:0 0 auto;}
@keyframes tc-piscar{0%,100%{opacity:1}50%{opacity:.35}}
.tc-piscando{animation:tc-piscar 1.1s ease-in-out infinite;}
@media (prefers-reduced-motion: reduce){.tc-piscando{animation:none;}}
`;
  function cssDasCelulas() {
    return CSS2;
  }
  var CORES_DE_FAIXA = ["#DC2626", "#F59E0B", "#16A34A"];
  function pilha(td, alinhamento) {
    const caixa = criarEl("div", { classe: "tc-pilha", pai: td });
    caixa.style.justifyContent = alinhamento === "right" ? "flex-end" : alinhamento === "center" ? "center" : "flex-start";
    return caixa;
  }
  function serieDaLinha(coluna, linha, modelo) {
    if (!modelo.temPivo || !coluna.ehMedida) return [];
    const saida = [];
    for (const p of modelo.pivotsDeDados) {
      saida.push(modelo.valorNumerico(linha, coluna.campo.nome, p.chave));
    }
    return saida;
  }
  function miniCaminho(valores2, largura, altura, fechar) {
    const limpos = valores2.map((v) => v === null || !Number.isFinite(v) ? null : v);
    const existentes = limpos.filter((v) => v !== null);
    if (existentes.length < 2) return null;
    const minimo = Math.min(...existentes);
    const maximo = Math.max(...existentes);
    const amplitude = maximo - minimo || 1;
    const passo = limpos.length > 1 ? largura / (limpos.length - 1) : largura;
    let d = "";
    let comecou = false;
    limpos.forEach((v, i) => {
      if (v === null) return;
      const x = i * passo;
      const y = altura - (v - minimo) / amplitude * altura;
      d += `${comecou ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
      comecou = true;
    });
    if (fechar) d += `L${largura.toFixed(2)},${altura}L0,${altura}Z`;
    return d;
  }
  var DESENHISTAS = {
    barraDeDados(ctx) {
      var _a, _b;
      const { td, coluna, linha, visual, estatistica } = ctx;
      const valor = coluna.valorNumerico(linha);
      const texto = ctx.texto;
      if (valor === null) return ctx.comoTexto();
      const fundo = criarEl("div", { classe: "tc-barra-fundo", pai: td });
      fundo.style.background = comOpacidade(coluna.corDaBarra, 0.14);
      const minimo = Math.min(0, estatistica ? (_a = estatistica.minimo) != null ? _a : 0 : 0);
      const maximo = Math.max(0, estatistica ? (_b = estatistica.maximo) != null ? _b : valor : valor);
      const amplitude = maximo - minimo || 1;
      const zero = (0 - minimo) / amplitude * 100;
      const posicao = (valor - minimo) / amplitude * 100;
      const barra = criarEl("div", { classe: "tc-barra-valor", pai: fundo });
      barra.style.background = coluna.corDaBarra;
      barra.style.left = `${Math.min(zero, posicao)}%`;
      barra.style.width = `${Math.abs(posicao - zero)}%`;
      const rotulo = criarEl("span", { classe: "tc-barra-texto", pai: fundo });
      definirTexto(rotulo, texto);
      rotulo.style.color = visual.texto;
      rotulo.style.lineHeight = `${Math.round(visual.alturaLinha * 0.6)}px`;
      return texto;
    },
    progresso(ctx) {
      const { td, coluna, linha, visual } = ctx;
      const valor = coluna.valorNumerico(linha);
      if (valor === null) return ctx.comoTexto();
      const fracao = Math.max(0, Math.min(1, valor > 1.5 ? valor / 100 : valor));
      const caixa = pilha(td, "left");
      const trilho = criarEl("div", { pai: caixa });
      trilho.style.flex = "1 1 auto";
      trilho.style.height = "8px";
      trilho.style.borderRadius = "999px";
      trilho.style.background = comOpacidade(coluna.corDaBarra, 0.18);
      trilho.style.overflow = "hidden";
      const preenchido = criarEl("div", { pai: trilho });
      preenchido.style.width = `${fracao * 100}%`;
      preenchido.style.height = "100%";
      preenchido.style.background = coluna.corDaBarra;
      const texto = `${Math.round(fracao * 100)}%`;
      const rotulo = criarEl("span", { pai: caixa, texto });
      rotulo.style.flex = "0 0 auto";
      rotulo.style.color = visual.texto;
      return texto;
    },
    anel(ctx) {
      const { td, coluna, linha, visual } = ctx;
      const valor = coluna.valorNumerico(linha);
      if (valor === null) return ctx.comoTexto();
      const fracao = Math.max(0, Math.min(1, valor > 1.5 ? valor / 100 : valor));
      const lado = Math.max(14, Math.round(visual.alturaLinha * 0.7));
      const raio = lado / 2 - 2;
      const circunferencia = 2 * Math.PI * raio;
      const caixa = pilha(td, coluna.alinhamento);
      const svg = criarSvgEl("svg", { pai: caixa, atributos: { width: lado, height: lado } });
      criarSvgEl("circle", {
        pai: svg,
        atributos: {
          cx: lado / 2,
          cy: lado / 2,
          r: raio,
          fill: "none",
          stroke: comOpacidade(coluna.corDaBarra, 0.2),
          "stroke-width": 3
        }
      });
      criarSvgEl("circle", {
        pai: svg,
        atributos: {
          cx: lado / 2,
          cy: lado / 2,
          r: raio,
          fill: "none",
          stroke: coluna.corDaBarra,
          "stroke-width": 3,
          "stroke-linecap": "round",
          "stroke-dasharray": `${circunferencia * fracao} ${circunferencia}`,
          transform: `rotate(-90 ${lado / 2} ${lado / 2})`
        }
      });
      const texto = `${Math.round(fracao * 100)}%`;
      const rotulo = criarEl("span", { pai: caixa, texto });
      rotulo.style.color = visual.texto;
      return texto;
    },
    medidor(ctx) {
      const { td, coluna, linha, visual, estatistica } = ctx;
      const valor = coluna.valorNumerico(linha);
      if (valor === null) return ctx.comoTexto();
      const fracao = posicaoNaColuna(valor, estatistica);
      if (fracao === null) return ctx.comoTexto();
      const largura = Math.max(34, Math.round(visual.alturaLinha * 1.6));
      const altura = Math.max(14, Math.round(visual.alturaLinha * 0.48));
      const caixa = pilha(td, coluna.alinhamento);
      const svg = criarSvgEl("svg", { pai: caixa, atributos: { width: largura, height: altura } });
      const raio = Math.min(largura / 2, altura) - 2;
      const cx = largura / 2;
      const cy = altura - 1;
      const arco = (de, ate, cor, espessura) => {
        const p0 = [cx + raio * Math.cos(Math.PI * (1 - de)), cy - raio * Math.sin(Math.PI * (1 - de))];
        const p1 = [cx + raio * Math.cos(Math.PI * (1 - ate)), cy - raio * Math.sin(Math.PI * (1 - ate))];
        criarSvgEl("path", {
          pai: svg,
          atributos: {
            d: `M${p0[0].toFixed(2)},${p0[1].toFixed(2)}A${raio},${raio} 0 0 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`,
            fill: "none",
            stroke: cor,
            "stroke-width": espessura,
            "stroke-linecap": "round"
          }
        });
      };
      arco(0, 1, comOpacidade(coluna.corDaBarra, 0.18), 4);
      if (fracao > 0.01) arco(0, fracao, coluna.corDaBarra, 4);
      const rotulo = criarEl("span", { pai: caixa, texto: ctx.texto });
      rotulo.style.color = visual.texto;
      return ctx.texto;
    },
    sparkline(ctx) {
      return desenharMini(ctx, "linha");
    },
    miniArea(ctx) {
      return desenharMini(ctx, "area");
    },
    miniBarras(ctx) {
      const { td, coluna, linha, visual, modelo } = ctx;
      const valores2 = serieDaLinha(coluna, linha, modelo);
      if (valores2.filter((v) => v !== null).length < 2) return ctx.comoTexto();
      const largura = Math.max(40, Math.round(visual.alturaLinha * 2.4));
      const altura = Math.max(12, Math.round(visual.alturaLinha * 0.62));
      const existentes = valores2.filter((v) => v !== null && Number.isFinite(v));
      const maximo = Math.max(...existentes.map(Math.abs)) || 1;
      const largoDaBarra = largura / valores2.length;
      const caixa = pilha(td, coluna.alinhamento);
      const svg = criarSvgEl("svg", { pai: caixa, atributos: { width: largura, height: altura } });
      valores2.forEach((v, i) => {
        if (v === null || !Number.isFinite(v)) return;
        const h = Math.max(1, Math.abs(v) / maximo * altura);
        criarSvgEl("rect", {
          pai: svg,
          atributos: {
            x: (i * largoDaBarra + largoDaBarra * 0.15).toFixed(2),
            y: (altura - h).toFixed(2),
            width: Math.max(1, largoDaBarra * 0.7).toFixed(2),
            height: h.toFixed(2),
            fill: v < 0 ? "#DC2626" : coluna.corDaBarra,
            rx: 1
          }
        });
      });
      return ctx.texto;
    },
    badge(ctx) {
      const { td, coluna, visual } = ctx;
      const caixa = pilha(td, coluna.alinhamento);
      const cor = ctx.corDoBadge || coluna.corDaBarra;
      const badge = criarEl("span", { classe: "tc-badge", pai: caixa, texto: ctx.texto });
      badge.style.background = comOpacidade(cor, visual.escuro ? 0.3 : 0.18);
      badge.style.color = visual.escuro ? "#FFFFFF" : cor;
      return ctx.texto;
    },
    semaforo(ctx) {
      const { td, coluna, linha, visual, estatistica } = ctx;
      const valor = coluna.valorNumerico(linha);
      const caixa = pilha(td, coluna.alinhamento);
      const fracao = posicaoNaColuna(valor, estatistica);
      const cor = fracao === null ? visual.borda : CORES_DE_FAIXA[Math.min(2, Math.floor(fracao * 3))];
      const bola = criarEl("span", { classe: "tc-semaforo", pai: caixa });
      bola.style.background = cor;
      const rotulo = criarEl("span", { pai: caixa, texto: ctx.texto });
      rotulo.style.color = visual.texto;
      rotulo.style.overflow = "hidden";
      rotulo.style.textOverflow = "ellipsis";
      return ctx.texto;
    },
    seta(ctx) {
      const { td, coluna, linha, config, visual } = ctx;
      const valor = coluna.valorNumerico(linha);
      const caixa = pilha(td, coluna.alinhamento);
      if (valor !== null && valor !== 0) {
        const seta = criarEl("span", { classe: "tc-icone", pai: caixa, texto: valor > 0 ? "\u25B2" : "\u25BC" });
        seta.style.color = valor > 0 ? config.corDeSubida || "#16A34A" : config.corDeDescida || "#DC2626";
      }
      const rotulo = criarEl("span", { pai: caixa, texto: ctx.texto });
      rotulo.style.color = visual.texto;
      return ctx.texto;
    },
    estrelas(ctx) {
      var _a;
      const { td, coluna, linha, visual, estatistica } = ctx;
      const valor = coluna.valorNumerico(linha);
      if (valor === null) return ctx.comoTexto();
      const fracao = valor <= 5 ? valor / 5 : (_a = posicaoNaColuna(valor, estatistica)) != null ? _a : 0;
      const cheias = Math.round(Math.max(0, Math.min(1, fracao)) * 5);
      const caixa = pilha(td, coluna.alinhamento);
      for (let i = 0; i < 5; i++) {
        const estrela = criarEl("span", { pai: caixa, texto: i < cheias ? "\u2605" : "\u2606" });
        estrela.style.color = i < cheias ? coluna.corDaBarra : visual.borda;
        estrela.style.marginRight = "-3px";
      }
      return `${cheias}/5`;
    },
    booleano(ctx) {
      const { td, coluna } = ctx;
      const bruto = ctx.texto.trim().toLowerCase();
      const verdadeiro2 = ["sim", "yes", "true", "1", "verdadeiro", "ativo"].includes(bruto);
      const falso = ["n\xE3o", "nao", "no", "false", "0", "falso", "inativo"].includes(bruto);
      if (!verdadeiro2 && !falso) return ctx.comoTexto();
      const caixa = pilha(td, coluna.alinhamento || "center");
      const marca = criarEl("span", { pai: caixa, texto: verdadeiro2 ? "\u2713" : "\u2717" });
      marca.style.color = verdadeiro2 ? "#16A34A" : "#DC2626";
      marca.style.fontWeight = "700";
      return verdadeiro2 ? "\u2713" : "\u2717";
    },
    avatar(ctx) {
      const { td, coluna, visual } = ctx;
      const texto = ctx.texto;
      const iniciais = texto.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
      const caixa = pilha(td, coluna.alinhamento);
      const bolha = criarEl("div", { classe: "tc-avatar", pai: caixa, texto: iniciais });
      const cor = corEstavel(texto);
      bolha.style.background = cor;
      bolha.style.color = textoLegivelSobre(cor, visual);
      const rotulo = criarEl("span", { pai: caixa, texto });
      rotulo.style.color = visual.texto;
      rotulo.style.overflow = "hidden";
      rotulo.style.textOverflow = "ellipsis";
      return texto;
    },
    imagem(ctx) {
      const { td, coluna, linha } = ctx;
      const bruto = coluna.celula(linha);
      const url = urlDeImagemSegura(bruto && bruto.value);
      if (!url) return ctx.comoTexto();
      const img = criarEl("img", { classe: "tc-img", pai: td });
      img.src = url;
      img.alt = ctx.texto;
      return ctx.texto;
    },
    data(ctx) {
      const { td, coluna, linha, config } = ctx;
      const bruto = coluna.celula(linha);
      const texto = formatarData(bruto && bruto.value, config.estiloDeData || "auto");
      if (!texto) return ctx.comoTexto();
      definirTexto(td, texto);
      return texto;
    },
    link(ctx) {
      const { td, coluna, linha, ponte, visual } = ctx;
      const celula = coluna.celula(linha);
      const span = criarEl("span", { classe: "tc-link", pai: td, texto: ctx.texto });
      span.style.color = visual.escuro ? "#93C5FD" : "#1D4ED8";
      if (celula && ponte.temDrill(celula)) {
        ctx.eventos.on(span, "click", (ev) => {
          ev.stopPropagation();
          ponte.abrirDrill(celula, ev);
        });
      }
      return ctx.texto;
    }
  };
  function desenharMini(ctx, estilo) {
    const { td, coluna, linha, visual, modelo } = ctx;
    const valores2 = serieDaLinha(coluna, linha, modelo);
    if (valores2.filter((v) => v !== null).length < 2) return ctx.comoTexto();
    const largura = Math.max(40, Math.round(visual.alturaLinha * 2.4));
    const altura = Math.max(12, Math.round(visual.alturaLinha * 0.62));
    const d = miniCaminho(valores2, largura, altura, estilo === "area");
    if (!d) return ctx.comoTexto();
    const caixa = pilha(td, coluna.alinhamento);
    const svg = criarSvgEl("svg", { pai: caixa, atributos: { width: largura, height: altura } });
    criarSvgEl("path", {
      pai: svg,
      atributos: {
        d,
        fill: estilo === "area" ? comOpacidade(coluna.corDaBarra, 0.25) : "none",
        stroke: coluna.corDaBarra,
        "stroke-width": 1.5,
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
      }
    });
    return ctx.texto;
  }
  var CORES_DE_AVATAR = [
    "#BFDBFE",
    "#BBF7D0",
    "#FED7AA",
    "#FBCFE8",
    "#DDD6FE",
    "#A5F3FC",
    "#FDE68A",
    "#C7D2FE",
    "#FECACA",
    "#D9F99D"
  ];
  function corEstavel(texto) {
    let soma = 0;
    for (let i = 0; i < texto.length; i++) soma = (soma * 31 + texto.charCodeAt(i)) % 9973;
    return CORES_DE_AVATAR[soma % CORES_DE_AVATAR.length];
  }
  function desenhistaDoTipo(tipo) {
    return DESENHISTAS[tipo] || null;
  }
  var TIPOS_QUE_PRECISAM_DA_COLUNA = /* @__PURE__ */ new Set([
    "barraDeDados",
    "medidor",
    "semaforo",
    "estrelas"
  ]);

  // src/charts/tabela_completa/busca.js
  function analisarBusca(termo) {
    const incluir = [];
    const excluir = [];
    const re2 = /(-?)"([^"]*)"?|(\S+)/g;
    let m;
    const texto = String(termo != null ? termo : "");
    while ((m = re2.exec(texto)) !== null) {
      if (m[2] !== void 0) {
        const frase = normalizarTexto(m[2]);
        if (frase) (m[1] ? excluir : incluir).push(frase);
        continue;
      }
      const palavra = m[3];
      if (palavra.length > 1 && palavra.startsWith("-")) {
        const t = normalizarTexto(palavra.slice(1));
        if (t) excluir.push(t);
      } else {
        const t = normalizarTexto(palavra);
        if (t) incluir.push(t);
      }
    }
    return { incluir, excluir };
  }
  function criarBusca(termo, { modo = "todas" } = {}) {
    const partes = analisarBusca(termo);
    const vazia = !partes.incluir.length && !partes.excluir.length;
    const casa = (textos) => {
      if (vazia) return true;
      const normalizados = textos.map((t) => normalizarTexto(t));
      const tem = (p) => normalizados.some((t) => t.includes(p));
      if (partes.excluir.some(tem)) return false;
      if (!partes.incluir.length) return true;
      return modo === "qualquer" ? partes.incluir.some(tem) : partes.incluir.every(tem);
    };
    return { vazia, partes, casa, trechos: partes.incluir };
  }
  function realcarTrechos(el, trechos) {
    if (!el || !trechos || !trechos.length) return 0;
    const doc = el.ownerDocument;
    const nos = [];
    const caminhar = (no) => {
      for (const filho of Array.from(no.childNodes)) {
        if (filho.nodeType === 3) nos.push(filho);
        else if (filho.nodeType === 1 && filho.tagName !== "MARK" && filho.tagName !== "svg") caminhar(filho);
      }
    };
    caminhar(el);
    let total = 0;
    for (const no of nos) {
      const original = no.nodeValue;
      const mapa = [];
      let normal = "";
      for (let i = 0; i < original.length; i++) {
        const n = normalizarTexto(original[i]) || (original[i] === " " ? " " : "");
        for (const c of n) {
          normal += c;
          mapa.push(i);
        }
      }
      const faixas = [];
      for (const t of trechos) {
        let de = normal.indexOf(t);
        while (de >= 0 && t) {
          const ini = mapa[de];
          const fim = mapa[de + t.length - 1] + 1;
          faixas.push([ini, fim]);
          de = normal.indexOf(t, de + t.length);
        }
      }
      if (!faixas.length) continue;
      faixas.sort((a, b) => a[0] - b[0]);
      const juntas = [];
      for (const f of faixas) {
        const u = juntas[juntas.length - 1];
        if (u && f[0] <= u[1]) u[1] = Math.max(u[1], f[1]);
        else juntas.push(f.slice());
      }
      const frag = doc.createDocumentFragment();
      let pos = 0;
      for (const [ini, fim] of juntas) {
        if (ini > pos) frag.appendChild(doc.createTextNode(original.slice(pos, ini)));
        const mark = doc.createElement("mark");
        mark.className = "tc-realce";
        mark.textContent = original.slice(ini, fim);
        frag.appendChild(mark);
        total += 1;
        pos = fim;
      }
      if (pos < original.length) frag.appendChild(doc.createTextNode(original.slice(pos)));
      no.parentNode.replaceChild(frag, no);
    }
    return total;
  }
  function colunasDaBusca(colunasVisiveis, lista) {
    const nomes = String(lista || "").split(",").map((n) => normalizarTexto(n)).filter(Boolean);
    if (!nomes.length) return colunasVisiveis;
    const escolhidas = colunasVisiveis.filter(
      (c) => [c.rotulo, c.id, c.campo && c.campo.nome, c.campo && c.campo.rotuloCurto].filter(Boolean).some((n) => nomes.includes(normalizarTexto(n)))
    );
    return escolhidas.length ? escolhidas : colunasVisiveis;
  }

  // src/charts/tabela_completa/render.js
  var CSS3 = `
.tc-raiz{display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;}
.tc-barra{display:flex;gap:8px;align-items:center;padding:4px 6px;flex:0 0 auto;flex-wrap:wrap;}
.tc-barra input[type=search]{flex:1 1 140px;min-width:100px;padding:3px 7px;border-radius:4px;border:1px solid;font:inherit;}
.tc-barra button{padding:3px 8px;border-radius:4px;border:1px solid;background:transparent;cursor:pointer;font:inherit;font-size:11px;}
.tc-barra .tc-resumo{font-size:11px;opacity:.75;margin-left:auto;}
.tc-rolagem{flex:1 1 auto;overflow:auto;position:relative;min-height:0;min-width:0;}
.tc-oculto{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.tc-csv{position:fixed;z-index:60;left:8px;right:8px;top:8px;bottom:8px;display:flex;flex-direction:column;gap:6px;
  padding:10px;border-radius:6px;border:1px solid;font-size:12px;box-shadow:0 8px 24px rgba(15,23,42,.3);}
.tc-csv textarea{flex:1 1 auto;min-height:60px;width:100%;font-family:monospace;font-size:11px;resize:none;}
.tc-csv-botoes{display:flex;gap:8px;align-items:center;}
.tc-csv-botoes button{padding:3px 10px;border-radius:4px;border:1px solid;background:transparent;cursor:pointer;font:inherit;}
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
.tc-filtro{width:100%;box-sizing:border-box;padding:2px 5px;border-radius:3px;border:1px solid;
  font:inherit;font-size:11px;font-weight:400;}
.tc-grupo td{font-weight:600;}
.tc-seta-grupo{display:inline-block;width:10px;}
@keyframes tc-entrada{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.tc-entrando{animation:tc-entrada .22s ease-out both;}
.tc-realce{background:rgba(250,204,21,.45);color:inherit;padding:0;border-radius:2px;}
.tc-flash{transition:background-color .7s ease-out;}
.tc-menu{position:fixed;z-index:50;min-width:170px;padding:4px 0;border-radius:6px;border:1px solid;
  font-size:12px;}
.tc-menu button{display:block;width:100%;text-align:left;padding:5px 12px;border:none;background:none;
  cursor:pointer;font:inherit;color:inherit;}
.tc-menu button:hover{filter:brightness(.94);}
@media (prefers-reduced-motion: reduce){
  .tc-entrando{animation:none;}
  .tc-flash{transition:none;}
}
`;
  var contadorDeInstancias = 0;
  function idDoCampo(estado, nome) {
    if (!estado.prefixoDeId) {
      contadorDeInstancias += 1;
      estado.prefixoDeId = `tabela_completa-${contadorDeInstancias}`;
    }
    return `${estado.prefixoDeId}-${nome}`;
  }
  function prepararCampo(campo, estado, nome, rotulo) {
    campo.id = idDoCampo(estado, nome);
    campo.name = nome;
    campo.setAttribute("aria-label", rotulo);
    const label = document.createElement("label");
    label.className = "tc-oculto";
    label.htmlFor = campo.id;
    label.textContent = rotulo;
    campo.parentNode.insertBefore(label, campo);
    return campo;
  }
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
  function filtrarIndices(indices, colunas, termo, modelo, config = {}) {
    const busca = criarBusca(termo, { modo: config.modoDaBusca === "qualquer" ? "qualquer" : "todas" });
    if (busca.vazia) return indices;
    const alvo = colunasDaBusca(colunas, config.colunasDaBusca);
    const bruto = config.buscarEm === "bruto";
    const textoDe = (coluna, linha) => {
      if (!bruto) return coluna.texto(linha, "");
      const celula = coluna.celula(linha);
      const v = celula ? celula.value : coluna.ehMedida ? coluna.valorNumerico(linha) : null;
      return v === null || v === void 0 ? "" : String(v);
    };
    return indices.filter((i) => {
      const linha = modelo.linhas[i];
      return busca.casa(alvo.map((coluna) => textoDe(coluna, linha)));
    });
  }
  function agregar(valores2, tipo) {
    const limpos = valores2.filter((v) => v !== null && v !== void 0 && Number.isFinite(v));
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
      estado,
      aoOrdenar,
      aoBuscar,
      aoSelecionarLinha,
      aoRedimensionar,
      aoExportar,
      aoAlternarGrupo,
      aoFiltrarColuna,
      aoMenuDeContexto
    } = params;
    let animarProximaJanela = params.animarEntrada !== false;
    let { itens, indicesDeDados, pintarCelula } = params;
    const { modelo, config, tema, raiz } = ctx;
    limpar(raiz);
    injetarEstilo(raiz, CSS3 + cssDasCelulas(), "tc");
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
        prepararCampo(busca, estado, "busca", "Buscar em todas as colunas");
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
      aoRedimensionar,
      aoFiltrarColuna
    });
    const tbody = criarEl("tbody", { pai: tabela });
    const tfoot = config.mostrarTotais !== false ? criarEl("tfoot", { pai: tabela }) : null;
    function desenharRodape() {
      if (!tfoot) return;
      limpar(tfoot);
      construirRodape({
        tfoot,
        colunasVisiveis,
        indicesVisiveis: indicesDeDados,
        visual,
        config,
        deslocamentos,
        fixas,
        modelo
      });
    }
    desenharRodape();
    const linhasDeCabecalho = (temPivo ? 2 : 1) + (config.mostrarFiltrosPorColuna ? 1 : 0);
    const alturaCabecalhoTotal = linhasDeCabecalho * visual.alturaCabecalho;
    const estadoDeDesenho = {
      rolagem,
      tbody,
      colunasVisiveis,
      deslocamentos,
      fixas,
      alturaCabecalhoTotal,
      // Posição desejada no primeiro desenho (restaurada de uma atualização
      // anterior): o corpo ainda está vazio, então o navegador cortaria o
      // scrollTop se ele fosse aplicado antes de existir conteúdo.
      topoDesejado: estado.rolagemTopo || 0,
      janelaAtual: null
    };
    function desenharJanela({ forcar = true } = {}) {
      const busca = criarBusca(estado.busca, { modo: config.modoDaBusca === "qualquer" ? "qualquer" : "todas" });
      estadoDeDesenho.realce = config.realcarBusca !== false && busca.trechos.length && config.buscarEm !== "bruto" ? { trechos: busca.trechos, colunas: new Set(colunasDaBusca(colunasVisiveis, config.colunasDaBusca).map((c) => c.id)) } : null;
      const animar = animarProximaJanela;
      animarProximaJanela = false;
      const desenhou = desenharLinhasVisiveis({
        forcar,
        animar,
        ctx,
        estadoDeDesenho,
        itens,
        visual,
        config,
        estado,
        modelo,
        aoSelecionarLinha,
        aoAlternarGrupo,
        aoMenuDeContexto,
        pintarCelula
      });
      if (desenhou && resumoEl) atualizarResumo(resumoEl, indicesDeDados, estado, colunasVisiveis, modelo);
    }
    ctx.eventos.on(rolagem, "scroll", () => {
      estado.rolagemTopo = rolagem.scrollTop;
      estado.rolagemEsquerda = rolagem.scrollLeft;
      desenharJanela({ forcar: false });
    });
    desenharJanela();
    estadoDeDesenho.topoDesejado = 0;
    if (estado.rolagemTopo) rolagem.scrollTop = estado.rolagemTopo;
    if (estado.rolagemEsquerda) rolagem.scrollLeft = estado.rolagemEsquerda;
    function atualizarDados(novosItens, novosIndices, novoPintor) {
      itens = novosItens;
      indicesDeDados = novosIndices;
      if (novoPintor) pintarCelula = novoPintor;
      desenharRodape();
      rolagem.scrollTop = 0;
      estado.rolagemTopo = 0;
      animarProximaJanela = true;
      desenharJanela();
    }
    return { rolagem, tabela, tbody, redesenharJanela: desenharJanela, atualizarDados };
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
    aoRedimensionar,
    aoFiltrarColuna
  }) {
    if (temPivo) {
      const trGrupo = criarEl("tr", { pai: thead });
      if (config.mostrarNumeroDaLinha) {
        const th = criarEl("th", { pai: trGrupo });
        th.rowSpan = 2;
        aplicarEstiloDeCabecalho(th, visual, config, 0);
      }
      colunasVisiveis.forEach((coluna, i) => {
        if (coluna.tipo !== "dimensao" && !coluna.soltaNoCabecalho) return;
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
      if (temPivo && (coluna.tipo === "dimensao" || coluna.soltaNoCabecalho)) continue;
      tr.appendChild(
        criarThDeColuna({ coluna, indice: i, topo, visual, config, estado, deslocamentos, fixas, ctx, aoOrdenar, aoRedimensionar })
      );
    }
    if (!config.mostrarFiltrosPorColuna) return;
    const trFiltros = criarEl("tr", { pai: thead });
    const topoDosFiltros = topo + visual.alturaCabecalho;
    if (config.mostrarNumeroDaLinha) {
      const th = criarEl("th", { pai: trFiltros });
      aplicarEstiloDeCabecalho(th, visual, config, topoDosFiltros);
    }
    colunasVisiveis.forEach((coluna, i) => {
      const th = criarEl("th", { pai: trFiltros });
      aplicarEstiloDeCabecalho(th, visual, config, topoDosFiltros);
      if (i < fixas) {
        th.classList.add("tc-fixa");
        th.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
        th.style.position = "sticky";
      }
      const campo = criarEl("input", { classe: "tc-filtro", pai: th });
      prepararCampo(campo, estado, `filtro-${i}`, `Filtrar a coluna ${coluna.rotulo || coluna.id}`);
      campo.type = "text";
      campo.placeholder = coluna.ehMedida ? "ex.: >100" : "filtrar\u2026";
      campo.value = estado.filtros[coluna.id] || "";
      campo.style.borderColor = visual.borda;
      campo.style.background = visual.fundo;
      campo.style.color = visual.texto;
      ctx.eventos.on(campo, "input", (ev) => aoFiltrarColuna(coluna.id, ev.target.value));
      ctx.eventos.on(campo, "click", (ev) => ev.stopPropagation());
    });
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
      if (typeof coluna.totalCalculado === "function") {
        definirTexto(td, coluna.totalCalculado(indicesVisiveis, agregar, config.agregacaoDoTotal || "soma"));
      } else if (coluna.ehMedida) {
        const doLooker = modelo.totais.encontrados ? modelo.totais.porCampo[coluna.campo.nome] : null;
        let valor = null;
        if (doLooker && !coluna.chaveDoPivo) {
          valor = doLooker.value !== void 0 ? Number(doLooker.value) : null;
        }
        if (valor === null || !Number.isFinite(valor)) {
          const valores2 = indicesVisiveis.map((idx) => coluna.valorNumerico(modelo.linhas[idx]));
          valor = agregar(valores2, config.agregacaoDoTotal || "soma");
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
    forcar = true,
    animar: animarEstaJanela = false,
    ctx,
    estadoDeDesenho,
    itens,
    visual,
    config,
    estado,
    modelo,
    aoSelecionarLinha,
    aoAlternarGrupo,
    aoMenuDeContexto,
    pintarCelula
  }) {
    const { rolagem, tbody: tbodyReal, colunasVisiveis, deslocamentos, fixas, alturaCabecalhoTotal } = estadoDeDesenho;
    const alturaLinha = visual.alturaLinha;
    const total = itens.length;
    const alturaUtil = rolagem.clientHeight || 400;
    const topoAtual = Math.max(rolagem.scrollTop || 0, estadoDeDesenho.topoDesejado || 0);
    const margem = 10;
    const deslocamento = Math.max(0, topoAtual - alturaCabecalhoTotal);
    let inicio = Math.max(0, Math.floor(deslocamento / alturaLinha) - margem);
    let fim = Math.min(total, inicio + Math.ceil(alturaUtil / alturaLinha) + margem * 2);
    const porPagina = Number(config.linhasPorPagina) || 0;
    if (porPagina > 0) {
      const pagina = estado.pagina || 0;
      inicio = pagina * porPagina;
      fim = Math.min(total, inicio + porPagina);
    }
    const chave = `${inicio}|${fim}|${total}`;
    if (!forcar && estadoDeDesenho.janelaAtual === chave) return false;
    estadoDeDesenho.janelaAtual = chave;
    const tbody = document.createDocumentFragment();
    const trocar = () => {
      if (typeof tbodyReal.replaceChildren === "function") tbodyReal.replaceChildren(tbody);
      else {
        limpar(tbodyReal);
        tbodyReal.appendChild(tbody);
      }
    };
    if (!total) {
      const tr = criarEl("tr", { pai: tbody });
      const td = criarEl("td", { pai: tr, classe: "tc-vazio" });
      td.colSpan = colunasVisiveis.length + (config.mostrarNumeroDaLinha ? 1 : 0);
      const temFiltro = estado.busca || Object.values(estado.filtros).some((v) => v && v.trim());
      definirTexto(
        td,
        temFiltro ? "Nenhuma linha encontrada para a busca." : config.textoSemDados || "Sem dados para exibir"
      );
      trocar();
      return true;
    }
    if (inicio > 0) tbody.appendChild(linhaEspacadora(inicio * alturaLinha, colunasVisiveis.length + 1));
    const animar = animarEstaJanela && config.animacaoAtiva !== false && config.animarEntradaDasLinhas !== false && !preferindoMenosMovimento();
    for (let i = inicio; i < fim; i++) {
      const item = itens[i];
      if (item.tipo === "grupo") {
        tbody.appendChild(
          linhaDeGrupo({ item, ctx, colunasVisiveis, visual, config, modelo, fixas, deslocamentos, aoAlternarGrupo })
        );
        continue;
      }
      const indiceDaLinha = item.indice;
      const linha = modelo.linhas[indiceDaLinha];
      const tr = criarEl("tr", { pai: tbody });
      tr.style.height = `${alturaLinha}px`;
      if (animar) {
        tr.classList.add("tc-entrando");
        tr.style.animationDelay = `${Math.min(140, (i - inicio) * 7)}ms`;
      }
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
        if (estadoDeDesenho.realce && estadoDeDesenho.realce.colunas.has(coluna.id)) {
          realcarTrechos(td, estadoDeDesenho.realce.trechos);
        }
        if (aoMenuDeContexto) {
          ctx.eventos.on(td, "contextmenu", (ev) => aoMenuDeContexto(ev, { coluna, linha, indiceDaLinha, td }));
        }
      }
    }
    if (fim < total && porPagina <= 0) {
      tbody.appendChild(linhaEspacadora((total - fim) * alturaLinha, colunasVisiveis.length + 1));
    }
    trocar();
    return true;
  }
  function linhaDeGrupo({ item, ctx, colunasVisiveis, visual, config, modelo, fixas, deslocamentos, aoAlternarGrupo }) {
    const tr = criarEl("tr", { classe: "tc-grupo" });
    tr.style.height = `${visual.alturaLinha}px`;
    tr.style.background = visual.escuro ? "#1B2738" : "#EEF2F7";
    tr.style.fontWeight = "600";
    if (config.mostrarNumeroDaLinha) {
      const td = criarEl("td", { pai: tr });
      estiloDeCelula(td, visual, config);
    }
    const mostrarSubtotais = config.mostrarSubtotais !== false;
    let primeira = true;
    colunasVisiveis.forEach((coluna, c) => {
      const td = criarEl("td", { pai: tr });
      estiloDeCelula(td, visual, config);
      td.style.textAlign = coluna.alinhamento;
      if (c < fixas) {
        td.classList.add("tc-fixa");
        td.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
        td.style.background = tr.style.background;
      }
      if (primeira && !coluna.ehMedida) {
        primeira = false;
        td.style.paddingLeft = `${8 + item.nivel * 14}px`;
        const seta = criarEl("span", { classe: "tc-seta-grupo", pai: td, texto: item.aberto ? "\u25BE" : "\u25B8" });
        seta.style.marginRight = "5px";
        const rotulo = criarEl("span", { pai: td, texto: `${item.rotulo} (${item.quantidade})` });
        rotulo.title = item.rotulo;
        td.classList.add("tc-selecionavel");
        ctx.eventos.on(td, "click", (ev) => {
          ev.stopPropagation();
          aoAlternarGrupo(item.chave);
        });
        return;
      }
      if (coluna.ehMedida && mostrarSubtotais) {
        const valores2 = item.indices.map((i) => coluna.valorNumerico(modelo.linhas[i]));
        const valor = agregar(valores2, config.agregacaoDoTotal || "soma");
        definirTexto(td, valor === null ? "" : coluna.formatar ? coluna.formatar(valor) : String(valor));
      }
    });
    return tr;
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
  function atualizarResumo(resumoEl, indicesVisiveis, estado, colunasVisiveis, modelo) {
    const busca = String(estado.busca || "").trim();
    const partes = [
      busca ? `${indicesVisiveis.length.toLocaleString("pt-BR")} resultado(s) para "${busca}"` : `${indicesVisiveis.length.toLocaleString("pt-BR")} linha(s)`
    ];
    if (estado.selecionadas.size) {
      partes.push(`${estado.selecionadas.size} selecionada(s)`);
      const primeiraMedida = colunasVisiveis.find((c) => c.ehMedida);
      if (primeiraMedida) {
        const valores2 = Array.from(estado.selecionadas).map((i) => primeiraMedida.valorNumerico(modelo.linhas[i]));
        const soma = agregar(valores2, "soma");
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

  // src/charts/tabela_completa/grupos.js
  function aplicarFiltrosDeColuna(indices, colunas, filtros, modelo) {
    const ativos = colunas.map((coluna) => ({ coluna, termo: (filtros[coluna.id] || "").trim() })).filter((f) => f.termo);
    if (!ativos.length) return indices;
    const testes = ativos.map(({ coluna, termo }) => {
      const comparacao = /^(>=|<=|>|<|=)\s*(-?[\d.,]+)$/.exec(termo);
      if (comparacao && coluna.ehMedida) {
        const operador = comparacao[1];
        const alvo2 = Number(comparacao[2].replace(/\./g, "").replace(",", "."));
        return (linha) => {
          const v = coluna.valorNumerico(linha);
          if (v === null || !Number.isFinite(alvo2)) return false;
          if (operador === ">") return v > alvo2;
          if (operador === ">=") return v >= alvo2;
          if (operador === "<") return v < alvo2;
          if (operador === "<=") return v <= alvo2;
          return v === alvo2;
        };
      }
      const alvo = termo.toLowerCase();
      return (linha) => coluna.texto(linha, "").toLowerCase().includes(alvo);
    });
    return indices.filter((i) => {
      const linha = modelo.linhas[i];
      return testes.every((teste) => teste(linha));
    });
  }
  function montarItens({ indices, colunas, config, modelo, estado }) {
    const quantosNiveis = Number(config.agruparPor);
    const dimensoes = colunas.filter((c) => c.tipo === "dimensao" && c.visivel);
    const niveis = Number.isFinite(quantosNiveis) ? Math.min(quantosNiveis, dimensoes.length) : 0;
    if (niveis <= 0) return indices.map((indice) => ({ tipo: "dado", indice }));
    const colunasDeGrupo = dimensoes.slice(0, niveis);
    const itens = [];
    construirNivel(indices, 0);
    function construirNivel(indicesDoNivel, nivel) {
      if (nivel >= colunasDeGrupo.length) {
        for (const indice of indicesDoNivel) itens.push({ tipo: "dado", indice });
        return;
      }
      const coluna = colunasDeGrupo[nivel];
      const grupos = /* @__PURE__ */ new Map();
      for (const indice of indicesDoNivel) {
        const chave = coluna.texto(modelo.linhas[indice], "(vazio)");
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(indice);
      }
      for (const [rotulo, indicesDoGrupo] of grupos) {
        const chave = `${nivel}:${rotulo}`;
        const aberto = estado.gruposFechados.has(chave) ? false : config.gruposComecamAbertos !== false;
        itens.push({
          tipo: "grupo",
          chave,
          nivel,
          rotulo,
          quantidade: indicesDoGrupo.length,
          indices: indicesDoGrupo,
          aberto
        });
        if (aberto) construirNivel(indicesDoGrupo, nivel + 1);
      }
    }
    return itens;
  }

  // src/core/formulas.js
  var LIMITES = { tamanho: 2e3, profundidade: 40, nos: 500 };
  var ErroDeFormula = class extends Error {
    constructor(mensagem) {
      super(mensagem);
      this.name = "ErroDeFormula";
    }
  };
  var err = (m) => {
    throw new ErroDeFormula(m);
  };
  function tokenizar(texto) {
    const tokens = [];
    let i = 0;
    const n = texto.length;
    while (i < n) {
      const c = texto[i];
      if (/\s/.test(c)) {
        i += 1;
        continue;
      }
      if (c === "$" && texto[i + 1] === "{") {
        const fim = texto.indexOf("}", i + 2);
        if (fim < 0) err('campo sem "}" de fechamento');
        const nome = texto.slice(i + 2, fim).trim();
        if (!nome) err("campo vazio: ${}");
        tokens.push({ t: "campo", v: nome, pos: i });
        i = fim + 1;
        continue;
      }
      if (c === '"') {
        let s = "";
        let j = i + 1;
        for (; ; ) {
          if (j >= n) err("texto sem aspas de fechamento");
          if (texto[j] === '"') {
            if (texto[j + 1] === '"') {
              s += '"';
              j += 2;
              continue;
            }
            break;
          }
          s += texto[j];
          j += 1;
        }
        tokens.push({ t: "texto", v: s, pos: i });
        i = j + 1;
        continue;
      }
      if (/[0-9]/.test(c) || c === "." && /[0-9]/.test(texto[i + 1] || "")) {
        const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(texto.slice(i));
        tokens.push({ t: "num", v: Number(m[0]), pos: i });
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(texto.slice(i));
        tokens.push({ t: "nome", v: m[0].toUpperCase(), pos: i });
        i += m[0].length;
        continue;
      }
      const dois = texto.slice(i, i + 2);
      if (dois === "<=" || dois === ">=" || dois === "<>" || dois === "!=") {
        tokens.push({ t: "op", v: dois === "!=" ? "<>" : dois, pos: i });
        i += 2;
        continue;
      }
      if ("+-*/%=<>(),".includes(c)) {
        tokens.push({ t: c === "(" || c === ")" || c === "," ? c : "op", v: c, pos: i });
        i += 1;
        continue;
      }
      err(`caractere inesperado "${c}"`);
    }
    tokens.push({ t: "fim", pos: n });
    return tokens;
  }
  var FUNCOES = /* @__PURE__ */ new Set([
    "IF",
    "IFS",
    "CASE",
    "COALESCE",
    "ISBLANK",
    "ROUND",
    "ABS",
    "MIN",
    "MAX",
    "SUM",
    "AVG",
    "CONTAINS",
    "LEFT",
    "RIGHT",
    "MID",
    "UPPER",
    "LOWER",
    "LEN",
    "CONCAT",
    "TEXT"
  ]);
  function analisar(tokens) {
    let p = 0;
    let nos = 0;
    const olhar = () => tokens[p];
    const pegar = () => tokens[p++];
    const no = (obj, prof) => {
      nos += 1;
      if (nos > LIMITES.nos) err("f\xF3rmula grande demais");
      if (prof > LIMITES.profundidade) err("f\xF3rmula aninhada demais");
      return obj;
    };
    const esperar = (t, msg) => {
      if (olhar().t !== t) err(msg);
      return pegar();
    };
    const ehNome = (v) => olhar().t === "nome" && olhar().v === v;
    function ou(d) {
      let e = e_(d + 1);
      while (ehNome("OR")) {
        pegar();
        e = no({ k: "ou", a: e, b: e_(d + 1) }, d);
      }
      return e;
    }
    function e_(d) {
      let e = nao(d + 1);
      while (ehNome("AND")) {
        pegar();
        e = no({ k: "e", a: e, b: nao(d + 1) }, d);
      }
      return e;
    }
    function nao(d) {
      if (ehNome("NOT")) {
        pegar();
        return no({ k: "nao", a: nao(d + 1) }, d);
      }
      return comparacao(d + 1);
    }
    function comparacao(d) {
      let e = soma(d + 1);
      while (olhar().t === "op" && ["=", "<>", "<", "<=", ">", ">="].includes(olhar().v)) {
        const op = pegar().v;
        e = no({ k: "cmp", op, a: e, b: soma(d + 1) }, d);
      }
      return e;
    }
    function soma(d) {
      let e = produto(d + 1);
      while (olhar().t === "op" && (olhar().v === "+" || olhar().v === "-")) {
        const op = pegar().v;
        e = no({ k: "arit", op, a: e, b: produto(d + 1) }, d);
      }
      return e;
    }
    function produto(d) {
      let e = unario(d + 1);
      while (olhar().t === "op" && ["*", "/", "%"].includes(olhar().v)) {
        const op = pegar().v;
        e = no({ k: "arit", op, a: e, b: unario(d + 1) }, d);
      }
      return e;
    }
    function unario(d) {
      if (olhar().t === "op" && (olhar().v === "-" || olhar().v === "+")) {
        const op = pegar().v;
        const a = unario(d + 1);
        return op === "-" ? no({ k: "neg", a }, d) : a;
      }
      return primario(d + 1);
    }
    function primario(d) {
      const tk = pegar();
      if (tk.t === "num") return no({ k: "val", v: tk.v }, d);
      if (tk.t === "texto") return no({ k: "val", v: tk.v }, d);
      if (tk.t === "campo") return no({ k: "campo", nome: tk.v }, d);
      if (tk.t === "(") {
        const e = ou(d + 1);
        esperar(")", 'falta ")"');
        return e;
      }
      if (tk.t === "nome") {
        if (tk.v === "TRUE") return no({ k: "val", v: true }, d);
        if (tk.v === "FALSE") return no({ k: "val", v: false }, d);
        if (tk.v === "NULL") return no({ k: "val", v: null }, d);
        if (olhar().t !== "(") err(`nome desconhecido "${tk.v}" (campos v\xE3o entre \${...})`);
        if (!FUNCOES.has(tk.v)) err(`fun\xE7\xE3o desconhecida "${tk.v}"`);
        pegar();
        const args = [];
        if (olhar().t !== ")") {
          for (; ; ) {
            args.push(ou(d + 1));
            if (olhar().t === ",") {
              pegar();
              continue;
            }
            break;
          }
        }
        esperar(")", `falta ")" em ${tk.v}`);
        return no({ k: "fn", nome: tk.v, args }, d);
      }
      if (tk.t === "fim") err("f\xF3rmula incompleta");
      err(`"${tk.v}" fora do lugar`);
      return null;
    }
    const arvore = ou(0);
    if (olhar().t !== "fim") err(`"${olhar().v}" sobrando no fim`);
    return arvore;
  }
  var ARIDADE = {
    IF: [2, 3],
    IFS: [2, Infinity],
    CASE: [3, Infinity],
    COALESCE: [1, Infinity],
    ISBLANK: [1, 1],
    ROUND: [1, 2],
    ABS: [1, 1],
    MIN: [1, Infinity],
    MAX: [1, Infinity],
    SUM: [1, Infinity],
    AVG: [1, Infinity],
    CONTAINS: [2, 2],
    LEFT: [2, 2],
    RIGHT: [2, 2],
    MID: [3, 3],
    UPPER: [1, 1],
    LOWER: [1, 1],
    LEN: [1, 1],
    CONCAT: [1, Infinity],
    TEXT: [1, 2]
  };
  function conferirAridade(no) {
    if (!no || typeof no !== "object") return;
    if (no.k === "fn") {
      const [min, max] = ARIDADE[no.nome];
      if (no.args.length < min || no.args.length > max) {
        err(`${no.nome} espera ${min === max ? min : max === Infinity ? `${min} ou mais` : `${min} a ${max}`} argumento(s)`);
      }
      no.args.forEach(conferirAridade);
    }
    for (const k of ["a", "b"]) if (no[k]) conferirAridade(no[k]);
  }
  function camposDe(no, saida = /* @__PURE__ */ new Set()) {
    if (!no) return saida;
    if (no.k === "campo") saida.add(no.nome);
    if (no.args) no.args.forEach((a) => camposDe(a, saida));
    if (no.a) camposDe(no.a, saida);
    if (no.b) camposDe(no.b, saida);
    return saida;
  }
  function compilarFormula(texto) {
    try {
      const fonte = String(texto != null ? texto : "");
      if (!fonte.trim()) return { ok: false, erro: "f\xF3rmula vazia" };
      if (fonte.length > LIMITES.tamanho) err(`f\xF3rmula com mais de ${LIMITES.tamanho} caracteres`);
      const arvore = analisar(tokenizar(fonte));
      conferirAridade(arvore);
      return { ok: true, arvore, campos: Array.from(camposDe(arvore)) };
    } catch (e) {
      if (e instanceof ErroDeFormula) return { ok: false, erro: e.message };
      return { ok: false, erro: "f\xF3rmula inv\xE1lida" };
    }
  }
  var ehNulo = (v) => v === null || v === void 0 || typeof v === "number" && !Number.isFinite(v);
  var verdadeiro = (v) => ehNulo(v) ? false : typeof v === "string" ? v.length > 0 : !!v;
  function comoNumero(v, onde) {
    if (ehNulo(v)) return null;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    const s = String(v).trim();
    if (s !== "" && Number.isFinite(Number(s))) return Number(s);
    err(`${onde}: "${v}" n\xE3o \xE9 n\xFAmero`);
    return null;
  }
  var comoTexto = (v) => ehNulo(v) ? "" : typeof v === "boolean" ? v ? "TRUE" : "FALSE" : String(v);
  function comparar(op, a, b) {
    if (ehNulo(a) || ehNulo(b)) return false;
    let x = a;
    let y = b;
    if (typeof a === "number" || typeof b === "number") {
      const nx = typeof a === "number" ? a : Number(a);
      const ny = typeof b === "number" ? b : Number(b);
      if (Number.isFinite(nx) && Number.isFinite(ny) && String(a).trim() !== "" && String(b).trim() !== "") {
        x = nx;
        y = ny;
      } else {
        x = comoTexto(a);
        y = comoTexto(b);
      }
    } else if (typeof a === "boolean" || typeof b === "boolean") {
      x = verdadeiro(a);
      y = verdadeiro(b);
    } else {
      x = String(a);
      y = String(b);
    }
    switch (op) {
      case "=":
        return x === y;
      case "<>":
        return x !== y;
      case "<":
        return x < y;
      case "<=":
        return x <= y;
      case ">":
        return x > y;
      default:
        return x >= y;
    }
  }
  function numeros(args, onde) {
    return args.map((v) => comoNumero(v, onde)).filter((v) => v !== null);
  }
  function avaliarArvore(arvore, resolver) {
    const ev = (no) => {
      switch (no.k) {
        case "val":
          return no.v;
        case "campo":
          return resolver(no.nome);
        case "neg": {
          const v = comoNumero(ev(no.a), "sinal");
          return v === null ? null : -v;
        }
        case "nao":
          return !verdadeiro(ev(no.a));
        case "e":
          return verdadeiro(ev(no.a)) && verdadeiro(ev(no.b));
        case "ou":
          return verdadeiro(ev(no.a)) || verdadeiro(ev(no.b));
        case "cmp":
          return comparar(no.op, ev(no.a), ev(no.b));
        case "arit": {
          const a = comoNumero(ev(no.a), no.op);
          const b = comoNumero(ev(no.b), no.op);
          if (a === null || b === null) return null;
          if (no.op === "+") return a + b;
          if (no.op === "-") return a - b;
          if (no.op === "*") return a * b;
          if (b === 0) err("divis\xE3o por zero");
          return no.op === "/" ? a / b : a % b;
        }
        case "fn":
          return chamar(no.nome, no.args, ev);
        default:
          err("n\xF3 desconhecido");
          return null;
      }
    };
    return ev(arvore);
  }
  function chamar(nome, args, ev) {
    const todos = () => args.map(ev);
    switch (nome) {
      case "IF":
        return verdadeiro(ev(args[0])) ? ev(args[1]) : args.length > 2 ? ev(args[2]) : null;
      case "IFS": {
        let i = 0;
        for (; i + 1 < args.length; i += 2) if (verdadeiro(ev(args[i]))) return ev(args[i + 1]);
        return i < args.length ? ev(args[i]) : null;
      }
      case "CASE": {
        const alvo = ev(args[0]);
        let i = 1;
        for (; i + 1 < args.length; i += 2) if (comparar("=", alvo, ev(args[i]))) return ev(args[i + 1]);
        return i < args.length ? ev(args[i]) : null;
      }
      case "COALESCE":
        for (const a of args) {
          const v = ev(a);
          if (!ehNulo(v) && v !== "") return v;
        }
        return null;
      case "ISBLANK": {
        const v = ev(args[0]);
        return ehNulo(v) || v === "";
      }
      case "ROUND": {
        const x = comoNumero(ev(args[0]), "ROUND");
        const casas = args[1] ? comoNumero(ev(args[1]), "ROUND") || 0 : 0;
        if (x === null) return null;
        const f = 10 ** Math.max(-10, Math.min(10, Math.trunc(casas)));
        return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
      }
      case "ABS": {
        const x = comoNumero(ev(args[0]), "ABS");
        return x === null ? null : Math.abs(x);
      }
      case "MIN":
      case "MAX": {
        const v = numeros(todos(), nome);
        if (!v.length) return null;
        return nome === "MIN" ? Math.min(...v) : Math.max(...v);
      }
      case "SUM": {
        const v = numeros(todos(), "SUM");
        return v.length ? v.reduce((s, x) => s + x, 0) : null;
      }
      case "AVG": {
        const v = numeros(todos(), "AVG");
        return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
      }
      case "CONTAINS": {
        const t = ev(args[0]);
        if (ehNulo(t)) return false;
        return comoTexto(t).includes(comoTexto(ev(args[1])));
      }
      case "LEFT":
      case "RIGHT": {
        const t = ev(args[0]);
        if (ehNulo(t)) return null;
        const s = comoTexto(t);
        const k = Math.max(0, Math.trunc(comoNumero(ev(args[1]), nome) || 0));
        return nome === "LEFT" ? s.slice(0, k) : k === 0 ? "" : s.slice(-k);
      }
      case "MID": {
        const t = ev(args[0]);
        if (ehNulo(t)) return null;
        const ini = Math.max(1, Math.trunc(comoNumero(ev(args[1]), "MID") || 1));
        const k = Math.max(0, Math.trunc(comoNumero(ev(args[2]), "MID") || 0));
        return comoTexto(t).slice(ini - 1, ini - 1 + k);
      }
      case "UPPER":
      case "LOWER": {
        const t = ev(args[0]);
        if (ehNulo(t)) return null;
        return nome === "UPPER" ? comoTexto(t).toUpperCase() : comoTexto(t).toLowerCase();
      }
      case "LEN": {
        const t = ev(args[0]);
        return ehNulo(t) ? 0 : comoTexto(t).length;
      }
      case "CONCAT":
        return todos().map(comoTexto).join("");
      case "TEXT": {
        const v = ev(args[0]);
        if (ehNulo(v)) return "";
        if (args.length < 2 || typeof v !== "number") return comoTexto(v);
        const fmt = ev(args[1]);
        let casas = typeof fmt === "number" ? fmt : String(fmt).includes(".") ? String(fmt).split(".")[1].length : 0;
        casas = Math.max(0, Math.min(10, Math.trunc(casas)));
        return v.toFixed(casas);
      }
      default:
        err(`fun\xE7\xE3o desconhecida "${nome}"`);
        return null;
    }
  }
  function criarResolvedor(campos) {
    const mapa = /* @__PURE__ */ new Map();
    const ambiguos = /* @__PURE__ */ new Set();
    const por = (chave, item) => {
      const k = String(chave || "").trim().toLowerCase();
      if (!k) return;
      if (mapa.has(k) && mapa.get(k) !== item) ambiguos.add(k);
      else mapa.set(k, item);
    };
    campos.forEach((c) => c.nomes.forEach((n) => por(n, c)));
    return (nome) => {
      const k = String(nome).trim().toLowerCase();
      if (ambiguos.has(k)) err(`campo amb\xEDguo: ${nome} (use o nome completo)`);
      const item = mapa.get(k);
      if (!item) err(`campo n\xE3o encontrado: ${nome}`);
      return item.valor();
    };
  }

  // src/charts/tabela_completa/calculadas.js
  var ESPACOS_DE_FORMULA = 8;
  function opcoesDasCalculadas() {
    const saida = {};
    for (let n = 1; n <= ESPACOS_DE_FORMULA; n++) {
      const s = `F\xF3rmula ${n}`;
      const p = `calc${n}`;
      Object.assign(saida, {
        [`${p}Nome`]: { type: "string", label: "Nome da coluna", section: s, default: "" },
        [`${p}Formula`]: {
          type: "string",
          label: "F\xF3rmula",
          section: s,
          placeholder: 'IF(${campo} > 10, "Alto", "Baixo")',
          default: ""
        },
        [`${p}Uso`]: {
          type: "string",
          label: "Uso",
          section: s,
          display: "select",
          values: listaDeValores([
            { rotulo: "Coluna com o resultado", valor: "coluna" },
            { rotulo: "Colorir a linha se verdadeira", valor: "linha" },
            { rotulo: "Colorir c\xE9lulas se verdadeira", valor: "celula" }
          ]),
          default: "coluna"
        },
        [`${p}Formato`]: {
          type: "string",
          label: "Formato",
          section: s,
          display: "select",
          values: listaDeValores([
            { rotulo: "N\xFAmero", valor: "numero" },
            { rotulo: "Moeda", valor: "moeda" },
            { rotulo: "Percentual", valor: "percentual" },
            { rotulo: "Texto", valor: "texto" }
          ]),
          default: "numero"
        },
        [`${p}Casas`]: { type: "number", label: "Casas decimais", section: s, default: 2 },
        [`${p}TipoDeCelula`]: {
          type: "string",
          label: "Tipo de c\xE9lula",
          section: s,
          display: "select",
          values: listaDeValores(TIPOS_DE_CELULA),
          default: "auto"
        },
        [`${p}Posicao`]: {
          type: "string",
          label: "Posi\xE7\xE3o",
          section: s,
          display: "select",
          values: listaDeValores([
            { rotulo: "Depois das medidas", valor: "fim" },
            { rotulo: "Antes das medidas", valor: "inicio" }
          ]),
          default: "fim"
        },
        [`${p}Pivo`]: {
          type: "string",
          label: "Modo do piv\xF4",
          section: s,
          display: "select",
          values: listaDeValores([
            { rotulo: "Uma vez por valor do piv\xF4", valor: "porPivo" },
            { rotulo: "S\xF3 nas colunas sem piv\xF4", valor: "semPivo" }
          ]),
          default: "porPivo"
        },
        [`${p}Total`]: {
          type: "string",
          label: "Linha de totais",
          section: s,
          display: "select",
          values: listaDeValores([
            { rotulo: "Recalcular sobre os totais", valor: "recalcular" },
            { rotulo: "Vazio", valor: "vazio" }
          ]),
          default: "recalcular"
        },
        [`${p}Cor`]: { type: "string", label: "Cor (uso colorir)", section: s, display: "color", default: "#FEF3C7" },
        [`${p}Alvo`]: { type: "string", label: "Aplicar na coluna", section: s, placeholder: "nome da coluna", default: "" }
      });
    }
    return saida;
  }
  function lerEspacos(config) {
    const espacos = [];
    for (let n = 1; n <= ESPACOS_DE_FORMULA; n++) {
      const p = `calc${n}`;
      const formula = String(config[`${p}Formula`] || "").trim();
      if (!formula) continue;
      espacos.push({
        n,
        nome: String(config[`${p}Nome`] || "").trim() || `F\xF3rmula ${n}`,
        formula,
        compilada: compilarFormula(formula),
        uso: ["linha", "celula"].includes(config[`${p}Uso`]) ? config[`${p}Uso`] : "coluna",
        formato: config[`${p}Formato`] || "numero",
        casas: Number.isFinite(Number(config[`${p}Casas`])) ? Number(config[`${p}Casas`]) : 2,
        tipoDeCelula: config[`${p}TipoDeCelula`] || "auto",
        posicao: config[`${p}Posicao`] === "inicio" ? "inicio" : "fim",
        modoPivo: config[`${p}Pivo`] === "semPivo" ? "semPivo" : "porPivo",
        total: config[`${p}Total`] === "vazio" ? "vazio" : "recalcular",
        cor: config[`${p}Cor`] || "#FEF3C7",
        alvo: String(config[`${p}Alvo`] || "").trim()
      });
    }
    return espacos;
  }
  var semView = (nome) => String(nome).split(".").pop();
  function resolvedorDaLinha(modelo, linha, { chave = null, semPivo = false } = {}) {
    const campos = [];
    for (const c of modelo.dimensoes) {
      campos.push({
        nomes: [c.nome, semView(c.nome), c.rotuloCurto, c.rotulo],
        valor: () => {
          const cel = modelo.celula(linha, c.nome);
          return cel ? cel.value : null;
        }
      });
    }
    for (const c of modelo.medidas) {
      campos.push({
        nomes: [c.nome, semView(c.nome), c.rotuloCurto, c.rotulo],
        valor: () => {
          if (modelo.temPivo && semPivo) {
            return typeof modelo.totalDaLinha === "function" ? modelo.totalDaLinha(linha, c.nome) : null;
          }
          return modelo.valorNumerico(linha, c.nome, chave || void 0);
        }
      });
    }
    return criarResolvedor(campos);
  }
  function avaliadorComCache(espaco, modelo, opcoes) {
    const cache = /* @__PURE__ */ new WeakMap();
    return (linha) => {
      if (!espaco.compilada.ok) return { erro: espaco.compilada.erro };
      if (cache.has(linha)) return cache.get(linha);
      let r;
      try {
        r = { valor: avaliarArvore(espaco.compilada.arvore, resolvedorDaLinha(modelo, linha, opcoes)) };
      } catch (e) {
        r = { erro: e instanceof ErroDeFormula ? e.message : "erro ao calcular" };
      }
      cache.set(linha, r);
      return r;
    };
  }
  function totalDoCampo(modelo, nome, chave, indicesVisiveis, agregar2, tipoDeAgregacao) {
    const ehMedida = modelo.medidas.some((m) => m.nome === nome);
    if (!ehMedida) return { tem: false };
    const t = modelo.totais && modelo.totais.encontrados ? modelo.totais.porCampo[nome] : null;
    if (t) {
      const cel = chave ? t[chave] : t;
      const v = cel && cel.value !== void 0 ? Number(cel.value) : NaN;
      if (Number.isFinite(v)) return { tem: true, valor: v };
    }
    const valores2 = indicesVisiveis.map((i) => modelo.valorNumerico(modelo.linhas[i], nome, chave || void 0));
    return { tem: true, valor: agregar2(valores2, tipoDeAgregacao) };
  }
  function colunasCalculadas(modelo, config, { larguraPadrao = 130 } = {}) {
    const espacos = lerEspacos(config).filter((e) => e.uso === "coluna");
    const soltas = { inicio: [], fim: [] };
    const porPivo = /* @__PURE__ */ new Map();
    const erros = [];
    for (const e of espacos) {
      if (!e.compilada.ok) erros.push(`F\xF3rmula ${e.n} ("${e.nome}"): ${e.compilada.erro}`);
      if (modelo.temPivo && e.modoPivo === "porPivo") {
        for (const pivo of modelo.pivotsDeDados) {
          const col = montarColunaCalculada(e, modelo, { pivo, larguraPadrao });
          if (!porPivo.has(pivo.chave)) porPivo.set(pivo.chave, { inicio: [], fim: [] });
          porPivo.get(pivo.chave)[e.posicao].push(col);
        }
      } else {
        const col = montarColunaCalculada(e, modelo, { pivo: null, semPivo: modelo.temPivo, larguraPadrao });
        col.soltaNoCabecalho = modelo.temPivo;
        soltas[e.posicao].push(col);
      }
    }
    return { soltas, porPivo, erros };
  }
  function montarColunaCalculada(e, modelo, { pivo, semPivo = false, larguraPadrao }) {
    const chave = pivo ? pivo.chave : null;
    const avaliar = avaliadorComCache(e, modelo, { chave, semPivo });
    const ehTexto = e.formato === "texto";
    const formatar = ehTexto ? null : criarFormatadorNumerico({ estilo: e.formato, casas: e.casas, simboloDaMoeda: "$" });
    const textoDoValor = (v) => {
      if (v === null || v === void 0) return null;
      if (typeof v === "number" && formatar && Number.isFinite(v)) return formatar(v);
      if (typeof v === "boolean") return v ? "Verdadeiro" : "Falso";
      return String(v);
    };
    const id = `calc${e.n}${chave ? `__${chave}` : ""}`;
    return {
      id,
      tipo: "calculada",
      ehMedida: !ehTexto,
      campo: { nome: id, rotulo: e.nome, rotuloCurto: e.nome },
      pivo,
      chaveDoPivo: chave || void 0,
      rotulo: e.nome,
      rotuloOriginal: e.nome,
      largura: larguraPadrao,
      alinhamento: ehTexto ? "left" : "right",
      visivel: true,
      tipoDeCelula: e.tipoDeCelula,
      corDoTexto: "",
      corDeFundo: "",
      prefixo: "",
      sufixo: "",
      corDaBarra: "#4276BE",
      escalaDeCor: false,
      escalaCorMin: "#FFFFFF",
      escalaCorMax: "#60A5FA",
      regras: [],
      formatar: formatar || ((v) => String(v)),
      formatoProprio: true,
      espacoDeFormula: e,
      resultado: avaliar,
      valorNumerico(linha) {
        const r = avaliar(linha);
        return r.erro || typeof r.valor !== "number" || !Number.isFinite(r.valor) ? null : r.valor;
      },
      texto(linha, textoNulo) {
        const r = avaliar(linha);
        if (r.erro) return `#ERRO: ${r.erro}`;
        const t = textoDoValor(r.valor);
        return t === null ? textoNulo : t;
      },
      celula() {
        return void 0;
      },
      /** Total da coluna (rodapé): fórmula sobre os totais, ou vazio. */
      totalCalculado(indicesVisiveis, agregar2, tipoDeAgregacao) {
        var _a;
        if (e.total === "vazio" || !e.compilada.ok) return "";
        const campos = [];
        for (const nome of e.compilada.campos) {
          const alvo = [...modelo.dimensoes, ...modelo.medidas].find(
            (c) => [c.nome, semView(c.nome), c.rotuloCurto, c.rotulo].some((n) => n && n.toLowerCase() === nome.toLowerCase())
          );
          if (!alvo) return "";
          const t = totalDoCampo(modelo, alvo.nome, chave, indicesVisiveis, agregar2, tipoDeAgregacao);
          if (!t.tem) return "";
          campos.push({ nomes: [nome], valor: () => t.valor });
        }
        try {
          const v = avaliarArvore(e.compilada.arvore, criarResolvedor(campos));
          return (_a = textoDoValor(v)) != null ? _a : "";
        } catch (err2) {
          return err2 instanceof ErroDeFormula ? `#ERRO: ${err2.message}` : "";
        }
      }
    };
  }
  function regrasDeFormula(modelo, config) {
    const regras = lerEspacos(config).filter((e) => e.uso !== "coluna" && e.compilada.ok).map((e) => ({
      e,
      alvo: normalizarTexto(e.alvo),
      porChave: /* @__PURE__ */ new Map()
    }));
    if (!regras.length) return null;
    return function aplicar(td, coluna, linha) {
      for (const r of regras) {
        if (r.e.uso === "celula") {
          const nomes = [coluna.rotulo, coluna.rotuloOriginal, coluna.campo && coluna.campo.nome].filter(Boolean).map(normalizarTexto);
          if (!r.alvo || !nomes.includes(r.alvo)) continue;
        }
        const chave = coluna.chaveDoPivo || "";
        if (!r.porChave.has(chave)) {
          r.porChave.set(chave, avaliadorComCache(r.e, modelo, { chave: chave || null, semPivo: !chave && modelo.temPivo }));
        }
        const res = r.porChave.get(chave)(linha);
        const v = res.valor;
        if (!res.erro && v !== null && v !== void 0 && v !== false && v !== 0 && v !== "") {
          td.style.background = r.e.cor;
        }
      }
    };
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
      // Colunas calculadas por fórmula (5.4, v3): 8 espaços fixos.
      opcoesDasCalculadas(),
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
        estiloDeData: {
          type: "string",
          label: 'Formato das colunas com tipo de c\xE9lula "Data"',
          section: "Dados",
          display: "select",
          default: "auto",
          values: listaDeValores([
            { rotulo: "Dia/m\xEAs/ano", valor: "auto" },
            { rotulo: "Dia/m\xEAs", valor: "diaMes" },
            { rotulo: "M\xEAs/ano", valor: "mesAno" },
            { rotulo: "Ano", valor: "ano" },
            { rotulo: "Data e hora", valor: "completo" }
          ])
        },
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
        // Busca "contém" (5.3, v3). Opções novas, padrão novo.
        modoDaBusca: {
          type: "string",
          label: "V\xE1rias palavras",
          section: "Busca",
          display: "select",
          values: [{ "Todas precisam aparecer": "todas" }, { "Qualquer uma basta": "qualquer" }],
          default: "todas"
        },
        colunasDaBusca: {
          type: "string",
          label: "Colunas (vazio = vis\xEDveis)",
          section: "Busca",
          placeholder: "C\xF3digo, Descri\xE7\xE3o",
          default: ""
        },
        buscarEm: {
          type: "string",
          label: "Procurar no",
          section: "Busca",
          display: "select",
          values: [{ "Texto formatado": "formatado" }, { "Valor bruto": "bruto" }],
          default: "formatado"
        },
        realcarBusca: { type: "boolean", label: "Real\xE7ar o trecho", section: "Busca", default: true },
        mostrarFiltrosPorColuna: {
          type: "boolean",
          label: "Mostrar filtro em cada coluna",
          section: "Intera\xE7\xE3o",
          default: false
        },
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
    const calculadas = colunasCalculadas(modelo, config, { larguraPadrao });
    colunas.push(...calculadas.soltas.inicio);
    if (modelo.temPivo) colunas.push(...calculadas.soltas.fim);
    const gruposDePivo = [];
    if (modelo.temPivo) {
      for (const pivo of modelo.pivotsDeDados) {
        const colunasDoGrupo = [];
        const doPivo = calculadas.porPivo.get(pivo.chave) || { inicio: [], fim: [] };
        colunas.push(...doPivo.inicio);
        colunasDoGrupo.push(...doPivo.inicio);
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
        colunas.push(...doPivo.fim);
        colunasDoGrupo.push(...doPivo.fim);
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
    if (!modelo.temPivo) colunas.push(...calculadas.soltas.fim);
    const colunasVisiveis = colunas.filter((c) => c.visivel);
    return { colunas, colunasVisiveis, temPivo: modelo.temPivo, gruposDePivo, errosDeFormula: calculadas.erros };
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

  // src/charts/tabela_completa/index.js
  var ESPERA_DO_FILTRO = 150;
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
    if (!estado.gruposFechados) estado.gruposFechados = /* @__PURE__ */ new Set();
    if (!estado.filtros) estado.filtros = {};
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
  function criarPintorDeCelula(ctx, nulo, contextos2, porId, comparacao) {
    const { config, ponte, modelo } = ctx;
    const porFormula = regrasDeFormula(modelo, config);
    return function pintarCelula({ td, coluna, linha, indiceDaLinha }) {
      const estatistica = contextos2.get(coluna.id) || null;
      if (comparacao && coluna.ehMedida) {
        compararComAtualizacaoAnterior({ ctx, td, coluna, linha, indiceDaLinha, comparacao });
      }
      if (coluna.corDoTexto) td.style.color = coluna.corDoTexto;
      if (coluna.corDeFundo) td.style.background = coluna.corDeFundo;
      if (coluna.escalaDeCor && estatistica) {
        const posicao = posicaoNaColuna(coluna.valorNumerico(linha), estatistica);
        if (posicao !== null) {
          const fundo = misturarCores(coluna.escalaCorMin, coluna.escalaCorMax, posicao);
          td.style.background = fundo;
          td.style.color = textoLegivelSobre(fundo, ctx.tema);
        }
      }
      const textoBase = coluna.texto(linha, nulo);
      const texto = textoBase === "" ? "" : `${coluna.prefixo}${textoBase}${coluna.sufixo}`;
      const efeito = avaliarRegras({ coluna, linha, contextos: contextos2, porId, textoDaCelula: textoBase });
      const desenhista = desenhistaDoTipo(coluna.tipoDeCelula) || (efeito && efeito.badge ? desenhistaDoTipo("badge") : null);
      let textoEquivalente = texto;
      if (desenhista) {
        textoEquivalente = desenhista({
          td,
          coluna,
          linha,
          texto,
          visual: ctx.visualDaTabela,
          config,
          modelo,
          ponte,
          eventos: ctx.eventos,
          estatistica,
          corDoBadge: efeito && efeito.badge,
          // Saída de emergência de qualquer desenhista: escreve o texto puro.
          comoTexto: () => {
            definirTexto(td, texto);
            return texto;
          }
        });
      } else {
        definirTexto(td, texto);
      }
      td.title = textoEquivalente;
      if (efeito) {
        if (efeito.fundo) td.style.background = efeito.fundo;
        if (efeito.cor) td.style.color = efeito.cor;
        if (efeito.negrito) td.style.fontWeight = "700";
        if (efeito.bordaEsquerda) td.style.borderLeft = `3px solid ${efeito.bordaEsquerda}`;
        if (efeito.piscar) td.classList.add("tc-piscando");
        if (efeito.icone) {
          const icone = criarEl("span", { classe: "tc-icone", texto: `${efeito.icone} ` });
          icone.style.color = efeito.corDoIcone || "";
          td.insertBefore(icone, td.firstChild);
        }
        if (efeito.linhaInteira && td.parentNode) {
          if (efeito.linhaInteira.fundo) td.parentNode.style.background = efeito.linhaInteira.fundo;
          if (efeito.linhaInteira.cor) td.parentNode.style.color = efeito.linhaInteira.cor;
        }
      }
      if (porFormula) porFormula(td, coluna, linha);
      if (config.permitirDrill === false || coluna.tipoDeCelula === "link") return;
      const celula = coluna.celula(linha);
      if (celula && ponte.temDrill(celula)) {
        td.style.cursor = "pointer";
        ctx.eventos.on(td, "click", (ev) => {
          ev.stopPropagation();
          ponte.abrirDrill(celula, ev);
        });
      }
    };
  }
  function baixarCsv(conteudo, nomeDoArquivo) {
    if (typeof Blob !== "function" || typeof URL === "undefined" || !URL.createObjectURL) return false;
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
    return true;
  }
  function mostrarPainelDeCsv({ ctx, conteudo, visual, tentouBaixar }) {
    fecharPainelDeCsv(ctx.estado);
    const painel = criarEl("div", { classe: "tc-csv", pai: document.body });
    painel.style.background = visual.fundo;
    painel.style.color = visual.texto;
    painel.style.borderColor = visual.borda;
    ctx.estado.painelDeCsv = painel;
    criarEl("div", {
      pai: painel,
      texto: tentouBaixar ? "Se o download n\xE3o come\xE7ou, o Looker bloqueou downloads nesta visualiza\xE7\xE3o. Copie o CSV abaixo e cole numa planilha." : "Este navegador n\xE3o permite gerar o arquivo aqui. Copie o CSV abaixo e cole numa planilha."
    });
    const area = criarEl("textarea", { pai: painel });
    area.id = idDoCampo(ctx.estado, "csv");
    area.name = "csv";
    area.setAttribute("aria-label", "Conte\xFAdo CSV da tabela");
    area.readOnly = true;
    area.value = conteudo;
    area.style.background = visual.fundo;
    area.style.color = visual.texto;
    area.style.borderColor = visual.borda;
    const botoes = criarEl("div", { classe: "tc-csv-botoes", pai: painel });
    const copiarBotao = criarEl("button", { pai: botoes, texto: "Copiar" });
    const fechar = criarEl("button", { pai: botoes, texto: "Fechar" });
    const situacao = criarEl("span", { pai: botoes });
    for (const b of [copiarBotao, fechar]) {
      b.type = "button";
      b.style.borderColor = visual.borda;
      b.style.color = visual.texto;
    }
    copiarBotao.addEventListener("click", () => {
      area.focus();
      area.select();
      const avisar = (ok) => definirTexto(situacao, ok ? "Copiado." : "O Looker bloqueou a c\xF3pia autom\xE1tica: o texto est\xE1 selecionado, use Ctrl+C.");
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(conteudo).then(() => avisar(true), () => avisar(copiar(conteudo)));
      } else {
        avisar(copiar(conteudo));
      }
    });
    fechar.addEventListener("click", () => fecharPainelDeCsv(ctx.estado));
  }
  function fecharPainelDeCsv(estado) {
    const painel = estado && estado.painelDeCsv;
    if (painel && painel.parentNode) painel.parentNode.removeChild(painel);
    if (estado) estado.painelDeCsv = null;
  }
  function compararComAtualizacaoAnterior({ ctx, td, coluna, linha, indiceDaLinha, comparacao }) {
    const chave = `${indiceDaLinha}|${coluna.id}`;
    const valor = coluna.valorNumerico(linha);
    comparacao.novos.set(chave, valor);
    if (!comparacao.anteriores) return;
    const antigo = comparacao.anteriores.get(chave);
    if (antigo === void 0 || antigo === null || valor === null || valor === antigo) return;
    const cor = valor > antigo ? ctx.config.corDeSubida || "#16A34A" : ctx.config.corDeDescida || "#DC2626";
    const fundoAnterior = td.style.background;
    td.classList.add("tc-flash");
    td.style.background = comOpacidade(cor, 0.35);
    ctx.agendarTimer(() => {
      td.style.background = fundoAnterior;
    }, 60);
  }
  function copiar(texto) {
    if (typeof document === "undefined") return false;
    const area = criarEl("textarea");
    area.id = `tabela_completa-copia-${Date.now()}`;
    area.name = "copia";
    area.value = texto;
    area.setAttribute("readonly", "readonly");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    let deuCerto = false;
    try {
      area.select();
      deuCerto = typeof document.execCommand === "function" && document.execCommand("copy");
    } catch (_) {
      deuCerto = false;
    }
    document.body.removeChild(area);
    return deuCerto;
  }
  var index_default = defineViz({
    id: "tabela_completa",
    label: "Tabela Completa",
    opcoes: opcoesEstaticas(),
    // A tabela aceita praticamente qualquer consulta: com ou sem pivô, só
    // dimensões, só medidas ou os dois.
    exigencia: { aceitaPivo: true, exigeLinhas: true },
    // A tabela anima as próprias linhas (animarEntradaDasLinhas) e a
    // virtualização redesenha ao rolar: a animação genérica não entra.
    animacaoPropria: true,
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
      const { colunas, colunasVisiveis, temPivo, gruposDePivo, errosDeFormula } = construirColunas(modelo, config);
      for (const erro of errosDeFormula || []) ctx.avisar(erro);
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
      ctx.visualDaTabela = visual;
      const nulo = textoParaNulo(config);
      const porId = new Map(colunas.map((c) => [c.id, c]));
      function calcularIndices() {
        const todos = modelo.linhas.map((_, i) => i);
        const porColuna = aplicarFiltrosDeColuna(todos, colunasVisiveis, estado.filtros, modelo);
        const buscados = filtrarIndices(porColuna, colunasVisiveis, estado.busca, modelo, config);
        return ordenarIndices(buscados, colunas, estado.ordenacao, modelo);
      }
      let indicesVisiveis = calcularIndices();
      let itens = montarItens({ indices: indicesVisiveis, colunas, config, modelo, estado });
      const estatisticas = () => prepararRegras(colunas, indicesVisiveis, modelo, TIPOS_QUE_PRECISAM_DA_COLUNA);
      const comparacao = config.animarMudancaDeValor !== false && !ctx.primeiraRenderizacao ? { anteriores: estado.valoresAnteriores || null, novos: /* @__PURE__ */ new Map() } : { anteriores: null, novos: /* @__PURE__ */ new Map() };
      let pintarCelula = criarPintorDeCelula(ctx, nulo, estatisticas(), porId, comparacao);
      function recalcular() {
        indicesVisiveis = calcularIndices();
        itens = montarItens({ indices: indicesVisiveis, colunas, config, modelo, estado });
      }
      function redesenhar() {
        recalcular();
        pintarCelula = criarPintorDeCelula(ctx, nulo, estatisticas(), porId, null);
        desenhar({ animarEntrada: true });
      }
      function filtrarDepoisDeDigitar() {
        if (estado.timerDoFiltro) clearTimeout(estado.timerDoFiltro);
        estado.timerDoFiltro = ctx.agendarTimer(() => {
          estado.timerDoFiltro = null;
          recalcular();
          pintarCelula = criarPintorDeCelula(ctx, nulo, estatisticas(), porId, null);
          if (desenho && desenho.atualizarDados) desenho.atualizarDados(itens, indicesVisiveis, pintarCelula);
          else desenhar();
        }, ESPERA_DO_FILTRO);
      }
      let desenho = null;
      function desenhar({ animarEntrada = false } = {}) {
        ctx.eventos.limpar();
        desenho = desenharTabela({
          animarEntrada,
          ctx,
          colunas,
          gruposDePivo,
          temPivo,
          visual,
          itens,
          indicesDeDados: indicesVisiveis,
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
            filtrarDepoisDeDigitar();
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
            const csv = montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo);
            const tentouBaixar = baixarCsv(csv, "tabela_completa.csv");
            mostrarPainelDeCsv({ ctx, conteudo: csv, visual, tentouBaixar });
          },
          aoAlternarGrupo(chave) {
            if (estado.gruposFechados.has(chave)) estado.gruposFechados.delete(chave);
            else estado.gruposFechados.add(chave);
            redesenhar();
          },
          aoFiltrarColuna(colunaId, termo) {
            estado.filtros[colunaId] = termo;
            estado.pagina = 0;
            estado.rolagemTopo = 0;
            filtrarDepoisDeDigitar();
          },
          aoMenuDeContexto: config.permitirCopiar === false ? null : abrirMenuDeContexto
        });
      }
      function abrirMenuDeContexto(evento, { coluna, linha, indiceDaLinha }) {
        evento.preventDefault();
        fecharMenu();
        const menu = criarEl("div", { classe: "tc-menu", pai: document.body });
        menu.style.background = visual.fundo;
        menu.style.color = visual.texto;
        menu.style.borderColor = visual.borda;
        menu.style.boxShadow = tema.sombra;
        menu.style.left = `${evento.clientX}px`;
        menu.style.top = `${evento.clientY}px`;
        ctx.estado.menuAberto = menu;
        const item = (rotulo, acao) => {
          const botao = criarEl("button", { pai: menu, texto: rotulo });
          ctx.eventos.on(botao, "click", () => {
            acao();
            fecharMenu();
          });
        };
        item("Copiar valor desta c\xE9lula", () => copiar(coluna.texto(linha, nulo)));
        item("Copiar esta linha", () => copiar(linhaComoTexto(indiceDaLinha)));
        if (estado.selecionadas.size) {
          item(
            `Copiar ${estado.selecionadas.size} linha(s) selecionada(s)`,
            () => copiar(Array.from(estado.selecionadas).map(linhaComoTexto).join("\n"))
          );
        }
        item("Copiar a tabela inteira", () => copiar(montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo)));
        item("Exportar CSV", () => {
          const csv = montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo);
          mostrarPainelDeCsv({ ctx, conteudo: csv, visual, tentouBaixar: baixarCsv(csv, "tabela_completa.csv") });
        });
        const celula = coluna.celula(linha);
        if (config.permitirDrill !== false && celula && ctx.ponte.temDrill(celula)) {
          item("Abrir drill do Looker", () => ctx.ponte.abrirDrill(celula, evento));
        }
        ctx.agendarTimer(() => {
          ctx.eventos.on(document, "click", fecharMenu, { once: true });
        }, 0);
      }
      function fecharMenu() {
        const menu = ctx.estado.menuAberto;
        if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
        ctx.estado.menuAberto = null;
      }
      function linhaComoTexto(indice) {
        const linha = modelo.linhas[indice];
        return colunasVisiveis.map((c) => c.texto(linha, nulo)).join("	");
      }
      desenhar({ animarEntrada: true });
      estado.valoresAnteriores = new Map([...estado.valoresAnteriores || [], ...comparacao.novos]);
      comparacao.anteriores = null;
    },
    aoDestruir({ estado }) {
      fecharPainelDeCsv(estado);
      const menu = estado && estado.menuAberto;
      if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
    }
  });
})();
