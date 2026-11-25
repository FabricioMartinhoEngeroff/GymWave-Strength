/**
 * As importações de plano apagam o rascunho de todas as sessões do usuário (EF_06, EF_08).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import AdminImport from "../../components/adminImport/AdminImport";
import TextImport from "../../components/adminImport/TextImport";
import Exportar from "../../components/exportar/Exportar";
import { mensagens } from "../../components/mensagens/mensagens";
import { setCurrentUser } from "../../utils/storage";
import { renderComMensagens } from "./mensagens/helpers";

const CSV = "Treino;Ord.;Exercício;Grupo;Séries;Top Mín;Top Máx\nUpper A;1;Remada;Costas;2;6;10";
const DE_U1 = "gw:u1:rascunho_treino";
const DE_U2 = "gw:u2:rascunho_treino";
const PLANO_ANTIGO = '{"antigo":{}}';
const plano = () => localStorage.getItem("gw:u1:planoTreino");

async function planilha(tela: "exportar" | "admin") {
  const inst: Record<string, unknown> = {};
  const ler = () => (inst.onload as (e: unknown) => void)({ target: { result: CSV } });
  Object.assign(inst, { readAsText: ler, readAsArrayBuffer: ler });
  vi.stubGlobal("FileReader", function Leitor() { return inst; });
  renderComMensagens(tela === "admin" ? <AdminImport /> : <Exportar />);
  if (tela === "exportar") fireEvent.click(screen.getByText(/migração planilha de treino/i));
  fireEvent.change(screen.getByTestId("file-input"), { target: { files: [new File(["x"], "treino.csv")] } });
  await waitFor(() => expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled());
  return () => fireEvent.click(screen.getByText("Confirmar importação"));
}
async function texto() {
  renderComMensagens(<TextImport />);
  fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: "## Upper A\nRemada | Costas | 6-10 | 8-10 | 60kg" } });
  return () => fireEvent.click(screen.getByText("Salvar treino"));
}
const TELAS: [string, () => Promise<() => void>, boolean][] = [
  ["Exportar", () => planilha("exportar"), true],
  ["AdminImport", () => planilha("admin"), true],
  ["TextImport", texto, false],
];

describe.each(TELAS)("%s e o rascunho", (_nome, preparar, desfazSeNaoApagar) => {
  beforeEach(() => {
    localStorage.clear();
    mensagens.limpar();
    vi.spyOn(console, "error").mockImplementation(() => {});
    setCurrentUser("u1");
    localStorage.setItem("gw:u1:planoTreino", PLANO_ANTIGO);
    localStorage.setItem(DE_U1, '{"Upper A":{},"Lower A":{}}');
    localStorage.setItem(DE_U2, '{"Upper A":{}}');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); setCurrentUser(null); });

  it("importar apaga o rascunho de todas as sessões, só do usuário atual", async () => {
    (await preparar())();
    expect(plano()).toContain("Remada");
    expect(localStorage.getItem(DE_U1)).toBeNull();
    expect(localStorage.getItem(DE_U2)).toBe('{"Upper A":{}}');
  });

  it("falha ao gravar o plano mantém o rascunho", async () => {
    const confirmar = await preparar();
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k, v) {
      if (k === "gw:u1:sessoes_config") throw new DOMException("cheio", "QuotaExceededError");
      original.call(this, k, v);
    });
    confirmar();
    expect(plano()).toBe(PLANO_ANTIGO);
    expect(localStorage.getItem(DE_U1)).toBe('{"Upper A":{},"Lower A":{}}');
  });

  it(`falha ao apagar o rascunho: o plano ${desfazSeNaoApagar ? "volta ao que era" : "novo já ficou gravado (fora da transação)"}`, async () => {
    const confirmar = await preparar();
    const original = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, k) {
      if (k === DE_U1) throw new DOMException("bloqueado", "SecurityError");
      original.call(this, k);
    });
    confirmar();
    if (desfazSeNaoApagar) expect(plano()).toBe(PLANO_ANTIGO);
    else expect(plano()).toContain("Remada");
  });
});
