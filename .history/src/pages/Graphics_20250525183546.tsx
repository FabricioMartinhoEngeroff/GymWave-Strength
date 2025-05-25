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
      <p><strong>Total:</strong> {graf.pesoUsado.reduce((a,b) => a+b,0)} kg</p>
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
          if(!pesosNum.length) return;
          const pesoTotal = pesosNum.reduce((a,b)=>a+b,0);
          const cargaMedia = +(pesoTotal/pesosNum.length).toFixed(1);
          const cicloInfo = CICLOS.find(c=>c.id===cicloKey);
          const dataLabel = `${reg.data.slice(0,5)} (${cicloInfo?.id||cicloKey})`;
          const nomeExe = reg.exercicio||exe;
          porExe[nomeExe] = porExe[nomeExe]||[];
          porExe[nomeExe].push({ data: dataLabel, pesoTotal, cargaMedia, serie1: pesosNum[0]||0, serie2: pesosNum[1]||0, serie3: pesosNum[2]||0, pesoUsado: pesosNum });
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

  
