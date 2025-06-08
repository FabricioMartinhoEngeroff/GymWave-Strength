import styled from "styled-components";

// 🎯 Botão com responsividade para celular e bom feedback visual
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
    transform: scale(0.98); /* Feedback visual ao toque */
  }

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 14px; /* Mais área de toque */
  }
`;

interface ButtonProps {
  text: string;
}

export function Button({ text }: ButtonProps) {
  return <StyledButton>{text}</StyledButton>;
}
