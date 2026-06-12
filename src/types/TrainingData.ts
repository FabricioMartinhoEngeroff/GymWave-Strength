export interface PlanoExercicio {
  ordem: number;
  series_validas: number; // fallback quando não há dado por ciclo
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
  /** Chave do ciclo no storage (ex.: "C1" ou legado "Ciclo 1"). */
  cicloKey: string;
  ciclo: string;
  series: SerieInfo[];
  obs?: string;
}
