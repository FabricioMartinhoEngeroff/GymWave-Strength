import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { calcVolumeLoad, calcVolumeLoadPerWeek } from "../../utils/volumeLoadCalc";
import { agruparVolumePorPeriodo } from "../../utils/volumeBuckets";
import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";

const VOL = 100 * 7 + 85 * 12;

function treino(dataHora: string) {
  const ts = new Date(dataHora).getTime();
  const d = new Date(ts);
  const data = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return {
    exercicio: "Supino reto barra", treinoId: "UA", data, dataTs: ts,
    topSetKg: 100, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 9, topSetBateuTeto: false,
    backoffKg: 85, backoffReps: 12, backoffFaixaMin: 9, backoffFaixaMax: 15,
    seriesValidas: 2, progrediu: false,
  };
}

function logbook(...datas: string[]) {
  localStorage.setItem("logbook", JSON.stringify({ "Supino reto barra": datas.map(treino) }));
}

function hoje(dataHora: string) {
  vi.setSystemTime(new Date(dataHora));
}

const peito = (g: "week" | "month") => calcVolumeLoad(g).find((r) => r.musculo === "Peitoral");

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("Semana (segunda a domingo)", () => {
  it("treino de domingo 23:59 fecha a semana; o de segunda 00:00 já é a semana nova", () => {
    hoje("2026-10-26T08:00");
    logbook("2026-10-25T23:59", "2026-10-26T00:00");
    expect(peito("week")).toMatchObject({ volumeAtual: VOL, volumeAnterior: VOL, seriesAtual: 2 });
  });

  it("semana que cruza o mês conta inteira: 26/10 (seg) a 01/11 (dom)", () => {
    hoje("2026-11-01T20:00");
    logbook("2026-10-26T07:00", "2026-10-31T07:00", "2026-11-01T07:00");
    expect(peito("week")).toMatchObject({ volumeAtual: 3 * VOL, volumeAnterior: 0 });
  });

  it("na segunda seguinte a semana anterior fica fechada e a atual começa vazia", () => {
    hoje("2026-11-02T06:00");
    logbook("2026-10-26T07:00", "2026-11-01T07:00");
    expect(peito("week")).toMatchObject({ volumeAtual: 0, volumeAnterior: 2 * VOL, seriesAtual: 0 });
  });

  it("comparativo semanal: cada barra é uma semana seg–dom, a da virada do mês inteira", () => {
    hoje("2026-11-03T12:00");
    logbook("2026-10-25T07:00", "2026-10-26T07:00", "2026-11-01T07:00", "2026-11-02T07:00");
    const [p] = calcVolumeLoadPerWeek(3);
    expect(p?.semanas).toEqual([
      { label: "19/10", volume: VOL, series: 2 },
      { label: "26/10", volume: 2 * VOL, series: 4 },
      { label: "02/11", volume: VOL, series: 2 },
    ]);
  });
});

describe("Mês (dia 1 ao último dia)", () => {
  it("último dia do mês ainda conta no mês atual; dia 30 do mês anterior não", () => {
    hoje("2026-10-31T22:00");
    logbook("2026-09-30T23:59", "2026-10-01T00:00", "2026-10-31T21:00");
    expect(peito("month")).toMatchObject({ volumeAtual: 2 * VOL, volumeAnterior: VOL });
  });

  it("no dia 1 o mês anterior está fechado, mesmo no meio da mesma semana", () => {
    hoje("2026-11-01T20:00");
    logbook("2026-10-26T07:00", "2026-10-31T23:59", "2026-11-01T07:00");
    expect(peito("month")).toMatchObject({ volumeAtual: VOL, volumeAnterior: 2 * VOL });
    expect(peito("week")).toMatchObject({ volumeAtual: 3 * VOL });
  });

  it("em janeiro o mês anterior é dezembro do ano anterior", () => {
    hoje("2027-01-15T12:00");
    logbook("2026-11-30T12:00", "2026-12-01T00:00", "2026-12-31T23:59", "2027-01-01T00:00");
    expect(peito("month")).toMatchObject({ volumeAtual: VOL, volumeAnterior: 2 * VOL });
  });

  it("fevereiro fecha no dia 28", () => {
    hoje("2027-03-01T08:00");
    logbook("2027-02-28T23:59", "2027-03-01T00:00");
    expect(peito("month")).toMatchObject({ volumeAtual: VOL, volumeAnterior: VOL });
  });
});

describe("Gráfico de volume (baldes)", () => {
  const raw = (dataHora: string): RegistroGraficoRaw => ({
    data: "", dataTs: new Date(dataHora).getTime(), cicloId: "UA", pesos: [], topSet: 0, volumeLoad: 100,
  });
  const datas = ["2026-10-25T23:59", "2026-10-26T00:00", "2026-10-31T23:59", "2026-11-01T00:00", "2026-11-02T00:00"];

  it("semana: domingo fecha, segunda abre, e a semana da virada do mês fica inteira", () => {
    const b = agruparVolumePorPeriodo(datas.map(raw), "semana");
    expect(b.map((x) => [x.label, x.volume])).toEqual([
      ["19/10–25/10", 100],
      ["26/10–01/11", 300],
      ["02/11–08/11", 100],
    ]);
  });

  it("mês: fecha no último dia, mesmo no meio da semana", () => {
    const b = agruparVolumePorPeriodo(datas.map(raw), "mes");
    expect(b.map((x) => [x.label, x.volume])).toEqual([
      ["Out/26", 300],
      ["Nov/26", 200],
    ]);
  });
});
