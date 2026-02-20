import type { DadosTreino, RegistroTreino } from "../types/TrainingData";

export type SessionPoint = {
  ts: number;
  data: string; // "DD/MM/YYYY"
  exercicio: string;
  topSetPeso: number;
  topSetReps: number;
  tonnage: number; // soma(peso*reps) das séries válidas
  e1rm: number; // 1RM estimado (Epley) usando o Top Set
  rpe?: number;
  low: number;
  high: number;
  open: number;
  close: number;
};

export type PRIntervalPoint = {
  ts: number;
  data: string;
  dias: number;
  e1rm: number;
  topSetPeso: number;
  topSetReps: number;
  rpe?: number;
  alerta: "ok" | "plateau";
};

export function parseDataBRToTs(data: string): number | null {
  const [diaRaw, mesRaw, anoRaw] = data.split("/");
  const dia = Number(diaRaw);
  const mes = Number(mesRaw);
  const ano = Number(anoRaw);
  if (!dia || !mes || !ano) return null;
  const d = new Date(ano, mes - 1, dia);
  const ts = d.getTime();
  return Number.isNaN(ts) ? null : ts;
}

function toNumArray(arr: string[] | undefined): number[] {
  return (arr ?? []).map((v) => Number(String(v).trim())).map((n) => (Number.isFinite(n) ? n : 0));
}

function pickTopSetIndex(pesos: number[]): number {
  let idx = -1;
  let best = -Infinity;
  pesos.forEach((p, i) => {
    if (p > best) {
      best = p;
      idx = i;
    }
  });
  return idx;
}

function clampRPE(rpe: unknown): number | undefined {
  if (rpe === null || rpe === undefined || rpe === "") return undefined;
  const n = typeof rpe === "number" ? rpe : Number(String(rpe).trim());
  if (!Number.isFinite(n)) return undefined;
  const clamped = Math.min(10, Math.max(1, n));
  return Math.round(clamped * 2) / 2; // 0.5 steps
}

function epley1RM(peso: number, reps: number): number {
  if (!peso || !reps) return 0;
  return peso * (1 + reps / 30);
}

export function computeSessionPoint(
  exercicio: string,
  reg: RegistroTreino
): SessionPoint | null {
  const ts = parseDataBRToTs(reg.data);
  if (!ts) return null;

  const pesos = toNumArray(reg.pesos).filter((n) => n > 0);
  const reps = toNumArray(reg.reps);
  if (pesos.length === 0) return null;

  const pesosAll = toNumArray(reg.pesos);
  const topIdx = pickTopSetIndex(pesosAll);
  const topSetPeso = topIdx >= 0 ? pesosAll[topIdx] : Math.max(...pesosAll);
  const topSetReps = topIdx >= 0 ? reps[topIdx] || 0 : 0;

  const pares = pesosAll.map((p, i) => ({
    peso: p,
    rep: reps[i] || 0,
  }));
  const tonnage = pares.reduce((acc, s) => {
    if (!s.peso || !s.rep) return acc;
    return acc + s.peso * s.rep;
  }, 0);

  const validPesos = pesosAll.filter((p) => p > 0);
  const open = validPesos.length ? validPesos[0] : topSetPeso;
  const close = validPesos.length ? validPesos[validPesos.length - 1] : topSetPeso;
  const low = validPesos.length ? Math.min(...validPesos) : topSetPeso;
  const high = validPesos.length ? Math.max(...validPesos) : topSetPeso;

  return {
    ts,
    data: reg.data,
    exercicio,
    topSetPeso,
    topSetReps,
    tonnage,
    e1rm: epley1RM(topSetPeso, topSetReps),
    rpe: clampRPE((reg as any).rpe),
    low,
    high,
    open,
    close,
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
      if (!atual || point.e1rm > atual.e1rm) {
        porDia.set(point.ts, point);
      }
    });

    out[exercicio] = [...porDia.values()].sort((a, b) => a.ts - b.ts);
  });

  return out;
}

export function buildPRIntervals(
  sessions: SessionPoint[],
  plateauDays: number = 21,
  plateauRPE: number = 9
): PRIntervalPoint[] {
  let best = 0;
  let lastPRTs: number | null = null;
  const pr: PRIntervalPoint[] = [];

  sessions.forEach((s) => {
    if (s.e1rm <= 0) return;
    if (s.e1rm <= best) return;

    const dias =
      lastPRTs === null ? 0 : Math.round((s.ts - lastPRTs) / (24 * 60 * 60 * 1000));
    best = s.e1rm;
    lastPRTs = s.ts;

    const isPlateau = dias >= plateauDays && (s.rpe ?? 0) >= plateauRPE;
    pr.push({
      ts: s.ts,
      data: s.data,
      dias,
      e1rm: s.e1rm,
      topSetPeso: s.topSetPeso,
      topSetReps: s.topSetReps,
      rpe: s.rpe,
      alerta: isPlateau ? "plateau" : "ok",
    });
  });

  return pr;
}

