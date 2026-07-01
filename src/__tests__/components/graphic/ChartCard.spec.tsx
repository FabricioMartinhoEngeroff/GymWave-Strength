/**
 * ChartCardTest → components/graphic/ChartCard
 * Testa o card de progressão (Top Set + Back-off): título, estado vazio,
 * chip de tendência e ações da toolbar (atualizar/excluir).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChartCard } from "../../../components/graphic/ChartCard";
import type { RegistroGraficoRaw } from "../../../hooks/useDadosTreino";

function makeRegistro(overrides: Partial<RegistroGraficoRaw> & { dataTs: number; data: string }): RegistroGraficoRaw {
  return {
    cicloId: "UA",
    pesos: [100],
    topSet: 100,
    volumeLoad: 500,
    tecnica: null,
    ...overrides,
  };
}

describe("ChartCard — components/graphic", () => {
  describe("Título e estrutura", () => {
    it("exibe o nome do exercício no título", () => {
      render(<ChartCard exercicio="Supino Reto" dados={[]} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.getByTestId("chart-card-title")).toHaveTextContent("Supino Reto");
    });
  });

  describe("Estado vazio (RG2)", () => {
    it("exibe 'Sem registros para listar.' quando não há dados", () => {
      render(<ChartCard exercicio="Supino Reto" dados={[]} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.getByTestId("chart-card-empty")).toHaveTextContent(/sem registros para listar/i);
    });

    it("exibe estado vazio quando os dados existem mas nenhum ciclo bate com o filtro", () => {
      const dados = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", cicloId: "UB" })];
      render(<ChartCard exercicio="Supino Reto" dados={dados} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.getByTestId("chart-card-empty")).toBeInTheDocument();
    });

    it("não exibe estado vazio quando há ao menos um ponto após o filtro", () => {
      const dados = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", cicloId: "UA" })];
      render(<ChartCard exercicio="Supino Reto" dados={dados} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.queryByTestId("chart-card-empty")).not.toBeInTheDocument();
    });
  });

  describe("Chip de tendência", () => {
    it("não exibe chip quando há apenas 1 sessão", () => {
      const dados = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", topSet: 100 })];
      render(<ChartCard exercicio="Supino Reto" dados={dados} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.queryByTestId("chart-card-trend")).not.toBeInTheDocument();
    });

    it("exibe chip positivo (+kg) quando o topSet mais recente é maior que o anterior", () => {
      const dados = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", topSet: 100 }),
        makeRegistro({ dataTs: new Date(2026, 5, 8).getTime(), data: "08/06/2026", topSet: 102.5 }),
      ];
      render(<ChartCard exercicio="Supino Reto" dados={dados} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.getByTestId("chart-card-trend")).toHaveTextContent("+2.5 kg");
    });

    it("exibe chip negativo (-kg) quando o topSet mais recente é menor que o anterior", () => {
      const dados = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", topSet: 100 }),
        makeRegistro({ dataTs: new Date(2026, 5, 8).getTime(), data: "08/06/2026", topSet: 95 }),
      ];
      render(<ChartCard exercicio="Supino Reto" dados={dados} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.getByTestId("chart-card-trend")).toHaveTextContent("-5 kg");
    });

    it("exibe 'Estável' quando o topSet se mantém igual", () => {
      const dados = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", topSet: 100 }),
        makeRegistro({ dataTs: new Date(2026, 5, 8).getTime(), data: "08/06/2026", topSet: 100 }),
      ];
      render(<ChartCard exercicio="Supino Reto" dados={dados} ciclosSelecionados={["UA"]} isMobile={false} />);
      expect(screen.getByTestId("chart-card-trend")).toHaveTextContent("Estável");
    });
  });

  describe("Toolbar — atualizar", () => {
    const reloadMock = vi.fn();
    const originalLocation = window.location;

    beforeEach(() => {
      reloadMock.mockClear();
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...originalLocation, reload: reloadMock },
      });
    });
    afterEach(() => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    });

    it("clicar em 'Atualizar dados' recarrega a página", () => {
      render(<ChartCard exercicio="Supino Reto" dados={[]} ciclosSelecionados={["UA"]} isMobile={false} />);
      fireEvent.click(screen.getByTestId("chart-card-refresh"));
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Toolbar — excluir", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("confirmando a exclusão remove o card da tela", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<ChartCard exercicio="Supino Reto" dados={[]} ciclosSelecionados={["UA"]} isMobile={false} />);
      fireEvent.click(screen.getByTestId("chart-card-delete"));
      expect(screen.queryByTestId("chart-card")).not.toBeInTheDocument();
    });

    it("cancelando a exclusão mantém o card visível", () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<ChartCard exercicio="Supino Reto" dados={[]} ciclosSelecionados={["UA"]} isMobile={false} />);
      fireEvent.click(screen.getByTestId("chart-card-delete"));
      expect(screen.getByTestId("chart-card")).toBeInTheDocument();
    });
  });
});
