/**
 * Exportar + central de mensagens — importação de arquivo (EF_09 RG13, RG16)
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import Exportar from "../../../components/exportar/Exportar";
import { noDialogo, renderComMensagens } from "../mensagens/helpers";

vi.mock("xlsx", () => ({ read: vi.fn(), utils: { sheet_to_json: vi.fn(() => []) } }));
vi.mock("papaparse", () => ({ default: { parse: vi.fn() } }));

function leitor(falha = false) {
  const inst: Record<string, unknown> = {};
  const ler = () => {
    const fn = (falha ? inst.onerror : inst.onload) as (e: unknown) => void;
    fn({ target: { result: new ArrayBuffer(0) } });
  };
  Object.assign(inst, { readAsText: ler, readAsArrayBuffer: ler });
  vi.stubGlobal("FileReader", function Leitor() { return inst; });
}

function enviar(nome: string) {
  renderComMensagens(<Exportar />);
  fireEvent.click(screen.getByText(/migração planilha de treino/i));
  fireEvent.change(screen.getByTestId("file-input"), { target: { files: [new File(["x"], nome)] } });
}
const LINHA = { sessao: "Upper A", exercicio: "Supino reto barra", "peso c1": "100", series: 2 };

describe("Exportar — arquivos com problema", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("planilha ilegível avisa e não deixa a tela presa em 'Lendo'", () => {
    leitor();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(XLSX.read).mockImplementation(() => { throw new Error("zip corrompido"); });
    enviar("treino.xlsx");
    expect(screen.getByText("Arquivo não reconhecido")).toBeInTheDocument();
    expect(screen.queryByText(/Lendo:/)).toBeNull();
  });

  it("falha do leitor de arquivo também avisa", () => {
    leitor(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    enviar("treino.xlsx");
    expect(screen.getByText("Arquivo não reconhecido")).toBeInTheDocument();
  });

  it("planilha sem exercícios avisa", () => {
    leitor();
    vi.mocked(Papa.parse).mockReturnValue({ data: [], errors: [], meta: {} } as never);
    enviar("treino.csv");
    expect(screen.getByText("Nada para importar")).toBeInTheDocument();
    expect(screen.queryByText(/Lendo:/)).toBeNull();
  });

  it("falha ao gravar desfaz tudo e avisa", () => {
    leitor();
    vi.mocked(Papa.parse).mockReturnValue({ data: [LINHA], errors: [], meta: {} } as never);
    localStorage.setItem("planoTreino", '{"antigo":{}}');
    enviar("treino.csv");
    const original = Storage.prototype.setItem;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k, v) {
      if (k === "sessoes_config") throw new DOMException("cheio", "QuotaExceededError");
      original.call(this, k, v);
    });
    fireEvent.click(screen.getByText("Confirmar importação"));
    expect(localStorage.getItem("planoTreino")).toBe('{"antigo":{}}');
    expect(screen.getByText("Sem espaço no aparelho")).toBeInTheDocument();
  });

  it("sucesso avisa; desfazer pede confirmação e avisa", () => {
    leitor();
    vi.mocked(Papa.parse).mockReturnValue({ data: [LINHA], errors: [], meta: {} } as never);
    enviar("treino.csv");
    fireEvent.click(screen.getByText("Confirmar importação"));
    expect(screen.getByText("Importação concluída")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Desfazer importação"));
    noDialogo("Desfazer");
    expect(screen.getByText("Importação desfeita")).toBeInTheDocument();
  });
});
