import { useState } from "react";
import type { RegistroExercicio } from "../../types/TrainingData";
import { rotuloEsforco } from "../../utils/esforco";
import {
  AvisoLinha, AvisoLista, UltimoTreinoBox, UltimoTreinoData, UltimoTreinoLinha, UltimoTreinoObs, UltimoTreinoRodape,
  UltimoTreinoSerie, UltimoTreinoTitulo, UltimoTreinoTopo, UltimoTreinoValor, VerMaisBtn,
} from "./TreinoSessao.styles";
import { MAX_AVISOS_VISIVEIS, type AvisoTreino } from "./domain/avisosTreino";
import { seriesDoRegistro } from "./domain/ultimoTreino";

/** O aviso mais relevante; os demais ficam atrás do "ver mais" (RG29). */
function Avisos({ avisos }: { avisos: AvisoTreino[] }) {
  const [aberto, setAberto] = useState(false);
  if (avisos.length === 0) return null;
  const visiveis = aberto ? avisos : avisos.slice(0, MAX_AVISOS_VISIVEIS);

  return (
    <>
      <AvisoLista>
        {visiveis.map(({ tipo, tom, marca, texto }) => (
          <AvisoLinha key={tipo} $tom={tom} data-testid={`aviso-${tipo}`}>
            <strong>{marca}</strong>
            <span>{texto}</span>
          </AvisoLinha>
        ))}
      </AvisoLista>
      {avisos.length > MAX_AVISOS_VISIVEIS && (
        <VerMaisBtn type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>
          {aberto ? "ver menos" : "ver mais"}
        </VerMaisBtn>
      )}
    </>
  );
}

/**
 * Card "Último treino" (RG17): lista TODAS as séries do treino anterior deste
 * exercício, com o esforço nas duas escalas, e os avisos já calculados (RG29).
 */
export function UltimoTreinoPanel({ ultimo, avisos }: { ultimo: RegistroExercicio | null; avisos: AvisoTreino[] }) {
  const linhas = ultimo ? seriesDoRegistro(ultimo) : [];
  const temSeries = ultimo !== null && linhas.length > 0;
  if (!temSeries && avisos.length === 0) return null;
  const volume = linhas.reduce((sum, l) => sum + l.kg * l.reps, 0);

  return (
    <UltimoTreinoBox data-testid="ultimo-treino-detalhe">
      <UltimoTreinoTopo>
        <UltimoTreinoTitulo>ÚLTIMO TREINO</UltimoTreinoTitulo>
        {temSeries && <UltimoTreinoData>{ultimo.data}</UltimoTreinoData>}
      </UltimoTreinoTopo>

      {linhas.map((l, i) => (
        <UltimoTreinoLinha key={`${l.label}-${i}`}>
          <UltimoTreinoSerie>{l.label}</UltimoTreinoSerie>
          <UltimoTreinoValor>
            <span>{l.kg}kg × {l.reps} reps</span>
            {l.rpe !== undefined && (
              // Em tela estreita o esforço desce inteiro para a linha de baixo.
              <>{" "}<span>· {rotuloEsforco(l.rpe, "RPE")} · {rotuloEsforco(l.rpe, "RIR")}</span></>
            )}
          </UltimoTreinoValor>
        </UltimoTreinoLinha>
      ))}

      <Avisos avisos={avisos} />

      {temSeries && (
        <UltimoTreinoRodape>
          {linhas.length} série(s) · volume {volume} kg·reps
        </UltimoTreinoRodape>
      )}
      {temSeries && ultimo.obs && <UltimoTreinoObs>“{ultimo.obs}”</UltimoTreinoObs>}
    </UltimoTreinoBox>
  );
}
