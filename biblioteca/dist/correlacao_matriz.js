/*!
 * Matriz de Correlacao — visualização customizada para o Looker
 * id: correlacao_matriz
 * versão: 0.1.0 | build: 2026-10-22 18:27:33 | commit: 2f3b5ad
 *
 * Arquivo AUTOCONTIDO: no Looker, o campo "Dependencies" deve ficar VAZIO.
 * Gerado por biblioteca/build/build.mjs — não edite este arquivo à mão;
 * edite src/charts/correlacao_matriz/index.js e rode `npm run build`.
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
      var fill = specifier.fill, align = specifier.align, sign2 = specifier.sign, symbol = specifier.symbol, zero = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
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
  function numeroOuNulo(valor) {
    if (valor === null || valor === void 0 || valor === "") return null;
    const n = typeof valor === "number" ? valor : Number(valor);
    return Number.isFinite(n) ? n : null;
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

  // src/core/scales.js
  function misturarCores(a, b, t) {
    return rgb_default(a, b)(Math.max(0, Math.min(1, t)));
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

  // src/core/estatistica.js
  function regressaoLinear(pontos) {
    const limpos = pontos.filter(
      (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
    );
    const n = limpos.length;
    if (n < 2) return null;
    let somaX = 0;
    let somaY = 0;
    for (const p of limpos) {
      somaX += p.x;
      somaY += p.y;
    }
    const mediaX = somaX / n;
    const mediaY = somaY / n;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (const p of limpos) {
      const dx = p.x - mediaX;
      const dy = p.y - mediaY;
      sxy += dx * dy;
      sxx += dx * dx;
      syy += dy * dy;
    }
    if (sxx === 0) return null;
    const inclinacao = sxy / sxx;
    const intercepto = mediaY - inclinacao * mediaX;
    const r2 = syy === 0 ? 1 : sxy * sxy / (sxx * syy);
    const sqe = Math.max(0, syy - inclinacao * sxy);
    const erroResidual = n > 2 ? Math.sqrt(sqe / (n - 2)) : null;
    return {
      n,
      inclinacao,
      intercepto,
      r2: Math.max(0, Math.min(1, r2)),
      mediaX,
      mediaY,
      sxx,
      syy,
      sxy,
      sqe,
      erroResidual,
      grausDeLiberdade: n - 2,
      previsto: (x) => intercepto + inclinacao * x
    };
  }
  function correlacaoDePearson(pontos) {
    const regressao = regressaoLinear(pontos);
    if (!regressao) return null;
    if (!(regressao.syy > 0) || !(regressao.sxx > 0)) return null;
    const sinal = regressao.inclinacao >= 0 ? 1 : -1;
    return sinal * Math.sqrt(regressao.r2);
  }
  function postos(valores) {
    const indices = valores.map((valor, indice) => ({ valor, indice })).sort((a, b) => a.valor - b.valor);
    const saida = new Array(valores.length);
    let i = 0;
    while (i < indices.length) {
      let j = i;
      while (j + 1 < indices.length && indices[j + 1].valor === indices[i].valor) j += 1;
      const media = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) saida[indices[k].indice] = media;
      i = j + 1;
    }
    return saida;
  }
  function correlacaoDeSpearman(pontos) {
    const limpos = pontos.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (limpos.length < 2) return null;
    const px = postos(limpos.map((p) => p.x));
    const py = postos(limpos.map((p) => p.y));
    return correlacaoDePearson(px.map((x, i) => ({ x, y: py[i] })));
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

  // src/charts/_dispersao/index.js
  var MINIMO_PARA_INFERENCIA = 10;
  function lerLinhasCompletas({ modelo, medidas, campoDoRotulo = null }) {
    const linhas = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const valores = medidas.map((m) => modelo.valorNumerico(modelo.linhas[i], m.nome));
      if (valores.some((v) => v === null)) continue;
      linhas.push({
        indice: i,
        valores,
        rotulo: campoDoRotulo ? modelo.texto(modelo.linhas[i], campoDoRotulo.nome, void 0, "") : `#${i + 1}`
      });
    }
    return { linhas, descartadas: modelo.linhas.length - linhas.length };
  }

  // src/charts/correlacao_matriz/index.js
  var CSS = `
.cm-area{position:relative;width:100%;height:100%;overflow:hidden;}
.cm-svg{position:absolute;left:0;top:0;}
.cm-celula{cursor:default;}
.cm-valor{pointer-events:none;}
.cm-nome{pointer-events:none;}
.cm-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
.cm-legenda{pointer-events:none;}
`;
  var MAXIMO_DE_MEDIDAS = 40;
  var index_default = defineViz({
    id: "correlacao_matriz",
    label: "Matriz de Correla\xE7\xE3o",
    opcoes: comDefaults(
      montarOpcoes(
        blocoDeRotulos(),
        blocoDeTooltip(),
        blocoDeTema(),
        blocoAvancado(),
        {
          metodo: {
            type: "string",
            label: "M\xE9todo",
            section: "Correla\xE7\xE3o",
            display: "select",
            default: "pearson",
            values: listaDeValores([
              { rotulo: "Pearson (rela\xE7\xE3o linear)", valor: "pearson" },
              { rotulo: "Spearman (rela\xE7\xE3o mon\xF3tona, sobre postos)", valor: "spearman" },
              { rotulo: "Pearson abaixo, Spearman acima (comparar)", valor: "ambos" }
            ])
          },
          ordem: {
            type: "string",
            label: "Ordem das vari\xE1veis",
            section: "Correla\xE7\xE3o",
            display: "select",
            default: "agrupada",
            values: listaDeValores([
              { rotulo: "Agrupada por similaridade (blocos aparecem)", valor: "agrupada" },
              { rotulo: "Como veio da consulta", valor: "consulta" },
              { rotulo: "Alfab\xE9tica", valor: "alfabetica" }
            ])
          },
          triangulo: {
            type: "string",
            label: "Mostrar",
            section: "Correla\xE7\xE3o",
            display: "select",
            default: "completa",
            values: listaDeValores([
              { rotulo: "Matriz completa", valor: "completa" },
              { rotulo: "S\xF3 o tri\xE2ngulo inferior", valor: "inferior" }
            ])
          },
          escreverValor: {
            type: "boolean",
            label: "Escrever o n\xFAmero dentro da c\xE9lula",
            section: "Correla\xE7\xE3o",
            default: true
          },
          esconderFracos: {
            type: "number",
            label: "Apagar c\xE9lulas com |r| abaixo de",
            section: "Correla\xE7\xE3o",
            display: "range",
            min: 0,
            max: 0.9,
            step: 0.05,
            default: 0
          },
          corPositiva: {
            type: "string",
            label: "Cor da correla\xE7\xE3o positiva",
            section: "Correla\xE7\xE3o",
            display: "color",
            default: "#2563EB"
          },
          corNegativa: {
            type: "string",
            label: "Cor da correla\xE7\xE3o negativa",
            section: "Correla\xE7\xE3o",
            display: "color",
            default: "#DC2626"
          },
          mostrarLegendaDeCor: {
            type: "boolean",
            label: "Mostrar a r\xE9gua de cor (\u22121 a +1)",
            section: "Correla\xE7\xE3o",
            default: true
          }
        }
      ),
      { mostrarTooltip: true }
    ),
    exigencia: { medidasMin: 2, aceitaPivo: false, exigeLinhas: true },
    opcoesDinamicas({ modelo }) {
      const saida = {};
      for (const medida of modelo.medidas) {
        saida[`usar_${medida.nome}`] = {
          type: "boolean",
          label: `Incluir "${medida.rotuloCurto}"`,
          section: "Medidas",
          default: true
        };
      }
      const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
      if (dimensoes.length) {
        Object.assign(
          saida,
          opcaoDeEscolhaDeCampo("campoDoRotulo", "Dimens\xE3o que identifica a linha", dimensoes, {
            secao: "Dados",
            incluirNenhum: true,
            padrao: ""
          })
        );
      }
      return saida;
    },
    render(ctx) {
      const { modelo, config, tema, raiz, largura, altura } = ctx;
      let medidas = modelo.medidas.filter((m) => config[`usar_${m.nome}`] !== false);
      if (medidas.length < 2) medidas = modelo.medidas.slice();
      if (medidas.length < 2) {
        ctx.mostrarVazio(
          "Uma matriz de correla\xE7\xE3o precisa de pelo menos DUAS medidas. Traga mais medidas no Explore."
        );
        return;
      }
      if (medidas.length > MAXIMO_DE_MEDIDAS) {
        ctx.avisar(
          `A consulta tem ${medidas.length} medidas. Mostrando as ${MAXIMO_DE_MEDIDAS} primeiras: acima disso os nomes n\xE3o cabem em nenhum tamanho leg\xEDvel e a matriz vira textura.`
        );
        medidas = medidas.slice(0, MAXIMO_DE_MEDIDAS);
      }
      const { linhas, descartadas } = lerLinhasCompletas({ modelo, medidas });
      if (linhas.length < 3) {
        ctx.mostrarVazio(
          "Nenhuma (ou quase nenhuma) linha tem valor em todas as medidas escolhidas. Reduza as medidas da matriz ou verifique os nulos no Explore."
        );
        return;
      }
      if (descartadas > 0) {
        ctx.avisar(
          `${descartadas} linha(s) sem valor em alguma das medidas ficaram de fora de TODOS os pares, para que as correla\xE7\xF5es sejam compar\xE1veis entre si.`
        );
      }
      if (linhas.length < MINIMO_PARA_INFERENCIA) {
        ctx.avisar(
          `S\xE3o ${linhas.length} linhas. Com t\xE3o poucas observa\xE7\xF5es, um |r| alto aparece por acaso com frequ\xEAncia \u2014 nenhuma c\xE9lula desta matriz sustenta conclus\xE3o.`
        );
      }
      const metodo = config.metodo || "pearson";
      const pearson = calcularMatriz(linhas, medidas.length, correlacaoDePearson);
      const spearman = metodo === "pearson" ? null : calcularMatriz(linhas, medidas.length, correlacaoDeSpearman);
      const ordem = ordenarVariaveis({
        matriz: pearson,
        medidas,
        modo: config.ordem || "agrupada"
      });
      const k = medidas.length;
      const rotulos = ordem.map((indice) => medidas[indice].rotuloCurto);
      ctx.limparRaiz();
      injetarEstilo(raiz, CSS, "cm");
      const area = criarEl("div", { classe: "cm-area", pai: raiz });
      const fonte = Math.max(7, Math.min(tema.tamanhoBase, 420 / Math.max(1, k)));
      const maiorRotulo = rotulos.reduce((a, r) => Math.max(a, r.length), 0);
      const margemEsquerda = Math.min(largura * 0.32, 12 + maiorRotulo * fonte * 0.52);
      const margemDeCima = Math.min(altura * 0.32, 12 + maiorRotulo * fonte * 0.52);
      const comLegenda = config.mostrarLegendaDeCor !== false;
      const margemDireita = comLegenda ? 54 : 10;
      const margemDeBaixo = 18;
      const lado = Math.max(
        6,
        Math.min(
          (largura - margemEsquerda - margemDireita) / k,
          (altura - margemDeCima - margemDeBaixo) / k
        )
      );
      const svg = criarSvgEl("svg", {
        pai: area,
        classe: "cm-svg",
        atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }
      });
      const corPositiva = config.corPositiva || tema.destaque;
      const corNegativa = config.corNegativa || tema.negativo;
      const corDe = (r) => corDaCorrelacao(r, { corPositiva, corNegativa, fundo: tema.fundo });
      const soInferior = (config.triangulo || "completa") === "inferior";
      const limiar = Number(config.esconderFracos) || 0;
      const escrever = config.escreverValor !== false && lado >= 22;
      for (let i = 0; i < k; i++) {
        for (let j = 0; j < k; j++) {
          if (soInferior && j > i) continue;
          const x = margemEsquerda + j * lado;
          const y = margemDeCima + i * lado;
          const usarSpearman = metodo === "spearman" || metodo === "ambos" && j > i;
          const matriz = usarSpearman ? spearman : pearson;
          const r = matriz[ordem[i]][ordem[j]];
          const apagada = r === null || i !== j && Math.abs(r) < limiar;
          criarSvgEl("rect", {
            pai: svg,
            classe: "cm-celula",
            atributos: {
              x,
              y,
              width: lado,
              height: lado,
              fill: apagada ? comOpacidade(tema.borda, 0.25) : corDe(r),
              stroke: tema.fundo,
              "stroke-width": lado > 14 ? 1 : 0.5
            }
          });
          if (escrever && !apagada) {
            const texto = criarSvgEl("text", {
              pai: svg,
              classe: "cm-valor",
              atributos: {
                x: x + lado / 2,
                y: y + lado / 2,
                "text-anchor": "middle",
                "dominant-baseline": "central",
                "font-size": Math.min(fonte + 1, lado * 0.36),
                fill: textoLegivelSobre(corDe(r), tema)
              }
            });
            definirTexto(texto, formatarR(r));
          }
        }
      }
      rotulos.forEach((rotulo, i) => {
        const nomeY = criarSvgEl("text", {
          pai: svg,
          classe: "cm-nome",
          atributos: {
            x: margemEsquerda - 5,
            y: margemDeCima + i * lado + lado / 2,
            "text-anchor": "end",
            "dominant-baseline": "central",
            "font-size": fonte,
            fill: tema.texto
          }
        });
        definirTexto(nomeY, truncar(rotulo, 28));
        const x = margemEsquerda + i * lado + lado / 2;
        const y = margemDeCima - 5;
        const nomeX = criarSvgEl("text", {
          pai: svg,
          classe: "cm-nome",
          atributos: {
            x,
            y,
            "text-anchor": "start",
            "font-size": fonte,
            fill: tema.texto,
            transform: `rotate(-90 ${x} ${y})`
          }
        });
        definirTexto(nomeX, truncar(rotulo, 28));
      });
      if (comLegenda) {
        desenharRegua({
          svg,
          x: largura - margemDireita + 12,
          y: margemDeCima,
          altura: Math.max(40, k * lado),
          corDe,
          tema,
          fonte
        });
      }
      const pares = k * (k - 1) / 2;
      const nota = criarEl("div", { classe: "cm-nota", pai: area });
      nota.style.color = tema.textoSuave;
      definirTexto(
        nota,
        [
          `${k} medidas \xB7 ${pares} pares \xB7 ${linhas.length} linhas`,
          `ordem ${nomeDaOrdem(config.ordem)}`,
          nomeDoMetodo(metodo),
          "escala fixa de \u22121 a +1",
          `com ${pares} pares, ~${Math.max(1, Math.round(pares * 0.05))} "d\xE3o significativo" por acaso a 5%`,
          "e o r \xE9 um n\xFAmero sobre RETAS (quarteto de Anscombe)"
        ].join(" \xB7 ")
      );
      const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
      ctx.estado.tooltip = tooltip;
      ctx.eventos.on(area, "pointermove", (ev) => {
        if (!tooltip) return;
        const caixa = area.getBoundingClientRect();
        const j = Math.floor((ev.clientX - caixa.left - margemEsquerda) / lado);
        const i = Math.floor((ev.clientY - caixa.top - margemDeCima) / lado);
        if (i < 0 || j < 0 || i >= k || j >= k || soInferior && j > i) {
          tooltip.esconder();
          return;
        }
        const rP = pearson[ordem[i]][ordem[j]];
        const rS = spearman ? spearman[ordem[i]][ordem[j]] : null;
        const linhasDoTooltip = [
          { rotulo: "Pearson (linear)", valor: rP === null ? "\u2014" : rP.toFixed(4) },
          { rotulo: "R\xB2", valor: rP === null ? "\u2014" : (rP * rP).toFixed(4) }
        ];
        if (rS !== null) {
          linhasDoTooltip.push({ rotulo: "Spearman (mon\xF3tona)", valor: rS.toFixed(4) });
          if (rP !== null && Math.abs(rS) - Math.abs(rP) > 0.15) {
            linhasDoTooltip.push({
              rotulo: "Leitura",
              valor: "rela\xE7\xE3o mon\xF3tona mas n\xE3o linear (curvatura ou outlier)"
            });
          }
        }
        linhasDoTooltip.push({ rotulo: "Observa\xE7\xF5es", valor: String(linhas.length) });
        tooltip.mostrar(
          {
            titulo: i === j ? medidas[ordem[i]].rotuloCurto : `${medidas[ordem[j]].rotuloCurto} \xD7 ${medidas[ordem[i]].rotuloCurto}`,
            linhas: linhasDoTooltip
          },
          ev.clientX,
          ev.clientY
        );
      });
      ctx.eventos.on(area, "pointerleave", () => {
        if (tooltip) tooltip.esconder();
      });
    },
    aoDestruir({ estado }) {
      if (estado && estado.tooltip) estado.tooltip.destruir();
    }
  });
  function nomeDoMetodo(metodo) {
    if (metodo === "spearman") return "Spearman (postos)";
    if (metodo === "ambos") return "Pearson abaixo, Spearman acima";
    return "Pearson";
  }
  function nomeDaOrdem(modo) {
    if (modo === "consulta") return "da consulta";
    if (modo === "alfabetica") return "alfab\xE9tica";
    return "agrupada por similaridade";
  }
  function formatarR(r) {
    if (r === null || !Number.isFinite(r)) return "\u2014";
    if (Math.abs(r) >= 0.995) return r.toFixed(1).replace(".", ",");
    return r.toFixed(2).replace(".", ",");
  }
  function calcularMatriz(linhas, k, correlacao) {
    const matriz = Array.from({ length: k }, () => new Array(k).fill(null));
    for (let i = 0; i < k; i++) {
      matriz[i][i] = 1;
      for (let j = i + 1; j < k; j++) {
        const r = correlacao(linhas.map((l) => ({ x: l.valores[j], y: l.valores[i] })));
        matriz[i][j] = r;
        matriz[j][i] = r;
      }
    }
    return matriz;
  }
  function corDaCorrelacao(r, { corPositiva, corNegativa, fundo }) {
    if (r === null || !Number.isFinite(r)) return fundo;
    const intensidade = Math.min(1, Math.abs(r));
    return misturarCores(fundo, r >= 0 ? corPositiva : corNegativa, intensidade);
  }
  function ordenarVariaveis({ matriz, medidas, modo = "agrupada" }) {
    const k = medidas.length;
    const indices = Array.from({ length: k }, (_, i) => i);
    if (modo === "consulta") return indices;
    if (modo === "alfabetica") {
      return indices.sort(
        (a, b) => medidas[a].rotuloCurto.localeCompare(medidas[b].rotuloCurto, "pt-BR")
      );
    }
    let grupos = indices.map((i) => ({ membros: [i] }));
    const distancia = (a, b) => {
      let soma = 0;
      let conta = 0;
      for (const i of a.membros) {
        for (const j of b.membros) {
          const r = matriz[i][j];
          soma += r === null ? 1 : 1 - Math.abs(r);
          conta += 1;
        }
      }
      return conta ? soma / conta : 1;
    };
    while (grupos.length > 1) {
      let melhorA = 0;
      let melhorB = 1;
      let menor = Infinity;
      for (let a = 0; a < grupos.length; a++) {
        for (let b = a + 1; b < grupos.length; b++) {
          const d = distancia(grupos[a], grupos[b]);
          if (d < menor) {
            menor = d;
            melhorA = a;
            melhorB = b;
          }
        }
      }
      const juntos = { membros: [...grupos[melhorA].membros, ...grupos[melhorB].membros] };
      grupos = grupos.filter((_, i) => i !== melhorA && i !== melhorB);
      grupos.push(juntos);
    }
    return grupos[0].membros;
  }
  function desenharRegua({ svg, x, y, altura, corDe, tema, fonte }) {
    const passos = 24;
    const alturaDoPasso = altura / passos;
    for (let i = 0; i < passos; i++) {
      const r = 1 - 2 * i / (passos - 1);
      criarSvgEl("rect", {
        pai: svg,
        classe: "cm-legenda",
        atributos: {
          x,
          y: y + i * alturaDoPasso,
          width: 12,
          height: alturaDoPasso + 0.5,
          fill: corDe(r)
        }
      });
    }
    for (const marca of [
      { r: 1, p: 0 },
      { r: 0, p: 0.5 },
      { r: -1, p: 1 }
    ]) {
      const texto = criarSvgEl("text", {
        pai: svg,
        classe: "cm-legenda",
        atributos: {
          x: x + 15,
          y: y + altura * marca.p + (marca.p === 0 ? 4 : marca.p === 1 ? -2 : 0),
          "dominant-baseline": "central",
          "font-size": Math.max(8, fonte - 1),
          fill: tema.textoSuave
        }
      });
      definirTexto(texto, marca.r > 0 ? "+1" : String(marca.r));
    }
  }
})();
