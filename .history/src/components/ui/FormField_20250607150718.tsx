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
    background-color: transparent;
  }

  svg {
    flex-shrink: 0;
    color: #607d8b;
  }

  span {
    margin-left: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
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
  togglePasswordVisibility?: () => void;
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
  const inputType = isPasswordField && passwordVisible ? "text" : type;

  return (
    <div style={{ width: "100%", marginBottom: "8px" }}>
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
        {isPasswordField && togglePasswordVisibility && (
          <span onClick={togglePasswordVisibility}>
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        )}
      </InputField>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
