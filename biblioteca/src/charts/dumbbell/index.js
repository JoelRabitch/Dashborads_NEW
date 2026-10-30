/**
 * dumbbell — "Halteres".
 *
 * Duas medidas por categoria, ligadas por uma barra: o "antes e depois"
 * item a item.
 *
 * É o primo do `slope_chart` com os eixos trocados. Lá as categorias
 * viram linhas inclinadas entre dois períodos, o que mostra bem a
 * INCLINAÇÃO mas embola os nomes; aqui elas ficam empilhadas e a
 * comparação é horizontal, o que acomoda muito mais itens e nomes longos.
 * A nota de cada um aponta o outro.
 *
 * **Sobre o eixo cortado, que aqui tem uma resposta mais sutil.** O ponto
 * codifica POSIÇÃO, então cortar o eixo é legítimo (como no
 * `dot_plot_denso`) — mas a BARRA entre os dois pontos é comprimento, e
 * normalmente comprimento exige base zero. A exceção vale: a barra
 * representa a DIFERENÇA entre as duas medidas, e uma diferença não
 * depende de onde o eixo começa. Por isso o corte é permitido aqui sem
 * distorcer o que a barra afirma — e a nota diz exatamente isso, porque
 * é o tipo de coisa que o leitor atento vai querer conferir.
 *
 * Correções v2 (módulos 6.1–6.4):
 *   - "Escrever" continua escolhendo O QUE escrever (diferença, as duas
 *     medidas, nada); o estilo vem do bloco de rótulos pela função única
 *     (`core/rotulos.js`): "Mostrar rótulos", tamanho, cor, negrito,
 *     rotação, posição (fora/dentro/centro), conteúdo, formato, casas e
 *     truncar têm efeito;
 *   - aba Cores: as cores das duas pontas vêm de `paletaDoConfig`
 *     ("Inverter ordem das cores"), com opacidade e contorno; a barra
 *     ganha o contorno do painel; guias na cor da grade do tema;
 *   - forma dos pontos (opção nova `formaDoPonto`) pela função única de
 *     marcadores, refletida na legenda;
 *   - tooltip único (`ctx.tooltip()`) com os valores no texto do Looker;
 *     clique pela "Ação do clique" (`ctx.cliqueNoItem`).
 *
 * Campos: 1 dimensão (o nome) + 2 medidas (o "antes" e o "depois").
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, formatarPercentual, truncar } from '../../core/format.js';
import { paletaDoConfig, lerContorno, aplicarContorno } from '../../core/cores.js';
import { lerRotulos, textoDoRotulo, formatadorDoRotulo } from '../../core/rotulos.js';
import { formaDoMarcador } from '../../core/shapes.js';
import {
  CSS_LISTA_VIRTUAL,
  criarListaVirtual,
  itemDoEvento,
  montarEscala,
  calcularDiferenca,
  desenharGuias,
  criarPontoHtml,
  criarRotuloHtml,
  criarChipDeForma,
  celulaComLinks,
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
  blocoDePontosELinhas,
} from '../../core/options-kit.js';

const CSS = `
.db-nome{flex:0 0 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.db-trilho{flex:1 1 auto;position:relative;height:100%;min-width:20px;}
.db-barra{position:absolute;top:50%;transform:translateY(-50%);border-radius:2px;}
.db-ponto{position:absolute;top:50%;transform:translate(-50%,-50%);line-height:0;}
.db-guia{position:absolute;top:0;bottom:0;width:1px;}
.db-valor{position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap;font-variant-numeric:tabular-nums;}
.db-escala{flex:0 0 auto;display:flex;padding:0 8px;font-size:10px;opacity:.75;}
.db-escala span{flex:1 1 0;}
.db-legenda{display:flex;gap:10px;align-items:center;font-size:11px;white-space:nowrap;}
.db-chip{display:inline-flex;align-items:center;gap:4px;}
.db-bolinha{width:8px;height:8px;border-radius:50%;display:inline-block;}
`;

const MAXIMO_DE_ITENS = 50000;

export default defineViz({
  id: 'dumbbell',
  label: 'Halteres',
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
          label: 'Começar o eixo em zero',
          section: 'Halteres',
          default: false,
        },
        ordem: {
          type: 'string',
          label: 'Ordenar por',
          section: 'Halteres',
          display: 'select',
          default: 'diferenca',
          values: listaDeValores([
            { rotulo: 'Diferença (maior primeiro)', valor: 'diferenca' },
            { rotulo: 'Diferença percentual (maior primeiro)', valor: 'diferencaPercentual' },
            { rotulo: 'Primeira medida', valor: 'primeira' },
            { rotulo: 'Segunda medida', valor: 'segunda' },
            { rotulo: 'Nome', valor: 'nome' },
            { rotulo: 'Como veio da consulta', valor: 'consulta' },
          ]),
        },
        corPorDirecao: {
          type: 'boolean',
          label: 'Colorir a barra por direção (subiu, desceu)',
          section: 'Halteres',
          default: true,
        },
        menorEhMelhor: {
          type: 'boolean',
          label: 'Menor é melhor (custo, churn, tempo de resposta…)',
          section: 'Halteres',
          default: false,
        },
        alturaDaLinha: {
          type: 'number',
          label: 'Altura de cada linha (px)',
          section: 'Halteres',
          display: 'range',
          min: 12,
          max: 48,
          step: 1,
          default: 24,
        },
        tamanhoDoPonto: {
          type: 'number',
          label: 'Tamanho dos pontos (px)',
          section: 'Halteres',
          display: 'range',
          min: 4,
          max: 24,
          step: 1,
          default: 10,
        },
        // Novo (correções v2): a forma dos pontos, com os valores do
        // options-kit (padrão círculo, que é o desenho de antes).
        formaDoPonto: blocoDePontosELinhas({ secao: 'Halteres', comLinha: false }).formaDoPonto,
        espessuraDaBarra: {
          type: 'number',
          label: 'Espessura da barra (px)',
          section: 'Halteres',
          display: 'range',
          min: 1,
          max: 16,
          step: 1,
          default: 4,
        },
        escreverValores: {
          type: 'string',
          label: 'Escrever',
          section: 'Rótulos',
          display: 'select',
          default: 'diferenca',
          values: listaDeValores([
            { rotulo: 'A diferença', valor: 'diferenca' },
            { rotulo: 'As duas medidas', valor: 'ambas' },
            { rotulo: 'Nada', valor: 'nenhum' },
          ]),
        },
        mostrarBusca: {
          type: 'boolean',
          label: 'Campo de busca por nome',
          section: 'Halteres',
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
          default: 170,
        },
      }
    ),
    { mostrarTooltip: true }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 2, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));

    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoNome', 'Dimensão do nome', dimensoes, {
          secao: 'Dados',
          padrao: dimensoes[0].nome,
        })
      );
    }
    if (medidas.length >= 2) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoAntes', 'Primeira medida (o "antes")', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        }),
        opcaoDeEscolhaDeCampo('campoDoDepois', 'Segunda medida (o "depois")', medidas, {
          secao: 'Dados',
          padrao: medidas[1].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz } = ctx;

    const campoDoNome =
      modelo.dimensoes.find((d) => d.nome === config.campoDoNome) || modelo.dimensoes[0] || null;
    const antes =
      modelo.medidas.find((m) => m.nome === config.campoDoAntes) || modelo.medidas[0] || null;
    const depois =
      modelo.medidas.find((m) => m.nome === config.campoDoDepois && m !== antes) ||
      modelo.medidas.find((m) => m !== antes) ||
      null;

    if (!campoDoNome || !antes || !depois) {
      ctx.mostrarVazio(
        'Um haltere compara DUAS medidas por categoria. Traga uma dimensão e pelo menos ' +
          'duas medidas no Explore.'
      );
      return;
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
    let incompletos = 0;
    for (let i = 0; i < modelo.linhas.length; i++) {
      const a = modelo.valorNumerico(modelo.linhas[i], antes.nome);
      const b = modelo.valorNumerico(modelo.linhas[i], depois.nome);
      if (a === null || b === null) {
        if (a !== null || b !== null) incompletos += 1;
        continue;
      }
      itens.push({
        indiceDaLinha: i,
        nome: modelo.texto(modelo.linhas[i], campoDoNome.nome, undefined, '∅'),
        valores: [a, b],
        // Texto do Looker das duas medidas (tooltip e rótulo "automático").
        textos: [
          modelo.texto(modelo.linhas[i], antes.nome, undefined, ''),
          modelo.texto(modelo.linhas[i], depois.nome, undefined, ''),
        ],
        diferenca: b - a,
        diferencaRelativa: a === 0 ? null : (b - a) / Math.abs(a),
      });
    }

    if (!itens.length) {
      ctx.mostrarVazio(
        'Nenhuma categoria tem valor nas DUAS medidas. Um haltere precisa das duas pontas — ' +
          'verifique os nulos no Explore.'
      );
      return;
    }
    if (incompletos > 0) {
      ctx.avisar(
        `${incompletos} categoria(s) têm só uma das duas medidas e ficaram de fora: ` +
          'um haltere precisa das duas pontas.'
      );
    }

    ordenarItens(itens, config.ordem);
    itens.forEach((item, i) => {
      item.posicao = i + 1;
    });

    const escala = montarEscala({
      valores: itens.flatMap((i) => i.valores),
      comecarEmZero: config.comecarEmZero === true,
    });

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_LISTA_VIRTUAL + CSS, 'db');

    // Rótulos: lidos a cada desenho (o config chega normalizado).
    const rot = lerRotulos(config, tema);
    // Números derivados (diferença, régua) usam o value_format do campo.
    const formatarAntes = formatadorDeValueFormat(antes.valueFormat, { casas: rot.casas });
    const formatarDepois = formatadorDeValueFormat(depois.valueFormat, { casas: rot.casas });

    // Aba Cores: paleta (com "Inverter"), opacidade e contorno do painel.
    const paleta = paletaDoConfig(config);
    const cores = { antes: paleta[0], depois: paleta[1] || paleta[0] };
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });
    const forma = formaDoMarcador(config.formaDoPonto);
    const menorEhMelhor = config.menorEhMelhor === true;
    const corDaBarra = (item) => {
      if (config.corPorDirecao === false) return comOpacidade(tema.texto, 0.35);
      if (item.diferenca === 0) return tema.neutro;
      const bom = menorEhMelhor ? item.diferenca < 0 : item.diferenca > 0;
      return bom ? tema.positivo : tema.negativo;
    };

    const alturaDaLinha = Math.max(12, Number(config.alturaDaLinha) || 24);
    const larguraDoNome = Math.max(40, Number(config.larguraDoNome) || 170);
    const tamanhoDoPonto = Math.max(4, Number(config.tamanhoDoPonto) || 10);
    const espessura = Math.max(1, Number(config.espessuraDaBarra) || 4);

    const tooltip = ctx.tooltip();

    const lista = criarListaVirtual({
      ctx,
      itens,
      alturaDaLinha,
      comBusca: config.mostrarBusca !== false,
      rotuloDaBusca: `Buscar em ${campoDoNome.rotuloCurto}…`,
      textoDoItem: (item) => item.nome,
      montarLinha: (item) =>
        montarLinha({
          item, escala, cores, corDaBarra, larguraDoNome, tamanhoDoPonto, espessura,
          tema, config, rot, contorno, forma, valueFormat: antes.valueFormat,
        }),
    });

    lista.raiz.classList.add('db-raiz');
    lista.conteudo.classList.add('db-conteudo');
    lista.contagem.classList.add('db-contagem');
    lista.nota.classList.add('db-nota');
    const campoDeBusca = lista.topo.querySelector('.lv-busca');
    if (campoDeBusca) campoDeBusca.classList.add('db-busca');

    // --- Legenda das duas medidas ---
    const legenda = criarEl('div', { classe: 'db-legenda', pai: lista.topo });
    legenda.style.color = tema.texto;
    for (const lado of [
      { cor: cores.antes, rotulo: antes.rotuloCurto },
      { cor: cores.depois, rotulo: depois.rotuloCurto },
    ]) {
      const chip = criarEl('span', { classe: 'db-chip', pai: legenda });
      // O chip tem a forma do ponto: a legenda acompanha o desenho.
      criarChipDeForma(chip, { forma, cor: lado.cor });
      const texto = criarEl('span', { pai: chip });
      definirTexto(texto, truncar(lado.rotulo, 18));
    }

    // --- Régua ---
    const regua = criarEl('div', { classe: 'db-escala', pai: lista.raiz });
    regua.style.color = tema.textoSuave;
    const vazio = criarEl('span', { pai: regua });
    vazio.style.flex = `0 0 ${larguraDoNome + 14}px`;
    for (const marca of escala.marcas) {
      const span = criarEl('span', { pai: regua });
      span.style.textAlign = marca.p === 0 ? 'left' : marca.p === 1 ? 'right' : 'center';
      definirTexto(span, formatarAntes(marca.valor));
    }
    lista.raiz.appendChild(regua);

    const subiram = itens.filter((i) => i.diferenca > 0).length;
    const cairam = itens.filter((i) => i.diferenca < 0).length;

    definirTexto(
      lista.nota,
      [
        `${itens.length} itens · ${subiram} subiram, ${cairam} caíram`,
        escala.incluiZero
          ? 'o eixo inclui o zero'
          : 'eixo CORTADO — legítimo aqui: a BARRA representa a DIFERENÇA, e diferença não depende de onde o eixo começa',
        menorEhMelhor ? 'menor é melhor: a cor está invertida, a posição não' : null,
        `ordem ${nomeDaOrdem(config.ordem)}`,
        'para ver a inclinação item a item, use o Slope Chart',
      ]
        .filter(Boolean)
        .join(' · ')
    );

    // ---------- Interação ----------
    // Valores no texto do Looker; só a diferença (derivada) é formatada
    // pelo value_format do campo.
    const conteudoDe = (item) => {
      const diferencaPct =
        item.diferencaRelativa === null
          ? 'não existe (começou em zero)'
          : `${item.diferencaRelativa >= 0 ? '+' : ''}${formatarPercentual(item.diferencaRelativa, 1)}`;
      const diferenca = `${item.diferenca >= 0 ? '+' : ''}${formatarAntes(item.diferenca)}`;
      return {
        titulo: item.nome,
        linhas: [
          { rotulo: antes.rotuloCurto, valor: item.textos[0] || formatarAntes(item.valores[0]), cor: cores.antes },
          { rotulo: depois.rotuloCurto, valor: item.textos[1] || formatarDepois(item.valores[1]), cor: cores.depois },
          { rotulo: 'Diferença', valor: diferenca, cor: corDaBarra(item) },
          { rotulo: 'Diferença %', valor: diferencaPct },
          { rotulo: 'Posição na lista', valor: `${item.posicao} de ${itens.length}` },
        ],
        variaveis: {
          categoria: item.nome,
          valor: diferenca,
          serie: `${antes.rotuloCurto} → ${depois.rotuloCurto}`,
          percentual: item.diferencaRelativa === null ? '' : diferencaPct,
        },
      };
    };

    if (tooltip) {
      ctx.eventos.on(lista.conteudo, 'pointermove', (ev) => {
        const item = itemDoEvento(ev, itens);
        if (!item) {
          tooltip.esconder();
          return;
        }
        tooltip.mostrar(conteudoDe(item), ev.clientX, ev.clientY);
      });
      ctx.eventos.on(lista.conteudo, 'pointerleave', () => tooltip.esconder());
    }

    // Clique: "Ação do clique" (drill com links; sem links, fixa o tooltip).
    ctx.eventos.on(lista.conteudo, 'click', (ev) => {
      const item = itemDoEvento(ev, itens);
      if (!item) return;
      const linha = modelo.linhas[item.indiceDaLinha];
      ctx.cliqueNoItem(
        ev,
        celulaComLinks(modelo, linha, [campoDoNome.nome, antes.nome, depois.nome]),
        conteudoDe(item)
      );
    });
  },
  // Sem aoDestruir: o tooltip é o único do gráfico e o defineViz o remove.
});

/* ------------------------------------------------------------------ */

function nomeDaOrdem(modo) {
  if (modo === 'diferencaPercentual') return 'pela diferença percentual';
  if (modo === 'primeira') return 'pela 1ª medida';
  if (modo === 'segunda') return 'pela 2ª medida';
  if (modo === 'nome') return 'pelo nome';
  if (modo === 'consulta') return 'da consulta';
  return 'pela diferença';
}

export function ordenarItens(itens, modo = 'diferenca') {
  const porDiferenca = (a, b, chave) => {
    const da = a[chave];
    const db = b[chave];
    // Sem diferença calculável, o item vai para o fim — tratá-lo como
    // zero o colocaria entre os que caíram e os que subiram.
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return db - da;
  };

  if (modo === 'diferencaPercentual') itens.sort((a, b) => porDiferenca(a, b, 'diferencaRelativa'));
  else if (modo === 'primeira') itens.sort((a, b) => b.valores[0] - a.valores[0]);
  else if (modo === 'segunda') itens.sort((a, b) => b.valores[1] - a.valores[1]);
  else if (modo === 'nome') itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  else if (modo !== 'consulta') itens.sort((a, b) => porDiferenca(a, b, 'diferenca'));
  return itens;
}

/**
 * Texto do rótulo de um haltere, pela função única de rótulos.
 * - "diferenca": a diferença com sinal (+/−), no formato e nas casas do
 *   rótulo; "percentual" vira a diferença relativa ao "antes";
 * - "ambas": "antes → depois" (texto do Looker no formato automático).
 */
export function textoDoHaltere({ item, rot, modo, valueFormat }) {
  const fmt = formatadorDoRotulo(rot, valueFormat);
  if (modo === 'ambas') {
    const auto = rot.formato === 'auto';
    const a = auto && item.textos ? item.textos[0] : fmt(item.valores[0]);
    const b = auto && item.textos ? item.textos[1] : fmt(item.valores[1]);
    return textoDoRotulo(
      { ...rot, formato: 'auto' },
      { valor: item.diferenca, nome: item.nome, textoDoValor: `${a} → ${b}`, percentual: item.diferencaRelativa }
    );
  }
  return textoDoRotulo(
    { ...rot, formato: 'auto' },
    {
      valor: item.diferenca,
      nome: item.nome,
      textoDoValor: `${item.diferenca >= 0 ? '+' : ''}${fmt(item.diferenca)}`,
      percentual: item.diferencaRelativa,
    }
  );
}

function montarLinha({
  item, escala, cores, corDaBarra, larguraDoNome, tamanhoDoPonto, espessura,
  tema, config, rot, contorno, forma, valueFormat,
}) {
  const linha = document.createElement('div');
  linha.className = 'db-linha';
  linha.style.fontSize = `${Math.max(9, Math.min(tema.tamanhoBase, 20))}px`;
  linha.dataset.posicao = String(item.posicao);

  const nome = document.createElement('div');
  nome.className = 'db-nome';
  nome.style.width = `${larguraDoNome}px`;
  nome.style.color = tema.texto;
  nome.title = item.nome;
  nome.textContent = truncar(item.nome, Math.max(6, Math.floor(larguraDoNome / 7)));
  linha.appendChild(nome);

  const trilho = document.createElement('div');
  trilho.className = 'db-trilho';
  linha.appendChild(trilho);

  // Guias na cor da grade do tema ("Cor das linhas de grade").
  desenharGuias(
    trilho,
    escala.marcas.filter((m) => m.p !== 0 && m.p !== 1).map((m) => m.p),
    tema,
    'db-guia'
  );

  const pA = escala.posicao(item.valores[0]);
  const pB = escala.posicao(item.valores[1]);

  if (pA !== null && pB !== null) {
    const de = Math.min(pA, pB);
    const largura = Math.abs(pB - pA);

    // Pontas coincidentes não viram barra: uma barra de largura mínima
    // afirmaria uma diferença que não existe.
    if (largura > 1e-9) {
      const barra = document.createElement('div');
      barra.className = 'db-barra';
      barra.style.left = `${de * 100}%`;
      barra.style.width = `${largura * 100}%`;
      barra.style.height = `${espessura}px`;
      barra.style.background = corDaBarra(item);
      aplicarContorno(barra, contorno);
      trilho.appendChild(barra);
    }
  }

  for (const lado of [
    { p: pA, cor: cores.antes, medida: 'antes' },
    { p: pB, cor: cores.depois, medida: 'depois' },
  ]) {
    if (lado.p === null) continue;
    // Ponto pela função única de marcadores (forma, opacidade, contorno).
    const ponto = criarPontoHtml({
      classe: 'db-ponto',
      forma,
      diametro: tamanhoDoPonto,
      cor: lado.cor,
      config,
      contorno,
    });
    ponto.style.left = `${lado.p * 100}%`;
    ponto.dataset.medida = lado.medida;
    trilho.appendChild(ponto);
  }

  // "Escrever" escolhe o quê; "Mostrar rótulos" e o resto do bloco de
  // rótulos decidem se aparece e como.
  const modo = config.escreverValores || 'diferenca';
  if (rot.mostrar && modo !== 'nenhum' && pA !== null && pB !== null) {
    const texto = textoDoHaltere({ item, rot, modo, valueFormat });
    const maior = Math.max(pA, pB);
    const menor = Math.min(pA, pB);
    const posicao = rot.posicao === 'dentro' || rot.posicao === 'centro' ? rot.posicao : 'fora';
    let esquerda = maior;
    let deslocamento = `translate(${tamanhoDoPonto / 2 + 5}px, -50%)`;
    if (posicao === 'dentro') {
      esquerda = menor;
      deslocamento = `translate(calc(-100% - ${tamanhoDoPonto / 2 + 5}px), -50%)`;
    } else if (posicao === 'centro') {
      // No meio da barra, um pouco acima dela para não cobri-la.
      esquerda = (menor + maior) / 2;
      deslocamento = `translate(-50%, calc(-50% - ${Math.max(espessura, 4)}px))`;
    }
    const valor = criarRotuloHtml(trilho, rot, {
      texto,
      classe: 'db-valor',
      transformBase: deslocamento,
      posicao,
      corAutomatica: tema.textoSuave,
    });
    if (valor) valor.style.left = `${esquerda * 100}%`;
  }

  return linha;
}
