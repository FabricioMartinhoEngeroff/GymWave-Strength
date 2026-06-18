import type { RegistroExercicio } from "../types/TrainingData";

export function calcEpley(peso: number, reps: number): number {
  if (peso <= 0) return 0;
  const result = peso * (1 + reps / 30);
  return Math.round(result * 100) / 100;
}

export function extractReferenceBlock(
  registro: RegistroExercicio
): { peso: number; reps: number } | null {
  if (registro.tecnica === "BC" || registro.tecnica === "RP") {
    const bloco1 = registro.clusterSeries?.[0];
    if (!bloco1 || bloco1.kg <= 0 || bloco1.reps <= 0) return null;
    return { peso: bloco1.kg, reps: bloco1.reps };
  }
  return { peso: registro.topSetKg, reps: registro.topSetReps };
}
