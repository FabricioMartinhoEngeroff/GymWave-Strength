import { InputField, ErrorText } from "../../styles/GlobalStyles";
import { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

interface FormFieldProps {
  icon: IconType;
  type: string;
  placeholder: string;
  name: string;
  id: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;
  autocomplete?: string;
  isPasswordField?: boolean;
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
