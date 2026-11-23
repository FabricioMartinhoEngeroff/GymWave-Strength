/**
 * pendencias e conquistas → domain (EF_09 RG7, RG8, RG9)
 */
import { describe, it, expect } from "vitest";
import { pendenciasDoTreino } from "../../../../components/treinoSessao/domain/pendencias";
import { conquistasDoTreino } from "../../../../components/treinoSessao/domain/conquistas";
import { emptyExerciseState, sanitizeExerciseState, temProgresso, type ExerciseState } from "../../../../components/treinoSessao/domain/estadoExercicio";
import type { ExercicioSessao } from "../../../../data/sessionExercises";
import type { RegistroExercicio } from "../../../../types/TrainingData";

const ex = (nome: string): ExercicioSessao => ({
  nome, grupo: "", faixaTopSet: [5, 8], faixaBackoff: [8, 10], backoffPct: 0.9, seriesValidas: 2, cue: "",
});
const st = (over: Partial<ExerciseState> = {}): ExerciseState => ({ ...emptyExerciseState(), ...over });
const TOP1 = { topSetKg: "100", topSetReps: "7", topSetConfirmed: true };
const TOP2 = { backoffKg: "100", backoffReps: "6", backoffConfirmed: true };
const pend = (s: Partial<ExerciseState>) => pendenciasDoTreino([ex("Supino")], { Supino: st(s) });

describe("pendenciasDoTreino (RG8)", () => {
  it.each([
    ["completo", { ...TOP1, ...TOP2 }, []],
    ["não preenchido", {}, ["Supino: não preenchido"]],
    ["sugestão sem confirmar", { topSetKg: "100", topSetReps: "7" }, ["Supino: não preenchido"]],
    ["pulado", { skipped: true }, []],
    ["deload", { ...TOP1, isDeload: true, seriesValidas: 4 }, []],
    ["1 válida", { ...TOP1, seriesValidas: 1 }, []],
    ["sem Top Set 2", TOP1, ["Supino: Top Set 2"]],
    ["3 válidas sem Back-off", { ...TOP1, ...TOP2, seriesValidas: 3, extraKg: "90" }, ["Supino: Back-off"]],
    ["3 válidas só com o Top Set 1", { ...TOP1, seriesValidas: 3 }, ["Supino: Top Set 2, Back-off"]],
    ["4 válidas sem a Série 4", { ...TOP1, ...TOP2, seriesValidas: 4, extraKg: "90", extraReps: "5" }, ["Supino: Série 4"]],
    ["cluster sem confirmar", { tecnica: "RP" }, ["Supino: não preenchido"]],
    ["cluster sem a Série 2", { tecnica: "RP", tecnicaConfirmed: true, clusterSeries: [{ kg: "1", reps: "1" }] }, ["Supino: Cluster Série 2"]],
    ["cluster completo", { tecnica: "RP", tecnicaConfirmed: true, clusterSeries: [{ kg: "1", reps: "1" }], clusterSeries2: [{ kg: "1", reps: "1" }] }, []],
  ] as const)("%s", (_n, estado, esperado) => {
    expect(pend(estado as Partial<ExerciseState>)).toEqual(esperado);
  });
});

describe("temProgresso (RG7)", () => {
  it.each([
    ["só sugestão", { topSetKg: "100", topSetReps: "7", topSetKgIsSuggestion: true, topSetRepsSuggestion: true, backoffKg: "100", backoffKgIsSuggestion: true, backoffReps: "6", backoffRepsSuggestion: true }, false],
    ["vazio", {}, false],
    ["digitou peso", { topSetKg: "100" }, true],
    ["mudou as reps sugeridas", { topSetKg: "100", topSetKgIsSuggestion: true, topSetReps: "8" }, true],
    ["confirmou", TOP1, true],
    ["pulou", { skipped: true }, true],
    ["anotou", { obs: "leve" }, true],
    ["marcou esforço", { topSetRpe: 8 }, true],
    ["deload", { isDeload: true }, true],
    ["cluster digitado", { tecnica: "RP", clusterSeries: [{ kg: "1", reps: "" }] }, true],
  ] as const)("%s → %s", (_n, estado, esperado) => expect(temProgresso(st(estado as Partial<ExerciseState>))).toBe(esperado));
});

describe("rascunho estragado não quebra a tela", () => {
  it.each([null, "texto", 5, []])("estado %s vira vazio", (v) => {
    expect(sanitizeExerciseState(v as never)).toEqual(emptyExerciseState());
  });

  it("campos de tipo errado e blocos inválidos são corrigidos", () => {
    const s = sanitizeExerciseState({ topSetKg: 90, obs: {}, clusterSeries: [null, { kg: 5 }, { kg: "80", reps: "4" }] } as never);
    expect(s).toMatchObject({ topSetKg: "90", obs: "", clusterSeries: [{ kg: "", reps: "" }, { kg: "5", reps: "" }, { kg: "80", reps: "4" }] });
  });
});

describe("conquistasDoTreino (RG9)", () => {
  const reg = (over: Partial<RegistroExercicio> = {}): RegistroExercicio => ({
    exercicio: "Supino", treinoId: "UA", data: "01/10/2026", dataTs: 1, topSetKg: 100, topSetReps: 8,
    topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: true, backoffKg: 0, backoffReps: 0,
    backoffFaixaMin: 8, backoffFaixaMax: 10, seriesValidas: 2, progrediu: false, ...over,
  });
  const ids = (e: Partial<Parameters<typeof conquistasDoTreino>[0]>) =>
    conquistasDoTreino({ salvos: [reg()], historico: {}, completo: false, totalTreinos: 2, ...e });

  it("recorde: supera o 1RM anterior", () => {
    expect(ids({ historico: { Supino: [reg({ topSetReps: 7 })] } })).toEqual([{ id: "conquista_recorde", texto: "Supino: 100kg × 8" }]);
  });

  it.each([
    ["igual ao anterior", [reg()], reg()],
    ["primeiro registro", [], reg()],
    ["deload", [reg({ topSetReps: 5 })], reg({ isDeload: true })],
  ])("não é recorde: %s", (_n, historico, salvo) => {
    expect(ids({ salvos: [salvo], historico: { Supino: historico } })).toEqual([]);
  });

  it("vários recordes viram uma mensagem só", () => {
    const r = ids({
      salvos: [reg(), reg({ exercicio: "Remada" })],
      historico: { Supino: [reg({ topSetReps: 7 })], Remada: [reg({ topSetReps: 7 })] },
    });
    expect(r).toEqual([{ id: "conquista_recorde", texto: "Supino: 100kg × 8 · Remada: 100kg × 8" }]);
  });

  it("treino completo", () => expect(ids({ completo: true })).toEqual([{ id: "conquista_treino_completo" }]));

  it.each([[1, "Primeiro treino!"], [10, "10 treinos!"], [25, "25 treinos!"], [100, "100 treinos!"], [200, "200 treinos!"]])(
    "marco de %s treinos", (n, titulo) => expect(ids({ totalTreinos: n })).toEqual([{ id: "conquista_marco", titulo }]));

  it.each([2, 11, 99, 150])("%s não é marco", (n) => expect(ids({ totalTreinos: n })).toEqual([]));
});
