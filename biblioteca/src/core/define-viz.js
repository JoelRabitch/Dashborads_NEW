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
import {
  aplicarConfiguracaoJson,
  normalizarConfig,
  compararChaves,
  organizarAbas,
  blocoDeAnimacao,
} from './options-kit.js';
import { animarEntradaGenerica } from './animate.js';
import {
  esconderTooltipsDe,
  destruirTooltipsDe,
  configurarTooltipsDe,
  criarTooltip,
  executarAcaoDoClique,
} from './tooltip.js';
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
.bl-raiz{position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;
  display:flex;flex-direction:column;}
.bl-raiz *{box-sizing:border-box;}
.bl-cabecalho{padding:6px 10px 0;flex:0 0 auto;}
.bl-titulo{font-weight:600;line-height:1.2;}
.bl-subtitulo{opacity:.7;line-height:1.2;}
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

/**
 * @param {object} declaracao
 * @returns {object} a definição registrada no Looker (útil para testes)
 */
export function defineViz(declaracao) {
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
  } = declaracao;

  if (typeof render !== 'function') {
    throw new Error(`defineViz(${id}): a função render é obrigatória.`);
  }

  // Abas padronizadas (módulo 2.8): só section/order/label mudam aqui.
  // Entram em TODO gráfico: as opções de aviso (2.5) e as de animação (2.7)
  // que ele ainda não declara (as declaradas mantêm os próprios defaults).
  const opcoes = organizarAbas(
    Object.assign({}, opcoesDeAnimacaoPadrao(), opcoesDeclaradas, OPCOES_DE_AVISO)
  );

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
      const avisoEl = criarAviso(raiz);
      const area = criarEl('div', { classe: 'bl-area', pai: raiz });

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
          declaracao: { id, label, opcoes, exigencia, opcoesDinamicas, render, aoDestruir, animacaoPropria },
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
      destruirTooltipsDe(this._bl.raiz);
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
  const { id, opcoes, exigencia, opcoesDinamicas, render, animacaoPropria } = declaracao;
  const ponte = criarPonte(this, opcoes);
  ponte.limparErros();

  // `create` pode não ter rodado em ambientes de teste; garante a estrutura.
  if (!this._bl) {
    definicaoCreateManual.call(this, element);
  }
  const bl = this._bl;

  // Limpa o que ficou da renderização anterior (inclusive tooltip aberto).
  limparPendencias(bl);
  esconderTooltipsDe(bl.raiz);
  limparAviso(bl);

  // Config final: a do painel, com os defaults das chaves que o Looker não
  // mandou e os tipos corrigidos (normalizarConfig), + o JSON do Avançado.
  let configFinal = aplicarConfiguracaoJson(normalizarConfig(config, ponte.opcoesAtuais()));
  const tema = resolverTema(configFinal);

  // Modelo de dados.
  const modelo = construirModelo(data, queryResponse, configFinal, ponte);

  // Opções dinâmicas (uma por campo/série), se o gráfico quiser.
  if (typeof opcoesDinamicas === 'function') {
    try {
      const dinamicas = opcoesDinamicas({ modelo, config: configFinal, tema });
      if (dinamicas && Object.keys(dinamicas).length && ponte.registrarOpcoes(organizarAbas(dinamicas))) {
        // Opções novas no painel: os defaults delas valem já neste desenho.
        configFinal = aplicarConfiguracaoJson(normalizarConfig(config, ponte.opcoesAtuais()));
      }
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[${id}] falha ao montar opções dinâmicas:`, e && e.message);
      }
    }
  }

  if (configFinal.modoDebug) {
    escreverDebug(id, {
      modelo,
      configFinal,
      queryResponse,
      data,
      chaves: compararChaves(config, ponte.opcoesAtuais()),
    });
  }

  // O tooltip único do gráfico passa a usar o config desta atualização.
  configurarTooltipsDe(bl.raiz, { config: configFinal, ponte });

  // Cabeçalho (título/subtítulo).
  aplicarCabecalho(bl, configFinal, tema);

  // Validação do formato de dados.
  const problema = validarModelo(modelo, exigencia);
  if (problema) {
    mostrarEstadoVazio(bl, tema, problema.mensagem);
    ponte.mostrarErro(problema.titulo, problema.mensagem);
    return;
  }

  // Onde o aviso fica (topo, rodapé ou oculto) — módulo 2.5.
  posicionarAviso(bl, configFinal, id);

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
        conteudo,
      });
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
      esconderTooltipsDe(bl.raiz);
      limparAviso(bl);
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
    esconderTooltipsDe(bl.raiz);
    limparAviso(bl); // senão o mesmo aviso se repete a cada redimensionamento
    try {
      render(ctx);
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) console.error(`[${id}]`, e);
    }
  };

  render(ctx);
  // Entrada/atualização animada (módulo 2.7): depois do desenho, em todos
  // os gráficos que não animam por conta própria.
  if (!animacaoPropria) {
    animarEntradaGenerica(bl.area, configFinal, { primeiraRenderizacao: bl.primeiraRenderizacao });
  }
  bl.primeiraRenderizacao = false;
}

/** As opções de animação que todo gráfico ganha (sem o contador). */
function opcoesDeAnimacaoPadrao() {
  const bloco = blocoDeAnimacao({ secao: 'Animação' });
  delete bloco.contadorAnimado;
  return bloco;
}

/** Cria a estrutura base quando `create` não rodou (ambiente de teste). */
function definicaoCreateManual(element) {
  limpar(element);
  injetarEstilo(element, CSS_BASE, 'bl-base');
  const raiz = criarEl('div', { classe: 'bl-raiz', pai: element });
  const cabecalho = criarEl('div', { classe: 'bl-cabecalho', pai: raiz });
  const tituloEl = criarEl('div', { classe: 'bl-titulo', pai: cabecalho });
  const subtituloEl = criarEl('div', { classe: 'bl-subtitulo', pai: cabecalho });
  const avisoEl = criarAviso(raiz);
  const area = criarEl('div', { classe: 'bl-area', pai: raiz });
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

/**
 * Componente ÚNICO de avisos (módulo 2.5 das correções).
 *
 * Antes o aviso era um <div> absoluto por cima do gráfico, sem como fechar:
 * cobria o botão de avançar do bar_race e a área de rolagem das listas, e
 * "não saía". Agora:
 *   - fica NO FLUXO (topo: entre o título e o gráfico; rodapé: depois do
 *     gráfico), ocupando espaço próprio em vez de cobrir o desenho — o
 *     ResizeObserver redesenha o gráfico no espaço que sobrou;
 *   - tem botão × para fechar (o mesmo texto não volta até mudar);
 *   - opções "Mostrar avisos" (padrão ligado) e "Posição dos avisos"
 *     (topo, rodapé, oculto);
 *   - TODO aviso vai também para o console, mesmo oculto: aviso de dado
 *     incompleto ou ilustrativo não pode sumir de vez.
 */
function criarAviso(raiz) {
  const avisoEl = criarEl('div', { classe: 'bl-aviso', pai: raiz });
  avisoEl.setAttribute('role', 'status');
  criarEl('span', { classe: 'bl-aviso-texto', pai: avisoEl });
  const fechar = criarEl('button', { classe: 'bl-aviso-fechar', pai: avisoEl, texto: '×' });
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Fechar aviso');
  fechar.title = 'Fechar aviso';
  fechar.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const bl = avisoEl._bl;
    if (bl) bl.estado.avisoFechado = textoDoAviso(bl);
    avisoEl.style.display = 'none';
  });
  avisoEl.style.display = 'none';
  return avisoEl;
}

function textoDoAviso(bl) {
  const t = bl.avisoEl.querySelector('.bl-aviso-texto');
  return t ? t.textContent : '';
}

function limparAviso(bl) {
  bl.avisoEl._bl = bl;
  bl.avisoEl.style.display = 'none';
  const t = bl.avisoEl.querySelector('.bl-aviso-texto');
  if (t) definirTexto(t, '');
}

/** Topo (antes da área), rodapé (depois) ou oculto. */
function posicionarAviso(bl, config, id) {
  bl.idDoGrafico = id;
  const ligado = config.mostrarAvisos !== false;
  bl.posicaoDoAviso = ligado ? config.posicaoDosAvisos || 'topo' : 'oculto';
  if (bl.posicaoDoAviso === 'rodape') {
    if (bl.avisoEl.nextSibling) bl.raiz.appendChild(bl.avisoEl);
  } else if (bl.avisoEl.nextSibling !== bl.area) {
    bl.raiz.insertBefore(bl.avisoEl, bl.area);
  }
}

function mostrarAviso(bl, tema, mensagem) {
  if (!mensagem) return;
  bl.avisosNoConsole = bl.avisosNoConsole || new Set();
  if (!bl.avisosNoConsole.has(mensagem) && typeof console !== 'undefined' && console.warn) {
    bl.avisosNoConsole.add(mensagem);
    console.warn(`[${bl.idDoGrafico || 'biblioteca-looker'}] aviso: ${mensagem}`);
  }
  const textoEl = bl.avisoEl.querySelector('.bl-aviso-texto');
  const atual = textoEl.textContent;
  definirTexto(textoEl, atual ? `${atual} · ${mensagem}` : mensagem);
  const fechadoPeloUsuario = !!bl.estado.avisoFechado && bl.estado.avisoFechado === textoEl.textContent;
  bl.avisoEl.style.display = bl.posicaoDoAviso === 'oculto' || fechadoPeloUsuario ? 'none' : 'flex';
  bl.avisoEl.style.background = tema.nome === 'escuro' ? 'rgba(251,191,36,.18)' : 'rgba(253,230,138,.85)';
  bl.avisoEl.style.color = tema.nome === 'escuro' ? '#FDE68A' : '#92400E';
}

/** Opções do aviso, presentes em TODOS os gráficos (aba Texto). */
const OPCOES_DE_AVISO = {
  mostrarAvisos: {
    type: 'boolean',
    label: 'Mostrar avisos (eles sempre vão também para o console)',
    section: 'Texto',
    default: true,
  },
  posicaoDosAvisos: {
    type: 'string',
    label: 'Posição dos avisos',
    section: 'Texto',
    display: 'select',
    default: 'topo',
    values: [{ Topo: 'topo' }, { Rodapé: 'rodape' }, { Oculto: 'oculto' }],
  },
};

function mostrarEstadoVazio(bl, tema, mensagem) {
  limpar(bl.area);
  const caixa = criarEl('div', { classe: 'bl-vazio', pai: bl.area, texto: mensagem });
  caixa.style.color = tema.textoSuave;
}

function escreverDebug(id, { modelo, configFinal, queryResponse, data, chaves }) {
  if (typeof console === 'undefined' || !console.log) return;
  // Chaves registradas x recebidas: mostra no Looker real se uma opção
  // "sem efeito" nem está chegando no config.
  console.log(`[${id}] debug — chaves do config`, chaves);
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
