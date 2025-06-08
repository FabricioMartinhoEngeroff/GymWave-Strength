import { Calendar } from "phosphor-react";
import styled from "styled-components";
import { forwardRef } from "react";
import { Input } from "../ui/Input";

const Wrapper = styled.div`
  position: relative;
  width: 100%;

  .calendar-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    pointer-events: none;
  }

  input {
    padding-right: 36px !important; // garante espaço para ícone
  }
`;

export const CustomInputWithIcon = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, onChange }, ref) => (
    <Wrapper>
      <Input
        type="text"
        value={value}
        onClick={onClick}
        onChange={onChange}
        ref={ref}
        placeholder="Data"
      />
      <Calendar size={20} className="calendar-icon" />
    </Wrapper>
  )
);
