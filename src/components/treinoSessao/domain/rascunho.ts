import { storageKey } from "../../../utils/storage";
import { sanitizeExerciseState, type ExerciseState } from "./estadoExercicio";

// Rascunho do treino em andamento (RG12): um por sessão, removido só ao salvar.

export type EstadosDaSessao = Record<string, ExerciseState>;

export interface DraftPayload {
  states: EstadosDaSessao;
  currentIdx: number;
}

type DraftStore = Partial<Record<string, DraftPayload>>;

const DRAFT_KEY = () => storageKey("rascunho_treino");

function loadDraftStore(): DraftStore {
  try {
    const raw = localStorage.getItem(DRAFT_KEY());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as DraftStore;
  } catch {
    return {};
  }
}

function saveDraftStore(store: DraftStore) {
  localStorage.setItem(DRAFT_KEY(), JSON.stringify(store));
}

/** Guarda o rascunho; false se o aparelho não deixou (sem espaço ou bloqueado). */
export function saveDraft(sessao: string, states: EstadosDaSessao, idx: number): boolean {
  try {
    const store = loadDraftStore();
    store[sessao] = { states, currentIdx: idx };
    saveDraftStore(store);
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(sessao: string) {
  const store = loadDraftStore();
  delete store[sessao];
  if (Object.keys(store).length === 0) {
    localStorage.removeItem(DRAFT_KEY());
  } else {
    saveDraftStore(store);
  }
}

export function loadDraft(sessao: string): DraftPayload | null {
  const store = loadDraftStore();
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
