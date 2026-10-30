/*!
 * Cartão Multi-Valores — visualização customizada para o Looker
 * id: cartao_multivalor
 * versão: 0.1.0
 *
 * Arquivo AUTOCONTIDO: no Looker, o campo "Dependencies" deve ficar VAZIO.
 * Gerado por biblioteca/build/build.mjs — não edite este arquivo à mão;
 * edite src/charts/cartao_multivalor/index.js e rode `npm run build`.
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
      registrarOpcoes(opcoesDinamicas, extra = "") {
        if (!instancia || typeof instancia.trigger !== "function") {
          avisarUmaVez(
            "sem-trigger",
            "this.trigger() n\xE3o existe; op\xE7\xF5es din\xE2micas por campo n\xE3o aparecer\xE3o no painel Edit."
          );
          return false;
        }
        const dinamicas = opcoesDinamicas || {};
        const assinatura = JSON.stringify(Object.keys(dinamicas).sort()) + "|" + JSON.stringify(dinamicas) + "|" + extra;
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
  function registrarPaletaCategorica(id, { rotulo, cores, pacote = null }) {
    PALETAS_CATEGORICAS[id] = { rotulo, cores: cores.slice(), pacote };
  }
  function registrarEscalaContinua(id, { rotulo, cores, tipo = "sequencial", pacote = null }) {
    const paradas = cores.slice();
    const interpolador = (t) => {
      const x = Math.max(0, Math.min(1, Number(t) || 0)) * (paradas.length - 1);
      const i = Math.min(paradas.length - 2, Math.floor(x));
      return rgb_default(paradas[i], paradas[i + 1])(x - i);
    };
    ESCALAS_CONTINUAS[id] = { rotulo, interpolador, tipo, pacote };
  }
  function coresDaPaleta(nomeDaPaleta) {
    const p = PALETAS_CATEGORICAS[nomeDaPaleta] || PALETAS_CATEGORICAS.looker;
    return p.cores;
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
  var FORMAS_DE_MARCADOR = ["circulo", "quadrado", "triangulo", "losango", "cruz", "estrela", "wye"];
  var ROTULOS_DAS_FORMAS = {
    circulo: "C\xEDrculo",
    quadrado: "Quadrado",
    triangulo: "Tri\xE2ngulo",
    losango: "Losango",
    cruz: "Cruz",
    estrela: "Estrela",
    wye: "Wye (Y)"
  };
  var FORMAS_EXTRAS = {};
  function registrarForma(id, { rotulo, caminho, pacote = null }) {
    FORMAS_EXTRAS[id] = { rotulo: rotulo || id, caminho, pacote };
    if (!FORMAS_DE_MARCADOR.includes(id)) FORMAS_DE_MARCADOR.push(id);
    ROTULOS_DAS_FORMAS[id] = rotulo || id;
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
    if (prefixo && /^(Coluna|Campo) /.test(prefixo)) {
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
    // cartao_multivalor (5.14, v3)
    Cart\u00E3o: "Visual",
    Apar\u00EAncia: "Visual",
    Faixas: "Visual",
    Cabe\u00E7alho: "Dados",
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
    Cart\u00E3o: "Cart\xE3o",
    Apar\u00EAncia: "Cart\xE3o",
    Faixas: "Faixas",
    Cabe\u00E7alho: "Topo",
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
      } else if (/^Campo: /.test(secaoAntiga)) {
        aba = "Visual";
        prefixo = secaoAntiga.replace(/^Campo: /, "Campo ");
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
  function proximoQuadro(callback) {
    if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
    return setTimeout(() => callback(Date.now()), 16);
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
  function criarControladorDeAnimacao() {
    const ativos = /* @__PURE__ */ new Set();
    let destruido = false;
    function animar({ de = 0, para = 1, duracao = 600, atraso = 0, suavizacao = SUAVIZACOES.saida, aoAtualizar, aoTerminar }) {
      if (destruido) return () => {
      };
      if (duracao <= 0) {
        if (aoAtualizar) aoAtualizar(para, 1);
        if (aoTerminar) aoTerminar();
        return () => {
        };
      }
      let quadro = null;
      let inicio = null;
      let cancelado = false;
      const passo = (agora) => {
        if (cancelado || destruido) return;
        if (inicio === null) inicio = agora;
        const decorrido = agora - inicio - atraso;
        if (decorrido < 0) {
          quadro = proximoQuadro(passo);
          ativos.add(quadro);
          return;
        }
        const t = Math.min(1, decorrido / duracao);
        const valor = de + (para - de) * suavizacao(t);
        if (aoAtualizar) aoAtualizar(valor, t);
        if (t < 1) {
          quadro = proximoQuadro(passo);
          ativos.add(quadro);
        } else {
          if (aoTerminar) aoTerminar();
        }
      };
      quadro = proximoQuadro(passo);
      ativos.add(quadro);
      return () => {
        cancelado = true;
        if (quadro !== null) {
          cancelarQuadro(quadro);
          ativos.delete(quadro);
        }
      };
    }
    function cancelarTudo() {
      for (const q of ativos) cancelarQuadro(q);
      ativos.clear();
    }
    function destruir() {
      destruido = true;
      cancelarTudo();
    }
    return { animar, cancelarTudo, destruir };
  }
  function animarContador({
    elemento,
    de = 0,
    para,
    formatar = (v) => String(Math.round(v)),
    animacao,
    controlador,
    atrasoExtra = 0
  }) {
    if (!elemento) return () => {
    };
    const escrever = (v) => {
      elemento.textContent = formatar(v);
    };
    if (!animacao || !animacao.ligada || !animacao.contador || animacao.duracao <= 0) {
      escrever(para);
      return () => {
      };
    }
    const ctrl = controlador || criarControladorDeAnimacao();
    return ctrl.animar({
      de,
      para,
      duracao: animacao.duracao,
      atraso: animacao.atraso + atrasoExtra,
      suavizacao: animacao.suavizacao,
      aoAtualizar: escrever
    });
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

  // src/core/icones.js
  var registro = /* @__PURE__ */ new Map();
  function registrarIcone(id, def) {
    registro.set(id, { rotulo: def.rotulo || id, pacote: def.pacote || null, contorno: def.contorno, preenchido: def.preenchido || null });
  }
  function listarIcones({ pacotes: pacotes2 = null } = {}) {
    const saida = [];
    for (const [id, def] of registro) {
      if (def.pacote && pacotes2 && !pacotes2.includes(def.pacote)) continue;
      saida.push({ id, rotulo: def.rotulo, pacote: def.pacote });
    }
    return saida;
  }
  function existeIcone(id) {
    return registro.has(id);
  }
  function desenharIcone({ pai, id, lado = 18, cor = "currentColor", estilo = "contorno", classe = "bl-icone" }) {
    const def = registro.get(id);
    if (!def) return null;
    const svg = criarSvgEl("svg", {
      pai,
      classe,
      atributos: { width: lado, height: lado, viewBox: "0 0 24 24", "aria-hidden": "true", "data-icone": id }
    });
    const cheio = estilo === "preenchido" && def.preenchido;
    criarSvgEl("path", {
      pai: svg,
      atributos: cheio ? { d: def.preenchido, fill: cor, stroke: "none" } : { d: def.contorno, fill: "none", stroke: cor, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }
    });
    return svg;
  }
  var BASE = {
    seta: ["Seta", "M5 12h14M13 6l6 6-6 6"],
    estrela: ["Estrela", "M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z", "M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"],
    carrinho: ["Carrinho", "M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01"],
    pessoa: ["Pessoa", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7"],
    moeda: ["Moeda", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11"],
    grafico: ["Gr\xE1fico", "M4 20V10M10 20V4M16 20v-7M22 20H2"],
    relogio: ["Rel\xF3gio", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2"],
    alerta: ["Alerta", "M12 3l10 18H2zM12 10v5M12 18v.01", "M12 2.5L22.5 21h-21zM11 10h2v5h-2zM11 17h2v2h-2z"],
    alvo: ["Alvo", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"],
    check: ["Confirmado", "M4 12l5 5L20 6"],
    xis: ["Recusado", "M6 6l12 12M18 6L6 18"],
    coracao: ["Cora\xE7\xE3o", "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z", "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"],
    casa: ["Casa", "M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"],
    sobe: ["Sobe", "M12 19V5M6 11l6-6 6 6"],
    desce: ["Desce", "M12 5v14M6 13l6 6 6-6"]
  };
  for (const [id, [rotulo, contorno, preenchido]] of Object.entries(BASE)) registrarIcone(id, { rotulo, contorno, preenchido });

  // src/core/pacotes.js
  var PACOTE_PADRAO = "cafe";
  var pacotes = /* @__PURE__ */ new Map();
  var progressos = /* @__PURE__ */ new Map();
  var presets = /* @__PURE__ */ new Map();
  function registrarPacote({ id, nome, icones = {}, formas = {}, paletas = {}, escalas = {}, progressos: prog = {}, presets: pre = {} }) {
    const prefixo = `${id}_`;
    const conferir = (chave) => {
      if (!chave.startsWith(prefixo)) throw new Error(`pacote ${id}: o id "${chave}" precisa come\xE7ar com "${prefixo}"`);
    };
    pacotes.set(id, { id, nome });
    for (const [k, def] of Object.entries(icones)) {
      conferir(k);
      registrarIcone(k, { ...def, pacote: id });
    }
    for (const [k, def] of Object.entries(formas)) {
      conferir(k);
      registrarForma(k, { ...def, pacote: id });
    }
    for (const [k, def] of Object.entries(paletas)) {
      conferir(k);
      registrarPaletaCategorica(k, { ...def, pacote: id });
    }
    for (const [k, def] of Object.entries(escalas)) {
      conferir(k);
      registrarEscalaContinua(k, { ...def, pacote: id });
    }
    for (const [k, def] of Object.entries(prog)) {
      conferir(k);
      progressos.set(k, { ...def, pacote: id });
    }
    for (const [k, def] of Object.entries(pre)) {
      conferir(k);
      presets.set(k, { ...def, pacote: id });
    }
  }
  function listarPacotes() {
    return Array.from(pacotes.values());
  }
  function pacotesLigados(config = {}) {
    const escolhido = config.pacoteTematico;
    if (escolhido === "nenhum") return [];
    if (escolhido && pacotes.has(escolhido)) return [escolhido];
    return pacotes.has(PACOTE_PADRAO) ? [PACOTE_PADRAO] : [];
  }
  function prefixosDesligados(config = {}) {
    const ligados = pacotesLigados(config);
    return listarPacotes().map((p) => p.id).filter((id) => !ligados.includes(id)).map((id) => `${id}_`);
  }
  function usaItensDePacote(opcoes) {
    const prefixos = listarPacotes().map((p) => `${p.id}_`);
    if (!prefixos.length) return false;
    return Object.values(opcoes || {}).some(
      (o) => o && Array.isArray(o.values) && o.values.some((v) => prefixos.some((p) => String(Object.values(v)[0]).startsWith(p)))
    );
  }
  function filtrarOpcoesPorPacote(opcoes, config) {
    const prefixos = prefixosDesligados(config);
    if (!prefixos.length) return opcoes;
    const saida = {};
    for (const [id, o] of Object.entries(opcoes || {})) {
      if (o && Array.isArray(o.values)) {
        const copia = { ...o, values: o.values.filter((v) => !prefixos.some((p) => String(Object.values(v)[0]).startsWith(p))) };
        if (o._organizada) Object.defineProperty(copia, "_organizada", { value: true, enumerable: false });
        saida[id] = copia;
      } else saida[id] = o;
    }
    return saida;
  }
  function opcaoDePacoteTematico() {
    const lista = [{ "Nenhum": "nenhum" }].concat(listarPacotes().map((p) => ({ [p.nome]: p.id })));
    return {
      pacoteTematico: {
        type: "string",
        label: "Pacote tem\xE1tico",
        section: "Tema",
        display: "select",
        default: pacotes.has(PACOTE_PADRAO) ? PACOTE_PADRAO : "nenhum",
        values: lista
      }
    };
  }
  function listarProgressos(config) {
    const ligados = config ? pacotesLigados(config) : null;
    return Array.from(progressos.entries()).filter(([, d]) => !ligados || ligados.includes(d.pacote)).map(([id, d]) => ({ id, rotulo: d.rotulo }));
  }
  function existeProgresso(id) {
    return progressos.has(id);
  }
  function desenharProgresso(id, pai, fracao, opcoes = {}) {
    const p = progressos.get(id);
    return p ? p.desenhar(pai, Math.max(0, Math.min(1, Number(fracao) || 0)), opcoes) : null;
  }

  // src/packs/cafe/index.js
  var ICONES = {
    cafe_xicara: ["X\xEDcara", "M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M7 3.5v3M10 3.5v3M13 3.5v3M3 21h15", "M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h1.5a3 3 0 0 1 0 6H16v-1.5h1.5a1.5 1.5 0 0 0 0-3H16zM3 20h15v1.5H3z"],
    cafe_copo: ["Copo de viagem", "M7 6h10l-1.3 14.5H8.3zM6 6h12M8.5 2.5h7L16 6H8zM7.6 11h8.8", "M6 5.2h12V7H6zM8.4 2.2h7.2L16.4 5H7.6zM7.1 7.6h9.8l-1.2 13H8.3z"],
    cafe_grao: ["Gr\xE3o", "M12 3c4.4 0 7 4 7 9s-2.6 9-7 9-7-4-7-9 2.6-9 7-9zM12.5 3.2c-2.2 3-2.2 6 0 8.8s2.2 5.8 0 8.8", "M12 3c4.4 0 7 4 7 9s-2.6 9-7 9-7-4-7-9 2.6-9 7-9z"],
    cafe_prensa: ["Prensa francesa", "M7 7h9v13H7zM5.5 20.5h12M11.5 2.5v9M9 2.5h5M7 11.5h9M16 9.5h2.5v8H16", "M7 7h9v13H7zM5.5 19.8h12v1.5h-12zM10.8 2h1.4v5h-1.4zM16 9h3v9h-3v-1.5h1.5v-6H16z"],
    cafe_moedor: ["Moedor", "M6 10h12l-1.2 11H7.2zM8 10V7h8v3M12 7V4.5M12 4.5h4.5M10 15h4", "M6 10h12l-1.2 11H7.2zM8 6.5h8V10H8zM11.3 4h1.4v2.5h-1.4zM11.3 3.8h5.4v1.4h-5.4z"],
    cafe_espresso: ["M\xE1quina de espresso", "M5 3h14v6H5zM7 9v4h10V9M9.5 13v2M14.5 13v2M8.5 17h7v4h-7zM4 21h16M8 6h3", "M5 3h14v6H5zM7 9h10v4H7zM8.5 16.5h7V21h-7zM4 20.2h16v1.5H4z"],
    cafe_croissant: ["Croissant", "M3 14c2-5.5 6.5-8.5 9-8.5s7 3 9 8.5c-1.8 1.8-3.8 2-5.6 1L12 11l-3.4 4c-1.8 1-3.8.8-5.6-1zM12 5.5V11M7.5 8l1.5 5M16.5 8L15 13", "M3 14c2-5.5 6.5-8.5 9-8.5s7 3 9 8.5c-1.8 1.8-3.8 2-5.6 1L12 11l-3.4 4c-1.8 1-3.8.8-5.6-1z"],
    cafe_bolo: ["Bolo", "M4 12h16v8H4zM4 15c2 1.2 4-1 6 0s4 1.2 6 0 3-1 4 0M12 4.5v4M10.5 6.5h3M8 12V9.5h8V12", "M4 12h16v8H4zM8 9h8v3H8zM11.3 4h1.4v5h-1.4z"],
    cafe_loja: ["Loja", "M3.5 9L5.5 4h13l2 5M3.5 9h17M5 9v11h14V9M10 20v-5.5h4V20M3.5 9a2.1 2.1 0 0 0 4.2 0 2.1 2.1 0 0 0 4.3 0 2.1 2.1 0 0 0 4.2 0 2.1 2.1 0 0 0 4.3 0", "M5.5 4h13l2 5h-17zM5 10.5h14V20h-5v-5.5h-4V20H5z"],
    cafe_quiosque: ["Quiosque", "M4 10h16M6 10v10M18 10v10M4 20h16M4 10l2-6h12l2 6M9 14h6v6H9z", "M6 4h12l2 6H4zM6 11h12v9H6z"],
    cafe_caminhao: ["Caminh\xE3o de entrega", "M2.5 6h11v10h-11zM13.5 9h4l3 3v4h-7M6 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M2.5 6h11v10h-11zM13.5 9h4l3 3v4h-7zM6 20a2.3 2.3 0 1 0 0-4.6A2.3 2.3 0 0 0 6 20zM17 20a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z"],
    cafe_cupom: ["Cupom", "M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM9 7v10M13 10.5h.01M17 13.5h.01M17.5 10l-5 4", "M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"],
    cafe_fidelidade: ["Estrela de fidelidade", "M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM12 6.5l1.7 3.5 3.8.6-2.7 2.6.6 3.8L12 15.2 8.6 17l.6-3.8-2.7-2.6 3.8-.6z", "M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19z"],
    cafe_coroa: ["Coroa", "M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 21h14", "M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 20.2h14v1.5H5z"],
    cafe_cartao: ["Cart\xE3o", "M3 6h18v12H3zM3 10h18M6 14.5h4", "M3 6h18v3.2H3zM3 10.8h18V18H3z"]
  };
  var FORMAS = {
    cafe_xicara: {
      rotulo: "X\xEDcara",
      caminho: (t) => {
        const r = Math.max(0.5, t / 2);
        const f = (v) => (v * r).toFixed(2);
        return `M${f(-0.85)},${f(-0.55)}h${f(1.35)}v${f(0.6)}a${f(0.675)},${f(0.6)} 0 0 1 ${f(-1.35)},0zM${f(0.5)},${f(-0.4)}h${f(0.25)}a${f(0.3)},${f(0.3)} 0 0 1 0,${f(0.6)}h${f(-0.25)}z`;
      }
    },
    cafe_grao: {
      rotulo: "Gr\xE3o",
      caminho: (t) => {
        const r = Math.max(0.5, t / 2);
        return `M${(-0.72 * r).toFixed(2)},0a${(0.72 * r).toFixed(2)},${r.toFixed(2)} 0 1,0 ${(1.44 * r).toFixed(2)},0a${(0.72 * r).toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-1.44 * r).toFixed(2)},0z`;
      }
    },
    cafe_copo: {
      rotulo: "Copo",
      caminho: (t) => {
        const r = Math.max(0.5, t / 2);
        const f = (v) => (v * r).toFixed(2);
        return `M${f(-0.65)},${f(-1)}h${f(1.3)}l${f(-0.22)},${f(2)}h${f(-0.86)}z`;
      }
    }
  };
  var PALETAS = {
    cafe_espresso: { rotulo: "Caf\xE9 \xB7 Espresso", cores: ["#3B2416", "#6F4E37", "#A0522D", "#C8A27A", "#E6CCB2", "#7F5539", "#B08968", "#DDB892", "#4A3728"] },
    cafe_latte: { rotulo: "Caf\xE9 \xB7 Latte", cores: ["#C8A27A", "#E3C9A8", "#8B5E3C", "#F2E6D8", "#A47551", "#D6B48C", "#6B4F3A", "#BFA58A"] },
    cafe_caramelo: { rotulo: "Caf\xE9 \xB7 Caramelo", cores: ["#AF6E4D", "#D4A373", "#E9C46A", "#F4A261", "#8D5524", "#C68B59", "#FFD8A9", "#7B3F00"] },
    cafe_crema: { rotulo: "Caf\xE9 \xB7 Crema", cores: ["#FFF1D6", "#F3D9B1", "#E8C39E", "#D9A86C", "#C08552", "#A0673D", "#7A4E2D", "#5C3A21"] },
    cafe_mocha: { rotulo: "Caf\xE9 \xB7 Mocha", cores: ["#4B3832", "#854442", "#BE9B7B", "#FFF4E6", "#3C2F2F", "#A47148", "#D4A574", "#6E4C3A"] }
  };
  var ESCALAS = {
    cafe_torra: { rotulo: "Caf\xE9 \xB7 Torra (clara \u2192 escura)", cores: ["#F5E6D3", "#D9B48F", "#A9744F", "#6F4E37", "#3B2416"], tipo: "sequencial" },
    cafe_torra_divergente: { rotulo: "Caf\xE9 \xB7 Torra divergente", cores: ["#3B2416", "#A9744F", "#F5F0E8", "#7FA7A0", "#2F5D57"], tipo: "divergente" }
  };
  var contador = 0;
  function desenharXicara(pai, fracao, { lado = 40, cor = "#6F4E37", contornoCor = "currentColor", animar = false, duracao = 600, curva = "ease-out", agendarQuadro = null } = {}) {
    const id = `cafe-xic-${contador += 1}`;
    const svg = criarSvgEl("svg", {
      pai,
      classe: "cafe-xicara",
      atributos: { width: lado, height: lado, viewBox: "0 0 24 24", "data-fracao": fracao.toFixed(3), role: "img", "aria-label": `${Math.round(fracao * 100)}%` }
    });
    const defs = criarSvgEl("defs", { pai: svg });
    const clip = criarSvgEl("clipPath", { pai: defs, atributos: { id } });
    criarSvgEl("path", { pai: clip, atributos: { d: "M4.6 9.6h10.8v4.4a4.4 4.4 0 0 1-4.4 4.4H9a4.4 4.4 0 0 1-4.4-4.4z" } });
    const g = criarSvgEl("g", { pai: svg, atributos: { "clip-path": `url(#${id})` } });
    const liquido = criarSvgEl("rect", { pai: g, classe: "cafe-liquido", atributos: { x: 4, y: 9.6, width: 12, height: 8.8, fill: cor } });
    liquido.style.transformBox = "fill-box";
    liquido.style.transformOrigin = "50% 100%";
    const final = `scaleY(${fracao})`;
    if (animar && agendarQuadro) {
      liquido.style.transform = "scaleY(0)";
      liquido.style.transition = `transform ${duracao}ms ${curva}`;
      agendarQuadro(() => {
        liquido.style.transform = final;
      });
    } else liquido.style.transform = final;
    criarSvgEl("path", {
      pai: svg,
      atributos: { d: ICONES.cafe_xicara[1], fill: "none", stroke: contornoCor, "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round" }
    });
    return svg;
  }
  registrarPacote({
    id: "cafe",
    nome: "Caf\xE9",
    icones: Object.fromEntries(Object.entries(ICONES).map(([k, [rotulo, contorno, preenchido]]) => [k, { rotulo: `Caf\xE9 \xB7 ${rotulo}`, contorno, preenchido }])),
    formas: FORMAS,
    paletas: PALETAS,
    escalas: ESCALAS,
    progressos: { cafe_xicara: { rotulo: "Progresso em x\xEDcara", desenhar: desenharXicara } }
  });

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
  var registro2 = /* @__PURE__ */ new WeakMap();
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
    const t = registro2.get(r);
    if (t) t.aplicarEstilo();
  }
  function esconderTooltipsDe(raiz) {
    const t = registro2.get(raizDe(raiz));
    if (t) t.soltarEEsconder();
  }
  function destruirTooltipsDe(raiz) {
    const r = raizDe(raiz);
    const t = registro2.get(r);
    if (t) t.destruir();
    contextos.delete(r);
  }
  function criarTooltip(hospedeiro, tema) {
    const raiz = raizDe(hospedeiro);
    const existente = registro2.get(raiz);
    if (existente && existente.elemento.isConnected) {
      existente.definirTema(tema);
      return existente;
    }
    const t = construirTooltip(raiz, tema);
    registro2.set(raiz, t);
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
        if (registro2.get(raiz) === api) registro2.delete(raiz);
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
    const juntas = Object.assign({}, opcoesDeAnimacaoPadrao(), opcoesDeclaradas, OPCOES_DE_AVISO, opcoesDoCabecalho());
    if (usaItensDePacote(juntas)) Object.assign(juntas, opcaoDePacoteTematico());
    if (!juntas.estiloDoIcone && temListaDeIcones(juntas)) Object.assign(juntas, OPCAO_ESTILO_DO_ICONE);
    const opcoes = organizarAbas(juntas);
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
    const ponte = criarPonte(this, filtrarOpcoesPorPacote(opcoes, config || {}));
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
    const pacoteAgora = pacotesLigados(configFinal).join(",") || "nenhum";
    const pacoteAntes = bl.pacoteRegistrado === void 0 ? PACOTE_PADRAO : bl.pacoteRegistrado;
    const trocouPacote = "pacoteTematico" in opcoes && pacoteAgora !== pacoteAntes;
    bl.pacoteRegistrado = pacoteAgora;
    if (trocouPacote && typeof opcoesDinamicas !== "function") {
      ponte.registrarOpcoes({}, pacoteAgora);
    }
    if (typeof opcoesDinamicas === "function") {
      try {
        const dinamicas = opcoesDinamicas({ modelo, config: configFinal, tema });
        const extra = trocouPacote || bl.pacoteRegistrado !== PACOTE_PADRAO ? pacoteAgora : "";
        if (dinamicas && (Object.keys(dinamicas).length || trocouPacote) && ponte.registrarOpcoes(filtrarOpcoesPorPacote(organizarAbas(dinamicas), configFinal), extra)) {
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
  var OPCAO_ESTILO_DO_ICONE = {
    estiloDoIcone: {
      type: "string",
      label: "Estilo do \xEDcone",
      section: "Tema",
      display: "select",
      default: "contorno",
      values: [{ Contorno: "contorno" }, { Preenchido: "preenchido" }]
    }
  };
  function temListaDeIcones(opcoes) {
    return Object.values(opcoes || {}).some(
      (o) => o && Array.isArray(o.values) && /[íi]cone/i.test(o.label || "") && o.values.some((v) => existeIcone(String(Object.values(v)[0])))
    );
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

  // src/core/icone-por-valor.js
  function opcoesDeIconePorValor({ secao = "\xCDcone por valor", comCampo = true } = {}) {
    const o = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
    const saida = {
      mapaDeIconesPorValor: o("string", "Mapa (valor=\xEDcone; \u2026)", "", { placeholder: "TipoA=cafe_loja; TipoB=casa" }),
      iconePadraoPorValor: o("string", "\xCDcone padr\xE3o", "nenhum", {
        display: "select",
        values: listaDeValores([{ rotulo: "Nenhum", valor: "nenhum" }].concat(listarIcones().map((i) => ({ rotulo: i.rotulo, valor: i.id }))))
      }),
      coresPorValor: o("string", "Cores (valor=#cor; \u2026)", "", { placeholder: "TipoA=#6F4E37" })
    };
    if (comCampo) saida.campoDoIconePorValor = o("string", "Campo (nome ou r\xF3tulo)", "");
    return saida;
  }
  function lerMapa(texto) {
    const mapa = /* @__PURE__ */ new Map();
    for (const parte of String(texto || "").split(";")) {
      const i = parte.indexOf("=");
      if (i <= 0) continue;
      mapa.set(parte.slice(0, i).trim().toLowerCase(), parte.slice(i + 1).trim());
    }
    return mapa;
  }
  function criarIconePorValor(config = {}) {
    const icones = lerMapa(config.mapaDeIconesPorValor);
    const cores = lerMapa(config.coresPorValor);
    const padrao = config.iconePadraoPorValor && config.iconePadraoPorValor !== "nenhum" ? config.iconePadraoPorValor : "";
    if (!icones.size && !padrao) return null;
    return (valor) => {
      const k = String(valor != null ? valor : "").trim().toLowerCase();
      const id = icones.get(k) || padrao;
      if (!id || !existeIcone(id)) return null;
      return { id, cor: cores.get(k) || "" };
    };
  }
  function desenharIconePorValor(resolver, { pai, valor, lado = 16, corPadrao = "currentColor", estilo = "contorno" }) {
    if (!resolver) return null;
    const r = resolver(valor);
    if (!r) return null;
    return desenharIcone({ pai, id: r.id, lado, cor: r.cor || corPadrao, estilo, classe: "bl-icone bl-icone-por-valor" });
  }

  // src/core/rotulos.js
  function lerBooleano(valor, padrao) {
    if (valor === void 0 || valor === null || valor === "") return padrao;
    if (valor === true || valor === false) return valor;
    if (valor === "true") return true;
    if (valor === "false") return false;
    return !!valor;
  }

  // src/core/cores.js
  function paletaDoConfig(config = {}) {
    const cores = coresDaPaleta(config.paleta).slice();
    if (lerBooleano(config.inverterPaleta, false)) cores.reverse();
    return cores;
  }

  // src/charts/cartao_multivalor/index.js
  var estiloDosIcones = "contorno";
  var desenharIcone2 = (p) => desenharIcone({ estilo: estiloDosIcones, ...p });
  var CSS2 = `
.mv-raiz{width:100%;height:100%;overflow:auto;box-sizing:border-box;}
.mv-grade{display:grid;align-content:start;}
.mv-cartao{box-sizing:border-box;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0;}
.mv-cabecalho{text-align:center;}
.mv-grande{font-weight:700;line-height:1.05;font-variant-numeric:tabular-nums;}
.mv-sub{opacity:.65;font-size:.85em;}
.mv-itens{display:grid;gap:10px 14px;}
.mv-item{min-width:0;display:flex;flex-direction:column;gap:2px;border-radius:6px;padding:2px 4px;transition:background .15s ease;}
.mv-item.mv-rotulo-valor{flex-direction:row;justify-content:space-between;align-items:baseline;gap:10px;}
.mv-item:hover.mv-com-destaque{background:rgba(127,127,127,.12);}
.mv-rotulo{font-size:.78em;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mv-valor{font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mv-link{text-decoration:underline;cursor:pointer;}
.mv-selo{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:700;font-size:.85em;}
.mv-barra{height:8px;border-radius:4px;overflow:hidden;}
.mv-barra>div{height:100%;border-radius:4px;width:0;}
.mv-divisoria{height:1px;opacity:.6;}
.mv-legenda{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;font-size:.78em;}
.mv-legenda span{display:inline-flex;align-items:center;gap:4px;}
.mv-quadrado{width:10px;height:10px;border-radius:2px;display:inline-block;}
.mv-secao{font-size:.72em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;opacity:.6;cursor:pointer;}
.mv-copiado{position:absolute;padding:2px 8px;border-radius:4px;font-size:11px;pointer-events:none;}
@keyframes mv-entrar{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mv-flash{0%{background:rgba(250,204,21,.45)}100%{background:transparent}}
@keyframes mv-pulso{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.45)}50%{box-shadow:0 0 0 6px rgba(220,38,38,0)}}
@keyframes mv-rolar{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}
.mv-digito{display:inline-block;}
@media (prefers-reduced-motion: reduce){.mv-item,.mv-barra>div{transition:none!important;animation:none!important;}}
`;
  var TIPOS = [
    { rotulo: "Autom\xE1tico", valor: "auto" },
    { rotulo: "N\xFAmero", valor: "numero" },
    { rotulo: "Texto", valor: "texto" },
    { rotulo: "Selo colorido", valor: "selo" },
    { rotulo: "Link", valor: "link" },
    { rotulo: "Barra de progresso", valor: "barra" },
    { rotulo: "Anel", valor: "anel" },
    { rotulo: "Mini gr\xE1fico", valor: "mini" },
    { rotulo: "Seta de varia\xE7\xE3o", valor: "seta" },
    { rotulo: "Estrelas", valor: "estrelas" },
    { rotulo: "Sem\xE1foro", valor: "semaforo" },
    { rotulo: "\xCDcone", valor: "icone" },
    // Exibições de pacotes temáticos (5.14g): ex.: "Progresso em xícara".
    ...listarProgressos().map((p) => ({ rotulo: p.rotulo, valor: p.id }))
  ];
  var FORMATOS = [
    { rotulo: "Autom\xE1tico (do Looker)", valor: "auto" },
    { rotulo: "N\xFAmero", valor: "numero" },
    { rotulo: "Compacto (K, M, B)", valor: "compacto" },
    { rotulo: "Moeda", valor: "moeda" },
    { rotulo: "Percentual", valor: "percentual" },
    { rotulo: "Texto", valor: "texto" }
  ];
  var ALINHAMENTOS2 = [
    { rotulo: "Centro", valor: "centro" },
    { rotulo: "Esquerda", valor: "esquerda" },
    { rotulo: "Direita", valor: "direita" }
  ];
  function opcoesGerais() {
    const s = (secao, tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
    return {
      modoDoCartao: s("Cart\xE3o", "string", "Modo", "unico", {
        display: "select",
        values: listaDeValores([
          { rotulo: "Um cart\xE3o (primeira linha)", valor: "unico" },
          { rotulo: "Um cart\xE3o por linha (grade)", valor: "grade" }
        ])
      }),
      colunasDaGradeMV: s("Cart\xE3o", "number", "Colunas da grade (0 = auto)", 0),
      espacoDaGradeMV: s("Cart\xE3o", "number", "Espa\xE7o entre cart\xF5es (px)", 12),
      layoutDosItens: s("Cart\xE3o", "string", "Layout dos itens", "pilha", {
        display: "select",
        values: listaDeValores([
          { rotulo: "Pilha vertical", valor: "pilha" },
          { rotulo: "Grade em colunas", valor: "grade" },
          { rotulo: "Linha horizontal", valor: "linha" },
          { rotulo: "R\xF3tulo \xE0 esquerda, valor \xE0 direita", valor: "rotuloValor" },
          { rotulo: "Destaque grande + lista", valor: "destaque" }
        ])
      }),
      colunasDosItens: s("Cart\xE3o", "number", "Colunas dos itens (grade)", 2),
      divisoriasMV: s("Cart\xE3o", "boolean", "Divis\xF3rias entre blocos", true),
      secoesRecolhiveisMV: s("Cart\xE3o", "boolean", "Se\xE7\xF5es recolh\xEDveis", false),
      // Cabeçalho calculado
      valorDoCabecalho: s("Cabe\xE7alho", "string", "Valor do topo", "soma", {
        display: "select",
        values: listaDeValores([
          { rotulo: "Soma", valor: "soma" },
          { rotulo: "M\xE9dia", valor: "media" },
          { rotulo: "M\xEDnimo", valor: "minimo" },
          { rotulo: "M\xE1ximo", valor: "maximo" },
          { rotulo: "F\xF3rmula", valor: "formula" },
          { rotulo: "Nenhum", valor: "nenhum" }
        ])
      }),
      camposDoCabecalho: s("Cabe\xE7alho", "string", "Campos (vazio = medidas)", "", { placeholder: "Visitas, Compras" }),
      formulaDoCabecalho: s("Cabe\xE7alho", "string", "F\xF3rmula", "", { placeholder: "${visitas} + ${compras}" }),
      formatoDoCabecalho: s("Cabe\xE7alho", "string", "Formato", "auto", { display: "select", values: listaDeValores(FORMATOS) }),
      casasDoCabecalho: s("Cabe\xE7alho", "number", "Casas decimais", 0),
      subtituloDoCabecalho: s("Cabe\xE7alho", "string", "Subt\xEDtulo", "auto", {
        display: "select",
        values: listaDeValores([
          { rotulo: 'Autom\xE1tico ("6 + 3 + 1")', valor: "auto" },
          { rotulo: "Texto livre", valor: "texto" },
          { rotulo: "Nenhum", valor: "nenhum" }
        ])
      }),
      textoDoSubtituloMV: s("Cabe\xE7alho", "string", "Texto do subt\xEDtulo", ""),
      tamanhoDoValorGrande: s("Cabe\xE7alho", "number", "Tamanho do valor (px, 0=auto)", 0),
      // Faixas
      faixasMV: s("Faixas", "string", "Faixas (Nome|m\xEDn|m\xE1x|cor|\xEDcone; \u2026)", "", {
        placeholder: "Ouro|8.4||#B8860B|estrela; Prata|7|8.4|#9CA3AF|"
      }),
      campoDasFaixas: s("Faixas", "string", "Campo das faixas (vazio = topo)", ""),
      mostrarSeloDaFaixa: s("Faixas", "boolean", "Selo da faixa", true),
      mostrarLegendaDasFaixas: s("Faixas", "boolean", "Legenda das faixas", true),
      // Aparência
      corDeFundoMV: s("Apar\xEAncia", "string", "Fundo do cart\xE3o (vazio = tema)", "", { display: "color" }),
      bordaMV: s("Apar\xEAncia", "boolean", "Borda do cart\xE3o", true),
      corDaBordaMV: s("Apar\xEAncia", "string", "Cor da borda (vazio = tema)", "", { display: "color" }),
      sombraMV: s("Apar\xEAncia", "boolean", "Sombra do cart\xE3o", true),
      raioMV: s("Apar\xEAncia", "number", "Arredondamento (px)", 10),
      fonteMV: s("Apar\xEAncia", "string", "Fonte", "tema", {
        display: "select",
        values: listaDeValores([
          { rotulo: "Do tema", valor: "tema" },
          { rotulo: "Sistema", valor: "sistema" },
          { rotulo: "Monoespa\xE7ada", valor: "mono" },
          { rotulo: "Serifada", valor: "serifada" }
        ])
      }),
      ajustarAoTileMV: s("Apar\xEAncia", "boolean", "Ajustar ao tamanho do tile", true),
      // Interação e animação (as gerais vêm de blocoDeAnimacao/blocoDeTooltip)
      copiarValorMV: s("Intera\xE7\xE3o", "boolean", "Duplo clique copia o valor", true),
      destacarItemMV: s("Intera\xE7\xE3o", "boolean", "Destacar item sob o mouse", true),
      animarBarrasMV: s("Anima\xE7\xE3o", "boolean", "Barras e an\xE9is crescem", true),
      destacarMudancaMV: s("Anima\xE7\xE3o", "boolean", "Destacar valor que mudou", true),
      pulsoEmAlertaMV: s("Anima\xE7\xE3o", "boolean", "Pulso em alerta", true),
      digitosRolandoMV: s("Anima\xE7\xE3o", "boolean", "D\xEDgitos rolando", false)
    };
  }
  function opcoesPorCampo(campo, ordem, ehMedida) {
    const k = `mv_${sanitizarChave(campo.nome)}_`;
    const secao = `Campo: ${campo.rotuloCurto}`;
    const o = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
    return {
      [`${k}visivel`]: o("boolean", "Mostrar", true),
      [`${k}ordem`]: o("number", "Ordem", ordem),
      [`${k}rotulo`]: o("string", "R\xF3tulo", ""),
      [`${k}tipo`]: o("string", "Tipo", "auto", { display: "select", values: listaDeValores(TIPOS) }),
      [`${k}formato`]: o("string", "Formato", ehMedida ? "auto" : "texto", { display: "select", values: listaDeValores(FORMATOS) }),
      [`${k}casas`]: o("number", "Casas decimais", 1),
      [`${k}prefixo`]: o("string", "Prefixo", ""),
      [`${k}sufixo`]: o("string", "Sufixo", ""),
      [`${k}zero`]: o("string", "Texto para zero (vazio = 0)", ""),
      [`${k}nulo`]: o("string", "Texto para nulo", "\u2014"),
      [`${k}alinhamento`]: o("string", "Alinhamento", "centro", { display: "select", values: listaDeValores(ALINHAMENTOS2) }),
      [`${k}tamanhoRotulo`]: o("number", "Tamanho do r\xF3tulo (0 = auto)", 0),
      [`${k}tamanhoValor`]: o("number", "Tamanho do valor (0 = auto)", 0),
      [`${k}corRotulo`]: o("string", "Cor do r\xF3tulo", "", { display: "color" }),
      [`${k}corValor`]: o("string", "Cor do valor", "", { display: "color" }),
      [`${k}icone`]: o("string", "\xCDcone", "nenhum", {
        display: "select",
        values: listaDeValores([{ rotulo: "Nenhum", valor: "nenhum" }].concat(listarIcones().map((i) => ({ rotulo: i.rotulo, valor: i.id }))))
      }),
      [`${k}meta`]: o("number", "Meta (barra/anel; 0 = 100%)", 0)
    };
  }
  function configDoCampo(config, campo, indice, ehMedida) {
    const k = `mv_${sanitizarChave(campo.nome)}_`;
    const v = (s, d) => config[k + s] === void 0 || config[k + s] === null ? d : config[k + s];
    return {
      campo,
      ehMedida,
      visivel: v("visivel", true) !== false,
      ordem: Number(v("ordem", indice)),
      rotulo: String(v("rotulo", "")).trim() || campo.rotuloCurto,
      tipo: v("tipo", "auto"),
      formato: v("formato", ehMedida ? "auto" : "texto"),
      casas: Number(v("casas", 1)),
      prefixo: String(v("prefixo", "")),
      sufixo: String(v("sufixo", "")),
      zero: String(v("zero", "")),
      nulo: String(v("nulo", "\u2014")),
      alinhamento: v("alinhamento", "centro"),
      tamanhoRotulo: Number(v("tamanhoRotulo", 0)) || 0,
      tamanhoValor: Number(v("tamanhoValor", 0)) || 0,
      corRotulo: String(v("corRotulo", "")),
      corValor: String(v("corValor", "")),
      icone: v("icone", "nenhum"),
      meta: Number(v("meta", 0)) || 0
    };
  }
  function lerFaixas(texto) {
    return String(texto || "").split(";").map((p) => p.trim()).filter(Boolean).map((p) => {
      const [nome, min, max, cor, icone] = p.split("|").map((x) => x === void 0 ? "" : x.trim());
      const num2 = (x) => x === "" || x === void 0 || !Number.isFinite(Number(x.replace(",", "."))) ? null : Number(x.replace(",", "."));
      return { nome, min: num2(min), max: num2(max), cor: cor || "#94A3B8", icone: icone || "" };
    });
  }
  function faixaDoValor(faixas, v) {
    if (v === null || v === void 0 || !Number.isFinite(v)) return null;
    return faixas.find((f) => (f.min === null || v >= f.min) && (f.max === null || v < f.max)) || null;
  }
  var FONTES2 = {
    sistema: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    mono: "ui-monospace, Menlo, Consolas, monospace",
    serifada: 'Georgia, "Times New Roman", serif'
  };
  var index_default = defineViz({
    id: "cartao_multivalor",
    label: "Cart\xE3o Multi-Valores",
    opcoes: montarOpcoes(
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesGerais(),
      OPCAO_ESTILO_DO_ICONE,
      // 5.14f (v3): ícone por valor de um campo, no topo do cartão.
      opcoesDeIconePorValor({ secao: "Cart\xE3o" })
    ),
    exigencia: { dimensoesMin: 0, medidasMin: 0, aceitaPivo: false, exigeLinhas: true },
    opcoesDinamicas({ modelo }) {
      const saida = {};
      let i = 0;
      for (const d of modelo.dimensoes) Object.assign(saida, opcoesPorCampo(d, i++, false));
      for (const m of modelo.medidas) Object.assign(saida, opcoesPorCampo(m, i++, true));
      return saida;
    },
    render(ctx) {
      const { modelo, config, tema, raiz, largura, altura, estado } = ctx;
      if (!modelo.dimensoes.length && !modelo.medidas.length) {
        ctx.mostrarVazio("O cart\xE3o precisa de pelo menos um campo (dimens\xE3o ou medida).");
        return;
      }
      ctx.limparRaiz();
      injetarEstilo(raiz, CSS2, "mv");
      const campos = [
        ...modelo.dimensoes.map((c, i) => configDoCampo(config, c, i, false)),
        ...modelo.medidas.map((c, i) => configDoCampo(config, c, modelo.dimensoes.length + i, true))
      ].filter((c) => c.visivel).sort((a, b) => a.ordem - b.ordem);
      const anim = opcoesDeAnimacao(config, { primeiraRenderizacao: ctx.primeiraRenderizacao });
      const faixas = lerFaixas(config.faixasMV);
      const paleta = paletaDoConfig(config);
      const anteriores = estado.valoresAnteriores || /* @__PURE__ */ new Map();
      const novos = /* @__PURE__ */ new Map();
      const tooltip = ctx.tooltip();
      const fonte = FONTES2[config.fonteMV] || tema.fonte;
      estiloDosIcones = config.estiloDoIcone === "preenchido" ? "preenchido" : "contorno";
      const iconePorValor = criarIconePorValor(config);
      const container = criarEl("div", { classe: "mv-raiz", pai: raiz });
      container.style.fontFamily = fonte;
      container.style.color = tema.texto;
      const grade = criarEl("div", { classe: "mv-grade", pai: container });
      const espaco = Math.max(0, Number(config.espacoDaGradeMV) || 12);
      grade.style.gap = `${espaco}px`;
      const linhas = config.modoDoCartao === "grade" ? modelo.linhas : modelo.linhas.slice(0, 1);
      const minimoDoCartao = 220;
      const colunas = config.modoDoCartao === "grade" ? Number(config.colunasDaGradeMV) > 0 ? Math.floor(Number(config.colunasDaGradeMV)) : Math.max(1, Math.floor((largura + espaco) / (minimoDoCartao + espaco))) : 1;
      grade.style.gridTemplateColumns = `repeat(${colunas}, minmax(0, 1fr))`;
      if (config.modoDoCartao !== "grade") grade.style.height = "100%";
      const itensVisiveis = campos.length + (config.valorDoCabecalho !== "nenhum" ? 3 : 0) + (faixas.length ? 1 : 0);
      const alturaPorCartao = config.modoDoCartao === "grade" ? 260 : altura;
      const escala = config.ajustarAoTileMV === false ? 1 : Math.max(0.8, Math.min(2.2, alturaPorCartao / Math.max(120, itensVisiveis * 34 + 40)));
      const base = Math.round(tema.tamanhoBase * escala);
      container.style.fontSize = `${base}px`;
      linhas.forEach((linha, indiceDaLinha) => {
        var _a, _b;
        const cartao = criarEl("div", { classe: "mv-cartao", pai: grade });
        cartao.style.background = config.corDeFundoMV || tema.fundoElevado || tema.fundo;
        if (config.bordaMV !== false) cartao.style.border = `1px solid ${config.corDaBordaMV || tema.borda}`;
        cartao.style.borderRadius = `${Math.max(0, Number(config.raioMV) || 0)}px`;
        if (config.sombraMV !== false) cartao.style.boxShadow = tema.sombra || "0 2px 8px rgba(15,23,42,.12)";
        if (config.modoDoCartao !== "grade") cartao.style.height = "100%";
        let ordemDeEntrada = 0;
        const entrar = (el) => {
          if (!anim.ligada) return;
          el.style.animation = `mv-entrar ${Math.max(150, anim.duracao)}ms ease-out both`;
          el.style.animationDelay = `${anim.atraso + anim.cascata * ordemDeEntrada++}ms`;
        };
        if (iconePorValor && config.campoDoIconePorValor) {
          const alvo = String(config.campoDoIconePorValor).trim().toLowerCase();
          const c = campos.find((x) => [x.campo.nome, x.campo.rotuloCurto, x.rotulo].some((n) => String(n).toLowerCase() === alvo));
          if (c) {
            const valor = c.ehMedida ? modelo.valorNumerico(linha, c.campo.nome) : (_a = modelo.celula(linha, c.campo.nome)) == null ? void 0 : _a.value;
            const caixaDoIcone = criarEl("div", { classe: "mv-icone-por-valor", pai: cartao });
            caixaDoIcone.style.textAlign = "center";
            desenharIconePorValor(iconePorValor, { pai: caixaDoIcone, valor, lado: Math.round(base * 2), corPadrao: tema.destaque, estilo: estiloDosIcones });
          }
        }
        const cab = valorDoCabecalho({ config, modelo, linha, campos });
        if (cab) {
          const bloco = criarEl("div", { classe: "mv-cabecalho", pai: cartao });
          const grande = criarEl("div", { classe: "mv-grande", pai: bloco });
          const tamanhoGrande = Number(config.tamanhoDoValorGrande) > 0 ? Number(config.tamanhoDoValorGrande) : base * 2.6;
          grande.style.fontSize = `${tamanhoGrande}px`;
          const formatarCab = formatadorDoCabecalho(config);
          const chave = `${indiceDaLinha}|__topo__`;
          novos.set(chave, cab.valor);
          if (cab.erro) definirTexto(grande, `#ERRO: ${cab.erro}`);
          else if (config.digitosRolandoMV === true && anim.ligada) digitosRolando(grande, formatarCab(cab.valor), anim);
          else if (anim.contador && Number.isFinite(cab.valor)) {
            animarContador({ elemento: grande, de: (_b = anteriores.get(chave)) != null ? _b : 0, para: cab.valor, formatar: formatarCab, animacao: anim });
            definirTexto(grande, formatarCab(cab.valor));
          } else definirTexto(grande, cab.valor === null ? "\u2014" : formatarCab(cab.valor));
          destacarMudanca(grande, anteriores.get(chave), cab.valor, config, anim);
          const textoSub = config.subtituloDoCabecalho === "nenhum" ? "" : config.subtituloDoCabecalho === "texto" ? String(config.textoDoSubtituloMV || "") : cab.subtitulo;
          if (textoSub) criarEl("div", { classe: "mv-sub", pai: bloco, texto: textoSub });
          const valorDaFaixa = config.campoDasFaixas ? valorDoCampoPorNome(modelo, linha, campos, config.campoDasFaixas) : cab.valor;
          const faixa = faixaDoValor(faixas, valorDaFaixa);
          if (faixa && config.mostrarSeloDaFaixa !== false) {
            const selo = criarEl("span", { classe: "mv-selo", pai: bloco, texto: faixa.nome });
            selo.style.background = faixa.cor;
            selo.style.color = textoLegivelSobre(faixa.cor, tema);
            selo.style.marginTop = "6px";
            if (faixa.icone) desenharIcone2({ pai: selo, id: faixa.icone, lado: 12, cor: selo.style.color });
            selo.setAttribute("data-faixa", faixa.nome);
          }
          entrar(bloco);
          divisoria(cartao, config, tema);
        }
        const layout = config.layoutDosItens || "pilha";
        const lista = criarEl("div", { classe: "mv-itens", pai: cartao });
        const nCol = layout === "grade" ? Math.max(1, Math.floor(Number(config.colunasDosItens) || 2)) : layout === "linha" ? Math.max(1, campos.length) : 1;
        lista.style.gridTemplateColumns = `repeat(${nCol}, minmax(0, 1fr))`;
        campos.forEach((c, i) => {
          if (layout === "destaque" && i === 1) divisoria(cartao, config, tema, lista);
          const item = criarEl("div", { classe: `mv-item${layout === "rotuloValor" ? " mv-rotulo-valor" : ""}`, pai: lista });
          if (config.destacarItemMV !== false) item.classList.add("mv-com-destaque");
          item.style.textAlign = c.alinhamento === "esquerda" ? "left" : c.alinhamento === "direita" ? "right" : "center";
          item.style.alignItems = layout === "rotuloValor" ? "" : c.alinhamento === "esquerda" ? "flex-start" : c.alinhamento === "direita" ? "flex-end" : "center";
          item.setAttribute("data-campo", c.campo.nome);
          item.setAttribute("data-item", `${indiceDaLinha}|${c.campo.nome}`);
          const rot = criarEl("div", { classe: "mv-rotulo", pai: item, texto: c.rotulo });
          if (c.tamanhoRotulo) rot.style.fontSize = `${c.tamanhoRotulo}px`;
          if (c.corRotulo) rot.style.color = c.corRotulo;
          const celula = modelo.celula(linha, c.campo.nome);
          const bruto = c.ehMedida ? modelo.valorNumerico(linha, c.campo.nome) : celula ? celula.value : null;
          const texto = textoDoCampo(c, modelo, linha, bruto);
          const chave = `${indiceDaLinha}|${c.campo.nome}`;
          if (c.ehMedida) novos.set(chave, bruto);
          const valorEl = criarEl("div", { classe: "mv-valor", pai: item });
          const tamanhoValor = c.tamanhoValor || (layout === "destaque" && i === 0 ? base * 2 : base * 1.25);
          valorEl.style.fontSize = `${tamanhoValor}px`;
          if (c.corValor) valorEl.style.color = c.corValor;
          desenharValor({ el: valorEl, c, texto, bruto, celula, tema, paleta, faixas, anim, config, modelo, linha, ctx, anteriores, chave });
          destacarMudanca(valorEl, anteriores.get(chave), bruto, config, anim);
          const temLink = celula && Array.isArray(celula.links) && celula.links.length > 0;
          if (temLink) valorEl.classList.add("mv-link");
          const conteudo = () => ({ titulo: c.rotulo, linhas: [{ rotulo: c.rotulo, valor: texto }] });
          ctx.eventos.on(item, "click", (ev) => ctx.cliqueNoItem(ev, celula, conteudo()));
          if (tooltip) {
            ctx.eventos.on(item, "pointerenter", (ev) => tooltip.mostrar(conteudo(), ev.clientX, ev.clientY));
            ctx.eventos.on(item, "pointermove", (ev) => tooltip.mover(ev.clientX, ev.clientY));
            ctx.eventos.on(item, "pointerleave", () => tooltip.esconder());
          }
          if (config.copiarValorMV !== false) {
            ctx.eventos.on(item, "dblclick", () => copiar(texto, item, ctx, tema));
          }
          entrar(item);
        });
        if (faixas.length && config.mostrarLegendaDasFaixas !== false) {
          divisoria(cartao, config, tema);
          const leg = criarEl("div", { classe: "mv-legenda", pai: cartao });
          for (const f of faixas) {
            const s = criarEl("span", { pai: leg });
            const q = criarEl("i", { classe: "mv-quadrado", pai: s });
            q.style.background = f.cor;
            criarEl("span", { pai: s, texto: f.nome });
          }
          entrar(leg);
        }
      });
      estado.valoresAnteriores = novos;
      definirTexto(
        ctx.nota,
        `${linhas.length === 1 ? "1 cart\xE3o" : `${linhas.length} cart\xF5es`} \xB7 ${campos.length} campo(s)` + (config.modoDoCartao !== "grade" && modelo.linhas.length > 1 ? " \xB7 mostrando a primeira linha da consulta" : "")
      );
    }
  });
  function valorDoCampoPorNome(modelo, linha, campos, nome) {
    var _a;
    const alvo = String(nome).trim().toLowerCase();
    const c = campos.find((x) => [x.campo.nome, x.campo.rotuloCurto, x.rotulo].some((n) => String(n).toLowerCase() === alvo));
    if (!c) return null;
    return c.ehMedida ? modelo.valorNumerico(linha, c.campo.nome) : Number((_a = modelo.celula(linha, c.campo.nome)) == null ? void 0 : _a.value);
  }
  function valorDoCabecalho({ config, modelo, linha, campos }) {
    const modo = config.valorDoCabecalho || "soma";
    if (modo === "nenhum") return null;
    if (modo === "formula") {
      const c = compilarFormula(config.formulaDoCabecalho);
      if (!c.ok) return { valor: null, erro: c.erro, subtitulo: "" };
      try {
        const resolver = criarResolvedor(
          [...modelo.dimensoes, ...modelo.medidas].map((m) => ({
            nomes: [m.nome, String(m.nome).split(".").pop(), m.rotuloCurto, m.rotulo],
            valor: () => {
              var _a, _b;
              return modelo.medidas.includes(m) ? modelo.valorNumerico(linha, m.nome) : (_b = (_a = modelo.celula(linha, m.nome)) == null ? void 0 : _a.value) != null ? _b : null;
            }
          }))
        );
        const v = avaliarArvore(c.arvore, resolver);
        return { valor: typeof v === "number" ? v : null, subtitulo: String(config.formulaDoCabecalho) };
      } catch (e) {
        return { valor: null, erro: e.message, subtitulo: "" };
      }
    }
    const nomes = String(config.camposDoCabecalho || "").split(",").map((n) => n.trim().toLowerCase()).filter(Boolean);
    const escolhidos = (nomes.length ? campos.filter((c) => [c.campo.nome, c.campo.rotuloCurto, c.rotulo].some((n) => nomes.includes(String(n).toLowerCase()))) : campos.filter((c) => c.ehMedida)).filter((c) => c.ehMedida);
    const valores2 = escolhidos.map((c) => modelo.valorNumerico(linha, c.campo.nome)).filter((v) => v !== null && Number.isFinite(v));
    if (!valores2.length) return { valor: null, subtitulo: "" };
    const soma = valores2.reduce((a, b) => a + b, 0);
    const valor = modo === "media" ? soma / valores2.length : modo === "minimo" ? Math.min(...valores2) : modo === "maximo" ? Math.max(...valores2) : soma;
    const sep = modo === "soma" ? " + " : modo === "media" ? " \xB7 " : ", ";
    const fmt = (v) => Number.isInteger(v) ? String(v) : v.toFixed(1);
    const prefixo = modo === "media" ? "m\xE9dia de " : modo === "minimo" ? "m\xEDnimo de " : modo === "maximo" ? "m\xE1ximo de " : "";
    return { valor, subtitulo: `${prefixo}${valores2.map(fmt).join(sep)}` };
  }
  function formatadorDoCabecalho(config) {
    const estilo = config.formatoDoCabecalho || "auto";
    const casas = Number.isFinite(Number(config.casasDoCabecalho)) ? Number(config.casasDoCabecalho) : 0;
    const f = criarFormatadorNumerico({ estilo: estilo === "texto" ? "auto" : estilo, casas, simboloDaMoeda: "$" });
    return (v) => v === null || !Number.isFinite(v) ? "\u2014" : f(v);
  }
  function textoDoCampo(c, modelo, linha, bruto) {
    if (bruto === null || bruto === void 0 || typeof bruto === "number" && !Number.isFinite(bruto)) return c.nulo;
    if (c.ehMedida && bruto === 0 && c.zero !== "") return c.zero;
    let t;
    if (!c.ehMedida || c.formato === "texto") t = modelo.texto(linha, c.campo.nome, void 0, c.nulo);
    else if (c.formato === "auto") t = modelo.texto(linha, c.campo.nome, void 0, c.nulo);
    else t = criarFormatadorNumerico({ estilo: c.formato, casas: c.casas, simboloDaMoeda: "$" })(bruto);
    return `${c.prefixo}${t}${c.sufixo}`;
  }
  function divisoria(cartao, config, tema, antesDe = null) {
    if (config.divisoriasMV === false) return;
    const d = document.createElement("div");
    d.className = "mv-divisoria";
    d.style.background = tema.borda;
    if (antesDe && antesDe.parentNode === cartao) cartao.insertBefore(d, antesDe);
    else cartao.appendChild(d);
  }
  function destacarMudanca(el, antes, agora, config, anim) {
    if (!anim.ligada || config.destacarMudancaMV === false) return;
    if (antes === void 0 || antes === null || agora === null || antes === agora) return;
    el.classList.add("mv-mudou");
    el.style.animation = `mv-flash ${Math.max(400, anim.duracao)}ms ease-out`;
  }
  function digitosRolando(el, texto, anim) {
    el.textContent = "";
    [...String(texto)].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "mv-digito";
      s.textContent = ch;
      if (/\d/.test(ch)) {
        s.style.animation = `mv-rolar ${Math.max(200, anim.duracao)}ms ease-out both`;
        s.style.animationDelay = `${anim.atraso + i * 40}ms`;
      }
      el.appendChild(s);
    });
  }
  function desenharValor({ el, c, texto, bruto, celula, tema, paleta, faixas, anim, config, modelo, linha, ctx }) {
    const tipo = c.tipo === "auto" ? c.ehMedida ? "numero" : "texto" : existeProgresso(c.tipo) ? "__progresso__" : c.tipo;
    const n = typeof bruto === "number" ? bruto : Number(bruto);
    const fracao = Number.isFinite(n) ? Math.max(0, Math.min(1, c.meta > 0 ? n / c.meta : Math.abs(n) <= 1 ? Math.abs(n) : Math.abs(n) / 100)) : 0;
    const cor = c.corValor || paleta[0] || tema.destaque;
    if (c.icone && c.icone !== "nenhum" && tipo !== "icone") desenharIcone2({ pai: el, id: c.icone, lado: 14, cor });
    switch (tipo) {
      case "selo": {
        const faixa = Number.isFinite(n) ? faixaDoValor(faixas, n) : null;
        const s = criarEl("span", { classe: "mv-selo", pai: el, texto });
        const fundo = faixa ? faixa.cor : cor;
        s.style.background = fundo;
        s.style.color = textoLegivelSobre(fundo, tema);
        return;
      }
      case "barra": {
        el.appendChild(document.createTextNode(texto));
        const b = criarEl("div", { classe: "mv-barra", pai: el.parentNode });
        b.style.background = comOpacidade(tema.texto, 0.12);
        b.style.width = "100%";
        const preenchimento = criarEl("div", { pai: b });
        preenchimento.style.background = cor;
        const alvo = `${(fracao * 100).toFixed(1)}%`;
        if (anim.ligada && config.animarBarrasMV !== false) {
          preenchimento.style.transition = `width ${anim.duracao}ms ease-out`;
          ctx.agendarQuadro(() => {
            preenchimento.style.width = alvo;
          });
        } else preenchimento.style.width = alvo;
        preenchimento.setAttribute("data-alvo", alvo);
        return;
      }
      case "anel": {
        const lado = 46;
        const svg = criarSvgEl("svg", { pai: el, atributos: { width: lado, height: lado, viewBox: "0 0 46 46" } });
        const r = 19;
        const comp = 2 * Math.PI * r;
        criarSvgEl("circle", { pai: svg, atributos: { cx: 23, cy: 23, r, fill: "none", stroke: comOpacidade(tema.texto, 0.12), "stroke-width": 5 } });
        const arco = criarSvgEl("circle", {
          pai: svg,
          classe: "mv-anel",
          atributos: { cx: 23, cy: 23, r, fill: "none", stroke: cor, "stroke-width": 5, "stroke-linecap": "round", transform: "rotate(-90 23 23)", "stroke-dasharray": comp }
        });
        const final = comp * (1 - fracao);
        if (anim.ligada && config.animarBarrasMV !== false) {
          arco.setAttribute("stroke-dashoffset", comp);
          arco.style.transition = `stroke-dashoffset ${anim.duracao}ms ease-out`;
          ctx.agendarQuadro(() => arco.setAttribute("stroke-dashoffset", final));
        } else arco.setAttribute("stroke-dashoffset", final);
        const t = criarSvgEl("text", { pai: svg, atributos: { x: 23, y: 23, "text-anchor": "middle", "dominant-baseline": "central", "font-size": 10, fill: tema.texto } });
        definirTexto(t, `${Math.round(fracao * 100)}%`);
        return;
      }
      case "mini": {
        const serie = modelo.linhas.map((l) => modelo.valorNumerico(l, c.campo.nome)).filter((v) => v !== null && Number.isFinite(v));
        el.appendChild(document.createTextNode(texto));
        if (serie.length < 2) return;
        const w = 90;
        const h = 22;
        const min = Math.min(...serie);
        const max = Math.max(...serie);
        const pts = serie.map((v, i) => `${(i / (serie.length - 1) * w).toFixed(1)},${(h - 2 - (v - min) / (max - min || 1) * (h - 4)).toFixed(1)}`);
        const svg = criarSvgEl("svg", { pai: el.parentNode, classe: "mv-mini", atributos: { width: w, height: h, viewBox: `0 0 ${w} ${h}` } });
        criarSvgEl("polyline", { pai: svg, atributos: { points: pts.join(" "), fill: "none", stroke: cor, "stroke-width": 1.6 } });
        return;
      }
      case "seta": {
        const s = criarEl("span", { pai: el, texto: n > 0 ? "\u25B2 " : n < 0 ? "\u25BC " : "\u25A0 " });
        s.style.color = n > 0 ? tema.positivo : n < 0 ? tema.negativo : tema.textoSuave;
        el.appendChild(document.createTextNode(texto));
        return;
      }
      case "estrelas": {
        const k = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
        const s = criarEl("span", { pai: el, texto: "\u2605".repeat(k) + "\u2606".repeat(5 - k) });
        s.style.color = "#F59E0B";
        s.setAttribute("aria-label", `${k} de 5`);
        return;
      }
      case "semaforo": {
        const ref = c.meta > 0 ? n / c.meta : null;
        const corS = !Number.isFinite(n) ? tema.textoSuave : ref === null ? n >= 0 ? tema.positivo : tema.negativo : ref >= 1 ? tema.positivo : ref >= 0.8 ? "#F59E0B" : tema.negativo;
        const bola = criarEl("span", { classe: "mv-quadrado", pai: el });
        bola.style.background = corS;
        bola.style.borderRadius = "50%";
        bola.style.marginRight = "6px";
        el.appendChild(document.createTextNode(texto));
        if (corS === tema.negativo && anim.ligada && config.pulsoEmAlertaMV !== false) {
          el.closest(".mv-item").style.animation = "mv-pulso 1.6s ease-in-out infinite";
          el.closest(".mv-item").classList.add("mv-alerta");
        }
        return;
      }
      case "icone": {
        desenharIcone2({ pai: el, id: c.icone !== "nenhum" ? c.icone : "check", lado: 22, cor });
        return;
      }
      case "__progresso__": {
        desenharProgresso(c.tipo, el, fracao, {
          lado: 40,
          cor,
          contornoCor: tema.texto,
          animar: anim.ligada && config.animarBarrasMV !== false,
          duracao: anim.duracao,
          agendarQuadro: (fn) => ctx.agendarQuadro(fn)
        });
        el.appendChild(document.createTextNode(` ${Math.round(fracao * 100)}%`));
        return;
      }
      case "link":
        el.classList.add("mv-link");
        el.appendChild(document.createTextNode(texto));
        return;
      default: {
        if (tipo === "numero" && Number.isFinite(n) && anim.contador && c.formato === "auto") {
          el.appendChild(document.createTextNode(texto));
          return;
        }
        el.appendChild(document.createTextNode(texto));
      }
    }
  }
  function copiar(texto, item, ctx, tema) {
    const avisar = () => {
      const a = criarEl("div", { classe: "mv-copiado", pai: item, texto: "copiado" });
      a.style.background = tema.tooltipFundo || "#0F172A";
      a.style.color = tema.tooltipTexto || "#F8FAFC";
      ctx.agendarTimer(() => a.parentNode && a.parentNode.removeChild(a), 900);
    };
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(avisar, () => {
        });
        return true;
      }
    } catch (_) {
    }
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    let ok = false;
    try {
      area.select();
      ok = typeof document.execCommand === "function" && document.execCommand("copy");
    } catch (_) {
      ok = false;
    }
    document.body.removeChild(area);
    if (ok) avisar();
    return ok;
  }
})();
