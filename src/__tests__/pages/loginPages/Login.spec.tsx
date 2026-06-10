/**
 * PagesTest → pages/loginPages/Login
 * Testa o componente de login: renderização e interação com formulário.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Login } from "../../../pages/loginPages/Login";

const defaultProps = {
  formData: { email: "", password: "" },
  errors: {},
  handleChange: vi.fn(),
  handleSubmit: vi.fn(),
  passwordVisible: false,
  togglePasswordVisibility: vi.fn(),
};

describe("Login — Página de autenticação", () => {
  describe("Renderização", () => {
    it("exibe o título 'Digite sua senha'", () => {
      render(<Login {...defaultProps} />);
      expect(screen.getByText(/digite sua senha/i)).toBeInTheDocument();
    });

    it("exibe o campo de e-mail", () => {
      render(<Login {...defaultProps} />);
      expect(screen.getByPlaceholderText(/e-mail/i)).toBeInTheDocument();
    });

    it("exibe o campo de senha", () => {
      render(<Login {...defaultProps} />);
      expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument();
    });

    it("exibe o botão de entrar", () => {
      render(<Login {...defaultProps} />);
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });

    it("exibe link de cadastro", () => {
      render(<Login {...defaultProps} />);
      expect(screen.getByText(/cadastre-se aqui/i)).toBeInTheDocument();
    });
  });

  describe("Interação", () => {
    it("chama handleChange ao digitar no e-mail", () => {
      const handleChange = vi.fn();
      render(<Login {...defaultProps} handleChange={handleChange} />);
      fireEvent.change(screen.getByPlaceholderText(/e-mail/i), {
        target: { value: "user@test.com" },
      });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("chama handleSubmit ao submeter o formulário", () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      render(<Login {...defaultProps} handleSubmit={handleSubmit} />);
      fireEvent.submit(screen.getByRole("button", { name: /entrar/i }).closest("form")!);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("campo de senha é do tipo password quando passwordVisible=false", () => {
      render(<Login {...defaultProps} passwordVisible={false} />);
      const input = screen.getByPlaceholderText(/senha/i) as HTMLInputElement;
      expect(input.type).toBe("password");
    });

    it("campo de senha é do tipo text quando passwordVisible=true", () => {
      render(<Login {...defaultProps} passwordVisible={true} />);
      const input = screen.getByPlaceholderText(/senha/i) as HTMLInputElement;
      expect(input.type).toBe("text");
    });
  });
});
