/**
 * dados.js — transforma a consulta do Looker em conjuntos e regiões.
 *
 * O Looker pode entregar os dados de três jeitos bem diferentes, e o
 * usuário raramente sabe qual é o "certo". Então detectamos:
 *
 *  (a) REGIÕES: uma linha por região, com a dimensão listando os conjuntos
 *      ("A", "A,B", "A,B,C") e a medida trazendo a contagem.
 *  (b) ITEM × CONJUNTO: uma linha por item e conjunto (duas dimensões).
 *      Contamos em quantos conjuntos cada item aparece.
 *  (c) COLUNAS BOOLEANAS: uma linha por item, uma coluna sim/não por
 *      conjunto. Cada coluna booleana vira um conjunto.
 *
 * Em todos os casos a saída é a mesma: a lista de conjuntos e o valor
 * EXCLUSIVO de cada região (a fatia que pertence exatamente àqueles
 * conjuntos), que é o número que se escreve dentro do desenho.
 */

const VALORES_VERDADEIROS = new Set(['sim', 'yes', 'true', '1', 'verdadeiro', 'y', 's', 't']);

function ehVerdadeiro(texto) {
  return VALORES_VERDADEIROS.has(String(texto).trim().toLowerCase());
}

/** Descobre sozinho qual dos três formatos a consulta tem. */
export function detectarFormato(modelo) {
  const booleanas = modelo.dimensoes.filter((d) => /yesno|boolean/i.test(d.tipo));
  if (booleanas.length >= 2) return 'booleanas';
  if (modelo.dimensoes.length >= 2) return 'itemConjunto';
  return 'regioes';
}

/**
 * Lê os dados conforme o formato.
 *
 * @returns {{conjuntos:Array<{nome:string}>, regioes:Map<number,number>,
 *            totalPorConjunto:Map<number,number>, formato:string,
 *            avisos:string[], unidade:string}}
 */
export function lerConjuntos(modelo, config) {
  const formato = config.formatoDosDados && config.formatoDosDados !== 'auto'
    ? config.formatoDosDados
    : detectarFormato(modelo);

  const leitor = { regioes: lerRegioes, itemConjunto: lerItemConjunto, booleanas: lerBooleanas }[formato];
  const resultado = (leitor || lerRegioes)(modelo, config);
  resultado.formato = formato;

  // Total de cada conjunto = soma de todas as regiões que o contêm.
  const totalPorConjunto = new Map();
  for (let i = 0; i < resultado.conjuntos.length; i++) {
    let soma = 0;
    for (const [mascara, valor] of resultado.regioes) {
      if (mascara & (1 << i)) soma += valor;
    }
    totalPorConjunto.set(i, soma);
  }
  resultado.totalPorConjunto = totalPorConjunto;

  return resultado;
}

/** (a) Uma linha por região: "A", "A,B", "A,B,C". */
function lerRegioes(modelo, config) {
  const avisos = [];
  const dimensao = modelo.dimensoes[0];
  const medida = escolherMedida(modelo, config);

  if (!dimensao) {
    return { conjuntos: [], regioes: new Map(), avisos: ['Nenhuma dimensão na consulta.'], unidade: '' };
  }

  const separador = config.separadorDeConjuntos || ',';
  const indicePorNome = new Map();
  const nomes = [];
  const bruto = [];

  for (const linha of modelo.linhas) {
    const texto = modelo.texto(linha, dimensao.nome, undefined, '');
    if (!texto) continue;
    const partes = texto
      .split(separador)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!partes.length) continue;

    for (const nome of partes) {
      if (!indicePorNome.has(nome)) {
        indicePorNome.set(nome, nomes.length);
        nomes.push(nome);
      }
    }

    const valor = medida ? modelo.valorNumerico(linha, medida.nome) : 1;
    bruto.push({ partes, valor: valor === null ? 0 : valor });
  }

  const { conjuntos, mantidos, aviso } = limitarConjuntos(nomes, indicePorNome, config);
  if (aviso) avisos.push(aviso);

  const regioes = new Map();
  for (const { partes, valor } of bruto) {
    // Se a linha cita um conjunto que não coube no limite, o valor entra na
    // região dos conjuntos que sobraram; o aviso acima já explica a perda.
    let mascara = 0;
    for (const nome of partes) {
      const indice = mantidos.get(nome);
      if (indice !== undefined) mascara |= 1 << indice;
    }
    if (!mascara) continue;
    regioes.set(mascara, (regioes.get(mascara) || 0) + valor);
  }

  return { conjuntos, regioes, avisos, unidade: medida ? medida.rotuloCurto : 'linhas' };
}

/** (b) Uma linha por item e conjunto. */
function lerItemConjunto(modelo, config) {
  const avisos = [];
  const campoDoItem = escolherDimensao(modelo, config.campoDoItem, 0);
  const campoDoConjunto = escolherDimensao(modelo, config.campoDoConjunto, 1);
  const medida = escolherMedida(modelo, config);

  if (!campoDoItem || !campoDoConjunto || campoDoItem.nome === campoDoConjunto.nome) {
    return {
      conjuntos: [],
      regioes: new Map(),
      avisos: ['Este formato precisa de duas dimensões diferentes: o item e o conjunto.'],
      unidade: '',
    };
  }

  const indicePorNome = new Map();
  const nomes = [];
  // Para cada item: máscara dos conjuntos e valor acumulado.
  const porItem = new Map();

  for (const linha of modelo.linhas) {
    const item = modelo.texto(linha, campoDoItem.nome, undefined, '');
    const conjunto = modelo.texto(linha, campoDoConjunto.nome, undefined, '');
    if (!item || !conjunto) continue;

    if (!indicePorNome.has(conjunto)) {
      indicePorNome.set(conjunto, nomes.length);
      nomes.push(conjunto);
    }
    if (!porItem.has(item)) porItem.set(item, { mascaraPorNome: new Set(), valor: 0 });
    const registro = porItem.get(item);
    registro.mascaraPorNome.add(conjunto);
    if (medida) {
      const v = modelo.valorNumerico(linha, medida.nome);
      if (v !== null) registro.valor += v;
    }
  }

  const { conjuntos, mantidos, aviso } = limitarConjuntos(nomes, indicePorNome, config);
  if (aviso) avisos.push(aviso);

  const contarItens = !medida || config.medirPor === 'itens';
  const regioes = new Map();
  for (const registro of porItem.values()) {
    let mascara = 0;
    for (const nome of registro.mascaraPorNome) {
      const indice = mantidos.get(nome);
      if (indice !== undefined) mascara |= 1 << indice;
    }
    if (!mascara) continue;
    const valor = contarItens ? 1 : registro.valor;
    regioes.set(mascara, (regioes.get(mascara) || 0) + valor);
  }

  return {
    conjuntos,
    regioes,
    avisos,
    unidade: contarItens ? campoDoItem.rotuloCurto : medida.rotuloCurto,
  };
}

/** (c) Uma linha por item, uma coluna sim/não por conjunto. */
function lerBooleanas(modelo, config) {
  const avisos = [];
  const medida = escolherMedida(modelo, config);
  const candidatas = modelo.dimensoes.filter((d) => /yesno|boolean/i.test(d.tipo));
  const colunas = candidatas.length >= 2 ? candidatas : modelo.dimensoes.slice(1);

  if (colunas.length < 2) {
    return {
      conjuntos: [],
      regioes: new Map(),
      avisos: ['Este formato precisa de pelo menos duas colunas sim/não.'],
      unidade: '',
    };
  }

  const nomes = colunas.map((c) => c.rotuloCurto);
  const indicePorNome = new Map(nomes.map((n, i) => [n, i]));
  const { conjuntos, mantidos, aviso } = limitarConjuntos(nomes, indicePorNome, config);
  if (aviso) avisos.push(aviso);

  const contarItens = !medida || config.medirPor === 'itens';
  const regioes = new Map();

  for (const linha of modelo.linhas) {
    let mascara = 0;
    colunas.forEach((coluna, i) => {
      const indice = mantidos.get(nomes[i]);
      if (indice === undefined) return;
      if (ehVerdadeiro(modelo.texto(linha, coluna.nome, undefined, ''))) mascara |= 1 << indice;
    });
    if (!mascara) continue;
    const valor = contarItens ? 1 : modelo.valorNumerico(linha, medida.nome) || 0;
    regioes.set(mascara, (regioes.get(mascara) || 0) + valor);
  }

  return { conjuntos, regioes, avisos, unidade: contarItens ? 'itens' : medida.rotuloCurto };
}

/**
 * O Venn só existe até 5 conjuntos. Se vierem mais, ficamos com os maiores
 * e avisamos — melhor do que desenhar errado ou não desenhar nada.
 */
function limitarConjuntos(nomes, indicePorNome, config) {
  const maximo = Math.min(5, Math.max(2, Number(config.maximoDeConjuntos) || 5));
  if (nomes.length <= maximo) {
    return {
      conjuntos: nomes.map((nome) => ({ nome })),
      mantidos: new Map(nomes.map((n, i) => [n, i])),
      aviso: null,
    };
  }

  const escolhidos = nomes.slice(0, maximo);
  return {
    conjuntos: escolhidos.map((nome) => ({ nome })),
    mantidos: new Map(escolhidos.map((n, i) => [n, i])),
    aviso: `A consulta tem ${nomes.length} conjuntos e o diagrama de Venn vai até ${maximo}. Os ${
      nomes.length - maximo
    } últimos foram ignorados.`,
  };
}

function escolherMedida(modelo, config) {
  if (config.campoDaMedida) {
    const achado = modelo.medidas.find((m) => m.nome === config.campoDaMedida);
    if (achado) return achado;
  }
  return modelo.medidas[0] || null;
}

function escolherDimensao(modelo, nomeEscolhido, posicaoPadrao) {
  if (nomeEscolhido) {
    const achado = modelo.dimensoes.find((d) => d.nome === nomeEscolhido);
    if (achado) return achado;
  }
  return modelo.dimensoes[posicaoPadrao] || null;
}

/** Nome legível de uma região ("A ∩ B", "só A"). */
export function rotuloDaRegiao(mascara, conjuntos) {
  const nomes = [];
  for (let i = 0; i < conjuntos.length; i++) {
    if (mascara & (1 << i)) nomes.push(conjuntos[i].nome);
  }
  if (nomes.length === 1) return `só ${nomes[0]}`;
  return nomes.join(' ∩ ');
}
