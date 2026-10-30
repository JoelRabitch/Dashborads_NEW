/**
 * render.js — desenho da Tabela Completa.
 *
 * Decisões de implementação:
 *  - **Virtualização por janela**: só as linhas visíveis viram DOM, com duas
 *    linhas "espaçadoras" segurando a altura total. É o que permite 20.000+
 *    linhas com rolagem suave, mantendo uma `<table>` de verdade (bom para
 *    acessibilidade e para alinhar cabeçalho/rodapé automaticamente).
 *  - **Estado preservado** entre atualizações (`ctx.estado`): rolagem,
 *    ordenação, busca, seleção, larguras e página.
 *  - Texto SEMPRE por `textContent` (nunca `innerHTML`).
 */

import { criarEl, limpar, definirTexto, injetarEstilo, preferindoMenosMovimento } from '../../core/dom.js';
import { criarFiltroDeBusca } from '../../core/interaction.js';
import { criarFormatadorNumerico } from '../../core/format.js';
import { cssDasCelulas } from './celulas.js';

const CSS = `
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

/** Contador de instâncias: prefixo dos ids dos campos de formulário. */
let contadorDeInstancias = 0;

/**
 * Id único (prefixo da viz + contador da instância + nome) para campos de
 * formulário. Estável entre redesenhos da mesma instância, único entre duas
 * tabelas na mesma página.
 */
export function idDoCampo(estado, nome) {
  if (!estado.prefixoDeId) {
    contadorDeInstancias += 1;
    estado.prefixoDeId = `tabela_completa-${contadorDeInstancias}`;
  }
  return `${estado.prefixoDeId}-${nome}`;
}

/** Cria o campo com id, name e um <label for> acessível (visualmente oculto). */
export function prepararCampo(campo, estado, nome, rotulo) {
  campo.id = idDoCampo(estado, nome);
  campo.name = nome;
  campo.setAttribute('aria-label', rotulo);
  const label = document.createElement('label');
  label.className = 'tc-oculto';
  label.htmlFor = campo.id;
  label.textContent = rotulo;
  campo.parentNode.insertBefore(label, campo);
  return campo;
}

/** Alturas por densidade (linha, cabeçalho). */
const DENSIDADES = {
  compacta: { linha: 24, cabecalho: 28, fonte: 11 },
  normal: { linha: 32, cabecalho: 36, fonte: 12 },
  confortavel: { linha: 42, cabecalho: 46, fonte: 13 },
};

/** Paletas dos estilos de tabela (sobrepõem o tema quando escolhidos). */
const ESTILOS = {
  claro: {},
  escuro: { forcarTema: 'escuro' },
  cinza: { cabecalho: '#E2E8F0', zebra: '#F8FAFC' },
  minimal: { semBordas: true, cabecalho: 'transparent' },
  cartao: { cartao: true },
  zebra: { zebraSempre: true },
  compacto: { densidade: 'compacta' },
  planilha: { grade: true, cabecalho: '#F1F5F9' },
};

export function cssDaTabela() {
  return CSS;
}

/** Resolve cores/medidas finais juntando tema + estilo + opções. */
export function resolverVisual(config, tema) {
  const estilo = ESTILOS[config.estiloDaTabela] || {};
  const densidadeNome = estilo.densidade || config.densidade || 'normal';
  const d = DENSIDADES[densidadeNome] || DENSIDADES.normal;

  const alturaLinha = Number(config.alturaDaLinha) > 0 ? Number(config.alturaDaLinha) : d.linha;
  const alturaCabecalho = Number(config.alturaDoCabecalho) > 0 ? Number(config.alturaDoCabecalho) : d.cabecalho;

  const escuro = estilo.forcarTema === 'escuro' || tema.nome === 'escuro';

  return {
    alturaLinha,
    alturaCabecalho,
    tamanhoFonte: d.fonte,
    fundo: tema.fundo,
    texto: tema.texto,
    borda: estilo.semBordas ? 'transparent' : tema.borda,
    cabecalhoFundo: config.corDoCabecalho || estilo.cabecalho || (escuro ? '#1E293B' : '#F3F4F6'),
    cabecalhoTexto: config.corDoTextoDoCabecalho || tema.texto,
    zebra: config.corDaZebra || estilo.zebra || (escuro ? '#152133' : '#FAFAFA'),
    usarZebra: !!(estilo.zebraSempre || estilo.zebra || config.corDaZebra),
    hover: config.corDoHover || (escuro ? '#243245' : '#EFF6FF'),
    selecao: config.corDaSelecao || (escuro ? '#1E3A5F' : '#DBEAFE'),
    bordasVerticais: config.mostrarBordasVerticais !== false && !estilo.semBordas,
    bordasHorizontais: config.mostrarBordasHorizontais !== false && !estilo.semBordas,
    raio: Number(config.raioDaBorda) || 0,
    grade: !!estilo.grade,
    cartao: !!estilo.cartao,
    escuro,
  };
}

/**
 * Ordena os índices das linhas conforme o estado de ordenação.
 * Suporta várias colunas (shift+clique).
 */
export function ordenarIndices(indices, colunas, ordenacao, modelo) {
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
        const a = coluna.texto(linhaA, '');
        const b = coluna.texto(linhaB, '');
        r = compararTextos(a, b);
      }
      if (r !== 0) return direcao === 'desc' ? -r : r;
    }
    return 0;
  });
  return copia;
}

function compararNumeros(a, b) {
  const aNulo = a === null || a === undefined || Number.isNaN(a);
  const bNulo = b === null || b === undefined || Number.isNaN(b);
  if (aNulo && bNulo) return 0;
  if (aNulo) return 1; // nulos sempre por último
  if (bNulo) return -1;
  return a - b;
}

function compararTextos(a, b) {
  return String(a).localeCompare(String(b), 'pt-BR', { numeric: true, sensitivity: 'base' });
}

/** Aplica a busca global, devolvendo os índices que casam. */
export function filtrarIndices(indices, colunas, termo, modelo) {
  if (!termo || !termo.trim()) return indices;
  const casa = criarFiltroDeBusca(termo);
  return indices.filter((i) => {
    const linha = modelo.linhas[i];
    for (const coluna of colunas) {
      if (casa(coluna.texto(linha, ''))) return true;
    }
    return false;
  });
}

/** Agregações usadas na linha de totais. */
export function agregar(valores, tipo) {
  const limpos = valores.filter((v) => v !== null && v !== undefined && Number.isFinite(v));
  if (!limpos.length) return null;
  switch (tipo) {
    case 'media':
      return limpos.reduce((a, b) => a + b, 0) / limpos.length;
    case 'minimo':
      return Math.min(...limpos);
    case 'maximo':
      return Math.max(...limpos);
    case 'contagem':
      return limpos.length;
    case 'contagemDistinta':
      return new Set(limpos).size;
    case 'mediana': {
      const ord = limpos.slice().sort((a, b) => a - b);
      const meio = Math.floor(ord.length / 2);
      return ord.length % 2 ? ord[meio] : (ord[meio - 1] + ord[meio]) / 2;
    }
    case 'soma':
    default:
      return limpos.reduce((a, b) => a + b, 0);
  }
}

/**
 * Desenha a tabela inteira.
 *
 * @param {object} params
 */
export function desenharTabela(params) {
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
    aoMenuDeContexto,
  } = params;
  // 5.2 (v3): a entrada animada das linhas só vale para o PRIMEIRO desenho
  // da janela depois de carregar, ordenar, filtrar ou buscar. Selecionar,
  // redimensionar e — principalmente — ROLAR não animam.
  let animarProximaJanela = params.animarEntrada !== false;
  // Mutáveis: busca e filtros trocam linhas, totais e pintor SEM refazer o
  // cabeçalho e a barra (ver `atualizarDados` no fim) — é o que mantém o
  // foco e o cursor no campo enquanto o usuário digita.
  let { itens, indicesDeDados, pintarCelula } = params;
  const { modelo, config, tema, raiz } = ctx;

  // Limpa ANTES de injetar o CSS. (A ordem era a inversa: o limpar apagava
  // o <style> recém-injetado e a tabela ficava sem CSS no Looker — sem
  // overflow:auto não havia rolagem, sem @keyframes não havia animação.)
  limpar(raiz);
  injetarEstilo(raiz, CSS + cssDasCelulas(), 'tc');

  const container = criarEl('div', { classe: 'tc-raiz', pai: raiz });
  container.style.background = visual.fundo;
  container.style.color = visual.texto;
  container.style.fontSize = `${visual.tamanhoFonte}px`;
  if (visual.cartao) {
    container.style.boxShadow = tema.sombra;
    container.style.borderRadius = `${Math.max(4, visual.raio)}px`;
  }

  // ---------------- Barra superior ----------------
  const mostrarBarra =
    config.mostrarBusca !== false || config.permitirExportarCsv !== false || config.permitirSelecionarLinhas !== false;
  let resumoEl = null;
  if (mostrarBarra) {
    const barra = criarEl('div', { classe: 'tc-barra', pai: container });

    if (config.mostrarBusca !== false) {
      const busca = criarEl('input', { pai: barra });
      prepararCampo(busca, estado, 'busca', 'Buscar em todas as colunas');
      busca.type = 'search';
      busca.placeholder = 'Buscar em todas as colunas…';
      busca.value = estado.busca || '';
      busca.style.borderColor = visual.borda;
      busca.style.background = visual.fundo;
      busca.style.color = visual.texto;
      ctx.eventos.on(busca, 'input', (ev) => aoBuscar(ev.target.value));
    }

    if (config.permitirExportarCsv !== false) {
      const botao = criarEl('button', { pai: barra, texto: 'Exportar CSV' });
      botao.style.borderColor = visual.borda;
      botao.style.color = visual.texto;
      ctx.eventos.on(botao, 'click', () => aoExportar());
    }

    resumoEl = criarEl('div', { classe: 'tc-resumo', pai: barra });
  }

  // ---------------- Área de rolagem + tabela ----------------
  const rolagem = criarEl('div', { classe: 'tc-rolagem', pai: container });
  const tabela = criarEl('table', {
    classe: `tc-tabela${config.quebrarTexto === 'quebrar' ? ' tc-quebrar' : ''}${config.cabecalhoVertical ? ' tc-vertical' : ''}`,
    pai: rolagem,
  });

  const colunasVisiveis = colunas.filter((c) => c.visivel);
  const fixas = Math.max(0, Math.min(Number(config.colunasFixasAEsquerda) || 0, colunasVisiveis.length));
  const deslocamentos = calcularDeslocamentos(colunasVisiveis, fixas, !!config.mostrarNumeroDaLinha);

  // <colgroup> garante largura estável mesmo com virtualização.
  const colgroup = criarEl('colgroup', { pai: tabela });
  if (config.mostrarNumeroDaLinha) {
    const col = criarEl('col', { pai: colgroup });
    col.style.width = '46px';
  }
  for (const coluna of colunasVisiveis) {
    const col = criarEl('col', { pai: colgroup });
    const largura = estado.larguras[coluna.id] || coluna.largura;
    col.style.width = `${largura}px`;
  }

  // ---------------- Cabeçalho ----------------
  const thead = criarEl('thead', { pai: tabela });
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
    aoFiltrarColuna,
  });

  // ---------------- Corpo (virtualizado) ----------------
  const tbody = criarEl('tbody', { pai: tabela });

  // ---------------- Rodapé (totais) ----------------
  const tfoot = config.mostrarTotais !== false ? criarEl('tfoot', { pai: tabela }) : null;
  function desenharRodape() {
    if (!tfoot) return;
    limpar(tfoot);
    construirRodape({
      tfoot, colunasVisiveis, indicesVisiveis: indicesDeDados, visual, config, deslocamentos, fixas, modelo,
    });
  }
  desenharRodape();

  // Altura total do cabeçalho (para a conta da virtualização).
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
    janelaAtual: null,
  };

  function desenharJanela({ forcar = true } = {}) {
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
      pintarCelula,
    });
    if (desenhou && resumoEl) atualizarResumo(resumoEl, indicesDeDados, estado, colunasVisiveis, modelo);
  }

  // Rolagem: guarda a posição e redesenha SÓ se a janela de linhas mudou
  // (rolagem horizontal ou dentro da margem não recria nada), sem animação
  // e sem destaque de valor.
  ctx.eventos.on(rolagem, 'scroll', () => {
    estado.rolagemTopo = rolagem.scrollTop;
    estado.rolagemEsquerda = rolagem.scrollLeft;
    desenharJanela({ forcar: false });
  });

  desenharJanela();
  estadoDeDesenho.topoDesejado = 0;

  if (estado.rolagemTopo) rolagem.scrollTop = estado.rolagemTopo;
  if (estado.rolagemEsquerda) rolagem.scrollLeft = estado.rolagemEsquerda;

  /**
   * Troca as linhas (busca/filtro) sem recriar cabeçalho, barra e campos.
   */
  function atualizarDados(novosItens, novosIndices, novoPintor) {
    itens = novosItens;
    indicesDeDados = novosIndices;
    if (novoPintor) pintarCelula = novoPintor;
    desenharRodape();
    rolagem.scrollTop = 0;
    estado.rolagemTopo = 0;
    animarProximaJanela = true; // busca/filtro: as linhas novas entram animadas
    desenharJanela();
  }

  return { rolagem, tabela, tbody, redesenharJanela: desenharJanela, atualizarDados };
}

/** Deslocamento horizontal acumulado das colunas fixas. */
function calcularDeslocamentos(colunasVisiveis, fixas, temNumeroDeLinha) {
  const saida = new Map();
  let acumulado = temNumeroDeLinha ? 46 : 0;
  for (let i = 0; i < colunasVisiveis.length; i++) {
    if (i < fixas) {
      saida.set(colunasVisiveis[i].id, acumulado);
      acumulado += colunasVisiveis[i].largura;
    }
  }
  saida.set('__numeroDeLinha__', 0);
  return saida;
}

function aplicarEstiloDeCabecalho(th, visual, config, topo) {
  th.style.background = visual.cabecalhoFundo;
  th.style.color = visual.cabecalhoTexto;
  th.style.height = `${visual.alturaCabecalho}px`;
  th.style.borderBottom = `2px solid ${visual.borda}`;
  if (visual.bordasVerticais) th.style.borderRight = `1px solid ${visual.borda}`;
  th.style.top = config.cabecalhoFixo === false ? '' : `${topo}px`;
  if (config.cabecalhoFixo === false) th.style.position = 'static';
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
  aoFiltrarColuna,
}) {
  // --- Linha 1: grupos do pivô (só quando há pivô) ---
  if (temPivo) {
    const trGrupo = criarEl('tr', { pai: thead });

    if (config.mostrarNumeroDaLinha) {
      const th = criarEl('th', { pai: trGrupo });
      th.rowSpan = 2;
      aplicarEstiloDeCabecalho(th, visual, config, 0);
    }

    // Cada dimensão ganha seu próprio cabeçalho atravessando os dois níveis,
    // senão o nome da coluna sumiria quando há pivô.
    colunasVisiveis.forEach((coluna, i) => {
      if (coluna.tipo !== 'dimensao') return;
      const th = criarThDeColuna({ coluna, indice: i, topo: 0, visual, config, estado, deslocamentos, fixas, ctx, aoOrdenar, aoRedimensionar });
      th.rowSpan = 2;
      trGrupo.appendChild(th);
    });

    for (const grupo of gruposDePivo) {
      const visiveisDoGrupo = grupo.colunas.filter((c) => c.visivel);
      if (!visiveisDoGrupo.length) continue;
      const th = criarEl('th', { pai: trGrupo, classe: 'tc-centro' });
      th.colSpan = visiveisDoGrupo.length;
      aplicarEstiloDeCabecalho(th, visual, config, 0);
      criarEl('span', { classe: 'tc-th-conteudo', texto: grupo.rotulo, pai: th });
      th.title = grupo.rotulo;
    }
  }

  // --- Linha 2 (ou única): colunas ---
  const tr = criarEl('tr', { pai: thead });
  const topo = temPivo ? visual.alturaCabecalho : 0;

  if (config.mostrarNumeroDaLinha && !temPivo) {
    const th = criarEl('th', { pai: tr, texto: '#' });
    aplicarEstiloDeCabecalho(th, visual, config, topo);
  }

  for (let i = 0; i < colunasVisiveis.length; i++) {
    const coluna = colunasVisiveis[i];
    // Com pivô, as dimensões já saíram no nível de cima com rowSpan=2.
    if (temPivo && coluna.tipo === 'dimensao') continue;
    tr.appendChild(
      criarThDeColuna({ coluna, indice: i, topo, visual, config, estado, deslocamentos, fixas, ctx, aoOrdenar, aoRedimensionar })
    );
  }

  // --- Linha de filtros por coluna (opcional) ---
  if (!config.mostrarFiltrosPorColuna) return;

  const trFiltros = criarEl('tr', { pai: thead });
  const topoDosFiltros = topo + visual.alturaCabecalho;

  if (config.mostrarNumeroDaLinha) {
    const th = criarEl('th', { pai: trFiltros });
    aplicarEstiloDeCabecalho(th, visual, config, topoDosFiltros);
  }

  colunasVisiveis.forEach((coluna, i) => {
    const th = criarEl('th', { pai: trFiltros });
    aplicarEstiloDeCabecalho(th, visual, config, topoDosFiltros);
    if (i < fixas) {
      th.classList.add('tc-fixa');
      th.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
      th.style.position = 'sticky';
    }

    const campo = criarEl('input', { classe: 'tc-filtro', pai: th });
    prepararCampo(campo, estado, `filtro-${i}`, `Filtrar a coluna ${coluna.rotulo || coluna.id}`);
    campo.type = 'text';
    // Em coluna de medida dá para escrever ">100", "<=5" ou "=3".
    campo.placeholder = coluna.ehMedida ? 'ex.: >100' : 'filtrar…';
    campo.value = estado.filtros[coluna.id] || '';
    campo.style.borderColor = visual.borda;
    campo.style.background = visual.fundo;
    campo.style.color = visual.texto;
    ctx.eventos.on(campo, 'input', (ev) => aoFiltrarColuna(coluna.id, ev.target.value));
    ctx.eventos.on(campo, 'click', (ev) => ev.stopPropagation());
  });
}

/** Monta o `<th>` de uma coluna (rótulo, seta de ordenação e alça de largura). */
function criarThDeColuna({ coluna, indice, topo, visual, config, estado, deslocamentos, fixas, ctx, aoOrdenar, aoRedimensionar }) {
  const th = criarEl('th');
  aplicarEstiloDeCabecalho(th, visual, config, topo);
  th.style.textAlign = coluna.alinhamento;

  if (indice < fixas) {
    th.classList.add('tc-fixa');
    th.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
    th.style.position = 'sticky';
  }

  const conteudo = criarEl('span', { classe: 'tc-th-conteudo', pai: th });
  definirTexto(conteudo, coluna.rotulo);
  th.title = coluna.rotuloOriginal;

  const posicao = (estado.ordenacao || []).findIndex((o) => o.colunaId === coluna.id);
  if (posicao >= 0) {
    const o = estado.ordenacao[posicao];
    const seta = criarEl('span', { classe: 'tc-seta', pai: conteudo });
    definirTexto(seta, `${o.direcao === 'desc' ? '▼' : '▲'}${estado.ordenacao.length > 1 ? ` ${posicao + 1}` : ''}`);
  }

  if (config.permitirOrdenar !== false) {
    th.classList.add('tc-ordenavel');
    ctx.eventos.on(th, 'click', (ev) => aoOrdenar(coluna.id, ev.shiftKey));
  }

  if (config.permitirRedimensionarColunas !== false) {
    const alca = criarEl('div', { classe: 'tc-alca', pai: th });
    let larguraInicial = 0;
    let xInicial = 0;
    ctx.eventos.on(alca, 'pointerdown', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      larguraInicial = estado.larguras[coluna.id] || coluna.largura;
      xInicial = ev.clientX;
      try {
        alca.setPointerCapture(ev.pointerId);
      } catch (_) {
        /* ignora */
      }
    });
    ctx.eventos.on(alca, 'pointermove', (ev) => {
      if (!larguraInicial) return;
      aoRedimensionar(coluna.id, Math.max(50, larguraInicial + (ev.clientX - xInicial)));
    });
    ctx.eventos.on(alca, 'pointerup', (ev) => {
      larguraInicial = 0;
      try {
        alca.releasePointerCapture(ev.pointerId);
      } catch (_) {
        /* ignora */
      }
    });
  }

  return th;
}

function construirRodape({ tfoot, colunasVisiveis, indicesVisiveis, visual, config, estado, deslocamentos, fixas, modelo }) {
  const tr = criarEl('tr', { pai: tfoot });
  const formatadorSimples = criarFormatadorNumerico({ estilo: 'auto', casas: 2 });

  if (config.mostrarNumeroDaLinha) {
    const td = criarEl('td', { pai: tr });
    estiloDeRodape(td, visual, config);
  }

  let primeiraDimensao = true;
  for (let i = 0; i < colunasVisiveis.length; i++) {
    const coluna = colunasVisiveis[i];
    const td = criarEl('td', { pai: tr });
    estiloDeRodape(td, visual, config);
    td.style.textAlign = coluna.alinhamento;

    if (i < fixas) {
      td.classList.add('tc-fixa');
      td.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
      td.style.position = config.rodapeFixo === false ? 'sticky' : 'sticky';
    }

    if (coluna.ehMedida) {
      // Preferimos o total que o próprio Looker mandou; se não houver,
      // calculamos (e o `index.js` avisa que o cálculo é nosso).
      const doLooker = modelo.totais.encontrados ? modelo.totais.porCampo[coluna.campo.nome] : null;
      let valor = null;
      if (doLooker && !coluna.chaveDoPivo) {
        valor = doLooker.value !== undefined ? Number(doLooker.value) : null;
      }
      if (valor === null || !Number.isFinite(valor)) {
        const valores = indicesVisiveis.map((idx) => coluna.valorNumerico(modelo.linhas[idx]));
        valor = agregar(valores, config.agregacaoDoTotal || 'soma');
      }
      definirTexto(td, valor === null ? '' : coluna.formatar ? coluna.formatar(valor) : formatadorSimples(valor));
    } else if (primeiraDimensao) {
      definirTexto(td, config.rotuloDoTotal || 'Total');
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
  if (config.rodapeFixo === false) td.style.position = 'static';
}

/**
 * Desenha só a janela de linhas visível (virtualização).
 *
 * 5.2 (v3): mede a posição ANTES de mexer no corpo e troca as linhas de uma
 * vez (fragmento + replaceChildren). Antes o corpo era esvaziado primeiro;
 * a leitura de `scrollTop`/`clientHeight` com o corpo vazio forçava um
 * layout em que o conteúdo não tinha altura, o navegador cortava o
 * scrollTop e a tabela "piscava em branco e voltava ao início".
 *
 * @returns {boolean} se redesenhou
 */
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
  pintarCelula,
}) {
  const { rolagem, tbody: tbodyReal, colunasVisiveis, deslocamentos, fixas, alturaCabecalhoTotal } = estadoDeDesenho;
  const alturaLinha = visual.alturaLinha;
  const total = itens.length;

  // Medidas primeiro (corpo ainda intacto).
  const alturaUtil = rolagem.clientHeight || 400;
  const topoAtual = Math.max(rolagem.scrollTop || 0, estadoDeDesenho.topoDesejado || 0);

  const margem = 10;
  const deslocamento = Math.max(0, topoAtual - alturaCabecalhoTotal);
  let inicio = Math.max(0, Math.floor(deslocamento / alturaLinha) - margem);
  let fim = Math.min(total, inicio + Math.ceil(alturaUtil / alturaLinha) + margem * 2);

  // Paginação (se ligada) substitui a janela por um intervalo fixo.
  const porPagina = Number(config.linhasPorPagina) || 0;
  if (porPagina > 0) {
    const pagina = estado.pagina || 0;
    inicio = pagina * porPagina;
    fim = Math.min(total, inicio + porPagina);
  }

  // Rolagem que não muda a janela (horizontal, ou dentro da margem): nada a fazer.
  const chave = `${inicio}|${fim}|${total}`;
  if (!forcar && estadoDeDesenho.janelaAtual === chave) return false;
  estadoDeDesenho.janelaAtual = chave;

  // As linhas são montadas fora do documento e entram de uma vez.
  const tbody = document.createDocumentFragment();
  const trocar = () => {
    if (typeof tbodyReal.replaceChildren === 'function') tbodyReal.replaceChildren(tbody);
    else {
      limpar(tbodyReal);
      tbodyReal.appendChild(tbody);
    }
  };

  if (!total) {
    const tr = criarEl('tr', { pai: tbody });
    const td = criarEl('td', { pai: tr, classe: 'tc-vazio' });
    td.colSpan = colunasVisiveis.length + (config.mostrarNumeroDaLinha ? 1 : 0);
    const temFiltro = estado.busca || Object.values(estado.filtros).some((v) => v && v.trim());
    definirTexto(
      td,
      temFiltro ? 'Nenhuma linha encontrada para a busca.' : config.textoSemDados || 'Sem dados para exibir'
    );
    trocar();
    return true;
  }

  if (inicio > 0) tbody.appendChild(linhaEspacadora(inicio * alturaLinha, colunasVisiveis.length + 1));

  // "Ativar animações" (interruptor de todo gráfico, 2.7) também desliga a
  // entrada das linhas da tabela, que anima por conta própria.
  const animar =
    animarEstaJanela &&
    config.animacaoAtiva !== false &&
    config.animarEntradaDasLinhas !== false &&
    !preferindoMenosMovimento();

  for (let i = inicio; i < fim; i++) {
    const item = itens[i];

    if (item.tipo === 'grupo') {
      tbody.appendChild(
        linhaDeGrupo({ item, ctx, colunasVisiveis, visual, config, modelo, fixas, deslocamentos, aoAlternarGrupo })
      );
      continue;
    }

    const indiceDaLinha = item.indice;
    const linha = modelo.linhas[indiceDaLinha];
    const tr = criarEl('tr', { pai: tbody });
    tr.style.height = `${alturaLinha}px`;
    if (animar) {
      tr.classList.add('tc-entrando');
      tr.style.animationDelay = `${Math.min(140, (i - inicio) * 7)}ms`;
    }

    const selecionada = estado.selecionadas.has(indiceDaLinha);
    const zebrada = visual.usarZebra && i % 2 === 1;
    const fundoBase = selecionada ? visual.selecao : zebrada ? visual.zebra : 'transparent';
    if (fundoBase !== 'transparent') tr.style.background = fundoBase;

    if (config.permitirSelecionarLinhas !== false) {
      tr.classList.add('tc-selecionavel');
      ctx.eventos.on(tr, 'click', (ev) => {
        // Clique numa célula com drill tem prioridade; o handler da célula
        // chama stopPropagation.
        aoSelecionarLinha(indiceDaLinha, ev.ctrlKey || ev.metaKey || ev.shiftKey);
      });
    }

    if (config.destacarLinhaEColuna !== false) {
      ctx.eventos.on(tr, 'pointerenter', () => {
        tr.style.background = visual.hover;
      });
      ctx.eventos.on(tr, 'pointerleave', () => {
        tr.style.background = fundoBase === 'transparent' ? '' : fundoBase;
      });
    }

    if (config.mostrarNumeroDaLinha) {
      const td = criarEl('td', { pai: tr, classe: 'tc-numero-linha' });
      estiloDeCelula(td, visual, config);
      definirTexto(td, String(i + 1));
    }

    for (let c = 0; c < colunasVisiveis.length; c++) {
      const coluna = colunasVisiveis[c];
      const td = criarEl('td', { pai: tr });
      estiloDeCelula(td, visual, config);
      td.style.textAlign = coluna.alinhamento;
      if (coluna.ehMedida) td.classList.add('tc-num');

      if (c < fixas) {
        td.classList.add('tc-fixa');
        td.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
        td.style.background = fundoBase === 'transparent' ? visual.fundo : fundoBase;
      }

      // O conteúdo em si é desenhado por quem chamou (tipos de célula ricos
      // e regras de formatação condicional vivem no index.js).
      pintarCelula({ td, coluna, linha, indiceDaLinha, visual, posicaoNaJanela: i });

      if (aoMenuDeContexto) {
        ctx.eventos.on(td, 'contextmenu', (ev) => aoMenuDeContexto(ev, { coluna, linha, indiceDaLinha, td }));
      }
    }
  }

  if (fim < total && porPagina <= 0) {
    tbody.appendChild(linhaEspacadora((total - fim) * alturaLinha, colunasVisiveis.length + 1));
  }
  trocar();
  return true;
}

/** Linha de cabeçalho de grupo, com o subtotal já embutido. */
function linhaDeGrupo({ item, ctx, colunasVisiveis, visual, config, modelo, fixas, deslocamentos, aoAlternarGrupo }) {
  const tr = criarEl('tr', { classe: 'tc-grupo' });
  tr.style.height = `${visual.alturaLinha}px`;
  tr.style.background = visual.escuro ? '#1B2738' : '#EEF2F7';
  tr.style.fontWeight = '600';

  if (config.mostrarNumeroDaLinha) {
    const td = criarEl('td', { pai: tr });
    estiloDeCelula(td, visual, config);
  }

  const mostrarSubtotais = config.mostrarSubtotais !== false;
  let primeira = true;

  colunasVisiveis.forEach((coluna, c) => {
    const td = criarEl('td', { pai: tr });
    estiloDeCelula(td, visual, config);
    td.style.textAlign = coluna.alinhamento;
    if (c < fixas) {
      td.classList.add('tc-fixa');
      td.style.left = `${deslocamentos.get(coluna.id) || 0}px`;
      td.style.background = tr.style.background;
    }

    if (primeira && !coluna.ehMedida) {
      primeira = false;
      td.style.paddingLeft = `${8 + item.nivel * 14}px`;
      const seta = criarEl('span', { classe: 'tc-seta-grupo', pai: td, texto: item.aberto ? '▾' : '▸' });
      seta.style.marginRight = '5px';
      const rotulo = criarEl('span', { pai: td, texto: `${item.rotulo} (${item.quantidade})` });
      rotulo.title = item.rotulo;
      td.classList.add('tc-selecionavel');
      ctx.eventos.on(td, 'click', (ev) => {
        ev.stopPropagation();
        aoAlternarGrupo(item.chave);
      });
      return;
    }

    if (coluna.ehMedida && mostrarSubtotais) {
      const valores = item.indices.map((i) => coluna.valorNumerico(modelo.linhas[i]));
      const valor = agregar(valores, config.agregacaoDoTotal || 'soma');
      definirTexto(td, valor === null ? '' : coluna.formatar ? coluna.formatar(valor) : String(valor));
    }
  });

  return tr;
}

function linhaEspacadora(altura, colSpan) {
  const tr = document.createElement('tr');
  tr.className = 'tc-espacador';
  tr.style.height = `${altura}px`;
  const td = document.createElement('td');
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
  const partes = [`${indicesVisiveis.length.toLocaleString('pt-BR')} linha(s)`];
  if (estado.selecionadas.size) {
    partes.push(`${estado.selecionadas.size} selecionada(s)`);
    const primeiraMedida = colunasVisiveis.find((c) => c.ehMedida);
    if (primeiraMedida) {
      const valores = Array.from(estado.selecionadas).map((i) => primeiraMedida.valorNumerico(modelo.linhas[i]));
      const soma = agregar(valores, 'soma');
      if (soma !== null) {
        partes.push(`soma de ${primeiraMedida.rotulo}: ${primeiraMedida.formatar ? primeiraMedida.formatar(soma) : soma}`);
      }
    }
  }
  definirTexto(resumoEl, partes.join(' · '));
}

/** Monta o CSV a partir das linhas visíveis (sem rede: Blob + URL local). */
export function montarCsv(colunasVisiveis, indicesVisiveis, modelo, textoNulo) {
  const escapar = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const linhas = [colunasVisiveis.map((c) => escapar(c.rotulo)).join(';')];
  for (const indice of indicesVisiveis) {
    const linha = modelo.linhas[indice];
    linhas.push(colunasVisiveis.map((c) => escapar(c.texto(linha, textoNulo))).join(';'));
  }
  return linhas.join('\n');
}
