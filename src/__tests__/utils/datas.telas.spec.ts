/**
 * Data inválida se comporta igual em todas as telas (INDICE "Formato de Data").
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDadosTreino } from "../../hooks/useDadosTreino";
import { useRelatorio } from "../../hooks/useRelatorio";
import { calcVolumeLoad, calcVolumeLoadPerWeek } from "../../utils/volumeLoadCalc";
import { computeSessionPoint } from "../../utils/workoutMetrics";
import { carregarRegistros } from "../../utils/storage";
import { deRegistro, type Registro } from "../../utils/registros";

const EX = "Elevação lateral livre";
const linha = (data: string) => ({ data, pesos: ["10"], reps: ["10"], obs: "", exercicio: EX });
const legado = (...datas: string[]) =>
  localStorage.setItem("dadosTreino", JSON.stringify({ [EX]: Object.fromEntries(datas.map((d, i) => [`S${i}`, linha(d)])) }));
const registro = (data: string): Registro => ({
  id: `${data}_UA`, data, sessao: "UA", exercicio: "elevacao-lateral-livre", nome: EX, series: [{ tipo: "top1", kg: 10, reps: 10 }],
});

const grafico = () => Object.values(renderHook(() => useDadosTreino()).result.current).flat().map((p) => p.data);
const volume = () => calcVolumeLoad().find((m) => m.musculo === "Ombro")?.volumeAtual ?? 0;
const volumeSemanas = () =>
  calcVolumeLoadPerWeek(4).find((m) => m.musculo === "Ombro")?.semanas.reduce((t, s) => t + s.volume, 0) ?? 0;

describe("data inválida igual em todas as telas", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 2, 4, 12)); // 04/03/2026: 31/02 viraria 03/03, nesta semana
  });
  afterEach(() => vi.useRealTimers());

  it("data válida entra no gráfico e no volume (controle)", () => {
    legado("3/3/2026");
    expect(grafico()).toEqual(["03/03/2026"]);
    expect(volume()).toBe(100);
    expect(volumeSemanas()).toBe(100);
  });

  it.each(["31/02/2026", "03/03/26", "abc", "03-03-2026"])("%j no dadosTreino fica fora do gráfico e do volume", (data) => {
    legado(data);
    expect(grafico()).toEqual([]);
    expect(volume()).toBe(0);
    expect(volumeSemanas()).toBe(0);
    expect(computeSessionPoint(EX, linha(data))).toBeNull();
  });

  it("2026-02-31 no histórico fica fora do gráfico e do volume, sem ser apagado", () => {
    localStorage.setItem("registros", JSON.stringify([registro("2026-02-31")]));
    expect(grafico()).toEqual([]);
    expect(volume()).toBe(0);
    expect(volumeSemanas()).toBe(0);
    expect(deRegistro(registro("2026-02-31")).dataTs).toBe(0);
    expect(carregarRegistros()).toHaveLength(1);
  });

  it("nos Relatórios fica no fim, em qualquer período", () => {
    legado("abc", "01/03/2026", "31/02/2026", "3/3/2026", "02/03/2026");
    const { result } = renderHook(() => useRelatorio());
    expect(result.current.linhas.map((l) => l.data)).toEqual(["3/3/2026", "02/03/2026", "01/03/2026", "abc", "31/02/2026"]);
    act(() => result.current.setIntervalo("1M"));
    expect(result.current.linhasFiltradas.map((l) => l.data)).toEqual(["3/3/2026", "02/03/2026", "01/03/2026", "abc", "31/02/2026"]);
  });
});
