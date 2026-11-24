// Data do treino: regra única do sistema (INDICE "Formato de Data").
// Data inválida é sempre null: nunca vira hoje nem outro dia.

const DIA_MS = 24 * 60 * 60 * 1000;

const dois = (n: number) => String(n).padStart(2, "0");

/** Meia-noite local do dia, se ele existir no calendário. */
function dataReal(ano: number, mes: number, dia: number): number | null {
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia ? d.getTime() : null;
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

/** "DD/MM/AAAA" → timestamp da meia-noite local; qualquer outra coisa → null. */
export function parseDataBR(data: string): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(data.trim());
  return m ? dataReal(Number(m[3]), Number(m[2]), Number(m[1])) : null;
}

/** "AAAA-MM-DD" → timestamp da meia-noite local; qualquer outra coisa → null. */
export function parseDataISO(data: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  return m ? dataReal(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}

/** "DD/MM/AAAA" → Date, para os calendários. */
export function dataBRparaDate(data: string): Date | null {
  const ts = parseDataBR(data);
  return ts === null ? null : new Date(ts);
}

/** Número de série de data do Excel → dia e mês (sem fuso: o Excel guarda dias corridos). */
export function diaEMesDoExcel(serial: number): [dia: number, mes: number] {
  const d = new Date(Date.UTC(1899, 11, 30 + Math.round(serial)));
  return [d.getUTCDate(), d.getUTCMonth() + 1];
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

export function formatarBR(ts: number): string {
  const d = new Date(ts);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function hojeBR(): string {
  return formatarBR(Date.now());
}

// ─── BR ↔ ISO ─────────────────────────────────────────────────────────────────
// Só muda a escrita, não valida: o que não entende volta igual, para não perder o dado guardado.

export function dataBRparaISO(data: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const [d, m, y] = data.split("/").map(Number);
  if (!d || !m || !y) return data;
  return `${y}-${dois(m)}-${dois(d)}`;
}

export function dataISOparaBR(data: string): string {
  const [y, m, d] = data.split("-").map(Number);
  if (!d || !m || !y) return data;
  return `${dois(d)}/${dois(m)}/${y}`;
}

// ─── Intervalo ────────────────────────────────────────────────────────────────

export function diasDesde(ts: number): number {
  return Math.floor((Date.now() - ts) / DIA_MS);
}
