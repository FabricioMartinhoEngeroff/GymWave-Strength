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
    titulo: "Base técnica",
    percentual: "atual 100%",
    reps: "8 repetições",
    objetivo: "Base técnica, carga confortável",
  },
  {
    id: "C2",
    titulo: "Carga moderada",
    percentual: "Aumentar - 2,5% a 5%",
    reps: "6 repetições",
    objetivo: "Carga um pouco mais pesada",
  },
  {
    id: "C3",
    titulo: "Pico de força",
    percentual: "Aumentar - 5% a 7,5%",
    reps: "4 x 5 repetições",
    objetivo: "Pico de força com técnica limpa",
  },
  {
    id: "C4",
    titulo: "Deload / Técnica",
    percentual: "Diminuir - 15%",
    reps: "10 x 12 repetições",
    objetivo: "Deload, foco técnico e mobilidade",
  },
];