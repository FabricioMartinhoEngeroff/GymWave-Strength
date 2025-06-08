// Input.tsx
import styled from "styled-components";
import { ChangeEvent } from "react";

interface StyledInputProps {
  $isMobile?: boolean;   // ← aqui usamos $isMobile
}

const StyledInput = styled.input<StyledInputProps>`
  width: 100%;
  padding: ${({ $isMobile }) => ($isMobile ? "10px" : "12px")};
  font-size: ${({ $isMobile }) => ($isMobile ? "15px" : "16px")};
  /* ...outros estilos... */
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
