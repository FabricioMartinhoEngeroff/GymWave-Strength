import { serieFeita } from "../../../utils/seriesValidas";
import { temTopSet2, topSetFeito, topSet2Feito, type ExerciseState } from "./estadoExercicio";

export interface SerieDoTreino {
  tipo: "top1" | "top2" | "extra" | "serie4";
  kg: number;
  reps: number;
  rpe: number | null;
}

/**
 * Séries que o atleta fez de verdade (RG24), na ordem. Sugestão não confirmada, bloco
 * que nem abriu e série sem peso ou reps ficam de fora. Deload vale só o Top Set 1 (RG15).
 */
export function seriesFeitas(s: ExerciseState): SerieDoTreino[] {
  if (s.skipped || s.tecnica || !topSetFeito(s)) return [];
  const serie = (tipo: SerieDoTreino["tipo"], kg: string, reps: string, rpe: number | null): SerieDoTreino[] => {
    const feita = { tipo, kg: parseFloat(kg) || 0, reps: parseInt(reps) || 0, rpe };
    return serieFeita(feita.kg, feita.reps) ? [feita] : [];
  };
  const blocosAbertos = temTopSet2(s) && s.backoffConfirmed;

  return [
    ...serie("top1", s.topSetKg, s.topSetReps, s.topSetRpe),
    ...(temTopSet2(s) && topSet2Feito(s) ? serie("top2", s.backoffKg, s.backoffReps, s.backoffRpe) : []),
    ...(blocosAbertos && s.seriesValidas >= 3 ? serie("extra", s.extraKg, s.extraReps, s.extraRpe) : []),
    ...(blocosAbertos && s.seriesValidas === 4 ? serie("serie4", s.serie4Kg, s.serie4Reps, s.serie4Rpe) : []),
  ];
}
