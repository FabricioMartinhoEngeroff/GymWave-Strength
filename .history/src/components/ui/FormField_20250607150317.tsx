import styled from "styled-components";
import { ChangeEvent } from "react";

interface StyledInputProps {
  $isMobile?: boolean;
}

const StyledInput = styled.input<StyledInputProps>`
  width: 100%;
  padding: ${({ $isMobile }) => ($isMobile ? "10px" : "12px")};
  margin-top: 8px;
  border: 1px solid #b0bec5; /* 🔵 tom mais suave que #ccc */
  border-radius: 6px;
  font-size: ${({ $isMobile }) => ($isMobile ? "15px" : "16px")};
  background-color: #fff;
  color: #000;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #2196f3; /* azul vibrante */
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); /* leve realce azul */
    background-color: #fff;
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
  styleProps,
}: InputProps) {
  return (
    <StyledInput
      type={type}
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      $isMobile={isMobile}
      style={styleProps}
    />
  );
}
