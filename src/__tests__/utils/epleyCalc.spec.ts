import { describe, it, expect } from "vitest";
import { calcEpley, estimar1RM, extractReferenceBlock } from "../../utils/epleyCalc";
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

  describe("estimar1RM — 1RM pelo esforço (reps + RIR)", () => {
    it("soma as reps na reserva: 100kg x 5 @8 vale como 7RM", () => {
      expect(estimar1RM(100, 5, 8)).toEqual({ rm1: calcEpley(100, 7), repsAteFalha: 7, aproximado: false });
    });

    it("@10 até 10 reps coincide com o Epley puro", () => {
      expect(estimar1RM(100, 8, 10)?.rm1).toBe(calcEpley(100, 8));
    });

    it("1 rep @10 é o próprio 1RM (o Epley daria 103.33)", () => {
      expect(estimar1RM(100, 1, 10)?.rm1).toBe(100);
    });

    it("acima de 10 reps até a falha usa Mayhew, mais conservador, e marca como aproximado", () => {
      const r = estimar1RM(100, 15, 10);
      expect(r?.aproximado).toBe(true);
      expect(r?.rm1).toBeCloseTo(141.73, 1);
      expect(r!.rm1).toBeLessThan(calcEpley(100, 15));
    });

    it("nunca cai ao cruzar as 10 reps (mais reps = 1RM igual ou maior)", () => {
      const serie = [8, 9, 9.5, 10, 10.5, 11, 12, 15, 20].map((r) => estimar1RM(100, r, 10)!.rm1);
      serie.slice(1).forEach((v, i) => expect(v).toBeGreaterThanOrEqual(serie[i]!));
    });

    it.each([[100, 5, undefined], [100, 5, 6], [100, 5, 6.5], [0, 5, 8], [100, 0, 8]])(
      "sem base confiável (%s kg x %s @%s) não estima", (kg, reps, rpe) => {
        expect(estimar1RM(kg, reps, rpe)).toBeNull();
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
