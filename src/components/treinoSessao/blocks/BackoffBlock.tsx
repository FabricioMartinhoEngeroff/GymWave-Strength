import { Card, Label, TextoApoio } from "../TreinoSessao.styles";
import { EsforcoInput } from "./EsforcoInput";
import { SerieInputs } from "./SerieInputs";
import type { BlocoProps } from "./tipos";

/** Back-off (slot "extra", só com 3 válidas): ~90% da carga, até a falha. */
export function BackoffBlock({ ex, state, onChange, escala, onTrocarEscala }: BlocoProps) {
  const pct = Math.round(ex.backoffPct * 100);
  return (
    <Card style={{ background: "#fafafa" }}>
      <Label>Back-off ({pct}%)</Label>
      <SerieInputs
        titulo="Back-off"
        exercicio={ex.nome}
        kg={state.extraKg}
        reps={state.extraReps}
        onKg={(v) => onChange({ extraKg: v, extraKgIsSuggestion: false, extraKgWasUserEdited: true })}
        onReps={(v) => onChange({ extraReps: v, extraRepsSuggestion: false })}
        sugestao={state.extraKgIsSuggestion}
      />
      <EsforcoInput
        serie="Back-off"
        exercicio={ex.nome}
        valor={state.extraRpe}
        onChange={(rpe) => onChange({ extraRpe: rpe })}
        escala={escala}
        onTrocarEscala={onTrocarEscala}
      />
      <TextoApoio>
        Tira ~{100 - pct}% da carga do Top Set — mais técnica, mesmas reps ou mais, até a falha · {ex.faixaBackoff[0]}–{ex.faixaBackoff[1]}+ reps · não conta para teto
      </TextoApoio>
    </Card>
  );
}
