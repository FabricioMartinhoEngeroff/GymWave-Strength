/**
 * TreinoSessao — avisos dentro do card "Último treino" (EF_02 RG13, RG17, RG21, RG22, RG29 e RG30)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarRegistros, salvarRegistro } from "../../../utils/storage";
import type { RegistroExercicio } from "../../../types/TrainingData";
import { renderComMensagens } from "../mensagens/helpers";

const EX = "Cadeira extensora";
const OUTRO = "Rosca scott";
const DIA = 86400000;

function plano(over: Record<string, unknown> = {}) {
  localStorage.clear();
  const ex = { grupo: "Quadríceps", faixaTopSet: [5, 8], faixaBackoff: [8, 10], backoffPct: 0.9, seriesValidas: 1, cue: "", rpeAlvo: [9, 10], ...over };
  localStorage.setItem("sessoes_config", JSON.stringify({ "Upper A": [{ ...ex, nome: EX }, { ...ex, nome: OUTRO }] }));
}
function historico(diasAtras: number, over: Partial<RegistroExercicio> = {}) {
  const d = new Date(Date.now() - diasAtras * DIA);
  salvarRegistro({
    exercicio: EX, treinoId: "UA", data: d.toLocaleDateString("pt-BR"), dataTs: d.getTime(),
    topSetKg: 40, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
    backoffKg: 0, backoffReps: 0, backoffFaixaMin: 8, backoffFaixaMax: 10,
    seriesValidas: 1, progrediu: false, ...over,
  });
}
/** Mesma carga, do mais antigo para o mais novo, a cada 7 dias. */
const treinos = (lista: Partial<RegistroExercicio>[]) => lista.forEach((t, i) => historico(1 + 7 * (lista.length - 1 - i), t));
const fadigado = (over: Partial<RegistroExercicio> = {}) => treinos([9, 10, 10].map((topSetRpe) => ({ topSetRpe, ...over })));
const noTeto = { topSetReps: 8, topSetBateuTeto: true };

function abrir() {
  renderComMensagens(<TreinoSessao />);
  fireEvent.click(screen.getByRole("button", { name: "Upper A" }));
}
const painel = () => screen.getByTestId("ultimo-treino-detalhe");
const avisos = () => screen.queryAllByTestId(/^aviso-/).map((e) => e.textContent);
const FADIGA = "!Mesma carga (40 kg), esforço subindo: RPE 9 → 10 em 3 treinos.";
const SUBIR = "↑Bateu o teto de reps dentro do alvo (RPE 10). Dá para subir a carga.";

describe("TreinoSessao — avisos no card do último treino (RG29)", () => {
  beforeEach(() => plano());

  it("sem nada a dizer, o card não tem aviso", () => {
    historico(7, { topSetRpe: 9 });
    abrir();
    expect(painel()).toBeInTheDocument();
    expect(avisos()).toEqual([]);
  });

  it("primeiro registro", () => {
    abrir();
    expect(painel()).toHaveTextContent("iPrimeiro registro deste exercício nesta sessão.");
  });

  it("fadiga: âmbar, dentro do card, sem sugerir deload nem mexer em nada", () => {
    fadigado();
    abrir();
    expect(avisos()).toEqual([FADIGA]);
    const aviso = screen.getByTestId("aviso-fadiga");
    expect(painel()).toContainElement(aviso);
    expect(aviso).toHaveStyle({ color: "#92400e" });
    expect(painel()).not.toHaveTextContent(/deload/i);
    expect(screen.getByLabelText(/Top Set 1 kg/)).toHaveValue(40);
    expect(screen.getByLabelText(/Top Set 1 reps/)).toHaveValue(7);
    expect(screen.queryByText(/apenas 1 série válida/)).toBeNull();
  });

  it("subir e fadiga: mostra só subir; ver mais abre; trocar de exercício recolhe", () => {
    fadigado(noTeto);
    abrir();
    expect(avisos()).toEqual([SUBIR]);
    fireEvent.click(screen.getByText("ver mais"));
    expect(avisos()).toEqual([SUBIR, FADIGA]);
    fireEvent.click(screen.getByLabelText(/próximo exercício/i));
    fireEvent.click(screen.getByLabelText(/exercício anterior/i));
    expect(avisos()).toEqual([SUBIR]);
  });

  it("regressão: âmbar, dentro do card, sem mexer em nada", () => {
    treinos([10, 9, 7].map((topSetReps) => ({ topSetReps, topSetRpe: 9 })));
    abrir();
    expect(avisos()).toEqual(["!Mesma carga (40 kg), reps caindo: 10 → 9 → 7 em 3 treinos."]);
    const aviso = screen.getByTestId("aviso-regressao");
    expect(painel()).toContainElement(aviso);
    expect(aviso).toHaveStyle({ color: "#92400e" });
    expect(screen.getByLabelText(/Top Set 1 kg/)).toHaveValue(40);
    expect(screen.getByLabelText(/Top Set 1 reps/)).toHaveValue(7);
  });

  it("um deload depois da regressão encerra o aviso", () => {
    treinos([10, 9, 7].map((topSetReps) => ({ topSetReps, topSetRpe: 9 })));
    historico(0, { isDeload: true, topSetRpe: 6 });
    abrir();
    expect(avisos()).toEqual([]);
  });

  it("o texto acompanha a escala; as séries continuam nas duas", () => {
    fadigado();
    localStorage.setItem("escala_esforco", "RIR");
    abrir();
    expect(avisos()).toEqual(["!Mesma carga (40 kg), esforço subindo: RIR 1 → 0 em 3 treinos."]);
    expect(painel()).toHaveTextContent("40kg × 7 reps · RPE 10 · RIR 0");
  });

  it("o banner de recorde fica fora e acima do card, com os avisos no lugar", () => {
    fadigado();
    abrir();
    fireEvent.change(screen.getByLabelText(/Top Set 1 reps/), { target: { value: "8" } });
    const pr = screen.getByTestId("banner-pr");
    expect(painel()).not.toContainElement(pr);
    expect(pr.compareDocumentPosition(painel()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(avisos()).toEqual([FADIGA]);
  });

  it("aviso não bloqueia o treino: confirma, avança e salva", () => {
    fadigado();
    const antes = carregarRegistros().length;
    abrir();
    fireEvent.click(screen.getByLabelText("RPE 10"));
    fireEvent.click(screen.getByText("Confirmar Top Set 1"));
    fireEvent.click(screen.getByText("Próximo"));
    fireEvent.click(screen.getByText("Pular"));
    fireEvent.click(screen.getByText("Ver Resumo"));
    fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));
    expect(carregarRegistros()).toHaveLength(antes + 1);
  });

  it("revisão: etiqueta Deload em cinza", () => {
    historico(7);
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "Deload" }));
    fireEvent.click(screen.getByLabelText("RPE 9"));
    fireEvent.click(screen.getByText("Confirmar Top Set 1"));
    fireEvent.click(screen.getByText("Próximo"));
    fireEvent.click(screen.getByText("Pular"));
    fireEvent.click(screen.getByText("Ver Resumo"));
    expect(screen.getByText("· Deload")).toHaveStyle({ color: "#6b7280" });
  });

  it("alvo da planilha (RG28) muda o aviso e o cabeçalho; esforço segue obrigatório", () => {
    plano({ rpeAlvo: [7, 8] });
    historico(7, { ...noTeto, topSetRpe: 9 });
    abrir();
    expect(screen.getByText(/alvo RPE 7–8/)).toBeInTheDocument();
    expect(screen.getByTestId("aviso-consolidar")).toHaveTextContent("(RPE 9, alvo 7–8)");
    fireEvent.click(screen.getByText("Confirmar Top Set 1"));
    fireEvent.click(screen.getByText("Próximo"));
    expect(screen.getByText(/Marque o esforço desta série para avançar/)).toBeInTheDocument();
  });
});
