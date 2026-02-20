export type TimeInterval = "Tudo" | "1M" | "3M" | "6M" | "1A" | "3A" | "5A";

export const TIME_INTERVAL_OPTIONS: Array<{ label: string; value: TimeInterval }> = [
  { label: "Tudo", value: "Tudo" },
  { label: "1 mês", value: "1M" },
  { label: "3 meses", value: "3M" },
  { label: "6 meses", value: "6M" },
  { label: "1 ano", value: "1A" },
  { label: "3 anos", value: "3A" },
  { label: "5 anos", value: "5A" },
];

export const getCutoffTs = (intervalo: TimeInterval, nowTs: number): number => {
  if (intervalo === "Tudo") return 0;

  const day = 24 * 60 * 60 * 1000;
  switch (intervalo) {
    case "1M":
      return nowTs - 30 * day;
    case "3M":
      return nowTs - 91 * day;
    case "6M":
      return nowTs - 182 * day;
    case "1A":
      return nowTs - 365 * day;
    case "3A":
      return nowTs - 3 * 365 * day;
    case "5A":
      return nowTs - 5 * 365 * day;
    default:
      return 0;
  }
};

