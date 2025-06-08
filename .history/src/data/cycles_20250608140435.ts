export interface CicloInfo {
  id: string;
  titulo: string;
  percentual: string;
  reps: string;
  objetivo: string;
}

export const CICLOS: CicloInfo[] = [
  {
    id: "C1",
    titulo: "ciclo1Técnica",
    percentual: "-10%",
    reps: "8 repetições",
    objetivo: "Base técnica com carga confortável",
  },
  {
    id: "C2",
    titulo: "Carga moderada",
    percentual: "-5%",
    reps: "6 repetições",
    objetivo: "Carga média com execução forte",
  },
  {
    id: "C3",
    titulo: "Pico de Força",
    percentual: "0%",
    reps: "4 repetições",
    objetivo: "Pico de força com técnica limpa",
  },
  {
    id: "C4",
    titulo: "Deload",
    percentual: "-17%",
    reps: "10 repetições",
    objetivo: "Deload, foco técnico e mobilidade",
  },
];
