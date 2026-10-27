/**
 * heatmap_denso — "Heatmap Denso".
 *
 * Primeiro gráfico do TIER 4, e a mudança de problema é nítida: até aqui a
 * pergunta era "o que o desenho esconde"; daqui em diante é **"isso cabe?"**.
 * 500 linhas × 200 colunas são 100 mil células. Em SVG, 100 mil elementos
 * param o navegador; em canvas, são 100 mil `fillRect` e uma passada.
 *
 * Três decisões que mudam o que se lê:
 *
 * 1. **A escala de cor.** Sequencial para medidas que só crescem,
 *    divergente CENTRADA EM ZERO para variações (uma divergente fora do
 *    centro mente sobre onde está a virada de sinal), e por QUANTIL para
 *    distribuições muito assimétricas. A escala por quantil revela
 *    estrutura que a linear esmaga — e **distorce as distâncias**: duas
 *    células de cores vizinhas podem estar a ordens de grandeza uma da
 *    outra. Isso vai escrito na tela sempre que ela estiver ligada.
 * 2. **Ausência não é zero.** Uma célula sem dado precisa ser visualmente
 *    distinta de uma célula com valor baixo. Pintá-la com a cor do mínimo
 *    transformaria "não sei" em "quase nada", que é uma afirmação.
 * 3. **A grade desaparece sozinha.** Abaixo de ~3 px por célula, a linha
 *    de separação come a própria célula e o mapa escurece por inteiro.
 *
 * Correções v2 (módulos 6.1 e 6.3):
 *   - o bloco de rótulos era declarado e nunca lido: o mapa não escrevia
 *     valor nenhum. Agora cada célula recebe o valor pela função única de
 *     rótulos (`core/rotulos.js`) — mostrar/ocultar, tamanho, cor (vazio =
 *     legível sobre a célula), negrito, rotação, conteúdo, formato, casas
 *     e truncar. "Esconder rótulos que se sobrepõem" pula as células onde
 *     o texto não cabe. Em SVG (grades pequenas) o texto é um <text>; em
 *     canvas (grades grandes) é `fillText` com a mesma fonte e cor
 *     (`desenharRotulosNoCanvas`);
 *   - tooltip único (`ctx.tooltip()`) com o valor no texto do Looker;
 *     clique pela "Ação do clique" (`ctx.cliqueNoItem`), usando a célula
 *     da medida (ou a da linha, se só ela tiver links).
 *
 * Campos: 1 dimensão (linhas) + 1 dimensão ou pivô (colunas) + 1 medida.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { calcularMargens, areaDeDesenho, larguraAproximada } from '../../core/eixos.js';
import {
  interpoladorContinuo,
  opcoesDeEscalaContinua,
  ESCALAS_CONTINUAS,
  comOpacidade,
  textoLegivelSobre,
} from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo, larguraDoTexto } from '../../core/rotulos.js';
import { limparEOrdenar, quantil } from '../../core/estatistica.js';
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
.hd-area{position:relative;width:100%;height:100%;overflow:hidden;}
.hd-canvas{position:absolute;left:0;top:0;}
.hd-svg{position:absolute;left:0;top:0;pointer-events:none;}
.hd-rotulo{pointer-events:none;}
.hd-legenda{pointer-events:none;}
.hd-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso, um elemento SVG por célula para o navegador. */
const LIMITE_PARA_CANVAS = 4000;

/** Abaixo deste lado em pixels, a linha de grade come a célula. */
const LADO_MINIMO_PARA_GRADE = 3;

/** Teto de segurança: acima disso nem o canvas desenha em tempo razoável. */
const MAXIMO_DE_CELULAS = 400000;

/**
 * Teto de rótulos de célula quando o usuário DESLIGA "esconder rótulos que
 * se sobrepõem": texto em 100 mil células travaria o desenho.
 */
const MAXIMO_DE_ROTULOS = 20000;

export default defineViz({
  id: 'heatmap_denso',
  label: 'Heatmap Denso',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        escalaDeCor: {
          type: 'string',
          label: 'Paleta contínua',
          section: 'Cor',
          display: 'select',
          default: 'viridis',
          values: opcoesDeEscalaContinua(),
        },
        modoDaEscala: {
          type: 'string',
          label: 'Como a cor mapeia o valor',
          section: 'Cor',
          display: 'select',
          default: 'linear',
          values: listaDeValores([
            { rotulo: 'Linear (distâncias de cor = distâncias de valor)', valor: 'linear' },
            { rotulo: 'Divergente, centrada em zero', valor: 'divergente' },
            { rotulo: 'Por quantil (revela estrutura, distorce distâncias)', valor: 'quantil' },
          ]),
        },
        inverterCor: {
          type: 'boolean',
          label: 'Inverter a paleta',
          section: 'Cor',
          default: false,
        },
        corDaAusencia: {
          type: 'string',
          label: 'Cor das células sem dado',
          section: 'Cor',
          display: 'color',
          default: '',
        },
        mostrarLegendaDeCor: {
          type: 'boolean',
          label: 'Mostrar a régua de cor',
          section: 'Cor',
          default: true,
        },
        mostrarGrade: {
          type: 'boolean',
          label: 'Separar as células com linha (some quando não cabe)',
          section: 'Formato',
          default: true,
        },
        maximoDeLinhas: {
          type: 'number',
          label: 'Máximo de linhas',
          section: 'Formato',
          display: 'number',
          default: 2000,
        },
        maximoDeColunas: {
          type: 'number',
          label: 'Máximo de colunas',
          section: 'Formato',
          display: 'number',
          default: 2000,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaLinha', 'Dimensão das linhas', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (dimensoes.length > 1 && !modelo.temPivo) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaColuna', 'Dimensão das colunas', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[1].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoValor', 'Medida da cor', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const grade = lerGrade(ctx);
    if (grade.erro) {
      ctx.mostrarVazio(grade.erro);
      return;
    }
    const { linhas, colunas, valores, medida, campoDaLinha } = grade;

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'hd');
    const area = criarEl('div', { classe: 'hd-area', pai: raiz });

    // Rótulos de célula: lidos a cada desenho (config normalizado).
    const rot = lerRotulos(config, tema);
    // Régua e números derivados: value_format do campo.
    const formatar = formatadorDeValueFormat(medida.valueFormat, { casas: rot.casas });
    // Texto do Looker de uma célula (i, j): tooltip e rótulo "automático".
    const textoDaCelula = (i, j) => {
      const origem = grade.origens[i * colunas.length + j];
      if (origem < 0) return '';
      return ctx.modelo.texto(
        ctx.modelo.linhas[origem],
        medida.nome,
        grade.usarPivo ? colunas[j].chave : undefined,
        ''
      );
    };

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const comLegenda = config.mostrarLegendaDeCor !== false;

    const margens = calcularMargens({
      rotulosY: linhas.map((l) => truncar(l.rotulo, 22)),
      rotulosX: colunas.map((c) => truncar(c.rotulo, 14)),
      config,
      tema,
    });
    margens.direita = Math.max(margens.direita, comLegenda ? 62 : 10);
    // O eixo X fica em CIMA: num heatmap a primeira linha é a mais olhada,
    // e rótulo embaixo obriga a percorrer o mapa inteiro para identificá-la.
    const alturaDoCabecalho = Math.min(
      altura * 0.35,
      14 + colunas.reduce((a, c) => Math.max(a, larguraAproximada(truncar(c.rotulo, 14), fonte)), 0)
    );

    const retangulo = areaDeDesenho(largura, altura, {
      ...margens,
      cima: alturaDoCabecalho,
      baixo: 16,
    });

    const larguraDaCelula = retangulo.largura / colunas.length;
    const alturaDaCelula = retangulo.altura / linhas.length;

    // ---------- Cor ----------
    const escala = montarEscalaDeCor({ valores, config });

    const corDaAusencia = config.corDaAusencia || comOpacidade(tema.borda, 0.45);

    // ---------- Desenho ----------
    const totalDeCelulas = linhas.length * colunas.length;
    const usarCanvas = totalDeCelulas > LIMITE_PARA_CANVAS;
    const comGrade =
      config.mostrarGrade !== false &&
      larguraDaCelula >= LADO_MINIMO_PARA_GRADE &&
      alturaDaCelula >= LADO_MINIMO_PARA_GRADE;

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'hd-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    let contextoDoCanvas = null;
    if (usarCanvas) {
      const canvas = criarEl('canvas', { classe: 'hd-canvas' });
      area.insertBefore(canvas, svg);
      const { ctx: pincel } = prepararCanvas(canvas, largura, altura);
      contextoDoCanvas = pincel;

      if (pincel) {
        for (let i = 0; i < linhas.length; i++) {
          const y = retangulo.cima + i * alturaDaCelula;
          for (let j = 0; j < colunas.length; j++) {
            const v = valores[i * colunas.length + j];
            pincel.fillStyle = Number.isNaN(v) ? corDaAusencia : escala.cor(v);
            pincel.fillRect(
              retangulo.esquerda + j * larguraDaCelula,
              y,
              // O +0,5 fecha a costura entre células vizinhas: sem ele, o
              // arredondamento do canvas deixa fios do fundo aparecendo.
              larguraDaCelula + (comGrade ? -1 : 0.5),
              alturaDaCelula + (comGrade ? -1 : 0.5)
            );
          }
        }
      } else {
        ctx.avisar('O navegador não forneceu contexto 2D; as células não foram desenhadas.');
      }
    } else {
      for (let i = 0; i < linhas.length; i++) {
        for (let j = 0; j < colunas.length; j++) {
          const v = valores[i * colunas.length + j];
          criarSvgEl('rect', {
            pai: svg,
            classe: 'hd-celula',
            atributos: {
              x: retangulo.esquerda + j * larguraDaCelula + (comGrade ? 0.5 : 0),
              y: retangulo.cima + i * alturaDaCelula + (comGrade ? 0.5 : 0),
              width: Math.max(0.5, larguraDaCelula - (comGrade ? 1 : 0)),
              height: Math.max(0.5, alturaDaCelula - (comGrade ? 1 : 0)),
              fill: Number.isNaN(v) ? corDaAusencia : escala.cor(v),
            },
          });
        }
      }
    }

    // ---------- Valores nas células (rótulos de dado) ----------
    // Com "evitar colisão" ligado, uma célula mais baixa que o texto não
    // recebe rótulo — e, se nenhuma cabe, nem montamos a lista.
    let rotulosDesenhados = 0;
    let rotulosCortados = false;
    if (rot.mostrar && (!rot.evitarColisao || alturaDaCelula >= rot.tamanho + 2)) {
      let total = 0;
      for (let k = 0; k < valores.length; k++) if (!Number.isNaN(valores[k])) total += valores[k];
      const celulasComValor = [];
      for (let i = 0; i < linhas.length; i++) {
        for (let j = 0; j < colunas.length; j++) {
          const v = valores[i * colunas.length + j];
          if (Number.isNaN(v)) continue;
          if (!rot.evitarColisao && celulasComValor.length >= MAXIMO_DE_ROTULOS) {
            rotulosCortados = true;
            break;
          }
          celulasComValor.push({
            x: retangulo.esquerda + j * larguraDaCelula,
            y: retangulo.cima + i * alturaDaCelula,
            largura: larguraDaCelula,
            altura: alturaDaCelula,
            valor: v,
            nome: `${linhas[i].rotulo} · ${colunas[j].rotulo}`,
            textoDoValor: textoDaCelula(i, j),
            corDeFundo: escala.cor(v),
          });
        }
      }
      const opcoesDoRotulo = { total, valueFormat: medida.valueFormat };
      if (usarCanvas) {
        if (contextoDoCanvas) {
          rotulosDesenhados = desenharRotulosNoCanvas(contextoDoCanvas, rot, celulasComValor, opcoesDoRotulo);
        }
      } else {
        rotulosDesenhados = desenharRotulosNoSvg(svg, rot, celulasComValor, opcoesDoRotulo);
      }
    }

    // ---------- Rótulos dos eixos ----------
    const saltoDeLinha = saltoPorEspaco(linhas.length, alturaDaCelula, fonte * 1.1);
    for (let i = 0; i < linhas.length; i += saltoDeLinha) {
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'hd-rotulo',
        atributos: {
          x: retangulo.esquerda - 5,
          y: retangulo.cima + i * alturaDaCelula + alturaDaCelula / 2,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          'font-size': fonte,
          fill: tema.textoSuave,
        },
      });
      definirTexto(texto, truncar(linhas[i].rotulo, 22));
    }

    const saltoDeColuna = saltoPorEspaco(colunas.length, larguraDaCelula, fonte * 1.1);
    for (let j = 0; j < colunas.length; j += saltoDeColuna) {
      const x = retangulo.esquerda + j * larguraDaCelula + larguraDaCelula / 2;
      const y = retangulo.cima - 5;
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'hd-rotulo',
        atributos: {
          x,
          y,
          'text-anchor': 'start',
          'font-size': fonte,
          fill: tema.textoSuave,
          transform: `rotate(-90 ${x} ${y})`,
        },
      });
      definirTexto(texto, truncar(colunas[j].rotulo, 14));
    }

    // ---------- Régua ----------
    if (comLegenda) {
      desenharRegua({
        svg,
        x: largura - margens.direita + 14,
        y: retangulo.cima,
        altura: Math.max(50, retangulo.altura),
        escala,
        formatar,
        tema,
        fonte,
        corDaAusencia,
        temAusencia: grade.ausentes > 0,
      });
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'hd-nota', pai: area });
    nota.style.color = tema.textoSuave;
    const partes = [
      `${linhas.length} × ${colunas.length} = ${totalDeCelulas.toLocaleString('pt-BR')} células`,
    ];
    if (grade.ausentes > 0) {
      partes.push(`${grade.ausentes.toLocaleString('pt-BR')} sem dado (cor própria — ausência não é zero)`);
    }
    partes.push(escala.descricao);
    if (usarCanvas) partes.push('desenhado em canvas');
    if (!comGrade && config.mostrarGrade !== false) {
      partes.push('grade omitida: a célula ficou menor que a linha');
    }
    if (rot.mostrar && !rotulosDesenhados && rot.evitarColisao && (!usarCanvas || contextoDoCanvas)) {
      partes.push('valores omitidos: não cabem nas células');
    }
    if (rotulosCortados) {
      partes.push(`valores escritos só nas ${MAXIMO_DE_ROTULOS.toLocaleString('pt-BR')} primeiras células`);
    }
    definirTexto(nota, partes.join(' · '));

    // ---------- Interação ----------
    const tooltip = ctx.tooltip();

    // Busca O(1): a posição do mouse vira índice por divisão, não por
    // varredura. Com 100 mil células, varrer a cada movimento travaria.
    const celulaEm = (ev) => {
      const caixa = area.getBoundingClientRect();
      const j = Math.floor((ev.clientX - caixa.left - retangulo.esquerda) / larguraDaCelula);
      const i = Math.floor((ev.clientY - caixa.top - retangulo.cima) / alturaDaCelula);
      if (i < 0 || j < 0 || i >= linhas.length || j >= colunas.length) return null;
      return { i, j, valor: valores[i * colunas.length + j] };
    };

    // Conteúdo do tooltip: o valor é o texto do Looker da célula.
    const conteudoDe = (alvo) => {
      const semDado = Number.isNaN(alvo.valor);
      const valor = semDado ? 'sem dado nesta combinação' : textoDaCelula(alvo.i, alvo.j) || formatar(alvo.valor);
      return {
        titulo: linhas[alvo.i].rotulo,
        linhas: [
          { rotulo: grade.rotuloDaColuna, valor: colunas[alvo.j].rotulo },
          {
            rotulo: medida.rotuloCurto,
            valor,
            cor: semDado ? undefined : escala.cor(alvo.valor),
          },
          ...(semDado
            ? []
            : [{ rotulo: 'Posição na escala', valor: escala.descricaoDoValor(alvo.valor) }]),
        ],
        variaveis: {
          categoria: linhas[alvo.i].rotulo,
          serie: colunas[alvo.j].rotulo,
          valor: semDado ? '' : valor,
        },
      };
    };

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const alvo = celulaEm(ev);
      if (!alvo) {
        tooltip.esconder();
        return;
      }
      tooltip.mostrar(conteudoDe(alvo), ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    // Clique: "Ação do clique". A célula do drill é a da MEDIDA naquela
    // combinação (é ela que o Looker liga ao detalhe); se ela não tiver
    // links, a da dimensão da linha; sem nenhum link, fixa o tooltip.
    ctx.eventos.on(area, 'click', (ev) => {
      const alvo = celulaEm(ev);
      if (!alvo || !campoDaLinha) return;
      const origem = grade.origens[alvo.i * colunas.length + alvo.j];
      const indiceDaLinha = origem >= 0 ? origem : linhas[alvo.i].indiceDaLinha;
      if (indiceDaLinha === undefined) return;
      const linhaDoModelo = ctx.modelo.linhas[indiceDaLinha];
      const candidatas = [
        origem >= 0
          ? ctx.modelo.celula(linhaDoModelo, medida.nome, grade.usarPivo ? colunas[alvo.j].chave : undefined)
          : null,
        ctx.modelo.celula(linhaDoModelo, campoDaLinha.nome),
      ].filter(Boolean);
      const celula = candidatas.find((c) => Array.isArray(c.links) && c.links.length) || candidatas[0] || null;
      ctx.cliqueNoItem(ev, celula, conteudoDe(alvo));
    });

    ctx.estado.contextoDoCanvas = contextoDoCanvas;
  },
  // Sem aoDestruir: o tooltip é o único do gráfico e o defineViz o remove.
});

/* ------------------------------------------------------------------ */

/**
 * Prepara os rótulos das células: texto (função única de rótulos),
 * centro, cor e se cabe. Com "evitar colisão" ligado, a célula onde o
 * texto não cabe fica sem rótulo — num mapa de células, sobrepor é
 * invadir a célula vizinha.
 *
 * @param {object} rot resultado de lerRotulos
 * @param {Array<{x,y,largura,altura,valor,nome,textoDoValor?,corDeFundo}>} celulas
 */
export function prepararRotulosDasCelulas(rot, celulas, { total, valueFormat } = {}) {
  const saida = [];
  if (!rot || !rot.mostrar) return saida;
  for (const c of celulas) {
    const texto = textoDoRotulo(rot, {
      valor: c.valor,
      nome: c.nome,
      total,
      valueFormat,
      textoDoValor: c.textoDoValor,
    });
    if (!texto) continue;
    if (rot.evitarColisao) {
      // Girado, o texto ocupa a projeção da largura nos dois eixos.
      const largura = larguraDoTexto(texto, rot.tamanho);
      const angulo = (Math.abs(rot.rotacao || 0) * Math.PI) / 180;
      const ocupaX = largura * Math.cos(angulo) + rot.tamanho * Math.sin(angulo);
      const ocupaY = largura * Math.sin(angulo) + rot.tamanho * Math.cos(angulo);
      if (ocupaX + 4 > c.largura || ocupaY + 2 > c.altura) continue;
    }
    saida.push({
      texto,
      cx: c.x + c.largura / 2,
      cy: c.y + c.altura / 2,
      cor: rot.cor || textoLegivelSobre(c.corDeFundo, { texto: rot.corDoTema }),
    });
  }
  return saida;
}

/** Rótulos das células em SVG (grades pequenas). @returns quantos desenhou */
export function desenharRotulosNoSvg(svg, rot, celulas, opcoes = {}) {
  const rotulos = prepararRotulosDasCelulas(rot, celulas, opcoes);
  for (const r of rotulos) {
    const t = criarSvgEl('text', {
      pai: svg,
      classe: 'hd-valor',
      atributos: { x: r.cx, y: r.cy, 'text-anchor': 'middle', 'dominant-baseline': 'central' },
    });
    definirTexto(t, r.texto);
    estilizarRotulo(t, rot, { corAutomatica: r.cor, x: r.cx, y: r.cy });
  }
  return rotulos.length;
}

/**
 * Rótulos das células no canvas (grades grandes): mesma fonte, tamanho,
 * negrito, cor e rotação do SVG, por `fillText`. @returns quantos desenhou
 */
export function desenharRotulosNoCanvas(pincel, rot, celulas, opcoes = {}) {
  if (!pincel) return 0;
  const rotulos = prepararRotulosDasCelulas(rot, celulas, opcoes);
  pincel.font = `${rot.negrito ? '700' : '400'} ${rot.tamanho}px ${rot.fonte || 'sans-serif'}`;
  pincel.textAlign = 'center';
  pincel.textBaseline = 'middle';
  const radianos = ((rot.rotacao || 0) * Math.PI) / 180;
  for (const r of rotulos) {
    pincel.fillStyle = r.cor;
    if (radianos) {
      pincel.save();
      pincel.translate(r.cx, r.cy);
      pincel.rotate(radianos);
      pincel.fillText(r.texto, 0, 0);
      pincel.restore();
    } else {
      pincel.fillText(r.texto, r.cx, r.cy);
    }
  }
  return rotulos.length;
}

/* ------------------------------------------------------------------ */

/**
 * De quantos em quantos rótulos desenhar para que caibam.
 *
 * Mesmo princípio do eixo de banda em `core/eixos.js`: um rótulo por
 * categoria com 500 categorias são 500 textos sobrepostos — ilegíveis e
 * caros.
 */
export function saltoPorEspaco(quantidade, lado, espacoNecessario) {
  if (!(lado > 0)) return Math.max(1, quantidade);
  return Math.max(1, Math.ceil(espacoNecessario / lado));
}

/**
 * Lê a grade linha × coluna.
 *
 * As colunas vêm do pivô quando houver; senão, de uma segunda dimensão.
 * Células sem combinação ficam `NaN` — e NaN aqui significa "não sei",
 * diferente de zero, que significa "zero".
 *
 * @returns {{linhas, colunas, valores:Float64Array, medida, campoDaLinha,
 *            ausentes:number, origens:Int32Array, usarPivo:boolean,
 *            rotuloDaColuna:string}|{erro:string}}
 */
export function lerGrade(ctx) {
  const { modelo, config } = ctx;

  const medida =
    modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
  if (!medida) return { erro: 'Esta visualização precisa de uma medida para colorir as células.' };

  const campoDaLinha =
    modelo.dimensoes.find((d) => d.nome === config.campoDaLinha) || modelo.dimensoes[0] || null;
  if (!campoDaLinha) {
    return { erro: 'Esta visualização precisa de uma dimensão para as linhas do mapa.' };
  }

  const usarPivo = modelo.temPivo;
  const campoDaColuna = usarPivo
    ? null
    : modelo.dimensoes.find((d) => d.nome === config.campoDaColuna && d !== campoDaLinha) ||
      modelo.dimensoes.find((d) => d !== campoDaLinha) ||
      null;

  if (!usarPivo && !campoDaColuna) {
    return {
      erro:
        'Um heatmap cruza DUAS dimensões. Traga uma segunda dimensão para as colunas, ' +
        'ou pivote uma dimensão no Explore.',
    };
  }

  const maximoDeLinhas = Math.max(1, Number(config.maximoDeLinhas) || 2000);
  const maximoDeColunas = Math.max(1, Number(config.maximoDeColunas) || 2000);

  // --- Chaves ---
  const linhasPorChave = new Map();
  for (let i = 0; i < modelo.linhas.length; i++) {
    const chave = String(modelo.valorBruto(modelo.linhas[i], campoDaLinha.nome));
    if (linhasPorChave.has(chave)) continue;
    linhasPorChave.set(chave, {
      chave,
      rotulo: modelo.texto(modelo.linhas[i], campoDaLinha.nome, undefined, '∅'),
      indiceDaLinha: i,
    });
  }

  const colunasPorChave = new Map();
  if (usarPivo) {
    for (const pivo of modelo.pivotsDeDados) {
      colunasPorChave.set(pivo.chave, { chave: pivo.chave, rotulo: pivo.rotulo });
    }
  } else {
    for (const linha of modelo.linhas) {
      const chave = String(modelo.valorBruto(linha, campoDaColuna.nome));
      if (colunasPorChave.has(chave)) continue;
      colunasPorChave.set(chave, {
        chave,
        rotulo: modelo.texto(linha, campoDaColuna.nome, undefined, '∅'),
      });
    }
  }

  let listaDeLinhas = Array.from(linhasPorChave.values());
  let listaDeColunas = Array.from(colunasPorChave.values());

  if (listaDeLinhas.length > maximoDeLinhas) {
    ctx.avisar(
      `A consulta tem ${listaDeLinhas.length} linhas; mostrando as ${maximoDeLinhas} primeiras.`
    );
    listaDeLinhas = listaDeLinhas.slice(0, maximoDeLinhas);
  }
  if (listaDeColunas.length > maximoDeColunas) {
    ctx.avisar(
      `A consulta tem ${listaDeColunas.length} colunas; mostrando as ${maximoDeColunas} primeiras.`
    );
    listaDeColunas = listaDeColunas.slice(0, maximoDeColunas);
  }

  if (!listaDeLinhas.length || !listaDeColunas.length) {
    return { erro: 'A consulta não trouxe combinações suficientes para montar o mapa.' };
  }

  const totalDeCelulas = listaDeLinhas.length * listaDeColunas.length;
  if (totalDeCelulas > MAXIMO_DE_CELULAS) {
    return {
      erro:
        `A grade teria ${totalDeCelulas.toLocaleString('pt-BR')} células, acima do limite de ` +
        `${MAXIMO_DE_CELULAS.toLocaleString('pt-BR')}. Reduza as dimensões no Explore ou baixe ` +
        'os máximos de linhas e colunas nas opções.',
    };
  }

  const indiceDaLinha = new Map(listaDeLinhas.map((l, i) => [l.chave, i]));
  const indiceDaColuna = new Map(listaDeColunas.map((c, j) => [c.chave, j]));

  // NaN é o estado inicial de propósito: significa "não sei". Zero
  // significaria "zero", que é uma afirmação sobre o dado.
  const valores = new Float64Array(totalDeCelulas).fill(NaN);
  let preenchidas = 0;
  // Duas linhas da consulta podem cair na MESMA célula (quando a chave
  // linha × coluna não é única). Nesse caso o mapa mostra só a última, e
  // isso precisa ser dito: sem o aviso, metade dos dados some em silêncio.
  let colisoes = 0;
  // De que linha da consulta veio cada célula (-1 = sem dado): é o que dá
  // acesso ao texto do Looker (rótulo e tooltip) e à célula do drill.
  const origens = new Int32Array(totalDeCelulas).fill(-1);
  let linhaAtual = -1;

  const gravar = (k, v) => {
    if (Number.isNaN(valores[k])) preenchidas += 1;
    else colisoes += 1;
    valores[k] = v;
    origens[k] = linhaAtual;
  };

  for (const linha of modelo.linhas) {
    linhaAtual += 1;
    const i = indiceDaLinha.get(String(modelo.valorBruto(linha, campoDaLinha.nome)));
    if (i === undefined) continue;

    if (usarPivo) {
      for (const pivo of modelo.pivotsDeDados) {
        const j = indiceDaColuna.get(pivo.chave);
        if (j === undefined) continue;
        const v = modelo.valorNumerico(linha, medida.nome, pivo.chave);
        if (v === null) continue;
        gravar(i * listaDeColunas.length + j, v);
      }
    } else {
      const j = indiceDaColuna.get(String(modelo.valorBruto(linha, campoDaColuna.nome)));
      if (j === undefined) continue;
      const v = modelo.valorNumerico(linha, medida.nome);
      if (v === null) continue;
      gravar(i * listaDeColunas.length + j, v);
    }
  }

  if (!preenchidas) {
    return { erro: 'Nenhuma combinação de linha e coluna tem valor numérico na medida escolhida.' };
  }

  if (colisoes > 0) {
    ctx.avisar(
      `${colisoes.toLocaleString('pt-BR')} linha(s) da consulta caíram numa célula já ocupada: ` +
        'a combinação de linha e coluna não é única e o mapa mostra apenas o ÚLTIMO valor de cada uma. ' +
        'Agrupe por essas duas dimensões no Explore (ou escolha outras) para que cada célula tenha um valor só.'
    );
  }

  return {
    linhas: listaDeLinhas,
    colunas: listaDeColunas,
    valores,
    medida,
    campoDaLinha,
    ausentes: totalDeCelulas - preenchidas,
    origens,
    usarPivo,
    rotuloDaColuna: usarPivo ? 'Pivô' : campoDaColuna.rotuloCurto,
  };
}

/**
 * Monta a função de cor e a descrição do que ela faz.
 *
 * - `linear`: distância de cor = distância de valor. É a única em que
 *   comparar duas células pelo tom é legítimo.
 * - `divergente`: domínio SIMÉTRICO em torno de zero, para que a cor do
 *   meio seja mesmo o zero. Uma divergente com domínio assimétrico põe a
 *   virada de sinal no lugar errado, e é o erro mais comum do gênero.
 * - `quantil`: a cor é a POSIÇÃO do valor na distribuição. Revela
 *   estrutura que a linear esmaga — e distorce as distâncias, o que
 *   precisa ser dito.
 */
export function montarEscalaDeCor({ valores, config }) {
  const interpolador = interpoladorContinuo(config.escalaDeCor);
  const inverter = !!config.inverterCor;
  const aplicar = (t) => interpolador(inverter ? 1 - t : Math.max(0, Math.min(1, t)));

  const finitos = [];
  for (let i = 0; i < valores.length; i++) {
    if (!Number.isNaN(valores[i])) finitos.push(valores[i]);
  }
  const ordenados = limparEOrdenar(finitos);
  const minimo = ordenados.length ? ordenados[0] : 0;
  const maximo = ordenados.length ? ordenados[ordenados.length - 1] : 1;

  const modo = config.modoDaEscala || 'linear';

  if (modo === 'quantil' && ordenados.length > 1) {
    return {
      modo,
      minimo,
      maximo,
      cor: (v) => aplicar(posicaoNoOrdenado(ordenados, v)),
      // A régua mostra os valores dos quantis, não uma escala regular: é
      // o que torna a distorção visível em vez de escondida.
      marcas: [0, 0.25, 0.5, 0.75, 1].map((p) => ({ p, valor: quantil(ordenados, p) })),
      descricao:
        'cor por QUANTIL: ela mostra a posição na distribuição, não a distância — ' +
        'duas cores vizinhas podem estar a ordens de grandeza uma da outra',
      descricaoDoValor: (v) =>
        `${(posicaoNoOrdenado(ordenados, v) * 100).toFixed(1)}% dos valores estão abaixo`,
    };
  }

  if (modo === 'divergente') {
    // Domínio simétrico: é o que garante que a cor do meio seja o zero.
    const extremo = Math.max(Math.abs(minimo), Math.abs(maximo)) || 1;
    const ehDivergente = (ESCALAS_CONTINUAS[config.escalaDeCor] || {}).tipo === 'divergente';
    return {
      modo,
      minimo: -extremo,
      maximo: extremo,
      cor: (v) => aplicar((v + extremo) / (2 * extremo)),
      marcas: [-extremo, -extremo / 2, 0, extremo / 2, extremo].map((valor, i) => ({
        p: i / 4,
        valor,
      })),
      descricao:
        `escala divergente centrada em zero, de −${formatarCurtoNumero(extremo)} a ` +
        `+${formatarCurtoNumero(extremo)}` +
        (ehDivergente ? '' : ' (atenção: a paleta escolhida não é divergente)'),
      descricaoDoValor: (v) => (v >= 0 ? 'acima de zero' : 'abaixo de zero'),
    };
  }

  const extensao = maximo - minimo || 1;
  return {
    modo: 'linear',
    minimo,
    maximo,
    cor: (v) => aplicar((v - minimo) / extensao),
    marcas: [0, 0.25, 0.5, 0.75, 1].map((p) => ({ p, valor: minimo + extensao * p })),
    descricao: 'escala linear: distâncias de cor correspondem a distâncias de valor',
    descricaoDoValor: (v) => `${(((v - minimo) / extensao) * 100).toFixed(1)}% da amplitude`,
  };
}

function formatarCurtoNumero(v) {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return v.toExponential(1);
  return String(Math.round(v * 100) / 100);
}

/** Fração dos valores ≤ v, por busca binária no array ordenado. */
export function posicaoNoOrdenado(ordenados, v) {
  let baixo = 0;
  let alto = ordenados.length;
  while (baixo < alto) {
    const meio = (baixo + alto) >> 1;
    if (ordenados[meio] <= v) baixo = meio + 1;
    else alto = meio;
  }
  return ordenados.length > 1 ? (baixo - 1) / (ordenados.length - 1) : 0;
}

function desenharRegua({
  svg, x, y, altura, escala, formatar, tema, fonte, corDaAusencia, temAusencia,
}) {
  const passos = 32;
  const alturaDoPasso = altura / passos;
  for (let i = 0; i < passos; i++) {
    const p = 1 - i / (passos - 1);
    const valor = escala.modo === 'quantil'
      ? escala.marcas[0].valor + p * (escala.marcas[escala.marcas.length - 1].valor - escala.marcas[0].valor)
      : escala.minimo + p * (escala.maximo - escala.minimo);
    criarSvgEl('rect', {
      pai: svg,
      classe: 'hd-legenda',
      atributos: {
        x,
        y: y + i * alturaDoPasso,
        width: 12,
        height: alturaDoPasso + 0.5,
        fill: escala.cor(valor),
      },
    });
  }

  for (const marca of escala.marcas) {
    const texto = criarSvgEl('text', {
      pai: svg,
      classe: 'hd-legenda',
      atributos: {
        x: x + 15,
        y: y + altura * (1 - marca.p),
        'dominant-baseline': 'central',
        'font-size': Math.max(8, fonte - 2),
        fill: tema.textoSuave,
      },
    });
    definirTexto(texto, formatar(marca.valor));
  }

  // A ausência ganha a própria entrada na régua: sem isso, a cor cinza no
  // mapa não teria significado declarado.
  if (temAusencia) {
    criarSvgEl('rect', {
      pai: svg,
      classe: 'hd-legenda',
      atributos: { x, y: y + altura + 10, width: 12, height: 12, fill: corDaAusencia },
    });
    const texto = criarSvgEl('text', {
      pai: svg,
      classe: 'hd-legenda',
      atributos: {
        x: x + 15,
        y: y + altura + 16,
        'dominant-baseline': 'central',
        'font-size': Math.max(8, fonte - 2),
        fill: tema.textoSuave,
      },
    });
    definirTexto(texto, 'sem dado');
  }
}
