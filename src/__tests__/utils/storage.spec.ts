/**
 * StorageTest -> utils
 * Testa o contrato de persistencia: dadosTreino (legado) e logbook (novo).
 */
import { describe, it, expect } from "vitest";
import {
  salvarDados,
  carregarDados,
  salvarRegistro,
  carregarHistorico,
  ultimoRegistro,
  exercicioDeveSubirPeso,
} from "../../utils/storage";
import type { DadosTreino, RegistroExercicio } from "../../types/TrainingData";

function makeRegistro(overrides: Partial<RegistroExercicio> = {}): RegistroExercicio {
  return {
    exercicio: "Supino reto barra",
    treinoId: "UA",
    data: "10/06/2026",
    dataTs: Date.now(),
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
    ...overrides,
  };
}

describe("Storage — Persistencia no localStorage", () => {
  // ── Legacy dadosTreino ──────────────────────────────────────────────────

  describe("carregarDados (legacy)", () => {
    it("retorna objeto vazio quando nao ha dados salvos", () => {
      expect(carregarDados()).toEqual({});
    });

    it("retorna os dados exatamente como foram salvos via setItem", () => {
      const dados: DadosTreino = {
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["100", "85"],
            reps: ["7", "12"],
            obs: "",
            exercicio: "Supino reto barra",
          },
        },
      };
      localStorage.setItem("dadosTreino", JSON.stringify(dados));
      const result = carregarDados();
      expect(result["Supino reto barra"]["UA"].pesos).toEqual(["100", "85"]);
    });
  });

  describe("salvarDados — filtragem de entradas vazias", () => {
    it("ignora ciclos onde todos pesos e reps sao vazios", () => {
      salvarDados({
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["", ""],
            reps: ["", ""],
            obs: "",
            exercicio: "Supino reto barra",
          },
        },
      });
      expect(carregarDados()["Supino reto barra"]).toBeUndefined();
    });

    it("preserva ciclos com pelo menos um peso preenchido", () => {
      salvarDados({
        "Supino reto barra": {
          UA: {
            data: "10/06/2026",
            pesos: ["100", ""],
            reps: ["7", ""],
            obs: "",
            exercicio: "Supino reto barra",
          },
        },
      });
      expect(carregarDados()["Supino reto barra"]["UA"].pesos[0]).toBe("100");
    });
  });

  // ── New Logbook ────────────────────────────────────────────────────────

  describe("salvarRegistro + carregarHistorico", () => {
    it("salva e recupera um registro do logbook", () => {
      const reg = makeRegistro();
      salvarRegistro(reg);
      const historico = carregarHistorico("Supino reto barra");
      expect(historico).toHaveLength(1);
      expect(historico[0].topSetKg).toBe(100);
    });

    it("acumula multiplos registros para o mesmo exercicio", () => {
      salvarRegistro(makeRegistro({ dataTs: 1000 }));
      salvarRegistro(makeRegistro({ dataTs: 2000, topSetKg: 102 }));
      const historico = carregarHistorico("Supino reto barra");
      expect(historico).toHaveLength(2);
    });

    it("retorna array vazio para exercicio sem historico", () => {
      expect(carregarHistorico("Exercicio inexistente")).toEqual([]);
    });
  });

  describe("seriesValidas — persistência", () => {
    it("persiste seriesValidas=3 no registro salvo", () => {
      salvarRegistro(makeRegistro({ seriesValidas: 3, extraKg: 80, extraReps: 15 }));
      const historico = carregarHistorico("Supino reto barra");
      expect(historico[0].seriesValidas).toBe(3);
      expect(historico[0].extraKg).toBe(80);
      expect(historico[0].extraReps).toBe(15);
    });

    it("ultimoRegistro retorna seriesValidas do ultimo registro", () => {
      salvarRegistro(makeRegistro({ dataTs: 1000, seriesValidas: 2 }));
      salvarRegistro(makeRegistro({ dataTs: 2000, seriesValidas: 3 }));
      const ultimo = ultimoRegistro("Supino reto barra", "UA");
      expect(ultimo?.seriesValidas).toBe(3);
    });
  });

  describe("ultimoRegistro", () => {
    it("retorna null quando nao ha registros", () => {
      expect(ultimoRegistro("Inexistente", "UA")).toBeNull();
    });

    it("retorna o registro mais recente do treino especifico", () => {
      salvarRegistro(makeRegistro({ dataTs: 1000, topSetKg: 95 }));
      salvarRegistro(makeRegistro({ dataTs: 3000, topSetKg: 100 }));
      salvarRegistro(makeRegistro({ dataTs: 2000, topSetKg: 97 }));
      const ultimo = ultimoRegistro("Supino reto barra", "UA");
      expect(ultimo?.topSetKg).toBe(100);
    });

    it("filtra por treinoId", () => {
      salvarRegistro(makeRegistro({ treinoId: "UA", topSetKg: 100, dataTs: 1000 }));
      salvarRegistro(makeRegistro({ treinoId: "UB", topSetKg: 80, dataTs: 2000 }));
      const ultimo = ultimoRegistro("Supino reto barra", "UA");
      expect(ultimo?.topSetKg).toBe(100);
    });
  });

  describe("exercicioDeveSubirPeso", () => {
    it("retorna false quando nao ha registros", () => {
      expect(exercicioDeveSubirPeso("Inexistente", "UA")).toBe(false);
    });

    it("retorna true quando ultimo registro bateu teto", () => {
      salvarRegistro(makeRegistro({ topSetBateuTeto: true }));
      expect(exercicioDeveSubirPeso("Supino reto barra", "UA")).toBe(true);
    });

    it("retorna false quando ultimo registro nao bateu teto", () => {
      salvarRegistro(makeRegistro({ topSetBateuTeto: false }));
      expect(exercicioDeveSubirPeso("Supino reto barra", "UA")).toBe(false);
    });
  });
});
