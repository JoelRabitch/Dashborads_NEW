/**
 * radial_bar — "Barras Radiais".
 *
 * Barras enroladas num círculo: cada categoria ocupa um anel de raio fixo
 * e varre um ângulo proporcional ao valor.
 *
 * **A honestidade aqui é o avesso da do `nightingale`.** Lá o problema era
 * a área; aqui é o COMPRIMENTO. Como o comprimento de um arco é `raio ×
 * ângulo`, duas barras de mesmo valor em anéis diferentes têm
 * comprimentos diferentes — a de fora parece maior, sempre. É um defeito
 * estrutural do gráfico e não tem conserto.
 *
 * O que dá para fazer é escolher a medida certa e dizer o resto:
 *
 * - o que codifica o valor é o **ângulo varrido**, não o comprimento, e
 *   todas as barras começam no MESMO ângulo — assim a comparação angular é
 *   legítima;
 * - a nota diz, em toda renderização, que comprimentos em anéis
 *   diferentes não se comparam.
 *
 * O ângulo máximo é a outra decisão: 360° fecha o círculo e faz o maior
 * valor encostar no próprio início, o que confunde fim com começo. O
 * padrão é 300°.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { geradorDeArco } from '../../core/shapes.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { lerFatias, anguloDoValor } from '../_polar/index.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

// A família polar mora em `_polar/`; estes nomes continuam saindo daqui
// porque são a superfície pública testada do gráfico.
export { anguloDoValor, comprimentoDoArco, lerFatias } from '../_polar/index.js';

const CSS = `
.rb-area{position:relative;width:100%;height:100%;overflow:hidden;}
.rb-svg{position:absolute;left:0;top:0;}
.rb-barra{cursor:default;}
.rb-trilho{pointer-events:none;}
.rb-rotulo{pointer-events:none;}
.rb-valor{pointer-events:none;}
.rb-guia{pointer-events:none;fill:none;}
.rb-escala{pointer-events:none;}
.rb-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso os anéis ficam mais finos que o rótulo. */
const MAXIMO_DE_CATEGORIAS = 25;

export default defineViz({
  id: 'radial_bar',
  label: 'Barras Radiais',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        anguloMaximo: {
          type: 'number',
          label: 'Ângulo da maior barra (graus)',
          section: 'Radial',
          display: 'range',
          min: 90,
          max: 360,
          step: 15,
          default: 300,
        },
        ordem: {
          type: 'string',
          label: 'Ordem dos anéis',
          section: 'Radial',
          display: 'select',
          default: 'valorDesc',
          values: listaDeValores([
            { rotulo: 'Pelo valor (maior no anel de fora)', valor: 'valorDesc' },
            { rotulo: 'Pelo valor (maior no anel de dentro)', valor: 'valorAsc' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
          ]),
        },
        raioInterno: {
          type: 'number',
          label: 'Raio do miolo vazio (% do externo)',
          section: 'Radial',
          display: 'range',
          min: 10,
          max: 70,
          step: 5,
          default: 30,
        },
        espessuraRelativa: {
          type: 'number',
          label: 'Espessura da barra dentro do anel (%)',
          section: 'Radial',
          display: 'range',
          min: 30,
          max: 100,
          step: 5,
          default: 75,
        },
        mostrarTrilho: {
          type: 'boolean',
          label: 'Trilho de fundo até o ângulo máximo',
          section: 'Radial',
          default: true,
        },
        guiasAngulares: {
          type: 'number',
          label: 'Guias angulares',
          section: 'Radial',
          display: 'range',
          min: 0,
          max: 6,
          step: 1,
          default: 3,
        },
        escreverValores: {
          type: 'boolean',
          label: 'Escrever o valor no fim da barra',
          section: 'Rótulos',
          default: true,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaCategoria', 'Dimensão dos anéis', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoValor', 'Medida do ângulo', medidas, {
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
      modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    const campoDaCategoria =
      modelo.dimensoes.find((d) => d.nome === config.campoDaCategoria) || modelo.dimensoes[0] || null;

    if (!medida || !campoDaCategoria) {
      ctx.mostrarVazio('Barras radiais precisam de uma dimensão (os anéis) e uma medida (o ângulo).');
      return;
    }

    let barras = lerFatias({
      modelo,
      medida,
      campoDaCategoria,
      config: { ...config, ordem: config.ordem || 'valorDesc' },
    });
    if (!barras.length) {
      ctx.mostrarVazio('Nenhuma categoria tem valor na medida escolhida.');
      return;
    }
    if (barras.length > MAXIMO_DE_CATEGORIAS) {
      ctx.avisar(
        `A consulta tem ${barras.length} categorias. Mostrando as ${MAXIMO_DE_CATEGORIAS} primeiras: ` +
          'acima disso os anéis ficam mais finos que o próprio rótulo.'
      );
      barras = barras.slice(0, MAXIMO_DE_CATEGORIAS);
    }

    const negativos = barras.filter((b) => b.valorBruto < 0).length;
    if (negativos > 0) {
      ctx.avisar(
        `${negativos} categoria(s) têm valor negativo e foram desenhadas como ângulo zero: ` +
          'num gráfico radial não existe ângulo negativo sem inverter o sentido de leitura.'
      );
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'rb');
    const area = criarEl('div', { classe: 'rb-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const cx = largura / 2;
    const cy = (altura - 16) / 2;
    const raioExterno = Math.max(20, Math.min(largura / 2, (altura - 16) / 2) - 8);
    const raioInterno =
      (Math.max(10, Math.min(70, Number(config.raioInterno) || 30)) / 100) * raioExterno;

    const anguloMaximo = ((Math.max(90, Math.min(360, Number(config.anguloMaximo) || 300))) * Math.PI) / 180;
    const maior = Math.max(...barras.map((b) => b.valor), 1e-12);

    const faixa = (raioExterno - raioInterno) / barras.length;
    const espessura = faixa * (Math.max(30, Math.min(100, Number(config.espessuraRelativa) || 75)) / 100);

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'rb-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });
    const grupo = criarSvgEl('g', { pai: svg, atributos: { transform: `translate(${cx},${cy})` } });

    // ---------- Guias angulares ----------
    const guias = Math.max(0, Math.min(6, Number(config.guiasAngulares) || 0));
    for (let k = 1; k <= guias; k++) {
      const valor = (maior * k) / guias;
      const angulo = anguloDoValor({ valor, maior, anguloMaximo });
      const x = Math.sin(angulo) * raioExterno;
      const y = -Math.cos(angulo) * raioExterno;
      criarSvgEl('line', {
        pai: grupo,
        classe: 'rb-guia',
        atributos: {
          x1: Math.sin(angulo) * raioInterno,
          y1: -Math.cos(angulo) * raioInterno,
          x2: x,
          y2: y,
          stroke: comOpacidade(tema.borda, 0.9),
          'stroke-width': 1,
        },
      });
      const texto = criarSvgEl('text', {
        pai: grupo,
        classe: 'rb-escala',
        atributos: {
          x: x * 1.03,
          y: y * 1.03,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': Math.max(8, fonte - 2),
          fill: tema.textoSuave,
        },
      });
      definirTexto(texto, formatar(valor));
    }

    // ---------- Barras ----------
    const paleta = coresDaPaleta(config.paleta);
    const desenhadas = [];

    barras.forEach((barra, i) => {
      // O anel de FORA é o primeiro da lista: com a ordem decrescente, o
      // maior valor fica onde há mais espaço para o rótulo.
      const raioDoAnel = raioExterno - (i + 0.5) * faixa;
      const r0 = raioDoAnel - espessura / 2;
      const r1 = raioDoAnel + espessura / 2;
      barra.cor = paleta[i % paleta.length];
      barra.angulo = anguloDoValor({ valor: barra.valor, maior, anguloMaximo });
      barra.raio = raioDoAnel;

      if (config.mostrarTrilho !== false) {
        const trilho = geradorDeArco({ raioInterno: r0, raioExterno: r1 });
        criarSvgEl('path', {
          pai: grupo,
          classe: 'rb-trilho',
          atributos: {
            d: trilho({ startAngle: 0, endAngle: anguloMaximo }) || '',
            fill: comOpacidade(tema.borda, 0.45),
          },
        });
      }

      const arco = geradorDeArco({ raioInterno: r0, raioExterno: r1, raioDoCanto: espessura / 2 });
      const caminho = criarSvgEl('path', {
        pai: grupo,
        classe: 'rb-barra',
        atributos: {
          // Todas começam em ZERO: é o que torna a comparação angular
          // legítima, pelo mesmo motivo das barras lineares.
          d: arco({ startAngle: 0, endAngle: Math.max(0.0001, barra.angulo) }) || '',
          fill: barra.cor,
          'data-chave': barra.chave,
          'data-angulo': String(barra.angulo),
          'data-raio': String(raioDoAnel),
        },
      });
      desenhadas.push({ elemento: caminho, barra });

      // --- Nome no miolo, alinhado ao anel ---
      const nome = criarSvgEl('text', {
        pai: grupo,
        classe: 'rb-rotulo',
        atributos: {
          x: -4,
          y: -raioDoAnel,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          'font-size': Math.min(fonte, Math.max(7, espessura)),
          fill: tema.texto,
        },
      });
      definirTexto(nome, truncar(barra.rotulo, 16));

      if (config.escreverValores !== false && espessura >= 9) {
        const x = Math.sin(barra.angulo) * raioDoAnel;
        const y = -Math.cos(barra.angulo) * raioDoAnel;
        const valor = criarSvgEl('text', {
          pai: grupo,
          classe: 'rb-valor',
          atributos: {
            x: x + Math.sin(barra.angulo) * 8,
            y: y - Math.cos(barra.angulo) * 8,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'font-size': Math.max(8, fonte - 1),
            fill: tema.textoSuave,
          },
        });
        definirTexto(valor, formatar(barra.valorBruto));
      }
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'rb-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${barras.length} anéis · todas as barras começam no mesmo ângulo`,
        'o valor é o ÂNGULO varrido, não o comprimento do arco',
        'ATENÇÃO: o comprimento depende do raio — duas barras de mesmo valor em anéis diferentes têm tamanhos diferentes',
        `a maior barra varre ${Math.round((anguloMaximo * 180) / Math.PI)}°`,
        guias > 0 ? `${guias} guias angulares` : 'sem guias: o ângulo não tem referência',
      ].join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const total = barras.reduce((a, b) => a + b.valor, 0);

    for (const { elemento, barra } of desenhadas) {
      ctx.eventos.on(elemento, 'pointerenter', (ev) => {
        elemento.setAttribute('stroke', tema.texto);
        elemento.setAttribute('stroke-width', '1');
        if (!tooltip) return;
        tooltip.mostrar(
          {
            titulo: barra.rotulo,
            linhas: [
              { rotulo: medida.rotuloCurto, valor: formatar(barra.valorBruto), cor: barra.cor },
              { rotulo: 'Do maior', valor: formatarPercentual(barra.valor / maior, 1) },
              { rotulo: 'Do total', valor: formatarPercentual(barra.valor / (total || 1), 1) },
              { rotulo: 'Ângulo varrido', valor: `${Math.round((barra.angulo * 180) / Math.PI)}°` },
            ],
          },
          ev.clientX,
          ev.clientY
        );
      });
      ctx.eventos.on(elemento, 'pointerleave', () => {
        elemento.removeAttribute('stroke');
        elemento.removeAttribute('stroke-width');
        if (tooltip) tooltip.esconder();
      });
      ctx.eventos.on(elemento, 'click', (ev) => {
        const celula = modelo.celula(modelo.linhas[barra.indiceDaLinha], campoDaCategoria.nome);
        if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */
