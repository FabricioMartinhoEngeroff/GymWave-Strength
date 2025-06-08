import { useEffect, useRef, useState } from "react";
import { EXERCICIOS } from "../../data/exercise";
import { carregarDados, salvarDados } from "../../utils/storage";
import { DadosTreino, RegistroTreino } from "../../types/TrainingData";
import CicloCard from ".";

export default function ExerciciosSection() {
  const [dados, setDados] = useState<DadosTreino>(() =>
    carregarDados() || EXERCICIOS.reduce((acc, exercicio) => {
      acc[exercicio] = {};
      return acc;
    }, {} as DadosTreino)
  );

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    salvarDados(dados);
  }, [dados]);

  const salvarNoLocalStorage = (registro: RegistroTreino & { ciclo: string }) => {
    const { ciclo, exercicio, ...resto } = registro;

    const atualizados: DadosTreino = {
      ...dados,
      [String(exercicio)]: {
        ...dados[String(exercicio)],
        [`C${registro.ciclo.replace(/\D/g, "")}`]: { exercicio, ...resto },
      },
    };

    salvarDados(atualizados);
    setDados(atualizados);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-6 max-w-md mx-auto">
      <CicloCard onSave={salvarNoLocalStorage} />
    </div>
  );
}
