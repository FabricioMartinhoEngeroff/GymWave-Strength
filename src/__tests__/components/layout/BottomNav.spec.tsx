/**
 * BottomNavTest → component
 * Testa navegação, destaque de tab ativa e callbacks.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BottomNav, { type Tab } from "../../../components/layout/BottomNav";

describe("BottomNav — Navegação por tabs", () => {
  describe("Renderização", () => {
    it("exibe os 5 itens de navegação", () => {
      render(<BottomNav active="registrar" onChange={vi.fn()} />);
      expect(screen.getByText("Registrar")).toBeInTheDocument();
      expect(screen.getByText("Gráficos")).toBeInTheDocument();
      expect(screen.getByText("Volume")).toBeInTheDocument();
      expect(screen.getByText("Relatórios")).toBeInTheDocument();
      expect(screen.getByText("Exportar")).toBeInTheDocument();
    });

    it("renderiza a nav com aria-label correto", () => {
      render(<BottomNav active="registrar" onChange={vi.fn()} />);
      expect(
        screen.getByRole("navigation", { name: /navegação principal/i })
      ).toBeInTheDocument();
    });
  });

  describe("Tab ativa", () => {
    const TABS: Tab[] = [
      "registrar",
      "graficos",
      "volume",
      "relatorio",
      "exportar",
    ];

    TABS.forEach((tab) => {
      it(`renderiza sem erro com tab "${tab}" ativa`, () => {
        expect(() =>
          render(<BottomNav active={tab} onChange={vi.fn()} />)
        ).not.toThrow();
      });
    });
  });

  describe("Interação — onChange", () => {
    it("chama onChange com 'graficos' ao clicar em Gráficos", () => {
      const onChange = vi.fn();
      render(<BottomNav active="registrar" onChange={onChange} />);
      fireEvent.click(screen.getByText("Gráficos").closest("button")!);
      expect(onChange).toHaveBeenCalledWith("graficos");
    });

    it("chama onChange com 'volume' ao clicar em Volume", () => {
      const onChange = vi.fn();
      render(<BottomNav active="registrar" onChange={onChange} />);
      fireEvent.click(screen.getByText("Volume").closest("button")!);
      expect(onChange).toHaveBeenCalledWith("volume");
    });

    it("chama onChange com 'relatorio' ao clicar em Relatórios", () => {
      const onChange = vi.fn();
      render(<BottomNav active="registrar" onChange={onChange} />);
      fireEvent.click(screen.getByText("Relatórios").closest("button")!);
      expect(onChange).toHaveBeenCalledWith("relatorio");
    });

    it("chama onChange com 'exportar' ao clicar em Exportar", () => {
      const onChange = vi.fn();
      render(<BottomNav active="registrar" onChange={onChange} />);
      fireEvent.click(screen.getByText("Exportar").closest("button")!);
      expect(onChange).toHaveBeenCalledWith("exportar");
    });

    it("chama onChange com 'registrar' ao clicar em Registrar", () => {
      const onChange = vi.fn();
      render(<BottomNav active="graficos" onChange={onChange} />);
      fireEvent.click(screen.getByText("Registrar").closest("button")!);
      expect(onChange).toHaveBeenCalledWith("registrar");
    });

    it("onChange é chamado exatamente uma vez por clique", () => {
      const onChange = vi.fn();
      render(<BottomNav active="registrar" onChange={onChange} />);
      fireEvent.click(screen.getByText("Volume").closest("button")!);
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });
});
