/**
 * UtilsTest → utils/volumeBuckets
 * Testa o agrupamento de volume load (peso × reps) em baldes de
 * semana/mês/ano usados pelo VolumeLoadCard.
 */
import { describe, it, expect } from "vitest";
import { agruparVolumePorPeriodo } from "../../utils/volumeBuckets";
import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";

function makeRegistro(overrides: Partial<RegistroGraficoRaw> & { dataTs: number }): RegistroGraficoRaw {
  return {
    data: "01/01/2026",
    cicloId: "UA",
    pesos: [100],
    topSet: 100,
    volumeLoad: 500,
    tecnica: null,
    ...overrides,
  };
}

describe("agruparVolumePorPeriodo — utils/volumeBuckets", () => {
  describe("Casos vazios / filtragem", () => {
    it("retorna array vazio quando não há registros", () => {
      expect(agruparVolumePorPeriodo([], "semana")).toEqual([]);
    });

    it("ignora registros com volumeLoad zero", () => {
      const registros = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), volumeLoad: 0 })];
      expect(agruparVolumePorPeriodo(registros, "semana")).toEqual([]);
    });

    it("ignora registros com volumeLoad negativo", () => {
      const registros = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), volumeLoad: -10 })];
      expect(agruparVolumePorPeriodo(registros, "semana")).toEqual([]);
    });
  });

  describe("Granularidade semana", () => {
    it("agrupa duas sessões na mesma semana (seg e qua) em um único balde", () => {
      const registros = [
        // Segunda-feira, 01/06/2026
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), volumeLoad: 500 }),
        // Quarta-feira, 03/06/2026 — mesma semana ISO (seg-dom)
        makeRegistro({ dataTs: new Date(2026, 5, 3).getTime(), volumeLoad: 300 }),
      ];
      const buckets = agruparVolumePorPeriodo(registros, "semana");
      expect(buckets).toHaveLength(1);
      expect(buckets[0].volume).toBe(800);
    });

    it("separa sessões de semanas diferentes em baldes distintos, ordenados", () => {
      const registros = [
        // Semana 2 (mais recente) inserida primeiro no array
        makeRegistro({ dataTs: new Date(2026, 5, 10).getTime(), volumeLoad: 400 }),
        // Semana 1
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), volumeLoad: 600 }),
      ];
      const buckets = agruparVolumePorPeriodo(registros, "semana");
      expect(buckets).toHaveLength(2);
      // Resultado deve vir ordenado cronologicamente, independente da ordem de entrada
      expect(buckets[0].volume).toBe(600);
      expect(buckets[1].volume).toBe(400);
      expect(buckets[0].inicioTs).toBeLessThan(buckets[1].inicioTs);
    });

    it("label da semana usa formato DD/MM–DD/MM", () => {
      const registros = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime() })]; // segunda-feira
      const buckets = agruparVolumePorPeriodo(registros, "semana");
      expect(buckets[0].label).toBe("01/06–07/06");
    });
  });

  describe("Granularidade mes", () => {
    it("agrupa sessões do mesmo mês em semanas diferentes em um único balde", () => {
      const registros = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), volumeLoad: 500 }),
        makeRegistro({ dataTs: new Date(2026, 5, 25).getTime(), volumeLoad: 300 }),
      ];
      const buckets = agruparVolumePorPeriodo(registros, "mes");
      expect(buckets).toHaveLength(1);
      expect(buckets[0].volume).toBe(800);
      expect(buckets[0].label).toBe("Jun/26");
    });

    it("separa meses diferentes em baldes distintos", () => {
      const registros = [
        makeRegistro({ dataTs: new Date(2026, 6, 1).getTime(), volumeLoad: 200 }),
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), volumeLoad: 100 }),
      ];
      const buckets = agruparVolumePorPeriodo(registros, "mes");
      expect(buckets).toHaveLength(2);
      expect(buckets.map((b) => b.label)).toEqual(["Jun/26", "Jul/26"]);
    });
  });

  describe("Granularidade ano", () => {
    it("agrupa sessões do mesmo ano em meses diferentes em um único balde", () => {
      const registros = [
        makeRegistro({ dataTs: new Date(2026, 0, 15).getTime(), volumeLoad: 500 }),
        makeRegistro({ dataTs: new Date(2026, 10, 20).getTime(), volumeLoad: 500 }),
      ];
      const buckets = agruparVolumePorPeriodo(registros, "ano");
      expect(buckets).toHaveLength(1);
      expect(buckets[0].volume).toBe(1000);
      expect(buckets[0].label).toBe("2026");
    });

    it("separa anos diferentes em baldes distintos e ordenados", () => {
      const registros = [
        makeRegistro({ dataTs: new Date(2027, 0, 1).getTime(), volumeLoad: 100 }),
        makeRegistro({ dataTs: new Date(2025, 0, 1).getTime(), volumeLoad: 100 }),
      ];
      const buckets = agruparVolumePorPeriodo(registros, "ano");
      expect(buckets.map((b) => b.label)).toEqual(["2025", "2027"]);
    });
  });

  describe("Marcador de técnica RP (RG7)", () => {
    it("sinaliza temRP=true quando ao menos um registro do balde usou RP", () => {
      const registros = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), tecnica: null }),
        makeRegistro({ dataTs: new Date(2026, 5, 2).getTime(), tecnica: "RP" }),
      ];
      const buckets = agruparVolumePorPeriodo(registros, "semana");
      expect(buckets[0].temRP).toBe(true);
    });

    it("sinaliza temRP=false quando nenhum registro do balde usou RP", () => {
      const registros = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), tecnica: null })];
      const buckets = agruparVolumePorPeriodo(registros, "semana");
      expect(buckets[0].temRP).toBe(false);
    });
  });
});
