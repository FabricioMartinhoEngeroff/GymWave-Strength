import { useEffect, useState } from "react";
import type { DadosTreino, RegistroTreino, Logbook } from "../types/TrainingData";

export interface RegistroGraficoRaw {
  data: string; // "DD/MM/YYYY"
  dataTs: number;
  cicloId: string; // training session id (e.g., "UA", "UB", or legacy "C1".."C4")
  pesos: number[];
  topSet: number;
  bateuTeto?: boolean;
  progrediu?: boolean;
}

export type DadosAgrupados = Record<string, RegistroGraficoRaw[]>;

function parsePesos(pesos: string[] = []): number[] {
  return pesos.map((p) => parseFloat(p) || 0).filter((n) => n > 0);
}

function parseDataBR(data: string): { normalizada: string; ts: number } | null {
  const [diaRaw, mesRaw, anoRaw] = data.split("/");
  const dia = Number(diaRaw);
  const mes = Number(mesRaw);
  const ano = Number(anoRaw);
  if (!dia || !mes || !ano) return null;

  const d = new Date(ano, mes - 1, dia);
  if (Number.isNaN(d.getTime())) return null;

  const normalizada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(
    2,
    "0"
  )}/${ano}`;
  return { normalizada, ts: d.getTime() };
}

function normalizarCicloId(cicloKey: string): string {
  if (cicloKey.startsWith("Ciclo ")) {
    const n = cicloKey.split(" ")[1];
    return `C${n}`;
  }
  return cicloKey;
}

function montarRegistroGrafico(
  reg: RegistroTreino,
  cicloKey: string
): RegistroGraficoRaw | null {
  const pesosNum = parsePesos(reg.pesos);
  if (pesosNum.length === 0) return null;

  const dataInfo = parseDataBR(reg.data);
  if (!dataInfo) return null;

  const topSet = Math.max(...pesosNum);
  return {
    data: dataInfo.normalizada,
    dataTs: dataInfo.ts,
    cicloId: normalizarCicloId(cicloKey),
    pesos: pesosNum,
    topSet,
  };
}

export function useDadosTreino(): DadosAgrupados {
  const [dadosAgrupados, setDadosAgrupados] = useState<DadosAgrupados>({});

  useEffect(() => {
    const porExe: DadosAgrupados = {};

    // Read from legacy dadosTreino
    const bruto = JSON.parse(localStorage.getItem("dadosTreino") || "{}") as DadosTreino;
    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloKey, reg]) => {
        const registro = montarRegistroGrafico(reg, cicloKey);
        if (!registro) return;

        const nomeExe = reg.exercicio || exe;
        if (!porExe[nomeExe]) porExe[nomeExe] = [];
        porExe[nomeExe].push(registro);
      });
    });

    // Read from new logbook
    const logbook = JSON.parse(localStorage.getItem("logbook") || "{}") as Logbook;
    Object.entries(logbook).forEach(([exercicio, registros]) => {
      registros.forEach((reg) => {
        if (reg.topSetKg <= 0) return;

        const dataInfo = parseDataBR(reg.data);
        if (!dataInfo) return;

        if (!porExe[exercicio]) porExe[exercicio] = [];
        porExe[exercicio].push({
          data: dataInfo.normalizada,
          dataTs: dataInfo.ts,
          cicloId: reg.treinoId,
          pesos: [reg.topSetKg, reg.backoffKg].filter((p) => p > 0),
          topSet: reg.topSetKg,
          bateuTeto: reg.topSetBateuTeto,
          progrediu: reg.progrediu,
        });
      });
    });

    // Deduplicate by keeping best topSet per exercise+date
    Object.keys(porExe).forEach((exe) => {
      const porData = new Map<number, RegistroGraficoRaw>();
      porExe[exe].forEach((r) => {
        const existing = porData.get(r.dataTs);
        if (!existing || r.topSet > existing.topSet) {
          porData.set(r.dataTs, r);
        }
      });
      porExe[exe] = [...porData.values()].sort((a, b) => a.dataTs - b.dataTs);
    });

    setDadosAgrupados(porExe);
  }, []);

  return dadosAgrupados;
}
