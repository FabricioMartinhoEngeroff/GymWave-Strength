/**
 * UtilsTest → utils/timeFilter
 * Testa a função getCutoffTs e o enum de intervalos de tempo.
 */
import { describe, it, expect } from "vitest";
import { getCutoffTs, TIME_INTERVAL_OPTIONS } from "../../utils/timeFilter";
import type { TimeInterval } from "../../utils/timeFilter";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-06-10").getTime();

describe("timeFilter — Utilitário de filtro temporal", () => {
  describe("TIME_INTERVAL_OPTIONS", () => {
    it("exporta array com 7 opções", () => {
      expect(TIME_INTERVAL_OPTIONS).toHaveLength(7);
    });

    it("primeira opção é 'Tudo'", () => {
      expect(TIME_INTERVAL_OPTIONS[0].value).toBe("Tudo");
    });

    it("contém todas as opções esperadas", () => {
      const valores = TIME_INTERVAL_OPTIONS.map((o) => o.value);
      expect(valores).toEqual(["Tudo", "1M", "3M", "6M", "1A", "3A", "5A"]);
    });
  });

  describe("getCutoffTs", () => {
    it("retorna 0 para intervalo 'Tudo'", () => {
      expect(getCutoffTs("Tudo", NOW)).toBe(0);
    });

    it("retorna NOW - 30 dias para '1M'", () => {
      expect(getCutoffTs("1M", NOW)).toBe(NOW - 30 * DAY_MS);
    });

    it("retorna NOW - 91 dias para '3M'", () => {
      expect(getCutoffTs("3M", NOW)).toBe(NOW - 91 * DAY_MS);
    });

    it("retorna NOW - 182 dias para '6M'", () => {
      expect(getCutoffTs("6M", NOW)).toBe(NOW - 182 * DAY_MS);
    });

    it("retorna NOW - 365 dias para '1A'", () => {
      expect(getCutoffTs("1A", NOW)).toBe(NOW - 365 * DAY_MS);
    });

    it("retorna NOW - 3*365 dias para '3A'", () => {
      expect(getCutoffTs("3A", NOW)).toBe(NOW - 3 * 365 * DAY_MS);
    });

    it("retorna NOW - 5*365 dias para '5A'", () => {
      expect(getCutoffTs("5A", NOW)).toBe(NOW - 5 * 365 * DAY_MS);
    });

    it("cutoff de '1M' é menor que cutoff de '3M' (janela maior = cutoff mais antigo)", () => {
      expect(getCutoffTs("1M", NOW)).toBeGreaterThan(getCutoffTs("3M", NOW));
    });
  });
});
