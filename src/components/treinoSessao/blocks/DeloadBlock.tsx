import { TextoDeload } from "../TreinoSessao.styles";
import { TopSetBlock } from "./TopSetBlock";
import type { BlocoConfirmavelProps } from "./tipos";

/** Modo Deload (RG15): só o Top Set 1 conta. */
export function DeloadBlock(props: BlocoConfirmavelProps) {
  return (
    <>
      <TextoDeload>Deload — apenas 1 série válida (Top Set), mesmo peso do último treino</TextoDeload>
      <TopSetBlock {...props} />
    </>
  );
}
