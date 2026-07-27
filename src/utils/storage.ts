import type { DadosTreino, Logbook, RegistroExercicio } from "../types/TrainingData";

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


export const carregarDados = (): DadosTreino => {
  const local = localStorage.getItem("dadosTreino");
  if (local) {
    return JSON.parse(local);
  }
  return {};
};


function carregarLogbook(): Logbook {
  const raw = localStorage.getItem("logbook");
  if (raw) return JSON.parse(raw);
  return {};
}

function salvarLogbook(logbook: Logbook): void {
  localStorage.setItem("logbook", JSON.stringify(logbook));
}


export function salvarRegistro(registro: RegistroExercicio): void {
  const logbook = carregarLogbook();
  if (!logbook[registro.exercicio]) {
    logbook[registro.exercicio] = [];
  }
  logbook[registro.exercicio].push(registro);
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
    logbook[exercicio] = logbook[exercicio].filter(
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
