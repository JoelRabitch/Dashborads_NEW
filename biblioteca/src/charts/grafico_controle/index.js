/**
 * grafico_controle — "Gráfico de Controle".
 *
 * Responde a pergunta que quase todo painel ignora: **isso é sinal ou é
 * ruído?** Todo processo varia. O gráfico de controle separa a variação
 * COMUM (a que o processo sempre teve) da variação ESPECIAL (a que tem
 * causa), traçando uma linha central e limites a ±3σ e marcando o que sai
 * fora — ou o que, mesmo dentro, forma um padrão improvável demais.
 *
 * Duas coisas aqui são escolhas de método, não detalhes:
 *
 * 1. **Como σ é estimado.** O desvio-padrão amostral comum é inflado
 *    justamente pelas causas especiais que queremos detectar: um processo
 *    fora de controle produz limites largos o bastante para esconder que
 *    está fora de controle. A amplitude móvel (|xᵢ − xᵢ₋₁| ÷ d₂) usa só a
 *    variação de curto prazo e não tem esse defeito — é o método de
 *    Shewhart, e é o padrão aqui.
 *
 * 2. **O que é um ponto.** Se cada ponto já é a média de n observações, os
 *    limites verdadeiros são σ/√n — mais estreitos. A consulta não conta
 *    isso, então o gráfico declara a hipótese em vez de fingir que sabe.
 *
 * Campos: 1 dimensão de período e 1 medida (com várias séries, só a
 * primeira é usada, com aviso).
 *
 * Opções (correções v2):
 *   - Cores: a linha usa a paleta ("Inverter ordem das cores" incluído) —
 *     antes lia `corDeDestaque`, que não é opção deste gráfico, e a aba
 *     Cores não mudava nada; "Cor dos pontos fora de controle" continua
 *     valendo; opacidade e contorno valem nos pontos.
 *   - Rótulos: valor nos pontos (todos, se couberem; senão o último) e
 *     os textos LSC/LC/LIC ("Escrever os valores…") seguem o bloco
 *     Rótulos; "Mostrar rótulos" desligado esconde todos.
 *   - "Marcar cada período com um ponto" desligado esconde os pontos
 *     comuns; os pontos com sinal ficam sempre (são a razão do gráfico).
 *   - Tooltip único, valor no texto do Looker; clique pela "Ação do clique".
 *   - Eixos: escala/mínimo/máximo/inverter do Y e "Inverter eixo X".
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { geradorDeLinha, criarMarcadorSvg } from '../../core/shapes.js';
import { tratarNulos, opcaoDeOrigemDasSeries } from '../../core/series.js';
import { comOpacidade } from '../../core/theme.js';
import { quantil } from '../../core/estatistica.js';
import { corDoItem, opacidadeDoConfig, lerContorno, aplicarContorno } from '../../core/cores.js';
import { lerRotulos, textoDoRotulo, criarRotuloSvg } from '../../core/rotulos.js';
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
import {
  opcoesDeTracado,
  lerSerieTemporal,
  montarPlano,
  desenharReferencia,
  desenharRotulosDosPontos,
  ligarGuiaEHover,
  celulaDoPonto,
  textoDoPonto,
  valueFormatDaSerie,
  destruirSerieTemporal,
  avisarSeForaDeOrdem,
} from '../_serie_temporal/index.js';

/**
 * d₂ para subgrupos de 2 — a constante que converte a amplitude móvel
 * média em estimativa de σ. Vale 2/√π ≈ 1,128.
 */
export const D2_SUBGRUPO_2 = 1.128;

/**
 * Abaixo disto os limites são instáveis: calculados sobre poucos pontos,
 * eles se mexem muito a cada período novo e "fora de controle" vira sorte.
 * O número clássico de Wheeler é 20 a 25 pontos.
 */
export const MINIMO_PARA_LIMITES = 20;

/** As oito regras de Nelson, com o nome que o usuário vê. */
export const REGRAS = [
  { id: 1, rotulo: '1 ponto fora dos 3σ', curto: 'fora de 3σ' },
  { id: 2, rotulo: '9 pontos seguidos do mesmo lado da média', curto: '9 do mesmo lado' },
  { id: 3, rotulo: '6 pontos seguidos subindo ou descendo', curto: 'tendência de 6' },
  { id: 4, rotulo: '14 pontos seguidos alternando para cima e para baixo', curto: '14 alternando' },
  { id: 5, rotulo: '2 de 3 pontos além de 2σ, do mesmo lado', curto: '2 de 3 além de 2σ' },
  { id: 6, rotulo: '4 de 5 pontos além de 1σ, do mesmo lado', curto: '4 de 5 além de 1σ' },
  { id: 7, rotulo: '15 pontos seguidos dentro de 1σ (variação pequena demais)', curto: '15 dentro de 1σ' },
  { id: 8, rotulo: '8 pontos seguidos fora de 1σ, dos dois lados', curto: '8 fora de 1σ' },
];

export default defineViz({
  id: 'grafico_controle',
  label: 'Gráfico de Controle',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      opcoesDeTracado({ espessuraPadrao: 1.5 }),
      {
        metodoDoSigma: {
          type: 'string',
          label: 'Como estimar o σ',
          section: 'Controle',
          display: 'select',
          default: 'amplitudeMovel',
          values: listaDeValores([
            { rotulo: 'Amplitude móvel ÷ d₂ (Shewhart)', valor: 'amplitudeMovel' },
            { rotulo: 'Desvio-padrão amostral', valor: 'desvioAmostral' },
          ]),
        },
        linhaCentral: {
          type: 'string',
          label: 'Linha central',
          section: 'Controle',
          display: 'select',
          default: 'media',
          values: listaDeValores([
            { rotulo: 'Média', valor: 'media' },
            { rotulo: 'Mediana (resistente a outliers)', valor: 'mediana' },
          ]),
        },
        larguraDosLimites: {
          type: 'number',
          label: 'Limites em quantos σ',
          section: 'Controle',
          display: 'range',
          min: 1,
          max: 4,
          step: 0.5,
          default: 3,
        },
        periodoBase: {
          type: 'number',
          label: 'Calcular os limites só com os N primeiros períodos (0 = todos)',
          section: 'Controle',
          display: 'number',
          default: 0,
        },
        mostrarZonas: {
          type: 'boolean',
          label: 'Sombrear as zonas de 1σ e 2σ',
          section: 'Controle',
          default: true,
        },
        regrasAtivas: {
          type: 'string',
          label: 'Regras de Nelson',
          section: 'Controle',
          display: 'select',
          default: 'principais',
          values: listaDeValores([
            { rotulo: 'Só pontos fora dos limites (regra 1)', valor: 'apenas1' },
            { rotulo: 'Principais (1, 2, 3, 5, 6)', valor: 'principais' },
            { rotulo: 'Todas as oito', valor: 'todas' },
          ]),
        },
        corDoSinal: {
          type: 'string',
          label: 'Cor dos pontos fora de controle',
          section: 'Controle',
          display: 'color',
          default: '#DC2626',
        },
        escreverLimites: {
          type: 'boolean',
          label: 'Escrever os valores de LSC, LC e LIC',
          section: 'Rótulos',
          default: true,
        },
      }
    ),
    { gradeEixoY: true, mostrarPontos: true, curvaDaLinha: 'linear' }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  render(ctx) {
    const { config, tema } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio(
        'Um gráfico de controle precisa de vários períodos da MESMA medida. ' +
          'Traga ao menos dois períodos no Explore.'
      );
      return;
    }

    // Um gráfico de controle fala de UM processo. Com várias séries, o
    // certo é um gráfico por processo — limites compartilhados entre séries
    // diferentes não significam nada.
    const series = tratarNulos(serie.matriz.series, config.tratamentoDeNulos || 'manter');
    if (series.length > 1) {
      ctx.avisar(
        `A consulta trouxe ${series.length} séries. Um gráfico de controle descreve UM processo, ` +
          `então os limites foram calculados só para "${series[0].rotulo}". ` +
          'Para comparar processos, use um gráfico por processo.'
      );
    }
    const escolhida = series[0];
    const valores = escolhida.valores;

    avisarSeForaDeOrdem(ctx, serie, 'As regras de controle dependem da sequência');

    // ---------- Limites ----------
    const base = Number(config.periodoBase) > 0
      ? valores.slice(0, Number(config.periodoBase))
      : valores;

    const limites = calcularLimites(base, {
      metodo: config.metodoDoSigma || 'amplitudeMovel',
      centro: config.linhaCentral || 'media',
      k: Number(config.larguraDosLimites) || 3,
    });

    if (!limites) {
      ctx.mostrarVazio(
        'Não há valores numéricos suficientes para estimar os limites de controle.'
      );
      return;
    }

    if (limites.sigma === 0) {
      ctx.avisar(
        'Todos os pontos do período base têm o mesmo valor: o σ estimado é zero e os limites ' +
          'colapsam na linha central. Qualquer variação futura apareceria como fora de controle.'
      );
    }

    const nDaBase = base.filter((v) => v !== null && Number.isFinite(v)).length;
    if (nDaBase < MINIMO_PARA_LIMITES) {
      ctx.avisar(
        `Os limites foram calculados com ${nDaBase} ponto(s). Abaixo de ${MINIMO_PARA_LIMITES} eles ` +
          'se mexem muito a cada período novo, e "fora de controle" passa a depender de sorte.'
      );
    }

    // ---------- Regras ----------
    const regrasAtivas = conjuntoDeRegras(config.regrasAtivas);
    const sinais = aplicarRegras(valores, limites, regrasAtivas);
    const forasDeControle = sinais.filter((s) => s.length > 0).length;

    // ---------- Desenho ----------
    const paraEscala = valores.filter((v) => v !== null && Number.isFinite(v));
    const plano = montarPlano({
      ctx,
      serie,
      valores: [...paraEscala, limites.superior, limites.inferior],
    });

    injetarEstilo(ctx.raiz, '.gc-sinal{pointer-events:none;}', 'gc');

    // A linha é a "série" do gráfico: cor da paleta (respeita "Inverter
    // ordem das cores" e a cor própria `cor_<série>`, se existir).
    const corDaLinha = corDoItem(config, 0, escolhida.chave);
    const corDoSinal = config.corDoSinal || tema.negativo;
    const rot = lerRotulos(config, tema);
    const opacidade = opacidadeDoConfig(config);
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });
    const valueFormat = valueFormatDaSerie(serie, escolhida);
    // Texto de um valor no padrão dos rótulos (formato/casas do painel; em
    // "automático", o formato do campo).
    const textoDoValor = (v, textoDoLooker) =>
      textoDoRotulo({ ...rot, conteudo: 'valor', truncar: 0 }, {
        valor: v,
        valueFormat,
        textoDoValor: textoDoLooker !== undefined ? textoDoLooker : serie.formatarValor(v),
      });

    if (config.mostrarZonas !== false && limites.sigma > 0) {
      desenharZonas({ svg: plano.svg, plano, limites, tema });
    }

    for (const marca of [
      { valor: limites.superior, nome: 'LSC', cor: corDoSinal },
      { valor: limites.centro, nome: 'LC', cor: tema.texto },
      { valor: limites.inferior, nome: 'LIC', cor: corDoSinal },
    ]) {
      const y = plano.escalaY(marca.valor);
      desenharReferencia({
        svg: plano.svg,
        retangulo: plano.retangulo,
        y,
        cor: marca.cor,
        tracejada: marca.nome !== 'LC',
        espessura: marca.nome === 'LC' ? 1.5 : 1,
      });
      // "Escrever os valores de LSC, LC e LIC" continua valendo, agora
      // com o estilo do bloco Rótulos (e sob "Mostrar rótulos").
      if (config.escreverLimites !== false) {
        const direita = Math.max(plano.retangulo.esquerda, plano.retangulo.esquerda + plano.retangulo.largura);
        const texto = criarRotuloSvg(plano.svg, rot, {
          x: direita - 2,
          y: y - 3 - rot.tamanho / 2,
          texto: `${marca.nome} ${textoDoValor(marca.valor)}`,
          ancora: 'end',
          corAutomatica: marca.cor,
        });
        if (texto) texto.setAttribute('class', 'bl-rotulo st-marca');
      }
    }

    const linha = geradorDeLinha({
      x: (_, i) => plano.x(i),
      y: (_, i) => plano.escalaY(valores[i]),
      curva: config.curvaDaLinha || 'linear',
      definido: (_, i) => valores[i] !== null && Number.isFinite(valores[i]),
    });
    criarSvgEl('path', {
      pai: plano.svg,
      classe: 'st-linha',
      atributos: {
        d: linha(serie.categorias) || '',
        stroke: corDaLinha,
        'stroke-width': Number(config.espessuraDaLinha) || 1.5,
        'stroke-linejoin': 'round',
      },
    });

    // Os pontos COM SINAL não são opcionais: num gráfico de controle o que
    // importa é cada ponto individual, não a tendência da linha. Os pontos
    // comuns seguem "Marcar cada período com um ponto" (padrão ligado aqui).
    const mostrarComuns = config.mostrarPontos !== false;
    const textosDoLooker = valores.map((v, i) =>
      v === null || !Number.isFinite(v) ? null : textoDoPonto(ctx, serie.matriz, i, escolhida, v, serie.formatarValor)
    );
    const pontosRotulaveis = [];
    serie.categorias.forEach((_, i) => {
      const valor = valores[i];
      if (valor === null || !Number.isFinite(valor)) return;
      const temSinal = sinais[i].length > 0;
      const x = plano.x(i);
      const y = plano.escalaY(valor);
      if (temSinal || mostrarComuns) {
        const ponto = criarMarcadorSvg(plano.svg, 'circulo', x, y, temSinal ? 9 : 5, {
          classe: temSinal ? 'gc-sinal' : 'st-ponto',
          fill: temSinal ? corDoSinal : corDaLinha,
          'fill-opacity': opacidade,
          'data-x': x,
          'data-y': y,
        });
        aplicarContorno(ponto, contorno);
      }
      pontosRotulaveis.push({
        indice: i,
        x,
        y,
        cor: temSinal ? corDoSinal : undefined,
        texto: textoDoRotulo(rot, {
          valor,
          nome: escolhida.rotulo,
          valueFormat,
          textoDoValor: textosDoLooker[i],
        }),
      });
    });

    desenharRotulosDosPontos({
      plano,
      rot,
      grupos: [{ pontos: pontosRotulaveis }],
      quantidadeDePeriodos: serie.categorias.length,
      raio: 4.5,
    });

    // ---------- Nota: o método e a hipótese ----------
    const nota = ctx.nota; // 5.1c: texto automático da nota
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      `σ por ${limites.metodoEmTexto} · limites a ±${limites.k}σ · ` +
        `${forasDeControle} de ${paraEscala.length} ponto(s) com sinal · ` +
        'cada ponto é tratado como uma observação (se já for uma média de n, os limites reais são mais estreitos)'
    );

    // ---------- Interação ----------
    ligarGuiaEHover({
      ctx,
      plano,
      serie,
      montarLinhasDoTooltip(indice) {
        const valor = valores[indice];
        if (valor === null || !Number.isFinite(valor)) return null;

        // O valor do ponto é o texto do Looker; centro e limites são
        // derivados, formatados pelo value_format do campo.
        const linhas = [
          { rotulo: escolhida.rotulo, valor: textosDoLooker[indice], cor: corDaLinha },
          { rotulo: 'Linha central', valor: serie.formatarValor(limites.centro) },
          {
            rotulo: 'Distância da média',
            valor: limites.sigma > 0 ? `${((valor - limites.centro) / limites.sigma).toFixed(2)} σ` : '—',
          },
          { rotulo: 'LSC / LIC', valor: `${serie.formatarValor(limites.superior)} / ${serie.formatarValor(limites.inferior)}` },
        ];

        // Cada regra é NOMEADA. Um ponto vermelho sem nome só diz "algo
        // está errado"; o nome diz o que procurar.
        for (const id of sinais[indice]) {
          const regra = REGRAS.find((r) => r.id === id);
          linhas.push({ rotulo: `Regra ${id}`, valor: regra ? regra.rotulo : '—', cor: corDoSinal });
        }
        return {
          linhas,
          variaveis: {
            valor: textosDoLooker[indice],
            serie: escolhida.rotulo,
            sigma: limites.sigma > 0 ? `${((valor - limites.centro) / limites.sigma).toFixed(2)} σ` : '—',
          },
        };
      },
      // O clique usa a célula do ponto (a medida), onde o Looker põe o drill.
      celulaDoClique: (indice) => celulaDoPonto(ctx, serie.matriz, indice, escolhida),
    });
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

function desenharZonas({ svg, plano, limites, tema }) {
  const faixas = [
    { de: 1, ate: 2, opacidade: 0.06 },
    { de: 2, ate: 3, opacidade: 0.1 },
  ];
  const unidade = limites.k / 3; // "3σ" vira "k σ" quando o usuário muda k

  for (const faixa of faixas) {
    for (const lado of [1, -1]) {
      const a = plano.escalaY(limites.centro + lado * faixa.de * unidade * limites.sigma);
      const b = plano.escalaY(limites.centro + lado * faixa.ate * unidade * limites.sigma);
      criarSvgEl('rect', {
        pai: svg,
        classe: 'st-marca',
        atributos: {
          x: plano.retangulo.esquerda,
          y: Math.min(a, b),
          width: plano.retangulo.largura,
          height: Math.abs(b - a),
          fill: comOpacidade(tema.atencao, faixa.opacidade),
        },
      });
    }
  }
}

function conjuntoDeRegras(escolha) {
  if (escolha === 'apenas1') return new Set([1]);
  if (escolha === 'todas') return new Set([1, 2, 3, 4, 5, 6, 7, 8]);
  return new Set([1, 2, 3, 5, 6]);
}

/**
 * Linha central e limites de controle.
 *
 * O método importa. `desvioAmostral` usa a variação TOTAL da série, que
 * inclui as causas especiais: um processo fora de controle alarga os
 * próprios limites até caber dentro deles. `amplitudeMovel` usa só
 * |xᵢ − xᵢ₋₁|, variação de curto prazo, que as causas especiais não
 * inflam da mesma forma — é por isso que é o padrão.
 *
 * @returns {{centro, sigma, superior, inferior, k, metodo, metodoEmTexto,
 *            n}|null}
 */
export function calcularLimites(valores, { metodo = 'amplitudeMovel', centro = 'media', k = 3 } = {}) {
  const limpos = valores.filter((v) => v !== null && Number.isFinite(v));
  if (limpos.length < 2) return null;

  const media = limpos.reduce((a, b) => a + b, 0) / limpos.length;
  const linhaCentral = centro === 'mediana' ? quantil(limpos.slice().sort((a, b) => a - b), 0.5) : media;

  let sigma;
  let metodoEmTexto;

  if (metodo === 'desvioAmostral') {
    const soma = limpos.reduce((a, v) => a + (v - media) ** 2, 0);
    sigma = Math.sqrt(soma / (limpos.length - 1));
    metodoEmTexto = 'desvio-padrão amostral';
  } else {
    // A amplitude móvel usa a sequência ORIGINAL (com os nulos pulados),
    // porque o que ela mede é a variação de um período para o seguinte.
    const amplitudes = [];
    let anterior = null;
    for (const v of valores) {
      if (v === null || !Number.isFinite(v)) continue;
      if (anterior !== null) amplitudes.push(Math.abs(v - anterior));
      anterior = v;
    }
    const mediaDasAmplitudes = amplitudes.length
      ? amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length
      : 0;
    sigma = mediaDasAmplitudes / D2_SUBGRUPO_2;
    metodoEmTexto = 'amplitude móvel ÷ d₂';
  }

  return {
    centro: linhaCentral,
    sigma,
    k,
    superior: linhaCentral + k * sigma,
    inferior: linhaCentral - k * sigma,
    metodo,
    metodoEmTexto,
    n: limpos.length,
  };
}

/**
 * Aplica as regras de Nelson e devolve, por posição, a lista de regras
 * disparadas.
 *
 * As regras trabalham em ZONAS: a distância do ponto à linha central
 * medida em σ. Posições sem valor não quebram as sequências — elas as
 * INTERROMPEM, porque "nove pontos seguidos" com um buraco no meio não são
 * nove pontos seguidos.
 *
 * @returns {Array<number[]>}
 */
export function aplicarRegras(valores, limites, ativas = new Set([1, 2, 3, 5, 6])) {
  const n = valores.length;
  const sinais = Array.from({ length: n }, () => []);
  if (!limites) return sinais;

  const marcar = (indice, regra) => {
    if (indice >= 0 && indice < n && !sinais[indice].includes(regra)) sinais[indice].push(regra);
  };

  // `z` em σ; null onde não há valor.
  const z = valores.map((v) => {
    if (v === null || !Number.isFinite(v)) return null;
    if (limites.sigma === 0) return v === limites.centro ? 0 : (v > limites.centro ? Infinity : -Infinity);
    return (v - limites.centro) / limites.sigma;
  });
  const unidade = limites.k / 3; // 1 "zona" em σ quando k ≠ 3

  // Regra 1 — fora dos limites.
  if (ativas.has(1)) {
    for (let i = 0; i < n; i++) {
      if (z[i] !== null && Math.abs(z[i]) > limites.k) marcar(i, 1);
    }
  }

  // Regra 2 — 9 seguidos do mesmo lado.
  if (ativas.has(2)) marcarSequencia(z, 9, (v) => v > 0, 2, marcar);
  if (ativas.has(2)) marcarSequencia(z, 9, (v) => v < 0, 2, marcar);

  // Regra 3 — 6 seguidos subindo ou descendo.
  if (ativas.has(3)) {
    marcarMonotonia(z, 6, 1, 3, marcar);
    marcarMonotonia(z, 6, -1, 3, marcar);
  }

  // Regra 4 — 14 alternando.
  if (ativas.has(4)) marcarAlternancia(z, 14, 4, marcar);

  // Regra 5 — 2 de 3 além de 2σ, do mesmo lado.
  if (ativas.has(5)) marcarKdeN(z, 2, 3, (v) => v > 2 * unidade, 5, marcar, (v) => v > 2 * unidade);
  if (ativas.has(5)) marcarKdeN(z, 2, 3, (v) => v < -2 * unidade, 5, marcar, (v) => v < -2 * unidade);

  // Regra 6 — 4 de 5 além de 1σ, do mesmo lado.
  if (ativas.has(6)) marcarKdeN(z, 4, 5, (v) => v > unidade, 6, marcar, (v) => v > unidade);
  if (ativas.has(6)) marcarKdeN(z, 4, 5, (v) => v < -unidade, 6, marcar, (v) => v < -unidade);

  // Regra 7 — 15 seguidos dentro de 1σ (variação pequena demais: em geral
  // sinal de subgrupo errado ou dado "arrumado", não de processo bom).
  if (ativas.has(7)) marcarSequencia(z, 15, (v) => Math.abs(v) < unidade, 7, marcar);

  // Regra 8 — 8 seguidos fora de 1σ, dos dois lados (bimodalidade).
  if (ativas.has(8)) marcarSequencia(z, 8, (v) => Math.abs(v) > unidade, 8, marcar);

  return sinais;
}

/** Marca todas as janelas de `tamanho` pontos consecutivos que satisfazem `teste`. */
function marcarSequencia(z, tamanho, teste, regra, marcar) {
  let corrida = 0;
  for (let i = 0; i < z.length; i++) {
    if (z[i] === null || !teste(z[i])) {
      corrida = 0;
      continue;
    }
    corrida += 1;
    if (corrida >= tamanho) {
      for (let j = i - tamanho + 1; j <= i; j++) marcar(j, regra);
    }
  }
}

/** Sequência monótona de `tamanho` pontos (`direcao` = +1 subindo, −1 descendo). */
function marcarMonotonia(z, tamanho, direcao, regra, marcar) {
  let corrida = 1;
  for (let i = 1; i < z.length; i++) {
    if (z[i] === null || z[i - 1] === null || (z[i] - z[i - 1]) * direcao <= 0) {
      corrida = 1;
      continue;
    }
    corrida += 1;
    if (corrida >= tamanho) {
      for (let j = i - tamanho + 1; j <= i; j++) marcar(j, regra);
    }
  }
}

/** Sequência de `tamanho` pontos alternando sobe/desce. */
function marcarAlternancia(z, tamanho, regra, marcar) {
  let corrida = 1;
  for (let i = 1; i < z.length; i++) {
    if (z[i] === null || z[i - 1] === null || z[i] === z[i - 1]) {
      corrida = 1;
      continue;
    }
    const sobe = z[i] > z[i - 1];
    const subiuAntes = i >= 2 && z[i - 2] !== null ? z[i - 1] > z[i - 2] : null;
    corrida = subiuAntes === null || subiuAntes === sobe ? 2 : corrida + 1;
    if (corrida >= tamanho) {
      for (let j = i - tamanho + 1; j <= i; j++) marcar(j, regra);
    }
  }
}

/**
 * "k de n consecutivos": marca os pontos da janela que de fato atendem ao
 * teste — não a janela inteira. Pintar os n pontos acusaria de sinal
 * observações que estão perfeitamente no lugar.
 */
function marcarKdeN(z, k, n, teste, regra, marcar, testeDoPonto) {
  for (let fim = n - 1; fim < z.length; fim++) {
    const janela = [];
    let valida = true;
    for (let j = fim - n + 1; j <= fim; j++) {
      if (z[j] === null) { valida = false; break; }
      janela.push(j);
    }
    if (!valida) continue;

    const atendem = janela.filter((j) => teste(z[j]));
    if (atendem.length >= k) {
      for (const j of atendem) {
        if (testeDoPonto(z[j])) marcar(j, regra);
      }
    }
  }
}
