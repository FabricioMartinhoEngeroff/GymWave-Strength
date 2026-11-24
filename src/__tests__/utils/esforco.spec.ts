/**
 * esforco → utils
 * RPE/RIR: escala, rótulos, esforço alvo, progressão e detecção de fadiga (EF_02 RG20 a RG22 e RG28).
 */
import { describe, it, expect } from "vitest";
import {
  deveSubirPeso, ALERTA_MIN_DIAS, detectarFadiga, detectarRegressao, faixaAlvo, normalizarRpe, opcoesDeEsforco, passouDoAlvo, rotuloAlvo, rotuloChip, rotuloEsforco,
  rpeDaTela, RPES, type FaixaRpe,
} from "../../utils/esforco";
import type { RegistroExercicio } from "../../types/TrainingData";

const PESADO: FaixaRpe = [7, 8]; // agacho, supino, terra
const ISOLADOR: FaixaRpe = [9, 10]; // máquinas, cabos, isoladores

describe("esforco — utils", () => {
  describe("normalizarRpe", () => {
    it.each([6, 6.5, 7, 8.5, 10])("aceita %s", (v) => expect(normalizarRpe(v)).toBe(v));
    it.each([5.5, 10.5, 8.2, NaN, "8", null, undefined, {}])("recusa %s", (v) => expect(normalizarRpe(v)).toBeUndefined());
  });

  describe("escala da tela: só valores inteiros (RG20)", () => {
    it("RPE: ≤6, 7, 8, 9, 10", () => {
      expect(opcoesDeEsforco("RPE")).toEqual([6, 7, 8, 9, 10]);
      expect(opcoesDeEsforco("RPE").map((r) => rotuloChip(r, "RPE"))).toEqual(["≤6", "7", "8", "9", "10"]);
    });

    it("RIR: 0, 1, 2, 3, 4+ (nessa ordem)", () => {
      expect(opcoesDeEsforco("RIR").map((r) => rotuloChip(r, "RIR"))).toEqual(["0", "1", "2", "3", "4+"]);
    });

    it("inverter para RIR não altera a lista original", () => {
      opcoesDeEsforco("RIR");
      expect(RPES).toEqual([6, 7, 8, 9, 10]);
    });

    it.each([6, 7, 8, 9, 10])("rpeDaTela aceita %s", (v) => expect(rpeDaTela(v)).toBe(v));
    it.each([6.5, 7.5, 8.5, 9.5, 5, 11, "8", null, undefined])("rpeDaTela: %s volta vazio", (v) => expect(rpeDaTela(v)).toBeNull());
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

  describe("passouDoAlvo (RG28): o limite é o valor de cima da faixa", () => {
    it.each([
      [6, PESADO, false], [7, PESADO, false], [8, PESADO, false], [8.5, PESADO, true], [9, PESADO, true], [10, PESADO, true],
      [8, ISOLADOR, false], [9, ISOLADOR, false], [10, ISOLADOR, false],
    ] as const)("RPE %s com alvo %j → %s", (rpe, alvo, esperado) => expect(passouDoAlvo(rpe, alvo)).toBe(esperado));
  });

  describe("rotuloAlvo", () => {
    it.each([
      [PESADO, "RPE", "RPE 7–8"], [PESADO, "RIR", "RIR 2–3"],
      [ISOLADOR, "RPE", "RPE 9–10"], [ISOLADOR, "RIR", "RIR 0–1"],
      [[8, 8], "RPE", "RPE 8"], [[8, 8], "RIR", "RIR 2"],
    ] as const)("%j em %s → %s", (alvo, escala, esperado) => expect(rotuloAlvo(alvo, escala)).toBe(esperado));
  });

  it("faixaAlvo: só os números, na escala", () => {
    expect(faixaAlvo([7, 8], "RPE")).toBe("7–8");
    expect(faixaAlvo([7, 8], "RIR")).toBe("2–3");
  });

  describe("deveSubirPeso (progressão pelo esforço alvo, RG21)", () => {
    it.each([
      ["pesado: teto abaixo do alvo", true, 6, PESADO, true],
      ["pesado: teto dentro do alvo", true, 7, PESADO, true],
      ["pesado: teto no limite do alvo", true, 8, PESADO, true],
      ["pesado: teto acima do alvo", true, 9, PESADO, false],
      ["pesado: teto na falha", true, 10, PESADO, false],
      ["pesado: meio ponto antigo acima do alvo", true, 8.5, PESADO, false],
      ["isolador: teto com RPE 8", true, 8, ISOLADOR, true],
      ["isolador: teto com RPE 9", true, 9, ISOLADOR, true],
      ["isolador: teto na falha (limite do alvo)", true, 10, ISOLADOR, true],
      ["teto sem RPE (registro antigo)", true, undefined, PESADO, true],
      ["sem teto, mesmo fácil", false, 6, PESADO, false],
      ["sem teto e sem RPE", false, undefined, ISOLADOR, false],
    ] as const)("%s", (_n, teto, rpe, alvo, esperado) => {
      expect(deveSubirPeso(teto, rpe, alvo)).toBe(esperado);
    });
  });

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

  describe("detectarFadiga", () => {
    const alerta = (rpes: (number | undefined)[], alvo: FaixaRpe = PESADO) =>
      detectarFadiga(rpes.map((rpe, i) => treino(i * 7, rpe)), "UA", alvo);

    it("mesma carga e reps, esforço acima do alvo em 2 treinos seguidos", () => {
      expect(alerta([8, 9, 9])).toEqual({ kg: 100, rpeInicial: 8, rpeAtual: 9, treinos: 3 });
    });

    it.each([
      ["pesado: subiu e continuou subindo", [8, 9, 10], PESADO],
      ["pesado: vinha subindo dentro do alvo e passou 2 vezes", [7, 8, 9, 9], PESADO],
      ["pesado: continua alto no terceiro treino", [8, 9, 9, 9], PESADO],
      ["pesado: de 9 para 10", [9, 10, 10], PESADO],
      ["isolador: de 9 para 10", [9, 10, 10], ISOLADOR],
      ["isolador: de 8 para a falha", [8, 10, 10], ISOLADOR],
      ["meio ponto antigo acima do alvo", [7, 8.5, 9], PESADO],
    ])("alerta: %s", (_n, rpes, alvo) => expect(alerta(rpes, alvo)).not.toBeNull());

    it.each([
      ["um dia ruim só", [8, 9], PESADO],
      ["um dia ruim depois de estável", [8, 8, 9], PESADO],
      ["um dia ruim e voltou ao normal", [8, 9, 8], PESADO],
      ["RPE caiu no último treino, ainda acima do alvo", [8, 10, 9], PESADO],
      ["subiu, mas dentro do alvo", [6, 7, 8], PESADO],
      ["subiu até o limite do alvo e ficou", [7, 8, 8], PESADO],
      ["passou do alvo só no último treino", [7, 8, 9], PESADO],
      ["acima do alvo, mas estável", [9, 9, 9], PESADO],
      ["alta menor que 1 ponto", [8, 8.5, 8.5], PESADO],
      ["isolador: chegou à falha só uma vez", [8, 9, 10], ISOLADOR],
      ["isolador: subiu dentro do alvo", [8, 9, 9], ISOLADOR],
      ["isolador: sempre na falha", [10, 10, 10], ISOLADOR],
      ["sem RPE", [undefined, undefined, undefined], PESADO],
      ["histórico vazio", [], PESADO],
    ])("não alerta: %s", (_n, rpes, alvo) => expect(alerta(rpes, alvo)).toBeNull());

    it("a ordem da lista não importa", () => {
      expect(detectarFadiga([treino(14, 10), treino(0, 8), treino(7, 9)], "UA", PESADO)?.rpeAtual).toBe(10);
    });

    it.each([
      ["mais reps (progresso)", 8, 9],
      ["menos reps", 6, 6],
    ])("reps diferentes não entram na comparação: %s", (_n, reps2, reps3) => {
      expect(detectarFadiga([treino(0, 8), treino(7, 9, { topSetReps: reps2 }), treino(14, 10, { topSetReps: reps3 })], "UA", PESADO)).toBeNull();
    });

    it("tudo na mesma semana não alerta", () => {
      expect(detectarFadiga([treino(0, 8), treino(2, 9), treino(4, 9)], "UA", PESADO)).toBeNull();
    });

    it("ignora outra carga, cluster e treino sem RPE no meio da sequência", () => {
      expect(detectarFadiga([
        treino(0, 8), treino(3, 6, { topSetKg: 60 }), treino(7, 9), treino(9, undefined),
        treino(11, undefined, { tecnica: "RP" }), treino(14, 9),
      ], "UA", PESADO)?.treinos).toBe(3);
    });

    it("a mesma peça em outra sessão com outra carga não apaga o alerta", () => {
      const lista = [treino(0, 8), treino(7, 9), treino(14, 9), treino(16, 7, { treinoId: "UB", topSetKg: 70 })];
      expect(detectarFadiga(lista, "UA", PESADO)?.kg).toBe(100);
      expect(detectarFadiga(lista, "UB", PESADO)).toBeNull();
    });

    it("sessão ainda sem histórico (planilha S2SEG) usa o último treino do exercício", () => {
      expect(detectarFadiga([treino(0, 8), treino(7, 9), treino(14, 9)], "S2SEG", PESADO)?.rpeAtual).toBe(9);
    });

    it("deload no meio zera a contagem", () => {
      expect(detectarFadiga([treino(0, 8), treino(7, 9), treino(9, 6, { isDeload: true }), treino(14, 9)], "UA", PESADO)).toBeNull();
    });

    it("ao mudar a carga, o alerta da carga antiga some", () => {
      expect(detectarFadiga([treino(0, 8), treino(7, 9), treino(14, 9), treino(21, 8, { topSetKg: 95 })], "UA", PESADO)).toBeNull();
    });

    it("um deload depois da alta encerra o alerta", () => {
      expect(detectarFadiga([treino(0, 8), treino(7, 9), treino(14, 9), treino(21, 6, { isDeload: true })], "UA", PESADO)).toBeNull();
    });

    it("só olha as últimas 6 semanas", () => {
      const lista = [treino(0, 8), treino(50, 9), treino(62, 9)];
      expect((lista[2]!.dataTs - lista[0]!.dataTs) / DIA).toBeGreaterThan(42);
      expect(detectarFadiga(lista, "UA", PESADO)).toBeNull();
    });
  });

  describe("detectarRegressao (RG30)", () => {
    /** Um treino por semana com as reps (e RPEs) dadas. */
    const semanal = (reps: number[], rpes: (number | undefined)[] = reps.map(() => 9), passo = 7) =>
      reps.map((topSetReps, i) => treino(i * passo, rpes[i], { topSetReps }));
    const alerta = (...args: Parameters<typeof semanal>) => detectarRegressao(semanal(...args), "UA");

    it("mesma carga, reps caindo em 2 treinos seguidos com RPE 9 ou 10", () => {
      expect(alerta([10, 9, 8], [9, 9, 10])).toEqual({ kg: 100, reps: [10, 9, 8] });
    });

    it.each<[string, number[], (number | undefined)[] | undefined, number[]]>([
      ["4 treinos caindo", [11, 10, 9, 8], undefined, [11, 10, 9, 8]],
      ["estável antes da queda", [10, 10, 9, 8], undefined, [10, 9, 8]],
      ["subiu antes da queda", [8, 10, 9, 8], undefined, [10, 9, 8]],
      ["queda de mais de 1 rep", [12, 9, 5], undefined, [12, 9, 5]],
      ["RPE baixo só no treino que abriu", [10, 9, 8], [6, 9, 9], [10, 9, 8]],
      ["meio ponto antigo", [10, 9, 8], [9, 9.5, 9.5], [10, 9, 8]],
    ])("alerta: %s", (_n, reps, rpes, esperado) => expect(alerta(reps, rpes)?.reps).toEqual(esperado));

    it.each<[string, number[], (number | undefined)[] | undefined]>([
      ["RPE 8 no último", [10, 9, 8], [9, 9, 8]],
      ["RPE 8 no penúltimo", [10, 9, 8], [9, 8, 9]],
      ["RPE 8.5 no último", [10, 9, 8], [9, 9, 8.5]],
      ["só 2 treinos", [10, 8], undefined],
      ["1 queda só", [10, 10, 9], undefined],
      ["caiu e estabilizou", [10, 9, 9], undefined],
      ["caiu e recuperou", [10, 8, 9], undefined],
      ["caiu duas vezes e recuperou", [10, 9, 8, 9], undefined],
      ["estável", [9, 9, 9], undefined],
      ["reps subindo", [8, 9, 10], undefined],
      ["sem RPE", [10, 9, 8], [undefined, undefined, undefined]],
      ["histórico vazio", [], undefined],
    ])("não alerta: %s", (_n, reps, rpes) => expect(alerta(reps, rpes)).toBeNull());

    it("mínimo de dias é o mesmo da fadiga: 10 alerta, 9 não", () => {
      expect(ALERTA_MIN_DIAS).toBe(10);
      const caindo = (total: number) => [treino(0, 9, { topSetReps: 10 }), treino(4, 9, { topSetReps: 9 }), treino(total, 9, { topSetReps: 8 })];
      expect(detectarRegressao(caindo(ALERTA_MIN_DIAS - 1), "UA")).toBeNull();
      expect(detectarRegressao(caindo(ALERTA_MIN_DIAS), "UA")).not.toBeNull();
      const pesando = (total: number) => [treino(0, 8), treino(4, 9), treino(total, 9)];
      expect(detectarFadiga(pesando(ALERTA_MIN_DIAS - 1), "UA", PESADO)).toBeNull();
      expect(detectarFadiga(pesando(ALERTA_MIN_DIAS), "UA", PESADO)).not.toBeNull();
    });

    it("exercício em duas sessões: uma semana ruim sozinha não alerta, duas alertam", () => {
      const lista = [0, 3, 7, 10].map((dia, i) => treino(dia, 9, { topSetReps: 12 - i, treinoId: i % 2 ? "UB" : "UA" }));
      expect(detectarRegressao(lista.slice(0, 3), "UA")).toBeNull();
      expect(detectarRegressao(lista, "UA")?.reps).toEqual([12, 11, 10, 9]);
      expect(detectarRegressao(lista, "UB")?.reps).toEqual([12, 11, 10, 9]);
    });

    it("janela de 42 dias: o treino a 42 entra, a 43 não", () => {
      const lista = (primeiro: number) => [treino(primeiro, 9, { topSetReps: 10 }), treino(35, 9, { topSetReps: 9 }), treino(42, 9, { topSetReps: 8 })];
      expect(detectarRegressao(lista(0), "UA")?.reps).toEqual([10, 9, 8]);
      expect(detectarRegressao(lista(-1), "UA")).toBeNull();
    });

    it("deload no meio ou no fim zera a contagem", () => {
      const [a, b, c] = semanal([10, 9, 8]) as [RegistroExercicio, RegistroExercicio, RegistroExercicio];
      expect(detectarRegressao([a, treino(3, 6, { isDeload: true }), b, c], "UA")).toBeNull();
      expect(detectarRegressao([a, b, c, treino(20, 6, { isDeload: true })], "UA")).toBeNull();
      expect(detectarRegressao([treino(-3, 6, { isDeload: true }), a, b, c], "UA")).not.toBeNull();
    });

    it("mudar a carga encerra o alerta", () => {
      expect(detectarRegressao([...semanal([10, 9, 8]), treino(21, 9, { topSetKg: 95, topSetReps: 10 })], "UA")).toBeNull();
    });

    it("ignora outra carga, cluster, treino sem RPE e sem reps no meio", () => {
      expect(detectarRegressao([
        ...semanal([10, 9, 8]), treino(2, 9, { topSetKg: 60, topSetReps: 15 }), treino(4, undefined, { tecnica: "RP", topSetReps: 4 }),
        treino(9, undefined, { topSetReps: 12 }), treino(11, 9, { topSetReps: 0 }),
      ], "UA")?.reps).toEqual([10, 9, 8]);
    });

    it("outra sessão com outra carga não apaga o alerta; sessão sem histórico usa o último treino", () => {
      const lista = [...semanal([10, 9, 8]), treino(16, 9, { treinoId: "UB", topSetKg: 70 })];
      expect(detectarRegressao(lista, "UA")?.kg).toBe(100);
      expect(detectarRegressao(lista, "UB")).toBeNull();
      expect(detectarRegressao(semanal([10, 9, 8]), "S2SEG")?.kg).toBe(100);
    });

    it("a ordem da lista não importa", () => {
      const [a, b, c] = semanal([10, 9, 8]) as [RegistroExercicio, RegistroExercicio, RegistroExercicio];
      expect(detectarRegressao([c, a, b], "UA")?.reps).toEqual([10, 9, 8]);
    });

    it("nunca junto com a fadiga", () => {
      const reps = [7, 8, 9, 10], rpes = [8, 9, 10];
      for (const r1 of reps) for (const r2 of reps) for (const r3 of reps)
        for (const e1 of rpes) for (const e2 of rpes) for (const e3 of rpes) {
          const lista = semanal([r1, r2, r3], [e1, e2, e3]);
          expect(detectarFadiga(lista, "UA", PESADO) && detectarRegressao(lista, "UA")).toBeNull();
        }
    });
  });
});
