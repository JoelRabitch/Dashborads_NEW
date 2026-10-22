/**
 * dot_plot_denso — "Dot Plot Denso".
 *
 * O gráfico de pontos de Cleveland, feito para MUITAS categorias e para
 * duas ou três medidas na mesma linha.
 *
 * Por que pontos e não barras: com 300 categorias, barras viram uma
 * mancha de tinta — a área pintada domina a tela e a diferença entre
 * categorias some. Um ponto por valor mantém a leitura e, o mais útil,
 * deixa espaço para várias medidas por linha, ligadas por um traço.
 *
 * **E aqui a regra do eixo é o CONTRÁRIO da do `barras_ranking_denso`.**
 * Lá a barra tem de começar em zero, sem opção, porque ela codifica
 * COMPRIMENTO e truncar a base distorce a proporção. Aqui o ponto codifica
 * POSIÇÃO: cortar o eixo é legítimo, e muitas vezes necessário para ver
 * qualquer diferença entre valores próximos. Mas o leitor treinado em
 * barras lê distância da borda — então, quando o eixo não começa em zero,
 * o gráfico diz isso em voz alta.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { criarTooltip } from '../../core/tooltip.js';
import {
  CSS_LISTA_VIRTUAL,
  criarListaVirtual,
  itemDoEvento,
} from '../_lista_virtual/index.js';
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
.dp-nome{flex:0 0 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dp-trilho{flex:1 1 auto;position:relative;height:100%;min-width:20px;}
.dp-ponto{position:absolute;top:50%;transform:translate(-50%,-50%);border-radius:50%;}
.dp-ligacao{position:absolute;top:50%;transform:translateY(-50%);height:2px;border-radius:1px;}
.dp-guia{position:absolute;top:0;bottom:0;width:1px;}
.dp-valor{position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap;font-variant-numeric:tabular-nums;}
.dp-escala{flex:0 0 auto;display:flex;padding:0 8px;font-size:10px;opacity:.75;}
.dp-escala span{flex:1 1 0;}
.dp-legenda{display:flex;gap:10px;align-items:center;font-size:11px;white-space:nowrap;}
.dp-chip{display:inline-flex;align-items:center;gap:4px;}
.dp-bolinha{width:8px;height:8px;border-radius:50%;display:inline-block;}
`;

const MAXIMO_DE_ITENS = 50000;

/** Mais do que isso numa linha vira confusão, não comparação. */
const MAXIMO_DE_MEDIDAS = 4;

export default defineViz({
  id: 'dot_plot_denso',
  label: 'Dot Plot Denso',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeTema(),
      blocoAvancado(),
      {
        comecarEmZero: {
          type: 'boolean',
          label: 'Começar o eixo em zero (desligue para ver diferenças pequenas)',
          section: 'Dot plot',
          default: false,
        },
        ordem: {
          type: 'string',
          label: 'Ordenar por',
          section: 'Dot plot',
          display: 'select',
          default: 'primeira',
          values: listaDeValores([
            { rotulo: 'Primeira medida (maior primeiro)', valor: 'primeira' },
            { rotulo: 'Primeira medida (menor primeiro)', valor: 'primeiraAsc' },
            { rotulo: 'Diferença entre a 1ª e a última medida', valor: 'diferenca' },
            { rotulo: 'Nome', valor: 'nome' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
          ]),
        },
        alturaDaLinha: {
          type: 'number',
          label: 'Altura de cada linha (px)',
          section: 'Dot plot',
          display: 'range',
          min: 12,
          max: 48,
          step: 1,
          default: 22,
        },
        tamanhoDoPonto: {
          type: 'number',
          label: 'Tamanho do ponto (px)',
          section: 'Dot plot',
          display: 'range',
          min: 4,
          max: 20,
          step: 1,
          default: 9,
        },
        ligarPontos: {
          type: 'boolean',
          label: 'Ligar os pontos da mesma linha',
          section: 'Dot plot',
          default: true,
        },
        mostrarGuias: {
          type: 'boolean',
          label: 'Linhas de guia verticais',
          section: 'Dot plot',
          default: true,
        },
        escreverValores: {
          type: 'string',
          label: 'Escrever os valores',
          section: 'Rótulos',
          display: 'select',
          default: 'nenhum',
          values: listaDeValores([
            { rotulo: 'Não escrever', valor: 'nenhum' },
            { rotulo: 'Só o da primeira medida', valor: 'primeira' },
            { rotulo: 'A diferença entre a 1ª e a última', valor: 'diferenca' },
          ]),
        },
        mostrarBusca: {
          type: 'boolean',
          label: 'Campo de busca por nome',
          section: 'Dot plot',
          default: true,
        },
        larguraDoNome: {
          type: 'number',
          label: 'Largura da coluna de nomes (px)',
          section: 'Formato',
          display: 'range',
          min: 60,
          max: 400,
          step: 10,
          default: 160,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoNome', 'Dimensão do nome', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    // Uma chave por medida: quais entram na linha é a primeira decisão.
    for (const medida of modelo.medidas) {
      saida[`usar_${medida.nome}`] = {
        type: 'boolean',
        label: `Incluir "${medida.rotuloCurto}"`,
        section: 'Medidas',
        default: true,
      };
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz } = ctx;

    const campoDoNome =
      modelo.dimensoes.find((d) => d.nome === config.campoDoNome) || modelo.dimensoes[0] || null;

    let medidas = modelo.medidas.filter((m) => config[`usar_${m.nome}`] !== false);
    if (!medidas.length) medidas = modelo.medidas.slice();

    if (!campoDoNome || !medidas.length) {
      ctx.mostrarVazio('Este gráfico precisa de uma dimensão (o nome) e de pelo menos uma medida.');
      return;
    }
    if (medidas.length > MAXIMO_DE_MEDIDAS) {
      ctx.avisar(
        `A consulta tem ${medidas.length} medidas. Mostrando as ${MAXIMO_DE_MEDIDAS} primeiras: ` +
          'mais pontos por linha viram confusão, não comparação. Escolha quais entram nas opções.'
      );
      medidas = medidas.slice(0, MAXIMO_DE_MEDIDAS);
    }

    if (modelo.linhas.length > MAXIMO_DE_ITENS) {
      ctx.mostrarVazio(
        `A consulta tem ${modelo.linhas.length.toLocaleString('pt-BR')} linhas, acima do limite de ` +
          `${MAXIMO_DE_ITENS.toLocaleString('pt-BR')}. Filtre ou agrupe no Explore.`
      );
      return;
    }

    // ---------- Itens ----------
    const itens = [];
    for (let i = 0; i < modelo.linhas.length; i++) {
      const valores = medidas.map((m) => modelo.valorNumerico(modelo.linhas[i], m.nome));
      if (valores.every((v) => v === null)) continue;
      itens.push({
        indiceDaLinha: i,
        nome: modelo.texto(modelo.linhas[i], campoDoNome.nome, undefined, '∅'),
        valores,
      });
    }

    if (!itens.length) {
      ctx.mostrarVazio('Nenhuma linha tem valor numérico nas medidas escolhidas.');
      return;
    }

    ordenarItens(itens, config.ordem);
    itens.forEach((item, i) => {
      item.posicao = i + 1;
    });

    // ---------- Escala ----------
    const planos = itens.flatMap((i) => i.valores).filter((v) => v !== null && Number.isFinite(v));
    const escala = montarEscala({ valores: planos, comecarEmZero: config.comecarEmZero === true });

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_LISTA_VIRTUAL + CSS, 'dp');

    const casas = Number(config.casasDecimaisDoRotulo);
    const formatadores = medidas.map((m) =>
      formatadorDeValueFormat(m.valueFormat, { casas: Number.isFinite(casas) ? casas : 1 })
    );
    const formatar = formatadores[0];

    const paleta = coresDaPaleta(config.paleta);
    const cores = medidas.map((_, i) => paleta[i % paleta.length]);

    const alturaDaLinha = Math.max(12, Number(config.alturaDaLinha) || 22);
    const larguraDoNome = Math.max(40, Number(config.larguraDoNome) || 160);
    const tamanhoDoPonto = Math.max(4, Number(config.tamanhoDoPonto) || 9);

    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    const lista = criarListaVirtual({
      ctx,
      itens,
      alturaDaLinha,
      comBusca: config.mostrarBusca !== false,
      rotuloDaBusca: `Buscar em ${campoDoNome.rotuloCurto}…`,
      textoDoItem: (item) => item.nome,
      montarLinha: (item) =>
        montarLinha({
          item, medidas, cores, escala, tamanhoDoPonto, larguraDoNome,
          tema, config, formatadores,
        }),
    });

    lista.raiz.classList.add('dp-raiz');
    lista.conteudo.classList.add('dp-conteudo');
    lista.contagem.classList.add('dp-contagem');
    lista.nota.classList.add('dp-nota');
    const campoDeBusca = lista.topo.querySelector('.lv-busca');
    if (campoDeBusca) campoDeBusca.classList.add('dp-busca');

    // --- Legenda das medidas, no topo ---
    if (medidas.length > 1) {
      const legenda = criarEl('div', { classe: 'dp-legenda', pai: lista.topo });
      legenda.style.color = tema.texto;
      medidas.forEach((medida, i) => {
        const chip = criarEl('span', { classe: 'dp-chip', pai: legenda });
        const bolinha = criarEl('span', { classe: 'dp-bolinha', pai: chip });
        bolinha.style.background = cores[i];
        const texto = criarEl('span', { pai: chip });
        definirTexto(texto, truncar(medida.rotuloCurto, 18));
      });
    }

    // --- Régua do eixo, embaixo ---
    const regua = criarEl('div', { classe: 'dp-escala', pai: lista.raiz });
    regua.style.color = tema.textoSuave;
    // O primeiro espaço espelha a coluna de nomes, para a régua começar
    // onde o trilho começa.
    const vazio = criarEl('span', { pai: regua });
    vazio.style.flex = `0 0 ${larguraDoNome + 14}px`;
    for (const marca of escala.marcas) {
      const span = criarEl('span', { pai: regua });
      span.style.textAlign = marca.p === 0 ? 'left' : marca.p === 1 ? 'right' : 'center';
      definirTexto(span, formatar(marca.valor));
    }
    lista.raiz.insertBefore(regua, lista.nota);

    definirTexto(
      lista.nota,
      [
        `${itens.length.toLocaleString('pt-BR')} itens · ${medidas.length} medida(s) por linha`,
        escala.incluiZero
          ? 'o eixo inclui o zero'
          : `ATENÇÃO: eixo CORTADO, de ${formatar(escala.minimo)} a ${formatar(escala.maximo)} — ` +
            'o ponto marca POSIÇÃO, não comprimento, então distância da borda não é proporção',
        `ordem ${nomeDaOrdem(config.ordem)}`,
        'a posição na lista não muda com a busca',
      ].join(' · ')
    );

    // ---------- Interação ----------
    if (tooltip) {
      ctx.eventos.on(lista.conteudo, 'pointermove', (ev) => {
        const item = itemDoEvento(ev, itens);
        if (!item) {
          tooltip.esconder();
          return;
        }
        const linhas = medidas.map((medida, i) => ({
          rotulo: medida.rotuloCurto,
          valor: item.valores[i] === null ? 'sem dado' : formatadores[i](item.valores[i]),
          cor: cores[i],
        }));
        const diferenca = calcularDiferenca(item);
        if (diferenca !== null) {
          linhas.push({
            rotulo: `Diferença (${medidas[medidas.length - 1].rotuloCurto} − ${medidas[0].rotuloCurto})`,
            valor: `${diferenca >= 0 ? '+' : ''}${formatar(diferenca)}`,
          });
        }
        linhas.push({ rotulo: 'Posição na lista', valor: `${item.posicao} de ${itens.length}` });
        tooltip.mostrar({ titulo: item.nome, linhas }, ev.clientX, ev.clientY);
      });
      ctx.eventos.on(lista.conteudo, 'pointerleave', () => tooltip.esconder());
    }

    ctx.eventos.on(lista.conteudo, 'click', (ev) => {
      const item = itemDoEvento(ev, itens);
      if (!item) return;
      const celula = modelo.celula(modelo.linhas[item.indiceDaLinha], campoDoNome.nome);
      if (celula && ctx.ponte.temDrill(celula)) ctx.ponte.abrirDrill(celula, ev);
    });
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});

/* ------------------------------------------------------------------ */

function nomeDaOrdem(modo) {
  if (modo === 'primeiraAsc') return 'pela 1ª medida (menor primeiro)';
  if (modo === 'diferenca') return 'pela diferença entre a 1ª e a última medida';
  if (modo === 'nome') return 'pelo nome';
  if (modo === 'consulta') return 'da consulta';
  return 'pela 1ª medida (maior primeiro)';
}

/** Diferença entre a última e a primeira medida, quando as duas existem. */
export function calcularDiferenca(item) {
  if (item.valores.length < 2) return null;
  const primeiro = item.valores[0];
  const ultimo = item.valores[item.valores.length - 1];
  if (primeiro === null || ultimo === null) return null;
  return ultimo - primeiro;
}

export function ordenarItens(itens, modo = 'primeira') {
  const valor = (item) => (item.valores[0] === null ? -Infinity : item.valores[0]);

  if (modo === 'primeiraAsc') {
    itens.sort((a, b) => (a.valores[0] === null ? Infinity : a.valores[0]) - (b.valores[0] === null ? Infinity : b.valores[0]));
  } else if (modo === 'diferenca') {
    // Sem a segunda medida não existe diferença: esses itens vão para o
    // fim em vez de embaralhar a ordem com zeros inventados.
    itens.sort((a, b) => {
      const da = calcularDiferenca(a);
      const db = calcularDiferenca(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return db - da;
    });
  } else if (modo === 'nome') {
    itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } else if (modo !== 'consulta') {
    itens.sort((a, b) => valor(b) - valor(a));
  }
  return itens;
}

/**
 * Escala do eixo.
 *
 * O ponto codifica POSIÇÃO, não comprimento — então cortar o eixo é
 * legítimo, e com valores próximos é a única forma de ver diferença. O que
 * não é legítimo é cortar em silêncio: quem chama recebe `comecaEmZero`
 * para declarar na tela.
 *
 * A folga de 4% em cada lado existe para o ponto do extremo não ficar
 * pela metade fora do trilho.
 */
export function montarEscala({ valores, comecarEmZero = false, folga = 0.04 }) {
  if (!valores.length) {
    return { minimo: 0, maximo: 1, incluiZero: true, posicao: () => 0, marcas: [] };
  }

  let minimo = Math.min(...valores);
  let maximo = Math.max(...valores);

  if (comecarEmZero) minimo = Math.min(0, minimo);

  if (minimo === maximo) {
    // Todos iguais: sem um intervalo artificial, todo ponto cairia no
    // mesmo pixel e a divisão por zero viraria NaN.
    const passo = Math.abs(minimo) || 1;
    minimo -= passo / 2;
    maximo += passo / 2;
  } else if (!comecarEmZero) {
    const margem = (maximo - minimo) * folga;
    minimo -= margem;
    maximo += margem;
  }

  const extensao = maximo - minimo || 1;
  const posicao = (v) =>
    v === null || !Number.isFinite(v) ? null : (v - minimo) / extensao;

  return {
    minimo,
    maximo,
    // O que importa para o aviso não é "começa exatamente em zero", é se o
    // eixo está CORTADO — se o zero ficou fora dele. Com valores negativos
    // e base em zero, o eixo começa abaixo de zero e continua honesto.
    incluiZero: minimo <= 0 && maximo >= 0,
    posicao,
    marcas: [0, 0.25, 0.5, 0.75, 1].map((p) => ({ p, valor: minimo + extensao * p })),
  };
}

function montarLinha({
  item, medidas, cores, escala, tamanhoDoPonto, larguraDoNome, tema, config, formatadores,
}) {
  const linha = document.createElement('div');
  linha.className = 'dp-linha';
  linha.style.fontSize = `${Math.max(9, Math.min(tema.tamanhoBase, 20))}px`;
  linha.dataset.posicao = String(item.posicao);

  const nome = document.createElement('div');
  nome.className = 'dp-nome';
  nome.style.width = `${larguraDoNome}px`;
  nome.style.color = tema.texto;
  nome.title = item.nome;
  nome.textContent = truncar(item.nome, Math.max(6, Math.floor(larguraDoNome / 7)));
  linha.appendChild(nome);

  const trilho = document.createElement('div');
  trilho.className = 'dp-trilho';
  linha.appendChild(trilho);

  if (config.mostrarGuias !== false) {
    for (const marca of escala.marcas) {
      if (marca.p === 0 || marca.p === 1) continue;
      const guia = document.createElement('div');
      guia.className = 'dp-guia';
      guia.style.left = `${marca.p * 100}%`;
      guia.style.background = comOpacidade(tema.borda, 0.7);
      trilho.appendChild(guia);
    }
  }

  const posicoes = item.valores.map((v) => escala.posicao(v));
  const validas = posicoes.filter((p) => p !== null);

  if (config.ligarPontos !== false && validas.length > 1) {
    const de = Math.min(...validas);
    const ate = Math.max(...validas);
    const ligacao = document.createElement('div');
    ligacao.className = 'dp-ligacao';
    ligacao.style.left = `${de * 100}%`;
    ligacao.style.width = `${(ate - de) * 100}%`;
    ligacao.style.background = comOpacidade(tema.texto, 0.3);
    trilho.appendChild(ligacao);
  }

  posicoes.forEach((p, i) => {
    if (p === null) return;
    const ponto = document.createElement('div');
    ponto.className = 'dp-ponto';
    ponto.style.left = `${p * 100}%`;
    ponto.style.width = `${tamanhoDoPonto}px`;
    ponto.style.height = `${tamanhoDoPonto}px`;
    ponto.style.background = cores[i];
    ponto.dataset.medida = medidas[i].nome;
    trilho.appendChild(ponto);
  });

  const modoDoValor = config.escreverValores || 'nenhum';
  if (modoDoValor !== 'nenhum' && validas.length) {
    const diferenca = calcularDiferenca(item);
    const texto =
      modoDoValor === 'diferenca'
        ? diferenca === null
          ? ''
          : `${diferenca >= 0 ? '+' : ''}${formatadores[0](diferenca)}`
        : item.valores[0] === null
          ? ''
          : formatadores[0](item.valores[0]);

    if (texto) {
      const valorEl = document.createElement('div');
      valorEl.className = 'dp-valor';
      valorEl.textContent = texto;
      valorEl.style.left = `${Math.max(...validas) * 100}%`;
      valorEl.style.transform = 'translate(8px, -50%)';
      valorEl.style.color = tema.textoSuave;
      trilho.appendChild(valorEl);
    }
  }

  return linha;
}
