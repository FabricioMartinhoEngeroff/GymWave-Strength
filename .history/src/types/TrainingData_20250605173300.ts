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



export interface LinhaRelatorio {
  data: string;
  exercicio: string;
  ciclo: string;
  series: SerieInfo[];
  obs?: string;
}