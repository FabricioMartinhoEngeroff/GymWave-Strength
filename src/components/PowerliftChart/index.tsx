import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";

import {
  ChartBox,
  Container,
  Content,
  FiltersRow,
  Header,
  Panel,
  PanelsGrid,
  PanelTitle,
  SelectLabel,
  Title,
  TooltipBox,
} from "./styles";

import { NativeSelect } from "../ui/NativeSelect";
import { carregarLogbookCompleto } from "../../utils/storage";
import { getCutoffTs, TIME_INTERVAL_OPTIONS, type TimeInterval } from "../../utils/timeFilter";
import { calcEpley, extractReferenceBlock } from "../../utils/epleyCalc";
import type { RegistroExercicio } from "../../types/TrainingData";

const GOLD = "#D4AF37";
const BLUE = "#5470C6";
const GREEN = "#16a34a";
const RED = "#dc2626";

interface ChartPoint {
  ts: number;
  data: string;
  rm1: number;
  peso: number;
  reps: number;
  tecnica: "BC" | "RP" | null;
  isPr: boolean;
}

function buildChartPoints(registros: RegistroExercicio[]): ChartPoint[] {
  const points: ChartPoint[] = registros
    .map((r) => {
      const ref = extractReferenceBlock(r);
      if (!ref || ref.peso <= 0) return null;
      return {
        ts: r.dataTs,
        data: r.data,
        rm1: calcEpley(ref.peso, ref.reps),
        peso: ref.peso,
        reps: ref.reps,
        tecnica: r.tecnica ?? null,
        isPr: false,
      };
    })
    .filter((p): p is ChartPoint => p !== null)
    .sort((a, b) => a.ts - b.ts);

  // Mark PR points with running max
  let runningMax = 0;
  points.forEach((p) => {
    if (p.rm1 > runningMax) {
      p.isPr = runningMax > 0; // first point is baseline, not a "broken" PR
      runningMax = p.rm1;
    }
  });

  return points;
}

function formatarTick(ts: number): string {
  const d = new Date(ts);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

interface TooltipPayload extends ChartPoint {}

function CustomTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const p = (payload[0] as Payload<ValueType, NameType>)?.payload as TooltipPayload | undefined;
  if (!p) return null;

  return (
    <TooltipBox>
      <p><strong>{p.data}</strong></p>
      <p>1RM estimado: {p.rm1.toFixed(2)} kg</p>
      <p>Ref: {p.peso} kg × {p.reps} reps</p>
      {p.tecnica && <p>Técnica: {p.tecnica}</p>}
      {p.isPr && <p style={{ color: GOLD, fontWeight: 700 }}>★ PR</p>}
    </TooltipBox>
  );
}

// Custom dot renderer — highlights PR points
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  if (payload.isPr) {
    return (
      <g key={`pr-dot-${payload.ts}`}>
        <circle cx={cx} cy={cy} r={7} fill={GOLD} stroke="#fff" strokeWidth={1.5} />
        <text x={cx} y={cy - 12} textAnchor="middle" fill={GOLD} fontSize={10}>★</text>
      </g>
    );
  }
  return <circle key={`dot-${payload.ts}`} cx={cx} cy={cy} r={3} fill={BLUE} />;
}

export const PowerliftingChart: React.FC = () => {
  const [intervalo, setIntervalo] = useState<TimeInterval>("1A");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);

  const logbook = useMemo(() => carregarLogbookCompleto(), []);
  const exercicios = useMemo(() => Object.keys(logbook).sort((a, b) => a.localeCompare(b)), [logbook]);

  // Auto-select first exercise with data
  useEffect(() => {
    if (!exercicioSelecionado && exercicios.length > 0) {
      setExercicioSelecionado(exercicios[0]);
    }
  }, [exercicios, exercicioSelecionado]);

  const allPoints = useMemo<ChartPoint[]>(() => {
    if (!exercicioSelecionado) return [];
    const registros = logbook[exercicioSelecionado] ?? [];
    return buildChartPoints(registros);
  }, [exercicioSelecionado, logbook]);

  const nowTs = allPoints.length ? allPoints[allPoints.length - 1].ts : Date.now();
  const cutoff = getCutoffTs(intervalo, nowTs);
  const filteredPoints = useMemo(
    () => allPoints.filter((p) => p.ts >= cutoff),
    [allPoints, cutoff]
  );

  // Absolute PR across all history (not just filtered period)
  const prAbsoluto = useMemo(
    () => allPoints.reduce((max, p) => Math.max(max, p.rm1), 0),
    [allPoints]
  );

  // Stats card
  const rm1Atual = filteredPoints.length > 0 ? filteredPoints[filteredPoints.length - 1].rm1 : null;
  const rm1Anterior = filteredPoints.length > 1 ? filteredPoints[filteredPoints.length - 2].rm1 : null;
  const variacao = rm1Atual !== null && rm1Anterior !== null ? rm1Atual - rm1Anterior : null;
  const sessoes = filteredPoints.length;
  const ultimoPrPonto = allPoints.reduce<ChartPoint | null>(
    (best, p) => (!best || p.rm1 > best.rm1 ? p : best),
    null
  );

  // Empty state
  if (exercicios.length === 0) {
    return (
      <Container>
        <Header>
          <Title>Gráfico Powerlifter</Title>
        </Header>
        <Content>
          <p data-testid="sem-dados" style={{ color: "#9ca3af", textAlign: "center", marginTop: 30 }}>
            Sem registros para listar.
          </p>
        </Content>
      </Container>
    );
  }

  const variacaoColor = variacao === null ? "#6b7280" : variacao > 0 ? GREEN : variacao < 0 ? RED : "#6b7280";
  const variacaoText =
    variacao === null ? "—" : variacao > 0 ? `+${variacao.toFixed(2)} kg` : `${variacao.toFixed(2)} kg`;

  const periodoOptions = TIME_INTERVAL_OPTIONS.filter((o) => o.value !== "Tudo");
  const chipValues = ["7d", "1M", "3M", "1A", "Tudo"] as const;

  return (
    <Container>
      <Header>
        <Title>Gráfico Powerlifter</Title>
        <SelectLabel>Evolução do 1RM Estimado</SelectLabel>

        <FiltersRow data-testid="filtros-row">
          <NativeSelect
            variant="dark"
            value={exercicioSelecionado}
            onChange={setExercicioSelecionado}
            options={[
              { label: "Selecione um exercício...", value: "" },
              ...exercicios.map((ex) => ({ label: ex, value: ex })),
            ]}
          />

          {isMobile ? (
            // Chips para mobile
            <div data-testid="periodo-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {periodoOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  data-testid={`chip-${o.value}`}
                  onClick={() => setIntervalo(o.value as TimeInterval)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "1px solid",
                    borderColor: intervalo === o.value ? GOLD : "#6b7280",
                    background: intervalo === o.value ? GOLD : "transparent",
                    color: intervalo === o.value ? "#000" : "#e5e7eb",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            // Select para desktop
            <NativeSelect
              data-testid="periodo-select"
              label="Período"
              variant="dark"
              value={intervalo}
              onChange={(v) => setIntervalo(v as TimeInterval)}
              options={periodoOptions}
            />
          )}
        </FiltersRow>
      </Header>

      <Content>
        {/* Stats card */}
        <div
          data-testid="stats-card"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 1,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)" }}>
            <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>1RM Atual</p>
            <p data-testid="stats-rm1" style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "2px 0 0" }}>
              {rm1Atual !== null ? `${rm1Atual.toFixed(2)} kg` : "—"}
            </p>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)" }}>
            <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>Variação</p>
            <p data-testid="stats-variacao" style={{ fontSize: 18, fontWeight: 700, color: variacaoColor, margin: "2px 0 0" }}>
              {variacaoText}
            </p>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)" }}>
            <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>Sessões</p>
            <p data-testid="stats-sessoes" style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "2px 0 0" }}>
              {sessoes}
            </p>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)" }}>
            <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>Último PR</p>
            <p data-testid="stats-ultimo-pr" style={{ fontSize: 18, fontWeight: 700, color: GOLD, margin: "2px 0 0" }}>
              {ultimoPrPonto?.data ?? "—"}
            </p>
          </div>
        </div>

        {/* PR reference indicator (outside SVG — testable) */}
        {prAbsoluto > 0 && (
          <div
            data-testid="pr-reference-value"
            style={{ fontSize: 11, color: GOLD, textAlign: "right", marginBottom: 4 }}
          >
            PR: {prAbsoluto.toFixed(2)} kg
          </div>
        )}

        {/* PR badge — visible count of PR sessions in period */}
        {filteredPoints.some((p) => p.isPr) && (
          <div
            data-testid="pr-badge"
            style={{ fontSize: 11, color: GOLD, marginBottom: 4 }}
          >
            ★ {filteredPoints.filter((p) => p.isPr).length} sessão(ões) de PR neste período
          </div>
        )}

        {filteredPoints.length === 0 ? (
          <p data-testid="sem-dados-exercicio" style={{ color: "#9ca3af", textAlign: "center", marginTop: 20 }}>
            Nenhum registro encontrado para o exercício selecionado no período.
          </p>
        ) : (
          <PanelsGrid>
            <Panel>
              <PanelTitle>
                <h3>1RM Estimado (Epley)</h3>
                <p>Evolução da força máxima estimada ao longo do tempo.</p>
              </PanelTitle>
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={filteredPoints}
                    margin={{ top: 16, right: 24, left: 6, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                    <XAxis
                      dataKey="ts"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      stroke="rgba(255,255,255,0.5)"
                      tickFormatter={formatarTick}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="rm1"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${v}kg`}
                      tickLine={false}
                      axisLine={false}
                      width={46}
                      domain={["auto", "dataMax + 5"]}
                    />

                    {/* Linha de PR — linha horizontal pontilhada dourada (RG6) */}
                    {prAbsoluto > 0 && (
                      <ReferenceLine
                        yAxisId="rm1"
                        y={prAbsoluto}
                        stroke={GOLD}
                        strokeDasharray="6 3"
                        strokeWidth={1.5}
                        label={{
                          value: `PR: ${prAbsoluto.toFixed(1)}`,
                          position: "right",
                          fill: GOLD,
                          fontSize: 10,
                        }}
                      />
                    )}

                    <Tooltip content={(props) => <CustomTooltip {...props} />} />

                    <Line
                      yAxisId="rm1"
                      type="monotone"
                      dataKey="rm1"
                      name="1RM Estimado (kg)"
                      stroke={BLUE}
                      strokeWidth={2.5}
                      dot={CustomDot}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartBox>
            </Panel>
          </PanelsGrid>
        )}
      </Content>
    </Container>
  );
};
