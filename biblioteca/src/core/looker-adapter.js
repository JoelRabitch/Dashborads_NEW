/**
 * looker-adapter.js — ÚNICO arquivo da biblioteca que toca `looker.*` e
 * `LookerCharts.*`.
 *
 * Por que isolar: quando a versão do Looker mudar, só este arquivo (e o
 * `data-model.js`) precisam ser ajustados. Os gráficos conversam com uma
 * interface nossa, estável, e nunca chamam a API do Looker diretamente.
 *
 * Toda chamada faz DETECÇÃO DE RECURSO (`typeof`) antes de usar, e tem
 * fallback com aviso no console quando o recurso não existe. Nada aqui
 * presume que um método existe — ver `docs/COMPAT.md` para a tabela
 * completa (o que é usado, como confirmar, o que acontece sem ele).
 */

const PREFIXO_LOG = '[biblioteca-looker]';

/** Avisa no console uma única vez por chave (evita poluir em loop de render). */
const avisosJaDados = new Set();
function avisarUmaVez(chave, mensagem) {
  if (avisosJaDados.has(chave)) return;
  avisosJaDados.add(chave);
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`${PREFIXO_LOG} ${mensagem}`);
  }
}

/** Acesso seguro ao objeto global, funcione em navegador ou teste. */
function global_() {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  return {};
}

function utilsDoLooker() {
  const g = global_();
  const lc = g.LookerCharts;
  return lc && lc.Utils ? lc.Utils : null;
}

/**
 * Relatório de detecção de recursos. Usado pelo modo debug e pelo
 * `docs/COMPAT.md` — permite ver num piscar o que esta versão do Looker
 * oferece.
 */
export function recursosDoLooker() {
  const g = global_();
  const utils = utilsDoLooker();
  const temPluginAPI = !!(
    g.looker &&
    g.looker.plugins &&
    g.looker.plugins.visualizations &&
    typeof g.looker.plugins.visualizations.add === 'function'
  );
  return {
    pluginAPI: temPluginAPI,
    textForCell: !!(utils && typeof utils.textForCell === 'function'),
    htmlForCell: !!(utils && typeof utils.htmlForCell === 'function'),
    openDrillMenu: !!(utils && typeof utils.openDrillMenu === 'function'),
    filterableValueForCell: !!(utils && typeof utils.filterableValueForCell === 'function'),
    toggleCrossfilter: !!(utils && typeof utils.toggleCrossfilter === 'function'),
    getCrossfilterSelection: !!(utils && typeof utils.getCrossfilterSelection === 'function'),
  };
}

/**
 * Registra a visualização no Looker.
 * @param {object} definicaoCrua objeto com { id, label, options, create, updateAsync }
 * @returns {boolean} true se conseguiu registrar
 */
export function registrarVisualizacao(definicaoCrua) {
  const g = global_();
  if (
    g.looker &&
    g.looker.plugins &&
    g.looker.plugins.visualizations &&
    typeof g.looker.plugins.visualizations.add === 'function'
  ) {
    g.looker.plugins.visualizations.add(definicaoCrua);
    return true;
  }
  avisarUmaVez(
    'sem-plugin-api',
    'looker.plugins.visualizations.add não existe neste ambiente. ' +
      'A visualização não foi registrada (isso é esperado fora do Looker).'
  );
  return false;
}

/**
 * Cria a "ponte" por instância: recebe o `this` que o Looker passa para
 * `create`/`updateAsync` e devolve a interface estável que os gráficos usam.
 *
 * @param {object} instancia o `this` da visualização (vem do Looker)
 * @param {object} opcoesEstaticas as `options` declaradas pelo gráfico
 */
export function criarPonte(instancia, opcoesEstaticas) {
  // Guarda a assinatura das últimas opções dinâmicas registradas, para não
  // ficar chamando registerOptions em todo update (risco de loop).
  let assinaturaDasOpcoes = null;

  const ponte = {
    /** Limpa erros exibidos pelo Looker (se o método existir). */
    limparErros() {
      if (instancia && typeof instancia.clearErrors === 'function') {
        instancia.clearErrors();
        return true;
      }
      avisarUmaVez('sem-clearErrors', 'this.clearErrors() não existe; erros antigos podem ficar na tela.');
      return false;
    },

    /** Mostra um erro na área da visualização. */
    mostrarErro(titulo, mensagem) {
      if (instancia && typeof instancia.addError === 'function') {
        instancia.addError({ title: String(titulo), message: String(mensagem) });
        return true;
      }
      avisarUmaVez(
        'sem-addError',
        'this.addError() não existe; mostrando o erro só no console.'
      );
      if (typeof console !== 'undefined' && console.error) {
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
      if (!instancia || typeof instancia.trigger !== 'function') {
        avisarUmaVez(
          'sem-trigger',
          'this.trigger() não existe; opções dinâmicas por campo não aparecerão no painel Edit.'
        );
        return false;
      }
      const dinamicas = opcoesDinamicas || {};
      const assinatura = JSON.stringify(Object.keys(dinamicas).sort()) + '|' + JSON.stringify(dinamicas);
      if (assinatura === assinaturaDasOpcoes) return false;
      assinaturaDasOpcoes = assinatura;
      const completas = Object.assign({}, opcoesEstaticas || {}, dinamicas);
      instancia.trigger('registerOptions', completas);
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
      if (!instancia || typeof instancia.trigger !== 'function') {
        avisarUmaVez('sem-trigger-config', 'this.trigger() não existe; config não será persistida.');
        return false;
      }
      if (!configParcial || typeof configParcial !== 'object') return false;
      try {
        // O formato esperado pelo Looker é um array com o objeto de config.
        instancia.trigger('updateConfig', [configParcial]);
        return true;
      } catch (e) {
        avisarUmaVez('falha-updateConfig', `Não consegui persistir a config: ${e && e.message}`);
        return false;
      }
    },

    /**
     * Texto de exibição de uma célula. Prefere SEMPRE o que o Looker já
     * renderizou (respeita `value_format` e a localidade da conta).
     */
    textoDaCelula(celula, textoQuandoNulo = '∅') {
      if (celula === null || celula === undefined) return textoQuandoNulo;
      if (celula.value === null || celula.value === undefined) return textoQuandoNulo;
      const utils = utilsDoLooker();
      if (utils && typeof utils.textForCell === 'function') {
        try {
          return utils.textForCell(celula);
        } catch (e) {
          avisarUmaVez('falha-textForCell', `textForCell falhou (${e && e.message}); usando rendered/value.`);
        }
      } else {
        avisarUmaVez(
          'sem-textForCell',
          'LookerCharts.Utils.textForCell não existe; usando cell.rendered ou cell.value.'
        );
      }
      if (celula.rendered !== undefined && celula.rendered !== null) return String(celula.rendered);
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
      if (utils && typeof utils.htmlForCell === 'function') {
        try {
          return utils.htmlForCell(celula);
        } catch (e) {
          avisarUmaVez('falha-htmlForCell', `htmlForCell falhou (${e && e.message}).`);
          return null;
        }
      }
      avisarUmaVez('sem-htmlForCell', 'LookerCharts.Utils.htmlForCell não existe; usando texto puro.');
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
      if (utils && typeof utils.openDrillMenu === 'function') {
        try {
          utils.openDrillMenu({ links: celula.links, event: evento });
          return true;
        } catch (e) {
          avisarUmaVez('falha-openDrillMenu', `openDrillMenu falhou (${e && e.message}).`);
          return false;
        }
      }
      avisarUmaVez('sem-openDrillMenu', 'LookerCharts.Utils.openDrillMenu não existe; drill desativado.');
      return false;
    },

    /** Valor em sintaxe de filtro do Looker (usado por cross-filter manual). */
    valorFiltravel(celula) {
      const utils = utilsDoLooker();
      if (utils && typeof utils.filterableValueForCell === 'function') {
        try {
          return utils.filterableValueForCell(celula);
        } catch (_) {
          /* cai no fallback */
        }
      }
      return celula && celula.value !== undefined && celula.value !== null ? String(celula.value) : '';
    },

    /**
     * Abre uma URL. NÃO usa `window.open` (proibido pela seção 7 do
     * PROMPT_AGENTE.md): cria um link temporário com `rel="noopener"` e
     * dispara o clique. Só aceita http(s).
     */
    abrirUrl(url) {
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
        avisarUmaVez('url-invalida', 'abrirUrl recebeu uma URL que não é http(s); ignorada.');
        return false;
      }
      if (typeof document === 'undefined') return false;
      const a = document.createElement('a');
      a.href = url.trim();
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    },

    /** Cross-filter: só funciona se a API existir nesta versão do Looker. */
    crossfilter: {
      disponivel() {
        const utils = utilsDoLooker();
        return !!(utils && typeof utils.toggleCrossfilter === 'function');
      },
      alternar(linha, pivo, evento) {
        const utils = utilsDoLooker();
        if (!(utils && typeof utils.toggleCrossfilter === 'function')) {
          avisarUmaVez(
            'sem-crossfilter',
            'LookerCharts.Utils.toggleCrossfilter não existe nesta versão; cross-filter desativado.'
          );
          return false;
        }
        try {
          utils.toggleCrossfilter({ row: linha, pivot: pivo, event: evento });
          return true;
        } catch (e) {
          avisarUmaVez('falha-crossfilter', `toggleCrossfilter falhou (${e && e.message}).`);
          return false;
        }
      },
      /** 0 = nenhuma seleção, 1 = selecionado, 2 = não selecionado. */
      selecao(linha, pivo) {
        const utils = utilsDoLooker();
        if (!(utils && typeof utils.getCrossfilterSelection === 'function')) return 0;
        try {
          return utils.getCrossfilterSelection(linha, pivo) || 0;
        } catch (_) {
          return 0;
        }
      },
    },

    /** Relatório de detecção, para o modo debug dos gráficos. */
    recursos: recursosDoLooker,
  };

  return ponte;
}
