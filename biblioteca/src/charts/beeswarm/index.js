/**
 * beeswarm — "Beeswarm".
 *
 * Um ponto por OBSERVAÇÃO, deslocado perpendicularmente ao eixo só o
 * bastante para não cobrir o vizinho. É o gráfico de distribuição para
 * quando cada observação importa: nada é estimado, nada é resumido, e
 * valores repetidos aparecem como uma faixa larga em vez de sumirem um
 * atrás do outro.
 *
 * É o complemento do violino, não um substituto: o violino mostra a forma
 * estimada e aguenta milhares de pontos; o beeswarm mostra os pontos de
 * verdade e perde o sentido quando são muitos.
 *
 * O empacotamento é o problema interessante. Comparar cada ponto com todos
 * os já colocados é O(n²) e trava com alguns milhares. Aqui, para cada
 * ponto, só os vizinhos a menos de um diâmetro NO EIXO podem colidir —
 * eles definem intervalos proibidos de deslocamento, e escolhemos o
 * deslocamento válido mais perto do centro.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica, escalaDeBanda } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat } from '../../core/format.js';
import { acharMaisProximo } from '../../core/interaction.js';
import { desenharSimboloNoCanvas } from '../../core/shapes.js';
import {
  opcoesDeDistribuicao,
  opcoesDinamicasDeDistribuicao,
  prepararDistribuicoes,
  rotuloDaCategoria,
  linhasDeResumo,
} from '../_distribuicao/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.bs-area{position:relative;width:100%;height:100%;}
.bs-canvas{position:absolute;left:0;top:0;}
.bs-svg{position:absolute;left:0;top:0;}
.bs-marca{pointer-events:none;}
.bs-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso, SVG trava; o canvas desenha numa passada. */
const LIMITE_PARA_CANVAS = 2000;

/** Acima disso o beeswarm deixa de ser um beeswarm e vira uma mancha. */
const LIMITE_DE_PONTOS = 20000;

export default defineViz({
  id: 'beeswarm',
  label: 'Beeswarm',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeDistribuicao({ maximoPadrao: 20 }),
      {
        orientacao: {
          type: 'string',
          label: 'Direção',
          section: 'Beeswarm',
          display: 'select',
          default: 'vertical',
          values: listaDeValores([
            { rotulo: 'Categorias no eixo X (enxames verticais)', valor: 'vertical' },
            { rotulo: 'Categorias no eixo Y (enxames horizontais)', valor: 'horizontal' },
          ]),
        },
        tamanhoDoPonto: {
          type: 'number',
          label: 'Tamanho do ponto',
          section: 'Beeswarm',
          display: 'range',
          min: 1,
          max: 16,
          step: 0.5,
          default: 4,
        },
        espacoEntrePontos: {
          type: 'number',
          label: 'Folga entre pontos (px)',
          section: 'Beeswarm',
          display: 'range',
          min: 0,
          max: 6,
          step: 0.5,
          default: 0.5,
        },
        opacidadeDoPonto: {
          type: 'number',
          label: 'Opacidade',
          section: 'Beeswarm',
          display: 'range',
          min: 0.1,
          max: 1,
          step: 0.05,
          default: 0.85,
        },
        formaDoPonto: {
          type: 'string',
          label: 'Forma',
          section: 'Beeswarm',
          display: 'select',
          default: 'circulo',
          values: listaDeValores([
            { rotulo: 'Círculo', valor: 'circulo' },
            { rotulo: 'Quadrado', valor: 'quadrado' },
            { rotulo: 'Losango', valor: 'losango' },
          ]),
        },
        mostrarMediana: {
          type: 'boolean',
          label: 'Traço na mediana de cada categoria',
          section: 'Beeswarm',
          default: true,
        },
        mostrarQuartis: {
          type: 'boolean',
          label: 'Traços nos quartis',
          section: 'Beeswarm',
          default: false,
        },
        destacarOutliers: {
          type: 'boolean',
          label: 'Colorir os pontos fora de 1,5 × IQR',
          section: 'Beeswarm',
          default: true,
        },
      }
    ),
    { rotacaoRotuloEixoX: 25, gradeEixoY: true }
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    return opcoesDinamicasDeDistribuicao(modelo);
  },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const preparo = prepararDistribuicoes(ctx);
    if (preparo.erro) {
      ctx.mostrarVazio(preparo.erro);
      return;
    }

    const { grupos, medida, campoDaCategoria } = preparo;
    const totalDePontos = grupos.reduce((a, g) => a + g.valores.length, 0);

    if (totalDePontos > LIMITE_DE_PONTOS) {
      ctx.mostrarVazio(
        `São ${totalDePontos.toLocaleString('pt-BR')} observações. Um beeswarm existe para mostrar ` +
          'cada ponto, e acima de ~20 mil eles viram uma mancha sem informação. ' +
          'Use o Violin Plot, que mostra a forma da distribuição sem depender de ponto a ponto.'
      );
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'bs');
    const area = criarEl('div', { classe: 'bs-area', pai: raiz });

    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 1,
    });
    const ehVertical = (config.orientacao || 'vertical') === 'vertical';

    // ---------- Escalas ----------
    const todosOsValores = grupos.flatMap((g) => [g.resumo.minimo, g.resumo.maximo]);
    const rotulos = grupos.map((g) => rotuloDaCategoria(g, config));

    const margens = calcularMargens({
      rotulosY: ehVertical ? todosOsValores.map(formatar) : rotulos,
      rotulosX: ehVertical ? rotulos : todosOsValores.map(formatar),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaDeCategoria = escalaDeBanda({
      dominio: grupos.map((g) => g.chave),
      intervalo: ehVertical
        ? [retangulo.esquerda, retangulo.esquerda + retangulo.largura]
        : [retangulo.cima, retangulo.cima + retangulo.altura],
      config: { larguraDaBarra: 95, espacamentoEntreGrupos: 6 },
    });
    const escalaDeValor = escalaNumerica({
      valores: todosOsValores,
      intervalo: ehVertical
        ? [retangulo.cima + retangulo.altura, retangulo.cima]
        : [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config,
      eixo: ehVertical ? 'Y' : 'X',
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'bs-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const nomeDaCategoria = (chave) => {
      const g = grupos.find((item) => item.chave === chave);
      return g ? rotuloDaCategoria(g, config) : String(chave);
    };

    // `desenharEixos` só sabe desenhar banda no eixo X. Com as categorias no
    // Y, entregamos uma escala que se comporta como numérica (tem `ticks` e
    // devolve o CENTRO da faixa), em vez de duplicar o desenho do eixo aqui.
    const escalaDeCategoriaNoY = (chave) =>
      escalaDeCategoria(chave) + escalaDeCategoria.bandwidth() / 2;
    escalaDeCategoriaNoY.ticks = () => grupos.map((g) => g.chave);
    escalaDeCategoriaNoY.domain = () => grupos.map((g) => g.chave);

    desenharEixos({
      svg,
      escalaX: ehVertical ? escalaDeCategoria : escalaDeValor,
      escalaY: ehVertical ? escalaDeValor : escalaDeCategoriaNoY,
      area: retangulo,
      config,
      tema,
      rotulosDeBanda: ehVertical ? grupos.map((g) => g.chave) : null,
      formatarX: ehVertical ? nomeDaCategoria : formatar,
      formatarY: ehVertical ? formatar : nomeDaCategoria,
    });

    // ---------- Empacotamento ----------
    const raioDoPonto = (Number(config.tamanhoDoPonto) || 4) / 2;
    const folga = Number(config.espacoEntrePontos) || 0;
    const faixa = escalaDeCategoria.bandwidth();

    const paleta = coresDaPaleta(config.paleta);
    const pontos = [];
    let presos = 0;

    grupos.forEach((grupo, indice) => {
      const centro = escalaDeCategoria(grupo.chave) + faixa / 2;
      const cor = paleta[indice % paleta.length];
      grupo.cor = cor;

      const posicoes = empacotar({
        valores: grupo.valores,
        posicaoDoValor: (v) => escalaDeValor(v),
        raio: raioDoPonto + folga / 2,
        limite: faixa / 2,
      });
      presos += posicoes.estourou;

      const outliers = new Set(grupo.limites.outliers);
      for (const posicao of posicoes) {
        const ehOutlier = config.destacarOutliers !== false && outliers.has(posicao.valor);
        pontos.push({
          x: ehVertical ? centro + posicao.deslocamento : posicao.eixo,
          y: ehVertical ? posicao.eixo : centro + posicao.deslocamento,
          valor: posicao.valor,
          grupo,
          cor: ehOutlier ? tema.negativo : cor,
          ehOutlier,
        });
      }
    });

    if (presos > 0) {
      ctx.avisar(
        `${presos} ponto(s) não couberam na faixa da categoria e ficaram sobrepostos na borda. ` +
          'Diminua o tamanho do ponto, reduza o número de categorias ou use o Violin Plot, ' +
          'que não depende de caber ponto a ponto.'
      );
    }

    // ---------- Pontos ----------
    const opacidade = Number(config.opacidadeDoPonto) || 0.85;
    const forma = config.formaDoPonto || 'circulo';
    const usarCanvas = pontos.length > LIMITE_PARA_CANVAS;

    if (usarCanvas) {
      const canvas = criarEl('canvas', { classe: 'bs-canvas' });
      area.insertBefore(canvas, svg);
      const { ctx: pincel } = prepararCanvas(canvas, largura, altura);
      if (pincel) {
        pincel.globalAlpha = opacidade;
        for (const ponto of pontos) {
          pincel.fillStyle = ponto.cor;
          desenharSimboloNoCanvas(pincel, forma, ponto.x, ponto.y, raioDoPonto * 2);
          pincel.fill();
        }
        pincel.globalAlpha = 1;
      } else {
        ctx.avisar('O navegador não forneceu contexto 2D; os pontos não foram desenhados.');
      }
    } else {
      for (const ponto of pontos) {
        criarSvgEl('circle', {
          pai: svg,
          classe: 'bs-marca',
          atributos: {
            cx: ponto.x, cy: ponto.y, r: raioDoPonto,
            fill: ponto.cor, opacity: opacidade,
          },
        });
      }
    }

    // ---------- Traços de resumo ----------
    for (const grupo of grupos) {
      const centro = escalaDeCategoria(grupo.chave) + faixa / 2;
      const meia = faixa * 0.42;

      const traco = (valor, espessura, cor) => {
        const p = escalaDeValor(valor);
        criarSvgEl('line', {
          pai: svg,
          classe: 'bs-marca',
          atributos: {
            x1: ehVertical ? centro - meia : p,
            x2: ehVertical ? centro + meia : p,
            y1: ehVertical ? p : centro - meia,
            y2: ehVertical ? p : centro + meia,
            stroke: cor,
            'stroke-width': espessura,
          },
        });
      };

      if (config.mostrarQuartis) {
        traco(grupo.resumo.q1, 1, comOpacidade(tema.texto, 0.5));
        traco(grupo.resumo.q3, 1, comOpacidade(tema.texto, 0.5));
      }
      if (config.mostrarMediana !== false) traco(grupo.resumo.mediana, 2, tema.texto);
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'bs-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      `${totalDePontos.toLocaleString('pt-BR')} observações, uma por ponto` +
        (usarCanvas ? ' (desenhadas em canvas)' : '') +
        (preparo.pequenos.length ? ` · ${preparo.pequenos.length} categoria(s) com poucas observações` : '')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixa = area.getBoundingClientRect();
      const alvo = acharMaisProximo({
        itens: pontos,
        x: ev.clientX - caixa.left,
        y: ev.clientY - caixa.top,
        raio: Math.max(6, raioDoPonto + 4),
        obterX: (p) => p.x,
        obterY: (p) => p.y,
      });
      if (!alvo) {
        tooltip.esconder();
        return;
      }
      const linhas = [
        { rotulo: medida.rotuloCurto, valor: formatar(alvo.valor), cor: alvo.cor },
        ...linhasDeResumo(alvo.grupo, formatar),
      ];
      if (alvo.ehOutlier) linhas.push({ rotulo: 'Este ponto', valor: 'fora de 1,5 × IQR' });
      tooltip.mostrar({ titulo: alvo.grupo.rotulo, linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(area, 'click', (ev) => {
      if (!campoDaCategoria) return;
      const caixa = area.getBoundingClientRect();
      const alvo = acharMaisProximo({
        itens: pontos,
        x: ev.clientX - caixa.left,
        y: ev.clientY - caixa.top,
        raio: Math.max(6, raioDoPonto + 4),
        obterX: (p) => p.x,
        obterY: (p) => p.y,
      });
      if (!alvo) return;
      const celula = ctx.modelo.celula(ctx.modelo.linhas[alvo.grupo.indiceDaLinha], campoDaCategoria.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

/**
 * Espalha os pontos perpendicularmente ao eixo sem sobreposição.
 *
 * Para cada ponto, só os vizinhos a menos de um DIÂMETRO no eixo podem
 * colidir. Cada um deles proíbe um intervalo de deslocamentos — a meia
 * largura vem de Pitágoras: `√(d² − dx²)`, onde `d` é o diâmetro e `dx` a
 * distância no eixo. Escolhemos o deslocamento válido mais próximo de
 * zero, o que dá a forma de enxame.
 *
 * Como a lista é percorrida em ordem de valor e a janela de vizinhos é
 * local, o custo é O(n × densidade local), não O(n²).
 *
 * @returns {Array<{valor, eixo, deslocamento}>}
 */
export function empacotar({ valores, posicaoDoValor, raio, limite = Infinity }) {
  const diametro = raio * 2;
  let estourou = 0;
  const ordenados = valores
    .filter((v) => v !== null && Number.isFinite(v))
    .map((valor) => ({ valor, eixo: posicaoDoValor(valor) }))
    .sort((a, b) => a.eixo - b.eixo);

  const colocados = [];
  let inicioDaJanela = 0;

  for (const ponto of ordenados) {
    // A janela acompanha a varredura: pontos que já ficaram para trás mais
    // de um diâmetro não podem mais colidir com nada daqui para frente.
    while (inicioDaJanela < colocados.length && ponto.eixo - colocados[inicioDaJanela].eixo >= diametro) {
      inicioDaJanela += 1;
    }

    const proibidos = [];
    for (let i = inicioDaJanela; i < colocados.length; i++) {
      const vizinho = colocados[i];
      const dx = Math.abs(ponto.eixo - vizinho.eixo);
      if (dx >= diametro) continue;
      const meiaLargura = Math.sqrt(diametro * diametro - dx * dx);
      proibidos.push([vizinho.deslocamento - meiaLargura, vizinho.deslocamento + meiaLargura]);
    }

    const escolha = deslocamentoMaisProximoDeZero(proibidos, limite);
    ponto.deslocamento = escolha.deslocamento;
    if (escolha.preso) estourou += 1;
    colocados.push(ponto);
  }

  // Um enxame mais largo que a faixa da categoria não tem solução boa: os
  // pontos presos na borda SE COBREM, e o gráfico volta a mentir sobre
  // quantas observações existem. Quem chama precisa poder avisar.
  colocados.estourou = estourou;
  return colocados;
}

/**
 * Menor deslocamento (em módulo) que não cai em nenhum intervalo proibido.
 *
 * Os candidatos são sempre as BORDAS dos intervalos: se zero está livre,
 * é ele; senão, a solução ótima encosta em algum vizinho.
 */
function deslocamentoMaisProximoDeZero(proibidos, limite) {
  const livre = (x) => !proibidos.some(([de, ate]) => x > de + 1e-9 && x < ate - 1e-9);

  if (livre(0)) return { deslocamento: 0, preso: false };

  const candidatos = [];
  for (const [de, ate] of proibidos) {
    candidatos.push(de, ate);
  }
  candidatos.sort((a, b) => Math.abs(a) - Math.abs(b));

  for (const candidato of candidatos) {
    if (Math.abs(candidato) <= limite && livre(candidato)) {
      return { deslocamento: candidato, preso: false };
    }
  }

  // Nenhum deslocamento cabe na faixa da categoria: o enxame está mais
  // largo do que o espaço. Prendemos na borda, que é melhor do que deixar
  // o ponto invadir a categoria vizinha — mas marcamos como `preso`, porque
  // daqui em diante há sobreposição e isso precisa ser dito.
  const maisProximo = candidatos.find(livre);
  const bruto = maisProximo === undefined ? 0 : maisProximo;
  return { deslocamento: Math.max(-limite, Math.min(limite, bruto)), preso: true };
}
