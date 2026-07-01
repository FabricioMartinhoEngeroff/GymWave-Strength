import type { RegistroGraficoRaw } from "../hooks/useDadosTreino";

export type Granularidade = "semana" | "mes" | "ano";

export const GRANULARIDADE_OPTIONS: Array<{ label: string; value: Granularidade }> = [
  { label: "Semana", value: "semana" },
  { label: "Mês", value: "mes" },
  { label: "Ano", value: "ano" },
];

export interface BucketVolume {
  chave: string;
  label: string;
  volume: number;
  temRP: boolean;
  inicioTs: number;
}

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function inicioSemana(ts: number): Date {
  const d = new Date(ts);
  const diaSemana = d.getDay() === 0 ? 7 : d.getDay(); // 1=Seg ... 7=Dom
  d.setDate(d.getDate() - (diaSemana - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function labelSemana(inicio: Date): string {
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const fmt = (x: Date) => `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(inicio)}–${fmt(fim)}`;
}

function bucketDoRegistro(
  dataTs: number,
  granularidade: Granularidade
): { chave: string; label: string; inicioTs: number } {
  const d = new Date(dataTs);

  if (granularidade === "semana") {
    const inicio = inicioSemana(dataTs);
    return {
      chave: inicio.toISOString().slice(0, 10),
      label: labelSemana(inicio),
      inicioTs: inicio.getTime(),
    };
  }

  if (granularidade === "mes") {
    const inicioTs = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return {
      chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      inicioTs,
    };
  }

  const inicioTs = new Date(d.getFullYear(), 0, 1).getTime();
  return { chave: `${d.getFullYear()}`, label: `${d.getFullYear()}`, inicioTs };
}

/**
 * Agrupa o volume load (peso × reps) dos registros em baldes de tempo
 * (semana, mês ou ano), somando o volume e sinalizando se algum registro
 * do balde usou a técnica RP (Rest-Pause).
 */
export function agruparVolumePorPeriodo(
  registros: RegistroGraficoRaw[],
  granularidade: Granularidade
): BucketVolume[] {
  const buckets = new Map<string, BucketVolume>();

  registros.forEach((r) => {
    if (!r.volumeLoad || r.volumeLoad <= 0) return;

    const { chave, label, inicioTs } = bucketDoRegistro(r.dataTs, granularidade);
    const atual = buckets.get(chave);

    if (atual) {
      atual.volume += r.volumeLoad;
      if (r.tecnica === "RP") atual.temRP = true;
    } else {
      buckets.set(chave, {
        chave,
        label,
        volume: r.volumeLoad,
        temRP: r.tecnica === "RP",
        inicioTs,
      });
    }
  });

  return [...buckets.values()].sort((a, b) => a.inicioTs - b.inicioTs);
}
