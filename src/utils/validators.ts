
// 🔁 Mensagens de erro reutilizáveis
const validationErrors = {
  required: "Este campo é obrigatório",
  invalidEmail: "Formato de e-mail inválido",
  invalidCPF: "CPF inválido. Deve conter 11 dígitos numéricos",
  invalidPhone: "Número de telefone inválido. Deve conter 10 ou 11 dígitos",
  passwordTooShort: "A senha deve ter no mínimo 8 caracteres",
  invalidPassword: "A senha deve conter letra, número e caractere especial",
};

// 🧪 Expressões regulares para validação
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cpfRegex = /^\d{11}$/;
const phoneRegex = /^\d{10,11}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;

/**
 * ✅ Valida um e-mail no formato padrão.
 * @param email string
 * @returns mensagem de erro ou null se válido
 */
export function validateEmail(email: string): string | null {
  if (!email) return validationErrors.required;
  if (!emailRegex.test(email)) return validationErrors.invalidEmail;
  return null;
}

/**
 * ✅ Valida um CPF (somente números, sem máscara).
 * @param cpf string
 * @returns mensagem de erro ou null se válido
 */
export function validateCPF(cpf: string): string | null {
  if (!cpf) return validationErrors.required;
  const numbers = cpf.replace(/\D/g, ""); // Remove pontos e traços
  if (!cpfRegex.test(numbers)) return validationErrors.invalidCPF;
  return null;
}

/**
 * ✅ Valida um número de telefone fixo ou celular (com ou sem máscara).
 * @param phone string
 * @returns mensagem de erro ou null se válido
 */
export function validatePhone(phone: string): string | null {
  if (!phone) return validationErrors.required;
  const numbers = phone.replace(/\D/g, ""); // Remove parênteses, espaços, traços etc.
  if (!phoneRegex.test(numbers)) return validationErrors.invalidPhone;
  return null;
}

/**
 * ✅ Valida uma senha com critérios mínimos de segurança:
 * - Pelo menos 8 caracteres
 * - Pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
 * @param password string
 * @returns mensagem de erro ou null se válido
 */
export function validatePassword(password: string): string | null {
  if (!password) return validationErrors.required;
  if (password.length < 8) return validationErrors.passwordTooShort;
  if (!passwordRegex.test(password)) return validationErrors.invalidPassword;
  return null;
}

/**
 * ✅ Valida se há campos vazios (inclusive objetos aninhados).
 * - Retorna a chave completa do primeiro campo vazio encontrado
 * - Ex: endereco.cidade - Este campo é obrigatório
 * @param fields qualquer objeto
 * @param parentKey usado internamente para montar caminho (não precisa passar)
 */
export function validateEmptyFields(fields: unknown, parentKey = ""): string | null {
  if (typeof fields !== "object" || fields === null) return null;

  for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      const nestedError = validateEmptyFields(value, fullKey);
      if (nestedError) return nestedError;
    } else if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return `${fullKey} - ${validationErrors.required}`;
    }
  }

  return null; // Nenhum campo vazio encontrado
}

/**
 * ✅ Valida apenas os campos obrigatórios para login (email e senha).
 * - Ignora campos como nome, CPF, telefone etc.
 * @param fields objeto contendo email e senha
 */
export function validateLoginFields(fields: Record<string, unknown>): string | null {
  if (!fields || typeof fields !== "object") return null;

  const requiredFields = ["email", "password"];

  for (const field of requiredFields) {
    const value = fields[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return `${field} - ${validationErrors.required}`;
    }
  }

  return null;
}
