/**
 * MODELO DE GRÁFICO — copie esta pasta para criar um gráfico novo.
 * Passo a passo em `docs/COMO_ADICIONAR_GRAFICO.md`.
 *
 * O QUE FAZ: (descreva em uma frase)
 * CAMPOS ESPERADOS: (ex.: 1 dimensão + 1 medida; aceita pivô?)
 * OPÇÕES: (liste as específicas; as comuns vêm do options-kit)
 */

import { defineViz } from '../../core/define-viz.js';
import {
  montarOpcoes,
  blocoDeCores,
  blocoDeDados,
  blocoDeRotulos,
  blocoDeLegenda,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeInteracao,
  blocoDeTema,
  blocoAvancado,
} from '../../core/options-kit.js';
import { criarEl, criarSvgRaiz, criarSvgEl, limpar } from '../../core/dom.js';
import { escalaDeCores } from '../../core/scales.js';
import { criarTooltip, montarConteudoDeTooltip } from '../../core/tooltip.js';
import { criarLayoutComLegenda, desenharLegenda } from '../../core/legend.js';
import { opcoesDeAnimacao, criarControladorDeAnimacao } from '../../core/animate.js';

defineViz({
  id: 'template_exemplo',
  label: 'Modelo (exemplo)',

  // Opções do painel Edit: blocos comuns + as específicas deste gráfico.
  opcoes: montarOpcoes(
    {
      // --- opções específicas deste gráfico ---
      exemploDeOpcao: {
        type: 'number',
        label: 'Raio do ponto (px)',
        section: 'Formato',
        display: 'range',
        min: 2,
        max: 40,
        step: 1,
        default: 8,
      },
    },
    blocoDeDados(),
    blocoDeCores(),
    blocoDeRotulos(),
    blocoDeLegenda(),
    blocoDeTooltip(),
    blocoDeInteracao(),
    blocoDeAnimacao(),
    blocoDeTema(),
    blocoAvancado()
  ),

  // Formato de dados exigido (validado pelo define-viz antes do render).
  exigencia: {
    dimensoesMin: 1,
    medidasMin: 1,
    aceitaPivo: true,
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura, eventos } = ctx;

    // 1) Layout: área do gráfico + área da legenda.
    const { areaGrafico, areaLegenda } = criarLayoutComLegenda(raiz, config);

    // 2) Dados prontos para desenhar.
    const dimensao = modelo.dimensoes[0];
    const medida = modelo.medidas[0];
    const { itens } = modelo.extrairSerie({
      dimensao: dimensao.nome,
      medida: medida.nome,
      tratamentoDeNulos: config.tratamentoDeNulos,
    });
    if (!itens.length) {
      ctx.mostrarVazio();
      return;
    }

    // 3) Cores.
    const cores = escalaDeCores({
      chaves: itens.map((i) => i.rotulo),
      valores: itens.map((i) => i.valor),
      config,
      tema,
    });

    // 4) Desenho (SVG neste exemplo; use canvas quando houver muitos itens).
    const w = Math.max(1, areaGrafico.clientWidth || largura);
    const h = Math.max(1, areaGrafico.clientHeight || altura);
    const svg = criarSvgRaiz(areaGrafico, w, h, { rotuloAcessivel: config.titulo || 'Gráfico' });

    const animacao = opcoesDeAnimacao(config, { primeiraRenderizacao: ctx.primeiraRenderizacao });
    const controlador = criarControladorDeAnimacao();

    const raio = Number(config.exemploDeOpcao) || 8;
    const passo = w / (itens.length + 1);

    itens.forEach((item, i) => {
      const circulo = criarSvgEl('circle', {
        pai: svg,
        atributos: {
          cx: passo * (i + 1),
          cy: h / 2,
          r: animacao.ligada ? 0 : raio,
          fill: cores.cor(cores.tipo === 'valor' ? item.valor : item.rotulo),
          'fill-opacity': config.opacidade ?? 1,
        },
      });

      if (animacao.ligada) {
        controlador.animar({
          de: 0,
          para: raio,
          duracao: animacao.duracao,
          atraso: animacao.atraso + i * animacao.cascata,
          suavizacao: animacao.suavizacao,
          aoAtualizar: (v) => circulo.setAttribute('r', String(v)),
        });
      }

      // Tooltip + drill.
      if (config.mostrarTooltip !== false) {
        const tooltip = (ctx.estado.tooltip ||= criarTooltip(raiz, tema));
        eventos.on(circulo, 'pointerenter', (ev) => {
          tooltip.mostrar(
            montarConteudoDeTooltip({ modelo, linha: item.linha, config, titulo: item.rotulo }),
            ev.clientX,
            ev.clientY
          );
        });
        eventos.on(circulo, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
        eventos.on(circulo, 'pointerleave', () => tooltip.esconder());
      }
      if (config.permitirDrill !== false) {
        const celula = modelo.celula(item.linha, dimensao.nome);
        if (ctx.ponte.temDrill(celula)) {
          circulo.style.cursor = 'pointer';
          eventos.on(circulo, 'click', (ev) => ctx.ponte.abrirDrill(celula, ev));
        }
      }
    });

    // 5) Legenda.
    desenharLegenda({
      hospedeiro: areaLegenda,
      itens: cores.legenda.map((l) => ({ chave: l.chave, rotulo: l.chave, cor: l.cor })),
      config,
      tema,
      eventos,
    });
  },
});
