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

type RegistroTreino = {
  data: string;
  pesos: string[];
  reps: string[];
  obs?: string;
  exercicio?: string;
};

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
}

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
      <p><strong>📅 Data:</strong> {label}</p>
      {exercicio && <p><strong>🏋️ Exercício:</strong> {exercicio}</p>}
      {[0, 1, 2].map((i) => {
        const reps = payload[0].payload[`serie${i + 1}`];
        const peso = pesoUsado?.[i] ?? "?";
        return (
          <p key={i}>
            <strong>Série {i + 1}:</strong> {reps} reps x {peso} kg
          </p>
        );
      })}
    </div>
  );
};

export default function Graphics() {
  const [dados, setDados] = useState<LinhaGrafico[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();

    const bruto: DadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const processado: Record<string, LinhaGrafico> = {};

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloId, registro], index) => {
        const { data, pesos = [], reps = [] } = registro;
        const pesoNum = pesos.map(p => parseFloat(p) || 0);
        const repsNum = reps.map(r => parseInt(r) || 0);

        const pesoTotal = pesoNum.reduce((acc, val) => acc + val, 0);
        const cargaMedia = pesoNum.length ? pesoTotal / pesoNum.length : 0;
        if (pesoTotal === 0 && repsNum.every(n => n === 0)) return;

        const cicloInfo = CICLOS.find(c => c.id === cicloId);
        const cicloTitulo = cicloInfo?.titulo || cicloId;
        const dataLabel = `${data} (${cicloTitulo})`;

        processado[`${data}_${cicloId}_${index}`] = {
          data: dataLabel,
          pesoTotal,
          cargaMedia,
          serie1: repsNum[0] || 0,
          serie2: repsNum[1] || 0,
          serie3: repsNum[2] || 0,
          exercicio: registro.exercicio || exercicio,
          pesoUsado: pesoNum,
        };
      });
    });

    const ordenado = Object.values(processado).sort((a, b) => {
      const getDate = (str: string) => {
        const match = str.match(/\d{2}\/\d{2}\/\d{4}/);
        if (!match) return 0;
        const [d, m, y] = match[0].split("/").map(Number);
        return new Date(y, m - 1, d).getTime();
      };
      return getDate(a.data) - getDate(b.data);
    });

    setDados(ordenado);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "960px", margin: "0 auto", padding: "20px" }}>
      {Object.entries(
        dados.reduce((acc, item) => {
          if (!acc[item.exercicio]) acc[item.exercicio] = [];
          acc[item.exercicio].push(item);
          return acc;
        }, {} as Record<string, LinhaGrafico[]>)
      ).map(([exercicio, dadosExercicio]) => (
        <div
          key={exercicio}
          style={{
            marginBottom: "40px",
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ textAlign: "center", fontSize: "20px", marginBottom: "16px", fontWeight: "bold" }}>
            📈 Evolução de Carga e Volume — {exercicio}
          </h2>
  
          <div style={{ width: "100%", height: isMobile ? 300 : 500 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={dadosExercicio}
                margin={{ top: 20, right: isMobile ? 10 : 40, left: isMobile ? 10 : 40, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="data"
                  angle={-30}
                  textAnchor="end"
                  height={isMobile ? 80 : 100}
                  interval={0}
                />
                <YAxis yAxisId="left">
                  <Label value="Soma dos Pesos (kg)" angle={-90} position="insideLeft" />
                </YAxis>
                <YAxis yAxisId="right" orientation="right">
                  <Label value="Carga Média (kg)" angle={90} position="insideRight" />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" />
                <Bar
                  yAxisId="left"
                  dataKey="pesoTotal"
                  name="Soma dos pesos"
                  fill="#3B82F6"
                  barSize={isMobile ? 18 : 30}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cargaMedia"
                  name="Carga média"
                  stroke="#EF4444"
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
