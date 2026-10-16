import type { RegistroExercicio, SeriesValidas } from "../types/TrainingData";

// ─── Modelo de séries válidas ─────────────────────────────────────────────────
//   2 → Top Set 1 + Top Set 2
//   3 → Top Set 1 + Top Set 2 + Back-off (~90% da carga, slot "extra")
//   4 → Top Set 1 + Top Set 2 + Série 3 (slot "extra") + Série 4 — sem redução de carga

/** Converte o valor vindo de planilha, plano ou rascunho; qualquer coisa fora de 3/4 vira 2. */
export function normalizarSeriesValidas(v: unknown): SeriesValidas {
  const n = typeof v === "string" ? Number(v.trim()) : v;
  return n === 3 || n === 4 ? n : 2;
}

export interface SugestaoSeriesExtras {
  extraKg: string;
  extraReps: string;
  serie4Kg: string;
  serie4Reps: string;
}

const positivo = (n: number | undefined): n is number => typeof n === "number" && n > 0;

/**
 * Pré-preenchimento das séries além dos 2 Top Sets a partir do último treino.
 * 3 válidas: Back-off = Top Set 1 sugerido × backoffPct, reps do back-off anterior.
 * 4 válidas: Série 3 e 4 repetem peso e reps do último treino; se ele não tinha
 * essas séries (ex.: era 2 ou 3 válidas), usam o peso sugerido e as reps do Top Set 1.
 */
export function sugestaoSeriesExtras(
  ultimo: RegistroExercicio,
  topSetKgSugerido: number,
  seriesValidas: SeriesValidas,
  backoffPct: number,
): SugestaoSeriesExtras {
  const vazio = { extraKg: "", extraReps: "", serie4Kg: "", serie4Reps: "" };

  if (seriesValidas === 3) {
    return {
      ...vazio,
      extraKg: topSetKgSugerido > 0 ? String(Math.round(topSetKgSugerido * backoffPct)) : "",
      extraReps: positivo(ultimo.extraReps) ? String(ultimo.extraReps) : "",
    };
  }

  if (seriesValidas === 4) {
    const eraQuatro = ultimo.seriesValidas === 4;
    const kgPadrao = topSetKgSugerido > 0 ? String(topSetKgSugerido) : "";
    const repsPadrao = positivo(ultimo.topSetReps) ? String(ultimo.topSetReps) : "";
    const kg = (v: number | undefined) => (eraQuatro && positivo(v) ? String(v) : kgPadrao);
    const reps = (v: number | undefined) => (eraQuatro && positivo(v) ? String(v) : repsPadrao);
    return {
      extraKg: kg(ultimo.extraKg),
      extraReps: reps(ultimo.extraReps),
      serie4Kg: kg(ultimo.serie4Kg),
      serie4Reps: reps(ultimo.serie4Reps),
    };
  }

  return vazio;
}

/** Volume (kg × reps) e séries válidas de um registro fora do Cluster Set. */
export function volumeESeriesDoRegistro(reg: RegistroExercicio): { volume: number; series: number } {
  const slots: [number | undefined, number | undefined][] = [
    [reg.topSetKg, reg.topSetReps],
    [reg.backoffKg, reg.backoffReps],
  ];
  if (reg.seriesValidas === 3 || reg.seriesValidas === 4) slots.push([reg.extraKg, reg.extraReps]);
  if (reg.seriesValidas === 4) slots.push([reg.serie4Kg, reg.serie4Reps]);

  let volume = 0;
  let series = 0;
  for (const [kg, reps] of slots) {
    if (positivo(kg) && positivo(reps)) {
      volume += kg * reps;
      series++;
    }
  }
  return { volume, series };
}
