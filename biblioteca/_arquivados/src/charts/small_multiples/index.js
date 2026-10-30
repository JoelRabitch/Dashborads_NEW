/**
 * small_multiples — "Small Multiples".
 *
 * Uma grade de mini-gráficos, um por série, **todos na mesma escala**.
 *
 * A escala compartilhada não é detalhe: é o gráfico inteiro. Com escalas
 * independentes, cada painel usa toda a altura disponível e todos parecem
 * igualmente dramáticos — a série que varia de 2 a 3 fica com a mesma
 * amplitude visual da que varia de 2 a 3.000. O olho compara FORMAS, e
 * formas de escalas diferentes não são comparáveis. Como permitir a
 * comparação é a única razão de existir de um small multiples, a escala
 * livre existe como opção, mas é sempre DECLARADA na tela.
 *
 * O segundo problema é de volume e tem resposta simples: acima de ~60
 * painéis nada é legível num painel de Looker. Cortar com aviso é melhor
 * do que desenhar 400 quadradinhos ilegíveis.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica } from '../../core/scales.js';
import { geradorDeLinha, geradorDeArea } from '../../core/shapes.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarData, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { extrairMatriz, tratarNulos, opcaoDeOrigemDasSeries } from '../../core/series.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.sm-area{position:relative;width:100%;height:100%;overflow:hidden;}
.sm-svg{position:absolute;left:0;top:0;}
.sm-painel{pointer-events:none;}
.sm-titulo{pointer-events:none;font-weight:600;}
.sm-valor{pointer-events:none;}
.sm-eixo{pointer-events:none;}
.sm-guia{pointer-events:none;}
.sm-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Abaixo disto o painel não cabe nem o título nem a forma. */
const LADO_MINIMO = 56;

/** Acima disto nada é legível num painel de Looker. */
const MAXIMO_DE_PAINEIS = 60;

export default defineViz({
  id: 'small_multiples',
  label: 'Small Multiples',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      {
        tipoDoPainel: {
          type: 'string',
          label: 'Desenho de cada painel',
          section: 'Painéis',
          display: 'select',
          default: 'area',
          values: listaDeValores([
            { rotulo: 'Área', valor: 'area' },
            { rotulo: 'Linha', valor: 'linha' },
            { rotulo: 'Barras', valor: 'barras' },
          ]),
        },
        escalaCompartilhada: {
          type: 'boolean',
          label: 'Mesma escala em todos os painéis (o que torna a comparação possível)',
          section: 'Painéis',
          default: true,
        },
        baseEmZero: {
          type: 'boolean',
          label: 'Começar a escala em zero',
          section: 'Painéis',
          default: true,
        },
        ordemDosPaineis: {
          type: 'string',
          label: 'Ordem dos painéis',
          section: 'Painéis',
          display: 'select',
          default: 'total',
          values: listaDeValores([
            { rotulo: 'Pelo total (maior primeiro)', valor: 'total' },
            { rotulo: 'Pelo máximo (maior primeiro)', valor: 'maximo' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
          ]),
        },
        colunas: {
          type: 'number',
          label: 'Colunas da grade (0 = automático)',
          section: 'Painéis',
          display: 'number',
          default: 0,
        },
        escreverMaximo: {
          type: 'boolean',
          label: 'Escrever o valor máximo em cada painel',
          section: 'Rótulos',
          default: true,
        },
        destacarExtremos: {
          type: 'boolean',
          label: 'Marcar o ponto de máximo de cada painel',
          section: 'Painéis',
          default: true,
        },
        curvaDaLinha: {
          type: 'string',
          label: 'Suavização',
          section: 'Painéis',
          display: 'select',
          default: 'monotone',
          values: listaDeValores([
            { rotulo: 'Suave sem ultrapassar (monotone)', valor: 'monotone' },
            { rotulo: 'Reta', valor: 'linear' },
            { rotulo: 'Degraus', valor: 'stepAfter' },
          ]),
        },
        tratamentoDeNulos: {
          type: 'string',
          label: 'Valores faltando',
          section: 'Dados',
          display: 'select',
          default: 'manter',
          values: listaDeValores([
            { rotulo: 'Cortar a linha', valor: 'manter' },
            { rotulo: 'Interpolar entre os vizinhos', valor: 'interpolar' },
            { rotulo: 'Tratar como zero', valor: 'zero' },
          ]),
        },
      }
    ),
    { limiteDeSeries: 40, mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const matriz = extrairMatriz(modelo, config);
    for (const aviso of matriz.avisos) ctx.avisar(aviso);

    if (!matriz.categorias.length || !matriz.series.length) {
      ctx.mostrarVazio(
        'Um small multiples precisa de uma dimensão no eixo e de VÁRIAS séries ' +
          '(de um pivô, de uma segunda dimensão ou de várias medidas).'
      );
      return;
    }

    let series = tratarNulos(matriz.series, config.tratamentoDeNulos || 'manter');
    series = ordenarSeries(series, config.ordemDosPaineis);

    if (series.length > MAXIMO_DE_PAINEIS) {
      ctx.avisar(
        `A consulta tem ${series.length} séries. Mostrando as ${MAXIMO_DE_PAINEIS} primeiras na ordem ` +
          'escolhida: acima disso cada painel fica com poucos pixels e a grade deixa de ser legível.'
      );
      series = series.slice(0, MAXIMO_DE_PAINEIS);
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'sm');
    const area = criarEl('div', { classe: 'sm-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(matriz.medida && matriz.medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });
    const ehData = !!(matriz.campoDaCategoria && matriz.campoDaCategoria.ehData);
    const rotuloDaCategoria = (categoria) =>
      ehData ? formatarData(categoria.valorBruto, config.formatoDeData || 'auto') : categoria.rotulo;

    const fonte = Math.max(8, tema.tamanhoBase - 2);
    const alturaDoTitulo = fonte + 6;
    const margemDaGrade = 6;

    const grade = montarGrade({
      quantidade: series.length,
      largura: largura - margemDaGrade * 2,
      altura: altura - margemDaGrade * 2 - 14,
      colunasPedidas: Number(config.colunas) || 0,
    });

    if (grade.ladoX < LADO_MINIMO || grade.ladoY < LADO_MINIMO) {
      ctx.avisar(
        `Com ${series.length} painéis, cada um fica com ${Math.round(grade.ladoX)} × ` +
          `${Math.round(grade.ladoY)} px. Abaixo de ${LADO_MINIMO} px nem o título cabe — ` +
          'reduza as séries no Explore ou aumente a altura da visualização.'
      );
    }

    // ---------- Escala ----------
    const compartilhada = config.escalaCompartilhada !== false;
    const baseEmZero = config.baseEmZero !== false;

    const todosOsValores = series.flatMap((s) => s.valores).filter((v) => v !== null && Number.isFinite(v));
    if (!todosOsValores.length) {
      ctx.mostrarVazio('Nenhuma série tem valores numéricos para desenhar.');
      return;
    }
    const maximoGeral = Math.max(...todosOsValores);
    const minimoGeral = Math.min(...todosOsValores);

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'sm-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const paleta = coresDaPaleta(config.paleta);
    const curva = config.curvaDaLinha || 'monotone';
    const tipo = config.tipoDoPainel || 'area';

    // ---------- Painéis ----------
    series.forEach((serie, indice) => {
      const coluna = indice % grade.colunas;
      const linha = Math.floor(indice / grade.colunas);
      const caixa = {
        esquerda: margemDaGrade + coluna * grade.ladoX,
        cima: margemDaGrade + linha * grade.ladoY,
        largura: grade.ladoX,
        altura: grade.ladoY,
      };

      const interno = {
        esquerda: caixa.esquerda + 3,
        cima: caixa.cima + alturaDoTitulo,
        largura: Math.max(6, caixa.largura - 6),
        altura: Math.max(6, caixa.altura - alturaDoTitulo - 4),
      };

      const validos = serie.valores.filter((v) => v !== null && Number.isFinite(v));
      const maximoLocal = validos.length ? Math.max(...validos) : 0;
      const minimoLocal = validos.length ? Math.min(...validos) : 0;
      serie.maximo = maximoLocal;
      serie.caixa = caixa;

      const dominio = compartilhada
        ? [baseEmZero ? Math.min(0, minimoGeral) : minimoGeral, maximoGeral]
        : [baseEmZero ? Math.min(0, minimoLocal) : minimoLocal, maximoLocal];

      const escalaY = escalaNumerica({
        valores: dominio,
        intervalo: [interno.cima + interno.altura, interno.cima],
        config: {},
        eixo: 'Y',
      });
      serie.escalaY = escalaY;

      const passo = interno.largura / Math.max(1, matriz.categorias.length - 1);
      const x = (i) =>
        matriz.categorias.length === 1
          ? interno.esquerda + interno.largura / 2
          : interno.esquerda + i * passo;
      serie.x = x;
      serie.interno = interno;

      const cor = paleta[indice % paleta.length];
      serie.cor = cor;

      // Moldura discreta: sem ela, painéis vizinhos com formas parecidas
      // se confundem num borrão.
      criarSvgEl('rect', {
        pai: svg,
        classe: 'sm-painel',
        atributos: {
          x: caixa.esquerda + 1,
          y: caixa.cima + 1,
          width: caixa.largura - 2,
          height: caixa.altura - 2,
          fill: 'none',
          stroke: comOpacidade(tema.borda, 0.8),
          'stroke-width': 1,
        },
      });

      // Linha do zero, quando ele está dentro do domínio.
      const yZero = escalaY(0);
      if (yZero >= interno.cima && yZero <= interno.cima + interno.altura) {
        criarSvgEl('line', {
          pai: svg,
          classe: 'sm-eixo',
          atributos: {
            x1: interno.esquerda, x2: interno.esquerda + interno.largura,
            y1: yZero, y2: yZero,
            stroke: comOpacidade(tema.texto, 0.18),
            'stroke-width': 1,
          },
        });
      }

      const definido = (_, i) => serie.valores[i] !== null && Number.isFinite(serie.valores[i]);

      if (tipo === 'barras') {
        const larguraDaBarra = Math.max(0.5, (interno.largura / matriz.categorias.length) * 0.8);
        matriz.categorias.forEach((_, i) => {
          if (!definido(null, i)) return;
          const valor = serie.valores[i];
          const y = escalaY(valor);
          const base = Math.min(Math.max(yZero, interno.cima), interno.cima + interno.altura);
          criarSvgEl('rect', {
            pai: svg,
            classe: 'sm-marca',
            atributos: {
              x: x(i) - larguraDaBarra / 2,
              y: Math.min(y, base),
              width: larguraDaBarra,
              height: Math.max(0.5, Math.abs(base - y)),
              fill: cor,
              opacity: 0.85,
            },
          });
        });
      } else {
        if (tipo === 'area') {
          const gerador = geradorDeArea({
            x: (_, i) => x(i),
            y0: () => Math.min(Math.max(yZero, interno.cima), interno.cima + interno.altura),
            y1: (_, i) => escalaY(serie.valores[i]),
            curva,
            definido,
          });
          criarSvgEl('path', {
            pai: svg,
            classe: 'sm-marca',
            atributos: { d: gerador(matriz.categorias) || '', fill: comOpacidade(cor, 0.3) },
          });
        }
        const gerador = geradorDeLinha({
          x: (_, i) => x(i),
          y: (_, i) => escalaY(serie.valores[i]),
          curva,
          definido,
        });
        criarSvgEl('path', {
          pai: svg,
          classe: 'sm-linha',
          atributos: {
            d: gerador(matriz.categorias) || '',
            fill: 'none',
            stroke: cor,
            'stroke-width': 1.5,
            'stroke-linejoin': 'round',
          },
        });
      }

      if (config.destacarExtremos !== false && validos.length) {
        const i = serie.valores.findIndex((v) => v === maximoLocal);
        if (i >= 0) {
          criarSvgEl('circle', {
            pai: svg,
            classe: 'sm-marca',
            atributos: { cx: x(i), cy: escalaY(maximoLocal), r: 2.2, fill: cor },
          });
        }
      }

      // --- Título e máximo ---
      const titulo = criarSvgEl('text', {
        pai: svg,
        classe: 'sm-titulo',
        atributos: {
          x: caixa.esquerda + 4,
          y: caixa.cima + fonte + 2,
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      definirTexto(titulo, truncar(serie.rotulo, Math.max(4, Math.floor(caixa.largura / (fonte * 0.6)))));

      if (config.escreverMaximo !== false && validos.length) {
        const valor = criarSvgEl('text', {
          pai: svg,
          classe: 'sm-valor',
          atributos: {
            x: caixa.esquerda + caixa.largura - 4,
            y: caixa.cima + fonte + 2,
            'text-anchor': 'end',
            'font-size': fonte - 1,
            fill: tema.textoSuave,
          },
        });
        definirTexto(valor, formatar(maximoLocal));
      }
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'sm-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${series.length} painéis em ${grade.colunas} × ${grade.linhas}`,
        compartilhada
          ? `escala compartilhada (0 a ${formatar(maximoGeral)}): as formas SÃO comparáveis`
          : 'ATENÇÃO: cada painel tem a própria escala — as formas NÃO são comparáveis entre si',
        `ordem ${nomeDaOrdem(config.ordemDosPaineis)}`,
        `${matriz.categorias.length} pontos por painel`,
      ].join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const guia = criarSvgEl('line', {
      pai: svg,
      classe: 'sm-guia',
      atributos: { stroke: tema.bordaForte, 'stroke-width': 1, opacity: 0 },
    });

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixaDaArea = area.getBoundingClientRect();
      const px = ev.clientX - caixaDaArea.left;
      const py = ev.clientY - caixaDaArea.top;

      const coluna = Math.floor((px - margemDaGrade) / grade.ladoX);
      const linha = Math.floor((py - margemDaGrade) / grade.ladoY);
      const indice = linha * grade.colunas + coluna;
      const serie = indice >= 0 && indice < series.length && coluna >= 0 && coluna < grade.colunas
        ? series[indice]
        : null;

      if (!serie) {
        guia.setAttribute('opacity', 0);
        tooltip.esconder();
        return;
      }

      const passo = serie.interno.largura / Math.max(1, matriz.categorias.length - 1);
      const i = Math.max(
        0,
        Math.min(
          matriz.categorias.length - 1,
          Math.round((px - serie.interno.esquerda) / (passo || 1))
        )
      );

      guia.setAttribute('x1', serie.x(i));
      guia.setAttribute('x2', serie.x(i));
      guia.setAttribute('y1', serie.interno.cima);
      guia.setAttribute('y2', serie.interno.cima + serie.interno.altura);
      guia.setAttribute('opacity', 0.6);

      const valor = serie.valores[i];
      tooltip.mostrar(
        {
          titulo: serie.rotulo,
          linhas: [
            { rotulo: 'Período', valor: rotuloDaCategoria(matriz.categorias[i]) },
            {
              rotulo: matriz.medida ? matriz.medida.rotuloCurto : 'Valor',
              valor: valor === null || !Number.isFinite(valor) ? 'sem dado' : formatar(valor),
              cor: serie.cor,
            },
            { rotulo: 'Máximo do painel', valor: formatar(serie.maximo) },
            ...(compartilhada
              ? []
              : [{ rotulo: 'Atenção', valor: 'escala própria: não compare com os outros painéis' }]),
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      guia.setAttribute('opacity', 0);
      if (tooltip) tooltip.esconder();
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function nomeDaOrdem(modo) {
  if (modo === 'maximo') return 'pelo máximo';
  if (modo === 'alfabetica') return 'alfabética';
  if (modo === 'consulta') return 'da consulta';
  return 'pelo total';
}

export function ordenarSeries(series, modo = 'total') {
  const copia = series.slice();
  const soma = (s) => s.valores.reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0);
  const maximo = (s) => s.valores.reduce((a, v) => (Number.isFinite(v) && v > a ? v : a), -Infinity);

  if (modo === 'maximo') copia.sort((a, b) => maximo(b) - maximo(a));
  else if (modo === 'alfabetica') copia.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  else if (modo !== 'consulta') copia.sort((a, b) => soma(b) - soma(a));
  return copia;
}

/**
 * Escolhe o número de colunas da grade.
 *
 * O número que minimiza o desperdício é o que deixa cada painel com a
 * proporção mais próxima de um quadrado — testamos todos (são poucos) e
 * ficamos com o melhor. `ceil(sqrt(n))` sozinho ignora a proporção da
 * tela e, numa visualização larga e baixa, produz painéis altos e magros
 * com faixas vazias dos dois lados.
 */
export function montarGrade({ quantidade, largura, altura, colunasPedidas = 0 }) {
  const n = Math.max(1, quantidade);

  if (colunasPedidas > 0) {
    const colunas = Math.min(n, Math.floor(colunasPedidas));
    const linhas = Math.ceil(n / colunas);
    return { colunas, linhas, ladoX: largura / colunas, ladoY: altura / linhas };
  }

  let melhor = { colunas: 1, linhas: n, pontuacao: Infinity, ladoX: largura, ladoY: altura / n };
  for (let colunas = 1; colunas <= n; colunas++) {
    const linhas = Math.ceil(n / colunas);
    const ladoX = largura / colunas;
    const ladoY = altura / linhas;
    if (!(ladoX > 0) || !(ladoY > 0)) continue;

    // Distância a um quadrado, somada a uma pequena penalidade pelas
    // células vazias da última fileira.
    const proporcao = Math.max(ladoX / ladoY, ladoY / ladoX);
    const sobra = (colunas * linhas - n) / n;
    const pontuacao = proporcao + sobra * 0.6;

    if (pontuacao < melhor.pontuacao) melhor = { colunas, linhas, pontuacao, ladoX, ladoY };
  }
  return melhor;
}
