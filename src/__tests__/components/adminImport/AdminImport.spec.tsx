/**
 * AdminImportTest -> components/adminImport
 * Testa a tela de importacao de dados Saizen via xlsx/csv.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminImport from "../../../components/adminImport/AdminImport";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ROWS = [
  {
    treino_id: "UA",
    treino: "Upper A",
    ordem: 1,
    exercicio: "Supino reto barra",
    grupo: "Peitoral",
    tipo: "composto",
    faixa_top_min: 5,
    faixa_top_max: 9,
    faixa_backoff_min: 9,
    faixa_backoff_max: 15,
    top_set_kg: 100,
    backoff_kg: 85,
  },
  {
    treino_id: "LA",
    treino: "Lower A",
    ordem: 1,
    exercicio: "Terra sumô",
    grupo: "Posterior/Glúteo",
    tipo: "composto",
    faixa_top_min: 5,
    faixa_top_max: 9,
    faixa_backoff_min: 9,
    faixa_backoff_max: 15,
    top_set_kg: 160,
    backoff_kg: "",
  },
];

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn(() => ({ data: MOCK_ROWS, errors: [], meta: {} })),
  },
}));

vi.mock("xlsx", () => ({
  read: vi.fn(() => ({ Sheets: { Sheet1: {} }, SheetNames: ["Sheet1"] })),
  utils: {
    sheet_to_json: vi.fn((_ws: unknown, opts?: { header?: number }) => {
      if (opts?.header === 1) {
        return [
          ["treino_id", "treino", "ordem", "exercicio", "grupo", "tipo", "faixa_top_min", "faixa_top_max", "faixa_backoff_min", "faixa_backoff_max", "top_set_kg", "backoff_kg"],
          ...MOCK_ROWS.map((r) => [r.treino_id, r.treino, r.ordem, r.exercicio, r.grupo, r.tipo, r.faixa_top_min, r.faixa_top_max, r.faixa_backoff_min, r.faixa_backoff_max, r.top_set_kg, r.backoff_kg]),
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
  vi.stubGlobal("FileReader", function MockFileReader() { return instance; });
  return instance;
}

function makeFile(name: string, type = "text/csv"): File {
  return new File(["mock"], name, { type });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminImport — Importacao Saizen xlsx/csv", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Renderizacao inicial", () => {
    it("exibe titulo e subtitulo", () => {
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

    it("botao Confirmar importacao comeca desabilitado", () => {
      render(<AdminImport />);
      const btn = screen.getByText("Confirmar importação").closest("button");
      expect(btn).toBeDisabled();
    });

    it("botao Limpar tudo esta sempre habilitado", () => {
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
    it("exibe preview apos carregar arquivo CSV", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText(/pré-visualização.*2 exercícios/i)).toBeInTheDocument();
      });
    });

    it("exibe exercicios na tabela de preview", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Supino reto barra")).toBeInTheDocument();
        expect(screen.getByText("Terra sumô")).toBeInTheDocument();
      });
    });

    it("habilita botao Confirmar apos carregar arquivo", async () => {
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

    it("exibe cabecalhos Top Set e Back-off na tabela", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Top Set kg")).toBeInTheDocument();
        expect(screen.getByText("B-off kg")).toBeInTheDocument();
      });
    });
  });

  describe("Confirmacao de importacao", () => {
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

    it("salva dados no logbook apos confirmar", async () => {
      await loadAndConfirm();

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      expect(logbook["Supino reto barra"]).toBeDefined();
      expect(logbook["Supino reto barra"][0].topSetKg).toBe(100);
    });

    it("salva dados no dadosTreino (compatibilidade) apos confirmar", async () => {
      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino reto barra"]).toBeDefined();
      expect(db["Supino reto barra"]["UA"]).toBeDefined();
    });

    it("calcula backoff automaticamente quando nao fornecido", async () => {
      await loadAndConfirm();

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      // Terra sumo: top_set_kg=160, backoff_kg vazio -> 160*0.85=136
      expect(logbook["Terra sumô"][0].backoffKg).toBe(136);
    });

    it("exibe resultado com total de registros salvos", async () => {
      await loadAndConfirm();
      expect(screen.getByText(/importação concluída/i)).toBeInTheDocument();
      expect(screen.getByText(/2 registros salvos/i)).toBeInTheDocument();
    });

    it("exibe feedback por treino", async () => {
      await loadAndConfirm();
      expect(screen.getByText(/Upper A/)).toBeInTheDocument();
      expect(screen.getByText(/Lower A/)).toBeInTheDocument();
    });

    it("reseta preview apos confirmar", async () => {
      await loadAndConfirm();
      expect(screen.queryByText("Pré-visualização")).not.toBeInTheDocument();
    });
  });

  describe("Desfazer importacao", () => {
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

    it("salva backup antes de importar", async () => {
      localStorage.setItem("logbook", JSON.stringify({ "Agachamento livre": [] }));
      await importarDados();
      const backup = localStorage.getItem("logbook_backup");
      expect(backup).not.toBeNull();
    });

    it("exibe botao Desfazer importacao apos confirmar", async () => {
      await importarDados();
      expect(screen.getByText(/desfazer importação/i)).toBeInTheDocument();
    });

    it("restaura dados do backup ao clicar em desfazer", async () => {
      localStorage.setItem("logbook", JSON.stringify({ "Agachamento livre": [] }));
      localStorage.setItem("dadosTreino", JSON.stringify({ "Agachamento livre": {} }));
      await importarDados();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      fireEvent.click(screen.getByText(/desfazer importação/i));
      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      expect(logbook).toHaveProperty("Agachamento livre");
    });
  });

  describe("Limpar tudo", () => {
    it("abre confirm antes de limpar", () => {
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<AdminImport />);
      fireEvent.click(screen.getByText("Limpar tudo"));
      expect(confirmSpy).toHaveBeenCalledOnce();
    });

    it("limpa logbook e dadosTreino se o usuario confirmar", () => {
      localStorage.setItem("logbook", JSON.stringify({ x: [] }));
      localStorage.setItem("dadosTreino", JSON.stringify({ x: {} }));
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<AdminImport />);
      fireEvent.click(screen.getByText("Limpar tudo"));
      expect(localStorage.getItem("logbook")).toBeNull();
      expect(localStorage.getItem("dadosTreino")).toBeNull();
    });
  });
});
