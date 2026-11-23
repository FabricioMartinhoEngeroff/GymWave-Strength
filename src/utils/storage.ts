import { deveSubirPeso } from "./esforco";
import { serieFeita } from "./seriesValidas";
import type { DadosTreino, Logbook, RegistroExercicio, RegistroTreino } from "../types/TrainingData";
import {
  comIdUnico,
  dataBRparaISO,
  logbookParaRegistros,
  nomeExercicio,
  paraRegistro,
  registrosParaLogbook,
  sanitizarRegistros,
  slugExercicio,
  type Registro,
} from "./registros";

// ─── User-scoped storage keys ─────────────────────────────────────────────────

// O usuário atual é definido só pelo AuthProvider (setCurrentUser), nunca lido do storage.
let _userId = "";

// Keys that hold real user data (not auth infrastructure)
const USER_DATA_KEYS = ["registros", "logbook", "dadosTreino", "planoTreino", "sessoes_config"];

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

// ─── Proteção contra perda de dados (EF_09 RG12/RG13) ─────────────────────────

type OuvinteCorrompido = (base: string) => void;
const ouvintes = new Set<OuvinteCorrompido>();

/** Chamado quando um dado guardado não pôde ser lido. Devolve a função que para de ouvir. */
export function ouvirDadosCorrompidos(fn: OuvinteCorrompido): () => void {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

/** Copia o original ilegível antes que qualquer gravação passe por cima. */
function guardarCorrompido(base: string, raw: string): void {
  const prefixo = storageKey(`${base}_corrompido`);
  const copias = Object.keys(localStorage).filter((k) => k.startsWith(prefixo));
  if (copias.some((k) => localStorage.getItem(k) === raw)) return;
  try {
    localStorage.setItem(copias.length === 0 ? prefixo : `${prefixo}_${copias.length + 1}`, raw);
  } catch {
    // Sem espaço para a cópia: o aviso ainda orienta a baixar o backup.
  }
  ouvintes.forEach((fn) => fn(base));
}

// JSON corrompido (ou de tipo inesperado) vira objeto vazio em vez de lançar.
function lerObjeto<T extends object>(key: string): T {
  return parseObjeto<T>(localStorage.getItem(key)) ?? ({} as T);
}

function ehObjeto(v: unknown): v is object {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseObjeto<T extends object>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return ehObjeto(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

/** Lê um objeto guardado do usuário (plano, sessões…); ilegível vira vazio. */
export function lerObjetoSalvo<T extends object = Record<string, unknown>>(base: string): T {
  return lerObjeto<T>(storageKey(base));
}

const CHAVES_TREINO = ["registros", "logbook", "logbook_v1_backup", "dadosTreino", "planoTreino", "sessoes_config"];

/** Grava tudo ou nada: se algo falhar, os dados de treino voltam ao que eram e o erro segue. */
export function emTransacao<T>(gravar: () => T): T {
  const antes = CHAVES_TREINO.map((base) => {
    const chave = storageKey(base);
    return { chave, valor: localStorage.getItem(chave) };
  });
  try {
    return gravar();
  } catch (erro) {
    // Apaga primeiro o que cresceu, para sobrar espaço para o valor original.
    antes.forEach(({ chave, valor }) => localStorage.getItem(chave) !== valor && localStorage.removeItem(chave));
    antes.forEach(({ chave, valor }) => {
      if (valor !== null && localStorage.getItem(chave) === null) localStorage.setItem(chave, valor);
    });
    throw erro;
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


export function carregarDados(): DadosTreino {
  const raw = localStorage.getItem(storageKey("dadosTreino"));
  const lido = parseObjeto(raw);
  if (!raw) return {};
  const dados: DadosTreino = {};
  let intacto = lido !== null;
  for (const [exercicio, ciclos] of Object.entries(lido ?? {})) {
    if (!ehObjeto(ciclos)) {
      intacto = false;
      continue;
    }
    const bons = Object.entries(ciclos).filter(([, reg]) => ehObjeto(reg));
    if (bons.length < Object.keys(ciclos).length) intacto = false;
    dados[exercicio] = Object.fromEntries(bons) as DadosTreino[string];
  }
  if (!intacto) guardarCorrompido("dadosTreino", raw);
  return dados;
}


// ─── Histórico de treinos (formato v3: lista de registros) ────────────────────
// Cada treino salvo vira um registro novo na chave "registros"; nada é sobrescrito.
// O resto do app continua recebendo o Logbook (agrupado por exercício), montado
// a partir dessa lista.

/** Converte o logbook v2 (se existir) na primeira leitura e guarda o original como backup. */
function migrarLogbookV2(): Registro[] | null {
  const antigo = localStorage.getItem(storageKey("logbook"));
  if (antigo === null) return null;
  const lista = logbookParaRegistros(lerObjeto<Logbook>(storageKey("logbook")));
  salvarRegistros(lista);
  localStorage.setItem(storageKey("logbook_v1_backup"), antigo);
  localStorage.removeItem(storageKey("logbook"));
  return lista;
}

export function carregarRegistros(): Registro[] {
  const raw = localStorage.getItem(storageKey("registros"));
  if (raw === null) return migrarLogbookV2() ?? [];
  try {
    const lido: unknown = JSON.parse(raw);
    const validos = sanitizarRegistros(lido);
    // Registro inválido sairia na próxima gravação: guarda o original antes.
    if (!Array.isArray(lido) || validos.length < lido.length) guardarCorrompido("registros", raw);
    return validos;
  } catch {
    guardarCorrompido("registros", raw);
    return [];
  }
}

export function salvarRegistros(lista: Registro[]): void {
  localStorage.setItem(storageKey("registros"), JSON.stringify(lista));
}

/** Guarda uma cópia do histórico para desfazer uma importação. */
export function fotografarRegistros(): void {
  carregarRegistros(); // garante a migração antes da cópia
  localStorage.setItem(storageKey("registros_backup"), localStorage.getItem(storageKey("registros")) ?? "[]");
}

export function restaurarRegistros(): void {
  const salvo = localStorage.getItem(storageKey("registros_backup"));
  if (salvo !== null) localStorage.setItem(storageKey("registros"), salvo);
}

export function limparRegistros(): void {
  localStorage.removeItem(storageKey("registros"));
  localStorage.removeItem(storageKey("logbook"));
}

function carregarLogbook(): Logbook {
  return registrosParaLogbook(carregarRegistros());
}

export function salvarLogbookCompleto(logbook: Logbook): void {
  salvarRegistros(logbookParaRegistros(logbook));
}


export function salvarRegistro(registro: RegistroExercicio): void {
  const lista = carregarRegistros();
  const ids = new Set(lista.map((r) => r.id));
  lista.push(comIdUnico(paraRegistro(registro), ids));
  salvarRegistros(lista);
}


export function carregarHistorico(exercicio: string): RegistroExercicio[] {
  const logbook = carregarLogbook();
  return logbook[nomeExercicio(slugExercicio(exercicio), exercicio)] ?? [];
}


export function existeTreinoNaData(treinoId: string, data: string): boolean {
  const iso = dataBRparaISO(data);
  return carregarRegistros().some((r) => r.sessao === treinoId && r.data === iso);
}


export function removerTreinoNaData(treinoId: string, data: string): void {
  const iso = dataBRparaISO(data);
  salvarRegistros(carregarRegistros().filter((r) => !(r.sessao === treinoId && r.data === iso)));
}


export function ultimoRegistro(exercicio: string, treinoId: string): RegistroExercicio | null {
  const historico = carregarHistorico(exercicio);
  const doTreino = historico.filter((r) => r.treinoId === treinoId);
  if (doTreino.length === 0) return null;
  return doTreino.reduce((a, b) => (a.dataTs > b.dataTs ? a : b));
}


/** Treinos do exercício na sessão, do mais recente para o mais antigo, sem os deloads. */
function treinosNormais(exercicio: string, treinoId: string): RegistroExercicio[] {
  return carregarHistorico(exercicio)
    .filter((r) => r.treinoId === treinoId && !r.isDeload)
    .sort((a, b) => b.dataTs - a.dataTs);
}

/** Último treino que serve de referência: deload só vale se não houver outro (RG15). */
export function ultimoTreinoNormal(exercicio: string, treinoId: string): RegistroExercicio | null {
  return treinosNormais(exercicio, treinoId)[0] ?? ultimoRegistro(exercicio, treinoId);
}

/**
 * Valores que abrem nos campos (RG5.1): o último treino normal e, para cada série
 * que não foi feita nele, a última vez em que aquela série foi feita.
 */
export function referenciaDoExercicio(exercicio: string, treinoId: string): RegistroExercicio | null {
  const ultimo = ultimoTreinoNormal(exercicio, treinoId);
  if (!ultimo) return null;
  const anteriores = treinosNormais(exercicio, treinoId);
  const mesmoModelo = (r: RegistroExercicio) => (r.seriesValidas === 4) === (ultimo.seriesValidas === 4);
  const ref = { ...ultimo };

  if (ref.topSetKg <= 0) {
    const r = anteriores.find((a) => serieFeita(a.topSetKg, a.topSetReps));
    if (r) Object.assign(ref, { topSetKg: r.topSetKg, topSetReps: r.topSetReps });
  }
  if (!serieFeita(ref.backoffKg, ref.backoffReps)) {
    const r = anteriores.find((a) => serieFeita(a.backoffKg, a.backoffReps));
    if (r) Object.assign(ref, { backoffKg: r.backoffKg, backoffReps: r.backoffReps });
  }
  if (!serieFeita(ref.extraKg, ref.extraReps)) {
    const r = anteriores.find((a) => mesmoModelo(a) && serieFeita(a.extraKg, a.extraReps));
    if (r) Object.assign(ref, { extraKg: r.extraKg, extraReps: r.extraReps });
  }
  if (!serieFeita(ref.serie4Kg, ref.serie4Reps)) {
    const r = anteriores.find((a) => mesmoModelo(a) && serieFeita(a.serie4Kg, a.serie4Reps));
    if (r) Object.assign(ref, { serie4Kg: r.serie4Kg, serie4Reps: r.serie4Reps });
  }
  return ref;
}


export function exercicioDeveSubirPeso(exercicio: string, treinoId: string): boolean {
  const ultimo = ultimoTreinoNormal(exercicio, treinoId);
  if (!ultimo) return false;
  return deveSubirPeso(ultimo.topSetBateuTeto, ultimo.topSetRpe);
}


export function carregarLogbookCompleto(): Logbook {
  return carregarLogbook();
}
