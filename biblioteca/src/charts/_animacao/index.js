/**
 * _animacao — base dos gráficos que andam no tempo.
 *
 * `bar_race` e `motion_bubbles` precisam da mesma coisa: um relógio que
 * avança um `tempo` fracionário entre períodos, um botão de tocar/pausar,
 * uma barra de tempo arrastável e o nome do período corrente.
 *
 * Três obrigações moram aqui, e as três aparecem nos testes dos dois
 * gráficos:
 *
 * 1. **A barra de tempo é tão proeminente quanto o play.** Num gráfico
 *    animado, só o quadro PARADO tem informação comparável; poder parar e
 *    arrastar é o que torna o gráfico analisável em vez de decorativo.
 * 2. **`prefers-reduced-motion` desliga a animação.** Quem pediu menos
 *    movimento recebe o gráfico parado no ÚLTIMO período — o quadro com
 *    mais informação — e uma explicação na tela. Animação involuntária é
 *    um gatilho real para parte dos usuários; isto não é um extra.
 * 3. **O relógio para quando a viz morre.** O `defineViz` já cancela
 *    quadros e timers, mas um passo em voo redesenhando sobre DOM morto é
 *    o jeito clássico de um gráfico animado derrubar o dashboard.
 *
 * (A pasta começa com `_`: não é um gráfico registrado, é código
 * compartilhado.)
 */

import { criarEl, definirTexto, preferindoMenosMovimento } from '../../core/dom.js';
import { listaDeValores } from '../../core/options-kit.js';

export const CSS_ANIMACAO = `
.an-controles{display:flex;align-items:center;gap:8px;padding:4px 8px;flex:0 0 auto;}
.an-botao{flex:0 0 auto;border-radius:4px;padding:2px 10px;font:inherit;cursor:pointer;}
.an-tempo{flex:1 1 auto;min-width:60px;}
.an-periodo{flex:0 0 auto;font-weight:600;white-space:nowrap;}
`;

/** Opções de reprodução comuns à família. */
export function opcoesDeAnimacao({ secao = 'Animação', duracaoPadrao = 900 } = {}) {
  return {
    duracaoPorPeriodo: {
      type: 'number',
      label: 'Duração de cada período (ms)',
      section: secao,
      display: 'range',
      min: 200,
      max: 3000,
      step: 100,
      default: duracaoPadrao,
    },
    comecarTocando: {
      type: 'boolean',
      label: 'Começar tocando',
      section: secao,
      default: true,
    },
    repetir: {
      type: 'boolean',
      label: 'Repetir do início ao terminar',
      section: secao,
      default: false,
    },
  };
}

/**
 * Monta os controles e o relógio.
 *
 * `aoQuadro(tempo)` é chamado sempre que o gráfico precisa se redesenhar —
 * com `tempo` fracionário entre 0 e `quantidade − 1`.
 *
 * @returns {{estado, menosMovimento, controles, botao, barraDeTempo,
 *            rotulo, atualizarControles, iniciar}}
 */
export function criarControleDeTempo({
  ctx,
  hospedeiro,
  quantidade,
  config = {},
  rotuloDoPeriodo = (i) => String(i + 1),
  aoQuadro,
  chaveDoEstado = 'animacao',
}) {
  const { tema } = ctx;
  const ultimo = Math.max(0, quantidade - 1);
  const duracao = Math.max(100, Number(config.duracaoPorPeriodo) || 900);
  const menosMovimento = preferindoMenosMovimento();

  const controles = criarEl('div', { classe: 'an-controles', pai: hospedeiro });

  const botao = criarEl('button', { classe: 'an-botao', pai: controles });
  botao.type = 'button';
  botao.style.background = tema.fundo;
  botao.style.color = tema.texto;
  botao.style.border = `1px solid ${tema.borda}`;

  const barraDeTempo = criarEl('input', { classe: 'an-tempo', pai: controles });
  barraDeTempo.type = 'range';
  barraDeTempo.min = '0';
  barraDeTempo.max = String(ultimo);
  barraDeTempo.step = '0.01';

  const rotulo = criarEl('div', { classe: 'an-periodo', pai: controles });
  rotulo.style.color = tema.texto;

  if (!ctx.estado[chaveDoEstado]) {
    ctx.estado[chaveDoEstado] = {
      tempo: menosMovimento ? ultimo : 0,
      tocando: menosMovimento ? false : config.comecarTocando !== false,
    };
  }
  const estado = ctx.estado[chaveDoEstado];
  estado.tempo = Math.max(0, Math.min(ultimo, estado.tempo));

  const atualizarControles = () => {
    const indiceInteiro = Math.min(ultimo, Math.round(estado.tempo));
    definirTexto(rotulo, rotuloDoPeriodo(indiceInteiro));
    barraDeTempo.value = String(estado.tempo);
    definirTexto(botao, estado.tocando ? '❚❚ pausar' : '▶ tocar');
  };

  const desenhar = () => {
    if (typeof aoQuadro === 'function') aoQuadro(estado.tempo);
    atualizarControles();
  };

  let ultimoInstante = null;

  const passo = (agora) => {
    if (!estado.tocando) return;
    if (ultimoInstante === null) ultimoInstante = agora;
    const decorrido = agora - ultimoInstante;
    ultimoInstante = agora;

    estado.tempo += decorrido / duracao;
    if (estado.tempo >= ultimo) {
      if (config.repetir === true) {
        estado.tempo = 0;
      } else {
        estado.tempo = ultimo;
        estado.tocando = false;
      }
    }
    desenhar();
    if (estado.tocando) ctx.agendarQuadro(passo);
  };

  ctx.eventos.on(botao, 'click', () => {
    estado.tocando = !estado.tocando;
    ultimoInstante = null;
    if (estado.tocando) {
      if (estado.tempo >= ultimo) estado.tempo = 0;
      ctx.agendarQuadro(passo);
    }
    desenhar();
  });

  // Arrastar SEMPRE pausa: quem foi procurar um período quer olhar, não
  // ver o gráfico fugir da mão.
  ctx.eventos.on(barraDeTempo, 'input', () => {
    estado.tocando = false;
    ultimoInstante = null;
    estado.tempo = Number(barraDeTempo.value);
    desenhar();
  });

  return {
    estado,
    menosMovimento,
    duracao,
    controles,
    botao,
    barraDeTempo,
    rotulo,
    atualizarControles,
    desenhar,
    iniciar() {
      desenhar();
      if (estado.tocando) ctx.agendarQuadro(passo);
    },
  };
}

/** Desliga o relógio no `aoDestruir` do gráfico. */
export function pararAnimacao(estado, chaveDoEstado = 'animacao') {
  if (estado && estado[chaveDoEstado]) estado[chaveDoEstado].tocando = false;
}

/** Frase padrão para a nota, quando a animação foi desligada pelo sistema. */
export function notaDeMenosMovimento(menosMovimento) {
  return menosMovimento ? 'animação desligada por preferência de menos movimento do sistema' : null;
}

/** Opções de rastro, usadas por quem desenha caminho no tempo. */
export function opcoesDeRastro({ secao = 'Animação' } = {}) {
  return {
    comprimentoDoRastro: {
      type: 'number',
      label: 'Rastro: quantos períodos deixar para trás (0 = nenhum)',
      section: secao,
      display: 'range',
      min: 0,
      max: 20,
      step: 1,
      default: 0,
    },
    estiloDoRastro: {
      type: 'string',
      label: 'Como desenhar o rastro',
      section: secao,
      display: 'select',
      default: 'linha',
      values: listaDeValores([
        { rotulo: 'Linha ligando as posições', valor: 'linha' },
        { rotulo: 'Pontos esmaecidos', valor: 'pontos' },
      ]),
    },
  };
}
