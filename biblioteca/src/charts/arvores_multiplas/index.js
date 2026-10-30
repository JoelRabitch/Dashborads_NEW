/**
 * arvores_multiplas — "Múltiplas Árvores".
 *
 * Uma árvore pequena por ramo de primeiro nível, lado a lado numa grade.
 * Serve para comparar a FORMA de cada ramo — qual é mais profundo, qual
 * concentra o valor numa folha só — coisa que a árvore radial única não
 * mostra bem quando há muitos ramos.
 *
 * Cada mini-árvore usa o layout horizontal (da esquerda para a direita),
 * que aproveita melhor uma célula larga e baixa do que um círculo.
 *
 * Campos: uma dimensão por nível (ou um par id/superior) e, opcional, uma
 * medida para o tamanho dos nós (seção Dados).
 *
 * Opções (correções v2): o bloco "Rótulos" inteiro vale para os nomes dos
 * nós (ver `textoDoRotuloDoNo` em _arvore); a aba Cores vale para os nós
 * (paleta com "Inverter ordem", "Cor dos nós" por ramo/nível/única,
 * opacidade e contorno); as ligações usam a cor de borda do tema. O
 * tooltip é o único do gráfico (`ctx.tooltip()`), com o valor no formato
 * do campo.
 *
 * Expandir/colapsar (Fase C das correções v2):
 *   - clique num nó COM filhos expande ou colapsa os filhos dele (com
 *     animação de entrada dos que reaparecem); o nó colapsado mostra "+",
 *     o expandido mostra "−", e o valor dele passa a ser o total do ramo;
 *   - clique num nó SEM filhos segue a "Ação do clique" (drill do Looker,
 *     fixar o tooltip ou nada). Shift+clique fixa o tooltip em qualquer nó;
 *   - botões "Expandir tudo" e "Colapsar tudo" no topo;
 *   - opção "Níveis abertos no início" (0 = tudo aberto);
 *   - o estado (o que está aberto) sobrevive aos redesenhos e às
 *     atualizações; só volta ao inicial quando a opção de nível muda.
 *
 * Espaçamento (v3.2, `layoutHorizontalEstavel` em _arvore): a distância
 * entre níveis vem do maior rótulo de cada nível + ícone + folga, medida
 * no ramo COMPLETO — abrir/fechar não move os níveis visíveis. Cada linha
 * tem max(ícone, texto) + folga e a célula rola quando não cabe. Opções
 * novas: "Tamanho do ícone" (`tamanhoDoIcone`, 0 = automático) e "Ajuste
 * de escala" (`ajusteDeEscala`: real com rolagem, padrão, ou ajustar à
 * área com a fonte mínima do "Texto longo").
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { formatadorDeValueFormat } from '../../core/format.js';
import { lerTextoLongo } from '../../core/texto-longo.js';
import { hierarchy as d3Hierarchy } from 'd3-hierarchy';
import {
  construirHierarquia,
  opcoesDeHierarquia,
  opcoesDinamicasDeHierarquia,
} from '../../core/hierarquia.js';
import {
  montarOpcoes,
  comDefaults,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  sanitizarChave,
} from '../../core/options-kit.js';
import {
  CSS_ARVORE,
  opcoesDeArvore,
  layoutHorizontalEstavel,
  escalaDeAjuste,
  desenharArvore,
  criarCoresDaArvore,
  montarLinhas,
} from '../_arvore/index.js';
import { lerRotulos } from '../../core/rotulos.js';
import { criarIconePorValor } from '../../core/icone-por-valor.js';
import {
  opcoesComunsDasArvores,
  criarBarraDaArvore,
  animacaoDeExpandir,
  animarAbrirFechar,
  planoDeCentralizacao,
  deveCentralizar,
  CSS_BARRA,
  CSS_ANIMACAO_ARVORE,
} from '../_arvore/comum.js';

/** Acima disso cada árvore fica pequena demais para dizer alguma coisa. */
const MAXIMO_DE_ARVORES = 24;

export default defineViz({
  id: 'arvores_multiplas',
  label: 'Múltiplas Árvores',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeHierarquia(),
      opcoesDeArvore({ layoutPadrao: 'cluster' }),
      {
        colunasDaGrade: {
          type: 'number',
          label: 'Colunas (0 = ajustar ao tamanho)',
          section: 'Grade',
          display: 'range',
          min: 0,
          max: 8,
          step: 1,
          default: 0,
        },
        larguraMinimaDaArvore: {
          type: 'number',
          label: 'Largura mínima de cada árvore (px)',
          section: 'Grade',
          display: 'range',
          min: 120,
          max: 600,
          step: 20,
          default: 260,
        },
        alturaDaArvore: {
          type: 'number',
          label: 'Altura de cada árvore (px)',
          section: 'Grade',
          display: 'range',
          min: 80,
          max: 600,
          step: 20,
          default: 200,
        },
        escalaPorArvore: {
          type: 'boolean',
          label: 'Cada árvore com o próprio tamanho de nó (deixa de ser comparável)',
          section: 'Grade',
          default: false,
        },
        // Novas na Fase C (correções v2).
        nivelInicialExpandido: {
          type: 'number',
          label: 'Níveis abertos no início (0 = tudo aberto)',
          section: 'Árvore',
          display: 'range',
          min: 0,
          max: 8,
          step: 1,
          default: 0,
        },
        // Grade (5.12, v3). Largura/altura por árvore são dinâmicas.
        espacoHorizontalDaGrade: { type: 'number', label: 'Espaço entre colunas (px)', section: 'Grade', default: 0 },
        espacoVerticalDaGrade: { type: 'number', label: 'Espaço entre linhas (px)', section: 'Grade', default: 0 },
        linhasGuiaDaGrade: { type: 'boolean', label: 'Linhas-guia da grade', section: 'Grade', default: false },
      },
      // 5.8–5.11 (v3): opções comuns às árvores e ao organograma.
      opcoesComunsDasArvores({ comCadaArvore: true })
    ),
    {
      // Em árvore pequena só cabe o nome da folha.
      mostrarRotulosInternos: false,
      tamanhoDoNo: 3,
    }
  ),
  exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo, config }) {
    const saida = opcoesDinamicasDeHierarquia(modelo);
    // 5.12 (v3): largura e altura por árvore (0 = a padrão), como cor_<série>.
    try {
      const { raiz } = construirHierarquia(modelo, config);
      for (const ramo of ((raiz && raiz.children) || []).slice(0, MAXIMO_DE_ARVORES)) {
        const k = sanitizarChave(ramo.data.rotulo);
        saida[`largura_${k}`] = { type: 'number', label: `Largura — ${ramo.data.rotulo}`, section: 'Grade', default: 0 };
        saida[`altura_${k}`] = { type: 'number', label: `Altura — ${ramo.data.rotulo}`, section: 'Grade', default: 0 };
      }
    } catch (_) {
      /* sem hierarquia: sem opções por árvore */
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz: elementoRaiz, largura, estado } = ctx;

    const { raiz, avisos, campoDoValor, quantidadeDeNos } = construirHierarquia(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (!raiz || quantidadeDeNos < 2) {
      ctx.mostrarVazio(
        'Não consegui montar uma hierarquia. Use várias dimensões (uma por nível) ' +
          'ou um par de campos id/superior, e confira a seção Dados.'
      );
      return;
    }

    let ramos = raiz.children || [];
    if (!ramos.length) {
      ctx.mostrarVazio('A hierarquia tem um nó só: não há ramos para comparar.');
      return;
    }

    if (ramos.length > MAXIMO_DE_ARVORES) {
      ctx.avisar(
        `A hierarquia tem ${ramos.length} ramos; mostrando os ${MAXIMO_DE_ARVORES} maiores para as árvores continuarem legíveis.`
      );
      ramos = ramos.slice(0, MAXIMO_DE_ARVORES);
    }

    ctx.limparRaiz();
    injetarEstilo(elementoRaiz, CSS_ARVORE + CSS_EXPANDIR + CSS_BARRA + CSS_ANIMACAO_ARVORE, 'av');
    const tl = lerTextoLongo(config);
    if (!tl.selecionavel) elementoRaiz.classList.add('am-sem-selecao');
    else elementoRaiz.classList.remove('am-sem-selecao');

    // ---------- Estado de expandir/colapsar ----------
    const nivelInicial = Math.max(0, Number(config.nivelInicialExpandido) || 0);
    if (!estado.recolhidos || estado.nivelAplicado !== nivelInicial) {
      estado.recolhidos = recolhidosIniciais(ramos, nivelInicial);
      estado.nivelAplicado = nivelInicial;
    }
    const recolhidos = estado.recolhidos;
    const alternado = estado.ultimoAlternado || null;
    estado.ultimoAlternado = null;
    const animacao = animacaoDeExpandir(config);
    const centralizarAgora = deveCentralizar(config, {
      primeiro: !estado.jaCentralizou,
      alternou: !!alternado,
      botao: !!estado.centralizarAgora,
    });
    estado.centralizarAgora = false;
    if (!estado.posicoesPorArvore) estado.posicoesPorArvore = new Map();
    if (!estado.rolagemDasCelulas) estado.rolagemDasCelulas = new Map();

    criarBarraDaArvore({
      ctx,
      pai: elementoRaiz,
      config,
      tema,
      aoExpandir: () => {
        recolhidos.clear();
        estado.ultimoAlternado = '*';
        ctx.redesenhar();
      },
      aoColapsar: () => {
        recolhidos.clear();
        for (const ramo of ramos) for (const n of ramo.descendants()) if (n !== ramo && temFilhos(n.data)) recolhidos.add(chaveDoNo(n));
        estado.ultimoAlternado = '*';
        ctx.redesenhar();
      },
      aoCentralizar: () => {
        estado.centralizarAgora = true;
        ctx.redesenhar();
      },
    });

    // ---------- Grade (5.12) ----------
    const espacoH = Math.max(0, Number(config.espacoHorizontalDaGrade) || 0);
    const espacoV = Math.max(0, Number(config.espacoVerticalDaGrade) || 0);
    const grade = criarEl('div', { classe: 'md-grade', pai: elementoRaiz });
    grade.style.display = 'flex';
    grade.style.flexWrap = 'wrap';
    grade.style.alignContent = 'flex-start';
    grade.style.columnGap = `${espacoH}px`;
    grade.style.rowGap = `${espacoV}px`;
    // Centralizar o conjunto (5.10): a grade se alinha na horizontal.
    const alinhH = config.alinhamentoHorizontalDaArvore || 'centro';
    grade.style.justifyContent = alinhH === 'esquerda' ? 'flex-start' : alinhH === 'direita' ? 'flex-end' : 'center';
    grade.style.width = '100%';
    grade.style.flex = '1 1 auto';
    grade.style.minHeight = '0';
    grade.style.overflow = 'auto';
    elementoRaiz.style.display = 'flex';
    elementoRaiz.style.flexDirection = 'column';

    const larguraMinima = Number(config.larguraMinimaDaArvore) || 260;
    const colunasPedidas = Number(config.colunasDaGrade) || 0;
    const colunas =
      colunasPedidas > 0
        ? colunasPedidas
        : Math.max(1, Math.min(ramos.length, Math.floor((largura + espacoH) / (larguraMinima + espacoH)) || 1));
    const larguraPadrao = Math.max(120, Math.floor((largura - espacoH * (colunas - 1)) / colunas));
    const alturaPadrao = Number(config.alturaDaArvore) || 200;

    // A cor sai da árvore INTEIRA, não de cada ramo: assim um ramo tem a
    // mesma cor aqui e na árvore radial do mesmo dado.
    const cores = criarCoresDaArvore(raiz, config, tema);
    // Valor derivado (soma do ramo): formato do campo no Looker, nunca o
    // número cru — e independente das opções de RÓTULO (que valem só para
    // o texto desenhado).
    const valueFormat = campoDoValor ? campoDoValor.valueFormat : undefined;
    const formatar = formatadorDeValueFormat(valueFormat);

    // Tooltip ÚNICO do gráfico (o núcleo cria uma vez e esconde a cada redesenho).
    const tooltip = ctx.tooltip();

    // Referência comum do tamanho dos nós: sem ela, a maior folha de cada
    // ramo fica do mesmo tamanho e a comparação entre ramos some.
    const maiorGlobal = raiz.value || 1;
    const espacoDoTitulo = 18;
    const semRotulos = config.mostrarRotulos === false || config.mostrarRotulosDeFolha === false;
    const iconePorValor = criarIconePorValor(config);

    for (const ramo of ramos) {
      const chaveDoRamo = chaveDoNo(ramo);
      // Largura e altura por árvore (opções dinâmicas; 0 = a padrão).
      const larguraDaCelula = Number(config[`largura_${sanitizarChave(ramo.data.rotulo)}`]) || larguraPadrao;
      const alturaDaCelula = Number(config[`altura_${sanitizarChave(ramo.data.rotulo)}`]) || alturaPadrao;

      const celula = criarEl('div', { pai: grade, classe: 'am-celula' });
      celula.style.width = `${larguraDaCelula}px`;
      celula.style.height = `${alturaDaCelula}px`;
      celula.style.flex = '0 0 auto';
      celula.style.display = 'flex';
      celula.setAttribute('data-arvore', chaveDoRamo);
      if (config.linhasGuiaDaGrade === true) celula.style.outline = `1px dashed ${tema.borda}`;

      // Cada ramo vira a raiz de uma árvore própria, senão o layout do d3
      // reserva espaço para os irmãos que não estão nesta célula.
      // Cor de cada nó vem do nó equivalente na árvore INTEIRA: assim "Cor
      // dos nós" por nível funciona (antes toda a mini-árvore recebia a cor
      // do ramo, e "por nível" não mudava nada).
      const globalPorDados = new Map(ramo.descendants().map((n) => [n.data, n]));
      const chavePorDados = new Map(ramo.descendants().map((n) => [n.data, chaveDoNo(n)]));
      const estaRecolhido = (dados) => recolhidos.has(chavePorDados.get(dados));

      // Nó colapsado vira folha com o TOTAL do ramo dele (vem da árvore
      // inteira), para o tamanho continuar comparável.
      const subRaiz = d3Hierarchy(ramo.data, (no) => (estaRecolhido(no) ? null : no.filhos))
        .sum((no) => {
          if (estaRecolhido(no)) {
            const global = globalPorDados.get(no);
            return global ? global.value || 0 : no.valor || 0;
          }
          return no.filhos && no.filhos.length ? 0 : no.valor || 0;
        })
        .sort((a, b) => (b.value || 0) - (a.value || 0));
      const corDoNo = (no) => cores(globalPorDados.get(no.data) || ramo);

      // ---------- Layout estável (v3.2) ----------
      // Os níveis ficam a uma distância que cabe o maior rótulo + ícone +
      // folga, calculada sobre o ramo COMPLETO: abrir ou fechar um nó não
      // move os níveis já visíveis. Se não couber na célula, vale o modo do
      // "Texto longo" (5.11): "Mostrar inteiro" cresce com rolagem; os
      // outros modos ajustam o rótulo à largura disponível.
      const margemDireita = semRotulos ? 0 : tl.margemExtra;
      const plano = layoutHorizontalEstavel({
        visivel: subRaiz,
        completa: ramo,
        config,
        tema,
        valueFormat,
        total: maiorGlobal,
        maiorValor: config.escalaPorArvore ? ramo.value || 1 : maiorGlobal,
        larguraUtil: larguraDaCelula - margemDireita,
        alturaUtil: alturaDaCelula - espacoDoTitulo - 12,
        temFilhos: (n) => temFilhos(n.data),
        temIcone: (n) => !!(iconePorValor && iconePorValor(n.data.rotulo)),
      });
      const limite = plano.limiteDoRotulo;
      // Centralizar (5.10) pela largura do ramo COMPLETO, que não muda ao
      // abrir/fechar: assim a árvore não "pula" para o lado.
      const larguraCompleta = plano.largura + margemDireita;
      const sobra = Math.max(0, larguraDaCelula - larguraCompleta);
      const deslocX =
        config.centralizarCadaArvore === false || alinhH === 'esquerda' ? 0 : alinhH === 'direita' ? sobra : sobra / 2;
      let larguraDoSvg = Math.max(larguraDaCelula, deslocX + plano.larguraVisivel + margemDireita);
      let alturaDoSvg = Math.max(alturaDaCelula, espacoDoTitulo + plano.altura + 12);
      // "Ajuste de escala" (v3.2): tamanho real com rolagem (padrão) ou
      // reduzido para caber, sem a fonte passar da mínima.
      const escala = escalaDeAjuste(config, {
        area: { largura: larguraDaCelula, altura: alturaDaCelula },
        desenho: { largura: larguraDoSvg, altura: alturaDoSvg },
        fonte: lerRotulos(config, tema).tamanho,
      });
      const viewBox = `0 0 ${larguraDoSvg} ${alturaDoSvg}`;
      larguraDoSvg *= escala;
      alturaDoSvg *= escala;

      const svg = criarSvgEl('svg', {
        pai: celula,
        atributos: {
          width: larguraDoSvg,
          height: alturaDoSvg,
          viewBox,
        },
      });
      svg.style.display = 'block';
      svg.style.flex = '0 0 auto';

      const titulo = criarSvgEl('text', {
        pai: svg,
        classe: 'av-titulo-arvore',
        atributos: {
          x: 8,
          y: 12,
          'font-size': Math.max(9, tema.tamanhoBase - 1),
          fill: cores(ramo),
        },
      });
      definirTexto(titulo, `${ramo.data.rotulo} (${formatar(ramo.value || 0)})`);

      const desenho = desenharArvore({
        svg,
        raiz: subRaiz,
        modo: 'horizontal',
        deslocamento: { x: deslocX, y: espacoDoTitulo },
        config,
        valorDeReferencia: config.escalaPorArvore ? null : maiorGlobal,
        tema,
        valueFormat,
        totalGeral: maiorGlobal,
        cores: corDoNo,
        compacto: true,
        chaveDe: (n) => chavePorDados.get(n.data),
        limiteDoRotulo: limite,
        geometria: { ladoDoIcone: plano.ladoDoIcone, comIndicador: (n) => temFilhos(n.data) },
        aoInteragir(elemento, no) {
          const conteudo = () => ({
            titulo: `${ramo.data.rotulo} › ${no.data.rotulo}`,
            linhas: montarLinhas(no, campoDoValor, formatar),
          });
          if (tooltip) {
            ctx.eventos.on(elemento, 'pointerenter', (ev) => tooltip.mostrar(conteudo(), ev.clientX, ev.clientY));
            ctx.eventos.on(elemento, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
            ctx.eventos.on(elemento, 'pointerleave', () => tooltip.esconder());
          }
          const chave = chavePorDados.get(no.data);
          const comFilhos = temFilhos(no.data);
          elemento.setAttribute('data-item', chave);
          if (estado.selecionado === chave) elemento.setAttribute('data-selecionado', '1');
          if (comFilhos) {
            elemento.setAttribute('data-recolhido', estaRecolhido(no.data) ? '1' : '0');
            elemento.style.cursor = 'pointer';
            desenharIndicador(elemento, estaRecolhido(no.data), tema);
          }
          // Nó com filhos: expande/colapsa. Nó sem filhos: "Ação do clique"
          // (drill se a célula tem links, ou nada). Shift+clique fixa o
          // tooltip em qualquer nó.
          ctx.eventos.on(elemento, 'click', (ev) => {
            estado.selecionado = chave;
            if (comFilhos && !ev.shiftKey) {
              if (recolhidos.has(chave)) recolhidos.delete(chave);
              else recolhidos.add(chave);
              estado.ultimoAlternado = chave;
              ctx.redesenhar();
              return;
            }
            const celulaDoLooker =
              no.data.indiceDaLinha >= 0 && no.data.campo
                ? modelo.celula(modelo.linhas[no.data.indiceDaLinha], no.data.campo.nome)
                : null;
            ctx.cliqueNoItem(ev, celulaDoLooker, conteudo());
          });
        },
      });

      // ---------- Abrir/fechar animado (5.9) ----------
      const atuais = subRaiz.descendants().map((n) => ({
        chave: chavePorDados.get(n.data),
        el: n.__grupo,
        x: n.__xy.x,
        y: n.__xy.y,
        pai: n.parent ? chavePorDados.get(n.parent.data) : null,
      }));
      const mudouAqui = alternado === '*' || (alternado && (alternado === chaveDoRamo || alternado.startsWith(`${chaveDoRamo}›`)));
      estado.posicoesPorArvore.set(
        chaveDoRamo,
        animarAbrirFechar({
          ctx,
          anteriores: estado.posicoesPorArvore.get(chaveDoRamo),
          atuais,
          camadaDosFantasmas: desenho.grupo,
          anim: animacao,
          alternado: mudouAqui ? alternado : null,
        })
      );

      // ---------- Centralizar na célula (5.10) ----------
      const rolagemGuardada = estado.rolagemDasCelulas.get(chaveDoRamo);
      if (centralizarAgora && (larguraDoSvg > larguraDaCelula || alturaDoSvg > alturaDaCelula)) {
        const alvoNo =
          config.oQueCentralizar === 'raiz'
            ? subRaiz
            : config.oQueCentralizar === 'selecionado'
              ? subRaiz.descendants().find((n) => chavePorDados.get(n.data) === estado.selecionado) || null
              : null;
        const centro = planoDeCentralizacao({
          area: { largura: larguraDaCelula, altura: alturaDaCelula },
          desenho: { largura: larguraDoSvg, altura: alturaDoSvg },
          alvo: alvoNo ? { x: alvoNo.__xy.x * escala, y: alvoNo.__xy.y * escala } : null,
          config,
        });
        celula.scrollLeft = centro.scrollLeft;
        celula.scrollTop = centro.scrollTop;
      } else if (rolagemGuardada) {
        celula.scrollLeft = rolagemGuardada.x;
        celula.scrollTop = rolagemGuardada.y;
      }
      ctx.eventos.on(celula, 'scroll', () => estado.rolagemDasCelulas.set(chaveDoRamo, { x: celula.scrollLeft, y: celula.scrollTop }));
    }
    if (centralizarAgora) estado.jaCentralizou = true;
  },
});

/* ------------------------------------------------------------------ */
/* Expandir / colapsar                                                  */
/* ------------------------------------------------------------------ */

const CSS_EXPANDIR = `
.am-indicador{pointer-events:none;font-weight:700;}
@keyframes bl-surgir{from{opacity:0}to{opacity:1}}
`;

function temFilhos(dados) {
  return !!(dados && dados.filhos && dados.filhos.length);
}

/** Chave estável do nó: o caminho de rótulos desde o ramo. */
export function chaveDoNo(no) {
  const caminho = [];
  for (let n = no; n && n.depth >= 1; n = n.parent) caminho.unshift(String(n.data.rotulo));
  return caminho.join('›');
}

/**
 * Nós recolhidos no início: com N níveis abertos, todo nó com filhos a
 * partir da profundidade N (contada dentro do ramo, que é a raiz da mini
 * árvore) começa recolhido. 0 = tudo aberto.
 */
export function recolhidosIniciais(ramos, niveisAbertos) {
  const saida = new Set();
  if (!niveisAbertos) return saida;
  for (const ramo of ramos) {
    for (const n of ramo.descendants()) {
      const profundidadeNoRamo = n.depth - ramo.depth;
      if (temFilhos(n.data) && profundidadeNoRamo >= niveisAbertos) saida.add(chaveDoNo(n));
    }
  }
  return saida;
}

/** "+" (recolhido) ou "−" (aberto) ao lado do nó. */
function desenharIndicador(marcador, recolhido, tema) {
  const pai = marcador.parentNode;
  if (!pai) return;
  const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(marcador.getAttribute('transform') || '');
  if (!m) return;
  // Depois do ícone (se houver), não por baixo dele (v3.2).
  const raio = Number(marcador.getAttribute('data-meia')) || (Number(marcador.getAttribute('data-diametro')) || 6) / 2;
  const t = criarSvgEl('text', {
    pai,
    classe: 'am-indicador',
    atributos: {
      x: Number(m[1]) - raio - 3,
      y: Number(m[2]),
      'text-anchor': 'end',
      'dominant-baseline': 'central',
      'font-size': 11,
      fill: tema.textoSuave || tema.texto,
    },
  });
  definirTexto(t, recolhido ? '+' : '−');
}
