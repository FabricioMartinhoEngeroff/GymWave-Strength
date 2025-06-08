import styled from "styled-components";
import { ChangeEvent } from "react";

interface StyledInputProps {
  isMobile?: boolean;
}

// 🔧 Estilo responsivo e acessível para o input
const StyledInput = styled.input<StyledInputProps>`
 width: 100%;
  padding: ${({ isMobile }) => (isMobile ? "10px" : "12px")};
  margin-top: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: ${({ isMobile }) => (isMobile ? "15px" : "16px")};
  background-color: ${({ isMobile }) => (isMobile ? "#222" : "#fff")};
  color: ${({ isMobile }) => (isMobile ? "#fff" : "#000")};
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: 0 0 5px rgba(0, 102, 204, 0.3);
  }

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 10px;
  }
`;

interface InputProps {
  type: string;
  placeholder: string;
  name?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  isMobile?: boolean;
  styleProps?: React.CSSProperties;
}

export function Input({
  type,
  placeholder,
  name,
  value,
  onChange,
  isMobile = false,
  styleProps
}: InputProps) {
  return (
    <StyledInput
      type={type}
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      isMobile={isMobile}
       style={styleProps}
    />
  );
}
