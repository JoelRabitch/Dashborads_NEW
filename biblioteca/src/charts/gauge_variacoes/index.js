/**
 * gauge_variacoes — "Medidores (Estilos)".
 *
 * Um medidor grande, em cinco estilos: arco de 270°, semicírculo, círculo
 * completo, barra linear e bullet chart. O desenho mora em `../_medidor/`,
 * compartilhado com `gauge_grid`.
 *
 * O valor é UM número. Quando a consulta traz várias linhas, somamos (ou
 * usamos a agregação escolhida) e dizemos de onde veio o número no tooltip
 * — um medidor que mostra silenciosamente só a primeira linha é um jeito
 * fácil de enganar quem lê.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import {
  montarOpcoes,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';
import {
  CSS_MEDIDOR,
  opcoesDeMedidor,
  lerFaixas,
  limitesDoMedidor,
  desenharMedidor,
  formatadorDoMedidor,
} from '../_medidor/index.js';

const AGREGACOES = [
  { rotulo: 'Soma', valor: 'soma' },
  { rotulo: 'Média', valor: 'media' },
  { rotulo: 'Máximo', valor: 'maximo' },
  { rotulo: 'Mínimo', valor: 'minimo' },
  { rotulo: 'Primeira linha', valor: 'primeira' },
  { rotulo: 'Última linha', valor: 'ultima' },
];

export function agregar(valores, tipo) {
  const limpos = valores.filter((v) => v !== null && Number.isFinite(v));
  if (!limpos.length) return null;
  switch (tipo) {
    case 'media':
      return limpos.reduce((a, b) => a + b, 0) / limpos.length;
    case 'maximo':
      return Math.max(...limpos);
    case 'minimo':
      return Math.min(...limpos);
    case 'primeira':
      return limpos[0];
    case 'ultima':
      return limpos[limpos.length - 1];
    case 'soma':
    default:
      return limpos.reduce((a, b) => a + b, 0);
  }
}

export default defineViz({
  id: 'gauge_variacoes',
  label: 'Medidores (Estilos)',
  opcoes: montarOpcoes(
    blocoDeCores({ comEscalaPorValor: false }),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado(),
    opcoesDeMedidor({ estiloPadrao: 'arco' }),
    {
      agregacaoDoValor: {
        type: 'string',
        label: 'Quando há várias linhas, o valor é',
        section: 'Dados',
        display: 'select',
        default: 'soma',
        values: listaDeValores(AGREGACOES),
      },
    }
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    if (!medidas.length) return {};
    const saida = opcaoDeEscolhaDeCampo('campoDoValor', 'Medida do valor', medidas, {
      secao: 'Dados',
      padrao: medidas[0].nome,
    });
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoAlvo', 'Medida do alvo', medidas, {
          secao: 'Alvo',
          incluirNenhum: true,
          padrao: '',
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const medida =
      modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    if (!medida) {
      ctx.mostrarVazio('O medidor precisa de pelo menos uma medida.');
      return;
    }

    const valores = modelo.linhas.map((linha) => modelo.valorNumerico(linha, medida.nome));
    const valor = agregar(valores, config.agregacaoDoValor || 'soma');

    if (valor === null) {
      ctx.mostrarVazio('A medida escolhida não tem nenhum valor numérico.');
      return;
    }
    if (modelo.linhas.length > 1) {
      const nome = (AGREGACOES.find((a) => a.valor === (config.agregacaoDoValor || 'soma')) || {}).rotulo;
      ctx.avisar(`A consulta tem ${modelo.linhas.length} linhas; o medidor mostra: ${nome}.`);
    }

    const alvo = lerAlvo(modelo, config, medida);
    const faixas = lerFaixas(config);
    const { minimo, maximo, aviso } = escalaDoMedidor({ valor, alvo, faixas, config });
    if (aviso) ctx.avisar(aviso);

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_MEDIDOR, 'md');
    const area = criarEl('div', { classe: 'md-area', pai: raiz });
    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const formatar = formatadorDoMedidor(medida, config);

    desenharMedidor({
      svg,
      caixa: { x: 14, y: 14, largura: Math.max(20, largura - 28), altura: Math.max(20, altura - 28) },
      valor,
      minimo,
      maximo,
      alvo,
      faixas,
      config,
      tema,
      formatar,
      rotulo: config.mostrarRotulos === false ? '' : medida.rotuloCurto,
    });

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;
    if (tooltip) {
      ctx.eventos.on(area, 'pointermove', (ev) => {
        const linhas = [
          { rotulo: medida.rotuloCurto, valor: formatar(valor) },
          { rotulo: 'Escala', valor: `${formatar(minimo)} a ${formatar(maximo)}` },
        ];
        if (alvo !== null) linhas.push({ rotulo: 'Alvo', valor: formatar(alvo) });
        tooltip.mostrar({ titulo: config.titulo || medida.rotulo, linhas }, ev.clientX, ev.clientY);
      });
      ctx.eventos.on(area, 'pointerleave', () => tooltip.esconder());
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/**
 * Decide a escala de um medidor de valor ÚNICO.
 *
 * Esse é o ponto em que um medidor engana com mais facilidade. Com um só
 * número não existe escala derivável dos dados: usar o próprio valor como
 * máximo mostra sempre 100%, e usar o maior valor por linha mostra sempre
 * o máximo quando a agregação é soma. Então a ordem de preferência é a de
 * uma referência que o usuário realmente definiu:
 *
 *   1. mínimo e máximo fixos, se escolhidos;
 *   2. o ALVO (com folga de 25%) — "quanto falta para a meta" é a pergunta
 *      que um medidor costuma responder;
 *   3. a maior FAIXA configurada;
 *   4. nada disso: avisamos que não há escala definida.
 */
export function escalaDoMedidor({ valor, alvo, faixas, config }) {
  if (config.origemDosLimites === 'fixo') {
    const limites = limitesDoMedidor([valor], config);
    return { ...limites, aviso: null };
  }

  if (alvo !== null && alvo !== undefined && Number.isFinite(alvo) && alvo > 0) {
    return { minimo: Math.min(0, valor), maximo: Math.max(alvo * 1.25, valor), aviso: null };
  }

  if (faixas.length) {
    const maiorFaixa = faixas[faixas.length - 1].ate;
    return { minimo: Math.min(0, valor, faixas[0].ate), maximo: Math.max(maiorFaixa, valor), aviso: null };
  }

  return {
    minimo: Math.min(0, valor),
    maximo: valor === 0 ? 1 : Math.abs(valor) * 1.25,
    aviso:
      'Este medidor não tem escala definida: configure o máximo (seção Medidor), um alvo ou faixas. ' +
      'Sem isso, a posição do ponteiro não quer dizer nada.',
  };
}

/** Alvo: valor fixo, segunda medida, ou nenhum. */
function lerAlvo(modelo, config, medidaDoValor) {
  if (config.alvoVindoDe === 'fixo') {
    const n = Number(String(config.valorDoAlvo).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  if (config.alvoVindoDe === 'medida') {
    // Comparamos com a medida JÁ RESOLVIDA, e não com `config.campoDoValor`:
    // na primeira renderização a opção ainda não existe, e o alvo acabaria
    // caindo na mesma medida do valor (dando sempre 100% do alvo).
    const campo =
      modelo.medidas.find((m) => m.nome === config.campoDoAlvo) ||
      modelo.medidas.find((m) => !medidaDoValor || m.nome !== medidaDoValor.nome) ||
      null;
    if (!campo || (medidaDoValor && campo.nome === medidaDoValor.nome)) return null;
    const valores = modelo.linhas.map((linha) => modelo.valorNumerico(linha, campo.nome));
    return agregar(valores, config.agregacaoDoValor || 'soma');
  }
  return null;
}
