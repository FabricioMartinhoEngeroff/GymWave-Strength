/**
 * Mensagens de validação reutilizáveis no sistema
 */
const validationErrors = {
    required: "Este campo é obrigatório.",
    invalidEmail: "Email deve ser válido.",
    emailExists: "Este e-mail já está cadastrado.",
    invalidPassword:
      "A senha deve conter pelo menos 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.",
    passwordTooShort: "Senha deve ter pelo menos 8 caracteres.",
    invalidCPF: "CPF deve estar no formato XXX.XXX.XXX-XX.",
    invalidPhone: "Telefone deve estar no formato (XX) XXXXX-XXXX.",
    invalidCEP: "O CEP informado não é válido.",
    invalidState: "O estado informado não existe.",
    invalidCity: "A cidade informada não existe.",
    emptyFields: "Todos os campos devem ser preenchidos.",
    passwordMismatch: "As senhas não coincidem.",
  };
  
  export default validationErrors;