import { FormEvent } from "react";
import { Button } from "../../components/loginComponents/Button";
import { FormField } from "../../components/loginComponents/FormField";
import {
  FaEnvelope,
  FaUser,
  FaIdCard,
  FaPhone,
  FaMapMarkerAlt,
  FaCity,
  FaGlobeAmericas,
  FaBuilding,
  FaLock,
} from "react-icons/fa";
import { RightPanel, LoginBox, FormContainer, Row, Footer } from "../../styles/GlobalStyles";
import type { FormData, FormErrors } from "../../types/Form";

// Props recebidas do hook useLoginForm (passagem pelo AuthPage)
interface RegisterProps {
  formData: FormData;                   // dados do formulário
  errors: FormErrors;                   // erros de validação
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // atualiza formData
  handleSubmit: (e: FormEvent) => Promise<void>;               // submit
}


/**
 * Componente de registro de novo usuário.
 * Recebe estado e funções via props do hook useLoginForm.
 */
export function Login({ formData, errors, handleChange, handleSubmit, passwordVisible, togglePasswordVisibility }: LoginProps) {
  return (
    <RightPanel>
      <LoginBox>
        <h2>Digite sua senha</h2>
        {/* Formulário de login chama handleSubmit vindo do hook */}
        <form onSubmit={handleSubmit}>
          <FormContainer>
            {/* Campo de email */}
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

            {/* Campo de senha, com toggle de visibilidade */}
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
              /* Passa função para alternar visibilidade quando o ícone for clicado */
              togglePasswordVisibility={togglePasswordVisibility}
            />
          </FormContainer>

          {/* Botão de login */}
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
}({ formData, errors, handleChange, handleSubmit }: RegisterProps) {
  return (
    <RightPanel>
      <LoginBox>
        <h2>Crie sua conta</h2>
        {/* Ao submeter, chama handleSubmit vindo do hook */}
        <form onSubmit={handleSubmit}>
          <FormContainer>
            <Row>
              {/* Nome completo */}
              <FormField
                id="name"
                icon={FaUser}
                type="text"
                placeholder="Nome completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              {/* E-mail */}
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
            </Row>
            <Row>
              {/* CPF */}
              <FormField
                id="cpf"
                icon={FaIdCard}
                type="text"
                placeholder="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                error={errors.cpf}
              />
              {/* Telefone */}
              <FormField
                id="telefone"
                icon={FaPhone}
                type="text"
                placeholder="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                error={errors.telefone}
              />
            </Row>
            <Row>
              {/* Rua */}
              <FormField
                id="endereco_rua"
                icon={FaMapMarkerAlt}
                type="text"
                placeholder="Rua"
                name="endereco.rua"
                value={formData.endereco.rua}
                onChange={handleChange}
                error={errors.endereco?.rua}
              />
              {/* Bairro */}
              <FormField
                id="endereco_bairro"
                icon={FaBuilding}
                type="text"
                placeholder="Bairro"
                name="endereco.bairro"
                value={formData.endereco.bairro}
                onChange={handleChange}
                error={errors.endereco?.bairro}
              />
            </Row>
            <Row>
              {/* Cidade */}
              <FormField
                id="endereco_cidade"
                icon={FaCity}
                type="text"
                placeholder="Cidade"
                name="endereco.cidade"
                value={formData.endereco.cidade}
                onChange={handleChange}
                error={errors.endereco?.cidade}
              />
              {/* Estado */}
              <FormField
                id="endereco_estado"
                icon={FaGlobeAmericas}
                type="text"
                placeholder="Estado"
                name="endereco.estado"
                value={formData.endereco.estado}
                onChange={handleChange}
                error={errors.endereco?.estado}
              />
            </Row>
            <Row>
              {/* CEP */}
              <FormField
                id="endereco_cep"
                icon={FaBuilding}
                type="text"
                placeholder="CEP"
                name="endereco.cep"
                value={formData.endereco.cep}
                onChange={handleChange}
                error={errors.endereco?.cep}
              />
              {/* Senha */}
              <FormField
                id="password"
                icon={FaLock}
                type="password"
                placeholder="Senha"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                isPasswordField
              />
            </Row>
          </FormContainer>

          {/* Botão de envio */}
          <Button text="Cadastrar" />
        </form>

        {/* Link para alternar para login, dispara evento global */}
        <Footer>
          <span onClick={() => window.dispatchEvent(new Event("toggleRegister"))}>
            Já possui uma conta? Faça login...
          </span>
        </Footer>
      </LoginBox>
    </RightPanel>
  );
}
