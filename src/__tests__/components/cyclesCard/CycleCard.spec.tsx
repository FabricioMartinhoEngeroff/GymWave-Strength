/**
 * CycleCardTest → components/cyclesCard
 * Testa o componente legado de registro individual de ciclo.
 * Módulo mantido para compatibilidade com dados históricos.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CicloCard from "../../../components/cyclesCard";

const mockOnSave = () => {};

describe("CycleCard — Registro de ciclo individual", () => {
  describe("Renderização", () => {
    it("renderiza o formulário de registro", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/registre seu treino/i)).toBeInTheDocument();
    });

    it("exibe seletor de exercício", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/escolha seu exercício/i)).toBeInTheDocument();
    });

    it("exibe os 4 ciclos disponíveis", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText("Ciclo 1")).toBeInTheDocument();
      expect(screen.getByText("Ciclo 4")).toBeInTheDocument();
    });

    it("exibe campos de série, peso e repetição", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/1ª série/i)).toBeInTheDocument();
    });

    it("exibe botão de salvar", () => {
      render(<CicloCard onSave={mockOnSave} />);
      expect(screen.getByText(/salvar/i)).toBeInTheDocument();
    });
  });
});
