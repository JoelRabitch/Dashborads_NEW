/**
 * lollipop — "Gráfico de Pirulito".
 *
 * Uma haste fina até um círculo: a barra de Tufte, com menos tinta. Com
 * muitas categorias, a mancha de uma barra cheia domina a tela; o
 * pirulito mantém a mesma leitura usando uma fração da área.
 *
 * **A decisão honesta aqui é pequena e costuma ser ignorada: a haste
 * parte do ZERO.** Muita implementação desenha a haste a partir do mínimo
 * dos dados, porque fica mais bonito — e aí o pirulito vira um dot plot
 * com um rabo decorativo, com a proporção distorcida exatamente como numa
 * barra truncada. A regra é simples: se existe haste, ela é COMPRIMENTO;
 * se é comprimento, começa no zero. Quem quer o eixo cortado tem o
 * `dot_plot_denso`, onde o ponto codifica posição e o corte é legítimo —
 * e a nota aponta para lá.
 *
 * O tamanho do círculo é FIXO. A posição já codifica o valor; codificar o
 * mesmo valor uma segunda vez com outra grandeza (área) faz o leitor
 * somar as duas e exagerar a diferença.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica, escalaDeBanda } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { lerFatias } from '../_polar/index.js';
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
.lp-area{position:relative;width:100%;height:100%;}
.lp-svg{position:absolute;left:0;top:0;}
.lp-haste{pointer-events:none;}
.lp-doce{cursor:default;}
.lp-valor{pointer-events:none;}
.lp-zero{pointer-events:none;}
.lp-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso as hastes ficam a menos de 3 px e viram uma trama. */
const MAXIMO_DE_CATEGORIAS = 150;

export default defineViz({
  id: 'lollipop',
  label: 'Gráfico de Pirulito',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        orientacao: {
          type: 'string',
          label: 'Direção',
          section: 'Pirulito',
          display: 'select',
          default: 'horizontal',
          values: listaDeValores([
            { rotulo: 'Categorias no eixo Y (hastes horizontais)', valor: 'horizontal' },
            { rotulo: 'Categorias no eixo X (hastes verticais)', valor: 'vertical' },
          ]),
        },
        ordem: {
          type: 'string',
          label: 'Ordem',
          section: 'Pirulito',
          display: 'select',
          default: 'valorDesc',
          values: listaDeValores([
            { rotulo: 'Pelo valor (maior primeiro)', valor: 'valorDesc' },
            { rotulo: 'Pelo valor (menor primeiro)', valor: 'valorAsc' },
            { rotulo: 'Como veio da consulta (preserva meses)', valor: 'consulta' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
          ]),
        },
        tamanhoDoDoce: {
          type: 'number',
          label: 'Diâmetro do círculo (px)',
          section: 'Pirulito',
          display: 'range',
          min: 4,
          max: 24,
          step: 1,
          default: 9,
        },
        espessuraDaHaste: {
          type: 'number',
          label: 'Espessura da haste (px)',
          section: 'Pirulito',
          display: 'range',
          min: 0.5,
          max: 6,
          step: 0.5,
          default: 1.5,
        },
        corUnica: {
          type: 'boolean',
          label: 'Uma cor só para todos (a cor não codifica nada aqui)',
          section: 'Cores',
          default: true,
        },
        referencia: {
          type: 'string',
          label: 'Linha de referência',
          section: 'Pirulito',
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
          section: 'Pirulito',
          display: 'number',
          default: 0,
        },
        escreverValores: {
          type: 'boolean',
          label: 'Escrever o valor depois do círculo',
          section: 'Rótulos',
          default: true,
        },
      }
    ),
    { gradeEixoX: true, gradeEixoY: false, mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaCategoria', 'Dimensão das categorias', dimensoes, {
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
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const medida =
      modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    const campoDaCategoria =
      modelo.dimensoes.find((d) => d.nome === config.campoDaCategoria) || modelo.dimensoes[0] || null;

    if (!medida || !campoDaCategoria) {
      ctx.mostrarVazio('Um pirulito precisa de uma dimensão (as categorias) e uma medida.');
      return;
    }

    // `lerFatias` guarda o valor bruto (com sinal) e o desenhado; aqui o
    // sinal importa, então usamos o bruto.
    let itens = lerFatias({ modelo, medida, campoDaCategoria, config }).map((f) => ({
      ...f,
      valor: f.valorBruto,
    }));

    itens = ordenarItens(itens, config.ordem);

    if (!itens.length) {
      ctx.mostrarVazio('Nenhuma categoria tem valor na medida escolhida.');
      return;
    }
    if (itens.length > MAXIMO_DE_CATEGORIAS) {
      ctx.avisar(
        `A consulta tem ${itens.length} categorias. Mostrando as ${MAXIMO_DE_CATEGORIAS} primeiras: ` +
          'acima disso as hastes ficam a menos de 3 px e o gráfico vira uma trama.'
      );
      itens = itens.slice(0, MAXIMO_DE_CATEGORIAS);
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'lp');
    const area = criarEl('div', { classe: 'lp-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const ehHorizontal = (config.orientacao || 'horizontal') === 'horizontal';
    const referencia = calcularReferencia(itens.map((i) => i.valor), config);

    // O ZERO entra sempre no domínio: é o começo da haste, e sem ele a
    // escala cortaria o que o gráfico promete desenhar inteiro.
    const valores = itens.map((i) => i.valor).concat([0]);
    if (referencia !== null) valores.push(referencia);

    const rotulos = itens.map((i) => truncar(i.rotulo, 22));
    const margens = calcularMargens({
      rotulosY: ehHorizontal ? rotulos : valores.map(formatar),
      rotulosX: ehHorizontal ? valores.map(formatar) : rotulos,
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaDeValor = escalaNumerica({
      valores,
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
      config: { larguraDaBarra: 90, espacamentoEntreGrupos: 4 },
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'lp-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const nomeDaCategoria = (chave) => {
      const item = itens.find((i) => i.chave === chave);
      return item ? truncar(item.rotulo, 22) : String(chave);
    };
    const centro = (chave) => escalaDeCategoria(chave) + escalaDeCategoria.bandwidth() / 2;

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

    // ---------- Linha do zero ----------
    const posicaoDoZero = escalaDeValor(0);
    criarSvgEl('line', {
      pai: svg,
      classe: 'lp-zero',
      atributos: {
        x1: ehHorizontal ? posicaoDoZero : retangulo.esquerda,
        x2: ehHorizontal ? posicaoDoZero : retangulo.esquerda + retangulo.largura,
        y1: ehHorizontal ? retangulo.cima : posicaoDoZero,
        y2: ehHorizontal ? retangulo.cima + retangulo.altura : posicaoDoZero,
        stroke: tema.bordaForte,
        'stroke-width': 1,
      },
    });

    if (referencia !== null) {
      const p = escalaDeValor(referencia);
      criarSvgEl('line', {
        pai: svg,
        classe: 'lp-zero',
        atributos: {
          x1: ehHorizontal ? p : retangulo.esquerda,
          x2: ehHorizontal ? p : retangulo.esquerda + retangulo.largura,
          y1: ehHorizontal ? retangulo.cima : p,
          y2: ehHorizontal ? retangulo.cima + retangulo.altura : p,
          stroke: comOpacidade(tema.atencao, 0.8),
          'stroke-width': 1,
          'stroke-dasharray': '4 3',
        },
      });
    }

    // ---------- Pirulitos ----------
    const paleta = coresDaPaleta(config.paleta);
    const corUnica = config.corUnica !== false;
    const raioDoDoce = Math.max(2, (Number(config.tamanhoDoDoce) || 9) / 2);
    const espessura = Number(config.espessuraDaHaste) || 1.5;
    const desenhados = [];

    itens.forEach((item, i) => {
      item.cor = corUnica ? paleta[0] : paleta[i % paleta.length];
      const c = centro(item.chave);
      const p = escalaDeValor(item.valor);
      item.px = ehHorizontal ? p : c;
      item.py = ehHorizontal ? c : p;

      // A HASTE SAI DO ZERO. Sem isso, o pirulito vira um dot plot com um
      // rabo decorativo e a proporção mente como numa barra truncada.
      criarSvgEl('line', {
        pai: svg,
        classe: 'lp-haste',
        atributos: {
          x1: ehHorizontal ? posicaoDoZero : c,
          x2: ehHorizontal ? p : c,
          y1: ehHorizontal ? c : posicaoDoZero,
          y2: ehHorizontal ? c : p,
          stroke: item.cor,
          'stroke-width': espessura,
        },
      });

      const doce = criarSvgEl('circle', {
        pai: svg,
        classe: 'lp-doce',
        atributos: {
          cx: item.px,
          cy: item.py,
          // Raio FIXO: a posição já codifica o valor.
          r: raioDoDoce,
          fill: item.cor,
          stroke: tema.fundo,
          'stroke-width': 1,
          'data-chave': item.chave,
        },
      });
      desenhados.push({ elemento: doce, item });

      if (config.escreverValores !== false && escalaDeCategoria.bandwidth() >= 10) {
        const paraFrente = item.valor >= 0 ? 1 : -1;
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'lp-valor',
          atributos: {
            x: ehHorizontal ? item.px + paraFrente * (raioDoDoce + 4) : item.px,
            y: ehHorizontal ? item.py : item.py - paraFrente * (raioDoDoce + 4),
            'text-anchor': ehHorizontal ? (item.valor >= 0 ? 'start' : 'end') : 'middle',
            'dominant-baseline': 'central',
            'font-size': Math.max(8, tema.tamanhoBase - 2),
            fill: tema.textoSuave,
          },
        });
        definirTexto(texto, formatar(item.valor));
      }
    });

    // ---------- Nota ----------
    const total = itens.reduce((a, i) => a + Math.abs(i.valor), 0);
    const nota = criarEl('div', { classe: 'lp-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${itens.length} categorias`,
        'a haste sai do ZERO: ela é comprimento, e comprimento truncado distorce a proporção',
        'o círculo tem tamanho fixo — quem codifica o valor é a posição',
        referencia !== null ? `referência em ${formatar(referencia)}` : null,
        'para eixo cortado (comparar valores próximos), use o Dot Plot Denso',
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    for (const { elemento, item } of desenhados) {
      ctx.eventos.on(elemento, 'pointerenter', (ev) => {
        elemento.setAttribute('r', String(raioDoDoce * 1.4));
        if (!tooltip) return;
        tooltip.mostrar(
          {
            titulo: item.rotulo,
            linhas: [
              { rotulo: medida.rotuloCurto, valor: formatar(item.valor), cor: item.cor },
              { rotulo: 'Do total (em módulo)', valor: formatarPercentual(Math.abs(item.valor) / (total || 1), 1) },
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
      ctx.eventos.on(elemento, 'pointerleave', () => {
        elemento.setAttribute('r', String(raioDoDoce));
        if (tooltip) tooltip.esconder();
      });
      ctx.eventos.on(elemento, 'click', (ev) => {
        const celula = modelo.celula(modelo.linhas[item.indiceDaLinha], campoDaCategoria.nome);
        if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

export function ordenarItens(itens, modo = 'valorDesc') {
  const copia = itens.slice();
  if (modo === 'valorAsc') copia.sort((a, b) => a.valor - b.valor);
  else if (modo === 'alfabetica') copia.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  else if (modo !== 'consulta') copia.sort((a, b) => b.valor - a.valor);
  return copia;
}

export function calcularReferencia(valores, config = {}) {
  const modo = config.referencia || 'nenhuma';
  if (modo === 'nenhuma' || !valores.length) return null;
  if (modo === 'fixo') {
    const v = Number(config.valorDaReferencia);
    return Number.isFinite(v) ? v : 0;
  }
  if (modo === 'media') return valores.reduce((a, b) => a + b, 0) / valores.length;
  const ordenados = valores.slice().sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}
