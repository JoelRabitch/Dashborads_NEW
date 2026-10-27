/**
 * marimekko — "Marimekko".
 *
 * Barras empilhadas em que a LARGURA de cada coluna também é proporcional
 * a um total: duas dimensões codificadas em área. Responde "este segmento
 * é grande, e dentro dele a composição é esta" num desenho só.
 *
 * **E é aí que mora o perigo.** A área de cada retângulo é o produto de
 * duas proporções, e o olho compara áreas muito mal quando as formas têm
 * proporções diferentes: um retângulo alto e fino contra um baixo e largo
 * de mesma área são lidos como tamanhos diferentes. Então a nota diz o
 * que É confiável comparar:
 *
 * - **alturas dentro da MESMA coluna** (mesma largura, comparação direta);
 * - **larguras entre colunas** (mesma altura total);
 * - áreas de retângulos distantes, não.
 *
 * Duas conservações sustentam o desenho e estão testadas: a soma das
 * larguras é 100%, e dentro de cada coluna a soma das alturas é 100%.
 *
 * Correções v2 (rótulos, aba Cores, tooltip):
 *   - os textos dos blocos e o peso das colunas passam pela função única de
 *     rótulos (`rotulos.js`): "Mostrar rótulos" esconde os dois; tamanho,
 *     cor, negrito, rotação, casas, formato, truncar e "esconder
 *     sobrepostos" (ligado: só escreve no bloco onde cabe) valem. Conteúdo
 *     do bloco: "Valor" (padrão) e "Percentual" = a fatia DENTRO da coluna,
 *     como sempre foi; "Valor e percentual" = valor da medida (fatia);
 *     "Nome" = a série; "Nome e valor" = série: fatia. As opções próprias
 *     "Escrever o percentual dentro do bloco" e "Escrever o peso de cada
 *     coluna" continuam ligando/desligando cada texto;
 *   - aba Cores: paleta com "Inverter ordem das cores", opacidade e contorno
 *     (cor no padrão = "Cor da borda" do tema ou o fundo);
 *   - tooltip único do gráfico (valor da medida no formato do campo, ou o
 *     texto do Looker quando o bloco vem de uma linha) e clique pela "Ação
 *     do clique": drill quando a célula tem links, senão fixa o tooltip.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { textoLegivelSobre } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo, larguraDoTexto, lerTexto } from '../../core/rotulos.js';
import { corDoItem, lerContorno, aplicarContorno, aplicarPreenchimento } from '../../core/cores.js';
import { desenharLegenda, criarLayoutComLegenda } from '../../core/legend.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeCores,
  blocoDeLegenda,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.mk-area{position:relative;width:100%;height:100%;overflow:hidden;}
.mk-svg{position:absolute;left:0;top:0;}
.mk-bloco{cursor:default;}
.mk-rotulo{pointer-events:none;}
.mk-coluna{pointer-events:none;font-weight:600;}
.mk-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso a coluna fica mais estreita que o próprio nome. */
const MAXIMO_DE_COLUNAS = 20;

/** Acima disso a legenda não cabe e as cores deixam de ser distinguíveis. */
const MAXIMO_DE_SERIES = 12;

export default defineViz({
  id: 'marimekko',
  label: 'Marimekko',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeLegenda(),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        maximoDeColunas: {
          type: 'number',
          label: 'Máximo de colunas (o resto vira "Outros")',
          section: 'Marimekko',
          display: 'range',
          min: 2,
          max: MAXIMO_DE_COLUNAS,
          step: 1,
          default: 10,
        },
        maximoDeSeries: {
          type: 'number',
          label: 'Máximo de séries empilhadas (o resto vira "Outros")',
          section: 'Marimekko',
          display: 'range',
          min: 2,
          max: MAXIMO_DE_SERIES,
          step: 1,
          default: 6,
        },
        ordemDasColunas: {
          type: 'string',
          label: 'Ordem das colunas',
          section: 'Marimekko',
          display: 'select',
          default: 'tamanho',
          values: listaDeValores([
            { rotulo: 'Pela largura (maior primeiro)', valor: 'tamanho' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
          ]),
        },
        espacoEntreColunas: {
          type: 'number',
          label: 'Espaço entre colunas (px)',
          section: 'Marimekko',
          display: 'range',
          min: 0,
          max: 12,
          step: 1,
          default: 2,
        },
        escreverPercentuais: {
          type: 'boolean',
          label: 'Escrever o percentual dentro do bloco',
          section: 'Rótulos',
          default: true,
        },
        escreverLarguras: {
          type: 'boolean',
          label: 'Escrever o peso de cada coluna no topo',
          section: 'Rótulos',
          default: true,
        },
      }
    ),
    { mostrarLegenda: true, mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 2, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length >= 2) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaColuna', 'Dimensão das colunas (a largura)', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        }),
        opcaoDeEscolhaDeCampo('campoDaSerie', 'Dimensão empilhada (a altura)', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[1].nome,
        })
      );
    }
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoValor', 'Medida', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { config, tema, raiz } = ctx;

    const leitura = lerMatriz(ctx);
    if (leitura.erro) {
      ctx.mostrarVazio(leitura.erro);
      return;
    }
    const { colunas, series, total, medida, campoDaColuna, campoDaSerie } = leitura;

    // ---------- Cena ----------
    const comLegenda = config.mostrarLegenda !== false;
    let hospedeiro = raiz;
    let areaLegenda = null;
    if (comLegenda) {
      const layout = criarLayoutComLegenda(raiz, config);
      hospedeiro = layout.areaGrafico;
      areaLegenda = layout.areaLegenda;
    } else {
      ctx.limparRaiz();
    }
    injetarEstilo(raiz, CSS, 'mk');

    const largura = Math.max(80, hospedeiro.clientWidth || ctx.largura);
    const altura = Math.max(80, hospedeiro.clientHeight || ctx.altura);
    const area = criarEl('div', { classe: 'mk-area', pai: hospedeiro });

    // ---------- Rótulos (função única) ----------
    const rot = lerRotulos(config, tema);
    // Números derivados (somas) no formato do campo; nunca o número cru.
    const formatar = formatadorDeValueFormat(medida.valueFormat, { casas: rot.casas });
    const textoDoBloco = (serie, valor, fracao, textoDoValor) => {
      const pct = formatarPercentual(fracao, rot.casas);
      const base = rot.truncar > 0 ? (t) => truncar(t, rot.truncar) : (t) => t;
      switch (rot.conteudo) {
        case 'nome':
          return base(serie.rotulo);
        case 'nomeValor':
          return base(`${serie.rotulo}: ${pct}`);
        case 'valorPercentual':
          return textoDoRotulo(rot, { valor, percentual: fracao, valueFormat: medida.valueFormat, textoDoValor });
        case 'percentual':
        case 'valor':
        default:
          // No Marimekko, o "valor" escrito no bloco sempre foi a fatia
          // dentro da coluna (a altura do bloco).
          return base(pct);
      }
    };
    const comTextoNoBloco = rot.mostrar && config.escreverPercentuais !== false;
    const comPesoDaColuna = rot.mostrar && config.escreverLarguras !== false;
    const tamanhoDoPeso = Math.max(7, rot.tamanho - 1);

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const margemDeCima = fonte + 16;
    const margemDeBaixo = Math.max(fonte, comPesoDaColuna ? tamanhoDoPeso : 0) + 14;
    const margemLateral = 8;
    const espaco = Math.max(0, Number(config.espacoEntreColunas) || 0);

    const larguraUtil = Math.max(20, largura - margemLateral * 2 - espaco * (colunas.length - 1));
    const alturaUtil = Math.max(20, altura - margemDeCima - margemDeBaixo);

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'mk-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Cores (aba Cores) ----------
    // Cor própria da série (`cor_<chave>`, só via JSON hoje) ou a paleta,
    // respeitando "Inverter ordem das cores".
    series.forEach((serie, i) => {
      serie.cor = lerTexto(config[`cor_${serie.chave}`], '') || corDoItem(config, i, serie.chave);
    });
    const corPorSerie = new Map(series.map((s) => [s.chave, s.cor]));
    const contorno = contornoDasMarcas(config, tema);

    // ---------- Blocos ----------
    const blocos = [];
    let x = margemLateral;

    for (const coluna of colunas) {
      coluna.largura = (coluna.total / total) * larguraUtil;
      coluna.x = x;

      let y = margemDeCima;
      for (const serie of series) {
        const valor = coluna.porSerie.get(serie.chave) || 0;
        const fracao = coluna.total > 0 ? valor / coluna.total : 0;
        const alturaDoBloco = fracao * alturaUtil;

        if (valor > 0) {
          const retangulo = criarSvgEl('rect', {
            pai: svg,
            classe: 'mk-bloco',
            atributos: {
              x: coluna.x,
              y,
              width: Math.max(0.5, coluna.largura),
              height: Math.max(0.5, alturaDoBloco),
              'data-coluna': coluna.chave,
              'data-serie': serie.chave,
              'data-item': `${coluna.chave}|${serie.chave}`,
            },
          });
          aplicarPreenchimento(retangulo, corPorSerie.get(serie.chave), config);
          aplicarContorno(retangulo, contorno);

          // Linha de origem: só quando o bloco vem de UMA linha o texto e a
          // célula do Looker valem para ele inteiro.
          const linhas = (coluna.linhasPorSerie && coluna.linhasPorSerie.get(serie.chave)) || [];
          const linhaUnica = linhas.length === 1 ? ctx.modelo.linhas[linhas[0]] : null;
          const textoLooker = linhaUnica ? ctx.modelo.texto(linhaUnica, medida.nome, undefined, '') : '';
          const textoDoValor = textoLooker || formatar(valor);

          blocos.push({
            elemento: retangulo,
            coluna,
            serie,
            valor,
            textoDoValor,
            linhaUnica,
            fracaoNaColuna: fracao,
            x: coluna.x,
            y,
            largura: coluna.largura,
            altura: alturaDoBloco,
          });

          // Com "esconder sobrepostos" ligado, o texto só entra quando cabe:
          // texto cortado pela borda do bloco é pior que texto nenhum.
          if (comTextoNoBloco) {
            const texto = textoDoBloco(serie, valor, fracao, textoLooker || undefined);
            const cabe =
              alturaDoBloco >= rot.tamanho + 4 && coluna.largura >= larguraDoTexto(texto, rot.tamanho) + 8;
            if (texto && (cabe || !rot.evitarColisao)) {
              const rotulo = criarSvgEl('text', {
                pai: svg,
                classe: 'mk-rotulo mk-rotulo-bloco',
                atributos: {
                  x: coluna.x + coluna.largura / 2,
                  y: y + alturaDoBloco / 2,
                  'text-anchor': 'middle',
                  'dominant-baseline': 'central',
                },
              });
              definirTexto(rotulo, texto);
              estilizarRotulo(rotulo, rot, { corAutomatica: textoLegivelSobre(corPorSerie.get(serie.chave), tema) });
            }
          }
        }

        y += alturaDoBloco;
      }

      // --- Nome da coluna e o seu peso ---
      const nome = criarSvgEl('text', {
        pai: svg,
        classe: 'mk-coluna',
        atributos: {
          x: coluna.x + coluna.largura / 2,
          y: margemDeCima - 5,
          'text-anchor': 'middle',
          'font-size': fonte,
          fill: tema.texto,
        },
      });
      const cabe = Math.max(3, Math.floor(coluna.largura / (fonte * 0.6)));
      definirTexto(nome, truncar(coluna.rotulo, cabe));

      if (comPesoDaColuna) {
        const peso = criarSvgEl('text', {
          pai: svg,
          classe: 'mk-rotulo mk-rotulo-peso',
          atributos: {
            x: coluna.x + coluna.largura / 2,
            y: margemDeCima + alturaUtil + tamanhoDoPeso + 2,
            'text-anchor': 'middle',
          },
        });
        definirTexto(peso, formatarPercentual(coluna.total / total, rot.casas));
        estilizarRotulo(peso, { ...rot, tamanho: tamanhoDoPeso }, { corAutomatica: tema.textoSuave });
      }

      x += coluna.largura + espaco;
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'mk-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${colunas.length} colunas × ${series.length} séries · total ${formatar(total)}`,
        'a LARGURA é o peso da coluna; a ALTURA é a composição dentro dela',
        // A ressalva central: área é o produto de duas proporções, e o olho
        // compara mal formas de proporções diferentes.
        'compare alturas DENTRO de uma coluna, ou larguras ENTRE colunas — áreas de blocos distantes não se comparam bem',
      ].join(' · ')
    );

    // ---------- Legenda ----------
    if (comLegenda && areaLegenda) {
      desenharLegenda({
        hospedeiro: areaLegenda,
        tema,
        config,
        itens: series.map((s) => ({
          chave: s.chave,
          rotulo: `${truncar(s.rotulo, 20)} — ${formatarPercentual(s.total / total, 0)}`,
          cor: s.cor,
        })),
        eventos: ctx.eventos,
      });
    }

    // ---------- Interação ----------
    const tooltip = ctx.tooltip();

    for (const bloco of blocos) {
      const conteudo = () => {
        const naColuna = formatarPercentual(bloco.fracaoNaColuna, 1);
        return {
          titulo: `${bloco.coluna.rotulo} · ${bloco.serie.rotulo}`,
          linhas: [
            { rotulo: campoDaColuna.rotuloCurto, valor: bloco.coluna.rotulo },
            { rotulo: campoDaSerie.rotuloCurto, valor: bloco.serie.rotulo, cor: bloco.serie.cor },
            { rotulo: medida.rotuloCurto, valor: bloco.textoDoValor },
            { rotulo: 'Dentro da coluna', valor: naColuna },
            { rotulo: 'Do total geral', valor: formatarPercentual(bloco.valor / total, 1) },
            { rotulo: 'Peso da coluna', valor: formatarPercentual(bloco.coluna.total / total, 1) },
          ],
          variaveis: {
            categoria: bloco.coluna.rotulo,
            serie: bloco.serie.rotulo,
            valor: bloco.textoDoValor,
            percentual: naColuna,
          },
        };
      };
      ctx.eventos.on(bloco.elemento, 'pointerenter', (ev) => {
        bloco.elemento.setAttribute('stroke', tema.texto);
        bloco.elemento.setAttribute('stroke-width', '1.5');
        bloco.elemento.removeAttribute('stroke-dasharray');
        if (tooltip) tooltip.mostrar(conteudo(), ev.clientX, ev.clientY);
      });
      ctx.eventos.on(bloco.elemento, 'pointermove', (ev) => {
        if (tooltip) tooltip.mover(ev.clientX, ev.clientY);
      });
      ctx.eventos.on(bloco.elemento, 'pointerleave', () => {
        aplicarContorno(bloco.elemento, contorno);
        if (tooltip) tooltip.esconder();
      });
      ctx.eventos.on(bloco.elemento, 'click', (ev) => {
        ctx.cliqueNoItem(ev, celulaDoBloco(ctx.modelo, bloco, medida, campoDaColuna), conteudo());
      });
    }
  },
});

/**
 * Célula do bloco para o drill: a da medida quando o bloco vem de UMA linha
 * (e tem links); senão a da dimensão da coluna. "Outros" não tem célula.
 */
function celulaDoBloco(modelo, bloco, medida, campoDaColuna) {
  if (bloco.coluna.ehOutros || bloco.serie.ehOutros) return null;
  const candidatas = [];
  if (bloco.linhaUnica) candidatas.push(modelo.celula(bloco.linhaUnica, medida.nome));
  const linhaDaColuna = modelo.linhas[bloco.coluna.indiceDaLinha];
  if (linhaDaColuna) candidatas.push(modelo.celula(linhaDaColuna, campoDaColuna.nome));
  return candidatas.find((c) => c && Array.isArray(c.links) && c.links.length) || candidatas[0] || null;
}

/**
 * Contorno dos blocos. "Cor do contorno" deixada no padrão do painel
 * (#FFFFFF) é "automática": a "Cor da borda" do tema, se escolhida, ou a
 * cor de fundo (que é o que separava os blocos antes das correções).
 */
function contornoDasMarcas(config, tema) {
  const escolhida = String(config.corDoContorno || '').trim();
  const automatica = !escolhida || escolhida.toUpperCase() === '#FFFFFF';
  const corDaBorda = String(config.corDaBorda || '').trim();
  return lerContorno({ ...config, corDoContorno: automatica ? '' : escolhida }, tema, {
    corPadrao: corDaBorda ? tema.borda : tema.fundo,
  });
}

/* ------------------------------------------------------------------ */

/**
 * Lê a matriz coluna × série.
 *
 * Valores negativos são recusados de saída: um empilhamento proporcional
 * reparte um todo, e uma parte negativa não tem onde caber — a coluna
 * passaria de 100% e as alturas deixariam de significar proporção.
 *
 * Colunas e séries em excesso viram "Outros" **nas duas dimensões**,
 * preservando os totais.
 *
 * @returns {{colunas, series, total, medida, campoDaColuna, campoDaSerie}|{erro}}
 */
export function lerMatriz(ctx) {
  const { modelo, config } = ctx;

  const campoDaColuna =
    modelo.dimensoes.find((d) => d.nome === config.campoDaColuna) || modelo.dimensoes[0] || null;
  const campoDaSerie =
    modelo.dimensoes.find((d) => d.nome === config.campoDaSerie && d !== campoDaColuna) ||
    modelo.dimensoes.find((d) => d !== campoDaColuna) ||
    null;

  if (!campoDaColuna || !campoDaSerie) {
    return {
      erro:
        'Um Marimekko cruza DUAS dimensões: uma na largura das colunas e outra no empilhamento. ' +
        'Traga as duas no Explore.',
    };
  }

  const medida =
    modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
  if (!medida) return { erro: 'Esta visualização precisa de uma medida.' };

  let negativos = 0;
  const porColuna = new Map();
  const porSerie = new Map();

  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const valor = modelo.valorNumerico(linha, medida.nome);
    if (valor === null || !Number.isFinite(valor)) continue;
    if (valor < 0) {
      negativos += 1;
      continue;
    }
    if (valor === 0) continue;

    const chaveDaColuna = String(modelo.valorBruto(linha, campoDaColuna.nome));
    const chaveDaSerie = String(modelo.valorBruto(linha, campoDaSerie.nome));

    if (!porColuna.has(chaveDaColuna)) {
      porColuna.set(chaveDaColuna, {
        chave: chaveDaColuna,
        rotulo: modelo.texto(linha, campoDaColuna.nome, undefined, '∅'),
        total: 0,
        porSerie: new Map(),
        // Linhas de origem de cada bloco (coluna × série): com UMA linha, o
        // tooltip usa o texto do Looker e o clique a célula dela.
        linhasPorSerie: new Map(),
        indiceDaLinha: i,
      });
    }
    if (!porSerie.has(chaveDaSerie)) {
      porSerie.set(chaveDaSerie, {
        chave: chaveDaSerie,
        rotulo: modelo.texto(linha, campoDaSerie.nome, undefined, '∅'),
        total: 0,
      });
    }

    const coluna = porColuna.get(chaveDaColuna);
    coluna.total += valor;
    coluna.porSerie.set(chaveDaSerie, (coluna.porSerie.get(chaveDaSerie) || 0) + valor);
    if (!coluna.linhasPorSerie.has(chaveDaSerie)) coluna.linhasPorSerie.set(chaveDaSerie, []);
    coluna.linhasPorSerie.get(chaveDaSerie).push(i);
    porSerie.get(chaveDaSerie).total += valor;
  }

  if (negativos > 0) {
    ctx.avisar(
      `${negativos} linha(s) com valor negativo ficaram de fora: um empilhamento proporcional ` +
        'reparte um todo, e uma parte negativa faria a coluna passar de 100%. Use barras agrupadas.'
    );
  }

  if (!porColuna.size || !porSerie.size) {
    return {
      erro:
        'Nenhuma combinação tem valor positivo. Um Marimekko reparte um todo em partes — ' +
        'com valores zerados ou negativos não há proporção para desenhar.',
    };
  }

  const limiteDeColunas = Math.max(2, Math.min(MAXIMO_DE_COLUNAS, Number(config.maximoDeColunas) || 10));
  const limiteDeSeries = Math.max(2, Math.min(MAXIMO_DE_SERIES, Number(config.maximoDeSeries) || 6));

  let colunas = Array.from(porColuna.values());
  let series = Array.from(porSerie.values()).sort((a, b) => b.total - a.total);

  // --- "Outros" nas séries (mexe no conteúdo de todas as colunas) ---
  if (series.length > limiteDeSeries) {
    const mantidas = series.slice(0, limiteDeSeries - 1);
    const resto = series.slice(limiteDeSeries - 1);
    const chavesDoResto = new Set(resto.map((s) => s.chave));

    for (const coluna of colunas) {
      let soma = 0;
      for (const chave of chavesDoResto) {
        soma += coluna.porSerie.get(chave) || 0;
        coluna.porSerie.delete(chave);
      }
      if (soma > 0) coluna.porSerie.set('__outros__', soma);
    }

    series = mantidas.concat([
      {
        chave: '__outros__',
        rotulo: `Outros (${resto.length})`,
        total: resto.reduce((a, s) => a + s.total, 0),
        ehOutros: true,
      },
    ]);
    ctx.avisar(
      `A consulta tem ${resto.length + limiteDeSeries - 1} séries; as ${resto.length} menores foram ` +
        'somadas em "Outros" (os totais são preservados).'
    );
  }

  // --- Ordem e "Outros" nas colunas ---
  const modo = config.ordemDasColunas || 'tamanho';
  if (modo === 'alfabetica') colunas.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  else if (modo !== 'consulta') colunas.sort((a, b) => b.total - a.total);

  if (colunas.length > limiteDeColunas) {
    const mantidas = colunas.slice(0, limiteDeColunas - 1);
    const resto = colunas.slice(limiteDeColunas - 1);

    const juntas = {
      chave: '__outros__',
      rotulo: `Outros (${resto.length})`,
      total: resto.reduce((a, c) => a + c.total, 0),
      porSerie: new Map(),
      indiceDaLinha: resto[0].indiceDaLinha,
      ehOutros: true,
    };
    for (const coluna of resto) {
      for (const [chave, valor] of coluna.porSerie) {
        juntas.porSerie.set(chave, (juntas.porSerie.get(chave) || 0) + valor);
      }
    }
    colunas = mantidas.concat([juntas]);
    ctx.avisar(
      `A consulta tem ${resto.length + limiteDeColunas - 1} colunas; as ${resto.length} menores ` +
        'foram somadas em "Outros" (os totais são preservados).'
    );
  }

  const total = colunas.reduce((a, c) => a + c.total, 0);
  if (!(total > 0)) {
    return { erro: 'O total das colunas é zero: não há proporção para desenhar.' };
  }

  return { colunas, series, total, medida, campoDaColuna, campoDaSerie };
}

/**
 * Área relativa de um bloco: o produto das duas proporções.
 *
 * É a conta que torna o gráfico poderoso — e a que o olho não faz bem,
 * porque comparar áreas de formas com proporções diferentes é uma tarefa
 * perceptual ruim. Exportada para o teste poder conferir que o desenho
 * corresponde à conta, já que a leitura humana não corresponde.
 */
export function areaRelativa({ valorDoBloco, totalDaColuna, totalGeral }) {
  if (!(totalDaColuna > 0) || !(totalGeral > 0)) return 0;
  const alturaRelativa = valorDoBloco / totalDaColuna;
  const larguraRelativa = totalDaColuna / totalGeral;
  return alturaRelativa * larguraRelativa;
}
