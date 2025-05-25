import { useEffect, useState } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  MagnifyingGlass,
  ChartBar,
  CalendarBlank
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
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const graf = payload[0].payload as LinhaGrafico;

  return (
    <div style={{
      background: "#2e2e2e",
      padding: 12,
      borderRadius: 8,
      fontSize: 13,
      color: "#fff",
    }}>
      <p>
        <CalendarBlank size={16} weight="duotone" className="inline-block mr-1" />{" "}
        <strong>Data:</strong> {graf.data}
      </p>
      {[0,1,2].map(i => (
        <p key={i}>
          <strong>Série {i+1}:</strong> {graf.pesoUsado[i] ?? "-"} kg
        </p>
      ))}
      <p><strong>Total:</strong> {graf.pesoUsado.reduce((a,b) => a+b, 0)} kg</p>
      <p><strong>Média:</strong> {(graf.pesoUsado.reduce((a,b)=>a+b,0)/graf.pesoUsado.length).toFixed(1)} kg</p>
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

    const bruto = JSON.parse(localStorage.getItem("dadosTreino")||"{}");
    const porExe: Record<string, LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos as Record<string,RegistroTreino>).forEach(
        ([cicloKey, reg]) => {
          const pesosNum = (reg.pesos||[]).map(p=>parseFloat(p)||0);
          if (!pesosNum.length) return;
          const pesoTotal = pesosNum.reduce((a,b)=>a+b,0);
          const cargaMedia = +(pesoTotal/pesosNum.length).toFixed(1);
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
      arr.sort((a,b) => {
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
      padding: "0 12px 24px",
      boxSizing: "border-box",
      background: "#e5e9f2"
    }}>
      {/* Busca */}
      <div style={{ display:"flex", alignItems:"center", padding:"12px 0" }}>
        <MagnifyingGlass size={20} weight="duotone" />
        <input
          style={{
            flex:1,
            marginLeft:8,
            padding:"8px",
            borderRadius:4,
            border:"1px solid #444",
            background:isMobile?"#222":"#fff",
            color:isMobile?"#fff":"#000"
          }}
          placeholder="Pesquisar exercício..."
          value={busca}
          onChange={e=>setBusca(e.target.value)}
        />
      </div>

      {filtrados.map(ex => {
        const dados = dadosAgrupados[ex];
        return (
          <div
            key={ex}
            style={{
              background:"#1f1f1f",
              borderRadius:8,
              padding:16,
              margin:"0 auto 32px",
              maxWidth: 600
            }}
          >
            <h2 style={{
              margin:0,
              paddingBottom:12,
              color:"#fff",
              textAlign:"center",
              fontSize:18,
              borderBottom:"1px solid #444"
            }}>
              <ChartBar size={20} weight="duotone" className="inline-block mr-2" />
              Progresso — {ex}
            </h2>

            <ResponsiveContainer width="100%" height={isMobile?240:320}>
              <ComposedChart
                data={dados}
                margin={{ top:40, right:16, left:48, bottom:isMobile?40:60 }}
              >
                {/* Apenas linhas horizontais */}
                <CartesianGrid stroke="#333" strokeDasharray="3 3" horizontal vertical={false} />

                {/* Eixo esquerdo */}
                <YAxis
                  yAxisId="media"
                  orientation="left"
                  width={48}
                  tick={{ fill:"#fff" }}
                  tickFormatter={v => `${v} kg`}
                  tickCount={8}
                  allowDecimals={false}
                  tickMargin={8}
                  domain={[0, "dataMax + 5"]}
                  axisLine={{ stroke:"#555" }}
                  tickLine={{ stroke:"#555" }}
                />

                {/* Eixo direito oculto */}
                <YAxis yAxisId="total" orientation="right" hide />

                {/* Legenda abaixo do topo */}
                <Legend
                  verticalAlign="top"
                  align="center"
                  height={36}
                  wrapperStyle={{ color:"#fff", top: 0 }}
                />

                <Bar
                  yAxisId="media"
                  dataKey="cargaMedia"
                  name="Média por série"
                  barSize={isMobile?14:20}
                  fill="#3B82F6"
                />

                <Line
                  yAxisId="total"
                  dataKey="pesoTotal"
                  name="Total das 3 séries"
                  type="monotone"
                  stroke="#fff"
                  dot={{ stroke:"#fff", fill:"#fff" }}
                />

                <XAxis
                  dataKey="data"
                  interval={0}
                  height={isMobile?40:60}
                  tick={{ fill:"#fff", fontSize:12 }}
                  axisLine={{ stroke:"#555" }}
                  tickLine={{ stroke:"#555" }}
                  angle={-45}
                  textAnchor="end"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })}

      {filtrados.length === 0 && (
        <p style={{ textAlign:"center", color:"#888", padding:20 }}>
          Nenhum exercício encontrado.
        </p>
      )}
    </div>
  );
}
