/**
 * waffle — "Waffle".
 *
 * Uma grade de quadradinhos, cada um valendo N unidades. É o gráfico de
 * pizza que a gente consegue ler: a pizza pede comparação de ÂNGULOS, que
 * o olho faz mal; o waffle troca isso por CONTAGEM, que o olho faz bem.
 * "37 de 100" é lido direto, sem estimativa.
 *
 * Duas coisas precisam ser ditas, e as duas são sobre o mesmo ponto — o
 * waffle DISCRETIZA um dado contínuo:
 *
 * 1. **Quanto vale cada quadradinho.** Num waffle de 100 células com
 *    total de 4.300, cada célula vale 43. Sem isso escrito, o leitor conta
 *    células achando que conta unidades.
 * 2. **O arredondamento.** 37,6 células não existem. Arredondar cada
 *    categoria por conta própria faz a soma dar 99 ou 101 — e aí a grade
 *    tem buraco ou estoura. Aqui o reparto é pelo **maior resto**
 *    (Hamilton), que fecha a soma exatamente; e quando alguma categoria
 *    sai do seu valor por mais de meia célula, o gráfico avisa.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import { lerFatias } from '../_polar/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeCores,
  blocoDeLegenda,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.wf-area{position:relative;width:100%;height:100%;overflow:hidden;}
.wf-svg{position:absolute;left:0;top:0;}
.wf-celula{cursor:default;}
.wf-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/**
 * Abaixo deste lado em pixels a célula deixa de ser contável — e contar é
 * a única vantagem do waffle sobre a pizza.
 *
 * O limite é sobre o TAMANHO, não sobre a quantidade: 50 × 50 células numa
 * tela cheia dão quase 9 px e se leem bem; as mesmas 2.500 num tile
 * pequeno dariam 2 px. Um teto de contagem seria arbitrário num caso e
 * inútil no outro.
 */
const LADO_MINIMO_DA_CELULA = 4;

/** Acima disso a legenda não cabe e as cores deixam de ser distinguíveis. */
const MAXIMO_DE_CATEGORIAS = 12;

export default defineViz({
  id: 'waffle',
  label: 'Waffle',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeLegenda(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        colunas: {
          type: 'number',
          label: 'Colunas da grade',
          section: 'Waffle',
          display: 'range',
          min: 2,
          max: 50,
          step: 1,
          default: 10,
        },
        linhas: {
          type: 'number',
          label: 'Linhas da grade',
          section: 'Waffle',
          display: 'range',
          min: 2,
          max: 50,
          step: 1,
          default: 10,
        },
        preenchimento: {
          type: 'string',
          label: 'Preencher',
          section: 'Waffle',
          display: 'select',
          default: 'colunaDeBaixo',
          values: listaDeValores([
            { rotulo: 'Por coluna, de baixo para cima', valor: 'colunaDeBaixo' },
            { rotulo: 'Por linha, de cima para baixo', valor: 'linhaDeCima' },
          ]),
        },
        maximoDeCategorias: {
          type: 'number',
          label: 'Máximo de categorias (o resto vira "Outros")',
          section: 'Waffle',
          display: 'range',
          min: 2,
          max: MAXIMO_DE_CATEGORIAS,
          step: 1,
          default: 6,
        },
        espacoEntreCelulas: {
          type: 'number',
          label: 'Espaço entre células (px)',
          section: 'Waffle',
          display: 'range',
          min: 0,
          max: 8,
          step: 1,
          default: 2,
        },
        formaDaCelula: {
          type: 'string',
          label: 'Forma da célula',
          section: 'Waffle',
          display: 'select',
          default: 'quadrado',
          values: listaDeValores([
            { rotulo: 'Quadrado', valor: 'quadrado' },
            { rotulo: 'Quadrado arredondado', valor: 'arredondado' },
            { rotulo: 'Círculo', valor: 'circulo' },
          ]),
        },
      }
    ),
    { mostrarLegenda: true, mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaCategoria', 'Dimensão das partes', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoValor', 'Medida', medidas, {
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
    const campoDaCategoria =
      modelo.dimensoes.find((d) => d.nome === config.campoDaCategoria) || modelo.dimensoes[0] || null;

    if (!medida || !campoDaCategoria) {
      ctx.mostrarVazio('Um waffle precisa de uma dimensão (as partes) e uma medida.');
      return;
    }

    let partes = lerFatias({
      modelo,
      medida,
      campoDaCategoria,
      config: { ...config, ordem: 'valorDesc' },
    }).filter((p) => p.valor > 0);

    if (!partes.length) {
      ctx.mostrarVazio(
        'Nenhuma categoria tem valor POSITIVO. Um waffle reparte um todo em partes, ' +
          'e partes negativas não cabem nessa ideia — use um gráfico de barras.'
      );
      return;
    }

    const negativos = lerFatias({ modelo, medida, campoDaCategoria, config }).filter(
      (p) => p.valorBruto < 0
    ).length;
    if (negativos > 0) {
      ctx.avisar(
        `${negativos} categoria(s) têm valor negativo e ficaram de fora: um waffle reparte um ` +
          'todo, e uma parte negativa não tem onde caber. O total mostrado NÃO as inclui.'
      );
    }

    // --- Corte de categorias, preservando o total ---
    const limite = Math.max(2, Math.min(MAXIMO_DE_CATEGORIAS, Number(config.maximoDeCategorias) || 6));
    if (partes.length > limite) {
      const mantidas = partes.slice(0, limite - 1);
      const resto = partes.slice(limite - 1);
      partes = mantidas.concat([
        {
          chave: '__outros__',
          rotulo: `Outros (${resto.length})`,
          valor: resto.reduce((a, p) => a + p.valor, 0),
          valorBruto: resto.reduce((a, p) => a + p.valorBruto, 0),
          indiceDaLinha: resto[0].indiceDaLinha,
          ehOutros: true,
        },
      ]);
      ctx.avisar(
        `A consulta tem ${resto.length + limite - 1} categorias; as ${resto.length} menores foram ` +
          'somadas em "Outros" (o total é preservado).'
      );
    }

    // ---------- Grade ----------
    const colunas = Math.max(2, Math.min(50, Number(config.colunas) || 10));
    const linhasDaGrade = Math.max(2, Math.min(50, Number(config.linhas) || 10));
    const celulas = colunas * linhasDaGrade;

    const total = partes.reduce((a, p) => a + p.valor, 0);
    const repartido = repartirPorMaiorResto(partes.map((p) => p.valor), celulas);
    partes.forEach((parte, i) => {
      parte.celulas = repartido.cotas[i];
      parte.celulasExatas = repartido.exatas[i];
    });

    const unidadePorCelula = total / celulas;
    const deslocadas = partes.filter(
      (p) => Math.abs(p.celulas - p.celulasExatas) > 0.5
    );
    if (deslocadas.length) {
      ctx.avisar(
        `${deslocadas.length} categoria(s) ficaram a mais de meia célula do valor real por causa do ` +
          'arredondamento da grade. Aumente o número de células ou leia os valores no tooltip.'
      );
    }
    const sumidas = partes.filter((p) => p.celulas === 0);
    if (sumidas.length) {
      ctx.avisar(
        `${sumidas.length} categoria(s) são pequenas demais para uma célula inteira e não aparecem ` +
          `na grade (cada célula vale ${formatarUnidade(unidadePorCelula)}). Elas continuam no total.`
      );
    }

    // ---------- Cena ----------
    const comLegenda = config.mostrarLegenda !== false;
    let hospedeiro = raiz;
    let areaLegenda = null;
    if (comLegenda) {
      const layout = criarLayoutComLegenda(raiz, config);
      hospedeiro = layout.areaGrafico;
      areaLegenda = layout.areaLegenda;
    } else {
      ctx.limparRaiz();
    }
    injetarEstilo(raiz, CSS, 'wf');

    const largura = Math.max(60, hospedeiro.clientWidth || ctx.largura);
    const altura = Math.max(60, hospedeiro.clientHeight || ctx.altura);
    const area = criarEl('div', { classe: 'wf-area', pai: hospedeiro });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const espaco = Math.max(0, Number(config.espacoEntreCelulas) || 0);
    const margem = 8;
    const alturaUtil = Math.max(20, altura - margem * 2 - 16);
    const larguraUtil = Math.max(20, largura - margem * 2);
    const lado = Math.max(
      2,
      Math.min(
        (larguraUtil - espaco * (colunas - 1)) / colunas,
        (alturaUtil - espaco * (linhasDaGrade - 1)) / linhasDaGrade
      )
    );

    if (lado < LADO_MINIMO_DA_CELULA) {
      ctx.avisar(
        `Com ${celulas} células neste espaço, cada uma fica com ${lado.toFixed(1)} px e não dá ` +
          'para contá-las — que é a única vantagem do waffle sobre a pizza. Reduza a grade ' +
          'ou aumente a visualização.'
      );
    }

    const larguraDaGrade = colunas * lado + espaco * (colunas - 1);
    const alturaDaGrade = linhasDaGrade * lado + espaco * (linhasDaGrade - 1);
    const esquerda = (largura - larguraDaGrade) / 2;
    const cima = margem;

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'wf-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Células ----------
    const paleta = coresDaPaleta(config.paleta);
    partes.forEach((parte, i) => {
      parte.cor = config[`cor_${parte.chave}`] || paleta[i % paleta.length];
    });

    const sequencia = [];
    partes.forEach((parte) => {
      for (let k = 0; k < parte.celulas; k++) sequencia.push(parte);
    });

    const porColuna = (config.preenchimento || 'colunaDeBaixo') === 'colunaDeBaixo';
    const forma = config.formaDaCelula || 'quadrado';

    sequencia.forEach((parte, indice) => {
      const { coluna, linha } = posicaoDaCelula({
        indice,
        colunas,
        linhas: linhasDaGrade,
        porColuna,
      });
      const x = esquerda + coluna * (lado + espaco);
      const y = cima + linha * (lado + espaco);

      if (forma === 'circulo') {
        criarSvgEl('circle', {
          pai: svg,
          classe: 'wf-celula',
          atributos: {
            cx: x + lado / 2, cy: y + lado / 2, r: lado / 2,
            fill: parte.cor,
            'data-chave': parte.chave,
          },
        });
      } else {
        criarSvgEl('rect', {
          pai: svg,
          classe: 'wf-celula',
          atributos: {
            x, y, width: lado, height: lado,
            rx: forma === 'arredondado' ? Math.min(4, lado * 0.25) : 0,
            fill: parte.cor,
            'data-chave': parte.chave,
          },
        });
      }
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'wf-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${colunas} × ${linhasDaGrade} = ${celulas} células`,
        // A unidade é a informação que separa "contar células" de
        // "contar unidades".
        `cada célula vale ${formatar(unidadePorCelula)} (total ${formatar(total)})`,
        'sobras repartidas pelo maior resto: a soma fecha exatamente nas células da grade',
        porColuna ? 'preenchido por coluna, de baixo para cima' : 'preenchido por linha, de cima para baixo',
      ].join(' · ')
    );

    // ---------- Legenda ----------
    if (comLegenda && areaLegenda) {
      desenharLegenda({
        hospedeiro: areaLegenda,
        tema,
        config,
        itens: partes.map((p) => ({
          chave: p.chave,
          rotulo: `${truncar(p.rotulo, 20)} — ${p.celulas} ${p.celulas === 1 ? 'célula' : 'células'}`,
          cor: p.cor,
        })),
        eventos: ctx.eventos,
      });
    }

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const alvo = ev.target && ev.target.getAttribute ? ev.target.getAttribute('data-chave') : null;
      const parte = alvo ? partes.find((p) => p.chave === alvo) : null;
      if (!parte) {
        tooltip.esconder();
        return;
      }
      // O tooltip é por CATEGORIA, não por célula: a célula é unidade de
      // desenho, não de dado.
      tooltip.mostrar(
        {
          titulo: parte.rotulo,
          linhas: [
            { rotulo: medida.rotuloCurto, valor: formatar(parte.valor), cor: parte.cor },
            { rotulo: 'Do total', valor: formatarPercentual(parte.valor / (total || 1), 1) },
            { rotulo: 'Células', valor: `${parte.celulas} de ${celulas}` },
            ...(Math.abs(parte.celulas - parte.celulasExatas) > 0.5
              ? [
                  {
                    rotulo: 'Atenção',
                    valor: `o valor exato daria ${parte.celulasExatas.toFixed(1)} células`,
                    cor: tema.atencao,
                  },
                ]
              : []),
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(area, 'click', (ev) => {
      const alvo = ev.target && ev.target.getAttribute ? ev.target.getAttribute('data-chave') : null;
      const parte = alvo ? partes.find((p) => p.chave === alvo) : null;
      if (!parte || parte.ehOutros) return;
      const celula = modelo.celula(modelo.linhas[parte.indiceDaLinha], campoDaCategoria.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function formatarUnidade(v) {
  return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '—';
}

/**
 * Reparte `celulas` entre as partes pelo método do MAIOR RESTO (Hamilton).
 *
 * Arredondar cada categoria por conta própria faz a soma dar 99 ou 101
 * células numa grade de 100 — e aí a grade fica com buraco ou estoura,
 * sem que nada no desenho explique. O maior resto garante que a soma
 * feche EXATAMENTE: cada parte leva a sua parte inteira, e as sobras vão
 * para quem tem o maior resto decimal.
 *
 * (É o mesmo método usado para repartir cadeiras no parlamento, e tem o
 * mesmo motivo: o total é fixo e tem de fechar.)
 *
 * @returns {{cotas:number[], exatas:number[]}}
 */
export function repartirPorMaiorResto(valores, celulas) {
  const positivos = valores.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = positivos.reduce((a, b) => a + b, 0);

  if (!(total > 0) || !(celulas > 0)) {
    return { cotas: positivos.map(() => 0), exatas: positivos.map(() => 0) };
  }

  const exatas = positivos.map((v) => (v / total) * celulas);
  const cotas = exatas.map((e) => Math.floor(e));
  let sobra = celulas - cotas.reduce((a, b) => a + b, 0);

  const porResto = exatas
    .map((e, i) => ({ i, resto: e - Math.floor(e) }))
    .sort((a, b) => b.resto - a.resto || a.i - b.i);

  let k = 0;
  while (sobra > 0 && porResto.length) {
    cotas[porResto[k % porResto.length].i] += 1;
    sobra -= 1;
    k += 1;
  }

  return { cotas, exatas };
}

/**
 * Posição de uma célula na grade.
 *
 * Preenchendo por coluna, a grade enche de baixo para cima como um copo —
 * que é a leitura esperada de "proporção" e a razão de este ser o padrão.
 * Por linha, enche como texto, de cima para baixo.
 */
export function posicaoDaCelula({ indice, colunas, linhas, porColuna = true }) {
  if (porColuna) {
    const coluna = Math.floor(indice / linhas);
    const dentroDaColuna = indice % linhas;
    return { coluna, linha: linhas - 1 - dentroDaColuna };
  }
  return { coluna: indice % colunas, linha: Math.floor(indice / colunas) };
}
