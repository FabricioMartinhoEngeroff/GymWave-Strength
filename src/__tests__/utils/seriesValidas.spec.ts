/**
 * seriesValidas → utils
 * Modelo de séries:
 *   2 válidas → Top Set 1 + Top Set 2
 *   3 válidas → Top Set 1 + Top Set 2 + Back-off (~90%)
 *   4 válidas → Top Set 1 + Top Set 2 + Série 3 + Série 4 (sem redução de carga)
 */
import { describe, it, expect } from "vitest";
import {
  normalizarSeriesValidas,
  sugestaoSeriesExtras,
  volumeESeriesDoRegistro,
} from "../../utils/seriesValidas";
import type { RegistroExercicio } from "../../types/TrainingData";

function registro(over: Partial<RegistroExercicio> = {}): RegistroExercicio {
  return {
    exercicio: "Supino reto barra",
    treinoId: "UA",
    data: "01/10/2026",
    dataTs: 1000,
    topSetKg: 100,
    topSetReps: 6,
    topSetFaixaMin: 5,
    topSetFaixaMax: 9,
    topSetBateuTeto: false,
    backoffKg: 100,
    backoffReps: 5,
    backoffFaixaMin: 5,
    backoffFaixaMax: 9,
    seriesValidas: 2,
    progrediu: false,
    ...over,
  };
}

describe("normalizarSeriesValidas", () => {
  it.each([
    [2, 2], [3, 3], [4, 4],
    ["3", 3], ["4", 4], [" 4 ", 4],
    [1, 2], [5, 2], [0, 2], ["", 2], [undefined, 2], [null, 2], ["abc", 2], [3.5, 2],
  ])("%j → %i", (entrada, esperado) => {
    expect(normalizarSeriesValidas(entrada)).toBe(esperado);
  });
});

describe("sugestaoSeriesExtras", () => {
  it("3 válidas: Back-off sai do Top Set 1 × backoffPct e reps do back-off anterior", () => {
    const ultimo = registro({ seriesValidas: 3, extraKg: 80, extraReps: 12 });
    expect(sugestaoSeriesExtras(ultimo, 100, 3, 0.9)).toEqual({
      extraKg: "90",
      extraReps: "12",
      serie4Kg: "",
      serie4Reps: "",
    });
  });

  it("4 válidas: Série 3 e Série 4 repetem peso e reps do último treino, sem reduzir", () => {
    const ultimo = registro({ seriesValidas: 4, extraKg: 95, extraReps: 5, serie4Kg: 92.5, serie4Reps: 4 });
    expect(sugestaoSeriesExtras(ultimo, 102, 4, 0.9)).toEqual({
      extraKg: "95",
      extraReps: "5",
      serie4Kg: "92.5",
      serie4Reps: "4",
    });
  });

  it("4 válidas sem série 3/4 no último treino: usa o peso sugerido do Top Set 1 e as reps do Top Set 1", () => {
    const ultimo = registro({ seriesValidas: 2, topSetReps: 6 });
    expect(sugestaoSeriesExtras(ultimo, 100, 4, 0.9)).toEqual({
      extraKg: "100",
      extraReps: "6",
      serie4Kg: "100",
      serie4Reps: "6",
    });
  });

  it("4 válidas não aproveita um Back-off antigo (que era ~90%) como peso da Série 3", () => {
    const ultimo = registro({ seriesValidas: 3, extraKg: 90, extraReps: 12 });
    const s = sugestaoSeriesExtras(ultimo, 100, 4, 0.9);
    expect(s.extraKg).toBe("100");
  });

  it("2 válidas: nenhuma série extra", () => {
    expect(sugestaoSeriesExtras(registro(), 100, 2, 0.9)).toEqual({
      extraKg: "",
      extraReps: "",
      serie4Kg: "",
      serie4Reps: "",
    });
  });
});

describe("volumeESeriesDoRegistro", () => {
  it("2 válidas: soma TS1 + TS2 e ignora slots extras", () => {
    const r = registro({ seriesValidas: 2, extraKg: 50, extraReps: 10, serie4Kg: 50, serie4Reps: 10 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 100 * 6 + 100 * 5, series: 2 });
  });

  it("3 válidas: soma o Back-off e ignora a Série 4", () => {
    const r = registro({ seriesValidas: 3, extraKg: 90, extraReps: 10, serie4Kg: 50, serie4Reps: 10 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 600 + 500 + 900, series: 3 });
  });

  it("4 válidas: soma as 4 séries", () => {
    const r = registro({ seriesValidas: 4, extraKg: 100, extraReps: 5, serie4Kg: 100, serie4Reps: 4 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 600 + 500 + 500 + 400, series: 4 });
  });

  it("4 válidas com a Série 4 vazia conta só 3 séries", () => {
    const r = registro({ seriesValidas: 4, extraKg: 100, extraReps: 5 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 1600, series: 3 });
  });
});
