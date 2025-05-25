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

    const bruto: DadosTreino = JSON.parse(
      localStorage.getItem("dadosTreino") || "{}"
    );
    const porExe: Record<string, LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloKey, reg]) => {
        const data = reg.data;
        const pesosNum = (reg.pesos || []).map((p) => parseFloat(p) || 0);
        const repsNum = (reg.reps || []).map((r) => parseInt(r) || 0);

        const pesoTotal = pesosNum.reduce((a, b) => a + b, 0);
        if (pesoTotal === 0 && repsNum.every((n) => n === 0)) return;
        const cargaMedia = pesoTotal / (pesosNum.length || 1);

        const cicloInfo = CICLOS.find((c) => c.id === cicloKey);
        const cicloTitulo = cicloInfo?.id || cicloKey;
        const dataLabel = `${data.slice(0, 5)} (${cicloTitulo})`;

        const nomeExe = reg.exercicio || exe;
        porExe[nomeExe] = porExe[nomeExe] || [];
        porExe[nomeExe].push({
          data: dataLabel,
          pesoTotal,
          cargaMedia,
          serie1: repsNum[0] || 0,
          serie2: repsNum[1] || 0,
          serie3: repsNum[2] || 0,
          exercicio: nomeExe,
          pesoUsado: pesosNum,
        });
      });
    });

    // Ordena por data
    Object.values(porExe).forEach((arr) =>
      arr.sort((a, b) => {
        const pa = a.data.match(/\d{2}\/\d{2}/)![0]
          .split("/")
          .map(Number);
        const pb = b.data.match(/\d{2}\/\d{2}/)![0]
          .split("/")
          .map(Number);
        return new Date(2025, pa[1] - 1, pa[0]).getTime() -
               new Date(2025, pb[1] - 1, pb[0]).getTime();
      })
    );

    setDadosAgrupados(porExe);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtrados = Object.keys(dadosAgrupados).filter((nome) =>
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
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar exercício..."
          style={{
            flex: 1,
            marginLeft: 8,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #444",
            background: isMobile ? "#222" : "#fff",
            color: isMobile ? "#fff" : "#000",
          }}
        />
      </div>

      {filtrados.length === 0 && (
        <p style={{ textAlign: "center", color: "#888" }}>
          Nenhum exercício encontrado.
        </p>
      )}

      {filtrados.map((ex) => {
        const dados = dadosAgrupados[ex];
        return (
          <div
            key={ex}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: 32,
              overflow: "hidden",
            }}
          >
            <h2
              style={{
                margin: 0,
                padding: "16px 0",
                textAlign: "center",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              <BarChart2 size={24} className="inline-block mr-2" />
              Progresso — {ex}
            </h2>

            <div
              style={{
                width: "100%",
                height: isMobile ? 280 : 450,
                backgroundColor: "#1f1f1f",
              }}
            >
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
                  <CartesianGrid stroke="#333" />

                  <XAxis
                    dataKey="data"
                    interval={0}
                    height={isMobile ? 50 : 80}
                    tick={{ fill: "#fff", fontSize: 12 }}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                    angle={-45}
                    textAnchor="end"
                  />

                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#fff" }}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                    tickFormatter={(v) => `${v} kg`}
                    domain={[0, "dataMax + 20"]}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#fff" }}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                    tickFormatter={(v) => `${v} kg`}
                    domain={[0, "dataMax + 10"]}
                  />

                  <RechartsTooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{
                      background: "#2e2e2e",
                      border: "none",
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ color: "#fff" }}
                  />

                  <Bar
                    yAxisId="left"
                    dataKey="pesoTotal"
                    name="Peso total"
                    fill="#3B82F6"
                    barSize={isMobile ? 16 : 24}
                  />
                  <Line
                    yAxisId="right"
                    dataKey="cargaMedia"
                    name="Carga média"
                    type="monotone"
                    stroke="#fff"
                    dot={{ stroke: "#fff", fill: "#fff" }}
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
