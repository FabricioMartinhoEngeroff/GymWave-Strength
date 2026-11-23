/**
 * TreinoSessao — esforço por série (RPE/RIR) — EF_02 RG20 a RG23
 */
import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, render, screen, fireEvent, within } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarRegistros, salvarRegistro } from "../../../utils/storage";
import type { RegistroExercicio } from "../../../types/TrainingData";

const EX = "Supino reto barra";

/** Plano com um exercício só: o teste não precisa pular os outros 10. */
function planoDeUmExercicio() {
  localStorage.clear();
  localStorage.setItem("sessoes_config", JSON.stringify({
    "Upper A": [{
      nome: EX, grupo: "Peitoral", faixaTopSet: [5, 8], faixaBackoff: [8, 10], backoffPct: 0.9, seriesValidas: 2, cue: "",
    }],
  }));
}

function abrir() {
  render(<TreinoSessao />);
  fireEvent.click(screen.getByRole("button", { name: "Upper A" }));
}
const grupo = (serie: string) => screen.getByLabelText(`Esforço ${serie} ${EX}`);
const chip = (serie: string, rotulo: string) => within(grupo(serie)).getByLabelText(rotulo);
const marcar = (serie: string, rotulo: string) => fireEvent.click(chip(serie, rotulo));

function topSet(kg: string, reps: string, rpe?: string) {
  fireEvent.change(screen.getByLabelText(/Top Set 1 kg/), { target: { value: kg } });
  fireEvent.change(screen.getByLabelText(/Top Set 1 reps/), { target: { value: reps } });
  if (rpe) marcar("Top Set 1", rpe);
  fireEvent.click(screen.getByText("Confirmar Top Set 1"));
}
function topSet2(reps: string, rpe?: string) {
  fireEvent.change(screen.getByLabelText(/Top Set 2 reps/), { target: { value: reps } });
  if (rpe) marcar("Top Set 2", rpe);
  fireEvent.click(screen.getByText("Confirmar Top Set 2"));
}
const revisar = () => fireEvent.click(screen.getByText("Ver Resumo"));
function salvar() {
  revisar();
  fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));
}

const DIA = 86400000;
function historico(diasAtras: number, over: Partial<RegistroExercicio>) {
  const d = new Date(Date.now() - diasAtras * DIA);
  salvarRegistro({
    exercicio: EX, treinoId: "UA", data: d.toLocaleDateString("pt-BR"), dataTs: d.getTime(),
    topSetKg: 100, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
    backoffKg: 100, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
    seriesValidas: 2, progrediu: false, ...over,
  });
}

describe("TreinoSessao — RPE/RIR por série", () => {
  beforeEach(planoDeUmExercicio);

  it("é opcional: salva sem RPE como antes", () => {
    abrir();
    topSet("100", "7");
    topSet2("6");
    salvar();
    expect(carregarRegistros()[0]?.series.every((s) => !("rpe" in s))).toBe(true);
  });

  it("grava o RPE de cada série no registro", () => {
    abrir();
    topSet("100", "7", "RPE 8");
    topSet2("6", "RPE 9.5");
    salvar();
    expect(carregarRegistros()[0]?.series).toEqual([
      { tipo: "top1", kg: 100, reps: 7, rpe: 8 },
      { tipo: "top2", kg: 100, reps: 6, rpe: 9.5 },
    ]);
  });

  it("tocar no chip marcado desmarca", () => {
    abrir();
    marcar("Top Set 1", "RPE 8");
    expect(chip("Top Set 1", "RPE 8")).toHaveAttribute("aria-pressed", "true");
    marcar("Top Set 1", "RPE 8");
    expect(chip("Top Set 1", "RPE 8")).toHaveAttribute("aria-pressed", "false");
  });

  it("alterna para RIR em todas as séries, lembra a escolha e mantém o valor", () => {
    abrir();
    topSet("100", "7", "RPE 8");
    fireEvent.click(chip("Top Set 1", "Trocar para RIR"));
    expect(chip("Top Set 1", "RIR 2")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Top Set 2", "RIR 2")).toHaveAttribute("aria-pressed", "false");
    cleanup();
    abrir();
    expect(chip("Top Set 1", "RIR 2")).toHaveAttribute("aria-pressed", "true");
  });

  it("não vem preenchido do último treino, mas o painel mostra o RPE de lá", () => {
    historico(7, { topSetRpe: 8.5 });
    abrir();
    expect(grupo("Top Set 1").querySelector("[aria-pressed='true']")).toBeNull();
    expect(screen.getByTestId("ultimo-treino-detalhe")).toHaveTextContent("100kg × 7 reps · RPE 8.5");
  });

  it("volta do rascunho ao reabrir o app", () => {
    abrir();
    topSet("100", "7", "RPE 9");
    cleanup();
    abrir();
    expect(chip("Top Set 1", "RPE 9")).toHaveAttribute("aria-pressed", "true");
  });

  it("Cluster tem um RPE por série cluster", () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "Cluster Set" }));
    fireEvent.change(screen.getByLabelText(/Série 1 bloco 1 kg/), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Série 1 bloco 1 reps/), { target: { value: "4" } });
    marcar("Cluster Série 1", "RPE 9");
    fireEvent.click(screen.getByText(/Finalizar Série 1/));
    expect(grupo("Cluster Série 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Série 2 bloco 1 kg/), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Série 2 bloco 1 reps/), { target: { value: "3" } });
    marcar("Cluster Série 2", "RPE 10");
    fireEvent.click(screen.getByText("Confirmar Cluster"));
    salvar();
    expect(carregarRegistros()[0]?.series.map((s) => s.rpe)).toEqual([9, 10]);
  });

  it("a revisão mostra só as séries que serão gravadas (RG24)", () => {
    const cfg = JSON.parse(localStorage.getItem("sessoes_config")!);
    cfg["Upper A"][0].seriesValidas = 3;
    localStorage.setItem("sessoes_config", JSON.stringify(cfg));
    abrir();
    topSet("100", "7");
    topSet2("6");
    expect(screen.getByLabelText(/Back-off kg/)).toHaveValue(90); // sugerido, sem reps = não feito
    revisar();
    expect(screen.getByText("Top 1: 100kg × 7reps · Top 2: 100kg × 6reps")).toBeInTheDocument();
  });

  it("a revisão mostra o RPE na escala escolhida", () => {
    abrir();
    topSet("100", "7", "RPE 8");
    topSet2("6");
    revisar();
    expect(screen.getByText(/Top 1: 100kg × 7reps @ RPE 8 · Top 2: 100kg × 6reps/)).toBeInTheDocument();
  });

  describe("progressão pelo esforço", () => {
    it("teto com RPE abaixo de 8 manda subir", () => {
      abrir();
      topSet("100", "8", "RPE 7.5");
      expect(screen.getByText(/Teto atingido — sobe peso no próximo/)).toBeInTheDocument();
    });

    it("teto com RPE 8 ou mais pede para repetir a carga e não conta no resumo", () => {
      abrir();
      topSet("100", "8", "RPE 9");
      expect(screen.getByText(/Teto atingido com RPE 9 — repete a carga/)).toBeInTheDocument();
      topSet2("6");
      salvar();
      expect(screen.queryByText(/sobem de peso/)).not.toBeInTheDocument();
    });

    it("na abertura: banner de subir ou de consolidar conforme o RPE do último treino", () => {
      historico(7, { topSetReps: 8, topSetBateuTeto: true, topSetRpe: 7 });
      abrir();
      expect(screen.getByText(/SUBIR PESO HOJE/)).toBeInTheDocument();
      cleanup();
      planoDeUmExercicio();
      historico(7, { topSetReps: 8, topSetBateuTeto: true, topSetRpe: 9 });
      abrir();
      expect(screen.queryByText(/SUBIR PESO HOJE/)).not.toBeInTheDocument();
      expect(screen.getByText(/CONSOLIDAR CARGA/)).toHaveTextContent("RPE 9");
    });
  });

  describe("alerta de fadiga", () => {
    it("aparece quando a mesma carga custa RPE cada vez maior", () => {
      historico(15, { topSetRpe: 7 });
      historico(8, { topSetRpe: 8 });
      historico(1, { topSetRpe: 9 });
      abrir();
      expect(screen.getByTestId("alerta-fadiga")).toHaveTextContent(/100kg.*RPE 7.*RPE 9.*3 treinos/);
    });

    it("não aparece com RPE estável", () => {
      historico(15, { topSetRpe: 8 });
      historico(8, { topSetRpe: 8 });
      historico(1, { topSetRpe: 8 });
      abrir();
      expect(screen.queryByTestId("alerta-fadiga")).toBeNull();
    });
  });
});
