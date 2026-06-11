import { describe, it, expect } from "vitest";
import { EXERCICIOS } from "../../data/exercise";

describe("exercise — Lista de exercícios", () => {
  it("exporta um array não vazio", () => {
    expect(Array.isArray(EXERCICIOS)).toBe(true);
    expect(EXERCICIOS.length).toBeGreaterThan(0);
  });

  it("todos os itens são strings não vazias", () => {
    EXERCICIOS.forEach((ex) => {
      expect(typeof ex).toBe("string");
      expect(ex.trim().length).toBeGreaterThan(0);
    });
  });

  it("não contém duplicatas", () => {
    const unicos = new Set(EXERCICIOS.map((e) => e.toLowerCase()));
    expect(unicos.size).toBe(EXERCICIOS.length);
  });

  it("contém exercícios compostos principais", () => {
    expect(EXERCICIOS).toContain("Agachamento");
    expect(EXERCICIOS).toContain("Levantamento Terra");
    expect(EXERCICIOS).toContain("Supino Reto");
  });

  it("contém exercícios de isolamento", () => {
    expect(EXERCICIOS).toContain("Cadeira Extensora");
    expect(EXERCICIOS).toContain("Cadeira/Mesa Flexora");
    expect(EXERCICIOS).toContain("Tríceps Polia");
  });

  it("contém exercícios de costas", () => {
    expect(EXERCICIOS).toContain("Barra fixa");
    expect(EXERCICIOS).toContain("Puxada na Frente");
    expect(EXERCICIOS).toContain("Remada Curvada");
  });

  it("contém exercício de core", () => {
    expect(EXERCICIOS).toContain("Abdômen no cabo");
  });

  it("contém exercícios de panturrilha", () => {
    const panturrilhas = EXERCICIOS.filter((e) => e.toLowerCase().includes("panturrilha"));
    expect(panturrilhas.length).toBeGreaterThanOrEqual(2);
  });
});
