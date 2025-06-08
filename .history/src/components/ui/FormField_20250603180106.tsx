import { useState } from "react";
import { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ErrorText, InputField } from "../../utils/GlobalStyles";

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
  togglePasswordVisibility?: () => void;
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

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        marginBottom: "8px",
      }}
    >
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
          <span
            onClick={togglePasswordVisibility}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: "18px",
              color: "#0066cc",
              userSelect: "none",
            }}
          >
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        )}
      </InputField>

      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
