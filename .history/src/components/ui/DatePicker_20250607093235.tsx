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

export const DatePicker = ({
  selected,
  onChange,
}: {
  selected: Date | null;
  onChange: (date: Date | null) => void;
}) => (
  <StyledPicker
    selected={selected}
    onChange={(date: Date | Date[] | null) => {
      if (Array.isArray(date)) {
        onChange(date[0] ?? null);
      } else {
        onChange(date);
      }
    }}
    dateFormat="dd/MM/yyyy"
  />
);