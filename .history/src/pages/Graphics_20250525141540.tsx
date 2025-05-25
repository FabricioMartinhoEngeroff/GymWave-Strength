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
import { Search, BarChart2 } from "lucide-react";
import type { TooltipProps } from "recharts";
import { CICLOS } from "../data/cycles";

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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const { exercicio, pesoUsado, serie1, serie2, serie3 } = payload[0].payload;

  return (
    <div style={{
      background: "#fff",
      padding: 12,
      border: "1px solid #ddd",
      borderRadius: 8,
      fontSize: 13,
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
    }}>
      <p><strong>{label}</strong></p>
      {exercicio && <p>Exercício: {exercicio}</p>}
      {[serie1, serie2, serie3].map((r, i) => (
        <p key={i}>S{i+1}: {r}×{pesoUsado[i] ?? "?"}kg</p>
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

    const bruto: DadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const byExe: Record<string, LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos).forEach(([key, reg]) => {
        const p = reg.pesos.map(x => parseFloat(x) || 0);
        const r = reg.reps.map(x => parseInt(x) || 0);
        const total = p.reduce((a,b)=>a+b,0);
        if (total === 0 && r.every(n=>n===0)) return;

        const avg = total / (p.length || 1);
        const info = CICLOS.find(c=>c.id===key) || { id: key, titulo: key };
        const label = `${reg.data.slice(0,5)} (${info.id})`;
        const nome = reg.exercicio || exe;

        byExe[nome] = byExe[nome] || [];
        byExe[nome].push({
          data: label,
          pesoTotal: total,
          cargaMedia: avg,
          serie1: r[0]||0,
          serie2: r[1]||0,
          serie3: r[2]||0,
          exercicio: nome,
          pesoUsado: p,
        });
      });
    });

    Object.values(byExe).forEach(arr =>
      arr.sort((a,b)=> new Date(a.data.slice(3,5)+"/"+a.data.slice(0,2)+"/2025").getTime()
                   - new Date(b.data.slice(3,5)+"/"+b.data.slice(0,2)+"/2025").getTime())
    );

    setDadosAgrupados(byExe);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtrados = Object.keys(dadosAgrupados)
    .filter(nome => nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{
      width: "100%",
      maxWidth: 960,
      margin: "0 auto",
      padding: isMobile ? "12px 8px" : "24px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 16,
        gap: 8
      }}>
        <Search size={20} />
        <input
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 14
          }}
          placeholder="Pesquisar exercício"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {filtrados.map(exercicio => {
        const dados = dadosAgrupados[exercicio];
        return (
          <div key={exercicio} style={{
            marginBottom: 32,
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <h3 style={{
              textAlign: "center",
              fontSize: 18,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}>
              <BarChart2 size={20} /> {exercicio}
            </h3>

            <div style={{ width: "100%", height: isMobile ? 240 : 360 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={dados}
                  margin={{ top: 8, right: 16, left: 16, bottom: 32 }}
                >
                  <CartesianGrid stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 12 }}
                    tickFormatter={str => str.slice(0,5)}
                    angle={-45}
                    textAnchor="end"
                    height={isMobile ? 50 : 60}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={val => `${val}kg`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={val => `${val}kg`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={isMobile ? 24 : 32} />
                  <Bar
                    yAxisId="left"
                    dataKey="pesoTotal"
                    name="Total"
                    fill="#4f46e5"
                    barSize={isMobile ? 12 : 20}
                    animationDuration={600}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cargaMedia"
                    name="Média"
                    stroke="#f97316"
                    dot={{ r: 3 }}
                    strokeWidth={2}
                    animationDuration={600}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}

      {filtrados.length === 0 && (
        <p style={{ textAlign: "center", color: "#666" }}>
          Nenhum exercício encontrado
        </p>
      )}
    </div>
  );
}
