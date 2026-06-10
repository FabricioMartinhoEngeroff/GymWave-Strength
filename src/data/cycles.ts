export interface CicloInfo {
  id: string;
  titulo: string;
  sigla: string;
  repMin: number;
  repMax: number;
  seriesValidas: number;
  objetivo: string;
}

export const CICLOS: CicloInfo[] = [
  {
    id: "C1",
    titulo: "C1 Acumulação",
    sigla: "Acum.",
    repMin: 10,
    repMax: 15,
    seriesValidas: 3,
    objetivo: "Alto volume. Acumular trabalho muscular e fadiga.",
  },
  {
    id: "C2",
    titulo: "C2 Intensificação",
    sigla: "Intens.",
    repMin: 6,
    repMax: 10,
    seriesValidas: 3,
    objetivo: "Volume moderado com carga crescente. Intensidade sobe.",
  },
  {
    id: "C3",
    titulo: "C3 Pico",
    sigla: "Pico",
    repMin: 3,
    repMax: 6,
    seriesValidas: 2,
    objetivo: "Alta intensidade. Testar o limite com técnica limpa.",
  },
  {
    id: "C4",
    titulo: "C4 Deload",
    sigla: "Deload",
    repMin: 10,
    repMax: 15,
    seriesValidas: 2,
    objetivo: "Recuperação. Manter movimento, zerar fadiga acumulada.",
  },
];
