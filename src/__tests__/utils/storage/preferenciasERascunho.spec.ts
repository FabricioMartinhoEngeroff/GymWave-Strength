/**
 * storage → preferências e rascunho: cada função cuida da chave, do formato e do usuário.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  carregarEscala, carregarRascunhos, instrucoesForamVistas, limparRascunhos, marcarInstrucoesVistas,
  salvarEscala, salvarRascunhos, setCurrentUser,
} from "../../../utils/storage";

const falhar = (metodo: "getItem" | "setItem" | "removeItem") =>
  vi.spyOn(Storage.prototype, metodo).mockImplementation(() => { throw new DOMException("bloqueado", "SecurityError"); });

beforeEach(() => { localStorage.clear(); setCurrentUser("u1"); });
afterEach(() => { vi.restoreAllMocks(); setCurrentUser(null); });

describe("escala", () => {
  it.each([[null, "RPE"], ["RPE", "RPE"], ["RIR", "RIR"], ["rir", "RPE"], ["{", "RPE"]])("guardada %j → %s", (guardada, esperada) => {
    if (guardada !== null) localStorage.setItem("gw:u1:escala_esforco", guardada);
    expect(carregarEscala()).toBe(esperada);
  });

  it("grava o texto cru na chave do usuário atual", () => {
    salvarEscala("RIR");
    expect(Object.entries(localStorage)).toEqual([["gw:u1:escala_esforco", "RIR"]]);
    setCurrentUser("u2");
    expect(carregarEscala()).toBe("RPE");
  });

  it("falha ao gravar sobe", () => {
    falhar("setItem");
    expect(() => salvarEscala("RIR")).toThrow("bloqueado");
  });
});

describe("instruções", () => {
  it("começam não vistas e, marcadas, valem para o usuário atual", () => {
    expect(instrucoesForamVistas()).toBe(false);
    marcarInstrucoesVistas();
    expect(instrucoesForamVistas()).toBe(true);
    expect(Object.entries(localStorage)).toEqual([["gw:u1:instrucoesVistas", "true"]]);
    setCurrentUser("u2");
    expect(instrucoesForamVistas()).toBe(false);
  });
});

describe("rascunhos", () => {
  it("grava em JSON e lê de volta, por usuário", () => {
    salvarRascunhos({ "Upper A": { currentIdx: 1 } });
    expect(Object.entries(localStorage)).toEqual([["gw:u1:rascunho_treino", '{"Upper A":{"currentIdx":1}}']]);
    expect(carregarRascunhos()).toEqual({ "Upper A": { currentIdx: 1 } });
    setCurrentUser("u2");
    expect(carregarRascunhos()).toEqual({});
  });

  it("sem usuário usa a chave sem prefixo", () => {
    setCurrentUser(null);
    salvarRascunhos({ a: 1 });
    expect(localStorage.getItem("rascunho_treino")).toBe('{"a":1}');
  });

  it.each(["{{quebrado", "null", "5", '"texto"', ""])("%j vira vazio, sem cópia", (texto) => {
    localStorage.setItem("gw:u1:rascunho_treino", texto);
    expect(carregarRascunhos()).toEqual({});
    expect(Object.entries(localStorage)).toEqual([["gw:u1:rascunho_treino", texto]]);
  });

  it("leitura bloqueada vira vazio", () => {
    falhar("getItem");
    expect(carregarRascunhos()).toEqual({});
  });

  it("limpar apaga só o rascunho do usuário atual", () => {
    localStorage.setItem("gw:u2:rascunho_treino", "{}");
    localStorage.setItem("gw:u1:planoTreino", "{}");
    salvarRascunhos({ a: 1 });
    limparRascunhos();
    expect(Object.keys(localStorage).sort()).toEqual(["gw:u1:planoTreino", "gw:u2:rascunho_treino"]);
  });

  it.each(["setItem", "removeItem"] as const)("falha em %s sobe", (metodo) => {
    falhar(metodo);
    expect(() => (metodo === "setItem" ? salvarRascunhos({}) : limparRascunhos())).toThrow("bloqueado");
  });
});
