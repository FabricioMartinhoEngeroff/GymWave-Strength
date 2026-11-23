import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import { logErro } from "../login/security/logger";
import { TelaErro } from "./TelaErro";

/** errorElement das rotas: o roteador captura o erro antes do ErrorBoundary da raiz. */
export function ErroDeRota() {
  const erro = useRouteError();
  useEffect(() => logErro("rota quebrou", erro), [erro]);
  return <TelaErro inteira />;
}
