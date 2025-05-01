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
    campo: string,
    valor: string | string[],
    index?: number
  ) => void;
  setDados: React.Dispatch<React.SetStateAction<DadosTreino>>; // 👈 adicionamos para atualizar estado corretamente
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
      salvarDados(atualizados); // ✅ salva após atualização real do estado
      return atualizados;
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-2">
      <h2 className="text-lg font-semibold text-center">{exercicio}</h2>

      {CICLOS.map(({ ciclo, percentual, reps }: CicloInfo) => (
        <CicloCard
          key={ciclo}
          ciclo={ciclo}
          percentual={percentual}
          reps={reps}
          objetivo={exercicio}
          value={dados[exercicio]?.[ciclo] || {}}
          onChange={(campo, valor, index) =>
            atualizar(exercicio, ciclo, campo, valor, index)
          }
          onSave={(registroSalvo) => salvarNoLocalStorage(ciclo, registroSalvo)}
        />
      ))}
    </div>
  );
};

export default ExerciciosSection;
