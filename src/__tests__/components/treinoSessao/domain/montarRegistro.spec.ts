/**
 * montarRegistro → domain
 * Converte o estado da tela no registro do logbook e na linha legada do dadosTreino.
 */
import { describe, it, expect } from "vitest";
import { montarRegistro } from "../../../../components/treinoSessao/domain/montarRegistro";
import { emptyExerciseState, type ExerciseState } from "../../../../components/treinoSessao/domain/estadoExercicio";
import { paraRegistro } from "../../../../utils/registros";
import { volumeESeriesDoRegistro } from "../../../../utils/seriesValidas";
import type { ExercicioSessao } from "../../../../data/sessionExercises";

const EX: ExercicioSessao = {
  nome: "Supino reto barra", grupo: "Peitoral", faixaTopSet: [5, 8], faixaBackoff: [8, 10],
  backoffPct: 0.9, seriesValidas: 2, cue: "",
};

const montar = (over: Partial<ExerciseState>, ultimo: Parameters<typeof montarRegistro>[0]["ultimo"] = null) =>
  montarRegistro({ ex: EX, state: { ...emptyExerciseState(), ...over }, treinoId: "UA", data: "13/10/2026", ultimo });

const FEITO = { topSetKg: "100", topSetReps: "8", topSetConfirmed: true, backoffKg: "100", backoffReps: "6", backoffConfirmed: true };

describe("montarRegistro — domain", () => {
  it("2 válidas: grava os dois Top Sets e o teto", () => {
    const r = montar({ ...FEITO, obs: "  firme  " });
    expect(r?.registro).toMatchObject({
      exercicio: EX.nome, treinoId: "UA", data: "13/10/2026", dataTs: new Date(2026, 9, 13).getTime(),
      topSetKg: 100, topSetReps: 8, topSetBateuTeto: true, backoffKg: 100, backoffReps: 6, obs: "firme",
    });
    expect(r?.legado).toMatchObject({ pesos: ["100", "100"], reps: ["8", "6"], obs: "firme", data: "13/10/2026" });
  });

  it("1 válida não grava Top Set 2 fantasma", () => {
    const r = montar({ ...FEITO, seriesValidas: 1 });
    expect(r?.registro).toMatchObject({ backoffKg: 0, backoffReps: 0 });
    expect(r?.legado.pesos).toEqual(["100"]);
  });

  describe("só conta o que foi feito (RG24)", () => {
    const TRES = { ...FEITO, seriesValidas: 3 as const, extraKg: "90", extraReps: "10" };

    it.each([
      ["zerado", { extraKg: "0", extraReps: "0" }],
      ["vazio", { extraKg: "", extraReps: "" }],
      ["só com peso", { extraKg: "90", extraReps: "" }],
      ["só com reps", { extraKg: "", extraReps: "10" }],
    ])("3 válidas com o Back-off %s grava só 2 séries", (_n, over) => {
      const r = montar({ ...TRES, ...over, extraRpe: 10 });
      expect(r?.registro).toMatchObject({ extraKg: undefined, extraReps: undefined, extraRpe: undefined });
      expect(r?.legado).toMatchObject({ pesos: ["100", "100"], reps: ["8", "6"] });
      expect(paraRegistro(r!.registro).series.map((s) => s.tipo)).toEqual(["top1", "top2"]);
      expect(volumeESeriesDoRegistro(r!.registro)).toEqual({ volume: 1400, series: 2 });
    });

    it("4 válidas sem a Série 4 grava 3", () => {
      const r = montar({ ...FEITO, seriesValidas: 4, extraKg: "100", extraReps: "5", serie4Kg: "100", serie4Reps: "0" });
      expect(r?.legado.pesos).toEqual(["100", "100", "100"]);
      expect(r?.registro.serie4Kg).toBeUndefined();
    });

    it("Top Set 2 não confirmado (só sugestão) não é gravado, nem o Back-off que nem abriu", () => {
      const r = montar({ ...TRES, backoffConfirmed: false, backoffRpe: 9 });
      expect(r?.registro).toMatchObject({ backoffKg: 0, backoffReps: 0, backoffRpe: undefined, extraKg: undefined });
      expect(r?.legado).toMatchObject({ pesos: ["100"], reps: ["8"] });
    });

    it("Top Set 2 confirmado e depois zerado não é gravado", () => {
      expect(montar({ ...FEITO, backoffKg: "0" })?.legado.pesos).toEqual(["100"]);
    });

    it("Top Set 1 sem reps não grava o exercício", () => {
      expect(montar({ ...FEITO, topSetReps: "" })).toBeNull();
      expect(montar({ ...FEITO, topSetReps: "0" })).toBeNull();
    });

    it("cluster confirmado e depois esvaziado não grava", () => {
      expect(montar({ tecnica: "RP", tecnicaConfirmed: true, clusterSeries: [{ kg: "", reps: "" }] })).toBeNull();
    });
  });

  describe("Deload grava só o Top Set 1 (RG15)", () => {
    const r = montar({
      ...FEITO, isDeload: true, seriesValidas: 4, backoffKg: "97", backoffReps: "6", topSetRpe: 6,
      extraKg: "90", extraReps: "10", extraRpe: 9, serie4Kg: "90", serie4Reps: "8",
    });

    it("sem Top Set 2, Back-off, Série 3 ou Série 4, mesmo com sugestão guardada", () => {
      expect(r?.registro).toMatchObject({
        isDeload: true, seriesValidas: 1, topSetKg: 100, topSetReps: 8, topSetRpe: 6, backoffKg: 0, backoffReps: 0,
        extraKg: undefined, extraRpe: undefined, serie4Kg: undefined,
      });
      expect(paraRegistro(r!.registro)).toMatchObject({ deload: true, series: [{ tipo: "top1", kg: 100, reps: 8, rpe: 6 }] });
      expect(r?.legado).toMatchObject({ pesos: ["100"], reps: ["8"] });
    });

    it("não bate teto nem progride", () => {
      expect(r?.registro).toMatchObject({ topSetBateuTeto: false, progrediu: false });
    });
  });

  it("3 e 4 válidas gravam o Back-off e as séries extras", () => {
    expect(montar({ ...FEITO, seriesValidas: 3, extraKg: "90", extraReps: "10" })?.registro).toMatchObject({ extraKg: 90, extraReps: 10 });
    expect(montar({ ...FEITO, seriesValidas: 4, extraKg: "100", extraReps: "5", serie4Kg: "95", serie4Reps: "4" })?.legado.pesos)
      .toEqual(["100", "100", "100", "95"]);
  });

  it("cluster grava só blocos válidos e nunca bate teto", () => {
    const r = montar({
      tecnica: "RP", tecnicaConfirmed: true,
      clusterSeries: [{ kg: "100", reps: "4" }, { kg: "", reps: "" }], clusterSeries2: [{ kg: "90", reps: "3" }],
    });
    expect(r?.registro).toMatchObject({
      tecnica: "RP", topSetBateuTeto: false, clusterSeries: [{ kg: 100, reps: 4 }], clusterSeries2: [{ kg: 90, reps: 3 }],
    });
    expect(r?.legado).toMatchObject({ pesos: ["100", "90"], reps: ["4", "3"] });
  });

  it("grava o RPE só das séries que existem no registro", () => {
    const comRpe = { topSetRpe: 8, backoffRpe: 9, extraRpe: 10, serie4Rpe: 9.5 };
    expect(montar({ ...FEITO, ...comRpe })?.registro).toMatchObject({ topSetRpe: 8, backoffRpe: 9, extraRpe: undefined, serie4Rpe: undefined });
    expect(montar({ ...FEITO, ...comRpe, seriesValidas: 1 })?.registro.backoffRpe).toBeUndefined();
    expect(montar({ ...FEITO, ...comRpe, seriesValidas: 4, extraKg: "90", extraReps: "5" })?.registro)
      .toMatchObject({ extraRpe: 10, serie4Rpe: undefined });
  });

  it("cluster grava o RPE de cada série e nenhum RPE de Top Set", () => {
    const r = montar({
      tecnica: "RP", tecnicaConfirmed: true, topSetRpe: 8, clusterRpe: 9, clusterRpe2: 10,
      clusterSeries: [{ kg: "100", reps: "4" }], clusterSeries2: [],
    });
    expect(r?.registro).toMatchObject({ topSetRpe: undefined, clusterRpe: 9, clusterRpe2: undefined });
  });

  it("não grava exercício pulado, não confirmado ou sem peso", () => {
    expect(montar({ ...FEITO, skipped: true })).toBeNull();
    expect(montar({ ...FEITO, topSetConfirmed: false })).toBeNull();
    expect(montar({ ...FEITO, topSetKg: "" })).toBeNull();
    expect(montar({ tecnica: "RP", tecnicaConfirmed: false })).toBeNull();
  });
});
