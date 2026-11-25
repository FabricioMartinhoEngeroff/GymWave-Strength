import { carregarRascunhos, limparRascunhos, salvarRascunhos } from "../../../utils/storage";
import { sanitizeExerciseState, type ExerciseState } from "./estadoExercicio";

// Rascunho do treino em andamento (RG12): um por sessão, removido só ao salvar.

export type EstadosDaSessao = Record<string, ExerciseState>;

export interface DraftPayload {
  states: EstadosDaSessao;
  currentIdx: number;
}

/** Guarda o rascunho; false se o aparelho não deixou (sem espaço ou bloqueado). */
export function saveDraft(sessao: string, states: EstadosDaSessao, idx: number): boolean {
  try {
    const store = carregarRascunhos<DraftPayload>();
    store[sessao] = { states, currentIdx: idx };
    salvarRascunhos(store);
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(sessao: string) {
  const store = carregarRascunhos<DraftPayload>();
  delete store[sessao];
  if (Object.keys(store).length === 0) {
    limparRascunhos();
  } else {
    salvarRascunhos(store);
  }
}

export function loadDraft(sessao: string): DraftPayload | null {
  const store = carregarRascunhos<DraftPayload>();
  const payload = store[sessao];
  if (!payload || typeof payload !== "object") return null;
  if (!payload.states || typeof payload.states !== "object") return null;
  const sanitized: EstadosDaSessao = {};
  for (const [key, val] of Object.entries(payload.states)) {
    sanitized[key] = sanitizeExerciseState(val);
  }
  const idx = Number.isInteger(payload.currentIdx) ? payload.currentIdx : 0;
  return { states: sanitized, currentIdx: idx };
}

/** O rascunho só vale se tiver ao menos um exercício que ainda existe na sessão. */
export function rascunhoCombina(states: EstadosDaSessao, nomes: Set<string>): boolean {
  return Object.keys(states).some((n) => nomes.has(n));
}
