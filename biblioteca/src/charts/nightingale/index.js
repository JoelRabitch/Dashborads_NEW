/**
 * nightingale — "Rosa de Nightingale".
 *
 * O gráfico polar de áreas: fatias de ângulo IGUAL e raio variável.
 *
 * **E ele abre com a armadilha que é a razão de existir aqui.** Na versão
 * ingênua — a do diagrama original de Florence Nightingale — o raio é
 * proporcional ao valor. Como a área de um setor cresce com o QUADRADO do
 * raio, um valor 2× maior ocupa 4× mais tinta, e um valor 3× maior ocupa
 * 9×. O gráfico é citado em toda parte como exemplo de boa visualização, o
 * que torna o erro duplamente perigoso: ele vem com credencial.
 *
 * Aqui o padrão é **área proporcional** (raio por √valor). O modo de raio
 * direto existe — alguém pode querer reproduzir o original — mas o modo em
 * uso vai declarado na tela, com a consequência escrita.
 *
 * Com raio interno (rosca), a conta muda e continua certa:
 * `r = √(r₀² + (R² − r₀²)·f)` mantém a ÁREA do anel proporcional ao valor.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { geradorDeArco } from '../../core/shapes.js';
import { coresDaPaleta, comOpacidade, textoLegivelSobre } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, formatarData, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
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

const CSS = `
.ng-area{position:relative;width:100%;height:100%;overflow:hidden;}
.ng-svg{position:absolute;left:0;top:0;}
.ng-fatia{cursor:default;}
.ng-rotulo{pointer-events:none;}
.ng-anel{pointer-events:none;fill:none;}
.ng-escala{pointer-events:none;}
.ng-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso as fatias ficam mais finas que a borda e nada se distingue. */
const MAXIMO_DE_FATIAS = 60;

export default defineViz({
  id: 'nightingale',
  label: 'Rosa de Nightingale',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        modoDoRaio: {
          type: 'string',
          label: 'Como o valor vira raio',
          section: 'Rosa',
          display: 'select',
          default: 'area',
          values: listaDeValores([
            { rotulo: 'Área proporcional ao valor (raio por √valor)', valor: 'area' },
            { rotulo: 'Raio proporcional ao valor (como o original — exagera)', valor: 'raio' },
          ]),
        },
        raioInterno: {
          type: 'number',
          label: 'Raio interno (% do externo)',
          section: 'Rosa',
          display: 'range',
          min: 0,
          max: 70,
          step: 5,
          default: 0,
        },
        ordem: {
          type: 'string',
          label: 'Ordem das fatias',
          section: 'Rosa',
          display: 'select',
          default: 'consulta',
          values: listaDeValores([
            { rotulo: 'Como veio da consulta (preserva meses e dias)', valor: 'consulta' },
            { rotulo: 'Pelo valor (maior primeiro)', valor: 'valorDesc' },
            { rotulo: 'Pelo valor (menor primeiro)', valor: 'valorAsc' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
          ]),
        },
        anguloInicial: {
          type: 'number',
          label: 'Começar em (graus, 0 = topo)',
          section: 'Rosa',
          display: 'range',
          min: 0,
          max: 350,
          step: 10,
          default: 0,
        },
        espacoEntreFatias: {
          type: 'number',
          label: 'Espaço entre fatias (graus)',
          section: 'Rosa',
          display: 'range',
          min: 0,
          max: 6,
          step: 0.5,
          default: 0.5,
        },
        aneisDeEscala: {
          type: 'number',
          label: 'Anéis de escala',
          section: 'Rosa',
          display: 'range',
          min: 0,
          max: 6,
          step: 1,
          default: 3,
        },
        escreverRotulos: {
          type: 'boolean',
          label: 'Nomes em volta da rosa',
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
        opcaoDeEscolhaDeCampo('campoDaCategoria', 'Dimensão das fatias', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoValor', 'Medida do raio', medidas, {
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
      ctx.mostrarVazio('Uma rosa precisa de uma dimensão (as fatias) e uma medida (o raio).');
      return;
    }

    let fatias = lerFatias({ modelo, medida, campoDaCategoria, config });
    if (!fatias.length) {
      ctx.mostrarVazio('Nenhuma categoria tem valor positivo na medida escolhida.');
      return;
    }
    if (fatias.length > MAXIMO_DE_FATIAS) {
      ctx.avisar(
        `A consulta tem ${fatias.length} categorias. Mostrando as ${MAXIMO_DE_FATIAS} primeiras: ` +
          'acima disso as fatias ficam mais finas que a própria borda.'
      );
      fatias = fatias.slice(0, MAXIMO_DE_FATIAS);
    }

    const negativos = fatias.filter((f) => f.valorBruto < 0).length;
    if (negativos > 0) {
      ctx.avisar(
        `${negativos} categoria(s) têm valor negativo. Num gráfico polar não existe raio negativo: ` +
          'elas foram desenhadas como zero. Use um gráfico de barras, que aceita o sinal.'
      );
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'ng');
    const area = criarEl('div', { classe: 'ng-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 1,
    });

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const escreverRotulos = config.escreverRotulos !== false;
    const margemDosRotulos = escreverRotulos ? 56 : 12;

    const cx = largura / 2;
    const cy = (altura - 18) / 2;
    const raioMaximo = Math.max(
      12,
      Math.min(largura / 2, (altura - 18) / 2) - margemDosRotulos
    );
    const raioInterno = (Math.max(0, Math.min(70, Number(config.raioInterno) || 0)) / 100) * raioMaximo;

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'ng-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    const grupo = criarSvgEl('g', { pai: svg, atributos: { transform: `translate(${cx},${cy})` } });

    // ---------- Escala ----------
    const maior = Math.max(...fatias.map((f) => f.valor), 1e-12);
    const modo = config.modoDoRaio || 'area';
    const paraRaio = (valor) =>
      raioDoValor({ valor, maior, raioMaximo, raioInterno, modo });

    // Anéis de escala: sem eles, o raio não tem referência e a rosa vira
    // enfeite. Os anéis ficam em VALORES redondos, não em raios iguais —
    // com área proporcional, raios iguais seriam valores desiguais.
    const aneis = Math.max(0, Math.min(6, Number(config.aneisDeEscala) || 0));
    for (let k = 1; k <= aneis; k++) {
      const valor = (maior * k) / aneis;
      const r = paraRaio(valor);
      criarSvgEl('circle', {
        pai: grupo,
        classe: 'ng-anel',
        atributos: { cx: 0, cy: 0, r, stroke: comOpacidade(tema.borda, 0.9), 'stroke-width': 1 },
      });
      const texto = criarSvgEl('text', {
        pai: grupo,
        classe: 'ng-escala',
        atributos: {
          x: 3,
          y: -r - 2,
          'font-size': Math.max(8, fonte - 2),
          fill: tema.textoSuave,
        },
      });
      definirTexto(texto, formatar(valor));
    }

    // ---------- Fatias ----------
    const paleta = coresDaPaleta(config.paleta);
    const inicio = ((Number(config.anguloInicial) || 0) * Math.PI) / 180;
    const espaco = ((Number(config.espacoEntreFatias) || 0) * Math.PI) / 180;
    const passo = (Math.PI * 2) / fatias.length;
    const total = fatias.reduce((a, f) => a + f.valor, 0);

    const desenhadas = [];

    fatias.forEach((fatia, i) => {
      const a0 = inicio + i * passo + espaco / 2;
      const a1 = inicio + (i + 1) * passo - espaco / 2;
      fatia.cor = paleta[i % paleta.length];
      fatia.raio = paraRaio(fatia.valor);
      fatia.anguloCentral = (a0 + a1) / 2;

      // Um gerador por fatia: no `geradorDeArco` os raios são constantes,
      // e numa rosa cada fatia tem o seu.
      const arco = geradorDeArco({
        raioInterno,
        raioExterno: Math.max(raioInterno + 0.5, fatia.raio),
      });
      const caminho = criarSvgEl('path', {
        pai: grupo,
        classe: 'ng-fatia',
        atributos: {
          d: arco({ startAngle: a0, endAngle: Math.max(a0 + 0.0001, a1) }) || '',
          fill: fatia.cor,
          stroke: tema.fundo,
          'stroke-width': 0.5,
          'data-chave': fatia.chave,
        },
      });
      desenhadas.push({ elemento: caminho, fatia });

      if (escreverRotulos && fatias.length <= 30) {
        const raioDoRotulo = raioMaximo + 10;
        const x = Math.sin(fatia.anguloCentral) * raioDoRotulo;
        const y = -Math.cos(fatia.anguloCentral) * raioDoRotulo;
        const naDireita = Math.sin(fatia.anguloCentral) >= 0;
        const texto = criarSvgEl('text', {
          pai: grupo,
          classe: 'ng-rotulo',
          atributos: {
            x,
            y,
            'text-anchor': naDireita ? 'start' : 'end',
            'dominant-baseline': 'central',
            'font-size': fonte,
            fill: tema.texto,
          },
        });
        definirTexto(texto, truncar(fatia.rotulo, 14));
      }
    });

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'ng-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${fatias.length} fatias de ângulo igual`,
        modo === 'area'
          ? 'ÁREA proporcional ao valor (raio por √valor)'
          : 'ATENÇÃO: raio proporcional ao valor, como no gráfico original — a ÁREA cresce com o QUADRADO, então o dobro vira quatro vezes mais tinta',
        raioInterno > 0
          ? 'com raio interno, a área do ANEL é que é proporcional'
          : null,
        aneis > 0 ? `${aneis} anéis de escala em valores redondos` : 'sem anéis: o raio não tem referência',
        `ordem ${nomeDaOrdem(config.ordem)}`,
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    for (const { elemento, fatia } of desenhadas) {
      ctx.eventos.on(elemento, 'pointerenter', (ev) => {
        elemento.setAttribute('stroke', textoLegivelSobre(fatia.cor, tema));
        elemento.setAttribute('stroke-width', '1.5');
        if (!tooltip) return;
        tooltip.mostrar(
          {
            titulo: fatia.rotulo,
            linhas: [
              { rotulo: medida.rotuloCurto, valor: formatar(fatia.valorBruto), cor: fatia.cor },
              { rotulo: 'Do maior', valor: formatarPercentual(fatia.valor / maior, 1) },
              { rotulo: 'Do total', valor: formatarPercentual(fatia.valor / (total || 1), 1) },
              {
                rotulo: 'Leitura',
                valor:
                  modo === 'area'
                    ? 'a área da fatia é proporcional ao valor'
                    : 'o raio é proporcional: a área exagera a diferença',
              },
            ],
          },
          ev.clientX,
          ev.clientY
        );
      });
      ctx.eventos.on(elemento, 'pointerleave', () => {
        elemento.setAttribute('stroke', tema.fundo);
        elemento.setAttribute('stroke-width', '0.5');
        if (tooltip) tooltip.esconder();
      });
      ctx.eventos.on(elemento, 'click', (ev) => {
        const celula = modelo.celula(modelo.linhas[fatia.indiceDaLinha], campoDaCategoria.nome);
        if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function nomeDaOrdem(modo) {
  if (modo === 'valorDesc') return 'pelo valor (maior primeiro)';
  if (modo === 'valorAsc') return 'pelo valor (menor primeiro)';
  if (modo === 'alfabetica') return 'alfabética';
  return 'da consulta';
}

/**
 * Raio de uma fatia.
 *
 * - `area`: `r = √(r₀² + (R² − r₀²)·f)`. Com ângulos iguais, a área do
 *   setor é `θ(r² − r₀²)/2`, que sai proporcional a `f` — e `f` é o valor.
 *   É a conta que corrige o defeito do gráfico original.
 * - `raio`: `r = r₀ + (R − r₀)·f`. É o original, e a área cresce com o
 *   quadrado: dobrar o valor quadruplica a tinta. Existe como opção
 *   declarada, nunca como padrão.
 *
 * Valores negativos viram zero: num gráfico polar não existe raio
 * negativo, e desenhá-lo "para dentro" produziria uma fatia que parece
 * pequena em vez de parecer contrária.
 */
export function raioDoValor({ valor, maior, raioMaximo, raioInterno = 0, modo = 'area' }) {
  const r0 = Math.max(0, Math.min(raioInterno, raioMaximo));
  if (!(maior > 0) || valor === null || !Number.isFinite(valor) || valor <= 0) return r0;

  const f = Math.max(0, Math.min(1, valor / maior));
  if (modo === 'raio') return r0 + (raioMaximo - r0) * f;
  return Math.sqrt(r0 * r0 + (raioMaximo * raioMaximo - r0 * r0) * f);
}

/** Área do setor entre dois raios, para o ângulo dado. */
export function areaDoSetor({ raio, raioInterno = 0, angulo }) {
  return (angulo * (raio * raio - raioInterno * raioInterno)) / 2;
}

/**
 * Lê as fatias, somando as linhas de cada categoria.
 *
 * A ordem padrão é a da CONSULTA, e isso é deliberado: com meses ou dias
 * da semana, reordenar por valor destrói a leitura — a rosa deixa de ser
 * um calendário e vira um ranking circular, que é outro gráfico.
 */
export function lerFatias({ modelo, medida, campoDaCategoria, config = {} }) {
  const porChave = new Map();

  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const chave = String(modelo.valorBruto(linha, campoDaCategoria.nome));
    if (!porChave.has(chave)) {
      porChave.set(chave, {
        chave,
        rotulo: campoDaCategoria.ehData
          ? formatarData(modelo.valorBruto(linha, campoDaCategoria.nome), config.formatoDeData || 'auto')
          : modelo.texto(linha, campoDaCategoria.nome, undefined, '∅'),
        valorBruto: 0,
        indiceDaLinha: i,
      });
    }
    const v = modelo.valorNumerico(linha, medida.nome);
    if (v !== null && Number.isFinite(v)) porChave.get(chave).valorBruto += v;
  }

  const fatias = Array.from(porChave.values()).map((f) => ({
    ...f,
    // O valor DESENHADO nunca é negativo; o bruto fica para o tooltip e
    // para o aviso.
    valor: Math.max(0, f.valorBruto),
  }));

  const modo = config.ordem || 'consulta';
  if (modo === 'valorDesc') fatias.sort((a, b) => b.valor - a.valor);
  else if (modo === 'valorAsc') fatias.sort((a, b) => a.valor - b.valor);
  else if (modo === 'alfabetica') fatias.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

  return fatias;
}
