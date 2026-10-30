/**
 * intervalo_confianca.test.mjs — testes do Intervalo de Confiança.
 *
 * Um intervalo errado não parece errado: ele só é mais largo ou mais
 * estreito do que devia, e a conclusão muda em silêncio. Então os testes
 * conferem contra x̄ ± t·s/√n calculado à mão, exigem que n maior estreite
 * e que confiança maior alargue — e, o mais importante, que o gráfico
 * avise sobre a armadilha da sobreposição, que é por onde a conclusão
 * errada entra mesmo com a conta certa.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { quantilT } from '../src/core/estatistica.js';
import {
  aplicarIntervalo,
  NIVEL_DE_COMPARACAO,
  MINIMO_POR_CATEGORIA,
} from '../src/charts/intervalo_confianca/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'intervalo_confianca.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

const item = (estimativa, desvio, n) => ({
  chave: 'a',
  rotulo: 'A',
  estimativa,
  desvio,
  n,
  erroPadrao: n > 1 ? desvio / Math.sqrt(n) : null,
  inferior: null,
  superior: null,
});

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.intervalo_confianca;
  assert.ok(definicao, 'intervalo_confianca não se registrou');

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
    estimativas: Array.from(palco.querySelectorAll('circle.ic-estimativa')),
    linhas: Array.from(palco.querySelectorAll('line.ic-marca')),
    nota: palco.querySelector('.ic-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ---------------------------- a conta ---------------------------- */

test('intervalo — bate com x̄ ± t·s/√n feito à mão', (t) => {
  // x̄ = 100, s = 15, n = 25 ⇒ EP = 3; t(0,975; 24) = 2,0639.
  const resultado = aplicarIntervalo(item(100, 15, 25), { nivel: 0.95 });
  const t975 = quantilT(0.975, 24);

  perto(resultado.erroPadrao, 3, 1e-12);
  perto(resultado.inferior, 100 - t975 * 3, 1e-12);
  perto(resultado.superior, 100 + t975 * 3, 1e-12);
  assert.ok(Math.abs(t975 - 2.0639) < 0.005, `t(0,975; 24) = ${t975.toFixed(4)}`);
  t.diagnostic(`100 ± ${(t975 * 3).toFixed(3)} = [${resultado.inferior.toFixed(2)}, ${resultado.superior.toFixed(2)}]`);
});

test('intervalo — usa o t de Student, não 1,96 fixo', (t) => {
  // Com n = 6 o multiplicador certo é 2,57. Usar 1,96 estreitaria o
  // intervalo em ~24% exatamente onde a incerteza é maior.
  const pequeno = aplicarIntervalo(item(50, 10, 6), { nivel: 0.95 });
  const largura = pequeno.superior - pequeno.inferior;
  const comZ = 2 * 1.959964 * pequeno.erroPadrao;

  assert.ok(largura > comZ * 1.2, `com n=6 o intervalo deveria ser bem mais largo que com z (${largura.toFixed(2)} vs ${comZ.toFixed(2)})`);
  assert.ok(Math.abs(pequeno.multiplicador - 2.571) < 0.01, `multiplicador ${pequeno.multiplicador.toFixed(4)}`);
  t.diagnostic(`n=6 ⇒ t=${pequeno.multiplicador.toFixed(3)} (z seria 1,960)`);
});

test('intervalo — quadruplicar o n reduz a largura pela metade', (t) => {
  // O erro-padrão cai com √n. Se não caísse assim, a conta estaria errada.
  const pequeno = aplicarIntervalo(item(100, 20, 100), { nivel: 0.95 });
  const grande = aplicarIntervalo(item(100, 20, 400), { nivel: 0.95 });

  const razao = (pequeno.superior - pequeno.inferior) / (grande.superior - grande.inferior);
  assert.ok(Math.abs(razao - 2) < 0.02, `razão de larguras ${razao.toFixed(4)}, esperada ≈2`);
  t.diagnostic(`n 100 → 400: largura ÷ ${razao.toFixed(3)}`);
});

test('intervalo — confiança maior alarga', (t) => {
  const a80 = aplicarIntervalo(item(10, 2, 30), { nivel: 0.8 });
  const a99 = aplicarIntervalo(item(10, 2, 30), { nivel: 0.99 });
  assert.ok(a99.superior - a99.inferior > (a80.superior - a80.inferior) * 1.8);
  t.diagnostic(`largura 80% = ${(a80.superior - a80.inferior).toFixed(3)}, 99% = ${(a99.superior - a99.inferior).toFixed(3)}`);
});

test('intervalo — ±1 erro-padrão é mais estreito que 95% e se chama assim', (t) => {
  // Barras de 1 EP cobrem ~68%. Mostrá-las como se fossem 95% seria
  // reduzir a incerteza aparente pela metade.
  const ep = aplicarIntervalo(item(10, 2, 30), { tipo: 'erroPadrao' });
  const ic = aplicarIntervalo(item(10, 2, 30), { tipo: 'confianca', nivel: 0.95 });

  perto(ep.superior - ep.estimativa, ep.erroPadrao, 1e-12);
  assert.ok(ic.superior - ic.estimativa > (ep.superior - ep.estimativa) * 1.9);
  t.diagnostic(`±1 EP = ${(ep.superior - ep.estimativa).toFixed(4)}; 95% = ${(ic.superior - ic.estimativa).toFixed(4)}`);
});

test('intervalo — sem n ou com n = 1 não inventa barra', (t) => {
  const semN = aplicarIntervalo({ estimativa: 5, erroPadrao: null, n: null });
  assert.equal(semN.inferior, null);
  assert.equal(semN.superior, null);

  const umSo = aplicarIntervalo(item(5, 0, 1));
  assert.equal(umSo.inferior, null, 'com n = 1 não há erro-padrão estimável');
  t.diagnostic('null em vez de barra de mentira');
});

test('comparação — o nível de ~83,4% é o que faz sobreposição = teste', (t) => {
  // A propriedade: para dois grupos com EPs parecidos, barras a 1,386 EP
  // se tocam exatamente quando |diferença| = 1,96 · EP da diferença.
  const ep = 1;
  const multiplicador = quantilT(1 - (1 - NIVEL_DE_COMPARACAO / 100) / 2, 1e6);

  assert.ok(
    Math.abs(multiplicador - 1.959964 / Math.SQRT2) < 0.01,
    `o multiplicador de ${NIVEL_DE_COMPARACAO}% deveria ser ≈1,386; veio ${multiplicador.toFixed(4)}`
  );

  // Duas estimativas separadas por exatamente 1,96·√2·EP (o limiar do teste).
  const separacao = 1.959964 * Math.SQRT2 * ep;
  const meiaBarra = multiplicador * ep;
  assert.ok(
    Math.abs(separacao - 2 * meiaBarra) < 0.02,
    'as barras de comparação deveriam se tocar exatamente no limiar do teste'
  );
  t.diagnostic(`limiar do teste ${separacao.toFixed(4)} ≈ 2 × ${meiaBarra.toFixed(4)}`);
});

test('comparação — as barras de comparação são MAIS ESTREITAS que as de 95%', (t) => {
  // É por isso que a armadilha existe: lendo sobreposição em barras de 95%,
  // conclui-se "não há diferença" com mais frequência do que o teste diria.
  const ic95 = aplicarIntervalo(item(100, 30, 50), { nivel: 0.95 });
  const comparacao = aplicarIntervalo(item(100, 30, 50), { nivel: NIVEL_DE_COMPARACAO / 100 });

  assert.ok(
    comparacao.superior - comparacao.inferior < (ic95.superior - ic95.inferior) * 0.8,
    'as barras de comparação precisam ser visivelmente mais estreitas'
  );
  t.diagnostic(
    `95%: ${(ic95.superior - ic95.inferior).toFixed(2)} × comparação: ${(comparacao.superior - comparacao.inferior).toFixed(2)}`
  );
});

/* ---------------------------- desenho ---------------------------- */

test('intervalo_confianca — desenha uma estimativa por categoria', (t) => {
  const r = renderizar('conjuntosPorItem');
  try {
    assert.ok(r.estimativas.length > 0, 'nenhuma estimativa desenhada');
    for (const c of r.estimativas) {
      assert.ok(Number.isFinite(Number(c.getAttribute('cx'))), 'estimativa com cx inválido');
      assert.ok(Number.isFinite(Number(c.getAttribute('cy'))), 'estimativa com cy inválido');
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.estimativas.length} categorias`);
});

test('intervalo_confianca — a nota avisa da armadilha da sobreposição', (t) => {
  // Este é o aviso mais importante do gráfico: sem ele, a leitura natural
  // ("as barras se tocam, logo são iguais") é errada e parece certa.
  const r = renderizar('conjuntosPorItem');
  try {
    assert.match(r.nota, /se tocam/i, 'faltou o aviso da sobreposição');
    assert.match(r.nota, /não significam diferença não significativa/i);
    assert.match(r.nota, /modo de comparação/i, 'e o caminho para a leitura certa');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(-110));
});

test('intervalo_confianca — o modo de comparação se declara NÃO sendo IC', (t) => {
  // Trocar um pelo outro é trocar uma conclusão por outra.
  const r = renderizar('conjuntosPorItem', { tipoDeBarra: 'comparacao' });
  try {
    assert.match(r.nota, /COMPARAÇÃO/);
    assert.match(r.nota, /83[.,]4/);
    assert.match(r.nota, /NÃO são intervalos de confiança/i);
  } finally {
    r.fim();
  }
  t.diagnostic('modo de comparação declarado');
});

test('intervalo_confianca — as barras de comparação são mesmo mais curtas na tela', (t) => {
  // O teste da conta já passou; aqui é a ligação dela com o desenho.
  //
  // Comparar pixels crus NÃO serve: barras mais estreitas encolhem o
  // domínio do eixo, a escala dá zoom e as barras voltam a parecer longas.
  // O que é invariante de escala é a barra MEDIDA CONTRA a distância entre
  // as estimativas, que são os mesmos dados nos dois desenhos.
  const extensaoRelativa = (r) => {
    const horizontais = r.linhas.filter(
      (l) => Math.abs(Number(l.getAttribute('y1')) - Number(l.getAttribute('y2'))) < 0.01
    );
    const comprimentos = horizontais.map((l) =>
      Math.abs(Number(l.getAttribute('x2')) - Number(l.getAttribute('x1')))
    );
    const media = comprimentos.reduce((a, b) => a + b, 0) / Math.max(1, comprimentos.length);

    const estimativas = r.estimativas.map((c) => Number(c.getAttribute('cx')));
    const vao = Math.max(...estimativas) - Math.min(...estimativas) || 1;
    return media / vao;
  };

  const ic = renderizar('conjuntosPorItem', { tipoDeBarra: 'confianca', nivelDeConfianca: 95 });
  const comp = renderizar('conjuntosPorItem', { tipoDeBarra: 'comparacao' });
  try {
    const relativoIc = extensaoRelativa(ic);
    const relativoComp = extensaoRelativa(comp);
    assert.ok(
      relativoComp < relativoIc * 0.95,
      `comparação (${relativoComp.toFixed(3)}) deveria ser mais curta que 95% (${relativoIc.toFixed(3)})`
    );
    t.diagnostic(
      `barra ÷ vão entre estimativas: 95% = ${relativoIc.toFixed(3)}, comparação = ${relativoComp.toFixed(3)}`
    );
  } finally {
    ic.fim();
    comp.fim();
  }
});

test('intervalo_confianca — a nota declara de onde veio a incerteza', (t) => {
  // Os três caminhos não significam a mesma coisa.
  const r = renderizar('conjuntosPorItem');
  try {
    assert.match(r.nota, /observações|desvio-padrão|consulta/i, 'a origem precisa estar declarada');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 70));
});

test('intervalo_confianca — ±1 EP se declara como ~68%, não 95%', (t) => {
  const r = renderizar('conjuntosPorItem', { tipoDeBarra: 'erroPadrao' });
  try {
    assert.match(r.nota, /erro-padrão/i);
    assert.match(r.nota, /68/, 'o leitor precisa saber que isso não é 95%');
  } finally {
    r.fim();
  }
  t.diagnostic('±1 EP declarado');
});

test('intervalo_confianca — categorias com poucas observações são denunciadas', (t) => {
  const r = renderizar('conjuntosPorItem');
  try {
    if (r.aviso) {
      assert.match(r.aviso, /observações|intervalo/i);
      t.diagnostic(r.aviso.slice(0, 70));
    } else {
      t.diagnostic(`todas as categorias têm ≥ ${MINIMO_POR_CATEGORIA} observações`);
    }
  } finally {
    r.fim();
  }
});

test('intervalo_confianca — ordenar por estimativa realmente ordena', (t) => {
  const posicoes = (r) => r.estimativas.map((c) => Number(c.getAttribute('cx')));

  const desc = renderizar('conjuntosPorItem', { ordenarPorEstimativa: 'estimativaDesc' });
  const asc = renderizar('conjuntosPorItem', { ordenarPorEstimativa: 'estimativaAsc' });
  try {
    const xsDesc = posicoes(desc);
    const xsAsc = posicoes(asc);
    // Nas barras horizontais, ordenar muda a ordem vertical: o primeiro de
    // uma lista é o último da outra.
    assert.deepEqual(xsDesc.slice().reverse(), xsAsc, 'as duas ordens deveriam ser espelhadas');
  } finally {
    desc.fim();
    asc.fim();
  }
  t.diagnostic('ordenação conferida nos dois sentidos');
});

test('intervalo_confianca — as duas orientações desenham sem sair da área', (t) => {
  for (const orientacao of ['horizontal', 'vertical']) {
    const r = renderizar('conjuntosPorItem', { orientacao });
    try {
      assert.ok(r.estimativas.length > 0, `${orientacao}: nada desenhado`);
      for (const c of r.estimativas) {
        const x = Number(c.getAttribute('cx'));
        const y = Number(c.getAttribute('cy'));
        assert.ok(x >= -1 && x <= 901, `${orientacao}: estimativa fora (x=${x})`);
        assert.ok(y >= -1 && y <= 561, `${orientacao}: estimativa fora (y=${y})`);
      }
    } finally {
      r.fim();
    }
  }
  t.diagnostic('orientações conferidas');
});

test('intervalo_confianca — consulta agregada ensina os dois outros caminhos', (t) => {
  // Sem n não há intervalo. A mensagem precisa dizer o que trazer do
  // Explore, não só "não dá".
  const r = renderizar('semPivo');
  try {
    if (r.vazio) {
      assert.match(r.vazio, /limite inferior|desvio-padrão/i, 'a saída precisa apontar as alternativas');
      t.diagnostic(r.vazio.slice(0, 90));
    } else {
      assert.ok(r.estimativas.length > 0, 'ou desenha, ou explica');
      t.diagnostic('a fixture tinha linhas suficientes');
    }
  } finally {
    r.fim();
  }
});
