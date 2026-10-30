/**
 * dot_plot_v3.test.mjs — rótulos cortados nas margens do dot_plot_denso
 * (melhorias v3, 5.13b). Geometria sobre os números do desenho; larguras
 * pela função única `medida-texto.js`. Fixture sintética: 30 itens em
 * milhões, um no máximo da escala, um nome longo, rótulos "23.51M (14.85%)".
 * O tile salva `larguraDoNome: 80`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { celula, campoDimensao, campoMedida, montarQueryResponse, criarRng } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';
import { larguraDoTexto } from '../src/core/medida-texto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.BL_DIST || join(resolve(__dirname, '..'), 'dist');

const NOME_LONGO = 'Território Ultramarino de Exemplo Sintético com Nome Comprido';

export function itensEmMilhoes() {
  const rng = criarRng(91);
  const dimensoes = [campoDimensao('pais', 'País')];
  const medidas = [campoMedida('receita', 'Receita')];
  const data = [];
  for (let i = 0; i < 30; i++) {
    const v = i === 0 ? 74050000 : Math.round((1000000 + rng() * 60000000) / 1000) * 1000;
    const nome = i === 7 ? NOME_LONGO : `País Sintético ${String.fromCharCode(65 + (i % 26))}${i}`;
    data.push({ pais: celula(nome), receita: celula(v, `${(v / 1e6).toFixed(2)}M`) });
  }
  return { data, queryResponse: montarQueryResponse({ dimensoes, medidas }) };
}

function desenhar(id, ajustes = {}) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(join(DIST, `${id}.js`), 'utf8'));
  const definicao = amb.registro[id];
  const inst = criarInstancia(definicao, amb.chamadasDeApi);
  const palco = amb.window.document.getElementById('palco');
  const { data, queryResponse } = itensEmMilhoes();
  const cfg = () => Object.assign(configPadrao(definicao), ajustes);
  inst.create(palco, cfg());
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  inst.updateAsync(data, palco, cfg(), queryResponse, {}, () => {});
  return { amb, palco, fim: () => amb.restaurar() };
}

const SALVO = { larguraDoNome: 80, escreverValores: 'primeira', conteudoDoRotulo: 'valorPercentual', mostrarRotulos: true };

/** Caixa estimada de cada rótulo de valor, em px dentro do trilho. */
function caixasDosValores(palco) {
  return Array.from(palco.querySelectorAll('.dp-valor')).map((el) => {
    const linha = el.closest('.dp-linha');
    const nome = linha.querySelector('.dp-nome');
    const trilho = linha.querySelector('.dp-trilho');
    const folga = parseFloat(trilho.style.marginRight) || 0;
    const W = 900 - 16 - parseFloat(nome.style.width) - 6 - folga;
    const x = (parseFloat(el.style.left) / 100) * W;
    const tamanho = parseFloat(el.style.fontSize) || 11;
    const w = larguraDoTexto(el.textContent, tamanho);
    const t = el.style.transform || '';
    const afast = Number((/(\d+(?:\.\d+)?)px/.exec(t) || [0, 0])[1]);
    const x0 = /calc\(-100%/.test(t) ? x - afast - w : /translate\(-50%/.test(t) ? x - w / 2 : x + afast;
    return { texto: el.textContent, x0, x1: x0 + w, W, folga };
  });
}

test('5.13b — o rótulo do valor máximo cabe inteiro (qualquer "Rótulo na borda")', () => {
  for (const rotuloNaBorda of [undefined, 'inverter', 'folga', 'reduzir']) {
    const r = desenhar('dot_plot_denso', { ...SALVO, ...(rotuloNaBorda ? { rotuloNaBorda } : {}) });
    try {
      const caixas = caixasDosValores(r.palco);
      assert.ok(caixas.length > 0, 'sem rótulos de valor');
      const maximo = caixas.find((c) => c.texto.startsWith('74.05M'));
      assert.ok(maximo, `o rótulo do máximo não aparece inteiro: ${caixas.map((c) => c.texto).slice(0, 3)}`);
      for (const c of caixas) {
        assert.ok(c.x0 >= -0.5 && c.x1 <= c.W + c.folga + 0.5, `${rotuloNaBorda}: "${c.texto}" sai do trilho (${c.x0.toFixed(1)}–${c.x1.toFixed(1)} de ${c.W + c.folga})`);
      }
    } finally {
      r.fim();
    }
  }
});

test('5.13b — nomes: "Mostrar inteiro" usa a largura do maior nome (limitada); larguraDoNome salva só nos modos de corte', () => {
  const r = desenhar('dot_plot_denso', SALVO);
  try {
    const nomes = Array.from(r.palco.querySelectorAll('.dp-nome'));
    const largura = parseFloat(nomes[0].style.width);
    assert.ok(largura > 80, `a coluna ficou em ${largura}px (a larguraDoNome salva só vale nos modos de corte)`);
    assert.ok(largura <= 900 * 0.35 + 0.5, 'a coluna passou do limite de 35% do gráfico');
    for (const n of nomes) {
      if (n.title === NOME_LONGO) continue; // o maior passa do limite: cortado com "…"
      assert.equal(n.textContent, n.title, `nome cortado: "${n.textContent}"`);
      assert.ok(larguraDoTexto(n.textContent, 12) <= largura, 'nome mais largo que a coluna');
    }
  } finally {
    r.fim();
  }
  const corte = desenhar('dot_plot_denso', { ...SALVO, modoDoTextoLongo: 'reticencias' });
  try {
    assert.equal(parseFloat(corte.palco.querySelector('.dp-nome').style.width), 80);
  } finally {
    corte.fim();
  }
});

test('5.13b — eixo com todos os valores positivos não começa negativo; régua separada da lista', () => {
  const r = desenhar('dot_plot_denso', SALVO);
  try {
    const marcas = Array.from(r.palco.querySelectorAll('.dp-escala span')).map((s) => s.textContent).filter(Boolean);
    assert.ok(marcas.length >= 3);
    assert.doesNotMatch(marcas[0], /^[-−]/, `eixo começa negativo: ${marcas[0]}`);
    const regua = r.palco.querySelector('.dp-escala');
    const rolagem = r.palco.querySelector('.lv-rolagem');
    assert.ok(!rolagem.contains(regua), 'a régua não pode ficar dentro da área rolável');
    assert.ok(regua.style.borderTop, 'falta a separação visual entre a lista e o eixo');
  } finally {
    r.fim();
  }
});
