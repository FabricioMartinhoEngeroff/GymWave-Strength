import type { RegistroGraficoRaw } from "../../hooks/useDadosTreino";

export type PontoGrafico = {
  data: string; // "DD/MM"
  dataFull: string; // "DD/MM/YYYY"
  dataTs: number;
  cicloId: string;
  pesos: number[];
  topSet: number;
  media4: number;
  isDeload: boolean;
};

const media = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  return nums.reduce((acc, v) => acc + v, 0) / nums.length;
};

/** Um ponto por data; a média das 4 últimas ignora deload (RG10). */
export function montarSeriePorData(
  dados: RegistroGraficoRaw[],
  ciclosSelecionados: string[]
): PontoGrafico[] {
  const filtrados = dados.filter((d) => ciclosSelecionados.includes(d.cicloId));
  const porData = new Map<string, RegistroGraficoRaw>();

  filtrados.forEach((d) => {
    const atual = porData.get(d.data);
    if (!atual || d.topSet > atual.topSet) porData.set(d.data, d);
  });

  const ordenados = [...porData.values()].sort((a, b) => a.dataTs - b.dataTs);
  const pontosBase = ordenados.map((d) => ({
    data: d.data.slice(0, 5),
    dataFull: d.data,
    dataTs: d.dataTs,
    cicloId: d.cicloId,
    pesos: d.pesos,
    topSet: d.topSet,
    isDeload: !!d.isDeload,
  }));

  return pontosBase.map((p, i) => {
    const normais = pontosBase.slice(0, i + 1).filter((x) => !x.isDeload).slice(-4);
    return { ...p, media4: media((normais.length > 0 ? normais : [p]).map((x) => x.topSet)) };
  });
}
