/**
 * VolumeLoadCardTest → components/graphic/VolumeLoadCard
 * Testa o card de volume load por período (EF_03, seção 4.4): título,
 * estado vazio, agrupamento por granularidade e marcador de técnica RP.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VolumeLoadCard } from "../../../components/graphic/VolumeLoadCard";
import type { RegistroGraficoRaw } from "../../../hooks/useDadosTreino";
import type { Granularidade } from "../../../utils/volumeBuckets";

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

function renderCard(dados: RegistroGraficoRaw[], granularidade: Granularidade = "semana") {
  return render(
    <VolumeLoadCard
      exercicio="Supino Reto"
      dados={dados}
      ciclosSelecionados={["UA"]}
      granularidade={granularidade}
      isMobile={false}
    />
  );
}

describe("VolumeLoadCard — components/graphic", () => {
  describe("Título e estrutura", () => {
    it("exibe o nome do exercício no título", () => {
      renderCard([]);
      expect(screen.getByTestId("volume-card-title")).toHaveTextContent("Supino Reto");
    });
  });

  describe("Estado vazio (RG2)", () => {
    it("exibe 'Sem registros para listar.' quando não há dados", () => {
      renderCard([]);
      expect(screen.getByTestId("volume-card-empty")).toHaveTextContent(/sem registros para listar/i);
    });

    it("exibe estado vazio quando nenhum ciclo bate com o filtro selecionado", () => {
      const dados = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", cicloId: "UB" })];
      renderCard(dados);
      expect(screen.getByTestId("volume-card-empty")).toBeInTheDocument();
    });

    it("exibe estado vazio quando o volume load de todos os registros é zero", () => {
      const dados = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", volumeLoad: 0 })];
      renderCard(dados);
      expect(screen.getByTestId("volume-card-empty")).toBeInTheDocument();
    });
  });

  describe("Agrupamento por granularidade", () => {
    it("agrupa sessões da mesma semana em 1 balde", () => {
      const dados = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026" }), // segunda
        makeRegistro({ dataTs: new Date(2026, 5, 3).getTime(), data: "03/06/2026" }), // quarta
      ];
      renderCard(dados, "semana");
      expect(screen.getByTestId("volume-card")).toHaveAttribute("data-bucket-count", "1");
    });

    it("separa sessões de semanas diferentes em baldes distintos", () => {
      const dados = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026" }),
        makeRegistro({ dataTs: new Date(2026, 5, 15).getTime(), data: "15/06/2026" }),
      ];
      renderCard(dados, "semana");
      expect(screen.getByTestId("volume-card")).toHaveAttribute("data-bucket-count", "2");
    });

    it("agrupa o mesmo par de sessões em 1 balde quando a granularidade é mês", () => {
      const dados = [
        makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026" }),
        makeRegistro({ dataTs: new Date(2026, 5, 15).getTime(), data: "15/06/2026" }),
      ];
      renderCard(dados, "mes");
      expect(screen.getByTestId("volume-card")).toHaveAttribute("data-bucket-count", "1");
    });

    it("agrupa sessões de meses diferentes em 1 balde quando a granularidade é ano", () => {
      const dados = [
        makeRegistro({ dataTs: new Date(2026, 0, 1).getTime(), data: "01/01/2026" }),
        makeRegistro({ dataTs: new Date(2026, 10, 1).getTime(), data: "01/11/2026" }),
      ];
      renderCard(dados, "ano");
      expect(screen.getByTestId("volume-card")).toHaveAttribute("data-bucket-count", "1");
    });
  });

  describe("Marcador de técnica RP (RG7)", () => {
    it("sinaliza data-has-rp=true quando alguma sessão do período usou RP", () => {
      const dados = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", tecnica: "RP" })];
      renderCard(dados, "semana");
      expect(screen.getByTestId("volume-card")).toHaveAttribute("data-has-rp", "true");
    });

    it("sinaliza data-has-rp=false quando nenhuma sessão do período usou RP", () => {
      const dados = [makeRegistro({ dataTs: new Date(2026, 5, 1).getTime(), data: "01/06/2026", tecnica: null })];
      renderCard(dados, "semana");
      expect(screen.getByTestId("volume-card")).toHaveAttribute("data-has-rp", "false");
    });
  });
});
