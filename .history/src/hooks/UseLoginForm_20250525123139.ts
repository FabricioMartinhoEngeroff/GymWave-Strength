import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/handleApiError";
import {
  validateEmail,
  validateCPF,
  validatePhone,
  validatePassword,
  validateEmptyFields,
} from "../utils/validators";
import type { FormData, FormErrors, Address } from "../types/Form";

// Mascara para telefone
const maskPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

// Mascara para CPF
const maskCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

/**
 * Hook de login/cadastro.
 * @param isRegistering - flag vinda do AuthPage para indicar modo registro.
 */
export function useLoginForm(isRegistering: boolean) {
  // Estado de visibilidade de senha
  const [passwordVisible, setPasswordVisible] = useState(false);
  // Estado de erros de validação
  const [errors, setErrors] = useState<FormErrors>({
    name: null,
    email: null,
    password: null,
    cpf: null,
    telefone: null,
    endereco: { rua: null, bairro: null, cidade: null, estado: null, cep: null },
  });

  const navigate = useNavigate();
  // Estado dos dados do formulário
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
    cpf: "",
    telefone: "",
    endereco: { rua: "", bairro: "", cidade: "", estado: "", cep: "" },
  });

  // Alterna visibilidade da senha
  const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);

  /**
   * Atualiza formData e valida campo individualmente.
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const formattedValue =
        name === "telefone" ? maskPhone(value) : name === "cpf" ? maskCPF(value) : value;

      // Atualiza objeto nested de endereço ou campo simples
      setFormData((prev) =>
        name.startsWith("endereco.")
          ? {
              ...prev,
              endereco: {
                ...prev.endereco,
                [name.split(".")[1]]: formattedValue,
              } as Address,
            }
          : { ...prev, [name]: formattedValue }
      );

      // Validação inline
      setErrors((prev) => {
        let error: string | null = null;
        if (name === "email") error = validateEmail(value);
        else if (name === "password") error = validatePassword(value);
        else if (name === "cpf") error = validateCPF(value.replace(/\D/g, ""));
        else if (name === "telefone") error = validatePhone(value.replace(/\D/g, ""));

        if (name.startsWith("endereco.")) {
          return {
            ...prev,
            endereco: {
              ...prev.endereco,
              [name.split(".")[1]]: error,
            } as Address,
          };
        }

        return { ...prev, [name]: error } as any;
      });
    },
    []
  );

  /**
   * Submete formulário, diferenciando login e registro.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Recupera usuário salvo (modo registro)
    const raw = localStorage.getItem("newUser");
    const savedUser = raw ? (JSON.parse(raw) as { email: string; password: string }) : null;

    try {
      if (!isRegistering) {
        // ─── LOGIN ───
        const isFixed =
          formData.email === "treino@gmail.com" && formData.password === "@Treino123";
        const isSaved =
          savedUser && formData.email === savedUser.email && formData.password === savedUser.password;

        if (isFixed || isSaved) {
          // Grava token e navega para área privada
          localStorage.setItem("token", "fake-token-hardcoded");
          navigate("/app");
          return;
        }

        // Erro de credenciais inválidas
        handleApiError(new Error("Credenciais inválidas"), "Email ou senha inválidos.");
        return;
      }

      // ─── REGISTRO ───
      const emptyError = validateEmptyFields(formData);
      if (emptyError) {
        handleApiError(new Error(emptyError), "Corrija os campos obrigatórios vazios.");
        return;
      }

      // Salva novo usuário e loga automaticamente
      localStorage.setItem(
        "newUser",
        JSON.stringify({ email: formData.email, password: formData.password })
      );
      // Auto-login após registro
      localStorage.setItem("token", "fake-token-hardcoded");
      navigate("/app");
    } catch (error) {
      // Erros inesperados
      handleApiError(error, "Ocorreu um erro ao processar sua solicitação.");
    }
  };

  return {
    formData,
    passwordVisible,
    togglePasswordVisibility,
    handleChange,
    handleSubmit,
    errors,
  };
}