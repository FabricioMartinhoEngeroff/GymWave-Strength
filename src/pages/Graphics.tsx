// Tipos e dependências
import { useEffect, useState } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Label,
} from "recharts";
import type { TooltipProps } from "recharts";
import { CICLOS } from "../data/cycles";

// Tipos do treino e estrutura do gráfico
interface RegistroTreino {
  data: string;
  pesos: string[];
  reps: string[];
  obs?: string;
  exercicio?: string;
}

interface DadosTreino {
  [exercicio: string]: {
    [ciclo: string]: RegistroTreino;
  };
}

interface LinhaGrafico {
  data: string;
  pesoTotal: number;
  cargaMedia: number;
  serie1: number;
  serie2: number;
  serie3: number;
  exercicio: string;
  pesoUsado: number[];
  cicloTitulo?: string; // incluído para possível uso futuro
}

// Tooltip customizada para mostrar detalhes do gráfico
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const { exercicio, pesoUsado } = payload[0].payload;

  return (
    <div style={{
      background: "#fff",
      padding: "12px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      fontSize: "13px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <p><strong>📅 Date:</strong> {label}</p>
      {exercicio && <p><strong>🏋️ Exercise:</strong> {exercicio}</p>}
      {[0, 1, 2].map((i) => {
        const reps = payload[0].payload[`serie${i + 1}`];
        const peso = pesoUsado?.[i] ?? "?";
        return (
          <p key={i}>
            <strong>Set {i + 1}:</strong> {reps} reps x {peso} kg
          </p>
        );
      })}
    </div>
  );
};

export default function Graphics() {
  const [dadosAgrupados, setDadosAgrupados] = useState<Record<string, LinhaGrafico[]>>({});
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  // Atualiza o estado de responsividade com base na largura da tela
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();

    // Pega os dados brutos do localStorage
    const bruto: DadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const dadosPorExercicio: Record<string, LinhaGrafico[]> = {};

    // Processa os dados por exercício e ciclo
    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloId, registro]) => {
        const { data, pesos = [], reps = [] } = registro;
        const pesoNum = pesos.map(p => parseFloat(p) || 0);
        const repsNum = reps.map(r => parseInt(r) || 0);

        const pesoTotal = pesoNum.reduce((acc, val) => acc + val, 0);
        const cargaMedia = pesoNum.length ? pesoTotal / pesoNum.length : 0;

        // Pula registros vazios
        if (pesoTotal === 0 && repsNum.every(n => n === 0)) return;

        // Encontra o título do ciclo com base no ID
        const cicloInfo = CICLOS.find(c => c.id === cicloId);
        const cicloTitulo = cicloInfo?.titulo || cicloId;

        const dataLabel = `${data}`;
        const exercicioFinal = registro.exercicio || exercicio;

        // Inicializa o array se ainda não existir
        if (!dadosPorExercicio[exercicioFinal]) dadosPorExercicio[exercicioFinal] = [];

        // Adiciona os dados estruturados
        dadosPorExercicio[exercicioFinal].push({
          data: dataLabel,
          pesoTotal,
          cargaMedia,
          serie1: repsNum[0] || 0,
          serie2: repsNum[1] || 0,
          serie3: repsNum[2] || 0,
          exercicio: exercicioFinal,
          pesoUsado: pesoNum,
          cicloTitulo,
        });
      });
    });

    // Ordena os dados por data para cada exercício
    Object.keys(dadosPorExercicio).forEach((exercicio) => {
      dadosPorExercicio[exercicio].sort((a, b) => {
        const getDate = (str: string) => {
          const [d, m, y] = str.split("/").map(Number);
          return new Date(y, m - 1, d).getTime();
        };
        return getDate(a.data) - getDate(b.data);
      });
    });

    setDadosAgrupados(dadosPorExercicio);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Renderização dos gráficos por exercício
  return (
    <div style={{ width: "100%", maxWidth: "960px", margin: "0 auto", padding: "20px" }}>
      {Object.entries(dadosAgrupados).map(([exercicio, dadosExercicio]) => (
        <div
          key={exercicio}
          style={{
            marginBottom: "40px",
            background: "#1f2937",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid #374151",
            color: "white",
            overflowX: "auto"
          }}
        >
          <h2 style={{ textAlign: "center", fontSize: "18px", marginBottom: "16px", fontWeight: "bold" }}>
            📈 Load & Volume Progress — {exercicio}
          </h2>

          <div style={{ width: "100%", minWidth: isMobile ? 320 : undefined, height: isMobile ? 260 : 400 }}>
            <ResponsiveContainer width="100%">
              <ComposedChart
                data={dadosExercicio}
                margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="data"
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fill: "#e5e7eb", fontSize: 12 }}
                />
                <YAxis yAxisId="left" tick={{ fill: "#e5e7eb" }}>
                  <Label value="Volume (kg)" angle={-90} position="insideLeft" fill="#e5e7eb" />
                </YAxis>
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#e5e7eb" }}>
                  <Label value="Avg Load (kg)" angle={90} position="insideRight" fill="#e5e7eb" />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: "#e5e7eb" }} />
                <Bar
                  yAxisId="left"
                  dataKey="pesoTotal"
                  name="Volume"
                  fill="#3B82F6"
                  barSize={isMobile ? 14 : 24}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cargaMedia"
                  name="Avg Load"
                  stroke="#FBBF24"
                  dot
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}