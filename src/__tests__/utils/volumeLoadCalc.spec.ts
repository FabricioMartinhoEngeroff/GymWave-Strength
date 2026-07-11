/**
 * VolumeLoadTest -> utils
 * Testa calcVolumeLoad e calcTotalVolumeWeek com datas fixas.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { vi } from "vitest";
import {
  calcVolumeLoad,
  calcTotalVolumeWeek,
  calcStreakSemanas,
  calcEstagnadoMusculo,
  calcQuedaCargaMusculo,
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

  describe("calcVolumeLoad — clusterSeries RP", () => {
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

    it("RP com 4 blocos: volume = soma de kg×reps de cada bloco", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "RP",
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

    it("RP com 4 blocos: volume = soma dos 4 blocos", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "RP",
          clusterSeries: [
            { kg: 100, reps: 5 },
            { kg: 100, reps: 5 },
            { kg: 100, reps: 5 },
            { kg: 100, reps: 5 },
          ],
        })],
      }));
      const result = calcVolumeLoad();
      const peito = result.find((r) => r.musculo === "Peitoral");
      // 4 × (100*5) = 2000
      expect(peito?.volumeAtual).toBe(2000);
    });

    it("conta somente blocos com kg>0 e reps>0 para seriesAtual", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry({
          tecnica: "RP",
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
          tecnica: "RP",
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
          tecnica: "RP",
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

    it("RP e registro normal do mesmo musculo acumulam volume na semana", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [
          makeLogbookEntry({
            tecnica: "RP",
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
      // RP: 2454, normal: 500 -> total 2954
      expect(peito?.volumeAtual).toBe(2954);
    });
  });

  // ── Helpers compartilhados pelos novos blocos ─────────────────────────────

  function makeEntry(exercicio: string, dateISO: string, overrides: Record<string, unknown> = {}) {
    const [y, m, d] = dateISO.split("-");
    return {
      exercicio,
      treinoId: "UA",
      data: `${d}/${m}/${y}`,
      dataTs: new Date(`${dateISO}T12:00:00`).getTime(),
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
      progrediu: true,
      ...overrides,
    };
  }

  // DATA_FIXA = 2026-06-10 (quarta)
  // Semana atual: Mon 08/06 – Sun 14/06  | Mês atual: junho
  // Semana anterior: Mon 01/06 – Sun 07/06 | Mês anterior: maio
  //
  // Datas por semana ISO para testes de streak:
  // W24: 2026-06-10 | W23: 2026-06-03 | W22: 2026-05-27 | W21: 2026-05-20
  // W20: 2026-05-13 | W19: 2026-05-06 | W18: 2026-04-29 | W17: 2026-04-22
  // W16: 2026-04-15 | W15: 2026-04-08

  const SEMANAS_10 = [
    "2026-06-10", // W24
    "2026-06-03", // W23
    "2026-05-27", // W22
    "2026-05-20", // W21
    "2026-05-13", // W20
    "2026-05-06", // W19
    "2026-04-29", // W18
    "2026-04-22", // W17
    "2026-04-15", // W16
    "2026-04-08", // W15
  ];

  function setLogbook(entries: Record<string, unknown[]>) {
    localStorage.setItem("logbook", JSON.stringify(entries));
  }

  // ── calcVolumeLoad com granularidade mensal ──────────────────────────────

  describe("calcVolumeLoad com granularidade mensal", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("registro de junho (semana anterior) conta como volumeAtual no modo mes", () => {
      // June 3 = semana anterior, mas mesmo mês (junho) → modo mês = atual
      setLogbook({
        "Supino reto barra": [makeEntry("Supino reto barra", "2026-06-03")],
      });
      const weekResult = calcVolumeLoad("week");
      const monthResult = calcVolumeLoad("month");
      const peitoWeek = weekResult.find((r) => r.musculo === "Peitoral");
      const peitoMonth = monthResult.find((r) => r.musculo === "Peitoral");

      // Modo semana: jun 3 = semana anterior → volumeAnterior
      expect(peitoWeek?.volumeAnterior).toBeGreaterThan(0);
      expect(peitoWeek?.volumeAtual).toBe(0);

      // Modo mês: jun 3 = mês atual (junho) → volumeAtual
      expect(peitoMonth?.volumeAtual).toBeGreaterThan(0);
      expect(peitoMonth?.volumeAnterior).toBe(0);
    });

    it("registro de maio conta como periodo anterior no modo mes", () => {
      setLogbook({
        "Supino reto barra": [makeEntry("Supino reto barra", "2026-05-15")],
      });
      const result = calcVolumeLoad("month");
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito?.volumeAnterior).toBeGreaterThan(0);
      expect(peito?.volumeAtual).toBe(0);
    });

    it("registro de abril é ignorado no modo mes (fora dos 2 meses relevantes)", () => {
      setLogbook({
        "Supino reto barra": [makeEntry("Supino reto barra", "2026-04-15")],
      });
      const result = calcVolumeLoad("month");
      const peito = result.find((r) => r.musculo === "Peitoral");
      expect(peito).toBeUndefined();
    });

    it("soma volume de registros de junho e maio separadamente", () => {
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-03", { topSetKg: 100, topSetReps: 10 }),  // jun atual
          makeEntry("Supino reto barra", "2026-05-15", { topSetKg: 80, topSetReps: 10 }),   // mai anterior
        ],
      });
      const result = calcVolumeLoad("month");
      const peito = result.find((r) => r.musculo === "Peitoral");
      // Jun: 100*10 + 85*12 = 1000 + 1020 = 2020
      // Mai: 80*10 + 85*12 = 800 + 1020 = 1820
      expect(peito?.volumeAtual).toBe(2020);
      expect(peito?.volumeAnterior).toBe(1820);
    });

    it("modo semana sem argumento funciona igual ao modo 'week' explicito", () => {
      setLogbook({
        "Supino reto barra": [makeEntry("Supino reto barra", "2026-06-10")],
      });
      const defaultResult = calcVolumeLoad();
      const weekResult = calcVolumeLoad("week");
      const peitoDefault = defaultResult.find((r) => r.musculo === "Peitoral");
      const peitoWeek = weekResult.find((r) => r.musculo === "Peitoral");
      expect(peitoDefault?.volumeAtual).toBe(peitoWeek?.volumeAtual);
    });
  });

  // ── calcStreakSemanas — contagem de semanas consecutivas ─────────────────

  describe("calcStreakSemanas — contagem de semanas consecutivas", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("retorna 0 quando logbook está vazio", () => {
      expect(calcStreakSemanas()).toBe(0);
    });

    it("retorna 1 quando há apenas 1 semana de treino (esta semana)", () => {
      setLogbook({
        "Supino reto barra": [makeEntry("Supino reto barra", "2026-06-10")],
      });
      expect(calcStreakSemanas()).toBe(1);
    });

    it("retorna 3 para 3 semanas consecutivas", () => {
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10"), // W24
          makeEntry("Supino reto barra", "2026-06-03"), // W23
          makeEntry("Supino reto barra", "2026-05-27"), // W22
        ],
      });
      expect(calcStreakSemanas()).toBe(3);
    });

    it("para de contar quando há gap de uma semana sem treino", () => {
      // W24, W23, W22 presentes; W21 ausente; W20, W19 presentes
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10"), // W24
          makeEntry("Supino reto barra", "2026-06-03"), // W23
          makeEntry("Supino reto barra", "2026-05-27"), // W22
          // W21 (2026-05-20) ausente → streak para aqui
          makeEntry("Supino reto barra", "2026-05-13"), // W20
          makeEntry("Supino reto barra", "2026-05-06"), // W19
        ],
      });
      expect(calcStreakSemanas()).toBe(3);
    });

    it("retorna 10 para 10 semanas consecutivas (limiar do banner de deload)", () => {
      setLogbook({
        "Supino reto barra": SEMANAS_10.map((d) =>
          makeEntry("Supino reto barra", d)
        ),
      });
      expect(calcStreakSemanas()).toBe(10);
    });

    it("retorna 9 para 9 semanas consecutivas (abaixo do limiar)", () => {
      const semanas9 = SEMANAS_10.slice(0, 9); // W16–W24
      setLogbook({
        "Supino reto barra": semanas9.map((d) =>
          makeEntry("Supino reto barra", d)
        ),
      });
      expect(calcStreakSemanas()).toBe(9);
    });

    it("multiplos exercicios na mesma semana contam como 1 semana", () => {
      setLogbook({
        "Supino reto barra": [makeEntry("Supino reto barra", "2026-06-10")],
        "Crossover braço estendido": [makeEntry("Crossover braço estendido", "2026-06-11")],
        "Remada peito apoiado": [makeEntry("Remada peito apoiado", "2026-06-09")],
      });
      expect(calcStreakSemanas()).toBe(1);
    });
  });

  // ── calcEstagnadoMusculo — badge de estagnação ──────────────────────────

  describe("calcEstagnadoMusculo — badge de estagnação (RG9)", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("retorna false quando logbook está vazio", () => {
      expect(calcEstagnadoMusculo("Peitoral")).toBe(false);
    });

    it("retorna false quando apenas 1 exercicio do grupo tem 4 sessoes estagnadas", () => {
      // Precisa de >= 2 exercícios estagnados no grupo
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-06-03", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-05-27", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-05-20", { progrediu: false, topSetBateuTeto: false }),
        ],
      });
      expect(calcEstagnadoMusculo("Peitoral")).toBe(false);
    });

    it("retorna true quando 2 exercicios do grupo têm >= 4 sessoes consecutivas sem progressão", () => {
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-06-03", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-05-27", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-05-20", { progrediu: false, topSetBateuTeto: false }),
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Crossover braço estendido", "2026-06-03", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Crossover braço estendido", "2026-05-27", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Crossover braço estendido", "2026-05-20", { progrediu: false, topSetBateuTeto: false }),
        ],
      });
      expect(calcEstagnadoMusculo("Peitoral")).toBe(true);
    });

    it("sessão com topSetBateuTeto=true não conta como estagnação", () => {
      // O exercício bateu teto → não é estagnação, é limitação de faixa
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { progrediu: false, topSetBateuTeto: true }),
          makeEntry("Supino reto barra", "2026-06-03", { progrediu: false, topSetBateuTeto: true }),
          makeEntry("Supino reto barra", "2026-05-27", { progrediu: false, topSetBateuTeto: true }),
          makeEntry("Supino reto barra", "2026-05-20", { progrediu: false, topSetBateuTeto: true }),
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { progrediu: false, topSetBateuTeto: true }),
          makeEntry("Crossover braço estendido", "2026-06-03", { progrediu: false, topSetBateuTeto: true }),
          makeEntry("Crossover braço estendido", "2026-05-27", { progrediu: false, topSetBateuTeto: true }),
          makeEntry("Crossover braço estendido", "2026-05-20", { progrediu: false, topSetBateuTeto: true }),
        ],
      });
      expect(calcEstagnadoMusculo("Peitoral")).toBe(false);
    });

    it("sequência de estagnação é quebrada por sessão com progrediu=true", () => {
      // Apenas 3 sessões consecutivas estagnadas — insuficiente
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-06-03", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-05-27", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Supino reto barra", "2026-05-20", { progrediu: true,  topSetBateuTeto: false }), // quebra sequência
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Crossover braço estendido", "2026-06-03", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Crossover braço estendido", "2026-05-27", { progrediu: false, topSetBateuTeto: false }),
          makeEntry("Crossover braço estendido", "2026-05-20", { progrediu: true,  topSetBateuTeto: false }),
        ],
      });
      expect(calcEstagnadoMusculo("Peitoral")).toBe(false);
    });

    it("retorna false para musculo sem exercicios no logbook", () => {
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
        ],
      });
      expect(calcEstagnadoMusculo("Costas")).toBe(false);
    });
  });

  // ── calcQuedaCargaMusculo — badge de queda de carga ──────────────────────

  describe("calcQuedaCargaMusculo — badge de queda de carga (RG10)", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("retorna false quando logbook está vazio", () => {
      expect(calcQuedaCargaMusculo("Peitoral")).toBe(false);
    });

    it("retorna false quando apenas 1 exercicio do grupo tem queda de tonnage", () => {
      // Apenas Supino cai; Crossover sobe → não atinge limiar de 2
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { topSetKg: 90,  topSetReps: 7 }), // atual: 630
          makeEntry("Supino reto barra", "2026-06-03", { topSetKg: 100, topSetReps: 7 }), // anterior: 700
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { topSetKg: 25, topSetReps: 12 }), // atual: 300
          makeEntry("Crossover braço estendido", "2026-06-03", { topSetKg: 20, topSetReps: 12 }), // anterior: 240
        ],
      });
      expect(calcQuedaCargaMusculo("Peitoral")).toBe(false);
    });

    it("retorna true quando 2 exercicios do grupo têm tonnage menor na semana atual", () => {
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { topSetKg: 90,  topSetReps: 7 }), // atual: 630
          makeEntry("Supino reto barra", "2026-06-03", { topSetKg: 100, topSetReps: 7 }), // anterior: 700
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { topSetKg: 18, topSetReps: 12 }), // atual: 216
          makeEntry("Crossover braço estendido", "2026-06-03", { topSetKg: 25, topSetReps: 12 }), // anterior: 300
        ],
      });
      expect(calcQuedaCargaMusculo("Peitoral")).toBe(true);
    });

    it("retorna false quando tonnage é igual (sem queda)", () => {
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { topSetKg: 100, topSetReps: 7 }),
          makeEntry("Supino reto barra", "2026-06-03", { topSetKg: 100, topSetReps: 7 }),
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { topSetKg: 25, topSetReps: 12 }),
          makeEntry("Crossover braço estendido", "2026-06-03", { topSetKg: 25, topSetReps: 12 }),
        ],
      });
      expect(calcQuedaCargaMusculo("Peitoral")).toBe(false);
    });

    it("retorna false quando nao ha dados do periodo anterior para comparar", () => {
      // Só tem dado desta semana — sem anterior para comparar
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-10", { topSetKg: 90, topSetReps: 7 }),
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { topSetKg: 18, topSetReps: 12 }),
        ],
      });
      expect(calcQuedaCargaMusculo("Peitoral")).toBe(false);
    });

    it("usa a ultima sessao do periodo quando ha multiplos registros", () => {
      // Duas entradas na semana atual para Supino: a mais recente (Jun 11) é menor
      setLogbook({
        "Supino reto barra": [
          makeEntry("Supino reto barra", "2026-06-09", { topSetKg: 100, topSetReps: 7 }), // atual mas mais antigo
          makeEntry("Supino reto barra", "2026-06-11", { topSetKg: 90,  topSetReps: 7 }), // atual e mais recente
          makeEntry("Supino reto barra", "2026-06-03", { topSetKg: 95,  topSetReps: 7 }), // anterior: 665
        ],
        "Crossover braço estendido": [
          makeEntry("Crossover braço estendido", "2026-06-10", { topSetKg: 18, topSetReps: 12 }), // atual: 216
          makeEntry("Crossover braço estendido", "2026-06-03", { topSetKg: 25, topSetReps: 12 }), // anterior: 300
        ],
      });
      // Supino mais recente = 90*7 = 630 < 95*7 = 665 → queda ✓
      // Crossover = 216 < 300 → queda ✓
      expect(calcQuedaCargaMusculo("Peitoral")).toBe(true);
    });
  });
});
