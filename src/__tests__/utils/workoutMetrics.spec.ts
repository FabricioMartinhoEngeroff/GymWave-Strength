/**
 * WorkoutMetricsTest → utils
 * Testa computeSessionPoint e buildExerciseHistory.
 * Funções puras — sem DOM, sem localStorage.
 */
import { describe, it, expect } from "vitest";
import {
  computeSessionPoint,
  buildExerciseHistory,
} from "../../utils/workoutMetrics";

describe("WorkoutMetrics", () => {
  // ─── computeSessionPoint ─────────────────────────────────────────────────
  describe("computeSessionPoint — extração de topSet + backoffs", () => {
    it("retorna null quando todos os pesos são zero", () => {
      const result = computeSessionPoint("Supino Reto", {
        data: "10/06/2026",
        pesos: ["0", "0", "0"],
        reps: ["10", "10", "10"],
      });
      expect(result).toBeNull();
    });

    it("retorna null quando pesos estão vazios", () => {
      const result = computeSessionPoint("Supino Reto", {
        data: "10/06/2026",
        pesos: ["", "", ""],
        reps: ["", "", ""],
      });
      expect(result).toBeNull();
    });

    it("retorna null para data inválida", () => {
      const result = computeSessionPoint("Supino Reto", {
        data: "nao-e-data",
        pesos: ["100"],
        reps: ["10"],
      });
      expect(result).toBeNull();
    });

    it("identifica topSet como primeiro peso não-zero", () => {
      const result = computeSessionPoint("Supino Reto", {
        data: "10/06/2026",
        pesos: ["100", "90", "80"],
        reps: ["5", "8", "8"],
      });
      expect(result!.topSetPeso).toBe(100);
      expect(result!.topSetReps).toBe(5);
    });

    it("extrai backoffs corretamente após o topSet", () => {
      const result = computeSessionPoint("Agachamento", {
        data: "05/06/2026",
        pesos: ["130", "110", "100"],
        reps: ["4", "8", "10"],
      });
      expect(result!.backoff1Peso).toBe(110);
      expect(result!.backoff1Reps).toBe(8);
      expect(result!.backoff2Peso).toBe(100);
      expect(result!.backoff2Reps).toBe(10);
    });

    it("backoffs ficam como 0 quando só há 1 série registrada", () => {
      const result = computeSessionPoint("Barra fixa", {
        data: "10/06/2026",
        pesos: ["80"],
        reps: ["6"],
      });
      expect(result!.backoff1Peso).toBe(0);
      expect(result!.backoff2Peso).toBe(0);
    });

    it("parseia corretamente data no formato DD/MM/YYYY", () => {
      const result = computeSessionPoint("Supino Reto", {
        data: "01/01/2026",
        pesos: ["100"],
        reps: ["5"],
      });
      expect(result!.data).toBe("01/01/2026");
      expect(result!.ts).toBeGreaterThan(0);
    });
  });

  // ─── buildExerciseHistory ────────────────────────────────────────────────
  describe("buildExerciseHistory — histórico ordenado por data", () => {
    it("retorna objeto vazio para banco vazio", () => {
      expect(buildExerciseHistory({})).toEqual({});
    });

    it("ordena registros por data crescente", () => {
      const db = {
        "Supino Reto": {
          C2: {
            data: "15/03/2026",
            pesos: ["90"],
            reps: ["8"],
            exercicio: "Supino Reto",
          },
          C1: {
            data: "01/03/2026",
            pesos: ["80"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
        },
      };
      const history = buildExerciseHistory(db);
      expect(history["Supino Reto"]).toHaveLength(2);
      expect(history["Supino Reto"][0].topSetPeso).toBe(80); // 01/03 primeiro
      expect(history["Supino Reto"][1].topSetPeso).toBe(90); // 15/03 depois
    });

    it("na mesma data mantém apenas o melhor topSet", () => {
      const db = {
        "Supino Reto": {
          C1: {
            data: "10/06/2026",
            pesos: ["80"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
          C4: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["5"],
            exercicio: "Supino Reto",
          },
        },
      };
      const history = buildExerciseHistory(db);
      expect(history["Supino Reto"]).toHaveLength(1);
      expect(history["Supino Reto"][0].topSetPeso).toBe(100);
    });

    it("separa histórico por exercício independentemente", () => {
      const db = {
        "Supino Reto": {
          C1: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["5"],
            exercicio: "Supino Reto",
          },
        },
        Agachamento: {
          C1: {
            data: "10/06/2026",
            pesos: ["130"],
            reps: ["4"],
            exercicio: "Agachamento",
          },
        },
      };
      const history = buildExerciseHistory(db);
      expect(Object.keys(history)).toHaveLength(2);
      expect(history["Supino Reto"][0].topSetPeso).toBe(100);
      expect(history["Agachamento"][0].topSetPeso).toBe(130);
    });

    it("ignora registros com data inválida", () => {
      const db = {
        "Supino Reto": {
          C1: {
            data: "invalida",
            pesos: ["100"],
            reps: ["5"],
            exercicio: "Supino Reto",
          },
        },
      };
      const history = buildExerciseHistory(db);
      expect(history["Supino Reto"] ?? []).toHaveLength(0);
    });

    it("ignora registros com todos os pesos vazios", () => {
      const db = {
        "Supino Reto": {
          C2: {
            data: "10/06/2026",
            pesos: ["", ""],
            reps: ["", ""],
            exercicio: "Supino Reto",
          },
        },
      };
      const history = buildExerciseHistory(db);
      expect(history["Supino Reto"] ?? []).toHaveLength(0);
    });
  });
});
