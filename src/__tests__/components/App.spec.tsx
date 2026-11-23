/**
 * App → saída da tela de treino e erro por aba (EF_09 RG7, RG10)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { dialogo, noDialogo, renderComMensagens } from "./mensagens/helpers";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(async () => {}), quebrar: false }));
vi.mock("../../components/login/context/useAuth", () => ({ useAuth: () => ({ user: { name: "Ana" }, signOut: mocks.signOut }) }));
vi.mock("../../components/treinoSessao/TreinoSessao", () => ({
  default: ({ onUnsavedChanges }: { onUnsavedChanges: (v: boolean) => void }) => (
    <button onClick={() => onUnsavedChanges(true)}>treinar</button>
  ),
}));
vi.mock("../../components/volumeLoad/VolumeLoad", () => ({
  default: () => { if (mocks.quebrar) throw new Error("x"); return <p>tela volume</p>; },
}));
vi.mock("../../components/exportar/Exportar", () => ({ default: () => <p>tela exportar</p> }));
vi.mock("../../components/graphic/GraphicsContainer", () => ({ GraphicsContainer: () => <p>tela graficos</p> }));
vi.mock("../../components/report", () => ({ default: () => <p>tela relatorio</p> }));

import App from "../../App";

const aba = (nome: string) => fireEvent.click(screen.getByText(nome));
const abrir = () => renderComMensagens(<MemoryRouter><App /></MemoryRouter>);

describe("App — saída do treino", () => {
  beforeEach(() => { mocks.signOut.mockClear(); mocks.quebrar = false; });

  it("sem treino em andamento troca direto", () => {
    abrir(); aba("Volume");
    expect(screen.getByText("tela volume")).toBeInTheDocument();
    expect(dialogo()).toBeNull();
  });

  it("com treino em andamento pergunta; ficar mantém a tela", () => {
    abrir(); aba("treinar"); aba("Volume");
    expect(dialogo()).toHaveTextContent("Treino em andamento");
    noDialogo("Continuar treinando");
    expect(screen.getByText("treinar")).toBeInTheDocument();
  });

  it("sair troca de aba e não pergunta de novo entre as outras abas", () => {
    abrir(); aba("treinar"); aba("Volume"); noDialogo("Sair da tela");
    expect(screen.getByText("tela volume")).toBeInTheDocument();
    aba("Exportar");
    expect(dialogo()).toBeNull();
    expect(screen.getByText("tela exportar")).toBeInTheDocument();
  });

  it("tocar na própria aba Registrar não pergunta", () => {
    abrir(); aba("treinar"); aba("Registrar");
    expect(dialogo()).toBeNull();
  });

  it("sair da conta com treino em andamento pergunta antes", () => {
    abrir(); aba("treinar"); aba("Sair");
    expect(mocks.signOut).not.toHaveBeenCalled();
    noDialogo("Sair da conta");
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("sair da conta sem treino em andamento é direto", () => {
    abrir(); aba("Sair");
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});

describe("App — erro por aba (RG10)", () => {
  beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); mocks.quebrar = true; });
  afterEach(() => { mocks.quebrar = false; vi.restoreAllMocks(); });

  it("a navegação continua e trocar de aba se recupera", () => {
    abrir(); aba("Volume");
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    aba("Exportar");
    expect(screen.getByText("tela exportar")).toBeInTheDocument();
    mocks.quebrar = false;
    aba("Volume");
    expect(screen.getByText("tela volume")).toBeInTheDocument();
  });
});
