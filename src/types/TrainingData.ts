export interface RegistroTreino {
  data: string;
  pesos?: string[];
  reps?: string[];
  obs?: string;
  exercicio?: string;
  /** RPE da Top Set (1..10). Opcional para manter compatibilidade com registros antigos. */
  rpe?: number;
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
  rpe?: number;
}
