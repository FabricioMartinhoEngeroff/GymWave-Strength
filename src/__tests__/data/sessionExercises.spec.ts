/**
 * SessionExercisesTest → data
 * Valida cobertura e consistência das sessões de treino.
 * Garante que cada exercício existe no catálogo global.
 */
import { describe, it, expect } from "vitest";
import { SESSOES, SESSOES_LABELS } from "../../data/sessionExercises";
import { EXERCICIOS } from "../../data/exercise";

describe("SessionExercises — Sessões Upper / Lower / Braço", () => {
  describe("Estrutura geral", () => {
    it("deve ter exatamente 5 sessões", () => {
      expect(Object.keys(SESSOES)).toHaveLength(5);
    });

    it("SESSOES_LABELS deve listar todas as 5 sessões", () => {
      expect(SESSOES_LABELS).toHaveLength(5);
      SESSOES_LABELS.forEach((label) => {
        expect(SESSOES).toHaveProperty(label);
      });
    });

    it("deve conter Upper A, Lower A, Upper B, Lower B e Braço", () => {
      const sessoes = ["Upper A", "Lower A", "Upper B", "Lower B", "Braço"];
      sessoes.forEach((s) => expect(SESSOES).toHaveProperty(s));
    });
  });

  describe("Volume mínimo por sessão", () => {
    it("Upper A deve ter pelo menos 6 exercícios", () => {
      expect(SESSOES["Upper A"].length).toBeGreaterThanOrEqual(6);
    });

    it("Lower A deve ter pelo menos 6 exercícios", () => {
      expect(SESSOES["Lower A"].length).toBeGreaterThanOrEqual(6);
    });

    it("Upper B deve ter pelo menos 6 exercícios", () => {
      expect(SESSOES["Upper B"].length).toBeGreaterThanOrEqual(6);
    });

    it("Lower B deve ter pelo menos 6 exercícios", () => {
      expect(SESSOES["Lower B"].length).toBeGreaterThanOrEqual(6);
    });

    it("Braço deve ter pelo menos 2 exercícios", () => {
      expect(SESSOES["Braço"].length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Integridade: exercícios vs catálogo global", () => {
    it("cada exercício deve ter nome e musculo preenchidos", () => {
      Object.entries(SESSOES).forEach(([sessao, exercicios]) => {
        exercicios.forEach((ex) => {
          expect(ex.nome.trim(), `[${sessao}] nome vazio`).not.toBe("");
          expect(ex.musculo.trim(), `[${sessao}] musculo vazio`).not.toBe("");
        });
      });
    });

    it("todos os nomes devem existir no catálogo EXERCICIOS", () => {
      const naoEncontrados: string[] = [];
      Object.entries(SESSOES).forEach(([sessao, exercicios]) => {
        exercicios.forEach((ex) => {
          if (!EXERCICIOS.includes(ex.nome))
            naoEncontrados.push(`[${sessao}] "${ex.nome}"`);
        });
      });
      expect(
        naoEncontrados,
        `Exercícios fora do catálogo: ${naoEncontrados.join(", ")}`
      ).toHaveLength(0);
    });
  });

  describe("Separação Upper / Lower", () => {
    it("Upper A deve conter exercício de peito", () => {
      const temPeito = SESSOES["Upper A"].some((e) =>
        e.musculo.toLowerCase().includes("peit")
      );
      expect(temPeito).toBe(true);
    });

    it("Lower A deve conter exercício de quadríceps ou glúteo", () => {
      const temPerna = SESSOES["Lower A"].some((e) =>
        e.musculo.toLowerCase().match(/quadr|glút|posterior/)
      );
      expect(temPerna).toBe(true);
    });

    it("Upper B deve conter exercício de costas", () => {
      const temCostas = SESSOES["Upper B"].some((e) =>
        e.musculo.toLowerCase().includes("costas")
      );
      expect(temCostas).toBe(true);
    });
  });
});
