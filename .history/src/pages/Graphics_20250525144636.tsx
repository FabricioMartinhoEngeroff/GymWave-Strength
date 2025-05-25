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

// ... (as antes: RegistroTreino, DadosTreino, LinhaGrafico, CustomTooltip)

export default function Graphics() {
  const [dadosAgrupados, setDadosAgrupados] = useState<Record<string, LinhaGrafico[]>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    // ... (mesma lógica para ler e agrupar dados do localStorage)

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
          style={{
            flex: 1,
            marginLeft: 8,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #444",
            background: isMobile ? "#222" : "#fff",
            color: isMobile ? "#fff" : "#000",
          }}
          placeholder="Pesquisar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {exerciciosFiltrados.length === 0 && (
        <p style={{ textAlign: "center", color: "#888" }}>
          Nenhum exercício encontrado.
        </p>
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
                margin: 0,
                padding: "16px 0",
                textAlign: "center",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              <BarChart2 className="inline-block mr-2" size={24} />
              Progresso de Carga e Volume — {exercicio}
            </h2>

            {/* wrapper escuro */}
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
                  style={{ backgroundColor: "#1f1f1f" }}
                >
                  {/* linhas de grade */}
                  <CartesianGrid stroke="#333" />

                  {/* eixo X com labels inclinados */}
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

                  {/* Y esquerdo com sufixo kg */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#fff" }}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                    tickFormatter={(v) => `${v} kg`}
                    domain={[0, "dataMax + 20"]}
                  />

                  {/* Y direito com sufixo kg */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#fff" }}
                    axisLine={{ stroke: "#555" }}
                    tickLine={{ stroke: "#555" }}
                    tickFormatter={(v) => `${v} kg`}
                    domain={[0, "dataMax + 10"]}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{
                      background: "#2e2e2e",
                      border: "none",
                      color: "#fff",
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ color: "#fff" }}
                  />

                  {/* Barras em azul */}
                  <Bar
                    yAxisId="left"
                    dataKey="pesoTotal"
                    name="Peso total"
                    fill="#3B82F6"
                    barSize={isMobile ? 16 : 24}
                  />

                  {/* Linha em branco */}
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
