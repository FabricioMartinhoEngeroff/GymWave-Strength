import { PrBox } from "./TreinoSessao.styles";
import { UltimoTreinoPanel } from "./UltimoTreinoPanel";
import { avisosDoTreino, type DadosDosAvisos } from "./domain/avisosTreino";

interface ProgressBannerProps extends DadosDosAvisos {
  prAtivo: boolean;
}

/** Recorde ao vivo (RG13) e, abaixo, o card do último treino com os avisos dentro (RG29). */
export function ProgressBanner({ prAtivo, ...dados }: ProgressBannerProps) {
  return (
    <>
      {prAtivo && (
        <PrBox data-testid="banner-pr" style={{ padding: "8px 10px", marginBottom: 8, animation: "pulse 1.4s infinite" }}>
          🔥 Ritmo de Recorde Pessoal! Confirme para validar o PR.
        </PrBox>
      )}
      <UltimoTreinoPanel ultimo={dados.ultimo} avisos={avisosDoTreino(dados)} />
    </>
  );
}
