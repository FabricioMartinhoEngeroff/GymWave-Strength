// ── Legacy types (kept for backward compatibility with dadosTreino) ──────────

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

  // Top Set
  topSetKg: number;
  topSetReps: number;
  topSetFaixaMin: number;
  topSetFaixaMax: number;
  topSetBateuTeto: boolean; // reps >= faixaMax -> sobe peso

  // Back-off
  backoffKg: number;
  backoffReps: number;
  backoffFaixaMin: number;
  backoffFaixaMax: number;

  tecnica?: "RP" | null;
  clusterSeries?: { kg: number; reps: number }[];

  // Series count (read from import spreadsheet, persisted per registro)
  seriesValidas: 2 | 3; // 2 = Top Set + Back-off | 3 = + Série Extra

  // Extra set (only present when seriesValidas === 3)
  extraKg?: number;
  extraReps?: number;

  // Progression
  pesoAnterior?: number;
  repsAnterior?: number;
  progrediu: boolean; // true if topSetKg > pesoAnterior

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
