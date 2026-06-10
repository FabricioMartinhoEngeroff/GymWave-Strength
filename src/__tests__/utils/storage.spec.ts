/**
 * StorageTest → utils
 * Testa o contrato de persistência: salvarDados e carregarDados.
 * Usa localStorage real do jsdom — limpo automaticamente pelo setup global.
 */
import { describe, it, expect } from "vitest";
import { salvarDados, carregarDados } from "../../utils/storage";
import type { DadosTreino } from "../../types/TrainingData";

describe("Storage — Persistência no localStorage", () => {
  describe("carregarDados", () => {
    it("retorna objeto vazio quando não há dados salvos", () => {
      const result = carregarDados();
      expect(result).toEqual({});
    });

    it("retorna os dados exatamente como foram salvos via setItem", () => {
      const dados: DadosTreino = {
        "Supino Reto": {
          C1: {
            data: "10/06/2026",
            pesos: ["100", "90", ""],
            reps: ["5", "8", ""],
            obs: "",
            exercicio: "Supino Reto",
          },
        },
      };
      localStorage.setItem("dadosTreino", JSON.stringify(dados));
      const result = carregarDados();
      expect(result["Supino Reto"]["C1"].pesos).toEqual(["100", "90", ""]);
    });
  });

  describe("salvarDados — filtragem de entradas vazias", () => {
    it("ignora ciclos onde todos pesos e reps são vazios", () => {
      salvarDados({
        "Supino Reto": {
          C1: {
            data: "10/06/2026",
            pesos: ["", "", ""],
            reps: ["", "", ""],
            obs: "",
            exercicio: "Supino Reto",
          },
        },
      });
      expect(carregarDados()["Supino Reto"]).toBeUndefined();
    });

    it("preserva ciclos com pelo menos um peso preenchido", () => {
      salvarDados({
        "Supino Reto": {
          C1: {
            data: "10/06/2026",
            pesos: ["100", "", ""],
            reps: ["5", "", ""],
            obs: "",
            exercicio: "Supino Reto",
          },
        },
      });
      expect(carregarDados()["Supino Reto"]["C1"].pesos[0]).toBe("100");
    });

    it("preserva ciclos que têm apenas observação preenchida", () => {
      salvarDados({
        Agachamento: {
          C2: {
            data: "10/06/2026",
            pesos: ["", "", ""],
            reps: ["", "", ""],
            obs: "Joelho travando",
            exercicio: "Agachamento",
          },
        },
      });
      expect(carregarDados()["Agachamento"]["C2"].obs).toBe("Joelho travando");
    });

    it("remove exercício inteiro quando todos os ciclos estão vazios", () => {
      salvarDados({
        "Supino Reto": {
          C1: { data: "10/06/2026", pesos: ["", ""], reps: ["", ""], obs: "" },
          C2: { data: "10/06/2026", pesos: ["", ""], reps: ["", ""], obs: "" },
        },
        Agachamento: {
          C1: {
            data: "10/06/2026",
            pesos: ["130"],
            reps: ["5"],
            obs: "",
            exercicio: "Agachamento",
          },
        },
      });
      const saved = carregarDados();
      expect(saved["Supino Reto"]).toBeUndefined();
      expect(saved["Agachamento"]).toBeDefined();
    });

    it("round-trip: salvar e recuperar dados preserva todos os campos", () => {
      const dados: DadosTreino = {
        "Levantamento Terra": {
          C3: {
            data: "05/06/2026",
            pesos: ["160", "140", "130"],
            reps: ["3", "5", "6"],
            obs: "PR!",
            exercicio: "Levantamento Terra",
          },
        },
      };
      salvarDados(dados);
      const reg = carregarDados()["Levantamento Terra"]["C3"];
      expect(reg.pesos).toEqual(["160", "140", "130"]);
      expect(reg.reps).toEqual(["3", "5", "6"]);
      expect(reg.obs).toBe("PR!");
    });
  });
});
