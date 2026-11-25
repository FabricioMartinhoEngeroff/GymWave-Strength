/**
 * rascunho → domain: como o rascunho é lido, gravado e apagado no aparelho (EF_02 RG12).
 * A leitura nunca lança erro: rascunho impossível de ler vale como "sem rascunho".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { clearDraft, loadDraft, rascunhoCombina, saveDraft } from "../../../../components/treinoSessao/domain/rascunho";
import { emptyExerciseState } from "../../../../components/treinoSessao/domain/estadoExercicio";
import { setCurrentUser } from "../../../../utils/storage";

const CHAVE = "rascunho_treino";
const estados = (topSetKg: string) => ({ Stiff: { ...emptyExerciseState(), topSetKg } });
const guardado = (): unknown => JSON.parse(localStorage.getItem(CHAVE) ?? "null");
const falhar = (metodo: "getItem" | "setItem" | "removeItem") =>
  vi.spyOn(Storage.prototype, metodo).mockImplementation(() => { throw new DOMException("bloqueado", "SecurityError"); });

beforeEach(() => { localStorage.clear(); setCurrentUser(null); });
afterEach(() => { vi.restoreAllMocks(); setCurrentUser(null); });

describe("rascunho", () => {
  it("grava um objeto por sessão, em JSON, e devolve true", () => {
    expect(saveDraft("Upper A", estados("80"), 2)).toBe(true);
    expect(saveDraft("Lower A", estados("120"), 0)).toBe(true);
    expect(localStorage.getItem(CHAVE)).toBe(JSON.stringify({
      "Upper A": { states: estados("80"), currentIdx: 2 },
      "Lower A": { states: estados("120"), currentIdx: 0 },
    }));
  });

  it("lê o que gravou", () => {
    saveDraft("Upper A", estados("80"), 2);
    expect(loadDraft("Upper A")).toEqual({ states: estados("80"), currentIdx: 2 });
    expect(loadDraft("Lower A")).toBeNull();
  });

  it("cada usuário tem o seu", () => {
    setCurrentUser("u1");
    saveDraft("Upper A", estados("80"), 0);
    expect(localStorage.getItem("gw:u1:rascunho_treino")).not.toBeNull();
    setCurrentUser("u2");
    expect(loadDraft("Upper A")).toBeNull();
  });

  describe("a leitura nunca lança", () => {
    it.each(["{{quebrado", "null", "5", '"texto"', "true", "", '{"Upper A":"texto"}', '{"Upper A":null}', '{"Upper A":{}}', '{"Upper A":{"states":5}}', "[]", "[1,2]"])(
      "%j → sem rascunho", (texto) => {
        localStorage.setItem(CHAVE, texto);
        expect(loadDraft("Upper A")).toBeNull();
        expect(localStorage.getItem(CHAVE)).toBe(texto); // ler não altera nem copia
        expect(Object.keys(localStorage)).toEqual([CHAVE]);
      },
    );

    it("aparelho que bloqueia a leitura → sem rascunho", () => {
      falhar("getItem");
      expect(loadDraft("Upper A")).toBeNull();
    });
  });

  it("índice inválido volta 0", () => {
    localStorage.setItem(CHAVE, JSON.stringify({ "Upper A": { states: estados("80"), currentIdx: "x" } }));
    expect(loadDraft("Upper A")?.currentIdx).toBe(0);
  });

  it("gravar por cima de texto ilegível começa um rascunho novo", () => {
    localStorage.setItem(CHAVE, "{{quebrado");
    expect(saveDraft("Upper A", estados("80"), 0)).toBe(true);
    expect(guardado()).toEqual({ "Upper A": { states: estados("80"), currentIdx: 0 } });
  });

  it("lista é aceita como objeto: gravar nela não guarda a sessão", () => {
    localStorage.setItem(CHAVE, "[]");
    expect(saveDraft("Upper A", estados("80"), 0)).toBe(true);
    expect(localStorage.getItem(CHAVE)).toBe("[]");
  });

  it("falha ao gravar devolve false, sem lançar", () => {
    falhar("setItem");
    expect(saveDraft("Upper A", estados("80"), 0)).toBe(false);
  });

  describe("apagar", () => {
    it("tira só a sessão pedida", () => {
      saveDraft("Upper A", estados("80"), 0);
      saveDraft("Lower A", estados("120"), 1);
      clearDraft("Upper A");
      expect(guardado()).toEqual({ "Lower A": { states: estados("120"), currentIdx: 1 } });
    });

    it("a última sessão remove a chave inteira", () => {
      saveDraft("Upper A", estados("80"), 0);
      clearDraft("Upper A");
      expect(localStorage.getItem(CHAVE)).toBeNull();
    });

    it("texto ilegível: a chave é removida", () => {
      localStorage.setItem(CHAVE, "{{quebrado");
      clearDraft("Upper A");
      expect(localStorage.getItem(CHAVE)).toBeNull();
    });

    it("falha ao regravar ou remover sobe para quem chamou", () => {
      saveDraft("Upper A", estados("80"), 0);
      saveDraft("Lower A", estados("120"), 0);
      falhar("setItem");
      expect(() => clearDraft("Upper A")).toThrow("bloqueado");
      vi.restoreAllMocks();
      clearDraft("Upper A");
      falhar("removeItem");
      expect(() => clearDraft("Lower A")).toThrow("bloqueado");
    });
  });

  it("rascunhoCombina: basta um exercício em comum", () => {
    expect(rascunhoCombina(estados("80"), new Set(["Stiff", "Supino"]))).toBe(true);
    expect(rascunhoCombina(estados("80"), new Set(["Supino"]))).toBe(false);
  });
});
