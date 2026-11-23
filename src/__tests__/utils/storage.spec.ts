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
  referenciaDoExercicio,
  ultimoTreinoNormal,
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
      // A data é a fonte da verdade (dataTs é derivado dela no formato v3).
      salvarRegistro(makeRegistro({ data: "01/06/2026", topSetKg: 95 }));
      salvarRegistro(makeRegistro({ data: "03/06/2026", topSetKg: 100 }));
      salvarRegistro(makeRegistro({ data: "02/06/2026", topSetKg: 97 }));
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

  describe("referenciaDoExercicio / ultimoTreinoNormal (RG5.1, RG15)", () => {
    const em = (dia: number, over: Record<string, unknown> = {}) =>
      salvarRegistro(makeRegistro({
        data: `${String(dia).padStart(2, "0")}/10/2026`, dataTs: new Date(2026, 9, dia).getTime(),
        topSetKg: 100, topSetReps: 7, backoffKg: 100, backoffReps: 6, seriesValidas: 3, extraKg: 90, extraReps: 10, ...over,
      }));
    const ref = () => referenciaDoExercicio("Supino reto barra", "UA");

    it("sem histórico retorna null", () => expect(ref()).toBeNull());

    it("usa o último treino normal, ignorando deload", () => {
      em(1);
      em(8, { topSetKg: 60, isDeload: true, backoffKg: 0, backoffReps: 0, extraKg: undefined, extraReps: undefined });
      expect(ref()).toMatchObject({ topSetKg: 100, backoffKg: 100, extraKg: 90 });
      expect(ultimoTreinoNormal("Supino reto barra", "UA")?.topSetKg).toBe(100);
    });

    it("só com deload usa o Top Set 1 dele", () => {
      em(1, { topSetKg: 60, isDeload: true, backoffKg: 0, backoffReps: 0 });
      expect(ref()).toMatchObject({ topSetKg: 60 });
    });

    it("série não feita no último treino vem da última vez em que foi feita", () => {
      em(1, { extraKg: 85, extraReps: 12 });
      em(8, { topSetKg: 102, extraKg: undefined, extraReps: undefined });
      expect(ref()).toMatchObject({ topSetKg: 102, extraKg: 85, extraReps: 12 });
    });

    it("Top Set 2 não feito vem do treino anterior", () => {
      em(1, { backoffKg: 97.5, backoffReps: 5 });
      em(8, { backoffKg: 0, backoffReps: 0 });
      expect(ref()).toMatchObject({ backoffKg: 97.5, backoffReps: 5 });
    });

    it("depois de um Cluster, os Top Sets vêm do último treino em que foram feitos", () => {
      em(1);
      em(8, { tecnica: "RP", topSetKg: 0, topSetReps: 0, backoffKg: 0, backoffReps: 0, extraKg: undefined, extraReps: undefined, clusterSeries: [{ kg: 90, reps: 4 }] });
      expect(ref()).toMatchObject({ topSetKg: 100, topSetReps: 7, backoffKg: 100, extraKg: 90 });
      expect(ultimoTreinoNormal("Supino reto barra", "UA")?.tecnica).toBe("RP");
    });

    it("não mistura Série 3 (4 válidas) com Back-off (3 válidas)", () => {
      em(1, { seriesValidas: 4, extraKg: 100, extraReps: 5, serie4Kg: 100, serie4Reps: 4 });
      em(8, { seriesValidas: 3, extraKg: undefined, extraReps: undefined });
      expect(ref()?.extraKg).toBeUndefined();
    });

    it("progressão compara com o último treino normal, não com o deload", () => {
      em(1);
      em(8, { topSetKg: 60, isDeload: true });
      em(15);
      expect(ultimoRegistro("Supino reto barra", "UA")).toMatchObject({ topSetKg: 100, pesoAnterior: 100, progrediu: false });
    });

    it("subir peso olha o último treino normal", () => {
      em(1, { topSetBateuTeto: true });
      em(8, { isDeload: true, topSetBateuTeto: false });
      expect(exercicioDeveSubirPeso("Supino reto barra", "UA")).toBe(true);
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

    it("teto com RPE abaixo de 8 sobe; com RPE 8 ou mais repete a carga", () => {
      salvarRegistro(makeRegistro({ topSetBateuTeto: true, topSetRpe: 7.5 }));
      expect(exercicioDeveSubirPeso("Supino reto barra", "UA")).toBe(true);
      localStorage.clear();
      salvarRegistro(makeRegistro({ topSetBateuTeto: true, topSetRpe: 8 }));
      expect(exercicioDeveSubirPeso("Supino reto barra", "UA")).toBe(false);
    });

    it("retorna false quando ultimo registro nao bateu teto", () => {
      salvarRegistro(makeRegistro({ topSetBateuTeto: false }));
      expect(exercicioDeveSubirPeso("Supino reto barra", "UA")).toBe(false);
    });
  });

  describe("clusterSeries (RP) — persistência no logbook", () => {
    it("salva e recupera registro RP com 4 blocos completos", () => {
      salvarRegistro(makeRegistro({
        tecnica: "RP",
        topSetKg: 0,
        topSetReps: 0,
        backoffKg: 0,
        backoffReps: 0,
        clusterSeries: [
          { kg: 80, reps: 10 },
          { kg: 80, reps: 8 },
          { kg: 78, reps: 7 },
          { kg: 78, reps: 6 },
        ],
      }));
      const historico = carregarHistorico("Supino reto barra");
      expect(historico[0].tecnica).toBe("RP");
      expect(historico[0].clusterSeries).toHaveLength(4);
      expect(historico[0].clusterSeries![0]).toEqual({ kg: 80, reps: 10 });
      expect(historico[0].clusterSeries![3]).toEqual({ kg: 78, reps: 6 });
    });

    it("salva e recupera registro RP com 4 blocos", () => {
      salvarRegistro(makeRegistro({
        tecnica: "RP",
        topSetKg: 0,
        topSetReps: 0,
        backoffKg: 0,
        backoffReps: 0,
        clusterSeries: [
          { kg: 100, reps: 5 },
          { kg: 100, reps: 5 },
          { kg: 100, reps: 5 },
          { kg: 100, reps: 5 },
        ],
      }));
      const historico = carregarHistorico("Supino reto barra");
      expect(historico[0].tecnica).toBe("RP");
      expect(historico[0].clusterSeries).toHaveLength(4);
      expect(historico[0].clusterSeries![3]).toEqual({ kg: 100, reps: 5 });
    });

    it("ultimoRegistro preserva clusterSeries intacto", () => {
      salvarRegistro(makeRegistro({ dataTs: 1000 })); // normal, mais antigo
      salvarRegistro(makeRegistro({
        dataTs: 2000,
        tecnica: "RP",
        topSetKg: 0,
        topSetReps: 0,
        backoffKg: 0,
        backoffReps: 0,
        clusterSeries: [
          { kg: 80, reps: 10 },
          { kg: 80, reps: 8 },
          { kg: 78, reps: 7 },
          { kg: 78, reps: 6 },
        ],
      }));
      const ultimo = ultimoRegistro("Supino reto barra", "UA");
      expect(ultimo?.tecnica).toBe("RP");
      expect(ultimo?.clusterSeries).toHaveLength(4);
    });

    it("registro sem tecnica tem clusterSeries undefined", () => {
      salvarRegistro(makeRegistro());
      const historico = carregarHistorico("Supino reto barra");
      expect(historico[0].clusterSeries).toBeUndefined();
      expect(historico[0].tecnica).toBeUndefined();
    });

    it("mix: registros normais e com RP convivem no mesmo historico", () => {
      salvarRegistro(makeRegistro({ dataTs: 1000, topSetKg: 90 }));
      salvarRegistro(makeRegistro({
        dataTs: 2000,
        tecnica: "RP",
        topSetKg: 0,
        topSetReps: 0,
        backoffKg: 0,
        backoffReps: 0,
        clusterSeries: [
          { kg: 80, reps: 10 },
          { kg: 80, reps: 8 },
          { kg: 78, reps: 7 },
          { kg: 78, reps: 6 },
        ],
      }));
      const historico = carregarHistorico("Supino reto barra");
      expect(historico).toHaveLength(2);
      const normal = historico.find((r) => !r.tecnica);
      const bc = historico.find((r) => r.tecnica === "RP");
      expect(normal?.topSetKg).toBe(90);
      expect(bc?.clusterSeries).toHaveLength(4);
    });

    it("RP com blocos parciais descarta os blocos vazios (série não feita não existe)", () => {
      salvarRegistro(makeRegistro({
        tecnica: "RP",
        topSetKg: 0,
        topSetReps: 0,
        backoffKg: 0,
        backoffReps: 0,
        clusterSeries: [
          { kg: 80, reps: 10 },
          { kg: 80, reps: 8 },
          { kg: 0, reps: 0 },
          { kg: 0, reps: 0 },
        ],
      }));
      const historico = carregarHistorico("Supino reto barra");
      expect(historico[0].clusterSeries).toEqual([
        { kg: 80, reps: 10 },
        { kg: 80, reps: 8 },
      ]);
    });
  });
});
