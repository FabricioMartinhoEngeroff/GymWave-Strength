/**
 * storage → proteção contra perda de dados (EF_09 RG12, RG13)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  carregarDados, carregarRegistros, emTransacao, lerObjetoSalvo, ouvirDadosCorrompidos, salvarRegistro,
} from "../../utils/storage";
import { calcVolumeLoad } from "../../utils/volumeLoadCalc";
import { exerciciosDaSessao } from "../../components/treinoSessao/domain/sessoes";
import type { RegistroExercicio } from "../../types/TrainingData";

const REG: RegistroExercicio = {
  exercicio: "Supino reto barra", treinoId: "UA", data: "01/10/2026", dataTs: 1,
  topSetKg: 100, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
  backoffKg: 0, backoffReps: 0, backoffFaixaMin: 8, backoffFaixaMax: 10, seriesValidas: 2, progrediu: false,
};

describe("Dado ilegível nunca é sobrescrito (RG12)", () => {
  const ouvinte = vi.fn();
  let sair: () => void;
  beforeEach(() => { ouvinte.mockClear(); sair = ouvirDadosCorrompidos(ouvinte); });
  afterEach(() => sair());

  it("registros quebrado é copiado antes do próximo treino salvo", () => {
    localStorage.setItem("registros", "[{quebrado");
    salvarRegistro(REG);
    expect(localStorage.getItem("registros_corrompido")).toBe("[{quebrado");
    expect(carregarRegistros()).toHaveLength(1);
    expect(ouvinte).toHaveBeenCalledWith("registros");
  });

  it("registro inválido no meio da lista: guarda o original e mantém os bons", () => {
    salvarRegistro(REG);
    const bom = JSON.parse(localStorage.getItem("registros")!);
    const original = JSON.stringify([...bom, { lixo: true }]);
    localStorage.setItem("registros", original);
    expect(carregarRegistros()).toHaveLength(1);
    expect(localStorage.getItem("registros_corrompido")).toBe(original);
  });

  it("dadosTreino quebrado é copiado", () => {
    localStorage.setItem("dadosTreino", "nada");
    expect(carregarDados()).toEqual({});
    expect(localStorage.getItem("dadosTreino_corrompido")).toBe("nada");
  });

  it("uma segunda corrupção diferente não apaga a primeira cópia", () => {
    localStorage.setItem("registros", "[1");
    carregarRegistros();
    localStorage.setItem("registros", "[2");
    carregarRegistros();
    const copias = Object.keys(localStorage).filter((k) => k.startsWith("registros_corrompido")).map((k) => localStorage.getItem(k));
    expect(copias.sort()).toEqual(["[1", "[2"]);
  });

  it("avisa uma vez por conteúdo, mesmo lendo várias vezes", () => {
    localStorage.setItem("registros", "[1");
    carregarRegistros();
    carregarRegistros();
    expect(ouvinte).toHaveBeenCalledOnce();
  });

  it("dados bons não geram cópia", () => {
    salvarRegistro(REG);
    carregarRegistros();
    expect(localStorage.getItem("registros_corrompido")).toBeNull();
    expect(ouvinte).not.toHaveBeenCalled();
  });

  it("plano e sessões ilegíveis viram vazio, sem quebrar a tela", () => {
    localStorage.setItem("planoTreino", "{x");
    localStorage.setItem("sessoes_config", "{x");
    localStorage.setItem("dadosTreino", "{x");
    expect(lerObjetoSalvo("planoTreino")).toEqual({});
    expect(exerciciosDaSessao("Upper A").length).toBeGreaterThan(0);
    expect(calcVolumeLoad()).toEqual([]);
  });

  it("dadosTreino com miolo estragado: guarda o original, mantém o que presta e não quebra", () => {
    const bom = { data: "10/06/2026", pesos: ["100"], reps: ["8"] };
    const original = JSON.stringify({ Supino: null, Remada: { UA: null, UB: bom }, Rosca: "x" });
    localStorage.setItem("dadosTreino", original);
    expect(carregarDados()).toEqual({ Remada: { UB: bom } });
    expect(localStorage.getItem("dadosTreino_corrompido")).toBe(original);
    expect(() => calcVolumeLoad()).not.toThrow();
  });

  it("exercício do plano estragado é ignorado; os bons ficam", () => {
    const bom = { nome: "Supino", grupo: "", faixaTopSet: [5, 8], faixaBackoff: [8, 10], backoffPct: 0.9, seriesValidas: 2, cue: "" };
    localStorage.setItem("sessoes_config", JSON.stringify({ "Upper A": [null, {}, { nome: "Sem faixa" }, bom] }));
    localStorage.setItem("planoTreino", JSON.stringify({ "Upper A": { Supino: null } }));
    expect(exerciciosDaSessao("Upper A").map((e) => e.nome)).toEqual(["Supino"]);
  });

  it("sessão do plano com formato errado cai no padrão", () => {
    localStorage.setItem("sessoes_config", JSON.stringify({ "Upper A": "texto" }));
    expect(exerciciosDaSessao("Upper A").length).toBeGreaterThan(0);
  });
});

describe("Gravação tudo ou nada (RG13)", () => {
  it("falha no meio volta ao estado anterior e repassa o erro", () => {
    salvarRegistro(REG);
    localStorage.setItem("dadosTreino", '{"a":{}}');
    const antes = localStorage.getItem("registros");
    expect(() => emTransacao(() => {
      localStorage.removeItem("registros");
      localStorage.setItem("dadosTreino", "{}");
      localStorage.setItem("planoTreino", "{}");
      throw new Error("cheio");
    })).toThrow("cheio");
    expect(localStorage.getItem("registros")).toBe(antes);
    expect(localStorage.getItem("dadosTreino")).toBe('{"a":{}}');
    expect(localStorage.getItem("planoTreino")).toBeNull();
  });

  it("sem falha grava e devolve o resultado", () => {
    expect(emTransacao(() => { salvarRegistro(REG); return 7; })).toBe(7);
    expect(carregarRegistros()).toHaveLength(1);
  });
});
