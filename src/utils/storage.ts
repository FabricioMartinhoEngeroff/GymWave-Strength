import type { DadosTreino, Logbook, RegistroExercicio, RegistroTreino } from "../types/TrainingData";

// ─── User-scoped storage keys ─────────────────────────────────────────────────

// O usuário atual é definido só pelo AuthProvider (setCurrentUser), nunca lido do storage.
let _userId = "";

// Keys that hold real user data (not auth infrastructure)
const USER_DATA_KEYS = ["logbook", "dadosTreino", "planoTreino", "sessoes_config"];

// No primeiro login após a mudança, migra dados globais pré-existentes
// para as chaves do usuário, para que nada se perca.
function migrateUnscoped(userId: string) {
  USER_DATA_KEYS.forEach((base) => {
    const scopedKey = `gw:${userId}:${base}`;
    const old = localStorage.getItem(base);
    if (old && old !== "{}" && old !== "[]") {
      // Só migra se o destino ainda não existe
      if (!localStorage.getItem(scopedKey)) {
        localStorage.setItem(scopedKey, old);
      }
      // Remove a chave global para que outro usuário não herde esses dados
      localStorage.removeItem(base);
    }
  });
}

export function setCurrentUser(id: string | null) {
  _userId = id ?? "";
  if (_userId) migrateUnscoped(_userId);
}

export function getCurrentUser(): string {
  return _userId;
}

export function storageKey(base: string): string {
  return _userId ? `gw:${_userId}:${base}` : base;
}

// JSON corrompido (ou de tipo inesperado) vira objeto vazio em vez de lançar.
function lerObjeto<T extends object>(key: string): T {
  const raw = localStorage.getItem(key);
  if (!raw) return {} as T;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const salvarDados = (dados: DadosTreino) => {
  const dadosFiltrados: DadosTreino = {};

  for (const exercicio in dados) {
    const filtrado: Record<string, RegistroTreino> = {};
    dadosFiltrados[exercicio] = filtrado;

    for (const ciclo in dados[exercicio]) {
      const reg = dados[exercicio]?.[ciclo];
      if (!reg) continue;
      const pesos = reg.pesos || [];
      const reps = reg.reps || [];
      const obs = reg.obs?.trim() || "";

      const isVazio =
        pesos.every(p => !p || p.trim() === "") &&
        reps.every(r => !r || r.trim() === "") &&
        obs === "";

      if (!isVazio) {
        filtrado[ciclo] = reg;
      }
    }

    if (Object.keys(dadosFiltrados[exercicio]).length === 0) {
      delete dadosFiltrados[exercicio];
    }
  }

  localStorage.setItem(storageKey("dadosTreino"), JSON.stringify(dadosFiltrados));
};


export const carregarDados = (): DadosTreino => lerObjeto<DadosTreino>(storageKey("dadosTreino"));


function carregarLogbook(): Logbook {
  return lerObjeto<Logbook>(storageKey("logbook"));
}

function salvarLogbook(logbook: Logbook): void {
  localStorage.setItem(storageKey("logbook"), JSON.stringify(logbook));
}


export function salvarRegistro(registro: RegistroExercicio): void {
  const logbook = carregarLogbook();
  const lista = logbook[registro.exercicio] ?? [];
  lista.push(registro);
  logbook[registro.exercicio] = lista;
  salvarLogbook(logbook);
}


export function carregarHistorico(exercicio: string): RegistroExercicio[] {
  const logbook = carregarLogbook();
  return logbook[exercicio] ?? [];
}


export function existeTreinoNaData(treinoId: string, data: string): boolean {
  const logbook = carregarLogbook();
  return Object.values(logbook).some((registros) =>
    registros.some((r) => r.treinoId === treinoId && r.data === data)
  );
}


export function removerTreinoNaData(treinoId: string, data: string): void {
  const logbook = carregarLogbook();
  for (const exercicio in logbook) {
    logbook[exercicio] = (logbook[exercicio] ?? []).filter(
      (r) => !(r.treinoId === treinoId && r.data === data)
    );
  }
  salvarLogbook(logbook);
}


export function ultimoRegistro(exercicio: string, treinoId: string): RegistroExercicio | null {
  const historico = carregarHistorico(exercicio);
  const doTreino = historico.filter((r) => r.treinoId === treinoId);
  if (doTreino.length === 0) return null;
  return doTreino.reduce((a, b) => (a.dataTs > b.dataTs ? a : b));
}


export function exercicioDeveSubirPeso(exercicio: string, treinoId: string): boolean {
  const ultimo = ultimoRegistro(exercicio, treinoId);
  if (!ultimo) return false;
  return ultimo.topSetBateuTeto;
}


export function carregarLogbookCompleto(): Logbook {
  return carregarLogbook();
}
