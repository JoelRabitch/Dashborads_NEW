/**
 * diagrama_venn — "Diagrama de Venn" (2 a 5 conjuntos).
 *
 * Desenha em SVG porque o número de formas é pequeno (no máximo 5) e SVG dá
 * de graça o hover por região, o texto selecionável e a nitidez em qualquer
 * zoom. Quem faz o trabalho pesado é `geometria.js` (formas e onde cabe cada
 * rótulo) e `dados.js` (os três formatos de entrada possíveis).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarSvgEl, criarEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { coresDaPaleta, textoLegivelSobre } from '../../core/theme.js';
import { criarFormatadorNumerico, formatarPercentual } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import {
  montarOpcoes,
  listaDeValores,
  blocoDeCores,
  blocoDeLegenda,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  opcoesDeCorPorItem,
  sanitizarChave,
} from '../../core/options-kit.js';
import { layoutDeConjuntos, posicoesDasRegioes, caminhoDaElipse, posicaoDoRotuloDoConjunto } from './geometria.js';
import { lerConjuntos, rotuloDaRegiao } from './dados.js';

const CSS = `
.venn-area{position:relative;width:100%;height:100%;}
.venn-forma{transition:fill-opacity .15s ease, stroke-width .15s ease;}
.venn-regiao{cursor:default;}
.venn-rotulo-conjunto{font-weight:600;}
.venn-valor{pointer-events:none;}
.venn-apagado{opacity:.25;}
.venn-lista{position:absolute;right:6px;bottom:4px;font-size:10px;line-height:1.4;opacity:.8;
  max-width:46%;text-align:right;}
@media (prefers-reduced-motion: reduce){.venn-forma{transition:none;}}
`;

/**
 * Maior tamanho de fonte em que o número cabe na região (0 = não cabe).
 *
 * Um limite fixo de área erraria feio nos dois extremos (tile pequeno e
 * tile grande), então comparamos a folga medida em volta do ponto com o
 * tamanho do texto. A largura do texto é estimada em ~0,58 do tamanho da
 * fonte por caractere, boa média para fontes sem serifa.
 */
function tamanhoQueCabe(posicao, texto, tamanhoPreferido) {
  if (!posicao) return 0;
  // Antes de desistir da região, tentamos encolher a fonte: num Venn de 4
  // ou 5 conjuntos várias regiões são finas, e um número pequeno dentro é
  // melhor do que mandar o valor para a lista do canto.
  for (let tamanho = tamanhoPreferido; tamanho >= 7; tamanho -= 1) {
    const larguraDoTexto = texto.length * tamanho * 0.58;
    if (posicao.folgaX * 2 >= larguraDoTexto && posicao.folgaY * 2 >= tamanho) return tamanho;
  }
  return 0;
}

function opcoes() {
  return montarOpcoes(
    blocoDeCores({ secaoDeCores: 'Cores' }),
    blocoDeRotulos(),
    blocoDeLegenda(),
    blocoDeTooltip(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado(),
    {
      formatoDosDados: {
        type: 'string',
        label: 'Como os dados estão organizados',
        section: 'Dados',
        display: 'select',
        default: 'auto',
        values: listaDeValores([
          { rotulo: 'Detectar sozinho', valor: 'auto' },
          { rotulo: 'Uma linha por região ("A", "A,B")', valor: 'regioes' },
          { rotulo: 'Uma linha por item e conjunto', valor: 'itemConjunto' },
          { rotulo: 'Colunas sim/não (uma por conjunto)', valor: 'booleanas' },
        ]),
      },
      separadorDeConjuntos: {
        type: 'string',
        label: 'Separador dos conjuntos na dimensão',
        section: 'Dados',
        default: ',',
        placeholder: ',',
      },
      medirPor: {
        type: 'string',
        label: 'O número mostrado é',
        section: 'Dados',
        display: 'select',
        default: 'itens',
        values: listaDeValores([
          { rotulo: 'Contagem de itens', valor: 'itens' },
          { rotulo: 'Soma da medida', valor: 'medida' },
        ]),
      },
      maximoDeConjuntos: {
        type: 'number',
        label: 'Máximo de conjuntos (2 a 5)',
        section: 'Dados',
        display: 'range',
        min: 2,
        max: 5,
        step: 1,
        default: 5,
      },
      mostrarPercentual: {
        type: 'boolean',
        label: 'Mostrar o percentual junto do número',
        section: 'Rótulos',
        default: false,
      },
      mostrarTotalDoConjunto: {
        type: 'boolean',
        label: 'Mostrar o total de cada conjunto no nome',
        section: 'Rótulos',
        default: true,
      },
      listarRegioesPequenas: {
        type: 'boolean',
        label: 'Listar num canto as regiões pequenas demais para o número caber',
        section: 'Rótulos',
        default: true,
      },
      opacidadeDoPreenchimento: {
        type: 'number',
        label: 'Opacidade do preenchimento',
        section: 'Cores',
        display: 'range',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.4,
      },
      espessuraDoContorno: {
        type: 'number',
        label: 'Espessura do contorno',
        section: 'Cores',
        display: 'range',
        min: 0,
        max: 6,
        step: 0.5,
        default: 1.5,
      },
    }
  );
}

export default defineViz({
  id: 'diagrama_venn',
  label: 'Diagrama de Venn',
  opcoes: opcoes(),
  exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo, config }) {
    const { conjuntos } = lerConjuntos(modelo, config);
    if (!conjuntos.length) return {};
    return opcoesDeCorPorItem(
      conjuntos.map((c) => ({ chave: c.nome, rotulo: c.nome })),
      { secao: 'Cores', cores: coresDaPaleta(config.paleta) }
    );
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const { conjuntos, regioes, totalPorConjunto, avisos, unidade, formato } = lerConjuntos(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (conjuntos.length < 2) {
      ctx.mostrarVazio(
        'O diagrama de Venn precisa de pelo menos 2 conjuntos. ' +
          'Confira a opção "Como os dados estão organizados" na seção Dados.'
      );
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'venn');

    const { areaGrafico, areaLegenda } = criarLayoutComLegenda(raiz, config);
    // No jsdom (e antes do layout) as medidas vêm zeradas: caímos no
    // tamanho do tile, que o define-viz já mediu.
    const larguraUtil = Math.max(80, areaGrafico.clientWidth || largura);
    const alturaUtil = Math.max(80, areaGrafico.clientHeight || altura);

    const cores = resolverCores(conjuntos, config, tema);
    const elipses = layoutDeConjuntos(conjuntos.length, {
      largura: larguraUtil,
      altura: alturaUtil,
      margem: 26,
    });
    const posicoes = posicoesDasRegioes(elipses, { largura: larguraUtil, altura: alturaUtil, passos: 150 });

    const svg = criarSvgEl('svg', {
      pai: areaGrafico,
      classe: 'venn-svg',
      atributos: { width: larguraUtil, height: alturaUtil, viewBox: `0 0 ${larguraUtil} ${alturaUtil}` },
    });

    const formatar = criarFormatadorNumerico({
      estilo: config.formatoDosNumeros || 'auto',
      casas: Number(config.casasDecimais) || 0,
    });
    const totalGeral = Array.from(regioes.values()).reduce((a, b) => a + b, 0);

    // --- Formas ---
    const opacidade = Number(config.opacidadeDoPreenchimento);
    const espessura = Number(config.espessuraDoContorno);
    const formas = elipses.map((elipse, i) =>
      criarSvgEl('path', {
        pai: svg,
        classe: 'venn-forma',
        atributos: {
          d: caminhoDaElipse(elipse),
          transform: elipse.rotacao ? `rotate(${elipse.rotacao} ${elipse.cx} ${elipse.cy})` : null,
          fill: cores[i],
          'fill-opacity': Number.isFinite(opacidade) ? opacidade : 0.4,
          stroke: cores[i],
          'stroke-width': Number.isFinite(espessura) ? espessura : 1.5,
        },
      })
    );

    // --- Números das regiões ---
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    const pequenas = [];
    const tamanhoDoNumero = Math.max(9, Math.min(15, tema.tamanhoBase));

    for (const [mascara, valor] of ordenarRegioes(regioes)) {
      const posicao = posicoes.get(mascara);
      const rotulo = rotuloDaRegiao(mascara, conjuntos);
      const texto = montarTextoDoValor(valor, totalGeral, formatar, config);

      const tamanho = tamanhoQueCabe(posicao, texto, tamanhoDoNumero);
      if (!tamanho) {
        pequenas.push({ rotulo, texto });
        continue;
      }

      const alvo = criarSvgEl('circle', {
        pai: svg,
        classe: 'venn-regiao',
        atributos: { cx: posicao.x, cy: posicao.y, r: 11, fill: 'transparent' },
      });

      const numero = criarSvgEl('text', {
        pai: svg,
        classe: 'venn-valor',
        atributos: {
          x: posicao.x,
          y: posicao.y,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': tamanho,
          fill: corDoTextoDaRegiao(mascara, cores, config, tema),
        },
      });
      definirTexto(numero, texto);

      if (tooltip) {
        ctx.eventos.on(alvo, 'pointerenter', (ev) => {
          destacar(formas, mascara, true);
          tooltip.mostrar(
            { titulo: rotulo, linhas: [{ rotulo: unidade || 'Valor', valor: texto }] },
            ev.clientX,
            ev.clientY
          );
        });
        ctx.eventos.on(alvo, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(alvo, 'pointerleave', () => {
          destacar(formas, mascara, false);
          tooltip.esconder();
        });
      }
    }

    // --- Nomes dos conjuntos ---
    const centro = { x: larguraUtil / 2, y: alturaUtil / 2 };
    if (config.mostrarRotulos !== false) {
      conjuntos.forEach((conjunto, i) => {
        const posicao = posicaoDoRotuloDoConjunto(elipses[i], centro, 6);
        const total = totalPorConjunto.get(i) || 0;
        const texto =
          config.mostrarTotalDoConjunto !== false ? `${conjunto.nome} (${formatar(total)})` : conjunto.nome;

        const el = criarSvgEl('text', {
          pai: svg,
          classe: 'venn-rotulo-conjunto',
          atributos: {
            x: Math.max(4, Math.min(larguraUtil - 4, posicao.x)),
            y: Math.max(10, Math.min(alturaUtil - 4, posicao.y)),
            'text-anchor': posicao.x < centro.x ? 'start' : 'end',
            'dominant-baseline': 'central',
            'font-size': Math.max(10, tema.tamanhoBase),
            fill: cores[i],
          },
        });
        definirTexto(el, texto);
      });
    }

    // --- Regiões que não couberam ---
    if (pequenas.length && config.listarRegioesPequenas !== false) {
      const lista = criarEl('div', { classe: 'venn-lista', pai: areaGrafico });
      lista.style.color = tema.textoSuave;
      for (const { rotulo, texto } of pequenas) {
        criarEl('div', { pai: lista, texto: `${rotulo}: ${texto}` });
      }
    }

    // --- Legenda ---
    if (config.mostrarLegenda !== false) {
      desenharLegenda({
        hospedeiro: areaLegenda,
        tema,
        config,
        itens: conjuntos.map((c, i) => ({
          chave: c.nome,
          rotulo:
            config.mostrarTotalDoConjunto !== false
              ? `${c.nome} (${formatar(totalPorConjunto.get(i) || 0)})`
              : c.nome,
          cor: cores[i],
        })),
        eventos: ctx.eventos,
      });
    }

    if (config.modoDebug) {
      ctx.avisar(`formato detectado: ${formato}; ${regioes.size} região(ões).`);
    }

    ctx.estado.tooltip = tooltip;
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/** Realça as formas de uma região ao passar o mouse. */
function destacar(formas, mascara, ligado) {
  formas.forEach((forma, i) => {
    const pertence = (mascara & (1 << i)) !== 0;
    forma.classList.toggle('venn-apagado', ligado && !pertence);
    forma.setAttribute('stroke-width', ligado && pertence ? 3 : forma.dataset.espessura || 1.5);
  });
}

function montarTextoDoValor(valor, totalGeral, formatar, config) {
  const base = formatar(valor);
  if (!config.mostrarPercentual || !totalGeral) return base;
  return `${base} (${formatarPercentual(valor / totalGeral, 0)})`;
}

/** Texto escuro ou claro conforme o fundo da região. */
function corDoTextoDaRegiao(mascara, cores, config, tema) {
  const indices = [];
  for (let i = 0; i < cores.length; i++) if (mascara & (1 << i)) indices.push(i);
  if (indices.length !== 1) return tema.texto;
  const opacidade = Number(config.opacidadeDoPreenchimento);
  // Com preenchimento fraco, o fundo manda; com forte, a cor da região.
  if (!Number.isFinite(opacidade) || opacidade < 0.55) return tema.texto;
  return textoLegivelSobre(cores[indices[0]], tema);
}

/** Regiões menores por último, para o texto das maiores ficar por baixo. */
function ordenarRegioes(regioes) {
  return Array.from(regioes.entries()).sort((a, b) => b[1] - a[1]);
}

function resolverCores(conjuntos, config, tema) {
  const paleta = coresDaPaleta(config.paleta);
  return conjuntos.map((conjunto, i) => {
    const escolhida = config[`cor_${sanitizarChave(conjunto.nome)}`];
    return escolhida || paleta[i % paleta.length] || tema.texto;
  });
}
