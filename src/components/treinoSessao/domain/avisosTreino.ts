import type { RegistroExercicio } from "../../../types/TrainingData";
import {
  deveSubirPeso, faixaAlvo, rotuloChip, rotuloEsforco, type EscalaEsforco, type Fadiga, type FaixaRpe,
  type Regressao,
} from "../../../utils/esforco";

// Avisos do card "Último treino" (RG29). O app informa, nunca manda: cada texto só descreve o dado.

export type TipoAvisoTreino = "subir" | "fadiga" | "regressao" | "consolidar" | "primeiro";

export interface AvisoTreino {
  tipo: TipoAvisoTreino;
  tom: "verde" | "ambar" | "azul";
  marca: string;
  texto: string;
}

/** Quantos avisos aparecem antes do "ver mais". */
export const MAX_AVISOS_VISIVEIS = 1;

/** Aparência e prioridade (menor = mais relevante) de cada aviso. */
const APARENCIA: Record<TipoAvisoTreino, Pick<AvisoTreino, "tom" | "marca"> & { prioridade: number }> = {
  subir: { tom: "verde", marca: "↑", prioridade: 1 },
  fadiga: { tom: "ambar", marca: "!", prioridade: 2 },
  regressao: { tom: "ambar", marca: "!", prioridade: 2 },
  consolidar: { tom: "azul", marca: "i", prioridade: 3 },
  primeiro: { tom: "azul", marca: "i", prioridade: 3 },
};

function textoConsolidar(rpe: number, alvo: FaixaRpe, escala: EscalaEsforco): string {
  return `Teto de reps com esforço acima do alvo (${rotuloEsforco(rpe, escala)}, alvo ${faixaAlvo(alvo, escala)}): carga em consolidação.`;
}

function textoSubir(rpe: number | undefined, escala: EscalaEsforco): string {
  const dentroDoAlvo = rpe === undefined ? "" : ` dentro do alvo (${rotuloEsforco(rpe, escala)})`;
  return `Bateu o teto de reps${dentroDoAlvo}. Dá para subir a carga.`;
}

function textoFadiga({ kg, rpeInicial, rpeAtual, treinos }: Fadiga, escala: EscalaEsforco): string {
  return `Mesma carga (${kg} kg), esforço subindo: ${rotuloEsforco(rpeInicial, escala)} → ${rotuloChip(rpeAtual, escala)} em ${treinos} treinos.`;
}

function textoRegressao({ kg, reps }: Regressao): string {
  return `Mesma carga (${kg} kg), reps caindo: ${reps.join(" → ")} em ${reps.length} treinos.`;
}

export interface DadosDosAvisos {
  ultimo: RegistroExercicio | null;
  fadiga: Fadiga | null;
  regressao: Regressao | null;
  rpeAlvo: FaixaRpe;
  escala: EscalaEsforco;
}

/** Avisos do exercício, do mais ao menos relevante. */
export function avisosDoTreino({ ultimo, fadiga, regressao, rpeAlvo, escala }: DadosDosAvisos): AvisoTreino[] {
  const textos: Partial<Record<TipoAvisoTreino, string>> = {};

  if (!ultimo) {
    textos.primeiro = "Primeiro registro deste exercício nesta sessão.";
  } else if (deveSubirPeso(ultimo.topSetBateuTeto, ultimo.topSetRpe, rpeAlvo)) {
    textos.subir = textoSubir(ultimo.topSetRpe, escala);
  } else if (ultimo.topSetBateuTeto && ultimo.topSetRpe !== undefined) {
    textos.consolidar = textoConsolidar(ultimo.topSetRpe, rpeAlvo, escala);
  }
  if (fadiga) textos.fadiga = textoFadiga(fadiga, escala);
  if (regressao) textos.regressao = textoRegressao(regressao);

  return (Object.entries(textos) as [TipoAvisoTreino, string][])
    .sort(([a], [b]) => APARENCIA[a].prioridade - APARENCIA[b].prioridade)
    .map(([tipo, texto]) => ({ tipo, tom: APARENCIA[tipo].tom, marca: APARENCIA[tipo].marca, texto }));
}
