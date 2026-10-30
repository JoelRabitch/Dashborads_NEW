/**
 * tabela_completa.test.mjs — testes específicos da Tabela Completa.
 *
 * O teste de fumaça só exercita a configuração PADRÃO. Aqui forçamos cada
 * tipo de célula, cada condição de formatação condicional e cada ação, além
 * das interações (ordenar, buscar, selecionar), porque é justamente o que o
 * usuário vai mexer no painel e o que mais dá errado em silêncio.
 *
 * Rode com: `npm test`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURES } from './fixtures/index.mjs';
import { montarAmbiente, criarInstancia, configPadrao } from './ambiente.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(resolve(__dirname, '..'), 'dist', 'tabela_completa.js');

const TIPOS_DE_CELULA = [
  'auto', 'texto', 'numero', 'barraDeDados', 'progresso', 'anel', 'medidor',
  'sparkline', 'miniBarras', 'miniArea', 'badge', 'semaforo', 'seta',
  'estrelas', 'booleano', 'avatar', 'imagem', 'link', 'data',
];

const CONDICOES = [
  'maior', 'maiorIgual', 'menor', 'menorIgual', 'igual', 'diferente', 'entre',
  'fora', 'contem', 'comecaCom', 'nulo', 'topN', 'bottomN', 'acimaDaMedia',
  'abaixoDaMedia', 'acimaDoPercentil', 'maiorQueColuna', 'menorQueColuna',
];

/** A busca e os filtros esperam o usuário parar de digitar (200 ms). */
const esperarFiltro = () => new Promise((r) => setTimeout(r, 300));

const ACOES = ['fundo', 'texto', 'negrito', 'fundoETexto', 'icone', 'badge', 'borda', 'piscar'];

/** Prepara um ambiente já renderizado uma vez, pronto para reconfigurar. */
function preparar(nomeDaFixture) {
  const amb = montarAmbiente();
  amb.window.eval(readFileSync(BUNDLE, 'utf8'));
  const definicao = amb.registro.tabela_completa;
  assert.ok(definicao, 'tabela_completa não se registrou');

  const instancia = criarInstancia(definicao, amb.chamadasDeApi);
  const { data, queryResponse } = FIXTURES[nomeDaFixture]();
  const palco = amb.window.document.getElementById('palco');

  instancia.create(palco, configPadrao(definicao));
  // A primeira renderização é a que publica as opções POR COLUNA.
  instancia.updateAsync(data, palco, configPadrao(definicao), queryResponse, {}, () => {});

  return {
    amb,
    palco,
    definicao,
    /** Renderiza de novo com ajustes por cima dos defaults. */
    render(ajustes = {}) {
      const config = Object.assign(configPadrao(definicao), ajustes);
      let chamouDone = false;
      instancia.updateAsync(data, palco, config, queryResponse, {}, () => { chamouDone = true; });
      assert.ok(chamouDone, 'done() precisa ser chamado sempre');
      return palco;
    },
    /** Prefixo das opções da primeira coluna de medida. */
    prefixoDeMedida() {
      const chave = Object.keys(definicao.options).find(
        (k) => k.startsWith('col_med_') && k.endsWith('_tipoDeCelula')
      );
      assert.ok(chave, 'não foram geradas opções por coluna para as medidas');
      return chave.replace('_tipoDeCelula', '');
    },
    celulasDoCorpo() {
      return Array.from(palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador) td'));
    },
    fim() {
      amb.restaurar();
    },
  };
}

test('tabela_completa — todos os tipos de célula desenham algo', (t) => {
  const ctx = preparar('comPivo');
  const prefixo = ctx.prefixoDeMedida();

  try {
    for (const tipo of TIPOS_DE_CELULA) {
      ctx.render({ [`${prefixo}_tipoDeCelula`]: tipo });
      const celula = ctx.palco.querySelector('.tc-tabela tbody tr:not(.tc-espacador) td:nth-child(2)');
      assert.ok(celula, `tipo ${tipo}: a célula sumiu`);
      const temConteudo = celula.children.length > 0 || celula.textContent.trim().length > 0;
      assert.ok(temConteudo, `tipo ${tipo}: a célula ficou vazia`);
      assert.equal(ctx.amb.chamadasDeApi.erros.length, 0, `tipo ${tipo}: reportou erro ao Looker`);
    }
  } finally {
    ctx.fim();
  }
  t.diagnostic(`${TIPOS_DE_CELULA.length} tipos de célula conferidos`);
});

test('tabela_completa — todas as condições e ações das regras rodam', (t) => {
  const ctx = preparar('comPivo');
  const prefixo = ctx.prefixoDeMedida();
  const valoresDaOpcao = ctx.definicao.options[`${prefixo}_regra1Coluna`]?.values || [];
  const outraColuna = valoresDaOpcao.map((v) => Object.values(v)[0]).filter(Boolean)[1] || '';

  try {
    for (const condicao of CONDICOES) {
      ctx.render({
        [`${prefixo}_regra1`]: condicao,
        [`${prefixo}_regra1Valor`]: condicao === 'contem' || condicao === 'comecaCom' ? '1' : '3',
        [`${prefixo}_regra1Valor2`]: '100000',
        [`${prefixo}_regra1Coluna`]: outraColuna,
      });
      assert.ok(ctx.celulasDoCorpo().length > 0, `condição ${condicao}: a tabela ficou vazia`);
      assert.equal(ctx.amb.chamadasDeApi.erros.length, 0, `condição ${condicao}: reportou erro`);
    }

    // "Maior que 3" bate em todas as linhas desta fixture: alguma coisa
    // precisa mudar visualmente, senão a regra não está sendo aplicada.
    for (const acao of ACOES) {
      ctx.render({
        [`${prefixo}_regra1`]: 'maior',
        [`${prefixo}_regra1Valor`]: '3',
        [`${prefixo}_regra1Acao`]: acao,
        [`${prefixo}_regra1Cor`]: '#DC2626',
      });
      const aplicou = ctx.celulasDoCorpo().some(
        (td) =>
          td.style.fontWeight === '700' ||
          td.style.borderLeft ||
          td.classList.contains('tc-piscando') ||
          td.querySelector('.tc-icone, .tc-badge') ||
          td.style.background.includes('220') ||
          td.style.color.includes('220')
      );
      assert.ok(aplicou, `ação ${acao}: nenhuma célula mudou`);
    }
  } finally {
    ctx.fim();
  }
  t.diagnostic(`${CONDICOES.length} condições e ${ACOES.length} ações conferidas`);
});

test('tabela_completa — ordenar, buscar e selecionar', async (t) => {
  const ctx = preparar('semPivo');
  const { window } = ctx.amb;

  try {
    const coluna = (n) =>
      Array.from(ctx.palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)'))
        .map((tr) => tr.querySelectorAll('td')[n]?.textContent.trim());

    const clicarCabecalho = (n) =>
      ctx.palco
        .querySelectorAll('.tc-tabela thead th')[n]
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    const original = coluna(0);

    clicarCabecalho(0);
    const crescente = coluna(0);
    assert.deepEqual(crescente, original.slice().sort((a, b) => a.localeCompare(b, 'pt-BR')), 'ordem A→Z errada');

    clicarCabecalho(0);
    assert.deepEqual(coluna(0), crescente.slice().reverse(), 'o segundo clique deveria inverter a ordem');

    const buscar = async (termo) => {
      const campo = ctx.palco.querySelector('input[type=search]');
      campo.value = termo;
      campo.dispatchEvent(new window.Event('input', { bubbles: true }));
      await esperarFiltro();
    };

    await buscar(crescente[0]);
    assert.ok(coluna(0).length < original.length, 'a busca não filtrou nada');

    await buscar('zzz-nao-existe');
    assert.match(
      ctx.palco.querySelector('.tc-vazio')?.textContent || '',
      /Nenhuma linha/,
      'faltou o estado vazio da busca'
    );

    await buscar('');
    ctx.palco
      .querySelector('.tc-tabela tbody tr:not(.tc-espacador)')
      .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.match(
      ctx.palco.querySelector('.tc-resumo').textContent,
      /1 selecionada/,
      'a seleção não apareceu no resumo'
    );
  } finally {
    ctx.fim();
  }
  t.diagnostic('ordenação, busca e seleção conferidas');
});

test('tabela_completa — virtualiza em vez de criar 5.000 linhas', (t) => {
  const ctx = preparar('grande5k');
  try {
    const linhas = ctx.palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)').length;
    const espacadoras = ctx.palco.querySelectorAll('.tc-espacador').length;
    assert.ok(linhas > 0, 'nenhuma linha foi desenhada');
    assert.ok(linhas < 200, `a virtualização não funcionou: ${linhas} linhas no DOM`);
    assert.ok(espacadoras > 0, 'faltou a linha espaçadora que segura a altura total');
    t.diagnostic(`${linhas} linhas no DOM para 5.000 linhas de dados`);
  } finally {
    ctx.fim();
  }
});

test('tabela_completa — cabeçalho de dois níveis quando há pivô', (t) => {
  const ctx = preparar('comPivo');
  try {
    const niveis = ctx.palco.querySelectorAll('.tc-tabela thead tr');
    assert.equal(niveis.length, 2, 'com pivô o cabeçalho precisa ter dois níveis');

    // A dimensão não pode ficar sem nome (já aconteceu).
    const primeiro = niveis[0].querySelector('th');
    assert.ok(primeiro.textContent.trim().length > 0, 'o cabeçalho da dimensão ficou em branco');

    const rodape = ctx.palco.querySelectorAll('.tc-tabela tfoot td');
    assert.ok(rodape.length > 0, 'faltou a linha de totais');
  } finally {
    ctx.fim();
  }
  t.diagnostic('cabeçalho de dois níveis e rodapé conferidos');
});

test('tabela_completa — agrupa, mostra subtotal e recolhe o grupo', (t) => {
  const ctx = preparar('duasDimensoes');
  const { window } = ctx.amb;

  try {
    assert.equal(ctx.palco.querySelectorAll('.tc-grupo').length, 0, 'sem agrupamento não deve haver grupos');

    ctx.render({ agruparPor: '1', mostrarSubtotais: true });
    const grupos = ctx.palco.querySelectorAll('.tc-grupo');
    assert.ok(grupos.length > 0, 'nenhum cabeçalho de grupo foi criado');
    // Grupos e linhas de dados convivem na mesma lista virtualizada.
    const dados = Array.from(ctx.palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)'))
      .filter((tr) => !tr.classList.contains('tc-grupo'));
    assert.ok(dados.length > 0, 'as linhas de dados sumiram ao agrupar');

    // O subtotal fica na própria linha do grupo.
    const celulasDoGrupo = Array.from(grupos[0].querySelectorAll('td'));
    assert.ok(
      celulasDoGrupo.some((td, i) => i > 0 && td.textContent.trim().length > 0),
      'a linha de grupo deveria trazer o subtotal'
    );

    // Recolher todos os grupos: sobram só os cabeçalhos, nenhuma linha de
    // dados. Contar linhas no DOM não serviria, porque a janela da
    // virtualização simplesmente puxa outras linhas para o lugar.
    for (let tentativa = 0; tentativa < 40; tentativa++) {
      const aberto = Array.from(ctx.palco.querySelectorAll('.tc-grupo')).find((tr) =>
        tr.textContent.startsWith('▾')
      );
      if (!aberto) break;
      aberto.querySelector('td').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    }

    const aindaAberto = Array.from(ctx.palco.querySelectorAll('.tc-grupo')).some((tr) =>
      tr.textContent.startsWith('▾')
    );
    assert.equal(aindaAberto, false, 'algum grupo continuou aberto depois de clicar');

    const dadosDepois = Array.from(ctx.palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)'))
      .filter((tr) => !tr.classList.contains('tc-grupo'));
    assert.equal(dadosDepois.length, 0, 'com todos os grupos fechados não deveria sobrar linha de dados');
    assert.ok(ctx.palco.querySelectorAll('.tc-grupo').length > 0, 'os cabeçalhos de grupo sumiram ao recolher');
  } finally {
    ctx.fim();
  }
  t.diagnostic('agrupamento, subtotal e recolher conferidos');
});

test('tabela_completa — filtro por coluna, inclusive numérico', async (t) => {
  const ctx = preparar('semPivo');
  const { window } = ctx.amb;

  try {
    ctx.render({ mostrarFiltrosPorColuna: true });
    const filtros = ctx.palco.querySelectorAll('.tc-filtro');
    assert.ok(filtros.length > 0, 'a linha de filtros não apareceu');

    const totalDeLinhas = ctx.palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)').length;

    const digitar = async (indice, texto) => {
      const campo = ctx.palco.querySelectorAll('.tc-filtro')[indice];
      campo.value = texto;
      campo.dispatchEvent(new window.Event('input', { bubbles: true }));
      await esperarFiltro();
    };

    await digitar(0, 'Centro');
    const filtradas = ctx.palco.querySelectorAll('.tc-tabela tbody tr:not(.tc-espacador)').length;
    assert.ok(filtradas > 0 && filtradas < totalDeLinhas, 'o filtro de texto não filtrou');

    await digitar(0, '');
    await digitar(1, '>1000000000');
    assert.match(
      ctx.palco.querySelector('.tc-vazio')?.textContent || '',
      /Nenhuma linha/,
      'o filtro numérico ">" não foi aplicado'
    );
  } finally {
    ctx.fim();
  }
  t.diagnostic('filtros por coluna conferidos');
});

test('tabela_completa — menu de contexto abre e fecha', (t) => {
  const ctx = preparar('semPivo');
  const { window } = ctx.amb;

  try {
    ctx.render({ permitirCopiar: true });
    const celula = ctx.palco.querySelector('.tc-tabela tbody tr:not(.tc-espacador) td');
    celula.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }));

    const menu = window.document.querySelector('.tc-menu');
    assert.ok(menu, 'o menu de contexto não abriu');
    assert.ok(menu.querySelectorAll('button').length >= 3, 'o menu veio sem opções');

    menu.querySelector('button').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(window.document.querySelector('.tc-menu'), null, 'o menu não fechou depois do clique');
  } finally {
    ctx.fim();
  }
  t.diagnostic('menu de contexto conferido');
});

test('tabela_completa — o bundle existe', () => {
  assert.ok(existsSync(BUNDLE), 'rode `npm run build` antes de `npm test`');
});
