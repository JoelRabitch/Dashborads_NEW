/**
 * ponte_variacao — "Ponte de Variação" (waterfall).
 *
 * Liga um valor inicial a um final mostrando cada contribuição no caminho.
 * A pergunta é sempre "o que explica a diferença entre A e B".
 *
 * O erro clássico do waterfall é tratar todas as barras igual. São dois
 * tipos, e confundi-los inverte a leitura:
 *
 *   - **contribuições** FLUTUAM: começam onde a anterior terminou;
 *   - **totais** são ANCORADOS no zero, porque representam um nível, não
 *     uma variação.
 *
 * A soma das contribuições tem que fechar com a diferença entre o total
 * inicial e o final. Quando não fecha, o gráfico ainda assim desenha, mas
 * AVISA e mostra o resíduo — um waterfall que não fecha está escondendo
 * alguma coisa, e esconder a inconsistência seria pior.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import { escalaNumerica, escalaDeBanda } from '../../core/scales.js';
import { calcularMargens, areaDeDesenho, desenharEixos } from '../../core/eixos.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { textoLegivelSobre } from '../../core/theme.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeEixos,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.pv-area{position:relative;width:100%;height:100%;}
.pv-barra{cursor:pointer;transition:opacity .15s ease;}
.pv-apagada{opacity:.35;}
.pv-conector{pointer-events:none;}
.pv-texto{pointer-events:none;}
.pv-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.8;pointer-events:none;}
@media (prefers-reduced-motion: reduce){.pv-barra{transition:none;}}
`;

export default defineViz({
  id: 'ponte_variacao',
  label: 'Ponte de Variação',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        comoIdentificarTotais: {
          type: 'string',
          label: 'Quais barras são totais (ancoradas no zero)',
          section: 'Ponte',
          display: 'select',
          default: 'primeiraEUltima',
          values: listaDeValores([
            { rotulo: 'A primeira e a última', valor: 'primeiraEUltima' },
            { rotulo: 'Só a última (começa do zero)', valor: 'ultima' },
            { rotulo: 'Pelo texto da categoria', valor: 'porTexto' },
            { rotulo: 'Nenhuma: todas são contribuições', valor: 'nenhuma' },
          ]),
        },
        textoQueMarcaTotal: {
          type: 'string',
          label: 'Texto que marca um total (separado por vírgula)',
          section: 'Ponte',
          default: 'total,saldo,inicial,final',
        },
        mostrarConectores: {
          type: 'boolean',
          label: 'Linhas ligando uma barra à seguinte',
          section: 'Ponte',
          default: true,
        },
        corDeAumento: {
          type: 'string',
          label: 'Cor de aumento',
          section: 'Cores',
          display: 'color',
          default: '#16A34A',
        },
        corDeQueda: {
          type: 'string',
          label: 'Cor de queda',
          section: 'Cores',
          display: 'color',
          default: '#DC2626',
        },
        corDeTotal: {
          type: 'string',
          label: 'Cor dos totais',
          section: 'Cores',
          display: 'color',
          default: '#475569',
        },
        larguraDaBarra: {
          type: 'number',
          label: 'Largura da barra (% do espaço)',
          section: 'Formato',
          display: 'range',
          min: 20,
          max: 100,
          step: 5,
          default: 65,
        },
        mostrarValorNaBarra: {
          type: 'boolean',
          label: 'Escrever o valor em cada barra',
          section: 'Rótulos',
          default: true,
        },
        mostrarParticipacao: {
          type: 'boolean',
          label: 'Mostrar quanto cada contribuição pesa na variação',
          section: 'Rótulos',
          default: false,
        },
      }
    ),
    { rotacaoRotuloEixoX: 30, gradeEixoY: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const campoDaCategoria = modelo.dimensoes[0];
    const medida = modelo.medidas[0];
    if (!campoDaCategoria || !medida) {
      ctx.mostrarVazio('A ponte precisa de uma dimensão (as etapas) e uma medida.');
      return;
    }

    const ponte = montarPonte({ modelo, campoDaCategoria, medida, config });
    for (const aviso of ponte.avisos) ctx.avisar(aviso);

    if (ponte.barras.length < 2) {
      ctx.mostrarVazio('São necessárias pelo menos duas etapas para montar uma ponte.');
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'pv');
    const area = criarEl('div', { classe: 'pv-area', pai: raiz });

    const formatar = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number(config.casasDecimaisDoRotulo) || 0,
    });

    // ---------- Escalas ----------
    const extremos = ponte.barras.flatMap((b) => [b.base, b.topo]);
    const margens = calcularMargens({
      rotulosY: extremos.map(formatar),
      rotulosX: ponte.barras.map((b) => b.rotulo),
      config,
      tema,
    });
    const retangulo = areaDeDesenho(largura, altura, margens);

    const escalaX = escalaDeBanda({
      dominio: ponte.barras.map((b) => b.chave),
      intervalo: [retangulo.esquerda, retangulo.esquerda + retangulo.largura],
      config: { larguraDaBarra: Number(config.larguraDaBarra) || 65, espacamentoEntreGrupos: 8 },
    });
    // O zero precisa estar no domínio: é a âncora dos totais.
    const escalaY = escalaNumerica({
      valores: [...extremos, 0],
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
      rotulosDeBanda: ponte.barras.map((b) => b.chave),
      formatarX: (chave) => {
        const barra = ponte.barras.find((b) => b.chave === chave);
        return barra ? truncar(barra.rotulo, 20) : String(chave);
      },
      formatarY: formatar,
    });

    // ---------- Conectores ----------
    // Vêm antes das barras para ficarem por baixo delas.
    if (config.mostrarConectores !== false) {
      for (let i = 0; i < ponte.barras.length - 1; i++) {
        const atual = ponte.barras[i];
        const proxima = ponte.barras[i + 1];
        // O conector sai do nível em que a barra atual TERMINOU, que é de
        // onde a próxima contribuição parte.
        const y = escalaY(proxima.ehTotal ? proxima.topo : proxima.base);
        criarSvgEl('line', {
          pai: svg,
          classe: 'pv-conector',
          atributos: {
            x1: escalaX(atual.chave),
            x2: escalaX(proxima.chave) + escalaX.bandwidth(),
            y1: y,
            y2: y,
            stroke: tema.borda,
            'stroke-width': 1,
            'stroke-dasharray': '3 2',
          },
        });
      }
    }

    // ---------- Barras ----------
    const corDeAumento = config.corDeAumento || tema.positivo;
    const corDeQueda = config.corDeQueda || tema.negativo;
    const corDeTotal = config.corDeTotal || tema.neutro;
    const elementos = [];

    for (const barra of ponte.barras) {
      const yTopo = escalaY(Math.max(barra.base, barra.topo));
      const yBase = escalaY(Math.min(barra.base, barra.topo));
      const cor = barra.ehTotal ? corDeTotal : barra.valor >= 0 ? corDeAumento : corDeQueda;

      const elemento = criarSvgEl('rect', {
        pai: svg,
        classe: 'pv-barra',
        atributos: {
          x: escalaX(barra.chave),
          y: yTopo,
          width: escalaX.bandwidth(),
          height: Math.max(1, yBase - yTopo),
          fill: cor,
          rx: 1,
        },
      });
      elementos.push(elemento);
      barra.cor = cor;

      if (config.mostrarValorNaBarra !== false && escalaX.bandwidth() > 24) {
        const altura = yBase - yTopo;
        const cabeDentro = altura > tema.tamanhoBase * 2;
        const texto = criarSvgEl('text', {
          pai: svg,
          classe: 'pv-texto',
          atributos: {
            x: escalaX(barra.chave) + escalaX.bandwidth() / 2,
            y: cabeDentro ? (yTopo + yBase) / 2 : yTopo - 4,
            'text-anchor': 'middle',
            'dominant-baseline': cabeDentro ? 'central' : 'auto',
            'font-size': Math.max(8, tema.tamanhoBase - 2),
            fill: cabeDentro ? textoLegivelSobre(cor, tema) : tema.texto,
          },
        });
        const prefixo = barra.ehTotal || barra.valor < 0 ? '' : '+';
        definirTexto(texto, `${prefixo}${formatar(barra.valor)}`);
      }
    }

    // ---------- Nota de fechamento ----------
    const nota = criarEl('div', { classe: 'pv-nota', pai: area });
    nota.style.color = ponte.residuo === 0 ? tema.textoSuave : tema.atencao;
    definirTexto(nota, textoDeFechamento(ponte, formatar));

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    ponte.barras.forEach((barra, indice) => {
      const elemento = elementos[indice];
      if (tooltip) {
        ctx.eventos.on(elemento, 'pointerenter', (ev) => {
          elementos.forEach((outro, i) => outro.classList.toggle('pv-apagada', i !== indice));
          const linhas = [
            {
              rotulo: barra.ehTotal ? 'Total' : barra.valor >= 0 ? 'Aumento' : 'Queda',
              valor: formatar(barra.valor),
              cor: barra.cor,
            },
          ];
          if (!barra.ehTotal) {
            linhas.push({ rotulo: 'De', valor: formatar(barra.base) });
            linhas.push({ rotulo: 'Para', valor: formatar(barra.topo) });
            if (ponte.variacaoTotal !== 0 && config.mostrarParticipacao !== false) {
              linhas.push({
                rotulo: 'Peso na variação',
                valor: formatarPercentual(barra.valor / ponte.variacaoTotal, 1),
              });
            }
          }
          tooltip.mostrar({ titulo: barra.rotulo, linhas }, ev.clientX, ev.clientY);
        });
        ctx.eventos.on(elemento, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(elemento, 'pointerleave', () => {
          elementos.forEach((outro) => outro.classList.remove('pv-apagada'));
          tooltip.esconder();
        });
      }

      ctx.eventos.on(elemento, 'click', (ev) => {
        if (barra.indiceDaLinha < 0) return;
        const celula = modelo.celula(modelo.linhas[barra.indiceDaLinha], campoDaCategoria.nome);
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
 * Monta as barras da ponte.
 *
 * Cada barra ganha `base` e `topo`: contribuições flutuam a partir do
 * acumulado corrente; totais vão do zero até o próprio valor.
 *
 * @returns {{barras:Array, variacaoTotal:number, residuo:number, avisos:string[]}}
 */
export function montarPonte({ modelo, campoDaCategoria, medida, config }) {
  const avisos = [];
  const linhas = [];

  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const valor = modelo.valorNumerico(linha, medida.nome);
    if (valor === null) continue;
    linhas.push({
      chave: String(modelo.valorBruto(linha, campoDaCategoria.nome)),
      rotulo: modelo.texto(linha, campoDaCategoria.nome, undefined, '∅'),
      valor,
      indiceDaLinha: i,
    });
  }

  if (!linhas.length) return { barras: [], variacaoTotal: 0, residuo: 0, avisos };

  const ehTotal = criarDetectorDeTotal(config, linhas.length);

  let acumulado = 0;
  const barras = linhas.map((item, indice) => {
    const total = ehTotal(item, indice);
    if (total) {
      // Um total é um NÍVEL: ancora no zero e redefine o acumulado.
      acumulado = item.valor;
      return { ...item, ehTotal: true, base: 0, topo: item.valor };
    }
    const base = acumulado;
    acumulado += item.valor;
    return { ...item, ehTotal: false, base, topo: acumulado };
  });

  // ---- Conferência de fechamento ----
  const totais = barras.filter((b) => b.ehTotal);
  const contribuicoes = barras.filter((b) => !b.ehTotal);
  const somaDasContribuicoes = contribuicoes.reduce((a, b) => a + b.valor, 0);

  let variacaoTotal = somaDasContribuicoes;
  let residuo = 0;

  if (totais.length >= 2) {
    const inicial = totais[0].valor;
    const final = totais[totais.length - 1].valor;
    variacaoTotal = final - inicial;
    residuo = variacaoTotal - somaDasContribuicoes;

    // Tolerância relativa: comparar floats com zero exato acusaria erro em
    // qualquer consulta com centavos.
    const escala = Math.max(Math.abs(inicial), Math.abs(final), 1);
    if (Math.abs(residuo) > escala * 1e-6) {
      avisos.push(
        `A ponte não fecha: as contribuições somam ${somaDasContribuicoes.toLocaleString('pt-BR')} ` +
          `mas a diferença entre o total inicial e o final é ${variacaoTotal.toLocaleString('pt-BR')}. ` +
          'Falta alguma etapa na consulta, ou algum total está no lugar errado.'
      );
    } else {
      residuo = 0;
    }
  }

  return { barras, variacaoTotal, residuo, avisos };
}

/** Decide quais barras são totais, conforme a opção escolhida. */
function criarDetectorDeTotal(config, quantidade) {
  const modo = config.comoIdentificarTotais || 'primeiraEUltima';

  if (modo === 'nenhuma') return () => false;
  if (modo === 'ultima') return (_, indice) => indice === quantidade - 1;
  if (modo === 'primeiraEUltima') {
    return (_, indice) => indice === 0 || indice === quantidade - 1;
  }

  const termos = String(config.textoQueMarcaTotal || 'total')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return (item) => {
    const rotulo = item.rotulo.toLowerCase();
    return termos.some((termo) => rotulo.includes(termo));
  };
}

/** Frase do rodapé: fechou ou não fechou, e de quanto foi a variação. */
function textoDeFechamento(ponte, formatar) {
  const sinal = ponte.variacaoTotal >= 0 ? '+' : '';
  const base = `Variação total: ${sinal}${formatar(ponte.variacaoTotal)}`;
  if (ponte.residuo === 0) return `${base} · a ponte fecha.`;
  return `${base} · resíduo não explicado de ${formatar(ponte.residuo)}.`;
}
