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
    titulo: "C1 Pico",
    sigla: "Pico",
    repMin: 5,
    repMax: 6,
    seriesValidas: 2,
    objetivo: "Força máxima. PR work — testar limite com técnica limpa.",
  },
  {
    id: "C2",
    titulo: "C2 Intensificação",
    sigla: "Intens.",
    repMin: 7,
    repMax: 8,
    seriesValidas: 2,
    objetivo: "Força e volume. Carga crescente com volume moderado.",
  },
  {
    id: "C3",
    titulo: "C3 Acumulação",
    sigla: "Acum.",
    repMin: 9,
    repMax: 12,
    seriesValidas: 2,
    objetivo: "Volume alto. Acumular trabalho muscular e construir base.",
  },
  {
    id: "C4",
    titulo: "C4 Deload",
    sigla: "Deload",
    repMin: 12,
    repMax: 15,
    seriesValidas: 2,
    objetivo: "Recuperação ativa. Zerar fadiga, manter movimento.",
  },
];
