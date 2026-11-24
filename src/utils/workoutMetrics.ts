import type { DadosTreino, RegistroTreino, Logbook, RegistroExercicio } from "../types/TrainingData";
import { parseDataBR } from "./datas";
import { carregarLogbookCompleto } from "./storage";

export type SessionPoint = {
  ts: number;
  data: string; // "DD/MM/YYYY"
  exercicio: string;
  topSetPeso: number;
  topSetReps: number;
  backoff1Peso: number;
  backoff1Reps: number;
  backoff2Peso: number;
  backoff2Reps: number;
};

function toNumArray(arr: string[] | undefined): number[] {
  return (arr ?? []).map((v) => Number(String(v).trim())).map((n) => (Number.isFinite(n) ? n : 0));
}

function firstNonZeroIndex(nums: number[]): number {
  const idx = nums.findIndex((n) => n > 0);
  return idx >= 0 ? idx : 0;
}

export function computeSessionPoint(
  exercicio: string,
  reg: RegistroTreino
): SessionPoint | null {
  const ts = parseDataBR(reg.data);
  if (ts === null) return null;

  const pesosAll = toNumArray(reg.pesos);
  const repsAll = toNumArray(reg.reps);
  if (pesosAll.every((p) => p <= 0)) return null;

  const topIdx = firstNonZeroIndex(pesosAll);
  const topSetPeso = pesosAll[topIdx] || 0;
  const topSetReps = repsAll[topIdx] || 0;
  const backoff1Peso = pesosAll[topIdx + 1] || 0;
  const backoff1Reps = repsAll[topIdx + 1] || 0;
  const backoff2Peso = pesosAll[topIdx + 2] || 0;
  const backoff2Reps = repsAll[topIdx + 2] || 0;

  return {
    ts,
    data: reg.data,
    exercicio,
    topSetPeso,
    topSetReps,
    backoff1Peso,
    backoff1Reps,
    backoff2Peso,
    backoff2Reps,
  };
}

export function buildExerciseHistory(db: DadosTreino): Record<string, SessionPoint[]> {
  const out: Record<string, SessionPoint[]> = {};

  Object.entries(db).forEach(([exercicio, ciclos]) => {
    const porDia = new Map<number, SessionPoint>();

    Object.values(ciclos).forEach((reg) => {
      const point = computeSessionPoint(exercicio, reg);
      if (!point) return;

      const atual = porDia.get(point.ts);
      const melhor =
        !atual ||
        point.topSetPeso > atual.topSetPeso ||
        (point.topSetPeso === atual.topSetPeso && point.topSetReps > atual.topSetReps);
      if (melhor) {
        porDia.set(point.ts, point);
      }
    });

    out[exercicio] = [...porDia.values()].sort((a, b) => a.ts - b.ts);
  });

  return out;
}

// ── New logbook-based history ────────────────────────────────────────────────

export interface LogbookPoint {
  ts: number;
  data: string;
  exercicio: string;
  topSetKg: number;
  topSetReps: number;
  backoffKg: number;
  backoffReps: number;
  bateuTeto: boolean;
  progrediu: boolean;
}

export function buildLogbookHistory(logbook?: Logbook): Record<string, LogbookPoint[]> {
  const lb: Logbook = logbook ?? carregarLogbookCompleto();
  const out: Record<string, LogbookPoint[]> = {};

  Object.entries(lb).forEach(([exercicio, registros]) => {
    out[exercicio] = registros
      .filter((r) => r.topSetKg > 0)
      .map((r: RegistroExercicio) => ({
        ts: r.dataTs,
        data: r.data,
        exercicio: r.exercicio,
        topSetKg: r.topSetKg,
        topSetReps: r.topSetReps,
        backoffKg: r.backoffKg,
        backoffReps: r.backoffReps,
        bateuTeto: r.topSetBateuTeto,
        progrediu: r.progrediu,
      }))
      .sort((a, b) => a.ts - b.ts);
  });

  return out;
}
