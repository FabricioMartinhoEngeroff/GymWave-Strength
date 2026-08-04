/**
 * AuthProviderIsolationTest → contexts/AuthProvider
 * Verifica que o AuthProvider chama setCurrentUser no login e logout,
 * garantindo que as chaves de storage são isoladas por conta.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "../../contexts/AuthProvider";
import { useAuth } from "../../contexts/useAuth";
import { storageKey, setCurrentUser } from "../../utils/storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const body = btoa(JSON.stringify({ ...payload, exp }));
  return `${header}.${body}.fake-sig`;
}

function seedUser(email: string, password = "Senha@123") {
  const user = {
    name: "Teste",
    email,
    password,
    role: "user",
    cpf: "00000000000",
    telefone: "11000000000",
    endereco: { rua: "", bairro: "", cidade: "", estado: "", cep: "" },
  };
  const existing = JSON.parse(localStorage.getItem("mock-users") || "[]");
  localStorage.setItem("mock-users", JSON.stringify([...existing, user]));
}

// Componente auxiliar que expõe login/logout do contexto via callbacks
function TestConsumer({
  onLogin,
  onLogout,
}: {
  onLogin: (fn: (e: string, p: string) => Promise<void>) => void;
  onLogout: (fn: () => void) => void;
}) {
  const { login, logout } = useAuth();
  onLogin(login);
  onLogout(logout);
  return null;
}

afterEach(() => {
  setCurrentUser(null);
});

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("AuthProvider — isolamento de storage", () => {
  it("após login, storageKey usa o email do usuário como prefixo", async () => {
    seedUser("fabricio@gmail.com");

    let doLogin!: (e: string, p: string) => Promise<void>;

    render(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(TestConsumer, {
          onLogin: (fn) => { doLogin = fn; },
          onLogout: () => {},
        })
      )
    );

    await act(async () => {
      await doLogin("fabricio@gmail.com", "Senha@123");
    });

    expect(storageKey("logbook")).toBe("fabricio@gmail.com_logbook");
    expect(storageKey("dadosTreino")).toBe("fabricio@gmail.com_dadosTreino");
  });

  it("após logout, storageKey volta para chave sem prefixo", async () => {
    seedUser("fabricio@gmail.com");

    let doLogin!: (e: string, p: string) => Promise<void>;
    let doLogout!: () => void;

    render(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(TestConsumer, {
          onLogin: (fn) => { doLogin = fn; },
          onLogout: (fn) => { doLogout = fn; },
        })
      )
    );

    await act(async () => {
      await doLogin("fabricio@gmail.com", "Senha@123");
    });

    expect(storageKey("logbook")).toBe("fabricio@gmail.com_logbook");

    act(() => {
      doLogout();
    });

    expect(storageKey("logbook")).toBe("logbook");
  });

  it("após logout, o email é removido do localStorage", async () => {
    seedUser("fabricio@gmail.com");

    let doLogin!: (e: string, p: string) => Promise<void>;
    let doLogout!: () => void;

    render(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(TestConsumer, {
          onLogin: (fn) => { doLogin = fn; },
          onLogout: (fn) => { doLogout = fn; },
        })
      )
    );

    await act(async () => {
      await doLogin("fabricio@gmail.com", "Senha@123");
    });

    expect(localStorage.getItem("email")).toBe("fabricio@gmail.com");

    act(() => {
      doLogout();
    });

    expect(localStorage.getItem("email")).toBeNull();
  });

  it("dois usuários diferentes usam prefixos diferentes", async () => {
    seedUser("fabricio@gmail.com");
    seedUser("amanda@gmail.com");

    let doLogin!: (e: string, p: string) => Promise<void>;
    let doLogout!: () => void;

    render(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(TestConsumer, {
          onLogin: (fn) => { doLogin = fn; },
          onLogout: (fn) => { doLogout = fn; },
        })
      )
    );

    await act(async () => {
      await doLogin("fabricio@gmail.com", "Senha@123");
    });
    const keyFabricio = storageKey("logbook");

    act(() => doLogout());

    await act(async () => {
      await doLogin("amanda@gmail.com", "Senha@123");
    });
    const keyAmanda = storageKey("logbook");

    expect(keyFabricio).toBe("fabricio@gmail.com_logbook");
    expect(keyAmanda).toBe("amanda@gmail.com_logbook");
    expect(keyFabricio).not.toBe(keyAmanda);
  });

  it("ao fazer login com token existente no localStorage, email é preservado para migration", async () => {
    // Simula usuário que já estava logado (recarregou a página)
    seedUser("fabricio@gmail.com");
    const token = makeMockJWT({ email: "fabricio@gmail.com", role: "user" });
    localStorage.setItem("token", token);
    localStorage.setItem("email", "fabricio@gmail.com");

    // storage.ts inicializa _userId a partir do email no localStorage
    // Aqui testamos que a chave já está correta sem precisar de login
    setCurrentUser("fabricio@gmail.com");

    expect(storageKey("logbook")).toBe("fabricio@gmail.com_logbook");
  });
});
