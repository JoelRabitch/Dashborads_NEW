/**
 * barras_ranking_denso — "Barras de Ranking Denso".
 *
 * O "top N" quando o N é grande demais para caber: milhares de barras
 * ordenadas, com rolagem virtualizada — só as visíveis existem no DOM.
 *
 * Duas regras não são opcionais aqui:
 *
 * 1. **A barra começa em ZERO.** Num ranking, barra truncada inverte a
 *    percepção de proporção: com a base em 900, 1.000 parece o dobro de
 *    950. Não existe opção para isso. Quando há valores negativos, a
 *    escala passa a ter o zero no meio e as barras crescem para os dois
 *    lados — mas sempre a partir do zero.
 * 2. **A posição no ranking sobrevive ao filtro.** Quem busca "Produto X"
 *    quer saber que ele é o 437º, não que é o 1º da lista filtrada.
 *    Renumerar os resultados da busca seria a mentira deste gráfico, e é
 *    o comportamento padrão da maioria das tabelas.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, definirTexto, injetarEstilo, limpar } from '../../core/dom.js';
import { coresDaPaleta, comOpacidade, textoLegivelSobre } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarFiltroDeBusca } from '../../core/interaction.js';
import { criarTooltip } from '../../core/tooltip.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.br-raiz{position:relative;width:100%;height:100%;display:flex;flex-direction:column;}
.br-topo{display:flex;align-items:center;gap:8px;padding:4px 8px;flex:0 0 auto;}
.br-busca{flex:1 1 auto;min-width:60px;border-radius:4px;padding:3px 7px;font:inherit;}
.br-contagem{font-size:11px;opacity:.75;white-space:nowrap;}
.br-rolagem{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;position:relative;}
.br-conteudo{position:relative;width:100%;}
.br-linha{position:absolute;left:0;right:0;display:flex;align-items:center;gap:6px;padding:0 8px;box-sizing:border-box;}
.br-posicao{flex:0 0 auto;text-align:right;font-variant-numeric:tabular-nums;opacity:.6;}
.br-nome{flex:0 0 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.br-trilho{flex:1 1 auto;position:relative;height:100%;min-width:20px;}
.br-barra{position:absolute;top:50%;transform:translateY(-50%);border-radius:2px;}
.br-valor{position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap;font-variant-numeric:tabular-nums;}
.br-zero{position:absolute;top:0;bottom:0;width:1px;}
.br-nota{flex:0 0 auto;padding:2px 8px 4px;font-size:10px;opacity:.75;}
`;

/** Acima disso nem a virtualização salva: a ordenação sozinha já pesa. */
const MAXIMO_DE_BARRAS = 50000;

/** Linhas extras desenhadas acima e abaixo da janela, para a rolagem não piscar. */
const MARGEM_DA_JANELA = 8;

export default defineViz({
  id: 'barras_ranking_denso',
  label: 'Barras de Ranking Denso',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        ordem: {
          type: 'string',
          label: 'Ordem',
          section: 'Ranking',
          display: 'select',
          default: 'desc',
          values: listaDeValores([
            { rotulo: 'Maior primeiro', valor: 'desc' },
            { rotulo: 'Menor primeiro', valor: 'asc' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
          ]),
        },
        alturaDaLinha: {
          type: 'number',
          label: 'Altura de cada barra (px)',
          section: 'Ranking',
          display: 'range',
          min: 12,
          max: 48,
          step: 1,
          default: 22,
        },
        destacarTop: {
          type: 'number',
          label: 'Destacar as N primeiras (0 = nenhuma)',
          section: 'Ranking',
          display: 'number',
          default: 3,
        },
        referencia: {
          type: 'string',
          label: 'Linha de referência',
          section: 'Ranking',
          display: 'select',
          default: 'nenhuma',
          values: listaDeValores([
            { rotulo: 'Nenhuma', valor: 'nenhuma' },
            { rotulo: 'Média', valor: 'media' },
            { rotulo: 'Mediana', valor: 'mediana' },
            { rotulo: 'Valor fixo', valor: 'fixo' },
          ]),
        },
        valorDaReferencia: {
          type: 'number',
          label: 'Valor fixo da referência',
          section: 'Ranking',
          display: 'number',
          default: 0,
        },
        mostrarBusca: {
          type: 'boolean',
          label: 'Campo de busca por nome',
          section: 'Ranking',
          default: true,
        },
        larguraDoNome: {
          type: 'number',
          label: 'Largura da coluna de nomes (px)',
          section: 'Formato',
          display: 'range',
          min: 60,
          max: 400,
          step: 10,
          default: 160,
        },
        mostrarPosicao: {
          type: 'boolean',
          label: 'Mostrar a posição no ranking',
          section: 'Formato',
          default: true,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoNome', 'Dimensão do nome', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoValor', 'Medida da barra', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz } = ctx;

    const medida =
      modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    const campoDoNome =
      modelo.dimensoes.find((d) => d.nome === config.campoDoNome) || modelo.dimensoes[0] || null;

    if (!medida || !campoDoNome) {
      ctx.mostrarVazio('Este ranking precisa de uma dimensão (o nome) e uma medida (a barra).');
      return;
    }

    if (modelo.linhas.length > MAXIMO_DE_BARRAS) {
      ctx.mostrarVazio(
        `A consulta tem ${modelo.linhas.length.toLocaleString('pt-BR')} linhas, acima do limite de ` +
          `${MAXIMO_DE_BARRAS.toLocaleString('pt-BR')}. Mesmo com rolagem virtualizada, ordenar e ` +
          'manter tudo em memória fica lento. Filtre ou agrupe no Explore.'
      );
      return;
    }

    // ---------- Itens ----------
    const itens = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const valor = modelo.valorNumerico(modelo.linhas[i], medida.nome);
      if (valor === null) continue;
      itens.push({
        indiceDaLinha: i,
        nome: modelo.texto(modelo.linhas[i], campoDoNome.nome, undefined, '∅'),
        valor,
      });
    }

    if (!itens.length) {
      ctx.mostrarVazio('Nenhuma linha tem valor numérico na medida escolhida.');
      return;
    }
    const semValor = modelo.linhas.length - itens.length;
    if (semValor > 0) ctx.avisar(`${semValor} linha(s) sem valor na medida ficaram de fora.`);

    ordenarItens(itens, config.ordem);
    // A posição é atribuída DEPOIS de ordenar e nunca mais muda: é ela que
    // o filtro precisa preservar.
    itens.forEach((item, i) => {
      item.posicao = i + 1;
    });

    const valores = itens.map((i) => i.valor);
    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);
    const temNegativos = minimo < 0;
    const referencia = calcularReferencia(valores, config);

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'br');
    const caixa = criarEl('div', { classe: 'br-raiz', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const alturaDaLinha = Math.max(12, Number(config.alturaDaLinha) || 22);
    const larguraDoNome = Math.max(40, Number(config.larguraDoNome) || 160);
    const cor = coresDaPaleta(config.paleta)[0];
    const corDeDestaque = tema.destaque;
    const topN = Math.max(0, Number(config.destacarTop) || 0);

    // --- Topo: busca e contagem ---
    const topo = criarEl('div', { classe: 'br-topo', pai: caixa });
    let campoDeBusca = null;
    if (config.mostrarBusca !== false) {
      campoDeBusca = criarEl('input', { classe: 'br-busca', pai: topo });
      campoDeBusca.type = 'search';
      campoDeBusca.placeholder = `Buscar em ${campoDoNome.rotuloCurto}…`;
      campoDeBusca.style.background = tema.fundo;
      campoDeBusca.style.color = tema.texto;
      campoDeBusca.style.border = `1px solid ${tema.borda}`;
      if (ctx.estado.busca) campoDeBusca.value = ctx.estado.busca;
    }
    const contagem = criarEl('div', { classe: 'br-contagem', pai: topo });
    contagem.style.color = tema.textoSuave;

    // --- Rolagem e conteúdo ---
    const rolagem = criarEl('div', { classe: 'br-rolagem', pai: caixa });
    const conteudo = criarEl('div', { classe: 'br-conteudo', pai: rolagem });

    // --- Nota ---
    const nota = criarEl('div', { classe: 'br-nota', pai: caixa });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${itens.length.toLocaleString('pt-BR')} itens`,
        'barras a partir do ZERO (sempre)',
        temNegativos ? 'zero no meio: há valores negativos' : null,
        referencia !== null ? `referência em ${formatar(referencia)}` : null,
        'a posição no ranking não muda com a busca',
      ]
        .filter(Boolean)
        .join(' · ')
    );

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    // ---------- Virtualização ----------
    let visiveis = itens;

    const aplicarFiltro = () => {
      const termo = campoDeBusca ? campoDeBusca.value : '';
      ctx.estado.busca = termo;
      if (!termo || !termo.trim()) {
        visiveis = itens;
      } else {
        const combina = criarFiltroDeBusca(termo);
        visiveis = itens.filter((item) => combina(item.nome));
      }
      conteudo.style.height = `${visiveis.length * alturaDaLinha}px`;
      definirTexto(
        contagem,
        visiveis.length === itens.length
          ? `${itens.length.toLocaleString('pt-BR')} itens`
          : `${visiveis.length.toLocaleString('pt-BR')} de ${itens.length.toLocaleString('pt-BR')}`
      );
      pintar();
    };

    const pintar = () => {
      limpar(conteudo);
      const alturaUtil = rolagem.clientHeight || 300;
      const topo0 = rolagem.scrollTop || 0;
      const inicio = Math.max(0, Math.floor(topo0 / alturaDaLinha) - MARGEM_DA_JANELA);
      const fim = Math.min(
        visiveis.length,
        inicio + Math.ceil(alturaUtil / alturaDaLinha) + MARGEM_DA_JANELA * 2
      );

      if (!visiveis.length) {
        const vazio = criarEl('div', { classe: 'br-linha', pai: conteudo });
        vazio.style.top = '0px';
        vazio.style.height = `${alturaDaLinha}px`;
        vazio.style.color = tema.textoSuave;
        definirTexto(vazio, 'Nenhum item encontrado para a busca.');
        return;
      }

      for (let i = inicio; i < fim; i++) {
        conteudo.appendChild(
          montarLinha({
            item: visiveis[i],
            indiceNaJanela: i,
            alturaDaLinha,
            larguraDoNome,
            maximo,
            minimo,
            temNegativos,
            referencia,
            topN,
            cor,
            corDeDestaque,
            tema,
            config,
            formatar,
          })
        );
      }
    };

    ctx.eventos.on(rolagem, 'scroll', () => {
      ctx.estado.rolagem = rolagem.scrollTop;
      pintar();
    });

    if (campoDeBusca) {
      ctx.eventos.on(campoDeBusca, 'input', () => {
        rolagem.scrollTop = 0;
        aplicarFiltro();
      });
    }

    if (tooltip) {
      ctx.eventos.on(conteudo, 'pointermove', (ev) => {
        const linha = ev.target.closest ? ev.target.closest('.br-linha') : null;
        const posicao = linha && linha.dataset ? Number(linha.dataset.posicao) : NaN;
        const item = itens[posicao - 1];
        if (!item) {
          tooltip.esconder();
          return;
        }
        tooltip.mostrar(
          {
            titulo: item.nome,
            linhas: [
              { rotulo: 'Posição no ranking', valor: `${item.posicao} de ${itens.length}` },
              { rotulo: medida.rotuloCurto, valor: formatar(item.valor), cor },
              { rotulo: 'Do maior', valor: `${((item.valor / (maximo || 1)) * 100).toFixed(1)}%` },
              ...(referencia !== null
                ? [
                    {
                      rotulo: 'Contra a referência',
                      valor: `${item.valor >= referencia ? '+' : ''}${formatar(item.valor - referencia)}`,
                    },
                  ]
                : []),
            ],
          },
          ev.clientX,
          ev.clientY
        );
      });
      ctx.eventos.on(conteudo, 'pointerleave', () => tooltip.esconder());
    }

    ctx.eventos.on(conteudo, 'click', (ev) => {
      const linha = ev.target.closest ? ev.target.closest('.br-linha') : null;
      const posicao = linha && linha.dataset ? Number(linha.dataset.posicao) : NaN;
      const item = itens[posicao - 1];
      if (!item) return;
      const celula = modelo.celula(modelo.linhas[item.indiceDaLinha], campoDoNome.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });

    aplicarFiltro();
    if (ctx.estado.rolagem) rolagem.scrollTop = ctx.estado.rolagem;
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

export function ordenarItens(itens, ordem = 'desc') {
  if (ordem === 'asc') itens.sort((a, b) => a.valor - b.valor);
  else if (ordem !== 'consulta') itens.sort((a, b) => b.valor - a.valor);
  return itens;
}

function calcularReferencia(valores, config) {
  const modo = config.referencia || 'nenhuma';
  if (modo === 'nenhuma') return null;
  if (modo === 'fixo') {
    const v = Number(config.valorDaReferencia);
    return Number.isFinite(v) ? v : 0;
  }
  if (modo === 'media') return valores.reduce((a, b) => a + b, 0) / valores.length;
  const ordenados = valores.slice().sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

/**
 * Geometria da barra, SEMPRE a partir do zero.
 *
 * Devolve fração da largura do trilho: `inicio` é onde a barra começa e
 * `largura` quanto ela ocupa. Sem negativos, o zero está na borda
 * esquerda; com negativos, ele fica na posição proporcional e as barras
 * crescem para os dois lados a partir dali.
 *
 * Truncar a base (começar em 900 para valores entre 900 e 1.000) faria
 * 1.000 parecer o dobro de 950. Por isso não há opção para isso.
 */
export function geometriaDaBarra({ valor, maximo, minimo }) {
  const alto = Math.max(0, maximo);
  const baixo = Math.min(0, minimo);
  const extensao = alto - baixo || 1;

  const posicaoDoZero = (0 - baixo) / extensao;
  const posicaoDoValor = (valor - baixo) / extensao;

  return {
    posicaoDoZero,
    inicio: Math.min(posicaoDoZero, posicaoDoValor),
    largura: Math.abs(posicaoDoValor - posicaoDoZero),
    paraDireita: valor >= 0,
  };
}

function montarLinha({
  item, indiceNaJanela, alturaDaLinha, larguraDoNome, maximo, minimo, temNegativos,
  referencia, topN, cor, corDeDestaque, tema, config, formatar,
}) {
  const linha = document.createElement('div');
  linha.className = 'br-linha';
  linha.style.top = `${indiceNaJanela * alturaDaLinha}px`;
  linha.style.height = `${alturaDaLinha}px`;
  linha.style.fontSize = `${Math.max(9, Math.min(tema.tamanhoBase, alturaDaLinha - 8))}px`;
  linha.dataset.posicao = String(item.posicao);

  const destacado = topN > 0 && item.posicao <= topN;
  const corDaBarra = destacado ? corDeDestaque : cor;

  if (config.mostrarPosicao !== false) {
    const posicao = document.createElement('div');
    posicao.className = 'br-posicao';
    posicao.style.width = `${String(maximo).length + 28}px`;
    posicao.style.color = destacado ? corDeDestaque : tema.textoSuave;
    posicao.textContent = String(item.posicao);
    linha.appendChild(posicao);
  }

  const nome = document.createElement('div');
  nome.className = 'br-nome';
  nome.style.width = `${larguraDoNome}px`;
  nome.style.color = tema.texto;
  nome.title = item.nome;
  nome.textContent = truncar(item.nome, Math.max(6, Math.floor(larguraDoNome / 7)));
  linha.appendChild(nome);

  const trilho = document.createElement('div');
  trilho.className = 'br-trilho';
  linha.appendChild(trilho);

  const geometria = geometriaDaBarra({ valor: item.valor, maximo, minimo });

  const barra = document.createElement('div');
  barra.className = 'br-barra';
  barra.style.left = `${geometria.inicio * 100}%`;
  barra.style.width = `${geometria.largura * 100}%`;
  barra.style.height = `${Math.max(3, alturaDaLinha - 7)}px`;
  barra.style.background = corDaBarra;
  trilho.appendChild(barra);

  if (temNegativos) {
    const zero = document.createElement('div');
    zero.className = 'br-zero';
    zero.style.left = `${geometria.posicaoDoZero * 100}%`;
    zero.style.background = comOpacidade(tema.texto, 0.35);
    trilho.appendChild(zero);
  }

  if (referencia !== null) {
    const posicaoDaReferencia = geometriaDaBarra({ valor: referencia, maximo, minimo });
    const marca = document.createElement('div');
    marca.className = 'br-zero';
    marca.style.left = `${(posicaoDaReferencia.inicio + posicaoDaReferencia.largura) * 100}%`;
    marca.style.background = comOpacidade(tema.atencao, 0.7);
    trilho.appendChild(marca);
  }

  // O rótulo entra DENTRO da barra quando cabe e fora quando não cabe —
  // e, dentro, com a cor que é legível sobre a barra, não com a do tema.
  const texto = formatar(item.valor);
  const cabeDentro = geometria.largura > 0.18 && texto.length * 7 < geometria.largura * 400;
  const valorEl = document.createElement('div');
  valorEl.className = 'br-valor';
  valorEl.textContent = texto;
  if (cabeDentro) {
    valorEl.style.left = `${(geometria.inicio + geometria.largura) * 100}%`;
    valorEl.style.transform = 'translate(calc(-100% - 4px), -50%)';
    valorEl.style.color = textoLegivelSobre(corDaBarra, tema);
  } else {
    valorEl.style.left = `${(geometria.inicio + geometria.largura) * 100}%`;
    valorEl.style.transform = 'translate(4px, -50%)';
    valorEl.style.color = tema.textoSuave;
  }
  trilho.appendChild(valorEl);

  return linha;
}
