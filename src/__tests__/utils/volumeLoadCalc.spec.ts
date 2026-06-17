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

  describe("calcVolumeLoad — logbook com seriesValidas", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("soma volume extra quando seriesValidas=3", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "10/06/2026",
          dataTs: new Date("2026-06-10T12:00:00").getTime(),
          topSetKg: 100,
          topSetReps: 7,
          topSetFaixaMin: 5,
          topSetFaixaMax: 9,
          topSetBateuTeto: false,
          backoffKg: 85,
          backoffReps: 12,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 3,
          extraKg: 80,
          extraReps: 15,
          progrediu: false,
        }],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100*7 + 85*12 + 80*15 = 700 + 1020 + 1200 = 2920
      expect(peito?.volumeAtual).toBe(2920);
    });

    it("conta 3 series quando seriesValidas=3 com extra preenchido", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "10/06/2026",
          dataTs: new Date("2026-06-10T12:00:00").getTime(),
          topSetKg: 100,
          topSetReps: 7,
          topSetFaixaMin: 5,
          topSetFaixaMax: 9,
          topSetBateuTeto: false,
          backoffKg: 85,
          backoffReps: 12,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 3,
          extraKg: 80,
          extraReps: 15,
          progrediu: false,
        }],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito?.seriesAtual).toBe(3);
    });

    it("conta 2 series quando seriesValidas=2 mesmo que extraKg exista", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "10/06/2026",
          dataTs: new Date("2026-06-10T12:00:00").getTime(),
          topSetKg: 100,
          topSetReps: 7,
          topSetFaixaMin: 5,
          topSetFaixaMax: 9,
          topSetBateuTeto: false,
          backoffKg: 85,
          backoffReps: 12,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 2,
          progrediu: false,
        }],
      }));
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

  describe("calcVolumeLoad — clusterSeries BC/RP", () => {
    function makeLogbookEntry(overrides: Record<string, unknown> = {}) {
      return {
        exercicio: "Supino reto barra",
        treinoId: "UA",
        data: "10/06/2026",
        dataTs: new Date("2026-06-10T12:00:00").getTime(),
        topSetKg: 0,
        topSetReps: 0,
        topSetFaixaMin: 5,
        topSetFaixaMax: 9,
        topSetBateuTeto: false,
        backoffKg: 0,
        backoffReps: 0,
        backoffFaixaMin: 9,
        backoffFaixaMax: 15,
        seriesValidas: 2,
        progrediu: false,
        ...overrides,
      };
    }

    it("BC com 4 blocos: volume = soma de kg×reps de cada bloco", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "BC",
          clusterSeries: [
            { kg: 80, reps: 10 },
            { kg: 80, reps: 8 },
            { kg: 78, reps: 7 },
            { kg: 78, reps: 6 },
          ],
        })],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 80*10 + 80*8 + 78*7 + 78*6 = 800 + 640 + 546 + 468 = 2454
      expect(peito?.volumeAtual).toBe(2454);
    });

    it("RP com 2 blocos: volume = soma dos 2 blocos", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "RP",
          clusterSeries: [
            { kg: 100, reps: 8 },
            { kg: 100, reps: 5 },
          ],
        })],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100*8 + 100*5 = 800 + 500 = 1300
      expect(peito?.volumeAtual).toBe(1300);
    });

    it("conta somente blocos com kg>0 e reps>0 para seriesAtual", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "BC",
          clusterSeries: [
            { kg: 80, reps: 10 },
            { kg: 80, reps: 8 },
            { kg: 0, reps: 0 },
            { kg: 0, reps: 0 },
          ],
        })],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito?.seriesAtual).toBe(2);
    });

    it("blocos vazios nao somam ao volume", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "BC",
          clusterSeries: [
            { kg: 80, reps: 10 },
            { kg: 0, reps: 0 },
            { kg: 0, reps: 0 },
            { kg: 0, reps: 0 },
          ],
        })],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito?.volumeAtual).toBe(800); // 80*10
    });

    it("clusterSeries vazio ([]) usa topSet/backoff normalmente como fallback", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "BC",
          clusterSeries: [],
          topSetKg: 100,
          topSetReps: 7,
          backoffKg: 85,
          backoffReps: 12,
        })],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100*7 + 85*12 = 700 + 1020 = 1720
      expect(peito?.volumeAtual).toBe(1720);
    });

    it("registro normal sem clusterSeries nao e afetado", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          topSetKg: 100,
          topSetReps: 7,
          backoffKg: 85,
          backoffReps: 12,
        })],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 100*7 + 85*12 = 700 + 1020 = 1720
      expect(peito?.volumeAtual).toBe(1720);
      expect(peito?.seriesAtual).toBe(2);
    });

    it("BC e registro normal do mesmo musculo acumulam volume na semana", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [
          makeLogbookEntry({
            tecnica: "BC",
            clusterSeries: [
              { kg: 80, reps: 10 },
              { kg: 80, reps: 8 },
              { kg: 78, reps: 7 },
              { kg: 78, reps: 6 },
            ],
          }),
          makeLogbookEntry({
            topSetKg: 100,
            topSetReps: 5,
            backoffKg: 0,
            backoffReps: 0,
            dataTs: new Date("2026-06-11T12:00:00").getTime(),
          }),
        ],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // BC: 2454, normal: 500 -> total 2954
      expect(peito?.volumeAtual).toBe(2954);
    });
  });
});
