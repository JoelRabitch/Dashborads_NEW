/**
 * bump_chart — "Bump Chart".
 *
 * A evolução do RANKING ao longo do tempo: uma linha por item, mas o eixo
 * Y é a POSIÇÃO, não o valor. É o gráfico de "quem subiu e quem caiu".
 *
 * **E ele tem uma armadilha própria, estrutural:** a distância entre o 1º
 * e o 2º lugar é desenhada igual à distância entre o 9º e o 10º — não
 * importa se o líder abriu dez vezes de vantagem e os outros estão
 * empatados na terceira casa decimal. O ranking APAGA a magnitude, e uma
 * troca de posições pode ser um terremoto ou um empate técnico sem que o
 * desenho mude.
 *
 * Por isso duas coisas não são opcionais aqui: a ressalva fica escrita na
 * tela, e o tooltip mostra sempre o VALOR ao lado da posição — é a única
 * forma de o leitor distinguir os dois casos.
 *
 * Campos: 1 dimensão de período + séries (pivô, 2ª dimensão ou várias
 * medidas) e 1 medida.
 *
 * Opções (correções v2):
 *   - Cores: paleta + "Inverter ordem das cores" + cor própria por série
 *     (opção dinâmica "Cor — <série>", vazio = da paleta). Antes a cor
 *     vinha de `coresDaPaleta` sem inversão e de `cor_<chave>` sem
 *     sanitizar e nunca registrada — nenhuma opção de cor funcionava.
 *     Opacidade e contorno valem nos pontos.
 *   - Rótulos: o bloco Rótulos vale nos nomes das pontas ("Nomes nas
 *     pontas" continua escolhendo o lado) e no NOVO rótulo de valor no
 *     último ponto de cada série (conteúdo/formato/casas/posição/colisão).
 *     "Mostrar rótulos" desligado esconde os dois.
 *   - Pontos: com "Número da posição dentro do ponto" ligado, o disco é
 *     sempre desenhado (é o suporte do número); com ele desligado, os
 *     pontos seguem "Marcar cada período com um ponto".
 *   - Tooltip único; valor no texto do Looker; clique pela "Ação do clique".
 *
 * Melhorias v3 (5.6):
 *   - "Posição do valor" (`posicaoDoValor`, novo): Automática (padrão: ao
 *     lado do círculo, na altura do centro, a 5 px; se não couber, acima,
 *     abaixo ou só no tooltip) | Ao lado | Acima | Abaixo | Só no tooltip.
 *     Textos com halo na cor do fundo, numa camada ACIMA das linhas e dos
 *     círculos; nenhum texto cobre um círculo ou outro texto.
 *   - Margens pela largura estimada (medida-texto.js) do maior valor + nome
 *     à direita e do maior nome à esquerda. Sem espaço: a fonte diminui até
 *     8 px e depois os números são abreviados (K, M); o valor completo fica
 *     no tooltip.
 *   - Curvas: "catmull" (valor salvo em tiles) não ultrapassa mais a faixa
 *     entre os dois círculos; novo valor "bump" (tangente horizontal).
 *   - A nota fica na faixa própria do rodapé (5.1c): não encosta no rank
 *     mais baixo; em tile pequeno ela some.
 *   - "Nomes também à direita": já existe em "Nomes nas pontas" (Nos dois
 *     lados / Só à direita).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaDePonto } from '../../core/scales.js';
import { geradorDeLinha, criarMarcadorSvg } from '../../core/shapes.js';
import { textoLegivelSobre } from '../../core/theme.js';
import { truncar, criarFormatadorNumerico } from '../../core/format.js';
import { larguraDoTexto } from '../../core/medida-texto.js';
import { larguraAproximada } from '../../core/eixos.js';
import { corDoItem, opacidadeDoConfig, lerContorno, aplicarContorno } from '../../core/cores.js';
import { lerRotulos, textoDoRotulo, criarRotuloSvg } from '../../core/rotulos.js';
import {
  opcoesDeTracado,
  opcoesDinamicasDeSerie,
  lerSerieTemporal,
  celulaDoPonto,
  textoDoPonto,
  formatadorDaSerie,
  valueFormatDaSerie,
  destruirSerieTemporal,
} from '../_serie_temporal/index.js';
import { tratarNulos, opcaoDeOrigemDasSeries } from '../../core/series.js';
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
.bp-area{position:relative;width:100%;height:100%;overflow:hidden;}
.bp-svg{position:absolute;left:0;top:0;}
.bp-linha{fill:none;pointer-events:none;}
.bp-ponto{pointer-events:none;}
.bp-rotulo{pointer-events:none;}
.bp-valor{pointer-events:none;}
.bp-periodo{pointer-events:none;}
.bp-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso as posições ficam a menos de 10 px e nada é seguível. */
const MAXIMO_DE_SERIES = 30;

/** Valores de "Posição do valor" (5.6, v3). */
const POSICOES_DO_VALOR = ['auto', 'lado', 'acima', 'abaixo', 'tooltip'];

export default defineViz({
  id: 'bump_chart',
  label: 'Bump Chart',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      opcaoDeOrigemDasSeries(),
      opcoesDeTracado({ espessuraPadrao: 2.5 }),
      {
        melhorPosicao: {
          type: 'string',
          label: 'A 1ª posição é',
          section: 'Ranking',
          display: 'select',
          default: 'maior',
          values: listaDeValores([
            { rotulo: 'O maior valor', valor: 'maior' },
            { rotulo: 'O menor valor', valor: 'menor' },
          ]),
        },
        mostrarPosicao: {
          type: 'boolean',
          label: 'Número da posição dentro do ponto',
          section: 'Ranking',
          default: true,
        },
        // 5.6 (v3): onde o valor do último ponto aparece.
        posicaoDoValor: {
          type: 'string',
          label: 'Posição do valor',
          section: 'Rótulos',
          display: 'select',
          default: 'auto',
          values: listaDeValores([
            { rotulo: 'Automática', valor: 'auto' },
            { rotulo: 'Ao lado do círculo', valor: 'lado' },
            { rotulo: 'Acima', valor: 'acima' },
            { rotulo: 'Abaixo', valor: 'abaixo' },
            { rotulo: 'Só no tooltip', valor: 'tooltip' },
          ]),
        },
        rotulosNasPontas: {
          type: 'string',
          label: 'Nomes nas pontas',
          section: 'Rótulos',
          display: 'select',
          default: 'ambas',
          values: listaDeValores([
            { rotulo: 'Nos dois lados', valor: 'ambas' },
            { rotulo: 'Só à esquerda', valor: 'esquerda' },
            { rotulo: 'Só à direita', valor: 'direita' },
            { rotulo: 'Nenhum', valor: 'nenhum' },
          ]),
        },
        destacarNoHover: {
          type: 'boolean',
          label: 'Destacar uma série ao passar o mouse',
          section: 'Ranking',
          default: true,
        },
        tamanhoDoPonto: {
          type: 'number',
          label: 'Tamanho do ponto',
          section: 'Formato',
          display: 'range',
          min: 4,
          max: 24,
          step: 1,
          default: 12,
        },
      }
    ),
    { limiteDeSeries: MAXIMO_DE_SERIES, curvaDaLinha: 'monotone', mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: true, exigeLinhas: true },

  opcoesDinamicas: opcoesDinamicasDeSerie({ minimoDeSeries: 2 }),

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const serie = lerSerieTemporal(ctx);
    if (!serie) {
      ctx.mostrarVazio(
        'Um bump chart precisa de pelo menos dois períodos e de várias séries ' +
          '(de um pivô, de uma segunda dimensão ou de várias medidas).'
      );
      return;
    }

    // `manter` de propósito: um período sem valor NÃO pode virar uma
    // posição interpolada — a linha corta, e a lacuna é a informação.
    let series = tratarNulos(serie.matriz.series, 'manter');

    if (series.length < 2) {
      ctx.mostrarVazio(
        'Um ranking precisa de pelo menos DUAS séries para comparar. ' +
          'Traga um pivô, uma segunda dimensão ou mais medidas no Explore.'
      );
      return;
    }
    if (series.length > MAXIMO_DE_SERIES) {
      ctx.avisar(
        `A consulta tem ${series.length} séries. Mostrando as ${MAXIMO_DE_SERIES} primeiras: ` +
          'acima disso as posições ficam a menos de 10 px e nenhuma linha é seguível.'
      );
      series = series.slice(0, MAXIMO_DE_SERIES);
    }

    const { posicoes, maiorPosicao } = calcularPosicoes({
      series,
      quantidadeDePeriodos: serie.categorias.length,
      maiorEhMelhor: (config.melhorPosicao || 'maior') === 'maior',
    });

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'bp');
    const area = criarEl('div', { classe: 'bp-area', pai: raiz });

    // Relido a cada desenho: nada do painel fica guardado entre updates.
    const rot = lerRotulos(config, tema);
    const opacidade = opacidadeDoConfig(config);
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const modoDosRotulos = rot.mostrar ? config.rotulosNasPontas || 'ambas' : 'nenhum';
    const limiteDoNome = rot.truncar > 0 ? rot.truncar : 20;
    const nomeCurto = (s) => truncar(s.rotulo, limiteDoNome);
    const nomesEsquerda = modoDosRotulos === 'ambas' || modoDosRotulos === 'esquerda';
    const nomesDireita = modoDosRotulos === 'ambas' || modoDosRotulos === 'direita';
    // 5.6 (v3): "Posição do valor" — padrão Automática (ao lado do círculo).
    const posicaoDoValor = POSICOES_DO_VALOR.includes(config.posicaoDoValor) ? config.posicaoDoValor : 'auto';
    const comValor = rot.mostrar && posicaoDoValor !== 'tooltip';
    const valorAoLado = posicaoDoValor === 'auto' || posicaoDoValor === 'lado';
    const ultimoPeriodo = serie.categorias.length - 1;
    const totalNoPeriodo = (i) => series.reduce((a, s) => a + (Number.isFinite(s.valores[i]) ? s.valores[i] : 0), 0);

    const raioDoPonto = (Number(config.tamanhoDoPonto) || 12) / 2;
    const comNumero = config.mostrarPosicao !== false;
    // O disco é o suporte do número da posição; sem o número, os pontos
    // seguem "Marcar cada período com um ponto".
    const desenharPontos = comNumero || config.mostrarPontos === true;
    const raio = desenharPontos ? raioDoPonto : 2;
    const FOLGA = 5; // distância fixa entre o círculo e o texto ao lado

    // Dados de cada série, antes das margens (que dependem dos textos).
    const compacto = criarFormatadorNumerico({ estilo: 'compacto', casas: 1 });
    series.forEach((s, indice) => {
      s.cor = corDoItem(config, indice, s.chave);
      s.posicoes = posicoes[indice];
      s.formatar = formatadorDaSerie(serie, s, config);
      s.primeira = s.posicoes.findIndex((p) => p !== null);
      s.ultima = s.primeira < 0 ? -1 : s.posicoes.length - 1 - [...s.posicoes].reverse().findIndex((p) => p !== null);
      s.textoDoValor = (abreviar) => {
        if (s.ultima < 0) return '';
        const v = s.valores[s.ultima];
        return textoDoRotulo(rot, {
          valor: v,
          nome: s.rotulo,
          total: s.ultima === ultimoPeriodo ? totalNoPeriodo(s.ultima) : undefined,
          valueFormat: valueFormatDaSerie(serie, s),
          // Abreviado (K, M): o valor completo continua no tooltip.
          textoDoValor: abreviar && Number.isFinite(v) ? compacto(v) : textoDoPonto(ctx, serie.matriz, s.ultima, s, v, s.formatar),
        });
      };
    });

    // ---------- Margens pela largura ESTIMADA dos textos (5.6, v3) ----------
    // Direita: valor ao lado + nome das séries que chegam ao último período.
    // Esquerda: o maior nome. Se não couber, reduz a fonte até 8 px e,
    // depois, abrevia os números (K, M).
    const peso = { negrito: !!rot.negrito };
    const direitaNecessaria = (t, abreviar) =>
      raio +
      FOLGA +
      Math.max(
        0,
        ...series.map((s) => {
          if (s.ultima !== ultimoPeriodo) return 0;
          const v = comValor ? larguraDoTexto(s.textoDoValor(abreviar), t, peso) : 0;
          const n = nomesDireita ? larguraDoTexto(nomeCurto(s), t, peso) : 0;
          if (valorAoLado) return v + (v && n ? 2 * FOLGA : 0) + n;
          return Math.max(n, v / 2 - raio - FOLGA);
        })
      ) +
      4;
    const esquerdaNecessaria = (t) =>
      raio + FOLGA + (nomesEsquerda ? Math.max(0, ...series.map((s) => larguraDoTexto(nomeCurto(s), t, peso))) : 0) + 4;
    let tamanho = rot.tamanho;
    let abreviar = false;
    const limite = largura * 0.62;
    while (direitaNecessaria(tamanho, false) + esquerdaNecessaria(tamanho) > limite && tamanho > 8) tamanho -= 1;
    if (direitaNecessaria(tamanho, false) + esquerdaNecessaria(tamanho) > limite) abreviar = true;
    const rotV = Object.assign({}, rot, { tamanho });

    const margemEsquerda = Math.max(raio + 4, esquerdaNecessaria(tamanho));
    const margemDireita = Math.max(raio + 4, direitaNecessaria(tamanho, abreviar));
    const margemDeCima = fonte + 8 + raio + 4 + (comValor && posicaoDoValor === 'acima' ? tamanho + 2 : 0);
    const margemDeBaixo = raio + 4 + (comValor && posicaoDoValor === 'abaixo' ? tamanho + 2 : 0);

    const escalaX = escalaDePonto({
      dominio: serie.categorias.map((c) => c.chave),
      intervalo: [margemEsquerda, Math.max(margemEsquerda + 20, largura - margemDireita)],
      preenchimento: 0,
    });
    const alturaUtil = Math.max(20, altura - margemDeCima - margemDeBaixo);
    const passoY = maiorPosicao > 1 ? alturaUtil / (maiorPosicao - 1) : 0;
    const y = (posicao) => margemDeCima + (posicao - 1) * passoY;
    const xDe = (i) => escalaX(serie.categorias[i].chave);

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'bp-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    // ---------- Eixo de períodos ----------
    const saltoDePeriodo = saltoDosPeriodos(serie, escalaX, fonte);
    serie.categorias.forEach((categoria, i) => {
      if (i % saltoDePeriodo !== 0 && i !== serie.categorias.length - 1) return;
      const x = escalaX(categoria.chave);
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'bp-periodo',
        atributos: {
          x,
          y: fonte + 2,
          'text-anchor': i === 0 ? 'start' : i === serie.categorias.length - 1 ? 'end' : 'middle',
          'font-size': fonte,
          fill: tema.textoSuave,
        },
      });
      definirTexto(texto, serie.rotuloDaCategoria(categoria));
    });

    // ---------- Camadas: linhas por baixo, círculos, textos por cima ----------
    const curva = config.curvaDaLinha || 'monotone';
    const espessura = Number(config.espessuraDaLinha) || 2.5;
    const grupoDasLinhas = criarSvgEl('g', { pai: svg, classe: 'bp-linhas' });
    const grupoDosPontos = criarSvgEl('g', { pai: svg, classe: 'bp-pontos' });
    const grupoDosTextos = criarSvgEl('g', { pai: svg, classe: 'bp-textos' });
    const circulos = [];

    series.forEach((s) => {
      // A linha entra no CENTRO de cada círculo; "catmull" e "bump" não
      // saem da faixa vertical entre os dois círculos (ver shapes.js).
      const gerador = geradorDeLinha({
        x: (_, i) => xDe(i),
        y: (_, i) => y(s.posicoes[i]),
        curva,
        definido: (_, i) => s.posicoes[i] !== null,
      });
      s.caminho = criarSvgEl('path', {
        pai: grupoDasLinhas,
        classe: 'bp-linha',
        atributos: {
          d: gerador(serie.categorias) || '',
          stroke: s.cor,
          'stroke-width': espessura,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
      });

      s.marcas = [];
      serie.categorias.forEach((_, i) => {
        if (s.posicoes[i] === null) return;
        const px = xDe(i);
        const py = y(s.posicoes[i]);
        circulos.push({ x: px, y: py });
        if (!desenharPontos) return;
        const ponto = criarMarcadorSvg(grupoDosPontos, 'circulo', px, py, raioDoPonto * 2, {
          classe: 'bp-ponto',
          fill: s.cor,
          'fill-opacity': opacidade,
          'data-x': px,
          'data-y': py,
        });
        aplicarContorno(ponto, contorno);
        s.marcas.push(ponto);

        if (comNumero && raioDoPonto >= 7) {
          const numero = criarSvgEl('text', {
            pai: grupoDosPontos,
            classe: 'bp-ponto bp-numero',
            atributos: {
              x: px,
              y: py,
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'font-size': Math.max(7, raioDoPonto),
              'font-weight': '600',
              // Legível sobre a cor da série (paletas claras incluídas).
              fill: textoLegivelSobre(s.cor, tema),
            },
          });
          definirTexto(numero, String(s.posicoes[i]));
          s.marcas.push(numero);
        }
      });
    });

    // ---------- Textos: nomes e valores, com halo e anti-colisão ----------
    const caixas = [];
    const cabe = (c) => c.x0 >= 0 && c.x1 <= largura && c.y0 >= 0 && c.y1 <= altura;
    const cruza = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
    const sobreCirculo = (c) =>
      circulos.some((p) => c.x0 < p.x + raio && c.x1 > p.x - raio && c.y0 < p.y + raio && c.y1 > p.y - raio);
    const caixaDe = (x, yc, w, ancora) => {
      const x0 = ancora === 'middle' ? x - w / 2 : ancora === 'end' ? x - w : x;
      return { x0, x1: x0 + w, y0: yc - tamanho / 2, y1: yc + tamanho / 2 };
    };
    /** Coloca um texto se couber, sem cobrir círculo nem outro texto. */
    const colocar = (s, { x, yc, texto, ancora, classe, extra = {} }) => {
      if (!texto) return null;
      const c = caixaDe(x, yc, larguraDoTexto(texto, tamanho, peso), ancora);
      if (!cabe(c) || sobreCirculo(c) || caixas.some((o) => cruza(o, c))) return null;
      const el = criarRotuloSvg(grupoDosTextos, rotV, { x, y: yc, texto, ancora, corAutomatica: classe === 'bp-valor' ? s.cor : tema.texto });
      if (!el) return null;
      el.setAttribute('class', `bl-rotulo ${classe}`);
      // Halo na cor do fundo: legível mesmo sobre uma linha.
      el.setAttribute('stroke', tema.fundo || '#FFFFFF');
      el.setAttribute('stroke-width', '3');
      el.setAttribute('stroke-linejoin', 'round');
      el.setAttribute('paint-order', 'stroke');
      for (const [k, v] of Object.entries(extra)) el.setAttribute(k, String(v));
      caixas.push(c);
      s.marcas.push(el);
      return el;
    };

    // Valores primeiro (são a magnitude que o ranking apaga), em ordem de posição.
    const larguraDoValor = (s) => larguraDoTexto(s.textoDoValor(abreviar), tamanho, peso);
    if (comValor) {
      for (const s of [...series].sort((a, b) => (a.posicoes[a.ultima] || 0) - (b.posicoes[b.ultima] || 0))) {
        if (s.ultima < 0) continue;
        const cx = xDe(s.ultima);
        const cy = y(s.posicoes[s.ultima]);
        const texto = s.textoDoValor(abreviar);
        const origem = { 'data-cx': cx, 'data-cy': cy };
        const tentar = (pos) =>
          pos === 'lado'
            ? colocar(s, { x: cx + raio + FOLGA, yc: cy, texto, ancora: 'start', classe: 'bp-valor', extra: { ...origem, 'data-posicao': 'lado' } })
            : colocar(s, {
              x: cx,
              yc: pos === 'acima' ? cy - raio - tamanho / 2 - 2 : cy + raio + tamanho / 2 + 2,
              texto,
              ancora: 'middle',
              classe: 'bp-valor',
              extra: { ...origem, 'data-posicao': pos },
            });
        if (posicaoDoValor === 'auto') tentar('lado') || tentar('acima') || tentar('abaixo');
        else tentar(posicaoDoValor);
      }
    }

    // Nomes nas pontas (estilo do bloco Rótulos). À direita, depois do valor.
    for (const s of series) {
      if (s.primeira < 0) continue;
      if (nomesEsquerda) {
        colocar(s, { x: xDe(s.primeira) - raio - FOLGA, yc: y(s.posicoes[s.primeira]), texto: nomeCurto(s), ancora: 'end', classe: 'bp-rotulo' });
      }
      if (nomesDireita) {
        const valorDoLado = comValor && valorAoLado ? larguraDoValor(s) + 2 * FOLGA : 0;
        const x = xDe(s.ultima) + raio + FOLGA;
        // Primeiro depois do valor; se o valor não coube ao lado, encostado no círculo.
        colocar(s, { x: x + valorDoLado, yc: y(s.posicoes[s.ultima]), texto: nomeCurto(s), ancora: 'start', classe: 'bp-rotulo' }) ||
          colocar(s, { x, yc: y(s.posicoes[s.ultima]), texto: nomeCurto(s), ancora: 'start', classe: 'bp-rotulo' });
      }
    }

    // ---------- Nota ----------
    const nota = ctx.nota; // 5.1c: texto automático da nota
    nota.style.color = tema.textoSuave;
    const comLacunas = series.some((s) => s.posicoes.some((p) => p === null));
    definirTexto(
      nota,
      [
        `${series.length} séries · ${serie.categorias.length} períodos`,
        'o eixo é a POSIÇÃO, não o valor: a distância do 1º ao 2º é desenhada igual à do 9º ao 10º',
        'o ranking apaga a magnitude — veja o valor no tooltip antes de concluir',
        comLacunas ? 'linhas cortadas marcam períodos sem dado (não há posição inventada)' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    // Tooltip ÚNICO do gráfico (o núcleo esconde no redesenho e remove no
    // destroy); null se o usuário desligou.
    const tooltip = ctx.tooltip();

    const destacar = (alvo) => {
      if (config.destacarNoHover === false) return;
      for (const s of series) {
        const ativo = !alvo || s === alvo;
        s.caminho.setAttribute('opacity', ativo ? 1 : 0.12);
        for (const marca of s.marcas) marca.setAttribute('opacity', ativo ? 1 : 0.12);
      }
    };

    const alvoDoEvento = (ev) => {
      const caixa = area.getBoundingClientRect();
      const px = ev.clientX - caixa.left;
      const py = ev.clientY - caixa.top;
      const i = indiceDoPeriodo(px, serie, escalaX);
      const alvo = serieMaisProxima({ series, indice: i, py, y, tolerancia: Math.max(12, passoY / 2) });
      return { i, alvo };
    };

    const conteudoDe = (alvo, i) => {
      const valor = alvo.valores[i];
      // O valor vem SEMPRE (é ele que diz se a troca de posição foi um
      // terremoto ou um empate técnico) e vem no texto do Looker.
      const textoDoValor = textoDoPonto(ctx, serie.matriz, i, alvo, valor, alvo.formatar);
      const periodo = serie.rotuloDaCategoria(serie.categorias[i]);
      const posicao = alvo.posicoes[i] === null ? 'sem dado neste período' : `${alvo.posicoes[i]}º de ${maiorPosicao}`;
      return {
        titulo: alvo.rotulo,
        linhas: [
          { rotulo: 'Período', valor: periodo, cor: alvo.cor },
          { rotulo: 'Posição', valor: posicao },
          { rotulo: serie.matriz.medida ? serie.matriz.medida.rotuloCurto : 'Valor', valor: textoDoValor },
          ...linhasDeVariacao(alvo, i, maiorPosicao),
        ],
        variaveis: { categoria: periodo, serie: alvo.rotulo, valor: textoDoValor, posicao },
      };
    };

    ctx.eventos.on(area, 'pointermove', (ev) => {
      const { i, alvo } = alvoDoEvento(ev);
      destacar(alvo);

      if (!tooltip) return;
      if (!alvo || i < 0) {
        tooltip.esconder();
        return;
      }
      tooltip.mostrar(conteudoDe(alvo, i), ev.clientX, ev.clientY);
    });

    ctx.eventos.on(area, 'pointerleave', () => {
      destacar(null);
      if (tooltip) tooltip.esconder();
    });

    // Clique: "Ação do clique" do painel (drill na célula do ponto, fixar
    // o tooltip ou nada).
    ctx.eventos.on(area, 'click', (ev) => {
      const { i, alvo } = alvoDoEvento(ev);
      if (!alvo || i < 0) return;
      ctx.cliqueNoItem(ev, celulaDoPonto(ctx, serie.matriz, i, alvo), conteudoDe(alvo, i));
    });
  },

  aoDestruir: destruirSerieTemporal,
});

/* ------------------------------------------------------------------ */

function linhasDeVariacao(serie, indice, maiorPosicao) {
  const atual = serie.posicoes[indice];
  if (atual === null) return [];

  const primeira = serie.posicoes.find((p) => p !== null);
  const saida = [];

  for (let i = indice - 1; i >= 0; i--) {
    if (serie.posicoes[i] === null) continue;
    const diferenca = serie.posicoes[i] - atual;
    saida.push({
      rotulo: 'Desde o período anterior',
      valor: diferenca === 0 ? 'manteve' : diferenca > 0 ? `subiu ${diferenca}` : `caiu ${-diferenca}`,
    });
    break;
  }

  if (primeira !== undefined && primeira !== atual) {
    const diferenca = primeira - atual;
    saida.push({
      rotulo: 'Desde o início',
      valor: `${diferenca > 0 ? 'subiu' : 'caiu'} ${Math.abs(diferenca)} (de ${primeira}º para ${atual}º de ${maiorPosicao})`,
    });
  }
  return saida;
}

function indiceDoPeriodo(px, serie, escalaX) {
  let melhor = -1;
  let menor = Infinity;
  serie.categorias.forEach((categoria, i) => {
    const d = Math.abs(escalaX(categoria.chave) - px);
    if (d < menor) {
      menor = d;
      melhor = i;
    }
  });
  return melhor;
}

function serieMaisProxima({ series, indice, py, y, tolerancia }) {
  if (indice < 0) return null;
  let melhor = null;
  let menor = Infinity;
  for (const s of series) {
    const posicao = s.posicoes[indice];
    if (posicao === null) continue;
    const d = Math.abs(y(posicao) - py);
    if (d < menor) {
      menor = d;
      melhor = s;
    }
  }
  return menor <= tolerancia ? melhor : null;
}

function saltoDosPeriodos(serie, escalaX, fonte) {
  if (serie.categorias.length < 2) return 1;
  const maiorRotulo = serie.categorias.reduce(
    (a, c) => Math.max(a, larguraAproximada(serie.rotuloDaCategoria(c), fonte)),
    0
  );
  const disponivel = Math.abs(
    escalaX(serie.categorias[1].chave) - escalaX(serie.categorias[0].chave)
  );
  return Math.max(1, Math.ceil((maiorRotulo + 10) / Math.max(1, disponivel)));
}

/**
 * Posição de cada série em cada período.
 *
 * Duas decisões com consequência:
 *
 * - **Empates desempatam pelo NOME, não pela ordem da consulta.** Duas
 *   séries com o mesmo valor precisam de uma ordem definida; usar a ordem
 *   em que o Looker devolveu faria o ranking TREMER entre renderizações da
 *   mesma consulta, e um bump chart que se mexe sozinho é pior que
 *   nenhum.
 * - **Período sem valor não recebe posição.** A linha corta ali. Ranquear
 *   um valor que não existe (como zero, ou como "último") inventaria uma
 *   queda que não aconteceu.
 *
 * @returns {{posicoes: Array<Array<number|null>>, maiorPosicao: number}}
 */
export function calcularPosicoes({ series, quantidadeDePeriodos, maiorEhMelhor = true }) {
  const posicoes = series.map(() => new Array(quantidadeDePeriodos).fill(null));
  let maiorPosicao = 1;

  for (let periodo = 0; periodo < quantidadeDePeriodos; periodo++) {
    const participantes = [];
    series.forEach((s, indice) => {
      const valor = s.valores[periodo];
      if (valor === null || !Number.isFinite(valor)) return;
      participantes.push({ indice, valor, rotulo: s.rotulo || String(indice) });
    });

    participantes.sort((a, b) => {
      if (a.valor !== b.valor) return maiorEhMelhor ? b.valor - a.valor : a.valor - b.valor;
      return a.rotulo.localeCompare(b.rotulo, 'pt-BR');
    });

    participantes.forEach((p, i) => {
      posicoes[p.indice][periodo] = i + 1;
    });
    maiorPosicao = Math.max(maiorPosicao, participantes.length);
  }

  return { posicoes, maiorPosicao };
}
