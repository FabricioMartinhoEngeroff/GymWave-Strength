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
        <LogoText>Bem-vindo</LogoText>
         <LogoText>Gym Wave Strength</LogoText>
      
      </LeftPanel>

      <RightPanel>
        <div>
          {isRegistering ? <Register /> : <Login />}
        </div>
      </RightPanel>
    </Container>
  );
}