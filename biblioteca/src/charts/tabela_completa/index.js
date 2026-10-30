/**
 * tabela_completa — "Tabela Completa" (seção 8 do PROMPT_AGENTE.md).
 *
 * Estrutura: colunas a partir do modelo, cabeçalho fixo em dois níveis
 * quando há pivô, virtualização por janela de linhas, ordenação por uma ou
 * várias colunas, busca, filtros por coluna, agrupamento com subtotais,
 * seleção com soma, cópia, menu de contexto, exportação CSV e totais.
 *
 * Os tipos de célula ricos ficam em `celulas.js` e as regras de formatação
 * condicional em `regras.js`. Este arquivo é só a amarração.
 */

import { defineViz } from '../../core/define-viz.js';
import { definirTexto, criarEl } from '../../core/dom.js';
import { misturarCores } from '../../core/scales.js';
import { textoLegivelSobre, comOpacidade } from '../../core/theme.js';
import { prepararRegras, avaliarRegras, posicaoNaColuna } from './regras.js';
import { desenhistaDoTipo, TIPOS_QUE_PRECISAM_DA_COLUNA } from './celulas.js';
import { montarItens, aplicarFiltrosDeColuna } from './grupos.js';
import { opcoesEstaticas, opcoesPorColuna, MAXIMO_DE_COLUNAS_CONFIGURAVEIS } from './opcoes.js';
import { construirColunas, colunasNumericasParaOpcoes, resumoDeColunas } from './colunas.js';
import {
  resolverVisual,
  desenharTabela,
  ordenarIndices,
  filtrarIndices,
  montarCsv,
  idDoCampo,
} from './render.js';
import { regrasDeFormula } from './calculadas.js';
import { layoutEscolhido, LAYOUTS_DE_TABELA, desenharLayoutAlternativo } from './layouts.js';

/** Espera depois da última tecla antes de filtrar (ms). */
// Espera curta depois da última tecla (5.3, v3: "debounce curto").
const ESPERA_DO_FILTRO = 150;

/** Define a ordenação inicial a partir da opção do painel. */
function ordenacaoInicial(config, colunas) {
  const escolha = config.ordenacaoInicial || 'original';
  if (escolha === 'original') return [];
  const primeiraMedida = colunas.find((c) => c.ehMedida);
  const primeiraDimensao = colunas.find((c) => !c.ehMedida);
  if (escolha === 'medidaDesc' && primeiraMedida) return [{ colunaId: primeiraMedida.id, direcao: 'desc' }];
  if (escolha === 'medidaAsc' && primeiraMedida) return [{ colunaId: primeiraMedida.id, direcao: 'asc' }];
  if (escolha === 'dimensaoAsc' && primeiraDimensao) return [{ colunaId: primeiraDimensao.id, direcao: 'asc' }];
  if (escolha === 'dimensaoDesc' && primeiraDimensao) return [{ colunaId: primeiraDimensao.id, direcao: 'desc' }];
  return [];
}

/** Garante que o estado persistente tem todas as chaves que usamos. */
function prepararEstado(estado, config, colunas) {
  if (!estado.larguras) estado.larguras = {};
  if (!estado.selecionadas) estado.selecionadas = new Set();
  if (!estado.gruposFechados) estado.gruposFechados = new Set();
  if (!estado.filtros) estado.filtros = {};
  if (estado.busca === undefined) estado.busca = '';
  if (estado.pagina === undefined) estado.pagina = 0;
  if (!estado.ordenacao || estado.assinaturaDaOrdenacao !== config.ordenacaoInicial) {
    estado.ordenacao = ordenacaoInicial(config, colunas);
    estado.assinaturaDaOrdenacao = config.ordenacaoInicial;
  }
  // Se a consulta mudou, ordenações apontando para colunas que sumiram viram lixo.
  const ids = new Set(colunas.map((c) => c.id));
  estado.ordenacao = estado.ordenacao.filter((o) => ids.has(o.colunaId));
  return estado;
}

/** Texto a mostrar quando o valor é nulo, conforme a opção escolhida. */
function textoParaNulo(config) {
  if (config.tratamentoDeNulos === 'vazio') return '';
  if (config.tratamentoDeNulos === 'zero') return '0';
  return config.textoParaNulo || '∅';
}

/**
 * Pinta o conteúdo de uma célula: tipo de célula escolhido, escala de cor,
 * regras de formatação condicional e drill.
 */
function criarPintorDeCelula(ctx, nulo, contextos, porId, comparacao) {
  const { config, ponte, modelo } = ctx;
  // Formatação condicional por fórmula (5.4, v3): "Colorir a linha/células".
  const porFormula = regrasDeFormula(modelo, config);

  return function pintarCelula({ td, coluna, linha, indiceDaLinha }) {
    const estatistica = contextos.get(coluna.id) || null;

    if (comparacao && coluna.ehMedida) {
      compararComAtualizacaoAnterior({ ctx, td, coluna, linha, indiceDaLinha, comparacao });
    }

    // 1) Cores fixas da coluna (base, antes das regras).
    if (coluna.corDoTexto) td.style.color = coluna.corDoTexto;
    if (coluna.corDeFundo) td.style.background = coluna.corDeFundo;

    // 2) Escala de cor (mapa de calor) da coluna.
    if (coluna.escalaDeCor && estatistica) {
      const posicao = posicaoNaColuna(coluna.valorNumerico(linha), estatistica);
      if (posicao !== null) {
        const fundo = misturarCores(coluna.escalaCorMin, coluna.escalaCorMax, posicao);
        td.style.background = fundo;
        td.style.color = textoLegivelSobre(fundo, ctx.tema);
      }
    }

    const textoBase = coluna.texto(linha, nulo);
    // Prefixo/sufixo não entram em célula vazia (ficaria "R$ " sozinho).
    const texto = textoBase === '' ? '' : `${coluna.prefixo}${textoBase}${coluna.sufixo}`;

    // 3) Regras de formatação condicional.
    const efeito = avaliarRegras({ coluna, linha, contextos, porId, textoDaCelula: textoBase });

    // 4) Conteúdo: tipo de célula rico ou texto puro. A ação "Badge" de uma
    // regra transforma a célula em badge mesmo que a coluna seja de texto.
    const desenhista =
      desenhistaDoTipo(coluna.tipoDeCelula) || (efeito && efeito.badge ? desenhistaDoTipo('badge') : null);
    let textoEquivalente = texto;
    if (desenhista) {
      textoEquivalente = desenhista({
        td,
        coluna,
        linha,
        texto,
        visual: ctx.visualDaTabela,
        config,
        modelo,
        ponte,
        eventos: ctx.eventos,
        estatistica,
        corDoBadge: efeito && efeito.badge,
        // Saída de emergência de qualquer desenhista: escreve o texto puro.
        comoTexto: () => {
          definirTexto(td, texto);
          return texto;
        },
      });
    } else {
      definirTexto(td, texto);
    }
    td.title = textoEquivalente;

    // 5) Efeitos das regras por cima do conteúdo.
    if (efeito) {
      if (efeito.fundo) td.style.background = efeito.fundo;
      if (efeito.cor) td.style.color = efeito.cor;
      if (efeito.negrito) td.style.fontWeight = '700';
      if (efeito.bordaEsquerda) td.style.borderLeft = `3px solid ${efeito.bordaEsquerda}`;
      if (efeito.piscar) td.classList.add('tc-piscando');
      if (efeito.icone) {
        const icone = criarEl('span', { classe: 'tc-icone', texto: `${efeito.icone} ` });
        icone.style.color = efeito.corDoIcone || '';
        td.insertBefore(icone, td.firstChild);
      }
      if (efeito.linhaInteira && td.parentNode) {
        if (efeito.linhaInteira.fundo) td.parentNode.style.background = efeito.linhaInteira.fundo;
        if (efeito.linhaInteira.cor) td.parentNode.style.color = efeito.linhaInteira.cor;
      }
    }

    // 5b) Formatação condicional por fórmula (5.4, v3).
    if (porFormula) porFormula(td, coluna, linha);

    // 6) Drill. O tipo "link" já cuida do próprio clique.
    if (config.permitirDrill === false || coluna.tipoDeCelula === 'link') return;
    const celula = coluna.celula(linha);
    if (celula && ponte.temDrill(celula)) {
      td.style.cursor = 'pointer';
      ctx.eventos.on(td, 'click', (ev) => {
        ev.stopPropagation();
        ponte.abrirDrill(celula, ev);
      });
    }
  };
}

/**
 * Dispara o download do CSV sem rede: Blob local + <a download>.
 *
 * ATENÇÃO (correções v2): a visualização roda num iframe com sandbox
 * (`/visualizations/sandbox/...`). Se o sandbox não tiver
 * `allow-downloads`, o navegador bloqueia o download EM SILÊNCIO — não há
 * evento nem erro para detectar. Por isso o botão sempre abre também o
 * painel com o CSV em texto (`mostrarPainelDeCsv`): se o arquivo não
 * baixou, o usuário copia dali.
 * @returns {boolean} se conseguiu ao menos disparar o download
 */
function baixarCsv(conteudo, nomeDoArquivo) {
  if (typeof Blob !== 'function' || typeof URL === 'undefined' || !URL.createObjectURL) return false;
  // BOM para o Excel abrir acentos corretamente.
  const blob = new Blob([`﻿${conteudo}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const ancora = criarEl('a');
  ancora.href = url;
  ancora.download = nomeDoArquivo;
  ancora.style.display = 'none';
  document.body.appendChild(ancora);
  ancora.click();
  document.body.removeChild(ancora);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * Painel com o CSV em texto selecionável + "Copiar" + "Fechar".
 * Copiar tenta `navigator.clipboard` (pode ser negado pelo iframe) e cai
 * para selecionar o texto + execCommand('copy'); se nada der, o texto fica
 * selecionado e a mensagem pede Ctrl+C.
 */
function mostrarPainelDeCsv({ ctx, conteudo, visual, tentouBaixar }) {
  fecharPainelDeCsv(ctx.estado);
  const painel = criarEl('div', { classe: 'tc-csv', pai: document.body });
  painel.style.background = visual.fundo;
  painel.style.color = visual.texto;
  painel.style.borderColor = visual.borda;
  ctx.estado.painelDeCsv = painel;

  criarEl('div', {
    pai: painel,
    texto: tentouBaixar
      ? 'Se o download não começou, o Looker bloqueou downloads nesta visualização. Copie o CSV abaixo e cole numa planilha.'
      : 'Este navegador não permite gerar o arquivo aqui. Copie o CSV abaixo e cole numa planilha.',
  });
  const area = criarEl('textarea', { pai: painel });
  area.id = idDoCampo(ctx.estado, 'csv');
  area.name = 'csv';
  area.setAttribute('aria-label', 'Conteúdo CSV da tabela');
  area.readOnly = true;
  area.value = conteudo;
  area.style.background = visual.fundo;
  area.style.color = visual.texto;
  area.style.borderColor = visual.borda;

  const botoes = criarEl('div', { classe: 'tc-csv-botoes', pai: painel });
  const copiarBotao = criarEl('button', { pai: botoes, texto: 'Copiar' });
  const fechar = criarEl('button', { pai: botoes, texto: 'Fechar' });
  const situacao = criarEl('span', { pai: botoes });
  for (const b of [copiarBotao, fechar]) {
    b.type = 'button';
    b.style.borderColor = visual.borda;
    b.style.color = visual.texto;
  }
  copiarBotao.addEventListener('click', () => {
    area.focus();
    area.select();
    const avisar = (ok) =>
      definirTexto(situacao, ok ? 'Copiado.' : 'O Looker bloqueou a cópia automática: o texto está selecionado, use Ctrl+C.');
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(conteudo).then(() => avisar(true), () => avisar(copiar(conteudo)));
    } else {
      avisar(copiar(conteudo));
    }
  });
  fechar.addEventListener('click', () => fecharPainelDeCsv(ctx.estado));
}

function fecharPainelDeCsv(estado) {
  const painel = estado && estado.painelDeCsv;
  if (painel && painel.parentNode) painel.parentNode.removeChild(painel);
  if (estado) estado.painelDeCsv = null;
}

/**
 * Pisca a célula quando o valor mudou em relação à atualização anterior.
 * Só vale na PRIMEIRA pintura depois de novos dados: reordenar ou buscar
 * não deve piscar nada, porque o valor não mudou.
 */
function compararComAtualizacaoAnterior({ ctx, td, coluna, linha, indiceDaLinha, comparacao }) {
  const chave = `${indiceDaLinha}|${coluna.id}`;
  const valor = coluna.valorNumerico(linha);
  comparacao.novos.set(chave, valor);

  if (!comparacao.anteriores) return;
  const antigo = comparacao.anteriores.get(chave);
  if (antigo === undefined || antigo === null || valor === null || valor === antigo) return;

  const cor = valor > antigo ? ctx.config.corDeSubida || '#16A34A' : ctx.config.corDeDescida || '#DC2626';
  const fundoAnterior = td.style.background;
  td.classList.add('tc-flash');
  td.style.background = comOpacidade(cor, 0.35);
  ctx.agendarTimer(() => {
    td.style.background = fundoAnterior;
  }, 60);
}

/**
 * Copia texto para a área de transferência.
 *
 * Dentro do iframe do Looker a API moderna (`navigator.clipboard`) costuma
 * ser bloqueada por permissão, então o caminho que funciona é o antigo:
 * um `<textarea>` fora da tela + `document.execCommand('copy')`.
 */
function copiar(texto) {
  if (typeof document === 'undefined') return false;
  const area = criarEl('textarea');
  area.id = `tabela_completa-copia-${Date.now()}`;
  area.name = 'copia';
  area.value = texto;
  area.setAttribute('readonly', 'readonly');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  area.style.opacity = '0';
  document.body.appendChild(area);
  let deuCerto = false;
  try {
    area.select();
    deuCerto = typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch (_) {
    deuCerto = false;
  }
  document.body.removeChild(area);
  return deuCerto;
}

export default defineViz({
  id: 'tabela_completa',
  label: 'Tabela Completa',
  opcoes: opcoesEstaticas(),
  // A tabela aceita praticamente qualquer consulta: com ou sem pivô, só
  // dimensões, só medidas ou os dois.
  exigencia: { aceitaPivo: true, exigeLinhas: true },
  // A tabela anima as próprias linhas (animarEntradaDasLinhas) e a
  // virtualização redesenha ao rolar: a animação genérica não entra.
  animacaoPropria: true,

  opcoesDinamicas({ modelo, config }) {
    const { colunas } = construirColunas(modelo, config);
    return opcoesPorColuna(resumoDeColunas(colunas), colunasNumericasParaOpcoes(colunas));
  },

  render(ctx) {
    const { modelo, config, tema, estado } = ctx;

    if (!modelo.quantidadeDeLinhas) {
      ctx.mostrarVazio();
      return;
    }

    const { colunas, colunasVisiveis, temPivo, gruposDePivo, errosDeFormula } = construirColunas(modelo, config);
    // Fórmula com erro: a célula mostra "#ERRO" e o aviso diz qual espaço.
    for (const erro of errosDeFormula || []) ctx.avisar(erro);

    if (!colunasVisiveis.length) {
      ctx.mostrarVazio('Todas as colunas estão ocultas. Reative pelo menos uma no painel.');
      return;
    }

    if (colunas.length > MAXIMO_DE_COLUNAS_CONFIGURAVEIS) {
      ctx.avisar(
        `A tabela tem ${colunas.length} colunas; só as ${MAXIMO_DE_COLUNAS_CONFIGURAVEIS} primeiras têm opções próprias no painel.`
      );
    }
    if (config.mostrarTotais !== false && !modelo.totais.encontrados) {
      ctx.avisar('O Looker não enviou os totais; a linha de totais é calculada pela visualização.');
    }

    prepararEstado(estado, config, colunas);

    const visual = resolverVisual(config, tema);
    ctx.visualDaTabela = visual;
    const nulo = textoParaNulo(config);
    const porId = new Map(colunas.map((c) => [c.id, c]));

    // Índices de linha depois de filtros + busca + ordenação. Recalculado a
    // cada interação; a virtualização cuida de não transformar isso em DOM.
    function calcularIndices() {
      const todos = modelo.linhas.map((_, i) => i);
      const porColuna = aplicarFiltrosDeColuna(todos, colunasVisiveis, estado.filtros, modelo);
      const buscados = filtrarIndices(porColuna, colunasVisiveis, estado.busca, modelo, config);
      return ordenarIndices(buscados, colunas, estado.ordenacao, modelo);
    }

    let indicesVisiveis = calcularIndices();
    let itens = montarItens({ indices: indicesVisiveis, colunas, config, modelo, estado });

    // Top N, percentil, média, escalas de cor e os tipos de célula que
    // comparam com a coluna inteira: calculado uma vez por renderização.
    const estatisticas = () => prepararRegras(colunas, indicesVisiveis, modelo, TIPOS_QUE_PRECISAM_DA_COLUNA);

    // Comparação com a atualização anterior, usada só nesta primeira
    // pintura: reordenar ou buscar não deve fazer a tabela piscar.
    const comparacao =
      config.animarMudancaDeValor !== false && !ctx.primeiraRenderizacao
        ? { anteriores: estado.valoresAnteriores || null, novos: new Map() }
        : { anteriores: null, novos: new Map() };

    let pintarCelula = criarPintorDeCelula(ctx, nulo, estatisticas(), porId, comparacao);

    function recalcular() {
      indicesVisiveis = calcularIndices();
      itens = montarItens({ indices: indicesVisiveis, colunas, config, modelo, estado });
    }

    function redesenhar() {
      recalcular();
      pintarCelula = criarPintorDeCelula(ctx, nulo, estatisticas(), porId, null);
      desenhar({ animarEntrada: true });
    }

    /**
     * Busca e filtros: espera o usuário parar de digitar e troca SÓ as
     * linhas (desenho.atualizarDados). Antes cada tecla redesenhava a tabela
     * inteira, recriando o <input> — o foco e o cursor se perdiam.
     */
    function filtrarDepoisDeDigitar() {
      if (estado.timerDoFiltro) clearTimeout(estado.timerDoFiltro);
      estado.timerDoFiltro = ctx.agendarTimer(() => {
        estado.timerDoFiltro = null;
        recalcular();
        pintarCelula = criarPintorDeCelula(ctx, nulo, estatisticas(), porId, null);
        if (desenho && desenho.atualizarDados) desenho.atualizarDados(itens, indicesVisiveis, pintarCelula);
        else desenhar();
      }, ESPERA_DO_FILTRO);
    }

    let desenho = null;

    /**
     * `animarEntrada` (5.2, v3): só carregar, ordenar, agrupar e (via
     * atualizarDados) buscar/filtrar animam a entrada das linhas.
     * Selecionar e redimensionar redesenham sem animação.
     */
    function desenhar({ animarEntrada = false } = {}) {
      ctx.eventos.limpar();
      // Layouts (5.5, v3): os de tabela vão para o render da tabela; os
      // demais para layouts.js. Planilha sempre numera as linhas.
      const layout = layoutEscolhido(config);
      const ctxDoDesenho =
        layout === 'planilha' ? Object.assign({}, ctx, { config: Object.assign({}, config, { mostrarNumeroDaLinha: true }) }) : ctx;
      const desenhista = LAYOUTS_DE_TABELA.has(layout) ? desenharTabela : desenharLayoutAlternativo;
      desenho = desenhista({
        animarEntrada,
        ctx: ctxDoDesenho,
        colunas,
        gruposDePivo,
        temPivo,
        visual,
        itens,
        indicesDeDados: indicesVisiveis,
        estado,
        pintarCelula,

        aoOrdenar(colunaId, acumular) {
          const atual = estado.ordenacao.find((o) => o.colunaId === colunaId);
          if (!acumular) {
            const direcao = atual && atual.direcao === 'asc' ? 'desc' : 'asc';
            estado.ordenacao = [{ colunaId, direcao }];
          } else if (atual) {
            // Já estava no critério: asc → desc → sai da lista.
            if (atual.direcao === 'asc') atual.direcao = 'desc';
            else estado.ordenacao = estado.ordenacao.filter((o) => o.colunaId !== colunaId);
          } else {
            estado.ordenacao.push({ colunaId, direcao: 'asc' });
          }
          estado.rolagemTopo = 0;
          redesenhar();
        },

        aoBuscar(termo) {
          estado.busca = termo;
          estado.pagina = 0;
          estado.rolagemTopo = 0;
          filtrarDepoisDeDigitar();
        },

        aoSelecionarLinha(indice, acumular) {
          if (!acumular) {
            const soEssa = estado.selecionadas.size === 1 && estado.selecionadas.has(indice);
            estado.selecionadas.clear();
            if (!soEssa) estado.selecionadas.add(indice);
          } else if (estado.selecionadas.has(indice)) {
            estado.selecionadas.delete(indice);
          } else {
            estado.selecionadas.add(indice);
          }
          desenhar();
        },

        aoRedimensionar(colunaId, largura) {
          estado.larguras[colunaId] = largura;
          const coluna = colunas.find((c) => c.id === colunaId);
          if (coluna) coluna.largura = largura;
          desenhar();
        },

        aoExportar() {
          const csv = montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo);
          const tentouBaixar = baixarCsv(csv, 'tabela_completa.csv');
          mostrarPainelDeCsv({ ctx, conteudo: csv, visual, tentouBaixar });
        },

        aoAlternarGrupo(chave) {
          if (estado.gruposFechados.has(chave)) estado.gruposFechados.delete(chave);
          else estado.gruposFechados.add(chave);
          redesenhar();
        },

        aoFiltrarColuna(colunaId, termo) {
          estado.filtros[colunaId] = termo;
          estado.pagina = 0;
          estado.rolagemTopo = 0;
          filtrarDepoisDeDigitar();
        },

        aoMenuDeContexto: config.permitirCopiar === false ? null : abrirMenuDeContexto,
      });
    }

    /** Menu do botão direito: copiar célula, copiar linha(s), exportar. */
    function abrirMenuDeContexto(evento, { coluna, linha, indiceDaLinha }) {
      evento.preventDefault();
      fecharMenu();

      const menu = criarEl('div', { classe: 'tc-menu', pai: document.body });
      menu.style.background = visual.fundo;
      menu.style.color = visual.texto;
      menu.style.borderColor = visual.borda;
      menu.style.boxShadow = tema.sombra;
      menu.style.left = `${evento.clientX}px`;
      menu.style.top = `${evento.clientY}px`;
      ctx.estado.menuAberto = menu;

      const item = (rotulo, acao) => {
        const botao = criarEl('button', { pai: menu, texto: rotulo });
        ctx.eventos.on(botao, 'click', () => {
          acao();
          fecharMenu();
        });
      };

      item('Copiar valor desta célula', () => copiar(coluna.texto(linha, nulo)));
      item('Copiar esta linha', () => copiar(linhaComoTexto(indiceDaLinha)));
      if (estado.selecionadas.size) {
        item(`Copiar ${estado.selecionadas.size} linha(s) selecionada(s)`, () =>
          copiar(Array.from(estado.selecionadas).map(linhaComoTexto).join('\n'))
        );
      }
      item('Copiar a tabela inteira', () => copiar(montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo)));
      item('Exportar CSV', () => {
        const csv = montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo);
        mostrarPainelDeCsv({ ctx, conteudo: csv, visual, tentouBaixar: baixarCsv(csv, 'tabela_completa.csv') });
      });

      const celula = coluna.celula(linha);
      if (config.permitirDrill !== false && celula && ctx.ponte.temDrill(celula)) {
        item('Abrir drill do Looker', () => ctx.ponte.abrirDrill(celula, evento));
      }

      // Fecha ao clicar em qualquer outro lugar.
      ctx.agendarTimer(() => {
        ctx.eventos.on(document, 'click', fecharMenu, { once: true });
      }, 0);
    }

    function fecharMenu() {
      const menu = ctx.estado.menuAberto;
      if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
      ctx.estado.menuAberto = null;
    }

    function linhaComoTexto(indice) {
      const linha = modelo.linhas[indice];
      return colunasVisiveis.map((c) => c.texto(linha, nulo)).join('\t');
    }

    desenhar({ animarEntrada: true });

    // A virtualização só pinta a janela visível, então o mapa cobre o que
    // apareceu. Mesclamos com o anterior para não perder o resto da tabela.
    estado.valoresAnteriores = new Map([...(estado.valoresAnteriores || []), ...comparacao.novos]);
    // 5.2 (v3): o destaque de valor que mudou vale só nesta primeira pintura.
    // Linhas que entram depois (rolagem, seleção) usam o mesmo pintor e não
    // podem piscar: a comparação é desligada aqui.
    comparacao.anteriores = null;
  },

  aoDestruir({ estado }) {
    fecharPainelDeCsv(estado);
    const menu = estado && estado.menuAberto;
    if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
  },
});
