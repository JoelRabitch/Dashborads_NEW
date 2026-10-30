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
 *
 * Correções v2 (módulos 6.1–6.4):
 *   - "Escrever os valores" continua escolhendo O QUE escrever; o estilo
 *     e o resto vêm do bloco de rótulos pela função única
 *     (`core/rotulos.js`): "Mostrar rótulos" desliga, e tamanho, cor,
 *     negrito, rotação, posição (fora = à direita do último ponto, dentro
 *     = à esquerda do primeiro, centro = no meio), conteúdo, formato,
 *     casas e truncar têm efeito;
 *   - aba Cores: paleta via `paletaDoConfig` ("Inverter ordem das cores"),
 *     opacidade e contorno nos pontos; guias na cor da grade do tema;
 *   - forma do ponto (opção nova `formaDoPonto`): o ponto é desenhado
 *     pela função única de marcadores (um <svg> mínimo dentro da linha),
 *     e a legenda acompanha a forma;
 *   - tooltip único (`ctx.tooltip()`) com os valores no texto do Looker;
 *     clique pela "Ação do clique" (`ctx.cliqueNoItem`).
 *
 * Campos: 1 dimensão (o nome) + 1 a 4 medidas (um ponto por medida).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { paletaDoConfig, lerContorno } from '../../core/cores.js';
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

// A escala do trilho e a conta da diferença moram em `_lista_virtual/`,
// que é a base desta família; os nomes continuam saindo daqui porque são
// a superfície pública testada do gráfico.
export { montarEscala, calcularDiferenca } from '../_lista_virtual/index.js';

const CSS = `
.dp-nome{flex:0 0 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dp-trilho{flex:1 1 auto;position:relative;height:100%;min-width:20px;}
.dp-ponto{position:absolute;top:50%;transform:translate(-50%,-50%);line-height:0;}
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
        // Novo (correções v2): a forma do ponto, com os valores do
        // options-kit (padrão círculo, que é o desenho de antes).
        formaDoPonto: blocoDePontosELinhas({ secao: 'Dot plot', comLinha: false }).formaDoPonto,
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
        // Texto do Looker de cada medida (tooltip e rótulo "automático").
        textos: medidas.map((m) => modelo.texto(modelo.linhas[i], m.nome, undefined, '')),
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

    // Rótulos: lidos a cada desenho (o config chega normalizado).
    const rot = lerRotulos(config, tema);
    // Números derivados (diferença, régua) usam o value_format do campo.
    const formatadores = medidas.map((m) => formatadorDeValueFormat(m.valueFormat, { casas: rot.casas }));
    const formatar = formatadores[0];
    const totalDaPrimeira = itens.reduce((a, i) => a + (i.valores[0] === null ? 0 : i.valores[0]), 0);

    // Aba Cores: paleta (com "Inverter"), opacidade e contorno do painel.
    const paleta = paletaDoConfig(config);
    const cores = medidas.map((_, i) => paleta[i % paleta.length]);
    const contorno = lerContorno(config, tema, { corPadrao: tema.fundo });
    const forma = formaDoMarcador(config.formaDoPonto);

    const alturaDaLinha = Math.max(12, Number(config.alturaDaLinha) || 22);
    const larguraDoNome = Math.max(40, Number(config.larguraDoNome) || 160);
    const tamanhoDoPonto = Math.max(4, Number(config.tamanhoDoPonto) || 9);

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
          item, medidas, cores, escala, tamanhoDoPonto, larguraDoNome,
          tema, config, rot, contorno, forma, totalDaPrimeira,
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
        // O chip tem a forma do ponto: a legenda acompanha o desenho.
        criarChipDeForma(chip, { forma, cor: cores[i] });
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
    // Valores no texto do Looker; só a diferença (derivada) é formatada
    // pelo value_format do campo.
    const conteudoDe = (item) => {
      const linhas = medidas.map((medida, i) => ({
        rotulo: medida.rotuloCurto,
        valor: item.valores[i] === null ? 'sem dado' : item.textos[i] || formatadores[i](item.valores[i]),
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
      return {
        titulo: item.nome,
        linhas,
        variaveis: {
          categoria: item.nome,
          valor: linhas[0].valor,
          serie: medidas[0].rotuloCurto,
          percentual:
            totalDaPrimeira && item.valores[0] !== null
              ? `${((item.valores[0] / totalDaPrimeira) * 100).toFixed(1)}%`
              : '',
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
      const campos = [campoDoNome.nome, ...medidas.map((m) => m.nome)];
      ctx.cliqueNoItem(ev, celulaComLinks(modelo, linha, campos), conteudoDe(item));
    });
  },
  // Sem aoDestruir: o tooltip é o único do gráfico e o defineViz o remove.
});

/* ------------------------------------------------------------------ */

function nomeDaOrdem(modo) {
  if (modo === 'primeiraAsc') return 'pela 1ª medida (menor primeiro)';
  if (modo === 'diferenca') return 'pela diferença entre a 1ª e a última medida';
  if (modo === 'nome') return 'pelo nome';
  if (modo === 'consulta') return 'da consulta';
  return 'pela 1ª medida (maior primeiro)';
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
 * Texto do rótulo de uma linha, pela função única de rótulos.
 * - "primeira": o valor da 1ª medida (texto do Looker no formato auto);
 * - "diferenca": a diferença com sinal (+/−), formatada com o formato e as
 *   casas do rótulo; "percentual" vira a diferença relativa à 1ª medida.
 */
export function textoDoValor({ item, medidas, rot, modoDoValor, totalDaPrimeira }) {
  if (modoDoValor === 'diferenca') {
    const diferenca = calcularDiferenca(item);
    if (diferenca === null) return '';
    const numero = formatadorDoRotulo(rot, medidas[0].valueFormat)(diferenca);
    const base = item.valores[0];
    return textoDoRotulo(
      { ...rot, formato: 'auto' },
      {
        valor: diferenca,
        nome: item.nome,
        textoDoValor: `${diferenca >= 0 ? '+' : ''}${numero}`,
        percentual: base ? diferenca / Math.abs(base) : null,
      }
    );
  }
  if (item.valores[0] === null) return '';
  return textoDoRotulo(rot, {
    valor: item.valores[0],
    nome: item.nome,
    total: totalDaPrimeira,
    valueFormat: medidas[0].valueFormat,
    textoDoValor: item.textos ? item.textos[0] : undefined,
  });
}

function montarLinha({
  item, medidas, cores, escala, tamanhoDoPonto, larguraDoNome, tema, config,
  rot, contorno, forma, totalDaPrimeira,
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
    // Guias na cor da grade do tema ("Cor das linhas de grade").
    const internas = escala.marcas.filter((m) => m.p !== 0 && m.p !== 1).map((m) => m.p);
    desenharGuias(trilho, internas, tema, 'dp-guia');
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
    // Ponto pela função única de marcadores (forma, opacidade, contorno).
    const ponto = criarPontoHtml({
      classe: 'dp-ponto',
      forma,
      diametro: tamanhoDoPonto,
      cor: cores[i],
      config,
      contorno,
    });
    ponto.style.left = `${p * 100}%`;
    ponto.dataset.medida = medidas[i].nome;
    trilho.appendChild(ponto);
  });

  // "Escrever os valores" escolhe o quê; "Mostrar rótulos" e o resto do
  // bloco de rótulos decidem se aparece e como.
  const modoDoValor = config.escreverValores || 'nenhum';
  if (rot.mostrar && modoDoValor !== 'nenhum' && validas.length) {
    const texto = textoDoValor({ item, medidas, rot, modoDoValor, totalDaPrimeira });
    if (texto) {
      const maior = Math.max(...validas);
      const menor = Math.min(...validas);
      const posicao = rot.posicao === 'dentro' || rot.posicao === 'centro' ? rot.posicao : 'fora';
      let esquerda = maior;
      let deslocamento = `translate(${tamanhoDoPonto / 2 + 4}px, -50%)`;
      if (posicao === 'dentro') {
        esquerda = menor;
        deslocamento = `translate(calc(-100% - ${tamanhoDoPonto / 2 + 4}px), -50%)`;
      } else if (posicao === 'centro') {
        esquerda = (menor + maior) / 2;
        deslocamento = 'translate(-50%, -50%)';
      }
      const valorEl = criarRotuloHtml(trilho, rot, {
        texto,
        classe: 'dp-valor',
        transformBase: deslocamento,
        posicao,
        corAutomatica: tema.textoSuave,
      });
      if (valorEl) valorEl.style.left = `${esquerda * 100}%`;
    }
  }

  return linha;
}
