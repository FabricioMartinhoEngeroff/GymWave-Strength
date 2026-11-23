import { BatteryCharging, Equal, Repeat, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { rotuloEsforco, type EscalaEsforco } from "../../../utils/esforco";
import { AvisoInline, Card, GhostBtn, Label, PrBox, PrimaryBtn, StatusBox, type Tom } from "../TreinoSessao.styles";
import { serieValida, statusTopSet, type StatusTopSet } from "../domain/estadoExercicio";
import { EsforcoInput } from "./EsforcoInput";
import { SerieInputs } from "./SerieInputs";
import type { BlocoConfirmavelProps } from "./tipos";

const STATUS: Record<NonNullable<StatusTopSet>, { tom: Tom; texto: (esforco: string) => string; Icone: LucideIcon }> = {
  teto: { tom: "verde", texto: () => "Teto atingido — sobe peso no próximo", Icone: TrendingUp },
  consolidar: { tom: "ambar", texto: (esforco) => `Teto atingido com ${esforco} — repete a carga no próximo`, Icone: Repeat },
  abaixo: { tom: "vermelho", texto: () => "Abaixo da faixa", Icone: TrendingDown },
  faixa: { tom: "azul", texto: () => "Na faixa — manter peso", Icone: Equal },
};

function StatusDoTopSet({ status, rpe, escala }: { status: NonNullable<StatusTopSet>; rpe: number | null; escala: EscalaEsforco }) {
  const { tom, texto, Icone } = STATUS[status];
  return (
    <StatusBox $tom={tom}>
      <Icone size={14} strokeWidth={1.8} aria-hidden />
      <span>{texto(rpe === null ? "" : rotuloEsforco(rpe, escala))}</span>
    </StatusBox>
  );
}

export function TopSetBlock({ ex, state, aviso, onChange, onConfirmar, onEditar, escala, onTrocarEscala }: BlocoConfirmavelProps) {
  const status = statusTopSet(ex, state);

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
          {state.prConfirmado ? (
            <PrBox style={{ padding: "6px 10px", marginTop: 8, textAlign: "center" }}>🔥 PR Confirmado!</PrBox>
          ) : (
            status && <StatusDoTopSet status={status} rpe={state.topSetRpe} escala={escala} />
          )}
          {state.isDeload && (
            <StatusBox $tom="vermelho">
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
