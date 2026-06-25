import { describe, it, expect } from "vitest";
import { calcEpley, extractReferenceBlock } from "../../utils/epleyCalc";
import type { RegistroExercicio } from "../../types/TrainingData";

const baseRegistro: RegistroExercicio = {
  exercicio: "Supino reto barra",
  treinoId: "UA",
  data: "01/01/2026",
  dataTs: 1000,
  topSetKg: 0,
  topSetReps: 0,
  topSetFaixaMin: 5,
  topSetFaixaMax: 8,
  topSetBateuTeto: false,
  backoffKg: 0,
  backoffReps: 0,
  backoffFaixaMin: 8,
  backoffFaixaMax: 10,
  seriesValidas: 2,
  progrediu: false,
};

describe("epleyCalc", () => {
  describe("calcEpley — formula 1RM estimado", () => {
    it("calcEpley(100, 5) retorna 116.67", () => {
      expect(calcEpley(100, 5)).toBe(116.67);
    });

    it("calcEpley(100, 1) retorna 103.33", () => {
      expect(calcEpley(100, 1)).toBe(103.33);
    });

    it("calcEpley(100, 0) retorna 100 (reps=0 retorna o peso sem acrescimo)", () => {
      expect(calcEpley(100, 0)).toBe(100);
    });

    it("calcEpley(0, 5) retorna 0", () => {
      expect(calcEpley(0, 5)).toBe(0);
    });
  });

  describe("extractReferenceBlock — bloco de referencia por tecnica", () => {
    it("modo padrao retorna peso e reps do Top Set", () => {
      const r: RegistroExercicio = { ...baseRegistro, topSetKg: 100, topSetReps: 7, tecnica: null };
      expect(extractReferenceBlock(r)).toEqual({ peso: 100, reps: 7 });
    });

    it("modo RP com 4 blocos retorna apenas Bloco 1 (R1), demais ignorados", () => {
      const r: RegistroExercicio = {
        ...baseRegistro,
        tecnica: "RP",
        clusterSeries: [
          { kg: 100, reps: 5 },
          { kg: 100, reps: 5 },
          { kg: 100, reps: 5 },
          { kg: 100, reps: 5 },
        ],
      };
      expect(extractReferenceBlock(r)).toEqual({ peso: 100, reps: 5 });
    });

    it("modo RP retorna peso e reps do Bloco 1 (R1), demais blocos ignorados", () => {
      const r: RegistroExercicio = {
        ...baseRegistro,
        tecnica: "RP",
        clusterSeries: [
          { kg: 120, reps: 5 },
          { kg: 120, reps: 3 },
        ],
      };
      expect(extractReferenceBlock(r)).toEqual({ peso: 120, reps: 5 });
    });

    it("modo RP sem Bloco 1 preenchido retorna null", () => {
      const r: RegistroExercicio = {
        ...baseRegistro,
        tecnica: "RP",
        clusterSeries: [
          { kg: 0, reps: 0 },
          { kg: 90, reps: 6 },
        ],
      };
      expect(extractReferenceBlock(r)).toBeNull();
    });
  });
});
