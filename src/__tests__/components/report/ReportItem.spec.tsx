import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReportItem } from "../../../components/report/ReportItem";

const mockLinha = {
  data: "10/06/2026",
  exercicio: "Supino Reto",
  ciclo: "C1",
  series: [
    { serie: 1, rep: "5", peso: "100" },
    { serie: 2, rep: "8", peso: "90" },
  ],
  obs: "",
};

describe("ReportItem — Card de relatório individual", () => {
  it("renderiza data, exercício e ciclo", () => {
    render(
      <ReportItem linha={mockLinha} onEdit={() => {}} onDelete={() => {}} isMobile={false} />
    );
    expect(screen.getByText("10/06/2026")).toBeInTheDocument();
    expect(screen.getByText("Supino Reto")).toBeInTheDocument();
    expect(screen.getByText("C1")).toBeInTheDocument();
  });

  it("renderiza todas as séries", () => {
    render(
      <ReportItem linha={mockLinha} onEdit={() => {}} onDelete={() => {}} isMobile={false} />
    );
    expect(screen.getByText("Série 1")).toBeInTheDocument();
    expect(screen.getByText("Série 2")).toBeInTheDocument();
    expect(screen.getByText("5 reps × 100 kg")).toBeInTheDocument();
    expect(screen.getByText("8 reps × 90 kg")).toBeInTheDocument();
  });

  it("não renderiza observações quando vazio", () => {
    render(
      <ReportItem linha={mockLinha} onEdit={() => {}} onDelete={() => {}} isMobile={false} />
    );
    expect(screen.queryByText("Observações:")).toBeNull();
  });

  it("renderiza observações quando preenchido", () => {
    const linhaComObs = { ...mockLinha, obs: "Joelho travando" };
    render(
      <ReportItem linha={linhaComObs} onEdit={() => {}} onDelete={() => {}} isMobile={false} />
    );
    expect(screen.getByText("Joelho travando")).toBeInTheDocument();
  });

  it("chama onEdit ao clicar em Editar", () => {
    const onEdit = vi.fn();
    render(
      <ReportItem linha={mockLinha} onEdit={onEdit} onDelete={() => {}} isMobile={false} />
    );
    fireEvent.click(screen.getByText("Editar"));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("chama onDelete ao clicar em Excluir", () => {
    const onDelete = vi.fn();
    render(
      <ReportItem linha={mockLinha} onEdit={() => {}} onDelete={onDelete} isMobile={false} />
    );
    fireEvent.click(screen.getByText("Excluir"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renderiza botões Editar e Excluir", () => {
    render(
      <ReportItem linha={mockLinha} onEdit={() => {}} onDelete={() => {}} isMobile={false} />
    );
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Excluir")).toBeInTheDocument();
  });
});
