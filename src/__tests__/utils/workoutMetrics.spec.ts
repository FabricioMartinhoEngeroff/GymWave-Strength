/**
 * WorkoutMetricsTest -> utils
 * Testa computeSessionPoint, buildExerciseHistory e buildLogbookHistory.
 */
import { describe, it, expect } from "vitest";
import {
  computeSessionPoint,
  buildExerciseHistory,
  buildLogbookHistory,
} from "../../utils/workoutMetrics";
import type { Logbook } from "../../types/TrainingData";

describe("WorkoutMetrics", () => {
  // ── computeSessionPoint ─────────────────────────────────────────────────
  describe("computeSessionPoint — extracao de topSet + backoffs", () => {
    it("retorna null quando todos os pesos sao zero", () => {
      const result = computeSessionPoint("Supino reto barra", {
        data: "10/06/2026",
        pesos: ["0", "0"],
        reps: ["10", "10"],
      });
      expect(result).toBeNull();
    });

    it("retorna null quando pesos estao vazios", () => {
      const result = computeSessionPoint("Supino reto barra", {
        data: "10/06/2026",
        pesos: ["", ""],
        reps: ["", ""],
      });
      expect(result).toBeNull();
    });

    it("retorna null para data invalida", () => {
      const result = computeSessionPoint("Supino reto barra", {
        data: "nao-e-data",
        pesos: ["100"],
        reps: ["10"],
      });
      expect(result).toBeNull();
    });

    it("identifica topSet como primeiro peso nao-zero", () => {
      const result = computeSessionPoint("Supino reto barra", {
        data: "10/06/2026",
        pesos: ["100", "85"],
        reps: ["7", "12"],
      });
      expect(result!.topSetPeso).toBe(100);
      expect(result!.topSetReps).toBe(7);
    });

    it("extrai backoffs corretamente apos o topSet", () => {
      const result = computeSessionPoint("Agachamento livre", {
        data: "05/06/2026",
        pesos: ["130", "110", "100"],
        reps: ["4", "8", "10"],
      });
      expect(result!.backoff1Peso).toBe(110);
      expect(result!.backoff1Reps).toBe(8);
      expect(result!.backoff2Peso).toBe(100);
      expect(result!.backoff2Reps).toBe(10);
    });

    it("backoffs ficam como 0 quando so ha 1 serie registrada", () => {
      const result = computeSessionPoint("Barra fixa pronada", {
        data: "10/06/2026",
        pesos: ["80"],
        reps: ["6"],
      });
      expect(result!.backoff1Peso).toBe(0);
      expect(result!.backoff2Peso).toBe(0);
    });
  });

  // ── buildExerciseHistory ────────────────────────────────────────────────
  describe("buildExerciseHistory — historico ordenado por data", () => {
    it("retorna objeto vazio para banco vazio", () => {
      expect(buildExerciseHistory({})).toEqual({});
    });

    it("ordena registros por data crescente", () => {
      const db = {
        "Supino reto barra": {
          UB: {
            data: "15/03/2026",
            pesos: ["90"],
            reps: ["8"],
            exercicio: "Supino reto barra",
          },
          UA: {
            data: "01/03/2026",
            pesos: ["80"],
            reps: ["10"],
            exercicio: "Supino reto barra",
          },
        },
      };
      const history = buildExerciseHistory(db);
      expect(history["Supino reto barra"]).toHaveLength(2);
      expect(history["Supino reto barra"][0].topSetPeso).toBe(80);
      expect(history["Supino reto barra"][1].topSetPeso).toBe(90);
    });

    it("na mesma data mantem apenas o melhor topSet", () => {
      const db = {
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["80"],
            reps: ["10"],
            exercicio: "Supino reto barra",
          },
          UB: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["5"],
            exercicio: "Supino reto barra",
          },
        },
      };
      const history = buildExerciseHistory(db);
      expect(history["Supino reto barra"]).toHaveLength(1);
      expect(history["Supino reto barra"][0].topSetPeso).toBe(100);
    });
  });

  // ── buildLogbookHistory ─────────────────────────────────────────────────
  describe("buildLogbookHistory — historico do novo logbook", () => {
    it("retorna objeto vazio para logbook vazio", () => {
      expect(buildLogbookHistory({})).toEqual({});
    });

    it("converte registros do logbook em LogbookPoints ordenados", () => {
      const logbook: Logbook = {
        "Supino reto barra": [
          {
            exercicio: "Supino reto barra",
            treinoId: "UA",
            data: "15/06/2026",
            dataTs: new Date(2026, 5, 15).getTime(),
            topSetKg: 100,
            topSetReps: 7,
            topSetFaixaMin: 5,
            topSetFaixaMax: 9,
            topSetBateuTeto: false,
            backoffKg: 85,
            backoffReps: 12,
            backoffFaixaMin: 9,
            backoffFaixaMax: 15,
            progrediu: false,
          },
          {
            exercicio: "Supino reto barra",
            treinoId: "UA",
            data: "01/06/2026",
            dataTs: new Date(2026, 5, 1).getTime(),
            topSetKg: 95,
            topSetReps: 9,
            topSetFaixaMin: 5,
            topSetFaixaMax: 9,
            topSetBateuTeto: true,
            backoffKg: 80,
            backoffReps: 14,
            backoffFaixaMin: 9,
            backoffFaixaMax: 15,
            progrediu: false,
          },
        ],
      };
      const history = buildLogbookHistory(logbook);
      expect(history["Supino reto barra"]).toHaveLength(2);
      // Should be sorted by ts ascending
      expect(history["Supino reto barra"][0].topSetKg).toBe(95);
      expect(history["Supino reto barra"][1].topSetKg).toBe(100);
    });

    it("ignora registros com topSetKg = 0", () => {
      const logbook: Logbook = {
        "Supino reto barra": [
          {
            exercicio: "Supino reto barra",
            treinoId: "UA",
            data: "10/06/2026",
            dataTs: Date.now(),
            topSetKg: 0,
            topSetReps: 0,
            topSetFaixaMin: 5,
            topSetFaixaMax: 9,
            topSetBateuTeto: false,
            backoffKg: 0,
            backoffReps: 0,
            backoffFaixaMin: 9,
            backoffFaixaMax: 15,
            progrediu: false,
          },
        ],
      };
      const history = buildLogbookHistory(logbook);
      expect(history["Supino reto barra"]).toHaveLength(0);
    });

    it("preserva flags bateuTeto e progrediu", () => {
      const logbook: Logbook = {
        "Terra sumô": [
          {
            exercicio: "Terra sumô",
            treinoId: "LA",
            data: "10/06/2026",
            dataTs: Date.now(),
            topSetKg: 160,
            topSetReps: 9,
            topSetFaixaMin: 5,
            topSetFaixaMax: 9,
            topSetBateuTeto: true,
            backoffKg: 136,
            backoffReps: 12,
            backoffFaixaMin: 9,
            backoffFaixaMax: 15,
            progrediu: true,
          },
        ],
      };
      const history = buildLogbookHistory(logbook);
      expect(history["Terra sumô"][0].bateuTeto).toBe(true);
      expect(history["Terra sumô"][0].progrediu).toBe(true);
    });
  });
});
