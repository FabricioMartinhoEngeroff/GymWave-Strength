import { screen, fireEvent, within } from "@testing-library/react";

/** Marca o esforço de toda série na tela que ainda não tem (obrigatório: EF_02 RG27). */
export function marcarEsforco(rotulo = "RPE 7") {
  for (const grupo of screen.queryAllByLabelText(/^Esforço /)) {
    if (!grupo.querySelector("[aria-pressed='true']")) fireEvent.click(within(grupo).getByLabelText(rotulo));
  }
}

/** Textos de resultado da série que não aparecem no bloco de registro (EF_02 RG21). */
export const STATUS_DE_RESULTADO = /teto de reps|na faixa de reps|abaixo da faixa|consolidação/i;
