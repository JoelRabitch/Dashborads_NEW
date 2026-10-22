/**
 * define-viz.js — fábrica que transforma a declaração de um gráfico numa
 * visualização do Looker, ligada ao `looker-adapter.js`.
 *
 * O gráfico declara:
 *   defineViz({
 *     id, label,
 *     opcoes,                // opções estáticas (options-kit + específicas)
 *     exigencia,             // validação de dados (data-model.validarModelo)
 *     opcoesDinamicas(ctx),  // opcional: opções por campo/série
 *     render(ctx),           // obrigatório: desenha
 *     aoDestruir(ctx),       // opcional: limpeza extra
 *   })
 *
 * E recebe em `ctx`:
 *   modelo, config, tema, raiz, largura, altura, ponte, eventos, estado,
 *   avisar(), primeiraRenderizacao, limparRaiz(), agendar(), cancelarTudo()
 *
 * Responsabilidades centralizadas aqui (para nenhum gráfico repetir):
 *   - chamar `done()` SEMPRE, inclusive quando dá erro;
 *   - montar o modelo de dados e validar o formato;
 *   - resolver o tema e aplicar o JSON de configuração do bloco Avançado;
 *   - criar a estrutura DOM base (contêiner, faixa de aviso, título);
 *   - limpar listeners e animações entre atualizações (sem vazamento);
 *   - redesenhar quando o contêiner muda de tamanho;
 *   - modo debug.
 */

import { registrarVisualizacao, criarPonte, recursosDoLooker } from './looker-adapter.js';
import { construirModelo, validarModelo } from './data-model.js';
import { resolverTema } from './theme.js';
import { aplicarConfiguracaoJson } from './options-kit.js';
import {
  criarEl,
  limpar,
  definirTexto,
  medir,
  observarRedimensionamento,
  criarGerenciadorDeEventos,
  injetarEstilo,
  cancelarQuadro,
} from './dom.js';

const CSS_BASE = `
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

/**
 * @param {object} declaracao
 * @returns {object} a definição registrada no Looker (útil para testes)
 */
export function defineViz(declaracao) {
  const {
    id,
    label,
    opcoes = {},
    exigencia = {},
    opcoesDinamicas = null,
    render,
    aoDestruir = null,
  } = declaracao;

  if (typeof render !== 'function') {
    throw new Error(`defineViz(${id}): a função render é obrigatória.`);
  }

  const definicao = {
    id,
    label,
    options: opcoes,

    create(element, _config) {
      // Estrutura base, criada UMA vez por instância.
      limpar(element);
      injetarEstilo(element, CSS_BASE, 'bl-base');

      const raiz = criarEl('div', { classe: 'bl-raiz', pai: element });
      const cabecalho = criarEl('div', { classe: 'bl-cabecalho', pai: raiz });
      const tituloEl = criarEl('div', { classe: 'bl-titulo', pai: cabecalho });
      const subtituloEl = criarEl('div', { classe: 'bl-subtitulo', pai: cabecalho });
      const area = criarEl('div', { classe: 'bl-area', pai: raiz });
      const avisoEl = criarEl('div', { classe: 'bl-aviso', pai: raiz });
      avisoEl.style.display = 'none';

      this._bl = {
        element,
        raiz,
        cabecalho,
        tituloEl,
        subtituloEl,
        area,
        avisoEl,
        eventos: criarGerenciadorDeEventos(),
        estado: {}, // persiste entre atualizações (rolagem, ordenação, etc.)
        quadrosAgendados: new Set(),
        timersAgendados: new Set(),
        primeiraRenderizacao: true,
        ultimoDesenho: null,
        cancelarObservador: null,
      };

      // Redesenha quando o tile muda de tamanho.
      this._bl.cancelarObservador = observarRedimensionamento(element, () => {
        if (this._bl && typeof this._bl.ultimoDesenho === 'function') {
          this._bl.ultimoDesenho();
        }
      });
    },

    updateAsync(data, element, config, queryResponse, details, done) {
      const concluir = typeof done === 'function' ? done : () => {};
      try {
        executarAtualizacao.call(this, {
          declaracao: { id, label, opcoes, exigencia, opcoesDinamicas, render, aoDestruir },
          data,
          element,
          config,
          queryResponse,
          details,
        });
      } catch (erro) {
        try {
          const ponte = criarPonte(this, opcoes);
          const titulo = (erro && erro.titulo) || 'Erro na visualização';
          const mensagem = (erro && (erro.mensagem || erro.message)) || String(erro);
          ponte.mostrarErro(titulo, mensagem);
          if (typeof console !== 'undefined' && console.error) {
            console.error(`[${id}]`, erro);
          }
        } catch (_) {
          /* nem o erro conseguiu ser mostrado; segue para o done() */
        }
      } finally {
        concluir();
      }
    },

    destroy() {
      if (!this._bl) return;
      try {
        if (typeof aoDestruir === 'function') aoDestruir({ estado: this._bl.estado });
      } catch (_) {
        /* ignora */
      }
      limparPendencias(this._bl);
      if (this._bl.cancelarObservador) this._bl.cancelarObservador();
      this._bl = null;
    },
  };

  registrarVisualizacao(definicao);
  return definicao;
}

/** Cancela listeners, quadros e timers pendentes. */
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

  // `create` pode não ter rodado em ambientes de teste; garante a estrutura.
  if (!this._bl) {
    definicaoCreateManual.call(this, element);
  }
  const bl = this._bl;

  // Limpa o que ficou da renderização anterior.
  limparPendencias(bl);
  bl.avisoEl.style.display = 'none';
  definirTexto(bl.avisoEl, '');

  // Config final: a do painel + o JSON colado no bloco Avançado.
  const configFinal = aplicarConfiguracaoJson(Object.assign({}, config || {}));
  const tema = resolverTema(configFinal);

  // Modelo de dados.
  const modelo = construirModelo(data, queryResponse, configFinal, ponte);

  if (configFinal.modoDebug) {
    escreverDebug(id, { modelo, configFinal, queryResponse, data });
  }

  // Opções dinâmicas (uma por campo/série), se o gráfico quiser.
  if (typeof opcoesDinamicas === 'function') {
    try {
      const dinamicas = opcoesDinamicas({ modelo, config: configFinal, tema });
      if (dinamicas && Object.keys(dinamicas).length) ponte.registrarOpcoes(dinamicas);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[${id}] falha ao montar opções dinâmicas:`, e && e.message);
      }
    }
  }

  // Cabeçalho (título/subtítulo).
  aplicarCabecalho(bl, configFinal, tema);

  // Validação do formato de dados.
  const problema = validarModelo(modelo, exigencia);
  if (problema) {
    mostrarEstadoVazio(bl, tema, problema.mensagem);
    ponte.mostrarErro(problema.titulo, problema.mensagem);
    return;
  }

  // Avisos do modelo (campos ocultos, etc.).
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
      mostrarEstadoVazio(bl, tema, mensagem || configFinal.textoSemDados || 'Sem dados para exibir');
    },
    agendarQuadro(fn) {
      const idQuadro = (typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb) => setTimeout(() => cb(Date.now()), 16))(fn);
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
      bl.avisoEl.style.display = 'none';
      definirTexto(bl.avisoEl, '');
      try {
        render(ctx);
      } catch (e) {
        if (typeof console !== 'undefined' && console.error) console.error(`[${id}]`, e);
      }
    },
  };

  // Fundo do tile conforme o tema.
  bl.raiz.style.background = tema.fundo;
  bl.raiz.style.color = tema.texto;
  bl.raiz.style.fontFamily = tema.fonte;
  bl.raiz.style.fontSize = `${tema.tamanhoBase}px`;

  // Guarda um redesenho leve para o ResizeObserver chamar.
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
      if (typeof console !== 'undefined' && console.error) console.error(`[${id}]`, e);
    }
  };

  render(ctx);
  bl.primeiraRenderizacao = false;
}

/** Cria a estrutura base quando `create` não rodou (ambiente de teste). */
function definicaoCreateManual(element) {
  limpar(element);
  injetarEstilo(element, CSS_BASE, 'bl-base');
  const raiz = criarEl('div', { classe: 'bl-raiz', pai: element });
  const cabecalho = criarEl('div', { classe: 'bl-cabecalho', pai: raiz });
  const tituloEl = criarEl('div', { classe: 'bl-titulo', pai: cabecalho });
  const subtituloEl = criarEl('div', { classe: 'bl-subtitulo', pai: cabecalho });
  const area = criarEl('div', { classe: 'bl-area', pai: raiz });
  const avisoEl = criarEl('div', { classe: 'bl-aviso', pai: raiz });
  avisoEl.style.display = 'none';
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
    quadrosAgendados: new Set(),
    timersAgendados: new Set(),
    primeiraRenderizacao: true,
    ultimoDesenho: null,
    cancelarObservador: null,
  };
}

function aplicarCabecalho(bl, config, tema) {
  const titulo = (config.titulo || '').trim();
  const subtitulo = (config.subtitulo || '').trim();
  definirTexto(bl.tituloEl, titulo);
  definirTexto(bl.subtituloEl, subtitulo);
  bl.tituloEl.style.display = titulo ? 'block' : 'none';
  bl.subtituloEl.style.display = subtitulo ? 'block' : 'none';
  bl.tituloEl.style.fontSize = `${Math.round(tema.tamanhoBase * 1.25)}px`;
  bl.subtituloEl.style.fontSize = `${Math.round(tema.tamanhoBase * 0.95)}px`;
  bl.cabecalho.style.display = titulo || subtitulo ? 'block' : 'none';
}

function mostrarAviso(bl, tema, mensagem) {
  if (!mensagem) return;
  const atual = bl.avisoEl.textContent;
  definirTexto(bl.avisoEl, atual ? `${atual} · ${mensagem}` : mensagem);
  bl.avisoEl.style.display = 'block';
  bl.avisoEl.style.background = tema.nome === 'escuro' ? 'rgba(251,191,36,.18)' : 'rgba(253,230,138,.85)';
  bl.avisoEl.style.color = tema.nome === 'escuro' ? '#FDE68A' : '#92400E';
}

function mostrarEstadoVazio(bl, tema, mensagem) {
  limpar(bl.area);
  const caixa = criarEl('div', { classe: 'bl-vazio', pai: bl.area, texto: mensagem });
  caixa.style.color = tema.textoSuave;
}

function escreverDebug(id, { modelo, configFinal, queryResponse, data }) {
  if (typeof console === 'undefined' || !console.log) return;
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
    config: configFinal,
  });
}
