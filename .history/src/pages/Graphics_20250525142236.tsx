import { useEffect, useState } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { Search, BarChart2, Calendar } from "lucide-react";
import { CICLOS } from "../data/cycles";

// Tipagem para um registro de treino individual
interface RegistroTreino {
  data: string;
  pesos: string[];
  reps: string[];
  obs?: string;
  exercicio?: string;
}

// Dados transformados para o gráfico
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

// Tooltip customizado em Português (mantido branco para legibilidade)
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const { exercicio, pesoUsado, serie1, serie2, serie3 } = payload[0].payload;
  return (
    <div style={{
      background: "#fff",
      padding: 12,
      borderRadius: 8,
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      fontSize: 13,
    }}>
      <p><Calendar className="inline-block mr-1" size={16} /> <strong>Data:</strong> {label}</p>
      {exercicio && <p><strong>Exercício:</strong> {exercicio}</p>}
      {[serie1, serie2, serie3].map((reps, i) => (
        <p key={i}>
          <strong>Série {i + 1}:</strong> {reps} repetições × {pesoUsado?.[i] ?? "?"} kg
        </p>
      ))}
    </div>
  );
};

export default function Graphics() {
  const [dadosAgrupados, setDadosAgrupados] = useState<Record<string, LinhaGrafico[]>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const bruto: Record<string, Record<string, RegistroTreino>> = 
      JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const agrup: Record<string, LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloKey, reg]) => {
        const pesosNum = (reg.pesos || []).map(p => parseFloat(p) || 0);
        const repsNum  = (reg.reps  || []).map(r => parseInt(r)   || 0);
        const pesoTotal = pesosNum.reduce((a,b) => a+b, 0);
        if (pesoTotal === 0 && repsNum.every(n => n===0)) return;
        const cargaMedia = pesoTotal / (pesosNum.length||1);
        const CicloInfo = CICLOS.find(c => c.id === cicloKey);
        const labelData = reg.data.slice(0,5);
        const nomeExe = reg.exercicio || exe;

        if (!agrup[nomeExe]) agrup[nomeExe] = [];
        agrup[nomeExe].push({
          data: labelData,
          pesoTotal,
          cargaMedia,
          serie1: repsNum[0]||0,
          serie2: repsNum[1]||0,
          serie3: repsNum[2]||0,
          exercicio: nomeExe,
          pesoUsado: pesosNum,
        });
      });
    });

    // Ordenar chronologicamente
    Object.values(agrup).forEach(arr =>
      arr.sort((a,b) => {
        const [da, ma] = a.data.split("/").map(Number);
        const [db, mb] = b.data.split("/").map(Number);
        return new Date(2025, ma-1, da).getTime() - new Date(2025, mb-1, db).getTime();
      })
    );

    setDadosAgrupados(agrup);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const exerciciosFiltrados = Object.keys(dadosAgrupados)
    .filter(nome => nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "#121212",
      padding: isMobile ? 8 : 16,
      overflowY: "auto"
    }}>
      {/* barra de busca */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <Search size={20} color="#fff" />
        <input
          type="text"
          placeholder="Pesquisar exercício..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #444",
            background: "#1e1e1e",
            color: "#fff",
            fontSize: 14
          }}
        />
      </div>

      {exerciciosFiltrados.length === 0 && (
        <p style={{ textAlign: "center", color: "#888" }}>Nenhum exercício encontrado.</p>
      )}

      {exerciciosFiltrados.map(exercicio => {
        const dados = dadosAgrupados[exercicio];
        return (
          <div key={exercicio} style={{
            marginBottom: 16,
            padding: 8,
            borderRadius: 8,
            background: "#1e1e1e",
          }}>
            <h2 style={{
              textAlign: "center",
              fontSize: 18,
              color: "#fff",
              marginBottom: 12,
              fontWeight: 500
            }}>
              <BarChart2 className="inline-block mr-2" size={24} color="#fff" />
              {exercicio}
            </h2>

            <div style={{ width: "100%", height: isMobile ? "60vh" : "50vh" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dados}
                  margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                >
                  <XAxis
                    dataKey="data"
                    interval={0}
                    height={40}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#fff" }}
                    tickFormatter={(val) => {
                      const [d, m] = val.split("/").map(Number);
                      const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
                      return meses[m-1];
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#fff" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#fff" }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    yAxisId="left"
                    dataKey="pesoTotal"
                    barSize={isMobile ? 10 : 20}
                    fill="#3B82F6"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cargaMedia"
                    dot={{ r: 3, stroke: "#fff", strokeWidth: 2 }}
                    stroke="#fff"
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
