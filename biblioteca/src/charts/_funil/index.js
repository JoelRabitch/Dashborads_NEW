/**
 * _funil — base compartilhada dos gráficos de funil.
 *
 * `funil_variacoes` desenha UM funil em vários estilos; `funil_comparativo`
 * desenha VÁRIOS lado a lado. O que os dois precisam é igual: ler as etapas,
 * calcular as conversões e desenhar um funil dentro de um retângulo. Fica
 * tudo aqui, e cada gráfico cuida só do arranjo.
 *
 * As etapas podem vir de dois jeitos, e a diferença importa:
 *   - **uma linha por etapa** (uma dimensão + uma medida) — o caso comum;
 *   - **uma medida por etapa** (sem dimensão de etapa) — quando o Explore
 *     já traz "visitas, cadastros, compras" como colunas separadas.
 */

import { criarSvgEl, definirTexto } from '../../core/dom.js';
import { coresDaPaleta, textoLegivelSobre } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar, formatarPercentual } from '../../core/format.js';
import { listaDeValores, sanitizarChave } from '../../core/options-kit.js';

export const CSS_FUNIL = `
.fn-area{position:relative;width:100%;height:100%;overflow:hidden;}
.fn-etapa{transition:opacity .15s ease;cursor:default;}
.fn-apagada{opacity:.25;}
.fn-rotulo{pointer-events:none;}
.fn-conversao{pointer-events:none;font-size:.85em;}
.fn-titulo-funil{font-weight:600;}
@media (prefers-reduced-motion: reduce){.fn-etapa{transition:none;}}
`;

export const ESTILOS_DE_FUNIL = [
  { rotulo: 'Funil clássico (trapézios)', valor: 'classico' },
  { rotulo: 'Pirâmide (invertido)', valor: 'piramide' },
  { rotulo: 'Barras centralizadas', valor: 'barrasCentradas' },
  { rotulo: 'Barras alinhadas à esquerda', valor: 'barras' },
  { rotulo: 'Área suave', valor: 'area' },
];

/* ------------------------------------------------------------------ */
/* Opções                                                              */
/* ------------------------------------------------------------------ */

export function opcoesDeFunil({ estiloPadrao = 'classico', secao = 'Funil' } = {}) {
  return {
    estiloDoFunil: {
      type: 'string',
      label: 'Estilo',
      section: secao,
      display: 'select',
      default: estiloPadrao,
      values: listaDeValores(ESTILOS_DE_FUNIL),
    },
    origemDasEtapas: {
      type: 'string',
      label: 'De onde vêm as etapas',
      section: 'Dados',
      display: 'select',
      default: 'auto',
      values: listaDeValores([
        { rotulo: 'Detectar sozinho', valor: 'auto' },
        { rotulo: 'Uma linha por etapa (dimensão)', valor: 'dimensao' },
        { rotulo: 'Uma medida por etapa', valor: 'medidas' },
      ]),
    },
    ordenarEtapas: {
      type: 'string',
      label: 'Ordem das etapas',
      section: 'Dados',
      display: 'select',
      default: 'consulta',
      values: listaDeValores([
        { rotulo: 'Como veio da consulta', valor: 'consulta' },
        { rotulo: 'Do maior para o menor', valor: 'decrescente' },
        { rotulo: 'Do menor para o maior', valor: 'crescente' },
      ]),
    },
    espacoEntreEtapas: {
      type: 'number',
      label: 'Espaço entre as etapas (px)',
      section: secao,
      display: 'range',
      min: 0,
      max: 24,
      step: 1,
      default: 2,
    },
    larguraMinimaDaBase: {
      type: 'number',
      label: 'Largura mínima da última etapa (% da primeira)',
      section: secao,
      display: 'range',
      min: 0,
      max: 90,
      step: 5,
      default: 0,
    },
    mostrarConversao: {
      type: 'string',
      label: 'Taxa de conversão',
      section: 'Rótulos',
      display: 'select',
      default: 'etapaAnterior',
      values: listaDeValores([
        { rotulo: 'Em relação à etapa anterior', valor: 'etapaAnterior' },
        { rotulo: 'Em relação à primeira etapa', valor: 'primeiraEtapa' },
        { rotulo: 'Não mostrar', valor: 'nenhuma' },
      ]),
    },
    mostrarValorNaEtapa: {
      type: 'boolean',
      label: 'Escrever o valor dentro da etapa',
      section: 'Rótulos',
      default: true,
    },
    mostrarNomeDaEtapa: {
      type: 'boolean',
      label: 'Escrever o nome da etapa',
      section: 'Rótulos',
      default: true,
    },
    mostrarPerdaEntreEtapas: {
      type: 'boolean',
      label: 'Mostrar quanto se perdeu entre as etapas',
      section: 'Rótulos',
      default: false,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Leitura dos dados                                                   */
/* ------------------------------------------------------------------ */

/** Decide de onde vêm as etapas quando o usuário deixou em "auto". */
export function detectarOrigemDasEtapas(modelo) {
  if (modelo.dimensoes.length >= 1 && modelo.medidas.length === 1) return 'dimensao';
  if (modelo.medidas.length >= 2 && modelo.dimensoes.length === 0) return 'medidas';
  return modelo.dimensoes.length >= 1 ? 'dimensao' : 'medidas';
}

/**
 * Lê as etapas de um funil.
 *
 * @returns {{etapas:Array<{chave,rotulo,valor,indiceDaLinha}>, medida:object|null,
 *            origem:string, avisos:string[]}}
 */
export function lerEtapas(
  modelo,
  config = {},
  { filtrarLinha = null, campoDaEtapa = null, chaveDoPivo = undefined } = {}
) {
  const avisos = [];
  const origem =
    config.origemDasEtapas && config.origemDasEtapas !== 'auto'
      ? config.origemDasEtapas
      : detectarOrigemDasEtapas(modelo);

  let etapas = [];
  let medida = null;

  if (origem === 'medidas') {
    medida = modelo.medidas[0] || null;
    etapas = modelo.medidas.map((m) => {
      let soma = null;
      for (let i = 0; i < modelo.linhas.length; i++) {
        if (filtrarLinha && !filtrarLinha(modelo.linhas[i], i)) continue;
        const v = modelo.valorNumerico(modelo.linhas[i], m.nome, chaveDoPivo);
        if (v !== null) soma = (soma === null ? 0 : soma) + v;
      }
      return { chave: m.nome, rotulo: m.rotuloCurto, valor: soma, indiceDaLinha: -1, campo: m };
    });
  } else {
    const campo = campoDaEtapa || modelo.dimensoes[0] || null;
    medida = modelo.medidas[0] || null;
    if (!campo || !medida) {
      return { etapas: [], medida, origem, avisos: ['O funil precisa de uma dimensão de etapa e uma medida.'] };
    }
    const porChave = new Map();
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      if (filtrarLinha && !filtrarLinha(linha, i)) continue;
      const bruto = modelo.valorBruto(linha, campo.nome);
      const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
      if (!porChave.has(chave)) {
        porChave.set(chave, {
          chave,
          rotulo: modelo.texto(linha, campo.nome, undefined, '∅'),
          valor: null,
          indiceDaLinha: i,
          campo,
        });
      }
      const v = modelo.valorNumerico(linha, medida.nome, chaveDoPivo);
      if (v !== null) {
        const registro = porChave.get(chave);
        registro.valor = (registro.valor === null ? 0 : registro.valor) + v;
      }
    }
    etapas = Array.from(porChave.values());
  }

  etapas = etapas.filter((e) => e.valor !== null);

  if (config.ordenarEtapas === 'decrescente') etapas.sort((a, b) => b.valor - a.valor);
  else if (config.ordenarEtapas === 'crescente') etapas.sort((a, b) => a.valor - b.valor);

  // Um funil que sobe no meio não é erro de dados nem bug nosso, mas é
  // sinal de que a consulta provavelmente não está na ordem certa.
  if (config.ordenarEtapas === 'consulta') {
    for (let i = 1; i < etapas.length; i++) {
      if (etapas[i].valor > etapas[i - 1].valor) {
        avisos.push(
          `A etapa "${etapas[i].rotulo}" é maior que a anterior. Confira a ordenação no Explore ou use a opção "Ordem das etapas".`
        );
        break;
      }
    }
  }

  return { etapas, medida, origem, avisos };
}

/** Conversões de cada etapa em relação à anterior e à primeira. */
export function calcularConversoes(etapas) {
  return etapas.map((etapa, i) => {
    const anterior = i > 0 ? etapas[i - 1].valor : null;
    const primeira = etapas[0] ? etapas[0].valor : null;
    return {
      ...etapa,
      conversaoDaAnterior: i === 0 || !anterior ? null : etapa.valor / anterior,
      conversaoDaPrimeira: !primeira ? null : etapa.valor / primeira,
      perdaDaAnterior: i === 0 || anterior === null ? null : anterior - etapa.valor,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Desenho                                                             */
/* ------------------------------------------------------------------ */

/**
 * Desenha um funil dentro de um retângulo.
 *
 * @param {object} params
 * @param {Element} params.svg onde desenhar
 * @param {{x:number, y:number, largura:number, altura:number}} params.caixa
 * @param {Array} params.etapas já passadas por `calcularConversoes`
 * @param {Map<string,string>} params.cores
 * @returns {Array<{etapa:object, elemento:Element, centro:{x,y}}>}
 */
export function desenharFunil({
  svg,
  caixa,
  etapas,
  cores,
  config,
  tema,
  formatar,
  aoInteragir,
  maximoDeReferencia = null,
}) {
  if (!etapas.length) return [];

  const estilo = config.estiloDoFunil || 'classico';
  // No estilo "área" as etapas se encostam: o afunilamento tem que ficar
  // contínuo, sem o degrau que o espaço entre etapas cria.
  const espaco = estilo === 'area' ? 0 : Number(config.espacoEntreEtapas) || 0;
  const alturaDaEtapa = Math.max(4, (caixa.altura - espaco * (etapas.length - 1)) / etapas.length);
  // `maximoDeReferencia` é o que permite vários funis compartilharem a
  // mesma escala: sem ele, cada funil se normaliza pelo próprio topo e
  // dois segmentos de tamanhos muito diferentes sairiam iguais.
  const maior = maximoDeReferencia || Math.max(...etapas.map((e) => Math.abs(e.valor)));
  const minimoRelativo = Math.max(0, Math.min(0.9, (Number(config.larguraMinimaDaBase) || 0) / 100));

  // Fração da largura que cada etapa ocupa. A pirâmide é o funil de cabeça
  // para baixo; "barras" não afunila, só compara comprimentos.
  const fracoes = etapas.map((etapa, i) => {
    if (!maior) return 1;
    const bruta = Math.abs(etapa.valor) / maior;
    const comPiso = minimoRelativo + bruta * (1 - minimoRelativo);
    if (estilo === 'piramide') {
      const invertida = Math.abs(etapas[etapas.length - 1 - i].valor) / maior;
      return minimoRelativo + invertida * (1 - minimoRelativo);
    }
    return comPiso;
  });

  const saida = [];

  etapas.forEach((etapa, i) => {
    const y = caixa.y + i * (alturaDaEtapa + espaco);
    const larguraAtual = caixa.largura * fracoes[i];
    const larguraProxima = caixa.largura * (fracoes[i + 1] === undefined ? fracoes[i] : fracoes[i + 1]);

    let elemento;
    let centroX;

    if (estilo === 'barras') {
      centroX = caixa.x + larguraAtual / 2;
      elemento = criarSvgEl('rect', {
        pai: svg,
        classe: 'fn-etapa',
        atributos: { x: caixa.x, y, width: Math.max(1, larguraAtual), height: alturaDaEtapa, rx: 2 },
      });
    } else if (estilo === 'barrasCentradas') {
      centroX = caixa.x + caixa.largura / 2;
      elemento = criarSvgEl('rect', {
        pai: svg,
        classe: 'fn-etapa',
        atributos: {
          x: centroX - larguraAtual / 2,
          y,
          width: Math.max(1, larguraAtual),
          height: alturaDaEtapa,
          rx: 2,
        },
      });
    } else {
      // Trapézio: a base de baixo acompanha a largura da PRÓXIMA etapa, que
      // é o que dá o afunilamento contínuo em vez de degraus.
      centroX = caixa.x + caixa.largura / 2;
      const meioAtual = larguraAtual / 2;
      const meioProxima = larguraProxima / 2;
      const pontos = [
        [centroX - meioAtual, y],
        [centroX + meioAtual, y],
        [centroX + meioProxima, y + alturaDaEtapa],
        [centroX - meioProxima, y + alturaDaEtapa],
      ];
      elemento = criarSvgEl('path', {
        pai: svg,
        classe: 'fn-etapa',
        atributos: { d: `M${pontos.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}Z` },
      });
    }

    const cor = cores.get(etapa.chave) || tema.destaque;
    elemento.setAttribute('fill', cor);
    elemento.setAttribute('stroke', estilo === 'area' ? 'none' : tema.fundo);
    elemento.setAttribute('stroke-width', estilo === 'area' ? 0 : 1);

    const centro = { x: centroX, y: y + alturaDaEtapa / 2 };
    saida.push({ etapa, elemento, centro, largura: larguraAtual, altura: alturaDaEtapa, cor });

    // ----- Textos -----
    const tamanho = Math.min(Number(config.tamanhoDoRotulo) || tema.tamanhoBase, Math.max(8, alturaDaEtapa - 6));
    const corDoTexto = config.corDoRotulo || textoLegivelSobre(cor, tema);

    if (config.mostrarValorNaEtapa !== false && alturaDaEtapa >= 12) {
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'fn-rotulo',
        atributos: {
          x: centro.x,
          y: centro.y,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': tamanho,
          fill: corDoTexto,
        },
      });
      definirTexto(texto, formatar(etapa.valor));
    }

    if (config.mostrarNomeDaEtapa !== false) {
      // O nome vai FORA do funil, à esquerda: dentro ele brigaria com o
      // valor justamente nas etapas mais estreitas, que são as de baixo.
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'fn-rotulo',
        atributos: {
          x: caixa.x - 6,
          y: centro.y,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          'font-size': Math.max(8, tema.tamanhoBase - 1),
          fill: tema.texto,
        },
      });
      definirTexto(texto, truncar(etapa.rotulo, Number(config.truncarRotulo) || 18));
    }

    const modoDeConversao = config.mostrarConversao || 'etapaAnterior';
    if (modoDeConversao !== 'nenhuma' && i > 0) {
      const fracao =
        modoDeConversao === 'primeiraEtapa' ? etapa.conversaoDaPrimeira : etapa.conversaoDaAnterior;
      if (fracao !== null) {
        const partes = [formatarPercentual(fracao, 1)];
        if (config.mostrarPerdaEntreEtapas && etapa.perdaDaAnterior !== null) {
          partes.push(`−${formatar(etapa.perdaDaAnterior)}`);
        }
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'fn-conversao',
          atributos: {
            x: caixa.x + caixa.largura + 6,
            y: centro.y,
            'text-anchor': 'start',
            'dominant-baseline': 'central',
            'font-size': Math.max(8, tema.tamanhoBase - 1),
            fill: tema.textoSuave,
          },
        });
        definirTexto(texto, partes.join('  '));
      }
    }

    if (typeof aoInteragir === 'function') aoInteragir(elemento, etapa, cor);
  });

  return saida;
}

/** Cores por etapa: respeita a escolha do painel, senão usa a paleta. */
export function resolverCoresDasEtapas(etapas, config, tema) {
  const paleta = coresDaPaleta(config.paleta);
  const saida = new Map();
  etapas.forEach((etapa, i) => {
    const escolhida = config[`cor_${sanitizarChave(etapa.chave)}`];
    saida.set(etapa.chave, escolhida || paleta[i % paleta.length] || tema.destaque);
  });
  return saida;
}

/** Formatador padrão do valor das etapas. */
export function formatadorDoFunil(medida, config) {
  return formatadorDeValueFormat(medida && medida.valueFormat, {
    casas: Number(config.casasDecimaisDoRotulo) || 0,
  });
}

/** Título acima de um funil (usado pelo comparativo). */
export function desenharTituloDoFunil({ svg, caixa, texto, tema }) {
  const el = criarSvgEl('text', {
    pai: svg,
    classe: 'fn-titulo-funil',
    atributos: {
      x: caixa.x + caixa.largura / 2,
      y: caixa.y - 8,
      'text-anchor': 'middle',
      'font-size': Math.max(9, tema.tamanhoBase),
      fill: tema.texto,
    },
  });
  definirTexto(el, texto);
  return el;
}
