// Graphics.tsx
// Componente principal que renderiza o buscador e os gráficos de evolução de carga e volume
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
      <p><Calendar className="inline-block mr-1" size={16}/> <strong>Data:</strong> {label}</p>
      {exercicio && <p><strong>Exercício:</strong> {exercicio}</p>}
      {[serie1, serie2, serie3].map((reps, i) => (
        <p key={i}>
          <strong>Série {i + 1}:</strong> {reps} reps x {pesoUsado?.[i] ?? "?"} kg
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

        // Define título curto do ciclo
        const cicloInfo = CICLOS.find(c => c.id === cicloKey);
        const cicloTitulo = cicloInfo?.id || cicloInfo?.titulo || cicloKey;
        // Data e ciclo resumidos
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
    <div style={{ width: "100vw", padding: 0, margin: 0 }}>
      {/* Campo de busca */}
      <div style={{ display: "flex", alignItems: "center", padding: 16, gap: 8, background: "#f0f4f8" }}>
        <Search size={24} />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16 }}
        />
      </div>

      {exerciciosFiltrados.length === 0 && (
        <p style={{ textAlign: "center", padding: 16 }}>Nenhum exercício encontrado.</p>
      )}

      {exerciciosFiltrados.map(exercicio => {
        const dados = dadosAgrupados[exercicio];
        return (
          <div
            key={exercicio}
            style={{ marginBottom: 40, background: "#fff", padding: 16, borderRadius: 0, boxShadow: "none", borderTop: "1px solid #e5e7eb" }}
          >
            <h2 style={{ textAlign: "center", fontSize: 22, marginBottom: 12, fontWeight: 600 }}>
              <BarChart2 className="inline-block mr-2" size={28} />
              Evolução de Carga e Volume — {exercicio}
            </h2>

            <div style={{ width: "100%", height: isMobile ? '60vh' : '50vh' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dados} margin={{ top: 16, right: 24, left: 24, bottom: 48 }}>
                  <XAxis dataKey="data" interval={0} tick={{ fontSize: 14 }} height={isMobile ? 80 : 100} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }}>
                    <Label value="Total Weight (kg)" angle={-90} position="insideLeft" style={{ fill: "#333" }}/>
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }}>
                    <Label value="Average Load (kg)" angle={90} position="insideRight" style={{ fill: "#333" }}/>
                  </YAxis>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" iconType="circle" />
                  <Bar yAxisId="left" dataKey="pesoTotal" name="Total weight" fill="#3B82F6" barSize={isMobile ? 24 : 40} />
                  <Line yAxisId="right" type="monotone" dataKey="cargaMedia" name="Average load" stroke="#EF4444" dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}D