export interface CicloInfo {
  id: string;
  titulo: string;
  percentual: string;
  reps: string;
  objetivo: string;
}

export const CICLOS: CicloInfo[] = [
  {
    id: "Ciclo1",
    titulo: "Base técnica",
    percentual: "-10% do pico anterior",
    reps: "8 repetições",
    objetivo: "Base técnica com carga confortável",
  },
  {
    id: "Ciclo2",
    titulo: "Carga moderada",
    percentual: "-5% a -2,5% do pico",
    reps: "6 repetições",
    objetivo: "Carga média com execução forte",
  },
  {
    id: "C3",
    titulo: "Novo Pico de Força",
    percentual: "0% a +5% do pico anterior",
    reps: "4 a 5 repetições",
    objetivo: "Pico de força com técnica limpa",
  },
  {
    id: "Ciclo 4",
    titulo: "Deload / Técnica",
    percentual: "-15% do pico anterior",
    reps: "10 a 12 repetições",
    objetivo: "Deload, foco técnico e mobilidade",
  },
];