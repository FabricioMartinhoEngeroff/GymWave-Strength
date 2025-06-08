import { useState } from "react";
import { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styled from "styled-components";

// Campo de input visualmente mais moderno e com foco azul
const InputField = styled.div<{ $hasError: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid ${({ $hasError }) => ($hasError ? "#dc3545" : "#0066cc")};
  border-radius: 8px;
  padding: 10px 14px;
  background-color: #ffffff;
  transition: border-color 0.3s ease;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 16px;
    padding-left: 10px;
    background-color: transparent;
    color: #333;
  }

  svg {
    color: ${({ $hasError }) => ($hasError ? "#dc3545" : "#0066cc")};
    font-size: 18px;
    flex-shrink: 0;
  }
`;

const EyeButton = styled.span`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 18px;
  color: #0066cc;
  user-select: none;
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: #dc3545;
  margin-top: 4px;
  margin-left: 4px;
`;

export interface FormFieldProps {
  id: string;
  icon: IconType;
  type: string;
  placeholder: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;
  isPasswordField?: boolean;
  autocomplete?: string;
  togglePasswordVisibility?: () => void; // opcional caso seja controlado externamente
  passwordVisible?: boolean;
}

export function FormField({
  icon: Icon,
  type,
  placeholder,
  name,
  id,
  value,
  onChange,
  error,
  autocomplete = "off",
  isPasswordField = false,
  togglePasswordVisibility,
  passwordVisible,
}: FormFieldProps) {
  // Caso não receba controle externo, usa interno
  const [visible, setVisible] = useState(false);
  const isVisible = passwordVisible ?? visible;
  const toggle = togglePasswordVisibility || (() => setVisible(!visible));
  const inputType = isPasswordField && isVisible ? "text" : type;

  return (
    <div style={{ width: "100%", marginBottom: "12px" }}>
      <InputField $hasError={!!error}>
        <Icon />
        <input
          type={inputType}
          placeholder={placeholder}
          name={name}
          id={id}
          value={value || ""}
          onChange={onChange}
          autoComplete={autocomplete}
        />
        {isPasswordField && (
          <EyeButton onClick={toggle}>
            {isVisible ? <FaEyeSlash /> : <FaEye />}
          </EyeButton>
        )}
      </InputField>

      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
