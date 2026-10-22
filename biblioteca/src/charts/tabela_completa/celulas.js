/**
 * celulas.js — tipos de célula da Tabela Completa.
 *
 * Cada função desenha o conteúdo de um `<td>` e devolve o texto equivalente
 * (usado no `title` e na exportação CSV). Nenhuma delas usa `innerHTML`:
 * texto entra por `textContent` e as formas são SVG montado por
 * `createElementNS`.
 *
 * Os tipos que precisam de uma LISTA de valores (sparkline, mini barras,
 * mini área) leem os valores da mesma medida nas colunas do pivô daquela
 * linha. Sem pivô não há série, e a célula cai para o texto normal.
 */

import { criarEl, criarSvgEl, definirTexto, urlDeImagemSegura } from '../../core/dom.js';
import { comOpacidade, textoLegivelSobre } from '../../core/theme.js';
import { formatarData } from '../../core/format.js';
import { posicaoNaColuna } from './regras.js';

const CSS = `
.tc-barra-fundo{position:relative;display:block;width:100%;height:60%;border-radius:3px;overflow:hidden;}
.tc-barra-valor{position:absolute;top:0;bottom:0;border-radius:3px;}
.tc-barra-texto{position:relative;padding:0 4px;font-variant-numeric:tabular-nums;}
.tc-pilha{display:flex;align-items:center;gap:6px;height:100%;}
.tc-badge{display:inline-block;padding:1px 7px;border-radius:999px;font-size:.85em;font-weight:600;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;}
.tc-semaforo{display:inline-block;width:10px;height:10px;border-radius:50%;flex:0 0 auto;}
.tc-avatar{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
  border-radius:50%;font-size:10px;font-weight:700;flex:0 0 auto;}
.tc-img{height:80%;max-width:100%;object-fit:contain;display:block;}
.tc-link{text-decoration:underline;cursor:pointer;}
.tc-icone{flex:0 0 auto;}
@keyframes tc-piscar{0%,100%{opacity:1}50%{opacity:.35}}
.tc-piscando{animation:tc-piscar 1.1s ease-in-out infinite;}
@media (prefers-reduced-motion: reduce){.tc-piscando{animation:none;}}
`;

export function cssDasCelulas() {
  return CSS;
}

/** Cores padrão dos semáforos e badges, do pior para o melhor. */
const CORES_DE_FAIXA = ['#DC2626', '#F59E0B', '#16A34A'];

/** Monta a linha "flex" que a maioria dos tipos usa. */
function pilha(td, alinhamento) {
  const caixa = criarEl('div', { classe: 'tc-pilha', pai: td });
  caixa.style.justifyContent =
    alinhamento === 'right' ? 'flex-end' : alinhamento === 'center' ? 'center' : 'flex-start';
  return caixa;
}

/** Valores da mesma medida nas colunas do pivô, para os mini gráficos. */
export function serieDaLinha(coluna, linha, modelo) {
  if (!modelo.temPivo || !coluna.ehMedida) return [];
  const saida = [];
  for (const p of modelo.pivotsDeDados) {
    saida.push(modelo.valorNumerico(linha, coluna.campo.nome, p.chave));
  }
  return saida;
}

/** Desenha um caminho SVG a partir de valores (sparkline / mini área). */
function miniCaminho(valores, largura, altura, fechar) {
  const limpos = valores.map((v) => (v === null || !Number.isFinite(v) ? null : v));
  const existentes = limpos.filter((v) => v !== null);
  if (existentes.length < 2) return null;

  const minimo = Math.min(...existentes);
  const maximo = Math.max(...existentes);
  const amplitude = maximo - minimo || 1;
  const passo = limpos.length > 1 ? largura / (limpos.length - 1) : largura;

  let d = '';
  let comecou = false;
  limpos.forEach((v, i) => {
    if (v === null) return;
    const x = i * passo;
    const y = altura - ((v - minimo) / amplitude) * altura;
    d += `${comecou ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
    comecou = true;
  });
  if (fechar) d += `L${largura.toFixed(2)},${altura}L0,${altura}Z`;
  return d;
}

/* ------------------------------------------------------------------ */
/* Tipos de célula                                                      */
/* ------------------------------------------------------------------ */

const DESENHISTAS = {
  barraDeDados(ctx) {
    const { td, coluna, linha, visual, estatistica } = ctx;
    const valor = coluna.valorNumerico(linha);
    const texto = ctx.texto;
    if (valor === null) return ctx.comoTexto();

    const fundo = criarEl('div', { classe: 'tc-barra-fundo', pai: td });
    fundo.style.background = comOpacidade(coluna.corDaBarra, 0.14);

    const minimo = Math.min(0, estatistica ? estatistica.minimo ?? 0 : 0);
    const maximo = Math.max(0, estatistica ? estatistica.maximo ?? valor : valor);
    const amplitude = maximo - minimo || 1;
    const zero = ((0 - minimo) / amplitude) * 100;
    const posicao = ((valor - minimo) / amplitude) * 100;

    const barra = criarEl('div', { classe: 'tc-barra-valor', pai: fundo });
    barra.style.background = coluna.corDaBarra;
    barra.style.left = `${Math.min(zero, posicao)}%`;
    barra.style.width = `${Math.abs(posicao - zero)}%`;

    const rotulo = criarEl('span', { classe: 'tc-barra-texto', pai: fundo });
    definirTexto(rotulo, texto);
    rotulo.style.color = visual.texto;
    rotulo.style.lineHeight = `${Math.round(visual.alturaLinha * 0.6)}px`;
    return texto;
  },

  progresso(ctx) {
    const { td, coluna, linha, visual } = ctx;
    const valor = coluna.valorNumerico(linha);
    if (valor === null) return ctx.comoTexto();
    const fracao = Math.max(0, Math.min(1, valor > 1.5 ? valor / 100 : valor));

    const caixa = pilha(td, 'left');
    const trilho = criarEl('div', { pai: caixa });
    trilho.style.flex = '1 1 auto';
    trilho.style.height = '8px';
    trilho.style.borderRadius = '999px';
    trilho.style.background = comOpacidade(coluna.corDaBarra, 0.18);
    trilho.style.overflow = 'hidden';

    const preenchido = criarEl('div', { pai: trilho });
    preenchido.style.width = `${fracao * 100}%`;
    preenchido.style.height = '100%';
    preenchido.style.background = coluna.corDaBarra;

    const texto = `${Math.round(fracao * 100)}%`;
    const rotulo = criarEl('span', { pai: caixa, texto });
    rotulo.style.flex = '0 0 auto';
    rotulo.style.color = visual.texto;
    return texto;
  },

  anel(ctx) {
    const { td, coluna, linha, visual } = ctx;
    const valor = coluna.valorNumerico(linha);
    if (valor === null) return ctx.comoTexto();
    const fracao = Math.max(0, Math.min(1, valor > 1.5 ? valor / 100 : valor));

    const lado = Math.max(14, Math.round(visual.alturaLinha * 0.7));
    const raio = lado / 2 - 2;
    const circunferencia = 2 * Math.PI * raio;

    const caixa = pilha(td, coluna.alinhamento);
    const svg = criarSvgEl('svg', { pai: caixa, atributos: { width: lado, height: lado } });
    criarSvgEl('circle', {
      pai: svg,
      atributos: {
        cx: lado / 2, cy: lado / 2, r: raio, fill: 'none',
        stroke: comOpacidade(coluna.corDaBarra, 0.2), 'stroke-width': 3,
      },
    });
    criarSvgEl('circle', {
      pai: svg,
      atributos: {
        cx: lado / 2, cy: lado / 2, r: raio, fill: 'none',
        stroke: coluna.corDaBarra, 'stroke-width': 3, 'stroke-linecap': 'round',
        'stroke-dasharray': `${circunferencia * fracao} ${circunferencia}`,
        transform: `rotate(-90 ${lado / 2} ${lado / 2})`,
      },
    });

    const texto = `${Math.round(fracao * 100)}%`;
    const rotulo = criarEl('span', { pai: caixa, texto });
    rotulo.style.color = visual.texto;
    return texto;
  },

  medidor(ctx) {
    const { td, coluna, linha, visual, estatistica } = ctx;
    const valor = coluna.valorNumerico(linha);
    if (valor === null) return ctx.comoTexto();
    const fracao = posicaoNaColuna(valor, estatistica);
    if (fracao === null) return ctx.comoTexto();

    const largura = Math.max(34, Math.round(visual.alturaLinha * 1.6));
    const altura = Math.max(14, Math.round(visual.alturaLinha * 0.48));
    const caixa = pilha(td, coluna.alinhamento);
    const svg = criarSvgEl('svg', { pai: caixa, atributos: { width: largura, height: altura } });

    const raio = Math.min(largura / 2, altura) - 2;
    const cx = largura / 2;
    const cy = altura - 1;
    const arco = (de, ate, cor, espessura) => {
      const p0 = [cx + raio * Math.cos(Math.PI * (1 - de)), cy - raio * Math.sin(Math.PI * (1 - de))];
      const p1 = [cx + raio * Math.cos(Math.PI * (1 - ate)), cy - raio * Math.sin(Math.PI * (1 - ate))];
      criarSvgEl('path', {
        pai: svg,
        atributos: {
          d: `M${p0[0].toFixed(2)},${p0[1].toFixed(2)}A${raio},${raio} 0 0 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`,
          fill: 'none', stroke: cor, 'stroke-width': espessura, 'stroke-linecap': 'round',
        },
      });
    };
    arco(0, 1, comOpacidade(coluna.corDaBarra, 0.18), 4);
    if (fracao > 0.01) arco(0, fracao, coluna.corDaBarra, 4);

    const rotulo = criarEl('span', { pai: caixa, texto: ctx.texto });
    rotulo.style.color = visual.texto;
    return ctx.texto;
  },

  sparkline(ctx) {
    return desenharMini(ctx, 'linha');
  },

  miniArea(ctx) {
    return desenharMini(ctx, 'area');
  },

  miniBarras(ctx) {
    const { td, coluna, linha, visual, modelo } = ctx;
    const valores = serieDaLinha(coluna, linha, modelo);
    if (valores.filter((v) => v !== null).length < 2) return ctx.comoTexto();

    const largura = Math.max(40, Math.round(visual.alturaLinha * 2.4));
    const altura = Math.max(12, Math.round(visual.alturaLinha * 0.62));
    const existentes = valores.filter((v) => v !== null && Number.isFinite(v));
    const maximo = Math.max(...existentes.map(Math.abs)) || 1;
    const largoDaBarra = largura / valores.length;

    const caixa = pilha(td, coluna.alinhamento);
    const svg = criarSvgEl('svg', { pai: caixa, atributos: { width: largura, height: altura } });
    valores.forEach((v, i) => {
      if (v === null || !Number.isFinite(v)) return;
      const h = Math.max(1, (Math.abs(v) / maximo) * altura);
      criarSvgEl('rect', {
        pai: svg,
        atributos: {
          x: (i * largoDaBarra + largoDaBarra * 0.15).toFixed(2),
          y: (altura - h).toFixed(2),
          width: Math.max(1, largoDaBarra * 0.7).toFixed(2),
          height: h.toFixed(2),
          fill: v < 0 ? '#DC2626' : coluna.corDaBarra,
          rx: 1,
        },
      });
    });
    return ctx.texto;
  },

  badge(ctx) {
    const { td, coluna, visual } = ctx;
    const caixa = pilha(td, coluna.alinhamento);
    const cor = ctx.corDoBadge || coluna.corDaBarra;
    const badge = criarEl('span', { classe: 'tc-badge', pai: caixa, texto: ctx.texto });
    badge.style.background = comOpacidade(cor, visual.escuro ? 0.3 : 0.18);
    badge.style.color = visual.escuro ? '#FFFFFF' : cor;
    return ctx.texto;
  },

  semaforo(ctx) {
    const { td, coluna, linha, visual, estatistica } = ctx;
    const valor = coluna.valorNumerico(linha);
    const caixa = pilha(td, coluna.alinhamento);
    const fracao = posicaoNaColuna(valor, estatistica);
    const cor = fracao === null ? visual.borda : CORES_DE_FAIXA[Math.min(2, Math.floor(fracao * 3))];
    const bola = criarEl('span', { classe: 'tc-semaforo', pai: caixa });
    bola.style.background = cor;
    const rotulo = criarEl('span', { pai: caixa, texto: ctx.texto });
    rotulo.style.color = visual.texto;
    rotulo.style.overflow = 'hidden';
    rotulo.style.textOverflow = 'ellipsis';
    return ctx.texto;
  },

  seta(ctx) {
    const { td, coluna, linha, config, visual } = ctx;
    const valor = coluna.valorNumerico(linha);
    const caixa = pilha(td, coluna.alinhamento);
    if (valor !== null && valor !== 0) {
      const seta = criarEl('span', { classe: 'tc-icone', pai: caixa, texto: valor > 0 ? '▲' : '▼' });
      seta.style.color = valor > 0 ? config.corDeSubida || '#16A34A' : config.corDeDescida || '#DC2626';
    }
    const rotulo = criarEl('span', { pai: caixa, texto: ctx.texto });
    rotulo.style.color = visual.texto;
    return ctx.texto;
  },

  estrelas(ctx) {
    const { td, coluna, linha, visual, estatistica } = ctx;
    const valor = coluna.valorNumerico(linha);
    if (valor === null) return ctx.comoTexto();
    // Até 5: o valor vale por si; acima disso, normaliza pela coluna.
    const fracao = valor <= 5 ? valor / 5 : posicaoNaColuna(valor, estatistica) ?? 0;
    const cheias = Math.round(Math.max(0, Math.min(1, fracao)) * 5);

    const caixa = pilha(td, coluna.alinhamento);
    for (let i = 0; i < 5; i++) {
      const estrela = criarEl('span', { pai: caixa, texto: i < cheias ? '★' : '☆' });
      estrela.style.color = i < cheias ? coluna.corDaBarra : visual.borda;
      estrela.style.marginRight = '-3px';
    }
    return `${cheias}/5`;
  },

  booleano(ctx) {
    const { td, coluna } = ctx;
    const bruto = ctx.texto.trim().toLowerCase();
    const verdadeiro = ['sim', 'yes', 'true', '1', 'verdadeiro', 'ativo'].includes(bruto);
    const falso = ['não', 'nao', 'no', 'false', '0', 'falso', 'inativo'].includes(bruto);
    if (!verdadeiro && !falso) return ctx.comoTexto();

    const caixa = pilha(td, coluna.alinhamento || 'center');
    const marca = criarEl('span', { pai: caixa, texto: verdadeiro ? '✓' : '✗' });
    marca.style.color = verdadeiro ? '#16A34A' : '#DC2626';
    marca.style.fontWeight = '700';
    return verdadeiro ? '✓' : '✗';
  },

  avatar(ctx) {
    const { td, coluna, visual } = ctx;
    const texto = ctx.texto;
    const iniciais = texto
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');

    const caixa = pilha(td, coluna.alinhamento);
    const bolha = criarEl('div', { classe: 'tc-avatar', pai: caixa, texto: iniciais });
    const cor = corEstavel(texto);
    bolha.style.background = cor;
    bolha.style.color = textoLegivelSobre(cor, visual);
    const rotulo = criarEl('span', { pai: caixa, texto });
    rotulo.style.color = visual.texto;
    rotulo.style.overflow = 'hidden';
    rotulo.style.textOverflow = 'ellipsis';
    return texto;
  },

  imagem(ctx) {
    const { td, coluna, linha } = ctx;
    const bruto = coluna.celula(linha);
    const url = urlDeImagemSegura(bruto && bruto.value);
    if (!url) return ctx.comoTexto();
    const img = criarEl('img', { classe: 'tc-img', pai: td });
    img.src = url;
    img.alt = ctx.texto;
    return ctx.texto;
  },

  data(ctx) {
    const { td, coluna, linha, config } = ctx;
    const bruto = coluna.celula(linha);
    const texto = formatarData(bruto && bruto.value, config.estiloDeData || 'auto');
    if (!texto) return ctx.comoTexto();
    definirTexto(td, texto);
    return texto;
  },

  link(ctx) {
    const { td, coluna, linha, ponte, visual } = ctx;
    const celula = coluna.celula(linha);
    const span = criarEl('span', { classe: 'tc-link', pai: td, texto: ctx.texto });
    span.style.color = visual.escuro ? '#93C5FD' : '#1D4ED8';
    if (celula && ponte.temDrill(celula)) {
      ctx.eventos.on(span, 'click', (ev) => {
        ev.stopPropagation();
        ponte.abrirDrill(celula, ev);
      });
    }
    return ctx.texto;
  },
};

function desenharMini(ctx, estilo) {
  const { td, coluna, linha, visual, modelo } = ctx;
  const valores = serieDaLinha(coluna, linha, modelo);
  if (valores.filter((v) => v !== null).length < 2) return ctx.comoTexto();

  const largura = Math.max(40, Math.round(visual.alturaLinha * 2.4));
  const altura = Math.max(12, Math.round(visual.alturaLinha * 0.62));
  const d = miniCaminho(valores, largura, altura, estilo === 'area');
  if (!d) return ctx.comoTexto();

  const caixa = pilha(td, coluna.alinhamento);
  const svg = criarSvgEl('svg', { pai: caixa, atributos: { width: largura, height: altura } });
  criarSvgEl('path', {
    pai: svg,
    atributos: {
      d,
      fill: estilo === 'area' ? comOpacidade(coluna.corDaBarra, 0.25) : 'none',
      stroke: coluna.corDaBarra,
      'stroke-width': 1.5,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    },
  });
  return ctx.texto;
}

/**
 * Cores dos avatares. Hex (e não hsl) porque os utilitários de cor do núcleo
 * só entendem hex e rgb.
 */
const CORES_DE_AVATAR = [
  '#BFDBFE', '#BBF7D0', '#FED7AA', '#FBCFE8', '#DDD6FE',
  '#A5F3FC', '#FDE68A', '#C7D2FE', '#FECACA', '#D9F99D',
];

/** Cor estável a partir de um texto (mesmo nome, mesma cor sempre). */
function corEstavel(texto) {
  let soma = 0;
  for (let i = 0; i < texto.length; i++) soma = (soma * 31 + texto.charCodeAt(i)) % 9973;
  return CORES_DE_AVATAR[soma % CORES_DE_AVATAR.length];
}

/** Decide qual desenhista usar; `null` significa "texto normal". */
export function desenhistaDoTipo(tipo) {
  return DESENHISTAS[tipo] || null;
}

/**
 * Tipos que precisam conhecer o mínimo/máximo da coluna inteira para
 * desenhar. Sem isso a barra sairia sempre cheia e o medidor, vazio.
 */
export const TIPOS_QUE_PRECISAM_DA_COLUNA = new Set([
  'barraDeDados',
  'medidor',
  'semaforo',
  'estrelas',
]);
