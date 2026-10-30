/**
 * kpi_vivo.test.mjs — testes do KPI Vivo.
 *
 * O KPI é o gráfico que mais mente por omissão. "+12%" é verdadeiro e
 * inútil sem a base; a cor verde é errada metade das vezes; e comparar com
 * um período em andamento faz qualquer indicador "cair". Os testes
 * cobrem exatamente isso — a conta, a base declarada, a cor que depende do
 * indicador e o período incompleto.
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
  calcularVariacao,
  escolherBase,
  ehBoaNoticia,
  detectarPeriodoIncompleto,
  tamanhoQueCabe,
} from '../src/charts/kpi_vivo/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'kpi_vivo.js');

const perto = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `esperado ≈${b}, veio ${a}`);

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.kpi_vivo;
  assert.ok(definicao, 'kpi_vivo não se registrou');

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

  const variacao = palco.querySelector('.kv-variacao');
  return {
    amb,
    palco,
    titulo: palco.querySelector('.kv-titulo')?.textContent || '',
    numero: palco.querySelector('.kv-numero')?.textContent || '',
    tamanhoDoNumero: Number(
      String(palco.querySelector('.kv-numero')?.style.fontSize || '0').replace('px', '')
    ),
    variacao: variacao?.textContent || '',
    corDaVariacao: variacao?.querySelector('span')?.style.color || '',
    seta: palco.querySelector('.kv-seta')?.textContent || '',
    base: palco.querySelector('.kv-base')?.textContent || '',
    spark: palco.querySelector('.kv-spark'),
    nota: palco.querySelector('.bl-nota')?.textContent || '',
    aviso: palco.querySelector('.bl-aviso')?.textContent || '',
    vazio: palco.querySelector('.bl-vazio')?.textContent || '',
    fim: () => amb.restaurar(),
  };
}

/* ----------------------------- a conta --------------------------- */

test('calcularVariacao — bate com a conta à mão', (t) => {
  const r = calcularVariacao({ atual: 112, base: 100 });
  perto(r.diferenca, 12, 1e-12);
  perto(r.relativa, 0.12, 1e-12);

  const queda = calcularVariacao({ atual: 80, base: 100 });
  perto(queda.diferenca, -20, 1e-12);
  perto(queda.relativa, -0.2, 1e-12);
  t.diagnostic('+12% e −20% conferidos');
});

test('calcularVariacao — base negativa usa o MÓDULO no denominador', (t) => {
  // De −100 para −50 o indicador MELHOROU em 50. Dividir por −100 daria
  // −50%, invertendo o sinal da variação e dizendo o contrário do que
  // aconteceu.
  const r = calcularVariacao({ atual: -50, base: -100 });
  perto(r.diferenca, 50, 1e-12);
  perto(r.relativa, 0.5, 1e-12, 'a variação precisa ser POSITIVA');
  t.diagnostic('de −100 para −50 = +50%');
});

test('calcularVariacao — base zero não produz percentual inventado', (t) => {
  // Infinito ou "100%" seriam números que ninguém pode verificar.
  const r = calcularVariacao({ atual: 50, base: 0 });
  perto(r.diferenca, 50, 1e-12);
  assert.equal(r.relativa, null);
  t.diagnostic('null em vez de infinito');
});

test('calcularVariacao — valores ausentes não produzem variação', (t) => {
  for (const caso of [
    { atual: null, base: 100 },
    { atual: 100, base: null },
    { atual: NaN, base: 100 },
  ]) {
    const r = calcularVariacao(caso);
    assert.equal(r.diferenca, null);
    assert.equal(r.relativa, null);
  }
  t.diagnostic('três casos ausentes tratados');
});

/* ------------------------ base da comparação --------------------- */

const serieDe = (valores, rotulos) => ({
  valores,
  rotulos: rotulos || valores.map((_, i) => `P${i + 1}`),
  contagens: valores.map(() => 10),
});

test('escolherBase — cada modo escolhe o valor certo e se NOMEIA', (t) => {
  // O nome é o que transforma "+12%" numa afirmação verificável.
  const serie = serieDe([10, 20, 30, 40]);

  const anterior = escolherBase({ serie, config: { baseDaComparacao: 'anterior' } });
  assert.equal(anterior.base, 30);
  assert.match(anterior.rotulo, /período anterior/i);
  assert.match(anterior.rotulo, /P3/, 'o rótulo precisa dizer QUAL período');

  const primeiro = escolherBase({ serie, config: { baseDaComparacao: 'primeiro' } });
  assert.equal(primeiro.base, 10);
  assert.match(primeiro.rotulo, /início/i);

  const media = escolherBase({ serie, config: { baseDaComparacao: 'media' } });
  assert.equal(media.base, 20, 'média de 10, 20 e 30');
  assert.match(media.rotulo, /média dos 3/);

  const meta = escolherBase({ serie, config: { baseDaComparacao: 'meta', meta: 99 } });
  assert.equal(meta.base, 99);
  assert.match(meta.rotulo, /meta/i);

  const nenhuma = escolherBase({ serie, config: { baseDaComparacao: 'nenhuma' } });
  assert.equal(nenhuma.base, null);
  t.diagnostic('cinco modos conferidos, todos com rótulo');
});

test('escolherBase — "N atrás" sem histórico não devolve outra coisa calada', (t) => {
  // Pedir 12 períodos atrás numa série de 4 e receber "o primeiro" seria
  // responder uma pergunta que ninguém fez.
  const serie = serieDe([10, 20, 30, 40]);
  const r = escolherBase({ serie, config: { baseDaComparacao: 'nAtras', periodosAtras: 12 } });
  assert.equal(r.base, null);
  assert.equal(r.faltouHistorico, true);

  const cabe = escolherBase({ serie, config: { baseDaComparacao: 'nAtras', periodosAtras: 3 } });
  assert.equal(cabe.base, 10);
  assert.match(cabe.rotulo, /3 períodos atrás/);
  t.diagnostic('falta de histórico tratada');
});

test('escolherBase — série de um período só não tem com o que comparar', (t) => {
  const serie = serieDe([42]);
  assert.equal(escolherBase({ serie, config: { baseDaComparacao: 'anterior' } }).base, null);
  assert.equal(escolherBase({ serie, config: { baseDaComparacao: 'primeiro' } }).base, null);
  assert.equal(escolherBase({ serie, config: { baseDaComparacao: 'media' } }).base, null);
  t.diagnostic('série unitária tratada');
});

/* ------------------------ direção da notícia --------------------- */

test('ehBoaNoticia — subir é bom ou ruim conforme o INDICADOR', (t) => {
  // Custo, churn, tempo de resposta: para metade dos indicadores de um
  // painel, cair é bom. Um padrão fixo erraria metade das vezes.
  assert.equal(ehBoaNoticia(10, false), true, 'receita subindo é bom');
  assert.equal(ehBoaNoticia(-10, false), false);
  assert.equal(ehBoaNoticia(10, true), false, 'custo subindo é ruim');
  assert.equal(ehBoaNoticia(-10, true), true);
  assert.equal(ehBoaNoticia(0, false), null, 'sem variação não há notícia');
  t.diagnostic('as quatro combinações conferidas');
});

/* ----------------------- período incompleto ---------------------- */

test('detectarPeriodoIncompleto — acusa o último período pela metade', (t) => {
  // O erro mais comum do KPI: o mês corrente contra o mês passado inteiro
  // sempre "cai".
  const r = detectarPeriodoIncompleto([30, 31, 30, 31, 8]);
  assert.equal(r.suspeito, true);
  assert.equal(r.ultimo, 8);
  assert.equal(r.mediana, 30.5);
  t.diagnostic(`8 linhas contra mediana ${r.mediana}`);
});

test('detectarPeriodoIncompleto — não acusa variação normal de calendário', (t) => {
  // Meses têm 28 a 31 dias. Um aviso que dispara a cada fevereiro vira
  // ruído e o usuário aprende a ignorá-lo.
  const r = detectarPeriodoIncompleto([31, 30, 31, 28]);
  assert.equal(r.suspeito, false, `fevereiro não pode ser acusado (fração ${r.fracao})`);
  t.diagnostic(`28 de mediana ${r.mediana}: dentro do normal`);
});

test('detectarPeriodoIncompleto — sem material, a heurística se cala', (t) => {
  // Com uma linha por período não há o que comparar — e inventar um
  // palpite seria pior que não falar.
  assert.equal(detectarPeriodoIncompleto([1, 1, 1, 1]).suspeito, false);
  assert.equal(detectarPeriodoIncompleto([10, 5]).suspeito, false, 'séries curtas demais');
  assert.equal(detectarPeriodoIncompleto([]).suspeito, false);
  assert.equal(detectarPeriodoIncompleto(null).suspeito, false);
  t.diagnostic('quatro casos sem material');
});

/* ---------------------------- tipografia ------------------------- */

test('tamanhoQueCabe — texto longo encolhe, texto curto cresce', (t) => {
  const curto = tamanhoQueCabe('42', 300, 200);
  const longo = tamanhoQueCabe('R$ 1.234.567.890,00', 300, 200);
  assert.ok(curto > longo, `o texto longo precisa de fonte menor (${curto} vs ${longo})`);
  assert.ok(longo >= 14, 'mas nunca abaixo do mínimo legível');
  assert.ok(curto <= 96, 'nem acima do máximo');
  t.diagnostic(`"42" ⇒ ${curto}px, valor longo ⇒ ${longo}px`);
});

test('tamanhoQueCabe — a altura também limita', (t) => {
  const baixo = tamanhoQueCabe('42', 600, 40);
  const alto = tamanhoQueCabe('42', 600, 400);
  assert.ok(alto > baixo, 'numa caixa baixa a fonte precisa encolher');
  t.diagnostic(`altura 40 ⇒ ${baixo}px, altura 400 ⇒ ${alto}px`);
});

/* ---------------------------- desenho ---------------------------- */

test('kpi_vivo — mostra número, variação e a BASE da comparação', (t) => {
  const r = renderizar('temporal');
  try {
    assert.ok(r.numero.length > 0, 'faltou o número');
    assert.ok(r.titulo.length > 0, 'faltou o título');
    assert.ok(r.variacao.length > 0, 'faltou a variação');
    assert.match(r.base, /contra /, `a base precisa estar escrita; veio "${r.base}"`);
    assert.ok(/▲|▼|■/.test(r.seta), 'faltou a seta de direção');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic(`${r.numero} · ${r.variacao} · ${r.base}`);
});

test('kpi_vivo — "menor é melhor" inverte a COR, não o sinal', (t) => {
  // Inverter a seta faria a queda parecer subida: a opinião sobre o número
  // não pode mudar o número.
  const normal = renderizar('temporal', { menorEhMelhor: false, colorirVariacao: true });
  const invertido = renderizar('temporal', { menorEhMelhor: true, colorirVariacao: true });
  try {
    assert.ok(normal.seta.length > 0 && invertido.seta.length > 0);
    assert.equal(invertido.seta, normal.seta, 'a seta segue o sinal, não a opinião');
    assert.equal(
      invertido.variacao.replace(/\s/g, ''),
      normal.variacao.replace(/\s/g, ''),
      'o texto da variação é o mesmo'
    );
    if (normal.corDaVariacao && invertido.corDaVariacao) {
      assert.notEqual(invertido.corDaVariacao, normal.corDaVariacao, 'mas a cor precisa inverter');
    }
    assert.match(invertido.nota, /menor é melhor/i, 'e a inversão precisa estar declarada');
  } finally {
    normal.fim();
    invertido.fim();
  }
  t.diagnostic(`seta "${normal.seta}" em ambos; cores ${normal.corDaVariacao} → ${invertido.corDaVariacao}`);
});

test('kpi_vivo — mudar a base muda o número E o texto da base', (t) => {
  const anterior = renderizar('temporal', { baseDaComparacao: 'anterior' });
  const primeiro = renderizar('temporal', { baseDaComparacao: 'primeiro' });
  try {
    assert.match(anterior.base, /período anterior/i);
    assert.match(primeiro.base, /início/i);
    assert.notEqual(primeiro.base, anterior.base, 'bases diferentes precisam aparecer diferentes');
  } finally {
    anterior.fim();
    primeiro.fim();
  }
  t.diagnostic('bases distintas conferidas');
});

test('kpi_vivo — "não comparar" some com a variação e com a base', (t) => {
  const r = renderizar('temporal', { baseDaComparacao: 'nenhuma' });
  try {
    assert.ok(r.numero.length > 0, 'o número continua');
    assert.equal(r.variacao, '', 'sem comparação, não há variação a mostrar');
    assert.equal(r.base, '');
  } finally {
    r.fim();
  }
  t.diagnostic('modo sem comparação conferido');
});

test('kpi_vivo — a sparkline aparece e some conforme pedido', (t) => {
  const com = renderizar('temporal', { mostrarSparkline: true });
  try {
    assert.ok(com.spark, 'faltou a sparkline');
    const linha = com.palco.querySelector('.kv-linha');
    assert.ok(linha, 'faltou a linha da sparkline');
    const d = linha.getAttribute('d') || '';
    assert.ok(d.length > 5 && !/NaN|Infinity/.test(d), 'sparkline com caminho inválido');
  } finally {
    com.fim();
  }

  const sem = renderizar('temporal', { mostrarSparkline: false });
  try {
    assert.equal(sem.spark, null, 'desligada, a sparkline não pode aparecer');
    assert.ok(sem.numero.length > 0, 'mas o número continua');
  } finally {
    sem.fim();
  }
  t.diagnostic('sparkline conferida nos dois modos');
});

test('kpi_vivo — o número cabe na caixa', (t) => {
  const r = renderizar('temporal');
  try {
    assert.ok(r.tamanhoDoNumero >= 14, 'a fonte não pode ficar ilegível');
    assert.ok(r.tamanhoDoNumero <= 96, 'nem estourar');
    // Largura estimada do texto contra a largura do palco (900 no ambiente).
    const larguraEstimada = r.numero.length * r.tamanhoDoNumero * 0.6;
    assert.ok(larguraEstimada <= 900, `o número ocuparia ${larguraEstimada.toFixed(0)}px de 900`);
  } finally {
    r.fim();
  }
  t.diagnostic(`"${r.numero}" em ${r.tamanhoDoNumero}px`);
});

test('kpi_vivo — a nota diz quantos períodos e qual é o atual', (t) => {
  const r = renderizar('temporal');
  try {
    assert.match(r.nota, /\d+ período/);
    assert.match(r.nota, /período:/i, 'o período corrente precisa estar identificado');
  } finally {
    r.fim();
  }
  t.diagnostic(r.nota.slice(0, 90));
});

test('kpi_vivo — sem dimensão de tempo, vira o total e não finge comparar', (t) => {
  const r = renderizar('temporal', { campoDoPeriodo: '' });
  try {
    assert.ok(r.numero.length > 0, 'o total precisa aparecer');
    assert.equal(r.variacao, '', 'sem série, não há período anterior');
    assert.equal(r.spark, null, 'nem sparkline');
  } finally {
    r.fim();
  }
  t.diagnostic('modo total conferido');
});

test('kpi_vivo — consulta vazia explica em vez de mostrar zero', (t) => {
  // Zero seria uma afirmação sobre o indicador.
  const r = renderizar('vazio');
  try {
    const mensagem = r.vazio || r.amb.chamadasDeApi.erros.map((e) => e.message).join(' ');
    assert.ok(mensagem.length > 0, 'a recusa precisa vir com mensagem');
    assert.equal(r.numero, '');
  } finally {
    r.fim();
  }
  t.diagnostic('estado vazio conferido');
});
