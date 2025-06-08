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
  isMobile?: boolean;              // a prop que vem de fora ainda pode se chamar isMobile
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
      $isMobile={isMobile}       // ← repassamos para o styled como $isMobile
      style={styleProps}
    />
  );
}
