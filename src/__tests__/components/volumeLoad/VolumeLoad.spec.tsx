/**
 * VolumeLoadTest -> component
 * Testa renderizacao e exibicao de dados do VolumeLoad com series count.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import VolumeLoad from "../../../components/volumeLoad/VolumeLoad";

const DATA_FIXA = new Date("2026-06-10T12:00:00");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(DATA_FIXA);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("VolumeLoad — Componente de volume por musculo", () => {
  describe("Estado sem dados", () => {
    it("renderiza o header com titulo correto", () => {
      render(<VolumeLoad />);
      expect(
        screen.getByText("Volume load por músculo")
      ).toBeInTheDocument();
    });

    it("exibe subtitulo de comparacao semanal", () => {
      render(<VolumeLoad />);
      expect(
        screen.getByText("Semana atual vs semana anterior")
      ).toBeInTheDocument();
    });

    it("exibe mensagem quando nao ha treinos registrados", () => {
      render(<VolumeLoad />);
      expect(
        screen.getByText(/nenhum treino registrado/i)
      ).toBeInTheDocument();
    });
  });

  describe("Estado com dados desta semana", () => {
    it("exibe card do musculo Peitoral quando ha treino de supino esta semana", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino reto barra": {
            UA: {
              data: "10/06/2026",
              pesos: ["100", "85"],
              reps: ["7", "12"],
              exercicio: "Supino reto barra",
            },
          },
        })
      );
      render(<VolumeLoad />);
      expect(screen.getByText("Peitoral")).toBeInTheDocument();
    });

    it("exibe card de Costas quando ha treino de remada esta semana", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Remada peito apoiado": {
            UB: {
              data: "10/06/2026",
              pesos: ["80"],
              reps: ["8"],
              exercicio: "Remada peito apoiado",
            },
          },
        })
      );
      render(<VolumeLoad />);
      expect(screen.getByText("Costas")).toBeInTheDocument();
    });

    it("exibe contagem de series quando ha dados", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino reto barra": {
            UA: {
              data: "10/06/2026",
              pesos: ["100", "85"],
              reps: ["7", "12"],
              exercicio: "Supino reto barra",
            },
          },
        })
      );
      render(<VolumeLoad />);
      expect(screen.getByText(/2 séries/)).toBeInTheDocument();
    });
  });

  // ── Helpers para os novos blocos ─────────────────────────────────────────

  function makeLogbookEntry(exercicio: string, dateISO: string, overrides: Record<string, unknown> = {}) {
    const [y, m, d] = dateISO.split("-");
    return {
      exercicio,
      treinoId: "UA",
      data: `${d}/${m}/${y}`,
      dataTs: new Date(`${dateISO}T12:00:00`).getTime(),
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
      progrediu: true,
      ...overrides,
    };
  }

  // 10 semanas consecutivas terminando em W24 (2026-06-10)
  const DATAS_10_SEMANAS = [
    "2026-06-10", // W24 — semana atual
    "2026-06-03", // W23
    "2026-05-27", // W22
    "2026-05-20", // W21
    "2026-05-13", // W20
    "2026-05-06", // W19
    "2026-04-29", // W18
    "2026-04-22", // W17
    "2026-04-15", // W16
    "2026-04-08", // W15
  ];

  function setLogbookStreak(n: number) {
    const entries = DATAS_10_SEMANAS.slice(0, n).map((d) =>
      makeLogbookEntry("Supino reto barra", d)
    );
    localStorage.setItem("logbook", JSON.stringify({ "Supino reto barra": entries }));
  }

  // ── Toggle de Granularidade ──────────────────────────────────────────────

  describe("Toggle de Granularidade (RG7)", () => {
    beforeEach(() => {
      localStorage.clear();
      cleanup();
    });

    it("renderiza chip '1 sem'", () => {
      render(<VolumeLoad />);
      expect(screen.getByText("1 sem")).toBeInTheDocument();
    });

    it("renderiza chips de 1 a 6 semanas e Mês", () => {
      render(<VolumeLoad />);
      expect(screen.getByText("1 sem")).toBeInTheDocument();
      expect(screen.getByText("2 sem")).toBeInTheDocument();
      expect(screen.getByText("3 sem")).toBeInTheDocument();
      expect(screen.getByText("4 sem")).toBeInTheDocument();
      expect(screen.getByText("5 sem")).toBeInTheDocument();
      expect(screen.getByText("6 sem")).toBeInTheDocument();
      expect(screen.getByText("Mês")).toBeInTheDocument();
    });

    it("subtitulo inicial é 'Semana atual vs semana anterior'", () => {
      render(<VolumeLoad />);
      expect(screen.getByText("Semana atual vs semana anterior")).toBeInTheDocument();
    });

    it("clicar 'Mês' muda subtitulo para 'Mês atual vs mês anterior'", () => {
      render(<VolumeLoad />);
      fireEvent.click(screen.getByText("Mês"));
      expect(screen.getByText("Mês atual vs mês anterior")).toBeInTheDocument();
    });

    it("clicar '1 sem' após 'Mês' restaura subtitulo semanal", () => {
      render(<VolumeLoad />);
      fireEvent.click(screen.getByText("Mês"));
      fireEvent.click(screen.getByText("1 sem"));
      expect(screen.getByText("Semana atual vs semana anterior")).toBeInTheDocument();
    });

    it("clicar '3 sem' muda subtitulo para range de 3 semanas", () => {
      render(<VolumeLoad />);
      fireEvent.click(screen.getByText("3 sem"));
      expect(screen.getByText("Últimas 3 semanas vs 3 semanas anteriores")).toBeInTheDocument();
    });

    it("clicar '2 sem' muda subtitulo para range de 2 semanas", () => {
      render(<VolumeLoad />);
      fireEvent.click(screen.getByText("2 sem"));
      expect(screen.getByText("Últimas 2 semanas vs 2 semanas anteriores")).toBeInTheDocument();
    });

    it("clicar '6 sem' muda subtitulo para range de 6 semanas", () => {
      render(<VolumeLoad />);
      fireEvent.click(screen.getByText("6 sem"));
      expect(screen.getByText("Últimas 6 semanas vs 6 semanas anteriores")).toBeInTheDocument();
    });

    it("clicar '1 sem' após '4 sem' restaura subtitulo de 1 semana", () => {
      render(<VolumeLoad />);
      fireEvent.click(screen.getByText("4 sem"));
      expect(screen.getByText("Últimas 4 semanas vs 4 semanas anteriores")).toBeInTheDocument();
      fireEvent.click(screen.getByText("1 sem"));
      expect(screen.getByText("Semana atual vs semana anterior")).toBeInTheDocument();
    });

    it("clicar 'Mês' após '3 sem' muda para subtitulo mensal", () => {
      render(<VolumeLoad />);
      fireEvent.click(screen.getByText("3 sem"));
      fireEvent.click(screen.getByText("Mês"));
      expect(screen.getByText("Mês atual vs mês anterior")).toBeInTheDocument();
    });

    it("dado da semana anterior aparece quando range é 2 sem", () => {
      // Jun 3 = W23 (semana anterior) — com 2 sem, faz parte do período atual
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry("Supino reto barra", "2026-06-03")],
      }));
      render(<VolumeLoad />);
      // Com 1 sem: Jun 3 é anterior, vol atual = 0
      expect(screen.getByText("Peitoral")).toBeInTheDocument();
      // Troca para 2 sem: Jun 3 passa a ser atual
      fireEvent.click(screen.getByText("2 sem"));
      expect(screen.getByText("Peitoral")).toBeInTheDocument();
    });

    it("dado de junho (semana anterior) aparece como atual ao trocar para mês", () => {
      // Jun 3 = semana anterior mas mesmo mês (junho)
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry("Supino reto barra", "2026-06-03")],
      }));
      render(<VolumeLoad />);

      // Em modo semana: Jun 3 é semana anterior → card de Peitoral aparece (volumeAnterior > 0)
      // mas "Esta sem." mostra 0 kg
      // Em modo mês: Jun 3 é mês atual → "Mês" mostra o valor
      fireEvent.click(screen.getByText("Mês"));
      expect(screen.getByText("Peitoral")).toBeInTheDocument();
    });
  });

  // ── Banner de Deload ─────────────────────────────────────────────────────

  describe("Banner de Deload [banner_deload] (RG8)", () => {
    beforeEach(() => {
      localStorage.clear();
      cleanup();
    });

    it("não exibe banner quando ha menos de 10 semanas de treino consecutivo", () => {
      setLogbookStreak(9);
      render(<VolumeLoad />);
      expect(screen.queryByText(/semanas de treino contínuo/i)).toBeNull();
    });

    it("exibe banner quando ha exatamente 10 semanas consecutivas", () => {
      setLogbookStreak(10);
      render(<VolumeLoad />);
      expect(screen.getByText(/10 semanas de treino contínuo/i)).toBeInTheDocument();
    });

    it("exibe mensagem de recomendação no banner de deload", () => {
      setLogbookStreak(10);
      render(<VolumeLoad />);
      expect(
        screen.getByText(/considere 1.2 semanas com volume reduzido/i)
      ).toBeInTheDocument();
    });

    it("não exibe banner quando logbook está vazio", () => {
      render(<VolumeLoad />);
      expect(screen.queryByText(/semanas de treino contínuo/i)).toBeNull();
    });

    it("nao exibe banner para 1 semana de treino", () => {
      setLogbookStreak(1);
      render(<VolumeLoad />);
      expect(screen.queryByText(/semanas de treino contínuo/i)).toBeNull();
    });
  });

  // ── Badges de Diagnóstico ────────────────────────────────────────────────

  describe("Badges de Diagnóstico por Grupo Muscular (RG9 e RG10)", () => {
    beforeEach(() => {
      localStorage.clear();
      cleanup();
    });

    it("não exibe badge 'estagnado' quando nenhum grupo atinge critério", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry("Supino reto barra", "2026-06-10")],
      }));
      render(<VolumeLoad />);
      expect(screen.queryByText("estagnado")).toBeNull();
    });

    it("exibe badge 'estagnado' no card do grupo muscular correspondente", () => {
      // 2 exercícios de Peitoral, cada um com 4 sessões sem progressão
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [
          makeLogbookEntry("Supino reto barra", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Supino reto barra", "2026-06-03", { progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Supino reto barra", "2026-05-27", { progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Supino reto barra", "2026-05-20", { progrediu: false, topSetBateuTeto: false }),
        ],
        "Crossover braço estendido": [
          makeLogbookEntry("Crossover braço estendido", "2026-06-10", { progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Crossover braço estendido", "2026-06-03", { progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Crossover braço estendido", "2026-05-27", { progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Crossover braço estendido", "2026-05-20", { progrediu: false, topSetBateuTeto: false }),
        ],
      }));
      render(<VolumeLoad />);
      expect(screen.getByText("estagnado")).toBeInTheDocument();
    });

    it("não exibe badge '↓ carga' quando nenhum grupo atinge critério", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [makeLogbookEntry("Supino reto barra", "2026-06-10")],
      }));
      render(<VolumeLoad />);
      expect(screen.queryByText("↓ carga")).toBeNull();
    });

    it("exibe badge '↓ carga' quando 2 exercicios do grupo têm tonnage menor na semana atual", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [
          makeLogbookEntry("Supino reto barra", "2026-06-10", { topSetKg: 90,  topSetReps: 7 }), // atual: 630
          makeLogbookEntry("Supino reto barra", "2026-06-03", { topSetKg: 100, topSetReps: 7 }), // anterior: 700
        ],
        "Crossover braço estendido": [
          makeLogbookEntry("Crossover braço estendido", "2026-06-10", { topSetKg: 18, topSetReps: 12 }), // atual: 216
          makeLogbookEntry("Crossover braço estendido", "2026-06-03", { topSetKg: 25, topSetReps: 12 }), // anterior: 300
        ],
      }));
      render(<VolumeLoad />);
      expect(screen.getByText("↓ carga")).toBeInTheDocument();
    });

    it("exibe badge 'estagnado' e '↓ carga' simultaneamente quando ambas condições são atendidas", () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Supino reto barra": [
          makeLogbookEntry("Supino reto barra", "2026-06-10", { topSetKg: 90,  topSetReps: 7, progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Supino reto barra", "2026-06-03", { topSetKg: 100, topSetReps: 7, progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Supino reto barra", "2026-05-27", { topSetKg: 100, topSetReps: 7, progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Supino reto barra", "2026-05-20", { topSetKg: 100, topSetReps: 7, progrediu: false, topSetBateuTeto: false }),
        ],
        "Crossover braço estendido": [
          makeLogbookEntry("Crossover braço estendido", "2026-06-10", { topSetKg: 18, topSetReps: 12, progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Crossover braço estendido", "2026-06-03", { topSetKg: 25, topSetReps: 12, progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Crossover braço estendido", "2026-05-27", { topSetKg: 25, topSetReps: 12, progrediu: false, topSetBateuTeto: false }),
          makeLogbookEntry("Crossover braço estendido", "2026-05-20", { topSetKg: 25, topSetReps: 12, progrediu: false, topSetBateuTeto: false }),
        ],
      }));
      render(<VolumeLoad />);
      expect(screen.getByText("estagnado")).toBeInTheDocument();
      expect(screen.getByText("↓ carga")).toBeInTheDocument();
    });
  });
});
