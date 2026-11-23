import { Card, Label, TextoApoio } from "../TreinoSessao.styles";
import { EsforcoInput } from "./EsforcoInput";
import { SerieInputs } from "./SerieInputs";
import type { BlocoProps } from "./tipos";

const SERIES = [
  { n: 3, kg: "extraKg", reps: "extraReps", kgSug: "extraKgIsSuggestion", repsSug: "extraRepsSuggestion", rpe: "extraRpe" },
  { n: 4, kg: "serie4Kg", reps: "serie4Reps", kgSug: "serie4KgIsSuggestion", repsSug: "serie4RepsSuggestion", rpe: "serie4Rpe" },
] as const;

/** Série 3 e Série 4 (só com 4 válidas): mesma carga e reps do último treino, sem reduzir. */
export function SeriesExtrasBlock({ ex, state, onChange, escala, onTrocarEscala }: BlocoProps) {
  return SERIES.map((serie) => (
    <Card key={serie.n} style={{ background: "#fafafa" }}>
      <Label>Série {serie.n}</Label>
      <SerieInputs
        titulo={`Série ${serie.n}`}
        exercicio={ex.nome}
        kg={state[serie.kg]}
        reps={state[serie.reps]}
        onKg={(v) => onChange({ [serie.kg]: v, [serie.kgSug]: false, extraKgWasUserEdited: true })}
        onReps={(v) => onChange({ [serie.reps]: v, [serie.repsSug]: false, extraKgWasUserEdited: true })}
        sugestao={state[serie.kgSug]}
      />
      <EsforcoInput
        serie={`Série ${serie.n}`}
        exercicio={ex.nome}
        valor={state[serie.rpe]}
        onChange={(rpe) => onChange({ [serie.rpe]: rpe })}
        escala={escala}
        onTrocarEscala={onTrocarEscala}
      />
      {serie.n === 4 && (
        <TextoApoio>Mesma carga e reps do último treino — nenhuma série reduz peso com 4 válidas</TextoApoio>
      )}
    </Card>
  ));
}
