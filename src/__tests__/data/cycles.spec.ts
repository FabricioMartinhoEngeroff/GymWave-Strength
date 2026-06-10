/**
 * CyclesTest → data
 * Valida integridade estrutural dos ciclos de periodização Saizen.
 * Sem DOM, sem localStorage — dados puros.
 */
import { describe, it, expect } from "vitest";
import { CICLOS } from "../../data/cycles";

describe("CyclesData — Ciclos de periodização Saizen", () => {
  describe("Quantidade e identificadores", () => {
    it("deve ter exatamente 4 ciclos", () => {
      expect(CICLOS).toHaveLength(4);
    });

    it("ids devem ser C1, C2, C3, C4 nessa ordem", () => {
      expect(CICLOS.map((c) => c.id)).toEqual(["C1", "C2", "C3", "C4"]);
    });

    it("ids devem ser únicos", () => {
      const ids = CICLOS.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Campos obrigatórios", () => {
    it("todos os ciclos devem ter título, sigla e objetivo preenchidos", () => {
      CICLOS.forEach((c) => {
        expect(c.titulo.trim()).not.toBe("");
        expect(c.sigla.trim()).not.toBe("");
        expect(c.objetivo.trim()).not.toBe("");
      });
    });
  });

  describe("Faixas de repetições", () => {
    it("repMin deve ser menor que repMax em todos os ciclos", () => {
      CICLOS.forEach((c) => {
        expect(c.repMin).toBeLessThan(c.repMax);
      });
    });

    it("repMin e repMax devem ser positivos", () => {
      CICLOS.forEach((c) => {
        expect(c.repMin).toBeGreaterThan(0);
        expect(c.repMax).toBeGreaterThan(0);
      });
    });
  });

  describe("Séries válidas por fase", () => {
    it("seriesValidas deve ser 2 ou 3 em todos os ciclos", () => {
      CICLOS.forEach((c) => {
        expect([2, 3]).toContain(c.seriesValidas);
      });
    });

    it("C1 Acumulação deve ter 3 séries válidas (máximo volume)", () => {
      const c1 = CICLOS.find((c) => c.id === "C1");
      expect(c1?.seriesValidas).toBe(3);
    });

    it("C2 Intensificação deve ter 3 séries válidas", () => {
      const c2 = CICLOS.find((c) => c.id === "C2");
      expect(c2?.seriesValidas).toBe(3);
    });

    it("C3 Pico deve ter 2 séries válidas (alta intensidade)", () => {
      const c3 = CICLOS.find((c) => c.id === "C3");
      expect(c3?.seriesValidas).toBe(2);
    });

    it("C4 Deload deve ter 2 séries válidas (recuperação)", () => {
      const c4 = CICLOS.find((c) => c.id === "C4");
      expect(c4?.seriesValidas).toBe(2);
    });
  });

  describe("Lógica de progressão Saizen", () => {
    it("C3 Pico deve ter faixa de reps mais baixa que C1 Acumulação", () => {
      const c1 = CICLOS.find((c) => c.id === "C1")!;
      const c3 = CICLOS.find((c) => c.id === "C3")!;
      expect(c3.repMax).toBeLessThan(c1.repMin);
    });

    it("C4 Deload deve ter faixa de reps igual ao C1 (recuperação ativa)", () => {
      const c1 = CICLOS.find((c) => c.id === "C1")!;
      const c4 = CICLOS.find((c) => c.id === "C4")!;
      expect(c4.repMin).toBe(c1.repMin);
      expect(c4.repMax).toBe(c1.repMax);
    });
  });
});
