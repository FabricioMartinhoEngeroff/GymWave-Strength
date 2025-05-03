import { useEffect, useState } from "react";
import { carregarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";

interface LinhaRelatorio {
  data: string;
  exercicio: string;
  ciclo: string;
  serie: number;
  peso: string;
  repeticoes: string;
  obs?: string;
}

export default function Report() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);

  useEffect(() => {
    const bruto: DadosTreino = carregarDados();
    const geradas: LinhaRelatorio[] = [];

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloId, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "Sem data" } = registro;

        const cicloInfo = CICLOS.find(c => c.id === cicloId);
        const nomeCiclo = cicloInfo ? cicloInfo.titulo : "Não definido";

        const series = [0, 1, 2].map((i) => ({
          data,
          exercicio,
          ciclo: nomeCiclo,
          serie: i + 1,
          peso: pesos[i] || "-",
          repeticoes: reps[i] || "-",
          obs: i === 0 ? obs : "", // apenas na primeira série
        }));

        geradas.push(...series);
      });
    });

    setLinhas(geradas);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-xl rounded-xl">
      <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
        📋 Relatório de Treinos
      </h1>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm md:text-base border border-gray-300 shadow-md">
          <thead className="bg-green-100 text-gray-800 uppercase text-sm tracking-wider">
            <tr>
              <th className="border border-gray-300 px-4 py-2">📅 Data</th>
              <th className="border border-gray-300 px-4 py-2">🏋️ Exercício</th>
              <th className="border border-gray-300 px-4 py-2">📌 Ciclo</th>
              <th className="border border-gray-300 px-4 py-2"># Série</th>
              <th className="border border-gray-300 px-4 py-2">🔁 Reps</th>
              <th className="border border-gray-300 px-4 py-2">🏋️ Peso (kg)</th>
              <th className="border border-gray-300 px-4 py-2">📝 Observações</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, index) => (
              <tr key={index} className="even:bg-gray-50 hover:bg-blue-50">
                <td className="border border-gray-300 px-4 py-2">{linha.data}</td>
                <td className="border border-gray-300 px-4 py-2">{linha.exercicio}</td>
                <td className="border border-gray-300 px-4 py-2">{linha.ciclo}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{linha.serie}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{linha.repeticoes}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{linha.peso}</td>
                <td className="border border-gray-300 px-4 py-2">{linha.obs || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
