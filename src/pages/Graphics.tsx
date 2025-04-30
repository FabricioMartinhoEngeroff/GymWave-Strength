
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { EXERCICIOS } from "../data/exercise";
import { CICLOS } from "../data/cycles";

const dadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");

export default function Graficos() {
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-xl font-bold text-center">Evolução dos Pesos</h1>
      {EXERCICIOS.map(exercicio => {
        const data = CICLOS.map(({ ciclo }) => ({
          ciclo,
          peso: Number(dadosTreino[exercicio]?.[ciclo]?.peso || 0)
        }));

        return (
          <div key={exercicio} className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2 text-center">{exercicio}</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ciclo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="peso" stroke="#8884d8" name="Peso (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}