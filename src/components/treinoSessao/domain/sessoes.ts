import { SESSOES, type ExercicioSessao, type SessaoTipo } from "../../../data/sessionExercises";
import type { PlanoTreino } from "../../../types/TrainingData";
import { normalizarSeriesValidas } from "../../../utils/seriesValidas";
import { lerObjetoSalvo } from "../../../utils/storage";

// Rótulo curto do seletor: "S3-4 Terça · Upper" → "S3-4 Ter"; o nome completo fica no title/aria-label.
export function rotuloCurto(sessao: string): string {
  if (!sessao.includes(" · ")) return sessao;
  const [semana = sessao] = sessao.split(" · ");
  return semana.replace(/\p{L}{4,}/gu, (dia) => dia.slice(0, 3));
}

function exercicioLegivel(ex: Partial<ExercicioSessao> | null): boolean {
  return typeof ex?.nome === "string" && Array.isArray(ex.faixaTopSet) && Array.isArray(ex.faixaBackoff);
}

export function lerSessoesConfig(): Record<string, ExercicioSessao[]> {
  const config = lerObjetoSalvo<Record<string, ExercicioSessao[]>>("sessoes_config");
  // Sessão em formato inesperado cai na padrão em vez de quebrar a tela.
  return Object.fromEntries(
    Object.entries(config).flatMap(([sessao, lista]) => (Array.isArray(lista) ? [[sessao, lista.filter(exercicioLegivel)]] : [])),
  );
}

/** Exercícios da sessão com a ordem e as séries válidas do plano importado (RG1.1). */
export function exerciciosDaSessao(sessao: string): ExercicioSessao[] {
  const sessoesConfig = lerSessoesConfig();
  const base = sessoesConfig[sessao] ? [...sessoesConfig[sessao]] : [...(SESSOES[sessao as SessaoTipo] ?? [])];
  const plano = lerObjetoSalvo<PlanoTreino>("planoTreino");
  const sp = plano[sessao];
  if (!sp) return base;
  const updated = base.map((ex) => {
    const p = sp[ex.nome];
    if (!p) return ex;
    return { ...ex, seriesValidas: normalizarSeriesValidas(p.series_validas) };
  });
  updated.sort((a, b) => {
    const ao = sp[a.nome]?.ordem ?? Infinity;
    const bo = sp[b.nome]?.ordem ?? Infinity;
    return ao - bo;
  });
  return updated;
}
