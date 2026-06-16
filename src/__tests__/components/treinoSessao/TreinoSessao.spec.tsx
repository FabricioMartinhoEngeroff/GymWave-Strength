/**
 * TreinoSessao — testes do fluxo Saizen Top Set + Back-off
 * Inclui: navegação com edição, rascunho por sessão, sugestão visual,
 *         tela de revisão, alterações não salvas.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";

function renderFresh() {
  localStorage.clear();
  return render(<TreinoSessao />);
}

function selecionarSessao(nome: string) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
}

// Helper: confirm Top Set for current exercise
function confirmarTopSet(kg = "100", reps = "7") {
  fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: kg } });
  fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: reps } });
  fireEvent.click(screen.getByText("Confirmar Top Set"));
}

// Helper: confirm Back-off for current exercise
function confirmarBackoff(reps = "12") {
  fireEvent.change(screen.getByLabelText(/Back-off reps/i), { target: { value: reps } });
  fireEvent.click(screen.getByText("Confirmar Back-off"));
}

// Navigate to last exercise of Upper A (8 exercises) via Pular
function pularParaUltimo(total = 8) {
  for (let i = 0; i < total - 1; i++) {
    fireEvent.click(screen.getByText("Pular"));
  }
}

describe("TreinoSessao — Fluxo Saizen Top Set + Back-off", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── Renderizacao inicial ──────────────────────────────────────────────────

  describe("Renderizacao inicial", () => {
    it("exibe titulo da aplicacao", () => {
      renderFresh();
      expect(screen.getByText("GymWave Strength")).toBeInTheDocument();
    });

    it("exibe os 5 seletores de treino", () => {
      renderFresh();
      expect(screen.getByRole("button", { name: "Upper A" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Upper B" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lower A" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lower B" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Braço" })).toBeInTheDocument();
    });

    it("exibe mensagem para selecionar treino", () => {
      renderFresh();
      expect(screen.getByText(/selecione um treino/i)).toBeInTheDocument();
    });
  });

  // ── Selecao de sessao ───────────────────────────────────────────────────

  describe("Selecao de sessao", () => {
    it("selecionar Upper A carrega primeiro exercicio", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByText("Supino reto barra")).toBeInTheDocument();
    });

    it("selecionar Lower A carrega Terra sumo", () => {
      renderFresh();
      selecionarSessao("Lower A");
      expect(screen.getByText("Terra sumô")).toBeInTheDocument();
    });

    it("selecionar Upper B carrega Barra fixa pronada", () => {
      renderFresh();
      selecionarSessao("Upper B");
      expect(screen.getByText("Barra fixa pronada")).toBeInTheDocument();
    });

    it("selecionar Lower B carrega Agachamento livre", () => {
      renderFresh();
      selecionarSessao("Lower B");
      expect(screen.getByText("Agachamento livre")).toBeInTheDocument();
    });

    it("selecionar Braco carrega Triceps testa halteres", () => {
      renderFresh();
      selecionarSessao("Braço");
      expect(screen.getByText("Tríceps testa halteres")).toBeInTheDocument();
    });

    it("exibe contador de exercicio 1/N", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByText("1 / 8")).toBeInTheDocument();
    });
  });

  // ── Top Set + Back-off ──────────────────────────────────────────────────

  describe("Top Set + Back-off", () => {
    it("exibe bloco Top Set com campos kg e reps", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByText("Top Set")).toBeInTheDocument();
      expect(screen.getByLabelText(/Top Set kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Top Set reps/i)).toBeInTheDocument();
    });

    it("botao Confirmar Top Set desabilitado sem dados", () => {
      renderFresh();
      selecionarSessao("Upper A");
      const btn = screen.getByText("Confirmar Top Set");
      expect(btn).toBeDisabled();
    });

    it("confirmar Top Set habilita bloco Back-off", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet();
      expect(screen.getByText("Confirmar Back-off")).toBeInTheDocument();
      expect(screen.getByLabelText(/Back-off kg/i)).toBeInTheDocument();
    });

    it("back-off sugere peso automatico (85%)", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      const boInput = screen.getByLabelText(/Back-off kg/i) as HTMLInputElement;
      expect(boInput.value).toBe("85");
    });

    it("teto atingido mostra badge verde", () => {
      renderFresh();
      selecionarSessao("Upper A");
      // Supino reto barra faixa [5,9] -> 9 reps = teto
      confirmarTopSet("100", "9");
      expect(screen.getByText(/teto atingido/i)).toBeInTheDocument();
    });

    it("abaixo da faixa mostra badge vermelho", () => {
      renderFresh();
      selecionarSessao("Upper A");
      // Supino reto barra faixa [5,9] -> 3 reps = abaixo
      confirmarTopSet("100", "3");
      expect(screen.getByText(/abaixo da faixa/i)).toBeInTheDocument();
    });
  });

  // ── Série Extra ─────────────────────────────────────────────────────────

  describe("Série Extra (seriesValidas)", () => {
    function setupLogbookComSeriesValidas3() {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "01/01/2026",
          dataTs: 1000,
          topSetKg: 100,
          topSetReps: 7,
          topSetFaixaMin: 5,
          topSetFaixaMax: 9,
          topSetBateuTeto: false,
          backoffKg: 85,
          backoffReps: 12,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 3,
          progrediu: false,
        }],
      }));
    }

    it("exibe badge '3 válidas' quando seriesValidas=3 vem do historico", () => {
      setupLogbookComSeriesValidas3();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      expect(screen.getByText("3 válidas")).toBeInTheDocument();
    });

    it("exibe badge '2 válidas' quando nao ha historico (padrao)", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByText("2 válidas")).toBeInTheDocument();
    });

    it("exibe bloco Extra apos confirmar backoff quando seriesValidas=3", () => {
      setupLogbookComSeriesValidas3();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      confirmarTopSet();
      confirmarBackoff();
      expect(screen.getByText(/série extra/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Extra kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Extra reps/i)).toBeInTheDocument();
    });

    it("nao exibe bloco Extra quando seriesValidas=2 (padrao)", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet();
      confirmarBackoff();
      expect(screen.queryByText(/série extra/i)).not.toBeInTheDocument();
    });

    it("salva seriesValidas e extra no logbook ao salvar treino", () => {
      setupLogbookComSeriesValidas3();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      pularParaUltimo();

      // Abdomen (8º) sem histórico, seriesValidas=2
      confirmarTopSet("50", "12");
      confirmarBackoff("18");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      expect(logbook["Abdômen cabo ajoelhado"][0].seriesValidas).toBe(2);
    });
  });

  // ── Primeiro registro ───────────────────────────────────────────────────

  describe("Banners de progressao", () => {
    it("primeiro registro exibe banner azul", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByText(/primeiro registro/i)).toBeInTheDocument();
    });
  });

  // ── Navegacao ───────────────────────────────────────────────────────────

  describe("Navegacao entre exercicios", () => {
    it("botao Pular avanca para proximo exercicio", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByText("1 / 8")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Pular"));
      expect(screen.getByText("2 / 8")).toBeInTheDocument();
    });

    it("setas de navegacao funcionam", () => {
      renderFresh();
      selecionarSessao("Upper A");
      const nextBtn = screen.getByLabelText(/próximo exercício/i);
      fireEvent.click(nextBtn);
      expect(screen.getByText("2 / 8")).toBeInTheDocument();
      const prevBtn = screen.getByLabelText(/exercício anterior/i);
      fireEvent.click(prevBtn);
      expect(screen.getByText("1 / 8")).toBeInTheDocument();
    });
  });

  // ── Salvamento ──────────────────────────────────────────────────────────

  describe("Salvamento", () => {
    it("salvar treino persiste no logbook e dadosTreino", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();

      confirmarTopSet("50", "12");
      confirmarBackoff("18");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      expect(logbook["Abdômen cabo ajoelhado"]).toBeDefined();
      expect(logbook["Abdômen cabo ajoelhado"][0].topSetKg).toBe(50);

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Abdômen cabo ajoelhado"]).toBeDefined();
    });

    it("apos salvar exibe toast e resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();

      confirmarTopSet("50", "12");
      confirmarBackoff("18");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      expect(screen.getByText(/treino salvo/i)).toBeInTheDocument();
      expect(screen.getByText(/resumo do treino/i)).toBeInTheDocument();
    });
  });

  // ── Edição de exercícios já confirmados ────────────────────────────────

  describe("Edicao de exercicios ja confirmados", () => {
    it("inputs do Top Set nao ficam desabilitados apos confirmacao", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");

      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput).not.toBeDisabled();
    });

    it("ao voltar a exercicio confirmado, campo kg mantem valor e e editavel", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");

      // Avanca para o segundo exercício
      fireEvent.click(screen.getByLabelText(/próximo exercício/i));
      expect(screen.getByText("2 / 8")).toBeInTheDocument();

      // Volta ao primeiro
      fireEvent.click(screen.getByLabelText(/exercício anterior/i));
      expect(screen.getByText("1 / 8")).toBeInTheDocument();

      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("100");
      expect(kgInput).not.toBeDisabled();
    });

    it("editar valor do Top Set apos confirmacao atualiza em memoria", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");

      // Avanca e volta
      fireEvent.click(screen.getByLabelText(/próximo exercício/i));
      fireEvent.click(screen.getByLabelText(/exercício anterior/i));

      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      fireEvent.change(kgInput, { target: { value: "105" } });
      expect(kgInput.value).toBe("105");
    });

    it("botao Editar Top Set reabre o campo de confirmacao", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");

      fireEvent.click(screen.getByText("Editar Top Set"));
      expect(screen.getByText("Confirmar Top Set")).toBeInTheDocument();
    });

    it("indicador verde aparece no nome do exercicio quando confirmado", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");

      // O ✓ aparece no nome do exercício
      expect(screen.getByText("✓")).toBeInTheDocument();
    });
  });

  // ── Rascunho por sessão ────────────────────────────────────────────────

  describe("Rascunho por sessao ao trocar UA e UB", () => {
    it("preserva dados digitados em UA ao mudar para UB e voltar", () => {
      renderFresh();
      selecionarSessao("Upper A");

      // Digita kg no Upper A sem confirmar
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "80" } });

      // Troca para Upper B
      selecionarSessao("Upper B");
      expect(screen.getByText("Barra fixa pronada")).toBeInTheDocument();

      // Volta para Upper A
      selecionarSessao("Upper A");

      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("80");
    });

    it("preserva estado de confirmacao no rascunho", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");

      // Troca e volta
      selecionarSessao("Upper B");
      selecionarSessao("Upper A");

      // Back-off ainda visivel (topSetConfirmed ainda true)
      expect(screen.getByLabelText(/Back-off kg/i)).toBeInTheDocument();
    });

    it("rascunho de UB e independente de UA", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "80" } });

      selecionarSessao("Upper B");
      // UB começa limpo
      const kgInputUB = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInputUB.value).toBe("");
    });
  });

  // ── Diferenciação visual sugestão vs editado ───────────────────────────

  describe("Diferenciacao visual sugestao do historico", () => {
    function setupHistorico() {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "01/01/2026",
          dataTs: 1000,
          topSetKg: 100,
          topSetReps: 7,
          topSetFaixaMin: 5,
          topSetFaixaMax: 9,
          topSetBateuTeto: false,
          backoffKg: 85,
          backoffReps: 12,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 2,
          progrediu: false,
        }],
      }));
    }

    it("input de kg do Top Set tem data-suggestion quando vem do historico", () => {
      setupHistorico();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      const kgInput = screen.getByLabelText(/Top Set kg/i);
      expect(kgInput).toHaveAttribute("data-suggestion", "true");
    });

    it("data-suggestion some quando usuario edita o valor", () => {
      setupHistorico();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      const kgInput = screen.getByLabelText(/Top Set kg/i);
      fireEvent.change(kgInput, { target: { value: "110" } });
      expect(kgInput).not.toHaveAttribute("data-suggestion", "true");
    });

    it("sem historico, input nao tem data-suggestion", () => {
      renderFresh();
      selecionarSessao("Upper A");
      const kgInput = screen.getByLabelText(/Top Set kg/i);
      expect(kgInput).not.toHaveAttribute("data-suggestion", "true");
    });

    it("data-suggestion some apos confirmar o top set", () => {
      setupHistorico();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      confirmarTopSet("100", "7");

      const kgInput = screen.getByLabelText(/Top Set kg/i);
      expect(kgInput).not.toHaveAttribute("data-suggestion", "true");
    });
  });

  // ── Tela de revisão antes de salvar ───────────────────────────────────

  describe("Tela de revisao antes de salvar", () => {
    it("ultimo exercicio exibe botao Ver Resumo em vez de Salvar treino", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      expect(screen.getByText("Ver Resumo")).toBeInTheDocument();
      expect(screen.queryByText("Salvar treino")).not.toBeInTheDocument();
    });

    it("clicar Ver Resumo exibe tela de revisao com todos os exercicios", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      fireEvent.click(screen.getByText("Ver Resumo"));

      expect(screen.getByText(/revisar antes de salvar/i)).toBeInTheDocument();
      expect(screen.getByText("Confirmar e Salvar Treino")).toBeInTheDocument();
    });

    it("tela de revisao lista todos os exercicios", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      fireEvent.click(screen.getByText("Ver Resumo"));

      // Todos os 8 exercícios devem aparecer na revisão
      expect(screen.getByText("Supino reto barra")).toBeInTheDocument();
      expect(screen.getByText("Abdômen cabo ajoelhado")).toBeInTheDocument();
    });

    it("exercicio confirmado mostra valores no resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");
      // Use the navigation arrow to advance without overwriting the confirmed state
      fireEvent.click(screen.getByLabelText(/próximo exercício/i));
      pularParaUltimo(7); // 6 more skips from idx=1 to reach idx=7
      fireEvent.click(screen.getByText("Ver Resumo"));

      expect(screen.getByText(/100kg/)).toBeInTheDocument();
    });

    it("exercicio pulado mostra 'Pulado' no resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByText("Pular")); // pula exercicio 1
      pularParaUltimo(7); // pula restantes até o último
      fireEvent.click(screen.getByText("Ver Resumo"));

      expect(screen.getAllByText("Pulado").length).toBeGreaterThan(0);
    });

    it("clicar Editar no resumo volta para o exercicio correspondente", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      fireEvent.click(screen.getByText("Ver Resumo"));

      // Clica no primeiro Editar (exercício 1)
      const editarBtns = screen.getAllByText("Editar");
      fireEvent.click(editarBtns[0]);

      // Volta para a tela do exercício 1
      expect(screen.getByText("1 / 8")).toBeInTheDocument();
      expect(screen.queryByText("Confirmar e Salvar Treino")).not.toBeInTheDocument();
    });

    it("botao Voltar ao exercicio fecha o resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Voltar ao exercício"));

      expect(screen.getByText("8 / 8")).toBeInTheDocument();
      expect(screen.queryByText("Confirmar e Salvar Treino")).not.toBeInTheDocument();
    });

    it("Confirmar e Salvar Treino salva e exibe resumo pos-save", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      confirmarTopSet("50", "12");
      confirmarBackoff("18");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      expect(screen.getByText(/treino salvo/i)).toBeInTheDocument();
      expect(screen.getByText(/resumo do treino/i)).toBeInTheDocument();
    });
  });

  // ── Alterações não salvas ──────────────────────────────────────────────

  describe("Alteracoes nao salvas", () => {
    it("onUnsavedChanges(true) quando usuario digita dados", () => {
      const onUnsavedChanges = vi.fn();
      render(<TreinoSessao onUnsavedChanges={onUnsavedChanges} />);
      selecionarSessao("Upper A");

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });

      expect(onUnsavedChanges).toHaveBeenCalledWith(true);
    });

    it("onUnsavedChanges(false) apos salvar treino", () => {
      const onUnsavedChanges = vi.fn();
      render(<TreinoSessao onUnsavedChanges={onUnsavedChanges} />);
      selecionarSessao("Upper A");
      pularParaUltimo();
      confirmarTopSet("50", "12");
      confirmarBackoff("18");

      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      expect(onUnsavedChanges).toHaveBeenLastCalledWith(false);
    });

    it("onUnsavedChanges(false) sem sessao selecionada", () => {
      const onUnsavedChanges = vi.fn();
      render(<TreinoSessao onUnsavedChanges={onUnsavedChanges} />);

      // Sem selecionar sessão, não há alterações
      expect(onUnsavedChanges).toHaveBeenLastCalledWith(false);
    });

    it("registra listener beforeunload quando ha alteracoes nao salvas", () => {
      const addEventSpy = vi.spyOn(window, "addEventListener");
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });

      const calls = addEventSpy.mock.calls.filter(([event]) => event === "beforeunload");
      expect(calls.length).toBeGreaterThan(0);

      addEventSpy.mockRestore();
    });
  });
});
