// src/hooks/useDadosTreino.ts
import { useState, useEffect } from "react";
import { CICLOS } from "../data/cycles";

interface RegistroTreino { /* … */ }
export interface LinhaGrafico { /* … */ }
export type DadosAgrupados = Record<string, LinhaGrafico[]>;

/** Converte array de string para array de number, ignorando estilos inválidos */
function parsePesos(pesos: string[] = []): number[] {
  return pesos.map(p => parseFloat(p) || 0).filter(n => n > 0);
}

/** Dado um registro, retorna um objeto LinhaGrafico (sem associação ao exercício) */
function montarLinhaGrafico(
  reg: RegistroTreino,
  cicloId: string
): LinhaGrafico | null {
  const pesosNum = parsePesos(reg.pesos);
  if (pesosNum.length === 0) return null;

  const pesoTotal = pesosNum.reduce((a, b) => a + b, 0);
  const cargaMedia = Number((pesoTotal / pesosNum.length).toFixed(1));

  const cicloInfo = CICLOS.find(c => c.id === cicloId);
  const dataLabel = `${reg.data.slice(0, 5)} (${cicloInfo?.id || cicloId})`;

  return {
    data: dataLabel,
    pesoTotal,
    cargaMedia,
    serie1: pesosNum[0] || 0,
    serie2: pesosNum[1] || 0,
    serie3: pesosNum[2] || 0,
    pesoUsado: pesosNum,
  };
}

/** Ordena a lista de LinhaGrafico por data (DD/MM) */
function ordenarPorData(lista: LinhaGrafico[]): void {
  lista.sort((a, b) => {
    const [dA, mA] = a.data.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
    const [dB, mB] = b.data.match(/\d{2}\/\d{2}/)![0].split("/").map(Number);
    return new Date(2025, mA - 1, dA).getTime() - new Date(2025, mB - 1, dB).getTime();
  });
}

export function useDadosTreino(): DadosAgrupados {
  const [dadosAgrupados, setDadosAgrupados] = useState<DadosAgrupados>({});

  useEffect(() => {
    const bruto = JSON.parse(localStorage.getItem("dadosTreino") || "{}") as Record<
      string,
      Record<string, RegistroTreino>
    >;

    const porExe: DadosAgrupados = {};

    Object.entries(bruto).forEach(([exe, ciclos]) => {
      Object.entries(ciclos).forEach(([cicloKey, reg]) => {
        const linha = montarLinhaGrafico(reg, cicloKey);
        if (!linha) return;

        const nomeExe = reg.exercicio || exe;
        if (!porExe[nomeExe]) {
          porExe[nomeExe] = [];
        }
        porExe[nomeExe].push(linha);
      });
    });

    // Ordena cada lista de LinhaGrafico
    Object.values(porExe).forEach(arr => ordenarPorData(arr));

    setDadosAgrupados(porExe);
  }, []);

  return dadosAgrupados;
}
