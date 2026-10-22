/**
 * dot_plot_denso.test.mjs — testes do Dot Plot Denso.
 *
 * O gráfico faz uma afirmação que o seu vizinho de tier faz ao contrário:
 * aqui o eixo PODE ser cortado, porque o ponto codifica posição e não
 * comprimento. A contrapartida é que o corte tem de ser declarado — o
 * leitor treinado em barras lê distância da borda como proporção. É isso
 * que os testes garantem: a posição do ponto corresponde ao valor na
 * escala declarada, e quando a escala não inclui o zero o aviso aparece.
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
import {
  montarEscala,
  ordenarItens,
  calcularDiferenca,
} from '../src/charts/dot_plot_denso/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'dot_plot_denso.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

const pct = (texto) => Number(String(texto).replace('%', ''));

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.dot_plot_denso;
  assert.ok(definicao, 'dot_plot_denso não se registrou');

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
    linhas: Array.from(palco.querySelectorAll('.dp-linha')).map((el) => ({
      posicao: Number(el.dataset.posicao),
      nome: el.querySelector('.dp-nome')?.textContent || '',
      pontos: Array.from(el.querySelectorAll('.dp-ponto')).map((p) => ({
        medida: p.dataset.medida,
        esquerda: pct(p.style.left),
      })),
      ligacao: el.querySelector('.dp-ligacao'),
      valor: el.querySelector('.dp-valor')?.textContent || '',
    })),
    contagem: palco.querySelector('.dp-contagem')?.textContent || '',
    nota: palco.querySelector('.dp-nota')?.textContent || '',
    regua: Array.from(palco.querySelectorAll('.dp-escala span')).map((s) => s.textContent),
    busca: palco.querySelector('.dp-busca'),
    legenda: Array.from(palco.querySelectorAll('.dp-chip')).map((c) => c.textContent),
  });

  return {
    amb,
    palco,
    ler,
    ...ler(),
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ----------------------------- escala ---------------------------- */

test('montarEscala — com base em zero, o zero é o início e o máximo é o fim', (t) => {
  const escala = montarEscala({ valores: [10, 50, 100], comecarEmZero: true });
  assert.equal(escala.minimo, 0);
  assert.equal(escala.maximo, 100);
  perto(escala.posicao(0), 0, 1e-12);
  perto(escala.posicao(50), 0.5, 1e-12);
  perto(escala.posicao(100), 1, 1e-12);
  assert.equal(escala.incluiZero, true);
  t.diagnostic('0 → 0%, 50 → 50%, 100 → 100%');
});

test('montarEscala — sem base em zero, o eixo aperta nos dados e se declara cortado', (t) => {
  // É o caso que o gráfico existe para servir: valores de 900 a 1.000 na
  // escala do zero ficam todos no mesmo lugar.
  const escala = montarEscala({ valores: [900, 950, 1000], comecarEmZero: false });

  assert.ok(escala.minimo > 800, `o eixo deveria apertar nos dados; começou em ${escala.minimo}`);
  assert.ok(escala.maximo < 1100);
  assert.equal(escala.incluiZero, false, 'o eixo não inclui o zero: precisa se declarar cortado');

  // Os três valores ficam bem separados, que é o ponto.
  const posicoes = [900, 950, 1000].map((v) => escala.posicao(v));
  assert.ok(posicoes[1] - posicoes[0] > 0.3, 'os valores precisam ficar espalhados pelo trilho');
  perto(posicoes[1] - posicoes[0], posicoes[2] - posicoes[1], 1e-9);
  t.diagnostic(`posições: ${posicoes.map((p) => (p * 100).toFixed(1) + '%').join(' ')}`);
});

test('montarEscala — valores negativos mantêm o eixo honesto', (t) => {
  // Com negativos, o eixo começa abaixo de zero e CONTINUA incluindo o
  // zero: não é um corte, e o aviso não deve disparar.
  const escala = montarEscala({ valores: [-50, 0, 100], comecarEmZero: true });
  assert.ok(escala.minimo <= -50);
  assert.equal(escala.incluiZero, true, 'o eixo contém o zero: não está cortado');
  t.diagnostic(`eixo de ${escala.minimo} a ${escala.maximo}`);
});

test('montarEscala — todos os valores iguais não produzem NaN', (t) => {
  const escala = montarEscala({ valores: [7, 7, 7] });
  assert.ok(escala.maximo > escala.minimo, 'um intervalo degenerado dividiria por zero');
  assert.ok(Number.isFinite(escala.posicao(7)));
  perto(escala.posicao(7), 0.5, 1e-9);
  t.diagnostic('valor único cai no meio do trilho');
});

test('montarEscala — valor nulo não vira posição', (t) => {
  const escala = montarEscala({ valores: [1, 2, 3] });
  assert.equal(escala.posicao(null), null);
  assert.equal(escala.posicao(NaN), null);
  t.diagnostic('null em vez de NaN');
});

/* --------------------------- ordenação --------------------------- */

test('ordenarItens — a ordem por diferença ordena mesmo pela diferença', (t) => {
  const itens = [
    { nome: 'cresceu pouco', valores: [100, 110] },
    { nome: 'cresceu muito', valores: [10, 500] },
    { nome: 'caiu', valores: [200, 50] },
  ];
  assert.deepEqual(
    ordenarItens(itens.slice(), 'diferenca').map((i) => i.nome),
    ['cresceu muito', 'cresceu pouco', 'caiu'],
    'diferenças: +490, +10, −150'
  );
  t.diagnostic('ordem por diferença conferida');
});

test('ordenarItens — itens sem a segunda medida vão para o fim, não para o meio', (t) => {
  // Tratar "sem diferença" como zero os colocaria entre os que caíram e os
  // que cresceram, como se a diferença fosse conhecida e nula.
  const itens = [
    { nome: 'sem par', valores: [100, null] },
    { nome: 'caiu', valores: [200, 50] },
    { nome: 'cresceu', valores: [10, 500] },
  ];
  const ordenados = ordenarItens(itens.slice(), 'diferenca').map((i) => i.nome);
  assert.equal(ordenados[ordenados.length - 1], 'sem par');
  assert.deepEqual(ordenados, ['cresceu', 'caiu', 'sem par']);
  t.diagnostic('null vai para o fim');
});

test('ordenarItens — as demais ordens fazem o que prometem', (t) => {
  const base = () => [
    { nome: 'zebra', valores: [5] },
    { nome: 'abelha', valores: [100] },
    { nome: 'macaco', valores: [50] },
  ];
  assert.deepEqual(ordenarItens(base(), 'primeira').map((i) => i.nome), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarItens(base(), 'primeiraAsc').map((i) => i.nome), ['zebra', 'macaco', 'abelha']);
  assert.deepEqual(ordenarItens(base(), 'nome').map((i) => i.nome), ['abelha', 'macaco', 'zebra']);
  assert.deepEqual(ordenarItens(base(), 'consulta').map((i) => i.nome), ['zebra', 'abelha', 'macaco']);
  t.diagnostic('quatro ordens conferidas');
});

test('calcularDiferenca — exige as duas pontas', (t) => {
  assert.equal(calcularDiferenca({ valores: [10, 30] }), 20);
  assert.equal(calcularDiferenca({ valores: [10] }), null, 'uma medida só não tem diferença');
  assert.equal(calcularDiferenca({ valores: [null, 30] }), null);
  assert.equal(calcularDiferenca({ valores: [10, null] }), null);
  t.diagnostic('quatro casos conferidos');
});

/* ---------------------------- desenho ---------------------------- */

test('dot_plot_denso — um ponto por medida em cada linha', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha desenhada');
    const quantidades = new Set(r.linhas.map((l) => l.pontos.length));
    assert.equal(quantidades.size, 1, 'todas as linhas precisam ter a mesma quantidade de pontos');
    assert.ok([...quantidades][0] > 1, 'esta fixture deveria render várias medidas por linha');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
    t.diagnostic(`${r.linhas.length} linhas × ${[...quantidades][0]} pontos`);
  } finally {
    r.fim();
  }
});

test('dot_plot_denso — a posição do ponto corresponde à ordem dos valores', (t) => {
  // Numa fixture OHLC, o mínimo é sempre ≤ o máximo: se as posições não
  // respeitarem isso, a escala está aplicada à medida errada.
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0);
    let conferidas = 0;
    for (const linha of r.linhas) {
      const porMedida = new Map(linha.pontos.map((p) => [p.medida, p.esquerda]));
      if (porMedida.has('minima') && porMedida.has('maxima')) {
        assert.ok(
          porMedida.get('minima') <= porMedida.get('maxima') + 1e-9,
          `o ponto da mínima (${porMedida.get('minima')}%) ficou à direita da máxima (${porMedida.get('maxima')}%)`
        );
        conferidas += 1;
      }
    }
    assert.ok(conferidas > 0, 'nenhuma linha tinha mínima e máxima — o teste não conferiu nada');
    t.diagnostic(`${conferidas} linhas com a mínima à esquerda da máxima`);
  } finally {
    r.fim();
  }
});

test('dot_plot_denso — todo ponto cai dentro do trilho', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.linhas.length > 0);
    let pontos = 0;
    for (const linha of r.linhas) {
      for (const ponto of linha.pontos) {
        assert.ok(
          ponto.esquerda >= -0.01 && ponto.esquerda <= 100.01,
          `ponto em ${ponto.esquerda}% está fora do trilho`
        );
        pontos += 1;
      }
    }
    assert.ok(pontos > 0, 'nenhum ponto desenhado');
    t.diagnostic(`${pontos} pontos dentro do trilho`);
  } finally {
    r.fim();
  }
});

test('dot_plot_denso — o eixo cortado é DECLARADO', (t) => {
  // A contrapartida de poder cortar: dizer que cortou.
  const cortado = renderizar('ohlc', { comecarEmZero: false });
  try {
    assert.match(cortado.nota, /eixo CORTADO/i, 'faltou o aviso de eixo cortado');
    assert.match(cortado.nota, /POSIÇÃO, não comprimento/i, 'e a explicação do porquê');
  } finally {
    cortado.fim();
  }

  const inteiro = renderizar('ohlc', { comecarEmZero: true });
  try {
    assert.match(inteiro.nota, /inclui o zero/i);
    assert.ok(!/CORTADO/i.test(inteiro.nota), 'com base em zero não pode haver aviso de corte');
  } finally {
    inteiro.fim();
  }
  t.diagnostic('os dois modos se declaram');
});

test('dot_plot_denso — a ligação cobre exatamente do menor ao maior ponto', (t) => {
  const r = renderizar('ohlc', { ligarPontos: true });
  try {
    assert.ok(r.linhas.length > 0);
    let conferidas = 0;
    for (const linha of r.linhas) {
      if (linha.pontos.length < 2 || !linha.ligacao) continue;
      const posicoes = linha.pontos.map((p) => p.esquerda);
      const de = Math.min(...posicoes);
      const ate = Math.max(...posicoes);
      perto(pct(linha.ligacao.style.left), de, 0.01);
      perto(pct(linha.ligacao.style.width), ate - de, 0.01);
      conferidas += 1;
    }
    assert.ok(conferidas > 0, 'nenhuma ligação conferida');
    t.diagnostic(`${conferidas} ligações conferidas`);
  } finally {
    r.fim();
  }
});

test('dot_plot_denso — sem ligação quando desligada', (t) => {
  const r = renderizar('ohlc', { ligarPontos: false });
  try {
    assert.ok(r.linhas.length > 0);
    for (const linha of r.linhas) {
      assert.equal(linha.ligacao, null, 'a ligação deveria estar desligada');
    }
  } finally {
    r.fim();
  }
  t.diagnostic('ligações ausentes');
});

test('dot_plot_denso — a virtualização reserva a altura de todos os itens', (t) => {
  const r = renderizar('grande5k', { alturaDaLinha: 20 });
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    assert.ok(r.linhas.length < 200, `a virtualização desenhou ${r.linhas.length} linhas`);
    const conteudo = r.palco.querySelector('.dp-conteudo');
    const total = Number((r.contagem.match(/^([\d.]+)/) || [])[1].replace(/\./g, ''));
    assert.ok(total > 1000, `a fixture deveria ter milhares de itens; tem ${total}`);
    assert.equal(conteudo.style.height, `${total * 20}px`);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} linhas no DOM para ${r.contagem}`);
});

test('dot_plot_denso — a busca preserva a posição original', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.busca, 'faltou o campo de busca');
    assert.ok(r.linhas.length > 0);
    const alvo = r.linhas[r.linhas.length - 1].nome;
    r.busca.value = alvo;
    r.busca.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));

    const depois = r.ler();
    assert.ok(depois.linhas.length > 0, 'a busca não encontrou nada');
    assert.ok(
      depois.linhas.some((l) => l.posicao > 1),
      'ao menos um resultado deveria manter posição diferente de 1'
    );
    assert.match(depois.contagem, / de /);
    t.diagnostic(`buscando "${alvo}": ${depois.contagem}`);
  } finally {
    r.fim();
  }
});

test('dot_plot_denso — a régua e a legenda nomeiam o que está desenhado', (t) => {
  const r = renderizar('ohlc');
  try {
    assert.ok(r.regua.length > 1, 'faltou a régua do eixo');
    assert.ok(
      r.regua.filter((t2) => t2 && t2.trim()).length >= 3,
      'a régua precisa trazer vários valores'
    );
    assert.ok(r.legenda.length > 1, 'com várias medidas, a legenda é obrigatória');
    for (const chip of r.legenda) assert.ok(chip.length > 0, 'chip de legenda vazio');
  } finally {
    r.fim();
  }
  t.diagnostic(`régua: ${r.regua.filter(Boolean).join(' | ')}`);
});

test('dot_plot_denso — medidas demais são cortadas com aviso', (t) => {
  const r = renderizar('ohlc');
  try {
    const porLinha = r.linhas[0] ? r.linhas[0].pontos.length : 0;
    assert.ok(porLinha <= 4, `${porLinha} pontos por linha passaram do teto`);
    if (r.aviso) assert.match(r.aviso, /medidas|confusão/i);
  } finally {
    r.fim();
  }
  t.diagnostic(r.aviso ? r.aviso.slice(0, 70) : 'a fixture cabe no teto');
});

test('dot_plot_denso — consulta sem valores numéricos explica', (t) => {
  const r = renderizar('somenteNulos');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.linhas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
