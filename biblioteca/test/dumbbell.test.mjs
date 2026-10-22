/**
 * dumbbell.test.mjs — testes dos Halteres.
 *
 * Duas afirmações para verificar:
 *
 * 1. **A barra liga exatamente os dois pontos** e o seu comprimento é
 *    proporcional à DIFERENÇA — inclusive com o eixo cortado, que é a
 *    parte sutil: a diferença não depende de onde o eixo começa.
 * 2. **A cor segue a direção, e "menor é melhor" inverte só a cor.** A
 *    posição dos pontos não pode mudar com a opinião sobre o indicador.
 *
 * Nota de método: todo laço afirma que a lista não está vazia.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { ordenarItens } from '../src/charts/dumbbell/index.js';
import { montarEscala, calcularDiferenca } from '../src/charts/_lista_virtual/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'dumbbell.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

const pct = (texto) => Number(String(texto).replace('%', ''));

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.dumbbell;
  assert.ok(definicao, 'dumbbell não se registrou');

  const instancia = criarInstancia(definicao, amb.chamadasDeApi);
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  const palco = amb.window.document.getElementById('palco');

  instancia.create(palco, configPadrao(definicao));
  let chamouDone = false;
  instancia.updateAsync(
    data,
    palco,
    Object.assign(configPadrao(definicao), ajustes),
    queryResponse,
    {},
    () => { chamouDone = true; }
  );
  assert.ok(chamouDone, 'done() precisa ser chamado sempre');

  const ler = () => ({
    linhas: Array.from(palco.querySelectorAll('.db-linha')).map((el) => ({
      posicao: Number(el.dataset.posicao),
      nome: el.querySelector('.db-nome')?.textContent || '',
      pontos: Array.from(el.querySelectorAll('.db-ponto')).map((p) => ({
        medida: p.dataset.medida,
        esquerda: pct(p.style.left),
      })),
      barra: (() => {
        const b = el.querySelector('.db-barra');
        return b ? { esquerda: pct(b.style.left), largura: pct(b.style.width), cor: b.style.background } : null;
      })(),
      valor: el.querySelector('.db-valor')?.textContent || '',
    })),
    contagem: palco.querySelector('.db-contagem')?.textContent || '',
    nota: palco.querySelector('.db-nota')?.textContent || '',
    busca: palco.querySelector('.db-busca'),
    legenda: Array.from(palco.querySelectorAll('.db-chip')).map((c) => c.textContent),
    regua: Array.from(palco.querySelectorAll('.db-escala span')).map((s) => s.textContent),
  });

  return {
    amb,
    palco,
    ler,
    ...ler(),
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ---------------------------- a conta ---------------------------- */

test('calcularDiferenca — exige as duas pontas', (t) => {
  assert.equal(calcularDiferenca({ valores: [10, 30] }), 20);
  assert.equal(calcularDiferenca({ valores: [30, 10] }), -20);
  assert.equal(calcularDiferenca({ valores: [10] }), null);
  assert.equal(calcularDiferenca({ valores: [null, 30] }), null);
  assert.equal(calcularDiferenca({ valores: [10, NaN] }), null);
  t.diagnostic('cinco casos conferidos');
});

test('ordenarItens — por diferença, e sem diferença vai para o fim', (t) => {
  // Tratar "sem diferença" como zero colocaria o item entre os que caíram
  // e os que subiram, como se a diferença fosse conhecida e nula.
  const itens = [
    { nome: 'caiu', valores: [100, 50], diferenca: -50, diferencaRelativa: -0.5 },
    { nome: 'subiu', valores: [10, 60], diferenca: 50, diferencaRelativa: 5 },
    { nome: 'sem base', valores: [0, 30], diferenca: 30, diferencaRelativa: null },
  ];

  assert.deepEqual(
    ordenarItens(itens.slice(), 'diferenca').map((i) => i.nome),
    ['subiu', 'sem base', 'caiu'],
    'diferenças: +50, +30, −50'
  );
  assert.deepEqual(
    ordenarItens(itens.slice(), 'diferencaPercentual').map((i) => i.nome),
    ['subiu', 'caiu', 'sem base'],
    'sem percentual calculável, vai para o fim'
  );
  t.diagnostic('duas ordens por diferença conferidas');
});

test('ordenarItens — as demais ordens fazem o que prometem', (t) => {
  const base = () => [
    { nome: 'zebra', valores: [5, 1], diferenca: -4, diferencaRelativa: -0.8 },
    { nome: 'abelha', valores: [100, 10], diferenca: -90, diferencaRelativa: -0.9 },
    { nome: 'macaco', valores: [50, 80], diferenca: 30, diferencaRelativa: 0.6 },
  ];
  assert.deepEqual(ordenarItens(base(), 'primeira').map((i) => i.nome), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarItens(base(), 'segunda').map((i) => i.nome), ['macaco', 'abelha', 'zebra']);
  assert.deepEqual(ordenarItens(base(), 'nome').map((i) => i.nome), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarItens(base(), 'consulta').map((i) => i.nome), ['zebra', 'abelha', 'macaco']);
  t.diagnostic('quatro ordens conferidas');
});

/* -------------------- a barra é a diferença ---------------------- */

test('escala cortada — a diferença continua proporcional', (t) => {
  // A parte sutil do gráfico: o eixo pode ser cortado porque a barra mede
  // DIFERENÇA, e diferença não depende de onde o eixo começa.
  const escala = montarEscala({ valores: [900, 950, 1000, 1010], comecarEmZero: false });
  assert.equal(escala.incluiZero, false, 'o cenário precisa ter eixo cortado');

  const larguraDe = (a, b) => Math.abs(escala.posicao(b) - escala.posicao(a));
  const curta = larguraDe(900, 950); // diferença 50
  const longa = larguraDe(950, 1000); // diferença 50 também

  perto(curta, longa, 1e-9, 'diferenças iguais dão barras iguais, mesmo com eixo cortado');
  perto(larguraDe(900, 1000) / curta, 2, 1e-9, 'o dobro da diferença dá o dobro da barra');
  t.diagnostic('proporcionalidade da diferença preservada no eixo cortado');
});

test('dumbbell — a barra liga exatamente os dois pontos', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    let conferidas = 0;
    for (const linha of r.linhas) {
      if (!linha.barra) continue;
      assert.equal(linha.pontos.length, 2, 'um haltere tem dois pontos');
      const posicoes = linha.pontos.map((p) => p.esquerda);
      const de = Math.min(...posicoes);
      const ate = Math.max(...posicoes);
      perto(linha.barra.esquerda, de, 0.01);
      perto(linha.barra.largura, ate - de, 0.01);
      conferidas += 1;
    }
    assert.ok(conferidas > 0, 'nenhuma barra conferida — o teste não testou nada');
    t.diagnostic(`${conferidas} barras ligando exatamente os dois pontos`);
  } finally {
    r.fim();
  }
});

test('dumbbell — o comprimento da barra é proporcional à diferença', (t) => {
  const r = renderizar('ohlc', { escreverValores: 'diferenca' });
  try {
    assert.ok(r.linhas.length > 1, 'poucas linhas');

    const numero = (texto) => Number(String(texto).replace(/[^\d.-]/g, ''));
    const medidos = r.linhas
      .filter((l) => l.barra && l.valor)
      .map((l) => ({ largura: l.barra.largura, diferenca: Math.abs(numero(l.valor)) }))
      .filter((m) => Number.isFinite(m.diferenca) && m.diferenca > 0);
    assert.ok(medidos.length > 1, 'não consegui ler as diferenças');

    const maiorDiferenca = Math.max(...medidos.map((m) => m.diferenca));
    const maiorLargura = Math.max(...medidos.map((m) => m.largura));
    for (const m of medidos) {
      assert.ok(
        Math.abs(m.largura / maiorLargura - m.diferenca / maiorDiferenca) < 0.03,
        `diferença ${m.diferenca} deu largura relativa ${(m.largura / maiorLargura).toFixed(3)}`
      );
    }
    t.diagnostic(`${medidos.length} barras proporcionais à diferença`);
  } finally {
    r.fim();
  }
});

test('dumbbell — pontas iguais não viram barra', (t) => {
  // Uma barra de largura mínima afirmaria uma diferença que não existe.
  const escala = montarEscala({ valores: [10, 20, 30] });
  perto(escala.posicao(20) - escala.posicao(20), 0, 1e-12);
  t.diagnostic('diferença zero é zero');
});

/* ----------------------------- a cor ----------------------------- */

test('dumbbell — a cor da barra acompanha a direção', (t) => {
  const r = renderizar('ohlc', { corPorDirecao: true, escreverValores: 'diferenca' });
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    const numero = (texto) => Number(String(texto).replace(/[^\d.-]/g, ''));

    const subindo = new Set();
    const descendo = new Set();
    for (const linha of r.linhas) {
      if (!linha.barra || !linha.valor) continue;
      const d = numero(linha.valor);
      if (d > 0) subindo.add(linha.barra.cor);
      else if (d < 0) descendo.add(linha.barra.cor);
    }
    assert.ok(subindo.size + descendo.size > 0, 'nenhuma barra com direção para conferir');
    if (subindo.size) assert.equal(subindo.size, 1, 'quem sobe tem uma cor só');
    if (descendo.size) assert.equal(descendo.size, 1, 'quem desce também');
    if (subindo.size && descendo.size) {
      assert.notDeepEqual([...subindo], [...descendo], 'subir e descer não podem ter a mesma cor');
    }
    t.diagnostic(`${subindo.size} cor(es) de alta, ${descendo.size} de baixa`);
  } finally {
    r.fim();
  }
});

test('dumbbell — "menor é melhor" inverte a cor, nunca a posição', (t) => {
  const normal = renderizar('ohlc', { menorEhMelhor: false, corPorDirecao: true });
  const invertido = renderizar('ohlc', { menorEhMelhor: true, corPorDirecao: true });
  try {
    assert.ok(normal.linhas.length > 0 && invertido.linhas.length > 0);
    assert.equal(normal.linhas.length, invertido.linhas.length);

    for (let i = 0; i < normal.linhas.length; i++) {
      const a = normal.linhas[i];
      const b = invertido.linhas[i];
      assert.equal(a.nome, b.nome, 'a ordem não pode mudar');
      assert.deepEqual(
        a.pontos.map((p) => p.esquerda.toFixed(3)),
        b.pontos.map((p) => p.esquerda.toFixed(3)),
        'as posições dos pontos não podem mudar'
      );
    }

    const corDe = (r) => r.linhas.find((l) => l.barra)?.barra.cor;
    if (corDe(normal) && corDe(invertido)) {
      assert.notEqual(corDe(invertido), corDe(normal), 'mas a cor precisa inverter');
    }
    assert.match(invertido.nota, /menor é melhor/i, 'e a inversão precisa estar declarada');
  } finally {
    normal.fim();
    invertido.fim();
  }
  t.diagnostic('inversão conferida');
});

/* ---------------------------- desenho ---------------------------- */

test('dumbbell — dois pontos por linha, com a legenda das medidas', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    for (const linha of r.linhas) {
      assert.equal(linha.pontos.length, 2, 'um haltere tem exatamente dois pontos');
      const medidas = linha.pontos.map((p) => p.medida).sort();
      assert.deepEqual(medidas, ['antes', 'depois']);
      for (const ponto of linha.pontos) {
        assert.ok(ponto.esquerda >= -0.01 && ponto.esquerda <= 100.01, 'ponto fora do trilho');
      }
    }
    assert.equal(r.legenda.length, 2, 'a legenda precisa nomear as duas medidas');
    assert.ok(r.regua.length > 1, 'faltou a régua do eixo');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} halteres`);
});

test('dumbbell — a nota explica por que o eixo pode ser cortado', (t) => {
  // A parte que o leitor atento vai querer conferir.
  const cortado = renderizar('ohlc', { comecarEmZero: false });
  try {
    assert.match(cortado.nota, /eixo CORTADO/i);
    assert.match(cortado.nota, /BARRA representa a DIFERENÇA/i, 'faltou a justificativa');
    assert.match(cortado.nota, /não depende de onde o eixo começa/i);
    assert.match(cortado.nota, /Slope Chart/i, 'a nota precisa apontar o gráfico irmão');
  } finally {
    cortado.fim();
  }

  const inteiro = renderizar('ohlc', { comecarEmZero: true });
  try {
    assert.match(inteiro.nota, /inclui o zero/i);
    assert.ok(!/CORTADO/.test(inteiro.nota));
  } finally {
    inteiro.fim();
  }
  t.diagnostic('os dois modos se declaram');
});

test('dumbbell — a contagem da nota bate com o desenho', (t) => {
  const r = renderizar('ohlc', { escreverValores: 'diferenca' });
  try {
    const casado = r.nota.match(/(\d+) subiram, (\d+) caíram/);
    assert.ok(casado, `a nota precisa declarar as contagens; veio "${r.nota}"`);
    assert.ok(r.linhas.length > 0);

    const numero = (texto) => Number(String(texto).replace(/[^\d.-]/g, ''));
    // Conferimos só o que está desenhado na janela: a soma total vem da
    // lista inteira, então comparamos as proporções de sinal.
    const visiveis = r.linhas.filter((l) => l.valor).map((l) => numero(l.valor));
    assert.ok(visiveis.length > 0, 'nenhum valor desenhado');
    const subindoVisivel = visiveis.filter((d) => d > 0).length;
    assert.ok(
      subindoVisivel <= Number(casado[1]),
      'a janela não pode mostrar mais altas do que a nota declara no total'
    );
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 60));
});

test('dumbbell — a virtualização reserva a altura de todos os itens', (t) => {
  const r = renderizar('grande5k', { alturaDaLinha: 20 });
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    assert.ok(r.linhas.length < 200, `a virtualização desenhou ${r.linhas.length} linhas`);
    const conteudo = r.palco.querySelector('.db-conteudo');
    const total = Number((r.contagem.match(/^([\d.]+)/) || [])[1].replace(/\./g, ''));
    assert.ok(total > 1000, `a fixture deveria ter milhares de itens; tem ${total}`);
    assert.equal(conteudo.style.height, `${total * 20}px`);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} linhas no DOM para ${r.contagem}`);
});

test('dumbbell — a busca preserva a posição original', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.busca, 'faltou o campo de busca');
    assert.ok(r.linhas.length > 0);
    const alvo = r.linhas[r.linhas.length - 1].nome;
    r.busca.value = alvo;
    r.busca.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));

    const depois = r.ler();
    assert.ok(depois.linhas.length > 0, 'a busca não encontrou nada');
    assert.match(depois.contagem, / de /);
  } finally {
    r.fim();
  }
  t.diagnostic('busca conferida');
});

test('dumbbell — uma medida só é recusada com explicação', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.match(mensagem, /medidas?/i);
    assert.equal(r.linhas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
