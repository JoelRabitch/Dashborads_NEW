/**
 * arc_diagram — "Diagrama de Arcos".
 *
 * Os nós numa linha e arcos ligando quem se relaciona: o grafo achatado
 * numa dimensão só. Serve para "quem fala com quem" quando a rede é
 * pequena o bastante para caber numa fileira.
 *
 * **A ordem dos nós é o gráfico inteiro.** Na ordem alfabética o diagrama
 * é espaguete e não se vê estrutura nenhuma; reordenando por grau ou por
 * vizinhança, os blocos conectados aparecem — e são os MESMOS dados. Por
 * isso a ordem é escolhível, é declarada na tela, e o número de
 * cruzamentos vai publicado junto: é a medida objetiva de quanto o
 * desenho está legível.
 *
 * **E se o grafo for dirigido, isso precisa ser dito.** Um arco sem
 * direção lido como dirigido inverte relações — "A → B" vira "B → A" sem
 * que nada no desenho mude. Aqui, no modo dirigido, a ida fica acima da
 * linha e a volta abaixo, e a nota explica.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import { larguraAproximada } from '../../core/eixos.js';
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
.ad-area{position:relative;width:100%;height:100%;overflow:hidden;}
.ad-svg{position:absolute;left:0;top:0;}
.ad-arco{fill:none;cursor:default;}
.ad-no{cursor:default;}
.ad-rotulo{pointer-events:none;}
.ad-linha{pointer-events:none;}
.ad-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;pointer-events:none;}
`;

/** Acima disso os nós ficam a menos de 8 px e os rótulos não cabem. */
const MAXIMO_DE_NOS = 80;

/** Acima disso os arcos se somam numa mancha e nada é seguível. */
const MAXIMO_DE_ARESTAS = 400;

export default defineViz({
  id: 'arc_diagram',
  label: 'Diagrama de Arcos',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        ordemDosNos: {
          type: 'string',
          label: 'Ordem dos nós',
          section: 'Arcos',
          display: 'select',
          default: 'vizinhanca',
          values: listaDeValores([
            { rotulo: 'Automática: vizinhos juntos (menos cruzamentos)', valor: 'vizinhanca' },
            { rotulo: 'Pelo grau (mais conectados primeiro)', valor: 'grau' },
            { rotulo: 'Pelo peso total', valor: 'peso' },
            { rotulo: 'Alfabética', valor: 'alfabetica' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
          ]),
        },
        dirigido: {
          type: 'boolean',
          label: 'Grafo dirigido (ida acima da linha, volta abaixo)',
          section: 'Arcos',
          default: false,
        },
        espessuraMaxima: {
          type: 'number',
          label: 'Espessura do arco mais grosso (px)',
          section: 'Arcos',
          display: 'range',
          min: 1,
          max: 24,
          step: 1,
          default: 8,
        },
        opacidadeDoArco: {
          type: 'number',
          label: 'Opacidade dos arcos',
          section: 'Arcos',
          display: 'range',
          min: 0.05,
          max: 1,
          step: 0.05,
          default: 0.4,
        },
        tamanhoDoNo: {
          type: 'number',
          label: 'Diâmetro do nó mais conectado (px)',
          section: 'Arcos',
          display: 'range',
          min: 4,
          max: 32,
          step: 1,
          default: 14,
        },
        rotacaoDosRotulos: {
          type: 'number',
          label: 'Rotação dos nomes (graus)',
          section: 'Rótulos',
          display: 'range',
          min: 0,
          max: 90,
          step: 15,
          default: 45,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length >= 2) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDaOrigem', 'Dimensão de origem', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        }),
        opcaoDeEscolhaDeCampo('campoDoDestino', 'Dimensão de destino', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[1].nome,
        })
      );
    }
    if (medidas.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoPeso', 'Medida do peso da ligação', medidas, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: '',
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { config, tema, raiz, largura, altura } = ctx;

    const leitura = lerGrafo(ctx);
    if (leitura.erro) {
      ctx.mostrarVazio(leitura.erro);
      return;
    }
    let { nos, arestas } = leitura;
    const { medida, campoDaOrigem, campoDoDestino, autoLigacoes } = leitura;

    if (nos.length > MAXIMO_DE_NOS) {
      ctx.avisar(
        `O grafo tem ${nos.length} nós. Mostrando os ${MAXIMO_DE_NOS} mais conectados: ` +
          'acima disso eles ficam a menos de 8 px um do outro e os nomes não cabem.'
      );
      const mantidos = new Set(
        nos.slice().sort((a, b) => b.grau - a.grau).slice(0, MAXIMO_DE_NOS).map((n) => n.chave)
      );
      nos = nos.filter((n) => mantidos.has(n.chave));
      arestas = arestas.filter((a) => mantidos.has(a.de) && mantidos.has(a.para));
    }
    if (arestas.length > MAXIMO_DE_ARESTAS) {
      ctx.avisar(
        `O grafo tem ${arestas.length} ligações. Mostrando as ${MAXIMO_DE_ARESTAS} mais pesadas: ` +
          'acima disso os arcos se somam numa mancha e nenhum é seguível.'
      );
      arestas = arestas.slice().sort((a, b) => b.peso - a.peso).slice(0, MAXIMO_DE_ARESTAS);
    }

    ordenarNos({ nos, arestas, modo: config.ordemDosNos });
    const indicePorChave = new Map(nos.map((n, i) => [n.chave, i]));

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'ad');
    const area = criarEl('div', { classe: 'ad-area', pai: raiz });

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatar = medida
      ? formatadorDeValueFormat(medida.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 })
      : (v) => Math.round(v).toLocaleString('pt-BR');

    const fonte = Math.max(8, tema.tamanhoBase - 1);
    const dirigido = config.dirigido === true;
    const rotacao = Number(config.rotacaoDosRotulos) || 0;
    const maiorRotulo = nos.reduce((a, n) => Math.max(a, larguraAproximada(truncar(n.rotulo, 18), fonte)), 0);
    const espacoDosRotulos = rotacao
      ? Math.min(altura * 0.35, maiorRotulo * Math.sin((rotacao * Math.PI) / 180) + fonte + 8)
      : fonte + 10;

    const margemLateral = 24;
    const alturaDeCima = dirigido ? (altura - espacoDosRotulos) * 0.55 : altura - espacoDosRotulos - 10;
    const yDaLinha = Math.max(30, alturaDeCima);
    const alturaDeBaixo = Math.max(10, altura - espacoDosRotulos - yDaLinha);

    const passo = nos.length > 1 ? (largura - margemLateral * 2) / (nos.length - 1) : 0;
    const x = (i) => margemLateral + i * passo;

    const svg = criarSvgEl('svg', {
      pai: area,
      classe: 'ad-svg',
      atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` },
    });

    criarSvgEl('line', {
      pai: svg,
      classe: 'ad-linha',
      atributos: {
        x1: margemLateral - 6, x2: largura - margemLateral + 6, y1: yDaLinha, y2: yDaLinha,
        stroke: tema.borda, 'stroke-width': 1,
      },
    });

    // ---------- Arcos ----------
    const maiorPeso = Math.max(...arestas.map((a) => a.peso), 1);
    const espessuraMaxima = Math.max(1, Number(config.espessuraMaxima) || 8);
    const opacidade = Number(config.opacidadeDoArco) || 0.4;
    const paleta = coresDaPaleta(config.paleta);

    nos.forEach((no, i) => {
      no.indice = i;
      no.cor = paleta[i % paleta.length];
    });

    const desenhados = [];
    for (const aresta of arestas) {
      const i = indicePorChave.get(aresta.de);
      const j = indicePorChave.get(aresta.para);
      if (i === undefined || j === undefined) continue;

      const espessura = Math.max(0.6, (aresta.peso / maiorPeso) * espessuraMaxima);
      // No modo dirigido, a VOLTA vai para baixo da linha: é o que
      // distingue "A → B" de "B → A" sem precisar de setas minúsculas.
      const paraBaixo = dirigido && j < i;
      const alturaDisponivel = paraBaixo ? alturaDeBaixo : yDaLinha;

      const elemento = criarSvgEl('path', {
        pai: svg,
        classe: 'ad-arco',
        atributos: {
          d:
            i === j
              ? caminhoDeAutoLigacao({ x: x(i), y: yDaLinha, raio: Math.min(18, passo * 0.4 || 12), paraBaixo })
              : caminhoDoArco({ x1: x(i), x2: x(j), y: yDaLinha, alturaMaxima: alturaDisponivel, paraBaixo }),
          stroke: nos[i].cor,
          'stroke-width': espessura,
          opacity: opacidade,
          'data-de': aresta.de,
          'data-para': aresta.para,
        },
      });
      desenhados.push({ elemento, aresta, de: nos[i], para: nos[j] });
    }

    // ---------- Nós ----------
    const maiorGrau = Math.max(...nos.map((n) => n.grau), 1);
    const diametro = Math.max(4, Number(config.tamanhoDoNo) || 14);

    nos.forEach((no, i) => {
      // O raio sai da RAIZ do grau, pelo mesmo motivo das bolhas: o olho
      // lê área, e o raio direto exageraria o nó mais conectado.
      const raio = Math.max(2, (diametro / 2) * Math.sqrt(no.grau / maiorGrau));
      criarSvgEl('circle', {
        pai: svg,
        classe: 'ad-no',
        atributos: {
          cx: x(i), cy: yDaLinha, r: raio,
          fill: no.cor,
          stroke: tema.fundo,
          'stroke-width': 1,
          'data-chave': no.chave,
        },
      });

      const yDoRotulo = yDaLinha + alturaDeBaixo + 10;
      const texto = criarSvgEl('text', {
        pai: svg,
        classe: 'ad-rotulo',
        atributos: {
          x: x(i),
          y: yDoRotulo,
          'text-anchor': rotacao ? 'end' : 'middle',
          'font-size': fonte,
          fill: tema.texto,
          transform: rotacao ? `rotate(${-rotacao} ${x(i)} ${yDoRotulo})` : null,
        },
      });
      definirTexto(texto, truncar(no.rotulo, 18));
    });

    // ---------- Nota ----------
    const cruzamentos = contarCruzamentosDeArcos(arestas, indicePorChave);
    const nota = criarEl('div', { classe: 'ad-nota', pai: area });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        `${nos.length} nós · ${arestas.length} ligações · ${cruzamentos} cruzamento(s)`,
        `ordem ${nomeDaOrdem(config.ordemDosNos)}`,
        medida ? `espessura por ${medida.rotuloCurto}` : 'espessura por número de linhas',
        dirigido
          ? 'grafo DIRIGIDO: ida acima da linha, volta abaixo'
          : 'grafo NÃO dirigido: o arco não diz quem procurou quem',
        autoLigacoes > 0 ? `${autoLigacoes} auto-ligação(ões) desenhadas como laço` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    for (const arco of desenhados) {
      ctx.eventos.on(arco.elemento, 'pointerenter', (ev) => {
        arco.elemento.setAttribute('opacity', Math.min(1, opacidade + 0.45));
        if (!tooltip) return;
        tooltip.mostrar(
          {
            titulo: dirigido
              ? `${arco.de.rotulo} → ${arco.para.rotulo}`
              : `${arco.de.rotulo} — ${arco.para.rotulo}`,
            linhas: [
              { rotulo: campoDaOrigem.rotuloCurto, valor: arco.de.rotulo, cor: arco.de.cor },
              { rotulo: campoDoDestino.rotuloCurto, valor: arco.para.rotulo },
              { rotulo: medida ? medida.rotuloCurto : 'Linhas', valor: formatar(arco.aresta.peso) },
              ...(dirigido ? [] : [{ rotulo: 'Direção', valor: 'não dirigido: a ligação é mútua' }]),
            ],
          },
          ev.clientX,
          ev.clientY
        );
      });
      ctx.eventos.on(arco.elemento, 'pointerleave', () => {
        arco.elemento.setAttribute('opacity', opacidade);
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
  if (modo === 'grau') return 'pelo grau';
  if (modo === 'peso') return 'pelo peso';
  if (modo === 'alfabetica') return 'alfabética';
  if (modo === 'consulta') return 'da consulta';
  return 'automática (vizinhos juntos)';
}

/** Semicírculo achatado entre dois nós da linha. */
export function caminhoDoArco({ x1, x2, y, alturaMaxima, paraBaixo = false }) {
  const meio = (x1 + x2) / 2;
  const vao = Math.abs(x2 - x1);
  // A altura acompanha o vão, com teto: sem o teto, um arco entre as duas
  // pontas sairia da tela.
  const altura = Math.min(alturaMaxima * 0.95, vao / 2);
  const pico = paraBaixo ? y + altura : y - altura;
  return `M${x1},${y}Q${meio},${pico} ${x2},${y}`;
}

/** Laço para origem igual a destino: um círculo encostado no nó. */
export function caminhoDeAutoLigacao({ x, y, raio, paraBaixo = false }) {
  const sinal = paraBaixo ? 1 : -1;
  const r = Math.max(4, raio);
  return [
    `M${x - r / 2},${y}`,
    `C${x - r / 2},${y + sinal * r * 1.6} ${x + r / 2},${y + sinal * r * 1.6} ${x + r / 2},${y}`,
  ].join('');
}

/**
 * Lê o grafo a partir de pares (origem, destino).
 *
 * Arestas repetidas são somadas: duas linhas "A → B" com peso 3 e 5 viram
 * uma ligação de 8. Desenhá-las como dois arcos sobrepostos daria a
 * impressão de duas relações onde há uma.
 *
 * @returns {{nos, arestas, medida, campoDaOrigem, campoDoDestino, autoLigacoes}|{erro}}
 */
export function lerGrafo(ctx) {
  const { modelo, config } = ctx;

  const campoDaOrigem =
    modelo.dimensoes.find((d) => d.nome === config.campoDaOrigem) || modelo.dimensoes[0] || null;
  const campoDoDestino =
    modelo.dimensoes.find((d) => d.nome === config.campoDoDestino && d !== campoDaOrigem) ||
    modelo.dimensoes.find((d) => d !== campoDaOrigem) ||
    null;

  if (!campoDaOrigem || !campoDoDestino) {
    return {
      erro:
        'Um diagrama de arcos precisa de DUAS dimensões: a origem e o destino de cada ligação. ' +
        'Traga as duas no Explore.',
    };
  }

  const medida = config.campoDoPeso
    ? modelo.medidas.find((m) => m.nome === config.campoDoPeso) || null
    : null;

  const nosPorChave = new Map();
  const arestasPorChave = new Map();
  let autoLigacoes = 0;

  const registrarNo = (chave, rotulo) => {
    if (!nosPorChave.has(chave)) {
      nosPorChave.set(chave, { chave, rotulo, grau: 0, peso: 0, vizinhos: new Set() });
    }
    return nosPorChave.get(chave);
  };

  for (const linha of modelo.linhas) {
    const chaveDe = String(modelo.valorBruto(linha, campoDaOrigem.nome));
    const chavePara = String(modelo.valorBruto(linha, campoDoDestino.nome));
    if (chaveDe === 'null' || chavePara === 'null') continue;

    const peso = medida ? modelo.valorNumerico(linha, medida.nome) : 1;
    if (peso === null || !Number.isFinite(peso) || peso <= 0) continue;

    const de = registrarNo(chaveDe, modelo.texto(linha, campoDaOrigem.nome, undefined, '∅'));
    const para = registrarNo(chavePara, modelo.texto(linha, campoDoDestino.nome, undefined, '∅'));

    const chave = `${chaveDe} ${chavePara}`;
    const atual = arestasPorChave.get(chave);
    if (atual) atual.peso += peso;
    else arestasPorChave.set(chave, { de: chaveDe, para: chavePara, peso });

    de.peso += peso;
    para.peso += peso;
    if (chaveDe === chavePara) {
      autoLigacoes += 1;
    } else {
      de.vizinhos.add(chavePara);
      para.vizinhos.add(chaveDe);
    }
  }

  const nos = Array.from(nosPorChave.values());
  for (const no of nos) no.grau = no.vizinhos.size;

  const arestas = Array.from(arestasPorChave.values());
  if (!nos.length || !arestas.length) {
    return {
      erro: medida
        ? 'Nenhuma ligação tem peso positivo na medida escolhida.'
        : 'A consulta não trouxe pares de origem e destino.',
    };
  }

  return { nos, arestas, medida, campoDaOrigem, campoDoDestino, autoLigacoes };
}

/**
 * Ordena os nós da linha.
 *
 * `vizinhanca` é uma seriação gulosa: começa pelo nó mais conectado e vai
 * puxando sempre o vizinho ainda não colocado com mais ligações para quem
 * já está na fila. Não é ótima (minimizar cruzamentos de arcos é
 * NP-difícil), mas transforma espaguete em blocos — e o número de
 * cruzamentos, publicado na nota, deixa isso verificável.
 */
export function ordenarNos({ nos, arestas, modo = 'vizinhanca' }) {
  if (modo === 'consulta') return nos;

  if (modo === 'alfabetica') {
    nos.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
    return nos;
  }
  if (modo === 'grau') {
    nos.sort((a, b) => b.grau - a.grau || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
    return nos;
  }
  if (modo === 'peso') {
    nos.sort((a, b) => b.peso - a.peso || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
    return nos;
  }

  // --- Seriação por vizinhança ---
  const porChave = new Map(nos.map((n) => [n.chave, n]));
  const forca = new Map();
  for (const aresta of arestas) {
    if (aresta.de === aresta.para) continue;
    for (const [a, b] of [[aresta.de, aresta.para], [aresta.para, aresta.de]]) {
      if (!forca.has(a)) forca.set(a, new Map());
      forca.get(a).set(b, (forca.get(a).get(b) || 0) + aresta.peso);
    }
  }

  const restantes = new Set(nos.map((n) => n.chave));
  const ordem = [];

  const maisConectado = (candidatos) => {
    let melhor = null;
    for (const chave of candidatos) {
      const no = porChave.get(chave);
      if (!melhor || no.grau > melhor.grau || (no.grau === melhor.grau && no.peso > melhor.peso)) {
        melhor = no;
      }
    }
    return melhor;
  };

  while (restantes.size) {
    const inicio = maisConectado(restantes);
    ordem.push(inicio);
    restantes.delete(inicio.chave);

    // Puxa vizinhos enquanto houver: é o que mantém um bloco conectado
    // junto, em vez de espalhá-lo pela linha.
    let atual = inicio;
    for (;;) {
      const ligacoes = forca.get(atual.chave);
      if (!ligacoes) break;
      let proximo = null;
      let maior = -Infinity;
      for (const [chave, peso] of ligacoes) {
        if (!restantes.has(chave)) continue;
        if (peso > maior) {
          maior = peso;
          proximo = porChave.get(chave);
        }
      }
      if (!proximo) break;
      ordem.push(proximo);
      restantes.delete(proximo.chave);
      atual = proximo;
    }
  }

  nos.length = 0;
  nos.push(...ordem);
  return nos;
}

/**
 * Quantos pares de arcos se cruzam.
 *
 * Dois arcos do mesmo lado da linha se cruzam quando as pontas se
 * INTERCALAM: a < c < b < d. É a métrica objetiva de legibilidade do
 * diagrama — publicada na nota, e usada no teste para provar que a
 * ordenação automática funciona.
 */
export function contarCruzamentosDeArcos(arestas, indicePorChave) {
  const pares = [];
  for (const aresta of arestas) {
    const i = indicePorChave.get(aresta.de);
    const j = indicePorChave.get(aresta.para);
    if (i === undefined || j === undefined || i === j) continue;
    pares.push([Math.min(i, j), Math.max(i, j)]);
  }

  let conta = 0;
  for (let p = 0; p < pares.length; p++) {
    for (let q = p + 1; q < pares.length; q++) {
      const [a, b] = pares[p];
      const [c, d] = pares[q];
      if ((a < c && c < b && b < d) || (c < a && a < d && d < b)) conta += 1;
    }
  }
  return conta;
}
