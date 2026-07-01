/**
 * HooksTest → hooks/useDadosTreino
 * Testa o hook que transforma dadosTreino do localStorage
 * para o formato de gráfico (DadosAgrupados).
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDadosTreino } from "../../hooks/useDadosTreino";
import type { RegistroExercicio, Logbook } from "../../types/TrainingData";

const BASE_LOGBOOK_REGISTRO: Omit<RegistroExercicio, "exercicio" | "topSetKg" | "topSetReps" | "dataTs" | "data"> = {
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

function setLogbook(registros: RegistroExercicio[]) {
  const logbook: Logbook = {};
  registros.forEach((r) => {
    if (!logbook[r.exercicio]) logbook[r.exercicio] = [];
    logbook[r.exercicio].push(r);
  });
  localStorage.setItem("logbook", JSON.stringify(logbook));
}

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

  describe("Cálculo de volumeLoad (dadosTreino legado)", () => {
    it("soma peso × reps de cada série do registro", async () => {
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
        // 100*5 + 90*8 = 500 + 720 = 1220
        expect(result.current["Supino Reto"]?.[0]?.volumeLoad).toBe(1220);
      });
    });

    it("registros legados não têm técnica (tecnica fica undefined)", async () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: { data: "10/06/2026", pesos: ["100"], reps: ["5"], exercicio: "Supino Reto" },
          },
        })
      );
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        expect(result.current["Supino Reto"]?.[0]?.tecnica).toBeFalsy();
      });
    });
  });

  describe("Cálculo de volumeLoad e técnica (logbook)", () => {
    it("modo padrão soma (topSet × reps) + (backoff × reps)", async () => {
      setLogbook([
        {
          ...BASE_LOGBOOK_REGISTRO,
          exercicio: "Supino Reto",
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
          topSetKg: 100,
          topSetReps: 5,
          backoffKg: 80,
          backoffReps: 8,
        },
      ]);
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        // 100*5 + 80*8 = 500 + 640 = 1140
        expect(result.current["Supino Reto"]?.[0]?.volumeLoad).toBe(1140);
        expect(result.current["Supino Reto"]?.[0]?.tecnica).toBeNull();
      });
    });

    it("inclui a série extra quando seriesValidas = 3", async () => {
      setLogbook([
        {
          ...BASE_LOGBOOK_REGISTRO,
          exercicio: "Supino Reto",
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
          topSetKg: 100,
          topSetReps: 5,
          backoffKg: 80,
          backoffReps: 8,
          seriesValidas: 3,
          extraKg: 60,
          extraReps: 10,
        },
      ]);
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        // 500 + 640 + (60*10=600) = 1740
        expect(result.current["Supino Reto"]?.[0]?.volumeLoad).toBe(1740);
      });
    });

    it("modo RP soma apenas os blocos do clusterSeries e marca tecnica='RP'", async () => {
      setLogbook([
        {
          ...BASE_LOGBOOK_REGISTRO,
          exercicio: "Agachamento",
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
          topSetKg: 0,
          topSetReps: 0,
          tecnica: "RP",
          clusterSeries: [
            { kg: 100, reps: 8 },
            { kg: 100, reps: 5 },
            { kg: 100, reps: 5 },
            { kg: 100, reps: 5 },
          ],
        },
      ]);
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        // 100*8 + 100*5*3 = 800 + 1500 = 2300
        expect(result.current["Agachamento"]?.[0]?.volumeLoad).toBe(2300);
        expect(result.current["Agachamento"]?.[0]?.tecnica).toBe("RP");
      });
    });

    it("ignora blocos do clusterSeries com kg ou reps zerados", async () => {
      setLogbook([
        {
          ...BASE_LOGBOOK_REGISTRO,
          exercicio: "Agachamento",
          data: "01/06/2026",
          dataTs: new Date(2026, 5, 1).getTime(),
          topSetKg: 0,
          topSetReps: 0,
          tecnica: "RP",
          clusterSeries: [
            { kg: 100, reps: 8 },
            { kg: 0, reps: 5 },
          ],
        },
      ]);
      const { result } = renderHook(() => useDadosTreino());
      await waitFor(() => {
        expect(result.current["Agachamento"]?.[0]?.volumeLoad).toBe(800);
      });
    });
  });
});
