// DatePicker.tsx
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";

const StyledWrapper = styled.div`
  .custom-datepicker {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #0066cc;
    font-size: 1rem;
    width: 100%;
  }
`;

export const DatePicker = ({
  selected,
  onChange,
}: {
  selected: Date | null;
  onChange: (date: Date | null) => void;
}) => (
  <StyledWrapper>
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      className="custom-datepicker"
    />
  </StyledWrapper>
);
import styled from "styled-components";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
  fullWidth?: boolean;
}

const StyledButton = styled.button<ButtonProps>`
  padding: 12px;
  width: ${({ fullWidth }) => (fullWidth ? "100%" : "auto")};
  font-size: 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  background-color: ${({ variant }) => {
    switch (variant) {
      case "outline":
        return "transparent";
      case "danger":
        return "#dc3545";
      default:
        return "#0066cc";
    }
  }};
  color: ${({ variant }) => (variant === "outline" ? "#0066cc" : "white")};
  border: ${({ variant }) => (variant === "outline" ? "1px solid #0066cc" : "none")};

  &:hover {
    background-color: ${({ variant }) => {
      switch (variant) {
        case "danger":
          return "#b02a37";
        case "outline":
          return "#e6f0ff";
        default:
          return "#005bb5";
      }
    }};
  }
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};