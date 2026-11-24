import { AvisoInline, Card, GhostBtn, Label, PrimaryBtn } from "../TreinoSessao.styles";
import { EsforcoInput } from "./EsforcoInput";
import { SerieInputs } from "./SerieInputs";
import type { BlocoConfirmavelProps } from "./tipos";

/** Top Set 2 (slot "backoff" no modelo v6): segunda série pesada, na faixa do Top Set. */
export function TopSet2Block({ ex, state, aviso, onChange, onConfirmar, onEditar, escala, onTrocarEscala, semEsforco }: BlocoConfirmavelProps) {
  return (
    <Card style={{ background: "#fafafa" }}>
      <Label>Top Set 2</Label>
      <SerieInputs
        titulo="Top Set 2"
        exercicio={ex.nome}
        kg={state.backoffKg}
        reps={state.backoffReps}
        onKg={(v) => onChange({ backoffKg: v, backoffKgIsSuggestion: false, backoffKgWasUserEdited: true })}
        onReps={(v) => onChange({ backoffReps: v, backoffRepsSuggestion: false })}
        sugestao={state.backoffKgIsSuggestion && !state.backoffConfirmed}
        aviso={aviso}
      />
      <EsforcoInput
        serie="Top Set 2"
        exercicio={ex.nome}
        valor={state.backoffRpe}
        onChange={(rpe) => onChange({ backoffRpe: rpe })}
        escala={escala}
        onTrocarEscala={onTrocarEscala}
        aviso={semEsforco.includes("backoffRpe")}
      />

      {!state.backoffConfirmed ? (
        <>
          <PrimaryBtn type="button" onClick={onConfirmar} style={{ marginTop: 8 }}>
            Confirmar Top Set 2
          </PrimaryBtn>
          {aviso && <AvisoInline>⚠ Preencha o peso e as repetições do Top Set 2 antes de confirmar.</AvisoInline>}
        </>
      ) : (
        <GhostBtn type="button" $compacto onClick={onEditar} style={{ marginTop: 6 }}>
          Editar Top Set 2
        </GhostBtn>
      )}
    </Card>
  );
}
