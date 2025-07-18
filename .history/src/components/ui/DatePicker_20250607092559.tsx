import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";

const StyledPicker = styled(ReactDatePicker)`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #0066cc;
  font-size: 1rem;
  width: 100%;
`;

export const DatePicker = ({ selected, onChange }: { selected: Date; onChange: (date: Date) => void }) => (
  <StyledPicker selected={selected} onChange={onChange} dateFormat="dd/MM/yyyy" />
);