/**
 * TreinoSessao — protocolo com sessões próprias (várias semanas/dias).
 * As sessões vêm do plano importado; 1 série válida termina no Top Set 1; o cluster
 * usa o número de blocos do plano e 1 série quando o exercício tem 1 válida.
 * Sem plano próprio, a tela continua com as 4 sessões fixas.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarRegistros } from "../../../utils/storage";

function exercicio(nome: string, seriesValidas: number, extra: Record<string, unknown> = {}) {
  return {
    nome, grupo: "Costas", faixaTopSet: [6, 12], faixaBackoff: [6, 12], backoffPct: 0.9,
    seriesValidas, tecnica: null, cue: "", ...extra,
  };
}

function protocolo() {
  localStorage.setItem("sessoes_config", JSON.stringify({
    "S1 Seg · Pull": [
      exercicio("Remada curvada", 2, { cue: "1ª: Perto da falha | 2ª: Até a falha total" }),
      exercicio("Puxador frente pegada neutra", 1),
    ],
    "S1 Sex · Upper Cluster": [exercicio("Remada articulada", 1, { clusterBlocos: 6 })],
  }));
  localStorage.setItem("planoTreino", JSON.stringify({
    "S1 Seg · Pull": {
      "Remada curvada": { ordem: 1, series_validas: 2 },
      "Puxador frente pegada neutra": { ordem: 2, series_validas: 1 },
    },
    "S1 Sex · Upper Cluster": { "Remada articulada": { ordem: 1, series_validas: 1 } },
  }));
}

function topSet1(kg: string, reps: string) {
  fireEvent.change(screen.getByLabelText(/Top Set 1 kg/i), { target: { value: kg } });
  fireEvent.change(screen.getByLabelText(/Top Set 1 reps/i), { target: { value: reps } });
  fireEvent.click(screen.getByText("Confirmar Top Set 1"));
}

function salvar() {
  fireEvent.click(screen.getByText("Ver Resumo"));
  fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));
}

describe("TreinoSessao — protocolo com sessões próprias", () => {
  beforeEach(() => localStorage.clear());

  it("sem plano próprio, mostra as 4 sessões fixas", () => {
    render(<TreinoSessao />);
    for (const s of ["Upper A", "Upper B", "Lower A", "Lower B"]) {
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument();
    }
  });

  it("plano importado com as 4 sessões padrão mantém os 4 botões", () => {
    localStorage.setItem("sessoes_config", JSON.stringify({ "Upper A": [exercicio("Supino reto barra", 2)] }));
    render(<TreinoSessao />);
    for (const s of ["Upper A", "Upper B", "Lower A", "Lower B"]) {
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument();
    }
  });

  it("mostra as sessões do protocolo no lugar das 4 fixas", () => {
    protocolo();
    render(<TreinoSessao />);
    expect(screen.getByRole("button", { name: "S1 Seg · Pull" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "S1 Sex · Upper Cluster" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upper A" })).not.toBeInTheDocument();
  });

  it("mostra o cue com as duas séries do exercício repetido", () => {
    protocolo();
    render(<TreinoSessao />);
    fireEvent.click(screen.getByRole("button", { name: "S1 Seg · Pull" }));
    expect(screen.getByText(/1ª: Perto da falha \| 2ª: Até a falha total/)).toBeInTheDocument();
  });

  it("1 série válida: termina no Top Set 1, sem Top Set 2", () => {
    protocolo();
    render(<TreinoSessao />);
    fireEvent.click(screen.getByRole("button", { name: "S1 Seg · Pull" }));
    fireEvent.click(screen.getByText("Pular"));
    expect(screen.getByText("1 válida")).toBeInTheDocument();
    topSet1("70", "10");
    expect(screen.queryByLabelText(/Top Set 2 reps/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmar Top Set 2")).not.toBeInTheDocument();
  });

  it("salva com o id da sessão do protocolo e 1 série", () => {
    protocolo();
    render(<TreinoSessao />);
    fireEvent.click(screen.getByRole("button", { name: "S1 Seg · Pull" }));
    fireEvent.click(screen.getByText("Pular"));
    topSet1("70", "10");
    salvar();

    const [reg] = carregarRegistros();
    expect(reg).toMatchObject({
      sessao: "S1SEG",
      exercicio: "puxador_frente_pegada_neutra",
      series: [{ tipo: "top1", kg: 70, reps: 10 }],
    });
    expect(reg!.id).toMatch(/_S1SEG_puxador_frente_pegada_neutra$/);
  });

  it("cluster com 1 série válida mostra os 6 blocos do plano e confirma sem Série 2", () => {
    protocolo();
    render(<TreinoSessao />);
    fireEvent.click(screen.getByRole("button", { name: "S1 Sex · Upper Cluster" }));
    fireEvent.click(screen.getByText("Cluster Set"));

    expect(screen.getAllByLabelText(/Série 1 bloco \d+ kg Remada articulada/)).toHaveLength(6);
    expect(screen.queryByRole("button", { name: /Série 2/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Série 1 bloco 1 kg Remada articulada"), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText("Série 1 bloco 1 reps Remada articulada"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Série 1 bloco 2 kg Remada articulada"), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText("Série 1 bloco 2 reps Remada articulada"), { target: { value: "4" } });
    fireEvent.click(screen.getByText("Confirmar Cluster"));
    salvar();

    const [reg] = carregarRegistros();
    expect(reg).toMatchObject({
      sessao: "S1SEX",
      series: [
        { tipo: "cluster1", kg: 50, reps: 4 },
        { tipo: "cluster1", kg: 50, reps: 4 },
      ],
    });
  });

  it("cluster com 2 válidas (seu treino) continua com Série 1 e Série 2 de 4 blocos", () => {
    render(<TreinoSessao />);
    fireEvent.click(screen.getByRole("button", { name: "Upper A" }));
    fireEvent.click(screen.getByText("Cluster Set"));
    expect(screen.getAllByLabelText(/Série 1 bloco \d+ kg/)).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Série 2" })).toBeInTheDocument();
  });
});
