/**
 * fixtures/index.mjs — dados de exemplo no MESMO formato que o Looker manda.
 *
 * Usado pelo harness (`test/harness.html`) e pelo smoke test
 * (`test/smoke.test.mjs`). Tudo é SINTÉTICO: nada de dados reais de
 * negócio, nomes de clientes ou URLs internas (regra da seção 2).
 *
 * Formato reproduzido (ver docs/COMPAT.md):
 *   queryResponse.fields = { dimensions, measures, table_calculations,
 *                            dimension_like, measure_like, pivots }
 *   célula simples   → row[campo] = { value, rendered, links? }
 *   célula pivotada  → row[campo][chaveDoPivo] = { value, rendered }
 *   queryResponse.pivots = [{ key, is_total, data, metadata }]
 */

/** Gerador pseudo-aleatório determinístico (testes repetíveis). */
export function criarRng(semente = 42) {
  let s = semente >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function celula(valor, renderizado, links) {
  if (valor === null || valor === undefined) return { value: null, rendered: null };
  const c = { value: valor, rendered: renderizado === undefined ? String(valor) : renderizado };
  if (links) c.links = links;
  return c;
}

export function campoDimensao(nome, rotulo, extras = {}) {
  return {
    name: nome,
    label: rotulo,
    label_short: extras.rotuloCurto || rotulo,
    type: extras.tipo || 'string',
    is_numeric: !!extras.ehNumerico,
    value_format: extras.valueFormat || null,
  };
}

export function campoMedida(nome, rotulo, extras = {}) {
  return {
    name: nome,
    label: rotulo,
    label_short: extras.rotuloCurto || rotulo,
    type: extras.tipo || 'number',
    is_numeric: true,
    value_format: extras.valueFormat || '#,##0',
  };
}

function montarQueryResponse({ dimensoes = [], medidas = [], tableCalcs = [], pivots = [], pivotsDeDados = null }) {
  return {
    fields: {
      dimensions: dimensoes,
      measures: medidas,
      table_calculations: tableCalcs,
      dimension_like: dimensoes,
      measure_like: medidas.concat(tableCalcs),
      pivots,
    },
    pivots: pivotsDeDados || [],
  };
}

const LOJAS = [
  'Loja Centro', 'Loja Norte', 'Loja Sul', 'Loja Leste', 'Loja Oeste',
  'Loja Shopping', 'Loja Aeroporto', 'Loja Estação', 'Loja Praia', 'Loja Serra',
];
const CATEGORIAS = ['Bebidas', 'Alimentos', 'Grãos', 'Acessórios', 'Sobremesas'];
const REGIOES = ['Sudeste', 'Sul', 'Nordeste', 'Norte', 'Centro-Oeste'];
const MESES = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

/** Básica: 1 dimensão + 2 medidas, sem pivô, com alguns nulos. */
export function semPivo({ linhas = 20, comNulos = true, semente = 7 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [campoDimensao('loja', 'Loja')];
  const medidas = [
    campoMedida('vendas', 'Vendas', { valueFormat: '$#,##0.00' }),
    campoMedida('pedidos', 'Pedidos'),
  ];
  const data = [];
  for (let i = 0; i < linhas; i++) {
    const nulo = comNulos && rng() < 0.08;
    const pedidos = nulo ? null : Math.round(rng() * 900) + 10;
    const vendas = nulo ? null : Math.round(pedidos * (12 + rng() * 60) * 100) / 100;
    data.push({
      loja: celula(LOJAS[i % LOJAS.length] + (i >= LOJAS.length ? ` ${Math.floor(i / LOJAS.length) + 1}` : ''), undefined, [
        { label: 'Explorar', url: '#drill', type: 'measure_default' },
      ]),
      vendas: celula(vendas, vendas === null ? null : `$${vendas.toFixed(2)}`),
      pedidos: celula(pedidos),
    });
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Duas dimensões + 2 medidas (para matrizes, dispersões, hierarquias rasas). */
export function duasDimensoes({ linhas = 40, semente = 11 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [campoDimensao('regiao', 'Região'), campoDimensao('categoria', 'Categoria')];
  const medidas = [
    campoMedida('receita', 'Receita', { valueFormat: '$#,##0' }),
    campoMedida('margem', 'Margem %', { valueFormat: '0.0%' }),
  ];
  const data = [];
  for (let i = 0; i < linhas; i++) {
    const receita = Math.round(rng() * 500000) + 1000;
    const margem = Math.round(rng() * 4500) / 10000;
    data.push({
      regiao: celula(REGIOES[i % REGIOES.length]),
      categoria: celula(CATEGORIAS[Math.floor(rng() * CATEGORIAS.length)]),
      receita: celula(receita),
      margem: celula(margem, `${(margem * 100).toFixed(1)}%`),
    });
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Com pivô: 1 dimensão de linha + pivô por região + 2 medidas. */
export function comPivo({ linhas = 12, comTotalDeLinha = true, semente = 13 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [campoDimensao('categoria', 'Categoria')];
  const camposPivo = [campoDimensao('regiao', 'Região')];
  const medidas = [campoMedida('receita', 'Receita', { valueFormat: '$#,##0' }), campoMedida('itens', 'Itens')];

  const pivotsDeDados = REGIOES.map((r) => ({
    key: r,
    is_total: false,
    data: { regiao: r },
    metadata: { regiao: { value: r, rendered: r } },
  }));
  if (comTotalDeLinha) {
    pivotsDeDados.push({
      key: '$$$_row_total_$$$',
      is_total: true,
      data: { regiao: null },
      metadata: { regiao: { value: null, rendered: 'Total' } },
    });
  }

  const data = [];
  for (let i = 0; i < linhas; i++) {
    const receitaPorPivo = {};
    const itensPorPivo = {};
    let somaReceita = 0;
    let somaItens = 0;
    for (const r of REGIOES) {
      const nulo = rng() < 0.06;
      const itens = nulo ? null : Math.round(rng() * 400) + 5;
      const receita = nulo ? null : Math.round(itens * (20 + rng() * 80));
      if (!nulo) {
        somaReceita += receita;
        somaItens += itens;
      }
      receitaPorPivo[r] = celula(receita);
      itensPorPivo[r] = celula(itens);
    }
    if (comTotalDeLinha) {
      receitaPorPivo['$$$_row_total_$$$'] = celula(somaReceita);
      itensPorPivo['$$$_row_total_$$$'] = celula(somaItens);
    }
    data.push({
      categoria: celula(`${CATEGORIAS[i % CATEGORIAS.length]} ${Math.floor(i / CATEGORIAS.length) + 1}`),
      receita: receitaPorPivo,
      itens: itensPorPivo,
    });
  }

  return {
    data,
    queryResponse: montarQueryResponse({
      dimensoes,
      medidas,
      pivots: camposPivo,
      pivotsDeDados,
    }),
  };
}

/** Série temporal: data + categoria + medida (ThemeRiver, linhas, bump). */
export function temporal({ periodos = 24, series = 5, semente = 17 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [
    campoDimensao('mes', 'Mês', { tipo: 'date_month' }),
    campoDimensao('categoria', 'Categoria'),
  ];
  const medidas = [campoMedida('valor', 'Valor', { valueFormat: '#,##0' })];
  const data = [];
  const base = new Date(2025, 0, 1);
  for (let p = 0; p < periodos; p++) {
    const d = new Date(base.getFullYear(), base.getMonth() + p, 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    for (let s = 0; s < series; s++) {
      const tendencia = 100 + s * 40 + p * (3 + s);
      const ruido = (rng() - 0.5) * 60;
      data.push({
        mes: celula(iso, iso),
        categoria: celula(CATEGORIAS[s % CATEGORIAS.length]),
        valor: celula(Math.max(0, Math.round(tendencia + ruido))),
      });
    }
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Hierarquia por dimensões (árvores, treemap, organograma). */
export function hierarquia({ semente = 19 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [
    campoDimensao('nivel1', 'Diretoria'),
    campoDimensao('nivel2', 'Gerência'),
    campoDimensao('nivel3', 'Equipe'),
  ];
  const medidas = [campoMedida('headcount', 'Pessoas'), campoMedida('custo', 'Custo', { valueFormat: '$#,##0' })];
  const diretorias = ['Operações', 'Comercial', 'Tecnologia'];
  const data = [];
  for (const d of diretorias) {
    for (let g = 1; g <= 3; g++) {
      for (let e = 1; e <= 3; e++) {
        const pessoas = Math.round(rng() * 18) + 2;
        data.push({
          nivel1: celula(d),
          nivel2: celula(`${d} — Gerência ${g}`),
          nivel3: celula(`Equipe ${g}.${e}`),
          headcount: celula(pessoas),
          custo: celula(pessoas * (8000 + Math.round(rng() * 6000))),
        });
      }
    }
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Hierarquia por campos pai/filho (organograma com IDs). */
export function paiFilho() {
  const dimensoes = [
    campoDimensao('id', 'ID'),
    campoDimensao('pai', 'ID do superior'),
    campoDimensao('nome', 'Nome'),
  ];
  const medidas = [campoMedida('equipe', 'Tamanho da equipe')];
  const nos = [
    ['1', null, 'Direção Geral', 120],
    ['2', '1', 'Operações', 60],
    ['3', '1', 'Comercial', 40],
    ['4', '1', 'Tecnologia', 20],
    ['5', '2', 'Logística', 25],
    ['6', '2', 'Qualidade', 15],
    ['7', '3', 'Vendas Diretas', 22],
    ['8', '3', 'Parcerias', 10],
    ['9', '4', 'Plataforma', 12],
    ['10', '4', 'Dados', 8],
  ];
  const data = nos.map(([id, pai, nome, equipe]) => ({
    id: celula(id),
    pai: celula(pai),
    nome: celula(nome),
    equipe: celula(equipe),
  }));
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Conjuntos no formato (a): uma linha por REGIÃO ("A", "B", "A,B"). */
export function conjuntosPorRegiao({ quantidade = 3 } = {}) {
  const dimensoes = [campoDimensao('regiao_venn', 'Conjuntos')];
  const medidas = [campoMedida('itens', 'Itens')];
  const regioesPor = {
    2: [['A', 120], ['B', 80], ['A,B', 35]],
    3: [
      ['A', 120], ['B', 80], ['C', 60],
      ['A,B', 35], ['A,C', 25], ['B,C', 18], ['A,B,C', 10],
    ],
    4: [
      ['A', 100], ['B', 90], ['C', 70], ['D', 50],
      ['A,B', 30], ['A,C', 22], ['A,D', 15], ['B,C', 18], ['B,D', 12], ['C,D', 10],
      ['A,B,C', 8], ['A,B,D', 6], ['A,C,D', 5], ['B,C,D', 4], ['A,B,C,D', 3],
    ],
    5: [
      ['A', 90], ['B', 80], ['C', 70], ['D', 60], ['E', 50],
      ['A,B', 25], ['A,C', 20], ['B,C', 18], ['D,E', 15], ['A,E', 12],
      ['A,B,C', 8], ['C,D,E', 6], ['A,B,C,D,E', 2],
    ],
  };
  const lista = regioesPor[quantidade] || regioesPor[3];
  const data = lista.map(([regiao, n]) => ({
    regiao_venn: celula(regiao),
    itens: celula(n),
  }));
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Conjuntos no formato (b): uma linha por ITEM e CONJUNTO. */
export function conjuntosPorItem({ itens = 300, semente = 23 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [campoDimensao('cliente', 'Cliente'), campoDimensao('produto', 'Produto')];
  const medidas = [campoMedida('receita', 'Receita', { valueFormat: '$#,##0' })];
  const produtos = ['Café', 'Chá', 'Doce'];
  const data = [];
  for (let i = 0; i < itens; i++) {
    const cliente = `Cliente ${String(i + 1).padStart(4, '0')}`;
    for (const p of produtos) {
      if (rng() < 0.45) {
        data.push({
          cliente: celula(cliente),
          produto: celula(p),
          receita: celula(Math.round(rng() * 500) + 10),
        });
      }
    }
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Conjuntos no formato (c): uma linha por item, colunas booleanas. */
export function conjuntosBooleanos({ itens = 200, semente = 29 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [
    campoDimensao('cliente', 'Cliente'),
    campoDimensao('comprou_cafe', 'Comprou Café', { tipo: 'yesno' }),
    campoDimensao('comprou_cha', 'Comprou Chá', { tipo: 'yesno' }),
    campoDimensao('comprou_doce', 'Comprou Doce', { tipo: 'yesno' }),
  ];
  const medidas = [campoMedida('receita', 'Receita')];
  const data = [];
  for (let i = 0; i < itens; i++) {
    data.push({
      cliente: celula(`Cliente ${String(i + 1).padStart(4, '0')}`),
      comprou_cafe: celula(rng() < 0.55 ? 'Yes' : 'No'),
      comprou_cha: celula(rng() < 0.4 ? 'Yes' : 'No'),
      comprou_doce: celula(rng() < 0.3 ? 'Yes' : 'No'),
      receita: celula(Math.round(rng() * 900) + 10),
    });
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** OHLC para gráficos financeiros. */
export function ohlc({ periodos = 120, semente = 31 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [campoDimensao('dia', 'Dia', { tipo: 'date_date' })];
  const medidas = [
    campoMedida('abertura', 'Abertura', { valueFormat: '$#,##0.00' }),
    campoMedida('maxima', 'Máxima', { valueFormat: '$#,##0.00' }),
    campoMedida('minima', 'Mínima', { valueFormat: '$#,##0.00' }),
    campoMedida('fechamento', 'Fechamento', { valueFormat: '$#,##0.00' }),
    campoMedida('volume', 'Volume'),
  ];
  const data = [];
  let preco = 100;
  const base = new Date(2026, 0, 1);
  for (let i = 0; i < periodos; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const variacao = (rng() - 0.48) * 4;
    const abertura = preco;
    const fechamento = Math.max(1, abertura + variacao);
    const maxima = Math.max(abertura, fechamento) + rng() * 2;
    const minima = Math.max(0.5, Math.min(abertura, fechamento) - rng() * 2);
    preco = fechamento;
    data.push({
      dia: celula(iso, iso),
      abertura: celula(Math.round(abertura * 100) / 100),
      maxima: celula(Math.round(maxima * 100) / 100),
      minima: celula(Math.round(minima * 100) / 100),
      fechamento: celula(Math.round(fechamento * 100) / 100),
      volume: celula(Math.round(rng() * 1000000) + 50000),
    });
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Vazia: campos declarados, zero linhas. */
export function vazio() {
  const dimensoes = [campoDimensao('loja', 'Loja')];
  const medidas = [campoMedida('vendas', 'Vendas')];
  return { data: [], queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Sem campo nenhum (testa a mensagem de erro de campos insuficientes). */
export function semCampos() {
  return { data: [], queryResponse: montarQueryResponse({}) };
}

/** Só nulos (testa o tratamento de nulos). */
export function somenteNulos({ linhas = 15 } = {}) {
  const dimensoes = [campoDimensao('loja', 'Loja')];
  const medidas = [campoMedida('vendas', 'Vendas')];
  const data = [];
  for (let i = 0; i < linhas; i++) {
    data.push({ loja: celula(`Loja ${i + 1}`), vendas: celula(null) });
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Volume grande (desempenho): N linhas, 1 dimensão + 2 medidas. */
export function volumeGrande({ linhas = 5000, semente = 37 } = {}) {
  const rng = criarRng(semente);
  const dimensoes = [campoDimensao('produto', 'Produto'), campoDimensao('regiao', 'Região')];
  const medidas = [campoMedida('receita', 'Receita'), campoMedida('quantidade', 'Quantidade')];
  const data = new Array(linhas);
  for (let i = 0; i < linhas; i++) {
    const q = Math.round(rng() * 500) + 1;
    data[i] = {
      produto: celula(`Produto ${String(i % 2000).padStart(4, '0')}`),
      regiao: celula(REGIOES[i % REGIOES.length]),
      receita: celula(Math.round(q * (10 + rng() * 90))),
      quantidade: celula(q),
    };
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Nomes muito longos (testa truncagem e anti-colisão de rótulos). */
export function rotulosLongos({ linhas = 10 } = {}) {
  const dimensoes = [campoDimensao('descricao', 'Descrição completa do item')];
  const medidas = [campoMedida('valor', 'Valor')];
  const data = [];
  for (let i = 0; i < linhas; i++) {
    data.push({
      descricao: celula(
        `Item ${i + 1} com um nome extremamente longo que serve para testar truncagem, ` +
          'quebra de linha e anti-colisão de rótulos na visualização'
      ),
      valor: celula((i + 1) * 137),
    });
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

/** Catálogo nomeado, usado pelo harness e pelo smoke test. */
export const FIXTURES = {
  semPivo: () => semPivo(),
  semPivoSemNulos: () => semPivo({ comNulos: false }),
  duasDimensoes: () => duasDimensoes(),
  comPivo: () => comPivo(),
  comPivoSemTotal: () => comPivo({ comTotalDeLinha: false }),
  temporal: () => temporal(),
  hierarquia: () => hierarquia(),
  paiFilho: () => paiFilho(),
  conjuntos2: () => conjuntosPorRegiao({ quantidade: 2 }),
  conjuntos3: () => conjuntosPorRegiao({ quantidade: 3 }),
  conjuntos4: () => conjuntosPorRegiao({ quantidade: 4 }),
  conjuntos5: () => conjuntosPorRegiao({ quantidade: 5 }),
  conjuntosPorItem: () => conjuntosPorItem(),
  conjuntosBooleanos: () => conjuntosBooleanos(),
  ohlc: () => ohlc(),
  vazio: () => vazio(),
  semCampos: () => semCampos(),
  somenteNulos: () => somenteNulos(),
  rotulosLongos: () => rotulosLongos(),
  grande5k: () => volumeGrande({ linhas: 5000 }),
  grande50k: () => volumeGrande({ linhas: 50000 }),
};

/** Subconjunto usado no smoke test de TODO gráfico (rápido e abrangente). */
export const FIXTURES_BASICAS = [
  'semPivo',
  'duasDimensoes',
  'comPivo',
  'temporal',
  'vazio',
  'somenteNulos',
  'rotulosLongos',
];
