/**
 * layouts.js — layouts da Tabela Completa (melhorias v3, 5.5).
 *
 * "Layout" é a ESTRUTURA; as cores continuam no tema/estilo da tabela.
 *
 *   tabela      a tabela de sempre (padrão)
 *   planilha    tabela com números de linha e letras de coluna, grade cheia
 *   financeiro  relatório financeiro: grupos em faixas, subtotais em
 *               destaque, recuo por nível, total com linha dupla
 *   ranking     tabela com barras embutidas ao fundo das células numéricas
 *   cartoes     cada linha vira um cartão com os campos em grade
 *   lista       lista de app: título e subtítulo à esquerda, valores à direita
 *   transposta  campos nas linhas, registros nas colunas
 *   mestre      mestre e detalhe: lista à esquerda, todos os campos à direita
 *   secoes      cada registro com as colunas agrupadas em blocos com título
 *
 * Os quatro primeiros usam o renderizador da tabela (render.js). Os demais
 * são desenhados aqui, com a MESMA base: busca, ordenação, filtros (o que
 * estiver em `estado.filtros`), seleção, pintor de células (tipos de célula
 * e regras) e virtualização — só o que está na tela vira DOM, e a rolagem
 * redesenha sem animação e só quando a janela visível muda.
 */

import { criarEl, limpar, definirTexto, injetarEstilo } from '../../core/dom.js';
import { normalizarTexto } from '../../core/interaction.js';
import { prepararCampo } from './render.js';
import { criarBusca, realcarTrechos, colunasDaBusca } from './busca.js';

export const LAYOUTS = [
  { rotulo: 'Tabela', valor: 'tabela' },
  { rotulo: 'Cartões', valor: 'cartoes' },
  { rotulo: 'Lista de app', valor: 'lista' },
  { rotulo: 'Transposta', valor: 'transposta' },
  { rotulo: 'Planilha', valor: 'planilha' },
  { rotulo: 'Relatório financeiro', valor: 'financeiro' },
  { rotulo: 'Ranking (barras nas células)', valor: 'ranking' },
  { rotulo: 'Mestre e detalhe', valor: 'mestre' },
  { rotulo: 'Seções', valor: 'secoes' },
];

/** Layouts desenhados pelo renderizador da tabela. */
export const LAYOUTS_DE_TABELA = new Set(['tabela', 'planilha', 'financeiro', 'ranking']);

export function layoutEscolhido(config) {
  const v = config && config.layoutDaTabela;
  return LAYOUTS.some((l) => l.valor === v) ? v : 'tabela';
}

/** Letras de coluna de planilha: A..Z, AA.. */
export function letraDaColuna(i) {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const CSS = `
.tl-rolagem{position:relative;flex:1 1 auto;min-height:0;overflow:auto;}
.tl-conteudo{position:relative;}
.tl-item{position:absolute;box-sizing:border-box;overflow:hidden;cursor:default;}
.tl-cartao{border-radius:8px;padding:8px 10px;}
.tl-cartao-titulo{font-weight:700;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tl-grade{display:grid;gap:4px 12px;}
.tl-campo{min-width:0;}
.tl-rotulo{font-size:.82em;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tl-valor{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tl-lista{display:flex;align-items:center;gap:10px;padding:0 12px;}
.tl-esq{flex:1 1 auto;min-width:0;}
.tl-dir{flex:0 0 auto;display:flex;gap:14px;text-align:right;}
.tl-titulo{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tl-sub{font-size:.85em;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tl-selecionado{outline:2px solid rgba(66,118,190,.7);outline-offset:-2px;}
.tl-mestre{display:flex;flex:1 1 auto;min-height:0;}
.tl-mestre>.tl-rolagem{flex:0 0 40%;border-right:1px solid rgba(127,127,127,.25);}
.tl-detalhe{flex:1 1 auto;overflow:auto;padding:10px 14px;}
.tl-detalhe-linha{display:flex;gap:12px;padding:3px 0;border-bottom:1px solid rgba(127,127,127,.15);}
.tl-detalhe-linha .tl-rotulo{flex:0 0 40%;font-size:.9em;}
.tl-secoes{display:flex;gap:10px;}
.tl-bloco{flex:1 1 0;min-width:0;border-radius:6px;padding:6px 8px;}
.tl-bloco-titulo{font-size:.78em;font-weight:700;text-transform:uppercase;letter-spacing:.04em;opacity:.7;margin-bottom:4px;}
.tl-celula-transp{position:absolute;box-sizing:border-box;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tl-ordem{display:flex;gap:4px;align-items:center;}
`;

/** Campos que entram no cartão/lista: os listados, senão todos os visíveis. */
function camposEscolhidos(colunasVisiveis, lista) {
  const nomes = String(lista || '')
    .split(',')
    .map((n) => normalizarTexto(n))
    .filter(Boolean);
  if (!nomes.length) return colunasVisiveis;
  const achadas = nomes
    .map((n) => colunasVisiveis.find((c) => [c.rotulo, c.rotuloOriginal, c.campo && c.campo.nome].filter(Boolean).some((x) => normalizarTexto(x) === n)))
    .filter(Boolean);
  return achadas.length ? achadas : colunasVisiveis;
}

/** Seções: "Título A: col1, col2; Título B: col3". Padrão: dimensões / medidas / calculadas. */
function lerSecoes(colunasVisiveis, texto) {
  const definidas = String(texto || '')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [titulo, resto] = p.includes(':') ? [p.slice(0, p.indexOf(':')), p.slice(p.indexOf(':') + 1)] : [p, ''];
      return { titulo: titulo.trim(), colunas: camposEscolhidos(colunasVisiveis, resto) };
    })
    .filter((s) => s.colunas.length);
  if (definidas.length) return definidas;
  const grupos = [
    { titulo: 'Identificação', colunas: colunasVisiveis.filter((c) => c.tipo === 'dimensao') },
    { titulo: 'Valores', colunas: colunasVisiveis.filter((c) => c.tipo !== 'dimensao' && c.tipo !== 'calculada') },
    { titulo: 'Calculadas', colunas: colunasVisiveis.filter((c) => c.tipo === 'calculada') },
  ];
  return grupos.filter((g) => g.colunas.length);
}

/**
 * Desenha um layout alternativo (cartões, lista, transposta, mestre, seções).
 * Mesmos parâmetros do `desenharTabela`; devolve `{ atualizarDados }`.
 */
export function desenharLayoutAlternativo(params) {
  const { ctx, colunas, visual, estado, aoOrdenar, aoBuscar, aoSelecionarLinha, aoExportar } = params;
  let { itens, indicesDeDados, pintarCelula } = params;
  const { modelo, config, raiz } = ctx;
  const layout = layoutEscolhido(config);
  const colunasVisiveis = colunas.filter((c) => c.visivel);

  limpar(raiz);
  injetarEstilo(raiz, CSS, 'tl');
  const container = criarEl('div', { classe: `tc-raiz tl-${layout}`, pai: raiz });
  container.style.background = visual.fundo;
  container.style.color = visual.texto;
  container.style.fontSize = `${visual.tamanhoFonte}px`;

  // ---------- Barra: busca, ordenar por, exportar, resumo ----------
  const barra = criarEl('div', { classe: 'tc-barra', pai: container });
  if (config.mostrarBusca !== false) {
    const busca = criarEl('input', { pai: barra });
    prepararCampo(busca, estado, 'busca', 'Buscar');
    busca.type = 'search';
    busca.placeholder = 'Buscar…';
    busca.value = estado.busca || '';
    busca.style.borderColor = visual.borda;
    busca.style.background = visual.fundo;
    busca.style.color = visual.texto;
    ctx.eventos.on(busca, 'input', (ev) => aoBuscar(ev.target.value));
  }
  if (config.permitirOrdenar !== false) {
    const ordem = criarEl('div', { classe: 'tl-ordem', pai: barra });
    const sel = criarEl('select', { pai: ordem });
    prepararCampo(sel, estado, 'ordenarPor', 'Ordenar por');
    const atual = estado.ordenacao[0];
    const vazio = criarEl('option', { pai: sel, texto: 'Ordenar por…' });
    vazio.value = '';
    for (const c of colunasVisiveis) {
      const o = criarEl('option', { pai: sel, texto: c.rotulo });
      o.value = c.id;
      if (atual && atual.colunaId === c.id) o.selected = true;
    }
    ctx.eventos.on(sel, 'change', () => {
      if (sel.value) aoOrdenar(sel.value, false);
    });
    if (atual) {
      const dir = criarEl('button', { pai: ordem, classe: 'tl-direcao', texto: atual.direcao === 'asc' ? '↑' : '↓' });
      dir.type = 'button';
      dir.title = 'Inverter a ordem';
      ctx.eventos.on(dir, 'click', () => aoOrdenar(atual.colunaId, false));
    }
  }
  if (config.permitirExportarCsv !== false) {
    const botao = criarEl('button', { pai: barra, texto: 'Exportar CSV' });
    botao.type = 'button';
    ctx.eventos.on(botao, 'click', () => aoExportar());
  }
  const resumo = criarEl('div', { classe: 'tc-resumo', pai: barra });

  const nulo = config.textoParaNulo || '∅';
  const linhasDeDados = () => itens.filter((i) => i.tipo !== 'grupo');
  const realce = () => {
    const b = criarBusca(estado.busca, { modo: config.modoDaBusca === 'qualquer' ? 'qualquer' : 'todas' });
    if (config.realcarBusca === false || !b.trechos.length || config.buscarEm === 'bruto') return null;
    return { trechos: b.trechos, colunas: new Set(colunasDaBusca(colunasVisiveis, config.colunasDaBusca).map((c) => c.id)) };
  };

  /** Valor de uma coluna, pintado pelo MESMO pintor da tabela (tipos e regras). */
  function valor(pai, coluna, linha, indiceDaLinha, r) {
    const el = criarEl('div', { classe: 'tl-valor', pai });
    pintarCelula({ td: el, coluna, linha, indiceDaLinha, visual, posicaoNaJanela: 0 });
    if (!el.childNodes.length) definirTexto(el, coluna.texto(linha, nulo));
    if (r && r.colunas.has(coluna.id)) realcarTrechos(el, r.trechos);
    return el;
  }

  function selecionavel(el, indice) {
    if (estado.selecionadas.has(indice)) el.classList.add('tl-selecionado');
    if (config.permitirSelecionarLinhas !== false) {
      ctx.eventos.on(el, 'click', (ev) => aoSelecionarLinha(indice, ev.ctrlKey || ev.metaKey || ev.shiftKey));
    }
  }

  function atualizarResumo() {
    const n = linhasDeDados().length;
    const b = String(estado.busca || '').trim();
    const partes = [b ? `${n.toLocaleString('pt-BR')} resultado(s) para "${b}"` : `${n.toLocaleString('pt-BR')} linha(s)`];
    if (estado.selecionadas.size) partes.push(`${estado.selecionadas.size} selecionada(s)`);
    definirTexto(resumo, partes.join(' · '));
  }

  // ---------- Área rolável virtualizada ----------
  let corpo = container;
  let detalhe = null;
  if (layout === 'mestre') {
    corpo = criarEl('div', { classe: 'tl-mestre', pai: container });
  }
  const rolagem = criarEl('div', { classe: 'tl-rolagem tc-rolagem', pai: corpo });
  const conteudo = criarEl('div', { classe: 'tl-conteudo', pai: rolagem });
  if (layout === 'mestre') detalhe = criarEl('div', { classe: 'tl-detalhe', pai: corpo });

  const largura = () => Math.max(200, (rolagem.clientWidth || ctx.largura || 600) - 4);
  const altura = () => rolagem.clientHeight || 400;
  const gap = 10;

  /** Geometria do layout: por "faixa" (linha de itens), quantos por faixa e altura. */
  function geometria() {
    const linhas = linhasDeDados();
    if (layout === 'cartoes') {
      const campos = camposEscolhidos(colunasVisiveis, config.camposDoCartao).slice(1);
      const porFaixa = Number(config.colunasDosCartoes) > 0 ? Math.floor(Number(config.colunasDosCartoes)) : Math.max(1, Math.floor(largura() / 260));
      const colunasDeCampos = Math.max(1, Math.min(3, Number(config.colunasDeCamposDoCartao) || 2));
      const h = 22 + 8 + Math.ceil(campos.length / colunasDeCampos) * 34 + 16;
      return { porFaixa, alturaFaixa: h + gap, alturaItem: h, colunasDeCampos, linhas };
    }
    if (layout === 'secoes') {
      const secoes = lerSecoes(colunasVisiveis, config.secoesDoLayout);
      const maior = Math.max(1, ...secoes.map((s) => s.colunas.length));
      const h = 26 + 22 + maior * 20 + 14;
      return { porFaixa: 1, alturaFaixa: h + gap, alturaItem: h, secoes, linhas };
    }
    const h = layout === 'lista' ? Math.max(48, visual.alturaLinha + 18) : Math.max(40, visual.alturaLinha + 8);
    return { porFaixa: 1, alturaFaixa: h, alturaItem: h, linhas };
  }

  let janela = null;
  const MARGEM = 4;

  function desenharJanela(forcar = true) {
    if (layout === 'transposta') return desenharTransposta(forcar);
    const g = geometria();
    const total = g.linhas.length;
    const faixas = Math.ceil(total / g.porFaixa);
    conteudo.style.height = `${faixas * g.alturaFaixa}px`;
    const topo = Math.max(rolagem.scrollTop || 0, estado.rolagemTopoDesejado || 0);
    const ini = Math.max(0, Math.floor(topo / g.alturaFaixa) - MARGEM);
    const fim = Math.min(faixas, Math.ceil((topo + altura()) / g.alturaFaixa) + MARGEM);
    const chave = `${ini}|${fim}|${total}|${g.porFaixa}`;
    if (!forcar && chave === janela) return;
    janela = chave;
    const frag = document.createDocumentFragment();
    const r = realce();
    const larguraItem = (largura() - gap * (g.porFaixa - 1)) / g.porFaixa;
    for (let f = ini; f < fim; f++) {
      for (let k = 0; k < g.porFaixa; k++) {
        const pos = f * g.porFaixa + k;
        if (pos >= total) break;
        const item = g.linhas[pos];
        const linha = modelo.linhas[item.indice];
        const el = criarEl('div', { classe: 'tl-item', pai: frag });
        el.style.top = `${f * g.alturaFaixa}px`;
        el.style.left = `${k * (larguraItem + gap)}px`;
        el.style.width = `${larguraItem}px`;
        el.style.height = `${g.alturaItem}px`;
        el.setAttribute('data-indice', String(item.indice));
        montarItem(el, g, linha, item.indice, pos, r);
        selecionavel(el, item.indice);
      }
    }
    if (typeof conteudo.replaceChildren === 'function') conteudo.replaceChildren(frag);
    else {
      limpar(conteudo);
      conteudo.appendChild(frag);
    }
    if (layout === 'mestre') desenharDetalhe();
  }

  function montarItem(el, g, linha, indice, pos, r) {
    if (layout === 'cartoes') {
      el.classList.add('tl-cartao');
      el.style.border = `1px solid ${visual.borda}`;
      el.style.background = visual.fundo;
      const campos = camposEscolhidos(colunasVisiveis, config.camposDoCartao);
      const titulo = criarEl('div', { classe: 'tl-cartao-titulo', pai: el });
      if (campos[0]) valor(titulo, campos[0], linha, indice, r);
      const grade = criarEl('div', { classe: 'tl-grade', pai: el });
      grade.style.gridTemplateColumns = `repeat(${g.colunasDeCampos}, minmax(0,1fr))`;
      for (const c of campos.slice(1)) {
        const campo = criarEl('div', { classe: 'tl-campo', pai: grade });
        criarEl('div', { classe: 'tl-rotulo', pai: campo, texto: c.rotulo });
        valor(campo, c, linha, indice, r);
      }
      return;
    }
    if (layout === 'secoes') {
      el.classList.add('tl-cartao');
      el.style.border = `1px solid ${visual.borda}`;
      const blocos = criarEl('div', { classe: 'tl-secoes', pai: el });
      for (const s of g.secoes) {
        const b = criarEl('div', { classe: 'tl-bloco', pai: blocos });
        b.style.background = visual.zebra;
        criarEl('div', { classe: 'tl-bloco-titulo', pai: b, texto: s.titulo });
        for (const c of s.colunas) {
          const l = criarEl('div', { classe: 'tl-detalhe-linha', pai: b });
          criarEl('div', { classe: 'tl-rotulo', pai: l, texto: c.rotulo });
          valor(l, c, linha, indice, r);
        }
      }
      return;
    }
    // lista e mestre: título/subtítulo à esquerda, valores à direita
    el.classList.add('tl-lista');
    el.style.borderBottom = `1px solid ${visual.borda}`;
    if (pos % 2 === 1 && visual.usarZebra) el.style.background = visual.zebra;
    const campos = camposEscolhidos(colunasVisiveis, config.camposDoCartao);
    const textos = campos.filter((c) => !c.ehMedida);
    const numeros = campos.filter((c) => c.ehMedida);
    const esq = criarEl('div', { classe: 'tl-esq', pai: el });
    const t = criarEl('div', { classe: 'tl-titulo', pai: esq });
    if (textos[0]) valor(t, textos[0], linha, indice, r);
    if (textos[1]) {
      const s = criarEl('div', { classe: 'tl-sub', pai: esq });
      valor(s, textos[1], linha, indice, r);
    }
    const dir = criarEl('div', { classe: 'tl-dir', pai: el });
    for (const c of numeros.slice(0, layout === 'mestre' ? 1 : 3)) valor(dir, c, linha, indice, r);
    if (layout === 'mestre') {
      ctx.eventos.on(el, 'click', () => {
        estado.detalhe = indice;
        desenharDetalhe();
      });
      if (estado.detalhe === indice) el.classList.add('tl-selecionado');
    }
  }

  function desenharDetalhe() {
    if (!detalhe) return;
    limpar(detalhe);
    const linhas = linhasDeDados();
    if (!linhas.length) return;
    if (estado.detalhe === undefined || !linhas.some((l) => l.indice === estado.detalhe)) estado.detalhe = linhas[0].indice;
    const linha = modelo.linhas[estado.detalhe];
    const r = realce();
    for (const c of colunasVisiveis) {
      const l = criarEl('div', { classe: 'tl-detalhe-linha', pai: detalhe });
      criarEl('div', { classe: 'tl-rotulo', pai: l, texto: c.rotulo });
      valor(l, c, linha, estado.detalhe, r);
    }
  }

  /** Transposta: campos nas linhas (fixos à esquerda), registros nas colunas (virtualizadas). */
  function desenharTransposta(forcar) {
    const linhas = linhasDeDados();
    const larguraRotulo = 160;
    const larguraRegistro = 140;
    const h = visual.alturaLinha;
    conteudo.style.height = `${(colunasVisiveis.length + 1) * h}px`;
    conteudo.style.width = `${larguraRotulo + linhas.length * larguraRegistro}px`;
    const esquerda = Math.max(0, rolagem.scrollLeft || 0, estado.rolagemEsquerdaDesejada || 0);
    const ini = Math.max(0, Math.floor(esquerda / larguraRegistro) - MARGEM);
    const fim = Math.min(linhas.length, Math.ceil((esquerda + largura()) / larguraRegistro) + MARGEM);
    const chave = `${ini}|${fim}|${linhas.length}`;
    if (!forcar && chave === janela) return;
    janela = chave;
    const frag = document.createDocumentFragment();
    const r = realce();
    const celula = (x, y, w, fundo) => {
      const el = criarEl('div', { classe: 'tl-celula-transp', pai: frag });
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.lineHeight = `${h}px`;
      el.style.borderBottom = `1px solid ${visual.borda}`;
      if (fundo) el.style.background = fundo;
      return el;
    };
    for (let k = ini; k < fim; k++) {
      const item = linhas[k];
      const linha = modelo.linhas[item.indice];
      const x = larguraRotulo + k * larguraRegistro;
      const cab = celula(x, 0, larguraRegistro, visual.cabecalhoFundo);
      cab.style.fontWeight = '600';
      definirTexto(cab, `#${k + 1}`);
      selecionavel(cab, item.indice);
      colunasVisiveis.forEach((c, i) => {
        const el = celula(x, (i + 1) * h, larguraRegistro, estado.selecionadas.has(item.indice) ? visual.selecao : '');
        el.style.textAlign = c.alinhamento;
        valor(el, c, linha, item.indice, r);
      });
    }
    // Coluna dos nomes dos campos: fixa à esquerda (acompanha a rolagem).
    const fixa = rolagem.scrollLeft || 0;
    const canto = celula(fixa, 0, larguraRotulo, visual.cabecalhoFundo);
    definirTexto(canto, 'Campo');
    canto.style.fontWeight = '700';
    colunasVisiveis.forEach((c, i) => {
      const el = celula(fixa, (i + 1) * h, larguraRotulo, visual.cabecalhoFundo);
      el.style.fontWeight = '600';
      definirTexto(el, c.rotulo);
    });
    if (typeof conteudo.replaceChildren === 'function') conteudo.replaceChildren(frag);
    else {
      limpar(conteudo);
      conteudo.appendChild(frag);
    }
  }

  ctx.eventos.on(rolagem, 'scroll', () => {
    estado.rolagemTopo = rolagem.scrollTop;
    estado.rolagemEsquerda = rolagem.scrollLeft;
    // Transposta: a coluna fixa acompanha a rolagem horizontal → redesenha.
    desenharJanela(layout === 'transposta');
  });

  estado.rolagemTopoDesejado = estado.rolagemTopo || 0;
  estado.rolagemEsquerdaDesejada = estado.rolagemEsquerda || 0;
  desenharJanela();
  estado.rolagemTopoDesejado = 0;
  estado.rolagemEsquerdaDesejada = 0;
  if (estado.rolagemTopo) rolagem.scrollTop = estado.rolagemTopo;
  if (estado.rolagemEsquerda) rolagem.scrollLeft = estado.rolagemEsquerda;
  atualizarResumo();

  return {
    rolagem,
    atualizarDados(novosItens, novosIndices, novoPintor) {
      itens = novosItens;
      indicesDeDados = novosIndices;
      if (novoPintor) pintarCelula = novoPintor;
      rolagem.scrollTop = 0;
      rolagem.scrollLeft = 0;
      estado.rolagemTopo = 0;
      estado.rolagemEsquerda = 0;
      desenharJanela(true);
      atualizarResumo();
    },
    redesenharJanela: () => desenharJanela(true),
    get indices() {
      return indicesDeDados;
    },
  };
}
