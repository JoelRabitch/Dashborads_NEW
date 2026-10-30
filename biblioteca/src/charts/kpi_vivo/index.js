/**
 * kpi_vivo — "KPI Vivo".
 *
 * O número grande: valor atual, comparação e uma sparkline de contexto.
 *
 * É o gráfico mais usado de qualquer painel e o mais fácil de errar,
 * porque **um número sozinho não significa nada**. "+12%" sobre o quê? Mês
 * anterior, mesmo mês do ano passado, meta? Sem a base declarada, a
 * variação é retórica — então aqui ela vai escrita na tela, sempre.
 *
 * Duas armadilhas tratadas de frente:
 *
 * 1. **Queda nem sempre é ruim.** Custo, churn, tempo de resposta,
 *    devoluções: para metade dos indicadores de um painel, cair é bom. A
 *    cor por direção só pode existir com a opção "menor é melhor" — e ela
 *    inverte a COR, nunca o sinal do número.
 * 2. **Comparar com período incompleto.** O mês corrente contra o mês
 *    passado inteiro sempre "cai", e é o erro mais comum do gênero. Quando
 *    dá para detectar (o último período tem muito menos linhas que os
 *    outros), o gráfico avisa; quando não dá, ele diz que a comparação
 *    supõe períodos completos.
 *
 * E a sparkline existe porque o contexto muda a leitura: "+12%" depois de
 * três quedas é uma coisa, "+12%" no quarto mês de alta é outra.
 *
 * Campos: uma medida (o indicador) e, opcional, uma dimensão de tempo.
 *
 * Recursos da Fase C (correções v2): minigráfico em linha/área/barras;
 * variação absoluta e % com seta e cores de positivo/negativo
 * configuráveis; meta com barra de progresso; vários KPIs em grade (um
 * cartão por medida, linhas e colunas configuráveis); formato do número
 * (moeda, %, compacto K/M/B, casas, símbolo); ícone embutido em SVG (seta,
 * estrela, carrinho, pessoa, moeda, gráfico, relógio, alerta, alvo);
 * limites verde/amarelo/vermelho; layouts grande/compacto/horizontal;
 * título e subtítulo no cartão; clique abre o drill (ou fixa o tooltip);
 * animação de contagem do número.
 *
 * Bloco "Rótulos" (correções v2 — antes nenhuma dessas opções era lida):
 *   - o NÚMERO principal é o "rótulo de dado": "Formato do número no
 *     rótulo" e "Casas decimais" o formatam quando o formato não é
 *     "Automático" (em "Automático" vale o value_format do campo); "O que
 *     mostrar" = valor (padrão) | nome | "nome: valor" | percentual (o
 *     atual como % da base de comparação, ex.: % da meta) | "valor (%)".
 *     O tamanho dele continua automático;
 *   - título, variação e base são os rótulos secundários: "Mostrar
 *     rótulos" (desligado = só o número e a sparkline), tamanho, cor,
 *     negrito, rotação, truncar, posição (auto/fora = título acima;
 *     dentro/centro = título abaixo do número; fora com linha-guia = acima
 *     com linha separadora) e "Esconder rótulos que se sobrepõem" (corta o
 *     texto que não cabe na largura e esconde base/variação/título, nessa
 *     ordem, se não couberem na altura).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { escalaNumerica, escalaDePonto } from '../../core/scales.js';
import { geradorDeLinha, geradorDeArea } from '../../core/shapes.js';
import { comOpacidade } from '../../core/theme.js';
import { formatarPercentual, formatarData, truncar, criarFormatadorNumerico } from '../../core/format.js';
import { opcoesDeAnimacao, animarContador } from '../../core/animate.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo, formatadorDoRotulo } from '../../core/rotulos.js';
import { larguraAproximada } from '../../core/eixos.js';
import { listarIcones, existeIcone, desenharIcone as desenharIconeDoRegistro } from '../../core/icones.js';
import { existeProgresso, desenharProgresso } from '../../core/pacotes.js';

/** Contexto do desenho atual (para agendar quadros da animação da xícara). */
let ctxDoKpi = null;
import { estiloDoTexto } from '../../core/cabecalho.js';
import {
  montarOpcoes,
  comDefaults,
  listaDeValores,
  opcaoDeEscolhaDeCampo,
  blocoDeRotulos,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';

const CSS = `
.kv-grade{position:relative;width:100%;height:100%;display:grid;gap:8px;padding:4px 4px 16px;box-sizing:border-box;}
.kv-cartao{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:4px;padding:8px;box-sizing:border-box;overflow:hidden;}
.kv-cartao.kv-horizontal{flex-direction:row;justify-content:space-between;gap:12px;}
.kv-horizontal .kv-texto{align-items:flex-start;text-align:left;}
.kv-horizontal .kv-titulo,.kv-horizontal .kv-base{text-align:left;}
.kv-cartao.kv-compacto{gap:1px;padding:4px;}
.kv-texto{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;max-width:100%;}
.kv-subtitulo{opacity:.7;text-align:center;}
.kv-icone{flex:0 0 auto;}
.kv-progresso{width:100%;min-width:80px;max-width:320px;height:6px;border-radius:3px;overflow:hidden;margin-top:4px;}
.kv-progresso-barra{height:100%;border-radius:3px;}
.kv-progresso-texto{font-size:11px;}
.kv-titulo{font-weight:600;opacity:.8;text-align:center;}
.kv-numero{font-weight:700;line-height:1.05;white-space:nowrap;}
.kv-variacao{display:flex;align-items:baseline;gap:6px;white-space:nowrap;}
.kv-seta{font-weight:700;}
.kv-base{opacity:.7;text-align:center;}
.kv-spark{width:100%;max-width:420px;}
.kv-nota{position:absolute;left:8px;bottom:4px;font-size:10px;opacity:.75;}
`;

/**
 * Abaixo desta fração da mediana, o último período parece incompleto.
 * 60% é folgado de propósito: meses têm 28 a 31 dias e semanas variam —
 * acusar a cada oscilação faria o aviso virar ruído.
 */
const FRACAO_DE_PERIODO_INCOMPLETO = 0.6;

export default defineViz({
  id: 'kpi_vivo',
  label: 'KPI Vivo',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeRotulos(),
      blocoDeTema(),
      blocoAvancado(),
      {
        baseDaComparacao: {
          type: 'string',
          label: 'Comparar com',
          section: 'KPI',
          display: 'select',
          default: 'anterior',
          values: listaDeValores([
            { rotulo: 'Período anterior', valor: 'anterior' },
            { rotulo: 'N períodos atrás', valor: 'nAtras' },
            { rotulo: 'Primeiro período da série', valor: 'primeiro' },
            { rotulo: 'Média dos períodos anteriores', valor: 'media' },
            { rotulo: 'Meta (valor fixo)', valor: 'meta' },
            { rotulo: 'Não comparar', valor: 'nenhuma' },
          ]),
        },
        periodosAtras: {
          type: 'number',
          label: 'Quantos períodos atrás',
          section: 'KPI',
          display: 'number',
          default: 12,
        },
        meta: {
          type: 'number',
          label: 'Valor da meta',
          section: 'KPI',
          display: 'number',
          default: 0,
        },
        menorEhMelhor: {
          type: 'boolean',
          label: 'Menor é melhor (custo, churn, tempo de resposta…)',
          section: 'KPI',
          default: false,
        },
        colorirVariacao: {
          type: 'boolean',
          label: 'Colorir a variação por direção',
          section: 'KPI',
          default: true,
        },
        mostrarSparkline: {
          type: 'boolean',
          label: 'Sparkline de contexto',
          section: 'KPI',
          default: true,
        },
        mostrarVariacaoAbsoluta: {
          type: 'boolean',
          label: 'Mostrar também a diferença absoluta',
          section: 'KPI',
          default: true,
        },
        titulo: {
          type: 'string',
          label: 'Título (vazio = nome da medida)',
          section: 'Rótulos',
          default: '',
        },
        // ---- Novas na Fase C (correções v2) ----
        subtitulo: {
          type: 'string',
          label: 'Subtítulo do cartão',
          section: 'Rótulos',
          default: '',
        },
        layoutDoCartao: {
          type: 'string',
          label: 'Layout do cartão',
          section: 'KPI',
          display: 'select',
          default: 'grande',
          values: listaDeValores([
            { rotulo: 'Grande (número no centro)', valor: 'grande' },
            { rotulo: 'Compacto', valor: 'compacto' },
            { rotulo: 'Horizontal (número à esquerda, gráfico à direita)', valor: 'horizontal' },
          ]),
        },
        tipoDeSparkline: {
          type: 'string',
          label: 'Minigráfico',
          section: 'KPI',
          display: 'select',
          default: 'area',
          values: listaDeValores([
            { rotulo: 'Área', valor: 'area' },
            { rotulo: 'Linha', valor: 'linha' },
            { rotulo: 'Barras', valor: 'barras' },
          ]),
        },
        formatoDoNumero: {
          type: 'string',
          label: 'Formato do número (Automático = o do rótulo / do campo)',
          section: 'Dados',
          display: 'select',
          default: 'auto',
          values: listaDeValores([
            { rotulo: 'Automático', valor: 'auto' },
            { rotulo: 'Número', valor: 'numero' },
            { rotulo: 'Moeda', valor: 'moeda' },
            { rotulo: 'Percentual', valor: 'percentual' },
            { rotulo: 'Compacto (K, M, B)', valor: 'compacto' },
          ]),
        },
        casasDoNumero: {
          type: 'number',
          label: 'Casas decimais do número',
          section: 'Dados',
          display: 'range',
          min: 0,
          max: 6,
          step: 1,
          default: 1,
        },
        simboloDaMoeda: {
          type: 'string',
          label: 'Símbolo da moeda',
          section: 'Dados',
          default: 'R$ ',
        },
        corPositiva: {
          type: 'string',
          label: 'Cor do positivo (vazio = do tema)',
          section: 'KPI',
          display: 'color',
          default: '',
        },
        corNegativa: {
          type: 'string',
          label: 'Cor do negativo (vazio = do tema)',
          section: 'KPI',
          display: 'color',
          default: '',
        },
        mostrarProgressoDaMeta: {
          type: 'boolean',
          label: 'Barra de progresso até a meta (usa "Valor da meta")',
          section: 'KPI',
          default: false,
        },
        usarLimites: {
          type: 'boolean',
          label: 'Colorir o número por limites (verde / amarelo / vermelho)',
          section: 'KPI',
          default: false,
        },
        limiteVerde: {
          type: 'number',
          label: 'Limite do verde (a partir de; com "menor é melhor": até)',
          section: 'KPI',
          display: 'number',
        },
        limiteAmarelo: {
          type: 'number',
          label: 'Limite do amarelo (a partir de; com "menor é melhor": até)',
          section: 'KPI',
          display: 'number',
        },
        iconeDoKpi: {
          type: 'string',
          label: 'Ícone',
          section: 'KPI',
          display: 'select',
          default: 'nenhum',
          values: listaDeValores([
            { rotulo: 'Nenhum', valor: 'nenhum' },
            { rotulo: 'Seta', valor: 'seta' },
            { rotulo: 'Estrela', valor: 'estrela' },
            { rotulo: 'Carrinho', valor: 'carrinho' },
            { rotulo: 'Pessoa', valor: 'pessoa' },
            { rotulo: 'Moeda', valor: 'moeda' },
            { rotulo: 'Gráfico', valor: 'grafico' },
            { rotulo: 'Relógio', valor: 'relogio' },
            { rotulo: 'Alerta', valor: 'alerta' },
            { rotulo: 'Alvo', valor: 'alvo' },
            // 5.14d (v3): ícones de pacotes temáticos (somem da lista com
            // "Pacote temático" = Nenhum; um valor salvo continua valendo).
            ...listarIcones()
              .filter((i) => i.pacote)
              .map((i) => ({ rotulo: i.rotulo, valor: i.id })),
          ]),
        },
        progressoEmXicara: {
          type: 'boolean',
          label: 'Meta em xícara (pacote Café)',
          section: 'KPI',
          default: false,
        },
        corDoIcone: {
          type: 'string',
          label: 'Cor do ícone (vazio = destaque do tema)',
          section: 'KPI',
          display: 'color',
          default: '',
        },
        kpisEmGrade: {
          type: 'boolean',
          label: 'Vários KPIs em grade (um cartão por medida)',
          section: 'KPI',
          default: false,
        },
        colunasDoKpi: {
          type: 'number',
          label: 'Colunas da grade (0 = automático)',
          section: 'KPI',
          display: 'range',
          min: 0,
          max: 8,
          step: 1,
          default: 0,
        },
        linhasDoKpi: {
          type: 'number',
          label: 'Linhas da grade (0 = automático)',
          section: 'KPI',
          display: 'range',
          min: 0,
          max: 8,
          step: 1,
          default: 0,
        },
        contadorAnimado: {
          type: 'boolean',
          label: 'Animação de contagem do número',
          section: 'Animação',
          default: true,
        },
      }
    ),
    {}
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },
  // Título e subtítulo vão DENTRO do cartão (não no cabeçalho padrão).
  cabecalhoProprio: true,

  opcoesDinamicas({ modelo }) {
    const saida = {};
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));

    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoValor', 'Medida do indicador', medidas, {
          secao: 'Dados',
          padrao: medidas[0].nome,
        })
      );
    }
    if (dimensoes.length) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoPeriodo', 'Dimensão do tempo', dimensoes, {
          secao: 'Dados',
          incluirNenhum: true,
          padrao: dimensoes[0].nome,
        })
      );
    }
    return saida;
  },

  render(ctx) {
    ctxDoKpi = ctx;
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const medidaEscolhida =
      modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    if (!medidaEscolhida) {
      ctx.mostrarVazio('Este indicador precisa de uma medida.');
      return;
    }

    const campoDoPeriodo =
      config.campoDoPeriodo === ''
        ? null
        : modelo.dimensoes.find((d) => d.nome === config.campoDoPeriodo) || modelo.dimensoes[0] || null;

    // ---------- Grade: um cartão por medida ----------
    let medidas = [medidaEscolhida];
    let colunas = 1;
    let linhas = 1;
    if (config.kpisEmGrade === true && modelo.medidas.length > 1) {
      medidas = modelo.medidas.slice();
      const pedidasColunas = Math.max(0, Math.floor(Number(config.colunasDoKpi) || 0));
      const pedidasLinhas = Math.max(0, Math.floor(Number(config.linhasDoKpi) || 0));
      colunas = pedidasColunas || (pedidasLinhas ? Math.ceil(medidas.length / pedidasLinhas) : Math.ceil(Math.sqrt(medidas.length)));
      linhas = pedidasLinhas || Math.ceil(medidas.length / colunas);
      if (colunas * linhas < medidas.length) {
        ctx.avisar(
          `A grade ${linhas}×${colunas} mostra ${colunas * linhas} de ${medidas.length} medidas; aumente linhas ou colunas para ver todas.`
        );
        medidas = medidas.slice(0, colunas * linhas);
      }
    }

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'kv');
    const grade = criarEl('div', { classe: 'kv-grade', pai: raiz });
    grade.style.gridTemplateColumns = `repeat(${colunas}, minmax(0, 1fr))`;
    grade.style.gridTemplateRows = `repeat(${linhas}, minmax(0, 1fr))`;

    const larguraDoCartao = Math.max(80, Math.floor(largura / colunas) - (colunas > 1 ? 8 : 0));
    const alturaDoCartao = Math.max(60, Math.floor(altura / linhas) - (linhas > 1 ? 8 : 0));

    medidas.forEach((medida, indice) => {
      desenharCartao({
        ctx,
        pai: grade,
        medida,
        campoDoPeriodo,
        largura: larguraDoCartao,
        altura: alturaDoCartao,
        emGrade: medidas.length > 1,
        indice,
      });
    });

    // ---------- Nota (uma só, embaixo) ----------
    const serie = lerSerie({ modelo, medida: medidaEscolhida, campoDoPeriodo, config });
    const nota = ctx.nota; // 5.1c: texto automático da nota
    nota.style.color = tema.textoSuave;
    const incompleto = detectarPeriodoIncompleto(serie.contagens);
    definirTexto(
      nota,
      [
        serie.rotuloDoAtual ? `período: ${serie.rotuloDoAtual}` : null,
        `${serie.valores.length} período(s) na série`,
        config.menorEhMelhor === true ? 'menor é melhor: a cor está invertida, o sinal não' : null,
        config.baseDaComparacao !== 'nenhuma' && !incompleto.suspeito ? 'a comparação supõe períodos completos' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    );
  },
});

/* ------------------------------------------------------------------ */
/* Cartão                                                              */
/* ------------------------------------------------------------------ */

/**
 * Desenha UM cartão de KPI (uma medida). Com "Vários KPIs em grade", o
 * render chama uma vez por medida; sem grade, uma vez só.
 */
function desenharCartao({ ctx, pai, medida, campoDoPeriodo, largura, altura, emGrade, indice }) {
  const { modelo, config, tema } = ctx;
  const serie = lerSerie({ modelo, medida, campoDoPeriodo, config });
  const layout = ['compacto', 'horizontal'].includes(config.layoutDoCartao) ? config.layoutDoCartao : 'grande';

  const cartao = criarEl('div', { classe: `kv-cartao kv-raiz kv-${layout}`, pai });
  cartao.setAttribute('data-item', `kpi-${indice}`);
  if (emGrade) {
    cartao.style.border = `1px solid ${tema.borda}`;
    cartao.style.borderRadius = '6px';
  }

  if (!serie.valores.length) {
    criarEl('div', { classe: 'kv-base', pai: cartao, texto: `${medida.rotuloCurto}: sem valor numérico` });
    return;
  }

  const atual = serie.valores[serie.valores.length - 1];
  const comparacao = escolherBase({ serie, config });

  const incompleto = detectarPeriodoIncompleto(serie.contagens);
  if (incompleto.suspeito && comparacao.base !== null) {
    ctx.avisar(
      `${emGrade ? `${medida.rotuloCurto}: ` : ''}o último período tem ${incompleto.ultimo} linha(s) contra ` +
        `${incompleto.mediana} nos anteriores: ele parece INCOMPLETO. Comparar um período em andamento com um ` +
        'período inteiro faz o indicador "cair" sempre — confira o filtro de data no Explore.'
    );
  }

  // Rótulos (6.1), relidos a cada desenho: o NÚMERO é o rótulo de dado;
  // título, subtítulo, variação e base são os rótulos secundários.
  const rot = lerRotulos(config, tema);
  const formatar = formatadorDoNumero(config, rot, medida.valueFormat);
  const textoDoTitulo = emGrade
    ? medida.rotuloCurto || medida.rotulo
    : config.titulo || medida.rotulo || medida.rotuloCurto;
  const textoDoSubtitulo = emGrade ? '' : String(config.subtitulo || '').trim();
  const nomeNoNumero = rot.conteudo === 'nome' || rot.conteudo === 'nomeValor';

  const larguraDoTexto = layout === 'horizontal' ? largura * 0.55 : largura;
  const larguraUtil = Math.max(40, larguraDoTexto - 24);

  const ajustarTexto = (texto, tamanho) => {
    let t = rot.truncar > 0 ? truncar(texto, rot.truncar) : String(texto);
    if (rot.evitarColisao) t = truncar(t, Math.max(4, Math.floor(larguraUtil / (tamanho * 0.58))));
    return t;
  };

  // ---------- Ícone ----------
  if (config.iconeDoKpi && config.iconeDoKpi !== 'nenhum' && ICONES[config.iconeDoKpi]) {
    const lado = layout === 'compacto' ? 20 : Math.max(20, Math.min(40, altura * 0.14));
    desenharIcone({ pai: cartao, nome: config.iconeDoKpi, lado, cor: config.corDoIcone || tema.destaque });
  } else if (config.iconeDoKpi && config.iconeDoKpi !== 'nenhum' && existeIcone(config.iconeDoKpi)) {
    // Ícone do registro (pacotes temáticos, 5.14d).
    const lado = layout === 'compacto' ? 20 : Math.max(20, Math.min(40, altura * 0.14));
    desenharIconeDoRegistro({ pai: cartao, id: config.iconeDoKpi, lado, cor: config.corDoIcone || tema.destaque, estilo: config.estiloDoIcone, classe: 'kv-icone' });
  }

  const texto = criarEl('div', { classe: 'kv-texto', pai: cartao });

  const secundarios = [];
  /**
   * 5.1c: o KPI desenha título e subtítulo DENTRO do cartão (cabeçalho
   * próprio), mas segue as opções do componente único: mostrar, cor,
   * tamanho, fonte, peso e alinhamento. "Esquerda" (o padrão do
   * componente) mantém o alinhamento do próprio cartão, para nada mudar
   * até o usuário mexer. Posição acima/abaixo do gráfico não se aplica.
   */
  const aplicarOpcoesDoComponente = (el, tipo) => {
    const e = estiloDoTexto(tipo, config, tema);
    const S = tipo === 'titulo' ? 'Titulo' : 'Subtitulo';
    if (e.alinhamento === 'centro') el.style.textAlign = 'center';
    else if (e.alinhamento === 'direita') el.style.textAlign = 'right';
    if (e.cor) el.style.color = e.cor;
    if (Number(config[`tamanhoDo${S}`]) > 0) el.style.fontSize = `${e.tamanho}px`;
    if (config[`fonteDo${S}`] && config[`fonteDo${S}`] !== 'tema') el.style.fontFamily = e.fonte;
    const pesoPadrao = tipo === 'titulo' ? 'negrito' : 'normal';
    if (config[`pesoDo${S}`] && config[`pesoDo${S}`] !== pesoPadrao) el.style.fontWeight = e.negrito ? '600' : '400';
    return e.mostrar;
  };
  const criarTitulo = () => {
    if (!rot.mostrar || nomeNoNumero) return;
    const el = criarEl('div', { classe: 'kv-titulo', pai: texto });
    definirTexto(el, ajustarTexto(textoDoTitulo, rot.tamanho));
    estilizarRotulo(el, rot, { corAutomatica: tema.textoSuave });
    if (!aplicarOpcoesDoComponente(el, 'titulo')) el.style.display = 'none';
    if (rot.posicao === 'foraComLinha') {
      el.style.borderBottom = `1px solid ${tema.borda}`;
      el.style.paddingBottom = '2px';
    }
    secundarios.push({ el, altura: rot.tamanho * 1.4, prioridade: 3 });
    if (textoDoSubtitulo) {
      const sub = criarEl('div', { classe: 'kv-subtitulo', pai: texto });
      definirTexto(sub, ajustarTexto(textoDoSubtitulo, rot.tamanho - 1));
      estilizarRotulo(sub, Object.assign({}, rot, { tamanho: Math.max(7, rot.tamanho - 1) }), { corAutomatica: tema.textoSuave });
      if (!aplicarOpcoesDoComponente(sub, 'subtitulo')) sub.style.display = 'none';
      secundarios.push({ el: sub, altura: rot.tamanho * 1.3, prioridade: 2.5 });
    }
  };

  const tituloAbaixo = rot.posicao === 'dentro' || rot.posicao === 'centro';
  if (!tituloAbaixo) criarTitulo();

  // ---------- Número ----------
  const rotDoNumero = Object.assign({}, rot, { truncar: 0 });
  const textoDoNumero = (v) =>
    rot.conteudo === 'valor' || rot.conteudo === undefined
      ? formatar(v)
      : textoDoRotulo(rotDoNumero, { valor: v, nome: textoDoTitulo, total: comparacao.base, valueFormat: medida.valueFormat, textoDoValor: formatar(v) });
  const textoFinal = textoDoNumero(atual);
  const numero = criarEl('div', { classe: 'kv-numero', pai: texto });
  numero.style.color = corPorLimite(atual, config, tema) || tema.texto;
  const maximo = layout === 'compacto' ? 40 : 96;
  const tamanhoDoNumero = tamanhoQueCabe(textoFinal, larguraDoTexto - 24, altura * (layout === 'compacto' ? 0.7 : 1), { maximo });
  numero.style.fontSize = `${tamanhoDoNumero}px`;
  // Animação de contagem (opção "Números sobem/descem até o valor"): só
  // quando o número é só o valor (não "nome: valor" etc.).
  const animacao = opcoesDeAnimacao(config, { primeiraRenderizacao: ctx.primeiraRenderizacao });
  // O texto final entra JÁ: a contagem é assíncrona e o número nunca pode
  // ficar vazio (nem para quem lê o DOM antes do primeiro quadro).
  definirTexto(numero, textoFinal);
  if (textoFinal === formatar(atual) && Number.isFinite(atual)) {
    const anterior = ctx.estado.ultimosValores && ctx.estado.ultimosValores[medida.nome];
    animarContador({ elemento: numero, de: Number.isFinite(anterior) ? anterior : 0, para: atual, formatar, animacao });
  }
  ctx.estado.ultimosValores = Object.assign({}, ctx.estado.ultimosValores, { [medida.nome]: atual });

  if (tituloAbaixo) criarTitulo();

  // ---------- Variação (absoluta e %) com seta e cor ----------
  const resultado = calcularVariacao({ atual, base: comparacao.base });
  const menorEhMelhor = config.menorEhMelhor === true;
  const bom = resultado.diferenca === null ? null : ehBoaNoticia(resultado.diferenca, menorEhMelhor);
  const corBoa = config.corPositiva || tema.positivo;
  const corRuim = config.corNegativa || tema.negativo;

  if (comparacao.base !== null && rot.mostrar) {
    const linha = criarEl('div', { classe: 'kv-variacao', pai: texto });
    estilizarRotulo(linha, rot, { corAutomatica: tema.texto });
    const cor = config.colorirVariacao === false || bom === null ? rot.cor || tema.texto : bom ? corBoa : corRuim;
    const seta = criarEl('span', { classe: 'kv-seta', pai: linha });
    seta.style.color = cor;
    seta.style.fontSize = '1.4em';
    // A SETA segue o sinal do número, nunca a opinião sobre ele.
    definirTexto(seta, resultado.diferenca > 0 ? '▲' : resultado.diferenca < 0 ? '▼' : '■');
    const percentual = criarEl('span', { classe: 'kv-percentual', pai: linha });
    percentual.style.color = cor;
    percentual.style.fontWeight = '600';
    percentual.style.fontSize = '1.4em';
    definirTexto(
      percentual,
      resultado.relativa === null ? '—' : `${resultado.relativa >= 0 ? '+' : ''}${formatarPercentual(resultado.relativa, 1)}`
    );
    if (config.mostrarVariacaoAbsoluta !== false) {
      const absoluta = criarEl('span', { classe: 'kv-absoluta', pai: linha });
      absoluta.style.color = rot.cor || tema.textoSuave;
      definirTexto(absoluta, `(${resultado.diferenca >= 0 ? '+' : ''}${formatar(resultado.diferenca)})`);
    }
    secundarios.push({ el: linha, altura: rot.tamanho * 1.4 * 1.4, prioridade: 2 });

    if (layout !== 'compacto') {
      const base = criarEl('div', { classe: 'kv-base', pai: texto });
      definirTexto(base, ajustarTexto(`contra ${comparacao.rotulo}: ${formatar(comparacao.base)}`, rot.tamanho));
      estilizarRotulo(base, rot, { corAutomatica: tema.textoSuave });
      secundarios.push({ el: base, altura: rot.tamanho * 1.4, prioridade: 1 });
    }
  }

  // ---------- Meta com barra de progresso ----------
  const meta = Number(config.meta);
  if (config.mostrarProgressoDaMeta === true && Number.isFinite(meta) && meta !== 0) {
    const fracao = atual / meta;
    const barra = criarEl('div', { classe: 'kv-progresso', pai: texto });
    barra.style.background = comOpacidade(tema.texto, 0.12);
    const preenchido = criarEl('div', { classe: 'kv-progresso-barra', pai: barra });
    preenchido.style.width = `${Math.max(0, Math.min(1, fracao)) * 100}%`;
    const atingiu = menorEhMelhor ? atual <= meta : atual >= meta;
    preenchido.style.background = corPorLimite(atual, config, tema) || (atingiu ? corBoa : tema.destaque);
    const legenda = criarEl('div', { classe: 'kv-progresso-texto', pai: texto });
    legenda.style.color = tema.textoSuave;
    definirTexto(legenda, `${formatarPercentual(fracao, 0)} da meta (${formatar(meta)})`);
    // 5.14g (v3): "Progresso em xícara", ao lado da barra de meta.
    if (config.progressoEmXicara === true && existeProgresso('cafe_xicara')) {
      const anim = opcoesDeAnimacao(config);
      desenharProgresso('cafe_xicara', legenda, fracao, {
        lado: 28,
        cor: preenchido.style.background || tema.destaque,
        contornoCor: tema.texto,
        animar: anim.ligada,
        duracao: anim.duracao,
        agendarQuadro: (fn) => ctxDoKpi && ctxDoKpi.agendarQuadro(fn),
      });
    }
  }

  // "Esconder rótulos que se sobrepõem" (mantido): somem base, variação e
  // título, nessa ordem, se não couberem na altura do cartão.
  const mostrarSpark = config.mostrarSparkline !== false && serie.valores.length > 1;
  const alturaDaSpark = mostrarSpark ? Math.max(18, Math.min(60, altura * 0.18)) : 0;
  if (rot.evitarColisao && secundarios.length) {
    let ocupado = tamanhoDoNumero * 1.05 + (layout === 'horizontal' ? 0 : alturaDaSpark) + secundarios.reduce((s, r) => s + r.altura, 0);
    for (const r of secundarios.slice().sort((a, b) => a.prioridade - b.prioridade)) {
      if (ocupado <= altura - 16) break;
      r.el.style.display = 'none';
      ocupado -= r.altura;
    }
  }

  // ---------- Sparkline (linha, área ou barras) ----------
  if (mostrarSpark) {
    const larguraDaSpark = layout === 'horizontal' ? Math.max(40, largura * 0.4 - 16) : Math.min(420, largura - 24);
    desenharSparkline({
      pai: cartao,
      valores: serie.valores,
      largura: larguraDaSpark,
      altura: layout === 'horizontal' ? Math.max(24, Math.min(80, altura * 0.5)) : alturaDaSpark,
      cor: bom === null ? tema.destaque : bom ? corBoa : corRuim,
      tema,
      tipo: config.tipoDeSparkline || 'area',
    });
  }

  // ---------- Clique: drill da medida na última linha ----------
  const ultimaLinha = modelo.linhas[modelo.linhas.length - 1];
  const celula = ultimaLinha ? modelo.celula(ultimaLinha, medida.nome) : null;
  cartao.style.cursor = celula && ctx.ponte.temDrill(celula) ? 'pointer' : '';
  ctx.eventos.on(cartao, 'click', (ev) =>
    ctx.cliqueNoItem(ev, celula, {
      titulo: textoDoTitulo,
      linhas: [
        { rotulo: medida.rotuloCurto, valor: formatar(atual) },
        ...(comparacao.base !== null ? [{ rotulo: `contra ${comparacao.rotulo}`, valor: formatar(comparacao.base) }] : []),
      ],
      variaveis: { categoria: textoDoTitulo, valor: formatar(atual) },
    })
  );
}

/**
 * Formato do número principal. "Formato do número" (opção do KPI) manda
 * quando não é "Automático"; em "Automático" vale o bloco de rótulos (que,
 * por sua vez, em "Automático" usa o value_format do campo).
 */
export function formatadorDoNumero(config, rot, valueFormat) {
  const estilo = config.formatoDoNumero || 'auto';
  if (estilo === 'auto') return formatadorDoRotulo(rot, valueFormat);
  const casas = Number(config.casasDoNumero);
  return criarFormatadorNumerico({
    estilo,
    casas: Number.isFinite(casas) ? casas : 1,
    simboloDaMoeda: config.simboloDaMoeda !== undefined && config.simboloDaMoeda !== null ? String(config.simboloDaMoeda) : 'R$ ',
  });
}

/**
 * Cor por limites (verde / amarelo / vermelho). Com "menor é melhor", os
 * limites são tetos em vez de pisos. null = limites desligados.
 */
export function corPorLimite(valor, config, tema) {
  if (config.usarLimites !== true || !Number.isFinite(valor)) return null;
  const verde = Number(config.limiteVerde);
  const amarelo = Number(config.limiteAmarelo);
  if (!Number.isFinite(verde) || !Number.isFinite(amarelo)) return null;
  const menor = config.menorEhMelhor === true;
  if (menor ? valor <= verde : valor >= verde) return config.corPositiva || tema.positivo;
  if (menor ? valor <= amarelo : valor >= amarelo) return tema.atencao || '#D97706';
  return config.corNegativa || tema.negativo;
}

/** Ícones embutidos (SVG 24×24, traço). Nada é carregado de fora. */
export const ICONES = {
  seta: 'M5 12h14M13 6l6 6-6 6',
  estrela: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z',
  carrinho: 'M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01',
  pessoa: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7',
  moeda: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11',
  grafico: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  relogio: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  alerta: 'M12 3l10 18H2zM12 10v5M12 18v.01',
  alvo: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
};

function desenharIcone({ pai, nome, lado, cor }) {
  const svg = criarSvgEl('svg', {
    pai,
    classe: 'kv-icone',
    atributos: { width: lado, height: lado, viewBox: '0 0 24 24', 'aria-hidden': 'true', 'data-icone': nome },
  });
  criarSvgEl('path', {
    pai: svg,
    atributos: { d: ICONES[nome], fill: 'none', stroke: cor, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
  });
  return svg;
}

/* ------------------------------------------------------------------ */

/**
 * Série do indicador: um valor por período, na ordem da consulta, mais a
 * contagem de linhas de cada período.
 *
 * A contagem existe só para detectar período incompleto — e é por isso
 * que ela conta LINHAS, não valores: é o número de linhas que cai quando
 * o mês ainda não acabou.
 */
export function lerSerie({ modelo, medida, campoDoPeriodo, config = {} }) {
  if (!campoDoPeriodo) {
    const valores = [];
    for (const linha of modelo.linhas) {
      const v = modelo.valorNumerico(linha, medida.nome);
      if (v !== null) valores.push(v);
    }
    // Sem dimensão de tempo, o indicador é o total da consulta.
    const total = valores.reduce((a, b) => a + b, 0);
    return { valores: valores.length ? [total] : [], rotulos: [''], contagens: [valores.length], rotuloDoAtual: '' };
  }

  const porPeriodo = new Map();
  for (const linha of modelo.linhas) {
    const chave = String(modelo.valorBruto(linha, campoDoPeriodo.nome));
    if (!porPeriodo.has(chave)) {
      porPeriodo.set(chave, {
        chave,
        rotulo: campoDoPeriodo.ehData
          ? formatarData(modelo.valorBruto(linha, campoDoPeriodo.nome), config.formatoDeData || 'auto')
          : modelo.texto(linha, campoDoPeriodo.nome, undefined, '∅'),
        soma: 0,
        linhas: 0,
      });
    }
    const periodo = porPeriodo.get(chave);
    periodo.linhas += 1;
    const v = modelo.valorNumerico(linha, medida.nome);
    if (v !== null) periodo.soma += v;
  }

  const lista = Array.from(porPeriodo.values());
  return {
    valores: lista.map((p) => p.soma),
    rotulos: lista.map((p) => p.rotulo),
    contagens: lista.map((p) => p.linhas),
    rotuloDoAtual: lista.length ? lista[lista.length - 1].rotulo : '',
  };
}

/**
 * Escolhe o valor de comparação e o NOME dessa base.
 *
 * O nome não é enfeite: é o que transforma "+12%" numa afirmação
 * verificável. Toda base devolve o seu rótulo, e o gráfico escreve.
 */
export function escolherBase({ serie, config = {} }) {
  const valores = serie.valores;
  const rotulos = serie.rotulos || [];
  const ultimo = valores.length - 1;
  const modo = config.baseDaComparacao || 'anterior';

  if (modo === 'nenhuma' || ultimo < 0) return { base: null, rotulo: '' };

  if (modo === 'meta') {
    const meta = Number(config.meta);
    return Number.isFinite(meta) ? { base: meta, rotulo: 'a meta' } : { base: null, rotulo: '' };
  }

  if (modo === 'primeiro') {
    if (ultimo < 1) return { base: null, rotulo: '' };
    return { base: valores[0], rotulo: rotulos[0] ? `o início (${rotulos[0]})` : 'o início da série' };
  }

  if (modo === 'media') {
    if (ultimo < 1) return { base: null, rotulo: '' };
    const anteriores = valores.slice(0, ultimo);
    const media = anteriores.reduce((a, b) => a + b, 0) / anteriores.length;
    return { base: media, rotulo: `a média dos ${anteriores.length} períodos anteriores` };
  }

  const passos = modo === 'nAtras' ? Math.max(1, Math.floor(Number(config.periodosAtras) || 12)) : 1;
  const indice = ultimo - passos;
  if (indice < 0) {
    // Pedir 12 períodos atrás numa série de 4 não devolve "o primeiro":
    // devolver outra coisa sem avisar seria responder uma pergunta que
    // ninguém fez.
    return { base: null, rotulo: '', faltouHistorico: true, passos };
  }
  return {
    base: valores[indice],
    rotulo: rotulos[indice]
      ? `${passos === 1 ? 'o período anterior' : `${passos} períodos atrás`} (${rotulos[indice]})`
      : passos === 1
        ? 'o período anterior'
        : `${passos} períodos atrás`,
  };
}

/**
 * Variação absoluta e relativa.
 *
 * A relativa não existe quando a base é zero — e `null` é a resposta
 * certa. Devolver infinito, ou 100%, inventaria um número que ninguém
 * pode verificar.
 */
export function calcularVariacao({ atual, base }) {
  if (atual === null || !Number.isFinite(atual) || base === null || !Number.isFinite(base)) {
    return { diferenca: null, relativa: null };
  }
  const diferenca = atual - base;
  return {
    diferenca,
    relativa: base === 0 ? null : diferenca / Math.abs(base),
  };
}

/** Subir é bom? Depende do indicador — e por isso é uma opção, não um padrão. */
export function ehBoaNoticia(diferenca, menorEhMelhor) {
  if (diferenca === 0) return null;
  return menorEhMelhor ? diferenca < 0 : diferenca > 0;
}

/**
 * O último período parece incompleto?
 *
 * Compara a contagem de LINHAS do último período com a mediana dos
 * anteriores. É uma heurística — só funciona quando a consulta traz várias
 * linhas por período —, e por isso o aviso fala em "parece", e a nota do
 * gráfico avisa que a comparação supõe períodos completos quando a
 * heurística não tem material para decidir.
 *
 * O limiar é folgado (60%) porque meses têm 28 a 31 dias: acusar a cada
 * oscilação faria o aviso virar ruído e o usuário aprenderia a ignorá-lo.
 */
export function detectarPeriodoIncompleto(contagens) {
  if (!contagens || contagens.length < 3) return { suspeito: false };

  const anteriores = contagens.slice(0, -1).filter((n) => n > 0);
  const ultimo = contagens[contagens.length - 1];
  if (anteriores.length < 2 || !(ultimo > 0)) return { suspeito: false };

  const ordenadas = anteriores.slice().sort((a, b) => a - b);
  const meio = Math.floor(ordenadas.length / 2);
  const mediana =
    ordenadas.length % 2 ? ordenadas[meio] : (ordenadas[meio - 1] + ordenadas[meio]) / 2;

  // Com uma linha por período não há o que comparar: a heurística se cala.
  if (mediana <= 1) return { suspeito: false, mediana, ultimo };

  return {
    suspeito: ultimo < mediana * FRACAO_DE_PERIODO_INCOMPLETO,
    mediana,
    ultimo,
    fracao: ultimo / mediana,
  };
}

/**
 * Maior tamanho de fonte em que o texto ainda cabe.
 *
 * Um número que estoura a caixa é pior que um número pequeno: ele some
 * pela borda sem avisar.
 */
export function tamanhoQueCabe(texto, largura, altura, { minimo = 14, maximo = 96 } = {}) {
  if (!texto) return minimo;
  // `larguraAproximada` mede a ~0,6 em por caractere; invertendo, chega-se
  // ao tamanho em que o texto ocupa a largura disponível.
  const porLargura = (largura * 0.95) / Math.max(1, larguraAproximada(texto, 1));
  const porAltura = altura * 0.42;
  return Math.max(minimo, Math.min(maximo, Math.floor(Math.min(porLargura, porAltura))));
}

function desenharSparkline({ pai, valores, largura, altura, cor, tema, tipo = 'area' }) {
  const svg = criarSvgEl('svg', {
    pai,
    classe: 'kv-spark',
    atributos: { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}`, preserveAspectRatio: 'none' },
  });

  const escalaX = escalaDePonto({
    dominio: valores.map((_, i) => String(i)),
    intervalo: [1, Math.max(2, largura - 1)],
    preenchimento: 0,
  });
  const escalaY = escalaNumerica({
    valores,
    intervalo: [altura - 2, 2],
    config: {},
    eixo: 'Y',
  });

  if (tipo === 'barras') {
    const minimo = Math.min(0, ...valores);
    const maximo = Math.max(0, ...valores);
    const faixa = maximo - minimo || 1;
    const larguraDaBarra = Math.max(1, largura / valores.length - 1);
    const zero = altura - ((0 - minimo) / faixa) * altura;
    valores.forEach((v, i) => {
      const y = altura - ((v - minimo) / faixa) * altura;
      criarSvgEl('rect', {
        pai: svg,
        classe: 'kv-barra',
        atributos: {
          x: i * (largura / valores.length),
          y: Math.min(y, zero),
          width: larguraDaBarra,
          height: Math.max(1, Math.abs(zero - y)),
          fill: i === valores.length - 1 ? cor : comOpacidade(cor, 0.45),
        },
      });
    });
    return;
  }

  const area = geradorDeArea({
    x: (_, i) => escalaX(String(i)),
    y0: () => altura,
    y1: (v) => escalaY(v),
    curva: 'monotone',
  });
  if (tipo !== 'linha') {
    criarSvgEl('path', {
      pai: svg,
      classe: 'kv-area',
      atributos: { d: area(valores) || '', fill: comOpacidade(cor, 0.18) },
    });
  }

  const linha = geradorDeLinha({
    x: (_, i) => escalaX(String(i)),
    y: (v) => escalaY(v),
    curva: 'monotone',
  });
  criarSvgEl('path', {
    pai: svg,
    classe: 'kv-linha',
    atributos: { d: linha(valores) || '', fill: 'none', stroke: cor, 'stroke-width': 1.5 },
  });

  criarSvgEl('circle', {
    pai: svg,
    classe: 'kv-ultimo',
    atributos: {
      cx: escalaX(String(valores.length - 1)),
      cy: escalaY(valores[valores.length - 1]),
      r: 2.5,
      fill: cor,
      stroke: tema.fundo,
      'stroke-width': 1,
    },
  });
}
