import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/login/context/AuthProvider";
import { createAuthGateway } from "./components/login/gateway/createAuthGateway";
import { logErro } from "./components/login/security/logger";
import { CentralDeMensagens } from "./components/mensagens/CentralDeMensagens";
import { ErrorBoundary } from "./components/mensagens/ErrorBoundary";
import { TelaErro } from "./components/mensagens/TelaErro";
import { instalarCapturaGlobal } from "./components/mensagens/capturaGlobal";
import "./index.css";
import { router } from "./router/RouterTEMP";
import { GlobalStyles } from "./styles/GlobalStyles";

const raiz = createRoot(document.getElementById("root")!);

async function bootstrap() {
  // D9: em produção sem config do Firebase isto lança, e o app não inicia.
  const gateway = await createAuthGateway(import.meta.env);

  raiz.render(
    <StrictMode>
      <GlobalStyles />
      <ErrorBoundary>
        <AuthProvider gateway={gateway}>
          <RouterProvider router={router} />
        </AuthProvider>
      </ErrorBoundary>
      <CentralDeMensagens />
    </StrictMode>
  );
}

instalarCapturaGlobal();

bootstrap().catch((erro) => {
  logErro("inicialização", erro);
  raiz.render(<TelaErro inteira />);
});
