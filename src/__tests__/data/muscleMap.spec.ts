/**
 * MuscleMapTest → data
 * Garante cobertura total do mapeamento exercício → músculo.
 * Se falhar aqui, o VolumeLoad vai ignorar treinos silenciosamente.
 */
import { describe, it, expect } from "vitest";
import { MUSCLE_MAP } from "../../data/muscleMap";
import { SESSOES } from "../../data/sessionExercises";

const OS_8_GRUPOS = [
  "Peitoral",
  "Costas",
  "Ombro",
  "Quadríceps",
  "Posterior/Glúteo",
  "Panturrilha",
  "Braço",
  "Core",
] as const;

describe("MuscleMap — Cobertura exercício → grupo muscular", () => {

  describe("Cobertura por sessão (sessionExercises)", () => {
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

  describe("Os 8 grupos musculares estão presentes no mapa", () => {
    const valores = Object.values(MUSCLE_MAP);

    OS_8_GRUPOS.forEach((grupo) => {
      it(`deve conter o grupo "${grupo}"`, () => {
        expect(valores).toContain(grupo);
      });
    });

    it("todos os valores do mapa pertencem a um dos 8 grupos", () => {
      const fora = [...new Set(valores)].filter(
        (v) => !(OS_8_GRUPOS as readonly string[]).includes(v)
      );
      expect(fora, `Grupos não reconhecidos: ${fora.join(", ")}`).toHaveLength(0);
    });
  });

  describe("Mapeamentos críticos", () => {
    it("Supino Reto → Peitoral", () => {
      expect(MUSCLE_MAP["Supino Reto"]).toBe("Peitoral");
    });

    it("Barra fixa → Costas", () => {
      expect(MUSCLE_MAP["Barra fixa"]).toBe("Costas");
    });

    it("Desenvolvimento Lateral cabo → Ombro", () => {
      expect(MUSCLE_MAP["Desenvolvimento Lateral cabo"]).toBe("Ombro");
    });

    it("Agachamento → Quadríceps", () => {
      expect(MUSCLE_MAP["Agachamento"]).toBe("Quadríceps");
    });

    it("Stiff → Posterior/Glúteo", () => {
      expect(MUSCLE_MAP["Stiff"]).toBe("Posterior/Glúteo");
    });

    it("Elevação Pélvica → Posterior/Glúteo", () => {
      expect(MUSCLE_MAP["Elevação Pélvica"]).toBe("Posterior/Glúteo");
    });

    it("Adutor máquina (fechar as pernas) → Posterior/Glúteo", () => {
      expect(MUSCLE_MAP["Adutor máquina (fechar as pernas)"]).toBe("Posterior/Glúteo");
    });

    it("Panturrilha sentado → Panturrilha", () => {
      expect(MUSCLE_MAP["Panturrilha sentado"]).toBe("Panturrilha");
    });

    it("Rosca Scott unilateral → Braço", () => {
      expect(MUSCLE_MAP["Rosca Scott unilateral"]).toBe("Braço");
    });

    it("Tríceps Polia → Braço", () => {
      expect(MUSCLE_MAP["Tríceps Polia"]).toBe("Braço");
    });

    it("Abdômen no cabo → Core", () => {
      expect(MUSCLE_MAP["Abdômen no cabo"]).toBe("Core");
    });
  });
});
