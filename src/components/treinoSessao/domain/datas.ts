export function getTodayBR(): string {
  return new Date().toLocaleDateString("pt-BR");
}

export function parseDateBRToTs(data: string): number {
  const [d, m, y] = data.split("/").map(Number);
  if (!d || !m || !y) return Date.now();
  return new Date(y, m - 1, d).getTime();
}

export function daysSince(ts: number): number {
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}
