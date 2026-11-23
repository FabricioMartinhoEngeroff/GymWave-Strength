import type { Logbook, RegistroExercicio } from "../../../types/TrainingData";
import { calcEpley, extractReferenceBlock } from "../../../utils/epleyCalc";
import type { IdAviso } from "../../mensagens/domain/catalogo";

export interface Conquista {
  id: Extract<IdAviso, `conquista_${string}`>;
  titulo?: string;
  texto?: string;
}

interface Entrada {
  salvos: RegistroExercicio[];
  /** Histórico de antes deste treino. */
  historico: Logbook;
  /** Tudo feito: nenhum exercício pulado nem série pendente. */
  completo: boolean;
  totalTreinos: number;
}

const rm1 = (r: RegistroExercicio) => {
  const ref = extractReferenceBlock(r);
  return ref ? calcEpley(ref.peso, ref.reps) : 0;
};

function ehRecorde(r: RegistroExercicio, anteriores: RegistroExercicio[] = []): boolean {
  if (r.isDeload) return false;
  const melhor = Math.max(0, ...anteriores.map(rm1));
  return melhor > 0 && rm1(r) > melhor;
}

const MARCOS = [1, 10, 25, 50];
const ehMarco = (n: number) => MARCOS.includes(n) || (n > 0 && n % 100 === 0);

/** Conquistas deste treino (EF_09 RG9). */
export function conquistasDoTreino({ salvos, historico, completo, totalTreinos }: Entrada): Conquista[] {
  const recordes = salvos
    .filter((r) => ehRecorde(r, historico[r.exercicio]))
    .map((r) => {
      const ref = extractReferenceBlock(r);
      return `${r.exercicio}: ${ref?.peso}kg × ${ref?.reps}`;
    });

  const conquistas: Conquista[] = [];
  if (recordes.length > 0) conquistas.push({ id: "conquista_recorde", texto: recordes.join(" · ") });
  if (completo) conquistas.push({ id: "conquista_treino_completo" });
  if (ehMarco(totalTreinos)) {
    conquistas.push({ id: "conquista_marco", titulo: totalTreinos === 1 ? "Primeiro treino!" : `${totalTreinos} treinos!` });
  }
  return conquistas;
}
