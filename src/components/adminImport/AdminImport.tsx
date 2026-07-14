import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { RegistroExercicio, PlanoTreino } from "../../types/TrainingData";
import { salvarRegistro } from "../../utils/storage";
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
  BtnWarning,
} from "./AdminImport.styles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportRow {
  treino_id: string;
  treino: string;
  ordem: number;
  exercicio: string;
  grupo: string;
  tipo: string;
  faixa_top_min: number;
  faixa_top_max: number;
  faixa_backoff_min: number;
  faixa_backoff_max: number;
  top_set_kg?: number | string;
  backoff_kg?: number | string;
  series_validas?: number;
  tecnica?: string;
  backoff_pct?: string;
  cue?: string;
}

interface ImportResult {
  total: number;
  porTreino: Record<string, number>;
}

// ─── Column name mapping ───────────────────────────────────────────────────────

const COLUMN_MAP: [RegExp, string][] = [
  [/treino\s*id/i,             "treino_id"],
  [/^treino$/i,                "treino"],
  [/ord/i,                     "ordem"],
  [/exerc[ií]cio/i,           "exercicio"],
  [/grupo|m[uú]sculo/i,       "grupo"],
  [/tipo/i,                    "tipo"],
  // v4 logbook — colunas curtas com newline: "Top\nMín", "B-off\nMín" etc.
  [/^top\s+m[ií]n/i,          "faixa_top_min"],
  [/^top\s+m[aá]x/i,          "faixa_top_max"],
  [/^b[.\-]off\s+m[ií]n/i,   "faixa_backoff_min"],
  [/^b[.\-]off\s+m[aá]x/i,   "faixa_backoff_max"],
  // Faixa — formato "Faixa Top Mín" (legado) ou "Top Set Mín reps" (v2 planilha)
  [/faixa\s*top.*m[ií]n/i,    "faixa_top_min"],
  [/faixa\s*top.*m[aá]x/i,    "faixa_top_max"],
  [/faixa\s*b.*off.*m[ií]n/i, "faixa_backoff_min"],
  [/faixa\s*b.*off.*m[aá]x/i, "faixa_backoff_max"],
  [/top\s*set.*m[ií]n/i,      "faixa_top_min"],
  [/top\s*set.*m[aá]x/i,      "faixa_top_max"],
  [/back.*off.*m[ií]n/i,      "faixa_backoff_min"],
  [/back.*off.*m[aá]x/i,      "faixa_backoff_max"],
  [/top\s*set.*kg/i,           "top_set_kg"],
  [/back.*off.*kg/i,           "backoff_kg"],
  [/t[eé]cnica/i,             "tecnica"],
  [/back.*off.*%/i,            "backoff_pct"],
  [/cue|foco/i,               "cue"],
  // Legacy C1-C4 columns mapping
  [/peso\s*c1/i,              "top_set_kg"],
  [/sess[aã]o/i,              "treino"],
  [/rep.*m[ií]n/i,            "faixa_top_min"],
  [/rep.*m[aá]x/i,            "faixa_top_max"],
  [/s[eé]ries/i,              "series_validas"],
];

// Normaliza nomes da planilha (descritivos) para os nomes canônicos do app
const NOME_MAP: Record<string, string> = {
  // ── Planilha v3 (nomes curtos de sessão de Braço e Upper) ─────────────────
  // Upper A
  "Crossover braço estendido polia alta":        "Crossover braço estendido",
  "Pulldown braço estendido tronco inclinado":   "Pulldown inclinado",
  "Rosca scott mesa":                            "Rosca scott",
  "Antebraço mesa scott barra W invertida":      "Antebraço invertido",
  // Upper B
  "Antebraço rola barra na palma cabo":          "Antebraço rola palma",
  // Braço (BR) — nomes curtos sem prefixo de grupo
  "Polia barra reta pronada":                    "Tríceps polia barra reta",
  "Testa halteres deitado":                      "Tríceps testa halteres",
  "Polia supinada unilateral":                   "Rosca polia unilateral",
  "Mesa scott":                                  "Rosca scott",
  "Martelo halteres":                            "Rosca martelo",
  "Polia alta unilateral":                       "Rosca polia alta",
  "Mesa scott barra W invertida":                "Antebraço invertido",
  "Rola barra na palma cabo":                    "Antebraço rola palma",

  // ── Planilha v2 (nomes descritivos longos) — mantidos para compat ─────────
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

function mapColumns(raw: Record<string, unknown>[]): Record<string, unknown>[] {
  if (raw.length === 0) return raw;
  const keyMap: Record<string, string> = {};
  Object.keys(raw[0]).forEach((key) => {
    const flat = key.replace(/\n/g, " ").trim();
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

/** Lê xlsx como array de arrays, detecta a linha de cabeçalho real e retorna JSON normalizado */
function xlsxToJson(ws: XLSX.WorkSheet): Record<string, unknown>[] {
  const arrays = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  let headerIdx = 0;
  for (let i = 0; i < Math.min(6, arrays.length); i++) {
    const row = arrays[i] as string[];
    // Usa "exercício" ou "sessão" para evitar falso-positivo em linhas descritivas
    // que podem conter a palavra "treino" numa frase (ex.: "...ciclo deste treino.")
    if (row.some((cell) => /exerc[ií]cio|sess[aã]o/i.test(String(cell ?? "")))) {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TREINO_ID_MAP: Record<string, string> = {
  "Upper A": "UA",
  "Upper B": "UB",
  "Lower A": "LA",
  "Lower B": "LB",
  "Braço": "BR",
};

function normalizeRows(raw: Record<string, unknown>[]): ImportRow[] {
  return raw
    .map((r) => {
      const treino = String(r.treino ?? "").trim();
      let treinoId = String(r.treino_id ?? "").trim();
      if (!treinoId && treino) {
        treinoId = TREINO_ID_MAP[treino] ?? treino.substring(0, 2).toUpperCase();
      }
      const nomeRaw = String(r.exercicio ?? "").trim();
      const exercicio = NOME_MAP[nomeRaw] ?? nomeRaw;
      return {
        treino_id: treinoId,
        treino,
        ordem: Number(r.ordem ?? 0),
        exercicio,
        grupo: String(r.grupo ?? ""),
        tipo: String(r.tipo ?? ""),
        faixa_top_min: Number(r.faixa_top_min ?? 5),
        faixa_top_max: Number(r.faixa_top_max ?? 9),
        faixa_backoff_min: Number(r.faixa_backoff_min ?? 9),
        faixa_backoff_max: Number(r.faixa_backoff_max ?? 15),
        top_set_kg: r.top_set_kg as string | number | undefined,
        backoff_kg: r.backoff_kg as string | number | undefined,
        series_validas: Number(r.series_validas) === 3 ? 3 : 2,
        tecnica: String(r.tecnica ?? ""),
        backoff_pct: String(r.backoff_pct ?? "85%"),
        cue: String(r.cue ?? ""),
      };
    })
    .filter((r) => r.exercicio !== "");
}

function parsePeso(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  if (isNaN(n) || n <= 0) return null;
  return n;
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
  const [canUndo, setCanUndo] = useState(false);
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

  function desfazerImport() {
    const ok = window.confirm("Desfazer a importação e restaurar os dados anteriores?");
    if (!ok) return;
    const backup = localStorage.getItem("logbook_backup");
    if (backup) localStorage.setItem("logbook", backup);
    const backupLegacy = localStorage.getItem("dadosTreino_backup");
    if (backupLegacy) localStorage.setItem("dadosTreino", backupLegacy);
    const backupPlano = localStorage.getItem("planoTreino_backup");
    if (backupPlano) localStorage.setItem("planoTreino", backupPlano);
    setResult(null);
    setCanUndo(false);
  }

  function confirmarImport() {
    localStorage.setItem("logbook_backup", localStorage.getItem("logbook") || "{}");
    localStorage.setItem("dadosTreino_backup", localStorage.getItem("dadosTreino") || "{}");
    localStorage.setItem("planoTreino_backup", localStorage.getItem("planoTreino") || "{}");

    const porTreino: Record<string, number> = {};
    let total = 0;
    const today = getTodayBR();
    const todayTs = Date.now();

    const legacyDb = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    const planoExistente: PlanoTreino = JSON.parse(localStorage.getItem("planoTreino") || "{}");
    const planoNovo: PlanoTreino = {};

    // Primeira passagem: salva plano para TODOS os exercícios (template de ordem e séries)
    rows.forEach((row) => {
      const sessao = row.treino || row.treino_id || "Sem sessão";
      const seriesCount = Math.max(1, Math.min(3, row.series_validas ?? 2)) as 2 | 3;
      if (!planoNovo[sessao]) planoNovo[sessao] = {};
      planoNovo[sessao][row.exercicio] = {
        ordem: row.ordem,
        series_validas: seriesCount,
      };
    });

    // Segunda passagem: salva registros apenas para exercícios com peso
    rows.forEach((row) => {
      const topKg = parsePeso(row.top_set_kg);
      if (!topKg) return;

      const boKg = parsePeso(row.backoff_kg) ?? Math.round(topKg * 0.85);

      const registro: RegistroExercicio = {
        exercicio: row.exercicio,
        treinoId: row.treino_id,
        data: today,
        dataTs: todayTs,
        topSetKg: topKg,
        topSetReps: 0,
        topSetFaixaMin: row.faixa_top_min,
        topSetFaixaMax: row.faixa_top_max,
        topSetBateuTeto: false,
        backoffKg: boKg,
        backoffReps: 0,
        backoffFaixaMin: row.faixa_backoff_min,
        backoffFaixaMax: row.faixa_backoff_max,
        seriesValidas: (row.series_validas === 3 ? 3 : 2) as 2 | 3,
        pesoAnterior: undefined,
        repsAnterior: undefined,
        progrediu: false,
        obs: "Importado da planilha",
      };

      salvarRegistro(registro);

      // Legacy
      if (!legacyDb[row.exercicio]) legacyDb[row.exercicio] = {};
      legacyDb[row.exercicio][row.treino_id] = {
        data: today,
        pesos: [String(topKg), String(boKg)],
        reps: ["", ""],
        obs: "Importado da planilha",
        exercicio: row.exercicio,
      };

      const label = row.treino || row.treino_id || "Sem treino";
      porTreino[label] = (porTreino[label] || 0) + 1;
      total++;
    });

    localStorage.setItem("dadosTreino", JSON.stringify(legacyDb));
    localStorage.setItem("planoTreino", JSON.stringify({ ...planoExistente, ...planoNovo }));
    setResult({ total, porTreino });
    setCanUndo(true);
    setRows([]);
    setFileName(null);
  }

  // ── Clear all ──────────────────────────────────────────────

  function limparTudo() {
    const ok = window.confirm(
      "Isso vai apagar TODOS os dados de treino (logbook e dadosTreino) do localStorage. Tem certeza?"
    );
    if (!ok) return;
    localStorage.removeItem("dadosTreino");
    localStorage.removeItem("logbook");
    setResult(null);
    setRows([]);
    setFileName(null);
  }

  // ── Derived data for preview ───────────────────────────────

  const totalLinhasComPeso = rows.filter((r) =>
    parsePeso(r.top_set_kg) !== null
  ).length;

  return (
    <Screen>
      <Header>
        <Title>Importar dados</Title>
        <Subtitle>Carregue o logbook Saizen (.xlsx ou .csv) para popular o histórico</Subtitle>
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
        <FileName>Lendo: {fileName}...</FileName>
      )}

      {fileName && rows.length > 0 && (
        <FileName>
          {fileName} — {rows.length} exercícios ({totalLinhasComPeso} com peso)
        </FileName>
      )}

      {/* Result feedback */}
      {result && (
        <>
          <ResultCard>
            <ResultTitle>Importação concluída — {result.total} registros salvos</ResultTitle>
            {Object.entries(result.porTreino).map(([treino, qtd]) => (
              <ResultRow key={treino}>
                {treino}: {qtd} exercício{qtd > 1 ? "s" : ""}
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

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          <SectionLabel>Pré-visualização ({rows.length} exercícios)</SectionLabel>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Treino</Th>
                  <Th>Exercício</Th>
                  <Th>Grupo</Th>
                  <Th>Faixa Top</Th>
                  <Th>Faixa B-off</Th>
                  <Th>Top Set kg</Th>
                  <Th>B-off kg</Th>
                  <Th>Séries Válidas</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <Tr key={i}>
                    <Td>{r.treino_id || r.treino}</Td>
                    <Td>{r.exercicio}</Td>
                    <Td>{r.grupo}</Td>
                    <Td>{r.faixa_top_min}–{r.faixa_top_max}</Td>
                    <Td>{r.faixa_backoff_min}–{r.faixa_backoff_max}</Td>
                    <Td>
                      {parsePeso(r.top_set_kg) !== null
                        ? <PesoBadge>{parsePeso(r.top_set_kg)} kg</PesoBadge>
                        : <EmptyBadge>—</EmptyBadge>}
                    </Td>
                    <Td>
                      {parsePeso(r.backoff_kg) !== null
                        ? <PesoBadge>{parsePeso(r.backoff_kg)} kg</PesoBadge>
                        : <EmptyBadge>auto</EmptyBadge>}
                    </Td>
                    <Td>
                      <PesoBadge>{r.series_validas ?? 2}</PesoBadge>
                    </Td>
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
