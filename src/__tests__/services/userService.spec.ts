import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAuthenticatedUser } from "../../services/userService";

// handleApiError faz alert + throw — mockamos para evitar side effects
vi.mock("../../utils/handleApiError", () => ({
  handleApiError: vi.fn((err) => { throw err; }),
}));

function makeMockJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-sig`;
}

const mockUser = {
  name: "João",
  email: "joao@test.com",
  password: "123",
  role: "user",
  cpf: "111.222.333-44",
  telefone: "(11) 99999-9999",
  endereco: {
    rua: "Rua A",
    bairro: "Centro",
    cidade: "SP",
    estado: "SP",
    cep: "01000-000",
  },
};

describe("userService — fetchAuthenticatedUser", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    // mock location.href setter
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("retorna null e redireciona quando não há token", async () => {
    const result = await fetchAuthenticatedUser();
    expect(result).toBeNull();
  });

  it("retorna null quando não há email", async () => {
    localStorage.setItem("token", "qualquer");
    const result = await fetchAuthenticatedUser();
    expect(result).toBeNull();
  });

  it("retorna dados do usuário quando token e email são válidos", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeMockJWT({ email: mockUser.email, role: "user", exp: futureExp });

    localStorage.setItem("token", token);
    localStorage.setItem("email", mockUser.email);
    localStorage.setItem("mock-users", JSON.stringify([mockUser]));

    const result = await fetchAuthenticatedUser();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("João");
    expect(result?.email).toBe("joao@test.com");
    expect(result?.role).toBe("user");
  });

  it("lança erro quando token está expirado", async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 100;
    const token = makeMockJWT({ email: mockUser.email, role: "user", exp: pastExp });

    localStorage.setItem("token", token);
    localStorage.setItem("email", mockUser.email);
    localStorage.setItem("mock-users", JSON.stringify([mockUser]));

    await expect(fetchAuthenticatedUser()).rejects.toThrow("Token expirado.");
  });

  it("lança erro quando usuário não é encontrado", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeMockJWT({ email: "outro@test.com", role: "user", exp: futureExp });

    localStorage.setItem("token", token);
    localStorage.setItem("email", "outro@test.com");
    localStorage.setItem("mock-users", JSON.stringify([mockUser]));

    await expect(fetchAuthenticatedUser()).rejects.toThrow("Usuário não encontrado.");
  });
});
