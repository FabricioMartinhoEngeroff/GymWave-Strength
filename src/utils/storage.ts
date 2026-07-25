import type { DadosTreino, Logbook, RegistroExercicio } from "../types/TrainingData";

// ── Legacy dadosTreino functions (kept for backward compatibility) ───────────

/**
 * Salva os dados de treino no localStorage, ignorando ciclos vazios.
 */
export const salvarDados = (dados: DadosTreino) => {
  const dadosFiltrados: DadosTreino = {};

  for (const exercicio in dados) {
    dadosFiltrados[exercicio] = {};

    for (const ciclo in dados[exercicio]) {
      const reg = dados[exercicio][ciclo];
      const pesos = reg.pesos || [];
      const reps = reg.reps || [];
      const obs = reg.obs?.trim() || "";

      const isVazio =
        pesos.every(p => !p || p.trim() === "") &&
        reps.every(r => !r || r.trim() === "") &&
        obs === "";

      if (!isVazio) {
        dadosFiltrados[exercicio][ciclo] = reg;
      }
    }

    if (Object.keys(dadosFiltrados[exercicio]).length === 0) {
      delete dadosFiltrados[exercicio];
    }
  }

  localStorage.setItem("dadosTreino", JSON.stringify(dadosFiltrados));
};

/**
 * Carrega os dados de treino do localStorage.
 */
export const carregarDados = (): DadosTreino => {
  const local = localStorage.getItem("dadosTreino");
  if (local) {
    return JSON.parse(local);
  }
  return {};
};

// ── New Logbook functions ───────────────────────────────────────────────────

function carregarLogbook(): Logbook {
  const raw = localStorage.getItem("logbook");
  if (raw) return JSON.parse(raw);
  return {};
}

function salvarLogbook(logbook: Logbook): void {
  localStorage.setItem("logbook", JSON.stringify(logbook));
}

/**
 * Saves a new exercise record to the logbook.
 */
export function salvarRegistro(registro: RegistroExercicio): void {
  const logbook = carregarLogbook();
  if (!logbook[registro.exercicio]) {
    logbook[registro.exercicio] = [];
  }
  logbook[registro.exercicio].push(registro);
  salvarLogbook(logbook);
}

/**
 * Loads full history for an exercise from the logbook.
 */
export function carregarHistorico(exercicio: string): RegistroExercicio[] {
  const logbook = carregarLogbook();
  return logbook[exercicio] ?? [];
}

/**
 * Checks whether a workout for the given session (treinoId) was already
 * saved on the given date, across any exercise in the logbook.
 * Used to warn the user before creating a duplicate same-day record.
 */
export function existeTreinoNaData(treinoId: string, data: string): boolean {
  const logbook = carregarLogbook();
  return Object.values(logbook).some((registros) =>
    registros.some((r) => r.treinoId === treinoId && r.data === data)
  );
}

/**
 * Removes every record for the given session (treinoId) saved on the given
 * date, across all exercises. Used to replace a same-day record instead of
 * duplicating it when the user explicitly confirms an overwrite.
 */
export function removerTreinoNaData(treinoId: string, data: string): void {
  const logbook = carregarLogbook();
  for (const exercicio in logbook) {
    logbook[exercicio] = logbook[exercicio].filter(
      (r) => !(r.treinoId === treinoId && r.data === data)
    );
  }
  salvarLogbook(logbook);
}

/**
 * Gets the most recent record for a given exercise in a specific training session.
 * Used to pre-fill all input blocks (Top Set, Back-off, Série Extra) with
 * the previous workout's actual values as suggestions.
 */
export function ultimoRegistro(exercicio: string, treinoId: string): RegistroExercicio | null {
  const historico = carregarHistorico(exercicio);
  const doTreino = historico.filter((r) => r.treinoId === treinoId);
  if (doTreino.length === 0) return null;
  return doTreino.reduce((a, b) => (a.dataTs > b.dataTs ? a : b));
}

/**
 * Checks if an exercise should increase weight (hit the ceiling in last session).
 */
export function exercicioDeveSubirPeso(exercicio: string, treinoId: string): boolean {
  const ultimo = ultimoRegistro(exercicio, treinoId);
  if (!ultimo) return false;
  return ultimo.topSetBateuTeto;
}

/**
 * Gets the full logbook for all exercises.
 */
export function carregarLogbookCompleto(): Logbook {
  return carregarLogbook();
}
