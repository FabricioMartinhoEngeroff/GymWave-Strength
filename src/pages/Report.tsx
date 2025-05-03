import { useEffect, useState } from "react";
import { carregarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";

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

        const cicloId = ciclo.startsWith("Ciclo ")
          ? `C${ciclo.split(" ")[1]}`
          : ciclo;

        const cicloNome = CICLOS.find((c) => c.id === cicloId)?.titulo || "Não definido";

        const series = reps.map((rep, index) => ({
          serie: index + 1,
          rep: rep || "-",
          peso: pesos[index] || "-",
        }));

        geradas.push({
          data,
          exercicio,
          ciclo: cicloNome,
          series,
          obs,
        });
      });
    });

    setLinhas(geradas);
  }, []);

  const linhasFiltradas = linhas.filter((linha) =>
    linha.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white shadow-xl rounded-xl">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">📋 Relatório de Treinos</h1>

      <input
        type="text"
        placeholder="Buscar exercício..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full max-w-xs border border-gray-300 rounded px-3 py-2 mb-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="grid gap-4">
        {linhasFiltradas.map((linha, idx) => (
          <div key={idx} className="border rounded-lg p-4 shadow-sm bg-gray-50">
            <p><strong>📅 Data:</strong> {linha.data}</p>
            <p><strong>🏋️ Exercício:</strong> {linha.exercicio}</p>
            <p><strong>📌 Ciclo:</strong> {linha.ciclo}</p>

            <div className="grid grid-cols-3 text-sm text-center mt-2 font-semibold">
              <span>🎯 Série</span>
              <span>🔁 Reps</span>
              <span>🏋️ Peso</span>
            </div>

            {linha.series.map((s) => (
              <div key={s.serie} className="grid grid-cols-3 text-sm text-center border-t py-1">
                <span>{s.serie}</span>
                <span>{s.rep}</span>
                <span>{s.peso}</span>
              </div>
            ))}

            {linha.obs && (
              <p className="mt-2 text-sm"><strong>📝 Observações:</strong> {linha.obs}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
