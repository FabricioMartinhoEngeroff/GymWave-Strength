/**
 * useEscalaEsforco → hook: escala preferida, guardada por usuário (EF_02 RG20).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useEscalaEsforco } from "../../../../components/treinoSessao/hooks/useEscalaEsforco";
import { setCurrentUser } from "../../../../utils/storage";

const abrir = () => renderHook(() => useEscalaEsforco()).result;

beforeEach(() => { localStorage.clear(); setCurrentUser(null); });
afterEach(() => { vi.restoreAllMocks(); setCurrentUser(null); });

describe("useEscalaEsforco", () => {
  it.each([[null, "RPE"], ["RPE", "RPE"], ["RIR", "RIR"], ["rir", "RPE"], ['"RIR"', "RPE"], ["", "RPE"], ["{", "RPE"]])(
    "guardado %j → %s", (guardado, esperada) => {
      if (guardado !== null) localStorage.setItem("escala_esforco", guardado);
      expect(abrir().current.escala).toBe(esperada);
      expect(localStorage.getItem("escala_esforco")).toBe(guardado); // abrir não grava
    },
  );

  it("alternar grava o texto cru e volta", () => {
    const r = abrir();
    act(() => r.current.alternarEscala());
    expect(r.current.escala).toBe("RIR");
    expect(localStorage.getItem("escala_esforco")).toBe("RIR");
    act(() => r.current.alternarEscala());
    expect(r.current.escala).toBe("RPE");
    expect(localStorage.getItem("escala_esforco")).toBe("RPE");
  });

  it("cada usuário tem a sua", () => {
    setCurrentUser("u1");
    const r = abrir();
    act(() => r.current.alternarEscala());
    expect(localStorage.getItem("gw:u1:escala_esforco")).toBe("RIR");
    expect(localStorage.getItem("escala_esforco")).toBeNull();
    setCurrentUser("u2");
    expect(abrir().current.escala).toBe("RPE");
  });

  it("falha ao gravar sobe e a escala da tela não muda", () => {
    const r = abrir();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("cheio", "QuotaExceededError"); });
    expect(() => act(() => r.current.alternarEscala())).toThrow("cheio");
    expect(r.current.escala).toBe("RPE");
  });
});
