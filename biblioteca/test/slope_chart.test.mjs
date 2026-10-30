/**
 * slope_chart.test.mjs — testes do Slope Chart.
 *
 * Duas promessas:
 *
 * 1. **A inclinação É a variação.** Diferente do bump chart, aqui o eixo é
 *    o valor — se a geometria não corresponder, o gráfico mostra uma
 *    mudança que não aconteceu, com a mesma aparência de uma que
 *    aconteceu.
 * 2. **A anti-colisão preserva a ORDEM.** Empurrar um rótulo para o espaço
 *    livre mais próximo pode trocar dois nomes de lugar, e aí o leitor
 *    liga o nome à linha errada sem ter como perceber — erro pior do que
 *    a sobreposição que se queria resolver.
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
import { resolverColisoes } from '../src/charts/slope_chart/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'slope_chart.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.slope_chart;
  assert.ok(definicao, 'slope_chart não se registrou');

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

  // As linhas dos itens são as que ligam dois x diferentes; as verticais
  // são os eixos dos períodos.
  const todas = Array.from(palco.querySelectorAll('line.sl-linha'));
  const inclinadas = todas.filter(
    (l) => l.getAttribute('x1') !== l.getAttribute('x2')
  );

  return {
    amb,
    palco,
    linhas: inclinadas.map((l) => ({
      x1: Number(l.getAttribute('x1')),
      y1: Number(l.getAttribute('y1')),
      x2: Number(l.getAttribute('x2')),
      y2: Number(l.getAttribute('y2')),
      cor: l.getAttribute('stroke'),
    })),
    eixos: todas.filter((l) => l.getAttribute('x1') === l.getAttribute('x2')),
    pontos: Array.from(palco.querySelectorAll('.bl-marcador.sl-ponto')),
    rotulos: Array.from(palco.querySelectorAll('.sl-rotulo')).map((t) => ({
      texto: t.textContent,
      x: Number(t.getAttribute('x')),
      y: Number(t.getAttribute('y')),
    })),
    cabecalhos: Array.from(palco.querySelectorAll('.sl-cabecalho')).map((t) => t.textContent),
    nota: palco.querySelector('.sl-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ------------------------- anti-colisão -------------------------- */

test('resolverColisoes — separa os rótulos sem trocar a ordem', (t) => {
  // Cinco rótulos empilhados no mesmo ponto: o resultado tem de ser cinco
  // posições distintas, espaçadas, e na mesma sequência.
  const ajustadas = resolverColisoes([100, 100, 100, 100, 100], 12, { cima: 0, baixo: 500 });

  assert.equal(ajustadas.length, 5);
  for (let i = 1; i < ajustadas.length; i++) {
    assert.ok(
      ajustadas[i] - ajustadas[i - 1] >= 12 - 1e-9,
      `rótulos ${i - 1} e ${i} ficaram a ${(ajustadas[i] - ajustadas[i - 1]).toFixed(2)}px`
    );
  }
  t.diagnostic(`posições: ${ajustadas.map((y) => y.toFixed(0)).join(' ')}`);
});

test('resolverColisoes — a ordem NUNCA é trocada, nem sob pressão', (t) => {
  // O ponto do algoritmo. Com rótulos quase fora da área e pouco espaço,
  // um algoritmo de "espaço livre mais próximo" trocaria dois de lugar.
  const entradas = [
    [10, 11, 12, 13, 14, 300, 301, 302],
    [480, 485, 490, 495, 499],
    [0, 0, 0, 250, 500, 500, 500],
  ];
  for (const posicoes of entradas) {
    const ajustadas = resolverColisoes(posicoes, 14, { cima: 0, baixo: 500 });
    assert.equal(ajustadas.length, posicoes.length);
    for (let i = 1; i < ajustadas.length; i++) {
      assert.ok(
        ajustadas[i] >= ajustadas[i - 1],
        `a ordem foi trocada entre ${i - 1} e ${i} em [${posicoes.join(',')}]`
      );
    }
  }
  t.diagnostic('três cenários apertados, ordem preservada em todos');
});

test('resolverColisoes — respeita os limites quando há espaço', (t) => {
  const ajustadas = resolverColisoes([490, 495, 499], 14, { cima: 0, baixo: 500 });
  assert.ok(ajustadas.length > 0);
  for (const y of ajustadas) {
    assert.ok(y >= -1e-9 && y <= 500 + 1e-9, `rótulo em ${y} saiu dos limites`);
  }
  assert.ok(ajustadas[2] <= 500, 'o último precisa caber no rodapé');
  t.diagnostic(`posições: ${ajustadas.map((y) => y.toFixed(0)).join(' ')}`);
});

test('resolverColisoes — quem já cabe não é movido', (t) => {
  // Mexer sem necessidade afastaria o rótulo da sua linha.
  const originais = [50, 100, 150, 200];
  const ajustadas = resolverColisoes(originais, 20, { cima: 0, baixo: 500 });
  assert.deepEqual(ajustadas, originais);
  t.diagnostic('posições folgadas preservadas');
});

test('resolverColisoes — lista vazia não quebra', (t) => {
  assert.deepEqual(resolverColisoes([], 12, { cima: 0, baixo: 100 }), []);
  t.diagnostic('caso vazio tratado');
});

/* ---------------------------- desenho ---------------------------- */

test('slope_chart — uma linha e dois pontos por item', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha desenhada');
    assert.equal(r.pontos.length, r.linhas.length * 2, 'cada linha tem duas pontas');
    assert.equal(r.eixos.length, 2, 'dois eixos verticais, um por período');
    assert.equal(r.cabecalhos.length, 2, 'dois cabeçalhos de período');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.linhas.length} itens`);
});

test('slope_chart — todas as linhas ligam os MESMOS dois x', (t) => {
  // Uma linha que começasse em outro x não estaria comparando os mesmos
  // dois períodos que as demais.
  const r = renderizar('comPivo');
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    const esquerdas = new Set(r.linhas.map((l) => l.x1.toFixed(2)));
    const direitas = new Set(r.linhas.map((l) => l.x2.toFixed(2)));
    assert.equal(esquerdas.size, 1, 'todas as linhas saem do mesmo x');
    assert.equal(direitas.size, 1, 'e chegam ao mesmo x');
    assert.ok(Number([...direitas][0]) > Number([...esquerdas][0]), 'o segundo período fica à direita');
  } finally {
    r.fim();
  }
  t.diagnostic('geometria das pontas conferida');
});

test('slope_chart — a direção da linha corresponde à direção da cor', (t) => {
  // Com cor por direção, uma linha que sobe tem de ter a cor de alta. Se
  // a cor e a geometria discordassem, metade dos leitores leria uma e
  // metade leria a outra.
  const r = renderizar('comPivo', { corPorDirecao: true });
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma linha');
    const subindo = r.linhas.filter((l) => l.y2 < l.y1 - 0.5);
    const descendo = r.linhas.filter((l) => l.y2 > l.y1 + 0.5);
    assert.ok(subindo.length + descendo.length > 0, 'nenhuma linha com inclinação para conferir');

    const coresDeAlta = new Set(subindo.map((l) => l.cor));
    const coresDeBaixa = new Set(descendo.map((l) => l.cor));
    if (subindo.length) assert.equal(coresDeAlta.size, 1, 'quem sobe precisa ter uma cor só');
    if (descendo.length) assert.equal(coresDeBaixa.size, 1, 'quem desce também');
    if (subindo.length && descendo.length) {
      assert.notDeepEqual([...coresDeAlta], [...coresDeBaixa], 'subir e descer não podem ter a mesma cor');
    }
    t.diagnostic(`${subindo.length} subiram, ${descendo.length} caíram`);
  } finally {
    r.fim();
  }
});

test('slope_chart — a altura corresponde ao VALOR, não à posição', (t) => {
  // A diferença estrutural para o bump chart. Como os rótulos trazem o
  // valor, dá para conferir ponta a ponta: ordenando os rótulos de um lado
  // pela altura, os valores precisam sair em ordem decrescente (y cresce
  // para baixo). Se o eixo fosse o ranking, dois valores muito diferentes
  // ficariam igualmente espaçados — e aqui não ficam.
  const numero = (texto) => {
    const limpo = texto.replace(/,/g, '').match(/-?\d+(?:\.\d+)?\s*$/);
    return limpo ? Number(limpo[0]) : null;
  };

  const r = renderizar('comPivo', { escreverValores: true });
  try {
    assert.ok(r.rotulos.length > 0, 'nenhum rótulo');

    const porLado = new Map();
    for (const rotulo of r.rotulos) {
      const chave = rotulo.x.toFixed(2);
      if (!porLado.has(chave)) porLado.set(chave, []);
      porLado.get(chave).push(rotulo);
    }
    assert.equal(porLado.size, 2);

    let conferidos = 0;
    for (const [x, lista] of porLado) {
      const comValor = lista
        .map((l) => ({ y: l.y, valor: numero(l.texto) }))
        .filter((l) => l.valor !== null);
      assert.ok(comValor.length > 1, `lado ${x}: não consegui ler valores dos rótulos`);

      comValor.sort((a, b) => a.y - b.y);
      for (let i = 1; i < comValor.length; i++) {
        assert.ok(
          comValor[i].valor <= comValor[i - 1].valor + 1e-9,
          `lado ${x}: o rótulo mais abaixo (${comValor[i].valor}) tem valor MAIOR que o de cima (${comValor[i - 1].valor})`
        );
      }
      conferidos += comValor.length;
    }
    assert.ok(conferidos > 0, 'nenhum valor conferido');
    t.diagnostic(`${conferidos} rótulos em ordem de valor`);
  } finally {
    r.fim();
  }
});

test('slope_chart — a contagem da nota bate com o desenho', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.linhas.length > 0);
    const casado = r.nota.match(/(\d+) subiram, (\d+) caíram/);
    assert.ok(casado, `a nota precisa declarar as contagens; veio "${r.nota}"`);

    const subindo = r.linhas.filter((l) => l.y2 < l.y1 - 0.5).length;
    const descendo = r.linhas.filter((l) => l.y2 > l.y1 + 0.5).length;
    assert.equal(Number(casado[1]), subindo, 'a nota diz um número de altas e o desenho mostra outro');
    assert.equal(Number(casado[2]), descendo, 'o mesmo para as baixas');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 70));
});

test('slope_chart — os rótulos não se sobrepõem e mantêm a ordem das linhas', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.rotulos.length > 0, 'nenhum rótulo');

    // Um grupo por lado (x distinto).
    const porLado = new Map();
    for (const rotulo of r.rotulos) {
      const chave = rotulo.x.toFixed(2);
      if (!porLado.has(chave)) porLado.set(chave, []);
      porLado.get(chave).push(rotulo);
    }
    assert.equal(porLado.size, 2, 'os rótulos deveriam estar em dois lados');

    for (const [x, lista] of porLado) {
      const ys = lista.map((l) => l.y).sort((a, b) => a - b);
      assert.ok(ys.length > 1, `lado ${x}: poucos rótulos para conferir`);
      for (let i = 1; i < ys.length; i++) {
        assert.ok(
          ys[i] - ys[i - 1] >= 9,
          `lado ${x}: rótulos a ${(ys[i] - ys[i - 1]).toFixed(1)}px um do outro`
        );
      }
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.rotulos.length} rótulos separados`);
});

test('slope_chart — a nota declara o corte do eixo e aponta o Bump Chart', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.match(r.nota, /eixo/i, 'o estado do eixo precisa estar declarado');
    assert.match(r.nota, /Bump Chart/i, 'a nota precisa apontar o gráfico da outra pergunta');
    assert.match(r.nota, /variação medida em/i);
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(-90));
});

test('slope_chart — com mais de dois períodos, o gráfico diz o que ignorou', (t) => {
  // O slope some com tudo que está no meio. Não dizer isso faria o leitor
  // supor um caminho que o gráfico não mostrou.
  const r = renderizar('comPivo');
  try {
    if (/do meio não aparecem/.test(r.nota)) {
      assert.match(r.nota, /PRIMEIRO e o ÚLTIMO/);
      t.diagnostic('omissão dos períodos do meio declarada');
    } else {
      t.diagnostic('a fixture tinha exatamente dois períodos');
    }
  } finally {
    r.fim();
  }
});

test('slope_chart — destacar as maiores variações apaga as demais', (t) => {
  const todas = renderizar('comPivo', { destacarMaiores: 0 });
  const poucas = renderizar('comPivo', { destacarMaiores: 2 });
  try {
    assert.ok(todas.linhas.length > 2, 'poucas linhas para o teste');
    assert.equal(poucas.linhas.length, todas.linhas.length, 'nenhuma linha some: elas são apagadas');

    const opacidades = Array.from(poucas.palco.querySelectorAll('line.sl-linha'))
      .filter((l) => l.getAttribute('x1') !== l.getAttribute('x2'))
      .map((l) => Number(l.getAttribute('opacity')));
    assert.ok(opacidades.length > 0);
    const destacadas = opacidades.filter((o) => o > 0.5).length;
    assert.equal(destacadas, 2, `esperadas 2 linhas em destaque, vieram ${destacadas}`);
  } finally {
    todas.fim();
    poucas.fim();
  }
  t.diagnostic('destaque das maiores variações conferido');
});

test('slope_chart — consulta sem dois períodos explica', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.linhas.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
