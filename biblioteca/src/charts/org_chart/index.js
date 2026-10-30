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
 * cartão; a aba Cores vale para o cartão (paleta com "Inverter ordem",
 * opacidade, contorno — com a cor padrão do painel, o contorno segue a cor
 * do ramo); tooltip único; valor no formato do campo. Clique no cartão
 * segue a "Ação do clique"; clique no botão +/− recolhe ou abre a área (e
 * não dispara o drill).
 *
 * Melhorias v3 (5.13), com as opções comuns das árvores (`_arvore/comum.js`):
 *   - Botões "Expandir tudo", "Colapsar tudo" e "Centralizar". DEFEITO
 *     corrigido: o tile salva `mostrarBotoesDeExpandir: true`, mas o
 *     organograma nunca declarou nem desenhou essa opção (só o
 *     arvores_multiplas tinha) — por isso os botões não apareciam.
 *   - Estética: cor por ramo (padrão, como antes), nível, nó, valor ou
 *     única (`corDoCartaoPor`); borda pelas opções de contorno; sombra
 *     (`sombraDoCartao`); balão que se ajusta ao conteúdo
 *     (`cartaoAjustavel`); fonte e alinhamento do texto
 *     (`fonteDoCartao`, `alinhamentoDoTextoDoCartao` — "Automático" segue a
 *     posição do rótulo, como antes); contraste automático do texto
 *     (`contrasteAutomatico`); campos do balão (`mostrarNomeNoCartao`,
 *     `mostrarValorNoCartao`, `mostrarPercentualNoCartao`,
 *     `mostrarContagemDeEquipe`); contador (`estiloDoContador`: círculo,
 *     pílula ou oculto — o "+20" agora cabe no círculo); ligações
 *     (`corDaLigacaoDoOrg`, `espessuraDaLigacaoDoOrg`,
 *     `formaDaLigacaoDoOrg`: cotovelo, reta ou curva).
 *   - Barras de rolagem só quando o desenho é maior que a área (o <svg>
 *     tem exatamente o tamanho da área quando cabe, e display:block).
 *   - Abrir/fechar animado (5.9), centralizar (5.10) e Texto longo (5.11):
 *     no modo "Mostrar inteiro" o cartão cresce até o maior nome (antes o
 *     nome terminava em "…"). `truncarRotulo` só vale em "Cortar com
 *     reticências".
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { formatadorDeValueFormat } from '../../core/format.js';
import { textoLegivelSobre } from '../../core/theme.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo } from '../../core/rotulos.js';
import { paletaDoConfig, corDoItem, lerContorno, aplicarContorno, aplicarPreenchimento } from '../../core/cores.js';
import { larguraDoTexto } from '../../core/medida-texto.js';
import { lerTextoLongo, ajustarRotulo } from '../../core/texto-longo.js';
import { criarIconePorValor, desenharIconePorValor } from '../../core/icone-por-valor.js';
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

/** Default declarado de "Cor do contorno" (blocoDeCores): tratado como "automática". */
const COR_PADRAO_DO_CONTORNO = '#FFFFFF';

const CSS = `
.oc-raiz{display:flex;flex-direction:column;width:100%;height:100%;}
.oc-area{position:relative;width:100%;flex:1 1 auto;min-height:0;overflow:auto;}
.oc-area>svg{display:block;}
.oc-cartao{cursor:pointer;}
.oc-ligacao{fill:none;}
.oc-texto{pointer-events:none;}
.oc-botao{cursor:pointer;}
.oc-dica{font-size:10px;opacity:.65;align-self:center;margin-left:auto;padding-right:8px;}
`;

const FONTES = {
  sistema: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
  serifada: 'Georgia, "Times New Roman", serif',
};

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
      // ---------- Melhorias v3 (5.13) ----------
      corDoCartaoPor: {
        type: 'string',
        label: 'Cor do cartão por',
        section: 'Cores',
        display: 'select',
        default: 'ramo',
        values: listaDeValores([
          { rotulo: 'Ramo (como antes)', valor: 'ramo' },
          { rotulo: 'Nível', valor: 'nivel' },
          { rotulo: 'Nó', valor: 'no' },
          { rotulo: 'Valor', valor: 'valor' },
          { rotulo: 'Cor única', valor: 'unica' },
        ]),
      },
      sombraDoCartao: { type: 'boolean', label: 'Sombra do cartão', section: 'Organograma', default: false },
      cartaoAjustavel: { type: 'boolean', label: 'Cartão cresce com o texto', section: 'Organograma', default: true },
      fonteDoCartao: {
        type: 'string',
        label: 'Fonte do cartão',
        section: 'Organograma',
        display: 'select',
        default: 'tema',
        values: listaDeValores([
          { rotulo: 'Do tema', valor: 'tema' },
          { rotulo: 'Sistema', valor: 'sistema' },
          { rotulo: 'Monoespaçada', valor: 'mono' },
          { rotulo: 'Serifada', valor: 'serifada' },
        ]),
      },
      alinhamentoDoTextoDoCartao: {
        type: 'string',
        label: 'Alinhamento do texto',
        section: 'Organograma',
        display: 'select',
        default: 'auto',
        values: listaDeValores([
          { rotulo: 'Automático (posição do rótulo)', valor: 'auto' },
          { rotulo: 'Esquerda', valor: 'esquerda' },
          { rotulo: 'Centro', valor: 'centro' },
          { rotulo: 'Direita', valor: 'direita' },
        ]),
      },
      contrasteAutomatico: { type: 'boolean', label: 'Contraste automático do texto', section: 'Cores', default: true },
      mostrarNomeNoCartao: { type: 'boolean', label: 'Nome no cartão', section: 'Rótulos', default: true },
      mostrarPercentualNoCartao: { type: 'boolean', label: 'Percentual no cartão', section: 'Rótulos', default: false },
      estiloDoContador: {
        type: 'string',
        label: 'Estilo do contador',
        section: 'Organograma',
        display: 'select',
        default: 'circulo',
        values: listaDeValores([
          { rotulo: 'Círculo', valor: 'circulo' },
          { rotulo: 'Pílula', valor: 'pilula' },
          { rotulo: 'Oculto', valor: 'oculto' },
        ]),
      },
      corDaLigacaoDoOrg: { type: 'string', label: 'Cor das ligações', section: 'Cores', display: 'color', default: '' },
      espessuraDaLigacaoDoOrg: { type: 'number', label: 'Espessura das ligações', section: 'Organograma', default: 1.5 },
      formaDaLigacaoDoOrg: {
        type: 'string',
        label: 'Forma das ligações',
        section: 'Organograma',
        display: 'select',
        default: 'cotovelo',
        values: listaDeValores([
          { rotulo: 'Cotovelo', valor: 'cotovelo' },
          { rotulo: 'Reta', valor: 'reta' },
          { rotulo: 'Curva', valor: 'curva' },
        ]),
      },
    },
    opcoesComunsDasArvores()
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
    const { modelo, config, tema, raiz: elementoRaiz, largura, altura, estado } = ctx;

    const { raiz, avisos, campoDoValor, quantidadeDeNos } = construirHierarquia(modelo, config);
    for (const aviso of avisos) ctx.avisar(aviso);

    if (!raiz || quantidadeDeNos < 2) {
      ctx.mostrarVazio(
        'Não consegui montar o organograma. Use um par de campos id/superior ' +
          '(ou várias dimensões, uma por nível) e confira a seção Dados.'
      );
      return;
    }

    if (!estado.recolhidos) estado.recolhidos = new Set();
    const recolhidos = estado.recolhidos;

    // Primeira renderização: aplica o nível inicial de recolhimento.
    const nivelInicial = Number(config.comecarRecolhidoAPartirDe) || 0;
    if (nivelInicial > 0 && !estado.recolhimentoInicialAplicado) {
      for (const no of raiz.descendants()) {
        if (no.depth >= nivelInicial && no.children && no.children.length) recolhidos.add(caminhoDoNo(no));
      }
      estado.recolhimentoInicialAplicado = true;
    }

    // Totais, contagens e caminhos saem da árvore COMPLETA, numa passada só.
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

    // A árvore visível corta os filhos dos nós recolhidos.
    const visivel = d3Hierarchy(raiz.data, (dados) => {
      const caminho = caminhoPorDados.get(dados);
      return caminho && recolhidos.has(caminho) ? null : dados.filhos;
    })
      .sum((no) => (no.filhos && no.filhos.length ? 0 : no.valor || 0))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const alternado = estado.ultimoAlternado || null;
    estado.ultimoAlternado = null;
    const centralizarAgora = deveCentralizar(config, {
      primeiro: !estado.jaCentralizou,
      alternou: !!alternado,
      botao: !!estado.centralizarAgora,
    });
    estado.centralizarAgora = false;

    ctx.limparRaiz();
    injetarEstilo(elementoRaiz, CSS + CSS_BARRA + CSS_ANIMACAO_ARVORE, 'oc');
    const tl = lerTextoLongo(config);
    const caixaRaiz = criarEl('div', { classe: `oc-raiz${tl.selecionavel ? '' : ' am-sem-selecao'}`, pai: elementoRaiz });

    // ---------- Botões (5.13: o defeito era não existirem aqui) ----------
    const barra = criarBarraDaArvore({
      ctx,
      pai: caixaRaiz,
      config,
      tema,
      aoExpandir: () => {
        recolhidos.clear();
        estado.ultimoAlternado = '*';
        ctx.redesenhar();
      },
      aoColapsar: () => {
        recolhidos.clear();
        for (const no of raiz.descendants()) if (no.depth >= 1 && no.children && no.children.length) recolhidos.add(caminhoDoNo(no));
        estado.ultimoAlternado = '*';
        ctx.redesenhar();
      },
      aoCentralizar: () => {
        estado.centralizarAgora = true;
        ctx.redesenhar();
      },
    });
    if (recolhidos.size) {
      const dica = criarEl('div', { classe: 'oc-dica', pai: barra || caixaRaiz });
      dica.style.color = tema.textoSuave;
      definirTexto(dica, `${recolhidos.size} área(s) recolhida(s) — clique no + para abrir`);
    }
    const area = criarEl('div', { classe: 'oc-area', pai: caixaRaiz });

    // ---------- Textos de cada cartão (antes do layout: definem o tamanho) ----------
    const rot = lerRotulos(config, tema);
    const valueFormat = campoDoValor ? campoDoValor.valueFormat : undefined;
    const formatar = formatadorDeValueFormat(valueFormat);
    const totalGeral = raiz.value || 0;
    const campoDoCargo = modelo.dimensoes.find((d) => d.nome === config.campoDoCargo) || null;
    const larguraBase = Number(config.larguraDoCartao) || 150;
    const alturaBase = Number(config.alturaDoCartao) || 56;
    const ajustavel = config.cartaoAjustavel !== false;
    const margemInterna = 8;
    const fonte = FONTES[config.fonteDoCartao] || tema.fonte;
    const nos = visivel.descendants();
    const textos = new Map();
    let larguraNecessaria = 0;
    let alturaNecessaria = 0;
    for (const no of nos) {
      const caminho = caminhoPorDados.get(no.data) || caminhoDoNo(no);
      const completo = completosPorCaminho.get(caminho) || { valor: no.value || 0, descendentes: 0, filhos: 0 };
      const cargo =
        campoDoCargo && no.data.indiceDaLinha >= 0
          ? modelo.texto(modelo.linhas[no.data.indiceDaLinha], campoDoCargo.nome, undefined, '')
          : '';
      const linhas = rot.mostrar
        ? linhasDoCartao({
          no,
          rot,
          tl,
          completo,
          valueFormat,
          totalGeral,
          cargo,
          config,
          temValor: !!campoDoValor,
          larguraUtil: ajustavel && tl.modo === 'inteiro' ? Infinity : larguraBase - margemInterna * 2,
        })
        : [];
      textos.set(no, { linhas, completo, caminho });
      larguraNecessaria = Math.max(larguraNecessaria, ...linhas.map((l) => l.largura + margemInterna * 2 + tl.margemExtra));
      alturaNecessaria = Math.max(alturaNecessaria, linhas.reduce((a, l) => a + l.tamanho * 1.25, 0) + 12);
    }
    // Balão que se ajusta ao conteúdo (uniforme, para o layout em grade do d3).
    const larguraDoCartao = ajustavel ? Math.max(larguraBase, Math.ceil(larguraNecessaria)) : larguraBase;
    const alturaDoCartao = ajustavel ? Math.max(alturaBase, Math.ceil(alturaNecessaria)) : alturaBase;
    const entreNiveis = Number(config.espacoEntreNiveis) || 60;
    const entreIrmaos = Number(config.espacoEntreIrmaos) || 16;
    const deCimaParaBaixo = (config.orientacao || 'cima') === 'cima';

    // `nodeSize`: o organograma não é espremido; cresce e a área rola.
    d3Tree().nodeSize(
      deCimaParaBaixo
        ? [larguraDoCartao + entreIrmaos, alturaDoCartao + entreNiveis]
        : [alturaDoCartao + entreIrmaos, larguraDoCartao + entreNiveis]
    )(visivel);

    const posicaoDe = (no) => (deCimaParaBaixo ? { x: no.x, y: no.y } : { x: no.y, y: no.x });
    const xs = nos.map((n) => posicaoDe(n).x);
    const ys = nos.map((n) => posicaoDe(n).y);
    const margem = 24;
    const minX = Math.min(...xs) - larguraDoCartao / 2 - margem;
    const maxX = Math.max(...xs) + larguraDoCartao / 2 + margem;
    const minY = Math.min(...ys) - alturaDoCartao / 2 - margem;
    const maxY = Math.max(...ys) + alturaDoCartao / 2 + margem;

    // ---------- Centralizar (5.10) e rolagem só quando precisa ----------
    const alturaDaBarra = barra ? 28 : 0;
    const visivelNaArea = {
      largura: Math.max(80, area.clientWidth || largura),
      altura: Math.max(80, (area.clientHeight || altura) - (area.clientHeight ? 0 : alturaDaBarra)),
    };
    const desenho = { largura: maxX - minX, altura: maxY - minY };
    const alvoNo =
      config.oQueCentralizar === 'raiz'
        ? visivel
        : config.oQueCentralizar === 'selecionado'
          ? nos.find((n) => caminhoPorDados.get(n.data) === estado.selecionado) || null
          : null;
    const plano = planoDeCentralizacao({
      area: visivelNaArea,
      desenho,
      alvo: alvoNo ? { x: posicaoDe(alvoNo).x - minX, y: posicaoDe(alvoNo).y - minY } : null,
      config,
    });

    const svg = criarSvgEl('svg', {
      pai: area,
      atributos: { width: plano.largura, height: plano.altura, viewBox: `0 0 ${plano.largura} ${plano.altura}` },
    });
    const conteudo = criarSvgEl('g', {
      pai: svg,
      atributos: { transform: `translate(${(plano.offsetX - minX).toFixed(2)},${(plano.offsetY - minY).toFixed(2)})` },
    });
    if (centralizarAgora) {
      area.scrollLeft = plano.scrollLeft;
      area.scrollTop = plano.scrollTop;
      estado.jaCentralizou = true;
    } else if (estado.rolagemOrg) {
      area.scrollLeft = estado.rolagemOrg.x;
      area.scrollTop = estado.rolagemOrg.y;
    }
    ctx.eventos.on(area, 'scroll', () => {
      estado.rolagemOrg = { x: area.scrollLeft, y: area.scrollTop };
    });
    if (config.sombraDoCartao === true) {
      const defs = criarSvgEl('defs', { pai: svg });
      const filtro = criarSvgEl('filter', { pai: defs, atributos: { id: 'oc-sombra', x: '-10%', y: '-10%', width: '130%', height: '140%' } });
      criarSvgEl('feDropShadow', { pai: filtro, atributos: { dx: 0, dy: 2, stdDeviation: 2.5, 'flood-opacity': 0.22 } });
    }

    // ---------- Cores ----------
    const paleta = paletaDoConfig(config);
    const corPorRamo = new Map();
    (visivel.children || []).forEach((filho, i) => corPorRamo.set(filho, corDoItem(config, i)));
    const maiorValor = Math.max(1, ...nos.map((n) => textos.get(n).completo.valor || 0));
    const corDo = (no, indice) => {
      const modo = config.corDoCartaoPor || 'ramo';
      if (modo === 'unica') return config.corUnica || paleta[0] || tema.destaque;
      if (modo === 'nivel') return paleta[no.depth % paleta.length];
      if (modo === 'no') return paleta[indice % paleta.length];
      if (modo === 'valor') {
        const t = Math.sqrt((textos.get(no).completo.valor || 0) / maiorValor);
        return paleta[Math.min(paleta.length - 1, Math.floor(t * (Math.min(paleta.length, 6) - 1) + 0.5))];
      }
      if (!no.parent) return config.corUnica || tema.textoSuave;
      let atual = no;
      while (atual.parent && atual.parent.parent) atual = atual.parent;
      return corPorRamo.get(atual) || paleta[0] || tema.destaque;
    };
    const contornoDoPainel = lerContorno(config, tema);
    const corEscolhida = String(config.corDoContorno || '').trim().toUpperCase();
    const contornoAutomatico = corEscolhida === '' || corEscolhida === COR_PADRAO_DO_CONTORNO;

    // ---------- Ligações ----------
    const grupoDeLigacoes = criarSvgEl('g', { pai: conteudo });
    grupoDeLigacoes.style.transition = 'opacity .2s ease';
    const formaDaLigacao = config.formaDaLigacaoDoOrg || 'cotovelo';
    for (const no of nos) {
      if (!no.parent) continue;
      criarSvgEl('path', {
        pai: grupoDeLigacoes,
        classe: 'oc-ligacao',
        atributos: {
          d: ligacao(posicaoDe(no.parent), posicaoDe(no), deCimaParaBaixo, alturaDoCartao, larguraDoCartao, formaDaLigacao),
          stroke: String(config.corDaLigacaoDoOrg || '').trim() || tema.bordaForte || tema.borda,
          'stroke-width': Number(config.espessuraDaLigacaoDoOrg) > 0 ? Number(config.espessuraDaLigacaoDoOrg) : 1.5,
        },
      });
    }

    // ---------- Cartões ----------
    const tooltip = ctx.tooltip();
    const iconePorValor = criarIconePorValor(config);
    const grupoDosCartoes = criarSvgEl('g', { pai: conteudo });
    const atuais = [];
    nos.forEach((no, indice) => {
      const { x, y } = posicaoDe(no);
      const cor = corDo(no, indice);
      const { linhas, completo, caminho } = textos.get(no);
      const estaRecolhido = recolhidos.has(caminho);

      const grupo = criarSvgEl('g', { pai: grupoDosCartoes, classe: 'oc-cartao' });
      grupo.setAttribute('data-item', caminho);
      grupo.setAttribute('data-chave', caminho);
      atuais.push({ chave: caminho, el: grupo, x, y, pai: no.parent ? caminhoPorDados.get(no.parent.data) : null });
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
      if (config.sombraDoCartao === true) caixa.setAttribute('filter', 'url(#oc-sombra)');

      desenharLinhasDoCartao({ grupo, linhas, x, y, rot, tema, cor, preenchido, larguraDoCartao, alturaDoCartao, config, fonte, margemInterna });

      // Ícone por valor (5.14f): no canto esquerdo do cartão.
      const ic = desenharIconePorValor(iconePorValor, { pai: grupo, valor: no.data.rotulo, lado: 16, corPadrao: cor, estilo: config.estiloDoIcone });
      if (ic) {
        ic.setAttribute('x', String(x - larguraDoCartao / 2 + 4));
        ic.setAttribute('y', String(y - alturaDoCartao / 2 + 4));
      }

      // Botão de recolher / contador: só em quem tem filhos.
      if (config.permitirRecolher !== false && completo.filhos > 0 && config.estiloDoContador !== 'oculto') {
        const bx = deCimaParaBaixo ? x : x + larguraDoCartao / 2;
        const by = deCimaParaBaixo ? y + alturaDoCartao / 2 : y;
        desenharContador({ grupo, bx, by, cor, tema, texto: estaRecolhido ? `+${completo.filhos}` : '−', estilo: config.estiloDoContador || 'circulo' }).addEventListener(
          'click',
          (ev) => {
            // Não deixa o clique chegar ao cartão (que abriria o drill).
            ev.stopPropagation();
            if (recolhidos.has(caminho)) recolhidos.delete(caminho);
            else recolhidos.add(caminho);
            estado.ultimoAlternado = caminho;
            ctx.redesenhar();
          }
        );
      }

      const conteudoDoTooltip = () => {
        const l = [];
        if (campoDoValor) l.push({ rotulo: campoDoValor.rotuloCurto, valor: formatar(completo.valor), cor });
        l.push({ rotulo: 'Nível', valor: String(no.depth) });
        if (completo.filhos) l.push({ rotulo: 'Subordinados diretos', valor: String(completo.filhos) });
        if (completo.descendentes) l.push({ rotulo: 'Total abaixo', valor: String(completo.descendentes) });
        return { titulo: no.data.rotulo, linhas: l };
      };

      if (tooltip) {
        ctx.eventos.on(grupo, 'pointerenter', (ev) => tooltip.mostrar(conteudoDoTooltip(), ev.clientX, ev.clientY));
        ctx.eventos.on(grupo, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        ctx.eventos.on(grupo, 'pointerleave', () => tooltip.esconder());
      }

      // "Ação do clique" (drill do Looker / fixar tooltip / nenhuma).
      ctx.eventos.on(grupo, 'click', (ev) => {
        estado.selecionado = caminho;
        const celula =
          no.data.indiceDaLinha >= 0 && no.data.campo
            ? modelo.celula(modelo.linhas[no.data.indiceDaLinha], no.data.campo.nome)
            : null;
        ctx.cliqueNoItem(ev, celula, conteudoDoTooltip());
      });
    });

    // ---------- Abrir/fechar animado (5.9) ----------
    const fantasmas = criarSvgEl('g', { pai: conteudo, classe: 'oc-fantasmas' });
    estado.posicoesOrg = animarAbrirFechar({
      ctx,
      anteriores: estado.posicoesOrg,
      atuais,
      camadaDosFantasmas: fantasmas,
      anim: animacaoDeExpandir(config),
      alternado,
    });
    if (alternado && animacaoDeExpandir(config).ligada) {
      grupoDeLigacoes.style.opacity = '0';
      ctx.agendarQuadro(() => {
        grupoDeLigacoes.style.opacity = '';
      });
    }
  },
});

/* ------------------------------------------------------------------ */

/**
 * Linhas de texto de um cartão (nome, cargo, valor/percentual/contagem),
 * já ajustadas pelo "Texto longo" (5.11).
 *
 * Mapeamento das opções de rótulo (v2) mantido: "Tamanho do rótulo" no
 * nome e 2 px a menos nas outras linhas; conteúdo "nomeValor" põe o valor
 * junto do nome; "percentual"/"valorPercentual" mostram o % do total.
 */
function linhasDoCartao({ no, rot, tl, completo, valueFormat, totalGeral, cargo, config, temValor, larguraUtil }) {
  const semCorte = Object.assign({}, rot, { truncar: 0 });
  const tamanhoMenor = Math.max(6, rot.tamanho - 2);
  const mostrarValor = config.mostrarValorNoCartao !== false && temValor;
  const saida = [];
  const ajustar = (texto, tamanho, extra = {}) => {
    const aj = ajustarRotulo({ nome: texto, tamanho, largura: larguraUtil, tl: extra.semCorteDeModo ? { ...tl, modo: tl.modo === 'soNome' ? 'inteiro' : tl.modo } : tl, estilo: { negrito: !!extra.nome } });
    return aj.linhas.map((l) => ({ texto: l, tamanho: aj.tamanho, largura: larguraDoTexto(l, aj.tamanho, { negrito: !!extra.nome }), ...extra, completo: aj.completo, cortado: aj.cortado }));
  };

  let nome = String(no.data.rotulo || '');
  if (mostrarValor && rot.conteudo === 'nomeValor' && tl.modo !== 'soNome') {
    nome = textoDoRotulo(semCorte, { valor: completo.valor, nome, valueFormat });
  }
  if (config.mostrarNomeNoCartao !== false) saida.push(...ajustar(nome, rot.tamanho, { nome: true }));
  if (cargo) saida.push(...ajustar(cargo, tamanhoMenor, {}));

  if (tl.modo !== 'soNome') {
    const extras = [];
    const comPct = config.mostrarPercentualNoCartao === true || rot.conteudo === 'percentual' || rot.conteudo === 'valorPercentual';
    if (mostrarValor && rot.conteudo !== 'nome' && rot.conteudo !== 'nomeValor' && rot.conteudo !== 'percentual') {
      extras.push(textoDoRotulo(Object.assign({}, semCorte, { conteudo: 'valor' }), { valor: completo.valor, total: totalGeral, valueFormat }));
    }
    if (comPct && totalGeral) {
      extras.push(textoDoRotulo(Object.assign({}, semCorte, { conteudo: 'percentual' }), { valor: completo.valor, total: totalGeral, valueFormat }));
    }
    if (config.mostrarContagemDeEquipe !== false && completo.descendentes > 0) extras.push(`${completo.descendentes} abaixo`);
    if (extras.length) {
      const juntas = extras.join(' · ');
      const aj = ajustarRotulo({ nome: '', extras: [juntas], formatar: (_, e) => e.join(''), tamanho: tamanhoMenor, largura: larguraUtil, tl: tl.modo === 'abreviar' ? tl : { ...tl, modo: tl.modo === 'quebrar' ? 'quebrar' : tl.modo }, estilo: {} });
      for (const l of aj.linhas) saida.push({ texto: l, tamanho: aj.tamanho, largura: larguraDoTexto(l, aj.tamanho), suave: true });
    }
  }
  return saida;
}

/** Desenha as linhas do cartão (posição, alinhamento, cor com contraste). */
function desenharLinhasDoCartao({ grupo, linhas, x, y, rot, tema, cor, preenchido, larguraDoCartao, alturaDoCartao, config, fonte, margemInterna }) {
  const alinh = config.alinhamentoDoTextoDoCartao || 'auto';
  const ancora =
    alinh === 'esquerda' ? 'start'
      : alinh === 'direita' ? 'end'
        : alinh === 'centro' ? 'middle'
          : rot.posicao === 'dentro' ? 'start'
            : rot.posicao === 'fora' || rot.posicao === 'foraComLinha' ? 'end'
              : 'middle';
  const tx = ancora === 'start' ? x - larguraDoCartao / 2 + margemInterna : ancora === 'end' ? x + larguraDoCartao / 2 - margemInterna : x;
  const contraste = config.contrasteAutomatico !== false;
  const corDoTexto = preenchido && contraste ? textoLegivelSobre(cor, tema) : tema.texto;
  const alturaTotal = linhas.reduce((a, l) => a + l.tamanho * 1.25, 0);
  let yAtual = y - alturaTotal / 2;
  let ocupado = 0;
  linhas.forEach((linha, i) => {
    const ty = yAtual + (linha.tamanho * 1.25) / 2;
    yAtual += linha.tamanho * 1.25;
    const el = criarSvgEl('text', {
      pai: grupo,
      classe: linha.nome ? 'oc-texto oc-nome' : 'oc-texto',
      atributos: { x: tx, y: ty, 'text-anchor': ancora, 'dominant-baseline': 'central' },
    });
    definirTexto(el, linha.texto);
    estilizarRotulo(el, rot, { corAutomatica: linha.suave && !(preenchido && contraste) ? tema.textoSuave : corDoTexto, x: tx, y: ty });
    el.setAttribute('font-size', String(linha.tamanho));
    if (fonte) el.setAttribute('font-family', fonte);
    if (linha.nome && !rot.negrito) el.setAttribute('font-weight', '600');
    if (linha.cortado && linha.completo) el.setAttribute('data-completo', linha.completo);
    ocupado += linha.tamanho * 1.25;
    if (rot.evitarColisao && ocupado > alturaDoCartao - 4 && i > 0) el.setAttribute('display', 'none');
  });
}

/** Contador / botão de recolher, com o texto SEMPRE contido na forma. */
function desenharContador({ grupo, bx, by, cor, tema, texto, estilo }) {
  const botao = criarSvgEl('g', { pai: grupo, classe: 'oc-botao' });
  const tamanho = texto.length > 2 ? 9 : 11;
  const largura = larguraDoTexto(texto, tamanho, { negrito: true });
  if (estilo === 'pilula') {
    const w = Math.max(16, largura + 10);
    criarSvgEl('rect', {
      pai: botao,
      atributos: { x: bx - w / 2, y: by - 8, width: w, height: 16, rx: 8, fill: tema.fundoElevado, stroke: cor, 'stroke-width': 1.5 },
    });
  } else {
    const r = Math.max(8, largura / 2 + 3.5);
    criarSvgEl('circle', { pai: botao, atributos: { cx: bx, cy: by, r, fill: tema.fundoElevado, stroke: cor, 'stroke-width': 1.5 } });
  }
  const sinal = criarSvgEl('text', {
    pai: botao,
    classe: 'oc-texto',
    atributos: {
      x: bx,
      y: by,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': tamanho,
      'font-weight': '700',
      fill: cor,
    },
  });
  definirTexto(sinal, texto);
  return botao;
}

/**
 * Identidade estável de um nó entre renderizações: o caminho de chaves da
 * raiz até o nó (os objetos do d3 mudam a cada desenho).
 */
function caminhoDoNo(no) {
  return no
    .ancestors()
    .reverse()
    .map((n) => n.data.chave)
    .join(' ');
}

/** Ligação entre dois cartões: cotovelo (padrão), reta ou curva. */
function ligacao(pai, filho, deCimaParaBaixo, alturaDoCartao, larguraDoCartao, forma = 'cotovelo') {
  if (deCimaParaBaixo) {
    const y1 = pai.y + alturaDoCartao / 2;
    const y2 = filho.y - alturaDoCartao / 2;
    const meio = (y1 + y2) / 2;
    if (forma === 'reta') return `M${pai.x},${y1}L${filho.x},${y2}`;
    if (forma === 'curva') return `M${pai.x},${y1}C${pai.x},${meio.toFixed(2)} ${filho.x},${meio.toFixed(2)} ${filho.x},${y2}`;
    return `M${pai.x},${y1}V${meio.toFixed(2)}H${filho.x}V${y2}`;
  }
  const x1 = pai.x + larguraDoCartao / 2;
  const x2 = filho.x - larguraDoCartao / 2;
  const meio = (x1 + x2) / 2;
  if (forma === 'reta') return `M${x1},${pai.y}L${x2},${filho.y}`;
  if (forma === 'curva') return `M${x1},${pai.y}C${meio.toFixed(2)},${pai.y} ${meio.toFixed(2)},${filho.y} ${x2},${filho.y}`;
  return `M${x1},${pai.y}H${meio.toFixed(2)}V${filho.y}H${x2}`;
}
