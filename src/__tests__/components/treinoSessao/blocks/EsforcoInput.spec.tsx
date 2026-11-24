/**
 * EsforcoInput — chips de esforço da série — EF_02 RG20, RG27 e 4.8.1
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EsforcoInput } from "../../../../components/treinoSessao/blocks/EsforcoInput";
import type { EscalaEsforco } from "../../../../utils/esforco";

const AZUL = "rgb(37, 99, 235)"; // #2563eb
const BRANCO = "rgb(255, 255, 255)";
const onChange = vi.fn();
const chips = () => screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));

function abrir(escala: EscalaEsforco = "RPE", valor: number | null = null, aviso = false) {
  render(
    <EsforcoInput serie="Top Set 1" exercicio="Supino" valor={valor} onChange={onChange} escala={escala} onTrocarEscala={vi.fn()} aviso={aviso} />,
  );
}

describe("EsforcoInput", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["RPE", ["≤6", "7", "8", "9", "10"]],
    ["RIR", ["0", "1", "2", "3", "4+"]],
  ] as const)("%s mostra só 5 opções inteiras, na ordem", (escala, esperado) => {
    abrir(escala);
    expect(chips().map((c) => c.textContent)).toEqual(esperado);
  });

  it.each([["RIR 0", 10], ["RIR 1", 9], ["RIR 2", 8], ["RIR 3", 7], ["RIR 4+", 6]] as const)("%s grava RPE %s", (rotulo, rpe) => {
    abrir("RIR");
    fireEvent.click(screen.getByLabelText(rotulo));
    expect(onChange).toHaveBeenCalledWith(rpe);
  });

  describe("azul do sistema nas duas escalas", () => {
    it.each<[EscalaEsforco, number]>([
      ["RPE", 6], ["RPE", 7], ["RPE", 8], ["RPE", 9], ["RPE", 10], ["RIR", 6], ["RIR", 8], ["RIR", 10],
    ])("chip marcado em %s com RPE %s", (escala, rpe) => {
      abrir(escala, rpe);
      const marcado = chips().find((c) => c.getAttribute("aria-pressed") === "true");
      expect(marcado).toHaveStyle({ backgroundColor: AZUL, color: BRANCO });
    });

    it("chip não marcado continua branco", () => {
      abrir("RPE", 8);
      expect(screen.getByLabelText("RPE 9")).toHaveStyle({ backgroundColor: BRANCO });
    });

    it.each([["Trocar para RIR", "RPE"], ["Trocar para RPE", "RIR"], ["O que é RPE e RIR?", "RPE"]] as const)("botão %s", (nome, escala) => {
      abrir(escala);
      expect(screen.getByRole("button", { name: nome })).toHaveStyle({ backgroundColor: AZUL, color: BRANCO });
    });
  });

  describe("aviso de esforço obrigatório (RG27)", () => {
    const texto = /Marque o esforço desta série para avançar/;

    it("aparece quando a série foi feita e falta o esforço", () => {
      abrir("RPE", null, true);
      expect(screen.getByText(texto)).toBeInTheDocument();
    });

    it("não aparece sem o pedido de avançar", () => {
      abrir("RPE", null, false);
      expect(screen.queryByText(texto)).toBeNull();
    });
  });
});
