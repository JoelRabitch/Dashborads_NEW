/**
 * gauge_grid — "Medidores em Grade".
 *
 * Um medidor pequeno por item de uma dimensão, numa grade que se ajusta ao
 * tamanho do tile. Serve para comparar o mesmo indicador entre lojas,
 * produtos ou regiões.
 *
 * Detalhe que muda a leitura: **todos os medidores compartilham a mesma
 * escala por padrão**. Cada um com a própria escala faria todos parecerem
 * iguais, que é exatamente o contrário do que se quer ao comparar.
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, injetarEstilo } from '../../core/dom.js';
import { criarTooltip } from '../../core/tooltip.js';
import {
  montarOpcoes,
  comDefaults,
  blocoDeCores,
  blocoDeRotulos,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  opcaoDeEscolhaDeCampo,
} from '../../core/options-kit.js';
import {
  CSS_MEDIDOR,
  opcoesDeMedidor,
  lerFaixas,
  limitesDoMedidor,
  desenharMedidor,
  formatadorDoMedidor,
} from '../_medidor/index.js';

/** Acima disso a grade vira um mosaico ilegível. */
const MAXIMO_DE_MEDIDORES = 60;

export default defineViz({
  id: 'gauge_grid',
  label: 'Medidores em Grade',
  opcoes: comDefaults(
    montarOpcoes(
      blocoDeCores({ comEscalaPorValor: false }),
      blocoDeRotulos(),
      blocoDeTooltip(),
      blocoDeAnimacao(),
      blocoDeTema(),
      blocoAvancado(),
      opcoesDeMedidor({ estiloPadrao: 'semicirculo' }),
      {
        colunasDaGrade: {
          type: 'number',
          label: 'Colunas (0 = ajustar ao tamanho)',
          section: 'Grade',
          display: 'range',
          min: 0,
          max: 10,
          step: 1,
          default: 0,
        },
        larguraMinimaDaCelula: {
          type: 'number',
          label: 'Largura mínima de cada medidor (px)',
          section: 'Grade',
          display: 'range',
          min: 80,
          max: 400,
          step: 10,
          default: 160,
        },
        alturaDaCelula: {
          type: 'number',
          label: 'Altura de cada medidor (px)',
          section: 'Grade',
          display: 'range',
          min: 60,
          max: 400,
          step: 10,
          default: 130,
        },
        escalaPorMedidor: {
          type: 'boolean',
          label: 'Cada medidor na própria escala (deixa de ser comparável)',
          section: 'Grade',
          default: false,
        },
        ordenarPorValor: {
          type: 'string',
          label: 'Ordem dos medidores',
          section: 'Grade',
          display: 'select',
          default: 'consulta',
          values: [
            { 'Como veio da consulta': 'consulta' },
            { 'Do maior para o menor': 'decrescente' },
            { 'Do menor para o maior': 'crescente' },
          ],
        },
      }
    ),
    {
      // Medidores pequenos não têm espaço para os números das pontas.
      mostrarLimites: false,
    }
  ),
  exigencia: { dimensoesMin: 1, medidasMin: 1, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const medidas = modelo.medidas.map((m) => ({ nome: m.nome, rotulo: m.rotuloCurto }));
    const dimensoes = modelo.dimensoes.map((d) => ({ nome: d.nome, rotulo: d.rotuloCurto }));
    if (!medidas.length || !dimensoes.length) return {};
    const saida = {
      ...opcaoDeEscolhaDeCampo('campoDoItem', 'Dimensão dos medidores', dimensoes, {
        secao: 'Dados',
        padrao: dimensoes[0].nome,
      }),
      ...opcaoDeEscolhaDeCampo('campoDoValor', 'Medida do valor', medidas, {
        secao: 'Dados',
        padrao: medidas[0].nome,
      }),
    };
    if (medidas.length > 1) {
      Object.assign(
        saida,
        opcaoDeEscolhaDeCampo('campoDoAlvo', 'Medida do alvo', medidas, {
          secao: 'Alvo',
          incluirNenhum: true,
          padrao: '',
        })
      );
    }
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura } = ctx;

    const campoDoItem =
      modelo.dimensoes.find((d) => d.nome === config.campoDoItem) || modelo.dimensoes[0] || null;
    const medida =
      modelo.medidas.find((m) => m.nome === config.campoDoValor) || modelo.medidas[0] || null;
    const campoDoAlvo =
      config.alvoVindoDe === 'medida'
        ? modelo.medidas.find((m) => m.nome === config.campoDoAlvo) || null
        : null;

    if (!campoDoItem || !medida) {
      ctx.mostrarVazio('Esta visualização precisa de uma dimensão e uma medida.');
      return;
    }

    // Uma linha por item; linhas repetidas do mesmo item são somadas.
    const porChave = new Map();
    for (let i = 0; i < modelo.linhas.length; i++) {
      const linha = modelo.linhas[i];
      const bruto = modelo.valorBruto(linha, campoDoItem.nome);
      const chave = bruto === null || bruto === undefined ? '∅' : String(bruto);
      if (!porChave.has(chave)) {
        porChave.set(chave, {
          chave,
          rotulo: modelo.texto(linha, campoDoItem.nome, undefined, '∅'),
          valor: null,
          alvo: null,
          indiceDaLinha: i,
        });
      }
      const registro = porChave.get(chave);
      const v = modelo.valorNumerico(linha, medida.nome);
      if (v !== null) registro.valor = (registro.valor === null ? 0 : registro.valor) + v;
      if (campoDoAlvo) {
        const a = modelo.valorNumerico(linha, campoDoAlvo.nome);
        if (a !== null) registro.alvo = (registro.alvo === null ? 0 : registro.alvo) + a;
      }
    }

    let itens = Array.from(porChave.values()).filter((item) => item.valor !== null);
    if (config.ordenarPorValor === 'decrescente') itens.sort((a, b) => b.valor - a.valor);
    else if (config.ordenarPorValor === 'crescente') itens.sort((a, b) => a.valor - b.valor);

    if (!itens.length) {
      ctx.mostrarVazio('Nenhum item tem valor numérico na medida escolhida.');
      return;
    }

    if (itens.length > MAXIMO_DE_MEDIDORES) {
      ctx.avisar(
        `A consulta tem ${itens.length} itens; mostrando os ${MAXIMO_DE_MEDIDORES} primeiros para a grade continuar legível.`
      );
      itens = itens.slice(0, MAXIMO_DE_MEDIDORES);
    }

    const alvoFixo =
      config.alvoVindoDe === 'fixo' ? Number(String(config.valorDoAlvo).replace(',', '.')) : null;
    const faixas = lerFaixas(config);

    const limitesComuns = limitesDoMedidor(
      [
        ...itens.map((i) => i.valor),
        ...itens.map((i) => i.alvo),
        Number.isFinite(alvoFixo) ? alvoFixo : null,
        ...faixas.map((f) => f.ate),
      ],
      config
    );

    ctx.limparRaiz();
    injetarEstilo(raiz, CSS_MEDIDOR, 'md');
    const grade = criarEl('div', { classe: 'md-grade', pai: raiz });

    const larguraMinima = Number(config.larguraMinimaDaCelula) || 160;
    const colunasPedidas = Number(config.colunasDaGrade) || 0;
    const colunas = colunasPedidas > 0
      ? colunasPedidas
      : Math.max(1, Math.min(itens.length, Math.floor(largura / larguraMinima) || 1));
    const larguraDaCelula = Math.max(60, Math.floor(largura / colunas));
    const alturaDaCelula = Number(config.alturaDaCelula) || 130;

    const formatar = formatadorDoMedidor(medida, config);
    const tooltip = config.mostrarTooltip === false ? null : criarTooltip(raiz, tema);
    ctx.estado.tooltip = tooltip;

    for (const item of itens) {
      const celula = criarEl('div', { classe: 'md-celula', pai: grade });
      celula.style.width = `${larguraDaCelula}px`;
      celula.style.height = `${alturaDaCelula}px`;

      const svg = criarSvgEl('svg', {
        pai: celula,
        atributos: {
          width: larguraDaCelula,
          height: alturaDaCelula,
          viewBox: `0 0 ${larguraDaCelula} ${alturaDaCelula}`,
        },
      });

      const limites = config.escalaPorMedidor
        ? limitesDoMedidor([item.valor, item.alvo, ...faixas.map((f) => f.ate)], config)
        : limitesComuns;

      const alvo = Number.isFinite(alvoFixo) ? alvoFixo : item.alvo;

      desenharMedidor({
        svg,
        caixa: { x: 6, y: 6, largura: larguraDaCelula - 12, altura: alturaDaCelula - 12 },
        valor: item.valor,
        minimo: limites.minimo,
        maximo: limites.maximo,
        alvo,
        faixas,
        config,
        tema,
        formatar,
        rotulo: config.mostrarRotulos === false ? '' : item.rotulo,
        compacto: true,
      });

      if (tooltip) {
        ctx.eventos.on(celula, 'pointermove', (ev) => {
          const linhas = [{ rotulo: medida.rotuloCurto, valor: formatar(item.valor) }];
          if (alvo !== null && alvo !== undefined) linhas.push({ rotulo: 'Alvo', valor: formatar(alvo) });
          linhas.push({
            rotulo: 'Escala',
            valor: `${formatar(limites.minimo)} a ${formatar(limites.maximo)}`,
          });
          tooltip.mostrar({ titulo: item.rotulo, linhas }, ev.clientX, ev.clientY);
        });
        ctx.eventos.on(celula, 'pointerleave', () => tooltip.esconder());
      }

      ctx.eventos.on(celula, 'click', (ev) => {
        const celulaDoLooker = modelo.celula(modelo.linhas[item.indiceDaLinha], campoDoItem.nome);
        if (celulaDoLooker && ctx.ponte.temDrill(celulaDoLooker)) ctx.ponte.abrirDrill(celulaDoLooker, ev);
      });
    }
  },

  aoDestruir({ estado }) {
    if (estado && estado.tooltip) estado.tooltip.destruir();
  },
});
