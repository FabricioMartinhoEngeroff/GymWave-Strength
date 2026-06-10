/**
 * ServicesTest → services/authService
 * Testa as funções de login e registro com mock de localStorage.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { login, register } from "../../services/authService";

const USER_VALIDO = {
  name: "Fabricio",
  email: "fab@gymwave.com",
  password: "Senha@123",
  cpf: "12345678901",
  telefone: "11987654321",
  endereco: {
    rua: "Rua A",
    bairro: "Centro",
    cidade: "SP",
    estado: "SP",
    cep: "01001000",
  },
};

describe("authService — Autenticação mock", () => {
  describe("register", () => {
    it("registra um novo usuário e salva token no localStorage", async () => {
      await register(USER_VALIDO);
      expect(localStorage.getItem("token")).not.toBeNull();
    });

    it("retorna objeto com token após registro", async () => {
      const result = await register(USER_VALIDO);
      expect(result).toHaveProperty("token");
    });

    it("lança erro ao tentar registrar e-mail duplicado", async () => {
      await register(USER_VALIDO);
      await expect(register(USER_VALIDO)).rejects.toThrow();
    });

    it("salva o e-mail do usuário no localStorage", async () => {
      await register(USER_VALIDO);
      expect(localStorage.getItem("email")).toBe(USER_VALIDO.email);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await register(USER_VALIDO);
      localStorage.removeItem("token");
      localStorage.removeItem("email");
    });

    it("faz login com credenciais corretas e retorna token", async () => {
      const result = await login(USER_VALIDO.email, USER_VALIDO.password);
      expect(result).toHaveProperty("token");
    });

    it("salva token no localStorage após login", async () => {
      await login(USER_VALIDO.email, USER_VALIDO.password);
      expect(localStorage.getItem("token")).not.toBeNull();
    });

    it("lança erro com senha incorreta", async () => {
      await expect(login(USER_VALIDO.email, "senhaerrada")).rejects.toThrow();
    });

    it("lança erro com e-mail inexistente", async () => {
      await expect(login("naoexiste@test.com", "qualquer")).rejects.toThrow();
    });
  });
});
