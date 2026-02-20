import { useState } from "react";
import type { ReactElement } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Legend,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { ChartBar, CalendarBlank } from "phosphor-react";
import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";

interface ChartCardProps {
  exercicio: string;
  dados: RegistroGraficoRaw[];
  ciclosSelecionados: string[];
  isMobile: boolean;
}

type PontoGrafico = {
  data: string; // "DD/MM"
  dataFull: string; // "DD/MM/YYYY"
  dataTs: number;
  cicloId: string;
  pesos: number[];
  topSet: number;
  media4: number;
};

const media = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  return nums.reduce((acc, v) => acc + v, 0) / nums.length;
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
const CustomTooltip = ({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>): ReactElement | null => {
  if (!active || !payload?.length) return null;

  const graf = (payload[0] as Payload<ValueType, NameType>).payload as PontoGrafico;
  const maximo = graf.topSet;

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
        <strong style={{ marginRight: 4 }}>Data:</strong> {graf.dataFull} ({graf.cicloId})
      </p>

      {renderizarLinhasSeries(graf.pesos)}

      <p style={{ marginTop: 8, marginBottom: 0 }}>
        <strong>Maior peso (Topset):</strong> {maximo} kg
      </p>
      <p style={{ margin: "4px 0 0 0" }}>
        <strong>Média (últimas 4 datas):</strong> {Math.round(graf.media4)} kg
      </p>
    </div>
  );
};

const handleAtualizar = () => {
  window.location.reload();
};

function montarSeriePorData(
  dados: RegistroGraficoRaw[],
  ciclosSelecionados: string[]
): PontoGrafico[] {
  const filtrados = dados.filter((d) => ciclosSelecionados.includes(d.cicloId));
  const porData = new Map<string, RegistroGraficoRaw>();

  filtrados.forEach((d) => {
    const atual = porData.get(d.data);
    if (!atual || d.topSet > atual.topSet) porData.set(d.data, d);
  });

  const ordenados = [...porData.values()].sort((a, b) => a.dataTs - b.dataTs);
  const pontosBase = ordenados.map((d) => ({
    data: d.data.slice(0, 5),
    dataFull: d.data,
    dataTs: d.dataTs,
    cicloId: d.cicloId,
    pesos: d.pesos,
    topSet: d.topSet,
  }));

  return pontosBase.map((p, i) => {
    const janela = pontosBase.slice(Math.max(0, i - 3), i + 1).map((x) => x.topSet);
    return { ...p, media4: media(janela) };
  });
}

/**
 * Componente que renderiza um card de gráfico para um exercício.
 */
export function ChartCard({
  exercicio,
  dados,
  ciclosSelecionados,
  isMobile,
}: ChartCardProps) {
  const [visivel, setVisivel] = useState(true);
  if (!visivel) return null;

  const serie = montarSeriePorData(dados, ciclosSelecionados);

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
          <ComposedChart data={serie} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" horizontal vertical={false} />

            <YAxis
              orientation="left"
              width={50}
              tick={{ fill: "#fff", fontSize: 11 }}
              tickFormatter={(v) => `${v}kg`}
              tickCount={12}
              domain={[0, "dataMax + 5"]}
              axisLine={false}
              tickLine={false}
            />

            <Legend
              verticalAlign="top"
              align="center"
              height={24}
              wrapperStyle={{ color: "#fff", padding: 0, marginBottom: 4 }}
            />

            <RechartsTooltip content={(props) => <CustomTooltip {...props} />} />

            <Line
              dataKey="topSet"
              name="Maior peso"
              type="monotone"
              stroke="#00C853"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />

            <Line
              dataKey="media4"
              name="Média (4 últimas)"
              type="monotone"
              stroke="#2962FF"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />

            <XAxis
              dataKey="data"
              interval={0}
              height={isMobile ? 40 : 50}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#fff", fontSize: 12 }}
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
