/**
 * funil_comparativo — "Funil Comparativo".
 *
 * Vários funis lado a lado, um por segmento, para comparar a conversão
 * entre eles. Os segmentos vêm do pivô ou de uma segunda dimensão.
 *
 * Decisão que muda a leitura: por padrão **todos os funis compartilham a
 * mesma escala**, ou seja, a largura de uma etapa é comparável entre
 * segmentos. Normalizar cada funil pelo próprio topo (opção "Cada funil na
 * própria escala") faz as taxas ficarem comparáveis mas esconde que um
 * segmento é dez vezes maior que o outro — por isso não é o padrão.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { formatarPercentual } from '../../core/format.js';
import { coresDaPaleta } from '../../core/theme.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeLegenda,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  opcoesDeCorPorItem,
} from '../../core/options-kit.js';
import {
  CSS_FUNIL,
  opcoesDeFunil,
  lerEtapas,
  calcularConversoes,
  desenharFunil,
  resolverCoresDasEtapas,
  formatadorDoFunil,
  desenharTituloDoFunil,
} from '../_funil/index.js';

/** Quantos segmentos cabem antes de o gráfico virar ilegível. */
const MAXIMO_DE_SEGMENTOS = 8;

export default defineViz({
  id: 'funil_comparativo',
  label: 'Funil Comparativo',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores(),
      blocoDeLegenda(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeFunil({ estiloPadrao: 'barrasCentradas' }),
      {
        origemDosSegmentos: {
          type: 'string',
          label: 'De onde vêm os segmentos',
          section: 'Dados',
          display: 'select',
          default: 'auto',
          values: listaDeValores([
            { rotulo: 'Detectar sozinho', valor: 'auto' },
            { rotulo: 'Do pivô', valor: 'pivo' },
            { rotulo: 'Da 2ª dimensão', valor: 'dimensao' },
          ]),
        },
        escalaPorFunil: {
          type: 'boolean',
          label: 'Cada funil na própria escala (compara taxas, esconde tamanho)',
          section: 'Funil',
          default: false,
        },
        colorirPorSegmento: {
          type: 'boolean',
          label: 'Usar uma cor por segmento (em vez de uma por etapa)',
          section: 'Cores',
          default: true,
        },
      }
    ),
    {
      // Com vários funis estreitos lado a lado, o nome de cada etapa não
      // cabe ao lado de todos; a legenda resolve melhor.
      mostrarNomeDaEtapa: false,
      mostrarConversao: 'primeiraEtapa',
    }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  opcoesDinamicas({ modelo, config }) {
    const segmentos = lerSegmentos(modelo, config);
    const { etapas } = lerEtapas(modelo, config);
    const itens = config.colorirPorSegmento === false
      ? etapas.map((e) => ({ chave: e.chave, rotulo: e.rotulo }))
      : segmentos.map((s) => ({ chave: s.chave, rotulo: s.rotulo }));
    if (!itens.length) return {};
    return opcoesDeCorPorItem(itens, { secao: 'Cores', cores: coresDaPaleta(config.paleta) });
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const segmentos = lerSegmentos(modelo, config);
    if (!segmentos.length) {
      ctx.mostrarVazio(
        'Não encontrei os segmentos. O funil comparativo precisa de um pivô ou de ' +
          'uma segunda dimensão além da dimensão das etapas.'
      );
      return;
    }

    const usados = segmentos.slice(0, MAXIMO_DE_SEGMENTOS);
    if (segmentos.length > MAXIMO_DE_SEGMENTOS) {
      ctx.avisar(
        `A consulta tem ${segmentos.length} segmentos; mostrando os ${MAXIMO_DE_SEGMENTOS} primeiros para o gráfico continuar legível.`
      );
    }

    // Cada segmento tem o seu próprio funil, lido com o mesmo leitor.
    const funis = usados
      .map((segmento) => {
        const { etapas, medida, avisos } = lerEtapas(modelo, config, {
          filtrarLinha: segmento.filtrarLinha,
          campoDaEtapa: segmento.campoDaEtapa,
          chaveDoPivo: segmento.chaveDoPivo,
        });
        return { segmento, etapas: calcularConversoes(etapas), medida, avisos };
      })
      .filter((f) => f.etapas.length >= 2);

    if (!funis.length) {
      ctx.mostrarVazio('Nenhum segmento tem pelo menos duas etapas para formar um funil.');
      return;
    }

    const medida = funis[0].medida;

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_FUNIL, 'fn');
    const { areaGrafico, areaLegenda } = criarLayoutComLegenda(raiz, config);

    const larguraUtil = Math.max(80, areaGrafico.clientWidth || largura);
    const alturaUtil = Math.max(80, areaGrafico.clientHeight || altura);

    const area = criarEl('div', { classe: 'fn-area', pai: areaGrafico });
    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: larguraUtil, height: alturaUtil, viewBox: `0 0 ${larguraUtil} ${alturaUtil}` },
    });

    const formatar = formatadorDoFunil(medida, config);
    const paleta = coresDaPaleta(config.paleta);
    const coresPorEtapa = resolverCoresDasEtapas(funis[0].etapas, config, tema);

    // ---------- Escala comum ----------
    // Igualar a escala é o que permite comparar TAMANHO entre segmentos; o
    // truque é dar a todos os funis a mesma etapa de referência.
    const maiorGlobal = Math.max(...funis.flatMap((f) => f.etapas.map((e) => Math.abs(e.valor))));

    const espacoEntreFunis = 14;
    const larguraDeCada = (larguraUtil - espacoEntreFunis * (funis.length - 1)) / funis.length;
    const margemDoTopo = 26;
    const margemDaDireita = config.mostrarConversao === 'nenhuma' ? 4 : Math.min(54, larguraDeCada * 0.3);

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    funis.forEach((funil, indice) => {
      const corDoSegmento = config[`cor_${chaveDeCor(funil.segmento.chave)}`] || paleta[indice % paleta.length];

      const caixa = {
        x: indice * (larguraDeCada + espacoEntreFunis) + 4,
        y: margemDoTopo,
        largura: Math.max(16, larguraDeCada - margemDaDireita - 4),
        altura: Math.max(20, alturaUtil - margemDoTopo - 10),
      };

      desenharTituloDoFunil({ svg, caixa, texto: funil.segmento.rotulo, tema });

      const cores = new Map();
      for (const etapa of funil.etapas) {
        cores.set(
          etapa.chave,
          config.colorirPorSegmento === false ? coresPorEtapa.get(etapa.chave) || corDoSegmento : corDoSegmento
        );
      }

      desenharFunil({
        svg,
        caixa,
        etapas: funil.etapas,
        cores,
        config,
        tema,
        formatar,
        // Mesma referência para todos: é o que torna a largura comparável
        // entre segmentos de tamanhos diferentes.
        maximoDeReferencia: config.escalaPorFunil ? null : maiorGlobal,
        aoInteragir(elemento, etapa, cor) {
          if (!tooltip) return;
          ctx.eventos.on(elemento, 'pointerenter', (ev) => {
            const linhas = [
              { rotulo: medida ? medida.rotuloCurto : 'Valor', valor: formatar(etapa.valor), cor },
            ];
            if (etapa.conversaoDaPrimeira !== null) {
              linhas.push({ rotulo: 'Da primeira etapa', valor: formatarPercentual(etapa.conversaoDaPrimeira, 1) });
            }
            if (etapa.conversaoDaAnterior !== null) {
              linhas.push({ rotulo: 'Da etapa anterior', valor: formatarPercentual(etapa.conversaoDaAnterior, 1) });
            }
            tooltip.mostrar(
              { titulo: `${funil.segmento.rotulo} — ${etapa.rotulo}`, linhas },
              ev.clientX,
              ev.clientY
            );
          });
          ctx.eventos.on(elemento, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
          ctx.eventos.on(elemento, 'pointerleave', () => tooltip.esconder());
        },
      });
    });

    // ---------- Legenda ----------
    if (config.mostrarLegenda !== false) {
      const itens =
        config.colorirPorSegmento === false
          ? funis[0].etapas.map((e) => ({ chave: e.chave, rotulo: e.rotulo, cor: coresPorEtapa.get(e.chave) }))
          : funis.map((f, i) => ({
              chave: f.segmento.chave,
              rotulo: f.segmento.rotulo,
              cor: config[`cor_${chaveDeCor(f.segmento.chave)}`] || paleta[i % paleta.length],
            }));
      desenharLegenda({ hospedeiro: areaLegenda, tema, config, itens, eventos: ctx.eventos });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function chaveDeCor(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/**
 * Descobre os segmentos (um funil por segmento).
 *
 * Com pivô, cada valor do pivô é um segmento e TODAS as linhas entram —
 * o que separa os segmentos é a chave do pivô, não a linha. Sem pivô,
 * usamos a segunda dimensão e filtramos as linhas.
 */
function lerSegmentos(modelo, config) {
  const origem =
    config.origemDosSegmentos && config.origemDosSegmentos !== 'auto'
      ? config.origemDosSegmentos
      : modelo.temPivo
      ? 'pivo'
      : 'dimensao';

  if (origem === 'pivo' && modelo.temPivo) {
    // Com pivô o valor de cada etapa já vem por chave de pivô, mas o
    // `lerEtapas` lê a medida sem chave. Então tratamos o pivô como uma
    // dimensão virtual: cada segmento recebe um leitor próprio.
    return modelo.pivotsDeDados.map((pivo) => ({
      chave: pivo.chave,
      rotulo: pivo.rotulo,
      filtrarLinha: null,
      campoDaEtapa: modelo.dimensoes[0] || null,
      chaveDoPivo: pivo.chave,
    }));
  }

  const campoDoSegmento = modelo.dimensoes[1] || null;
  if (!campoDoSegmento) return [];

  const vistos = modelo.valoresDistintos(campoDoSegmento.nome, MAXIMO_DE_SEGMENTOS * 4);
  return vistos.map((v) => ({
    chave: v.chave,
    rotulo: v.texto,
    campoDaEtapa: modelo.dimensoes[0] || null,
    filtrarLinha: (linha) => {
      const bruto = modelo.valorBruto(linha, campoDoSegmento.nome);
      const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
      return chave === v.chave;
    },
  }));
}
