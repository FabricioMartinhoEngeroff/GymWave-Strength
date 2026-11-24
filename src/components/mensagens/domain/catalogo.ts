// Catálogo de mensagens (EF_09 §5): todo texto mostrado ao atleta fora dos campos sai daqui.

export type TipoAviso = "sucesso" | "info" | "aviso" | "conquista" | "erro";

export interface TextoAviso {
  tipo: TipoAviso;
  titulo: string;
  texto: string;
}

export interface TextoConfirmacao {
  titulo: string;
  texto: string;
  cancelar: string;
  confirmar: string;
  perigo?: boolean;
}

/** Tempo na tela; erro fica até fechar (RG3). */
export const DURACAO_MS: Record<TipoAviso, number | null> = {
  sucesso: 5000,
  info: 5000,
  aviso: 8000,
  conquista: 8000,
  erro: null,
};

const avisos = <K extends string>(a: Record<K, TextoAviso>) => a;
const confirmacoes = <K extends string>(c: Record<K, TextoConfirmacao>) => c;

export const AVISOS = avisos({
  treino_salvo: { tipo: "sucesso", titulo: "Treino finalizado!", texto: "Registro salvo com sucesso." },
  importacao_concluida: { tipo: "sucesso", titulo: "Importação concluída", texto: "Seus treinos foram atualizados." },
  importacao_desfeita: { tipo: "sucesso", titulo: "Importação desfeita", texto: "Seus dados anteriores foram restaurados." },
  registro_excluido: { tipo: "sucesso", titulo: "Registro excluído", texto: "O registro saiu do relatório." },
  rascunho_restaurado: { tipo: "info", titulo: "Treino retomado", texto: "Continuamos de onde você parou." },
  nenhuma_serie_feita: { tipo: "aviso", titulo: "Nenhuma série feita", texto: "Confirme ao menos uma série para salvar. Seu rascunho continua guardado." },
  data_invalida: { tipo: "aviso", titulo: "Confira a data do treino", texto: "Use dia/mês/ano, como 04/11/2026. Seu rascunho continua guardado." },
  rascunho_nao_salvo: { tipo: "aviso", titulo: "Rascunho não guardado", texto: "O aparelho não deixou guardar o rascunho. Salve o treino antes de sair desta tela." },
  planilha_vazia: { tipo: "aviso", titulo: "Nada para importar", texto: "Não encontramos exercícios neste arquivo. Confira as colunas e tente de novo." },
  preencha_registro: { tipo: "aviso", titulo: "Falta preencher", texto: "Preencha ao menos um peso, repetição ou observação." },
  selecione_exercicio: { tipo: "aviso", titulo: "Falta o exercício", texto: "Selecione um exercício." },
  dados_corrompidos: { tipo: "aviso", titulo: "Parte dos dados não pôde ser lida", texto: "Guardamos uma cópia do original. Baixe um backup na aba Exportar." },
  treino_nao_salvo: { tipo: "erro", titulo: "Treino não salvo", texto: "Não foi possível salvar o treino. Nada foi perdido: seu rascunho continua guardado. Tente novamente." },
  armazenamento_cheio: { tipo: "erro", titulo: "Sem espaço no aparelho", texto: "Nada foi perdido. Baixe um backup e libere espaço no navegador antes de tentar de novo." },
  armazenamento_bloqueado: { tipo: "erro", titulo: "Armazenamento bloqueado", texto: "O navegador não deixou acessar os dados. Saia do modo anônimo ou libere o armazenamento do site." },
  sem_conexao: { tipo: "erro", titulo: "Sem conexão", texto: "Verifique sua internet e tente novamente. Seus treinos continuam no aparelho." },
  arquivo_invalido: { tipo: "erro", titulo: "Arquivo não reconhecido", texto: "Não foi possível ler o arquivo. Nada foi alterado." },
  dados_ilegiveis: { tipo: "erro", titulo: "Dados ilegíveis", texto: "Não foi possível ler essas informações. Tente recarregar a página." },
  erro_inesperado: { tipo: "erro", titulo: "Algo deu errado", texto: "Seus dados estão salvos. Tente novamente." },
  conquista_recorde: { tipo: "conquista", titulo: "Novo recorde!", texto: "Você superou o seu melhor." },
  conquista_treino_completo: { tipo: "conquista", titulo: "Treino completo!", texto: "Você fez todas as séries de hoje." },
  conquista_marco: { tipo: "conquista", titulo: "Novo marco!", texto: "Constância é o que constrói resultado." },
});

export const CONFIRMACOES = confirmacoes({
  treino_em_andamento: {
    titulo: "Treino em andamento",
    texto: "Este treino ainda não foi salvo no histórico. O rascunho fica guardado neste aparelho para você continuar depois.",
    cancelar: "Continuar treinando",
    confirmar: "Sair da tela",
  },
  sair_da_conta: {
    titulo: "Sair da conta?",
    texto: "Há um treino em andamento. O rascunho fica guardado neste aparelho para quando você voltar.",
    cancelar: "Ficar",
    confirmar: "Sair da conta",
  },
  series_nao_feitas: {
    titulo: "Há séries não feitas",
    texto: "Elas não entram no volume nem nas séries válidas.",
    cancelar: "Voltar e preencher",
    confirmar: "Salvar assim mesmo",
  },
  desfazer_importacao: {
    titulo: "Desfazer a importação?",
    texto: "Os dados anteriores à importação serão restaurados.",
    cancelar: "Manter",
    confirmar: "Desfazer",
    perigo: true,
  },
  limpar_tudo: {
    titulo: "Apagar todos os treinos?",
    texto: "Todo o histórico da sua conta será apagado deste aparelho. Baixe um backup antes.",
    cancelar: "Cancelar",
    confirmar: "Apagar tudo",
    perigo: true,
  },
  excluir_registro: {
    titulo: "Excluir registro?",
    texto: "Este registro sairá do relatório.",
    cancelar: "Cancelar",
    confirmar: "Excluir",
    perigo: true,
  },
  ocultar_grafico: {
    titulo: "Ocultar gráfico?",
    texto: "O gráfico some desta tela até recarregar. Seus treinos não são apagados.",
    cancelar: "Cancelar",
    confirmar: "Ocultar",
  },
});

export type IdAviso = keyof typeof AVISOS;
export type IdConfirmacao = keyof typeof CONFIRMACOES;
