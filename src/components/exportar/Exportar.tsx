import { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { DadosTreino, Logbook, PlanoTreino } from "../../types/TrainingData";
import {
  DropZone,
  DropIcon,
  DropText,
  DropSub,
  HiddenInput,
  FileName,
  SectionLabel,
  TableWrap,
  Table,
  Th,
  Td,
  Tr,
  PesoBadge,
  EmptyBadge,
  ResultCard,
  ResultTitle,
  ResultRow,
  BtnRow,
  BtnPrimary,
  BtnWarning,
} from "../adminImport/AdminImport.styles";

// ─── Styled components ─────────────────────────────────────────────────────────

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

const Divider = styled.div`
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  margin: 16px 0;
`;

const ImportSection = styled.div`
  margin-top: 4px;
`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ImportRow {
  sessao: string;
  ordem: number;
  exercicio: string;
  musculo_primario: string;
  series_validas: number;
  series_C1_validas?: number;
  series_C2_validas?: number;
  series_C3_validas?: number;
  series_C4_validas?: number;
  rep_min: number;
  rep_max: number;
  peso_C1_kg?: number | string;
  peso_C2_kg?: number | string;
  peso_C3_kg?: number | string;
  peso_C4_kg?: number | string;
}

interface ImportResult {
  total: number;
  preservados: number;
  porSessao: Record<string, number>;
}

const CICLO_COLS: { col: keyof ImportRow; cicloId: string }[] = [
  { col: "peso_C1_kg", cicloId: "C1" },
  { col: "peso_C2_kg", cicloId: "C2" },
  { col: "peso_C3_kg", cicloId: "C3" },
  { col: "peso_C4_kg", cicloId: "C4" },
];

const COLUMN_MAP: [RegExp, string][] = [
  [/sess[aã]o/i,              "sessao"],
  [/^treino$/i,               "sessao"],   // v4 logbook usa "Treino" em vez de "Sessão"
  [/^ord[.\s]/i,              "ordem"],   // "Ord." antes do padrão genérico
  [/ordem/i,                  "ordem"],
  [/exerc[ií]cio/i,           "exercicio"],
  [/grupo|m[uú]sculo/i,       "musculo_primario"],
  [/rep.*m[ií]n/i,            "rep_min"],
  [/top.*m[ií]n/i,            "rep_min"],   // v4 logbook: "Top Mín"
  [/rep.*m[aá]x/i,            "rep_max"],
  [/top.*m[aá]x/i,            "rep_max"],   // v4 logbook: "Top Máx"
  // séries por ciclo — devem vir ANTES do padrão genérico
  [/s[eé]ries.*c1|c1.*s[eé]ries/i,  "series_C1_validas"],
  [/s[eé]ries.*c2|c2.*s[eé]ries/i,  "series_C2_validas"],
  [/s[eé]ries.*c3|c3.*s[eé]ries/i,  "series_C3_validas"],
  [/s[eé]ries.*c4|c4.*s[eé]ries/i,  "series_C4_validas"],
  [/s[eé]ries/i,              "series_validas"],  // fallback genérico
  [/peso\s*c1/i,              "peso_C1_kg"],
  [/top\s*set.*kg/i,          "peso_C1_kg"],   // v4 logbook: "TOP SET Kg"
  [/peso\s*c2/i,              "peso_C2_kg"],
  [/back.*off.*kg/i,          "peso_C2_kg"],   // v4 logbook: "BACK-OFF Kg"
  [/peso\s*c3/i,              "peso_C3_kg"],
  [/peso\s*c4/i,              "peso_C4_kg"],
];

// ─── Name mapping (planilha → app canonical) ─────────────────────────────────

const NOME_MAP: Record<string, string> = {
  // ── Planilha v3 (nomes curtos de sessão de Braço e Upper) ─────────────────
  "Crossover braço estendido polia alta":        "Crossover braço estendido",
  "Pulldown braço estendido tronco inclinado":   "Pulldown inclinado",
  "Rosca scott mesa":                            "Rosca scott",
  "Antebraço mesa scott barra W invertida":      "Antebraço invertido",
  "Antebraço rola barra na palma cabo":          "Antebraço rola palma",
  "Polia barra reta pronada":                    "Tríceps polia barra reta",
  "Testa halteres deitado":                      "Tríceps testa halteres",
  "Polia supinada unilateral":                   "Rosca polia unilateral",
  "Mesa scott":                                  "Rosca scott",
  "Martelo halteres":                            "Rosca martelo",
  "Polia alta unilateral":                       "Rosca polia alta",
  "Mesa scott barra W invertida":                "Antebraço invertido",
  "Rola barra na palma cabo":                    "Antebraço rola palma",
  // ── Planilha v4 ──────────────────────────────────────────────────────────
  "Remada peito apoiado halteres (livre)":       "Remada peito apoiado",
  // ── Planilha v2 (nomes descritivos longos) ──────────────────────────────
  "Panturrilha sentado máquina":                 "Panturrilha sentado",
  "Pull-around cabo polia baixa":                "Pull-around cabo",
  "Pulldown braço estendido inclinado":          "Pulldown inclinado",
  "Panturrilha no leg press":                    "Panturrilha leg press",
  "Barra fixa pegada aberta pronada":            "Barra fixa pronada",
  "Desenvolvimento máquina pegada neutra":       "Desenvolvimento máquina",
  "Remada peito apoiado banco inclinado":        "Remada peito apoiado",
  "Supino halteres com amplitude":               "Supino halteres amplitude",
  "Tríceps testa halteres deitado":              "Tríceps testa halteres",
  "Tríceps polia barra reta pronada":            "Tríceps polia barra reta",
  "Tríceps polia alta unilateral supinada":      "Tríceps polia unilateral",
  "Rosca inclinada halteres 45°":                "Rosca inclinada 45°",
  "Rosca scott mesa unilateral":                 "Rosca scott unilateral",
  "Rosca polia alta unilateral":                 "Rosca polia alta",
  "Rosca inversa barra ou halteres":             "Rosca inversa",
  "Rolar barra na mão no cabo":                  "Rolar barra cabo",
  "Abdômen infra banco inclinado":               "Abdômen infra banco",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapColumns(raw: Record<string, unknown>[]): Record<string, unknown>[] {
  if (raw.length === 0) return raw;
  const keyMap: Record<string, string> = {};
  Object.keys(raw[0]).forEach((key) => {
    const flat = key.replace(/[\r\n]+/g, " ").trim();
    for (const [pattern, target] of COLUMN_MAP) {
      if (pattern.test(flat)) { keyMap[key] = target; break; }
    }
  });
  return raw.map((row) => {
    const out: Record<string, unknown> = {};
    Object.entries(row).forEach(([k, v]) => { out[keyMap[k] ?? k] = v; });
    return out;
  });
}

function xlsxToJson(ws: XLSX.WorkSheet): Record<string, unknown>[] {
  const arrays = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  let headerIdx = 0;
  for (let i = 0; i < Math.min(6, arrays.length); i++) {
    const row = arrays[i] as string[];
    if (row.some((cell) => /sess[aã]o|exerc[ií]cio/i.test(String(cell ?? "")))) {
      headerIdx = i;
      break;
    }
  }
  const headers = arrays[headerIdx] as string[];
  return arrays
    .slice(headerIdx + 1)
    .filter((row) => (row as unknown[]).filter((c) => c !== "" && c != null).length > 2)
    .map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h] = (row as unknown[])[i] ?? ""; });
      return obj;
    });
}

function parseSeries(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : Math.max(1, Math.min(3, n));
}

const SESSION_ORDER: Record<string, number> = {
  "Upper A": 0, "Upper B": 1, "Lower A": 2, "Lower B": 3, "Braço": 4,
};

function normalizeRows(raw: Record<string, unknown>[]): ImportRow[] {
  return raw
    .map((r) => {
      const nomeRaw = String(r.exercicio ?? "").trim();
      return {
      sessao: String(r.sessao ?? ""),
      ordem: Number(r.ordem ?? 0),
      exercicio: NOME_MAP[nomeRaw] ?? nomeRaw,
      musculo_primario: String(r.musculo_primario ?? ""),
      series_validas: parseSeries(r.series_validas) ?? 3,
      series_C1_validas: parseSeries(r.series_C1_validas),
      series_C2_validas: parseSeries(r.series_C2_validas),
      series_C3_validas: parseSeries(r.series_C3_validas),
      series_C4_validas: parseSeries(r.series_C4_validas),
      rep_min: Number(r.rep_min ?? 0),
      rep_max: Number(r.rep_max ?? 0),
      peso_C1_kg: r.peso_C1_kg as string | number | undefined,
      peso_C2_kg: r.peso_C2_kg as string | number | undefined,
      peso_C3_kg: r.peso_C3_kg as string | number | undefined,
      peso_C4_kg: r.peso_C4_kg as string | number | undefined,
    };})
    .filter((r) => r.exercicio !== "")
    .sort((a, b) => {
      const sa = SESSION_ORDER[a.sessao] ?? 99;
      const sb = SESSION_ORDER[b.sessao] ?? 99;
      if (sa !== sb) return sa - sb;
      return a.ordem - b.ordem;
    });
}

function parsePeso(val: unknown): string | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  if (isNaN(n) || n <= 0) return null;
  return String(n);
}

function getTodayBR(): string {
  return new Date().toLocaleDateString("pt-BR");
}

// ─── Export helpers ────────────────────────────────────────────────────────────

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
  const logbook = JSON.parse(
    localStorage.getItem("logbook") || "{}"
  ) as Logbook;

  const rows: string[] = [
    "data,exercicio,treino_id,top_set_kg,top_set_reps,backoff_kg,backoff_reps,series_validas,extra_kg,extra_reps",
  ];

  Object.values(logbook).forEach((registros) => {
    registros.forEach((reg) => {
      rows.push(
        [
          reg.data, reg.exercicio, reg.treinoId,
          reg.topSetKg, reg.topSetReps,
          reg.backoffKg, reg.backoffReps,
          reg.seriesValidas ?? 2,
          reg.extraKg ?? "", reg.extraReps ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
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

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Exportar() {
  const { count, periodo } = useStats();

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setResult(null);
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        setRows(normalizeRows(mapColumns(parsed.data)));
      };
      reader.readAsText(file, "UTF-8");
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = xlsxToJson(ws);
        setRows(normalizeRows(mapColumns(json)));
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function desfazerImport() {
    const ok = window.confirm("Desfazer a importação e restaurar os dados anteriores?");
    if (!ok) return;
    const backup = localStorage.getItem("dadosTreino_backup");
    if (backup) localStorage.setItem("dadosTreino", backup);
    const planoBackup = localStorage.getItem("planoTreino_backup");
    if (planoBackup) localStorage.setItem("planoTreino", planoBackup);
    setResult(null);
    setCanUndo(false);
  }

  function confirmarImport() {
    localStorage.setItem("dadosTreino_backup", localStorage.getItem("dadosTreino") || "{}");
    localStorage.setItem("planoTreino_backup", localStorage.getItem("planoTreino") || "{}");
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const planoExistente: PlanoTreino = JSON.parse(localStorage.getItem("planoTreino") || "{}");
    const planoNovo: PlanoTreino = {};
    const porSessao: Record<string, number> = {};
    let total = 0;
    let preservados = 0;
    const today = getTodayBR();

    rows.forEach((row) => {
      const seriesCount = Math.max(1, Math.min(3, row.series_validas));
      const sessao = row.sessao || "Sem sessão";

      // Atualiza plano sempre (sobrescreve — é template, não histórico)
      if (!planoNovo[sessao]) planoNovo[sessao] = {};
      planoNovo[sessao][row.exercicio] = {
        ordem: row.ordem,
        series_validas: seriesCount,
        ...(row.series_C1_validas !== undefined && { series_C1: row.series_C1_validas }),
        ...(row.series_C2_validas !== undefined && { series_C2: row.series_C2_validas }),
        ...(row.series_C3_validas !== undefined && { series_C3: row.series_C3_validas }),
        ...(row.series_C4_validas !== undefined && { series_C4: row.series_C4_validas }),
      };

      CICLO_COLS.forEach(({ col, cicloId }) => {
        const pesoStr = parsePeso(row[col]);
        if (!pesoStr) return;

        if (!db[row.exercicio]) db[row.exercicio] = {};

        // Preserva entradas existentes — só adiciona ciclos ainda não registrados
        if (db[row.exercicio][cicloId]) {
          preservados++;
          return;
        }

        db[row.exercicio][cicloId] = {
          data: today,
          pesos: Array(seriesCount).fill(pesoStr),
          reps: Array(seriesCount).fill(""),
          obs: "",
          exercicio: row.exercicio,
        };

        porSessao[sessao] = (porSessao[sessao] || 0) + 1;
        total++;
      });
    });

    localStorage.setItem("dadosTreino", JSON.stringify(db));
    localStorage.setItem("planoTreino", JSON.stringify({ ...planoExistente, ...planoNovo }));
    setResult({ total, preservados, porSessao });
    setCanUndo(true);
    setRows([]);
    setFileName(null);
  }

  const totalLinhasComPeso = rows.filter((r) =>
    CICLO_COLS.some(({ col }) => parsePeso(r[col]) !== null)
  ).length;

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

        <Divider />

        <ExpBtn onClick={() => { setShowImport((v) => !v); setResult(null); setRows([]); setFileName(null); }}>
          <BtnIcon $color="#2563eb">⬆</BtnIcon>
          {showImport ? "Fechar importação" : "Importar planilha"}
        </ExpBtn>

        {showImport && (
          <ImportSection>
            <DropZone
              $dragging={isDragging}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={openFilePicker}
              role="button"
              aria-label="Área de upload"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openFilePicker()}
            >
              <DropIcon>📤</DropIcon>
              <DropText>Arraste e solte o arquivo aqui ou clique para selecionar</DropText>
              <DropSub>.xlsx ou .csv</DropSub>
            </DropZone>

            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={onInputChange}
              aria-label="Selecionar arquivo"
              data-testid="file-input"
            />

            {fileName && !rows.length && !result && (
              <FileName>Lendo: {fileName}…</FileName>
            )}

            {fileName && rows.length > 0 && (
              <FileName>
                {fileName} — {rows.length} linhas ({totalLinhasComPeso} com peso preenchido)
              </FileName>
            )}

            {result && (
              <>
                <ResultCard>
                  <ResultTitle>Migração concluída — {result.total} adicionado{result.total !== 1 ? "s" : ""} · {result.preservados} preservado{result.preservados !== 1 ? "s" : ""}</ResultTitle>
                  {Object.entries(result.porSessao).map(([sessao, qtd]) => (
                    <ResultRow key={sessao}>
                      {sessao}: {qtd} registro{qtd > 1 ? "s" : ""}
                    </ResultRow>
                  ))}
                </ResultCard>
                {canUndo && (
                  <BtnRow>
                    <BtnWarning onClick={desfazerImport}>Desfazer importação</BtnWarning>
                  </BtnRow>
                )}
              </>
            )}

            {rows.length > 0 && (
              <>
                <SectionLabel>Pré-visualização ({rows.length} linhas)</SectionLabel>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Sessão</Th>
                        <Th>Exercício</Th>
                        <Th>Músculo</Th>
                        <Th>Reps</Th>
                        <Th>C1 kg</Th>
                        <Th>C2 kg</Th>
                        <Th>C3 kg</Th>
                        <Th>C4 kg</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <Tr key={i}>
                          <Td>{r.sessao}</Td>
                          <Td>{r.exercicio}</Td>
                          <Td>{r.musculo_primario}</Td>
                          <Td>{r.rep_min}–{r.rep_max}</Td>
                          {CICLO_COLS.map(({ col }) => {
                            const p = parsePeso(r[col]);
                            return (
                              <Td key={col}>
                                {p ? <PesoBadge>{p} kg</PesoBadge> : <EmptyBadge>—</EmptyBadge>}
                              </Td>
                            );
                          })}
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </>
            )}

            <BtnRow>
              <BtnPrimary
                disabled={rows.length === 0}
                onClick={confirmarImport}
              >
                Confirmar importação
              </BtnPrimary>
            </BtnRow>
          </ImportSection>
        )}
      </Content>
    </Screen>
  );
}
