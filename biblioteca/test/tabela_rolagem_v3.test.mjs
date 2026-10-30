/**
 * tabela_rolagem_v3.test.mjs — tabela que "piscava em branco", voltava ao
 * topo e animava ao rolar (melhorias v3, 5.2).
 *
 * jsdom não faz layout. Para reproduzir o defeito, a área de rolagem
 * ganha um `scrollTop` que se comporta como o do navegador: o valor é
 * limitado pela altura do CONTEÚDO naquele instante (soma das alturas das
 * linhas do corpo). Se o código apagar o corpo e medir antes de
 * redesenhar, o navegador corta o scrollTop — é o "volta para o início".
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

/**
 * scrollTop/scrollLeft "de navegador" em todo elemento `.tc-rolagem`
 * (inclusive os recriados por uma atualização de dados).
 */
function simularRolagem(window) {
  const posicoes = new WeakMap();
  const pos = (el) => {
    if (!posicoes.has(el)) posicoes.set(el, { topo: 0, esquerda: 0 });
    return posicoes.get(el);
  };
  const alturaDoConteudo = (el) => {
    let h = 0;
    for (const tr of el.querySelectorAll('tr')) h += parseFloat(tr.style.height) || 30;
    return h;
  };
  const ehRolagem = (el) => el.classList && el.classList.contains('tc-rolagem');
  const limitar = (el, v) => Math.max(0, Math.min(Number(v) || 0, alturaDoConteudo(el) - 400));
  const proto = window.HTMLElement.prototype;
  const alturaOriginal = Object.getOwnPropertyDescriptor(window.Element.prototype, 'clientHeight');
  Object.defineProperty(proto, 'clientHeight', {
    get() {
      return ehRolagem(this) ? 400 : alturaOriginal.get.call(this);
    },
    configurable: true,
  });
  Object.defineProperty(proto, 'scrollTop', {
    get() {
      if (!ehRolagem(this)) return 0;
      const p = pos(this);
      p.topo = limitar(this, p.topo);
      return p.topo;
    },
    set(v) {
      if (ehRolagem(this)) pos(this).topo = limitar(this, v);
    },
    configurable: true,
  });
  Object.defineProperty(proto, 'scrollLeft', {
    get() {
      return ehRolagem(this) ? pos(this).esquerda : 0;
    },
    set(v) {
      if (ehRolagem(this)) pos(this).esquerda = Number(v) || 0;
    },
    configurable: true,
  });
}

function preparar(ajustes = {}) {
  const amb = montarAmbiente();
  simularRolagem(amb.window);
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.tabela_completa;
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  // Valores salvos nos tiles do usuário (4.1).
  const cfg = () =>
    Object.assign(configPadrao(definicao), { animarEntradaDasLinhas: true, quandoAnimar: 'sempre' }, ajustes);
  inst.create(palco, cfg());
  const atualizar = (f = FIXTURES.tabelaLarga()) => {
    inst.updateAsync(f.data, palco, cfg(), f.queryResponse, {}, () => {});
    return palco.querySelector('.tc-rolagem');
  };
  atualizar();
  return { amb, palco, inst, atualizar, fim: () => amb.restaurar() };
}

function rolar(r, rolagem, topo, esquerda) {
  if (topo !== undefined) rolagem.scrollTop = topo;
  if (esquerda !== undefined) rolagem.scrollLeft = esquerda;
  rolagem.dispatchEvent(new r.amb.window.Event('scroll'));
}

const linhasDeDados = (palco) => Array.from(palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)'));

test('5.2 — rolar NÃO volta ao início e mostra as linhas daquela posição', () => {
  const r = preparar();
  try {
    const rolagem = r.atualizar();
    rolar(r, rolagem, 6000);
    assert.equal(rolagem.scrollTop, 6000, 'o scrollTop foi cortado (a tabela voltou para o início)');
    const linhas = linhasDeDados(r.palco);
    assert.ok(linhas.length > 0, 'tabela em branco depois de rolar');
    const alturaLinha = parseFloat(linhas[0].style.height);
    const alvo = Math.floor(6000 / alturaLinha);
    const codigo = `ABC${String(alvo).padStart(4, '0')}XX`;
    assert.ok(
      linhas.some((tr) => tr.textContent.includes(codigo)),
      `a linha ${alvo} (visível em 6000px) não foi desenhada`
    );
  } finally {
    r.fim();
  }
});

test('5.2 — linhas que entram por ROLAGEM não animam (animarEntradaDasLinhas: true, quandoAnimar: sempre)', () => {
  const r = preparar();
  try {
    const rolagem = r.atualizar();
    assert.ok(r.palco.querySelector('.tc-entrando'), 'ao carregar as linhas devem animar (opção ligada)');
    rolar(r, rolagem, 3000);
    rolar(r, rolagem, 3300);
    assert.equal(r.palco.querySelectorAll('.tc-entrando').length, 0, 'linhas animaram ao rolar');
  } finally {
    r.fim();
  }
});

test('5.2 — rolagem horizontal não redesenha o corpo', () => {
  const r = preparar();
  try {
    const rolagem = r.atualizar();
    rolar(r, rolagem, 1200);
    const antes = linhasDeDados(r.palco)[0];
    rolar(r, rolagem, undefined, 800);
    assert.equal(linhasDeDados(r.palco)[0], antes, 'rolagem só horizontal recriou as linhas');
    assert.equal(rolagem.scrollLeft, 800);
  } finally {
    r.fim();
  }
});

test('5.2 — atualização de dados preserva scrollTop e scrollLeft', () => {
  const r = preparar();
  try {
    const rolagem = r.atualizar();
    rolar(r, rolagem, 4500, 600);
    const nova = r.atualizar();
    assert.equal(nova.scrollTop, 4500, 'a atualização de dados perdeu a posição vertical');
    assert.equal(nova.scrollLeft, 600, 'a atualização de dados perdeu a posição horizontal');
  } finally {
    r.fim();
  }
});

test('5.2 — destaque de valor que muda só em atualização de dados, nunca na rolagem', () => {
  const r = preparar();
  try {
    const rolagem = r.atualizar();
    const f = FIXTURES.tabelaLarga();
    for (const linha of f.data) {
      for (const k of Object.keys(linha)) if (/^m\d/.test(k)) linha[k].value += 1;
    }
    const rolagemNova = r.atualizar(f);
    assert.ok(r.palco.querySelectorAll('.tc-flash').length > 0, 'a atualização de dados deveria destacar os valores que mudaram');
    rolar(r, rolagemNova, 8000);
    assert.equal(r.palco.querySelectorAll('.tc-flash').length, 0, 'linhas que entraram por rolagem piscaram');
  } finally {
    r.fim();
  }
});

test('5.2 — ordenar volta a animar (só carregar/ordenar/filtrar/buscar animam)', () => {
  const r = preparar();
  try {
    const rolagem = r.atualizar();
    rolar(r, rolagem, 2000);
    assert.equal(r.palco.querySelectorAll('.tc-entrando').length, 0);
    r.palco.querySelector('.tc-tabela thead th').dispatchEvent(new r.amb.window.MouseEvent('click', { bubbles: true }));
    assert.ok(r.palco.querySelector('.tc-entrando'), 'ordenar deveria animar a entrada');
  } finally {
    r.fim();
  }
});
