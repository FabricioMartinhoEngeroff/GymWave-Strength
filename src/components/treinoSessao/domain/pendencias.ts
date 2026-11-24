import type { ExercicioSessao } from "../../../data/sessionExercises";
import { exercicioConcluido, serieClusterTemBloco, temTopSet2, type CampoRpe, type ExerciseState } from "./estadoExercicio";
import { camposSemEsforco, seriesFeitas, type SerieDoTreino } from "./seriesFeitas";

/** Séries previstas que o atleta não fez, por nome. */
function seriesFaltando(s: ExerciseState): string[] {
  if (s.tecnica) return s.seriesValidas !== 1 && !serieClusterTemBloco(s.clusterSeries2) ? ["Cluster Série 2"] : [];
  if (!temTopSet2(s)) return [];
  const feitas = new Set<SerieDoTreino["tipo"]>(seriesFeitas(s).map((f) => f.tipo));
  return [
    !feitas.has("top2") && "Top Set 2",
    s.seriesValidas === 3 && !feitas.has("extra") && "Back-off",
    s.seriesValidas === 4 && !feitas.has("extra") && "Série 3",
    s.seriesValidas === 4 && !feitas.has("serie4") && "Série 4",
  ].filter((nome) => nome !== false);
}

function feitoEmParte(s: ExerciseState): boolean {
  return s.tecnica ? exercicioConcluido(s) : seriesFeitas(s).length > 0;
}

/** O que ficou por fazer antes de salvar (EF_09 RG8). Pulado é escolha do atleta e não entra. */
export function pendenciasDoTreino(exercicios: ExercicioSessao[], states: Record<string, ExerciseState>): string[] {
  return exercicios.flatMap((ex) => {
    const s = states[ex.nome];
    if (s?.skipped) return [];
    if (!s || !feitoEmParte(s)) return [`${ex.nome}: não preenchido`];
    const faltando = seriesFaltando(s);
    return faltando.length > 0 ? [`${ex.nome}: ${faltando.join(", ")}`] : [];
  });
}

function nomeDaSerie(campo: CampoRpe, s: ExerciseState): string {
  const nomes: Record<CampoRpe, string> = {
    topSetRpe: "Top Set 1",
    backoffRpe: "Top Set 2",
    extraRpe: s.seriesValidas === 4 ? "Série 3" : "Back-off",
    serie4Rpe: "Série 4",
    clusterRpe: "Cluster Série 1",
    clusterRpe2: "Cluster Série 2",
  };
  return nomes[campo];
}

/** Séries feitas sem esforço, por exercício (EF_02 RG27). Bloqueia o salvamento. */
export function seriesSemEsforco(exercicios: ExercicioSessao[], states: Record<string, ExerciseState>): string[] {
  return exercicios.flatMap((ex) => {
    const s = states[ex.nome];
    const campos = s ? camposSemEsforco(s) : [];
    return s && campos.length > 0 ? [`${ex.nome}: ${campos.map((c) => nomeDaSerie(c, s)).join(", ")}`] : [];
  });
}
