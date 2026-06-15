/**
 * TreinoSessaoTest -> component
 * Testa o fluxo Saizen: selecao de treino, Top Set + Back-off,
 * banners de progressao, navegacao entre exercicios.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";

function renderFresh() {
  localStorage.clear();
  return render(<TreinoSessao />);
}

function selecionarSessao(nome: string) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
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
      const kgInput = screen.getByLabelText(/Top Set kg/i);
      const repsInput = screen.getByLabelText(/Top Set reps/i);
      fireEvent.change(kgInput, { target: { value: "100" } });
      fireEvent.change(repsInput, { target: { value: "7" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));
      expect(screen.getByText("Confirmar Back-off")).toBeInTheDocument();
      expect(screen.getByLabelText(/Back-off kg/i)).toBeInTheDocument();
    });

    it("back-off sugere peso automatico (85%)", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "7" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));
      const boInput = screen.getByLabelText(/Back-off kg/i) as HTMLInputElement;
      expect(boInput.value).toBe("85");
    });

    it("teto atingido mostra badge verde", () => {
      renderFresh();
      selecionarSessao("Upper A");
      // Supino reto barra faixa [5,9] -> 9 reps = teto
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "9" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));
      expect(screen.getByText(/teto atingido/i)).toBeInTheDocument();
    });

    it("abaixo da faixa mostra badge vermelho", () => {
      renderFresh();
      selecionarSessao("Upper A");
      // Supino reto barra faixa [5,9] -> 3 reps = abaixo
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "3" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));
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

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "7" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));

      fireEvent.change(screen.getByLabelText(/Back-off reps/i), { target: { value: "12" } });
      fireEvent.click(screen.getByText("Confirmar Back-off"));

      expect(screen.getByText(/série extra/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Extra kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Extra reps/i)).toBeInTheDocument();
    });

    it("nao exibe bloco Extra quando seriesValidas=2 (padrao)", () => {
      renderFresh();
      selecionarSessao("Upper A");

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "7" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));

      fireEvent.change(screen.getByLabelText(/Back-off reps/i), { target: { value: "12" } });
      fireEvent.click(screen.getByText("Confirmar Back-off"));

      expect(screen.queryByText(/série extra/i)).not.toBeInTheDocument();
    });

    it("salva seriesValidas e extra no logbook ao salvar treino", () => {
      setupLogbookComSeriesValidas3();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      // Pula até o último exercício
      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByText("Pular"));
      }

      // Abdomen (8º) não tem histórico, seriesValidas=2
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "50" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "12" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));
      fireEvent.change(screen.getByLabelText(/Back-off reps/i), { target: { value: "18" } });
      fireEvent.click(screen.getByText("Confirmar Back-off"));
      fireEvent.click(screen.getByText("Salvar treino"));

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

      // Preenche e confirma top set para todos os exercicios
      // Como estamos no ultimo exercicio, o botao muda para "Salvar treino"
      // Vamos pular todos menos o ultimo
      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByText("Pular"));
      }

      // Ultimo exercicio: Abdomen cabo ajoelhado
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "50" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "12" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));

      // Confirma backoff
      fireEvent.change(screen.getByLabelText(/Back-off reps/i), { target: { value: "18" } });
      fireEvent.click(screen.getByText("Confirmar Back-off"));

      fireEvent.click(screen.getByText("Salvar treino"));

      // Verifica logbook
      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      expect(logbook["Abdômen cabo ajoelhado"]).toBeDefined();
      expect(logbook["Abdômen cabo ajoelhado"][0].topSetKg).toBe(50);

      // Verifica dadosTreino (compatibilidade)
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Abdômen cabo ajoelhado"]).toBeDefined();
    });

    it("apos salvar exibe toast e resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");

      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByText("Pular"));
      }

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "50" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "12" } });
      fireEvent.click(screen.getByText("Confirmar Top Set"));
      fireEvent.change(screen.getByLabelText(/Back-off reps/i), { target: { value: "18" } });
      fireEvent.click(screen.getByText("Confirmar Back-off"));
      fireEvent.click(screen.getByText("Salvar treino"));

      expect(screen.getByText(/treino salvo/i)).toBeInTheDocument();
      expect(screen.getByText(/resumo do treino/i)).toBeInTheDocument();
    });
  });
});
