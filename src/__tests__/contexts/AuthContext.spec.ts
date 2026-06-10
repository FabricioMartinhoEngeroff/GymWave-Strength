/**
 * ContextTest → contexts/AuthContext + useAuth
 * Testa a criação do contexto de autenticação e o hook useAuth.
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { AuthContext } from "../../contexts/AuthContext";
import { useAuth } from "../../contexts/useAuth";
import React from "react";

describe("AuthContext — Contexto de autenticação", () => {
  describe("AuthContext", () => {
    it("exporta um contexto React válido", () => {
      expect(AuthContext).toBeDefined();
      expect(typeof AuthContext).toBe("object");
    });

    it("valor padrão do contexto é undefined", () => {
      expect(AuthContext._currentValue).toBeUndefined();
    });
  });

  describe("useAuth", () => {
    it("lança erro quando usado fora do AuthProvider", () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth deve ser usado dentro de um AuthProvider");
    });

    it("retorna o contexto quando dentro de um AuthProvider", () => {
      const mockValue = {
        user: null,
        login: async () => {},
        logout: () => {},
      };

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(AuthContext.Provider, { value: mockValue }, children);

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.user).toBeNull();
      expect(typeof result.current.login).toBe("function");
      expect(typeof result.current.logout).toBe("function");
    });
  });
});
