/**
 * VolumeLoadTest -> component
 * Testa renderizacao e exibicao de dados do VolumeLoad com series count.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
