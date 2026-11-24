import { screen, fireEvent, within } from "@testing-library/react";

/** Marca o esforço de toda série na tela que ainda não tem (obrigatório: EF_02 RG27). */
export function marcarEsforco(rotulo = "RPE 7") {
  for (const grupo of screen.queryAllByLabelText(/^Esforço /)) {
    if (!grupo.querySelector("[aria-pressed='true']")) fireEvent.click(within(grupo).getByLabelText(rotulo));
  }
}
