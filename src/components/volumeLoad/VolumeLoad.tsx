import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  calcVolumeLoad,
  calcStreakSemanas,
  calcEstagnadoMusculo,
  calcQuedaCargaMusculo,
} from "../../utils/volumeLoadCalc";

type Granularity = "week" | "month";

const Screen = styled.div`
  width: 100%;
  height: 100%;
  background: #f5f6fa;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const TopBar = styled.div`
  background: #ffffff;
  padding: 14px 16px 10px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 5;
`;

const TopBarTitle = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

const TopBarSub = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 2px 0 0;
`;

const Content = styled.div`
  padding: 12px 14px 24px;
`;

const ToggleRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
`;

const ToggleChip = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
  background: ${(p) => (p.$active ? "#111827" : "#e5e7eb")};
  color: ${(p) => (p.$active ? "#ffffff" : "#374151")};
  font-weight: ${(p) => (p.$active ? 500 : 400)};
  transition: background 0.15s;
`;

const DeloadBanner = styled.div`
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
`;

const DeloadTitle = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: #92400e;
  margin: 0 0 2px;
`;

const DeloadSub = styled.p`
  font-size: 11px;
  color: #92400e;
  margin: 0;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
`;

const SummaryCard = styled.div`
  flex: 1;
  background: #f0f0f0;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
`;

const SummaryNum = styled.div<{ $color?: string }>`
  font-size: 18px;
  font-weight: 500;
  color: ${(p) => p.$color || "#111827"};
`;

const SummaryLabel = styled.div`
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
`;

const VlCard = styled.div`
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
`;

const VlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const VlMusculo = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

const VlDelta = styled.span<{ $positive: boolean; $zero: boolean }>`
  font-size: 11px;
  color: ${(p) =>
    p.$zero ? "#6b7280" : p.$positive ? "#16a34a" : "#dc2626"};
`;

const VlBarWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const VlBarLabel = styled.span`
  font-size: 10px;
  color: #6b7280;
  width: 64px;
  flex-shrink: 0;
`;

const VlBarBg = styled.div`
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 99px;
  overflow: hidden;
`;

const VlBarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  border-radius: 99px;
  background: ${(p) => p.$color};
  width: ${(p) => p.$pct}%;
`;

const VlNum = styled.span`
  font-size: 11px;
  color: #6b7280;
  width: 60px;
  text-align: right;
  flex-shrink: 0;
`;

const BadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
`;

const SeriesBadge = styled.span<{ $status: "ok" | "low" | "high" }>`
  display: inline-block;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(p) =>
    p.$status === "ok" ? "#dcfce7" :
    p.$status === "low" ? "#fefce8" : "#fef2f2"};
  color: ${(p) =>
    p.$status === "ok" ? "#166534" :
    p.$status === "low" ? "#92400e" : "#991b1b"};
`;

const DiagBadge = styled.span<{ $variant: "estagnado" | "queda" }>`
  display: inline-block;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(p) => p.$variant === "estagnado" ? "#fff7ed" : "#fef2f2"};
  color: ${(p) => p.$variant === "estagnado" ? "#c2410c" : "#991b1b"};
`;

const EmptyMsg = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  padding: 32px 0;
`;

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k kg`;
  return `${Math.round(n)} kg`;
}

function seriesStatus(series: number): "ok" | "low" | "high" {
  if (series < 10) return "low";
  if (series > 20) return "high";
  return "ok";
}

function seriesLabel(series: number): string {
  const status = seriesStatus(series);
  if (status === "low") return "volume baixo";
  if (status === "high") return "risco overtraining";
  return "";
}

export default function VolumeLoad() {
  const [granularity, setGranularity] = useState<Granularity>("week");

  const dados = useMemo(() => calcVolumeLoad(granularity), [granularity]);
  const totalAtual = useMemo(
    () => dados.reduce((s, d) => s + d.volumeAtual, 0),
    [dados]
  );
  const streak = useMemo(() => calcStreakSemanas(), []);

  const withData = dados.filter(
    (d) => d.volumeAtual > 0 || d.volumeAnterior > 0
  );
  const maxVol = Math.max(
    ...withData.map((d) => Math.max(d.volumeAtual, d.volumeAnterior)),
    1
  );

  const totalDelta =
    dados.reduce((s, d) => s + d.volumeAnterior, 0) > 0
      ? Math.round(
          ((totalAtual -
            dados.reduce((s, d) => s + d.volumeAnterior, 0)) /
            dados.reduce((s, d) => s + d.volumeAnterior, 0)) *
            100
        )
      : 0;

  const subtitle =
    granularity === "month"
      ? "Mês atual vs mês anterior"
      : "Semana atual vs semana anterior";

  const summaryPeriodLabel =
    granularity === "month" ? "vs mês ant." : "vs semana ant.";

  return (
    <Screen>
      <TopBar>
        <TopBarTitle>Volume load por músculo</TopBarTitle>
        <TopBarSub>{subtitle}</TopBarSub>
      </TopBar>
      <Content>
        <ToggleRow>
          <ToggleChip
            $active={granularity === "week"}
            onClick={() => setGranularity("week")}
          >
            Esta semana
          </ToggleChip>
          <ToggleChip
            $active={granularity === "month"}
            onClick={() => setGranularity("month")}
          >
            Este mês
          </ToggleChip>
        </ToggleRow>

        {streak >= 10 && (
          <DeloadBanner>
            <DeloadTitle>{streak} semanas de treino contínuo</DeloadTitle>
            <DeloadSub>
              Você pode estar acima do teto recuperável. Considere 1–2 semanas com volume reduzido.
            </DeloadSub>
          </DeloadBanner>
        )}

        <SummaryRow>
          <SummaryCard>
            <SummaryNum>{fmt(totalAtual)}</SummaryNum>
            <SummaryLabel>vol. load total</SummaryLabel>
          </SummaryCard>
          <SummaryCard>
            <SummaryNum
              $color={
                totalDelta > 0
                  ? "#16a34a"
                  : totalDelta < 0
                  ? "#dc2626"
                  : "#111827"
              }
            >
              {totalDelta > 0 ? `+${totalDelta}%` : totalDelta === 0 ? "—" : `${totalDelta}%`}
            </SummaryNum>
            <SummaryLabel>{summaryPeriodLabel}</SummaryLabel>
          </SummaryCard>
        </SummaryRow>

        {withData.length === 0 && (
          <EmptyMsg>
            Nenhum treino registrado esta semana ou na anterior.
          </EmptyMsg>
        )}

        {withData.map((d) => {
          const estagnado = calcEstagnadoMusculo(d.musculo);
          const quedaCarga = calcQuedaCargaMusculo(d.musculo, granularity);
          const badgeLabel = seriesLabel(d.seriesAtual);

          return (
            <VlCard key={d.musculo}>
              <VlHeader>
                <div>
                  <VlMusculo>{d.musculo}</VlMusculo>
                  {d.seriesAtual > 0 && (
                    <BadgesRow>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>
                        {d.seriesAtual} séries
                      </span>
                      {badgeLabel && (
                        <SeriesBadge $status={seriesStatus(d.seriesAtual)}>
                          {badgeLabel}
                        </SeriesBadge>
                      )}
                      {estagnado && (
                        <DiagBadge $variant="estagnado">estagnado</DiagBadge>
                      )}
                      {quedaCarga && (
                        <DiagBadge $variant="queda">↓ carga</DiagBadge>
                      )}
                    </BadgesRow>
                  )}
                </div>
                <VlDelta
                  $positive={d.delta > 0}
                  $zero={d.delta === 0}
                >
                  {d.delta > 0
                    ? `+${d.delta}%`
                    : d.delta < 0
                    ? `${d.delta}%`
                    : "—"}
                </VlDelta>
              </VlHeader>

              {d.volumeAnterior > 0 && (
                <VlBarWrap>
                  <VlBarLabel>
                    {granularity === "month" ? "Mês ant." : "Sem. ant."}
                  </VlBarLabel>
                  <VlBarBg>
                    <VlBarFill
                      $pct={Math.round((d.volumeAnterior / maxVol) * 100)}
                      $color="#d1d5db"
                    />
                  </VlBarBg>
                  <VlNum>{fmt(d.volumeAnterior)}</VlNum>
                </VlBarWrap>
              )}

              <VlBarWrap>
                <VlBarLabel>
                  {granularity === "month" ? "Este mês" : "Esta sem."}
                </VlBarLabel>
                <VlBarBg>
                  <VlBarFill
                    $pct={Math.round((d.volumeAtual / maxVol) * 100)}
                    $color={
                      d.delta > 0
                        ? "#16a34a"
                        : d.delta < 0
                        ? "#dc2626"
                        : "#2563eb"
                    }
                  />
                </VlBarBg>
                <VlNum>{fmt(d.volumeAtual)}</VlNum>
              </VlBarWrap>
            </VlCard>
          );
        })}
      </Content>
    </Screen>
  );
}
