import { useMemo } from "react";
import styled from "styled-components";
import type { DadosTreino } from "../../types/TrainingData";

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

const InfoCard = styled.div`
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
`;

const InfoLabel = styled.p`
  font-size: 11px;
  color: #6b7280;
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoVal = styled.p<{ $big?: boolean }>`
  font-size: ${(p) => (p.$big ? "22px" : "13px")};
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

const ExpBtn = styled.button`
  width: 100%;
  padding: 13px 14px;
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  text-align: left;
`;

const BtnIcon = styled.span<{ $color: string }>`
  font-size: 20px;
  color: ${(p) => p.$color};
`;

function parseDateBR(data: string): number | null {
  const parts = data.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d).getTime();
}

function useStats() {
  return useMemo(() => {
    const db = JSON.parse(
      localStorage.getItem("dadosTreino") || "{}"
    ) as DadosTreino;

    let count = 0;
    let minTs = Infinity;
    let maxTs = -Infinity;

    Object.values(db).forEach((ciclos) => {
      Object.values(ciclos).forEach((reg) => {
        count++;
        if (reg.data) {
          const ts = parseDateBR(reg.data);
          if (ts) {
            if (ts < minTs) minTs = ts;
            if (ts > maxTs) maxTs = ts;
          }
        }
      });
    });

    const fmtDate = (ts: number) =>
      new Date(ts).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });

    return {
      count,
      periodo:
        count > 0 && minTs !== Infinity
          ? `${fmtDate(minTs)} → ${fmtDate(maxTs)}`
          : "Sem dados",
    };
  }, []);
}

function exportJSON() {
  const data = localStorage.getItem("dadosTreino") || "{}";
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gymwave_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV() {
  const db = JSON.parse(
    localStorage.getItem("dadosTreino") || "{}"
  ) as DadosTreino;

  const rows: string[] = [
    "data,exercicio,ciclo,serie,peso_kg,reps",
  ];

  Object.entries(db).forEach(([exercicio, ciclos]) => {
    Object.entries(ciclos).forEach(([ciclo, reg]) => {
      (reg.pesos || []).forEach((peso, i) => {
        const rep = (reg.reps || [])[i] || "";
        if (peso || rep) {
          rows.push(
            [reg.data, exercicio, ciclo, i + 1, peso, rep]
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(",")
          );
        }
      });
    });
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gymwave_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Exportar() {
  const { count, periodo } = useStats();

  return (
    <Screen>
      <TopBar>
        <TopBarTitle>Exportar dados</TopBarTitle>
        <TopBarSub>Faça backup do seu histórico</TopBarSub>
      </TopBar>
      <Content>
        <InfoCard>
          <InfoLabel>Total de registros</InfoLabel>
          <InfoVal $big>{count} treinos</InfoVal>
          <InfoLabel style={{ marginTop: 10 }}>Período</InfoLabel>
          <InfoVal>{periodo}</InfoVal>
        </InfoCard>

        <ExpBtn onClick={exportCSV}>
          <BtnIcon $color="#16a34a">⬇</BtnIcon>
          Exportar como CSV
        </ExpBtn>
        <ExpBtn onClick={exportJSON}>
          <BtnIcon $color="#d97706">⬇</BtnIcon>
          Exportar como JSON
        </ExpBtn>
      </Content>
    </Screen>
  );
}
