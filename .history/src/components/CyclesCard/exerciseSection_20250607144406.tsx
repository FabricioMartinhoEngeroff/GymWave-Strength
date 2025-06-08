import React from "react";
import { DadosTreino } from "../../types/TrainingData";
import { salvarDados } from "../../utils/storage";
import CicloCard from "../cyclesCard";

export interface ExerciciosSectionProps {
  dados: DadosTreino;
  setDados: React.Dispatch<React.SetStateAction<DadosTreino>>;
}

const ExerciciosSection: React.FC<ExerciciosSectionProps> = ({ setDados }) => {
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
        [registroSalvo.exercicio]: {
          ...prev[registroSalvo.exercicio],
          [ciclo]: registroSalvo,
        },
      };
      salvarDados(atualizados);
      return atualizados;
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-2">
      <h1 className="text-lg font-semibold text-center">
        Registro de Ciclos de Treino
      </h1>

      <CicloCard onSave={(registro) => salvarNoLocalStorage(registro.ciclo, registro)} />
    </div>
  );
};

export default ExerciciosSection;
