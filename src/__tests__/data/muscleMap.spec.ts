/**
 * MuscleMapTest → data
 * Garante cobertura total do mapeamento exercício → músculo.
 * Se falhar aqui, o VolumeLoad vai ignorar treinos silenciosamente.
 */
import { describe, it, expect } from "vitest";
import { MUSCLE_MAP } from "../../data/muscleMap";
import { SESSOES } from "../../data/sessionExercises";

describe("MuscleMap — Cobertura exercício → grupo muscular", () => {
  describe("Cobertura por sessão", () => {
    it("todos os exercícios de Upper A devem ter mapeamento", () => {
      SESSOES["Upper A"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

    it("todos os exercícios de Lower A devem ter mapeamento", () => {
      SESSOES["Lower A"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

    it("todos os exercícios de Upper B devem ter mapeamento", () => {
      SESSOES["Upper B"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

    it("todos os exercícios de Lower B devem ter mapeamento", () => {
      SESSOES["Lower B"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

    it("todos os exercícios de Braço devem ter mapeamento", () => {
      SESSOES["Braço"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });
  });

  describe("Cobertura total (sem gaps)", () => {
    it("nenhum exercício das sessões deve ficar fora do VolumeLoad", () => {
      const semMapa = Object.values(SESSOES)
        .flat()
        .filter((ex) => !MUSCLE_MAP[ex.nome])
        .map((ex) => ex.nome);

      expect(
        semMapa,
        `Exercícios sem mapa muscular: ${semMapa.join(", ")}`
      ).toHaveLength(0);
    });
  });

  describe("Grupos musculares principais presentes", () => {
    const musculos = Object.values(MUSCLE_MAP);

    it("deve mapear Peito", () => expect(musculos).toContain("Peito"));
    it("deve mapear Costas", () => expect(musculos).toContain("Costas"));
    it("deve mapear Quadríceps", () => expect(musculos).toContain("Quadríceps"));
    it("deve mapear Posterior", () => expect(musculos).toContain("Posterior"));
    it("deve mapear Glúteo", () => expect(musculos).toContain("Glúteo"));
    it("deve mapear Deltóide médio", () => expect(musculos).toContain("Deltóide médio"));
    it("deve mapear Bíceps", () => expect(musculos).toContain("Bíceps"));
    it("deve mapear Tríceps", () => expect(musculos).toContain("Tríceps"));
  });
});
