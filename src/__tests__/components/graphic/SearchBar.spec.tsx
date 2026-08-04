import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../../../components/graphic/SearchBar";

describe("SearchBar (Graphic)", () => {
  it("renderiza input com placeholder", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Pesquisar exercício...")).toBeInTheDocument();
  });

  it("exibe o valor atual", () => {
    render(<SearchBar value="Supino" onChange={() => {}} />);
    expect(screen.getByDisplayValue("Supino")).toBeInTheDocument();
  });

  it("chama onChange ao digitar", () => {
    const handler = vi.fn();
    render(<SearchBar value="" onChange={handler} />);
    const input = screen.getByPlaceholderText("Pesquisar exercício...");
    fireEvent.change(input, { target: { value: "Agachamento" } });
    expect(handler).toHaveBeenCalledWith("Agachamento");
  });

  it("permite limpar o campo", () => {
    const handler = vi.fn();
    render(<SearchBar value="Supino" onChange={handler} />);
    const input = screen.getByDisplayValue("Supino");
    fireEvent.change(input, { target: { value: "" } });
    expect(handler).toHaveBeenCalledWith("");
  });
});
