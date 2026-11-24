/**
 * AjudaEsforco — balão "?" que explica RPE e RIR — EF_02 RG25
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { EsforcoInput } from "../../../../components/treinoSessao/blocks/EsforcoInput";
import { BackoffBlock } from "../../../../components/treinoSessao/blocks/BackoffBlock";
import { ClusterBlock } from "../../../../components/treinoSessao/blocks/ClusterBlock";
import { SeriesExtrasBlock } from "../../../../components/treinoSessao/blocks/SeriesExtrasBlock";
import { TopSet2Block } from "../../../../components/treinoSessao/blocks/TopSet2Block";
import { TopSetBlock } from "../../../../components/treinoSessao/blocks/TopSetBlock";
import { blocosVazios, emptyExerciseState, type ExerciseState } from "../../../../components/treinoSessao/domain/estadoExercicio";
import { RPE_ALVO, type ExercicioSessao } from "../../../../data/sessionExercises";
import { rotuloAlvo, type EscalaEsforco } from "../../../../utils/esforco";

const EX: ExercicioSessao = {
  nome: "Supino reto barra", grupo: "Peitoral", faixaTopSet: [5, 8], faixaBackoff: [8, 10],
  backoffPct: 0.9, seriesValidas: 3, cue: "",
};
const BOTAO = "O que é RPE e RIR?";
const grupo = (serie: string) => within(screen.getByLabelText(`Esforço ${serie} ${EX.nome}`));
const ajuda = (serie = "Top Set 1") => grupo(serie).getByRole("button", { name: BOTAO });
const balao = () => screen.queryByRole("note");

const onChange = vi.fn();
const onTrocarEscala = vi.fn();
const scrollIntoView = vi.fn();

function Serie({ serie = "Top Set 1", escala = "RPE" }: { serie?: string; escala?: EscalaEsforco }) {
  return (
    <EsforcoInput serie={serie} exercicio={EX.nome} valor={null} onChange={onChange} escala={escala} onTrocarEscala={onTrocarEscala} />
  );
}

describe("AjudaEsforco", () => {
  // O jsdom não implementa scrollIntoView.
  const original = Element.prototype.scrollIntoView;
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => {
    Element.prototype.scrollIntoView = original;
  });

  it("começa fechado", () => {
    render(<Serie />);
    expect(balao()).toBeNull();
    expect(ajuda()).toHaveAttribute("aria-expanded", "false");
  });

  it("fica à direita do botão de trocar escala", () => {
    render(<Serie />);
    const botoes = grupo("Top Set 1").getAllByRole("button");
    expect(botoes.indexOf(ajuda())).toBe(botoes.indexOf(screen.getByLabelText("Trocar para RIR")) + 1);
  });

  it("tocar no ? abre o balão e rola até ele aparecer", () => {
    render(<Serie />);
    fireEvent.click(ajuda());
    expect(balao()).toBeInTheDocument();
    expect(ajuda()).toHaveAttribute("aria-expanded", "true");
    expect(ajuda()).toHaveAttribute("aria-controls", balao()?.id);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it.each<EscalaEsforco>(["RPE", "RIR"])("explica RPE, RIR e para que servem (escala %s)", (escala) => {
    render(<Serie escala={escala} />);
    fireEvent.click(ajuda());
    expect(balao()).toHaveTextContent("RPE e RIR: quão perto da falha");
    expect(balao()).toHaveTextContent("RPE (esforço percebido): nota de 6 a 10. 10 é a falha");
    expect(balao()).toHaveTextContent("RIR (reps na reserva): quantas reps ainda sairiam. 0 é a falha.");
    expect(balao()).toHaveTextContent("RIR = 10 − RPE. Ex.: RPE 8 = RIR 2");
    expect(balao()).toHaveTextContent("alerta de fadiga");
    expect(balao()).toHaveTextContent("Obrigatório: marque ao terminar a série.");
    expect(balao()).not.toHaveTextContent("Opcional");
  });

  it("explica a sugestão pelo alvo e que o peso não muda sozinho (RG21)", () => {
    render(<Serie />);
    fireEvent.click(ajuda());
    expect(balao()).toHaveTextContent(
      "bateu o teto de reps no Top Set 1 com esforço igual ou abaixo do alvo do exercício, sobe o peso; se passou do alvo, repete a carga",
    );
    expect(balao()).toHaveTextContent("o peso não muda sozinho");
    expect(balao()).toHaveTextContent("2 treinos seguidos");
  });

  it("os alvos do texto são os do cadastro (RG28)", () => {
    render(<Serie />);
    fireEvent.click(ajuda());
    for (const alvo of [RPE_ALVO.composto, RPE_ALVO.isolador]) {
      expect(balao()).toHaveTextContent(`${rotuloAlvo(alvo, "RPE")} (${rotuloAlvo(alvo, "RIR")})`);
    }
  });

  describe("fechar", () => {
    beforeEach(() => {
      render(<><Serie /><p>fora</p></>);
      fireEvent.click(ajuda());
    });

    it("tocar de novo no ?", () => {
      fireEvent.click(ajuda());
      expect(balao()).toBeNull();
    });

    it("no X, devolvendo o foco para o ?", () => {
      fireEvent.click(screen.getByRole("button", { name: "Fechar ajuda" }));
      expect(balao()).toBeNull();
      expect(ajuda()).toHaveFocus();
    });

    it("com Esc, devolvendo o foco para o ?", () => {
      fireEvent.keyDown(document, { key: "Escape" });
      expect(balao()).toBeNull();
      expect(ajuda()).toHaveFocus();
    });

    it("tocar fora", () => {
      fireEvent.click(screen.getByText("fora"));
      expect(balao()).toBeNull();
    });

    it("tocar dentro, rolar ou apertar outra tecla não fecha", () => {
      fireEvent.click(screen.getByText(/quão perto da falha/));
      fireEvent.pointerDown(screen.getByText("fora"));
      fireEvent.scroll(document);
      fireEvent.keyDown(document, { key: "a" });
      expect(balao()).toBeInTheDocument();
    });
  });

  it("só um balão por vez: abrir o de outra série fecha o anterior", () => {
    render(<><Serie /><Serie serie="Top Set 2" /></>);
    fireEvent.click(ajuda("Top Set 1"));
    fireEvent.click(ajuda("Top Set 2"));
    expect(screen.getAllByRole("note")).toHaveLength(1);
    expect(ajuda("Top Set 1")).toHaveAttribute("aria-expanded", "false");
    expect(ajuda("Top Set 2")).toHaveAttribute("aria-expanded", "true");
  });

  it("é só leitura: não marca esforço, não troca a escala e não grava nada", () => {
    render(<form onSubmit={onChange}><Serie /></form>);
    fireEvent.click(ajuda());
    fireEvent.click(screen.getByRole("button", { name: "Fechar ajuda" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(onTrocarEscala).not.toHaveBeenCalled();
    expect(localStorage).toHaveLength(0);
  });

  it("ao sair da tela com o balão aberto, não deixa ouvintes no documento", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<Serie />);
    add.mockClear();
    fireEvent.click(ajuda());
    const ligados = add.mock.calls.filter(([t]) => t === "click" || t === "keydown");
    expect(ligados).toHaveLength(2);
    unmount();
    for (const [tipo, fn] of ligados) expect(remove).toHaveBeenCalledWith(tipo, fn);
    add.mockRestore();
    remove.mockRestore();
  });

  describe("aparece em todas as séries", () => {
    const estado = (over: Partial<ExerciseState> = {}): ExerciseState => ({ ...emptyExerciseState(), ...over });
    const base = { ex: EX, escala: "RPE" as const, onTrocarEscala, onChange, semEsforco: [] };
    const confirmavel = { ...base, state: estado(), aviso: false, onConfirmar: vi.fn(), onEditar: vi.fn() };
    const cluster = estado({ tecnica: "RP", clusterSeries: blocosVazios(2), clusterSeries2: blocosVazios(2) });

    it.each([
      ["Top Set 1", <TopSetBlock {...confirmavel} />, 1],
      ["Top Set 2", <TopSet2Block {...confirmavel} />, 1],
      ["Back-off", <BackoffBlock {...base} state={estado()} />, 1],
      ["Série 3 e Série 4", <SeriesExtrasBlock {...base} state={estado()} />, 2],
      ["Cluster Set", <ClusterBlock {...base} state={cluster} aviso={false} onAbrirSerie={vi.fn()} onFinalizarSerie1={vi.fn()} onConfirmar={vi.fn()} />, 1],
    ])("%s", (_nome, bloco, total) => {
      render(bloco);
      expect(screen.getAllByRole("button", { name: BOTAO })).toHaveLength(total);
    });
  });
});
