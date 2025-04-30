import React from "react";
import { CICLOS } from "../data/cycles";
import { DadosTreino } from "../types/TrainingData"
import { CicloCard } from "./CyclesCard";

interface ExerciciosSectionProps {
  exercicio: string;
  dados: DadosTreino;
  atualizar: (exercicio: string, ciclo: string, campo: string, valor: string) => void;
}

export const ExerciciosSection: React.FC<ExerciciosSectionProps> = ({ exercicio, dados, atualizar }) => (
  <div className="bg-white p-4 rounded-xl shadow space-y-2">
    <h2 className="text-lg font-semibold text-center">{exercicio}</h2>
    {CICLOS.map(({ ciclo, percentual, reps, objetivo }) => (
      <CicloCard
        key={ciclo}
        ciclo={ciclo}
        percentual={percentual}
        reps={reps}
        objetivo={objetivo}
        value={dados[exercicio]?.[ciclo] || {}}
        onChange={(campo, valor) => atualizar(exercicio, ciclo, campo, valor)}
      />
    ))}
  </div>
);