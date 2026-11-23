/**
 * CentralDeMensagens → components/mensagens (EF_09 RG3 a RG6)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { CentralDeMensagens } from "../../../components/mensagens/CentralDeMensagens";
import { mensagens } from "../../../components/mensagens/mensagens";

const avancar = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("CentralDeMensagens — avisos", () => {
  beforeEach(() => { vi.useFakeTimers(); render(<CentralDeMensagens />); });
  afterEach(() => vi.useRealTimers());

  it("sucesso some em 5 s", () => {
    act(() => mensagens.mostrar("treino_salvo"));
    expect(screen.getByRole("status")).toHaveTextContent("Treino finalizado!");
    avancar(4900);
    expect(screen.getByRole("status")).toBeInTheDocument();
    avancar(200);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("erro usa role=alert e fica até fechar", () => {
    act(() => mensagens.mostrar("armazenamento_cheio"));
    avancar(60000);
    fireEvent.click(within(screen.getByRole("alert")).getByLabelText("Fechar mensagem"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("repetir a mensagem reinicia o tempo", () => {
    act(() => mensagens.mostrar("treino_salvo"));
    avancar(4000);
    act(() => mensagens.mostrar("treino_salvo"));
    avancar(4000);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("mostra no máximo 3; a próxima entra quando uma sai", () => {
    act(() => (["A", "B", "C", "D"]).forEach((texto) => mensagens.mostrar("conquista_recorde", { texto })));
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(screen.queryByText("D")).toBeNull();
    fireEvent.click(screen.getAllByLabelText("Fechar mensagem")[0]!);
    expect(screen.getByText("D")).toBeInTheDocument();
  });
});

describe("CentralDeMensagens — confirmação", () => {
  const abrir = (itens?: string[]) => {
    const aoConfirmar = vi.fn(), aoCancelar = vi.fn();
    render(<CentralDeMensagens />);
    act(() => mensagens.confirmar("series_nao_feitas", { itens, aoConfirmar, aoCancelar }));
    return { aoConfirmar, aoCancelar, caixa: screen.getByRole("alertdialog") };
  };

  it("tem título e texto associados, lista os itens e foca no botão seguro", () => {
    const { caixa } = abrir(["Supino: Back-off"]);
    expect(caixa).toHaveAccessibleName("Há séries não feitas");
    expect(caixa).toHaveAccessibleDescription(/não entram no volume/);
    expect(caixa).toHaveTextContent("Supino: Back-off");
    expect(screen.getByText("Voltar e preencher")).toHaveFocus();
  });

  it("confirmar e fechar", () => {
    const { aoConfirmar } = abrir();
    fireEvent.click(screen.getByText("Salvar assim mesmo"));
    expect(aoConfirmar).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it.each([
    ["Esc", (c: HTMLElement) => fireEvent.keyDown(c, { key: "Escape" })],
    ["toque fora", (c: HTMLElement) => fireEvent.click(c.parentElement!)],
    ["botão seguro", () => fireEvent.click(screen.getByText("Voltar e preencher"))],
  ])("%s cancela", (_n, acao) => {
    const { caixa, aoConfirmar, aoCancelar } = abrir();
    acao(caixa);
    expect(aoCancelar).toHaveBeenCalledOnce();
    expect(aoConfirmar).not.toHaveBeenCalled();
  });

  it("o Tab não sai do diálogo", () => {
    const { caixa } = abrir();
    const [seguro, confirmar] = within(caixa).getAllByRole("button");
    confirmar!.focus();
    fireEvent.keyDown(caixa, { key: "Tab" });
    expect(seguro).toHaveFocus();
    fireEvent.keyDown(caixa, { key: "Tab", shiftKey: true });
    expect(confirmar).toHaveFocus();
  });
});
