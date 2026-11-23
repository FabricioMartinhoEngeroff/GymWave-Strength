import type { RegistroExercicio } from "../../types/TrainingData";
import { rotuloEsforco, type EscalaEsforco } from "../../utils/esforco";
import { UltimoTreinoBox, UltimoTreinoLinha } from "./TreinoSessao.styles";
import { seriesDoRegistro } from "./domain/ultimoTreino";

/**
 * Painel "Último treino" (RG17): lista TODAS as séries do treino anterior deste
 * exercício, para decidir entre subir a carga ou manter e buscar mais reps.
 */
export function UltimoTreinoPanel({ ultimo, escala }: { ultimo: RegistroExercicio; escala: EscalaEsforco }) {
  const linhas = seriesDoRegistro(ultimo);
  if (linhas.length === 0) return null;
  const volume = linhas.reduce((sum, l) => sum + l.kg * l.reps, 0);

  return (
    <UltimoTreinoBox data-testid="ultimo-treino-detalhe">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", letterSpacing: 0.3 }}>ÚLTIMO TREINO</span>
        <span style={{ fontSize: 10, color: "#0284c7" }}>{ultimo.data}</span>
      </div>

      {linhas.map((l, i) => (
        <UltimoTreinoLinha key={`${l.label}-${i}`}>
          <span style={{ fontSize: 11, color: "#0369a1" }}>{l.label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#075985", whiteSpace: "nowrap" }}>
            {l.kg}kg × {l.reps} reps
            {l.rpe !== undefined && ` · ${rotuloEsforco(l.rpe, escala)}`}
          </span>
        </UltimoTreinoLinha>
      ))}

      <div style={{ fontSize: 10, color: "#0284c7", marginTop: 4 }}>
        {linhas.length} série(s) · volume {volume} kg·reps
      </div>

      {ultimo.obs && (
        <p style={{ fontSize: 11, color: "#0369a1", margin: "4px 0 0", fontStyle: "italic" }}>“{ultimo.obs}”</p>
      )}
    </UltimoTreinoBox>
  );
}
