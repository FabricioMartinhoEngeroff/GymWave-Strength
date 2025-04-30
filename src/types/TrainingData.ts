export type DadosTreino = {
    [exercicio: string]: {
      [ciclo: string]: {
        peso?: string;
        obs?: string;
      };
    };
  };