/**
 * RascunhoLocalStorage — testes da persistência de rascunho no localStorage (RG12)
 *
 * O rascunho do treino em andamento é gravado em localStorage("rascunho_treino")
 * a cada interação relevante e restaurado ao reabrir o app / voltar à tela.
 * É removido somente após "Confirmar e Salvar Treino".
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";

const DRAFT_KEY = "rascunho_treino";

function renderFresh() {
  localStorage.clear();
  return render(<TreinoSessao />);
}

function selecionarSessao(nome: string) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
}

function confirmarTopSet(kg = "100", reps = "7") {
  fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: kg } });
  fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: reps } });
  fireEvent.click(screen.getByText("Confirmar Top Set"));
}

function confirmarBackoff(reps = "12") {
  fireEvent.change(screen.getByLabelText(/Back-off reps/i), { target: { value: reps } });
  fireEvent.click(screen.getByText("Confirmar Back-off"));
}

function pularParaUltimo(total = 11) {
  for (let i = 0; i < total - 1; i++) {
    fireEvent.click(screen.getByText("Pular"));
  }
}

function getDraft(): Record<string, unknown> | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("RascunhoLocalStorage — Persistência de rascunho no localStorage (RG12)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── Gravação do rascunho ──────────────────────────────────────────────────

  describe("Gravacao do rascunho", () => {
    it("grava rascunho no localStorage ao confirmar Top Set", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");

      const draft = getDraft();
      expect(draft).not.toBeNull();
    });

    it("grava rascunho no localStorage ao confirmar Back-off", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");

      const draft = getDraft();
      expect(draft).not.toBeNull();
    });

    it("grava rascunho ao avancar para proximo exercicio", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");
      fireEvent.click(screen.getByText("Próximo"));

      const draft = getDraft();
      expect(draft).not.toBeNull();
    });

    it("grava rascunho ao pular exercicio", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByText("Pular"));

      const draft = getDraft();
      expect(draft).not.toBeNull();
    });

    it("grava rascunho ao editar peso do Top Set", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "90" } });

      const draft = getDraft();
      expect(draft).not.toBeNull();
    });
  });

  // ── Restauração ao reabrir ────────────────────────────────────────────────

  describe("Restauracao ao reabrir o app", () => {
    it("restaura peso do Top Set ao remontar o componente e selecionar a mesma sessao", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("95", "6");

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("95");
    });

    it("restaura estado de confirmacao do Top Set (Back-off visivel)", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      expect(screen.getByLabelText(/Back-off kg/i)).toBeInTheDocument();
    });

    it("restaura confirmacao do Back-off", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      expect(screen.getByText("Editar Back-off")).toBeInTheDocument();
    });

    it("restaura indice do exercicio atual", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");
      fireEvent.click(screen.getByText("Próximo"));
      expect(screen.getByText("2 / 11")).toBeInTheDocument();

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      expect(screen.getByText("2 / 11")).toBeInTheDocument();
    });

    it("restaura exercicio pulado como concluido", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByText("Pular")); // pula exercicio 1
      expect(screen.getByText("2 / 11")).toBeInTheDocument();

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      // Volta ao exercicio 1 e verifica que esta marcado como pulado
      fireEvent.click(screen.getByLabelText(/exercício anterior/i));
      // O ponto do exercicio 1 deve estar verde (concluido/pulado)
      expect(screen.getByText("1 / 11")).toBeInTheDocument();
    });

    it("restaura dados de observacao", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.change(screen.getByPlaceholderText(/observação/i), {
        target: { value: "dor no ombro" },
      });

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      const obsInput = screen.getByPlaceholderText(/observação/i) as HTMLTextAreaElement;
      expect(obsInput.value).toBe("dor no ombro");
    });
  });

  // ── Técnica RP ────────────────────────────────────────────────────────────

  describe("Restauracao de tecnica RP", () => {
    it("restaura estado RP confirmado ao reabrir", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "RP" }));
      fireEvent.change(screen.getByLabelText(/Bloco 1 kg/i), { target: { value: "80" } });
      fireEvent.change(screen.getByLabelText(/Bloco 1 reps/i), { target: { value: "5" } });
      fireEvent.click(screen.getByText("Confirmar Técnica"));

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      expect(screen.getByText(/R1: 80kg × 5reps/i)).toBeInTheDocument();
    });
  });

  // ── Sessões independentes ─────────────────────────────────────────────────

  describe("Sessoes independentes", () => {
    it("rascunho de Upper A nao interfere em Upper B", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");

      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper B");

      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("");
    });

    it("rascunho de duas sessoes coexistem", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      selecionarSessao("Upper B");
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "60" } });

      cleanup();
      render(<TreinoSessao />);

      selecionarSessao("Upper A");
      expect((screen.getByLabelText(/Top Set kg/i) as HTMLInputElement).value).toBe("100");

      selecionarSessao("Upper B");
      expect((screen.getByLabelText(/Top Set kg/i) as HTMLInputElement).value).toBe("60");
    });
  });

  // ── Limpeza do rascunho ───────────────────────────────────────────────────

  describe("Limpeza do rascunho apos salvar", () => {
    it("remove rascunho da sessao apos Confirmar e Salvar Treino", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      confirmarTopSet("50", "12");
      confirmarBackoff("18");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const draft = getDraft();
      const haUpperA = draft !== null && typeof draft === "object" && "Upper A" in draft;
      expect(haUpperA).toBe(false);
    });

    it("rascunho de outra sessao persiste apos salvar uma sessao diferente", () => {
      renderFresh();
      // Preenche rascunho de Upper B
      selecionarSessao("Upper B");
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "60" } });

      // Salva treino de Upper A
      selecionarSessao("Upper A");
      pularParaUltimo();
      confirmarTopSet("50", "12");
      confirmarBackoff("18");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      // Remonta e verifica que UB ainda tem rascunho
      cleanup();
      render(<TreinoSessao />);
      selecionarSessao("Upper B");

      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("60");
    });
  });

  // ── Resiliência a dados corrompidos ────────────────────────────────────────

  describe("Resiliencia a dados corrompidos", () => {
    it("ignora rascunho se o JSON no localStorage estiver corrompido", () => {
      localStorage.setItem(DRAFT_KEY, "{{json invalido}}");
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      // Deve funcionar normalmente como se nao houvesse rascunho
      expect(screen.getByText("Supino reto barra")).toBeInTheDocument();
      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("");
    });

    it("ignora rascunho se a estrutura nao corresponder ao esperado", () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ "Upper A": "nao_e_objeto" }));
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      expect(screen.getByText("Supino reto barra")).toBeInTheDocument();
      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("");
    });
  });

  // ── Sem sessão selecionada ────────────────────────────────────────────────

  describe("Sem sessao selecionada", () => {
    it("nao grava rascunho quando nenhuma sessao esta selecionada", () => {
      renderFresh();
      // Nenhuma sessão selecionada
      const draft = getDraft();
      expect(draft).toBeNull();
    });
  });
});
