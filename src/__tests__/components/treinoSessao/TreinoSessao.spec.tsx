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

// Navigate to last exercise of Upper A (13 exercises) via Pular
function pularParaUltimo(total = 13) {
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
      expect(screen.getByText("1 / 13")).toBeInTheDocument();
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

    it("backoff kg usa calculo 85% como fallback quando nao ha historico", () => {
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
    // seriesValidas é uma propriedade do plano de treino (plano padrão ou
    // planoTreino importado da planilha), não do histórico — o histórico
    // registra apenas o que foi feito na última sessão, e não deve
    // sobrescrever a meta de séries válidas definida pelo plano atual.
    function setupPlanoComSeriesValidas3() {
      localStorage.setItem("planoTreino", JSON.stringify({
        "Upper A": {
          "Supino reto barra": { ordem: 1, series_validas: 3 },
        },
      }));
    }

    it("exibe badge '3 válidas' quando seriesValidas=3 vem do planoTreino (import)", () => {
      setupPlanoComSeriesValidas3();
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
      setupPlanoComSeriesValidas3();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      confirmarTopSet();
      confirmarBackoff();
      expect(screen.getByText(/série extra/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Extra kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Extra reps/i)).toBeInTheDocument();
    });

    it("badge respeita o plano mesmo quando o historico tem seriesValidas diferente", () => {
      setupPlanoComSeriesValidas3();
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
          seriesValidas: 2, // sessão anterior tinha só 2 válidas — plano já foi atualizado para 3
          progrediu: false,
        }],
      }));
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      expect(screen.getByText("3 válidas")).toBeInTheDocument();
    });

    it("nao exibe bloco Extra quando seriesValidas=2 (padrao)", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet();
      confirmarBackoff();
      expect(screen.queryByText(/série extra/i)).not.toBeInTheDocument();
    });

    it("salva seriesValidas e extra no logbook ao salvar treino", () => {
      renderFresh();
      selecionarSessao("Upper A");

      pularParaUltimo();

      // Abdômen cabo ajoelhado (13º) sem histórico, seriesValidas=2
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
      expect(screen.getByText("1 / 13")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Pular"));
      expect(screen.getByText("2 / 13")).toBeInTheDocument();
    });

    it("setas de navegacao funcionam", () => {
      renderFresh();
      selecionarSessao("Upper A");
      const nextBtn = screen.getByLabelText(/próximo exercício/i);
      fireEvent.click(nextBtn);
      expect(screen.getByText("2 / 13")).toBeInTheDocument();
      const prevBtn = screen.getByLabelText(/exercício anterior/i);
      fireEvent.click(prevBtn);
      expect(screen.getByText("1 / 13")).toBeInTheDocument();
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

      expect(screen.getByText(/treino finalizado/i)).toBeInTheDocument();
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
      expect(screen.getByText("2 / 13")).toBeInTheDocument();

      // Volta ao primeiro
      fireEvent.click(screen.getByLabelText(/exercício anterior/i));
      expect(screen.getByText("1 / 13")).toBeInTheDocument();

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

  // ── Pré-preenchimento do histórico anterior (todos os blocos) ─────────

  describe("Pre-preenchimento do historico anterior — Top Set, Back-off e Extra", () => {
    // História com backoffKg=80 (diferente de 85% de 90kg=76 ou de 100kg=85)
    // para provar que o valor vem do histórico e não do cálculo percentual.
    function setupHistoricoCompleto() {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "01/01/2026",
          dataTs: 1000,
          topSetKg: 90,
          topSetReps: 6,
          topSetFaixaMin: 5,
          topSetFaixaMax: 9,
          topSetBateuTeto: false,
          backoffKg: 80,
          backoffReps: 10,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 2,
          progrediu: false,
        }],
      }));
    }

    function setupHistoricoComExtra() {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "01/01/2026",
          dataTs: 1000,
          topSetKg: 90,
          topSetReps: 6,
          topSetFaixaMin: 5,
          topSetFaixaMax: 9,
          topSetBateuTeto: false,
          backoffKg: 80,
          backoffReps: 10,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 3,
          extraKg: 75,
          extraReps: 14,
          progrediu: false,
        }],
      }));
    }

    it("top set reps e pre-preenchido com as reps do historico", () => {
      setupHistoricoCompleto();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      const repsInput = screen.getByLabelText(/Top Set reps/i) as HTMLInputElement;
      expect(repsInput.value).toBe("6");
    });

    it("backoff kg e pre-preenchido com o peso do historico, nao calculado 85%", () => {
      setupHistoricoCompleto(); // backoffKg=80; 85% de 100kg seria 85 → diferente
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      const boKg = screen.getByLabelText(/Back-off kg/i) as HTMLInputElement;
      expect(boKg.value).toBe("80");
    });

    it("backoff reps e pre-preenchido com as reps do historico", () => {
      setupHistoricoCompleto();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      const boReps = screen.getByLabelText(/Back-off reps/i) as HTMLInputElement;
      expect(boReps.value).toBe("10");
    });

    it("backoff pre-preenchido nao e sobrescrito pelo calculo 85% ao confirmar top set", () => {
      setupHistoricoCompleto(); // backoffKg=80 do histórico
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7"); // 85% de 100 = 85, mas historico tem 80
      const boKg = screen.getByLabelText(/Back-off kg/i) as HTMLInputElement;
      expect(boKg.value).toBe("80");
    });

    it("extra kg e reps sao pre-preenchidos com os valores do historico", () => {
      // extraKg/extraReps só aparecem com seriesValidas=3, que agora vem do
      // plano — não do histórico (ver describe "Série Extra" acima).
      localStorage.setItem("planoTreino", JSON.stringify({
        "Upper A": {
          "Supino reto barra": { ordem: 1, series_validas: 3 },
        },
      }));
      setupHistoricoComExtra();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("10");
      const extraKg = screen.getByLabelText(/Extra kg/i) as HTMLInputElement;
      const extraReps = screen.getByLabelText(/Extra reps/i) as HTMLInputElement;
      expect(extraKg.value).toBe("75");
      expect(extraReps.value).toBe("14");
    });

    it("top set reps nao e pre-preenchido quando nao ha historico", () => {
      renderFresh();
      selecionarSessao("Upper A");
      const repsInput = screen.getByLabelText(/Top Set reps/i) as HTMLInputElement;
      expect(repsInput.value).toBe("");
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

      // Todos os 13 exercícios devem aparecer na revisão
      expect(screen.getByText("Supino reto barra")).toBeInTheDocument();
      expect(screen.getByText("Antebraço rola palma")).toBeInTheDocument();
    });

    it("exercicio confirmado mostra valores no resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      confirmarTopSet("100", "7");
      confirmarBackoff("12");
      // Use the navigation arrow to advance without overwriting the confirmed state
      fireEvent.click(screen.getByLabelText(/próximo exercício/i));
      pularParaUltimo(12); // 11 more skips from idx=1 to reach idx=12
      fireEvent.click(screen.getByText("Ver Resumo"));

      expect(screen.getByText(/100kg/)).toBeInTheDocument();
    });

    it("exercicio pulado mostra 'Pulado' no resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByText("Pular")); // pula exercicio 1
      pularParaUltimo(12); // pula restantes até o último (11 mais)
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
      expect(screen.getByText("1 / 13")).toBeInTheDocument();
      expect(screen.queryByText("Confirmar e Salvar Treino")).not.toBeInTheDocument();
    });

    it("botao Voltar ao exercicio fecha o resumo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Voltar ao exercício"));

      expect(screen.getByText("13 / 13")).toBeInTheDocument();
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

      expect(screen.getByText(/treino finalizado/i)).toBeInTheDocument();
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

  // ── Banner de PR em tempo real (RG13) ──────────────────────────────────

  describe("Banner de PR em tempo real", () => {
    // Setup: historical record with 1RM equal to `pr1RM`
    // calcEpley(pr1RM, 0) = pr1RM (reps=0 → peso × 1)
    function setupHistoricoComPR(pr1RM: number) {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [{
          exercicio: "Supino reto barra",
          treinoId: "UA",
          data: "01/01/2026",
          dataTs: 1000,
          topSetKg: pr1RM,
          topSetReps: 0,
          topSetFaixaMin: 5,
          topSetFaixaMax: 8,
          topSetBateuTeto: false,
          backoffKg: 0,
          backoffReps: 0,
          backoffFaixaMin: 8,
          backoffFaixaMax: 10,
          seriesValidas: 2,
          progrediu: false,
        }],
      }));
    }

    it("banner_pr exibido quando 1RM atual supera PR historico (100kg×7reps > PR 100)", () => {
      // PR historico = 100 (calcEpley(100, 0) = 100)
      // atual: 100kg × 7reps → calcEpley(100, 7) = 123.33 > 100
      setupHistoricoComPR(100);
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "7" } });

      expect(screen.getByText(/Ritmo de Recorde Pessoal/i)).toBeInTheDocument();
    });

    it("banner permanece normal quando 1RM atual esta abaixo do PR historico (80kg×5reps < PR 130)", () => {
      // PR historico = 130 (calcEpley(130, 0) = 130)
      // atual: 80kg × 5reps → calcEpley(80, 5) = 93.33 < 130
      setupHistoricoComPR(130);
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "80" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "5" } });

      expect(screen.queryByText(/Ritmo de Recorde Pessoal/i)).not.toBeInTheDocument();
    });

    it("banner_pr ativo ao atingir teto de reps (reps=8, faixa 5-8) independente do historico", () => {
      // Supino reto barra tem faixaTopSet [5, 8] — reps=8 toca o teto
      renderFresh();
      selecionarSessao("Upper A");

      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "8" } });

      expect(screen.getByText(/Ritmo de Recorde Pessoal/i)).toBeInTheDocument();
    });

    it("banner retorna ao estado normal ao apagar o campo de peso apos banner_pr ativo", () => {
      setupHistoricoComPR(100);
      render(<TreinoSessao />);
      selecionarSessao("Upper A");

      // Aciona o banner_pr
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Top Set reps/i), { target: { value: "7" } });
      expect(screen.getByText(/Ritmo de Recorde Pessoal/i)).toBeInTheDocument();

      // Apaga o campo de peso
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "" } });
      expect(screen.queryByText(/Ritmo de Recorde Pessoal/i)).not.toBeInTheDocument();
    });
  });

  // ── Técnica Rest Pause ──────────────────────────────────────────────────

  describe("Tecnica Rest Pause — 4 blocos", () => {
    it("chip Rest Pause e exibido na secao Tecnica", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByRole("button", { name: "Rest Pause" })).toBeInTheDocument();
    });

    it("ao ativar Rest Pause exibe exatamente 4 blocos e oculta campos Top Set e Back-off", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));

      expect(screen.getByText("Bloco 1")).toBeInTheDocument();
      expect(screen.getByText("Bloco 2")).toBeInTheDocument();
      expect(screen.getByText("Bloco 3")).toBeInTheDocument();
      expect(screen.getByText("Bloco 4")).toBeInTheDocument();
      expect(screen.queryByText("Bloco 5")).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Top Set kg/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Back-off kg/i)).not.toBeInTheDocument();
    });

    it("Blocos 1 a 4 tem campos de peso e reps acessiveis", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));

      expect(screen.getByLabelText(/Bloco 1 kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bloco 1 reps/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bloco 2 kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bloco 2 reps/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bloco 3 kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bloco 3 reps/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bloco 4 kg/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bloco 4 reps/i)).toBeInTheDocument();
    });

    it("Bloco 5 nao existe apos ativar Rest Pause", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));

      expect(screen.queryByLabelText(/Bloco 5 kg/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Bloco 5 reps/i)).not.toBeInTheDocument();
    });

    it("confirmar tecnica sem dados exibe aviso de bloco obrigatorio", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));
      fireEvent.click(screen.getByText("Confirmar Técnica"));

      expect(screen.getByText(/Preencha pelo menos um bloco/i)).toBeInTheDocument();
    });

    it("ao preencher bloco 1 e confirmar exibe resumo com R1", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));

      fireEvent.change(screen.getByLabelText(/Bloco 1 kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Bloco 1 reps/i), { target: { value: "5" } });
      fireEvent.click(screen.getByText("Confirmar Técnica"));

      expect(screen.getByText(/R1: 100kg × 5reps/i)).toBeInTheDocument();
    });

    it("desativar Rest Pause clicando novamente restaura Top Set e Back-off", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));
      expect(screen.queryByText("Top Set")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));
      expect(screen.getByText("Top Set")).toBeInTheDocument();
    });

    it("salvar treino em modo Rest Pause persiste apenas blocos preenchidos no logbook", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));

      fireEvent.change(screen.getByLabelText(/Bloco 1 kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Bloco 1 reps/i), { target: { value: "5" } });
      fireEvent.change(screen.getByLabelText(/Bloco 2 kg/i), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Bloco 2 reps/i), { target: { value: "5" } });
      fireEvent.click(screen.getByText("Confirmar Técnica"));
      fireEvent.click(screen.getByText("Próximo"));
      pularParaUltimo(12);
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const logbook = JSON.parse(localStorage.getItem("logbook") ?? "{}");
      const registro = logbook["Supino reto barra"]?.[0];
      expect(registro?.tecnica).toBe("RP");
      expect(registro?.clusterSeries).toHaveLength(2);
      expect(registro?.clusterSeries[0]).toEqual({ kg: 100, reps: 5 });
      expect(registro?.clusterSeries[1]).toEqual({ kg: 100, reps: 5 });
    });
  });

  // ── Técnica Deload — 1 série válida ─────────────────────────────────────

  describe("Tecnica Deload — 1 serie valida", () => {
    function ativarDeload() {
      fireEvent.click(screen.getByRole("button", { name: "Deload" }));
    }

    function setupHistoricoNormal() {
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
          backoffKg: 82,
          backoffReps: 11,
          backoffFaixaMin: 9,
          backoffFaixaMax: 15,
          seriesValidas: 2,
          progrediu: false,
        }],
      }));
    }

    // ── Renderizacao ──────────────────────────────────────────────────────

    it("chip Deload e exibido na secao Tecnica", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByRole("button", { name: "Deload" })).toBeInTheDocument();
    });

    it("Rest Pause e Deload sao dois chips distintos na secao Tecnica", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getByRole("button", { name: "Rest Pause" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Deload" })).toBeInTheDocument();
    });

    it("aviso de Deload nao e exibido quando Deload esta inativo", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.queryByText(/apenas 1 série válida/i)).not.toBeInTheDocument();
    });

    // ── Ativação ──────────────────────────────────────────────────────────

    it("ao ativar Deload exibe aviso de 1 serie valida", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      expect(screen.getByText(/Deload.*apenas 1 série válida/i)).toBeInTheDocument();
    });

    it("ao ativar Deload, bloco Back-off nao aparece nem apos confirmar Top Set", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      confirmarTopSet("100", "7");
      expect(screen.queryByText("Confirmar Back-off")).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Back-off kg/i)).not.toBeInTheDocument();
    });

    it("ao ativar Deload, campos Top Set digitados nao sao limpos", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.change(screen.getByLabelText(/Top Set kg/i), { target: { value: "90" } });
      ativarDeload();
      const kgInput = screen.getByLabelText(/Top Set kg/i) as HTMLInputElement;
      expect(kgInput.value).toBe("90");
    });

    it("ao ativar Deload, sugestao do historico e mantida no Top Set", () => {
      setupHistoricoNormal();
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      const kgBefore = (screen.getByLabelText(/Top Set kg/i) as HTMLInputElement).value;
      ativarDeload();
      const kgAfter = (screen.getByLabelText(/Top Set kg/i) as HTMLInputElement).value;
      expect(kgAfter).toBe(kgBefore);
    });

    it("ativar Deload quando Rest Pause ativo: blocos RP somem e Top Set volta", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));
      expect(screen.getByText("Bloco 1")).toBeInTheDocument();

      ativarDeload();
      expect(screen.queryByText("Bloco 1")).not.toBeInTheDocument();
      expect(screen.getByText("Top Set")).toBeInTheDocument();
      expect(screen.queryByText(/apenas 1 série válida/i)).toBeInTheDocument();
    });

    it("ativar Deload quando Rest Pause ativo nao deixa aviso de RP e Deload simultaneos", () => {
      renderFresh();
      selecionarSessao("Upper A");
      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));
      ativarDeload();
      // Blocos RP nao devem existir
      expect(screen.queryByText("Bloco 1")).not.toBeInTheDocument();
      // Aviso deload deve existir
      expect(screen.getByText(/apenas 1 série válida/i)).toBeInTheDocument();
    });

    it("auto-fill de backoff nao ocorre apos confirmar Top Set em modo Deload", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      confirmarTopSet("100", "7");
      // Bloco Back-off nao deve aparecer
      expect(screen.queryByLabelText(/Back-off kg/i)).not.toBeInTheDocument();
    });

    // ── Desativação ───────────────────────────────────────────────────────

    it("clicar Deload novamente o desativa e some o aviso", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      ativarDeload(); // desativa
      expect(screen.queryByText(/apenas 1 série válida/i)).not.toBeInTheDocument();
    });

    it("ao desativar Deload sem historico, back-off e auto-preenchido com 85% do Top Set confirmado", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      confirmarTopSet("100", "7");
      ativarDeload(); // desativa
      const boKg = screen.getByLabelText(/Back-off kg/i) as HTMLInputElement;
      expect(boKg.value).toBe("85");
    });

    it("ao desativar Deload com historico, backoffKg do ultimo treino e restaurado", () => {
      setupHistoricoNormal(); // backoffKg = 82
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      ativarDeload();
      ativarDeload(); // desativa
      confirmarTopSet("100", "7");
      const boKg = screen.getByLabelText(/Back-off kg/i) as HTMLInputElement;
      expect(boKg.value).toBe("82");
    });

    it("ao desativar Deload com historico, backoffReps do ultimo treino e restaurado", () => {
      setupHistoricoNormal(); // backoffReps = 11
      render(<TreinoSessao />);
      selecionarSessao("Upper A");
      ativarDeload();
      ativarDeload(); // desativa
      confirmarTopSet("100", "7");
      const boReps = screen.getByLabelText(/Back-off reps/i) as HTMLInputElement;
      expect(boReps.value).toBe("11");
    });

    it("ativar Rest Pause quando Deload ativo: aviso Deload some e blocos RP aparecem", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      expect(screen.getByText(/apenas 1 série válida/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Rest Pause" }));
      expect(screen.queryByText(/apenas 1 série válida/i)).not.toBeInTheDocument();
      expect(screen.getByText("Bloco 1")).toBeInTheDocument();
    });

    // ── Exercício concluído ───────────────────────────────────────────────

    it("apos confirmar Top Set em Deload, exercicio exibe indicador de concluido", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      confirmarTopSet("100", "7");
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("botao Proximo funciona apos Top Set confirmado em Deload, sem exigir Back-off", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      confirmarTopSet("100", "7");
      fireEvent.click(screen.getByText("Próximo"));
      expect(screen.getByText("2 / 13")).toBeInTheDocument();
    });

    it("ponto de progresso do exercicio atual reflete estado done apos confirmar Top Set em Deload", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      confirmarTopSet("100", "7");
      // Indicador ✓ no nome do exercicio confirma que esta marcado como done
      expect(screen.getByText("✓")).toBeInTheDocument();
      // Ao navegar para o proximo, o dot do exercicio 1 muda (nao e mais o azul ativo)
      // — verificado pelo titulo do dot que passa a incluir " ✓"
      fireEvent.click(screen.getByLabelText(/próximo exercício/i));
      const dot1 = document.querySelector("[title='Supino reto barra ✓']");
      expect(dot1).toBeTruthy();
    });

    // ── Salvamento ────────────────────────────────────────────────────────

    it("ao salvar em modo Deload, registro tem isDeload=true no logbook", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      ativarDeload();
      confirmarTopSet("50", "12");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      const registro = logbook["Abdômen cabo ajoelhado"]?.[0];
      expect(registro?.isDeload).toBe(true);
    });

    it("ao salvar em modo Deload, backoffKg e backoffReps sao zero no logbook", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      ativarDeload();
      confirmarTopSet("50", "12");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      const registro = logbook["Abdômen cabo ajoelhado"]?.[0];
      expect(registro?.backoffKg).toBe(0);
      expect(registro?.backoffReps).toBe(0);
    });

    it("ao salvar em modo Deload, topSetKg e topSetReps sao salvos corretamente", () => {
      renderFresh();
      selecionarSessao("Upper A");
      pularParaUltimo();
      ativarDeload();
      confirmarTopSet("60", "8");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      const registro = logbook["Abdômen cabo ajoelhado"]?.[0];
      expect(registro?.topSetKg).toBe(60);
      expect(registro?.topSetReps).toBe(8);
    });

    it("salvar em modo Deload nao salva isDeload=false em outros exercicios pulados", () => {
      renderFresh();
      selecionarSessao("Upper A");

      // Primeiro exercicio com Deload
      ativarDeload();
      confirmarTopSet("100", "7");
      fireEvent.click(screen.getByText("Próximo"));

      // Ultimo exercicio normal (sem deload)
      pularParaUltimo(12);
      confirmarTopSet("50", "12");
      confirmarBackoff("18");
      fireEvent.click(screen.getByText("Ver Resumo"));
      fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

      const logbook = JSON.parse(localStorage.getItem("logbook") || "{}");
      // Supino (com deload) deve ter isDeload=true
      expect(logbook["Supino reto barra"]?.[0]?.isDeload).toBe(true);
      // Abdomen (sem deload) deve ter isDeload=false
      expect(logbook["Abdômen cabo ajoelhado"]?.[0]?.isDeload).toBe(false);
    });

    // ── Tela de revisão ───────────────────────────────────────────────────

    it("tela de revisao exibe label 'Deload' para exercicio em modo deload", () => {
      renderFresh();
      selecionarSessao("Upper A");
      ativarDeload();
      confirmarTopSet("100", "7");
      fireEvent.click(screen.getByLabelText(/próximo exercício/i));
      pularParaUltimo(12);
      fireEvent.click(screen.getByText("Ver Resumo"));
      expect(screen.getByText(/Deload/)).toBeInTheDocument();
    });
  });
});
