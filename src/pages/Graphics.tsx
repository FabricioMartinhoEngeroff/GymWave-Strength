import { JSX, useEffect, useState } from "react";
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
  repsTotal: number;
  serie1: number;
  serie2: number;
  serie3: number;
  exercicio: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>): JSX.Element | null => {
  if (!active || !payload || !payload.length) return null;
  const { exercicio } = payload[0]?.payload || {};

  return (
    <div style={{ background: "#fff", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}>
      <p><strong>Data:</strong> {label}</p>
      {exercicio && <p><strong>Exercício:</strong> {exercicio}</p>}
      {payload.map((item) => (
        <p key={item.dataKey?.toString()} style={{ color: item.color }}>
          <strong>{item.name}:</strong> {item.value}
        </p>
      ))}
    </div>
  );
};

export default function Graphics() {
  const [dados, setDados] = useState<LinhaGrafico[]>([]);

  useEffect(() => {
    const bruto: DadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    console.log("📦 Dados brutos do localStorage:", bruto);

    // Limpa ciclos sem dados
    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      const ciclosValidos = Object.fromEntries(
        Object.entries(ciclos).filter(([, reg]) => {
          const temData = !!reg?.data;
          const temPesoValido = Array.isArray(reg?.pesos) && reg.pesos.some(p => p && !isNaN(parseFloat(p)));
          const temRepsValido = Array.isArray(reg?.reps) && reg.reps.some(r => r && !isNaN(parseInt(r)));
          return temData && (temPesoValido || temRepsValido);
        })
      );

      if (Object.keys(ciclosValidos).length === 0) {
        delete bruto[exercicio];
      } else {
        bruto[exercicio] = ciclosValidos;
      }
    });

    localStorage.setItem("dadosTreino", JSON.stringify(bruto));

    const processado: Record<string, LinhaGrafico> = {};

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      console.log(`📋 Processando: ${exercicio}`);
      Object.values(ciclos).forEach((registro, index) => {
        const { data } = registro;
        const pesos = Array.isArray(registro.pesos) ? registro.pesos : [];
        const reps = Array.isArray(registro.reps) ? registro.reps : [];

        const pesoNum = pesos.map((p) => isNaN(parseFloat(p)) ? 0 : parseFloat(p));
        const repsNum = reps.map((r) => isNaN(parseInt(r)) ? 0 : parseInt(r));

        const pesoTotal = pesoNum.reduce((acc, peso, i) => acc + peso * (repsNum[i] || 0), 0);
        const repsTotal = repsNum.reduce((a, b) => a + b, 0);

        if (pesoTotal === 0 && repsTotal === 0) return;

        const key = `${data}_${registro.exercicio?.trim() || exercicio}_${index}`;
        processado[key] = {
          data,
          pesoTotal,
          repsTotal,
          serie1: repsNum[0] || 0,
          serie2: repsNum[1] || 0,
          serie3: repsNum[2] || 0,
          exercicio: registro.exercicio || exercicio,
        };
      });
    });

    const ordenado = Object.values(processado).sort((a, b) => {
      const [dA, mA, yA] = a.data.split("/").map(Number);
      const [dB, mB, yB] = b.data.split("/").map(Number);
      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
    });

    console.log("📊 Dados prontos para gráfico:", ordenado);
    setDados(ordenado);
  }, []);

  return (
    <div style={{ width: "100%", height: 500 }}>
      <ResponsiveContainer>
        <ComposedChart data={dados} margin={{ top: 30, right: 50, left: 50, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis yAxisId="left">
            <Label value="Peso total (kg)" angle={-90} position="insideLeft" />
          </YAxis>
          <YAxis yAxisId="right" orientation="right">
            <Label value="Repetições" angle={90} position="insideRight" />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" />
          <Bar yAxisId="left" dataKey="pesoTotal" name="Peso total do dia" fill="#4285F4" barSize={40} />
          <Line yAxisId="right" type="monotone" dataKey="serie1" name="Série 1" stroke="#34A853" dot />
          <Line yAxisId="right" type="monotone" dataKey="serie2" name="Série 2" stroke="#FBBC05" dot />
          <Line yAxisId="right" type="monotone" dataKey="serie3" name="Série 3" stroke="#EA4335" dot />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
