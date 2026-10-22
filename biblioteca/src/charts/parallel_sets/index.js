/**
 * parallel_sets — "Conjuntos Paralelos".
 *
 * Como a população se reparte a cada passo: uma coluna por dimensão,
 * blocos proporcionais a cada categoria e fitas ligando as combinações.
 * É o gráfico para "dos clientes da região Sul, quantos compraram por
 * aplicativo e, desses, quantos voltaram?".
 *
 * Duas regras estruturais, e as duas têm teste:
 *
 * 1. **Conservação.** A soma das fitas que saem de uma categoria é igual
 *    ao tamanho da categoria. Se não for, algum caso sumiu ou foi contado
 *    duas vezes — e o desenho continua bonito, porque fita nenhuma fica
 *    visivelmente "sobrando".
 * 2. **Só se vê relação entre colunas VIZINHAS.** Como nas coordenadas
 *    paralelas: duas dimensões nas pontas podem ter relação fortíssima
 *    sem que nada apareça. A ordem das colunas é declarada e pode ser
 *    trocada.
 *
 * E a praga do gênero é o espaguete: com as categorias em ordem
 * arbitrária, as fitas se cruzam tanto que nada se segue. A ordenação
 * automática por baricentro — a mesma heurística dos grafos em camadas —
 * reduz os cruzamentos, e o gráfico diz que a ordem é automática.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { larguraAproximada } from '../../core/eixos.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.ps-area{position:relative;width:100%;height:100%;overflow:hidden;}
.ps-svg{position:absolute;left:0;top:0;}
.ps-fita{cursor:default;}
.ps-bloco{cursor:default;}
.ps-rotulo{pointer-events:none;}
.ps-titulo{pointer-events:none;font-weight:600;}
.ps-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso não sobra largura entre as colunas para a fita ser seguida. */
const MAXIMO_DE_DIMENSOES = 5;

/** Acima disso os blocos ficam mais finos que o rótulo. */
const MAXIMO_DE_CATEGORIAS = 12;

export default defineViz({
  id: 'parallel_sets',
  label: 'Conjuntos Paralelos',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        maximoDeCategorias: {
          type: 'number',
          label: 'Máximo de categorias por coluna (o resto vira "Outros")',
          section: 'Conjuntos',
          display: 'range',
          min: 2,
          max: MAXIMO_DE_CATEGORIAS,
          step: 1,
          default: 8,
        },
        ordemDasCategorias: {
          type: 'string',
          label: 'Ordem das categorias em cada coluna',
          section: 'Conjuntos',
          display: 'select',
          default: 'baricentro',
          values: listaDeValores([
            { rotulo: 'Automática: menos cruzamentos (baricentro)', valor: 'baricentro' },
            { rotulo: 'Pelo tamanho (maior em cima)', valor: 'tamanho' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
          ]),
        },
        corDaFita: {
          type: 'string',
          label: 'Colorir as fitas pela',
          section: 'Cor',
          display: 'select',
          default: 'origem',
          values: listaDeValores([
            { rotulo: 'Categoria de origem', valor: 'origem' },
            { rotulo: 'Categoria de destino', valor: 'destino' },
            { rotulo: 'Cor única', valor: 'unica' },
          ]),
        },
        opacidadeDaFita: {
          type: 'number',
          label: 'Opacidade das fitas',
          section: 'Cor',
          display: 'range',
          min: 0.1,
          max: 1,
          step: 0.05,
          default: 0.45,
        },
        espacoEntreBlocos: {
          type: 'number',
          label: 'Espaço entre blocos (px)',
          section: 'Formato',
          display: 'range',
          min: 0,
          max: 20,
          step: 1,
          default: 6,
        },
        escreverPercentual: {
          type: 'boolean',
          label: 'Escrever o percentual de cada categoria',
          section: 'Rótulos',
          default: true,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    for (const dimensao of modelo.dimensoes) {
      saida[`usar_${dimensao.nome}`] = {
        type: 'boolean',
        label: `Incluir "${dimensao.rotuloCurto}"`,
        section: 'Dimensões',
        default: true,
      };
    }
    if (modelo.medidas.length) {
      saida.campoDoValor = {
        type: 'string',
        label: 'Medida da largura (vazio = contagem de linhas)',
        section: 'Dados',
        display: 'select',
        default: '',
        values: [{ '(contagem de linhas)': '' }].concat(
          modelo.medidas.map((m) => ({ [m.rotuloCurto]: m.nome }))
        ),
      };
    }
    return saida;
  },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const leitura = lerConjuntos(ctx);
    if (leitura.erro) {
      ctx.mostrarVazio(leitura.erro);
      return;
    }
    const { eixos, ligacoes, total, medida, campos } = leitura;

    ordenarCategorias({ eixos, ligacoes, modo: config.ordemDasCategorias });

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'ps');
    const area = criarEl('div', { classe: 'ps-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = medida
      ? formatadorDeValueFormat(medida.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 })
      : (v) => Math.round(v).toLocaleString('pt-BR');

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const margemDeCima = fonte + 16;
    const margemDeBaixo = 18;
    const larguraDoBloco = 14;
    const margemLateral = Math.min(
      largura * 0.16,
      Math.max(
        40,
        eixos.reduce(
          (a, eixo) =>
            Math.max(a, ...eixo.categorias.map((c) => larguraAproximada(truncar(c.rotulo, 16), fonte))),
          0
        ) + 10
      )
    );

    const alturaUtil = Math.max(40, altura - margemDeCima - margemDeBaixo);
    const espaco = Number(config.espacoEntreBlocos) || 0;
    const passoX =
      eixos.length > 1
        ? (largura - margemLateral * 2 - larguraDoBloco) / (eixos.length - 1)
        : 0;

    // Cada eixo recebe a MESMA altura total: é o que faz os blocos de
    // colunas diferentes serem comparáveis entre si.
    for (let e = 0; e < eixos.length; e++) {
      const eixo = eixos[e];
      const alturaDosEspacos = espaco * Math.max(0, eixo.categorias.length - 1);
      const alturaParaBlocos = Math.max(10, alturaUtil - alturaDosEspacos);
      let y = margemDeCima;
      eixo.x = margemLateral + e * passoX;
      for (const categoria of eixo.categorias) {
        categoria.altura = total > 0 ? (categoria.valor / total) * alturaParaBlocos : 0;
        categoria.y = y;
        categoria.cursorDeSaida = y;
        categoria.cursorDeEntrada = y;
        y += categoria.altura + espaco;
      }
    }

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'ps-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Cores ----------
    const paleta = coresDaPaleta(config.paleta);
    eixos.forEach((eixo) => {
      eixo.categorias.forEach((categoria, i) => {
        categoria.cor = paleta[i % paleta.length];
      });
    });
    const corUnica = paleta[0];
    const modoDaCor = config.corDaFita || 'origem';
    const opacidade = Number(config.opacidadeDaFita) || 0.45;

    // ---------- Fitas ----------
    const fitas = [];
    for (let e = 0; e < ligacoes.length; e++) {
      const esquerda = eixos[e];
      const direita = eixos[e + 1];

      // As fitas saem na ORDEM das categorias do destino (e chegam na
      // ordem da origem): é o que as empilha sem se cruzarem dentro do
      // próprio bloco.
      const ordenadas = ligacoes[e].slice().sort((a, b) => {
        const pa = esquerda.indicePorChave.get(a.de) - esquerda.indicePorChave.get(b.de);
        if (pa !== 0) return pa;
        return direita.indicePorChave.get(a.para) - direita.indicePorChave.get(b.para);
      });

      for (const ligacao of ordenadas) {
        const de = esquerda.categorias[esquerda.indicePorChave.get(ligacao.de)];
        const para = direita.categorias[direita.indicePorChave.get(ligacao.para)];
        if (!de || !para) continue;

        const espessura = total > 0 ? (ligacao.valor / total) * (alturaUtil - espaco * Math.max(0, esquerda.categorias.length - 1)) : 0;
        const y1 = de.cursorDeSaida;
        const y2 = para.cursorDeEntrada;
        de.cursorDeSaida += espessura;
        para.cursorDeEntrada += espessura;

        const cor =
          modoDaCor === 'unica' ? corUnica : modoDaCor === 'destino' ? para.cor : de.cor;

        const caminho = criarSvgEl('path', {
          pai: svg,
          classe: 'ps-fita',
          atributos: {
            d: caminhoDaFita({
              x1: esquerda.x + larguraDoBloco,
              x2: direita.x,
              y1,
              y2,
              espessura,
            }),
            fill: cor,
            opacity: opacidade,
          },
        });
        fitas.push({ elemento: caminho, ligacao, de, para, eixo: e, cor });
      }
    }

    // ---------- Blocos ----------
    eixos.forEach((eixo, e) => {
      const titulo = criarSvgEl('text', {
        pai: svg,
        classe: 'ps-titulo',
        atributos: {
          x: eixo.x + larguraDoBloco / 2,
          y: fonte + 2,
          'text-anchor': e === 0 ? 'start' : e === eixos.length - 1 ? 'end' : 'middle',
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      definirTexto(titulo, truncar(campos[e].rotuloCurto, 20));

      for (const categoria of eixo.categorias) {
        criarSvgEl('rect', {
          pai: svg,
          classe: 'ps-bloco',
          atributos: {
            x: eixo.x,
            y: categoria.y,
            width: larguraDoBloco,
            height: Math.max(1, categoria.altura),
            fill: categoria.cor,
            'data-eixo': String(e),
            'data-chave': categoria.chave,
          },
        });

        if (categoria.altura >= fonte) {
          const naEsquerda = e === 0;
          const texto = criarSvgEl('text', {
            pai: svg,
            classe: 'ps-rotulo',
            atributos: {
              x: naEsquerda ? eixo.x - 5 : eixo.x + larguraDoBloco + 5,
              y: categoria.y + categoria.altura / 2,
              'text-anchor': naEsquerda ? 'end' : 'start',
              'dominant-baseline': 'central',
              'font-size': fonte,
              fill: tema.texto,
            },
          });
          const percentual =
            config.escreverPercentual !== false && total > 0
              ? ` ${formatarPercentual(categoria.valor / total, 0)}`
              : '';
          definirTexto(texto, `${truncar(categoria.rotulo, 16)}${percentual}`);
        }
      }
    });

    // ---------- Nota ----------
    const cruzamentos = ligacoes.reduce(
      (a, lista, e) => a + contarCruzamentos(lista, eixos[e], eixos[e + 1]),
      0
    );
    const nota = criarEl('div', { classe: 'ps-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${eixos.length} colunas · ${formatar(total)} no total`,
        medida ? `largura por ${medida.rotuloCurto}` : 'largura por contagem de linhas',
        `ordem ${nomeDaOrdem(config.ordemDasCategorias)}`,
        `${cruzamentos} cruzamento(s) de fitas`,
        'só se vê relação entre colunas VIZINHAS',
      ].join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    for (const fita of fitas) {
      ctx.eventos.on(fita.elemento, 'pointerenter', (ev) => {
        fita.elemento.setAttribute('opacity', Math.min(1, opacidade + 0.35));
        if (!tooltip) return;
        tooltip.mostrar(
          {
            titulo: `${fita.de.rotulo} → ${fita.para.rotulo}`,
            linhas: [
              { rotulo: campos[fita.eixo].rotuloCurto, valor: fita.de.rotulo, cor: fita.cor },
              { rotulo: campos[fita.eixo + 1].rotuloCurto, valor: fita.para.rotulo },
              { rotulo: medida ? medida.rotuloCurto : 'Linhas', valor: formatar(fita.ligacao.valor) },
              { rotulo: 'Do total', valor: formatarPercentual(fita.ligacao.valor / total, 1) },
              {
                rotulo: `De "${truncar(fita.de.rotulo, 14)}"`,
                valor: formatarPercentual(fita.ligacao.valor / (fita.de.valor || 1), 1),
              },
            ],
          },
          ev.clientX,
          ev.clientY
        );
      });
      ctx.eventos.on(fita.elemento, 'pointerleave', () => {
        fita.elemento.setAttribute('opacity', opacidade);
        if (tooltip) tooltip.esconder();
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function nomeDaOrdem(modo) {
  if (modo === 'tamanho') return 'pelo tamanho';
  if (modo === 'alfabetica') return 'alfabética';
  return 'automática (menos cruzamentos)';
}

/** Fita como banda de Bézier entre duas pilhas. */
export function caminhoDaFita({ x1, x2, y1, y2, espessura }) {
  const meio = (x1 + x2) / 2;
  const h = Math.max(0.5, espessura);
  return [
    `M${x1},${y1}`,
    `C${meio},${y1} ${meio},${y2} ${x2},${y2}`,
    `L${x2},${y2 + h}`,
    `C${meio},${y2 + h} ${meio},${y1 + h} ${x1},${y1 + h}`,
    'Z',
  ].join('');
}

/**
 * Lê as colunas e as ligações entre colunas vizinhas.
 *
 * Categorias pequenas viram "Outros" **preservando o total** — a mesma
 * regra do `pareto` e do `treemap_carteira`: jogar fora o resto faria as
 * proporções mentirem sobre um todo que não existe.
 *
 * @returns {{eixos, ligacoes, total, medida, campos}|{erro}}
 */
export function lerConjuntos(ctx) {
  const { modelo, config } = ctx;

  let campos = modelo.dimensoes.filter((d) => config[`usar_${d.nome}`] !== false);
  if (campos.length < 2) campos = modelo.dimensoes.slice();
  if (campos.length < 2) {
    return {
      erro:
        'Conjuntos paralelos precisam de pelo menos DUAS dimensões — uma coluna para cada. ' +
        'Traga mais dimensões no Explore.',
    };
  }
  if (campos.length > MAXIMO_DE_DIMENSOES) {
    ctx.avisar(
      `A consulta tem ${campos.length} dimensões. Mostrando as ${MAXIMO_DE_DIMENSOES} primeiras: ` +
        'acima disso não sobra largura entre as colunas para a fita ser seguida.'
    );
    campos = campos.slice(0, MAXIMO_DE_DIMENSOES);
  }

  const medida = config.campoDoValor
    ? modelo.medidas.find((m) => m.nome === config.campoDoValor) || null
    : null;

  const valorDaLinha = (linha) => {
    if (!medida) return 1;
    const v = modelo.valorNumerico(linha, medida.nome);
    return v === null || !Number.isFinite(v) || v < 0 ? 0 : v;
  };

  // --- Totais por categoria em cada coluna ---
  const brutos = campos.map(() => new Map());
  let total = 0;
  for (const linha of modelo.linhas) {
    const valor = valorDaLinha(linha);
    if (!(valor > 0)) continue;
    total += valor;
    campos.forEach((campo, e) => {
      const chave = String(modelo.valorBruto(linha, campo.nome));
      const atual = brutos[e].get(chave);
      if (atual) atual.valor += valor;
      else {
        brutos[e].set(chave, {
          chave,
          rotulo: modelo.texto(linha, campo.nome, undefined, '∅'),
          valor,
        });
      }
    });
  }

  if (!(total > 0)) {
    return {
      erro: medida
        ? 'Nenhuma linha tem valor positivo na medida escolhida. Fitas de largura zero não desenham nada.'
        : 'A consulta não trouxe linhas para repartir.',
    };
  }

  const limite = Math.max(2, Math.min(MAXIMO_DE_CATEGORIAS, Number(config.maximoDeCategorias) || 8));
  const mapaParaChave = campos.map(() => new Map());

  const eixos = brutos.map((mapa, e) => {
    const lista = Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
    let categorias = lista;

    if (lista.length > limite) {
      const mantidas = lista.slice(0, limite - 1);
      const resto = lista.slice(limite - 1);
      const outros = {
        chave: '__outros__',
        rotulo: `Outros (${resto.length})`,
        valor: resto.reduce((a, c) => a + c.valor, 0),
        ehOutros: true,
      };
      categorias = mantidas.concat([outros]);
      for (const c of resto) mapaParaChave[e].set(c.chave, '__outros__');
      ctx.avisar(
        `"${campos[e].rotuloCurto}" tem ${lista.length} categorias; as ${resto.length} menores ` +
          'foram somadas em "Outros" (o total é preservado).'
      );
    }

    const indicePorChave = new Map(categorias.map((c, i) => [c.chave, i]));
    return { campo: campos[e], categorias, indicePorChave };
  });

  const chaveNoEixo = (e, chaveBruta) => mapaParaChave[e].get(chaveBruta) || chaveBruta;

  // --- Ligações entre colunas vizinhas ---
  const ligacoes = [];
  for (let e = 0; e < campos.length - 1; e++) {
    const mapa = new Map();
    for (const linha of modelo.linhas) {
      const valor = valorDaLinha(linha);
      if (!(valor > 0)) continue;
      const de = chaveNoEixo(e, String(modelo.valorBruto(linha, campos[e].nome)));
      const para = chaveNoEixo(e + 1, String(modelo.valorBruto(linha, campos[e + 1].nome)));
      const chave = `${de} ${para}`;
      const atual = mapa.get(chave);
      if (atual) atual.valor += valor;
      else mapa.set(chave, { de, para, valor });
    }
    ligacoes.push(Array.from(mapa.values()));
  }

  return { eixos, ligacoes, total, medida, campos };
}

/**
 * Ordena as categorias de cada coluna.
 *
 * O baricentro é a heurística clássica dos grafos em camadas: cada
 * categoria vai para a média ponderada das posições com que ela se liga na
 * coluna anterior. Passadas sucessivas (ida e volta) reduzem os
 * cruzamentos — não ao mínimo (o problema é NP-difícil), mas o bastante
 * para o gráfico deixar de ser espaguete.
 */
export function ordenarCategorias({ eixos, ligacoes, modo = 'baricentro' }) {
  const reindexar = (eixo) => {
    eixo.indicePorChave = new Map(eixo.categorias.map((c, i) => [c.chave, i]));
  };

  if (modo === 'alfabetica') {
    for (const eixo of eixos) {
      eixo.categorias.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
      reindexar(eixo);
    }
    return eixos;
  }

  // Tamanho é o ponto de partida dos dois modos: o baricentro só refina.
  for (const eixo of eixos) {
    eixo.categorias.sort((a, b) => b.valor - a.valor);
    reindexar(eixo);
  }
  if (modo === 'tamanho') return eixos;

  const pesos = (lista, chaveDoLado, chaveDoOutro, outroEixo) => {
    const soma = new Map();
    for (const ligacao of lista) {
      const posicao = outroEixo.indicePorChave.get(ligacao[chaveDoOutro]);
      if (posicao === undefined) continue;
      const atual = soma.get(ligacao[chaveDoLado]) || { peso: 0, valor: 0 };
      atual.peso += posicao * ligacao.valor;
      atual.valor += ligacao.valor;
      soma.set(ligacao[chaveDoLado], atual);
    }
    return soma;
  };

  for (let passada = 0; passada < 4; passada++) {
    // Ida: ordena cada coluna pela posição na anterior.
    for (let e = 1; e < eixos.length; e++) {
      const soma = pesos(ligacoes[e - 1], 'para', 'de', eixos[e - 1]);
      eixos[e].categorias.sort((a, b) => baricentroDe(soma, a) - baricentroDe(soma, b));
      reindexar(eixos[e]);
    }
    // Volta: ordena cada coluna pela posição na seguinte.
    for (let e = eixos.length - 2; e >= 0; e--) {
      const soma = pesos(ligacoes[e], 'de', 'para', eixos[e + 1]);
      eixos[e].categorias.sort((a, b) => baricentroDe(soma, a) - baricentroDe(soma, b));
      reindexar(eixos[e]);
    }
  }

  return eixos;
}

function baricentroDe(soma, categoria) {
  const item = soma.get(categoria.chave);
  // Categoria sem ligação nenhuma vai para o fim, não para o começo: ela
  // não tem posição preferida e não deve empurrar quem tem.
  if (!item || !(item.valor > 0)) return Infinity;
  return item.peso / item.valor;
}

/**
 * Quantos pares de fitas se cruzam entre duas colunas.
 *
 * Duas fitas (a→b) e (c→d) se cruzam quando a ordem de a e c numa coluna é
 * o inverso da ordem de b e d na outra. É a métrica que a ordenação por
 * baricentro tenta reduzir, e serve para o gráfico informar — e para o
 * teste provar que a heurística funciona.
 */
export function contarCruzamentos(lista, eixoEsquerdo, eixoDireito) {
  let conta = 0;
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i];
      const b = lista[j];
      const da = eixoEsquerdo.indicePorChave.get(a.de);
      const db = eixoEsquerdo.indicePorChave.get(b.de);
      const pa = eixoDireito.indicePorChave.get(a.para);
      const pb = eixoDireito.indicePorChave.get(b.para);
      if (da === undefined || db === undefined || pa === undefined || pb === undefined) continue;
      if ((da - db) * (pa - pb) < 0) conta += 1;
    }
  }
  return conta;
}
