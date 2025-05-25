import { useEffect, useState } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Search, BarChart2, Calendar } from "lucide-react";
import { CICLOS } from "../data/cycles"; // confirme que esse é mesmo o caminho correto

// Tipagem para um registro de treino individual
interface RegistroTreino {
  data: string;
  pesos: string[];
  reps: string[];
  obs?: string;
  exercicio?: string;
}

// índice de exercícios → índice de ciclos → registro
interface DadosTreino {
  [exercicio: string]: {
    [cicloKey: string]: RegistroTreino;
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

// Tooltip customizado (props tipados como any para evitar conflito de versão)
const CustomTooltip = (props: any) => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;

  const { exercicio, pesoUsado, serie1, serie2, serie3 } =
    payload[0].payload as LinhaGrafico;

  return (
    <div
      style={{
        background: "#2e2e2e",
        padding: 12,
        borderRadius: 8,
        fontSize: 13,
        color: "#fff",
      }}
    >
      <p>
        <Calendar size={16} className="inline-block mr-1" />{" "}
        <strong>Data:</strong> {label}
      </p>
      {exercicio && (
        <p>
          <strong>Exercício:</strong> {exercicio}
        </p>
      )}
      {[serie1, serie2, serie3].map((r, i) => (
        <p key={i}>
          <strong>Série {i + 1}:</strong> {r} rep × {pesoUsado[i] ?? "?"} kg
        </p>
      ))}
    </div>
  );
};

export default function Graphics() {
  const [dadosAgrupados, setDadosAgrupados] = useState<
    Record<string, LinhaGrafico[]>
  >({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const bruto: DadosTre
