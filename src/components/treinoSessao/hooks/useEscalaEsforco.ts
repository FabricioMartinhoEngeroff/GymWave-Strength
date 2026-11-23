import { useState } from "react";
import type { EscalaEsforco } from "../../../utils/esforco";
import { storageKey } from "../../../utils/storage";

const CHAVE = () => storageKey("escala_esforco");

/** Escala em que o atleta prefere ver o esforço; o dado gravado é sempre RPE. */
export function useEscalaEsforco() {
  const [escala, setEscala] = useState<EscalaEsforco>(() => (localStorage.getItem(CHAVE()) === "RIR" ? "RIR" : "RPE"));

  function alternarEscala() {
    const nova = escala === "RPE" ? "RIR" : "RPE";
    localStorage.setItem(CHAVE(), nova);
    setEscala(nova);
  }

  return { escala, alternarEscala };
}
