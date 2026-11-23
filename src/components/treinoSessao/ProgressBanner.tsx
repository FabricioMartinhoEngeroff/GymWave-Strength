import { BatteryWarning, Repeat, TrendingUp } from "lucide-react";
import type { RegistroExercicio } from "../../types/TrainingData";
import { deveSubirPeso, rotuloEsforco, type EscalaEsforco, type Fadiga } from "../../utils/esforco";
import { BannerBox, PrBox } from "./TreinoSessao.styles";
import { UltimoTreinoPanel } from "./UltimoTreinoPanel";

interface ProgressBannerProps {
  ultimo: RegistroExercicio | null;
  prAtivo: boolean;
  fadiga: Fadiga | null;
  escala: EscalaEsforco;
}

/** Teto no último treino: sobe a carga, ou consolida quando o esforço foi alto (RG21). */
function BannerTeto({ ultimo, escala }: { ultimo: RegistroExercicio; escala: EscalaEsforco }) {
  const feito = `${ultimo.topSetKg}kg x ${ultimo.topSetReps}reps`;
  if (deveSubirPeso(ultimo.topSetBateuTeto, ultimo.topSetRpe)) {
    return (
      <BannerBox $tom="ambar">
        <TrendingUp size={16} strokeWidth={1.8} aria-hidden />
        <span>SUBIR PESO HOJE (teto atingido: {feito})</span>
      </BannerBox>
    );
  }
  return (
    <BannerBox $tom="azul">
      <Repeat size={16} strokeWidth={1.8} aria-hidden />
      <span>
        CONSOLIDAR CARGA (teto com {rotuloEsforco(ultimo.topSetRpe ?? 10, escala)}: {feito})
      </span>
    </BannerBox>
  );
}

export function ProgressBanner({ ultimo, prAtivo, fadiga, escala }: ProgressBannerProps) {
  return (
    <>
      {prAtivo && (
        <PrBox data-testid="banner-pr" style={{ padding: "8px 10px", marginBottom: 8, animation: "pulse 1.4s infinite" }}>
          🔥 Ritmo de Recorde Pessoal! Confirme para validar o PR.
        </PrBox>
      )}
      {!ultimo && <BannerBox $tom="azul">Primeiro registro — defina o peso</BannerBox>}
      {ultimo?.topSetBateuTeto && <BannerTeto ultimo={ultimo} escala={escala} />}
      {fadiga && (
        <BannerBox $tom="vermelho" data-testid="alerta-fadiga">
          <BatteryWarning size={16} strokeWidth={1.8} aria-hidden />
          <span>
            Sinal de fadiga: {fadiga.kg}kg foi de {rotuloEsforco(fadiga.rpeInicial, escala)} para{" "}
            {rotuloEsforco(fadiga.rpeAtual, escala)} em {fadiga.treinos} treinos. Considere um deload.
          </span>
        </BannerBox>
      )}
      {ultimo && <UltimoTreinoPanel ultimo={ultimo} escala={escala} />}
    </>
  );
}
