/**
 * qq_plot — "Q-Q Plot (Normalidade)".
 *
 * Quantis observados contra quantis teóricos de uma normal. Responde
 * "esses dados são normais?" melhor do que qualquer teste de hipótese,
 * porque mostra ONDE eles deixam de ser — e um p-valor não mostra.
 *
 * Três decisões de método, todas declaradas na tela:
 *
 * 1. **Posição de plotagem.** O i-ésimo valor ordenado não corresponde ao
 *    quantil i/n (o maior valor não é o quantil 100%). A correção tem
 *    várias fórmulas e elas discordam justamente nas CAUDAS, que é onde se
 *    olha. O padrão aqui é Blom, feita para a normal.
 * 2. **Reta de referência.** Por média e desvio, ou robusta pelos quartis.
 *    Com outliers, a primeira é puxada por eles e a nuvem inteira parece
 *    torta; a segunda ignora as pontas e mostra o miolo no lugar.
 * 3. **Envelope.** O desvio que importa não é o visível, é o grande demais
 *    para o acaso. O envelope é PONTUAL: com 100 pontos, ~5 fora dele é o
 *    esperado, não é sinal. Está escrito na nota.
 *
 * E, o mais útil: o gráfico NOMEIA a forma. "Pontos tortos" não é
 * conclusão; "cauda direita pesada" é.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo, prepararCanvas } from '../../core/dom.js';
import { escalaNumerica } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { acharMaisProximo } from '../../core/interaction.js';
import { desenharSimboloNoCanvas } from '../../core/shapes.js';
import {
  limparEOrdenar,
  quantil,
  quantilNormalPadrao,
  densidadeNormal,
  resumoDeDistribuicao,
} from '../../core/estatistica.js';
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
.qq-area{position:relative;width:100%;height:100%;}
.qq-canvas{position:absolute;left:0;top:0;}
.qq-svg{position:absolute;left:0;top:0;}
.qq-marca{pointer-events:none;}
.qq-reta{pointer-events:none;}
.qq-envelope{pointer-events:none;}
.qq-caixa{position:absolute;right:10px;top:8px;font-size:11px;line-height:1.5;
  padding:6px 8px;border-radius:4px;pointer-events:none;max-width:46%;}
.qq-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

const LIMITE_PARA_CANVAS = 2000;

/** Abaixo disso a forma da nuvem é ruído, não assinatura de distribuição. */
export const MINIMO_PARA_FORMA = 20;

/**
 * Fórmulas de posição de plotagem.
 *
 * Todas respondem "qual probabilidade corresponde ao i-ésimo de n valores
 * ordenados?" — e todas existem porque `i/n` daria 100% para o maior
 * valor, cujo quantil normal é infinito. Elas discordam nas caudas, que é
 * exatamente onde o Q-Q plot é lido.
 */
export const POSICOES = {
  blom: { rotulo: 'Blom — (i − 3/8) ÷ (n + 1/4), feita para a normal', a: 3 / 8 },
  hazen: { rotulo: 'Hazen — (i − 1/2) ÷ n', a: 1 / 2 },
  weibull: { rotulo: 'Weibull — i ÷ (n + 1)', a: 0 },
};

export default defineViz({
  id: 'qq_plot',
  label: 'Q-Q Plot (Normalidade)',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        posicaoDePlotagem: {
          type: 'string',
          label: 'Posição de plotagem',
          section: 'Q-Q',
          display: 'select',
          default: 'blom',
          values: listaDeValores(
            Object.keys(POSICOES).map((chave) => ({ rotulo: POSICOES[chave].rotulo, valor: chave }))
          ),
        },
        retaDeReferencia: {
          type: 'string',
          label: 'Reta de referência',
          section: 'Q-Q',
          display: 'select',
          default: 'quartis',
          values: listaDeValores([
            { rotulo: 'Pelos quartis (resistente a outliers)', valor: 'quartis' },
            { rotulo: 'Pela média e desvio-padrão', valor: 'momentos' },
            { rotulo: 'Nenhuma', valor: 'nenhuma' },
          ]),
        },
        mostrarEnvelope: {
          type: 'boolean',
          label: 'Envelope pontual de 95%',
          section: 'Q-Q',
          default: true,
        },
        padronizarEixoY: {
          type: 'boolean',
          label: 'Mostrar o eixo Y em desvios-padrão (z observado)',
          section: 'Q-Q',
          default: false,
        },
        diagnosticarForma: {
          type: 'boolean',
          label: 'Nomear a forma da nuvem (caudas, assimetria)',
          section: 'Q-Q',
          default: true,
        },
        tamanhoDoPonto: {
          type: 'number',
          label: 'Tamanho do ponto',
          section: 'Formato',
          display: 'range',
          min: 1,
          max: 16,
          step: 0.5,
          default: 5,
        },
        opacidadeDoPonto: {
          type: 'number',
          label: 'Opacidade do ponto',
          section: 'Formato',
          display: 'range',
          min: 0.05,
          max: 1,
          step: 0.05,
          default: 0.8,
        },
        corDaReta: {
          type: 'string',
          label: 'Cor da reta de referência',
          section: 'Formato',
          display: 'color',
          default: '#DC2626',
        },
      }
    ),
    { gradeEixoY: true, gradeEixoX: true, tituloEixoX: 'Quantis teóricos (normal padrão)' }
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const saida = {};
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDosValores', 'Medida analisada', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        })
      );
    }
    if (dimensoes.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoRotulo', 'Dimensão que identifica o ponto', dimensoes, {
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

    const medida =
      modelo.medidas.find((m) => m.nome === config.campoDosValores) || modelo.medidas[0] || null;
    if (!medida) {
      ctx.mostrarVazio('Esta visualização precisa de uma medida com os valores a analisar.');
      return;
    }

    const campoDoRotulo =
      config.campoDoRotulo === ''
        ? null
        : modelo.dimensoes.find((d) => d.nome === config.campoDoRotulo) || modelo.dimensoes[0] || null;

    // Cada LINHA é uma observação. Numa consulta agregada há um valor só por
    // categoria, e um Q-Q plot de 5 pontos não diz nada sobre normalidade.
    const brutos = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const v = modelo.valorNumerico(modelo.linhas[i], medida.nome);
      if (v === null) continue;
      brutos.push({
        valor: v,
        indice: i,
        rotulo: campoDoRotulo ? modelo.texto(modelo.linhas[i], campoDoRotulo.nome, undefined, '') : '',
      });
    }

    if (brutos.length < 3) {
      ctx.mostrarVazio(
        'Um Q-Q plot precisa das OBSERVAÇÕES, não de um total. ' +
          'Traga as linhas sem agregar (ou agrupe por uma dimensão mais fina) no Explore.'
      );
      return;
    }

    const pontos = montarQQ(brutos, config.posicaoDePlotagem || 'blom');
    const resumo = resumoDeDistribuicao(pontos.map((p) => p.valor));

    if (pontos.length < MINIMO_PARA_FORMA) {
      ctx.avisar(
        `São ${pontos.length} observações. Abaixo de ${MINIMO_PARA_FORMA}, a nuvem de um Q-Q plot ` +
          'fica torta por acaso mesmo em dados perfeitamente normais — a forma não é conclusiva.'
      );
    }
    if (resumo.desvio === 0) {
      ctx.mostrarVazio('Todos os valores são iguais: não há distribuição para comparar com a normal.');
      return;
    }

    // ---------- Reta de referência ----------
    const modoDaReta = config.retaDeReferencia || 'quartis';
    const reta = modoDaReta === 'nenhuma' ? null : calcularRetaDeReferencia(pontos, modoDaReta);

    // ---------- Eixo Y padronizado ----------
    const padronizar = !!config.padronizarEixoY;
    const paraY = padronizar
      ? (v) => (v - resumo.media) / resumo.desvio
      : (v) => v;

    for (const p of pontos) p.y = paraY(p.valor);

    const retaNoEixo = reta
      ? {
          intercepto: padronizar ? (reta.intercepto - resumo.media) / resumo.desvio : reta.intercepto,
          inclinacao: padronizar ? reta.inclinacao / resumo.desvio : reta.inclinacao,
          modo: reta.modo,
          modoEmTexto: reta.modoEmTexto,
        }
      : null;
    if (retaNoEixo) retaNoEixo.previsto = (z) => retaNoEixo.intercepto + retaNoEixo.inclinacao * z;

    // ---------- Envelope ----------
    const envelope =
      retaNoEixo && config.mostrarEnvelope !== false
        ? envelopePontual(pontos, retaNoEixo)
        : null;

    const diagnostico =
      config.diagnosticarForma !== false && pontos.length >= MINIMO_PARA_FORMA && reta
        ? diagnosticarForma(pontos, reta)
        : null;

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'qq');
    const area = criarEl('div', { classe: 'qq-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatarValor = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });
    const formatarY = padronizar ? (v) => `${v.toFixed(1)} σ` : formatarValor;
    const formatarZ = (z) => z.toFixed(1);

    const valoresY = [
      ...pontos.map((p) => p.y),
      ...(envelope ? envelope.flatMap((e) => [e.superior, e.inferior]) : []),
    ];
    const valoresZ = pontos.map((p) => p.z);

    const margens = calcularMargens({
      rotulosY: valoresY.map(formatarY),
      rotulosX: valoresZ.map(formatarZ),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaX = escalaNumerica({
      valores: valoresZ,
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config,
      eixo: 'X',
    });
    const escalaY = escalaNumerica({
      valores: valoresY,
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config,
      eixo: 'Y',
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'qq-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    desenharEixos({
      svg, escalaX, escalaY, area: retangulo, config, tema,
      formatarX: formatarZ, formatarY,
    });

    const corDaReta = config.corDaReta || tema.negativo;

    if (envelope && envelope.length > 1) {
      const cima = envelope.map((e) => `${escalaX(e.z)},${escalaY(e.superior)}`);
      const baixo = envelope.slice().reverse().map((e) => `${escalaX(e.z)},${escalaY(e.inferior)}`);
      criarSvgEl('path', {
        pai: svg,
        classe: 'qq-envelope',
        atributos: {
          d: `M${cima.join('L')}L${baixo.join('L')}Z`,
          fill: comOpacidade(corDaReta, 0.1),
        },
      });
    }

    if (retaNoEixo) {
      const z0 = Math.min(...valoresZ);
      const z1 = Math.max(...valoresZ);
      criarSvgEl('line', {
        pai: svg,
        classe: 'qq-reta',
        atributos: {
          x1: escalaX(z0), y1: escalaY(retaNoEixo.previsto(z0)),
          x2: escalaX(z1), y2: escalaY(retaNoEixo.previsto(z1)),
          stroke: corDaReta,
          'stroke-width': 2,
        },
      });
    }

    // ---------- Pontos ----------
    const raioDoPonto = (Number(config.tamanhoDoPonto) || 5) / 2;
    const opacidade = Number(config.opacidadeDoPonto) || 0.8;
    const corDoPonto = coresDaPaleta(config.paleta)[0];
    const usarCanvas = pontos.length > LIMITE_PARA_CANVAS;

    for (const p of pontos) {
      p.px = escalaX(p.z);
      p.py = escalaY(p.y);
      p.foraDoEnvelope = false;
    }
    if (envelope) {
      envelope.forEach((e, i) => {
        pontos[i].foraDoEnvelope = pontos[i].y > e.superior || pontos[i].y < e.inferior;
      });
    }
    const quantosFora = pontos.filter((p) => p.foraDoEnvelope).length;

    if (usarCanvas) {
      const canvas = criarEl('canvas', { classe: 'qq-canvas' });
      area.insertBefore(canvas, svg);
      const { ctx: pincel } = prepararCanvas(canvas, largura, altura);
      if (pincel) {
        pincel.globalAlpha = opacidade;
        for (const p of pontos) {
          pincel.fillStyle = p.foraDoEnvelope ? corDaReta : corDoPonto;
          desenharSimboloNoCanvas(pincel, 'circulo', p.px, p.py, raioDoPonto * 2);
          pincel.fill();
        }
        pincel.globalAlpha = 1;
      } else {
        ctx.avisar('O navegador não forneceu contexto 2D; os pontos não foram desenhados.');
      }
    } else {
      for (const p of pontos) {
        criarSvgEl('circle', {
          pai: svg,
          classe: 'qq-marca',
          atributos: {
            cx: p.px, cy: p.py, r: raioDoPonto,
            fill: p.foraDoEnvelope ? corDaReta : corDoPonto,
            opacity: opacidade,
          },
        });
      }
    }

    // ---------- Caixa com o diagnóstico ----------
    const caixa = criarEl('div', { classe: 'qq-caixa', pai: area });
    caixa.style.background = comOpacidade(tema.fundo, 0.88);
    caixa.style.color = tema.texto;
    caixa.style.border = `1px solid ${tema.borda}`;

    const linhasDaCaixa = [`n = ${pontos.length}`];
    if (diagnostico) linhasDaCaixa.push(diagnostico.titulo);
    if (envelope) {
      const esperados = Math.round(pontos.length * 0.05);
      linhasDaCaixa.push(`${quantosFora} fora do envelope (≈${esperados} esperados por acaso)`);
    }
    for (const texto of linhasDaCaixa) {
      const linha = criarEl('div', { pai: caixa });
      definirTexto(linha, texto);
    }
    if (diagnostico && diagnostico.explicacao) {
      const explicacao = criarEl('div', { pai: caixa });
      explicacao.style.opacity = '.75';
      explicacao.style.marginTop = '3px';
      definirTexto(explicacao, diagnostico.explicacao);
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'qq-nota', pai: area });
    nota.style.color = tema.textoSuave;
    const partes = [
      `posição de plotagem: ${(POSICOES[config.posicaoDePlotagem] || POSICOES.blom).rotulo.split(' —')[0]}`,
    ];
    if (retaNoEixo) partes.push(`reta ${retaNoEixo.modoEmTexto}`);
    if (envelope) partes.push('envelope PONTUAL de 95% (não simultâneo: alguns pontos fora são esperados)');
    if (usarCanvas) partes.push('pontos em canvas');
    definirTexto(nota, partes.join(' · '));

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ctx.eventos.on(area, 'pointermove', (ev) => {
      if (!tooltip) return;
      const caixaDaArea = area.getBoundingClientRect();
      const alvo = acharMaisProximo({
        itens: pontos,
        x: ev.clientX - caixaDaArea.left,
        y: ev.clientY - caixaDaArea.top,
        raio: Math.max(8, raioDoPonto + 5),
        obterX: (p) => p.px,
        obterY: (p) => p.py,
      });
      if (!alvo) {
        tooltip.esconder();
        return;
      }
      const linhas = [
        { rotulo: medida.rotuloCurto, valor: formatarValor(alvo.valor), cor: corDoPonto },
        { rotulo: 'Posição', valor: `${alvo.ordem} de ${pontos.length} (${(alvo.p * 100).toFixed(1)}%)` },
        { rotulo: 'Quantil teórico', valor: `${alvo.z.toFixed(3)} σ` },
      ];
      if (retaNoEixo) {
        linhas.push({ rotulo: 'Esperado pela reta', valor: formatarY(retaNoEixo.previsto(alvo.z)) });
      }
      if (alvo.foraDoEnvelope) {
        linhas.push({ rotulo: 'Este ponto', valor: 'fora do envelope de 95%', cor: corDaReta });
      }
      tooltip.mostrar(
        { titulo: alvo.rotulo ? truncar(alvo.rotulo, 40) : medida.rotuloCurto, linhas },
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

/**
 * Ordena as observações e associa a cada uma a sua posição de plotagem e o
 * quantil teórico correspondente.
 *
 * A posição de plotagem geral é `(i − a) ÷ (n + 1 − 2a)`, que reproduz
 * Blom (a = 3/8), Hazen (a = 1/2) e Weibull (a = 0). Nenhuma delas usa
 * `i/n`, porque isso daria p = 1 para o maior valor — e o quantil normal
 * de 1 é infinito.
 *
 * @returns {Array<{valor, ordem, p, z, indice, rotulo}>}
 */
export function montarQQ(brutos, nomeDaPosicao = 'blom') {
  const a = (POSICOES[nomeDaPosicao] || POSICOES.blom).a;
  const ordenados = brutos
    .filter((b) => Number.isFinite(b.valor))
    .slice()
    .sort((x, y) => x.valor - y.valor);

  const n = ordenados.length;
  return ordenados.map((item, i) => {
    const ordem = i + 1;
    const p = (ordem - a) / (n + 1 - 2 * a);
    return { ...item, ordem, p, z: quantilNormalPadrao(p) };
  });
}

/**
 * Reta de referência.
 *
 * `momentos` usa média e desvio — e é puxada pelos outliers, exatamente os
 * pontos cuja anormalidade queremos enxergar. `quartis` passa pelos pontos
 * (z₂₅, Q1) e (z₇₅, Q3), ignora as pontas e mostra o miolo no lugar certo.
 * É por isso que a robusta é o padrão.
 */
export function calcularRetaDeReferencia(pontos, modo = 'quartis') {
  const valores = pontos.map((p) => p.valor);

  if (modo === 'momentos') {
    const resumo = resumoDeDistribuicao(valores);
    return {
      inclinacao: resumo.desvio,
      intercepto: resumo.media,
      modo,
      modoEmTexto: 'pela média e desvio',
      previsto: (z) => resumo.media + resumo.desvio * z,
    };
  }

  const ordenados = limparEOrdenar(valores);
  const q1 = quantil(ordenados, 0.25);
  const q3 = quantil(ordenados, 0.75);
  const z1 = quantilNormalPadrao(0.25);
  const z3 = quantilNormalPadrao(0.75);

  // Quartis iguais (mais de metade dos valores repetidos): a reta robusta
  // seria horizontal e não serviria de referência. Cai para os momentos.
  if (q3 === q1) return calcularRetaDeReferencia(pontos, 'momentos');

  const inclinacao = (q3 - q1) / (z3 - z1);
  const intercepto = q1 - inclinacao * z1;
  return {
    inclinacao,
    intercepto,
    modo: 'quartis',
    modoEmTexto: 'pelos quartis (robusta)',
    previsto: (z) => intercepto + inclinacao * z,
  };
}

/**
 * Envelope pontual de 95% em torno da reta.
 *
 * O erro-padrão do i-ésimo valor ordenado de uma amostra normal é
 * `σ·√(p(1−p)/n) ÷ φ(z_p)` — ele cresce nas caudas porque lá a densidade
 * φ é pequena e um pulo de probabilidade vira um pulo grande de valor. Por
 * isso o envelope é uma ampulheta, estreita no meio e larga nas pontas.
 *
 * É PONTUAL: vale para cada ponto isoladamente. Com 100 pontos, ~5 fora é
 * o esperado. Tratá-lo como banda simultânea é o erro clássico — e por
 * isso o gráfico escreve isso na tela.
 */
export function envelopePontual(pontos, reta, z = 1.959964) {
  const n = pontos.length;
  const sigma = Math.abs(reta.inclinacao);
  return pontos.map((ponto) => {
    const densidade = densidadeNormal(ponto.z, 0, 1);
    const previsto = reta.previsto(ponto.z);
    if (!(densidade > 1e-12) || !(n > 0)) {
      return { z: ponto.z, previsto, superior: previsto, inferior: previsto, erro: 0 };
    }
    const erro = (sigma * Math.sqrt((ponto.p * (1 - ponto.p)) / n)) / densidade;
    return {
      z: ponto.z,
      previsto,
      erro,
      superior: previsto + z * erro,
      inferior: previsto - z * erro,
    };
  });
}

/**
 * Nomeia a forma da nuvem.
 *
 * "Os pontos estão tortos" não é conclusão. "A cauda direita é pesada" é,
 * e aponta para o que fazer. A leitura é a clássica:
 *
 * - desvio POSITIVO na cauda alta e NEGATIVO na baixa → caudas pesadas
 *   (curva em S): mais extremos do que a normal prevê;
 * - desvio NEGATIVO na alta e POSITIVO na baixa → caudas leves;
 * - desvios do MESMO sinal nas duas pontas → assimetria (curva em C).
 *
 * As pontas são os 10% de cada lado, e o desvio é medido em unidades do
 * erro-padrão esperado — senão a escala dos dados decidiria o diagnóstico.
 */
export function diagnosticarForma(pontos, reta, fracaoDaCauda = 0.1) {
  const n = pontos.length;
  if (n < MINIMO_PARA_FORMA || !reta) return null;

  const tamanho = Math.max(2, Math.round(n * fracaoDaCauda));
  const escala = Math.abs(reta.inclinacao) || 1;

  const desvioMedio = (lista) =>
    lista.reduce((soma, p) => soma + (p.valor - reta.previsto(p.z)) / escala, 0) / lista.length;

  const baixa = desvioMedio(pontos.slice(0, tamanho));
  const alta = desvioMedio(pontos.slice(n - tamanho));

  // Abaixo disso o desvio é ruído: em dados normais as pontas oscilam
  // naturalmente algumas décimas de σ.
  const limiar = 0.35;
  const altaForte = Math.abs(alta) > limiar;
  const baixaForte = Math.abs(baixa) > limiar;

  if (!altaForte && !baixaForte) {
    return {
      forma: 'normal',
      titulo: 'Compatível com a normal',
      explicacao: 'As pontas acompanham a reta dentro do esperado.',
      alta,
      baixa,
    };
  }

  if (alta > limiar && baixa < -limiar) {
    return {
      forma: 'caudasPesadas',
      titulo: 'Caudas pesadas (curva em S)',
      explicacao: 'Há mais valores extremos dos dois lados do que uma normal produziria.',
      alta,
      baixa,
    };
  }
  if (alta < -limiar && baixa > limiar) {
    return {
      forma: 'caudasLeves',
      titulo: 'Caudas leves (curva em S invertido)',
      explicacao: 'Os extremos são mais contidos do que numa normal — distribuição truncada ou limitada.',
      alta,
      baixa,
    };
  }

  const paraCima = (altaForte ? alta : 0) + (baixaForte ? baixa : 0) > 0;
  return {
    forma: paraCima ? 'assimetriaDireita' : 'assimetriaEsquerda',
    titulo: paraCima ? 'Assimetria à direita (curva em C)' : 'Assimetria à esquerda (curva em C)',
    explicacao: paraCima
      ? 'A cauda longa está nos valores altos. Transformar por log costuma aproximar da normal.'
      : 'A cauda longa está nos valores baixos.',
    alta,
    baixa,
  };
}
