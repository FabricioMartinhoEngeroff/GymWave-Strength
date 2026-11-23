import { render, screen, fireEvent, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { CentralDeMensagens } from "../../../components/mensagens/CentralDeMensagens";

/** Renderiza a tela com a central de mensagens, como no app. */
export function renderComMensagens(ui: ReactElement) {
  return render(<>{ui}<CentralDeMensagens /></>);
}

export const dialogo = () => screen.queryByRole("alertdialog");

/** Toca em um botão do diálogo aberto. */
export function noDialogo(botao: string) {
  fireEvent.click(within(screen.getByRole("alertdialog")).getByText(botao));
}
