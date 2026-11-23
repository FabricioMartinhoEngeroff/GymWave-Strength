/**
 * esforco → utils
 * RPE/RIR: validação, rótulos, progressão pelo esforço e detecção de fadiga.
 */
import { describe, it, expect } from "vitest";
import { deveSubirPeso, detectarFadiga, normalizarRpe, rotuloChip, rotuloEsforco, RPES } from "../../utils/esforco";
import type { RegistroExercicio } from "../../types/TrainingData";

describe("esforco — utils", () => {
  describe("normalizarRpe", () => {
    it.each([6, 6.5, 7, 8.5, 10])("aceita %s", (v) => expect(normalizarRpe(v)).toBe(v));
    it.each([5.5, 10.5, 8.2, NaN, "8", null, undefined, {}])("recusa %s", (v) => expect(normalizarRpe(v)).toBeUndefined());
  });

  it("as opções vão de 6 a 10", () => {
    expect(RPES[0]).toBe(6);
    expect(RPES[RPES.length - 1]).toBe(10);
    RPES.forEach((r) => expect(normalizarRpe(r)).toBe(r));
  });

  describe("rótulos (RIR = 10 − RPE)", () => {
    it.each([[10, "10", "0"], [8, "8", "2"], [8.5, "8.5", "1.5"], [6, "≤6", "4+"]] as const)(
      "RPE %s → chip %s / %s", (rpe, emRpe, emRir) => {
        expect(rotuloChip(rpe, "RPE")).toBe(emRpe);
        expect(rotuloChip(rpe, "RIR")).toBe(emRir);
        expect(rotuloEsforco(rpe, "RPE")).toBe(`RPE ${emRpe}`);
        expect(rotuloEsforco(rpe, "RIR")).toBe(`RIR ${emRir}`);
      });
  });

  describe("deveSubirPeso (progressão pelo esforço)", () => {
    it.each([
      ["teto com RPE 7.5", true, 7.5, true],
      ["teto com RPE 8 (limite)", true, 8, false],
      ["teto com RPE 10", true, 10, false],
      ["teto sem RPE (regra antiga)", true, undefined, true],
      ["sem teto, mesmo fácil", false, 6, false],
      ["sem teto e sem RPE", false, undefined, false],
    ] as const)("%s → %s", (_n, teto, rpe, esperado) => {
      expect(deveSubirPeso(teto, rpe)).toBe(esperado);
    });
  });

  describe("detectarFadiga", () => {
    const DIA = 24 * 60 * 60 * 1000;
    const treino = (dia: number, rpe: number | undefined, over: Partial<RegistroExercicio> = {}): RegistroExercicio => {
      const d = new Date(2026, 9, 1 + dia);
      return {
        exercicio: "Supino reto barra", treinoId: "UA", data: d.toLocaleDateString("pt-BR"), dataTs: d.getTime(),
        topSetKg: 100, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
        backoffKg: 100, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
        seriesValidas: 2, progrediu: false, topSetRpe: rpe, ...over,
      };
    };

    it("mesma carga e reps com RPE subindo por 3 treinos em 2 semanas", () => {
      expect(detectarFadiga([treino(0, 7), treino(7, 8), treino(14, 8.5)], "UA")).toEqual({
        kg: 100, rpeInicial: 7, rpeAtual: 8.5, treinos: 3,
      });
    });

    it("a ordem da lista não importa", () => {
      expect(detectarFadiga([treino(14, 9), treino(0, 7), treino(7, 8)], "UA")?.rpeAtual).toBe(9);
    });

    it("menos reps com RPE maior também é fadiga", () => {
      expect(detectarFadiga([treino(0, 8), treino(7, 8.5, { topSetReps: 6 }), treino(14, 9, { topSetReps: 6 })], "UA")).not.toBeNull();
    });

    it("mais reps com RPE maior é progresso, não fadiga", () => {
      expect(detectarFadiga([treino(0, 7), treino(7, 8, { topSetReps: 8 }), treino(14, 9, { topSetReps: 9 })], "UA")).toBeNull();
    });

    it.each([
      ["menos de 3 treinos", [treino(0, 7), treino(14, 9)]],
      ["alta menor que 1 ponto", [treino(0, 8), treino(7, 8), treino(14, 8.5)]],
      ["RPE caiu no último treino", [treino(0, 7), treino(7, 9), treino(14, 8)]],
      ["tudo na mesma semana", [treino(0, 7), treino(2, 8), treino(4, 9)]],
      ["sem RPE", [treino(0, undefined), treino(7, undefined), treino(14, undefined)]],
      ["histórico vazio", []],
    ])("não alerta: %s", (_n, lista) => expect(detectarFadiga(lista, "UA")).toBeNull());

    it("ignora outra carga, cluster e treino sem RPE no meio da sequência", () => {
      expect(detectarFadiga([
        treino(0, 7), treino(3, 6, { topSetKg: 60 }), treino(7, 8), treino(9, undefined),
        treino(11, undefined, { tecnica: "RP" }), treino(14, 9),
      ], "UA")?.treinos).toBe(3);
    });

    it("a mesma peça em outra sessão com outra carga não apaga o alerta", () => {
      const lista = [treino(0, 7), treino(7, 8), treino(14, 9), treino(16, 7, { treinoId: "UB", topSetKg: 70 })];
      expect(detectarFadiga(lista, "UA")?.kg).toBe(100);
      expect(detectarFadiga(lista, "UB")).toBeNull();
    });

    it("sessão ainda sem histórico (planilha S2SEG) usa o último treino do exercício", () => {
      expect(detectarFadiga([treino(0, 7), treino(7, 8), treino(14, 9)], "S2SEG")?.rpeAtual).toBe(9);
    });

    it("deload no meio zera a contagem", () => {
      expect(detectarFadiga([treino(0, 7), treino(7, 8), treino(9, 6, { isDeload: true }), treino(14, 9)], "UA")).toBeNull();
    });

    it("ao mudar a carga, o alerta da carga antiga some", () => {
      expect(detectarFadiga([treino(0, 7), treino(7, 8), treino(14, 9), treino(21, 8, { topSetKg: 95 })], "UA")).toBeNull();
    });

    it("um deload depois da alta encerra o alerta", () => {
      expect(detectarFadiga([treino(0, 7), treino(7, 8), treino(14, 9), treino(21, 6, { isDeload: true })], "UA")).toBeNull();
    });

    it("só olha as últimas 6 semanas", () => {
      const lista = [treino(0, 7), treino(50, 8), treino(57, 8)];
      expect((lista[2]!.dataTs - lista[0]!.dataTs) / DIA).toBeGreaterThan(42);
      expect(detectarFadiga(lista, "UA")).toBeNull();
    });
  });
});
