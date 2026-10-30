/**
 * _lista_virtual — base das listas longas com rolagem virtualizada.
 *
 * `barras_ranking_denso` e `dot_plot_denso` têm o mesmo esqueleto: um
 * campo de busca, uma contagem, uma área rolável onde só as linhas
 * VISÍVEIS existem no DOM, e uma nota no rodapé. Com 5.000 itens, isso é
 * a diferença entre 44 elementos e 5.000.
 *
 * Duas propriedades são obrigação da base e aparecem nos testes dos dois
 * gráficos:
 *
 * - **A altura reservada corresponde a TODOS os itens.** Se o espaçador
 *   só contar os desenhados, a barra de rolagem mente sobre quanto falta
 *   e o fim da lista fica inalcançável.
 * - **A busca não renumera.** A base filtra e conta, mas a POSIÇÃO de
 *   cada item é do chamador e não é recalculada: quem busca "Produto X"
 *   quer saber que ele é o 437º, não que é o 1º da lista filtrada.
 *
 * Correções v2: a base também oferece as peças comuns que os três
 * gráficos (barras_ranking_denso, dot_plot_denso, dumbbell) usam para
 * honrar o painel — guias na cor da grade do tema (`desenharGuias`),
 * ponto pela função única de marcadores (`criarPontoHtml`), rótulo HTML
 * pela função única de rótulos (`criarRotuloHtml`), chip de legenda na
 * forma do ponto (`criarChipDeForma`) e a célula do clique
 * (`celulaComLinks`). A barra de topo usa a "Cor das bordas" do tema.
 *
 * (A pasta começa com `_`: não é um gráfico registrado, é código
 * compartilhado.)
 */

import { criarEl, definirTexto, limpar, NS_SVG } from '../../core/dom.js';
import { criarFiltroDeBusca } from '../../core/interaction.js';
import { criarMarcadorSvg } from '../../core/shapes.js';
import { aplicarContorno, opacidadeDoConfig } from '../../core/cores.js';
import { estilizarRotulo } from '../../core/rotulos.js';

export const CSS_LISTA_VIRTUAL = `
.lv-raiz{position:relative;width:100%;height:100%;display:flex;flex-direction:column;}
.lv-topo{display:flex;align-items:center;gap:8px;padding:4px 8px;flex:0 0 auto;}
.lv-busca{flex:1 1 auto;min-width:60px;border-radius:4px;padding:3px 7px;font:inherit;}
.lv-contagem{font-size:11px;opacity:.75;white-space:nowrap;}
.lv-rolagem{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;position:relative;}
.lv-conteudo{position:relative;width:100%;}
.lv-linha{position:absolute;left:0;right:0;display:flex;align-items:center;gap:6px;padding:0 8px;box-sizing:border-box;}
.lv-vazio{position:absolute;left:0;right:0;top:0;padding:6px 10px;}
.lv-nota{flex:0 0 auto;padding:2px 8px 4px;font-size:10px;opacity:.75;}
`;

/** Linhas extras acima e abaixo da janela, para a rolagem não piscar. */
const MARGEM_DA_JANELA = 8;

/**
 * Monta a lista e devolve os ganchos para o gráfico usar.
 *
 * @param {object} params
 * @param {object} params.ctx contexto do defineViz (eventos, estado, tema)
 * @param {Array} params.itens lista COMPLETA, já ordenada e numerada
 * @param {number} params.alturaDaLinha altura fixa de cada linha, em px
 * @param {(item, indice) => HTMLElement} params.montarLinha conteúdo da linha
 * @param {(item) => string} [params.textoDoItem] o que a busca compara
 * @returns {{raiz, topo, rolagem, conteudo, nota, repintar, visiveis}}
 */
export function criarListaVirtual({
  ctx,
  itens,
  alturaDaLinha,
  montarLinha,
  textoDoItem = (item) => item.nome || '',
  comBusca = true,
  rotuloDaBusca = 'Buscar…',
  textoSemResultado = 'Nenhum item encontrado para a busca.',
}) {
  const { tema, raiz } = ctx;

  const caixa = criarEl('div', { classe: 'lv-raiz', pai: raiz });
  const topo = criarEl('div', { classe: 'lv-topo', pai: caixa });
  // Correções v2 (6.2): a "Cor das bordas" do tema separa a barra de topo
  // (busca, contagem, legenda) da lista — antes nada nesta família usava a
  // cor de borda além do contorno do campo de busca.
  topo.style.borderBottom = `1px solid ${tema.borda}`;

  let campoDeBusca = null;
  if (comBusca) {
    campoDeBusca = criarEl('input', { classe: 'lv-busca', pai: topo });
    campoDeBusca.type = 'search';
    campoDeBusca.placeholder = rotuloDaBusca;
    campoDeBusca.style.background = tema.fundo;
    campoDeBusca.style.color = tema.texto;
    campoDeBusca.style.border = `1px solid ${tema.borda}`;
    if (ctx.estado.busca) campoDeBusca.value = ctx.estado.busca;
  }

  const contagem = criarEl('div', { classe: 'lv-contagem', pai: topo });
  contagem.style.color = tema.textoSuave;

  const rolagem = criarEl('div', { classe: 'lv-rolagem', pai: caixa });
  const conteudo = criarEl('div', { classe: 'lv-conteudo', pai: rolagem });
  // 5.1c: a nota é do componente único do núcleo; a lista só escreve o texto.
  const nota = ctx.nota || criarEl('div');
  nota.style.color = tema.textoSuave;

  const estado = { visiveis: itens };

  const repintar = () => {
    limpar(conteudo);

    if (!estado.visiveis.length) {
      const vazio = criarEl('div', { classe: 'lv-vazio', pai: conteudo });
      vazio.style.color = tema.textoSuave;
      definirTexto(vazio, textoSemResultado);
      return;
    }

    const alturaUtil = rolagem.clientHeight || 300;
    const deslocamento = rolagem.scrollTop || 0;
    const inicio = Math.max(0, Math.floor(deslocamento / alturaDaLinha) - MARGEM_DA_JANELA);
    const fim = Math.min(
      estado.visiveis.length,
      inicio + Math.ceil(alturaUtil / alturaDaLinha) + MARGEM_DA_JANELA * 2
    );

    for (let i = inicio; i < fim; i++) {
      const linha = montarLinha(estado.visiveis[i], i);
      if (!linha) continue;
      linha.classList.add('lv-linha');
      linha.style.top = `${i * alturaDaLinha}px`;
      linha.style.height = `${alturaDaLinha}px`;
      conteudo.appendChild(linha);
    }
  };

  const aplicarFiltro = () => {
    const termo = campoDeBusca ? campoDeBusca.value : '';
    ctx.estado.busca = termo;

    if (!termo || !termo.trim()) {
      estado.visiveis = itens;
    } else {
      const combina = criarFiltroDeBusca(termo);
      estado.visiveis = itens.filter((item) => combina(textoDoItem(item)));
    }

    // A altura conta os VISÍVEIS (o filtro encurta a lista de verdade),
    // mas nunca os DESENHADOS.
    conteudo.style.height = `${estado.visiveis.length * alturaDaLinha}px`;
    definirTexto(
      contagem,
      estado.visiveis.length === itens.length
        ? `${itens.length.toLocaleString('pt-BR')} itens`
        : `${estado.visiveis.length.toLocaleString('pt-BR')} de ${itens.length.toLocaleString('pt-BR')}`
    );
    repintar();
  };

  ctx.eventos.on(rolagem, 'scroll', () => {
    ctx.estado.rolagem = rolagem.scrollTop;
    repintar();
  });

  if (campoDeBusca) {
    ctx.eventos.on(campoDeBusca, 'input', () => {
      rolagem.scrollTop = 0;
      aplicarFiltro();
    });
  }

  aplicarFiltro();
  if (ctx.estado.rolagem) rolagem.scrollTop = ctx.estado.rolagem;

  return {
    raiz: caixa,
    topo,
    rolagem,
    conteudo,
    nota,
    contagem,
    repintar,
    get visiveis() {
      return estado.visiveis;
    },
  };
}

/**
 * Acha o item sob um evento de ponteiro, pela posição gravada no `dataset`.
 *
 * Usar o `dataset` em vez de varrer a lista mantém a busca O(1) mesmo com
 * dezenas de milhares de itens — e funciona igual depois de um filtro,
 * porque a posição é a ORIGINAL.
 */
export function itemDoEvento(ev, itens) {
  const linha = ev.target && ev.target.closest ? ev.target.closest('.lv-linha') : null;
  if (!linha || !linha.dataset) return null;
  const posicao = Number(linha.dataset.posicao);
  if (!Number.isFinite(posicao)) return null;
  return itens[posicao - 1] || null;
}

/**
 * A célula para a "Ação do clique": a primeira, na ordem dada, que tem
 * links de drill; se nenhuma tiver, a primeira (o clique então fixa o
 * tooltip, conforme `executarAcaoDoClique`).
 */
export function celulaComLinks(modelo, linha, campos) {
  const celulas = campos.map((c) => modelo.celula(linha, c)).filter(Boolean);
  return celulas.find((c) => Array.isArray(c.links) && c.links.length) || celulas[0] || null;
}

/* ------------------------------------------------------------------ */

/**
 * Linhas de grade verticais dentro do trilho de uma linha.
 *
 * Correções v2 (6.2): as guias usavam `tema.borda` esmaecida, então a
 * opção "Cor das linhas de grade" não mudava nada. Agora a cor é
 * `tema.grade` (que o `resolverTema` troca pela do painel quando
 * preenchida) e cada guia carrega `data-grade` para os testes.
 *
 * @param {HTMLElement} trilho
 * @param {number[]} fracoes posições de 0 a 1
 * @param {object} tema
 * @param {string} [classe] classe própria do gráfico (ex.: 'dp-guia')
 */
export function desenharGuias(trilho, fracoes, tema, classe = 'lv-guia') {
  for (const p of fracoes) {
    const guia = document.createElement('div');
    guia.className = classe;
    guia.setAttribute('data-grade', '1');
    guia.style.position = 'absolute';
    guia.style.top = '0';
    guia.style.bottom = '0';
    guia.style.width = '1px';
    guia.style.left = `${p * 100}%`;
    guia.style.background = tema.grade;
    trilho.appendChild(guia);
  }
}

/**
 * Ponto de uma lista HTML desenhado com a função ÚNICA de marcadores.
 *
 * Correções v2 (6.4): o ponto era um <div> com `border-radius:50%`, e
 * não havia como trocar a forma. Agora o <div> só posiciona; dentro dele
 * vai um <svg> mínimo com o marcador de `criarMarcadorSvg` — assim a
 * forma, o preenchimento, a opacidade e o contorno seguem o painel.
 *
 * @returns {HTMLElement} o <div> posicionado (a classe é do gráfico)
 */
export function criarPontoHtml({ classe, forma, diametro, cor, config, contorno }) {
  const folga = contorno && contorno.mostrar ? contorno.espessura : 0;
  const lado = diametro + folga * 2 + 2;
  const caixa = document.createElement('div');
  caixa.className = classe;
  caixa.style.width = `${lado}px`;
  caixa.style.height = `${lado}px`;
  const svg = document.createElementNS(NS_SVG, 'svg');
  svg.setAttribute('width', String(lado));
  svg.setAttribute('height', String(lado));
  svg.setAttribute('viewBox', `0 0 ${lado} ${lado}`);
  svg.style.display = 'block';
  svg.style.overflow = 'visible';
  caixa.appendChild(svg);
  const marcador = criarMarcadorSvg(svg, forma, lado / 2, lado / 2, diametro, {
    fill: cor,
    'fill-opacity': opacidadeDoConfig(config, 1),
  });
  aplicarContorno(marcador, contorno);
  return caixa;
}

/**
 * Rótulo de dado em HTML, já estilizado pela função única de rótulos.
 *
 * O `transformBase` (deslocamento que posiciona o texto) é aplicado ANTES
 * do estilo, porque `estilizarRotulo` acrescenta a rotação ao transform
 * que já existir. Texto sempre por textContent.
 *
 * @returns {HTMLElement|null} null quando o rótulo está desligado ou vazio
 */
export function criarRotuloHtml(pai, rot, { texto, classe, transformBase = '', corAutomatica, posicao } = {}) {
  if (!rot || !rot.mostrar || texto === '' || texto === null || texto === undefined) return null;
  const el = document.createElement('div');
  el.className = classe;
  el.textContent = String(texto);
  if (transformBase) el.style.transform = transformBase;
  if (posicao) el.dataset.posicao = posicao;
  estilizarRotulo(el, rot, { corAutomatica });
  if (rot.fonte) el.style.fontFamily = rot.fonte;
  pai.appendChild(el);
  return el;
}

/**
 * Bolinha da legenda na forma do ponto (o chip acompanha o desenho).
 */
export function criarChipDeForma(pai, { forma, cor, diametro = 9 }) {
  const svg = document.createElementNS(NS_SVG, 'svg');
  const lado = diametro + 2;
  svg.setAttribute('width', String(lado));
  svg.setAttribute('height', String(lado));
  svg.setAttribute('viewBox', `0 0 ${lado} ${lado}`);
  svg.style.display = 'inline-block';
  svg.style.verticalAlign = 'middle';
  criarMarcadorSvg(svg, forma, lado / 2, lado / 2, diametro, { fill: cor });
  pai.appendChild(svg);
  return svg;
}

/* ------------------------------------------------------------------ */

/**
 * Escala do eixo.
 *
 * O ponto codifica POSIÇÃO, não comprimento — então cortar o eixo é
 * legítimo, e com valores próximos é a única forma de ver diferença. O que
 * não é legítimo é cortar em silêncio: quem chama recebe `comecaEmZero`
 * para declarar na tela.
 *
 * A folga de 4% em cada lado existe para o ponto do extremo não ficar
 * pela metade fora do trilho.
 */
export function montarEscala({ valores, comecarEmZero = false, folga = 0.04 }) {
  if (!valores.length) {
    return { minimo: 0, maximo: 1, incluiZero: true, posicao: () => 0, marcas: [] };
  }

  let minimo = Math.min(...valores);
  let maximo = Math.max(...valores);

  if (comecarEmZero) minimo = Math.min(0, minimo);

  if (minimo === maximo) {
    // Todos iguais: sem um intervalo artificial, todo ponto cairia no
    // mesmo pixel e a divisão por zero viraria NaN.
    const passo = Math.abs(minimo) || 1;
    minimo -= passo / 2;
    maximo += passo / 2;
  } else if (!comecarEmZero) {
    const margem = (maximo - minimo) * folga;
    minimo -= margem;
    maximo += margem;
  }

  const extensao = maximo - minimo || 1;
  const posicao = (v) =>
    v === null || !Number.isFinite(v) ? null : (v - minimo) / extensao;

  return {
    minimo,
    maximo,
    // O que importa para o aviso não é "começa exatamente em zero", é se o
    // eixo está CORTADO — se o zero ficou fora dele. Com valores negativos
    // e base em zero, o eixo começa abaixo de zero e continua honesto.
    incluiZero: minimo <= 0 && maximo >= 0,
    posicao,
    marcas: [0, 0.25, 0.5, 0.75, 1].map((p) => ({ p, valor: minimo + extensao * p })),
  };
}

/**
 * Diferença entre a última e a primeira medida de um item.
 *
 * `null` quando falta alguma das pontas: tratar ausência como zero
 * afirmaria que a diferença é conhecida e nula, que é outra coisa.
 */
export function calcularDiferenca(item) {
  if (!item || !item.valores || item.valores.length < 2) return null;
  const primeiro = item.valores[0];
  const ultimo = item.valores[item.valores.length - 1];
  if (primeiro === null || ultimo === null) return null;
  if (!Number.isFinite(primeiro) || !Number.isFinite(ultimo)) return null;
  return ultimo - primeiro;
}
