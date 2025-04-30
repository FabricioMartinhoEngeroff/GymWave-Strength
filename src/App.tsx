import { useState, useEffect } from "react";
import { EXERCICIOS } from "./data/exercise";
import { carregarDados, salvarDados } from "./utils/storage";
import { ExerciciosSection } from "./components/ExerciseSection";
import { DadosTreino } from "./types//TrainingData";

export default function App() {
  const [dados, setDados] = useState<DadosTreino>(() => carregarDados());

  useEffect(() => {
    salvarDados(dados);
  }, [dados]);

  const atualizarCampo = (exercicio: string, ciclo: string, campo: string, valor: string) => {
    setDados(prev => ({
      ...prev,
      [exercicio]: {
        ...prev[exercicio],
        [ciclo]: {
          ...prev[exercicio]?.[ciclo],
          [campo]: valor
        }
      }
    }));
  };

  const exportarDados = () => {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dados_treino.json";
    a.click();
  };

  const abrirGraficos = () => {
    window.open("/graficos", "_blank");
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-center">Registro de Ciclos de Treino</h1>

      {EXERCICIOS.map(exercicio => (
        <ExerciciosSection
          key={exercicio}
          exercicio={exercicio}
          dados={dados}
          atualizar={atualizarCampo}
        />
      ))}

      <div className="flex flex-col gap-2">
        <button
          onClick={exportarDados}
          className="w-full bg-green-600 text-white py-2 rounded-xl font-bold"
        >
          Exportar Dados
        </button>
        <button
          onClick={abrirGraficos}
          className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold"
        >
          Ver Gráficos
        </button>
      </div>
    </div>
  );
}
