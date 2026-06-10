import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Screen,
  Header,
  Title,
  Subtitle,
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
  BtnDanger,
} from "./AdminImport.styles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportRow {
  sessao: string;
  ordem: number;
  exercicio: string;
  musculo_primario: string;
  series_validas: number;
  rep_min: number;
  rep_max: number;
  peso_C1_kg?: number | string;
  peso_C2_kg?: number | string;
  peso_C3_kg?: number | string;
  peso_C4_kg?: number | string;
}

interface ImportResult {
  total: number;
  porSessao: Record<string, number>;
}

const CICLO_COLS: { col: keyof ImportRow; cicloId: string }[] = [
  { col: "peso_C1_kg", cicloId: "C1" },
  { col: "peso_C2_kg", cicloId: "C2" },
  { col: "peso_C3_kg", cicloId: "C3" },
  { col: "peso_C4_kg", cicloId: "C4" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeRows(raw: Record<string, unknown>[]): ImportRow[] {
  return raw
    .map((r) => ({
      sessao: String(r.sessao ?? ""),
      ordem: Number(r.ordem ?? 0),
      exercicio: String(r.exercicio ?? "").trim(),
      musculo_primario: String(r.musculo_primario ?? ""),
      series_validas: Number(r.series_validas ?? 3),
      rep_min: Number(r.rep_min ?? 0),
      rep_max: Number(r.rep_max ?? 0),
      peso_C1_kg: r.peso_C1_kg,
      peso_C2_kg: r.peso_C2_kg,
      peso_C3_kg: r.peso_C3_kg,
      peso_C4_kg: r.peso_C4_kg,
    }))
    .filter((r) => r.exercicio !== "");
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminImport() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Parse file ─────────────────────────────────────────────

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
        setRows(normalizeRows(parsed.data));
      };
      reader.readAsText(file, "UTF-8");
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
        });
        setRows(normalizeRows(json));
      };
      reader.readAsArrayBuffer(file);
    }
  }

  // ── Drag & drop handlers ───────────────────────────────────

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

  // ── Confirm import ─────────────────────────────────────────

  function confirmarImport() {
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const porSessao: Record<string, number> = {};
    let total = 0;
    const today = getTodayBR();

    rows.forEach((row) => {
      const seriesCount = Math.max(1, Math.min(3, row.series_validas));

      CICLO_COLS.forEach(({ col, cicloId }) => {
        const pesoStr = parsePeso(row[col]);
        if (!pesoStr) return;

        if (!db[row.exercicio]) db[row.exercicio] = {};
        db[row.exercicio][cicloId] = {
          data: today,
          pesos: Array(seriesCount).fill(pesoStr),
          reps: Array(seriesCount).fill(String(row.rep_max || "")),
          obs: "",
          exercicio: row.exercicio,
        };

        const sessao = row.sessao || "Sem sessão";
        porSessao[sessao] = (porSessao[sessao] || 0) + 1;
        total++;
      });
    });

    localStorage.setItem("dadosTreino", JSON.stringify(db));
    setResult({ total, porSessao });
    setRows([]);
    setFileName(null);
  }

  // ── Clear all ──────────────────────────────────────────────

  function limparTudo() {
    const ok = window.confirm(
      "Isso vai apagar TODOS os dados de treino do localStorage. Tem certeza?"
    );
    if (!ok) return;
    localStorage.removeItem("dadosTreino");
    setResult(null);
    setRows([]);
    setFileName(null);
  }

  // ── Derived data for preview ───────────────────────────────

  const totalLinhasComPeso = rows.filter((r) =>
    CICLO_COLS.some(({ col }) => parsePeso(r[col]) !== null)
  ).length;

  return (
    <Screen>
      <Header>
        <Title>Importar dados</Title>
        <Subtitle>Carregue um arquivo .xlsx ou .csv para popular o histórico de treino</Subtitle>
      </Header>

      {/* Drop zone */}
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

      {/* Result feedback */}
      {result && (
        <ResultCard>
          <ResultTitle>Importação concluída — {result.total} registros salvos</ResultTitle>
          {Object.entries(result.porSessao).map(([sessao, qtd]) => (
            <ResultRow key={sessao}>
              {sessao}: {qtd} registro{qtd > 1 ? "s" : ""}
            </ResultRow>
          ))}
        </ResultCard>
      )}

      {/* Preview table */}
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

      {/* Action buttons */}
      <BtnRow>
        <BtnPrimary
          disabled={rows.length === 0}
          onClick={confirmarImport}
        >
          Confirmar importação
        </BtnPrimary>
        <BtnDanger onClick={limparTudo}>
          Limpar tudo
        </BtnDanger>
      </BtnRow>
    </Screen>
  );
}
