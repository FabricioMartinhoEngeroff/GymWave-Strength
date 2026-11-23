import type { RegistroExercicio } from "../../../types/TrainingData";

export interface LinhaUltimoTreino {
  label: string;
  kg: number;
  reps: number;
  rpe?: number;
}

/**
 * Expande um registro do último treino na lista completa de séries feitas,
 * na mesma ordem em que foram registradas (Top Set 1 → Top Set 2 → Back-off,
 * ou os blocos das duas séries quando o exercício foi em Cluster Set).
 */
export function seriesDoRegistro(r: RegistroExercicio): LinhaUltimoTreino[] {
  const linhas: LinhaUltimoTreino[] = [];

  if (r.tecnica === "RP") {
    [
      { blocos: r.clusterSeries, rpe: r.clusterRpe },
      { blocos: r.clusterSeries2, rpe: r.clusterRpe2 },
    ].forEach(({ blocos, rpe }, si) => {
      (blocos ?? [])
        .filter((b) => b.kg > 0 && b.reps > 0)
        .forEach((b, i, validos) => linhas.push({
          label: `Cluster S${si + 1} · B${i + 1}`, kg: b.kg, reps: b.reps, rpe: i === validos.length - 1 ? rpe : undefined,
        }));
    });
    return linhas;
  }

  if (r.topSetKg > 0 && r.topSetReps > 0) {
    linhas.push({ label: r.isDeload ? "Top Set 1 (deload)" : "Top Set 1", kg: r.topSetKg, reps: r.topSetReps, rpe: r.topSetRpe });
  }
  if (r.backoffKg > 0 && r.backoffReps > 0) {
    linhas.push({ label: "Top Set 2", kg: r.backoffKg, reps: r.backoffReps, rpe: r.backoffRpe });
  }
  if (r.extraKg && r.extraReps && r.extraKg > 0 && r.extraReps > 0) {
    linhas.push({ label: r.seriesValidas === 4 ? "Série 3" : "Back-off", kg: r.extraKg, reps: r.extraReps, rpe: r.extraRpe });
  }
  if (r.seriesValidas === 4 && r.serie4Kg && r.serie4Reps && r.serie4Kg > 0 && r.serie4Reps > 0) {
    linhas.push({ label: "Série 4", kg: r.serie4Kg, reps: r.serie4Reps, rpe: r.serie4Rpe });
  }
  return linhas;
}
