import { useState, useEffect } from "react";
import { Login } from "./Login";
import { Register } from "./Register";
import { Container, LeftPanel, LogoText, RightPanel } from "../../styles/GlobalStyles";
import type { UseLoginForm } from "../../hooks/useLoginForm";

/**
 * Componente principal de autenticação.
 * Controla qual formulário exibir: login ou registro.
 */
export function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const handler = () => setIsRegistering((prev) => !prev);
    window.addEventListener("toggleRegister", handler);
    return () => window.removeEventListener("toggleRegister", handler);
  }, []);

  // Hook recebe a flag do parent
  const loginForm = useLoginForm(isRegistering);

  return (
    <Container>
      <LeftPanel>
        <LogoText>Bem-vindo</LogoText>
        <LogoText>Gym Wave Strength</LogoText>
      </LeftPanel>
      <RightPanel>
        {/* Renderiza formulário de login ou registro */}
        {isRegistering ? <Register {...loginForm} /> : <Login {...loginForm} />}
      </RightPanel>
    </Container>
  );
}
