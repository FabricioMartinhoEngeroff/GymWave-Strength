import { storageKey } from "./chaves";

// Rascunho do treino em andamento (EF_02 RG12): um objeto só, com uma entrada por sessão.

const RASCUNHO = "rascunho_treino";

type Rascunhos<T> = Partial<Record<string, T>>;

/** Nunca lança: ilegível ou bloqueado vale como "sem rascunho". Quem chama confere o conteúdo. */
export function carregarRascunhos<T = unknown>(): Rascunhos<T> {
  try {
    const raw = localStorage.getItem(storageKey(RASCUNHO));
    if (!raw) return {};
    const lido: unknown = JSON.parse(raw);
    return typeof lido === "object" && lido !== null ? (lido as Rascunhos<T>) : {};
  } catch {
    return {};
  }
}

export function salvarRascunhos<T>(porSessao: Rascunhos<T>): void {
  localStorage.setItem(storageKey(RASCUNHO), JSON.stringify(porSessao));
}

/** Apaga o rascunho de todas as sessões. */
export function limparRascunhos(): void {
  localStorage.removeItem(storageKey(RASCUNHO));
}
