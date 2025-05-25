import { useLoginForm } from "../../hooks/UseLoginForm";
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
import {
  RightPanel,
  LoginBox,
  FormContainer,
  Row,
  Footer,
} from "../../styles/GlobalStyles";

export function Register() {
  const { formData, handleChange, handleSubmit, errors } = useLoginForm();

  return (
    <RightPanel>
      <LoginBox>
        <h2>Create your account</h2>
        <form onSubmit={handleSubmit}>
          <FormContainer>
            <Row>
              <FormField
                id="name"
                icon={FaUser}
                type="text"
                placeholder="Nome completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors?.name}
              />
              <FormField
                id="email"
                icon={FaEnvelope}
                type="email"
                placeholder="E-mail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors?.email}
              />
            </Row>

            <Row>
              <FormField
                id="cpf"
                icon={FaIdCard}
                type="text"
                placeholder="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                error={errors?.cpf}
              />
              <FormField
                id="telefone"
                icon={FaPhone}
                type="text"
                placeholder="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                error={errors?.telefone}
              />
            </Row>

            <Row>
              <FormField
                id="endereco_rua"
                icon={FaMapMarkerAlt}
                type="text"
                placeholder="Rua"
                name="endereco.rua"
                value={formData.endereco.rua}
                onChange={handleChange}
                error={errors?.endereco?.rua}
              />
              <FormField
                id="endereco_bairro"
                icon={FaBuilding}
                type="text"
                placeholder="Bairro"
                name="endereco.bairro"
                value={formData.endereco.bairro}
                onChange={handleChange}
                error={errors?.endereco?.bairro}
              />
            </Row>

            <Row>
              <FormField
                id="endereco_cidade"
                icon={FaCity}
                type="text"
                placeholder="Cidade"
                name="endereco.cidade"
                value={formData.endereco.cidade}
                onChange={handleChange}
                error={errors?.endereco?.cidade}
              />
              <FormField
                id="endereco_estado"
                icon={FaGlobeAmericas}
                type="text"
                placeholder="Estado"
                name="endereco.estado"
                value={formData.endereco.estado}
                onChange={handleChange}
                error={errors?.endereco?.estado}
              />
            </Row>

            <Row>
              <FormField
                id="endereco_cep"
                icon={FaBuilding}
                type="text"
                placeholder="CEP"
                name="endereco.cep"
                value={formData.endereco.cep}
                onChange={handleChange}
                error={errors?.endereco?.cep}
              />
              <FormField
                id="password"
                icon={FaLock}
                type="password"
                placeholder="Senha"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors?.password}
                isPasswordField
              />
            </Row>
          </FormContainer>

          <Button text="Cadastrar" />
        </form>

        <Footer>
          <span
            onClick={() => window.dispatchEvent(new Event("toggleRegister"))}
          >
            Already have an account? Log in…
          </span>
        </Footer>
      </LoginBox>
    </RightPanel>
  );
}