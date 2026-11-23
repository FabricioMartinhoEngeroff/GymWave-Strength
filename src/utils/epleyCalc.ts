import type { RegistroExercicio } from "../types/TrainingData";

export function calcEpley(peso: number, reps: number): number {
  if (peso <= 0) return 0;
  const result = peso * (1 + reps / 30);
  return Math.round(result * 100) / 100;
}

const EPLEY_MAX_REPS = 10;
const RPE_MIN_ESTIMATIVA = 7; // abaixo disso a reserva é um chute grande demais

export interface Estimativa1RM {
  rm1: number;
  repsAteFalha: number;
  /** Mais de 10 reps até a falha: a margem de erro cresce muito. */
  aproximado: boolean;
}

/**
 * 1RM pelo esforço: reps feitas + reps na reserva (10 − RPE) = reps até a falha.
 * Até 10 usa Epley. Acima disso o Epley superestima, então usa Mayhew
 * (100 × peso / (52,2 + 41,9 × e^(−0,055 × reps))), nunca abaixo do valor em 10 reps.
 */
export function estimar1RM(peso: number, reps: number, rpe: number | undefined): Estimativa1RM | null {
  if (rpe === undefined || rpe < RPE_MIN_ESTIMATIVA || peso <= 0 || reps <= 0) return null;
  const repsAteFalha = reps + (10 - rpe);
  const aproximado = repsAteFalha > EPLEY_MAX_REPS;
  if (repsAteFalha === 1) return { rm1: peso, repsAteFalha, aproximado };
  if (!aproximado) return { rm1: calcEpley(peso, repsAteFalha), repsAteFalha, aproximado };
  const mayhew = (100 * peso) / (52.2 + 41.9 * Math.exp(-0.055 * repsAteFalha));
  return { rm1: Math.round(Math.max(mayhew, calcEpley(peso, EPLEY_MAX_REPS)) * 100) / 100, repsAteFalha, aproximado };
}

export function extractReferenceBlock(
  registro: RegistroExercicio
): { peso: number; reps: number; rpe?: number } | null {
  if (registro.tecnica === "RP") {
    const bloco1 = registro.clusterSeries?.[0] ?? registro.clusterSeries2?.[0];
    if (!bloco1 || bloco1.kg <= 0 || bloco1.reps <= 0) return null;
    return { peso: bloco1.kg, reps: bloco1.reps };
  }
  return { peso: registro.topSetKg, reps: registro.topSetReps, rpe: registro.topSetRpe };
}
