import React, { useState,ReactElement } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  TooltipProps,
} from "recharts";
import { ChartBar, CalendarBlank } from "phosphor-react";
import type { LinhaGrafico } from "../../hooks/useDadosTreino";

interface ChartCardProps {
  exercicio: string;
  dados: LinhaGrafico[];
  isMobile: boolean;
}

//Parâmetros que a função de tick do eixo X recebe.
type TickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
};

/**
 * Calcula a soma de todos os elementos do array.
 * @param pesosUsados Array de números representando pesos de cada série.
 */
const calcularTotal = (pesosUsados: number[]): number =>
  pesosUsados.reduce((ac, at) => ac + at, 0);

/**
 * Calcula a média dos valores do array (arredondada para 1 casa).
 * Retorna 0 caso o array esteja vazio.
 */
const calcularMedia = (pesosUsados: number[]): number => {
  if (pesosUsados.length === 0) return 0;
  const total = calcularTotal(pesosUsados);
  return Number((total / pesosUsados.length).toFixed(1));
};

/**
 * Gera um array de elementos <p> para cada peso na série.
 * Se o valor for zero ou undefined, exibe “-”.
 */
const renderizarLinhasSeries = (pesosUsados: number[]): ReactElement[] =>
  pesosUsados.map((peso, idx) => {
    const textoPeso = peso ? `${peso} kg` : "-";
    return (
      <p
        key={idx}
        style={{
          margin: 0,
          padding: "2px 0",
        }}
      >
        <strong>Série {idx + 1}:</strong> {textoPeso}
      </p>
    );
  });

/**
 * Conteúdo do Tooltip personalizado: exibe data, linhas de séries, total e média.
 */
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  // Extrai o objeto LinhaGrafico do payload
  const graf = payload[0].payload as LinhaGrafico;
  const total = calcularTotal(graf.pesoUsado);
  const media = calcularMedia(graf.pesoUsado);

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
      <p
        style={{
          margin: 0,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
        }}
      >
        <CalendarBlank size={16} weight="duotone" className="inline-block mr-1" />{" "}
        <strong style={{ marginRight: 4 }}>Data:</strong> {graf.data}
      </p>

      {renderizarLinhasSeries(graf.pesoUsado)}

      <p style={{ marginTop: 8, marginBottom: 0 }}>
        <strong>Total:</strong> {total} kg
      </p>
      <p style={{ margin: "4px 0 0 0" }}>
        <strong>Média:</strong> {media} kg
      </p>
    </div>
  );
};

/**
 * Renderiza o tick no eixo X, separando “DD/MM” de “(CicloID)”.
 * Retorna sempre um elemento SVG (mesmo que vazio), para satisfazer o tipo esperado.
 */
const renderizarTickX = ({ x = 0, y = 0, payload }: TickProps) => {
  // Se não houver valor em payload, retorna um <g/> vazio (em vez de null)
  if (!payload?.value) {
    return <g />;
  }

  // "raw" tem formato "DD/MM (CicloID)", ou string vazia
  const raw = payload.value;
  const [date, cycleWithParens] = raw.split(" ");
  const cycle = cycleWithParens.replace(/[()]/g, "");
  const yOffset = 4;

  return (
    <g transform={`translate(${x},${y + yOffset})`}>
      <text x={0} y={0} fill="#fff" textAnchor="middle" fontSize={12}>
        {date}
      </text>
      <text x={0} y={14} fill="#fff" textAnchor="middle" fontSize={10}>
        {cycle}
      </text>
    </g>
  );
};

const handleAtualizar = () => {
  window.location.reload();
};

/**
 * Componente que renderiza um card de gráfico para um exercício.
 */
export function ChartCard({ exercicio, dados, isMobile }: ChartCardProps) {
  const [visivel, setVisivel] = useState(true);
  if (!visivel) return null;

  const handleExcluir = () => {
    const confirmacao = window.confirm("Deseja realmente excluir este gráfico?");
    if (confirmacao) {
      setVisivel(false);
    }
  };

  return (
    <div
      style={{
        background: "#1f1f1f",
        borderRadius: 8,
        padding: 16,
        margin: "0 auto 24px",
        width: "100%",
        maxWidth: 600,
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          margin: 0,
          paddingBottom: 8,
          color: "#fff",
          textAlign: "center",
          fontSize: 18,
          borderBottom: "1px solid #333",
        }}
      >
        <ChartBar size={20} weight="duotone" className="inline-block mr-2" />
        Progresso — {exercicio}
      </h2>

      <div
        style={{
          width: "100%",
          height: isMobile ? 300 : 350,
          boxSizing: "border-box",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" horizontal vertical={false} />

            <YAxis
              yAxisId="media"
              orientation="left"
              width={50}
              tick={{ fill: "#fff", fontSize: 11 }}
              tickFormatter={(v) => `${v}kg`}
              tickCount={12}
              domain={[0, "dataMax + 5"]}
              axisLine={false}
              tickLine={false}
            />

            <YAxis yAxisId="total" orientation="right" hide />

            <Legend
              verticalAlign="top"
              align="center"
              height={24}
              wrapperStyle={{ color: "#fff", padding: 0, marginBottom: 4 }}
            />

            <RechartsTooltip content={<CustomTooltip />} />

            <Bar
              yAxisId="media"
              dataKey="cargaMedia"
              name="Topse"
              barSize={isMobile ? 16 : 20}
              fill="#3B82F6"
            />

            <Line
              yAxisId="total"
              dataKey="pesoTotal"
              name="Total"
              type="monotone"
              stroke="#fff"
              dot={false}
            />

            <XAxis
              dataKey="data"
              interval={0}
              height={isMobile ? 60 : 80}
              axisLine={false}
              tickLine={false}
              tick={renderizarTickX}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Botões abaixo do gráfico */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginTop: 16,
        }}
      >
        <button
          onClick={handleAtualizar}
          style={{
            backgroundColor: "#3B82F6",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Atualizar
        </button>
        <button
          onClick={handleExcluir}
          style={{
            backgroundColor: "#EF4444",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}