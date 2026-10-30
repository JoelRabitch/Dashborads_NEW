/**
 * nucleo_correcoes.test.mjs — testes dos módulos compartilhados das
 * correções v2 (2.1 rótulos, 2.3 tooltip, 2.4 marcadores, config).
 *
 * Cada teste aqui foi escrito para REPRODUZIR um defeito visto no Looker
 * real (e falhar no código antigo). O config usado imita o que o Looker
 * entrega: chaves das opções registradas, com valores alterados pelo
 * usuário — inclusive `false`, `0` e texto vazio — e às vezes SEM as
 * chaves que o usuário nunca tocou.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { normalizarConfig, compararChaves } from '../src/core/options-kit.js';
import { lerRotulos, textoDoRotulo } from '../src/core/rotulos.js';
import { caminhoDoSimbolo, formaDoMarcador } from '../src/core/shapes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// BL_DIST permite rodar estes testes contra bundles antigos (reprodução).
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

/** Carrega um bundle e devolve instância pronta para atualizar. */
function carregar(id) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  let registros = 0;
  const triggerOriginal = inst.trigger;
  inst.trigger = (evento, args) => {
    if (evento === 'registerOptions') registros += 1;
    return triggerOriginal(evento, args);
  };
  inst.create(palco, configPadrao(definicao));
  return {
    amb,
    definicao,
    inst,
    palco,
    registros: () => registros,
    atualizar(nomeFixture, config) {
      const { data, queryResponse } = FIXTURES[nomeFixture]();
      let ok = false;
      inst.updateAsync(data, palco, config, queryResponse, {}, () => { ok = true; });
      assert.ok(ok, 'done() precisa ser chamado');
    },
    fim: () => amb.restaurar(),
  };
}

test('config — chaves ausentes recebem o default; false, 0 e vazio são preservados', () => {
  const opcoes = {
    mostrarRotulos: { type: 'boolean', default: true },
    tamanhoDoRotulo: { type: 'number', default: 11 },
    casasDecimaisDoRotulo: { type: 'number', default: 1 },
    corDoRotulo: { type: 'string', default: '' },
    titulo: { type: 'string', default: 'x' },
  };
  const c = normalizarConfig({ mostrarRotulos: false, casasDecimaisDoRotulo: 0, titulo: '' }, opcoes);
  assert.equal(c.mostrarRotulos, false, 'false do usuário não pode virar o default true');
  assert.equal(c.casasDecimaisDoRotulo, 0, '0 casa decimal é escolha, não ausência');
  assert.equal(c.titulo, '', 'texto vazio escolhido fica vazio');
  assert.equal(c.tamanhoDoRotulo, 11, 'chave que o Looker não mandou recebe o default');
  const t = normalizarConfig({ tamanhoDoRotulo: '20', mostrarRotulos: 'false' }, opcoes);
  assert.equal(t.tamanhoDoRotulo, 20, 'número em texto vira número');
  assert.equal(t.mostrarRotulos, false, '"false" em texto vira false');
  const rel = compararChaves({ mostrarRotulos: true, chaveEstranha: 1 }, opcoes);
  assert.deepEqual(rel.foraDoPainel, ['chaveEstranha']);
  assert.ok(rel.faltandoNoConfig.includes('tamanhoDoRotulo'));
});

test('rótulos — lerRotulos e textoDoRotulo respeitam todas as opções', () => {
  const rot = lerRotulos(
    { mostrarRotulos: true, tamanhoDoRotulo: 20, rotacaoDoRotulo: 0, casasDecimaisDoRotulo: 0,
      conteudoDoRotulo: 'nomeValor', formatoDoRotulo: 'numero', negritoNoRotulo: true, truncarRotulo: 0 },
    { texto: '#111' }
  );
  assert.equal(rot.tamanho, 20);
  assert.equal(rot.casas, 0);
  assert.equal(rot.negrito, true);
  assert.equal(textoDoRotulo(rot, { valor: 1234.567, nome: 'Loja A' }), 'Loja A: 1,235');
  const pct = lerRotulos({ conteudoDoRotulo: 'percentual', casasDecimaisDoRotulo: 2 }, {});
  assert.equal(textoDoRotulo(pct, { valor: 25, total: 200 }), '12.50%');
  const comp = lerRotulos({ formatoDoRotulo: 'compacto', casasDecimaisDoRotulo: 1 }, {});
  assert.equal(textoDoRotulo(comp, { valor: 1500000 }), '1.5M');
  const curto = lerRotulos({ conteudoDoRotulo: 'nome', truncarRotulo: 5 }, {});
  assert.equal(textoDoRotulo(curto, { nome: 'Nome muito longo' }), 'Nome…');
  assert.equal(lerRotulos({ mostrarRotulos: false }, {}).mostrar, false);
});

test('registerOptions — só dispara quando a lista de campos muda (não a cada update)', () => {
  // Defeito: a assinatura morava na ponte, recriada em todo updateAsync.
  const r = carregar('barras_ranking_denso');
  try {
    const cfg = configPadrao(r.definicao);
    r.atualizar('duasDimensoes', cfg);
    const depoisDaPrimeira = r.registros();
    r.atualizar('duasDimensoes', cfg);
    r.atualizar('duasDimensoes', cfg);
    assert.equal(r.registros(), depoisDaPrimeira, 'mesmos campos não podem registrar de novo');
  } finally {
    r.fim();
  }
});

test('tooltip — 50 hovers rápidos e 5 redesenhos deixam no máximo 1 tooltip no DOM', () => {
  // Defeito: cada desenho pendurava um tooltip novo no <body>.
  for (const id of ['barras_ranking_denso', 'pareto', 'matriz_2x2', 'treemap_carteira', 'drawdown']) {
    const r = carregar(id);
    try {
      const doc = r.amb.window.document;
      const cfg = configPadrao(r.definicao);
      for (let i = 0; i < 5; i++) r.atualizar('semPivo', cfg);
      const alvos = Array.from(r.palco.querySelectorAll('svg *, .br-linha, .lv-conteudo, rect, path, circle')).slice(0, 50);
      assert.ok(alvos.length > 0, `${id}: nada para passar o mouse`);
      for (let i = 0; i < 50; i++) {
        const alvo = alvos[i % alvos.length];
        const ev = new r.amb.window.MouseEvent('pointermove', { bubbles: true, clientX: 10 + i, clientY: 10 + i });
        alvo.dispatchEvent(ev);
        alvo.dispatchEvent(new r.amb.window.MouseEvent('mousemove', { bubbles: true, clientX: 10 + i, clientY: 10 + i }));
      }
      const n = doc.querySelectorAll('.bl-tooltip').length;
      assert.ok(n <= 1, `${id}: ${n} tooltips no DOM`);
      r.inst.destroy();
      assert.equal(doc.querySelectorAll('.bl-tooltip').length, 0, `${id}: destroy precisa remover o tooltip`);
    } finally {
      r.fim();
    }
  }
});

test('tooltip — modelo do usuário: só b/i/br/span, variáveis entram como texto', async () => {
  const amb = montarAmbiente();
  try {
    const { montarModelo } = await import('../src/core/tooltip.js');
    const alvo = amb.window.document.createElement('div');
    montarModelo(
      alvo,
      '<b>{{categoria}}</b><br><script>x</script><img src=x onerror=1>{{valor}}',
      { categoria: '<i>Loja</i>', valor: '1.234' }
    );
    assert.equal(alvo.querySelectorAll('b').length, 1);
    assert.equal(alvo.querySelectorAll('br').length, 1);
    assert.equal(alvo.querySelectorAll('script, img, i').length, 0, 'tag proibida ou vinda do dado não pode virar elemento');
    assert.match(alvo.textContent, /<i>Loja<\/i>/, 'o valor da variável aparece como texto');
    assert.match(alvo.textContent, /<script>x<\/script>/);
  } finally {
    amb.restaurar();
  }
});

test('clique — drill quando há links; sem links NÃO fixa no modo drill (v3, 5.1); Shift fixa; "nenhuma" não faz nada', async () => {
  const amb = montarAmbiente();
  try {
    const { executarAcaoDoClique } = await import('../src/core/tooltip.js');
    let drills = 0;
    let fixados = 0;
    const ponte = { temDrill: (c) => !!(c && c.links), abrirDrill: () => { drills += 1; return true; } };
    const tooltip = { fixar: () => { fixados += 1; return true; }, soltar: () => {}, soltarEEsconder: () => {} };
    const comLink = { value: 1, links: [{ url: '/x' }] };
    assert.equal(executarAcaoDoClique({ evento: {}, celula: comLink, tooltip, ponte, config: {} }), 'drill');
    assert.equal(executarAcaoDoClique({ evento: {}, celula: { value: 1 }, tooltip, ponte, config: {} }), 'nada');
    assert.equal(executarAcaoDoClique({ evento: { shiftKey: true }, celula: comLink, tooltip, ponte, config: {} }), 'fixou');
    assert.equal(executarAcaoDoClique({ evento: {}, celula: comLink, tooltip, ponte, config: { acaoDoClique: 'nenhuma' } }), 'nada');
    assert.equal(executarAcaoDoClique({ evento: {}, celula: comLink, tooltip, ponte, config: { acaoDoClique: 'fixar' } }), 'fixou');
    assert.equal(drills, 1);
    assert.equal(fixados, 2);
  } finally {
    amb.restaurar();
  }
});

test('marcadores — as 7 formas geram caminhos diferentes e válidos', () => {
  const formas = ['circulo', 'quadrado', 'triangulo', 'losango', 'cruz', 'estrela', 'wye'];
  const caminhos = new Set();
  for (const f of formas) {
    const d = caminhoDoSimbolo(f, 12);
    assert.ok(d.length > 10 && !/NaN/.test(d), `${f}: caminho inválido`);
    caminhos.add(d);
  }
  assert.equal(caminhos.size, formas.length, 'cada forma precisa de um desenho próprio');
  assert.equal(formaDoMarcador('diamond'), 'losango');
  assert.equal(formaDoMarcador(undefined), 'circulo');
});
