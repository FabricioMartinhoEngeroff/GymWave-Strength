import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { CustomInputWithIcon } from "./CustomInputWithIcon";

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
