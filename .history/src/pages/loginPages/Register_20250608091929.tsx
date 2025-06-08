import {
  FaBuilding,
  FaCity,
  FaEnvelope,
  FaGlobeAmericas,
  FaIdCard,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
} from "react-icons/fa";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import type { UseLoginFormReturn } from "../../hooks/useLoginForm";
import {
  Footer,
  FormContainer,
  LoginBox,
  RightPanel,
  Row,
} from "../../styles/GlobalStyles";

/** 
 * Só usamos do hook:
 * - formData, errors, handleChange, handleSubmit
 */
export type RegisterProps = Omit<
  UseLoginFormReturn,
  "passwordVisible" | "togglePasswordVisibility"
>;

/**
 * Componente de registro de novo usuário.
 * Recebe estado e funções via props do hook useLoginForm.
 */
export function Register({
  formData,
  errors,
  handleChange,
  handleSubmit,
}: RegisterProps) {
  return (
    <RightPanel>
      <LoginBox>
        <h2>Crie sua conta</h2>

        {/* Quando submeter, chama handleSubmit passado por props */}
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
          <Button>Cadastrar</Button>
        </form>

        {/* Link para voltar ao login */}
        <Footer>
          <span
            onClick={() => window.dispatchEvent(new Event("toggleRegister"))}
            style={{ cursor: "pointer", color: "#0066cc" }}
          >
            Já possui uma conta? Faça login...
          </span>
        </Footer>
      </LoginBox>
    </RightPanel>
  );
}
