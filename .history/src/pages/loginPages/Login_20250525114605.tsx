import { useLoginForm } from "../../hooks/UseLoginForm";
import { Button } from "../../components/loginComponents/Button";
import { FormField } from "../../components/loginComponents/FormField";
import { FaEnvelope, FaLock } from "react-icons/fa";
import {
  RightPanel,
  LoginBox,
  FormContainer,
  Footer,
} from "../../styles/GlobalStyles";

export function Login() {
  const {
    formData,
    handleChange,
    handleSubmit,
    errors,
  } = useLoginForm();

  return (
    <RightPanel>
      <LoginBox>
        <h2>Digite sua senha</h2>
        <form onSubmit={handleSubmit}>
          <FormContainer>
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

            <FormField
              id="password"
              icon={FaLock}
              type="password"
              placeholder="Senha"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              isPasswordField={true} 
            />
          </FormContainer>

          <Button text="Entrar" />
        </form>

           <Footer>
-        <span
-         onClick={() => window.dispatchEvent(new Event("toggleRegister"))}
-         style={{ marginLeft: "5px", color: "#0066cc", cursor: "pointer" }}
-     >
-        Já possui uma conta? Faça login...
-       </span>
+        <span
+          onClick={() => window.dispatchEvent(new Event("toggleRegister"))}
+          style={{ marginLeft: "5px", color: "#0066cc", cursor: "pointer" }}
+        >
+          Ainda não tem conta? <strong>Cadastre-se</strong>
+       </span>
       </Footer>
