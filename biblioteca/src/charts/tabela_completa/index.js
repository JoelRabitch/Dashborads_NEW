/**
 * tabela_completa — "Tabela Completa" (seção 8 do PROMPT_AGENTE.md).
 *
 * Parte 1 (esta entrega): estrutura de colunas a partir do modelo, cabeçalho
 * fixo em dois níveis quando há pivô, virtualização por janela de linhas,
 * ordenação por uma ou várias colunas, busca, seleção com soma, exportação
 * CSV, redimensionamento de colunas, temas/densidade e linha de totais.
 *
 * Parte 2 trará os tipos de célula ricos (barra, sparkline, badge, semáforo…)
 * e o motor de regras de formatação condicional; parte 3 traz agrupamento de
 * linhas com subtotais e as animações de mudança de valor.
 */

import { defineViz } from '../../core/define-viz.js';
import { definirTexto, criarEl } from '../../core/dom.js';
import { opcoesEstaticas, opcoesPorColuna, MAXIMO_DE_COLUNAS_CONFIGURAVEIS } from './opcoes.js';
import { construirColunas, colunasNumericasParaOpcoes, resumoDeColunas } from './colunas.js';
import {
  resolverVisual,
  desenharTabela,
  ordenarIndices,
  filtrarIndices,
  montarCsv,
} from './render.js';

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
 * Pinta o conteúdo de uma célula.
 * Nesta parte 1 tratamos texto, número (com prefixo/sufixo e cores fixas por
 * coluna) e o clique de drill. Os tipos ricos chegam na parte 2.
 */
function criarPintorDeCelula(ctx, nulo) {
  const { config, ponte } = ctx;

  return function pintarCelula({ td, coluna, linha }) {
    if (coluna.corDoTexto) td.style.color = coluna.corDoTexto;
    if (coluna.corDeFundo) td.style.background = coluna.corDeFundo;

    const texto = coluna.texto(linha, nulo);
    // Prefixo/sufixo não entram em célula vazia (ficaria "R$ " sozinho).
    const comAfixos = texto === '' ? '' : `${coluna.prefixo}${texto}${coluna.sufixo}`;
    definirTexto(td, comAfixos);
    td.title = comAfixos;

    if (config.permitirDrill === false) return;
    const celula = coluna.celula(linha);
    if (celula && ponte.temDrill(celula)) {
      td.style.cursor = 'pointer';
      td.style.textDecoration = 'underline dotted';
      ctx.eventos.on(td, 'click', (ev) => {
        ev.stopPropagation();
        ponte.abrirDrill(celula, ev);
      });
    }
  };
}

/** Dispara o download do CSV sem rede: Blob local + <a download>. */
function baixarCsv(conteudo, nomeDoArquivo) {
  if (typeof Blob !== 'function' || typeof URL === 'undefined' || !URL.createObjectURL) return;
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
}

export default defineViz({
  id: 'tabela_completa',
  label: 'Tabela Completa',
  opcoes: opcoesEstaticas(),
  // A tabela aceita praticamente qualquer consulta: com ou sem pivô, só
  // dimensões, só medidas ou os dois.
  exigencia: { aceitaPivo: true, exigeLinhas: true },

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

    const { colunas, colunasVisiveis, temPivo, gruposDePivo } = construirColunas(modelo, config);

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
    const nulo = textoParaNulo(config);
    const pintarCelula = criarPintorDeCelula(ctx, nulo);

    // Índices de linha depois de busca + ordenação. Recalculado a cada
    // interação; a virtualização cuida de não transformar isso em DOM.
    function calcularIndices() {
      const todos = modelo.linhas.map((_, i) => i);
      const filtrados = filtrarIndices(todos, colunasVisiveis, estado.busca, modelo);
      return ordenarIndices(filtrados, colunas, estado.ordenacao, modelo);
    }

    let indicesVisiveis = calcularIndices();

    function redesenhar() {
      indicesVisiveis = calcularIndices();
      desenhar();
    }

    function desenhar() {
      ctx.eventos.limpar();
      desenharTabela({
        ctx,
        colunas,
        gruposDePivo,
        temPivo,
        visual,
        indicesVisiveis,
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
          redesenhar();
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
          baixarCsv(montarCsv(colunasVisiveis, indicesVisiveis, modelo, nulo), 'tabela_completa.csv');
        },
      });
    }

    desenhar();
  },
});
