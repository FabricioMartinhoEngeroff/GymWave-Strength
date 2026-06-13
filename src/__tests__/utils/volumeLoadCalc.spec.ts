/**
 * VolumeLoadTest -> utils
 * Testa calcVolumeLoad e calcTotalVolumeWeek com datas fixas.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { vi } from "vitest";
import {
  calcVolumeLoad,
  calcTotalVolumeWeek,
} from "../../utils/volumeLoadCalc";

// Fixa a data em quarta-feira 10/06/2026
// Semana atual:   Mon 08/06 – Sun 14/06/2026
// Semana anterior: Mon 01/06 – Sun 07/06/2026
const DATA_FIXA = new Date("2026-06-10T12:00:00");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(DATA_FIXA);
});

afterAll(() => {
  vi.useRealTimers();
});

function setDb(data: Record<string, unknown>) {
  localStorage.setItem("dadosTreino", JSON.stringify(data));
}

describe("VolumeLoadCalc", () => {
  describe("calcVolumeLoad — sem dados", () => {
    it("retorna array vazio quando localStorage esta vazio", () => {
      const result = calcVolumeLoad();
      expect(result).toEqual([]);
    });

    it("retorna array vazio quando ha dados mas nenhuma data desta semana", () => {
      setDb({
        "Supino reto barra": {
          UA: {
            data: "01/01/2025",
            pesos: ["100", "90"],
            reps: ["10", "10"],
            exercicio: "Supino reto barra",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito).toBeUndefined();
    });
  });

  describe("calcVolumeLoad — calculo desta semana", () => {
    it("calcula volume corretamente: peso x reps", () => {
      setDb({
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["100", "85"],
            reps: ["7", "12"],
            exercicio: "Supino reto barra",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100*7 + 85*12 = 700 + 1020 = 1720
      expect(peito?.volumeAtual).toBe(1720);
    });

    it("acumula volume de varios exercicios do mesmo musculo", () => {
      setDb({
        "Supino reto barra": {
          UA: {
            data: "09/06/2026",
            pesos: ["100"],
            reps: ["5"],
            exercicio: "Supino reto barra",
          },
        },
        "Crossover braço estendido": {
          UA: {
            data: "11/06/2026",
            pesos: ["20"],
            reps: ["12"],
            exercicio: "Crossover braço estendido",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100*5 + 20*12 = 500 + 240 = 740
      expect(peito?.volumeAtual).toBe(740);
    });

    it("delta positivo quando volume atual > semana anterior", () => {
      setDb({
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["10"],
            exercicio: "Supino reto barra",
          },
          UB: {
            data: "03/06/2026",
            pesos: ["80"],
            reps: ["10"],
            exercicio: "Supino reto barra",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // Atual: 1000, Anterior: 800 -> delta = +25%
      expect(peito?.delta).toBe(25);
    });

    it("ignora exercicios sem mapeamento muscular", () => {
      setDb({
        "Exercicio Sem Mapa": {
          UA: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["10"],
            exercicio: "Exercicio Sem Mapa",
          },
        },
      });
      const result = calcVolumeLoad();
      expect(result).toHaveLength(0);
    });

    it("conta series validas corretamente", () => {
      setDb({
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["100", "85"],
            reps: ["7", "12"],
            exercicio: "Supino reto barra",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito?.seriesAtual).toBe(2);
    });
  });

  describe("calcTotalVolumeWeek", () => {
    it("retorna 0 quando nao ha treinos esta semana", () => {
      expect(calcTotalVolumeWeek()).toBe(0);
    });

    it("soma volume de todos os musculos da semana", () => {
      setDb({
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["10"],
            exercicio: "Supino reto barra",
          },
        },
        "Agachamento livre": {
          LB: {
            data: "10/06/2026",
            pesos: ["130"],
            reps: ["5"],
            exercicio: "Agachamento livre",
          },
        },
      });
      // Peitoral: 1000, Quadriceps: 650
      expect(calcTotalVolumeWeek()).toBe(1650);
    });
  });
});
