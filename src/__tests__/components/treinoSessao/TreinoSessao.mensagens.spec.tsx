/**
 * TreinoSessao + central de mensagens (EF_09 RG7 a RG9, RG13, RG14)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarRegistros, salvarRegistro } from "../../../utils/storage";
import { dialogo, noDialogo, renderComMensagens } from "../mensagens/helpers";

const EX = "Supino reto barra";
const plano = (seriesValidas: number, nomes = [EX]) => localStorage.setItem("sessoes_config", JSON.stringify({
  "Upper A": nomes.map((nome) => ({ nome, grupo: "Peitoral", faixaTopSet: [5, 8], faixaBackoff: [8, 10], backoffPct: 0.9, seriesValidas, cue: "" })),
}));

function abrir() {
  const onUnsavedChanges = vi.fn();
  renderComMensagens(<TreinoSessao onUnsavedChanges={onUnsavedChanges} />);
  fireEvent.click(screen.getByRole("button", { name: "Upper A" }));
  return onUnsavedChanges;
}
const digitar = (l: RegExp, value: string) => fireEvent.change(screen.getByLabelText(l), { target: { value } });
function fazerTopSets() {
  digitar(/Top Set 1 kg/, "100"); digitar(/Top Set 1 reps/, "7");
  fireEvent.click(screen.getByText("Confirmar Top Set 1"));
  digitar(/Top Set 2 reps/, "6");
  fireEvent.click(screen.getByText("Confirmar Top Set 2"));
}
function tentarSalvar() {
  fireEvent.click(screen.getByText("Ver Resumo"));
  fireEvent.click(screen.getByText("Confirmar e Salvar Treino"));
}
const historico = () => salvarRegistro({
  exercicio: EX, treinoId: "UA", data: "01/10/2026", dataTs: new Date(2026, 9, 1).getTime(), topSetKg: 90, topSetReps: 6,
  topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false, backoffKg: 90, backoffReps: 6, backoffFaixaMin: 8, backoffFaixaMax: 10,
  seriesValidas: 2, progrediu: false,
});

describe("Salvar treino", () => {
  beforeEach(() => plano(2));
  afterEach(() => vi.restoreAllMocks());

  it("completo: salva direto, com sucesso e conquistas", () => {
    historico();
    abrir(); fazerTopSets(); tentarSalvar();
    expect(dialogo()).toBeNull();
    expect(carregarRegistros()).toHaveLength(2);
    expect(screen.getByText("Treino finalizado!")).toBeInTheDocument();
    expect(screen.getByText("Novo recorde!")).toBeInTheDocument();
    expect(screen.getByText("Treino completo!")).toBeInTheDocument();
  });

  it("série não feita: lista, e voltar não grava nada", () => {
    plano(3);
    abrir(); fazerTopSets(); tentarSalvar();
    expect(dialogo()).toHaveTextContent(`${EX}: Back-off`);
    noDialogo("Voltar e preencher");
    expect(carregarRegistros()).toHaveLength(0);
    expect(screen.getByText("Confirmar e Salvar Treino")).toBeInTheDocument();
  });

  it("série não feita: salvar assim mesmo grava só o que foi feito", () => {
    plano(3);
    abrir(); fazerTopSets(); tentarSalvar();
    noDialogo("Salvar assim mesmo");
    expect(carregarRegistros()[0]?.series.map((s) => s.tipo)).toEqual(["top1", "top2"]);
    expect(screen.queryByText("Treino completo!")).toBeNull();
  });

  it.each(["", "abc", "04/11/26", "31/02/2026"])("data inválida (%j): não grava, avisa e mantém o rascunho (EF_02 RG26)", (data) => {
    abrir(); fazerTopSets();
    digitar(/Data do treino/, data);
    tentarSalvar();
    expect(screen.getByText("Confira a data do treino")).toBeInTheDocument();
    expect(screen.queryByText("Treino finalizado!")).toBeNull();
    expect(localStorage.getItem("registros")).toBeNull();
    expect(localStorage.getItem("dadosTreino")).toBeNull();
    expect(localStorage.getItem("rascunho_treino")).not.toBeNull();
  });

  it("data inválida é avisada antes da lista de séries não feitas", () => {
    plano(3);
    abrir(); fazerTopSets();
    digitar(/Data do treino/, "abc");
    tentarSalvar();
    expect(dialogo()).toBeNull();
    expect(screen.getByText("Confira a data do treino")).toBeInTheDocument();
  });

  it("data trocada para inválida na hora de substituir: mantém o treino do dia", () => {
    historico();
    const antes = localStorage.getItem("registros");
    abrir(); fazerTopSets();
    digitar(/Data do treino/, "01/10/2026");
    tentarSalvar();
    digitar(/Data do treino/, "abc");
    fireEvent.click(screen.getByText(/Substituir/, { selector: "button" }));
    expect(screen.getByText("Confira a data do treino")).toBeInTheDocument();
    expect(localStorage.getItem("registros")).toBe(antes);
  });

  it("dia e mês com 1 dígito: grava com 2 no registro e no dadosTreino", () => {
    abrir(); fazerTopSets();
    digitar(/Data do treino/, "4/1/2026");
    tentarSalvar();
    expect(carregarRegistros()[0]?.data).toBe("2026-01-04");
    expect(JSON.parse(localStorage.getItem("dadosTreino")!)[EX].UA.data).toBe("04/01/2026");
  });

  it("nada feito: não grava, avisa e mantém o rascunho", () => {
    abrir(); digitar(/Top Set 1 kg/, "100"); tentarSalvar();
    expect(screen.getByText("Nenhuma série feita")).toBeInTheDocument();
    expect(carregarRegistros()).toHaveLength(0);
    expect(localStorage.getItem("rascunho_treino")).not.toBeNull();
    expect(screen.queryByText("Treino finalizado!")).toBeNull();
  });

  it("falha ao gravar: nada pela metade, erro amigável e rascunho mantido", () => {
    historico();
    const antes = localStorage.getItem("registros");
    abrir(); fazerTopSets();
    const original = Storage.prototype.setItem;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k, v) {
      if (k === "dadosTreino") throw new DOMException("cheio", "QuotaExceededError");
      original.call(this, k, v);
    });
    tentarSalvar();
    expect(localStorage.getItem("registros")).toBe(antes);
    expect(screen.getByRole("alert")).toHaveTextContent("Sem espaço no aparelho");
    expect(localStorage.getItem("rascunho_treino")).not.toBeNull();
    expect(screen.getByText("Confirmar e Salvar Treino")).toBeInTheDocument();
  });
});

describe("Rascunho e saída", () => {
  beforeEach(() => plano(2));
  afterEach(() => vi.restoreAllMocks());

  it("só abrir a sessão com sugestões não conta como treino em andamento", () => {
    historico();
    const aviso = abrir();
    expect(aviso).not.toHaveBeenCalledWith(true);
    digitar(/Top Set 1 reps/, "7");
    expect(aviso).toHaveBeenLastCalledWith(true);
  });

  it("retomar treino com progresso avisa", () => {
    abrir(); digitar(/Top Set 1 kg/, "100");
    cleanup();
    abrir();
    expect(screen.getByText("Treino retomado")).toBeInTheDocument();
  });

  it("rascunho que não pôde ser salvo avisa e não derruba a tela", () => {
    abrir();
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k, v) {
      if (k === "rascunho_treino") throw new DOMException("cheio", "QuotaExceededError");
      original.call(this, k, v);
    });
    digitar(/Top Set 1 kg/, "100");
    expect(screen.getByText("Rascunho não guardado")).toBeInTheDocument();
    expect(screen.getByLabelText(/Top Set 1 kg/)).toHaveValue(100);
  });

  it("rascunho estragado não derruba a tela", () => {
    localStorage.setItem("rascunho_treino", JSON.stringify({ "Upper A": { states: { [EX]: null }, currentIdx: 99 } }));
    abrir();
    expect(screen.getByLabelText(/Top Set 1 kg/)).toBeInTheDocument();
  });
});
