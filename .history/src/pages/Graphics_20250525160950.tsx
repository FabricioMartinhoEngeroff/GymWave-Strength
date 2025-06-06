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
import {
  MagnifyingGlass,
  ChartBar,
  CalendarBlank,
} from "phosphor-react";
import type { TooltipProps } from "recharts";
import { CICLOS } from "../data/cycles";

interface RegistroTreino {
  data: string;
  pesos: string[];
  reps: string[];
  exercicio?: string;
}

interface LinhaGrafico {
  data: string;
  pesoTotal: number;
  cargaMedia: number;
  serie1: number;
  serie2: number;
  serie3: number;
  pesoUsado: number[];
}

const CustomTooltip = (props: TooltipProps<number, string>) => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  const { pesoUsado } = payload[0].payload as LinhaGrafico;
  return (
    <div style={{
      background: "#2e2e2e",
      padding: 12,
      borderRadius: 8,
      fontSize: 13,
      color: "#fff",
    }}>
      <p>
        <CalendarBlank
          size={16}
          weight="duotone"
          primaryColor="#10B981"
          secondaryColor="#D1FAE5"
          className="inline-block mr-1"
        />
        <strong>Data:</strong> {label}
      </p>
      {[0,1,2].map(i => (
        <p key={i}>
          <strong>Série {i+1}:</strong> {pesoUsado[i] ?? "-"} kg
        </p>
      ))}
      <p><strong>Total:</strong> {pesoUsado.reduce((a,b)=>a+b,0)} kg</p>
      <p><strong>Média:</strong> {(pesoUsado.reduce((a,b)=>a+b,0)/pesoUsado.length).toFixed(1)} kg</p>
    </div>
  );
};

export default function Graphics() {
  const [dadosAgrupados, setDadosAgrupados] = useState<Record<string,LinhaGrafico[]>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const bruto = JSON.parse(localStorage.getItem("dadosTreino")||"{}");
    const porExe: Record<string,LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos as Record<string, RegistroTreino>).forEach(
        ([cicloKey, reg]) => {
          const pesosNum = (reg.pesos||[]).map(p => parseFloat(p)||0);
          if (!pesosNum.length) return;

          const pesoTotal = pesosNum.reduce((a,b)=>a+b, 0);
          const cargaMedia = +(pesoTotal / pesosNum.length).toFixed(1);
          const cicloInfo = CICLOS.find(c=>c.id===cicloKey);
          const dataLabel = `${reg.data.slice(0,5)} (${cicloInfo?.id||cicloKey})`;
          const nomeExe = reg.exercicio||exe;

          porExe[nomeExe] = porExe[nomeExe]||[];
          porExe[nomeExe].push({
            data: dataLabel,
            pesoTotal,
            cargaMedia,
            serie1: pesosNum[0]||0,
            serie2: pesosNum[1]||0,
            serie3: pesosNum[2]||0,
            pesoUsado: pesosNum,
          });
        }
      );
    });

    Object.values(porExe).forEach(arr =>
      arr.sort((a,b)=>{
        const [dA,mA] = a.data.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
        const [dB,mB] = b.data.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
        return new Date(2025,mA-1,dA).getTime() - new Date(2025,mB-1,dB).getTime();
      })
    );

    setDadosAgrupados(porExe);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtrados = Object.keys(dadosAgrupados)
    .filter(ex => ex.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{
      width: "100vw",
      margin: 0,
      padding: 0,
      boxSizing: "border-box"
    }}>
      {/* Busca */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "12px"
      }}>
        <MagnifyingGlass
          size={20}
          weight="fill"
          color="#6B7280"
        />
        <input
          style={{
            flex: 1,
            marginLeft: 8,
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #444",
            background: isMobile ? "#222" : "#fff",
            color: isMobile ? "#fff" : "#000"
          }}
          placeholder="Pesquisar exercício..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {filtrados.map(ex => {
        const dados = dadosAgrupados[ex];
        return (
          <div key={ex} style={{
            background: "#1f1f1f",
            marginBottom: 24,
          }}>
            <h2 style={{
              margin: 0,
              padding: "12px",
              color: "#fff",
              textAlign: "center",
              fontSize: 18
            }}>
              <ChartBar
                size={20}
                weight="duotone"
                className="inline-block mr-2"
              />
              Progresso — {ex}
            </h2>
            <div style={{
              width: "100%",
              height: isMobile ? 260 : 360
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dados}
                  margin={{ top: 16, right: 16, left: 0, bottom: isMobile ? 40 : 60 }}
                >
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />

                  <YAxis
                    yAxisId="media"
                    orientation="left"
                    tick={{ fill: "#fff" }}
                    tickFormatter={v => `${v} kg`}
                    tickCount={5}
                    domain={[0, "dataMax + 10"]}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                  />

                  <YAxis
                    yAxisId="total"
                    orientation="right"
                    tick={{ fill: "#fff" }}
                    tickFormatter={v => `${v} kg`}
                    tickCount={5}
                    domain={[0, "dataMax + 20"]}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                  />

                  <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ border: "none" }} />

                  <Legend verticalAlign="top" wrapperStyle={{ color: "#fff" }} />

                  <Bar
                    yAxisId="media"
                    dataKey="cargaMedia"
                    name="Média por série"
                    barSize={isMobile ? 16 : 24}
                    fill="#3B82F6"
                  />

                  <Line
                    yAxisId="total"
                    dataKey="pesoTotal"
                    name="Total das 3 séries"
                    type="monotone"
                    stroke="#fff"
                    dot={{ stroke: "#fff", fill: "#fff" }}
                  />

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
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}

      {filtrados.length === 0 && (
        <p style={{ textAlign: "center", color: "#888", padding: 20 }}>
          Nenhum exercício encontrado.
        </p>
      )}
    </div>
  );
}
