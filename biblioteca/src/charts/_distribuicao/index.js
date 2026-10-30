/**
 * _distribuicao — base dos gráficos que mostram distribuições por categoria.
 *
 * `violin`, `ridgeline`, `beeswarm` e `boxplot_avancado` resolvem o mesmo
 * problema antes de desenhar qualquer coisa: achar a dimensão e a medida,
 * agrupar os valores, cortar o excesso de categorias e dizer ao usuário
 * quando a consulta não tem distribuição nenhuma para mostrar.
 *
 * Essa preparação fica aqui. O desenho é de cada gráfico.
 */

import { agruparValores, resumoDeDistribuicao, limitesDeOutlier } from '../../core/estatistica.js';
import { listaDeValores, opcaoDeEscolhaDeCampo } from '../../core/options-kit.js';

/** Abaixo disto, qualquer estimativa diz mais sobre o método que sobre o dado. */
export const MINIMO_CONFIAVEL = 10;

/** Opções comuns a todos os gráficos de distribuição. */
export function opcoesDeDistribuicao({ secao = 'Distribuição', maximoPadrao = 30 } = {}) {
  return {
    maximoDeCategorias: {
      type: 'number',
      label: 'Máximo de categorias (as de maior n primeiro)',
      section: secao,
      display: 'range',
      min: 2,
      max: 60,
      step: 1,
      default: maximoPadrao,
    },
    ordemDasCategorias: {
      type: 'string',
      label: 'Ordem das categorias',
      section: secao,
      display: 'select',
      default: 'consulta',
      values: listaDeValores([
        { rotulo: 'Como veio da consulta', valor: 'consulta' },
        { rotulo: 'Pela mediana (maior primeiro)', valor: 'medianaDesc' },
        { rotulo: 'Pela mediana (menor primeiro)', valor: 'medianaAsc' },
        { rotulo: 'Por quantidade de observações', valor: 'contagem' },
        { rotulo: 'Alfabética', valor: 'alfabetica' },
      ]),
    },
    avisarGruposPequenos: {
      type: 'boolean',
      label: 'Marcar categorias com poucas observações',
      section: secao,
      default: true,
    },
    mostrarContagem: {
      type: 'boolean',
      label: 'Escrever o n de cada categoria',
      section: 'Rótulos',
      default: true,
    },
  };
}

/** Selects de "qual dimensão agrupa" e "qual medida tem os valores". */
export function opcoesDinamicasDeDistribuicao(modelo) {
  const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
  const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
  const saida = {};

  // A escolha aparece mesmo com uma dimensão só, porque "(nenhuma)" é uma
  // resposta legítima: uma distribuição única, de todas as linhas juntas.
  if (dimensoes.length) {
    Object.assign(
      saida,
      opcaoDeEscolhaDeCampo('campoDaCategoria', 'Dimensão das categorias', dimensoes, {
        secao: 'Dados',
        incluirNenhum: true,
        padrao: dimensoes[0].nome,
      })
    );
  }
  if (medidas.length > 1) {
    Object.assign(
      saida,
      opcaoDeEscolhaDeCampo('campoDosValores', 'Medida da distribuição', medidas, {
        secao: 'Dados',
        padrao: medidas[0].nome,
      })
    );
  }
  return saida;
}

/**
 * Prepara as distribuições de uma consulta.
 *
 * Devolve `null` com uma mensagem quando não há o que desenhar — e a
 * mensagem SEMPRE diz o que mudar no Explore, porque "sem dados" num
 * gráfico de distribuição quase nunca significa consulta vazia: significa
 * consulta agregada demais.
 *
 * @returns {{grupos:Array, campoDaCategoria, medida, pequenos:Array}|
 *           {erro:string}}
 */
export function prepararDistribuicoes(ctx) {
  const { modelo, config } = ctx;

  const medida =
    modelo.medidas.find((m) => m.nome === config.campoDosValores) || modelo.medidas[0] || null;
  if (!medida) {
    return { erro: 'Esta visualização precisa de uma medida com os valores da distribuição.' };
  }

  // `''` é a opção "(nenhuma)": todas as linhas formam uma distribuição só.
  const campoDaCategoria =
    config.campoDaCategoria === ''
      ? null
      : modelo.dimensoes.find((d) => d.nome === config.campoDaCategoria) ||
        modelo.dimensoes[0] ||
        null;

  let grupos = agruparValores({ modelo, campoDaCategoria, medida });
  if (!grupos.length) {
    return { erro: 'Nenhuma categoria tem valores numéricos na medida escolhida.' };
  }

  // Uma consulta agregada traz UM valor por categoria, e distribuição de
  // um ponto só não existe.
  if (grupos.every((g) => g.valores.length === 1)) {
    return {
      erro:
        'Cada categoria tem um único valor: não há distribuição para desenhar. ' +
        'Traga as linhas sem agregar (ou agrupe por uma dimensão mais fina) no Explore.',
    };
  }

  // Centenas de categorias não cabem: cada uma fica com poucos pixels e
  // nenhuma mostra forma. Ficamos com as de maior n, que são as que têm
  // distribuição para mostrar.
  const limite = Number(config.maximoDeCategorias) || 30;
  if (grupos.length > limite) {
    ctx.avisar(
      `A consulta tem ${grupos.length} categorias; mostrando as ${limite} com mais observações.`
    );
    grupos = grupos.slice().sort((a, b) => b.valores.length - a.valores.length).slice(0, limite);
  }

  // O resumo vem antes da ordenação porque ordenar por mediana precisa dele.
  for (const grupo of grupos) {
    grupo.resumo = resumoDeDistribuicao(grupo.valores);
    grupo.limites = limitesDeOutlier(grupo.resumo);
  }

  ordenarGrupos(grupos, config.ordemDasCategorias);

  const pequenos = grupos.filter((g) => g.resumo.n < MINIMO_CONFIAVEL);
  if (config.avisarGruposPequenos !== false && pequenos.length) {
    ctx.avisar(
      `${pequenos.length} categoria(s) têm menos de ${MINIMO_CONFIAVEL} observações. ` +
        'Uma distribuição estimada a partir de poucos pontos diz mais sobre o método do que sobre os dados.'
    );
  }

  return { grupos, campoDaCategoria, medida, pequenos };
}

function ordenarGrupos(grupos, ordem) {
  switch (ordem) {
    case 'medianaDesc':
      grupos.sort((a, b) => b.resumo.mediana - a.resumo.mediana);
      break;
    case 'medianaAsc':
      grupos.sort((a, b) => a.resumo.mediana - b.resumo.mediana);
      break;
    case 'contagem':
      grupos.sort((a, b) => b.resumo.n - a.resumo.n);
      break;
    case 'alfabetica':
      grupos.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
      break;
    default:
      break;
  }
}

/** Rótulo de eixo de uma categoria, com o n quando pedido. */
export function rotuloDaCategoria(grupo, config, limite = 18) {
  const nome = grupo.rotulo.length > limite ? `${grupo.rotulo.slice(0, limite - 1)}…` : grupo.rotulo;
  return config.mostrarContagem !== false ? `${nome} (n=${grupo.resumo.n})` : nome;
}

/** Linhas de tooltip comuns a qualquer gráfico de distribuição. */
export function linhasDeResumo(grupo, formatar, cor) {
  const r = grupo.resumo;
  const linhas = [
    { rotulo: 'Observações', valor: String(r.n), cor },
    { rotulo: 'Mediana', valor: formatar(r.mediana) },
    { rotulo: 'Média', valor: formatar(r.media) },
    { rotulo: 'Q1 – Q3', valor: `${formatar(r.q1)} – ${formatar(r.q3)}` },
    { rotulo: 'Mínimo – Máximo', valor: `${formatar(r.minimo)} – ${formatar(r.maximo)}` },
    { rotulo: 'Desvio padrão', valor: formatar(r.desvio) },
  ];
  if (grupo.limites && grupo.limites.outliers.length) {
    linhas.push({ rotulo: 'Fora de 1,5 × IQR', valor: String(grupo.limites.outliers.length) });
  }
  if (r.n < MINIMO_CONFIAVEL) {
    linhas.push({ rotulo: 'Atenção', valor: 'poucas observações' });
  }
  return linhas;
}
