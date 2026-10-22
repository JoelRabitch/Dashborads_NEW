/**
 * matriz_dispersao — "Matriz de Dispersão" (SPLOM).
 *
 * Uma grade com todos os pares de medidas: dispersão no triângulo
 * inferior, distribuição de cada variável na diagonal e o r de Pearson no
 * superior. Serve para a pergunta que nenhum gráfico de um par só
 * responde: "entre todas essas medidas, quais andam juntas?".
 *
 * **A ressalva que o gráfico precisa carregar:** o r do triângulo superior
 * é um número sobre RETAS. O quarteto de Anscombe são quatro nuvens
 * completamente diferentes com o mesmo r = 0,816. Por isso o painel do
 * número e o painel da forma ficam na mesma tela, espelhados: quem olha o
 * r tem a nuvem correspondente do outro lado da diagonal. E a nota diz
 * isso em voz alta.
 *
 * Desempenho: k medidas dão k² painéis e n × k(k−1)/2 pontos desenhados.
 * Com 6 medidas e 5.000 linhas são 75.000 pontos — todos vão para UM
 * canvas só, porque um canvas por painel seria 15 contextos e 15 cópias
 * da mesma conta.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica } from '../../core/scales.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { acharMaisProximo } from '../../core/interaction.js';
import {
  CSS_DISPERSAO,
  LIMITE_PARA_CANVAS,
  MINIMO_PARA_INFERENCIA,
  opcoesDePontos,
  desenharNuvem,
} from '../_dispersao/index.js';
import {
  correlacaoDePearson,
  densidadePorKernel,
  resumoDeDistribuicao,
} from '../../core/estatistica.js';
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
.md-grade{pointer-events:none;}
.md-nome{pointer-events:none;font-weight:600;}
.md-r{pointer-events:none;}
.md-eixo{pointer-events:none;}
.md-densidade{pointer-events:none;}
`;

/**
 * Acima disso cada painel fica com poucos pixels e nenhum mostra nada:
 * 8 medidas são 64 painéis, e numa tela de 900 px cada um teria ~100 px
 * de lado, descontadas as margens.
 */
const MAXIMO_DE_MEDIDAS = 8;

export default defineViz({
  id: 'matriz_dispersao',
  label: 'Matriz de Dispersão',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDePontos({ tamanhoPadrao: 3, opacidadePadrao: 0.45 }),
      {
        maximoDeMedidas: {
          type: 'number',
          label: 'Máximo de medidas na matriz',
          section: 'Matriz',
          display: 'range',
          min: 2,
          max: MAXIMO_DE_MEDIDAS,
          step: 1,
          default: 5,
        },
        trianguloSuperior: {
          type: 'string',
          label: 'Triângulo superior',
          section: 'Matriz',
          display: 'select',
          default: 'correlacao',
          values: listaDeValores([
            { rotulo: 'Correlação de Pearson (r)', valor: 'correlacao' },
            { rotulo: 'A mesma dispersão, espelhada', valor: 'dispersao' },
            { rotulo: 'Vazio', valor: 'vazio' },
          ]),
        },
        diagonal: {
          type: 'string',
          label: 'Diagonal',
          section: 'Matriz',
          display: 'select',
          default: 'densidade',
          values: listaDeValores([
            { rotulo: 'Densidade da variável', valor: 'densidade' },
            { rotulo: 'Só o nome', valor: 'nome' },
          ]),
        },
        colorirCorrelacao: {
          type: 'boolean',
          label: 'Colorir o r por sinal e intensidade',
          section: 'Matriz',
          default: true,
        },
        mostrarEixos: {
          type: 'boolean',
          label: 'Valores nos eixos da borda',
          section: 'Matriz',
          default: true,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    // Uma chave por medida: a matriz é cara, e escolher quais entram é a
    // primeira decisão do usuário.
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
          padrao: dimensoes[0].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    // ---------- Medidas ----------
    let medidas = modelo.medidas.filter((m) => config[`usar_${m.nome}`] !== false);
    if (medidas.length < 2) medidas = modelo.medidas.slice();

    if (medidas.length < 2) {
      ctx.mostrarVazio(
        'Uma matriz de dispersão precisa de pelo menos DUAS medidas. ' +
          'Traga mais medidas no Explore.'
      );
      return;
    }

    const limite = Math.min(MAXIMO_DE_MEDIDAS, Number(config.maximoDeMedidas) || 5);
    if (medidas.length > limite) {
      ctx.avisar(
        `A consulta tem ${medidas.length} medidas (${medidas.length ** 2} painéis). ` +
          `Mostrando as ${limite} primeiras: acima disso cada painel fica com poucos pixels ` +
          'e nenhum mostra nada. Escolha quais entram nas opções.'
      );
      medidas = medidas.slice(0, limite);
    }

    const k = medidas.length;
    const campoDoRotulo =
      config.campoDoRotulo === ''
        ? null
        : modelo.dimensoes.find((d) => d.nome === config.campoDoRotulo) || modelo.dimensoes[0] || null;

    // ---------- Linhas ----------
    // Uma linha só entra se tiver valor em TODAS as medidas: um ponto que
    // aparece em alguns painéis e some em outros faria as nuvens da mesma
    // matriz descreverem amostras diferentes.
    const linhas = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const valores = medidas.map((m) => modelo.valorNumerico(modelo.linhas[i], m.nome));
      if (valores.some((v) => v === null)) continue;
      linhas.push({
        indice: i,
        valores,
        rotulo: campoDoRotulo ? modelo.texto(modelo.linhas[i], campoDoRotulo.nome, undefined, '') : `#${i + 1}`,
      });
    }

    if (linhas.length < 2) {
      ctx.mostrarVazio(
        'Nenhuma linha tem valor em todas as medidas escolhidas. ' +
          'Reduza as medidas da matriz ou verifique os nulos no Explore.'
      );
      return;
    }
    const descartadas = modelo.linhas.length - linhas.length;
    if (descartadas > 0) {
      ctx.avisar(
        `${descartadas} linha(s) sem valor em alguma das medidas ficaram de fora de TODOS os painéis, ` +
          'para que todas as nuvens descrevam a mesma amostra.'
      );
    }
    if (linhas.length < MINIMO_PARA_INFERENCIA) {
      ctx.avisar(
        `São ${linhas.length} linhas. Com tão poucos pontos, um r alto aparece por acaso ` +
          'com frequência — os números do triângulo superior não sustentam conclusão.'
      );
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_DISPERSAO + CSS, 'md');
    const area = criarEl('div', { classe: 'dr-area', pai: raiz });

    const fonte = Math.max(8, tema.tamanhoBase - 2);
    const mostrarEixos = config.mostrarEixos !== false;
    const margemEsquerda = mostrarEixos ? 52 : 10;
    const margemDeBaixo = mostrarEixos ? 26 : 10;
    const margemDeCima = 8;
    const margemDireita = 10;
    const espaco = 4;

    const larguraUtil = Math.max(40, largura - margemEsquerda - margemDireita);
    const alturaUtil = Math.max(40, altura - margemDeCima - margemDeBaixo);
    const ladoX = (larguraUtil - espaco * (k - 1)) / k;
    const ladoY = (alturaUtil - espaco * (k - 1)) / k;

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'dr-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const formatadores = medidas.map((m) =>
      formatadorDeValueFormat(m.valueFormat, { casas: Number(config.casasDecimaisDoRotulo) || 1 })
    );

    // Uma escala por medida e por eixo: a de X vive na coluna, a de Y na
    // linha. É isso que faz o painel (i, j) comparar a medida j contra a i.
    const escalasX = medidas.map((m, j) =>
      escalaNumerica({
        valores: linhas.map((l) => l.valores[j]),
        intervalo: [
          margemEsquerda + j * (ladoX + espaco),
          margemEsquerda + j * (ladoX + espaco) + ladoX,
        ],
        config: {},
        eixo: 'X',
      })
    );
    const escalasY = medidas.map((m, i) =>
      escalaNumerica({
        valores: linhas.map((l) => l.valores[i]),
        intervalo: [
          margemDeCima + i * (ladoY + espaco) + ladoY,
          margemDeCima + i * (ladoY + espaco),
        ],
        config: {},
        eixo: 'Y',
      })
    );

    // ---------- Correlações ----------
    const correlacoes = [];
    for (let i = 0; i < k; i++) {
      correlacoes.push([]);
      for (let j = 0; j < k; j++) {
        correlacoes[i].push(
          i === j
            ? 1
            : correlacaoDePearson(linhas.map((l) => ({ x: l.valores[j], y: l.valores[i] })))
        );
      }
    }

    // ---------- Painéis ----------
    const modoSuperior = config.trianguloSuperior || 'correlacao';
    const paleta = coresDaPaleta(config.paleta);
    const corDoPonto = paleta[0];
    const raioDoPonto = (Number(config.tamanhoDoPonto) || 3) / 2;
    const opacidade = Number(config.opacidadeDoPonto) || 0.45;

    const todosOsPontos = [];

    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const caixa = {
          esquerda: margemEsquerda + j * (ladoX + espaco),
          cima: margemDeCima + i * (ladoY + espaco),
          largura: ladoX,
          altura: ladoY,
        };

        criarSvgEl('rect', {
          pai: svg,
          classe: 'md-grade',
          atributos: {
            x: caixa.esquerda, y: caixa.cima, width: caixa.largura, height: caixa.altura,
            fill: 'none', stroke: tema.borda, 'stroke-width': 1,
          },
        });

        if (i === j) {
          desenharDiagonal({ svg, caixa, medida: medidas[i], linhas, indice: i, escalaX: escalasX[j], config, tema, cor: paleta[i % paleta.length] });
          continue;
        }

        const ehSuperior = j > i;
        if (ehSuperior && modoSuperior === 'vazio') continue;

        if (ehSuperior && modoSuperior === 'correlacao') {
          desenharCorrelacao({ svg, caixa, r: correlacoes[i][j], config, tema, fonte });
          continue;
        }

        for (const linha of linhas) {
          todosOsPontos.push({
            px: escalasX[j](linha.valores[j]),
            py: escalasY[i](linha.valores[i]),
            linha,
            i,
            j,
          });
        }
      }
    }

    const { usouCanvas, contexto } = desenharNuvem({
      area,
      svg,
      pontos: todosOsPontos,
      largura,
      altura,
      raio: raioDoPonto,
      forma: config.formaDoPonto || 'circulo',
      opacidade,
      cor: corDoPonto,
      limite: LIMITE_PARA_CANVAS,
    });
    if (usouCanvas && !contexto) {
      ctx.avisar('O navegador não forneceu contexto 2D; os pontos não foram desenhados.');
    }

    // ---------- Eixos da borda ----------
    if (mostrarEixos) {
      for (let i = 0; i < k; i++) {
        const y = margemDeCima + i * (ladoY + espaco);
        for (const p of [0.08, 0.92]) {
          const valor = escalasY[i].invert(y + ladoY * p);
          const texto = criarSvgEl('text', {
            pai: svg,
            classe: 'md-eixo',
            atributos: {
              x: margemEsquerda - 4,
              y: y + ladoY * p,
              'text-anchor': 'end',
              'dominant-baseline': 'central',
              'font-size': fonte - 1,
              fill: tema.textoSuave,
            },
          });
          definirTexto(texto, formatadores[i](valor));
        }
      }
      for (let j = 0; j < k; j++) {
        const x = margemEsquerda + j * (ladoX + espaco);
        for (const p of [0.08, 0.92]) {
          const valor = escalasX[j].invert(x + ladoX * p);
          const texto = criarSvgEl('text', {
            pai: svg,
            classe: 'md-eixo',
            atributos: {
              x: x + ladoX * p,
              y: altura - margemDeBaixo + fonte + 2,
              'text-anchor': 'middle',
              'font-size': fonte - 1,
              fill: tema.textoSuave,
            },
          });
          definirTexto(texto, formatadores[j](valor));
        }
      }
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'dr-nota', pai: area });
    nota.style.color = tema.textoSuave;
    const partes = [`${k} medidas, ${k * k} painéis, ${linhas.length} linhas`];
    if (modoSuperior === 'correlacao') {
      partes.push(
        'o r é um número sobre RETAS: nuvens muito diferentes dão o mesmo r (quarteto de Anscombe), ' +
          'então olhe a dispersão espelhada antes de concluir'
      );
    }
    if (usouCanvas) partes.push('pontos em canvas');
    definirTexto(nota, partes.join(' · '));

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixa = area.getBoundingClientRect();
      const x = ev.clientX - caixa.left;
      const y = ev.clientY - caixa.top;

      const alvo = acharMaisProximo({
        itens: todosOsPontos,
        x,
        y,
        raio: Math.max(6, raioDoPonto + 4),
        obterX: (p) => p.px,
        obterY: (p) => p.py,
      });

      if (alvo) {
        const linhas2 = medidas.map((m, indice) => ({
          rotulo: m.rotuloCurto,
          valor: formatadores[indice](alvo.linha.valores[indice]),
          cor: indice === alvo.i || indice === alvo.j ? corDoPonto : undefined,
        }));
        tooltip.mostrar(
          { titulo: truncar(alvo.linha.rotulo, 40), linhas: linhas2 },
          ev.clientX,
          ev.clientY
        );
        return;
      }

      // Fora de um ponto, o painel sob o cursor ainda tem o que dizer: o
      // par de medidas e o r daquele par.
      const celula = celulaEm({ x, y, k, margemEsquerda, margemDeCima, ladoX, ladoY, espaco });
      if (!celula) {
        tooltip.esconder();
        return;
      }
      const r = correlacoes[celula.i][celula.j];
      tooltip.mostrar(
        {
          titulo:
            celula.i === celula.j
              ? medidas[celula.i].rotuloCurto
              : `${medidas[celula.j].rotuloCurto} × ${medidas[celula.i].rotuloCurto}`,
          linhas:
            celula.i === celula.j
              ? [{ rotulo: 'Diagonal', valor: 'distribuição da própria variável' }]
              : [
                  { rotulo: 'r de Pearson', valor: r === null ? '—' : r.toFixed(4) },
                  { rotulo: 'R²', valor: r === null ? '—' : (r * r).toFixed(4) },
                  { rotulo: 'Atenção', valor: 'r só mede relação LINEAR' },
                ],
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

/** Qual painel está sob um ponto da tela (ou `null` fora da grade). */
export function celulaEm({ x, y, k, margemEsquerda, margemDeCima, ladoX, ladoY, espaco }) {
  const j = Math.floor((x - margemEsquerda) / (ladoX + espaco));
  const i = Math.floor((y - margemDeCima) / (ladoY + espaco));
  if (i < 0 || j < 0 || i >= k || j >= k) return null;
  return { i, j };
}

function desenharDiagonal({ svg, caixa, medida, linhas, indice, escalaX, config, tema, cor }) {
  const nome = criarSvgEl('text', {
    pai: svg,
    classe: 'md-nome',
    atributos: {
      x: caixa.esquerda + caixa.largura / 2,
      y: caixa.cima + caixa.altura / 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': Math.max(9, Math.min(15, caixa.largura / 7)),
      fill: tema.texto,
    },
  });
  definirTexto(nome, truncar(medida.rotuloCurto, Math.max(6, Math.floor(caixa.largura / 7))));

  if ((config.diagonal || 'densidade') !== 'densidade') return;

  const valores = linhas.map((l) => l.valores[indice]);
  const resumo = resumoDeDistribuicao(valores);
  if (!resumo || resumo.n < 3 || resumo.minimo === resumo.maximo) return;

  const { curva, maximo } = densidadePorKernel({
    valores,
    pontos: 60,
    intervalo: [resumo.minimo, resumo.maximo],
  });
  if (!maximo) return;

  const base = caixa.cima + caixa.altura - 2;
  const alturaUtil = caixa.altura * 0.42;
  const pontos = curva.map(
    (p) => `${escalaX(p.x)},${base - (p.densidade / maximo) * alturaUtil}`
  );

  criarSvgEl('path', {
    pai: svg,
    classe: 'md-densidade',
    atributos: {
      d: `M${escalaX(curva[0].x)},${base}L${pontos.join('L')}L${escalaX(curva[curva.length - 1].x)},${base}Z`,
      fill: comOpacidade(cor, 0.25),
      stroke: cor,
      'stroke-width': 1,
    },
  });
}

function desenharCorrelacao({ svg, caixa, r, config, tema, fonte }) {
  const temR = r !== null && Number.isFinite(r);
  const intensidade = temR ? Math.abs(r) : 0;

  if (config.colorirCorrelacao !== false && temR) {
    criarSvgEl('rect', {
      pai: svg,
      classe: 'md-r',
      atributos: {
        x: caixa.esquerda + 1,
        y: caixa.cima + 1,
        width: caixa.largura - 2,
        height: caixa.altura - 2,
        fill: comOpacidade(r >= 0 ? tema.destaque : tema.negativo, 0.06 + intensidade * 0.3),
      },
    });
  }

  // O tamanho do número acompanha |r|: num painel de 25 correlações, a
  // leitura por tamanho é mais rápida que ler 25 números.
  const texto = criarSvgEl('text', {
    pai: svg,
    classe: 'md-r',
    atributos: {
      x: caixa.esquerda + caixa.largura / 2,
      y: caixa.cima + caixa.altura / 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': Math.max(fonte, Math.min(caixa.altura * 0.4, fonte + intensidade * 16)),
      'font-weight': '600',
      fill: temR ? tema.texto : tema.textoSuave,
    },
  });
  definirTexto(texto, temR ? formatarR(r) : '—');
}

/** `0,82` em vez de `0.8162`: quatro casas num painel pequeno não se leem. */
function formatarR(r) {
  const texto = Math.abs(r) >= 0.995 ? r.toFixed(1) : r.toFixed(2);
  return texto.replace('.', ',');
}
