import React from "react";
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

// CustomTooltip fica dentro do mesmo arquivo, pois só faz sentido neste gráfico
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const graf = payload[0].payload as LinhaGrafico;
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
        <CalendarBlank size={16} weight="duotone" className="inline-block mr-1" />{" "}
        <strong>Data:</strong> {graf.data}
      </p>
      {[0, 1, 2].map(i => (
        <p key={i}>
          <strong>Série {i + 1}:</strong> {graf.pesoUsado[i] ?? "-"} kg
        </p>
      ))}
      <p>
        <strong>Total:</strong> {graf.pesoUsado.reduce((a, b) => a + b, 0)} kg
      </p>
      <p>
        <strong>Média:</strong>{" "}
        {Number(
          (graf.pesoUsado.reduce((a, b) => a + b, 0) / graf.pesoUsado.length).toFixed(1)
        )}{" "}
        kg
      </p>
    </div>
  );
};

export const ChartCard: React.FC<ChartCardProps> = ({ exercicio, dados, isMobile }) => {
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
              tickFormatter={v => `${v}kg`}
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
              name="Média"
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
              tick={({
                x,
                y,
                payload,
              }: {
                x?: number;
                y?: number;
                payload?: { value: string };
              }) => {
                const raw = payload?.value as string;
                const [date, cycleWithParens] = raw ? raw.split(" ") : ["", ""];
                const cycle = cycleWithParens?.replace(/[()]/g, "") || "";
                const yOffset = 4;
                return (
                  <g transform={`translate(${x},${(y ?? 0) + yOffset})`}>
                    <text x={0} y={0} fill="#fff" textAnchor="middle" fontSize={12}>
                      {date}
                    </text>
                    <text x={0} y={14} fill="#fff" textAnchor="middle" fontSize={10}>
                      {cycle}
                    </text>
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};