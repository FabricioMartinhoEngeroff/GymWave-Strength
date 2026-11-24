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

/** Faixa de esforço com as duas pontas válidas, da menor para a maior. */
export function faixaValida(v: unknown): v is FaixaRpe {
  if (!Array.isArray(v) || v.length !== 2) return false;
  const [min, max] = v.map(normalizarRpe);
  return min !== undefined && max !== undefined && min <= max;
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

/** Só os números do alvo. Ex.: "7–8" em RPE, "2–3" em RIR. */
export function faixaAlvo([min, max]: FaixaRpe, escala: EscalaEsforco): string {
  const pontas = (escala === "RIR" ? [max, min] : [min, max]).map((rpe) => rotuloChip(rpe, escala));
  return [...new Set(pontas)].join("–");
}

/** Ex.: "RPE 7–8" ou "RIR 2–3". */
export function rotuloAlvo(alvo: FaixaRpe, escala: EscalaEsforco): string {
  return `${escala} ${faixaAlvo(alvo, escala)}`;
}

/** O limite é o valor de cima do alvo. */
export function passouDoAlvo(rpe: number, [, max]: FaixaRpe): boolean {
  return rpe > max;
}

/** Progressão pelo esforço: bateu o teto de reps sem passar do alvo. Sem RPE (registro antigo), vale só o teto. */
export function deveSubirPeso(bateuTeto: boolean, rpe: number | null | undefined, alvo: FaixaRpe): boolean {
  return bateuTeto && (rpe == null || !passouDoAlvo(rpe, alvo));
}

// ─── Alertas (fadiga e regressão) ─────────────────────────────────────────────

const DIA_MS = 24 * 60 * 60 * 1000;
/** Valem para os dois alertas: mudar aqui muda a fadiga e a regressão juntas. */
const ALERTA_JANELA_DIAS = 42;
export const ALERTA_MIN_DIAS = 10; // pelo menos duas semanas de treino, mesmo com o dia variando
const FADIGA_MIN_ALTA = 1;
const REGRESSAO_MIN_TREINOS = 3;
const REGRESSAO_RPE_MIN = 9;

interface TopSet {
  ts: number;
  reps: number;
  rpe: number;
}

const diasEntre = (antigo: TopSet, recente: TopSet) => (recente.ts - antigo.ts) / DIA_MS;

/**
 * Top Sets 1 comparáveis, do mais recente para o mais antigo: mesma carga, com RPE, sem
 * Cluster Set e só depois do último deload (um deload zera a contagem).
 * A carga de referência é a do último treino da sessão (ou do exercício, se a
 * sessão ainda não tem histórico).
 */
function topSetsNaMesmaCarga(registros: RegistroExercicio[], treinoId: string): { kg: number; topSets: TopSet[] } | null {
  const recentes = registros
    .filter((r) => r.tecnica !== "RP" && r.topSetKg > 0)
    .sort((a, b) => b.dataTs - a.dataTs);
  const deload = recentes.findIndex((r) => r.isDeload);
  const ciclo = deload === -1 ? recentes : recentes.slice(0, deload);

  const referencia = ciclo.find((r) => r.treinoId === treinoId) ?? ciclo[0];
  if (!referencia) return null;
  const topSets = ciclo.flatMap((r) =>
    r.topSetKg === referencia.topSetKg && r.topSetRpe !== undefined
      ? [{ ts: r.dataTs, reps: r.topSetReps, rpe: r.topSetRpe }]
      : [],
  );
  return { kg: referencia.topSetKg, topSets };
}

/** Anda para trás a partir do último treino, dentro da janela, enquanto `continua` aceitar o treino anterior. */
function sequenciaAteOUltimo(topSets: TopSet[], continua: (anterior: TopSet, seguinte: TopSet) => boolean): TopSet[] {
  const [ultimo, ...anteriores] = topSets;
  if (!ultimo) return [];
  const sequencia = [ultimo];
  let seguinte = ultimo;
  for (const anterior of anteriores) {
    if (diasEntre(anterior, ultimo) > ALERTA_JANELA_DIAS || !continua(anterior, seguinte)) break;
    sequencia.push(anterior);
    seguinte = anterior;
  }
  return sequencia;
}

export interface Fadiga {
  kg: number;
  rpeInicial: number;
  rpeAtual: number;
  treinos: number;
}

/**
 * Mesma carga e reps no Top Set 1 custando mais esforço, acima do alvo (ou na falha),
 * nos 2 últimos treinos: um dia ruim sozinho não alerta (RG22).
 */
export function detectarFadiga(registros: RegistroExercicio[], treinoId: string, alvo: FaixaRpe): Fadiga | null {
  const comparaveis = topSetsNaMesmaCarga(registros, treinoId);
  if (!comparaveis) return null;

  const sequencia = sequenciaAteOUltimo(
    comparaveis.topSets,
    (anterior, seguinte) => anterior.reps === seguinte.reps && anterior.rpe <= seguinte.rpe,
  );
  const [ultimo, penultimo] = sequencia;
  const primeiro = sequencia[sequencia.length - 1];
  if (!ultimo || !penultimo || !primeiro) return null;

  const { rpe: rpeInicial } = primeiro;
  const pesouMais = (rpe: number) =>
    rpe - rpeInicial >= FADIGA_MIN_ALTA && (passouDoAlvo(rpe, alvo) || rpe === RPE_MAX);

  const houveFadiga =
    pesouMais(ultimo.rpe) && pesouMais(penultimo.rpe) && diasEntre(primeiro, ultimo) >= ALERTA_MIN_DIAS;
  return houveFadiga ? { kg: comparaveis.kg, rpeInicial, rpeAtual: ultimo.rpe, treinos: sequencia.length } : null;
}

export interface Regressao {
  kg: number;
  /** Reps de cada treino da sequência, do mais antigo para o mais recente. */
  reps: number[];
}

/** Mesma carga no Top Set 1 com reps caindo em 2 treinos seguidos e esforço alto nos 2 últimos (RG30). */
export function detectarRegressao(registros: RegistroExercicio[], treinoId: string): Regressao | null {
  const comparaveis = topSetsNaMesmaCarga(registros, treinoId);
  if (!comparaveis) return null;

  const sequencia = sequenciaAteOUltimo(
    comparaveis.topSets.filter((t) => t.reps > 0),
    (anterior, seguinte) => anterior.reps > seguinte.reps,
  );
  const [ultimo, penultimo] = sequencia;
  const primeiro = sequencia[sequencia.length - 1];
  if (!ultimo || !penultimo || !primeiro) return null;

  const houveRegressao =
    sequencia.length >= REGRESSAO_MIN_TREINOS &&
    ultimo.rpe >= REGRESSAO_RPE_MIN && penultimo.rpe >= REGRESSAO_RPE_MIN &&
    diasEntre(primeiro, ultimo) >= ALERTA_MIN_DIAS;
  return houveRegressao ? { kg: comparaveis.kg, reps: sequencia.map((t) => t.reps).reverse() } : null;
}
