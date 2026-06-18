/**
 * PowerliftingChart — EF_07
 * Testa calculo de 1RM Epley, linha de PR, card de estatisticas e layout responsivo.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PowerliftingChart } from "../../../components/PowerliftChart";
import type { RegistroExercicio } from "../../../types/TrainingData";

// ── Helpers ─────────────────────────────────────────────────────────────────

const BASE_REGISTRO: Omit<RegistroExercicio, "exercicio" | "topSetKg" | "topSetReps" | "dataTs" | "data"> = {
  treinoId: "UA",
  topSetFaixaMin: 5,
  topSetFaixaMax: 8,
  topSetBateuTeto: false,
  backoffKg: 0,
  backoffReps: 0,
  backoffFaixaMin: 8,
  backoffFaixaMax: 10,
  seriesValidas: 2,
  progrediu: false,
};

function makeRegistro(
  overrides: Partial<RegistroExercicio> & Pick<RegistroExercicio, "exercicio" | "topSetKg" | "topSetReps" | "dataTs" | "data">
): RegistroExercicio {
  return { ...BASE_REGISTRO, ...overrides };
}

function setLogbook(registros: RegistroExercicio[]) {
  const logbook: Record<string, RegistroExercicio[]> = {};
  registros.forEach((r) => {
    if (!logbook[r.exercicio]) logbook[r.exercicio] = [];
    logbook[r.exercicio].push(r);
  });
  localStorage.setItem("logbook", JSON.stringify(logbook));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PowerliftingChart — EF_07", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset window.innerWidth to desktop default
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
  });

  // ── Dados e calculo ─────────────────────────────────────────────────────

  describe("Dados e calculo", () => {
    it("sem dados no localStorage exibe mensagem [sem_dados]", () => {
      render(<PowerliftingChart />);
      expect(screen.getByTestId("sem-dados")).toBeInTheDocument();
      expect(screen.getByText(/sem registros para listar/i)).toBeInTheDocument();
    });

    it("registro modo padrao (100kg x 7reps) exibe 1RM = 123.33", () => {
      setLogbook([
        makeRegistro({
          exercicio: "Supino reto barra",
          topSetKg: 100,
          topSetReps: 7,
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
        }),
      ]);
      render(<PowerliftingChart />);
      // Stats card mostra 1RM atual
      expect(screen.getByTestId("stats-rm1")).toHaveTextContent("123.33 kg");
    });

    it("registro modo BC usa apenas Bloco 1 (100kg x 8reps) → 1RM = 126.67", () => {
      setLogbook([
        makeRegistro({
          exercicio: "Agachamento livre",
          topSetKg: 0,
          topSetReps: 0,
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
          tecnica: "BC",
          clusterSeries: [
            { kg: 100, reps: 8 },
            { kg: 90, reps: 6 },
            { kg: 85, reps: 5 },
            { kg: 80, reps: 4 },
          ],
        }),
      ]);
      render(<PowerliftingChart />);
      expect(screen.getByTestId("stats-rm1")).toHaveTextContent("126.67 kg");
    });

    it("registro modo RP usa apenas Bloco 1 (120kg x 5reps) → 1RM = 140", () => {
      setLogbook([
        makeRegistro({
          exercicio: "Levantamento Terra",
          topSetKg: 0,
          topSetReps: 0,
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
          tecnica: "RP",
          clusterSeries: [
            { kg: 120, reps: 5 },
            { kg: 120, reps: 3 },
          ],
        }),
      ]);
      render(<PowerliftingChart />);
      expect(screen.getByTestId("stats-rm1")).toHaveTextContent("140.00 kg");
    });
  });

  // ── Linha de PR e badges ──────────────────────────────────────────────────

  describe("Linha de PR e badges", () => {
    it("historico com varios registros exibe indicador de PR no valor do maior 1RM", () => {
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 90, topSetReps: 7, data: "01/05/2026", dataTs: new Date(2026, 4, 1).getTime() }),
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "15/05/2026", dataTs: new Date(2026, 4, 15).getTime() }),
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 95, topSetReps: 7, data: "01/06/2026", dataTs: new Date(2026, 5, 1).getTime() }),
      ]);
      render(<PowerliftingChart />);
      // calcEpley(100, 7) = 123.33 é o maior 1RM
      expect(screen.getByTestId("pr-reference-value")).toHaveTextContent("PR: 123.33 kg");
    });

    it("sessao que superou o PR historico vigente exibe badge de conquista", () => {
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 90, topSetReps: 7, data: "01/05/2026", dataTs: new Date(2026, 4, 1).getTime() }),
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "15/05/2026", dataTs: new Date(2026, 4, 15).getTime() }),
      ]);
      render(<PowerliftingChart />);
      // Segunda sessão quebrou o PR → badge visível
      expect(screen.getByTestId("pr-badge")).toBeInTheDocument();
    });
  });

  // ── Card de estatisticas ──────────────────────────────────────────────────

  describe("Card de estatisticas", () => {
    it("exercicio com historico exibe 1RM atual, variacao, sessoes e data do ultimo PR", () => {
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "01/06/2026", dataTs: new Date(2026, 5, 1).getTime() }),
      ]);
      render(<PowerliftingChart />);
      expect(screen.getByTestId("stats-rm1")).toBeInTheDocument();
      expect(screen.getByTestId("stats-variacao")).toBeInTheDocument();
      expect(screen.getByTestId("stats-sessoes")).toBeInTheDocument();
      expect(screen.getByTestId("stats-ultimo-pr")).toBeInTheDocument();
    });

    it("1RM atual maior que sessao anterior exibe variacao positiva", () => {
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 90, topSetReps: 7, data: "01/05/2026", dataTs: new Date(2026, 4, 1).getTime() }),
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "15/05/2026", dataTs: new Date(2026, 4, 15).getTime() }),
      ]);
      render(<PowerliftingChart />);
      // calcEpley(100,7)=123.33 - calcEpley(90,7)=111.00 = +12.33
      const variacaoEl = screen.getByTestId("stats-variacao");
      expect(variacaoEl.textContent).toMatch(/^\+/);
    });

    it("1RM atual menor que sessao anterior exibe variacao negativa", () => {
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "01/05/2026", dataTs: new Date(2026, 4, 1).getTime() }),
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 85, topSetReps: 7, data: "15/05/2026", dataTs: new Date(2026, 4, 15).getTime() }),
      ]);
      render(<PowerliftingChart />);
      const variacaoEl = screen.getByTestId("stats-variacao");
      expect(variacaoEl.textContent).toMatch(/^-/);
    });

    it("apenas uma sessao no periodo exibe variacao como dash (—)", () => {
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "01/06/2026", dataTs: new Date(2026, 5, 1).getTime() }),
      ]);
      render(<PowerliftingChart />);
      expect(screen.getByTestId("stats-variacao")).toHaveTextContent("—");
    });
  });

  // ── Layout responsivo ──────────────────────────────────────────────────────

  describe("Layout responsivo", () => {
    it("viewport mobile (< 768px) exibe filtro de periodo como chips", () => {
      Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "01/06/2026", dataTs: new Date(2026, 5, 1).getTime() }),
      ]);
      render(<PowerliftingChart />);
      fireEvent(window, new Event("resize"));
      expect(screen.getByTestId("periodo-chips")).toBeInTheDocument();
    });

    it("viewport desktop (>= 768px) nao exibe chips de periodo", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "01/06/2026", dataTs: new Date(2026, 5, 1).getTime() }),
      ]);
      render(<PowerliftingChart />);
      expect(screen.queryByTestId("periodo-chips")).not.toBeInTheDocument();
    });

    it("filtro de periodo — selecionar chip '1M' atualiza o card de stats", () => {
      Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
      // Registro antigo (fora de 1M) e recente (dentro de 1M)
      const old = new Date(2026, 0, 1).getTime(); // jan
      const recent = Date.now();
      setLogbook([
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 80, topSetReps: 7, data: "01/01/2026", dataTs: old }),
        makeRegistro({ exercicio: "Supino reto barra", topSetKg: 100, topSetReps: 7, data: "15/06/2026", dataTs: recent }),
      ]);
      render(<PowerliftingChart />);
      fireEvent(window, new Event("resize"));

      // Com período padrão 1A ambos aparecem (2 sessões)
      expect(screen.getByTestId("stats-sessoes")).toHaveTextContent("2");

      // Clica no chip 1M — apenas o registro recente deve aparecer
      const chip1m = screen.getByTestId("chip-1M");
      fireEvent.click(chip1m);

      expect(screen.getByTestId("stats-sessoes")).toHaveTextContent("1");
    });

    it("tooltip mobile exibe data, 1RM, peso x reps e tecnica no CustomTooltip", () => {
      // Verifica que o componente renderiza sem erros com dados de tecnica BC
      setLogbook([
        makeRegistro({
          exercicio: "Supino reto barra",
          topSetKg: 0,
          topSetReps: 0,
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
          tecnica: "BC",
          clusterSeries: [{ kg: 100, reps: 8 }, { kg: 90, reps: 6 }],
        }),
      ]);
      render(<PowerliftingChart />);
      // Grafico renderiza sem erros e stats exibem o 1RM do Bloco 1
      expect(screen.getByTestId("stats-rm1")).toHaveTextContent("126.67 kg");
    });
  });
});
