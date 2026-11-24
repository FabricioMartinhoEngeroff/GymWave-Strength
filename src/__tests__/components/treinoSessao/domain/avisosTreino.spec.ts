/**
 * avisosTreino → domain
 * Avisos do card "Último treino": textos, prioridade e cor (EF_02 RG21, RG22, RG29 e RG30).
 */
import { describe, it, expect } from "vitest";
import { avisosDoTreino, type AvisoTreino } from "../../../../components/treinoSessao/domain/avisosTreino";
import type { RegistroExercicio } from "../../../../types/TrainingData";
import type { FaixaRpe } from "../../../../utils/esforco";

const PESADO: FaixaRpe = [7, 8];
const REGRESSAO = { kg: 40, reps: [10, 9, 8] };
const FADIGA = { kg: 40, rpeInicial: 9, rpeAtual: 10, treinos: 3 };

const treino = (over: Partial<RegistroExercicio> = {}): RegistroExercicio => ({
  exercicio: "Supino reto barra", treinoId: "UA", data: "01/10/2026", dataTs: 0,
  topSetKg: 40, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
  backoffKg: 40, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
  seriesValidas: 2, progrediu: false, ...over,
});
const noTeto = (topSetRpe?: number) => treino({ topSetReps: 8, topSetBateuTeto: true, topSetRpe });

type Entrada = Parameters<typeof avisosDoTreino>[0];
const avisos = (over: Partial<Entrada> = {}) =>
  avisosDoTreino({ ultimo: treino(), fadiga: null, regressao: null, rpeAlvo: PESADO, escala: "RPE", ...over });
const tipos = (lista: AvisoTreino[]) => lista.map((a) => a.tipo);
const texto = (over: Partial<Entrada>) => avisos(over)[0]?.texto;

describe("avisosDoTreino (RG29)", () => {
  it("sem nada a dizer, lista vazia", () => expect(avisos()).toEqual([]));

  describe("textos exatos", () => {
    it.each<[string, Partial<Entrada>, string]>([
      ["subir", { ultimo: noTeto(8) }, "Bateu o teto de reps dentro do alvo (RPE 8). Dá para subir a carga."],
      ["subir em RIR", { ultimo: noTeto(8), escala: "RIR" }, "Bateu o teto de reps dentro do alvo (RIR 2). Dá para subir a carga."],
      ["subir sem RPE (registro antigo)", { ultimo: noTeto() }, "Bateu o teto de reps. Dá para subir a carga."],
      ["consolidar", { ultimo: noTeto(10) }, "Teto de reps com esforço acima do alvo (RPE 10, alvo 7–8): carga em consolidação."],
      ["consolidar em RIR", { ultimo: noTeto(10), escala: "RIR" }, "Teto de reps com esforço acima do alvo (RIR 0, alvo 2–3): carga em consolidação."],
      ["fadiga", { fadiga: FADIGA }, "Mesma carga (40 kg), esforço subindo: RPE 9 → 10 em 3 treinos."],
      ["fadiga em RIR", { fadiga: FADIGA, escala: "RIR" }, "Mesma carga (40 kg), esforço subindo: RIR 1 → 0 em 3 treinos."],
      ["fadiga com meio quilo", { fadiga: { ...FADIGA, kg: 62.5 } }, "Mesma carga (62.5 kg), esforço subindo: RPE 9 → 10 em 3 treinos."],
      ["regressão", { regressao: REGRESSAO }, "Mesma carga (40 kg), reps caindo: 10 → 9 → 8 em 3 treinos."],
      ["regressão em RIR é igual", { regressao: REGRESSAO, escala: "RIR" }, "Mesma carga (40 kg), reps caindo: 10 → 9 → 8 em 3 treinos."],
      ["regressão longa", { regressao: { kg: 62.5, reps: [11, 10, 9, 8] } }, "Mesma carga (62.5 kg), reps caindo: 11 → 10 → 9 → 8 em 4 treinos."],
      ["primeiro registro", { ultimo: null }, "Primeiro registro deste exercício nesta sessão."],
    ])("%s", (_n, entrada, esperado) => expect(texto(entrada)).toBe(esperado));
  });

  it("o limite do alvo é o valor de cima: RPE 8 sobe, RPE 8.5 consolida", () => {
    expect(tipos(avisos({ ultimo: noTeto(8) }))).toEqual(["subir"]);
    expect(tipos(avisos({ ultimo: noTeto(8.5) }))).toEqual(["consolidar"]);
  });

  describe("prioridade: subir > fadiga/regressão > informativo", () => {
    it.each<[string, Partial<Entrada>, string[]]>([
      ["subir e fadiga", { ultimo: noTeto(10), rpeAlvo: [9, 10], fadiga: FADIGA }, ["subir", "fadiga"]],
      ["subir e regressão", { ultimo: noTeto(10), rpeAlvo: [9, 10], regressao: REGRESSAO }, ["subir", "regressao"]],
      ["regressão e consolidar", { ultimo: noTeto(9), regressao: REGRESSAO }, ["regressao", "consolidar"]],
      ["regressão e primeiro registro", { ultimo: null, regressao: REGRESSAO }, ["regressao", "primeiro"]],
      ["fadiga e consolidar", { ultimo: noTeto(9), fadiga: FADIGA }, ["fadiga", "consolidar"]],
      ["fadiga de outra sessão e primeiro registro nesta", { ultimo: null, fadiga: FADIGA }, ["fadiga", "primeiro"]],
    ])("%s", (_n, entrada, esperado) => expect(tipos(avisos(entrada))).toEqual(esperado));
  });

  it.each<[string, Partial<Entrada>, AvisoTreino["tom"], string]>([
    ["subir", { ultimo: noTeto(8) }, "verde", "↑"],
    ["fadiga", { fadiga: FADIGA }, "ambar", "!"],
    ["regressao", { regressao: REGRESSAO }, "ambar", "!"],
    ["consolidar", { ultimo: noTeto(9) }, "azul", "i"],
    ["primeiro", { ultimo: null }, "azul", "i"],
  ])("cor e marca: %s", (tipo, entrada, tom, marca) => expect(avisos(entrada)[0]).toMatchObject({ tipo, tom, marca }));

  it("nenhum texto dá ordem", () => {
    const todos = [noTeto(8), noTeto(), noTeto(9), treino(), null].flatMap((ultimo) => avisos({ ultimo, fadiga: FADIGA, regressao: REGRESSAO }));
    for (const { texto: t } of todos) expect(t).not.toMatch(/deload|considere|subir peso|consolidar|defina|hoje|deve|repet/i);
  });
});
