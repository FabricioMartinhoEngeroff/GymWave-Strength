import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { Calendar } from "phosphor-react";
import { forwardRef, ChangeEvent } from "react";

// --- Estilos do container externo com label flutuante ---
const Container = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 24px; /* espaçamento seguro abaixo */

  label {
    position: absolute;
    top: 2px;
    left: 12px;
    background: white;
    font-size: 12px;
    padding: 0 4px;
    color: #444;
    z-index: 1;
  }
`;

// --- Estilos do input e ícone ---
const InputWrapper = styled.div`

  .calendar-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: 12px;
    padding-right: 36px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
    font-size: 16px;
    color: #000;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus {
      border-color: #0066cc;
      box-shadow: 0 0 5px rgba(0, 102, 204, 0.3);
      background-color: #fff;
    }
  }
`;

// --- Input customizado para o ReactDatePicker ---
const CustomInputWithIcon = forwardRef<HTMLInputElement, {
  value?: string;
  onClick?: () => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}>(({ value, onClick, onChange }, ref) => (
  <InputWrapper>
    <input
      type="text"
      value={value}
      onClick={onClick}
      onChange={onChange}
      ref={ref}
      placeholder="Data"
      readOnly
    />
    <Calendar size={20} className="calendar-icon" />
  </InputWrapper>
));

CustomInputWithIcon.displayName = "CustomInputWithIcon";

// --- Componente principal ---
interface Props {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
}

export const DatePicker = ({ selected, onChange, label = "Data" }: Props) => (
  <Container>
    <label>{label}</label>
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      showPopperArrow={false}
      customInput={<CustomInputWithIcon />}
    />
  </Container>
);
