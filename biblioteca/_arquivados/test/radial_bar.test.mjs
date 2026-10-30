/**
 * radial_bar.test.mjs — testes das Barras Radiais.
 *
 * O defeito deste gráfico é o avesso do da rosa: aqui o problema é o
 * COMPRIMENTO. Como o arco mede `raio × ângulo`, duas barras de mesmo
 * valor em anéis diferentes têm tamanhos diferentes — a de fora parece
 * maior, sempre, e não há conserto. O que os testes garantem é que a
 * grandeza que CODIFICA o valor (o ângulo) está certa, que todas as barras
 * partem do mesmo zero, e que a distorção está declarada.
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
  anguloDoValor,
  comprimentoDoArco,
  lerFatias,
} from '../src/charts/radial_bar/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'radial_bar.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.radial_bar;
  assert.ok(definicao, 'radial_bar não se registrou');

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
    barras: Array.from(palco.querySelectorAll('path.rb-barra')).map((p) => ({
      chave: p.getAttribute('data-chave'),
      angulo: Number(p.getAttribute('data-angulo')),
      raio: Number(p.getAttribute('data-raio')),
      d: p.getAttribute('d') || '',
    })),
    trilhos: Array.from(palco.querySelectorAll('path.rb-trilho')),
    guias: Array.from(palco.querySelectorAll('line.rb-guia')),
    escalas: Array.from(palco.querySelectorAll('.rb-escala')).map((t) => t.textContent),
    rotulos: Array.from(palco.querySelectorAll('.rb-rotulo')).map((t) => t.textContent),
    nota: palco.querySelector('.rb-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ----------------------------- o ângulo -------------------------- */

test('anguloDoValor — proporcional ao valor e partindo de zero', (t) => {
  const maximo = Math.PI; // 180°
  perto(anguloDoValor({ valor: 100, maior: 100, anguloMaximo: maximo }), maximo, 1e-12);
  perto(anguloDoValor({ valor: 50, maior: 100, anguloMaximo: maximo }), maximo / 2, 1e-12);
  perto(anguloDoValor({ valor: 25, maior: 100, anguloMaximo: maximo }), maximo / 4, 1e-12);
  perto(anguloDoValor({ valor: 0, maior: 100, anguloMaximo: maximo }), 0, 1e-12);
  t.diagnostic('quatro proporções conferidas');
});

test('anguloDoValor — negativo e ausente viram zero, não ângulo invertido', (t) => {
  // Ângulo negativo inverteria o sentido de leitura e a barra pareceria
  // apenas pequena, em vez de contrária.
  for (const valor of [-50, null, NaN]) {
    perto(anguloDoValor({ valor, maior: 100, anguloMaximo: Math.PI }), 0, 1e-12);
  }
  t.diagnostic('três casos tratados');
});

test('anguloDoValor — nunca passa do ângulo máximo', (t) => {
  perto(anguloDoValor({ valor: 500, maior: 100, anguloMaximo: Math.PI }), Math.PI, 1e-12);
  t.diagnostic('teto respeitado');
});

/* ------------------------- a distorção --------------------------- */

test('comprimentoDoArco — mesmo valor em anéis diferentes dá tamanhos diferentes', (t) => {
  // É o defeito estrutural do gráfico, medido. Como não tem conserto, o
  // que resta é declará-lo — e o teste prova que ele existe de verdade.
  const angulo = anguloDoValor({ valor: 50, maior: 100, anguloMaximo: Math.PI });
  const deFora = comprimentoDoArco({ raio: 200, angulo });
  const deDentro = comprimentoDoArco({ raio: 100, angulo });

  perto(deFora / deDentro, 2, 1e-12, 'o anel de fora tem o dobro do comprimento');
  t.diagnostic(
    `mesmo valor: ${deDentro.toFixed(1)} no anel de 100 e ${deFora.toFixed(1)} no de 200`
  );
});

test('comprimentoDoArco — o ÂNGULO, ao contrário, é o mesmo nos dois anéis', (t) => {
  // A razão de o ângulo ser a grandeza escolhida.
  const a = anguloDoValor({ valor: 50, maior: 100, anguloMaximo: Math.PI });
  const b = anguloDoValor({ valor: 50, maior: 100, anguloMaximo: Math.PI });
  perto(a, b, 1e-12);
  t.diagnostic('o ângulo não depende do raio');
});

/* ---------------------------- desenho ---------------------------- */

test('radial_bar — uma barra por categoria, com caminho válido', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.barras.length > 0, 'nenhuma barra');
    for (const barra of r.barras) {
      assert.ok(barra.d.length > 10, 'barra com caminho vazio');
      assert.ok(!/NaN|Infinity/.test(barra.d), 'barra com NaN/Infinity');
    }
    assert.equal(r.rotulos.length, r.barras.length, 'um nome por anel');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.barras.length} barras`);
});

test('radial_bar — o ângulo desenhado é proporcional ao valor', (t) => {
  // A ligação entre dado e geometria, medida no DOM.
  const r = renderizar('semPivo');
  try {
    assert.ok(r.barras.length > 1, 'poucas barras');

    const { data, queryResponse } = FIXTURES.semPivo();
    const modelo = construirModelo(data, queryResponse, {});
    const fatias = lerFatias({
      modelo,
      medida: modelo.medidas[0],
      campoDaCategoria: modelo.dimensoes[0],
      config: {},
    });
    const valorPorChave = new Map(fatias.map((f) => [f.chave, f.valor]));
    const maior = Math.max(...fatias.map((f) => f.valor));

    const medidas = r.barras
      .map((b) => ({ angulo: b.angulo, valor: valorPorChave.get(b.chave) }))
      .filter((b) => b.valor !== undefined && b.valor > 0);
    assert.ok(medidas.length > 1, 'não consegui casar barras com valores');

    const maiorAngulo = Math.max(...medidas.map((m) => m.angulo));
    for (const m of medidas) {
      perto(m.angulo / maiorAngulo, m.valor / maior, 1e-6);
    }
    t.diagnostic(`${medidas.length} barras com ângulo proporcional`);
  } finally {
    r.fim();
  }
});

test('radial_bar — todas as barras começam no MESMO ângulo', (t) => {
  // É o que torna a comparação angular legítima — mesma regra da base
  // zero nas barras lineares.
  const r = renderizar('semPivo');
  try {
    assert.ok(r.barras.length > 1, 'poucas barras');
    // Num arco que começa em 0 (topo), o primeiro ponto do caminho fica
    // sobre o eixo vertical: x ≈ 0.
    for (const barra of r.barras) {
      const numeros = (barra.d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      assert.ok(numeros.length > 2, 'caminho curto demais');
      assert.ok(
        Math.abs(numeros[0]) < 1.5,
        `a barra começa em x=${numeros[0].toFixed(2)}, fora do eixo de partida`
      );
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.barras.length} barras partindo do mesmo ângulo`);
});

test('radial_bar — cada anel tem raio próprio e constante', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(r.barras.length > 1, 'poucas barras');
    const raios = r.barras.map((b) => b.raio);
    assert.equal(new Set(raios.map((x) => x.toFixed(3))).size, raios.length, 'dois anéis no mesmo raio');

    const ordenados = raios.slice().sort((a, b) => a - b);
    const passos = [];
    for (let i = 1; i < ordenados.length; i++) passos.push(ordenados[i] - ordenados[i - 1]);
    assert.ok(passos.length > 0);
    for (const passo of passos) {
      assert.ok(Math.abs(passo - passos[0]) < 0.01, 'os anéis precisam ser igualmente espaçados');
    }
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.barras.length} anéis igualmente espaçados`);
});

test('radial_bar — a nota declara a ressalva do comprimento', (t) => {
  // A parte honesta do gráfico. Sem isso, a barra de fora parece maior e
  // ninguém sabe por quê.
  const r = renderizar('semPivo');
  try {
    assert.match(r.nota, /ÂNGULO varrido/i, 'a grandeza que codifica o valor precisa estar dita');
    assert.match(r.nota, /ATENÇÃO/);
    assert.match(r.nota, /comprimento depende do raio/i);
    assert.match(r.nota, /mesmo ângulo/i, 'a base comum precisa estar declarada');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 120));
});

test('radial_bar — o ângulo máximo escolhido é respeitado e declarado', (t) => {
  const r = renderizar('semPivo', { anguloMaximo: 180 });
  try {
    assert.ok(r.barras.length > 0);
    const maiorAngulo = Math.max(...r.barras.map((b) => b.angulo));
    perto(maiorAngulo, Math.PI, 1e-6, 'a maior barra precisa varrer exatamente 180°');
    assert.match(r.nota, /180°/);
  } finally {
    r.fim();
  }
  t.diagnostic('ângulo máximo conferido');
});

test('radial_bar — o trilho vai até o ângulo máximo e some quando desligado', (t) => {
  const com = renderizar('semPivo', { mostrarTrilho: true });
  try {
    assert.equal(com.trilhos.length, com.barras.length, 'um trilho por barra');
  } finally {
    com.fim();
  }

  const sem = renderizar('semPivo', { mostrarTrilho: false });
  try {
    assert.equal(sem.trilhos.length, 0, 'desligado, nenhum trilho');
    assert.ok(sem.barras.length > 0, 'mas as barras continuam');
  } finally {
    sem.fim();
  }
  t.diagnostic('trilho conferido nos dois modos');
});

test('radial_bar — as guias angulares dão referência ao ângulo', (t) => {
  const com = renderizar('semPivo', { guiasAngulares: 3 });
  try {
    assert.equal(com.guias.length, 3, 'três guias pedidas, três desenhadas');
    assert.equal(com.escalas.length, 3, 'cada guia precisa do seu valor escrito');
    for (const texto of com.escalas) assert.ok(texto.length > 0, 'guia sem rótulo');
  } finally {
    com.fim();
  }

  const sem = renderizar('semPivo', { guiasAngulares: 0 });
  try {
    assert.equal(sem.guias.length, 0);
    assert.match(sem.nota, /sem guias/i, 'a ausência de referência precisa ser dita');
  } finally {
    sem.fim();
  }
  t.diagnostic('guias conferidas nos dois modos');
});

test('radial_bar — a ordem dos anéis muda conforme pedido', (t) => {
  const desc = renderizar('semPivo', { ordem: 'valorDesc' });
  const asc = renderizar('semPivo', { ordem: 'valorAsc' });
  try {
    assert.ok(desc.barras.length > 1 && asc.barras.length > 1);
    // O anel mais externo (maior raio) troca de dono entre os dois modos.
    const maisExterno = (r) => r.barras.reduce((a, b) => (b.raio > a.raio ? b : a));
    assert.notEqual(
      maisExterno(desc).chave,
      maisExterno(asc).chave,
      'inverter a ordem precisa trocar quem fica no anel de fora'
    );
  } finally {
    desc.fim();
    asc.fim();
  }
  t.diagnostic('ordens conferidas');
});

test('radial_bar — sem negativos, nenhum aviso falso de ângulo negativo', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(
      !/ângulo negativo/i.test(r.aviso),
      `aviso de negativo sem haver negativos: "${r.aviso}"`
    );
  } finally {
    r.fim();
  }
  t.diagnostic('sem aviso falso');
});

test('radial_bar — consulta vazia explica em vez de desenhar', (t) => {
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.barras.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
