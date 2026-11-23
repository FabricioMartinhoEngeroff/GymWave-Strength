/**
 * traduzirErro e capturaGlobal → components/mensagens (EF_09 RG15)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { idDoErro, ehRuido } from "../../../components/mensagens/domain/traduzirErro";
import { instalarCapturaGlobal } from "../../../components/mensagens/capturaGlobal";
import { mensagens } from "../../../components/mensagens/mensagens";
import { carregarRegistros } from "../../../utils/storage";

const dom = (nome: string) => new DOMException("x", nome);

describe("idDoErro", () => {
  it.each([
    [dom("QuotaExceededError"), "armazenamento_cheio"],
    [dom("NS_ERROR_DOM_QUOTA_REACHED"), "armazenamento_cheio"],
    [dom("SecurityError"), "armazenamento_bloqueado"],
    [new TypeError("Failed to fetch"), "sem_conexao"],
    [new TypeError("NetworkError when attempting to fetch resource."), "sem_conexao"],
    [new TypeError("Load failed"), "sem_conexao"],
    [Object.assign(new Error("Network Error"), { code: "ERR_NETWORK" }), "sem_conexao"],
    [new SyntaxError("Unexpected token"), "dados_ilegiveis"],
    [new Error("qualquer"), "erro_inesperado"],
    ["texto", "erro_inesperado"],
    [undefined, "erro_inesperado"],
  ])("%s → %s", (erro, id) => expect(idDoErro(erro)).toBe(id));

  it.each([["ResizeObserver loop limit exceeded", true], ["Script error.", true], ["falha real", false]])(
    "ruído: %s → %s", (msg, esperado) => expect(ehRuido(msg)).toBe(esperado));
});

describe("instalarCapturaGlobal", () => {
  let remover: () => void;
  beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); remover = instalarCapturaGlobal(); });
  afterEach(() => { remover(); vi.restoreAllMocks(); });
  const ids = () => mensagens.estado().avisos.map((a) => a.id);
  const erro = (error: unknown, message = "") => window.dispatchEvent(new ErrorEvent("error", { error, message }));

  it("erro não tratado vira mensagem amigável", () => {
    erro(dom("QuotaExceededError"));
    expect(ids()).toEqual(["armazenamento_cheio"]);
  });

  it("promessa rejeitada também", () => {
    const e = new Event("unhandledrejection");
    window.dispatchEvent(Object.assign(e, { reason: new TypeError("Failed to fetch") }));
    expect(ids()).toEqual(["sem_conexao"]);
  });

  it("ignora ruído do navegador", () => {
    erro(undefined, "ResizeObserver loop completed with undelivered notifications.");
    expect(ids()).toEqual([]);
  });

  it("avisa quando parte dos dados está ilegível (RG12)", () => {
    localStorage.setItem("registros", "{quebrado");
    carregarRegistros();
    expect(ids()).toEqual(["dados_corrompidos"]);
  });

  it("depois de remover não captura mais", () => {
    remover();
    const outro = () => {}; // sem nenhum ouvinte o vitest acusa erro não tratado
    window.addEventListener("error", outro);
    erro(new Error("x"));
    window.removeEventListener("error", outro);
    expect(ids()).toEqual([]);
  });
});
