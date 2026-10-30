/**
 * pareto — "Pareto".
 *
 * Barras ordenadas da maior para a menor com a linha de percentual
 * ACUMULADO no eixo da direita. A pergunta que o gráfico responde é
 * sempre a mesma: quantas categorias respondem pela maior parte do total?
 *
 * A marca dos 80% (configurável) é desenhada onde a linha acumulada cruza
 * esse nível, e o gráfico escreve quantas categorias estão antes dali —
 * que é a leitura prática do princípio de Pareto.
 *
 * Valores negativos quebram a leitura: o acumulado deixa de ser monótono,
 * e "80% do total" perde sentido quando parte das categorias subtrai. Por
 * isso o gráfico avisa em vez de desenhar algo que parece certo.
 *
 * Campos: 1 dimensão (categoria) e 1 medida.
 *
 * Opções (correções v2):
 *   - Rótulos: NOVO rótulo de valor em cada barra, com o bloco Rótulos
 *     inteiro (posição dentro/fora/centro/automática, conteúdo — valor,
 *     nome, % do total —, formato, casas, tamanho, cor, negrito, rotação,
 *     truncar, esconder sobrepostos).
 *   - Cores: "Cor das barras" vale quando o usuário escolhe uma cor
 *     diferente da padrão; com a padrão, as barras seguem a paleta (1ª cor,
 *     respeitando "Inverter ordem das cores"). Opacidade e contorno valem
 *     nas barras (e nos pontos do acumulado).
 *   - Tooltip único, valor no texto do Looker; o clique segue a "Ação do
 *     clique": drill se a célula tem links, senão FIXA o tooltip (Shift
 *     sempre fixa; Esc ou clique fora solta) — era o "não fica
 *     persistente".
 *   - Eixos: escala/mínimo/máximo/inverter do Y e "Inverter eixo X".
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica, escalaDeBanda } from '../../core/scales.js';
import {
  calcularMargens,
  areaDeDesenho,
  desenharEixos,
  desenharEixoSecundario,
  espacoParaEixoSecundario,
} from '../../core/eixos.js';
import { geradorDeLinha, criarMarcadorSvg } from '../../core/shapes.js';
import { textoLegivelSobre } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { paletaDoConfig, opacidadeDoConfig, lerContorno, aplicarContorno } from '../../core/cores.js';
import {
  lerRotulos,
  textoDoRotulo,
  criarRotuloSvg,
  esconderColisoes,
  larguraDoTexto,
  posicaoEfetiva,
} from '../../core/rotulos.js';
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

const CSS = `
.pt-area{position:relative;width:100%;height:100%;}
.pt-barra{cursor:pointer;transition:opacity .15s ease;}
.pt-apagada{opacity:.3;}
.pt-linha{fill:none;pointer-events:none;}
.pt-ponto{pointer-events:none;}
.pt-marca{pointer-events:none;}
.pt-texto{pointer-events:none;}
.pt-rotulo{pointer-events:none;}
.pt-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
@media (prefers-reduced-motion: reduce){.pt-barra{transition:none;}}
`;

/** Default declarado de "Cor das barras" (não mudar: dashboards salvos). */
const COR_PADRAO_DA_BARRA = '#4276BE';

export default defineViz({
  id: 'pareto',
  label: 'Pareto',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeEixos(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        nivelDeCorte: {
          type: 'number',
          label: 'Nível de corte (%)',
          section: 'Pareto',
          display: 'range',
          min: 50,
          max: 99,
          step: 1,
          default: 80,
        },
        mostrarCorte: {
          type: 'boolean',
          label: 'Marcar onde o acumulado cruza o corte',
          section: 'Pareto',
          default: true,
        },
        destacarAteOCorte: {
          type: 'boolean',
          label: 'Destacar as barras que estão antes do corte',
          section: 'Pareto',
          default: true,
        },
        maximoDeCategorias: {
          type: 'number',
          label: 'Máximo de barras (o resto vira "Outros")',
          section: 'Dados',
          display: 'range',
          min: 5,
          max: 60,
          step: 1,
          default: 20,
        },
        corDaBarra: {
          type: 'string',
          label: 'Cor das barras',
          section: 'Cores',
          display: 'color',
          default: COR_PADRAO_DA_BARRA,
        },
        corDoAcumulado: {
          type: 'string',
          label: 'Cor da linha acumulada',
          section: 'Cores',
          display: 'color',
          default: '#D97706',
        },
        larguraDaBarra: {
          type: 'number',
          label: 'Largura da barra (% do espaço)',
          section: 'Formato',
          display: 'range',
          min: 20,
          max: 100,
          step: 5,
          default: 80,
        },
        mostrarPontosDoAcumulado: {
          type: 'boolean',
          label: 'Marcar cada ponto da linha acumulada',
          section: 'Formato',
          default: true,
        },
      }
    ),
    { rotacaoRotuloEixoX: 35, gradeEixoY: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const campoDaCategoria = modelo.dimensoes[0];
    const medida = modelo.medidas[0];
    if (!campoDaCategoria || !medida) {
      ctx.mostrarVazio('O Pareto precisa de uma dimensão e uma medida.');
      return;
    }

    const leitura = montarPareto({ modelo, campoDaCategoria, medida, config });
    for (const aviso of leitura.avisos) ctx.avisar(aviso);

    if (leitura.itens.length < 2) {
      ctx.mostrarVazio('São necessárias pelo menos duas categorias com valor.');
      return;
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'pt');
    const area = criarEl('div', { classe: 'pt-area', pai: raiz });

    // `0` casa é escolha do usuário (antes `|| 0` só acertava por acaso).
    const casas = Number(config.casasDecimaisDoRotulo);
    const formatarValor = formatadorDeValueFormat(medida.valueFormat, {
      casas: Number.isFinite(casas) ? casas : 0,
    });
    const formatarPercentualDoEixo = (v) => `${Math.round(v * 100)}%`;
    // Valor de uma barra: texto do Looker quando a barra é UMA linha da
    // consulta; soma de várias (ou "Outros") é número derivado, formatado
    // pelo value_format do campo.
    const textoDoValor = (item) =>
      item.linhas === 1 && item.indiceDaLinha >= 0
        ? modelo.texto(modelo.linhas[item.indiceDaLinha], medida.nome, undefined, '') || formatarValor(item.valor)
        : formatarValor(item.valor);

    // Relidos a cada desenho.
    const rot = lerRotulos(config, tema);
    const opacidade = opacidadeDoConfig(config);
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });

    // ---------- Geometria ----------
    const margens = calcularMargens({
      rotulosY: leitura.itens.map((i) => formatarValor(i.valor)),
      rotulosX: leitura.itens.map((i) => i.rotulo),
      config,
      tema,
    });
    margens.direita = Math.max(
      margens.direita,
      espacoParaEixoSecundario(['100%'], tema, false)
    );
    // Rótulo "fora" acima da maior barra precisa de espaço no topo.
    if (rot.mostrar) margens.cima = (margens.cima || 0) + rot.tamanho + 4;
    const retangulo = areaDeDesenho(largura, altura, margens);

    const inverterX = config.inverterEixoX === true;
    const intervaloX = [retangulo.esquerda, retangulo.esquerda + retangulo.largura];
    if (inverterX) intervaloX.reverse();
    const escalaX = escalaDeBanda({
      dominio: leitura.itens.map((i) => i.chave),
      intervalo: intervaloX,
      config: { larguraDaBarra: Number(config.larguraDaBarra) || 80, espacamentoEntreGrupos: 10 },
    });
    const escalaY = escalaNumerica({
      valores: [0, ...leitura.itens.map((i) => i.valor)],
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config,
      eixo: 'Y',
    });
    // O eixo do acumulado vai SEMPRE de 0 a 100%: é o que dá sentido à
    // marca do corte e permite comparar dois Paretos lado a lado.
    const escalaAcumulado = escalaNumerica({
      valores: [0, 1],
      intervalo: [retangulo.cima + retangulo.altura, retangulo.cima],
      config: { minimoEixoY: 0, maximoEixoY: 1 },
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
      rotulosDeBanda: leitura.itens.map((i) => i.chave),
      formatarX: (chave) => {
        const item = leitura.itens.find((x) => x.chave === chave);
        return item ? truncar(item.rotulo, 22) : String(chave);
      },
      formatarY: formatarValor,
    });

    desenharEixoSecundario({
      svg,
      escala: escalaAcumulado,
      area: retangulo,
      tema,
      formatar: formatarPercentualDoEixo,
      cor: config.corDoAcumulado,
    });

    // ---------- Barras ----------
    // "Cor das barras" escolhida pelo usuário vence; com o valor padrão,
    // vale a paleta (1ª cor, com "Inverter ordem das cores"). Antes a
    // opção tinha default preenchido e a paleta nunca era lida.
    const escolhida = typeof config.corDaBarra === 'string' ? config.corDaBarra.trim() : '';
    const corDaBarra =
      escolhida && escolhida.toUpperCase() !== COR_PADRAO_DA_BARRA ? escolhida : paletaDoConfig(config)[0];
    const yDoZero = escalaY(0);
    const barras = [];
    const caixasDeRotulo = [];

    leitura.itens.forEach((item, indice) => {
      const x = escalaX(item.chave);
      const y = escalaY(Math.max(0, item.valor));
      const antesDoCorte = config.destacarAteOCorte !== false && indice <= leitura.indiceDoCorte;
      const topo = Math.min(y, yDoZero);
      const alturaDaBarra = Math.max(0.5, Math.abs(yDoZero - y));

      const barra = criarSvgEl('rect', {
        pai: svg,
        classe: 'pt-barra',
        atributos: {
          x,
          y: topo,
          width: escalaX.bandwidth(),
          height: alturaDaBarra,
          fill: corDaBarra,
          // As barras depois do corte ficam a 40% da opacidade escolhida.
          'fill-opacity': opacidade * (antesDoCorte ? 1 : 0.4),
          rx: 1,
        },
      });
      aplicarContorno(barra, contorno);
      barras.push(barra);

      // --- Rótulo de dado ---
      if (rot.mostrar) {
        const texto = textoDoRotulo(rot, {
          valor: item.valor,
          nome: item.rotulo,
          total: leitura.total,
          percentual: item.participacao,
          valueFormat: medida.valueFormat,
          textoDoValor: textoDoValor(item),
        });
        const cabeDentro = alturaDaBarra >= rot.tamanho + 6;
        const onde = posicaoEfetiva(rot, { cabeDentro });
        const cx = x + escalaX.bandwidth() / 2;
        const cy =
          onde === 'centro' ? topo + alturaDaBarra / 2
            : onde === 'dentro' ? topo + rot.tamanho / 2 + 3
              : topo - rot.tamanho / 2 - 3;
        const el = criarRotuloSvg(svg, rot, {
          x: cx,
          y: cy,
          texto,
          // Dentro da barra: cor legível sobre a barra; fora: a do tema.
          corAutomatica: onde === 'fora' ? tema.texto : textoLegivelSobre(corDaBarra, tema),
        });
        if (el) {
          el.setAttribute('class', 'bl-rotulo pt-rotulo');
          caixasDeRotulo.push({ el, x: cx, y: cy, largura: larguraDoTexto(texto, rot.tamanho), altura: rot.tamanho });
        }
      }
    });
    // As maiores barras vêm primeiro: são as que ficam quando há colisão.
    esconderColisoes(caixasDeRotulo, rot);

    // ---------- Linha acumulada ----------
    const meioDaBanda = escalaX.bandwidth() / 2;
    const corDoAcumulado = config.corDoAcumulado || tema.atencao;
    const desenhar = geradorDeLinha({
      x: (_, i) => escalaX(leitura.itens[i].chave) + meioDaBanda,
      y: (_, i) => escalaAcumulado(leitura.itens[i].acumulado),
      curva: 'linear',
    });
    criarSvgEl('path', {
      pai: svg,
      classe: 'pt-linha',
      atributos: {
        d: desenhar(leitura.itens) || '',
        stroke: corDoAcumulado,
        'stroke-width': 2,
        'stroke-linejoin': 'round',
      },
    });

    if (config.mostrarPontosDoAcumulado !== false) {
      leitura.itens.forEach((item) => {
        const px = escalaX(item.chave) + meioDaBanda;
        const py = escalaAcumulado(item.acumulado);
        const ponto = criarMarcadorSvg(svg, 'circulo', px, py, 5, {
          classe: 'pt-ponto',
          fill: corDoAcumulado,
          'fill-opacity': opacidade,
          'data-x': px,
          'data-y': py,
        });
        aplicarContorno(ponto, contorno);
      });
    }

    // ---------- Marca do corte ----------
    const nivel = (Number(config.nivelDeCorte) || 80) / 100;
    if (config.mostrarCorte !== false && leitura.indiceDoCorte >= 0) {
      const yDoNivel = escalaAcumulado(nivel);
      criarSvgEl('line', {
        pai: svg,
        classe: 'pt-marca',
        atributos: {
          x1: retangulo.esquerda, x2: retangulo.esquerda + retangulo.largura,
          y1: yDoNivel, y2: yDoNivel,
          stroke: tema.textoSuave, 'stroke-width': 1, 'stroke-dasharray': '4 3',
        },
      });

      // Com o eixo invertido, o "depois" da barra do corte fica à esquerda.
      const xDaBarraDoCorte = escalaX(leitura.itens[leitura.indiceDoCorte].chave);
      const xDoCorte = inverterX ? xDaBarraDoCorte : xDaBarraDoCorte + escalaX.bandwidth();
      criarSvgEl('line', {
        pai: svg,
        classe: 'pt-marca',
        atributos: {
          x1: xDoCorte, x2: xDoCorte,
          y1: retangulo.cima, y2: retangulo.cima + retangulo.altura,
          stroke: tema.textoSuave, 'stroke-width': 1, 'stroke-dasharray': '4 3',
        },
      });

      const rotulo = criarSvgEl('text', {
        pai: svg,
        classe: 'pt-texto',
        atributos: {
          x: retangulo.esquerda + 4,
          y: yDoNivel - 4,
          'font-size': Math.max(9, tema.tamanhoBase - 1),
          fill: tema.textoSuave,
        },
      });
      definirTexto(rotulo, `${Math.round(nivel * 100)}%`);
    }

    // ---------- Nota ----------
    const nota = ctx.nota; // 5.1c: texto automático da nota
    nota.style.color = tema.textoSuave;
    definirTexto(nota, textoDaConclusao(leitura, nivel, formatarValor));

    // ---------- Interação ----------
    // Tooltip ÚNICO do gráfico (null se desligado). Não é destruído a cada
    // desenho: o núcleo esconde no redesenho e remove no destroy.
    const tooltip = ctx.tooltip();

    const conteudoDe = (item, indice) => {
      const valor = textoDoValor(item);
      const participacao = formatarPercentual(item.participacao, 1);
      return {
        titulo: item.rotulo,
        linhas: [
          { rotulo: medida.rotuloCurto, valor, cor: corDaBarra },
          { rotulo: 'Participação', valor: participacao },
          { rotulo: 'Acumulado', valor: formatarPercentual(item.acumulado, 1), cor: corDoAcumulado },
          { rotulo: 'Posição', valor: `${indice + 1}ª de ${leitura.itens.length}` },
        ],
        variaveis: {
          categoria: item.rotulo,
          valor,
          serie: medida.rotuloCurto,
          percentual: participacao,
          acumulado: formatarPercentual(item.acumulado, 1),
        },
      };
    };

    /** Célula do clique: a da categoria; se ela não tem drill, a da medida. */
    const celulaDe = (item) => {
      if (item.indiceDaLinha < 0) return null; // "Outros" não tem linha
      const linha = modelo.linhas[item.indiceDaLinha];
      const daCategoria = modelo.celula(linha, campoDaCategoria.nome);
      if (daCategoria && daCategoria.links && daCategoria.links.length) return daCategoria;
      if (item.linhas === 1) {
        const daMedida = modelo.celula(linha, medida.nome);
        if (daMedida && daMedida.links && daMedida.links.length) return daMedida;
      }
      return daCategoria;
    };

    leitura.itens.forEach((item, indice) => {
      const barra = barras[indice];
      if (tooltip) {
        ctx.eventos.on(barra, 'pointerenter', (ev) => {
          barras.forEach((outra, i) => outra.classList.toggle('pt-apagada', i !== indice));
          tooltip.mostrar(conteudoDe(item, indice), ev.clientX, ev.clientY);
        });
        ctx.eventos.on(barra, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(barra, 'pointerleave', () => {
          barras.forEach((outra) => outra.classList.remove('pt-apagada'));
          tooltip.esconder();
        });
      }

      // "Ação do clique": drill se a célula tem links; senão fixa o
      // tooltip (Shift+clique sempre fixa). É o que o deixa persistente.
      ctx.eventos.on(barra, 'click', (ev) => {
        ctx.cliqueNoItem(ev, celulaDe(item), conteudoDe(item, indice));
      });
    });
  },
});

/* ------------------------------------------------------------------ */

/**
 * Ordena as categorias, acumula e acha onde o acumulado cruza o corte.
 *
 * @returns {{itens:Array, total:number, indiceDoCorte:number, avisos:string[]}}
 */
export function montarPareto({ modelo, campoDaCategoria, medida, config }) {
  const avisos = [];
  const porChave = new Map();

  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const bruto = modelo.valorBruto(linha, campoDaCategoria.nome);
    const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
    if (!porChave.has(chave)) {
      porChave.set(chave, {
        chave,
        rotulo: modelo.texto(linha, campoDaCategoria.nome, undefined, '∅'),
        valor: 0,
        indiceDaLinha: i,
        // Quantas linhas da consulta somam nesta barra: com UMA, o tooltip
        // e o rótulo usam o texto do Looker daquela célula.
        linhas: 0,
      });
    }
    const v = modelo.valorNumerico(linha, medida.nome);
    porChave.get(chave).linhas += 1;
    if (v !== null) porChave.get(chave).valor += v;
  }

  let itens = Array.from(porChave.values()).filter((i) => i.valor !== 0);

  // Com negativos o acumulado deixa de subir sempre, e "80% do total"
  // perde o sentido. Avisar é melhor do que desenhar algo plausível.
  const negativos = itens.filter((i) => i.valor < 0);
  if (negativos.length) {
    avisos.push(
      `${negativos.length} categoria(s) têm valor negativo. O Pareto pressupõe valores positivos: ` +
        'com negativos, o acumulado deixa de ser crescente e a leitura dos 80% não vale.'
    );
  }

  itens.sort((a, b) => b.valor - a.valor);

  // Excedente vira "Outros", somado — cortar mudaria o total e, com ele,
  // todos os percentuais.
  const limite = Number(config.maximoDeCategorias) || 20;
  if (itens.length > limite) {
    const mantidos = itens.slice(0, limite - 1);
    const resto = itens.slice(limite - 1);
    const soma = resto.reduce((a, i) => a + i.valor, 0);
    mantidos.push({
      chave: '__outros__',
      rotulo: `Outros (${resto.length})`,
      valor: soma,
      indiceDaLinha: -1,
      ehOutros: true,
    });
    avisos.push(`${resto.length} categoria(s) além do limite foram somadas em "Outros".`);

    // "Outros" volta para a ordenação em vez de ficar fixo no fim. Num
    // Pareto a linha acumulada PRECISA ser crescente — é ela que sustenta
    // a leitura dos 80% — e um balde grande jogado no fim quebra isso.
    mantidos.sort((a, b) => b.valor - a.valor);
    itens = mantidos;

    const posicaoDeOutros = itens.findIndex((i) => i.ehOutros);
    if (posicaoDeOutros >= 0 && posicaoDeOutros < itens.length / 2) {
      avisos.push(
        'O grupo "Outros" está entre as maiores barras: o limite de categorias está escondendo a ' +
          'estrutura dos dados. Aumente o máximo de barras ou filtre a consulta.'
      );
    }
  }

  const total = itens.reduce((a, i) => a + i.valor, 0);
  let acumulado = 0;
  for (const item of itens) {
    acumulado += item.valor;
    item.participacao = total === 0 ? 0 : item.valor / total;
    item.acumulado = total === 0 ? 0 : acumulado / total;
  }

  const nivel = (Number(config.nivelDeCorte) || 80) / 100;
  const indiceDoCorte = itens.findIndex((i) => i.acumulado >= nivel);

  return { itens, total, indiceDoCorte, avisos };
}

/** A frase que traduz o gráfico para quem só vai ler uma linha. */
function textoDaConclusao(leitura, nivel, formatarValor) {
  const { itens, indiceDoCorte, total } = leitura;
  if (indiceDoCorte < 0) {
    return `Total ${formatarValor(total)} em ${itens.length} categorias.`;
  }
  const quantas = indiceDoCorte + 1;
  const percentualDeCategorias = (quantas / itens.length) * 100;
  return (
    `${quantas} de ${itens.length} categorias (${Math.round(percentualDeCategorias)}%) ` +
    `respondem por ${formatarPercentual(itens[indiceDoCorte].acumulado, 0)} do total ` +
    `de ${formatarValor(total)}.`
  );
}
