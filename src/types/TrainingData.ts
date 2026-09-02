
export interface RegistroTreino {
  data: string;
  pesos?: string[];
  reps?: string[];
  obs?: string;
  exercicio?: string;
}

export type DadosTreino = {
  [exercicio: string]: {
    [ciclo: string]: RegistroTreino;
  };
};

export interface SerieInfo {
  serie: number;
  rep: string;
  peso: string;
}

export interface LinhaRelatorio {
  data: string;
  exercicio: string;
  cicloKey: string;
  ciclo: string;
  series: SerieInfo[];
  obs?: string;
}

// ── New Saizen logbook types ────────────────────────────────────────────────

export interface RegistroExercicio {
  exercicio: string;
  treinoId: string; // "UA", "UB", "LA", "LB", "BR"
  data: string; // "DD/MM/YYYY"
  dataTs: number;

  // ── Modelo de séries v6 ────────────────────────────────────────────────────
  // Os 3 slots de carga abaixo mapeiam para os blocos da UI assim (sem migração
  // de dados — nomes de campo mantidos por compatibilidade):
  //   topSetKg/Reps  = Top Set 1
  //   backoffKg/Reps = Top Set 2  (sempre presente; pesado, na faixa do Top Set)
  //   extraKg/Reps   = Back-off   (~50% da carga, só quando seriesValidas === 3)
  // O volume soma os 3 slots; a contagem de séries válidas conta cada slot
  // preenchido, então 2 válidas = TS1+TS2 e 3 válidas = TS1+TS2+Back-off.

  // Top Set 1
  topSetKg: number;
  topSetReps: number;
  topSetFaixaMin: number;
  topSetFaixaMax: number;
  topSetBateuTeto: boolean; // reps >= faixaMax -> sobe peso

  // Top Set 2 (slot histórico "backoff")
  backoffKg: number;
  backoffReps: number;
  backoffFaixaMin: number;
  backoffFaixaMax: number;

  tecnica?: "RP" | null;
  // Cluster Set: cada série cluster é um grupo de blocos (kg×reps). Série 1 fica
  // em clusterSeries; a Série 2 em clusterSeries2 (registros antigos têm só a 1).
  // O volume soma todos os blocos das duas; cada série não-vazia conta como 1
  // série válida nos contadores.
  clusterSeries?: { kg: number; reps: number }[];
  clusterSeries2?: { kg: number; reps: number }[];

  // Series count (read from import spreadsheet, persisted per registro)
  seriesValidas: 2 | 3; // 2 = 2 Top Sets | 3 = 2 Top Sets + Back-off

  // Back-off leve (~50%) — slot histórico "extra", só presente quando seriesValidas === 3
  extraKg?: number;
  extraReps?: number;

  // Progression
  pesoAnterior?: number;
  repsAnterior?: number;
  progrediu: boolean; // true if topSetKg > pesoAnterior
  isDeload?: boolean;

  obs?: string;
}

// localStorage key: "logbook"
// structure: { [exercicio]: RegistroExercicio[] }
export type Logbook = Record<string, RegistroExercicio[]>;

// ── Legacy plan type (kept for backward compatibility) ──────────────────────

export interface PlanoExercicio {
  ordem: number;
  series_validas: number;
  series_C1?: number;
  series_C2?: number;
  series_C3?: number;
  series_C4?: number;
}

export type PlanoTreino = {
  [sessao: string]: {
    [exercicio: string]: PlanoExercicio;
  };
};
