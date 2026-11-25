/**
 * Blocos da sessão → components
 * Cada modo (Top Set, Back-off, Cluster, Deload) é um componente só de apresentação.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopSetBlock } from "../../../../components/treinoSessao/blocks/TopSetBlock";
import { TopSet2Block } from "../../../../components/treinoSessao/blocks/TopSet2Block";
import { BackoffBlock } from "../../../../components/treinoSessao/blocks/BackoffBlock";
import { SeriesExtrasBlock } from "../../../../components/treinoSessao/blocks/SeriesExtrasBlock";
import { ClusterBlock } from "../../../../components/treinoSessao/blocks/ClusterBlock";
import { DeloadBlock } from "../../../../components/treinoSessao/blocks/DeloadBlock";
import { blocosVazios, emptyExerciseState, type ExerciseState } from "../../../../components/treinoSessao/domain/estadoExercicio";
import type { ExercicioSessao } from "../../../../data/sessionExercises";
import { STATUS_DE_RESULTADO } from "../helpers";

const EX: ExercicioSessao = {
  nome: "Supino reto barra", grupo: "Peitoral", faixaTopSet: [5, 8], faixaBackoff: [8, 10],
  backoffPct: 0.9, seriesValidas: 3, cue: "",
};
const estado = (over: Partial<ExerciseState> = {}): ExerciseState => ({ ...emptyExerciseState(), ...over });
const escala = { escala: "RPE" as const, onTrocarEscala: vi.fn(), semEsforco: [] };
const AVISO = /Marque o esforço desta série/;
const digitar = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("Blocos da sessão", () => {
  it("TopSetBlock: editar peso remove a sugestão e confirmar chama o callback", () => {
    const onChange = vi.fn(), onConfirmar = vi.fn();
    render(<TopSetBlock {...escala} ex={EX} state={estado({ topSetKg: "100", topSetReps: "7" })} aviso={false} onChange={onChange} onConfirmar={onConfirmar} onEditar={vi.fn()} />);
    digitar(/Top Set 1 kg/, "102");
    expect(onChange).toHaveBeenCalledWith({ topSetKg: "102", topSetKgIsSuggestion: false });
    fireEvent.click(screen.getByText("Confirmar Top Set 1"));
    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it("TopSet2Block: digitar o peso trava o espelho", () => {
    const onChange = vi.fn();
    render(<TopSet2Block {...escala} ex={EX} state={estado()} aviso onChange={onChange} onConfirmar={vi.fn()} onEditar={vi.fn()} />);
    digitar(/Top Set 2 kg/, "95");
    expect(onChange).toHaveBeenCalledWith({ backoffKg: "95", backoffKgIsSuggestion: false, backoffKgWasUserEdited: true });
    expect(screen.getByText(/Preencha o peso e as repetições do Top Set 2/)).toBeInTheDocument();
  });

  it("BackoffBlock: mostra o percentual do plano", () => {
    render(<BackoffBlock {...escala} ex={EX} state={estado({ extraKg: "90" })} onChange={vi.fn()} />);
    expect(screen.getByText("Back-off (90%)")).toBeInTheDocument();
    expect(screen.getByLabelText(/Back-off kg/)).toHaveValue(90);
  });

  it("SeriesExtrasBlock: Série 3 e Série 4", () => {
    const onChange = vi.fn();
    render(<SeriesExtrasBlock {...escala} ex={EX} state={estado({ extraKg: "100", serie4Kg: "95" })} onChange={onChange} />);
    digitar(/Série 4 reps/, "4");
    expect(onChange).toHaveBeenCalledWith({ serie4Reps: "4", serie4RepsSuggestion: false, extraKgWasUserEdited: true });
  });

  it("ClusterBlock: edita o bloco da série ativa", () => {
    const onChange = vi.fn();
    render(<ClusterBlock {...escala} ex={EX} state={estado({ tecnica: "RP", clusterSeries: blocosVazios(2), clusterSeries2: blocosVazios(2) })} aviso={false}
      onChange={onChange} onAbrirSerie={vi.fn()} onFinalizarSerie1={vi.fn()} onConfirmar={vi.fn()} />);
    digitar(/Série 1 bloco 2 kg/, "80");
    expect(onChange).toHaveBeenCalledWith({ clusterSeries: [{ kg: "", reps: "" }, { kg: "80", reps: "" }] });
  });

  it("DeloadBlock: aviso e apenas o Top Set 1", () => {
    render(<DeloadBlock {...escala} ex={EX} state={estado({ isDeload: true, topSetConfirmed: true })} aviso={false} onChange={vi.fn()} onConfirmar={vi.fn()} onEditar={vi.fn()} />);
    expect(screen.getByText(/Deload — apenas 1 série válida/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Top Set 1 kg/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Top Set 2 kg/)).not.toBeInTheDocument();
    expect(screen.getByText(/Deload registrado — não conta para progressão/)).toBeInTheDocument();
  });

  it("Deload é escolha: texto e status em cinza (RG29)", () => {
    render(<DeloadBlock {...escala} ex={EX} state={estado({ isDeload: true, topSetConfirmed: true })} aviso={false} onChange={vi.fn()} onConfirmar={vi.fn()} onEditar={vi.fn()} />);
    expect(screen.getByText(/Deload — apenas 1 série válida/)).toHaveStyle({ color: "#6b7280" });
    expect(screen.getByText(/Deload registrado/).parentElement).toHaveStyle({ color: "#6b7280" });
  });

  describe("Top Set 1 confirmado: sem status de resultado (RG21)", () => {
    const confirmado = (over: Partial<ExerciseState>, tela: "RPE" | "RIR" = "RPE") =>
      render(<TopSetBlock {...escala} escala={tela} ex={EX} state={estado({ topSetKg: "100", topSetConfirmed: true, ...over })} aviso={false} onChange={vi.fn()} onConfirmar={vi.fn()} onEditar={vi.fn()} />);
    const antesDoEditar = () => screen.getByText("Editar Top Set 1").previousElementSibling;

    it.each([
      ["teto dentro do alvo", "8", 8, "RPE"],
      ["teto ainda sem esforço", "8", null, "RPE"],
      ["teto acima do alvo", "8", 9, "RPE"],
      ["teto acima do alvo, em RIR", "8", 9, "RIR"],
      ["na faixa", "7", 8, "RPE"],
      ["abaixo da faixa", "3", 8, "RPE"],
    ] as const)("%s", (_n, topSetReps, topSetRpe, tela) => {
      const { container } = confirmado({ topSetReps, topSetRpe }, tela);
      expect(container).not.toHaveTextContent(STATUS_DE_RESULTADO);
      // Vale para qualquer texto: entre os chips de esforço e o botão de editar não há nada.
      expect(antesDoEditar()).toBe(screen.getByLabelText(/^Esforço Top Set 1/));
    });

    it("recorde confirmado continua, mesmo no teto", () => {
      const { container } = confirmado({ topSetReps: "8", topSetRpe: 8, prConfirmado: true });
      expect(antesDoEditar()).toHaveTextContent("🔥 PR Confirmado!");
      expect(container).not.toHaveTextContent(STATUS_DE_RESULTADO);
    });

    it("campo obrigatório vazio continua avisando", () => {
      render(<TopSetBlock {...escala} ex={EX} state={estado()} aviso onChange={vi.fn()} onConfirmar={vi.fn()} onEditar={vi.fn()} />);
      expect(screen.getByText(/Preencha o peso e as repetições do Top Set 1/)).toBeInTheDocument();
    });

    it("o botão de editar continua chamando o callback", () => {
      const onEditar = vi.fn();
      render(<TopSetBlock {...escala} ex={EX} state={estado({ topSetKg: "100", topSetReps: "8", topSetConfirmed: true })} aviso={false} onChange={vi.fn()} onConfirmar={vi.fn()} onEditar={onEditar} />);
      fireEvent.click(screen.getByText("Editar Top Set 1"));
      expect(onEditar).toHaveBeenCalledOnce();
    });
  });

  describe("aviso de esforço só na série que falta (RG27)", () => {
    const acoes = { aviso: false, onChange: vi.fn(), onConfirmar: vi.fn(), onEditar: vi.fn() };
    const cluster = estado({ tecnica: "RP", tecnicaConfirmed: true, clusterSeries: [{ kg: "80", reps: "4" }], clusterSeries2: [{ kg: "80", reps: "3" }] });

    it.each([
      ["Top Set 1", <TopSetBlock {...escala} {...acoes} ex={EX} state={estado()} semEsforco={["topSetRpe"]} />],
      ["Top Set 2", <TopSet2Block {...escala} {...acoes} ex={EX} state={estado()} semEsforco={["backoffRpe"]} />],
      ["Back-off", <BackoffBlock {...escala} ex={EX} state={estado()} onChange={vi.fn()} semEsforco={["extraRpe"]} />],
      ["Série 4, sem avisar a Série 3", <SeriesExtrasBlock {...escala} ex={EX} state={estado()} onChange={vi.fn()} semEsforco={["serie4Rpe"]} />],
      ["Deload", <DeloadBlock {...escala} {...acoes} ex={EX} state={estado({ isDeload: true })} semEsforco={["topSetRpe"]} />],
      ["Cluster confirmado", <ClusterBlock {...escala} ex={EX} state={cluster} aviso={false} onChange={vi.fn()} onAbrirSerie={vi.fn()} onFinalizarSerie1={vi.fn()} onConfirmar={vi.fn()} semEsforco={["clusterRpe2"]} />],
    ])("%s", (_n, bloco) => {
      render(bloco);
      expect(screen.getAllByText(AVISO)).toHaveLength(1);
    });

    it("outra série sem esforço não avisa no Top Set 1", () => {
      render(<TopSetBlock {...escala} {...acoes} ex={EX} state={estado()} semEsforco={["backoffRpe"]} />);
      expect(screen.queryByText(AVISO)).toBeNull();
    });

    it("Cluster confirmado: o campo fica na tela só para a série sem esforço e marca num toque", () => {
      const onChange = vi.fn();
      render(<ClusterBlock {...escala} ex={EX} state={{ ...cluster, clusterRpe: 9 }} aviso={false} onChange={onChange} onAbrirSerie={vi.fn()} onFinalizarSerie1={vi.fn()} onConfirmar={vi.fn()} />);
      expect(screen.queryByLabelText(/Esforço Cluster Série 1/)).toBeNull();
      expect(screen.getByLabelText(/Esforço Cluster Série 2/)).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("RPE 10"));
      expect(onChange).toHaveBeenCalledWith({ clusterRpe2: 10 });
    });
  });
});
