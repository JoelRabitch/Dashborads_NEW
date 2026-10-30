/**
 * violin — "Violin Plot".
 *
 * A densidade de uma distribuição espelhada nos dois lados de um eixo, uma
 * por categoria, com mediana e intervalo interquartil marcados dentro.
 * Serve para ver a FORMA da distribuição — bimodal, assimétrica, achatada
 * — que um boxplot esconde e uma média mente.
 *
 * Três cuidados que separam um violino honesto de um enfeite:
 *
 *   1. **a largura é comparável entre categorias** por padrão. Normalizar
 *      cada violino pelo próprio pico faria um grupo de 3 observações
 *      parecer tão robusto quanto um de 3.000;
 *   2. **grupos pequenos são marcados.** Uma densidade estimada a partir
 *      de poucos pontos é quase ficção, e o gráfico diz quantos são;
 *   3. **a curva é cortada no mínimo e no máximo reais.** O kernel
 *      gaussiano tem cauda infinita; deixá-la livre desenharia densidade
 *      onde não existe dado.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica, escalaDeBanda } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { geradorDeLinha } from '../../core/shapes.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import {
  agruparValores,
  resumoDeDistribuicao,
  densidadePorKernel,
  limitesDeOutlier,
} from '../../core/estatistica.js';
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
  sanitizarChave,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';

const CSS = `
.vl-area{position:relative;width:100%;height:100%;}
.vl-corpo{cursor:pointer;transition:opacity .15s ease;}
.vl-apagado{opacity:.3;}
.vl-marca{pointer-events:none;}
.vl-texto{pointer-events:none;}
.vl-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
@media (prefers-reduced-motion: reduce){.vl-corpo{transition:none;}}
`;

/** Abaixo disto a densidade estimada não significa grande coisa. */
const MINIMO_CONFIAVEL = 10;

export default defineViz({
  id: 'violin',
  label: 'Violin Plot',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        larguraComparavel: {
          type: 'boolean',
          label: 'Larguras comparáveis entre categorias',
          section: 'Violino',
          default: true,
        },
        larguraMaxima: {
          type: 'number',
          label: 'Largura máxima do violino (% do espaço)',
          section: 'Violino',
          display: 'range',
          min: 20,
          max: 100,
          step: 5,
          default: 85,
        },
        suavizacao: {
          type: 'number',
          label: 'Suavização (0 = automática por Silverman)',
          section: 'Violino',
          display: 'range',
          min: 0,
          max: 5,
          step: 0.1,
          default: 0,
        },
        pontosDaCurva: {
          type: 'number',
          label: 'Resolução da curva',
          section: 'Violino',
          display: 'range',
          min: 16,
          max: 200,
          step: 8,
          default: 64,
        },
        mostrarCaixa: {
          type: 'boolean',
          label: 'Caixa do intervalo interquartil dentro do violino',
          section: 'Violino',
          default: true,
        },
        mostrarMediana: {
          type: 'boolean',
          label: 'Marcar a mediana',
          section: 'Violino',
          default: true,
        },
        mostrarOutliers: {
          type: 'boolean',
          label: 'Marcar os pontos fora de 1,5 × IQR',
          section: 'Violino',
          default: true,
        },
        avisarGruposPequenos: {
          type: 'boolean',
          label: 'Marcar categorias com poucas observações',
          section: 'Violino',
          default: true,
        },
        maximoDeCategorias: {
          type: 'number',
          label: 'Máximo de categorias (as de maior n primeiro)',
          section: 'Violino',
          display: 'range',
          min: 2,
          max: 60,
          step: 1,
          default: 30,
        },
        mostrarContagem: {
          type: 'boolean',
          label: 'Escrever o n de cada categoria',
          section: 'Rótulos',
          default: true,
        },
      }
    ),
    { rotacaoRotuloEixoX: 25, gradeEixoY: true }
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    const saida = {};
    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaCategoria', 'Dimensão das categorias', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDosValores', 'Medida da distribuição', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const medida =
      modelo.medidas.find((m) => m.nome === config.campoDosValores) || modelo.medidas[0];
    if (!medida) {
      ctx.mostrarVazio('O violino precisa de uma medida com os valores da distribuição.');
      return;
    }

    const campoDaCategoria =
      modelo.dimensoes.find((d) => d.nome === config.campoDaCategoria) || modelo.dimensoes[0] || null;
    let grupos = agruparValores({ modelo, campoDaCategoria, medida });

    if (!grupos.length) {
      ctx.mostrarVazio('Nenhuma categoria tem valores numéricos.');
      return;
    }

    // Centenas de violinos não são um gráfico: cada um fica com poucos
    // pixels de largura e nenhum mostra forma nenhuma. Ficamos com as
    // categorias de MAIOR n, que são as que têm distribuição para mostrar.
    const limite = Number(config.maximoDeCategorias) || 30;
    if (grupos.length > limite) {
      const ordenados = grupos.slice().sort((a, b) => b.valores.length - a.valores.length);
      ctx.avisar(
        `A consulta tem ${grupos.length} categorias; mostrando as ${limite} com mais observações. ` +
          'Um violino por categoria só informa quando há espaço para a forma aparecer.'
      );
      grupos = ordenados.slice(0, limite);
    }

    // Uma consulta do Looker já agregada traz UM valor por categoria — e
    // uma distribuição de um ponto só não existe. Dizer isso evita o
    // usuário concluir que o gráfico está quebrado.
    const comUmValor = grupos.filter((g) => g.valores.length === 1).length;
    if (comUmValor === grupos.length) {
      ctx.mostrarVazio(
        'Cada categoria tem um único valor: não há distribuição para desenhar. ' +
          'Traga as linhas sem agregar (ou agrupe por uma dimensão mais fina) no Explore.'
      );
      return;
    }

    const violinos = montarViolinos(grupos, config);
    const pequenos = violinos.filter((v) => v.resumo.n < MINIMO_CONFIAVEL);

    if (config.avisarGruposPequenos !== false && pequenos.length) {
      ctx.avisar(
        `${pequenos.length} categoria(s) têm menos de ${MINIMO_CONFIAVEL} observações. ` +
          'A densidade estimada a partir de poucos pontos diz mais sobre o método do que sobre os dados.'
      );
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'vl');
    const area = criarEl('div', { classe: 'vl-area', pai: raiz });

    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 1,
    });

    // ---------- Escalas ----------
    const todosOsValores = violinos.flatMap((v) => [v.resumo.minimo, v.resumo.maximo]);
    const margens = calcularMargens({
      rotulosY: todosOsValores.map(formatar),
      rotulosX: violinos.map((v) => v.rotulo),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaX = escalaDeBanda({
      dominio: violinos.map((v) => v.chave),
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config: { larguraDaBarra: 90, espacamentoEntreGrupos: 10 },
    });
    const escalaY = escalaNumerica({
      valores: todosOsValores,
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config,
      eixo: 'Y',
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    desenharEixos({
      svg,
      escalaX,
      escalaY,
      area: retangulo,
      config,
      tema,
      rotulosDeBanda: violinos.map((v) => v.chave),
      formatarX: (chave) => {
        const v = violinos.find((item) => item.chave === chave);
        if (!v) return String(chave);
        const nome = truncar(v.rotulo, 18);
        return config.mostrarContagem !== false ? `${nome} (n=${v.resumo.n})` : nome;
      },
      formatarY: formatar,
    });

    // ---------- Violinos ----------
    const paleta = coresDaPaleta(config.paleta);
    const meiaLargura =
      (escalaX.bandwidth() / 2) * ((Number(config.larguraMaxima) || 85) / 100);
    const picoDeReferencia = config.larguraComparavel !== false
      ? Math.max(...violinos.map((v) => v.maximo))
      : null;

    const corpos = [];

    violinos.forEach((violino, indice) => {
      const centro = escalaX(violino.chave) + escalaX.bandwidth() / 2;
      const cor = config[`cor_${sanitizarChave(violino.chave)}`] || paleta[indice % paleta.length];
      violino.cor = cor;

      const pico = picoDeReferencia || violino.maximo;
      const escalaDaLargura = (densidade) => (pico > 0 ? (densidade / pico) * meiaLargura : 0);

      // O contorno sobe por um lado e desce pelo outro, formando o corpo.
      const ladoDireito = violino.curva.map((p) => [centro + escalaDaLargura(p.densidade), escalaY(p.x)]);
      const ladoEsquerdo = violino.curva
        .slice()
        .reverse()
        .map((p) => [centro - escalaDaLargura(p.densidade), escalaY(p.x)]);

      const d =
        ladoDireito.concat(ladoEsquerdo).map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('') +
        'Z';

      const corpo = criarSvgEl('path', {
        pai: svg,
        classe: 'vl-corpo',
        atributos: {
          d,
          fill: comOpacidade(cor, 0.45),
          stroke: cor,
          'stroke-width': 1,
        },
      });
      corpos.push(corpo);

      // ---------- Caixa e mediana ----------
      if (config.mostrarCaixa !== false) {
        const yQ3 = escalaY(violino.resumo.q3);
        const yQ1 = escalaY(violino.resumo.q1);
        criarSvgEl('rect', {
          pai: svg,
          classe: 'vl-marca',
          atributos: {
            x: centro - Math.max(2, meiaLargura * 0.12),
            y: Math.min(yQ1, yQ3),
            width: Math.max(4, meiaLargura * 0.24),
            height: Math.max(1, Math.abs(yQ1 - yQ3)),
            fill: tema.texto,
            opacity: 0.55,
          },
        });

        // Bigodes até o último valor real dentro de 1,5 × IQR.
        criarSvgEl('line', {
          pai: svg,
          classe: 'vl-marca',
          atributos: {
            x1: centro, x2: centro,
            y1: escalaY(violino.limites.bigodeInferior),
            y2: escalaY(violino.limites.bigodeSuperior),
            stroke: tema.texto, 'stroke-width': 1, opacity: 0.55,
          },
        });
      }

      if (config.mostrarMediana !== false) {
        criarSvgEl('circle', {
          pai: svg,
          classe: 'vl-marca',
          atributos: {
            cx: centro,
            cy: escalaY(violino.resumo.mediana),
            r: 2.8,
            fill: tema.fundo,
            stroke: tema.texto,
            'stroke-width': 1.5,
          },
        });
      }

      if (config.mostrarOutliers !== false) {
        for (const valor of violino.limites.outliers) {
          criarSvgEl('circle', {
            pai: svg,
            classe: 'vl-marca',
            atributos: { cx: centro, cy: escalaY(valor), r: 1.8, fill: cor, opacity: 0.8 },
          });
        }
      }

      // Marca de grupo pequeno: um asterisco discreto acima do violino.
      if (config.avisarGruposPequenos !== false && violino.resumo.n < MINIMO_CONFIAVEL) {
        const marca = criarSvgEl('text', {
          pai: svg,
          classe: 'vl-texto',
          atributos: {
            x: centro,
            y: escalaY(violino.resumo.maximo) - 6,
            'text-anchor': 'middle',
            'font-size': Math.max(10, tema.tamanhoBase),
            fill: tema.atencao,
          },
        });
        definirTexto(marca, '*');
      }
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'vl-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      `Densidade por kernel gaussiano, banda ${
        Number(config.suavizacao) > 0 ? 'manual' : 'automática (Silverman)'
      }; quartis pelo método tipo 7.` +
        (pequenos.length ? ` * = menos de ${MINIMO_CONFIAVEL} observações.` : '')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    violinos.forEach((violino, indice) => {
      const corpo = corpos[indice];
      if (tooltip) {
        ctx.eventos.on(corpo, 'pointerenter', (ev) => {
          corpos.forEach((outro, i) => outro.classList.toggle('vl-apagado', i !== indice));
          const r = violino.resumo;
          const linhas = [
            { rotulo: 'Observações', valor: String(r.n), cor: violino.cor },
            { rotulo: 'Mediana', valor: formatar(r.mediana) },
            { rotulo: 'Média', valor: formatar(r.media) },
            { rotulo: 'Q1 – Q3', valor: `${formatar(r.q1)} – ${formatar(r.q3)}` },
            { rotulo: 'Mínimo – Máximo', valor: `${formatar(r.minimo)} – ${formatar(r.maximo)}` },
            { rotulo: 'Desvio padrão', valor: formatar(r.desvio) },
          ];
          if (violino.limites.outliers.length) {
            linhas.push({ rotulo: 'Fora de 1,5 × IQR', valor: String(violino.limites.outliers.length) });
          }
          if (r.n < MINIMO_CONFIAVEL) {
            linhas.push({ rotulo: 'Atenção', valor: 'poucas observações para estimar densidade' });
          }
          tooltip.mostrar({ titulo: violino.rotulo, linhas }, ev.clientX, ev.clientY);
        });
        ctx.eventos.on(corpo, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(corpo, 'pointerleave', () => {
          corpos.forEach((outro) => outro.classList.remove('vl-apagado'));
          tooltip.esconder();
        });
      }

      ctx.eventos.on(corpo, 'click', (ev) => {
        if (!campoDaCategoria || violino.indiceDaLinha < 0) return;
        const celula = modelo.celula(modelo.linhas[violino.indiceDaLinha], campoDaCategoria.nome);
        if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
      });
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

/**
 * Resumo, densidade e limites de cada categoria.
 *
 * A curva é avaliada APENAS entre o mínimo e o máximo reais do grupo: o
 * kernel gaussiano tem cauda infinita, e deixá-la correr desenharia
 * densidade em valores que nunca foram observados.
 */
export function montarViolinos(grupos, config = {}) {
  const pontos = Number(config.pontosDaCurva) || 64;
  const suavizacao = Number(config.suavizacao) || 0;

  return grupos
    .map((grupo) => {
      const resumo = resumoDeDistribuicao(grupo.valores);
      if (!resumo) return null;

      const { curva, maximo, largura } = densidadePorKernel({
        valores: grupo.valores,
        largura: suavizacao > 0 ? suavizacao : undefined,
        pontos,
        intervalo: [resumo.minimo, resumo.maximo],
      });

      return {
        ...grupo,
        resumo,
        curva,
        maximo,
        larguraDaBanda: largura,
        limites: limitesDeOutlier(resumo),
      };
    })
    .filter(Boolean);
}
