/**
 * ReportList → components/report — excluir pede confirmação (EF_05 RG5, EF_09)
 */
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ReportList } from "../../../components/report/ReportList";
import { dialogo, noDialogo, renderComMensagens } from "../mensagens/helpers";

const LINHA = { data: "01/10/2026", exercicio: "Supino", cicloKey: "UA", ciclo: "Upper A", series: [] };

function excluir() {
  const excluirLinha = vi.fn();
  renderComMensagens(<ReportList linhas={[LINHA]} salvarEdicao={vi.fn()} excluirLinha={excluirLinha} isMobile={false} />);
  fireEvent.click(screen.getByText("Excluir"));
  return excluirLinha;
}

describe("ReportList — excluir", () => {
  it("cancelar mantém o registro", () => {
    const fn = excluir();
    noDialogo("Cancelar");
    expect(fn).not.toHaveBeenCalled();
  });

  it("confirmar exclui e avisa", () => {
    const fn = excluir();
    expect(dialogo()).toHaveTextContent("Excluir registro?");
    noDialogo("Excluir");
    expect(fn).toHaveBeenCalledWith(0);
    expect(screen.getByText("Registro excluído")).toBeInTheDocument();
  });
});
