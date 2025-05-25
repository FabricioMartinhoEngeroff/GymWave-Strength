// Gráficos de evolução de treino com ícones e CICLOS atualizados
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
  Label,
} from "recharts";
import {
  Search,
  BarChart2,
  Calendar,
} from "lucide-react";
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

// Estrutura interna dos dados armazenados no localStorage
interface DadosTreino {
  [exercicio: string]: {
    [ciclo: string]: RegistroTreino;
  };
}

// Linha formatada para o gráfico
interface LinhaGrafico {
  data: string;           // rótulo no eixo X (data + ciclo)
  pesoTotal: number;      // soma das cargas
  cargaMedia: number;     // média das cargas
  serie1: number;
  serie2: number;
  serie3: number;
  exercicio: string;      // nome do exercício
  pesoUsado: number[];    // cargas individuais por série
}

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const { exercicio, pesoUsado, serie1, serie2, serie3 } = payload[0].payload;

  return (
    <div style={{
      background: "#fff",
      padding: 12,
      border: "1px solid #ccc",
      borderRadius: 8,
      fontSize: 13,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <p><Calendar className="inline-block mr-1" size={16}/> <strong>Date:</strong> {label}</p>
      {exercicio && <p><strong>Exercise:</strong> {exercicio}</p>}
      {[serie1, serie2, serie3].map((reps, i) => (
        <p key={i}>
          <strong>Set {i + 1}:</strong> {reps} reps x {pesoUsado?.[i] ?? "?"} kg
        </p>
      ))}
    </div>
  );
};

// Componente principal
export default function Graphics() {
  const [dadosAgrupados, setDadosAgrupados] = useState<Record<string, LinhaGrafico[]>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const bruto: DadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const dadosPorExercicio: Record<string, LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloKey, registro]) => {
        const { data, pesos = [], reps = [] } = registro;
        const pesoNum = pesos.map(p => parseFloat(p) || 0);
        const repsNum = reps.map(r => parseInt(r) || 0);

        const pesoTotal = pesoNum.reduce((acc, val) => acc + val, 0);
        if (pesoTotal === 0 && repsNum.every(n => n === 0)) return;
        const cargaMedia = pesoNum.length ? pesoTotal / pesoNum.length : 0;

        const cicloInfo = CICLOS.find(c => c.id === cicloKey);
        const cicloTitulo = cicloInfo?.id || cicloInfo?.titulo || cicloKey;
        const dataLabel = `${data.slice(0,5)} (${cicloTitulo})`;

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

    Object.values(dadosPorExercicio).forEach(arr => {
      arr.sort((a, b) => {
        const parseData = (str: string) => {
          const [d, m] = str.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
          return new Date(2025, m - 1, d).getTime();
        };
        return parseData(a.data) - parseData(b.data);
      });
    });

    setDadosAgrupados(dadosPorExercicio);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const exerciciosFiltrados = Object.keys(dadosAgrupados).filter(nome =>
    nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{
      width: isMobile ? "100%" : 960,
      margin: "0 auto",
      padding: 20
    }}>
      {/* Search field */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 8 }}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Search exercise..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
      </div>

      {exerciciosFiltrados.length === 0 && (
        <p style={{ textAlign: "center" }}>No exercise found.</p>
      )}

      {exerciciosFiltrados.map(exercicio => {
        const dados = dadosAgrupados[exercicio];
        return (
          <div
            key={exercicio}
            style={{
              width: "100%",
              marginBottom: 40,
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{
              textAlign: "center",
              fontSize: 20,
              marginBottom: 16,
              fontWeight: 600
            }}>
              <BarChart2 className="inline-block mr-2" size={24} />
              Load & Volume Progress — {exercicio}
            </h2>

            <div style={{ width: "100%", height: isMobile ? 300 : 500 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={dados}
                  margin={{ top: 20, right: 40, left: 40, bottom: 60 }}
                >
                  <XAxis
                    dataKey="data"
                    interval={0}
                    height={isMobile ? 60 : 80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left">
                    <Label
                      value="Total Weight (kg)"
                      angle={-90}
                      position="insideLeft"
                      style={{ fill: "#333" }}
                    />
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right">
                    <Label
                      value="Average Load (kg)"
                      angle={90}
                      position="insideRight"
                      style={{ fill: "#333" }}
                    />
                  </YAxis>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" />
                  <Bar
                    yAxisId="left"
                    dataKey="pesoTotal"
                    name="Total weight"
                    fill="#3B82F6"
                    barSize={isMobile ? 18 : 30}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cargaMedia"
                    name="Average load"
                    stroke="#EF4444"
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
