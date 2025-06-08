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
import type { LinhaGrafico } from "../../types/LinhaGrafico";

interface ChartCardProps {
  exercicio: string;
  dados: LinhaGrafico[];
  isMobile: boolean;
}

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
 * Retorna um array de elementos <p> para cada peso na série. 
 * Se o valor for zero ou undefined, mostra "-" em vez de "0 kg". 
 */
const renderizarLinhasSeries = (pesosUsados: number[]): JSX.Element[] =>
  pesosUsados.map((peso, idx) => {
    const textoPeso = peso ? `${peso} kg` : "-";
    return (
      <p key={idx} style={styles.serieLine}>
        <strong>Série {idx + 1}:</strong> {textoPeso}
      </p>
    );
  });

/** 
 * Função que renderiza o conteúdo do Tooltip. 
 * Recebe props de Recharts e exibe data, séries, total e média. 
 */
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  // Extraímos o objeto LinhaGrafico do payload
  const graf = payload[0].payload as LinhaGrafico;

  const total = calcularTotal(graf.pesoUsado);
  const media = calcularMedia(graf.pesoUsado);

  return (
    <div style={styles.tooltipContainer}>
      <p style={styles.dataLine}>
        <CalendarBlank size={16} weight="duotone" className="inline-block mr-1" />{" "}
        <strong>Data:</strong> {graf.data}
      </p>

      {renderizarLinhasSeries(graf.pesoUsado)}

      <p style={styles.totalLine}>
        <strong>Total:</strong> {total} kg
      </p>
      <p style={styles.mediaLine}>
        <strong>Média:</strong> {media} kg
      </p>
    </div>
  );
};

/**
 * Renderiza o tick do eixo X: recebe coords (x, y) e o payload com { value: string }.
 * Separa “DD/MM” de “(CicloID)” e posiciona dois <text> um abaixo do outro.
 */
const renderizarTickX = ({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}): JSX.Element => {
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
};

/**
 * O componente principal que exibe um card de gráfico para um exercício.
 * Usa Recharts para montar barras (carga média) e linha (peso total).
 */
export const ChartCard: React.FC<ChartCardProps> = ({ exercicio, dados, isMobile }) => {
  return (
    <div style={styles.cardContainer}>
      <h2 style={styles.cardHeader}>
        <ChartBar size={20} weight="duotone" className="inline-block mr-2" />
        Progresso — {exercicio}
      </h2>

      <div style={{ ...styles.chartWrapper, height: isMobile ? 300 : 350 }}>
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
              tick={renderizarTickX}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};