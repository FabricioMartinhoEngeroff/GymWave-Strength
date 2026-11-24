/**
 * rpeAlvo → domain
 * Esforço alvo do exercício: cadastro, plano importado e valor inválido (EF_02 RG28).
 */
import { describe, it, expect } from "vitest";
import { rpeAlvoDoExercicio } from "../../../../components/treinoSessao/domain/rpeAlvo";
import type { ExercicioSessao } from "../../../../data/sessionExercises";

const ex = (nome: string, rpeAlvo?: unknown): ExercicioSessao => ({
  nome, grupo: "", faixaTopSet: [8, 10], faixaBackoff: [10, 12], backoffPct: 0.9, seriesValidas: 2, cue: "",
  ...(rpeAlvo !== undefined && { rpeAlvo: rpeAlvo as [number, number] }),
});

describe("rpeAlvoDoExercicio (RG28)", () => {
  it("usa o alvo do próprio exercício", () => {
    expect(rpeAlvoDoExercicio(ex("Supino reto barra", [6, 7]))).toEqual([6, 7]);
  });

  it.each([
    ["no cadastro, básico", "Supino reto barra", [7, 8]],
    ["no cadastro, escrito de outro jeito", "SUPINO RETO BARRA", [7, 8]],
    ["no cadastro, barra fixa", "Barra fixa", [7, 8]],
    ["no cadastro, isolador", "Cadeira extensora", [9, 10]],
    ["apelido do catálogo", "Extensão de pernas", [9, 10]],
    ["fora do cadastro, agachamento livre", "Agachamento frontal", [7, 8]],
    ["fora do cadastro, supino livre", "Supino inclinado barra", [7, 8]],
    ["fora do cadastro, terra", "Levantamento terra", [7, 8]],
    ["fora do cadastro, terra romeno", "Terra romeno", [7, 8]],
    ["supino em máquina", "Supino máquina", [9, 10]],
    ["supino no smith", "Supino inclinado na smith", [9, 10]],
    ["agachamento hack", "Agachamento hack", [9, 10]],
    ["agachamento máquina", "Agachamento máquina", [9, 10]],
    ["palavra no meio do nome", "Puxador frente pegada supinada", [9, 10]],
    ["qualquer outro", "Exercício novo", [9, 10]],
  ])("plano sem alvo, %s: %s", (_n, nome, esperado) => {
    expect(rpeAlvoDoExercicio(ex(nome))).toEqual(esperado);
  });

  it.each([["texto", "8"], ["um valor só", [8]], ["invertido", [9, 7]], ["fora da escala", [5, 11]], ["nulo", null], ["não numérico", ["7", "8"]]])(
    "alvo inválido (%s) é ignorado", (_n, invalido) => {
      expect(rpeAlvoDoExercicio(ex("Cadeira extensora", invalido))).toEqual([9, 10]);
    });
});
