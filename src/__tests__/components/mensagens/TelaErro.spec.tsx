/**
 * ErrorBoundary, TelaErro e ErroDeRota → components/mensagens (EF_09 RG10, RG11)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "../../../components/mensagens/ErrorBoundary";
import { ErroDeRota } from "../../../components/mensagens/ErroDeRota";
import { TelaErro } from "../../../components/mensagens/TelaErro";
import { setCurrentUser } from "../../../utils/storage";

function Quebra({ ok = false }: { ok?: boolean }) {
  if (!ok) throw new Error("segredo técnico ana@teste.com");
  return <p>tela boa</p>;
}

const baixados: { nome: string; conteudo: string }[] = [];

describe("Tela de erro amigável", () => {
  const { location } = window;
  const reload = vi.fn();

  beforeEach(() => {
    baixados.length = 0;
    vi.spyOn(console, "error").mockImplementation(() => {});
    Object.defineProperty(window, "location", { configurable: true, value: { ...location, reload } });
    let texto = "";
    vi.stubGlobal("Blob", class { constructor(partes: string[]) { texto = partes.join(""); } });
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      baixados.push({ nome: this.download, conteudo: texto });
    });
    setCurrentUser("u1");
  });

  afterEach(() => {
    setCurrentUser(null);
    Object.defineProperty(window, "location", { configurable: true, value: location });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    reload.mockClear();
  });

  it("sem erro mostra o conteúdo", () => {
    render(<ErrorBoundary><Quebra ok /></ErrorBoundary>);
    expect(screen.getByText("tela boa")).toBeInTheDocument();
  });

  it("com erro mostra a tela amigável, sem detalhe técnico", () => {
    render(<ErrorBoundary><Quebra /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("Algo deu errado");
    expect(screen.getByRole("alert")).toHaveTextContent("Seus dados estão salvos");
    expect(document.body).not.toHaveTextContent("segredo técnico");
  });

  it("Recarregar recarrega a página", () => {
    render(<ErrorBoundary><Quebra /></ErrorBoundary>);
    fireEvent.click(screen.getByText("Recarregar"));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("Baixar backup gera o JSON do usuário e confirma", () => {
    localStorage.setItem("gw:u1:registros", JSON.stringify([{ id: "a", data: "2026-10-01", sessao: "UA", exercicio: "supino_reto_barra", series: [] }]));
    render(<ErrorBoundary><Quebra /></ErrorBoundary>);
    fireEvent.click(screen.getByText("Baixar backup"));
    expect(baixados[0]?.nome).toMatch(/^gymwave_backup_\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(baixados[0]!.conteudo)).toMatchObject({ app: "gymwave", registros: [{ id: "a" }] });
    expect(screen.getByText("Backup baixado")).toBeInTheDocument();
  });

  it("se o backup falhar, avisa em vez de quebrar de novo", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { throw new Error("x"); });
    render(<TelaErro />);
    fireEvent.click(screen.getByText("Baixar backup"));
    expect(screen.getByText("Não foi possível gerar o backup.")).toBeInTheDocument();
  });

  it("sem usuário logado não oferece backup", () => {
    setCurrentUser(null);
    render(<TelaErro />);
    expect(screen.queryByText("Baixar backup")).toBeNull();
    expect(screen.getByText("Recarregar")).toBeInTheDocument();
  });

  it("trocar de aba (key) recupera", () => {
    const { rerender } = render(<ErrorBoundary key="a"><Quebra /></ErrorBoundary>);
    rerender(<ErrorBoundary key="b"><Quebra ok /></ErrorBoundary>);
    expect(screen.getByText("tela boa")).toBeInTheDocument();
  });

  it("erro em rota mostra a tela amigável no lugar da do roteador", () => {
    const router = createMemoryRouter([{ path: "/", element: <Quebra />, errorElement: <ErroDeRota /> }]);
    render(<RouterProvider router={router} />);
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("Unexpected Application Error");
  });
});
