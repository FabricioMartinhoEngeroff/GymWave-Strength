import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CycleInstruction } from "../../../components/cyclesCard/CycleInstruction";
import { setCurrentUser } from "../../../utils/storage";

describe("CycleInstruction", () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUser(null);
  });

  it("exibe a instrucao quando nao ha dados de C4 e usuario nao viu", () => {
    render(<CycleInstruction />);
    expect(screen.getByText(/registre primeiro/i)).toBeInTheDocument();
    expect(screen.getByText(/ciclo 4/i)).toBeInTheDocument();
  });

  it("exibe botao 'Ok, entendi'", () => {
    render(<CycleInstruction />);
    expect(screen.getByText("Ok, entendi")).toBeInTheDocument();
  });

  it("esconde a instrucao ao clicar em 'Ok, entendi'", () => {
    render(<CycleInstruction />);
    fireEvent.click(screen.getByText("Ok, entendi"));
    expect(screen.queryByText(/registre primeiro/i)).not.toBeInTheDocument();
  });

  it("salva instrucoesVistas no localStorage ao fechar", () => {
    render(<CycleInstruction />);
    fireEvent.click(screen.getByText("Ok, entendi"));
    expect(localStorage.getItem("instrucoesVistas")).toBe("true");
  });

  it("nao exibe a instrucao se instrucoesVistas ja esta salvo", () => {
    localStorage.setItem("instrucoesVistas", "true");
    render(<CycleInstruction />);
    expect(screen.queryByText(/registre primeiro/i)).not.toBeInTheDocument();
  });

  it("nao exibe a instrucao se ja existe dados no C4", () => {
    localStorage.setItem(
      "dadosTreino",
      JSON.stringify({
        "Supino reto barra": {
          C4: { pesos: ["100"], reps: ["7"], obs: "", data: "01/01/2026" },
        },
      })
    );
    render(<CycleInstruction />);
    expect(screen.queryByText(/registre primeiro/i)).not.toBeInTheDocument();
  });

  it("exibe a instrucao se C4 existe mas sem pesos", () => {
    localStorage.setItem(
      "dadosTreino",
      JSON.stringify({
        "Supino reto barra": {
          C4: { pesos: [], reps: [], obs: "", data: "01/01/2026" },
        },
      })
    );
    render(<CycleInstruction />);
    expect(screen.getByText(/registre primeiro/i)).toBeInTheDocument();
  });

  it("respeita o escopo do usuario para instrucoesVistas", () => {
    setCurrentUser("treino@gmail.com");
    localStorage.setItem("treino@gmail.com_instrucoesVistas", "true");
    render(<CycleInstruction />);
    expect(screen.queryByText(/registre primeiro/i)).not.toBeInTheDocument();
  });
});
