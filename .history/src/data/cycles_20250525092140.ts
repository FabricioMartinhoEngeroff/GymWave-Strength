export interface CicloInfo {
  id: string;
  titulo: string;
  percentual: string;
  reps: string;
  objetivo: string;
}

export const CICLOS: CicloInfo[] = [
  {
    id: "Cycle 1",
    titulo: "Technical Base",
    percentual: "-10% of previous peak",
    reps: "8 repetitions",
    objetivo: "Technical base with comfortable load",
  },
  {
    id: "Cycle 2",
    titulo: "Moderate Load",
    percentual: "-5% to -2.5% from peak",
    reps: "6 repetitions",
    objetivo: "Medium load with strong execution",
  },
  {
    id: "Cycle 3",
    titulo: "New Strength Peak",
    percentual: "0% to +5% of previous peak",
    reps: "4 to 5 repetitions",
    objetivo: "Strength peak with clean technique",
  },
  {
    id: "Cycle 4",
    titulo: "Deload / Technique",
    percentual: "-15% of previous peak",
    reps: "10 to 12 repetitions",
    objetivo: "Deload focusing on technique and mobility",
  },
];
