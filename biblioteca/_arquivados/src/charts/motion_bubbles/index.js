/**
 * motion_bubbles — "Bolhas em Movimento".
 *
 * O gráfico de Hans Rosling: X, Y, tamanho e cor, andando no tempo. Quatro
 * variáveis num desenho só, o que é muito — e é por isso que ele precisa
 * de mais cuidado que a média.
 *
 * **A área da bolha é proporcional ao valor, nunca o raio.** Este é o erro
 * clássico do gênero e é grave: o olho lê ÁREA. Com o raio proporcional,
 * dobrar o valor quadruplica a mancha, e uma diferença de 3× vira uma
 * diferença aparente de 9×. Aqui o raio sai de `√(valor)` — dobrar o valor
 * multiplica o raio por √2 — e isso tem comentário no código e teste.
 *
 * **O rastro é o que torna o gráfico analisável.** Sem ele, o leitor vê um
 * instante e perde o caminho — o mesmo problema do `bar_race`, e a mesma
 * resposta: poder parar, arrastar o tempo e ver por onde cada bolha
 * passou.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarData, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { acharMaisProximo } from '../../core/interaction.js';
import {
  CSS_ANIMACAO,
  opcoesDeAnimacao,
  opcoesDeRastro,
  criarControleDeTempo,
  pararAnimacao,
  notaDeMenosMovimento,
} from '../_animacao/index.js';
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
.mb-raiz{position:relative;width:100%;height:100%;display:flex;flex-direction:column;}
.mb-palco{flex:1 1 auto;position:relative;overflow:hidden;}
.mb-svg{position:absolute;left:0;top:0;}
.mb-bolha{pointer-events:none;}
.mb-rastro{fill:none;pointer-events:none;}
.mb-rotulo{pointer-events:none;}
.mb-relogio{pointer-events:none;font-weight:700;opacity:.12;}
.mb-nota{flex:0 0 auto;padding:2px 8px 4px;font-size:10px;opacity:.75;}
`;

/** Acima disso as bolhas se cobrem e o movimento vira ruído. */
const MAXIMO_DE_BOLHAS = 400;

export default defineViz({
  id: 'motion_bubbles',
  label: 'Bolhas em Movimento',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeAnimacao({ secao: 'Movimento', duracaoPadrao: 1200 }),
      opcoesDeRastro({ secao: 'Movimento' }),
      {
        tamanhoMaximoDaBolha: {
          type: 'number',
          label: 'Diâmetro da maior bolha (px)',
          section: 'Movimento',
          display: 'range',
          min: 8,
          max: 120,
          step: 2,
          default: 48,
        },
        opacidadeDaBolha: {
          type: 'number',
          label: 'Opacidade das bolhas',
          section: 'Movimento',
          display: 'range',
          min: 0.1,
          max: 1,
          step: 0.05,
          default: 0.75,
        },
        escreverNomes: {
          type: 'string',
          label: 'Escrever o nome',
          section: 'Rótulos',
          display: 'select',
          default: 'maiores',
          values: listaDeValores([
            { rotulo: 'Só nas maiores bolhas', valor: 'maiores' },
            { rotulo: 'Em todas', valor: 'todas' },
            { rotulo: 'Em nenhuma', valor: 'nenhuma' },
          ]),
        },
        mostrarRelogio: {
          type: 'boolean',
          label: 'Período em marca d’água no fundo',
          section: 'Movimento',
          default: true,
        },
      }
    ),
    { gradeEixoX: true, gradeEixoY: true, mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 2, medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length >= 2) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoItem', 'Dimensão de cada bolha', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        }),
        opcaoDeEscolhaDeCampo('campoDoTempo', 'Dimensão do tempo', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[1].nome,
        })
      );
    }
    if (medidas.length >= 2) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoX', 'Medida do eixo X', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        }),
        opcaoDeEscolhaDeCampo('campoY', 'Medida do eixo Y', medidas, {
          secao: 'Dados',
          padrao: medidas[1].nome,
        }),
        opcaoDeEscolhaDeCampo('campoDoTamanho', 'Medida do tamanho', medidas, {
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

    const leitura = lerBolhas(ctx);
    if (leitura.erro) {
      ctx.mostrarVazio(leitura.erro);
      return;
    }
    const { itens, periodos, campoX, campoY, campoDoTamanho, campoDoItem } = leitura;

    if (itens.length > MAXIMO_DE_BOLHAS) {
      ctx.avisar(
        `A consulta tem ${itens.length} bolhas. Acima de ${MAXIMO_DE_BOLHAS} elas se cobrem e o ` +
          'movimento vira ruído — filtre no Explore.'
      );
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_ANIMACAO + CSS, 'mb');
    const caixa = criarEl('div', { classe: 'mb-raiz', pai: raiz });
    const palco = criarEl('div', { classe: 'mb-palco', pai: caixa });
    const nota = criarEl('div', { classe: 'mb-nota', pai: caixa });
    nota.style.color = tema.textoSuave;

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatarX = formatadorDeValueFormat(campoX.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 });
    const formatarY = formatadorDeValueFormat(campoY.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 });
    const formatarTamanho = campoDoTamanho
      ? formatadorDeValueFormat(campoDoTamanho.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 })
      : null;

    const alturaDoPalco = Math.max(60, altura - 56);
    const todosX = itens.flatMap((i) => i.x).filter((v) => v !== null);
    const todosY = itens.flatMap((i) => i.y).filter((v) => v !== null);
    const todosTamanhos = itens.flatMap((i) => i.tamanho).filter((v) => v !== null && v > 0);

    const margens = calcularMargens({
      rotulosY: todosY.map(formatarY),
      rotulosX: todosX.map(formatarX),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, alturaDoPalco, margens);

    // As escalas são FIXAS para todos os períodos: escala que se mexe
    // junto com os dados faz tudo parecer parado, e o movimento é a única
    // coisa que este gráfico tem a mostrar.
    const escalaX = escalaNumerica({
      valores: todosX,
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config,
      eixo: 'X',
    });
    const escalaY = escalaNumerica({
      valores: todosY,
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config,
      eixo: 'Y',
    });

    const svg = criarSvgEl('svg', {
      pai: palco,
      classe: 'mb-svg',
      atributos: { width: largura, height: alturaDoPalco, viewBox: `0 0 ${largura} ${alturaDoPalco}` },
    });

    desenharEixos({ svg, escalaX, escalaY, area: retangulo, config, tema, formatarX, formatarY });

    const relogio = config.mostrarRelogio !== false
      ? criarSvgEl('text', {
          pai: svg,
          classe: 'mb-relogio',
          atributos: {
            x: retangulo.esquerda + retangulo.largura - 10,
            y: retangulo.cima + retangulo.altura - 10,
            'text-anchor': 'end',
            'font-size': Math.min(90, retangulo.altura * 0.4),
            fill: tema.texto,
          },
        })
      : null;

    const camadaDeRastros = criarSvgEl('g', { pai: svg, classe: 'mb-rastros' });
    const camadaDeBolhas = criarSvgEl('g', { pai: svg, classe: 'mb-bolhas' });

    const paleta = coresDaPaleta(config.paleta);
    itens.forEach((item, i) => {
      item.cor = paleta[i % paleta.length];
    });

    const maiorTamanho = todosTamanhos.length ? Math.max(...todosTamanhos) : 1;
    const raioMaximo = Math.max(3, (Number(config.tamanhoMaximoDaBolha) || 48) / 2);

    // O piso do raio é necessário (senão a bolha some), mas quebra a
    // proporção de área justamente para quem é pequeno demais. Quando isso
    // acontece, o gráfico diz.
    if (campoDoTamanho) {
      const noPiso = quantosNoPiso(todosTamanhos, maiorTamanho, raioMaximo);
      if (noPiso > 0) {
        ctx.avisar(
          `${noPiso} valor(es) de tamanho são pequenos demais para a escala: essas bolhas foram ` +
            'desenhadas no tamanho mínimo para não sumirem, e para ELAS a área deixa de ser ' +
            'proporcional ao valor. Aumente o diâmetro máximo ou filtre os extremos.'
        );
      }
    }
    const opacidade = Number(config.opacidadeDaBolha) || 0.75;
    const comprimentoDoRastro = Math.max(0, Number(config.comprimentoDoRastro) || 0);
    const estiloDoRastro = config.estiloDoRastro || 'linha';
    const modoDosNomes = config.escreverNomes || 'maiores';

    // Guarda as posições do quadro para o tooltip achar a bolha sob o
    // ponteiro sem recalcular tudo.
    let visiveis = [];

    const desenhar = (instante) => {
      while (camadaDeBolhas.firstChild) camadaDeBolhas.removeChild(camadaDeBolhas.firstChild);
      while (camadaDeRastros.firstChild) camadaDeRastros.removeChild(camadaDeRastros.firstChild);
      visiveis = [];

      const quadro = interpolarBolhas({ itens, tempo: instante });

      if (comprimentoDoRastro > 0) {
        for (const bolha of quadro) {
          const caminho = rastroDe({
            item: bolha.item,
            tempo: instante,
            comprimento: comprimentoDoRastro,
          });
          if (caminho.length < 2) continue;

          if (estiloDoRastro === 'pontos') {
            caminho.forEach((p, i) => {
              criarSvgEl('circle', {
                pai: camadaDeRastros,
                classe: 'mb-rastro-ponto',
                atributos: {
                  cx: escalaX(p.x), cy: escalaY(p.y), r: 2,
                  fill: bolha.item.cor,
                  opacity: (0.1 + 0.5 * (i / Math.max(1, caminho.length - 1))) * opacidade,
                },
              });
            });
          } else {
            criarSvgEl('path', {
              pai: camadaDeRastros,
              classe: 'mb-rastro',
              atributos: {
                d: `M${caminho.map((p) => `${escalaX(p.x)},${escalaY(p.y)}`).join('L')}`,
                stroke: bolha.item.cor,
                'stroke-width': 1.5,
                opacity: 0.35 * opacidade,
              },
            });
          }
        }
      }

      for (const bolha of quadro) {
        const raio = raioPorArea(bolha.tamanho, maiorTamanho, raioMaximo);
        const cx = escalaX(bolha.x);
        const cy = escalaY(bolha.y);

        criarSvgEl('circle', {
          pai: camadaDeBolhas,
          classe: 'mb-bolha',
          atributos: {
            cx, cy, r: raio,
            fill: bolha.item.cor,
            opacity: opacidade,
            stroke: tema.fundo,
            'stroke-width': 1,
            'data-item': bolha.item.rotulo,
          },
        });

        visiveis.push({ ...bolha, cx, cy, raio });

        const escrever =
          modoDosNomes === 'todas' || (modoDosNomes === 'maiores' && raio >= raioMaximo * 0.45);
        if (escrever) {
          const texto = criarSvgEl('text', {
            pai: camadaDeBolhas,
            classe: 'mb-rotulo',
            atributos: {
              x: cx,
              y: cy,
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'font-size': Math.max(8, Math.min(tema.tamanhoBase, raio * 0.7)),
              fill: tema.texto,
            },
          });
          definirTexto(texto, truncar(bolha.item.rotulo, 14));
        }
      }

      if (relogio) {
        const indice = Math.min(periodos.length - 1, Math.round(instante));
        definirTexto(relogio, periodos[indice].rotulo);
      }
    };

    // ---------- Relógio ----------
    const tempo = criarControleDeTempo({
      ctx,
      hospedeiro: caixa,
      quantidade: periodos.length,
      config,
      rotuloDoPeriodo: (i) => periodos[i].rotulo,
      aoQuadro: desenhar,
      chaveDoEstado: 'movimento',
    });
    caixa.insertBefore(tempo.controles, palco);
    tempo.controles.classList.add('mb-controles');
    tempo.botao.classList.add('mb-botao');
    tempo.barraDeTempo.classList.add('mb-tempo');
    tempo.rotulo.classList.add('mb-periodo');

    // ---------- Nota ----------
    definirTexto(
      nota,
      [
        `${itens.length} bolhas · ${periodos.length} períodos`,
        campoDoTamanho
          ? `tamanho por ${campoDoTamanho.rotuloCurto}: a ÁREA é proporcional ao valor (dobrar o valor multiplica o raio por √2)`
          : 'todas as bolhas do mesmo tamanho: escolha uma medida de tamanho nas opções',
        'escalas fixas em todos os períodos: o que se mexe é o dado, não o eixo',
        comprimentoDoRastro > 0
          ? `rastro de ${comprimentoDoRastro} período(s)`
          : 'sem rastro: ligue nas opções para ver o caminho, não só o instante',
        'a comparação só vale com o gráfico PARADO',
        notaDeMenosMovimento(tempo.menosMovimento),
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(palco, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixaDoPalco = palco.getBoundingClientRect();
      const alvo = acharMaisProximo({
        itens: visiveis,
        x: ev.clientX - caixaDoPalco.left,
        y: ev.clientY - caixaDoPalco.top,
        raio: raioMaximo,
        obterX: (b) => b.cx,
        obterY: (b) => b.cy,
      });
      if (!alvo) {
        tooltip.esconder();
        return;
      }
      const indice = Math.min(periodos.length - 1, Math.round(tempo.estado.tempo));
      tooltip.mostrar(
        {
          titulo: alvo.item.rotulo,
          linhas: [
            { rotulo: 'Período', valor: periodos[indice].rotulo, cor: alvo.item.cor },
            { rotulo: campoX.rotuloCurto, valor: formatarX(alvo.x) },
            { rotulo: campoY.rotuloCurto, valor: formatarY(alvo.y) },
            ...(campoDoTamanho
              ? [{ rotulo: campoDoTamanho.rotuloCurto, valor: formatarTamanho(alvo.tamanho) }]
              : []),
          ],
        },
        ev.clientX,
        ev.clientY
      );
    });

    ctx.eventos.on(palco, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(palco, 'click', (ev) => {
      const caixaDoPalco = palco.getBoundingClientRect();
      const alvo = acharMaisProximo({
        itens: visiveis,
        x: ev.clientX - caixaDoPalco.left,
        y: ev.clientY - caixaDoPalco.top,
        raio: raioMaximo,
        obterX: (b) => b.cx,
        obterY: (b) => b.cy,
      });
      if (!alvo || !campoDoItem) return;
      const celula = modelo.celula(modelo.linhas[alvo.item.indiceDaLinha], campoDoItem.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });

    tempo.iniciar();
  },

  aoDestruir({ estado }) {
    pararAnimacao(estado, 'movimento');
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

/** Abaixo disso a bolha some do gráfico; o item existe e precisa aparecer. */
export const RAIO_MINIMO = 2;

/**
 * Raio a partir da ÁREA, nunca do valor direto.
 *
 * O olho lê área. Com o raio proporcional ao valor, dobrar o valor
 * quadruplica a mancha e uma diferença de 3× é vista como 9×. A raiz
 * quadrada corrige isso: dobrar o valor multiplica o raio por √2 e a área
 * por 2, que é a diferença real.
 *
 * **O piso de `RAIO_MINIMO` quebra essa proporção de propósito**, e é a
 * única exceção: um valor mil vezes menor que o maior daria 1,5 px e
 * sumiria da tela. Entre desenhar a bolha maior do que ela é e não
 * desenhá-la, preferimos desenhar — e CONTAR quantas caíram no piso, para
 * o gráfico poder avisar que para elas o tamanho não é comparável.
 */
export function raioPorArea(valor, maior, raioMaximo) {
  if (valor === null || !Number.isFinite(valor) || valor <= 0 || !(maior > 0)) {
    return Math.max(RAIO_MINIMO, raioMaximo * 0.15);
  }
  return Math.max(RAIO_MINIMO, raioMaximo * Math.sqrt(Math.min(1, valor / maior)));
}

/** Quantos valores ficam tão pequenos que o piso do raio os distorce. */
export function quantosNoPiso(valores, maior, raioMaximo) {
  if (!(maior > 0)) return 0;
  let conta = 0;
  for (const valor of valores) {
    if (valor === null || !Number.isFinite(valor) || valor <= 0) continue;
    if (raioMaximo * Math.sqrt(valor / maior) < RAIO_MINIMO) conta += 1;
  }
  return conta;
}

/**
 * Lê as bolhas: uma por item, com um valor por período em cada medida.
 *
 * @returns {{itens, periodos, campoX, campoY, campoDoTamanho, campoDoItem}|{erro}}
 */
export function lerBolhas(ctx) {
  const { modelo, config } = ctx;

  const campoDoItem =
    modelo.dimensoes.find((d) => d.nome === config.campoDoItem) || modelo.dimensoes[0] || null;
  const campoDoTempo =
    modelo.dimensoes.find((d) => d.nome === config.campoDoTempo && d !== campoDoItem) ||
    modelo.dimensoes.find((d) => d !== campoDoItem) ||
    null;

  if (!campoDoItem || !campoDoTempo) {
    return {
      erro:
        'Este gráfico precisa de DUAS dimensões: uma para cada bolha e outra para o tempo. ' +
        'Traga as duas no Explore.',
    };
  }

  const campoX = modelo.medidas.find((m) => m.nome === config.campoX) || modelo.medidas[0] || null;
  const campoY =
    modelo.medidas.find((m) => m.nome === config.campoY && m !== campoX) ||
    modelo.medidas.find((m) => m !== campoX) ||
    null;
  if (!campoX || !campoY) {
    return { erro: 'Este gráfico precisa de DUAS medidas: uma para o eixo X e outra para o Y.' };
  }
  const campoDoTamanho =
    config.campoDoTamanho === '' ? null : modelo.medidas.find((m) => m.nome === config.campoDoTamanho) || null;

  // Períodos na ordem em que o Looker mandou.
  const periodos = [];
  const indiceDoPeriodo = new Map();
  for (const linha of modelo.linhas) {
    const chave = String(modelo.valorBruto(linha, campoDoTempo.nome));
    if (indiceDoPeriodo.has(chave)) continue;
    indiceDoPeriodo.set(chave, periodos.length);
    periodos.push({
      chave,
      rotulo: campoDoTempo.ehData
        ? formatarData(modelo.valorBruto(linha, campoDoTempo.nome), config.formatoDeData || 'auto')
        : modelo.texto(linha, campoDoTempo.nome, undefined, '∅'),
    });
  }

  if (periodos.length < 2) {
    return {
      erro: 'A dimensão do tempo precisa ter pelo menos dois valores para haver movimento.',
    };
  }

  const porItem = new Map();
  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const chave = String(modelo.valorBruto(linha, campoDoItem.nome));
    if (!porItem.has(chave)) {
      porItem.set(chave, {
        chave,
        rotulo: modelo.texto(linha, campoDoItem.nome, undefined, '∅'),
        indiceDaLinha: i,
        x: new Array(periodos.length).fill(null),
        y: new Array(periodos.length).fill(null),
        tamanho: new Array(periodos.length).fill(null),
      });
    }
    const item = porItem.get(chave);
    const p = indiceDoPeriodo.get(String(modelo.valorBruto(linha, campoDoTempo.nome)));
    if (p === undefined) continue;
    item.x[p] = modelo.valorNumerico(linha, campoX.nome);
    item.y[p] = modelo.valorNumerico(linha, campoY.nome);
    item.tamanho[p] = campoDoTamanho ? modelo.valorNumerico(linha, campoDoTamanho.nome) : 1;
  }

  const itens = Array.from(porItem.values()).filter((item) =>
    item.x.some((v, i) => v !== null && item.y[i] !== null)
  );

  if (!itens.length) {
    return { erro: 'Nenhum item tem valor em X e Y no mesmo período.' };
  }

  return { itens, periodos, campoX, campoY, campoDoTamanho, campoDoItem };
}

/**
 * Posição de cada bolha num instante fracionário.
 *
 * Bolhas sem valor nos dois períodos vizinhos ficam de fora do quadro — e
 * é melhor assim: uma bolha parada numa posição antiga afirmaria um dado
 * que não existe naquele período.
 *
 * @returns {Array<{item, x, y, tamanho}>}
 */
export function interpolarBolhas({ itens, tempo }) {
  const ultimo = itens[0] ? itens[0].x.length - 1 : 0;
  const t = Math.max(0, Math.min(ultimo, tempo));
  const de = Math.floor(t);
  const ate = Math.min(ultimo, de + 1);
  const fracao = t - de;

  const saida = [];
  for (const item of itens) {
    const x = interpolar(item.x[de], item.x[ate], fracao);
    const y = interpolar(item.y[de], item.y[ate], fracao);
    if (x === null || y === null) continue;
    saida.push({
      item,
      x,
      y,
      tamanho: interpolar(item.tamanho[de], item.tamanho[ate], fracao),
    });
  }
  return saida;
}

function interpolar(a, b, fracao) {
  const temA = a !== null && Number.isFinite(a);
  const temB = b !== null && Number.isFinite(b);
  if (!temA && !temB) return null;
  if (!temA) return b;
  if (!temB) return a;
  return a + (b - a) * fracao;
}

/**
 * Caminho percorrido por um item nos últimos `comprimento` períodos.
 *
 * O rastro é o que transforma "onde está" em "por onde passou" — é a
 * diferença entre ver um instante e ver uma trajetória.
 */
export function rastroDe({ item, tempo, comprimento }) {
  const ate = Math.floor(Math.max(0, tempo));
  const de = Math.max(0, ate - comprimento);
  const caminho = [];
  for (let i = de; i <= ate; i++) {
    const x = item.x[i];
    const y = item.y[i];
    if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    caminho.push({ x, y });
  }
  return caminho;
}
