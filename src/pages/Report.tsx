import { useEffect, useState } from "react";
import { carregarDados } from "../utils/storage";
import { DadosTreino } from "../types/TrainingData";
import { CICLOS } from "../data/cycles";

// Define a estrutura de cada linha do relatório
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

    // Itera por exercício e ciclo, transformando os dados brutos em linhas estruturadas
    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([ciclo, registro]) => {
        const { pesos = [], reps = [], obs = "", data = "" } = registro;

        // Extrai o ID do ciclo e busca o nome correspondente
        const cicloId = ciclo.startsWith("Ciclo ")
          ? `C${ciclo.split(" ")[1]}`
          : ciclo;
        const cicloNome = CICLOS.find((c) => c.id === cicloId)?.titulo || "Não definido";

        // Agrupa séries com número, repetições e pesos
        const series = reps.map((rep, index) => ({
          serie: index + 1,
          rep: rep || "-",
          peso: pesos[index] || "-",
        }));

        // Monta a linha final para o relatório
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

  // Filtra os resultados com base na busca por nome do exercício
  const linhasFiltradas = linhas.filter((linha) =>
    linha.exercicio.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto bg-white shadow-xl rounded-xl">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">📋 Relatório de Treinos</h1>

      {/* Campo de busca */}
      <input
        type="text"
        placeholder="Buscar exercício..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full max-w-xs border border-gray-300 rounded px-3 py-2 mb-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Visual MOBILE (opcional e simplificado para espaço reduzido) */}
      <div className="grid md:hidden gap-4">
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

            <p className="mt-2 text-sm"><strong>📝 Observações:</strong> {linha.obs || "-"}</p>
          </div>
        ))}
      </div>

      {/* Visual DESKTOP - formato igual ao Google Sheets */}
      <div className="hidden md:block overflow-x-auto mt-6">
        <table className="min-w-full text-sm border border-gray-300 shadow-md">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th className="px-3 py-2 border text-left">🎯 Série</th>
              <th className="px-3 py-2 border text-left">📅 Data</th>
              <th className="px-3 py-2 border text-left">🏋️ Exercício</th>
              <th className="px-3 py-2 border text-left">📌 Ciclo + Título</th>
              <th className="px-3 py-2 border text-left">🔁 x Reps</th>
              <th className="px-3 py-2 border text-left">🏋️ Peso</th>
              <th className="px-3 py-2 border text-left">📝 Observações</th>
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map((linha, index) =>
              linha.series.map((s, serieIndex) => (
                <tr key={`${index}-${serieIndex}`} className="even:bg-gray-50 hover:bg-blue-50">
                  <td className="px-3 py-2 border">{s.serie}</td>
                  <td className="px-3 py-2 border">{linha.data}</td>
                  <td className="px-3 py-2 border">{linha.exercicio}</td>
                  <td className="px-3 py-2 border">{linha.ciclo}</td>
                  <td className="px-3 py-2 border">{s.rep}</td>
                  <td className="px-3 py-2 border">{s.peso}</td>
                  {/* Só exibe a observação na primeira série */}
                  <td className="px-3 py-2 border">{serieIndex === 0 ? linha.obs || "-" : ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
