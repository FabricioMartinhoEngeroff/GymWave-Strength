import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  buildPRIntervals,
  type PRIntervalPoint,
  type SessionPoint,
} from "../../utils/workoutMetrics";

const dayMs = 24 * 60 * 60 * 1000;
const BLUE = "#5470C6";
const BLUE_2 = "rgba(84,112,198,0.55)";
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
      <p>Volume efetivo: {Math.round(p.tonnage)} kg·reps</p>
      <p>1RM estimado: {Math.round(p.e1rm)} kg</p>
    </TooltipBox>
  );
}

function TooltipOverdrive({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const p = (payload[0] as Payload<ValueType, NameType>)?.payload as
    | (SessionPoint & { diasPR?: number; alerta?: PRIntervalPoint["alerta"] })
    | undefined;
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
      {typeof p.diasPR === "number" ? <p>Dias para novo PR: {p.diasPR}</p> : <p>Sem PR neste dia.</p>}
      {typeof p.rpe === "number" ? <p>RPE: {p.rpe}</p> : <p>RPE: não registrado.</p>}
      {p.alerta === "plateau" ? (
        <p style={{ color: "#FCA5A5" }}>Sinal: platô/fadiga (pode ser hora de deload).</p>
      ) : null}
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

  const prAll = useMemo(() => buildPRIntervals(sessionsAll), [sessionsAll]);
  const prByTs = useMemo(() => {
    const m = new Map<number, PRIntervalPoint>();
    prAll.forEach((p) => m.set(p.ts, p));
    return m;
  }, [prAll]);

  const overdriveData = useMemo(
    () =>
      sessions.map((s) => {
        const pr = prByTs.get(s.ts);
        return {
          ...s,
          diasPR: pr?.dias,
          alerta: pr?.alerta,
        };
      }),
    [sessions, prByTs]
  );

  const hasRPE = useMemo(
    () => sessions.some((s) => typeof s.rpe === "number" && Number.isFinite(s.rpe)),
    [sessions]
  );

  const last = sessionsAll.length ? sessionsAll[sessionsAll.length - 1] : null;
  const lastPR = prAll.length ? prAll[prAll.length - 1] : null;
  const diasDesdeUltimoPR =
    last && lastPR ? Math.max(0, Math.round((last.ts - lastPR.ts) / dayMs)) : null;

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
            {typeof diasDesdeUltimoPR === "number" ? (
              <>
                {" "}
                — dias desde último PR:{" "}
                <strong style={{ color: diasDesdeUltimoPR >= 21 ? "#FCA5A5" : "#e5e7eb" }}>
                  {diasDesdeUltimoPR}
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
                <p>Barras em azul: Top Set (kg) + Volume efetivo (kg·reps).</p>
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
                      yAxisId="kg"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${v}kg`}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={[0, "dataMax + 5"]}
                    />
                    <YAxis
                      yAxisId="vol"
                      orientation="right"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${Math.round(v)}`}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                    />

                    <Tooltip content={(props) => <TooltipThermometer {...props} />} />

                    <Bar
                      yAxisId="kg"
                      dataKey="topSetPeso"
                      name="Top Set (kg)"
                      fill={BLUE}
                      radius={[8, 8, 0, 0]}
                    />

                    <Bar
                      yAxisId="vol"
                      dataKey="tonnage"
                      name="Volume (kg·reps)"
                      fill={BLUE_2}
                      radius={[8, 8, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartBox>
            </Panel>

            <Panel>
              <PanelTitle>
                <h3>Janela de Overdrive</h3>
                <p>
                  Barras: dias entre PRs (1RM~) e RPE (Top Set).
                  {!hasRPE ? " (Sem RPE registrado ainda)" : ""}
                </p>
              </PanelTitle>
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={overdriveData} margin={{ top: 8, right: 18, left: 6, bottom: 0 }}>
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
                      yAxisId="dias"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${v}d`}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      domain={[0, "dataMax + 2"]}
                    />
                    <YAxis
                      yAxisId="rpe"
                      orientation="right"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${v}`}
                      tickLine={false}
                      axisLine={false}
                      width={38}
                      domain={[1, 10]}
                      hide={!hasRPE}
                    />

                    <Tooltip content={(props) => <TooltipOverdrive {...props} />} />

                    <Bar yAxisId="dias" dataKey="diasPR" name="Dias p/ PR" radius={[8, 8, 0, 0]}>
                      {overdriveData.map((d) => (
                        <Cell
                          key={d.ts}
                          fill={d.alerta === "plateau" ? "#EF4444" : BLUE}
                          opacity={typeof d.diasPR === "number" ? 0.95 : 0}
                        />
                      ))}
                    </Bar>

                    <Bar
                      yAxisId="rpe"
                      dataKey="rpe"
                      name="RPE"
                      fill="rgba(251,191,36,0.55)"
                      radius={[8, 8, 0, 0]}
                      hide={!hasRPE}
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
