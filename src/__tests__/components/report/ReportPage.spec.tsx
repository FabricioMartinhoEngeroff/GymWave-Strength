/**
 * ReportTest → components/report
 * Testa a tela de relatórios: filtros, listagem e edição.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportPage from "../../../components/report";

describe("ReportPage — Relatórios de treino", () => {
  describe("Renderização", () => {
    it("exibe o título da página", () => {
      render(<ReportPage />);
      expect(screen.getByText(/relatórios de treinos/i)).toBeInTheDocument();
    });

    it("exibe filtro de exercício", () => {
      render(<ReportPage />);
      expect(screen.getAllByText(/exercício/i).length).toBeGreaterThan(0);
    });

    it("exibe filtro de período", () => {
      render(<ReportPage />);
      expect(screen.getByText(/período/i)).toBeInTheDocument();
    });
  });

  describe("Estado sem dados", () => {
    it("renderiza sem erros quando não há registros", () => {
      expect(() => render(<ReportPage />)).not.toThrow();
    });
  });

  describe("Estado com dados", () => {
    it("exibe registros quando há dados no localStorage", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: {
              data: "10/06/2026",
              pesos: ["100", "90"],
              reps: ["5", "8"],
              obs: "",
              exercicio: "Supino Reto",
            },
          },
        })
      );
      render(<ReportPage />);
      expect(screen.getAllByText("Supino Reto").length).toBeGreaterThan(0);
    });
  });
});
