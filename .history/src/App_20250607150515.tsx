import { useState, useEffect, useRef } from "react";
import { EXERCICIOS } from "./data/exercise";
import { carregarDados, salvarDados } from "./utils/storage";
import ExerciciosSection from "../src/components/cyclesCard/";
import { DadosTreino } from "./types/TrainingData";

export default function App() {
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

  // 👉 Função para resetar completamente
  const resetarDados = () => {
    localStorage.clear(); // limpa tudo
    isFirstRender.current = true; // evita auto-save no reset
    setDados(() =>
      EXERCICIOS.reduce((acc, exercicio) => {
        acc[exercicio] = {};
        return acc;
      }, {} as DadosTreino)
    );
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

  return (
    <div className="p-4 space-y-6">
      <ExerciciosSection dados={dados} setDados={setDados} />

      <div className="flex flex-col gap-3 mt-6 w-full max-w-md mx-auto">
        <button
          onClick={exportarDados}
          className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl font-semibold shadow-md transition"
        >
          📦 Exportar Dados
        </button>

        <button
          onClick={abrirGraficos}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-semibold shadow-md transition"
        >
          📊 Ver Gráficos
        </button>

        <button
          onClick={() => window.open("/relatorio", "_blank")}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl font-semibold shadow-md transition"
        >
          📋 Ver Relatório
        </button>

        <button
          onClick={resetarDados}
          className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl font-semibold shadow-md transition"
        >
          🗑️ Zerar Dados
        </button>
      </div>
    </div>
  );
}
