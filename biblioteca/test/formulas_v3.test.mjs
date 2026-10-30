/**
 * formulas_v3.test.mjs — interpretador de fórmulas (melhorias v3, 5.4).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { compilarFormula, avaliarFormula, criarResolvedor, LIMITES } from '../src/core/formulas.js';

const linha = { qty: 25, code: 'ABCBLACKXX', preco: 2.5, vazio: null, zero: 0, nome: 'Café' };
const resolver = criarResolvedor(
  Object.entries(linha).map(([k, v]) => ({ nomes: [k, `pedidos.${k}`], valor: () => v }))
);
const calc = (f) => {
  const r = avaliarFormula(f, resolver);
  if (r.erro) throw new Error(`erro inesperado em ${f}: ${r.erro}`);
  return r.valor;
};
const erro = (f) => avaliarFormula(f, resolver).erro;

test('precedência e associatividade', () => {
  assert.equal(calc('1 + 2 * 3'), 7);
  assert.equal(calc('(1 + 2) * 3'), 9);
  assert.equal(calc('10 - 4 - 3'), 3);
  assert.equal(calc('2 * 3 % 4'), 2);
  assert.equal(calc('-2 * 3'), -6);
  assert.equal(calc('- -2'), 2);
  assert.equal(calc('1 + 2 > 2 AND 3 < 4'), true);
  assert.equal(calc('NOT 1 > 2 OR FALSE'), true);
  assert.equal(calc('TRUE OR FALSE AND FALSE'), true, 'AND é mais forte que OR');
  assert.equal(calc('1.5e2 + .5'), 150.5);
});

test('campos: nome, nome completo, sem diferenciar maiúsculas', () => {
  assert.equal(calc('${qty} * 2'), 50);
  assert.equal(calc('${pedidos.qty} + ${PRECO}'), 27.5);
  assert.match(erro('${nao_existe} + 1'), /campo não encontrado: nao_existe/);
});

test('exemplo do pedido: comissão escalonada com IFS', () => {
  const f = 'IFS(${qty}<=10, 1*${qty}, ${qty}<=30, 2*${qty}, ${qty}<=50, 3*${qty}, ${qty}<=70, 4*${qty}, 5*${qty})';
  const com = (q) => avaliarFormula(f, criarResolvedor([{ nomes: ['qty'], valor: () => q }])).valor;
  assert.equal(com(5), 5);
  assert.equal(com(10), 10);
  assert.equal(com(25), 50);
  assert.equal(com(50), 150);
  assert.equal(com(70), 280);
  assert.equal(com(71), 355);
});

test('exemplo do pedido: IF + CONTAINS', () => {
  assert.equal(calc('IF(CONTAINS(${code}, "BLACK"), "Black", "Other")'), 'Black');
  assert.equal(calc('IF(CONTAINS(${code}, "WHITE"), "White", "Other")'), 'Other');
});

test('texto: aspas, aspas escapadas, comparação e funções', () => {
  assert.equal(calc('"diz ""oi"""'), 'diz "oi"');
  assert.equal(calc('"a" = "a"'), true);
  assert.equal(calc('"a" <> "b"'), true);
  assert.equal(calc('LEFT(${code}, 3)'), 'ABC');
  assert.equal(calc('RIGHT(${code}, 2)'), 'XX');
  assert.equal(calc('MID(${code}, 4, 5)'), 'BLACK');
  assert.equal(calc('UPPER(${nome})'), 'CAFÉ');
  assert.equal(calc('lower(${nome})'), 'café', 'função sem diferenciar maiúsculas');
  assert.equal(calc('LEN(${nome})'), 4);
  assert.equal(calc('CONCAT(${code}, "-", ${qty})'), 'ABCBLACKXX-25');
  assert.equal(calc('TEXT(${preco}, 2)'), '2.50');
  assert.equal(calc('TEXT(${preco}, "0.000")'), '2.500');
  assert.equal(calc('CASE(${qty}, 10, "dez", 25, "vinte e cinco", "outro")'), 'vinte e cinco');
});

test('números: ROUND, ABS, MIN, MAX, SUM, AVG (mesma linha)', () => {
  assert.equal(calc('ROUND(2.345, 2)'), 2.35);
  assert.equal(calc('ROUND(2.5)'), 3);
  assert.equal(calc('ABS(-3)'), 3);
  assert.equal(calc('MIN(${qty}, ${preco}, 7)'), 2.5);
  assert.equal(calc('MAX(${qty}, ${preco}, 7)'), 25);
  assert.equal(calc('SUM(${qty}, ${preco}, ${vazio})'), 27.5);
  assert.equal(calc('AVG(${qty}, ${preco}, ${vazio})'), 13.75);
});

test('nulos: propagam na conta, comparação é falsa, COALESCE e ISBLANK', () => {
  assert.equal(calc('${vazio} + 1'), null);
  assert.equal(calc('${vazio} > 0'), false);
  assert.equal(calc('${vazio} = 0'), false);
  assert.equal(calc('ISBLANK(${vazio})'), true);
  assert.equal(calc('ISBLANK(${zero})'), false);
  assert.equal(calc('COALESCE(${vazio}, ${zero}, 9)'), 0);
  assert.equal(calc('IF(${vazio}, "s", "n")'), 'n');
  assert.equal(calc('SUM(${vazio})'), null);
  assert.equal(calc('LEN(${vazio})'), 0);
});

test('divisão por zero e outros erros viram mensagem (sem exceção)', () => {
  assert.match(erro('1 / 0'), /divisão por zero/);
  assert.match(erro('${qty} % ${zero}'), /divisão por zero/);
  assert.match(erro('1 +'), /incompleta/);
  assert.match(erro('(1 + 2'), /falta "\)"/);
  assert.match(erro('FOO(1)'), /função desconhecida "FOO"/);
  assert.match(erro('qty + 1'), /nome desconhecido/);
  assert.match(erro('IF(1)'), /IF espera/);
  assert.match(erro('"abc'), /aspas/);
  assert.match(erro('${qty'), /"}"/);
  assert.match(erro('1 ; 2'), /caractere inesperado/);
  assert.match(erro('"x" * 2'), /não é número/);
  assert.match(erro(''), /vazia/);
});

test('segurança: limites de tamanho e profundidade; nada fora dos campos', () => {
  assert.match(erro('1+'.repeat(LIMITES.tamanho) + '1'), /mais de/);
  assert.match(erro('('.repeat(60) + '1' + ')'.repeat(60)), /aninhada|grande/);
  // Nomes de JavaScript não existem aqui.
  assert.match(erro('constructor'), /nome desconhecido/);
  assert.match(erro('${__proto__}'), /campo não encontrado/);
  assert.match(erro('this'), /nome desconhecido/);
  const c = compilarFormula('IF(${a} > 1, ${b}, ${c})');
  assert.deepEqual(c.campos.sort(), ['a', 'b', 'c']);
});
