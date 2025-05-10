import { useState, useEffect } from "react";
import { Login } from "./Login";
import { Register } from "./Register";
import {
  Container,
  LeftPanel,
  RightPanel,
  LogoText,
} from "../../styles/GlobalStyles";

export function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const handleToggleRegister = () => {
      setIsRegistering((prev) => !prev);
    };

    window.addEventListener("toggleRegister", handleToggleRegister);

    return () => {
      window.removeEventListener("toggleRegister", handleToggleRegister);
    };
  }, []);

  return (
    <Container>
      <LeftPanel>
        <LogoText>BMHE</LogoText>
        <LogoText>Analytics</LogoText>
        <h2>Seja bem-vindo!</h2>
        <p>Política de Privacidade</p>
      </LeftPanel>

      <RightPanel>
        <div>
          {isRegistering ? <Register /> : <Login />}
        </div>
      </RightPanel>
    </Container>
  );
}