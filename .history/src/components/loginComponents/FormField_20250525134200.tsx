// src/components/loginComponents/FormField.tsx

import { InputField, ErrorText } from "../../styles/GlobalStyles";
import type { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

export interface FormFieldProps {
  id: string;
  icon: IconType;
  type: string;
  placeholder: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;

  // Nova prop para controlar autocomplete
  autoComplete?: string;

  // Props de campo de senha
  isPasswordField?: boolean;
  togglePasswordVisibility?: () => void;
}

export function FormField({
  id,
  icon: Icon,
  type,
  placeholder,
  name,
  value,
  onChange,
  error = null,

  // recebe a prop de autocomplete, com default "off"
  autoComplete = "off",

  // props para password toggle
  isPasswordField = false,
  togglePasswordVisibility,
}: FormFieldProps) {
  const [passwordVisibleInternal, setPasswordVisibleInternal] = useState(false);

  const showEye =
    isPasswordField &&
    typeof togglePasswordVisibility !== "function";

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <InputField
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}      {/* aplica aqui */}
      />
      <Icon
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      {isPasswordField && (
        <span
          onClick={togglePasswordVisibility}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
          }}
        >
          {passwordVisibleInternal ? <FaEyeSlash /> : <FaEye />}
        </span>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
