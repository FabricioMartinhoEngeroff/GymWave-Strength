/**
 * GraphicTest -> components/graphic
 * Testa o container de graficos de progressao por exercicio.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GraphicsContainer } from "../../../components/graphic/GraphicsContainer";

describe("GraphicsContainer — Graficos de progressao", () => {
  describe("Renderizacao", () => {
    it("exibe o titulo de progressao", () => {
      render(<GraphicsContainer />);
      expect(screen.getByText(/progressão/i)).toBeInTheDocument();
    });

    it("exibe seletor de exercicio", () => {
      render(<GraphicsContainer />);
      expect(screen.getAllByText(/exercício/i).length).toBeGreaterThan(0);
    });

    it("exibe seletor de periodo", () => {
      render(<GraphicsContainer />);
      expect(screen.getByText(/período/i)).toBeInTheDocument();
    });

    it("exibe filtro de treino", () => {
      render(<GraphicsContainer />);
      expect(screen.getByText(/filtrar por treino/i)).toBeInTheDocument();
    });

    it("exibe mensagem quando nao ha exercicios registrados", () => {
      render(<GraphicsContainer />);
      expect(
        screen.getByText(/nenhum exercício encontrado/i)
      ).toBeInTheDocument();
    });
  });
});
