import type { ChangeEvent, FormEvent } from "react";
import type { FormData, FormErrors } from "../../types/Form";
import { Button } from "../../components/loginComponents/Button";
import { FormField } from "../../components/loginComponents/FormField";
import { FaEnvelope, FaLock } from "react-icons/fa";
import {
  RightPanel,
  LoginBox,
  FormContainer,
  Footer,
} from "../../styles/GlobalStyles";

/**
 * Props esperadas pelo componente de Login,
 * vindas do hook useLoginForm em AuthPage.
 */
export interface LoginProps {
  formData: FormData;                                       // dados atuais do formulário
  errors: FormErrors;                                       // mensagens de erro por campo
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void; // atualiza formData
  handleSubmit: (e: FormEvent) => Promise<void>;           // submete o formulário
  passwordVisible: boolean;                                 // estado de visibilidade da senha
  togglePasswordVisibility: () => void;                     // alterna visibilidade da senha
}

/**
 * Componente de login de usuário.
 * Uso mínimo de lógica interna: tudo é passado via props.
 */
export function Login({
  formData,
  errors,
  handleChange,
  handleSubmit,
  passwordVisible,
  togglePasswordVisibility,
}: LoginProps) {
  return (
    <RightPanel>
      <LoginBox>
        <h2>Digite sua senha</h2>

        {/* Ao submeter, chama handleSubmit vindo de AuthPage */}
        <form onSubmit={handleSubmit}>
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

          {/* Botão principal de login */}
          <Button text="Entrar" />
        </form>

        {/* Link para alternar para registro */}
        <Footer>
          <span style={{ color: "#333" }}>
            Ainda não tem conta?&nbsp;
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
