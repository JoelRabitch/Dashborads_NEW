/**
 * correlacao_matriz — "Matriz de Correlação".
 *
 * O mapa de calor de todas as medidas contra todas. É o primo do
 * `matriz_dispersao` sem as nuvens: cabe muito mais variável na tela (uma
 * matriz 25 × 25 é legível; um SPLOM 25 × 25 não existe), e a pergunta é
 * outra — não "como é a relação deste par" e sim **"que blocos de
 * variáveis andam juntos"**.
 *
 * Três decisões, todas com consequência direta na leitura:
 *
 * 1. **Escala divergente, centrada em zero e fixa em [−1, +1].** Uma
 *    escala sequencial faria correlação zero parecer "média" em vez de
 *    "nenhuma", e uma escala ajustada aos dados faria r = 0,3 parecer
 *    forte só porque é o maior da matriz. O domínio é fixo de propósito.
 * 2. **Pearson ou Spearman.** Pearson mede relação LINEAR; Spearman, sobre
 *    postos, mede relação MONÓTONA. Quando os dois discordam muito há
 *    curvatura ou outlier — e o gráfico oferece a comparação direta,
 *    porque essa discordância é informação.
 * 3. **Ordem das variáveis.** Agrupar por similaridade faz os blocos
 *    aparecerem; a mesma matriz na ordem da consulta parece ruído. Como a
 *    ordem muda completamente o que se vê, ela é declarada na tela.
 *
 * E duas ressalvas que o gráfico carrega sempre: o r é um número sobre
 * retas (quarteto de Anscombe), e com k medidas são k(k−1)/2 pares — a 5%,
 * cerca de 5% deles "dão significativo" por acaso.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { comOpacidade, textoLegivelSobre } from '../../core/theme.js';
import { misturarCores } from '../../core/scales.js';
import { truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { correlacaoDePearson, correlacaoDeSpearman } from '../../core/estatistica.js';
import { MINIMO_PARA_INFERENCIA, lerLinhasCompletas } from '../_dispersao/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.cm-area{position:relative;width:100%;height:100%;overflow:hidden;}
.cm-svg{position:absolute;left:0;top:0;}
.cm-celula{cursor:default;}
.cm-valor{pointer-events:none;}
.cm-nome{pointer-events:none;}
.cm-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
.cm-legenda{pointer-events:none;}
`;

/**
 * Acima disso os nomes das variáveis não cabem em nenhum tamanho de fonte
 * legível, e a matriz vira textura.
 */
const MAXIMO_DE_MEDIDAS = 40;

export default defineViz({
  id: 'correlacao_matriz',
  label: 'Matriz de Correlação',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        metodo: {
          type: 'string',
          label: 'Método',
          section: 'Correlação',
          display: 'select',
          default: 'pearson',
          values: listaDeValores([
            { rotulo: 'Pearson (relação linear)', valor: 'pearson' },
            { rotulo: 'Spearman (relação monótona, sobre postos)', valor: 'spearman' },
            { rotulo: 'Pearson abaixo, Spearman acima (comparar)', valor: 'ambos' },
          ]),
        },
        ordem: {
          type: 'string',
          label: 'Ordem das variáveis',
          section: 'Correlação',
          display: 'select',
          default: 'agrupada',
          values: listaDeValores([
            { rotulo: 'Agrupada por similaridade (blocos aparecem)', valor: 'agrupada' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
          ]),
        },
        triangulo: {
          type: 'string',
          label: 'Mostrar',
          section: 'Correlação',
          display: 'select',
          default: 'completa',
          values: listaDeValores([
            { rotulo: 'Matriz completa', valor: 'completa' },
            { rotulo: 'Só o triângulo inferior', valor: 'inferior' },
          ]),
        },
        escreverValor: {
          type: 'boolean',
          label: 'Escrever o número dentro da célula',
          section: 'Correlação',
          default: true,
        },
        esconderFracos: {
          type: 'number',
          label: 'Apagar células com |r| abaixo de',
          section: 'Correlação',
          display: 'range',
          min: 0,
          max: 0.9,
          step: 0.05,
          default: 0,
        },
        corPositiva: {
          type: 'string',
          label: 'Cor da correlação positiva',
          section: 'Correlação',
          display: 'color',
          default: '#2563EB',
        },
        corNegativa: {
          type: 'string',
          label: 'Cor da correlação negativa',
          section: 'Correlação',
          display: 'color',
          default: '#DC2626',
        },
        mostrarLegendaDeCor: {
          type: 'boolean',
          label: 'Mostrar a régua de cor (−1 a +1)',
          section: 'Correlação',
          default: true,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    for (const medida of modelo.medidas) {
      saida[`usar_${medida.nome}`] = {
        type: 'boolean',
        label: `Incluir "${medida.rotuloCurto}"`,
        section: 'Medidas',
        default: true,
      };
    }
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    if (dimensoes.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoRotulo', 'Dimensão que identifica a linha', dimensoes, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: '',
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    let medidas = modelo.medidas.filter((m) => config[`usar_${m.nome}`] !== false);
    if (medidas.length < 2) medidas = modelo.medidas.slice();

    if (medidas.length < 2) {
      ctx.mostrarVazio(
        'Uma matriz de correlação precisa de pelo menos DUAS medidas. ' +
          'Traga mais medidas no Explore.'
      );
      return;
    }
    if (medidas.length > MAXIMO_DE_MEDIDAS) {
      ctx.avisar(
        `A consulta tem ${medidas.length} medidas. Mostrando as ${MAXIMO_DE_MEDIDAS} primeiras: ` +
          'acima disso os nomes não cabem em nenhum tamanho legível e a matriz vira textura.'
      );
      medidas = medidas.slice(0, MAXIMO_DE_MEDIDAS);
    }

    const { linhas, descartadas } = lerLinhasCompletas({ modelo, medidas });
    if (linhas.length < 3) {
      ctx.mostrarVazio(
        'Nenhuma (ou quase nenhuma) linha tem valor em todas as medidas escolhidas. ' +
          'Reduza as medidas da matriz ou verifique os nulos no Explore.'
      );
      return;
    }
    if (descartadas > 0) {
      ctx.avisar(
        `${descartadas} linha(s) sem valor em alguma das medidas ficaram de fora de TODOS os pares, ` +
          'para que as correlações sejam comparáveis entre si.'
      );
    }
    if (linhas.length < MINIMO_PARA_INFERENCIA) {
      ctx.avisar(
        `São ${linhas.length} linhas. Com tão poucas observações, um |r| alto aparece por acaso ` +
          'com frequência — nenhuma célula desta matriz sustenta conclusão.'
      );
    }

    // ---------- Correlações ----------
    const metodo = config.metodo || 'pearson';
    const pearson = calcularMatriz(linhas, medidas.length, correlacaoDePearson);
    const spearman =
      metodo === 'pearson' ? null : calcularMatriz(linhas, medidas.length, correlacaoDeSpearman);

    // A ordem é calculada sobre a matriz do método PRINCIPAL. Com os dois
    // métodos na tela, o principal é Pearson (o do triângulo inferior).
    const ordem = ordenarVariaveis({
      matriz: pearson,
      medidas,
      modo: config.ordem || 'agrupada',
    });

    const k = medidas.length;
    const rotulos = ordem.map((indice) => medidas[indice].rotuloCurto);

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'cm');
    const area = criarEl('div', { classe: 'cm-area', pai: raiz });

    const fonte = Math.max(7, Math.min(tema.tamanhoBase, 420 / Math.max(1, k)));
    const maiorRotulo = rotulos.reduce((a, r) => Math.max(a, r.length), 0);
    const margemEsquerda = Math.min(largura * 0.32, 12 + maiorRotulo * fonte * 0.52);
    const margemDeCima = Math.min(altura * 0.32, 12 + maiorRotulo * fonte * 0.52);
    const comLegenda = config.mostrarLegendaDeCor !== false;
    const margemDireita = comLegenda ? 54 : 10;
    const margemDeBaixo = 18;

    const lado = Math.max(
      6,
      Math.min(
        (largura - margemEsquerda - margemDireita) / k,
        (altura - margemDeCima - margemDeBaixo) / k
      )
    );

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'cm-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const corPositiva = config.corPositiva || tema.destaque;
    const corNegativa = config.corNegativa || tema.negativo;
    const corDe = (r) => corDaCorrelacao(r, { corPositiva, corNegativa, fundo: tema.fundo });

    const soInferior = (config.triangulo || 'completa') === 'inferior';
    const limiar = Number(config.esconderFracos) || 0;
    const escrever = config.escreverValor !== false && lado >= 22;

    // ---------- Células ----------
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        if (soInferior && j > i) continue;

        const x = margemEsquerda + j * lado;
        const y = margemDeCima + i * lado;

        // No modo "ambos", o triângulo superior é Spearman: é a comparação
        // direta entre o par de métodos no mesmo olhar.
        const usarSpearman = metodo === 'spearman' || (metodo === 'ambos' && j > i);
        const matriz = usarSpearman ? spearman : pearson;
        const r = matriz[ordem[i]][ordem[j]];

        const apagada = r === null || (i !== j && Math.abs(r) < limiar);

        criarSvgEl('rect', {
          pai: svg,
          classe: 'cm-celula',
          atributos: {
            x, y, width: lado, height: lado,
            fill: apagada ? comOpacidade(tema.borda, 0.25) : corDe(r),
            stroke: tema.fundo,
            'stroke-width': lado > 14 ? 1 : 0.5,
          },
        });

        if (escrever && !apagada) {
          const texto = criarSvgEl('text', {
            pai: svg,
            classe: 'cm-valor',
            atributos: {
              x: x + lado / 2,
              y: y + lado / 2,
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'font-size': Math.min(fonte + 1, lado * 0.36),
              fill: textoLegivelSobre(corDe(r), tema),
            },
          });
          definirTexto(texto, formatarR(r));
        }
      }
    }

    // ---------- Nomes ----------
    rotulos.forEach((rotulo, i) => {
      const nomeY = criarSvgEl('text', {
        pai: svg,
        classe: 'cm-nome',
        atributos: {
          x: margemEsquerda - 5,
          y: margemDeCima + i * lado + lado / 2,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      definirTexto(nomeY, truncar(rotulo, 28));

      const x = margemEsquerda + i * lado + lado / 2;
      const y = margemDeCima - 5;
      const nomeX = criarSvgEl('text', {
        pai: svg,
        classe: 'cm-nome',
        atributos: {
          x,
          y,
          'text-anchor': 'start',
          'font-size': fonte,
          fill: tema.texto,
          transform: `rotate(-90 ${x} ${y})`,
        },
      });
      definirTexto(nomeX, truncar(rotulo, 28));
    });

    // ---------- Régua de cor ----------
    if (comLegenda) {
      desenharRegua({
        svg,
        x: largura - margemDireita + 12,
        y: margemDeCima,
        altura: Math.max(40, k * lado),
        corDe,
        tema,
        fonte,
      });
    }

    // ---------- Nota ----------
    const pares = (k * (k - 1)) / 2;
    const nota = criarEl('div', { classe: 'cm-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${k} medidas · ${pares} pares · ${linhas.length} linhas`,
        `ordem ${nomeDaOrdem(config.ordem)}`,
        nomeDoMetodo(metodo),
        'escala fixa de −1 a +1',
        `com ${pares} pares, ~${Math.max(1, Math.round(pares * 0.05))} "dão significativo" por acaso a 5%`,
        'e o r é um número sobre RETAS (quarteto de Anscombe)',
      ].join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixa = area.getBoundingClientRect();
      const j = Math.floor((ev.clientX - caixa.left - margemEsquerda) / lado);
      const i = Math.floor((ev.clientY - caixa.top - margemDeCima) / lado);
      if (i < 0 || j < 0 || i >= k || j >= k || (soInferior && j > i)) {
        tooltip.esconder();
        return;
      }

      const rP = pearson[ordem[i]][ordem[j]];
      const rS = spearman ? spearman[ordem[i]][ordem[j]] : null;
      const linhasDoTooltip = [
        { rotulo: 'Pearson (linear)', valor: rP === null ? '—' : rP.toFixed(4) },
        { rotulo: 'R²', valor: rP === null ? '—' : (rP * rP).toFixed(4) },
      ];
      if (rS !== null) {
        linhasDoTooltip.push({ rotulo: 'Spearman (monótona)', valor: rS.toFixed(4) });
        // A discordância entre os dois é informação, não ruído: ela aponta
        // curvatura ou outlier no par.
        if (rP !== null && Math.abs(rS) - Math.abs(rP) > 0.15) {
          linhasDoTooltip.push({
            rotulo: 'Leitura',
            valor: 'relação monótona mas não linear (curvatura ou outlier)',
          });
        }
      }
      linhasDoTooltip.push({ rotulo: 'Observações', valor: String(linhas.length) });

      tooltip.mostrar(
        {
          titulo:
            i === j
              ? medidas[ordem[i]].rotuloCurto
              : `${medidas[ordem[j]].rotuloCurto} × ${medidas[ordem[i]].rotuloCurto}`,
          linhas: linhasDoTooltip,
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function nomeDoMetodo(metodo) {
  if (metodo === 'spearman') return 'Spearman (postos)';
  if (metodo === 'ambos') return 'Pearson abaixo, Spearman acima';
  return 'Pearson';
}

function nomeDaOrdem(modo) {
  if (modo === 'consulta') return 'da consulta';
  if (modo === 'alfabetica') return 'alfabética';
  return 'agrupada por similaridade';
}

/** `0,82`, com vírgula e sem o zero da frente quando o espaço é pouco. */
export function formatarR(r) {
  if (r === null || !Number.isFinite(r)) return '—';
  if (Math.abs(r) >= 0.995) return r.toFixed(1).replace('.', ',');
  return r.toFixed(2).replace('.', ',');
}

/**
 * Matriz k × k de correlações.
 *
 * Simétrica por construção (calcula só metade e espelha) e com 1 exato na
 * diagonal — a correlação de uma variável com ela mesma não precisa passar
 * por ponto flutuante para dar 1.
 */
export function calcularMatriz(linhas, k, correlacao) {
  const matriz = Array.from({ length: k }, () => new Array(k).fill(null));
  for (let i = 0; i < k; i++) {
    matriz[i][i] = 1;
    for (let j = i + 1; j < k; j++) {
      const r = correlacao(linhas.map((l) => ({ x: l.valores[j], y: l.valores[i] })));
      matriz[i][j] = r;
      matriz[j][i] = r;
    }
  }
  return matriz;
}

/**
 * Cor divergente centrada em zero, com domínio FIXO em [−1, +1].
 *
 * O domínio fixo é a decisão: ajustá-lo aos dados faria r = 0,3 parecer
 * forte numa matriz fraca, e r = 0,8 parecer médio numa matriz forte. Uma
 * cor de correlação precisa significar a mesma coisa em qualquer matriz.
 */
export function corDaCorrelacao(r, { corPositiva, corNegativa, fundo }) {
  if (r === null || !Number.isFinite(r)) return fundo;
  const intensidade = Math.min(1, Math.abs(r));
  return misturarCores(fundo, r >= 0 ? corPositiva : corNegativa, intensidade);
}

/**
 * Ordem das variáveis.
 *
 * O agrupamento é hierárquico por ligação média, com distância
 * `1 − |r|`: variáveis que se explicam (para qualquer lado) ficam perto.
 * Usar `1 − r` em vez de `1 − |r|` separaria pares fortemente NEGATIVOS,
 * que são tão informativos quanto os positivos.
 *
 * O resultado muda completamente a leitura — a mesma matriz na ordem da
 * consulta parece ruído e agrupada mostra blocos — e por isso a ordem
 * usada é declarada na tela.
 *
 * @returns {number[]} índices das medidas na ordem de exibição
 */
export function ordenarVariaveis({ matriz, medidas, modo = 'agrupada' }) {
  const k = medidas.length;
  const indices = Array.from({ length: k }, (_, i) => i);

  if (modo === 'consulta') return indices;
  if (modo === 'alfabetica') {
    return indices.sort((a, b) =>
      medidas[a].rotuloCurto.localeCompare(medidas[b].rotuloCurto, 'pt-BR')
    );
  }

  // Cada variável começa no próprio grupo.
  let grupos = indices.map((i) => ({ membros: [i] }));

  const distancia = (a, b) => {
    // Ligação MÉDIA: a distância entre dois grupos é a média das distâncias
    // entre seus membros. Ligação simples ("o par mais próximo manda")
    // produz cadeias longas e nenhum bloco visível, que é justamente o que
    // o agrupamento deveria revelar.
    let soma = 0;
    let conta = 0;
    for (const i of a.membros) {
      for (const j of b.membros) {
        const r = matriz[i][j];
        soma += r === null ? 1 : 1 - Math.abs(r);
        conta += 1;
      }
    }
    return conta ? soma / conta : 1;
  };

  while (grupos.length > 1) {
    let melhorA = 0;
    let melhorB = 1;
    let menor = Infinity;
    for (let a = 0; a < grupos.length; a++) {
      for (let b = a + 1; b < grupos.length; b++) {
        const d = distancia(grupos[a], grupos[b]);
        if (d < menor) {
          menor = d;
          melhorA = a;
          melhorB = b;
        }
      }
    }
    const juntos = { membros: [...grupos[melhorA].membros, ...grupos[melhorB].membros] };
    grupos = grupos.filter((_, i) => i !== melhorA && i !== melhorB);
    grupos.push(juntos);
  }

  return grupos[0].membros;
}

function desenharRegua({ svg, x, y, altura, corDe, tema, fonte }) {
  const passos = 24;
  const alturaDoPasso = altura / passos;
  for (let i = 0; i < passos; i++) {
    const r = 1 - (2 * i) / (passos - 1);
    criarSvgEl('rect', {
      pai: svg,
      classe: 'cm-legenda',
      atributos: {
        x,
        y: y + i * alturaDoPasso,
        width: 12,
        height: alturaDoPasso + 0.5,
        fill: corDe(r),
      },
    });
  }
  for (const marca of [
    { r: 1, p: 0 },
    { r: 0, p: 0.5 },
    { r: -1, p: 1 },
  ]) {
    const texto = criarSvgEl('text', {
      pai: svg,
      classe: 'cm-legenda',
      atributos: {
        x: x + 15,
        y: y + altura * marca.p + (marca.p === 0 ? 4 : marca.p === 1 ? -2 : 0),
        'dominant-baseline': 'central',
        'font-size': Math.max(8, fonte - 1),
        fill: tema.textoSuave,
      },
    });
    definirTexto(texto, marca.r > 0 ? '+1' : String(marca.r));
  }
}
