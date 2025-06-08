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

// ─── Máscaras para inputs ────────────────────────────────────────────────────
const maskPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const maskCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(
    9,
    11
  )}`;
};

// ─── Hook de login / registro ────────────────────────────────────────────────
/**
 * useLoginForm
 * @param isRegistering true = modo registro, false = modo login
 */
export function useLoginForm(isRegistering: boolean) {
  const navigate = useNavigate();

  // controle de visibilidade do campo senha
  const [passwordVisible, setPasswordVisible] = useState(false);

  // estado de erros de validação de cada campo
  const [errors, setErrors] = useState<FormErrors>({
    name: null,
    email: null,
    password: null,
    cpf: null,
    telefone: null,
    endereco: { rua: null, bairro: null, cidade: null, estado: null, cep: null },
  });

  // estado dos dados do formulário
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
    cpf: "",
    telefone: "",
    endereco: { rua: "", bairro: "", cidade: "", estado: "", cep: "" },
  });

  // alterna visibilidade de senha
  const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);

  // atualiza campos e valida inline
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const formatted =
        name === "telefone"
          ? maskPhone(value)
          : name === "cpf"
          ? maskCPF(value)
          : value;

      // atualiza formData
      setFormData((prev) =>
        name.startsWith("endereco.")
          ? {
              ...prev,
              endereco: {
                ...prev.endereco,
                [name.split(".")[1]]: formatted,
              } as Address,
            }
          : { ...prev, [name]: formatted },
      );

      // validação inline
      setErrors((prev) => {
        let err: string | null = null;
        if (name === "email") err = validateEmail(value);
        else if (name === "password") err = validatePassword(value);
        else if (name === "cpf") err = validateCPF(value.replace(/\D/g, ""));
        else if (name === "telefone") err = validatePhone(value.replace(/\D/g, ""));

        if (name.startsWith("endereco.")) {
          return {
            ...prev,
            endereco: {
              ...prev.endereco,
              [name.split(".")[1]]: err,
            } as Address,
          };
        }
        return { ...prev, [name]: err } as FormErrors;
      });
    },
    [],
  );

  // submete formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ► LOG PARA SABER QUE O SUBMIT FOI CHAMADO
    console.log("▶️ handleSubmit chamado. formData:", formData, "isRegistering:", isRegistering);

    // tenta ler user cadastrado anteriormente
    const raw = localStorage.getItem("newUser");
    const savedUser = raw
      ? (JSON.parse(raw) as { email: string; password: string })
      : null;

    try {
      if (!isRegistering) {
        // ─── LOGIN ───
        const okFixed =
          formData.email === "treino@gmail.com" && formData.password === "@Treino123";
        const okSaved =
          savedUser &&
          formData.email === savedUser.email &&
          formData.password === savedUser.password;

        if (okFixed || okSaved) {
          localStorage.setItem("token", "fake-token-hardcoded");
          navigate("/app");
          return;
        }
        handleApiError(new Error("Credenciais inválidas"), "Email ou senha inválidos.");
        return;
      }

      // ─── REGISTRO ───
      const empty = validateEmptyFields(formData);
      if (empty) {
        handleApiError(new Error(empty), "Corrija os campos obrigatórios vazios.");
        return;
      }

      // grava novo user e faz auto-login
      localStorage.setItem(
        "newUser",
        JSON.stringify({ email: formData.email, password: formData.password })
      );
      localStorage.setItem("token", "fake-token-hardcoded");
      navigate("/app");
    } catch (error) {
      handleApiError(error, "Ocorreu um erro ao processar sua solicitação.");
    }
  };

  return {
    formData,
    errors,
    handleChange,
    handleSubmit,
    passwordVisible,
    togglePasswordVisibility,
  };
}

// exporta o type de retorno, para derivar props em Login/Register
export type UseLoginFormReturn = ReturnType<typeof useLoginForm>;
