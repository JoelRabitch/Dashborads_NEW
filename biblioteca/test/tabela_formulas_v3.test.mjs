/**
 * tabela_formulas_v3.test.mjs — colunas calculadas na tabela_completa
 * (melhorias v3, 5.4). Fixtures sintéticas.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = process.env.BL_DIST
  ? join(process.env.BL_DIST, 'tabela_completa.js')
  : join(resolve(__dirname, '..'), 'dist', 'tabela_completa.js');

const COMISSAO = 'IFS(${qty}<=10, 1*${qty}, ${qty}<=30, 2*${qty}, ${qty}<=50, 3*${qty}, ${qty}<=70, 4*${qty}, 5*${qty})';

function abrir(ajustes, fixture = 'codigosSinteticos') {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.tabela_completa;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = FIXTURES[fixture]();
  const cfg = () => Object.assign(configPadrao(definicao), { animarEntradaDasLinhas: false }, ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  const cabecalhos = () => Array.from(palco.querySelectorAll('.tc-tabela thead th')).map((th) => th.textContent.trim());
  const coluna = (rotulo) => {
    const ths = Array.from(palco.querySelectorAll('.tc-tabela thead tr:last-child th'));
    const i = ths.findIndex((th) => th.textContent.trim().startsWith(rotulo));
    assert.ok(i >= 0, `coluna "${rotulo}" não existe: ${cabecalhos().join(' | ')}`);
    return Array.from(palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)')).map((tr) => tr.children[i]);
  };
  return { amb, palco, cabecalhos, coluna, definicao, fim: () => amb.restaurar() };
}

test('5.4 — coluna calculada: comissão escalonada (IFS) e texto (IF + CONTAINS)', () => {
  const r = abrir({
    calc1Nome: 'Comissão',
    calc1Formula: COMISSAO,
    calc1Casas: 0,
    calc2Nome: 'Linha',
    calc2Formula: 'IF(CONTAINS(${codigo}, "BLACK"), "Black", "Other")',
    calc2Formato: 'texto',
  });
  try {
    // qty: 5, 12, 31, 55, 70, 0 → 5, 24, 93, 220, 280, 0
    assert.deepEqual(r.coluna('Comissão').map((td) => td.textContent), ['5', '24', '93', '220', '280', '0']);
    assert.deepEqual(r.coluna('Linha').map((td) => td.textContent), ['Black', 'Other', 'Black', 'Other', 'Black', 'Other']);
  } finally {
    r.fim();
  }
});

test('5.4 — erro de fórmula aparece na célula e num aviso, sem derrubar a tabela', () => {
  const r = abrir({ calc1Nome: 'Ruim', calc1Formula: '${nao_existe} * 2', calc3Nome: 'Quebrada', calc3Formula: 'IF(1' });
  try {
    assert.match(r.coluna('Ruim')[0].textContent, /^#ERRO: campo não encontrado: nao_existe/);
    assert.match(r.coluna('Quebrada')[0].textContent, /^#ERRO: /);
    assert.match(r.palco.querySelector('.bl-aviso').textContent, /Fórmula 3/);
    assert.equal(r.coluna('Código').length, 6, 'a tabela continua com as linhas');
  } finally {
    r.fim();
  }
});

test('5.4 — fórmula como regra: colore a linha ou só a célula quando verdadeira', () => {
  const linha = abrir({ calc1Formula: '${qty} > 50', calc1Uso: 'linha', calc1Cor: '#FF0000' });
  const celula = abrir({ calc1Formula: 'CONTAINS(${codigo}, "BLACK")', calc1Uso: 'celula', calc1Alvo: 'Código', calc1Cor: '#00FF00' });
  try {
    assert.ok(!linha.cabecalhos().some((t) => t.startsWith('Fórmula 1')), 'uso "colorir" não cria coluna');
    const cor = (td) => td.style.background.replace(/\s/g, '');
    const preco = linha.coluna('Preço');
    assert.deepEqual(preco.map((td) => cor(td) === 'rgb(255,0,0)'), [false, false, false, true, true, false]);
    const cod = celula.coluna('Código');
    assert.deepEqual(cod.map((td) => cor(td) === 'rgb(0,255,0)'), [true, false, true, false, true, false]);
    assert.ok(celula.coluna('Descrição').every((td) => cor(td) !== 'rgb(0,255,0)'), 'colorir células só na coluna alvo');
  } finally {
    linha.fim();
    celula.fim();
  }
});

test('5.4 — linha de totais: recalcula sobre os totais ou fica vazia', () => {
  const r = abrir({
    calc1Nome: 'Dobro',
    calc1Formula: '${qty} * 2',
    calc1Casas: 0,
    calc2Nome: 'Vazio',
    calc2Formula: '${qty} * 2',
    calc2Total: 'vazio',
    calc3Nome: 'ComTexto',
    calc3Formula: 'LEN(${codigo})',
  });
  try {
    const rodape = Array.from(r.palco.querySelectorAll('.tc-tabela tfoot td')).map((td) => td.textContent);
    const ths = Array.from(r.palco.querySelectorAll('.tc-tabela thead tr:last-child th')).map((th) => th.textContent.trim());
    const em = (rotulo) => rodape[ths.findIndex((t) => t.startsWith(rotulo))];
    assert.equal(em('Dobro'), '346', 'soma de qty = 173 → 346');
    assert.equal(em('Vazio'), '');
    assert.equal(em('ComTexto'), '', 'dimensão não tem total: vazio');
  } finally {
    r.fim();
  }
});

test('5.4 — pivô: "uma vez por valor do pivô" (campos da mesma coluna) e "só nas colunas sem pivô"', () => {
  const r = abrir({ calc1Nome: 'Ticket', calc1Formula: '${receita} / ${itens}', calc1Casas: 1 }, 'comPivo');
  const s = abrir({ calc1Nome: 'TotalX', calc1Formula: '${receita} / ${itens}', calc1Casas: 1, calc1Pivo: 'semPivo' }, 'comPivo');
  try {
    const ths = Array.from(r.palco.querySelectorAll('.tc-tabela thead tr:last-child th')).map((th) => th.textContent.trim());
    const qtd = ths.filter((t) => t.startsWith('Ticket')).length;
    assert.ok(qtd >= 4, `esperava uma coluna Ticket por valor do pivô, veio ${qtd}`);
    // Confere a conta na primeira linha, primeiro pivô.
    const linha0 = r.palco.querySelector('.tc-tabela tbody tr:not(.tc-espacador)');
    const celulas = Array.from(linha0.children).map((td) => td.textContent);
    const iReceita = ths.findIndex((t) => t.startsWith('Receita'));
    const iItens = ths.findIndex((t) => t.startsWith('Itens'));
    const iTicket = ths.findIndex((t) => t.startsWith('Ticket'));
    const num = (t) => Number(String(t).replace(/[^0-9.-]/g, ''));
    if (celulas[iReceita + 1] !== '' && num(celulas[iItens + 1]) > 0) {
      const esperado = (num(celulas[iReceita + 1]) / num(celulas[iItens + 1])).toFixed(1);
      assert.equal(num(celulas[iTicket + 1]).toFixed(1), esperado);
    }
    // Só sem pivô: uma coluna, que ocupa os dois níveis do cabeçalho.
    const thsS = Array.from(s.palco.querySelectorAll('.tc-tabela thead th')).map((th) => th.textContent.trim());
    assert.equal(thsS.filter((t) => t.startsWith('TotalX')).length, 1);
  } finally {
    r.fim();
    s.fim();
  }
});

test('5.4 — 8 espaços fixos, na aba Dados, sem opções dinâmicas por fórmula', () => {
  const r = abrir({});
  try {
    const ids = Object.keys(r.definicao.options).filter((k) => /^calc\dFormula$/.test(k));
    assert.equal(ids.length, 8);
    for (const id of ids) assert.equal(r.definicao.options[id].section, 'Dados');
  } finally {
    r.fim();
  }
});
