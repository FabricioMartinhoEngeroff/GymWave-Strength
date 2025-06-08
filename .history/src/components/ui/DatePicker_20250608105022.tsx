// DatePicker.tsx
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { Calendar } from "phosphor-react";

const DateContainer = styled.div`
  position: relative;
  width: 100%;
  font-family: 'Segoe UI', sans-serif;

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

  .custom-datepicker {
    width: 100%;
    padding: 10px 40px 10px 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 15px;
    outline: none;
    box-sizing: border-box;
  }

  .calendar-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
  }
`;

interface Props {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
}

export const DatePicker = ({ selected, onChange, label = "Data" }: Props) => (
  <DateContainer>
    <label>{label}</label>
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      className="custom-datepicker"
    />
    <Calendar size={20} weight="regular" className="calendar-icon" />
  </DateContainer>
);
