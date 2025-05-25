import { useState, useEffect } from "react";
import { Login } from "./Login";
import { Register } from "./Register";
// Update the import path if the file is located elsewhere, for example:
import { Container, LeftPanel, LogoText, RightPanel } from "../../styles/GlobalStyles";
// import { useLoginForm } from "../hooks/useLoginForm";
// Update the import path below if the hook is located elsewhere:
import { useLoginForm } from "../../hooks/useLoginForm";


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
