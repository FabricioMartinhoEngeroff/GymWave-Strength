import { BatteryCharging } from "lucide-react";
import { AvisoInline, Card, GhostBtn, Label, PrBox, PrimaryBtn, StatusBox } from "../TreinoSessao.styles";
import { serieValida } from "../domain/estadoExercicio";
import { EsforcoInput } from "./EsforcoInput";
import { SerieInputs } from "./SerieInputs";
import type { BlocoConfirmavelProps } from "./tipos";

export function TopSetBlock({ ex, state, aviso, onChange, onConfirmar, onEditar, escala, onTrocarEscala, semEsforco }: BlocoConfirmavelProps) {
  return (
    <Card style={{ background: "#fafafa" }}>
      <Label>Top Set 1</Label>
      <SerieInputs
        titulo="Top Set 1"
        exercicio={ex.nome}
        kg={state.topSetKg}
        reps={state.topSetReps}
        onKg={(v) => onChange({ topSetKg: v, topSetKgIsSuggestion: false })}
        onReps={(v) => onChange({ topSetReps: v, topSetRepsSuggestion: false })}
        sugestao={state.topSetKgIsSuggestion && !state.topSetConfirmed}
        aviso={aviso}
      />
      <EsforcoInput
        serie="Top Set 1"
        exercicio={ex.nome}
        valor={state.topSetRpe}
        onChange={(rpe) => onChange({ topSetRpe: rpe })}
        escala={escala}
        onTrocarEscala={onTrocarEscala}
        aviso={semEsforco.includes("topSetRpe")}
      />

      {!state.topSetConfirmed ? (
        <>
          <PrimaryBtn
            type="button"
            onClick={onConfirmar}
            disabled={!serieValida(state.topSetKg, state.topSetReps)}
            style={{ marginTop: 8 }}
          >
            Confirmar Top Set 1
          </PrimaryBtn>
          {aviso && <AvisoInline>⚠ Preencha o peso e as repetições do Top Set 1 antes de confirmar.</AvisoInline>}
        </>
      ) : (
        <>
          {state.prConfirmado && (
            <PrBox style={{ padding: "6px 10px", marginTop: 8, textAlign: "center" }}>🔥 PR Confirmado!</PrBox>
          )}
          {state.isDeload && (
            <StatusBox $tom="cinza">
              <BatteryCharging size={14} strokeWidth={1.8} aria-hidden />
              <span>Deload registrado — não conta para progressão</span>
            </StatusBox>
          )}
          <GhostBtn type="button" $compacto onClick={onEditar} style={{ marginTop: 6 }}>
            Editar Top Set 1
          </GhostBtn>
        </>
      )}
    </Card>
  );
}
