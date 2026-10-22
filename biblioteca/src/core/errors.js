/**
 * errors.js — mensagens de erro e aviso, todas em português.
 *
 * Centralizar aqui serve para dois objetivos:
 *  1. O usuário sempre recebe uma instrução clara de COMO montar o Explore,
 *     em vez de um erro técnico.
 *  2. Se o texto precisar mudar, muda num lugar só.
 *
 * Nenhuma função aqui toca a API do Looker — quem mostra o erro é o
 * `looker-adapter.js`.
 */

/** Erro de validação de dados: carrega título + mensagem prontos para exibir. */
export class ErroDeDados extends Error {
  constructor(titulo, mensagem) {
    super(`${titulo}: ${mensagem}`);
    this.name = 'ErroDeDados';
    this.titulo = titulo;
    this.mensagem = mensagem;
  }
}

/** Pluraliza "dimensão/dimensões" e "medida/medidas". */
function plural(n, singular, pluralPalavra) {
  return n === 1 ? `1 ${singular}` : `${n} ${pluralPalavra}`;
}

function descreverExigencia({ dimensoesMin, dimensoesMax, medidasMin, medidasMax }) {
  const partes = [];
  if (dimensoesMin) {
    if (dimensoesMax && dimensoesMax !== dimensoesMin) {
      partes.push(`de ${dimensoesMin} a ${dimensoesMax} dimensões`);
    } else {
      partes.push(`pelo menos ${plural(dimensoesMin, 'dimensão', 'dimensões')}`);
    }
  }
  if (medidasMin) {
    if (medidasMax && medidasMax !== medidasMin) {
      partes.push(`de ${medidasMin} a ${medidasMax} medidas`);
    } else {
      partes.push(`pelo menos ${plural(medidasMin, 'medida', 'medidas')}`);
    }
  }
  return partes.join(' e ');
}

export const erros = {
  /** Faltou campo: explica exatamente o que adicionar no Explore. */
  camposInsuficientes(exigencia, extra) {
    const alvo = descreverExigencia(exigencia) || 'campos';
    const mensagem =
      `Esta visualização precisa de ${alvo}. ` +
      `Adicione os campos no Explore e rode a consulta de novo.` +
      (extra ? ` ${extra}` : '');
    return new ErroDeDados('Faltam campos', mensagem);
  },

  semDados() {
    return new ErroDeDados(
      'Sem dados',
      'A consulta não retornou nenhuma linha. Revise os filtros do Explore.'
    );
  },

  semLinhasValidas(motivo) {
    return new ErroDeDados(
      'Nenhuma linha utilizável',
      `Todas as linhas foram descartadas${motivo ? ` (${motivo})` : ''}. ` +
        'Ligue a opção "Modo debug" (seção Avançado) e veja o console do ' +
        'navegador para inspecionar a primeira linha recebida.'
    );
  },

  pivoNaoSuportado() {
    return new ErroDeDados(
      'Pivô não suportado',
      'Esta visualização não aceita consultas com pivô. Remova o pivô no ' +
        'Explore (ícone ao lado da dimensão) e rode de novo.'
    );
  },

  pivoObrigatorio() {
    return new ErroDeDados(
      'Pivô obrigatório',
      'Esta visualização precisa de uma dimensão pivotada. Clique no ícone ' +
        'de pivô ao lado de uma dimensão no Explore.'
    );
  },

  medidaNaoNumerica(nomeCampo) {
    return new ErroDeDados(
      'Campo não numérico',
      `O campo "${nomeCampo}" não tem valores numéricos utilizáveis. ` +
        'Escolha uma medida numérica nas opções da visualização.'
    );
  },

  formatoNaoReconhecido(descricaoFormatos) {
    return new ErroDeDados(
      'Formato de dados não reconhecido',
      `Não consegui interpretar os campos da consulta. ${descricaoFormatos}`
    );
  },

  tempoLimite(oQue) {
    return new ErroDeDados(
      'Demorou demais',
      `${oQue} passou do limite de tempo e foi interrompido para não travar o ` +
        'navegador. Reduza o volume de dados (Top N ou filtros) e tente de novo.'
    );
  },

  generico(erro) {
    const texto = (erro && (erro.mensagem || erro.message)) || String(erro);
    return new ErroDeDados('Erro na visualização', texto);
  },
};

/** Avisos: não bloqueiam a renderização, aparecem como faixa discreta. */
export const avisos = {
  volumeAlto(n, limite) {
    return (
      `Mostrando ${limite.toLocaleString('pt-BR')} de ${n.toLocaleString('pt-BR')} ` +
      'linhas (limite de desempenho). Use Top N ou filtros para refinar.'
    );
  },
  valoresNegativosIgnorados(n) {
    return `${n} valor(es) negativo(s) foram ignorados: este gráfico só aceita valores ≥ 0.`;
  },
  nulosIgnorados(n) {
    return `${n} linha(s) com valor nulo foram ignoradas (mude isso em Dados > Tratamento de nulos).`;
  },
  recursoIndisponivel(nome) {
    return `O recurso "${nome}" não está disponível nesta versão do Looker; seguindo sem ele.`;
  },
};
