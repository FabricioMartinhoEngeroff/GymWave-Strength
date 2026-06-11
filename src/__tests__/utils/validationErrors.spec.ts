import { describe, it, expect } from "vitest";
import validationErrors from "../../utils/validationErrors";

describe("validationErrors — Mensagens de validação", () => {
  it("contém todas as chaves esperadas", () => {
    const expectedKeys = [
      "required",
      "invalidEmail",
      "emailExists",
      "invalidPassword",
      "passwordTooShort",
      "invalidCPF",
      "invalidPhone",
      "invalidCEP",
      "invalidState",
      "invalidCity",
      "emptyFields",
      "passwordMismatch",
    ];
    expect(Object.keys(validationErrors)).toEqual(expect.arrayContaining(expectedKeys));
    expect(Object.keys(validationErrors)).toHaveLength(expectedKeys.length);
  });

  it("todas as mensagens são strings não vazias", () => {
    for (const [key, value] of Object.entries(validationErrors)) {
      expect(typeof value).toBe("string");
      expect(value.length, `chave "${key}" está vazia`).toBeGreaterThan(0);
    }
  });

  it("mensagem de required é genérica", () => {
    expect(validationErrors.required).toBe("Este campo é obrigatório.");
  });

  it("mensagem de passwordMismatch indica senhas diferentes", () => {
    expect(validationErrors.passwordMismatch).toContain("senhas");
  });

  it("mensagem de invalidCPF menciona o formato", () => {
    expect(validationErrors.invalidCPF).toContain("XXX.XXX.XXX-XX");
  });

  it("mensagem de invalidPhone menciona o formato", () => {
    expect(validationErrors.invalidPhone).toContain("(XX) XXXXX-XXXX");
  });
});
