import { TopSetBlock } from "./TopSetBlock";
import type { BlocoConfirmavelProps } from "./tipos";

/** Modo Deload (RG15): só o Top Set 1 conta. */
export function DeloadBlock(props: BlocoConfirmavelProps) {
  return (
    <>
      <p style={{ fontSize: 12, color: "#dc2626", margin: "0 0 8px", fontWeight: 500 }}>
        Deload — apenas 1 série válida (Top Set), mesmo peso do último treino
      </p>
      <TopSetBlock {...props} />
    </>
  );
}
