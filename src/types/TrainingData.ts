export type DadosTreino = {
    [exercicio: string]: {
      [ciclo: string]: {
        pesos?: string[];
        reps?: string[];
        obs?: string;
      };
    };
  };