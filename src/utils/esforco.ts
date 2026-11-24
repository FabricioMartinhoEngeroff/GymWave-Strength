import type { RegistroExercicio } from "../types/TrainingData";

// ─── Esforço por série (RPE / RIR) ────────────────────────────────────────────
// O dado gravado é sempre RPE; RIR é só outra forma de ler: RIR = 10 − RPE.
// Obrigatório na série feita e nunca pré-preenchido: é a medida do treino de hoje.

export type EscalaEsforco = "RPE" | "RIR";

/** Faixa de esforço alvo, em RPE: [mínimo, máximo]. */
export type FaixaRpe = [number, number];

/** Opções da tela. 6 significa "6 ou menos" (4 ou mais reps na reserva). */
export const RPES: readonly number[] = [6, 7, 8, 9, 10];
const RPE_MIN = 6;
const RPE_MAX = 10;

/** Opções na ordem da escala: RPE ≤6 a 10; RIR 0 a 4+. */
export function opcoesDeEsforco(escala: EscalaEsforco): readonly number[] {
  return escala === "RIR" ? [...RPES].reverse() : RPES;
}

/** RPE válido (6 a 10) ou undefined. Meio ponto só existe em registros antigos e continua aceito. */
export function normalizarRpe(v: unknown): number | undefined {
  return typeof v === "number" && v >= RPE_MIN && v <= RPE_MAX && Number.isInteger(v * 2) ? v : undefined;
}

/** RPE que tem botão na tela; meio ponto de rascunho antigo volta vazio. */
export function rpeDaTela(v: unknown): number | null {
  return typeof v === "number" && RPES.includes(v) ? v : null;
}

export function rotuloChip(rpe: number, escala: EscalaEsforco): string {
  if (escala === "RIR") return rpe <= RPE_MIN ? "4+" : String(RPE_MAX - rpe);
  return rpe <= RPE_MIN ? "≤6" : String(rpe);
}

export function rotuloEsforco(rpe: number, escala: EscalaEsforco): string {
  return `${escala} ${rotuloChip(rpe, escala)}`;
}

/** Ex.: "RPE 7–8" ou "RIR 2–3". */
export function rotuloAlvo([min, max]: FaixaRpe, escala: EscalaEsforco): string {
  const pontas = (escala === "RIR" ? [max, min] : [min, max]).map((rpe) => rotuloChip(rpe, escala));
  return `${escala} ${[...new Set(pontas)].join("–")}`;
}

/** O limite é o valor de cima do alvo. */
export function passouDoAlvo(rpe: number, [, max]: FaixaRpe): boolean {
  return rpe > max;
}

/** Progressão pelo esforço: bateu o teto de reps sem passar do alvo. Sem RPE (registro antigo), vale só o teto. */
export function deveSubirPeso(bateuTeto: boolean, rpe: number | null | undefined, alvo: FaixaRpe): boolean {
  return bateuTeto && (rpe == null || !passouDoAlvo(rpe, alvo));
}

// ─── Fadiga ───────────────────────────────────────────────────────────────────

const DIA_MS = 24 * 60 * 60 * 1000;
const FADIGA_JANELA_DIAS = 42;
const FADIGA_MIN_DIAS = 10; // pelo menos duas semanas de treino, mesmo com o dia variando
const FADIGA_MIN_ALTA = 1;

export interface Fadiga {
  kg: number;
  rpeInicial: number;
  rpeAtual: number;
  treinos: number;
}

/**
 * Mesma carga e reps no Top Set 1 custando mais esforço, acima do alvo (ou na falha),
 * nos 2 últimos treinos: um dia ruim sozinho não alerta.
 * A carga de referência é a do último treino da sessão (ou do exercício, se a
 * sessão ainda não tem histórico). Um deload zera a contagem.
 */
export function detectarFadiga(registros: RegistroExercicio[], treinoId: string, alvo: FaixaRpe): Fadiga | null {
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

  // Anda para trás enquanto as reps forem as mesmas e o RPE não subir em relação ao treino seguinte.
  let primeiro = ultimo;
  let treinos = 1;
  for (const p of anteriores) {
    const foraDaJanela = ultimo.ts - p.ts > FADIGA_JANELA_DIAS * DIA_MS;
    if (foraDaJanela || p.rpe > primeiro.rpe || p.reps !== primeiro.reps) break;
    primeiro = p;
    treinos++;
  }

  const { rpe: rpeInicial } = primeiro;
  const pesouMais = (rpe: number) =>
    rpe - rpeInicial >= FADIGA_MIN_ALTA && (passouDoAlvo(rpe, alvo) || rpe === RPE_MAX);
  const penultimo = treinos > 1 ? anteriores[0] : undefined;

  const houveFadiga =
    pesouMais(ultimo.rpe) &&
    penultimo !== undefined && pesouMais(penultimo.rpe) &&
    ultimo.ts - primeiro.ts >= FADIGA_MIN_DIAS * DIA_MS;
  return houveFadiga ? { kg: referencia.topSetKg, rpeInicial, rpeAtual: ultimo.rpe, treinos } : null;
}
