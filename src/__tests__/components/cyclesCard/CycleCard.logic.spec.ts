import { describe, it, expect } from "vitest";
import { parseData, formatarData } from "../../../components/cyclesCard/CycleCard.logic";

describe("CycleCard.logic — Funções utilitárias de data", () => {
  describe("parseData", () => {
    it("converte string dd/mm/yyyy em Date correto", () => {
      const result = parseData("15/06/2026");
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(15);
      expect(result!.getMonth()).toBe(5); // junho = 5 (0-indexed)
      expect(result!.getFullYear()).toBe(2026);
    });

    it("converte 01/01/2025 corretamente", () => {
      const result = parseData("01/01/2025");
      expect(result!.getDate()).toBe(1);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getFullYear()).toBe(2025);
    });

    it("retorna null para string vazia", () => {
      expect(parseData("")).toBeNull();
    });

    it("retorna null para formato incompleto", () => {
      expect(parseData("15/06")).toBeNull();
    });

    it("retorna null para formato sem separadores", () => {
      expect(parseData("15062026")).toBeNull();
    });
  });

  describe("formatarData", () => {
    it("formata Date em dd/mm/yyyy", () => {
      const date = new Date(2026, 5, 15); // 15 de junho de 2026
      expect(formatarData(date)).toBe("15/06/2026");
    });

    it("adiciona zero à esquerda para dia e mês < 10", () => {
      const date = new Date(2026, 0, 5); // 5 de janeiro de 2026
      expect(formatarData(date)).toBe("05/01/2026");
    });

    it("formata último dia do ano", () => {
      const date = new Date(2025, 11, 31); // 31 de dezembro de 2025
      expect(formatarData(date)).toBe("31/12/2025");
    });
  });

  describe("parseData + formatarData round-trip", () => {
    it("ida e volta preserva a data original", () => {
      const original = "10/03/2026";
      const parsed = parseData(original);
      expect(parsed).not.toBeNull();
      expect(formatarData(parsed!)).toBe(original);
    });
  });
});
