/**
 * HooksTest → hooks/useDadosTreino
 * Testa o hook que transforma dadosTreino do localStorage
 * para o formato de gráfico (DadosAgrupados).
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDadosTreino } from "../../hooks/useDadosTreino";

describe("useDadosTreino — Hook de dados para gráficos", () => {
  describe("Estado inicial", () => {
    it("retorna objeto vazio quando localStorage está vazio", async () => {
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        expect(result.current).toEqual({});
      });
    });
  });

  describe("Transformação de dados", () => {
    it("agrupa registros por exercício", async () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: {
              data: "10/06/2026",
              pesos: ["100", "90"],
              reps: ["5", "8"],
              exercicio: "Supino Reto",
            },
          },
        })
      );
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        expect(result.current["Supino Reto"]).toBeDefined();
        expect(result.current["Supino Reto"]).toHaveLength(1);
      });
    });

    it("normaliza id de ciclo legado 'Ciclo 1' para 'C1'", async () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          Agachamento: {
            "Ciclo 1": {
              data: "01/01/2026",
              pesos: ["130"],
              reps: ["5"],
              exercicio: "Agachamento",
            },
          },
        })
      );
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        const registros = result.current["Agachamento"];
        expect(registros?.[0]?.cicloId).toBe("C1");
      });
    });

    it("calcula topSet como maior peso do registro", async () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C3: {
              data: "05/06/2026",
              pesos: ["120", "100", "90"],
              reps: ["3", "5", "6"],
              exercicio: "Supino Reto",
            },
          },
        })
      );
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        expect(result.current["Supino Reto"]?.[0]?.topSet).toBe(120);
      });
    });

    it("ignora registros com todos os pesos inválidos", async () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: {
              data: "10/06/2026",
              pesos: ["", ""],
              reps: ["", ""],
              exercicio: "Supino Reto",
            },
          },
        })
      );
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        expect(result.current["Supino Reto"] ?? []).toHaveLength(0);
      });
    });
  });
});
