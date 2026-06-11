import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleApiError } from "../../utils/handleApiError";

describe("handleApiError — Tratamento de erros da API", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("exibe alert com mensagem padrão e relança o erro", () => {
    const err = new Error("qualquer");
    expect(() => handleApiError(err, "Mensagem padrão")).toThrow(err);
    expect(window.alert).toHaveBeenCalled();
  });

  it("usa mensagem do Error nativo quando não é AxiosError", () => {
    const err = new Error("falha customizada");
    expect(() => handleApiError(err, "fallback")).toThrow();
    expect(window.alert).toHaveBeenCalledWith("falha customizada");
  });

  it("usa mensagem da response do Axios quando disponível", () => {
    const axiosErr = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: "E-mail já existe" },
      },
      message: "Request failed",
    };
    expect(() => handleApiError(axiosErr, "fallback")).toThrow(axiosErr);
    expect(window.alert).toHaveBeenCalledWith("E-mail já existe");
  });

  it("usa mensagem padrão quando AxiosError não tem response.data.message", () => {
    const axiosErr = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {},
      },
      message: "Request failed",
    };
    expect(() => handleApiError(axiosErr, "Erro no servidor")).toThrow();
    expect(window.alert).toHaveBeenCalledWith("Erro no servidor");
  });

  it("trata AxiosError sem response (sem resposta do servidor)", () => {
    const axiosErr = {
      isAxiosError: true,
      request: {},
      message: "Network Error",
    };
    expect(() => handleApiError(axiosErr, "Sem conexão")).toThrow();
    expect(window.alert).toHaveBeenCalledWith("Sem conexão");
  });

  it("usa mensagem padrão quando erro não é Error nem AxiosError", () => {
    const err = "string de erro";
    expect(() => handleApiError(err, "Erro desconhecido")).toThrow();
    expect(window.alert).toHaveBeenCalledWith("Erro desconhecido");
  });

  it("loga no console.error", () => {
    const err = new Error("teste");
    expect(() => handleApiError(err, "msg")).toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});
