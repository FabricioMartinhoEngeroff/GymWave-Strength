import React from "react";
import { CICLOS, CicloInfo } from "../data/cycles";
import { DadosTreino } from "../types/TrainingData";
import { CicloCard } from "./CyclesCard";
import { salvarDados } from "../utils/storage";

interface ExerciciosSectionProps {
  exercicio: string;
  dados: DadosTreino;
  atualizar: (
    exercicio: string,
    ciclo: string,
    campo: "pesos" | "reps" | "obs",
    valor: string,
    index?: number
  ) => void;
  setDados: React.Dispatch<React.SetStateAction<DadosTreino>>;
}

const ExerciciosSection: React.FC<ExerciciosSectionProps> = ({
  exercicio,
  dados,
  atualizar,
  setDados,
}) => {
  const salvarNoLocalStorage = (
    ciclo: string,
    registroSalvo: {
      data: string;
      pesos: string[];
      reps: string[];
      obs: string;
      exercicio: string;
    }
  ) => {
    setDados((prev) => {
      const atualizados = {
        ...prev,
        [exercicio]: {
          ...prev[exercicio],
          [ciclo]: registroSalvo,
        },
      };
      salvarDados(atualizados);
      return atualizados;
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-2">
      <h2 className="text-lg font-semibold text-center">{exercicio}</h2>

      {CICLOS.map(({ id, percentual, reps}: CicloInfo) => (
        <CicloCard
          key={id}
          ciclo={id}
          percentual={percentual}
          reps={reps}
          objetivo={exercicio}
          value={dados[exercicio]?.[id] || {}}
          onChange={(campo, valor, index) =>
            atualizar(exercicio, id, campo, valor, index)
          }
          onSave={(registroSalvo) => salvarNoLocalStorage(id, registroSalvo)}
        />
      ))}
    </div>
  );
};

export default ExerciciosSection;
