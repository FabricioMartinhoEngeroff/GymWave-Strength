import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

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
import { carregarDados } from "../../utils/storage";
import { getCutoffTs, TIME_INTERVAL_OPTIONS, type TimeInterval } from "../../utils/timeFilter";
import {
  buildExerciseHistory,
  type SessionPoint,
} from "../../utils/workoutMetrics";

const dayMs = 24 * 60 * 60 * 1000;
const BLUE = "#5470C6";
const GRID = "rgba(255,255,255,0.22)";

const formatarTick = (ts: number): string => {
  const d = new Date(ts);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
};

function TooltipThermometer({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const p = (payload[0] as Payload<ValueType, NameType>)?.payload as SessionPoint | undefined;
  if (!p) return null;

  return (
    <TooltipBox>
      <p>
        <strong>{p.data}</strong>
      </p>
      <p>
        Top Set: {Math.round(p.topSetPeso)} kg × {Math.round(p.topSetReps)} reps
      </p>
      <p>1RM estimado: {Math.round(p.e1rm)} kg</p>
      {"mediaMensal" in p && typeof (p as any).mediaMensal === "number" ? (
        <p>Média mensal (Top Set): {Math.round((p as any).mediaMensal)} kg</p>
      ) : null}
    </TooltipBox>
  );
}

function TooltipOverdrive({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const p = (payload[0] as Payload<ValueType, NameType>)?.payload as SessionPoint | undefined;
  if (!p) return null;

  return (
    <TooltipBox>
      <p>
        <strong>{p.data}</strong>
      </p>
      <p>
        Top Set: {Math.round(p.topSetPeso)} kg × {Math.round(p.topSetReps)} reps
      </p>
      <p>1RM estimado: {Math.round(p.e1rm)} kg</p>
    </TooltipBox>
  );
}

export const PowerliftingChart: React.FC = () => {
  const [intervalo, setIntervalo] = useState<TimeInterval>("3M");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");

  useEffect(() => {
    function updateVH() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }

    updateVH();
    window.addEventListener("resize", updateVH);
    window.addEventListener("orientationchange", updateVH);
    return () => {
      window.removeEventListener("resize", updateVH);
      window.removeEventListener("orientationchange", updateVH);
    };
  }, []);

  const history = useMemo(() => buildExerciseHistory(carregarDados()), []);
  const exercicios = useMemo(
    () => Object.keys(history).sort((a, b) => a.localeCompare(b)),
    [history]
  );

  const sessionsAll = exercicioSelecionado ? history[exercicioSelecionado] ?? [] : [];
  const nowTs = sessionsAll.length ? sessionsAll[sessionsAll.length - 1].ts : 0;
  const cutoff = getCutoffTs(intervalo, nowTs);
  const sessions = useMemo(
    () => sessionsAll.filter((s) => s.ts >= cutoff),
    [sessionsAll, cutoff]
  );

  const sessionsWithMonthlyAvg = useMemo(() => {
    const monthKey = (ts: number) => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    const buckets = new Map<string, { sum: number; count: number }>();
    sessions.forEach((s) => {
      const key = monthKey(s.ts);
      const b = buckets.get(key) ?? { sum: 0, count: 0 };
      buckets.set(key, { sum: b.sum + s.topSetPeso, count: b.count + 1 });
    });

    const avgByMonth = new Map<string, number>();
    buckets.forEach((b, key) => {
      avgByMonth.set(key, b.count ? b.sum / b.count : 0);
    });

    return sessions.map((s) => ({
      ...s,
      mediaMensal: avgByMonth.get(monthKey(s.ts)) ?? 0,
    }));
  }, [sessions]);

  const last = sessionsAll.length ? sessionsAll[sessionsAll.length - 1] : null;
  const diasDesdeUltimoTreino = last ? Math.max(0, Math.round((Date.now() - last.ts) / dayMs)) : null;

  return (
    <Container>
      <Header>
        <Title>Dashboard — Força & Fadiga</Title>
        <SelectLabel>Escolha o exercício e o período</SelectLabel>
        <FiltersRow>
          <NativeSelect
            variant="dark"
            value={exercicioSelecionado}
            onChange={setExercicioSelecionado}
            options={[
              { label: "Selecione um exercício...", value: "" },
              ...exercicios.map((ex) => ({ label: ex, value: ex })),
            ]}
          />
          <NativeSelect
            label="Período"
            variant="dark"
            value={intervalo}
            onChange={(v) => setIntervalo(v as TimeInterval)}
            options={TIME_INTERVAL_OPTIONS.filter((o) => o.value !== "Tudo")}
          />
        </FiltersRow>

        {last ? (
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
            Último treino: <strong style={{ color: "#ffffff" }}>{last.data}</strong> — Top Set{" "}
            <strong style={{ color: "#ffffff" }}>
              {Math.round(last.topSetPeso)}×{Math.round(last.topSetReps)}
            </strong>{" "}
            — 1RM~ <strong style={{ color: "#ffffff" }}>{Math.round(last.e1rm)}kg</strong>
            {typeof diasDesdeUltimoTreino === "number" ? (
              <>
                {" "}
                — dias desde último treino:{" "}
                <strong style={{ color: diasDesdeUltimoTreino >= 7 ? "#FCA5A5" : "#e5e7eb" }}>
                  {diasDesdeUltimoTreino}
                </strong>
              </>
            ) : null}
          </div>
        ) : null}
      </Header>

      <Content>
        {!exercicioSelecionado ? (
          <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 30 }}>
            Selecione um exercício para visualizar os gráficos.
          </p>
        ) : sessions.length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 30 }}>
            Sem dados nesse período.
          </p>
        ) : (
          <PanelsGrid>
            <Panel>
              <PanelTitle>
                <h3>Termômetro da Evolução</h3>
                <p>Top Set (kg) + média mensal (kg) estilo “ação”.</p>
              </PanelTitle>
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={sessionsWithMonthlyAvg}
                    margin={{ top: 8, right: 18, left: 6, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="ts"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      stroke="rgba(255,255,255,0.6)"
                      tickFormatter={formatarTick}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="kg"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${v}kg`}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={[0, "dataMax + 5"]}
                    />

                    <Tooltip content={(props) => <TooltipThermometer {...props} />} />

                    <Legend
                      verticalAlign="top"
                      align="center"
                      height={24}
                      wrapperStyle={{ color: "rgba(255,255,255,0.75)" }}
                    />

                    <Line
                      yAxisId="kg"
                      type="monotone"
                      dataKey="topSetPeso"
                      name="Top Set (kg)"
                      stroke={BLUE}
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="kg"
                      type="monotone"
                      dataKey="mediaMensal"
                      name="Média mensal (kg)"
                      stroke="rgba(84,112,198,0.55)"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartBox>
            </Panel>

            <Panel>
              <PanelTitle>
                <h3>Low Volume — Reps na Top Set</h3>
                <p>Barras em azul: quantas reps você fez na Top Set (com tooltip do peso).</p>
              </PanelTitle>
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sessions} margin={{ top: 8, right: 18, left: 6, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="ts"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      stroke="rgba(255,255,255,0.6)"
                      tickFormatter={formatarTick}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="reps"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${v}`}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      domain={[0, "dataMax + 1"]}
                    />

                    <Tooltip content={(props) => <TooltipOverdrive {...props} />} />

                    <Bar
                      yAxisId="reps"
                      dataKey="topSetReps"
                      name="Top Set (reps)"
                      fill={BLUE}
                      radius={[8, 8, 0, 0]}
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
