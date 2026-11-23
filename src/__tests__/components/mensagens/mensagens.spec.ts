/**
 * mensagens → store global (EF_09 RG1, RG2, RG4, RG5)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mensagens } from "../../../components/mensagens/mensagens";
import { AVISOS, CONFIRMACOES, DURACAO_MS } from "../../../components/mensagens/domain/catalogo";

const ids = () => mensagens.estado().avisos.map((a) => a.id);

describe("mensagens — store", () => {
  beforeEach(() => mensagens.limpar());

  it("mostra o texto do catálogo e aceita texto próprio", () => {
    mensagens.mostrar("treino_salvo");
    mensagens.mostrar("conquista_recorde", { texto: "Supino: 100kg × 8" });
    expect(mensagens.estado().avisos).toMatchObject([
      { id: "treino_salvo", tipo: "sucesso", titulo: "Treino finalizado!" },
      { id: "conquista_recorde", tipo: "conquista", texto: "Supino: 100kg × 8" },
    ]);
  });

  it("repetida renova em vez de empilhar", () => {
    mensagens.mostrar("sem_conexao");
    const antes = mensagens.estado().avisos[0]!;
    mensagens.mostrar("sem_conexao");
    expect(ids()).toEqual(["sem_conexao"]);
    expect(mensagens.estado().avisos[0]!.renovacao).toBeGreaterThan(antes.renovacao);
    mensagens.mostrar("conquista_recorde", { texto: "A" });
    mensagens.mostrar("conquista_recorde", { texto: "B" });
    expect(ids()).toHaveLength(3);
  });

  it("fechar remove só a mensagem pedida", () => {
    mensagens.mostrar("treino_salvo");
    mensagens.mostrar("sem_conexao");
    mensagens.fechar(mensagens.estado().avisos[0]!.chave);
    expect(ids()).toEqual(["sem_conexao"]);
  });

  it("confirmação: confirma, cancela e chama o callback certo", () => {
    const sim = vi.fn(), nao = vi.fn();
    mensagens.confirmar("limpar_tudo", { aoConfirmar: sim, aoCancelar: nao });
    expect(mensagens.estado().dialogo).toMatchObject({ id: "limpar_tudo", perigo: true });
    mensagens.responder(true);
    expect(sim).toHaveBeenCalledOnce();
    expect(mensagens.estado().dialogo).toBeNull();
    mensagens.confirmar("limpar_tudo", { aoConfirmar: sim, aoCancelar: nao });
    mensagens.responder(false);
    expect(nao).toHaveBeenCalledOnce();
    expect(sim).toHaveBeenCalledOnce();
  });

  it("um diálogo por vez: o segundo espera o primeiro", () => {
    mensagens.confirmar("limpar_tudo", { aoConfirmar: vi.fn() });
    mensagens.confirmar("excluir_registro", { aoConfirmar: vi.fn() });
    expect(mensagens.estado().dialogo?.id).toBe("limpar_tudo");
    mensagens.responder(false);
    expect(mensagens.estado().dialogo?.id).toBe("excluir_registro");
  });

  it("avisa os assinantes e para depois de cancelar a assinatura", () => {
    const fn = vi.fn();
    const sair = mensagens.assinar(fn);
    mensagens.mostrar("treino_salvo");
    sair();
    mensagens.mostrar("sem_conexao");
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("catálogo (RG2, RG3)", () => {
  it.each(Object.entries(AVISOS))("%s tem título e texto, sem termo técnico", (_id, a) => {
    expect(a.titulo).toBeTruthy();
    expect(a.texto).toBeTruthy();
    expect(`${a.titulo} ${a.texto}`).not.toMatch(/exception|undefined|null|json|stack|localStorage|quota/i);
  });

  it.each(Object.entries(CONFIRMACOES))("%s tem título, texto e os dois botões", (_id, c) => {
    expect([c.titulo, c.texto, c.cancelar, c.confirmar].every(Boolean)).toBe(true);
  });

  it("só erro não some sozinho", () => {
    expect(DURACAO_MS).toEqual({ sucesso: 5000, info: 5000, aviso: 8000, conquista: 8000, erro: null });
  });
});
