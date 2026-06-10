/**
 * UtilsTest → utils/validators
 * Testa as funções de validação de e-mail, CPF, telefone, senha e campos vazios.
 */
import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateCPF,
  validatePhone,
  validatePassword,
  validateEmptyFields,
  validateLoginFields,
} from "../../utils/validators";

describe("validators — Funções de validação de formulários", () => {
  describe("validateEmail", () => {
    it("retorna null para e-mail válido", () => {
      expect(validateEmail("user@test.com")).toBeNull();
    });

    it("retorna erro para campo vazio", () => {
      expect(validateEmail("")).not.toBeNull();
    });

    it("retorna erro para e-mail sem @", () => {
      expect(validateEmail("emailsemarroba.com")).not.toBeNull();
    });

    it("retorna erro para e-mail sem domínio", () => {
      expect(validateEmail("user@")).not.toBeNull();
    });
  });

  describe("validateCPF", () => {
    it("retorna null para CPF com 11 dígitos", () => {
      expect(validateCPF("12345678901")).toBeNull();
    });

    it("aceita CPF com pontuação (remove máscara)", () => {
      expect(validateCPF("123.456.789-01")).toBeNull();
    });

    it("retorna erro para campo vazio", () => {
      expect(validateCPF("")).not.toBeNull();
    });

    it("retorna erro para CPF com menos de 11 dígitos", () => {
      expect(validateCPF("1234567")).not.toBeNull();
    });
  });

  describe("validatePhone", () => {
    it("retorna null para celular com 11 dígitos", () => {
      expect(validatePhone("11987654321")).toBeNull();
    });

    it("retorna null para fixo com 10 dígitos", () => {
      expect(validatePhone("1134567890")).toBeNull();
    });

    it("retorna erro para campo vazio", () => {
      expect(validatePhone("")).not.toBeNull();
    });

    it("retorna erro para número inválido", () => {
      expect(validatePhone("12345")).not.toBeNull();
    });
  });

  describe("validatePassword", () => {
    it("retorna null para senha forte válida", () => {
      expect(validatePassword("Senha@123")).toBeNull();
    });

    it("retorna erro para campo vazio", () => {
      expect(validatePassword("")).not.toBeNull();
    });

    it("retorna erro para senha com menos de 8 caracteres", () => {
      expect(validatePassword("Ab1@")).not.toBeNull();
    });

    it("retorna erro para senha sem caractere especial", () => {
      expect(validatePassword("Senha1234")).not.toBeNull();
    });

    it("retorna erro para senha sem maiúscula", () => {
      expect(validatePassword("senha@123")).not.toBeNull();
    });
  });

  describe("validateEmptyFields", () => {
    it("retorna null quando todos os campos estão preenchidos", () => {
      expect(validateEmptyFields({ nome: "Fab", email: "a@b.com" })).toBeNull();
    });

    it("retorna mensagem de erro para campo vazio", () => {
      const result = validateEmptyFields({ nome: "" });
      expect(result).toContain("nome");
    });

    it("valida campos aninhados (endereco.cidade)", () => {
      const result = validateEmptyFields({ endereco: { cidade: "" } });
      expect(result).toContain("endereco.cidade");
    });

    it("retorna null para objeto nulo", () => {
      expect(validateEmptyFields(null)).toBeNull();
    });
  });

  describe("validateLoginFields", () => {
    it("retorna null quando email e password estão preenchidos", () => {
      expect(validateLoginFields({ email: "a@b.com", password: "123" })).toBeNull();
    });

    it("retorna erro quando email está vazio", () => {
      const result = validateLoginFields({ email: "", password: "123" });
      expect(result).toContain("email");
    });

    it("retorna erro quando password está vazio", () => {
      const result = validateLoginFields({ email: "a@b.com", password: "" });
      expect(result).toContain("password");
    });

    it("retorna null para entrada nula/inválida", () => {
      expect(validateLoginFields(null as unknown as Record<string, unknown>)).toBeNull();
    });
  });
});
