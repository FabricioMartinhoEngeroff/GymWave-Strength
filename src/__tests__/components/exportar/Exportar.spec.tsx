/**
 * ExportarTest → components/exportar
 * Testa a tela de exportação de dados (CSV / JSON).
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Exportar from "../../../components/exportar/Exportar";

describe("Exportar — Tela de exportação de dados", () => {
  describe("Renderização", () => {
    it("exibe o título da tela", () => {
      render(<Exportar />);
      expect(screen.getByText("Exportar dados")).toBeInTheDocument();
    });

    it("exibe subtítulo de backup", () => {
      render(<Exportar />);
      expect(screen.getByText(/backup/i)).toBeInTheDocument();
    });

    it("exibe botão de exportar CSV", () => {
      render(<Exportar />);
      expect(screen.getByText(/exportar como csv/i)).toBeInTheDocument();
    });

    it("exibe botão de exportar JSON", () => {
      render(<Exportar />);
      expect(screen.getByText(/exportar como json/i)).toBeInTheDocument();
    });
  });

  describe("Contagem de registros", () => {
    it("exibe '0 treinos' quando não há dados no localStorage", () => {
      render(<Exportar />);
      expect(screen.getByText(/0 treinos/i)).toBeInTheDocument();
    });

    it("exibe contagem correta quando há dados", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: { data: "10/06/2026", pesos: ["100"], reps: ["5"] },
            C2: { data: "15/06/2026", pesos: ["90"], reps: ["8"] },
          },
          Agachamento: {
            C1: { data: "10/06/2026", pesos: ["130"], reps: ["5"] },
          },
        })
      );
      render(<Exportar />);
      expect(screen.getByText(/3 treinos/i)).toBeInTheDocument();
    });
  });

  describe("Download", () => {
    it("botão CSV dispara download sem erro", () => {
      render(<Exportar />);
      expect(() =>
        fireEvent.click(screen.getByText(/exportar como csv/i))
      ).not.toThrow();
    });

    it("botão JSON dispara download sem erro", () => {
      render(<Exportar />);
      expect(() =>
        fireEvent.click(screen.getByText(/exportar como json/i))
      ).not.toThrow();
    });
  });
});
