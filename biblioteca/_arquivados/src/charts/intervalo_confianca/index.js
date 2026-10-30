/**
 * intervalo_confianca — "Intervalo de Confiança".
 *
 * Estimativa por categoria com a barra de erro em volta. Responde "essa
 * diferença é real ou cabe no erro?" — a pergunta que um gráfico de barras
 * comum não deixa nem fazer.
 *
 * **A armadilha central, e é grande:** intervalos de 95% que se TOCAM não
 * significam "diferença não significativa". Dois intervalos de 95% podem
 * se sobrepor bastante e a diferença ainda ser significativa a 5%, porque
 * o erro-padrão da DIFERENÇA é √(EP₁² + EP₂²), menor que a soma dos dois.
 * Quem lê sobreposição como "igual" erra para o lado conservador o tempo
 * todo e deixa de ver efeitos reais.
 *
 * Por isso existe o modo **intervalos de comparação** (~83,4%): são
 * construídos justamente para que a sobreposição corresponda ao teste. Eles
 * NÃO são intervalos de confiança da estimativa — e o gráfico diz isso em
 * voz alta, porque trocar um pelo outro é trocar uma conclusão por outra.
 *
 * O intervalo precisa de n, e a consulta quase nunca traz n. São três
 * caminhos, e eles não significam a mesma coisa — então o usado fica
 * escrito na tela.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica, escalaDeBanda } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { quantilT } from '../../core/estatistica.js';
import { prepararDistribuicoes, opcoesDeDistribuicao } from '../_distribuicao/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeCores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.ic-area{position:relative;width:100%;height:100%;}
.ic-svg{position:absolute;left:0;top:0;}
.ic-marca{pointer-events:none;}
.ic-estimativa{pointer-events:none;}
.ic-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/**
 * Nível dos "intervalos de comparação".
 *
 * Para duas estimativas independentes com erros-padrão parecidos, barras
 * de ~83,4% têm a propriedade que todo mundo atribui erradamente às de
 * 95%: elas se tocam exatamente quando a diferença NÃO é significativa a
 * 5%. O número vem de 1/√2 × 1,96 ≈ 1,386, que é o z de 83,4%.
 */
export const NIVEL_DE_COMPARACAO = 83.4;

/** Abaixo disto o t de Student é largo e o intervalo pouco informativo. */
export const MINIMO_POR_CATEGORIA = 5;

export default defineViz({
  id: 'intervalo_confianca',
  label: 'Intervalo de Confiança',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeDistribuicao({ secao: 'Dados', maximoPadrao: 25 }),
      {
        tipoDeBarra: {
          type: 'string',
          label: 'O que a barra representa',
          section: 'Intervalo',
          display: 'select',
          default: 'confianca',
          values: listaDeValores([
            { rotulo: 'Intervalo de confiança da estimativa', valor: 'confianca' },
            { rotulo: 'Intervalo de COMPARAÇÃO (~83,4%): sobreposição = teste', valor: 'comparacao' },
            { rotulo: 'Erro-padrão (±1 EP)', valor: 'erroPadrao' },
          ]),
        },
        nivelDeConfianca: {
          type: 'number',
          label: 'Nível de confiança (%)',
          section: 'Intervalo',
          display: 'range',
          min: 80,
          max: 99,
          step: 1,
          default: 95,
        },
        orientacao: {
          type: 'string',
          label: 'Direção',
          section: 'Intervalo',
          display: 'select',
          default: 'horizontal',
          values: listaDeValores([
            { rotulo: 'Categorias no eixo Y (barras horizontais)', valor: 'horizontal' },
            { rotulo: 'Categorias no eixo X (barras verticais)', valor: 'vertical' },
          ]),
        },
        ordenarPorEstimativa: {
          type: 'string',
          label: 'Ordenar por',
          section: 'Intervalo',
          display: 'select',
          default: 'estimativaDesc',
          values: listaDeValores([
            { rotulo: 'Estimativa (maior primeiro)', valor: 'estimativaDesc' },
            { rotulo: 'Estimativa (menor primeiro)', valor: 'estimativaAsc' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
          ]),
        },
        referencia: {
          type: 'string',
          label: 'Linha de referência',
          section: 'Intervalo',
          display: 'select',
          default: 'media',
          values: listaDeValores([
            { rotulo: 'Média geral das estimativas', valor: 'media' },
            { rotulo: 'Zero', valor: 'zero' },
            { rotulo: 'Valor fixo', valor: 'fixo' },
            { rotulo: 'Nenhuma', valor: 'nenhuma' },
          ]),
        },
        valorDaReferencia: {
          type: 'number',
          label: 'Valor fixo da referência',
          section: 'Intervalo',
          display: 'number',
          default: 0,
        },
        destacarQuemCruza: {
          type: 'boolean',
          label: 'Destacar quem NÃO cruza a referência',
          section: 'Intervalo',
          default: true,
        },
        tamanhoDoPonto: {
          type: 'number',
          label: 'Tamanho do ponto da estimativa',
          section: 'Formato',
          display: 'range',
          min: 2,
          max: 14,
          step: 0.5,
          default: 6,
        },
        espessuraDaBarra: {
          type: 'number',
          label: 'Espessura da barra de erro',
          section: 'Formato',
          display: 'range',
          min: 1,
          max: 6,
          step: 0.5,
          default: 2,
        },
      }
    ),
    { gradeEixoX: true, gradeEixoY: false }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const saida = {};

    if (dimensoes.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaCategoria', 'Dimensão das categorias', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (medidas.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDosValores', 'Medida da estimativa', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoLimiteInferior', 'Medida do limite inferior (já calculado)', medidas, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: '',
        }),
        opcaoDeEscolhaDeCampo('campoDoLimiteSuperior', 'Medida do limite superior (já calculado)', medidas, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: '',
        }),
        opcaoDeEscolhaDeCampo('campoDaContagem', 'Medida com o n de cada categoria', medidas, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: '',
        }),
        opcaoDeEscolhaDeCampo('campoDoDesvio', 'Medida com o desvio-padrão', medidas, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: '',
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { config, tema, raiz } = ctx;

    const leitura = lerEstimativas(ctx);
    if (leitura.erro) {
      ctx.mostrarVazio(leitura.erro);
      return;
    }

    let { itens } = leitura;
    const { origem, origemEmTexto, medida, campoDaCategoria } = leitura;

    const tipo = config.tipoDeBarra || 'confianca';
    const nivel = (Number(config.nivelDeConfianca) || 95) / 100;

    // Limites já calculados no LookML vêm prontos: não dá para recalculá-los
    // em outro nível, e fingir que dá seria inventar números.
    if (origem === 'limites' && tipo !== 'confianca') {
      ctx.avisar(
        'Os limites vieram prontos da consulta: não dá para recalculá-los em outro nível. ' +
          'As barras mostram o que a consulta trouxe.'
      );
    }

    const comparacao = origem !== 'limites' && tipo === 'comparacao';
    const nivelUsado = comparacao ? NIVEL_DE_COMPARACAO / 100 : nivel;

    if (origem !== 'limites') {
      for (const item of itens) {
        aplicarIntervalo(item, { tipo: comparacao ? 'confianca' : tipo, nivel: nivelUsado });
      }
    }

    const semIntervalo = itens.filter((i) => i.inferior === null || i.superior === null);
    if (semIntervalo.length) {
      ctx.avisar(
        `${semIntervalo.length} categoria(s) não têm informação suficiente para um intervalo ` +
          '(falta o n ou o desvio). Elas aparecem só com a estimativa, sem barra.'
      );
    }

    const pequenas = itens.filter((i) => i.n !== null && i.n < MINIMO_POR_CATEGORIA);
    if (pequenas.length) {
      ctx.avisar(
        `${pequenas.length} categoria(s) têm menos de ${MINIMO_POR_CATEGORIA} observações. ` +
          'O intervalo existe, mas é tão largo que não separa nada.'
      );
    }

    itens = ordenar(itens, config.ordenarPorEstimativa);

    // ---------- Referência ----------
    const referencia = calcularReferencia(itens, config);

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'ic');
    const area = criarEl('div', { classe: 'ic-area', pai: raiz });
    const largura = ctx.largura;
    const altura = ctx.altura;

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const ehHorizontal = (config.orientacao || 'horizontal') === 'horizontal';
    const extremos = itens.flatMap((i) => [
      i.inferior === null ? i.estimativa : i.inferior,
      i.superior === null ? i.estimativa : i.superior,
    ]);
    if (referencia !== null) extremos.push(referencia);

    const rotulos = itens.map((i) => truncar(i.rotulo, 22));

    const margens = calcularMargens({
      rotulosY: ehHorizontal ? rotulos : extremos.map(formatar),
      rotulosX: ehHorizontal ? extremos.map(formatar) : rotulos,
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaDeValor = escalaNumerica({
      valores: extremos,
      intervalo: ehHorizontal
        ? [retangulo.esquerda, retangulo.esquerda + retangulo.largura]
        : [retangulo.cima + retangulo.altura, retangulo.cima],
      config,
      eixo: ehHorizontal ? 'X' : 'Y',
    });
    const escalaDeCategoria = escalaDeBanda({
      dominio: itens.map((i) => i.chave),
      intervalo: ehHorizontal
        ? [retangulo.cima, retangulo.cima + retangulo.altura]
        : [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config: { larguraDaBarra: 80, espacamentoEntreGrupos: 8 },
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'ic-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const nomeDaCategoria = (chave) => {
      const item = itens.find((i) => i.chave === chave);
      return item ? truncar(item.rotulo, 22) : String(chave);
    };
    const centro = (chave) => escalaDeCategoria(chave) + escalaDeCategoria.bandwidth() / 2;

    // `desenharEixos` só desenha banda no X; no Y entregamos uma escala que
    // se comporta como numérica e devolve o centro da faixa.
    const escalaDeCategoriaNoY = (chave) => centro(chave);
    escalaDeCategoriaNoY.ticks = () => itens.map((i) => i.chave);
    escalaDeCategoriaNoY.domain = () => itens.map((i) => i.chave);

    desenharEixos({
      svg,
      escalaX: ehHorizontal ? escalaDeValor : escalaDeCategoria,
      escalaY: ehHorizontal ? escalaDeCategoriaNoY : escalaDeValor,
      area: retangulo,
      config,
      tema,
      rotulosDeBanda: ehHorizontal ? null : itens.map((i) => i.chave),
      formatarX: ehHorizontal ? formatar : nomeDaCategoria,
      formatarY: ehHorizontal ? nomeDaCategoria : formatar,
    });

    // ---------- Referência ----------
    if (referencia !== null) {
      const p = escalaDeValor(referencia);
      criarSvgEl('line', {
        pai: svg,
        classe: 'ic-marca',
        atributos: {
          x1: ehHorizontal ? p : retangulo.esquerda,
          x2: ehHorizontal ? p : retangulo.esquerda + retangulo.largura,
          y1: ehHorizontal ? retangulo.cima : p,
          y2: ehHorizontal ? retangulo.cima + retangulo.altura : p,
          stroke: tema.bordaForte,
          'stroke-width': 1,
          'stroke-dasharray': '4 3',
        },
      });
    }

    // ---------- Barras ----------
    const paleta = coresDaPaleta(config.paleta);
    const raioDoPonto = (Number(config.tamanhoDoPonto) || 6) / 2;
    const espessura = Number(config.espessuraDaBarra) || 2;
    const tamanhoDaTampa = Math.min(10, escalaDeCategoria.bandwidth() * 0.35);

    itens.forEach((item, indice) => {
      const c = centro(item.chave);
      item.cruzaReferencia =
        referencia === null || item.inferior === null || item.superior === null
          ? null
          : item.inferior <= referencia && item.superior >= referencia;

      const destacar = config.destacarQuemCruza !== false && item.cruzaReferencia === false;
      const cor = destacar ? tema.destaque : paleta[indice % paleta.length];
      item.cor = cor;

      if (item.inferior !== null && item.superior !== null) {
        const a = escalaDeValor(item.inferior);
        const b = escalaDeValor(item.superior);

        criarSvgEl('line', {
          pai: svg,
          classe: 'ic-marca',
          atributos: {
            x1: ehHorizontal ? a : c,
            x2: ehHorizontal ? b : c,
            y1: ehHorizontal ? c : a,
            y2: ehHorizontal ? c : b,
            stroke: cor,
            'stroke-width': espessura,
          },
        });

        for (const ponta of [a, b]) {
          criarSvgEl('line', {
            pai: svg,
            classe: 'ic-marca',
            atributos: {
              x1: ehHorizontal ? ponta : c - tamanhoDaTampa / 2,
              x2: ehHorizontal ? ponta : c + tamanhoDaTampa / 2,
              y1: ehHorizontal ? c - tamanhoDaTampa / 2 : ponta,
              y2: ehHorizontal ? c + tamanhoDaTampa / 2 : ponta,
              stroke: cor,
              'stroke-width': espessura,
            },
          });
        }
      }

      const p = escalaDeValor(item.estimativa);
      criarSvgEl('circle', {
        pai: svg,
        classe: 'ic-estimativa',
        atributos: {
          cx: ehHorizontal ? p : c,
          cy: ehHorizontal ? c : p,
          r: raioDoPonto,
          fill: cor,
          stroke: tema.fundo,
          'stroke-width': 1,
        },
      });

      item.px = ehHorizontal ? p : c;
      item.py = ehHorizontal ? c : p;
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'ic-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      textoDaNota({ origemEmTexto, tipo, comparacao, nivel, origem })
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const faixaDe = (ev) => {
      const caixa = area.getBoundingClientRect();
      const posicao = ehHorizontal ? ev.clientY - caixa.top : ev.clientX - caixa.left;
      let melhor = null;
      let menor = Infinity;
      for (const item of itens) {
        const d = Math.abs(centro(item.chave) - posicao);
        if (d < menor) {
          menor = d;
          melhor = item;
        }
      }
      return menor <= escalaDeCategoria.step() ? melhor : null;
    };

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const item = faixaDe(ev);
      if (!item) {
        tooltip.esconder();
        return;
      }
      const linhas = [
        { rotulo: medida.rotuloCurto, valor: formatar(item.estimativa), cor: item.cor },
      ];
      if (item.inferior !== null && item.superior !== null) {
        linhas.push({
          rotulo: comparacao ? `Comparação (${NIVEL_DE_COMPARACAO}%)` : rotuloDoIntervalo(tipo, nivel),
          valor: `${formatar(item.inferior)} a ${formatar(item.superior)}`,
        });
      } else {
        linhas.push({ rotulo: 'Intervalo', valor: 'sem n ou desvio na consulta' });
      }
      if (item.n !== null) linhas.push({ rotulo: 'Observações', valor: String(item.n) });
      if (item.erroPadrao !== null && item.erroPadrao !== undefined) {
        linhas.push({ rotulo: 'Erro-padrão', valor: formatar(item.erroPadrao) });
      }
      if (item.cruzaReferencia !== null && referencia !== null) {
        linhas.push({
          rotulo: 'Cruza a referência',
          valor: item.cruzaReferencia ? 'sim' : 'não',
        });
      }
      tooltip.mostrar({ titulo: item.rotulo, linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(area, 'click', (ev) => {
      const item = faixaDe(ev);
      if (!item || !campoDaCategoria || item.indiceDaLinha === undefined) return;
      const celula = ctx.modelo.celula(ctx.modelo.linhas[item.indiceDaLinha], campoDaCategoria.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function rotuloDoIntervalo(tipo, nivel) {
  if (tipo === 'erroPadrao') return 'Estimativa ± 1 erro-padrão';
  return `Intervalo de ${Math.round(nivel * 100)}%`;
}

function textoDaNota({ origemEmTexto, tipo, comparacao, nivel, origem }) {
  const partes = [`estimativa e incerteza ${origemEmTexto}`];

  if (origem === 'limites') {
    partes.push('limites como vieram da consulta');
  } else if (comparacao) {
    partes.push(
      `barras de COMPARAÇÃO (${NIVEL_DE_COMPARACAO}%): aqui a sobreposição corresponde ao teste — ` +
        'elas NÃO são intervalos de confiança da estimativa'
    );
  } else if (tipo === 'erroPadrao') {
    partes.push('barras de ±1 erro-padrão (cobrem ~68%, não 95%)');
  } else {
    partes.push(
      `intervalos de ${Math.round(nivel * 100)}% (t de Student) — ATENÇÃO: intervalos que se tocam ` +
        'não significam diferença não significativa; para essa leitura use o modo de comparação'
    );
  }
  return partes.join(' · ');
}

function ordenar(itens, ordem) {
  const copia = itens.slice();
  if (ordem === 'estimativaAsc') copia.sort((a, b) => a.estimativa - b.estimativa);
  else if (ordem !== 'consulta') copia.sort((a, b) => b.estimativa - a.estimativa);
  return copia;
}

function calcularReferencia(itens, config) {
  const modo = config.referencia || 'media';
  if (modo === 'nenhuma') return null;
  if (modo === 'zero') return 0;
  if (modo === 'fixo') {
    const valor = Number(config.valorDaReferencia);
    return Number.isFinite(valor) ? valor : 0;
  }
  if (!itens.length) return null;
  return itens.reduce((a, i) => a + i.estimativa, 0) / itens.length;
}

/**
 * Aplica o intervalo a um item que já tem média, desvio e n.
 *
 * Usa o t de Student com n−1 graus de liberdade, não 1,96 fixo: com n = 6
 * o multiplicador correto é 2,57, e usar 1,96 estreitaria o intervalo em
 * 24% — bem na faixa de n em que a incerteza é maior.
 */
export function aplicarIntervalo(item, { tipo = 'confianca', nivel = 0.95 } = {}) {
  if (item.erroPadrao === null || item.erroPadrao === undefined || !(item.n > 1)) {
    item.inferior = item.inferior ?? null;
    item.superior = item.superior ?? null;
    return item;
  }

  const multiplicador =
    tipo === 'erroPadrao' ? 1 : quantilT(1 - (1 - nivel) / 2, item.n - 1) || 1.959964;

  item.multiplicador = multiplicador;
  item.inferior = item.estimativa - multiplicador * item.erroPadrao;
  item.superior = item.estimativa + multiplicador * item.erroPadrao;
  return item;
}

/**
 * Lê as estimativas da consulta por um de três caminhos.
 *
 * Eles NÃO significam a mesma coisa, e por isso o caminho usado é
 * declarado na tela:
 *
 * - `limites`: o LookML já calculou inferior e superior. O gráfico só
 *   desenha o que recebeu, e não pode recalcular em outro nível.
 * - `contagemEDesvio`: a consulta trouxe n e desvio por categoria, e o
 *   erro-padrão sai de s/√n.
 * - `linhas`: a consulta veio sem agregar, e tudo é calculado a partir das
 *   observações. É o único caminho em que o n é o número de linhas de
 *   verdade.
 */
export function lerEstimativas(ctx) {
  const { modelo, config } = ctx;

  const medida =
    modelo.medidas.find((m) => m.nome === config.campoDosValores) || modelo.medidas[0] || null;
  if (!medida) return { erro: 'Esta visualização precisa de uma medida com a estimativa.' };

  const campoDaCategoria =
    modelo.dimensoes.find((d) => d.nome === config.campoDaCategoria) || modelo.dimensoes[0] || null;
  if (!campoDaCategoria) {
    return { erro: 'Esta visualização precisa de uma dimensão com as categorias comparadas.' };
  }

  const inferior = modelo.medidas.find((m) => m.nome === config.campoDoLimiteInferior);
  const superior = modelo.medidas.find((m) => m.nome === config.campoDoLimiteSuperior);
  const contagem = modelo.medidas.find((m) => m.nome === config.campoDaContagem);
  const desvio = modelo.medidas.find((m) => m.nome === config.campoDoDesvio);

  // --- Caminho 1: limites prontos ---
  if (inferior && superior) {
    const itens = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      const estimativa = modelo.valorNumerico(linha, medida.nome);
      if (estimativa === null) continue;
      itens.push({
        chave: String(modelo.valorBruto(linha, campoDaCategoria.nome)),
        rotulo: modelo.texto(linha, campoDaCategoria.nome, undefined, '∅'),
        estimativa,
        inferior: modelo.valorNumerico(linha, inferior.nome),
        superior: modelo.valorNumerico(linha, superior.nome),
        n: contagem ? modelo.valorNumerico(linha, contagem.nome) : null,
        erroPadrao: null,
        indiceDaLinha: i,
      });
    }
    if (!itens.length) return { erro: 'Nenhuma linha tem valor na medida da estimativa.' };
    return {
      itens,
      origem: 'limites',
      origemEmTexto: 'como vieram da consulta (limites já calculados no LookML)',
      medida,
      campoDaCategoria,
    };
  }

  // --- Caminho 2: n e desvio por categoria ---
  if (contagem && desvio) {
    const itens = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      const estimativa = modelo.valorNumerico(linha, medida.nome);
      if (estimativa === null) continue;
      const n = modelo.valorNumerico(linha, contagem.nome);
      const s = modelo.valorNumerico(linha, desvio.nome);
      itens.push({
        chave: String(modelo.valorBruto(linha, campoDaCategoria.nome)),
        rotulo: modelo.texto(linha, campoDaCategoria.nome, undefined, '∅'),
        estimativa,
        n: n !== null && n > 0 ? n : null,
        erroPadrao: n !== null && n > 0 && s !== null ? s / Math.sqrt(n) : null,
        inferior: null,
        superior: null,
        indiceDaLinha: i,
      });
    }
    if (!itens.length) return { erro: 'Nenhuma linha tem valor na medida da estimativa.' };
    return {
      itens,
      origem: 'contagemEDesvio',
      origemEmTexto: 'do n e do desvio-padrão trazidos pela consulta (EP = s ÷ √n)',
      medida,
      campoDaCategoria,
    };
  }

  // --- Caminho 3: a partir das linhas ---
  const preparo = prepararDistribuicoes(ctx);
  if (preparo.erro) {
    return {
      erro:
        `${preparo.erro} Como alternativa, traga do Explore as medidas de limite inferior e ` +
        'superior já calculadas, ou o n e o desvio-padrão de cada categoria, e escolha-as nas opções.',
    };
  }

  const itens = preparo.grupos.map((grupo) => ({
    chave: grupo.chave,
    rotulo: grupo.rotulo,
    estimativa: grupo.resumo.media,
    n: grupo.resumo.n,
    desvio: grupo.resumo.desvio,
    erroPadrao: grupo.resumo.n > 1 ? grupo.resumo.desvio / Math.sqrt(grupo.resumo.n) : null,
    inferior: null,
    superior: null,
    indiceDaLinha: grupo.indiceDaLinha,
  }));

  return {
    itens,
    origem: 'linhas',
    origemEmTexto: 'calculadas a partir das observações da consulta',
    medida: preparo.medida,
    campoDaCategoria: preparo.campoDaCategoria || campoDaCategoria,
  };
}
