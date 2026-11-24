/**
 * Esforço obrigatório → domain
 * Séries feitas sem esforço no exercício e no treino (EF_02 RG27).
 */
import { describe, it, expect } from "vitest";
import { camposSemEsforco } from "../../../../components/treinoSessao/domain/seriesFeitas";
import { seriesSemEsforco } from "../../../../components/treinoSessao/domain/pendencias";
import { emptyExerciseState, type ExerciseState } from "../../../../components/treinoSessao/domain/estadoExercicio";
import type { ExercicioSessao } from "../../../../data/sessionExercises";

const st = (over: Partial<ExerciseState> = {}): ExerciseState => ({ ...emptyExerciseState(), ...over });
const ex = (nome: string): ExercicioSessao => ({
  nome, grupo: "", faixaTopSet: [5, 8], faixaBackoff: [8, 10], backoffPct: 0.9, seriesValidas: 2, cue: "",
});
const TOP1 = { topSetKg: "100", topSetReps: "7", topSetConfirmed: true };
const TOP2 = { backoffKg: "100", backoffReps: "6", backoffConfirmed: true };
const EXTRA = { extraKg: "90", extraReps: "9" };
const SERIE4 = { serie4Kg: "90", serie4Reps: "8" };
const BLOCO = [{ kg: "100", reps: "4" }];
const VAZIO = [{ kg: "", reps: "" }];
const CLUSTER = { tecnica: "RP", tecnicaConfirmed: true, clusterSeries: BLOCO, clusterSeries2: BLOCO };

describe("camposSemEsforco (RG27)", () => {
  it.each([
    ["nada feito", {}, []],
    ["só sugestão, sem confirmar", { topSetKg: "100", topSetReps: "7" }, []],
    ["Top Set 1 feito", TOP1, ["topSetRpe"]],
    ["Top Set 1 com esforço", { ...TOP1, topSetRpe: 8 }, []],
    ["RPE 6 (≤6) conta como marcado", { ...TOP1, topSetRpe: 6 }, []],
    ["2 válidas sem nenhum", { ...TOP1, ...TOP2 }, ["topSetRpe", "backoffRpe"]],
    ["2 válidas só com o do Top Set 1", { ...TOP1, ...TOP2, topSetRpe: 8 }, ["backoffRpe"]],
    ["Top Set 2 apagado (não fiz)", { ...TOP1, topSetRpe: 8, backoffKgWasUserEdited: true }, []],
    ["Top Set 2 sem confirmar", { ...TOP1, topSetRpe: 8, backoffKg: "100", backoffReps: "6" }, []],
    ["3 válidas com Back-off", { ...TOP1, ...TOP2, ...EXTRA, seriesValidas: 3, topSetRpe: 8, backoffRpe: 9 }, ["extraRpe"]],
    ["3 válidas com Back-off sem reps", { ...TOP1, ...TOP2, extraKg: "90", seriesValidas: 3, topSetRpe: 8, backoffRpe: 9 }, []],
    ["3 válidas com Back-off zerado", { ...TOP1, ...TOP2, extraKg: "0", extraReps: "0", seriesValidas: 3, topSetRpe: 8, backoffRpe: 9 }, []],
    ["4 válidas", { ...TOP1, ...TOP2, ...EXTRA, ...SERIE4, seriesValidas: 4 }, ["topSetRpe", "backoffRpe", "extraRpe", "serie4Rpe"]],
    ["1 válida", { ...TOP1, ...TOP2, seriesValidas: 1 }, ["topSetRpe"]],
    ["deload", { ...TOP1, ...TOP2, isDeload: true }, ["topSetRpe"]],
    ["pulado", { ...TOP1, skipped: true }, []],
    ["cluster sem nenhum", CLUSTER, ["clusterRpe", "clusterRpe2"]],
    ["cluster só com o da Série 1", { ...CLUSTER, clusterRpe: 9 }, ["clusterRpe2"]],
    ["cluster completo", { ...CLUSTER, clusterRpe: 9, clusterRpe2: 10 }, []],
    ["cluster sem confirmar", { ...CLUSTER, tecnicaConfirmed: false }, []],
    ["cluster com a Série 2 vazia", { ...CLUSTER, clusterSeries2: VAZIO, clusterRpe: 9 }, []],
    ["cluster pulado", { ...CLUSTER, skipped: true }, []],
  ] as const)("%s", (_n, estado, esperado) => {
    expect(camposSemEsforco(st(estado as unknown as Partial<ExerciseState>))).toEqual(esperado);
  });
});

describe("seriesSemEsforco: lista por exercício (RG27)", () => {
  const lista = (estados: Record<string, Partial<ExerciseState>>) =>
    seriesSemEsforco(Object.keys(estados).map(ex), Object.fromEntries(Object.entries(estados).map(([n, e]) => [n, st(e)])));

  it("nomeia cada série", () => {
    expect(lista({ Supino: { ...TOP1, ...TOP2, ...EXTRA, seriesValidas: 3 } })).toEqual(["Supino: Top Set 1, Top Set 2, Back-off"]);
    expect(lista({ Supino: { ...TOP1, ...TOP2, ...EXTRA, ...SERIE4, seriesValidas: 4, topSetRpe: 8, backoffRpe: 8 } })).toEqual(["Supino: Série 3, Série 4"]);
    expect(lista({ Supino: CLUSTER as Partial<ExerciseState> })).toEqual(["Supino: Cluster Série 1, Cluster Série 2"]);
  });

  it("só os exercícios com falta; completo, pulado e não preenchido ficam de fora", () => {
    expect(lista({
      Supino: { ...TOP1, topSetRpe: 8 }, Remada: TOP1, Rosca: { ...TOP1, skipped: true }, Scott: {},
    })).toEqual(["Remada: Top Set 1"]);
  });

  it("exercício sem estado não quebra", () => expect(seriesSemEsforco([ex("Supino")], {})).toEqual([]));
});
