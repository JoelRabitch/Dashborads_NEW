/**
 * boxplot_avancado — "Boxplot Avançado".
 *
 * O que torna este boxplot "avançado" não é enfeite: é mostrar o que o
 * boxplot comum ESCONDE.
 *
 * 1. **A bimodalidade.** É a mentira clássica da caixa: duas modas bem
 *    separadas produzem exatamente a mesma caixa que uma distribuição
 *    espalhada por igual. Mediana, quartis e bigodes são idênticos, e a
 *    conclusão ("o valor típico é X") é falsa nos dois casos de um jeito
 *    diferente. Aqui a distribuição passa por uma contagem de picos e, se
 *    houver mais de um, a caixa é marcada e o aviso é explícito.
 * 2. **O tamanho da amostra.** Uma caixa de 5 observações tem o mesmo
 *    desenho de uma de 5.000. A largura proporcional a √n faz o grupo
 *    pequeno PARECER pequeno — que é a única forma honesta de desenhá-lo
 *    ao lado do grande.
 * 3. **A incerteza da mediana.** O entalhe de ±1,58 × IQR/√n responde
 *    "essa diferença de medianas é real?". Entalhes que não se sobrepõem
 *    são evidência de diferença; os que se sobrepõem, não são evidência de
 *    igualdade — mesma ressalva do `intervalo_confianca`, e ela está na
 *    nota.
 *
 * Os métodos vão declarados na tela: quartil tipo 7 (padrão do R e do d3),
 * bigode de 1,5 × IQR (Tukey) parando no último valor REAL.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica, escalaDeBanda } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { densidadePorKernel } from '../../core/estatistica.js';
import {
  opcoesDeDistribuicao,
  opcoesDinamicasDeDistribuicao,
  prepararDistribuicoes,
  rotuloDaCategoria,
  linhasDeResumo,
  MINIMO_CONFIAVEL,
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
.bx-area{position:relative;width:100%;height:100%;}
.bx-svg{position:absolute;left:0;top:0;}
.bx-marca{pointer-events:none;}
.bx-caixa{pointer-events:none;}
.bx-ponto{pointer-events:none;}
.bx-aviso-forma{pointer-events:none;font-weight:700;}
.bx-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Até este n, cada observação ainda cabe desenhada ao lado da caixa. */
const LIMITE_PARA_PONTOS = 150;

/**
 * Constante do entalhe. O intervalo aproximado de 95% da mediana é
 * `mediana ± 1,58 × IQR/√n` — a aproximação de McGill, Tukey e Larsen.
 */
export const CONSTANTE_DO_ENTALHE = 1.58;

export default defineViz({
  id: 'boxplot_avancado',
  label: 'Boxplot Avançado',
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
          section: 'Boxplot',
          display: 'select',
          default: 'vertical',
          values: listaDeValores([
            { rotulo: 'Categorias no eixo X (caixas verticais)', valor: 'vertical' },
            { rotulo: 'Categorias no eixo Y (caixas horizontais)', valor: 'horizontal' },
          ]),
        },
        comEntalhe: {
          type: 'boolean',
          label: 'Entalhe de confiança da mediana',
          section: 'Boxplot',
          default: true,
        },
        larguraPorRaizDeN: {
          type: 'boolean',
          label: 'Largura da caixa proporcional a √n',
          section: 'Boxplot',
          default: true,
        },
        mostrarOutliers: {
          type: 'boolean',
          label: 'Marcar os pontos fora de 1,5 × IQR',
          section: 'Boxplot',
          default: true,
        },
        mostrarObservacoes: {
          type: 'string',
          label: 'Observações individuais',
          section: 'Boxplot',
          display: 'select',
          default: 'automatico',
          values: listaDeValores([
            { rotulo: 'Quando o n for pequeno (automático)', valor: 'automatico' },
            { rotulo: 'Sempre que couber', valor: 'sempre' },
            { rotulo: 'Nunca', valor: 'nunca' },
          ]),
        },
        mostrarMedia: {
          type: 'boolean',
          label: 'Marcar a média (losango)',
          section: 'Boxplot',
          default: true,
        },
        avisarBimodal: {
          type: 'boolean',
          label: 'Denunciar distribuições com mais de um pico',
          section: 'Boxplot',
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

    // ---------- Forma da distribuição ----------
    if (config.avisarBimodal !== false) {
      for (const grupo of grupos) {
        grupo.forma = detectarPicos(grupo.valores);
      }
      const multimodais = grupos.filter((g) => g.forma && g.forma.picos > 1);
      if (multimodais.length) {
        ctx.avisar(
          `${multimodais.length} categoria(s) têm mais de um pico: ` +
            `${multimodais.map((g) => g.rotulo).slice(0, 4).join(', ')}` +
            `${multimodais.length > 4 ? '…' : ''}. ` +
            'Uma caixa não distingue duas modas separadas de uma distribuição espalhada por igual — ' +
            'os quartis são os mesmos nos dois casos. Veja a distribuição no Violin ou no Densidade e ECDF.'
        );
      }
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'bx');
    const area = criarEl('div', { classe: 'bx-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });
    const ehVertical = (config.orientacao || 'vertical') === 'vertical';

    const extremos = grupos.flatMap((g) => [g.resumo.minimo, g.resumo.maximo]);
    const rotulos = grupos.map((g) => rotuloDaCategoria(g, config));

    const margens = calcularMargens({
      rotulosY: ehVertical ? extremos.map(formatar) : rotulos,
      rotulosX: ehVertical ? rotulos : extremos.map(formatar),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaDeCategoria = escalaDeBanda({
      dominio: grupos.map((g) => g.chave),
      intervalo: ehVertical
        ? [retangulo.esquerda, retangulo.esquerda + retangulo.largura]
        : [retangulo.cima, retangulo.cima + retangulo.altura],
      config: { larguraDaBarra: 70, espacamentoEntreGrupos: 10 },
    });
    const escalaDeValor = escalaNumerica({
      valores: extremos,
      intervalo: ehVertical
        ? [retangulo.cima + retangulo.altura, retangulo.cima]
        : [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config,
      eixo: ehVertical ? 'Y' : 'X',
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'bx-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const nomeDaCategoria = (chave) => {
      const g = grupos.find((item) => item.chave === chave);
      return g ? rotuloDaCategoria(g, config) : String(chave);
    };
    const centro = (chave) => escalaDeCategoria(chave) + escalaDeCategoria.bandwidth() / 2;

    const escalaDeCategoriaNoY = (chave) => centro(chave);
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

    // ---------- Caixas ----------
    const paleta = coresDaPaleta(config.paleta);
    const faixa = escalaDeCategoria.bandwidth();
    const maiorN = Math.max(...grupos.map((g) => g.resumo.n));
    const porRaiz = config.larguraPorRaizDeN !== false;

    const modoDosPontos = config.mostrarObservacoes || 'automatico';

    grupos.forEach((grupo, indice) => {
      const cor = paleta[indice % paleta.length];
      grupo.cor = cor;

      // Largura ∝ √n: é a convenção, e a razão é que o erro-padrão cai com
      // √n. Uma caixa de 5 observações do mesmo tamanho de uma de 5.000
      // afirma uma solidez que ela não tem.
      const proporcao = porRaiz ? Math.sqrt(grupo.resumo.n / maiorN) : 1;
      const meia = Math.max(3, (faixa / 2) * Math.max(0.25, proporcao));
      const c = centro(grupo.chave);
      grupo.meia = meia;
      grupo.centro = c;

      const entalhe =
        config.comEntalhe !== false ? calcularEntalhe(grupo.resumo) : null;
      grupo.entalhe = entalhe;

      // --- Bigodes ---
      const linha = (de, ate, espessura = 1) =>
        criarSvgEl('line', {
          pai: svg,
          classe: 'bx-marca',
          atributos: {
            x1: ehVertical ? c : escalaDeValor(de),
            x2: ehVertical ? c : escalaDeValor(ate),
            y1: ehVertical ? escalaDeValor(de) : c,
            y2: ehVertical ? escalaDeValor(ate) : c,
            stroke: tema.texto,
            'stroke-width': espessura,
          },
        });

      linha(grupo.limites.bigodeInferior, grupo.resumo.q1);
      linha(grupo.resumo.q3, grupo.limites.bigodeSuperior);

      for (const ponta of [grupo.limites.bigodeInferior, grupo.limites.bigodeSuperior]) {
        const p = escalaDeValor(ponta);
        criarSvgEl('line', {
          pai: svg,
          classe: 'bx-marca',
          atributos: {
            x1: ehVertical ? c - meia * 0.5 : p,
            x2: ehVertical ? c + meia * 0.5 : p,
            y1: ehVertical ? p : c - meia * 0.5,
            y2: ehVertical ? p : c + meia * 0.5,
            stroke: tema.texto,
            'stroke-width': 1,
          },
        });
      }

      // --- Caixa (com entalhe quando houver) ---
      criarSvgEl('path', {
        pai: svg,
        classe: 'bx-caixa',
        atributos: {
          d: caminhoDaCaixa({
            q1: escalaDeValor(grupo.resumo.q1),
            q3: escalaDeValor(grupo.resumo.q3),
            mediana: escalaDeValor(grupo.resumo.mediana),
            // O entalhe é PRESO aos quartis no desenho: solto, ele sai da
            // caixa e, com n pequeno, sai do próprio gráfico. O fato de
            // ele ter estourado não é escondido — vira a cor da mediana e
            // uma linha no tooltip.
            entalheBaixo: entalhe
              ? escalaDeValor(Math.max(entalhe.inferior, grupo.resumo.q1))
              : null,
            entalheAlto: entalhe
              ? escalaDeValor(Math.min(entalhe.superior, grupo.resumo.q3))
              : null,
            centro: c,
            meia,
            ehVertical,
          }),
          fill: comOpacidade(cor, 0.35),
          stroke: cor,
          'stroke-width': 1.5,
          'stroke-linejoin': 'round',
        },
      });

      // --- Mediana ---
      const yMediana = escalaDeValor(grupo.resumo.mediana);
      const meiaMediana = entalhe ? meia * 0.5 : meia;
      criarSvgEl('line', {
        pai: svg,
        classe: 'bx-marca',
        atributos: {
          x1: ehVertical ? c - meiaMediana : yMediana,
          x2: ehVertical ? c + meiaMediana : yMediana,
          y1: ehVertical ? yMediana : c - meiaMediana,
          y2: ehVertical ? yMediana : c + meiaMediana,
          stroke: entalhe && entalhe.passaDosQuartis ? tema.atencao : tema.texto,
          'stroke-width': 2.5,
        },
      });

      // --- Média ---
      if (config.mostrarMedia !== false) {
        const p = escalaDeValor(grupo.resumo.media);
        const r = Math.min(5, meia * 0.5);
        const cx = ehVertical ? c : p;
        const cy = ehVertical ? p : c;
        criarSvgEl('path', {
          pai: svg,
          classe: 'bx-marca',
          atributos: {
            d: `M${cx},${cy - r}L${cx + r},${cy}L${cx},${cy + r}L${cx - r},${cy}Z`,
            fill: tema.fundo,
            stroke: tema.texto,
            'stroke-width': 1.2,
          },
        });
      }

      // --- Observações ---
      const cabem =
        modoDosPontos === 'sempre'
          ? grupo.resumo.n <= LIMITE_PARA_PONTOS * 4
          : modoDosPontos === 'automatico' && grupo.resumo.n <= LIMITE_PARA_PONTOS;

      if (cabem) {
        grupo.valores.forEach((valor, i) => {
          const p = escalaDeValor(valor);
          const desvio = deslocamentoEstavel(i) * meia * 0.8;
          criarSvgEl('circle', {
            pai: svg,
            classe: 'bx-ponto',
            atributos: {
              cx: ehVertical ? c + desvio : p,
              cy: ehVertical ? p : c + desvio,
              r: 1.8,
              fill: tema.texto,
              opacity: 0.35,
            },
          });
        });
      }

      // --- Outliers ---
      if (config.mostrarOutliers !== false) {
        for (const valor of grupo.limites.outliers) {
          const p = escalaDeValor(valor);
          criarSvgEl('circle', {
            pai: svg,
            classe: 'bx-outlier',
            atributos: {
              cx: ehVertical ? c : p,
              cy: ehVertical ? p : c,
              r: 2.5,
              fill: 'none',
              stroke: cor,
              'stroke-width': 1.2,
            },
          });
        }
      }

      // --- Marca de forma ---
      if (grupo.forma && grupo.forma.picos > 1) {
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'bx-aviso-forma',
          atributos: {
            x: ehVertical ? c : retangulo.esquerda + retangulo.largura - 4,
            y: ehVertical ? retangulo.cima + 10 : c - meia - 3,
            'text-anchor': ehVertical ? 'middle' : 'end',
            'font-size': Math.max(9, tema.tamanhoBase - 1),
            fill: tema.atencao,
          },
        });
        definirTexto(texto, `${grupo.forma.picos} picos`);
      }
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'bx-nota', pai: area });
    nota.style.color = tema.textoSuave;
    const partes = [
      'quartis tipo 7 (padrão do R)',
      'bigodes de 1,5 × IQR parando no último valor real (Tukey)',
    ];
    if (porRaiz) partes.push('largura ∝ √n');
    if (config.comEntalhe !== false) {
      partes.push(
        `entalhe = mediana ± ${String(CONSTANTE_DO_ENTALHE).replace('.', ',')} × IQR/√n — ` +
          'entalhes que NÃO se sobrepõem são evidência de diferença; os que se sobrepõem não são evidência de igualdade'
      );
    }
    definirTexto(nota, partes.join(' · '));

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const grupoEm = (ev) => {
      const caixa = area.getBoundingClientRect();
      const posicao = ehVertical ? ev.clientX - caixa.left : ev.clientY - caixa.top;
      let melhor = null;
      let menor = Infinity;
      for (const grupo of grupos) {
        const d = Math.abs(grupo.centro - posicao);
        if (d < menor) {
          menor = d;
          melhor = grupo;
        }
      }
      return menor <= escalaDeCategoria.step() / 2 ? melhor : null;
    };

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const grupo = grupoEm(ev);
      if (!grupo) {
        tooltip.esconder();
        return;
      }
      const linhas = linhasDeResumo(grupo, formatar, grupo.cor);
      linhas.splice(1, 0, {
        rotulo: 'Bigodes',
        valor: `${formatar(grupo.limites.bigodeInferior)} – ${formatar(grupo.limites.bigodeSuperior)}`,
      });
      if (grupo.entalhe) {
        linhas.push({
          rotulo: 'Entalhe da mediana',
          valor: `${formatar(grupo.entalhe.inferior)} – ${formatar(grupo.entalhe.superior)}`,
        });
        if (grupo.entalhe.passaDosQuartis) {
          linhas.push({
            rotulo: 'Atenção',
            valor: 'o entalhe passa dos quartis: a mediana é imprecisa',
            cor: tema.atencao,
          });
        }
      }
      if (grupo.forma && grupo.forma.picos > 1) {
        linhas.push({
          rotulo: 'Forma',
          valor: `${grupo.forma.picos} picos — a caixa não mostra isso`,
          cor: tema.atencao,
        });
      }
      tooltip.mostrar({ titulo: grupo.rotulo, linhas }, ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      if (tooltip) tooltip.esconder();
    });

    ctx.eventos.on(area, 'click', (ev) => {
      const grupo = grupoEm(ev);
      if (!grupo || !campoDaCategoria) return;
      const celula = ctx.modelo.celula(ctx.modelo.linhas[grupo.indiceDaLinha], campoDaCategoria.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

/**
 * Deslocamento determinístico para espalhar observações dentro da caixa.
 *
 * Determinístico de propósito: com `Math.random` os pontos saltariam a
 * cada redesenho (e a cada passagem do mouse que force uma renderização),
 * o que faz a mesma consulta parecer dados diferentes.
 */
export function deslocamentoEstavel(i) {
  // Sequência de van der Corput base 2: espalha uniformemente em [0,1)
  // sem agrupar, para qualquer quantidade de pontos.
  let n = i + 1;
  let fracao = 0;
  let denominador = 2;
  while (n > 0) {
    fracao += (n % 2) / denominador;
    n = Math.floor(n / 2);
    denominador *= 2;
  }
  return fracao * 2 - 1;
}

/**
 * Intervalo aproximado de 95% da mediana (McGill, Tukey e Larsen).
 *
 * `mediana ± 1,58 × IQR/√n`. É o que o entalhe desenha, e serve à pergunta
 * "essa diferença de medianas é real?" — com a mesma ressalva do
 * `intervalo_confianca`: não se sobrepor é evidência de diferença;
 * sobrepor-se NÃO é evidência de igualdade.
 */
export function calcularEntalhe(resumo) {
  if (!resumo || !(resumo.n > 1) || !(resumo.iqr >= 0)) return null;
  const meia = (CONSTANTE_DO_ENTALHE * resumo.iqr) / Math.sqrt(resumo.n);
  return {
    meia,
    inferior: resumo.mediana - meia,
    superior: resumo.mediana + meia,
    // O entalhe pode passar dos quartis quando o n é pequeno. É o próprio
    // desenho dizendo "não sei onde a mediana está", e esconder isso
    // apararia justamente a informação.
    passaDosQuartis: resumo.mediana - meia < resumo.q1 || resumo.mediana + meia > resumo.q3,
  };
}

/**
 * Caminho da caixa, com ou sem entalhe.
 *
 * O entalhe é um estreitamento na altura da mediana. Quando ele passa dos
 * quartis (n pequeno, IQR grande), o contorno é desenhado assim mesmo:
 * a "borboleta" resultante é o gráfico admitindo que não sabe onde a
 * mediana está.
 */
export function caminhoDaCaixa({
  q1, q3, mediana, entalheBaixo, entalheAlto, centro, meia, ehVertical,
}) {
  const comEntalhe = entalheBaixo !== null && entalheAlto !== null;
  const dentro = meia * 0.5;

  const ponto = (aoLongo, perpendicular) =>
    ehVertical ? `${centro + perpendicular},${aoLongo}` : `${aoLongo},${centro + perpendicular}`;

  if (!comEntalhe) {
    return [
      `M${ponto(q1, -meia)}`,
      `L${ponto(q3, -meia)}`,
      `L${ponto(q3, meia)}`,
      `L${ponto(q1, meia)}`,
      'Z',
    ].join('');
  }

  // Lado "negativo" subindo de q1 a q3, com o estreitamento no meio, e o
  // lado "positivo" descendo de volta.
  return [
    `M${ponto(q1, -meia)}`,
    `L${ponto(entalheAlto, -meia)}`,
    `L${ponto(mediana, -dentro)}`,
    `L${ponto(entalheBaixo, -meia)}`,
    `L${ponto(q3, -meia)}`,
    `L${ponto(q3, meia)}`,
    `L${ponto(entalheBaixo, meia)}`,
    `L${ponto(mediana, dentro)}`,
    `L${ponto(entalheAlto, meia)}`,
    `L${ponto(q1, meia)}`,
    'Z',
  ].join('');
}

/**
 * Conta os picos da distribuição.
 *
 * Esta é a defesa contra a mentira clássica da caixa: duas modas bem
 * separadas e uma distribuição espalhada por igual têm os MESMOS quartis,
 * os mesmos bigodes e a mesma mediana. A caixa é idêntica e a conclusão
 * é falsa dos dois lados.
 *
 * Um pico só conta se for alto o bastante (≥ 25% do maior) e se o vale
 * que o separa do vizinho descer o suficiente (≤ 75% do menor dos dois) —
 * senão qualquer ondulação do kernel viraria "bimodal", e um aviso que
 * dispara à toa é pior do que aviso nenhum.
 *
 * @returns {{picos:number, posicoes:number[]}|null}
 */
export function detectarPicos(valores, { alturaMinima = 0.25, quedaMinima = 0.75 } = {}) {
  const limpos = valores.filter((v) => v !== null && Number.isFinite(v));
  if (limpos.length < MINIMO_CONFIAVEL) return null;

  const { curva, maximo } = densidadePorKernel({ valores: limpos, pontos: 128 });
  if (!maximo) return null;

  const candidatos = [];
  for (let i = 1; i < curva.length - 1; i++) {
    const d = curva[i].densidade;
    if (d >= curva[i - 1].densidade && d > curva[i + 1].densidade && d >= maximo * alturaMinima) {
      candidatos.push(i);
    }
  }
  if (candidatos.length <= 1) {
    return { picos: candidatos.length, posicoes: candidatos.map((i) => curva[i].x) };
  }

  // Mantém o primeiro e, a cada vizinho, só aceita o próximo se houver um
  // vale de verdade entre eles.
  const aceitos = [candidatos[0]];
  for (let k = 1; k < candidatos.length; k++) {
    const anterior = aceitos[aceitos.length - 1];
    const atual = candidatos[k];
    let vale = Infinity;
    for (let i = anterior; i <= atual; i++) vale = Math.min(vale, curva[i].densidade);
    const menorPico = Math.min(curva[anterior].densidade, curva[atual].densidade);
    if (vale <= menorPico * quedaMinima) aceitos.push(atual);
    else if (curva[atual].densidade > curva[anterior].densidade) aceitos[aceitos.length - 1] = atual;
  }

  return { picos: aceitos.length, posicoes: aceitos.map((i) => curva[i].x) };
}
