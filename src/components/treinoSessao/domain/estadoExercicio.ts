import type { ExercicioSessao } from "../../../data/sessionExercises";
import type { RegistroExercicio, SeriesValidas } from "../../../types/TrainingData";
import { deveSubirPeso, normalizarRpe } from "../../../utils/esforco";
import { normalizarSeriesValidas, sugestaoDoUltimoTreino } from "../../../utils/seriesValidas";

export interface BlocoCluster {
  kg: string;
  reps: string;
}

export interface ExerciseState {
  topSetKg: string;
  topSetReps: string;
  backoffKg: string;
  backoffReps: string;
  extraKg: string;
  extraReps: string;
  serie4Kg: string;
  serie4Reps: string;

  // ── Esforço (RPE) — nunca vem do último treino ──────────────────────────
  topSetRpe: number | null;
  backoffRpe: number | null;
  extraRpe: number | null;
  serie4Rpe: number | null;
  clusterRpe: number | null;
  clusterRpe2: number | null;

  seriesValidas: SeriesValidas;
  topSetConfirmed: boolean;
  backoffConfirmed: boolean;
  tecnica: "RP" | null;
  clusterSeries: BlocoCluster[];
  clusterSeries2: BlocoCluster[];
  clusterActiveSerie: 1 | 2;
  tecnicaConfirmed: boolean;

  // ── Meta ─────────────────────────────────────────────────────────────────
  obs: string;
  skipped: boolean;
  prConfirmado: boolean;
  isDeload: boolean;

  // ── Suggestion flags (blue-border visual hint) ───────────────────────────
  topSetKgIsSuggestion: boolean;
  topSetRepsSuggestion: boolean;
  backoffKgIsSuggestion: boolean;
  backoffRepsSuggestion: boolean;
  extraKgIsSuggestion: boolean;
  extraRepsSuggestion: boolean;
  serie4KgIsSuggestion: boolean;
  serie4RepsSuggestion: boolean;

  // ── Edit guards (prevent auto-fill from overwriting) ─────────────────────
  backoffKgWasUserEdited: boolean;
  extraKgWasUserEdited: boolean;
}

/** Patch parcial aplicado sobre o estado de um exercício. */
export type PatchExercicio = Partial<ExerciseState>;

const RPE_VAZIO = {
  topSetRpe: null,
  backoffRpe: null,
  extraRpe: null,
  serie4Rpe: null,
  clusterRpe: null,
  clusterRpe2: null,
};

/** Returns a blank ExerciseState with all suggestion flags off. */
export function emptyExerciseState(): ExerciseState {
  return {
    topSetKg: "",
    topSetReps: "",
    backoffKg: "",
    backoffReps: "",
    extraKg: "",
    extraReps: "",
    serie4Kg: "",
    serie4Reps: "",
    ...RPE_VAZIO,
    seriesValidas: 2,
    topSetConfirmed: false,
    backoffConfirmed: false,
    tecnica: null,
    clusterSeries: [],
    clusterSeries2: [],
    clusterActiveSerie: 1,
    tecnicaConfirmed: false,
    obs: "",
    skipped: false,
    topSetKgIsSuggestion: false,
    topSetRepsSuggestion: false,
    backoffKgIsSuggestion: false,
    backoffRepsSuggestion: false,
    backoffKgWasUserEdited: false,
    extraKgIsSuggestion: false,
    extraRepsSuggestion: false,
    extraKgWasUserEdited: false,
    serie4KgIsSuggestion: false,
    serie4RepsSuggestion: false,
    prConfirmado: false,
    isDeload: false,
  };
}

const texto = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const objeto = (v: unknown): Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const paraBlocos = (v: unknown): BlocoCluster[] =>
  Array.isArray(v) ? v.map(objeto).map((b) => ({ kg: texto(b.kg), reps: texto(b.reps) })) : [];

/** Completa um rascunho antigo ou estragado: campo de tipo inesperado volta ao padrão. */
export function sanitizeExerciseState(bruto: unknown): ExerciseState {
  const raw = objeto(bruto);
  const base = emptyExerciseState();
  const rpes = Object.keys(RPE_VAZIO) as (keyof typeof RPE_VAZIO)[];
  const saida: Record<string, unknown> = { ...base };
  for (const [campo, padrao] of Object.entries(base)) {
    const v = raw[campo];
    if (typeof padrao === "string") saida[campo] = texto(v);
    else if (typeof padrao === "boolean") saida[campo] = v === true;
  }
  return {
    ...(saida as unknown as ExerciseState),
    ...(Object.fromEntries(rpes.map((c) => [c, normalizarRpe(raw[c]) ?? null])) as typeof RPE_VAZIO),
    tecnica: raw.tecnica === "RP" ? "RP" : null,
    clusterSeries: paraBlocos(raw.clusterSeries),
    clusterSeries2: paraBlocos(raw.clusterSeries2),
    clusterActiveSerie: raw.clusterActiveSerie === 2 ? 2 : 1,
    seriesValidas: normalizarSeriesValidas(raw.seriesValidas),
  };
}

// ─── Sugestão do último treino ────────────────────────────────────────────────

/** Campos do último treino com flags de sugestão e travas dos espelhos. */
export function estadoDoUltimoTreino(
  ultimo: RegistroExercicio,
  seriesValidas: SeriesValidas,
  backoffPct: number,
): PatchExercicio {
  const { backoffKgDoLogbook, extraKgDoLogbook, ...valores } = sugestaoDoUltimoTreino(ultimo, seriesValidas, backoffPct);
  return {
    ...valores,
    topSetKgIsSuggestion: valores.topSetKg !== "",
    topSetRepsSuggestion: valores.topSetReps !== "",
    backoffKgIsSuggestion: valores.backoffKg !== "",
    backoffRepsSuggestion: valores.backoffReps !== "",
    extraKgIsSuggestion: valores.extraKg !== "",
    extraRepsSuggestion: valores.extraReps !== "",
    serie4KgIsSuggestion: valores.serie4Kg !== "",
    serie4RepsSuggestion: valores.serie4Reps !== "",
    backoffKgWasUserEdited: backoffKgDoLogbook,
    extraKgWasUserEdited: extraKgDoLogbook,
  };
}

/** Estado inicial do exercício: peso e reps do logbook voltam exatamente como foram salvos. */
export function estadoInicial(ex: ExercicioSessao, ultimo: RegistroExercicio | null): ExerciseState {
  return {
    ...emptyExerciseState(),
    seriesValidas: ex.seriesValidas,
    ...(ultimo && estadoDoUltimoTreino(ultimo, ex.seriesValidas, ex.backoffPct)),
  };
}

const TOP_SET_1_VAZIO = {
  topSetKg: "",
  topSetReps: "",
  topSetKgIsSuggestion: false,
  topSetRepsSuggestion: false,
} satisfies PatchExercicio;

const TOP_SET_2_VAZIO = {
  backoffKg: "",
  backoffReps: "",
  backoffKgIsSuggestion: false,
  backoffRepsSuggestion: false,
  backoffKgWasUserEdited: false,
} satisfies PatchExercicio;

/** Valores do logbook só para os campos pedidos (as chaves de `campos`). */
function camposDoLogbook<T extends PatchExercicio>(
  campos: T,
  state: ExerciseState,
  ex: ExercicioSessao,
  ultimo: RegistroExercicio | null,
): PatchExercicio {
  if (!ultimo) return campos;
  const doLogbook = estadoDoUltimoTreino(ultimo, state.seriesValidas, ex.backoffPct);
  const chaves = Object.keys(campos) as (keyof ExerciseState)[];
  return Object.fromEntries(chaves.map((c) => [c, doLogbook[c]])) as PatchExercicio;
}

// ─── Espelho de peso ──────────────────────────────────────────────────────────

/**
 * Pesos que acompanham o Top Set 1 durante o treino (null = nada a mudar).
 *
 * Top Set 2 (slot "backoff" no modelo v6) usa sempre o mesmo peso do Top Set 1.
 * O espelho trava quando o usuário digita um valor próprio, quando o peso veio
 * salvo do logbook (backoffKgWasUserEdited) ou quando o bloco é confirmado.
 *
 * Back-off (slot "extra") = Top Set 1 × backoffPct (~90%), só com 3 válidas. Trava
 * do mesmo jeito (extraKgWasUserEdited): o cálculo só vale sem histórico.
 */
export function espelharPesos(state: ExerciseState, ex: ExercicioSessao): PatchExercicio | null {
  if (state.isDeload || state.tecnica) return null;
  const topKg = parseFloat(state.topSetKg);
  if (isNaN(topKg) || topKg <= 0) return null;

  const patch: PatchExercicio = {};
  const top2 = String(topKg);
  if (!state.backoffKgWasUserEdited && !state.backoffConfirmed && state.backoffKg !== top2) {
    Object.assign(patch, { backoffKg: top2, backoffKgIsSuggestion: true });
  }
  const backoff = String(Math.round(topKg * ex.backoffPct));
  if (state.seriesValidas === 3 && !state.extraKgWasUserEdited && state.extraKg !== backoff) {
    Object.assign(patch, { extraKg: backoff, extraKgIsSuggestion: true });
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

/** 4 válidas sem histórico: Série 3 e 4 partem do Top Set 1 confirmado (mesma carga e reps). */
export function seriesExtrasDoTopSet(state: ExerciseState, kg: number, reps: number): PatchExercicio {
  if (state.seriesValidas !== 4 || state.isDeload || state.tecnica || state.extraKgWasUserEdited) return {};
  return {
    ...(state.extraKg === "" && { extraKg: String(kg), extraKgIsSuggestion: true }),
    ...(state.extraReps === "" && { extraReps: String(reps), extraRepsSuggestion: true }),
    ...(state.serie4Kg === "" && { serie4Kg: String(kg), serie4KgIsSuggestion: true }),
    ...(state.serie4Reps === "" && { serie4Reps: String(reps), serie4RepsSuggestion: true }),
  };
}

// ─── Troca de modo (Cluster Set / Deload) ─────────────────────────────────────

/** Blocos vazios do Cluster Set (padrão 4; o plano pode pedir mais, ex.: 24 reps em blocos de 4 → 6). */
export function blocosVazios(n = 4): BlocoCluster[] {
  return Array.from({ length: n }, () => ({ kg: "", reps: "" }));
}

const CLUSTER_VAZIO = {
  tecnica: null,
  clusterSeries: [],
  clusterSeries2: [],
  clusterActiveSerie: 1,
  tecnicaConfirmed: false,
} satisfies PatchExercicio;

export function ativarCluster(state: ExerciseState, ex: ExercicioSessao): PatchExercicio {
  return {
    ...TOP_SET_1_VAZIO,
    ...TOP_SET_2_VAZIO,
    ...CLUSTER_VAZIO,
    ...RPE_VAZIO,
    tecnica: "RP",
    isDeload: false,
    clusterSeries: blocosVazios(ex.clusterBlocos),
    clusterSeries2: state.seriesValidas === 1 ? [] : blocosVazios(ex.clusterBlocos),
    topSetConfirmed: false,
    backoffConfirmed: false,
  };
}

/** Sai do Cluster e devolve os Top Sets do último treino (ou limpos, sem histórico). */
export function desativarCluster(state: ExerciseState, ex: ExercicioSessao, ultimo: RegistroExercicio | null): PatchExercicio {
  return {
    ...CLUSTER_VAZIO,
    ...RPE_VAZIO,
    topSetConfirmed: false,
    backoffConfirmed: false,
    ...camposDoLogbook({ ...TOP_SET_1_VAZIO, ...TOP_SET_2_VAZIO }, state, ex, ultimo),
  };
}

/** Deload vale só o Top Set 1, que mantém o que já tinha (vindo do Cluster, volta o do último treino). */
export function ativarDeload(state: ExerciseState, ex: ExercicioSessao, ultimo: RegistroExercicio | null): PatchExercicio {
  return {
    ...CLUSTER_VAZIO,
    ...TOP_SET_2_VAZIO,
    ...RPE_VAZIO,
    ...(state.tecnica && camposDoLogbook(TOP_SET_1_VAZIO, state, ex, ultimo)),
    isDeload: true,
    backoffConfirmed: false,
    prConfirmado: false,
  };
}

/** Sai do Deload: TS2 volta com o peso e as reps do último treino (sem histórico, espelha o TS1). */
export function desativarDeload(state: ExerciseState, ex: ExercicioSessao, ultimo: RegistroExercicio | null): PatchExercicio {
  return {
    isDeload: false,
    backoffConfirmed: false,
    ...camposDoLogbook(TOP_SET_2_VAZIO, state, ex, ultimo),
  };
}

// ─── Consultas ────────────────────────────────────────────────────────────────

export function serieValida(kg: string, reps: string): boolean {
  return parseFloat(kg) > 0 && parseFloat(reps) > 0;
}

export function blocoValido(b: BlocoCluster): boolean {
  return parseFloat(b.kg) > 0 && parseInt(b.reps) > 0;
}

export function serieClusterTemBloco(blocos: BlocoCluster[]): boolean {
  return blocos.some(blocoValido);
}

export function volumeBlocos(blocos: BlocoCluster[]): number {
  return blocos.reduce((sum, b) => sum + (parseFloat(b.kg) || 0) * (parseInt(b.reps) || 0), 0);
}

/** Cluster Set tem 2 séries (1 quando o exercício tem 1 válida); cada uma precisa de um bloco válido. */
export function clusterCompleto(state: ExerciseState): boolean {
  if (!state.tecnica) return false;
  return serieClusterTemBloco(state.clusterSeries) && (state.seriesValidas === 1 || serieClusterTemBloco(state.clusterSeries2));
}

export function topSetFeito(state: ExerciseState): boolean {
  return state.topSetConfirmed && serieValida(state.topSetKg, state.topSetReps);
}

export function topSet2Feito(state: ExerciseState): boolean {
  return state.backoffConfirmed && serieValida(state.backoffKg, state.backoffReps);
}

/** O atleta apagou ou zerou peso e reps do Top Set 2: "não fiz" (RG24). */
export function topSet2NaoFeito(state: ExerciseState): boolean {
  return state.backoffKgWasUserEdited && !(parseFloat(state.backoffKg) > 0) && !(parseFloat(state.backoffReps) > 0);
}

/** O Top Set 2 não existe em Deload nem com 1 válida. */
export function temTopSet2(state: ExerciseState): boolean {
  return !state.isDeload && state.seriesValidas !== 1;
}

export function exercicioConcluido(state: ExerciseState | undefined): boolean {
  if (!state) return false;
  if (state.skipped) return true;
  if (state.tecnica) return state.tecnicaConfirmed;
  return topSetFeito(state) && (!temTopSet2(state) || topSet2Feito(state) || topSet2NaoFeito(state));
}

/** O atleta fez algo: digitou, confirmou, pulou, anotou, marcou esforço ou trocou de modo. Só sugestão não conta. */
export function temProgresso(s: ExerciseState): boolean {
  const digitados: [string, boolean][] = [
    [s.topSetKg, s.topSetKgIsSuggestion], [s.topSetReps, s.topSetRepsSuggestion],
    [s.backoffKg, s.backoffKgIsSuggestion], [s.backoffReps, s.backoffRepsSuggestion],
    [s.extraKg, s.extraKgIsSuggestion], [s.extraReps, s.extraRepsSuggestion],
    [s.serie4Kg, s.serie4KgIsSuggestion], [s.serie4Reps, s.serie4RepsSuggestion],
  ];
  return (
    s.topSetConfirmed || s.backoffConfirmed || s.tecnicaConfirmed || s.skipped || s.isDeload || s.obs !== "" ||
    digitados.some(([valor, sugerido]) => valor !== "" && !sugerido) ||
    (Object.keys(RPE_VAZIO) as (keyof typeof RPE_VAZIO)[]).some((c) => s[c] !== null) ||
    [...s.clusterSeries, ...s.clusterSeries2].some((b) => b.kg !== "" || b.reps !== "")
  );
}

/** "consolidar" = teto batido, mas com esforço alto demais para subir (RG21). */
export type StatusTopSet = "teto" | "consolidar" | "abaixo" | "faixa" | null;

export function statusTopSet(ex: ExercicioSessao, state: ExerciseState): StatusTopSet {
  if (!state.topSetConfirmed || state.isDeload) return null;
  const reps = parseInt(state.topSetReps);
  if (isNaN(reps)) return null;
  if (reps >= ex.faixaTopSet[1]) return deveSubirPeso(true, state.topSetRpe) ? "teto" : "consolidar";
  if (reps < ex.faixaTopSet[0]) return "abaixo";
  return "faixa";
}
