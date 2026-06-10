import { MUSCLE_MAP } from "../data/muscleMap";
import type { DadosTreino } from "../types/TrainingData";

export interface VolumeMusculo {
  musculo: string;
  volumeAtual: number;
  volumeAnterior: number;
  delta: number; // percentage change, 0 if no previous data
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

export function calcVolumeLoad(): VolumeMusculo[] {
  const db = JSON.parse(
    localStorage.getItem("dadosTreino") || "{}"
  ) as DadosTreino;

  const thisWeek = getISOWeekBounds(0);
  const lastWeek = getISOWeekBounds(1);

  const musculoAtual: Record<string, number> = {};
  const musculoAnterior: Record<string, number> = {};

  Object.entries(db).forEach(([exercicio, ciclos]) => {
    const musculo = MUSCLE_MAP[exercicio];
    if (!musculo) return;

    Object.values(ciclos).forEach((reg) => {
      if (!reg.data || !reg.pesos) return;
      const ts = parseDateBR(reg.data);
      if (!ts) return;
      const vol = calcVolumeEntry(reg.pesos || [], reg.reps || []);
      if (vol <= 0) return;

      if (ts >= thisWeek.start && ts <= thisWeek.end) {
        musculoAtual[musculo] = (musculoAtual[musculo] || 0) + vol;
      } else if (ts >= lastWeek.start && ts <= lastWeek.end) {
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
    result.push({ musculo, volumeAtual: atual, volumeAnterior: anterior, delta });
  });

  return result.sort((a, b) => b.volumeAtual - a.volumeAtual);
}

export function calcTotalVolumeWeek(): number {
  return calcVolumeLoad().reduce((sum, m) => sum + m.volumeAtual, 0);
}
