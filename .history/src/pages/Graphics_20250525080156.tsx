
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
import { Search } from "lucide-react"; // Ícone de lupa
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

// Tooltip customizado, mantido sem alterações conforme solicitado
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const { exercicio, pesoUsado, serie1, serie2, serie3 } = payload[0].payload;

  return (
    <div style={{
      background: "#fff",
      padding: "12px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      fontSize: "13px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <p><strong>Data:</strong> {label}</p>
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
  // Estado para agrupar os dados por exercício
  const [dadosAgrupados, setDadosAgrupados] = useState<Record<string, LinhaGrafico[]>>({});
  // Estado para detectar mobile e ajustar tamanho do gráfico
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Estado para o termo de busca digitado pelo usuário
  const [busca, setBusca] = useState("");

  // Carrega e processa os dados do localStorage uma única vez
  useEffect(() => {
    // Ajusta isMobile em tempo real
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    // Lê dados brutos e converte em estrutura para o gráfico
    const bruto: DadosTreino = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const dadosPorExercicio: Record<string, LinhaGrafico[]> = {};

    Object.entries(bruto).forEach(([exercicio, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloId, registro]) => {
        const { data, pesos = [], reps = [] } = registro;
        const pesoNum = pesos.map(p => parseFloat(p) || 0);
        const repsNum = reps.map(r => parseInt(r) || 0);

        // Calcula soma total e média de carga
        const pesoTotal = pesoNum.reduce((acc, val) => acc + val, 0);
        const cargaMedia = pesoNum.length ? pesoTotal / pesoNum.length : 0;
        // Ignora registros vazios
        if (pesoTotal === 0 && repsNum.every(n => n === 0)) return;

        // Encontra título do ciclo e formata label
        const cicloInfo = CICLOS.find(c => c.id === cicloId);
        const cicloTitulo = cicloInfo?.titulo.split(" ")[0] || `Ciclo ${cicloId}`;
        // Exibe só dia/mês e nome curto do ciclo
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

    // Ordena cada array de registros por data
    Object.values(dadosPorExercicio).forEach(arr => {
      arr.sort((a, b) => {
        const parseData = (str: string) => {
          const [d, m, y] = str.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
          return new Date(2025, m - 1, d).getTime();
        };
        return parseData(a.data) - parseData(b.data);
      });
    });

    setDadosAgrupados(dadosPorExercicio);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filtra exercícios pelo termo de busca
  const exerciciosFiltrados = Object.keys(dadosAgrupados).filter(nome =>
    nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: "0 auto", padding: 20 }}>
      {/* ====== Campo de busca no topo ====== */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 8 }}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
      </div>

      {/* Se não encontrar nenhum exercício, exibe mensagem */}
      {exerciciosFiltrados.length === 0 && (
        <p style={{ textAlign: "center" }}>Nenhum exercício encontrado.</p>
      )}

      {/* Renderiza um gráfico para cada exercício filtrado */}
      {exerciciosFiltrados.map(exercicio => {
        const dados = dadosAgrupados[exercicio];
        return (
          <div key={exercicio} style={{ marginBottom: 40, background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
            {/* Título do gráfico */}
            <h2 style={{ textAlign: "center", fontSize: 20, marginBottom: 16, fontWeight: 600 }}>
              📈 Evolução de Carga e Volume — {exercicio}
            </h2>

            {/* Container responsivo para o gráfico */}
            <div style={{ width: "100%", height: isMobile ? 300 : 500 }}>
              <ResponsiveContainer>
                <ComposedChart data={dados} margin={{ top: 20, right: 40, left: 40, bottom: 60 }}>

                  {/* Eixo X com labels legíveis */}
                  <XAxis
                    dataKey="data"
                    interval={0}
                    angle={0}         // Sem inclinação
                    height={isMobile ? 60 : 80}
                    tick={{ fontSize: 12 }}
                  />

                  {/* Eixo Y esquerdo para soma dos pesos */}
                  <YAxis yAxisId="left">
                    <Label value="Soma dos Pesos (kg)" angle={-90} position="insideLeft" style={{ fill: "#333" }}/>
                  </YAxis>

                  {/* Eixo Y direito para carga média */}
                  <YAxis yAxisId="right" orientation="right">
                    <Label value="Carga Média (kg)" angle={90} position="insideRight" style={{ fill: "#333" }}/>
                  </YAxis>

                  {/* Tooltip original, sem alterações */}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" />

                  {/* Barras de soma dos pesos */}
                  <Bar
                    yAxisId="left"
                    dataKey="pesoTotal"
                    name="Soma dos pesos"
                    fill="#3B82F6"
                    barSize={isMobile ? 18 : 30}
                    label={({ x, y, value, width }) => (
                      <text x={x + width/2} y={y - 8} fill="#000" fontSize={12} textAnchor="middle">
                        {value} kg
                      </text>
                    )}
                  />

                  {/* Linha de carga média */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cargaMedia"
                    name="Carga média"
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
