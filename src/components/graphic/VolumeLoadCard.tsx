import { useMemo } from "react";
import type { ReactElement } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
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
import { Barbell, ChartLineUp } from "phosphor-react";
import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";
import {
  agruparVolumePorPeriodo,
  type Granularidade,
  type BucketVolume,
} from "../../utils/volumeBuckets";
import { Card, CardHeader, TitleBlock, Title, EmptyState } from "./GraphicCard.styles";

interface VolumeLoadCardProps {
  exercicio: string;
  dados: RegistroGraficoRaw[];
  ciclosSelecionados: string[];
  granularidade: Granularidade;
  isMobile: boolean;
}

const COR_NORMAL = "#2962FF";
const COR_RP = "#FFAB00";

function fmtVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k kg`;
  return `${Math.round(v)} kg`;
}

const CustomTooltip = ({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>): ReactElement | null => {
  if (!active || !payload?.length) return null;

  const bucket = (payload[0] as Payload<ValueType, NameType>).payload as BucketVolume;

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
      <p style={{ margin: 0, marginBottom: 6 }}>
        <strong>Período:</strong> {bucket.label}
      </p>
      <p style={{ margin: 0 }}>
        <strong>Volume total:</strong> {fmtVolume(bucket.volume)}
      </p>
      {bucket.temRP && (
        <p style={{ margin: "6px 0 0", color: COR_RP }}>Inclui sessão(ões) com técnica RP</p>
      )}
    </div>
  );
};

export function VolumeLoadCard({
  exercicio,
  dados,
  ciclosSelecionados,
  granularidade,
  isMobile,
}: VolumeLoadCardProps) {
  const buckets = useMemo(() => {
    const filtrados = dados.filter((d) => ciclosSelecionados.includes(d.cicloId));
    return agruparVolumePorPeriodo(filtrados, granularidade);
  }, [dados, ciclosSelecionados, granularidade]);

  return (
    <Card data-testid="volume-card" data-bucket-count={buckets.length} data-has-rp={buckets.some((b) => b.temRP)}>
      <CardHeader>
        <TitleBlock>
          <Title title={exercicio} data-testid="volume-card-title">
            <Barbell size={18} weight="duotone" />
            {exercicio}
          </Title>
        </TitleBlock>
      </CardHeader>

      {buckets.length === 0 ? (
        <EmptyState data-testid="volume-card-empty">
          <ChartLineUp size={32} weight="duotone" />
          <span>Sem registros para listar.</span>
        </EmptyState>
      ) : (
        <div style={{ width: "100%", height: isMobile ? 270 : 340, boxSizing: "border-box" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#2c2c2c" strokeDasharray="3 3" horizontal vertical={false} />

              <YAxis
                orientation="left"
                width={46}
                tick={{ fill: "#bbb", fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
                tickCount={isMobile ? 6 : 8}
                axisLine={false}
                tickLine={false}
              />

              <RechartsTooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />

              <Bar dataKey="volume" name="Volume load" radius={[6, 6, 0, 0]}>
                {buckets.map((b) => (
                  <Cell key={b.chave} fill={b.temRP ? COR_RP : COR_NORMAL} />
                ))}
              </Bar>

              <XAxis
                dataKey="label"
                interval={isMobile ? Math.max(0, Math.ceil(buckets.length / 5) - 1) : 0}
                height={isMobile ? 36 : 46}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#bbb", fontSize: 11 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
