/**
 * geometria.js — formas e posições do Diagrama de Venn.
 *
 * Para 2 e 3 conjuntos usamos círculos (o Venn clássico). Para 4 e 5 não
 * existe Venn com círculos: a construção padrão usa elipses congruentes
 * giradas. Os valores dos layouts estão em coordenadas normalizadas
 * (-1 a 1) e são escalados na hora de desenhar.
 *
 * As posições dos rótulos de cada região NÃO são fixas: são encontradas
 * amostrando a área numa grade e achando o ponto mais "central" de cada
 * região. Isso funciona igual para círculos e elipses, e sobrevive a
 * qualquer ajuste de layout.
 */

/** Layouts por quantidade de conjuntos: {cx, cy, rx, ry, rotacao(graus)}. */
const LAYOUTS = {
  1: [{ cx: 0, cy: 0, rx: 0.62, ry: 0.62, rotacao: 0 }],

  2: [
    { cx: -0.26, cy: 0, rx: 0.52, ry: 0.52, rotacao: 0 },
    { cx: 0.26, cy: 0, rx: 0.52, ry: 0.52, rotacao: 0 },
  ],

  3: [
    { cx: 0, cy: -0.28, rx: 0.5, ry: 0.5, rotacao: 0 },
    { cx: -0.26, cy: 0.17, rx: 0.5, ry: 0.5, rotacao: 0 },
    { cx: 0.26, cy: 0.17, rx: 0.5, ry: 0.5, rotacao: 0 },
  ],

  // Venn de 4 elipses congruentes. Estes números saíram de uma busca que
  // maximizou a MENOR região (conferida por amostragem): com 4 elipses
  // sempre sobram duas regiões muito finas, e o objetivo foi deixá-las o
  // menos minúsculas possível.
  4: [
    { cx: -0.18, cy: -0.06, rx: 0.74, ry: 0.46, rotacao: -40 },
    { cx: -0.075, cy: -0.156, rx: 0.74, ry: 0.46, rotacao: -40 },
    { cx: 0.075, cy: -0.156, rx: 0.74, ry: 0.46, rotacao: 40 },
    { cx: 0.18, cy: -0.06, rx: 0.74, ry: 0.46, rotacao: 40 },
  ],

  // Venn de 5 elipses congruentes (construção clássica de Grünbaum).
  // Os números vêm da caixa unitária tradicional e foram conferidos por
  // amostragem: este layout produz TODAS as 31 regiões. Mexer neles sem
  // repetir a conferência faz regiões sumirem silenciosamente.
  5: montarVenn5(),
};

function montarVenn5() {
  const cru = [
    [0.428, 0.449, 155],
    [0.469, 0.543, 82],
    [0.558, 0.523, 10],
    [0.578, 0.432, 118],
    [0.489, 0.383, 46],
  ];
  const encolhe = 0.92;
  return cru.map(([x, y, angulo]) => ({
    cx: (x - 0.5) * 2 * encolhe,
    cy: -(y - 0.5) * 2 * encolhe,
    rx: 0.87 * encolhe,
    ry: 0.5 * encolhe,
    rotacao: -angulo,
  }));
}

/** Devolve o layout para N conjuntos, já escalado para a área disponível. */
export function layoutDeConjuntos(quantidade, { largura, altura, margem = 10 }) {
  const base = LAYOUTS[Math.min(5, Math.max(1, quantidade))] || LAYOUTS[3];
  const escala = Math.min(largura - margem * 2, altura - margem * 2) / 2;
  const cx = largura / 2;
  const cy = altura / 2;

  return base.map((e) => ({
    cx: cx + e.cx * escala,
    cy: cy + e.cy * escala,
    rx: e.rx * escala,
    ry: e.ry * escala,
    rotacao: e.rotacao,
  }));
}

/** Diz se um ponto está dentro de uma elipse girada. */
export function dentroDaElipse(x, y, elipse) {
  const rad = (-elipse.rotacao * Math.PI) / 180;
  const dx = x - elipse.cx;
  const dy = y - elipse.cy;
  const px = dx * Math.cos(rad) - dy * Math.sin(rad);
  const py = dx * Math.sin(rad) + dy * Math.cos(rad);
  return (px * px) / (elipse.rx * elipse.rx) + (py * py) / (elipse.ry * elipse.ry) <= 1;
}

/** Máscara de bits dos conjuntos que contêm o ponto. */
export function mascaraDoPonto(x, y, elipses) {
  let mascara = 0;
  for (let i = 0; i < elipses.length; i++) {
    if (dentroDaElipse(x, y, elipses[i])) mascara |= 1 << i;
  }
  return mascara;
}

/**
 * Acha, para cada região (máscara), um ponto bom para pôr o rótulo.
 *
 * Amostra a área numa grade. Primeiro tenta o centróide; se ele cair fora da
 * própria região (acontece em regiões de lua crescente), usa o ponto
 * amostrado mais distante da borda daquela região — aproximado pela
 * distância ao vizinho de máscara diferente mais próximo na grade.
 *
 * @returns {Map<number, {x:number, y:number, area:number}>}
 */
export function posicoesDasRegioes(elipses, { largura, altura, passos = 160 }) {
  const passoX = largura / passos;
  const passoY = altura / passos;

  // 1ª varredura: guarda a grade de máscaras e acumula centróides.
  const grade = new Int32Array(passos * passos);
  const acumulado = new Map();

  for (let j = 0; j < passos; j++) {
    const y = (j + 0.5) * passoY;
    for (let i = 0; i < passos; i++) {
      const x = (i + 0.5) * passoX;
      const mascara = mascaraDoPonto(x, y, elipses);
      grade[j * passos + i] = mascara;
      if (!mascara) continue;
      let acc = acumulado.get(mascara);
      if (!acc) {
        acc = { somaX: 0, somaY: 0, quantidade: 0 };
        acumulado.set(mascara, acc);
      }
      acc.somaX += x;
      acc.somaY += y;
      acc.quantidade += 1;
    }
  }

  const saida = new Map();
  const areaDaCelula = passoX * passoY;

  for (const [mascara, acc] of acumulado) {
    const centroX = acc.somaX / acc.quantidade;
    const centroY = acc.somaY / acc.quantidade;
    const area = acc.quantidade * areaDaCelula;

    // Nunca usamos o centróide direto: em regiões de lua crescente ele cai
    // fora da própria região. O ponto certo é o de maior folga até a borda,
    // que é também onde o número tem mais chance de caber.
    const ponto = pontoMaisInterno(grade, mascara, passos);

    if (!ponto) {
      saida.set(mascara, { x: centroX, y: centroY, area, folgaX: 0, folgaY: 0 });
      continue;
    }

    const raio = raioLivre(grade, mascara, passos, ponto.i, ponto.j);
    saida.set(mascara, {
      x: (ponto.i + 0.5) * passoX,
      y: (ponto.j + 0.5) * passoY,
      area,
      // Quanto dá para andar em cada direção sem sair da região: é isso que
      // decide se o número cabe aqui dentro.
      folgaX: raio * passoX,
      folgaY: raio * passoY,
    });
  }

  return saida;
}

/** Quantas células dá para crescer em volta de (i,j) sem mudar de região. */
function raioLivre(grade, mascara, passos, i, j, limite = 40) {
  let raio = 0;
  while (raio < limite) {
    const proximo = raio + 1;
    if (i - proximo < 0 || i + proximo >= passos || j - proximo < 0 || j + proximo >= passos) break;
    let encostou = false;
    for (let k = -proximo; k <= proximo && !encostou; k++) {
      if (
        grade[(j - proximo) * passos + (i + k)] !== mascara ||
        grade[(j + proximo) * passos + (i + k)] !== mascara ||
        grade[(j + k) * passos + (i - proximo)] !== mascara ||
        grade[(j + k) * passos + (i + proximo)] !== mascara
      ) {
        encostou = true;
      }
    }
    if (encostou) break;
    raio = proximo;
  }
  return raio;
}

/** Célula da região com a maior folga até um vizinho de outra região. */
function pontoMaisInterno(grade, mascara, passos) {
  let melhorRaio = -1;
  let melhor = null;
  for (let j = 0; j < passos; j++) {
    for (let i = 0; i < passos; i++) {
      if (grade[j * passos + i] !== mascara) continue;
      const raio = raioLivre(grade, mascara, passos, i, j, melhorRaio + 2);
      if (raio > melhorRaio) {
        melhorRaio = raio;
        melhor = { i, j };
      }
    }
  }
  return melhor;
}

/** Caminho SVG de uma elipse girada (usamos path para poder animar). */
export function caminhoDaElipse(e) {
  return `M ${e.cx - e.rx},${e.cy} a ${e.rx},${e.ry} 0 1,0 ${e.rx * 2},0 a ${e.rx},${e.ry} 0 1,0 ${-e.rx * 2},0`;
}

/** Posição do rótulo de cada conjunto, fora da forma. */
export function posicaoDoRotuloDoConjunto(elipse, centro, afastamento = 14) {
  const dx = elipse.cx - centro.x;
  const dy = elipse.cy - centro.y;
  const distancia = Math.hypot(dx, dy) || 1;
  const raioNaDirecao = Math.max(elipse.rx, elipse.ry);
  return {
    x: elipse.cx + (dx / distancia) * (raioNaDirecao + afastamento),
    y: elipse.cy + (dy / distancia) * (raioNaDirecao + afastamento),
  };
}
