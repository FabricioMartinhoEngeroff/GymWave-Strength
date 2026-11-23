import type { RegistroExercicio } from "../types/TrainingData";

// ─── Esforço por série (RPE / RIR) ────────────────────────────────────────────
// O dado gravado é sempre RPE; RIR é só outra forma de ler: RIR = 10 − RPE.
// Opcional e nunca pré-preenchido: é a medida do treino de hoje.

export type EscalaEsforco = "RPE" | "RIR";

/** Opções da tela. 6 significa "6 ou menos" (4 ou mais reps na reserva). */
export const RPES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;
const RPE_MIN = 6;
const RPE_MAX = 10;

/** Teto de reps só manda subir a carga com RPE abaixo deste valor. */
export const RPE_LIMITE_SUBIR = 8;

/** RPE válido (6 a 10, de 0,5 em 0,5) ou undefined. */
export function normalizarRpe(v: unknown): number | undefined {
  return typeof v === "number" && v >= RPE_MIN && v <= RPE_MAX && Number.isInteger(v * 2) ? v : undefined;
}

export function rotuloChip(rpe: number, escala: EscalaEsforco): string {
  if (escala === "RIR") return rpe <= RPE_MIN ? "4+" : String(RPE_MAX - rpe);
  return rpe <= RPE_MIN ? "≤6" : String(rpe);
}

export function rotuloEsforco(rpe: number, escala: EscalaEsforco): string {
  return `${escala} ${rotuloChip(rpe, escala)}`;
}

/** Progressão pelo esforço: bateu o teto de reps com folga. Sem RPE, vale só o teto. */
export function deveSubirPeso(bateuTeto: boolean, rpe: number | null | undefined): boolean {
  return bateuTeto && (rpe == null || rpe < RPE_LIMITE_SUBIR);
}

// ─── Fadiga ───────────────────────────────────────────────────────────────────

const DIA_MS = 24 * 60 * 60 * 1000;
const FADIGA_JANELA_DIAS = 42;
const FADIGA_MIN_TREINOS = 3;
const FADIGA_MIN_DIAS = 10; // pelo menos duas semanas de treino, mesmo com o dia variando
const FADIGA_MIN_ALTA = 1;

export interface Fadiga {
  kg: number;
  rpeInicial: number;
  rpeAtual: number;
  treinos: number;
}

/**
 * Mesma carga no Top Set 1 custando um RPE cada vez maior, sem ganhar reps.
 * A carga de referência é a do último treino da sessão (ou do exercício, se a
 * sessão ainda não tem histórico). Um deload zera a contagem.
 */
export function detectarFadiga(registros: RegistroExercicio[], treinoId: string): Fadiga | null {
  // Do mais recente para o mais antigo, parando no último deload.
  const recentes = registros
    .filter((r) => r.tecnica !== "RP" && r.topSetKg > 0)
    .sort((a, b) => b.dataTs - a.dataTs);
  const deload = recentes.findIndex((r) => r.isDeload);
  const ciclo = deload === -1 ? recentes : recentes.slice(0, deload);

  const referencia = ciclo.find((r) => r.treinoId === treinoId) ?? ciclo[0];
  if (!referencia) return null;
  const [ultimo, ...anteriores] = ciclo.flatMap((r) =>
    r.topSetKg === referencia.topSetKg && r.topSetRpe !== undefined
      ? [{ ts: r.dataTs, reps: r.topSetReps, rpe: r.topSetRpe }]
      : [],
  );
  if (!ultimo) return null;

  // Anda para trás enquanto o RPE não subir e as reps não caírem em relação ao treino seguinte.
  let primeiro = ultimo;
  let treinos = 1;
  for (const p of anteriores) {
    const foraDaJanela = ultimo.ts - p.ts > FADIGA_JANELA_DIAS * DIA_MS;
    if (foraDaJanela || p.rpe > primeiro.rpe || p.reps < primeiro.reps) break;
    primeiro = p;
    treinos++;
  }

  const houveFadiga =
    treinos >= FADIGA_MIN_TREINOS &&
    ultimo.rpe - primeiro.rpe >= FADIGA_MIN_ALTA &&
    ultimo.ts - primeiro.ts >= FADIGA_MIN_DIAS * DIA_MS;
  return houveFadiga ? { kg: referencia.topSetKg, rpeInicial: primeiro.rpe, rpeAtual: ultimo.rpe, treinos } : null;
}
