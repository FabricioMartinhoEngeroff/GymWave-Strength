
const validationErrors = {
  required: "Este campo é obrigatório",
  invalidEmail: "Formato de e-mail inválido",
  invalidCPF: "CPF inválido. Deve conter 11 dígitos numéricos",
  invalidPhone: "Número de telefone inválido. Deve conter 10 ou 11 dígitos",
  passwordTooShort: "A senha deve ter no mínimo 8 caracteres",
  invalidPassword: "A senha deve conter letra, número e caractere especial",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cpfRegex = /^\d{11}$/;
const phoneRegex = /^\d{10,11}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;


export function validateEmail(email: string): string | null {
  if (!email) return validationErrors.required;
  if (!emailRegex.test(email)) return validationErrors.invalidEmail;
  return null;
}


export function validateCPF(cpf: string): string | null {
  if (!cpf) return validationErrors.required;
  const numbers = cpf.replace(/\D/g, ""); // Remove pontos e traços
  if (!cpfRegex.test(numbers)) return validationErrors.invalidCPF;
  return null;
}


export function validatePhone(phone: string): string | null {
  if (!phone) return validationErrors.required;
  const numbers = phone.replace(/\D/g, ""); // Remove parênteses, espaços, traços etc.
  if (!phoneRegex.test(numbers)) return validationErrors.invalidPhone;
  return null;
}


export function validatePassword(password: string): string | null {
  if (!password) return validationErrors.required;
  if (password.length < 8) return validationErrors.passwordTooShort;
  if (!passwordRegex.test(password)) return validationErrors.invalidPassword;
  return null;
}


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

  return null; 
}


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
