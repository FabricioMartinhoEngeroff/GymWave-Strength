/**
 * estadoExercicio → domain
 * Regras puras de um exercício da sessão: espelho de peso, troca de modo e conclusão.
 */
import { describe, it, expect } from "vitest";
import {
  ativarCluster,
  ativarDeload,
  desativarCluster,
  desativarDeload,
  emptyExerciseState,
  espelharPesos,
  estadoInicial,
  exercicioConcluido,
  sanitizeExerciseState,
  seriesExtrasDoTopSet,
  statusTopSet,
  type ExerciseState,
} from "../../../../components/treinoSessao/domain/estadoExercicio";
import type { ExercicioSessao } from "../../../../data/sessionExercises";
import type { RegistroExercicio } from "../../../../types/TrainingData";

const EX: ExercicioSessao = {
  nome: "Supino reto barra", grupo: "Peitoral", faixaTopSet: [5, 8], faixaBackoff: [8, 10],
  backoffPct: 0.9, seriesValidas: 3, cue: "",
};

const ULTIMO: RegistroExercicio = {
  exercicio: EX.nome, treinoId: "UA", data: "01/10/2026", dataTs: 1,
  topSetKg: 100, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
  backoffKg: 97.5, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
  seriesValidas: 3, extraKg: 85, extraReps: 10, progrediu: false,
};

const TOP1 = { topSetKg: "100", topSetReps: "7", topSetConfirmed: true };
const TOP2 = { backoffKg: "100", backoffReps: "6", backoffConfirmed: true };

const estado = (over: Partial<ExerciseState> = {}): ExerciseState => ({ ...emptyExerciseState(), ...over });

describe("estadoExercicio — domain", () => {
  describe("espelharPesos (RG6/RG14)", () => {
    it("Top Set 2 copia o Top Set 1 e o Back-off parte de 90%", () => {
      expect(espelharPesos(estado({ seriesValidas: 3, topSetKg: "100" }), EX)).toEqual({
        backoffKg: "100", backoffKgIsSuggestion: true, extraKg: "90", extraKgIsSuggestion: true,
      });
    });

    it("não mexe no que já está igual (evita loop de render)", () => {
      expect(espelharPesos(estado({ seriesValidas: 3, topSetKg: "100", backoffKg: "100", extraKg: "90" }), EX)).toBeNull();
    });

    it("trava com valor próprio do usuário ou bloco confirmado", () => {
      const travado = estado({ seriesValidas: 3, topSetKg: "100", backoffKgWasUserEdited: true, extraKgWasUserEdited: true });
      expect(espelharPesos(travado, EX)).toBeNull();
      expect(espelharPesos(estado({ topSetKg: "100", backoffConfirmed: true }), EX)).toBeNull();
    });

    it("não espelha em Deload, em Cluster ou sem peso válido", () => {
      expect(espelharPesos(estado({ topSetKg: "100", isDeload: true }), EX)).toBeNull();
      expect(espelharPesos(estado({ topSetKg: "100", tecnica: "RP" }), EX)).toBeNull();
      expect(espelharPesos(estado({ topSetKg: "0" }), EX)).toBeNull();
    });
  });

  describe("troca de modo (RG15/RG16)", () => {
    it("ativar Cluster limpa os Top Sets, sai do Deload e abre os blocos do plano", () => {
      const s = { ...estado({ topSetKg: "100", isDeload: true, topSetConfirmed: true }), ...ativarCluster(estado(), { ...EX, clusterBlocos: 6 }) };
      expect(s).toMatchObject({ tecnica: "RP", isDeload: false, topSetKg: "", topSetConfirmed: false });
      expect(s.clusterSeries).toHaveLength(6);
      expect(s.clusterSeries2).toHaveLength(6);
    });

    it("Cluster com 1 válida não abre a Série 2", () => {
      expect(ativarCluster(estado({ seriesValidas: 1 }), EX).clusterSeries2).toEqual([]);
    });

    it("desativar Cluster devolve os Top Sets do logbook", () => {
      expect(desativarCluster(estado({ tecnica: "RP" }), EX, ULTIMO)).toMatchObject({
        tecnica: null, topSetKg: "100", topSetReps: "7", backoffKg: "97.5", backoffKgWasUserEdited: true,
      });
    });

    it("Deload limpa o Top Set 2; desativar devolve o do logbook", () => {
      expect(ativarDeload(estado(), EX, ULTIMO)).toMatchObject({ isDeload: true, tecnica: null, backoffKg: "", backoffReps: "" });
      expect(desativarDeload(estado({ isDeload: true }), EX, ULTIMO)).toMatchObject({ isDeload: false, backoffKg: "97.5", backoffReps: "6" });
      expect(desativarDeload(estado({ isDeload: true }), EX, null)).toMatchObject({ isDeload: false, backoffKg: "" });
    });
  });

  it("Deload não mexe no Top Set 1; vindo do Cluster devolve o do último treino (RG15)", () => {
    expect(ativarDeload(estado({ topSetKg: "80" }), EX, ULTIMO)).not.toHaveProperty("topSetKg");
    expect(ativarDeload(estado({ tecnica: "RP" }), EX, ULTIMO)).toMatchObject({ topSetKg: "100", topSetReps: "7" });
  });

  it("Deload não tem status de teto/faixa (RG15)", () => {
    expect(statusTopSet(EX, estado({ ...TOP1, topSetReps: "8", isDeload: true }))).toBeNull();
  });

  it("4 válidas: séries extras só são sugeridas se o atleta ainda não mexeu nelas (RG5.1)", () => {
    expect(seriesExtrasDoTopSet(estado({ seriesValidas: 4 }), 100, 7)).toMatchObject({ extraKg: "100", serie4Reps: "7" });
    expect(seriesExtrasDoTopSet(estado({ seriesValidas: 4, extraKgWasUserEdited: true }), 100, 7)).toEqual({});
  });

  it.each([
    ["pulado", { skipped: true }, true],
    ["vazio", {}, false],
    ["2 válidas só com Top Set 1", TOP1, false],
    ["2 válidas completo", { ...TOP1, ...TOP2 }, true],
    ["Top Set 1 confirmado e depois zerado", { ...TOP1, ...TOP2, topSetReps: "0" }, false],
    ["Top Set 2 apagado = não feito", { ...TOP1, backoffKg: "", backoffReps: "", backoffKgWasUserEdited: true }, true],
    ["Top Set 2 zerado = não feito", { ...TOP1, backoffKg: "0", backoffReps: "0", backoffKgWasUserEdited: true }, true],
    ["Top Set 2 só com peso", { ...TOP1, backoffKg: "100", backoffReps: "", backoffKgWasUserEdited: true }, false],
    ["1 válida com Top Set 1", { ...TOP1, seriesValidas: 1 }, true],
    ["deload com Top Set 1", { ...TOP1, isDeload: true }, true],
    ["cluster sem confirmar", { ...TOP1, tecnica: "RP" }, false],
    ["cluster confirmado", { tecnica: "RP", tecnicaConfirmed: true }, true],
  ] as const)("exercicioConcluido: %s → %s", (_nome, over, esperado) => {
    expect(exercicioConcluido(estado(over as Partial<ExerciseState>))).toBe(esperado);
  });

  it.each([
    [6, [7, 8], "teto"], [8, [7, 8], "teto"], [9, [7, 8], "consolidar"], [10, [7, 8], "consolidar"], [null, [7, 8], "teto"],
    [9, [9, 10], "teto"], [10, [9, 10], "teto"],
  ] as const)("teto com RPE %s e alvo %j → %s (RG21)", (rpe, alvo, esperado) => {
    const ex = { ...EX, rpeAlvo: [alvo[0], alvo[1]] as [number, number] };
    expect(statusTopSet(ex, estado({ topSetConfirmed: true, topSetReps: "8", topSetRpe: rpe }))).toBe(esperado);
  });

  it("o RPE nunca vem do último treino e zera ao trocar de modo", () => {
    expect(estadoInicial(EX, { ...ULTIMO, topSetRpe: 9, backoffRpe: 10 })).toMatchObject({ topSetRpe: null, backoffRpe: null });
    expect(ativarCluster(estado({ topSetRpe: 9 }), EX)).toMatchObject({ topSetRpe: null, backoffRpe: null });
    expect(desativarCluster(estado({ clusterRpe: 9 }), EX, ULTIMO)).toMatchObject({ clusterRpe: null, clusterRpe2: null, topSetRpe: null });
    expect(ativarDeload(estado(), EX, ULTIMO)).toMatchObject({ backoffRpe: null, clusterRpe: null });
  });

  it("rascunho antigo (sem RPE) ou com RPE inválido abre com RPE vazio", () => {
    expect(sanitizeExerciseState({ topSetKg: "90" }).topSetRpe).toBeNull();
    expect(sanitizeExerciseState({ topSetRpe: 42, backoffRpe: 8 })).toMatchObject({ topSetRpe: null, backoffRpe: 8 });
  });

  it("rascunho com meio ponto volta vazio: a tela não tem mais esse botão (RG20)", () => {
    expect(sanitizeExerciseState({ topSetRpe: 7.5, backoffRpe: 8.5, extraRpe: 9.5 })).toMatchObject({ topSetRpe: null, backoffRpe: null, extraRpe: null });
  });

  it.each([["8", "teto"], ["6", "faixa"], ["4", "abaixo"], ["", null]])("statusTopSet com %s reps → %s", (reps, esperado) => {
    expect(statusTopSet(EX, estado({ topSetConfirmed: true, topSetReps: reps }))).toBe(esperado);
  });

  it("sanitizeExerciseState completa rascunho antigo ou corrompido", () => {
    const s = sanitizeExerciseState({ topSetKg: "90", clusterSeries: null, seriesValidas: 9 } as unknown as Partial<ExerciseState>);
    expect(s).toMatchObject({ topSetKg: "90", clusterSeries: [], seriesValidas: 2, clusterActiveSerie: 1 });
  });
});
