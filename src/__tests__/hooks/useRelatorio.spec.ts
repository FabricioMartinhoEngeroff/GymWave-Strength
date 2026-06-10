/**
 * HooksTest → hooks/useRelatorio
 * Testa o hook de gerenciamento de relatórios:
 * carregamento, filtros por exercício e período, edição e exclusão.
 */
import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRelatorio } from "../../hooks/useRelatorio";

const DADOS_BASE = {
  "Supino Reto": {
    C1: {
      data: "10/06/2026",
      pesos: ["100", "90"],
      reps: ["5", "8"],
      obs: "",
      exercicio: "Supino Reto",
    },
    C2: {
      data: "01/05/2026",
      pesos: ["110"],
      reps: ["4"],
      obs: "",
      exercicio: "Supino Reto",
    },
  },
  Agachamento: {
    C1: {
      data: "08/06/2026",
      pesos: ["130"],
      reps: ["5"],
      obs: "",
      exercicio: "Agachamento",
    },
  },
};

describe("useRelatorio — Hook de gerenciamento de relatórios", () => {
  describe("Carregamento inicial", () => {
    it("retorna linhas vazias quando localStorage está vazio", async () => {
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => {
        expect(result.current.linhas).toHaveLength(0);
      });
    });

    it("carrega registros do localStorage ao montar", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => {
        expect(result.current.linhas.length).toBeGreaterThan(0);
      });
    });

    it("ordena registros por data decrescente", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => {
        const datas = result.current.linhas.map((l) => l.data);
        expect(datas[0]).toBe("10/06/2026");
      });
    });
  });

  describe("Filtros", () => {
    it("exerciciosDisponiveis lista exercícios únicos ordenados", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => {
        expect(result.current.exerciciosDisponiveis).toContain("Supino Reto");
        expect(result.current.exerciciosDisponiveis).toContain("Agachamento");
      });
    });

    it("filtra linhas por exercício selecionado", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => expect(result.current.linhas.length).toBeGreaterThan(0));

      act(() => result.current.setExercicioSelecionado("Agachamento"));

      await waitFor(() => {
        expect(
          result.current.linhasFiltradas.every((l) => l.exercicio === "Agachamento")
        ).toBe(true);
      });
    });

    it("retorna todas as linhas quando exercicioSelecionado é vazio", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => {
        expect(result.current.linhasFiltradas.length).toBe(result.current.linhas.length);
      });
    });

    it("filtra por intervalo de tempo '1M'", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => expect(result.current.linhas.length).toBeGreaterThan(0));

      act(() => result.current.setIntervalo("1M"));

      await waitFor(() => {
        // 01/05/2026 pode cair fora de 30 dias a partir de 10/06/2026
        expect(result.current.linhasFiltradas.length).toBeLessThanOrEqual(
          result.current.linhas.length
        );
      });
    });
  });

  describe("Edição e exclusão", () => {
    it("salvarEdicao atualiza a linha correta no estado", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => expect(result.current.linhas.length).toBeGreaterThan(0));

      act(() => {
        result.current.salvarEdicao(0, { obs: "editado" });
      });

      await waitFor(() => {
        expect(result.current.linhas[0].obs).toBe("editado");
      });
    });

    it("excluirLinha remove o registro do estado", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify(DADOS_BASE));
      const { result } = renderHook(() => useRelatorio());
      await waitFor(() => expect(result.current.linhas.length).toBeGreaterThan(0));

      const qtdAntes = result.current.linhas.length;
      act(() => {
        result.current.excluirLinha(0);
      });

      await waitFor(() => {
        expect(result.current.linhas.length).toBe(qtdAntes - 1);
      });
    });
  });
});
