import { useEffect, useState, JSX } from "react";
import { CICLO_TITULOS } from "../data/titleCycles";
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

// Tipos base
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


// Tooltip com reps x peso
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>): JSX.Element | null => {
  if (!active || !payload?.length) return null;
  const { exercicio, pesoUsado } = payload[0].payload;

  return (
    <div style={{ background: "#fff", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}>
      <p><strong>Data:</strong> {label}</p>
      {exercicio && <p><strong>Exercício:</strong> {exercicio}</p>}
      {["serie1", "serie2", "serie3"].map((key, i) => {
        const reps = payload[0].payload?.[key];
        const peso = pesoUsado?.[i] ?? "?";
        return (
          <p key={key} style={{ color: payload[i + 1]?.color }}>
            <strong>Série {i + 1}:</strong> {reps} reps x {peso} kg
          </p>
        );
      })}
    </div>
  );
};

export default function Graphics() {
  const [dados, setDados] = useState<LinhaGrafico[]>([]);

  useEffect(() => {
    const bruto: DadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");

    const processado: Record<string, LinhaGrafico> = {};

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([ciclo, registro], index) => {
        const { data, pesos, reps } = registro;

        const pesoNum = (pesos ?? []).map(p => parseFloat(p) || 0);
        const repsNum = (reps ?? []).map(r => parseInt(r) || 0);

        const pesoTotal = pesoNum.reduce((acc, val) => acc + val, 0);
        const cargaMedia = pesoNum.length ? (pesoTotal / pesoNum.length) : 0;

        if (pesoTotal === 0 && repsNum.every(n => n === 0)) return;

        const cicloLabel = CICLO_TITULOS[ciclo] ? `${data} (${CICLO_TITULOS[ciclo]})` : data;

        processado[`${data}_${ciclo}_${index}`] = {
          data: cicloLabel,
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
  }, []);

  return (
    <div style={{ width: "100%", height: 500 }}>
      <ResponsiveContainer>
        <ComposedChart data={dados} margin={{ top: 30, right: 50, left: 50, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" angle={-25} textAnchor="end" height={80} />
          <YAxis yAxisId="left">
            <Label value="Soma dos Pesos (kg)" angle={-90} position="insideLeft" />
          </YAxis>
          <YAxis yAxisId="right" orientation="right">
            <Label value="Carga Média (kg)" angle={90} position="insideRight" />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" />

          <Bar yAxisId="left" dataKey="pesoTotal" name="Soma dos pesos" fill="#4285F4" barSize={40} />
          <Line yAxisId="right" type="monotone" dataKey="cargaMedia" name="Carga média" stroke="#FF5722" dot />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
