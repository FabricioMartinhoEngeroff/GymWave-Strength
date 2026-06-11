/**
 * CyclesTest → data
 * Valida integridade estrutural dos ciclos de periodização Saizen.
 * Sem DOM, sem localStorage — dados puros.
 *
 * Progressão:
 *  C1 Pico           → 2 séries · 5–6  reps · força máxima / PR work
 *  C2 Intensificação → 3 séries · 7–8  reps · força e volume
 *  C3 Acumulação     → 3 séries · 9–12 reps · volume alto / base
 *  C4 Deload         → 2 séries · 12–15 reps · recuperação ativa
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

    it("C1 Pico deve ter faixa de reps 5–6", () => {
      const c1 = CICLOS.find((c) => c.id === "C1")!;
      expect(c1.repMin).toBe(5);
      expect(c1.repMax).toBe(6);
    });

    it("C2 Intensificação deve ter faixa de reps 7–8", () => {
      const c2 = CICLOS.find((c) => c.id === "C2")!;
      expect(c2.repMin).toBe(7);
      expect(c2.repMax).toBe(8);
    });

    it("C3 Acumulação deve ter faixa de reps 9–12", () => {
      const c3 = CICLOS.find((c) => c.id === "C3")!;
      expect(c3.repMin).toBe(9);
      expect(c3.repMax).toBe(12);
    });

    it("C4 Deload deve ter faixa de reps 12–15", () => {
      const c4 = CICLOS.find((c) => c.id === "C4")!;
      expect(c4.repMin).toBe(12);
      expect(c4.repMax).toBe(15);
    });
  });

  describe("Séries válidas por fase", () => {
    it("seriesValidas deve ser 2 ou 3 em todos os ciclos", () => {
      CICLOS.forEach((c) => {
        expect([2, 3]).toContain(c.seriesValidas);
      });
    });

    it("C1 Pico deve ter 2 séries válidas (alta intensidade, poucos sets)", () => {
      const c1 = CICLOS.find((c) => c.id === "C1");
      expect(c1?.seriesValidas).toBe(2);
    });

    it("C2 Intensificação deve ter 2 séries válidas (mínimo obrigatório)", () => {
      const c2 = CICLOS.find((c) => c.id === "C2");
      expect(c2?.seriesValidas).toBe(2);
    });

    it("C3 Acumulação deve ter 2 séries válidas (mínimo obrigatório)", () => {
      const c3 = CICLOS.find((c) => c.id === "C3");
      expect(c3?.seriesValidas).toBe(2);
    });

    it("todos os ciclos têm 2 séries válidas — 3ª série é opcional", () => {
      CICLOS.forEach((c) => {
        expect(c.seriesValidas).toBe(2);
      });
    });

    it("C4 Deload deve ter 2 séries válidas (recuperação)", () => {
      const c4 = CICLOS.find((c) => c.id === "C4");
      expect(c4?.seriesValidas).toBe(2);
    });
  });

  describe("Lógica de progressão Saizen", () => {
    it("C1 Pico deve ter a menor faixa de reps (força máxima)", () => {
      const c1 = CICLOS.find((c) => c.id === "C1")!;
      CICLOS.filter((c) => c.id !== "C1").forEach((outro) => {
        expect(c1.repMax).toBeLessThan(outro.repMin);
      });
    });

    it("C4 Deload deve ter a maior faixa de reps (recuperação ativa)", () => {
      const c4 = CICLOS.find((c) => c.id === "C4")!;
      CICLOS.filter((c) => c.id !== "C4").forEach((outro) => {
        expect(c4.repMin).toBeGreaterThanOrEqual(outro.repMax);
      });
    });

    it("reps crescem de C1 para C3 (Pico → Acumulação)", () => {
      const [c1, c2, c3] = CICLOS;
      expect(c1.repMin).toBeLessThan(c2.repMin);
      expect(c2.repMin).toBeLessThan(c3.repMin);
    });

    it("C3 Acumulação deve ter reps mais altas que C2 Intensificação", () => {
      const c2 = CICLOS.find((c) => c.id === "C2")!;
      const c3 = CICLOS.find((c) => c.id === "C3")!;
      expect(c3.repMin).toBeGreaterThan(c2.repMax);
    });
  });
});
