/**
 * org_chart — "Organograma".
 *
 * Mesma hierarquia das árvores, mas desenhada do jeito que um organograma
 * precisa ser lido: CARTÕES retangulares de cima para baixo, ligações em
 * cotovelo e a possibilidade de recolher uma área inteira clicando nela.
 *
 * Por que cartão e não círculo: num organograma o que importa é o texto
 * (nome, cargo, tamanho da equipe), e texto precisa de uma caixa com
 * largura previsível. Um círculo dimensionado por valor empurraria o nome
 * para fora e faria o leitor comparar áreas, que não é a pergunta aqui.
 *
 * O layout é calculado sobre a árvore VISÍVEL (depois de recolher), e não
 * sobre a árvore inteira — senão sobraria um buraco no lugar dos nós
 * escondidos.
 *
 * Campos: um par id/superior (ou uma dimensão por nível), opcionalmente
 * uma dimensão para a segunda linha do cartão e uma medida.
 *
 * Opções (correções v2): o bloco "Rótulos" inteiro vale para os textos do
 * cartão (ver `desenharTextosDoCartao`); a aba Cores vale para o cartão
 * (paleta com "Inverter ordem", opacidade, contorno — com a cor padrão do
 * painel, o contorno segue a cor do ramo); as ligações usam a cor de borda
 * do tema. Tooltip único do gráfico (`ctx.tooltip()`), valor no formato
 * do campo. Clique no cartão segue a "Ação do clique"; clique no botão
 * +/− recolhe ou abre a área (e não dispara o drill).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { formatadorDeValueFormat, truncar } from '../../core/format.js';
import { textoLegivelSobre } from '../../core/theme.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo } from '../../core/rotulos.js';
import { paletaDoConfig, corDoItem, lerContorno, aplicarContorno, aplicarPreenchimento } from '../../core/cores.js';
import { hierarchy as d3Hierarchy, tree as d3Tree } from 'd3-hierarchy';
import {
  construirHierarquia,
  opcoesDeHierarquia,
  opcoesDinamicasDeHierarquia,
} from '../../core/hierarquia.js';
import {
  montarOpcoes,
  listaDeValores,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';

/** Default declarado de "Cor do contorno" (blocoDeCores): tratado como "automática". */
const COR_PADRAO_DO_CONTORNO = '#FFFFFF';

const CSS = `
.oc-area{position:relative;width:100%;height:100%;overflow:auto;}
.oc-cartao{cursor:pointer;}
.oc-ligacao{fill:none;}
.oc-texto{pointer-events:none;}
.oc-botao{cursor:pointer;}
.oc-dica{position:absolute;left:8px;bottom:6px;font-size:10px;opacity:.65;pointer-events:none;}
`;

export default defineViz({
  id: 'org_chart',
  label: 'Organograma',
  opcoes: montarOpcoes(
    blocoDeCores({ comEscalaPorValor: false }),
    blocoDeRotulos(),
    blocoDeTooltip(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado(),
    opcoesDeHierarquia(),
    {
      orientacao: {
        type: 'string',
        label: 'Direção',
        section: 'Organograma',
        display: 'select',
        default: 'cima',
        values: listaDeValores([
          { rotulo: 'De cima para baixo', valor: 'cima' },
          { rotulo: 'Da esquerda para a direita', valor: 'esquerda' },
        ]),
      },
      larguraDoCartao: {
        type: 'number',
        label: 'Largura do cartão (px)',
        section: 'Organograma',
        display: 'range',
        min: 70,
        max: 320,
        step: 10,
        default: 150,
      },
      alturaDoCartao: {
        type: 'number',
        label: 'Altura do cartão (px)',
        section: 'Organograma',
        display: 'range',
        min: 30,
        max: 160,
        step: 5,
        default: 56,
      },
      espacoEntreNiveis: {
        type: 'number',
        label: 'Espaço entre níveis (px)',
        section: 'Organograma',
        display: 'range',
        min: 20,
        max: 200,
        step: 10,
        default: 60,
      },
      espacoEntreIrmaos: {
        type: 'number',
        label: 'Espaço entre cartões vizinhos (px)',
        section: 'Organograma',
        display: 'range',
        min: 4,
        max: 80,
        step: 2,
        default: 16,
      },
      raioDoCartao: {
        type: 'number',
        label: 'Arredondamento do cartão (px)',
        section: 'Organograma',
        display: 'range',
        min: 0,
        max: 20,
        step: 1,
        default: 6,
      },
      permitirRecolher: {
        type: 'boolean',
        label: 'Recolher uma área clicando no cartão',
        section: 'Organograma',
        default: true,
      },
      comecarRecolhidoAPartirDe: {
        type: 'number',
        label: 'Começar recolhido a partir do nível (0 = tudo aberto)',
        section: 'Organograma',
        display: 'range',
        min: 0,
        max: 8,
        step: 1,
        default: 0,
      },
      mostrarValorNoCartao: {
        type: 'boolean',
        label: 'Mostrar o valor dentro do cartão',
        section: 'Rótulos',
        default: true,
      },
      mostrarContagemDeEquipe: {
        type: 'boolean',
        label: 'Mostrar quantos descendentes cada cartão tem',
        section: 'Rótulos',
        default: true,
      },
      preencherCartao: {
        type: 'boolean',
        label: 'Cartão preenchido com a cor do ramo',
        section: 'Cores',
        default: false,
      },
    }
  ),
  exigencia: { dimensoesMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = opcoesDinamicasDeHierarquia(modelo);
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    if (dimensoes.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoCargo', 'Campo da segunda linha do cartão', dimensoes, {
          secao: 'Rótulos',
          incluirNenhum: true,
          padrao: '',
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz: elementoRaiz, largura, altura } = ctx;

    const { raiz, avisos, campoDoValor, quantidadeDeNos } = construirHierarquia(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (!raiz || quantidadeDeNos < 2) {
      ctx.mostrarVazio(
        'Não consegui montar o organograma. Use um par de campos id/superior ' +
          '(ou várias dimensões, uma por nível) e confira a seção Dados.'
      );
      return;
    }

    if (!ctx.estado.recolhidos) ctx.estado.recolhidos = new Set();
    const recolhidos = ctx.estado.recolhidos;

    // Primeira renderização: aplica o nível inicial de recolhimento.
    const nivelInicial = Number(config.comecarRecolhidoAPartirDe) || 0;
    if (nivelInicial > 0 && !ctx.estado.recolhimentoInicialAplicado) {
      for (const no of raiz.descendants()) {
        if (no.depth >= nivelInicial && no.children && no.children.length) {
          recolhidos.add(caminhoDoNo(no));
        }
      }
      ctx.estado.recolhimentoInicialAplicado = true;
    }

    // Totais, contagens e caminhos saem da árvore COMPLETA, numa passada
    // só: um cartão recolhido tem que continuar mostrando o tamanho real
    // da sua área, e o acessor de filhos abaixo precisa de uma consulta
    // O(1) — procurar o caminho a cada nó deixaria isto quadrático.
    const caminhoPorDados = new Map();
    const completosPorCaminho = new Map();
    for (const no of raiz.descendants()) {
      const caminho = caminhoDoNo(no);
      caminhoPorDados.set(no.data, caminho);
      completosPorCaminho.set(caminho, {
        valor: no.value || 0,
        descendentes: no.descendants().length - 1,
        filhos: no.children ? no.children.length : 0,
      });
    }

    // A árvore visível corta os filhos dos nós recolhidos. O layout tem que
    // rodar sobre ELA, senão fica um vazio onde estavam os nós escondidos.
    const visivel = d3Hierarchy(raiz.data, (dados) => {
      const caminho = caminhoPorDados.get(dados);
      return caminho && recolhidos.has(caminho) ? null : dados.filhos;
    })
      .sum((no) => (no.filhos && no.filhos.length ? 0 : no.valor || 0))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    ctx.limparRaiz();
    injetarEstilo(elementoRaiz, CSS, 'oc');
    const area = criarEl('div', { classe: 'oc-area', pai: elementoRaiz });

    const larguraDoCartao = Number(config.larguraDoCartao) || 150;
    const alturaDoCartao = Number(config.alturaDoCartao) || 56;
    const entreNiveis = Number(config.espacoEntreNiveis) || 60;
    const entreIrmaos = Number(config.espacoEntreIrmaos) || 16;
    const deCimaParaBaixo = (config.orientacao || 'cima') === 'cima';

    // `nodeSize` em vez de `size`: o organograma não deve ser espremido
    // para caber na tela — ele cresce e a área rola.
    const layout = d3Tree().nodeSize(
      deCimaParaBaixo
        ? [larguraDoCartao + entreIrmaos, alturaDoCartao + entreNiveis]
        : [alturaDoCartao + entreIrmaos, larguraDoCartao + entreNiveis]
    );
    layout(visivel);

    const nos = visivel.descendants();
    const xs = nos.map((n) => (deCimaParaBaixo ? n.x : n.y));
    const ys = nos.map((n) => (deCimaParaBaixo ? n.y : n.x));
    const margem = 24;
    const minX = Math.min(...xs) - larguraDoCartao / 2 - margem;
    const maxX = Math.max(...xs) + larguraDoCartao / 2 + margem;
    const minY = Math.min(...ys) - alturaDoCartao / 2 - margem;
    const maxY = Math.max(...ys) + alturaDoCartao / 2 + margem;

    const larguraDoDesenho = Math.max(largura, maxX - minX);
    const alturaDoDesenho = Math.max(altura, maxY - minY);

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: {
        width: larguraDoDesenho,
        height: alturaDoDesenho,
        viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
      },
    });

    // ---------- Cores (6.2) ----------
    // Paleta pelo caminho único: respeita "Inverter ordem das cores" (antes
    // lia-se `coresDaPaleta(config.paleta)` direto e a opção não fazia nada).
    const paleta = paletaDoConfig(config);
    const corPorRamo = new Map();
    (visivel.children || []).forEach((filho, i) => corPorRamo.set(filho, corDoItem(config, i)));
    const corDo = (no) => {
      if (!no.parent) return config.corUnica || tema.textoSuave;
      let atual = no;
      while (atual.parent && atual.parent.parent) atual = atual.parent;
      return corPorRamo.get(atual) || paleta[0] || tema.destaque;
    };

    // Contorno do cartão. A "Cor do contorno" do painel tem default
    // #FFFFFF — branco sobre cartão branco faria o cartão sumir. Enquanto o
    // usuário não escolher outra cor, o contorno é a cor do ramo (como
    // antes); mostrar, espessura e estilo valem sempre.
    const contornoDoPainel = lerContorno(config, tema);
    const corEscolhida = String(config.corDoContorno || '').trim().toUpperCase();
    const contornoAutomatico = corEscolhida === '' || corEscolhida === COR_PADRAO_DO_CONTORNO;

    // Tooltip: valor derivado (soma da área) no formato do campo no Looker,
    // independente das opções de rótulo.
    const valueFormat = campoDoValor ? campoDoValor.valueFormat : undefined;
    const formatar = formatadorDeValueFormat(valueFormat);
    // Rótulos (6.1): relidos a cada desenho.
    const rot = lerRotulos(config, tema);
    const totalGeral = raiz.value || 0;

    const posicaoDe = (no) => (deCimaParaBaixo ? { x: no.x, y: no.y } : { x: no.y, y: no.x });

    // ---------- Ligações ----------
    // Na cor de borda do tema (a cor do ramo já está no cartão).
    const grupoDeLigacoes = criarSvgEl('g', { pai: svg });
    for (const no of nos) {
      if (!no.parent) continue;
      const pai = posicaoDe(no.parent);
      const filho = posicaoDe(no);
      criarSvgEl('path', {
        pai: grupoDeLigacoes,
        classe: 'oc-ligacao',
        atributos: {
          d: cotovelo(pai, filho, deCimaParaBaixo, alturaDoCartao, larguraDoCartao),
          stroke: tema.bordaForte || tema.borda,
          'stroke-width': 1.5,
        },
      });
    }

    // ---------- Cartões ----------
    // Tooltip ÚNICO do gráfico (criado uma vez pelo núcleo).
    const tooltip = ctx.tooltip();

    const campoDoCargo = modelo.dimensoes.find((d) => d.nome === config.campoDoCargo) || null;

    for (const no of nos) {
      const { x, y } = posicaoDe(no);
      const cor = corDo(no);
      const caminho = caminhoPorDados.get(no.data) || caminhoDoNo(no);
      const completo = completosPorCaminho.get(caminho) || {
        valor: no.value || 0,
        descendentes: 0,
        filhos: 0,
      };
      const estaRecolhido = recolhidos.has(caminho);

      const grupo = criarSvgEl('g', { pai: svg, classe: 'oc-cartao' });
      const preenchido = config.preencherCartao === true;

      const caixa = criarSvgEl('rect', {
        pai: grupo,
        classe: 'oc-caixa',
        atributos: {
          x: x - larguraDoCartao / 2,
          y: y - alturaDoCartao / 2,
          width: larguraDoCartao,
          height: alturaDoCartao,
          rx: Number(config.raioDoCartao) || 0,
        },
      });
      aplicarPreenchimento(caixa, preenchido ? cor : tema.fundoElevado, config);
      aplicarContorno(caixa, contornoAutomatico ? Object.assign({}, contornoDoPainel, { cor }) : contornoDoPainel);

      if (rot.mostrar) {
        desenharTextosDoCartao({
          grupo,
          no,
          x,
          y,
          rot,
          tema,
          cor,
          preenchido,
          completo,
          larguraDoCartao,
          alturaDoCartao,
          valueFormat,
          totalGeral,
          mostrarValor: config.mostrarValorNoCartao !== false && !!campoDoValor,
          mostrarContagem: config.mostrarContagemDeEquipe !== false,
          cargo:
            campoDoCargo && no.data.indiceDaLinha >= 0
              ? modelo.texto(modelo.linhas[no.data.indiceDaLinha], campoDoCargo.nome, undefined, '')
              : '',
        });
      }

      // Botão de recolher: só faz sentido em quem tem filhos.
      if (config.permitirRecolher !== false && completo.filhos > 0) {
        const bx = deCimaParaBaixo ? x : x + larguraDoCartao / 2;
        const by = deCimaParaBaixo ? y + alturaDoCartao / 2 : y;
        const botao = criarSvgEl('g', { pai: grupo, classe: 'oc-botao' });
        criarSvgEl('circle', {
          pai: botao,
          atributos: { cx: bx, cy: by, r: 8, fill: tema.fundoElevado, stroke: cor, 'stroke-width': 1.5 },
        });
        const sinal = criarSvgEl('text', {
          pai: botao,
          classe: 'oc-texto',
          atributos: {
            x: bx,
            y: by,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'font-size': 11,
            'font-weight': '700',
            fill: cor,
          },
        });
        definirTexto(sinal, estaRecolhido ? `+${completo.filhos}` : '−');
        if (estaRecolhido) sinal.setAttribute('font-size', 8);

        ctx.eventos.on(botao, 'click', (ev) => {
          // Não deixa o clique chegar ao cartão (que abriria o drill).
          ev.stopPropagation();
          if (recolhidos.has(caminho)) recolhidos.delete(caminho);
          else recolhidos.add(caminho);
          ctx.redesenhar();
        });
      }

      const conteudo = () => {
        const linhas = [];
        if (campoDoValor) linhas.push({ rotulo: campoDoValor.rotuloCurto, valor: formatar(completo.valor), cor });
        linhas.push({ rotulo: 'Nível', valor: String(no.depth) });
        if (completo.filhos) linhas.push({ rotulo: 'Subordinados diretos', valor: String(completo.filhos) });
        if (completo.descendentes) linhas.push({ rotulo: 'Total abaixo', valor: String(completo.descendentes) });
        return { titulo: no.data.rotulo, linhas };
      };

      if (tooltip) {
        ctx.eventos.on(grupo, 'pointerenter', (ev) => tooltip.mostrar(conteudo(), ev.clientX, ev.clientY));
        ctx.eventos.on(grupo, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(grupo, 'pointerleave', () => tooltip.esconder());
      }

      // "Ação do clique" (drill do Looker / fixar tooltip / nenhuma).
      ctx.eventos.on(grupo, 'click', (ev) => {
        const celula =
          no.data.indiceDaLinha >= 0 && no.data.campo
            ? modelo.celula(modelo.linhas[no.data.indiceDaLinha], no.data.campo.nome)
            : null;
        ctx.cliqueNoItem(ev, celula, conteudo());
      });
    }

    if (recolhidos.size) {
      const dica = criarEl('div', { classe: 'oc-dica', pai: elementoRaiz });
      dica.style.color = tema.textoSuave;
      definirTexto(dica, `${recolhidos.size} área(s) recolhida(s) — clique no + para abrir`);
    }
  },

});

/* ------------------------------------------------------------------ */

/**
 * Textos de um cartão, pelo bloco "Rótulos" do painel (correções v2, 6.1).
 *
 * Linhas: nome (classe `oc-nome`), segunda linha (campo do cargo) e a
 * linha de valor/contagem. Mapeamento das opções:
 *   - tamanho: o nome usa "Tamanho do rótulo"; as outras linhas, 2px menos;
 *   - cor / negrito / rotação: todas as linhas (`estilizarRotulo`). Sem
 *     negrito, o nome continua seminegrito (600), como antes;
 *   - posição: auto/centro = centralizado; dentro = alinhado à esquerda;
 *     fora / fora com linha = alinhado à direita;
 *   - conteúdo: "valor" (padrão) = valor na linha de baixo; "nome" = sem
 *     valor; "nomeValor" = "nome: valor" na primeira linha; "percentual" e
 *     "valorPercentual" = percentual do total da organização;
 *   - formato / casas: o número do cartão (`textoDoRotulo`);
 *   - truncar: limite de caracteres (além do que a largura do cartão já
 *     impõe);
 *   - esconder sobrepostos: linha que não cabe na altura do cartão some
 *     (prioridade: nome, cargo, valor).
 */
function desenharTextosDoCartao({
  grupo,
  no,
  x,
  y,
  rot,
  tema,
  cor,
  preenchido,
  completo,
  larguraDoCartao,
  alturaDoCartao,
  valueFormat,
  totalGeral,
  mostrarValor,
  mostrarContagem,
  cargo,
}) {
  const semCorte = Object.assign({}, rot, { truncar: 0 });
  const tamanhoMenor = Math.max(6, rot.tamanho - 2);
  const linhas = [];

  let nome = String(no.data.rotulo || '');
  if (mostrarValor && rot.conteudo === 'nomeValor') {
    nome = textoDoRotulo(semCorte, { valor: completo.valor, nome, valueFormat });
  }
  linhas.push({ texto: nome, tamanho: rot.tamanho, nome: true });
  if (cargo) linhas.push({ texto: cargo, tamanho: tamanhoMenor });

  const extras = [];
  if (mostrarValor && rot.conteudo !== 'nome' && rot.conteudo !== 'nomeValor') {
    extras.push(textoDoRotulo(semCorte, { valor: completo.valor, total: totalGeral, valueFormat }));
  }
  if (mostrarContagem && completo.descendentes > 0) extras.push(`${completo.descendentes} abaixo`);
  if (extras.length) linhas.push({ texto: extras.join(' · '), tamanho: tamanhoMenor, suave: true });

  const corDoTexto = preenchido ? textoLegivelSobre(cor, tema) : tema.texto;
  const ancora =
    rot.posicao === 'dentro' ? 'start' : rot.posicao === 'fora' || rot.posicao === 'foraComLinha' ? 'end' : 'middle';
  const margem = 8;
  const tx = ancora === 'start' ? x - larguraDoCartao / 2 + margem : ancora === 'end' ? x + larguraDoCartao / 2 - margem : x;
  const alturaDaLinha = alturaDoCartao / (linhas.length + 0.6);
  let ocupado = 0;

  linhas.forEach((linha, i) => {
    const ty = y - alturaDoCartao / 2 + alturaDaLinha * (i + 0.9);
    const el = criarSvgEl('text', {
      pai: grupo,
      classe: linha.nome ? 'oc-texto oc-nome' : 'oc-texto',
      atributos: { x: tx, y: ty, 'text-anchor': ancora, 'dominant-baseline': 'central' },
    });
    const larguraUtil = larguraDoCartao - (ancora === 'middle' ? 0 : margem * 2);
    let limite = Math.max(1, Math.floor(larguraUtil / (linha.tamanho * 0.56)));
    if (rot.truncar > 0) limite = Math.min(limite, rot.truncar);
    definirTexto(el, truncar(linha.texto, limite));

    estilizarRotulo(el, rot, {
      corAutomatica: linha.suave && !preenchido ? tema.textoSuave : corDoTexto,
      x: tx,
      y: ty,
    });
    el.setAttribute('font-size', String(linha.tamanho));
    if (linha.nome && !rot.negrito) el.setAttribute('font-weight', '600');

    ocupado += linha.tamanho * 1.15;
    if (rot.evitarColisao && ocupado > alturaDoCartao - 4 && i > 0) {
      el.setAttribute('display', 'none');
    }
  });
}


/**
 * Identidade estável de um nó entre renderizações.
 *
 * Usar o objeto do nó não serve: a árvore é remontada a cada desenho e as
 * referências mudam. O caminho de chaves da raiz até o nó sobrevive.
 */
function caminhoDoNo(no) {
  return no
    .ancestors()
    .reverse()
    .map((n) => n.data.chave)
    .join(' ');
}

/** Ligação em ângulo reto entre dois cartões. */
function cotovelo(pai, filho, deCimaParaBaixo, alturaDoCartao, larguraDoCartao) {
  if (deCimaParaBaixo) {
    const y1 = pai.y + alturaDoCartao / 2;
    const y2 = filho.y - alturaDoCartao / 2;
    const meio = (y1 + y2) / 2;
    return `M${pai.x},${y1}V${meio.toFixed(2)}H${filho.x}V${y2}`;
  }
  const x1 = pai.x + larguraDoCartao / 2;
  const x2 = filho.x - larguraDoCartao / 2;
  const meio = (x1 + x2) / 2;
  return `M${x1},${pai.y}H${meio.toFixed(2)}V${filho.y}H${x2}`;
}
