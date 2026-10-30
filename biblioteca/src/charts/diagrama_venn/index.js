/**
 * diagrama_venn — "Diagrama de Venn" (2 a 5 conjuntos).
 *
 * Desenha em SVG porque o número de formas é pequeno (no máximo 5) e SVG dá
 * de graça o texto selecionável e a nitidez em qualquer zoom. Quem faz o
 * trabalho pesado é `geometria.js` (formas e onde cabe cada rótulo) e
 * `dados.js` (os três formatos de entrada possíveis).
 *
 * Campos: uma dimensão com as regiões ("A", "A,B") + uma medida, OU duas
 * dimensões (item e conjunto), OU colunas sim/não — ver `dados.js`.
 *
 * Interação (correções v2, 6.6): as REGIÕES são alvos de mouse, inclusive
 * as interseções. Não há um elemento por região (a região "A ∩ B sem C" não
 * é uma forma SVG simples); o próprio <svg> escuta o mouse e descobre a
 * região por teste geométrico (`mascaraDoPonto`) contra as elipses. A
 * região sob o mouse é desenhada por cima (recorte das elipses que a
 * formam, menos as que não a formam), as demais formas são atenuadas e o
 * tooltip mostra a região, o valor no formato do Looker e o percentual.
 * O clique segue a "Ação do clique" (`ctx.cliqueNoItem`): drill quando a
 * região vem de uma linha com links; senão, fixa o tooltip.
 *
 * Opções lidas a cada desenho: rótulos (função única `rotulos.js`: mostrar,
 * tamanho, cor, negrito, rotação, conteúdo, formato, casas, truncar,
 * esconder sobrepostos e posição — "Fora" manda os números para a lista do
 * canto), cores (modo de cor, paleta e "Inverter", cor única, escala por
 * valor, cores por conjunto, opacidade) e contorno (mostrar, cor, espessura,
 * estilo). Opções próprias: percentual junto do número, total do conjunto
 * no nome, lista das regiões pequenas.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarSvgEl, criarEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { coresDaPaleta, textoLegivelSobre, opcoesDePaleta, corParaRgb } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual } from '../../core/format.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo, esconderColisoes, larguraDoTexto } from '../../core/rotulos.js';
import { paletaDoConfig, lerContorno, aplicarContorno } from '../../core/cores.js';
import { escalaDeCores } from '../../core/scales.js';
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
import {
  layoutDeConjuntos,
  posicoesDasRegioes,
  caminhoDaElipse,
  posicaoDoRotuloDoConjunto,
  mascaraDoPonto,
} from './geometria.js';
import { lerConjuntos, rotuloDaRegiao } from './dados.js';

const CSS = `
.venn-area{position:relative;width:100%;height:100%;}
.venn-svg{cursor:pointer;}
.venn-forma{transition:opacity .15s ease, stroke-width .15s ease;pointer-events:none;}
.venn-forma.venn-atenuado{opacity:.3;}
.venn-forma.venn-ativa{stroke-width:3px;}
.venn-destaque{pointer-events:none;}
.venn-rotulo-conjunto{font-weight:600;pointer-events:none;}
.venn-valor{pointer-events:none;transition:opacity .15s ease;}
.venn-valor.venn-atenuado{opacity:.35;}
.venn-lista{position:absolute;right:6px;bottom:4px;font-size:10px;line-height:1.4;opacity:.8;
  max-width:46%;text-align:right;}
@media (prefers-reduced-motion: reduce){.venn-forma,.venn-valor{transition:none;}}
`;

/** Ids únicos dos <clipPath>/<mask> (vários Venns na mesma página). */
let contadorDeDesenhos = 0;

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

    const { conjuntos, regioes, totalPorConjunto, avisos, unidade, formato, medida, linhasPorRegiao } =
      lerConjuntos(modelo, config);
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

    const totais = conjuntos.map((_, i) => totalPorConjunto.get(i) || 0);
    const cores = resolverCores(conjuntos, totais, config, tema);
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
    // Fundo transparente: garante que o <svg> receba o mouse também fora
    // das formas (para esconder o destaque ao sair de uma região).
    criarSvgEl('rect', {
      pai: svg,
      atributos: { x: 0, y: 0, width: larguraUtil, height: alturaUtil, fill: 'transparent' },
    });

    // Números SEMPRE formatados: o value_format da medida somada (ou
    // inteiro, quando é contagem de itens). Nunca o número cru.
    const formatarValor = formatadorDeValueFormat(medida ? medida.valueFormat : undefined, {
      casas: medida ? 2 : 0,
    });
    const totalGeral = Array.from(regioes.values()).reduce((a, b) => a + b, 0);

    /** Texto do Looker quando a região vem de UMA linha; senão, formatado. */
    function textoDoLooker(mascara) {
      const linhas = linhasPorRegiao.get(mascara);
      if (medida && linhas && linhas.length === 1) {
        const t = modelo.texto(linhas[0], medida.nome, undefined, '');
        if (t !== '') return t;
      }
      return null;
    }
    function textoDoValor(mascara) {
      const doLooker = textoDoLooker(mascara);
      return doLooker !== null ? doLooker : formatarValor(regioes.get(mascara) || 0);
    }

    // --- Formas ---
    const opacidade = opacidadeDoVenn(config);
    const formas = elipses.map((elipse, i) => {
      const forma = criarSvgEl('path', {
        pai: svg,
        classe: 'venn-forma',
        atributos: {
          d: caminhoDaElipse(elipse),
          transform: transformacao(elipse),
          fill: cores[i],
          'fill-opacity': opacidade,
        },
      });
      aplicarContorno(forma, contornoDoConjunto(config, tema, cores[i]));
      return forma;
    });

    // Camada do destaque: fica ACIMA das formas e ABAIXO dos números.
    const uid = `venn${(contadorDeDesenhos += 1)}`;
    const defs = criarSvgEl('defs', { pai: svg });
    elipses.forEach((elipse, i) => {
      const recorte = criarSvgEl('clipPath', { pai: defs, atributos: { id: `${uid}-c${i}` } });
      criarSvgEl('path', { pai: recorte, atributos: { d: caminhoDaElipse(elipse), transform: transformacao(elipse) } });
    });
    const camadaDoDestaque = criarSvgEl('g', { pai: svg });

    // --- Números das regiões (rótulos de dados) ---
    const rot = lerRotulos(config, tema);
    const rotDoValor = { ...rot };
    if (config.mostrarPercentual && rot.conteudo === 'valor') rotDoValor.conteudo = 'valorPercentual';
    const listarFora = rot.posicao === 'fora' || rot.posicao === 'foraComLinha';
    const pequenas = [];
    const numeros = new Map();
    const caixas = [];

    if (rot.mostrar) {
      for (const [mascara, valor] of ordenarRegioes(regioes)) {
        const posicao = posicoes.get(mascara);
        const rotulo = rotuloDaRegiao(mascara, conjuntos);
        const textoLooker = textoDoLooker(mascara);
        const texto = textoDoRotulo(rotDoValor, {
          valor,
          nome: rotulo,
          total: totalGeral,
          valueFormat: medida ? medida.valueFormat : undefined,
          textoDoValor: textoLooker === null ? undefined : textoLooker,
        });
        if (texto === '') continue;

        // "Esconder rótulos que se sobrepõem" ligado: encolhe até caber ou
        // manda para a lista. Desligado: desenha no tamanho escolhido.
        const tamanho = listarFora || !posicao ? 0 : rot.evitarColisao ? tamanhoQueCabe(posicao, texto, rot.tamanho) : rot.tamanho;
        if (!tamanho) {
          pequenas.push({ rotulo, texto });
          continue;
        }

        const numero = criarSvgEl('text', {
          pai: svg,
          classe: 'venn-valor bl-rotulo',
          atributos: {
            x: posicao.x,
            y: posicao.y,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'data-mascara': mascara,
          },
        });
        definirTexto(numero, texto);
        estilizarRotulo(numero, { ...rot, tamanho }, { corAutomatica: corDoTextoDaRegiao(mascara, cores, opacidade, tema) });
        numeros.set(mascara, numero);
        caixas.push({ el: numero, x: posicao.x, y: posicao.y, largura: larguraDoTexto(texto, tamanho), altura: tamanho });
      }
      esconderColisoes(caixas, rot);
    }

    // --- Nomes dos conjuntos ---
    const centro = { x: larguraUtil / 2, y: alturaUtil / 2 };
    if (rot.mostrar) {
      conjuntos.forEach((conjunto, i) => {
        const posicao = posicaoDoRotuloDoConjunto(elipses[i], centro, 6);
        const texto =
          config.mostrarTotalDoConjunto !== false ? `${conjunto.nome} (${formatarValor(totais[i])})` : conjunto.nome;

        const el = criarSvgEl('text', {
          pai: svg,
          classe: 'venn-rotulo-conjunto',
          atributos: {
            x: Math.max(4, Math.min(larguraUtil - 4, posicao.x)),
            y: Math.max(10, Math.min(alturaUtil - 4, posicao.y)),
            'text-anchor': posicao.x < centro.x ? 'start' : 'end',
            'dominant-baseline': 'central',
            'font-size': Math.max(10, tema.tamanhoBase),
            'font-family': tema.fonte,
            fill: cores[i],
          },
        });
        definirTexto(el, texto);
      });
    }

    // --- Regiões que não couberam (ou todas, com posição "Fora") ---
    if (pequenas.length && (config.listarRegioesPequenas !== false || listarFora)) {
      const lista = criarEl('div', { classe: 'venn-lista', pai: areaGrafico });
      lista.style.color = rot.cor || tema.textoSuave;
      lista.style.fontWeight = rot.negrito ? '700' : '';
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
          rotulo: config.mostrarTotalDoConjunto !== false ? `${c.nome} (${formatarValor(totais[i])})` : c.nome,
          cor: cores[i],
        })),
        eventos: ctx.eventos,
      });
    }

    // --- Interação: hover e clique por REGIÃO (teste geométrico) ---
    const tooltip = ctx.tooltip();
    const mascaras = new Map(); // cache das <mask> de exclusão por região
    let regiaoAtual = 0; // região destacada
    let regiaoDoTooltip = 0; // região mostrada no tooltip

    function conteudoDaRegiao(mascara) {
      const rotulo = rotuloDaRegiao(mascara, conjuntos);
      const valor = regioes.get(mascara) || 0;
      const texto = textoDoValor(mascara);
      const percentual = totalGeral ? formatarPercentual(valor / totalGeral, 1) : '';
      const linhas = [{ rotulo: unidade || 'Valor', valor: texto, cor: corDaRegiao(mascara, cores) }];
      if (percentual) linhas.push({ rotulo: 'Do total', valor: percentual });
      return { titulo: rotulo, linhas, variaveis: { categoria: rotulo, valor: texto, serie: rotulo, percentual } };
    }

    function celulaDaRegiao(mascara) {
      const linhas = linhasPorRegiao.get(mascara);
      if (!linhas || linhas.length !== 1) return null;
      const candidatas = [];
      if (medida) candidatas.push(modelo.celula(linhas[0], medida.nome));
      if (modelo.dimensoes[0]) candidatas.push(modelo.celula(linhas[0], modelo.dimensoes[0].nome));
      return candidatas.find((c) => c && Array.isArray(c.links) && c.links.length) || candidatas[0] || null;
    }

    function mascaraDeExclusao(mascara) {
      const fora = elipses.map((_, i) => i).filter((i) => !(mascara & (1 << i)));
      if (!fora.length) return null;
      if (!mascaras.has(mascara)) {
        const id = `${uid}-m${mascara}`;
        const m = criarSvgEl('mask', {
          pai: defs,
          atributos: { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: larguraUtil, height: alturaUtil },
        });
        criarSvgEl('rect', { pai: m, atributos: { x: 0, y: 0, width: larguraUtil, height: alturaUtil, fill: '#FFFFFF' } });
        for (const i of fora) {
          criarSvgEl('path', {
            pai: m,
            atributos: { d: caminhoDaElipse(elipses[i]), transform: transformacao(elipses[i]), fill: '#000000' },
          });
        }
        mascaras.set(mascara, id);
      }
      return mascaras.get(mascara);
    }

    // "Destacar ao passar o mouse" (opção do núcleo, 2.6): desligada, o
    // tooltip e o clique continuam, só o destaque some.
    const comDestaque = config.destacarAoPassarMouse !== false;

    function destacar(pedida) {
      const mascara = comDestaque ? pedida : 0;
      if (mascara === regiaoAtual) return;
      regiaoAtual = mascara;
      while (camadaDoDestaque.firstChild) camadaDoDestaque.removeChild(camadaDoDestaque.firstChild);
      formas.forEach((forma, i) => {
        const pertence = mascara !== 0 && (mascara & (1 << i)) !== 0;
        forma.classList.toggle('venn-atenuado', mascara !== 0 && !pertence);
        forma.classList.toggle('venn-ativa', pertence);
      });
      for (const [m, numero] of numeros) numero.classList.toggle('venn-atenuado', mascara !== 0 && m !== mascara);
      if (!mascara) return;

      // A região = interseção das elipses que a formam (recortes aninhados)
      // menos as que não a formam (máscara preta).
      const grupo = criarSvgEl('g', {
        pai: camadaDoDestaque,
        classe: 'venn-destaque',
        atributos: { 'data-mascara': mascara },
      });
      let pai = grupo;
      elipses.forEach((_, i) => {
        if (!(mascara & (1 << i))) return;
        pai = criarSvgEl('g', { pai, atributos: { 'clip-path': `url(#${uid}-c${i})` } });
      });
      const exclusao = mascaraDeExclusao(mascara);
      criarSvgEl('rect', {
        pai,
        atributos: {
          x: 0,
          y: 0,
          width: larguraUtil,
          height: alturaUtil,
          fill: corDaRegiao(mascara, cores),
          'fill-opacity': Math.min(1, opacidade + 0.35),
          mask: exclusao ? `url(#${exclusao})` : null,
        },
      });
    }

    function regiaoNoPonto(ev) {
      const caixa = typeof svg.getBoundingClientRect === 'function' ? svg.getBoundingClientRect() : null;
      const escalaX = caixa && caixa.width ? larguraUtil / caixa.width : 1;
      const escalaY = caixa && caixa.height ? alturaUtil / caixa.height : 1;
      const x = (ev.clientX - (caixa ? caixa.left : 0)) * escalaX;
      const y = (ev.clientY - (caixa ? caixa.top : 0)) * escalaY;
      return mascaraDoPonto(x, y, elipses);
    }

    function aoMover(ev) {
      const mascara = regiaoNoPonto(ev);
      const mudou = mascara !== regiaoDoTooltip;
      regiaoDoTooltip = mascara;
      destacar(mascara);
      if (!tooltip) return;
      if (!mascara) {
        tooltip.esconder();
      } else if (mudou || !tooltip.visivel) {
        tooltip.mostrar(conteudoDaRegiao(mascara), ev.clientX, ev.clientY);
      } else {
        tooltip.mover(ev.clientX, ev.clientY);
      }
    }

    ctx.eventos.on(svg, 'pointermove', aoMover);
    ctx.eventos.on(svg, 'pointerenter', aoMover);
    ctx.eventos.on(svg, 'pointerleave', () => {
      regiaoDoTooltip = 0;
      destacar(0);
      if (tooltip) tooltip.esconder();
    });
    ctx.eventos.on(svg, 'click', (ev) => {
      const mascara = regiaoNoPonto(ev);
      if (!mascara) return;
      destacar(mascara);
      ctx.cliqueNoItem(ev, celulaDaRegiao(mascara), conteudoDaRegiao(mascara));
    });

    if (config.modoDebug) {
      ctx.avisar(`formato detectado: ${formato}; ${regioes.size} região(ões).`);
    }
  },
});

/** Rotação da elipse no SVG (null quando não gira). */
function transformacao(elipse) {
  return elipse.rotacao ? `rotate(${elipse.rotacao} ${elipse.cx} ${elipse.cy})` : null;
}

/**
 * Opacidade do preenchimento. O Venn tem DUAS opções com esse nome: a do
 * bloco de cores (`opacidade`, padrão 1) e a própria
 * (`opacidadeDoPreenchimento`, padrão 0,4, a que sempre valeu). Nenhum id
 * pode sumir; então a geral vale quando o usuário a tira do padrão, e a
 * própria vale no resto.
 */
function opacidadeDoVenn(config) {
  const limitar = (v) => Math.max(0, Math.min(1, v));
  const geral = Number(config.opacidade);
  if (Number.isFinite(geral) && geral !== 1) return limitar(geral);
  const propria = Number(config.opacidadeDoPreenchimento);
  return Number.isFinite(propria) ? limitar(propria) : 0.4;
}

/**
 * Contorno de cada conjunto. "Cor do contorno" deixada no padrão do painel
 * (#FFFFFF) significa "automática": a cor do próprio conjunto, que é o que
 * deixa as sobreposições legíveis com preenchimento translúcido.
 */
function contornoDoConjunto(config, tema, corDoConjunto) {
  const escolhida = String(config.corDoContorno || '').trim();
  const automatica = !escolhida || escolhida.toUpperCase() === '#FFFFFF';
  return lerContorno({ ...config, corDoContorno: automatica ? '' : escolhida }, tema, { corPadrao: corDoConjunto });
}

/** Cor da região: média das cores dos conjuntos que a formam. */
function corDaRegiao(mascara, cores) {
  const rgbs = [];
  cores.forEach((cor, i) => {
    if (mascara & (1 << i)) {
      const rgb = corParaRgb(cor);
      if (rgb) rgbs.push(rgb);
    }
  });
  if (!rgbs.length) return cores[0] || '#94A3B8';
  const media = [0, 1, 2].map((k) => Math.round(rgbs.reduce((a, c) => a + c[k], 0) / rgbs.length));
  return `rgb(${media[0]},${media[1]},${media[2]})`;
}

/** Texto escuro ou claro conforme o fundo da região. */
function corDoTextoDaRegiao(mascara, cores, opacidade, tema) {
  const indices = [];
  for (let i = 0; i < cores.length; i++) if (mascara & (1 << i)) indices.push(i);
  if (indices.length !== 1) return tema.texto;
  // Com preenchimento fraco, o fundo manda; com forte, a cor da região.
  if (!Number.isFinite(opacidade) || opacidade < 0.55) return tema.texto;
  return textoLegivelSobre(cores[indices[0]], tema);
}

/** Regiões menores por último, para o texto das maiores ficar por baixo. */
function ordenarRegioes(regioes) {
  return Array.from(regioes.entries()).sort((a, b) => b[1] - a[1]);
}

/**
 * Cores dos conjuntos conforme "Como colorir":
 *   - categoria (padrão): cor própria do conjunto, se o usuário escolheu;
 *     senão a paleta (respeitando "Inverter ordem das cores");
 *   - única: todos com a "Cor única";
 *   - valor: escala contínua pelo total de cada conjunto.
 */
function resolverCores(conjuntos, totais, config, tema) {
  const modo = config.modoDeCor || 'categoria';
  if (modo === 'unica' || modo === 'valor') {
    const escala = escalaDeCores({ chaves: conjuntos.map((c) => c.nome), valores: totais, config, tema });
    return conjuntos.map((_, i) => escala.cor(totais[i]));
  }
  const paleta = paletaDoConfig(config);
  return conjuntos.map((conjunto, i) => corPropria(config, i, conjunto.nome) || paleta[i % paleta.length] || tema.texto);
}

/**
 * Cor própria do conjunto (opção dinâmica `cor_<nome>`). O default dessa
 * opção é a cor da paleta naquela posição, e o config chega com os defaults
 * preenchidos — então um valor igual à cor de QUALQUER paleta na mesma
 * posição não é escolha do usuário, e a paleta (com a inversão) manda.
 */
function corPropria(config, indice, nome) {
  const valor = String(config[`cor_${sanitizarChave(nome)}`] || '').trim();
  if (!valor) return '';
  for (const item of opcoesDePaleta()) {
    const cores = coresDaPaleta(Object.values(item)[0]);
    if (cores.length && String(cores[indice % cores.length]).toUpperCase() === valor.toUpperCase()) return '';
  }
  return valor;
}
