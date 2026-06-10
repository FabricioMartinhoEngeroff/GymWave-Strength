/**
 * RouterTest → router/PrivateRoute
 * Testa o componente de rota privada:
 * renderiza children quando autenticado, redireciona quando não.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PrivateRoute } from "../../router/PrivateRoute";

const renderWithRouter = (ui: React.ReactNode, initialEntries = ["/"]) =>
  render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);

describe("PrivateRoute — Rota protegida por autenticação", () => {
  describe("Não autenticado", () => {
    it("não exibe conteúdo protegido sem token", () => {
      renderWithRouter(
        <PrivateRoute>
          <div>Área restrita</div>
        </PrivateRoute>
      );
      expect(screen.queryByText("Área restrita")).not.toBeInTheDocument();
    });

    it("redireciona para '/' quando não há token", () => {
      const { container } = renderWithRouter(
        <PrivateRoute>
          <div>Secreto</div>
        </PrivateRoute>
      );
      expect(container.textContent).not.toContain("Secreto");
    });
  });

  describe("Autenticado", () => {
    it("renderiza children quando há token no localStorage", () => {
      localStorage.setItem("token", "fake-jwt-token");
      renderWithRouter(
        <PrivateRoute>
          <div>Área restrita</div>
        </PrivateRoute>
      );
      expect(screen.getByText("Área restrita")).toBeInTheDocument();
    });

    it("renderiza múltiplos children corretamente", () => {
      localStorage.setItem("token", "fake-jwt-token");
      renderWithRouter(
        <PrivateRoute>
          <span>Item 1</span>
          <span>Item 2</span>
        </PrivateRoute>
      );
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });
});
