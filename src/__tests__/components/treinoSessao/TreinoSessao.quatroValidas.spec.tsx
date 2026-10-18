/**
 * TreinoSessao — 4 séries válidas
 * Com 4 válidas, as séries 3 e 4 seguem o padrão dos Top Sets: vêm preenchidas
 * com o peso e as reps do último treino e nenhuma carga é reduzida (sem Back-off).
 * Com 3 válidas o Back-off (~90%) continua igual.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarLogbookCompleto } from "../../../utils/storage";

const EX = "Supino reto barra";

function planoCom(series: number) {
  localStorage.setItem("planoTreino", JSON.stringify({
    "Upper A": { [EX]: { ordem: 1, series_validas: series } },
  }));
}

function historico(over: Record<string, unknown>) {
  localStorage.setItem("logbook", JSON.stringify({
    [EX]: [{
      exercicio: EX,
      treinoId: "UA",
      data: "01/10/2026",
      dataTs: 1000,
      topSetKg: 90,
      topSetReps: 6,
      topSetFaixaMin: 5,
      topSetFaixaMax: 9,
      topSetBateuTeto: false,
      backoffKg: 90,
      backoffReps: 6,
      backoffFaixaMin: 5,
      backoffFaixaMax: 9,
      seriesValidas: 2,
      progrediu: false,
      ...over,
    }],
  }));
}

function abrirUpperA() {
  render(<TreinoSessao />);
  fireEvent.click(screen.getByRole("button", { name: "Upper A" }));
}

function confirmarTopSets(kg = "100", reps = "7", reps2 = "6") {
  fireEvent.change(screen.getByLabelText(/Top Set 1 kg/i), { target: { value: kg } });
  fireEvent.change(screen.getByLabelText(/Top Set 1 reps/i), { target: { value: reps } });
  fireEvent.click(screen.getByText("Confirmar Top Set 1"));
  fireEvent.change(screen.getByLabelText(/Top Set 2 reps/i), { target: { value: reps2 } });
  fireEvent.click(screen.getByText("Confirmar Top Set 2"));
}

const valor = (label: RegExp) => (screen.getByLabelText(label) as HTMLInputElement).value;

describe("TreinoSessao — 4 séries válidas", () => {
  beforeEach(() => localStorage.clear());

  it("badge mostra '4 válidas' quando o plano tem series_validas=4", () => {
    planoCom(4);
    abrirUpperA();
    expect(screen.getByText("4 válidas")).toBeInTheDocument();
  });

  it("após os Top Sets mostra Série 3 e Série 4, sem bloco de Back-off", () => {
    planoCom(4);
    abrirUpperA();
    confirmarTopSets();
    expect(screen.getByLabelText(new RegExp(`Série 3 kg ${EX}`))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(`Série 3 reps ${EX}`))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(`Série 4 kg ${EX}`))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(`Série 4 reps ${EX}`))).toBeInTheDocument();
    expect(screen.queryByText(/Back-off \(\d+%\)/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Back-off kg/i)).not.toBeInTheDocument();
  });

  it("Série 3 e Série 4 vêm com o peso e as reps do último treino", () => {
    planoCom(4);
    historico({ seriesValidas: 4, extraKg: 87.5, extraReps: 5, serie4Kg: 85, serie4Reps: 4 });
    abrirUpperA();
    confirmarTopSets("90", "6", "6");
    expect(valor(/Série 3 kg/)).toBe("87.5");
    expect(valor(/Série 3 reps/)).toBe("5");
    expect(valor(/Série 4 kg/)).toBe("85");
    expect(valor(/Série 4 reps/)).toBe("4");
  });

  it("sem série 3/4 no histórico, usa o peso e as reps do Top Set 1 sem reduzir", () => {
    planoCom(4);
    historico({ seriesValidas: 2 });
    abrirUpperA();
    confirmarTopSets("90", "6", "6");
    expect(valor(/Série 3 kg/)).toBe("90");
    expect(valor(/Série 3 reps/)).toBe("6");
    expect(valor(/Série 4 kg/)).toBe("90");
    expect(valor(/Série 4 reps/)).toBe("6");
  });

  it("sem histórico, Série 3 e Série 4 repetem o Top Set 1 confirmado (nada de 90%)", () => {
    planoCom(4);
    abrirUpperA();
    confirmarTopSets("100", "7", "6");
    expect(valor(/Série 3 kg/)).toBe("100");
    expect(valor(/Série 3 reps/)).toBe("7");
    expect(valor(/Série 4 kg/)).toBe("100");
    expect(valor(/Série 4 reps/)).toBe("7");
  });

  it("valores digitados nas séries 3 e 4 não são sobrescritos", () => {
    planoCom(4);
    abrirUpperA();
    confirmarTopSets("100", "7", "6");
    fireEvent.change(screen.getByLabelText(/Série 3 kg/), { target: { value: "97.5" } });
    fireEvent.change(screen.getByLabelText(/Série 4 reps/), { target: { value: "3" } });
    expect(valor(/Série 3 kg/)).toBe("97.5");
    expect(valor(/Série 4 reps/)).toBe("3");
  });

  it("salvar grava as 4 séries no logbook e no dadosTreino", () => {
    planoCom(4);
    abrirUpperA();
    confirmarTopSets("100", "7", "6");
    fireEvent.change(screen.getByLabelText(/Série 3 reps/), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/Série 4 kg/), { target: { value: "95" } });
    fireEvent.change(screen.getByLabelText(/Série 4 reps/), { target: { value: "4" } });

    fireEvent.click(screen.getByText("Próximo"));
    for (let i = 0; i < 9; i++) fireEvent.click(screen.getByText("Pular"));
    fireEvent.click(screen.getByText("Ver Resumo"));
    fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

    const reg = carregarLogbookCompleto()[EX][0];
    expect(reg.seriesValidas).toBe(4);
    expect(reg.extraKg).toBe(100);
    expect(reg.extraReps).toBe(5);
    expect(reg.serie4Kg).toBe(95);
    expect(reg.serie4Reps).toBe(4);

    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}")[EX].UA;
    expect(db.pesos).toEqual(["100", "100", "100", "95"]);
    expect(db.reps).toEqual(["7", "6", "5", "4"]);
  });

  it("3 válidas continua com Back-off a 90% do Top Set 1", () => {
    planoCom(3);
    abrirUpperA();
    confirmarTopSets("100", "7", "6");
    expect(screen.getByText("Back-off (90%)")).toBeInTheDocument();
    expect(valor(/Back-off kg/i)).toBe("90");
    expect(screen.queryByLabelText(/Série 4 kg/)).not.toBeInTheDocument();
  });
});
