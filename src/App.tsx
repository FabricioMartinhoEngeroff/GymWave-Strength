import { useState, useEffect, useRef } from "react";
import { EXERCICIOS } from "./data/exercise";
import { carregarDados, salvarDados } from "./utils/storage";
import ExerciciosSection from "./components/ExerciseSection";
import { DadosTreino } from "./types/TrainingData";

export default function App() {
  const [dados, setDados] = useState<DadosTreino>(() =>
    carregarDados() || EXERCICIOS.reduce((acc, exercicio) => {
      acc[exercicio] = {};
      return acc;
    }, {} as DadosTreino)
  );

  // 🔒 Evita salvar no primeiro render
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    salvarDados(dados); // ✅ Só salva a partir da segunda renderização
  }, [dados]);

  // Resto igual
  const atualizarCampo = (
    exercicio: string,
    ciclo: string,
    campo: string,
    valor: string | string[]
  ) => {
    setDados((prev) => ({
      ...prev,
      [exercicio]: {
        ...prev[exercicio],
        [ciclo]: {
          ...prev[exercicio]?.[ciclo],
          [campo]: valor,
        },
      },
    }));
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
      <h1 className="text-xl font-bold text-center">Registro de Ciclos de Treino</h1>

      {EXERCICIOS.map((exercicio) => (
        <ExerciciosSection
        key={exercicio}
        exercicio={exercicio}
        dados={dados}
        atualizar={atualizarCampo}
        setDados={setDados} // 👈 adicione isso
      />
      ))}

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
</div>
    </div>
  );
}
