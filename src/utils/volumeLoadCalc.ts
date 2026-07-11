import { MUSCLE_MAP } from "../data/muscleMap";
import type { DadosTreino, Logbook } from "../types/TrainingData";

export interface VolumeMusculo {
  musculo: string;
  volumeAtual: number;
  volumeAnterior: number;
  delta: number; // percentage change, 0 if no previous data
  seriesAtual: number; // total valid sets this period
}

function getISOWeekBounds(weeksAgo: number): { start: number; end: number } {
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon, 7=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek - 1) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.getTime(), end: sunday.getTime() };
}

function getMonthBounds(monthsAgo: number): { start: number; end: number } {
  const now = new Date();
  const month = now.getMonth() - monthsAgo;
  const year = now.getFullYear();
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function parseDateBR(data: string): number | null {
  const parts = data.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d).getTime();
}

function calcVolumeEntry(pesos: string[], reps: string[]): number {
  let total = 0;
  for (let i = 0; i < pesos.length; i++) {
    const p = parseFloat(pesos[i]) || 0;
    const r = parseFloat(reps[i]) || 0;
    total += p * r;
  }
  return total;
}

function countValidSets(pesos: string[], reps: string[]): number {
  let count = 0;
  for (let i = 0; i < pesos.length; i++) {
    const p = parseFloat(pesos[i]) || 0;
    const r = parseFloat(reps[i]) || 0;
    if (p > 0 && r > 0) count++;
  }
  return count;
}

export function calcVolumeLoad(granularity: "week" | "month" = "week"): VolumeMusculo[] {
  const db = JSON.parse(
    localStorage.getItem("dadosTreino") || "{}"
  ) as DadosTreino;

  const logbook = JSON.parse(
    localStorage.getItem("logbook") || "{}"
  ) as Logbook;

  const current = granularity === "month" ? getMonthBounds(0) : getISOWeekBounds(0);
  const previous = granularity === "month" ? getMonthBounds(1) : getISOWeekBounds(1);

  const musculoAtual: Record<string, number> = {};
  const musculoAnterior: Record<string, number> = {};
  const musculoSeries: Record<string, number> = {};

  // Process legacy dadosTreino
  Object.entries(db).forEach(([exercicio, ciclos]) => {
    const musculo = MUSCLE_MAP[exercicio];
    if (!musculo) return;

    Object.values(ciclos).forEach((reg) => {
      if (!reg.data || !reg.pesos) return;
      const ts = parseDateBR(reg.data);
      if (!ts) return;
      const vol = calcVolumeEntry(reg.pesos || [], reg.reps || []);
      if (vol <= 0) return;

      if (ts >= current.start && ts <= current.end) {
        musculoAtual[musculo] = (musculoAtual[musculo] || 0) + vol;
        musculoSeries[musculo] = (musculoSeries[musculo] || 0) + countValidSets(reg.pesos || [], reg.reps || []);
      } else if (ts >= previous.start && ts <= previous.end) {
        musculoAnterior[musculo] = (musculoAnterior[musculo] || 0) + vol;
      }
    });
  });

  // Process logbook (new format)
  Object.entries(logbook).forEach(([exercicio, registros]) => {
    const musculo = MUSCLE_MAP[exercicio];
    if (!musculo) return;

    registros.forEach((reg) => {
      const ts = reg.dataTs;
      if (!ts) return;

      let vol = 0;
      let sets = 0;

      if (reg.clusterSeries && reg.clusterSeries.length > 0) {
        reg.clusterSeries.forEach((b) => {
          if (b.kg > 0 && b.reps > 0) { vol += b.kg * b.reps; sets++; }
        });
      } else {
        vol = reg.topSetKg * reg.topSetReps + reg.backoffKg * reg.backoffReps +
          ((reg.seriesValidas === 3 && reg.extraKg && reg.extraReps) ? reg.extraKg * reg.extraReps : 0);
        if (reg.topSetKg > 0 && reg.topSetReps > 0) sets++;
        if (reg.backoffKg > 0 && reg.backoffReps > 0) sets++;
        if (reg.seriesValidas === 3 && reg.extraKg && reg.extraKg > 0 && reg.extraReps && reg.extraReps > 0) sets++;
      }
      if (vol <= 0) return;

      if (ts >= current.start && ts <= current.end) {
        musculoAtual[musculo] = (musculoAtual[musculo] || 0) + vol;
        musculoSeries[musculo] = (musculoSeries[musculo] || 0) + sets;
      } else if (ts >= previous.start && ts <= previous.end) {
        musculoAnterior[musculo] = (musculoAnterior[musculo] || 0) + vol;
      }
    });
  });

  const musculos = new Set([
    ...Object.keys(musculoAtual),
    ...Object.keys(musculoAnterior),
  ]);

  const result: VolumeMusculo[] = [];
  musculos.forEach((musculo) => {
    const atual = musculoAtual[musculo] || 0;
    const anterior = musculoAnterior[musculo] || 0;
    const delta =
      anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : 0;
    const seriesAtual = musculoSeries[musculo] || 0;
    result.push({ musculo, volumeAtual: atual, volumeAnterior: anterior, delta, seriesAtual });
  });

  return result.sort((a, b) => b.volumeAtual - a.volumeAtual);
}

export function calcTotalVolumeWeek(): number {
  return calcVolumeLoad().reduce((sum, m) => sum + m.volumeAtual, 0);
}

// Returns the Monday (00:00:00) timestamp of the ISO week containing `ts`
function getMondayOf(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

export function calcStreakSemanas(): number {
  const logbook = JSON.parse(
    localStorage.getItem("logbook") || "{}"
  ) as Logbook;

  const weekSet = new Set<number>();
  Object.values(logbook).forEach((registros) => {
    registros.forEach((reg) => {
      if (reg.dataTs) weekSet.add(getMondayOf(reg.dataTs));
    });
  });

  if (weekSet.size === 0) return 0;

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const weeks = Array.from(weekSet).sort((a, b) => b - a);

  let streak = 1;
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i - 1] - weeks[i] === WEEK_MS) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function calcEstagnadoMusculo(musculo: string): boolean {
  const logbook = JSON.parse(
    localStorage.getItem("logbook") || "{}"
  ) as Logbook;

  const exerciciosDoGrupo = Object.keys(MUSCLE_MAP).filter(
    (ex) => MUSCLE_MAP[ex] === musculo
  );

  let estagnados = 0;

  for (const exercicio of exerciciosDoGrupo) {
    const registros = logbook[exercicio];
    if (!registros || registros.length === 0) continue;

    const sorted = [...registros].sort((a, b) => b.dataTs - a.dataTs);

    let consecutivos = 0;
    for (const reg of sorted) {
      if (!reg.progrediu && !reg.topSetBateuTeto) {
        consecutivos++;
      } else {
        break;
      }
    }

    if (consecutivos >= 4) estagnados++;
  }

  return estagnados >= 2;
}

export function calcQuedaCargaMusculo(
  musculo: string,
  granularity: "week" | "month" = "week"
): boolean {
  const logbook = JSON.parse(
    localStorage.getItem("logbook") || "{}"
  ) as Logbook;

  const current = granularity === "month" ? getMonthBounds(0) : getISOWeekBounds(0);
  const previous = granularity === "month" ? getMonthBounds(1) : getISOWeekBounds(1);

  const exerciciosDoGrupo = Object.keys(MUSCLE_MAP).filter(
    (ex) => MUSCLE_MAP[ex] === musculo
  );

  let quedas = 0;

  for (const exercicio of exerciciosDoGrupo) {
    const registros = logbook[exercicio];
    if (!registros || registros.length === 0) continue;

    const currentPeriod = registros
      .filter((r) => r.dataTs >= current.start && r.dataTs <= current.end)
      .sort((a, b) => b.dataTs - a.dataTs);

    const previousPeriod = registros
      .filter((r) => r.dataTs >= previous.start && r.dataTs <= previous.end)
      .sort((a, b) => b.dataTs - a.dataTs);

    if (currentPeriod.length === 0 || previousPeriod.length === 0) continue;

    const tonnageAtual = currentPeriod[0].topSetKg * currentPeriod[0].topSetReps;
    const tonnageAnterior = previousPeriod[0].topSetKg * previousPeriod[0].topSetReps;

    if (tonnageAtual < tonnageAnterior) quedas++;
  }

  return quedas >= 2;
}
