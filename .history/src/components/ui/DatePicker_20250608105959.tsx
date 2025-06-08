import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { Calendar } from "phosphor-react";
import { Input } from "../ui/Input";

const Container = styled.div`
  position: relative;
  width: 100%;

  label {
    position: absolute;
    top: -8px;
    left: 12px;
    background: white;
    font-size: 12px;
    padding: 0 4px;
    color: #444;
    z-index: 1;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  input {
    padding-right: 36px !important; // espaço para o ícone
  }

  .calendar-icon {
    position: absolute;
    right: 10px;
    color: #888;
    pointer-events: none;
  }
`;

interface Props {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
}

export const DatePicker = ({ selected, onChange, label = "Data" }: Props) => (
  <Container>
    <label>{label}</label>
    <InputWrapper>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        showPopperArrow={false}
        customInput={<Input type="text" placeholder="Data" />}
      />
      <Calendar size={20} className="calendar-icon" />
    </InputWrapper>
  </Container>
);
