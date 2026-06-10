/**
 * VolumeLoadTest → utils
 * Testa calcVolumeLoad e calcTotalVolumeWeek com datas fixas.
 * usa vi.useFakeTimers() para controlar "esta semana" vs "semana anterior".
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

// ─── helpers ─────────────────────────────────────────────────────────────────
function setDb(data: Record<string, unknown>) {
  localStorage.setItem("dadosTreino", JSON.stringify(data));
}

describe("VolumeLoadCalc", () => {
  describe("calcVolumeLoad — sem dados", () => {
    it("retorna array vazio quando localStorage está vazio", () => {
      const result = calcVolumeLoad();
      expect(result).toEqual([]);
    });

    it("retorna array vazio quando há dados mas nenhuma data desta semana", () => {
      setDb({
        "Supino Reto": {
          C1: {
            data: "01/01/2025", // ano passado
            pesos: ["100", "90"],
            reps: ["10", "10"],
            exercicio: "Supino Reto",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito).toBeUndefined();
    });
  });

  describe("calcVolumeLoad — cálculo desta semana", () => {
    it("calcula volume corretamente: séries × reps × kg", () => {
      setDb({
        "Supino Reto": {
          C1: {
            data: "10/06/2026", // esta semana
            pesos: ["100", "90", "80"],
            reps: ["10", "10", "10"],
            exercicio: "Supino Reto",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100×10 + 90×10 + 80×10 = 2700
      expect(peito?.volumeAtual).toBe(2700);
    });

    it("acumula volume de vários exercícios do mesmo músculo", () => {
      setDb({
        "Supino Reto": {
          C1: {
            data: "09/06/2026", // segunda desta semana
            pesos: ["100"],
            reps: ["5"],
            exercicio: "Supino Reto",
          },
        },
        "Voador Peck Deck / máquina": {
          C1: {
            data: "11/06/2026", // quarta desta semana
            pesos: ["60"],
            reps: ["12"],
            exercicio: "Voador Peck Deck / máquina",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100×5 + 60×12 = 500 + 720 = 1220
      expect(peito?.volumeAtual).toBe(1220);
    });

    it("delta é 0 quando não há dados da semana anterior", () => {
      setDb({
        "Supino Reto": {
          C1: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito?.delta).toBe(0);
    });

    it("delta positivo quando volume atual > semana anterior", () => {
      setDb({
        "Supino Reto": {
          C1: {
            data: "10/06/2026", // esta semana
            pesos: ["100"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
          C4: {
            data: "03/06/2026", // semana anterior (ter 03/06)
            pesos: ["80"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // Atual: 1000, Anterior: 800 → delta = +25%
      expect(peito?.delta).toBe(25);
    });

    it("delta negativo quando volume atual < semana anterior", () => {
      setDb({
        "Supino Reto": {
          C1: {
            data: "10/06/2026", // esta semana
            pesos: ["80"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
          C4: {
            data: "03/06/2026", // semana anterior
            pesos: ["100"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
        },
      });
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // Atual: 800, Anterior: 1000 → delta = -20%
      expect(peito?.delta).toBe(-20);
    });

    it("ignora exercícios sem mapeamento muscular", () => {
      setDb({
        "Exercicio Sem Mapa": {
          C1: {
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
  });

  describe("calcTotalVolumeWeek", () => {
    it("retorna 0 quando não há treinos esta semana", () => {
      expect(calcTotalVolumeWeek()).toBe(0);
    });

    it("soma volume de todos os músculos da semana", () => {
      setDb({
        "Supino Reto": {
          C1: {
            data: "10/06/2026",
            pesos: ["100"],
            reps: ["10"],
            exercicio: "Supino Reto",
          },
        },
        Agachamento: {
          C1: {
            data: "10/06/2026",
            pesos: ["130"],
            reps: ["5"],
            exercicio: "Agachamento",
          },
        },
      });
      // Peitoral: 1000, Quadríceps: 650
      expect(calcTotalVolumeWeek()).toBe(1650);
    });
  });
});
