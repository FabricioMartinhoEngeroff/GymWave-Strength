import { useEffect, useState } from "react";
import { carregarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";
import { Search } from "lucide-react";

interface LinhaRelatorio {
  data: string;
  exercicio: string;
  ciclo: string;
  series: {
    serie: number;
    rep: string;
    peso: string;
  }[];
  obs?: string;
}

export default function Report() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const bruto: DadosTreino = carregarDados();
    const geradas: LinhaRelatorio[] = [];

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([ciclo, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "" } = registro;

        const cicloId = ciclo.startsWith("Ciclo ") ? `C${ciclo.split(" ")[1]}` : ciclo;
        const cicloNome = CICLOS.find((c) => c.id === cicloId)?.titulo || "Ciclo não identificado";

        const series = reps.map((rep, index) => ({
          serie: index + 1,
          rep: rep || "-",
          peso: pesos[index] || "-",
        }));

        geradas.push({ data, exercicio, ciclo: cicloNome, series, obs });
      });
    });

    setLinhas(geradas);
  }, []);

  const linhasFiltradas = linhas.filter((linha) =>
    linha.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 text-black px-4 py-6">
      <h1 className="text-2xl font-bold text-center mb-6 flex justify-center items-center gap-2">
        📋 <span>Relatório de Treinos</span>
      </h1>

      {/* Campo de busca redondo com ícone */}
      <div className="max-w-md mx-auto relative mb-8">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {linhasFiltradas.map((linha, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
          >
            <p className="text-sm mb-2 text-gray-600">
              📅 <strong className="text-gray-800">Data:</strong> {linha.data}
            </p>
            <p className="text-sm mb-2 text-gray-600">
              🏋️ <strong className="text-gray-800">Exercício:</strong> {linha.exercicio}
            </p>
            <p className="text-sm mb-4 text-gray-600">
              📌 <strong className="text-gray-800">Ciclo:</strong> {linha.ciclo}
            </p>

            <div className="text-sm">
              <p className="mb-2 text-gray-500 font-medium">
                🎯 Série 🔁 Reps 🏋️ Peso
              </p>
              {linha.series.map((serie) => (
                <p
                  key={serie.serie}
                  className="mb-1 px-3 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700"
                >
                  Série {serie.serie}: {serie.rep} reps x {serie.peso} kg
                </p>
              ))}
            </div>

            {linha.obs && (
              <p className="mt-4 text-sm text-gray-600 border-t pt-3">
                📝 <strong>Observações:</strong> {linha.obs}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

