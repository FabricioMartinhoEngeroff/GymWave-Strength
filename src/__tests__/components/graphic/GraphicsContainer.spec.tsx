/**
 * GraphicTest → components/graphic
 * Testa o container de gráficos de intensidade por ciclo.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GraphicsContainer } from "../../../components/graphic/GraphicsContainer";

describe("GraphicsContainer — Gráficos de intensidade", () => {
  describe("Renderização", () => {
    it("exibe o título de gráficos de intensidade", () => {
      render(<GraphicsContainer />);
      expect(screen.getByText(/gráficos de intensidade/i)).toBeInTheDocument();
    });

    it("exibe seletor de exercício", () => {
      render(<GraphicsContainer />);
      expect(screen.getAllByText(/exercício/i).length).toBeGreaterThan(0);
    });

    it("exibe seletor de período", () => {
      render(<GraphicsContainer />);
      expect(screen.getByText(/período/i)).toBeInTheDocument();
    });

    it("exibe seletor de ciclos para comparar", () => {
      render(<GraphicsContainer />);
      expect(screen.getByText(/ciclos para comparar/i)).toBeInTheDocument();
    });

    it("exibe mensagem quando não há exercícios registrados", () => {
      render(<GraphicsContainer />);
      expect(
        screen.getByText(/nenhum exercício encontrado/i)
      ).toBeInTheDocument();
    });
  });
});
