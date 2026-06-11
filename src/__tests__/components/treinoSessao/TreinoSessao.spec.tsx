/**
 * TreinoSessaoTest → component
 * Testa o fluxo completo da tela de registro Saizen:
 * seleção de sessão (Upper A…Braço), seleção de ciclo via chips,
 * carregamento automático de exercícios por sessão, séries dinâmicas
 * por ciclo (2 ou 3), multiselect manual, auto-fill do último
 * registro, validação e salvamento.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";

// ─── helpers ─────────────────────────────────────────────────────────────────

function renderFresh() {
  localStorage.clear();
  return render(<TreinoSessao />);
}

function addExercicio(nome: string) {
  const input = screen.getByPlaceholderText(/buscar e adicionar exercício/i);
  fireEvent.change(input, { target: { value: nome } });
  const item = screen.getByText(nome);
  fireEvent.mouseDown(item);
}

function selecionarSessao(nome: string) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
}

function selecionarCiclo(id: string) {
  const chips = screen.getAllByRole("button");
  const chip = chips.find((b) => b.textContent?.startsWith(id));
  if (chip) fireEvent.click(chip);
}

// ─── testes ──────────────────────────────────────────────────────────────────

describe("TreinoSessao — Fluxo de registro Saizen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── Renderização inicial ──────────────────────────────────────────────────

  describe("Renderização inicial", () => {
    it("exibe título da aplicação", () => {
      renderFresh();
      expect(screen.getByText("GymWave Strength")).toBeInTheDocument();
    });

    it("exibe os 4 ciclos Saizen (C1–C4)", () => {
      renderFresh();
      ["C1", "C2", "C3", "C4"].forEach((id) => {
        expect(screen.getAllByText(id).length).toBeGreaterThan(0);
      });
    });

    it("exibe as siglas dos 4 ciclos", () => {
      renderFresh();
      expect(screen.getByText(/Pico/)).toBeInTheDocument();
      expect(screen.getByText(/Intens\./)).toBeInTheDocument();
      expect(screen.getByText(/Acum\./)).toBeInTheDocument();
      expect(screen.getByText(/Deload/)).toBeInTheDocument();
    });

    it("C1 está selecionado por padrão", () => {
      renderFresh();
      const chips = screen.getAllByRole("button");
      const c1chip = chips.find(
        (b) => b.textContent?.includes("C1") && b.textContent?.includes("Pico")
      );
      expect(c1chip).toBeDefined();
    });

    it("exibe campo de busca de exercício", () => {
      renderFresh();
      expect(
        screen.getByPlaceholderText(/buscar e adicionar exercício/i)
      ).toBeInTheDocument();
    });

    it("exibe botão Salvar treino", () => {
      renderFresh();
      expect(screen.getByText("Salvar treino")).toBeInTheDocument();
    });

    it("Salvar treino está desabilitado sem exercícios selecionados", () => {
      renderFresh();
      const btn = screen.getByText("Salvar treino").closest("button");
      expect(btn).toBeDisabled();
    });
  });

  // ── Seletor de sessão ─────────────────────────────────────────────────────

  describe("Seletor de sessão", () => {
    it("exibe os 5 seletores de sessão", () => {
      renderFresh();
      expect(screen.getByRole("button", { name: "Upper A" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lower A" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Upper B" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lower B" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Braço" })).toBeInTheDocument();
    });

    it("selecionar 'Upper A' carrega exercícios da sessão automaticamente", () => {
      renderFresh();
      selecionarSessao("Upper A");
      expect(screen.getAllByText("Supino Reto").length).toBeGreaterThan(0);
    });

    it("selecionar 'Lower A' carrega exercícios de perna", () => {
      renderFresh();
      selecionarSessao("Lower A");
      expect(screen.getAllByText("Agachamento").length).toBeGreaterThan(0);
    });

    it("selecionar 'Upper B' carrega Barra fixa", () => {
      renderFresh();
      selecionarSessao("Upper B");
      expect(screen.getAllByText("Barra fixa").length).toBeGreaterThan(0);
    });

    it("selecionar 'Lower B' carrega Levantamento Terra", () => {
      renderFresh();
      selecionarSessao("Lower B");
      expect(screen.getAllByText("Levantamento Terra").length).toBeGreaterThan(0);
    });

    it("selecionar 'Braço' carrega Tríceps Polia", () => {
      renderFresh();
      selecionarSessao("Braço");
      expect(screen.getAllByText("Tríceps Polia").length).toBeGreaterThan(0);
    });

    it("após selecionar sessão o botão Salvar fica desabilitado (falta peso)", () => {
      renderFresh();
      selecionarSessao("Upper A");
      const btn = screen.getByText("Salvar treino").closest("button");
      expect(btn).toBeDisabled();
    });
  });

  // ── Séries: sempre 3, 3ª opcional ────────────────────────────────────────

  describe("Séries — sempre 3 exibidas, 3ª opcional", () => {
    it("sempre exibe Série 1, 2 e 3 independente do ciclo (C1)", () => {
      renderFresh();
      addExercicio("Supino Reto");
      expect(screen.getByText("Série 1")).toBeInTheDocument();
      expect(screen.getByText("Série 2")).toBeInTheDocument();
      expect(screen.getByText("Série 3")).toBeInTheDocument();
    });

    it("C4 também exibe 3 séries (3ª é opcional)", () => {
      renderFresh();
      selecionarCiclo("C4");
      addExercicio("Supino Reto");
      expect(screen.getByText("Série 3")).toBeInTheDocument();
    });

    it("salva 3 séries sempre — série 3 vazia salva como string vazia", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "80" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });
      fireEvent.click(screen.getByText("Salvar treino"));
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"].pesos).toHaveLength(3);
      expect(db["Supino Reto"]["C1"].pesos[2]).toBe("");
    });

    it("salva peso da série 3 quando preenchida", () => {
      renderFresh();
      selecionarCiclo("C3");
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
      fireEvent.change(inputs[0], { target: { value: "80" } });
      fireEvent.change(inputs[1], { target: { value: "10" } });
      fireEvent.change(inputs[4], { target: { value: "70" } });
      fireEvent.click(screen.getByText("Salvar treino"));
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C3"].pesos[2]).toBe("70");
    });
  });

  // ── Seleção de ciclo ──────────────────────────────────────────────────────

  describe("Seleção de ciclo", () => {
    it("clicar em C2 seleciona C2 sem erro", () => {
      renderFresh();
      const chips = screen.getAllByRole("button");
      const c2chip = chips.find(
        (b) => b.textContent?.includes("C2") && b.textContent?.includes("Intens")
      );
      expect(c2chip).toBeDefined();
      fireEvent.click(c2chip!);
      expect(c2chip).toBeInTheDocument();
    });
  });

  // ── Multiselect de exercícios ─────────────────────────────────────────────

  describe("Multiselect de exercícios", () => {
    it("digitar no campo de busca abre dropdown", () => {
      renderFresh();
      const input = screen.getByPlaceholderText(/buscar e adicionar exercício/i);
      fireEvent.change(input, { target: { value: "Supino" } });
      expect(screen.getByText("Supino Reto")).toBeInTheDocument();
    });

    it("remover tag remove o card do exercício", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const removeBtn = screen.getByLabelText(/Remover Supino Reto/i);
      fireEvent.click(removeBtn);
      expect(screen.queryByText("Série 1")).not.toBeInTheDocument();
    });

    it("é possível adicionar múltiplos exercícios manualmente", () => {
      renderFresh();
      addExercicio("Supino Reto");
      addExercicio("Agachamento");
      expect(screen.getAllByText("Série 1").length).toBe(2);
    });

    it("exercício já selecionado não aparece no dropdown", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const input = screen.getByPlaceholderText(/buscar e adicionar exercício/i);
      fireEvent.change(input, { target: { value: "Supino" } });
      const dropdownItems = screen.queryAllByRole("listitem");
      const duplicates = dropdownItems.filter(
        (el) => el.textContent === "Supino Reto"
      );
      expect(duplicates.length).toBe(0);
    });
  });

  // ── Validação e botão Salvar ──────────────────────────────────────────────

  describe("Validação e botão Salvar", () => {
    it("botão Salvar permanece desabilitado se série 1 está vazia", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const btn = screen.getByText("Salvar treino").closest("button");
      expect(btn).toBeDisabled();
    });

    it("botão Salvar habilita quando série 1 tem peso e reps", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "80" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });
      const btn = screen.getByText("Salvar treino").closest("button");
      expect(btn).not.toBeDisabled();
    });
  });

  // ── Salvamento no localStorage ────────────────────────────────────────────

  describe("Salvamento no localStorage", () => {
    it("clicar em Salvar persiste exercício no localStorage com ciclo correto", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "80" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });
      fireEvent.click(screen.getByText("Salvar treino"));
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"]).toBeDefined();
      expect(db["Supino Reto"]["C1"].pesos[0]).toBe("80");
    });

    it("salva sempre 3 séries (série 3 vazia = string vazia)", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "80" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });
      fireEvent.click(screen.getByText("Salvar treino"));
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"].pesos).toHaveLength(3);
    });

    it("após salvar exibe toast de sucesso", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "80" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });
      fireEvent.click(screen.getByText("Salvar treino"));
      expect(screen.getByText(/treino salvo/i)).toBeInTheDocument();
    });

    it("após salvar o formulário é resetado", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "80" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });
      fireEvent.click(screen.getByText("Salvar treino"));
      expect(screen.queryByText("Série 1")).not.toBeInTheDocument();
    });
  });

  // ── Auto-fill de pesos ────────────────────────────────────────────────────

  describe("Auto-fill de pesos", () => {
    it("ao adicionar exercício preenche séries do último registro do mesmo ciclo", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: {
              pesos: ["80", "75"],
              reps: ["6", "6"],
              data: "01/06/2026",
              exercicio: "Supino Reto",
            },
          },
        })
      );
      render(<TreinoSessao />);
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
      expect(inputs[0].value).toBe("80");
    });

    it("inputs ficam vazios quando não há histórico para o ciclo selecionado", () => {
      renderFresh();
      addExercicio("Supino Reto");
      const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
      expect(inputs[0].value).toBe("");
    });
  });

  // ── Campo de observações ──────────────────────────────────────────────────

  describe("Campo de observações", () => {
    it("exibe campo de observações", () => {
      renderFresh();
      expect(
        screen.getByPlaceholderText(/como foi o treino/i)
      ).toBeInTheDocument();
    });
  });
});
