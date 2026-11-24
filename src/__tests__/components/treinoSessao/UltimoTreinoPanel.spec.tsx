/**
 * UltimoTreinoPanel → components/treinoSessao
 * Card "Último treino" com os avisos dentro (EF_02 RG17 e RG29).
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { UltimoTreinoPanel } from "../../../components/treinoSessao/UltimoTreinoPanel";
import type { AvisoTreino } from "../../../components/treinoSessao/domain/avisosTreino";
import type { RegistroExercicio } from "../../../types/TrainingData";

const ULTIMO: RegistroExercicio = {
  exercicio: "Supino reto barra", treinoId: "UA", data: "01/10/2026", dataTs: 0,
  topSetKg: 40, topSetReps: 8, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: true, topSetRpe: 8,
  backoffKg: 40, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
  seriesValidas: 2, progrediu: false, obs: "ombro ok",
};
const SUBIR: AvisoTreino = { tipo: "subir", tom: "verde", marca: "↑", texto: "Aviso de subir." };
const FADIGA: AvisoTreino = { tipo: "fadiga", tom: "ambar", marca: "!", texto: "Aviso de fadiga." };
const INFO: AvisoTreino = { tipo: "primeiro", tom: "azul", marca: "i", texto: "Aviso informativo." };

const painel = () => screen.queryByTestId("ultimo-treino-detalhe");
const verMais = () => screen.queryByRole("button", { name: /ver (mais|menos)/ });
const textos = () => screen.queryAllByTestId(/^aviso-/).map((e) => e.textContent);

describe("UltimoTreinoPanel", () => {
  it("sem aviso: séries, contagem e observação; linha de avisos não existe", () => {
    render(<UltimoTreinoPanel ultimo={ULTIMO} avisos={[]} />);
    expect(painel()).toHaveTextContent("ÚLTIMO TREINO01/10/2026");
    expect(painel()).toHaveTextContent("2 série(s) · volume 560 kg·reps");
    expect(painel()).toHaveTextContent("ombro ok");
    expect(screen.queryByRole("list")).toBeNull();
    expect(verMais()).toBeNull();
  });

  it("aviso dentro do card, depois das séries e antes da contagem", () => {
    render(<UltimoTreinoPanel ultimo={ULTIMO} avisos={[SUBIR]} />);
    expect(painel()).toHaveTextContent(/Top Set 2.*↑\s*Aviso de subir\..*2 série\(s\)/);
  });

  it("marca e texto, barra lateral e sem fundo", () => {
    render(<UltimoTreinoPanel ultimo={ULTIMO} avisos={[FADIGA]} />);
    const aviso = screen.getByTestId("aviso-fadiga");
    expect(aviso).toHaveTextContent("!Aviso de fadiga.");
    expect(aviso).toHaveStyle({ borderLeftStyle: "solid", color: "#92400e" });
    expect(getComputedStyle(aviso).backgroundColor).toMatch(/^(rgba\(0, 0, 0, 0\)|transparent|)$/);
  });

  it.each([[SUBIR, "#166534"], [FADIGA, "#92400e"], [INFO, "#1d4ed8"]])("cor do aviso %#", (aviso, cor) => {
    render(<UltimoTreinoPanel ultimo={ULTIMO} avisos={[aviso]} />);
    expect(screen.getByTestId(`aviso-${aviso.tipo}`)).toHaveStyle({ color: cor });
  });

  it("um aviso: sem ver mais", () => {
    render(<UltimoTreinoPanel ultimo={ULTIMO} avisos={[SUBIR]} />);
    expect(verMais()).toBeNull();
  });

  it("vários: mostra só o primeiro; ver mais abre na ordem e ver menos recolhe", () => {
    render(<UltimoTreinoPanel ultimo={ULTIMO} avisos={[SUBIR, FADIGA, INFO]} />);
    expect(textos()).toEqual(["↑Aviso de subir."]);
    expect(verMais()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByText("ver mais"));
    expect(textos()).toEqual(["↑Aviso de subir.", "!Aviso de fadiga.", "iAviso informativo."]);
    expect(verMais()).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByText("ver menos"));
    expect(textos()).toEqual(["↑Aviso de subir."]);
  });

  it("primeiro registro: só título e aviso", () => {
    render(<UltimoTreinoPanel ultimo={null} avisos={[INFO]} />);
    expect(within(painel()!).getByText("ÚLTIMO TREINO")).toBeInTheDocument();
    expect(painel()).toHaveTextContent("iAviso informativo.");
    expect(painel()).not.toHaveTextContent(/série\(s\)|volume|\d{2}\/\d{2}/);
  });

  it("registro sem série para listar: só aparece se houver aviso, sem contagem nem observação", () => {
    const vazio = { ...ULTIMO, topSetReps: 0, backoffReps: 0 };
    const { rerender } = render(<UltimoTreinoPanel ultimo={vazio} avisos={[]} />);
    expect(painel()).toBeNull();
    rerender(<UltimoTreinoPanel ultimo={vazio} avisos={[FADIGA]} />);
    expect(painel()).toHaveTextContent("Aviso de fadiga.");
    expect(painel()).not.toHaveTextContent(/série\(s\)|ombro ok|\d{2}\/\d{2}/);
  });

  it("sem histórico e sem aviso: não aparece", () => {
    render(<UltimoTreinoPanel ultimo={null} avisos={[]} />);
    expect(painel()).toBeNull();
  });

  it("azul e cinza em condições normais", () => {
    render(<UltimoTreinoPanel ultimo={ULTIMO} avisos={[]} />);
    expect(screen.getByText("ÚLTIMO TREINO")).toHaveStyle({ color: "#1d4ed8" });
    expect(screen.getByText(/2 série\(s\)/)).toHaveStyle({ color: "#6b7280" });
    expect(screen.getByText(/ombro ok/)).toHaveStyle({ color: "#6b7280" });
  });
});
