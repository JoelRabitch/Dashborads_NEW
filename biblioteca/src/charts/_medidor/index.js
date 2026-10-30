/**
 * _medidor — base compartilhada dos medidores (gauges).
 *
 * `gauge_variacoes` desenha UM medidor grande em vários estilos;
 * `gauge_grid` desenha vários pequenos numa grade. O desenho é o mesmo:
 * um valor posicionado entre um mínimo e um máximo, com faixas coloridas
 * opcionais e um alvo.
 *
 * Nota sobre a escala: um medidor sem mínimo e máximo explícitos é uma
 * armadilha, porque a mesma agulha significa coisas diferentes a cada
 * atualização. Por isso o padrão é tirar os limites dos DADOS e dizer
 * isso na tela (o mínimo e o máximo aparecem nas pontas), e não fingir
 * uma escala fixa que ninguém definiu.
 */

import { criarSvgEl, definirTexto } from '../../core/dom.js';
import { coresDaPaleta, comOpacidade } from '../../core/theme.js';
import { formatadorDeValueFormat, truncar, formatarPercentual } from '../../core/format.js';
import { listaDeValores } from '../../core/options-kit.js';

export const CSS_MEDIDOR = `
.md-area{position:relative;width:100%;height:100%;overflow:hidden;}
.md-grade{display:flex;flex-wrap:wrap;align-content:flex-start;width:100%;height:100%;overflow:auto;}
.md-celula{position:relative;box-sizing:border-box;}
.md-valor{font-weight:700;}
.md-rotulo{opacity:.8;}
.md-limite{opacity:.6;}
.md-arco{transition:opacity .15s ease;}
@media (prefers-reduced-motion: reduce){.md-arco{transition:none;}}
`;

export const ESTILOS_DE_MEDIDOR = [
  { rotulo: 'Arco (270°)', valor: 'arco' },
  { rotulo: 'Semicírculo (180°)', valor: 'semicirculo' },
  { rotulo: 'Círculo completo', valor: 'circulo' },
  { rotulo: 'Barra linear', valor: 'barra' },
  { rotulo: 'Bullet chart', valor: 'bullet' },
];

/** Ângulos inicial e final de cada estilo circular, em graus. */
const ANGULOS = {
  arco: { inicio: -135, fim: 135 },
  semicirculo: { inicio: -90, fim: 90 },
  circulo: { inicio: -180, fim: 180 },
};

/** Quantas faixas coloridas o painel oferece. */
export const QUANTIDADE_DE_FAIXAS = 4;

/* ------------------------------------------------------------------ */
/* Opções                                                              */
/* ------------------------------------------------------------------ */

export function opcoesDeMedidor({ estiloPadrao = 'arco', secao = 'Medidor' } = {}) {
  const faixas = {};
  for (let i = 1; i <= QUANTIDADE_DE_FAIXAS; i++) {
    faixas[`faixa${i}Ate`] = {
      type: 'string',
      label: `Faixa ${i}: até o valor`,
      section: 'Faixas',
      default: '',
      display_size: 'half',
      placeholder: 'em branco = sem faixa',
    };
    faixas[`faixa${i}Cor`] = {
      type: 'string',
      label: `Faixa ${i}: cor`,
      section: 'Faixas',
      display: 'color',
      default: ['#DC2626', '#F59E0B', '#16A34A', '#2563EB'][i - 1],
      display_size: 'half',
    };
  }

  return {
    estiloDoMedidor: {
      type: 'string',
      label: 'Estilo',
      section: secao,
      display: 'select',
      default: estiloPadrao,
      values: listaDeValores(ESTILOS_DE_MEDIDOR),
    },
    origemDosLimites: {
      type: 'string',
      label: 'Mínimo e máximo',
      section: secao,
      display: 'select',
      default: 'dados',
      values: listaDeValores([
        { rotulo: 'Dos dados (0 até o maior valor)', valor: 'dados' },
        { rotulo: 'Dos dados (menor até maior)', valor: 'dadosCompleto' },
        { rotulo: 'Valores fixos', valor: 'fixo' },
      ]),
    },
    minimoDoMedidor: {
      type: 'string',
      label: 'Mínimo (valor fixo)',
      section: secao,
      default: '0',
      display_size: 'half',
    },
    maximoDoMedidor: {
      type: 'string',
      label: 'Máximo (valor fixo)',
      section: secao,
      default: '100',
      display_size: 'half',
    },
    espessuraDoArco: {
      type: 'number',
      label: 'Espessura do arco (% do raio)',
      section: secao,
      display: 'range',
      min: 5,
      max: 100,
      step: 5,
      default: 28,
    },
    mostrarAgulha: { type: 'boolean', label: 'Mostrar agulha', section: secao, default: false },
    mostrarLimites: {
      type: 'boolean',
      label: 'Escrever o mínimo e o máximo nas pontas',
      section: secao,
      default: true,
    },
    corDoMedidor: {
      type: 'string',
      label: 'Cor do preenchimento (vazio = faixa ou paleta)',
      section: 'Cores',
      display: 'color',
      default: '',
    },
    corDoFundoDoArco: {
      type: 'string',
      label: 'Cor do trilho',
      section: 'Cores',
      display: 'color',
      default: '',
    },

    alvoVindoDe: {
      type: 'string',
      label: 'Alvo',
      section: 'Alvo',
      display: 'select',
      default: 'nenhum',
      values: listaDeValores([
        { rotulo: 'Sem alvo', valor: 'nenhum' },
        { rotulo: 'Valor fixo', valor: 'fixo' },
        { rotulo: 'Segunda medida', valor: 'medida' },
      ]),
    },
    valorDoAlvo: { type: 'string', label: 'Alvo (valor fixo)', section: 'Alvo', default: '' },
    corDoAlvo: { type: 'string', label: 'Cor do alvo', section: 'Alvo', display: 'color', default: '#111827' },
    mostrarPercentualDoAlvo: {
      type: 'boolean',
      label: 'Mostrar o quanto do alvo foi atingido',
      section: 'Alvo',
      default: true,
    },

    ...faixas,
  };
}

/* ------------------------------------------------------------------ */
/* Cálculo                                                             */
/* ------------------------------------------------------------------ */

function numeroOuNulo(texto) {
  if (texto === null || texto === undefined || texto === '') return null;
  const n = Number(String(texto).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Lê as faixas configuradas, em ordem crescente de limite. */
export function lerFaixas(config) {
  const faixas = [];
  for (let i = 1; i <= QUANTIDADE_DE_FAIXAS; i++) {
    const ate = numeroOuNulo(config[`faixa${i}Ate`]);
    if (ate === null) continue;
    faixas.push({ ate, cor: config[`faixa${i}Cor`] || '#9CA3AF' });
  }
  return faixas.sort((a, b) => a.ate - b.ate);
}

/** Cor da faixa em que o valor cai (null quando não há faixas). */
export function corDaFaixa(valor, faixas) {
  if (!faixas.length) return null;
  for (const faixa of faixas) {
    if (valor <= faixa.ate) return faixa.cor;
  }
  return faixas[faixas.length - 1].cor;
}

/** Resolve mínimo e máximo conforme a opção escolhida. */
export function limitesDoMedidor(valores, config) {
  const modo = config.origemDosLimites || 'dados';
  const limpos = valores.filter((v) => v !== null && Number.isFinite(v));

  if (modo === 'fixo') {
    const minimo = numeroOuNulo(config.minimoDoMedidor);
    const maximo = numeroOuNulo(config.maximoDoMedidor);
    if (minimo !== null && maximo !== null && maximo > minimo) return { minimo, maximo };
  }

  if (!limpos.length) return { minimo: 0, maximo: 1 };

  const maior = Math.max(...limpos);
  const menor = Math.min(...limpos);

  if (modo === 'dadosCompleto') {
    if (maior === menor) return { minimo: menor - Math.abs(menor || 1) * 0.1, maximo: maior + Math.abs(maior || 1) * 0.1 };
    return { minimo: menor, maximo: maior };
  }

  // Padrão: de 0 (ou do menor, se houver negativo) até o maior.
  return { minimo: Math.min(0, menor), maximo: maior === 0 ? 1 : maior };
}

/** Onde o valor cai, de 0 a 1, preso aos limites. */
export function fracaoDoValor(valor, minimo, maximo) {
  if (valor === null || !Number.isFinite(valor) || maximo === minimo) return 0;
  return Math.max(0, Math.min(1, (valor - minimo) / (maximo - minimo)));
}

/* ------------------------------------------------------------------ */
/* Desenho                                                             */
/* ------------------------------------------------------------------ */

function pontoNoArco(cx, cy, raio, anguloEmGraus) {
  const rad = ((anguloEmGraus - 90) * Math.PI) / 180;
  return [cx + raio * Math.cos(rad), cy + raio * Math.sin(rad)];
}

/** Caminho de um anel entre dois ângulos (em graus). */
function caminhoDeAnel(cx, cy, raioExterno, raioInterno, de, ate) {
  const arcoGrande = Math.abs(ate - de) > 180 ? 1 : 0;
  const [x1, y1] = pontoNoArco(cx, cy, raioExterno, de);
  const [x2, y2] = pontoNoArco(cx, cy, raioExterno, ate);
  const [x3, y3] = pontoNoArco(cx, cy, raioInterno, ate);
  const [x4, y4] = pontoNoArco(cx, cy, raioInterno, de);
  return [
    `M${x1.toFixed(2)},${y1.toFixed(2)}`,
    `A${raioExterno},${raioExterno} 0 ${arcoGrande} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
    `L${x3.toFixed(2)},${y3.toFixed(2)}`,
    `A${raioInterno},${raioInterno} 0 ${arcoGrande} 0 ${x4.toFixed(2)},${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/**
 * Desenha um medidor dentro de um retângulo.
 *
 * @param {object} params
 * @returns {{elementoDoValor:Element|null}}
 */
export function desenharMedidor({
  svg,
  caixa,
  valor,
  minimo,
  maximo,
  alvo = null,
  faixas = [],
  config,
  tema,
  formatar,
  rotulo = '',
  compacto = false,
}) {
  const estilo = config.estiloDoMedidor || 'arco';
  const cor =
    config.corDoMedidor || corDaFaixa(valor, faixas) || coresDaPaleta(config.paleta)[0] || tema.destaque;
  const corDoTrilho = config.corDoFundoDoArco || comOpacidade(tema.textoSuave, 0.16);
  const fracao = fracaoDoValor(valor, minimo, maximo);
  const fracaoDoAlvo = alvo === null ? null : fracaoDoValor(alvo, minimo, maximo);

  if (estilo === 'barra' || estilo === 'bullet') {
    return desenharLinear({
      svg, caixa, valor, minimo, maximo, alvo, faixas, config, tema, formatar, rotulo,
      cor, corDoTrilho, fracao, fracaoDoAlvo, ehBullet: estilo === 'bullet', compacto,
    });
  }

  const angulos = ANGULOS[estilo] || ANGULOS.arco;
  const varredura = angulos.fim - angulos.inicio;

  // O semicírculo usa só a metade de cima, então o centro desce e o raio
  // pode ser maior — senão sobraria metade da caixa vazia.
  const ehMeio = estilo === 'semicirculo';
  const raio = ehMeio
    ? Math.min(caixa.largura / 2, caixa.altura) - 4
    : Math.min(caixa.largura, caixa.altura) / 2 - 4;
  const cx = caixa.x + caixa.largura / 2;
  const cy = ehMeio ? caixa.y + caixa.altura - Math.max(10, caixa.altura * 0.18) : caixa.y + caixa.altura / 2;

  if (raio < 8) return { elementoDoValor: null };

  const espessura = Math.max(3, raio * ((Number(config.espessuraDoArco) || 28) / 100));
  const raioInterno = Math.max(1, raio - espessura);

  // --- Trilho ---
  criarSvgEl('path', {
    pai: svg,
    classe: 'md-arco',
    atributos: {
      d: caminhoDeAnel(cx, cy, raio, raioInterno, angulos.inicio, angulos.fim),
      fill: corDoTrilho,
    },
  });

  // --- Faixas coloridas sobre o trilho ---
  if (faixas.length) {
    let anterior = minimo;
    for (const faixa of faixas) {
      const de = angulos.inicio + fracaoDoValor(anterior, minimo, maximo) * varredura;
      const ate = angulos.inicio + fracaoDoValor(faixa.ate, minimo, maximo) * varredura;
      if (ate > de) {
        criarSvgEl('path', {
          pai: svg,
          classe: 'md-arco',
          atributos: {
            d: caminhoDeAnel(cx, cy, raio, raioInterno, de, ate),
            fill: comOpacidade(faixa.cor, 0.3),
          },
        });
      }
      anterior = faixa.ate;
    }
  }

  // --- Preenchimento do valor ---
  const anguloDoValor = angulos.inicio + fracao * varredura;
  if (fracao > 0.001) {
    criarSvgEl('path', {
      pai: svg,
      classe: 'md-arco',
      atributos: {
        d: caminhoDeAnel(cx, cy, raio, raioInterno, angulos.inicio, anguloDoValor),
        fill: cor,
      },
    });
  }

  // --- Alvo ---
  if (fracaoDoAlvo !== null) {
    const anguloDoAlvo = angulos.inicio + fracaoDoAlvo * varredura;
    const [ax1, ay1] = pontoNoArco(cx, cy, raioInterno - 2, anguloDoAlvo);
    const [ax2, ay2] = pontoNoArco(cx, cy, raio + 3, anguloDoAlvo);
    criarSvgEl('line', {
      pai: svg,
      atributos: {
        x1: ax1, y1: ay1, x2: ax2, y2: ay2,
        stroke: config.corDoAlvo || tema.texto,
        'stroke-width': 2,
      },
    });
  }

  // --- Agulha ---
  if (config.mostrarAgulha) {
    const [px, py] = pontoNoArco(cx, cy, raioInterno - 4, anguloDoValor);
    criarSvgEl('line', {
      pai: svg,
      atributos: { x1: cx, y1: cy, x2: px, y2: py, stroke: tema.texto, 'stroke-width': 2 },
    });
    criarSvgEl('circle', { pai: svg, atributos: { cx, cy, r: 3, fill: tema.texto } });
  }

  // --- Textos ---
  const tamanhoDoValor = Math.max(10, Math.min(raioInterno * 0.7, compacto ? 18 : 42));
  const elementoDoValor = criarSvgEl('text', {
    pai: svg,
    classe: 'md-valor',
    atributos: {
      x: cx,
      y: ehMeio ? cy - raioInterno * 0.3 : cy,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': tamanhoDoValor,
      fill: tema.texto,
    },
  });
  definirTexto(elementoDoValor, valor === null ? '—' : formatar(valor));

  if (rotulo) {
    const texto = criarSvgEl('text', {
      pai: svg,
      classe: 'md-rotulo',
      atributos: {
        x: cx,
        y: (ehMeio ? cy - raioInterno * 0.3 : cy) + tamanhoDoValor * 0.85,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': Math.max(8, tamanhoDoValor * 0.34),
        fill: tema.textoSuave,
      },
    });
    definirTexto(texto, truncar(rotulo, compacto ? 16 : 28));
  }

  if (alvo !== null && config.mostrarPercentualDoAlvo !== false && alvo !== 0) {
    const texto = criarSvgEl('text', {
      pai: svg,
      classe: 'md-rotulo',
      atributos: {
        x: cx,
        y: (ehMeio ? cy - raioInterno * 0.3 : cy) + tamanhoDoValor * (rotulo ? 1.5 : 0.85),
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': Math.max(8, tamanhoDoValor * 0.3),
        fill: tema.textoSuave,
      },
    });
    definirTexto(texto, `${formatarPercentual((valor || 0) / alvo, 0)} do alvo`);
  }

  if (config.mostrarLimites !== false && !compacto) {
    const [minX, minY] = pontoNoArco(cx, cy, raio + 10, angulos.inicio);
    const [maxX, maxY] = pontoNoArco(cx, cy, raio + 10, angulos.fim);
    escreverLimite(svg, minX, minY, formatar(minimo), tema);
    escreverLimite(svg, maxX, maxY, formatar(maximo), tema);
  }

  return { elementoDoValor };
}

function escreverLimite(svg, x, y, texto, tema) {
  const el = criarSvgEl('text', {
    pai: svg,
    classe: 'md-limite',
    atributos: {
      x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': Math.max(8, tema.tamanhoBase - 2),
      fill: tema.textoSuave,
    },
  });
  definirTexto(el, texto);
}

/** Barra linear e bullet chart. */
function desenharLinear({
  svg, caixa, valor, minimo, maximo, alvo, faixas, config, tema, formatar, rotulo,
  cor, corDoTrilho, fracao, fracaoDoAlvo, ehBullet, compacto,
}) {
  const alturaDaBarra = ehBullet
    ? Math.max(6, Math.min(26, caixa.altura * 0.3))
    : Math.max(8, Math.min(48, caixa.altura * 0.45));
  const y = caixa.y + caixa.altura / 2 - alturaDaBarra / 2;

  // No bullet o valor fica à esquerda, fora da barra; na barra simples ele
  // vai por cima, centralizado.
  const espacoDoTexto = ehBullet ? Math.min(120, caixa.largura * 0.3) : 0;
  const x = caixa.x + espacoDoTexto;
  const largura = Math.max(10, caixa.largura - espacoDoTexto);

  criarSvgEl('rect', {
    pai: svg,
    atributos: { x, y, width: largura, height: alturaDaBarra, fill: corDoTrilho, rx: 2 },
  });

  if (faixas.length) {
    let anterior = minimo;
    for (const faixa of faixas) {
      const de = x + fracaoDoValor(anterior, minimo, maximo) * largura;
      const ate = x + fracaoDoValor(faixa.ate, minimo, maximo) * largura;
      if (ate > de) {
        criarSvgEl('rect', {
          pai: svg,
          atributos: { x: de, y, width: ate - de, height: alturaDaBarra, fill: comOpacidade(faixa.cor, 0.3) },
        });
      }
      anterior = faixa.ate;
    }
  }

  const alturaDoValor = ehBullet ? alturaDaBarra * 0.5 : alturaDaBarra;
  criarSvgEl('rect', {
    pai: svg,
    atributos: {
      x,
      y: y + (alturaDaBarra - alturaDoValor) / 2,
      width: Math.max(0, fracao * largura),
      height: alturaDoValor,
      fill: cor,
      rx: 2,
    },
  });

  if (fracaoDoAlvo !== null) {
    const xAlvo = x + fracaoDoAlvo * largura;
    criarSvgEl('line', {
      pai: svg,
      atributos: {
        x1: xAlvo, y1: y - 3, x2: xAlvo, y2: y + alturaDaBarra + 3,
        stroke: config.corDoAlvo || tema.texto,
        'stroke-width': 2,
      },
    });
  }

  const tamanho = Math.max(9, Math.min(alturaDaBarra * 0.8, compacto ? 14 : 20));
  const elementoDoValor = criarSvgEl('text', {
    pai: svg,
    classe: 'md-valor',
    atributos: {
      x: ehBullet ? caixa.x : x + largura / 2,
      y: caixa.y + caixa.altura / 2,
      'text-anchor': ehBullet ? 'start' : 'middle',
      'dominant-baseline': 'central',
      'font-size': tamanho,
      fill: tema.texto,
    },
  });
  definirTexto(elementoDoValor, valor === null ? '—' : formatar(valor));

  if (rotulo) {
    const texto = criarSvgEl('text', {
      pai: svg,
      classe: 'md-rotulo',
      atributos: {
        x: ehBullet ? caixa.x : x + largura / 2,
        y: y - 6,
        'text-anchor': ehBullet ? 'start' : 'middle',
        'font-size': Math.max(8, tema.tamanhoBase - 1),
        fill: tema.textoSuave,
      },
    });
    definirTexto(texto, truncar(rotulo, compacto ? 18 : 40));
  }

  if (config.mostrarLimites !== false && !compacto) {
    escreverLimite(svg, x, y + alturaDaBarra + 10, formatar(minimo), tema);
    escreverLimite(svg, x + largura, y + alturaDaBarra + 10, formatar(maximo), tema);
  }

  return { elementoDoValor };
}

/** Formatador padrão dos medidores. */
export function formatadorDoMedidor(medida, config) {
  return formatadorDeValueFormat(medida && medida.valueFormat, {
    casas: Number(config.casasDecimaisDoRotulo) || 0,
  });
}
