/**
 * TreinoSessao — esforço por série (RPE/RIR) — EF_02 RG20 a RG23, RG27 e RG28
 */
import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, screen, fireEvent, within } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarRegistros, salvarRegistro } from "../../../utils/storage";
import type { RegistroExercicio } from "../../../types/TrainingData";
import { dialogo, renderComMensagens } from "../mensagens/helpers";

const EX = "Supino reto barra";

/** Plano com um exercício só: o teste não precisa pular os outros 10. */
function planoDeUmExercicio(over: Record<string, unknown> = {}) {
  localStorage.clear();
  localStorage.setItem("sessoes_config", JSON.stringify({
    "Upper A": [{
      nome: EX, grupo: "Peitoral", faixaTopSet: [5, 8], faixaBackoff: [8, 10], backoffPct: 0.9, seriesValidas: 2, cue: "", ...over,
    }],
  }));
}

function abrir() {
  renderComMensagens(<TreinoSessao />);
  fireEvent.click(screen.getByRole("button", { name: "Upper A" }));
}
const grupo = (serie: string) => screen.getByLabelText(`Esforço ${serie} ${EX}`);
const chip = (serie: string, rotulo: string) => within(grupo(serie)).getByLabelText(rotulo);
const marcar = (serie: string, rotulo: string) => fireEvent.click(chip(serie, rotulo));

function topSet(kg: string, reps: string, rpe?: string) {
  fireEvent.change(screen.getByLabelText(/Top Set 1 kg/), { target: { value: kg } });
  fireEvent.change(screen.getByLabelText(/Top Set 1 reps/), { target: { value: reps } });
  if (rpe) marcar("Top Set 1", rpe);
  fireEvent.click(screen.getByText("Confirmar Top Set 1"));
}
function topSet2(reps: string, rpe?: string) {
  fireEvent.change(screen.getByLabelText(/Top Set 2 reps/), { target: { value: reps } });
  if (rpe) marcar("Top Set 2", rpe);
  fireEvent.click(screen.getByText("Confirmar Top Set 2"));
}
const revisar = () => fireEvent.click(screen.getByText("Ver Resumo"));
function salvar() {
  revisar();
  fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));
}

const DIA = 86400000;
function historico(diasAtras: number, over: Partial<RegistroExercicio>) {
  const d = new Date(Date.now() - diasAtras * DIA);
  salvarRegistro({
    exercicio: EX, treinoId: "UA", data: d.toLocaleDateString("pt-BR"), dataTs: d.getTime(),
    topSetKg: 100, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
    backoffKg: 100, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
    seriesValidas: 2, progrediu: false, ...over,
  });
}

describe("TreinoSessao — RPE/RIR por série", () => {
  beforeEach(() => planoDeUmExercicio());

  it("grava o RPE de cada série no registro", () => {
    abrir();
    topSet("100", "7", "RPE 8");
    topSet2("6", "RPE 9");
    salvar();
    expect(carregarRegistros()[0]?.series).toEqual([
      { tipo: "top1", kg: 100, reps: 7, rpe: 8 },
      { tipo: "top2", kg: 100, reps: 6, rpe: 9 },
    ]);
  }, 15_000); // renderiza a tela inteira; com a suíte toda rodando passa de 5 s

  it("tocar no chip marcado desmarca", () => {
    abrir();
    marcar("Top Set 1", "RPE 8");
    expect(chip("Top Set 1", "RPE 8")).toHaveAttribute("aria-pressed", "true");
    marcar("Top Set 1", "RPE 8");
    expect(chip("Top Set 1", "RPE 8")).toHaveAttribute("aria-pressed", "false");
  });

  it("alterna para RIR em todas as séries, lembra a escolha e mantém o valor", () => {
    abrir();
    topSet("100", "7", "RPE 8");
    fireEvent.click(chip("Top Set 1", "Trocar para RIR"));
    expect(chip("Top Set 1", "RIR 2")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Top Set 2", "RIR 2")).toHaveAttribute("aria-pressed", "false");
    cleanup();
    abrir();
    expect(chip("Top Set 1", "RIR 2")).toHaveAttribute("aria-pressed", "true");
  });

  it("não vem preenchido do último treino", () => {
    historico(7, { topSetRpe: 8 });
    abrir();
    expect(grupo("Top Set 1").querySelector("[aria-pressed='true']")).toBeNull();
  });

  describe("painel do último treino: esforço nas duas escalas (RG17)", () => {
    const painel = () => screen.getByTestId("ultimo-treino-detalhe");

    it.each([
      [8, "RPE 8 · RIR 2"], [10, "RPE 10 · RIR 0"], [6, "RPE ≤6 · RIR 4+"], [8.5, "RPE 8.5 · RIR 1.5"],
    ])("RPE %s → %s", (topSetRpe, esperado) => {
      historico(7, { topSetRpe });
      abrir();
      expect(painel()).toHaveTextContent(`100kg × 7 reps · ${esperado}`);
    });

    it("mostra as duas mesmo com a tela em RIR", () => {
      historico(7, { topSetRpe: 8 });
      localStorage.setItem("escala_esforco", "RIR");
      abrir();
      expect(painel()).toHaveTextContent("100kg × 7 reps · RPE 8 · RIR 2");
    });

    it("cada série mostra o seu esforço", () => {
      historico(7, { topSetRpe: 8, backoffRpe: 9 });
      abrir();
      expect(painel()).toHaveTextContent(/Top Set 1\s*100kg × 7 reps · RPE 8 · RIR 2\s*Top Set 2\s*100kg × 6 reps · RPE 9 · RIR 1/);
    });

    it("série sem esforço não mostra nenhuma escala", () => {
      historico(7, {});
      abrir();
      expect(painel()).toHaveTextContent("100kg × 7 reps");
      expect(painel()).not.toHaveTextContent(/RPE|RIR/);
    });

    it("Cluster Set: no último bloco de cada série", () => {
      historico(7, {
        tecnica: "RP", topSetKg: 0, topSetReps: 0, backoffKg: 0, backoffReps: 0, clusterRpe: 9, clusterRpe2: 10,
        clusterSeries: [{ kg: 100, reps: 4 }, { kg: 100, reps: 3 }], clusterSeries2: [{ kg: 95, reps: 2 }],
      });
      abrir();
      expect(painel()).toHaveTextContent(/100kg × 4 reps\s*Cluster S1 · B2\s*100kg × 3 reps · RPE 9 · RIR 1/);
      expect(painel()).toHaveTextContent("95kg × 2 reps · RPE 10 · RIR 0");
    });
  });

  it("volta do rascunho ao reabrir o app", () => {
    abrir();
    topSet("100", "7", "RPE 9");
    cleanup();
    abrir();
    expect(chip("Top Set 1", "RPE 9")).toHaveAttribute("aria-pressed", "true");
  });

  it("Cluster tem um RPE por série cluster", () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "Cluster Set" }));
    fireEvent.change(screen.getByLabelText(/Série 1 bloco 1 kg/), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Série 1 bloco 1 reps/), { target: { value: "4" } });
    marcar("Cluster Série 1", "RPE 9");
    fireEvent.click(screen.getByText(/Finalizar Série 1/));
    expect(grupo("Cluster Série 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Série 2 bloco 1 kg/), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Série 2 bloco 1 reps/), { target: { value: "3" } });
    marcar("Cluster Série 2", "RPE 10");
    fireEvent.click(screen.getByText("Confirmar Cluster"));
    salvar();
    expect(carregarRegistros()[0]?.series.map((s) => s.rpe)).toEqual([9, 10]);
  });

  it("a revisão mostra só as séries que serão gravadas (RG24)", () => {
    const cfg = JSON.parse(localStorage.getItem("sessoes_config")!);
    cfg["Upper A"][0].seriesValidas = 3;
    localStorage.setItem("sessoes_config", JSON.stringify(cfg));
    abrir();
    topSet("100", "7", "RPE 8");
    topSet2("6", "RPE 9");
    expect(screen.getByLabelText(/Back-off kg/)).toHaveValue(90); // sugerido, sem reps = não feito
    revisar();
    expect(screen.getByText("Top 1: 100kg × 7reps @ RPE 8 · Top 2: 100kg × 6reps @ RPE 9")).toBeInTheDocument();
  });

  it("a revisão mostra o RPE na escala escolhida", () => {
    abrir();
    topSet("100", "7", "RPE 8");
    topSet2("6", "RPE 9");
    fireEvent.click(chip("Top Set 1", "Trocar para RIR"));
    revisar();
    expect(screen.getByText(/Top 1: 100kg × 7reps @ RIR 2 · Top 2: 100kg × 6reps @ RIR 1/)).toBeInTheDocument();
  });

  describe("progressão pelo esforço alvo (RG21)", () => {
    it("pesado: teto no limite do alvo (RPE 8)", () => {
      abrir();
      topSet("100", "8", "RPE 8");
      expect(screen.getByText("Teto de reps atingido dentro do alvo")).toBeInTheDocument();
    });

    it("pesado: teto acima do alvo fica em consolidação e não conta no resumo", () => {
      abrir();
      topSet("100", "8", "RPE 9");
      expect(screen.getByText("Teto de reps com esforço acima do alvo (RPE 9, alvo 7–8): carga em consolidação.")).toBeInTheDocument();
      topSet2("6", "RPE 9");
      salvar();
      expect(screen.queryByText(/no teto de reps/)).not.toBeInTheDocument();
    });

    it("isolador: teto com RPE 10 está no alvo e conta no resumo", () => {
      planoDeUmExercicio({ rpeAlvo: [9, 10] });
      abrir();
      topSet("100", "8", "RPE 10");
      expect(screen.getByText("Teto de reps atingido dentro do alvo")).toBeInTheDocument();
      topSet2("6", "RPE 10");
      salvar();
      expect(screen.getByText("1 exercício(s) no teto de reps dentro do alvo")).toBeInTheDocument();
    });

    it("subir é só aviso: o campo abre com o mesmo peso e reps do último treino (RG5.1)", () => {
      historico(7, { topSetReps: 8, topSetBateuTeto: true, topSetRpe: 7 });
      abrir();
      expect(screen.getByTestId("aviso-subir")).toBeInTheDocument();
      expect(screen.getByLabelText(/Top Set 1 kg/)).toHaveValue(100);
      expect(screen.getByLabelText(/Top Set 1 reps/)).toHaveValue(8);
    });

    it("o cabeçalho mostra o alvo na escala escolhida (RG28)", () => {
      abrir();
      expect(screen.getByText(/alvo RPE 7–8/)).toBeInTheDocument();
      fireEvent.click(chip("Top Set 1", "Trocar para RIR"));
      expect(screen.getByText(/alvo RIR 2–3/)).toBeInTheDocument();
    });

    it("na abertura: aviso de subir ou de consolidar conforme o RPE do último treino", () => {
      historico(7, { topSetReps: 8, topSetBateuTeto: true, topSetRpe: 7 });
      abrir();
      expect(screen.getByTestId("aviso-subir")).toHaveTextContent("Bateu o teto de reps dentro do alvo (RPE 7). Dá para subir a carga.");
      cleanup();
      planoDeUmExercicio();
      historico(7, { topSetReps: 8, topSetBateuTeto: true, topSetRpe: 9 });
      abrir();
      expect(screen.queryByTestId("aviso-subir")).toBeNull();
      expect(screen.getByTestId("aviso-consolidar")).toHaveTextContent("Teto de reps com esforço acima do alvo (RPE 9, alvo 7–8): carga em consolidação.");
    });
  });

  describe("alerta de fadiga (RG22)", () => {
    const tresTreinos = (...rpes: [number, number, number]) => rpes.forEach((rpe, i) => historico(15 - 7 * i, { topSetRpe: rpe }));
    const fadiga = () => screen.queryByTestId("aviso-fadiga");

    it("aparece com a mesma carga e reps acima do alvo por 2 treinos seguidos", () => {
      tresTreinos(8, 9, 10);
      abrir();
      expect(fadiga()).toHaveTextContent("Mesma carga (100 kg), esforço subindo: RPE 8 → 10 em 3 treinos.");
    });

    it("isolador: de 9 para 10 por 2 treinos seguidos alerta", () => {
      planoDeUmExercicio({ rpeAlvo: [9, 10] });
      tresTreinos(9, 10, 10);
      abrir();
      expect(fadiga()).toBeInTheDocument();
    });

    it.each<[string, [number, number, number]]>([
      ["RPE estável", [8, 8, 8]], ["um dia ruim só", [8, 8, 9]], ["subiu dentro do alvo", [7, 8, 8]],
    ])("não aparece: %s", (_n, rpes) => {
      tresTreinos(...rpes);
      abrir();
      expect(fadiga()).toBeNull();
    });

    it("isolador: o mesmo RPE que alerta no pesado está no alvo", () => {
      planoDeUmExercicio({ rpeAlvo: [9, 10] });
      tresTreinos(8, 9, 9);
      abrir();
      expect(fadiga()).toBeNull();
    });
  });

  describe("esforço obrigatório (RG27)", () => {
    const AVISO = /Marque o esforço desta série para avançar/;
    const planoDeDois = (over: Record<string, unknown> = {}) => {
      planoDeUmExercicio(over);
      const cfg = JSON.parse(localStorage.getItem("sessoes_config")!);
      cfg["Upper A"].push({ ...cfg["Upper A"][0], nome: "Rosca scott", seriesValidas: 2 });
      localStorage.setItem("sessoes_config", JSON.stringify(cfg));
    };
    const proximo = () => fireEvent.click(screen.getByText("Próximo"));
    const avisos = () => screen.queryAllByText(AVISO);
    const noExercicio = (nome: string) => expect(screen.getByLabelText(new RegExp(`kg ${nome}`))).toBeInTheDocument();

    beforeEach(() => planoDeDois());

    it("Próximo sem esforço não avança e avisa em cada série que falta", () => {
      abrir();
      topSet("100", "7");
      topSet2("6");
      expect(avisos()).toHaveLength(0); // só avisa ao tentar avançar
      proximo();
      expect(avisos()).toHaveLength(2);
      expect(screen.getByLabelText(`Top Set 1 kg ${EX}`)).toBeInTheDocument();
    });

    it("marcar some com o aviso da série e, com todas, Próximo avança", () => {
      abrir();
      topSet("100", "7");
      topSet2("6");
      proximo();
      marcar("Top Set 1", "RPE 8");
      expect(avisos()).toHaveLength(1);
      marcar("Top Set 2", "RPE 9");
      expect(avisos()).toHaveLength(0);
      proximo();
      noExercicio("Rosca scott");
    });

    it("desmarcar volta a bloquear", () => {
      abrir();
      topSet("100", "7", "RPE 8");
      topSet2("6", "RPE 9");
      marcar("Top Set 2", "RPE 9");
      proximo();
      expect(avisos()).toHaveLength(1);
    });

    it("peso e reps são validados antes do esforço", () => {
      abrir();
      proximo();
      expect(screen.getByText(/Preencha o peso e as repetições do Top Set 1/)).toBeInTheDocument();
      expect(avisos()).toHaveLength(0);
    });

    it("Top Set 2 apagado (não fiz) não pede esforço", () => {
      abrir();
      topSet("100", "7", "RPE 8");
      fireEvent.change(screen.getByLabelText(/Top Set 2 kg/), { target: { value: "" } });
      proximo();
      noExercicio("Rosca scott");
    });

    it("Back-off feito pede esforço; vazio não pede", () => {
      planoDeDois({ seriesValidas: 3 });
      abrir();
      topSet("100", "7", "RPE 8");
      topSet2("6", "RPE 9");
      fireEvent.change(screen.getByLabelText(/Back-off reps/), { target: { value: "10" } });
      proximo();
      expect(avisos()).toHaveLength(1);
      fireEvent.change(screen.getByLabelText(/Back-off reps/), { target: { value: "" } });
      expect(avisos()).toHaveLength(0);
      proximo();
      noExercicio("Rosca scott");
    });

    it("Deload pede o esforço do Top Set 1", () => {
      abrir();
      fireEvent.click(screen.getByRole("button", { name: "Deload" }));
      topSet("60", "8");
      proximo();
      expect(avisos()).toHaveLength(1);
      marcar("Top Set 1", "RPE ≤6");
      proximo();
      noExercicio("Rosca scott");
    });

    it("Cluster confirmado sem esforço: marca na própria tela, sem reabrir a técnica", () => {
      planoDeDois({ seriesValidas: 1 });
      abrir();
      fireEvent.click(screen.getByRole("button", { name: "Cluster Set" }));
      fireEvent.change(screen.getByLabelText(/Série 1 bloco 1 kg/), { target: { value: "100" } });
      fireEvent.change(screen.getByLabelText(/Série 1 bloco 1 reps/), { target: { value: "4" } });
      fireEvent.click(screen.getByText("Confirmar Cluster"));
      proximo();
      expect(avisos()).toHaveLength(1);
      marcar("Cluster Série 1", "RPE 9");
      proximo();
      noExercicio("Rosca scott");
    });

    it("Pular não pede esforço", () => {
      abrir();
      topSet("100", "7");
      fireEvent.click(screen.getByText("Pular"));
      noExercicio("Rosca scott");
    });

    it("Ver Resumo no último exercício valida igual", () => {
      planoDeUmExercicio();
      abrir();
      topSet("100", "7", "RPE 8");
      topSet2("6");
      revisar();
      expect(screen.queryByText("Confirmar e Salvar Treino")).toBeNull();
      expect(avisos()).toHaveLength(1);
      marcar("Top Set 2", "RPE 9");
      salvar();
      expect(carregarRegistros()).toHaveLength(1);
    });

    it("Ver Resumo com o exercício por preencher abre a revisão (EF_09 RG8)", () => {
      planoDeUmExercicio();
      abrir();
      revisar();
      expect(screen.getByText("Confirmar e Salvar Treino")).toBeInTheDocument();
    });

    it("quem chega à revisão pelas setas não salva sem esforço: lista o que falta e guarda o rascunho", () => {
      abrir();
      topSet("100", "7", "RPE 8");
      topSet2("6");
      fireEvent.click(screen.getByLabelText(/próximo exercício/i));
      salvar();
      expect(screen.getByText("Falta marcar o esforço")).toBeInTheDocument();
      expect(screen.getByText(`${EX}: Top Set 2`)).toBeInTheDocument();
      expect(dialogo()).toBeNull();
      expect(carregarRegistros()).toHaveLength(0);
      expect(localStorage.getItem("rascunho_treino")).not.toBeNull();
    });

    it("histórico antigo sem RPE continua abrindo e sugerindo pelo teto", () => {
      historico(7, { topSetReps: 8, topSetBateuTeto: true });
      abrir();
      expect(screen.getByTestId("aviso-subir")).toHaveTextContent("Bateu o teto de reps. Dá para subir a carga.");
    });
  });
});
