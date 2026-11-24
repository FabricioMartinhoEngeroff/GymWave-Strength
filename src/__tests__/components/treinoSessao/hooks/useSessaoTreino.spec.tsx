/**
 * useSessaoTreino → hooks
 * Orquestra a sessão: sugestão do logbook, espelho de peso, rascunho e salvamento.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSessaoTreino } from "../../../../components/treinoSessao/hooks/useSessaoTreino";
import { carregarRegistros, salvarRegistro } from "../../../../utils/storage";
import type { RegistroExercicio } from "../../../../types/TrainingData";

const EX = "Supino reto barra";

function abrir(sessao = "Upper A") {
  const hook = renderHook(() => useSessaoTreino());
  act(() => hook.result.current.alternarSessao(sessao));
  return hook;
}

const registro = (over: Partial<RegistroExercicio> = {}): RegistroExercicio => ({
  exercicio: EX, treinoId: "UA", data: "01/10/2026", dataTs: new Date(2026, 9, 1).getTime(),
  topSetKg: 100, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
  backoffKg: 97.5, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
  seriesValidas: 2, progrediu: false, ...over,
});

describe("useSessaoTreino — hook", () => {
  beforeEach(() => localStorage.clear());

  it("sugestão: abre com peso e reps exatos do último treino", () => {
    salvarRegistro(registro());
    const { result } = abrir();
    expect(result.current.state).toMatchObject({ topSetKg: "100", topSetReps: "7", backoffKg: "97.5", backoffReps: "6" });
  });

  it("sugestão: nenhum aviso muda o valor do campo (teto, fadiga) — RG5.1", () => {
    salvarRegistro(registro({ topSetReps: 8, topSetBateuTeto: true }));
    const { result } = abrir();
    expect(result.current.state).toMatchObject({ topSetKg: "100", topSetReps: "8", backoffKg: "97.5" });
  });

  it("sugestão: depois de um deload abre com o último treino normal (RG15)", () => {
    salvarRegistro(registro());
    salvarRegistro(registro({ data: "08/10/2026", dataTs: new Date(2026, 9, 8).getTime(), topSetKg: 60, topSetReps: 10, backoffKg: 0, backoffReps: 0, isDeload: true }));
    const { result } = abrir();
    expect(result.current.state).toMatchObject({ topSetKg: "100", topSetReps: "7", backoffKg: "97.5", backoffReps: "6" });
    expect(result.current.ultimo?.isDeload).toBeFalsy();
  });

  it("exercício pulado não grava; se voltar e confirmar, grava (RG11)", () => {
    const { result } = abrir();
    act(() => result.current.editarTopSet({ topSetKg: "100", topSetReps: "8" }));
    act(() => result.current.skipExercise());
    act(() => result.current.prevExercise());
    expect(result.current.state.skipped).toBe(true);
    act(() => result.current.confirmTopSet());
    expect(result.current.state.skipped).toBe(false);
    act(() => result.current.salvar());
    expect(carregarRegistros()).toHaveLength(1);
  });

  it("pulado com sugestão nos campos não grava peso nem reps (RG11)", () => {
    salvarRegistro(registro());
    const { result } = abrir();
    act(() => result.current.skipExercise());
    act(() => result.current.salvar());
    expect(carregarRegistros()).toHaveLength(1); // só o histórico
    expect(result.current.resumo?.feitos).toBe(0);
  });

  it("Top Set 2 apagado avança sem aviso e grava só o Top Set 1 (RG24)", () => {
    const { result } = abrir();
    act(() => result.current.editarTopSet({ topSetKg: "100", topSetReps: "8" }));
    act(() => result.current.confirmTopSet());
    act(() => result.current.editarTopSet2({ backoffKg: "", backoffKgWasUserEdited: true }));
    act(() => result.current.editarTopSet({ topSetRpe: 8 }));
    act(() => result.current.avancar());
    expect(result.current.currentIdx).toBe(1);
    act(() => result.current.salvar());
    expect(carregarRegistros()[0]?.series).toEqual([{ tipo: "top1", kg: 100, reps: 8, rpe: 8 }]);
  });

  it("Top Set confirmado e depois zerado volta a pedir preenchimento (RG24)", () => {
    const { result } = abrir();
    act(() => result.current.editarTopSet({ topSetKg: "100", topSetReps: "8" }));
    act(() => result.current.confirmTopSet());
    act(() => result.current.editarTopSet({ topSetReps: "0" }));
    act(() => result.current.avancar());
    expect(result.current.currentIdx).toBe(0);
    expect(result.current.avisos.topSet).toBe(true);
    expect(result.current.state.topSetConfirmed).toBe(false);
  });

  it("deload no teto não dispara PR nem conta como subir peso (RG15)", () => {
    const { result } = abrir();
    act(() => result.current.alternarDeload());
    act(() => result.current.editarTopSet({ topSetKg: "100", topSetReps: "8" }));
    expect(result.current.prAtivo).toBe(false);
    act(() => result.current.confirmTopSet());
    expect(result.current.state.prConfirmado).toBe(false);
    act(() => result.current.salvar());
    expect(result.current.resumo).toMatchObject({ feitos: 1, subirPeso: 0 });
  });

  it("espelho: Top Set 2 acompanha o Top Set 1 até o usuário digitar", () => {
    const { result } = abrir();
    act(() => result.current.editarTopSet({ topSetKg: "80" }));
    expect(result.current.state.backoffKg).toBe("80");
    act(() => result.current.editarTopSet2({ backoffKg: "75", backoffKgWasUserEdited: true }));
    act(() => result.current.editarTopSet({ topSetKg: "82" }));
    expect(result.current.state.backoffKg).toBe("75");
  });

  it("rascunho: volta ao trocar de sessão e ao remontar", () => {
    const { result, unmount } = abrir();
    act(() => result.current.editarTopSet({ topSetKg: "80" }));
    act(() => result.current.alternarSessao("Lower A"));
    act(() => result.current.alternarSessao("Upper A"));
    expect(result.current.state.topSetKg).toBe("80");
    unmount();
    expect(abrir().result.current.state.topSetKg).toBe("80");
  });

  it("avisos: avançar sem confirmar sinaliza e trocar de exercício limpa", () => {
    const { result } = abrir();
    act(() => result.current.avancar());
    expect(result.current.avisos.topSet).toBe(true);
    expect(result.current.currentIdx).toBe(0);
    act(() => result.current.skipExercise());
    expect(result.current.currentIdx).toBe(1);
    expect(result.current.avisos.topSet).toBe(false);
  });

  it("avisos: série feita sem esforço não avança; marcar libera (RG27)", () => {
    const { result } = abrir();
    act(() => result.current.editarTopSet({ topSetKg: "100", topSetReps: "7" }));
    act(() => result.current.confirmTopSet());
    act(() => result.current.editarTopSet2({ backoffReps: "6" }));
    act(() => result.current.confirmBackoff());
    expect(result.current.semEsforco).toEqual([]); // só depois de tentar avançar
    act(() => result.current.avancar());
    expect(result.current.currentIdx).toBe(0);
    expect(result.current.semEsforco).toEqual(["topSetRpe", "backoffRpe"]);
    act(() => result.current.atualizar({ topSetRpe: 8, backoffRpe: 9 }));
    expect(result.current.semEsforco).toEqual([]);
    act(() => result.current.avancar());
    expect(result.current.currentIdx).toBe(1);
  });

  it("Cluster e Deload são mutuamente exclusivos", () => {
    const { result } = abrir();
    act(() => result.current.alternarDeload());
    expect(result.current.state.isDeload).toBe(true);
    act(() => result.current.alternarCluster());
    expect(result.current.state).toMatchObject({ isDeload: false, tecnica: "RP" });
    act(() => result.current.alternarDeload());
    expect(result.current.state).toMatchObject({ isDeload: true, tecnica: null });
  });

  it("salvar: grava, limpa o rascunho e mostra o resumo", () => {
    const { result } = abrir();
    act(() => result.current.editarTopSet({ topSetKg: "100", topSetReps: "8" }));
    act(() => result.current.confirmTopSet());
    act(() => result.current.editarTopSet2({ backoffReps: "6" }));
    act(() => result.current.confirmBackoff());
    act(() => result.current.salvar());
    expect(carregarRegistros()).toHaveLength(1);
    expect(result.current.resumo).toMatchObject({ feitos: 1, total: 11, subirPeso: 1 });
    expect(localStorage.getItem("rascunho_treino")).toBeNull();
  });

  it("salvar no mesmo dia pede confirmação antes de substituir", () => {
    const { result } = abrir();
    const hoje = result.current.data;
    salvarRegistro(registro({ data: hoje }));
    act(() => result.current.editarTopSet({ topSetKg: "100", topSetReps: "8" }));
    act(() => result.current.confirmTopSet());
    act(() => result.current.salvar());
    expect(result.current.confirmarSubstituir).toBe(true);
    act(() => result.current.salvar(true));
    expect(carregarRegistros().map((r) => r.series[0]?.reps)).toEqual([8]);
  });
});
