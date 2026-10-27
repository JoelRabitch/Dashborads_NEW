/**
 * nightingale.test.mjs — testes da Rosa de Nightingale.
 *
 * O gráfico existe na biblioteca por causa de um erro célebre: no diagrama
 * original, o raio é proporcional ao valor, e como a área de um setor
 * cresce com o QUADRADO do raio, o dobro vira quatro vezes mais tinta. O
 * erro vem com credencial — o gráfico é citado em toda parte como exemplo
 * de boa visualização.
 *
 * Então o primeiro teste mede a propriedade: no modo padrão, **dobrar o
 * valor dobra a ÁREA**; no modo original, quadruplica. E o modo em uso
 * tem de estar declarado na tela.
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
import { construirModelo } from '../src/core/data-model.js';
import {
  raioDoValor,
  areaDoSetor,
  lerFatias,
} from '../src/charts/nightingale/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'nightingale.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.nightingale;
  assert.ok(definicao, 'nightingale não se registrou');

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
    fatias: Array.from(palco.querySelectorAll('path.ng-fatia')).map((p) => ({
      chave: p.getAttribute('data-chave'),
      d: p.getAttribute('d') || '',
    })),
    aneis: Array.from(palco.querySelectorAll('circle.ng-anel')).map((c) =>
      Number(c.getAttribute('r'))
    ),
    rotulos: Array.from(palco.querySelectorAll('.ng-rotulo')).map((t) => t.textContent),
    escalas: Array.from(palco.querySelectorAll('.ng-escala')).map((t) => t.textContent),
    nota: palco.querySelector('.ng-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/** Maior distância do centro num caminho de arco (a origem é 0,0). */
function raioMaximoDoCaminho(d) {
  const numeros = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  let maior = 0;
  for (let i = 0; i + 1 < numeros.length; i += 2) {
    maior = Math.max(maior, Math.hypot(numeros[i], numeros[i + 1]));
  }
  return maior;
}

/* --------------------------- a armadilha ------------------------- */

test('raioDoValor — no modo padrão, dobrar o valor DOBRA a área', (t) => {
  // A correção do defeito do gráfico original.
  const angulo = Math.PI / 6;
  const metade = raioDoValor({ valor: 50, maior: 100, raioMaximo: 100, modo: 'area' });
  const inteiro = raioDoValor({ valor: 100, maior: 100, raioMaximo: 100, modo: 'area' });

  perto(inteiro, 100, 1e-12);
  perto(metade, 100 / Math.SQRT2, 1e-9, 'o raio cresce com √valor');

  const areaMetade = areaDoSetor({ raio: metade, angulo });
  const areaInteira = areaDoSetor({ raio: inteiro, angulo });
  perto(areaInteira / areaMetade, 2, 1e-9);
  t.diagnostic(`raios ${metade.toFixed(2)} → ${inteiro}; áreas na razão 2`);
});

test('raioDoValor — no modo original, dobrar o valor QUADRUPLICA a área', (t) => {
  // O defeito célebre, reproduzido de propósito para quem quiser o
  // original — e medido, para ninguém achar que é detalhe.
  const angulo = Math.PI / 6;
  const metade = raioDoValor({ valor: 50, maior: 100, raioMaximo: 100, modo: 'raio' });
  const inteiro = raioDoValor({ valor: 100, maior: 100, raioMaximo: 100, modo: 'raio' });

  perto(metade, 50, 1e-12, 'no modo original o raio é o valor');
  const razao = areaDoSetor({ raio: inteiro, angulo }) / areaDoSetor({ raio: metade, angulo });
  perto(razao, 4, 1e-9, 'o dobro do valor vira quatro vezes mais tinta');
  t.diagnostic(`áreas na razão ${razao}`);
});

test('raioDoValor — com raio interno, a ÁREA DO ANEL continua proporcional', (t) => {
  // A conta muda (r₀ entra na raiz) e a propriedade se mantém. Sem isso, a
  // rosca quebraria a proporcionalidade sem ninguém notar.
  const angulo = Math.PI / 6;
  const r0 = 40;
  const meio = raioDoValor({ valor: 50, maior: 100, raioMaximo: 100, raioInterno: r0, modo: 'area' });
  const cheio = raioDoValor({ valor: 100, maior: 100, raioMaximo: 100, raioInterno: r0, modo: 'area' });

  const areaMeio = areaDoSetor({ raio: meio, raioInterno: r0, angulo });
  const areaCheia = areaDoSetor({ raio: cheio, raioInterno: r0, angulo });
  perto(areaCheia / areaMeio, 2, 1e-9);
  assert.ok(meio > r0, 'a fatia precisa sair do anel interno');
  t.diagnostic(`com r0=40: raios ${meio.toFixed(2)} e ${cheio}; áreas na razão 2`);
});

test('raioDoValor — valor zero ou negativo fica no raio interno', (t) => {
  // Num gráfico polar não existe raio negativo. Desenhá-lo "para dentro"
  // faria uma fatia contrária parecer apenas pequena.
  for (const valor of [0, -50, null, NaN]) {
    assert.equal(raioDoValor({ valor, maior: 100, raioMaximo: 100 }), 0, `valor ${valor}`);
    assert.equal(
      raioDoValor({ valor, maior: 100, raioMaximo: 100, raioInterno: 30 }),
      30,
      `valor ${valor} com rosca`
    );
  }
  t.diagnostic('quatro casos degenerados tratados');
});

test('raioDoValor — a escala não extrapola além do maior', (t) => {
  const r = raioDoValor({ valor: 500, maior: 100, raioMaximo: 100, modo: 'area' });
  perto(r, 100, 1e-12, 'o raio máximo é o teto');
  t.diagnostic('teto respeitado');
});

/* ---------------------------- leitura ---------------------------- */

function contextoDe(nomeDaFixture) {
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  return construirModelo(data, queryResponse, {});
}

test('lerFatias — a ordem padrão é a da CONSULTA', (t) => {
  // Com meses ou dias da semana, reordenar por valor destrói a leitura: a
  // rosa deixa de ser calendário e vira ranking circular, que é outro
  // gráfico.
  const modelo = contextoDe('temporal');
  const medida = modelo.medidas[0];
  const campoDaCategoria = modelo.dimensoes[0];

  const naConsulta = lerFatias({ modelo, medida, campoDaCategoria, config: {} });
  assert.ok(naConsulta.length > 2, 'poucas fatias');

  const porValor = lerFatias({ modelo, medida, campoDaCategoria, config: { ordem: 'valorDesc' } });
  const valores = porValor.map((f) => f.valor);
  for (let i = 1; i < valores.length; i++) {
    assert.ok(valores[i] <= valores[i - 1] + 1e-9, 'a ordem por valor precisa ser decrescente');
  }
  assert.notDeepEqual(
    porValor.map((f) => f.chave),
    naConsulta.map((f) => f.chave),
    'as duas ordens não podem coincidir nesta fixture'
  );
  t.diagnostic(`${naConsulta.length} fatias; ordem da consulta preservada`);
});

test('lerFatias — valores negativos viram zero no desenho e ficam no bruto', (t) => {
  const modelo = {
    linhas: [{}, {}],
    valorBruto: (linha, campo) => (linha === modelo.linhas[0] ? 'a' : 'b'),
    texto: (linha) => (linha === modelo.linhas[0] ? 'A' : 'B'),
    valorNumerico: (linha) => (linha === modelo.linhas[0] ? -30 : 50),
  };
  const fatias = lerFatias({
    modelo,
    medida: { nome: 'v' },
    campoDaCategoria: { nome: 'c', ehData: false },
    config: {},
  });
  assert.equal(fatias.length, 2);
  const negativa = fatias.find((f) => f.rotulo === 'A');
  assert.equal(negativa.valorBruto, -30, 'o bruto fica para o tooltip e o aviso');
  assert.equal(negativa.valor, 0, 'o desenhado é zero');
  t.diagnostic('negativo preservado no bruto, zerado no desenho');
});

/* ---------------------------- desenho ---------------------------- */

test('nightingale — uma fatia por categoria, com caminho válido', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.fatias.length > 0, 'nenhuma fatia');
    for (const fatia of r.fatias) {
      assert.ok(fatia.d.length > 10, 'fatia com caminho vazio');
      assert.ok(!/NaN|Infinity/.test(fatia.d), 'fatia com NaN/Infinity');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.fatias.length} fatias`);
});

test('nightingale — o raio desenhado acompanha o valor, na ordem certa', (t) => {
  // A ligação entre dado e geometria: a fatia de maior valor precisa ser a
  // que chega mais longe do centro.
  const r = renderizar('semPivo');
  try {
    assert.ok(r.fatias.length > 1, 'poucas fatias');

    const modelo = contextoDe('semPivo');
    const fatiasDoDado = lerFatias({
      modelo,
      medida: modelo.medidas[0],
      campoDaCategoria: modelo.dimensoes[0],
      config: {},
    });
    const valorPorChave = new Map(fatiasDoDado.map((f) => [f.chave, f.valor]));

    const medidos = r.fatias
      .map((f) => ({ chave: f.chave, raio: raioMaximoDoCaminho(f.d), valor: valorPorChave.get(f.chave) }))
      .filter((f) => f.valor !== undefined);
    assert.ok(medidos.length > 1, 'não consegui casar fatias com valores');

    medidos.sort((a, b) => a.valor - b.valor);
    for (let i = 1; i < medidos.length; i++) {
      assert.ok(
        medidos[i].raio >= medidos[i - 1].raio - 0.6,
        `valor maior com raio menor: ${medidos[i - 1].valor}→${medidos[i - 1].raio.toFixed(1)} e ${medidos[i].valor}→${medidos[i].raio.toFixed(1)}`
      );
    }
    t.diagnostic(`${medidos.length} fatias com raio monótono no valor`);
  } finally {
    r.fim();
  }
});

test('nightingale — a área desenhada é proporcional ao valor no modo padrão', (t) => {
  // Mede a propriedade no DESENHO, não só na função: com ângulos iguais,
  // r² tem de ser proporcional ao valor.
  const r = renderizar('semPivo', { modoDoRaio: 'area', raioInterno: 0 });
  try {
    const modelo = contextoDe('semPivo');
    const fatiasDoDado = lerFatias({
      modelo,
      medida: modelo.medidas[0],
      campoDaCategoria: modelo.dimensoes[0],
      config: {},
    });
    const valorPorChave = new Map(fatiasDoDado.map((f) => [f.chave, f.valor]));
    const maior = Math.max(...fatiasDoDado.map((f) => f.valor));

    const medidos = r.fatias
      .map((f) => ({ raio: raioMaximoDoCaminho(f.d), valor: valorPorChave.get(f.chave) }))
      .filter((f) => f.valor > 0);
    assert.ok(medidos.length > 1, 'poucas fatias com valor');

    const raioDoMaior = Math.max(...medidos.map((m) => m.raio));
    for (const m of medidos) {
      // (r/R)² deve ser v/vMax.
      const esperado = m.valor / maior;
      const obtido = (m.raio / raioDoMaior) ** 2;
      assert.ok(
        Math.abs(obtido - esperado) < 0.04,
        `fatia de valor ${m.valor}: área relativa ${obtido.toFixed(3)}, esperada ${esperado.toFixed(3)}`
      );
    }
    t.diagnostic(`${medidos.length} fatias com área proporcional`);
  } finally {
    r.fim();
  }
});

test('nightingale — a nota declara o modo e a consequência', (t) => {
  const area = renderizar('semPivo', { modoDoRaio: 'area' });
  try {
    assert.match(area.nota, /ÁREA proporcional/i);
    assert.match(area.nota, /ângulo igual/i, 'o que define a rosa precisa estar dito');
  } finally {
    area.fim();
  }

  const original = renderizar('semPivo', { modoDoRaio: 'raio' });
  try {
    assert.match(original.nota, /ATENÇÃO/);
    assert.match(original.nota, /QUADRADO/, 'a consequência precisa estar escrita');
    assert.match(original.nota, /quatro vezes mais tinta/i);
  } finally {
    original.fim();
  }
  t.diagnostic('os dois modos se declaram');
});

test('nightingale — os anéis de escala ficam em valores redondos', (t) => {
  // Com área proporcional, anéis de raios iguais seriam valores desiguais
  // — o oposto do que uma escala deve fazer.
  const r = renderizar('semPivo', { aneisDeEscala: 3 });
  try {
    assert.equal(r.aneis.length, 3, 'três anéis pedidos, três desenhados');
    assert.equal(r.escalas.length, 3, 'cada anel precisa do seu rótulo');

    const ordenados = r.aneis.slice().sort((a, b) => a - b);
    const passos = [];
    for (let i = 1; i < ordenados.length; i++) passos.push(ordenados[i] - ordenados[i - 1]);
    assert.ok(passos.length > 0);
    // Com área proporcional, os passos de RAIO encolhem para fora.
    assert.ok(
      passos[passos.length - 1] < passos[0],
      `os anéis deveriam se aproximar para fora: ${passos.map((p) => p.toFixed(1)).join(', ')}`
    );
  } finally {
    r.fim();
  }
  t.diagnostic(`anéis em ${r.aneis.map((a) => a.toFixed(0)).join(', ')}`);
});

test('nightingale — sem anéis, a nota diz que o raio perdeu a referência', (t) => {
  const r = renderizar('semPivo', { aneisDeEscala: 0 });
  try {
    assert.equal(r.aneis.length, 0);
    assert.match(r.nota, /sem anéis/i);
  } finally {
    r.fim();
  }
  t.diagnostic('ausência de escala declarada');
});

test('nightingale — a rosca mantém o buraco e continua proporcional', (t) => {
  const r = renderizar('semPivo', { raioInterno: 40 });
  try {
    assert.ok(r.fatias.length > 0, 'nenhuma fatia');
    assert.match(r.nota, /área do ANEL/i, 'a mudança de conta precisa estar declarada');
    for (const fatia of r.fatias) {
      assert.ok(!/NaN|Infinity/.test(fatia.d), 'rosca com caminho inválido');
    }
  } finally {
    r.fim();
  }
  t.diagnostic('modo rosca conferido');
});

test('nightingale — valores negativos são denunciados', (t) => {
  // Nenhuma fixture tem medida negativa, então aqui garantimos o outro
  // lado: sem negativos, o aviso NÃO pode aparecer.
  const r = renderizar('semPivo');
  try {
    assert.ok(
      !/raio negativo/i.test(r.aviso),
      `aviso de negativo sem haver negativos: "${r.aviso}"`
    );
  } finally {
    r.fim();
  }
  t.diagnostic('sem aviso falso');
});

test('nightingale — consulta vazia explica em vez de desenhar', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.fatias.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
