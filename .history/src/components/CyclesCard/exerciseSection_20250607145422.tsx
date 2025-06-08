import React from "react";
import { DadosTreino, RegistroTreino } from "../../types/TrainingData";
import { salvarDados } from "../../utils/storage";
import CicloCard from ".";

export interface ExerciciosSectionProps {
  dados: DadosTreino;
  setDados: React.Dispatch<React.SetStateAction<DadosTreino>>;
}

const ExerciciosSection: React.FC<ExerciciosSectionProps> = ({ setDados }) => {
  const salvarNoLocalStorage = (registro: RegistroTreino & { ciclo: string }) => {
    const { ciclo, exercicio, ...resto } = registro;

    setDados((prev) => {
      const atualizados: DadosTreino = {
        ...prev,
        [exercicio]: {
          ...prev[exercicio],
          [ciclo]: { exercicio, ...resto },
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

      <CicloCard onSave={salvarNoLocalStorage} />
    </div>
  );
};

export default ExerciciosSection;
