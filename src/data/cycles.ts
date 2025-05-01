export interface CicloInfo {
  ciclo: string;
  percentual: string;
  reps: string;
  objetivo: string;
}

export const CICLOS: CicloInfo[] = [
  {
    ciclo: "Ciclo 1",
    percentual: "atual 100% ",
    reps: "8 repetições",
    objetivo: "Base técnica, carga confortável",
  },
  {
    ciclo: "Ciclo 2",
    percentual: "Aumentar - 2,5% a 5% ",
    reps: "6 repetições",
    objetivo: "Carga um pouco mais pesada",
  },
  {
    ciclo: "Ciclo 3",
    percentual: "Aumentar -  5% a 7,5% ",
    reps: "4 x 5 repetições",
    objetivo: "Pico de força com técnica limpa",
  },
  {
    ciclo: "Ciclo 4",
    percentual: "Diminuir - 15% ",
    reps: "10 x 12 repetições",
    objetivo: "Deload, foco técnico e mobilidade",
  },
];
