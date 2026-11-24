/**
 * Importar planilha com a coluna opcional rpe_alvo (EF_06 RG14, EF_08 RG4, EF_02 RG28).
 * Usa .xlsx e .csv de verdade, inclusive a célula que o Excel trocou por data.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import * as XLSX from "xlsx";
import AdminImport from "../../../components/adminImport/AdminImport";
import Exportar from "../../../components/exportar/Exportar";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { mensagens } from "../../../components/mensagens/mensagens";
import { noDialogo, renderComMensagens } from "../mensagens/helpers";

type Celula = string | number;
type Linha = [treino: string, exercicio: string, alvo?: Celula];
const AGO_7 = Date.UTC(2026, 7, 7) / 86400000 + 25569;
const TITULO = "Esforço alvo não lido";

const tabela = (linhas: Linha[], coluna: string | null): Celula[][] => [
  ["Treino", "Ord.", "Exercício", "Grupo", "Séries", "Top Mín", "Top Máx", ...(coluna ? [coluna] : [])],
  ...linhas.map(([treino, nome, alvo], i) => [treino, i + 1, nome, "Costas", 2, 6, 10, ...(coluna ? [alvo ?? ""] : [])]),
];
function xlsx(linhas: Linha[], coluna: string | null): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tabela(linhas, coluna)), "Logbook");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
const csv = (linhas: Linha[], coluna: string | null) => tabela(linhas, coluna).map((l) => l.join(";")).join("\n");

function leitor(result: string | ArrayBuffer) {
  const inst: Record<string, unknown> = {};
  const ler = () => (inst.onload as (e: unknown) => void)({ target: { result } });
  Object.assign(inst, { readAsText: ler, readAsArrayBuffer: ler });
  vi.stubGlobal("FileReader", function Leitor() { return inst; });
}
async function importar(linhas: Linha[], { coluna = "rpe_alvo" as string | null, formato = "xlsx", tela = "exportar" } = {}) {
  cleanup();
  mensagens.limpar();
  leitor(formato === "csv" ? csv(linhas, coluna) : xlsx(linhas, coluna));
  renderComMensagens(tela === "admin" ? <AdminImport /> : <Exportar />);
  if (tela === "exportar") fireEvent.click(screen.getByText(/migração planilha de treino/i));
  fireEvent.change(screen.getByTestId("file-input"), { target: { files: [new File(["x"], `treino.${formato}`)] } });
  await waitFor(() => expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled());
  fireEvent.click(screen.getByText("Confirmar importação"));
}
interface Ex { nome: string; rpeAlvo?: [number, number] }
const config = (): Record<string, Ex[]> => JSON.parse(localStorage.getItem("sessoes_config") || "{}");
const alvoDe = (sessao: string, nome: string) => config()[sessao]?.find((e) => e.nome === nome)?.rpeAlvo;
const aviso = () => mensagens.estado().avisos.find((a) => a.titulo === TITULO);

describe.each(["exportar", "admin"])("rpe_alvo na importação: %s", (tela) => {
  beforeEach(() => { localStorage.clear(); mensagens.limpar(); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it.each(["xlsx", "csv"])("grava o alvo da planilha no plano (.%s)", async (formato) => {
    await importar([["Lower A", "Stiff", "7-8"], ["Lower A", "Banco romano", "8 a 9"]], { formato, tela });
    expect(alvoDe("Lower A", "Stiff")).toEqual([7, 8]);
    expect(alvoDe("Lower A", "Banco romano")).toEqual([8, 9]);
    expect(aviso()).toBeUndefined();
  });

  it("célula que o Excel trocou por data volta como 7–8", async () => {
    await importar([["Lower A", "Stiff", AGO_7]], { tela });
    expect(alvoDe("Lower A", "Stiff")).toEqual([7, 8]);
    expect(aviso()).toBeUndefined();
  });

  it.each(["rpe_alvo", "RPE alvo", "RPE-Alvo", " rpe_alvo "])("cabeçalho %j", async (coluna) => {
    await importar([["Lower A", "Stiff", "7-8"]], { coluna, tela });
    expect(alvoDe("Lower A", "Stiff")).toEqual([7, 8]);
  });

  it.each([null, "RPE", "rpe_alvo_antigo"])("sem a coluna (%j): plano igual ao de antes, sem mensagem", async (coluna) => {
    await importar([["Lower A", "Stiff", "abc"]], { coluna, tela });
    expect(config()["Lower A"]![0]).not.toHaveProperty("rpeAlvo");
    expect(aviso()).toBeUndefined();
  });

  it("célula vazia: sem alvo e sem mensagem", async () => {
    await importar([["Lower A", "Stiff", ""], ["Lower A", "Supino máquina", "9-10"]], { tela });
    expect(config()["Lower A"]![0]).not.toHaveProperty("rpeAlvo");
    expect(aviso()).toBeUndefined();
  });

  it("célula ilegível: importa, e a mensagem diz só os exercícios que ficaram sem alvo", async () => {
    await importar([["Lower A", "Stiff", "8-7"], ["Lower A", "Banco romano", "7-8"], ["Upper A", "Remada curvada", "07/ago"]], { tela });
    expect(config()["Lower A"]).toHaveLength(2);
    expect(config()["Lower A"]![0]).not.toHaveProperty("rpeAlvo");
    expect(aviso()).toMatchObject({
      tipo: "erro",
      texto: "Estes exercícios ficaram sem o alvo da planilha: Remada curvada (Upper A) · Stiff (Lower A). Use o formato 7-8.",
    });
    expect(screen.getByText(TITULO)).toBeInTheDocument();
    expect(screen.getByText("Importação concluída")).toBeInTheDocument();
  });

  it("o mesmo exercício em duas sessões tem um alvo em cada", async () => {
    await importar([["Lower A", "Stiff", "7-8"], ["Lower B", "Stiff", "9-10"]], { tela });
    expect(alvoDe("Lower A", "Stiff")).toEqual([7, 8]);
    expect(alvoDe("Lower B", "Stiff")).toEqual([9, 10]);
  });

  it("falha ao gravar: sem mensagem de alvo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k, v) {
      if (k === "sessoes_config") throw new DOMException("cheio", "QuotaExceededError");
      original.call(this, k, v);
    });
    await importar([["Lower A", "Stiff", "abc"]], { tela });
    expect(aviso()).toBeUndefined();
    expect(screen.getByText("Sem espaço no aparelho")).toBeInTheDocument();
  });

  it("reimportar sem a coluna volta à regra automática; desfazer restaura o alvo", async () => {
    await importar([["Lower A", "Stiff", "7-8"]], { tela });
    await importar([["Lower A", "Stiff"]], { coluna: null, tela });
    expect(config()["Lower A"]![0]).not.toHaveProperty("rpeAlvo");
    fireEvent.click(screen.getByText("Desfazer importação"));
    noDialogo("Desfazer");
    expect(alvoDe("Lower A", "Stiff")).toEqual([7, 8]);
  });
});

describe("rpe_alvo na tela de treino", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());
  const abrirTreino = () => {
    cleanup();
    renderComMensagens(<TreinoSessao />);
    fireEvent.click(screen.getByRole("button", { name: "Lower A" }));
  };

  it("o alvo da planilha vale acima da regra automática", async () => {
    await importar([["Lower A", "Stiff", "7-8"]]);
    abrirTreino();
    expect(screen.getByText(/alvo RPE 7–8/)).toBeInTheDocument();
  });

  it("e acima do cadastro", async () => {
    await importar([["Lower A", "Cadeira extensora", "6-7"]]);
    abrirTreino();
    expect(screen.getByText(/alvo RPE ≤6–7/)).toBeInTheDocument();
  });

  it("sem alvo legível, regra automática de antes", async () => {
    await importar([["Lower A", "Stiff", "abc"]]);
    abrirTreino();
    expect(screen.getByText(/alvo RPE 9–10/)).toBeInTheDocument();
  });

  it("exercício repetido no dia: o alvo só na segunda linha vale", async () => {
    await importar([["Lower A", "Stiff", "abc"], ["Lower A", "Stiff", "7-8"]]);
    expect(config()["Lower A"]).toHaveLength(1);
    expect(alvoDe("Lower A", "Stiff")).toEqual([7, 8]);
    expect(aviso()).toBeUndefined();
  });
});
