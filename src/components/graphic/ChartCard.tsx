import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Legend,
  Line,
  Area,
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
import {
  ChartBar,
  CalendarBlank,
  ArrowClockwise,
  Trash,
  TrendUp,
  TrendDown,
  Minus,
  ChartLineUp,
} from "phosphor-react";
import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";
import {
  Card,
  CardHeader,
  TitleBlock,
  Title,
  TrendChip,
  Toolbar,
  ToolbarButton,
  EmptyState,
} from "./GraphicCard.styles";

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
        borderRadius: 10,
        fontSize: 13,
        color: "#fff",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
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
  const gradientId = useId().replace(/:/g, "");
  const serie = useMemo(
    () => montarSeriePorData(dados, ciclosSelecionados),
    [dados, ciclosSelecionados]
  );
  const tendencia = useTendencia(serie);

  if (!visivel) return null;

  const handleAtualizar = () => window.location.reload();

  const handleExcluir = () => {
    const confirmacao = window.confirm("Deseja realmente excluir este gráfico?");
    if (confirmacao) {
      setVisivel(false);
    }
  };

  // No mobile, limita a quantidade de labels visíveis no eixo X para evitar
  // sobreposição de texto quando há muitas sessões registradas.
  const xAxisInterval = isMobile
    ? Math.max(0, Math.ceil(serie.length / 5) - 1)
    : Math.max(0, Math.ceil(serie.length / 10) - 1);

  return (
    <Card data-testid="chart-card">
      <CardHeader>
        <TitleBlock>
          <Title title={exercicio} data-testid="chart-card-title">
            <ChartBar size={18} weight="duotone" />
            {exercicio}
          </Title>
          {tendencia && (
            <TrendChip $tone={tendencia.tone} data-testid="chart-card-trend">
              {tendencia.tone === "up" && <TrendUp size={13} weight="bold" />}
              {tendencia.tone === "down" && <TrendDown size={13} weight="bold" />}
              {tendencia.tone === "flat" && <Minus size={13} weight="bold" />}
              {tendencia.texto}
            </TrendChip>
          )}
        </TitleBlock>

        <Toolbar>
          <ToolbarButton
            onClick={handleAtualizar}
            title="Atualizar dados"
            aria-label="Atualizar dados"
            data-testid="chart-card-refresh"
          >
            <ArrowClockwise size={17} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleExcluir}
            title="Excluir gráfico"
            aria-label="Excluir gráfico"
            data-testid="chart-card-delete"
          >
            <Trash size={17} weight="bold" />
          </ToolbarButton>
        </Toolbar>
      </CardHeader>

      {serie.length === 0 ? (
        <EmptyState data-testid="chart-card-empty">
          <ChartLineUp size={32} weight="duotone" />
          <span>Sem registros para listar.</span>
        </EmptyState>
      ) : (
        <div
          style={{
            width: "100%",
            height: isMobile ? 270 : 340,
            boxSizing: "border-box",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={serie} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#2c2c2c" strokeDasharray="3 3" horizontal vertical={false} />

              <YAxis
                orientation="left"
                width={46}
                tick={{ fill: "#bbb", fontSize: 11 }}
                tickFormatter={(v) => `${v}kg`}
                tickCount={isMobile ? 6 : 8}
                domain={[0, "dataMax + 5"]}
                axisLine={false}
                tickLine={false}
              />

              <Legend
                verticalAlign="top"
                align="center"
                height={24}
                wrapperStyle={{ color: "#ddd", padding: 0, marginBottom: 4, fontSize: 12 }}
              />

              <RechartsTooltip
                content={(props) => <CustomTooltip {...props} />}
                cursor={{ stroke: "#444", strokeWidth: 1 }}
              />

              <Area
                dataKey="topSet"
                name="Maior peso"
                type="monotone"
                stroke="#00C853"
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: isMobile ? 2.5 : 3 }}
                activeDot={{ r: 6 }}
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
                interval={xAxisInterval}
                height={isMobile ? 36 : 46}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#bbb", fontSize: 11 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

type Tendencia = { texto: string; tone: "up" | "down" | "flat" };

function useTendencia(serie: PontoGrafico[]): Tendencia | null {
  return useMemo(() => {
    if (serie.length < 2) return null;
    const atual = serie[serie.length - 1].topSet;
    const anterior = serie[serie.length - 2].topSet;
    const delta = atual - anterior;

    if (delta === 0) return { texto: "Estável", tone: "flat" };
    const sinal = delta > 0 ? "+" : "";
    return {
      texto: `${sinal}${delta.toFixed(1).replace(/\.0$/, "")} kg`,
      tone: delta > 0 ? "up" : "down",
    };
  }, [serie]);
}
