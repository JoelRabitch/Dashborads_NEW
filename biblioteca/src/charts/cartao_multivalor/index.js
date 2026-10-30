/**
 * cartao_multivalor — "Cartão Multi-Valores" (melhorias v3, 5.14).
 *
 * Um cartão que reúne vários valores (como o "Multiple Value" nativo do
 * Looker), muito configurável. Independente do kpi_vivo.
 *
 * Estilo padrão: título; valor grande no topo com um subtítulo pequeno que
 * diz de onde ele vem ("6 + 3 + 1"); pilha de itens com rótulo pequeno em
 * cima e valor embaixo, centralizados; um selo colorido para a faixa;
 * legenda das faixas (um quadradinho de cor por faixa); divisórias.
 *
 * Campos esperados: dimensões (texto) e medidas (número), em qualquer
 * quantidade. Modo "Um cartão" usa a PRIMEIRA linha (e a série de todas as
 * linhas para o mini gráfico); "Um cartão por linha" faz uma grade.
 *
 * Opções
 *   Gerais (estáticas): modo, colunas e espaçamento da grade; layout dos
 *   itens (pilha, grade, linha, rótulo à esquerda/valor à direita,
 *   destaque + lista); divisórias; seções recolhíveis; valor de cabeçalho
 *   (soma, média, mínimo, máximo, fórmula — interpretador de
 *   core/formulas.js — ou nenhum) sobre campos escolhidos, com subtítulo
 *   automático ("6 + 3 + 1") ou texto livre; faixas por regra (texto, cor,
 *   ícone) aplicadas a um campo, com legenda; aparência (fundo, borda,
 *   sombra, arredondamento, fonte, ajuste ao tile); interação (copiar o
 *   valor, destaque ao passar o mouse; drill/tooltip pela "Ação do
 *   clique"); animações (contador, cascata, barras e anéis que crescem,
 *   destaque quando o valor muda, pulso em alerta, dígitos rolando) com o
 *   interruptor global, duração/atraso/curva das opções de animação e
 *   respeito a prefers-reduced-motion. Nada anima por rolagem.
 *   Por campo (dinâmicas, `mv_<campo>_<opção>`): visível, ordem, rótulo,
 *   formato (casas, K/M/B, moeda, %, prefixo/sufixo), texto para zero e
 *   para nulo (antes aparecia "0.0"), alinhamento, tamanho e cor do rótulo
 *   e do valor, tipo de exibição (número, texto, selo, link, barra de
 *   progresso, anel, mini gráfico, seta de variação, estrelas, semáforo,
 *   ícone), ícone e meta (barra/anel/semáforo).
 *
 * Faixas: "Nome|mínimo|máximo|cor|ícone; …" — mínimo inclusivo, máximo
 * exclusivo, vazio = sem limite. Ex.: "Ouro|8.4||#B8860B|estrela;
 * Prata|7|8.4|#9CA3AF|; Bronze|5.5|7|#B45309|; Sem nível||5.5|#94A3B8|".
 *
 * Como montar o Explore: 1+ medidas (e, se quiser, dimensões de texto);
 * para "Um cartão", filtre para 1 linha (ou a primeira linha vale); para a
 * grade, uma linha por cartão (ex.: por loja ou por cliente).
 */

import { defineViz } from '../../core/define-viz.js';
import { criarEl, criarSvgEl, definirTexto, injetarEstilo } from '../../core/dom.js';
import { criarFormatadorNumerico } from '../../core/format.js';
import { opcoesDeAnimacao, animarContador } from '../../core/animate.js';
import { compilarFormula, avaliarArvore, criarResolvedor } from '../../core/formulas.js';
import { desenharIcone, listarIcones } from '../../core/icones.js';
import { textoLegivelSobre, comOpacidade } from '../../core/theme.js';
import { paletaDoConfig } from '../../core/cores.js';
import {
  montarOpcoes,
  listaDeValores,
  blocoDeTooltip,
  blocoDeAnimacao,
  blocoDeTema,
  blocoAvancado,
  sanitizarChave,
} from '../../core/options-kit.js';

const CSS = `
.mv-raiz{width:100%;height:100%;overflow:auto;box-sizing:border-box;}
.mv-grade{display:grid;align-content:start;}
.mv-cartao{box-sizing:border-box;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0;}
.mv-cabecalho{text-align:center;}
.mv-grande{font-weight:700;line-height:1.05;font-variant-numeric:tabular-nums;}
.mv-sub{opacity:.65;font-size:.85em;}
.mv-itens{display:grid;gap:10px 14px;}
.mv-item{min-width:0;display:flex;flex-direction:column;gap:2px;border-radius:6px;padding:2px 4px;transition:background .15s ease;}
.mv-item.mv-rotulo-valor{flex-direction:row;justify-content:space-between;align-items:baseline;gap:10px;}
.mv-item:hover.mv-com-destaque{background:rgba(127,127,127,.12);}
.mv-rotulo{font-size:.78em;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mv-valor{font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mv-link{text-decoration:underline;cursor:pointer;}
.mv-selo{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:700;font-size:.85em;}
.mv-barra{height:8px;border-radius:4px;overflow:hidden;}
.mv-barra>div{height:100%;border-radius:4px;width:0;}
.mv-divisoria{height:1px;opacity:.6;}
.mv-legenda{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;font-size:.78em;}
.mv-legenda span{display:inline-flex;align-items:center;gap:4px;}
.mv-quadrado{width:10px;height:10px;border-radius:2px;display:inline-block;}
.mv-secao{font-size:.72em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;opacity:.6;cursor:pointer;}
.mv-copiado{position:absolute;padding:2px 8px;border-radius:4px;font-size:11px;pointer-events:none;}
@keyframes mv-entrar{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mv-flash{0%{background:rgba(250,204,21,.45)}100%{background:transparent}}
@keyframes mv-pulso{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.45)}50%{box-shadow:0 0 0 6px rgba(220,38,38,0)}}
@keyframes mv-rolar{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}
.mv-digito{display:inline-block;}
@media (prefers-reduced-motion: reduce){.mv-item,.mv-barra>div{transition:none!important;animation:none!important;}}
`;

const TIPOS = [
  { rotulo: 'Automático', valor: 'auto' },
  { rotulo: 'Número', valor: 'numero' },
  { rotulo: 'Texto', valor: 'texto' },
  { rotulo: 'Selo colorido', valor: 'selo' },
  { rotulo: 'Link', valor: 'link' },
  { rotulo: 'Barra de progresso', valor: 'barra' },
  { rotulo: 'Anel', valor: 'anel' },
  { rotulo: 'Mini gráfico', valor: 'mini' },
  { rotulo: 'Seta de variação', valor: 'seta' },
  { rotulo: 'Estrelas', valor: 'estrelas' },
  { rotulo: 'Semáforo', valor: 'semaforo' },
  { rotulo: 'Ícone', valor: 'icone' },
];
const FORMATOS = [
  { rotulo: 'Automático (do Looker)', valor: 'auto' },
  { rotulo: 'Número', valor: 'numero' },
  { rotulo: 'Compacto (K, M, B)', valor: 'compacto' },
  { rotulo: 'Moeda', valor: 'moeda' },
  { rotulo: 'Percentual', valor: 'percentual' },
  { rotulo: 'Texto', valor: 'texto' },
];
const ALINHAMENTOS = [
  { rotulo: 'Centro', valor: 'centro' },
  { rotulo: 'Esquerda', valor: 'esquerda' },
  { rotulo: 'Direita', valor: 'direita' },
];

function opcoesGerais() {
  const s = (secao, tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
  return {
    modoDoCartao: s('Cartão', 'string', 'Modo', 'unico', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Um cartão (primeira linha)', valor: 'unico' },
        { rotulo: 'Um cartão por linha (grade)', valor: 'grade' },
      ]),
    }),
    colunasDaGradeMV: s('Cartão', 'number', 'Colunas da grade (0 = auto)', 0),
    espacoDaGradeMV: s('Cartão', 'number', 'Espaço entre cartões (px)', 12),
    layoutDosItens: s('Cartão', 'string', 'Layout dos itens', 'pilha', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Pilha vertical', valor: 'pilha' },
        { rotulo: 'Grade em colunas', valor: 'grade' },
        { rotulo: 'Linha horizontal', valor: 'linha' },
        { rotulo: 'Rótulo à esquerda, valor à direita', valor: 'rotuloValor' },
        { rotulo: 'Destaque grande + lista', valor: 'destaque' },
      ]),
    }),
    colunasDosItens: s('Cartão', 'number', 'Colunas dos itens (grade)', 2),
    divisoriasMV: s('Cartão', 'boolean', 'Divisórias entre blocos', true),
    secoesRecolhiveisMV: s('Cartão', 'boolean', 'Seções recolhíveis', false),
    // Cabeçalho calculado
    valorDoCabecalho: s('Cabeçalho', 'string', 'Valor do topo', 'soma', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Soma', valor: 'soma' },
        { rotulo: 'Média', valor: 'media' },
        { rotulo: 'Mínimo', valor: 'minimo' },
        { rotulo: 'Máximo', valor: 'maximo' },
        { rotulo: 'Fórmula', valor: 'formula' },
        { rotulo: 'Nenhum', valor: 'nenhum' },
      ]),
    }),
    camposDoCabecalho: s('Cabeçalho', 'string', 'Campos (vazio = medidas)', '', { placeholder: 'Visitas, Compras' }),
    formulaDoCabecalho: s('Cabeçalho', 'string', 'Fórmula', '', { placeholder: '${visitas} + ${compras}' }),
    formatoDoCabecalho: s('Cabeçalho', 'string', 'Formato', 'auto', { display: 'select', values: listaDeValores(FORMATOS) }),
    casasDoCabecalho: s('Cabeçalho', 'number', 'Casas decimais', 0),
    subtituloDoCabecalho: s('Cabeçalho', 'string', 'Subtítulo', 'auto', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Automático ("6 + 3 + 1")', valor: 'auto' },
        { rotulo: 'Texto livre', valor: 'texto' },
        { rotulo: 'Nenhum', valor: 'nenhum' },
      ]),
    }),
    textoDoSubtituloMV: s('Cabeçalho', 'string', 'Texto do subtítulo', ''),
    tamanhoDoValorGrande: s('Cabeçalho', 'number', 'Tamanho do valor (px, 0=auto)', 0),
    // Faixas
    faixasMV: s('Faixas', 'string', 'Faixas (Nome|mín|máx|cor|ícone; …)', '', {
      placeholder: 'Ouro|8.4||#B8860B|estrela; Prata|7|8.4|#9CA3AF|',
    }),
    campoDasFaixas: s('Faixas', 'string', 'Campo das faixas (vazio = topo)', ''),
    mostrarSeloDaFaixa: s('Faixas', 'boolean', 'Selo da faixa', true),
    mostrarLegendaDasFaixas: s('Faixas', 'boolean', 'Legenda das faixas', true),
    // Aparência
    corDeFundoMV: s('Aparência', 'string', 'Fundo do cartão (vazio = tema)', '', { display: 'color' }),
    bordaMV: s('Aparência', 'boolean', 'Borda do cartão', true),
    corDaBordaMV: s('Aparência', 'string', 'Cor da borda (vazio = tema)', '', { display: 'color' }),
    sombraMV: s('Aparência', 'boolean', 'Sombra do cartão', true),
    raioMV: s('Aparência', 'number', 'Arredondamento (px)', 10),
    fonteMV: s('Aparência', 'string', 'Fonte', 'tema', {
      display: 'select',
      values: listaDeValores([
        { rotulo: 'Do tema', valor: 'tema' },
        { rotulo: 'Sistema', valor: 'sistema' },
        { rotulo: 'Monoespaçada', valor: 'mono' },
        { rotulo: 'Serifada', valor: 'serifada' },
      ]),
    }),
    ajustarAoTileMV: s('Aparência', 'boolean', 'Ajustar ao tamanho do tile', true),
    // Interação e animação (as gerais vêm de blocoDeAnimacao/blocoDeTooltip)
    copiarValorMV: s('Interação', 'boolean', 'Duplo clique copia o valor', true),
    destacarItemMV: s('Interação', 'boolean', 'Destacar item sob o mouse', true),
    animarBarrasMV: s('Animação', 'boolean', 'Barras e anéis crescem', true),
    destacarMudancaMV: s('Animação', 'boolean', 'Destacar valor que mudou', true),
    pulsoEmAlertaMV: s('Animação', 'boolean', 'Pulso em alerta', true),
    digitosRolandoMV: s('Animação', 'boolean', 'Dígitos rolando', false),
  };
}

/** Opções por campo (dinâmicas). */
function opcoesPorCampo(campo, ordem, ehMedida) {
  const k = `mv_${sanitizarChave(campo.nome)}_`;
  const secao = `Campo: ${campo.rotuloCurto}`;
  const o = (tipo, label, def, extra = {}) => ({ type: tipo, label, section: secao, default: def, ...extra });
  return {
    [`${k}visivel`]: o('boolean', 'Mostrar', true),
    [`${k}ordem`]: o('number', 'Ordem', ordem),
    [`${k}rotulo`]: o('string', 'Rótulo', ''),
    [`${k}tipo`]: o('string', 'Tipo', 'auto', { display: 'select', values: listaDeValores(TIPOS) }),
    [`${k}formato`]: o('string', 'Formato', ehMedida ? 'auto' : 'texto', { display: 'select', values: listaDeValores(FORMATOS) }),
    [`${k}casas`]: o('number', 'Casas decimais', 1),
    [`${k}prefixo`]: o('string', 'Prefixo', ''),
    [`${k}sufixo`]: o('string', 'Sufixo', ''),
    [`${k}zero`]: o('string', 'Texto para zero (vazio = 0)', ''),
    [`${k}nulo`]: o('string', 'Texto para nulo', '—'),
    [`${k}alinhamento`]: o('string', 'Alinhamento', 'centro', { display: 'select', values: listaDeValores(ALINHAMENTOS) }),
    [`${k}tamanhoRotulo`]: o('number', 'Tamanho do rótulo (0 = auto)', 0),
    [`${k}tamanhoValor`]: o('number', 'Tamanho do valor (0 = auto)', 0),
    [`${k}corRotulo`]: o('string', 'Cor do rótulo', '', { display: 'color' }),
    [`${k}corValor`]: o('string', 'Cor do valor', '', { display: 'color' }),
    [`${k}icone`]: o('string', 'Ícone', 'nenhum', {
      display: 'select',
      values: listaDeValores([{ rotulo: 'Nenhum', valor: 'nenhum' }].concat(listarIcones().map((i) => ({ rotulo: i.rotulo, valor: i.id })))),
    }),
    [`${k}meta`]: o('number', 'Meta (barra/anel; 0 = 100%)', 0),
  };
}

/** Lê a configuração de um campo. */
function configDoCampo(config, campo, indice, ehMedida) {
  const k = `mv_${sanitizarChave(campo.nome)}_`;
  const v = (s, d) => (config[k + s] === undefined || config[k + s] === null ? d : config[k + s]);
  return {
    campo,
    ehMedida,
    visivel: v('visivel', true) !== false,
    ordem: Number(v('ordem', indice)),
    rotulo: String(v('rotulo', '')).trim() || campo.rotuloCurto,
    tipo: v('tipo', 'auto'),
    formato: v('formato', ehMedida ? 'auto' : 'texto'),
    casas: Number(v('casas', 1)),
    prefixo: String(v('prefixo', '')),
    sufixo: String(v('sufixo', '')),
    zero: String(v('zero', '')),
    nulo: String(v('nulo', '—')),
    alinhamento: v('alinhamento', 'centro'),
    tamanhoRotulo: Number(v('tamanhoRotulo', 0)) || 0,
    tamanhoValor: Number(v('tamanhoValor', 0)) || 0,
    corRotulo: String(v('corRotulo', '')),
    corValor: String(v('corValor', '')),
    icone: v('icone', 'nenhum'),
    meta: Number(v('meta', 0)) || 0,
  };
}

/** Faixas "Nome|mín|máx|cor|ícone; …". */
export function lerFaixas(texto) {
  return String(texto || '')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [nome, min, max, cor, icone] = p.split('|').map((x) => (x === undefined ? '' : x.trim()));
      const num = (x) => (x === '' || x === undefined || !Number.isFinite(Number(x.replace(',', '.'))) ? null : Number(x.replace(',', '.')));
      return { nome, min: num(min), max: num(max), cor: cor || '#94A3B8', icone: icone || '' };
    });
}
export function faixaDoValor(faixas, v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  return faixas.find((f) => (f.min === null || v >= f.min) && (f.max === null || v < f.max)) || null;
}

const FONTES = {
  sistema: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
  serifada: 'Georgia, "Times New Roman", serif',
};

export default defineViz({
  id: 'cartao_multivalor',
  label: 'Cartão Multi-Valores',
  opcoes: montarOpcoes(blocoDeTooltip(), blocoDeAnimacao(), blocoDeTema(), blocoAvancado(), opcoesGerais()),
  exigencia: { dimensoesMin: 0, medidasMin: 0, aceitaPivo: false, exigeLinhas: true },

  opcoesDinamicas({ modelo }) {
    const saida = {};
    let i = 0;
    for (const d of modelo.dimensoes) Object.assign(saida, opcoesPorCampo(d, i++, false));
    for (const m of modelo.medidas) Object.assign(saida, opcoesPorCampo(m, i++, true));
    return saida;
  },

  render(ctx) {
    const { modelo, config, tema, raiz, largura, altura, estado } = ctx;
    if (!modelo.dimensoes.length && !modelo.medidas.length) {
      ctx.mostrarVazio('O cartão precisa de pelo menos um campo (dimensão ou medida).');
      return;
    }
    ctx.limparRaiz();
    injetarEstilo(raiz, CSS, 'mv');

    const campos = [
      ...modelo.dimensoes.map((c, i) => configDoCampo(config, c, i, false)),
      ...modelo.medidas.map((c, i) => configDoCampo(config, c, modelo.dimensoes.length + i, true)),
    ]
      .filter((c) => c.visivel)
      .sort((a, b) => a.ordem - b.ordem);

    const anim = opcoesDeAnimacao(config, { primeiraRenderizacao: ctx.primeiraRenderizacao });
    const faixas = lerFaixas(config.faixasMV);
    const paleta = paletaDoConfig(config);
    const anteriores = estado.valoresAnteriores || new Map();
    const novos = new Map();
    const tooltip = ctx.tooltip();
    const fonte = FONTES[config.fonteMV] || tema.fonte;

    const container = criarEl('div', { classe: 'mv-raiz', pai: raiz });
    container.style.fontFamily = fonte;
    container.style.color = tema.texto;
    const grade = criarEl('div', { classe: 'mv-grade', pai: container });
    const espaco = Math.max(0, Number(config.espacoDaGradeMV) || 12);
    grade.style.gap = `${espaco}px`;

    const linhas = config.modoDoCartao === 'grade' ? modelo.linhas : modelo.linhas.slice(0, 1);
    const minimoDoCartao = 220;
    const colunas =
      config.modoDoCartao === 'grade'
        ? Number(config.colunasDaGradeMV) > 0
          ? Math.floor(Number(config.colunasDaGradeMV))
          : Math.max(1, Math.floor((largura + espaco) / (minimoDoCartao + espaco)))
        : 1;
    grade.style.gridTemplateColumns = `repeat(${colunas}, minmax(0, 1fr))`;
    if (config.modoDoCartao !== 'grade') grade.style.height = '100%';

    // Escala do conteúdo para ocupar o tile (sem ficar pequeno).
    const itensVisiveis = campos.length + (config.valorDoCabecalho !== 'nenhum' ? 3 : 0) + (faixas.length ? 1 : 0);
    const alturaPorCartao = config.modoDoCartao === 'grade' ? 260 : altura;
    const escala =
      config.ajustarAoTileMV === false
        ? 1
        : Math.max(0.8, Math.min(2.2, alturaPorCartao / Math.max(120, itensVisiveis * 34 + 40)));
    const base = Math.round(tema.tamanhoBase * escala);
    container.style.fontSize = `${base}px`;

    linhas.forEach((linha, indiceDaLinha) => {
      const cartao = criarEl('div', { classe: 'mv-cartao', pai: grade });
      cartao.style.background = config.corDeFundoMV || tema.fundoElevado || tema.fundo;
      if (config.bordaMV !== false) cartao.style.border = `1px solid ${config.corDaBordaMV || tema.borda}`;
      cartao.style.borderRadius = `${Math.max(0, Number(config.raioMV) || 0)}px`;
      if (config.sombraMV !== false) cartao.style.boxShadow = tema.sombra || '0 2px 8px rgba(15,23,42,.12)';
      if (config.modoDoCartao !== 'grade') cartao.style.height = '100%';
      let ordemDeEntrada = 0;
      const entrar = (el) => {
        if (!anim.ligada) return;
        el.style.animation = `mv-entrar ${Math.max(150, anim.duracao)}ms ease-out both`;
        el.style.animationDelay = `${anim.atraso + anim.cascata * ordemDeEntrada++}ms`;
      };

      // ---------- Cabeçalho calculado ----------
      const cab = valorDoCabecalho({ config, modelo, linha, campos });
      if (cab) {
        const bloco = criarEl('div', { classe: 'mv-cabecalho', pai: cartao });
        const grande = criarEl('div', { classe: 'mv-grande', pai: bloco });
        const tamanhoGrande = Number(config.tamanhoDoValorGrande) > 0 ? Number(config.tamanhoDoValorGrande) : base * 2.6;
        grande.style.fontSize = `${tamanhoGrande}px`;
        const formatarCab = formatadorDoCabecalho(config);
        const chave = `${indiceDaLinha}|__topo__`;
        novos.set(chave, cab.valor);
        if (cab.erro) definirTexto(grande, `#ERRO: ${cab.erro}`);
        else if (config.digitosRolandoMV === true && anim.ligada) digitosRolando(grande, formatarCab(cab.valor), anim);
        else if (anim.contador && Number.isFinite(cab.valor)) {
          animarContador({ elemento: grande, de: anteriores.get(chave) ?? 0, para: cab.valor, formatar: formatarCab, animacao: anim });
          definirTexto(grande, formatarCab(cab.valor));
        } else definirTexto(grande, cab.valor === null ? '—' : formatarCab(cab.valor));
        destacarMudanca(grande, anteriores.get(chave), cab.valor, config, anim);
        const textoSub =
          config.subtituloDoCabecalho === 'nenhum' ? '' : config.subtituloDoCabecalho === 'texto' ? String(config.textoDoSubtituloMV || '') : cab.subtitulo;
        if (textoSub) criarEl('div', { classe: 'mv-sub', pai: bloco, texto: textoSub });
        // Selo da faixa (sobre o topo ou o campo escolhido).
        const valorDaFaixa = config.campoDasFaixas
          ? valorDoCampoPorNome(modelo, linha, campos, config.campoDasFaixas)
          : cab.valor;
        const faixa = faixaDoValor(faixas, valorDaFaixa);
        if (faixa && config.mostrarSeloDaFaixa !== false) {
          const selo = criarEl('span', { classe: 'mv-selo', pai: bloco, texto: faixa.nome });
          selo.style.background = faixa.cor;
          selo.style.color = textoLegivelSobre(faixa.cor, tema);
          selo.style.marginTop = '6px';
          if (faixa.icone) desenharIcone({ pai: selo, id: faixa.icone, lado: 12, cor: selo.style.color });
          selo.setAttribute('data-faixa', faixa.nome);
        }
        entrar(bloco);
        divisoria(cartao, config, tema);
      }

      // ---------- Itens ----------
      const layout = config.layoutDosItens || 'pilha';
      const lista = criarEl('div', { classe: 'mv-itens', pai: cartao });
      const nCol = layout === 'grade' ? Math.max(1, Math.floor(Number(config.colunasDosItens) || 2)) : layout === 'linha' ? Math.max(1, campos.length) : 1;
      lista.style.gridTemplateColumns = `repeat(${nCol}, minmax(0, 1fr))`;
      campos.forEach((c, i) => {
        if (layout === 'destaque' && i === 1) divisoria(cartao, config, tema, lista);
        const item = criarEl('div', { classe: `mv-item${layout === 'rotuloValor' ? ' mv-rotulo-valor' : ''}`, pai: lista });
        if (config.destacarItemMV !== false) item.classList.add('mv-com-destaque');
        item.style.textAlign = c.alinhamento === 'esquerda' ? 'left' : c.alinhamento === 'direita' ? 'right' : 'center';
        item.style.alignItems = layout === 'rotuloValor' ? '' : c.alinhamento === 'esquerda' ? 'flex-start' : c.alinhamento === 'direita' ? 'flex-end' : 'center';
        item.setAttribute('data-campo', c.campo.nome);
        item.setAttribute('data-item', `${indiceDaLinha}|${c.campo.nome}`);
        const rot = criarEl('div', { classe: 'mv-rotulo', pai: item, texto: c.rotulo });
        if (c.tamanhoRotulo) rot.style.fontSize = `${c.tamanhoRotulo}px`;
        if (c.corRotulo) rot.style.color = c.corRotulo;
        const celula = modelo.celula(linha, c.campo.nome);
        const bruto = c.ehMedida ? modelo.valorNumerico(linha, c.campo.nome) : celula ? celula.value : null;
        const texto = textoDoCampo(c, modelo, linha, bruto);
        const chave = `${indiceDaLinha}|${c.campo.nome}`;
        if (c.ehMedida) novos.set(chave, bruto);
        const valorEl = criarEl('div', { classe: 'mv-valor', pai: item });
        const tamanhoValor = c.tamanhoValor || (layout === 'destaque' && i === 0 ? base * 2 : base * 1.25);
        valorEl.style.fontSize = `${tamanhoValor}px`;
        if (c.corValor) valorEl.style.color = c.corValor;
        desenharValor({ el: valorEl, c, texto, bruto, celula, tema, paleta, faixas, anim, config, modelo, linha, ctx, anteriores, chave });
        destacarMudanca(valorEl, anteriores.get(chave), bruto, config, anim);
        // Link do Looker: sublinhado, e o clique abre o drill.
        const temLink = celula && Array.isArray(celula.links) && celula.links.length > 0;
        if (temLink) valorEl.classList.add('mv-link');
        const conteudo = () => ({ titulo: c.rotulo, linhas: [{ rotulo: c.rotulo, valor: texto }] });
        ctx.eventos.on(item, 'click', (ev) => ctx.cliqueNoItem(ev, celula, conteudo()));
        if (tooltip) {
          ctx.eventos.on(item, 'pointerenter', (ev) => tooltip.mostrar(conteudo(), ev.clientX, ev.clientY));
          ctx.eventos.on(item, 'pointermove', (ev) => tooltip.mover(ev.clientX, ev.clientY));
          ctx.eventos.on(item, 'pointerleave', () => tooltip.esconder());
        }
        if (config.copiarValorMV !== false) {
          ctx.eventos.on(item, 'dblclick', () => copiar(texto, item, ctx, tema));
        }
        entrar(item);
      });

      // ---------- Legenda das faixas ----------
      if (faixas.length && config.mostrarLegendaDasFaixas !== false) {
        divisoria(cartao, config, tema);
        const leg = criarEl('div', { classe: 'mv-legenda', pai: cartao });
        for (const f of faixas) {
          const s = criarEl('span', { pai: leg });
          const q = criarEl('i', { classe: 'mv-quadrado', pai: s });
          q.style.background = f.cor;
          criarEl('span', { pai: s, texto: f.nome });
        }
        entrar(leg);
      }
    });
    estado.valoresAnteriores = novos;

    // Nota automática (componente único do núcleo, 5.1c).
    definirTexto(
      ctx.nota,
      `${linhas.length === 1 ? '1 cartão' : `${linhas.length} cartões`} · ${campos.length} campo(s)` +
        (config.modoDoCartao !== 'grade' && modelo.linhas.length > 1 ? ' · mostrando a primeira linha da consulta' : '')
    );
  },
});

/* ------------------------------------------------------------------ */

function valorDoCampoPorNome(modelo, linha, campos, nome) {
  const alvo = String(nome).trim().toLowerCase();
  const c = campos.find((x) => [x.campo.nome, x.campo.rotuloCurto, x.rotulo].some((n) => String(n).toLowerCase() === alvo));
  if (!c) return null;
  return c.ehMedida ? modelo.valorNumerico(linha, c.campo.nome) : Number(modelo.celula(linha, c.campo.nome)?.value);
}

/** Valor do topo: soma/média/mín/máx sobre campos, ou fórmula. */
export function valorDoCabecalho({ config, modelo, linha, campos }) {
  const modo = config.valorDoCabecalho || 'soma';
  if (modo === 'nenhum') return null;
  if (modo === 'formula') {
    const c = compilarFormula(config.formulaDoCabecalho);
    if (!c.ok) return { valor: null, erro: c.erro, subtitulo: '' };
    try {
      const resolver = criarResolvedor(
        [...modelo.dimensoes, ...modelo.medidas].map((m) => ({
          nomes: [m.nome, String(m.nome).split('.').pop(), m.rotuloCurto, m.rotulo],
          valor: () => (modelo.medidas.includes(m) ? modelo.valorNumerico(linha, m.nome) : modelo.celula(linha, m.nome)?.value ?? null),
        }))
      );
      const v = avaliarArvore(c.arvore, resolver);
      return { valor: typeof v === 'number' ? v : null, subtitulo: String(config.formulaDoCabecalho) };
    } catch (e) {
      return { valor: null, erro: e.message, subtitulo: '' };
    }
  }
  const nomes = String(config.camposDoCabecalho || '')
    .split(',')
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
  const escolhidos = (nomes.length
    ? campos.filter((c) => [c.campo.nome, c.campo.rotuloCurto, c.rotulo].some((n) => nomes.includes(String(n).toLowerCase())))
    : campos.filter((c) => c.ehMedida)
  ).filter((c) => c.ehMedida);
  const valores = escolhidos.map((c) => modelo.valorNumerico(linha, c.campo.nome)).filter((v) => v !== null && Number.isFinite(v));
  if (!valores.length) return { valor: null, subtitulo: '' };
  const soma = valores.reduce((a, b) => a + b, 0);
  const valor =
    modo === 'media' ? soma / valores.length : modo === 'minimo' ? Math.min(...valores) : modo === 'maximo' ? Math.max(...valores) : soma;
  const sep = modo === 'soma' ? ' + ' : modo === 'media' ? ' · ' : ', ';
  const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const prefixo = modo === 'media' ? 'média de ' : modo === 'minimo' ? 'mínimo de ' : modo === 'maximo' ? 'máximo de ' : '';
  return { valor, subtitulo: `${prefixo}${valores.map(fmt).join(sep)}` };
}

function formatadorDoCabecalho(config) {
  const estilo = config.formatoDoCabecalho || 'auto';
  const casas = Number.isFinite(Number(config.casasDoCabecalho)) ? Number(config.casasDoCabecalho) : 0;
  const f = criarFormatadorNumerico({ estilo: estilo === 'texto' ? 'auto' : estilo, casas, simboloDaMoeda: '$' });
  return (v) => (v === null || !Number.isFinite(v) ? '—' : f(v));
}

/** Texto de exibição de um campo, com formato, zero e nulo do painel. */
export function textoDoCampo(c, modelo, linha, bruto) {
  if (bruto === null || bruto === undefined || (typeof bruto === 'number' && !Number.isFinite(bruto))) return c.nulo;
  if (c.ehMedida && bruto === 0 && c.zero !== '') return c.zero;
  let t;
  if (!c.ehMedida || c.formato === 'texto') t = modelo.texto(linha, c.campo.nome, undefined, c.nulo);
  else if (c.formato === 'auto') t = modelo.texto(linha, c.campo.nome, undefined, c.nulo);
  else t = criarFormatadorNumerico({ estilo: c.formato, casas: c.casas, simboloDaMoeda: '$' })(bruto);
  return `${c.prefixo}${t}${c.sufixo}`;
}

function divisoria(cartao, config, tema, antesDe = null) {
  if (config.divisoriasMV === false) return;
  const d = document.createElement('div');
  d.className = 'mv-divisoria';
  d.style.background = tema.borda;
  if (antesDe && antesDe.parentNode === cartao) cartao.insertBefore(d, antesDe);
  else cartao.appendChild(d);
}

function destacarMudanca(el, antes, agora, config, anim) {
  if (!anim.ligada || config.destacarMudancaMV === false) return;
  if (antes === undefined || antes === null || agora === null || antes === agora) return;
  el.classList.add('mv-mudou');
  el.style.animation = `mv-flash ${Math.max(400, anim.duracao)}ms ease-out`;
}

function digitosRolando(el, texto, anim) {
  el.textContent = '';
  [...String(texto)].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'mv-digito';
    s.textContent = ch;
    if (/\d/.test(ch)) {
      s.style.animation = `mv-rolar ${Math.max(200, anim.duracao)}ms ease-out both`;
      s.style.animationDelay = `${anim.atraso + i * 40}ms`;
    }
    el.appendChild(s);
  });
}

/** Desenha o valor conforme o tipo de exibição. */
function desenharValor({ el, c, texto, bruto, celula, tema, paleta, faixas, anim, config, modelo, linha, ctx }) {
  const tipo = c.tipo === 'auto' ? (c.ehMedida ? 'numero' : 'texto') : c.tipo;
  const n = typeof bruto === 'number' ? bruto : Number(bruto);
  const fracao = Number.isFinite(n) ? Math.max(0, Math.min(1, c.meta > 0 ? n / c.meta : Math.abs(n) <= 1 ? Math.abs(n) : Math.abs(n) / 100)) : 0;
  const cor = c.corValor || paleta[0] || tema.destaque;
  if (c.icone && c.icone !== 'nenhum' && tipo !== 'icone') desenharIcone({ pai: el, id: c.icone, lado: 14, cor });
  switch (tipo) {
    case 'selo': {
      const faixa = Number.isFinite(n) ? faixaDoValor(faixas, n) : null;
      const s = criarEl('span', { classe: 'mv-selo', pai: el, texto });
      const fundo = faixa ? faixa.cor : cor;
      s.style.background = fundo;
      s.style.color = textoLegivelSobre(fundo, tema);
      return;
    }
    case 'barra': {
      el.appendChild(document.createTextNode(texto));
      const b = criarEl('div', { classe: 'mv-barra', pai: el.parentNode });
      b.style.background = comOpacidade(tema.texto, 0.12);
      b.style.width = '100%';
      const preenchimento = criarEl('div', { pai: b });
      preenchimento.style.background = cor;
      const alvo = `${(fracao * 100).toFixed(1)}%`;
      if (anim.ligada && config.animarBarrasMV !== false) {
        preenchimento.style.transition = `width ${anim.duracao}ms ease-out`;
        ctx.agendarQuadro(() => {
          preenchimento.style.width = alvo;
        });
      } else preenchimento.style.width = alvo;
      preenchimento.setAttribute('data-alvo', alvo);
      return;
    }
    case 'anel': {
      const lado = 46;
      const svg = criarSvgEl('svg', { pai: el, atributos: { width: lado, height: lado, viewBox: '0 0 46 46' } });
      const r = 19;
      const comp = 2 * Math.PI * r;
      criarSvgEl('circle', { pai: svg, atributos: { cx: 23, cy: 23, r, fill: 'none', stroke: comOpacidade(tema.texto, 0.12), 'stroke-width': 5 } });
      const arco = criarSvgEl('circle', {
        pai: svg,
        classe: 'mv-anel',
        atributos: { cx: 23, cy: 23, r, fill: 'none', stroke: cor, 'stroke-width': 5, 'stroke-linecap': 'round', transform: 'rotate(-90 23 23)', 'stroke-dasharray': comp },
      });
      const final = comp * (1 - fracao);
      if (anim.ligada && config.animarBarrasMV !== false) {
        arco.setAttribute('stroke-dashoffset', comp);
        arco.style.transition = `stroke-dashoffset ${anim.duracao}ms ease-out`;
        ctx.agendarQuadro(() => arco.setAttribute('stroke-dashoffset', final));
      } else arco.setAttribute('stroke-dashoffset', final);
      const t = criarSvgEl('text', { pai: svg, atributos: { x: 23, y: 23, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 10, fill: tema.texto } });
      definirTexto(t, `${Math.round(fracao * 100)}%`);
      return;
    }
    case 'mini': {
      const serie = modelo.linhas.map((l) => modelo.valorNumerico(l, c.campo.nome)).filter((v) => v !== null && Number.isFinite(v));
      el.appendChild(document.createTextNode(texto));
      if (serie.length < 2) return;
      const w = 90;
      const h = 22;
      const min = Math.min(...serie);
      const max = Math.max(...serie);
      const pts = serie.map((v, i) => `${((i / (serie.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`);
      const svg = criarSvgEl('svg', { pai: el.parentNode, classe: 'mv-mini', atributos: { width: w, height: h, viewBox: `0 0 ${w} ${h}` } });
      criarSvgEl('polyline', { pai: svg, atributos: { points: pts.join(' '), fill: 'none', stroke: cor, 'stroke-width': 1.6 } });
      return;
    }
    case 'seta': {
      const s = criarEl('span', { pai: el, texto: n > 0 ? '▲ ' : n < 0 ? '▼ ' : '■ ' });
      s.style.color = n > 0 ? tema.positivo : n < 0 ? tema.negativo : tema.textoSuave;
      el.appendChild(document.createTextNode(texto));
      return;
    }
    case 'estrelas': {
      const k = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
      const s = criarEl('span', { pai: el, texto: '★'.repeat(k) + '☆'.repeat(5 - k) });
      s.style.color = '#F59E0B';
      s.setAttribute('aria-label', `${k} de 5`);
      return;
    }
    case 'semaforo': {
      const ref = c.meta > 0 ? n / c.meta : null;
      const corS = !Number.isFinite(n) ? tema.textoSuave : ref === null ? (n >= 0 ? tema.positivo : tema.negativo) : ref >= 1 ? tema.positivo : ref >= 0.8 ? '#F59E0B' : tema.negativo;
      const bola = criarEl('span', { classe: 'mv-quadrado', pai: el });
      bola.style.background = corS;
      bola.style.borderRadius = '50%';
      bola.style.marginRight = '6px';
      el.appendChild(document.createTextNode(texto));
      // Pulso em alerta: vermelho do semáforo.
      if (corS === tema.negativo && anim.ligada && config.pulsoEmAlertaMV !== false) {
        el.closest('.mv-item').style.animation = 'mv-pulso 1.6s ease-in-out infinite';
        el.closest('.mv-item').classList.add('mv-alerta');
      }
      return;
    }
    case 'icone': {
      desenharIcone({ pai: el, id: c.icone !== 'nenhum' ? c.icone : 'check', lado: 22, cor });
      return;
    }
    case 'link':
      el.classList.add('mv-link');
      el.appendChild(document.createTextNode(texto));
      return;
    default: {
      if (tipo === 'numero' && Number.isFinite(n) && anim.contador && c.formato === 'auto') {
        el.appendChild(document.createTextNode(texto));
        return;
      }
      el.appendChild(document.createTextNode(texto));
    }
  }
}

/** Copia para a área de transferência (navigator.clipboard; senão execCommand). */
function copiar(texto, item, ctx, tema) {
  const avisar = () => {
    const a = criarEl('div', { classe: 'mv-copiado', pai: item, texto: 'copiado' });
    a.style.background = tema.tooltipFundo || '#0F172A';
    a.style.color = tema.tooltipTexto || '#F8FAFC';
    ctx.agendarTimer(() => a.parentNode && a.parentNode.removeChild(a), 900);
  };
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(avisar, () => {});
      return true;
    }
  } catch (_) {
    /* cai no plano B */
  }
  const area = document.createElement('textarea');
  area.value = texto;
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  document.body.appendChild(area);
  let ok = false;
  try {
    area.select();
    ok = typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch (_) {
    ok = false;
  }
  document.body.removeChild(area);
  if (ok) avisar();
  return ok;
}
