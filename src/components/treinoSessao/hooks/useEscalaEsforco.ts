import { useState } from "react";
import type { EscalaEsforco } from "../../../utils/esforco";
import { carregarEscala, salvarEscala } from "../../../utils/storage";

/** Escala em que o atleta prefere ver o esforço; o dado gravado é sempre RPE. */
export function useEscalaEsforco() {
  const [escala, setEscala] = useState<EscalaEsforco>(carregarEscala);

  function alternarEscala() {
    const nova = escala === "RPE" ? "RIR" : "RPE";
    salvarEscala(nova);
    setEscala(nova);
  }

  return { escala, alternarEscala };
}
