/**
 * rotulos-do-painel.js — rótulos curtos do painel de opções (melhorias v3,
 * 5.1b).
 *
 * O editor do Looker corta com reticências os rótulos que não cabem na
 * largura do painel ("Modo debug (escreve no console a estrutura...").
 * Limite adotado: 30 caracteres nas opções liga/desliga (a caixa de
 * marcar ocupa parte da linha) e 40 nas demais, CONTANDO o prefixo
 * ("Rótulo · ").
 *
 * A API de opções de visualização do Looker não tem, até onde se sabe, um
 * campo de texto de ajuda por opção (os campos conhecidos são type, label,
 * default, section, order, display, values, placeholder, min, max, step e
 * display_size). Por isso a explicação longa NÃO vai para o painel: o
 * rótulo original (completo) fica em `docs/opcoes/ABAS.md`, gerado por
 * `npm run opcoes`, e o README da biblioteca aponta para lá.
 *
 * Só o TEXTO do rótulo muda; id, tipo e default nunca (ver 4.1).
 */

/** Limite de caracteres do rótulo, conforme o tipo da opção. */
export function limiteDoRotulo(opcao) {
  return opcao && opcao.type === 'boolean' ? 30 : 40;
}

/**
 * Corpo curto (sem o prefixo) por id de opção. Usado quando o rótulo
 * original não cabe no limite. Se, mesmo assim, prefixo + corpo não couber,
 * o prefixo é encurtado ou omitido (ver `montarRotulo`).
 */
export const CORPO_CURTO = {
  // Árvores e organograma
  espessuraPorValor: 'Ligação proporcional',
  escalaPorArvore: 'Escala por árvore',
  tamanhoPorValor: 'Nó pelo valor',
  comecarRecolhidoAPartirDe: 'Recolher a partir do nível',
  preencherCartao: 'Cartão na cor do ramo',
  espacoEntreIrmaos: 'Espaço entre vizinhos',
  mostrarValorNoCartao: 'Valor no cartão',
  mostrarContagemDeEquipe: 'Total de descendentes',
  permitirRecolher: 'Recolher ao clicar',
  campoDoCargo: 'Campo da 2ª linha',
  mostrarBotoesDeExpandir: 'Botões de expandir',
  // Rótulos
  evitarColisaoDeRotulos: 'Ocultar sobrepostos',
  truncarRotulo: 'Cortar após N caracteres',
  mostrarRotulosDeFolha: 'Nome das folhas',
  mostrarRotulosInternos: 'Nome dos nós internos',
  mostrarValorNoRotulo: 'Incluir o valor',
  mostrarPercentual: 'Mostrar percentual',
  mostrarTotalDoConjunto: 'Total do conjunto',
  listarRegioesPequenas: 'Listar as pequenas',
  escreverLimites: 'Valores dos limites',
  escreverPercentuais: 'Percentual no bloco',
  escreverLarguras: 'Peso de cada coluna',
  escreverValores: 'Valor junto do nome',
  mostrarValorNoBloco: 'Valor no retângulo',
  mostrarValorNaBarra: 'Valor acima da barra',
  // Tooltip e clique
  tooltipPersonalizado: 'Personalizado',
  modeloDeTooltip: 'Modelo',
  tooltipComNomeCompleto: 'Nome completo',
  tooltipComValorBruto: 'Valor sem formato',
  permitirHtmlDoLooker: 'HTML do Looker',
  destacarAoPassarMouse: 'Destacar sob o mouse',
  destacarNoHover: 'Destacar sob o mouse',
  permitirOrdenar: 'Ordenar no cabeçalho',
  mostrarFiltrosPorColuna: 'Filtro por coluna',
  permitirSelecionarLinhas: 'Selecionar e somar',
  destacarLinhaEColuna: 'Realçar linha/coluna',
  permitirRedimensionarColunas: 'Redimensionar colunas',
  permitirDrill: 'Drill na célula',
  mostrarBusca: 'Campo de busca',
  // Animação
  contadorAnimado: 'Números contando',
  animarEntradaDasLinhas: 'Entrada das linhas',
  animarMudancaDeValor: 'Piscar ao mudar',
  repetir: 'Repetir ao terminar',
  // Avançado
  aplicarConfiguracaoJson: 'Aplicar o JSON acima',
  // Dados e séries
  agruparRestoEmOutros: 'Agrupar o resto em Outros',
  mostrarRank: 'Número do rank',
  mostrarPontos: 'Ponto em cada período',
  mostrarPosicao: 'Posição no ponto',
  normalizarParticipacao: 'X como participação',
  mostrarTotalDeLinha: 'Coluna de total por linha',
  estiloDeData: 'Formato das células de data',
  cabecalhoVertical: 'Cabeçalho na vertical',
  esconderIntersecoesVazias: 'Ocultar interseções vazias',
  mostrarTotaisDosConjuntos: 'Totais dos conjuntos',
  // Cores e escalas
  escalaDeCorPersonalizada: 'Escala própria',
  limiteDeCorAutomatico: 'Limites automáticos',
  corPorDirecao: 'Cor por direção',
  corDoSinal: 'Cor fora de controle',
  // Legenda e eixos
  legendaInterativa: 'Clique liga/desliga',
  mostrarValoresNaLegenda: 'Mostrar valores',
  comecarEmZero: 'Eixo começa em zero',
  gradeEixoX: 'Linhas de grade',
  gradeEixoY: 'Linhas de grade',
  eixoXSimetricoEmTorno1: 'Eixo X centrado em 1',
  // Gráficos específicos
  ligarPontos: 'Ligar os pontos',
  mostrarGuias: 'Guias verticais',
  destacarPiorQueda: 'Destacar pior queda',
  mostrarRecuperacao: 'Duração da queda',
  periodoBase: 'Base: N primeiros períodos',
  mostrarZonas: 'Zonas de 1σ e 2σ',
  colorirVariacao: 'Cor pela direção',
  mostrarVariacaoAbsoluta: 'Diferença absoluta',
  mostrarProgressoDaMeta: 'Progresso até a meta',
  usarLimites: 'Cor por limites',
  pintarQuadrantes: 'Pintar o fundo',
  mostrarContagemPorQuadrante: 'Pontos por quadrante',
  mostrarCorte: 'Marcar o corte',
  destacarAteOCorte: 'Destacar até o corte',
  mostrarPontosDoAcumulado: 'Pontos no acumulado',
  mostrarRetaDeSharpe: 'Reta do melhor Sharpe',
  destacarMelhorSharpe: 'Destacar o melhor',
  mostrarTitulosDeGrupo: 'Nome de cada grupo',
};

/**
 * Corpo das opções por coluna da tabela (`col_<campo>_<sufixo>`). Vale
 * SEMPRE (mesmo quando o original cabe), para todas as colunas lerem igual.
 */
const CORPO_POR_SUFIXO_DE_COLUNA = [
  [/^visivel$/, () => 'Mostrar'],
  [/^rotulo$/, () => 'Renomear'],
  [/^largura$/, () => 'Largura (px)'],
  [/^alinhamento$/, () => 'Alinhamento'],
  [/^tipoDeCelula$/, () => 'Tipo de célula'],
  [/^corDoTexto$/, () => 'Cor do texto'],
  [/^corDeFundo$/, () => 'Cor de fundo'],
  [/^prefixo$/, () => 'Prefixo'],
  [/^sufixo$/, () => 'Sufixo'],
  [/^formato$/, () => 'Formato'],
  [/^casasDecimais$/, () => 'Casas decimais'],
  [/^corDaBarra$/, () => 'Cor da barra'],
  [/^escalaDeCor$/, () => 'Escala de cor'],
  [/^escalaCorMin$/, () => 'Cor do menor'],
  [/^escalaCorMax$/, () => 'Cor do maior'],
  [/^regra(\d+)$/, (n) => `R${n}: condição`],
  [/^regra(\d+)Valor$/, (n) => `R${n}: valor`],
  [/^regra(\d+)Valor2$/, (n) => `R${n}: valor 2`],
  [/^regra(\d+)Acao$/, (n) => `R${n}: ação`],
  [/^regra(\d+)Cor$/, (n) => `R${n}: cor`],
  [/^regra(\d+)Icone$/, (n) => `R${n}: ícone`],
  [/^regra(\d+)LinhaInteira$/, (n) => `R${n}: linha toda`],
  [/^regra(\d+)Coluna$/, (n) => `R${n}: comparar com`],
];

function corpoDinamico(id) {
  const m = /^col_(?:dim|med|tab|calc)_.+?_([a-zA-Z0-9]+)$/.exec(id);
  if (!m) return null;
  for (const [re, fn] of CORPO_POR_SUFIXO_DE_COLUNA) {
    const r = re.exec(m[1]);
    if (r) return fn(r[1]);
  }
  return null;
}

/** Remove explicações entre parênteses e depois de travessão. */
function semExplicacao(texto) {
  return String(texto)
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+[—–]\s+.*$/, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cortar(texto, limite) {
  return texto.length <= limite ? texto : `${texto.slice(0, Math.max(1, limite - 1)).trimEnd()}…`;
}

/**
 * Monta o rótulo final "Prefixo · corpo" dentro do limite.
 * Ordem de tentativas: rótulo original; corpo curto do dicionário (ou da
 * coluna); corpo sem explicação; prefixo encurtado; sem prefixo; e, só em
 * último caso (nomes vindos dos dados, como o de uma série), corte com "…".
 *
 * @param {{id:string, prefixo?:string, rotulo:string, opcao:object}} p
 */
export function montarRotulo({ id, prefixo, rotulo, opcao }) {
  const limite = limiteDoRotulo(opcao);
  const sep = ' · ';
  let corpo = String(rotulo ?? '');
  if (prefixo && corpo.startsWith(`${prefixo}${sep}`)) corpo = corpo.slice(prefixo.length + sep.length);
  const junto = (p, c) => (p ? `${p}${sep}${c}` : c);

  const daColuna = corpoDinamico(id);
  if (daColuna) corpo = daColuna;
  if (junto(prefixo, corpo).length <= limite) return junto(prefixo, corpo);
  const curto = CORPO_CURTO[id];
  if (curto) corpo = curto;
  else if (corpo.length > limite || junto(prefixo, corpo).length > limite) corpo = semExplicacao(corpo) || corpo;
  if (junto(prefixo, corpo).length <= limite) return junto(prefixo, corpo);

  // Quadrantes: o nome (configurável pelo usuário) é o que importa.
  corpo = corpo.replace(/^Cor do quadrante /, 'Cor: ').replace(/^Nome do quadrante /, 'Nome: ');
  if (junto(prefixo, corpo).length <= limite) return junto(prefixo, corpo);

  // Prefixo com nome vindo dos dados ("Coluna Nome da loja"): vira
  // "Col. Nome…" até caber. Prefixo fixo ("Quadrantes") é omitido.
  if (prefixo && /^Coluna /.test(prefixo)) {
    const sobra = limite - corpo.length - sep.length;
    const curtoPrefixo = prefixo.replace(/^Coluna /, 'Col. ');
    if (sobra >= 6) return junto(cortar(curtoPrefixo, sobra), corpo);
  }
  return cortar(corpo, limite);
}
