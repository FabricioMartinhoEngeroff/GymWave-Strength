import type { DadosTreino, Logbook, PlanoTreino, RegistroExercicio, RegistroTreino } from "../types/TrainingData";
import { storageKey } from "./storage";

// ─── Formato do backup ────────────────────────────────────────────────────────
// v2 guarda tudo que é dado do usuário. Backups antigos (v1) são só o objeto
// dadosTreino cru — por isso a importação aceita os dois formatos.

export const BACKUP_APP = "gymwave";
export const BACKUP_VERSAO = 2;

const CHAVES_BACKUP = ["dadosTreino", "logbook", "planoTreino", "sessoes_config"] as const;
type ChaveBackup = (typeof CHAVES_BACKUP)[number];

export interface BackupGymwave {
  app: typeof BACKUP_APP;
  versao: number;
  exportadoEm: string;
  dadosTreino: DadosTreino;
  logbook: Logbook;
  planoTreino: PlanoTreino;
  sessoes_config: Record<string, unknown[]>;
}

export interface BackupLido {
  formato: "completo" | "legado";
  dadosTreino: DadosTreino;
  logbook: Logbook;
  planoTreino: PlanoTreino | null;
  sessoes_config: Record<string, unknown[]> | null;
}

export interface ResumoBackup {
  exercicios: number;
  registrosDados: number;
  registrosLogbook: number;
  temPlano: boolean;
}

export interface ResultadoImportacao {
  dadosAdicionados: number;
  dadosPreservados: number;
  logbookAdicionados: number;
  logbookDuplicados: number;
  planoRestaurado: boolean;
  sessoesRestauradas: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHAVES_PROIBIDAS = new Set(["__proto__", "constructor", "prototype"]);

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function entradasSeguras(obj: Record<string, unknown>): [string, unknown][] {
  return Object.entries(obj).filter(([k]) => !CHAVES_PROIBIDAS.has(k));
}

function lerChave<T>(base: ChaveBackup, vazio: T): T {
  const raw = localStorage.getItem(storageKey(base));
  if (!raw) return vazio;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return vazio;
  }
}

function ehRegistroTreino(v: unknown): v is RegistroTreino {
  return ehObjeto(v) && typeof v.data === "string";
}

function ehRegistroExercicio(v: unknown): v is RegistroExercicio {
  return (
    ehObjeto(v) &&
    typeof v.exercicio === "string" &&
    typeof v.treinoId === "string" &&
    typeof v.data === "string" &&
    typeof v.topSetKg === "number"
  );
}

function sanitizarDadosTreino(v: unknown): DadosTreino {
  const out: DadosTreino = {};
  if (!ehObjeto(v)) return out;
  for (const [exercicio, ciclos] of entradasSeguras(v)) {
    if (!ehObjeto(ciclos)) continue;
    const limpos: Record<string, RegistroTreino> = {};
    for (const [ciclo, reg] of entradasSeguras(ciclos)) {
      if (ehRegistroTreino(reg)) limpos[ciclo] = reg;
    }
    if (Object.keys(limpos).length > 0) out[exercicio] = limpos;
  }
  return out;
}

function sanitizarLogbook(v: unknown): Logbook {
  const out: Logbook = {};
  if (!ehObjeto(v)) return out;
  for (const [exercicio, registros] of entradasSeguras(v)) {
    if (!Array.isArray(registros)) continue;
    const validos = registros.filter(ehRegistroExercicio);
    if (validos.length > 0) out[exercicio] = validos;
  }
  return out;
}

function ehBackupLegado(v: Record<string, unknown>): boolean {
  const ciclos = Object.values(v);
  return ciclos.length > 0 && ciclos.every((c) => ehObjeto(c) && Object.values(c).every(ehRegistroTreino));
}

const idRegistro = (r: RegistroExercicio) => `${r.exercicio}|${r.treinoId}|${r.data}`;

// ─── API ──────────────────────────────────────────────────────────────────────

export function montarBackup(agora = new Date()): BackupGymwave {
  return {
    app: BACKUP_APP,
    versao: BACKUP_VERSAO,
    exportadoEm: agora.toISOString(),
    dadosTreino: lerChave<DadosTreino>("dadosTreino", {}),
    logbook: lerChave<Logbook>("logbook", {}),
    planoTreino: lerChave<PlanoTreino>("planoTreino", {}),
    sessoes_config: lerChave<Record<string, unknown[]>>("sessoes_config", {}),
  };
}

/** Lê o texto de um backup (v2 completo ou v1 legado). Lança Error com mensagem para o usuário. */
export function lerBackup(texto: string): BackupLido {
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error("O arquivo não é um JSON válido.");
  }
  if (!ehObjeto(json)) throw new Error("Formato de backup não reconhecido.");

  if (json.app === BACKUP_APP) {
    return {
      formato: "completo",
      dadosTreino: sanitizarDadosTreino(json.dadosTreino),
      logbook: sanitizarLogbook(json.logbook),
      planoTreino: ehObjeto(json.planoTreino) && Object.keys(json.planoTreino).length > 0
        ? (json.planoTreino as PlanoTreino)
        : null,
      sessoes_config: ehObjeto(json.sessoes_config) && Object.keys(json.sessoes_config).length > 0
        ? (json.sessoes_config as Record<string, unknown[]>)
        : null,
    };
  }

  if (ehBackupLegado(json)) {
    return {
      formato: "legado",
      dadosTreino: sanitizarDadosTreino(json),
      logbook: {},
      planoTreino: null,
      sessoes_config: null,
    };
  }

  throw new Error("Formato de backup não reconhecido.");
}

export function resumirBackup(b: BackupLido): ResumoBackup {
  const nomes = new Set([...Object.keys(b.dadosTreino), ...Object.keys(b.logbook)]);
  return {
    exercicios: nomes.size,
    registrosDados: Object.values(b.dadosTreino).reduce((n, c) => n + Object.keys(c).length, 0),
    registrosLogbook: Object.values(b.logbook).reduce((n, l) => n + l.length, 0),
    temPlano: b.planoTreino !== null,
  };
}

/**
 * Mescla o backup nos dados do usuário atual sem apagar nada:
 * registros que já existem localmente são preservados; plano e sessões só
 * são restaurados quando ainda não existem. Antes, grava os *_backup para desfazer.
 */
export function aplicarBackup(b: BackupLido): ResultadoImportacao {
  for (const base of CHAVES_BACKUP) {
    localStorage.setItem(storageKey(`${base}_backup`), localStorage.getItem(storageKey(base)) || "{}");
  }

  const dados = lerChave<DadosTreino>("dadosTreino", {});
  let dadosAdicionados = 0;
  let dadosPreservados = 0;
  for (const [exercicio, ciclos] of Object.entries(b.dadosTreino)) {
    const atual = dados[exercicio] ?? {};
    for (const [ciclo, reg] of Object.entries(ciclos)) {
      if (atual[ciclo]) {
        dadosPreservados++;
      } else {
        atual[ciclo] = reg;
        dadosAdicionados++;
      }
    }
    dados[exercicio] = atual;
  }

  const logbook = lerChave<Logbook>("logbook", {});
  let logbookAdicionados = 0;
  let logbookDuplicados = 0;
  for (const [exercicio, registros] of Object.entries(b.logbook)) {
    const lista = logbook[exercicio] ?? [];
    const existentes = new Set(lista.map(idRegistro));
    for (const reg of registros) {
      if (existentes.has(idRegistro(reg))) {
        logbookDuplicados++;
        continue;
      }
      lista.push(reg);
      existentes.add(idRegistro(reg));
      logbookAdicionados++;
    }
    lista.sort((x, y) => (x.dataTs ?? 0) - (y.dataTs ?? 0));
    logbook[exercicio] = lista;
  }

  const vazio = (base: ChaveBackup) => Object.keys(lerChave<object>(base, {})).length === 0;
  const planoRestaurado = b.planoTreino !== null && vazio("planoTreino");
  const sessoesRestauradas = b.sessoes_config !== null && vazio("sessoes_config");

  localStorage.setItem(storageKey("dadosTreino"), JSON.stringify(dados));
  localStorage.setItem(storageKey("logbook"), JSON.stringify(logbook));
  if (planoRestaurado) localStorage.setItem(storageKey("planoTreino"), JSON.stringify(b.planoTreino));
  if (sessoesRestauradas) localStorage.setItem(storageKey("sessoes_config"), JSON.stringify(b.sessoes_config));

  return { dadosAdicionados, dadosPreservados, logbookAdicionados, logbookDuplicados, planoRestaurado, sessoesRestauradas };
}

export function desfazerBackup(): void {
  for (const base of CHAVES_BACKUP) {
    const salvo = localStorage.getItem(storageKey(`${base}_backup`));
    if (salvo !== null) localStorage.setItem(storageKey(base), salvo);
  }
}
