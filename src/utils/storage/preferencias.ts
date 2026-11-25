import type { EscalaEsforco } from "../esforco";
import { storageKey } from "./chaves";

// Preferências do usuário, guardadas como texto cru (sem JSON).

const ESCALA = "escala_esforco";
const INSTRUCOES = "instrucoesVistas";

export function carregarEscala(): EscalaEsforco {
  return localStorage.getItem(storageKey(ESCALA)) === "RIR" ? "RIR" : "RPE";
}

export function salvarEscala(escala: EscalaEsforco): void {
  localStorage.setItem(storageKey(ESCALA), escala);
}

/** Qualquer texto guardado vale como visto. */
export function instrucoesForamVistas(): boolean {
  return Boolean(localStorage.getItem(storageKey(INSTRUCOES)));
}

export function marcarInstrucoesVistas(): void {
  localStorage.setItem(storageKey(INSTRUCOES), "true");
}
