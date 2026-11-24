import { mensagens } from "./mensagens";

interface LinhaImportada {
  sessao: string;
  exercicio: string;
  rpe_alvo_ilegivel?: boolean;
}

/** Diz quais exercícios ficaram sem o alvo da planilha, em vez de cair no padrão em silêncio (EF_06 RG14). */
export function avisarRpeAlvoIlegivel(linhas: LinhaImportada[]): void {
  const semAlvo = linhas.filter((l) => l.rpe_alvo_ilegivel).map((l) => `${l.exercicio} (${l.sessao})`);
  if (semAlvo.length === 0) return;
  const lista = [...new Set(semAlvo)].join(" · ");
  mensagens.mostrar("rpe_alvo_ilegivel", { texto: `Estes exercícios ficaram sem o alvo da planilha: ${lista}. Use o formato 7-8.` });
}
