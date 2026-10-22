/**
 * _polar — base dos gráficos em coordenadas polares.
 *
 * `nightingale` e `radial_bar` leem os dados do mesmo jeito (uma fatia por
 * categoria, somando as linhas) e dependem das mesmas contas de geometria
 * circular. O que muda é o que cada um usa para codificar o valor — e aí
 * mora a diferença honesta entre os dois:
 *
 * - na **rosa**, o valor vira RAIO, e o risco é a área crescer com o
 *   quadrado;
 * - na **barra radial**, o valor vira ÂNGULO, e o risco é o comprimento do
 *   arco depender do raio do anel.
 *
 * As duas armadilhas têm função própria aqui (`raioDoValor`, `areaDoSetor`,
 * `anguloDoValor`, `comprimentoDoArco`), justamente para poderem ser
 * medidas em teste em vez de ficarem escondidas no desenho.
 *
 * (A pasta começa com `_`: não é um gráfico registrado, é código
 * compartilhado.)
 */

import { formatarData } from '../../core/format.js';

/**
 * Raio de uma fatia.
 *
 * - `area`: `r = √(r₀² + (R² − r₀²)·f)`. Com ângulos iguais, a área do
 *   setor é `θ(r² − r₀²)/2`, que sai proporcional a `f` — e `f` é o valor.
 *   É a conta que corrige o defeito do gráfico original.
 * - `raio`: `r = r₀ + (R − r₀)·f`. É o original, e a área cresce com o
 *   quadrado: dobrar o valor quadruplica a tinta. Existe como opção
 *   declarada, nunca como padrão.
 *
 * Valores negativos viram zero: num gráfico polar não existe raio
 * negativo, e desenhá-lo "para dentro" produziria uma fatia que parece
 * pequena em vez de parecer contrária.
 */
export function raioDoValor({ valor, maior, raioMaximo, raioInterno = 0, modo = 'area' }) {
  const r0 = Math.max(0, Math.min(raioInterno, raioMaximo));
  if (!(maior > 0) || valor === null || !Number.isFinite(valor) || valor <= 0) return r0;

  const f = Math.max(0, Math.min(1, valor / maior));
  if (modo === 'raio') return r0 + (raioMaximo - r0) * f;
  return Math.sqrt(r0 * r0 + (raioMaximo * raioMaximo - r0 * r0) * f);
}

/** Área do setor entre dois raios, para o ângulo dado. */
export function areaDoSetor({ raio, raioInterno = 0, angulo }) {
  return (angulo * (raio * raio - raioInterno * raioInterno)) / 2;
}

/**
 * Lê as fatias, somando as linhas de cada categoria.
 *
 * A ordem padrão é a da CONSULTA, e isso é deliberado: com meses ou dias
 * da semana, reordenar por valor destrói a leitura — a rosa deixa de ser
 * um calendário e vira um ranking circular, que é outro gráfico.
 */
export function lerFatias({ modelo, medida, campoDaCategoria, config = {} }) {
  const porChave = new Map();

  for (let i = 0; i < modelo.linhas.length; i++) {
    const linha = modelo.linhas[i];
    const chave = String(modelo.valorBruto(linha, campoDaCategoria.nome));
    if (!porChave.has(chave)) {
      porChave.set(chave, {
        chave,
        rotulo: campoDaCategoria.ehData
          ? formatarData(modelo.valorBruto(linha, campoDaCategoria.nome), config.formatoDeData || 'auto')
          : modelo.texto(linha, campoDaCategoria.nome, undefined, '∅'),
        valorBruto: 0,
        indiceDaLinha: i,
      });
    }
    const v = modelo.valorNumerico(linha, medida.nome);
    if (v !== null && Number.isFinite(v)) porChave.get(chave).valorBruto += v;
  }

  const fatias = Array.from(porChave.values()).map((f) => ({
    ...f,
    // O valor DESENHADO nunca é negativo; o bruto fica para o tooltip e
    // para o aviso.
    valor: Math.max(0, f.valorBruto),
  }));

  const modo = config.ordem || 'consulta';
  if (modo === 'valorDesc') fatias.sort((a, b) => b.valor - a.valor);
  else if (modo === 'valorAsc') fatias.sort((a, b) => a.valor - b.valor);
  else if (modo === 'alfabetica') fatias.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

  return fatias;
}

/**
 * Ângulo varrido por um valor.
 *
 * Começa em ZERO sempre — é a mesma regra das barras lineares, e pelo
 * mesmo motivo: o ângulo codifica magnitude, e truncar a base distorce a
 * proporção. Valores negativos viram zero: ângulo negativo inverteria o
 * sentido de leitura e a barra pareceria apenas pequena.
 */
export function anguloDoValor({ valor, maior, anguloMaximo }) {
  if (!(maior > 0) || valor === null || !Number.isFinite(valor) || valor <= 0) return 0;
  return anguloMaximo * Math.min(1, valor / maior);
}

/**
 * Comprimento do arco — a grandeza que NÃO se compara entre anéis.
 *
 * Existe exportada justamente para o teste poder provar a distorção: duas
 * barras de mesmo ângulo em raios diferentes têm comprimentos diferentes,
 * e é por isso que a barra radial avisa.
 */
export function comprimentoDoArco({ raio, angulo }) {
  return raio * angulo;
}
