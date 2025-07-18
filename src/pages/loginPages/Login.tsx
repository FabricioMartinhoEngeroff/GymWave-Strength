import { FaEnvelope, FaLock } from "react-icons/fa";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import type { UseLoginFormReturn } from "../../hooks/useLoginForm";
import {
  Footer,
  FormContainer,
  LoginBox,
  RightPanel,
} from "../../styles/GlobalStyles";

/**
 * Props esperadas pelo componente de Login,
 * vindas do hook useLoginForm em AuthPage.
 */
export type LoginProps = UseLoginFormReturn;

/**
 * Componente de login de usuário.
 * Tudo chega via props (nenhum hook aqui dentro).
 */
export function Login({
  formData,
  errors,
  handleChange,
  handleSubmit,
  passwordVisible,
  togglePasswordVisibility,
}: LoginProps) {
  // Wrappando o handleSubmit para debug com console.log
  const wrappedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🖱️ Botão “Entrar” clicado. formData atual:", formData);
    handleSubmit(e);
  };

  return (
    <RightPanel>
      <LoginBox>
        <h2>Digite sua senha</h2>

        {/* O form chama wrappedSubmit em vez de handleSubmit diretamente */}
        <form onSubmit={wrappedSubmit}>
          <FormContainer>
            {/* Campo de e-mail */}
            <FormField
              id="email"
              icon={FaEnvelope}
              type="email"
              placeholder="E-mail"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            {/* Campo de senha com toggle de visibilidade */}
            <FormField
              id="password"
              icon={FaLock}
              type={passwordVisible ? "text" : "password"}
              placeholder="Senha"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              isPasswordField
              togglePasswordVisibility={togglePasswordVisibility}
            />
          </FormContainer>

          {/* Botão principal de login — agora com type="submit" */}
          <Button type="submit">Entrar</Button>
        </form>

        {/* Link que dispara o evento para trocar para o registro */}
        <Footer>
          <span style={{ color: "#333" }}>
            Ainda não tem conta?{" "}
            <a
              href="#"
              onClick={() => window.dispatchEvent(new Event("toggleRegister"))}
              style={{
                color: "#0066cc",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Cadastre-se aqui
            </a>
          </span>
        </Footer>
      </LoginBox>
    </RightPanel>
  );
}
