/**
 * barras_ranking_denso.test.mjs — testes das Barras de Ranking Denso.
 *
 * Duas promessas carregam o gráfico, e as duas são invisíveis quando
 * quebram:
 *
 * 1. **A barra começa em zero.** Uma base truncada faz 1.000 parecer o
 *    dobro de 950, e o desenho continua perfeitamente plausível.
 * 2. **A posição no ranking sobrevive à busca.** Renumerar o resultado
 *    filtrado é o comportamento padrão da maioria das tabelas — e faz o
 *    437º virar "o 1º".
 *
 * Mais a promessa técnica: a virtualização desenha pouco, mas a ALTURA
 * total do conteúdo precisa corresponder a TODOS os itens; senão a barra
 * de rolagem mente sobre quanto falta.
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
import { geometriaDaBarra, ordenarItens } from '../src/charts/barras_ranking_denso/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'barras_ranking_denso.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.barras_ranking_denso;
  assert.ok(definicao, 'barras_ranking_denso não se registrou');

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
    linhas: Array.from(palco.querySelectorAll('.br-linha')).map((el) => ({
      posicao: Number(el.dataset.posicao),
      nome: el.querySelector('.br-nome')?.textContent || '',
      esquerda: el.querySelector('.br-barra')?.style.left || '',
      largura: el.querySelector('.br-barra')?.style.width || '',
      valor: el.querySelector('.br-valor')?.textContent || '',
      topo: el.style.top,
    })),
    conteudo: palco.querySelector('.br-conteudo'),
    contagem: palco.querySelector('.br-contagem')?.textContent || '',
    nota: palco.querySelector('.br-nota')?.textContent || '',
    busca: palco.querySelector('.br-busca'),
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

const pct = (texto) => Number(String(texto).replace('%', ''));

/* --------------------------- geometria --------------------------- */

test('geometriaDaBarra — sem negativos, a barra sai do zero na borda', (t) => {
  const g = geometriaDaBarra({ valor: 50, maximo: 100, minimo: 10 });
  perto(g.posicaoDoZero, 0, 1e-12);
  perto(g.inicio, 0, 1e-12);
  perto(g.largura, 0.5, 1e-12);
  t.diagnostic('50 de 100 ocupa metade do trilho');
});

test('geometriaDaBarra — a proporção é a dos VALORES, não a do intervalo', (t) => {
  // Este é o teste da regra que não é opcional. Com valores entre 900 e
  // 1.000 e base truncada, 1.000 pareceria o dobro de 950. Começando em
  // zero, a diferença visual é de 5%, que é a diferença real.
  const noventaECinco = geometriaDaBarra({ valor: 950, maximo: 1000, minimo: 900 });
  const mil = geometriaDaBarra({ valor: 1000, maximo: 1000, minimo: 900 });

  perto(noventaECinco.largura / mil.largura, 0.95, 1e-12);
  assert.ok(
    noventaECinco.largura > 0.9,
    'com base em zero, 950 precisa ocupar quase todo o trilho (e não metade)'
  );
  t.diagnostic(
    `950 ocupa ${(noventaECinco.largura * 100).toFixed(1)}% e 1.000 ocupa ${(mil.largura * 100).toFixed(1)}%`
  );
});

test('geometriaDaBarra — com negativos, o zero vai para o meio', (t) => {
  const g = geometriaDaBarra({ valor: -50, maximo: 100, minimo: -100 });
  perto(g.posicaoDoZero, 0.5, 1e-12);
  perto(g.inicio, 0.25, 1e-12);
  perto(g.largura, 0.25, 1e-12);
  assert.equal(g.paraDireita, false);

  const positivo = geometriaDaBarra({ valor: 100, maximo: 100, minimo: -100 });
  perto(positivo.inicio, 0.5, 1e-12);
  perto(positivo.largura, 0.5, 1e-12);
  assert.equal(positivo.paraDireita, true);
  t.diagnostic('zero em 50% e barras crescendo para os dois lados');
});

test('geometriaDaBarra — valor zero não ocupa largura', (t) => {
  const g = geometriaDaBarra({ valor: 0, maximo: 100, minimo: 0 });
  perto(g.largura, 0, 1e-12);
  t.diagnostic('zero é zero');
});

test('ordenarItens — as três ordens fazem o que prometem', (t) => {
  const base = () => [
    { nome: 'a', valor: 5 },
    { nome: 'b', valor: 100 },
    { nome: 'c', valor: 50 },
  ];
  assert.deepEqual(ordenarItens(base(), 'desc').map((i) => i.nome), ['b', 'c', 'a']);
  assert.deepEqual(ordenarItens(base(), 'asc').map((i) => i.nome), ['a', 'c', 'b']);
  assert.deepEqual(ordenarItens(base(), 'consulta').map((i) => i.nome), ['a', 'b', 'c']);
  t.diagnostic('três ordens conferidas');
});

/* -------------------------- virtualização ------------------------ */

test('barras_ranking_denso — desenha poucas linhas mas reserva a altura de todas', (t) => {
  // Se a altura do conteúdo não corresponder a TODOS os itens, a barra de
  // rolagem mente sobre quanto falta e metade da lista fica inalcançável.
  const r = renderizar('grande5k', { alturaDaLinha: 20 });
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha desenhada');
    assert.ok(
      r.linhas.length < 200,
      `a virtualização deveria desenhar poucas linhas; desenhou ${r.linhas.length}`
    );

    const totalDeItens = Number((r.contagem.match(/^([\d.]+)/) || [])[1].replace(/\./g, ''));
    assert.ok(totalDeItens > 1000, `a fixture deveria ter milhares de itens; tem ${totalDeItens}`);
    assert.equal(
      r.conteudo.style.height,
      `${totalDeItens * 20}px`,
      'a altura reservada precisa corresponder a TODOS os itens'
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} linhas no DOM para ${r.contagem}`);
});

test('barras_ranking_denso — as linhas visíveis ficam em sequência, sem buracos', (t) => {
  const r = renderizar('grande5k', { alturaDaLinha: 20 });
  try {
    assert.ok(r.linhas.length > 1, 'poucas linhas para conferir a sequência');
    for (let i = 1; i < r.linhas.length; i++) {
      assert.equal(
        r.linhas[i].posicao,
        r.linhas[i - 1].posicao + 1,
        `buraco entre as posições ${r.linhas[i - 1].posicao} e ${r.linhas[i].posicao}`
      );
      assert.equal(
        Number(r.linhas[i].topo.replace('px', '')) -
          Number(r.linhas[i - 1].topo.replace('px', '')),
        20,
        'as linhas precisam estar espaçadas pela própria altura'
      );
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} linhas em sequência`);
});

/* ---------------------------- ranking ---------------------------- */

test('barras_ranking_denso — ordena e numera a partir de 1', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    assert.equal(r.linhas[0].posicao, 1, 'a primeira linha é a posição 1');

    // A primeira barra é a maior: largura 100%.
    perto(pct(r.linhas[0].largura), 100, 0.01);
    for (let i = 1; i < r.linhas.length; i++) {
      assert.ok(
        pct(r.linhas[i].largura) <= pct(r.linhas[i - 1].largura) + 1e-9,
        `a barra ${i} é maior que a anterior num ranking decrescente`
      );
    }
  } finally {
    r.fim();
  }
  t.diagnostic('ranking decrescente conferido');
});

test('barras_ranking_denso — a busca preserva a POSIÇÃO original', (t) => {
  // A mentira que este teste impede: renumerar o resultado filtrado faria
  // o 437º aparecer como "1".
  const r = renderizar('grande5k');
  try {
    assert.ok(r.busca, 'faltou o campo de busca');
    assert.ok(r.linhas.length > 0);

    // Busca por um nome que certamente não é o primeiro do ranking.
    const alvo = r.linhas[r.linhas.length - 1].nome;
    r.busca.value = alvo;
    r.busca.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));

    const depois = r.ler();
    assert.ok(depois.linhas.length > 0, 'a busca não encontrou nada');
    assert.ok(
      depois.linhas.some((l) => l.posicao > 1),
      'ao menos um resultado deveria manter uma posição diferente de 1'
    );
    for (const linha of depois.linhas) {
      assert.ok(linha.posicao >= 1, 'posição inválida');
    }
    assert.match(depois.contagem, / de /, 'a contagem precisa mostrar "N de M"');
    t.diagnostic(`buscando "${alvo}": ${depois.contagem}, posições ${depois.linhas.map((l) => l.posicao).join(',')}`);
  } finally {
    r.fim();
  }
});

test('barras_ranking_denso — busca sem resultado explica, não fica em branco', (t) => {
  const r = renderizar('grande5k');
  try {
    r.busca.value = 'zzzzz-nada-disso-existe';
    r.busca.dispatchEvent(new r.amb.window.Event('input', { bubbles: true }));

    const depois = r.ler();
    assert.equal(depois.contagem.startsWith('0 de'), true, `contagem inesperada: "${depois.contagem}"`);
    assert.match(
      r.palco.querySelector('.br-conteudo').textContent,
      /Nenhum item encontrado/i,
      'a lista vazia precisa dizer por quê'
    );
  } finally {
    r.fim();
  }
  t.diagnostic('busca sem resultado explicada');
});

test('barras_ranking_denso — a nota declara a regra do zero', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.match(r.nota, /a partir do ZERO/i, 'a regra precisa estar declarada');
    assert.match(r.nota, /não muda com a busca/i, 'e a da posição também');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 90));
});

test('barras_ranking_denso — sem negativos, toda barra sai da borda esquerda', (t) => {
  // Nenhuma fixture da biblioteca tem medida negativa, então o caso "zero
  // no meio" é testado na geometria pura (acima), onde é exato. O que dá
  // para exigir aqui é o outro lado: sem negativos, nenhuma barra pode
  // começar deslocada, e o aviso de escala simétrica NÃO pode aparecer.
  const r = renderizar('grande5k');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    for (const linha of r.linhas) {
      assert.ok(
        pct(linha.esquerda) < 0.01,
        `barra começando em ${linha.esquerda} sem haver valores negativos`
      );
    }
    assert.ok(
      !/zero no meio/i.test(r.nota),
      `a nota anunciou escala simétrica sem negativos: "${r.nota}"`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} barras saindo da borda`);
});

test('barras_ranking_denso — rótulos longos não quebram a linha', (t) => {
  const r = renderizar('rotulosLongos');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    for (const linha of r.linhas) {
      assert.ok(linha.nome.length <= 60, `nome não truncado: ${linha.nome.length} caracteres`);
      assert.ok(linha.valor.length > 0, 'faltou o valor da barra');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} linhas com rótulos longos`);
});

test('barras_ranking_denso — consulta sem medida numérica explica', (t) => {
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
