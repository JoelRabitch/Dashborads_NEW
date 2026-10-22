/**
 * treemap_carteira — "Treemap de Carteira".
 *
 * Retângulos proporcionais ao TAMANHO (posição, receita, exposição) e
 * coloridos por uma SEGUNDA medida (variação, margem, risco) numa escala
 * divergente centrada em zero. É o mapa de calor de carteira: o tamanho
 * diz quanto pesa, a cor diz como foi.
 *
 * Duas escolhas que mudam a leitura e por isso são explícitas:
 *
 *   - **a cor é centrada em ZERO, não no intervalo dos dados.** Centrar na
 *     média faria uma carteira inteira no vermelho aparecer metade verde;
 *   - **o limite da escala de cor é simétrico** (o mesmo valor para os dois
 *     lados), senão +2% e −2% ganham intensidades diferentes e o olho
 *     compara errado.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import {
  treemap as d3Treemap,
  treemapSquarify,
  treemapBinary,
  treemapSliceDice,
  hierarchy as d3Hierarchy,
} from 'd3-hierarchy';
import { construirHierarquia, opcoesDeHierarquia, opcoesDinamicasDeHierarquia } from '../../core/hierarquia.js';
import { interpoladorContinuo, textoLegivelSobre, coresDaPaleta } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';

const CSS = `
.tm-area{position:relative;width:100%;height:100%;overflow:hidden;}
.tm-bloco{cursor:pointer;}
.tm-texto{pointer-events:none;}
.tm-grupo-titulo{pointer-events:none;font-weight:600;}
.tm-legenda{position:absolute;right:8px;bottom:6px;display:flex;align-items:center;gap:6px;
  font-size:10px;pointer-events:none;}
.tm-barra-legenda{width:90px;height:8px;border-radius:2px;}
.tm-nota{position:absolute;left:8px;bottom:6px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Abaixo disto não cabe nem o nome abreviado. */
const LARGURA_MINIMA_PARA_ROTULO = 44;
const ALTURA_MINIMA_PARA_ROTULO = 18;

const ARRANJOS = {
  squarify: treemapSquarify,
  binary: treemapBinary,
  fatias: treemapSliceDice,
};

export default defineViz({
  id: 'treemap_carteira',
  label: 'Treemap de Carteira',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeHierarquia(),
      {
        arranjo: {
          type: 'string',
          label: 'Como arrumar os retângulos',
          section: 'Treemap',
          display: 'select',
          default: 'squarify',
          values: listaDeValores([
            { rotulo: 'Quadrados (squarify)', valor: 'squarify' },
            { rotulo: 'Binário', valor: 'binary' },
            { rotulo: 'Fatias alternadas', valor: 'fatias' },
          ]),
        },
        colorirPor: {
          type: 'string',
          label: 'Cor dos retângulos',
          section: 'Cores',
          display: 'select',
          default: 'segundaMedida',
          values: listaDeValores([
            { rotulo: 'Por uma segunda medida (divergente)', valor: 'segundaMedida' },
            { rotulo: 'Pelo grupo de primeiro nível', valor: 'grupo' },
          ]),
        },
        escalaDivergente: {
          type: 'string',
          label: 'Escala da cor',
          section: 'Cores',
          display: 'select',
          default: 'vermelhoVerde',
          values: listaDeValores([
            { rotulo: 'Vermelho → Verde', valor: 'vermelhoVerde' },
            { rotulo: 'Vermelho → Azul (daltonismo-seguro)', valor: 'vermelhoAzul' },
            { rotulo: 'Marrom → Verde', valor: 'marromVerde' },
            { rotulo: 'Roxo → Laranja', valor: 'roxoLaranja' },
          ]),
        },
        limiteDaCor: {
          type: 'string',
          label: 'Limite da escala (vazio = o maior desvio dos dados)',
          section: 'Cores',
          default: '',
          placeholder: 'ex.: 0.1 para ±10%',
        },
        inverterEscala: {
          type: 'boolean',
          label: 'Inverter a escala (quando valor alto é ruim)',
          section: 'Cores',
          default: false,
        },
        maximoDeBlocos: {
          type: 'number',
          label: 'Máximo de retângulos (o resto vira "Outros")',
          section: 'Treemap',
          display: 'range',
          min: 20,
          max: 600,
          step: 10,
          default: 150,
        },
        espacoEntreBlocos: {
          type: 'number',
          label: 'Espaço entre retângulos (px)',
          section: 'Treemap',
          display: 'range',
          min: 0,
          max: 8,
          step: 1,
          default: 1,
        },
        mostrarTitulosDeGrupo: {
          type: 'boolean',
          label: 'Faixa com o nome de cada grupo',
          section: 'Treemap',
          default: true,
        },
        mostrarValorNoBloco: {
          type: 'boolean',
          label: 'Escrever o valor dentro do retângulo',
          section: 'Rótulos',
          default: true,
        },
        mostrarLegendaDeCor: {
          type: 'boolean',
          label: 'Mostrar a régua de cores',
          section: 'Cores',
          default: true,
        },
      }
    ),
    { mostrarRotulos: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = opcoesDinamicasDeHierarquia(modelo);
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaCor', 'Medida da cor', medidas, {
          secao: 'Cores',
          incluirNenhum: true,
          padrao: (medidas[1] || medidas[0]).nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const { raiz: hierarquia, avisos, campoDoValor } = construirHierarquia(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (!hierarquia || !hierarquia.children || !hierarquia.children.length) {
      ctx.mostrarVazio(
        'Não consegui montar a carteira. Use uma ou mais dimensões (uma por nível) ' +
          'e uma medida com o tamanho de cada posição.'
      );
      return;
    }

    // Negativos não existem num treemap: a área de um retângulo não pode
    // ser negativa. O d3 os trataria como zero silenciosamente.
    const negativos = hierarquia.leaves().filter((no) => (no.data.valor || 0) < 0);
    if (negativos.length) {
      ctx.avisar(
        `${negativos.length} posição(ões) têm tamanho negativo e não aparecem: a área de um ` +
          'retângulo não pode ser negativa. Use o valor absoluto no Explore, ou mova essa medida para a cor.'
      );
    }

    if (!hierarquia.value) {
      ctx.mostrarVazio('A soma dos tamanhos é zero: não há área para distribuir.');
      return;
    }

    const poda = podarCarteira(hierarquia, Number(config.maximoDeBlocos) || 150);
    if (poda.aviso) ctx.avisar(poda.aviso);
    const arvore = poda.raiz;

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'tm');
    const area = criarEl('div', { classe: 'tm-area', pai: raiz });

    // ---------- Layout ----------
    const espaco = Number(config.espacoEntreBlocos) || 0;
    // A faixa de título só faz sentido se sobrar altura para o conteúdo do
    // grupo: com muitos grupos, as faixas sozinhas comem a área inteira.
    const gruposDePrimeiroNivel = (arvore.children || []).length;
    const alturaDoTitulo =
      config.mostrarTitulosDeGrupo !== false && arvore.height > 1 && gruposDePrimeiroNivel <= 40
        ? 16
        : 0;

    const layout = d3Treemap()
      .size([largura, altura])
      .tile(ARRANJOS[config.arranjo] || treemapSquarify)
      .paddingInner(espaco)
      .paddingTop(alturaDoTitulo)
      .round(true);
    layout(arvore);

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Cores ----------
    const campoDaCor = config.campoDaCor
      ? modelo.medidas.find((m) => m.nome === config.campoDaCor)
      : modelo.medidas[1] || null;

    const porGrupo = config.colorirPor === 'grupo' || !campoDaCor;
    const escalaDeCor = porGrupo
      ? criarCoresPorGrupo(arvore, config, tema)
      : criarEscalaDivergente({ hierarquia: arvore, modelo, campoDaCor, config });

    const formatarValor = formatadorDeValueFormat(campoDoValor && campoDoValor.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 0,
    });
    const formatarCor = campoDaCor
      ? formatadorDeValueFormat(campoDaCor.valueFormat, { casas: 2 })
      : null;

    // ---------- Faixas de grupo ----------
    if (alturaDoTitulo > 0) {
      for (const no of arvore.descendants()) {
        if (no.depth !== 1 || !no.children) continue;
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'tm-grupo-titulo',
          atributos: {
            x: no.x0 + 4,
            y: no.y0 + alturaDoTitulo - 5,
            'font-size': Math.max(9, tema.tamanhoBase - 1),
            fill: tema.texto,
          },
        });
        definirTexto(
          texto,
          truncar(`${no.data.rotulo} · ${formatarValor(no.value)}`, Math.floor((no.x1 - no.x0) / 6))
        );
      }
    }

    // ---------- Retângulos ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    for (const folha of arvore.leaves()) {
      const w = folha.x1 - folha.x0;
      const h = folha.y1 - folha.y0;
      if (w <= 0 || h <= 0) continue;

      const valorDaCor = porGrupo ? null : lerValorDaCor(modelo, folha, campoDaCor);
      const cor = porGrupo ? escalaDeCor(folha) : escalaDeCor.cor(valorDaCor);

      const bloco = criarSvgEl('rect', {
        pai: svg,
        classe: 'tm-bloco',
        atributos: {
          x: folha.x0, y: folha.y0, width: w, height: h,
          fill: cor, stroke: tema.fundo, 'stroke-width': 0.5,
        },
      });

      // Rótulo só onde cabe — num treemap de carteira a cauda é sempre
      // formada por retângulos de poucos pixels.
      if (
        config.mostrarRotulos !== false &&
        w >= LARGURA_MINIMA_PARA_ROTULO &&
        h >= ALTURA_MINIMA_PARA_ROTULO
      ) {
        const corDoTexto = textoLegivelSobre(cor, tema);
        const tamanho = Math.min(Math.max(9, tema.tamanhoBase), h / 2.6);

        const nome = criarSvgEl('text', {
          pai: svg,
          classe: 'tm-texto',
          atributos: {
            x: folha.x0 + 4, y: folha.y0 + tamanho + 2,
            'font-size': tamanho, 'font-weight': '600', fill: corDoTexto,
          },
        });
        definirTexto(nome, truncar(folha.data.rotulo, Math.floor(w / (tamanho * 0.58))));

        if (config.mostrarValorNoBloco !== false && h >= ALTURA_MINIMA_PARA_ROTULO + tamanho) {
          const texto = porGrupo || valorDaCor === null
            ? formatarValor(folha.value)
            : `${formatarValor(folha.value)} · ${formatarCor(valorDaCor)}`;
          const valor = criarSvgEl('text', {
            pai: svg,
            classe: 'tm-texto',
            atributos: {
              x: folha.x0 + 4, y: folha.y0 + tamanho * 2 + 4,
              'font-size': tamanho * 0.85, fill: corDoTexto, opacity: 0.85,
            },
          });
          definirTexto(valor, truncar(texto, Math.floor(w / (tamanho * 0.52))));
        }
      }

      if (tooltip) {
        ctx.eventos.on(bloco, 'pointerenter', (ev) => {
          const linhas = [
            {
              rotulo: campoDoValor ? campoDoValor.rotuloCurto : 'Tamanho',
              valor: formatarValor(folha.value),
            },
            {
              rotulo: 'Peso na carteira',
              valor: formatarPercentual(folha.value / arvore.value, 2),
            },
          ];
          if (!porGrupo && valorDaCor !== null) {
            linhas.push({ rotulo: campoDaCor.rotuloCurto, valor: formatarCor(valorDaCor), cor });
          }
          if (folha.parent && folha.parent.data.rotulo) {
            linhas.push({ rotulo: 'Grupo', valor: folha.parent.data.rotulo });
          }
          tooltip.mostrar({ titulo: folha.data.rotulo, linhas }, ev.clientX, ev.clientY);
        });
        ctx.eventos.on(bloco, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(bloco, 'pointerleave', () => tooltip.esconder());
      }

      ctx.eventos.on(bloco, 'click', (ev) => {
        if (folha.data.indiceDaLinha < 0 || !folha.data.campo) return;
        const celula = modelo.celula(modelo.linhas[folha.data.indiceDaLinha], folha.data.campo.nome);
        if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
      });
    }

    // ---------- Régua de cores ----------
    if (!porGrupo && config.mostrarLegendaDeCor !== false && escalaDeCor.limite > 0) {
      const legenda = criarEl('div', { classe: 'tm-legenda', pai: area });
      legenda.style.color = tema.texto;
      legenda.style.background = tema.fundo;
      legenda.style.padding = '2px 6px';
      legenda.style.borderRadius = '4px';

      criarEl('span', { pai: legenda, texto: formatarCor(-escalaDeCor.limite) });
      const barra = criarEl('div', { classe: 'tm-barra-legenda', pai: legenda });
      barra.style.background = `linear-gradient(to right, ${escalaDeCor.cor(-escalaDeCor.limite)}, ${escalaDeCor.cor(
        0
      )}, ${escalaDeCor.cor(escalaDeCor.limite)})`;
      criarEl('span', { pai: legenda, texto: formatarCor(escalaDeCor.limite) });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

/**
 * Corta a carteira no máximo de retângulos.
 *
 * Um treemap com milhares de posições não é um gráfico: cada retângulo fica
 * com poucos pixels e, pior, cada GRUPO ganha uma faixa de título que, em
 * quantidade, consome a área toda. Mantemos as maiores posições e somamos o
 * resto num bloco "Outros", que preserva o total.
 */
export function podarCarteira(raiz, maximo) {
  const folhas = raiz.leaves().filter((no) => (no.value || 0) > 0);
  if (folhas.length <= maximo) return { raiz, aviso: null };

  const ordenadas = folhas.slice().sort((a, b) => (b.value || 0) - (a.value || 0));
  const mantidas = new Set(ordenadas.slice(0, maximo - 1));
  const resto = ordenadas.slice(maximo - 1);
  const somaDoResto = resto.reduce((a, no) => a + (no.value || 0), 0);

  // Remonta a árvore só com o que ficou, preservando os níveis.
  const dadosPodados = podarNo(raiz, mantidas);
  dadosPodados.filhos.push({
    chave: '__outros__',
    rotulo: `Outros (${resto.length})`,
    valor: somaDoResto,
    filhos: [],
    indiceDaLinha: -1,
  });

  const nova = hierarquiaDe(dadosPodados);
  return {
    raiz: nova,
    aviso: `A carteira tem ${folhas.length} posições; as ${maximo - 1} maiores aparecem e as outras ${resto.length} foram somadas em "Outros".`,
  };
}

function podarNo(no, mantidas) {
  const dados = {
    chave: no.data.chave,
    rotulo: no.data.rotulo,
    valor: no.children ? 0 : no.data.valor,
    indiceDaLinha: no.data.indiceDaLinha,
    campo: no.data.campo,
    filhos: [],
  };
  for (const filho of no.children || []) {
    if (!filho.children) {
      if (mantidas.has(filho)) dados.filhos.push({ ...filho.data, filhos: [] });
      continue;
    }
    const podado = podarNo(filho, mantidas);
    if (podado.filhos.length) dados.filhos.push(podado);
  }
  return dados;
}

/** Valor da medida de cor na linha que originou a folha. */
function lerValorDaCor(modelo, folha, campoDaCor) {
  if (!campoDaCor || folha.data.indiceDaLinha < 0) return null;
  return modelo.valorNumerico(modelo.linhas[folha.data.indiceDaLinha], campoDaCor.nome);
}

/**
 * Escala divergente CENTRADA EM ZERO e SIMÉTRICA.
 *
 * Centrar na média faria uma carteira inteira no vermelho aparecer metade
 * verde. E um limite assimétrico daria intensidades diferentes a +2% e
 * −2%, fazendo o olho comparar errado.
 */
export function criarEscalaDivergente({ hierarquia, modelo, campoDaCor, config }) {
  const valores = [];
  for (const folha of hierarquia.leaves()) {
    const v = lerValorDaCor(modelo, folha, campoDaCor);
    if (v !== null && Number.isFinite(v)) valores.push(v);
  }

  const manual = Number(String(config.limiteDaCor || '').replace(',', '.'));
  const limite = Number.isFinite(manual) && manual > 0
    ? manual
    : valores.reduce((a, v) => Math.max(a, Math.abs(v)), 0);

  const interpolar = interpoladorContinuo(config.escalaDivergente || 'vermelhoVerde');
  const inverter = !!config.inverterEscala;

  return {
    limite,
    cor(valor) {
      if (valor === null || !Number.isFinite(valor) || limite === 0) return '#9CA3AF';
      const preso = Math.max(-limite, Math.min(limite, valor));
      const t = (preso + limite) / (2 * limite);
      return interpolar(inverter ? 1 - t : t);
    },
  };
}

/** Uma cor por grupo de primeiro nível, herdada pelos descendentes. */
function hierarquiaDe(dados) {
  return d3Hierarchy(dados, (no) => no.filhos)
    .sum((no) => (no.filhos && no.filhos.length ? 0 : no.valor || 0))
    .sort((a, b) => (b.value || 0) - (a.value || 0));
}

function criarCoresPorGrupo(hierarquia, config, tema) {
  const paleta = coresDaPaleta(config.paleta);
  const porRamo = new Map();
  (hierarquia.children || []).forEach((filho, i) => porRamo.set(filho, paleta[i % paleta.length]));

  return (no) => {
    let atual = no;
    while (atual.parent && atual.parent.parent) atual = atual.parent;
    return porRamo.get(atual) || paleta[0] || tema.destaque;
  };
}
