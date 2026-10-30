/**
 * upset_plot — "UpSet Plot".
 *
 * A alternativa ao diagrama de Venn quando há mais de 5 conjuntos (onde o
 * Venn deixa de existir) ou quando as interseções pequenas importam: uma
 * barra por interseção, ordenada por tamanho, e embaixo uma matriz de
 * pontos dizendo QUAIS conjuntos formam cada uma.
 *
 * Reaproveita o leitor de conjuntos do `diagrama_venn`, que já entende os
 * três formatos de entrada (uma linha por região, item × conjunto, ou
 * colunas sim/não) e lê `formatoDosDados`, `separadorDeConjuntos`,
 * `medirPor` e `maximoDeConjuntos`.
 *
 * Correções v2: o valor acima de cada barra passa pela função única de
 * rótulos (`rotulos.js`: mostrar, tamanho, cor, negrito, rotação, posição
 * acima/dentro/centro, conteúdo, formato, casas, truncar, esconder
 * sobrepostos) — "Escrever o valor acima da barra" e "Mostrar o percentual"
 * continuam valendo. A aba Cores vale: paleta (a 1ª cor, respeitando
 * "Inverter ordem das cores"), opacidade e contorno das barras. O tooltip é
 * o único do gráfico, com os números no formato do campo (ou o texto do
 * Looker, quando a interseção vem de uma linha), e o clique segue a "Ação
 * do clique" (drill quando há links; senão fixa o tooltip).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { comOpacidade, textoLegivelSobre } from '../../core/theme.js';
import { lerRotulos, textoDoRotulo, criarRotuloSvg, esconderColisoes, larguraDoTexto, posicaoEfetiva } from '../../core/rotulos.js';
import { paletaDoConfig, lerContorno, aplicarContorno, aplicarPreenchimento } from '../../core/cores.js';
import {
  montarOpcoes,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';
import { lerConjuntos, rotuloDaRegiao } from '../diagrama_venn/dados.js';

const CSS = `
.up-area{position:relative;width:100%;height:100%;overflow:hidden;}
.up-barra{cursor:pointer;transition:opacity .15s ease;}
.up-apagada{opacity:.25;}
.up-texto{pointer-events:none;}
.up-valor{pointer-events:none;}
.up-ponto{pointer-events:none;}
.up-faixa{pointer-events:none;}
@media (prefers-reduced-motion: reduce){.up-barra{transition:none;}}
`;

export default defineViz({
  id: 'upset_plot',
  label: 'UpSet Plot',
  opcoes: montarOpcoes(
    blocoDeCores({ comEscalaPorValor: false }),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado(),
    {
      formatoDosDados: {
        type: 'string',
        label: 'Como os dados estão organizados',
        section: 'Dados',
        display: 'select',
        default: 'auto',
        values: listaDeValores([
          { rotulo: 'Detectar sozinho', valor: 'auto' },
          { rotulo: 'Uma linha por região ("A", "A,B")', valor: 'regioes' },
          { rotulo: 'Uma linha por item e conjunto', valor: 'itemConjunto' },
          { rotulo: 'Colunas sim/não (uma por conjunto)', valor: 'booleanas' },
        ]),
      },
      separadorDeConjuntos: {
        type: 'string',
        label: 'Separador dos conjuntos na dimensão',
        section: 'Dados',
        default: ',',
      },
      medirPor: {
        type: 'string',
        label: 'O número mostrado é',
        section: 'Dados',
        display: 'select',
        default: 'itens',
        values: listaDeValores([
          { rotulo: 'Contagem de itens', valor: 'itens' },
          { rotulo: 'Soma da medida', valor: 'medida' },
        ]),
      },
      maximoDeConjuntos: {
        type: 'number',
        label: 'Máximo de conjuntos',
        section: 'Dados',
        display: 'range',
        min: 2,
        max: 20,
        step: 1,
        default: 12,
      },
      maximoDeIntersecoes: {
        type: 'number',
        label: 'Quantas interseções mostrar (as maiores)',
        section: 'Dados',
        display: 'range',
        min: 3,
        max: 60,
        step: 1,
        default: 20,
      },
      ordenarIntersecoes: {
        type: 'string',
        label: 'Ordem das barras',
        section: 'Dados',
        display: 'select',
        default: 'tamanho',
        values: listaDeValores([
          { rotulo: 'Por tamanho (maior primeiro)', valor: 'tamanho' },
          { rotulo: 'Por quantidade de conjuntos', valor: 'grau' },
        ]),
      },
      esconderIntersecoesVazias: {
        type: 'boolean',
        label: 'Esconder interseções sem nenhum item',
        section: 'Dados',
        default: true,
      },
      alturaDaMatriz: {
        type: 'number',
        label: 'Altura da matriz de pontos (% do gráfico)',
        section: 'Formato',
        display: 'range',
        min: 15,
        max: 70,
        step: 5,
        default: 40,
      },
      mostrarTotaisDosConjuntos: {
        type: 'boolean',
        label: 'Mostrar o total de cada conjunto à esquerda',
        section: 'Formato',
        default: true,
      },
      mostrarValorNaBarra: {
        type: 'boolean',
        label: 'Escrever o valor acima da barra',
        section: 'Rótulos',
        default: true,
      },
      mostrarPercentual: {
        type: 'boolean',
        label: 'Mostrar o percentual do total',
        section: 'Rótulos',
        default: false,
      },
    }
  ),
  exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const { conjuntos, regioes, totalPorConjunto, avisos, unidade, medida, linhasPorRegiao } = lerConjuntos(
      modelo,
      config,
      { maximoAbsoluto: 20 }
    );
    for (const aviso of avisos) ctx.avisar(aviso);

    if (conjuntos.length < 2) {
      ctx.mostrarVazio(
        'O UpSet precisa de pelo menos 2 conjuntos. ' +
          'Confira a opção "Como os dados estão organizados" na seção Dados.'
      );
      return;
    }

    // ---------- Interseções ----------
    let intersecoes = Array.from(regioes.entries()).map(([mascara, valor]) => ({
      mascara,
      valor,
      grau: contarBits(mascara),
      rotulo: rotuloDaRegiao(mascara, conjuntos),
    }));

    if (config.esconderIntersecoesVazias !== false) {
      intersecoes = intersecoes.filter((i) => i.valor > 0);
    }

    if (!intersecoes.length) {
      ctx.mostrarVazio('Nenhuma interseção tem valor.');
      return;
    }

    intersecoes.sort(
      config.ordenarIntersecoes === 'grau'
        ? (a, b) => a.grau - b.grau || b.valor - a.valor
        : (a, b) => b.valor - a.valor
    );

    const limite = Number(config.maximoDeIntersecoes) || 20;
    if (intersecoes.length > limite) {
      ctx.avisar(
        `A consulta tem ${intersecoes.length} interseções; mostrando as ${limite} maiores.`
      );
      intersecoes = intersecoes.slice(0, limite);
    }

    // Os conjuntos aparecem na matriz ordenados pelo próprio total: assim
    // as linhas de cima são as que mais importam.
    const ordemDosConjuntos = conjuntos
      .map((conjunto, i) => ({ conjunto, indice: i, total: totalPorConjunto.get(i) || 0 }))
      .sort((a, b) => b.total - a.total);

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'up');
    const area = criarEl('div', { classe: 'up-area', pai: raiz });
    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // Números SEMPRE formatados: value_format da medida somada, ou inteiro
    // quando é contagem de itens.
    const valueFormat = medida ? medida.valueFormat : undefined;
    const formatar = formatadorDeValueFormat(valueFormat, { casas: medida ? 2 : 0 });
    /** Texto do Looker quando a interseção vem de UMA linha. */
    const textoDoLooker = (mascara) => {
      const linhas = linhasPorRegiao.get(mascara);
      if (!medida || !linhas || linhas.length !== 1) return null;
      const t = modelo.texto(linhas[0], medida.nome, undefined, '');
      return t === '' ? null : t;
    };

    // ---------- Cores (aba Cores) ----------
    const paleta = paletaDoConfig(config);
    const corUnica = typeof config.corUnica === 'string' ? config.corUnica.trim() : '';
    const corDaBarra = corUnica || paleta[0] || tema.destaque;
    const contorno = contornoDasMarcas(config, tema);

    // ---------- Rótulos (função única) ----------
    const rot = lerRotulos(config, tema);
    const comValor = rot.mostrar && config.mostrarValorNaBarra !== false;
    const rotDoValor = { ...rot };
    if (config.mostrarPercentual && rot.conteudo === 'valor') rotDoValor.conteudo = 'valorPercentual';
    const posicao = posicaoEfetiva(rot, { cabeDentro: false });

    // ---------- Geometria ----------
    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const larguraDosNomes = config.mostrarTotaisDosConjuntos === false
      ? Math.min(140, largura * 0.2)
      : Math.min(220, largura * 0.3);
    const fracaoDaMatriz = Math.max(0.15, Math.min(0.7, (Number(config.alturaDaMatriz) || 40) / 100));

    const margemDoTopo = comValor && posicao === 'fora' ? rot.tamanho + 12 : 10;
    const alturaDaMatriz = (altura - margemDoTopo - 10) * fracaoDaMatriz;
    const alturaDasBarras = altura - margemDoTopo - alturaDaMatriz - 10;

    const xDasBarras = larguraDosNomes + 8;
    const larguraUtil = Math.max(20, largura - xDasBarras - 10);
    const passo = larguraUtil / intersecoes.length;
    const larguraDaBarra = Math.max(2, passo * 0.72);

    const alturaDaLinha = alturaDaMatriz / Math.max(1, ordemDosConjuntos.length);
    const maior = Math.max(...intersecoes.map((i) => i.valor));
    const totalGeral = intersecoes.reduce((a, i) => a + i.valor, 0);

    // ---------- Faixas da matriz (ajudam o olho a seguir a linha) ----------
    ordemDosConjuntos.forEach((item, linha) => {
      if (linha % 2) return;
      criarSvgEl('rect', {
        pai: svg,
        classe: 'up-faixa',
        atributos: {
          x: 0,
          y: margemDoTopo + alturaDasBarras + linha * alturaDaLinha,
          width: largura,
          height: alturaDaLinha,
          fill: comOpacidade(tema.textoSuave, 0.07),
        },
      });
    });

    // ---------- Nomes e totais dos conjuntos ----------
    ordemDosConjuntos.forEach((item, linha) => {
      const y = margemDoTopo + alturaDasBarras + linha * alturaDaLinha + alturaDaLinha / 2;
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'up-texto',
        atributos: {
          x: larguraDosNomes,
          y,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      const nome = truncar(item.conjunto.nome, Math.floor(larguraDosNomes / (fonte * 0.6)));
      definirTexto(
        texto,
        config.mostrarTotaisDosConjuntos === false ? nome : `${nome}  ${formatar(item.total)}`
      );
    });

    // ---------- Barras e matriz ----------
    const tooltip = ctx.tooltip();
    const barras = [];
    const caixas = [];

    intersecoes.forEach((intersecao, coluna) => {
      const cx = xDasBarras + coluna * passo + passo / 2;
      const alturaDaBarra = maior > 0 ? (intersecao.valor / maior) * alturaDasBarras : 0;
      const y = margemDoTopo + alturaDasBarras - alturaDaBarra;

      const barra = criarSvgEl('rect', {
        pai: svg,
        classe: 'up-barra',
        atributos: {
          x: cx - larguraDaBarra / 2,
          y,
          width: larguraDaBarra,
          height: Math.max(0, alturaDaBarra),
          rx: 1,
          'data-item': intersecao.mascara,
        },
      });
      aplicarPreenchimento(barra, corDaBarra, config);
      aplicarContorno(barra, contorno);
      barras.push(barra);

      const textoLooker = textoDoLooker(intersecao.mascara);
      const textoDoValor = textoLooker !== null ? textoLooker : formatar(intersecao.valor);

      if (comValor) {
        const texto = textoDoRotulo(rotDoValor, {
          valor: intersecao.valor,
          nome: intersecao.rotulo,
          total: totalGeral,
          valueFormat,
          textoDoValor: textoLooker === null ? undefined : textoLooker,
        });
        // Acima da barra (padrão), dentro do topo ou no centro dela.
        let yDoTexto = y - 3 - rot.tamanho / 2;
        let corAutomatica = tema.textoSuave;
        if (posicao === 'dentro' || posicao === 'centro') {
          yDoTexto = posicao === 'centro' ? y + alturaDaBarra / 2 : y + 3 + rot.tamanho / 2;
          corAutomatica = textoLegivelSobre(corDaBarra, tema);
        }
        const el = criarRotuloSvg(svg, rot, { x: cx, y: yDoTexto, texto, corAutomatica });
        if (el) {
          el.setAttribute('class', 'bl-rotulo up-valor');
          caixas.push({ el, x: cx, y: yDoTexto, largura: larguraDoTexto(texto, rot.tamanho), altura: rot.tamanho });
        }
      }

      // --- Pontos da matriz ---
      const linhasAtivas = [];
      ordemDosConjuntos.forEach((item, linha) => {
        const participa = (intersecao.mascara & (1 << item.indice)) !== 0;
        const cy = margemDoTopo + alturaDasBarras + linha * alturaDaLinha + alturaDaLinha / 2;
        if (participa) linhasAtivas.push(cy);
        criarSvgEl('circle', {
          pai: svg,
          classe: 'up-ponto',
          atributos: {
            cx,
            cy,
            r: Math.max(2, Math.min(passo * 0.22, alturaDaLinha * 0.3)),
            fill: participa ? corDaBarra : comOpacidade(tema.textoSuave, 0.22),
          },
        });
      });

      // A linha que liga os pontos é o que deixa a interseção legível de
      // relance: sem ela o olho precisa conferir ponto a ponto.
      if (linhasAtivas.length > 1) {
        criarSvgEl('line', {
          pai: svg,
          classe: 'up-ponto',
          atributos: {
            x1: cx,
            x2: cx,
            y1: Math.min(...linhasAtivas),
            y2: Math.max(...linhasAtivas),
            stroke: corDaBarra,
            'stroke-width': Math.max(1.5, passo * 0.1),
          },
        });
      }

      // --- Tooltip, destaque e clique ---
      const percentual = totalGeral ? formatarPercentual(intersecao.valor / totalGeral, 1) : '';
      const conteudo = () => {
        const linhas = [
          { rotulo: unidade || 'Valor', valor: textoDoValor, cor: corDaBarra },
          { rotulo: 'Conjuntos', valor: String(intersecao.grau) },
        ];
        if (percentual) linhas.push({ rotulo: 'Do total', valor: percentual });
        return {
          titulo: intersecao.rotulo,
          linhas,
          variaveis: { categoria: intersecao.rotulo, valor: textoDoValor, serie: intersecao.rotulo, percentual },
        };
      };

      ctx.eventos.on(barra, 'pointerenter', (ev) => {
        barras.forEach((outra, i) => outra.classList.toggle('up-apagada', i !== coluna));
        if (tooltip) tooltip.mostrar(conteudo(), ev.clientX, ev.clientY);
      });
      ctx.eventos.on(barra, 'pointermove', (ev) => {
        if (tooltip) tooltip.mover(ev.clientX, ev.clientY);
      });
      ctx.eventos.on(barra, 'pointerleave', () => {
        barras.forEach((outra) => outra.classList.remove('up-apagada'));
        if (tooltip) tooltip.esconder();
      });
      ctx.eventos.on(barra, 'click', (ev) => {
        ctx.cliqueNoItem(ev, celulaDaIntersecao(modelo, medida, linhasPorRegiao.get(intersecao.mascara)), conteudo());
      });
    });

    esconderColisoes(caixas, rot);
  },
});

/** Célula da interseção (com os links de drill) quando ela vem de UMA linha. */
function celulaDaIntersecao(modelo, medida, linhas) {
  if (!linhas || linhas.length !== 1) return null;
  const candidatas = [];
  if (medida) candidatas.push(modelo.celula(linhas[0], medida.nome));
  if (modelo.dimensoes[0]) candidatas.push(modelo.celula(linhas[0], modelo.dimensoes[0].nome));
  return candidatas.find((c) => c && Array.isArray(c.links) && c.links.length) || candidatas[0] || null;
}

/**
 * Contorno das barras. "Cor do contorno" deixada no padrão do painel
 * (#FFFFFF) é "automática": a "Cor da borda" do tema, se escolhida, ou a
 * cor de fundo (o contorno separa a barra do fundo sem aparecer).
 */
function contornoDasMarcas(config, tema) {
  const escolhida = String(config.corDoContorno || '').trim();
  const automatica = !escolhida || escolhida.toUpperCase() === '#FFFFFF';
  const corDaBorda = String(config.corDaBorda || '').trim();
  return lerContorno({ ...config, corDoContorno: automatica ? '' : escolhida }, tema, {
    corPadrao: corDaBorda ? tema.borda : tema.fundo,
  });
}

/** Quantos conjuntos participam de uma máscara. */
function contarBits(mascara) {
  let n = 0;
  let m = mascara;
  while (m) {
    n += m & 1;
    m >>= 1;
  }
  return n;
}
