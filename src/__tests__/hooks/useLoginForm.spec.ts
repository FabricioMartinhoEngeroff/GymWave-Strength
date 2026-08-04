/**
 * UseLoginFormTest → hooks/useLoginForm
 * Verifica que o login com os 2 usuários hardcoded:
 *  - salva token e email no localStorage
 *  - ativa o escopo de storage (setCurrentUser)
 *  - navega para /app
 * E que credenciais inválidas não abrem sessão.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useLoginForm } from "../../hooks/useLoginForm";
import { storageKey, setCurrentUser } from "../../utils/storage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

function change(name: string, value: string) {
  return { target: { name, value } } as React.ChangeEvent<HTMLInputElement>;
}

function fakeSubmit() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

afterEach(() => {
  mockNavigate.mockClear();
  setCurrentUser(null);
});

// ─── Fabricio ─────────────────────────────────────────────────────────────────

describe("useLoginForm — login Fabricio", () => {
  it("salva token no localStorage", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "treino@gmail.com"));
      result.current.handleChange(change("password", "@Treino123"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(localStorage.getItem("token")).toBe("fake-token-hardcoded");
  });

  it("salva o email correto no localStorage", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "treino@gmail.com"));
      result.current.handleChange(change("password", "@Treino123"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(localStorage.getItem("email")).toBe("treino@gmail.com");
  });

  it("ativa o prefixo correto no storageKey", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "treino@gmail.com"));
      result.current.handleChange(change("password", "@Treino123"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(storageKey("logbook")).toBe("treino@gmail.com_logbook");
    expect(storageKey("sessoes_config")).toBe("treino@gmail.com_sessoes_config");
    expect(storageKey("dadosTreino")).toBe("treino@gmail.com_dadosTreino");
  });

  it("navega para /app", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "treino@gmail.com"));
      result.current.handleChange(change("password", "@Treino123"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(mockNavigate).toHaveBeenCalledWith("/app");
  });
});

// ─── Amanda ───────────────────────────────────────────────────────────────────

describe("useLoginForm — login Amanda", () => {
  it("salva token no localStorage", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "amanda@treino.com"));
      result.current.handleChange(change("password", "@TreinoAmanda"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(localStorage.getItem("token")).toBe("fake-token-hardcoded");
  });

  it("salva o email correto no localStorage", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "amanda@treino.com"));
      result.current.handleChange(change("password", "@TreinoAmanda"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(localStorage.getItem("email")).toBe("amanda@treino.com");
  });

  it("ativa o prefixo correto no storageKey", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "amanda@treino.com"));
      result.current.handleChange(change("password", "@TreinoAmanda"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(storageKey("logbook")).toBe("amanda@treino.com_logbook");
    expect(storageKey("sessoes_config")).toBe("amanda@treino.com_sessoes_config");
    expect(storageKey("dadosTreino")).toBe("amanda@treino.com_dadosTreino");
  });

  it("navega para /app", async () => {
    const { result } = renderHook(() => useLoginForm(false));
    act(() => {
      result.current.handleChange(change("email", "amanda@treino.com"));
      result.current.handleChange(change("password", "@TreinoAmanda"));
    });
    await act(async () => { await result.current.handleSubmit(fakeSubmit()); });

    expect(mockNavigate).toHaveBeenCalledWith("/app");
  });
});

// ─── Credenciais inválidas ────────────────────────────────────────────────────
// handleApiError lança a exceção após chamar alert() — os testes capturam o throw.

async function tentarLogin(email: string, password: string) {
  const { result } = renderHook(() => useLoginForm(false));
  act(() => {
    result.current.handleChange(change("email", email));
    result.current.handleChange(change("password", password));
  });
  await act(async () => {
    try { await result.current.handleSubmit(fakeSubmit()); } catch { /* expected */ }
  });
}

describe("useLoginForm — credenciais inválidas", () => {
  it("senha errada não salva token", async () => {
    await tentarLogin("treino@gmail.com", "senhaErrada");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("senha errada não salva email", async () => {
    await tentarLogin("treino@gmail.com", "senhaErrada");
    expect(localStorage.getItem("email")).toBeNull();
  });

  it("email inexistente não abre sessão", async () => {
    await tentarLogin("naoexiste@gmail.com", "@Treino123");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("senha da Amanda não serve para logar como Fabricio", async () => {
    await tentarLogin("treino@gmail.com", "@TreinoAmanda");
    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("senha do Fabricio não serve para logar como Amanda", async () => {
    await tentarLogin("amanda@treino.com", "@Treino123");
    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("storageKey não tem prefixo quando login falha", async () => {
    await tentarLogin("treino@gmail.com", "errada");
    expect(storageKey("logbook")).toBe("logbook");
  });
});
