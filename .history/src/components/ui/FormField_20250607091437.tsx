import { useState } from "react";
import { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styled from "styled-components";

const InputField = styled.div<{ $hasError: boolean }>`
  display: flex;
  align-items: center;
  border: 1px solid ${({ $hasError }) => ($hasError ? "#dc3545" : "#ccc")};
  border-radius: 6px;
  padding: 8px 12px;
  background-color: #fff;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 16px;
    padding-left: 8px;
  }
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: #dc3545;
  margin-top: 4px;
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
}: FormFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  return (
    <div style={{ width: "100%", marginBottom: "8px" }}>
      <InputField $hasError={!!error}>
        <Icon />
        <input
          type={isPasswordField && passwordVisible ? "text" : type}
          placeholder={placeholder}
          name={name}
          id={id}
          value={value || ""}
          onChange={onChange}
          autoComplete={autocomplete}
        />
        {isPasswordField && (
          <span onClick={togglePasswordVisibility} style={{ cursor: "pointer" }}>
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        )}
      </InputField>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
