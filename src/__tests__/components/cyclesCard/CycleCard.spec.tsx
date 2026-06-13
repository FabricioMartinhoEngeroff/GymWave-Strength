/**
 * CycleCardTest -> components/cyclesCard
 * Testa o componente legado de registro individual.
 * Mantido para compatibilidade com dados historicos.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CicloCard from "../../../components/cyclesCard";

const mockOnSave = () => {};

describe("CycleCard — Registro legado", () => {
  describe("Renderizacao", () => {
    it("renderiza o formulario de registro", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/registre seu treino/i)).toBeInTheDocument();
    });

    it("exibe seletor de exercicio", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/escolha seu exercício/i)).toBeInTheDocument();
    });

    it("exibe os treinos da rotacao", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText("Upper A")).toBeInTheDocument();
    });

    it("exibe campos de serie, peso e repeticao", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/1ª série/i)).toBeInTheDocument();
    });

    it("exibe botao de salvar", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/salvar/i)).toBeInTheDocument();
    });
  });
});
