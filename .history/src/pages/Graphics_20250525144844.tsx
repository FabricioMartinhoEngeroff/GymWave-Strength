import { useEffect, useState } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Search, BarChart2, Calendar } from "lucide-react";
import type { TooltipProps } from "recharts";
import { CICLOS } from "../data/cycles";

// Tipagem para um registro de treino individual
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
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const { exercicio, pesoUsado, serie1, serie2, serie3 } =
    payload[0].payload;

  return (
    <div
      style={{
        background: "#fff",
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 8,
        fontSize: 13,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <p>
        <Calendar className="inline-block mr-1" size={16} />{" "}
        <strong>Data:</strong> {label}
      </p>
      {exercicio && <p><strong>Exercício:</strong> {exercicio}</p>}
      {[serie1, serie2, serie3].map((reps, i) => (
        <p key={i}>
          <strong>Série {i + 1}:</strong> {reps} repetições x{" "}
          {pesoUsado?.[i] ?? "?"} kg
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

    const bruto: DadosTreino = JSON.parse(
      localStorage.getItem("dadosTreino") || "{}"
    );
    const dadosPorExercicio: Record<string, LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloKey, registro]) => {
        const { data, pesos = [], reps = [] } = registro;
        const pesoNum = pesos.map((p) => parseFloat(p) || 0);
        const repsNum = reps.map((r) => parseInt(r) || 0);

        const pesoTotal = pesoNum.reduce((acc, val) => acc + val, 0);
        if (pesoTotal === 0 && repsNum.every((n) => n === 0)) return;
        const cargaMedia = pesoNum.length
          ? pesoTotal / pesoNum.length
          : 0;

        const cicloInfo = CICLOS.find((c) => c.id === cicloKey);
        const cicloTitulo = cicloInfo?.id || cicloInfo?.titulo || cicloKey;
        const dataLabel = `${data.slice(0, 5)} (${cicloTitulo})`;

        const nomeExe = registro.exercicio || exercicio;
        if (!dadosPorExercicio[nomeExe]) dadosPorExercicio[nomeExe] = [];

        dadosPorExercicio[nomeExe].push({
          data: dataLabel,
          pesoTotal,
          cargaMedia,
          serie1: repsNum[0] || 0,
          serie2: repsNum[1] || 0,
          serie3: repsNum[2] || 0,
          exercicio: nomeExe,
          pesoUsado: pesoNum,
        });
      });
    });

    Object.values(dadosPorExercicio).forEach((arr) =>
      arr.sort((a, b) => {
        const parseData = (str: string) => {
          const [d, m] = str.match(/\d{2}\/\d{2}/)![0]
            .split("/")
            .map(Number);
          return new Date(2025, m - 1, d).getTime();
        };
        return parseData(a.data) - parseData(b.data);
      })
    );

    setDadosAgrupados(dadosPorExercicio);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const exerciciosFiltrados = Object.keys(dadosAgrupados).filter((nome) =>
    nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div
      style={{
        width: "100%",
        margin: "0 auto",
        padding: isMobile ? "0 8px" : 20,
      }}
    >
      {/* Busca */}
      <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Pesquisar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            flex: 1,
            padding: 8,
            marginLeft: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
      </div>

      {exerciciosFiltrados.length === 0 && (
        <p style={{ textAlign: "center" }}>Nenhum exercício encontrado.</p>
      )}

      {exerciciosFiltrados.map((exercicio) => {
        const dados = dadosAgrupados[exercicio];
        return (
          <div
            key={exercicio}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              marginBottom: 32,
              overflow: "hidden",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                fontSize: 20,
                padding: "16px 0",
                margin: 0,
                fontWeight: 600,
              }}
            >
              <BarChart2 className="inline-block mr-2" size={24} />
              Progresso de Carga e Volume — {exercicio}
            </h2>

            <div style={{ width: "100%", height: isMobile ? 280 : 450 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dados}
                  margin={{
                    top: 20,
                    right: 10,
                    left: 10,
                    bottom: isMobile ? 50 : 60,
                  }}
                >
                  <XAxis
                    dataKey="data"
                    interval={0}
                    height={isMobile ? 50 : 80}
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  {/* YAxes sem labels */}
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />

                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" />

                  <Bar
                    yAxisId="left"
                    dataKey="pesoTotal"
                    name="Peso total"
                    fill="#3B82F6"
                    barSize={isMobile ? 16 : 24}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cargaMedia"
                    name="Carga média"
                    dot
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
