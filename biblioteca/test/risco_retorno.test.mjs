/**
 * risco_retorno.test.mjs — testes do Risco x Retorno.
 *
 * A leitura certa deste gráfico é a INCLINAÇÃO (retorno por unidade de
 * risco), não a altura. Se o Sharpe estiver errado, o gráfico aponta o
 * ativo errado como melhor — e parece igualmente convincente.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { calcularSharpe } from '../src/charts/risco_retorno/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// BL_DIST permite rodar contra outro diretório de bundles (reprodução).
const BUNDLE = join(process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist'), 'risco_retorno.js');

const perto = (a, b) => Math.abs(a - b) < 1e-9;

function renderizar(nomeDaFixture, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.risco_retorno;
  assert.ok(definicao, 'risco_retorno não se registrou');

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

  const textos = Array.from(palco.querySelectorAll('text')).map((t) => t.textContent);
  return {
    amb,
    palco,
    textos,
    linhas: Array.from(palco.querySelectorAll('line')),
    circulos: Array.from(palco.querySelectorAll('circle')),
    fim: () => amb.restaurar(),
  };
}

test('risco_retorno — Sharpe é (retorno − taxa livre) ÷ risco', (t) => {
  const pontos = [
    { rotulo: 'A', x: 0.1, y: 0.15 },
    { rotulo: 'B', x: 0.2, y: 0.22 },
    { rotulo: 'C', x: 0.05, y: 0.08 },
  ];
  const { melhor } = calcularSharpe(pontos, 0.03);

  assert.ok(perto(pontos[0].sharpe, 1.2), 'A: (0,15 − 0,03) / 0,10 = 1,2');
  assert.ok(perto(pontos[1].sharpe, 0.95), 'B: (0,22 − 0,03) / 0,20 = 0,95');
  assert.ok(perto(pontos[2].sharpe, 1.0), 'C: (0,08 − 0,03) / 0,05 = 1,0');
  assert.equal(melhor.rotulo, 'A', 'o melhor Sharpe não é o de maior retorno');
  t.diagnostic(`sharpe: ${pontos.map((p) => `${p.rotulo}=${p.sharpe.toFixed(2)}`).join(', ')}`);
});

test('risco_retorno — o maior retorno não ganha automaticamente', (t) => {
  // É exatamente o engano que o gráfico existe para evitar: B rende mais,
  // mas arrisca o dobro.
  const pontos = [
    { rotulo: 'Conservador', x: 0.05, y: 0.1 },
    { rotulo: 'Agressivo', x: 0.4, y: 0.25 },
  ];
  const { melhor } = calcularSharpe(pontos, 0);
  assert.equal(melhor.rotulo, 'Conservador', 'retorno por unidade de risco, não retorno puro');
  assert.ok(pontos[1].y > pontos[0].y, 'o perdedor de fato rende mais em termos absolutos');
  t.diagnostic(`${melhor.rotulo} vence com Sharpe ${melhor.sharpe.toFixed(2)}`);
});

test('risco_retorno — risco zero ou negativo fica sem Sharpe', (t) => {
  // A conta divide pelo risco; inventar um número aqui seria pior do que
  // deixar o ponto sem índice.
  const pontos = [
    { rotulo: 'Normal', x: 0.1, y: 0.2 },
    { rotulo: 'SemRisco', x: 0, y: 0.03 },
    { rotulo: 'Negativo', x: -0.1, y: 0.05 },
  ];
  const { melhor, semSharpe } = calcularSharpe(pontos, 0);

  assert.equal(pontos[1].sharpe, null);
  assert.equal(pontos[2].sharpe, null);
  assert.equal(semSharpe, 2, 'os dois precisam ser contados para virar aviso');
  assert.equal(melhor.rotulo, 'Normal', 'quem não tem índice não disputa o melhor');
  t.diagnostic(`${semSharpe} sem índice`);
});

test('risco_retorno — a taxa livre de risco desloca o ranking', (t) => {
  const montar = () => [
    { rotulo: 'A', x: 0.1, y: 0.12 },
    { rotulo: 'B', x: 0.3, y: 0.3 },
  ];

  // Sem taxa, A vence: 0,12/0,10 = 1,2 contra 0,30/0,30 = 1,0.
  const semTaxa = montar();
  assert.equal(calcularSharpe(semTaxa, 0).melhor.rotulo, 'A', 'sem taxa: 1,2 contra 1,0');

  // Com 10%, a liderança VIRA: A cai para 0,2 e B sobe para 0,667, porque
  // o retorno de A mal supera a taxa livre. É por isso que a taxa não é
  // um detalhe de configuração.
  const comTaxa = montar();
  assert.equal(
    calcularSharpe(comTaxa, 0.1).melhor.rotulo,
    'B',
    'com taxa de 10%: 0,2 contra 0,667 — a liderança troca'
  );

  const taxaAlta = montar();
  calcularSharpe(taxaAlta, 0.5);
  assert.ok(taxaAlta[0].sharpe < 0, 'acima da taxa livre, o Sharpe fica negativo');
  t.diagnostic('sensibilidade à taxa livre conferida');
});

test('risco_retorno — desenha a reta de Sharpe e destaca o melhor', (t) => {
  const r = renderizar('semPivo');
  try {
    assert.ok(
      r.textos.some((texto) => /Melhor Sharpe/.test(texto)),
      'a reta precisa vir rotulada com o índice'
    );
    assert.ok(r.palco.querySelector('.qd-ponto.bl-marcador'), 'os pontos continuam desenhados');
    assert.ok(r.palco.querySelector('.rr-destaque'), 'faltou o destaque do melhor Sharpe');
    assert.ok(
      r.linhas.some((linha) => (linha.getAttribute('stroke-dasharray') || '').includes('6')),
      'faltou a reta tracejada de Sharpe'
    );
    for (const linha of r.linhas) {
      for (const atributo of ['x1', 'y1', 'x2', 'y2']) {
        assert.ok(
          Number.isFinite(Number(linha.getAttribute(atributo))),
          `coordenada ${atributo} inválida na reta`
        );
      }
    }
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('reta e destaque conferidos');
});

test('risco_retorno — os eixos vêm nomeados', (t) => {
  // Num gráfico de risco e retorno, saber qual eixo é qual não é detalhe.
  const r = renderizar('semPivo');
  try {
    assert.ok(r.textos.includes('Risco'), 'faltou o título do eixo X');
    assert.ok(r.textos.includes('Retorno'), 'faltou o título do eixo Y');
  } finally {
    r.fim();
  }
  t.diagnostic('títulos dos eixos conferidos');
});

test('risco_retorno — desligar a reta não quebra o gráfico', (t) => {
  const r = renderizar('semPivo', { mostrarRetaDeSharpe: false, destacarMelhorSharpe: false });
  try {
    assert.ok(
      !r.textos.some((texto) => /Melhor Sharpe/.test(texto)),
      'com a opção desligada, o rótulo não deveria aparecer'
    );
    assert.ok(r.palco.querySelector('.qd-ponto.bl-marcador'), 'a dispersão continua');
    assert.equal(r.palco.querySelector('.rr-destaque'), null, 'destaque desligado');
    assert.equal(r.amb.chamadasDeApi.erros.length, 0);
  } finally {
    r.fim();
  }
  t.diagnostic('modo sem reta conferido');
});
