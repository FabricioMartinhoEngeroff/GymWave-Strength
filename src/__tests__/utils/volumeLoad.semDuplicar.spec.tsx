/**
 * Volume Load — regressões da contagem por semana.
 * 1) Salvar treino grava o mesmo treino em "registros" e em "dadosTreino": a aba
 *    Volume tem que contar uma vez só (antes a semana atual saía em dobro).
 * 2) Exercício com nome escrito diferente do mapa muscular (maiúscula, acento,
 *    hífen) tem que cair no grupo certo, senão some do volume.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../components/treinoSessao/TreinoSessao";
import { grupoMuscular } from "../../data/muscleMap";
import { carregarDados, salvarDados, salvarRegistro } from "../../utils/storage";
import { calcQuedaCargaMusculo, calcVolumeLoad, calcVolumeLoadPerWeek } from "../../utils/volumeLoadCalc";
import type { RegistroExercicio } from "../../types/TrainingData";

// Quarta-feira 10/06/2026 · semana atual 08/06–14/06 · semana anterior 01/06–07/06
const HOJE = new Date("2026-06-10T12:00:00");

const dia = (iso: string) => new Date(`${iso}T12:00:00`);
const br = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

/** Grava como o "Confirmar e Salvar Treino": registro novo + resumo em dadosTreino. */
function salvarComoATela(exercicio: string, treinoId: string, iso: string, kg: number, reps: number[]) {
  const d = dia(iso);
  const registro: RegistroExercicio = {
    exercicio, treinoId, data: br(d), dataTs: d.getTime(),
    topSetKg: kg, topSetReps: reps[0] ?? 0, topSetFaixaMin: 6, topSetFaixaMax: 12, topSetBateuTeto: false,
    backoffKg: reps.length > 1 ? kg : 0, backoffReps: reps[1] ?? 0, backoffFaixaMin: 6, backoffFaixaMax: 12,
    seriesValidas: reps.length > 1 ? 2 : 1, progrediu: false,
  };
  salvarRegistro(registro);
  const db = carregarDados();
  db[exercicio] = {
    ...db[exercicio],
    [treinoId]: { data: br(d), pesos: reps.map(() => String(kg)), reps: reps.map(String), obs: "", exercicio },
  };
  salvarDados(db);
}

const grupo = (musculo: string) => calcVolumeLoad().find((m) => m.musculo === musculo);
const semanas = (musculo: string) => calcVolumeLoadPerWeek(2).find((m) => m.musculo === musculo);

describe("Volume Load — cada treino conta uma vez só", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(HOJE);
  });
  afterEach(() => vi.useRealTimers());

  it("treino salvo em registros e em dadosTreino não é somado em dobro", () => {
    salvarComoATela("Elevação lateral livre", "UA", "2026-06-08", 10, [10, 10]);
    expect(grupo("Ombro")).toMatchObject({ volumeAtual: 200, seriesAtual: 2 });
    expect(semanas("Ombro")?.semanas.at(-1)).toMatchObject({ volume: 200, series: 2 });
  });

  it("+1 repetição no ombro: 400 → 410 (+3%), não 400 → 820", () => {
    // semana passada: Upper A (seg) e Upper B (qui)
    salvarComoATela("Elevação lateral livre", "UA", "2026-06-01", 10, [10, 10]);
    salvarComoATela("Elevação lateral livre", "UB", "2026-06-04", 10, [10, 10]);
    // esta semana: +1 rep no Top Set 1 da Upper A
    salvarComoATela("Elevação lateral livre", "UA", "2026-06-08", 10, [11, 10]);
    salvarComoATela("Elevação lateral livre", "UB", "2026-06-09", 10, [10, 10]);

    expect(grupo("Ombro")).toMatchObject({ volumeAtual: 410, volumeAnterior: 400, delta: 3, seriesAtual: 4 });
    const ombro = semanas("Ombro")!;
    expect(ombro.semanas.map((s) => s.volume)).toEqual([400, 410]);
    expect(ombro.semanas.map((s) => s.series)).toEqual([4, 4]);
    expect(ombro.delta).toBe(3);
  });

  it("os 4 treinos da semana somam cada exercício no seu grupo", () => {
    salvarComoATela("Supino reto barra", "UA", "2026-06-08", 100, [8, 8]); // 1600 Peitoral
    salvarComoATela("Elevação lateral livre", "UA", "2026-06-08", 10, [12, 12]); // 240 Ombro
    salvarComoATela("Elevação lateral livre", "UB", "2026-06-11", 10, [12, 12]); // 240 Ombro
    salvarComoATela("Terra sumô", "LA", "2026-06-09", 140, [5, 5]); // 1400 Posterior/Glúteo
    salvarComoATela("Cadeira extensora", "LB", "2026-06-12", 50, [10, 10]); // 1000 Quadríceps

    expect(grupo("Peitoral")?.volumeAtual).toBe(1600);
    expect(grupo("Ombro")?.volumeAtual).toBe(480);
    expect(grupo("Posterior/Glúteo")?.volumeAtual).toBe(1400);
    expect(grupo("Quadríceps")?.volumeAtual).toBe(1000);
  });

  it("histórico antigo só em dadosTreino (sem registro) continua contando", () => {
    salvarDados({
      "Supino reto barra": { C1: { data: "09/06/2026", pesos: ["100"], reps: ["5"], obs: "", exercicio: "Supino reto barra" } },
    });
    expect(grupo("Peitoral")?.volumeAtual).toBe(500);
  });

  it("dadosTreino de outra data que o registro é outro treino: soma os dois", () => {
    salvarRegistro({
      exercicio: "Supino reto barra", treinoId: "UA", data: "10/06/2026", dataTs: dia("2026-06-10").getTime(),
      topSetKg: 100, topSetReps: 5, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
      backoffKg: 0, backoffReps: 0, backoffFaixaMin: 0, backoffFaixaMax: 0, seriesValidas: 1, progrediu: false,
    });
    salvarDados({
      "Supino reto barra": { UA: { data: "08/06/2026", pesos: ["100"], reps: ["5"], obs: "", exercicio: "Supino reto barra" } },
    });
    expect(grupo("Peitoral")?.volumeAtual).toBe(1000);
  });

  it("salvando pela tela de treino, o volume da semana é o do treino feito (1×)", () => {
    localStorage.setItem("sessoes_config", JSON.stringify({
      "S1 Seg · Pull": [{
        nome: "Puxador frente pegada neutra", grupo: "Costas", faixaTopSet: [6, 12], faixaBackoff: [6, 12],
        backoffPct: 0.9, seriesValidas: 1, tecnica: null, cue: "",
      }],
    }));
    render(<TreinoSessao />);
    fireEvent.click(screen.getByRole("button", { name: "S1 Seg · Pull" }));
    fireEvent.change(screen.getByLabelText(/Top Set 1 kg/i), { target: { value: "70" } });
    fireEvent.change(screen.getByLabelText(/Top Set 1 reps/i), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Confirmar Top Set 1"));
    fireEvent.click(screen.getByText("Ver Resumo"));
    fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));

    expect(grupo("Costas")).toMatchObject({ volumeAtual: 700, seriesAtual: 1 });
  }, 15_000); // renderiza a tela inteira; com a suíte toda rodando passa de 5 s
});

describe("grupoMuscular — nome escrito diferente cai no grupo certo", () => {
  it.each([
    ["Pull down", "Costas"],
    ["Pull-down", "Costas"],
    ["Tríceps francês", "Braço"],
    ["Triceps Frances", "Braço"],
    ["Prancha", "Core"],
    ["Abdominal pendurado na barra", "Core"],
    ["  elevação LATERAL livre ", "Ombro"],
  ])("%s → %s", (nome, esperado) => {
    expect(grupoMuscular(nome)).toBe(esperado);
  });

  it("nome desconhecido → undefined", () => {
    expect(grupoMuscular("Exercício inventado")).toBeUndefined();
  });

  describe("no cálculo do volume", () => {
    beforeEach(() => {
      localStorage.clear();
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(HOJE);
    });
    afterEach(() => vi.useRealTimers());

    it("exercícios da planilha v8 sem grupo exato entram no volume", () => {
      salvarComoATela("Pull down", "UA", "2026-06-08", 60, [10, 10]); // 1200 Costas
      salvarComoATela("Tríceps francês", "UA", "2026-06-08", 20, [10, 10]); // 400 Braço
      salvarComoATela("Abdominal pendurado na barra", "LA", "2026-06-09", 0.5, [15, 15]); // 15 Core
      expect(grupo("Costas")?.volumeAtual).toBe(1200);
      expect(grupo("Braço")?.volumeAtual).toBe(400);
      expect(grupo("Core")?.volumeAtual).toBe(15);
    });

    it("alerta de queda de carga reconhece o grupo pelo nome escrito diferente", () => {
      salvarComoATela("Tríceps francês", "UA", "2026-06-01", 20, [10, 10]);
      salvarComoATela("Pull down", "UA", "2026-06-01", 60, [10, 10]);
      salvarComoATela("Tríceps francês", "UA", "2026-06-08", 20, [8, 8]);
      salvarComoATela("Pull down", "UA", "2026-06-08", 60, [8, 8]);
      salvarComoATela("Francês corda", "UB", "2026-06-02", 20, [10, 10]);
      salvarComoATela("Francês corda", "UB", "2026-06-09", 20, [8, 8]);
      expect(calcQuedaCargaMusculo("Braço")).toBe(true);
    });
  });
});
