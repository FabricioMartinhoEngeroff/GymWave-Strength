/**
 * AdminImportTest → components/adminImport
 * Testa a tela de importação de dados via xlsx/csv:
 * upload, preview, confirmação, salvamento e reset do localStorage.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminImport from "../../../components/adminImport/AdminImport";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ROWS = [
  {
    sessao: "Upper A",
    ordem: 1,
    exercicio: "Supino Reto",
    musculo_primario: "peitoral",
    series_validas: 3,
    rep_min: 6,
    rep_max: 10,
    peso_C1_kg: 60,
    peso_C2_kg: 70,
    peso_C3_kg: 80,
    peso_C4_kg: "",
  },
  {
    sessao: "Lower A",
    ordem: 1,
    exercicio: "Agachamento",
    musculo_primario: "quadríceps",
    series_validas: 3,
    rep_min: 6,
    rep_max: 10,
    peso_C1_kg: 80,
    peso_C2_kg: "",
    peso_C3_kg: "",
    peso_C4_kg: "",
  },
];

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("papaparse", () => ({
  default: {
    // Papa.parse is used in synchronous mode (returns result object)
    parse: vi.fn(() => ({ data: MOCK_ROWS, errors: [], meta: {} })),
  },
}));

vi.mock("xlsx", () => ({
  read: vi.fn(() => ({ Sheets: { Sheet1: {} }, SheetNames: ["Sheet1"] })),
  utils: {
    sheet_to_json: vi.fn((_ws: unknown, opts?: { header?: number }) => {
      if (opts?.header === 1) {
        // Retorna array de arrays: linha 0 = cabeçalho, linhas 1+ = dados
        return [
          ["sessao", "ordem", "exercicio", "musculo_primario", "series_validas", "rep_min", "rep_max", "peso_C1_kg", "peso_C2_kg", "peso_C3_kg", "peso_C4_kg"],
          ...MOCK_ROWS.map((r) => [r.sessao, r.ordem, r.exercicio, r.musculo_primario, r.series_validas, r.rep_min, r.rep_max, r.peso_C1_kg, r.peso_C2_kg, r.peso_C3_kg, r.peso_C4_kg]),
        ];
      }
      return MOCK_ROWS;
    }),
  },
}));

// ─── FileReader mock ──────────────────────────────────────────────────────────

function mockFileReader(resultValue: string | ArrayBuffer) {
  const instance: {
    onload: ((e: { target: { result: string | ArrayBuffer } }) => void) | null;
    readAsText: ReturnType<typeof vi.fn>;
    readAsArrayBuffer: ReturnType<typeof vi.fn>;
  } = {
    onload: null,
    readAsText: vi.fn(function () {
      instance.onload?.({ target: { result: resultValue } });
    }),
    readAsArrayBuffer: vi.fn(function () {
      instance.onload?.({ target: { result: resultValue } });
    }),
  };
  // Must use a regular function (not arrow) so it works as a constructor
  vi.stubGlobal("FileReader", function MockFileReader() { return instance; });
  return instance;
}

function makeFile(name: string, type = "text/csv"): File {
  return new File(["mock"], name, { type });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminImport — Importação de dados xlsx/csv", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Renderização inicial", () => {
    it("exibe título e subtítulo", () => {
      render(<AdminImport />);
      expect(screen.getByText("Importar dados")).toBeInTheDocument();
      expect(screen.getByText(/popular o histórico/i)).toBeInTheDocument();
    });

    it("exibe a drop zone", () => {
      render(<AdminImport />);
      expect(
        screen.getByText(/arraste e solte/i)
      ).toBeInTheDocument();
    });

    it("botão Confirmar importação começa desabilitado", () => {
      render(<AdminImport />);
      const btn = screen.getByText("Confirmar importação").closest("button");
      expect(btn).toBeDisabled();
    });

    it("botão Limpar tudo está sempre habilitado", () => {
      render(<AdminImport />);
      const btn = screen.getByText("Limpar tudo").closest("button");
      expect(btn).not.toBeDisabled();
    });

    it("input aceita apenas .xlsx e .csv", () => {
      render(<AdminImport />);
      const input = screen.getByTestId("file-input") as HTMLInputElement;
      expect(input.accept).toBe(".xlsx,.csv");
    });
  });

  describe("Carregamento de CSV", () => {
    it("exibe preview após carregar arquivo CSV", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Pré-visualização (2 linhas)")).toBeInTheDocument();
      });
    });

    it("exibe exercícios na tabela de preview", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Supino Reto")).toBeInTheDocument();
        expect(screen.getByText("Agachamento")).toBeInTheDocument();
      });
    });

    it("habilita botão Confirmar após carregar arquivo", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        const btn = screen.getByText("Confirmar importação").closest("button");
        expect(btn).not.toBeDisabled();
      });
    });

    it("exibe cabeçalhos de ciclo na tabela", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("C1 kg")).toBeInTheDocument();
        expect(screen.getByText("C2 kg")).toBeInTheDocument();
        expect(screen.getByText("C3 kg")).toBeInTheDocument();
        expect(screen.getByText("C4 kg")).toBeInTheDocument();
      });
    });
  });

  describe("Carregamento de XLSX", () => {
    it("exibe preview após carregar arquivo xlsx", async () => {
      mockFileReader(new ArrayBuffer(0));
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: {
          files: [
            makeFile(
              "treinos.xlsx",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ),
          ],
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Pré-visualização (2 linhas)")).toBeInTheDocument();
      });
    });
  });

  describe("Confirmação de importação", () => {
    async function loadAndConfirm() {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva dados no localStorage após confirmar", async () => {
      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]).toBeDefined();
      expect(db["Supino Reto"]["C1"]).toBeDefined();
      expect(db["Supino Reto"]["C1"].pesos[0]).toBe("60");
    });

    it("salva pesos de múltiplos ciclos para o mesmo exercício", async () => {
      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"]).toBeDefined();
      expect(db["Supino Reto"]["C2"]).toBeDefined();
      expect(db["Supino Reto"]["C3"]).toBeDefined();
      expect(db["Supino Reto"]["C4"]).toBeUndefined(); // peso_C4 estava vazio
    });

    it("pesos sem valor não são salvos", async () => {
      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      // Agachamento só tem C1 preenchido
      expect(db["Agachamento"]["C1"]).toBeDefined();
      expect(db["Agachamento"]["C2"]).toBeUndefined();
    });

    it("exibe resultado com total de registros salvos", async () => {
      await loadAndConfirm();
      // Supino: C1+C2+C3 = 3; Agachamento: C1 = 1; total = 4
      expect(screen.getByText(/importação concluída/i)).toBeInTheDocument();
      expect(screen.getByText(/4 registros salvos/i)).toBeInTheDocument();
    });

    it("exibe feedback por sessão", async () => {
      await loadAndConfirm();
      expect(screen.getByText(/Upper A/)).toBeInTheDocument();
      expect(screen.getByText(/Lower A/)).toBeInTheDocument();
    });

    it("reseta preview após confirmar", async () => {
      await loadAndConfirm();
      expect(screen.queryByText("Pré-visualização")).not.toBeInTheDocument();
    });

    it("reps são salvas vazias (usuário preenche no treino)", async () => {
      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"].reps[0]).toBe("");
    });

    it("pesos são repetidos para todas as séries válidas", async () => {
      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      const pesos = db["Supino Reto"]["C1"].pesos;
      expect(pesos).toHaveLength(3); // series_validas = 3
      expect(pesos.every((p: string) => p === "60")).toBe(true);
    });
  });

  describe("Desfazer importação", () => {
    async function importarDados() {
      mockFileReader("mock csv content");
      render(<AdminImport />);
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva backup do dadosTreino antes de importar", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify({ "Agachamento": {} }));
      await importarDados();
      const backup = localStorage.getItem("dadosTreino_backup");
      expect(backup).not.toBeNull();
      expect(JSON.parse(backup!)).toHaveProperty("Agachamento");
    });

    it("exibe botão 'Desfazer importação' após confirmar", async () => {
      await importarDados();
      expect(screen.getByText(/desfazer importação/i)).toBeInTheDocument();
    });

    it("restaura dados do backup ao clicar em desfazer (confirm=true)", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify({ "Agachamento": {} }));
      await importarDados();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      fireEvent.click(screen.getByText(/desfazer importação/i));
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db).toHaveProperty("Agachamento");
      expect(db).not.toHaveProperty("Supino Reto");
    });

    it("não restaura se o usuário cancelar o confirm", async () => {
      await importarDados();
      vi.spyOn(window, "confirm").mockReturnValue(false);
      fireEvent.click(screen.getByText(/desfazer importação/i));
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db).toHaveProperty("Supino Reto");
    });

    it("esconde o resultado após desfazer", async () => {
      await importarDados();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      fireEvent.click(screen.getByText(/desfazer importação/i));
      expect(screen.queryByText(/importação concluída/i)).not.toBeInTheDocument();
    });
  });

  describe("Limpar tudo", () => {
    it("abre confirm antes de limpar", () => {
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<AdminImport />);
      fireEvent.click(screen.getByText("Limpar tudo"));
      expect(confirmSpy).toHaveBeenCalledOnce();
    });

    it("não limpa se o usuário cancelar o confirm", () => {
      localStorage.setItem("dadosTreino", JSON.stringify({ "Supino Reto": {} }));
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<AdminImport />);
      fireEvent.click(screen.getByText("Limpar tudo"));
      expect(localStorage.getItem("dadosTreino")).not.toBeNull();
    });

    it("limpa localStorage se o usuário confirmar", () => {
      localStorage.setItem("dadosTreino", JSON.stringify({ "Supino Reto": {} }));
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<AdminImport />);
      fireEvent.click(screen.getByText("Limpar tudo"));
      expect(localStorage.getItem("dadosTreino")).toBeNull();
    });
  });
});
