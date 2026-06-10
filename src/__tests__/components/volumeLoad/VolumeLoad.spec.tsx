/**
 * VolumeLoadTest → component
 * Testa renderização e exibição de dados do VolumeLoad.
 * Usa localStorage real do jsdom para simular cenários.
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

describe("VolumeLoad — Componente de volume por músculo", () => {
  describe("Estado sem dados", () => {
    it("renderiza o header com título correto", () => {
      render(<VolumeLoad />);
      expect(
        screen.getByText("Volume load por músculo")
      ).toBeInTheDocument();
    });

    it("exibe subtítulo de comparação semanal", () => {
      render(<VolumeLoad />);
      expect(
        screen.getByText("Semana atual vs semana anterior")
      ).toBeInTheDocument();
    });

    it("exibe mensagem quando não há treinos registrados", () => {
      render(<VolumeLoad />);
      expect(
        screen.getByText(/nenhum treino registrado/i)
      ).toBeInTheDocument();
    });
  });

  describe("Estado com dados desta semana", () => {
    it("exibe card do músculo Peito quando há treino de supino esta semana", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: {
              data: "10/06/2026",
              pesos: ["100", "90"],
              reps: ["10", "10"],
              exercicio: "Supino Reto",
            },
          },
        })
      );
      render(<VolumeLoad />);
      expect(screen.getByText("Peito")).toBeInTheDocument();
    });

    it("exibe card de Costas quando há treino de remada esta semana", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Remada Curvada": {
            C1: {
              data: "10/06/2026",
              pesos: ["80"],
              reps: ["8"],
              exercicio: "Remada Curvada",
            },
          },
        })
      );
      render(<VolumeLoad />);
      expect(screen.getByText("Costas")).toBeInTheDocument();
    });
  });
});
