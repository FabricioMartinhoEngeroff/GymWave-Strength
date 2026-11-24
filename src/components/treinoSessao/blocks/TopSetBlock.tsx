import { BatteryCharging, Equal, Repeat, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { EscalaEsforco, FaixaRpe } from "../../../utils/esforco";
import { AvisoInline, Card, GhostBtn, Label, PrBox, PrimaryBtn, StatusBox, type Tom } from "../TreinoSessao.styles";
import { textoConsolidar } from "../domain/avisosTreino";
import { serieValida, statusTopSet, type StatusTopSet } from "../domain/estadoExercicio";
import { rpeAlvoDoExercicio } from "../domain/rpeAlvo";
import { EsforcoInput } from "./EsforcoInput";
import { SerieInputs } from "./SerieInputs";
import type { BlocoConfirmavelProps } from "./tipos";

const STATUS: Record<NonNullable<StatusTopSet>, { tom: Tom; Icone: LucideIcon }> = {
  teto: { tom: "verde", Icone: TrendingUp },
  consolidar: { tom: "azul", Icone: Repeat },
  abaixo: { tom: "ambar", Icone: TrendingDown },
  faixa: { tom: "azul", Icone: Equal },
};

interface StatusProps {
  status: NonNullable<StatusTopSet>;
  rpe: number | null;
  alvo: FaixaRpe;
  escala: EscalaEsforco;
}

/** Descreve o resultado da série, sem dizer o que fazer (RG29). */
function textoDoStatus({ status, rpe, alvo, escala }: StatusProps): string {
  if (status === "abaixo") return "Abaixo da faixa";
  if (status === "faixa") return "Na faixa de reps";
  if (rpe === null) return "Teto de reps atingido";
  return status === "teto" ? "Teto de reps atingido dentro do alvo" : textoConsolidar(rpe, alvo, escala);
}

function StatusDoTopSet(props: StatusProps) {
  const { tom, Icone } = STATUS[props.status];
  return (
    <StatusBox $tom={tom}>
      <Icone size={14} strokeWidth={1.8} aria-hidden />
      <span>{textoDoStatus(props)}</span>
    </StatusBox>
  );
}

export function TopSetBlock({ ex, state, aviso, onChange, onConfirmar, onEditar, escala, onTrocarEscala, semEsforco }: BlocoConfirmavelProps) {
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
          {state.prConfirmado ? (
            <PrBox style={{ padding: "6px 10px", marginTop: 8, textAlign: "center" }}>🔥 PR Confirmado!</PrBox>
          ) : (
            status && <StatusDoTopSet status={status} rpe={state.topSetRpe} alvo={rpeAlvoDoExercicio(ex)} escala={escala} />
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
