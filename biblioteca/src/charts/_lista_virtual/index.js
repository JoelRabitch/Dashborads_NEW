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
 * (A pasta começa com `_`: não é um gráfico registrado, é código
 * compartilhado.)
 */

import { criarEl, definirTexto, limpar } from '../../core/dom.js';
import { criarFiltroDeBusca } from '../../core/interaction.js';

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
  const nota = criarEl('div', { classe: 'lv-nota', pai: caixa });
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
