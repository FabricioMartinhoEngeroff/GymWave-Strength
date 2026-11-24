/**
 * datas → utils
 * Regra única de data do sistema (INDICE "Formato de Data").
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dataBRparaDate,
  dataBRparaISO,
  dataISOparaBR,
  diasDesde,
  formatarBR,
  hojeBR,
  parseDataBR,
  parseDataISO,
} from "../../utils/datas";
import { productionFiles, read, rel } from "../components/login/helpers/files";

const ts = (ano: number, mes: number, dia: number) => new Date(ano, mes - 1, dia).getTime();

const INVALIDAS = [
  "", " ", "abc", "15/06", "15062026", "04/11/26", "04/11/02026", "04-11-2026", "2026-11-04", "04/11/2026x", "1/1/1/2026",
  "31/02/2026", "29/02/2025", "31/04/2026", "00/11/2026", "04/00/2026", "04/13/2026", "32/01/2026", "-4/11/2026", "04/11/0026",
];

describe("parseDataBR", () => {
  it.each([
    ["04/11/2026", ts(2026, 11, 4)],
    ["4/1/2026", ts(2026, 1, 4)],
    [" 04/11/2026 ", ts(2026, 11, 4)],
    ["29/02/2024", ts(2024, 2, 29)],
    ["31/12/2025", ts(2025, 12, 31)],
  ])("%j → meia-noite local do dia", (data, esperado) => {
    expect(parseDataBR(data)).toBe(esperado);
  });

  it.each(INVALIDAS)("%j → null (nunca vira hoje nem outro dia)", (data) => {
    expect(parseDataBR(data)).toBeNull();
  });
});

describe("dataBRparaDate (calendário)", () => {
  it("devolve o Date do dia", () => {
    expect(dataBRparaDate("15/06/2026")).toEqual(new Date(2026, 5, 15));
  });

  it.each(INVALIDAS)("%j → null", (data) => {
    expect(dataBRparaDate(data)).toBeNull();
  });
});

describe("parseDataISO", () => {
  it("AAAA-MM-DD → meia-noite local", () => {
    expect(parseDataISO("2026-11-04")).toBe(ts(2026, 11, 4));
  });

  it.each(["", "abc", "26-11-04", "2026-02-31", "2026-13-01", "2026-11-4", "04/11/2026", "2026-11-04T10:00"])("%j → null", (data) => {
    expect(parseDataISO(data)).toBeNull();
  });
});

describe("formatarBR", () => {
  it.each([
    [new Date(2026, 5, 15).getTime(), "15/06/2026"],
    [new Date(2026, 0, 5).getTime(), "05/01/2026"],
    [new Date(2025, 11, 31, 23, 59).getTime(), "31/12/2025"],
  ])("%i → %s", (valor, esperado) => {
    expect(formatarBR(valor)).toBe(esperado);
  });

  it("ida e volta preserva a data", () => {
    expect(formatarBR(parseDataBR("10/03/2026")!)).toBe("10/03/2026");
  });
});

describe("hojeBR e diasDesde", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 23, 30));
  });
  afterEach(() => vi.useRealTimers());

  it("hojeBR é o dia local, mesmo tarde da noite", () => {
    expect(hojeBR()).toBe("04/11/2026");
  });

  it("diasDesde conta dias inteiros", () => {
    expect(diasDesde(ts(2026, 11, 4))).toBe(0);
    expect(diasDesde(ts(2026, 10, 29))).toBe(6);
  });
});

describe("BR ↔ ISO (só muda a escrita; o que não entende volta igual, para não perder o dado)", () => {
  it.each([["13/10/2026", "2026-10-13"], ["3/1/2026", "2026-01-03"], ["2026-10-13", "2026-10-13"], ["abc", "abc"], ["", ""]])(
    "dataBRparaISO %j → %j", (data, esperado) => {
      expect(dataBRparaISO(data)).toBe(esperado);
    });

  it.each([["2026-10-13", "13/10/2026"], ["abc", "abc"], ["", ""]])("dataISOparaBR %j → %j", (data, esperado) => {
    expect(dataISOparaBR(data)).toBe(esperado);
  });
});

describe("um lugar só — regressão estática", () => {
  const fora = (padrao: RegExp) =>
    productionFiles().filter((f) => !rel(f).endsWith("utils/datas.ts") && padrao.test(read(f))).map(rel);

  it("ninguém quebra data por conta própria", () => {
    expect(fora(/\.split\(\s*["'`][/-]["'`]\s*\)/)).toEqual([]);
  });

  it("ninguém monta DD/MM/AAAA por conta própria", () => {
    expect(fora(/toLocaleDateString\(\s*["'`]pt-BR["'`]\s*\)/)).toEqual([]);
  });
});
