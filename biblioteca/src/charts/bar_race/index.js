/**
 * bar_race — "Bar Chart Race".
 *
 * Barras ordenadas que se reordenam ao longo do tempo.
 *
 * **Uma ressalva sobre o próprio gráfico, antes do código.** O bar race é
 * um gráfico de entretenimento que as pessoas usam para analisar. A
 * animação prende a atenção e esconde um fato simples: só o quadro PARADO
 * tem informação comparável; o caminho até ele passa rápido demais para
 * ser retido, e ninguém consegue dizer depois o que aconteceu no meio.
 *
 * Isso não é motivo para não construí-lo — é motivo para construí-lo de um
 * jeito que permita analisar: a barra de tempo é tão proeminente quanto o
 * play, dá para arrastar para qualquer período, e a nota diz que a
 * comparação só vale com o gráfico parado.
 *
 * E a animação respeita `prefers-reduced-motion`: quem pediu menos
 * movimento recebe o gráfico PARADO no último período, com o controle
 * manual funcionando. Acessibilidade aqui não é um extra — animação
 * involuntária é um gatilho real para parte dos usuários.
 *
 * Correções v2 (módulos 6.1, 6.2 e seção 7):
 *   - o valor ao lado da barra é um RÓTULO de dado e passa pela função
 *     única de rótulos (`core/rotulos.js`): "Mostrar rótulos", tamanho,
 *     cor, negrito, rotação, posição (fora/dentro/centro), conteúdo,
 *     formato, casas e truncar têm efeito. Antes era escrito sempre, com
 *     estilo fixo;
 *   - aba Cores: paleta via `corDoItem` ("Inverter ordem das cores"; a
 *     cor própria `cor_<série>` continua valendo), opacidade e contorno;
 *   - linhas de grade verticais (opção nova `mostrarGrade`) na "Cor das
 *     linhas de grade" do tema — antes não havia grade, então a opção não
 *     tinha onde aparecer;
 *   - número do rank (1, 2, 3…) à esquerda de cada barra, pela ordem do
 *     quadro corrente (opções novas `mostrarRank` e `tamanhoDoRank`).
 *
 * Campos: 1 dimensão de tempo (o eixo) + séries de um pivô, de uma
 * segunda dimensão ou de várias medidas.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { textoLegivelSobre } from '../../core/theme.js';
import { truncar } from '../../core/format.js';
import { corDoItem, lerContorno, aplicarContorno, aplicarPreenchimento } from '../../core/cores.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo, lerNumero } from '../../core/rotulos.js';
import { extrairMatriz, tratarNulos, opcaoDeOrigemDasSeries } from '../../core/series.js';
import { formatarData } from '../../core/format.js';
import {
  CSS_ANIMACAO,
  opcoesDeAnimacao,
  criarControleDeTempo,
  pararAnimacao,
  notaDeMenosMovimento,
} from '../_animacao/index.js';
import {
  montarOpcoes,
  comDefaults,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.bc-raiz{position:relative;width:100%;height:100%;display:flex;flex-direction:column;}
.bc-pista{flex:1 1 auto;position:relative;overflow:hidden;}
.bc-barra{position:absolute;left:0;display:flex;align-items:center;gap:6px;}
.bc-nome{flex:0 0 auto;text-align:right;overflow:hidden;white-space:nowrap;}
.bc-retangulo{flex:0 0 auto;border-radius:2px;height:100%;}
.bc-valor{flex:0 0 auto;white-space:nowrap;font-variant-numeric:tabular-nums;}
.bc-rank{flex:0 0 auto;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;}
.bc-grade{position:absolute;top:0;bottom:0;width:1px;pointer-events:none;}
.bc-nota{flex:0 0 auto;padding:2px 8px 4px;font-size:10px;opacity:.75;}
`;

/** Acima disso as barras ficam com menos de 10 px e nada é seguível. */
const MAXIMO_DE_BARRAS = 25;

export default defineViz({
  id: 'bar_race',
  label: 'Bar Chart Race',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      opcoesDeAnimacao({ secao: 'Corrida' }),
      {
        barrasVisiveis: {
          type: 'number',
          label: 'Quantas barras mostrar',
          section: 'Corrida',
          display: 'range',
          min: 3,
          max: MAXIMO_DE_BARRAS,
          step: 1,
          default: 10,
        },
        escalaFixa: {
          type: 'boolean',
          label: 'Escala fixa (o maior valor de TODOS os períodos)',
          section: 'Corrida',
          default: false,
        },
        alturaDaBarra: {
          type: 'number',
          label: 'Altura de cada barra (px, 0 = divide o espaço)',
          section: 'Formato',
          display: 'number',
          default: 0,
        },
        larguraDoNome: {
          type: 'number',
          label: 'Largura da coluna de nomes (px)',
          section: 'Formato',
          display: 'range',
          min: 60,
          max: 320,
          step: 10,
          default: 140,
        },
        // Novos (correções v2, seção 7): o número do rank em cada barra.
        mostrarRank: {
          type: 'boolean',
          label: 'Mostrar o número do rank (1, 2, 3…)',
          section: 'Corrida',
          default: true,
        },
        tamanhoDoRank: {
          type: 'number',
          label: 'Tamanho do número do rank (px, 0 = acompanha a barra)',
          section: 'Corrida',
          display: 'range',
          min: 0,
          max: 40,
          step: 1,
          default: 0,
        },
        // Novo (correções v2): guias verticais na cor da grade do tema.
        mostrarGrade: {
          type: 'boolean',
          label: 'Linhas de grade verticais',
          section: 'Formato',
          default: true,
        },
      }
    ),
    { limiteDeSeries: 60 }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },
  // O bar_race anima os quadros sozinho: a animação genérica (2.7) não entra.
  animacaoPropria: true,

  render(ctx) {
    const { modelo, config, tema, raiz } = ctx;

    const matriz = extrairMatriz(modelo, config);
    for (const aviso of matriz.avisos) ctx.avisar(aviso);

    if (matriz.categorias.length < 2 || matriz.series.length < 2) {
      ctx.mostrarVazio(
        'Uma corrida de barras precisa de vários períodos no eixo e de várias séries ' +
          '(de um pivô, de uma segunda dimensão ou de várias medidas).'
      );
      return;
    }

    const series = tratarNulos(matriz.series, 'manter');
    const periodos = matriz.categorias;
    const visiveis = Math.max(3, Math.min(MAXIMO_DE_BARRAS, Number(config.barrasVisiveis) || 10));

    if (series.length > visiveis) {
      ctx.avisar(
        `A consulta tem ${series.length} séries e a corrida mostra ${visiveis} por vez: ` +
          'as demais entram e saem conforme sobem no ranking.'
      );
    }

    const quadros = periodos.map((_, i) => quadroDoPeriodo({ series, periodo: i }));
    const maiorDeTodos = Math.max(
      ...quadros.flatMap((q) => q.map((item) => item.valor)),
      0
    );

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_ANIMACAO + CSS, 'bc');
    const caixa = criarEl('div', { classe: 'bc-raiz', pai: raiz });

    // Rótulos: lidos a cada desenho (o config chega normalizado).
    const rot = lerRotulos(config, tema);
    const valueFormat = matriz.medida && matriz.medida.valueFormat;
    const ehData = !!(matriz.campoDaCategoria && matriz.campoDaCategoria.ehData);
    const rotuloDoPeriodo = (categoria) =>
      ehData ? formatarData(categoria.valorBruto, config.formatoDeData || 'auto') : categoria.rotulo;

    const pista = criarEl('div', { classe: 'bc-pista', pai: caixa });
    const nota = ctx.nota; // 5.1c: texto automático da nota
    nota.style.color = tema.textoSuave;

    // Aba Cores: a cor própria da série (chave antiga, sem sanitizar, e a
    // do corDoItem) ou a paleta na ordem escolhida ("Inverter").
    const cores = new Map();
    series.forEach((s, i) => {
      cores.set(s.chave, config[`cor_${s.chave}`] || corDoItem(config, i, s.chave));
    });
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });

    const larguraDoNome = Math.max(40, Number(config.larguraDoNome) || 140);
    const mostrarRank = config.mostrarRank !== false;
    const tamanhoDoRank = Math.max(0, lerNumero(config.tamanhoDoRank, 0));
    // A coluna do rank cabe "25" no tamanho escolhido (ou no da barra).
    const larguraDoRank = mostrarRank ? Math.max(18, Math.ceil((tamanhoDoRank || tema.tamanhoBase) * 1.4)) : 0;
    // Onde a barra começa: rank + espaço + nome + espaço (o gap do flex é 6).
    const inicioDaBarra = (mostrarRank ? larguraDoRank + 6 : 0) + larguraDoNome + 6;
    const barras = new Map();

    // Linhas de grade: criadas uma vez por desenho completo; cada quadro só
    // as reposiciona (a largura útil pode mudar com a pista).
    const fracoesDaGrade = [0.25, 0.5, 0.75, 1];
    const guias =
      config.mostrarGrade === false
        ? []
        : fracoesDaGrade.map(() => {
            const g = criarEl('div', { classe: 'bc-grade', pai: pista });
            g.setAttribute('data-grade', '1');
            g.style.background = tema.grade;
            return g;
          });

    const desenhar = (instante) => {
      const alturaDisponivel = Math.max(20, pista.clientHeight || ctx.altura - 60);
      const alturaPedida = Number(config.alturaDaBarra) || 0;
      const alturaDaBarra =
        alturaPedida > 0 ? alturaPedida : Math.max(8, alturaDisponivel / visiveis - 4);
      const passo = alturaDisponivel / visiveis;

      const quadro = interpolarQuadro({ quadros, tempo: instante });
      const maior = config.escalaFixa === true
        ? maiorDeTodos
        : Math.max(...quadro.map((item) => item.valor), 0) || 1;

      const larguraDaPista = Math.max(60, pista.clientWidth || ctx.largura);
      const larguraUtil = Math.max(20, larguraDaPista - inicioDaBarra - 64);
      guias.forEach((g, k) => {
        g.style.left = `${inicioDaBarra + fracoesDaGrade[k] * larguraUtil}px`;
      });
      // Total do quadro: base do "percentual" no conteúdo do rótulo.
      const totalDoQuadro = quadro.reduce((a, item) => a + item.valor, 0);

      const vistos = new Set();
      let rank = 0;
      for (const item of quadro) {
        if (item.posicao > visiveis - 0.5) continue;
        vistos.add(item.chave);
        // O quadro vem ordenado pela posição interpolada: o rank é a ordem
        // em que as barras aparecem agora, de cima para baixo.
        rank += 1;

        let barra = barras.get(item.chave);
        if (!barra) {
          barra = montarBarra({
            tema, config, rot, contorno, larguraDoNome, larguraDoRank, mostrarRank, tamanhoDoRank,
            cor: cores.get(item.chave),
          });
          pista.appendChild(barra.raiz);
          barras.set(item.chave, barra);
        }

        barra.raiz.style.top = `${item.posicao * passo}px`;
        barra.raiz.style.height = `${alturaDaBarra}px`;
        barra.raiz.style.fontSize = `${Math.max(9, Math.min(tema.tamanhoBase, alturaDaBarra - 6))}px`;
        barra.raiz.style.width = `${larguraDaPista}px`;
        const larguraDaBarra = Math.max(1, (item.valor / maior) * larguraUtil);
        barra.retangulo.style.width = `${larguraDaBarra}px`;
        definirTexto(barra.nome, truncar(item.rotulo, Math.max(5, Math.floor(larguraDoNome / 7))));
        barra.nome.title = item.rotulo;
        if (barra.rank) definirTexto(barra.rank, String(rank));
        if (rot.mostrar) {
          definirTexto(
            barra.valor,
            textoDoRotulo(rot, { valor: item.valor, nome: item.rotulo, total: totalDoQuadro, valueFormat })
          );
          posicionarValor(barra, rot, larguraDaBarra);
        }
      }

      // Quem saiu do top N sai do DOM: manter barras invisíveis acumularia
      // elementos a cada quadro.
      for (const [chave, barra] of barras) {
        if (vistos.has(chave)) continue;
        if (barra.raiz.parentNode) barra.raiz.parentNode.removeChild(barra.raiz);
        barras.delete(chave);
      }

    };

    // ---------- Relógio ----------
    const tempo = criarControleDeTempo({
      ctx,
      hospedeiro: caixa,
      quantidade: periodos.length,
      config,
      rotuloDoPeriodo: (i) => rotuloDoPeriodo(periodos[i]),
      aoQuadro: (t) => desenhar(t),
      chaveDoEstado: 'corrida',
    });
    // Os controles nascem no fim da caixa; aqui eles vão para o topo, que
    // é onde o usuário procura o play.
    caixa.insertBefore(tempo.controles, pista);

    tempo.controles.classList.add('bc-controles');
    tempo.botao.classList.add('bc-botao');
    tempo.barraDeTempo.classList.add('bc-tempo');
    tempo.rotulo.classList.add('bc-periodo');

    // ---------- Nota ----------
    definirTexto(
      nota,
      [
        `${series.length} séries · ${periodos.length} períodos · ${visiveis} barras por vez`,
        'a comparação só vale com o gráfico PARADO: o caminho entre dois períodos passa rápido demais para ser retido',
        config.escalaFixa === true
          ? 'escala fixa: as larguras são comparáveis entre períodos'
          : 'ATENÇÃO: a escala acompanha o maior do período — as larguras NÃO são comparáveis entre períodos',
        notaDeMenosMovimento(tempo.menosMovimento),
      ]
        .filter(Boolean)
        .join(' · ')
    );

    tempo.iniciar();
  },

  aoDestruir({ estado }) {
    pararAnimacao(estado, 'corrida');
  },
});

/* ------------------------------------------------------------------ */

function montarBarra({
  tema, config, rot, contorno, larguraDoNome, larguraDoRank, mostrarRank, tamanhoDoRank, cor,
}) {
  const raiz = document.createElement('div');
  raiz.className = 'bc-barra';

  // Número do rank (texto atualizado a cada quadro).
  let rank = null;
  if (mostrarRank) {
    rank = document.createElement('div');
    rank.className = 'bc-rank';
    rank.style.width = `${larguraDoRank}px`;
    rank.style.color = tema.textoSuave;
    if (tamanhoDoRank > 0) rank.style.fontSize = `${tamanhoDoRank}px`;
    raiz.appendChild(rank);
  }

  const nome = document.createElement('div');
  nome.className = 'bc-nome';
  nome.style.width = `${larguraDoNome}px`;
  nome.style.color = tema.texto;
  raiz.appendChild(nome);

  const retangulo = document.createElement('div');
  retangulo.className = 'bc-retangulo';
  aplicarPreenchimento(retangulo, cor, config);
  aplicarContorno(retangulo, contorno);
  raiz.appendChild(retangulo);

  // Rótulo do valor: estilo aplicado UMA vez (a função única acrescenta a
  // rotação ao transform; cada quadro só troca o texto e o deslocamento).
  const valor = document.createElement('div');
  valor.className = 'bc-valor';
  if (rot.mostrar) {
    const posicao = rot.posicao === 'dentro' || rot.posicao === 'centro' ? rot.posicao : 'fora';
    valor.dataset.posicao = posicao;
    estilizarRotulo(valor, rot, {
      corAutomatica: posicao === 'fora' ? tema.textoSuave : textoLegivelSobre(cor, tema),
    });
    valor.style.transform = '';
  } else {
    valor.style.display = 'none';
  }
  raiz.appendChild(valor);

  return { raiz, rank, nome, retangulo, valor, cor };
}

/**
 * Desloca o rótulo do valor conforme a posição: "fora" fica depois da
 * barra (o fluxo normal do flex); "dentro" volta para dentro da ponta;
 * "centro" vai para o meio da barra. A rotação do painel vem por último.
 */
function posicionarValor(barra, rot, larguraDaBarra) {
  const posicao = barra.valor.dataset.posicao;
  let base = '';
  if (posicao === 'dentro') base = 'translateX(calc(-100% - 10px))';
  else if (posicao === 'centro') base = `translateX(calc(-50% - ${larguraDaBarra / 2 + 6}px))`;
  const giro = rot.rotacao ? `rotate(${rot.rotacao}deg)` : '';
  barra.valor.style.transform = `${base} ${giro}`.trim();
}

/**
 * Valores e posições de um período, já ordenados.
 *
 * Séries sem valor no período ficam de fora — e, por não terem posição,
 * simplesmente não aparecem naquele quadro. Tratá-las como zero as
 * colocaria no fim do ranking, afirmando que o valor é zero quando o que
 * se sabe é que não se sabe.
 *
 * @returns {Array<{chave, rotulo, valor, posicao}>}
 */
export function quadroDoPeriodo({ series, periodo }) {
  const itens = [];
  for (const s of series) {
    const valor = s.valores[periodo];
    if (valor === null || !Number.isFinite(valor)) continue;
    itens.push({ chave: s.chave, rotulo: s.rotulo, valor });
  }
  itens.sort((a, b) => (b.valor - a.valor) || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  itens.forEach((item, i) => {
    item.posicao = i;
  });
  return itens;
}

/**
 * Quadro intermediário entre dois períodos.
 *
 * Interpola **valor e posição** — e é a posição que importa: interpolar só
 * o valor e reordenar a cada quadro faria as barras TELETRANSPORTAREM
 * quando duas se cruzassem, que é exatamente o movimento que o gráfico
 * existe para mostrar.
 *
 * Uma série que existe só num dos dois períodos entra/sai pela borda: a
 * posição ausente vira "logo abaixo da última", para a barra deslizar para
 * dentro em vez de aparecer do nada no meio da pista.
 *
 * @param {{quadros: Array, tempo: number}} params `tempo` é fracionário
 * @returns {Array<{chave, rotulo, valor, posicao}>}
 */
export function interpolarQuadro({ quadros, tempo }) {
  const ultimo = quadros.length - 1;
  const t = Math.max(0, Math.min(ultimo, tempo));
  const de = Math.floor(t);
  const ate = Math.min(ultimo, de + 1);
  const fracao = t - de;

  const anterior = new Map(quadros[de].map((item) => [item.chave, item]));
  const proximo = new Map(quadros[ate].map((item) => [item.chave, item]));

  const foraDoAnterior = quadros[de].length;
  const foraDoProximo = quadros[ate].length;

  const chaves = new Set([...anterior.keys(), ...proximo.keys()]);
  const saida = [];

  for (const chave of chaves) {
    const a = anterior.get(chave);
    const b = proximo.get(chave);
    const referencia = a || b;

    const valorA = a ? a.valor : 0;
    const valorB = b ? b.valor : 0;
    const posicaoA = a ? a.posicao : foraDoAnterior;
    const posicaoB = b ? b.posicao : foraDoProximo;

    saida.push({
      chave,
      rotulo: referencia.rotulo,
      valor: valorA + (valorB - valorA) * fracao,
      posicao: posicaoA + (posicaoB - posicaoA) * fracao,
    });
  }

  saida.sort((x, y) => x.posicao - y.posicao);
  return saida;
}
