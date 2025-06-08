import React from "react";
import styled from "styled-components";

const StyledButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #0066cc;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  margin-top: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;

  &:hover {
    background-color: #005bb5;
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 14px;
  }
`;

interface ButtonProps {
  text: string;

  onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
}

export function Button({ text, onClick, type = "button", disabled = false }: ButtonProps) {
  return (
    <StyledButton onClick={onClick} type={type} disabled={disabled}>
      {text}
    </StyledButton>
  );
}
