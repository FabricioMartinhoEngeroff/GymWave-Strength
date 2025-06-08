import React from "react";
import // src/components/exerciseSection/index.tsx
import React from "react";

// 1) CICLOS e CicloInfo → estão em src/data/cycles.ts,
//    então sob o exerciseSection/ eu preciso subir duas pastas (..) e entrar em data
import { CICLOS, CicloInfo } from "../../data/cycles";

// 2) CicloCard → está em src/components/cyclesCard/CicloCard.tsx.
//    Da pasta exerciseSection, preciso subir uma pasta (..) e entrar em cyclesCard
import CicloCard from "../cyclesCard/CicloCard";

// 3) DadosTreino → está em src/types/TrainingData.ts. 
//    Então também subo duas pastas para pegar types
import { DadosTreino } from "../../types/TrainingData";

// 4) salvarDados → está em src/utils/storage.ts, 
//    então a partir de exerciseSection subo duas pastas e entro em utils
import { salvarDados } from "../../utils/storage";
{ CICLOS, CicloInfo } from "../../data/cycles";
import CicloCard from "../cyclesCard/CicloCard";
import { DadosTreino } from "../../types/TrainingData";
import { salvarDados } from "../../utils/storage";


export interface ExerciciosSectionProps {
  dados: DadosTreino;
  setDados: React.Dispatch<React.SetStateAction<DadosTreino>>;
}

const ExerciciosSection: React.FC<ExerciciosSectionProps> = ({
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

      {CICLOS.map(({ id, percentual, reps }: CicloInfo) => (
        <CicloCard
          key={id}
          ciclo={id}
          percentual={percentual}
          reps={reps}
          onSave={(registroSalvo) => salvarNoLocalStorage(id, registroSalvo)}
        />
      ))}
    </div>
  );
};

export default ExerciciosSection;
