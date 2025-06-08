import React from "react";
import { DadosTreino, RegistroTreino } from "../../types/TrainingData";
import { salvarDados } from "../../utils/storage";
import CicloCard from ".";
import { Button } from "../ui/Button"; // botão já usado no app

export interface ExerciciosSectionProps {
  dados: DadosTreino;
  setDados: React.Dispatch<React.SetStateAction<DadosTreino>>;
}

const ExerciciosSection: React.FC<ExerciciosSectionProps> = ({ dados, setDados }) => {
  const salvarNoLocalStorage = (registro: RegistroTreino & { ciclo: string }) => {
    const { ciclo, exercicio, ...resto } = registro;

    setDados((prev) => {
      const atualizados: DadosTreino = {
        ...prev,
        [String(exercicio)]: {
          ...prev[String(exercicio)],
          [ciclo]: { exercicio, ...resto },
        },
      };

      salvarDados(atualizados);
      return atualizados;
    });
  };

  const exportarDados = () => {
    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dados_treino.json";
    a.click();
  };

  const abrirGraficos = () => {
    salvarDados(dados);
    requestAnimationFrame(() => window.open("/graficos", "_blank"));
  };

  const abrirRelatorio = () => {
    window.open("/relatorio", "_blank");
  };

  const resetarDados = () => {
    localStorage.clear();
    setDados({});
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-6 max-w-md mx-auto">
      <CicloCard onSave={salvarNoLocalStorage} />

      <div className="flex flex-col gap-3">
        <Button type="button" onClick={exportarDados}>
          Exportar Dados
        </Button>
        <Button type="button" onClick={abrirGraficos}>
          Ver Gráficos
        </Button>
        <Button type="button" onClick={abrirRelatorio}>
          Ver Relatório
        </Button>
        <Button type="button" onClick={resetarDados} variant="danger">
          Zerar Dados
        </Button>
      </div>
    </div>
  );
};

export default ExerciciosSection;
