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
import { formatarPercentual, formatarData, truncar } from '../../core/format.js';
import { lerRotulos, textoDoRotulo, estilizarRotulo, formatadorDoRotulo } from '../../core/rotulos.js';
import { larguraAproximada } from '../../core/eixos.js';
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
.kv-raiz{position:relative;width:100%;height:100%;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:2px;padding:8px;box-sizing:border-box;}
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
      }
    ),
    {}
  ),
  exigencia: { medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

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
    const { modelo, config, tema, raiz, largura, altura } = ctx;

    const medida =
      modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    if (!medida) {
      ctx.mostrarVazio('Este indicador precisa de uma medida.');
      return;
    }

    const campoDoPeriodo =
      config.campoDoPeriodo === ''
        ? null
        : modelo.dimensoes.find((d) => d.nome === config.campoDoPeriodo) || modelo.dimensoes[0] || null;

    const serie = lerSerie({ modelo, medida, campoDoPeriodo, config });
    if (!serie.valores.length) {
      ctx.mostrarVazio('Nenhuma linha tem valor numérico na medida escolhida.');
      return;
    }

    const atual = serie.valores[serie.valores.length - 1];
    const comparacao = escolherBase({ serie, config });

    // ---------- Período incompleto ----------
    const incompleto = detectarPeriodoIncompleto(serie.contagens);
    if (incompleto.suspeito && comparacao.base !== null) {
      ctx.avisar(
        `O último período tem ${incompleto.ultimo} linha(s) contra ${incompleto.mediana} nos ` +
          'anteriores: ele parece INCOMPLETO. Comparar um período em andamento com um período ' +
          'inteiro faz o indicador "cair" sempre — confira o filtro de data no Explore.'
      );
    }

    // ---------- Cena ----------
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'kv');
    const caixa = criarEl('div', { classe: 'kv-raiz', pai: raiz });

    // Rótulos (6.1), relidos a cada desenho. O que é "rótulo" no KPI:
    //  * o NÚMERO principal é o dado: "Formato do número" e "Casas
    //    decimais" o formatam quando o formato não é "auto" (em "auto" vale
    //    o value_format do campo, como o Looker mostraria), e "O que
    //    mostrar" escolhe o conteúdo dele. O tamanho do número continua
    //    automático (o maior que cabe).
    //  * título, variação e base são os rótulos SECUNDÁRIOS: mostrar,
    //    tamanho, cor, negrito, rotação, truncar, posição e "esconder
    //    sobrepostos" valem para eles.
    const rot = lerRotulos(config, tema);
    const formatar = formatadorDoRotulo(rot, medida.valueFormat);
    const textoDoTitulo = config.titulo || medida.rotulo || medida.rotuloCurto;
    // "nome" e "nomeValor" põem o nome no próprio número: o título sairia repetido.
    const nomeNoNumero = rot.conteudo === 'nome' || rot.conteudo === 'nomeValor';
    const larguraUtil = Math.max(40, largura - 24);

    /** Texto secundário: truncar do painel + (opcional) cortar o que não cabe na largura. */
    const ajustarTexto = (texto, tamanho) => {
      let t = rot.truncar > 0 ? truncar(texto, rot.truncar) : String(texto);
      if (rot.evitarColisao) {
        const cabe = Math.max(4, Math.floor(larguraUtil / (tamanho * 0.58)));
        t = truncar(t, cabe);
      }
      return t;
    };

    const secundarios = [];
    const criarTitulo = () => {
      if (!rot.mostrar || nomeNoNumero) return;
      const el = criarEl('div', { classe: 'kv-titulo', pai: caixa });
      definirTexto(el, ajustarTexto(textoDoTitulo, rot.tamanho));
      estilizarRotulo(el, rot, { corAutomatica: tema.textoSuave });
      // "Fora com linha-guia": título acima com uma linha separando do número.
      if (rot.posicao === 'foraComLinha') {
        el.style.borderBottom = `1px solid ${tema.borda}`;
        el.style.paddingBottom = '2px';
      }
      secundarios.push({ el, altura: rot.tamanho * 1.4, prioridade: 3 });
    };

    // "Posição do rótulo": auto / fora / fora com linha = título ACIMA do
    // número (como antes); dentro / centro = título logo ABAIXO do número.
    const tituloAbaixo = rot.posicao === 'dentro' || rot.posicao === 'centro';
    if (!tituloAbaixo) criarTitulo();

    const textoDoNumero = textoDoRotulo(Object.assign({}, rot, { truncar: 0 }), {
      valor: atual,
      nome: textoDoTitulo,
      // "Percentual": o atual como % da base de comparação (ex.: % da meta).
      total: comparacao.base,
      valueFormat: medida.valueFormat,
    });
    const numero = criarEl('div', { classe: 'kv-numero', pai: caixa });
    numero.style.color = tema.texto;
    const tamanhoDoNumero = tamanhoQueCabe(textoDoNumero, largura - 24, altura);
    numero.style.fontSize = `${tamanhoDoNumero}px`;
    definirTexto(numero, textoDoNumero);

    if (tituloAbaixo) criarTitulo();

    // ---------- Variação ----------
    const resultado = calcularVariacao({ atual, base: comparacao.base });
    const menorEhMelhor = config.menorEhMelhor === true;
    const bom = resultado.diferenca === null ? null : ehBoaNoticia(resultado.diferenca, menorEhMelhor);

    if (comparacao.base !== null && rot.mostrar) {
      const linha = criarEl('div', { classe: 'kv-variacao', pai: caixa });
      // O contêiner recebe o estilo do rótulo; seta e percentual são 40%
      // maiores (em `em`), para "Tamanho do rótulo" escalar a linha toda.
      estilizarRotulo(linha, rot, { corAutomatica: tema.texto });
      const cor =
        config.colorirVariacao === false || bom === null
          ? rot.cor || tema.texto
          : bom
            ? tema.positivo
            : tema.negativo;

      const seta = criarEl('span', { classe: 'kv-seta', pai: linha });
      seta.style.color = cor;
      seta.style.fontSize = '1.4em';
      // A SETA segue o sinal do número, nunca a opinião sobre ele: inverter
      // a seta em "menor é melhor" faria a queda parecer subida.
      definirTexto(seta, resultado.diferenca > 0 ? '▲' : resultado.diferenca < 0 ? '▼' : '■');

      const percentual = criarEl('span', { pai: linha });
      percentual.style.color = cor;
      percentual.style.fontWeight = '600';
      percentual.style.fontSize = '1.4em';
      definirTexto(
        percentual,
        resultado.relativa === null
          ? '—'
          : `${resultado.relativa >= 0 ? '+' : ''}${formatarPercentual(resultado.relativa, 1)}`
      );

      if (config.mostrarVariacaoAbsoluta !== false) {
        const absoluta = criarEl('span', { pai: linha });
        absoluta.style.color = rot.cor || tema.textoSuave;
        definirTexto(
          absoluta,
          `(${resultado.diferenca >= 0 ? '+' : ''}${formatar(resultado.diferenca)})`
        );
      }
      secundarios.push({ el: linha, altura: rot.tamanho * 1.4 * 1.4, prioridade: 2 });

      // A BASE sempre declarada (enquanto houver rótulos): sem ela, "+12%" é retórica.
      const base = criarEl('div', { classe: 'kv-base', pai: caixa });
      definirTexto(base, ajustarTexto(`contra ${comparacao.rotulo}: ${formatar(comparacao.base)}`, rot.tamanho));
      estilizarRotulo(base, rot, { corAutomatica: tema.textoSuave });
      secundarios.push({ el: base, altura: rot.tamanho * 1.4, prioridade: 1 });
    }

    // "Esconder rótulos que se sobrepõem": se número + rótulos + sparkline
    // não cabem na altura, somem primeiro a base, depois a variação, por
    // último o título — o número nunca some.
    if (rot.evitarColisao && secundarios.length) {
      const alturaDaSpark = config.mostrarSparkline !== false && serie.valores.length > 1 ? Math.max(18, Math.min(60, altura * 0.18)) : 0;
      let ocupado = tamanhoDoNumero * 1.05 + alturaDaSpark + secundarios.reduce((s, r) => s + r.altura, 0);
      for (const r of secundarios.slice().sort((a, b) => a.prioridade - b.prioridade)) {
        if (ocupado <= altura - 16) break;
        r.el.style.display = 'none';
        ocupado -= r.altura;
      }
    }

    // ---------- Sparkline ----------
    if (config.mostrarSparkline !== false && serie.valores.length > 1) {
      desenharSparkline({
        pai: caixa,
        valores: serie.valores,
        largura: Math.min(420, largura - 24),
        altura: Math.max(18, Math.min(60, altura * 0.18)),
        cor: bom === null ? tema.destaque : bom ? tema.positivo : tema.negativo,
        tema,
      });
    }

    // ---------- Nota ----------
    const nota = criarEl('div', { classe: 'kv-nota', pai: caixa });
    nota.style.color = tema.textoSuave;
    definirTexto(
      nota,
      [
        serie.rotuloDoAtual ? `período: ${serie.rotuloDoAtual}` : null,
        `${serie.valores.length} período(s) na série`,
        menorEhMelhor ? 'menor é melhor: a cor está invertida, o sinal não' : null,
        comparacao.base !== null && !incompleto.suspeito
          ? 'a comparação supõe períodos completos'
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    );
  },
});

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

function desenharSparkline({ pai, valores, largura, altura, cor, tema }) {
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

  const area = geradorDeArea({
    x: (_, i) => escalaX(String(i)),
    y0: () => altura,
    y1: (v) => escalaY(v),
    curva: 'monotone',
  });
  criarSvgEl('path', {
    pai: svg,
    atributos: { d: area(valores) || '', fill: comOpacidade(cor, 0.18) },
  });

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
