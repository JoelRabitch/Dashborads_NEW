/**
 * small_multiples.test.mjs — testes do Small Multiples.
 *
 * O teste central é a **escala compartilhada**. Com escalas independentes,
 * uma série que varia de 2 a 3 ocupa a mesma altura da que varia de 2 a
 * 3.000: os painéis ficam todos igualmente dramáticos e a comparação —
 * única razão de existir do gráfico — vira impossível, sem que nada na
 * tela denuncie. Então medimos a propriedade diretamente: **o mesmo valor
 * em painéis diferentes cai na mesma altura relativa**; com escala livre,
 * não cai.
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
import { montarGrade, ordenarSeries } from '../src/charts/small_multiples/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'small_multiples.js');

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.small_multiples;
  assert.ok(definicao, 'small_multiples não se registrou');

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

  return {
    amb,
    palco,
    paineis: Array.from(palco.querySelectorAll('rect.sm-painel')).map((r) => ({
      x: Number(r.getAttribute('x')),
      y: Number(r.getAttribute('y')),
      largura: Number(r.getAttribute('width')),
      altura: Number(r.getAttribute('height')),
    })),
    linhas: Array.from(palco.querySelectorAll('path.sm-linha')),
    marcas: Array.from(palco.querySelectorAll('.sm-marca')),
    titulos: Array.from(palco.querySelectorAll('.sm-titulo')).map((t) => t.textContent),
    valores: Array.from(palco.querySelectorAll('.sm-valor')).map((t) => t.textContent),
    nota: palco.querySelector('.sm-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/** Coordenadas Y de um caminho SVG (os números de índice ímpar). */
function coordenadasY(caminho) {
  const numeros = (caminho.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  return numeros.filter((_, i) => i % 2 === 1);
}

/* ----------------------------- grade ----------------------------- */

test('montarGrade — todos os painéis cabem, sem sobrar nem faltar fileira', (t) => {
  for (const n of [1, 2, 3, 5, 7, 12, 25, 60]) {
    const grade = montarGrade({ quantidade: n, largura: 900, altura: 560 });
    assert.ok(
      grade.colunas * grade.linhas >= n,
      `${n} painéis não cabem em ${grade.colunas} × ${grade.linhas}`
    );
    assert.ok(
      grade.colunas * (grade.linhas - 1) < n,
      `${n} painéis em ${grade.colunas} × ${grade.linhas}: sobra uma fileira inteira vazia`
    );
    assert.ok(grade.ladoX > 0 && grade.ladoY > 0, `${n}: painel sem tamanho`);
  }
  t.diagnostic('oito quantidades conferidas');
});

test('montarGrade — a proporção da tela é levada em conta', (t) => {
  // `ceil(sqrt(n))` sozinho daria 3 colunas para 9 painéis em QUALQUER
  // tela. Numa tela larga e baixa, isso produz painéis altos e magros.
  const larga = montarGrade({ quantidade: 9, largura: 1600, altura: 300 });
  const alta = montarGrade({ quantidade: 9, largura: 300, altura: 1600 });

  assert.ok(
    larga.colunas > alta.colunas,
    `tela larga deveria usar mais colunas: ${larga.colunas} contra ${alta.colunas}`
  );
  t.diagnostic(`larga ${larga.colunas}×${larga.linhas}, alta ${alta.colunas}×${alta.linhas}`);
});

test('montarGrade — colunas pedidas pelo usuário são respeitadas', (t) => {
  const grade = montarGrade({ quantidade: 10, largura: 900, altura: 560, colunasPedidas: 5 });
  assert.equal(grade.colunas, 5);
  assert.equal(grade.linhas, 2);
  t.diagnostic('pedido respeitado');
});

test('ordenarSeries — cada ordem faz o que promete', (t) => {
  const series = [
    { rotulo: 'zebra', valores: [1, 1, 1] },
    { rotulo: 'abelha', valores: [10, 0, 0] },
    { rotulo: 'macaco', valores: [2, 2, 2] },
  ];

  assert.deepEqual(
    ordenarSeries(series, 'total').map((s) => s.rotulo),
    ['abelha', 'macaco', 'zebra'],
    'por total: 10, 6, 3'
  );
  assert.deepEqual(
    ordenarSeries(series, 'maximo').map((s) => s.rotulo),
    ['abelha', 'macaco', 'zebra'],
    'por máximo: 10, 2, 1'
  );
  assert.deepEqual(
    ordenarSeries(series, 'alfabetica').map((s) => s.rotulo),
    ['abelha', 'macaco', 'zebra']
  );
  assert.deepEqual(
    ordenarSeries(series, 'consulta').map((s) => s.rotulo),
    ['zebra', 'abelha', 'macaco'],
    '"como veio" não pode reordenar'
  );
  t.diagnostic('quatro ordens conferidas');
});

/* ---------------------- escala compartilhada --------------------- */

test('small_multiples — com escala compartilhada, os painéis são comparáveis', (t) => {
  // A medida da propriedade: a altura ocupada por cada curva DENTRO do seu
  // painel. Com escala compartilhada, a série pequena ocupa pouco; com
  // escala livre, todas ocupam quase tudo.
  const ocupacao = (r) => {
    assert.ok(r.linhas.length > 0, 'nenhuma curva desenhada');
    assert.equal(r.linhas.length, r.paineis.length, 'uma curva por painel');
    return r.linhas.map((caminho, i) => {
      const ys = coordenadasY(caminho.getAttribute('d') || '');
      assert.ok(ys.length > 0, `painel ${i} sem coordenadas`);
      return (Math.max(...ys) - Math.min(...ys)) / r.paineis[i].altura;
    });
  };

  const compartilhada = renderizar('comPivo', { escalaCompartilhada: true, tipoDoPainel: 'linha' });
  const livre = renderizar('comPivo', { escalaCompartilhada: false, tipoDoPainel: 'linha' });
  try {
    const comum = ocupacao(compartilhada);
    const propria = ocupacao(livre);

    // Com escala própria, TODO painel usa quase toda a altura disponível.
    const mediaPropria = propria.reduce((a, b) => a + b, 0) / propria.length;
    const mediaComum = comum.reduce((a, b) => a + b, 0) / comum.length;

    assert.ok(
      mediaPropria > mediaComum,
      `escala livre deveria encher mais os painéis: ${mediaPropria.toFixed(3)} contra ${mediaComum.toFixed(3)}`
    );

    // E a variação ENTRE painéis só existe na escala compartilhada: é ela
    // que carrega a informação "esta série é menor que aquela".
    const variacao = (lista) => Math.max(...lista) - Math.min(...lista);
    assert.ok(
      variacao(comum) > variacao(propria),
      `a escala compartilhada precisa preservar a diferença entre séries: ` +
        `${variacao(comum).toFixed(3)} contra ${variacao(propria).toFixed(3)}`
    );
    t.diagnostic(
      `ocupação média: compartilhada ${mediaComum.toFixed(3)}, livre ${mediaPropria.toFixed(3)}`
    );
  } finally {
    compartilhada.fim();
    livre.fim();
  }
});

test('small_multiples — a escala livre é DECLARADA na tela', (t) => {
  // Sem o aviso, o leitor compara formas que não são comparáveis e nada
  // indica o erro.
  const livre = renderizar('comPivo', { escalaCompartilhada: false });
  try {
    assert.match(livre.nota, /ATENÇÃO/);
    assert.match(livre.nota, /NÃO são comparáveis/i);
  } finally {
    livre.fim();
  }

  const comum = renderizar('comPivo', { escalaCompartilhada: true });
  try {
    assert.match(comum.nota, /escala compartilhada/i);
    assert.match(comum.nota, /SÃO comparáveis/i);
  } finally {
    comum.fim();
  }
  t.diagnostic('os dois modos se declaram');
});

/* ---------------------------- desenho ---------------------------- */

test('small_multiples — um painel por série, com título e máximo', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.paineis.length > 0, 'nenhum painel');
    assert.equal(r.titulos.length, r.paineis.length, 'um título por painel');
    assert.equal(r.valores.length, r.paineis.length, 'um valor máximo por painel');
    for (const titulo of r.titulos) {
      assert.ok(titulo.length > 0, 'título vazio');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.paineis.length} painéis`);
});

test('small_multiples — os painéis não se sobrepõem nem saem da área', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.ok(r.paineis.length > 0, 'nenhum painel');

    for (const painel of r.paineis) {
      assert.ok(painel.x >= -1 && painel.x + painel.largura <= 901, 'painel fora à direita');
      assert.ok(painel.y >= -1 && painel.y + painel.altura <= 561, 'painel fora embaixo');
    }

    for (let i = 0; i < r.paineis.length; i++) {
      for (let j = i + 1; j < r.paineis.length; j++) {
        const a = r.paineis[i];
        const b = r.paineis[j];
        const separados =
          a.x + a.largura <= b.x + 0.5 ||
          b.x + b.largura <= a.x + 0.5 ||
          a.y + a.altura <= b.y + 0.5 ||
          b.y + b.altura <= a.y + 0.5;
        assert.ok(separados, `painéis ${i} e ${j} se sobrepõem`);
      }
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.paineis.length} painéis sem sobreposição`);
});

test('small_multiples — nenhuma curva escapa do próprio painel', (t) => {
  // Uma curva que invade o painel vizinho é lida como dado da outra série.
  const r = renderizar('comPivo', { tipoDoPainel: 'linha' });
  try {
    assert.ok(r.linhas.length > 0, 'nenhuma curva');
    r.linhas.forEach((caminho, i) => {
      const ys = coordenadasY(caminho.getAttribute('d') || '');
      assert.ok(ys.length > 0, `curva ${i} sem coordenadas`);
      const painel = r.paineis[i];
      assert.ok(
        Math.min(...ys) >= painel.y - 1,
        `curva ${i} passou do topo do painel (${Math.min(...ys).toFixed(1)} < ${painel.y})`
      );
      assert.ok(
        Math.max(...ys) <= painel.y + painel.altura + 1,
        `curva ${i} passou do rodapé do painel`
      );
    });
  } finally {
    r.fim();
  }
  t.diagnostic('curvas contidas');
});

test('small_multiples — os três tipos de painel desenham algo diferente', (t) => {
  const contagens = {};
  for (const tipo of ['linha', 'area', 'barras']) {
    const r = renderizar('comPivo', { tipoDoPainel: tipo });
    try {
      assert.ok(r.paineis.length > 0, `${tipo}: nenhum painel`);
      contagens[tipo] = { linhas: r.linhas.length, marcas: r.marcas.length };

      if (tipo === 'barras') {
        assert.equal(r.linhas.length, 0, 'barras não desenham linha');
        assert.ok(r.marcas.length > r.paineis.length, 'faltaram as barras');
      } else {
        assert.equal(r.linhas.length, r.paineis.length, `${tipo}: uma linha por painel`);
        for (const caminho of r.linhas) {
          const d = caminho.getAttribute('d') || '';
          assert.ok(d.length > 5 && !/NaN|Infinity/.test(d), `${tipo}: caminho inválido`);
        }
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic(JSON.stringify(contagens));
});

test('small_multiples — séries demais são cortadas com aviso', (t) => {
  const r = renderizar('grande5k');
  try {
    assert.ok(r.paineis.length > 0, 'nenhum painel');
    assert.ok(r.paineis.length <= 60, `${r.paineis.length} painéis passaram do teto`);
    if (r.paineis.length === 60 || r.aviso) {
      assert.ok(r.aviso.length > 0, 'o corte precisa ser anunciado');
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.paineis.length} painéis · ${r.aviso.slice(0, 60)}`);
});

test('small_multiples — muitos painéis realmente ficam pequenos demais', (t) => {
  // O limiar do aviso (56 px de lado) existe porque abaixo disso nem o
  // título cabe. A primeira versão deste teste supunha que 60 painéis já
  // cruzariam o limiar numa tela de 900 × 560 — e não cruzam: dão 90 px.
  // O caso real é o tile PEQUENO de dashboard, que é onde o problema
  // acontece de verdade.
  //
  // (Nenhuma fixture produz 60 séries, então o aviso em si não dá para
  // exercitar pelo render — e inventar uma fixture só para isso esconderia
  // que o teste de verdade é este, sobre a geometria.)
  const tilePequeno = montarGrade({ quantidade: 60, largura: 400, altura: 200 });
  const telaCheia = montarGrade({ quantidade: 12, largura: 900, altura: 560 });

  assert.ok(
    Math.min(tilePequeno.ladoX, tilePequeno.ladoY) < 56,
    `60 painéis em 400×200 deveriam ficar menores que 56 px: ${tilePequeno.ladoX.toFixed(0)} × ${tilePequeno.ladoY.toFixed(0)}`
  );
  assert.ok(
    Math.min(telaCheia.ladoX, telaCheia.ladoY) >= 56,
    `12 painéis em tela cheia ainda deveriam caber: ${telaCheia.ladoX.toFixed(0)} × ${telaCheia.ladoY.toFixed(0)}`
  );
  t.diagnostic(
    `60 em tile pequeno ⇒ ${tilePequeno.ladoX.toFixed(0)}×${tilePequeno.ladoY.toFixed(0)} px; ` +
      `12 em tela cheia ⇒ ${telaCheia.ladoX.toFixed(0)}×${telaCheia.ladoY.toFixed(0)} px`
  );
});

test('small_multiples — com poucos painéis, nenhum aviso falso de tamanho', (t) => {
  // O outro lado do aviso: disparar à toa treina o usuário a ignorá-lo.
  const r = renderizar('comPivo');
  try {
    assert.ok(r.paineis.length > 0);
    assert.ok(
      !/nem o título cabe/i.test(r.aviso),
      `5 painéis cabem folgados, mas veio o aviso: "${r.aviso}"`
    );
  } finally {
    r.fim();
  }
  t.diagnostic('sem aviso falso');
});

test('small_multiples — a nota declara a grade, a ordem e o nº de pontos', (t) => {
  const r = renderizar('comPivo');
  try {
    assert.match(r.nota, /\d+ painéis em \d+ × \d+/, `nota sem a grade: "${r.nota}"`);
    assert.match(r.nota, /ordem pelo total/i);
    assert.match(r.nota, /\d+ pontos por painel/);
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 100));
});

test('small_multiples — sem séries, explica em vez de desenhar', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.paineis.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('recusa explicada');
});
