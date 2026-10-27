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
 *
 * Correções v2 (módulos 6.1–6.3):
 *   - o valor escrito na barra é um RÓTULO de dado e passa pela função
 *     única de rótulos (`core/rotulos.js`): "Mostrar rótulos", tamanho,
 *     cor, negrito, rotação, posição (dentro/fora/centro/auto), conteúdo,
 *     formato, casas e truncar agora têm efeito. Antes o valor era escrito
 *     sempre, com estilo fixo;
 *   - a cor vem de `paletaDoConfig` (respeita "Inverter ordem das
 *     cores"), com opacidade e contorno do painel; as linhas de grade
 *     verticais (opção nova `mostrarGrade`) usam a "Cor das linhas de
 *     grade" do tema e a barra de topo usa a "Cor das bordas";
 *   - tooltip ÚNICO do gráfico (`ctx.tooltip()`), com o valor no texto do
 *     Looker; o clique segue a "Ação do clique" (`ctx.cliqueNoItem`).
 *
 * Campos: 1 dimensão (o nome) + 1 medida (a barra); com mais de uma, o
 * painel ganha "Dimensão do nome" e "Medida da barra".
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { comOpacidade, textoLegivelSobre } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { paletaDoConfig, lerContorno, aplicarContorno, aplicarPreenchimento } from '../../core/cores.js';
import { lerRotulos, textoDoRotulo, posicaoEfetiva, larguraDoTexto } from '../../core/rotulos.js';
import {
  CSS_LISTA_VIRTUAL,
  criarListaVirtual,
  itemDoEvento,
  desenharGuias,
  criarRotuloHtml,
  celulaComLinks,
} from '../_lista_virtual/index.js';
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
.br-posicao{flex:0 0 auto;text-align:right;font-variant-numeric:tabular-nums;opacity:.6;}
.br-nome{flex:0 0 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.br-trilho{flex:1 1 auto;position:relative;height:100%;min-width:20px;}
.br-barra{position:absolute;top:50%;transform:translateY(-50%);border-radius:2px;}
.br-valor{position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap;font-variant-numeric:tabular-nums;}
.br-zero{position:absolute;top:0;bottom:0;width:1px;}
`;

/** Acima disso nem a virtualização salva: a ordenação sozinha já pesa. */
const MAXIMO_DE_BARRAS = 50000;

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
        // Novo (correções v2): guias verticais na cor da grade do tema.
        mostrarGrade: {
          type: 'boolean',
          label: 'Linhas de grade verticais',
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
        // O texto do Looker (textForCell): é o que o tooltip e o rótulo em
        // formato "automático" mostram — nunca o número cru.
        texto: modelo.texto(modelo.linhas[i], medida.nome, undefined, ''),
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
    injetarEstilo(raiz, CSS_LISTA_VIRTUAL + CSS, 'br');

    // Rótulos: lidos a cada desenho (o config chega normalizado).
    const rot = lerRotulos(config, tema);
    // Números DERIVADOS (referência, diferença) usam o value_format do campo.
    const formatar = formatadorDeValueFormat(medida.valueFormat, { casas: rot.casas });
    const total = valores.reduce((a, b) => a + b, 0);

    const alturaDaLinha = Math.max(12, Number(config.alturaDaLinha) || 22);
    const larguraDoNome = Math.max(40, Number(config.larguraDoNome) || 160);
    const cor = paletaDoConfig(config)[0];
    const corDeDestaque = tema.destaque;
    const topN = Math.max(0, Number(config.destacarTop) || 0);
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });
    // Largura estimada do trilho (o jsdom e o primeiro desenho não medem):
    // serve só para decidir se o rótulo cabe dentro da barra.
    const larguraDoTrilho = Math.max(60, ctx.largura - larguraDoNome - 60);

    const tooltip = ctx.tooltip();

    const lista = criarListaVirtual({
      ctx,
      itens,
      alturaDaLinha,
      comBusca: config.mostrarBusca !== false,
      rotuloDaBusca: `Buscar em ${campoDoNome.rotuloCurto}…`,
      textoDoItem: (item) => item.nome,
      montarLinha: (item) =>
        montarLinha({
          item,
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
          rot,
          total,
          contorno,
          larguraDoTrilho,
          valueFormat: medida.valueFormat,
        }),
    });

    // Nomes próprios ao lado dos da base: dois gráficos virtualizados numa
    // mesma tela não podem disputar as mesmas classes.
    lista.raiz.classList.add('br-raiz');
    lista.topo.classList.add('br-topo');
    lista.rolagem.classList.add('br-rolagem');
    lista.conteudo.classList.add('br-conteudo');
    lista.contagem.classList.add('br-contagem');
    lista.nota.classList.add('br-nota');
    const campoDeBusca = lista.topo.querySelector('.lv-busca');
    if (campoDeBusca) campoDeBusca.classList.add('br-busca');

    definirTexto(
      lista.nota,
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

    // ---------- Interação ----------
    // Conteúdo do tooltip: o valor é o texto do Looker (item.texto); só os
    // números derivados passam pelo value_format do campo.
    const conteudoDe = (item) => {
      const percentual = total ? `${((item.valor / total) * 100).toFixed(1)}%` : '';
      const valor = item.texto || formatar(item.valor);
      return {
        titulo: item.nome,
        linhas: [
          { rotulo: 'Posição no ranking', valor: `${item.posicao} de ${itens.length}` },
          { rotulo: medida.rotuloCurto, valor, cor },
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
        variaveis: { categoria: item.nome, valor, serie: medida.rotuloCurto, percentual },
      };
    };

    if (tooltip) {
      ctx.eventos.on(lista.conteudo, 'pointermove', (ev) => {
        const item = itemDoEvento(ev, itens);
        if (!item) {
          tooltip.esconder();
          return;
        }
        tooltip.mostrar(conteudoDe(item), ev.clientX, ev.clientY);
      });
      ctx.eventos.on(lista.conteudo, 'pointerleave', () => tooltip.esconder());
    }

    // Clique: "Ação do clique" do painel (drill / fixar / nada). A célula
    // do drill é a do nome; se ela não tiver links, a da medida.
    ctx.eventos.on(lista.conteudo, 'click', (ev) => {
      const item = itemDoEvento(ev, itens);
      if (!item) return;
      const linha = modelo.linhas[item.indiceDaLinha];
      ctx.cliqueNoItem(ev, celulaComLinks(modelo, linha, [campoDoNome.nome, medida.nome]), conteudoDe(item));
    });
  },
  // Sem aoDestruir: o tooltip é o único do gráfico e o defineViz o remove.
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
  item, alturaDaLinha, larguraDoNome, maximo, minimo, temNegativos,
  referencia, topN, cor, corDeDestaque, tema, config, rot, total, contorno,
  larguraDoTrilho, valueFormat,
}) {
  const linha = document.createElement('div');
  linha.className = 'br-linha';
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

  if (config.mostrarGrade !== false) desenharGuias(trilho, [0.25, 0.5, 0.75], tema, 'br-guia');

  const barra = document.createElement('div');
  barra.className = 'br-barra';
  barra.style.left = `${geometria.inicio * 100}%`;
  barra.style.width = `${geometria.largura * 100}%`;
  barra.style.height = `${Math.max(3, alturaDaLinha - 7)}px`;
  aplicarPreenchimento(barra, corDaBarra, config);
  aplicarContorno(barra, contorno);
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

  // Rótulo do valor (função única de rótulos). Em "auto", entra DENTRO da
  // barra quando cabe e fora quando não cabe — e, dentro, com a cor que é
  // legível sobre a barra, não com a do tema.
  if (rot.mostrar) {
    const texto = textoDoRotulo(rot, {
      valor: item.valor,
      nome: item.nome,
      total,
      valueFormat,
      textoDoValor: item.texto,
    });
    const cabeDentro = larguraDoTexto(texto, rot.tamanho) + 8 < geometria.largura * larguraDoTrilho;
    const posicao = posicaoEfetiva(rot, { cabeDentro });
    // A "ponta" da barra: à direita para positivos, à esquerda para negativos.
    const ponta = geometria.paraDireita ? geometria.inicio + geometria.largura : geometria.inicio;
    const paraDentro = geometria.paraDireita ? 'translate(calc(-100% - 4px), -50%)' : 'translate(4px, -50%)';
    const paraFora = geometria.paraDireita ? 'translate(4px, -50%)' : 'translate(calc(-100% - 4px), -50%)';
    let esquerda = ponta;
    let deslocamento = posicao === 'dentro' ? paraDentro : paraFora;
    if (posicao === 'centro') {
      esquerda = geometria.inicio + geometria.largura / 2;
      deslocamento = 'translate(-50%, -50%)';
    }
    const valorEl = criarRotuloHtml(trilho, rot, {
      texto,
      classe: 'br-valor',
      transformBase: deslocamento,
      posicao,
      corAutomatica: posicao === 'fora' ? tema.textoSuave : textoLegivelSobre(corDaBarra, tema),
    });
    if (valorEl) valorEl.style.left = `${esquerda * 100}%`;
  }

  return linha;
}
