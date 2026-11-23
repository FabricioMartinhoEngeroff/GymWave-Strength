import { Component, type ReactNode } from "react";
import { logErro } from "../login/security/logger";
import { TelaErro } from "./TelaErro";

interface Props {
  children: ReactNode;
}

/** Se algo abaixo quebrar, mostra a tela amigável. Trocar a `key` recupera. */
export class ErrorBoundary extends Component<Props, { quebrou: boolean }> {
  state = { quebrou: false };

  static getDerivedStateFromError() {
    return { quebrou: true };
  }

  componentDidCatch(erro: unknown) {
    logErro("tela quebrou", erro);
  }

  render() {
    return this.state.quebrou ? <TelaErro /> : this.props.children;
  }
}
