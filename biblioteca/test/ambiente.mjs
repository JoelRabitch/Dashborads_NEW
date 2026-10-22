/**
 * ambiente.mjs — o "Looker de mentira" usado pelos testes.
 *
 * Monta um DOM com jsdom, publica `looker` e `LookerCharts` como o Looker
 * real publica, e devolve utilitários para instanciar e configurar uma
 * visualização. Fica separado dos testes porque tanto o teste de fumaça
 * quanto os testes específicos de cada gráfico precisam dele.
 */

import { JSDOM } from 'jsdom';

/** Verifica se o `canvas` nativo (opcional) está instalado. */
export function temCanvasNativo() {
  try {
    const dom = new JSDOM('<canvas id="c"></canvas>', { pretendToBeVisual: true });
    return !!dom.window.document.getElementById('c').getContext('2d');
  } catch (_) {
    return false;
  }
}

/** Monta um ambiente parecido com o do Looker dentro do jsdom. */
export function montarAmbiente() {
  const dom = new JSDOM('<!doctype html><html><body><div id="palco" style="width:900px;height:600px"></div></body></html>', {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // Alguns navegadores/ambientes não têm ResizeObserver; o núcleo tem
  // fallback, mas aqui simulamos a existência para exercitar o caminho real.
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  const chamadasDeApi = { erros: [], opcoesRegistradas: null, drills: 0, configsPersistidas: [] };

  const registro = {};
  window.looker = {
    plugins: { visualizations: { add: (def) => { registro[def.id] = def; } } },
  };
  window.LookerCharts = {
    Utils: {
      textForCell: (c) => {
        if (!c) return '';
        if (c.value === null || c.value === undefined) return '∅';
        return c.rendered !== undefined && c.rendered !== null ? String(c.rendered) : String(c.value);
      },
      htmlForCell: (c) => (c && c.value !== null && c.value !== undefined ? String(c.value) : ''),
      filterableValueForCell: (c) => (c && c.value != null ? String(c.value) : ''),
      openDrillMenu: () => { chamadasDeApi.drills += 1; },
      // toggleCrossfilter/getCrossfilterSelection propositalmente AUSENTES:
      // assim testamos o caminho "recurso não existe" do adapter.
    },
  };

  // O bundle é um IIFE que espera `window`/`document` globais.
  // Só guardamos o que de fato sobrescrevemos abaixo. `navigator`, por
  // exemplo, é somente-leitura no Node atual e nunca é tocado aqui.
  const globaisAntes = {
    window: globalThis.window,
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    ResizeObserver: globalThis.ResizeObserver,
  };
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.ResizeObserver = window.ResizeObserver;
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

  return {
    dom,
    window,
    registro,
    chamadasDeApi,
    restaurar() {
      for (const [k, v] of Object.entries(globaisAntes)) {
        if (v === undefined) delete globalThis[k];
        else globalThis[k] = v;
      }
      try {
        window.close();
      } catch (_) {
        /* ignora */
      }
    },
  };
}

/** Cria a instância da viz do jeito que o Looker cria (herdando a definição). */
export function criarInstancia(definicao, chamadasDeApi) {
  const inst = Object.create(definicao);
  inst.addError = (erro) => chamadasDeApi.erros.push(erro);
  inst.clearErrors = () => { chamadasDeApi.erros.length = 0; };
  inst.trigger = (evento, args) => {
    if (evento === 'registerOptions') {
      // Igual ao Looker real: SUBSTITUI o painel inteiro.
      definicao.options = args;
      chamadasDeApi.opcoesRegistradas = args;
    } else if (evento === 'updateConfig') {
      chamadasDeApi.configsPersistidas.push(args);
    }
  };
  return inst;
}

/** Config com todos os defaults declarados no painel. */
export function configPadrao(definicao) {
  const cfg = {};
  for (const [chave, opcao] of Object.entries(definicao.options || {})) {
    if (opcao && opcao.default !== undefined) cfg[chave] = opcao.default;
  }
  return cfg;
}
