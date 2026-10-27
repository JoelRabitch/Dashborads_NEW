/**
 * tooltip.js — tooltip flutuante no padrão do Looker (módulo 2.3).
 *
 * UM ÚNICO elemento por gráfico. Antes, cada desenho (atualização,
 * redimensionamento, legenda) chamava `criarTooltip` e pendurava mais um
 * <div> no <body>, sem remover o anterior — os antigos ficavam visíveis e
 * se acumulavam na tela (confirmado no barras_ranking_denso). Agora o
 * tooltip é guardado por gráfico (chave: o `.bl-raiz` da instância) e
 * `criarTooltip` devolve SEMPRE o mesmo; o hover só troca conteúdo e
 * posição.
 *
 * Esconde em: saída do mouse do gráfico, rolagem, redesenho
 * (`updateAsync`, via define-viz) e destruição.
 *
 * Clique ("Ação do clique", opção `acaoDoClique`):
 *   - "drill" (padrão): abre o menu de drill do Looker se a célula tem
 *     links; se não tem, fixa o tooltip;
 *   - "fixar": fixa o tooltip;
 *   - "nenhuma": não faz nada.
 *   Shift+clique sempre fixa. Clique fora ou Esc solta.
 *
 * SEGURANÇA: todo valor de dado entra por `textContent`. O modelo do
 * usuário (`modeloDeTooltip`) aceita só as tags b, i, br e span, SEM
 * atributos; o resto vira texto. HTML do Looker (`htmlForCell`) só entra
 * com a opção "Permitir HTML do Looker" ligada, e mesmo assim é
 * reconstruído nó a nó por uma lista de tags permitidas — nunca innerHTML.
 */

import { criarEl, limpar } from './dom.js';
import { preencherTemplate } from './format.js';

const CSS_TOOLTIP = `
.bl-tooltip{position:fixed;z-index:2147483000;pointer-events:none;max-width:320px;
  padding:6px 9px;border-radius:6px;font-size:11px;line-height:1.5;border:1px solid transparent;
  box-shadow:0 6px 18px rgba(15,23,42,.25);opacity:0;transition:opacity .12s ease;}
.bl-tooltip.bl-visivel{opacity:1;}
.bl-tooltip.bl-fixo{box-shadow:0 0 0 2px rgba(66,118,190,.55),0 6px 18px rgba(15,23,42,.25);}
.bl-tooltip-linha{display:flex;gap:8px;justify-content:space-between;white-space:nowrap;}
.bl-tooltip-rotulo{opacity:.75;}
.bl-tooltip-valor{font-weight:600;}
.bl-tooltip-titulo{font-weight:700;margin-bottom:3px;}
.bl-tooltip-chip{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle;}
.bl-tooltip-dica{opacity:.6;font-size:.9em;margin-top:3px;}
`;

/** Um tooltip por gráfico: chave = elemento `.bl-raiz` da instância. */
const registro = new WeakMap();
/** Contexto por gráfico (config e ponte da atualização atual), vindo do define-viz. */
const contextos = new WeakMap();

const TAGS_DO_MODELO = new Set(['b', 'i', 'br', 'span']);
const TAGS_DO_HTML_DO_LOOKER = new Set(['b', 'i', 'br', 'span', 'strong', 'em', 'p', 'div', 'u', 'small']);

function raizDe(el) {
  if (!el) return null;
  if (el.classList && el.classList.contains('bl-raiz')) return el;
  return (el.closest && el.closest('.bl-raiz')) || el;
}

/** Chamado pelo define-viz a cada atualização: config e ponte atuais. */
export function configurarTooltipsDe(raiz, { config, ponte } = {}) {
  const r = raizDe(raiz);
  if (!r) return;
  contextos.set(r, { config: config || {}, ponte: ponte || null });
  const t = registro.get(r);
  if (t) t.aplicarEstilo();
}

/** Esconde (e solta) o tooltip do gráfico — usado em todo redesenho. */
export function esconderTooltipsDe(raiz) {
  const t = registro.get(raizDe(raiz));
  if (t) {
    t.soltar();
    t.esconder();
  }
}

/** Remove o tooltip do gráfico do DOM — usado no destroy. */
export function destruirTooltipsDe(raiz) {
  const r = raizDe(raiz);
  const t = registro.get(r);
  if (t) t.destruir();
  contextos.delete(r);
}

/** Quantos elementos de tooltip existem no documento (para os testes). */
export function contarTooltips(doc = document) {
  return doc.querySelectorAll('.bl-tooltip').length;
}

/**
 * Devolve O tooltip do gráfico (cria na primeira vez).
 * @param {Element} hospedeiro qualquer elemento dentro do gráfico
 * @param {object} tema tema resolvido
 */
export function criarTooltip(hospedeiro, tema) {
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
    const style = document.createElement('style');
    style.setAttribute('data-estilo', 'bl-tooltip');
    style.textContent = CSS_TOOLTIP;
    raiz.appendChild(style);
  }

  // O elemento vai no <body> do iframe para não ser cortado pelo
  // `overflow:hidden` do tile; `position:fixed` + limites da janela
  // (= o iframe da visualização) mantêm o tooltip dentro dele.
  const el = criarEl('div', { classe: 'bl-tooltip' });
  el.setAttribute('role', 'tooltip');
  (document.body || raiz).appendChild(el);

  let tema = temaInicial || {};
  let visivel = false;
  let fixo = false;
  let fixadoEm = 0;
  let ultimaPosicao = { x: 0, y: 0 };
  const removedores = [];

  function ouvir(alvo, evento, fn, opcoes) {
    if (!alvo || typeof alvo.addEventListener !== 'function') return;
    alvo.addEventListener(evento, fn, opcoes);
    removedores.push(() => alvo.removeEventListener(evento, fn, opcoes));
  }

  function config() {
    const c = contextos.get(raiz);
    return (c && c.config) || {};
  }

  function aplicarEstilo() {
    const c = config();
    const cor = (v) => (typeof v === 'string' && v.trim() ? v.trim() : '');
    el.style.background = cor(c.corDeFundoDoTooltip) || tema.tooltipFundo || 'rgba(15,23,42,.94)';
    el.style.color = cor(c.corDoTextoDoTooltip) || tema.tooltipTexto || '#F8FAFC';
    el.style.borderColor = cor(c.corDaBordaDoTooltip) || 'transparent';
    el.style.fontFamily = tema.fonte || '';
    const tamanho = Number(c.tamanhoDoTooltip);
    el.style.fontSize = Number.isFinite(tamanho) && tamanho > 0 ? `${tamanho}px` : '';
  }

  function posicionar(clientX, clientY) {
    ultimaPosicao = { x: clientX, y: clientY };
    const margem = 12;
    const larguraJanela = (typeof window !== 'undefined' && window.innerWidth) || 1024;
    const alturaJanela = (typeof window !== 'undefined' && window.innerHeight) || 768;
    const largura = el.offsetWidth || 200;
    const altura = el.offsetHeight || 60;
    let x = clientX + margem;
    let y = clientY + margem;
    // Inverte de lado ao chegar na borda: o iframe é o limite.
    if (x + largura > larguraJanela - 4) x = clientX - largura - margem;
    if (y + altura > alturaJanela - 4) y = clientY - altura - margem;
    el.style.left = `${Math.max(4, Math.min(x, larguraJanela - largura - 4))}px`;
    el.style.top = `${Math.max(4, Math.min(y, alturaJanela - altura - 4))}px`;
  }

  function preencher(conteudo) {
    limpar(el);
    const c = config();
    const modelo = typeof c.modeloDeTooltip === 'string' ? c.modeloDeTooltip.trim() : '';
    // O modelo do usuário vale sempre que estiver preenchido (vazio = padrão).
    // `tooltipPersonalizado` fica só por compatibilidade (ver LOG, 2.3).
    if (modelo) {
      montarModelo(el, modelo, variaveisDoConteudo(conteudo), c, contextos.get(raiz));
      return;
    }
    if (conteudo.titulo) criarEl('div', { classe: 'bl-tooltip-titulo', texto: conteudo.titulo, pai: el });
    if (conteudo.texto) {
      for (const parte of String(conteudo.texto).split('\n')) criarEl('div', { texto: parte, pai: el });
    }
    for (const linha of conteudo.linhas || []) {
      const l = criarEl('div', { classe: 'bl-tooltip-linha', pai: el });
      const esquerda = criarEl('span', { classe: 'bl-tooltip-rotulo', pai: l });
      if (linha.cor) {
        const chip = criarEl('span', { classe: 'bl-tooltip-chip', pai: esquerda });
        chip.style.background = linha.cor;
      }
      esquerda.appendChild(document.createTextNode(String(linha.rotulo ?? '')));
      criarEl('span', { classe: 'bl-tooltip-valor', texto: linha.valor ?? '', pai: l });
    }
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
      aplicarEstilo();
    },
    aplicarEstilo,

    /**
     * Mostra o tooltip.
     * @param {{titulo?:string, linhas?:Array<{rotulo:string,valor:string,cor?:string}>,
     *          texto?:string, variaveis?:object}} conteudo
     *   `variaveis` (opcional) alimenta o modelo do usuário: categoria,
     *   valor, serie, percentual e quaisquer outras.
     */
    mostrar(conteudo, clientX, clientY) {
      if (fixo) return; // fixado: o hover não troca o conteúdo
      if (config().mostrarTooltip === false) return;
      api.ultimoConteudo = conteudo || {};
      preencher(api.ultimoConteudo);
      posicionar(clientX, clientY);
      if (!visivel) {
        el.classList.add('bl-visivel');
        visivel = true;
      }
    },

    mover(clientX, clientY) {
      if (visivel && !fixo) posicionar(clientX, clientY);
    },

    esconder() {
      if (fixo || !visivel) return;
      el.classList.remove('bl-visivel');
      visivel = false;
    },

    /** Fixa o tooltip onde está (ou com o conteúdo dado). */
    fixar(conteudo, clientX, clientY) {
      if (conteudo) {
        fixo = false;
        api.mostrar(conteudo, clientX ?? ultimaPosicao.x, clientY ?? ultimaPosicao.y);
      }
      if (!visivel) return false;
      fixo = true;
      fixadoEm = Date.now();
      el.classList.add('bl-fixo');
      return true;
    },

    soltar() {
      if (!fixo) return;
      fixo = false;
      el.classList.remove('bl-fixo');
      el.classList.remove('bl-visivel');
      visivel = false;
    },

    destruir() {
      for (const r of removedores.splice(0)) r();
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch (_) {
        /* ignora */
      }
      if (registro.get(raiz) === api) registro.delete(raiz);
      visivel = false;
      fixo = false;
    },
  };

  // Saída do mouse do gráfico, rolagem, Esc e clique fora.
  ouvir(raiz, 'pointerleave', () => api.esconder());
  ouvir(raiz, 'mouseleave', () => api.esconder());
  if (typeof window !== 'undefined') {
    ouvir(window, 'scroll', () => {
      api.soltar();
      api.esconder();
    }, true);
  }
  ouvir(document, 'keydown', (ev) => {
    if (ev && ev.key === 'Escape') api.soltar();
  });
  ouvir(document, 'pointerdown', () => {
    // O clique que FIXOU chega aqui logo depois; só solta nos seguintes.
    if (fixo && Date.now() - fixadoEm > 50) api.soltar();
  }, true);

  aplicarEstilo();
  return api;
}

/**
 * Variáveis do modelo a partir do conteúdo que o gráfico mostraria.
 * Padronizadas: {{categoria}}, {{valor}}, {{serie}}, {{percentual}}; e cada
 * linha do tooltip também vira variável pelo seu rótulo (formato antigo
 * `{{nome_do_campo}}`).
 */
export function variaveisDoConteudo(conteudo = {}) {
  const v = {};
  const linhas = conteudo.linhas || [];
  for (const l of linhas) {
    if (!l || l.rotulo === undefined) continue;
    const rotulo = String(l.rotulo);
    v[rotulo] = l.valor;
    v[rotulo.toLowerCase()] = l.valor;
    v[normalizarNome(rotulo)] = l.valor;
  }
  if (conteudo.titulo !== undefined) v.categoria = conteudo.titulo;
  const primeira = linhas.find((l) => l && l.valor !== undefined && l.valor !== '');
  if (primeira) v.valor = primeira.valor;
  const comCor = linhas.find((l) => l && l.cor);
  if (comCor) v.serie = comCor.rotulo;
  const comPct = linhas.find((l) => l && /%\s*$/.test(String(l.valor || '')));
  if (comPct) v.percentual = comPct.valor;
  return Object.assign(v, conteudo.variaveis || {});
}

function normalizarNome(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Monta o modelo do usuário dentro de `alvo`, com segurança:
 * só b/i/br/span sem atributos viram elementos; tudo o mais é texto, e o
 * valor de cada {{variavel}} entra por textContent.
 */
export function montarModelo(alvo, modelo, variaveis, config = {}, contexto = null) {
  const pilha = [alvo];
  const atual = () => pilha[pilha.length - 1];
  const reTag = /<\s*(\/?)\s*([a-zA-Z]+)\s*(\/?)\s*>/g;
  let fim = 0;
  let m;
  const textos = (trecho) => {
    if (!trecho) return;
    // Quebras de linha do campo viram <br>.
    const partes = trecho.split('\n');
    partes.forEach((p, i) => {
      if (i > 0) atual().appendChild(document.createElement('br'));
      inserirComVariaveis(atual(), p, variaveis, config, contexto);
    });
  };
  while ((m = reTag.exec(modelo)) !== null) {
    textos(modelo.slice(fim, m.index));
    fim = reTag.lastIndex;
    const nome = m[2].toLowerCase();
    if (!TAGS_DO_MODELO.has(nome)) {
      textos(m[0]); // tag não permitida: aparece como texto
      continue;
    }
    if (nome === 'br') {
      atual().appendChild(document.createElement('br'));
    } else if (m[1] === '/') {
      if (pilha.length > 1 && atual().tagName.toLowerCase() === nome) pilha.pop();
    } else {
      const novo = document.createElement(nome);
      atual().appendChild(novo);
      if (m[3] !== '/') pilha.push(novo);
    }
  }
  textos(modelo.slice(fim));
}

function inserirComVariaveis(pai, texto, variaveis, config, contexto) {
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  let fim = 0;
  let m;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > fim) pai.appendChild(document.createTextNode(texto.slice(fim, m.index)));
    fim = re.lastIndex;
    const chave = m[1].trim();
    const valor = variaveis[chave] ?? variaveis[chave.toLowerCase()] ?? variaveis[normalizarNome(chave)];
    const celula = variaveis.__celulas && variaveis.__celulas[chave];
    if (celula && config.permitirHtmlDoLooker && contexto && contexto.ponte) {
      const html = contexto.ponte.htmlDaCelula(celula, { permitido: true });
      if (html) {
        inserirHtmlFiltrado(pai, html);
        continue;
      }
    }
    pai.appendChild(document.createTextNode(valor === null || valor === undefined ? '' : String(valor)));
  }
  if (fim < texto.length) pai.appendChild(document.createTextNode(texto.slice(fim)));
}

/**
 * HTML do Looker reconstruído nó a nó: só tags de formatação, sem nenhum
 * atributo (nada de href, style, on*). Texto entra por createTextNode.
 */
export function inserirHtmlFiltrado(pai, html) {
  if (typeof DOMParser === 'undefined') {
    pai.appendChild(document.createTextNode(String(html)));
    return;
  }
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
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
          copiar(no, destino); // tag proibida: fica só o texto de dentro
        }
      }
    }
  };
  copiar(doc.body, pai);
}

/**
 * Ação do clique num item do gráfico (módulo 2.3/2.6). Usada por
 * `ctx.cliqueNoItem` — os gráficos não decidem drill x fixar sozinhos.
 *
 * @returns {'drill'|'fixou'|'nada'}
 */
export function executarAcaoDoClique({ evento, celula, tooltip, ponte, config = {}, conteudo }) {
  const acao = config.acaoDoClique || 'drill';
  const x = evento && evento.clientX;
  const y = evento && evento.clientY;
  if (evento && evento.shiftKey) {
    return tooltip && tooltip.fixar(conteudo, x, y) ? 'fixou' : 'nada';
  }
  if (acao === 'nenhuma') return 'nada';
  if (acao === 'drill' && config.permitirDrill !== false && ponte && ponte.temDrill(celula)) {
    if (tooltip) tooltip.soltar();
    return ponte.abrirDrill(celula, evento) ? 'drill' : 'nada';
  }
  return tooltip && tooltip.fixar(conteudo, x, y) ? 'fixou' : 'nada';
}

/**
 * Monta o conteúdo do tooltip de uma linha de dados com os valores JÁ
 * FORMATADOS pelo Looker (textForCell/rendered), nunca o número cru.
 */
export function montarConteudoDeTooltip({ modelo, linha, config = {}, titulo, linhasExtras = [], chaveDoPivo }) {
  const linhas = [];
  const usarNomeCompleto = !!config.tooltipComNomeCompleto;
  const celulas = {};
  for (const campo of modelo.dimensoes.concat(modelo.medidas)) {
    const texto = modelo.texto(linha, campo.nome, chaveDoPivo, '');
    if (typeof modelo.celula === 'function') celulas[campo.nome] = modelo.celula(linha, campo.nome, chaveDoPivo);
    if (texto === '') continue;
    const item = { rotulo: usarNomeCompleto ? campo.rotulo : campo.rotuloCurto, valor: texto };
    if (config.tooltipComValorBruto) {
      const bruto = modelo.valorBruto(linha, campo.nome, chaveDoPivo);
      if (bruto !== null && bruto !== undefined && String(bruto) !== texto) item.valor = `${texto} (${bruto})`;
    }
    linhas.push(item);
  }
  const variaveis = { __celulas: celulas };
  for (const campo of modelo.dimensoes.concat(modelo.medidas)) {
    const texto = modelo.texto(linha, campo.nome, chaveDoPivo, '');
    variaveis[campo.nome] = texto;
    variaveis[campo.rotulo] = texto;
  }
  return { titulo, linhas: linhasExtras.concat(linhas), variaveis };
}

/** Compatibilidade: o modelo antigo em texto puro. */
export function preencherModeloComoTexto(modelo, valores) {
  return preencherTemplate(modelo, valores);
}

/** Injeta o CSS do tooltip (usado quando o gráfico cria o tooltip sozinho). */
export function cssDoTooltip() {
  return CSS_TOOLTIP;
}
